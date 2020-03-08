/*
 *  SplitsBrowser - CourseClass tests.
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
(function (){
    "use strict";

    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    
    var fromSplitTimes = SplitsBrowserTest.fromSplitTimes;
    
    QUnit.module("Course-class");
    
    function getCompetitor1() {
        return fromSplitTimes(1, "Second Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
    }
    
    function getCompetitor1WithNullSplitForControl3() {
        return fromSplitTimes(1, "Second Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
    }
    
    function getCompetitor1WithNaNSplitForControl3() {
        var competitor = fromOriginalCumTimes(1, "Second Runner", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 - 30, 81 + 197 + 212 + 106]);
        competitor.setRepairedCumulativeTimes([0, 81, 81 + 197, NaN, 81 + 197 + 212 + 106]);
        return competitor;
    }
    
    function getCompetitor2() {
        return fromSplitTimes(2, "First Runner", "ABC", 10 * 3600, [65, 221, 184, 100]);
    }
    
    function getCompetitor2WithNullSplitForControl3() {
        return fromSplitTimes(2, "First Runner", "ABC", 10 * 3600, [65, 221, null, 100]);
    }
    
    function getTestClass() {
        return new CourseClass("Test class name", 3, [getCompetitor1(), getCompetitor2()]);
    }
    
    QUnit.test("Empty course-class is empty", function (assert) {
        var courseClass = new CourseClass("Test class name", 3, []);
        assert.ok(courseClass.isEmpty(), "Empty course-class should be empty");
    });
    
    QUnit.test("Non-empty course-class is not empty", function (assert) {
        var courseClass = new CourseClass("Test class name", 3, [getCompetitor1()]);
        assert.ok(!courseClass.isEmpty(), "Non-empty course-class should not be empty");
    });
    
    QUnit.test("Course-class initially created without any competitor data considered as dubious", function (assert) {
        var courseClass = getTestClass();
        assert.ok(!courseClass.hasDubiousData, "Original-data option should not be availabl");
    });
    
    QUnit.test("Course-class that has recorded that it has dubious data reports itself as so", function (assert) {
        var courseClass = getTestClass();
        courseClass.recordHasDubiousData();
        assert.ok(courseClass.hasDubiousData, "Original-data option should be available");
    });
    
    QUnit.test("Creating a class with competitors sets the class name in each competitor", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var courseClass = new CourseClass("Test class name", 3, [competitor1, competitor2]);
        assert.strictEqual(competitor1.className, courseClass.name);
        assert.strictEqual(competitor2.className, courseClass.name);
    });
    
    QUnit.test("Can return fastest split for a control", function (assert) {
        var competitor2 = getCompetitor2();
        var courseClass = new CourseClass("Test class name", 3, [getCompetitor1(), competitor2]);
        assert.deepEqual(courseClass.getFastestSplitTo(3), {name: competitor2.name, split: 184});
    });
    
    QUnit.test("Can return fastest split for the finish control", function (assert) {
        var competitor2 = getCompetitor2();
        var courseClass = new CourseClass("Test class name", 3, [getCompetitor1(), competitor2]);
        assert.deepEqual(courseClass.getFastestSplitTo(4), {name: competitor2.name, split: 100});
    });
    
    QUnit.test("Can return fastest split for a control ignoring null times", function (assert) {
        var competitor1 = getCompetitor1();
        var courseClass = new CourseClass("Test class name", 3, [competitor1, getCompetitor2WithNullSplitForControl3()]);
        assert.deepEqual(courseClass.getFastestSplitTo(3), {name: competitor1.name, split: 212});
    });
    
    QUnit.test("Can return fastest split for a control ignoring NaN times", function (assert) {
        var competitor2 = getCompetitor2();
        var courseClass = new CourseClass("Test class name", 3, [getCompetitor1WithNaNSplitForControl3(), competitor2]);
        assert.deepEqual(courseClass.getFastestSplitTo(3), {name: competitor2.name, split: 184});
    });
    
    QUnit.test("Returns null fastest split for a control that all competitors mispunched", function (assert) {
        var courseClass = new CourseClass("Test class name", 3, [getCompetitor1WithNullSplitForControl3(), getCompetitor2WithNullSplitForControl3()]);
        assert.strictEqual(courseClass.getFastestSplitTo(3), null);
    });
    
    QUnit.test("Returns null fastest split for a control in empty course-class", function (assert) {
        var courseClass = new CourseClass("Test class name", 3, []);
        assert.strictEqual(courseClass.getFastestSplitTo(3), null);
    });
    
    QUnit.test("Cannot return fastest split to control 0", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestClass().getFastestSplitTo(0); });
    });
    
    QUnit.test("Cannot return fastest split to control too large", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestClass().getFastestSplitTo(5); });
    });
    
    QUnit.test("Cannot return fastest split to a non-numeric control", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestClass().getFastestSplitTo("this is not a number"); });
    });
    
    QUnit.test("Cannot return competitors visiting a control in an interval if the control number is not numeric", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestClass().getCompetitorsAtControlInTimeRange("this is not a number", 10 * 3600, 12 * 3600); });
    });
    
    QUnit.test("Cannot return competitors visiting a control in an interval if the control number is NaN", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestClass().getCompetitorsAtControlInTimeRange(NaN, 10 * 3600, 12 * 3600); });
    });
    
    QUnit.test("Cannot return competitors visiting a control in an interval if the control number is negative", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestClass().getCompetitorsAtControlInTimeRange(-1, 10 * 3600, 12 * 3600); });
    });
    
    QUnit.test("Cannot return competitors visiting a control in an interval if the control number is too large", function (assert) {
        var courseClass = getTestClass();
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestClass().getCompetitorsAtControlInTimeRange(courseClass.numControls + 2, 10 * 3600, 12 * 3600); });
    });
    
    QUnit.test("Can return competitors visiting the start in an interval including only one competitor", function (assert) {
        var courseClass = getTestClass();
        var comp2 = courseClass.competitors[1];
        assert.deepEqual(courseClass.getCompetitorsAtControlInTimeRange(0, 10 * 3600 - 1, 10 * 3600 + 1), [{name: comp2.name, time: 10 * 3600}]); 
    });
    
    QUnit.test("Can return both competitors visiting the start in an interval including both competitors", function (assert) {
        assert.strictEqual(getTestClass().getCompetitorsAtControlInTimeRange(0, 10 * 3600 - 1, 10 * 3600 + 30 * 60 + 1).length, 2);
    });
    
    QUnit.test("Can return one competitor visiting control 2 when time interval surrounds the time the competitor visited that control", function (assert) {
        var expectedTime = 10 * 3600 + 30 * 60 + 81 + 197;
        var courseClass = getTestClass();
        var comp1 = courseClass.competitors[0];
        assert.deepEqual(courseClass.getCompetitorsAtControlInTimeRange(2, expectedTime - 1, expectedTime + 1), [{name: comp1.name, time: expectedTime}]);
    });
    
    QUnit.test("Can return one competitor visiting control 2 when time interval starts at the time the competitor visited that control", function (assert) {
        var expectedTime = 10 * 3600 + 30 * 60 + 81 + 197;
        var courseClass = getTestClass();
        var comp1 = courseClass.competitors[0];
        assert.deepEqual(courseClass.getCompetitorsAtControlInTimeRange(2, expectedTime, expectedTime + 2), [{name: comp1.name, time: expectedTime}]);
    });
    
    QUnit.test("Can return one competitor visiting control 2 when time interval ends at the time the competitor visited that control", function (assert) {
        var expectedTime = 10 * 3600 + 30 * 60 + 81 + 197;
        var courseClass = getTestClass();
        var comp1 = courseClass.competitors[0];
        assert.deepEqual(courseClass.getCompetitorsAtControlInTimeRange(2, expectedTime - 2, expectedTime), [{name: comp1.name, time: expectedTime}]);
    });
    
    QUnit.test("Can return empty list of competitors visiting the finish if the time interval doesn't include any of their finishing times", function (assert) {
        var courseClass = getTestClass();
        assert.deepEqual(courseClass.getCompetitorsAtControlInTimeRange(4, 10 * 3600 - 2, 10 * 3600 - 1), []);
    });

    QUnit.test("Can determine time-loss data for valid competitors in course-class", function (assert) {
        var courseClass = getTestClass();
        courseClass.determineTimeLosses();
        courseClass.competitors.forEach(function (comp) {
            [1, 2, 3, 4].forEach(function (controlIdx) {
                assert.ok(comp.getTimeLossAt(controlIdx) !== null, "Time-loss for competitor '" + comp.name + "' at control '" + controlIdx + "' should not be null");
            });
        });
    });

    QUnit.test("Can determine as all-null time-loss data for course-class with two competitors mispunching the same control", function (assert) {
        var courseClass = new CourseClass("Test class", 3, [getCompetitor1WithNullSplitForControl3(), getCompetitor2WithNullSplitForControl3()]);
        courseClass.determineTimeLosses();
        courseClass.competitors.forEach(function (comp) {
            [1, 2, 3, 4].forEach(function (controlIdx) {
                assert.strictEqual(comp.getTimeLossAt(controlIdx), null, "Time-loss for competitor '" + comp.name + "' at control '" + controlIdx + "' should be null");
            });
        });
    });
})();
