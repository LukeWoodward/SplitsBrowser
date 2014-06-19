/*
 *  SplitsBrowser - Utilities to assist with testing.
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
var SplitsBrowserTest = {};

(function () {

    var isNaNStrict = SplitsBrowser.isNaNStrict;

    /**
    * Asserts that calling the given function throws an exception with the
    * given name.
    *
    * The function given is called with no arguments.
    *
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {String} exceptionName - The name of the exception to expect.
    * @param {Function} func - The function to call.
    * @param {String} failureMessage - Optional message to show in assertion
    *     failure message if no exception is thrown.  A default message is used
    *     instead if this is not specified.
    */
    SplitsBrowserTest.assertException = function (assert, exceptionName, func, failureMessage) {
        try {
            func();
            assert.ok(false, failureMessage || "An exception with name '" + exceptionName + "' should have been thrown, but no exception was thrown");
        } catch (e) {
            assert.strictEqual(e.name, exceptionName, "Exception with name '" + exceptionName + "' should have been thrown, message was " + e.message);
        }
    };

    /**
    * Asserts that calling the given function throws an InvalidData exception.
    *
    * The function given is called with no arguments.
    *
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Function} func - The function to call.
    * @param {String} failureMessage - Optional message to show in assertion
    *     failure message if no exception is thrown.  A default message is used
    *     instead if this is not specified.
    */
    SplitsBrowserTest.assertInvalidData = function (assert,  func, failureMessage) {
        SplitsBrowserTest.assertException(assert, "InvalidData", func, failureMessage);
    };
    
        
    /**
    * Asserts that two arrays of numbers have the same length and the
    * corresponding elements are strict-equal to one another.  This function
    * assumes NaN to be equal to itself.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Array} actualArray - The 'actual' array of numbers.
    * @param {Array} expectedArray - The 'expected' array of numbers.
    */
    SplitsBrowserTest.assertStrictEqualArrays = function (assert, actualArray, expectedArray) {
        assert.ok($.isArray(actualArray), "actualArray is not an array");
        assert.ok($.isArray(expectedArray), "expectedArray is not an array");
        assert.strictEqual(actualArray.length, expectedArray.length,
            "Lengths should be the same: expected " + expectedArray.length + ", actual " + actualArray.length);
        
        for (var index = 0; index < expectedArray.length; index += 1) {
            if (isNaNStrict(expectedArray[index])) {
                assert.ok(isNaNStrict(actualArray[index]), "Expected array has NaN at index " + index + " so actual array should do too.  Actual value " + actualArray[index]);
            } else {
                assert.strictEqual(actualArray[index], expectedArray[index], "Array values at index " + index + " should be strict-equal");
            }
        }
    };
})();