/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function () {
    "use strict";
    
    var parseEventData = SplitsBrowser.Input.SI.parseEventData;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    
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
            assert.equal(e.name, exceptionName || "InvalidData", "Exception should have been InvalidData; message is " + e.message);
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
        var results = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;11:27:45;06:33;Test class;1;3;01:50;03:38;06:02;\r\n");
        assert.ok($.isArray(results), "Parsing output not an array");
        assert.equal(results.length, 1, "There should be one element in the array");
        assert.ok(results[0] instanceof AgeClass, "Array element should be an AgeClass object");
        assert.equal(results[0].numControls, 3, "Class should have three controls");
        assert.equal(results[0].name, "Test class", "Class should have correct name");
        assert.equal(results[0].competitors.length, 1, "One competitor should have been read");
        
        var competitor = results[0].competitors[0];
        assert.equal(competitor.forename, "John", "Should read correct forename");
        assert.equal(competitor.surname, "Smith", "Should read correct surname");
        assert.equal(competitor.club, "ABC", "Should read correct club");
        assert.equal(competitor.startTime, 11 * 3600 + 27 * 60 + 45, "Should read correct start time");
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 110, 218, 362, 393], "Should read correct cumulative times");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data ignoring second blank City column", function (assert) {
        var results = parseEventData("First name;Surname;City;Start;Time;Short;Pl;City;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1; ;3;01:50;03:38;06:02;\r\n");
        assert.ok($.isArray(results), "Parsing output not an array");
        assert.equal(results.length, 1, "There should be one element in the array");
        assert.ok(results[0] instanceof AgeClass, "Array element should be an AgeClass object");
        assert.equal(results[0].competitors.length, 1, "One competitor should have been read");
        
        var competitor = results[0].competitors[0];
        assert.equal(competitor.club, "ABC", "Should read correct club");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with a missed control", function (assert) {
        var results = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;mp;3;01:50;-----;06:02;\r\n");
        assert.ok($.isArray(results), "Parsing output not an array");
        assert.equal(results.length, 1, "There should be one element in the array");
        assert.equal(results[0].competitors.length, 1, "One competitor should have been read");
        
        var competitor = results[0].competitors[0];
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 110, null, 362, 393], "Should read correct cumulative times");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data with a missed control and remove the trailing 'mp' from the surname", function (assert) {
        var results = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith mp;ABC;10:00:00;06:33;Test class;mp;3;01:50;-----;06:02;\r\n");
        assert.ok($.isArray(results), "Parsing output not an array");
        assert.equal(results.length, 1, "There should be one element in the array");
        assert.equal(results[0].competitors.length, 1, "One competitor should have been read");
        
        var competitor = results[0].competitors[0];
        assert.equal(competitor.surname, "Smith", "Should read correct surname without 'mp' suffix");
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 110, null, 362, 393], "Should read correct cumulative times");
    });
    
    QUnit.test("Can parse a string that contains a single competitor's data and remove the trailing 'n/c' from the surname", function (assert) {
        var results = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith n/c;ABC;10:00:00;06:33;Test class;n/c;3;01:50;03:38;06:02;\r\n");
        assert.ok($.isArray(results), "Parsing output not an array");
        assert.equal(results.length, 1, "There should be one element in the array");
        assert.equal(results[0].competitors.length, 1, "One competitor should have been read");
        
        var competitor = results[0].competitors[0];
        assert.equal(competitor.surname, "Smith", "Should read correct surname without 'n/c' suffix");
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 110, 218, 362, 393], "Should read correct cumulative times");
        assert.ok(competitor.isNonCompetitive, "Competitor should be marked as non-competitive");
    });
    
    QUnit.test("Can parse a string that contains two competitors in the same class", function (assert) {
        var results = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n" +
                           "Fred;Baker;DEF;10:30:00;07:11;Test class;2;3;02:01;04:06;06:37;\r\n");
        assert.equal(results.length, 1, "There should be one element in the array");
        assert.ok(results[0] instanceof AgeClass, "Array element should be an AgeClass object");
        assert.equal(results[0].numControls, 3, "Class should have three controls");
        assert.equal(results[0].competitors.length, 2, "Two competitors should have been read");
        
        assert.equal(results[0].competitors[0].forename, "John", "Should read correct forename for first competitor");
        assert.equal(results[0].competitors[1].forename, "Fred", "Should read correct forename for second competitor");
    });
    
    QUnit.test("Can parse a string that contains two competitors on different classes", function (assert) {
        var results = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;Punch4;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class 1;1;3;01:50;03:38;06:02;\r\n" +
                           "Fred;Baker;DEF;10:30:00;09:54;Test class 2;1;4;02:01;04:06;06:37;09:10\r\n");
        assert.equal(results.length, 2, "There should be two elements in the array");
        assert.ok(results[0] instanceof AgeClass, "First array element should be an AgeClass object");
        assert.ok(results[1] instanceof AgeClass, "Second array element should be an AgeClass object");
        assert.equal(results[0].numControls, 3, "First class should have three controls");
        assert.equal(results[1].numControls, 4, "Second class should have four controls");
        assert.equal(results[0].competitors.length, 1, "One competitor should have been read for the first class");
        assert.equal(results[1].competitors.length, 1, "One competitor should have been read for the second class");
        assert.equal(results[0].competitors[0].forename, "John", "Should read correct forename for competitor on first class");
        assert.equal(results[1].competitors[0].forename, "Fred", "Should read correct forename for competitor on second class");
    });
    
    QUnit.test("Can parse a string that contains two competitors on different classes, sorting the classes into order", function (assert) {
        var results = parseEventData("First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;Punch4;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class 2;1;3;01:50;03:38;06:02;\r\n" +
                           "Fred;Baker;DEF;10:30:00;09:54;Test class 1;1;4;02:01;04:06;06:37;09:10\r\n");
        assert.equal(results.length, 2, "There should be two elements in the array");
        assert.ok(results[0] instanceof AgeClass, "First array element should be an AgeClass object");
        assert.ok(results[1] instanceof AgeClass, "Second array element should be an AgeClass object");
        assert.equal(results[0].name, "Test class 1", "First class should be first class alphabetically");
        assert.equal(results[1].name, "Test class 2", "Second class should be second class alphabetically");
        assert.equal(results[0].competitors[0].forename, "Fred", "Should read correct forename for competitor on first class");
        assert.equal(results[1].competitors[0].forename, "John", "Should read correct forename for competitor on second class");
    });
    
    QUnit.test("Cannot parse a string that contains no first name column", function (assert) {
        runInvalidDataTest(assert, "First name XYZ;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with no first-name column");
    });
    
    QUnit.test("Cannot parse a string that contains no surname column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname XYZ;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with no surname column");
    });
    
    QUnit.test("Cannot parse a string that contains no club column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;Club XYZ;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with no club column");
    });
    
    QUnit.test("Cannot parse a string that contains no start column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start XYZ;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with no start column");
    });
    
    QUnit.test("Cannot parse a string that contains no time column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time XYZ;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with no time column");
    });
    
    QUnit.test("Cannot parse a string that contains no class column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short XYZ;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with no class column");
    });

    QUnit.test("Cannot parse a string that contains no placing column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl XYZ;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with no placing column");
    });

    QUnit.test("Cannot parse a string that contains no 'course controls' column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course controls XYZ;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with no course-controls column");
    });
    
    QUnit.test("Cannot parse a string that contains no Punch N column", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2 XYZ;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with no Control2 column");
    });
    
    QUnit.test("Cannot parse a string that contains cumulative time less than previous", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;07:38;06:02;\r\n", "data with cumulative times not strictly ascending");
    });
    
    QUnit.test("Cannot parse a string that contains cumulative time equal to previous", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;1;3;01:50;06:02;06:02;\r\n", "data with cumulative times not strictly ascending");
    });
    
    QUnit.test("Cannot parse a string that contains cumulative time less than previous before mispunch", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;06:33;Test class;mp;3;04:37;-----;04:22;\r\n", "data with cumulative times not strictly ascending with mispunch in middle");
    });
    
    QUnit.test("Cannot parse a string that contains total time less than last split time", function (assert) {
        runInvalidDataTest(assert, "First name;Surname;City;Start;Time;Short;Pl;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                           "John;Smith;ABC;10:00:00;05:33;Test class;1;3;01:50;03:38;06:02;\r\n", "data with cumulative times not strictly ascending");
    });
})();