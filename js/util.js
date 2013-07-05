"use strict";

/**
 * Utility function used with filters that simply returns the object given.
 * @param x - Any input value
 * @returns The input value.
 */
function isTrue(x) { return x; }

function InvalidData(message) {
    this.name = "InvalidData";
    this.message = message;
};

//InvalidData.prototype = new Error;

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
* Utility function used when sorting numbers.
* @param {Number} x - One number to compare.
* @param {Number} y - Another number to compare.
* @returns {Number} A positive number if x > y, a negative number if x < y and
*                   zero if x == y.
*/
function compareNumbers(x, y) {
    return x - y;
}
