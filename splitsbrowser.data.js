/*!
 *  SplitsBrowser - Orienteering results analysis.
 *  
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

﻿/*
 *  SplitsBrowser Core - Namespaces the rest of the program depends on.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

// Tell ESLint not to complain that this is redeclaring a constant.
/* eslint no-redeclare: "off", no-unused-vars: "off" */
var SplitsBrowser = { Version: "3.5.4", Model: {}, Input: {}, Controls: {}, Messages: {} };

﻿/*
 *  SplitsBrowser - Assorted utility functions.
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

    // Minimum length of a course that is considered to be given in metres as
    // opposed to kilometres.
    var MIN_COURSE_LENGTH_METRES = 500;

    /**
     * Utility function used with filters that simply returns the object given.
     * @param {any} x Any input value
     * @return {any} The input value.
     */
    SplitsBrowser.isTrue = function (x) { return x; };

    /**
    * Utility function that returns whether a value is not null.
    * @param {any} x Any input value.
    * @return {Boolean} True if the value is not null, false otherwise.
    */
    SplitsBrowser.isNotNull = function (x) { return x !== null; };

    /**
    * Returns whether the value given is the numeric value NaN.
    *
    * This differs from the JavaScript built-in function isNaN, in that isNaN
    * attempts to convert the value to a number first, with non-numeric strings
    * being converted to NaN.  So isNaN("abc") will be true, even though "abc"
    * isn't NaN.  This function only returns true if you actually pass it NaN,
    * rather than any value that fails to convert to a number.
    *
    * @param {any} x Any input value.
    * @return {Boolean} True if x is NaN, false if x is any other value.
    */
    SplitsBrowser.isNaNStrict = function (x) { return x !== x; };

    /**
    * Returns whether the value given is neither null nor NaN.
    * @param {Number|null} x A value to test.
    * @return {Boolean} False if the value given is null or NaN, true
    *     otherwise.
    */
    SplitsBrowser.isNotNullNorNaN = function (x) { return x !== null && x === x; };

    /**
    * Exception object raised if invalid data is passed.
    * @constructor
    * @param {String} message The exception detail message.
    */
    function InvalidData(message) {
        this.name = "InvalidData";
        this.message = message;
    }

    /**
    * Returns a string representation of this exception.
    * @return {String} String representation.
    */
    InvalidData.prototype.toString = function () {
        return this.name + ": " + this.message;
    };

    /**
    * Utility function to throw an 'InvalidData' exception object.
    * @param {String} message The exception message.
    * @throws {InvalidData} if invoked.
    */
    SplitsBrowser.throwInvalidData = function (message) {
        throw new InvalidData(message);
    };

    /**
    * Exception object raised if a data parser for a format deems that the data
    * given is not of that format.
    * @constructor
    * @param {String} message The exception message.
    */
    function WrongFileFormat(message) {
        this.name = "WrongFileFormat";
        this.message = message;
    }

    /**
    * Returns a string representation of this exception.
    * @return {String} String representation.
    */
    WrongFileFormat.prototype.toString = function () {
        return this.name + ": " + this.message;
    };

    /**
    * Utility function to throw a 'WrongFileFormat' exception object.
    * @param {String} message The exception message.
    * @throws {WrongFileFormat} if invoked.
    */
    SplitsBrowser.throwWrongFileFormat = function (message) {
        throw new WrongFileFormat(message);
    };

    /**
     * Checks whether the given object contains a property with the given name.
     * This is a wrapper around the call to Object.prototype.hasOwnProperty.
     * @param {Object} object The object to test.
     * @param {String} property The name of the property.
     * @return {Boolean} Whether the object has a property with the given name.
     */
    SplitsBrowser.hasProperty = function (object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    };

    /**
    * Returns the sum of two numbers, or null if either is null.
    * @param {Number|null} a One number, or null, to add.
    * @param {Number|null} b The other number, or null, to add.
    * @return {Number|null} null if at least one of a or b is null,
    *      otherwise a + b.
    */
    SplitsBrowser.addIfNotNull = function (a, b) {
        return (a === null || b === null) ? null : (a + b);
    };

    /**
    * Returns the difference of two numbers, or null if either is null.
    * @param {Number|null} a One number, or null, to add.
    * @param {Number|null} b The other number, or null, to add.
    * @return {Number|null} null if at least one of a or b is null,
    *      otherwise a - b.
    */
    SplitsBrowser.subtractIfNotNull = function (a, b) {
        return (a === null || b === null) ? null : (a - b);
    };

    /**
    * Parses a course length.
    *
    * This can be specified as a decimal number of kilometres or metres, with
    * either a full stop or a comma as the decimal separator.
    *
    * @param {String} stringValue The course length to parse, as a string.
    * @return {Number|null} The parsed course length, or null if not valid.
    */
    SplitsBrowser.parseCourseLength = function (stringValue) {
        var courseLength = parseFloat(stringValue.replace(",", "."));
        if (!isFinite(courseLength)) {
            return null;
        }

        if (courseLength >= MIN_COURSE_LENGTH_METRES) {
            courseLength /= 1000;
        }

        return courseLength;
    };

    /**
    * Parses a course climb, specified as a whole number of metres.
    *
    * @param {String} stringValue The course climb to parse, as a string.
    * @return {Number|null} The parsed course climb, or null if not valid.
    */
    SplitsBrowser.parseCourseClimb = function (stringValue) {
        var courseClimb = parseInt(stringValue, 10);
        if (SplitsBrowser.isNaNStrict(courseClimb)) {
            return null;
        } else {
            return courseClimb;
        }
    };

    /**
    * Normalise line endings so that all lines end with LF, instead of
    * CRLF or CR.
    * @param {String} stringValue The string value to normalise line endings
    *     within.
    * @return {String} String value with the line-endings normalised.
    */
    SplitsBrowser.normaliseLineEndings = function (stringValue) {
        return stringValue.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    };
})();

