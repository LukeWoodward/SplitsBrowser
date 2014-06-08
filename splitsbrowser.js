/*!
 *  SplitsBrowser - Orienteering results analysis.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
// Tell JSHint not to complain that this isn't used anywhere.
/* exported SplitsBrowser */
var SplitsBrowser = { Version: "3.2.7", Model: {}, Input: {}, Controls: {} };


(function () {
    "use strict";
    
    // Whether a warning about missing messages has been given.  We don't
    // really want to irritate the user with many alert boxes if there's a
    // problem with the messages.
    var warnedAboutMessages = false;
    
    // Default alerter function, just calls window.alert.
    var alertFunc = function (message) { window.alert(message); };
    
    /**
    * Issue a warning about the messages, if a warning hasn't already been
    * issued.
    * @param {String} warning - The warning message to issue.
    */ 
    function warn(warning) {
        if (!warnedAboutMessages) {
            alertFunc(warning);
            warnedAboutMessages = true;
        }
    }
    
    /**
    * Sets the alerter to use when a warning message should be shown.
    *
    * This function is intended only for testing purposes.
    
    * @param {Function} alerter - The function to be called when a warning is
    *     to be shown.
    */
    SplitsBrowser.setMessageAlerter = function (alerter) {
        alertFunc = alerter;
    };
    
    /**
    * Attempts to get a message, returning a default string if it does not
    * exist.
    * @param {String} key - The key of the message.
    * @param {String} defaultValue - Value to be used 
    * @return {String} The message with the given key, if the key exists,
    *     otherwise the default value.
    */
    SplitsBrowser.tryGetMessage = function (key, defaultValue) {
        return (SplitsBrowser.Messages && SplitsBrowser.Messages.hasOwnProperty(key)) ? SplitsBrowser.getMessage(key) : defaultValue;
    };
    
    /**
    * Returns the message with the given key.
    * @param {String} key - The key of the message.
    * @return {String} The message with the given key, or a placeholder string
    *     if the message could not be looked up.
    */
    SplitsBrowser.getMessage = function (key) {
        if (SplitsBrowser.hasOwnProperty("Messages")) {
            if (SplitsBrowser.Messages.hasOwnProperty(key)) {
                return SplitsBrowser.Messages[key];
            } else {
                warn("Message not found for key '" + key + "'");
                return "?????";
            }
        } else {
            warn("No messages found.  Has a language file been loaded?");
            return "?????";
        }
    };
    
    /**
    * Returns the message with the given key, with some string formatting
    * applied to the result.
    *
    * The object 'params' should map search strings to their replacements.
    *
    * @param {String} key - The key of the message.
    * @param {Object} params - Object mapping parameter names to values.
    * @return {String} The resulting message.
    */ 
    SplitsBrowser.getMessageWithFormatting = function (key, params) {
        var message = SplitsBrowser.getMessage(key);
        for (var paramName in params) {
            if (params.hasOwnProperty(paramName)) {
                // Irritatingly there isn't a way of doing global replace
                // without using regexps.  So we must escape any magic regex
                // metacharacters first, so that we have a regexp that will
                // match a single static string.
                var paramNameRegexEscaped = paramName.replace(/([.+*?|{}()^$\[\]\\])/g, "\\$1");
                message = message.replace(new RegExp(paramNameRegexEscaped, "g"), params[paramName]);
            }
        }
        
        return message;
    };
})();

(function () {
    "use strict";
    
    // Minimum length of a course that is considered to be given in metres as
    // opposed to kilometres.
    var MIN_COURSE_LENGTH_METRES = 500;

    /**
     * Utility function used with filters that simply returns the object given.
     * @param x - Any input value
     * @returns The input value.
     */
    SplitsBrowser.isTrue = function (x) { return x; };

    /**
    * Utility function that returns whether a value is not null.
    * @param x - Any input value.
    * @returns True if the value is not null, false otherwise.
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
    * @param {Any} x - Any input value.
    * @return True if x is NaN, false if x is any other value.
    */
    SplitsBrowser.isNaNStrict = function (x) { return x !== x; };
    
    /**
    * Returns whether the value given is neither null nor NaN.
    * @param {?Number} x - A value to test.
    * @return {boolean} false if the value given is null or NaN, true
    *     otherwise.
    */
    SplitsBrowser.isNotNullNorNaN = function (x) { return x !== null && x === x; };

    /**
    * Exception object raised if invalid data is passed.
    * @constructor
    * @param {String} message - The exception detail message.
    */
    function InvalidData(message) {
        this.name = "InvalidData";
        this.message = message;
    }

    /**
    * Returns a string representation of this exception.
    * @returns {String} String representation.
    */
    InvalidData.prototype.toString = function () {
        return this.name + ": " + this.message;
    };

    /**
    * Utility function to throw an 'InvalidData' exception object.
    * @param {string} message - The exception message.
    * @throws {InvalidData} if invoked.
    */
    SplitsBrowser.throwInvalidData = function (message) {
        throw new InvalidData(message);
    };
    
    /**
    * Exception object raised if a data parser for a format deems that the data
    * given is not of that format.
    * @constructor
    * @param {String} message - The exception message.
    */
    function WrongFileFormat(message) {
        this.name = "WrongFileFormat";
        this.message = message;
    }
    
    /**
    * Returns a string representation of this exception.
    * @returns {String} String representation.
    */
    WrongFileFormat.prototype.toString = function () {
        return this.name + ": " + this.message;
    };
    
    /**
    * Utility funciton to throw a 'WrongFileFormat' exception object.
    * @param {string} message - The exception message.
    * @throws {WrongFileFormat} if invoked.
    */
    SplitsBrowser.throwWrongFileFormat = function (message) {
        throw new WrongFileFormat(message);
    };
    
    /**
    * Parses a course length.
    *
    * This can be specified as a decimal number of kilometres or metres, with
    * either a full stop or a comma as the decimal separator.
    *
    * @param {String} stringValue - The course length to parse, as a string.
    * @return {?Number} The parsed course length, or null if not valid.
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
    * @param {String} stringValue - The course climb to parse, as a string.
    * @return {?Number} The parsed course climb, or null if not valid.
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
    * @param {String} stringValue - The string value to normalise line endings
    *     within
    * @return {String} String value with the line-endings normalised.
    */
    SplitsBrowser.normaliseLineEndings = function (stringValue) {
        return stringValue.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    };
    
})();


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

