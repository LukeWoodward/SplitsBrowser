/*
 *  SplitsBrowser - data-repair tests.
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

    module("Data Repair");
    
    var repairEventData = SplitsBrowser.DataRepair.repairEventData;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    function wrapInEventAndRepair(competitor) {
        var ageClass = new AgeClass("Test class", competitor.originalCumTimes.length - 2, [competitor]);
        var course = new Course("Test course", [ageClass], null, null, null);
        var eventData = new Event([ageClass], [course]);
        repairEventData(eventData);
    }
    
    QUnit.test("Can repair competitor with ascending cumulative times leaving them in ascending order", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);    
    });
    
    QUnit.test("Can repair competitor by setting second equal cumulative time to NaN", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        SplitsBrowserTest.assertStrictEqualArrays(assert, competitor.cumTimes, [0, 81, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);        
    });
    
    QUnit.test("Can repair competitor by setting second and third equal cumulative time to NaN", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        SplitsBrowserTest.assertStrictEqualArrays(assert, competitor.cumTimes, [0, 81, 81 + 197, NaN, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);        
    });
    
    QUnit.test("Can repair competitor with multiple missed splits by doing nothing", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, null, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });

    QUnit.test("Can repair competitor with absurdly high cumulative time by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with multiple absurdly high cumulative times by removing the offending times", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with absurdly high cumulative time followed by nulls by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, null, null, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, null, null, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with absurdly low cumulative time by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with multiple absurdly low cumulative times by removing the offending times", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with absurdly low cumulative time preceded by nulls by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, null, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair(competitor);
        assert.deepEqual(competitor.cumTimes, [0, 81, null, null, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });
})();