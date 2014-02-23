/*
 *  SplitsBrowser - Competitor tests.
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
(function (){
    "use strict";

    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var fromCumTimes = SplitsBrowser.Model.Competitor.fromCumTimes;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;

    function signum(n) {
        return (n < 0) ? -1 : ((n > 0) ? 1 : 0);
    }

    module("Competitor");
    
    var assertSplitTimes = function (assert, competitor, expectedSplitTimes) {
        expectedSplitTimes.forEach(function (splitTime, controlIdx) {
            assert.strictEqual(competitor.getSplitTimeTo(controlIdx + 1), splitTime);
        });
    };
    
    var assertOriginalSplitTimes = function (assert, competitor, expectedSplitTimes) {
        expectedSplitTimes.forEach(function (splitTime, controlIdx) {
            assert.strictEqual(competitor.getOriginalSplitTimeTo(controlIdx + 1), splitTime);
        });
    };
    
    var assertCumulativeTimes = function (assert, competitor, expectedCumulativeTimes) {
        expectedCumulativeTimes.forEach(function (splitTime, controlIdx) {
            assert.strictEqual(competitor.getCumulativeTimeTo(controlIdx), splitTime);
        });
    };
    
    var assertOriginalCumulativeTimes = function (assert, competitor, expectedCumulativeTimes) {
        expectedCumulativeTimes.forEach(function (splitTime, controlIdx) {
            assert.strictEqual(competitor.getOriginalCumulativeTimeTo(controlIdx), splitTime);
        });
    };

    QUnit.test("Cannot create a competitor from split times when the split times argument isn't a array", function (assert) {
        SplitsBrowserTest.assertException(assert, "TypeError", function () {
            fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, "This is not an array");
        });
    });

    QUnit.test("Cannot create a competitor from an empty array of split times", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, []);
        });
    });

    QUnit.test("Can create a competitor from split times and determine cumulative times", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        assertCumulativeTimes(assert, competitor, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assertSplitTimes(assert, competitor, [65, 221, 184, 100]);
        assert.ok(competitor.completed(), "Competitor should be marked as completing the course");
        assert.ok(!competitor.isNonCompetitive, "Competitor should be competitive");
        assert.strictEqual(competitor.getSuffix(), "", "Competitor should have no suffix");
    });

    QUnit.test("Can create a non-competitive competitor from split times and determine cumulative times", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        competitor.setNonCompetitive();
        assert.ok(competitor.isNonCompetitive, "Competitor should not be competitive");
        assert.strictEqual(competitor.getSuffix(), "n/c", "Competitor should have non-competitive suffix");
    });

    QUnit.test("Can create a competitor from split times and determine cumulative times when competitor has missed a control", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221,  null, 184, 100]);
        assertCumulativeTimes(assert, competitor, [0, 65, 65 + 221, null, null, null]);
        assertSplitTimes(assert, competitor, [65, 221, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
        assert.strictEqual(competitor.getSuffix(), "mp", "Competitor should have mispunched suffix");
    });

    QUnit.test("Can create a competitor from split times and determine cumulative times when competitor has missed multiple consecutive controls", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, null, null, null, null, 184, 100]);
        assertCumulativeTimes(assert, competitor, [0, 65, 65 + 221, null, null, null, null, null, null]);
        assertSplitTimes(assert, competitor, [65, 221, null, null, null, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Cannot create a competitor from cumulative times when the cumulative times argument isn't an array", function (assert) {
        SplitsBrowserTest.assertException(assert, "TypeError", function () {
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600, "This is not an array");
        });
    });

    QUnit.test("Cannot create a competitor from an empty array of cumulative times", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600, []);
        });
    });

    QUnit.test("Cannot create a competitor from an array of cumulative times that does not start with zero", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [40, 60, 90]);
        });
    });

    QUnit.test("Cannot create a competitor from an array of cumulative times containing only a single zero", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0]);
        });
    });

    QUnit.test("Can create a competitor from cumulative times and determine split times", function (assert) {
        var cumTimes = [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, cumTimes);
        assertCumulativeTimes(assert, competitor, cumTimes);
        assert.deepEqual(competitor.getAllCumulativeTimes(), cumTimes);
        assertSplitTimes(assert, competitor, [65, 221, 184, 100]);
        assert.ok(competitor.completed(), "Competitor should be marked as completing the course");
    });

    QUnit.test("Can create a competitor from cumulative times and determine split times when competitor has missed a control", function (assert) {
        var cumTimes = [0, 65, null, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, cumTimes);
        assertCumulativeTimes(assert, competitor, cumTimes);
        assert.deepEqual(competitor.getAllCumulativeTimes(), cumTimes);
        assertSplitTimes(assert, competitor, [65, null, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Can create a competitor from cumulative times and determine split times when competitor has missed multiple consecutive controls", function (assert) {
        var cumTimes = [0, 65, null, null, null, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, cumTimes);
        assertCumulativeTimes(assert, competitor, cumTimes);
        assertSplitTimes(assert, competitor, [65, null, null, null, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Can create a competitor from original cumulative times and determine original split times with final times not shown", function (assert) {
        var cumTimes = [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromOriginalCumTimes(1, "John Smith", "ABC", 10 * 3600, cumTimes);
        assertOriginalCumulativeTimes(assert, competitor, cumTimes);
        assertOriginalSplitTimes(assert, competitor, [65, 221, 184, 100]);
        assert.strictEqual(competitor.cumTimes, null);
        assert.strictEqual(competitor.splitTimes, null);
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), cumTimes);
    });

    QUnit.test("Can create a competitor from original cumulative times, set cleaned times with NaNs replacing dubious splits", function (assert) {
        var cumTimes = [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromOriginalCumTimes(1, "John Smith", "ABC", 10 * 3600, cumTimes);
        
        competitor.setCleanedCumulativeTimes([0, 65, 65 + 221, NaN, 65 + 221 + 184 + 100]);
        
        assert.strictEqual(competitor.getCumulativeTimeTo(0), 0);
        assert.strictEqual(competitor.getCumulativeTimeTo(1), 65);
        assert.strictEqual(competitor.getCumulativeTimeTo(2), 65 + 221);
        assert.ok(isNaN(competitor.getCumulativeTimeTo(3)));
        assert.strictEqual(competitor.getCumulativeTimeTo(4), 65 + 221 + 184 + 100);
        
        assert.strictEqual(competitor.getSplitTimeTo(0), 0);
        assert.strictEqual(competitor.getSplitTimeTo(1), 65);
        assert.strictEqual(competitor.getSplitTimeTo(2), 221);
        assert.ok(isNaN(competitor.getSplitTimeTo(3)));
        assert.ok(isNaN(competitor.getSplitTimeTo(4)));
    });
    
    QUnit.test("Competitor with start time but all-null splits is not lacking a start time", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [null, null, null, null]);
        assert.ok(!competitor.lacksStartTime());
    });
        
    QUnit.test("Competitor with start time and splits is not lacking a start time", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        assert.ok(!competitor.lacksStartTime());
    });
        
    QUnit.test("Competitor with no start time nor any splits is not lacking a start time", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", null, [null, null, null, null]);
        assert.ok(!competitor.lacksStartTime());
    });
        
    QUnit.test("Competitor with no start time but all splits is lacking a start time", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", null, [65, 221, 184, 100]);
        assert.ok(competitor.lacksStartTime());
    });
        
    QUnit.test("Competitor with no start time but some splits is lacking a start time", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", null, [65, null, null, 100]);
        assert.ok(competitor.lacksStartTime());
    });

    QUnit.test("Can determine total time of a competitor that punches all controls", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        assert.strictEqual(competitor.totalTime, 65 + 221 + 184 + 100, "Wrong total time");
    });

    QUnit.test("Determines total time of a competitor that mispunches as null", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
        assert.strictEqual(competitor.totalTime, null, "Total time should be null");
    });
    
    QUnit.test("Competitor with valid time compares equal to itself", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [154]);
        assert.strictEqual(compareCompetitors(competitor, competitor), 0);
    });

    QUnit.test("Competitor with lower total time comes before competitor with higher total time", function (assert) {
        var competitor1 = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [154]);
        var competitor2 = fromSplitTimes(2, "Fred Baker", "DEF", 12 * 3600, [188]);
        assert.strictEqual(signum(compareCompetitors(competitor1, competitor2)), -1);
    });

    QUnit.test("Competitor with higher total time comes before competitor with higher total time", function (assert) {
        var competitor1 = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [188]);
        var competitor2 = fromSplitTimes(2, "Fred Baker", "DEF", 12 * 3600, [154]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Competitor with lower order comes before competitor with same total time but higher order", function (assert) {
        var competitor1 = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [188]);
        var competitor2 = fromSplitTimes(2, "Fred Baker", "DEF", 12 * 3600, [188]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
    });

    QUnit.test("Competitor with higher order comes after competitor with same total time but lower order", function (assert) {
        var competitor1 = fromSplitTimes(3, "John Smith", "ABC", 10 * 3600, [188]);
        var competitor2 = fromSplitTimes(2, "Fred Baker", "DEF", 12 * 3600, [188]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Competitor with valid time comes before mispunching competitor", function (assert) {
        var competitor1 = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [154]);
        var competitor2 = fromSplitTimes(2, "Fred Baker", "DEF", 12 * 3600, [null]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
    });

    QUnit.test("Mispunching competitor compares equal to itself", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [null]);
        assert.strictEqual(compareCompetitors(competitor, competitor), 0);
    });

    QUnit.test("Mispunching competitor comes after competitor with valid time", function (assert) {
        var competitor1 = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [null]);
        var competitor2 = fromSplitTimes(2, "Fred Baker", "DEF", 12 * 3600, [188]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Mispunching competitor with lower order comes before mispunching competitor with higher order", function (assert) {
        var competitor1 = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [null]);
        var competitor2 = fromSplitTimes(2, "Fred Baker", "DEF", 12 * 3600, [null]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
    });

    QUnit.test("Mispunching competitor with higher order comes before mispunching competitor with lower order", function (assert) {
        var competitor1 = fromSplitTimes(3, "John Smith", "ABC", 10 * 3600, [null]);
        var competitor2 = fromSplitTimes(2, "Fred Baker", "DEF", 12 * 3600, [null]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Can adjust a competitor's cumulative times by reference data with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [0, 4, 4 + 28, 4 + 28 + 8, 4 + 28 + 8 - 3];
        assert.deepEqual(competitor.getCumTimesAdjustedToReference(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Can adjust a competitor's cumulative times with a missing time by reference data with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [0, 4, 4 + 28, null, null];
        assert.deepEqual(competitor.getCumTimesAdjustedToReference(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Cannot adjust a competitor's cumulative times by reference data with a different number of times", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor.getCumTimesAdjustedToReference(referenceCumTimes);
        });
    });

    QUnit.test("Cannot adjust a competitor's cumulative times by reference data with a null value", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, null, 61 + 193 + 176 + 103];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor.getCumTimesAdjustedToReference(referenceCumTimes);
        });
    });

    QUnit.test("Can adjust a competitor's cumulative times by reference data and add start time with all valid times and same number of controls", function (assert) {
        var startTime = 10 * 3600 + 41 * 60;
        var competitor = fromSplitTimes(1, "John Smith", "ABC", startTime, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [startTime, startTime + 4, startTime + 4 + 28, startTime + 4 + 28 + 8, startTime + 4 + 28 + 8 - 3];
        assert.deepEqual(competitor.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Can adjust a competitor's cumulative times with a missing time by reference data and add start time with all valid times and same number of controls", function (assert) {
        var startTime = 10 * 3600 + 41 * 60;
        var competitor = fromSplitTimes(1, "John Smith", "ABC", startTime, [65, 221, null, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [startTime, startTime + 4, startTime + 4 + 28, null, null];
        assert.deepEqual(competitor.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Cannot adjust a competitor's cumulative times by reference data and add start time with a different number of times", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600 + 41 * 60, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes);
        });
    });

    QUnit.test("Cannot adjust a competitor's cumulative times by reference data and add start time if reference data contains a null value", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600 + 41 * 60, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, null, 61 + 193 + 176 + 103];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes);
        });
    });

    QUnit.test("Can determine the percentages a competitor is behind reference data with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, 100 * (184 - 176) / 176, 100 * (100 - 103) / 103];
        assert.deepEqual(competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });

    QUnit.test("Can determine the percentages a competitor with a missing time is behind reference data with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, null, 100 * (100 - 103) / 103];
        assert.deepEqual(competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });

    QUnit.test("Cannot determine the percentages a competitor is behind reference data with a different number of times", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes);
        });
    });

    QUnit.test("Cannot determine the percentages a competitor is behind reference data with a null value", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, null, 61 + 193 + 176 + 103];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes);
        });
    });

    QUnit.test("Can determine the percentages a competitor is behind reference data, with a null percentage for a zero split", function (assert) {

        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, null, 100 * (100 - 176 - 103) / (103 + 176)];
        assert.deepEqual(competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });
    
    QUnit.test("Can determine time losses of competitor with even number of splits", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [96, 221, 184, 100]);
        var fastestSplits = [65, 209, 184, 97];
        competitor.determineTimeLosses(fastestSplits);
        assert.strictEqual(competitor.getTimeLossAt(0), null);
        
        // Split ratios are 1.4769, 1.05742, 1, 1.03093
        // median is 1.04417
        // expected times are therefore 67.8711, 218.232, 192.1277, 101.2847
        // time losses are then  28.1288, 2.7680, -8.1277, -1.2847
        
        assert.strictEqual(competitor.getTimeLossAt(1), 28);
        assert.strictEqual(competitor.getTimeLossAt(2), 3);
        assert.strictEqual(competitor.getTimeLossAt(3), -8);
        assert.strictEqual(competitor.getTimeLossAt(4), -1);
    });
    
    QUnit.test("Can determine time losses of competitor with odd number of splits", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [96, 221, 100]);
        var fastestSplits = [65, 209, 97];
        competitor.determineTimeLosses(fastestSplits);
        assert.strictEqual(competitor.getTimeLossAt(0), null);
        
        // Split ratios are 1.4769, 1.05742, 1.03093
        // median is 1.05742
        // expected times are therefore 68.7321, 211, 192.1277, 102.5694
        // time losses are then 27.2679, 0, -2.5694
        
        assert.strictEqual(competitor.getTimeLossAt(1), 27);
        assert.strictEqual(competitor.getTimeLossAt(2), 0);
        assert.strictEqual(competitor.getTimeLossAt(3), -3);
    });
    
    QUnit.test("Cannot determine time losses of competitor when given wrong number of reference splits", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [96, 221, 184, 100]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor.determineTimeLosses([65, 209, 97]);
        });
    });
    
    QUnit.test("Cannot determine time losses of competitor when given split times with null value", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [96, 221, 184, 100]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor.determineTimeLosses([65, 209, null, 97]);
        });
    });
    
    QUnit.test("Cannot determine time losses of competitor when given split times with NaN value", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [96, 221, 184, 100]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor.determineTimeLosses([65, 209, NaN, 97]);
        });
    });
    
    QUnit.test("Can determine time losses as all NaN if competitor has NaN cleaned split", function (assert) {
        var competitor = fromOriginalCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 96, 96 + 221, 96 + 221 + 184, 96 + 221 + 184 + 100]);
        competitor.setCleanedCumulativeTimes([0, 96, 96 + 221, NaN, 96 + 221 + 184 + 100]);
        var fastestSplits = [65, 209, 184, 97];
        competitor.determineTimeLosses(fastestSplits);
        
        for (var control = 1; control < 5; control += 1) {
            var timeLoss = competitor.getTimeLossAt(control);
            assert.ok(isNaNStrict(timeLoss), "Time loss at control " + control + " should be NaN, but got " + timeLoss);
        }
    });
    
    QUnit.test("Can determine time losses as all null if competitor mispunches", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [96, 221, null, 100]);
        competitor.determineTimeLosses([65, 209, 184, 97]);
        for (var controlIdx = 0; controlIdx <= 4; controlIdx += 1) {
            assert.strictEqual(competitor.getTimeLossAt(controlIdx), null);
        }
    });
    
    QUnit.test("Can determine time losses as all null if competitor mispunches even if fastest times also have null in them", function (assert) {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [96, 221, null, 100]);
        competitor.determineTimeLosses([65, 209, null, 97]);
        for (var controlIdx = 0; controlIdx <= 4; controlIdx += 1) {
            assert.strictEqual(competitor.getTimeLossAt(controlIdx), null);
        }
    });
    
    QUnit.test("Cannot determine that a competitor crosses another one with a different number of controls", function (assert) {
        var competitor1 = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 221, 384, 421]);
        var competitor2 = fromCumTimes(2, "Fred Baker", "DEF", 12 * 3600, [0, 71, 218, 379, 440, 491]);
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            competitor1.crosses(competitor2);
        });
    });
    
    QUnit.test("Can determine that a competitor does not cross themselves", function (assert) {
        var competitor = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 221, 384, 421]);
        assert.ok(!competitor.crosses(competitor), "Competitor should not cross themselves");
    });
    
    QUnit.test("Can determine that a competitor does not cross a competitor with identical splits starting an hour later", function (assert) {
        var competitor1 = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 221, 384, 421]);
        var competitor2 = fromCumTimes(2, "Fred Baker", "DEF", 11 * 3600, [0, 65, 221, 384, 421]);
        assert.ok(!competitor1.crosses(competitor2), "Competitors should not cross");
    });
    
    QUnit.test("Can determine that a competitor does not cross a competitor with identical splits starting an hour earlier", function (assert) {
        var competitor1 = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 221, 384, 421]);
        var competitor2 = fromCumTimes(2, "Fred Baker", "DEF",  9 * 3600, [0, 65, 221, 384, 421]);
        assert.ok(!competitor1.crosses(competitor2), "Competitors should not cross");
    });
    
    QUnit.test("Can determine that two competitors cross on the way to control 1", function (assert) {
        var competitor1 = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 221, 384, 421]);
        var competitor2 = fromCumTimes(2, "Fred Baker", "DEF", 10 * 3600 - 60, [0, 265, 421, 584, 621]);
        assert.ok(competitor1.crosses(competitor2), "Competitors should cross");
    });
    
    QUnit.test("Can determine that two competitors cross between controls 2 and 3", function (assert) {
        var competitor1 = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 221, 384, 421]);
        var competitor2 = fromCumTimes(2, "Fred Baker", "DEF", 10 * 3600 - 60, [0, 65, 221, 584, 621]);
        assert.ok(competitor1.crosses(competitor2), "Competitors should cross");
    });
    
    QUnit.test("Can determine that two competitors cross between controls 1 and 2 and cross back later", function (assert) {
        var competitor1 = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 221, 384, 721]);
        var competitor2 = fromCumTimes(2, "Fred Baker", "DEF", 10 * 3600 - 60, [0, 65, 421, 584, 621]);
        assert.ok(competitor1.crosses(competitor2), "Competitors should cross");
    });
    
    QUnit.test("Can determine that two competitors do not cross between because the first one has a null split", function (assert) {
        var competitor1 = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, null, 384, 521]);
        var competitor2 = fromCumTimes(2, "Fred Baker", "DEF", 10 * 3600 - 60, [0, 65, 221, 384, 521]);
        assert.ok(!competitor1.crosses(competitor2), "Competitors should not cross");
    });
    
    QUnit.test("Can determine that two competitors do not cross between because the second one has a null split", function (assert) {
        var competitor1 = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 221, 384, 521]);
        var competitor2 = fromCumTimes(2, "Fred Baker", "DEF", 10 * 3600 - 60, [0, 65, 221, null, 521]);
        assert.ok(!competitor1.crosses(competitor2), "Competitors should not cross");
    });
})();
