var parser = document.createElement('a');
var remove_sub_domain=function(v){
    var is_co=v.match(/\.co\./)
    v=v.split('.')
    v=v.slice(is_co ? -3: -2)
    v=v.join('.')
    console.log(v)
    return v
}

chrome.cookies.set=(function(org,options){
    chrome.tabs.getSelected(function(tab){
        var cookie1,cookie2
        parser.href=tab.url
        cookie1=parser.host
        parser.href=options.url
        cookie2=parser.host
        cookie1=remove_sub_domain(cookie1)
        cookie2=remove_sub_domain(cookie2)
        localStorage['active for:' + cookie1]=localStorage.data_activeSession

        if(cookie1==cookie2){
            org.call(this,options)            
        }
    })
}).bind(chrome.cookies,chrome.cookies.set);

chrome.cookies.remove=(function(org,options){
    chrome.tabs.getSelected(function(tab){
            var cookie1,cookie2
            parser.href=tab.url
            cookie1=parser.host
            parser.href=options.url
            cookie2=parser.host
            cookie1=remove_sub_domain(cookie1)
            cookie2=remove_sub_domain(cookie2)

            localStorage['active for:' + cookie1]=localStorage.data_activeSession
            if(cookie1==cookie2){
                org.call(this,options)            
            }
        })
    localStorage['active for:' + cookie1]=localStorage.data_activeSession
}).bind(chrome.cookies,chrome.cookies.remove);

chrome.cookies.getAll=(function(org,options,callback){
    chrome.tabs.getSelected(function(tab){
        options.url=tab.url
        cookie1=parser.host
        parser.href=options.url
        cookie1=remove_sub_domain(cookie1)
        localStorage['active for:' + cookie1]=localStorage.data_activeSession
        org.call(this,options,callback)
    })
    // org.call(this,options,callback)
}).bind(chrome.cookies,chrome.cookies.getAll);

function restoreSession(index, callback) {
    var newActive, oldActive;
    var cookiesToRestore;

    if( index >= 0 && index < sessions.length ) {
        newActive = index;
        cookiesToRestore = sessions[index].cookies;
    //sessions[index].lastUsed =  sessions[activeSession].lastUsed;
    } else {
        console.error("Index out of bounds! -> " + index);
        $("#loading").hide();
        return;
    }
	
    if(newActive == activeSession) {
        console.log("Profile not changed! - " + sessions[index].name);
        callback();
        //return;
    }
	
    chrome.cookies.getAll({}, function(cks) {
        sessions[activeSession].cookies = cks;                              //Save current session
        ls.set("data_sessions", sessions);

        console.log("Active session: " + newActive);                        //Change active profile
        oldActive = activeSession;
        activeSession = newActive;
        ls.set("data_activeSession", activeSession);
		
        switchProfile(cookiesToRestore, callback, oldActive);               //Perform Switch
    });
}

function switchProfile(cookiesToRestore, callback, callbackParam) {
    var connectToID = (isInstalledETC && integrateETC) ? editThisCookieID : swapMyCookiesID;
    console.log("connectToID: " + connectToID + " | isInstalledETC: " + isInstalledETC + " | integrateETC: " + integrateETC);
    
	if(!isInstalledETC || !integrateETC) {
		chrome.cookies.getAll({}, function(cks) {
			console.log("Deleting...");
			deleteCookies(cks);
			if(cookiesToRestore != undefined && cookiesToRestore != null) {
				console.log("Restoring...");
				restoreCookies(cookiesToRestore);
			}
			if(callback != undefined && callback != null) {
				console.log("Calling callback...");
				callback(callbackParam);
			}
		});
	} else {	
		var port = chrome.extension.connect(connectToID, {
			"name":"Swap My Cookies"
		});
		port.postMessage({
			"action": "pause"
		});
		console.log("Sending message...");
		port.onMessage.addListener(function(response) {
			console.log("Processing response...");
			if(response.pause != undefined) {
				if(!!response.pause) {
					chrome.cookies.getAll({}, function(cks) {
						console.log("Deleting...");
						deleteCookies(cks);
						if(cookiesToRestore != undefined && cookiesToRestore != null) {
							console.log("Restoring...");
							restoreCookies(cookiesToRestore);
						}
						port.postMessage({
							"action": "resume"
						});
					});
				} else {
					//Error pausing
					console.error("Error pausing");
				}
			} else if(response.resume != undefined) {
				if(!!response.resume) {
					if(callback != undefined && callback != null) {
						console.log("Calling callback...");
						callback(callbackParam);
					}
				} else {
					//Error resuming
					console.error("Error resuming");
				}
			}
		});
	}
    return;
}

