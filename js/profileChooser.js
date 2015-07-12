
updateData = function() {
    window.close();
    window.location = "chrome://newtab";
//    chrome.tabs.getCurrent(function(tab){
//        chrome.tabs.update(tab.id,{
//            "url":"chrome://newtab",
//            "selected":tab.selected
//        });
//    })
}
var activeSession;
function showProfiles(callback) {
    chrome.extension.sendRequest({
        "action": "getProfiles"
    },
    function(response) {
        var profiles = response.profiles;
        activeSession = response.activeSession;
        var content = $(".content","#profiles");
        $(content).empty();
        for(var i=0; i<profiles.length; i++) {
            try {
                var currentName = profiles[i];
                line = createProfileLine({
                    "name":currentName
                }, i);
                $(content).append(line);
            } catch(err) {
                console.error("Error while inserting profiles in list!\n" + err.description);
            }
        }
        callback();
    });
}


function createProfileLine(session, index) {
    var line = $( document.createElement('div') );
    line.addClass("formLine");
    var indexInput = $( document.createElement('input') );
    indexInput.addClass("index");
    indexInput.attr("type","hidden");
    indexInput.attr("value",index);
    var nameDiv = $( document.createElement('div') );
    if(activeSession == index)
        nameDiv.addClass("active");
    else
        nameDiv.addClass("unactive");
    nameDiv.addClass("name");
    nameDiv.text(session.name);
    var lastUsedDiv = $( document.createElement('div') );
    lastUsedDiv.addClass("lastUsed");    
    if(index == activeSession) {
        lastUsedDiv.text("In Use");
    }
    
    line.append(indexInput);
    line.append(nameDiv);
    line.append(lastUsedDiv);
    return line;
}

function setEvents() {
    $("#sortable .formLine").click(function(){
        var index = $(".index", $(this)).attr("value");
        if(index == activeSession){
            updateData();
            return;
        }
        $('.active').removeClass('active');
        $(".name", $(this)).addClass('active');
        $("#loading").show();
        console.log("Sending switch request");
        chrome.extension.sendRequest({
            "action": "switchProfile",
            "switchTo": index
        }, function(response) {
            $("#loading").hide();
        });
    });
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
	showProfiles(setEvents);
	centerDiv();
});
