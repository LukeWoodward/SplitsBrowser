/*
 *  SplitsBrowser - Course tests.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;

    var fromSplitTimes = SplitsBrowserTest.fromSplitTimes;

    QUnit.module("Course");

    function getResult1() {
        return fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
    }

    function getResult2() {
        return fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [65, 221, 184, 100]);
    }

    QUnit.test("Getting other classes of a course with one class returns empty list when given that one class", function (assert) {
        var courseClass = new CourseClass("Test class", 3, []);
        var course = new Course("Test course", [courseClass], null, null, null);

        assert.deepEqual(course.getOtherClasses(courseClass), [], "There should be no other classes");
    });

    QUnit.test("Course created with three classes has three classes", function (assert) {
        var courseClass1 = new CourseClass("Test class 1", 3, []);
        var courseClass2 = new CourseClass("Test class 2", 3, []);
        var courseClass3 = new CourseClass("Test class 3", 3, []);
        var course = new Course("Test course", [courseClass1, courseClass2, courseClass3], null, null, null);

        assert.strictEqual(course.getNumClasses(), 3, "Course should have three classes");
    });

    QUnit.test("Getting other classes of a course with three classes returns the other two when given one of the others", function (assert) {
        var courseClass1 = new CourseClass("Test class 1", 3, []);
        var courseClass2 = new CourseClass("Test class 2", 3, []);
        var courseClass3 = new CourseClass("Test class 3", 3, []);
        var course = new Course("Test course", [courseClass1, courseClass2, courseClass3], null, null, null);

        assert.deepEqual(course.getOtherClasses(courseClass2), [courseClass1, courseClass3], "There should be no other classes");
    });

    QUnit.test("Attempting to get other courses of a course with three classes when given some other class throws an exception", function (assert) {
        var courseClass1 = new CourseClass("Test class 1", 3, []);
        var courseClass2 = new CourseClass("Test class 2", 3, []);
        var courseClass3 = new CourseClass("Test class 3", 3, []);
        var course = new Course("Test course", [courseClass1, courseClass2], null, null, null);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            course.getOtherClasses(courseClass3);
        });
    });

    QUnit.test("Course created without controls does not contain controls", function (assert) {
        var course = new Course("Test course", [new CourseClass("Test class", 3, [])], null, null, null);
        assert.ok(!course.hasControls());
    });

    QUnit.test("Course created with controls does contain controls", function (assert) {
        var course = new Course("Test course", [new CourseClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.ok(course.hasControls());
    });

    QUnit.test("Course created with controls does contain controls", function (assert) {
        var course = new Course("Test course", [new CourseClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.ok(course.hasControls());
    });

    QUnit.test("Cannot get the code of a control with negative number", function (assert) {
        var course = new Course("Test course", [new CourseClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        SplitsBrowserTest.assertInvalidData(assert, function () { course.getControlCode(-1); });
    });

    QUnit.test("Getting the code of start control returns start constant", function (assert) {
        var course = new Course("Test course", [new CourseClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.strictEqual(course.getControlCode(0), Course.START);
    });

    QUnit.test("Getting the code of the first control returns the first control's code", function (assert) {
        var course = new Course("Test course", [new CourseClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.strictEqual(course.getControlCode(1), "208");
    });

    QUnit.test("Getting the code of the last control returns the last control's code", function (assert) {
        var course = new Course("Test course", [new CourseClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.strictEqual(course.getControlCode(3), "212");
    });

    QUnit.test("Getting the control code of the finish returns null", function (assert) {
        var course = new Course("Test course", [new CourseClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        assert.strictEqual(course.getControlCode(4), Course.FINISH);
    });

    QUnit.test("Cannot get the code of a control with number too large", function (assert) {
        var course = new Course("Test course", [new CourseClass("Test class", 3, [])], null, null, ["208", "227", "212"]);
        SplitsBrowserTest.assertInvalidData(assert, function () { course.getControlCode(5); });
    });

    QUnit.test("Course created without controls does not contain a given leg", function (assert) {
        var courseClass = new CourseClass("Test class", 3, []);
        var course = new Course("Test course", [courseClass], null, null, null);
        assert.ok(!course.usesLeg("235", "212"));
    });

    QUnit.test("Course created with controls contains legs from each pair of consecutive controls it was created with", function (assert) {
        var courseClass = new CourseClass("Test class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [courseClass], 4.1, 115, controls);
        assert.ok(course.usesLeg(Course.START, "235"), "Course should use leg from start to control 1");
        assert.ok(course.usesLeg("235", "212"), "Course should use leg from control 1 to 2");
        assert.ok(course.usesLeg("212", "189"), "Course should use leg from control 2 to control 3");
        assert.ok(course.usesLeg("189", Course.FINISH), "Course should use leg from control 3 to the finish");
    });

    QUnit.test("Course created with empty list of controls contains leg from start to finish", function (assert) {
        var courseClass = new CourseClass("Test class", 0, []);
        var controls = [];
        var course = new Course("Test course", [courseClass], 4.1, 115, controls);
        assert.ok(course.usesLeg(Course.START, Course.FINISH), "Course should use leg from start to finish");
    });

    QUnit.test("Course created with empty list of controls does not contain legs with controls other than the start and finish", function (assert) {
        var courseClass = new CourseClass("Test class", 0, []);
        var controls = [];
        var course = new Course("Test course", [courseClass], 4.1, 115, controls);
        assert.ok(!course.usesLeg(Course.START, "212"), "Course should use leg from start to some control");
        assert.ok(!course.usesLeg("212", Course.FINISH), "Course should use leg from some control to the finish");
        assert.ok(!course.usesLeg("212", "189"), "Course should use leg from some control to some other control");
    });

    QUnit.test("Course created with controls does not contain legs that are not part of it", function (assert) {
        var courseClass = new CourseClass("Test class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [courseClass], 4.1, 115, controls);
        assert.ok(!course.usesLeg("200", "189"), "Course does not use leg from control not on the course");
        assert.ok(!course.usesLeg("212", "200"), "Course does not use leg to control not on the course");
        assert.ok(!course.usesLeg(Course.START, Course.FINISH), "Course does not use leg from start to finish");
        assert.ok(!course.usesLeg(Course.START, "212"), "Course does not use leg from the start to control 2");
        assert.ok(!course.usesLeg("212", Course.FINISH), "Course does not use leg from control 2 to the finish");
        assert.ok(!course.usesLeg("235", "189"), "Course does not use leg from control 1 to control 3");
    });

    QUnit.test("Course created with butterfly loops contains all legs despite central control being repeated", function (assert) {
        var courseClass = new CourseClass("Test class", 3, []);
        var controls = ["235", "212", "189", "194", "212", "208", "214", "222"];
        var course = new Course("Test course", [courseClass], 4.1, 115, controls);
        for (var i = 1; i < controls.length; i += 1) {
            assert.ok(course.usesLeg(controls[i - 1], controls[i]), "Course uses leg from control " + i + " to " + (i + 1));
        }
    });

    QUnit.test("Cannot get fastest splits for a leg of a course created without legs", function (assert) {
        var courseClass = new CourseClass("Test class", 3, []);
        var course = new Course("Test course", [courseClass], null, null, null);
        SplitsBrowserTest.assertInvalidData(assert, function () { course.getFastestSplitsForLeg("235", "212"); });
    });

    QUnit.test("Cannot get fastest splits for a leg that is not part of a course", function (assert) {
        var courseClass = new CourseClass("Test class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [courseClass], 4.1, 115, controls);
        SplitsBrowserTest.assertInvalidData(assert, function () { course.getFastestSplitsForLeg("235", "227"); });
    });

    QUnit.test("Returns empty array of fastest splits when course has no competitors", function (assert) {
        var courseClass = new CourseClass("Test class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [courseClass], 4.1, 115, controls);
        assert.deepEqual(course.getFastestSplitsForLeg("212", "189"), []);
    });

    QUnit.test("Returns single-element array of fastest splits when course has one class with two competitors", function (assert) {
        var result2 = getResult2();
        var courseClass = new CourseClass("Test class", 3, [getResult1(), result2]);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [courseClass], 4.1, 115, controls);
        assert.deepEqual(course.getFastestSplitsForLeg("212", "189"), [{name: result2.owner.name, className:"Test class", split: 184}]);
    });

    QUnit.test("Returns single-element array of fastest splits when course has one class with two competitors and one empty class", function (assert) {
        var result2 = getResult2();
        var courseClass = new CourseClass("Test class", 3, [getResult1(), result2]);
        var emptyClass = new CourseClass("Empty class", 3, []);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [courseClass, emptyClass], 4.1, 115, controls);
        assert.deepEqual(course.getFastestSplitsForLeg("212", "189"), [{name: result2.owner.name, className: courseClass.name, split: 184}]);
    });

    QUnit.test("Returns two-element array of fastest splits when course has two classes with one competitor each", function (assert) {
        var result1 = getResult1();
        var result2 = getResult2();
        var courseClass1 = new CourseClass("Test class 1", 3, [result1]);
        var courseClass2 = new CourseClass("Test class 2", 3, [result2]);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [courseClass1, courseClass2], 4.1, 115, controls);
        assert.deepEqual(course.getFastestSplitsForLeg("212", "189"), [{name: result1.owner.name, className: courseClass1.name, split: 212}, {name: result2.owner.name, className: courseClass2.name, split: 184}]);
    });

    QUnit.test("Returns empty list of competitors when attempting to fetch competitors visiting a control in an interval when there are no course-classes", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189"]);
        assert.deepEqual(course.getResultsAtControlInTimeRange("212", 10 * 3600, 11 * 3600), []);
    });

    QUnit.test("Returns empty list of competitors when attempting to fetch competitors visiting a control in an interval when course has no control information", function (assert) {
        var courseClass = new CourseClass("Test class", 3, [getResult1(), getResult2()]);
        var course = new Course("Test course", [courseClass], null, null, null);
        assert.deepEqual(course.getResultsAtControlInTimeRange("123", 10 * 3600, 11 * 3600), []);
    });

    QUnit.test("Returns empty list of competitors when attempting to fetch competitors visiting a control in an interval whose code does not exist in the course", function (assert) {
        var courseClass = new CourseClass("Test class", 3, [getResult1(), getResult2()]);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [courseClass], null, null, controls);
        assert.deepEqual(course.getResultsAtControlInTimeRange("456", 10 * 3600, 11 * 3600), []);
    });

    QUnit.test("Returns singleton list of competitors when attempting to fetch competitors visiting a control in an interval when the control is on the course", function (assert) {
        var result2 = getResult2();
        var courseClass = new CourseClass("Test class", 3, [getResult1(), result2]);
        var controls = ["235", "212", "189"];
        var course = new Course("Test course", [courseClass], null, null, controls);
        var expectedTime = 10 * 3600 + 65 + 221;
        assert.deepEqual(course.getResultsAtControlInTimeRange("212", expectedTime - 1, expectedTime + 1), [{name: result2.owner.name, time: expectedTime, className: courseClass.name}]);
    });

    QUnit.test("Returns list of competitors from two different classes when attempting to fetch competitors visiting a control in an interval when the control is on the course", function (assert) {
        var result1 = getResult1();
        var result2 = getResult2();
        var courseClass1 = new CourseClass("Test class 1", 3, [result1]);
        var courseClass2 = new CourseClass("Test class 2", 3, [result2]);
        var course = new Course("Test course", [courseClass1, courseClass2], null, null, ["235", "212", "189"]);
        var result1Time = 10 * 3600 + 30 * 60 + 81 + 197;
        var result2Time = 10 * 3600 + 65 + 221;
        assert.deepEqual(course.getResultsAtControlInTimeRange("212", result2Time - 1, result1Time + 1), [
            {name: result1.owner.name, time: result1Time, className: courseClass1.name},
            {name: result2.owner.name, time: result2Time, className: courseClass2.name}
        ]);
    });

    QUnit.test("Returns list of competitors punching both occurrences of a control when attempting to fetch competitors visiting a control in an interval", function (assert) {
        var result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106, 163]);
        var result2 = fromSplitTimes(2, "Second Runner", "DEF", 10 * 3600 + 35 * 60, [99, 184, 230, 111, 158]);

        var courseClass1 = new CourseClass("Test class 1", 3, [result1]);
        var courseClass2 = new CourseClass("Test class 2", 3, [result2]);
        var course = new Course("Test course", [courseClass1, courseClass2], null, null, ["235", "212", "235", "189"]);
        var result1Time = 10 * 3600 + 30 * 60 + 81 + 197 + 212;
        var result2Time = 10 * 3600 + 35 * 60 + 99;
        assert.deepEqual(course.getResultsAtControlInTimeRange("235", result2Time - 1, result1Time + 1), [
            {name: result2.owner.name, time: result2Time, className: courseClass2.name},
            {name: result1.owner.name, time: result1Time, className: courseClass1.name}
        ]);
    });

    QUnit.test("Returns singleton list of competitors from two different classes when attempting to fetch competitor times at the start for an interval", function (assert) {
        var result1 = getResult1();
        var courseClass1 = new CourseClass("Test class 1", 3, [result1]);
        var courseClass2 = new CourseClass("Test class 2", 3, [getResult2()]);
        var course = new Course("Test course", [courseClass1, courseClass2], null, null, ["235", "212", "189"]);
        assert.deepEqual(course.getResultsAtControlInTimeRange(Course.START, 10 * 3600 + 30 * 60 - 1, 10 * 3600 + 30 * 60 + 1),
            [{name: result1.owner.name, time: 10 * 3600 + 30 * 60, className: courseClass1.name}]);
    });

    QUnit.test("Returns singleton list of competitors from two different classes when attempting to fetch competitor times at the start for an interval", function (assert) {
        var result2 = getResult2();
        var courseClass1 = new CourseClass("Test class 1", 3, [getResult1()]);
        var courseClass2 = new CourseClass("Test class 2", 3, [result2]);
        var course = new Course("Test course", [courseClass1, courseClass2], null, null, ["235", "212", "189"]);
        var expectedTime = 10 * 3600 + 65 + 221 + 184 + 100;
        assert.deepEqual(course.getResultsAtControlInTimeRange(Course.FINISH, expectedTime - 1, expectedTime + 1),
            [{name: result2.owner.name, time: expectedTime, className: courseClass2.name}]);
    });

    QUnit.test("Course with no controls does not have a control", function (assert) {
        var course = new Course("Test course", [], null, null, null);
        assert.ok(!course.hasControl("235"));
    });

    QUnit.test("Course with controls does not have a control not on that course", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189"]);
        assert.ok(!course.hasControl("999"));
    });

    QUnit.test("Course with controls does have a control on that course", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189"]);
        assert.ok(course.hasControl("235"));
    });

    QUnit.test("Cannot return next control on course that has no controls", function (assert) {
        var course = new Course("Test course", [], null, null, null);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            course.getNextControls("235");
        });
    });

    QUnit.test("Cannot return next control after finish on course that has controls", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189"]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            course.getNextControls(Course.FINISH);
        });
    });

    QUnit.test("Cannot return next control after control not on course", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189"]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            course.getNextControls("999");
        });
    });

    QUnit.test("Can return next control after start as first control", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189"]);
        assert.deepEqual(course.getNextControls(Course.START), ["235"]);
    });

    QUnit.test("Can return next control after intermediate control", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189"]);
        assert.deepEqual(course.getNextControls("212"), ["189"]);
    });

    QUnit.test("Can return next control after last control as the finish", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189"]);
        assert.deepEqual(course.getNextControls("189"), [Course.FINISH]);
    });

    QUnit.test("Can return next control from start on course that has zero controls as the finish only", function (assert) {
        var course = new Course("Test course", [], null, null, []);
        assert.deepEqual(course.getNextControls(Course.START), [Course.FINISH]);
    });

    QUnit.test("Can return next controls after intermediate control that appears more than once", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", "189", "212", "197"]);
        assert.deepEqual(course.getNextControls("212"), ["189", "197"]);
    });

    QUnit.test("Can return next controls after intermediate finish controls", function (assert) {
        var course = new Course("Test course", [], null, null, ["235", "212", Course.INTERMEDIATE, "189", "244", Course.INTERMEDIATE, "197"]);
        assert.deepEqual(course.getNextControls(Course.INTERMEDIATE), ["189", "197"]);
    });
})();