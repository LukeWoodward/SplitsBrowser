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
    
    function wrapInEventAndRepair(competitors) {
        var ageClass = new AgeClass("Test class", competitors[0].originalCumTimes.length - 2, competitors);
        var course = new Course("Test course", [ageClass], null, null, null);
        var eventData = new Event([ageClass], [course]);
        repairEventData(eventData);
    }
    
    QUnit.test("Can repair competitor with ascending cumulative times leaving them in ascending order", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);    
    });
    
    QUnit.test("Can repair competitor by setting second equal cumulative time to NaN", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        SplitsBrowserTest.assertStrictEqualArrays(assert, competitor.cumTimes, [0, 81, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);        
    });
    
    QUnit.test("Can repair competitor by setting second and third equal cumulative time to NaN", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        SplitsBrowserTest.assertStrictEqualArrays(assert, competitor.cumTimes, [0, 81, 81 + 197, NaN, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);        
    });
    
    QUnit.test("Can repair competitor with multiple missed splits by doing nothing", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, null, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });

    QUnit.test("Can repair competitor with absurdly high cumulative time by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with multiple absurdly high cumulative times by removing the offending times", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with absurdly high cumulative time followed by nulls by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 99999, null, null, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, null, null, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with absurdly low cumulative time by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with multiple absurdly low cumulative times by removing the offending times", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, [0, 81, NaN, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair competitor with absurdly low cumulative time preceded by nulls by removing the offending time", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, null, 1, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, [0, 81, null, null, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can adjust slightly negative finish time of competitor by adding a whole number of minutes to it", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 - 87]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 - 87 + 120]);
    });

    QUnit.test("Can adjust slightly negative finish time of two competitors by adding the same whole number of minutes to their finish cumulative times", function (assert) {
        var competitor1 = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 - 11]);
        var competitor2 = fromOriginalCumTimes(2, "John Smith", "ABC", 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 - 87]);
        wrapInEventAndRepair([competitor1, competitor2]);
        assert.deepEqual(competitor1.cumTimes, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 - 11 + 120]);
        assert.deepEqual(competitor2.cumTimes, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 - 87 + 120]);
    });

    QUnit.test("Can adjust negative finish time of exactly two minutes by adding three minutes to it", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 - 120]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 - 120 + 180]);
    });

    QUnit.test("Does not adjust wildly negative finish time of competitor", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 1]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });

    QUnit.test("Does not adjust wildly negative finish time of one competitors even if other competitor's finish split is not wildly negative", function (assert) {
        var competitor1 = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 1]);
        var competitor2 = fromOriginalCumTimes(2, "John Smith", "ABC", 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 - 87]);
        wrapInEventAndRepair([competitor1, competitor2]);
        assert.deepEqual(competitor1.cumTimes, competitor1.originalCumTimes);
        assert.deepEqual(competitor2.cumTimes, competitor2.originalCumTimes);
    });

    QUnit.test("Removes ridiculously low finish time of competitor if competitor mispunched but punches the last control and the finish", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, 81 + 197 + 212, 1]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, [0, 81, null, 81 + 197 + 212, NaN]);
    });

    QUnit.test("Makes no changes to a competitor that has failed to punch the finish but all other cumulative times are in order", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, null]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });

    QUnit.test("Does not remove ridiculously low finish time from mispunching competitor if they did not punch the last control", function (assert) {
        var competitor = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, null, 81 + 197 + 212, null, 1]);
        wrapInEventAndRepair([competitor]);
        assert.deepEqual(competitor.cumTimes, competitor.originalCumTimes);
    });
    
})();