/*
 *  SplitsBrowser Time - Functions for time handling and conversion.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
        var hours = Math.floor((seconds / (60 * 60)) % 24);
        var mins = Math.floor(seconds / 60) % 60;
        var secs = Math.floor(seconds % 60);
        return formatToTwoDigits(hours) + ":" + formatToTwoDigits(mins) + ":" + formatToTwoDigits(secs);
    };

    /**
    * Parse a time of the form MM:SS or H:MM:SS into a number of seconds.
    * @param {String} time The time of the form MM:SS.
    * @return {Number|null} The number of seconds.
    */
    SplitsBrowser.parseTime = function (time) {
        time = time.trim();
        if (/^(-?\d+:)?-?\d+:-?\d\d([,.]\d{1,10})?$/.test(time)) {
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
/*
 *  SplitsBrowser Result - The results for a competitor or a team.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var NUMBER_TYPE = typeof 0;

    var isNotNull = SplitsBrowser.isNotNull;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var hasProperty = SplitsBrowser.hasProperty;
    var addIfNotNull = SplitsBrowser.addIfNotNull;
    var subtractIfNotNull = SplitsBrowser.subtractIfNotNull;
    var throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
    * Function used with the JavaScript sort method to sort results in order.
    *
    * Results that are mispunched are sorted to the end of the list.
    *
    * The return value of this method will be:
    * (1) a negative number if result a comes before result b,
    * (2) a positive number if result a comes after result a,
    * (3) zero if the order of a and b makes no difference (i.e. they have the
    *     same total time, or both mispunched.)
    *
    * @param {SplitsBrowser.Model.Result} a One result to compare.
    * @param {SplitsBrowser.Model.Result} b The other result to compare.
    * @return {Number} Result of comparing two results.
    */
    SplitsBrowser.Model.compareResults = function (a, b) {
        if (a.isDisqualified !== b.isDisqualified) {
            return (a.isDisqualified) ? 1 : -1;
        } else if (a.totalTime === b.totalTime) {
            return a.order - b.order;
        } else if (a.totalTime === null) {
            return (b.totalTime === null) ? 0 : 1;
        } else {
            return (b.totalTime === null) ? -1 : a.totalTime - b.totalTime;
        }
    };

    /**
    * Convert an array of cumulative times into an array of split times.
    * If any null cumulative splits are given, the split times to and from that
    * control are null also.
    *
    * The input array should begin with a zero, for the cumulative time to the
    * start.
    * @param {Array} cumTimes Array of cumulative split times.
    * @return {Array} Corresponding array of split times.
    */
    function splitTimesFromCumTimes(cumTimes) {
        if (!$.isArray(cumTimes)) {
            throw new TypeError("Cumulative times must be an array - got " + typeof cumTimes + " instead");
        } else if (cumTimes.length === 0) {
            throwInvalidData("Array of cumulative times must not be empty");
        } else if (cumTimes[0] !== 0) {
            throwInvalidData("Array of cumulative times must have zero as its first item");
        } else if (cumTimes.length === 1) {
            throwInvalidData("Array of cumulative times must contain more than just a single zero");
        }

        var splitTimes = [];
        for (var i = 0; i + 1 < cumTimes.length; i += 1) {
            splitTimes.push(subtractIfNotNull(cumTimes[i + 1], cumTimes[i]));
        }

        return splitTimes;
    }

    /**
    * Object that represents the data for a single competitor or team.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * or team appears in the given list of results.  Its sole use is to stabilise
    * sorts of competitors or teams, as JavaScript's sort() method is not
    * guaranteed to be a stable sort.  However, it is not strictly the finishing
    * order of the competitors, as it has been known for them to be given not in
    * the correct order.
    *
    * The split and cumulative times passed here should be the 'original' times,
    * before any attempt is made to repair the data.
    *
    * It is not recommended to use this constructor directly.  Instead, use one
    * of the factory methods fromCumTimes or fromOriginalCumTimes to pass in
    * either the split or cumulative times and have the other calculated.
    *
    * @constructor
    * @param {Number} order The order of the result.
    * @param {Number|null} startTime The start time of the competitor or team, in
    *      seconds past midnight
    * @param {Array} originalSplitTimes Array of split times, as numbers,
    *      with nulls for missed controls.
    * @param {Array} originalCumTimes Array of cumulative times, as
    *      numbers, with nulls for missed controls.
    & @param {Object} owner The competitor or team that recorded this result.
    */
    function Result(order, startTime, originalSplitTimes, originalCumTimes, owner) {

        if (typeof order !== NUMBER_TYPE) {
            throwInvalidData("Result order must be a number, got " + typeof order + " '" + order + "' instead");
        }

        if (typeof startTime !== NUMBER_TYPE && startTime !== null) {
            throwInvalidData("Start time must be a number, got " + typeof startTime + " '" + startTime + "' instead");
        }

        this.order = order;
        this.startTime = startTime;
        this.owner = owner;

        this.isOKDespiteMissingTimes = false;
        this.isNonCompetitive = false;
        this.isNonStarter = false;
        this.isNonFinisher = false;
        this.isDisqualified = false;
        this.isOverMaxTime = false;

        this.originalSplitTimes = originalSplitTimes;
        this.originalCumTimes = originalCumTimes;
        this.splitTimes = null;
        this.cumTimes = null;
        this.splitRanks = null;
        this.cumRanks = null;
        this.timeLosses = null;
        this.className = null;
        this.offsets = null;

        this.totalTime = (originalCumTimes === null || originalCumTimes.indexOf(null) > -1) ? null : originalCumTimes[originalCumTimes.length - 1];
    }

    /**
    * Marks this result as having completed the course despite having missing times.
    */
    Result.prototype.setOKDespiteMissingTimes = function () {
        this.isOKDespiteMissingTimes = true;
        if (this.originalCumTimes !== null) {
            this.totalTime = this.originalCumTimes[this.originalCumTimes.length - 1];
        }
    };

    /**
    * Marks this result as non-competitive.
    */
    Result.prototype.setNonCompetitive = function () {
        this.isNonCompetitive = true;
    };

    /**
    * Marks this result as not starting.
    */
    Result.prototype.setNonStarter = function () {
        this.isNonStarter = true;
    };

    /**
    * Marks this result as not finishing.
    */
    Result.prototype.setNonFinisher = function () {
        this.isNonFinisher = true;
    };

    /**
    * Marks this result as disqualified, for reasons other than a missing
    * punch.
    */
    Result.prototype.disqualify = function () {
        this.isDisqualified = true;
    };

    /**
    * Marks this result as over maximum time.
    */
    Result.prototype.setOverMaxTime = function () {
        this.isOverMaxTime = true;
    };

    /**
    * Sets the name of the class that the result belongs to.
    * This is the course-class, not the result's age class.
    * @param {String} className The name of the class.
    */
    Result.prototype.setClassName = function (className) {
        this.className = className;
    };

    /**
     * Sets the control offsets of the various competitors that make up the team.
     * offsets[legIndex] should be the index of the start control of the competitor
     * who ran in leg 'legIndex'.
     * @param {Array} offsets The control offsets of the competitors.
     */
    Result.prototype.setOffsets = function (offsets) {
        this.offsets = offsets;
    };

    /**
    * Create and return a Result object where the times are given as a list of
    * cumulative times.
    *
    * This method does not assume that the data given has been 'repaired'.  This
    * function should therefore be used to create a result if the data may later
    * need to be repaired.
    *
    * @param {Number} order The order of the result.
    * @param {Number|null} startTime The start time, as seconds past midnight.
    * @param {Array} cumTimes Array of cumulative split times, as numbers, with
    *     nulls for missed controls.
    & @param {Object} owner The competitor or team that recorded this result.
    * @return {Result} Created result.
    */
    Result.fromOriginalCumTimes = function (order, startTime, cumTimes, owner) {
        var splitTimes = splitTimesFromCumTimes(cumTimes);
        return new Result(order, startTime, splitTimes, cumTimes, owner);
    };

    /**
    * Create and return a Result object where the times are given as a list of
    * cumulative times.
    *
    * This method assumes that the data given has been repaired, so it is ready
    * to be viewed.
    *
    * @param {Number} order The order of the result.
    * @param {Number|null} startTime The start time, as seconds past midnight.
    * @param {Array} cumTimes Array of cumulative split times, as numbers, with
    *     nulls for missed controls.
    & @param {Object} owner The competitor or team that recorded this result.
    * @return {Result} Created result.
    */
    Result.fromCumTimes = function (order, startTime, cumTimes, owner) {
        var result = Result.fromOriginalCumTimes(order, startTime, cumTimes, owner);
        result.splitTimes = result.originalSplitTimes;
        result.cumTimes = result.originalCumTimes;
        return result;
    };

    /**
    * Sets the 'repaired' cumulative times.  This also calculates the repaired
    * split times.
    * @param {Array} cumTimes The 'repaired' cumulative times.
    */
    Result.prototype.setRepairedCumulativeTimes = function (cumTimes) {
        this.cumTimes = cumTimes;
        this.splitTimes = splitTimesFromCumTimes(cumTimes);
    };

    /**
    * Returns whether this result indicated the competitor or team completed the
    * course and did not get
    * disqualified.
    * @return {Boolean} True if the competitor or team completed the course and
    *     did not get disqualified, false if they did not complete the course or
    *     got disqualified.
    */
    Result.prototype.completed = function () {
        return this.totalTime !== null && !this.isDisqualified && !this.isOverMaxTime;
    };

    /**
    * Returns whether the result has any times at all.
    * @return {Boolean} True if the result includes at least one time,
    *     false if the result has no times.
    */
    Result.prototype.hasAnyTimes = function () {
        // Trim the leading zero
        return this.originalCumTimes.slice(1).some(isNotNull);
    };

    /**
    * Returns the split to the given control.  If the control index given is zero
    * (i.e. the start), zero is returned.  If the competitor or team has no time
    * recorded for that control, null is returned.  If the value is missing,
    * because the value read from the file was invalid, NaN is returned.
    *
    * @param {Number} controlIndex Index of the control (0 = start).
    * @return {Number|null} The split time in seconds to the given control.
    */
    Result.prototype.getSplitTimeTo = function (controlIndex) {
        return (controlIndex === 0) ? 0 : this.splitTimes[controlIndex - 1];
    };

    /**
    * Returns the 'original' split to the given control.  This is always the
    * value read from the source data file, or derived directly from this data,
    * before any attempt was made to repair the data.
    *
    * If the control index given is zero (i.e. the start), zero is returned.
    * If no time is recorded for that control, null is returned.
    * @param {Number} controlIndex Index of the control (0 = start).
    * @return {Number|null} The split time in seconds to the given control.
    */
    Result.prototype.getOriginalSplitTimeTo = function (controlIndex) {
        if (this.isNonStarter) {
            return null;
        } else {
            return (controlIndex === 0) ? 0 : this.originalSplitTimes[controlIndex - 1];
        }
    };

    /**
    * Returns whether the control with the given index is deemed to have a
    * dubious split time.
    * @param {Number} controlIndex The index of the control.
    * @return {Boolean} True if the split time to the given control is dubious,
    *     false if not.
    */
    Result.prototype.isSplitTimeDubious = function (controlIndex) {
        return (controlIndex > 0 && this.originalSplitTimes[controlIndex - 1] !== this.splitTimes[controlIndex - 1]);
    };

    /**
    * Returns the cumulative split to the given control.  If the control index
    * given is zero (i.e. the start), zero is returned.   If there is no
    * cumulative time recorded for that control, null is returned.  If no time
    * is recorded, but the time was deemed to be invalid, NaN will be returned.
    * @param {Number} controlIndex Index of the control (0 = start).
    * @return {Number|null} The cumulative split time in seconds to the given control.
    */
    Result.prototype.getCumulativeTimeTo = function (controlIndex) {
        return this.cumTimes[controlIndex];
    };

    /**
    * Returns the 'original' cumulative time the competitor or team took to the
    * given control.  This is always the value read from the source data file,
    * before any attempt was made to repair the data.
    * @param {Number} controlIndex Index of the control (0 = start).
    * @return {Number|null} The cumulative split time in seconds to the given control.
    */
    Result.prototype.getOriginalCumulativeTimeTo = function (controlIndex) {
        return (this.isNonStarter) ? null : this.originalCumTimes[controlIndex];
    };

    /**
    * Returns whether the control with the given index is deemed to have a
    * dubious cumulative time.
    * @param {Number} controlIndex The index of the control.
    * @return {Boolean} True if the cumulative time to the given control is
    *     dubious, false if not.
    */
    Result.prototype.isCumulativeTimeDubious = function (controlIndex) {
        return this.originalCumTimes[controlIndex] !== this.cumTimes[controlIndex];
    };

    /**
    * Returns the rank of the split to the given control.  If the control index
    * given is zero (i.e. the start), or if there is no time recorded for that
    * control, or the ranks have not been set on this result, null is
    * returned.
    * @param {Number} controlIndex Index of the control (0 = start).
    * @return {Number|null} The split rank to the given control.
    */
    Result.prototype.getSplitRankTo = function (controlIndex) {
        return (this.splitRanks === null) ? null : this.splitRanks[controlIndex];
    };

    /**
    * Returns the rank of the cumulative split to the given control.  If the
    * control index given is zero (i.e. the start), or if there is no time
    * recorded for that control, or if the ranks have not been set on this
    * result, null is returned.
    * @param {Number} controlIndex Index of the control (0 = start).
    * @return {Number|null} The cumulative rank to the given control.
    */
    Result.prototype.getCumulativeRankTo = function (controlIndex) {
        return (this.cumRanks === null) ? null : this.cumRanks[controlIndex];
    };

    /**
    * Returns the time loss at the given control, or null if time losses cannot
    * be calculated or have not yet been calculated.
    * @param {Number} controlIndex Index of the control.
    * @return {Number|null} Time loss in seconds, or null.
    */
    Result.prototype.getTimeLossAt = function (controlIndex) {
        return (controlIndex === 0 || this.timeLosses === null) ? null : this.timeLosses[controlIndex - 1];
    };

    /**
    * Returns all of the cumulative time splits.
    * @return {Array} The cumulative split times in seconds for the competitor
    *     or team.
    */
    Result.prototype.getAllCumulativeTimes = function () {
        return this.cumTimes;
    };

    /**
    * Returns all of the original cumulative time splits.
    * @return {Array} The original cumulative split times in seconds for the
    *     competitor or team.
    */
    Result.prototype.getAllOriginalCumulativeTimes = function () {
        return this.originalCumTimes;
    };

    /**
    * Returns all of the split times.
    * @return {Array} The split times in seconds for the competitor or team.
    */
    Result.prototype.getAllSplitTimes = function () {
        return this.splitTimes;
    };

    /**
    * Returns whether this result is missing a start time.
    *
    * The result is missing its start time if it doesn't have a start time and
    * it also has at least one split.  This second condition allows the Race
    * Graph to be shown even if there are results with no times and no start
    * time.
    *
    * @return {Boolean} True if there is no a start time, false if there is, or
    *     if they have no other splits.
    */
    Result.prototype.lacksStartTime = function () {
        return this.startTime === null && this.splitTimes.some(isNotNull);
    };

    /**
    * Sets the split and cumulative-split ranks for this result.  The first
    * items in both arrays should be null, to indicate that the split and
    * cumulative ranks don't make any sense at the start.
    * @param {Array} splitRanks Array of split ranks for this result.
    * @param {Array} cumRanks Array of cumulative-split ranks for this result.
    */
    Result.prototype.setSplitAndCumulativeRanks = function (splitRanks, cumRanks) {
        if (splitRanks[0] !== null || cumRanks[0] !== null) {
            throwInvalidData("Split and cumulative ranks arrays must both start with null");
        }

        this.splitRanks = splitRanks;
        this.cumRanks = cumRanks;
    };

    /**
    * Return this result's cumulative times after being adjusted by a 'reference'
    * result.
    * @param {Array} referenceCumTimes The reference cumulative-split-time data
    *     to adjust by.
    * @return {Array} The array of adjusted data.
    */
    Result.prototype.getCumTimesAdjustedToReference = function (referenceCumTimes) {
        if (referenceCumTimes.length !== this.cumTimes.length) {
            throwInvalidData("Cannot adjust cumulative times because the numbers of times are different (" + this.cumTimes.length + " and " + referenceCumTimes.length + ")");
        } else if (referenceCumTimes.indexOf(null) > -1) {
            throwInvalidData("Cannot adjust cumulative times because a null value is in the reference data");
        }

        var adjustedTimes = this.cumTimes.map(function (time, idx) { return subtractIfNotNull(time, referenceCumTimes[idx]); });
        return adjustedTimes;
    };

    /**
    * Returns the cumulative times of this result with the start time added on.
    * @param {Array} referenceCumTimes The reference cumulative-split-time data to adjust by.
    * @param {Number|null} legIndex The leg index, or null for all legs.
    * @return {Array} The array of adjusted data.
    */
    Result.prototype.getCumTimesAdjustedToReferenceWithStartAdded = function (referenceCumTimes, legIndex) {
        var adjustedTimes = this.getCumTimesAdjustedToReference(referenceCumTimes);
        var startTime;
        if (legIndex === null || legIndex === 0) {
            startTime = this.startTime;
        } else {
            var offset = this.offsets[legIndex];
            startTime = this.startTime + this.cumTimes[offset] - adjustedTimes[offset];
        }
        return adjustedTimes.map(function (adjTime) { return addIfNotNull(adjTime, startTime); });
    };

    /**
    * Returns an array of percentages that this splits are behind when compared
    * to those of a reference result.
    * @param {Array} referenceCumTimes The reference cumulative split times
    * @return {Array} The array of percentages.
    */
    Result.prototype.getSplitPercentsBehindReferenceCumTimes = function (referenceCumTimes) {
        if (referenceCumTimes.length !== this.cumTimes.length) {
            throwInvalidData("Cannot determine percentages-behind because the numbers of times are different (" + this.cumTimes.length + " and " + referenceCumTimes.length + ")");
        } else if (referenceCumTimes.indexOf(null) > -1) {
            throwInvalidData("Cannot determine percentages-behind because a null value is in the reference data");
        }

        var percentsBehind = [0];
        this.splitTimes.forEach(function (splitTime, index) {
            if (splitTime === null) {
                percentsBehind.push(null);
            } else {
                var referenceSplit = referenceCumTimes[index + 1] - referenceCumTimes[index];
                if (referenceSplit > 0) {
                    percentsBehind.push(100 * (splitTime - referenceSplit) / referenceSplit);
                } else if (referenceSplit === 0) {
                    // A zero-time control is likely to be a timed-out road crossing where a limited amount
                    // of time was permitted and later removed. Add another point at the same position as the
                    // previous.
                    percentsBehind.push(percentsBehind.length === 0 ? 0 : percentsBehind[percentsBehind.length - 1]);
                } else {
                    percentsBehind.push(null);
                }
            }
        });

        return percentsBehind;
    };

    /**
    * Determines the time losses for this result.
    * @param {Array} fastestSplitTimes Array of fastest split times.
    */
    Result.prototype.determineTimeLosses = function (fastestSplitTimes) {
        if (this.completed()) {
            if (fastestSplitTimes.length !== this.splitTimes.length) {
                throwInvalidData("Cannot determine time loss with " + this.splitTimes.length + " split times using " + fastestSplitTimes.length + " fastest splits");
            }  else if (fastestSplitTimes.some(isNaNStrict)) {
                throwInvalidData("Cannot determine time loss when there is a NaN value in the fastest splits");
            }

            if (this.isOKDespiteMissingTimes || this.splitTimes.some(isNaNStrict)) {
                // There are some missing or dubious times.  Unfortunately
                // this means we cannot sensibly calculate the time losses.
                this.timeLosses = this.splitTimes.map(function () { return NaN; });
            } else {
                // We use the same algorithm for calculating time loss as the
                // original, with a simplification: we calculate split ratios
                // (split[i] / fastest[i]) rather than time loss rates
                // (split[i] - fastest[i])/fastest[i].  A control's split ratio
                // is its time loss rate plus 1.  Not subtracting one at the start
                // means that we then don't have to add it back on at the end.
                // We also exclude any controls where the fastest split is zero.

                var splitRatios = this.splitTimes.filter(function (splitTime, index) { return fastestSplitTimes[index] !== 0; })
                    .map(function (splitTime, index) { return splitTime / fastestSplitTimes[index]; });

                splitRatios.sort(d3.ascending);

                var medianSplitRatio;
                if (splitRatios.length === 0) {
                    medianSplitRatio = NaN;
                } else if (splitRatios.length % 2 === 1) {
                    medianSplitRatio = splitRatios[(splitRatios.length - 1) / 2];
                } else {
                    var midpt = splitRatios.length / 2;
                    medianSplitRatio = (splitRatios[midpt - 1] + splitRatios[midpt]) / 2;
                }

                this.timeLosses = this.splitTimes.map(function (splitTime, index) {
                    return Math.round(splitTime - fastestSplitTimes[index] * medianSplitRatio);
                });
            }
        }
    };

    /**
    * Returns whether this result 'crosses' another.  Two results are considered
    * to have crossed if their chart lines on the Race Graph cross.
    * @param {Result} other The result to compare against.
    * @param {Number|null} selectedLegIndex The index of the selected leg, or null to
    *     not filter by selected leg.
    * @return {Boolean} True if the results cross, false if they don't.
    */
    Result.prototype.crosses = function (other, selectedLegIndex) {
        if (other.cumTimes.length !== this.cumTimes.length) {
            throwInvalidData("Two results with different numbers of controls cannot cross");
        }

        // We determine whether two results cross by keeping track of whether
        // this result is ahead of other at any point, and whether this result
        // is behind the other one.  If both, the results cross.
        var beforeOther = false;
        var afterOther = false;

        // Determine the range of controls to check.
        var startIndex;
        var endIndex;
        if (selectedLegIndex === null || this.offsets === null) {
            startIndex = 0;
            endIndex = this.cumTimes.length;
        } else {
            startIndex = this.offsets[selectedLegIndex];
            endIndex = (selectedLegIndex + 1 === this.offsets.length) ? this.cumTimes.length : this.offsets[selectedLegIndex + 1] + 1;
        }

        for (var controlIdx = startIndex; controlIdx < endIndex; controlIdx += 1) {
            if (this.cumTimes[controlIdx] !== null && other.cumTimes[controlIdx] !== null) {
                var thisTotalTime = this.startTime + this.cumTimes[controlIdx];
                var otherTotalTime = other.startTime + other.cumTimes[controlIdx];
                if (thisTotalTime < otherTotalTime) {
                    beforeOther = true;
                } else if (thisTotalTime > otherTotalTime) {
                    afterOther = true;
                }
            }
        }

        return beforeOther && afterOther;
    };

    /**
    * Returns whether the given time has been omitted: i.e. it is dubious, or
    * it is missing but the result has been marked as OK despite that.
    * @param {Number|null} time The time to test.
    * @return {Boolean} True if the time is dubious or missing, false if not.
    */
    Result.prototype.isTimeOmitted = function (time) {
        return isNaNStrict(time) || (this.isOKDespiteMissingTimes && time === null);
    };

    /**
    * Returns an array of objects that record the indexes around which times in
    * the given array are omitted, due to the times being dubious or missing.
    * @param {Array} times Array of time values.
    * @return {Array} Array of objects that record indexes around omitted times.
    */
    Result.prototype.getIndexesAroundOmittedTimes = function (times) {
        var omittedTimeInfo = [];
        var startIndex = 1;
        while (startIndex + 1 < times.length) {
            if (this.isTimeOmitted(times[startIndex])) {
                var endIndex = startIndex;
                while (endIndex + 1 < times.length && this.isTimeOmitted(times[endIndex + 1])) {
                    endIndex += 1;
                }

                if (endIndex + 1 < times.length && times[startIndex - 1] !== null && times[endIndex + 1] !== null) {
                    omittedTimeInfo.push({start: startIndex - 1, end: endIndex + 1});
                }

                startIndex = endIndex + 1;

            } else {
                startIndex += 1;
            }
        }

        return omittedTimeInfo;
    };

    /**
    * Returns an array of objects that list the controls around those that have
    * omitted cumulative times.
    * @return {Array} Array of objects that detail the start and end indexes
    *     around omitted cumulative times.
    */
    Result.prototype.getControlIndexesAroundOmittedCumulativeTimes = function () {
        return this.getIndexesAroundOmittedTimes(this.cumTimes);
    };

    /**
    * Returns an array of objects that list the controls around those that have
    * omitted split times.
    * @return {Array} Array of objects that detail the start and end indexes
    *     around omitted split times.
    */
    Result.prototype.getControlIndexesAroundOmittedSplitTimes = function () {
        return this.getIndexesAroundOmittedTimes([0].concat(this.splitTimes));
    };

    /**
    * Returns the name of the owner for the leg with the given index.  If the
    * leg index is not null and this is a team result, the name of the corresponding
    * member is returned, otherwise the name of this result's owner is returned.
    * @param {Number|null} legIndex The index of the leg, or null for the team.
    * @return {String} The name of the owner for that leg.
    */
    Result.prototype.getOwnerNameForLeg = function (legIndex) {
        if (hasProperty(this.owner, "members") && legIndex !== null) {
            return this.owner.members[legIndex].name;
        } else {
            return this.owner.name;
        }
    };

    /**
    * Calculates and returns the offsets of the results.  The returned array
    * contains one offset for each result plus the overall total time in the
    * last element.
    * @param {Array} results The array of results.
    * @return {Array} Array of offsets.
    */
    function calculateOffsets(results) {
        var offsets = [0];
        results.forEach(function (comp, resultIndex) {

            // Calculate the offset for result resultIndex + 1.
            var lastOffset = offsets[offsets.length - 1];
            var nextResult = (resultIndex + 1 < results.length) ? results[resultIndex + 1] : null;
            var nextFinishTime;
            if (lastOffset !== null && comp.totalTime !== null) {
                // We have an offset for the last result and their total time.
                nextFinishTime = lastOffset + comp.totalTime;
            } else if (nextResult !== null && nextResult.startTime !== null && results[0].startTime !== null) {
                // Use the start time of the next result.
                nextFinishTime = nextResult.startTime - results[0].startTime;
            } else {
                nextFinishTime = null;
            }

            offsets.push(nextFinishTime);
        });

        // The above loop will add an item to the end of 'offsets' for the
        // finish time of the last competitor, but we don't need that.
        return offsets.slice(0, offsets.length - 1);
    }

    /**
    * Calculate the full list of cumulative times for a collection of results.
    * @param {Array} results The list of results.
    * @param {Array} offsets The offsets of the results.
    * @param {Function} cumulativeTimesGetter Function that returns a list of
    *     cumulative times from a result.
    * @return {Array} The full list of cumulative times.
    */
    function calculateCumulativeTimesFromResults(results, offsets, cumulativeTimesGetter) {
        var times = [0];
        for (var resultIndex = 0; resultIndex < results.length; resultIndex += 1) {
            var resultTimes = cumulativeTimesGetter(results[resultIndex]);
            for (var controlIndex = 1; controlIndex < resultTimes.length; controlIndex += 1) {
                times.push(addIfNotNull(offsets[resultIndex], resultTimes[controlIndex]));
            }
        }

        return times;
    }

    /**
    * Determines the status of a relay result from the status of the component
    * results and records it within this result.
    * @param {Array} results The array of component results.
    */
    Result.prototype.determineAggregateStatus = function (results) {
        if (results.some(function (result) { return result.isDisqualified; })) {
            this.isDisqualified = true;
            return;
        }

        if (results.every(function (result) { return result.isNonStarter; })) {
            this.isNonStarter = true;
            return;
        }

        // After this loop, okResultIndex points to the last OK result, or -1 if none.
        for (var okResultIndex = -1; okResultIndex + 1 < results.length; okResultIndex += 1) {
            var nextResult = results[okResultIndex + 1];
            if (nextResult.isNonStarter || nextResult.isNonFinisher || !nextResult.completed()) {
                break;
            }
        }

        // After this loop, dnsResultIndex points to the last DNS result, or the end of the list if none.
        for (var dnsResultIndex = results.length; dnsResultIndex > 0; dnsResultIndex -= 1) {
            var prevResult = results[dnsResultIndex - 1];
            if (!prevResult.isNonStarter) {
                break;
            }
        }

        if (okResultIndex < results.length - 1) {
            if (okResultIndex + 1 === dnsResultIndex) {
                // A run of OK results then some DNS ones.
                this.isNonFinisher = true;
                return;
            }

            if (okResultIndex + 2 === dnsResultIndex && results[okResultIndex + 1].isNonFinisher) {
                // A run of OK results then a DNF and then possibly some DNS ones.
                this.isNonFinisher = true;
                return;
            }
        }

        if (results.some(function (result) { return result.isOverMaxTime; })) {
            this.isOverMaxTime = true;
            return;
        }

        if (results.some(function (result) { return result.isNonCompetitive; })) {
            this.isNonCompetitive = true;
        }

        if (results.some(function (result) { return result.isOKDespiteMissingTimes; })) {
            this.setOKDespiteMissingTimes();
        }
    };

    /**
    * Restricts this result to common controls punched by all runners in legs of a
    * relay event.  This method is expected to only be used on a team result and only early
    * on in the lifecycle of a team result, before offsets are determined and before any
    * data repair is done.  It only updates the original cumulative and split times.  Also,
    * this method modifies the result in-place rather than returning a new result.
    * @param {Array} originalControls The list of lists of original controls for this result.
    * @param {Array} commonControls The list of lists of common controls for this result.
    */
    Result.prototype.restrictToCommonControls = function (originalControls, commonControls) {
        if (originalControls.length !== commonControls.length) {
            throwInvalidData("Should have two equal-length arrays of common controls");
        }

        var restrictedCumTimes = [0];
        var originalControlIndex = 1;

        for (var legIndex = 0; legIndex < originalControls.length; legIndex += 1) {
            var legOriginalControls = originalControls[legIndex];
            var legCommonControls = commonControls[legIndex];
            var commonControlIndex = 0;
            for (var controlIndex = 0; controlIndex < legOriginalControls.length; controlIndex += 1) {
                if (commonControlIndex < legCommonControls.length && legOriginalControls[controlIndex] === legCommonControls[commonControlIndex]) {
                    // This is a common control.
                    if (originalControlIndex >= this.originalCumTimes.length) {
                        throwInvalidData("Attempt to read too many original controls: likely that the wrong list of controls has been passed");
                    }


                    restrictedCumTimes.push(this.originalCumTimes[originalControlIndex]);
                    commonControlIndex += 1;
                }

                originalControlIndex += 1;
            }

            if (commonControlIndex < legCommonControls.length) {
                throwInvalidData("Did not reach end of common controls: likely that they are not a subset of the controls");
            }

            if (originalControlIndex >= this.originalCumTimes.length) {
                throwInvalidData("Attempt to read too many original controls: likely that the wrong list of controls has been passed");
            }

            // Add the finish time for this leg.
            restrictedCumTimes.push(this.originalCumTimes[originalControlIndex]);
            originalControlIndex += 1;
        }

        if (originalControlIndex < this.originalCumTimes.length) {
            throwInvalidData("Did not reach end of original controls: likely that a wrong list of controls has been passed");
        }

        this.originalCumTimes = restrictedCumTimes;
        this.originalSplitTimes = splitTimesFromCumTimes(restrictedCumTimes);
    };

    /**
    * Creates and returns a result object representing the combined result of all
    * of the given results.
    * @param {Number} order The order of the team among the others.
    * @param {Array} results The individual team member results.
    * @param {Object} owner The team that owns this result.
    * @return {Result} A result object for the entire team.
    */
    Result.createTeamResult = function (order, results, owner) {
        if (results.length < 2) {
            throwInvalidData("Team results can only be created from at least two other results");
        }

        // Firstly, compute cumulative-time offsets for each of the component results.
        var offsets = calculateOffsets(results);
        owner.setMembers(results.map(function (result) { return result.owner; }));

        var originalCumTimes = calculateCumulativeTimesFromResults(
            results, offsets, function (result) { return result.originalCumTimes; });

        var teamResult = Result.fromOriginalCumTimes(order, results[0].startTime, originalCumTimes, owner);
        if (results.every(function (result) { return result.cumTimes !== null; })) {
            teamResult.cumTimes = calculateCumulativeTimesFromResults(
                results, offsets, function (r) { return r.cumTimes; });
            teamResult.splitTimes = splitTimesFromCumTimes(teamResult.cumTimes);
        }

        teamResult.determineAggregateStatus(results);
        return teamResult;
    };

    SplitsBrowser.Model.Result = Result;
})();
/*
 *  SplitsBrowser Competitor - An individual competitor who competed at an event.
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

    /**
    * Object that represents the data for a single competitor.
    *
    * @constructor
    * @param {String} name The name of the competitor.
    * @param {String} club The name of the competitor's club.
    */
    function Competitor(name, club) {
        this.name = name;
        this.club = club;

        this.yearOfBirth = null;
        this.gender = null; // "M" or "F" for male or female.
    }

    /**
    * Sets the competitor's year of birth.
    * @param {Number} yearOfBirth The competitor's year of birth.
    */
    Competitor.prototype.setYearOfBirth = function (yearOfBirth) {
        this.yearOfBirth = yearOfBirth;
    };

    /**
    * Sets the competitor's gender.  This should be "M" or "F".
    * @param {String} gender The competitor's gender, "M" or "F".
    */
    Competitor.prototype.setGender = function (gender) {
        this.gender = gender;
    };

    SplitsBrowser.Model.Competitor = Competitor;
})();
/*
 *  SplitsBrowser Team - A team of competitors that competed at an event.
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

    /**
    * Object that represents the data for a single team.
    *
    * @constructor
    * @param {String} name The name of the team.
    * @param {String} club The name of the team's club.
    */
    function Team(name, club) {
        this.name = name;
        this.club = club;
    }

    /**
    * Sets the members of the team.
    * @param {Array} members The members of the team.
    */
    Team.prototype.setMembers = function (members) {
        this.members = members;
    };

    SplitsBrowser.Model.Team = Team;
})();
/*
 *  SplitsBrowser Common controls - Functionality for handling 'common controls'
 *  within relay events.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward.
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
(function() {

    var throwInvalidData = SplitsBrowser.throwInvalidData;

    // Constant value used to indicate that SplitsBrowser is in common-controls mode
    // when viewing relay data.
    SplitsBrowser.COMMON_CONTROLS_MODE = "commonControls";

    /**
    * Determines the common set of controls for a list of relay controls,
    * corresponding to one leg of the relay.
    * @param {Array} legControlsLists The list of controls for each leg.
    * @param {String} legDescription A description of the leg being processed.
    *     (This is only used in error messages.)
    */
    SplitsBrowser.determineCommonControls = function (legControlsLists, legDescription) {
        var controlCounts = d3.map();

        if (legControlsLists.length === 0) {
            throwInvalidData("Cannot determine the list of common controls of an empty array");
        }

        legControlsLists.forEach(function (legControls) {
            var controlsForThisLeg = d3.set();
            legControls.forEach(function (control) {
                if (!controlsForThisLeg.has(control)) {
                    controlsForThisLeg.add(control);
                    if (controlCounts.has(control)) {
                        controlCounts.set(control, controlCounts.get(control) + 1);
                    } else {
                        controlCounts.set(control, 1);
                    }
                }
            });
        });

        var teamCount = legControlsLists.length;

        var commonControls = legControlsLists[0].filter(
            function (control) { return controlCounts.get(control) === teamCount; });

        // Now verify that the common controls appear in the same order in each list of controls.
        for (var teamIndex = 1; teamIndex < teamCount; teamIndex += 1) {
            var commonControlsForThisTeamMember = legControlsLists[teamIndex].filter(
                function (control) { return controlCounts.get(control) === teamCount; });

            var controlsForThisLeg = d3.set();
            commonControlsForThisTeamMember.forEach(function (control) {
                if (controlsForThisLeg.has(control)) {
                    throwInvalidData(
                        "Cannot determine common controls because " + legDescription +
                        " contains duplicated control " + control);
                } else {
                    controlsForThisLeg.add(control);
                }
            });

            if (commonControlsForThisTeamMember.length !== commonControls.length) {
                throwInvalidData("Unexpectedly didn't get the same number of common controls for all competitors");
            }

            for (var index = 0; index < commonControls.length; index += 1) {
                if (commonControls[index] !== commonControlsForThisTeamMember[index]) {
                    throwInvalidData("Inconsistent ordering for control " + commonControls[index] + " in " + legDescription);
                }
            }
        }

        return commonControls;
    };
})();
/*
 *  SplitsBrowser CourseClass - A collection of runners competing against each other.
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
(function (){
    "use strict";

    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
     * Object that represents a collection of result data for a class.
     * @constructor.
     * @param {String} name Name of the class.
     * @param {Number} numControls Number of controls.
     * @param {Array} results Array of Result objects.
     */
    function CourseClass(name, numControls, results) {
        this.name = name;
        this.numControls = numControls;
        this.numbersOfControls = null;
        this.offsets = null;
        this.results = results;
        this.course = null;
        this.hasDubiousData = false;
        this.isTeamClass = false;
        this.results.forEach(function (result) {
            result.setClassName(name);
        });
    }

    /**
    * Records that this course-class has result data that SplitsBrowser has
    * deduced as dubious.
    */
    CourseClass.prototype.recordHasDubiousData = function () {
        this.hasDubiousData = true;
    };

    /**
    * Records that this course-class contains team results rather than
    * individual results.
    * @param {Array} numbersOfControls The numbers of controls on the relay legs.
    */
    CourseClass.prototype.setIsTeamClass = function (numbersOfControls) {
        this.isTeamClass = true;
        this.numbersOfControls = numbersOfControls;
        this.offsets = [0];
        for (var index = 1; index < numbersOfControls.length; index += 1) {
            this.offsets.push(this.offsets[index - 1] + numbersOfControls[index - 1] + 1);
        }
        this.results.forEach(function (result) {
            result.setOffsets(this.offsets);
        }, this);
    };

    /**
    * Determines the time losses for the results in this course-class.
    */
    CourseClass.prototype.determineTimeLosses = function () {
        var fastestSplitTimes = d3.range(1, this.numControls + 2).map(function (controlIdx) {
            var splitRec = this.getFastestSplitTo(controlIdx);
            return (splitRec === null) ? null : splitRec.split;
        }, this);

        this.results.forEach(function (result) {
            result.determineTimeLosses(fastestSplitTimes);
        });
    };

    /**
    * Returns whether this course-class is empty, i.e. has no results.
    * @return {Boolean} True if this course-class has no results, false if it
    *     has at least one result.
    */
    CourseClass.prototype.isEmpty = function () {
        return (this.results.length === 0);
    };

    /**
    * Sets the course that this course-class belongs to.
    * @param {SplitsBrowser.Model.Course} course The course this class belongs to.
    */
    CourseClass.prototype.setCourse = function (course) {
        this.course = course;
    };

    /**
    * Returns the fastest split time recorded by results in this class.  If
    * no fastest split time is recorded (e.g. because all results
    * mispunched that control, or the class is empty), null is returned.
    * @param {Number} controlIdx The index of the control to return the
    *      fastest split to.
    * @return {Object|null} Object containing the name and fastest split, or
    *      null if no split times for that control were recorded.
    */
    CourseClass.prototype.getFastestSplitTo = function (controlIdx) {
        if (typeof controlIdx !== "number" || controlIdx < 1 || controlIdx > this.numControls + 1) {
            throwInvalidData("Cannot return splits to leg '" + controlIdx + "' in a course with " + this.numControls + " control(s)");
        }

        var fastestSplit = null;
        var fastestResult = null;
        this.results.forEach(function (result) {
            var resultSplit = result.getSplitTimeTo(controlIdx);
            if (isNotNullNorNaN(resultSplit)) {
                if (fastestSplit === null || resultSplit < fastestSplit) {
                    fastestSplit = resultSplit;
                    fastestResult = result;
                }
            }
        });

        return (fastestSplit === null) ? null : {split: fastestSplit, name: fastestResult.owner.name};
    };

    /**
    * Returns all results that visited the control in the given time
    * interval.
    * @param {Number} controlNum The number of the control, with 0 being the
    *     start, and this.numControls + 1 being the finish.
    * @param {Number} intervalStart The start time of the interval, as
    *     seconds past midnight.
    * @param {Number} intervalEnd The end time of the interval, as seconds
    *     past midnight.
    * @return {Array} Array of objects listing the name and start time of each
    *     result visiting the control within the given time interval.
    */
    CourseClass.prototype.getResultsAtControlInTimeRange = function (controlNum, intervalStart, intervalEnd) {
        if (typeof controlNum !== "number" || isNaN(controlNum) || controlNum < 0 || controlNum > this.numControls + 1) {
            throwInvalidData("Control number must be a number between 0 and " + this.numControls + " inclusive");
        }

        var matchingResults = [];
        this.results.forEach(function (result) {
            var cumTime = result.getCumulativeTimeTo(controlNum);
            if (cumTime !== null && result.startTime !== null) {
                var actualTimeAtControl = cumTime + result.startTime;
                if (intervalStart <= actualTimeAtControl && actualTimeAtControl <= intervalEnd) {
                    matchingResults.push({name: result.owner.name, time: actualTimeAtControl});
                }
            }
        });

        return matchingResults;
    };

    SplitsBrowser.Model.CourseClass = CourseClass;
})();
/*
 *  SplitsBrowser Course - A single course at an event.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
    * A collection of 'classes', all runners within which ran the same physical
    * course.
    *
    * Course length and climb are both optional and can both be null.
    * @constructor
    * @param {String} name The name of the course.
    * @param {Array} classes Array of CourseClass objects comprising the course.
    * @param {Number|null} length Length of the course, in kilometres.
    * @param {Number|null} climb The course climb, in metres.
    * @param {Array|null} controls Array of codes of the controls that make
    *     up this course.  This may be null if no such information is provided.
    */
    function Course(name, classes, length, climb, controls) {
        this.name = name;
        this.classes = classes;
        this.length = length;
        this.climb = climb;
        this.controls = controls;
    }

    /** 'Magic' control code that represents the start. */
    Course.START = "__START__";

    /** 'Magic' control code that represents the finish. */
    Course.FINISH = "__FINISH__";

    /** 'Magic' control code that represents an intermediate start/finish control in a relay event */
    Course.INTERMEDIATE = "__INTERMEDIATE__";

    var START = Course.START;
    var FINISH = Course.FINISH;
    var INTERMEDIATE = Course.INTERMEDIATE;

    /**
    * Returns an array of the 'other' classes on this course.
    * @param {SplitsBrowser.Model.CourseClass} courseClass A course-class
    *    that should be on this course.
    * @return {Array} Array of other course-classes.
    */
    Course.prototype.getOtherClasses = function (courseClass) {
        var otherClasses = this.classes.filter(function (cls) { return cls !== courseClass; });
        if (otherClasses.length === this.classes.length) {
            // Given class not found.
            throwInvalidData("Course.getOtherClasses: given class is not in this course");
        } else {
            return otherClasses;
        }
    };

    /**
    * Returns the number of course-classes that use this course.
    * @return {Number} Number of course-classes that use this course.
    */
    Course.prototype.getNumClasses = function () {
        return this.classes.length;
    };

    /**
    * Returns whether this course has control code data.
    * @return {Boolean} true if this course has control codes, false if it does
    *     not.
    */
    Course.prototype.hasControls = function () {
        return (this.controls !== null);
    };

    /**
    * Returns the code of the control at the given number.
    *
    * The start is control number 0 and the finish has number one more than the
    * number of controls.  Numbers outside this range are invalid and cause an
    * exception to be thrown.
    *
    * The codes for the start and finish are given by the constants
    * SplitsBrowser.Model.Course.START and SplitsBrowser.Model.Course.FINISH.
    *
    * @param {Number} controlNum The number of the control.
    * @return {String} The code of the control, or one of the aforementioned
    *     constants for the start or finish.
    */
    Course.prototype.getControlCode = function (controlNum) {
        if (controlNum === 0) {
            // The start.
            return START;
        } else if (1 <= controlNum && controlNum <= this.controls.length) {
            return this.controls[controlNum - 1];
        } else if (controlNum === this.controls.length + 1) {
            // The finish.
            return FINISH;
        } else {
            throwInvalidData("Cannot get control code of control " + controlNum + " because it is out of range");
        }
    };

    /**
    * Returns whether this course uses the given leg.
    *
    * If this course lacks leg information, it is assumed not to contain any
    * legs and so will return false for every leg.
    *
    * @param {String} startCode Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Boolean} Whether this course uses the given leg.
    */
    Course.prototype.usesLeg = function (startCode, endCode) {
        return this.getLegNumber(startCode, endCode) >= 0;
    };

    /**
    * Returns the number of a leg in this course, given the start and end
    * control codes.
    *
    * The number of a leg is the number of the end control (so the leg from
    * control 3 to control 4 is leg number 4.)  The number of the finish
    * control is one more than the number of controls.
    *
    * A negative number is returned if this course does not contain this leg.
    *
    * @param {String} startCode Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Number} The control number of the leg in this course, or a
    *     negative number if the leg is not part of this course.
    */
    Course.prototype.getLegNumber = function (startCode, endCode) {
        if (this.controls === null) {
            // No controls, so no, it doesn't contain the leg specified.
            return -1;
        }

        if (startCode === START && endCode === FINISH) {
            // No controls - straight from the start to the finish.
            // This leg is only present, and is leg 1, if there are no
            // controls.
            return (this.controls.length === 0) ? 1 : -1;
        } else if (startCode === START) {
            // From the start to control 1.
            return (this.controls.length > 0 && this.controls[0] === endCode) ? 1 : -1;
        } else if (endCode === FINISH) {
            return (this.controls.length > 0 && this.controls[this.controls.length - 1] === startCode) ? (this.controls.length + 1) : -1;
        } else {
            for (var controlIdx = 1; controlIdx < this.controls.length; controlIdx += 1) {
                if (this.controls[controlIdx - 1] === startCode && this.controls[controlIdx] === endCode) {
                    return controlIdx + 1;
                }
            }

            // If we get here, the given leg is not part of this course.
            return -1;
        }
    };

    /**
    * Returns the fastest splits recorded for a given leg of the course.
    *
    * Note that this method should only be called if the course is known to use
    * the given leg.
    *
    * @param {String} startCode Code for the control at the start of the leg,
    *     or SplitsBrowser.Model.Course.START for the start.
    * @param {String} endCode Code for the control at the end of the leg, or
    *     SplitsBrowser.Model.Course.FINISH for the finish.
    * @return {Array} Array of fastest splits for each course-class using this
    *      course.
    */
    Course.prototype.getFastestSplitsForLeg = function (startCode, endCode) {
        if (this.legs === null) {
            throwInvalidData("Cannot determine fastest splits for a leg because leg information is not available");
        }

        var legNumber = this.getLegNumber(startCode, endCode);
        if (legNumber < 0) {
            var legStr = ((startCode === START || startCode === INTERMEDIATE) ? "start" : startCode) + " to " +
                ((endCode === FINISH || endCode === INTERMEDIATE) ? "end" : endCode);
            throwInvalidData("Leg from " +  legStr + " not found in course " + this.name);
        }

        var controlNum = legNumber;
        var fastestSplits = [];
        this.classes.forEach(function (courseClass) {
            var classFastest = courseClass.getFastestSplitTo(controlNum);
            if (classFastest !== null) {
                fastestSplits.push({name: classFastest.name, className: courseClass.name, split: classFastest.split});
            }
        });

        return fastestSplits;
    };

    /**
    * Returns a list of all results on this course that visit the control
    * with the given code in the time interval given.
    *
    * Specify SplitsBrowser.Model.Course.START for the start and
    * SplitsBrowser.Model.Course.FINISH for the finish.
    *
    * If the given control is not on this course, an empty list is returned.
    *
    * @param {String} controlCode Control code of the required control.
    * @param {Number} intervalStart The start of the interval, as seconds
    *     past midnight.
    * @param {Number} intervalEnd The end of the interval, as seconds past
    *     midnight.
    * @return {Array} Array of all results visiting the given control
    *     within the given time interval.
    */
    Course.prototype.getResultsAtControlInTimeRange = function (controlCode, intervalStart, intervalEnd) {
        if (this.controls === null) {
            // No controls means don't return any results.
            return [];
        } else if (controlCode === START) {
            return this.getResultsAtControlNumInTimeRange(0, intervalStart, intervalEnd);
        } else if (controlCode === FINISH) {
            return this.getResultsAtControlNumInTimeRange(this.controls.length + 1, intervalStart, intervalEnd);
        } else {
            // Be aware that the same control might be used more than once on a course.
            var lastControlIdx = -1;
            var matchingResults = [];
            var appendMatchingResult = function (result) { matchingResults.push(result); };
            while (true) {
                var controlIdx = this.controls.indexOf(controlCode, lastControlIdx + 1);
                if (controlIdx < 0) {
                    // No more occurrences of this control.
                    return matchingResults;
                } else {
                    var results = this.getResultsAtControlNumInTimeRange(controlIdx + 1, intervalStart, intervalEnd);
                    results.forEach(appendMatchingResult);
                    lastControlIdx = controlIdx;
                }
            }
        }
    };

    /**
    * Returns a list of all results on this course that visit the control
    * with the given number in the time interval given.
    *
    * @param {Number} controlNum The number of the control (0 = start).
    * @param {Number} intervalStart The start of the interval, as seconds
    *     past midnight.
    * @param {Number} intervalEnd The end of the interval, as seconds past
    *     midnight.
    * @return {Array} Array of all results visiting the given control
    *     within the given time interval.
    */
    Course.prototype.getResultsAtControlNumInTimeRange = function (controlNum, intervalStart, intervalEnd) {
        var matchingResults = [];
        this.classes.forEach(function (courseClass) {
            courseClass.getResultsAtControlInTimeRange(controlNum, intervalStart, intervalEnd).forEach(function (result) {
                matchingResults.push({name: result.name, time: result.time, className: courseClass.name});
            });
        });

        return matchingResults;
    };

    /**
    * Returns whether the course has the given control.
    * @param {String} controlCode The code of the control.
    * @return {Boolean} True if the course has the control, false if the
    *     course doesn't, or doesn't have any controls at all.
    */
    Course.prototype.hasControl = function (controlCode) {
        return this.controls !== null && this.controls.indexOf(controlCode) > -1;
    };

    /**
    * Returns the control code(s) of the control(s) after the one with the
    * given code.
    *
    * Controls can appear multiple times in a course.  If a control appears
    * multiple times, there will be multiple next controls.
    * @param {String} controlCode The code of the control.
    * @return {Array} The codes of the next controls.
    */
    Course.prototype.getNextControls = function (controlCode) {
        if (this.controls === null) {
            throwInvalidData("Course has no controls");
        } else if (controlCode === FINISH) {
            throwInvalidData("Cannot fetch next control after the finish");
        } else if (controlCode === START) {
            return [(this.controls.length === 0) ? FINISH : this.controls[0]];
        } else {
            var lastControlIdx = -1;
            var nextControls = [];
            do {
                var controlIdx = this.controls.indexOf(controlCode, lastControlIdx + 1);
                if (controlIdx === -1) {
                    break;
                } else if (controlIdx === this.controls.length - 1) {
                    nextControls.push(FINISH);
                } else {
                    nextControls.push(this.controls[controlIdx + 1]);
                }

                lastControlIdx = controlIdx;
            } while (true); // Loop exits when broken.

            if (nextControls.length === 0) {
                throwInvalidData("Control '" + controlCode + "' not found on course " + this.name);
            } else {
                return nextControls;
            }
        }
    };

    SplitsBrowser.Model.Course = Course;
})();
/*
 *  SplitsBrowser Event - Contains all of the courses for a single event.
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

    var Course = SplitsBrowser.Model.Course;

    /**
    * Contains all of the data for an event.
    * @param {Array} classes Array of CourseClass objects representing all of
    *     the classes of competitors.
    * @param {Array} courses Array of Course objects representing all of the
    *     courses of the event.
    * @param {Array} warnings Array of strings containing warning messages
    *     encountered when reading in the event dara.
    */
    function Event(classes, courses, warnings) {
        this.classes = classes;
        this.courses = courses;
        this.warnings = warnings;
    }

    /**
    * Determines time losses for each result in each class.
    *
    * This method should be called after reading in the event data but before
    * attempting to plot it.
    */
    Event.prototype.determineTimeLosses = function () {
        this.classes.forEach(function (courseClass) {
            courseClass.determineTimeLosses();
        });
    };

    /**
    * Returns whether the event data needs any repairing.
    *
    * The event data needs repairing if any results are missing their
    * 'repaired' cumulative times.
    *
    * @return {Boolean} True if the event data needs repairing, false
    *     otherwise.
    */
    Event.prototype.needsRepair = function () {
        return this.classes.some(function (courseClass) {
            return courseClass.results.some(function (result) {
                return (result.getAllCumulativeTimes() === null);
            });
        });
    };

    /**
    * Returns the fastest splits for each class on a given leg.
    *
    * The fastest splits are returned as an array of objects, where each object
    * lists the results name, the class, and the split time in seconds.
    *
    * @param {String} startCode Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Array} Array of objects containing fastest splits for that leg.
    */
    Event.prototype.getFastestSplitsForLeg = function (startCode, endCode) {
        var fastestSplits = [];
        this.courses.forEach(function (course) {
            if (course.usesLeg(startCode, endCode)) {
                fastestSplits = fastestSplits.concat(course.getFastestSplitsForLeg(startCode, endCode));
            }
        });

        fastestSplits.sort(function (a, b) { return d3.ascending(a.split, b.split); });

        return fastestSplits;
    };

    /**
    * Returns a list of results that visit the control with the given code
    * within the given time interval.
    *
    * The fastest splits are returned as an array of objects, where each object
    * lists the results name, the class, and the split time in seconds.
    *
    * @param {String} controlCode Code for the control.
    * @param {Number} intervalStart Start of the time interval, in seconds
    *     since midnight.
    * @param {Number|null} intervalEnd End of the time interval, in seconds, or
    *     null for the finish.
    * @return {Array} Array of objects containing fastest splits for that leg.
    */
    Event.prototype.getResultsAtControlInTimeRange = function (controlCode, intervalStart, intervalEnd) {
        var results = [];
        this.courses.forEach(function (course) {
            course.getResultsAtControlInTimeRange(controlCode, intervalStart, intervalEnd).forEach(function (result) {
                results.push(result);
            });
        });

        results.sort(function (a, b) { return d3.ascending(a.time, b.time); });

        return results;
    };

    /**
    * Returns the list of controls that follow after a given control.
    * @param {String} controlCode The code for the control.
    * @return {Array} Array of objects for each course using that control,
    *    with each object listing course name and next control.
    */
    Event.prototype.getNextControlsAfter = function (controlCode) {
        var courses = this.courses;
        if (controlCode !== Course.START) {
            courses = courses.filter(function (course) { return course.hasControl(controlCode); });
        }

        return courses.map(function (course) { return {course: course, nextControls: course.getNextControls(controlCode)}; });
    };

    SplitsBrowser.Model.Event = Event;
})();
﻿/*
 *  SplitsBrowser CSV - Reads in CSV result data files.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var isTrue = SplitsBrowser.isTrue;
    var isNotNull = SplitsBrowser.isNotNull;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;
    var Competitor = SplitsBrowser.Model.Competitor;
    var compareResults = SplitsBrowser.Model.compareResults;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    /**
    * Parse a row of competitor data.
    * @param {Number} index Index of the competitor line.
    * @param {String} line The line of competitor data read from a CSV file.
    * @param {Number} controlCount The number of controls (not including the finish).
    * @param {String} className The name of the class.
    * @param {Array} warnings Array of warnings to add any warnings found to.
    * @return {Object} Competitor object representing the competitor data read in.
    */
    function parseResults(index, line, controlCount, className, warnings) {
        // Expect forename, surname, club, start time then (controlCount + 1) split times in the form MM:SS.
        var parts = line.split(",");

        while (parts.length > controlCount + 5 && parts[3].match(/[^0-9.,:-]/)) {
            // As this line is too long and the 'start time' cell has something
            // that appears not to be a start time, assume that the club name
            // has a comma in it.
            parts[2] += "," + parts[3];
            parts.splice(3, 1);
        }

        var originalPartCount = parts.length;
        var forename = parts.shift() || "";
        var surname = parts.shift() || "";
        var name = (forename + " " + surname).trim() || "<name unknown>";
        if (originalPartCount === controlCount + 5) {
            var club = parts.shift();
            var startTimeStr = parts.shift();
            var startTime = parseTime(startTimeStr);
            if (startTime === 0) {
                startTime = null;
            } else if (!startTimeStr.match(/^\d{1,10}:\d\d:\d\d$/)) {
                // Start time given in hours and minutes instead of hours,
                // minutes and seconds.
                startTime *= 60;
            }

            var cumTimes = [0];
            var lastCumTimeRecorded = 0;
            parts.map(function (part) {
                var splitTime = parseTime(part);
                if (splitTime !== null && splitTime > 0) {
                    lastCumTimeRecorded += splitTime;
                    cumTimes.push(lastCumTimeRecorded);
                } else {
                    cumTimes.push(null);
                }
            });

            var result = fromCumTimes(index + 1, startTime, cumTimes, new Competitor(name, club));
            if (lastCumTimeRecorded === 0) {
                result.setNonStarter();
            }
            return result;
        } else {
            var difference = originalPartCount - (controlCount + 5);
            var error = (difference < 0) ? (-difference) + " too few" : difference + " too many";
            warnings.push("Competitor '" + name + "' appears to have the wrong number of split times - " + error +
                                  " (row " + (index + 1) + " of class '" + className + "')");
            return null;
        }
    }

    /**
    * Parse CSV data for a class.
    * @param {String} courseClass The string containing data for that class.
    * @param {Array} warnings Array of warnings to add any warnings found to.
    * @return {SplitsBrowser.Model.CourseClass} Parsed class data.
    */
    function parseCourseClass (courseClass, warnings) {
        var lines = courseClass.split(/\r?\n/).filter(isTrue);
        if (lines.length === 0) {
            throwInvalidData("parseCourseClass got an empty list of lines");
        }

        var firstLineParts = lines.shift().split(",");
        if (firstLineParts.length === 2) {
            var className = firstLineParts.shift();
            var controlCountStr = firstLineParts.shift();
            var controlCount = parseInt(controlCountStr, 10);
            if (isNaN(controlCount)) {
                throwInvalidData("Could not read control count: '" + controlCountStr + "'");
            } else if (controlCount < 0 && lines.length > 0) {
                // Only complain about a negative control count if there are
                // any results.  Event 7632 ends with a line 'NOCLAS,-1' -
                // we may as well ignore this.
                throwInvalidData("Expected a non-negative control count, got " + controlCount + " instead");
            } else {
                var results = lines.map(function (line, index) { return parseResults(index, line, controlCount, className, warnings); })
                                       .filter(isNotNull);

                results.sort(compareResults);
                return new CourseClass(className, controlCount, results);
            }
        } else {
            throwWrongFileFormat("Expected first line to have two parts (class name and number of controls), got " + firstLineParts.length + " part(s) instead");
        }
    }

    /**
    * Parse CSV data for an entire event.
    * @param {String} eventData String containing the entire event data.
    * @return {SplitsBrowser.Model.Event} All event data read in.
    */
    function parseEventData (eventData) {

        if (/<html/i.test(eventData)) {
            throwWrongFileFormat("Cannot parse this file as CSV as it appears to be HTML");
        }

        eventData = normaliseLineEndings(eventData);

        // Remove trailing commas.
        eventData = eventData.replace(/,{1,100}\n/g, "\n").replace(/,{1,100}$/, "");

        var classSections = eventData.split(/\n\n/).map(function (s) { return s.trim(); }).filter(isTrue);
        var warnings = [];

        var classes = classSections.map(function (section) { return parseCourseClass(section, warnings); });

        classes = classes.filter(function (courseClass) { return !courseClass.isEmpty(); });

        if (classes.length === 0) {
            throwInvalidData("No competitor data was found");
        }

        // Nulls are for the course length, climb and controls, which aren't in
        // the source data files, so we can't do anything about them.
        var courses = classes.map(function (cls) { return new Course(cls.name, [cls], null, null, null); });

        for (var i = 0; i < classes.length; i += 1) {
            classes[i].setCourse(courses[i]);
        }

        return new Event(classes, courses, warnings);
    }

    SplitsBrowser.Input.CSV = { parseEventData: parseEventData };
})();

