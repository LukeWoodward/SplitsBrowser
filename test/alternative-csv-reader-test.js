/*
 *  SplitsBrowser - Alternative CSV Reader tests.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    const parseTripleColumnEventData = SplitsBrowser.Input.AlternativeCSV.parseTripleColumnEventData;
    const formatTime = SplitsBrowser.formatTime;

    const TRIPLE_COLUMN_HEADER = "RaceNumber,CardNumbers,MembershipNumbers,Name,AgeClass,Club,Country,CourseClass,StartTime,FinishTime,RaceTime,NonCompetitive,Position,Status,Handicap," +
                               "PenaltyScore,ManualScoreAdjust,FinalScore,HandicapTime,HandicapScore,AwardLevel,SiEntriesIDs,Eligibility,NotUsed3,NotUsed4,NotUsed5,NotUsed6,NotUsed7," +
                               "NotUsed8,NotUsed9,NotUsed10,NumSplits,ControlCode1,Split1,Points1,ControlCode2,Split2,Points2,ControlCode3,Split3,Points3,ControlCode4,Split4,Points4," +
                               "ControlCode5,Split5,Points5,ControlCode6,Split6,Points6";

    /**
     * Fabricates and returns a data row of the triple-column CSV file.
     * @param {String} name The competitor name.
     * @param {String} club The competitor's club.
     * @param {String} courseName The name of the course.
     * @param {Array} controls Array of string control codes.
     * @param {Number|null} startTime The competitor's start time, or null if none.
     * @param {Array} cumTimes Array of cumulative times, either numbers or
     *     null.
     * @return {String} Fabricated data row.
     */
    function fabricateTripleColumnRow(name, club, courseName, controls, startTime, cumTimes) {
        if (controls.length !== cumTimes.length) {
            throw new Error("Controls and cumulative times must have the same length");
        }

        let row = [];

        // Add some empty cells on the end for good measure.
        let rowWidth = 38 + 3 * controls.length + 8;
        for (let index = 0; index < rowWidth; index += 1) {
            row.push("");
        }

        row[3] = name;
        row[5] = club;
        row[7] = courseName;
        row[8] = (startTime === null) ? "" : formatTime(startTime);

        for (let controlIndex = 0; controlIndex < controls.length; controlIndex += 1) {
            row[38 + controlIndex * 3] = controls[controlIndex];
            if (cumTimes[controlIndex] !== null) {
                row[39 + controlIndex * 3] = formatTime(cumTimes[controlIndex]);
            }
        }

        return row.join(",") + "\r\n";
    }

    QUnit.module("Input.AlternativeCSV.TripleColumn");

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
            parseTripleColumnEventData(TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "IN:VA:LID", "188"], null, [null, null, null]));
        }, "Should throw an exception for parsing a string containing a non-alphanumeric control code");
    });

    QUnit.test("Can parse a string that contains a single valid competitor", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        let eventData = parseTripleColumnEventData(data);

        assert.strictEqual(eventData.classes.length, 1);
        let courseClass = eventData.classes[0];
        assert.strictEqual(courseClass.name, "Course 1");
        assert.strictEqual(courseClass.numControls, 3);

        assert.strictEqual(courseClass.results.length, 1);
        let result = courseClass.results[0];
        assert.strictEqual(result.owner.name, "First Runner");
        assert.strictEqual(result.owner.club, "TEST");
        assert.strictEqual(result.startTime, 10 * 3600 + 38 * 60);
        assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0, 72, 141, 186, 202]);
        assert.ok(result.completed());
        assert.ok(!result.isNonCompetitive);
        assert.ok(!result.isNonStarter);
        assert.ok(!result.isNonFinisher);
        assert.ok(!result.isDisqualified);

        assert.strictEqual(eventData.courses.length, 1);
        let course = eventData.courses[0];
        assert.strictEqual(courseClass.course, course);
        assert.strictEqual(course.name, "Course 1");
        assert.strictEqual(course.length, null);
        assert.strictEqual(course.climb, null);
        assert.deepEqual(course.controls, ["152", "188", "163"]);
    });

    QUnit.test("Can parse a string that contains a single valid competitor with LF line endings", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        data = data.replace(/\r/g, "");
        let eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });

    QUnit.test("Can parse a string that contains a single valid competitor with CR line endings", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        data = data.replace(/\n/g, "");
        let eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });

    QUnit.test("Can parse a string that contains a single valid competitor with data delimited by semicolons", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        data = data.replace(/,/g, ";");
        let eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
    });

    QUnit.test("Can parse a string that contains a single valid competitor with alphanumeric but not numeric control code", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "ABC188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        data = data.replace(/,/g, ";");
        let eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
        let course = eventData.courses[0];
        assert.deepEqual(course.controls, ["152", "ABC188", "163"]);
    });

    QUnit.test("Can parse a string that contains a single valid competitor with two names", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner, Second Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        let eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);

        let courseClass = eventData.classes[0];
        assert.strictEqual(courseClass.results.length, 1);

        let result = courseClass.results[0];
        assert.strictEqual(result.owner.name, "First Runner, Second Runner");
    });

    QUnit.test("Can parse a string that contains two valid competitors on the same course", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]) +
                                     fabricateTripleColumnRow("Second Runner", "ABCD", "Course 1", ["152", "188", "163", "F1"], 11 * 3600 + 19 * 60, [84, 139, 199, 217]);
        let eventData = parseTripleColumnEventData(data);

        assert.strictEqual(eventData.classes.length, 1);
        let courseClass = eventData.classes[0];

        assert.strictEqual(courseClass.results.length, 2);
        let result1 = courseClass.results[0];
        assert.strictEqual(result1.owner.name, "First Runner");
        assert.strictEqual(result1.owner.club, "TEST");
        assert.strictEqual(result1.startTime, 10 * 3600 + 38 * 60);
        assert.deepEqual(result1.getAllOriginalCumulativeTimes(), [0, 72, 141, 186, 202]);

        let result2 = courseClass.results[1];
        assert.strictEqual(result2.owner.name, "Second Runner");
        assert.strictEqual(result2.owner.club, "ABCD");
        assert.strictEqual(result2.startTime, 11 * 3600 + 19 * 60);
        assert.deepEqual(result2.getAllOriginalCumulativeTimes(), [0, 84, 139, 199, 217]);

        assert.strictEqual(eventData.courses.length, 1);
    });

    QUnit.test("Can parse a string that contains one valid competitor and issue warning for one competitor that contains no times and some other nonsense", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]);
        let secondLine = fabricateTripleColumnRow("Second Runner", "ABCD", "Course 1", [], null, []);
        let secondLineParts = secondLine.split(",");
        secondLineParts[37] = "10";
        secondLine = secondLineParts.join(",");
        let eventData = parseTripleColumnEventData(data + secondLine);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.warnings.length, 1);
    });

    QUnit.test("Can parse a string that contains two valid competitors on the same course but in different classes", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Class 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]) +
                                     fabricateTripleColumnRow("Second Runner", "ABCD", "Class 2", ["152", "188", "163", "F1"], 11 * 3600 + 19 * 60, [84, 139, 199, 217]);
        let eventData = parseTripleColumnEventData(data);

        assert.strictEqual(eventData.classes.length, 2);
        assert.strictEqual(eventData.courses.length, 1);

        assert.deepEqual(eventData.courses[0].classes, eventData.classes);
    });

    QUnit.test("Can parse a string that contains two valid competitors on different courses and in different classes", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Class 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]) +
                                     fabricateTripleColumnRow("Second Runner", "ABCD", "Class 2", ["152", "174", "119", "F1"], 11 * 3600 + 19 * 60, [84, 139, 199, 217]);
        let eventData = parseTripleColumnEventData(data);

        assert.strictEqual(eventData.classes.length, 2);
        assert.strictEqual(eventData.courses.length, 2);
    });

    QUnit.test("Issues a warning for a string that contains two competitors on the same course with different numbers of controls", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, 202]) +
                                     fabricateTripleColumnRow("Second Runner", "ABCD", "Course 1", ["152", "188", "163", "186", "F1"], 11 * 3600 + 19 * 60, [84, 139, 199, 257, 282]);
        let eventData = parseTripleColumnEventData(data);
        assert.strictEqual(eventData.classes.length, 1);
        assert.strictEqual(eventData.courses.length, 1);
        assert.strictEqual(eventData.classes[0].results.length, 1);
        assert.strictEqual(eventData.warnings.length, 1);
    });

    QUnit.test("Can parse a string that contains a single competitor missing an intermediate control", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, null, 186, 202]);
        let eventData = parseTripleColumnEventData(data);

        assert.strictEqual(eventData.classes.length, 1);
        let courseClass = eventData.classes[0];

        assert.strictEqual(courseClass.results.length, 1);
        let result = courseClass.results[0];
        assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0, 72, null, 186, 202]);
        assert.ok(!result.completed());
        assert.ok(!result.isNonStarter);
        assert.ok(!result.isNonFinisher);
        assert.ok(!result.isDisqualified);
    });

    QUnit.test("Can parse a string that contains a single competitor missing the finish control", function (assert) {
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [72, 141, 186, null]);
        let eventData = parseTripleColumnEventData(data);

        assert.strictEqual(eventData.classes.length, 1);
        let courseClass = eventData.classes[0];

        assert.strictEqual(courseClass.results.length, 1);
        let result = courseClass.results[0];
        assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0, 72, 141, 186, null]);
        assert.ok(!result.completed());
        assert.ok(!result.isNonStarter);
        assert.ok(!result.isNonFinisher);
        assert.ok(!result.isDisqualified);
    });

    QUnit.test("Can parse a string that contains a single competitor missing all controls and mark said competitor as a non-starter", function (assert) {
        // Add a second okay competitor as if all competitors have no times the
        // file is assumed not to be alternative CSV.
        let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [null, null, null, null]) +
                                          "\r\n" + fabricateTripleColumnRow("Second Runner", "ABCD", "Class 2", ["152", "174", "119", "F1"], 11 * 3600 + 19 * 60, [84, 139, 199, 217]);
        let eventData = parseTripleColumnEventData(data);

        assert.strictEqual(eventData.classes.length, 2);
        let courseClass = eventData.classes[0];

        assert.strictEqual(courseClass.results.length, 1);
        let result = courseClass.results[0];
        assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0, null, null, null, null]);
        assert.ok(!result.completed());
        assert.ok(result.isNonStarter);
        assert.ok(!result.isNonFinisher);
        assert.ok(!result.isDisqualified);
    });

    QUnit.test("Cannot parse a string that contains two competitors missing all controls", function (assert) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            let data = TRIPLE_COLUMN_HEADER + "\r\n" + fabricateTripleColumnRow("First Runner", "TEST", "Course 1", ["152", "188", "163", "F1"], 10 * 3600 + 38 * 60, [null, null, null, null]) +
                                              "\r\n" + fabricateTripleColumnRow("Second Runner", "ABCD", "Class 2", ["152", "174", "119", "F1"], 11 * 3600 + 19 * 60, [null, null, null, null]);
            parseTripleColumnEventData(data);
        }, "Should throw an exception for parsing a string containing only non-starting competitors");
    });
})();