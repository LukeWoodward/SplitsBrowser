/*
 *  SplitsBrowser Time - Functions for time handling and conversion.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
(function () {
    "use strict";

    SplitsBrowser.NULL_TIME_PLACEHOLDER = "-----";
    
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    
    /**
    * Formats a time period given as a number of seconds as a string in the form
    * [-][h:]mm:ss.ss .
    * @param {Number} seconds - The number of seconds.
    * @param {?Number} precision - Optional number of decimal places to format
    *     using, or the default if not specified. 
    * @returns {string} The string formatting of the time.
    */
    SplitsBrowser.formatTime = function (seconds, precision) {
        
        if (seconds === null) {
            return SplitsBrowser.NULL_TIME_PLACEHOLDER;
        } else if (isNaNStrict(seconds)) {
            return "???";
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
        
        if (typeof precision === "number") {
            result += secs.toFixed(precision);
        } else {
            result += Math.round(secs * 100) / 100;
        }
        
        return result;
    };
    
    /**  
    * Parse a time of the form MM:SS or H:MM:SS into a number of seconds.
    * @param {string} time - The time of the form MM:SS.
    * @return {?Number} The number of seconds.
    */
    SplitsBrowser.parseTime = function (time) {
        time = time.trim();
        if (/^(\d+:)?\d+:\d\d([,.]\d+)?$/.test(time)) {
            var timeParts = time.replace(",", ".").split(":");
            var totalTime = 0;
            timeParts.forEach(function (timePart) {
                totalTime = totalTime * 60 + parseFloat(timePart);
            });
            return totalTime;
        } else {
            // Assume anything unrecognised is a missed split.
            return null;
        }
    };
})();