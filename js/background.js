var original_updateData = updateData;
updateData = function() {
	var shortcuts = activateShortcuts;
	original_updateData();
	if(!shortcuts && activateShortcuts)
		startInjection();
	loadSettings();
};

function loadSettings() {
	var color, text;
	if(isInstalledETC && integrateETC)
		color = [0, 224, 0, 255];
	else
		color = [255, 0, 0, 255];
	if(showProfileNumber)
		text = (parseInt(activeSession)+1).toString();
	else
		text = "";
	chrome.browserAction.setBadgeBackgroundColor({
		color: color
	});
	chrome.browserAction.setBadgeText({
		text: text
	});
	chrome.browserAction.setTitle({
		title: sessions[activeSession].name
	});
}

function listenConnections(port) {
	console.assert(port.sender.id == editThisCookieID || port.sender.id == swapMyCookiesID || port.sender.id == forgetMeID);
	port.onMessage.addListener(function(request) {
		if (request.action != undefined) {
			if(request.action == "pause")
				port.postMessage({
					"pause": true
				});
			else if(request.action == "resume")
				port.postMessage({
					"resume": true
				});
			else
				console.log("ACTION: " + request.action + ", IS UNKNOWN!");
		} else
			console.log("ACTION CANNOT BE UNDEFINED!");
	});
}

function listenRequests(request, sender, sendResponse) {
	console.log("I received a message!");
	console.assert(sender.id == editThisCookieID || sender.id == swapMyCookiesID || sender.id == forgetMeID);
	if(request.action != undefined) {
		if(request.action == "ping") {
			console.log("I was pinged");
			sendResponse({});
		} else if(request.action == "switchProfile") {
			console.log("Gotta switch profile...");
			var index = activeSession;
			if(request.switchTo != undefined) {
				index = request.switchTo;
			} else if(request.step != undefined) {
				index =  (index + request.step) % sessions.length;
				if(index < 0)
					index = sessions.length + index;
			} else {
				console.error("I have to switch but don't know how");
				return;
			}
			restoreSession(index, function() {
				updateTabs();
				sendResponse({"switched":true});
			});
		} else if(request.action == "getProfiles") {
			//console.log("I'll tell you everything!");
			var profiles = new Array();
			for (i=0;i<sessions.length;i++) {
				profiles[i] = sessions[i].name;
			}
			sendResponse({"profiles":profiles, "activeSession":activeSession});
		} else
			console.error("Unknown request:" + request.toString());
	}
}

function checkETCinstalled() {
//	console.log("check ETC status...");
	isInstalledETC = false;
	ls.set("status_isInstalledETC", isInstalledETC);
	chrome.extension.sendRequest(editThisCookieID, {
		"action": "ping"
	},
	function(response) {
		if(chrome.extension.lastError != undefined) {
//			console.log("ETC is not installed!");
			isInstalledETC = false;
		} else {
//			console.log("ETC is installed!");
			isInstalledETC = true;
		}
		ls.set("status_isInstalledETC", isInstalledETC);
//		status_isInstalledETC();
		return;
	});
}

function startInjection() {
	var injection = function(currentTab) {
		if(activateShortcuts == false) //activateShortcuts can be changed in options page...it's a dirty workaround not to remove event listeners
			return;
		if(currentTab.url.indexOf("https://chrome.google") == 0 || currentTab.url.indexOf("http://chrome.google") == 0 || currentTab.url.indexOf("chrome") == 0 || currentTab.url.indexOf("about:") == 0 || currentTab.url.length == 0)
			return;
		try {
			chrome.tabs.executeScript(currentTab.id, {
				file: "js/shortcuts_injected.js"
			});
		} catch(e) {
			console.error(err);
			console.error(err.message);
		}
	}
	forEveryTab(injection);
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		injection(tab);
	});
	chrome.tabs.onCreated.addListener(function(tab) {
		injection(tab);
	});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


loadSettings();

//setTimeout(checkETCinstalled,1);
//checkETCinstalled();
//setInterval( "checkETCinstalled()", 1000 * 180);

chrome.extension.onConnect.addListener(
	function(port){
		listenConnections(port);
	}
);
	
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		listenRequests(request, sender, sendResponse)
	}
);
	

if(firstRun) {
	chrome.tabs.create({url:chrome.extension.getURL('options.html')});
	// chrome.tabs.create({url:chrome.extension.getURL('welcome/welcome.html'), selected: true}); //SELECTED
} else {
	if(showVersionChanges && justUpdated) {
		chrome.tabs.create({url:chrome.extension.getURL('changelog.html')});
	}
	if(showProfileChooser) {
		var createProperties = {
			"windowId": window.id, 
			"url":	  chrome.extension.getURL('profileChooser.html'), 
			"selected": true
		};
		chrome.tabs.create(createProperties);
	}
}


if(activateShortcuts)
	startInjection();

chrome.windows.onCreated.addListener(function(window) {
	if(showProfileChooser && window.type=="normal") {
		var nNormalWindows = 0;
		chrome.windows.getAll({"populate":false}, function(windows) {
			for(var i=0; i<windows.length; i++) {
				if(windows[i].type == "normal")
					nNormalWindows++;
			}
			if(nNormalWindows==1) {
				var createProperties = {
					"windowId": window.id, 
					"url":	  chrome.extension.getURL('profileChooser.html'), 
					"selected": true
				};
				chrome.tabs.create(createProperties);
			}
		});
	}
});

