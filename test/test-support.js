/*
 *  SplitsBrowser - Utilities to assist with testing.
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
/* eslint no-redeclare: "off" */
const SplitsBrowserTest = {};

(function () {

    const isNaNStrict = SplitsBrowser.isNaNStrict;
    const Competitor = SplitsBrowser.Model.Competitor;
    const Result = SplitsBrowser.Model.Result;

    /**
    * Asserts that calling the given function throws an exception with the
    * given name.
    *
    * The function given is called with no arguments.
    *
    * @param {QUnit.assert} assert QUnit assert object.
    * @param {String} exceptionName The name of the exception to expect.
    * @param {Function} func The function to call.
    * @param {String|undefined} failureMessage Optional message to show in assertion
    *     failure message if no exception is thrown.  A default message is used
    *     instead if this is not specified.
    */
    SplitsBrowserTest.assertException = function (assert, exceptionName, func, failureMessage) {
        try {
            func();
            assert.ok(false, failureMessage || `An exception with name '${exceptionName}' should have been thrown, but no exception was thrown`);
        } catch (e) {
            assert.strictEqual(e.name, exceptionName, `Exception with name '${exceptionName}' should have been thrown, message was ${e.message}`);
        }
    };

    /**
    * Asserts that calling the given function throws an InvalidData exception.
    *
    * The function given is called with no arguments.
    *
    * @param {QUnit.assert} assert QUnit assert object.
    * @param {Function} func The function to call.
    * @param {String|undefined} failureMessage Optional message to show in assertion
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
    * @param {QUnit.assert} assert QUnit assert object.
    * @param {Array} actualArray The 'actual' array of numbers.
    * @param {Array} expectedArray The 'expected' array of numbers.
    */
    SplitsBrowserTest.assertStrictEqualArrays = function (assert, actualArray, expectedArray) {
        assert.ok($.isArray(actualArray), "actualArray is not an array");
        assert.ok($.isArray(expectedArray), "expectedArray is not an array");
        assert.strictEqual(actualArray.length, expectedArray.length,
            `Lengths should be the same: expected ${expectedArray.length}, actual ${actualArray.length}`);

        for (let index = 0; index < expectedArray.length; index += 1) {
            if (isNaNStrict(expectedArray[index])) {
                assert.ok(isNaNStrict(actualArray[index]), `Expected array has NaN at index ${index} so actual array should do too.  Actual value ${actualArray[index]}`);
            } else {
                assert.strictEqual(actualArray[index], expectedArray[index], `Array values at index ${index} should be strict-equal`);
            }
        }
    };

    /**
    * Returns the sum of two numbers, or null if either is null.
    * @param {Number|null} a One number, or null, to add.
    * @param {Number|null} b The other number, or null, to add.
    * @return {Number|null} null if at least one of a or b is null,
    *      otherwise a + b.
    */
    function addIfNotNull(a, b) {
        return (a === null || b === null) ? null : (a + b);
    }

    /**
    * Convenience method to create a result from split times.
    *
    * This method has been moved out of Result because it is no longer used by
    * SplitsBrowser itself, but has been retained as it is used by plenty of
    * tests.
    *
    * @param {Number} order The position of the competitor within the list of results.
    * @param {String} name The name of the competitor.
    * @param {String} club The name of the competitor's club.
    * @param {Number} startTime The competitor's start time, as seconds past midnight.
    * @param {Array} splitTimes Array of split times, as numbers, with nulls for missed controls.
    * @return {Result} Created result.
    */
    SplitsBrowserTest.fromSplitTimes = function (order, name, club, startTime, splitTimes) {
        let cumTimes = [0];
        for (let i = 0; i < splitTimes.length; i += 1) {
            cumTimes.push(addIfNotNull(cumTimes[i], splitTimes[i]));
        }

        let result = new Result(order, startTime, splitTimes, cumTimes, new Competitor(name, club));
        result.splitTimes = splitTimes;
        result.cumTimes = cumTimes;
        return result;
    };

    /**
     * Creates and returns a Map containing selected statistics.
     * @param {Boolean} totalTime Whether the 'Total Time' statistic is selected.
     * @param {Boolean} splitTime Whether the 'Split Time' statistic is selected.
     * @param {Boolean} behindFastest Whether the 'Behind Fastest' statistic is selected.
     * @param {Boolean} timeLoss Whether the 'Time Loss' statistic is selected.
     * @return {Map} The created map.
     */
    SplitsBrowserTest.makeStatsMap = function(totalTime, splitTime, behindFastest, timeLoss) {
        return new Map([
            ["TotalTime", totalTime],
            ["SplitTime", splitTime],
            ["BehindFastest", behindFastest],
            ["TimeLoss", timeLoss]
        ]);
    };
})();