(function () {
    "use strict";

    var NUMBER_TYPE = typeof 0;
    
    var isNotNull = SplitsBrowser.isNotNull;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var getMessage = SplitsBrowser.getMessage;

    /**
    * Function used with the JavaScript sort method to sort competitors in order
    * by finishing time.
    * 
    * Competitors that mispunch are sorted to the end of the list.
    * 
    * The return value of this method will be:
    * (1) a negative number if competitor a comes before competitor b,
    * (2) a positive number if competitor a comes after competitor a,
    * (3) zero if the order of a and b makes no difference (i.e. they have the
    *     same total time, or both mispunched.)
    * 
    * @param {SplitsBrowser.Model.Competitor} a - One competitor to compare.
    * @param {SplitsBrowser.Model.Competitor} b - The other competitor to compare.
    * @returns {Number} Result of comparing two competitors.  TH
    */
    SplitsBrowser.Model.compareCompetitors = function (a, b) {
        if (a.totalTime === b.totalTime) {
            return a.order - b.order;
        } else if (a.totalTime === null) {
            return (b.totalTime === null) ? 0 : 1;
        } else {
            return (b.totalTime === null) ? -1 : a.totalTime - b.totalTime;
        }
    };
    
    /**
    * Returns the sum of two numbers, or null if either is null.
    * @param {?Number} a - One number, or null, to add.
    * @param {?Number} b - The other number, or null, to add.
    * @return {?Number} null if at least one of a or b is null,
    *      otherwise a + b.
    */
    function addIfNotNull(a, b) {
        return (a === null || b === null) ? null : (a + b);
    }
    
    /**
    * Returns the difference of two numbers, or null if either is null.
    * @param {?Number} a - One number, or null, to add.
    * @param {?Number} b - The other number, or null, to add.
    * @return {?Number} null if at least one of a or b is null,
    *      otherwise a - b.
    */    
    function subtractIfNotNull(a, b) {
        return (a === null || b === null) ? null : (a - b);
    }
    
    /**
    * Convert an array of split times into an array of cumulative times.
    * If any null splits are given, all cumulative splits from that time
    * onwards are null also.
    *
    * The returned array of cumulative split times includes a zero value for
    * cumulative time at the start.
    * @param {Array} splitTimes - Array of split times.
    * @return {Array} Corresponding array of cumulative split times.
    */
    function cumTimesFromSplitTimes(splitTimes) {
        if (!$.isArray(splitTimes)) {
            throw new TypeError("Split times must be an array - got " + typeof splitTimes + " instead");
        } else if (splitTimes.length === 0) {
            throwInvalidData("Array of split times must not be empty");
        }
        
        var cumTimes = [0];
        for (var i = 0; i < splitTimes.length; i += 1) {
            cumTimes.push(addIfNotNull(cumTimes[i], splitTimes[i]));
        }

        return cumTimes;
    }
    
    /**
    * Convert an array of cumulative times into an array of split times.
    * If any null cumulative splits are given, the split times to and from that
    * control are null also.
    *
    * The input array should begin with a zero, for the cumulative time to the
    * start.
    * @param {Array} cumTimes - Array of cumulative split times.
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
    * Object that represents the data for a single competitor.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * The split and cumulative times passed here should be the 'original' times,
    * before any attempt is made to repair the data.
    *
    * It is not recommended to use this constructor directly.  Instead, use one of
    * the factory methods fromSplitTimes, fromCumTimes or fromOriginalCumTimes to
    * pass in either the split or cumulative times and have the other calculated.
    *
    * @constructor
    * @param {Number} order - The position of the competitor within the list of
    *     results.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {String} startTime - The competitor's start time.
    * @param {Array} originalSplitTimes - Array of split times, as numbers,
    *      with nulls for missed controls.
    * @param {Array} originalCumTimes - Array of cumulative split times, as
    *     numbers, with nulls for missed controls.
    */
    function Competitor(order, name, club, startTime, originalSplitTimes, originalCumTimes) {

        if (typeof order !== NUMBER_TYPE) {
            throwInvalidData("Competitor order must be a number, got " + typeof order + " '" + order + "' instead");
        }

        this.order = order;
        this.name = name;
        this.club = club;
        this.startTime = startTime;
        this.isNonCompetitive = false;
        this.className = null;
        
        this.originalSplitTimes = originalSplitTimes;
        this.originalCumTimes = originalCumTimes;
        this.splitTimes = null;
        this.cumTimes = null;
        this.splitRanks = null;
        this.cumRanks = null;
        this.timeLosses = null;

        this.totalTime = (originalCumTimes === null || originalCumTimes.indexOf(null) > -1) ? null : originalCumTimes[originalCumTimes.length - 1];
    }
    
    /**
    * Marks this competitor as being non-competitive.
    */
    Competitor.prototype.setNonCompetitive = function () {
        this.isNonCompetitive = true;
    };
    
    /**
    * Sets the name of the class that the competitor belongs to.
    * @param {String} className - The name of the class.
    */
    Competitor.prototype.setClassName = function (className) {
        this.className = className;
    };
    
    /**
    * Create and return a Competitor object where the competitor's times are given
    * as a list of split times.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * @param {Number} order - The position of the competitor within the list of results.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {Number} startTime - The competitor's start time, as seconds past midnight.
    * @param {Array} splitTimes - Array of split times, as numbers, with nulls for missed controls.
    * @return {Competitor} Created competitor.
    */
    Competitor.fromSplitTimes = function (order, name, club, startTime, splitTimes) {
        var cumTimes = cumTimesFromSplitTimes(splitTimes);
        var competitor = new Competitor(order, name, club, startTime, splitTimes, cumTimes);
        competitor.splitTimes = splitTimes;
        competitor.cumTimes = cumTimes;
        return competitor;
    };
    
    /**
    * Create and return a Competitor object where the competitor's times are given
    * as a list of cumulative times.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * This method does not assume that the data given has been 'repaired'.  This
    * function should therefore be used to create a competitor if the data may
    * later need to be repaired.
    *
    * @param {Number} order - The position of the competitor within the list of results.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {Number} startTime - The competitor's start time, as seconds past midnight.
    * @param {Array} cumTimes - Array of cumulative split times, as numbers, with nulls for missed controls.
    * @return {Competitor} Created competitor.
    */
    Competitor.fromOriginalCumTimes = function (order, name, club, startTime, cumTimes) {
        var splitTimes = splitTimesFromCumTimes(cumTimes);
        return new Competitor(order, name, club, startTime, splitTimes, cumTimes);
    };
    
    /**
    * Create and return a Competitor object where the competitor's times are given
    * as a list of cumulative times.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * This method assumes that the data given has been repaired, so it is ready
    * to be viewed.
    *
    * @param {Number} order - The position of the competitor within the list of results.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {Number} startTime - The competitor's start time, as seconds past midnight.
    * @param {Array} cumTimes - Array of cumulative split times, as numbers, with nulls for missed controls.
    * @return {Competitor} Created competitor.
    */
    Competitor.fromCumTimes = function (order, name, club, startTime, cumTimes) {
        var competitor = Competitor.fromOriginalCumTimes(order, name, club, startTime, cumTimes);
        competitor.splitTimes = competitor.originalSplitTimes;
        competitor.cumTimes = competitor.originalCumTimes;
        return competitor;
    };
    
    /**
    * Sets the 'repaired' cumulative times for a competitor.  This also
    * calculates the repaired split times.
    * @param {Array} cumTimes - The 'repaired' cumulative times.
    */
    Competitor.prototype.setRepairedCumulativeTimes = function (cumTimes) {
        this.cumTimes = cumTimes;
        this.splitTimes = splitTimesFromCumTimes(cumTimes);
    };
    
    /**
    * Returns whether this competitor completed the course.
    * @return {boolean} Whether the competitor completed the course.
    */
    Competitor.prototype.completed = function () {
        return this.totalTime !== null;
    };
    
    /**
    * Returns the 'suffix' to use with this competitor.
    * The suffix indicates whether they are non-competitive or a mispuncher.  If
    * they are neither, an empty string is returned.
    * @return {String} Suffix to use with this competitor.
    */
    Competitor.prototype.getSuffix = function () {
        if (this.completed()) {
            return (this.isNonCompetitive) ? getMessage("NonCompetitiveShort") : "";
        } else {
            return getMessage("MispunchedShort");
        }
    };
    
    /**
    * Returns the competitor's split to the given control.  If the control
    * index given is zero (i.e. the start), zero is returned.  If the
    * competitor has no time recorded for that control, null is returned.
    * If the value is missing, because the value read from the file was
    * invalid, NaN is returned.
    * 
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {?Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getSplitTimeTo = function (controlIndex) {
        return (controlIndex === 0) ? 0 : this.splitTimes[controlIndex - 1];
    };
    
    /**
    * Returns the competitor's 'original' split to the given control.  This is
    * always the value read from the source data file, or derived directly from
    * this data, before any attempt was made to repair the competitor's data.
    * 
    * If the control index given is zero (i.e. the start), zero is returned.
    * If the competitor has no time recorded for that control, null is
    * returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {?Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getOriginalSplitTimeTo = function (controlIndex) {
        return (controlIndex === 0) ? 0 : this.originalSplitTimes[controlIndex - 1];
    };
    
    /**
    * Returns whether the control with the given index is deemed to have a
    * dubious split time.
    * @param {Number} controlIndex - The index of the control.
    * @return {boolean} True if the split time to the given control is dubious,
    *     false if not.
    */
    Competitor.prototype.isSplitTimeDubious = function (controlIndex) {
        return (controlIndex > 0 && this.originalSplitTimes[controlIndex - 1] !== this.splitTimes[controlIndex - 1]);
    };
    
    /**
    * Returns the competitor's cumulative split to the given control.  If the
    * control index given is zero (i.e. the start), zero is returned.   If the
    * competitor has no cumulative time recorded for that control, null is
    * returned.  If the competitor recorded a time, but the time was deemed to
    * be invalid, NaN will be returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The cumulative split time in seconds for the competitor
    *      to the given control.
    */
    Competitor.prototype.getCumulativeTimeTo = function (controlIndex) {
        return this.cumTimes[controlIndex];
    };
    
    /**
    * Returns the 'original' cumulative time the competitor took to the given
    * control.  This is always the value read from the source data file, before
    * any attempt was made to repair the competitor's data.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The cumulative split time in seconds for the competitor
    *      to the given control.
    */
    Competitor.prototype.getOriginalCumulativeTimeTo = function (controlIndex) {
        return this.originalCumTimes[controlIndex];
    };
    
    /**
    * Returns whether the control with the given index is deemed to have a
    * dubious cumulative time.
    * @param {Number} controlIndex - The index of the control.
    * @return {boolean} True if the cumulative time to the given control is
    *     dubious, false if not.
    */
    Competitor.prototype.isCumulativeTimeDubious = function (controlIndex) {
        return this.originalCumTimes[controlIndex] !== this.cumTimes[controlIndex];
    };
    
    /**
    * Returns the rank of the competitor's split to the given control.  If the
    * control index given is zero (i.e. the start), or if the competitor has no
    * time recorded for that control, null is returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getSplitRankTo = function (controlIndex) {
        return (controlIndex === 0) ? null : this.splitRanks[controlIndex - 1];
    };
    
    /**
    * Returns the rank of the competitor's cumulative split to the given
    * control.  If the control index given is zero (i.e. the start), or if the
    * competitor has no time recorded for that control, null is returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getCumulativeRankTo = function (controlIndex) {
        return (controlIndex === 0) ? null : this.cumRanks[controlIndex - 1];
    };
    
    /**
    * Returns the time loss of the competitor at the given control, or null if
    * time losses cannot be calculated for the competitor or have not yet been
    * calculated.
    * @param {Number} controlIndex - Index of the control.
    * @return {?Number} Time loss in seconds, or null.
    */
    Competitor.prototype.getTimeLossAt = function (controlIndex) {
        return (controlIndex === 0 || this.timeLosses === null) ? null : this.timeLosses[controlIndex - 1];
    };
    
    /**
    * Returns all of the competitor's cumulative time splits.
    * @return {Array} The cumulative split times in seconds for the competitor.
    */
    Competitor.prototype.getAllCumulativeTimes = function () {
        return this.cumTimes;
    };
    
    /**
    * Returns all of the competitor's cumulative time splits.
    * @return {Array} The cumulative split times in seconds for the competitor.
    */
    Competitor.prototype.getAllOriginalCumulativeTimes = function () {
        return this.originalCumTimes;
    };
    
    /**
    * Returns whether this competitor is missing a start time.
    * 
    * The competitor is missing its start time if it doesn't have a start time
    * and it also has at least one split.  (A competitor that has no start time
    * and no splits either didn't start the race.)
    *
    * @return {boolean} True if the competitor doesn't have a start time, false
    *     if they do, or if they have no other splits.
    */
    Competitor.prototype.lacksStartTime = function () {
        return this.startTime === null && this.splitTimes.some(isNotNull);
    };
    
    /**
    * Sets the split and cumulative-split ranks for this competitor.
    * @param {Array} splitRanks - Array of split ranks for this competitor.
    * @param {Array} cumRanks - Array of cumulative-split ranks for this competitor.
    */
    Competitor.prototype.setSplitAndCumulativeRanks = function (splitRanks, cumRanks) {
        this.splitRanks = splitRanks;
        this.cumRanks = cumRanks;
    };

    /**
    * Return this competitor's cumulative times after being adjusted by a 'reference' competitor.
    * @param {Array} referenceCumTimes - The reference cumulative-split-time data to adjust by.
    * @return {Array} The array of adjusted data.
    */
    Competitor.prototype.getCumTimesAdjustedToReference = function (referenceCumTimes) {
        if (referenceCumTimes.length !== this.cumTimes.length) {
            throwInvalidData("Cannot adjust competitor times because the numbers of times are different (" + this.cumTimes.length + " and " + referenceCumTimes.length + ")");
        } else if (referenceCumTimes.indexOf(null) > -1) {
            throwInvalidData("Cannot adjust competitor times because a null value is in the reference data");
        }

        var adjustedTimes = this.cumTimes.map(function (time, idx) { return subtractIfNotNull(time, referenceCumTimes[idx]); });
        return adjustedTimes;
    };
    
    /**
    * Returns the cumulative times of this competitor with the start time added on.
    * @param {Array} referenceCumTimes - The reference cumulative-split-time data to adjust by.
    * @return {Array} The array of adjusted data.
    */
    Competitor.prototype.getCumTimesAdjustedToReferenceWithStartAdded = function (referenceCumTimes) {
        var adjustedTimes = this.getCumTimesAdjustedToReference(referenceCumTimes);
        var startTime = this.startTime;
        return adjustedTimes.map(function (adjTime) { return addIfNotNull(adjTime, startTime); });
    };
    
    /**
    * Returns an array of percentages that this competitor's splits were behind
    * those of a reference competitor.
    * @param {Array} referenceCumTimes - The reference cumulative split times
    * @return {Array} The array of percentages.
    */
    Competitor.prototype.getSplitPercentsBehindReferenceCumTimes = function (referenceCumTimes) {
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
                } else {
                    percentsBehind.push(null);
                }
            }
        });
        
        return percentsBehind;
    };
    
    /**
    * Determines the time losses for this competitor.
    * @param {Array} fastestSplitTimes - Array of fastest split times.
    */
    Competitor.prototype.determineTimeLosses = function (fastestSplitTimes) {
        if (this.completed()) {
            if (fastestSplitTimes.length !== this.splitTimes.length) {
                throwInvalidData("Cannot determine time loss of competitor with " + this.splitTimes.length + " split times using " + fastestSplitTimes.length + " fastest splits");
            }  else if (fastestSplitTimes.some(isNaNStrict)) {
                throwInvalidData("Cannot determine time loss of competitor when there is a NaN value in the fastest splits");
            }
            
            if (fastestSplitTimes.some(function (split) { return split === 0; })) {
                // Someone registered a zero split on this course.  In this
                // situation the time losses don't really make sense.
                this.timeLosses = this.splitTimes.map(function () { return NaN; });
            } else if (this.splitTimes.some(isNaNStrict)) {
                // Competitor has some dubious times.  Unfortunately this
                // means we cannot sensibly calculate the time losses.
                this.timeLosses = this.splitTimes.map(function () { return NaN; });
            } else {
                // We use the same algorithm for calculating time loss as the
                // original, with a simplification: we calculate split ratios
                // (split[i] / fastest[i]) rather than time loss rates
                // (split[i] - fastest[i])/fastest[i].  A control's split ratio
                // is its time loss rate plus 1.  Not subtracting one at the start
                // means that we then don't have to add it back on at the end.
                
                var splitRatios = this.splitTimes.map(function (splitTime, index) {
                    return splitTime / fastestSplitTimes[index];
                });
                
                splitRatios.sort(d3.ascending);
                
                var medianSplitRatio;
                if (splitRatios.length % 2 === 1) {
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
    * Returns whether this competitor 'crosses' another.  Two competitors are
    * considered to have crossed if their chart lines on the Race Graph cross.
    * @param {Competitor} other - The competitor to compare against.
    * @return {Boolean} true if the competitors cross, false if they don't.
    */
    Competitor.prototype.crosses = function (other) {
        if (other.cumTimes.length !== this.cumTimes.length) {
            throwInvalidData("Two competitors with different numbers of controls cannot cross");
        }
        
        // We determine whether two competitors cross by keeping track of
        // whether this competitor is ahead of other at any point, and whether
        // this competitor is behind the other one.  If both, the competitors
        // cross.
        var beforeOther = false;
        var afterOther = false;
        
        for (var controlIdx = 0; controlIdx < this.cumTimes.length; controlIdx += 1) {
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
    * Returns an array of objects that record the indexes around which times in
    * the given array are NaN.
    * @param {Array} times - Array of time values.
    * @return {Array} Array of objects that 
    */
    function getIndexesAroundDubiousTimes(times) {
        var dubiousTimeInfo = [];
        var startIndex = 1;
        while (startIndex + 1 < times.length) {
            if (isNaNStrict(times[startIndex])) {
                var endIndex = startIndex;
                while (endIndex + 1 < times.length && isNaNStrict(times[endIndex + 1])) {
                    endIndex += 1;
                }
                
                if (endIndex + 1 < times.length && times[startIndex - 1] !== null && times[endIndex + 1] !== null) {
                    dubiousTimeInfo.push({start: startIndex - 1, end: endIndex + 1});
                }
                
                startIndex = endIndex + 1;
                
            } else {
                startIndex += 1;
            }
        }
        
        return dubiousTimeInfo;
    }
    
    /**
    * Returns an array of objects that list the controls around those that have
    * dubious cumulative times.
    * @return {Array} Array of objects that detail the start and end indexes
    *     around dubious cumulative times.
    */
    Competitor.prototype.getControlIndexesAroundDubiousCumulativeTimes = function () {
        return getIndexesAroundDubiousTimes(this.cumTimes);
    };
    
    /**
    * Returns an array of objects that list the controls around those that have
    * dubious cumulative times.
    * @return {Array} Array of objects that detail the start and end indexes
    *     around dubious cumulative times.
    */
    Competitor.prototype.getControlIndexesAroundDubiousSplitTimes = function () {
        return getIndexesAroundDubiousTimes([0].concat(this.splitTimes));
    };
    
    SplitsBrowser.Model.Competitor = Competitor;
})();

(function (){
    "use strict";

    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    
    /**
     * Object that represents a collection of competitor data for a class.
     * @constructor.
     * @param {String} name - Name of the age class.
     * @param {Number} numControls - Number of controls.
     * @param {Array} competitors - Array of Competitor objects.
     */
    function AgeClass(name, numControls, competitors) {
        this.name = name;
        this.numControls = numControls;
        this.competitors = competitors;
        this.course = null;
        this.hasDubiousData = false;
        this.competitors.forEach(function (comp) {
            comp.setClassName(name);
        });
    }
    
    /**
    * Records that this age-class has competitor data that SplitsBrowser has
    * deduced as dubious.
    */
    AgeClass.prototype.recordHasDubiousData = function () {
        this.hasDubiousData = true;
    };
     
    /**
    * Determines the time losses for the competitors in this age class.
    */
    AgeClass.prototype.determineTimeLosses = function () {
        var fastestSplitTimes = d3.range(1, this.numControls + 2).map(function (controlIdx) {
            var splitRec = this.getFastestSplitTo(controlIdx);
            return (splitRec === null) ? null : splitRec.split;
        }, this);
        
        this.competitors.forEach(function (comp) {
            comp.determineTimeLosses(fastestSplitTimes);
        });
    };
    
    /**
    * Returns whether this age-class is empty, i.e. has no competitors.
    * @return {boolean} True if this age class has no competitors, false if it
    *     has at least one competitor.
    */
    AgeClass.prototype.isEmpty = function () {
        return (this.competitors.length === 0);
    };
    
    /**
    * Sets the course that this age class belongs to.
    * @param {SplitsBrowser.Model.Course} course - The course this class belongs to.
    */
    AgeClass.prototype.setCourse = function (course) {
        this.course = course;
    };

    /**
    * Returns the fastest split time recorded by competitors in this class.  If
    * no fastest split time is recorded (e.g. because all competitors
    * mispunched that control, or the class is empty), null is returned.
    * @param {Number} controlIdx - The index of the control to return the
    *      fastest split to.
    * @return {?Object} Object containing the name and fastest split, or
    *      null if no split times for that control were recorded.
    */
    AgeClass.prototype.getFastestSplitTo = function (controlIdx) {
        if (typeof controlIdx !== "number" || controlIdx < 1 || controlIdx > this.numControls + 1) {
            throwInvalidData("Cannot return splits to leg '" + controlIdx + "' in a course with " + this.numControls + " control(s)");
        }
    
        var fastestSplit = null;
        var fastestCompetitor = null;
        this.competitors.forEach(function (comp) {
            var compSplit = comp.getSplitTimeTo(controlIdx);
            if (isNotNullNorNaN(compSplit)) {
                if (fastestSplit === null || compSplit < fastestSplit) {
                    fastestSplit = compSplit;
                    fastestCompetitor = comp;
                }
            }
        });
        
        return (fastestSplit === null) ? null : {split: fastestSplit, name: fastestCompetitor.name};
    };
    
    /**
    * Returns all competitors that visited the control in the given time
    * interval.
    * @param {Number} controlNum - The number of the control, with 0 being the
    *     start, and this.numControls + 1 being the finish.
    * @param {Number} intervalStart - The start time of the interval, as
    *     seconds past midnight.
    * @param {Number} intervalEnd - The end time of the interval, as seconds
    *     past midnight.
    * @return {Array} Array of objects listing the name and start time of each
    *     competitor visiting the control within the given time interval.
    */
    AgeClass.prototype.getCompetitorsAtControlInTimeRange = function (controlNum, intervalStart, intervalEnd) {
        if (typeof controlNum !== "number" || isNaN(controlNum) || controlNum < 0 || controlNum > this.numControls + 1) {
            throwInvalidData("Control number must be a number between 0 and " + this.numControls + " inclusive");
        }
        
        var matchingCompetitors = [];
        this.competitors.forEach(function (comp) {
            var cumTime = comp.getCumulativeTimeTo(controlNum);
            if (cumTime !== null && comp.startTime !== null) {
                var actualTimeAtControl = cumTime + comp.startTime;
                if (intervalStart <= actualTimeAtControl && actualTimeAtControl <= intervalEnd) {
                    matchingCompetitors.push({name: comp.name, time: actualTimeAtControl});
                }
            }
        });
        
        return matchingCompetitors;
    };
    
    SplitsBrowser.Model.AgeClass = AgeClass;
})();

(function () {
    "use strict";
    
    var isNotNull = SplitsBrowser.isNotNull;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var throwInvalidData = SplitsBrowser.throwInvalidData; 
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    
    /**
    * Utility function to merge the lists of all competitors in a number of age
    * classes.  All age classes must contain the same number of controls.
    * @param {Array} ageClasses - Array of AgeClass objects.
    * @return {Array} Merged array of competitors.
    */
    function mergeCompetitors(ageClasses) {
        if (ageClasses.length === 0) {
            throwInvalidData("Cannot create an AgeClassSet from an empty set of competitors");
        }
        
        var allCompetitors = [];
        var expectedControlCount = ageClasses[0].numControls;
        ageClasses.forEach(function (ageClass) {
            if (ageClass.numControls !== expectedControlCount) {
                throwInvalidData("Cannot merge age classes with " + expectedControlCount + " and " + ageClass.numControls + " controls");
            }
            
            ageClass.competitors.forEach(function (comp) { allCompetitors.push(comp); });
        });

        allCompetitors.sort(compareCompetitors);
        return allCompetitors;
    }

    /**
    * Given an array of numbers, return a list of the corresponding ranks of those
    * numbers.
    * @param {Array} sourceData - Array of number values.
    * @returns Array of corresponding ranks.
    */
    function getRanks(sourceData) {
        // First, sort the source data, removing nulls.
        var sortedData = sourceData.filter(isNotNullNorNaN);
        sortedData.sort(d3.ascending);
        
        // Now construct a map that maps from source value to rank.
        var rankMap = new d3.map();
        sortedData.forEach(function(value, index) {
            if (!rankMap.has(value)) {
                rankMap.set(value, index + 1);
            }
        });
        
        // Finally, build and return the list of ranks.
        var ranks = sourceData.map(function(value) {
            return isNotNullNorNaN(value) ? rankMap.get(value) : value;
        });
        
        return ranks;
    }
    
    /**
    * An object that represents the currently-selected age classes.
    * @constructor
    * @param {Array} ageClasses - Array of currently-selected age classes.
    */
    function AgeClassSet(ageClasses) {
        this.allCompetitors = mergeCompetitors(ageClasses);
        this.ageClasses = ageClasses;
        this.numControls = ageClasses[0].numControls;
        this.computeRanks();
    }
    
    /**
    * Returns whether this age-class set is empty, i.e. whether it has no
    * competitors at all.
    * @return {boolean} True if the age-class set is empty, false if it is not
    *     empty.
    */    
    AgeClassSet.prototype.isEmpty = function () {
        return this.allCompetitors.length === 0;
    };
    
    /**
    * Returns the course used by all of the age classes that make up this set.
    * @return {SplitsBrowser.Model.Course} The course used by all age-classes.
    */
    AgeClassSet.prototype.getCourse = function () {
        return this.ageClasses[0].course;
    };
    
    /**
    * Returns the name of the 'primary' age class, i.e. that that has been
    * chosen in the drop-down list.
    * @return {String} Name of the primary age class.
    */
    AgeClassSet.prototype.getPrimaryClassName = function () {
        return this.ageClasses[0].name;
    };
    
    /**
    * Returns the number of age classes that this age-class set is made up of.
    * @return {Number} The number of age classes that this age-class set is
    *     made up of.
    */
    AgeClassSet.prototype.getNumClasses = function () {
        return this.ageClasses.length;
    };
    
    /**
    * Returns whether any of the age-classes within this set have data that
    * SplitsBrowser can identify as dubious.
    * @return {boolean} True if any of the age-classes within this set contain
    *     dubious data, false if none of them do.
    */
    AgeClassSet.prototype.hasDubiousData = function () {
        return this.ageClasses.some(function (ageClass) { return ageClass.hasDubiousData; });
    };

    /**
    * Return a list of objects that describe when the given array of times has
    * null or NaN values.  This does not include trailing null or NaN values.
    * @param {Array} times - Array of times, which may include NaNs and nulls.
    * @return {Array} Array of objects that describes when the given array has
    *    ranges of null and/or NaN values.
    */
    function getBlankRanges(times) {
        var blankRangeInfo = [];
        var startIndex = 1;
        while (startIndex + 1 < times.length) {
            if (isNotNullNorNaN(times[startIndex])) {
                startIndex += 1;
            } else {
                var endIndex = startIndex;
                while (endIndex + 1 < times.length && !isNotNullNorNaN(times[endIndex + 1])) {
                    endIndex += 1;
                }
                
                if (endIndex + 1 < times.length) {
                    blankRangeInfo.push({start: startIndex - 1, end: endIndex + 1});
                }
                
                startIndex = endIndex + 1;
            }
        }
        
        return blankRangeInfo;
    }

    /**
    * Fill in any NaN values in the given list of cumulative times by doing
    * a linear interpolation on the missing values.
    * @param {Array} cumTimes - Array of cumulative times.
    * @return {Array} Array of cumulative times with NaNs replaced.
    */
    function fillBlankRangesInCumulativeTimes(cumTimes) {
        cumTimes = cumTimes.slice(0);
        var blankRanges = getBlankRanges(cumTimes);
        for (var rangeIndex = 0; rangeIndex < blankRanges.length; rangeIndex += 1) {
            var range = blankRanges[rangeIndex];
            var timeBefore = cumTimes[range.start];
            var timeAfter = cumTimes[range.end];
            var avgTimePerControl = (timeAfter - timeBefore) / (range.end - range.start);
            for (var index = range.start + 1; index < range.end; index += 1) {
                cumTimes[index] = timeBefore + (index - range.start) * avgTimePerControl;
            }
        }
        
        var lastNaNTimeIndex = cumTimes.length;
        while (lastNaNTimeIndex >= 0 && isNaNStrict(cumTimes[lastNaNTimeIndex - 1])) {
            lastNaNTimeIndex -= 1;
        }
        
        if (lastNaNTimeIndex > 0) {
            for (var timeIndex = lastNaNTimeIndex; timeIndex < cumTimes.length; timeIndex += 1) {
                cumTimes[timeIndex] = cumTimes[timeIndex - 1] + ((timeIndex === cumTimes.length - 1) ? 60 : 180);
            }
        }
        
        return cumTimes;
    }
    
    /**
    * Returns an array of the cumulative times of the winner of the set of age
    * classes.
    * @return {Array} Array of the winner's cumulative times.
    */
    AgeClassSet.prototype.getWinnerCumTimes = function () {
        if (this.allCompetitors.length === 0) {
            return null;
        }
        
        var firstCompetitor = this.allCompetitors[0];
        return (firstCompetitor.completed()) ? fillBlankRangesInCumulativeTimes(firstCompetitor.cumTimes) : null;
    };

    /**
    * Return the imaginary competitor who recorded the fastest time on each leg
    * of the class.
    * If at least one control has no competitors recording a time for it, null
    * is returned.
    * @returns {?Array} Cumulative splits of the imaginary competitor with
    *           fastest time, if any.
    */
    AgeClassSet.prototype.getFastestCumTimes = function () {
        return this.getFastestCumTimesPlusPercentage(0);
    };
    
    /**
    * Return the imaginary competitor who recorded the fastest time on each leg
    * of the given classes, with a given percentage of their time added.
    * If at least one control has no competitors recording a time for it, null
    * is returned.
    * @param {Number} percent - The percentage of time to add.
    * @returns {?Array} Cumulative splits of the imaginary competitor with
    *           fastest time, if any, after adding a percentage.
    */
    AgeClassSet.prototype.getFastestCumTimesPlusPercentage = function (percent) {
    
        var ratio = 1 + percent / 100;
        
        var fastestSplits = new Array(this.numControls + 1);
        fastestSplits[0] = 0;
        
        for (var controlIdx = 1; controlIdx <= this.numControls + 1; controlIdx += 1) {
            var fastestForThisControl = null;
            for (var competitorIdx = 0; competitorIdx < this.allCompetitors.length; competitorIdx += 1) {
                var thisTime = this.allCompetitors[competitorIdx].getSplitTimeTo(controlIdx);
                if (isNotNullNorNaN(thisTime) && (fastestForThisControl === null || thisTime < fastestForThisControl)) {
                    fastestForThisControl = thisTime;
                }
            }
            
            fastestSplits[controlIdx] = fastestForThisControl;
        }
     
        if (!fastestSplits.every(isNotNull)) {
            // We don't have fastest splits for every control, so there was one
            // control that either nobody punched or everybody had a dubious
            // split for.
            
            // Find the blank-ranges of the fastest times.
            var fastestBlankRanges = getBlankRanges(fastestSplits);
            
            // Find all blank-ranges of competitors.
            var allCompetitorBlankRanges = [];
            this.allCompetitors.forEach(function (competitor) {
                var competitorBlankRanges = getBlankRanges(competitor.getAllCumulativeTimes());
                competitorBlankRanges.forEach(function (range) {
                    allCompetitorBlankRanges.push({
                        start: range.start,
                        end: range.end,
                        size: range.end - range.start,
                        overallSplit: competitor.getCumulativeTimeTo(range.end) - competitor.getCumulativeTimeTo(range.start)
                    });
                });
            });
            
            // Now, for each blank range of the fastest times, find the
            // size of the smallest competitor blank range that covers it,
            // and then the fastest split among those competitors.
            fastestBlankRanges.forEach(function (fastestRange) {
                var coveringCompetitorRanges = allCompetitorBlankRanges.filter(function (compRange) {
                    return compRange.start <= fastestRange.start && fastestRange.end <= compRange.end + 1;
                });
                
                var minSize = null;
                var minOverallSplit = null;
                coveringCompetitorRanges.forEach(function (coveringRange) {
                    if (minSize === null || coveringRange.size < minSize) {
                        minSize = coveringRange.size;
                        minOverallSplit = null;
                    }
                    
                    if (minOverallSplit === null || coveringRange.overallSplit < minOverallSplit) {
                        minOverallSplit = coveringRange.overallSplit;
                    }
                });
                
                // Assume that the fastest competitor across the range had
                // equal splits for all controls on the range.  This won't
                // always make sense but it's the best we can do.
                if (minSize !== null && minOverallSplit !== null) {
                    for (var index = fastestRange.start + 1; index < fastestRange.end; index += 1) {
                        fastestSplits[index] = minOverallSplit / minSize;
                    }
                }
            });
        }
                
        if (!fastestSplits.every(isNotNull)) {
            // Could happen if the competitors are created from split times and
            // the splits are not complete, and also if nobody punches the
            // final few controls.  Set any remaining missing splits to 3
            // minutes for intermediate controls and 1 minute for the finish.
            for (var index = 0; index < fastestSplits.length; index += 1) {
                if (fastestSplits[index] === null) {
                    fastestSplits[index] = (index === fastestSplits.length - 1) ? 60 : 180;
                }
            }
        }
        
        var fastestCumTimes = new Array(this.numControls + 1);
        fastestSplits.forEach(function (fastestSplit, index) {
            fastestCumTimes[index] = (index === 0) ? 0 : fastestCumTimes[index - 1] + fastestSplit * ratio;
        });

        return fastestCumTimes;
    };

    /**
    * Returns the cumulative times for the competitor with the given index,
    * with any runs of blanks filled in.
    * @param {Number} competitorIndex - The index of the competitor.
    * @return {Array} Array of cumulative times.
    */
    AgeClassSet.prototype.getCumulativeTimesForCompetitor = function (competitorIndex) {
        return fillBlankRangesInCumulativeTimes(this.allCompetitors[competitorIndex].getAllCumulativeTimes());
    };

    /**
    * Compute the ranks of each competitor within their class.
    */
    AgeClassSet.prototype.computeRanks = function () {
        var splitRanksByCompetitor = [];
        var cumRanksByCompetitor = [];
        
        this.allCompetitors.forEach(function () {
            splitRanksByCompetitor.push([]);
            cumRanksByCompetitor.push([]);
        });
        
        d3.range(1, this.numControls + 2).forEach(function (control) {
            var splitsByCompetitor = this.allCompetitors.map(function(comp) { return comp.getSplitTimeTo(control); });
            var splitRanksForThisControl = getRanks(splitsByCompetitor);
            this.allCompetitors.forEach(function (_comp, idx) { splitRanksByCompetitor[idx].push(splitRanksForThisControl[idx]); });
        }, this);
        
        d3.range(1, this.numControls + 2).forEach(function (control) {
            // We want to null out all subsequent cumulative ranks after a
            // competitor mispunches.
            var cumSplitsByCompetitor = this.allCompetitors.map(function (comp, idx) {
                // -1 for previous control, another -1 because the cumulative
                // time to control N is cumRanksByCompetitor[idx][N - 1].
                if (control > 1 && cumRanksByCompetitor[idx][control - 1 - 1] === null) {
                    // This competitor has no cumulative rank for the previous
                    // control, so either they mispunched it or mispunched a
                    // previous one.  Give them a null time here, so that they
                    // end up with another null cumulative rank.
                    return null;
                } else {
                    return comp.getCumulativeTimeTo(control);
                }
            });
            var cumRanksForThisControl = getRanks(cumSplitsByCompetitor);
            this.allCompetitors.forEach(function (_comp, idx) { cumRanksByCompetitor[idx].push(cumRanksForThisControl[idx]); });
        }, this);
        
        this.allCompetitors.forEach(function (comp, idx) {
            comp.setSplitAndCumulativeRanks(splitRanksByCompetitor[idx], cumRanksByCompetitor[idx]);
        });
    };
    
    /**
    * Returns the best few splits to a given control.
    *
    * The number of splits returned may actually be fewer than that asked for,
    * if there are fewer than that number of people on the class or who punch
    * the control.
    *
    * The results are returned in an array of 2-element arrays, with each child
    * array containing the split time and the name.  The array is returned in
    * ascending order of split time.
    *
    * @param {Number} numSplits - Maximum number of split times to return.
    * @param {Number} controlIdx - Index of the control.
    * @return {Array} Array of the fastest splits to the given control.
    */
    AgeClassSet.prototype.getFastestSplitsTo = function (numSplits, controlIdx) {
        if (typeof numSplits !== "number" || numSplits <= 0) {
            throwInvalidData("The number of splits must be a positive integer");
        } else if (typeof controlIdx !== "number" || controlIdx <= 0 || controlIdx > this.numControls + 1) {
            throwInvalidData("Control " + controlIdx + " out of range");
        } else {
            // Compare competitors by split time at this control, and, if those
            // are equal, total time.
            var comparator = function (compA, compB) {
                var compASplit = compA.getSplitTimeTo(controlIdx);
                var compBSplit = compB.getSplitTimeTo(controlIdx);
                return (compASplit === compBSplit) ? d3.ascending(compA.totalTime, compB.totalTime) : d3.ascending(compASplit, compBSplit);
            };
            
            var competitors = this.allCompetitors.filter(function (comp) { return comp.completed() && !isNaNStrict(comp.getSplitTimeTo(controlIdx)); });
            competitors.sort(comparator);
            var results = [];
            for (var i = 0; i < competitors.length && i < numSplits; i += 1) {
                results.push({name: competitors[i].name, split: competitors[i].getSplitTimeTo(controlIdx)});
            }
            
            return results;
        }
    };    

    /**
    * Return data from the current classes in a form suitable for plotting in a chart.
    * @param {Array} referenceCumTimes - 'Reference' cumulative time data, such
    *            as that of the winner, or the fastest time.
    * @param {Array} currentIndexes - Array of indexes that indicate which
    *           competitors from the overall list are plotted.
    * @param {Object} chartType - The type of chart to draw.
    * @returns {Object} Array of data.
    */
    AgeClassSet.prototype.getChartData = function (referenceCumTimes, currentIndexes, chartType) {
        if (this.isEmpty()) {
            throwInvalidData("Cannot return chart data when there is no data");
        } else if (typeof referenceCumTimes === "undefined") {
            throw new TypeError("referenceCumTimes undefined or missing");
        } else if (typeof currentIndexes === "undefined") {
            throw new TypeError("currentIndexes undefined or missing");
        } else if (typeof chartType === "undefined") {
            throw new TypeError("chartType undefined or missing");
        }

        var competitorData = this.allCompetitors.map(function (comp) { return chartType.dataSelector(comp, referenceCumTimes); });
        var selectedCompetitorData = currentIndexes.map(function (index) { return competitorData[index]; });

        var xMin = d3.min(referenceCumTimes);
        var xMax = d3.max(referenceCumTimes);
        var yMin;
        var yMax;
        if (currentIndexes.length === 0) {
            // No competitors selected.  Set yMin and yMax to the boundary
            // values of the first competitor.
            var firstCompetitorTimes = competitorData[0];
            yMin = d3.min(firstCompetitorTimes);
            yMax = d3.max(firstCompetitorTimes);
        } else {
            yMin = d3.min(selectedCompetitorData.map(function (values) { return d3.min(values); }));
            yMax = d3.max(selectedCompetitorData.map(function (values) { return d3.max(values); }));
        }

        if (yMax === yMin) {
            // yMin and yMax will be used to scale a y-axis, so we'd better
            // make sure that they're not equal.
            yMax = yMin + 1;
        }
        
        var controlIndexAdjust = (chartType.skipStart) ? 1 : 0;
        var dubiousTimesInfo = currentIndexes.map(function (competitorIndex) {
            var indexPairs = chartType.indexesAroundDubiousTimesFunc(this.allCompetitors[competitorIndex]);
            return indexPairs.filter(function (indexPair) { return indexPair.start >= controlIndexAdjust; })
                             .map(function (indexPair) { return { start: indexPair.start - controlIndexAdjust, end: indexPair.end - controlIndexAdjust }; });
        }, this);

        var cumulativeTimesByControl = d3.transpose(selectedCompetitorData);
        var xData = (chartType.skipStart) ? referenceCumTimes.slice(1) : referenceCumTimes;
        var zippedData = d3.zip(xData, cumulativeTimesByControl);
        var competitorNames = currentIndexes.map(function (index) { return this.allCompetitors[index].name; }, this);
        return {
            dataColumns: zippedData.map(function (data) { return { x: data[0], ys: data[1] }; }),
            competitorNames: competitorNames,
            numControls: this.numControls,
            xExtent: [xMin, xMax],
            yExtent: [yMin, yMax],
            dubiousTimesInfo: dubiousTimesInfo
        };
    };
    
    SplitsBrowser.Model.AgeClassSet = AgeClassSet;
})();

(function () {
    "use strict";
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    
    /**
    * A collection of 'classes', all runners within which ran the same physical
    * course.
    *
    * Course length and climb are both optional and can both be null.
    * @constructor
    * @param {String} name - The name of the course.
    * @param {Array} classes - Array of AgeClass objects comprising the course.
    * @param {?Number} length - Length of the course, in kilometres.
    * @param {?Number} climb - The course climb, in metres.
    * @param {?Array} controls - Array of codes of the controls that make
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
    
    var START = Course.START;
    var FINISH = Course.FINISH;
    
    /**
    * Returns an array of the 'other' classes on this course.
    * @param {SplitsBrowser.Model.AgeClass} ageClass - An age class that should
    *     be on this course,
    * @return {Array} Array of other age classes.
    */
    Course.prototype.getOtherClasses = function (ageClass) {
        var otherClasses = this.classes.filter(function (cls) { return cls !== ageClass; });
        if (otherClasses.length === this.classes.length) {
            // Given class not found.
            throwInvalidData("Course.getOtherClasses: given class is not in this course");
        } else {
            return otherClasses;
        }
    };
    
    /**
    * Returns the number of age classes that use this course.
    * @return {Number} Number of age classes that use this course.
    */
    Course.prototype.getNumClasses = function () {
        return this.classes.length;
    };
    
    /**
    * Returns whether this course has control code data.
    * @return {boolean} true if this course has control codes, false if it does
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
    * @param {Number} controlNum - The number of the control.
    * @return {?String} The code of the control, or one of the aforementioned
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
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {boolean} Whether this course uses the given leg.
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
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Number} The control number of the leg in this course, or a
    *     negative number if the leg is not part of this course.
    */
    Course.prototype.getLegNumber = function (startCode, endCode) {
        if (this.controls === null) {
            // No controls, so no, it doesn't contain the leg specified.
            return -1;
        }
        
        if (startCode === null && endCode === null) {
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
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or SplitsBrowser.Model.Course.START for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     SplitsBrowser.Model.Course.FINISH for the finish.
    * @return {Array} Array of fastest splits for each age class using this
    *      course.
    */
    Course.prototype.getFastestSplitsForLeg = function (startCode, endCode) {
        if (this.legs === null) {
            throwInvalidData("Cannot determine fastest splits for a leg because leg information is not available");
        }
        
        var legNumber = this.getLegNumber(startCode, endCode);
        if (legNumber < 0) {
            var legStr = ((startCode === START) ? "start" : startCode) + " to " + ((endCode === FINISH) ? "end" : endCode);
            throwInvalidData("Leg from " +  legStr + " not found in course " + this.name);
        }
        
        var controlNum = legNumber;
        var fastestSplits = [];
        this.classes.forEach(function (ageClass) {
            var classFastest = ageClass.getFastestSplitTo(controlNum);
            if (classFastest !== null) {
                fastestSplits.push({name: classFastest.name, className: ageClass.name, split: classFastest.split});
            }
        });
        
        return fastestSplits;
    };
    
    /**
    * Returns a list of all competitors on this course that visit the control
    * with the given code in the time interval given.
    *
    * Specify SplitsBrowser.Model.Course.START for the start and
    * SplitsBrowser.Model.Course.FINISH for the finish.
    *
    * If the given control is not on this course, an empty list is returned.
    *
    * @param {String} controlCode - Control code of the required control.
    * @param {Number} intervalStart - The start of the interval, as seconds
    *     past midnight.
    * @param {Number} intervalEnd - The end of the interval, as seconds past
    *     midnight.
    * @return  {Array} Array of all competitors visiting the given control
    *     within the given time interval.
    */
    Course.prototype.getCompetitorsAtControlInTimeRange = function (controlCode, intervalStart, intervalEnd) {
        if (this.controls === null) {
            // No controls means don't return any competitors.
            return [];
        } else if (controlCode === START) {
            return this.getCompetitorsAtControlNumInTimeRange(0, intervalStart, intervalEnd);
        } else if (controlCode === FINISH) {
            return this.getCompetitorsAtControlNumInTimeRange(this.controls.length + 1, intervalStart, intervalEnd);
        } else {
            var controlIdx = this.controls.indexOf(controlCode);
            if (controlIdx >= 0) {
                return this.getCompetitorsAtControlNumInTimeRange(controlIdx + 1, intervalStart, intervalEnd);
            } else {
                // Control not in this course.
                return [];
            }
        }
    };
    
    /**
    * Returns a list of all competitors on this course that visit the control
    * with the given number in the time interval given.
    *
    * @param {Number} controlNum - The number of the control (0 = start).
    * @param {Number} intervalStart - The start of the interval, as seconds
    *     past midnight.
    * @param {Number} intervalEnd - The end of the interval, as seconds past
    *     midnight.
    * @return  {Array} Array of all competitors visiting the given control
    *     within the given time interval.
    */
    Course.prototype.getCompetitorsAtControlNumInTimeRange = function (controlNum, intervalStart, intervalEnd) {
        var matchingCompetitors = [];
        this.classes.forEach(function (ageClass) {
            ageClass.getCompetitorsAtControlInTimeRange(controlNum, intervalStart, intervalEnd).forEach(function (comp) {
                matchingCompetitors.push({name: comp.name, time: comp.time, className: ageClass.name});
            });
        });
        
        return matchingCompetitors;
    };
    
    /**
    * Returns whether the course has the given control.
    * @param {String} controlCode - The code of the control.
    * @return {boolean} True if the course has the control, false if the
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
    * multiple times, there will be multiple next controls.  As a result
    * @param {String} controlCode - The code of the control.
    * @return {Array} The code of the next control
    */
    Course.prototype.getNextControls = function (controlCode) {
        if (this.controls === null) {
            throwInvalidData("Course has no controls");
        } else if (controlCode === FINISH) {
            throwInvalidData("Cannot fetch next control after the finish");
        } else if (controlCode === START) {
            return [this.controls[0]];
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

(function () {
    "use strict";
    
    var Course = SplitsBrowser.Model.Course;

    /**
    * Contains all of the data for an event.
    * @param {Array} classes - Array of AgeClass objects representing all of
    *     the classes of competitors.
    * @param {Array} courses - Array of Course objects representing all of the
    *     courses of the event.
    */ 
    function Event(classes, courses) {
        this.classes = classes;
        this.courses = courses;
    }
    
    /**
    * Determines time losses for each competitor in each class.
    * 
    * This method should be called after reading in the event data but before
    * attempting to plot it.
    */
    Event.prototype.determineTimeLosses = function () {
        this.classes.forEach(function (ageClass) {
            ageClass.determineTimeLosses();
        });
    };
    
    /**
    * Returns whether the event data needs any repairing.
    *
    * The event data needs repairing if any competitors are missing their
    * 'repaired' cumulative times.
    *
    * @return {boolean} True if the event data needs repairing, false
    *     otherwise.
    */
    Event.prototype.needsRepair = function () {
        return this.classes.some(function (ageClass) {
            return ageClass.competitors.some(function (competitor) {
                return (competitor.getAllCumulativeTimes() === null);
            });
        });
    };
    
    /**
    * Returns the fastest splits for each class on a given leg.
    *
    * The fastest splits are returned as an array of objects, where each object
    * lists the competitors name, the class, and the split time in seconds.
    *
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
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
    * Returns a list of competitors that visit the control with the given code
    * within the given time interval.
    *
    * The fastest splits are returned as an array of objects, where each object
    * lists the competitors name, the class, and the split time in seconds.
    *
    * @param {String} controlCode - Code for the control.
    * @param {Number} intervalStart - Start of the time interval, in seconds
    *     since midnight.
    * @param {?Number} intervalEnd - End of the time interval, in seconds, or
    *     null for the finish.
    * @return {Array} Array of objects containing fastest splits for that leg.
    */
    Event.prototype.getCompetitorsAtControlInTimeRange = function (controlCode, intervalStart, intervalEnd) {
        var competitors = [];
        this.courses.forEach(function (course) {
            course.getCompetitorsAtControlInTimeRange(controlCode, intervalStart, intervalEnd).forEach(function (comp) {
                competitors.push(comp);
            });
        });
        
        competitors.sort(function (a, b) { return d3.ascending(a.time, b.time); });
        
        return competitors;
    };
    
    /**
    * Returns the list of controls that follow after a given control.
    * @param {String} controlCode - The code for the control.
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

(function () {
    
    /**
    * Converts a number of seconds into the corresponding number of minutes.
    * This conversion is as simple as dividing by 60.
    * @param {Number} seconds - The number of seconds to convert.
    * @return {Number} The corresponding number of minutes.
    */
    function secondsToMinutes(seconds) { 
        return (seconds === null) ? null : seconds / 60;
    }
    
    /**
    * Returns indexes around the given competitor's dubious cumulative times.
    * @param {Competitor} competitor - The competitor to get the indexes for.
    * @return {Array} Array of objects containing indexes around dubious
    *     cumulative times.
    */
    function getIndexesAroundDubiousCumulativeTimes(competitor) {
        return competitor.getControlIndexesAroundDubiousCumulativeTimes();
    }
    
    /**
    * Returns indexes around the given competitor's dubious split times.
    * @param {Competitor} competitor - The competitor to get the indexes for.
    * @return {Array} Array of objects containing indexes around dubious split
    *     times.
    */
    function getIndexesAroundDubiousSplitTimes(competitor) {
        return competitor.getControlIndexesAroundDubiousSplitTimes();
    }

    SplitsBrowser.Model.ChartTypes = {
        SplitsGraph: {
            nameKey: "SplitsGraphChartType",
            dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReference(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabelKey: "SplitsGraphYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundDubiousTimesFunc: getIndexesAroundDubiousCumulativeTimes
        },
        RaceGraph: {
            nameKey: "RaceGraphChartType",
            dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabelKey: "RaceGraphYAxisLabel",
            isRaceGraph: true,
            isResultsTable: false,
            minViewableControl: 0,
            indexesAroundDubiousTimesFunc: getIndexesAroundDubiousCumulativeTimes
        },
        PositionAfterLeg: {
            nameKey:  "PositionAfterLegChartType",
            dataSelector: function (comp) { return comp.cumRanks; },
            skipStart: true,
            yAxisLabelKey: "PositionYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundDubiousTimesFunc: getIndexesAroundDubiousCumulativeTimes
        },
        SplitPosition: {
            nameKey: "SplitPositionChartType",
            dataSelector: function (comp) { return comp.splitRanks; },
            skipStart: true,
            yAxisLabelKey: "PositionYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundDubiousTimesFunc: getIndexesAroundDubiousSplitTimes
        },
        PercentBehind: {
            nameKey: "PercentBehindChartType",
            dataSelector: function (comp, referenceCumTimes) { return comp.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes); },
            skipStart: false,
            yAxisLabelKey: "PercentBehindYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundDubiousTimesFunc: getIndexesAroundDubiousSplitTimes
        },
        ResultsTable: {
            nameKey: "ResultsTableChartType",
            dataSelector: null,
            skipStart: false,
            yAxisLabelKey: null,
            isRaceGraph: false,
            isResultsTable: true,
            minViewableControl: 1,
            indexesAroundDubiousTimesFunc: null
        }
    };
})();

(function (){
    "use strict";
    
    var NUMBER_TYPE = typeof 0;
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
    * Represents the currently-selected competitors, and offers a callback
    * mechanism for when the selection changes.
    * @constructor
    * @param {Number} count - The number of competitors that can be chosen.
    */
    function CompetitorSelection(count) {
        if (typeof count !== NUMBER_TYPE) {
            throwInvalidData("Competitor count must be a number");
        } else if (count < 0) {
            throwInvalidData("Competitor count must be a non-negative number");
        }

        this.count = count;
        this.currentIndexes = [];
        this.changeHandlers = [];
    }

    /**
    * Returns whether the competitor at the given index is selected.
    * @param {Number} index - The index of the competitor.
    * @returns {boolean} True if the competitor is selected, false if not.
    */
    CompetitorSelection.prototype.isSelected = function (index) {
        return this.currentIndexes.indexOf(index) > -1;
    };
    
    /**
    * Returns whether the selection consists of exactly one competitor.
    * @returns {boolean} True if precisely one competitor is selected, false if
    *     either no competitors, or two or more competitors, are selected.
    */
    CompetitorSelection.prototype.isSingleRunnerSelected = function () {
        return this.currentIndexes.length === 1;
    };

    /**
    * Given that a single runner is selected, select also all of the runners
    * that 'cross' this runner.
    * @param {Array} competitors - All competitors in the same class.
    */    
    CompetitorSelection.prototype.selectCrossingRunners = function (competitors) {
        if (this.isSingleRunnerSelected()) {
            var refCompetitor = competitors[this.currentIndexes[0]];
            
            competitors.forEach(function (comp, idx) {
                if (comp.crosses(refCompetitor)) {
                    this.currentIndexes.push(idx);
                }
            }, this);
            
            this.currentIndexes.sort(d3.ascending);
            this.fireChangeHandlers();
        }
    };
    
    /**
    * Fires all of the change handlers currently registered.
    */
    CompetitorSelection.prototype.fireChangeHandlers = function () {
        // Call slice(0) to return a copy of the list.
        this.changeHandlers.forEach(function (handler) { handler(this.currentIndexes.slice(0)); }, this);
    };

    /**
    * Select all of the competitors.
    */
    CompetitorSelection.prototype.selectAll = function () {
        this.currentIndexes = d3.range(this.count);
        this.fireChangeHandlers();
    };

    /**
    * Select none of the competitors.
    */
    CompetitorSelection.prototype.selectNone = function () {
        this.currentIndexes = [];
        this.fireChangeHandlers();
    };

    /**
    * Returns an array of all currently-selected competitor indexes.
    * @return {Array} Array of selected indexes.
    */
    CompetitorSelection.prototype.getSelectedIndexes = function () {
        return this.currentIndexes.slice(0);
    };
    
    
    /**
    * Set the selected competitors to those in the given array.
    * @param {Array} selectedIndex - Array of indexes of selected competitors.
    */
    CompetitorSelection.prototype.setSelectedIndexes = function (selectedIndexes) {
        if (selectedIndexes.every(function (index) { return 0 <= index && index < this.count; }, this)) {
            this.currentIndexes = selectedIndexes;
            this.fireChangeHandlers();
        }
    };
    
    /**
    * Register a handler to be called whenever the list of indexes changes.
    *
    * When a change is made, this function will be called, with the array of
    * indexes being the only argument.  The array of indexes passed will be a
    * copy of that stored internally, so the handler is free to store this
    * array and/or modify it.
    *
    * If the handler has already been registered, nothing happens.
    *
    * @param {Function} handler - The handler to register.
    */
    CompetitorSelection.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Unregister a handler from being called when the list of indexes changes.
    *
    * If the handler given was never registered, nothing happens.
    *
    * @param {Function} handler - The handler to register.
    */
    CompetitorSelection.prototype.deregisterChangeHandler = function (handler) {
        var index = this.changeHandlers.indexOf(handler);
        if (index > -1) {
            this.changeHandlers.splice(index, 1);
        }
    };

    /**
    * Toggles whether the competitor at the given index is selected.
    * @param {Number} index - The index of the competitor.
    */
    CompetitorSelection.prototype.toggle = function (index) {
        if (typeof index === NUMBER_TYPE) {
            if (0 <= index && index < this.count) {
                var position = this.currentIndexes.indexOf(index);
                if (position === -1) {
                    this.currentIndexes.push(index);
                    this.currentIndexes.sort(d3.ascending);
                } else {
                    this.currentIndexes.splice(position, 1);
                }

                this.fireChangeHandlers();
            } else {
                throwInvalidData("Index '" + index + "' is out of range");
            }
        } else {
            throwInvalidData("Index is not a number");
        }
    };
    
    /**
    * Migrates the selected competitors from one list to another.
    *
    * After the migration, any competitors in the old list that were selected
    * and are also in the new competitors list remain selected.
    *
    * Note that this method does NOT fire change handlers when it runs.  This
    * is typically used during a change of class, when the application may be
    * making other changes.
    *
    * @param {Array} oldCompetitors - Array of Competitor objects for the old
    *      selection.  The length of this must match the current count of
    *      competitors.
    * @param {Array} newCompetitors - Array of Competitor objects for the new
    *      selection.  This array must not be empty.
    */
    CompetitorSelection.prototype.migrate = function (oldCompetitors, newCompetitors) {
        if (!$.isArray(oldCompetitors)) {
            throwInvalidData("CompetitorSelection.migrate: oldCompetitors not an array");
        } else if (!$.isArray(newCompetitors)) {
            throwInvalidData("CompetitorSelection.migrate: newCompetitors not an array");
        } else if (oldCompetitors.length !== this.count) {
            throwInvalidData("CompetitorSelection.migrate: oldCompetitors list must have the same length as the current count"); 
        } else if (newCompetitors.length === 0) {
            throwInvalidData("CompetitorSelection.migrate: newCompetitors list must not be empty"); 
        }
    
        var selectedCompetitors = this.currentIndexes.map(function (index) { return oldCompetitors[index]; });
        
        this.count = newCompetitors.length;
        this.currentIndexes = [];
        newCompetitors.forEach(function (comp, idx) {
            if (selectedCompetitors.indexOf(comp) >= 0) {
                this.currentIndexes.push(idx);
            }
        }, this);
    };

    SplitsBrowser.Model.CompetitorSelection = CompetitorSelection;
})();


(function () {
    "use strict";
    
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var throwInvalidData = SplitsBrowser.throwInvalidData;

    // Maximum number of minutes added to finish splits to ensure that all
    // competitors have sensible finish splits.
    var MAX_FINISH_SPLIT_MINS_ADDED = 5;
    
    /**
     * Construct a Repairer, for repairing some data.
    */
    var Repairer = function () {
        this.madeAnyChanges = false;
    };

   /**
    * Returns the positions at which the first pair of non-ascending cumulative
    * times are found.  This is returned as an object with 'first' and 'second'
    * properties.
    *
    * If the entire array of cumulative times is strictly ascending, this
    * returns null.
    * 
    * @param {Array} cumTimes - Array of cumulative times.
    * @return {?Object} Object containing indexes of non-ascending entries, or
    *     null if none found.
    */
    function getFirstNonAscendingIndexes(cumTimes) {
        if (cumTimes.length === 0 || cumTimes[0] !== 0) {
            throwInvalidData("cumulative times array does not start with a zero cumulative time");
        }
        
        var lastNumericTimeIndex = 0;
        
        for (var index = 1; index < cumTimes.length; index += 1) {
            var time = cumTimes[index];
            if (isNotNullNorNaN(time)) {
                // This entry is numeric.
                if (time <= cumTimes[lastNumericTimeIndex]) {
                    return {first: lastNumericTimeIndex, second: index};
                }
                
                lastNumericTimeIndex = index;
            }
        }
        
        // If we get here, the entire array is in strictly-ascending order.
        return null;
    }
    
    
    /**
    * Remove, by setting to NaN, any cumulative time that is equal to the
    * previous cumulative time.
    * @param {Array} cumTimes - Array of cumulative times.
    */
    Repairer.prototype.removeCumulativeTimesEqualToPrevious = function (cumTimes) {
        var lastCumTime = cumTimes[0];
        for (var index = 1; index + 1 < cumTimes.length; index += 1) {
            if (cumTimes[index] !== null && cumTimes[index] === lastCumTime) {
                cumTimes[index] = NaN;
                this.madeAnyChanges = true;
            } else {
                lastCumTime = cumTimes[index];
            }
        }
    };
    
    /**
    * Remove from the cumulative times given any individual times that cause
    * negative splits and whose removal leaves all of the remaining splits in
    * strictly-ascending order.
    *
    * This method does not compare the last two cumulative times, so if the 
    * finish time is not after the last control time, no changes will be made.
    *
    * @param {Array} cumTimes - Array of cumulative times.
    * @return {Array} Array of cumulaive times with perhaps some cumulative
    *     times taken out.
    */
    Repairer.prototype.removeCumulativeTimesCausingNegativeSplits = function (cumTimes) {

        var nonAscIndexes = getFirstNonAscendingIndexes(cumTimes);
        while (nonAscIndexes !== null && nonAscIndexes.second + 1 < cumTimes.length) {
            
            // So, we have a pair of cumulative times that are not in strict
            // ascending order, with the second one not being the finish.  If
            // the second time is not the finish cumulative time for a
            // completing competitor, try the following in order until we get a
            // list of cumulative times in ascending order:
            // * Remove the second cumulative time,
            // * Remove the first cumulative time.
            // If one of these allows us to push the next non-ascending indexes
            // beyond the second, remove the offending time and keep going.  By
            // 'remove' we mean 'replace with NaN'.
            //
            // We don't want to remove the finish time for a competitor as that
            // removes their total time as well.  If the competitor didn't
            // complete the course, then we're not so bothered; they've
            // mispunched so they don't have a total time anyway.
            
            var first = nonAscIndexes.first;
            var second = nonAscIndexes.second;
            
            var progress = false;
            
            for (var attempt = 1; attempt <= 3; attempt += 1) {
                // 1 = remove second, 2 = remove first, 3 = remove first and the one before.
                var adjustedCumTimes = cumTimes.slice();
                
                if (attempt === 3 && (first === 1 || !isNotNullNorNaN(cumTimes[first - 1]))) {
                    // Can't remove first and the one before because there
                    // isn't a time before or it's already blank.
                } else {
                    if (attempt === 1) {
                        adjustedCumTimes[second] = NaN;
                    } else if (attempt === 2) {
                        adjustedCumTimes[first] = NaN;
                    } else if (attempt === 3) {
                        adjustedCumTimes[first] = NaN;
                        adjustedCumTimes[first - 1] = NaN;
                    }
                    
                    var nextNonAscIndexes = getFirstNonAscendingIndexes(adjustedCumTimes);
                    if (nextNonAscIndexes === null || nextNonAscIndexes.first > second) {
                        progress = true;
                        cumTimes = adjustedCumTimes;
                        this.madeAnyChanges = true;
                        nonAscIndexes = nextNonAscIndexes;
                        break;
                    }
                }
            }
            
            if (!progress) {
                break;
            }
        }
    
        return cumTimes;
    };
    
    /**
    * Removes the finish cumulative time from a competitor if it is absurd.
    *
    * It is absurd if it is less than the time at the previous control by at
    * least the maximum amount of time that can be added to finish splits.
    * 
    * @param {Array} cumTimes - The cumulative times to perhaps remove the
    *     finish split from.
    */
    Repairer.prototype.removeFinishTimeIfAbsurd = function (cumTimes) {
        var finishTime = cumTimes[cumTimes.length - 1];
        var lastControlTime = cumTimes[cumTimes.length - 2];
        if (isNotNullNorNaN(finishTime) && isNotNullNorNaN(lastControlTime) && finishTime <= lastControlTime - MAX_FINISH_SPLIT_MINS_ADDED * 60) {
            cumTimes[cumTimes.length - 1] = NaN;
            this.madeAnyChanges = true;
        }
    };
    
    /**
    * Attempts to repair the cumulative times for a competitor.  The repaired
    * cumulative times are written back into the competitor.
    *
    * @param {Competitor} competitor - Competitor whose cumulative times we
    *     wish to repair.
    */
    Repairer.prototype.repairCompetitor = function (competitor) {
        var cumTimes = competitor.originalCumTimes.slice(0);
        
        this.removeCumulativeTimesEqualToPrevious(cumTimes);
        
        cumTimes = this.removeCumulativeTimesCausingNegativeSplits(cumTimes);
        
        if (!competitor.completed()) {
            this.removeFinishTimeIfAbsurd(cumTimes);
        }
        
        competitor.setRepairedCumulativeTimes(cumTimes);
    };
    
    /**
    * Attempt to repair all of the data within an age class.
    * @param {AgeClass} ageClass - The age class whose data we wish to repair.
    */
    Repairer.prototype.repairAgeClass = function (ageClass) {
        this.madeAnyChanges = false;
        ageClass.competitors.forEach(function (competitor) {
            this.repairCompetitor(competitor);
        }, this);
        
        if (this.madeAnyChanges) {
            ageClass.recordHasDubiousData();
        }
    };
    
    /**
    * Attempt to carry out repairs to the data in an event.
    * @param {Event} eventData - The event data to repair.
    */
    Repairer.prototype.repairEventData = function (eventData) {
        eventData.classes.forEach(function (ageClass) {
            this.repairAgeClass(ageClass);
        }, this);
    };
    
    /**
    * Attempt to carry out repairs to the data in an event.
    * @param {Event} eventData - The event data to repair.
    */
    function repairEventData(eventData) {
        var repairer = new Repairer();
        repairer.repairEventData(eventData);
    }
    
    /**
    * Transfer the 'original' data for each competitor to the 'final' data.
    *
    * This is used if the input data has been read in a format that requires
    * the data to be checked, but the user has opted not to perform any such
    * reparations and wishes to view the 
    * @param {Event} eventData - The event data to repair.
    */
    function transferCompetitorData(eventData) {
        eventData.classes.forEach(function (ageClass) {
            ageClass.competitors.forEach(function (competitor) {
                competitor.setRepairedCumulativeTimes(competitor.getAllOriginalCumulativeTimes());
            });
        });
    }
    
    SplitsBrowser.DataRepair = {
        repairEventData: repairEventData,
        transferCompetitorData: transferCompetitorData
    };
})();

(function () {
    "use strict";
    
    var isTrue = SplitsBrowser.isTrue;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var Competitor = SplitsBrowser.Model.Competitor;
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    /**
    * Parse a row of competitor data.
    * @param {Number} index - Index of the competitor line.
    * @param {string} line - The line of competitor data read from a CSV file.
    * @param {Number} controlCount - The number of controls (not including the finish).
    * @return {Object} Competitor object representing the competitor data read in.
    */
    function parseCompetitors(index, line, controlCount) {
        // Expect forename, surname, club, start time then (controlCount + 1) split times in the form MM:SS.
        var parts = line.split(",");
        if (parts.length === controlCount + 5) {
            var forename = parts.shift();
            var surname = parts.shift();
            var club = parts.shift();
            var startTimeStr = parts.shift();
            var startTime = parseTime(startTimeStr);
            if (!startTimeStr.match(/^\d+:\d\d:\d\d$/)) {
                // Start time given in hours and minutes instead of hours,
                // minutes and seconds.
                startTime *= 60;
            }
            
            var splitTimes = parts.map(parseTime);
            return Competitor.fromSplitTimes(index + 1, forename + " " + surname, club, startTime, splitTimes);
        } else {
            throwInvalidData("Expected " + (controlCount + 5) + " items in row for competitor in class with " + controlCount + " controls, got " + (parts.length) + " instead.");
        }
    }

    /**
    * Parse CSV data for a class.
    * @param {string} ageClass - The string containing data for that class.
    * @return {SplitsBrowser.Model.AgeClass} Parsed class data.
    */
    function parseAgeClass (ageClass) {
        var lines = ageClass.split(/\r?\n/).filter(isTrue);
        if (lines.length === 0) {
            throwInvalidData("parseAgeClass got an empty list of lines");
        }

        var firstLineParts = lines.shift().split(",");
        if (firstLineParts.length === 2) {
            var className = firstLineParts.shift();
            var controlCountStr = firstLineParts.shift();
            var controlCount = parseInt(controlCountStr, 10);
            if (isNaN(controlCount)) {
                throwInvalidData("Could not read control count: '" + controlCountStr + "'");
            } else if (controlCount < 0) {
                throwInvalidData("Expected a positive control count, got " + controlCount + " instead");
            } else {
                var competitors = lines.map(function (line, index) { return parseCompetitors(index, line, controlCount); });
                competitors.sort(compareCompetitors);
                return new AgeClass(className, controlCount, competitors);
            }
        } else {
            throwWrongFileFormat("Expected first line to have two parts (class name and number of controls), got " + firstLineParts.length + " part(s) instead");
        }
    }

    /**
    * Parse CSV data for an entire event.
    * @param {string} eventData - String containing the entire event data.
    * @return {SplitsBrowser.Model.Event} All event data read in.
    */
    function parseEventData (eventData) {

        eventData = normaliseLineEndings(eventData);
        
        // Remove trailing commas.
        eventData = eventData.replace(/,+\n/g, "\n").replace(/,+$/, "");

        var classSections = eventData.split(/\n\n/).map($.trim).filter(isTrue);
       
        var classes = classSections.map(parseAgeClass);
        
        classes = classes.filter(function (ageClass) { return !ageClass.isEmpty(); });
        
        if (classes.length === 0) {
            throwInvalidData("No competitor data was found");
        }
        
        // Nulls are for the course length, climb and controls, which aren't in
        // the source data files, so we can't do anything about them.
        var courses = classes.map(function (cls) { return new Course(cls.name, [cls], null, null, null); });
        
        for (var i = 0; i < classes.length; i += 1) {
            classes[i].setCourse(courses[i]);
        }
        
        return new Event(classes, courses);
    }
    
    SplitsBrowser.Input.CSV = { parseEventData: parseEventData };
})();


(function () {
    "use strict";
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var parseCourseLength = SplitsBrowser.parseCourseLength;
    var parseCourseClimb = SplitsBrowser.parseCourseClimb;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
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
            start: columnOffset - 2,
            finish: columnOffset - 1,
            control1: columnOffset
        };
    });
    
    [44, 46].forEach(function (columnOffset) {
        COLUMN_INDEXES[columnOffset].time = columnOffset - 35;
        COLUMN_INDEXES[columnOffset].club =  columnOffset - 31;
        COLUMN_INDEXES[columnOffset].ageClass = columnOffset - 28;
    });
    
    COLUMN_INDEXES[44].combinedName = 3;
    
    COLUMN_INDEXES[46].forename = 4;
    COLUMN_INDEXES[46].surname = 3;
    
    COLUMN_INDEXES[60].forename = 6;
    COLUMN_INDEXES[60].surname = 5;
    COLUMN_INDEXES[60].combinedName = 3;
    COLUMN_INDEXES[60].startFallback = 11;
    COLUMN_INDEXES[60].time = 13;
    COLUMN_INDEXES[60].club = 20;
    COLUMN_INDEXES[60].ageClass = 26;
    COLUMN_INDEXES[60].ageClassFallback = COLUMN_INDEXES[60].course;
    COLUMN_INDEXES[60].clubFallback = 18;
    
    // Minimum control offset.
    var MIN_CONTROLS_OFFSET = 37;
    
    /**
    * Remove any leading and trailing double-quotes from the given string.
    * @param {String} value - The value to trim quotes from.
    * @return {String} The string with any leading and trailing quotes removed.
    */
    function dequote(value) {
        if (value[0] === '"' && value[value.length - 1] === '"') {
            value = $.trim(value.substring(1, value.length - 1).replace(/""/g, '"'));
        }
        
        return value;
    }
    
    /**
    * Constructs an SI-format data reader.
    *
    * NOTE: The reader constructed can only be used to read data in once.
    * @constructor
    * @param {String} data - The SI data to read in.
    */
    function Reader(data) {
        this.data = normaliseLineEndings(data);
        
        // Map that associates classes to all of the competitors running on
        // that age class.
        this.ageClasses = d3.map();
        
        // Map that associates course names to length and climb values.
        this.courseDetails = d3.map();
        
        // Set of all pairs of classes and courses.
        // (While it is common that one course may have multiple classes, it
        // seems also that one class can be made up of multiple courses, e.g.
        // M21E at BOC 2013.)
        this.classCoursePairs = [];

        // Whether any competitors have been read in at all.  Blank lines are
        // ignored, as are competitors that have no times at all.
        this.anyCompetitors = false;
        
        // The indexes of the columns that we read data from.
        this.columnIndexes = null;
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
        
        throwWrongFileFormat("Data appears not to be in the SI CSV format");
    };
    
    /**
    * Identifies which variation on the SI CSV format we are parsing.
    *
    * At present, the only variations supported are 44-column, 46-column and
    * 60-column.  In all cases, the numbers count the columns before the
    * controls data.
    *
    * @param {String} delimiter - The character used to delimit the columns of
    *     data.
    */
    Reader.prototype.identifyFormatVariation = function (delimiter) {
        
        var firstLine = this.lines[1].split(delimiter);
        
        // Ignore trailing blanks.
        var endPos = firstLine.length - 1;
        while (endPos > 0 && $.trim(firstLine[endPos]) === "") {
            endPos -= 1;
        }
        
        // Now, find the last column with a control code in.  This should be
        // one of the last two columns.  (Normally, it will be the second last,
        // but if there is no last split recorded, it may be the last.)
        var controlCodeRegexp = /^[A-Za-z0-9]+$/;
        
        var controlCodeColumn = null;
        if (controlCodeRegexp.test(firstLine[endPos - 1])) {
            controlCodeColumn = endPos - 1;
        } else if (controlCodeRegexp.test(firstLine[endPos])) {
            // No split for the last control.
            controlCodeColumn = endPos;
        } else {
            throwWrongFileFormat("Could not find control number in last two columns of first data line");
        }
        
        while (controlCodeColumn >= 2 && controlCodeRegexp.test(firstLine[controlCodeColumn - 2])) { 
            // There's another control code before this one.
            controlCodeColumn -= 2;
        }
        
        if (controlCodeColumn === null) {
            throwWrongFileFormat("Unable to find index of control 1 in SI CSV data");
        } else if (!COLUMN_INDEXES.hasOwnProperty(controlCodeColumn)) {
            throwWrongFileFormat("Unsupported index of control 1: " + controlCodeColumn);
        } else {
            this.columnIndexes = COLUMN_INDEXES[controlCodeColumn];
        }
    };
    
    /**
    * Returns the age-class in the given row.
    * @param {Array} row - Array of row data.
    * @return {String} Class name.
    */
    Reader.prototype.getAgeClassName = function (row) {
        var className = row[this.columnIndexes.ageClass];
        if (className === "" && this.columnIndexes.hasOwnProperty("ageClassFallback")) {
            // 'Nameless' variation: no age class.
            className = row[this.columnIndexes.ageClassFallback];
        }
        return className;
    };

    /**
    * Reads the start-time in the given row.
    * @param {Array} row - Array of row data.
    * @return {?Number} Parsed start time, or null for none.
    */
    Reader.prototype.getStartTime = function (row) {
        var startTimeStr = row[this.columnIndexes.start];
        if (startTimeStr === "" && this.columnIndexes.hasOwnProperty("startFallback")) {
            startTimeStr = row[this.columnIndexes.startFallback];
        }
        
        return parseTime(startTimeStr);
    };
    
    /**
    * Returns the number of controls to expect on the given line.
    * @param {Array} row - Array of row data items.
    * @param {Number} lineNumber - The line number of the line.
    * @return {Number} Number of controls read.
    */
    Reader.prototype.getNumControls = function (row, lineNumber) {
        var className = this.getAgeClassName(row);
        if ($.trim(className) === "") {
            throwInvalidData("Line " + lineNumber + " does not contain a class for the competitor");
        } else if (this.ageClasses.has(className)) {
            return this.ageClasses.get(className).numControls;
        } else {
            return parseInt(row[this.columnIndexes.controlCount], 10);
        }    
    };
    
    /**
    * Reads the cumulative times out of a row of competitor data.
    * @param {Array} row - Array of row data items.
    * @param {Number} lineNumber - Line number of the row within the source data.
    * @param {Number} numControls - The number of controls to read.
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
    * Checks to see whether the given row contains a new age-class, and if so,
    * creates it.
    * @param {Array} row - Array of row data items.
    * @param {Number} numControls - The number of controls to read.
    */
    Reader.prototype.createAgeClassIfNecessary = function (row, numControls) {
        var className = this.getAgeClassName(row);
        if (!this.ageClasses.has(className)) {
            this.ageClasses.set(className, { numControls: numControls, competitors: [] });
        }
    };
    
    /**
    * Checks to see whether the given row contains a new course, and if so,
    * creates it.
    * @param {Array} row - Array of row data items.
    * @param {Number} numControls - The number of controls to read.
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
    * @param {Array} row - Array of row data items.
    */
    Reader.prototype.createClassCoursePairIfNecessary = function (row) {
        var className = this.getAgeClassName(row);
        var courseName = row[this.columnIndexes.course];
        
        if (!this.classCoursePairs.some(function (pair) { return pair[0] === className && pair[1] === courseName; })) {
            this.classCoursePairs.push([className, courseName]);
        }
    };
    
    /**
    * Reads in the competitor-specific data from the given row and adds it to
    * the event data read so far.
    * @param {Array} row - Row of items read from a line of the input data.
    * @param {Array} cumTimes - Array of cumulative times for the competitor.
    */
    Reader.prototype.addCompetitor = function (row, cumTimes) {
    
        var className = this.getAgeClassName(row);
        var placing = row[this.columnIndexes.placing];
        var club = row[this.columnIndexes.club];
        if (club === "" && this.columnIndexes.hasOwnProperty("clubFallback")) {
            // Nameless variation: no club name, just number...
            club = row[this.columnIndexes.clubFallback];
        }
        
        var startTime = this.getStartTime(row);

        var isPlacingNonNumeric = (placing !== "" && isNaN(parseInt(placing, 10)));
        
        var name = "";
        if (this.columnIndexes.hasOwnProperty("forename") && this.columnIndexes.hasOwnProperty("surname")) {
            var forename = row[this.columnIndexes.forename];
            var surname = row[this.columnIndexes.surname];
        
            // Some surnames have their placing appended to them, if their placing
            // isn't a number (e.g. mp, n/c).  If so, remove this.
            if (isPlacingNonNumeric && surname.substring(surname.length - placing.length) === placing) {
                surname = $.trim(surname.substring(0, surname.length - placing.length));
            }
            
            name = $.trim(forename + " " + surname);
        }
        
        if (name === "" && this.columnIndexes.hasOwnProperty("combinedName")) {
            // 'Nameless' or 44-column variation.
            name = row[this.columnIndexes.combinedName];
        }
        
        var order = this.ageClasses.get(className).competitors.length + 1;
        var competitor = fromOriginalCumTimes(order, name, club, startTime, cumTimes);
        if (isPlacingNonNumeric && competitor.completed()) {
            // Competitor has completed the course but has no placing.
            // Assume that they are non-competitive.
            competitor.setNonCompetitive();
        }

        this.ageClasses.get(className).competitors.push(competitor);
    };
    
    /**
    * Parses the given line and adds it to the event data accumulated so far.
    * @param {String} line - The line to parse.
    * @param {Number} lineNumber - The number of the line (used in error
    *     messages).
    * @param {String} delimiter - The character used to delimit the columns of
    *     data.
    */
    Reader.prototype.readLine = function (line, lineNumber, delimiter) {
    
        if ($.trim(line) === "") {
            // Skip this blank line.
            return;
        }
    
        var row = line.split(delimiter).map($.trim).map(dequote);
        
        // Check the row is long enough to have all the data besides the
        // controls data.
        if (row.length < MIN_CONTROLS_OFFSET) {
            throwInvalidData("Too few items on line " + lineNumber + " of the input file: expected at least " + MIN_CONTROLS_OFFSET + ", got " + row.length);
        }
        
        var numControls = this.getNumControls(row, lineNumber);
        
        var cumTimes = this.readCumulativeTimes(row, lineNumber, numControls);
        this.anyCompetitors = true;
        
        this.createAgeClassIfNecessary(row, numControls);
        this.createCourseIfNecessary(row, numControls);
        this.createClassCoursePairIfNecessary(row);
        
        this.addCompetitor(row, cumTimes);
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
    * Creates and return a list of AgeClass objects from all of the data read.
    * @return {Array} Array of AgeClass objects.
    */
    Reader.prototype.createAgeClasses = function () {
        var classNames = this.ageClasses.keys();
        classNames.sort();
        return classNames.map(function (className) {
            var ageClass = this.ageClasses.get(className);
            return new AgeClass(className, ageClass.numControls, ageClass.competitors);
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
    * @param {String} initCourseName - The name of the initial course.
    * @param {Object} manyToManyMaps - Object that contains the two maps that
    *     map between class names and course names.
    * @param {d3.set} doneCourseNames - Set of all course names that have been
    *     'done', i.e. included in a Course object that has been returned from
    *     a call to this method.
    * @param {d3.map} classesMap - Map that maps age-class names to AgeClass
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
        
        var courseClasses = relatedClassNames.map(function (className) { return classesMap.get(className); });
        var details = this.courseDetails.get(initCourseName);
        var course = new Course(initCourseName, courseClasses, details.length, details.climb, details.controls);
        
        courseClasses.forEach(function (ageClass) {
            ageClass.setCourse(course);
        });
        
        return course;
    };
    
    /**
    * Sort through the data read in and create Course objects representing each
    * course in the event.
    * @param {Array} classes - Array of AgeClass objects read.
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
        classes.forEach(function (ageClass) {
            classesMap.set(ageClass.name, ageClass);
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
        
        this.lines = this.data.split(/\n/);
        
        var delimiter = this.identifyDelimiter();
        
        this.identifyFormatVariation(delimiter);
        
        // Discard the header row.
        this.lines.shift();
        
        this.lines.forEach(function (line, lineIndex) {
            this.readLine(line, lineIndex + 1, delimiter);
        }, this);
        
        if (!this.anyCompetitors) {
            throwInvalidData("No competitors' data were found");
        }
        
        var classes = this.createAgeClasses();
        var courses = this.determineCourses(classes);
        return new Event(classes, courses);
    };
    
    SplitsBrowser.Input.SI = {};
    
    /**
    * Parse 'SI' data read from a semicolon-separated data string.
    * @param {String} data - The input data string read.
    * @return {SplitsBrowser.Model.Event} All event data read.
    */
    SplitsBrowser.Input.SI.parseEventData = function (data) {
        var reader = new Reader(data);
        return reader.parseEventData();
    };
})();

(function () {
    "use strict";
    
    var isNotNull = SplitsBrowser.isNotNull;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var parseCourseLength = SplitsBrowser.parseCourseLength;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    // Regexps to help with parsing.
    var HTML_TAG_STRIP_REGEXP = /<[^>]+>/g;
    var DISTANCE_FIND_REGEXP = /([0-9.,]+)\s*(?:Km|km)/;
    var CLIMB_FIND_REGEXP = /(\d+)\s*(?:Cm|Hm|hm|m)/;
    
    /**
    * Returns whether the given string is nonempty.
    * @param {String} string - The string to check.
    * @return True if the string is neither null nor empty, false if it is null
    *     or empty.
    */
    function isNonEmpty(string) {
        return string !== null && string !== "";
    }
    
    /**
    * Returns whether the given string contains a number.  The string is
    * considered to contain a number if, after stripping whitespace, the string
    * is not empty and calling isFinite on it returns true.
    * @param {String} string - The string to test.
    * @return True if the string contains a number, false if not.
    */
    function hasNumber(string) {
        string = $.trim(string);
        // isFinite is not enough on its own: isFinite("") is true.
        return string !== "" && isFinite(string);
    }
    
    /**
    * Splits a line by whitespace.
    * @param {String} line - The line to split.
    * @return {Array} Array of whitespace-separated strings.
    */ 
    function splitByWhitespace (line) {
        return line.split(/\s+/g).filter(isNonEmpty);
    }
    
    /**
    * Strips all HTML tags from a string and returns the remaining string.
    * @param {String} text - The HTML string to strip tags from.
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
    * @param {RegExp} regexp - The regular expression to find all matches of.
    * @param {String} text - The text to search for matches within.
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
    * @param {String} text - The HTML string containing the <font> elements.
    * @return {Array} Array of strings of text inside <font> elements.
    */
    function getFontBits(text) {
        return getHtmlStrippedRegexMatches(/<font[^>]*>(.*?)<\/font>/g, text);
    }
    
    /**
    * Returns the contents of all <td> ... </td> elements within the given
    * text.  The contents of the <td> elements are stripped of all other HTML
    * tags.
    * @param {String} text - The HTML string containing the <td> elements.
    * @return {Array} Array of strings of text inside <td> elements.
    */
    function getTableDataBits(text) {
        return getHtmlStrippedRegexMatches(/<td[^>]*>(.*?)<\/td>/g, text).map($.trim);
    }
    
    /**
    * Returns the contents of all <td> ... </td> elements within the given
    * text.  The contents of the <td> elements are stripped of all other HTML
    * tags.  Empty matches are removed.
    * @param {String} text - The HTML string containing the <td> elements.
    * @return {Array} Array of strings of text inside <td> elements.
    */
    function getNonEmptyTableDataBits(text) {
        return getTableDataBits(text).filter(function (bit) { return bit !== ""; });
    }
    
    /**
    * Returns the contents of all <th> ... </th> elements within the given
    * text.  The contents of the <th> elements are stripped of all other HTML
    * tags.  Empty matches are removed.
    * @param {String} text - The HTML string containing the <td> elements.
    * @return {Array} Array of strings of text inside <td> elements.
    */
    function getNonEmptyTableHeaderBits(text) {
        var matches = getHtmlStrippedRegexMatches(/<th[^>]*>(.*?)<\/th>/g, text);
        return matches.filter(function (bit) { return bit !== ""; });
    }
    
    /**
    * Attempts to read a course distance from the given string.
    * @param {String} text - The text string to read a course distance from.
    * @return {?Number} - The parsed course distance, or null if no
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
    * @param {String} text - The text string to read a course climb from.
    * @return {?Number} - The parsed course climb, or null if no climb
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
    * @param {Array} labels - Array of string labels.
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
    * @param {Array} cumTimes - Array of cumulative times.
    * @param {Array} splitTimes - Array of split times.
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
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {String} className - The class of the competitor.
    * @param {?Number} totalTime - The total time taken by the competitor, or
    *     null for no total time.
    * @param {Array} cumTimes - Array of cumulative split times.
    * @param {boolean} competitive - Whether the competitor's run is competitive.
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
    * @return {boolean} True if the record is a continuation record, false if not.
    */
    CompetitorParseRecord.prototype.isContinuation = function () {
        return (this.name === "" && this.club === "" && this.className === null && this.totalTime === "" && !this.competitive);
    };
    
    /**
    * Appends the cumulative split times in another CompetitorParseRecord to
    * this one.  The one given must be a 'continuation' record.
    * @param {CompetitorParseRecord} other - The record whose cumulative times
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
    * Creates a Competitor object from this CompetitorParseRecord object.
    * @param {Number} order - The number of this competitor within their class
    *     (1=first, 2=second, ...).
    * @return {Competitor} Converted competitor object.
    */
    CompetitorParseRecord.prototype.toCompetitor = function (order) {
        // Prepend a zero cumulative time.
        var cumTimes = [0].concat(this.cumTimes);
        
        // The null is for the start time.
        var competitor = fromOriginalCumTimes(order, this.name, this.club, null, cumTimes);
        if (competitor.completed() && !this.competitive) {
            competitor.setNonCompetitive();
        }
        
        return competitor;
    };

    /*
    * There are two types of HTML format supported by this parser: one that is
    * based on pre-formatted text, and one that uses HTML tables.  The overall
    * strategy when parsing either format is largely the same, but the exact
    * details vary.
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
    * As this recognizer is for recognizing preformatted text, it simply checks
    * for the presence of an HTML &lt;pre&gt; tag.
    *
    * @param {String} text - The entire input text read in.
    * @return {boolean} True if the text contains any pre-formatted HTML, false
    *     otherwise
    */ 
    OldHtmlFormatRecognizer.prototype.isTextOfThisFormat = function (text) {
        return (text.indexOf("<pre>") >= 0);
    };
    
    /**
    * Performs some pre-processing on the text before it is read in.
    *
    * This object strips everything up to and including the opening
    * &lt;pre&gt; tag, and everything from the closing &lt;/pre&gt; tag
    * to the end of the text.
    * 
    * @param {String} text - The HTML text to preprocess.
    * @return {String} The preprocessed text.
    */
    OldHtmlFormatRecognizer.prototype.preprocess = function (text) {
        var prePos = text.indexOf("<pre>");
        if (prePos === -1) {
            throw new Error("Cannot find opening pre tag");
        }
            
        var lineEndPos = text.indexOf("\n", prePos);
        text = text.substring(lineEndPos + 1);
        
        var closePrePos = text.lastIndexOf("</pre>");
        if (closePrePos === -1) {
            throwInvalidData("Found opening <pre> but no closing </pre>");
        }
            
        lineEndPos = text.lastIndexOf("\n", closePrePos);
        text = text.substring(0, lineEndPos);
        return $.trim(text);
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
    * @param {String} line - The line to check.
    * @return {boolean} True if the line should be ignored, false if not.
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
    * @param {String} line - The line to check.
    * @return {boolean} True if this is the first line of a course, false
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
    * @param {String} line - The line to parse course details from.
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
            name: $.trim(courseName),
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
    * @param {String} line - The line to parse control codes from.
    * @return {Array} Array of control codes.
    */
    OldHtmlFormatRecognizer.prototype.parseControlsLine = function (line) {
        var lastFontPos = line.lastIndexOf("</font>");
        var controlsText = (lastFontPos === -1) ? line : line.substring(lastFontPos + "</font>".length);

        var controlLabels = splitByWhitespace($.trim(controlsText));
        return readControlCodes(controlLabels);
    };
    
    /**
    * Read either cumulative or split times from the given line of competitor
    * data.
    * (This method is not used by the parser, only elsewhere in the recognizer.)
    * @param {String} line - The line to read the times from.
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
    * @param {String} firstLine - The first line of competitor data.
    * @param {String} secondLine - The second line of competitor data.
    * @return {CompetitorParseRecord} The parsed competitor.
    */
    OldHtmlFormatRecognizer.prototype.parseCompetitor = function (firstLine, secondLine) {
        var firstLineBits = getFontBits(firstLine);
        var secondLineBits = getFontBits(secondLine);
        
        if (this.precedingColumnCount === null) {
            // If column 1 is blank or a number, we have four preceding
            // columns.  Otherwise we have three.
            var column1 = $.trim(firstLineBits[1]); 
            this.precedingColumnCount = (column1.match(/^\d*$/)) ? 4 : 3;
        }

        var competitive = hasNumber(firstLineBits[0]);
        var name = $.trim(firstLineBits[this.precedingColumnCount - 2]);
        var totalTime = $.trim(firstLineBits[this.precedingColumnCount - 1]);
        var club = $.trim(secondLineBits[this.precedingColumnCount - 2]);
        
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
            var firstLineMinusFonts = firstLineUpToLastPreceding.replace(/<font[^>]*>(.*?)<\/font>/g, "");
            var lineParts = splitByWhitespace(firstLineMinusFonts);
            if (lineParts.length > 0) {
                className = lineParts[0];
            }
        }
        
        return new CompetitorParseRecord(name, club, className, totalTime, cumulativeTimes, competitive);
    };
    
    /**
    * Constructs a recognizer for formatting the 'newer' format of SI HTML
    * event results data.
    *
    * Data in this format is given within a number of HTML tables, three per
    * course.
    * @constructor
    */
    var NewHtmlFormatRecognizer = function () {
        this.currentCourseHasClass = false;
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
    * @param {String} text - The entire input text read in.
    * @return {boolean} True if the text contains at least five HTML table
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
    * @param {String} text - The HTML text to preprocess.
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
        text = text.replace(/>\n</g, "><").replace(/><tr>/g, ">\n<tr>").replace(/<\/tr></g, "</tr>\n<")
                   .replace(/><table/g, ">\n<table").replace(/<\/table></g, "</table>\n<");
        
        // Remove all <col> elements.
        text = text.replace(/<\/col[^>]*>/g, "");
        
        // Remove all rows that contain only a single non-breaking space.
        // In the file I have, the &nbsp; entities are missing their
        // semicolons.  However, this could well be fixed in the future.
        text = text.replace(/<tr[^>]*><td[^>]*>(?:<nobr>)?&nbsp;?(?:<\/nobr>)?<\/td><\/tr>/g, "");
        
        // Finally, remove the trailing </body> and </html> elements.
        text = text.replace("</body></html>", "");
        
        return $.trim(text);
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
    * @param {String} line - The line to check.
    * @return {boolean} True if the line should be ignored, false if not.
    */
    NewHtmlFormatRecognizer.prototype.canIgnoreThisLine = function (line) {
        if (line.indexOf("<th>") > -1) {
            var bits = getNonEmptyTableHeaderBits(line);
            this.currentCourseHasClass = (bits.length === 5);
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
    * @param {String} line - The line to check.
    * @return {boolean} True if this is the first line of a course, false
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
    * @param {String} line - The line to parse course details from.
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
            
        name = $.trim(name);
        
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
    * @param {String} line - The line to parse control codes from.
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
    * @param {String} line - The line to read the times from.
    * @return {Array} Array of times.
    */
    NewHtmlFormatRecognizer.prototype.readCompetitorSplitDataLine = function (line) {
        var bits = getTableDataBits(line);
        
        var startPos = (this.currentCourseHasClass) ? 5 : 4;
        
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
    * @param {String} firstLine - The first line of competitor data.
    * @param {String} secondLine - The second line of competitor data.
    * @return {CompetitorParseRecord} The parsed competitor.
    */
    NewHtmlFormatRecognizer.prototype.parseCompetitor = function (firstLine, secondLine) {
        var firstLineBits = getTableDataBits(firstLine);
        var secondLineBits = getTableDataBits(secondLine);
        
        var competitive = hasNumber(firstLineBits[0]);
        var name = firstLineBits[2];
        var totalTime = firstLineBits[(this.currentCourseHasClass) ? 4 : 3];
        var club = secondLineBits[2];
        
        var className = (this.currentCourseHasClass && name !== "") ? firstLineBits[3] : null;
        
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
    * 'OEvent'.  The file contains exactly two tables, one of which contains
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
    * @param {String} text - The entire input text read in.
    * @return {boolean} True if the text contains precisely two HTML table
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
    * @param {String} text - The HTML text to preprocess.
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
        text = text.replace(/<tr[^>]*><td colspan=[^>]*>&nbsp;<\/td><\/tr>/g, "");
        
        // Finally, remove the trailing </body> and </html> elements.
        text = text.replace("</body>", "").replace("</html>", "");
        
        return $.trim(text);
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
    * @param {String} line - The line to check.
    * @return {boolean} True if the line should be ignored, false if not.
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
    * @param {String} line - The line to check.
    * @return {boolean} True if this is the first line of a course, false
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
    * @param {String} line - The line to parse course details from.
    * @return {Object} Object containing the parsed course details.
    */
    OEventTabularHtmlFormatRecognizer.prototype.parseCourseHeaderLine = function (line) {
        var dataBits = getNonEmptyTableDataBits(line);
        if (dataBits.length === 0) {
            throwInvalidData("No parts found in course header line");
        }
            
        var part = dataBits[0];
        
        var name, distance, climb;
        var match = /^(.*?)\s+\((\d+)m,\s*(\d+)m\)$/.exec(part);
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
                    
        return {name: $.trim(name), distance: distance, climb: climb };
    };

    /**
    * Parse control codes from the given line and return a list of them.
    *
    * This method can assume that the previous line was the course header or a
    * previous control line.  It should also return null for the finish, which
    * should have no code.  The finish is assumed to he the last.
    *
    * @param {String} line - The line to parse control codes from.
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
    * @param {Array} bits - Array of all contents of table elements.
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
    * @param {String} firstLine - The first line of competitor data.
    * @param {String} secondLine - The second line of competitor data.
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
    * @param {String} name - The name of the course.
    * @param {?Number} distance - The distance of the course in kilometres,
    *     if known, else null.
    * @param {?Number} climb - The climb of the course in metres, if known,
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
    * @param {Array} controls - Array of control codes read.
    */ 
    CourseParseRecord.prototype.addControls = function (controls) {
        this.controls = this.controls.concat(controls);
    };
    
    /**
    * Returns whether the course has all of the controls it needs.
    * The course has all its controls if its last control is the finish, which
    * is indicated by a null control code.
    * @return {boolean} True if the course has all of its controls, including
    *     the finish, false otherwise.
    */
    CourseParseRecord.prototype.hasAllControls = function () {
        return this.controls.length > 0 && this.controls[this.controls.length - 1] === null;
    };

    /**
    * Adds a competitor record to the collection held by this course.
    * @param {CompetitorParseRecord} competitor - The competitor to add.
    */
    CourseParseRecord.prototype.addCompetitor = function (competitor) {
        if (!competitor.competitive && competitor.cumTimes.length === this.controls.length - 1) {
            // Odd quirk of the format: mispunchers may have their finish split
            // missing, i.e. not even '-----'.  If it looks like this has
            // happened, fill the gap by adding a missing time for the finish.
            competitor.cumTimes.push(null);
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
    * @param {Object} recognizer - The recognizer to use to parse the HTML.
    */
    function SIHtmlFormatParser(recognizer) {
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
    * @return {?String} The line read, or null if the end of the data has
    *     been reached.
    */
    SIHtmlFormatParser.prototype.tryGetLine = function () {
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
    SIHtmlFormatParser.prototype.addCurrentCompetitorIfNecessary = function () {
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
    SIHtmlFormatParser.prototype.addCurrentCompetitorAndCourseIfNecessary = function () {
        this.addCurrentCompetitorIfNecessary();
        if (this.currentCourse !== null) {
            this.courses.push(this.currentCourse);
        }
    };
    
    /**
    * Reads in data for one competitor from two lines of the input data.
    *
    * The first of the two lines will be given; the second will be read.
    * @param {String} firstLine - The first of the two lines to read the
    *     competitor data from.
    */
    SIHtmlFormatParser.prototype.readCompetitorLines = function (firstLine) {
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
    * be used to subdivide courses.  If not, AgeClasses and Courses must be
    * the same.
    * @return {boolean} True if no two competitors in the same class are on
    *     different classes, false otherwise.
    */ 
    SIHtmlFormatParser.prototype.areAgeClassesUniqueWithinCourses = function () {
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
    SIHtmlFormatParser.prototype.createOverallEventObject = function () {
        // There is a complication here regarding classes.  Sometimes, classes
        // are repeated within multiple courses.  In this case, ignore the age
        // classes given and create an AgeClass for each set.
        var classesUniqueWithinCourses = this.areAgeClassesUniqueWithinCourses();
        
        var newCourses = [];
        var ageClasses = [];
        
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
            
            var courseClasses = [];
            
            classToCompetitorsMap.keys().forEach(function (className) {
                var numControls = course.controls.length - 1;
                var oldCompetitors = classToCompetitorsMap.get(className);
                var newCompetitors = oldCompetitors.map(function (competitor, index) {
                    return competitor.toCompetitor(index + 1);
                });
                
                var ageClass = new AgeClass(className, numControls, newCompetitors);
                courseClasses.push(ageClass);
                ageClasses.push(ageClass);
            }, this);
            
            var newCourse = new Course(course.name, courseClasses, course.distance, course.climb, course.controls.slice(0, course.controls.length - 1));
            newCourses.push(newCourse);
            courseClasses.forEach(function (ageClass) {
                ageClass.setCourse(newCourse);
            });
        }, this);
        
        return new Event(ageClasses, newCourses);
    };
    
    /**
    * Parses the given HTML text containing results data into an Event object.
    * @param {String} text - The HTML text to parse.
    * @return {Event} Event object containing all the parsed data.
    */
    SIHtmlFormatParser.prototype.parse = function (text) {
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
        
        var eventData = this.createOverallEventObject();
        return eventData;
    };
    
    var RECOGNIZER_CLASSES = [OldHtmlFormatRecognizer, NewHtmlFormatRecognizer, OEventTabularHtmlFormatRecognizer];
    
    SplitsBrowser.Input.SIHtml = {};
    
    /**
    * Attempts to parse data as one of the supported SI HTML formats.
    *
    * If the data appears not to be SI HTML data, a WrongFileFormat exception
    * is thrown.  If the data appears to be SI HTML data but is invalid in some
    * way, an InvalidData exception is thrown.
    *
    * @param {String} data - The string containing event data.
    * @return {Event} The parsed event.
    */
    SplitsBrowser.Input.SIHtml.parseEventData = function (data) {
        data = normaliseLineEndings(data);
        for (var recognizerIndex = 0; recognizerIndex < RECOGNIZER_CLASSES.length; recognizerIndex += 1) {
            var RecognizerClass = RECOGNIZER_CLASSES[recognizerIndex];
            var recognizer = new RecognizerClass();
            if (recognizer.isTextOfThisFormat(data)) {
                data = recognizer.preprocess(data);
                var parser = new SIHtmlFormatParser(recognizer);
                var parsedEvent = parser.parse(data);
                return parsedEvent;
            }
        }
        
        // If we get here, the format wasn't recognized.
        throwWrongFileFormat("No HTML recognizers recognised this as HTML they could parse");
    };
})();    


(function () {
    "use strict";
    
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var parseCourseLength = SplitsBrowser.parseCourseLength;
    var parseCourseClimb = SplitsBrowser.parseCourseClimb;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
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
        controlCount: null,
        placing: null,
        finishTime: null,
        allowMultipleCompetitorNames: true
    };
    
    // Supported delimiters.
    var DELIMITERS = [",", ";"];
    
    /**
    * Trim trailing empty-string entries from the given array.
    * The given array is mutated.
    * @param {Array} array - The array of string values.
    */
    function trimTrailingEmptyCells (array) {
        var index = array.length - 1;
        while (index >= 0 && array[index] === "") {
            index -= 1;
        }
        
        array.splice(index + 1, array.length - index - 1);
    }
    
    /**
    * Some lines of some formats can have multiple delimited competitors, which
    * will move the following columns out of their normal place.  Identify any
    * such situations and merge them together.
    * @param {Array} row - The row of data read from the file.
    * @param {Object} format - The format of this CSV file.
    */
    function adjustLinePartsForMultipleCompetitors(row, format) {
        if (format.allowMultipleCompetitorNames) {
            while (row.length > format.name + 1 && row[format.name + 1].match(/^\s\S/)) {
                row[format.name] += "," + row[format.name + 1];
                row.splice(format.name + 1, 1);
            }
        }
    }
    
    /**
    * Determine the delimiter used to delimit data.
    * @param {String} firstDataLine - The first data line of the file.
    * @param {Object} format - The data format.
    * @return {?String} The delimiter separating the data, or null if no
    *    suitable delimiter was found.
    */
    function determineDelimiter(firstDataLine, format) {
        for (var index = 0; index < DELIMITERS.length; index += 1) {
            var delimiter = DELIMITERS[index];
            var lineParts = firstDataLine.split(delimiter);
            trimTrailingEmptyCells(lineParts);
            if (lineParts.length > format.controlsOffset) {
                return delimiter;
            }
        }
        
        return null;
    }
    
    /**
    * Parse alternative CSV data for an entire event.
    * @param {String} eventData - String containing the entire event data.
    * @param {Object} format - The format object that describes the input format.
    * @return {SplitsBrowser.Model.Event} All event data read in.
    */    
    function parseEventDataWithFormat(eventData, format) {
        eventData = normaliseLineEndings(eventData);
        
        var lines = eventData.split(/\n/);
        
        if (lines.length < 2) {
            throwWrongFileFormat("Data appears not to be in an alternative CSV format - too few lines");
        }
        
        var delimiter = determineDelimiter(lines[1], format);
        if (delimiter === null) {
            throwWrongFileFormat("Data appears not to be in an alternative CSV format - first data line has fewer than " + format.controlsOffset + " parts when separated by any recognised delimiter");
        }
        
        var lineParts = lines[1].split(delimiter);
        trimTrailingEmptyCells(lineParts);
        adjustLinePartsForMultipleCompetitors(lineParts, format);
        
        // Check that all control codes except perhaps the finish are alphanumeric.
        var controlCodeRegexp = /^[A-Za-z0-9]+$/;
        
        // Don't check that the control code for the finish is alphanumeric if the
        // finish time is specified elsewhere.
        var terminationOffset = (format.finishTime === null) ? format.step : 0;
        
        for (var index = format.controlsOffset; index + terminationOffset < lineParts.length; index += format.step) {
            if (!controlCodeRegexp.test(lineParts[index])) {
                throwWrongFileFormat("Data appears not to be in an alternative CSV format - data in cell " + index + " of the first row ('" + lineParts[index] + "') is not an number");
            }
        }
        
        var classes = d3.map();
        for (var rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
            var row = lines[rowIndex].split(delimiter);
            trimTrailingEmptyCells(row);
            adjustLinePartsForMultipleCompetitors(row, format);
            
            if (row.length < format.controlsOffset) {
                // Probably a blank line.  Ignore it.
                continue;
            }
            
            while ((row.length - format.controlsOffset) % format.step !== 0) {
                // Competitor might be missing cumulative time to last control.
                row.push("");
            }
            
            var competitorName = row[format.name];
            var club = row[format.club];
            var courseName = row[format.courseName];
            var startTime = parseTime(row[format.startTime]);
            
            var expectedRowLength;
            if (format.controlCount === null) {
                expectedRowLength = row.length;
            } else {
                var controlCount = parseInt(row[format.controlCount], 10);
                if (isNaNStrict(controlCount)) {
                    throwInvalidData("Control count '" + row[format.controlCount] + "' is not a valid number");
                }
                
                expectedRowLength = format.controlsOffset + controlCount * format.step;
                if (row.length < expectedRowLength) {
                    throwInvalidData("Data in row " + rowIndex + " should have at least " + expectedRowLength + " parts (for " + controlCount + " controls) but only has " + row.length);
                }
            }
            
            var courseLength = (format.length === null) ? null : parseCourseLength(row[format.length]);
            var courseClimb = (format.climb === null) ? null : parseCourseClimb(row[format.climb]);
            
            var cumTimes = [0];
            for (var cumTimeIndex = format.controlsOffset + 1; cumTimeIndex < expectedRowLength; cumTimeIndex += format.step) {
                cumTimes.push(parseTime(row[cumTimeIndex]));
            }
            
            if (format.finishTime !== null) {
                var finishTime = parseTime(row[format.finishTime]);
                var totalTime = (startTime === null || finishTime === null) ? null : (finishTime - startTime);
                cumTimes.push(totalTime);
            }
            
            var order = (classes.has(courseName)) ? classes.get(courseName).competitors.length + 1 : 1;
            
            var competitor = fromOriginalCumTimes(order, competitorName, club, startTime, cumTimes);
            if (format.placing !== null && competitor.completed()) {
                var placing = row[format.placing];
                if (!placing.match(/^\d*$/)) {
                    competitor.setNonCompetitive();
                }
            }
            
            if (classes.has(courseName)) {
                var cls = classes.get(courseName);
                // Subtract one from the list of cumulative times for the 
                // cumulative time at the start (always 0), and add one on to
                // the count of controls in the class to cater for the finish.
                if (cumTimes.length - 1 !== (cls.controls.length + 1)) {
                    throwInvalidData("Competitor '" + competitorName + "' has the wrong number of splits for course '" + courseName + "': " +
                             "expected " + (cls.controls.length + 1) + ", actual " + (cumTimes.length - 1));
                }
                
                cls.competitors.push(competitor);
            } else {
                // New course/class.
                
                // Determine the list of controls, ignoring the finish.
                var controls = [];
                for (var controlIndex = format.controlsOffset; controlIndex + terminationOffset < expectedRowLength; controlIndex += format.step) {
                    controls.push(row[controlIndex]);
                }
            
                classes.set(courseName, {length: courseLength, climb: courseClimb, controls: controls, competitors: [competitor]});
            }
        }
        
        var ageClasses = [];
        var courses = [];
        classes.keys().forEach(function (className) {
            var cls = classes.get(className);
            var ageClass = new AgeClass(className, cls.controls.length, cls.competitors);
            
            var course = new Course(className, [ageClass], cls.length, cls.climb, cls.controls);
            ageClass.setCourse(course);
            ageClasses.push(ageClass);
            courses.push(course);
        });
    
        return new Event(ageClasses, courses);
    }
    
    SplitsBrowser.Input.AlternativeCSV = {
        parseTripleColumnEventData: function (eventData) {
            return parseEventDataWithFormat(eventData, TRIPLE_COLUMN_FORMAT);
        }
    };
        
})();

(function () {
    "use strict";
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    // Number of feet in a kilometre.
    var FEET_PER_KILOMETRE = 3280;
    
    /**
    * Returns whether the given value is undefined.
    * @param {any} value - The value to check.
    * @return {boolean} True if the value is undefined, false otherwise.
    */
    function isUndefined(value) {
        return typeof value === "undefined";
    }
    
    /**
    * Parses the given XML string and returns the parsed XML.
    * @param {String} xmlString - The XML string to parse.
    * @return {XMLDocument} The parsed XML document.
    */
    function parseXml(xmlString) {
        var xml;
        try {
            xml = $.parseXML(xmlString);
        } catch (e) {
            throwInvalidData("XML data not well-formed: " + e.message);
        }
        
        if ($("> *", $(xml)).length === 0) {
            // PhantomJS doesn't always fail parsing invalid XML; we may be
            // left with 'xml' just containing the DOCTYPE and no root element.
            throwInvalidData("XML data not well-formed: " + xmlString);
        }
        
        return xml;
    }
    
    /**
    * Parses and returns a competitor name from the given XML element.
    *
    * The XML element should have name 'PersonName' for v2.0.3 or 'Name' for
    * v3.0.  It should contain 'Given' and 'Family' child elements from which
    * the name will be formed.
    *
    * @param {jQuery.selection} nameElement - jQuery selection containing the
    *     PersonName or Name element.
    * @return {String} Name read from the element.
    */
    function readCompetitorName(nameElement) {
        
        var forename = $("> Given", nameElement).text();
        var surname = $("> Family", nameElement).text();

        if (forename === "" && surname === "") {
            throwInvalidData("Cannot read competitor's name");
        } else if (forename === "") {
            return surname;
        } else if (surname === "") {
            return forename;
        } else {
            return forename + " " + surname;
        }
    }
    
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
    * @param {String} data - The event data.
    * @return {boolean} True if the data is likely to be v2.0.3-format data,
    *     false if not.
    */
    Version2Reader.isOfThisVersion = function (data) {
        return data.indexOf("IOFdata.dtd") >= 0;
    };
        
    /**
    * Makes a more thorough check that the parsed XML data is likely to be of
    * the v2.0.3 format.  If not, a WrongFileFormat exception is thrown.
    * @param {jQuery.selection} rootElement - The root element.
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
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @return {String} Class name.
    */
    Version2Reader.readClassName = function (classResultElement) {
        return $("> ClassShortName", classResultElement).text();    
    };
    
    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @return {Object} Course details: id, name, length and climb.
    */
    Version2Reader.readCourseFromClass = function (classResultElement) {
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
                        throwInvalidData("Unrecognised course-length unit: '" + unit + "'");
                    }
                } else {
                    throwInvalidData("Invalid course length: '" + lengthStr + "'");
                }
            }
        }
        
        // Climb does not appear in the per-competitor results.
        return {id: null, name: courseName, length: length, climb: null};
    };
    
    /**
    * Returns the XML element that contains a competitor's name.  This element
    * should contain child elements with names 'Given' and 'Family'.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {jQuery.selection} jQuery selection containing any child
    *     'PersonName' element.
    */
    Version2Reader.getCompetitorNameElement = function (element) {
        return $("> Person > PersonName", element);
    };
    
    /**
    * Returns the name of the competitor's club.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {String} Competitor's club name.
    */
    Version2Reader.readClubName = function (element) {
        return $("> Club > ShortName", element).text();
    };
    
    /**
    * Reads a competitor's start time from the given Result element.
    * @param {jQuery.selection} resultElement - jQuery selection containing a
    *     Result element.
    * @return {?Number} Competitor's start time in seconds since midnight, or
    *     null if not found.
    */
    Version2Reader.readStartTime = function (resultElement) {
        var startTimeStr = $("> StartTime > Clock", resultElement).text();
        var startTime = (startTimeStr === "") ? null : parseTime(startTimeStr);       
        return startTime;
    };
    
    /**
    * Reads a competitor's total time from the given Result element.
    * @param {jQuery.selection} resultElement - jQuery selection containing a
    *     Result element.
    * @return {?Number} - The competitor's total time in seconds, or
    *     null if a valid time was not found.
    */
    Version2Reader.readTotalTime = function (resultElement) {
        var totalTimeStr = $("> Time", resultElement).text();
        var totalTime = (totalTimeStr === "") ? null : parseTime(totalTimeStr);
        return totalTime;
    };

    /**
    * Returns whether a competitor's result declares them as non-competitive.
    * @param {jQuery.selection} resultElement - jQuery selection containing a
    *     Result element.
    * @return {boolean} - True if the competitor is non-competitive, false if
    *     the competitor is competitive.
    */
    Version2Reader.isNonCompetitive = function (resultElement) {
        var statusElement = $("> CompetitorStatus", resultElement);
        return (statusElement.length === 1 && statusElement.attr("value") === "NotCompeting");
    };
    
    /**
    * Reads a control code and split time from a SplitTime element.
    * @param {jQuery.selection} splitTimeElement - jQuery selection containing
    *     a SplitTime element.
    * @return {Object} Object containing code and time.
    */
    Version2Reader.readSplitTime = function (splitTimeElement) {
        // IOF v2 allows ControlCode or Control elements.
        var code = $("> ControlCode", splitTimeElement).text();
        if (code === "") {
            code = $("> Control", splitTimeElement).text();
        }
        
        if (code === "") {
            throwInvalidData("Control code missing for control");
        }

        var timeStr = $("> Time", splitTimeElement).text();
        if (timeStr === "") {
            throwInvalidData("Split time missing for control '" + code + "'");
        }
        
        var time = parseTime(timeStr);
        
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
    * @param {String} data - The event data.
    * @return {boolean} True if the data is likely to be v3.0-format data,
    *     false if not.
    */
    Version3Reader.isOfThisVersion = function (data) {
        return data.indexOf("http://www.orienteering.org/datastandard/3.0") >= 0;
    };
    
    /**
    * Makes a more thorough check that the parsed XML data is likely to be of
    * the v2.0.3 format.  If not, a WrongFileFormat exception is thrown.
    * @param {jQuery.selection} rootElement - The root element.
    */    
    Version3Reader.checkVersion = function (rootElement) {
        var iofVersion = rootElement.attr("iofVersion");
        if (isUndefined(iofVersion)) {
            throwWrongFileFormat("Could not find IOF version number");
        } else if (iofVersion !== "3.0") {
            throwWrongFileFormat("Found unrecognised IOF XML data format '" + iofVersion + "'");
        }
        
        var status = rootElement.attr("status");
        if (!isUndefined(status) && status.toLowerCase() !== "Complete") {
            throwInvalidData("Only complete IOF data supported; snapshot and delta are not supported");
        }
    };
    
    /**
    * Reads the class name from a ClassResult element.
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @return {String} Class name.
    */
    Version3Reader.readClassName = function (classResultElement) {
        return $("> Class > Name", classResultElement).text();
    };
    
    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @return {Object} Course details: id, name, length and climb.
    */
    Version3Reader.readCourseFromClass = function (classResultElement) {
        var courseElement = $("> Course", classResultElement);
        var id = $("> Id", courseElement).text();
        var name = $("> Name", courseElement).text();
        var lengthStr = $("> Length", courseElement).text();
        var length;
        if (lengthStr === "") {
            length = null;
        } else {
            length = parseInt(lengthStr, 10);
            if (isNaNStrict(length)) {
                throwInvalidData("Unrecognised course length: '" + lengthStr + "'");
            } else {
                // Convert from metres to kilometres.
                length /= 1000;
            }
        }
        
        var climbStr = $("> Climb", courseElement).text();
        var climb = parseInt(climbStr, 10);
        if (isNaNStrict(climb)) {
            climb = null;
        }
        
        return {id: id, name: name, length: length, climb: climb};
    };
    
    /**
    * Returns the XML element that contains a competitor's name.  This element
    * should contain child elements with names 'Given' and 'Family'.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {jQuery.selection} jQuery selection containing any child 'Name'
    *     element.
    */
    Version3Reader.getCompetitorNameElement = function (element) {
        return $("> Person > Name", element);
    };
    
    /**
    * Returns the name of the competitor's club.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {String} Competitor's club name.
    */
    Version3Reader.readClubName = function (element) {
        return $("> Organisation > ShortName", element).text();
    };
    
    /**
    * Reads a competitor's start time from the given Result element.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     Result element.
    * @return {?Number} Competitor's start time, in seconds since midnight,
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
    * @param {String} timeStr - The time string to read.
    * @return {?Number} The parsed time, in seconds, or null if it could not
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
    * @param {jQuery.selection} element - jQuery selection containing a
    *     Result element.
    * @return {?Number} Competitor's total time, in seconds, or null if a time
    *     was not found or was invalid.
    */
    Version3Reader.readTotalTime = function (resultElement) {
        var totalTimeStr = $("> Time", resultElement).text();
        return Version3Reader.readTime(totalTimeStr);
    };

    /**
    * Returns whether a competitor's result declares them as non-competitive.
    * @param {jQuery.selection} resultElement - jQuery selection containing a
    *     Result element.
    * @return {boolean} - True if the competitor is non-competitive, false if
    *     the competitor is competitive.
    */
    Version3Reader.isNonCompetitive = function (resultElement) {
        return $("> Status", resultElement).text() === "NotCompeting";
    };
    
    /**
    * Reads a control code and split time from a SplitTime element.
    * @param {jQuery.selection} splitTimeElement - jQuery selection containing
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
            if (timeStr === "") {
                throwInvalidData("Split time missing for control '" + code + "'");
            }
            time = Version3Reader.readTime(timeStr);
        }
        
        return {code: code, time: time};
    };
    
    var ALL_READERS = [Version2Reader, Version3Reader];
    
    /**
    * Check that the XML document passed is in a suitable format for parsing.
    *
    * If any problems arise, this function will throw an exception.  If the
    * data is valid, the function will return normally.
    * @param {XMLDocument} xml - The parsed XML document.
    * @param {Object} reader - XML reader used to assist with format-specific
    *     XML reading.
    */
    function validateData(xml, reader) {
        var rootElement = $("> *", xml);        
        var rootElementNodeName = rootElement.prop("tagName");
        
        if (rootElementNodeName !== "ResultList")  {
            throwWrongFileFormat("Root element of XML document does not have expected name 'ResultList', got '" + rootElementNodeName + "'");
        }
        
        reader.checkVersion(rootElement);
        
        var status = rootElement.attr("status");
        if (!isUndefined(status) && status.toLowerCase() !== reader.completeStatus) {
            throwInvalidData("Only complete IOF data supported; snapshot and delta are not supported");
        }
    }
    
    /**
    * Parses data for a single competitor.
    * @param {XMLElement} element - XML PersonResult element.
    * @param {Number} number - The competitor number (1 for first in the array
    *     of those read so far, 2 for the second, ...)
    * @param {Object} reader - XML reader used to assist with format-specific
    *     XML reading.
    * @return {Object} Object containing the competitor data.
    */
    function parseCompetitor(element, number, reader) {
        var jqElement = $(element);
        
        var nameElement = reader.getCompetitorNameElement(jqElement);
        var name = readCompetitorName(nameElement);
        
        var club = reader.readClubName(jqElement);
        
        var resultElement = $("Result", jqElement);
        if (resultElement.length === 0) {
            throwInvalidData("No result found for competitor '" + name + "'");
        }
        
        var startTime = reader.readStartTime(resultElement);
        
        var totalTime = reader.readTotalTime(resultElement);
        
        var nonCompetitive = reader.isNonCompetitive(resultElement);
        
        var splitTimes = $("> SplitTime", resultElement).toArray();
        var splitData = splitTimes.map(function (splitTime) { return reader.readSplitTime($(splitTime)); });
        
        var controls = splitData.map(function (datum) { return datum.code; });
        var cumTimes = splitData.map(function (datum) { return datum.time; });
        
        cumTimes.splice(0, 0, 0); // Prepend a zero time for the start.
        cumTimes.push(totalTime);
        
        var competitor = fromOriginalCumTimes(number, name, club, startTime, cumTimes);
        if (nonCompetitive) {
            competitor.setNonCompetitive();
        }
        
        return {
            competitor: competitor,
            controls: controls
        };
    }
    
    /**
    * Parses data for a single class.
    * @param {XMLElement} element - XML ClassResult element
    * @param {Object} reader - XML reader used to assist with format-specific
    *     XML reading.
    * @return {Object} Object containing parsed data.
    */
    function parseClassData(element, reader) {
        var jqElement = $(element);
        var cls = {name: null, competitors: [], controls: [], course: null};
        
        cls.course = reader.readCourseFromClass(jqElement, reader);
        
        var className = reader.readClassName(jqElement);
        
        if (className === "") {
            throwInvalidData("Missing class name");
        }
        
        cls.name = className;
        
        var personResults = $("> PersonResult", jqElement);

        if (personResults.length === 0) {
            throwInvalidData("Class '" + className + "' has no competitors");
        }
        
        for (var index = 0; index < personResults.length; index += 1) {
            var competitor = parseCompetitor(personResults[index], index + 1, reader);
            if (cls.competitors.length === 0) {
                cls.controls = competitor.controls;
                cls.length = competitor.length;
            } else {
                // Subtract 2 for the start and finish cumulative times.
                var actualControlCount = competitor.competitor.getAllOriginalCumulativeTimes().length - 2;
                if (actualControlCount !== cls.controls.length) {
                    throwInvalidData("Inconsistent numbers of controls on course '" + className + "': " + cls.controls.length + " and " + actualControlCount);
                }
            }
            
            cls.competitors.push(competitor.competitor);
        }
        
        return cls;
    }
   
    /**
    * Determine which XML reader to use to parse the given event data.
    * @param {String} data - The event data.
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
    * Parses IOF XML data in the 2.0.3 format and returns the data.
    * @param {String} data - String to parse as XML.
    * @return {Event} Parsed event object.
    */
    function parseEventData(data) {
    
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
        
        // d3 map that maps course IDs to the temporary course with that ID.
        var coursesMap = d3.map();
        
        classResultElements.forEach(function (classResultElement) {
            var parsedClass = parseClassData(classResultElement, reader);
            var ageClass = new AgeClass(parsedClass.name, parsedClass.controls.length, parsedClass.competitors);
            classes.push(ageClass);
            
            // Add to each temporary course object a list of all age-classes.
            var tempCourse = parsedClass.course;
            if (tempCourse.id !== null && coursesMap.has(tempCourse.id)) {
                // We've come across this course before, so just add a class to
                // it.
                coursesMap.get(tempCourse.id).classes.push(ageClass);
            } else {
                // New course.  Add some further details from the class.
                tempCourse.classes = [ageClass];
                tempCourse.controls = parsedClass.controls;
                tempCourses.push(tempCourse);
                if (tempCourse.id !== null) {
                    coursesMap.set(tempCourse.id, tempCourse);
                }
            }
        });
        
        // Now build up the array of courses.
        var courses = tempCourses.map(function (tempCourse) {
            var course = new Course(tempCourse.name, tempCourse.classes, tempCourse.length, tempCourse.climb, tempCourse.controls);
            tempCourse.classes.forEach(function (ageClass) { ageClass.setCourse(course); });
            return course;
        });
        
        return new Event(classes, courses);
    }
    
    SplitsBrowser.Input.IOFXml = { parseEventData: parseEventData };
})();

(function () {
    "use strict";
    
    // All the parsers for parsing event data that are known about.
    var PARSERS = [
        SplitsBrowser.Input.CSV.parseEventData,
        SplitsBrowser.Input.SI.parseEventData,
        SplitsBrowser.Input.SIHtml.parseEventData,
        SplitsBrowser.Input.AlternativeCSV.parseTripleColumnEventData,
        SplitsBrowser.Input.IOFXml.parseEventData
    ];
    
    /**
    * Attempts to parse the given event data, which may be of any of the
    * supported formats, or may be invalid.  This function returns the results
    * as an array of SplitsBrowser.Model.AgeClass objects, or null in the event
    * of failure.
    * @param {String} data - The data read.
    * @return {Event} Event data read in, or null for failure.
    */ 
    SplitsBrowser.Input.parseEventData = function (data) {
        for (var i = 0; i < PARSERS.length; i += 1) {
            var parser = PARSERS[i];
            try {
                return parser(data);
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

(function (){
    "use strict";

    // ID of the competitor list div.
    // Must match that used in styles.css.
    var COMPETITOR_LIST_ID = "competitorList";

    /**
    * Object that controls a list of competitors from which the user can select.
    * @constructor
    * @param {HTMLElement} parent - Parent element to add this listbox to.
    */
    function CompetitorListBox(parent) {
        this.parent = parent;
        this.handler = null;
        this.competitorSelection = null;

        this.listDiv = d3.select(parent).append("div")
                                        .attr("id", COMPETITOR_LIST_ID);
    }

    /**
    * Returns the width of the listbox, in pixels.
    * @returns {Number} Width of the listbox.
    */
    CompetitorListBox.prototype.width = function () {
        return $(this.listDiv.node()).width();
    };

    /**
    * Returns whether the competitor with the given index is selected.
    * @param {Number} index - Index of the competitor within the list.
    * @return True if the competitor is selected, false if not.
    */
    CompetitorListBox.prototype.isSelected = function (index) {
        return this.competitorSelection !== null && this.competitorSelection.isSelected(index);
    };
    
    /**
    * Handles a change to the selection of competitors, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    */
    CompetitorListBox.prototype.selectionChanged = function () {
        var outerThis = this;
        this.listDiv.selectAll("div.competitor")
                    .data(d3.range(this.competitorSelection.count))
                    .classed("selected", function (comp, index) { return outerThis.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a competitor.
    * @param {Number} index - The index of the competitor.
    */
    CompetitorListBox.prototype.toggleCompetitor = function (index) {
        this.competitorSelection.toggle(index);
    };

    /**
    * Sets the list of competitors.
    * @param {Array} competitors - Array of competitor data.
    * @param {boolean} multipleClasses - Whether the list of competitors is
    *      made up from those in multiple classes.
    */
    CompetitorListBox.prototype.setCompetitorList = function (competitors, multipleClasses) {
        // Note that we use jQuery's click event handling here instead of d3's,
        // as d3's doesn't seem to work in PhantomJS.
        $("div.competitor").off("click");
        
        var competitorDivs = this.listDiv.selectAll("div.competitor").data(competitors);

        var outerThis = this;
        competitorDivs.enter().append("div")
                              .classed("competitor", true)
                              .classed("selected", function (comp, index) { return outerThis.isSelected(index); });

        competitorDivs.selectAll("span").remove();
        
        if (multipleClasses) {
            competitorDivs.append("span")
                          .classed("competitorClassLabel", true)
                          .text(function (comp) { return comp.className; });
        }
        
        competitorDivs.append("span")
                      .classed("nonfinisher", function (comp) { return !comp.completed(); })
                      .text(function (comp) { return (comp.completed()) ? comp.name : "* " + comp.name; });        

        competitorDivs.exit().remove();
        
        $("div.competitor").each(function (index, div) {
            $(div).on("click", function () { outerThis.toggleCompetitor(index); });
        });
    };

    /**
    * Sets the competitor selection object.
    * @param {SplitsBrowser.Controls.CompetitorSelection} selection - Competitor selection.
    */
    CompetitorListBox.prototype.setSelection = function (selection) {
        if (this.competitorSelection !== null) {
            this.competitorSelection.deregisterChangeHandler(this.handler);
        }

        var outerThis = this;
        this.competitorSelection = selection;
        this.handler = function (indexes) { outerThis.selectionChanged(indexes); };
        this.competitorSelection.registerChangeHandler(this.handler);
        this.selectionChanged(d3.range(selection.count));
    };
    
    SplitsBrowser.Controls.CompetitorListBox = CompetitorListBox;
})();


(function (){
    "use strict";
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var getMessage = SplitsBrowser.getMessage;

    /**
    * A control that wraps a drop-down list used to choose between classes.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    function ClassSelector(parent) {
        this.changeHandlers = [];
        this.otherClassesEnabled = true;
        
        var div = d3.select(parent).append("div")
                                   .style("float", "left");
                                   
        div.text(getMessage("ClassSelectorLabel"));
        
        var outerThis = this;
        this.dropDown = div.append("select").node();
        $(this.dropDown).bind("change", function() {
            outerThis.updateOtherClasses(d3.set());
            outerThis.onSelectionChanged();
        });
        
        this.otherClassesCombiningLabel = div.append("span")
                                             .classed("otherClassCombining", true)
                                             .style("display", "none")
                                             .text(getMessage("AdditionalClassSelectorLabel"));
        
        this.otherClassesSelector = div.append("div")
                                       .classed("otherClassSelector", true)
                                       .style("display", "none");
                                   
        this.otherClassesSpan = this.otherClassesSelector.append("span");
        
        this.otherClassesList = d3.select(parent).append("div")
                                                 .classed("otherClassList", true)
                                                 .style("position", "absolute")
                                                 .style("display", "none");
                                   
        this.otherClassesSelector.on("click", function () { outerThis.showHideClassSelector(); });
         
        this.setClasses([]);
        
        // Indexes of the selected 'other classes'.
        this.selectedOtherClassIndexes = d3.set();
        
        // Ensure that a click outside of the drop-down list or the selector
        // box closes it.
        // Taken from http://stackoverflow.com/questions/1403615 and adjusted.
        $(document).click(function (e) {
            var listDiv = outerThis.otherClassesList.node();
            if (listDiv.style.display !== "none") {
                var container = $("div.otherClassList,div.otherClassSelector");
                if (!container.is(e.target) && container.has(e.target).length === 0) { 
                    listDiv.style.display = "none";
                }
            }
        });
        
        // Close the class selector if Escape is pressed.
        // 27 is the key code for the Escape key.
        $(document).keydown(function (e) {
            if (e.which === 27) {
                outerThis.otherClassesList.style("display", "none");
            }
        });
    }

    /**
    * Sets whether the other-classes selector is enabled, if it is shown at
    * all.
    * @param {boolean} otherClassesEnabled - true to enable the selector, false
    *      to disable it.
    */
    ClassSelector.prototype.setOtherClassesEnabled = function (otherClassesEnabled) {
        this.otherClassesCombiningLabel.classed("disabled", !otherClassesEnabled);
        this.otherClassesSelector.classed("disabled", !otherClassesEnabled);
        this.otherClassesEnabled = otherClassesEnabled;
    };

    /**
    * Sets the list of classes that this selector can choose between.
    * 
    * If there are no classes, a 'dummy' entry is added
    * @param {Array} classes - Array of AgeClass objects containing class data.
    */
    ClassSelector.prototype.setClasses = function(classes) {
        if ($.isArray(classes)) {
            this.classes = classes;
            var options;
            if (classes.length === 0) {
                this.dropDown.disabled = true;
                options = [getMessage("NoClassesLoadedPlaceholder")];
            } else {
                this.dropDown.disabled = false;
                options = classes.map(function(ageClass) { return ageClass.name; });
            }
            
            var optionsList = d3.select(this.dropDown).selectAll("option").data(options);
            optionsList.enter().append("option");
            
            optionsList.attr("value", function(_value, index) { return index.toString(); })
                       .text(function(value) { return value; });
                       
            optionsList.exit().remove();
      
            this.updateOtherClasses(d3.set());
        } else {
            throwInvalidData("ClassSelector.setClasses: classes is not an array");
        }
    };

    /**
    * Add a change handler to be called whenever the selected class or classes
    * is changed.
    *
    * An array containing the indexes of the newly-selected classes is passed to
    * each handler function.  This array is guaranteed to be non-empty.  The
    * first index in the array is the 'primary' class.
    *
    * @param {Function} handler - Handler function to be called whenever the class
    *                   changes.
    */
    ClassSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };
    
    /**
    * Sets the selected classes.
    * @param {Array} selectedIndexes - Array of indexes of classes.
    */
    ClassSelector.prototype.selectClasses = function (selectedIndexes) {
        if (selectedIndexes.length > 0 && selectedIndexes.every(function (index) { return 0 <= index && index < this.dropDown.options.length; }, this)) {
            this.dropDown.selectedIndex = selectedIndexes[0];
            this.updateOtherClasses(d3.set(selectedIndexes.slice(1)));
            this.onSelectionChanged();
        }
    };
    
    /**
    * Returns the indexes of the selected classes.
    * @param {Array} Indexes of selected classes.
    */
    ClassSelector.prototype.getSelectedClasses = function () {
        var indexes = [this.dropDown.selectedIndex];
        this.selectedOtherClassIndexes.forEach(function (index) { indexes.push(parseInt(index, 10)); });
        return indexes;
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    ClassSelector.prototype.onSelectionChanged = function() {
        var indexes = this.getSelectedClasses();
        this.changeHandlers.forEach(function(handler) { handler(indexes); });
    };
    
    /**
    * Updates the text in the other-class box at the top.
    *
    * This text contains either a list of the selected classes, or placeholder
    * text if none are selected.
    */ 
    ClassSelector.prototype.updateOtherClassText = function () {
        var classIdxs = this.selectedOtherClassIndexes.values();
        classIdxs.sort(d3.ascending);
        var text;
        if (classIdxs.length === 0) {
            text = getMessage("NoAdditionalClassesSelectedPlaceholder");
        } else {
            text = classIdxs.map(function (classIdx) { return this.classes[classIdx].name; }, this)
                            .join(", ");
        }
        
        this.otherClassesSpan.text(text);
    };
    
    /**
    * Updates the other-classes selector div following a change of selected
    * 'main' class.
    * @param {d3.set} selectedOtherClassIndexes - Array of selected other-class indexes.
    */
    ClassSelector.prototype.updateOtherClasses = function (selectedOtherClassIndexes) {
        this.otherClassesList.style("display", "none");
        this.selectedOtherClassIndexes = selectedOtherClassIndexes;
        this.updateOtherClassText();
            
        $("div.otherClassItem").off("click");
            
        var outerThis = this;
        var otherClasses;
        if (this.classes.length > 0) {
            var newClass = this.classes[this.dropDown.selectedIndex];
            otherClasses = newClass.course.getOtherClasses(newClass);
        } else {
            otherClasses = [];
        }
        
        var otherClassIndexes = otherClasses.map(function (cls) { return this.classes.indexOf(cls); }, this);
        
        var otherClassesSelection = this.otherClassesList.selectAll("div")
                                                         .data(otherClassIndexes);
        
        otherClassesSelection.enter().append("div")
                                     .classed("otherClassItem", true);
        
        otherClassesSelection.attr("id", function (classIdx) { return "ageClassIdx_" + classIdx; })
                             .classed("selected", function (classIdx) { return selectedOtherClassIndexes.has(classIdx); })
                             .text(function (classIdx) { return outerThis.classes[classIdx].name; });
                             
        otherClassesSelection.exit().remove();
        
        if (otherClassIndexes.length > 0) {
            this.otherClassesSelector.style("display", "inline-block");
            this.otherClassesCombiningLabel.style("display", null);
        } else {
            this.otherClassesSelector.style("display", "none");
            this.otherClassesCombiningLabel.style("display", "none");
        }
        
        var offset = $(this.otherClassesSelector.node()).offset();
        var height = $(this.otherClassesSelector.node()).outerHeight();
        this.otherClassesList.style("left", offset.left + "px")
                            .style("top", offset.top + height + "px");
                            
        $("div.otherClassItem").each(function (index, div) {
            $(div).on("click", function () { outerThis.toggleOtherClass(otherClassIndexes[index]); });
        });
    };
    
    /**
    * Shows or hides the other-class selector, if it is enabled.
    */
    ClassSelector.prototype.showHideClassSelector = function () {
        if (this.otherClassesEnabled) {
            this.otherClassesList.style("display", (this.otherClassesList.style("display") === "none") ? null : "none");
        }
    };
    
    /**
    * Toggles the selection of an other class.
    * @param {Number} classIdx - Index of the class among the list of all classes.
    */
    ClassSelector.prototype.toggleOtherClass = function (classIdx) {
        if (this.selectedOtherClassIndexes.has(classIdx)) {
            this.selectedOtherClassIndexes.remove(classIdx);
        } else {
            this.selectedOtherClassIndexes.add(classIdx);
        }
        
        d3.select("div#ageClassIdx_" + classIdx).classed("selected", this.selectedOtherClassIndexes.has(classIdx));
        this.updateOtherClassText();
        this.onSelectionChanged();
    };
    
    SplitsBrowser.Controls.ClassSelector = ClassSelector;
})();


(function (){
    "use strict";
    
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    
    var ALL_COMPARISON_OPTIONS = [
        {
            nameKey: "CompareWithWinner",
            selector: function (ageClassSet) { return ageClassSet.getWinnerCumTimes(); },
            requiresWinner: true,
            percentage: ""
        },
        {
            nameKey: "CompareWithFastestTime",
            selector: function (ageClassSet) { return ageClassSet.getFastestCumTimes(); },
            requiresWinner: false,
            percentage: ""
        }
    ];
    
    // All 'Fastest time + N %' values (not including zero).
    var FASTEST_PLUS_PERCENTAGES = [5, 25, 50, 100];
    
    FASTEST_PLUS_PERCENTAGES.forEach(function (percent) {
        ALL_COMPARISON_OPTIONS.push({
            nameKey: "CompareWithFastestTimePlusPercentage",
            selector: function (ageClassSet) { return ageClassSet.getFastestCumTimesPlusPercentage(percent); },
            requiresWinner: false, 
            percentage: percent
        });
    });
    
    ALL_COMPARISON_OPTIONS.push({
        nameKey: "CompareWithAnyRunner",
        selector: null,
        requiresWinner: true,
        percentage: ""
    });
    
    // Default selected index of the comparison function.
    var DEFAULT_COMPARISON_INDEX = 1; // 1 = fastest time.
    
    // The id of the comparison selector.
    var COMPARISON_SELECTOR_ID = "comparisonSelector";
    
    // The id of the runner selector
    var RUNNER_SELECTOR_ID = "runnerSelector";

    /**
    * A control that wraps a drop-down list used to choose what to compare
    * times against.
    * @param {HTMLElement} parent - The parent element to add the control to.
    * @param {Function} alerter - Function to call with any messages to show to
    *     the user.
    */
    function ComparisonSelector(parent, alerter) {
        this.changeHandlers = [];
        this.classes = null;
        this.currentRunnerIndex = null;
        this.previousCompetitorList = null;
        this.parent = parent;
        this.alerter = alerter;
        this.hasWinner = false;
        this.previousSelectedIndex = -1;
        
        var div = d3.select(parent).append("div")
                                   .attr("id", "comparisonSelectorContainer");
        
        div.append("span")
           .classed("comparisonSelectorLabel", true)
           .text(getMessage("ComparisonSelectorLabel"));

        var outerThis = this;
        this.dropDown = div.append("select")
                           .attr("id", COMPARISON_SELECTOR_ID)
                           .node();
                            
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        var optionsList = d3.select(this.dropDown).selectAll("option")
                                                  .data(ALL_COMPARISON_OPTIONS);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_opt, index) { return index.toString(); })
                   .text(function (opt) { return getMessageWithFormatting(opt.nameKey, {"$$PERCENT$$": opt.percentage}); });
                   
        optionsList.exit().remove();
        
        this.runnerDiv = d3.select(parent).append("div")
                                          .attr("id", "runnerSelectorContainer")
                                          .style("display", "none")
                                          .style("padding-left", "20px");
        
        this.runnerDiv.append("span")
                      .classed("comparisonSelectorLabel", true)
                      .text(getMessage("CompareWithAnyRunnerLabel"));
        
        this.runnerDropDown = this.runnerDiv.append("select")
                                            .attr("id", RUNNER_SELECTOR_ID)
                                            .node();
                                            
        $(this.runnerDropDown).bind("change", function () { outerThis.onSelectionChanged(); });
        
        this.dropDown.selectedIndex = DEFAULT_COMPARISON_INDEX;
        this.previousSelectedIndex = DEFAULT_COMPARISON_INDEX;
    }

    /**
    * Add a change handler to be called whenever the selected class is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler - Handler function to be called whenever the class
    *                   changes.
    */
    ComparisonSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns whether the 'Any Runner...' option is selected.
    * @return {boolean} True if the 'Any Runner...' option is selected, false
    *     if any other option is selected.
    */
    ComparisonSelector.prototype.isAnyRunnerSelected = function () {
        return this.dropDown.selectedIndex === ALL_COMPARISON_OPTIONS.length - 1;
    };
    
    /**
    * Sets the age-class set to use.
    * @param {AgeClassSet} ageClassSet - The age-class set to set.
    */
    ComparisonSelector.prototype.setAgeClassSet = function (ageClassSet) {
        this.ageClassSet = ageClassSet;
        this.setRunners();
    };

    /**
    * Populates the drop-down list of runners from an age-class set.
    */
    ComparisonSelector.prototype.setRunners = function () {
        var competitors = this.ageClassSet.allCompetitors;
        var completingCompetitorIndexes = d3.range(competitors.length).filter(function (idx) { return competitors[idx].completed(); });
        var completingCompetitors = competitors.filter(function (comp) { return comp.completed(); });
        
        this.hasWinner = (completingCompetitors.length > 0);
        
        var optionsList = d3.select(this.runnerDropDown).selectAll("option")
                                                        .data(completingCompetitors);
        
        optionsList.enter().append("option");
        optionsList.attr("value", function (_comp, complCompIndex) { return completingCompetitorIndexes[complCompIndex].toString(); })
                   .text(function (comp) { return comp.name; });
        optionsList.exit().remove();

        if (this.previousCompetitorList === null) {
            this.currentRunnerIndex = 0;
        } else {
            var oldSelectedRunner = this.previousCompetitorList[this.currentRunnerIndex];
            var newIndex = this.ageClassSet.allCompetitors.indexOf(oldSelectedRunner);
            this.currentRunnerIndex = Math.max(newIndex, 0);
        }
        
        this.runnerDropDown.selectedIndex = this.currentRunnerIndex;
       
        this.previousCompetitorList = this.ageClassSet.allCompetitors;
    };
    
    /**
    * Sets whether the control is enabled.
    * @param {boolean} isEnabled - True if the control is enabled, false if
    *      disabled.
    */
    ComparisonSelector.prototype.setEnabled = function (isEnabled) {
        d3.select(this.parent).selectAll("span.comparisonSelectorLabel")
                              .classed("disabled", !isEnabled);
                              
        this.dropDown.disabled = !isEnabled;
        this.runnerDropDown.disabled = !isEnabled;
    };
    
    /**
    * Returns the function that compares a competitor's splits against some
    * reference data.
    * @return {Function} Comparison function.
    */
    ComparisonSelector.prototype.getComparisonFunction = function () {
        if (this.isAnyRunnerSelected()) {
            var outerThis = this;
            return function (ageClassSet) { return ageClassSet.getCumulativeTimesForCompetitor(outerThis.currentRunnerIndex); };
        } else {
            return ALL_COMPARISON_OPTIONS[this.dropDown.selectedIndex].selector;
        }
    };
    
    /**
    * Returns the comparison type.
    * @return {Object} Object containing the comparison type (type index and runner).
    */
    ComparisonSelector.prototype.getComparisonType = function () {
        var typeIndex = this.dropDown.selectedIndex;
        var runner;
        if (typeIndex === ALL_COMPARISON_OPTIONS.length - 1) {
            runner = this.ageClassSet.allCompetitors[this.runnerDropDown.selectedIndex];
        } else {
            runner = null;
        }
    
        return {index: typeIndex, runner: runner };
    };
    
    /**
    * Sets the comparison type.
    * @param {Number} typeIndex - The index of the comparison type.
    * @param {Competitor|null} runner - The selected 'Any runner', or null if
    *     Any Runner has not been selected.
    */
    ComparisonSelector.prototype.setComparisonType = function (typeIndex, runner) {
        if (0 <= typeIndex && typeIndex < ALL_COMPARISON_OPTIONS.length) {
            if (typeIndex === ALL_COMPARISON_OPTIONS.length - 1) {
                var runnerIndex = this.ageClassSet.allCompetitors.indexOf(runner);
                if (runnerIndex >= 0) {
                    this.dropDown.selectedIndex = typeIndex;
                    this.runnerDropDown.selectedIndex = runnerIndex;
                    this.onSelectionChanged();
                }
            } else {
                this.dropDown.selectedIndex = typeIndex;
                this.onSelectionChanged();
            }
        }
    };
    
    /**
    * Handle a change of the selected option in either drop-down list.
    */
    ComparisonSelector.prototype.onSelectionChanged = function() {
        var runnerDropdownSelectedIndex = Math.max(this.runnerDropDown.selectedIndex, 0);
        var option = ALL_COMPARISON_OPTIONS[this.dropDown.selectedIndex];
        if (!this.hasWinner && option.requiresWinner) {
            // No winner on this course means you can't select this option.
            this.alerter(getMessageWithFormatting("CannotCompareAsNoWinner", {"$$OPTION$$": getMessage(option.nameKey)}));
            this.dropDown.selectedIndex = this.previousSelectedIndex;
        } else {
            this.runnerDiv.style("display", (this.isAnyRunnerSelected()) ? null : "none");
            this.currentRunnerIndex = (this.runnerDropDown.options.length === 0) ? 0 : parseInt(this.runnerDropDown.options[runnerDropdownSelectedIndex].value, 10);
            this.previousSelectedIndex = this.dropDown.selectedIndex;
            this.changeHandlers.forEach(function (handler) { handler(this.getComparisonFunction()); }, this);
        }
    };
    
    SplitsBrowser.Controls.ComparisonSelector = ComparisonSelector;
})();


(function () {
    "use strict";
    
    var getMessage = SplitsBrowser.getMessage;

    // ID of the statistics selector control.
    // Must match that used in styles.css.
    var STATISTIC_SELECTOR_ID = "statisticSelector";

    var LABEL_ID_PREFIX = "statisticCheckbox";

    // Internal names of the statistics.
    var STATISTIC_NAMES = ["TotalTime", "SplitTime", "BehindFastest", "TimeLoss"];

    // Message keys for the labels of the four checkboxes.
    var STATISTIC_NAME_KEYS = ["StatisticsTotalTime", "StatisticsSplitTime", "StatisticsBehindFastest", "StatisticsTimeLoss"];
    
    // Names of statistics that are selected by default when the application
    // starts.
    var DEFAULT_SELECTED_STATISTICS = ["SplitTime", "TimeLoss"];

    /**
    * Control that contains a number of checkboxes for enabling and/or disabling
    * the display of various statistics.
    * @constructor
    * @param {HTMLElement} parent - The parent element.
    */
    function StatisticsSelector (parent) {
        this.span = d3.select(parent).append("span")
                                     .attr("id", STATISTIC_SELECTOR_ID);   

        var childSpans = this.span.selectAll("span")
                                  .data(STATISTIC_NAMES)
                                  .enter()
                                  .append("span");
         
        childSpans.append("input")
                  .attr("id", function(name) { return LABEL_ID_PREFIX + name; }) 
                  .attr("type", "checkbox")
                  .attr("checked", function (name) { return (DEFAULT_SELECTED_STATISTICS.indexOf(name) >= 0) ? "checked" : null; });
                  
        childSpans.append("label")
                  .attr("for", function(name) { return LABEL_ID_PREFIX + name; })
                  .classed("statisticsSelectorLabel", true)
                  .text(function (name, index) { return getMessage(STATISTIC_NAME_KEYS[index]); });
        
        var outerThis = this;
        $("input", this.span.node()).bind("change", function () { return outerThis.onCheckboxChanged(); });
                   
        this.handlers = [];
    }
    
    /**
    * Deselects all checkboxes.
    * 
    * This method is intended only for test purposes.
    */
    StatisticsSelector.prototype.clearAll = function () {
        this.span.selectAll("input").attr("checked", null);
    };

    /**
    * Sets whether the statistics selector controls are enabled.
    * @param {boolean} isEnabled - True if the controls are to be enabled,
    *      false if the controls are to be disabled.
    */
    StatisticsSelector.prototype.setEnabled = function (isEnabled) {
        this.span.selectAll("label.statisticsSelectorLabel")
                 .classed("disabled", !isEnabled);
        this.span.selectAll("input")
                 .attr("disabled", (isEnabled) ? null : "disabled");
    };
    
    /**
    * Register a change handler to be called whenever the choice of currently-
    * visible statistics is changed.
    *
    * If the handler was already registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    StatisticsSelector.prototype.registerChangeHandler = function (handler) {
        if (this.handlers.indexOf(handler) === -1) {
            this.handlers.push(handler);
        }
    };
       
    /**
    * Deregister a change handler from being called whenever the choice of
    *  currently-visible statistics is changed.
    *
    * If the handler given was never registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    StatisticsSelector.prototype.deregisterChangeHandler = function (handler) {
        var index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    };

    /**
    * Return the statistics that are currently enabled.
    * @returns {Object} Object that lists all the statistics and whether they
    *     are enabled.
    */
    StatisticsSelector.prototype.getVisibleStatistics = function () {
        var visibleStats = {};
        this.span.selectAll("input")[0].forEach(function (checkbox, index) {
            visibleStats[STATISTIC_NAMES[index]] = checkbox.checked;
        });
        
        return visibleStats;
    };
    
    /**
    * Sets the visible statistics.
    * @param {Object} visibleStats - The statistics to make visible.
    */
    StatisticsSelector.prototype.setVisibleStatistics = function (visibleStats) {
        this.span.selectAll("input")[0].forEach(function (checkbox, index) {
            checkbox.checked = visibleStats[STATISTIC_NAMES[index]] || false;
        });
        
        this.onCheckboxChanged();
    };

    /**
    * Handles the change in state of a checkbox, by firing all of the handlers.
    */
    StatisticsSelector.prototype.onCheckboxChanged = function () {
        var checkedFlags = this.getVisibleStatistics();
        this.handlers.forEach(function (handler) { handler(checkedFlags); });
    };
    
    SplitsBrowser.Controls.StatisticsSelector = StatisticsSelector;
})();


(function (){
    "use strict";
    
    var getMessage = SplitsBrowser.getMessage;
    
    /**
    * A control that wraps a drop-down list used to choose the types of chart to view.
    * @param {HTMLElement} parent - The parent element to add the control to.
    * @param {Array} chartTypes - Array of types of chart to list.
    */
    function ChartTypeSelector(parent, chartTypes) {
        this.changeHandlers = [];
        this.chartTypes = chartTypes;
        this.raceGraphDisabledNotifier = null;
        this.lastSelectedIndex = 0;
        
        var div = d3.select(parent).append("div")
                                   .attr("id", "chartTypeSelector");
        div.append("span")
           .text(getMessage("ChartTypeSelectorLabel"));
           
        var outerThis = this;
        this.dropDown = div.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        var optionsList = d3.select(this.dropDown).selectAll("option").data(chartTypes);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_value, index) { return index.toString(); })
                   .text(function (value) { return getMessage(value.nameKey); });
                   
        optionsList.exit().remove();
    }
    
    /**
    * Sets the function used to disable the selection of the race graph.
    *
    * If not null, this will be called whenever an attempt to select the race
    * graph is made, and the selection will revert to what it was before.  If
    * it is null, the race graph can be selected.
    *
    * @param {?Function} raceGraphDisabledNotifier - Function to call when the
    *     race graph is selected
    */
    ChartTypeSelector.prototype.setRaceGraphDisabledNotifier = function (raceGraphDisabledNotifier) {
        this.raceGraphDisabledNotifier = raceGraphDisabledNotifier;
    };
    
    /**
    * Add a change handler to be called whenever the selected type of chart is changed.
    *
    * The selected type of chart is passed to the handler function.
    *
    * @param {Function} handler - Handler function to be called whenever the
    *                             chart type changes.
    */
    ChartTypeSelector.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns the currently-selected chart type.
    * @return {Object} The currently-selected chart type.
    */
    ChartTypeSelector.prototype.getChartType = function () {
        return this.chartTypes[Math.max(this.dropDown.selectedIndex, 0)];
    };
    
    /**
    * Sets the chart type.  If the chart type given is not recognised, nothing
    * happens.
    * @param {Object} chartType - The chart type selected.
    */
    ChartTypeSelector.prototype.setChartType = function (chartType) {
        var index = this.chartTypes.indexOf(chartType);
        if (index >= 0) {
            this.dropDown.selectedIndex = index;
            this.onSelectionChanged();
        }
    };
    
    /**
    * Handle a change of the selected option in the drop-down list.
    */
    ChartTypeSelector.prototype.onSelectionChanged = function () {
        if (this.raceGraphDisabledNotifier !== null && this.chartTypes[this.dropDown.selectedIndex].isRaceGraph) {
            this.raceGraphDisabledNotifier();
            this.dropDown.selectedIndex = Math.max(this.lastSelectedIndex, 0);
        }
        
        this.changeHandlers.forEach(function(handler) { handler(this.chartTypes[this.dropDown.selectedIndex]); }, this);
        this.lastSelectedIndex = this.dropDown.selectedIndex;
    };
    
    SplitsBrowser.Controls.ChartTypeSelector = ChartTypeSelector;
})();


(function () {
    "use strict";
    
    // ID of the div used to contain the object.
    // Must match the name defined in styles.css.
    var CONTAINER_DIV_ID = "originalDataSelectorContainer";
    
    var getMessage = SplitsBrowser.getMessage;
    
    /**
    * Constructs a new OriginalDataSelector object.
    * @constructor
    * @param {d3.selection} parent - d3 selection containing the parent to
    *     insert the selector into.
    */
    function OriginalDataSelector(parent) {
        this.parent = parent;

        var checkboxId = "originalDataCheckbox";
        this.containerDiv = parent.append("div")
                                  .attr("id", CONTAINER_DIV_ID);

        this.containerDiv.append("div").classed("topRowSpacer", true);    
        
        var span = this.containerDiv.append("span");
        
        var outerThis = this;
        this.checkbox = span.append("input")
                            .attr("type", "checkbox")
                            .attr("id", checkboxId)
                            .on("click", function() { outerThis.fireChangeHandlers(); })
                            .node();
                                 
        span.append("label")
            .attr("for", checkboxId)
            .classed("originalDataSelectorLabel", true)
            .text(getMessage("ShowOriginalData"));
            
        this.containerDiv.attr("title", getMessage("ShowOriginalDataTooltip"));
        this.handlers = [];        
    }

    /**
    * Register a change handler to be called whenever the choice of original or
    * repaired data is changed.
    *
    * If the handler was already registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    OriginalDataSelector.prototype.registerChangeHandler = function (handler) {
        if (this.handlers.indexOf(handler) === -1) {
            this.handlers.push(handler);
        }
    };
       
    /**
    * Deregister a change handler from being called whenever the choice of
    * original or repaired data is changed.
    *
    * If the handler given was never registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    OriginalDataSelector.prototype.deregisterChangeHandler = function (handler) {
        var index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    };
    
    /**
    * Fires all change handlers registered.
    */
    OriginalDataSelector.prototype.fireChangeHandlers = function () {
        this.handlers.forEach(function (handler) { handler(this.checkbox.checked); }, this);
    };
    
    /**
    * Returns whether original data is selected.
    * @return {boolean} True if original data is selected, false if not.
    */
    OriginalDataSelector.prototype.isOriginalDataSelected = function () {
        return this.checkbox.checked;
    };
    
    /**
    * Selects original data.
    */
    OriginalDataSelector.prototype.selectOriginalData = function () {
        this.checkbox.checked = true;
        this.fireChangeHandlers();
    };
    
    /**
    * Sets whether this original-data selector should be visible.
    * @param {boolean} isVisible - True if the original-data selector should be
    *     visible, false if it should be hidden.
    */
    OriginalDataSelector.prototype.setVisible = function (isVisible) {
        this.containerDiv.style("display", (isVisible) ? null : "none");
    };
    
    /**
    * Sets whether the control is enabled.
    * @param {boolean} isEnabled - True if the control is enabled, false if
    *      disabled.
    */
    OriginalDataSelector.prototype.setEnabled = function (isEnabled) {
        this.parent.selectAll("label.originalDataSelectorLabel")
                   .classed("disabled", !isEnabled);
                              
        this.checkbox.disabled = !isEnabled;
    };
    
    SplitsBrowser.Controls.OriginalDataSelector = OriginalDataSelector;

})();

(function () {
    "use strict";
    
    // The maximum number of fastest splits to show when the popup is open.
    var MAX_FASTEST_SPLITS = 10;

    // Width of the time interval, in seconds, when viewing nearby competitors
    // at a control on the race graph.
    var RACE_GRAPH_COMPETITOR_WINDOW = 240;
    
    var formatTime = SplitsBrowser.formatTime;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    
    var Course = SplitsBrowser.Model.Course;
    
    var ChartPopupData = {};
    
    /**
    * Returns the fastest splits to a control.
    * @param {SplitsBrowser.Model.AgeClassSet} ageClassSet - The age-class set
    *     containing the splits data.
    * @param {Number} controlIndex - The index of the control.
    * @return {Object} Fastest-split data.
    */
    ChartPopupData.getFastestSplitsPopupData = function (ageClassSet, controlIndex) {
        var data = ageClassSet.getFastestSplitsTo(MAX_FASTEST_SPLITS, controlIndex);
        data = data.map(function (comp) {
            return {time: comp.split, name: comp.name, highlight: false};
        });
        
        return {title: getMessage("SelectedClassesPopupHeader"), data: data, placeholder: getMessage("SelectedClassesPopupPlaceholder")};
    };
    
    /**
    * Returns the fastest splits for the currently-shown leg.  The list
    * returned contains the fastest splits for the current leg for each class.
    * @param {SplitsBrowser.Model.AgeClassSet} ageClassSet - The age-class set
    *     containing the splits data.
    * @param {SplitsBrowser.Model.EventData} eventData - Data for the entire
    *     event.
    * @param {Number} controlIndex - The index of the control.
    * @return {Object} Object that contains the title for the popup and the
    *     array of data to show within it.
    */
    ChartPopupData.getFastestSplitsForLegPopupData = function (ageClassSet, eventData, controlIndex) {
        var course = ageClassSet.getCourse();
        var startCode = course.getControlCode(controlIndex - 1);
        var endCode = course.getControlCode(controlIndex);
        
        var startControl = (startCode === Course.START) ? getMessage("StartName") : startCode;
        var endControl = (endCode === Course.FINISH) ? getMessage("FinishName") : endCode;
        
        var title = getMessageWithFormatting("FastestLegTimePopupHeader", {"$$START$$": startControl, "$$END$$": endControl});
        
        var primaryClass = ageClassSet.getPrimaryClassName();
        var data = eventData.getFastestSplitsForLeg(startCode, endCode)
                            .map(function (row) { return { name: row.name, className: row.className, time: row.split, highlight: (row.className === primaryClass)}; });
        
        return {title: title, data: data, placeholder: null};
    };
    
    /**
    * Returns an object containing an array of the competitors visiting a
    * control at a given time.
    * @param {SplitsBrowser.Model.AgeClassSet} ageClassSet - The age-class set
    *     containing the splits data.
    * @param {SplitsBrowser.Model.EventData} eventData - Data for the entire
    *     event.
    * @param {Number} controlIndex - The index of the control.
    * @param {Number} time - The current time, in units of seconds past midnight.
    * @return {Object} Object containing competitor data.
    */
    ChartPopupData.getCompetitorsVisitingCurrentControlPopupData = function (ageClassSet, eventData, controlIndex, time) {
        var controlCode = ageClassSet.getCourse().getControlCode(controlIndex);
        var intervalStart = Math.round(time) - RACE_GRAPH_COMPETITOR_WINDOW / 2;
        var intervalEnd = Math.round(time) + RACE_GRAPH_COMPETITOR_WINDOW / 2;
        var competitors = eventData.getCompetitorsAtControlInTimeRange(controlCode, intervalStart, intervalEnd);
            
        var primaryClass = ageClassSet.getPrimaryClassName();
        var competitorData = competitors.map(function (row) { return {name: row.name, className: row.className, time: row.time, highlight: (row.className === primaryClass)}; });
        
        var controlName;
        if (controlCode === Course.START) {
            controlName = getMessage("StartName");
        } else if (controlCode === Course.FINISH) {
            controlName = getMessage("FinishName");
        } else {
            controlName = getMessageWithFormatting("ControlName", {"$$CODE$$": controlCode});
        }
        
        var title = getMessageWithFormatting(
            "NearbyCompetitorsPopupHeader",
            {"$$START$$": formatTime(intervalStart), "$$END$$": formatTime(intervalEnd), "$$CONTROL$$": controlName});
        
        return {title: title, data: competitorData, placeholder: getMessage("NoNearbyCompetitors")};
    };    
        
    /**
    * Compares two course names.
    * @param {String} name1 - One course name to compare.
    * @param {String} name2 - The other course name to compare.
    * @return {Number} Comparison result: -1 if name1 < name2, 1 if
    *     name1 > name2 and 0 if name1 === name2.
    */
    function compareCourseNames(name1, name2) {
        if (name1 === name2) {
            return 0;
        } else if (name1 === "" || name2 === "" || name1[0] !== name2[0]) {
            return (name1 < name2) ? -1 : 1;
        } else {
            // Both courses begin with the same letter.
            var regexResult = /^[^0-9]+/.exec(name1);
            if (regexResult !== null && regexResult.length > 0) {
                // regexResult should be a 1-element array.
                var result = regexResult[0];
                if (0 < result.length && result.length < name1.length && name2.substring(0, result.length) === result) {
                    var num1 = parseInt(name1.substring(result.length), 10);
                    var num2 = parseInt(name2.substring(result.length), 10);
                    if (!isNaN(num1) && !isNaN(num2)) {
                        return num1 - num2;
                    }
                }
            }
            
            return (name1 < name2) ? -1 : 1;
        }
    }
    
    /**
    * Tidy next-control data, by joining up multiple controls into one string,
    * and substituting the display-name of the finish if necessary.
    * @param {Array} nextControls - Array of next-control information objects.
    * @return {String} Next-control information containing joined-up control names.
    */
    function tidyNextControlsList(nextControls) {
        return nextControls.map(function (nextControlRec) {
            var codes = nextControlRec.nextControls.slice(0);
            if (codes[codes.length - 1] === Course.FINISH) {
                codes[codes.length - 1] = getMessage("FinishName");
            }
            
            return {course: nextControlRec.course, nextControls: codes.join(", ")};
        });
    }
    
    /**
    * Returns next-control data to show on the chart popup.
    * @param {SplitsBrowser.Model.Course} course - The course containing the
    *     controls data.
    * @param {SplitsBrowser.Model.EventData} eventData - Data for the entire
    *     event.
    * @param {Number} controlIndex - The index of the control.
    * @return {Object} Next-control data.
    */
    ChartPopupData.getNextControlData = function (course, eventData, controlIndex) {
        var controlIdx = Math.min(controlIndex, course.controls.length);
        var controlCode = course.getControlCode(controlIdx);
        var nextControls = eventData.getNextControlsAfter(controlCode);
        nextControls.sort(function (c1, c2) { return compareCourseNames(c1.course.name, c2.course.name); });
        var thisControlName = (controlCode === Course.START) ? getMessage("StartName") : getMessageWithFormatting("ControlName", {"$$CODE$$": controlCode});
        return {thisControl: thisControlName, nextControls: tidyNextControlsList(nextControls) };
    };
    
    SplitsBrowser.Model.ChartPopupData = ChartPopupData;
})();

(function () {
    "use strict";
    
    var formatTime = SplitsBrowser.formatTime;
    
    /**
    * Creates a ChartPopup control.
    * @constructor
    * @param {HTMLElement} parent - Parent HTML element.
    * @param {Object} handlers - Object that maps mouse event names to handlers.
    */
    function ChartPopup(parent, handlers) {

        this.shown = false;
        this.mouseIn = false;
        this.popupDiv = d3.select(parent).append("div");
        this.popupDiv.classed("chartPopup", true)
                     .style("display", "none")
                     .style("position", "absolute");
                     
        this.dataHeader = this.popupDiv.append("div")
                                       .classed("chartPopupHeader", true)
                                       .append("span");
                                           
        var tableContainer = this.popupDiv.append("div")
                                              .classed("chartPopupTableContainer", true);
                                                  
                                           
        this.dataTable = tableContainer.append("table");
                                              
        this.popupDiv.selectAll(".nextControls").style("display", "none");

        // At this point we need to pass through mouse events to the parent.
        // This is solely for the benefit of IE < 11, as IE11 and other
        // browsers support pointer-events: none, which means that this div
        // receives no mouse events at all.
        for (var eventName in handlers) {
            if (handlers.hasOwnProperty(eventName)) {
                $(this.popupDiv.node()).on(eventName, handlers[eventName]);
            }
        }
        
        var outerThis = this;
        $(this.popupDiv.node()).mouseenter(function () { outerThis.mouseIn = true; });
        $(this.popupDiv.node()).mouseleave(function () { outerThis.mouseIn = false; });
    }

    /**
    * Returns whether the popup is currently shown.
    * @return {boolean} True if the popup is shown, false otherwise.
    */
    ChartPopup.prototype.isShown = function () {
        return this.shown;
    };
    
    /**
    * Returns whether the mouse is currently over the popup.
    * @return {boolean} True if the mouse is over the popup, false otherwise.
    */
    ChartPopup.prototype.isMouseIn = function () {
        return this.mouseIn;
    };
    
    /**
    * Populates the chart popup with data.
    *
    * 'competitorData' should be an object that contains a 'title', a 'data'
    * and a 'placeholder' property.  The 'title' is a string used as the
    * popup's title.  The 'data' property is an array where each element should
    * be an object that contains the following properties:
    * * time - A time associated with a competitor.  This may be a split time,
    *   cumulative time or the time of day.
    * * className (Optional) - Name of the competitor's class.
    * * name - The name of the competitor.
    * * highlight - A boolean value which indicates whether to highlight the
    *   competitor.
    * The 'placeholder' property is a placeholder string to show if there is no
    * 'data' array is empty.  It can be null to show no such message.
    * @param {Object} competitorData - Array of data to show.
    * @param {boolean} includeClassNames - Whether to include class names.
    */
    ChartPopup.prototype.setData = function (competitorData, includeClassNames) {
        this.dataHeader.text(competitorData.title);
        
        var rows = this.dataTable.selectAll("tr")
                                 .data(competitorData.data);
                                     
        rows.enter().append("tr");
        
        rows.classed("highlighted", function (row) { return row.highlight; });
        
        rows.selectAll("td").remove();
        rows.append("td").text(function (row) { return formatTime(row.time); });
        if (includeClassNames) {
            rows.append("td").text(function (row) { return row.className; });
        }
        rows.append("td").text(function (row) { return row.name; });
        
        rows.exit().remove();
        
        if (competitorData.data.length === 0 && competitorData.placeholder !== null) {
            this.dataTable.append("tr")
                          .append("td")
                          .text(competitorData.placeholder);
        }
    };
    
    /**
    * Sets the next-controls data.
    *
    * The next-controls data should be an object that contains two properties:
    * * thisControl - The 'current' control.
    * * nextControls - Array of objects, each with 'course' and 'nextControl'
    *   properties.
    *
    * @param {Object} nextControlsData - The next-controls data.
    */
    ChartPopup.prototype.setNextControlData = function (nextControlsData) {
        this.dataHeader.text(nextControlsData.thisControl);
        
        var rows = this.dataTable.selectAll("tr")
                                 .data(nextControlsData.nextControls);
        rows.enter().append("tr");
        
        rows.selectAll("td").remove();
        rows.classed("highlighted", false);
        rows.append("td").text(function (nextControlData) { return nextControlData.course.name; });
        rows.append("td").text("-->");
        rows.append("td").text(function (nextControlData) { return nextControlData.nextControls; });
        
        rows.exit().remove();
    };
    
    /**
    * Adjusts the location of the chart popup.
    *
    * The location object should contain "x" and "y" properties.  The two
    * coordinates are in units of pixels from top-left corner of the viewport.
    *
    * @param {Object} location - The location of the chart popup.
    */
    ChartPopup.prototype.setLocation = function (location) {
        this.popupDiv.style("left", location.x + "px")
                     .style("top", location.y + "px");
    };
    
    /**
    * Shows the chart popup.
    *
    * The location object should contain "x" and "y" properties.  The two
    * coordinates are in units of pixels from top-left corner of the viewport.
    *
    * @param {Object} location - The location of the chart popup.
    */
    ChartPopup.prototype.show = function (location) {
        this.popupDiv.style("display", null);
        this.shown = true;
        this.setLocation(location);
    };
    
    /**
    * Hides the chart popup.
    */
    ChartPopup.prototype.hide = function () {
        this.popupDiv.style("display", "none");
        this.shown = false;
    };
    
    /**
    * Returns the height of the popup, in units of pixels.
    * @return {Number} Height of the popup, in pixels.
    */
    ChartPopup.prototype.height = function () {
        return $(this.popupDiv.node()).height();
    };
    
    SplitsBrowser.Controls.ChartPopup = ChartPopup;    
})();

(function (){
    "use strict";

    // ID of the hidden text-size element.
    // Must match that used in styles.css.
    var TEXT_SIZE_ELEMENT_ID = "sb-text-size-element";
    
    // ID of the chart.
    // Must match that used in styles.css
    var CHART_SVG_ID = "chart";
    
    // X-offset in pixels between the mouse and the popup that opens.
    var CHART_POPUP_X_OFFSET = 10;
    
    // Margins on the four sides of the chart.
    var MARGIN = {
        top: 18, // Needs to be high enough not to obscure the upper X-axis.
        right: 0,
        bottom: 18, // Needs to be high enough not to obscure the lower X-axis.
        left: 53 // Needs to be wide enough for times on the race graph.
    };

    var LEGEND_LINE_WIDTH = 10;
    
    // Minimum distance between a Y-axis tick label and a competitor's start
    // time, in pixels.
    var MIN_COMPETITOR_TICK_MARK_DISTANCE = 10;
    
    // The number that identifies the left mouse button in a jQuery event.
    var JQUERY_EVENT_LEFT_BUTTON = 1;
    
    // The number that identifies the right mouse button in a jQuery event.
    var JQUERY_EVENT_RIGHT_BUTTON = 3;

    var SPACER = "\xa0\xa0\xa0\xa0";

    var colours = [
        "#FF0000", "#4444FF", "#00FF00", "#000000", "#CC0066", "#000099",
        "#FFCC00", "#884400", "#9900FF", "#CCCC00", "#888800", "#CC6699",
        "#00DD00", "#3399FF", "#BB00BB", "#00DDDD", "#FF00FF", "#0088BB",
        "#888888", "#FF99FF", "#55BB33"
    ];

    // 'Imports'.
    var formatTime = SplitsBrowser.formatTime;
    var getMessage = SplitsBrowser.getMessage;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    
    var ChartPopupData = SplitsBrowser.Model.ChartPopupData;
    var ChartPopup = SplitsBrowser.Controls.ChartPopup;
    
    /**
    * Format a time and a rank as a string, with the split time in mm:ss or h:mm:ss
    * as appropriate.
    * @param {?Number} time - The time, in seconds, or null.
    * @param {?Number} rank - The rank, or null.
    * @returns Time and rank formatted as a string.
    */
    function formatTimeAndRank(time, rank) {
        var rankStr;
        if (rank === null) {
            rankStr = "-";
        } else if (isNaNStrict(rank)) {
            rankStr = "?";
        } else {
            rankStr = rank.toString();
        }
        
        return SPACER + formatTime(time) + " (" + rankStr + ")";
    }
    
    /**
    * Formats and returns a competitor's name and optional suffix.
    * @param {String} name - The name of the competitor.
    * @param {String} suffix - The optional suffix of the competitor (may be an
    *      empty string to indicate no suffix).
    * @return Competitor name and suffix, formatted.
    */
    function formatNameAndSuffix(name, suffix) {
        return (suffix === "") ? name : name + " (" + suffix + ")";
    }

    /**
    * A chart object in a window.
    * @constructor
    * @param {HTMLElement} parent - The parent object to create the element within.
    */
    function Chart(parent) {
        this.parent = parent;

        this.xScale = null;
        this.yScale = null;
        this.overallWidth = -1;
        this.overallHeight = -1;
        this.contentWidth = -1;
        this.contentHeight = -1;
        this.numControls = -1;
        this.selectedIndexes = [];
        this.currentCompetitorData = null;
        this.isPopupOpen = false;
        this.popupUpdateFunc = null;
        this.maxStartTimeLabelWidth = 0;
        
        this.mouseOutTimeout = null;
        
        // Indexes of the currently-selected competitors, in the order that
        // they appear in the list of labels.
        this.selectedIndexesOrderedByLastYValue = [];
        this.referenceCumTimes = [];
        this.referenceCumTimesSorted = [];
        this.referenceCumTimeIndexes = [];
        this.fastestCumTimes = [];
        
        this.isMouseIn = false;
        
        // The position the mouse cursor is currently over, or null for not over
        // the charts.  This index is constrained by the minimum control that a
        // chart type specifies.
        this.currentControlIndex = null;
        
        // The position the mouse cursor is currently over, or null for not over
        // the charts.  Unlike this.currentControlIndex, this index is not
        // constrained by the minimum control that a chart type specifies.
        this.actualControlIndex = null;
        
        this.controlLine = null;

        this.svg = d3.select(this.parent).append("svg")
                                         .attr("id", CHART_SVG_ID);

        this.svgGroup = this.svg.append("g");
        this.setLeftMargin(MARGIN.left);

        var outerThis = this;
        var mousemoveHandler = function (event) { outerThis.onMouseMove(event); };
        var mouseupHandler = function (event) { outerThis.onMouseUp(event); };
        var mousedownHandler = function (event) { outerThis.onMouseDown(event); };
        $(this.svg.node()).mouseenter(function (event) { outerThis.onMouseEnter(event); })
                          .mousemove(mousemoveHandler)
                          .mouseleave(function (event) { outerThis.onMouseLeave(event); })
                          .mousedown(mousedownHandler)
                          .mouseup(mouseupHandler);
                          
        // Disable the context menu on the chart, so that it doesn't open when
        // showing the right-click popup.
        $(this.svg.node()).contextmenu(function(e) { e.preventDefault(); });

        // Add an invisible text element used for determining text size.
        this.textSizeElement = this.svg.append("text").attr("fill", "transparent")
                                                      .attr("id", TEXT_SIZE_ELEMENT_ID);
        
        var handlers = {"mousemove": mousemoveHandler, "mousedown": mousedownHandler, "mouseup": mouseupHandler};
        this.popup = new ChartPopup(parent, handlers);
        
        $(document).mouseup(function () { outerThis.popup.hide(); });
    }
    
    /**
    * Hides the chart.
    */
    Chart.prototype.hide = function () {
        // Note that we don't use display: none to hide the chart.
        // While the chart is hidden, the sizes of various text strings are
        // determined.  Firefox gives you an NS_ERROR_FAILURE message if the
        // element you're trying to compute the size of, or an ancestor of it,
        // has display: none.        
        this.svg.style("position", "absolute")
                .style("left", "-9999px");
    };
    
    /**
    * Shows the chart, after it has been hidden.
    */
    Chart.prototype.show = function () {
        this.svg.style("position", null)
                .style("left", null);
    };
    
    /**
    * Sets the left margin of the chart.
    * @param {Number} leftMargin - The left margin of the chart.
    */
    Chart.prototype.setLeftMargin = function (leftMargin) {
        this.currentLeftMargin = leftMargin;
        this.svgGroup.attr("transform", "translate(" + this.currentLeftMargin + "," + MARGIN.top + ")");
    };

    /**
    * Gets the location the chart popup should be at following a mouse-button
    * press or a mouse movement.
    * @param {jQuery.event} event - jQuery mouse-down or mouse-move event.
    * @return {Object} Location of the popup.
    */
    Chart.prototype.getPopupLocation = function (event) {
        return {
            x: event.pageX + CHART_POPUP_X_OFFSET,
            y: Math.max(event.pageY - this.popup.height() / 2, 0)
        };
    };
    
    /**
    * Returns the fastest splits to the current control.
    * @return {Array} Array of fastest-split data.
    */
    Chart.prototype.getFastestSplitsPopupData = function () {
        return ChartPopupData.getFastestSplitsPopupData(this.ageClassSet, this.currentControlIndex);
    };
    
    /**
    * Returns the fastest splits for the currently-shown leg.  The list
    * returned contains the fastest splits for the current leg for each class.
    * @return {Object} Object that contains the title for the popup and the
    *     array of data to show within it.
    */
    Chart.prototype.getFastestSplitsForCurrentLegPopupData = function () {
        return ChartPopupData.getFastestSplitsForLegPopupData(this.ageClassSet, this.eventData, this.currentControlIndex);
    };
    
    /**
    * Stores the current time the mouse is at, on the race graph.
    * @param {jQuery.event} event - The mouse-down or mouse-move event.
    */
    Chart.prototype.setCurrentChartTime = function (event) {
        var yOffset = event.pageY - $(this.svg.node()).offset().top - MARGIN.top;
        this.currentChartTime = Math.round(this.yScale.invert(yOffset) * 60) + this.referenceCumTimes[this.currentControlIndex];
    };
    
    /**
    * Returns an array of the competitors visiting the current control at the
    * current time.
    * @return {Array} Array of competitor data.
    */
    Chart.prototype.getCompetitorsVisitingCurrentControlPopupData = function () {
        return ChartPopupData.getCompetitorsVisitingCurrentControlPopupData(this.ageClassSet, this.eventData, this.currentControlIndex, this.currentChartTime);
    };
    
    /**
    * Returns next-control data to show on the chart popup.
    * @return {Array} Array of next-control data.
    */
    Chart.prototype.getNextControlData = function () {
        return ChartPopupData.getNextControlData(this.ageClassSet.getCourse(), this.eventData, this.actualControlIndex);
    };

    /**
    * Handle the mouse entering the chart.
    * @param {jQuery.event} event - jQuery event object.
    */
    Chart.prototype.onMouseEnter = function (event) {
        if (this.mouseOutTimeout !== null) {
            clearTimeout(this.mouseOutTimeout);
            this.mouseOutTimeout = null;
        }
        
        this.isMouseIn = true;
        this.updateControlLineLocation(event);            
    };

    /**
    * Handle a mouse movement.
    * @param {jQuery.event} event - jQuery event object.
    */
    Chart.prototype.onMouseMove = function (event) {
        if (this.isMouseIn && this.xScale !== null) {
            this.updateControlLineLocation(event);
        }
    };
     
    /**
    * Handle the mouse leaving the chart.
    */
    Chart.prototype.onMouseLeave = function () {
        var outerThis = this;
        // Check that the mouse hasn't entered the popup.
        // It seems that the mouseleave event for the chart is sent before the
        // mouseenter event for the popup, so we use a timeout to check a short
        // time later whether the mouse has left the chart and the popup.
        // This is only necessary for IE9 and IE10; other browsers support
        // "pointer-events: none" in CSS so the popup never gets any mouse
        // events.
        
        // Note that we keep a reference to the 'timeout', so that we can
        // clear it if the mouse subsequently re-enters.  This happens a lot
        // more often than might be expected for a function with a timeout of
        // only a single millisecond.
        this.mouseOutTimeout = setTimeout(function() {
            if (!outerThis.popup.isMouseIn()) {
                outerThis.isMouseIn = false;
                outerThis.removeControlLine();
            }
        }, 1);
    };
    
    /**
    * Handles a mouse button being pressed over the chart.
    * @param {jQuery.Event} event - jQuery event object.
    */
    Chart.prototype.onMouseDown = function (event) {
        var outerThis = this;
        // Use a timeout to open the dialog as we require other events
        // (mouseover in particular) to be processed first, and the precise
        // order of these events is not consistent between browsers.
        setTimeout(function () { outerThis.showPopupDialog(event); }, 1);
    };
    
    /**
    * Handles a mouse button being pressed over the chart.
    * @param {jQuery.event} event - The jQuery onMouseUp event.
    */
    Chart.prototype.onMouseUp = function (event) {
        this.popup.hide();
        event.preventDefault();
    };
    
    /**
    * Shows the popup window, populating it with data as necessary
    * @param {jQuery.event} event - The jQuery onMouseDown event that triggered
    *     the popup.
    */ 
    Chart.prototype.showPopupDialog = function (event) {
        if (this.isMouseIn && this.currentControlIndex !== null) {
            var showPopup = false;
            var outerThis = this;
            if (this.isRaceGraph && (event.which === JQUERY_EVENT_LEFT_BUTTON || event.which === JQUERY_EVENT_RIGHT_BUTTON)) {
                if (this.hasControls) {
                    this.setCurrentChartTime(event);
                    this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getCompetitorsVisitingCurrentControlPopupData(), true); };
                    showPopup = true;
                }
            } else if (event.which === JQUERY_EVENT_LEFT_BUTTON) {
                this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getFastestSplitsPopupData(), false); };
                showPopup = true;
            } else if (event.which === JQUERY_EVENT_RIGHT_BUTTON) {
                if (this.hasControls) {
                    this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getFastestSplitsForCurrentLegPopupData(), true); };
                    showPopup = true;
                }
            }
            
            if (showPopup) {
                this.updatePopupContents(event);
                this.popup.show(this.getPopupLocation(event));
            }
        }
    };
    
    /**
    * Updates the chart popup with the contents it should contain.
    *
    * If the current course has control data, and the cursor is above the top
    * X-axis, control information is shown instead of whatever other data would
    * be being shown.
    *
    * @param {jQuery.event} event - jQuery mouse-move event.
    */
    Chart.prototype.updatePopupContents = function (event) {
        var yOffset = event.pageY - $(this.svg.node()).offset().top;
        var showNextControls = this.hasControls && yOffset < MARGIN.top;
        if (showNextControls) {
            this.updateNextControlInformation();
        } else {
            this.popupUpdateFunc();
        }
    };
    
    /**
    * Updates the next-control information.
    */
    Chart.prototype.updateNextControlInformation = function () {
        if (this.hasControls) {
            this.popup.setNextControlData(this.getNextControlData());
        }
    };

    /**
    * Draw a 'control line'.  This is a vertical line running the entire height of
    * the chart, at one of the controls.
    * @param {Number} controlIndex - The index of the control at which to draw the
    *                                control line.
    */
    Chart.prototype.drawControlLine = function(controlIndex) {
        this.currentControlIndex = controlIndex;
        this.updateCompetitorStatistics();    
        var xPosn = this.xScale(this.referenceCumTimes[controlIndex]);
        this.controlLine = this.svgGroup.append("line")
                                        .attr("x1", xPosn)
                                        .attr("y1", 0)
                                        .attr("x2", xPosn)
                                        .attr("y2", this.contentHeight)
                                        .attr("class", "controlLine")
                                        .node();
    };
    
    /**
    * Updates the location of the control line from the given mouse event.
    * @param {jQuery.event} event - jQuery mousedown or mousemove event.
    */
    Chart.prototype.updateControlLineLocation = function (event) {

        var svgNodeAsJQuery = $(this.svg.node());
        var offset = svgNodeAsJQuery.offset();
        var xOffset = event.pageX - offset.left;
        var yOffset = event.pageY - offset.top;
        
        if (this.currentLeftMargin <= xOffset && xOffset < svgNodeAsJQuery.width() - MARGIN.right && 
            yOffset < svgNodeAsJQuery.height() - MARGIN.bottom) {
            // In the chart.
            // Get the time offset that the mouse is currently over.
            var chartX = this.xScale.invert(xOffset - this.currentLeftMargin);
            var bisectIndex = d3.bisect(this.referenceCumTimesSorted, chartX);
            
            // bisectIndex is the index at which to insert chartX into
            // referenceCumTimes in order to keep the array sorted.  So if
            // this index is N, the mouse is between N - 1 and N.  Find
            // which is nearer.
            var sortedControlIndex;
            if (bisectIndex >= this.referenceCumTimesSorted.length) {
                // Off the right-hand end, use the last control (usually the
                // finish).
                sortedControlIndex = this.referenceCumTimesSorted.length - 1;
            } else {
                var diffToNext = Math.abs(this.referenceCumTimesSorted[bisectIndex] - chartX);
                var diffToPrev = Math.abs(chartX - this.referenceCumTimesSorted[bisectIndex - 1]);
                sortedControlIndex = (diffToPrev < diffToNext) ? bisectIndex - 1 : bisectIndex;
            }
            
            var controlIndex = this.referenceCumTimeIndexes[sortedControlIndex];
            
            if (this.actualControlIndex === null || this.actualControlIndex !== controlIndex) {
                // The control line has appeared for the first time or has moved, so redraw it.
                this.removeControlLine();
                this.actualControlIndex = controlIndex;
                this.drawControlLine(Math.max(this.minViewableControl, controlIndex));
            }
            
            if (this.popup.isShown() && this.currentControlIndex !== null) {
                if (this.isRaceGraph) {
                    this.setCurrentChartTime(event);
                }
                
                this.updatePopupContents(event);
                this.popup.setLocation(this.getPopupLocation(event));
            }
            
        } else {
            // In the SVG element but outside the chart area.
            this.removeControlLine();
            this.popup.hide();
        }
    };

    /**
    * Remove any previously-drawn control line.  If no such line existed, nothing
    * happens.
    */
    Chart.prototype.removeControlLine = function() {
        this.currentControlIndex = null;
        this.actualControlIndex = null;
        this.updateCompetitorStatistics();
        if (this.controlLine !== null) {
            d3.select(this.controlLine).remove();
            this.controlLine = null;
        }
    };

    /**
    * Returns an array of the the times that the selected competitors are
    * behind the fastest time at the given control.
    * @param {Number} controlIndex - Index of the given control.
    * @param {Array} indexes - Array of indexes of selected competitors.
    * @return {Array} Array of times in seconds that the given competitors are
    *     behind the fastest time.
    */
    Chart.prototype.getTimesBehindFastest = function (controlIndex, indexes) {
        var selectedCompetitors = indexes.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        var fastestSplit = this.fastestCumTimes[controlIndex] - this.fastestCumTimes[controlIndex - 1];
        var timesBehind = selectedCompetitors.map(function (comp) { var compSplit = comp.getSplitTimeTo(controlIndex); return (compSplit === null) ? null : compSplit - fastestSplit; });
        return timesBehind;
    };

    /**
    * Returns an array of the the time losses of the selected competitors at
    * the given control.
    * @param {Number} controlIndex - Index of the given control.
    * @param {Array} indexes - Array of indexes of selected competitors.
    * @return {Array} Array of times in seconds that the given competitors are
    *     deemed to have lost at the given control.
    */
    Chart.prototype.getTimeLosses = function (controlIndex, indexes) {
        var selectedCompetitors = indexes.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        var timeLosses = selectedCompetitors.map(function (comp) { return comp.getTimeLossAt(controlIndex); });
        return timeLosses;
    };
    
    /**
    * Updates the statistics text shown after the competitors.
    */
    Chart.prototype.updateCompetitorStatistics = function() {
        var selectedCompetitors = this.selectedIndexesOrderedByLastYValue.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        var labelTexts = selectedCompetitors.map(function (comp) { return formatNameAndSuffix(comp.name, comp.getSuffix()); });
        
        if (this.currentControlIndex !== null && this.currentControlIndex > 0) {
            if (this.visibleStatistics.TotalTime) {
                var cumTimes = selectedCompetitors.map(function (comp) { return comp.getCumulativeTimeTo(this.currentControlIndex); }, this);
                var cumRanks = selectedCompetitors.map(function (comp) { return comp.getCumulativeRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, cumTimes, cumRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
                           
            if (this.visibleStatistics.SplitTime) {
                var splitTimes = selectedCompetitors.map(function (comp) { return comp.getSplitTimeTo(this.currentControlIndex); }, this);
                var splitRanks = selectedCompetitors.map(function (comp) { return comp.getSplitRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, splitTimes, splitRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
             
            if (this.visibleStatistics.BehindFastest) {
                var timesBehind = this.getTimesBehindFastest(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                labelTexts = d3.zip(labelTexts, timesBehind)
                               .map(function(pair) { return pair[0] + SPACER + formatTime(pair[1]); });
            }
             
            if (this.visibleStatistics.TimeLoss) {
                var timeLosses = this.getTimeLosses(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                labelTexts = d3.zip(labelTexts, timeLosses)
                               .map(function(pair) { return pair[0] + SPACER + formatTime(pair[1]); });
            }
        }
        
        // Update the current competitor data.
        this.currentCompetitorData.forEach(function (data, index) { data.label = labelTexts[index]; });
        
        // This data is already joined to the labels; just update the text.
        d3.selectAll("text.competitorLabel").text(function (data) { return data.label; });
    };

    /**
    * Returns a tick-formatting function that formats the label of a tick on the
    * top X-axis.
    *
    * The function returned is suitable for use with the D3 axis.tickFormat method.
    *
    * @returns {function} Tick-formatting function.
    */
    Chart.prototype.getTickFormatter = function () {
        var outerThis = this;
        return function (value, idx) {
            return (idx === 0) ? getMessage("StartNameShort") : ((idx === outerThis.numControls + 1) ? getMessage("FinishNameShort") : idx.toString());
        };
    };

    /**
    * Get the width of a piece of text.
    * @param {string} text - The piece of text to measure the width of.
    * @returns {Number} The width of the piece of text, in pixels. 
    */
    Chart.prototype.getTextWidth = function (text) {
        return this.textSizeElement.text(text).node().getBBox().width;
    };

    /**
    * Gets the height of a piece of text.
    *
    * @param {string} text - The piece of text to measure the height of.
    * @returns {Number} The height of the piece of text, in pixels.
    */
    Chart.prototype.getTextHeight = function (text) {
        return this.textSizeElement.text(text).node().getBBox().height;
    };

    /**
    * Return the maximum width of the end-text shown to the right of the graph.
    *
    * This function considers only the competitors whose indexes are in the
    * list given.  This method returns zero if the list is empty.
    * @returns {Number} Maximum width of text, in pixels.
    */
    Chart.prototype.getMaxGraphEndTextWidth = function () {
        if (this.selectedIndexes.length === 0) {
            // No competitors selected.  Avoid problems caused by trying to
            // find the maximum of an empty array.
            return 0;
        } else {
            var nameWidths = this.selectedIndexes.map(function (index) {
                var comp = this.ageClassSet.allCompetitors[index];
                return this.getTextWidth(formatNameAndSuffix(comp.name, comp.getSuffix()));
            }, this);
            return d3.max(nameWidths) + this.determineMaxStatisticTextWidth();
        }
    };

    /**
    * Returns the maximum value from the given array, not including any null or
    * NaN values.  If the array contains no non-null, non-NaN values, zero is
    * returned.
    * @param {Array} values - Array of values.
    * @return {Number} Maximum non-null or NaN value.
    */    
    function maxNonNullNorNaNValue(values) {
        var nonNullNorNaNValues = values.filter(isNotNullNorNaN);
        return (nonNullNorNaNValues.length > 0) ? d3.max(nonNullNorNaNValues) : 0;
    }

    /**
    * Return the maximum width of a piece of time and rank text shown to the right
    * of each competitor 
    * @param {string} timeFuncName - Name of the function to call to get the time
                                     data.
    * @param {string} rankFuncName - Name of the function to call to get the rank
                                     data.
    * @returns {Number} Maximum width of split-time and rank text, in pixels.
    */
    Chart.prototype.getMaxTimeAndRankTextWidth = function(timeFuncName, rankFuncName) {
        var maxTime = 0;
        var maxRank = 0;
        
        var selectedCompetitors = this.selectedIndexes.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        
        d3.range(1, this.numControls + 2).forEach(function (controlIndex) {
            var times = selectedCompetitors.map(function (comp) { return comp[timeFuncName](controlIndex); });
            maxTime = Math.max(maxTime, maxNonNullNorNaNValue(times));
            
            var ranks = selectedCompetitors.map(function (comp) { return comp[rankFuncName](controlIndex); });
            maxRank = Math.max(maxRank, maxNonNullNorNaNValue(ranks));
        });
        
        var text = formatTimeAndRank(maxTime, maxRank);
        return this.getTextWidth(text);
    };

    /**
    * Return the maximum width of the split-time and rank text shown to the right
    * of each competitor 
    * @returns {Number} Maximum width of split-time and rank text, in pixels.
    */
    Chart.prototype.getMaxSplitTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getSplitTimeTo", "getSplitRankTo");
    };

    /**
    * Return the maximum width of the cumulative time and cumulative-time rank text
    * shown to the right of each competitor 
    * @returns {Number} Maximum width of cumulative time and cumulative-time rank text, in
    *                   pixels.
    */
    Chart.prototype.getMaxCumulativeTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getCumulativeTimeTo", "getCumulativeRankTo");
    };

    /**
    * Return the maximum width of the behind-fastest time shown to the right of
    * each competitor 
    * @returns {Number} Maximum width of behind-fastest time rank text, in pixels.
    */
    Chart.prototype.getMaxTimeBehindFastestWidth = function() {
        var maxTime = 0;
        
        for (var controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
            var times = this.getTimesBehindFastest(controlIndex, this.selectedIndexes);
            maxTime = Math.max(maxTime, maxNonNullNorNaNValue(times));
        }
        
        return this.getTextWidth(SPACER + formatTime(maxTime));
    };

    /**
    * Return the maximum width of the behind-fastest time shown to the right of
    * each competitor 
    * @returns {Number} Maximum width of behind-fastest time rank text, in pixels.
    */
    Chart.prototype.getMaxTimeLossWidth = function() {
        var maxTimeLoss = 0;
        var minTimeLoss = 0;
        for (var controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
            var timeLosses = this.getTimeLosses(controlIndex, this.selectedIndexes);
            var nonNullTimeLosses = timeLosses.filter(isNotNullNorNaN);
            if (nonNullTimeLosses.length > 0) {
                maxTimeLoss = Math.max(maxTimeLoss, d3.max(nonNullTimeLosses));
                minTimeLoss = Math.min(minTimeLoss, d3.min(nonNullTimeLosses));
            }
        }
        
        return Math.max(this.getTextWidth(SPACER + formatTime(maxTimeLoss)),
                        this.getTextWidth(SPACER + formatTime(minTimeLoss)));
    };

    /**
    * Determines the maximum width of the statistics text at the end of the competitor.
    * @returns {Number} Maximum width of the statistics text, in pixels.
    */
    Chart.prototype.determineMaxStatisticTextWidth = function() {
        var maxWidth = 0;
        if (this.visibleStatistics.TotalTime) {
            maxWidth += this.getMaxCumulativeTimeAndRankTextWidth();
        }
        if (this.visibleStatistics.SplitTime) {
            maxWidth += this.getMaxSplitTimeAndRankTextWidth();
        }
        if (this.visibleStatistics.BehindFastest) {
            maxWidth += this.getMaxTimeBehindFastestWidth();
        }
        if (this.visibleStatistics.TimeLoss) {
            maxWidth += this.getMaxTimeLossWidth();
        }
        
        return maxWidth;
    };
    
    /**
    * Determines the maximum width of all of the visible start time labels.
    * If none are presently visible, zero is returned.
    * @param {object} chartData - Object containing the chart data.
    * @return {Number} Maximum width of a start time label.
    */
    Chart.prototype.determineMaxStartTimeLabelWidth = function (chartData) {
        var maxWidth;
        if (chartData.competitorNames.length > 0) {
            maxWidth = d3.max(chartData.competitorNames.map(function (name) { return this.getTextWidth("00:00:00 " + name); }, this));
        } else {
            maxWidth = 0;
        }
        
        return maxWidth;
    };

    /**
    * Creates the X and Y scales necessary for the chart and its axes.
    * @param {object} chartData - Chart data object.
    */
    Chart.prototype.createScales = function (chartData) {
        this.xScale = d3.scale.linear().domain(chartData.xExtent).range([0, this.contentWidth]);
        this.yScale = d3.scale.linear().domain(chartData.yExtent).range([0, this.contentHeight]);
        this.xScaleMinutes = d3.scale.linear().domain([chartData.xExtent[0] / 60, chartData.xExtent[1] / 60]).range([0, this.contentWidth]);
    };

    /**
    * Draw the background rectangles that indicate sections of the course
    * between controls.
    */
    Chart.prototype.drawBackgroundRectangles = function () {
        
        // We can't guarantee that the reference cumulative times are in
        // ascending order, but we need such a list of times in order to draw
        // the rectangles.  So, sort the reference cumulative times.
        var refCumTimesSorted = this.referenceCumTimes.slice(0);
        refCumTimesSorted.sort(d3.ascending);
        
        // Now remove any duplicate times.
        var index = 1;
        while (index < refCumTimesSorted.length) {
            if (refCumTimesSorted[index] === refCumTimesSorted[index - 1]) {
                refCumTimesSorted.splice(index, 1);
            } else {
                index += 1;
            }
        }

        var outerThis = this;
        
        var rects = this.svgGroup.selectAll("rect")
                                 .data(d3.range(refCumTimesSorted.length - 1));
        
        rects.enter().append("rect");

        rects.attr("x", function (index) { return outerThis.xScale(refCumTimesSorted[index]); })
             .attr("y", 0)
             .attr("width", function (index) { return outerThis.xScale(refCumTimesSorted[index + 1]) - outerThis.xScale(refCumTimesSorted[index]); })
             .attr("height", this.contentHeight)
             .attr("class", function (index) { return (index % 2 === 0) ? "background1" : "background2"; });

        rects.exit().remove();
    };
    
    /**
    * Returns a function used to format tick labels on the Y-axis.
    *
    * If start times are to be shown (i.e. for the race graph), then the Y-axis
    * values are start times.  We format these as times, as long as there isn't
    * a competitor's start time too close to it.
    *
    * For other graph types, this method returns null, which tells d3 to use
    * its default tick formatter.
    * 
    * @param {object} chartData - The chart data to read start times from.
    * @return {?Function} Tick formatter function, or null to use the default
    *     d3 formatter.
    */
    Chart.prototype.determineYAxisTickFormatter = function (chartData) {
        if (this.isRaceGraph) {
            // Assume column 0 of the data is the start times.
            // However, beware that there might not be any data.
            var startTimes = (chartData.dataColumns.length === 0) ? [] : chartData.dataColumns[0].ys;
            if (startTimes.length === 0) {
                // No start times - draw all tick marks.
                return function (time) { return formatTime(time * 60); };
            } else {
                // Some start times are to be drawn - only draw tick marks if
                // they are far enough away from competitors.
                var yScale = this.yScale;
                return function (time) {
                    var nearestOffset = d3.min(startTimes.map(function (startTime) { return Math.abs(yScale(startTime) - yScale(time)); }));
                    return (nearestOffset >= MIN_COMPETITOR_TICK_MARK_DISTANCE) ? formatTime(Math.round(time * 60)) : "";
                };
            }
        } else {
            // Use the default d3 tick formatter.
            return null;
        }
    };

    /**
    * Draw the chart axes.
    * @param {String} yAxisLabel - The label to use for the Y-axis.
    * @param {object} chartData - The chart data to use.
    */
    Chart.prototype.drawAxes = function (yAxisLabel, chartData) {
    
        var tickFormatter = this.determineYAxisTickFormatter(chartData);
        
        var xAxis = d3.svg.axis()
                          .scale(this.xScale)
                          .orient("top")
                          .tickFormat(this.getTickFormatter())
                          .tickValues(this.referenceCumTimes);

        var yAxis = d3.svg.axis()
                          .scale(this.yScale)
                          .tickFormat(tickFormatter)
                          .orient("left");
                     
        var lowerXAxis = d3.svg.axis()
                               .scale(this.xScaleMinutes)
                               .orient("bottom");

        this.svgGroup.selectAll("g.axis").remove();

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .call(xAxis);

        this.svgGroup.append("g")
                     .attr("class", "y axis")
                     .call(yAxis)
                     .append("text")
                     .attr("transform", "rotate(-90)")
                     .attr("x", -(this.contentHeight - 6))
                     .attr("y", 6)
                     .attr("dy", ".71em")
                     .style("text-anchor", "start")
                     .text(yAxisLabel);

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .attr("transform", "translate(0," + this.contentHeight + ")")                     
                     .call(lowerXAxis)
                     .append("text")
                     .attr("x", 60)
                     .attr("y", -5)
                     .style("text-anchor", "start")
                     .text(getMessage("LowerXAxisChartLabel"));
    };
    
    /**
    * Draw the lines on the chart.
    * @param {Array} chartData - Array of chart data.
    */
    Chart.prototype.drawChartLines = function (chartData) {
        var outerThis = this;
        var lineFunctionGenerator = function (selCompIdx) {
            if (!chartData.dataColumns.some(function (col) { return isNotNullNorNaN(col.ys[selCompIdx]); })) {
                // This competitor's entire row is null/NaN, so there's no data
                // to draw.  WebKit will report an error ('Error parsing d=""')
                // if no points on the line are defined, as will happen in this
                // case, so we substitute a single zero point instead.
                return d3.svg.line()
                             .x(0)
                             .y(0)
                             .defined(function (d, i) { return i === 0; });
            }
            else {
                return d3.svg.line()
                             .x(function (d) { return outerThis.xScale(d.x); })
                             .y(function (d) { return outerThis.yScale(d.ys[selCompIdx]); })
                             .defined(function (d) { return isNotNullNorNaN(d.ys[selCompIdx]); })
                             .interpolate("linear");
            }
        };
        
        this.svgGroup.selectAll("path.graphLine").remove();
        
        this.svgGroup.selectAll("line.aroundDubiousTimes").remove();
        
        d3.range(this.numLines).forEach(function (selCompIdx) {
            var strokeColour = colours[this.selectedIndexes[selCompIdx] % colours.length];
            var highlighter = function () { outerThis.highlight(outerThis.selectedIndexes[selCompIdx]); };
            var unhighlighter = function () { outerThis.unhighlight(); };
            
            this.svgGroup.append("path")
                         .attr("d", lineFunctionGenerator(selCompIdx)(chartData.dataColumns))
                         .attr("stroke", strokeColour)
                         .attr("class", "graphLine competitor" + this.selectedIndexes[selCompIdx])
                         .on("mouseenter", highlighter)
                         .on("mouseleave", unhighlighter)
                         .append("title")
                         .text(chartData.competitorNames[selCompIdx]);
                         
            chartData.dubiousTimesInfo[selCompIdx].forEach(function (dubiousTimeInfo) {
                this.svgGroup.append("line")
                             .attr("x1", this.xScale(chartData.dataColumns[dubiousTimeInfo.start].x))
                             .attr("y1", this.yScale(chartData.dataColumns[dubiousTimeInfo.start].ys[selCompIdx]))
                             .attr("x2", this.xScale(chartData.dataColumns[dubiousTimeInfo.end].x))
                             .attr("y2", this.yScale(chartData.dataColumns[dubiousTimeInfo.end].ys[selCompIdx]))
                             .attr("stroke", strokeColour)
                             .attr("class", "aroundDubiousTimes competitor" + this.selectedIndexes[selCompIdx])
                             .on("mouseenter", highlighter)
                             .on("mouseleave", unhighlighter)
                             .append("title")
                             .text(chartData.competitorNames[selCompIdx]);
            }, this);
        }, this);
    };

    /**
    * Highlights the competitor with the given index.
    * @param {Number} competitorIdx - The index of the competitor to highlight.
    */
    Chart.prototype.highlight = function (competitorIdx) {
        this.svg.selectAll("path.graphLine.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("line.competitorLegendLine.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("text.competitorLabel.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("text.startLabel.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("line.aroundDubiousTimes.competitor" + competitorIdx).classed("selected", true);
    };

    /**
    * Removes any competitor-specific higlighting.
    */
    Chart.prototype.unhighlight = function () {
        this.svg.selectAll("path.graphLine.selected").classed("selected", false);
        this.svg.selectAll("line.competitorLegendLine.selected").classed("selected", false);
        this.svg.selectAll("text.competitorLabel.selected").classed("selected", false);
        this.svg.selectAll("text.startLabel.selected").classed("selected", false);
        this.svg.selectAll("line.aroundDubiousTimes.selected").classed("selected", false);
    };

    /**
    * Draws the start-time labels for the currently-selected competitors.
    * @param {object} chartData - The chart data that contains the start offsets.
    */ 
    Chart.prototype.drawCompetitorStartTimeLabels = function (chartData) {
        var startColumn = chartData.dataColumns[0];
        var outerThis = this;
        
        var startLabels = this.svgGroup.selectAll("text.startLabel").data(this.selectedIndexes);
        
        startLabels.enter().append("text");
        
        startLabels.attr("x", -7)
                   .attr("y", function (_compIndex, selCompIndex) { return outerThis.yScale(startColumn.ys[selCompIndex]) + outerThis.getTextHeight(chartData.competitorNames[selCompIndex]) / 4; })
                   .attr("class", function (compIndex) { return "startLabel competitor" + compIndex; })
                   .on("mouseenter", function (compIndex) { outerThis.highlight(compIndex); })
                   .on("mouseleave", function () { outerThis.unhighlight(); })
                   .text(function (_compIndex, selCompIndex) { return formatTime(Math.round(startColumn.ys[selCompIndex] * 60)) + " " + chartData.competitorNames[selCompIndex]; });
        
        startLabels.exit().remove();
    };
    
    /**
    * Removes all of the competitor start-time labels from the chart.
    */ 
    Chart.prototype.removeCompetitorStartTimeLabels = function () {
        this.svgGroup.selectAll("text.startLabel").remove();
    };

    /**
    * Adjust the locations of the legend labels downwards so that two labels
    * do not overlap.
    */
    Chart.prototype.adjustCompetitorLegendLabelsDownwardsIfNecessary = function () {
        for (var i = 1; i < this.numLines; i += 1) {
            var prevComp = this.currentCompetitorData[i - 1];
            var thisComp = this.currentCompetitorData[i];
            if (thisComp.y < prevComp.y + prevComp.textHeight) {
                thisComp.y = prevComp.y + prevComp.textHeight;
            }
        }
    };

    /**
    * Adjusts the locations of the legend labels upwards so that as many as
    * possible can fit on the chart.  If all competitor labels are already on
    * the chart, then this method does nothing.
    *
    * This method does not move off the chart any label that is currently on
    * the chart.
    *
    * @param {Number} minLastY - The minimum Y-coordinate of the lowest label.
    */
    Chart.prototype.adjustCompetitorLegendLabelsUpwardsIfNecessary = function (minLastY) {
        if (this.numLines > 0 && this.currentCompetitorData[this.numLines - 1].y > this.contentHeight) {
            // The list of competitors runs off the bottom.
            // Put the last competitor at the bottom, or at its minimum
            // Y-offset, whichever is larger, and move all labels up as
            // much as we can.
            this.currentCompetitorData[this.numLines - 1].y = Math.max(minLastY, this.contentHeight);
            for (var i = this.numLines - 2; i >= 0; i -= 1) {
                var nextComp = this.currentCompetitorData[i + 1];
                var thisComp = this.currentCompetitorData[i];
                if (thisComp.y + thisComp.textHeight > nextComp.y) {
                    thisComp.y = nextComp.y - thisComp.textHeight;
                } else {
                    // No more adjustments need to be made.
                    break;
                }
            }
        }    
    };
    
    /**
    * Draw legend labels to the right of the chart.
    * @param {object} chartData - The chart data that contains the final time offsets.
    */
    Chart.prototype.drawCompetitorLegendLabels = function (chartData) {
        
        var minLastY = 0;
        if (chartData.dataColumns.length === 0) {
            this.currentCompetitorData = [];
        } else {
            var finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
            this.currentCompetitorData = d3.range(this.numLines).map(function (i) {
                var competitorIndex = this.selectedIndexes[i];
                var name = this.ageClassSet.allCompetitors[competitorIndex].name;
                var textHeight = this.getTextHeight(name);
                minLastY += textHeight;
                return {
                    label: formatNameAndSuffix(name, this.ageClassSet.allCompetitors[competitorIndex].getSuffix()),
                    textHeight: textHeight,
                    y: (isNotNullNorNaN(finishColumn.ys[i])) ? this.yScale(finishColumn.ys[i]) : null,
                    colour: colours[competitorIndex % colours.length],
                    index: competitorIndex
                };
            }, this);
            
            minLastY -= this.currentCompetitorData[this.numLines - 1].textHeight;
            
            // Draw the mispunchers at the bottom of the chart, with the last
            // one of them at the bottom.
            var lastMispuncherY = null;
            for (var selCompIdx = this.numLines - 1; selCompIdx >= 0; selCompIdx -= 1) {
                if (this.currentCompetitorData[selCompIdx].y === null) {
                    this.currentCompetitorData[selCompIdx].y = (lastMispuncherY === null) ? this.contentHeight : lastMispuncherY - this.currentCompetitorData[selCompIdx].textHeight;
                    lastMispuncherY = this.currentCompetitorData[selCompIdx].y;
                }
            }
        }
        
        // Sort by the y-offset values, which doesn't always agree with the end
        // positions of the competitors.
        this.currentCompetitorData.sort(function (a, b) { return a.y - b.y; });
        
        this.selectedIndexesOrderedByLastYValue = this.currentCompetitorData.map(function (comp) { return comp.index; });

        this.adjustCompetitorLegendLabelsDownwardsIfNecessary();
        
        this.adjustCompetitorLegendLabelsUpwardsIfNecessary(minLastY);

        var legendLines = this.svgGroup.selectAll("line.competitorLegendLine").data(this.currentCompetitorData);
        legendLines.enter()
                   .append("line");

        var outerThis = this;
        legendLines.attr("x1", this.contentWidth + 1)
                   .attr("y1", function (data) { return data.y; })
                   .attr("x2", this.contentWidth + LEGEND_LINE_WIDTH + 1)
                   .attr("y2", function (data) { return data.y; })
                   .attr("stroke", function (data) { return data.colour; })
                   .attr("class", function (data) { return "competitorLegendLine competitor" + data.index; })
                   .on("mouseenter", function (data) { outerThis.highlight(data.index); })
                   .on("mouseleave", function () { outerThis.unhighlight(); });

        legendLines.exit().remove();

        var labels = this.svgGroup.selectAll("text.competitorLabel").data(this.currentCompetitorData);
        labels.enter()
              .append("text");

        labels.attr("x", this.contentWidth + LEGEND_LINE_WIDTH + 2)
              .attr("y", function (data) { return data.y + data.textHeight / 4; })
              .attr("class", function (data) { return "competitorLabel competitor" + data.index; })
              .on("mouseenter", function (data) { outerThis.highlight(data.index); })
              .on("mouseleave", function () { outerThis.unhighlight(); })
              .text(function (data) { return data.label; });

        labels.exit().remove();
    };

    /**
    * Adjusts the computed values for the content size of the chart.
    *
    * This method should be called after any of the following occur:
    * (1) the overall size of the chart changes.
    * (2) the currently-selected set of indexes changes
    * (3) the chart data is set.
    * If you find part of the chart is missing sometimes, chances are you've
    * omitted a necessary call to this method.
    */
    Chart.prototype.adjustContentSize = function () {
        // Extra length added to the maximum start-time label width to
        // include the lengths of the Y-axis ticks.
        var EXTRA_MARGIN = 8;
        var maxTextWidth = this.getMaxGraphEndTextWidth();
        this.setLeftMargin(Math.max(this.maxStartTimeLabelWidth + EXTRA_MARGIN, MARGIN.left));
        this.contentWidth = Math.max(this.overallWidth - this.currentLeftMargin - MARGIN.right - maxTextWidth - (LEGEND_LINE_WIDTH + 2), 100);
        this.contentHeight = Math.max(this.overallHeight - MARGIN.top - MARGIN.bottom, 100);
    };

    /**
    * Sets the overall size of the chart control, including margin, axes and legend labels.
    * @param {Number} overallWidth - Overall width
    * @param {Number} overallHeight - Overall height
    */
    Chart.prototype.setSize = function (overallWidth, overallHeight) {
        this.overallWidth = overallWidth;
        this.overallHeight = overallHeight;
        $(this.svg.node()).width(overallWidth).height(overallHeight);
        this.adjustContentSize();
    };

    /**
    * Clears the graph by removing all controls from it.
    */
    Chart.prototype.clearGraph = function () {
        this.svgGroup.selectAll("*").remove();
    };
    
    /**
    * Sorts the reference cumulative times, and creates a list of the sorted
    * reference cumulative times and their indexes into the actual list of
    * reference cumulative times.
    *
    * This sorted list is used by the chart to find which control the cursor
    * is closest to.
    */
    Chart.prototype.sortReferenceCumTimes = function () {
        // Put together a map that maps cumulative times to the first split to
        // register that time.
        var cumTimesToControlIndex = d3.map();
        this.referenceCumTimes.forEach(function (cumTime, index) {
            if (!cumTimesToControlIndex.has(cumTime)) {
                cumTimesToControlIndex.set(cumTime, index);
            }
        });
        
        // Sort and deduplicate the reference cumulative times.
        this.referenceCumTimesSorted = this.referenceCumTimes.slice(0);
        this.referenceCumTimesSorted.sort(d3.ascending);
        for (var index = this.referenceCumTimesSorted.length - 1; index > 0; index -= 1) {
            if (this.referenceCumTimesSorted[index] === this.referenceCumTimesSorted[index - 1]) {
                this.referenceCumTimesSorted.splice(index, 1);
            }
        }

        this.referenceCumTimeIndexes = this.referenceCumTimesSorted.map(function (cumTime) { return cumTimesToControlIndex.get(cumTime); });
    };

    
    /**
    * Draws the chart.
    * @param {object} data - Object that contains various chart data.  This
    *     must contain the following properties:
    *     * chartData {Object} - the data to plot on the chart
    *     * eventData {SplitsBrowser.Model.Event} - the overall Event object.
    *     * ageClassSet {SplitsBrowser.Model.Event} - the age-class set.
    *     * referenceCumTimes {Array} - Array of cumulative split times of the
    *       'reference'.
    *     * fastestCumTimes {Array} - Array of cumulative times of the
    *       imaginary 'fastest' competitor.
    * @param {Array} selectedIndexes - Array of indexes of selected competitors
    *                (0 in this array means the first competitor is selected, 1
    *                means the second is selected, and so on.)
    * @param {Array} visibleStatistics - Array of boolean flags indicating whether
    *                                    certain statistics are visible.
    * @param {Object} chartType - The type of chart being drawn.
    */
    Chart.prototype.drawChart = function (data, selectedIndexes, visibleStatistics, chartType) {
        var chartData = data.chartData;
        this.numControls = chartData.numControls;
        this.numLines = chartData.competitorNames.length;
        this.selectedIndexes = selectedIndexes;
        this.referenceCumTimes = data.referenceCumTimes;
        this.fastestCumTimes = data.fastestCumTimes;
        this.eventData = data.eventData;
        this.ageClassSet = data.ageClassSet;
        this.hasControls = data.ageClassSet.getCourse().hasControls();
        this.isRaceGraph = chartType.isRaceGraph;
        this.minViewableControl = chartType.minViewableControl;
        this.visibleStatistics = visibleStatistics;
        
        this.maxStatisticTextWidth = this.determineMaxStatisticTextWidth();
        this.maxStartTimeLabelWidth = (this.isRaceGraph) ? this.determineMaxStartTimeLabelWidth(chartData) : 0;
        this.sortReferenceCumTimes();
        this.adjustContentSize();
        this.createScales(chartData);
        this.drawBackgroundRectangles();
        this.drawAxes(getMessage(chartType.yAxisLabelKey), chartData);
        this.drawChartLines(chartData);
        this.drawCompetitorLegendLabels(chartData);
        this.removeControlLine();
        if (this.isRaceGraph) {
            this.drawCompetitorStartTimeLabels(chartData);
        } else {
            this.removeCompetitorStartTimeLabels();
        }
    };
    
    SplitsBrowser.Controls.Chart = Chart;
})();


(function () {
    "use strict";
    
    var formatTime = SplitsBrowser.formatTime;
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    
    var NON_BREAKING_SPACE_CHAR = "\u00a0";

    // Maximum precision to show a results-table entry using.
    var MAX_PERMITTED_PRECISION = 2;
    
    /**
    * A control that shows an entire table of results.
    * @constructor
    * @param {HTMLElement} parent - The parent element to add this control to.
    */
    function ResultsTable(parent) {
        this.parent = parent;
        this.ageClass = null;
        this.div = null;
        this.headerSpan = null;
        this.table = null;
        this.buildTable();
    }
    
    /**
    * Build the results table.
    */
    ResultsTable.prototype.buildTable = function () {
        this.div = d3.select(this.parent).append("div")
                                         .attr("id", "resultsTableContainer");
                                         
        this.headerSpan = this.div.append("div")
                                  .append("span")
                                  .classed("resultsTableHeader", true);
                                  
        this.table = this.div.append("table")
                             .classed("resultsTable", true);
                             
        this.table.append("thead")
                  .append("tr");
                  
        this.table.append("tbody");
    };
    
    /**
    * Determines the precision with which to show the results.
    * 
    * If there are some fractional times, then all times should be shown with
    * the same precision, even if not all of them need to.  For example, a
    * a split time between controls punched after 62.7 and 108.7 seconds must
    * be shown as 46.0 seconds, not 46.
    *
    * @param {Array} competitors - Array of Competitor objects.
    * @return {Number} Maximum precision to use.
    */
    function determinePrecision(competitors) {
        var maxPrecision = 0;
        var maxPrecisionFactor = 1;        
        competitors.forEach(function (competitor) {
            competitor.getAllOriginalCumulativeTimes().forEach(function (cumTime) {
                if (isNotNullNorNaN(cumTime)) {
                    while (maxPrecision < MAX_PERMITTED_PRECISION && Math.abs(cumTime - Math.round(cumTime * maxPrecisionFactor) / maxPrecisionFactor) > 1e-7 * cumTime) {
                        maxPrecision += 1;
                        maxPrecisionFactor *= 10;
                    }
                }
            });
        });
        
        return maxPrecision;
    }
    
    /**
    * Populates the contents of the table with the age-class data.
    */
    ResultsTable.prototype.populateTable = function () {
        var headerText = this.ageClass.name + ", ";
        if (this.ageClass.numControls === 1) {
            headerText += getMessage("ResultsTableHeaderSingleControl");
        } else {
            headerText += getMessageWithFormatting("ResultsTableHeaderMultipleControls", {"$$NUM$$": this.ageClass.numControls});
        }

        var course = this.ageClass.course;
        if (course.length !== null) {
            headerText += ", " + getMessageWithFormatting("ResultsTableHeaderCourseLength", {"$$DISTANCE$$": course.length.toFixed(1)});
        }
        if (course.climb !== null) {
            headerText += ", " + getMessageWithFormatting("ResultsTableHeaderClimb", {"$$CLIMB$$": course.climb});
        }
        
        this.headerSpan.text(headerText);
        
        var headerCellData = [
            getMessage("ResultsTableHeaderControlNumber"),
            getMessage("ResultsTableHeaderName"),
            getMessage("ResultsTableHeaderTime")
        ];
        
        var controls = this.ageClass.course.controls;
        if (controls === null) {
            headerCellData = headerCellData.concat(d3.range(1, this.ageClass.numControls + 1));
        } else {
            headerCellData = headerCellData.concat(controls.map(function (control, index) {
                return (index + 1) + NON_BREAKING_SPACE_CHAR + "(" + control + ")";
            }));
        }
            
        headerCellData.push(getMessage("FinishName"));
        
        var headerCells = this.table.select("thead tr")
                                    .selectAll("th")
                                    .data(headerCellData);
                                                       
        headerCells.enter().append("th");
        headerCells.text(function (header) { return header; });
        headerCells.exit().remove();
        
        var tableBody = this.table.select("tbody");
        tableBody.selectAll("tr").remove();
        
        function addCell(tableRow, topLine, bottomLine, cssClass, cumDubious, splitDubious) {
            var cell = tableRow.append("td");
            cell.append("span")
                .classed("dubious", cumDubious)
                .text(topLine);

            cell.append("br");
            cell.append("span")
                .classed("dubious", splitDubious)
                .text(bottomLine);
                
            if (cssClass) {
                cell.classed(cssClass, true);
            }
        }
        
        var competitors = this.ageClass.competitors.slice(0);
        competitors.sort(compareCompetitors);
        
        var nonCompCount = 0;
        var rank = 0;
        
        var precision = determinePrecision(competitors);
        
        competitors.forEach(function (competitor, index) {
            var tableRow = tableBody.append("tr");
            var numberCell = tableRow.append("td");
            if (competitor.isNonCompetitive) {
                numberCell.text(getMessage("NonCompetitiveShort"));
                nonCompCount += 1;
            } else if (competitor.completed()) {
                if (index === 0 || competitors[index - 1].totalTime !== competitor.totalTime) {
                    rank = index + 1 - nonCompCount;
                }
                
                numberCell.text(rank);
            }
            
            addCell(tableRow, competitor.name, competitor.club, false, false);
            addCell(tableRow, (competitor.completed()) ? formatTime(competitor.totalTime) : getMessage("MispunchedShort"), NON_BREAKING_SPACE_CHAR, "time", false, false);
            
            d3.range(1, this.ageClass.numControls + 2).forEach(function (controlNum) {
                var isCumDubious = competitor.isCumulativeTimeDubious(controlNum);
                var isSplitDubious = competitor.isSplitTimeDubious(controlNum);
                addCell(tableRow, formatTime(competitor.getOriginalCumulativeTimeTo(controlNum), precision), formatTime(competitor.getOriginalSplitTimeTo(controlNum), precision), "time", isCumDubious, isSplitDubious);
            });
        }, this);
    };
    
    /**
    * Sets the class whose data is displayed.
    * @param {SplitsBrowser.Model.AgeClass} ageClass - The class displayed.
    */
    ResultsTable.prototype.setClass = function (ageClass) {
        this.ageClass = ageClass;
        this.populateTable();
        if (this.div.style("display") !== "none") {
            this.adjustTableCellWidths();
        }
    };
    
    /**
    * Adjust the widths of the time table cells so that they have the same width.
    */
    ResultsTable.prototype.adjustTableCellWidths = function () {
        var lastCellOnFirstRow = d3.select("tbody tr td:last-child").node();
        $("tbody td.time").width($(lastCellOnFirstRow).width());
    };
    
    /**
    * Shows the table of results.
    */
    ResultsTable.prototype.show = function () {
        this.div.style("display", null);
        this.adjustTableCellWidths();
    };
    
    /**
    * Hides the table of results.
    */
    ResultsTable.prototype.hide = function () {
        this.div.style("display", "none");
    };
    
    SplitsBrowser.Controls.ResultsTable = ResultsTable;
})();

(function () {
    "use strict";
    
    var ChartTypes = SplitsBrowser.Model.ChartTypes;
    var AgeClassSet = SplitsBrowser.Model.AgeClassSet;
    
    /**
    * Remove all matches of the given regular expression from the given string.
    * The regexp is not assumed to contain the "g" flag.
    * @param {String} queryString - The query-string to process.
    * @param {RegExp} regexp - The regular expression to use to remove text.
    * @return {String} The given query-string with all regexp matches removed.
    */
    function removeAll(queryString, regexp) {
        return queryString.replace(new RegExp(regexp.source, "g"), "");
    }
    
    var CLASS_NAME_REGEXP = /(?:^|&|\?)class=([^&]+)/;
    
    /**
    * Reads the selected class names from a query string.
    * @param {String} queryString - The query string to read the class name
    *     from.
    * @param {Event} eventData - The event data read in, used to validate the 
    *     selected classes.
    * @return {AgeClassSet|null} - Array of selected AgeClass objects, or null
    *     if none were found.
    */
    function readSelectedClasses(queryString, eventData) {
        var classNameMatch = CLASS_NAME_REGEXP.exec(queryString);
        if (classNameMatch === null) {
            // No class name specified in the URL.
            return null;
        } else {
            var classesByName = d3.map();
            for (var index = 0; index < eventData.classes.length; index += 1) {
                classesByName.set(eventData.classes[index].name, eventData.classes[index]);
            }
            
            var classNames = decodeURIComponent(classNameMatch[1]).split(";");
            classNames = d3.set(classNames).values();
            var selectedClasses = classNames.filter(function (className) { return classesByName.has(className); })
                                            .map(function (className) { return classesByName.get(className); });
            
            if (selectedClasses.length === 0) {
                // No classes recognised, or none were specified.
                return null;
            } else {
                // Ignore any classes that are not on the same course as the
                // first class.
                var course = selectedClasses[0].course;
                selectedClasses = selectedClasses.filter(function (selectedClass) { return selectedClass.course === course; });
                return new AgeClassSet(selectedClasses);
            }
        }
    }
    
    /**
    * Formats the selected classes into the given query-string, removing any
    * previous matches.
    * @param {String} queryString - The original query-string.
    * @param {Event} eventData - The event data.
    * @param {Array} classIndexes - Array of indexes of selected classes.
    * @return {String} The query-string with the selected classes formatted in.
    */
    function formatSelectedClasses(queryString, eventData, classIndexes) {
        queryString = removeAll(queryString, CLASS_NAME_REGEXP);
        var classNames = classIndexes.map(function (index) { return eventData.classes[index].name; });
        return queryString + "&class=" + encodeURIComponent(classNames.join(";"));
    }

    var CHART_TYPE_REGEXP = /(?:^|&|\?)chartType=([^&]+)/;
    
    /**
    * Reads the selected chart type from a query string.
    * @param {String} queryString - The query string to read the chart type
    *     from.
    * @return {Object|null} Selected chart type, or null if not recognised.
    */    
    function readChartType(queryString) {
        var chartTypeMatch = CHART_TYPE_REGEXP.exec(queryString);
        if (chartTypeMatch === null) {
            return null;
        } else { 
            var chartTypeName = chartTypeMatch[1];
            if (ChartTypes.hasOwnProperty(chartTypeName)) {
                return ChartTypes[chartTypeName];
            } else {
                return null;
            }
        }
    }
    
    /**
    * Formats the given chart type into the query-string
    * @param {String} queryString - The original query-string.
    * @param {Object} chartType - The chart type
    * @return {String} The query-string with the chart-type formatted in.
    */
    function formatChartType(queryString, chartType) {
        queryString = removeAll(queryString, CHART_TYPE_REGEXP);
        for (var chartTypeName in ChartTypes) {
            if (ChartTypes.hasOwnProperty(chartTypeName) && ChartTypes[chartTypeName] === chartType) {
                return queryString + "&chartType=" + encodeURIComponent(chartTypeName);
            }
        }
        
        // Unrecognised chart type?
        return queryString;
    }
    
    var COMPARE_WITH_REGEXP = /(?:^|&|\?)compareWith=([^&]+)/;
    
    var BUILTIN_COMPARISON_TYPES = ["Winner", "FastestTime", "FastestTimePlus5", "FastestTimePlus25", "FastestTimePlus50", "FastestTimePlus100"];
    
    /**
    * Reads what to compare against.
    * @param {String} queryString - The query string to read the comparison
    *     type from.
    * @param {AgeClassSet|null} ageClassSet - Age-class set containing selected
    *     age-classes, or null if none are selected.
    * @return {Object|null} Selected comparison type, or null if not
    *     recognised.
    */
    function readComparison(queryString, ageClassSet) {
        var comparisonMatch = COMPARE_WITH_REGEXP.exec(queryString);
        if (comparisonMatch === null) {
            return null;
        } else {
            var comparisonName = decodeURIComponent(comparisonMatch[1]);
            var defaultIndex = BUILTIN_COMPARISON_TYPES.indexOf(comparisonName);
            if (defaultIndex >= 1) {
                return {index: defaultIndex, runner: null};
            } else if (defaultIndex === 0 && ageClassSet !== null) {
                var hasCompleters = ageClassSet.allCompetitors.some(function (competitor) {
                    return competitor.completed();
                });
                
                if (hasCompleters) {
                    return {index: 0, runner: null};
                } else {
                    // Cannot select 'Winner' as there was no winner.
                    return null;
                }
            } else if (ageClassSet === null) {
                // Not one of the recognised comparison types and we have no
                // classes to look for competitor names within.
                return null;
            } else {
                for (var competitorIndex = 0; competitorIndex < ageClassSet.allCompetitors.length; competitorIndex += 1) {
                    var competitor = ageClassSet.allCompetitors[competitorIndex];
                    if (competitor.name === comparisonName && competitor.completed()) {
                        return {index: BUILTIN_COMPARISON_TYPES.length, runner: competitor};
                    }
                }
                
                // Didn't find the competitor.
                return null;
            }
        }
    }
    
    /**
    * Formats the given comparison into the given query-string.
    * @param {String} queryString - The original query-string.
    * @param {Number} index - Index of the comparison type.
    * @param {String} The formatted query-string.
    */
    function formatComparison(queryString, index, runner) {
        queryString = removeAll(queryString, COMPARE_WITH_REGEXP);
        var comparison = null;
        if (typeof index === typeof 0 && 0 <= index && index < BUILTIN_COMPARISON_TYPES.length) {
            comparison = BUILTIN_COMPARISON_TYPES[index];
        } else if (runner !== null) {
            comparison = runner.name;
        }
        
        if (comparison === null) {
            return queryString;
        } else {
            return queryString + "&compareWith=" + encodeURIComponent(comparison);
        }
    }
    
    var SELECTED_COMPETITORS_REGEXP = /(?:^|&|\?)selected=([^&]+)/;
    
    /**
    * Reads what to compare against.
    * @param {String} queryString - The query string to read the comparison
    *     type from.
    * @param {AgeClassSet|null} ageClassSet - Age-class set containing selected
    *     age-classes, or null if none are selected.
    * @return {Array|null} Array of selected competitor indexes, or null if
    *     none found.
    */
    function readSelectedCompetitors(queryString, ageClassSet) {
        if (ageClassSet === null) {
            return null;
        } else {
            var selectedCompetitorsMatch = SELECTED_COMPETITORS_REGEXP.exec(queryString);
            if (selectedCompetitorsMatch === null) {
                return null;
            } else {
                var competitorNames = decodeURIComponent(selectedCompetitorsMatch[1]).split(";");
                if (competitorNames.indexOf("*") >= 0) {
                    // All competitors selected.
                    return d3.range(0, ageClassSet.allCompetitors.length);
                }
                
                competitorNames = d3.set(competitorNames).values();
                var allCompetitorNames = ageClassSet.allCompetitors.map(function (competitor) { return competitor.name; });
                var selectedCompetitorIndexes = [];
                competitorNames.forEach(function (competitorName) {
                    var index = allCompetitorNames.indexOf(competitorName);
                    if (index >= 0) {
                        selectedCompetitorIndexes.push(index);
                    }
                });
                
                selectedCompetitorIndexes.sort(d3.ascending);
                return (selectedCompetitorIndexes.length === 0) ? null : selectedCompetitorIndexes;
            }
        }
    }
    
    /**
    * Formats the given selected competitors into the given query-string.
    * @param {String} queryString - The original query-string.
    * @param {AgeClassSet} ageClassSet - The current age-class set.
    * @param {Array} selected - Array of indexes within the age-class set's
    *     list of competitors of those that are selected.
    * @return {String} Query-string with the selected competitors formatted
    *     into it.
    */
    function formatSelectedCompetitors(queryString, ageClassSet, selected) {
        queryString = removeAll(queryString, SELECTED_COMPETITORS_REGEXP);
        var selectedCompetitors = selected.map(function (index) { return ageClassSet.allCompetitors[index]; });
        if (selectedCompetitors.length === 0) {
            return queryString;
        } else if (selectedCompetitors.length === ageClassSet.allCompetitors.length) {
            // Assume all selected competitors are different, so all must be
            // selected.
            return queryString + "&selected=*";
        } else {
            var competitorNames = selectedCompetitors.map(function (comp) { return comp.name; }).join(";");
            return queryString + "&selected=" + encodeURIComponent(competitorNames);
        }
    }
    
    var SELECTED_STATISTICS_REGEXP = /(?:^|&|\?)stats=([^&]*)/;
    
    var ALL_STATS_NAMES = ["TotalTime", "SplitTime", "BehindFastest", "TimeLoss"];
    
    /**
    * Reads the selected statistics from the query string.
    * @param {String} queryString - The query string to read the selected
    *     statistics from.
    * @return {Object|null} - Object containing the statistics read, or null
    *     if no statistics parameter was found.
    */
    function readSelectedStatistics(queryString) {
        var statsMatch = SELECTED_STATISTICS_REGEXP.exec(queryString);
        if (statsMatch === null) {
            return null;
        } else {
            var statsNames = decodeURIComponent(statsMatch[1]).split(";");
            var stats = {};
            ALL_STATS_NAMES.forEach(function (statsName) { stats[statsName] = false; });
            
            for (var index = 0; index < statsNames.length; index += 1) {
                var name = statsNames[index];
                if (stats.hasOwnProperty(name)) {
                    stats[name] = true;
                } else if (name !== "") {
                    // Ignore unrecognised non-empty statistic name.
                    return null;
                }
            }
            
            return stats;
        }
    }
    
    /**
    * Formats the selected statistics into the given query string.
    * @param {String} queryString - The original query-string.
    * @param {Object} stats - The statistics to format.
    * @return Query-string with the selected statistics formatted in.
    */
    function formatSelectedStatistics(queryString, stats) {
        queryString = removeAll(queryString, SELECTED_STATISTICS_REGEXP);
        var statsNames = ALL_STATS_NAMES.filter(function (name) { return stats.hasOwnProperty(name) && stats[name]; });
        return queryString + "&stats=" + encodeURIComponent(statsNames.join(";"));
    }
    
    var SHOW_ORIGINAL_REGEXP = /(?:^|&|\?)showOriginal=([^&]*)/;
    
    /**
    * Reads the show-original-data flag from the given query-string.
    *
    * To show original data, the parameter showOriginal=1 must be part of the
    * URL.  If this parameter does not exist or has some other value, original
    * data will not be shown.  If the selected classes do not contain any
    * dubious splits, this option will have no effect.
    * @param {String} queryString - The query-string to read.
    * @return {boolean} True to show original data, false not to.
    */
    function readShowOriginal(queryString) {
        var showOriginalMatch = SHOW_ORIGINAL_REGEXP.exec(queryString);
        return (showOriginalMatch !== null && showOriginalMatch[1] === "1");
    }
    
    /**
    * Formats the show-original-data flag into the given query-string.
    * @param {String} queryString - The original query-string.
    * @param {boolean} showOriginal - True to show original data, false not to.
    * @return {String} queryString - The query-string with the show-original
    *     data flag formatted in.
    */
    function formatShowOriginal(queryString, showOriginal) {
        queryString = removeAll(queryString, SHOW_ORIGINAL_REGEXP);
        return (showOriginal) ? queryString + "&showOriginal=1" : queryString;
    }
    
    /**
    * Attempts to parse the given query string.
    * @param {String} queryString - The query string to parse.
    * @param {Event} eventData - The parsed event data.
    * @return {Object} The data parsed from the given query string.
    */
    function parseQueryString(queryString, eventData) {
        var ageClassSet = readSelectedClasses(queryString, eventData);
        var classIndexes = (ageClassSet === null) ? null : ageClassSet.ageClasses.map(function (ageClass) { return eventData.classes.indexOf(ageClass); });
        return {
            classes: classIndexes,
            chartType: readChartType(queryString),
            compareWith: readComparison(queryString, ageClassSet),
            selected: readSelectedCompetitors(queryString, ageClassSet),
            stats: readSelectedStatistics(queryString),
            showOriginal: readShowOriginal(queryString)
        };
    }

    /**
    * Formats a query string with the given data.
    *
    * The original query-string is provided, and any argument values within it
    * are replaced with those given, and new ones added.  Unrecognised query-
    * string parameters are preserved; they could be used server-side by
    * whatever web application is hosting SplitsBrowser.
    *
    * @param {String} queryString - The original query-string.
    * @param {Event} eventData - The event data.
    * @param {AgeClassSet} ageClassSet - The current age-class set.
    * @param {Object} data - Object containing the data to format into the
    *     query-string.
    * @return The formatted query-string.
    */
    function formatQueryString(queryString, eventData, ageClassSet, data) {
        queryString = formatSelectedClasses(queryString, eventData, data.classes);
        queryString = formatChartType(queryString, data.chartType);
        queryString = formatComparison(queryString, data.compareWith.index, data.compareWith.runner);
        queryString = formatSelectedCompetitors(queryString, ageClassSet, data.selected);
        queryString = formatSelectedStatistics(queryString, data.stats);
        queryString = formatShowOriginal(queryString, data.showOriginal);
        queryString = queryString.replace(/^\??&/, "");
        return queryString;
    }
    
    SplitsBrowser.parseQueryString = parseQueryString;
    SplitsBrowser.formatQueryString = formatQueryString;
})();

(function () {
    "use strict";
    // Delay in milliseconds between a resize event being triggered and the
    // page responding to it.
    // (Resize events tend to come more than one at a time; if a resize event
    // comes in while a previous event is waiting, the previous event is
    // cancelled.)
    var RESIZE_DELAY_MS = 100;

    // ID of the div that contains the competitor list.
    // Must match that used in styles.css.
    var COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    
    var Version = SplitsBrowser.Version;
    var getMessage = SplitsBrowser.getMessage;
    var tryGetMessage = SplitsBrowser.tryGetMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    
    var Model = SplitsBrowser.Model;
    var CompetitorSelection = Model.CompetitorSelection;
    var AgeClassSet = Model.AgeClassSet;
    var ChartTypes = Model.ChartTypes;
    
    var parseEventData = SplitsBrowser.Input.parseEventData;
    var repairEventData = SplitsBrowser.DataRepair.repairEventData;
    var transferCompetitorData = SplitsBrowser.DataRepair.transferCompetitorData;
    var parseQueryString = SplitsBrowser.parseQueryString;
    var formatQueryString = SplitsBrowser.formatQueryString;
    
    var Controls = SplitsBrowser.Controls;
    var ClassSelector = Controls.ClassSelector;
    var ChartTypeSelector = Controls.ChartTypeSelector;
    var ComparisonSelector = Controls.ComparisonSelector;
    var OriginalDataSelector = Controls.OriginalDataSelector;
    var StatisticsSelector = Controls.StatisticsSelector;
    var CompetitorListBox = Controls.CompetitorListBox;
    var Chart = Controls.Chart;
    var ResultsTable = Controls.ResultsTable;
    
    /**
    * Enables or disables a control, by setting or clearing an HTML "disabled"
    * attribute as necessary.
    * @param {d3.selection} control - d3 selection containing the control.
    * @param {boolean} isEnabled - Whether the control is enabled.
    */
    function enableControl(control, isEnabled) {
        control.property("disabled", !isEnabled);
    }
    
    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    * @param {?Object} options - Optional object containing various options
    *     to SplitsBrowser.
    */
    function Viewer(options) {
        this.options = options;
    
        this.eventData = null;
        this.classes = null;
        this.currentClasses = [];
        this.chartData = null;
        this.referenceCumTimes = null;
        this.fastestCumTimes = null;
        this.previousCompetitorList = [];
        
        this.topBarHeight = (options && options.topBar && $(options.topBar).length > 0) ? $(options.topBar).height() : 0;
        
        this.selection = null;
        this.ageClassSet = null;
        this.classSelector = null;
        this.comparisonSelector = null;
        this.originalDataSelector = null;
        this.statisticsSelector = null;
        this.competitorListBox = null;
        this.chart = null;
        this.topPanel = null;
        this.mainPanel = null;
        this.buttonsPanel = null;
        this.competitorListContainer = null;
        
        this.currentResizeTimeout = null;
    }
    
    /**
    * Pops up an alert box informing the user that the race graph cannot be
    * chosen as the start times are missing.
    */ 
    function alertRaceGraphDisabledAsStartTimesMissing() {
        alert(getMessage("RaceGraphDisabledAsStartTimesMissing"));
    }
    
    /**
    * Enables or disables the race graph option in the chart type selector
    * depending on whether all visible competitors have start times.
    */
    Viewer.prototype.enableOrDisableRaceGraph = function () {
        var anyStartTimesMissing = this.ageClassSet.allCompetitors.some(function (competitor) { return competitor.lacksStartTime(); });
        this.chartTypeSelector.setRaceGraphDisabledNotifier((anyStartTimesMissing) ? alertRaceGraphDisabledAsStartTimesMissing : null);
    };
    
    /**
    * Sets the classes that the viewer can view.
    * @param {SplitsBrowser.Model.Event} eventData - All event data loaded.
    */
    Viewer.prototype.setEvent = function (eventData) {
        this.eventData = eventData;
        this.classes = eventData.classes;
        if (this.classSelector !== null) {
            this.classSelector.setClasses(this.classes);
        }
    };

    /**
    * Draws the logo in the top panel.
    */
    Viewer.prototype.drawLogo = function () {
        var logoSvg = this.topPanel.append("svg")
                                   .style("float", "left");

        logoSvg.style("width", "19px")
               .style("height", "19px")
               .style("margin-bottom", "-3px")
               .style("margin-right", "20px");
               
        logoSvg.append("rect")
               .attr("x", "0")
               .attr("y", "0")
               .attr("width", "19")
               .attr("height", "19")
               .attr("fill", "white");
         
        logoSvg.append("polygon")
               .attr("points", "0,19 19,0 19,19")
               .attr("fill", "red");
               
        logoSvg.append("polyline")
               .attr("points", "0.5,0.5 0.5,18.5 18.5,18.5 18.5,0.5 0.5,0.5 0.5,18.5")
               .attr("stroke", "black")
               .attr("fill", "none");
               
        logoSvg.append("polyline")
               .attr("points", "1,12 5,8 8,14 17,11")
               .attr("fill", "none")
               .attr("stroke", "blue")
               .attr("stroke-width", "2");
                                   
        logoSvg.selectAll("*")
               .append("title")
               .text(getMessageWithFormatting("ApplicationVersion", {"$$VERSION$$": Version}));
    };

    /**
    * Adds a spacer between controls on the top row.
    */
    Viewer.prototype.addSpacer = function () {
        this.topPanel.append("div").classed("topRowSpacer", true);    
    };
    
    /**
    * Adds a country flag to the top panel.
    */
    Viewer.prototype.addCountryFlag = function () {
        var flagImage = this.topPanel.append("img")
                                     .attr("id", "flagImage")
                                     .attr("src", this.options.flagImageURL)
                                     .attr("alt", tryGetMessage("Language", ""))
                                     .attr("title", tryGetMessage("Language", ""));
        if (this.options.hasOwnProperty("flagImageWidth")) {
            flagImage.attr("width", this.options.flagImageWidth);
        }
        if (this.options.hasOwnProperty("flagImageHeight")) {
            flagImage.attr("height", this.options.flagImageHeight);
        }
    }; 
    
    /**
    * Adds the class selector control to the top panel.
    */
    Viewer.prototype.addClassSelector = function () {
        this.classSelector = new ClassSelector(this.topPanel.node());
        if (this.classes !== null) {
            this.classSelector.setClasses(this.classes);
        }
    };
    
    /**
    * Adds the chart-type selector to the top panel.
    */
    Viewer.prototype.addChartTypeSelector = function () {
        var chartTypes = [ChartTypes.SplitsGraph, ChartTypes.RaceGraph, ChartTypes.PositionAfterLeg,
                          ChartTypes.SplitPosition, ChartTypes.PercentBehind, ChartTypes.ResultsTable];
        
        this.chartTypeSelector = new ChartTypeSelector(this.topPanel.node(), chartTypes);
    };
    
    /**
    * Adds the comparison selector to the top panel.
    */
    Viewer.prototype.addComparisonSelector = function () {
        this.comparisonSelector = new ComparisonSelector(this.topPanel.node(), function (message) { alert(message); });
        if (this.classes !== null) {
            this.comparisonSelector.setClasses(this.classes);
        }
    };
    
    /**
    * Adds a checkbox to select the 'original' data or data after SplitsBrowser
    * has attempted to repair it.
    */
    Viewer.prototype.addOriginalDataSelector = function () {
        this.originalDataSelector = new OriginalDataSelector(this.topPanel);
    };

    /**
    * Adds a direct link which links directly to SplitsBrowser with the given
    * settings.
    */
    Viewer.prototype.addDirectLink = function () {
        this.directLink = this.topPanel.append("a")
                                      .attr("title", tryGetMessage("DirectLinkToolTip", ""))
                                      .attr("id", "directLinkAnchor")
                                      .attr("href", document.location.href)
                                      .text(getMessage("DirectLink"));
    };
    
    /**
    * Updates the URL that the direct link points to.
    */
    Viewer.prototype.updateDirectLink = function () {
        var data = {
            classes: this.classSelector.getSelectedClasses(),
            chartType: this.chartTypeSelector.getChartType(),
            compareWith: this.comparisonSelector.getComparisonType(),
            selected: this.selection.getSelectedIndexes(),
            stats: this.statisticsSelector.getVisibleStatistics(),
            showOriginal: this.ageClassSet.hasDubiousData() && this.originalDataSelector.isOriginalDataSelected()
        };
        
        var oldQueryString = document.location.search;
        var newQueryString = formatQueryString(oldQueryString, this.eventData, this.ageClassSet, data);
        var oldHref = document.location.href;        
        this.directLink.attr("href", oldHref.substring(0, oldHref.length - oldQueryString.length) + "?" + newQueryString);
    };
    
    /**
    * Adds the list of competitors, and the buttons, to the page.
    */
    Viewer.prototype.addCompetitorList = function () {
        this.competitorListContainer = this.mainPanel.append("div")
                                                     .attr("id", COMPETITOR_LIST_CONTAINER_ID);
                                               
        this.buttonsPanel = this.competitorListContainer.append("div");
                           
        var outerThis = this;
        this.allButton = this.buttonsPanel.append("button")
                                          .text(getMessage("SelectAllCompetitors"))
                                          .style("width", "50%")
                                          .on("click", function () { outerThis.selectAll(); });
                        
        this.noneButton = this.buttonsPanel.append("button")
                                           .text(getMessage("SelectNoCompetitors"))
                                           .style("width", "50%")
                                           .on("click", function () { outerThis.selectNone(); });
                        
        this.buttonsPanel.append("br");
                        
        this.crossingRunnersButton = this.buttonsPanel.append("button")
                                                      .text(getMessage("SelectCrossingRunners"))
                                                      .style("width", "100%")
                                                      .on("click", function () { outerThis.selectCrossingRunners(); })
                                                      .style("display", "none");

        this.competitorListBox = new CompetitorListBox(this.competitorListContainer.node());
    };

    /**
    * Construct the UI inside the HTML body.
    */
    Viewer.prototype.buildUi = function () {
        var body = d3.select("body");
        
        this.topPanel = body.append("div");
        
        this.drawLogo();
        if (this.options && this.options.flagImageURL) {
            this.addCountryFlag();
        }
        
        this.addClassSelector();
        this.addSpacer();
        this.addChartTypeSelector();
        this.addSpacer();
        this.addComparisonSelector();
        this.addOriginalDataSelector();
        this.addSpacer();
        this.addDirectLink();
        
        this.statisticsSelector = new StatisticsSelector(this.topPanel.node());

        // Add an empty div to clear the floating divs and ensure that the
        // top panel 'contains' all of its children.
        this.topPanel.append("div")
                     .style("clear", "both");
        
        this.mainPanel = body.append("div");
                             
        this.addCompetitorList();
        this.chart = new Chart(this.mainPanel.node());
        
        this.resultsTable = new ResultsTable(body.node());
        this.resultsTable.hide();
        
        var outerThis = this;
           
        $(window).resize(function () { outerThis.handleWindowResize(); });
        
        // Disable text selection anywhere.
        // This is for the benefit of IE9, which doesn't support the
        // -ms-user-select CSS style.  IE10, IE11 do support -ms-user-select
        // and other browsers have their own vendor-specific CSS styles for
        // this, and in these browsers this event handler never gets called.
        $("body").bind("selectstart", function () { return false; });
    };

    /**
    * Registers change handlers.
    */
    Viewer.prototype.registerChangeHandlers = function () {
        var outerThis = this;
        this.classSelector.registerChangeHandler(function (indexes) { outerThis.selectClasses(indexes); });
        this.chartTypeSelector.registerChangeHandler(function (chartType) { outerThis.selectChartTypeAndRedraw(chartType); });
        this.comparisonSelector.registerChangeHandler(function (comparisonFunc) { outerThis.selectComparison(comparisonFunc); });
        this.originalDataSelector.registerChangeHandler(function (showOriginalData) { outerThis.showOriginalOrRepairedData(showOriginalData); });
    };
    
    /**
    * Select all of the competitors.
    */
    Viewer.prototype.selectAll = function () {
        this.selection.selectAll();
    };

    /**
    * Select none of the competitors.
    */
    Viewer.prototype.selectNone = function () {
        this.selection.selectNone();
    };

    /**
    * Select all of the competitors that cross the unique selected competitor.
    */
    Viewer.prototype.selectCrossingRunners = function () {
        this.selection.selectCrossingRunners(this.ageClassSet.allCompetitors); 
        if (this.selection.isSingleRunnerSelected()) {
            // Only a single runner is still selected, so nobody crossed the
            // selected runner.
            var competitorName = this.ageClassSet.allCompetitors[this.selection.getSelectedIndexes()[0]].name;
            alert(getMessageWithFormatting("RaceGraphNoCrossingRunners", {"$$NAME$$": competitorName}));
        }
    };

    /**
     * Handle a resize of the window.
     */
    Viewer.prototype.handleWindowResize = function () {
        if (this.currentResizeTimeout !== null) {
            clearTimeout(this.currentResizeTimeout);
        }

        var outerThis = this;
        this.currentResizeTimeout = setTimeout(function() { outerThis.postResizeHook(); }, RESIZE_DELAY_MS);
    };
    
    /**
    * Resize the chart following a change of size of the chart.
    */
    Viewer.prototype.postResizeHook = function () {
        this.currentResizeTimeout = null;
        this.drawChart();
    };

    /**
    * Adjusts the size of the viewer.
    */
    Viewer.prototype.adjustSize = function () {
        // Margin around the body element.
        var horzMargin = parseInt($("body").css("margin-left"), 10) + parseInt($("body").css("margin-right"), 10);
        var vertMargin = parseInt($("body").css("margin-top"), 10) + parseInt($("body").css("margin-bottom"), 10);
        
        // Extra amount subtracted off of the width of the chart in order to
        // prevent wrapping, in units of pixels.
        // 2 to prevent wrapping when zoomed out to 33% in Chrome.
        var EXTRA_WRAP_PREVENTION_SPACE = 2;
        
        var bodyWidth = $(window).width() - horzMargin;
        var bodyHeight = $(window).height() - vertMargin - this.topBarHeight;

        $("body").width(bodyWidth).height(bodyHeight);
        
        var topPanelHeight = $(this.topPanel.node()).height();

        // Hide the chart before we adjust the width of the competitor list.
        // If the competitor list gets wider, the new competitor list and the
        // old chart may be too wide together, and so the chart wraps onto a
        // new line.  Even after shrinking the chart back down, there still
        // might not be enough horizontal space, because of the vertical
        // scrollbar.  So, hide the chart now, and re-show it later once we
        // know what size it should have.
        this.chart.hide();
        
        this.competitorListBox.setCompetitorList(this.ageClassSet.allCompetitors, (this.currentClasses.length > 1));
        
        var chartWidth = bodyWidth - this.competitorListBox.width() - EXTRA_WRAP_PREVENTION_SPACE;
        var chartHeight = bodyHeight - topPanelHeight;

        this.chart.setSize(chartWidth, chartHeight);
        this.chart.show();
        
        $(this.competitorListContainer.node()).height(bodyHeight - $(this.buttonsPanel.node()).height() - topPanelHeight);    
    };
    
    /**
    * Draw the chart using the current data.
    */
    Viewer.prototype.drawChart = function () {
        if (this.chartTypeSelector.getChartType().isResultsTable) {
            return;
        }
        
        this.adjustSize();
        
        this.currentVisibleStatistics = this.statisticsSelector.getVisibleStatistics();
        
        if (this.selectionChangeHandler !== null) {
            this.selection.deregisterChangeHandler(this.selectionChangeHandler);
        }
        
        if (this.statisticsChangeHandler !== null) {
            this.statisticsSelector.deregisterChangeHandler(this.statisticsChangeHandler);
        }
        
        var outerThis = this;
        
        this.selectionChangeHandler = function () {
            outerThis.enableOrDisableCrossingRunnersButton();
            outerThis.redraw();
            outerThis.updateDirectLink();
        };

        this.selection.registerChangeHandler(this.selectionChangeHandler);
        
        this.statisticsChangeHandler = function (visibleStatistics) {
            outerThis.currentVisibleStatistics = visibleStatistics;
            outerThis.redraw();
            outerThis.updateDirectLink();
        };
        
        this.statisticsSelector.registerChangeHandler(this.statisticsChangeHandler);

        this.updateControlEnabledness();
        var comparisonFunction = this.comparisonSelector.getComparisonFunction();
        this.referenceCumTimes = comparisonFunction(this.ageClassSet);
        this.fastestCumTimes = this.ageClassSet.getFastestCumTimes();
        this.chartData = this.ageClassSet.getChartData(this.referenceCumTimes, this.selection.getSelectedIndexes(), this.chartTypeSelector.getChartType());
        this.redrawChart();
    };

    /**
    * Redraws the chart using all of the current data.
    */ 
    Viewer.prototype.redrawChart = function () {
        var data = {
            chartData: this.chartData,
            eventData: this.eventData,
            ageClassSet: this.ageClassSet,
            referenceCumTimes: this.referenceCumTimes,
            fastestCumTimes: this.fastestCumTimes
        };
            
        this.chart.drawChart(data, this.selection.getSelectedIndexes(), this.currentVisibleStatistics, this.chartTypeSelector.getChartType());
    };
    
    /**
    * Redraw the chart, possibly using new data.
    */
    Viewer.prototype.redraw = function () {
        var chartType = this.chartTypeSelector.getChartType();
        if (!chartType.isResultsTable) {
            this.chartData = this.ageClassSet.getChartData(this.referenceCumTimes, this.selection.getSelectedIndexes(), chartType);
            this.redrawChart();
        }
    };
    
    /**
    * Sets the currently-selected classes in various objects that need it:
    * current age-class set, comparison selector and results table.
    * @param {Array} classIndexes - Array of selected class indexes.    
    */
    Viewer.prototype.setClasses = function (classIndexes) {
        this.currentClasses = classIndexes.map(function (index) { return this.classes[index]; }, this);
        this.ageClassSet = new AgeClassSet(this.currentClasses);
        this.comparisonSelector.setAgeClassSet(this.ageClassSet);
        this.resultsTable.setClass(this.currentClasses[0]);    
        this.enableOrDisableRaceGraph();
        this.originalDataSelector.setVisible(this.ageClassSet.hasDubiousData());
    };
    
    /**
    * Initialises the viewer with the given initial classes.
    * @param {Array} classIndexes - Array of selected class indexes.
    */ 
    Viewer.prototype.initClasses = function (classIndexes) {
        this.classSelector.selectClasses(classIndexes);
        this.setClasses(classIndexes);
        this.selection = new CompetitorSelection(this.ageClassSet.allCompetitors.length);
        this.competitorListBox.setSelection(this.selection);
        this.previousCompetitorList = this.ageClassSet.allCompetitors;
    };
    
    /**
    * Change the graph to show the classes with the given indexes.
    * @param {Number} classIndexes - The (zero-based) indexes of the classes.
    */
    Viewer.prototype.selectClasses = function (classIndexes) {
    
        if (classIndexes.length > 0 && this.currentClasses.length > 0 && this.classes[classIndexes[0]] === this.currentClasses[0]) {
            // The 'primary' class hasn't changed, only the 'other' ones.
            // In this case we don't clear the selection.
        } else {
            this.selection.selectNone();
        }
        
        this.setClasses(classIndexes);
        this.selection.migrate(this.previousCompetitorList, this.ageClassSet.allCompetitors);
        this.drawChart();
        this.previousCompetitorList = this.ageClassSet.allCompetitors;
        this.updateDirectLink();
    };
    
    /**
    * Change the graph to compare against a different reference.
    */
    Viewer.prototype.selectComparison = function () {
        this.drawChart();
        this.updateDirectLink();
    };
    
    /**
    * Change the type of chart shown.
    * @param {Object} chartType - The type of chart to draw.
    */
    Viewer.prototype.selectChartType = function (chartType) {
        if (chartType.isResultsTable) {
            this.mainPanel.style("display", "none");
            
            // Remove any fixed width and height on the body, as we need the
            // window to be able to scroll if the results table is too wide or
            // too tall and also adjust size if one or both scrollbars appear.
            d3.select("body").style("width", null).style("height", null);
            
            this.resultsTable.show();
        } else {
            this.resultsTable.hide();
            this.mainPanel.style("display", null);
        }
        
        this.updateControlEnabledness();
        
        this.crossingRunnersButton.style("display", (chartType.isRaceGraph) ? null : "none");
    };
    
    /**
    * Change the type of chart shown.
    * @param {Object} chartType - The type of chart to draw.
    */
    Viewer.prototype.selectChartTypeAndRedraw = function (chartType) {
        this.selectChartType(chartType);
        this.drawChart();
        this.updateDirectLink();
    };
    
    /**
    * Selects original or repaired data, doing any recalculation necessary.
    * @param {boolean} showOriginalData - True to show original data, false to
    *     show repaired data.
    */
    Viewer.prototype.selectOriginalOrRepairedData = function (showOriginalData) {
        if (showOriginalData) {
            transferCompetitorData(this.eventData);
        } else {
            repairEventData(this.eventData);
        }
        
        this.eventData.determineTimeLosses();
    };
    
    /**
    * Shows original or repaired data.
    * @param {boolean} showOriginalData - True to show original data, false to
    *     show repaired data.
    */
    Viewer.prototype.showOriginalOrRepairedData = function (showOriginalData) {
        this.selectOriginalOrRepairedData(showOriginalData);
        this.drawChart();
        this.updateDirectLink();
    };
    
    /**
    * Updates whether a number of controls are enabled.
    */
    Viewer.prototype.updateControlEnabledness = function () {
        var chartType = this.chartTypeSelector.getChartType();
        this.classSelector.setOtherClassesEnabled(!chartType.isResultsTable);
        this.comparisonSelector.setEnabled(!chartType.isResultsTable);
        this.statisticsSelector.setEnabled(!chartType.isResultsTable);
        this.originalDataSelector.setEnabled(!chartType.isResultsTable);
        this.enableOrDisableCrossingRunnersButton();
    };
    
    /**
    * Enables or disables the crossing-runners button as appropriate.
    */
    Viewer.prototype.enableOrDisableCrossingRunnersButton = function () {
        enableControl(this.crossingRunnersButton, this.selection.isSingleRunnerSelected());
    };
    
    /**
    * Updates the state of the viewer to reflect query-string arguments parsed.
    * @param {Object} parsedQueryString - Parsed query-string object.
    */
    Viewer.prototype.updateFromQueryString = function (parsedQueryString) {
        if (parsedQueryString.classes === null) {
            this.initClasses([0]);
        } else {
            this.initClasses(parsedQueryString.classes);
        }
        
        if (parsedQueryString.chartType !== null) {
            this.chartTypeSelector.setChartType(parsedQueryString.chartType);
            this.selectChartType(parsedQueryString.chartType);
        }
        
        if (parsedQueryString.compareWith !== null) {
            this.comparisonSelector.setComparisonType(parsedQueryString.compareWith.index, parsedQueryString.compareWith.runner);
        }
        
        if (parsedQueryString.selected !== null) {
            this.selection.setSelectedIndexes(parsedQueryString.selected);
        }
        
        if (parsedQueryString.stats !== null) {
            this.statisticsSelector.setVisibleStatistics(parsedQueryString.stats);
        }
        
        if (parsedQueryString.showOriginal && this.ageClassSet.hasDubiousData()) {
            this.originalDataSelector.selectOriginalData();
            this.selectOriginalOrRepairedData(true);
        }
    };
    
    /**
    * Sets the default selected class.
    */
    Viewer.prototype.setDefaultSelectedClass = function () {
        this.initClasses([0]);
    };
    
    SplitsBrowser.Viewer = Viewer;

    /**
    * Shows a message that appears if SplitsBrowser is unable to load event
    * data.
    * @param {String} key - The key of the message to show.
    * @param {Object} params - Object mapping parameter names to values.
    */
    function showLoadFailureMessage(key, params) {
        d3.select("body")
          .append("h1")
          .text(getMessage("LoadFailedHeader"));
          
        d3.select("body")
          .append("p")
          .text(getMessageWithFormatting(key, params));
    }
    
    /**
    * Reads in the data in the given string and starts SplitsBrowser.
    * @param {String} data - String containing the data to read.
    * @param {Object|String|HTMLElement|undefined} options - Optional object
    *     containing various options to SplitsBrowser.  It can also be used for
    *     an HTML element that forms a 'banner' across the top of the page.
    *     This element can be specified by a CSS selector for the element, or
    *     the HTML element itself, although this behaviour is deprecated.
    */
    SplitsBrowser.readEvent = function (data, options) {
        var eventData;
        try {
            eventData = parseEventData(data);
        } catch (e) {
            if (e.name === "InvalidData") {
                showLoadFailureMessage("LoadFailedInvalidData", {"$$MESSAGE$$": e.message});
                return;
            } else {
                throw e;
            }
        }
        
        if (eventData === null) {
            showLoadFailureMessage("LoadFailedUnrecognisedData", {});
        } else {
            if (eventData.needsRepair()) {
                repairEventData(eventData);
            }
            
            if (typeof options === "string") {
                // Deprecated; support the top-bar specified only as a
                // string.
                options = {topBar: options};
            }
            
            eventData.determineTimeLosses();
            
            var viewer = new Viewer(options);
            viewer.buildUi();
            viewer.setEvent(eventData);
            
            var queryString = document.location.search;
            if (queryString !== null && queryString.length > 0) {
                var parsedQueryString = parseQueryString(queryString, eventData);
                viewer.updateFromQueryString(parsedQueryString);
            } else {
                viewer.setDefaultSelectedClass();
            }

            viewer.drawChart();
            viewer.registerChangeHandlers();
        }
    };
    
    /**
    * Handles an asynchronous callback that fetched event data, by parsing the
    * data and starting SplitsBrowser.
    * @param {String} data - The data returned from the AJAX request.
    * @param {String} status - The status of the request.
    * @param {Object|String|HTMLElement|undefined} options - Optional object
    *     containing various options to SplitsBrowser.  It can also be used for
    *     an HTML element that forms a 'banner' across the top of the page.
    *     This element can be specified by a CSS selector for the element, or
    *     the HTML element itself, although this behaviour is deprecated.
    */
    function readEventData(data, status, options) {
        if (status === "success") {
            SplitsBrowser.readEvent(data, options);
        } else {
            showLoadFailureMessage("LoadFailedStatusNotSuccess", {"$$STATUS$$": status});
        }
    }
    
    /**
    * Handles the failure to read an event.
    * @param {jQuery.jqXHR} jqXHR - jQuery jqXHR object.
    * @param {String} textStatus - The text status of the request.
    * @param {String} errorThrown - The error message returned from the server.
    */
    function readEventDataError(jqXHR, textStatus, errorThrown) {
        showLoadFailureMessage("LoadFailedReadError", {"$$ERROR$$": errorThrown});
    }

    /**
    * Loads the event data in the given URL and starts SplitsBrowser.
    * @param {String} eventUrl - The URL that points to the event data to load.
    * @param {Object|String|HTMLElement|undefined} options - Optional object
    *     containing various options to SplitsBrowser.  It can also be used for
    *     an HTML element that forms a 'banner' across the top of the page.
    *     This element can be specified by a CSS selector for the element, or
    *     the HTML element itself, although this behaviour is deprecated.
    */
    SplitsBrowser.loadEvent = function (eventUrl, options) {
        $.ajax({
            url: eventUrl,
            data: "",
            success: function (data, status) { readEventData(data, status, options); },
            dataType: "text",
            error: readEventDataError
        });
    };    
})();
