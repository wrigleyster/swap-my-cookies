var VERSION = "0.0.7";
var showVersionChanges = false;

var sessions;
var activeSession;		//Which profile is in use? Points to the array location of sessions
var backupData;                 //Contains all undo actions {id,type,date,data}
var refreshSettings;            //Values: "0"-No Update / "1"-Update Current Tab / "2"-Update all tabs in current window / "3"-Update all tabs of all windows
var showProfileNumber           //True: shows in the browser's icon a number representing the active profile
var showProfileChooser;
var integrateETC;		//Boolean - Integrate with the extension 'Edit This Cookie'?
var isInstalledETC;
var activateShortcuts;          //Boolean - Shortcuts are enabled? (It comprehends js injection)
var justUpdated;
var firstRun;
var installDate;

var editThisCookieID = "fngmhnnpilhplaeedifhccceomclgfbg";
var swapMyCookiesID = "dffhipnliikkblkhpjapbecpmoilcama";
var forgetMeID = "gekpdemielcmiiiackmeoppdgaggjgda";

var ls = {
    set : function(name, value) {
        var toReturn = this.get(name);
        localStorage.setItem(name, JSON.stringify(value));
        return toReturn;
    },
    get : function(name) {
        var toReturn;
        try {
            toReturn = JSON.parse(localStorage.getItem(name));
        } catch(e) {
            toreturn = null;
        }
        return toReturn;
    },
    remove : function(name) {
        var toReturn = this.get(name);
        localStorage.removeItem(name);
        return toReturn;
    }
}

var updateData = function() {
    sessions = ls.get("data_sessions");
    //sessions = null;
    if(sessions == null || sessions == undefined) {
        sessions = new Array();
        sessions[0] = {
            "name":"New Profile #0",
            "cookies":new Array(),
            "created":new Date(),
            "lastUsed": undefined
        };
        sessions[1] = {
            "name":"New Profile #1",
            "cookies":new Array(),
            "created":new Date(),
            "lastUsed": undefined
        };
        sessions[2] = {
            "name":"New Profile #2",
            "cookies":new Array(),
            "created":new Date(),
            "lastUsed": undefined
        };
    } else if(sessions.length == 0) {
        sessions = new Array();
        sessions[0] = {
            "name":"New Profile #0",
            "cookies":new Array(),
            "created":new Date(),
            "lastUsed": undefined
        };
    }

    activeSession = ls.get("data_activeSession");
    if(activeSession == null || activeSession >= sessions.length || activeSession < 0 || activeSession == undefined) {
        activeSession = 0;
    }	
    sessions[activeSession].lastUsed = new Date();

    backupData = ls.get("data_backupData");
    if(backupData == null || backupData == undefined) {
        backupData = new Array();
    }

    refreshSettings = ls.get("options_refreshSettings");
    if(refreshSettings == null || refreshSettings == undefined) {
        refreshSettings = 2;
    }

    showProfileNumber = ls.get("options_showProfileNumber");
    if(showProfileNumber == null || showProfileNumber == undefined) {
        showProfileNumber = true;
    }

    showProfileChooser = ls.get("options_showProfileChooser");
    if(showProfileChooser == null || showProfileChooser == undefined) {
        showProfileChooser = false;
    }

    activateShortcuts = ls.get("options_activateShortcuts");
    if(activateShortcuts == null || activateShortcuts == undefined) {
        activateShortcuts = false;
    }
	
    integrateETC = ls.get("options_integrateETC");
    if(integrateETC == null || integrateETC == undefined) {
        integrateETC = true;
    }

    isInstalledETC = ls.get("status_isInstalledETC");
    if(isInstalledETC == null || isInstalledETC == undefined) {
        isInstalledETC = false;
    }
    
    installDate = ls.get("data_installDate");
    if(installDate == null) {
        installDate = new Date();
        ls.set("data_installDate", installDate);
    }

    var oldVersion = ls.get("status_version");
    firstRun = ls.get("status_firstRun");
    if(firstRun == null)
        firstRun = true;
    else
        firstRun = false;
    if(oldVersion == VERSION)
        justUpdated = false;
    else
        justUpdated = true;

    setTimeout ( function() {
        ls.set("data_sessions", sessions);
        ls.set("data_activeSession", activeSession);
        ls.set("data_backupData",backupData);
        ls.set("options_refreshSettings", refreshSettings);
        ls.set("options_showProfileNumber", showProfileNumber);
        ls.set("options_showProfileChooser", showProfileChooser);
        ls.set("options_activateShortcuts", activateShortcuts);
        ls.set("options_integrateETC", integrateETC);
        ls.set("status_version", VERSION);
        ls.set("data_installDate", installDate);
        ls.set("status_firstRun", false);
    },1,sessions,activeSession,refreshSettings,showProfileNumber,activateShortcuts,integrateETC,VERSION,installDate);

};
updateData();

function triggerUpdateData() {
    var tabs = chrome.extension.getViews();
    for(var i=0; i<tabs.length; i++){
        if (tabs[i].updateData)
            tabs[i].updateData();
    }
}
