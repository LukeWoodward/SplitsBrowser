(function () {
    "use strict";

    SplitsBrowser.NULL_TIME_PLACEHOLDER = "-----";
    
    /**
    * Formats a time period given as a number of seconds as a string in the form
    *  [-][h:]mm:ss.
    * @param {Number} seconds - The number of seconds.
    * @returns {string} The string formatting of the time.
    */
    SplitsBrowser.formatTime = function (seconds) {
        
        if (seconds === null) {
            return SplitsBrowser.NULL_TIME_PLACEHOLDER;
        }
    
        var result = "";
        if (seconds < 0) {
            result = "-";
            seconds = -seconds;
        }
        
        var hours = Math.floor(seconds / (60 * 60));
        var mins = Math.floor(seconds / 60) % 60;
        var secs = seconds % 60;
        if (hours > 0) {
            result += hours.toString() + ":";
        }
        
        if (mins < 10) {
            result += "0";
        }
        
        result += mins + ":";
        
        if (secs < 10) {
            result += "0";
        }
        
        result += secs;
        
        return result;
    };
    
    /**  
    * Parse a time of the form MM:SS or H:MM:SS into a number of seconds.
    * @param {string} time - The time of the form MM:SS.
    * @return {Number} The number of seconds.
    */
    SplitsBrowser.parseTime = function (time) {
        if (time.match(/^\d+:\d\d$/)) {
            return parseInt(time.substring(0, time.length - 3), 10) * 60 + parseInt(time.substring(time.length - 2), 10);
        } else if (time.match(/^\d+:\d\d:\d\d$/)) {
            return parseInt(time.substring(0, time.length - 6), 10) * 3600 + parseInt(time.substring(time.length - 5, time.length - 3), 10) * 60 + parseInt(time.substring(time.length - 2), 10);
        } else {
            // Assume anything unrecognised is a missed split.
            return null;
        }
    };
})();