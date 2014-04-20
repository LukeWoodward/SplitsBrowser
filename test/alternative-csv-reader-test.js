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
    
    var parseEventData = SplitsBrowser.Input.AlternativeCSV.parseEventData;
    var formatTime = SplitsBrowser.formatTime;
    
    /**
    * Fabricates and returns a data row of the CSV file.
    * @param {String} name - The competitor name.
    * @param {String} club - The competitor's club.
    * @param {String} startTime - The competitor's start time, or null if none.
    * @param {Array} controls - Array of string control codes.
    * @param {Array} cumTimes - Array of cumulative times, either numbers or
    *     null.
    * @return {String} Fabricated data row.
    */
    function fabricateRow(name, club, courseName, startTime, controls, cumTimes) {
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
        if (startTime !== null) {
            row[8] = (startTime === null) ? "" : formatTime(startTime);
        }
        
        for (var controlIndex = 0; controlIndex < controls.length; controlIndex += 1) {
            row[38 + controlIndex * 3] = controls[controlIndex];
            if (cumTimes[controlIndex] !== null) {
                row[39 + controlIndex * 3] = formatTime(cumTimes[controlIndex]);
            }
        }
        
        return row.join(",") + "\r\n";
    }
    
    module("Input.AlternativeCSV");
    
    var HEADER = "RaceNumber,CardNumbers,MembershipNumbers,Name,AgeClass,Club,Country,CourseClass,StartTime,FinishTime,RaceTime,NonCompetitive,Position,Status,Handicap," + 
                 "PenaltyScore,ManualScoreAdjust,FinalScore,HandicapTime,HandicapScore,AwardLevel,SiEntriesIDs,Eligibility,NotUsed3,NotUsed4,NotUsed5,NotUsed6,NotUsed7," +
                 "NotUsed8,NotUsed9,NotUsed10,NumSplits,ControlCode1,Split1,Points1,ControlCode2,Split2,Points2,ControlCode3,Split3,Points3,ControlCode4,Split4,Points4," +
                 "ControlCode5,Split5,Points5,ControlCode6,Split6,Points6";
    
    QUnit.test("Cannot parse an empty string", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData("");
        }, "parsing an empty string");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(HEADER);
        }, "parsing a string containing only the headers");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers and blank lines", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(HEADER + "\r\n\r\n\r\n");
        }, "parsing a string containing only the headers and blank lines");
    });
    
    QUnit.test("Cannot parse a string that contains only the headers and blank lines", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(HEADER + "\r\n1,2,3,4,5");
        }, "parsing a string containing only the headers and a too-short line");
    });
    
    QUnit.test("Cannot parse a string that contains a line with a non-numeric control code", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(HEADER + "\r\n" + fabricateRow("test", "TEST", "Course 1", null, ["152", "INVALID", "188"], [null, null, null]));
        }, "parsing a string containing a non-numeric control code");
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor", function (assert) {
        var data = HEADER + "\r\n" + fabricateRow("John Smith", "TEST", "Course 1", 10 * 3600 + 38 * 60, ["152", "188", "163", "F1"], [72, 141, 186, 202]);
        var eventData = parseEventData(data);
        
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
        
        assert.strictEqual(eventData.courses.length, 1);
        var course = eventData.courses[0];
        assert.strictEqual(ageClass.course, course);
        assert.strictEqual(course.name, "Course 1");
        assert.strictEqual(course.length, null);
        assert.strictEqual(course.climb, null);
        assert.deepEqual(course.controls, ["152", "188", "163"]);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with LF line endings", function (assert) {
        var data = HEADER + "\r\n" + fabricateRow("John Smith", "TEST", "Course 1", 10 * 3600 + 38 * 60, ["152", "188", "163", "F1"], [72, 141, 186, 202]);
        data = data.replace(/\r/g, "");
        var eventData = parseEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });
    
    QUnit.test("Can parse a string that contains a single valid competitor with CR line endings", function (assert) {
        var data = HEADER + "\r\n" + fabricateRow("John Smith", "TEST", "Course 1", 10 * 3600 + 38 * 60, ["152", "188", "163", "F1"], [72, 141, 186, 202]);
        data = data.replace(/\n/g, "");
        var eventData = parseEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });
    
    QUnit.test("Can parse a string that contains two valid competitors on the same course", function (assert) {
        var data = HEADER + "\r\n" + fabricateRow("John Smith", "TEST", "Course 1", 10 * 3600 + 38 * 60, ["152", "188", "163", "F1"], [72, 141, 186, 202]) +
                                     fabricateRow("Fred Baker", "ABCD", "Course 1", 11 * 3600 + 19 * 60, ["152", "188", "163", "F1"], [84, 139, 199, 217]);
        var eventData = parseEventData(data);
        
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
        var data = HEADER + "\r\n" + fabricateRow("John Smith", "TEST", "Course 1", 10 * 3600 + 38 * 60, ["152", "188", "163", "F1"], [72, 141, 186, 202]) +
                                     fabricateRow("Fred Baker", "ABCD", "Course 1", 11 * 3600 + 19 * 60, ["152", "188", "163", "186", "F1"], [84, 139, 199, 257, 282]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseEventData(data);
        }, "two competitors on the same course with different numbers of controls");
    });
    
    QUnit.test("Can parse a string that contains a single competitor missing an intermediate control", function (assert) {
        var data = HEADER + "\r\n" + fabricateRow("John Smith", "TEST", "Course 1", 10 * 3600 + 38 * 60, ["152", "188", "163", "F1"], [72, null, 186, 202]);
        var eventData = parseEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        
        assert.strictEqual(ageClass.competitors.length, 1);
        var competitor = ageClass.competitors[0];
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 72, null, 186, 202]);
        assert.ok(!competitor.completed());
    });
    
    QUnit.test("Can parse a string that contains a single competitor missing the finish control", function (assert) {
        var data = HEADER + "\r\n" + fabricateRow("John Smith", "TEST", "Course 1", 10 * 3600 + 38 * 60, ["152", "188", "163", "F1"], [72, 141, 186, null]);
        var eventData = parseEventData(data);
        
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        
        assert.strictEqual(ageClass.competitors.length, 1);
        var competitor = ageClass.competitors[0];
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0, 72, 141, 186, null]);
        assert.ok(!competitor.completed());
    });
})();