/*
 *  SplitsBrowser - Course tests.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    
    module("Course");
    
    function getCompetitor1() {
        return fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
    }
    
    function getCompetitor2() {
        return fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
    }
    
    QUnit.test("Getting other classes of a course with one class returns empty list when given that one class", function (assert) {
        var ageClass = new AgeClass("Test class", 3, []);
        var course = new Course("Test course", [ageClass], null, null, null);
        
        assert.deepEqual(course.getOtherClasses(ageClass), [], "There should be no other classes");
    });
    
    QUnit.test("Getting other classes of a course with three classes returns the other two when given one of the others", function (assert) {
        var ageClass1 = new AgeClass("Test class 1", 3, []);
        var ageClass2 = new AgeClass("Test class 2", 3, []);
        var ageClass3 = new AgeClass("Test class 3", 3, []);
        var course = new Course("Test course", [ageClass1, ageClass2, ageClass3], null, null, null);
        
        assert.deepEqual(course.getOtherClasses(ageClass2), [ageClass1, ageClass3], "There should be no other classes");
    });
    
    QUnit.test("Attempting to get other courses of a course with three classes when given some other class throws an exception", function (assert) {
        var ageClass1 = new AgeClass("Test class 1", 3, []);
        var ageClass2 = new AgeClass("Test class 2", 3, []);
        var ageClass3 = new AgeClass("Test class 3", 3, []);
        var course = new Course("Test course", [ageClass1, ageClass2], null, null, null);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            course.getOtherClasses(ageClass3);
        });
    });
    
    QUnit.test("Course created without controls does not contain controls", function (assert) {
        var course = new Course("Test course", [new AgeClass("Test class", 3, [])], null, null, null);
        assert.ok(!course.hasControls());
    });
    
    QUnit.test("Course created with controls does contain controls", function (assert) {
        var course = new Course("Test course", [new AgeClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.ok(course.hasControls());
    });
    
    QUnit.test("Course created with controls does contain controls", function (assert) {
        var course = new Course("Test course", [new AgeClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.ok(course.hasControls());
    });
    
    QUnit.test("Cannot get the code of a control with negative number", function (assert) {
        var course = new Course("Test course", [new AgeClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        SplitsBrowserTest.assertInvalidData(assert, function () { course.getControlCode(-1); });
    });
    
    QUnit.test("Getting the code of start control returns start constant", function (assert) {
        var course = new Course("Test course", [new AgeClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.strictEqual(course.getControlCode(0), Course.START);
    });
    
    QUnit.test("Getting the code of the first control returns the first control's code", function (assert) {
        var course = new Course("Test course", [new AgeClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.strictEqual(course.getControlCode(1), "208");
    });
    
    QUnit.test("Getting the code of the last control returns the last control's code", function (assert) {
        var course = new Course("Test course", [new AgeClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.strictEqual(course.getControlCode(3), "212");
    });

    QUnit.test("Getting the control code of the finish returns null", function (assert) {
        var course = new Course("Test course", [new AgeClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.strictEqual(course.getControlCode(4), Course.FINISH);
    });
        
    QUnit.test("Cannot get the code of a control with number too large", function (assert) {
        var course = new Course("Test course", [new AgeClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        SplitsBrowserTest.assertInvalidData(assert, function () { course.getControlCode(5); });
    });

    QUnit.test("Course created without controls does not contain a given leg", function (assert) {
        var ageClass = new AgeClass("Test class", 3, []);
        var course = new Course("Test course", [ageClass], null, null, null);
        assert.ok(!course.usesLeg("235", "212"));
    });
    
    QUnit.test("Course created with controls contains legs from each pair of consecutive controls it was created with", function (assert) {
        var ageClass = new AgeClass("Test class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [ageClass], 4.1, 115, controls);
        assert.ok(course.usesLeg(Course.START, "235"), "Course should use leg from start to control 1");
        assert.ok(course.usesLeg("235", "212"), "Course should use leg from control 1 to 2");
        assert.ok(course.usesLeg("212", "189"), "Course should use leg from control 2 to control 3");
        assert.ok(course.usesLeg("189", Course.FINISH), "Course should use leg from control 3 to the finish");
    });
    
    QUnit.test("Course created with empty list of controls contains leg from start to finish", function (assert) {
        var ageClass = new AgeClass("Test class", 0, []);
        var controls = [];
        var course = new Course("Test course", [ageClass], 4.1, 115, controls);
        assert.ok(course.usesLeg(null, null), "Course should use leg from start to finish");
    });
    
    QUnit.test("Course created with empty list of controls does not contain legs with controls other than the start and finish", function (assert) {
        var ageClass = new AgeClass("Test class", 0, []);
        var controls = [];
        var course = new Course("Test course", [ageClass], 4.1, 115, controls);
        assert.ok(!course.usesLeg(null, "212"), "Course should use leg from start to some control");
        assert.ok(!course.usesLeg("212", null), "Course should use leg from some control to the finish");
        assert.ok(!course.usesLeg("212", "189"), "Course should use leg from some control to some other control");
    });
    
    QUnit.test("Course created with controls does not contain legs that are not part of it", function (assert) {
        var ageClass = new AgeClass("Test class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [ageClass], 4.1, 115, controls);
        assert.ok(!course.usesLeg("200", "189"), "Course does not use leg from control not on the course");
        assert.ok(!course.usesLeg("212", "200"), "Course does not use leg to control not on the course");
        assert.ok(!course.usesLeg(null, null), "Course does not use leg from start to finish");
        assert.ok(!course.usesLeg(null, "212"), "Course does not use leg from the start to control 2");
        assert.ok(!course.usesLeg("212", null), "Course does not use leg from control 2 to the finish");
        assert.ok(!course.usesLeg("235", "189"), "Course does not use leg from control 1 to control 3");
    });
    
    QUnit.test("Course created with butterfly loops contains all legs despite central control being repeated", function (assert) {
        var ageClass = new AgeClass("Test class", 3, []);
        var controls = ["235", "212", "189", "194", "212", "208", "214", "222"];
        var course = new Course("Test course", [ageClass], 4.1, 115, controls);
        for (var i = 1; i < controls.length; i += 1) {
            assert.ok(course.usesLeg(controls[i - 1], controls[i]), "Course uses leg from control " + i + " to " + (i + 1));
        }
    });
    
    QUnit.test("Cannot get fastest splits for a leg of a course created without legs", function (assert) {
        var ageClass = new AgeClass("Test class", 3, []);
        var course = new Course("Test course", [ageClass], null, null, null);
        SplitsBrowserTest.assertInvalidData(assert, function () { course.getFastestSplitsForLeg("235", "212"); });
    });
    
    QUnit.test("Cannot get fastest splits for a leg that is not part of a course", function (assert) {
        var ageClass = new AgeClass("Test class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [ageClass], 4.1, 115, controls);
        SplitsBrowserTest.assertInvalidData(assert, function () { course.getFastestSplitsForLeg("235", "227"); });
    });
    
    QUnit.test("Returns empty array of fastest splits when course has no competitors", function (assert) {
        var ageClass = new AgeClass("Test class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [ageClass], 4.1, 115, controls);
        assert.deepEqual(course.getFastestSplitsForLeg("212", "189"), []);
    });
    
    QUnit.test("Returns single-element array of fastest splits when course has one class with two competitors", function (assert) {
        var competitor2 = getCompetitor2();
        var ageClass = new AgeClass("Test class", 3, [getCompetitor1(), competitor2]);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [ageClass], 4.1, 115, controls);
        assert.deepEqual(course.getFastestSplitsForLeg("212", "189"), [{name: competitor2.name, className:"Test class", split: 184}]);
    });
    
    QUnit.test("Returns single-element array of fastest splits when course has one class with two competitors and one empty class", function (assert) {
        var competitor2 = getCompetitor2();
        var ageClass = new AgeClass("Test class", 3, [getCompetitor1(), competitor2]);
        var emptyAgeClass = new AgeClass("Empty class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [ageClass, emptyAgeClass], 4.1, 115, controls);
        assert.deepEqual(course.getFastestSplitsForLeg("212", "189"), [{name: competitor2.name, className:ageClass.name, split: 184}]);
    });
    
    QUnit.test("Returns two-element array of fastest splits when course has two classes with one competitor each", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var ageClass1 = new AgeClass("Test class 1", 3, [competitor1]);
        var ageClass2 = new AgeClass("Test class 2", 3, [competitor2]);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [ageClass1, ageClass2], 4.1, 115, controls);
        assert.deepEqual(course.getFastestSplitsForLeg("212", "189"), [{name: competitor1.name, className: ageClass1.name, split: 212}, {name: competitor2.name, className: ageClass2.name, split: 184}]);
    });
    
    QUnit.test("Returns empty list of competitors when attempting to fetch competitors visiting a control in an interval when there are no age classes", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189"]);
        assert.deepEqual(course.getCompetitorsAtControlInTimeRange("212", 10 * 3600, 11 * 3600), []);
    });
    
    QUnit.test("Returns empty list of competitors when attempting to fetch competitors visiting a control in an interval when course has no control information", function (assert) {
        var ageClass = new AgeClass("Test class", 3, [getCompetitor1(), getCompetitor2()]);
        var course = new Course("Test course", [ageClass], null, null, null);
        assert.deepEqual(course.getCompetitorsAtControlInTimeRange("123", 10 * 3600, 11 * 3600), []);
    });
    
    QUnit.test("Returns empty list of competitors when attempting to fetch competitors visiting a control in an interval whose code does not exist in the course", function (assert) {
        var ageClass = new AgeClass("Test class", 3, [getCompetitor1(), getCompetitor2()]);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [ageClass], null, null, controls);
        assert.deepEqual(course.getCompetitorsAtControlInTimeRange("456", 10 * 3600, 11 * 3600), []);
    });
    
    QUnit.test("Returns singleton list of competitors when attempting to fetch competitors visiting a control in an interval when the control is on the course", function (assert) {
        var competitor2 = getCompetitor2();
        var ageClass = new AgeClass("Test class", 3, [getCompetitor1(), competitor2]);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [ageClass], null, null, controls);
        var expectedTime = 10 * 3600 + 65 + 221;
        assert.deepEqual(course.getCompetitorsAtControlInTimeRange("212", expectedTime - 1, expectedTime + 1), [{name: competitor2.name, time: expectedTime, className: ageClass.name}]);
    });
    
    QUnit.test("Returns list of competitors from two different classes when attempting to fetch competitors visiting a control in an interval when the control is on the course", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var ageClass1 = new AgeClass("Test class 1", 3, [competitor1]);
        var ageClass2 = new AgeClass("Test class 2", 3, [competitor2]);
        var course = new Course("Test course", [ageClass1, ageClass2], null, null, ["235", "212", "189"]);
        var competitor1Time = 10 * 3600 + 30 * 60 + 81 + 197;
        var competitor2Time = 10 * 3600 + 65 + 221;
        assert.deepEqual(course.getCompetitorsAtControlInTimeRange("212", competitor2Time - 1, competitor1Time + 1),
            [{name: competitor1.name, time: competitor1Time, className: ageClass1.name},
             {name: competitor2.name, time: competitor2Time, className: ageClass2.name}]);
    });
    
    QUnit.test("Returns singleton list of competitors from two different classes when attempting to fetch competitor times at the start for an interval", function (assert) {
        var competitor1 = getCompetitor1();
        var ageClass1 = new AgeClass("Test class 1", 3, [competitor1]);
        var ageClass2 = new AgeClass("Test class 2", 3, [getCompetitor2()]);
        var course = new Course("Test course", [ageClass1, ageClass2], null, null, ["235", "212", "189"]);
        assert.deepEqual(course.getCompetitorsAtControlInTimeRange(Course.START, 10 * 3600 + 30 * 60 - 1, 10 * 3600 + 30 * 60 + 1),
            [{name: competitor1.name, time: 10 * 3600 + 30 * 60, className: ageClass1.name}]);
    });
    
    QUnit.test("Returns singleton list of competitors from two different classes when attempting to fetch competitor times at the start for an interval", function (assert) {
        var competitor2 = getCompetitor2();
        var ageClass1 = new AgeClass("Test class 1", 3, [getCompetitor1()]);
        var ageClass2 = new AgeClass("Test class 2", 3, [competitor2]);
        var course = new Course("Test course", [ageClass1, ageClass2], null, null, ["235", "212", "189"]);
        var expectedTime = 10 * 3600 + 65 + 221 + 184 + 100;
        assert.deepEqual(course.getCompetitorsAtControlInTimeRange(Course.FINISH, expectedTime - 1, expectedTime + 1),
            [{name: competitor2.name, time: expectedTime, className: ageClass2.name}]);
    });
    
})();