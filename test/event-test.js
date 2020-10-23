/*
 *  SplitsBrowser - Event tests.
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

    const isNotNull = SplitsBrowser.isNotNull;
    const fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    const Event = SplitsBrowser.Model.Event;
    const CourseClass = SplitsBrowser.Model.CourseClass;
    const Course = SplitsBrowser.Model.Course;

    const fromSplitTimes = SplitsBrowserTest.fromSplitTimes;

    QUnit.module("Event");

    function getResult1() {
        return fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
    }

    function getResult2() {
        return fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [65, 221, 184, 100]);
    }

    function getResult2WithExtraSplit() {
        return fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [65, 221, 184, 157, 100]);
    }

    QUnit.test("Returns empty list of fastest splits to a leg if the event has no competitors", function (assert) {
        let event = new Event([], []);
        assert.deepEqual(event.getFastestSplitsForLeg("235", "212"), []);
    });

    QUnit.test("Returns fastest split to a leg if the event has a single class with competitors on that leg", function (assert) {
        let result2 = getResult2();
        let courseClass = new CourseClass("Test class", 3, [getResult1(), result2]);
        let course = new Course("Test course", [courseClass], null, null, ["235", "212", "189"]);
        let event = new Event([courseClass], [course]);
        assert.deepEqual(event.getFastestSplitsForLeg("212", "189"), [{name: result2.owner.name, className: courseClass.name, split: 184}]);
    });

    QUnit.test("Returns empty list of fastest splits to a leg if the event has a single course with competitors not on that leg", function (assert) {
        let courseClass = new CourseClass("Test class", 3, [getResult1(), getResult2()]);
        let course = new Course("Test course", [courseClass], null, null, ["235", "212", "189"]);
        let event = new Event([courseClass], [course]);
        assert.deepEqual(event.getFastestSplitsForLeg("235", "189"), []);
    });

    QUnit.test("Returns list of fastest splits to a leg if the event has two courses with competitors in each on that leg, sorted into split order", function (assert) {
        let result1 = getResult1();
        let result2 = getResult2WithExtraSplit();
        let courseClass1 = new CourseClass("Test class 1", 3, [result1]);
        let courseClass2 = new CourseClass("Test class 2", 4, [result2]);
        let course1 = new Course("Test course 1", [courseClass1], null, null, ["235", "212", "189"]);
        let course2 = new Course("Test course 2", [courseClass2], null, null, ["226", "212", "189", "211"]);

        let event = new Event([courseClass1, courseClass2], [course1, course2]);
        assert.deepEqual(event.getFastestSplitsForLeg("212", "189"), [{name: result2.owner.name, className: courseClass2.name, split: 184}, {name: result1.owner.name, className: courseClass1.name, split: 212}]);
    });

    QUnit.test("Returns empty list of competitors visiting a control during an interval when the event has no courses", function (assert) {
        let event = new Event([], []);
        assert.deepEqual(event.getResultsAtControlInTimeRange("212", 10 * 3600, 11 * 3600), []);
    });

    QUnit.test("Returns list of competitors visiting a control during an interval if the event has a single class with competitors visiting that control, with competitors sorted in order of time", function (assert) {
        let result1 = getResult1();
        let result2 = getResult2();
        let courseClass = new CourseClass("Test class", 3, [result1, result2]);
        let course = new Course("Test course", [courseClass], null, null, ["235", "212", "189"]);

        let event = new Event([courseClass], [course]);
        let result1Time = 10 * 3600 + 30 * 60 + 81 + 197;
        let result2Time = 10 * 3600 + 65 + 221;
        assert.deepEqual(event.getResultsAtControlInTimeRange("212", result2Time - 1, result1Time + 1), [
            {name: result2.owner.name, className: courseClass.name, time: result2Time},
            {name: result1.owner.name, className: courseClass.name, time: result1Time}
        ]);
    });

    QUnit.test("Returns list of competitors visiting a control during an interval if the event has two courses and with one class each with competitors visiting that control, with competitors sorted in order of time", function (assert) {
        let result1 = getResult1();
        let result2 = getResult2WithExtraSplit();
        let courseClass1 = new CourseClass("Test class 1", 3, [result1]);
        let courseClass2 = new CourseClass("Test class 2", 4, [result2]);
        let course1 = new Course("Test course 1", [courseClass1], null, null, ["235", "212", "189"]);
        let course2 = new Course("Test course 2", [courseClass2], null, null, ["226", "212", "189", "211"]);

        let event = new Event([courseClass1, courseClass2], [course1, course2]);
        let result1Time = 10 * 3600 + 30 * 60 + 81 + 197;
        let result2Time = 10 * 3600 + 65 + 221;
        assert.deepEqual(event.getResultsAtControlInTimeRange("212", result2Time - 1, result1Time + 1), [
            {name: result2.owner.name, className: courseClass2.name, time: result2Time},
            {name: result1.owner.name, className: courseClass1.name, time: result1Time}
        ]);
    });

    QUnit.test("Returns empty array of next controls for control that does not exist in any course", function (assert) {
        let course1 = new Course("Test course 1", [], null, null, ["235", "212", "189", "214"]);
        let course2 = new Course("Test course 2", [], null, null, ["226", "212", "189", "211"]);

        let event = new Event([], [course1, course2]);
        assert.deepEqual(event.getNextControlsAfter("999"), []);
    });

    QUnit.test("Returns single-element array of next controls for control that exists only in one course", function (assert) {
        let course1 = new Course("Test course 1", [], null, null, ["235", "212", "189", "214"]);
        let course2 = new Course("Test course 2", [], null, null, ["226", "212", "189", "211"]);

        let event = new Event([], [course1, course2]);
        assert.deepEqual(event.getNextControlsAfter("226"), [{course: course2, nextControls: ["212"]}]);
    });

    QUnit.test("Returns two-element array of next controls for control that exists in both courses", function (assert) {
        let course1 = new Course("Test course 1", [], null, null, ["235", "212", "189", "214"]);
        let course2 = new Course("Test course 2", [], null, null, ["226", "212", "189", "211"]);

        let event = new Event([], [course1, course2]);
        assert.deepEqual(event.getNextControlsAfter("189"), [{course: course1, nextControls: ["214"]}, {course: course2, nextControls: ["211"]}]);
    });

    QUnit.test("Returns two-element array of next controls after the start", function (assert) {
        let course1 = new Course("Test course 1", [], null, null, ["235", "212", "189", "214"]);
        let course2 = new Course("Test course 2", [], null, null, ["226", "212", "189", "211"]);

        let event = new Event([], [course1, course2]);
        assert.deepEqual(event.getNextControlsAfter(Course.START), [{course: course1, nextControls: ["235"]}, {course: course2, nextControls: ["226"]}]);
    });

    QUnit.test("Determines time losses in each class when asked to do so", function (assert) {
        let result1 = getResult1();
        let result2 = getResult2();
        let courseClass1 = new CourseClass("Test class 1", 3, [result1]);
        let courseClass2 = new CourseClass("Test class 2", 3, [result2]);
        let course1 = new Course("Test course 1", [courseClass1], null, null, ["235", "212", "189"]);
        let course2 = new Course("Test course 2", [courseClass2], null, null, ["226", "212", "189"]);

        let event = new Event([courseClass1, courseClass2], [course1, course2]);
        assert.strictEqual(result1.getTimeLossAt(2), null);
        assert.strictEqual(result2.getTimeLossAt(2), null);
        event.determineTimeLosses();
        assert.ok(isNotNull(result1.getTimeLossAt(2)));
        assert.ok(isNotNull(result2.getTimeLossAt(2)));
    });

    QUnit.test("Event that does not need repairing reports that it doesn't", function (assert) {
        let result = getResult1();
        let courseClass = new CourseClass("Test class", 3, [result]);
        let course = new Course("Test course", [courseClass], null, null, ["235", "212", "189"]);

        let event = new Event([courseClass], [course]);
        assert.ok(!event.needsRepair());
    });

    QUnit.test("Event that does need repairing reports that it does", function (assert) {
        let result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 81 + 0, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
        let courseClass = new CourseClass("Test class", 3, [result]);
        let course = new Course("Test course", [courseClass], null, null, ["235", "212", "189"]);

        let event = new Event([courseClass], [course]);
        assert.ok(event.needsRepair());
    });
})();