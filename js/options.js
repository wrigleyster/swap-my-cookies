var original_updateData = updateData;
updateData = function() {
	original_updateData();
	showProfiles();
	showUndo();
	setProfilesEvents();
	setBackupEvents();
}

function setOptions() {
	$("#refreshSettings").prop('value', refreshSettings);
	if(integrateETC)
		$("#integrateETC").prop('checked', 'checked');
	if(showProfileNumber)
		$("#showProfileNumber").prop('checked', 'checked');
	if(showProfileChooser)
		$("#showProfileChooser").prop('checked', 'checked');
	 if(activateShortcuts)
		$("#activateShortcuts").prop('checked', 'checked');
}

var commandsDiv
function showProfiles() {
	var content = $(".content","#profiles");
	var commandsDiv = $("#profilesOperations").clone().prop("style", "");
	$(content).empty();

	if(sessions.length == 0)
		location.reload(true);

	for(var i=0; i<sessions.length; i++) {
		var currentSession = sessions[i];
		try {
			line = createProfileLine(currentSession, $(commandsDiv), i);
		} catch(err) {
			console.error(err);
			console.error(err.message);
			continue;
		}
		$(content).append(line);
	}

	if(ls.get("data_sessions") != undefined && ls.get("data_sessions").length > (2600000 * 3/4))
		$("#sizeWarning").show();
	else
		$("#sizeWarning").hide();
}

function showUndo() {
	var line;
	var content = $(".content","#backup");
	var commandsDiv = $("#backupOperations").clone();
	commandsDiv.prop("style", "");

	if(backupData.length > 0)
		$(content).empty();

	for(var i=backupData.length-1; i>=0; i--) {
		var currentBackup = backupData[i];
		try {
			line = createUndoLine(currentBackup, $(commandsDiv), i);
		} catch(err) {
			console.error(err);
			console.error(err.message);
			continue;
		}
		$(content).append(line);
	}
}

function createProfileLine(session, commandsDiv, index) {
	var line = $( document.createElement('div') );
	line.addClass("formLine");
	var indexInput = $( document.createElement('input') );
	indexInput.addClass("index");
	indexInput.prop("type","hidden");
	indexInput.prop("value",index);
	var nameDiv = $( document.createElement('div') );
	if(activeSession == index)
		nameDiv.addClass("active");
	else
		nameDiv.addClass("unactive");
	nameDiv.addClass("name");
	nameDiv.text(session.name);
	var lastUsedDiv = $( document.createElement('div') );
	lastUsedDiv.addClass("lastUsed");
	var createdDate = new Date(session.created);
	lastUsedDiv.prop("title", "Created on " + createdDate.format("dddd, dd mmmm yyyy HH:MM:ss"));
	
	if(index == activeSession) {
		lastUsedDiv.text("In Use");
	} else {
		//lastUsedDiv.text(lastUsedDate.format("dd/mm | HH:MM"));
		var timeDifference = calculateTimeDifference(new Date(), session.lastUsed);
		var differenceString = stringifyDateDifference(timeDifference);
		if(timeDifference.isOld) {
			lastUsedDiv.css({
				color: "red"
			});
			lastUsedDiv.prop("title","Old! Consider deleting or cleaning the profile!");
		}
		lastUsedDiv.text(differenceString);
	}
	line.append(indexInput);
	line.append($(commandsDiv).clone());
	line.append(nameDiv);
	line.append(lastUsedDiv);
	return line;
}

function createUndoLine(undoRecord, commandsDiv, index) {
	var session = undoRecord.session;
	var line = $( document.createElement('div') );
	line.addClass("formLine");
	var indexInput = $( document.createElement('input') );
	indexInput.addClass("index");
	indexInput.prop("type","hidden");
	indexInput.prop("value",index);
	var nameDiv = $( document.createElement('div') );
	nameDiv.addClass("unactive");
	nameDiv.addClass("name");

	if(undoRecord.type == "delete")
		nameDiv.text("Profile deleted: " + session.name);
	else if(undoRecord.type == "cookies deleted")
		nameDiv.text("Cookies deleted from: " + session.name);
	else
		nameDiv.text(session.name);						 //For future -> more actions besides undelete
	
	var lastUsedDiv = $( document.createElement('div') );
	lastUsedDiv.addClass("lastUsed");
	var createdDate = new Date(undoRecord.date);
	lastUsedDiv.prop("title", "Deleted on " + createdDate.format("dddd, dd mmmm yyyy HH:MM:ss"));


	//lastUsedDiv.text(lastUsedDate.format("dd/mm | HH:MM"));
	var timeDifference = calculateTimeDifference(new Date(), undoRecord.date);
	var differenceString = stringifyDateDifference(timeDifference) + " ago";

	lastUsedDiv.text(differenceString);

	line.append(indexInput);
	line.append($(commandsDiv).clone());
	line.append(nameDiv);
	line.append(lastUsedDiv);
	return line;
}

