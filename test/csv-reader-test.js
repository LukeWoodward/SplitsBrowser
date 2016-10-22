/*
 *  SplitsBrowser - CSV reader tests.
 *  
 *  Copyright (C) 2000-2016 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    "use strict";

    var parseEventData = SplitsBrowser.Input.CSV.parseEventData;
    var fromCumTimes = SplitsBrowser.Model.Competitor.fromCumTimes;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    module("Input.CSV");

    QUnit.test("Cannot parse an empty string", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () { parseEventData(""); });
    });

    QUnit.test("Cannot parse single class with no competitors", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseEventData("Example, 4");
        });
    });

    QUnit.test("Cannot parse single class with non-numeric control count", function (assert) {
        var csvData = "Example, four\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23";
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseEventData(csvData);
        });
    });

    // Allow 0 controls, as that essentially means a start and a finish.
    QUnit.test("Cannot parse single class with negative control count", function (assert) {
        var csvData = "Example, -1\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23";
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseEventData(csvData);
        });
    });

    QUnit.test("Rejects single class with only one item on first line as being of the wrong format", function (assert) {
        var csvData = "There is no control count here\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23";
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(csvData);
        });
    });

    QUnit.test("Rejects single class with too many items on first line as being of the wrong format", function (assert) {
        var csvData = "Example, 4, 2\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23";
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(csvData);
        });
    });

    QUnit.test("Rejects HTML that happens to have a single comma on the first line as being of the wrong format", function (assert) {
        var csvData = "<html><head><title>Blah blah blah, blah blah</title>\n<head><body><p>blah blah blah</p>\n</body>\n</html>\n";
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(csvData);
        });
    });

    QUnit.test("Rejects HTML in capitals that happens to have a single comma on the first line as being of the wrong format", function (assert) {
        var csvData = "<HTML><HEAD><TITLE>Blah blah blah, blah blah</TITLE>\n<HEAD><BODY><P>blah blah blah</P>\n</BODY>\n</HTML>\n";
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(csvData);
        });
    });
    
    QUnit.test("Rejects OE-format file as being of the wrong format", function (assert) {
        var siData = "First name;Surname;City;Start;Time;Short;AgeClass controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;3;01:50;03:38;06:02;\r\n";
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(siData);
        });
    });

    QUnit.test("Can parse a single class with a single valid competitor", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor with start time including seconds", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34:47,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60 + 47, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor when file has LF line-endings", function (assert) {
        var csvData = "Example, 4\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor when file has CR line-endings", function (assert) {
        var csvData = "Example, 4\rJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor when file has trailing commas", function (assert) {
        var csvData = "Example, 4,,,,,,,,,,,\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23,,,,,,,,";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor and an empty class", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\n\r\nEmpty, 6\r\n";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor and an empty class with a negative control count", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\n\r\nEmpty, -1\r\n";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single competitor with zero split converted to a missed control", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,00:00,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, null, 177 + 211, 177 + 211 + 121, 177 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single competitor with all zero splits, marking the competitor as a non-starter", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,00:00,00:00,00:00,00:00,00:00";
        var actualEvent = parseEventData(csvData);
        var expectedCompetitor = fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, null, null, null, null, null]);
        expectedCompetitor.setNonStarter();
        var expectedClass = new CourseClass("Example", 4, [expectedCompetitor]);
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });
    
    QUnit.test("Can parse a single class with a single competitor with zero start time", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,00:00,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", null, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor and trailing end-of-line", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\n";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor with comma in club name", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,DEF,10:34,02:57,01:39,03:31,02:01,00:23\r\n";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC,DEF", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with a single valid competitor and multiple trailing ends-of-line", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\n\r\n\r\n";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with three valid competitors in correct time order", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nFred,Baker,DEF,12:12,02:57,01:39,03:31,02:01,00:23\r\nJane,Palmer,GHI,11:22,02:42,01:51,04:00,01:31,00:30";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 170, 170 + 104, 170 + 104 + 209, 170 + 104 + 209 + 100, 170 + 104 + 209 + 100 + 28]),
            fromCumTimes(2, "Fred Baker", "DEF", 12 * 3600 + 12 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23]),
            fromCumTimes(3, "Jane Palmer", "GHI", 11 * 3600 + 22 * 60, [0, 162, 162 + 111, 162 + 111 + 240, 162 + 111 + 240 + 91, 162 + 111 + 240 + 91 + 30])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with three valid competitors not in correct time order", function (assert) {
        var csvData = "Example, 4\r\nFred,Baker,DEF,12:12,02:57,01:39,03:31,02:01,00:23\r\nJane,Palmer,GHI,11:22,02:42,01:51,04:00,01:31,00:30\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(3, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 170, 170 + 104, 170 + 104 + 209, 170 + 104 + 209 + 100, 170 + 104 + 209 + 100 + 28]),
            fromCumTimes(1, "Fred Baker", "DEF", 12 * 3600 + 12 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23]),
            fromCumTimes(2, "Jane Palmer", "GHI", 11 * 3600 + 22 * 60, [0, 162, 162 + 111, 162 + 111 + 240, 162 + 111 + 240 + 91, 162 + 111 + 240 + 91 + 30])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse two classes each with two valid competitors", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30\r\n\r\n" + 
                      "Another example class, 5\r\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,03:09,00:28\r\nFaye,Claidey,JKL,10:58,02:55,02:00,03:48,01:49,03:32,00:37";
        var actualEvent = parseEventData(csvData);
        var expectedClasses = [
            new CourseClass("Example", 4, [
                fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23]),
                fromCumTimes(2, "Fred Baker", "DEF", 12 * 3600 + 12 * 60, [0, 162, 162 + 111, 162 + 111 + 240, 162 + 111 + 240 + 91, 162 + 111 + 240 + 91 + 30])
            ]),
            new CourseClass("Another example class", 5, [
                fromCumTimes(1, "Jane Palmer", "GHI", 11 * 3600 + 22 * 60, [0, 170, 170 + 104, 170 + 104 + 209, 170 + 104 + 209 + 100, 170 + 104 + 209 + 100 + 189, 170 + 104 + 209 + 100 + 189 + 28]),
                fromCumTimes(2, "Faye Claidey", "JKL", 10 * 3600 + 58 * 60, [0, 175, 175 + 120, 175 + 120 + 228, 175 + 120 + 228 + 109, 175 + 120 + 228 + 109 + 212, 175 + 120 + 228 + 109 + 212 + 37])
            ])
        ];
                
        var expectedCourses = [
            new Course("Example", [expectedClasses[0]], null, null, null),
            new Course("Another example class", [expectedClasses[1]], null, null, null)
        ];
            
        expectedClasses[0].setCourse(expectedCourses[0]);
        expectedClasses[1].setCourse(expectedCourses[1]);
                
        assert.deepEqual(actualEvent, new Event(expectedClasses, expectedCourses));
    });

    QUnit.test("Can parse two classes each with two valid competitors with trailing commas", function (assert) {
        var csvData = "Example, 4,,,,,,,,,,,,,,\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23,,,,\r\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30,,,,\r\n,,,,,,,,,,,,,,,\r\n" + 
                      "Another example class, 5,,,,,,,,\r\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,03:09,00:28,,,,,,,\r\nFaye,Claidey,JKL,10:58,02:55,02:00,03:48,01:49,03:32,00:37,,,,,,,,,,,";
        var actualEvent = parseEventData(csvData);
        assert.strictEqual(actualEvent.classes.length, 2);
        assert.strictEqual(actualEvent.courses.length, 2);
        assert.strictEqual(actualEvent.classes[0].competitors.length, 2);
        assert.strictEqual(actualEvent.classes[1].competitors.length, 2);
    });

    QUnit.test("Can parse two classes each with two valid competitors using LF line-endings", function (assert) {
        var csvData = "Example, 4\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30\n\n" + 
                      "Another example class, 5\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,03:09,00:28\nFaye,Claidey,JKL,10:58,02:55,02:00,03:48,01:49,03:32,00:37";
        var actualEvent = parseEventData(csvData);
        var expectedClasses = [
            new CourseClass("Example", 4, [
                fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23]),
                fromCumTimes(2, "Fred Baker", "DEF", 12 * 3600 + 12 * 60, [0, 162, 162 + 111, 162 + 111 + 240, 162 + 111 + 240 + 91, 162 + 111 + 240 + 91 + 30])
            ]),
            new CourseClass("Another example class", 5, [
                fromCumTimes(1, "Jane Palmer", "GHI", 11 * 3600 + 22 * 60, [0, 170, 170 + 104, 170 + 104 + 209, 170 + 104 + 209 + 100, 170 + 104 + 209 + 100 + 189, 170 + 104 + 209 + 100 + 189 + 28]),
                fromCumTimes(2, "Faye Claidey", "JKL", 10 * 3600 + 58 * 60, [0, 175, 175 + 120, 175 + 120 + 228, 175 + 120 + 228 + 109, 175 + 120 + 228 + 109 + 212, 175 + 120 + 228 + 109 + 212 + 37])
            ])
        ];
                
        var expectedCourses = [
            new Course("Example", [expectedClasses[0]], null, null, null),
            new Course("Another example class", [expectedClasses[1]], null, null, null)
        ];
            
        expectedClasses[0].setCourse(expectedCourses[0]);
        expectedClasses[1].setCourse(expectedCourses[1]);
                
        assert.deepEqual(actualEvent, new Event(expectedClasses, expectedCourses));
    });

    QUnit.test("Can parse a single class with two valid competitors and one mispuncher in correct order", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nJane,Palmer,GHI,11:22,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,-----,01:31,00:30";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 170, 170 + 104, 170 + 104 + 209, 170 + 104 + 209 + 100, 170 + 104 + 209 + 100 + 28]),
            fromCumTimes(2, "Jane Palmer", "GHI", 11 * 3600 + 22 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23]),
            fromCumTimes(3, "Fred Baker", "DEF", 12 * 3600 + 12 * 60, [0, 162, 162 + 111, null, 162 + 111 + 91, 162 + 111 + 91 + 30])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with two valid competitors and one mispuncher not in correct order", function (assert) {
        var csvData = "Example, 4\r\nFred,Baker,DEF,12:12,02:42,01:51,-----,01:31,00:30\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nJane,Palmer,GHI,11:22,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(2, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 170, 170 + 104, 170 + 104 + 209, 170 + 104 + 209 + 100, 170 + 104 + 209 + 100 + 28]),
            fromCumTimes(3, "Jane Palmer", "GHI", 11 * 3600 + 22 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23]),
            fromCumTimes(1, "Fred Baker", "DEF", 12 * 3600 + 12 * 60, [0, 162, 162 + 111, null, 162 + 111 + 91, 162 + 111 + 91 + 30])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Can parse a single class with two valid competitors and two mispunchers not in correct order", function (assert) {
        var csvData = "Example, 4\r\nFred,Baker,DEF,12:12,02:42,01:51,-----,01:31,00:30\r\nJohn,Smith,ABC,10:34,02:50,01:44,03:29,01:40,00:28\r\nFaye,Claidey,JKL,10:37,03:51,-----,-----,08:23,00:49\r\nJane,Palmer,GHI,11:22,02:57,01:39,03:31,02:01,00:23";
        var actualEvent = parseEventData(csvData);
        var expectedClass = new CourseClass("Example", 4, [
            fromCumTimes(2, "John Smith", "ABC", 10 * 3600 + 34 * 60, [0, 170, 170 + 104, 170 + 104 + 209, 170 + 104 + 209 + 100, 170 + 104 + 209 + 100 + 28]),
            fromCumTimes(4, "Jane Palmer", "GHI", 11 * 3600 + 22 * 60, [0, 177, 177 + 99, 177 + 99 + 211, 177 + 99 + 211 + 121, 177 + 99 + 211 + 121 + 23]),
            fromCumTimes(1, "Fred Baker", "DEF", 12 * 3600 + 12 * 60, [0, 162, 162 + 111, null, 162 + 111 + 91, 162 + 111 + 91 + 30]),
            fromCumTimes(3, "Faye Claidey", "JKL", 10 * 3600 + 37 * 60, [0, 231, null, null, 231 + 503, 231 + 503 + 49])
        ]);
        
        var expectedCourse = new Course("Example", [expectedClass], null, null, null);
        expectedClass.setCourse(expectedCourse);
        assert.deepEqual(actualEvent, new Event([expectedClass], [expectedCourse]));
    });

    QUnit.test("Cannot parse a single class with two valid competitors and one competitor with the wrong number of items", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30,01:35\r\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,00:28";
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseEventData(csvData);
        });
    });
})();