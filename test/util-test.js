"use strict";

module("Utilities");

QUnit.test("throwInvalidData throws an InvalidData exception", function (assert) {

    try {
        throwInvalidData("Test message");
        assert.fail("This should not be reached");
    } catch (e) {
        assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
        assert.equal(e.message, "Test message", "Exception message should be the test message in the function call");
    }
});
