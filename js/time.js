/*
 *  SplitsBrowser Time - Functions for time handling and conversion.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    const isNaNStrict = SplitsBrowser.isNaNStrict;

    /**
     * Formats a number to two digits, preceding it with a zero if necessary,
     * e.g. 47 -> "47", 8 -> "08".
     * @param {Number} value The value to format.
     * @return {String} Number formatted with a leading zero if necessary.
     */
    function formatToTwoDigits(value) {
        return (value < 10) ? "0" + value : value.toString();
    }

    /**
     * Formats a time period given as a number of seconds as a string in the form
     * [-][h:]mm:ss.ss .
     * @param {Number} seconds The number of seconds.
     * @param {Number|null} precision Optional number of decimal places to format
     *     using, or the default if not specified.
     * @return {String} The string formatting of the time.
     */
    SplitsBrowser.formatTime = function (seconds, precision) {
        if (seconds === null) {
            return SplitsBrowser.NULL_TIME_PLACEHOLDER;
        } else if (isNaNStrict(seconds)) {
            return "???";
        }

        let result = "";
        if (seconds < 0) {
            result = "-";
            seconds = -seconds;
        }

        const hours = Math.floor(seconds / (60 * 60));
        const mins = Math.floor(seconds / 60) % 60;
        const secs = seconds % 60;
        if (hours > 0) {
            result += hours.toString() + ":";
        }

        result += formatToTwoDigits(mins) + ":";

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
     * Formats a number of seconds as a time of day.  This returns a string
     * of the form HH:MM:SS, with HH no more than 24.
     * @param {Number} seconds The number of seconds
     * @return {String} The time of day formatted as a string.
     */
    SplitsBrowser.formatTimeOfDay = function (seconds) {
        const hours = Math.floor((seconds / (60 * 60)) % 24);
        const mins = Math.floor(seconds / 60) % 60;
        const secs = Math.floor(seconds % 60);
        return formatToTwoDigits(hours) + ":" + formatToTwoDigits(mins) + ":" + formatToTwoDigits(secs);
    };

    /**
     * Parse a time of the form MM:SS or H:MM:SS into a number of seconds.
     * @param {String} time The time of the form MM:SS.
     * @return {Number|null} The number of seconds.
     */
    SplitsBrowser.parseTime = function (time) {
        time = time.trim();
        if (/^(-?\d+:)?-?\d+:-?\d\d([,.]\d+)?$/.test(time)) {
            let timeParts = time.replace(",", ".").split(":");
            let totalTime = 0;
            for (let timePart of timeParts) {
                totalTime = totalTime * 60 + parseFloat(timePart);
            }
            return totalTime;
        } else {
            // Assume anything unrecognised is a missed split.
            return null;
        }
    };
})();