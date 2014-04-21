/*
 *  SplitsBrowser - Alternative CSV Reader tests.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    
    var parseTripleColumnEventData = SplitsBrowser.Input.AlternativeCSV.parseTripleColumnEventData;
    var parseNamelessEventData = SplitsBrowser.Input.AlternativeCSV.parseNamelessEventData;
    var formatTime = SplitsBrowser.formatTime;
    
    var TRIPLE_COLUMN_HEADER = "RaceNumber,CardNumbers,MembershipNumbers,Name,AgeClass,Club,Country,CourseClass,StartTime,FinishTime,RaceTime,NonCompetitive,Position,Status,Handicap," + 
                               "PenaltyScore,ManualScoreAdjust,FinalScore,HandicapTime,HandicapScore,AwardLevel,SiEntriesIDs,Eligibility,NotUsed3,NotUsed4,NotUsed5,NotUsed6,NotUsed7," +
                               "NotUsed8,NotUsed9,NotUsed10,NumSplits,ControlCode1,Split1,Points1,ControlCode2,Split2,Points2,ControlCode3,Split3,Points3,ControlCode4,Split4,Points4," +
                               "ControlCode5,Split5,Points5,ControlCode6,Split6,Points6";
    
    var NAMELESS_HEADER = "OE0014,Stno,XStno,Chipno,Database Id,Surname,First name,YB,S,Block,nc,Start,Finish,Time,Classifier,Credit -,Penalty +,Comment,Club no.,Cl.name,City,Nat," + 
                          "Location,Region,Cl. no.,Short,Long,Entry cl. No,Entry class (short),Entry class (long),Rank,Ranking points,Num1,Num2,Num3,Text1,Text2,Text3,Addr. surname," +
                          "Addr. first name,Street,Line2,Zip,Addr. city,Phone,Mobile,Fax,EMail,Rented,Start fee,Paid,Team,Course no.,Course,km,m,Course controls,Place,Start punch," + 
                          "Finish punch,Control1,Punch1,Control2,Punch2,Control3,Punch3,Control4,Punch4,Control5,Punch5,Control6,Punch6";
    
    /**
    * Fabricates and returns a data row of the triple-column CSV file.
    * @param {String} name - The competitor name.
    * @param {String} club - The competitor's club.
    * @param {String} courseName - The name of the course.
    * @param {Array} controls - Array of string control codes.
    * @param {String} startTime - The competitor's start time, or null if none.
    * @param {Array} cumTimes - Array of cumulative times, either numbers or
    *     null.
    * @return {String} Fabricated data row.
    */
    function fabricateTripleColumnRow(name, club, courseName, controls, startTime, cumTimes) {
        if (controls.length !== cumTimes.length) {
            throw new Error("Controls and cumulative times must have the same length");
        }
    
        var row = [];
        
        // Add some empty cells on the end for good measure.
        var rowWidth = 38 + 3 * controls.length + 8;
        for (var index = 0; index < rowWidth; index += 1) {
            row.push("");
        }
        
        row[3] = name;
        row[5] = club;
        row[7] = courseName;
        row[8] = (startTime === null) ? "" : formatTime(startTime);
        
        for (var controlIndex = 0; controlIndex < controls.length; controlIndex += 1) {
            row[38 + controlIndex * 3] = controls[controlIndex];
            if (cumTimes[controlIndex] !== null) {
                row[39 + controlIndex * 3] = formatTime(cumTimes[controlIndex]);
            }
        }
        
        return row.join(",") + "\r\n";
    }

    /**
    * Fabricates and returns a data row of the triple-column CSV file.
    * @param {String} name - The competitor name.
    * @param {String} club - The competitor's club.
    * @param {String} courseName - The name of the course.
    * @param {String} length - The length of the course, in km.
    * @param {String} climb - The climb of the course in metres.
    * @param {Array} controls - Array of control codes.
    * @param {Number|null} startTime - The competitor's start time, or null if none.
    *     null.
    * @param {Number|null} finishTime - The competitor's start time, or null if
    *     none.
    * @param {String} placing - The competitor's placing.
    * @param {Array} cumTimes - Array of cumulative times, either numbers or
    * @return {String} Fabricated data row.
    */
    function fabricateNamelessRow(name, club, courseName, length, climb, controls, startTime, finishTime, placing, cumTimes) {
        if (controls.length !== cumTimes.length) {
            throw new Error("Controls and cumulative times must have the same length");
        }
    
        var row = [];
        
        // Add some empty cells on the end for good measure.
        var rowWidth = 60 + 2 * controls.length + 11;
        for (var index = 0; index < rowWidth; index += 1) {
            row.push("");
        }
        
        row[3] = name;
        row[18] = club;
        row[53] = courseName;
        row[54] = length;
        row[55] = climb;
        row[56] = cumTimes.length;
        row[57] = placing;
        row[11] = (startTime === null) ? "" : formatTime(startTime);
        row[59] = (finishTime === null) ? "" :formatTime(finishTime);
        
        for (var controlIndex = 0; controlIndex < controls.length; controlIndex += 1) {
            row[60 + controlIndex * 2] = controls[controlIndex];
            if (cumTimes[controlIndex] !== null) {
                row[61 + controlIndex * 2] = formatTime(cumTimes[controlIndex]);
            }
        }
        
        return row.join(",") + "\r\n";
    }
    
    module("Input.AlternativeCSV.TripleColumn");
    
    QUnit.test("Cannot parse an empty string", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseTripleColumnEventData("");
        }, "Should throw an exception for parsing an empty string");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseTripleColumnEventData(TRIPLE_COLUMN_HEADER);
        }, "Should throw an exception for parsing a string containing only the headers");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers and blank lines", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseTripleColumnEventData(TRIPLE_COLUMN_HEADER + "\r\n\r\n\r\n");
        }, "Should throw an exception for parsing a string containing only the headers and blank lines");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers and blank lines", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseTripleColumnEventData(TRIPLE_COLUMN_HEADER + "\r\n1,2,3,4,5");
        }, "Should throw an exception for parsing a string containing only the headers and a too-short line");
    });
    
    QUnit.test("Cannot parse a string that contains a line with a non-alphanumeric control code", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseTripleColumnEventData(TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "IN:VA:LID", "188"], null, [null, null, null]));
        }, "Should throw an exception for parsing a string containing a non-alphanumeric control code");
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        var eventData = parseTripleColumnEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        assert.strictEqual(ageClass.name, "Course 1");
        assert.strictEqual(ageClass.numControls, 3);
        
        assert.strictEqual(ageClass.competitors.length, 1);
        var competitor = ageClass.competitors[0];
        assert.strictEqual(competitor.name, "John Smith");
        assert.strictEqual(competitor.club, "TEST");
        assert.strictEqual(competitor.startTime, 10 * 3600 + 38 * 60);
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 72, 141, 186, 202]);
        assert.ok(!competitor.isNonCompetitive);
        
        assert.strictEqual(eventData.courses.length, 1);
        var course = eventData.courses[0];
        assert.strictEqual(ageClass.course, course);
        assert.strictEqual(course.name, "Course 1");
        assert.strictEqual(course.length, null);
        assert.strictEqual(course.climb, null);
        assert.deepEqual(course.controls, ["152", "188", "163"]);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with LF line endings", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        data = data.replace(/\r/g, "");
        var eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with CR line endings", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        data = data.replace(/\n/g, "");
        var eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with data delimited by semicolons", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        data = data.replace(/,/g, ";");
        var eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with alphanumeric but not numeric control code", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "ABC188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        data = data.replace(/,/g, ";");
        var eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
        var course = eventData.courses[0];
        assert.deepEqual(course.controls, ["152", "ABC188", "163"]);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with two names", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith, Fred Baker", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        var eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        
        var ageClass = eventData.classes[0];
        assert.strictEqual(ageClass.competitors.length, 1);
        
        var competitor = ageClass.competitors[0];
        assert.strictEqual(competitor.name, "John Smith, Fred Baker");
    });
    
    QUnit.test("Can parse a string that contains two valid competitors on the same course", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]) +
                                     fabricateTripleColumnRow("Fred Baker", "ABCD", "Course 1", ["152", "188", "163", "F1"], 11 * 3600 + 19 * 60, [84, 139, 199, 217]);
        var eventData = parseTripleColumnEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        
        assert.strictEqual(ageClass.competitors.length, 2);
        var competitor1 = ageClass.competitors[0];
        assert.strictEqual(competitor1.name, "John Smith");
        assert.strictEqual(competitor1.club, "TEST");
        assert.strictEqual(competitor1.startTime, 10 * 3600 + 38 * 60);
        assert.deepEqual(competitor1.getAllOriginalCumulativeTimes(), [0, 72, 141, 186, 202]);
        
        var competitor2 = ageClass.competitors[1];
        assert.strictEqual(competitor2.name, "Fred Baker");
        assert.strictEqual(competitor2.club, "ABCD");
        assert.strictEqual(competitor2.startTime, 11 * 3600 + 19 * 60);
        assert.deepEqual(competitor2.getAllOriginalCumulativeTimes(), [0, 84, 139, 199, 217]);
        
        assert.strictEqual(eventData.courses.length, 1);
    });
    

    QUnit.test("Cannot parse a string that contains two competitors on the same course with different numbers of controls", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]) +
                                     fabricateTripleColumnRow("Fred Baker", "ABCD", "Course 1", ["152", "188", "163", "186", "F1"], 11 * 3600 + 19 * 60, [84, 139, 199, 257, 282]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseTripleColumnEventData(data);
        }, "Should throw an exception for two competitors on the same course with different numbers of controls");
    });
    
    QUnit.test("Can parse a string that contains a single competitor missing an intermediate control", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, null, 186, 202]);
        var eventData = parseTripleColumnEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        
        assert.strictEqual(ageClass.competitors.length, 1);
        var competitor = ageClass.competitors[0];
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 72, null, 186, 202]);
        assert.ok(!competitor.completed());
    });
    
    QUnit.test("Can parse a string that contains a single competitor missing the finish control", function (assert) {
        var data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("John Smith", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, null]);
        var eventData = parseTripleColumnEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        
        assert.strictEqual(ageClass.competitors.length, 1);
        var competitor = ageClass.competitors[0];
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 72, 141, 186, null]);
        assert.ok(!competitor.completed());
    });
    
    module("Input.AlternativeCSV.Nameless");
    
    QUnit.test("Cannot parse an empty string", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseNamelessEventData("");
        }, "Should throw an exception for parsing an empty string");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseNamelessEventData(NAMELESS_HEADER);
        }, "Should throw an exception for parsing a string containing only the headers");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers and blank lines", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseNamelessEventData(NAMELESS_HEADER + "\r\n\r\n\r\n");
        }, "Should throw an exception for parsing a string containing only the headers and blank lines");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers and blank lines", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseNamelessEventData(NAMELESS_HEADER + "\r\n1,2,3,4,5");
        }, "Should throw an exception for parsing a string containing only the headers and a too-short line");
    });
    
    QUnit.test("Cannot parse a string that contains a line with a non-alphanumeric control code", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseNamelessEventData(NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", 2.7, 150, ["152", "IN:VAL:ID", "188"], 10 * 3600 + 38 * 60, 10 * 3600 + 59 * 60 + 14, 1, [72, 141, 186]));
        }, "Should throw an exception for parsing a string containing a non-numeric control code");
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with all values", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, 1, [72, 141, 186]);
        var eventData = parseNamelessEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        assert.strictEqual(ageClass.name, "Course 1");
        assert.strictEqual(ageClass.numControls, 3);
        
        assert.strictEqual(ageClass.competitors.length, 1);
        var competitor = ageClass.competitors[0];
        assert.strictEqual(competitor.name, "200971");
        assert.strictEqual(competitor.club, "3621");
        assert.strictEqual(competitor.startTime, 10 * 3600 + 38 * 60);
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 72, 141, 186, 202]);
        assert.ok(!competitor.isNonCompetitive);
        
        assert.strictEqual(eventData.courses.length, 1);
        var course = eventData.courses[0];
        assert.strictEqual(ageClass.course, course);
        assert.strictEqual(course.name, "Course 1");
        assert.strictEqual(course.length, 2.7);
        assert.strictEqual(course.climb, 150);
        assert.deepEqual(course.controls, ["152", "188", "163"]);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with no course length nor climb", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "", "", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, 1, [72, 141, 186]);
        var eventData = parseNamelessEventData(data);
        
        assert.strictEqual(eventData.courses.length, 1);
        var course = eventData.courses[0];
        assert.strictEqual(course.length, null);
        assert.strictEqual(course.climb, null);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with LF line endings", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, 1, [72, 141, 186]);
        data = data.replace(/\r/g, "");
        var eventData = parseNamelessEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with CR line endings", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, 1, [72, 141, 186]);
        data = data.replace(/\n/g, "");
        var eventData = parseNamelessEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with data delimited by semicolons", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, 1, [72, 141, 186]);
        data = data.replace(/,/g, ";");
        var eventData = parseNamelessEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with alphanumeric but not numeric control code", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "ABC188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, 1, [72, 141, 186]);
        var eventData = parseNamelessEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
        var course = eventData.courses[0];
        assert.deepEqual(course.controls, ["152", "ABC188", "163"]);
    });
    
    QUnit.test("Can parse a string that contains two valid competitors on the same course", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, 1, [72, 141, 186]) +
                                              fabricateNamelessRow("100482", "2820", "Course 1", "2.7", "150", ["152", "188", "163"], 11 * 3600 + 19 * 60, 11 * 3600 + 22 * 60 + 37, 2, [84, 139, 199]);
        
        var eventData = parseNamelessEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        
        assert.strictEqual(ageClass.competitors.length, 2);
        var competitor1 = ageClass.competitors[0];
        assert.strictEqual(competitor1.name, "200971");
        assert.strictEqual(competitor1.club, "3621");
        assert.strictEqual(competitor1.startTime, 10 * 3600 + 38 * 60);
        assert.deepEqual(competitor1.getAllOriginalCumulativeTimes(), [0, 72, 141, 186, 202]);
        
        var competitor2 = ageClass.competitors[1];
        assert.strictEqual(competitor2.name, "100482");
        assert.strictEqual(competitor2.club, "2820");
        assert.strictEqual(competitor2.startTime, 11 * 3600 + 19 * 60);
        assert.deepEqual(competitor2.getAllOriginalCumulativeTimes(), [0, 84, 139, 199, 217]);
        
        assert.strictEqual(eventData.courses.length, 1);
    });
    
    QUnit.test("Cannot parse a string that contains two competitors on the same course with different numbers of controls", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, 1, [72, 141, 186]) +
                                              fabricateNamelessRow("100482", "2820", "Course 1", "2.7", "150", ["152", "188", "163", "186"], 11 * 3600 + 19 * 60, 11 * 3600 + 22 * 60 + 37, 2, [84, 139, 199, 257]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseNamelessEventData(data);
        }, "two competitors on the same course with different numbers of controls");
    });
    
    QUnit.test("Cannot parse a string that contains two competitors on the same course with one row too short", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, 1, [72, 141, 186]);
        data = data.replace("163,03:06,","");
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseNamelessEventData(data);
        }, "two competitors on the same course with different numbers of controls");
    });
    
    QUnit.test("Can parse a string that contains a single competitor missing an intermediate control", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, "mp", [72, null, 186]);
        var eventData = parseNamelessEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        
        assert.strictEqual(ageClass.competitors.length, 1);
        var competitor = ageClass.competitors[0];
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 72, null, 186, 202]);
        assert.ok(!competitor.completed());
    });
    
    QUnit.test("Can parse a string that contains a single competitor missing the split to the last control", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, "mp", [72, 141, null]);
        var eventData = parseNamelessEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        
        assert.strictEqual(ageClass.competitors.length, 1);
        var competitor = ageClass.competitors[0];
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 72, 141, null, 202]);
        assert.ok(!competitor.completed());
    });
    
    QUnit.test("Can parse a string that contains a single non-competitive competitor", function (assert) {
        var data = NAMELESS_HEADER + "\r\n" + fabricateNamelessRow("200971", "3621", "Course 1", "2.7", "150", ["152", "188", "163"], 10 * 3600 + 38 * 60, 10 * 3600 + 41 * 60 + 22, "n/c", [72, 141, 186]);
        var eventData = parseNamelessEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        
        assert.strictEqual(ageClass.competitors.length, 1);
        var competitor = ageClass.competitors[0];
        assert.ok(competitor.completed());
        assert.ok(competitor.isNonCompetitive);
    });
})();