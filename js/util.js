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
