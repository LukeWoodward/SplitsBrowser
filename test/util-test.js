/*
 *  SplitsBrowser - Utilities tests.
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
(function() {
    "use strict";

    var isNotNull = SplitsBrowser.isNotNull;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var parseCourseLength = SplitsBrowser.parseCourseLength;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;

    module("Utilities - isNotNull");

    QUnit.test("null is not not-null", function (assert) {
        assert.ok(!isNotNull(null));
    });

    QUnit.test("A not-null value is not null", function (assert) {
        assert.ok(isNotNull("this is not null"));
    });
    
    module("Utilities - isNaNStrict");
    
    QUnit.test("NaN is strictly NaN", function (assert) {
        assert.ok(isNaNStrict(NaN));
    });
    
    QUnit.test("Zero is not strictly NaN", function (assert) {
        assert.ok(!isNaNStrict(0));
    });
    
    QUnit.test("A string that cannot be converted to a number is not strictly NaN", function (assert) {
        assert.ok(!isNaNStrict("xyz"));
    });

    module("Utilities - isNotNullNorNaN");

    QUnit.test("null is not not-null-nor-NaN", function (assert) {
        assert.ok(!isNotNullNorNaN(null));
    });

    QUnit.test("NaN is not not-null-nor-NaN", function (assert) {
        assert.ok(!isNotNullNorNaN(NaN));
    });

    QUnit.test("A finite numeric value is not not null nor NaN", function (assert) {
        assert.ok(isNotNullNorNaN(3));
    });

    QUnit.test("A non-numeric value is not not null nor NaN", function (assert) {
        assert.ok(isNotNullNorNaN("abc"));
    });
    
    module("Utilities - throwInvalidData");

    QUnit.test("throwInvalidData throws an InvalidData exception", function (assert) {

        try {
            throwInvalidData("Test message");
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.strictEqual(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
            assert.strictEqual(e.message, "Test message", "Exception message should be the test message in the function call");
        }
    });

    module("Utilities - throwWrongFileFormat");

    QUnit.test("throwWrongFileFormat throws a WrongFileFormat exception", function (assert) {

        try {
            throwWrongFileFormat("Test message");
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.strictEqual(e.name, "WrongFileFormat", "Exception should have name WrongFileFormat, exception message is " + e.message);
            assert.strictEqual(e.message, "Test message", "Exception message should be the test message in the function call");
        }
    });
    
    module("Utilities - parseCourseLength");
    
    QUnit.test("Can parse course length with no decimal separator", function (assert) {
        assert.strictEqual(parseCourseLength("17"), 17);
    });
    
    QUnit.test("Can parse course length with dot as decimal separator", function (assert) {
        assert.strictEqual(parseCourseLength("6.8"), 6.8);
    });
    
    QUnit.test("Can parse course length with comma as decimal separator", function (assert) {
        assert.strictEqual(parseCourseLength("9,4"), 9.4);
    });
    
    QUnit.test("Can parse course length specified in metres", function (assert) {
        assert.strictEqual(parseCourseLength("9400"), 9.4);
    });
    
    QUnit.test("Attempting to parse invalid course length returns null", function (assert) {
        assert.strictEqual(parseCourseLength("nonsense"), null, "parseCourseLength should return null");
    });
    
    module("Utilities - normaliseLineEndings");
    
    QUnit.test("Can normalise line endings in an empty string", function (assert) {
        assert.strictEqual(normaliseLineEndings(""), "");
    });
    
    QUnit.test("Can normalise line endings in a non-empty string with no line-endings", function (assert) {
        assert.strictEqual(normaliseLineEndings("test 1234 abc"), "test 1234 abc");
    });
    
    QUnit.test("Can normalise line endings in a string with a single LF, leaving the string untouched", function (assert) {
        assert.strictEqual(normaliseLineEndings("test\nabc"), "test\nabc");
    });
    
    QUnit.test("Can normalise line endings in a string with a single CR, changing the CR to a LF", function (assert) {
        assert.strictEqual(normaliseLineEndings("test\rabc"), "test\nabc");
    });
    
    QUnit.test("Can normalise line endings in a string with a single CRLF, changing the CRLF to a LF", function (assert) {
        assert.strictEqual(normaliseLineEndings("test\r\nabc"), "test\nabc");
    });
    
    QUnit.test("Can normalise line endings in a string with multiple LFs, leaving the string untouched", function (assert) {
        assert.strictEqual(normaliseLineEndings("test\nabc\n1234\n"), "test\nabc\n1234\n");
    });
    
    QUnit.test("Can normalise line endings in a string with multiple CRs, changing the CRs to LFs", function (assert) {
        assert.strictEqual(normaliseLineEndings("test\rabc\r1234\r"), "test\nabc\n1234\n");
    });
    
    QUnit.test("Can normalise line endings in a string with multiple CRLFs, changing the CRLFs to LFs", function (assert) {
        assert.strictEqual(normaliseLineEndings("test\r\nabc\r\n1234\r\n"), "test\nabc\n1234\n");
    });
    
    QUnit.test("Can normalise line endings in a string with varying line-endings, changing them all to LFs", function (assert) {
        assert.strictEqual(normaliseLineEndings("test\nabc\r\n1234\r"), "test\nabc\n1234\n");
    });
})();