/*
 *  SplitsBrowser OE Reader - Reads in OE CSV results data files.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var hasProperty = SplitsBrowser.hasProperty;
    var parseCourseLength = SplitsBrowser.parseCourseLength;
    var parseCourseClimb = SplitsBrowser.parseCourseClimb;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var Competitor = SplitsBrowser.Model.Competitor;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    var DELIMITERS = [";", ",", "\t", "\\"];

    // Indexes of the various columns relative to the column for control-1.

    var COLUMN_INDEXES = {};

    [44, 46, 60].forEach(function (columnOffset) {
        COLUMN_INDEXES[columnOffset] = {
            course: columnOffset - 7,
            distance: columnOffset - 6,
            climb: columnOffset - 5,
            controlCount: columnOffset - 4,
            placing: columnOffset - 3,
            startPunch: columnOffset - 2,
            finish: columnOffset - 1,
            control1: columnOffset
        };
    });

    [44, 46].forEach(function (columnOffset) {
        COLUMN_INDEXES[columnOffset].nonCompetitive = columnOffset - 38;
        COLUMN_INDEXES[columnOffset].startTime = columnOffset - 37;
        COLUMN_INDEXES[columnOffset].time = columnOffset - 35;
        COLUMN_INDEXES[columnOffset].classifier = columnOffset - 34;
        COLUMN_INDEXES[columnOffset].club =  columnOffset - 31;
        COLUMN_INDEXES[columnOffset].className = columnOffset - 28;
    });

    COLUMN_INDEXES[44].combinedName = 3;
    COLUMN_INDEXES[44].yearOfBirth = 4;

    COLUMN_INDEXES[46].forename = 4;
    COLUMN_INDEXES[46].surname = 3;
    COLUMN_INDEXES[46].yearOfBirth = 5;
    COLUMN_INDEXES[46].gender = 6;

    COLUMN_INDEXES[60].forename = 6;
    COLUMN_INDEXES[60].surname = 5;
    COLUMN_INDEXES[60].yearOfBirth = 7;
    COLUMN_INDEXES[60].gender = 8;
    COLUMN_INDEXES[60].combinedName = 3;
    COLUMN_INDEXES[60].nonCompetitive = 10;
    COLUMN_INDEXES[60].startTime = 11;
    COLUMN_INDEXES[60].time = 13;
    COLUMN_INDEXES[60].classifier = 14;
    COLUMN_INDEXES[60].club = 20;
    COLUMN_INDEXES[60].className = 26;
    COLUMN_INDEXES[60].classNameFallback = COLUMN_INDEXES[60].course;
    COLUMN_INDEXES[60].clubFallback = 18;

    // Minimum control offset.
    var MIN_CONTROLS_OFFSET = 37;

    /**
    * Remove any leading and trailing double-quotes from the given string.
    * @param {String} value The value to trim quotes from.
    * @return {String} The string with any leading and trailing quotes removed.
    */
    function dequote(value) {
        if (value[0] === '"' && value[value.length - 1] === '"') {
            value = value.substring(1, value.length - 1).replace(/""/g, '"').trim();
        }

        return value;
    }

    /**
    * Constructs an OE-format data reader.
    *
    * NOTE: The reader constructed can only be used to read data in once.
    * @constructor
    * @param {String} data The OE data to read in.
    */
    function Reader(data) {
        this.data = normaliseLineEndings(data);

        // Map that associates classes to all of the results running on
        // that class.
        this.classes = d3.map();

        // Map that associates course names to length and climb values.
        this.courseDetails = d3.map();

        // Set of all pairs of classes and courses.
        // (While it is common that one course may have multiple classes, it
        // seems also that one class can be made up of multiple courses, e.g.
        // M21E at BOC 2013.)
        this.classCoursePairs = [];

        // The indexes of the columns that we read data from.
        this.columnIndexes = null;

        // Warnings about results that cannot be read in.
        this.warnings = [];
    }

    /**
    * Identifies the delimiter character that delimits the columns of data.
    * @return {String} The delimiter character identified.
    */
    Reader.prototype.identifyDelimiter = function () {
        if (this.lines.length <= 1) {
            throwWrongFileFormat("No data found to read");
        }

        var firstDataLine = this.lines[1];
        for (var i = 0; i < DELIMITERS.length; i += 1) {
            var delimiter = DELIMITERS[i];
            if (firstDataLine.split(delimiter).length > MIN_CONTROLS_OFFSET) {
                return delimiter;
            }
        }

        throwWrongFileFormat("Data appears not to be in the OE CSV format");
    };

    /**
    * Identifies which variation on the OE CSV format we are parsing.
    *
    * At present, the only variations supported are 44-column, 46-column and
    * 60-column.  In all cases, the numbers count the columns before the
    * controls data.
    *
    * @param {String} delimiter The character used to delimit the columns of
    *     data.
    */
    Reader.prototype.identifyFormatVariation = function (delimiter) {

        var firstLine = this.lines[1].split(delimiter);

        var controlCodeRegexp = /^[A-Za-z0-9]{1,10}$/;
        for (var columnOffset in COLUMN_INDEXES) {
            if (hasProperty(COLUMN_INDEXES, columnOffset)) {
                // Convert columnOffset to a number.  It will presently be a
                // string because it is an object property.
                columnOffset = parseInt(columnOffset, 10);

                // We want there to be a control code at columnOffset, with
                // both preceding columns either blank or containing a valid
                // time.
                if (columnOffset < firstLine.length &&
                        controlCodeRegexp.test(firstLine[columnOffset]) &&
                        (firstLine[columnOffset - 2].trim() === "" || parseTime(firstLine[columnOffset - 2]) !== null) &&
                        (firstLine[columnOffset - 1].trim() === "" || parseTime(firstLine[columnOffset - 1]) !== null)) {

                    // Now check the control count exists.  If not, we've
                    // probably got a triple-column CSV file instead.
                    var controlCountColumnIndex = COLUMN_INDEXES[columnOffset].controlCount;
                    if (firstLine[controlCountColumnIndex].trim() !== "") {
                        this.columnIndexes = COLUMN_INDEXES[columnOffset];
                        return;
                    }
                }
            }
        }

        throwWrongFileFormat("Did not find control 1 at any of the supported indexes");
    };

    /**
    * Returns the name of the class in the given row.
    * @param {Array} row Array of row data.
    * @return {String} Class name.
    */
    Reader.prototype.getClassName = function (row) {
        var className = row[this.columnIndexes.className];
        if (className === "" && hasProperty(this.columnIndexes, "classNameFallback")) {
            // 'Nameless' variation: no class names.
            className = row[this.columnIndexes.classNameFallback];
        }
        return className;
    };

    /**
    * Reads the start-time in the given row.  The start punch time will
    * be used if it is available, otherwise the start time.
    * @param {Array} row Array of row data.
    * @return {Number|null} Parsed start time, or null for none.
    */
    Reader.prototype.getStartTime = function (row) {
        var startTimeStr = row[this.columnIndexes.startPunch];
        if (startTimeStr === "") {
            startTimeStr = row[this.columnIndexes.startTime];
        }

        return parseTime(startTimeStr);
    };

    /**
    * Returns the number of controls to expect on the given line.
    * @param {Array} row Array of row data items.
    * @param {Number} lineNumber The line number of the line.
    * @return {Number|null} The number of controls, or null if the count could not be read.
    */
    Reader.prototype.getNumControls = function (row, lineNumber) {
        var className = this.getClassName(row);
        var name;
        if (className.trim() === "") {
            name = this.getName(row) || "<name unknown>";
            this.warnings.push("Could not find a class for competitor '" + name + "' (line " + lineNumber + ")");
            return null;
        } else if (this.classes.has(className)) {
            return this.classes.get(className).numControls;
        } else {
            var numControls = parseInt(row[this.columnIndexes.controlCount], 10);
            if (isFinite(numControls)) {
                return numControls;
            } else {
                name = this.getName(row) || "<name unknown>";
                this.warnings.push("Could not read the control count '" + row[this.columnIndexes.controlCount] + "' for competitor '" + name + "' from line " + lineNumber);
                return null;
            }
        }
    };

    /**
    * Reads the cumulative times out of a row of competitor data.
    * @param {Array} row Array of row data items.
    * @param {Number} lineNumber Line number of the row within the source data.
    * @param {Number} numControls The number of controls to read.
    * @return {Array} Array of cumulative times.
    */
    Reader.prototype.readCumulativeTimes = function (row, lineNumber, numControls) {

        var cumTimes = [0];

        for (var controlIdx = 0; controlIdx < numControls; controlIdx += 1) {
            var cellIndex = this.columnIndexes.control1 + 1 + 2 * controlIdx;
            var cumTimeStr = (cellIndex < row.length) ? row[cellIndex] : null;
            var cumTime = (cumTimeStr === null) ? null : parseTime(cumTimeStr);
            cumTimes.push(cumTime);
        }

        var totalTime = parseTime(row[this.columnIndexes.time]);
        if (totalTime === null) {
            // 'Nameless' variation: total time missing, so calculate from
            // start and finish times.
            var startTime = this.getStartTime(row);
            var finishTime = parseTime(row[this.columnIndexes.finish]);
            if (startTime !== null && finishTime !== null) {
                totalTime = finishTime - startTime;
            }
        }

        cumTimes.push(totalTime);

        return cumTimes;
    };

    /**
    * Checks to see whether the given row contains a new class, and if so,
    * creates it.
    * @param {Array} row Array of row data items.
    * @param {Number} numControls The number of controls to read.
    */
    Reader.prototype.createClassIfNecessary = function (row, numControls) {
        var className = this.getClassName(row);
        if (!this.classes.has(className)) {
            this.classes.set(className, { numControls: numControls, results: [] });
        }
    };

    /**
    * Checks to see whether the given row contains a new course, and if so,
    * creates it.
    * @param {Array} row Array of row data items.
    * @param {Number} numControls The number of controls to read.
    */
    Reader.prototype.createCourseIfNecessary = function (row, numControls) {
        var courseName = row[this.columnIndexes.course];
        if (!this.courseDetails.has(courseName)) {
            var controlNums = d3.range(0, numControls).map(function (controlIdx) { return row[this.columnIndexes.control1 + 2 * controlIdx]; }, this);
            this.courseDetails.set(courseName, {
                length: parseCourseLength(row[this.columnIndexes.distance]),
                climb: parseCourseClimb(row[this.columnIndexes.climb]),
                controls: controlNums
            });
        }
    };

    /**
    * Checks to see whether the given row contains a class-course pairing that
    * we haven't seen so far, and adds one if not.
    * @param {Array} row Array of row data items.
    */
    Reader.prototype.createClassCoursePairIfNecessary = function (row) {
        var className = this.getClassName(row);
        var courseName = row[this.columnIndexes.course];

        if (!this.classCoursePairs.some(function (pair) { return pair[0] === className && pair[1] === courseName; })) {
            this.classCoursePairs.push([className, courseName]);
        }
    };

    /**
    * Reads the name of the competitor from the row.
    * @param {Array} row Array of row data items.
    * @return {String} The name of the competitor.
    */
    Reader.prototype.getName = function (row) {
        var name = "";

        if (hasProperty(this.columnIndexes, "forename") && hasProperty(this.columnIndexes, "surname")) {
            var forename = row[this.columnIndexes.forename];
            var surname = row[this.columnIndexes.surname];
            name = (forename + " " + surname).trim();
        }

        if (name === "" && hasProperty(this.columnIndexes, "combinedName")) {
            // 'Nameless' or 44-column variation.
            name = row[this.columnIndexes.combinedName];
        }

        return name;
    };

    /**
    * Reads in the competitor-specific data from the given row and adds it to
    * the event data read so far.
    * @param {Array} row Row of items read from a line of the input data.
    * @param {Array} cumTimes Array of cumulative times for the competitor.
    */
    Reader.prototype.addCompetitor = function (row, cumTimes) {

        var className = this.getClassName(row);
        var placing = row[this.columnIndexes.placing];
        var club = row[this.columnIndexes.club];
        if (club === "" && hasProperty(this.columnIndexes, "clubFallback")) {
            // Nameless variation: no club name, just number...
            club = row[this.columnIndexes.clubFallback];
        }

        var startTime = this.getStartTime(row);

        var name = this.getName(row);
        var isPlacingNonNumeric = (placing !== "" && isNaNStrict(parseInt(placing, 10)));
        if (isPlacingNonNumeric && name.substring(name.length - placing.length) === placing) {
            name = name.substring(0, name.length - placing.length).trim();
        }

        var order = this.classes.get(className).results.length + 1;
        var competitor = new Competitor(name, club);

        var yearOfBirthStr = row[this.columnIndexes.yearOfBirth];
        if (yearOfBirthStr !== "") {
            var yearOfBirth = parseInt(yearOfBirthStr, 10);
            if (!isNaNStrict(yearOfBirth)) {
                competitor.setYearOfBirth(yearOfBirth);
            }
        }

        if (hasProperty(this.columnIndexes, "gender")) {
            var gender = row[this.columnIndexes.gender];
            if (gender === "M" || gender === "F") {
                competitor.setGender(gender);
            }
        }

        var result = fromOriginalCumTimes(order, startTime, cumTimes, competitor);
        if ((row[this.columnIndexes.nonCompetitive] === "1" || isPlacingNonNumeric) && result.completed()) {
            // Competitor either marked as non-competitive, or has completed
            // the course but has a non-numeric placing.  In the latter case,
            // assume that they are non-competitive.
            result.setNonCompetitive();
        }

        var classifier = row[this.columnIndexes.classifier];
        if (classifier !== "") {
            if (classifier === "0" && cumTimes.indexOf(null) >= 0 && cumTimes[cumTimes.length - 1] !== null) {
                result.setOKDespiteMissingTimes();
            } else if (classifier === "1") {
                result.setNonStarter();
            } else if (classifier === "2") {
                result.setNonFinisher();
            } else if (classifier === "4") {
                result.disqualify();
            } else if (classifier === "5") {
                result.setOverMaxTime();
            }
        } else if (!result.hasAnyTimes()) {
            result.setNonStarter();
        }

        this.classes.get(className).results.push(result);
    };

    /**
    * Parses the given line and adds it to the event data accumulated so far.
    * @param {String} line The line to parse.
    * @param {Number} lineNumber The number of the line (used in error
    *     messages).
    * @param {String} delimiter The character used to delimit the columns of
    *     data.
    */
    Reader.prototype.readLine = function (line, lineNumber, delimiter) {

        if (line.trim() === "") {
            // Skip this blank line.
            return;
        }

        var row = line.split(delimiter).map(function (s) { return s.trim(); }).map(dequote);

        // Check the row is long enough to have all the data besides the
        // controls data.
        if (row.length < MIN_CONTROLS_OFFSET) {
            throwInvalidData("Too few items on line " + lineNumber + " of the input file: expected at least " + MIN_CONTROLS_OFFSET + ", got " + row.length);
        }

        var numControls = this.getNumControls(row, lineNumber);
        if (numControls !== null) {
            var cumTimes = this.readCumulativeTimes(row, lineNumber, numControls);

            this.createClassIfNecessary(row, numControls);
            this.createCourseIfNecessary(row, numControls);
            this.createClassCoursePairIfNecessary(row);

            this.addCompetitor(row, cumTimes);
        }
    };

    /**
    * Creates maps that describe the many-to-many join between the class names
    * and course names.
    * @return {Object} Object that contains two maps describing the
    *     many-to-many join.
    */
    Reader.prototype.getMapsBetweenClassesAndCourses = function () {

        var classesToCourses = d3.map();
        var coursesToClasses = d3.map();

        this.classCoursePairs.forEach(function (pair) {
            var className = pair[0];
            var courseName = pair[1];

            if (classesToCourses.has(className)) {
                classesToCourses.get(className).push(courseName);
            } else {
                classesToCourses.set(className, [courseName]);
            }

            if (coursesToClasses.has(courseName)) {
                coursesToClasses.get(courseName).push(className);
            } else {
                coursesToClasses.set(courseName, [className]);
            }
        });

        return {classesToCourses: classesToCourses, coursesToClasses: coursesToClasses};
    };

    /**
    * Creates and return a list of CourseClass objects from all of the data read.
    * @return {Array} Array of CourseClass objects.
    */
    Reader.prototype.createClasses = function () {
        var classNames = this.classes.keys();
        classNames.sort();
        return classNames.map(function (className) {
            var courseClass = this.classes.get(className);
            return new CourseClass(className, courseClass.numControls, courseClass.results);
        }, this);
    };

    /**
    * Find all of the courses and classes that are related to the given course.
    *
    * It's not always as simple as one course having multiple classes, as there
    * can be multiple courses for one single class, and even multiple courses
    * among multiple classes (e.g. M20E, M18E on courses 3, 3B at BOC 2013.)
    * Essentially, we have a many-to-many join, and we want to pull out of that
    * all of the classes and courses linked to the one course with the given
    * name.
    *
    * (For the graph theorists among you, imagine the bipartite graph with
    * classes on one side and courses on the other.  We want to find the
    * connected subgraph that this course belongs to.)
    *
    * @param {String} initCourseName The name of the initial course.
    * @param {Object} manyToManyMaps Object that contains the two maps that
    *     map between class names and course names.
    * @param {d3.set} doneCourseNames Set of all course names that have been
    *     'done', i.e. included in a Course object that has been returned from
    *     a call to this method.
    * @param {d3.map} classesMap Map that maps class names to CourseClass
    *     objects.
    * @return {SplitsBrowser.Model.Course} - The created Course object.
    */
    Reader.prototype.createCourseFromLinkedClassesAndCourses = function (initCourseName, manyToManyMaps, doneCourseNames, classesMap) {

        var courseNamesToDo = [initCourseName];
        var classNamesToDo = [];
        var relatedCourseNames = [];
        var relatedClassNames = [];

        var courseName;
        var className;

        while (courseNamesToDo.length > 0 || classNamesToDo.length > 0) {
            while (courseNamesToDo.length > 0) {
                courseName = courseNamesToDo.shift();
                var classNames = manyToManyMaps.coursesToClasses.get(courseName);
                for (var clsIdx = 0; clsIdx < classNames.length; clsIdx += 1) {
                    className = classNames[clsIdx];
                    if (classNamesToDo.indexOf(className) < 0 && relatedClassNames.indexOf(className) < 0) {
                        classNamesToDo.push(className);
                    }
                }

                relatedCourseNames.push(courseName);
            }

            while (classNamesToDo.length > 0) {
                className = classNamesToDo.shift();
                var courseNames = manyToManyMaps.classesToCourses.get(className);
                for (var crsIdx = 0; crsIdx < courseNames.length; crsIdx += 1) {
                    courseName = courseNames[crsIdx];
                    if (courseNamesToDo.indexOf(courseName) < 0 && relatedCourseNames.indexOf(courseName) < 0) {
                        courseNamesToDo.push(courseName);
                    }
                }

                relatedClassNames.push(className);
            }
        }

        // Mark all of the courses that we handled here as done.
        relatedCourseNames.forEach(function (courseName) {
            doneCourseNames.add(courseName);
        });

        var classesForThisCourse = relatedClassNames.map(function (className) { return classesMap.get(className); });
        var details = this.courseDetails.get(initCourseName);
        var course = new Course(initCourseName, classesForThisCourse, details.length, details.climb, details.controls);

        classesForThisCourse.forEach(function (courseClass) {
            courseClass.setCourse(course);
        });

        return course;
    };

    /**
    * Sort through the data read in and create Course objects representing each
    * course in the event.
    * @param {Array} classes Array of CourseClass objects read.
    * @return {Array} Array of course objects.
    */
    Reader.prototype.determineCourses = function (classes) {

        var manyToManyMaps = this.getMapsBetweenClassesAndCourses();

        // As we work our way through the courses and classes, we may find one
        // class made up from multiple courses (e.g. in BOC2013, class M21E
        // uses course 1A and 1B).  In this set we collect up all of the
        // courses that we have now processed, so that if we later come across
        // one we've already dealt with, we can ignore it.
        var doneCourseNames = d3.set();

        var classesMap = d3.map();
        classes.forEach(function (courseClass) {
            classesMap.set(courseClass.name, courseClass);
        });

        // List of all Course objects created so far.
        var courses = [];
        manyToManyMaps.coursesToClasses.keys().forEach(function (courseName) {
            if (!doneCourseNames.has(courseName)) {
                var course = this.createCourseFromLinkedClassesAndCourses(courseName, manyToManyMaps, doneCourseNames, classesMap);
                courses.push(course);
            }
        }, this);

        return courses;
    };

    /**
    * Parses the read-in data and returns it.
    * @return {SplitsBrowser.Model.Event} Event-data read.
    */
    Reader.prototype.parseEventData = function () {

        this.warnings = [];

        this.lines = this.data.split(/\n/);

        var delimiter = this.identifyDelimiter();

        this.identifyFormatVariation(delimiter);

        // Discard the header row.
        this.lines.shift();

        this.lines.forEach(function (line, lineIndex) {
            this.readLine(line, lineIndex + 1, delimiter);
        }, this);

        var classes = this.createClasses();
        if (classes.length === 0 && this.warnings.length > 0) {
            // A warning was generated for every single competitor in the file.
            // This file is quite probably not an OE-CSV file.
            throwWrongFileFormat("This file may have looked vaguely like an OE CSV file but no data could be read out of it");
        }

        var courses = this.determineCourses(classes);
        return new Event(classes, courses, this.warnings);
    };

    SplitsBrowser.Input.OE = {};

    /**
    * Parse OE data read from a semicolon-separated data string.
    * @param {String} data The input data string read.
    * @return {SplitsBrowser.Model.Event} All event data read.
    */
    SplitsBrowser.Input.OE.parseEventData = function (data) {
        var reader = new Reader(data);
        return reader.parseEventData();
    };
})();
/*
 *  SplitsBrowser HTML - Reads in HTML-format results data files.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var isNotNull = SplitsBrowser.isNotNull;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var parseCourseLength = SplitsBrowser.parseCourseLength;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var Competitor = SplitsBrowser.Model.Competitor;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    // Regexps to help with parsing.
    var HTML_TAG_STRIP_REGEXP = /<[^>]{1,200}>/g;
    var DISTANCE_FIND_REGEXP = /([0-9.,]{1,10})\s{0,10}(?:Km|km)/;
    var CLIMB_FIND_REGEXP = /(\d{1,10})\s{0,10}(?:Cm|Hm|hm|m)/;

    /**
    * Returns whether the given string is nonempty.
    * @param {String} string The string to check.
    * @return {Boolean} True if the string is neither null nor empty, false if it is null
    *     or empty.
    */
    function isNonEmpty(string) {
        return string !== null && string !== "";
    }

    /**
    * Returns whether the given string contains a number.  The string is
    * considered to contain a number if, after stripping whitespace, the string
    * is not empty and calling isFinite on it returns true.
    * @param {String} string The string to test.
    * @return {Boolean} True if the string contains a number, false if not.
    */
    function hasNumber(string) {
        string = string.trim();
        // isFinite is not enough on its own: isFinite("") is true.
        return string !== "" && isFinite(string);
    }

    /**
    * Splits a line by whitespace.
    * @param {String} line The line to split.
    * @return {Array} Array of whitespace-separated strings.
    */
    function splitByWhitespace (line) {
        return line.split(/\s+/g).filter(isNonEmpty);
    }

    /**
    * Strips all HTML tags from a string and returns the remaining string.
    * @param {String} text The HTML string to strip tags from.
    * @return {String} The input string with HTML tags removed.
    */
    function stripHtml(text) {
        return text.replace(HTML_TAG_STRIP_REGEXP, "");
    }

    /**
    * Returns all matches of the given regexp within the given text,
    * after being stripped of HTML.
    *
    * Note that it is recommended to pass this function a new regular
    * expression each time, rather than using a precompiled regexp.
    *
    * @param {RegExp} regexp The regular expression to find all matches of.
    * @param {String} text The text to search for matches within.
    * @return {Array} Array of strings representing the HTML-stripped regexp
    *     matches.
    */
    function getHtmlStrippedRegexMatches(regexp, text) {
        var matches = [];
        var match;
        while (true) {
            match = regexp.exec(text);
            if (match === null) {
                break;
            } else {
                matches.push(stripHtml(match[1]));
            }
        }

        return matches;
    }

    /**
    * Returns the contents of all <font> ... </font> elements within the given
    * text.  The contents of the <font> elements are stripped of all other HTML
    * tags.
    * @param {String} text The HTML string containing the <font> elements.
    * @return {Array} Array of strings of text inside <font> elements.
    */
    function getFontBits(text) {
        return getHtmlStrippedRegexMatches(/<font[^>]{0,100}>(.{0,100}?)<\/font>/g, text);
    }

    /**
    * Returns the contents of all <td> ... </td> elements within the given
    * text.  The contents of the <td> elements are stripped of all other HTML
    * tags.
    * @param {String} text The HTML string containing the <td> elements.
    * @return {Array} Array of strings of text inside <td> elements.
    */
    function getTableDataBits(text) {
        return getHtmlStrippedRegexMatches(/<td[^>]{0,100}>(.{0,100}?)<\/td>/g, text).map(function (s) { return s.trim(); });
    }

    /**
    * Returns the contents of all <td> ... </td> elements within the given
    * text.  The contents of the <td> elements are stripped of all other HTML
    * tags.  Empty matches are removed.
    * @param {String} text The HTML string containing the <td> elements.
    * @return {Array} Array of strings of text inside <td> elements.
    */
    function getNonEmptyTableDataBits(text) {
        return getTableDataBits(text).filter(function (bit) { return bit !== ""; });
    }

    /**
    * Returns the contents of all <th> ... </th> elements within the given
    * text.  The contents of the <th> elements are stripped of all other HTML
    * tags.  Empty matches are removed.
    * @param {String} text The HTML string containing the <td> elements.
    * @return {Array} Array of strings of text inside <td> elements.
    */
    function getNonEmptyTableHeaderBits(text) {
        var matches = getHtmlStrippedRegexMatches(/<th[^>]{0,100}>(.{0,100}?)<\/th>/g, text);
        return matches.filter(function (bit) { return bit !== ""; });
    }

    /**
    * Attempts to read a course distance from the given string.
    * @param {String} text The text string to read a course distance from.
    * @return {Number|null} The parsed course distance, or null if no
    *     distance could be parsed.
    */
    function tryReadDistance(text) {
        var distanceMatch = DISTANCE_FIND_REGEXP.exec(text);
        if (distanceMatch === null) {
            return null;
        } else {
            return parseCourseLength(distanceMatch[1]);
        }
    }

    /**
    * Attempts to read a course climb from the given string.
    * @param {String} text The text string to read a course climb from.
    * @return {Number|null} The parsed course climb, or null if no climb
    *     could be parsed.
    */
    function tryReadClimb(text) {
        var climbMatch = CLIMB_FIND_REGEXP.exec(text);
        if (climbMatch === null) {
            return null;
        } else {
            return parseInt(climbMatch[1], 10);
        }
    }

    /**
    * Reads control codes from an array of strings.  Each code should be of the
    * form num(code), with the exception of the finish, which, if it appears,
    * should contain no parentheses and must be the last.  The finish is
    * returned as null.
    * @param {Array} labels Array of string labels.
    * @return {Array} Array of control codes, with null indicating the finish.
    */
    function readControlCodes(labels) {
        var controlCodes = [];
        for (var labelIdx = 0; labelIdx < labels.length; labelIdx += 1) {
            var label = labels[labelIdx];
            var parenPos = label.indexOf("(");
            if (parenPos > -1 && label[label.length - 1] === ")") {
                var controlCode = label.substring(parenPos + 1, label.length - 1);
                controlCodes.push(controlCode);
            } else if (labelIdx + 1 === labels.length) {
                controlCodes.push(null);
            } else {
                throwInvalidData("Unrecognised control header label: '" + label + "'");
            }
        }

        return controlCodes;
    }

    /**
    * Removes from the given arrays of cumulative and split times any 'extra'
    * controls.
    *
    * An 'extra' control is a control that a competitor punches without it
    * being a control on their course.  Extra controls are indicated by the
    * split 'time' beginning with an asterisk.
    *
    * This method does not return anything, instead it mutates the arrays
    * given.
    *
    * @param {Array} cumTimes Array of cumulative times.
    * @param {Array} splitTimes Array of split times.
    */
    function removeExtraControls(cumTimes, splitTimes) {
        while (splitTimes.length > 0 && splitTimes[splitTimes.length - 1][0] === "*") {
            splitTimes.splice(splitTimes.length - 1, 1);
            cumTimes.splice(cumTimes.length - 1, 1);
        }
    }

    /**
    * Represents the result of parsing lines of competitor data.  This can
    * represent intermediate data as well as complete data.
    * @constructor
    * @param {String} name The name of the competitor.
    * @param {String} club The name of the competitor's club.
    * @param {String} className The class of the competitor.
    * @param {Number|null} totalTime The total time taken by the competitor, or
    *     null for no total time.
    * @param {Array} cumTimes Array of cumulative split times.
    * @param {Boolean} competitive Whether the competitor's run is competitive.
    */
    function CompetitorParseRecord(name, club, className, totalTime, cumTimes, competitive) {
        this.name = name;
        this.club = club;
        this.className = className;
        this.totalTime = totalTime;
        this.cumTimes = cumTimes;
        this.competitive = competitive;
    }

    /**
    * Returns whether this competitor record is a 'continuation' record.
    * A continuation record is one that has no name, club, class name or total
    * time.  Instead it represents the data read from lines of data other than
    * the first two.
    * @return {Boolean} True if the record is a continuation record, false if not.
    */
    CompetitorParseRecord.prototype.isContinuation = function () {
        return (this.name === "" && this.club === "" && this.className === null && this.totalTime === "" && !this.competitive);
    };

    /**
    * Appends the cumulative split times in another CompetitorParseRecord to
    * this one.  The one given must be a 'continuation' record.
    * @param {CompetitorParseRecord} other The record whose cumulative times
    *     we wish to append.
    */
    CompetitorParseRecord.prototype.append = function (other) {
        if (other.isContinuation()) {
            this.cumTimes = this.cumTimes.concat(other.cumTimes);
        } else {
            throw new Error("Can only append a continuation CompetitorParseRecord");
        }
    };

    /**
    * Creates a Result object from this CompetitorParseRecord object.
    * @param {Number} order The number of this result within their class
    *     (1=first, 2=second, ...).
    * @return {Result} Converted result object.
    */
    CompetitorParseRecord.prototype.toResult = function (order) {
        // Prepend a zero cumulative time.
        var cumTimes = [0].concat(this.cumTimes);

        // The null is for the start time.
        var result =  fromOriginalCumTimes(order, null, cumTimes, new Competitor(this.name, this.club));
        if (result.completed() && !this.competitive) {
            result.setNonCompetitive();
        }

        if (!result.hasAnyTimes()) {
            result.setNonStarter();
        }

        return result;
    };

    /*
    * There are three types of HTML format supported by this parser: one that is
    * based on pre-formatted text, one that is based around a single HTML table,
    * and one that uses many HTML tables.  The overall strategy when parsing
    * any format is largely the same, but the exact details vary.
    *
    * A 'Recognizer' is used to handle the finer details of the format parsing.
    * A recognizer should contain methods 'isTextOfThisFormat',
    * 'preprocess', 'canIgnoreThisLine', 'isCourseHeaderLine',
    * 'parseCourseHeaderLine', 'parseControlsLine' and 'parseCompetitor'.
    * See the documentation on the objects below for more information about
    * what these methods do.
    */

    /**
    * A Recognizer that handles the 'older' HTML format based on preformatted
    * text.
    * @constructor
    */
    var OldHtmlFormatRecognizer = function () {
        // There exists variations of the format depending on what the second
        // <font> ... </font> element on each row contains.  It can be blank,
        // contain a number (start number, perhaps?) or something else.
        // If blank or containing a number, the competitor's name is in column
        // 2 and there are four preceding columns.  Otherwise the competitor's
        // name is in column 1 and there are three preceding columns.
        this.precedingColumnCount = null;
    };

    /**
    * Returns whether this recognizer is likely to recognize the given HTML
    * text and possibly be able to parse it.  If this method returns true, the
    * parser will use this recognizer to attempt to parse the HTML.  If it
    * returns false, the parser will not use this recognizer.  Other methods on
    * this object can therefore assume that this method has returned true.
    *
    * As this recognizer is for recognizing preformatted text which also uses a
    * lot of &lt;font&gt; elements, it simply checks for the presence of
    * HTML &lt;pre&gt; and &lt;font&gt; elements.
    *
    * @param {String} text The entire input text read in.
    * @return {Boolean} True if the text contains any pre-formatted HTML, false
    *     otherwise.
    */
    OldHtmlFormatRecognizer.prototype.isTextOfThisFormat = function (text) {
        return (text.indexOf("<pre>") >= 0 && text.indexOf("<font") >= 0);
    };

    /**
    * Performs some pre-processing on the text before it is read in.
    *
    * This object strips everything up to and including the opening
    * &lt;pre&gt; tag, and everything from the closing &lt;/pre&gt; tag
    * to the end of the text.
    *
    * @param {String} text The HTML text to preprocess.
    * @return {String} The preprocessed text.
    */
    OldHtmlFormatRecognizer.prototype.preprocess = function (text) {
        var prePos = text.indexOf("<pre>");
        if (prePos === -1) {
            throw new Error("Cannot find opening pre tag");
        }

        var lineEndPos = text.indexOf("\n", prePos);
        text = text.substring(lineEndPos + 1);

        // Replace blank lines.
        text = text.replace(/\n{2,}/g, "\n");

        var closePrePos = text.lastIndexOf("</pre>");
        if (closePrePos === -1) {
            throwInvalidData("Found opening <pre> but no closing </pre>");
        }

        lineEndPos = text.lastIndexOf("\n", closePrePos);
        text = text.substring(0, lineEndPos);
        return text.trim();
    };

    /**
    * Returns whether the HTML parser can ignore the given line altogether.
    *
    * The parser will call this method with every line read in, apart from
    * the second line of each pair of competitor data rows.  These are always
    * assumed to be in pairs.
    *
    * This recognizer ignores only blank lines.
    *
    * @param {String} line The line to check.
    * @return {Boolean} True if the line should be ignored, false if not.
    */
    OldHtmlFormatRecognizer.prototype.canIgnoreThisLine = function (line) {
        return line === "";
    };

    /**
    * Returns whether the given line is the first line of a course.
    *
    * If so, it means the parser has finished processing the previous course
    * (if any), and can start a new course.
    *
    * This recognizer treats a line with exactly two
    * &lt;font&gt;...&lt;/font&gt; elements as a course header line, and
    * anything else not.
    *
    * @param {String} line The line to check.
    * @return {Boolean} True if this is the first line of a course, false
    *     otherwise.
    */
    OldHtmlFormatRecognizer.prototype.isCourseHeaderLine = function (line) {
        return (getFontBits(line).length === 2);
    };

    /**
    * Parse a course header line and return the course name, distance and
    * climb.
    *
    * This method can assume that the line given is a course header line.
    *
    * @param {String} line The line to parse course details from.
    * @return {Object} Object containing the parsed course details.
    */
    OldHtmlFormatRecognizer.prototype.parseCourseHeaderLine = function (line) {
        var bits = getFontBits(line);
        if (bits.length !== 2) {
            throw new Error("Course header line should have two parts");
        }

        var nameAndControls = bits[0];
        var distanceAndClimb = bits[1];

        var openParenPos = nameAndControls.indexOf("(");
        var courseName = (openParenPos > -1) ? nameAndControls.substring(0, openParenPos) : nameAndControls;

        var distance = tryReadDistance(distanceAndClimb);
        var climb = tryReadClimb(distanceAndClimb);

        return {
            name: courseName.trim(),
            distance: distance,
            climb: climb
        };
    };

    /**
    * Parse control codes from the given line and return a list of them.
    *
    * This method can assume that the previous line was the course header or a
    * previous control line.  It should also return null for the finish, which
    * should have no code.  The finish is assumed to he the last.
    *
    * @param {String} line The line to parse control codes from.
    * @return {Array} Array of control codes.
    */
    OldHtmlFormatRecognizer.prototype.parseControlsLine = function (line) {
        var lastFontPos = line.lastIndexOf("</font>");
        var controlsText = (lastFontPos === -1) ? line : line.substring(lastFontPos + "</font>".length);

        var controlLabels = splitByWhitespace(controlsText.trim());
        return readControlCodes(controlLabels);
    };

    /**
    * Read either cumulative or split times from the given line of competitor
    * data.
    * (This method is not used by the parser, only elsewhere in the recognizer.)
    * @param {String} line The line to read the times from.
    * @return {Array} Array of times.
    */
    OldHtmlFormatRecognizer.prototype.readCompetitorSplitDataLine = function (line) {
        for (var i = 0; i < this.precedingColumnCount; i += 1) {
            var closeFontPos = line.indexOf("</font>");
            line = line.substring(closeFontPos + "</font>".length);
        }

        var times = splitByWhitespace(stripHtml(line));
        return times;
    };

    /**
    * Parse two lines of competitor data into a CompetitorParseRecord object
    * containing the data.
    * @param {String} firstLine The first line of competitor data.
    * @param {String} secondLine The second line of competitor data.
    * @return {CompetitorParseRecord} The parsed competitor.
    */
    OldHtmlFormatRecognizer.prototype.parseCompetitor = function (firstLine, secondLine) {
        var firstLineBits = getFontBits(firstLine);
        var secondLineBits = getFontBits(secondLine);

        if (this.precedingColumnCount === null) {
            // If column 1 is blank or a number, we have four preceding
            // columns.  Otherwise we have three.
            var column1 = firstLineBits[1].trim();
            this.precedingColumnCount = (column1.match(/^\d{0,10}$/)) ? 4 : 3;
        }

        var competitive = hasNumber(firstLineBits[0]);
        var name = firstLineBits[this.precedingColumnCount - 2].trim();
        var totalTime = firstLineBits[this.precedingColumnCount - 1].trim();
        var club = secondLineBits[this.precedingColumnCount - 2].trim();

        var cumulativeTimes = this.readCompetitorSplitDataLine(firstLine);
        var splitTimes = this.readCompetitorSplitDataLine(secondLine);
        cumulativeTimes = cumulativeTimes.map(parseTime);

        removeExtraControls(cumulativeTimes, splitTimes);

        var className = null;
        if (name !== null && name !== "") {
            var lastCloseFontPos = -1;
            for (var i = 0; i < this.precedingColumnCount; i += 1) {
                lastCloseFontPos = firstLine.indexOf("</font>", lastCloseFontPos + 1);
            }

            var firstLineUpToLastPreceding = firstLine.substring(0, lastCloseFontPos + "</font>".length);
            var firstLineMinusFonts = firstLineUpToLastPreceding.replace(/<font[^>]{0,100}>(.{0,100}?)<\/font>/g, "");
            var lineParts = splitByWhitespace(firstLineMinusFonts);
            if (lineParts.length > 0) {
                className = lineParts[0];
            }
        }

        return new CompetitorParseRecord(name, club, className, totalTime, cumulativeTimes, competitive);
    };

    /**
    * Constructs a recognizer for formatting the 'newer' format of HTML
    * event results data.
    *
    * Data in this format is given within a number of HTML tables, three per
    * course.
    * @constructor
    */
    var NewHtmlFormatRecognizer = function () {
        this.timesOffset = null;
    };

    /**
    * Returns whether this recognizer is likely to recognize the given HTML
    * text and possibly be able to parse it.  If this method returns true, the
    * parser will use this recognizer to attempt to parse the HTML.  If it
    * returns false, the parser will not use this recognizer.  Other methods on
    * this object can therefore assume that this method has returned true.
    *
    * As this recognizer is for recognizing HTML formatted in tables, it
    * returns whether the number of HTML &lt;table&gt; tags is at least five.
    * Each course uses three tables, and there are two HTML tables before the
    * courses.
    *
    * @param {String} text The entire input text read in.
    * @return {Boolean} True if the text contains at least five HTML table
    *     tags.
    */
    NewHtmlFormatRecognizer.prototype.isTextOfThisFormat = function (text) {
        var tablePos = -1;
        for (var i = 0; i < 5; i += 1) {
            tablePos = text.indexOf("<table", tablePos + 1);
            if (tablePos === -1) {
                // Didn't find another table.
                return false;
            }
        }

        return true;
    };

    /**
    * Performs some pre-processing on the text before it is read in.
    *
    * This recognizer performs a fair amount of pre-processing, to remove
    * parts of the file we don't care about, and to reshape what there is left
    * so that it is in a more suitable form to be parsed.
    *
    * @param {String} text The HTML text to preprocess.
    * @return {String} The preprocessed text.
    */
    NewHtmlFormatRecognizer.prototype.preprocess = function (text) {
        // Remove the first table and end of the <div> it is contained in.
        var tableEndPos = text.indexOf("</table>");
        if (tableEndPos === -1) {
            throwInvalidData("Could not find any closing </table> tags");
        }

        text = text.substring(tableEndPos + "</table>".length);

        var closeDivPos = text.indexOf("</div>");
        var openTablePos = text.indexOf("<table");
        if (closeDivPos > -1 && closeDivPos < openTablePos) {
            text = text.substring(closeDivPos + "</div>".length);
        }

        // Rejig the line endings so that each row of competitor data is on its
        // own line, with table and table-row tags starting on new lines,
        // and closing table and table-row tags at the end of lines.
        text = text.replace(/>\n{1,100}</g, "><").replace(/><tr>/g, ">\n<tr>").replace(/<\/tr></g, "</tr>\n<")
                   .replace(/><table/g, ">\n<table").replace(/<\/table></g, "</table>\n<");

        // Remove all <col> elements.
        text = text.replace(/<\/col[^>]{0,100}>/g, "");

        // Remove all rows that contain only a single non-breaking space.
        // In the file I have, the &nbsp; entities are missing their
        // semicolons.  However, this could well be fixed in the future.
        text = text.replace(/<tr[^>]{0,100}><td[^>]{0,100}>(?:<nobr>)?&nbsp;?(?:<\/nobr>)?<\/td><\/tr>/g, "");

        // Remove any anchor elements used for navigation...
        text = text.replace(/<a id="[^"]{0,100}"><\/a>/g, "");

        // ... and the navigation div.
        var startNavigationDivPos = text.indexOf('<div id="navigation">');
        if (startNavigationDivPos >= 0) {
            var endNavigationDivPos = text.indexOf("</div>", startNavigationDivPos);
            if (endNavigationDivPos >= 0) {
                text = text.substring(0, startNavigationDivPos) + text.substring(endNavigationDivPos + 6);
            }
        }

        // Finally, remove the trailing </body> and </html> elements.
        text = text.replace("</body></html>", "");

        return text.trim();
    };

    /**
    * Returns whether the HTML parser can ignore the given line altogether.
    *
    * The parser will call this method with every line read in, apart from
    * the second line of each pair of competitor data rows.  These are always
    * assumed to be in pairs.  This recognizer takes advantage of this to scan
    * the course header tables to see if class names are included.
    *
    * This recognizer ignores blank lines. It also ignores any that contain
    * opening or closing HTML table tags.  This is not a problem because the
    * preprocessing has ensured that the table data is not in the same line.
    *
    * @param {String} line The line to check.
    * @return {Boolean} True if the line should be ignored, false if not.
    */
    NewHtmlFormatRecognizer.prototype.canIgnoreThisLine = function (line) {
        if (line.indexOf("<th>") > -1) {
            var bits = getNonEmptyTableHeaderBits(line);
            this.timesOffset = bits.length;
            return true;
        } else {
            return (line === "" || line.indexOf("<table") > -1 || line.indexOf("</table>") > -1);
        }
    };


    /**
    * Returns whether the given line is the first line of a course.
    *
    * If so, it means the parser has finished processing the previous course
    * (if any), and can start a new course.
    *
    * This recognizer treats a line that contains a table-data cell with ID
    * "header" as the first line of a course.
    *
    * @param {String} line The line to check.
    * @return {Boolean} True if this is the first line of a course, false
    *     otherwise.
    */
    NewHtmlFormatRecognizer.prototype.isCourseHeaderLine = function (line) {
        return line.indexOf('<td id="header"') > -1;
    };

    /**
    * Parse a course header line and return the course name, distance and
    * climb.
    *
    * This method can assume that the line given is a course header line.
    *
    * @param {String} line The line to parse course details from.
    * @return {Object} Object containing the parsed course details.
    */
    NewHtmlFormatRecognizer.prototype.parseCourseHeaderLine = function (line) {
        var dataBits = getNonEmptyTableDataBits(line);
        if (dataBits.length === 0) {
            throwInvalidData("No parts found in course header line");
        }

        var name = dataBits[0];
        var openParenPos = name.indexOf("(");
        if (openParenPos > -1) {
            name = name.substring(0, openParenPos);
        }

        name = name.trim();

        var distance = null;
        var climb = null;

        for (var bitIndex = 1; bitIndex < dataBits.length; bitIndex += 1) {
            if (distance === null) {
                distance = tryReadDistance(dataBits[bitIndex]);
            }

            if (climb === null) {
                climb = tryReadClimb(dataBits[bitIndex]);
            }
        }

        return {name: name, distance: distance, climb: climb };
    };

    /**
    * Parse control codes from the given line and return a list of them.
    *
    * This method can assume that the previous line was the course header or a
    * previous control line.  It should also return null for the finish, which
    * should have no code.  The finish is assumed to he the last.
    *
    * @param {String} line The line to parse control codes from.
    * @return {Array} Array of control codes.
    */
    NewHtmlFormatRecognizer.prototype.parseControlsLine = function (line) {
        var bits = getNonEmptyTableDataBits(line);
        return readControlCodes(bits);
    };

    /**
    * Read either cumulative or split times from the given line of competitor
    * data.
    * (This method is not used by the parser, only elsewhere in the recognizer.)
    * @param {String} line The line to read the times from.
    * @return {Array} Array of times.
    */
    NewHtmlFormatRecognizer.prototype.readCompetitorSplitDataLine = function (line) {
        var bits = getTableDataBits(line);

        var startPos = this.timesOffset;

        // Discard the empty bits at the end.
        var endPos = bits.length;
        while (endPos > 0 && bits[endPos - 1] === "") {
            endPos -= 1;
        }

        return bits.slice(startPos, endPos).filter(isNonEmpty);
    };

    /**
    * Parse two lines of competitor data into a CompetitorParseRecord object
    * containing the data.
    * @param {String} firstLine The first line of competitor data.
    * @param {String} secondLine The second line of competitor data.
    * @return {CompetitorParseRecord} The parsed competitor.
    */
    NewHtmlFormatRecognizer.prototype.parseCompetitor = function (firstLine, secondLine) {
        var firstLineBits = getTableDataBits(firstLine);
        var secondLineBits = getTableDataBits(secondLine);

        var competitive = hasNumber(firstLineBits[0]);
        var nameOffset = (this.timesOffset === 3) ? 1 : 2;
        var name = firstLineBits[nameOffset];
        var totalTime = firstLineBits[this.timesOffset - 1];
        var club = secondLineBits[nameOffset];

        var className = (this.timesOffset === 5 && name !== "") ? firstLineBits[3] : null;

        var cumulativeTimes = this.readCompetitorSplitDataLine(firstLine);
        var splitTimes = this.readCompetitorSplitDataLine(secondLine);
        cumulativeTimes = cumulativeTimes.map(parseTime);

        removeExtraControls(cumulativeTimes, splitTimes);

        var nonZeroCumTimeCount = cumulativeTimes.filter(isNotNull).length;

        if (nonZeroCumTimeCount !== splitTimes.length) {
            throwInvalidData("Cumulative and split times do not have the same length: " + nonZeroCumTimeCount + " cumulative times, " + splitTimes.length + " split times");
        }

        return new CompetitorParseRecord(name, club, className, totalTime, cumulativeTimes, competitive);
    };

    /**
    * Constructs a recognizer for formatting an HTML format supposedly from
    * 'OEvent'.
    *
    * Data in this format is contained within a single HTML table, with another
    * table before it containing various (ignored) header information.
    * @constructor
    */
    var OEventTabularHtmlFormatRecognizer = function () {
        this.usesClasses = false;
    };

    /**
    * Returns whether this recognizer is likely to recognize the given HTML
    * text and possibly be able to parse it.  If this method returns true, the
    * parser will use this recognizer to attempt to parse the HTML.  If it
    * returns false, the parser will not use this recognizer.  Other methods on
    * this object can therefore assume that this method has returned true.
    *
    * As this recognizer is for recognizing HTML formatted in precisely two
    * tables, it returns whether the number of HTML &lt;table&gt; tags is
    * two.  If fewer than two tables are found, or more than two, this method
    * returns false.
    *
    * @param {String} text The entire input text read in.
    * @return {Boolean} True if the text contains precisely two HTML table
    *     tags.
    */
    OEventTabularHtmlFormatRecognizer.prototype.isTextOfThisFormat = function (text) {
        var table1Pos = text.indexOf("<table");
        if (table1Pos >= 0) {
            var table2Pos = text.indexOf("<table", table1Pos + 1);
            if (table2Pos >= 0) {
                var table3Pos = text.indexOf("<table", table2Pos + 1);
                if (table3Pos < 0) {
                    // Format characterised by precisely two tables.
                    return true;
                }
            }
        }

        return false;
    };

    /**
    * Performs some pre-processing on the text before it is read in.
    *
    * This recognizer performs a fair amount of pre-processing, to remove
    * parts of the file we don't care about, and to reshape what there is left
    * so that it is in a more suitable form to be parsed.
    *
    * @param {String} text The HTML text to preprocess.
    * @return {String} The preprocessed text.
    */
    OEventTabularHtmlFormatRecognizer.prototype.preprocess = function (text) {
        // Remove the first table.
        var tableEndPos = text.indexOf("</table>");
        if (tableEndPos === -1) {
            throwInvalidData("Could not find any closing </table> tags");
        }

        if (text.indexOf('<td colspan="25">') >= 0) {
            // The table has 25 columns with classes and 24 without.
            this.usesClasses = true;
        }

        text = text.substring(tableEndPos + "</table>".length);

        // Remove all rows that contain only a single non-breaking space.
        text = text.replace(/<tr[^>]{0,100}><td colspan=[^>]{0,100}>&nbsp;<\/td><\/tr>/g, "");

        // Replace blank lines.
        text = text.replace(/\n{2,}/g, "\n");

        // Finally, remove the trailing </body> and </html> elements.
        text = text.replace("</body>", "").replace("</html>", "");

        return text.trim();
    };

    /**
    * Returns whether the HTML parser can ignore the given line altogether.
    *
    * The parser will call this method with every line read in, apart from
    * the second line of each pair of competitor data rows.  These are always
    * assumed to be in pairs.
    *
    * This recognizer ignores blank lines. It also ignores any that contain
    * opening or closing HTML table tags or horizontal-rule tags.
    *
    * @param {String} line The line to check.
    * @return {Boolean} True if the line should be ignored, false if not.
    */
    OEventTabularHtmlFormatRecognizer.prototype.canIgnoreThisLine = function (line) {
        return (line === "" || line.indexOf("<table") > -1 || line.indexOf("</table>") > -1 || line.indexOf("<hr>") > -1);
    };

    /**
    * Returns whether the given line is the first line of a course.
    *
    * If so, it means the parser has finished processing the previous course
    * (if any), and can start a new course.
    *
    * This recognizer treats a line that contains a table-row cell with class
    * "clubName" as the first line of a course.
    *
    * @param {String} line The line to check.
    * @return {Boolean} True if this is the first line of a course, false
    *     otherwise.
    */
    OEventTabularHtmlFormatRecognizer.prototype.isCourseHeaderLine = function (line) {
        return line.indexOf('<tr class="clubName"') > -1;
    };

    /**
    * Parse a course header line and return the course name, distance and
    * climb.
    *
    * This method can assume that the line given is a course header line.
    *
    * @param {String} line The line to parse course details from.
    * @return {Object} Object containing the parsed course details.
    */
    OEventTabularHtmlFormatRecognizer.prototype.parseCourseHeaderLine = function (line) {
        var dataBits = getNonEmptyTableDataBits(line);
        if (dataBits.length === 0) {
            throwInvalidData("No parts found in course header line");
        }

        var part = dataBits[0];

        var name, distance, climb;
        var match = /^(.{0,100}?)\s{1,10}\((\d{1,10})m,\s{0,10}(\d{1,10})m\)$/.exec(part);
        if (match === null) {
            // Assume just course name.
            name = part;
            distance = null;
            climb = null;
        } else {
            name = match[1];
            distance = parseInt(match[2], 10) / 1000;
            climb = parseInt(match[3], 10);
        }

        return {name: name.trim(), distance: distance, climb: climb };
    };

    /**
    * Parse control codes from the given line and return a list of them.
    *
    * This method can assume that the previous line was the course header or a
    * previous control line.  It should also return null for the finish, which
    * should have no code.  The finish is assumed to he the last.
    *
    * @param {String} line The line to parse control codes from.
    * @return {Array} Array of control codes.
    */
    OEventTabularHtmlFormatRecognizer.prototype.parseControlsLine = function (line) {
        var bits = getNonEmptyTableDataBits(line);
        return bits.map(function (bit) {
            var dashPos = bit.indexOf("-");
            return (dashPos === -1) ? null : bit.substring(dashPos + 1);
        });
    };

    /**
    * Read either cumulative or split times from the given line of competitor
    * data.
    * (This method is not used by the parser, only elsewhere in the recognizer.)
    * @param {Array} bits Array of all contents of table elements.
    * @return {Array} Array of times.
    */
    OEventTabularHtmlFormatRecognizer.prototype.readCompetitorSplitDataLine = function (bits) {

        var startPos = (this.usesClasses) ? 5 : 4;

        // Discard the empty bits at the end.
        var endPos = bits.length;
        while (endPos > 0 && bits[endPos - 1] === "") {
            endPos -= 1;
        }

        // Alternate cells contain ranks, which we're not interested in.
        var timeBits = [];
        for (var index = startPos; index < endPos; index += 2) {
            var bit = bits[index];
            if (isNonEmpty(bit)) {
                timeBits.push(bit);
            }
        }

        return timeBits;
    };

    /**
    * Parse two lines of competitor data into a CompetitorParseRecord object
    * containing the data.
    * @param {String} firstLine The first line of competitor data.
    * @param {String} secondLine The second line of competitor data.
    * @return {CompetitorParseRecord} The parsed competitor.
    */
    OEventTabularHtmlFormatRecognizer.prototype.parseCompetitor = function (firstLine, secondLine) {
        var firstLineBits = getTableDataBits(firstLine);
        var secondLineBits = getTableDataBits(secondLine);

        var competitive = hasNumber(firstLineBits[0]);
        var name = firstLineBits[2];
        var totalTime = firstLineBits[(this.usesClasses) ? 4 : 3];
        var className = (this.usesClasses && name !== "") ? firstLineBits[3] : null;
        var club = secondLineBits[2];

        // If there is any cumulative time with a blank corresponding split
        // time, use a placeholder value for the split time.  Typically this
        // happens when a competitor has punched one control but not the
        // previous.
        for (var index = ((this.usesClasses) ? 5 : 4); index < firstLineBits.length && index < secondLineBits.length; index += 2) {
            if (firstLineBits[index] !== "" && secondLineBits[index] === "") {
                secondLineBits[index] = "----";
            }
        }

        var cumulativeTimes = this.readCompetitorSplitDataLine(firstLineBits);
        var splitTimes = this.readCompetitorSplitDataLine(secondLineBits);
        cumulativeTimes = cumulativeTimes.map(parseTime);

        removeExtraControls(cumulativeTimes, splitTimes);

        if (cumulativeTimes.length !== splitTimes.length) {
            throwInvalidData("Cumulative and split times do not have the same length: " + cumulativeTimes.length + " cumulative times, " + splitTimes.length + " split times");
        }

        return new CompetitorParseRecord(name, club, className, totalTime, cumulativeTimes, competitive);
    };

    /**
    * Represents the partial result of parsing a course.
    * @constructor
    * @param {String} name The name of the course.
    * @param {Number|null} distance The distance of the course in kilometres,
    *     if known, else null.
    * @param {Number|null} climb The climb of the course in metres, if known,
    *     else null.
    */
    function CourseParseRecord(name, distance, climb) {
        this.name = name;
        this.distance = distance;
        this.climb = climb;
        this.controls = [];
        this.competitors = [];
    }

    /**
    * Adds the given list of control codes to those built up so far.
    * @param {Array} controls Array of control codes read.
    */
    CourseParseRecord.prototype.addControls = function (controls) {
        this.controls = this.controls.concat(controls);
    };

    /**
    * Returns whether the course has all of the controls it needs.
    * The course has all its controls if its last control is the finish, which
    * is indicated by a null control code.
    * @return {Boolean} True if the course has all of its controls, including
    *     the finish, false otherwise.
    */
    CourseParseRecord.prototype.hasAllControls = function () {
        return this.controls.length > 0 && this.controls[this.controls.length - 1] === null;
    };

    /**
    * Adds a competitor record to the collection held by this course.
    * @param {CompetitorParseRecord} competitor The competitor to add.
    */
    CourseParseRecord.prototype.addCompetitor = function (competitor) {
        if (!competitor.competitive && competitor.cumTimes.length === this.controls.length - 1) {
            // Odd quirk of the format: mispunchers may have their finish split
            // missing, i.e. not even '-----'.  If it looks like this has
            // happened, fill the gap by adding a missing time for the finish.
            competitor.cumTimes.push(null);
        }

        if (parseTime(competitor.totalTime) === null && competitor.cumTimes.length === 0) {
            while (competitor.cumTimes.length < this.controls.length) {
                competitor.cumTimes.push(null);
            }
        }

        if (competitor.cumTimes.length === this.controls.length) {
            this.competitors.push(competitor);
        } else {
            throwInvalidData("Competitor '" + competitor.name + "' should have " + this.controls.length + " cumulative times, but has " + competitor.cumTimes.length + " times");
        }
    };

    /**
    * A parser that is capable of parsing event data in a given HTML format.
    * @constructor
    * @param {Object} recognizer The recognizer to use to parse the HTML.
    */
    function HtmlFormatParser(recognizer) {
        this.recognizer = recognizer;
        this.courses = [];
        this.currentCourse = null;
        this.lines = null;
        this.linePos = -1;
        this.currentCompetitor = null;
    }

    /**
    * Attempts to read the next unread line from the data given.  If the end of
    * the data has been read, null will be returned.
    * @return {String|null} The line read, or null if the end of the data has
    *     been reached.
    */
    HtmlFormatParser.prototype.tryGetLine = function () {
        if (this.linePos + 1 < this.lines.length) {
            this.linePos += 1;
            return this.lines[this.linePos];
        } else {
            return null;
        }
    };

    /**
    * Adds the current competitor being constructed to the current course, and
    * clear the current competitor.
    *
    * If there is no current competitor, nothing happens.
    */
    HtmlFormatParser.prototype.addCurrentCompetitorIfNecessary = function () {
        if (this.currentCompetitor !== null) {
            this.currentCourse.addCompetitor(this.currentCompetitor);
            this.currentCompetitor = null;
        }
    };

    /**
    * Adds the current competitor being constructed to the current course, and
    * the current course being constructed to the list of all courses.
    *
    * If there is no current competitor nor no current course, nothing happens.
    */
    HtmlFormatParser.prototype.addCurrentCompetitorAndCourseIfNecessary = function () {
        this.addCurrentCompetitorIfNecessary();
        if (this.currentCourse !== null) {
            this.courses.push(this.currentCourse);
        }
    };

    /**
    * Reads in data for one competitor from two lines of the input data.
    *
    * The first of the two lines will be given; the second will be read.
    * @param {String} firstLine The first of the two lines to read the
    *     competitor data from.
    */
    HtmlFormatParser.prototype.readCompetitorLines = function (firstLine) {
        var secondLine = this.tryGetLine();
        if (secondLine === null) {
            throwInvalidData("Hit end of input data unexpectedly while parsing competitor: first line was '" + firstLine + "'");
        }

        var competitorRecord = this.recognizer.parseCompetitor(firstLine, secondLine);
        if (competitorRecord.isContinuation()) {
            if (this.currentCompetitor === null) {
                throwInvalidData("First row of competitor data has no name nor time");
            } else {
                this.currentCompetitor.append(competitorRecord);
            }
        } else {
            this.addCurrentCompetitorIfNecessary();
            this.currentCompetitor = competitorRecord;
        }
    };

    /**
    * Returns whether the classes are unique within courses.  If so, they can
    * be used to subdivide courses.  If not, CourseClasses and Courses must be
    * the same.
    * @return {Boolean} True if no two competitors in the same class are on
    *     different classes, false otherwise.
    */
    HtmlFormatParser.prototype.areClassesUniqueWithinCourses = function () {
        var classesToCoursesMap = d3.map();
        for (var courseIndex = 0; courseIndex < this.courses.length; courseIndex += 1) {
            var course = this.courses[courseIndex];
            for (var competitorIndex = 0; competitorIndex < course.competitors.length; competitorIndex += 1) {
                var competitor = course.competitors[competitorIndex];
                if (classesToCoursesMap.has(competitor.className)) {
                    if (classesToCoursesMap.get(competitor.className) !== course.name) {
                        return false;
                    }
                } else {
                    classesToCoursesMap.set(competitor.className, course.name);
                }
            }
        }

        return true;
    };

    /**
    * Reads through all of the intermediate parse-record data and creates an
    * Event object with all of the courses and classes.
    * @return {Event} Event object containing all of the data.
    */
    HtmlFormatParser.prototype.createOverallEventObject = function () {
        // There is a complication here regarding classes.  Sometimes, classes
        // are repeated within multiple courses.  In this case, ignore the
        // classes given and create a CourseClass for each set.
        var classesUniqueWithinCourses = this.areClassesUniqueWithinCourses();

        var newCourses = [];
        var classes = [];

        var competitorsHaveClasses = this.courses.every(function (course) {
            return course.competitors.every(function (competitor) { return isNotNull(competitor.className); });
        });

        this.courses.forEach(function (course) {
            // Firstly, sort competitors by class.
            var classToCompetitorsMap = d3.map();
            course.competitors.forEach(function (competitor) {
                var className = (competitorsHaveClasses && classesUniqueWithinCourses) ? competitor.className : course.name;
                if (classToCompetitorsMap.has(className)) {
                    classToCompetitorsMap.get(className).push(competitor);
                } else {
                    classToCompetitorsMap.set(className, [competitor]);
                }
            });

            var classesForThisCourse = [];

            classToCompetitorsMap.keys().forEach(function (className) {
                var numControls = course.controls.length - 1;
                var oldCompetitors = classToCompetitorsMap.get(className);
                var newResults = oldCompetitors.map(function (competitor, index) {
                    return competitor.toResult(index + 1);
                });

                var courseClass = new CourseClass(className, numControls, newResults);
                classesForThisCourse.push(courseClass);
                classes.push(courseClass);
            }, this);

            var newCourse = new Course(course.name, classesForThisCourse, course.distance, course.climb, course.controls.slice(0, course.controls.length - 1));
            newCourses.push(newCourse);
            classesForThisCourse.forEach(function (courseClass) {
                courseClass.setCourse(newCourse);
            });
        }, this);

        // Empty array is for warnings, which aren't supported by the HTML
        // format parsers.
        return new Event(classes, newCourses, []);
    };

    /**
    * Parses the given HTML text containing results data into an Event object.
    * @param {String} text The HTML text to parse.
    * @return {Event} Event object containing all the parsed data.
    */
    HtmlFormatParser.prototype.parse = function (text) {
        this.lines = text.split("\n");
        while (true) {
            var line = this.tryGetLine();
            if (line === null) {
                break;
            } else if (this.recognizer.canIgnoreThisLine(line)) {
                // Do nothing - recognizer says we can ignore this line.
            } else if (this.recognizer.isCourseHeaderLine(line)) {
                this.addCurrentCompetitorAndCourseIfNecessary();
                var courseObj = this.recognizer.parseCourseHeaderLine(line);
                this.currentCourse = new CourseParseRecord(courseObj.name, courseObj.distance, courseObj.climb);
            } else if (this.currentCourse === null) {
                // Do nothing - still not found the start of the first course.
            } else if (this.currentCourse.hasAllControls()) {
                // Course has all of its controls; read competitor data.
                this.readCompetitorLines(line);
            } else {
                var controls = this.recognizer.parseControlsLine(line);
                this.currentCourse.addControls(controls);
            }
        }

        this.addCurrentCompetitorAndCourseIfNecessary();

        if (this.courses.length === 0) {
            throwInvalidData("No competitor data was found");
        }

        var eventData = this.createOverallEventObject();
        return eventData;
    };

    var RECOGNIZER_CLASSES = [OldHtmlFormatRecognizer, NewHtmlFormatRecognizer, OEventTabularHtmlFormatRecognizer];

    SplitsBrowser.Input.Html = {};

    /**
    * Attempts to parse data as one of the supported HTML formats.
    *
    * If the data appears not to be HTML data, a WrongFileFormat exception
    * is thrown.  If the data appears to be HTML data but is invalid in some
    * way, an InvalidData exception is thrown.
    *
    * @param {String} data The string containing event data.
    * @return {Event} The parsed event.
    */
    SplitsBrowser.Input.Html.parseEventData = function (data) {
        data = normaliseLineEndings(data);
        for (var recognizerIndex = 0; recognizerIndex < RECOGNIZER_CLASSES.length; recognizerIndex += 1) {
            var RecognizerClass = RECOGNIZER_CLASSES[recognizerIndex];
            var recognizer = new RecognizerClass();
            if (recognizer.isTextOfThisFormat(data)) {
                data = recognizer.preprocess(data);
                var parser = new HtmlFormatParser(recognizer);
                var parsedEvent = parser.parse(data);
                return parsedEvent;
            }
        }

        // If we get here, the format wasn't recognized.
        throwWrongFileFormat("No HTML recognizers recognised this as HTML they could parse");
    };
})();

