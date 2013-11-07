
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
    */
    SplitsBrowserTest.assertException = function (assert, exceptionName, func) {
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
    */
    SplitsBrowserTest.assertInvalidData = function (assert,  func) {
        SplitsBrowserTest.assertException(assert, "InvalidData", func);
    };
})();