/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function () {
    "use strict";

    var parseEventData = SplitsBrowser.Input.CSV.parseEventData;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var Course = SplitsBrowser.Model.Course;

    module("Input.CSV");

    QUnit.test("Parsing empty string returns empty array of course data", function (assert) {

        assert.deepEqual(parseEventData(""), []);
    });

    QUnit.test("Parsing single course with no competitors returns single empty course", function (assert) {

        var csvData = "Example, 4";
        var actualCourse = parseEventData(csvData);
        assert.deepEqual(actualCourse, [new Course("Example", 4, [])]);
    });

    QUnit.test("Cannot parse single course with non-numeric control count", function (assert) {

        var csvData = "Example, fifteen";
        try {
            parseEventData(csvData);
            assert.ok(false, "Should not get here - invalid control count should have been reported");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
        }
    });

    // Allow 0 controls, as that essentially means a start and a finish.
    QUnit.test("Cannot parse single course with negative control count", function (assert) {

        var csvData = "Example, -1";
        try {
            parseEventData(csvData);
            assert.ok(false, "Should not get here - negative control count should have been reported");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
        }
    });

    QUnit.test("Cannot parse single course with wrong number of items on first line", function (assert) {

        var csvData = "Example, 4, 2";
        try {
            parseEventData(csvData);
            assert.ok(false, "Should not get here - wrong number of items on first line should have been reported");
        } catch (e) {
            assert.equal(e.name, "WrongFileFormat", "Exception should have name InvalidData, exception message is " + e.message);
        }
    });

    QUnit.test("Can parse a single course with a single valid competitor", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23";
        var actualCourse = parseEventData(csvData);
        var expectedCourse = [new Course("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", "10:34", [177, 99, 211, 121, 23])
        ])];
        assert.deepEqual(actualCourse, expectedCourse);
    });

    QUnit.test("Can parse a single course with a single valid competitor and trailing end-of-line", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\n";
        var actualCourse = parseEventData(csvData);
        var expectedCourse = [new Course("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", "10:34", [177, 99, 211, 121, 23])
        ])];
        assert.deepEqual(actualCourse, expectedCourse);
    });

    QUnit.test("Can parse a single course with a single valid competitor and multiple trailing ends-of-line", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\n\r\n\r\n";
        var actualCourse = parseEventData(csvData);
        var expectedCourse = [new Course("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", "10:34", [177, 99, 211, 121, 23])
        ])];
        assert.deepEqual(actualCourse, expectedCourse);
    });

    QUnit.test("Can parse a single course with three valid competitors in correct time order", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nFred,Baker,DEF,12:12,02:57,01:39,03:31,02:01,00:23\r\nJane,Palmer,GHI,11:22,02:42,01:51,04:00,01:31,00:30";
        var actualCourse = parseEventData(csvData);
        var expectedCourse = [new Course("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", "10:34", [170, 104, 209, 100, 28]),
            fromSplitTimes(2, "Fred", "Baker", "DEF", "12:12", [177, 99, 211, 121, 23]),
            fromSplitTimes(3, "Jane", "Palmer", "GHI", "11:22", [162, 111, 240, 91, 30])
        ])];
        assert.deepEqual(actualCourse, expectedCourse);
    });

    QUnit.test("Can parse a single course with three valid competitors not in correct time order", function (assert) {
        var csvData = "Example, 4\r\nFred,Baker,DEF,12:12,02:57,01:39,03:31,02:01,00:23\r\nJane,Palmer,GHI,11:22,02:42,01:51,04:00,01:31,00:30\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28";
        var actualCourse = parseEventData(csvData);
        var expectedCourse = [new Course("Example", 4, [
            fromSplitTimes(3, "John", "Smith", "ABC", "10:34", [170, 104, 209, 100, 28]),
            fromSplitTimes(1, "Fred", "Baker", "DEF", "12:12", [177, 99, 211, 121, 23]),
            fromSplitTimes(2, "Jane", "Palmer", "GHI", "11:22", [162, 111, 240, 91, 30])
        ])];
        assert.deepEqual(actualCourse, expectedCourse);
    });


    QUnit.test("Can parse two courses each with two valid competitors", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30\r\n\r\n" + 
                      "Another example course, 5\r\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,03:09,00:28\r\nFaye,Claidey,JKL,10:58,02:55,02:00,03:48,01:49,03:32,00:37";
        var actualCourse = parseEventData(csvData);
        var expectedCourse = [
            new Course("Example", 4, [
                fromSplitTimes(1, "John", "Smith", "ABC", "10:34", [177, 99, 211, 121, 23]),
                fromSplitTimes(2, "Fred", "Baker", "DEF", "12:12", [162, 111, 240, 91, 30])]),
            new Course("Another example course", 5, [
                fromSplitTimes(1, "Jane", "Palmer", "GHI", "11:22", [170, 104, 209, 100, 189, 28]),
                fromSplitTimes(2, "Faye", "Claidey", "JKL", "10:58", [175, 120, 228, 109, 212, 37])])];
        assert.deepEqual(actualCourse, expectedCourse);
    });

    QUnit.test("Can parse a single course with two valid competitors and one mispuncher in correct order", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nJane,Palmer,GHI,11:22,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,-----,01:31,00:30";
        var actualCourse = parseEventData(csvData);
        var expectedCourse = [new Course("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", "10:34", [170, 104, 209, 100, 28]),
            fromSplitTimes(2, "Jane", "Palmer", "GHI", "11:22", [177, 99, 211, 121, 23]),
            fromSplitTimes(3, "Fred", "Baker", "DEF", "12:12", [162, 111, null, 91, 30])
        ])];
        assert.deepEqual(actualCourse, expectedCourse);
    });

    QUnit.test("Can parse a single course with two valid competitors and one mispuncher not in correct order", function (assert) {
        var csvData = "Example, 4\r\nFred,Baker,DEF,12:12,02:42,01:51,-----,01:31,00:30\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nJane,Palmer,GHI,11:22,02:57,01:39,03:31,02:01,00:23";
        var actualCourse = parseEventData(csvData);
        var expectedCourse = [new Course("Example", 4, [
            fromSplitTimes(2, "John", "Smith", "ABC", "10:34", [170, 104, 209, 100, 28]),
            fromSplitTimes(3, "Jane", "Palmer", "GHI", "11:22", [177, 99, 211, 121, 23]),
            fromSplitTimes(1, "Fred", "Baker", "DEF", "12:12", [162, 111, null, 91, 30])
        ])];
        assert.deepEqual(actualCourse, expectedCourse);
    });

    QUnit.test("Can parse a single course with two valid competitors and two mispunchers not in correct order", function (assert) {
        var csvData = "Example, 4\r\nFred,Baker,DEF,12:12,02:42,01:51,-----,01:31,00:30\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nFaye,Claidey,JKL,10:37,03:51,-----,-----,08:23,00:49\r\nJane,Palmer,GHI,11:22,02:57,01:39,03:31,02:01,00:23";
        var actualCourse = parseEventData(csvData);
        var expectedCourse = [new Course("Example", 4, [
            fromSplitTimes(2, "John", "Smith", "ABC", "10:34", [170, 104, 209, 100, 28]),
            fromSplitTimes(4, "Jane", "Palmer", "GHI", "11:22", [177, 99, 211, 121, 23]),
            fromSplitTimes(1, "Fred", "Baker", "DEF", "12:12", [162, 111, null, 91, 30]),
            fromSplitTimes(3, "Faye", "Claidey", "JKL", "10:37", [231, null, null, 503, 49])
        ])];
        assert.deepEqual(actualCourse, expectedCourse);
    });

    QUnit.test("Cannot parse a single course with two valid competitors and one competitor with the wrong number of items", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30,01:35\r\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,00:28";
        try {
            var actualCourse = parseEventData(csvData);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
        }
    });
})();