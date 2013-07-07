"use strict";

module("Utilities - isNotNull");

QUnit.test("null is not not-null", function (assert) {
    assert.ok(!isNotNull(null));
});

QUnit.test("A not-null value null is not null", function (assert) {
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

module("Utilities - formatTime");

QUnit.test("Can format zero seconds as a string ", function(assert) {
    assert.equal(formatTime(0), "00:00");
});

QUnit.test("Can format three seconds as a string", function(assert) {
    assert.equal(formatTime(3), "00:03");
});

QUnit.test("Can format fifteen seconds as a string", function(assert) {
    assert.equal(formatTime(15), "00:15");
});

QUnit.test("Can format one minute as a string", function(assert) {
    assert.equal(formatTime(60), "01:00");
});

QUnit.test("Can format one minute one second as a string", function(assert) {
    assert.equal(formatTime(60 + 1), "01:01");
});

QUnit.test("Can format eleven minutes forty-two seconds as a string", function(assert) {
    assert.equal(formatTime(11 * 60 + 42), "11:42");
});

QUnit.test("Can format an hour as a string", function(assert) {
    assert.equal(formatTime(60 * 60), "1:00:00");
});

QUnit.test("Can format three hours, fifty-two minutes and seventeen seconds as a string", function(assert) {
    assert.equal(formatTime(3 * 60 * 60 + 52 * 60 + 17), "3:52:17");
});

QUnit.test("Can format minus three seconds as a string", function(assert) {
    assert.equal(formatTime(-3), "-00:03");
});

QUnit.test("Can format minus fifteen seconds as a string", function(assert) {
    assert.equal(formatTime(-15), "-00:15");
});

QUnit.test("Can format minus one minute as a string", function(assert) {
    assert.equal(formatTime(-60), "-01:00");
});

QUnit.test("Can format minus one minute one second as a string", function(assert) {
    assert.equal(formatTime(-60 - 1), "-01:01");
});

QUnit.test("Can format minus eleven minutes forty-two seconds as a string", function(assert) {
    assert.equal(formatTime(-11 * 60 - 42), "-11:42");
});

QUnit.test("Can format minus an hour as a string", function(assert) {
    assert.equal(formatTime(-60 * 60), "-1:00:00");
});

QUnit.test("Can format minus three hours, fifty-two minutes and seventeen seconds as a string", function(assert) {
    assert.equal(formatTime(-3 * 60 * 60 - 52 * 60 - 17), "-3:52:17");
});