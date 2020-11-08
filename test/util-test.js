/*
 *  SplitsBrowser - Utilities tests.
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
(function() {
    "use strict";

    const isNotNull = SplitsBrowser.isNotNull;
    const isNaNStrict = SplitsBrowser.isNaNStrict;
    const isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    const throwInvalidData = SplitsBrowser.throwInvalidData;
    const throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    const hasProperty = SplitsBrowser.hasProperty;
    const addIfNotNull = SplitsBrowser.addIfNotNull;
    const subtractIfNotNull = SplitsBrowser.subtractIfNotNull;
    const parseCourseLength = SplitsBrowser.parseCourseLength;
    const parseCourseClimb = SplitsBrowser.parseCourseClimb;
    const normaliseLineEndings = SplitsBrowser.normaliseLineEndings;

    QUnit.module("Utilities - isNotNull");

    QUnit.test("null is not not-null", assert => assert.ok(!isNotNull(null)));

    QUnit.test("A not-null value is not null", assert => assert.ok(isNotNull("this is not null")));

    QUnit.module("Utilities - isNaNStrict");

    QUnit.test("NaN is strictly NaN", assert => assert.ok(isNaNStrict(NaN)));

    QUnit.test("Zero is not strictly NaN", assert => assert.ok(!isNaNStrict(0)));

    QUnit.test("A string that cannot be converted to a number is not strictly NaN", assert => assert.ok(!isNaNStrict("xyz")));

    QUnit.module("Utilities - isNotNullNorNaN");

    QUnit.test("null is not not-null-nor-NaN", assert => assert.ok(!isNotNullNorNaN(null)));

    QUnit.test("NaN is not not-null-nor-NaN", assert => assert.ok(!isNotNullNorNaN(NaN)));

    QUnit.test("A finite numeric value is not not null nor NaN", assert => assert.ok(isNotNullNorNaN(3)));

    QUnit.test("A non-numeric value is not not null nor NaN", assert => assert.ok(isNotNullNorNaN("abc")));

    QUnit.module("Utilities - throwInvalidData");

    QUnit.test("throwInvalidData throws an InvalidData exception", assert => {
        try {
            throwInvalidData("Test message");
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.strictEqual(e.name, "InvalidData", `Exception should have name InvalidData, exception message is ${e.message}`);
            assert.strictEqual(e.message, "Test message", "Exception message should be the test message in the function call");
        }
    });

    QUnit.module("Utilities - throwWrongFileFormat");

    QUnit.test("throwWrongFileFormat throws a WrongFileFormat exception", assert => {
        try {
            throwWrongFileFormat("Test message");
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.strictEqual(e.name, "WrongFileFormat", `Exception should have name WrongFileFormat, exception message is ${e.message}`);
            assert.strictEqual(e.message, "Test message", "Exception message should be the test message in the function call");
        }
    });

    QUnit.module("Utilities - hasProperty");

    QUnit.test("hasProperty returns true for a property an object has",
        assert => assert.strictEqual(hasProperty({"propName": "value"}, "propName"), true));

    QUnit.test("hasProperty returns false for a property an object does not have",
        assert => assert.strictEqual(hasProperty({"propName": "value"}, "someOtherPropertyName"), false));

    QUnit.test("hasProperty returns false for a property an object inherits through the prototype chain",
        assert => assert.strictEqual(hasProperty({"propName": "value"}, "__proto__"), false));

    QUnit.module("Utilities - addIfNotNull");

    QUnit.test("Can add two not-null numbers to get a not null result", assert => assert.strictEqual(addIfNotNull(2, 3), 5));

    QUnit.test("Can add a number and null to get a null result", assert => assert.strictEqual(addIfNotNull(2, null), null));

    QUnit.test("Can add null and a number to get a null result", assert => assert.strictEqual(addIfNotNull(null, 3), null));

    QUnit.test("Can add two nulls to get a null result", assert => assert.strictEqual(addIfNotNull(null, null), null));

    QUnit.module("Utilities - subtractIfNotNull");

    QUnit.test("Can subtract a number from a number to get a not null result", assert => assert.strictEqual(subtractIfNotNull(7, 4), 3));

    QUnit.test("Can subtract null from a number to get a null result", assert => assert.strictEqual(subtractIfNotNull(7, null), null));

    QUnit.test("Can subtract a number from null to get a null result", assert => assert.strictEqual(subtractIfNotNull(null, 4), null));

    QUnit.test("Can subtract two nulls to get a null result", assert => assert.strictEqual(subtractIfNotNull(null, null), null));

    QUnit.module("Utilities - parseCourseLength");

    QUnit.test("Can parse course length with no decimal separator", assert => assert.strictEqual(parseCourseLength("17"), 17));

    QUnit.test("Can parse course length with dot as decimal separator", assert => assert.strictEqual(parseCourseLength("6.8"), 6.8));

    QUnit.test("Can parse course length with comma as decimal separator", assert => assert.strictEqual(parseCourseLength("9,4"), 9.4));

    QUnit.test("Can parse course length specified in metres", assert => assert.strictEqual(parseCourseLength("9400"), 9.4));

    QUnit.test("Attempting to parse invalid course length returns null",
        assert => assert.strictEqual(parseCourseLength("nonsense"), null));

    QUnit.module("Utilities - parseCourseClimb");

    QUnit.test("Can parse course climb with no decimal separator", assert => assert.strictEqual(parseCourseClimb("145"), 145));

    QUnit.test("Attempting to parse invalid course climb returns null", assert => assert.strictEqual(parseCourseClimb("nonsense"), null));

    QUnit.module("Utilities - normaliseLineEndings");

    QUnit.test("Can normalise line endings in an empty string", assert => assert.strictEqual(normaliseLineEndings(""), ""));

    QUnit.test("Can normalise line endings in a non-empty string with no line-endings",
        assert => assert.strictEqual(normaliseLineEndings("test 1234 abc"), "test 1234 abc"));

    QUnit.test("Can normalise line endings in a string with a single LF, leaving the string untouched",
        assert => assert.strictEqual(normaliseLineEndings("test\nabc"), "test\nabc"));

    QUnit.test("Can normalise line endings in a string with a single CR, changing the CR to a LF",
        assert => assert.strictEqual(normaliseLineEndings("test\rabc"), "test\nabc"));

    QUnit.test("Can normalise line endings in a string with a single CRLF, changing the CRLF to a LF",
        assert => assert.strictEqual(normaliseLineEndings("test\r\nabc"), "test\nabc"));

    QUnit.test("Can normalise line endings in a string with multiple LFs, leaving the string untouched",
        assert => assert.strictEqual(normaliseLineEndings("test\nabc\n1234\n"), "test\nabc\n1234\n"));

    QUnit.test("Can normalise line endings in a string with multiple CRs, changing the CRs to LFs",
        assert => assert.strictEqual(normaliseLineEndings("test\rabc\r1234\r"), "test\nabc\n1234\n"));

    QUnit.test("Can normalise line endings in a string with multiple CRLFs, changing the CRLFs to LFs",
        assert => assert.strictEqual(normaliseLineEndings("test\r\nabc\r\n1234\r\n"), "test\nabc\n1234\n"));

    QUnit.test("Can normalise line endings in a string with varying line-endings, changing them all to LFs",
        assert => assert.strictEqual(normaliseLineEndings("test\nabc\r\n1234\r"), "test\nabc\n1234\n"));
})();