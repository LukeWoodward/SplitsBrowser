/*!
 *  SplitsBrowser - Orienteering results analysis.
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

﻿/*
 *  SplitsBrowser Core - Namespaces the rest of the program depends on.
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

// Tell ESLint not to complain that this is redeclaring a constant.
/* eslint no-redeclare: "off", no-unused-vars: "off" */
var SplitsBrowser = { Version: "3.5.0", Model: {}, Input: {}, Controls: {}, Messages: {} };

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

﻿/*
 *  SplitsBrowser Messages - Fetches internationalised message strings.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
(function () {
    "use strict";

    var hasProperty = SplitsBrowser.hasProperty;

    // Whether a warning about missing messages has been given.  We don't
    // really want to irritate the user with many alert boxes if there's a
    // problem with the messages.
    var warnedAboutMessages = false;

    // Default alerter function, just calls window.alert.
    var alertFunc = function (message) { window.alert(message); };

    // The currently-chosen language, or null if none chosen or found yet.
    var currentLanguage = null;

    // The list of all languages read in, or null if none.
    var allLanguages = null;

    // The messages object.
    var messages = SplitsBrowser.Messages;

    /**
    * Issue a warning about the messages, if a warning hasn't already been
    * issued.
    * @param {String} warning The warning message to issue.
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

    * @param {Function} alerter The function to be called when a warning is
    *     to be shown.
    */
    SplitsBrowser.setMessageAlerter = function (alerter) {
        alertFunc = alerter;
    };

    /**
    * Attempts to get a message, returning a default string if it does not
    * exist.
    * @param {String} key The key of the message.
    * @param {String} defaultValue Value to be used
    * @return {String} The message with the given key, if the key exists,
    *     otherwise the default value.
    */
    SplitsBrowser.tryGetMessage = function (key, defaultValue) {
        return (currentLanguage !== null && hasProperty(messages[currentLanguage], key)) ? SplitsBrowser.getMessage(key) : defaultValue;
    };

    /**
    * Returns the message with the given key.
    * @param {String} key The key of the message.
    * @return {String} The message with the given key, or a placeholder string
    *     if the message could not be looked up.
    */
    SplitsBrowser.getMessage = function (key) {
        if (allLanguages === null) {
            SplitsBrowser.initialiseMessages();
        }

        if (currentLanguage !== null) {
            if (hasProperty(messages[currentLanguage], key)) {
                return messages[currentLanguage][key];
            } else {
                warn("Message not found for key '" + key + "' in language '" + currentLanguage + "'");
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
    * @param {String} key The key of the message.
    * @param {Object} params Object mapping parameter names to values.
    * @return {String} The resulting message.
    */
    SplitsBrowser.getMessageWithFormatting = function (key, params) {
        var message = SplitsBrowser.getMessage(key);
        for (var paramName in params) {
            if (hasProperty(params, paramName)) {
                // Irritatingly there isn't a way of doing global replace
                // without using regexps.  So we must escape any magic regex
                // metacharacters first, so that we have a regexp that will
                // match a single static string.
                var paramNameRegexEscaped = paramName.replace(/([.+*?|{}()^$[\]\\])/g, "\\$1");
                message = message.replace(new RegExp(paramNameRegexEscaped, "g"), params[paramName]);
            }
        }

        return message;
    };

    /**
    * Returns an array of codes of languages that have been loaded.
    * @return {Array} Array of language codes.
    */
    SplitsBrowser.getAllLanguages = function () {
        return allLanguages.slice(0);
    };

    /**
    * Returns the language code of the current language, e.g. "en_gb".
    * @return {String} Language code of the current language.
    */
    SplitsBrowser.getLanguage = function () {
        return currentLanguage;
    };

    /**
    * Returns the name of the language with the given code.
    * @param {String} language The code of the language, e.g. "en_gb".
    * @return {String} The name of the language, e.g. "English".
    */
    SplitsBrowser.getLanguageName = function (language) {
        if (hasProperty(messages, language) && hasProperty(messages[language], "Language")) {
            return messages[language].Language;
        } else {
            return "?????";
        }
    };

    /**
    * Sets the current language.
    * @param {String} language The code of the new language to set.
    */
    SplitsBrowser.setLanguage = function (language) {
        if (hasProperty(messages, language)) {
            currentLanguage = language;
        }
    };

    /**
    * Initialises the messages from those read in.
    *
    * @param {String} defaultLanguage (Optional) The default language to choose.
    */
    SplitsBrowser.initialiseMessages = function (defaultLanguage) {
        allLanguages = [];
        if (messages !== SplitsBrowser.Messages) {
            // SplitsBrowser.Messages has changed since the JS source was
            // loaded and now.  Likely culprit is an old-format language file.
            warn("You appear to have loaded a messages file in the old format.  This file, and all " +
                 "others loaded after it, will not work.\n\nPlease check the messages files.");
        }

        for (var messageKey in messages) {
            if (hasProperty(messages, messageKey)) {
                allLanguages.push(messageKey);
            }
        }

        if (allLanguages.length === 0) {
            warn("No messages files were found.");
        } else if (defaultLanguage && hasProperty(messages, defaultLanguage)) {
            currentLanguage = defaultLanguage;
        } else {
            currentLanguage = allLanguages[0];
        }
    };
})();
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
        if (/^(-?\d+:)?-?\d+:-?\d\d([,.]\d+)?$/.test(time)) {
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
    * @return {Array} The array of adjusted data.
    */
    Result.prototype.getCumTimesAdjustedToReferenceWithStartAdded = function (referenceCumTimes) {
        var adjustedTimes = this.getCumTimesAdjustedToReference(referenceCumTimes);
        var startTime = this.startTime;
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

            if (fastestSplitTimes.some(function (split) { return split === 0; })) {
                // Someone registered a zero split on this course.  In this
                // situation the time losses don't really make sense.
                this.timeLosses = this.splitTimes.map(function () { return NaN; });
            } else if (this.isOKDespiteMissingTimes || this.splitTimes.some(isNaNStrict)) {
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
 *  SplitsBrowser Course-Class Set - A collection of selected course classes.
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

    var isNotNull = SplitsBrowser.isNotNull;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var compareResults = SplitsBrowser.Model.compareResults;

    /**
    * Utility function to merge the lists of all results in a number of
    * classes.  All classes must contain the same number of controls.
    * @param {Array} classes Array of CourseClass objects.
    * @return {Array} Merged array of results.
    */
    function mergeResults(classes) {
        if (classes.length === 0) {
            return [];
        }

        var allResults = [];
        var expectedControlCount = classes[0].numControls;
        classes.forEach(function (courseClass) {
            if (courseClass.numControls !== expectedControlCount) {
                throwInvalidData("Cannot merge classes with " + expectedControlCount + " and " + courseClass.numControls + " controls");
            }

            courseClass.results.forEach(function (result) {
                if (!result.isNonStarter) {
                    allResults.push(result);
                }
            });
        });

        allResults.sort(compareResults);
        return allResults;
    }

    /**
    * Given an array of numbers, return a list of the corresponding ranks of those
    * numbers.
    * @param {Array} sourceData Array of number values.
    * @return {Array} Array of corresponding ranks.
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
    * An object that represents the currently-selected classes.
    * @constructor
    * @param {Array} classes Array of currently-selected classes.
    */
    function CourseClassSet(classes) {
        this.allResults = mergeResults(classes);
        this.classes = classes;
        this.numControls = (classes.length > 0) ? classes[0].numControls : null;
        this.computeRanks();
    }

    /**
    * Returns whether this course-class set is empty, i.e. whether it has no
    * results at all.
    * @return {Boolean} True if the course-class set is empty, false if it is not
    *     empty.
    */
    CourseClassSet.prototype.isEmpty = function () {
        return this.allResults.length === 0;
    };

    /**
    * Returns the course used by all of the classes that make up this set.  If
    * there are no classes, null is returned instead.
    * @return {SplitsBrowser.Model.Course|null} The course used by all classes.
    */
    CourseClassSet.prototype.getCourse = function () {
        return (this.classes.length > 0) ? this.classes[0].course : null;
    };

    /**
    * Returns the name of the 'primary' class, i.e. that that has been
    * chosen in the drop-down list.  If there are no classes, null is returned
    * instead.
    * @return {String|null} Name of the primary class.
    */
    CourseClassSet.prototype.getPrimaryClassName = function () {
        return (this.classes.length > 0) ? this.classes[0].name : null;
    };

    /**
    * Returns the number of classes that this course-class set is made up of.
    * @return {Number} The number of classes that this course-class set is
    *     made up of.
    */
    CourseClassSet.prototype.getNumClasses = function () {
        return this.classes.length;
    };

    /**
    * Returns whether any of the classes within this set have data that
    * SplitsBrowser can identify as dubious.
    * @return {Boolean} True if any of the classes within this set contain
    *     dubious data, false if none of them do.
    */
    CourseClassSet.prototype.hasDubiousData = function () {
        return this.classes.some(function (courseClass) { return courseClass.hasDubiousData; });
    };

    /**
    * Returns whether this course-class set has team data.
    * @return {Boolean} True if all of the classes within this course-class
    *     set contain team data, false otherwise.
    */
    CourseClassSet.prototype.hasTeamData = function () {
        return this.classes.length > 0 && this.classes.every(function (courseClass) { return courseClass.isTeamClass; });
    };

    /**
    * Returns the number of legs in this course-class set, if this
    * course-class set contains team data.  If not, or the number of
    * legs among the classes is inconsistent, null is returned.
    * @return {Number|null} The number of legs in the team class, or null
    *     if this can't be determined.
    */
    CourseClassSet.prototype.getLegCount = function() {
        var legCount = null;
        for (var classIndex = 0; classIndex < this.classes.length; classIndex += 1) {
            if (this.classes[classIndex].isTeamClass) {
                var thisLegCount = this.classes[classIndex].numbersOfControls.length;
                if (legCount === null) {
                    legCount = thisLegCount;
                } else if (legCount !== thisLegCount) {
                    // Inconsistent leg counts?
                    return null;
                }
            } else {
                return null;
            }
        }

        return legCount;
    };

    /**
    * Return a list of objects that describe when the given array of times has
    * null or NaN values.  This does not include trailing null or NaN values.
    * @param {Array} times Array of times, which may include NaNs and nulls.
    * @param {Boolean} includeEnd Whether to include a blank range that ends
    *    at the end of the array.
    * @return {Array} Array of objects that describes when the given array has
    *    ranges of null and/or NaN values.
    */
    function getBlankRanges(times, includeEnd) {
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

                if (endIndex + 1 < times.length || includeEnd) {
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
    * @param {Array} cumTimes Array of cumulative times.
    * @return {Array} Array of cumulative times with NaNs replaced.
    */
    function fillBlankRangesInCumulativeTimes(cumTimes) {
        cumTimes = cumTimes.slice(0);
        var blankRanges = getBlankRanges(cumTimes, false);
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
    * Returns an array of the cumulative times of the winner of the set of
    * classes.
    * @return {Array} Array of the winner's cumulative times.
    */
    CourseClassSet.prototype.getWinnerCumTimes = function () {
        if (this.allResults.length === 0) {
            return null;
        }

        var firstResult = this.allResults[0];
        return (firstResult.completed()) ? fillBlankRangesInCumulativeTimes(firstResult.cumTimes) : null;
    };

    /**
    * Return the imaginary result who recorded the fastest time on each leg of
    * the class.
    * If at least one control has no results recording a time for it, null is
    * returned.  If there are no classes at all, null is returned.
    * @return {Array|null} Cumulative splits of the imaginary result with fastest
    *           time, if any.
    */
    CourseClassSet.prototype.getFastestCumTimes = function () {
        return this.getFastestCumTimesPlusPercentage(0);
    };

    /**
    * Return the imaginary result who recorded the fastest time on each leg of
    * the given classes, with a given percentage of their time added.
    * If at least one control has no results recording a time for it, null is
    * is returned.  If there are no classes at all, null is returned.
    * @param {Number} percent The percentage of time to add.
    * @return {Array|null} Cumulative splits of the imaginary result with fastest
    *           time, if any, after adding a percentage.
    */
    CourseClassSet.prototype.getFastestCumTimesPlusPercentage = function (percent) {
        if (this.numControls === null) {
            return null;
        }

        var ratio = 1 + percent / 100;

        var fastestSplits = new Array(this.numControls + 1);
        fastestSplits[0] = 0;

        for (var controlIdx = 1; controlIdx <= this.numControls + 1; controlIdx += 1) {
            var fastestForThisControl = null;
            for (var resultIdx = 0; resultIdx < this.allResults.length; resultIdx += 1) {
                var thisTime = this.allResults[resultIdx].getSplitTimeTo(controlIdx);
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

            // Find the blank-ranges of the fastest times.  Include the end
            // of the range in case there are no cumulative times at the last
            // control but there is to the finish.
            var fastestBlankRanges = getBlankRanges(fastestSplits, true);

            // Find all blank-ranges of results.
            var allResultBlankRanges = [];
            this.allResults.forEach(function (result) {
                var resultBlankRanges = getBlankRanges(result.getAllCumulativeTimes(), false);
                resultBlankRanges.forEach(function (range) {
                    allResultBlankRanges.push({
                        start: range.start,
                        end: range.end,
                        size: range.end - range.start,
                        overallSplit: result.getCumulativeTimeTo(range.end) - result.getCumulativeTimeTo(range.start)
                    });
                });
            });

            // Now, for each blank range of the fastest times, find the
            // size of the smallest result blank range that covers it,
            // and then the fastest split among those results.
            fastestBlankRanges.forEach(function (fastestRange) {
                var coveringResultRanges = allResultBlankRanges.filter(function (compRange) {
                    return compRange.start <= fastestRange.start && fastestRange.end <= compRange.end + 1;
                });

                var minSize = null;
                var minOverallSplit = null;
                coveringResultRanges.forEach(function (coveringRange) {
                    if (minSize === null || coveringRange.size < minSize) {
                        minSize = coveringRange.size;
                        minOverallSplit = null;
                    }

                    if (minOverallSplit === null || coveringRange.overallSplit < minOverallSplit) {
                        minOverallSplit = coveringRange.overallSplit;
                    }
                });

                // Assume that the fastest result across the range had equal
                // splits for all controls on the range.  This won't always
                // make sense but it's the best we can do.
                if (minSize !== null && minOverallSplit !== null) {
                    for (var index = fastestRange.start + 1; index < fastestRange.end; index += 1) {
                        fastestSplits[index] = minOverallSplit / minSize;
                    }
                }
            });
        }

        if (!fastestSplits.every(isNotNull)) {
            // Could happen if the results are created from split times and the
            // splits are not complete, and also if nobody punches the final
            // few controls.  Set any remaining missing splits to 3 minutes for
            // intermediate controls and 1 minute for the finish.
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
    * Returns the cumulative times for the result with the given index, with
    * any runs of blanks filled in.
    * @param {Number} resultIndex The index of the result.
    * @return {Array} Array of cumulative times.
    */
    CourseClassSet.prototype.getCumulativeTimesForResult = function (resultIndex) {
        return fillBlankRangesInCumulativeTimes(this.allResults[resultIndex].getAllCumulativeTimes());
    };

    /**
    * Compute the ranks of each result within their class.
    */
    CourseClassSet.prototype.computeRanks = function () {
        if (this.allResults.length === 0) {
            // Nothing to compute.
            return;
        }

        var splitRanksByResult = [];
        var cumRanksByResult = [];

        // Begin with null ranks for the start.
        this.allResults.forEach(function () {
            splitRanksByResult.push([null]);
            cumRanksByResult.push([null]);
        });

        d3.range(1, this.numControls + 2).forEach(function (control) {
            var splitsByResult = this.allResults.map(function(result) { return result.getSplitTimeTo(control); });
            var splitRanksForThisControl = getRanks(splitsByResult);
            this.allResults.forEach(function (_result, idx) { splitRanksByResult[idx].push(splitRanksForThisControl[idx]); });
        }, this);

        d3.range(1, this.numControls + 2).forEach(function (control) {
            // We want to null out all subsequent cumulative ranks after a
            // result mispunches.
            var cumSplitsByResult = this.allResults.map(function (result, idx) {
                // -1 for previous control.
                if (control > 1 && cumRanksByResult[idx][control - 1] === null && !result.isOKDespiteMissingTimes) {
                    // This result has no cumulative rank for the previous
                    // control, and is not recorded as OK despite missing times,
                    // so either they mispunched it or mispunched a previous one.
                    // Give them a null time here, so that they end up with
                    // another null cumulative rank.
                    return null;
                } else {
                    return result.getCumulativeTimeTo(control);
                }
            });
            var cumRanksForThisControl = getRanks(cumSplitsByResult);
            this.allResults.forEach(function (_res, idx) { cumRanksByResult[idx].push(cumRanksForThisControl[idx]); });
        }, this);

        this.allResults.forEach(function (result, idx) {
            result.setSplitAndCumulativeRanks(splitRanksByResult[idx], cumRanksByResult[idx]);
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
    * @param {Number} numSplits Maximum number of split times to return.
    * @param {Number} controlIdx Index of the control.
    * @param {Number|null} selectedLegIndex The index of the selected leg, or null
    *       to not filter by selected leg.
    * @return {Array} Array of the fastest splits to the given control.
    */
    CourseClassSet.prototype.getFastestSplitsTo = function (numSplits, controlIdx, selectedLegIndex) {
        if (typeof numSplits !== "number" || numSplits <= 0) {
            throwInvalidData("The number of splits must be a positive integer");
        } else if (typeof controlIdx !== "number" || controlIdx <= 0 || controlIdx > this.numControls + 1) {
            throwInvalidData("Control " + controlIdx + " out of range");
        } else {
            // Compare results by split time at this control, and, if those are
            // equal, total time.
            var comparator = function (resultA, resultB) {
                var resultASplit = resultA.getSplitTimeTo(controlIdx);
                var resultBSplit = resultB.getSplitTimeTo(controlIdx);
                return (resultASplit === resultBSplit) ? d3.ascending(resultA.totalTime, resultB.totalTime) : d3.ascending(resultASplit, resultBSplit);
            };

            var results = this.allResults.filter(function (result) { return result.completed() && !isNaNStrict(result.getSplitTimeTo(controlIdx)); });
            results.sort(comparator);
            var fastestSplits = [];
            for (var i = 0; i < results.length && i < numSplits; i += 1) {
                fastestSplits.push({name: results[i].getOwnerNameForLeg(selectedLegIndex), split: results[i].getSplitTimeTo(controlIdx)});
            }

            return fastestSplits;
        }
    };

    /**
    * Returns the relevant data for a single leg if necessary.
    * @param {Array} data Array of data to slice.
    * @param {Number} legIndex The selected leg index, or null for all results.
    * @return {Array} The relevant section of the given data array for the leg.
    */
    CourseClassSet.prototype.sliceForLegIndex = function (data, legIndex) {
        if (this.hasTeamData() && legIndex !== null) {
            var numControls = this.classes[0].numbersOfControls[legIndex] + 2;
            var offset = this.classes[0].offsets[legIndex];
            return data.slice(offset, offset + numControls);
        } else {
            return data.slice(0);
        }
    };

    /**
    * Return data from the current classes in a form suitable for plotting in a chart.
    * @param {Array} referenceCumTimes 'Reference' cumulative time data, such
    *            as that of the winner, or the fastest time.
    * @param {Array} currentIndexes Array of indexes that indicate which
    *           results from the overall list are plotted.
    * @param {Object} chartType The type of chart to draw.
    * @param {Number|null} legIndex The index of the selected leg, or null for all legs.
    * @return {Object} Array of data.
    */
    CourseClassSet.prototype.getChartData = function (referenceCumTimes, currentIndexes, chartType, legIndex) {
        if (typeof referenceCumTimes === "undefined") {
            throw new TypeError("referenceCumTimes undefined or missing");
        } else if (typeof currentIndexes === "undefined") {
            throw new TypeError("currentIndexes undefined or missing");
        } else if (typeof chartType === "undefined") {
            throw new TypeError("chartType undefined or missing");
        } else if (typeof legIndex === "undefined") {
            throw new TypeError("legIndex undefined or missing");
        }

        var resultData = this.allResults.map(function (result) { return chartType.dataSelector(result, referenceCumTimes); });
        var selectedResultData = currentIndexes.map(function (index) { return resultData[index]; });

        var numControls;
        if (this.hasTeamData() && legIndex !== null) {
            selectedResultData = selectedResultData.map(function (data) { return this.sliceForLegIndex(data, legIndex); }, this);
            numControls = this.classes[0].numbersOfControls[legIndex];
            referenceCumTimes = this.sliceForLegIndex(referenceCumTimes, legIndex);
        } else {
            numControls = this.numControls;
        }

        var xMin = d3.min(referenceCumTimes);
        var xMax = d3.max(referenceCumTimes);
        var yMin;
        var yMax;
        if (currentIndexes.length === 0) {
            // No results selected.
            if (this.isEmpty()) {
                // No results at all.  Make up some values.
                yMin = 0;
                yMax = 60;
            } else {
                // Set yMin and yMax to the boundary values of the first result.
                var firstResultTimes = resultData[0];
                yMin = d3.min(firstResultTimes);
                yMax = d3.max(firstResultTimes);
            }
        } else {
            yMin = d3.min(selectedResultData.map(function (values) { return d3.min(values); }));
            yMax = d3.max(selectedResultData.map(function (values) { return d3.max(values); }));
        }

        if (Math.abs(yMax - yMin) < 1e-8) {
            // yMin and yMax will be used to scale a y-axis, so we'd better
            // make sure that they're not equal, optionally give-or-take some
            // floating-point noise.
            yMax = yMin + 1;
        }

        var offset = (this.hasTeamData() && legIndex !== null) ? this.classes[0].offsets[legIndex] : 0;
        var dubiousTimesInfo = currentIndexes.map(function (resultIndex) {
            var indexPairs = chartType.indexesAroundOmittedTimesFunc(this.allResults[resultIndex]);
            return indexPairs.filter(function (indexPair) { return indexPair.start >= offset && indexPair.end <= offset + numControls + 2; })
                             .map(function (indexPair) { return { start: indexPair.start - offset, end: indexPair.end - offset }; });
        }, this);

        var cumulativeTimesByControl = d3.transpose(selectedResultData);
        var xData = referenceCumTimes;
        var zippedData = d3.zip(xData, cumulativeTimesByControl);
        var resultNames = currentIndexes.map(function (index) { return this.allResults[index].getOwnerNameForLeg(legIndex); }, this);
        return {
            dataColumns: zippedData.map(function (data) { return { x: data[0], ys: data[1] }; }),
            resultNames: resultNames,
            numControls: numControls,
            xExtent: [xMin, xMax],
            yExtent: [yMin, yMax],
            dubiousTimesInfo: dubiousTimesInfo
        };
    };

    SplitsBrowser.Model.CourseClassSet = CourseClassSet;
})();
/*
 *  SplitsBrowser Course - A single course at an event.
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

    var START = Course.START;
    var FINISH = Course.FINISH;

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
            var legStr = ((startCode === START) ? "start" : startCode) + " to " + ((endCode === FINISH) ? "end" : endCode);
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
/*
 *  SplitsBrowser Chart Types - Defines the types of charts that can be plotted.
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

    /**
    * Converts a number of seconds into the corresponding number of minutes.
    * This conversion is as simple as dividing by 60.
    * @param {Number|null} seconds The number of seconds to convert.
    * @return {Number|null} The corresponding number of minutes.
    */
    function secondsToMinutes(seconds) {
        return (seconds === null) ? null : seconds / 60;
    }

    /**
    * Returns indexes around the given competitor's omitted cumulative times.
    * @param {Result} result The result to get the indexes for.
    * @return {Array} Array of objects containing indexes around omitted
    *     cumulative times.
    */
    function getIndexesAroundOmittedCumulativeTimes(result) {
        return result.getControlIndexesAroundOmittedCumulativeTimes();
    }

    /**
    * Returns indexes around the given competitor's omitted split times.
    * @param {Result} result The result to get the indexes for.
    * @return {Array} Array of objects containing indexes around omitted split
    *     times.
    */
    function getIndexesAroundOmittedSplitTimes(result) {
        return result.getControlIndexesAroundOmittedSplitTimes();
    }

    SplitsBrowser.Model.ChartTypes = {
        SplitsGraph: {
            nameKey: "SplitsGraphChartType",
            dataSelector: function (result, referenceCumTimes) { return result.getCumTimesAdjustedToReference(referenceCumTimes).map(secondsToMinutes); },
            yAxisLabelKey: "SplitsGraphYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumulativeTimes
        },
        RaceGraph: {
            nameKey: "RaceGraphChartType",
            dataSelector: function (result, referenceCumTimes) { return result.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes).map(secondsToMinutes); },
            yAxisLabelKey: "RaceGraphYAxisLabel",
            isRaceGraph: true,
            isResultsTable: false,
            minViewableControl: 0,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumulativeTimes
        },
        PositionAfterLeg: {
            nameKey:  "PositionAfterLegChartType",
            dataSelector: function (result) { return result.cumRanks; },
            yAxisLabelKey: "PositionYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumulativeTimes
        },
        SplitPosition: {
            nameKey: "SplitPositionChartType",
            dataSelector: function (result) { return result.splitRanks; },
            yAxisLabelKey: "PositionYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedSplitTimes
        },
        PercentBehind: {
            nameKey: "PercentBehindChartType",
            dataSelector: function (result, referenceCumTimes) { return result.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes); },
            yAxisLabelKey: "PercentBehindYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedSplitTimes
        },
        ResultsTable: {
            nameKey: "ResultsTableChartType",
            dataSelector: null,
            yAxisLabelKey: null,
            isRaceGraph: false,
            isResultsTable: true,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: null
        }
    };
})();
﻿/*
 *  SplitsBrowser ResultSelection - The currently-selected results.
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

    var NUMBER_TYPE = typeof 0;

    var throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
    * Represents the currently-selected results, and offers a callback
    * mechanism for when the selection changes.
    * @constructor
    * @param {Number} count The number of results that can be chosen.
    */
    function ResultSelection(count) {
        if (typeof count !== NUMBER_TYPE) {
            throwInvalidData("Result count must be a number");
        } else if (count < 0) {
            throwInvalidData("Result count must be a non-negative number");
        }

        this.count = count;
        this.currentIndexes = [];
        this.changeHandlers = [];
    }

    /**
    * Returns whether the R at the given index is selected.
    * @param {Number} index The index of the result.
    * @return {Boolean} True if the result is selected, false if not.
    */
    ResultSelection.prototype.isSelected = function (index) {
        return this.currentIndexes.indexOf(index) > -1;
    };

    /**
    * Returns whether the selection consists of exactly one result.
    * @return {Boolean} True if precisely one result is selected, false if
    *     either no results, or two or more results, are selected.
    */
    ResultSelection.prototype.isSingleRunnerSelected = function () {
        return this.currentIndexes.length === 1;
    };

    /**
    * Returns the index of the single selected result.
    *
    * If no results, or more than two results, are selected, null is
    * returned
    *
    * @return {Number|null} Index of the single selected result, or null.
    */
    ResultSelection.prototype.getSingleRunnerIndex = function () {
        return (this.isSingleRunnerSelected()) ? this.currentIndexes[0] : null;
    };

    /**
    * Given that a single runner is selected, select also all of the runners
    * that 'cross' this runner and are also marked as visible.
    * @param {Array} resultDetails Array of result details to check within.
    * @param {Number|null} selectedLegIndex The index of the selected leg, or null
    *     to not filter by leg.
    */
    ResultSelection.prototype.selectCrossingRunners = function (resultDetails, selectedLegIndex) {
        if (this.isSingleRunnerSelected()) {
            var refResult = resultDetails[this.currentIndexes[0]].result;

            resultDetails.forEach(function (resultDetails, idx) {
                if (resultDetails.visible && resultDetails.result.crosses(refResult, selectedLegIndex)) {
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
    ResultSelection.prototype.fireChangeHandlers = function () {
        // Call slice(0) to return a copy of the list.
        this.changeHandlers.forEach(function (handler) { handler(this.currentIndexes.slice(0)); }, this);
    };

    /**
    * Select all of the results.
    */
    ResultSelection.prototype.selectAll = function () {
        this.currentIndexes = d3.range(this.count);
        this.fireChangeHandlers();
    };

    /**
    * Select none of the results.
    */
    ResultSelection.prototype.selectNone = function () {
        this.currentIndexes = [];
        this.fireChangeHandlers();
    };

    /**
    * Returns an array of all currently-selected result indexes.
    * @return {Array} Array of selected indexes.
    */
    ResultSelection.prototype.getSelectedIndexes = function () {
        return this.currentIndexes.slice(0);
    };

    /**
    * Set the selected results to those in the given array.
    * @param {Array} selectedIndex Array of indexes of selected results.
    */
    ResultSelection.prototype.setSelectedIndexes = function (selectedIndexes) {
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
    * @param {Function} handler The handler to register.
    */
    ResultSelection.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Unregister a handler from being called when the list of indexes changes.
    *
    * If the handler given was never registered, nothing happens.
    *
    * @param {Function} handler The handler to register.
    */
    ResultSelection.prototype.deregisterChangeHandler = function (handler) {
        var index = this.changeHandlers.indexOf(handler);
        if (index > -1) {
            this.changeHandlers.splice(index, 1);
        }
    };

    /**
    * Toggles whether the result at the given index is selected.
    * @param {Number} index The index of the result.
    */
    ResultSelection.prototype.toggle = function (index) {
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
    * Selects a number of results, firing the change handlers once at the
    * end if any indexes were added.
    * @param {Array} indexes Array of indexes of results to select.
    */
    ResultSelection.prototype.bulkSelect = function (indexes) {
        if (indexes.some(function (index) {
            return (typeof index !== NUMBER_TYPE || index < 0 || index >= this.count);
        }, this)) {
            throwInvalidData("Indexes not all numeric and in range");
        }

        // Remove from the set of indexes given any that are already selected.
        var currentIndexSet = d3.set(this.currentIndexes);
        indexes = indexes.filter(function (index) { return !currentIndexSet.has(index); });

        if (indexes.length > 0) {
            this.currentIndexes = this.currentIndexes.concat(indexes);
            this.currentIndexes.sort(d3.ascending);
            this.fireChangeHandlers();
        }
    };

    /**
    * Deselects a number of results, firing the change handlers once at the
    * end if any indexes were removed.
    * @param {Array} indexes Array of indexes of results to deselect.
    */
    ResultSelection.prototype.bulkDeselect = function (indexes) {
        if (indexes.some(function (index) {
            return (typeof index !== NUMBER_TYPE || index < 0 || index >= this.count);
        }, this)) {
            throwInvalidData("Indexes not all numeric and in range");
        }

        // Remove from the set of indexes given any that are not already selected.
        var currentIndexSet = d3.set(this.currentIndexes);
        var anyRemoved = false;
        for (var i = 0; i < indexes.length; i += 1) {
            if (currentIndexSet.has(indexes[i])) {
                currentIndexSet.remove(indexes[i]);
                anyRemoved = true;
            }
        }

        if (anyRemoved) {
            this.currentIndexes = currentIndexSet.values().map(function (index) { return parseInt(index, 10); });
            this.currentIndexes.sort(d3.ascending);
            this.fireChangeHandlers();
        }
    };

    /**
    * Migrates the selected results from one list to another.
    *
    * After the migration, any results in the old list that were selected
    * and are also in the new results list remain selected.
    *
    * Note that this method does NOT fire change handlers when it runs.  This
    * is typically used during a change of class, when the application may be
    * making other changes.
    *
    * @param {Array} oldResults Array of Result objects for the old
    *      selection.  The length of this must match the current count of
    *      results.
    * @param {Array} newResults Array of Result objects for the new
    *      selection.  This array must not be empty.
    */
    ResultSelection.prototype.migrate = function (oldResults, newResults) {
        if (!$.isArray(oldResults)) {
            throwInvalidData("ResultSelection.migrate: oldResults not an array");
        } else if (!$.isArray(newResults)) {
            throwInvalidData("ResultSelection.migrate: newResults not an array");
        } else if (oldResults.length !== this.count) {
            throwInvalidData("ResultSelection.migrate: oldResults list must have the same length as the current count");
        } else if (newResults.length === 0 && this.currentIndexes.length > 0) {
            throwInvalidData("ResultSelection.migrate: newResults list must not be empty if current list has results selected");
        }

        var selectedResults = this.currentIndexes.map(function (index) { return oldResults[index]; });

        this.count = newResults.length;
        this.currentIndexes = [];
        newResults.forEach(function (result, idx) {
            if (selectedResults.indexOf(result) >= 0) {
                this.currentIndexes.push(idx);
            }
        }, this);
    };

    SplitsBrowser.Model.ResultSelection = ResultSelection;
})();

/*
 *  SplitsBrowser data-repair - Attempt to work around nonsensical data.
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

    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var throwInvalidData = SplitsBrowser.throwInvalidData;

    // Maximum number of minutes added to finish splits to ensure that all
    // results have sensible finish splits.
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
    * @param {Array} cumTimes Array of cumulative times.
    * @return {Object|null} Object containing indexes of non-ascending entries, or
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
    * @param {Array} cumTimes Array of cumulative times.
    */
    Repairer.prototype.removeCumulativeTimesEqualToPrevious = function (cumTimes) {
        var lastCumTime = cumTimes[0];
        for (var index = 1; index + 1 < cumTimes.length; index += 1) {
            if (cumTimes[index] !== null) {
                if (cumTimes[index] === lastCumTime) {
                    cumTimes[index] = NaN;
                    this.madeAnyChanges = true;
                } else {
                    lastCumTime = cumTimes[index];
                }
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
    * @param {Array} cumTimes Array of cumulative times.
    * @return {Array} Array of cumulaive times with perhaps some cumulative
    *     times taken out.
    */
    Repairer.prototype.removeCumulativeTimesCausingNegativeSplits = function (cumTimes) {

        var nonAscIndexes = getFirstNonAscendingIndexes(cumTimes);
        while (nonAscIndexes !== null && nonAscIndexes.second + 1 < cumTimes.length) {

            // So, we have a pair of cumulative times that are not in strict
            // ascending order, with the second one not being the finish.  If
            // the second time is not the finish cumulative time for a
            // completing result, try the following in order until we get a
            // list of cumulative times in ascending order:
            // * Remove the second cumulative time,
            // * Remove the first cumulative time.
            // If one of these allows us to push the next non-ascending indexes
            // beyond the second, remove the offending time and keep going.  By
            // 'remove' we mean 'replace with NaN'.
            //
            // We don't want to remove the finish time for a result as that
            // removes their total time as well.  If the result didn't
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
    * Removes the finish cumulative time from a result if it is absurd.
    *
    * It is absurd if it is less than the time at the previous control by at
    * least the maximum amount of time that can be added to finish splits.
    *
    * @param {Array} cumTimes The cumulative times to perhaps remove the
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
    * Attempts to repair the cumulative times within a result.  The repaired
    * cumulative times are written back into the result.
    *
    * @param {Result} result Result whose cumulative times we wish to repair.
    */
    Repairer.prototype.repairResult = function (result) {
        var cumTimes = result.originalCumTimes.slice(0);

        this.removeCumulativeTimesEqualToPrevious(cumTimes);

        cumTimes = this.removeCumulativeTimesCausingNegativeSplits(cumTimes);

        if (!result.completed()) {
            this.removeFinishTimeIfAbsurd(cumTimes);
        }

        result.setRepairedCumulativeTimes(cumTimes);
    };

    /**
    * Attempt to repair all of the data within a course-class.
    * @param {CourseClass} courseClass The class whose data we wish to
    *     repair.
    */
    Repairer.prototype.repairCourseClass = function (courseClass) {
        this.madeAnyChanges = false;
        courseClass.results.forEach(function (result) {
            this.repairResult(result);
        }, this);

        if (this.madeAnyChanges) {
            courseClass.recordHasDubiousData();
        }
    };

    /**
    * Attempt to carry out repairs to the data in an event.
    * @param {Event} eventData The event data to repair.
    */
    Repairer.prototype.repairEventData = function (eventData) {
        eventData.classes.forEach(function (courseClass) {
            this.repairCourseClass(courseClass);
        }, this);
    };

    /**
    * Attempt to carry out repairs to the data in an event.
    * @param {Event} eventData The event data to repair.
    */
    function repairEventData(eventData) {
        var repairer = new Repairer();
        repairer.repairEventData(eventData);
    }

    /**
    * Transfer the 'original' data for each result to the 'final' data.
    *
    * This is used if the input data has been read in a format that requires
    * the data to be checked, but the user has opted not to perform any such
    * reparations and wishes to view the
    * @param {Event} eventData The event data to repair.
    */
    function transferResultData(eventData) {
        eventData.classes.forEach(function (courseClass) {
            courseClass.results.forEach(function (result) {
                result.setRepairedCumulativeTimes(result.getAllOriginalCumulativeTimes());
            });
        });
    }

    SplitsBrowser.DataRepair = {
        repairEventData: repairEventData,
        transferResultData: transferResultData
    };
})();
﻿/*
 *  SplitsBrowser CSV - Reads in CSV result data files.
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
            } else if (!startTimeStr.match(/^\d+:\d\d:\d\d$/)) {
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
        eventData = eventData.replace(/,+\n/g, "\n").replace(/,+$/, "");

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

        var controlCodeRegexp = /^[A-Za-z0-9]+$/;
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
    var HTML_TAG_STRIP_REGEXP = /<[^>]+>/g;
    var DISTANCE_FIND_REGEXP = /([0-9.,]+)\s*(?:Km|km)/;
    var CLIMB_FIND_REGEXP = /(\d+)\s*(?:Cm|Hm|hm|m)/;

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
        return getHtmlStrippedRegexMatches(/<font[^>]*>(.*?)<\/font>/g, text);
    }

    /**
    * Returns the contents of all <td> ... </td> elements within the given
    * text.  The contents of the <td> elements are stripped of all other HTML
    * tags.
    * @param {String} text The HTML string containing the <td> elements.
    * @return {Array} Array of strings of text inside <td> elements.
    */
    function getTableDataBits(text) {
        return getHtmlStrippedRegexMatches(/<td[^>]*>(.*?)<\/td>/g, text).map(function (s) { return s.trim(); });
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
        var matches = getHtmlStrippedRegexMatches(/<th[^>]*>(.*?)<\/th>/g, text);
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
            this.precedingColumnCount = (column1.match(/^\d*$/)) ? 4 : 3;
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
            var firstLineMinusFonts = firstLineUpToLastPreceding.replace(/<font[^>]*>(.*?)<\/font>/g, "");
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
        text = text.replace(/>\n+</g, "><").replace(/><tr>/g, ">\n<tr>").replace(/<\/tr></g, "</tr>\n<")
                   .replace(/><table/g, ">\n<table").replace(/<\/table></g, "</table>\n<");

        // Remove all <col> elements.
        text = text.replace(/<\/col[^>]*>/g, "");

        // Remove all rows that contain only a single non-breaking space.
        // In the file I have, the &nbsp; entities are missing their
        // semicolons.  However, this could well be fixed in the future.
        text = text.replace(/<tr[^>]*><td[^>]*>(?:<nobr>)?&nbsp;?(?:<\/nobr>)?<\/td><\/tr>/g, "");

        // Remove any anchor elements used for navigation...
        text = text.replace(/<a id="[^"]*"><\/a>/g, "");

        // ... and the navigation div.  Use [\s\S] to match everything
        // including newlines - JavaScript regexps have no /s modifier.
        text = text.replace(/<div id="navigation">[\s\S]*?<\/div>/g, "");

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
        text = text.replace(/<tr[^>]*><td colspan=[^>]*>&nbsp;<\/td><\/tr>/g, "");

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
    var controlCodeRegexp = /^[A-Za-z0-9]+$/;


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
            if (!placing.match(/^\d*$/)) {
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

    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
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
        var xml;
        try {
            xml = $.parseXML(xmlString);
        } catch (e) {
            throwInvalidData("XML data not well-formed");
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
    * @param {Array} warnings Array that accumulates warning messages.
    */
    function parseTeamResult(teamResultElement, number, cls, reader, warnings) {
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

            if (warning === null) {
                cls.results.push(teamResult);
            } else {
                warnings.push(warning);
            }
        }
    }

    /**
    * Parses data for a single class.
    * @param {XMLElement} element XML ClassResult element
    * @param {Object} reader XML reader used to assist with format-specific
    *     XML reading.
    * @param {Array} warnings Array to accumulate any warning messages within.
    * @return {Object} Object containing parsed data.
    */
    function parseClassData(element, reader, warnings) {
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
            for (var teamIndex = 0; teamIndex < teamResults.length; teamIndex += 1) {
                parseTeamResult(teamResults[teamIndex], teamIndex + 1, cls, reader, warnings);
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

        // d3 map that maps course IDs plus comma-separated lists of controls
        // to the temporary course with that ID and controls.
        // (We expect that all classes with the same course ID have consistent
        // controls, but we don't assume that.)
        var coursesMap = d3.map();

        var warnings = [];

        classResultElements.forEach(function (classResultElement) {
            var parsedClass = parseClassData(classResultElement, reader, warnings);
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
                parsedClass.controls = null;
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
 *  Copyright (C) 2000-2015 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
﻿/*
 *  SplitsBrowser ResultList - Lists the results down the left side.
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

    // ID of the result list div.
    // Must match that used in styles.css.
    var RESULT_LIST_ID = "resultList";

    // The number that identifies the left mouse button.
    var LEFT_BUTTON = 1;

    // Dummy index used to represent the mouse being let go off the bottom of
    // the list of results.
    var CONTAINER_RESULT_INDEX = -1;

    // ID of the container that contains the list and the filter textbox.
    var RESULT_LIST_CONTAINER_ID = "resultListContainer";

    // Prefix showing which runner in a tooltip is currently shown.
    var SELECTED_RUNNER_TOOLTIP_PREFIX = "> ";

    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    /**
    * Object that controls a list of results from which the user can select.
    * @constructor
    * @param {HTMLElement} parent Parent element to add this list to.
    * @param {Function} alerter Function to call to issue an alert message.
    */
    var ResultList = function (parent, alerter) {
        this.parent = parent;
        this.alerter = alerter;
        this.handler = null;
        this.resultSelection = null;
        this.lastFilterString = "";
        this.allResults = [];
        this.allResultDetails = [];
        this.dragging = false;
        this.dragStartResultIndex = null;
        this.currentDragResultIndex = null;
        this.allResultDivs = [];
        this.inverted = false;
        this.hasTeamData = false;
        this.selectedLegIndex = null;
        this.placeholderDiv = null;

        this.changeHandlers = [];

        this.containerDiv = d3.select(parent).append("div")
                                             .attr("id", RESULT_LIST_CONTAINER_ID);

        this.buttonsPanel = this.containerDiv.append("div");

        var outerThis = this;
        this.allButton = this.buttonsPanel.append("button")
                                          .attr("id", "selectAllResults")
                                          .style("width", "50%")
                                          .on("click", function () { outerThis.selectAllFiltered(); });

        this.noneButton = this.buttonsPanel.append("button")
                                           .attr("id", "selectNoResults")
                                           .style("width", "50%")
                                           .on("click", function () { outerThis.selectNoneFiltered(); });

        // Wire up double-click event with jQuery for easier testing.
        $(this.noneButton.node()).dblclick(function () { outerThis.selectNone(); });

        this.buttonsPanel.append("br");

        this.crossingRunnersButton = this.buttonsPanel.append("button")
                                                      .attr("id", "selectCrossingRunners")
                                                      .style("width", "100%")
                                                      .on("click", function () { outerThis.selectCrossingRunners(); })
                                                      .style("display", "none");

        this.filter = this.buttonsPanel.append("input")
                                       .attr("type", "text");

        // Update the filtered list of result on any change to the contents of
        // the filter textbox.  The last two are for the benefit of IE9 which
        // doesn't fire the input event upon text being deleted via selection
        // or the X button at the right.  Instead, we use delayed updates to
        // filter on key-up and mouse-up, which I believe *should* catch every
        // change.  It's not a problem to update the filter too often: if the
        // filter text hasn't changed, nothing happens.
        this.filter.on("input", function () { outerThis.updateFilterIfChanged(); })
                   .on("keyup", function () { outerThis.updateFilterIfChangedDelayed(); })
                   .on("mouseup", function () { outerThis.updateFilterIfChangedDelayed(); });

        this.listDiv = this.containerDiv.append("div")
                                        .attr("id", RESULT_LIST_ID);

        this.listDiv.on("mousedown", function () { outerThis.startDrag(CONTAINER_RESULT_INDEX); })
                    .on("mousemove", function () { outerThis.mouseMove(CONTAINER_RESULT_INDEX); })
                    .on("mouseup", function () { outerThis.stopDrag(); });

        d3.select(document.body).on("mouseup", function () { outerThis.stopDrag(); });

        this.setMessages();
    };

    /**
    * Sets messages within this control, following either its creation or a
    * change of language.
    */
    ResultList.prototype.setMessages = function () {
        this.allButton.text(getMessage("SelectAllCompetitors"));
        this.noneButton.text(getMessage("SelectNoCompetitors"));
        this.crossingRunnersButton.text(getMessage("SelectCrossingRunners"));
        this.filter.attr("placeholder", getMessage("CompetitorListFilter"));
    };

    /**
    * Retranslates this control following a change of language.
    */
    ResultList.prototype.retranslate = function () {
        this.setMessages();
        if (this.placeholderDiv !== null) {
            this.setPlaceholderDivText();
            this.fireChangeHandlers();
        }
    };

    /**
    * Sets the text in the placeholder div shown when the list of results
    * contains only non-starters.
    */
    ResultList.prototype.setPlaceholderDivText = function () {
        this.placeholderDiv.text(getMessage((this.hasTeamData) ? "NoTeamsStarted" : "NoCompetitorsStarted"));
    };

    /**
    * Register a handler to be called whenever the filter text changes.
    *
    * When a change is made, this function will be called, with no arguments.
    *
    * If the handler has already been registered, nothing happens.
    *
    * @param {Function} handler The handler to register.
    */
    ResultList.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Unregister a handler from being called when the filter text changes.
    *
    * If the handler given was never registered, nothing happens.
    *
    * @param {Function} handler The handler to register.
    */
    ResultList.prototype.deregisterChangeHandler = function (handler) {
        var index = this.changeHandlers.indexOf(handler);
        if (index > -1) {
            this.changeHandlers.splice(index, 1);
        }
    };

    /**
    * Fires all of the change handlers currently registered.
    */
    ResultList.prototype.fireChangeHandlers = function () {
        this.changeHandlers.forEach(function (handler) { handler(); }, this);
    };

    /**
    * Returns whether the current mouse event is off the bottom of the list of
    * result divs.
    * @return {Boolean} True if the mouse is below the last visible div, false
    *     if not.
    */
    ResultList.prototype.isMouseOffBottomOfResultList = function () {
        return this.lastVisibleDiv === null || d3.mouse(this.lastVisibleDiv)[1] >= $(this.lastVisibleDiv).height();
    };

    /**
    * Returns the name of the CSS class to apply to result divs currently
    * part of the selection/deselection.
    * @return {String} CSS class name;
    */
    ResultList.prototype.getDragClassName = function () {
        return (this.inverted) ? "dragDeselected" : "dragSelected";
    };

    /**
    * Handles the start of a drag over the list of results.
    * @param {Number} index Index of the result div that the drag started
    *     over, or RESULT_CONTAINER_INDEX if below the list of results.
    */
    ResultList.prototype.startDrag = function (index) {
        if (d3.event.which === LEFT_BUTTON) {
            this.dragStartResultIndex = index;
            this.currentDragResultIndex = index;
            this.allResultDivs = $("div.result");
            var visibleDivs = this.allResultDivs.filter(":visible");
            this.lastVisibleDiv = (visibleDivs.length === 0) ? null : visibleDivs[visibleDivs.length - 1];
            this.inverted = d3.event.shiftKey;
            if (index === CONTAINER_RESULT_INDEX) {
                // Drag not starting on one of the results.
                if (!this.isMouseOffBottomOfResultList()) {
                    // User has started the drag in the scrollbar.  Ignore it.
                    return;
                }
            } else {
                d3.select(this.allResultDivs[index]).classed(this.getDragClassName(), true);
            }

            d3.event.stopPropagation();
            this.dragging = true;
        }
    };

    /**
    * Handles a mouse-move event. by adjust the range of dragged results to
    * include the current index.
    * @param {Number} dragIndex The index to which the drag has now moved.
    */
    ResultList.prototype.mouseMove = function (dragIndex) {
        if (this.dragging) {
            d3.event.stopPropagation();
            if (dragIndex !== this.currentDragResultIndex) {
                var dragClassName = this.getDragClassName();
                d3.selectAll("div.result." + dragClassName).classed(dragClassName, false);

                if (this.dragStartResultIndex === CONTAINER_RESULT_INDEX && dragIndex === CONTAINER_RESULT_INDEX) {
                    // Drag is currently all off the list, so do nothing further.
                    return;
                } else if (dragIndex === CONTAINER_RESULT_INDEX && !this.isMouseOffBottomOfResultList()) {
                    // Drag currently goes onto the div's scrollbar.
                    return;
                }

                var leastIndex, greatestIndex;
                if (this.dragStartResultIndex === CONTAINER_RESULT_INDEX || dragIndex === CONTAINER_RESULT_INDEX) {
                    // One of the ends is off the bottom.
                    leastIndex = this.dragStartResultIndex + dragIndex - CONTAINER_RESULT_INDEX;
                    greatestIndex = this.allResultDivs.length - 1;
                } else {
                    leastIndex = Math.min(this.dragStartResultIndex, dragIndex);
                    greatestIndex  = Math.max(this.dragStartResultIndex, dragIndex);
                }

                var selectedResults = [];
                for (var index = leastIndex; index <= greatestIndex; index += 1) {
                    if (this.allResultDetails[index].visible) {
                        selectedResults.push(this.allResultDivs[index]);
                    }
                }

                d3.selectAll(selectedResults).classed(dragClassName, true);
                this.currentDragResultIndex = dragIndex;
            }
        }
    };

    /**
    * Handles the end of a drag in the result list.
    */
    ResultList.prototype.stopDrag = function () {
        if (!this.dragging) {
            // This handler is wired up to mouseUp on the entire document, in
            // order to cancel the drag if it is let go away from the list.  If
            // we're not dragging then we have a mouse-up after a mouse-down
            // somewhere outside of this result list.  Ignore it.
            return;
        }

        this.dragging = false;

        var selectedResultIndexes = [];
        var dragClassName = this.getDragClassName();
        for (var index = 0; index < this.allResultDivs.length; index += 1) {
            if ($(this.allResultDivs[index]).hasClass(dragClassName)) {
                selectedResultIndexes.push(index);
            }
        }

        d3.selectAll("div.result." + dragClassName).classed(dragClassName, false);

        if (d3.event.currentTarget === document) {
            // Drag ended outside the list.
        } else if (this.currentDragResultIndex === CONTAINER_RESULT_INDEX && !this.isMouseOffBottomOfResultList()) {
            // Drag ended in the scrollbar.
        } else if (selectedResultIndexes.length === 1) {
            // User clicked, or maybe dragged within the same result.
            this.toggleResult(selectedResultIndexes[0]);
        } else if (this.inverted) {
            this.resultSelection.bulkDeselect(selectedResultIndexes);
        } else {
            this.resultSelection.bulkSelect(selectedResultIndexes);
        }

        this.dragStartResultIndex = null;
        this.currentDragResultIndex = null;

        d3.event.stopPropagation();
    };

    /**
    * Returns the width of the list, in pixels.
    * @return {Number} Width of the list.
    */
    ResultList.prototype.width = function () {
        return $(this.containerDiv.node()).width();
    };

    /**
    * Sets the overall height of the result list.
    * @param {Number} height The height of the control, in pixels.
    */
    ResultList.prototype.setHeight = function (height) {
        $(this.listDiv.node()).height(height - $(this.buttonsPanel.node()).height());
    };

    /**
    * Returns all visible indexes.  This is the indexes of all results that
    * have not been excluded by the filters.
    * @return {Array} Array of indexes of visible results.
    */
    ResultList.prototype.getAllVisibleIndexes = function () {
        return d3.range(this.allResultDetails.length).filter(function (index) {
            return this.allResultDetails[index].visible;
        }, this);
    };

    /**
    * Selects all of the result that are matched by the filter.
    */
    ResultList.prototype.selectAllFiltered = function () {
        this.resultSelection.bulkSelect(this.getAllVisibleIndexes());
    };

    /**
    * Selects none of the results that are matched by the filter.
    */
    ResultList.prototype.selectNoneFiltered = function () {
        this.resultSelection.bulkDeselect(this.getAllVisibleIndexes());
    };

    /**
    * Selects none of the results at all.
    */
    ResultList.prototype.selectNone = function () {
        this.resultSelection.selectNone();
    };

    /**
    * Returns whether the result with the given index is selected.
    * @param {Number} index Index of the result within the list.
    * @return {Boolean} True if the result is selected, false if not.
    */
    ResultList.prototype.isSelected = function (index) {
        return this.resultSelection !== null && this.resultSelection.isSelected(index);
    };

    /**
    * Select all of the results that cross the unique selected result.
    */
    ResultList.prototype.selectCrossingRunners = function () {
        this.resultSelection.selectCrossingRunners(this.allResultDetails, this.selectedLegIndex);
        if (this.resultSelection.isSingleRunnerSelected()) {
            // Only a single runner is still selected, so nobody crossed the
            // selected runner.
            var resultName = this.allResults[this.resultSelection.getSingleRunnerIndex()].getOwnerNameForLeg(this.selectedLegIndex);
            var filterInEffect = (this.lastFilterString.length > 0);
            var messageKey = (filterInEffect) ? "RaceGraphNoCrossingRunnersFiltered" : "RaceGraphNoCrossingRunners";
            this.alerter(getMessageWithFormatting(messageKey, {"$$NAME$$": resultName}));
        }
    };

    /**
    * Enables or disables the crossing-runners button as appropriate.
    */
    ResultList.prototype.enableOrDisableCrossingRunnersButton = function () {
        this.crossingRunnersButton.node().disabled = !this.resultSelection.isSingleRunnerSelected();
    };

    /**
    * Sets the chart type, so that the result list knows whether to show or
    * hide the Crossing Runners button.
    * @param {Object} chartType The chart type selected.
    */
    ResultList.prototype.setChartType = function (chartType) {
        this.crossingRunnersButton.style("display", (chartType.isRaceGraph) ? "block" : "none");
    };

    /**
    * Handles a change to the selection of results, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    */
    ResultList.prototype.selectionChanged = function () {
        var outerThis = this;
        this.listDiv.selectAll("div.result")
                    .data(d3.range(this.resultSelection.count))
                    .classed("selected", function (result, index) { return outerThis.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a result.
    * @param {Number} index The index of the result to toggle.
    */
    ResultList.prototype.toggleResult = function (index) {
        this.resultSelection.toggle(index);
    };

    /**
    * 'Normalise' a name or a search string into a common format.
    *
    * This is used before searching: a name matches a search string if the
    * normalised name contains the normalised search string.
    *
    * At present, the normalisations carried out are:
    * * Conversion to lower case
    * * Removing all non-alphanumeric characters.
    *
    * @param {String} name The name to normalise.
    * @return {String} The normalised names.
    */
    function normaliseName(name) {
        return name.toLowerCase().replace(/\W/g, "");
    }

    /**
    * Formats a tooltip for a team.
    * @param {Result} result The result to format the tooltip for
    * @return {String} The formatted tooltip contents.
    */
    ResultList.prototype.formatTooltip = function(result) {
        var names = [result.owner.name];
        result.owner.members.forEach(function (competitor) { names.push(competitor.name); });

        var nameIndex = (this.selectedLegIndex === null) ? 0 : this.selectedLegIndex + 1;
        names[nameIndex] = SELECTED_RUNNER_TOOLTIP_PREFIX + names[nameIndex];
        return names.join("\n");
    };

    /**
    * Sets the list of results.
    * @param {Array} results Array of result data.
    * @param {Boolean} multipleClasses Whether the list of results is
    *      made up from those in multiple classes.
    * @param {Boolean} hasTeamData Whether the list of results shows
    *      team data as opposed to individual data.
    * @param {Number|null} selectedLegIndex The selected leg index, or
    *      null to show the team.
    */
    ResultList.prototype.setResultList = function (results, multipleClasses, hasTeamData, selectedLegIndex) {
        /**
        * Returns the text to show for a result's name.
        * @param {Result} result The result.
        * @return {String} The text to show for a result's name.
        */
        function resultText(result) {
            var name;
            if (hasTeamData && selectedLegIndex !== null) {
                name = result.owner.members[selectedLegIndex].name;
            }
            else {
                name = result.owner.name;
            }

            if (result.completed()) {
                // \u00a0 is a non-breaking space.  We substitute this in place of
                // a blank name to prevent the height of the item being dropped to
                // a few pixels.
                return (name === "") ? "\u00a0" : name;
            }
            else {
                return "* " + name;
            }
        }

        this.allResults = results;
        this.hasTeamData = hasTeamData;
        this.selectedLegIndex = selectedLegIndex;
        this.allResultDetails = this.allResults.map(function (result) {
            return { result: result, normedName: normaliseName(result.owner.name), visible: true };
        });

        var tooltipFunction;
        if (hasTeamData) {
            tooltipFunction = this.formatTooltip.bind(this);
        } else {
            tooltipFunction = function () { return null; };
        }

        if (this.placeholderDiv !== null) {
            this.placeholderDiv.remove();
            this.placeholderDiv = null;
        }

        var resultDivs = this.listDiv.selectAll("div.result").data(this.allResults);

        var outerThis = this;
        resultDivs.enter().append("div")
                          .classed("result", true)
                          .classed("selected", function (result, index) { return outerThis.isSelected(index); });

        resultDivs.selectAll("span").remove();

        resultDivs = this.listDiv.selectAll("div.result")
                                 .data(this.allResults)
                                 .attr("title", tooltipFunction);

        if (multipleClasses) {
            resultDivs.append("span")
                      .classed("resultClassLabel", true)
                      .text(function (result) { return result.className; });
        }

        resultDivs.append("span")
                  .classed("nonfinisher", function (result) { return !result.completed(); })
                  .text(resultText);

        resultDivs.exit().remove();

        if (this.allResults.length === 0) {
            this.placeholderDiv = this.listDiv.append("div")
                                              .classed("resultListPlaceholder", true);
            this.setPlaceholderDivText();
        }

        this.allButton.property("disabled", this.allResults.length === 0);
        this.noneButton.property("disabled", this.allResults.length === 0);
        this.filter.property("disabled", this.allResults.length === 0);

        resultDivs.on("mousedown", function (_datum, index) { outerThis.startDrag(index); })
                  .on("mousemove", function (_datum, index) { outerThis.mouseMove(index); })
                  .on("mouseup", function () { outerThis.stopDrag(); });

        // Force an update on the filtering.
        this.updateFilter();
    };

    /**
    * Sets the result selection object.
    * @param {SplitsBrowser.Controls.ResultSelection} selection Result selection.
    */
    ResultList.prototype.setSelection = function (selection) {
        if (this.resultSelection !== null) {
            this.resultSelection.deregisterChangeHandler(this.handler);
        }

        var outerThis = this;
        this.resultSelection = selection;
        this.handler = function () { outerThis.selectionChanged(); };
        this.resultSelection.registerChangeHandler(this.handler);
        this.selectionChanged();
    };

    /**
    * Returns the filter text currently being used.
    * @return {String} Filter text.
    */
    ResultList.prototype.getFilterText = function () {
        return this.filter.node().value;
    };

    /**
    * Sets the filter text to use.
    * @param {String} filterText The filter text to use.
    */
    ResultList.prototype.setFilterText = function (filterText) {
        this.filter.node().value = filterText;
        this.updateFilterIfChanged();
    };

    /**
    * Updates the filtering.
    */
    ResultList.prototype.updateFilter = function () {
        var currentFilterString = this.filter.node().value;
        var normedFilter = normaliseName(currentFilterString);
        this.allResultDetails.forEach(function (result) {
            result.visible = (result.normedName.indexOf(normedFilter) >= 0);
        });

        var outerThis = this;
        this.listDiv.selectAll("div.result")
                    .style("display", function (div, index) { return (outerThis.allResultDetails[index].visible) ? null : "none"; });
    };

    /**
    * Updates the filtering following a change in the filter text input, if the
    * filter text has changed since last time.  If not, nothing happens.
    */
    ResultList.prototype.updateFilterIfChanged = function () {
        var currentFilterString = this.getFilterText();
        if (currentFilterString !== this.lastFilterString) {
            this.updateFilter();
            this.lastFilterString = currentFilterString;
            this.fireChangeHandlers();
        }
    };

    /**
    * Updates the filtering following a change in the filter text input
    * in a short whiie.
    */
    ResultList.prototype.updateFilterIfChangedDelayed = function () {
        var outerThis = this;
        setTimeout(function () { outerThis.updateFilterIfChanged(); }, 1);
    };

    SplitsBrowser.Controls.ResultList = ResultList;
})();

/*
 *  SplitsBrowser LanguageSelector - Provides a choice of language.
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
(function (){
    "use strict";

    var getMessage = SplitsBrowser.getMessage;
    var getAllLanguages = SplitsBrowser.getAllLanguages;
    var getLanguage = SplitsBrowser.getLanguage;
    var getLanguageName = SplitsBrowser.getLanguageName;
    var setLanguage = SplitsBrowser.setLanguage;

    /**
    * A control that wraps a drop-down list used to choose the language to view.
    * @param {HTMLElement} parent The parent element to add the control to.
    */
    function LanguageSelector(parent) {
        this.changeHandlers = [];
        this.label = null;
        this.dropDown = null;

        this.allLanguages = getAllLanguages();

        if (this.allLanguages.length < 2) {
            // User hasn't loaded multiple languages, so no point doing
            // anything further here.
            return;
        }

        d3.select(parent).append("div")
                         .classed("topRowStartSpacer", true);

        var div = d3.select(parent).append("div")
                                   .classed("topRowStart", true);

        this.label = div.append("span");

        var outerThis = this;
        this.dropDown = div.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onLanguageChanged(); });

        var optionsList = d3.select(this.dropDown).selectAll("option").data(this.allLanguages);
        optionsList.enter().append("option");

        optionsList = d3.select(this.dropDown).selectAll("option").data(this.allLanguages);
        optionsList.attr("value", function (language) { return language; })
                   .text(function (language) { return getLanguageName(language); });

        optionsList.exit().remove();

        this.setLanguage(getLanguage());
        this.setMessages();
    }

    /**
    * Sets the text of various messages in this control, following either its
    * creation or a change of language.
    */
    LanguageSelector.prototype.setMessages = function () {
        this.label.text(getMessage("LanguageSelectorLabel"));
    };

    /**
    * Add a change handler to be called whenever the selected language is changed.
    *
    * The handler function is called with no arguments.
    *
    * @param {Function} handler Handler function to be called whenever the
    *                           language changes.
    */
    LanguageSelector.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Sets the language.  If the language given is not recognised, nothing
    * happens.
    * @param {String} language The language code.
    */
    LanguageSelector.prototype.setLanguage = function (language) {
        var index = this.allLanguages.indexOf(language);
        if (index >= 0) {
            this.dropDown.selectedIndex = index;
            this.onLanguageChanged();
        }
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    LanguageSelector.prototype.onLanguageChanged = function () {
        setLanguage(this.dropDown.options[this.dropDown.selectedIndex].value);
        this.changeHandlers.forEach(function(handler) { handler(); });
    };

    SplitsBrowser.Controls.LanguageSelector = LanguageSelector;
})();

/*
 *  SplitsBrowser ClassSelector - Provides a choice of classes to compare.
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
(function (){
    "use strict";

    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var getMessage = SplitsBrowser.getMessage;

    /**
    * A control that wraps a drop-down list used to choose between classes.
    * @param {HTMLElement} parent The parent element to add the control to.
    */
    function ClassSelector(parent) {
        this.changeHandlers = [];
        this.otherClassesEnabled = true;

        var div = d3.select(parent).append("div")
                                   .classed("topRowStart", true);

        this.labelSpan = div.append("span");

        var outerThis = this;
        this.dropDown = div.append("select").node();
        $(this.dropDown).bind("change", function() {
            outerThis.updateOtherClasses(d3.set());
            outerThis.onSelectionChanged();
        });

        this.otherClassesContainer = d3.select(parent).append("div")
                                                      .attr("id", "otherClassesContainer")
                                                      .classed("topRowStart", true)
                                                      .style("display", "none");

        this.otherClassesCombiningLabel = this.otherClassesContainer.append("span")
                                                                    .classed("otherClassCombining", true);

        this.otherClassesSelector = this.otherClassesContainer.append("div")
                                                              .classed("otherClassSelector", true)
                                                              .style("display", "inline-block");

        this.otherClassesSpan = this.otherClassesSelector.append("span");

        this.otherClassesList = d3.select(parent).append("div")
                                                 .classed("otherClassList", true)
                                                 .classed("transient", true)
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

        this.setMessages();
    }

    /**
    * Sets some messages following either the creation of this control or a
    * change of selected language.
    */
    ClassSelector.prototype.setMessages = function () {
        this.labelSpan.text(getMessage("ClassSelectorLabel"));
        this.otherClassesCombiningLabel.text(getMessage("AdditionalClassSelectorLabel"));
    };

    /**
    * Sets whether the other-classes selector is enabled, if it is shown at
    * all.
    * @param {Boolean} otherClassesEnabled True to enable the selector, false
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
    * @param {Array} classes Array of CourseClass objects containing class
    *     data.
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
                options = classes.map(function(courseClass) { return courseClass.name; });
            }

            var optionsList = d3.select(this.dropDown).selectAll("option").data(options);
            optionsList.enter().append("option");

            optionsList = d3.select(this.dropDown).selectAll("option").data(options);
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
    * @param {Function} handler Handler function to be called whenever the class
    *                   changes.
    */
    ClassSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Sets the selected classes.
    * @param {Array} selectedIndexes Array of indexes of classes.
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
    * @return {Array} Indexes of selected classes.
    */
    ClassSelector.prototype.getSelectedClasses = function () {
        if (this.dropDown.disabled) {
            return [];
        } else {
            var indexes = [this.dropDown.selectedIndex];
            this.selectedOtherClassIndexes.each(function (index) { indexes.push(parseInt(index, 10)); });
            return indexes;
        }
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
    * @param {d3.set} selectedOtherClassIndexes Array of selected other-class indexes.
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

        otherClassesSelection = this.otherClassesList.selectAll("div")
                                                     .data(otherClassIndexes);

        otherClassesSelection.attr("id", function (classIdx) { return "courseClassIdx_" + classIdx; })
                             .classed("selected", function (classIdx) { return selectedOtherClassIndexes.has(classIdx); })
                             .text(function (classIdx) { return outerThis.classes[classIdx].name; });

        otherClassesSelection.exit().remove();

        if (otherClassIndexes.length > 0) {
            this.otherClassesContainer.style("display", null);
        } else {
            this.otherClassesContainer.style("display", "none");
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
    * @param {Number} classIdx Index of the class among the list of all classes.
    */
    ClassSelector.prototype.toggleOtherClass = function (classIdx) {
        if (this.selectedOtherClassIndexes.has(classIdx)) {
            this.selectedOtherClassIndexes.remove(classIdx);
        } else {
            this.selectedOtherClassIndexes.add(classIdx);
        }

        d3.select("div#courseClassIdx_" + classIdx).classed("selected", this.selectedOtherClassIndexes.has(classIdx));
        this.updateOtherClassText();
        this.onSelectionChanged();
    };

    /**
    * Retranslates this control following a change of selected language.
    */
    ClassSelector.prototype.retranslate = function () {
        this.setMessages();
        if (this.classes.length === 0) {
            d3.select(this.dropDown.options[0]).text(getMessage("NoClassesLoadedPlaceholder"));
        }
        if (this.selectedOtherClassIndexes.values().length === 0) {
            this.otherClassesSpan.text(getMessage("NoAdditionalClassesSelectedPlaceholder"));
        }
    };

    SplitsBrowser.Controls.ClassSelector = ClassSelector;
})();

/*
 *  SplitsBrowser ComparisonSelector - Provides a choice of 'reference' results.
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

    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    var ALL_COMPARISON_OPTIONS = [
        {
            nameKey: "CompareWithWinner",
            selector: function (courseClassSet) { return courseClassSet.getWinnerCumTimes(); },
            requiresWinner: true,
            percentage: ""
        },
        {
            nameKey: "CompareWithFastestTime",
            selector: function (courseClassSet) { return courseClassSet.getFastestCumTimes(); },
            requiresWinner: false,
            percentage: ""
        }
    ];

    // All 'Fastest time + N %' values (not including zero).
    var FASTEST_PLUS_PERCENTAGES = [5, 25, 50, 100];

    FASTEST_PLUS_PERCENTAGES.forEach(function (percent) {
        ALL_COMPARISON_OPTIONS.push({
            nameKey: "CompareWithFastestTimePlusPercentage",
            selector: function (courseClassSet) { return courseClassSet.getFastestCumTimesPlusPercentage(percent); },
            requiresWinner: false,
            percentage: percent
        });
    });

    var ALL_INDIVIDUAL_COMPARISON_OPTIONS = ALL_COMPARISON_OPTIONS.slice(0);

    ALL_INDIVIDUAL_COMPARISON_OPTIONS.push({
        nameKey: "CompareWithAnyRunner",
        selector: null,
        requiresWinner: true,
        percentage: ""
    });

    var ALL_TEAM_COMPARISON_OPTIONS = ALL_COMPARISON_OPTIONS.slice(0);

    ALL_TEAM_COMPARISON_OPTIONS.push({
        nameKey: "CompareWithAnyTeam",
        selector: null,
        requiresWinner: true,
        percentage: ""
    });

    // Default selected index of the comparison function.
    var DEFAULT_COMPARISON_INDEX = 1; // 1 = fastest time.

    // The id of the comparison selector.
    var COMPARISON_SELECTOR_ID = "comparisonSelector";

    // The id of the result selector
    var RESULT_SELECTOR_ID = "resultSelector";

    // The id of the 'Runner' or 'Team' text before the selector for a specific
    // runner or team.
    var RESULT_SPAN_ID = "resultSpan";

    /**
    * A control that wraps a drop-down list used to choose what to compare
    * times against.
    * @param {HTMLElement} parent The parent element to add the control to.
    * @param {Function} alerter Function to call with any messages to show to
    *     the user.
    */
    function ComparisonSelector(parent, alerter) {
        this.changeHandlers = [];
        this.classes = null;
        this.currentResultIndex = null;
        this.previousResultList = null;
        this.parent = parent;
        this.alerter = alerter;
        this.hasWinner = false;
        this.previousSelectedIndex = -1;
        this.courseClassSet = null;
        this.selectedLegIndex = null;
        this.comparisonOptions = ALL_INDIVIDUAL_COMPARISON_OPTIONS;

        var div = d3.select(parent).append("div")
                                   .classed("topRowStart", true);

        this.comparisonSelectorLabel = div.append("span")
                                          .classed("comparisonSelectorLabel", true);


        var outerThis = this;
        this.dropDown = div.append("select")
                           .attr("id", COMPARISON_SELECTOR_ID)
                           .node();

        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        this.optionsList = d3.select(this.dropDown).selectAll("option")
                                                   .data(this.comparisonOptions);
        this.optionsList.enter().append("option");

        this.optionsList = d3.select(this.dropDown).selectAll("option")
                                                   .data(this.comparisonOptions);
        this.optionsList.attr("value", function (_opt, index) { return index.toString(); });

        this.optionsList.exit().remove();

        this.resultDiv = d3.select(parent).append("div")
                                          .classed("topRowStart", true)
                                          .style("display", "none")
                                          .style("padding-left", "20px");

        this.resultSpan = this.resultDiv.append("span")
                                        .attr("id", RESULT_SPAN_ID)
                                        .classed("comparisonSelectorLabel", true);

        this.resultDropDown = this.resultDiv.append("select")
                                            .attr("id", RESULT_SELECTOR_ID)
                                            .node();

        $(this.resultDropDown).bind("change", function () { outerThis.onSelectionChanged(); });

        this.dropDown.selectedIndex = DEFAULT_COMPARISON_INDEX;
        this.previousSelectedIndex = DEFAULT_COMPARISON_INDEX;

        this.setMessages();
    }

    /**
    * Sets the messages in this control, following its creation or a change of
    * selected language.
    */
    ComparisonSelector.prototype.setMessages = function () {
        this.comparisonSelectorLabel.text(getMessage("ComparisonSelectorLabel"));
        this.setCompareWithAnyLabel();
        this.optionsList.text(function (opt) { return getMessageWithFormatting(opt.nameKey, {"$$PERCENT$$": opt.percentage}); });
    };

    /**
    * Updates the 'Compare with any' label, following a change of language,
    * course-class set or selected leg index.
    */
    ComparisonSelector.prototype.setCompareWithAnyLabel = function () {
        if (this.courseClassSet !== null && this.courseClassSet.hasTeamData() && this.selectedLegIndex === null) {
            this.resultSpan.text(getMessage("CompareWithAnyTeamLabel"));
        }
        else {
            this.resultSpan.text(getMessage("CompareWithAnyRunnerLabel"));
        }
    };

    /**
    * Add a change handler to be called whenever the selected class is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler Handler function to be called whenever the class
    *                   changes.
    */
    ComparisonSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Returns whether the 'Any Result...' option is selected.
    * @return {Boolean} True if the 'Any Result...' option is selected, false
    *     if any other option is selected.
    */
    ComparisonSelector.prototype.isAnyResultSelected = function () {
        return this.dropDown.selectedIndex === this.comparisonOptions.length - 1;
    };

    /**
    * Sets the course-class set to use.
    * @param {CourseClassSet} courseClassSet The course-class set to set.
    */
    ComparisonSelector.prototype.setCourseClassSet = function (courseClassSet) {
        this.courseClassSet = courseClassSet;
        this.selectedLegIndex = null;
        this.comparisonOptions = (courseClassSet.hasTeamData()) ? ALL_TEAM_COMPARISON_OPTIONS : ALL_INDIVIDUAL_COMPARISON_OPTIONS;
        this.optionsList = d3.select(this.dropDown).selectAll("option")
                                                   .data(this.comparisonOptions);
        this.optionsList.text(function (opt) { return getMessageWithFormatting(opt.nameKey, {"$$PERCENT$$": opt.percentage}); });
        this.setResults();
        this.setCompareWithAnyLabel();
    };

    /**
     * Handles a change of selected leg.
     * @param {Number|null} selectedLegIndex The index of the selected leg.
     */
    ComparisonSelector.prototype.setSelectedLeg = function (selectedLegIndex) {
        this.selectedLegIndex = selectedLegIndex;
        this.setResults();
        this.setCompareWithAnyLabel();
        this.optionsList.data(selectedLegIndex === null ? ALL_TEAM_COMPARISON_OPTIONS : ALL_INDIVIDUAL_COMPARISON_OPTIONS);
        this.optionsList.text(function (opt) { return getMessageWithFormatting(opt.nameKey, {"$$PERCENT$$": opt.percentage}); });
    };

    /**
    * Populates the drop-down list of results from a course-class set.
    */
    ComparisonSelector.prototype.setResults = function () {
        var results = this.courseClassSet.allResults;
        var completingResultIndexes = d3.range(results.length).filter(function (idx) { return results[idx].completed(); });
        var completingResults = results.filter(function (result) { return result.completed(); });

        this.hasWinner = (completingResults.length > 0);
        var selectedLegIndex = this.selectedLegIndex;

        var optionsList = d3.select(this.resultDropDown).selectAll("option")
                                                        .data(completingResults);

        optionsList.enter().append("option");
        optionsList = d3.select(this.resultDropDown).selectAll("option")
                                                    .data(completingResults);
        optionsList.attr("value", function (_res, complResultIndex) { return completingResultIndexes[complResultIndex].toString(); })
                   .text(function (result) { return result.getOwnerNameForLeg(selectedLegIndex); });
        optionsList.exit().remove();

        if (this.previousResultList === null) {
            this.currentResultIndex = 0;
        } else if (this.hasWinner) {
            var oldSelectedResult = this.previousResultList[this.currentResultIndex];
            var newIndex = results.indexOf(oldSelectedResult);
            this.currentResultIndex = Math.max(newIndex, 0);
        } else if (this.comparisonOptions[this.dropDown.selectedIndex].requiresWinner) {
            // We're currently viewing a comparison type that requires a
            // winner.  However, there is no longer a winner, presumably
            // because there was a winner but following the removal of a class
            // there isn't any more.  Switch back to the fastest time.
            this.setComparisonType(1, null);
        }

        this.resultDropDown.selectedIndex = this.currentResultIndex;

        this.previousResultList = results;
    };

    /**
    * Sets whether the control is enabled.
    * @param {Boolean} isEnabled True if the control is enabled, false if
    *      disabled.
    */
    ComparisonSelector.prototype.setEnabled = function (isEnabled) {
        d3.select(this.parent).selectAll("span.comparisonSelectorLabel")
                              .classed("disabled", !isEnabled);

        this.dropDown.disabled = !isEnabled;
        this.resultDropDown.disabled = !isEnabled;
    };

    /**
    * Returns the function that compares a result's splits against some
    * reference data.
    * @return {Function} Comparison function.
    */
    ComparisonSelector.prototype.getComparisonFunction = function () {
        if (this.isAnyResultSelected()) {
            var outerThis = this;
            return function (courseClassSet) { return courseClassSet.getCumulativeTimesForResult(outerThis.currentResultIndex); };
        } else {
            return this.comparisonOptions[this.dropDown.selectedIndex].selector;
        }
    };

    /**
    * Returns the comparison type.
    * @return {Object} Object containing the comparison type (type index and result).
    */
    ComparisonSelector.prototype.getComparisonType = function () {
        var result;
        if (this.isAnyResultSelected()) {
            if (this.resultDropDown.selectedIndex < 0) {
                this.resultDropDown.selectedIndex = 0;
            }

            result = this.courseClassSet.allResults[this.resultDropDown.selectedIndex];
        } else {
            result = null;
        }

        return {index: this.dropDown.selectedIndex, result: result };
    };

    /**
    * Sets the comparison type.
    * @param {Number} typeIndex The index of the comparison type.
    * @param {Result|null} result The selected 'Any result', or null if
    *     'Any Result' has not been selected.
    */
    ComparisonSelector.prototype.setComparisonType = function (typeIndex, result) {
        if (0 <= typeIndex && typeIndex < this.comparisonOptions.length) {
            if (typeIndex === this.comparisonOptions.length - 1) {
                var resultIndex = this.courseClassSet.allResults.indexOf(result);
                if (resultIndex >= 0) {
                    this.dropDown.selectedIndex = typeIndex;
                    this.resultDropDown.selectedIndex = resultIndex;
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
        var resultDropdownSelectedIndex = Math.max(this.resultDropDown.selectedIndex, 0);
        var option = this.comparisonOptions[this.dropDown.selectedIndex];
        if (!this.hasWinner && option.requiresWinner) {
            // No winner on this course means you can't select this option.
            this.alerter(getMessageWithFormatting(
                (this.courseClassSet !== null && this.courseClassSet.hasTeamData()) ? "CannotCompareAsNoWinnerTeam" : "CannotCompareAsNoWinner",
                {"$$OPTION$$": getMessage(option.nameKey)}));
            this.dropDown.selectedIndex = this.previousSelectedIndex;
        } else {
            this.resultDiv.style("display", (this.isAnyResultSelected()) ? null : "none");
            this.currentResultIndex = (this.resultDropDown.options.length === 0) ? 0 : parseInt(this.resultDropDown.options[resultDropdownSelectedIndex].value, 10);
            this.previousSelectedIndex = this.dropDown.selectedIndex;
            this.changeHandlers.forEach(function (handler) { handler(this.getComparisonFunction()); }, this);
        }
    };

    SplitsBrowser.Controls.ComparisonSelector = ComparisonSelector;
})();

/*
 *  SplitsBrowser StatisticsSelector - Provides a choice of the statistics to show.
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
    * @param {HTMLElement} parent The parent element.
    */
    function StatisticsSelector (parent) {
        this.div = d3.select(parent).append("div")
                                     .classed("topRowEnd", true)
                                     .attr("id", STATISTIC_SELECTOR_ID);

        var childDivs = this.div.selectAll("div")
                                .data(STATISTIC_NAMES)
                                .enter()
                                .append("div")
                                .style("display", "inline-block");

        childDivs.append("input")
                 .attr("id", function(name) { return LABEL_ID_PREFIX + name; })
                 .attr("type", "checkbox")
                 .attr("checked", function (name) { return (DEFAULT_SELECTED_STATISTICS.indexOf(name) >= 0) ? "checked" : null; });

        this.statisticLabels  = childDivs.append("label")
                                         .attr("for", function(name) { return LABEL_ID_PREFIX + name; })
                                         .classed("statisticsSelectorLabel", true);


        var outerThis = this;
        $("input", this.div.node()).bind("change", function () { return outerThis.onCheckboxChanged(); });

        this.handlers = [];

        this.setMessages();
    }

    /**
    * Sets the messages in this control, following either its creation or a
    * change of selected language.
    */
    StatisticsSelector.prototype.setMessages = function () {
        this.statisticLabels.text(function (name, index) { return getMessage(STATISTIC_NAME_KEYS[index]); });
    };

    /**
    * Deselects all checkboxes.
    *
    * This method is intended only for test purposes.
    */
    StatisticsSelector.prototype.clearAll = function () {
        this.div.selectAll("input").attr("checked", null);
    };

    /**
    * Sets whether the statistics selector controls are enabled.
    * @param {Boolean} isEnabled True if the controls are to be enabled,
    *      false if the controls are to be disabled.
    */
    StatisticsSelector.prototype.setEnabled = function (isEnabled) {
        this.div.selectAll("label.statisticsSelectorLabel")
                .classed("disabled", !isEnabled);
        this.div.selectAll("input")
                .attr("disabled", (isEnabled) ? null : "disabled");
    };

    /**
    * Register a change handler to be called whenever the choice of currently-
    * visible statistics is changed.
    *
    * If the handler was already registered, nothing happens.
    * @param {Function} handler Function to be called whenever the choice
    *                           changes.
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
    * @param {Function} handler Function to be called whenever the choice
    *                           changes.
    */
    StatisticsSelector.prototype.deregisterChangeHandler = function (handler) {
        var index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    };

    /**
    * Return the statistics that are currently enabled.
    * @return {Object} Object that lists all the statistics and whether they
    *     are enabled.
    */
    StatisticsSelector.prototype.getVisibleStatistics = function () {
        var visibleStats = {};
        this.div.selectAll("input").nodes().forEach(function (checkbox, index) {
            visibleStats[STATISTIC_NAMES[index]] = checkbox.checked;
        });

        return visibleStats;
    };

    /**
    * Sets the visible statistics.
    * @param {Object} visibleStats The statistics to make visible.
    */
    StatisticsSelector.prototype.setVisibleStatistics = function (visibleStats) {
        this.div.selectAll("input").nodes().forEach(function (checkbox, index) {
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

/*
 *  SplitsBrowser ChartTypeSelector - Provides a choice of chart types.
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
(function (){
    "use strict";

    var getMessage = SplitsBrowser.getMessage;

    /**
    * A control that wraps a drop-down list used to choose the types of chart to view.
    * @param {HTMLElement} parent The parent element to add the control to.
    * @param {Array} chartTypes Array of types of chart to list.
    */
    function ChartTypeSelector(parent, chartTypes) {
        this.changeHandlers = [];
        this.chartTypes = chartTypes;
        this.raceGraphDisabledNotifier = null;
        this.lastSelectedIndex = 0;

        var div = d3.select(parent).append("div")
                                   .classed("topRowStart", true);

        this.labelSpan = div.append("span");

        var outerThis = this;
        this.dropDown = div.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        this.optionsList = d3.select(this.dropDown).selectAll("option").data(chartTypes);
        this.optionsList.enter().append("option");

        this.optionsList = d3.select(this.dropDown).selectAll("option").data(chartTypes);
        this.optionsList.attr("value", function (_value, index) { return index.toString(); });

        this.optionsList.exit().remove();

        this.setMessages();
    }

    /**
    * Sets the messages displayed within this control, following either its
    * creation or a change of selected language.
    */
    ChartTypeSelector.prototype.setMessages = function () {
        this.labelSpan.text(getMessage("ChartTypeSelectorLabel"));
        this.optionsList.text(function (value) { return getMessage(value.nameKey); });
    };

    /**
    * Sets the function used to disable the selection of the race graph.
    *
    * If not null, this will be called whenever an attempt to select the race
    * graph is made, and the selection will revert to what it was before.  If
    * it is null, the race graph can be selected.
    *
    * @param {Function|null} raceGraphDisabledNotifier Function to call when the
    *     race graph is selected
    */
    ChartTypeSelector.prototype.setRaceGraphDisabledNotifier = function (raceGraphDisabledNotifier) {
        this.raceGraphDisabledNotifier = raceGraphDisabledNotifier;
        if (this.raceGraphDisabledNotifier !== null && this.chartTypes[this.dropDown.selectedIndex].isRaceGraph) {
            // Race graph has already been selected but now the race graph
            // isn't available, so switch back to the splits graph.
            this.raceGraphDisabledNotifier();
            this.dropDown.selectedIndex = 0;
            this.onSelectionChanged();
        }
    };

    /**
    * Add a change handler to be called whenever the selected type of chart is changed.
    *
    * The selected type of chart is passed to the handler function.
    *
    * @param {Function} handler Handler function to be called whenever the
    *                           chart type changes.
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
    * @param {Object} chartType The chart type selected.
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

/*
 *  SplitsBrowser Original Data Selector - Selects original/repaired data.
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
(function () {
    "use strict";

    // ID of the div used to contain the object.
    // Must match the name defined in styles.css.
    var CONTAINER_DIV_ID = "originalDataSelectorContainer";

    var getMessage = SplitsBrowser.getMessage;

    /**
    * Constructs a new OriginalDataSelector object.
    * @constructor
    * @param {d3.selection} parent d3 selection containing the parent to
    *     insert the selector into.
    */
    function OriginalDataSelector(parent) {
        this.parent = parent;

        var checkboxId = "originalDataCheckbox";
        this.containerDiv = parent.append("div")
                                  .classed("topRowStart", true)
                                  .attr("id", CONTAINER_DIV_ID);

        this.containerDiv.append("div").classed("topRowStartSpacer", true);

        var span = this.containerDiv.append("span");

        var outerThis = this;
        this.checkbox = span.append("input")
                            .attr("type", "checkbox")
                            .attr("id", checkboxId)
                            .on("click", function() { outerThis.fireChangeHandlers(); })
                            .node();

        this.label = span.append("label")
                         .attr("for", checkboxId)
                         .classed("originalDataSelectorLabel", true);

        this.handlers = [];
        this.setMessages();
    }

    /**
    * Sets the messages in this control, following either its creation of a
    * change of selected language.
    */
    OriginalDataSelector.prototype.setMessages = function () {
        this.label.text(getMessage("ShowOriginalData"));
        this.containerDiv.attr("title", getMessage("ShowOriginalDataTooltip"));
    };

    /**
    * Register a change handler to be called whenever the choice of original or
    * repaired data is changed.
    *
    * If the handler was already registered, nothing happens.
    * @param {Function} handler Function to be called whenever the choice
    *                           changes.
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
    * @param {Function} handler Function to be called whenever the choice
    *                           changes.
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
    * @return {Boolean} True if original data is selected, false if not.
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
    * @param {Boolean} isVisible True if the original-data selector should be
    *     visible, false if it should be hidden.
    */
    OriginalDataSelector.prototype.setVisible = function (isVisible) {
        this.containerDiv.style("display", (isVisible) ? null : "none");
    };

    /**
    * Sets whether the control is enabled.
    * @param {Boolean} isEnabled True if the control is enabled, false if
    *      disabled.
    */
    OriginalDataSelector.prototype.setEnabled = function (isEnabled) {
        this.parent.selectAll("label.originalDataSelectorLabel")
                   .classed("disabled", !isEnabled);

        this.checkbox.disabled = !isEnabled;
    };

    SplitsBrowser.Controls.OriginalDataSelector = OriginalDataSelector;
})();
/*
 *  SplitsBrowser LegSelector - Provides a choice of leg to view within a relay
 *                              class.
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

    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    var LEG_SELECTOR_ID = "legSelector";
    var LEG_SELECTOR_CONTAINER_ID = "legSelectorContainer";

    /**
    * A control that wraps a drop-down list used to choose which leg of a relay
    * team to show, or whether to show all legs.
    * @param {d3.selection} parent D3 selection containing the parent element
    *     to add the control to.
    */
    function LegSelector(parent) {
        this.changeHandlers = [];
        this.parent = parent;
        this.courseClassSet = null;
        this.legCount = null;

        this.containerDiv = parent.append("div")
                                  .attr("id", LEG_SELECTOR_CONTAINER_ID)
                                  .classed("topRowStart", true)
                                  .style("display", "none");

        this.containerDiv.append("div")
                         .classed("topRowStartSpacer", true);

        this.legSelectorLabel = this.containerDiv.append("span")
                                                 .classed("legSelectorLabel", true);

        var outerThis = this;
        this.dropDown = this.containerDiv.append("select")
                                         .attr("id", LEG_SELECTOR_ID)
                                         .node();

        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        this.options = null;

        this.dropDown.selectedIndex = 0;

        this.setMessages();
    }

    /**
    * Sets the messages in this control, following its creation or a change of
    * selected language.
    */
    LegSelector.prototype.setMessages = function () {
        this.legSelectorLabel.text(getMessage("LegSelectorLabel"));
        this.setLegNames();
    };

    /**
    * Add a change handler to be called whenever the selected class is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler Handler function to be called whenever the class
    *                   changes.
    */
    LegSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Sets the names of the legs within the control's drop-down list.
    */
    LegSelector.prototype.setLegNames = function () {
        var legNames = [getMessage("ShowAllLegs")];
        for (var legIndex = 0; legIndex < this.legCount; legIndex += 1) {
            legNames.push(getMessageWithFormatting("ShowLeg", {"$$LEG_NUMBER$$": legIndex + 1}));
        }

        this.options = d3.select(this.dropDown).selectAll("option")
                                               .data(legNames);
        this.options.enter().append("option");

        this.options = d3.select(this.dropDown).selectAll("option")
                                               .data(legNames);
        this.options.attr("value", function (_name, index) { return (index === 0) ? "" : index - 1; })
                    .text(function (name) { return name; });

        this.options.exit().remove();
    };

    /**
    * Sets the course-class set to use.  This will also show or hide the control
    * as appropriate.
    * @param {CourseClassSet} courseClassSet The course-class set to set.
    */
    LegSelector.prototype.setCourseClassSet = function (courseClassSet) {
        this.courseClassSet = courseClassSet;
        this.legCount = this.courseClassSet.getLegCount();
        if (this.legCount === null) {
            this.options = null;
            d3.select(this.dropDown).selectAll("option").remove();
            this.containerDiv.style("display", "none");
        } else {
            this.setLegNames();
            this.containerDiv.style("display", null);
            this.dropDown.selectedIndex = 0;
        }
    };

    /**
    * Returns the selected leg, i.e. the (0-based) leg index if a leg has been
    * chosen, or null if all legs are visible or a team class is not being
    * shown.
    * @return {Number|null} Leg index, or null.
    */
    LegSelector.prototype.getSelectedLeg = function () {
        if (this.options === null) {
            return null;
        }

        var dropDownIndex = Math.max(this.dropDown.selectedIndex, 0);
        return (dropDownIndex === 0) ? null : dropDownIndex - 1;
    };

    /**
    * Sets the selected leg, i.e. the (0-based) leg index if a leg has been
    * chosen, or null if all legs are visible or a team class is not being
    * shown.
    * @param {Number|null} selectedLeg The leg index to set, or null.
    */
    LegSelector.prototype.setSelectedLeg = function (selectedLeg) {
        if (this.options === null) {
            // Not a relay class so do nothing.
            return;
        }

        var dropDownIndexToSet = (selectedLeg === null) ? 0 : selectedLeg + 1;
        if (dropDownIndexToSet < 0 || dropDownIndexToSet >= this.options.size()) {
            dropDownIndexToSet = 0;
        }

        this.dropDown.selectedIndex = dropDownIndexToSet;
        this.onSelectionChanged();
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    LegSelector.prototype.onSelectionChanged = function() {
        var selectedLeg = this.getSelectedLeg();
        this.changeHandlers.forEach(function (handler) { handler(selectedLeg); });
    };

    SplitsBrowser.Controls.LegSelector = LegSelector;
})();

﻿/*
 *  SplitsBrowser ChartPopupData - Gets data for the chart popup window.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
(function () {
    "use strict";

    // The maximum number of fastest splits to show when the popup is open.
    var MAX_FASTEST_SPLITS = 10;

    // Width of the time interval, in seconds, when viewing nearby results
    // at a control on the race graph.
    var RACE_GRAPH_RESULT_WINDOW = 240;

    var formatTime = SplitsBrowser.formatTime;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    var Course = SplitsBrowser.Model.Course;

    var ChartPopupData = {};

    /**
    * Returns the fastest splits to a control.
    * @param {SplitsBrowser.Model.CourseClassSet} courseClassSet The
    *     course-class set containing the splits data.
    * @param {Number} controlIndex The index of the control.
    * @param {Number|null} selectedLegIndex The index of the selected leg, or null
    *     to not return leg-specific data.
    * @return {Object} Fastest-split data.
    */
    ChartPopupData.getFastestSplitsPopupData = function (courseClassSet, controlIndex, selectedLegIndex) {
        var data = courseClassSet.getFastestSplitsTo(MAX_FASTEST_SPLITS, controlIndex, selectedLegIndex);
        data = data.map(function (comp) {
            return {time: comp.split, name: comp.name, highlight: false};
        });

        var placeholderMessageKey;
        if (courseClassSet.hasTeamData() && selectedLegIndex === null) {
            placeholderMessageKey = "SelectedClassesPopupPlaceholderTeams";
        } else {
            placeholderMessageKey = "SelectedClassesPopupPlaceholder";
        }

        return {title: getMessage("SelectedClassesPopupHeader"), data: data, placeholder: getMessage(placeholderMessageKey)};
    };

    /**
    * Returns the fastest splits for the currently-shown leg.  The list
    * returned contains the fastest splits for the current leg for each class.
    * @param {SplitsBrowser.Model.CourseClassSet} courseClassSet The course-class set
    *     containing the splits data.
    * @param {SplitsBrowser.Model.EventData} eventData Data for the entire
    *     event.
    * @param {Number} controlIndex The index of the control.
    * @return {Object} Object that contains the title for the popup and the
    *     array of data to show within it.
    */
    ChartPopupData.getFastestSplitsForLegPopupData = function (courseClassSet, eventData, controlIndex) {
        var course = courseClassSet.getCourse();
        var startCode = course.getControlCode(controlIndex - 1);
        var endCode = course.getControlCode(controlIndex);

        var startControl = (startCode === Course.START) ? getMessage("StartName") : startCode;
        var endControl = (endCode === Course.FINISH) ? getMessage("FinishName") : endCode;

        var title = getMessageWithFormatting("FastestLegTimePopupHeader", {"$$START$$": startControl, "$$END$$": endControl});

        var primaryClass = courseClassSet.getPrimaryClassName();
        var data = eventData.getFastestSplitsForLeg(startCode, endCode)
                            .map(function (row) { return { name: row.name, className: row.className, time: row.split, highlight: (row.className === primaryClass)}; });

        return {title: title, data: data, placeholder: null};
    };

    /**
    * Returns an object containing an array of the results visiting a
    * control at a given time.
    * @param {SplitsBrowser.Model.CourseClassSet} courseClassSet The course-class set
    *     containing the splits data.
    * @param {SplitsBrowser.Model.EventData} eventData Data for the entire
    *     event.
    * @param {Number} controlIndex The index of the control.
    * @param {Number} time The current time, in units of seconds past midnight.
    * @return {Object} Object containing result data.
    */
    ChartPopupData.getResultsVisitingCurrentControlPopupData = function (courseClassSet, eventData, controlIndex, time) {
        var controlCode = courseClassSet.getCourse().getControlCode(controlIndex);
        var intervalStart = Math.round(time) - RACE_GRAPH_RESULT_WINDOW / 2;
        var intervalEnd = Math.round(time) + RACE_GRAPH_RESULT_WINDOW / 2;
        var results = eventData.getResultsAtControlInTimeRange(controlCode, intervalStart, intervalEnd);

        var primaryClass = courseClassSet.getPrimaryClassName();
        var resultData = results.map(function (row) { return {name: row.name, className: row.className, time: row.time, highlight: (row.className === primaryClass)}; });

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

        return {title: title, data: resultData, placeholder: getMessage("NoNearbyCompetitors")};
    };

    /**
    * Compares two course names.
    * @param {String} name1 One course name to compare.
    * @param {String} name2 The other course name to compare.
    * @return {Number} Comparison result: negative if name1 < name2,
    *     positive if name1 > name2 and zero if name1 === name2.
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
    * @param {Array} nextControls Array of next-control information objects.
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
    * @param {SplitsBrowser.Model.Course} course The course containing the
    *     controls data.
    * @param {SplitsBrowser.Model.EventData} eventData Data for the entire
    *     event.
    * @param {Number} controlIndex The index of the control.
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
/*
 *  SplitsBrowser Chart Popup - Shows data near the cursor in a popup window.
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

    var formatTime = SplitsBrowser.formatTime;
    var hasProperty = SplitsBrowser.hasProperty;

    /**
    * Creates a ChartPopup control.
    * @constructor
    * @param {HTMLElement} parent Parent HTML element.
    * @param {Object} handlers Object that maps mouse event names to handlers.
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
            if (hasProperty(handlers, eventName)) {
                $(this.popupDiv.node()).on(eventName, handlers[eventName]);
            }
        }

        var outerThis = this;
        $(this.popupDiv.node()).mouseenter(function () { outerThis.mouseIn = true; });
        $(this.popupDiv.node()).mouseleave(function () { outerThis.mouseIn = false; });
    }

    /**
    * Returns whether the popup is currently shown.
    * @return {Boolean} True if the popup is shown, false otherwise.
    */
    ChartPopup.prototype.isShown = function () {
        return this.shown;
    };

    /**
    * Returns whether the mouse is currently over the popup.
    * @return {Boolean} True if the mouse is over the popup, false otherwise.
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
    * @param {Object} competitorData Array of data to show.
    * @param {Boolean} includeClassNames Whether to include class names.
    */
    ChartPopup.prototype.setData = function (competitorData, includeClassNames) {
        this.dataHeader.text(competitorData.title);

        var rows = this.dataTable.selectAll("tr")
                                 .data(competitorData.data);

        rows.enter().append("tr");

        rows = this.dataTable.selectAll("tr")
                             .data(competitorData.data);
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
    * @param {Object} nextControlsData The next-controls data.
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
    * @param {Object} location The location of the chart popup.
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
    * @param {Object} location The location of the chart popup.
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
﻿/*
 *  SplitsBrowser Chart - Draws a chart of data on an SVG element.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    // Minimum distance between a Y-axis tick label and a result's start
    // time, in pixels.
    var MIN_RESULT_TICK_MARK_DISTANCE = 10;

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
    var formatTimeOfDay = SplitsBrowser.formatTimeOfDay;
    var getMessage = SplitsBrowser.getMessage;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var isNaNStrict = SplitsBrowser.isNaNStrict;

    var ChartPopupData = SplitsBrowser.Model.ChartPopupData;
    var ChartPopup = SplitsBrowser.Controls.ChartPopup;

    /**
    * Format a time and a rank as a string, with the split time in mm:ss or h:mm:ss
    * as appropriate.
    * @param {Number|null} time The time, in seconds, or null.
    * @param {Number|null} rank The rank, or null.
    * @param {Boolean} isOKDespiteMissingTimes True if the result is marked as
    *     OK despite having missing controls.
    * @return {String} Time and rank formatted as a string.
    */
    function formatTimeAndRank(time, rank, isOKDespiteMissingTimes) {
        if (isOKDespiteMissingTimes && time === null) {
            time = NaN;
            rank = NaN;
        }

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
    * Formats and returns a result's name and optional suffix.
    * @param {String} name The name associated with the result.
    * @param {String} suffix The optional suffix of the result (may be an
    *      empty string to indicate no suffix).
    * @return {String} Result's associated name and suffix, formatted.
    */
    function formatNameAndSuffix(name, suffix) {
        return (suffix === "") ? name : name + " (" + suffix + ")";
    }

    /**
    * Returns the 'suffix' to use with the given result.
    * The suffix indicates whether they are non-competitive or a mispuncher,
    * were disqualified or did not finish.  If none of the above apply, an
    * empty string is returned.
    * @param {Result} result The result to get the suffix for.
    * @return {String} Suffix to use with the given result.
    */
    function getSuffix(result) {
        // Non-starters are not catered for here, as this is intended to only
        // be used on the chart and non-starters shouldn't appear on the chart.
        if (result.completed() && result.isNonCompetitive) {
            return getMessage("NonCompetitiveShort");
        } else if (result.isNonFinisher) {
            return getMessage("DidNotFinishShort");
        } else if (result.isDisqualified) {
            return getMessage("DisqualifiedShort");
        } else if (result.isOverMaxTime) {
            return getMessage("OverMaxTimeShort");
        } else if (result.completed()) {
            return "";
        } else {
            return getMessage("MispunchedShort");
        }
    }

    /**
    * A chart object in a window.
    * @constructor
    * @param {HTMLElement} parent The parent object to create the element within.
    */
    function Chart(parent) {
        this.parent = parent;

        this.xScale = null;
        this.yScale = null;
        this.hasData = false;
        this.overallWidth = -1;
        this.overallHeight = -1;
        this.contentWidth = -1;
        this.contentHeight = -1;
        this.numControls = -1;
        this.selectedIndexes = [];
        this.currentResultData = null;
        this.isPopupOpen = false;
        this.popupUpdateFunc = null;
        this.maxStartTimeLabelWidth = 0;

        this.mouseOutTimeout = null;

        // Indexes of the currently-selected results, in the order that
        // they appear in the list of labels.
        this.selectedIndexesOrderedByLastYValue = [];
        this.referenceCumTimes = [];
        this.referenceCumTimesSorted = [];
        this.referenceCumTimeIndexes = [];
        this.fastestCumTimes = [];
        this.selectedLegIndex = null;

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
    * Sets the left margin of the chart.
    * @param {Number} leftMargin The left margin of the chart.
    */
    Chart.prototype.setLeftMargin = function (leftMargin) {
        this.currentLeftMargin = leftMargin;
        this.svgGroup.attr("transform", "translate(" + this.currentLeftMargin + "," + MARGIN.top + ")");
    };

    /**
    * Gets the location the chart popup should be at following a mouse-button
    * press or a mouse movement.
    * @param {jQuery.event} event jQuery mouse-down or mouse-move event.
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
        return ChartPopupData.getFastestSplitsPopupData(this.courseClassSet, this.currentControlIndex, this.selectedLegIndex);
    };

    /**
    * Returns the fastest splits for the currently-shown leg.  The list
    * returned contains the fastest splits for the current leg for each class.
    * @return {Object} Object that contains the title for the popup and the
    *     array of data to show within it.
    */
    Chart.prototype.getFastestSplitsForCurrentLegPopupData = function () {
        return ChartPopupData.getFastestSplitsForLegPopupData(this.courseClassSet, this.eventData, this.currentControlIndex);
    };

    /**
    * Stores the current time the mouse is at, on the race graph.
    * @param {jQuery.event} event The mouse-down or mouse-move event.
    */
    Chart.prototype.setCurrentChartTime = function (event) {
        var yOffset = event.pageY - $(this.svg.node()).offset().top - MARGIN.top;
        this.currentChartTime = Math.round(this.yScale.invert(yOffset) * 60) + this.referenceCumTimes[this.currentControlIndex];
    };

    /**
    * Returns an array of the results visiting the current control at the
    * current time.
    * @return {Array} Array of result data.
    */
    Chart.prototype.getResultsVisitingCurrentControlPopupData = function () {
        return ChartPopupData.getResultsVisitingCurrentControlPopupData(this.courseClassSet, this.eventData, this.currentControlIndex, this.currentChartTime);
    };

    /**
    * Returns next-control data to show on the chart popup.
    * @return {Array} Array of next-control data.
    */
    Chart.prototype.getNextControlData = function () {
        return ChartPopupData.getNextControlData(this.courseClassSet.getCourse(), this.eventData, this.actualControlIndex);
    };

    /**
    * Handle the mouse entering the chart.
    * @param {jQuery.event} event jQuery event object.
    */
    Chart.prototype.onMouseEnter = function (event) {
        if (this.mouseOutTimeout !== null) {
            clearTimeout(this.mouseOutTimeout);
            this.mouseOutTimeout = null;
        }

        this.isMouseIn = true;
        if (this.hasData) {
            this.updateControlLineLocation(event);
        }
    };

    /**
    * Handle a mouse movement.
    * @param {jQuery.event} event jQuery event object.
    */
    Chart.prototype.onMouseMove = function (event) {
        if (this.hasData&& this.isMouseIn && this.xScale !== null) {
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
    * @param {jQuery.Event} event jQuery event object.
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
    * @param {jQuery.event} event The jQuery onMouseUp event.
    */
    Chart.prototype.onMouseUp = function (event) {
        this.popup.hide();
        event.preventDefault();
    };

    /**
    * Shows the popup window, populating it with data as necessary
    * @param {jQuery.event} event The jQuery onMouseDown event that triggered
    *     the popup.
    */
    Chart.prototype.showPopupDialog = function (event) {
        if (this.isMouseIn && this.currentControlIndex !== null) {
            var showPopup = false;
            var outerThis = this;
            if (this.isRaceGraph && (event.which === JQUERY_EVENT_LEFT_BUTTON || event.which === JQUERY_EVENT_RIGHT_BUTTON)) {
                if (this.hasControls) {
                    this.setCurrentChartTime(event);
                    this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getResultsVisitingCurrentControlPopupData(), true); };
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
    * @param {jQuery.event} event jQuery mouse-move event.
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
    * @param {Number} controlIndex The index of the control at which to draw the
    *                              control line.
    */
    Chart.prototype.drawControlLine = function(controlIndex) {
        this.currentControlIndex = controlIndex;
        this.updateResultStatistics();
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
    * @param {jQuery.event} event jQuery mousedown or mousemove event.
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
        this.updateResultStatistics();
        if (this.controlLine !== null) {
            d3.select(this.controlLine).remove();
            this.controlLine = null;
        }
    };

    /**
    * Returns an array of the the times that the selected results are behind
    * the fastest time at the given control.
    * @param {Number} controlIndex Index of the given control.
    * @param {Array} indexes Array of indexes of selected results.
    * @return {Array} Array of times in seconds that the given results are
    *     behind the fastest time.
    */
    Chart.prototype.getTimesBehindFastest = function (controlIndex, indexes) {
        var selectedResults = indexes.map(function (index) { return this.courseClassSet.allResults[index]; }, this);
        var fastestSplit = this.fastestCumTimes[controlIndex] - this.fastestCumTimes[controlIndex - 1];
        var timesBehind = selectedResults.map(function (result) { var resultSplit = result.getSplitTimeTo(controlIndex); return (resultSplit === null) ? null : resultSplit - fastestSplit; });
        return timesBehind;
    };

    /**
    * Returns an array of the the time losses of the selected results at the
    * given control.
    * @param {Number} controlIndex Index of the given control.
    * @param {Array} indexes Array of indexes of selected results.
    * @return {Array} Array of times in seconds that the given results are
    *     deemed to have lost at the given control.
    */
    Chart.prototype.getTimeLosses = function (controlIndex, indexes) {
        var selectedResults = indexes.map(function (index) { return this.courseClassSet.allResults[index]; }, this);
        var timeLosses = selectedResults.map(function (result) { return result.getTimeLossAt(controlIndex); });
        return timeLosses;
    };

    /**
    * Updates the statistics text shown after the results.
    */
    Chart.prototype.updateResultStatistics = function() {
        var selectedResults = this.selectedIndexesOrderedByLastYValue.map(function (index) { return this.courseClassSet.allResults[index]; }, this);
        var labelTexts = selectedResults.map(function (result) { return formatNameAndSuffix(result.getOwnerNameForLeg(this.selectedLegIndex), getSuffix(result)); }, this);

        if (this.currentControlIndex !== null && this.currentControlIndex > 0) {
            var okDespites = selectedResults.map(function (result) { return result.isOKDespiteMissingTimes; });
            if (this.visibleStatistics.TotalTime) {
                var cumTimes = selectedResults.map(function (result) { return result.getCumulativeTimeTo(this.currentControlIndex); }, this);
                var cumRanks = selectedResults.map(function (result) { return result.getCumulativeRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, cumTimes, cumRanks, okDespites)
                               .map(function(quad) { return quad[0] + formatTimeAndRank(quad[1], quad[2], quad[3]); });
            }

            if (this.visibleStatistics.SplitTime) {
                var splitTimes = selectedResults.map(function (result) { return result.getSplitTimeTo(this.currentControlIndex); }, this);
                var splitRanks = selectedResults.map(function (result) { return result.getSplitRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, splitTimes, splitRanks, okDespites)
                               .map(function(quad) { return quad[0] + formatTimeAndRank(quad[1], quad[2], quad[3]); });
            }

            if (this.visibleStatistics.BehindFastest) {
                var timesBehind = this.getTimesBehindFastest(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                labelTexts = d3.zip(labelTexts, timesBehind, okDespites)
                               .map(function(triple) { return triple[0] + SPACER + formatTime((triple[2] && triple[1] === null) ? NaN : triple[1]); });
            }

            if (this.visibleStatistics.TimeLoss) {
                var timeLosses = this.getTimeLosses(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                labelTexts = d3.zip(labelTexts, timeLosses)
                               .map(function(pair) { return pair[0] + SPACER + formatTime(pair[1]); });
            }
        }

        // Update the current result data.
        if (this.hasData) {
            this.currentResultData.forEach(function (data, index) { data.label = labelTexts[index]; });
        }

        // This data is already joined to the labels; just update the text.
        d3.selectAll("text.resultLabel").text(function (data) { return data.label; });
    };

    /**
    * Returns a tick-formatting function that formats the label of a tick on the
    * top X-axis.
    *
    * The function returned is suitable for use with the D3 axis.tickFormat method.
    *
    * @return {Function} Tick-formatting function.
    */
    Chart.prototype.getTickFormatter = function () {
        var outerThis = this;
        if (this.courseClassSet.hasTeamData()) {
            var allControls = [getMessage("StartNameShort")];
            var numbersOfControls = this.courseClassSet.classes[0].numbersOfControls;
            if (this.selectedLegIndex !== null) {
                numbersOfControls = [numbersOfControls[this.selectedLegIndex]];
            }

            for (var legIndex = 0; legIndex < numbersOfControls.length; legIndex += 1) {
                for (var controlIndex = 1; controlIndex <= numbersOfControls[legIndex]; controlIndex += 1) {
                    allControls.push(controlIndex.toString());
                }
                allControls.push(getMessage("FinishNameShort"));
            }

            return function (value, idx) {
                return allControls[idx];
            };
        }
        else {
            return function (value, idx) {
                return (idx === 0) ? getMessage("StartNameShort") : ((idx === outerThis.numControls + 1) ? getMessage("FinishNameShort") : idx.toString());
            };
        }
    };

    /**
    * Get the width of a piece of text.
    * @param {String} text The piece of text to measure the width of.
    * @return {Number} The width of the piece of text, in pixels.
    */
    Chart.prototype.getTextWidth = function (text) {
        return this.textSizeElement.text(text).node().getBBox().width;
    };

    /**
    * Gets the height of a piece of text.
    *
    * @param {String} text The piece of text to measure the height of.
    * @return {Number} The height of the piece of text, in pixels.
    */
    Chart.prototype.getTextHeight = function (text) {
        return this.textSizeElement.text(text).node().getBBox().height;
    };

    /**
    * Return the maximum width of the end-text shown to the right of the graph.
    *
    * This function considers only the results whose indexes are in the list
    * given.  This method returns zero if the list is empty.
    * @return {Number} Maximum width of text, in pixels.
    */
    Chart.prototype.getMaxGraphEndTextWidth = function () {
        if (this.selectedIndexes.length === 0) {
            // No results selected.  Avoid problems caused by trying to find
            // the maximum of an empty array.
            return 0;
        } else {
            var nameWidths = this.selectedIndexes.map(function (index) {
                var result = this.courseClassSet.allResults[index];
                return this.getTextWidth(formatNameAndSuffix(result.getOwnerNameForLeg(this.selectedLegIndex), getSuffix(result)));
            }, this);
            return d3.max(nameWidths) + this.determineMaxStatisticTextWidth();
        }
    };

    /**
    * Returns the maximum value from the given array, not including any null or
    * NaN values.  If the array contains no non-null, non-NaN values, zero is
    * returned.
    * @param {Array} values Array of values.
    * @return {Number} Maximum non-null or NaN value.
    */
    function maxNonNullNorNaNValue(values) {
        var nonNullNorNaNValues = values.filter(isNotNullNorNaN);
        return (nonNullNorNaNValues.length > 0) ? d3.max(nonNullNorNaNValues) : 0;
    }

    /**
    * Return the maximum width of a piece of time and rank text shown to the right
    * of each result.
    * @param {String} timeFuncName Name of the function to call to get the time
                                   data.
    * @param {String} rankFuncName Name of the function to call to get the rank
                                   data.
    * @return {Number} Maximum width of split-time and rank text, in pixels.
    */
    Chart.prototype.getMaxTimeAndRankTextWidth = function(timeFuncName, rankFuncName) {
        var maxTime = 0;
        var maxRank = 0;

        var selectedResults = this.selectedIndexes.map(function (index) { return this.courseClassSet.allResults[index]; }, this);

        d3.range(1, this.numControls + 2).forEach(function (controlIndex) {
            var times = selectedResults.map(function (result) { return result[timeFuncName](controlIndex); });
            maxTime = Math.max(maxTime, maxNonNullNorNaNValue(times));

            var ranks = selectedResults.map(function (result) { return result[rankFuncName](controlIndex); });
            maxRank = Math.max(maxRank, maxNonNullNorNaNValue(ranks));
        });

        var text = formatTimeAndRank(maxTime, maxRank);
        return this.getTextWidth(text);
    };

    /**
    * Return the maximum width of the split-time and rank text shown to the right
    * of each result.
    * @return {Number} Maximum width of split-time and rank text, in pixels.
    */
    Chart.prototype.getMaxSplitTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getSplitTimeTo", "getSplitRankTo");
    };

    /**
    * Return the maximum width of the cumulative time and cumulative-time rank text
    * shown to the right of each result.
    * @return {Number} Maximum width of cumulative time and cumulative-time rank text, in
    *                  pixels.
    */
    Chart.prototype.getMaxCumulativeTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getCumulativeTimeTo", "getCumulativeRankTo");
    };

    /**
    * Return the maximum width of the behind-fastest time shown to the right of
    * each result.
    * @return {Number} Maximum width of behind-fastest time rank text, in pixels.
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
    * each result.
    * @return {Number} Maximum width of behind-fastest time rank text, in pixels.
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

        return Math.max(
            this.getTextWidth(SPACER + formatTime(maxTimeLoss)),
            this.getTextWidth(SPACER + formatTime(minTimeLoss))
        );
    };

    /**
    * Determines the maximum width of the statistics text at the end of the result.
    * @return {Number} Maximum width of the statistics text, in pixels.
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
    * @param {Object} chartData Object containing the chart data.
    * @return {Number} Maximum width of a start time label.
    */
    Chart.prototype.determineMaxStartTimeLabelWidth = function (chartData) {
        var maxWidth;
        if (chartData.resultNames.length > 0) {
            maxWidth = d3.max(chartData.resultNames.map(function (name) { return this.getTextWidth("00:00:00 " + name); }, this));
        } else {
            maxWidth = 0;
        }

        return maxWidth;
    };

    /**
    * Creates the X and Y scales necessary for the chart and its axes.
    * @param {Object} chartData Chart data object.
    */
    Chart.prototype.createScales = function (chartData) {
        this.xScale = d3.scaleLinear().domain(chartData.xExtent).range([0, this.contentWidth]);
        this.yScale = d3.scaleLinear().domain(chartData.yExtent).range([0, this.contentHeight]);
        this.xScaleMinutes = d3.scaleLinear().domain([chartData.xExtent[0] / 60, chartData.xExtent[1] / 60]).range([0, this.contentWidth]);
    };

    /**
    * Draw the background rectangles that indicate sections of the course
    * between controls.
    */
    Chart.prototype.drawBackgroundRectangles = function () {

        // We can't guarantee that the reference cumulative times are in
        // ascending order, but we need such a list of times in order to draw
        // the rectangles.  So, sort the reference cumulative times.
        var refCumTimesSorted = this.courseClassSet.sliceForLegIndex(this.referenceCumTimes, this.selectedLegIndex);
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

        var backgroundIndexes = [];
        var numbersOfControls = (this.courseClassSet.hasTeamData()) ? this.courseClassSet.classes[0].numbersOfControls : [this.courseClassSet.numControls];
        if (this.courseClassSet.hasTeamData() && this.selectedLegIndex !== null) {
            numbersOfControls = [numbersOfControls[this.selectedLegIndex]];
        }

        for (var legIndex = 0; legIndex < numbersOfControls.length; legIndex += 1) {
            for (var controlIndex = 0; controlIndex <= numbersOfControls[legIndex]; controlIndex += 1) {
                backgroundIndexes.push(1 + controlIndex % 2 + ((legIndex + (this.selectedLegIndex || 0)) % 2) * 2);
            }
        }

        rects = this.svgGroup.selectAll("rect")
                                 .data(d3.range(refCumTimesSorted.length - 1));
        rects.attr("x", function (index) { return outerThis.xScale(refCumTimesSorted[index]); })
             .attr("y", 0)
             .attr("width", function (index) { return outerThis.xScale(refCumTimesSorted[index + 1]) - outerThis.xScale(refCumTimesSorted[index]); })
             .attr("height", this.contentHeight)
             .attr("class", function (index) { return "background" + backgroundIndexes[index]; });

        rects.exit().remove();
    };

    /**
    * Returns a function used to format tick labels on the Y-axis.
    *
    * If start times are to be shown (i.e. for the race graph), then the Y-axis
    * values are start times.  We format these as times, as long as there isn't
    * a result's start time too close to it.
    *
    * For other graph types, this method returns null, which tells d3 to use
    * its default tick formatter.
    *
    * @param {Object} chartData The chart data to read start times from.
    * @return {Function|null} Tick formatter function, or null to use the default
    *     d3 formatter.
    */
    Chart.prototype.determineYAxisTickFormatter = function (chartData) {
        if (this.isRaceGraph) {
            // Assume column 0 of the data is the start times.
            // However, beware that there might not be any data.
            var startTimes = (chartData.dataColumns.length === 0) ? [] : chartData.dataColumns[0].ys;
            if (startTimes.length === 0) {
                // No start times - draw all tick marks.
                return function (time) { return formatTimeOfDay(time * 60); };
            } else {
                // Some start times are to be drawn - only draw tick marks if
                // they are far enough away from results.
                var yScale = this.yScale;
                return function (time) {
                    var nearestOffset = d3.min(startTimes.map(function (startTime) { return Math.abs(yScale(startTime) - yScale(time)); }));
                    return (nearestOffset >= MIN_RESULT_TICK_MARK_DISTANCE) ? formatTimeOfDay(Math.round(time * 60)) : "";
                };
            }
        } else {
            // Use the default d3 tick formatter.
            return null;
        }
    };

    /**
    * Draw the chart axes.
    * @param {String} yAxisLabel The label to use for the Y-axis.
    * @param {Object} chartData The chart data to use.
    */
    Chart.prototype.drawAxes = function (yAxisLabel, chartData) {

        var tickFormatter = this.determineYAxisTickFormatter(chartData);

        var xAxis = d3.axisTop()
                      .scale(this.xScale)
                      .tickFormat(this.getTickFormatter())
                      .tickValues(this.courseClassSet.sliceForLegIndex(this.referenceCumTimes, this.selectedLegIndex));

        var yAxis = d3.axisLeft()
                      .scale(this.yScale)
                      .tickFormat(tickFormatter);

        var lowerXAxis = d3.axisBottom()
                           .scale(this.xScaleMinutes);

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
                     .style("fill", "black")
                     .text(yAxisLabel);

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .attr("transform", "translate(0," + this.contentHeight + ")")
                     .call(lowerXAxis)
                     .append("text")
                     .attr("x", 60)
                     .attr("y", -5)
                     .style("text-anchor", "start")
                     .style("fill", "black")
                     .text(getMessage("LowerXAxisChartLabel"));
    };

    /**
    * Draw the lines on the chart.
    * @param {Array} chartData Array of chart data.
    */
    Chart.prototype.drawChartLines = function (chartData) {
        var outerThis = this;
        var lineFunctionGenerator = function (selResultIdx) {
            if (!chartData.dataColumns.some(function (col) { return isNotNullNorNaN(col.ys[selResultIdx]); })) {
                // This result's entire row is null/NaN, so there's no data to
                // draw.  WebKit will report an error ('Error parsing d=""') if
                // no points on the line are defined, as will happen in this
                // case, so we substitute a single zero point instead.
                return d3.line()
                           .x(0)
                           .y(0)
                           .defined(function (d, i) { return i === 0; });
            }
            else {
                return d3.line()
                           .x(function (d) { return outerThis.xScale(d.x); })
                           .y(function (d) { return outerThis.yScale(d.ys[selResultIdx]); })
                           .defined(function (d) { return isNotNullNorNaN(d.ys[selResultIdx]); });
            }
        };

        this.svgGroup.selectAll("path.graphLine").remove();

        this.svgGroup.selectAll("line.aroundOmittedTimes").remove();

        d3.range(this.numLines).forEach(function (selResultIdx) {
            var strokeColour = colours[this.selectedIndexes[selResultIdx] % colours.length];
            var highlighter = function () { outerThis.highlight(outerThis.selectedIndexes[selResultIdx]); };
            var unhighlighter = function () { outerThis.unhighlight(); };

            this.svgGroup.append("path")
                         .attr("d", lineFunctionGenerator(selResultIdx)(chartData.dataColumns))
                         .attr("stroke", strokeColour)
                         .attr("class", "graphLine result" + this.selectedIndexes[selResultIdx])
                         .on("mouseenter", highlighter)
                         .on("mouseleave", unhighlighter)
                         .append("title")
                         .text(chartData.resultNames[selResultIdx]);

            chartData.dubiousTimesInfo[selResultIdx].forEach(function (dubiousTimeInfo) {
                this.svgGroup.append("line")
                             .attr("x1", this.xScale(chartData.dataColumns[dubiousTimeInfo.start].x))
                             .attr("y1", this.yScale(chartData.dataColumns[dubiousTimeInfo.start].ys[selResultIdx]))
                             .attr("x2", this.xScale(chartData.dataColumns[dubiousTimeInfo.end].x))
                             .attr("y2", this.yScale(chartData.dataColumns[dubiousTimeInfo.end].ys[selResultIdx]))
                             .attr("stroke", strokeColour)
                             .attr("class", "aroundOmittedTimes result" + this.selectedIndexes[selResultIdx])
                             .on("mouseenter", highlighter)
                             .on("mouseleave", unhighlighter)
                             .append("title")
                             .text(chartData.resultNames[selResultIdx]);
            }, this);
        }, this);
    };

    /**
    * Highlights the result with the given index.
    * @param {Number} resultIdx The index of the result to highlight.
    */
    Chart.prototype.highlight = function (resultIdx) {
        this.svg.selectAll("path.graphLine.result" + resultIdx).classed("selected", true);
        this.svg.selectAll("line.resultLegendLine.result" + resultIdx).classed("selected", true);
        this.svg.selectAll("text.resultLabel.result" + resultIdx).classed("selected", true);
        this.svg.selectAll("text.startLabel.result" + resultIdx).classed("selected", true);
        this.svg.selectAll("line.aroundOmittedTimes.result" + resultIdx).classed("selected", true);
    };

    /**
    * Removes any result-specific higlighting.
    */
    Chart.prototype.unhighlight = function () {
        this.svg.selectAll("path.graphLine.selected").classed("selected", false);
        this.svg.selectAll("line.resultLegendLine.selected").classed("selected", false);
        this.svg.selectAll("text.resultLabel.selected").classed("selected", false);
        this.svg.selectAll("text.startLabel.selected").classed("selected", false);
        this.svg.selectAll("line.aroundOmittedTimes.selected").classed("selected", false);
    };

    /**
    * Draws the start-time labels for the currently-selected results.
    * @param {Object} chartData The chart data that contains the start offsets.
    */
    Chart.prototype.drawResultStartTimeLabels = function (chartData) {
        var startColumn = chartData.dataColumns[0];
        var outerThis = this;

        var startLabels = this.svgGroup.selectAll("text.startLabel").data(this.selectedIndexes);

        startLabels.enter().append("text")
                           .classed("startLabel", true);

        startLabels = this.svgGroup.selectAll("text.startLabel").data(this.selectedIndexes);
        startLabels.attr("x", -7)
                   .attr("y", function (_resultIndex, selResultIndex) { return outerThis.yScale(startColumn.ys[selResultIndex]) + outerThis.getTextHeight(chartData.resultNames[selResultIndex]) / 4; })
                   .attr("class", function (resultIndex) { return "startLabel result" + resultIndex; })
                   .on("mouseenter", function (resultIndex) { outerThis.highlight(resultIndex); })
                   .on("mouseleave", function () { outerThis.unhighlight(); })
                   .text(function (_resultIndex, selResultIndex) { return formatTimeOfDay(Math.round(startColumn.ys[selResultIndex] * 60)) + " " + chartData.resultNames[selResultIndex]; });

        startLabels.exit().remove();
    };

    /**
    * Removes all of the result start-time labels from the chart.
    */
    Chart.prototype.removeResultStartTimeLabels = function () {
        this.svgGroup.selectAll("text.startLabel").remove();
    };

    /**
    * Adjust the locations of the legend labels downwards so that two labels
    * do not overlap.
    */
    Chart.prototype.adjustResultLegendLabelsDownwardsIfNecessary = function () {
        for (var i = 1; i < this.numLines; i += 1) {
            var prevResult = this.currentResultData[i - 1];
            var thisResult = this.currentResultData[i];
            if (thisResult.y < prevResult.y + prevResult.textHeight) {
                thisResult.y = prevResult.y + prevResult.textHeight;
            }
        }
    };

    /**
    * Adjusts the locations of the legend labels upwards so that as many as
    * possible can fit on the chart.  If all result labels are already on the
    * chart, then this method does nothing.
    *
    * This method does not move off the chart any label that is currently on
    * the chart.
    *
    * @param {Number} minLastY The minimum Y-coordinate of the lowest label.
    */
    Chart.prototype.adjustResultLegendLabelsUpwardsIfNecessary = function (minLastY) {
        if (this.numLines > 0 && this.currentResultData[this.numLines - 1].y > this.contentHeight) {
            // The list of results runs off the bottom.
            // Put the last result at the bottom, or at its minimum Y-offset,
            // whichever is larger, and move all labels up as much as we can.
            this.currentResultData[this.numLines - 1].y = Math.max(minLastY, this.contentHeight);
            for (var i = this.numLines - 2; i >= 0; i -= 1) {
                var nextResult = this.currentResultData[i + 1];
                var thisResult = this.currentResultData[i];
                if (thisResult.y + thisResult.textHeight > nextResult.y) {
                    thisResult.y = nextResult.y - thisResult.textHeight;
                } else {
                    // No more adjustments need to be made.
                    break;
                }
            }
        }
    };

    /**
    * Draw legend labels to the right of the chart.
    * Draw legend labels to the right of the chart.
    * @param {Object} chartData The chart data that contains the final time offsets.
    */
    Chart.prototype.drawResultLegendLabels = function (chartData) {

        var minLastY = 0;
        if (chartData.dataColumns.length === 0) {
            this.currentResultData = [];
        } else {
            var finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
            this.currentResultData = d3.range(this.numLines).map(function (i) {
                var resultIndex = this.selectedIndexes[i];
                var name = this.courseClassSet.allResults[resultIndex].getOwnerNameForLeg(this.selectedLegIndex);
                var textHeight = this.getTextHeight(name);
                minLastY += textHeight;
                return {
                    label: formatNameAndSuffix(name, getSuffix(this.courseClassSet.allResults[resultIndex])),
                    textHeight: textHeight,
                    y: (isNotNullNorNaN(finishColumn.ys[i])) ? this.yScale(finishColumn.ys[i]) : null,
                    colour: colours[resultIndex % colours.length],
                    index: resultIndex
                };
            }, this);

            minLastY -= this.currentResultData[this.numLines - 1].textHeight;

            // Draw the mispunchers at the bottom of the chart, with the last
            // one of them at the bottom.
            var lastMispuncherY = null;
            for (var selResultIdx = this.numLines - 1; selResultIdx >= 0; selResultIdx -= 1) {
                if (this.currentResultData[selResultIdx].y === null) {
                    this.currentResultData[selResultIdx].y = (lastMispuncherY === null) ? this.contentHeight : lastMispuncherY - this.currentResultData[selResultIdx].textHeight;
                    lastMispuncherY = this.currentResultData[selResultIdx].y;
                }
            }
        }

        // Sort by the y-offset values, which doesn't always agree with the end
        // positions of the results.
        this.currentResultData.sort(function (a, b) { return a.y - b.y; });

        this.selectedIndexesOrderedByLastYValue = this.currentResultData.map(function (result) { return result.index; });

        this.adjustResultLegendLabelsDownwardsIfNecessary();

        this.adjustResultLegendLabelsUpwardsIfNecessary(minLastY);

        var legendLines = this.svgGroup.selectAll("line.resultLegendLine").data(this.currentResultData);
        legendLines.enter().append("line").classed("resultLegendLine", true);

        var outerThis = this;
        legendLines = this.svgGroup.selectAll("line.resultLegendLine").data(this.currentResultData);
        legendLines.attr("x1", this.contentWidth + 1)
                   .attr("y1", function (data) { return data.y; })
                   .attr("x2", this.contentWidth + LEGEND_LINE_WIDTH + 1)
                   .attr("y2", function (data) { return data.y; })
                   .attr("stroke", function (data) { return data.colour; })
                   .attr("class", function (data) { return "resultLegendLine result" + data.index; })
                   .on("mouseenter", function (data) { outerThis.highlight(data.index); })
                   .on("mouseleave", function () { outerThis.unhighlight(); });

        legendLines.exit().remove();

        var labels = this.svgGroup.selectAll("text.resultLabel").data(this.currentResultData);
        labels.enter().append("text").classed("resultLabel", true);

        labels = this.svgGroup.selectAll("text.resultLabel").data(this.currentResultData);
        labels.attr("x", this.contentWidth + LEGEND_LINE_WIDTH + 2)
              .attr("y", function (data) { return data.y + data.textHeight / 4; })
              .attr("class", function (data) { return "resultLabel result" + data.index; })
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
    * @param {Number} overallWidth Overall width
    * @param {Number} overallHeight Overall height
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
    * @param {Object} data Object that contains various chart data.  This
    *     must contain the following properties:
    *     * chartData {Object} - the data to plot on the chart
    *     * eventData {SplitsBrowser.Model.Event} - the overall Event object.
    *     * courseClassSet {SplitsBrowser.Model.Event} - the course-class set.
    *     * referenceCumTimes {Array} - Array of cumulative split times of the
    *       'reference'.
    *     * fastestCumTimes {Array} - Array of cumulative times of the
    *       imaginary 'fastest' result.
    * @param {Array} selectedIndexes Array of indexes of selected results
    *                (0 in this array means the first result is selected, 1
    *                means the second is selected, and so on.)
    * @param {Array} visibleStatistics Array of boolean flags indicating whether
    *                                  certain statistics are visible.
    * @param {Object} chartType The type of chart being drawn.
    * @param {Number|null} selectedLegIndex The selected leg index, or null for all
    *                                       legs.
    */
    Chart.prototype.drawChart = function (data, selectedIndexes, visibleStatistics, chartType, selectedLegIndex) {
        var chartData = data.chartData;
        this.numControls = chartData.numControls;
        this.numLines = chartData.resultNames.length;
        this.selectedIndexes = selectedIndexes;
        this.referenceCumTimes = data.referenceCumTimes;
        this.fastestCumTimes = data.fastestCumTimes;
        this.eventData = data.eventData;
        this.courseClassSet = data.courseClassSet;
        this.hasControls = data.courseClassSet.getCourse().hasControls();
        this.isRaceGraph = chartType.isRaceGraph;
        this.minViewableControl = chartType.minViewableControl;
        this.visibleStatistics = visibleStatistics;
        this.selectedLegIndex = selectedLegIndex;
        this.hasData = true;

        this.maxStatisticTextWidth = this.determineMaxStatisticTextWidth();
        this.maxStartTimeLabelWidth = (this.isRaceGraph) ? this.determineMaxStartTimeLabelWidth(chartData) : 0;
        this.sortReferenceCumTimes();
        this.adjustContentSize();
        this.createScales(chartData);
        this.drawBackgroundRectangles();
        this.drawAxes(getMessage(chartType.yAxisLabelKey), chartData);
        this.drawChartLines(chartData);
        this.drawResultLegendLabels(chartData);
        this.removeControlLine();
        if (this.isRaceGraph) {
            this.drawResultStartTimeLabels(chartData);
        } else {
            this.removeResultStartTimeLabels();
        }
    };

    SplitsBrowser.Controls.Chart = Chart;
})();

/*
 *  SplitsBrowser ResultsTable - Shows class results in a table.
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

    var formatTime = SplitsBrowser.formatTime;
    var compareResults = SplitsBrowser.Model.compareResults;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    var subtractIfNotNull = SplitsBrowser.subtractIfNotNull;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;

    var NON_BREAKING_SPACE_CHAR = "\u00a0";

    // Maximum precision to show a results-table entry using.
    var MAX_PERMITTED_PRECISION = 2;

    /**
    * A control that shows an entire table of results.
    * @constructor
    * @param {HTMLElement} parent The parent element to add this control to.
    */
    function ResultsTable(parent) {
        this.parent = parent;
        this.courseClass = null;
        this.div = null;
        this.headerSpan = null;
        this.table = null;
        this.selectedLegIndex = null;
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
    * split time between controls punched after 62.7 and 108.7 seconds must be
    * shown as 46.0 seconds, not 46.
    *
    * @param {Array} results Array of Result objects.
    * @return {Number} Maximum precision to use.
    */
    function determinePrecision(results) {
        var maxPrecision = 0;
        var maxPrecisionFactor = 1;
        results.forEach(function (result) {
            result.getAllOriginalCumulativeTimes().forEach(function (cumTime) {
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
    * Returns the contents of the time or status column for the given
    * result.
    *
    * The status may be a string that indicates the result mispunched.
    *
    * @param {Result} result The result to get the status of.
    * @param {Number|null} time The time to format, if the result is OK.
    * @param {Number} precision The precision to use.
    * @return {String} Time or status for the given result.
    */
    function getTimeOrStatus (result, time, precision) {
        if (result.isNonStarter) {
            return getMessage("DidNotStartShort");
        } else if (result.isNonFinisher) {
            return getMessage("DidNotFinishShort");
        } else if (result.isDisqualified) {
            return getMessage("DisqualifiedShort");
        } else if (result.isOverMaxTime) {
            return getMessage("OverMaxTimeShort");
        } else if (result.completed()) {
            return formatTime(time, precision);
        } else {
            return getMessage("MispunchedShort");
        }
    }

    /**
    * Escapes a piece of text as HTML so that it can be concatenated into an
    * HTML string without the risk of any injection.
    * @param {String} value The HTML value to escape.
    * @return {String} The HTML value escaped.
    */
    function escapeHtml(value) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    /**
    * Formats a time (cumulative or split) for a result.  If the result is
    * deemed as completed despite having missing times, any such missing times are
    * replaced with "??:??".
    * @param {Number|null} time The time to format, in seconds.
    * @param {Number} precision The precision to format the time to.
    * @param {Boolean} resultOKDespiteMissingTimes True if the result is known to
    *       have completed the course despite having missing times, false otherwise.
    * @return {String} Formatted time
    */
    function formatPossiblyMissingTime(time, precision, resultOKDespiteMissingTimes) {
        if (time === null && resultOKDespiteMissingTimes) {
            return "??:??";
        } else {
            return formatTime(time, precision);
        }
    }

    /**
    * Populates the contents of the table with the course-class data.
    */
    ResultsTable.prototype.populateTable = function () {
        var headerText = this.courseClass.name + ", ";

        var numControls, controlOffset;
        if (this.courseClass.isTeamClass && this.selectedLegIndex !== null) {
            numControls = this.courseClass.numbersOfControls[this.selectedLegIndex];
            controlOffset = this.courseClass.offsets[this.selectedLegIndex];
        } else {
            numControls = this.courseClass.numControls;
            controlOffset = 0;
        }

        if (this.courseClass.isTeamClass && this.selectedLegIndex !== null) {
            headerText += getMessageWithFormatting("ShowLeg", {"$$LEG_NUMBER$$": this.selectedLegIndex + 1 }) + ", ";
        }

        if (this.courseClass.isTeamClass && this.selectedLegIndex === null) {
            var numControlsString = this.courseClass.numbersOfControls.join(" + ");
            headerText += getMessageWithFormatting("ResultsTableHeaderMultipleControls", {"$$NUM$$": numControlsString});
        } else if (numControls === 1) {
            headerText += getMessage("ResultsTableHeaderSingleControl");
        } else {
            headerText += getMessageWithFormatting("ResultsTableHeaderMultipleControls", {"$$NUM$$": numControls});
        }

        var course = this.courseClass.course;
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

        if (this.courseClass.isTeamClass) {
            var controlNumber;
            if (this.selectedLegIndex === null) {
                for (var legIndex = 0; legIndex < this.courseClass.numbersOfControls.length; legIndex += 1) {
                    var suffix = "-" + (legIndex + 1);
                    for (controlNumber = 1; controlNumber <= this.courseClass.numbersOfControls[legIndex]; controlNumber += 1) {
                        headerCellData.push(controlNumber + suffix);
                    }
                    headerCellData.push(getMessage("FinishName") + suffix);
                }
            } else {
                for (controlNumber = 1; controlNumber <= this.courseClass.numbersOfControls[this.selectedLegIndex]; controlNumber += 1) {
                    headerCellData.push(controlNumber);
                }
                headerCellData.push(getMessage("FinishName"));
            }
        } else {
            var controls = this.courseClass.course.controls;
            if (controls === null) {
                headerCellData = headerCellData.concat(d3.range(1, numControls + 1));
            } else {
                headerCellData = headerCellData.concat(controls.map(function (control, index) {
                    return (index + 1) + NON_BREAKING_SPACE_CHAR + "(" + control + ")";
                }));
            }

            headerCellData.push(getMessage("FinishName"));
        }

        var headerCells = this.table.select("thead tr")
                                    .selectAll("th")
                                    .data(headerCellData);

        headerCells.enter().append("th");
        headerCells.exit().remove();
        headerCells = this.table.select("thead tr")
                                .selectAll("th")
                                .data(headerCellData);

        headerCells.text(function (header) { return header; });

        // Array that accumulates bits of HTML for the table body.
        var htmlBits = [];

        function timeClasses(isFastest, isDubious, isMissing) {
            var classes = [];
            if (isFastest) {
                classes.push("fastest");
            }
            if (isDubious) {
                classes.push("dubious");
            }
            if (isMissing) {
                classes.push("missing");
            }

            return classes.join(" ");
        }

        // Adds a two-line cell to the array of table-body HTML parts.
        // If truthy, cssClass is assumed to be HTML-safe and not require
        // escaping.
        function addCell(topLine, bottomLine, cssClass, cumClasses, splitClasses, tooltip) {
            htmlBits.push("<td");
            if (cssClass) {
                htmlBits.push(" class=\"" + cssClass + "\"");
            }

            if (tooltip) {
                htmlBits.push(" title=\"" + escapeHtml(tooltip) + "\"");
            }

            htmlBits.push("><span");
            if (cumClasses !== "") {
                htmlBits.push(" class=\"" + cumClasses + "\"");
            }

            htmlBits.push(">");
            htmlBits.push(escapeHtml(topLine));
            htmlBits.push("</span><br><span");
            if (splitClasses !== "") {
                htmlBits.push(" class=\"" + splitClasses + "\"");
            }

            htmlBits.push(">");
            htmlBits.push(escapeHtml(bottomLine));
            htmlBits.push("</span></td>\n");
        }

        var results = this.courseClass.results.slice(0);
        results.sort(compareResults);

        var nonCompCount = 0;
        var rank = 0;

        var precision = determinePrecision(results);

        results.forEach(function (result, index) {
            htmlBits.push("<tr><td>");

            if (result.isNonCompetitive) {
                htmlBits.push(escapeHtml(getMessage("NonCompetitiveShort")));
                nonCompCount += 1;
            } else if (result.completed()) {
                if (index === 0 || results[index - 1].totalTime !== result.totalTime) {
                    rank = index + 1 - nonCompCount;
                }

                htmlBits.push("" + rank);
            }

            htmlBits.push("</td>");

            var tooltipText;
            if (this.courseClass.isTeamClass && this.selectedLegIndex === null) {
                tooltipText = result.owner.members.map(function (competitor) { return competitor.name; }).join("\n");
            } else {
                tooltipText = "";
            }

            var startTimeOffset = result.getOriginalCumulativeTimeTo(controlOffset);
            addCell(result.getOwnerNameForLeg(this.selectedLegIndex), result.owner.club, null, "", "", tooltipText);
            var time = (this.courseClass.isTeamClass && this.selectedLegIndex !== null) ? subtractIfNotNull(result.getOriginalCumulativeTimeTo(controlOffset + numControls + 1), startTimeOffset) : result.totalTime;
            addCell(getTimeOrStatus(result, time, precision), NON_BREAKING_SPACE_CHAR, "time", "", "", "");

            d3.range(controlOffset + 1, controlOffset + numControls + 2).forEach(function (controlNum) {
                var cumTime = subtractIfNotNull(result.getOriginalCumulativeTimeTo(controlNum), startTimeOffset);
                var splitTime = result.getOriginalSplitTimeTo(controlNum);
                var formattedCumTime = formatPossiblyMissingTime(cumTime, precision, result.isOKDespiteMissingTimes);
                var formattedSplitTime = formatPossiblyMissingTime(splitTime, precision, result.isOKDespiteMissingTimes);
                var isCumTimeFastest = (result.getCumulativeRankTo(controlNum) === 1);
                var isSplitTimeFastest = (result.getSplitRankTo(controlNum) === 1);
                var isCumDubious = result.isCumulativeTimeDubious(controlNum);
                var isSplitDubious = result.isSplitTimeDubious(controlNum);
                var isCumMissing = result.isOKDespiteMissingTimes && cumTime === null;
                var isSplitMissing = result.isOKDespiteMissingTimes && splitTime === null;
                addCell(formattedCumTime, formattedSplitTime, "time", timeClasses(isCumTimeFastest, isCumDubious, isCumMissing), timeClasses(isSplitTimeFastest, isSplitDubious, isSplitMissing), "");
            });

            htmlBits.push("</tr>\n");

        }, this);

        this.table.select("tbody").node().innerHTML = htmlBits.join("");
    };

    /**
    * Sets the class whose data is displayed.
    * @param {SplitsBrowser.Model.CourseClass} courseClass The class displayed.
    */
    ResultsTable.prototype.setClass = function (courseClass) {
        this.courseClass = courseClass;
        this.selectedLegIndex = null;
        if (this.courseClass !== null) {
            this.populateTable();
        }
    };

    /**
    * Sets the selected leg index.
    * @param {Number|null} selectedLegIndex The selected leg index.
    */
    ResultsTable.prototype.setSelectedLegIndex = function (selectedLegIndex) {
        this.selectedLegIndex = selectedLegIndex;
        if (this.courseClass !== null) {
            this.populateTable();
        }
    };

    /**
    * Shows the table of results.
    */
    ResultsTable.prototype.show = function () {
        this.div.style("display", null);
    };

    /**
    * Hides the table of results.
    */
    ResultsTable.prototype.hide = function () {
        this.div.style("display", "none");
    };

    /**
    * Retranslates the results table following a change of selected language.
    */
    ResultsTable.prototype.retranslate = function () {
        this.populateTable();
    };

    SplitsBrowser.Controls.ResultsTable = ResultsTable;
})();
/*
 *  SplitsBrowser Query-string - Query-string parsing and merging
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

    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var hasProperty = SplitsBrowser.hasProperty;
    var ChartTypes = SplitsBrowser.Model.ChartTypes;
    var CourseClassSet = SplitsBrowser.Model.CourseClassSet;

    /**
    * Remove all matches of the given regular expression from the given string.
    * The regexp is not assumed to contain the "g" flag.
    * @param {String} queryString The query-string to process.
    * @param {RegExp} regexp The regular expression to use to remove text.
    * @return {String} The given query-string with all regexp matches removed.
    */
    function removeAll(queryString, regexp) {
        return queryString.replace(new RegExp(regexp.source, "g"), "");
    }

    var CLASS_NAME_REGEXP = /(?:^|&|\?)class=([^&]+)/;

    /**
    * Reads the selected class names from a query string.
    * @param {String} queryString The query string to read the class name
    *     from.
    * @param {Event} eventData The event data read in, used to validate the
    *     selected classes.
    * @return {CourseClassSet|null} Array of selected CourseClass objects, or null
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
                return new CourseClassSet(selectedClasses);
            }
        }
    }

    /**
    * Formats the selected classes into the given query-string, removing any
    * previous matches.
    * @param {String} queryString The original query-string.
    * @param {Event} eventData The event data.
    * @param {Array} classIndexes Array of indexes of selected classes.
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
    * @param {String} queryString The query string to read the chart type
    *     from.
    * @return {Object|null} Selected chart type, or null if not recognised.
    */
    function readChartType(queryString) {
        var chartTypeMatch = CHART_TYPE_REGEXP.exec(queryString);
        if (chartTypeMatch === null) {
            return null;
        } else {
            var chartTypeName = chartTypeMatch[1];
            if (hasProperty(ChartTypes, chartTypeName)) {
                return ChartTypes[chartTypeName];
            } else {
                return null;
            }
        }
    }

    /**
    * Formats the given chart type into the query-string
    * @param {String} queryString The original query-string.
    * @param {Object} chartType The chart type
    * @return {String} The query-string with the chart-type formatted in.
    */
    function formatChartType(queryString, chartType) {
        queryString = removeAll(queryString, CHART_TYPE_REGEXP);
        for (var chartTypeName in ChartTypes) {
            if (hasProperty(ChartTypes, chartTypeName) && ChartTypes[chartTypeName] === chartType) {
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
    * @param {String} queryString The query string to read the comparison
    *     type from.
    * @param {CourseClassSet|null} courseClassSet Course-class set containing
    *     selected course-classes, or null if none are selected.
    * @return {Object|null} Selected comparison type, or null if not
    *     recognised.
    */
    function readComparison(queryString, courseClassSet) {
        var comparisonMatch = COMPARE_WITH_REGEXP.exec(queryString);
        if (comparisonMatch === null) {
            return null;
        } else {
            var comparisonName = decodeURIComponent(comparisonMatch[1]);
            var defaultIndex = BUILTIN_COMPARISON_TYPES.indexOf(comparisonName);
            if (defaultIndex >= 1) {
                return {index: defaultIndex, result: null};
            } else if (defaultIndex === 0 && courseClassSet !== null) {
                var hasCompleters = courseClassSet.allResults.some(function (result) {
                    return result.completed();
                });

                if (hasCompleters) {
                    return {index: 0, result: null};
                } else {
                    // Cannot select 'Winner' as there was no winner.
                    return null;
                }
            } else if (courseClassSet === null) {
                // Not one of the recognised comparison types and we have no
                // classes to look for result names within.
                return null;
            } else {
                for (var resultIndex = 0; resultIndex < courseClassSet.allResults.length; resultIndex += 1) {
                    var result = courseClassSet.allResults[resultIndex];
                    if (result.owner.name === comparisonName && result.completed()) {
                        return {index: BUILTIN_COMPARISON_TYPES.length, result: result};
                    }
                }

                // Didn't find the result.
                return null;
            }
        }
    }

    /**
    * Formats the given comparison into the given query-string.
    * @param {String} queryString The original query-string.
    * @param {Number} index Index of the comparison type.
    * @param {Result} result The result to format.
    * @return {String} The formatted query-string.
    */
    function formatComparison(queryString, index, result) {
        queryString = removeAll(queryString, COMPARE_WITH_REGEXP);
        var comparison = null;
        if (typeof index === typeof 0 && 0 <= index && index < BUILTIN_COMPARISON_TYPES.length) {
            comparison = BUILTIN_COMPARISON_TYPES[index];
        } else if (result !== null) {
            comparison = result.owner.name;
        }

        if (comparison === null) {
            return queryString;
        } else {
            return queryString + "&compareWith=" + encodeURIComponent(comparison);
        }
    }

    var SELECTED_RESULTS_REGEXP = /(?:^|&|\?)selected=([^&]+)/;

    /**
    * Reads what to compare against.
    * @param {String} queryString The query string to read the comparison
    *     type from.
    * @param {CourseClassSet|null} courseClassSet Course-class set containing
    *     selected course-classes, or null if none are selected.
    * @return {Array|null} Array of selected result indexes, or null if none
    *     found.
    */
    function readSelectedResults(queryString, courseClassSet) {
        if (courseClassSet === null) {
            return null;
        } else {
            var selectedResultsMatch = SELECTED_RESULTS_REGEXP.exec(queryString);
            if (selectedResultsMatch === null) {
                return null;
            } else {
                var resultNames = decodeURIComponent(selectedResultsMatch[1]).split(";");
                if (resultNames.indexOf("*") >= 0) {
                    // All results selected.
                    return d3.range(0, courseClassSet.allResults.length);
                }

                resultNames = d3.set(resultNames).values();
                var allResultNames = courseClassSet.allResults.map(function (result) { return result.owner.name; });
                var selectedResultIndexes = [];
                resultNames.forEach(function (resultName) {
                    var index = allResultNames.indexOf(resultName);
                    if (index >= 0) {
                        selectedResultIndexes.push(index);
                    }
                });

                selectedResultIndexes.sort(d3.ascending);
                return (selectedResultIndexes.length === 0) ? null : selectedResultIndexes;
            }
        }
    }

    /**
    * Formats the given selected results into the given query-string.
    * @param {String} queryString The original query-string.
    * @param {CourseClassSet} courseClassSet The current course-class set.
    * @param {Array} selected Array of indexes within the course-class set's
    *     list of results of those that are selected.
    * @return {String} Query-string with the selected result formatted into it.
    */
    function formatSelectedResults(queryString, courseClassSet, selected) {
        queryString = removeAll(queryString, SELECTED_RESULTS_REGEXP);
        var selectedResults = selected.map(function (index) { return courseClassSet.allResults[index]; });
        if (selectedResults.length === 0) {
            return queryString;
        } else if (selectedResults.length === courseClassSet.allResults.length) {
            // Assume all selected results are different, so all must be
            // selected.
            return queryString + "&selected=*";
        } else {
            var resultNames = selectedResults.map(function (result) { return result.owner.name; }).join(";");
            return queryString + "&selected=" + encodeURIComponent(resultNames);
        }
    }

    var SELECTED_STATISTICS_REGEXP = /(?:^|&|\?)stats=([^&]*)/;

    var ALL_STATS_NAMES = ["TotalTime", "SplitTime", "BehindFastest", "TimeLoss"];

    /**
    * Reads the selected statistics from the query string.
    * @param {String} queryString The query string to read the selected
    *     statistics from.
    * @return {Object|null} Object containing the statistics read, or null
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
                if (hasProperty(stats, name)) {
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
    * @param {String} queryString The original query-string.
    * @param {Object} stats The statistics to format.
    * @return {String} Query-string with the selected statistics formatted in.
    */
    function formatSelectedStatistics(queryString, stats) {
        queryString = removeAll(queryString, SELECTED_STATISTICS_REGEXP);
        var statsNames = ALL_STATS_NAMES.filter(function (name) { return hasProperty(stats, name) && stats[name]; });
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
    * @param {String} queryString The query-string to read.
    * @return {Boolean} True to show original data, false not to.
    */
    function readShowOriginal(queryString) {
        var showOriginalMatch = SHOW_ORIGINAL_REGEXP.exec(queryString);
        return (showOriginalMatch !== null && showOriginalMatch[1] === "1");
    }

    /**
    * Formats the show-original-data flag into the given query-string.
    * @param {String} queryString The original query-string.
    * @param {Boolean} showOriginal True to show original data, false not to.
    * @return {String} The query-string with the show-original-data flag
    *     formatted in.
    */
    function formatShowOriginal(queryString, showOriginal) {
        queryString = removeAll(queryString, SHOW_ORIGINAL_REGEXP);
        return (showOriginal) ? queryString + "&showOriginal=1" : queryString;
    }

    var SELECTED_LEG_REGEXP = /(?:^|&|\?)selectedLeg=([^&]*)/;

    /**
    * Reads the selected leg from the given query-string
    * @param {String} queryString The query-string to read.
    * @return {Number|null} The selected leg, or null for none.
    */
    function readSelectedLeg(queryString) {
        var selectedLegMatch = SELECTED_LEG_REGEXP.exec(queryString);
        if (selectedLegMatch === null) {
            return null;
        } else {
            var legIndex = parseInt(selectedLegMatch[1], 10);
            return (isNaNStrict(legIndex)) ? null : legIndex;
        }
    }

    /**
    * Formats the selected leg into the given query-string.
    * @param {String} queryString The original query-string.
    * @param {Number|null} selectedLeg The selected leg, or null for none.
    * @return {String} The query string with the selected-leg value formatted
    *     in.
    */
    function formatSelectedLeg(queryString, selectedLeg) {
        queryString = removeAll(queryString, SELECTED_LEG_REGEXP);
        return (selectedLeg === null) ? queryString : queryString + "&selectedLeg=" + encodeURIComponent(selectedLeg);
    }

    var FILTER_TEXT_REGEXP = /(?:^|&|\?)filterText=([^&]*)/;

    /**
    * Reads the filter text from the given query string.
    *
    * If no filter text is found, an empty string is returned.
    *
    * @param {String} queryString The query-string to read.
    * @return {String} The filter text read.
    */
    function readFilterText(queryString) {
        var filterTextMatch = FILTER_TEXT_REGEXP.exec(queryString);
        if (filterTextMatch === null) {
            return "";
        } else {
            return decodeURIComponent(filterTextMatch[1]);
        }
    }

    /**
    * Formats filter text into the given query-string.
    * @param {String} queryString The original query-string.
    * @param {String} filterText The filter text.
    * @return {String} The query-string with the filter text formatted in.
    */
    function formatFilterText(queryString, filterText) {
        queryString = removeAll(queryString, FILTER_TEXT_REGEXP);
        return (filterText === "") ? queryString : queryString + "&filterText=" + encodeURIComponent(filterText);
    }

    /**
    * Attempts to parse the given query string.
    * @param {String} queryString The query string to parse.
    * @param {Event} eventData The parsed event data.
    * @return {Object} The data parsed from the given query string.
    */
    function parseQueryString(queryString, eventData) {
        var courseClassSet = readSelectedClasses(queryString, eventData);
        var classIndexes = (courseClassSet === null) ? null : courseClassSet.classes.map(function (courseClass) { return eventData.classes.indexOf(courseClass); });
        return {
            classes: classIndexes,
            chartType: readChartType(queryString),
            compareWith: readComparison(queryString, courseClassSet),
            selected: readSelectedResults(queryString, courseClassSet),
            stats: readSelectedStatistics(queryString),
            showOriginal: readShowOriginal(queryString),
            selectedLeg: readSelectedLeg(queryString),
            filterText: readFilterText(queryString)
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
    * @param {String} queryString The original query-string.
    * @param {Event} eventData The event data.
    * @param {CourseClassSet} courseClassSet The current course-class set.
    * @param {Object} data Object containing the data to format into the
    *     query-string.
    * @return {String} The formatted query-string.
    */
    function formatQueryString(queryString, eventData, courseClassSet, data) {
        queryString = formatSelectedClasses(queryString, eventData, data.classes);
        queryString = formatChartType(queryString, data.chartType);
        queryString = formatComparison(queryString, data.compareWith.index, data.compareWith.result);
        queryString = formatSelectedResults(queryString, courseClassSet, data.selected);
        queryString = formatSelectedStatistics(queryString, data.stats);
        queryString = formatShowOriginal(queryString, data.showOriginal);
        queryString = formatSelectedLeg(queryString, data.selectedLeg);
        queryString = formatFilterText(queryString, data.filterText);
        queryString = queryString.replace(/^\??&/, "");
        return queryString;
    }

    SplitsBrowser.parseQueryString = parseQueryString;
    SplitsBrowser.formatQueryString = formatQueryString;
})();
/*
 *  SplitsBrowser Warning viewer - Allows the user to view any warnings
 *                encountered reading in data files.
 *
 *  Copyright (C) 2000-2016 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var getMessage = SplitsBrowser.getMessage;

    var CONTAINER_DIV_ID = "warningViewerContainer";

    /**
    * Constructs a new WarningViewer object.
    * @constructor
    * @param {d3.selection} parent d3 selection containing the parent to
    *     insert the selector into.
    */
    function WarningViewer(parent) {
        this.parent = parent;
        this.warnings = [];

        this.containerDiv = parent.append("div")
                                  .classed("topRowStart", true)
                                  .attr("id", CONTAINER_DIV_ID)
                                  .style("display", "none");

        this.containerDiv.append("div").classed("topRowStartSpacer", true);

        this.warningTriangle = this.createWarningTriangle(this.containerDiv);

        this.warningList = parent.append("div")
                                 .classed("warningList", true)
                                 .classed("transient", true)
                                 .style("position", "absolute")
                                 .style("display", "none");

        // Ensure that a click outside of the warning list or the selector
        // box closes it.
        // Taken from http://stackoverflow.com/questions/1403615 and adjusted.
        var outerThis = this;
        $(document).click(function (e) {
            if (outerThis.warningList.style("display") !== "none") {
                var container = $("div#warningTriangleContainer,div.warningList");
                if (!container.is(e.target) && container.has(e.target).length === 0) {
                    outerThis.warningList.style("display", "none");
                }
            }
        });

        this.setMessages();
    }

    /**
    * Sets the message shown in the tooltip, either as part of initialisation or
    * following a change of selected language.
    */
    WarningViewer.prototype.setMessages = function () {
        this.containerDiv.attr("title", getMessage("WarningsTooltip"));
    };

    /**
    * Creates the warning triangle.
    * @return {Object} d3 selection containing the warning triangle.
    */
    WarningViewer.prototype.createWarningTriangle = function () {
        var svgContainer = this.containerDiv.append("div")
                                   .attr("id", "warningTriangleContainer");
        var svg = svgContainer.append("svg");

        svg.style("width", "21px")
           .style("height", "19px")
           .style("margin-bottom", "-3px");

        svg.append("polygon")
           .attr("points", "1,18 10,0 19,18")
           .style("stroke", "black")
           .style("stroke-width", "1.5px")
           .style("fill", "#ffd426");

        svg.append("text")
           .attr("x", 10)
           .attr("y", 16)
           .attr("text-anchor", "middle")
           .style("font-size", "14px")
           .text("!");

        var outerThis = this;
        svgContainer.on("click", function () { outerThis.showHideErrorList(); });

        return svg;
    };

    /**
    * Sets the list of visible warnings.
    * @param {Array} warnings Array of warning messages.
    */
    WarningViewer.prototype.setWarnings = function (warnings) {
        var errorsSelection = this.warningList.selectAll("div")
                                              .data(warnings);

        errorsSelection.enter().append("div")
                               .classed("warning", true);

        errorsSelection = this.warningList.selectAll("div")
                                          .data(warnings);

        errorsSelection.text(function (errorMessage) { return errorMessage; });
        errorsSelection.exit().remove();
        this.containerDiv.style("display", (warnings && warnings.length > 0) ? "block" : "none");
    };

    /**
    * Shows or hides the list of warnings.
    */
    WarningViewer.prototype.showHideErrorList = function () {
        if (this.warningList.style("display") === "none") {
            var offset = $(this.warningTriangle.node()).offset();
            var height = $(this.warningTriangle.node()).outerHeight();
            var width = $(this.warningList.node()).outerWidth();
            this.warningList.style("left", Math.max(offset.left - width / 2, 0) + "px")
                                    .style("top", (offset.top + height + 5) + "px")
                                    .style("display", "block");
        } else {
            this.warningList.style("display", "none");
        }
    };

    SplitsBrowser.Controls.WarningViewer = WarningViewer;
})();
/*
 *  SplitsBrowser Viewer - Top-level class that runs the application.
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
    // Delay in milliseconds between a resize event being triggered and the
    // page responding to it.
    // (Resize events tend to come more than one at a time; if a resize event
    // comes in while a previous event is waiting, the previous event is
    // cancelled.)
    var RESIZE_DELAY_MS = 100;

    var Version = SplitsBrowser.Version;

    var getMessage = SplitsBrowser.getMessage;
    var tryGetMessage = SplitsBrowser.tryGetMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    var initialiseMessages = SplitsBrowser.initialiseMessages;

    var Model = SplitsBrowser.Model;
    var ResultSelection = Model.ResultSelection;
    var CourseClassSet = Model.CourseClassSet;
    var ChartTypes = Model.ChartTypes;

    var parseEventData = SplitsBrowser.Input.parseEventData;
    var repairEventData = SplitsBrowser.DataRepair.repairEventData;
    var transferResultData = SplitsBrowser.DataRepair.transferResultData;
    var parseQueryString = SplitsBrowser.parseQueryString;
    var formatQueryString = SplitsBrowser.formatQueryString;

    var Controls = SplitsBrowser.Controls;
    var LanguageSelector = Controls.LanguageSelector;
    var ClassSelector = Controls.ClassSelector;
    var ChartTypeSelector = Controls.ChartTypeSelector;
    var ComparisonSelector = Controls.ComparisonSelector;
    var OriginalDataSelector = Controls.OriginalDataSelector;
    var LegSelector = Controls.LegSelector;
    var StatisticsSelector = Controls.StatisticsSelector;
    var WarningViewer = Controls.WarningViewer;
    var ResultList = Controls.ResultList;
    var Chart = Controls.Chart;
    var ResultsTable = Controls.ResultsTable;

    /**
    * Checks that D3 version 4 or later is present.
    * @return {Boolean} True if D3 version 4 is present, false if no D3 was found
    *     or a version of D3 older version 4 was found.
    */
    function checkD3Version4() {
        if (!window.d3) {
            alert("D3 was not found.  SplitsBrowser requires D3 version 4 or later.");
            return false;
        } else if (parseFloat(d3.version) < 4) {
            alert("D3 version " + d3.version + " was found.  SplitsBrowser requires D3 version 4 or later.");
            return false;
        } else {
            return true;
        }
    }

    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    * @param {Object|String|HTMLElement|undefined} options Optional object
    *     containing various options to SplitsBrowser.
    */
    function Viewer(options) {
        this.options = options;

        this.eventData = null;
        this.classes = null;
        this.currentClasses = [];
        this.chartData = null;
        this.referenceCumTimes = null;
        this.fastestCumTimes = null;
        this.previousResultList = [];

        this.topBarHeight = (options && options.topBar && $(options.topBar).length > 0) ? $(options.topBar).outerHeight(true) : 0;

        this.selection = null;
        this.courseClassSet = null;
        this.languageSelector = null;
        this.classSelector = null;
        this.comparisonSelector = null;
        this.originalDataSelector = null;
        this.legSelector = null;
        this.statisticsSelector = null;
        this.resultList = null;
        this.warningViewer = null;
        this.chart = null;
        this.topPanel = null;
        this.mainPanel = null;
        this.buttonsPanel = null;
        this.resultListContainer = null;
        this.container = null;

        this.currentResizeTimeout = null;
    }

    /**
    * Pops up an alert box with the given message.
    *
    * The viewer passes this function to various controls so that they can pop
    * up an alert box in normal use and call some other function during
    * testing.
    *
    * @param {String} message The message to show.
    */
    function alerter(message) {
        alert(message);
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
    * depending on whether all visible results have start times.
    */
    Viewer.prototype.enableOrDisableRaceGraph = function () {
        var anyStartTimesMissing = this.courseClassSet.allResults.some(function (result) { return result.lacksStartTime(); });
        this.chartTypeSelector.setRaceGraphDisabledNotifier((anyStartTimesMissing) ? alertRaceGraphDisabledAsStartTimesMissing : null);
    };

    /**
    * Sets the classes that the viewer can view.
    * @param {SplitsBrowser.Model.Event} eventData All event data loaded.
    */
    Viewer.prototype.setEvent = function (eventData) {
        this.eventData = eventData;
        this.classes = eventData.classes;
        if (this.classSelector !== null) {
            this.classSelector.setClasses(this.classes);
        }

        this.warningViewer.setWarnings(eventData.warnings);
    };

    /**
    * Draws the logo in the top panel.
    */
    Viewer.prototype.drawLogo = function () {
        this.logoSvg = this.topPanel.append("svg")
                                    .classed("topRowStart", true);

        this.logoSvg.style("width", "19px")
                    .style("height", "19px")
                    .style("margin-bottom", "-3px");

        this.logoSvg.append("rect")
                    .attr("x", "0")
                    .attr("y", "0")
                    .attr("width", "19")
                    .attr("height", "19")
                    .attr("fill", "white");

        this.logoSvg.append("polygon")
                    .attr("points", "0,19 19,0 19,19")
                    .attr("fill", "red");

        this.logoSvg.append("polyline")
                    .attr("points", "0.5,0.5 0.5,18.5 18.5,18.5 18.5,0.5 0.5,0.5 0.5,18.5")
                    .attr("stroke", "black")
                    .attr("fill", "none");

        this.logoSvg.append("polyline")
                    .attr("points", "1,12 5,8 8,14 17,11")
                    .attr("fill", "none")
                    .attr("stroke", "blue")
                    .attr("stroke-width", "2");

        this.logoSvg.selectAll("*")
                    .append("title");

        this.setLogoMessages();
    };

    /**
    * Sets messages in the logo, following either its creation or a change of
    * selected language.
    */
    Viewer.prototype.setLogoMessages = function () {
        this.logoSvg.selectAll("title")
                    .text(getMessageWithFormatting("ApplicationVersion", {"$$VERSION$$": Version}));
    };

    /**
    * Adds a spacer between controls on the top row.
    */
    Viewer.prototype.addSpacer = function () {
        this.topPanel.append("div").classed("topRowStartSpacer", true);
    };

    /**
    * Adds the language selector control to the top panel.
    */
    Viewer.prototype.addLanguageSelector = function () {
        this.languageSelector = new LanguageSelector(this.topPanel.node());
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
        var chartTypes = [
            ChartTypes.SplitsGraph, ChartTypes.RaceGraph, ChartTypes.PositionAfterLeg,
            ChartTypes.SplitPosition, ChartTypes.PercentBehind, ChartTypes.ResultsTable
        ];

        this.chartTypeSelector = new ChartTypeSelector(this.topPanel.node(), chartTypes);
    };

    /**
    * Adds the comparison selector to the top panel.
    */
    Viewer.prototype.addComparisonSelector = function () {
        this.comparisonSelector = new ComparisonSelector(this.topPanel.node(), alerter);
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
    * Adds the leg-selctor control to choose between legs on a relay class.
    */
    Viewer.prototype.addLegSelector = function () {
        this.legSelector = new LegSelector(this.topPanel);
    };

    /**
    * Adds a direct link which links directly to SplitsBrowser with the given
    * settings.
    */
    Viewer.prototype.addDirectLink = function () {
        this.directLink = this.topPanel.append("a")
                                       .classed("topRowStart", true)
                                       .attr("id", "directLinkAnchor")
                                       .attr("href", document.location.href);
        this.setDirectLinkMessages();
    };

    /**
    * Adds the warning viewer to the top panel.
    */
    Viewer.prototype.addWarningViewer = function () {
        this.warningViewer = new WarningViewer(this.topPanel);
    };

    /**
    * Sets the text in the direct-link, following either its creation or a
    * change in selected language.
    */
    Viewer.prototype.setDirectLinkMessages = function () {
        this.directLink.attr("title", tryGetMessage("DirectLinkToolTip", ""))
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
            showOriginal: this.courseClassSet.hasDubiousData() && this.originalDataSelector.isOriginalDataSelected(),
            selectedLeg: this.legSelector.getSelectedLeg(),
            filterText: this.resultList.getFilterText()
        };

        var oldQueryString = document.location.search;
        var newQueryString = formatQueryString(oldQueryString, this.eventData, this.courseClassSet, data);
        var oldHref = document.location.href;
        this.directLink.attr("href", oldHref.substring(0, oldHref.length - oldQueryString.length) + "?" + newQueryString.replace(/^\?+/, ""));
    };

    /**
    * Adds the list of results, and the buttons, to the page.
    */
    Viewer.prototype.addResultList = function () {
        this.resultList = new ResultList(this.mainPanel.node(), alerter);
    };

    /**
    * Construct the UI inside the HTML body.
    */
    Viewer.prototype.buildUi = function () {
        var body = d3.select("body");
        body.style("overflow", "hidden");

        this.container = body.append("div")
                             .attr("id", "sbContainer");

        this.topPanel = this.container.append("div");

        this.drawLogo();
        this.addLanguageSelector();
        this.addSpacer();
        this.addClassSelector();
        this.addLegSelector();
        this.addSpacer();
        this.addChartTypeSelector();
        this.addSpacer();
        this.addComparisonSelector();
        this.addOriginalDataSelector();
        this.addSpacer();
        this.addDirectLink();
        this.addWarningViewer();

        this.statisticsSelector = new StatisticsSelector(this.topPanel.node());

        // Add an empty div to clear the floating divs and ensure that the
        // top panel 'contains' all of its children.
        this.topPanel.append("div")
                     .style("clear", "both");

        this.mainPanel = this.container.append("div");

        this.addResultList();
        this.chart = new Chart(this.mainPanel.node());

        this.resultsTable = new ResultsTable(this.container.node());
        this.resultsTable.hide();

        var outerThis = this;

        $(window).resize(function () { outerThis.handleWindowResize(); });

        // Disable text selection anywhere other than text inputs.
        // This is mainly for the benefit of IE9, which doesn't support any
        // -*-user-select CSS style.
        $("input:text").bind("selectstart", function (evt) { evt.stopPropagation(); });
        $(this.container.node()).bind("selectstart", function () { return false; });

        // Hide 'transient' elements such as the list of other classes in the
        // class selector or warning list when the Escape key is pressed.
        $(document).keydown(function (e) {
            if (e.which === 27) {
                outerThis.hideTransientElements();
            }
        });
    };

    /**
    * Registers change handlers.
    */
    Viewer.prototype.registerChangeHandlers = function () {
        var outerThis = this;
        this.languageSelector.registerChangeHandler(function () { outerThis.retranslate(); });
        this.classSelector.registerChangeHandler(function (indexes) { outerThis.selectClasses(indexes); });
        this.chartTypeSelector.registerChangeHandler(function (chartType) { outerThis.selectChartTypeAndRedraw(chartType); });
        this.comparisonSelector.registerChangeHandler(function (comparisonFunc) { outerThis.selectComparison(comparisonFunc); });
        this.originalDataSelector.registerChangeHandler(function (showOriginalData) { outerThis.showOriginalOrRepairedData(showOriginalData); });
        this.legSelector.registerChangeHandler(function () { outerThis.handleLegSelectionChanged(); });
        this.resultList.registerChangeHandler(function () { outerThis.handleFilterTextChanged(); });
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
        this.setResultListHeight();
        this.setChartSize();
        this.hideTransientElements();
        this.redraw();
    };

    /**
    * Hides all transient elements that happen to be open.
    */
    Viewer.prototype.hideTransientElements = function () {
        d3.selectAll(".transient").style("display", "none");
    };

    /**
    * Returns the horizontal margin around the container, i.e. the sum of the
    * left and right margin, padding and border for the body element and the
    * container element.
    * @return {Number} Total horizontal margin.
    */
    Viewer.prototype.getHorizontalMargin = function () {
        var body = $("body");
        var container = $(this.container.node());
        return (body.outerWidth(true) - body.width()) + (container.outerWidth() - container.width());
    };

    /**
    * Returns the vertical margin around the container, i.e. the sum of the top
    * and bottom margin, padding and border for the body element and the
    * container element.
    * @return {Number} Total vertical margin.
    */
    Viewer.prototype.getVerticalMargin = function () {
        var body = $("body");
        var container = $(this.container.node());
        return (body.outerHeight(true) - body.height()) + (container.outerHeight() - container.height());
    };

    /**
    * Gets the usable height of the window, i.e. the height of the window minus
    * margin and the height of the top bar, if any.  This height is used for
    * the result list and the chart.
    * @return {Number} Usable height of the window.
    */
    Viewer.prototype.getUsableHeight = function () {
        var bodyHeight = $(window).outerHeight() - this.getVerticalMargin() - this.topBarHeight;
        var topPanelHeight = $(this.topPanel.node()).height();
        return bodyHeight - topPanelHeight;
    };

    /**
    * Sets the height of the result list.
    */
    Viewer.prototype.setResultListHeight = function () {
        this.resultList.setHeight(this.getUsableHeight());
    };

    /**
    * Determines the size of the chart and sets it.
    */
    Viewer.prototype.setChartSize = function () {
        // Margin around the body element.
        var horzMargin = this.getHorizontalMargin();
        var vertMargin = this.getVerticalMargin();

        // Extra amount subtracted off of the width of the chart in order to
        // prevent wrapping, in units of pixels.
        // 2 to prevent wrapping when zoomed out to 33% in Chrome.
        var EXTRA_WRAP_PREVENTION_SPACE = 2;

        var containerWidth = $(window).width() - horzMargin;
        var containerHeight = $(window).height() - vertMargin - this.topBarHeight;

        $(this.container.node()).width(containerWidth).height(containerHeight);

        var chartWidth = containerWidth - this.resultList.width() - EXTRA_WRAP_PREVENTION_SPACE;
        var chartHeight = this.getUsableHeight();

        this.chart.setSize(chartWidth, chartHeight);
    };

    /**
    * Draw the chart using the current data.
    */
    Viewer.prototype.drawChart = function () {
        if (this.chartTypeSelector.getChartType().isResultsTable) {
            return;
        }

        this.currentVisibleStatistics = this.statisticsSelector.getVisibleStatistics();

        if (this.selectionChangeHandler !== null) {
            this.selection.deregisterChangeHandler(this.selectionChangeHandler);
        }

        if (this.statisticsChangeHandler !== null) {
            this.statisticsSelector.deregisterChangeHandler(this.statisticsChangeHandler);
        }

        var outerThis = this;

        this.selectionChangeHandler = function () {
            outerThis.resultList.enableOrDisableCrossingRunnersButton();
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
        if (this.classes.length > 0) {
            var legIndex = this.legSelector.getSelectedLeg();
            var comparisonFunction = this.comparisonSelector.getComparisonFunction();
            this.referenceCumTimes = comparisonFunction(this.courseClassSet);
            this.fastestCumTimes = this.courseClassSet.getFastestCumTimes(legIndex);
            this.chartData = this.courseClassSet.getChartData(this.referenceCumTimes, this.selection.getSelectedIndexes(), this.chartTypeSelector.getChartType(), legIndex);
            this.redrawChart();
        }
    };

    /**
    * Redraws the chart using all of the current data.
    */
    Viewer.prototype.redrawChart = function () {
        var data = {
            chartData: this.chartData,
            eventData: this.eventData,
            courseClassSet: this.courseClassSet,
            referenceCumTimes: this.referenceCumTimes,
            fastestCumTimes: this.fastestCumTimes
        };

        this.chart.drawChart(data, this.selection.getSelectedIndexes(), this.currentVisibleStatistics, this.chartTypeSelector.getChartType(), this.legSelector.getSelectedLeg());
    };

    /**
    * Redraw the chart, possibly using new data.
    */
    Viewer.prototype.redraw = function () {
        var chartType = this.chartTypeSelector.getChartType();
        if (!chartType.isResultsTable) {
            this.chartData = this.courseClassSet.getChartData(this.referenceCumTimes, this.selection.getSelectedIndexes(), chartType, this.legSelector.getSelectedLeg());
            this.redrawChart();
        }
    };

    /**
    * Retranslates the UI following a change of language.
    */
    Viewer.prototype.retranslate = function () {
        this.setLogoMessages();
        this.languageSelector.setMessages();
        this.classSelector.retranslate();
        this.chartTypeSelector.setMessages();
        this.comparisonSelector.setMessages();
        this.originalDataSelector.setMessages();
        this.legSelector.setMessages();
        this.setDirectLinkMessages();
        this.statisticsSelector.setMessages();
        this.warningViewer.setMessages();
        this.resultList.retranslate();
        this.resultsTable.retranslate();
        if (!this.chartTypeSelector.getChartType().isResultsTable) {
            this.redrawChart();
        }
    };

    /**
    * Sets the currently-selected classes in various objects that need it:
    * current course-class set, comparison selector and results table.
    * @param {Array} classIndexes Array of selected class indexes.
    */
    Viewer.prototype.setClasses = function (classIndexes) {
        this.currentClasses = classIndexes.map(function (index) { return this.classes[index]; }, this);
        this.courseClassSet = new CourseClassSet(this.currentClasses);
        this.comparisonSelector.setCourseClassSet(this.courseClassSet);
        this.resultsTable.setClass(this.currentClasses.length > 0 ? this.currentClasses[0] : null);
        this.enableOrDisableRaceGraph();
        this.originalDataSelector.setVisible(this.courseClassSet.hasDubiousData());
        this.legSelector.setCourseClassSet(this.courseClassSet);
    };

    /**
    * Initialises the viewer with the given initial classes.
    * @param {Array} classIndexes Array of selected class indexes.
    */
    Viewer.prototype.initClasses = function (classIndexes) {
        this.classSelector.selectClasses(classIndexes);
        this.setClasses(classIndexes);
        this.resultList.setResultList(this.courseClassSet.allResults, (this.currentClasses.length > 1), this.courseClassSet.hasTeamData(), null);
        this.selection = new ResultSelection(this.courseClassSet.allResults.length);
        this.resultList.setSelection(this.selection);
        this.previousResultList = this.courseClassSet.allResults;
    };

    /**
    * Change the graph to show the classes with the given indexes.
    * @param {Number} classIndexes The (zero-based) indexes of the classes.
    */
    Viewer.prototype.selectClasses = function (classIndexes) {
        if (classIndexes.length > 0 && this.currentClasses.length > 0 && this.classes[classIndexes[0]] === this.currentClasses[0]) {
            // The 'primary' class hasn't changed, only the 'other' ones.
            // In this case we don't clear the selection.
        } else {
            this.selection.selectNone();
        }

        this.setClasses(classIndexes);
        this.resultList.setResultList(this.courseClassSet.allResults, (this.currentClasses.length > 1), this.courseClassSet.hasTeamData(), null);
        this.selection.migrate(this.previousResultList, this.courseClassSet.allResults);
        this.resultList.selectionChanged();
        if (!this.chartTypeSelector.getChartType().isResultsTable) {
            this.setChartSize();
            this.drawChart();
        }
        this.previousResultList = this.courseClassSet.allResults;
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
    * @param {Object} chartType The type of chart to draw.
    */
    Viewer.prototype.selectChartType = function (chartType) {
        if (chartType.isResultsTable) {
            this.mainPanel.style("display", "none");

            // Remove any fixed width and height on the container, as well as
            // overflow:hidden on the body, as we need the window to be able
            // to scroll if the results table is too wide or too tall and also
            // adjust size if one or both scrollbars appear.
            this.container.style("width", null).style("height", null);
            d3.select("body").style("overflow", null);

            this.resultsTable.show();
        } else {
            this.resultsTable.hide();
            d3.select("body").style("overflow", "hidden");
            this.mainPanel.style("display", null);
            this.setChartSize();
        }

        this.updateControlEnabledness();
        this.resultList.setChartType(chartType);
    };

    /**
    * Change the type of chart shown.
    * @param {Object} chartType The type of chart to draw.
    */
    Viewer.prototype.selectChartTypeAndRedraw = function (chartType) {
        this.selectChartType(chartType);
        if (!chartType.isResultsTable) {
            this.setResultListHeight();
            this.drawChart();
        }

        this.updateDirectLink();
    };

    /**
    * Selects original or repaired data, doing any recalculation necessary.
    * @param {Boolean} showOriginalData True to show original data, false to
    *     show repaired data.
    */
    Viewer.prototype.selectOriginalOrRepairedData = function (showOriginalData) {
        if (showOriginalData) {
            transferResultData(this.eventData);
        } else {
            repairEventData(this.eventData);
        }

        this.eventData.determineTimeLosses();
    };

    /**
    * Shows original or repaired data.
    * @param {Boolean} showOriginalData True to show original data, false to
    *     show repaired data.
    */
    Viewer.prototype.showOriginalOrRepairedData = function (showOriginalData) {
        this.selectOriginalOrRepairedData(showOriginalData);
        this.drawChart();
        this.updateDirectLink();
    };

    /**
     * Sets the selected leg index in the comparison selector, results list and the results table.
     */
    Viewer.prototype.setSelectedLegIndex = function() {
        this.comparisonSelector.setSelectedLeg(this.legSelector.getSelectedLeg());
        this.resultList.setResultList(this.courseClassSet.allResults, (this.currentClasses.length > 1), this.courseClassSet.hasTeamData(), this.legSelector.getSelectedLeg());
        this.resultsTable.setSelectedLegIndex(this.legSelector.getSelectedLeg());
    };

    /**
    * Handles a change in the selected leg.
    */
    Viewer.prototype.handleLegSelectionChanged = function () {
        this.setSelectedLegIndex();
        this.setChartSize();
        this.drawChart();
        this.updateDirectLink();
    };

    /**
    * Handles a change in the filter text in the result list.
    */
    Viewer.prototype.handleFilterTextChanged = function () {
        this.setChartSize();
        this.redraw();
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
        this.resultList.enableOrDisableCrossingRunnersButton();
    };

    /**
    * Updates the state of the viewer to reflect query-string arguments parsed.
    * @param {Object} parsedQueryString Parsed query-string object.
    */
    Viewer.prototype.updateFromQueryString = function (parsedQueryString) {
        if (parsedQueryString.classes === null) {
            this.setDefaultSelectedClass();
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

        if (parsedQueryString.showOriginal && this.courseClassSet.hasDubiousData()) {
            this.originalDataSelector.selectOriginalData();
            this.selectOriginalOrRepairedData(true);
        }

        if (parsedQueryString.selectedLeg !== null) {
            this.legSelector.setSelectedLeg(parsedQueryString.selectedLeg);
            this.setSelectedLegIndex();
        }

        if (parsedQueryString.filterText !== "") {
            this.resultList.setFilterText(parsedQueryString.filterText);
        }
    };

    /**
    * Sets the default selected class.
    */
    Viewer.prototype.setDefaultSelectedClass = function () {
        this.initClasses((this.classes.length > 0) ? [0] : []);
    };

    SplitsBrowser.Viewer = Viewer;

    /**
    * Shows a message that appears if SplitsBrowser is unable to load event
    * data.
    * @param {String} key The key of the message to show.
    * @param {Object} params Object mapping parameter names to values.
    */
    function showLoadFailureMessage(key, params) {
        var errorDiv = d3.select("body")
                         .append("div")
                         .classed("sbErrors", true);

        errorDiv.append("h1")
                .text(getMessage("LoadFailedHeader"));

        errorDiv.append("p")
                .text(getMessageWithFormatting(key, params));
    }

    /**
    * Reads in the data in the given string and starts SplitsBrowser.
    * @param {String} data String containing the data to read.
    * @param {Object|String|HTMLElement|undefined} options Optional object
    *     containing various options to SplitsBrowser.  It can also be used for
    *     an HTML element that forms a 'banner' across the top of the page.
    *     This element can be specified by a CSS selector for the element, or
    *     the HTML element itself, although this behaviour is deprecated.
    */
    SplitsBrowser.readEvent = function (data, options) {
        if (!checkD3Version4()) {
            return;
        }

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

            if (options && options.defaultLanguage) {
                initialiseMessages(options.defaultLanguage);
            }

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

            viewer.setResultListHeight();
            viewer.setChartSize();
            viewer.drawChart();
            viewer.registerChangeHandlers();
        }
    };

    /**
    * Handles an asynchronous callback that fetched event data, by parsing the
    * data and starting SplitsBrowser.
    * @param {String} data The data returned from the AJAX request.
    * @param {String} status The status of the request.
    * @param {Object|String|HTMLElement|undefined} options Optional object
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
    * @param {jQuery.jqXHR} jqXHR jQuery jqXHR object.
    * @param {String} textStatus The text status of the request.
    * @param {String} errorThrown The error message returned from the server.
    */
    function readEventDataError(jqXHR, textStatus, errorThrown) {
        showLoadFailureMessage("LoadFailedReadError", {"$$ERROR$$": errorThrown});
    }

    /**
    * Loads the event data in the given URL and starts SplitsBrowser.
    * @param {String} eventUrl The URL that points to the event data to load.
    * @param {Object|String|HTMLElement|undefined} options Optional object
    *     containing various options to SplitsBrowser.  It can also be used for
    *     an HTML element that forms a 'banner' across the top of the page.
    *     This element can be specified by a CSS selector for the element, or
    *     the HTML element itself, although this behaviour is deprecated.
    */
    SplitsBrowser.loadEvent = function (eventUrl, options) {
        if (!checkD3Version4()) {
            return;
        }

        $.ajax({
            url: eventUrl,
            data: "",
            success: function (data, status) { readEventData(data, status, options); },
            dataType: "text",
            error: readEventDataError
        });
    };
})();
