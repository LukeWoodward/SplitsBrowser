/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function () {
    "use strict";

    var parseEventData = SplitsBrowser.Input.CSV.parseEventData;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    module("Input.CSV");

    QUnit.test("Parsing empty string returns empty array of class data", function (assert) {

        assert.deepEqual(parseEventData(""), new Event([], []));
    });

    QUnit.test("Parsing single class with no competitors returns single empty class and course", function (assert) {

        var csvData = "Example, 4";
        var actualClass = parseEventData(csvData);
        var ageClass = new AgeClass("Example", 4, []);
        var course = new Course("Example", [ageClass], null, null);
        ageClass.setCourse(course);
        assert.deepEqual(actualClass, new Event([ageClass], [course]));
    });

    QUnit.test("Cannot parse single class with non-numeric control count", function (assert) {

        var csvData = "Example, fifteen";
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseEventData(csvData);
        });
    });

    // Allow 0 controls, as that essentially means a start and a finish.
    QUnit.test("Cannot parse single class with negative control count", function (assert) {

        var csvData = "Example, -1";
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseEventData(csvData);
        });
    });

    QUnit.test("Rejects single class with only one item on first line as being of the wrong format", function (assert) {

        var csvData = "There is no control count here";
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(csvData);
        });
    });

    QUnit.test("Rejects single class with too many items on first line as being of the wrong format", function (assert) {

        var csvData = "Example, 4, 2";
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(csvData);
        });
    });
    
    QUnit.test("Rejects SI-format file as being of the wrong format", function (assert) {
        var siData = "First name;Surname;City;Start;Time;Short;AgeClass controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;3;01:50;03:38;06:02;\r\n";
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(siData);
        });
    });

    QUnit.test("Can parse a single class with a single valid competitor", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new AgeClass("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600 + 34 * 60, [177, 99, 211, 121, 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null);
        expectedClass.setCourse(expectedCourse);
        
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Cannot parse a single class with a single competitor with zero split", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,00:00,03:31,02:01,00:23";
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseEventData(csvData);
        });
    });

    QUnit.test("Can parse a single class with a single valid competitor and trailing end-of-line", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\n";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new AgeClass("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600 + 34 * 60, [177, 99, 211, 121, 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor and multiple trailing ends-of-line", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\n\r\n\r\n";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new AgeClass("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600 + 34 * 60, [177, 99, 211, 121, 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with three valid competitors in correct time order", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nFred,Baker,DEF,12:12,02:57,01:39,03:31,02:01,00:23\r\nJane,Palmer,GHI,11:22,02:42,01:51,04:00,01:31,00:30";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new AgeClass("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600 + 34 * 60, [170, 104, 209, 100, 28]),
            fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600 + 12 * 60, [177, 99, 211, 121, 23]),
            fromSplitTimes(3, "Jane", "Palmer", "GHI", 11 * 3600 + 22 * 60, [162, 111, 240, 91, 30])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with three valid competitors not in correct time order", function (assert) {
        var csvData = "Example, 4\r\nFred,Baker,DEF,12:12,02:57,01:39,03:31,02:01,00:23\r\nJane,Palmer,GHI,11:22,02:42,01:51,04:00,01:31,00:30\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new AgeClass("Example", 4, [
            fromSplitTimes(3, "John", "Smith", "ABC", 10 * 3600 + 34 * 60, [170, 104, 209, 100, 28]),
            fromSplitTimes(1, "Fred", "Baker", "DEF", 12 * 3600 + 12 * 60, [177, 99, 211, 121, 23]),
            fromSplitTimes(2, "Jane", "Palmer", "GHI", 11 * 3600 + 22 * 60, [162, 111, 240, 91, 30])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });


    QUnit.test("Can parse two clases each with two valid competitors", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30\r\n\r\n" + 
                      "Another example class, 5\r\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,03:09,00:28\r\nFaye,Claidey,JKL,10:58,02:55,02:00,03:48,01:49,03:32,00:37";
        var actualEvent = parseEventData(csvData);
        var expectedClasses = [
            new AgeClass("Example", 4, [
                fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600 + 34 * 60, [177, 99, 211, 121, 23]),
                fromSplitTimes(2, "Fred", "Baker", "DEF", 12 * 3600 + 12 * 60, [162, 111, 240, 91, 30])]),
            new AgeClass("Another example class", 5, [
                fromSplitTimes(1, "Jane", "Palmer", "GHI", 11 * 3600 + 22 * 60, [170, 104, 209, 100, 189, 28]),
                fromSplitTimes(2, "Faye", "Claidey", "JKL", 10 * 3600 + 58 * 60, [175, 120, 228, 109, 212, 37])])];
                
        var expectedCourses = [
            new Course("Example", [expectedClasses[0]], null, null),
            new Course("Another example class", [expectedClasses[1]], null, null)];
            
        expectedClasses[0].setCourse(expectedCourses[0]);
        expectedClasses[1].setCourse(expectedCourses[1]);
                
        assert.deepEqual(actualEvent, new Event(expectedClasses, expectedCourses));
    });

    QUnit.test("Can parse a single class with two valid competitors and one mispuncher in correct order", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nJane,Palmer,GHI,11:22,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,-----,01:31,00:30";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new AgeClass("Example", 4, [
            fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600 + 34 * 60, [170, 104, 209, 100, 28]),
            fromSplitTimes(2, "Jane", "Palmer", "GHI", 11 * 3600 + 22 * 60, [177, 99, 211, 121, 23]),
            fromSplitTimes(3, "Fred", "Baker", "DEF", 12 * 3600 + 12 * 60, [162, 111, null, 91, 30])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with two valid competitors and one mispuncher not in correct order", function (assert) {
        var csvData = "Example, 4\r\nFred,Baker,DEF,12:12,02:42,01:51,-----,01:31,00:30\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nJane,Palmer,GHI,11:22,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new AgeClass("Example", 4, [
            fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600 + 34 * 60, [170, 104, 209, 100, 28]),
            fromSplitTimes(3, "Jane", "Palmer", "GHI", 11 * 3600 + 22 * 60, [177, 99, 211, 121, 23]),
            fromSplitTimes(1, "Fred", "Baker", "DEF", 12 * 3600 + 12 * 60, [162, 111, null, 91, 30])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with two valid competitors and two mispunchers not in correct order", function (assert) {
        var csvData = "Example, 4\r\nFred,Baker,DEF,12:12,02:42,01:51,-----,01:31,00:30\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nFaye,Claidey,JKL,10:37,03:51,-----,-----,08:23,00:49\r\nJane,Palmer,GHI,11:22,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new AgeClass("Example", 4, [
            fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600 + 34 * 60, [170, 104, 209, 100, 28]),
            fromSplitTimes(4, "Jane", "Palmer", "GHI", 11 * 3600 + 22 * 60, [177, 99, 211, 121, 23]),
            fromSplitTimes(1, "Fred", "Baker", "DEF", 12 * 3600 + 12 * 60, [162, 111, null, 91, 30]),
            fromSplitTimes(3, "Faye", "Claidey", "JKL", 10 * 3600 + 37 * 60, [231, null, null, 503, 49])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Cannot parse a single class with two valid competitors and one competitor with the wrong number of items", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30,01:35\r\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,00:28";
        SplitsBrowserTest.assertInvalidData(assert, function () {
            var actualClass = parseEventData(csvData);
        });
    });
})();