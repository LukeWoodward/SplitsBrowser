"use strict";

/**
 * Utility function used with filters that simply returns the object given.
 * @param x - Any input value
 * @returns The input value.
 */
function isTrue(x) { return x; }

/**
* Utility function that returns whether a value is null.
* @param x - Any input value.
* @returns True if the value is not null, false otherwise.
*/
function isNotNull(x) { return x !== null; }

/**
* Exception object raised if invalid data is passed.
* @constructor.
* @param {string} message - The exception detail message.
*/
function InvalidData(message) {
    this.name = "InvalidData";
    this.message = message;
};

/**
* Returns a string representation of this exception.
* @returns {String} String representation.
*/
InvalidData.prototype.toString = function () {
    return this.name + ": " + this.message;
}

/**
* Utility function to throw an 'InvalidData' exception object.
* @param {string} message - The exception message.
* @throws {InvalidData}
*/
function throwInvalidData(message) {
    throw new InvalidData(message);
}

/**
* Formats a time period given as a number of seconds as a string in the form
*  [-][h:]mm:ss.
* @param {Number} seconds - The number of seconds.
* @returns {string} The string formatting of the time.
*/
function formatTime(seconds) {
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
}