function updateLastUsed() {
	var lastUsedDivList = $(".lastUsed", "#profiles");
	for(var i=0; i<sessions.length; i++) {
		var session = sessions[i];
		var lastUsedDiv = $(lastUsedDivList.get(i));
		if(i == activeSession) {
			lastUsedDiv.text("In Use");
		} else {
			//lastUsedDiv.text(lastUsedDate.format("dd/mm | HH:MM"));
			var timeDifference = calculateTimeDifference(new Date(), session.lastUsed);
			var differenceString = stringifyDateDifference(timeDifference);
			if(timeDifference.isOld) {
				lastUsedDiv.css({
					color: "red"
				});
				lastUsedDiv.prop("title","Old! Consider deleting or cleaning the profile!");
			}
			lastUsedDiv.text(differenceString);
		}
	}
}

function updateProfiles() {
	updateData();
	showProfiles();
	setProfilesEvents();
}

function setEvents() {
	setOnceEvents();
	setProfilesEvents();
}

function setOnceEvents() {
	//OPTIONS BOX

	$("#integrateETC").prop("disabled", "disabled");
	$("#integrateETC").parent().click(function(event) {
		event.preventDefault();
		chrome.tabs.create({
			url:"https://chrome.google.com/extensions/detail/fngmhnnpilhplaeedifhccceomclgfbg"
		});
	});
	chrome.extension.sendRequest(editThisCookieID, {
		"action": "ping"
	},
	function(response) {
		if(chrome.extension.lastError != undefined)
			isInstalledETC = false;
		else
			isInstalledETC = true;
		ls.set("status_isInstalledETC", isInstalledETC);
		$("#integrateETC").prop("disabled", "");
		$("#integrateETC").parent().unbind();
		$("#integrateETC").unbind().click(function() {
			var value = $(this).prop("checked");
			ls.set("options_integrateETC", value);
			triggerUpdateData();
		});
	}
	);
	$("#showProfileNumber").change(function() {
		var value = $(this).prop("checked");
		ls.set("options_showProfileNumber", value);
		triggerUpdateData();
	});
	$("#showProfileChooser").change(function() {
		var value = $(this).prop("checked");
		ls.set("options_showProfileChooser", value);
		triggerUpdateData();
	});
	$("#activateShortcuts").change(function() {
		var value = $(this).prop("checked");
		ls.set("options_activateShortcuts", value);
		triggerUpdateData();
	});
	$("#refreshSettings").change(function() {
		var value = $(this).val();
		ls.set("options_refreshSettings", value);
	});
	$("#emptyAll").click(function() {
		if(!confirm("Every cookie will be deleted.\nThis action cannot be undone. Proceed?"))
			return;
		switchProfile(null, function() {
			for(var i=0; i<sessions.length; i++) {
				sessions[i].cookies = new Array();
				sessions[i].lastUsed = null;
			}
			ls.set("data_sessions", sessions);
//			updateProfiles();
			$(".formLine", "#profiles").effect("highlight", {
				color: '#FF9999'
			}, "slow");
			location.reload(true);
		});
	});
	$("#resetProfiles").click(function() {
		if(!confirm("All profiles will be deleted.\nAll cookies except the current ones will be deleted.\nThis action cannot be undone. Proceed?"))
			return;
		ls.set("data_sessions", null);
		$(".formLine", "#profiles").effect("highlight", "slow");
		triggerUpdateData();
		location.reload(true);
	});
	$("#addProfile").click(function() {
		var newSession = {};
		newSession.name = "New Profile";
		newSession.cookies = new Array();
		newSession.created = new Date();
		newSession.lastUsed = undefined;
		createNewProfile(newSession, false, triggerUpdateData);
		
	});

	setInterval(updateLastUsed, 1000 * 30);
}

