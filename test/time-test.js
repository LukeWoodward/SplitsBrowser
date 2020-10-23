/*
 *  SplitsBrowser - Time-handling functions tests.
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

    const formatTime = SplitsBrowser.formatTime;
    const formatTimeOfDay = SplitsBrowser.formatTimeOfDay;
    const parseTime = SplitsBrowser.parseTime;

    QUnit.module("Time");

    QUnit.test("Can format a null number of seconds ", function(assert) {
        assert.strictEqual(formatTime(null), SplitsBrowser.NULL_TIME_PLACEHOLDER);
    });

    QUnit.test("Can format a NaN number of seconds ", function(assert) {
        assert.strictEqual(formatTime(NaN), "???");
    });

    QUnit.test("Can format zero seconds as a string ", function(assert) {
        assert.strictEqual(formatTime(0), "00:00");
    });

    QUnit.test("Can format three seconds as a string", function(assert) {
        assert.strictEqual(formatTime(3), "00:03");
    });

    QUnit.test("Can format three point two seconds as a string", function(assert) {
        assert.strictEqual(formatTime(3.2), "00:03.2");
    });

    QUnit.test("Can format three point two five seconds as a string", function(assert) {
        assert.strictEqual(formatTime(3.25), "00:03.25");
    });

    QUnit.test("Can format three point two five one seconds as a string containing three point two five seconds", function(assert) {
        assert.strictEqual(formatTime(3.251), "00:03.25");
    });

    QUnit.test("Can format three point two five eight seconds as a string containing three point two six seconds", function(assert) {
        assert.strictEqual(formatTime(3.258), "00:03.26");
    });

    QUnit.test("Can format three seconds as a string containing three point zero seconds if precision is 1", function(assert) {
        assert.strictEqual(formatTime(3, 1), "00:03.0");
    });

    QUnit.test("Can format three point two seconds as a string containing three point two zero seconds if precision is 2", function(assert) {
        assert.strictEqual(formatTime(3.2, 2), "00:03.20");
    });

    QUnit.test("Can format three point two five seconds as a string containing three point two five seconds if precision is 2", function(assert) {
        assert.strictEqual(formatTime(3.25, 2), "00:03.25");
    });

    QUnit.test("Can format three point two five seconds as a string containing three point three seconds if precision is 1", function(assert) {
        assert.strictEqual(formatTime(3.25, 1), "00:03.3");
    });

    QUnit.test("Can format fifteen seconds as a string", function(assert) {
        assert.strictEqual(formatTime(15), "00:15");
    });

    QUnit.test("Can format one minute as a string", function(assert) {
        assert.strictEqual(formatTime(60), "01:00");
    });

    QUnit.test("Can format one minute one second as a string", function(assert) {
        assert.strictEqual(formatTime(60 + 1), "01:01");
    });

    QUnit.test("Can format eleven minutes forty-two seconds as a string", function(assert) {
        assert.strictEqual(formatTime(11 * 60 + 42), "11:42");
    });

    QUnit.test("Can format an hour as a string", function(assert) {
        assert.strictEqual(formatTime(60 * 60), "1:00:00");
    });

    QUnit.test("Can format three hours, fifty-two minutes and seventeen point seven four seconds as a string", function(assert) {
        assert.strictEqual(formatTime(3 * 60 * 60 + 52 * 60 + 17.74), "3:52:17.74");
    });

    QUnit.test("Can format minus three seconds as a string", function(assert) {
        assert.strictEqual(formatTime(-3), "-00:03");
    });

    QUnit.test("Can format minus fifteen seconds as a string", function(assert) {
        assert.strictEqual(formatTime(-15), "-00:15");
    });

    QUnit.test("Can format minus one minute as a string", function(assert) {
        assert.strictEqual(formatTime(-60), "-01:00");
    });

    QUnit.test("Can format minus one minute one second as a string", function(assert) {
        assert.strictEqual(formatTime(-60 - 1), "-01:01");
    });

    QUnit.test("Can format minus eleven minutes forty-two seconds as a string", function(assert) {
        assert.strictEqual(formatTime(-11 * 60 - 42), "-11:42");
    });

    QUnit.test("Can format minus an hour as a string", function(assert) {
        assert.strictEqual(formatTime(-60 * 60), "-1:00:00");
    });

    QUnit.test("Can format minus three hours, fifty-two minutes and seventeen seconds as a string", function(assert) {
        assert.strictEqual(formatTime(-3 * 60 * 60 - 52 * 60 - 17), "-3:52:17");
    });

    QUnit.test("Can format midnight as a time of day", function(assert) {
        assert.strictEqual(formatTimeOfDay(0), "00:00:00");
    });

    QUnit.test("Can format midnight tomorrow as a time of day", function(assert) {
        assert.strictEqual(formatTimeOfDay(24 * 60 * 60), "00:00:00");
    });

    QUnit.test("Can format a time during the day", function(assert) {
        assert.strictEqual(formatTimeOfDay(11 * 60 * 60 + 54 * 60 + 37), "11:54:37");
    });

    QUnit.test("Can format a time during the next day", function(assert) {
        assert.strictEqual(formatTimeOfDay(24 * 60 * 60 + 19 * 60 * 60 + 24 * 60 + 8), "19:24:08");
    });

    QUnit.test("Can parse a zero minute zero second string to zero", function (assert) {
        assert.strictEqual(parseTime("0:00"), 0);
    });

    QUnit.test("Can parse a one minute two second string with single minute digit to 62 seconds", function (assert) {
        assert.strictEqual(parseTime("1:02"), 62);
    });

    QUnit.test("Can parse a one minute two second string with two-digit minutes to 62 seconds", function (assert) {
        assert.strictEqual(parseTime("01:02"), 62);
    });

    QUnit.test("Can parse a one minute two point seven four second string to 62.47 seconds", function (assert) {
        assert.strictEqual(parseTime("1:02.47"), 62.47);
    });

    QUnit.test("Can parse a one minute two comma seven four second string to 62.47 seconds", function (assert) {
        assert.strictEqual(parseTime("1:02,47"), 62.47);
    });

    QUnit.test("Can parse large time in minutes and seconds correctly", function (assert) {
        assert.strictEqual(parseTime("1479:36"), 1479 * 60 + 36);
    });

    QUnit.test("Can parse zero hour zero minute zero second time to zero", function (assert) {
        assert.strictEqual(parseTime("0:00:00"), 0);
    });

    QUnit.test("Can parse one hour two minute three second time correctly", function (assert) {
        assert.strictEqual(parseTime("1:02:03"), 3600 + 2 * 60 + 3);
    });

    QUnit.test("Can parse one hour two minute three point nine four second time correctly", function (assert) {
        assert.strictEqual(parseTime("1:02:03.94"), 3600 + 2 * 60 + 3.94);
    });

    QUnit.test("Can parse one hour two minute three comma nine four second time correctly", function (assert) {
        assert.strictEqual(parseTime("1:02:03,94"), 3600 + 2 * 60 + 3.94);
    });

    QUnit.test("Can parse large time in hours, minutes and seconds correctly", function (assert) {
        assert.strictEqual(parseTime("781:49:18"), 781 * 3600 + 49 * 60 + 18);
    });

    QUnit.test("Can parse time with negative hours correctly", function (assert) {
        assert.strictEqual(parseTime("-2:49:18"), -2 * 3600 + 49 * 60 + 18);
    });

    QUnit.test("Can parse time with negative minutes correctly", function (assert) {
        assert.strictEqual(parseTime("2:-27:18"), 2 * 3600 - 27 * 60 + 18);
    });

    QUnit.test("Can parse time with negative seconds correctly", function (assert) {
        assert.strictEqual(parseTime("1:08:-44"), 1 * 3600 + 8 * 60 - 44);
    });

    QUnit.test("Can parse time with all components negative correctly", function (assert) {
        assert.strictEqual(parseTime("-3:-56:-22"), -3 * 3600 - 56 * 60 - 22);
    });

    QUnit.test("Can parse a time with leading and trailing whitespace", function (assert) {
        assert.strictEqual(parseTime("   \t    \r\n  \n  13:43   \t \r \r \r\n "), 13 * 60 + 43);
    });

    QUnit.test("Can parse null value placeholder back to null", function (assert) {
        assert.strictEqual(parseTime(SplitsBrowser.NULL_TIME_PLACEHOLDER), null);
    });
})();