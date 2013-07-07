"use strict";

/**
 * Utility function used with filters that simply returns the object given.
 * @param x - Any input value
 * @returns The input value.
 */
function isTrue(x) { return x; }

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
