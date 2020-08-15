/*
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
