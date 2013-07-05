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


QUnit.test("compareNumbers returns a negative number for first number less than second", function (assert) {
    assert.ok(compareNumbers(3, 7) < 0);
});

QUnit.test("compareNumbers returns a positive number for first number greater than second", function (assert) {
    assert.ok(compareNumbers(8, 5) > 0);
});

QUnit.test("compareNumbers returns zero for first number equal to second", function (assert) {
    assert.ok(compareNumbers(6, 6) == 0);
});
