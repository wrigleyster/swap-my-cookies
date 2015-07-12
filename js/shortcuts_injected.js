
var SMC_isRunning = false;
var SMC_isCtrl = false;
var SMC_isShift = false;
document.onkeyup=function(e){
    if(e.which == 16) SMC_isShift=false;
    if(e.which == 17) SMC_isCtrl=false;
}
document.onkeydown=function(e){
    if(e.which == 16) SMC_isShift=true;
    if(e.which == 17) SMC_isCtrl=true;

    if(SMC_isRunning)
        return true;
    SMC_isRunning = true;

    var number = null;
    var step = null;

    if(!SMC_isShift && SMC_isCtrl) {
        if(e.which >= 48 && e.which <= 57) {
            number = e.which - 48 -1;
        }
    }
    if(SMC_isShift && SMC_isCtrl) {
        if(e.which == 107) {
            step = 1;
        } else if(e.which == 109) {
            step = -1;
        }
    }
    
    if((number!=null && number>=0) || step!=null) {
        console.log(number + " | " + step);
        chrome.extension.sendRequest({
            "action": "switchProfile",
            "switchTo": (number),
            "step": step
        });
        SMC_isRunning = false;
        return false;
    }
    SMC_isRunning = false;
    return true;
}