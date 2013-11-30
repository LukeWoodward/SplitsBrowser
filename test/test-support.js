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
})();