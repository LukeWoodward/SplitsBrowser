/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function() {
    "use strict";

    var isNotNull = SplitsBrowser.isNotNull;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;

    module("Utilities - isNotNull");

    QUnit.test("null is not not-null", function (assert) {
        assert.ok(!isNotNull(null));
    });

    QUnit.test("A not-null value is not null", function (assert) {
        assert.ok(isNotNull("this is not null"));
    });

    module("Utilities - throwInvalidData");

    QUnit.test("throwInvalidData throws an InvalidData exception", function (assert) {

        try {
            throwInvalidData("Test message");
            assert.fail("This should not be reached");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
            assert.equal(e.message, "Test message", "Exception message should be the test message in the function call");
        }
    });

    module("Utilities - throwWrongFileFormat");

    QUnit.test("throwWrongFileFormat throws a WrongFileFormat exception", function (assert) {

        try {
            throwWrongFileFormat("Test message");
            assert.fail("This should not be reached");
        } catch (e) {
            assert.equal(e.name, "WrongFileFormat", "Exception should have name WrongFileFormat, exception message is " + e.message);
            assert.equal(e.message, "Test message", "Exception message should be the test message in the function call");
        }
    });
})();