/*
 *  SplitsBrowser Alternative CSV - Read in alternative CSV files.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var parseCourseLength = SplitsBrowser.parseCourseLength;
    var parseCourseClimb = SplitsBrowser.parseCourseClimb;
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var Competitor = SplitsBrowser.Model.Competitor;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    // This reader reads in alternative CSV formats, where each row defines a
    // separate competitor, and includes course details such as name, controls
    // and possibly distance and climb.

    // There is presently one variation supported:
    // * one, distinguished by having three columns per control: control code,
    //   cumulative time and 'points'.  (Points is never used.)  Generally,
    //   these formats are quite sparse; many columns (e.g. club, placing,
    //   start time) are blank or are omitted altogether.

    var TRIPLE_COLUMN_FORMAT = {
        // Control data starts in column AM (index 38).
        controlsOffset: 38,
        // Number of columns per control.
        step: 3,
        // Column indexes of various data
        name: 3,
        club: 5,
        courseName: 7,
        startTime: 8,
        length: null,
        climb: null,
        placing: null,
        finishTime: null,
        allowMultipleCompetitorNames: true
    };

    // Supported delimiters.
    var DELIMITERS = [",", ";"];

    // All control codes except perhaps the finish are alphanumeric.
    var controlCodeRegexp = /^[A-Za-z0-9]{1,10}$/;


    /**
    * Trim trailing empty-string entries from the given array.
    * The given array is mutated.
    * @param {Array} array The array of string values.
    */
    function trimTrailingEmptyCells (array) {
        var index = array.length - 1;
        while (index >= 0 && array[index] === "") {
            index -= 1;
        }

        array.splice(index + 1, array.length - index - 1);
    }

    /**
    * Object used to read data from an alternative CSV file.
    * @constructor
    * @param {Object} format Object that describes the data format to read.
    */
    function Reader (format) {
        this.format = format;
        this.classes = d3.map();
        this.delimiter = null;
        this.hasAnyStarters = false;
        this.warnings = [];

        // Return the offset within the control data that should be used when
        // looking for control codes.  This will be 0 if the format specifies a
        // finish time, and the format step if the format has no finish time.
        // (In this case, the finish time is with the control data, but we
        // don't wish to read any control code specified nor validate it.)
        this.controlsTerminationOffset = (format.finishTime === null) ? format.step : 0;
    }

    /**
    * Determine the delimiter used to delimit data.
    * @param {String} firstDataLine The first data line of the file.
    * @return {String|null} The delimiter separating the data, or null if no
    *    suitable delimiter was found.
    */
    Reader.prototype.determineDelimiter = function (firstDataLine) {
        for (var index = 0; index < DELIMITERS.length; index += 1) {
            var delimiter = DELIMITERS[index];
            var lineParts = firstDataLine.split(delimiter);
            trimTrailingEmptyCells(lineParts);
            if (lineParts.length > this.format.controlsOffset) {
                return delimiter;
            }
        }

        return null;
    };

    /**
    * Some lines of some formats can have multiple delimited competitors, which
    * will move the following columns out of their normal place.  Identify any
    * such situations and merge them together.
    * @param {Array} row The row of data read from the file.
    */
    Reader.prototype.adjustLinePartsForMultipleCompetitors = function (row) {
        if (this.format.allowMultipleCompetitorNames) {
            while (row.length > this.format.name + 1 && row[this.format.name + 1].match(/^\s\S/)) {
                row[this.format.name] += "," + row[this.format.name + 1];
                row.splice(this.format.name + 1, 1);
            }
        }
    };

    /**
    * Check the first line of data read in to verify that all of the control
    * codes specified are alphanumeric.
    * @param {String} firstLine The first line of data from the file (not
    *     the header line).
    */
    Reader.prototype.checkControlCodesAlphaNumeric = function (firstLine) {
        var lineParts = firstLine.split(this.delimiter);
        trimTrailingEmptyCells(lineParts);
        this.adjustLinePartsForMultipleCompetitors(lineParts, this.format);

        for (var index = this.format.controlsOffset; index + this.controlsTerminationOffset < lineParts.length; index += this.format.step) {
            if (!controlCodeRegexp.test(lineParts[index])) {
                throwWrongFileFormat("Data appears not to be in an alternative CSV format - data in cell " + index + " of the first row ('" + lineParts[index] + "') is not an number");
            }
        }
    };

    /**
    * Adds the result to the course with the given name.
    * @param {Result} result The result object read from the row.
    * @param {String} courseName The name of the course.
    * @param {Array} row Array of string parts making up the row of data read.
    */
    Reader.prototype.addResultToCourse = function (result, courseName, row) {
        if (this.classes.has(courseName)) {
            var cls = this.classes.get(courseName);
            var cumTimes = result.getAllOriginalCumulativeTimes();
            // Subtract one from the list of cumulative times for the
            // cumulative time at the start (always 0), and add one on to
            // the count of controls in the class to cater for the finish.
            if (cumTimes.length - 1 !== (cls.controls.length + 1)) {
                this.warnings.push("Competitor '" + result.owner.name + "' has the wrong number of splits for course '" + courseName + "': " +
                                   "expected " + (cls.controls.length + 1) + ", actual " + (cumTimes.length - 1));
            } else {
                cls.results.push(result);
            }
        } else {
            // New course/class.

            // Determine the list of controls, ignoring the finish.
            var controls = [];
            for (var controlIndex = this.format.controlsOffset; controlIndex + this.controlsTerminationOffset < row.length; controlIndex += this.format.step) {
                controls.push(row[controlIndex]);
            }

            var courseLength = (this.format.length === null) ? null : parseCourseLength(row[this.format.length]);
            var courseClimb = (this.format.climb === null) ? null : parseCourseClimb(row[this.format.climb]);

            this.classes.set(courseName, {length: courseLength, climb: courseClimb, controls: controls, results: [result]});
        }
    };

    /**
    * Read a row of data from a line of the file.
    * @param {String} line The line of data read from the file.
    */
    Reader.prototype.readDataRow = function (line) {
        var row = line.split(this.delimiter);
        trimTrailingEmptyCells(row);
        this.adjustLinePartsForMultipleCompetitors(row);

        if (row.length < this.format.controlsOffset) {
            // Probably a blank line.  Ignore it.
            return;
        }

        while ((row.length - this.format.controlsOffset) % this.format.step !== 0) {
            // Competitor might be missing cumulative time to last control.
            row.push("");
        }

        var competitorName = row[this.format.name];
        var club = row[this.format.club];
        var courseName = row[this.format.courseName];
        var startTime = parseTime(row[this.format.startTime]);

        var cumTimes = [0];
        for (var cumTimeIndex = this.format.controlsOffset + 1; cumTimeIndex < row.length; cumTimeIndex += this.format.step) {
            cumTimes.push(parseTime(row[cumTimeIndex]));
        }

        if (this.format.finishTime !== null) {
            var finishTime = parseTime(row[this.format.finishTime]);
            var totalTime = (startTime === null || finishTime === null) ? null : (finishTime - startTime);
            cumTimes.push(totalTime);
        }

        if (cumTimes.length === 1) {
            // Only cumulative time is the zero.
            if (competitorName !== "") {
                this.warnings.push(
                    "Competitor '" + competitorName + "' on course '" + (courseName === "" ? "(unnamed)" : courseName) + "' has no times recorded");
            }

            return;
        }

        var order = (this.classes.has(courseName)) ? this.classes.get(courseName).results.length + 1 : 1;

        var result = fromOriginalCumTimes(order, startTime, cumTimes, new Competitor(competitorName, club));
        if (this.format.placing !== null && result.completed()) {
            var placing = row[this.format.placing];
            if (!placing.match(/^\d{1,10}$/)) {
                result.setNonCompetitive();
            }
        }

        if (result.hasAnyTimes()) {
            this.hasAnyStarters = true;
        }
        else {
            result.setNonStarter();
        }

        this.addResultToCourse(result, courseName, row);
    };

    /**
    * Given an array of objects containing information about each of the
    * course-classes in the data, create CourseClass and Course objects,
    * grouping classes by the list of controls
    * @return {Object} Object that contains the courses and classes.
    */
    Reader.prototype.createClassesAndCourses = function () {
        var courseClasses = [];

        // Group the classes by the list of controls.  Two classes using the
        // same list of controls can be assumed to be using the same course.
        var coursesByControlsLists = d3.map();

        this.classes.entries().forEach(function (keyValuePair) {
            var className = keyValuePair.key;
            var cls = keyValuePair.value;
            var courseClass = new CourseClass(className, cls.controls.length, cls.results);
            courseClasses.push(courseClass);

            var controlsList = cls.controls.join(",");
            if (coursesByControlsLists.has(controlsList)) {
                coursesByControlsLists.get(controlsList).classes.push(courseClass);
            } else {
                coursesByControlsLists.set(
                    controlsList, {name: className, classes: [courseClass], length: cls.length, climb: cls.climb, controls: cls.controls});
            }
        });

        var courses = [];
        coursesByControlsLists.values().forEach(function (courseObject) {
            var course = new Course(courseObject.name, courseObject.classes, courseObject.length, courseObject.climb, courseObject.controls);
            courseObject.classes.forEach(function (courseClass) { courseClass.setCourse(course); });
            courses.push(course);
        });

        return {classes: courseClasses, courses: courses};
    };

    /**
    * Parse alternative CSV data for an entire event.
    * @param {String} eventData String containing the entire event data.
    * @return {SplitsBrowser.Model.Event} All event data read in.
    */
    Reader.prototype.parseEventData = function (eventData) {
        this.warnings = [];
        eventData = normaliseLineEndings(eventData);

        var lines = eventData.split(/\n/);

        if (lines.length < 2) {
            throwWrongFileFormat("Data appears not to be in an alternative CSV format - too few lines");
        }

        var firstDataLine = lines[1];

        this.delimiter = this.determineDelimiter(firstDataLine);
        if (this.delimiter === null) {
            throwWrongFileFormat("Data appears not to be in an alternative CSV format - first data line has fewer than " + this.format.controlsOffset + " parts when separated by any recognised delimiter");
        }

        this.checkControlCodesAlphaNumeric(firstDataLine);

        for (var rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
            this.readDataRow(lines[rowIndex]);
        }

        var classesAndCourses = this.createClassesAndCourses();

        if (!this.hasAnyStarters) {
            // Everyone marked as a non-starter.  This file is probably not of this
            // format.
            throwWrongFileFormat("Data appears not to be in an alternative CSV format - data apparently could be read but everyone was a non-starter");
        }

        return new Event(classesAndCourses.classes, classesAndCourses.courses, this.warnings);
    };

    SplitsBrowser.Input.AlternativeCSV = {
        parseTripleColumnEventData: function (eventData) {
            var reader = new Reader(TRIPLE_COLUMN_FORMAT);
            return reader.parseEventData(eventData);
        }
    };
})();
/*
 *  SplitsBrowser IOF XML - Read event data in IOF XML-format files.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var COMMON_CONTROLS_MODE = SplitsBrowser.COMMON_CONTROLS_MODE;
    var determineCommonControls = SplitsBrowser.determineCommonControls;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var createTeamResult = SplitsBrowser.Model.Result.createTeamResult;
    var Competitor = SplitsBrowser.Model.Competitor;
    var Team = SplitsBrowser.Model.Team;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    // Number of feet in a kilometre.
    var FEET_PER_KILOMETRE = 3280;

    /**
    * Returns whether the given value is undefined.
    * @param {any} value The value to check.
    * @return {Boolean} True if the value is undefined, false otherwise.
    */
    function isUndefined(value) {
        return typeof value === "undefined";
    }

    /**
    * Returns the sum of all of the numbers in the given array
    * @param {Array} array The array of numbers to find the sum of.
    * @return {Number} The sum of the numbers in the given array.
    */
    function arraySum(array) {
        return array.reduce(function (a, b) { return a + b; }, 0);
    }

    /**
    * Parses the given XML string and returns the parsed XML.
    * @param {String} xmlString The XML string to parse.
    * @return {XMLDocument} The parsed XML document.
    */
    function parseXml(xmlString) {
        try {
            return $.parseXML(xmlString);
        } catch (e) {
            throwInvalidData("XML data not well-formed");
        }
    }

    /**
    * Parses and returns a competitor name from the given XML element.
    *
    * The XML element should have name PersonName for v2.0.3 or Name for
    * v3.0.  It should contain Given and Family child elements from which
    * the name will be formed.
    *
    * @param {jQuery.selection} nameElement jQuery selection containing the
    *     PersonName or Name element.
    * @return {String} Name read from the element.
    */
    function readCompetitorName(nameElement) {

        var forename = $("> Given", nameElement).text();
        var surname = $("> Family", nameElement).text();

        if (forename === "") {
            return surname;
        } else if (surname === "") {
            return forename;
        } else {
            return forename + " " + surname;
        }
    }

    // Regexp that matches the year in an ISO-8601 date.
    // Both XML formats use ISO-8601 (YYYY-MM-DD) dates, so parsing is
    // fortunately straightforward.
    var yearRegexp = /^\d{4}/;

    // Object that contains various functions for parsing bits of data from
    // IOF v2.0.3 XML event data.
    var Version2Reader = {};

    /**
    * Returns whether the given event data is likely to be results data of the
    * version 2.0.3 format.
    *
    * This function is called before the XML is parsed and so can provide a
    * quick way to discount files that are not of the v2.0.3 format.  Further
    * functions of this reader are only called if this method returns true.
    *
    * @param {String} data The event data.
    * @return {Boolean} True if the data is likely to be v2.0.3-format data,
    *     false if not.
    */
    Version2Reader.isOfThisVersion = function (data) {
        return data.indexOf("IOFdata.dtd") >= 0;
    };

    /**
    * Makes a more thorough check that the parsed XML data is likely to be of
    * the v2.0.3 format.  If not, a WrongFileFormat exception is thrown.
    * @param {jQuery.selection} rootElement The root element.
    */
    Version2Reader.checkVersion = function (rootElement) {
        var iofVersionElement = $("> IOFVersion", rootElement);
        if (iofVersionElement.length === 0) {
            throwWrongFileFormat("Could not find IOFVersion element");
        } else {
            var version = iofVersionElement.attr("version");
            if (isUndefined(version)) {
                throwWrongFileFormat("Version attribute missing from IOFVersion element");
            } else if (version !== "2.0.3") {
                throwWrongFileFormat("Found unrecognised IOF XML data format '" + version + "'");
            }
        }

        var status = rootElement.attr("status");
        if (!isUndefined(status) && status.toLowerCase() !== "complete") {
            throwInvalidData("Only complete IOF data supported; snapshot and delta are not supported");
        }
    };

    /**
    * Reads the class name from a ClassResult element.
    * @param {jQuery.selection} classResultElement ClassResult element
    *     containing the course details.
    * @return {String} Class name.
    */
    Version2Reader.readClassName = function (classResultElement) {
        return $("> ClassShortName", classResultElement).text();
    };

    /**
    * Reads the team name from a TeamResult element.
    * @param {jQuery.selection} teamResultElement TeamResult element
    *     containing the team result details.
    * @return {String} Team name.
    */
    Version2Reader.readTeamName = function (teamResultElement) {
        return $("> TeamName", teamResultElement).text();
    };

    /**
    * Returns a list of elements to be read to pull out team-member information.
    * @param {jQuery.selection} teamResultElement TeamResult element
    *     containing the team result details.
    * @return {Array} Elements to parse to read team member results.
    */
    Version2Reader.readTeamMemberResults = function (teamResultElement) {
        return $("> PersonResult", teamResultElement);
    };

    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement ClassResult element
    *     containing the course details.
    * @param {Array} warnings Array that accumulates warning messages.
    * @return {Object} Course details: id, name, length, climb and numberOfControls
    */
    Version2Reader.readCourseFromClass = function (classResultElement, warnings) {
        // Although the IOF v2 format appears to support courses, they
        // haven't been specified in any of the files I've seen.
        // So instead grab course details from the class and the first
        // competitor.
        var courseName = $("> ClassShortName", classResultElement).text();

        var firstResult = $("> PersonResult > Result", classResultElement).first();
        var length = null;

        if (firstResult.length > 0) {
            var lengthElement = $("> CourseLength", firstResult);
            var lengthStr = lengthElement.text();

            // Course lengths in IOF v2 are a pain, as you have to handle three
            // units.
            if (lengthStr.length > 0) {
                length = parseFloat(lengthStr);
                if (isFinite(length)) {
                    var unit = lengthElement.attr("unit");
                    if (isUndefined(unit) || unit === "m") {
                        length /= 1000;
                    } else if (unit === "km") {
                        // Length already in kilometres, do nothing further.
                    } else if (unit === "ft") {
                        length /= FEET_PER_KILOMETRE;
                    } else {
                        warnings.push("Course '" + courseName + "' gives its length in a unit '" + unit + "', but this unit was not recognised");
                        length = null;
                    }
                } else {
                    warnings.push("Course '" + courseName + "' specifies a course length that was not understood: '" + lengthStr + "'");
                    length = null;
                }
            }
        }

        // Climb does not appear in the per-competitor results, and there is
        // no NumberOfControls.
        return {id: null, name: courseName, length: length, climb: null, numberOfControls: null};
    };

    /**
    * Returns the XML element that contains a competitor's name.  This element
    * should contain child elements with names Given and Family.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult element.
    * @return {jQuery.selection} jQuery selection containing any child
    *     PersonName element.
    */
    Version2Reader.getCompetitorNameElement = function (element) {
        return $("> Person > PersonName", element);
    };

    /**
    * Returns the name of the competitor or team's club.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult or TeamResult element.
    * @return {String} Competitor or team's club name.
    */
    Version2Reader.readClubName = function (element) {
        var clubName = $("> Club > ShortName", element).text();
        return (clubName === "") ?  $("> Club > Name", element).text() : clubName;
    };

    /**
    * Returns the competitor's date of birth, as a string.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult element.
    * @return {String} The competitor's date of birth, as a string.
    */
    Version2Reader.readDateOfBirth = function (element) {
        return $("> Person > BirthDate > Date", element).text();
    };

    /**
    * Reads a start time from the given Result element.
    * @param {jQuery.selection} resultElement jQuery selection containing a
    *     Result element.
    * @return {Number|null} Start time in seconds since midnight, or null if
    *     not found.
    */
    Version2Reader.readStartTime = function (resultElement) {
        var startTimeStr = $("> StartTime > Clock", resultElement).text();
        var startTime = (startTimeStr === "") ? null : parseTime(startTimeStr);
        return startTime;
    };

    /**
    * Reads a competitor's total time from the given Result element.
    * @param {jQuery.selection} resultElement jQuery selection containing a
    *     Result element.
    * @return {Number|null} The competitor's total time in seconds, or null if
    *     a valid time was not found.
    */
    Version2Reader.readTotalTime = function (resultElement) {
        var totalTimeStr = $("> Time", resultElement).text();
        var totalTime = (totalTimeStr === "") ? null : parseTime(totalTimeStr);
        return totalTime;
    };

    /**
    * Returns the status of the competitor with the given result.
    * @param {jQuery.selection} resultElement jQuery selection containing a
    *     Result element.
    * @return {String} Status of the competitor.
    */
    Version2Reader.getStatus = function (resultElement) {
        var statusElement = $("> CompetitorStatus", resultElement);
        return (statusElement.length === 1) ? statusElement.attr("value") : "";
    };

    Version2Reader.StatusNonCompetitive = "NotCompeting";
    Version2Reader.StatusNonStarter = "DidNotStart";
    Version2Reader.StatusNonFinisher = "DidNotFinish";
    Version2Reader.StatusDisqualified = "Disqualified";
    Version2Reader.StatusOverMaxTime = "OverTime";

    /**
    * Unconditionally returns false - IOF XML version 2.0.3 appears not to
    * support additional controls.
    * @return {Boolean} false.
    */
    Version2Reader.isAdditional = function () {
        return false;
    };

    /**
    * Reads a control code and split time from a SplitTime element.
    * @param {jQuery.selection} splitTimeElement jQuery selection containing
    *     a SplitTime element.
    * @return {Object} Object containing code and time.
    */
    Version2Reader.readSplitTime = function (splitTimeElement) {
        // IOF v2 allows ControlCode or Control elements.
        var code = $("> ControlCode", splitTimeElement).text();
        if (code === "") {
            code = $("> Control > ControlCode", splitTimeElement).text();
        }

        if (code === "") {
            throwInvalidData("Control code missing for control");
        }

        var timeStr = $("> Time", splitTimeElement).text();
        var time = (timeStr === "") ? null : parseTime(timeStr);
        return {code: code, time: time};
    };

    // Regexp to match ISO-8601 dates.
    // Ignores timezone info - always display times as local time.
    // We don't assume there are separator characters, and we also don't assume
    // that the seconds will be specified.
    var ISO_8601_RE = /^\d\d\d\d-?\d\d-?\d\dT?(\d\d):?(\d\d)(?::?(\d\d))?/;

    // Object that contains various functions for parsing bits of data from
    // IOF v3.0 XML event data.
    var Version3Reader = {};

    /**
    * Returns whether the given event data is likely to be results data of the
    * version 3.0 format.
    *
    * This function is called before the XML is parsed and so can provide a
    * quick way to discount files that are not of the v3.0 format.  Further
    * functions of this reader are only called if this method returns true.
    *
    * @param {String} data The event data.
    * @return {Boolean} True if the data is likely to be v3.0-format data,
    *     false if not.
    */
    Version3Reader.isOfThisVersion = function (data) {
        return data.indexOf("http://www.orienteering.org/datastandard/3.0") >= 0;
    };

    /**
    * Makes a more thorough check that the parsed XML data is likely to be of
    * the v2.0.3 format.  If not, a WrongFileFormat exception is thrown.
    * @param {jQuery.selection} rootElement The root element.
    */
    Version3Reader.checkVersion = function (rootElement) {
        var iofVersion = rootElement.attr("iofVersion");
        if (isUndefined(iofVersion)) {
            throwWrongFileFormat("Could not find IOF version number");
        } else if (iofVersion !== "3.0") {
            throwWrongFileFormat("Found unrecognised IOF XML data format '" + iofVersion + "'");
        }

        var status = rootElement.attr("status");
        if (!isUndefined(status) && status.toLowerCase() !== "complete") {
            throwInvalidData("Only complete IOF data supported; snapshot and delta are not supported");
        }
    };

    /**
    * Reads the class name from a ClassResult element.
    * @param {jQuery.selection} classResultElement ClassResult element
    *     containing the course details.
    * @return {String} Class name.
    */
    Version3Reader.readClassName = function (classResultElement) {
        return $("> Class > Name", classResultElement).text();
    };

    /**
    * Reads the team name from a TeamResult element.
    * @param {jQuery.selection} teamResultElement TeamResult element
    *     containing the team result details.
    * @return {String} Team name.
    */
    Version3Reader.readTeamName = function (teamResultElement) {
        return $("> Name", teamResultElement).text();
    };

    /**
    * Returns a list of elements to be read to pull out team-member information.
    * @param {jQuery.selection} teamResultElement TeamResult element
    *     containing the team result details.
    * @return {Array} Elements to parse to read team member results.
    */
    Version3Reader.readTeamMemberResults = function (teamResultElement) {
        return $("> TeamMemberResult", teamResultElement);
    };

    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement ClassResult element
    *     containing the course details.
    * @param {Array} warnings Array that accumulates warning messages.
    * @return {Object} Course details: id, name, length, climb and number of
    *     controls.
    */
    Version3Reader.readCourseFromClass = function (classResultElement, warnings) {
        var courseElement = $("> Course", classResultElement);
        var id = $("> Id", courseElement).text() || null;
        var name = $("> Name", courseElement).text();
        var lengthStr = $("> Length", courseElement).text();
        var length;
        if (lengthStr === "") {
            length = null;
        } else {
            length = parseInt(lengthStr, 10);
            if (isNaNStrict(length)) {
                warnings.push("Course '" + name + "' specifies a course length that was not understood: '" + lengthStr + "'");
                length = null;
            } else {
                // Convert from metres to kilometres.
                length /= 1000;
            }
        }

        var numberOfControlsStr = $("> NumberOfControls", courseElement).text();
        var numberOfControls = parseInt(numberOfControlsStr, 10);
        if (isNaNStrict(numberOfControls)) {
            numberOfControls = null;
        }

        var climbStr = $("> Climb", courseElement).text();
        var climb = parseInt(climbStr, 10);
        if (isNaNStrict(climb)) {
            climb = null;
        }

        return {id: id, name: name, length: length, climb: climb, numberOfControls: numberOfControls};
    };

    /**
    * Returns the XML element that contains a competitor's name.  This element
    * should contain child elements with names Given and Family.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult element.
    * @return {jQuery.selection} jQuery selection containing any child Name
    *     element.
    */
    Version3Reader.getCompetitorNameElement = function (element) {
        return $("> Person > Name", element);
    };

    /**
    * Returns the name of the competitor or team's club.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult or TeamResult element.
    * @return {String} Competitor or team's club name.
    */
    Version3Reader.readClubName = function (element) {
        var clubName = $("> Organisation > ShortName", element).text();
        return (clubName === "") ? $("> Organisation > Name", element).text() : clubName;
    };

    /**
    * Returns the competitor's date of birth, as a string.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult element.
    * @return {String} The competitor's date of birth, as a string.
    */
    Version3Reader.readDateOfBirth = function (element) {
        var birthDate = $("> Person > BirthDate", element).text();
        var regexResult = yearRegexp.exec(birthDate);
        return (regexResult === null) ? null : parseInt(regexResult[0], 10);
    };

    /**
    * Reads a competitor's start time from the given Result element.
    * @param {jQuery.selection} element jQuery selection containing a
    *     Result element.
    * @return {Number|null} Competitor's start time, in seconds since midnight,
    *     or null if not known.
    */
    Version3Reader.readStartTime = function (resultElement) {
        var startTimeStr = $("> StartTime", resultElement).text();
        var result = ISO_8601_RE.exec(startTimeStr);
        if (result === null) {
            return null;
        } else {
            var hours = parseInt(result[1], 10);
            var minutes = parseInt(result[2], 10);
            var seconds = (isUndefined(result[3])) ? 0 : parseInt(result[3], 10);
            return hours * 60 * 60 + minutes * 60 + seconds;
        }
    };

    /**
    * Reads a time, in seconds, from a string.  If the time was not valid,
    * null is returned.
    * @param {String} timeStr The time string to read.
    * @return {Number|null} The parsed time, in seconds, or null if it could not
    *     be read.
    */
    Version3Reader.readTime = function (timeStr) {
        // IOF v3 allows fractional seconds, so we use parseFloat instead
        // of parseInt.
        var time = parseFloat(timeStr);
        return (isFinite(time)) ? time : null;
    };

    /**
    * Read a competitor's total time from the given Time element.
    * @param {jQuery.selection} element jQuery selection containing a
    *     Result element.
    * @return {Number|null} Competitor's total time, in seconds, or null if a time
    *     was not found or was invalid.
    */
    Version3Reader.readTotalTime = function (resultElement) {
        var totalTimeStr = $("> Time", resultElement).text();
        return Version3Reader.readTime(totalTimeStr);
    };

    /**
    * Returns the status of the competitor with the given result.
    * @param {jQuery.selection} resultElement jQuery selection containing a
    *     Result element.
    * @return {String} Status of the competitor.
    */
    Version3Reader.getStatus = function (resultElement) {
        return $("> Status", resultElement).text();
    };

    Version3Reader.StatusNonCompetitive = "NotCompeting";
    Version3Reader.StatusNonStarter = "DidNotStart";
    Version3Reader.StatusNonFinisher = "DidNotFinish";
    Version3Reader.StatusDisqualified = "Disqualified";
    Version3Reader.StatusOverMaxTime = "OverTime";

    /**
    * Returns whether the given split-time element is for an additional
    * control, and hence should be ignored.
    * @param {jQuery.selection} splitTimeElement jQuery selection containing
    *     a SplitTime element.
    * @return {Boolean} True if the control is additional, false if not.
    */
    Version3Reader.isAdditional = function (splitTimeElement) {
        return (splitTimeElement.attr("status") === "Additional");
    };

    /**
    * Reads a control code and split time from a SplitTime element.
    * @param {jQuery.selection} splitTimeElement jQuery selection containing
    *     a SplitTime element.
    * @return {Object} Object containing code and time.
    */
    Version3Reader.readSplitTime = function (splitTimeElement) {
        var code = $("> ControlCode", splitTimeElement).text();
        if (code === "") {
            throwInvalidData("Control code missing for control");
        }

        var time;
        if (splitTimeElement.attr("status") === "Missing") {
            // Missed controls have their time omitted.
            time = null;
        } else {
            var timeStr = $("> Time", splitTimeElement).text();
            time = (timeStr === "") ? null : Version3Reader.readTime(timeStr);
        }

        return {code: code, time: time};
    };

    var ALL_READERS = [Version2Reader, Version3Reader];

    /**
    * Check that the XML document passed is in a suitable format for parsing.
    *
    * If any problems arise, this function will throw an exception.  If the
    * data is valid, the function will return normally.
    * @param {XMLDocument} xml The parsed XML document.
    * @param {Object} reader XML reader used to assist with format-specific
    *     XML reading.
    */
    function validateData(xml, reader) {
        var rootElement = $("> *", xml);
        var rootElementNodeName = rootElement.prop("tagName");

        if (rootElementNodeName !== "ResultList")  {
            throwWrongFileFormat("Root element of XML document does not have expected name 'ResultList', got '" + rootElementNodeName + "'");
        }

        reader.checkVersion(rootElement);
    }

    /**
    * Parses data for a single competitor.
    * @param {XMLElement} element XML PersonResult element.
    * @param {Number} number The competitor number (1 for first in the array
    *     of those read so far, 2 for the second, ...)
    * @param {Object} reader XML reader used to assist with format-specific
    *     XML reading.
    * @param {Array} warnings Array that accumulates warning messages.
    * @return {Object|null} Object containing the competitor data, or null if no
    *     competitor could be read.
    */
    function parseCompetitor(element, number, reader, warnings) {
        var jqElement = $(element);

        var nameElement = reader.getCompetitorNameElement(jqElement);
        var name = readCompetitorName(nameElement);

        if (name === "") {
            warnings.push("Could not find a name for a competitor");
            return null;
        }

        var club = reader.readClubName(jqElement);

        var dateOfBirth =  reader.readDateOfBirth(jqElement);
        var regexResult = yearRegexp.exec(dateOfBirth);
        var yearOfBirth = (regexResult === null) ? null : parseInt(regexResult[0], 10);

        var gender = $("> Person", jqElement).attr("sex");

        var resultElement = $("Result", jqElement);
        if (resultElement.length === 0) {
            warnings.push("Could not find any result information for competitor '" + name + "'");
            return null;
        }

        var startTime = reader.readStartTime(resultElement);

        var totalTime = reader.readTotalTime(resultElement);

        var status = reader.getStatus(resultElement);

        var splitTimes = $("> SplitTime", resultElement).toArray();
        var splitData = splitTimes.filter(function (splitTime) { return !reader.isAdditional($(splitTime)); })
                                  .map(function (splitTime) { return reader.readSplitTime($(splitTime)); });

        var controls = splitData.map(function (datum) { return datum.code; });
        var cumTimes = splitData.map(function (datum) { return datum.time; });

        cumTimes.unshift(0); // Prepend a zero time for the start.

        // Append the total time, ignoring any value given for a non-starter.
        cumTimes.push((status === reader.StatusNonStarter) ? null : totalTime);

        var competitor = new Competitor(name, club);

        if (yearOfBirth !== null) {
            competitor.setYearOfBirth(yearOfBirth);
        }

        if (gender === "M" || gender === "F") {
            competitor.setGender(gender);
        }

        var result = fromOriginalCumTimes(number, startTime, cumTimes, competitor);

        if (status === "OK" && totalTime !== null && cumTimes.indexOf(null) >= 0) {
            result.setOKDespiteMissingTimes();
        } else if (status === reader.StatusNonCompetitive) {
            result.setNonCompetitive();
        } else if (status === reader.StatusNonStarter) {
            result.setNonStarter();
        } else if (status === reader.StatusNonFinisher) {
            result.setNonFinisher();
        } else if (status === reader.StatusDisqualified) {
            result.disqualify();
        } else if (status === reader.StatusOverMaxTime) {
            result.setOverMaxTime();
        }

        return {
            result: result,
            controls: controls
        };
    }

    /**
    * Parses a PersonResult element into a competitor and adds the resulting
    * competitor to the class.
    * @param {XMLElement} element XML PersonResult element.
    * @param {Number} number The position number within the class.
    * @param {Object} cls The class read so far.
    * @param {Object} reader XML reader used to assist with format-specific parsing.
    * @param {Array} warnings Array that accumulates warning messages.
    */
    function parsePersonResult(element, number, cls, reader, warnings) {
        var resultAndControls = parseCompetitor(element, number, reader, warnings);
        if (resultAndControls !== null) {
            var result = resultAndControls.result;
            var controls = resultAndControls.controls;
            if (cls.results.length === 0 && !(result.isNonStarter && controls.length === 0)) {
                // First result (not including non-starters with no controls).
                // Record the list of controls.
                cls.controls = controls;

                // Set the number of controls on the course if we didn't read
                // it from the XML.  Assume the first competitor's number of
                // controls is correct.
                if (cls.course.numberOfControls === null) {
                    cls.course.numberOfControls = cls.controls.length;
                }
            }

            // Subtract 2 for the start and finish cumulative times.
            var actualControlCount = result.getAllOriginalCumulativeTimes().length - 2;
            var warning = null;
            if (result.isNonStarter && actualControlCount === 0) {
                // Don't generate warnings for non-starting competitors with no controls.
            } else if (actualControlCount !== cls.course.numberOfControls) {
                warning = "Competitor '" + result.owner.name + "' in class '" + cls.name + "' has an unexpected number of controls: expected " + cls.course.numberOfControls + ", actual " + actualControlCount;
            } else {
                for (var controlIndex = 0; controlIndex < actualControlCount; controlIndex += 1) {
                    if (cls.controls[controlIndex] !== controls[controlIndex]) {
                        warning = "Competitor '" + result.owner.name + "' has an unexpected control code at control " + (controlIndex + 1) +
                            ": expected '" + cls.controls[controlIndex] + "', actual '" + controls[controlIndex] + "'";
                        break;
                    }
                }
            }

            if (warning === null) {
                cls.results.push(result);
            } else {
                warnings.push(warning);
            }
        }
    }

    /**
    * Parses a TeamResult element into a team and adds the resulting
    * team to the class.
    * @param {XMLElement} teamResultElement XML TeamResult element.
    * @param {Number} number The position number within the class.
    * @param {Object} cls The class read so far.
    * @param {Object} XML reader used to assist with format-specific parsing.
    * @param {String} relayMode The 'mode' in which to parse relay events.
    * @param {Array} warnings Array that accumulates warning messages.
    * @param {Array} allControlsLists A list of all lists of controls from the teams.
    */
    function parseTeamResult(teamResultElement, number, cls, reader, relayMode, warnings, allControlsLists) {
        var teamName = reader.readTeamName(teamResultElement);
        var teamClubName = reader.readClubName(teamResultElement);
        var members = reader.readTeamMemberResults(teamResultElement);

        if (members.length === 0) {
            warnings.push("Ignoring team " + (teamName === "" ? "(unnamed team)" : teamName) + " with no members");
            return;
        } else if (cls.results.length === 0 && members.length === 1) {
            // First team in the class has only a single member.
            // (If this is a subsequent team in a class where there are teams
            // with more than one member, the team-size check later on will
            // catch this case.)
            warnings.push("Ignoring team " + (teamName === "" ? "(unnamed team)" : teamName) + " with only a single member");
            return;
        }

        var results = [];
        var allControls = [];
        for (var index = 0; index < members.length; index += 1) {
            var resultAndControls = parseCompetitor(members[index], number, reader, warnings);
            if (resultAndControls === null) {
                // A warning for this competitor rules out the entire team.
                return;
            }

            results.push(resultAndControls.result);
            allControls.push(resultAndControls.controls);
        }

        for (index = 1; index < members.length; index += 1) {
            var previousFinishTime = $("> Result > FinishTime", members[index - 1]).text();
            var nextStartTime = $("> Result > StartTime", members[index]).text();
            if (!results[index].isNonStarter && previousFinishTime !== nextStartTime) {
                warnings.push("In team " + (teamName === "" ? "(unnamed team)" : teamName) + " in class '" + cls.name + "', " + results[index - 1].owner.name + " does not finish at the same time as " + results[index].owner.name + " starts" );
                return;
            }
        }

        var thisTeamControlCounts = allControls.map(function (controls) { return controls.length; });

        if (cls.results.length === 0) {
            // First team.  Record the team size.
            cls.teamSize = results.length;

            // Set the numbers of controls on the legs if we didn't read it
            // from the XML.  Assume the first team's numbers of controls are
            // correct.
            if (cls.course.numbersOfControls === null) {
                cls.course.numbersOfControls = thisTeamControlCounts;
            }
        }

        if (results.length !== cls.teamSize) {
            warnings.push("Team " + (teamName === "" ? "(unnamed team)" : "'" + teamName + "'") + " in class '" + cls.name + "' has an unexpected number of members: expected " + cls.teamSize + " but was actually " + results.length);
        }
        else {
            var warning = null;
            var teamResult = createTeamResult(number, results, new Team(teamName, teamClubName));

            if (relayMode !== COMMON_CONTROLS_MODE) {
                for (var teamMemberIndex = 0; teamMemberIndex < results.length; teamMemberIndex += 1) {
                    var expectedControlCount = cls.course.numbersOfControls[teamMemberIndex];
                    var memberResult = results[teamMemberIndex];

                    // Subtract 2 for the start and finish cumulative times.
                    var actualControlCount = memberResult.getAllOriginalCumulativeTimes().length - 2;

                    if (actualControlCount !== expectedControlCount) {
                        warning = "Competitor '" + memberResult.owner.name + "' in team '" + teamName + "' in class '" + cls.name + "' has an unexpected number of controls: expected " + expectedControlCount + ", actual " + actualControlCount;
                        break;
                    }
                }
            }

            if (warning === null) {
                cls.results.push(teamResult);
                if (relayMode === COMMON_CONTROLS_MODE) {
                    allControlsLists.push(allControls);
                }
            } else {
                warnings.push(warning);
            }
        }
    }

    /**
    * Pulls out of all lists of controls the common controls, and adjusts the results in
    * the class to only contain common controls.
    * @param {Object} cls The class containing the results.
    * @param {Array} allControlsLists The array of controls lists.
    */
    function processWithCommonControls(cls, allControlsLists) {
        if (cls.results.length !== allControlsLists.length) {
            throwInvalidData("Different number of results and all-controls lists");
        }

        if (allControlsLists.length === 0) {
            // This shouldn't happen, as this function is only called if there are any team results,
            // but we put it here just in case.
            throwInvalidData("Unexpected empty list of results for processing common controls");
        }

        // allControlsLists should be a list of lists of lists of control codes.
        var teamSize = allControlsLists[0].length;

        var commonControlsLists = [];
        for (var legIndex = 0; legIndex < teamSize; legIndex += 1) {
            commonControlsLists.push(determineCommonControls(
                allControlsLists.map(function (allControls) { return allControls[legIndex]; }),
                "leg " + legIndex + " of class " + cls.name));
        }

        for (var resultIndex = 0; resultIndex < cls.results.length; resultIndex += 1) {
            cls.results[resultIndex].restrictToCommonControls(allControlsLists[resultIndex], commonControlsLists);
        }

        // Now compile the list of all common controls.
        var allControls = [];
        for (legIndex = 0; legIndex < commonControlsLists.length; legIndex += 1) {
            allControls = allControls.concat(commonControlsLists[legIndex]);
            if (legIndex < commonControlsLists.length - 1) {
                // Add a control for an intermediate finish.
                allControls.push(Course.INTERMEDIATE);
            }
        }

        cls.controls = allControls;

        // Recalculate the numbers of controls in the course.
        cls.course.numbersOfControls = commonControlsLists.map(function (commonControls) { return commonControls.length; });
    }

    /**
    * Parses data for a single class.
    * @param {XMLElement} element XML ClassResult element
    * @param {Object} reader XML reader used to assist with format-specific
    *     XML reading.
    * @param {String} relayMode The 'mode' in which to parse relay events.
    * @param {Array} warnings Array to accumulate any warning messages within.
    * @return {Object} Object containing parsed data.
    */
    function parseClassData(element, reader, relayMode, warnings) {
        var jqElement = $(element);
        var cls = {name: null, results: [], teamSize: null, controls: [], course: null};

        cls.course = reader.readCourseFromClass(jqElement, warnings);

        var className = reader.readClassName(jqElement);

        if (className === "") {
            className = "<unnamed class>";
        }

        cls.name = className;
        cls.course.numbersOfControls = null;

        var personResults = $("> PersonResult", jqElement);
        var teamResults = $("> TeamResult", jqElement);

        if (personResults.length > 0 && teamResults.length > 0) {
            warnings.push("Class '" + className + "' has a combination of relay teams and individual results");
            return null;
        } else if (personResults.length > 0) {
            for (var personIndex = 0; personIndex < personResults.length; personIndex += 1) {
                parsePersonResult(personResults[personIndex], personIndex + 1, cls, reader, warnings);
            }
        } else if (teamResults.length > 0) {
            var allControlsLists = [];
            for (var teamIndex = 0; teamIndex < teamResults.length; teamIndex += 1) {
                parseTeamResult(teamResults[teamIndex], teamIndex + 1, cls, reader, relayMode, warnings, allControlsLists);
            }
            if (relayMode === COMMON_CONTROLS_MODE) {
                processWithCommonControls(cls, allControlsLists);
            }
        } else {
            warnings.push("Class '" + className + "' has no competitors");
            return null;
        }

        if (cls.course.id === null && cls.controls.length > 0) {
            // No course ID given, so join the controls together with commas
            // and use that instead.  Course IDs are only used internally by
            // this reader in order to merge classes, and the comma-separated
            // list of controls ought to work as a substitute identifier in
            // lieu of an 'official' course ID.
            //
            // This is intended mainly for IOF XML v2.0.3 files in particular
            // as they tend not to have course IDs.  However, this can also be
            // used with IOF XML v3.0 files that happen not to have course IDs.
            //
            // Idea thanks to 'dfgeorge' (David George?)
            cls.course.id = cls.controls.join(",");
        }

        return cls;
    }

    /**
    * Determine which XML reader to use to parse the given event data.
    * @param {String} data The event data.
    * @return {Object} XML reader used to read version-specific information.
    */
    function determineReader(data) {
        for (var index = 0; index < ALL_READERS.length; index += 1) {
            var reader = ALL_READERS[index];
            if (reader.isOfThisVersion(data)) {
                return reader;
            }
        }

        throwWrongFileFormat("Data apparently not of any recognised IOF XML format");
    }

    /**
    * Parses IOF XML data in either the 2.0.3 format or the 3.0 format and
    * returns the data.
    * @param {String} data String to parse as XML.
    * @param {String} relayMode The 'mode' in which to parse relay events.
    * @return {Event} Parsed event object.
    */
    function parseEventData(data, relayMode) {

        var reader = determineReader(data);

        var xml = parseXml(data);

        validateData(xml, reader);

        var classResultElements = $("> ResultList > ClassResult", $(xml)).toArray();

        if (classResultElements.length === 0) {
            throwInvalidData("No class result elements found");
        }

        var classes = [];

        // Array of all 'temporary' courses, intermediate objects that contain
        // course data but not yet in a suitable form to return.
        var tempCourses = [];

        // d3 map that maps course IDs plus comma-separated lists of controls
        // to the temporary course with that ID and controls.
        // (We expect that all classes with the same course ID have consistent
        // controls, but we don't assume that.)
        var coursesMap = d3.map();

        var warnings = [];

        classResultElements.forEach(function (classResultElement) {
            var parsedClass = parseClassData(classResultElement, reader, relayMode, warnings);
            if (parsedClass === null) {
                // Class could not be parsed.
                return;
            }

            var tempCourse = parsedClass.course;

            var numberOfControls;
            var courseKey;
            var isTeamClass;
            if (parsedClass.teams !== null && parsedClass.course.numbersOfControls !== null && parsedClass.course.numbersOfControls.length > 0) {
                numberOfControls = arraySum(parsedClass.course.numbersOfControls) + parsedClass.teamSize - 1;
                if (relayMode !== COMMON_CONTROLS_MODE) {
                    parsedClass.controls = null;
                }
                courseKey = null;
                isTeamClass = true;
            } else {
                numberOfControls = parsedClass.controls.length;
                courseKey = tempCourse.id + "," + parsedClass.controls.join(",");
                isTeamClass = false;
            }

            var courseClass = new CourseClass(parsedClass.name, numberOfControls, parsedClass.results);
            if (isTeamClass) {
                courseClass.setIsTeamClass(parsedClass.course.numbersOfControls);
            }

            classes.push(courseClass);

            // Add to each temporary course object a list of all classes.
            if (tempCourse.id !== null && courseKey !== null && coursesMap.has(courseKey)) {
                // We've come across this course before, so just add a class to
                // it.
                coursesMap.get(courseKey).classes.push(courseClass);
            } else {
                // New course.  Add some further details from the class.
                tempCourse.classes = [courseClass];
                tempCourse.controls = parsedClass.controls;
                tempCourses.push(tempCourse);
                if (tempCourse.id !== null) {
                    coursesMap.set(courseKey, tempCourse);
                }
            }
        });

        // Now build up the array of courses.
        var courses = tempCourses.map(function (tempCourse) {
            var course = new Course(tempCourse.name, tempCourse.classes, tempCourse.length, tempCourse.climb, tempCourse.controls);
            tempCourse.classes.forEach(function (courseClass) { courseClass.setCourse(course); });
            return course;
        });

        return new Event(classes, courses, warnings);
    }

    SplitsBrowser.Input.IOFXml = { parseEventData: parseEventData };
})();
/*
 *  SplitsBrowser Input - Top-level data file reading.
 *
 *  Copyright (C) 2000-2021 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    // All the parsers for parsing event data that are known about.
    var PARSERS = [
        SplitsBrowser.Input.CSV.parseEventData,
        SplitsBrowser.Input.OE.parseEventData,
        SplitsBrowser.Input.Html.parseEventData,
        SplitsBrowser.Input.AlternativeCSV.parseTripleColumnEventData,
        SplitsBrowser.Input.IOFXml.parseEventData
    ];

    /**
    * Attempts to parse the given event data, which may be of any of the
    * supported formats, or may be invalid.  This function returns the results
    * as an Event object if successful, or null in the event of failure.
    * @param {String} data The data read.
    * @param {String} relayMode The relay mode to use.
    * @return {Event} Event data read in, or null for failure.
    */
    SplitsBrowser.Input.parseEventData = function (data, relayMode) {
        for (var i = 0; i < PARSERS.length; i += 1) {
            var parser = PARSERS[i];
            try {
                return parser(data, relayMode);
            } catch (e) {
                if (e.name !== "WrongFileFormat") {
                    throw e;
                }
            }
        }

        // If we get here, none of the parsers succeeded.
        return null;
    };
})();