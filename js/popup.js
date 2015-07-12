function setEvents() {
	$(".name").click(function(){
		var index = $(".index", $(this).parent()).attr("value");
		$('.active').removeClass('active');
		$(this).addClass('active');
		$("#loading").show();
		console.log("Sending switch request");
		chrome.extension.sendRequest({
			"action": "switchProfile",
			"switchTo": index
			}, function() {
				$("#loading").hide();
				window.location.reload(true);
			}
		);
	});
	$("#options").click(function(){
		chrome.tabs.getAllInWindow(null, function tabSearch(tabs) {
			for(var i=0; i<tabs.length; i++) {
				var tab = tabs[i];
				if(tab.url.indexOf(chrome.extension.getURL('options.html')) >= 0) {
					chrome.tabs.update(tab.id, {
						selected:true
					});
					return;
				}
			}
			chrome.tabs.create({
				url:chrome.extension.getURL('options.html')
			});
		});
	});
}

function showProfiles(callback) {
	chrome.extension.sendRequest({ "action": "getProfiles" },
		function(response) {
			var profiles = response.profiles;
			var activeSession = response.activeSession;
			
			$("#profilesList").empty();
			for(var i=0; i<profiles.length; i++) {
				try {
					var currentName = profiles[i];
					console.log(currentName);
					
					var line = $( document.createElement('div') );
					line.addClass("session");
					if (i == profiles.length - 1)
						line.addClass("lastSession");
					var indexInput = $( document.createElement('input') );
					indexInput.addClass("index");
					indexInput.attr("type","hidden");
					indexInput.attr("value",i);
					var nameDiv = $( document.createElement('div') );
					nameDiv.addClass("name");
					nameDiv.addClass("button");
					nameDiv.text(currentName);
					if(activeSession == i)
						nameDiv.addClass("active");
					else
						nameDiv.addClass("unactive");
					line.append(indexInput);
					line.append(nameDiv);
					$("#profilesList").append(line);
				} catch(err) {
					console.error("Error while inserting profiles in list!\n" + err.description);
				}
			}
			
			callback();
	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

$("#loading").show();
jQuery(document).ready(function(){
	showProfiles(setEvents);
});
