function calculateTimeDifference(earlierDate, laterDateStr) {
    var ONE_SECOND = 1000;
    var ONE_MINUTE = ONE_SECOND * 60;
    var ONE_HOUR = ONE_MINUTE * 60;
    var ONE_DAY = ONE_HOUR * 24;
    var ONE_WEEK = ONE_DAY * 7;
    var ONE_YEAR = ONE_DAY * 365;

    if(laterDateStr == null || laterDateStr == undefined || laterDateStr == 'undefined')
        return {
            "valid":false
        };

    var laterDate = new Date(laterDateStr);
    var difference = Math.abs(laterDate.getTime() - earlierDate.getTime());
    var years = Math.round(difference / ONE_YEAR);
    var months = Math.abs(laterDate.getMonth() - earlierDate.getMonth()) * (Math.abs(laterDate.getYear() - earlierDate.getYear())+1)
    var weeks = Math.floor(difference / ONE_WEEK);
    difference -= weeks * ONE_WEEK;
    var days = Math.floor(difference / ONE_DAY);
    difference -= days * ONE_DAY;
    var hours = Math.floor(difference / ONE_HOUR);
    difference -= hours * ONE_HOUR;
    var minutes = Math.floor(difference / ONE_MINUTE);
    difference -= minutes * ONE_MINUTE;
    var seconds = Math.floor(difference / ONE_SECOND);
    difference -= seconds * ONE_SECOND;

    var result = {};
    result.years = years;
    result.months = months;
    result.weeks = weeks;
    result.days = days;
    result.hours = hours;
    result.minutes = minutes;
    result.seconds = seconds;

    result.isZero = (!years && !months && !weeks && !days && !hours && !minutes && !seconds);
    result.isOld = (years > 0 || months > 0);

    return result;
}