function deleteCookies(cks) {
    console.log("Deleting " + cks.length + " cookies...");
    for(var i=0; i<cks.length; i++) {
    	try {
            var curr = cks[i];
            var url = ((curr.secure) ? "https://" : "http://") + curr.domain + curr.path;
            deleteCookie(url, curr.name, curr.storeId);
        } catch(err) {
                console.error("Error catched deleting cookie:\n" + err.description);
        }
    }
}

function deleteCookie(url, name, storeId) {
    //If no real url is available use: "https://" : "http://" + domain + path
    chrome.cookies.remove({
        "url": 				url,
        "name": 			name,
        "storeId":			storeId
    });
}

function restoreCookies(cks) {
    for(var i=0; i<cks.length; i++) {
    	try {
            var current = cks[i];
            var newCookie = {};
            newCookie.url = ((newCookie.secure) ? "https://" : "http://") + current.domain;
            newCookie.name = current.name;
            newCookie.storeId = current.storeId;
            newCookie.value = current.value;
            if(!current.hostOnly)
                newCookie.domain = current.domain;
            newCookie.path = current.path;
            newCookie.secure = current.secure;
            newCookie.httpOnly = current.httpOnly;
            if(!current.session)
                newCookie.expirationDate = current.expirationDate;
            chrome.cookies.set(newCookie);
        } catch(err) {
                console.error("Error catched restoring cookie:\n" + err.description);
        }
    }
}

var reloadFunction = function(tab) {
    alert('reload:' + tab.url);
    if(tab.url.indexOf("https://chrome.google") == 0 || tab.url.indexOf("http://chrome.google") == 0 || tab.url.indexOf("chrome://") == 0 ) {
        if(tab.url.indexOf("profileChooser.html") >= 0)
            return;
        chrome.tabs.update(tab.id,{
            "url":tab.url,
            "selected":tab.selected
        });
        //window.close();
    }
    else {
        chrome.tabs.executeScript(tab.id, {
            code: 'window.location.reload(true)'
        }, function(){
            //window.close();
        });
    }
};

function updateTabs() {
    console.log("Updating Tabs...");
    triggerUpdateData();
    //console.log("refreshSettings = " + refreshSettings);
    if(refreshSettings == 0) { //No Update - Reload popup
        //window.close();
        return;
    } else if(refreshSettings == 1) { //Update Active tab
        chrome.tabs.getSelected(null, function(tab) {
            reloadFunction(tab);
            return;
        });
    } else if(refreshSettings == 2) { //Update All tabs
        chrome.windows.getCurrent(function(window){
            forEveryTab(window, reloadFunction);
        });
    } else if(refreshSettings == 3) { //Update All tabs in all windows
        forEveryTab(reloadFunction);
    } else
        forEveryTab(updateData);
}

function stringifyDateDifference(dateDifferenceObj) {
    if(dateDifferenceObj.valid == false)
        return "Never";
    var years = dateDifferenceObj.years;
    var months = dateDifferenceObj.months;
    var days = dateDifferenceObj.days;
    var hours = dateDifferenceObj.hours;
    var minutes = dateDifferenceObj.minutes;
    var seconds = dateDifferenceObj.seconds;
    var differenceString = "";
    if(!!years)
        differenceString = years   + " year"    + ((years > 1)  ? "s" : "") + " ";
    else if(!!months)
        differenceString = months  + " month"   + ((months > 1) ? "s" : "") + " ";
    else if(!!days)
        differenceString = days    + " day"     + ((days > 1)   ? "s" : "") + " ";
    else if(!!hours)
        differenceString = hours + "h";
    else if(!!minutes)
        differenceString = minutes + "min";
    else
        differenceString = ((seconds) ? seconds : "1") + "sec";
    return differenceString;
}

/*
 * Callback can refer to the tab element using a parameter 'tab'
 */
function forEveryTab(args1, args2) {
    var window = (args2 == undefined) ? null : args1;
    var callback = (args2 == undefined) ? args1 : args2;
    
    chrome.windows.getAll(
        {
            populate: true
        },
        function(windows){
            for(var i=0; i<windows.length; i++) {
                var currentWindow = windows[i];
                if(window == null || window.id == currentWindow.id) {
                    var tabs = currentWindow.tabs;
                    for(var x=0; x<tabs.length; x++) {
                        var currentTab = tabs[x];
                        callback(currentTab);
                    }
                    if(window != null)
                        break;
                }
            }
        }
    );
}

var _gaq = _gaq || [];
function googleStats(){
    _gaq.push(['_setAccount', 'UA-18085343-3']);
    _gaq.push(['_trackPageview']);
    (function() {
        var ga = document.createElement('script');
        ga.type = 'text/javascript';
        ga.async = true;
        ga.src = 'https://ssl.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(ga, s);
    })();
}