function createNewProfile(session, isRestore, callback) {
	var nCopy = 0;
	if(!!isRestore) {
		for(var i=0; i<sessions.length; i++) {
			if(sessions[i].name == "Restored #" + nCopy + ": " + session.name){
				nCopy++;
				i=0;
			}
		}
		session.name = "Restored #" + nCopy + ": " + session.name;
	} else {
		for(var i=0; i<sessions.length; i++) {
			if(sessions[i].name == session.name + " #" + nCopy){
				nCopy++;
				i=0;
			}
		}
		session.name = session.name + " #" + nCopy;
	}
	
	sessions[sessions.length] = session;
	ls.set("data_sessions", sessions);
	var newLine = createProfileLine(session, $("#profilesOperations"), sessions.length-1);
	$(newLine).prop("display","none");
	$(".content","#profiles").append($(newLine));
	$(newLine).show("blind", "fast", function(){
		updateProfiles();
		if(callback != undefined)
			callback();
	});
}

function setProfilesEvents() {
	//PROFILES OPERATIONS
	$(".cmd_delete", $(".operations", "#profiles")).unbind().click(function() {
		var index = parseInt($(".index",$(this).parent().parent()).prop("value"));
		$(this).parent().parent().hide("blind", "fast");
			if(backupData.length >= 5)
				backupData.splice(0,1);
			backupData[backupData.length] = {"type":"delete", "date":new Date(), "session":jQuery.extend(true, {}, sessions[index]),"wasAtIndex":index};

			var newLine = createUndoLine(backupData[backupData.length-1], $("#backupOperations").clone(), backupData.length-1);
			$(newLine).prop("display","none");
			$(".content","#backup").prepend($(newLine));

			if(sessions.length > 1 && index == activeSession) {
				var switchTo = 0;
				if(index != 0)
					switchTo = index-1;
				else if(sessions.length > 1)
					switchTo = index+1;
				restoreSession(switchTo, function(index){
					sessions.splice(index,1);
					ls.set("data_sessions", sessions);
					ls.set("data_activeSession", activeSession-1);
					ls.set("data_backupData",backupData);
					$(newLine).show("blind", "fast", function(){
						triggerUpdateData();
					});
				});
			} else {
				sessions.splice(index,1);
				ls.set("data_sessions", sessions);
				if(activeSession > index)
					ls.set("data_activeSession", activeSession-1);
				ls.set("data_backupData",backupData);
				$(newLine).show("blind", "fast", function(){
					triggerUpdateData();
				});
			}
	});
	$(".cmd_reset", $(".operations", "#profiles")).unbind().click(function() {
		var index = $(".index",$(this).parent().parent()).prop("value");
		if(backupData.length >= 5)
				backupData.splice(0,1);
		backupData[backupData.length] = {"type":"cookies deleted", "date":new Date(), "session":jQuery.extend(true, {}, sessions[index], true),"wasAtIndex":index};

		sessions[index].cookies = new Array();
		sessions[index].lastUsed = undefined;
		if(index == activeSession)
			switchProfile();
		ls.set("data_sessions", sessions);
		ls.set("data_backupData",backupData);
		$(this).parent().parent().effect("highlight", "slow", function(){
			triggerUpdateData();
		});
	});
	$(".cmd_copy", $(".operations", "#profiles")).unbind().click(function() {
		var index = $(".index",$(this).parent().parent()).prop("value")
		var newSession = jQuery.extend(true, {}, sessions[index]);
		newSession.name = "Copy of " + "\"" + newSession.name + "\"";
		newSession.created = new Date();
		//newSession.lastUsed = undefined;
		var nCopy = 0;
		for(var i=0; i<sessions.length; i++) {
			if(sessions[i].name == newSession.name + " #" + nCopy){
				nCopy++;
				i=0;
			}
		}
		newSession.name = newSession.name + " #" + nCopy;
		sessions[sessions.length] = newSession;
		ls.set("data_sessions", sessions);
		var newLine = createProfileLine(newSession, commandsDiv, sessions.length-1);
		$(newLine).prop("display","none");
		$(".content","#profiles").append($(newLine));
		$(newLine).show("blind", "fast", function(){
			triggerUpdateData();
		});
	});
	$(".cmd_rename", $(".operations", "#profiles")).unbind().click(function() {
		if($(".newName", $(this).parent().next()).length > 0)
			return;
		var line = $(this).parent().parent();
		var profileDiv = $(this).parent().next();
		var profileName = $(profileDiv).text();
		profileName = profileName.replace(/'/g, "\"");
		$(profileDiv).html("<input type='hidden' class='oldName' value='" + profileName + "' /><input type='text' class='newName' spellcheck='false' value='" + profileName + "' /><img src='img/16/accept2.png' class='saveProfile button' /><img src='img/16/delete2.png' class='cancelEditProfile button' />");
		$(".newName", $(profileDiv)).select();
		$(".newName", $(profileDiv)).keyup(function(event){
			if(event.keyCode == 27) //ESC
				$(".cancelEditProfile", $(this).parent()).trigger('click');
			if(event.keyCode == 13) //ENTER
				$(".saveProfile", $(this).parent()).trigger('click');
		});
		$(line).blur(function(){
			$(".cancelEditProfile", $(this)).click();
		});
		$(".saveProfile", $(profileDiv)).unbind().click(function() {
			var index = $(".index",$(this).parent().parent()).prop("value");
			var newName = $(".newName", $(this).parent()).prop("value");
			newName = newName.replace(/'/g, "\"");
			var isDupe = false;
			for(var i=0; i<sessions.length; i++) {
				if(sessions[i].name == newName && i != index){
					isDupe = true;
					break;
				}
			}
			if(!isDupe) {
				sessions[index].name = newName;
				ls.set("data_sessions", sessions);
				$(this).parent().text(newName).parent().effect("highlight", {
					color: '#99FF99'
				}, "slow", function(){
					triggerUpdateData();
				});
			} else {
				$(this).parent().parent().effect("highlight", {
					color: '#FF9999'
				}, "slow");
			}
		});
		$(".cancelEditProfile", $(profileDiv)).unbind().click(function() {
			var oldName = $(".oldName", $(this).parent()).prop("value");
			$(this).parent().text(oldName);
		});
	});
}

function setBackupEvents() {
	$(".cmd_undo", $(".operations", "#backup")).unbind().click(function() {
		var index = $(".index",$(this).parent().parent()).prop("value");
		$(this).parent().parent().hide("blind", "fast");
		var session = jQuery.extend(true, {}, backupData[index].session);
		backupData.splice(index,1);
		ls.set("data_backupData",backupData);
		createNewProfile(session, true, triggerUpdateData);
	});
	$(".cmd_deleteBackup", $(".operations", "#backup")).unbind().click(function() {
		var index = $(".index",$(this).parent().parent()).prop("value");
		$(this).parent().parent().hide("blind", "fast", function(){
			backupData.splice(index,1);
			ls.set("data_backupData",backupData);
			showUndo();
			triggerUpdateData();
		});
	});
}

function saveProfilesOrder() {
	var indexList = new Array();
	$(".index:input", "#sortable").each(function(){
		indexList[indexList.length] = $(this).prop("value");
	});

	var newSessions = new Array(sessions.length);
	for(var i=0; i<indexList.length; i++) {
		newSessions[i] = sessions[indexList[i]];
	}
	for(var i=0; i<indexList.length; i++) {
		if(activeSession == indexList[i]) {
			activeSession = i;
			break;
		}
	}
	ls.set("data_sessions", newSessions);
	ls.set("data_activeSession", activeSession);
	triggerUpdateData();
	$("#sortable").sortable("refresh");
}

function centerDiv() {
	var height = $("#wrapper").height();
	var totalHeight = $("body").height();
	var top = (totalHeight - height)/2+"px !important";
	$("#wrapper").css({
		"margin-top":top
	});
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


jQuery(document).ready(function(){
	setOptions();
	setOnceEvents();
	showProfiles();
	showUndo();
	centerDiv();
	$("#sortable").sortable({
		axis: 'y',
		//containment: '#sortableContainment',
		//zIndex: 1000,
		stop: function(event, ui) {
			saveProfilesOrder();
		}
	});
	$("#sortable").disableSelection();
	setProfilesEvents();
	setBackupEvents();
});
