/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function () {
    "use strict";
    
    var parseEventData = SplitsBrowser.Input.SI.parseEventData;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    module("Input.SI");
    
    /**
    * Runs a test for parsing invalid data that should fail.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {String} invalidData - The invalid string to parse.
    * @param {String} what - Description of the invalid data.
    * @param {String} exceptionName - Optional name of the exception (defaults
    *     to InvalidData.
    */
    function runInvalidDataTest(assert, invalidData, what, exceptionName) {
        try {
            parseEventData(invalidData);
            assert.ok(false, "Should throw an exception for parsing " + what);
        } catch (e) {
            assert.strictEqual(e.name, exceptionName || "InvalidData", "Exception should have been InvalidData; message is " + e.message);
        }    
    }
    
    QUnit.test("Cannot parse an empty string", function (assert) {
        runInvalidDataTest(assert, "", "an empty string", "WrongFileFormat");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1", "data with a header row only", "WrongFileFormat");
    });
    
    QUnit.test("Cannot parse a string that is not semicolon-delimited data", function (assert) {
        runInvalidDataTest(assert, "This is not a valid data format", "invalid data", "WrongFileFormat");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;11:27:45;06:33;Test class;1;Test course;4.1;140;3;01:50;03:38;06:02;\r\n");
        assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
        assert.strictEqual(eventData.classes.length, 1, "There should be one class");
        assert.ok(eventData.classes[0] instanceof AgeClass, "Class element should be an AgeClass object");
        assert.strictEqual(eventData.classes[0].numControls, 3, "Class should have three controls");
        assert.strictEqual(eventData.classes[0].name, "Test class", "Class should have correct name");
        assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        
        assert.strictEqual(eventData.courses.length, 1, "There should be one course");
        var course = eventData.courses[0];
        assert.strictEqual(course.name, "Test course", "Course name should be correct");
        assert.strictEqual(course.length, 4.1, "Course length should be correct");
        assert.strictEqual(course.climb, 140, "Course climb should be correct");
        assert.deepEqual(course.classes, [eventData.classes[0]], "The one class in the course should be the one course");
        
        var competitor = eventData.classes[0].competitors[0];
        assert.strictEqual(competitor.forename, "John", "Should read correct forename");
        assert.strictEqual(competitor.surname, "Smith", "Should read correct surname");
        assert.strictEqual(competitor.club, "ABC", "Should read correct club");
        assert.strictEqual(competitor.startTime, 11 * 3600 + 27 * 60 + 45, "Should read correct start time");
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 110, 218, 362, 393], "Should read correct cumulative times");
        
        assert.strictEqual(eventData.classes[0].course, course, "Class should refer to its course");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with missing course length and climb", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;11:27:45;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n");
        assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
        
        assert.strictEqual(eventData.courses.length, 1, "There should be one course");
        var course = eventData.courses[0];
        assert.strictEqual(course.name, "Test course", "Course name should be correct");
        assert.strictEqual(course.length, null, "Course length should be null");
        assert.strictEqual(course.climb, null, "Course climb should be null");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data ignoring second blank City column", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;City;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1; ;Test course;4.1;140;3;01:50;03:38;06:02;\r\n");
        assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
        assert.strictEqual(eventData.classes.length, 1, "There should be one class");
        assert.ok(eventData.classes[0] instanceof AgeClass, "Array element should be an AgeClass object");
        assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        
        var competitor = eventData.classes[0].competitors[0];
        assert.strictEqual(competitor.club, "ABC", "Should read correct club");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with a missed control", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;mp;Test course;4.1;140;3;01:50;-----;06:02;\r\n");
        assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
        assert.strictEqual(eventData.classes.length, 1, "There should be one class");
        assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        
        var competitor = eventData.classes[0].competitors[0];
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 110, null, 362, 393], "Should read correct cumulative times");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with a missed control and remove the trailing 'mp' from the surname", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith mp;ABC;10:00:00;06:33;Test class;mp;Test course;4.1;140;3;01:50;-----;06:02;\r\n");
        assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
        assert.strictEqual(eventData.classes.length, 1, "There should be one class");
        assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        
        var competitor = eventData.classes[0].competitors[0];
        assert.strictEqual(competitor.surname, "Smith", "Should read correct surname without 'mp' suffix");
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 110, null, 362, 393], "Should read correct cumulative times");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data and remove the trailing 'n/c' from the surname", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith n/c;ABC;10:00:00;06:33;Test class;n/c;Test course;4.1;140;3;01:50;03:38;06:02;\r\n");
        assert.ok(eventData instanceof Event, "Result of parsing should be an Event object");
        assert.strictEqual(eventData.classes.length, 1, "There should be one class");
        assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read");
        
        var competitor = eventData.classes[0].competitors[0];
        assert.strictEqual(competitor.surname, "Smith", "Should read correct surname without 'n/c' suffix");
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 110, 218, 362, 393], "Should read correct cumulative times");
        assert.ok(competitor.isNonCompetitive, "Competitor should be marked as non-competitive");
    });
    
    QUnit.test("Can parse a string that contains two competitors in the same class and course", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;4.1;140;3;01:50;03:38;06:02;\r\n" +
                           "Fred;Baker;DEF;10:30:00;07:11;Test class;2;Test course;4.1;140;3;02:01;04:06;06:37;\r\n");
        assert.strictEqual(eventData.classes.length, 1, "There should be one class");
        assert.ok(eventData.classes[0] instanceof AgeClass, "Array element should be an AgeClass object");
        assert.strictEqual(eventData.classes[0].numControls, 3, "Class should have three controls");
        assert.strictEqual(eventData.classes[0].competitors.length, 2, "Two competitors should have been read");
        
        assert.strictEqual(eventData.classes[0].competitors[0].forename, "John", "Should read correct forename for first competitor");
        assert.strictEqual(eventData.classes[0].competitors[1].forename, "Fred", "Should read correct forename for second competitor");
        
        assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "Course should be set on the class");
    });
    
    QUnit.test("Can parse a string that contains two competitors in the same class but different course", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course 1;4.1;140;3;01:50;03:38;06:02;\r\n" +
                           "Fred;Baker;DEF;10:30:00;07:11;Test class;2;Test course 2;4.1;140;3;02:01;04:06;06:37;\r\n");
        assert.strictEqual(eventData.classes.length, 1, "There should be one class");
        assert.ok(eventData.classes[0] instanceof AgeClass, "Array element should be an AgeClass object");
        assert.strictEqual(eventData.classes[0].numControls, 3, "Class should have three controls");
        assert.strictEqual(eventData.classes[0].competitors.length, 2, "Two competitors should have been read");
        
        assert.strictEqual(eventData.classes[0].competitors[0].forename, "John", "Should read correct forename for first competitor");
        assert.strictEqual(eventData.classes[0].competitors[1].forename, "Fred", "Should read correct forename for second competitor");
        
        assert.strictEqual(eventData.courses.length, 1, "There should be one element in the courses array");
        assert.strictEqual(eventData.courses[0].name, "Test course 1", "The course name should be the first course");
        
        assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "Course should be set on the class");
    });
    
    QUnit.test("Can parse a string that contains two competitors in the same course but different class", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class 1;1;Test course;4.1;140;3;01:50;03:38;06:02;\r\n" +
                           "Fred;Baker;DEF;10:30:00;07:11;Test class 2;1;Test course;4.1;140;3;02:01;04:06;06:37;\r\n");
        assert.strictEqual(eventData.classes.length, 2, "There should be two classes");
        assert.strictEqual(eventData.classes[0].competitors.length, 1, "First class should have two competitors");
        assert.strictEqual(eventData.classes[1].competitors.length, 1, "Second class should have two competitors");
        
        assert.strictEqual(eventData.classes[0].competitors[0].forename, "John", "Should read correct forename for first competitor");
        assert.strictEqual(eventData.classes[1].competitors[0].forename, "Fred", "Should read correct forename for second competitor");
        
        assert.strictEqual(eventData.courses.length, 1, "There should be one element in the courses array");
        assert.strictEqual(eventData.courses[0].name, "Test course", "The course name should be correct");
        assert.deepEqual(eventData.courses[0].classes, eventData.classes, "The course should have the two classes");
        
        assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "Course should be set on the first class");
        assert.strictEqual(eventData.classes[1].course, eventData.courses[0], "Course should be set on the second class");
    });
    
    QUnit.test("Can parse a string that contains a course with two classes where one class is used in another course into an event with a single course", function (assert) {
        var dataString = "First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                         "John;Smith;ABC;10:00:00;06:33;Test class 1;1;Test course 1;4.1;140;3;01:50;03:38;06:02;\r\n" +
                         "Fred;Baker;DEF;10:30:00;07:11;Test class 2;1;Test course 1;4.1;140;3;02:01;04:06;06:37;\r\n" +
                         "Bill;Jones;GHI;11:00:00;06:58;Test class 2;1;Test course 2;4.1;140;3;01:48;03:46;05:59;\r\n";
                         
        var eventData = parseEventData(dataString);
        assert.strictEqual(eventData.classes.length, 2, "There should be two classes");
        assert.strictEqual(eventData.classes[0].competitors.length, 1, "First class should have two competitors");
        assert.strictEqual(eventData.classes[1].competitors.length, 2, "Second class should have two competitors");
        
        assert.strictEqual(eventData.classes[0].competitors[0].forename, "John", "Should read correct forename for competitor in first class");
        assert.strictEqual(eventData.classes[1].competitors[0].forename, "Fred", "Should read correct forename for first competitor in second class");
        
        assert.strictEqual(eventData.courses.length, 1, "There should be one element in the courses array");
        assert.strictEqual(eventData.courses[0].name, "Test course 1", "The course name should be correct");
        assert.deepEqual(eventData.courses[0].classes, eventData.classes, "The course should have the two classes");
        
        assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "Course should be set on the first class");
        assert.strictEqual(eventData.classes[1].course, eventData.courses[0], "Course should be set on the second class");
    });
    
    QUnit.test("Can parse a string that contains two competitors on different classes and courses", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;Punch4;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class 1;1;Test course 1;4.1;140;3;01:50;03:38;06:02;\r\n" +
                           "Fred;Baker;DEF;10:30:00;09:54;Test class 2;1;Test course 2;5.3;155;4;02:01;04:06;06:37;09:10\r\n");
        assert.strictEqual(eventData.classes.length, 2, "There should be two classes");
        assert.ok(eventData.classes[0] instanceof AgeClass, "First array element should be an AgeClass object");
        assert.ok(eventData.classes[1] instanceof AgeClass, "Second array element should be an AgeClass object");
        assert.strictEqual(eventData.classes[0].numControls, 3, "First class should have three controls");
        assert.strictEqual(eventData.classes[1].numControls, 4, "Second class should have four controls");
        assert.strictEqual(eventData.classes[0].competitors.length, 1, "One competitor should have been read for the first class");
        assert.strictEqual(eventData.classes[1].competitors.length, 1, "One competitor should have been read for the second class");
        assert.strictEqual(eventData.classes[0].competitors[0].forename, "John", "Should read correct forename for competitor on first class");
        assert.strictEqual(eventData.classes[1].competitors[0].forename, "Fred", "Should read correct forename for competitor on second class");
        
        assert.strictEqual(eventData.courses.length, 2, "There should be two elements in the courses array");
        assert.ok(eventData.courses[0] instanceof Course, "First array element should be a Course object");
        assert.ok(eventData.courses[1] instanceof Course, "Second array element should be a Course object");
        assert.strictEqual(eventData.courses[0].name, "Test course 1", "First course should have correct name");
        assert.strictEqual(eventData.courses[1].name, "Test course 2", "Second course should have correct name");
        assert.deepEqual(eventData.courses[0].classes, [eventData.classes[0]], "First course should use the first class only");
        assert.deepEqual(eventData.courses[1].classes, [eventData.classes[1]], "Second course should use the second class only");
        assert.strictEqual(eventData.courses[0].length, 4.1, "First course length should be correct");
        assert.strictEqual(eventData.courses[0].climb, 140, "First course climb should be correct");
        assert.strictEqual(eventData.courses[1].length, 5.3, "Second course length should be correct");
        assert.strictEqual(eventData.courses[1].climb, 155, "Second course climb should be correct");
        
        assert.strictEqual(eventData.classes[0].course, eventData.courses[0], "First course should be set on the first class");
        assert.strictEqual(eventData.classes[1].course, eventData.courses[1], "Second course should be set on the second class");
    });
    
    QUnit.test("Can parse a string that contains two competitors on different classes, sorting the classes into order", function (assert) {
        var eventData = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;Punch4;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class 2;1;Test course 1;4.1;140;3;01:50;03:38;06:02;\r\n" +
                           "Fred;Baker;DEF;10:30:00;09:54;Test class 1;1;Test course 2;5.3;155;4;02:01;04:06;06:37;09:10\r\n");
        assert.strictEqual(eventData.classes.length, 2, "There should be two elements in the array");
        assert.ok(eventData.classes[0] instanceof AgeClass, "First array element should be an AgeClass object");
        assert.ok(eventData.classes[1] instanceof AgeClass, "Second array element should be an AgeClass object");
        assert.strictEqual(eventData.classes[0].name, "Test class 1", "First class should be first class alphabetically");
        assert.strictEqual(eventData.classes[1].name, "Test class 2", "Second class should be second class alphabetically");
        assert.strictEqual(eventData.classes[0].competitors[0].forename, "Fred", "Should read correct forename for competitor on first class");
        assert.strictEqual(eventData.classes[1].competitors[0].forename, "John", "Should read correct forename for competitor on second class");
        
        assert.strictEqual(eventData.courses.length, 2, "There should be two elements in the courses array");
        assert.ok(eventData.courses[0] instanceof Course, "First array element should be a Course object");
        assert.ok(eventData.courses[1] instanceof Course, "Second array element should be a Course object");
        assert.strictEqual(eventData.courses[0].name, "Test course 1", "First course should have correct name");
        assert.strictEqual(eventData.courses[1].name, "Test course 2", "Second course should have correct name");
        assert.deepEqual(eventData.courses[0].classes, [eventData.classes[1]], "First course should use the second class only");
        assert.deepEqual(eventData.courses[1].classes, [eventData.classes[0]], "Second course should use the first class only");
        
        assert.strictEqual(eventData.classes[0].course, eventData.courses[1], "Second course should be set on the first class");
        assert.strictEqual(eventData.classes[1].course, eventData.courses[0], "First course should be set on the second class");
    });
    
    QUnit.test("Cannot parse a string that contains no first name column", function (assert) {
        runInvalidDataTest(assert, "First name XYZ;Surname;City;Start;Time;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no first-name column");
    });
    
    QUnit.test("Cannot parse a string that contains no surname column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname XYZ;City;Start;Time;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no surname column");
    });
    
    QUnit.test("Cannot parse a string that contains no club column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;Club XYZ;Start;Time;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no club column");
    });
    
    QUnit.test("Cannot parse a string that contains no start column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start XYZ;Time;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no start column");
    });
    
    QUnit.test("Cannot parse a string that contains no time column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time XYZ;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no time column");
    });
    
    QUnit.test("Cannot parse a string that contains no class column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short XYZ;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no class column");
    });

    QUnit.test("Cannot parse a string that contains no placing column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl XYZ;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no placing column");
    });

    QUnit.test("Cannot parse a string that contains no course column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course XYZ;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no course-controls column");
    });

    QUnit.test("Cannot parse a string that contains no 'course controls' column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course;Course controls XYZ;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no course-controls column");
    });
    
    QUnit.test("Cannot parse a string that contains no Punch N column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course;Course controls;Punch1;Punch2 XYZ;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with no Control2 column");
    });
    
    QUnit.test("Cannot parse a string that contains cumulative time less than previous", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;07:38;06:02;\r\n", "data with cumulative times not strictly ascending");
    });
    
    QUnit.test("Cannot parse a string that contains cumulative time equal to previous", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;3;01:50;06:02;06:02;\r\n", "data with cumulative times not strictly ascending");
    });
    
    QUnit.test("Cannot parse a string that contains cumulative time less than previous before mispunch", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;mp;Test course;3;04:37;-----;04:22;\r\n", "data with cumulative times not strictly ascending with mispunch in middle");
    });
    
    QUnit.test("Cannot parse a string that contains total time less than last split time", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;05:33;Test class;1;Test course;3;01:50;03:38;06:02;\r\n", "data with cumulative times not strictly ascending");
    });
})();