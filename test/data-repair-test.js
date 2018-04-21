/*
 *  SplitsBrowser - data-repair tests.
 *  
 *  Copyright (C) 2000-2018 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    module("Data Repair");
    
    var repairEventData = SplitsBrowser.DataRepair.repairEventData;
    var transferCompetitorData = SplitsBrowser.DataRepair.transferCompetitorData;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    function wrapInEvent(competitors) {
        var courseClass = new CourseClass("Test class", competitors[0].originalCumTimes.length - 2, competitors);
        var course = new Course("Test course", [courseClass], null, null, null);
        var eventData = new Event([courseClass], [course]);
        return eventData;
    }
    
    /**
    * Wraps the given array of competitors in a course-class, course and event,
    * repair the event and return whether the course-class has dubious data.
    * @param {Array} competitors - Array of competitor objects.
    * @return {boolean} True if the course-class has dubious data, false
    *     otherwise.
    */
    function wrapInEventAndRepair(competitors) {
        var eventData = wrapInEvent(competitors);
        repairEventData(eventData);
        return eventData.classes[0].hasDubiousData;
    }
    
    function wrapInEventAndTransfer(competitors) {
        transferCompetitorData(wrapInEvent(competitors));
    }
    
    QUnit.test("Can repair competitor with ascending cumulative times leaving them in ascending order", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(!hasDubiousData);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);    
    });
    
    QUnit.test("Can repair competitor by setting second equal cumulative time to NaN", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        SplitsBrowserTest.assertStrictEqualArrays(assert, competitor.cumTimes, [0, 81, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);        
    });
    
    QUnit.test("Can repair competitor by setting second and third equal cumulative time to NaN", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        SplitsBrowserTest.assertStrictEqualArrays(assert, competitor.cumTimes, [0, 81, 81 + 197, NaN, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);        
    });
    
    QUnit.test("Can repair competitor with multiple missed splits by doing nothing", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, null, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(!hasDubiousData);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });
    
    QUnit.test("Can repair competitor with finish time equal to last control by doing nothing", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(!hasDubiousData);
        SplitsBrowserTest.assertStrictEqualArrays(assert, competitor.cumTimes, competitor.originalCumTimes);        
    });

    QUnit.test("Can repair competitor with absurdly high cumulative time by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with multiple absurdly high cumulative times by removing the offending times", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with absurdly high cumulative time followed by nulls by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, null, null, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, null, null, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with absurdly low cumulative time by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with multiple absurdly low cumulative times by removing the offending times", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with absurdly low cumulative time preceded by nulls by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, null, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        assert.deepEqual(competitor.cumTimes, [0, 81, null, null, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Removes ridiculously low finish time of competitor if competitor mispunched but punches the last control and the finish", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, 81 + 197 + 212, 1]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        assert.deepEqual(competitor.cumTimes, [0, 81, null, 81 + 197 + 212, NaN]);
    });

    QUnit.test("Makes no changes to a competitor that has failed to punch the finish but all other cumulative times are in order", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, null]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(!hasDubiousData);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });

    QUnit.test("Does not remove ridiculously low finish time from mispunching competitor if they did not punch the last control", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, 81 + 197 + 212, null, 1]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(!hasDubiousData);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });
    
    QUnit.test("Can repair competitor with two consecutive absurdly high cumulative times by removing them", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 5000, 6000, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        assert.deepEqual(competitor.cumTimes, [0, NaN, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });
    
    QUnit.test("Does not repair competitor with two absurdly high cumulative times separated only by a missing split", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 5000, null, 6000, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(!hasDubiousData);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });

    QUnit.test("Can repair competitor with zero cumulative times separated by two runs of nulls", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, null, null, null, 0, null, 0, 842, 1647]);
        var hasDubiousData = wrapInEventAndRepair([competitor]);
        assert.ok(hasDubiousData);
        assert.deepEqual(competitor.cumTimes, [0, null, null, null, NaN, null, NaN, 842, 1647]);
    });
    
    QUnit.test("Can transfer competitor with ascending cumulative times leaving them in ascending order", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndTransfer([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });

    QUnit.test("Can transfer competitor data with absurdly high cumulative time by leaving it as it is", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndTransfer([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });

    QUnit.test("Can transfer competitor data with absurdly low cumulative time by leaving it as it is", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndTransfer([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });

    QUnit.test("Can transfer competitor data with ridiculously low finish time by leaving it as it is", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, 81 + 197 + 212, 1]);
        wrapInEventAndTransfer([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });
    
    QUnit.test("Can transfer competitor data with two consecutive absurdly high cumulative times by leaving them as they are", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 5000, 6000, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndTransfer([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });
    
})();