/*
 *  SplitsBrowser - Result tests.
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

    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;
    var compareResults = SplitsBrowser.Model.compareResults;
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var createTeamResult = SplitsBrowser.Model.Result.createTeamResult;

    function signum(n) {
        return (n < 0) ? -1 : ((n > 0) ? 1 : 0);
    }

    QUnit.module("Result");
    
    var assertSplitTimes = function (assert, result, expectedSplitTimes) {
        expectedSplitTimes.forEach(function (splitTime, controlIdx) {
            assert.strictEqual(result.getSplitTimeTo(controlIdx + 1), splitTime);
        });
    };
    
    var assertOriginalSplitTimes = function (assert, result, expectedSplitTimes) {
        expectedSplitTimes.forEach(function (splitTime, controlIdx) {
            assert.strictEqual(result.getOriginalSplitTimeTo(controlIdx + 1), splitTime);
        });
    };
    
    var assertCumulativeTimes = function (assert, result, expectedCumulativeTimes) {
        expectedCumulativeTimes.forEach(function (splitTime, controlIdx) {
            assert.strictEqual(result.getCumulativeTimeTo(controlIdx), splitTime);
        });
    };
    
    var assertOriginalCumulativeTimes = function (assert, result, expectedCumulativeTimes) {
        expectedCumulativeTimes.forEach(function (splitTime, controlIdx) {
            assert.strictEqual(result.getOriginalCumulativeTimeTo(controlIdx), splitTime);
        });
    };

    QUnit.test("Cannot create a result from cumulative times when the order isn't a number", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            fromCumTimes("This is not a number", 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        });
    });

    QUnit.test("Cannot create a result from cumulative times when the cumulative times argument isn't an array", function (assert) {
        SplitsBrowserTest.assertException(assert, "TypeError", function () {
            fromCumTimes(1, 10 * 3600, "This is not an array");
        });
    });

    QUnit.test("Cannot create a result from an empty array of cumulative times", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            fromCumTimes(1, 10 * 3600, []);
        });
    });

    QUnit.test("Cannot create a result from an array of cumulative times that does not start with zero", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            fromCumTimes(1, 10 * 3600, [40, 60, 90]);
        });
    });

    QUnit.test("Cannot create a result from an array of cumulative times containing only a single zero", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            fromCumTimes(1, 10 * 3600, [0]);
        });
    });

    QUnit.test("Can create a result from cumulative times and determine split times", function (assert) {
        var cumTimes = [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var result = fromCumTimes(1, 10 * 3600, cumTimes);
        assertCumulativeTimes(assert, result, cumTimes);
        assert.deepEqual(result.getAllCumulativeTimes(), cumTimes);
        assertSplitTimes(assert, result, [65, 221, 184, 100]);
        assert.ok(result.completed(), "Result should be marked as completing the course");
        assert.ok(!result.isOKDespiteMissingTimes, "Result should not be marked as OK despite having missing times");
        assert.ok(!result.isNonCompetitive, "Result should not be marked as non-competitive");
        assert.ok(!result.isNonStarter, "Result should not be a non-starter");
        assert.ok(!result.isNonFinisher, "Result should not be a non-finisher");
        assert.ok(!result.isDisqualified, "Result should not be disqualified");
        assert.ok(!result.isOverMaxTime, "Result should not be over max time");
    });

    QUnit.test("Can create a result from cumulative times and determine split times when result has missed a control", function (assert) {
        var cumTimes = [0, 65, null, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var result = fromCumTimes(1, 10 * 3600, cumTimes);
        assertCumulativeTimes(assert, result, cumTimes);
        assert.deepEqual(result.getAllCumulativeTimes(), cumTimes);
        assertSplitTimes(assert, result, [65, null, null, 184, 100]);
        assert.ok(!result.completed(), "Result should be marked as not completing the course");
    });

    QUnit.test("Can create a result from cumulative times and determine split times when result has missed multiple consecutive controls", function (assert) {
        var cumTimes = [0, 65, null, null, null, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var result = fromCumTimes(1, 10 * 3600, cumTimes);
        assertCumulativeTimes(assert, result, cumTimes);
        assertSplitTimes(assert, result, [65, null, null, null, null, 184, 100]);
        assert.ok(!result.completed(), "Result should be marked as not completing the course");
    });

    QUnit.test("Can create a non-competitive result from cumulative times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        result.setNonCompetitive();
        assert.ok(result.completed(), "Result should be marked as completing the course");
        assert.ok(!result.isOKDespiteMissingTimes, "Result should not be marked as OK despite having missing times");
        assert.ok(result.isNonCompetitive, "Result should not be competitive");
        assert.ok(!result.isNonStarter, "Result should not be a non-starter");
        assert.ok(!result.isNonFinisher, "Result should not be a non-finisher");
        assert.ok(!result.isDisqualified, "Result should not be disqualified");
        assert.ok(!result.isOverMaxTime, "Result should not be over max time");
    });

    QUnit.test("Can create a non-starting result from cumulative times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, null, null, null, null]);
        result.setNonStarter();
        assert.ok(!result.completed(), "Result should not be marked as completing the course");
        assert.ok(!result.isOKDespiteMissingTimes, "Result should not be marked as OK despite having missing times");
        assert.ok(!result.isNonCompetitive, "Result should not be marked as non-competitive");
        assert.ok(result.isNonStarter, "Result should be a non-starter");
        assert.ok(!result.isNonFinisher, "Result should not be a non-finisher");
        assert.ok(!result.isDisqualified, "Result should not be disqualified");                
        assert.ok(!result.isOverMaxTime, "Result should not be over max time");
    });

    QUnit.test("Can create a non-finishing result from cumulative times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, null, null]);
        result.setNonFinisher();
        assert.ok(!result.completed(), "Result should be marked as completing the course");
        assert.ok(!result.isOKDespiteMissingTimes, "Result should not be marked as OK despite having missing times");
        assert.ok(!result.isNonCompetitive, "Result should not be marked as non-competitive");
        assert.ok(!result.isNonStarter, "Result should not be a non-starter");
        assert.ok(result.isNonFinisher, "Result should be a non-finisher");
        assert.ok(!result.isDisqualified, "Result should not be disqualified");        
        assert.ok(!result.isOverMaxTime, "Result should not be over max time");
    });

    QUnit.test("Can obtain null cumulative and split times for non-starting result beyond the end of their controls", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, null]);
        result.setNonStarter();
        assert.strictEqual(null, result.getOriginalCumulativeTimeTo(6));
        assert.strictEqual(null, result.getOriginalSplitTimeTo(6));
    });

    QUnit.test("Can create a disqualified result from cumulative times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        result.disqualify();
        assert.ok(!result.completed(), "Disqualified result should not be marked as completing the course");
        assert.ok(!result.isOKDespiteMissingTimes, "Result should not be marked as OK despite having missing times");
        assert.ok(!result.isNonCompetitive, "Result should not be marked as non-competitive");
        assert.ok(!result.isNonStarter, "Result should not be a non-starter");
        assert.ok(!result.isNonFinisher, "Result should not be a non-finisher");
        assert.ok(result.isDisqualified, "Result should be disqualified");
        assert.ok(!result.isOverMaxTime, "Result should not be over max time");
    });

    QUnit.test("Can create an over-max-time result from cumulative times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        result.setOverMaxTime();
        assert.ok(!result.completed(), "Over-max-time result should not be marked as completing the course");
        assert.ok(!result.isOKDespiteMissingTimes, "Result should not be marked as OK despite having missing times");
        assert.ok(!result.isNonCompetitive, "Result should not be marked as non-competitive");
        assert.ok(!result.isNonStarter, "Result should not be a non-starter");
        assert.ok(!result.isNonFinisher, "Result should not be a non-finisher");
        assert.ok(!result.isDisqualified, "Result should not be disqualified");
        assert.ok(result.isOverMaxTime, "Result should be over max time");
    });

    QUnit.test("Can create a result marked as OK despite missing times from cumulative times", function (assert) {
        var cumTimes = [0, 65, 65 + 221, null, 65 + 221 + 184 + 100];
        var result = fromCumTimes(1, 10 * 3600, cumTimes);
        result.setOKDespiteMissingTimes();
        assert.ok(result.completed(), "OK-despite-missing-times result should be marked as completing the course");
        assert.ok(result.isOKDespiteMissingTimes, "Result should be marked as OK despite having missing times");
        assert.ok(!result.isNonCompetitive, "Result should not be marked as non-competitive");
        assert.ok(!result.isNonStarter, "Result should not be a non-starter");
        assert.ok(!result.isNonFinisher, "Result should not be a non-finisher");
        assert.ok(!result.isDisqualified, "Result should not be disqualified");
        assert.ok(!result.isOverMaxTime, "Result should be over max time");
        assert.strictEqual(65 + 221 + 184 + 100, result.totalTime, "OK-despite-missing-times result should have a total time");
    });

    QUnit.test("Can create a result from original cumulative times and determine original split times with final times still null", function (assert) {
        var cumTimes = [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var result = fromOriginalCumTimes(1, 10 * 3600, cumTimes);
        assertOriginalCumulativeTimes(assert, result, cumTimes);
        assertOriginalSplitTimes(assert, result, [65, 221, 184, 100]);
        assert.strictEqual(result.cumTimes, null);
        assert.strictEqual(result.splitTimes, null);
        assert.deepEqual(result.getAllOriginalCumulativeTimes(), cumTimes);
    });

    QUnit.test("Can create a result from original cumulative times and set repaired times with NaNs replacing dubious splits", function (assert) {
        var cumTimes = [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var result = fromOriginalCumTimes(1, 10 * 3600, cumTimes);
        
        result.setRepairedCumulativeTimes([0, 65, 65 + 221, NaN, 65 + 221 + 184 + 100]);
        
        assert.strictEqual(result.getCumulativeTimeTo(0), 0);
        assert.strictEqual(result.getCumulativeTimeTo(1), 65);
        assert.strictEqual(result.getCumulativeTimeTo(2), 65 + 221);
        assert.ok(isNaN(result.getCumulativeTimeTo(3)));
        assert.strictEqual(result.getCumulativeTimeTo(4), 65 + 221 + 184 + 100);
        
        assert.strictEqual(result.getSplitTimeTo(0), 0);
        assert.strictEqual(result.getSplitTimeTo(1), 65);
        assert.strictEqual(result.getSplitTimeTo(2), 221);
        assert.ok(isNaN(result.getSplitTimeTo(3)));
        assert.ok(isNaN(result.getSplitTimeTo(4)));
    });

    QUnit.test("Result created from ascending cumulative times has no dubious cumulative nor split times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        for (var control = 0; control < 5; control += 1) {
            assert.ok(!result.isCumulativeTimeDubious(control));
            assert.ok(!result.isSplitTimeDubious(control));
        }
    });

    QUnit.test("Result created with dubious cumulative time has one dubious cumulative time and two dubious split times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 0, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        result.setRepairedCumulativeTimes([0, 65, NaN, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        for (var control = 0; control < 5; control += 1) {
            assert.strictEqual(result.isCumulativeTimeDubious(control), (control === 2));
            assert.strictEqual(result.isSplitTimeDubious(control), (control === 2 || control === 3));
        }
    });
    
    QUnit.test("Result with start time but all-null splits is not lacking a start time", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, null, null, null, null]);
        assert.ok(!result.lacksStartTime());
    });
        
    QUnit.test("Result with start time and splits is not lacking a start time", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assert.ok(!result.lacksStartTime());
    });
        
    QUnit.test("Result with no start time nor any splits is not lacking a start time", function (assert) {
        var result = fromCumTimes(1, null, [0, null, null, null, null]);
        assert.ok(!result.lacksStartTime());
    });
        
    QUnit.test("Result with no start time but all splits is lacking a start time", function (assert) {
        var result = fromCumTimes(1, null, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assert.ok(result.lacksStartTime());
    });
        
    QUnit.test("Result with no start time but some splits is lacking a start time", function (assert) {
        var result = fromCumTimes(1, null, [0, 65, null, null, 65 + 221 + 184 + 100]);
        assert.ok(result.lacksStartTime());
    });

    QUnit.test("Can determine total time of a result that punches all controls", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assert.strictEqual(result.totalTime, 65 + 221 + 184 + 100, "Wrong total time");
    });

    QUnit.test("Determines total time of a result that mispunches as null", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, null, 65 + 221 + 184 + 100]);
        assert.strictEqual(result.totalTime, null, "Total time should be null");
    });
    QUnit.test("Result with valid time compares equal to itself", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 154]);
        assert.strictEqual(compareResults(result, result), 0);
    });

    QUnit.test("Result with lower total time comes before result with higher total time", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 154]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, 188]);
        assert.strictEqual(signum(compareResults(result1, result2)), -1);
    });

    QUnit.test("Result with higher total time comes before result with higher total time", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 188]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, 154]);
        assert.ok(signum(compareResults(result1, result2)), 1);
    });

    QUnit.test("Result with lower order comes before result with same total time but higher order", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 188]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, 188]);
        assert.ok(signum(compareResults(result1, result2)) , -1);
    });

    QUnit.test("Result with higher order comes after result with same total time but lower order", function (assert) {
        var result1 = fromCumTimes(3, 10 * 3600, [0, 188]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, 188]);
        assert.ok(signum(compareResults(result1, result2)), 1);
    });

    QUnit.test("Mispunching result compares equal to itself", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, null]);
        assert.strictEqual(compareResults(result, result), 0);
    });
    
    QUnit.test("Result with valid time comes before mispunching result", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 154]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, null]);
        assert.ok(signum(compareResults(result1, result2)), -1);
    });

    QUnit.test("Mispunching result comes after result with valid time", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, null]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, 188]);
        assert.ok(signum(compareResults(result1, result2)), 1);
    });

    QUnit.test("Mispunching result with lower order comes before mispunching result with higher order", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, null]);
        var result2 = fromCumTimes(2, 12 * 3600, [0,null]);
        assert.ok(signum(compareResults(result1, result2)), -1);
    });

    QUnit.test("Mispunching result with higher order comes before mispunching result with lower order", function (assert) {
        var result1 = fromCumTimes(3, 10 * 3600, [0, null]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, null]);
        assert.ok(signum(compareResults(result1, result2)), 1);
    });

    QUnit.test("Disqualified result compares equal to itself", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 154]);
        result.disqualify();
        assert.strictEqual(compareResults(result, result), 0);
    });

    QUnit.test("Valid result comes before disqualified result", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 154]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, 188]);
        result2.disqualify();
        assert.ok(signum(compareResults(result1, result2)), -1);
    });

    QUnit.test("Disqualified result comes after valid result", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 154]);
        result1.disqualify();
        var result2 = fromCumTimes(2, 12 * 3600, [0, 188]);
        assert.ok(signum(compareResults(result1, result2)), 1);
    });

    QUnit.test("Disqualified result with lower order comes before disqualified result with higher order", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 154]);
        result1.disqualify();
        var result2 = fromCumTimes(2, 12 * 3600, [0, 188]);
        result2.disqualify();
        assert.ok(signum(compareResults(result1, result2)), -1);
    });

    QUnit.test("Disqualified result with higher order comes before disqualified result with lower order", function (assert) {
        var result1 = fromCumTimes(3, 10 * 3600, [0, 188]);
        result1.disqualify();
        var result2 = fromCumTimes(2, 12 * 3600, [0, 154]);
        result2.disqualify();
        assert.ok(signum(compareResults(result1, result2)), 1);
    });
        
    QUnit.test("Result with no times missing has times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assert.ok(result.hasAnyTimes(), "Result with no times missing should have times");
    });
    
    QUnit.test("Result with some but not all times missing has times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, null, null, 65 + 221 + 184 + 100]);
        assert.ok(result.hasAnyTimes(), "Result with some but not all times missing should have times");
    });
    
    QUnit.test("Result with all times missing does not have times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, null, null, null, null]);
        assert.ok(!result.hasAnyTimes(), "Result with all times missing should not have times");
    });

    QUnit.test("Can adjust a results's cumulative times by reference data with all valid times and same number of controls", function (assert) {

        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [0, 4, 4 + 28, 4 + 28 + 8, 4 + 28 + 8 - 3];
        assert.deepEqual(result.getCumTimesAdjustedToReference(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Can adjust a result's cumulative times with a missing time by reference data with all valid times and same number of controls", function (assert) {

        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, null, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [0, 4, 4 + 28, null, 4 + 28 + 8 - 3];
        assert.deepEqual(result.getCumTimesAdjustedToReference(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Cannot adjust a result's cumulative times by reference data with a different number of times", function (assert) {

        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, null, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            result.getCumTimesAdjustedToReference(referenceCumTimes);
        });
    });

    QUnit.test("Cannot adjust a result's cumulative times by reference data with a null value", function (assert) {

        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, null, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, null, 61 + 193 + 176 + 103];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            result.getCumTimesAdjustedToReference(referenceCumTimes);
        });
    });

    QUnit.test("Can adjust a result's cumulative times by reference data and add start time with all valid times and same number of controls", function (assert) {
        var startTime = 10 * 3600 + 41 * 60;
        var result = fromCumTimes(1, startTime, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [startTime, startTime + 4, startTime + 4 + 28, startTime + 4 + 28 + 8, startTime + 4 + 28 + 8 - 3];
        assert.deepEqual(result.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Can adjust a result's cumulative times with a missing time by reference data and add start time with all valid times and same number of controls", function (assert) {
        var startTime = 10 * 3600 + 41 * 60;
        var result = fromCumTimes(1, startTime, [0, 65, 65 + 221, null, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [startTime, startTime + 4, startTime + 4 + 28, null, startTime + 4 + 28 + 8 - 3];
        assert.deepEqual(result.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Cannot adjust a result's cumulative times by reference data and add start time with a different number of times", function (assert) {

        var result = fromCumTimes(1, 10 * 3600 + 41 * 60, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            result.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes);
        });
    });

    QUnit.test("Cannot adjust a result's cumulative times by reference data and add start time if reference data contains a null value", function (assert) {

        var result = fromCumTimes(1, 10 * 3600 + 41 * 60, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, null, 61 + 193 + 176 + 103];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            result.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes);
        });
    });

    QUnit.test("Can determine the percentages a result is behind reference data with all valid times and same number of controls", function (assert) {

        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, 100 * (184 - 176) / 176, 100 * (100 - 103) / 103];
        assert.deepEqual(result.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });

    QUnit.test("Can determine the percentages a result with a missing time is behind reference data with all valid times and same number of controls", function (assert) {

        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, null, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, null, null];
        assert.deepEqual(result.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });

    QUnit.test("Cannot determine the percentages a result is behind reference data with a different number of times", function (assert) {

        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            result.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes);
        });
    });

    QUnit.test("Cannot determine the percentages a result is behind reference data with a null value", function (assert) {

        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, null, 61 + 193 + 176 + 103];
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            result.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes);
        });
    });

    QUnit.test("Can determine the percentages a result is behind reference data, with a null percentage for a zero split", function (assert) {

        var result = fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, null, 100 * (100 - 176 - 103) / (103 + 176)];
        assert.deepEqual(result.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });
    
    QUnit.test("Can determine time losses of result with even number of splits", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 96, 96 + 221, 96 + 221 + 184, 96 + 221 + 184 + 100]);
        var fastestSplits = [65, 209, 184, 97];
        result.determineTimeLosses(fastestSplits);
        assert.strictEqual(result.getTimeLossAt(0), null);
        
        // Split ratios are 1.4769, 1.05742, 1, 1.03093
        // median is 1.04417
        // expected times are therefore 67.8711, 218.232, 192.1277, 101.2847
        // time losses are then  28.1288, 2.7680, -8.1277, -1.2847
        
        assert.strictEqual(result.getTimeLossAt(1), 28);
        assert.strictEqual(result.getTimeLossAt(2), 3);
        assert.strictEqual(result.getTimeLossAt(3), -8);
        assert.strictEqual(result.getTimeLossAt(4), -1);
    });
    
    QUnit.test("Can determine time losses of result with odd number of splits", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 96, 96 + 221, 96 + 221 + 100]);
        var fastestSplits = [65, 209, 97];
        result.determineTimeLosses(fastestSplits);
        assert.strictEqual(result.getTimeLossAt(0), null);
        
        // Split ratios are 1.4769, 1.05742, 1.03093
        // median is 1.05742
        // expected times are therefore 68.7321, 211, 192.1277, 102.5694
        // time losses are then 27.2679, 0, -2.5694
        
        assert.strictEqual(result.getTimeLossAt(1), 27);
        assert.strictEqual(result.getTimeLossAt(2), 0);
        assert.strictEqual(result.getTimeLossAt(3), -3);
    });
    
    QUnit.test("Cannot determine time losses of result when given wrong number of reference splits", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 96, 96 + 221, 96 + 221 + 184, 96 + 221 + 184 + 100]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            result.determineTimeLosses([65, 209, 97]);
        });
    });
    
    QUnit.test("Cannot determine time losses of result when given split times with NaN value", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 96, 96 + 221, 96 + 221 + 184, 96 + 221 + 184 + 100]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            result.determineTimeLosses([65, 209, NaN, 97]);
        });
    });
    
    QUnit.test("Can determine time losses as all NaN if result has NaN repaired split", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600, [0, 96, 96 + 221, 96 + 221 + 184, 96 + 221 + 184 + 100]);
        result.setRepairedCumulativeTimes([0, 96, 96 + 221, NaN, 96 + 221 + 184 + 100]);
        var fastestSplits = [65, 209, 184, 97];
        result.determineTimeLosses(fastestSplits);
        
        for (var control = 1; control < 5; control += 1) {
            var timeLoss = result.getTimeLossAt(control);
            assert.ok(isNaNStrict(timeLoss), "Time loss at control " + control + " should be NaN, but got " + timeLoss);
        }
    });
    
    QUnit.test("Can determine time losses as all NaN if fastest splits include zero", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 96, 96 + 221, 96 + 221 + 184, 96 + 221 + 184 + 100]);
        var fastestSplits = [65, 209, 0, 97];
        result.determineTimeLosses(fastestSplits);
        
        for (var control = 1; control < 5; control += 1) {
            var timeLoss = result.getTimeLossAt(control);
            assert.ok(isNaNStrict(timeLoss), "Time loss at control " + control + " should be NaN, but got " + timeLoss);
        }
    });
    
    QUnit.test("Can determine time losses as all NaN if result is marked as OK despite having missing controls", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 96, 96 + 221, null, 96 + 221 + 184 + 100]);
        result.setOKDespiteMissingTimes();
        var fastestSplits = [65, 209, 184, 97];
        result.determineTimeLosses(fastestSplits);
        
        for (var control = 1; control < 5; control += 1) {
            var timeLoss = result.getTimeLossAt(control);
            assert.ok(isNaNStrict(timeLoss), "Time loss at control " + control + " should be NaN, but got " + timeLoss);
        }
    });
    
    QUnit.test("Can determine as all-NaN time losses of result when given fastest-split times with null value", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600, [0, 96, 96 + 221, 96 + 221 + 184, 96 + 221 + 184 + 100]);
        result.setRepairedCumulativeTimes([0, 96, 96 + 221, NaN, 96 + 221 + 184 + 100]);
        result.determineTimeLosses([65, 209, null, 97]);
        
        for (var control = 1; control <= 4; control += 1) {
            var timeLoss = result.getTimeLossAt(control);
            assert.ok(isNaNStrict(timeLoss), "Time loss at control " + control + " should be NaN, but got " + timeLoss);
        }
    });
    
    QUnit.test("Can determine time losses as all null if result mispunches", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 96, 96 + 221, null, 96 + 221 + 184 + 100]);
        result.determineTimeLosses([65, 209, 184, 97]);
        for (var controlIdx = 0; controlIdx <= 4; controlIdx += 1) {
            assert.strictEqual(result.getTimeLossAt(controlIdx), null);
        }
    });
    
    QUnit.test("Can determine time losses as all null if result mispunches even if fastest times also have null in them", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 96, 96 + 221, null, 96 + 221 + 184 + 100]);
        result.determineTimeLosses([65, 209, null, 97]);
        for (var controlIdx = 0; controlIdx <= 4; controlIdx += 1) {
            assert.strictEqual(result.getTimeLossAt(controlIdx), null);
        }
    });
    
    QUnit.test("Cannot determine that a result crosses another one with a different number of controls", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 421]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, 71, 218, 379, 440, 491]);
        
        SplitsBrowserTest.assertInvalidData(assert, function () {
            result1.crosses(result2);
        });
    });
    
    QUnit.test("Can determine that a result does not cross themselves", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 421]);
        assert.ok(!result.crosses(result), "Result should not cross themselves");
    });
    
    QUnit.test("Can determine that a result does not cross a result with identical splits starting an hour later", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 421]);
        var result2 = fromCumTimes(2, 11 * 3600, [0, 65, 221, 384, 421]);
        assert.ok(!result1.crosses(result2), "Results should not cross");
    });
    
    QUnit.test("Can determine that a result does not cross a result with identical splits starting an hour earlier", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 421]);
        var result2 = fromCumTimes(2, 9 * 3600, [0, 65, 221, 384, 421]);
        assert.ok(!result1.crosses(result2), "Results should not cross");
    });
    
    QUnit.test("Can determine that two results cross on the way to control 1", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 421]);
        var result2 = fromCumTimes(2, 10 * 3600 - 60, [0, 265, 421, 584, 621]);
        assert.ok(result1.crosses(result2), "Results should cross");
    });
    
    QUnit.test("Can determine that two results cross between controls 2 and 3", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 421]);
        var result2 = fromCumTimes(2, 10 * 3600 - 60, [0, 65, 221, 584, 621]);
        assert.ok(result1.crosses(result2), "Results should cross");
    });
    
    QUnit.test("Can determine that two results cross between controls 1 and 2 and cross back later", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 721]);
        var result2 = fromCumTimes(2, 10 * 3600 - 60, [0, 65, 421, 584, 621]);
        assert.ok(result1.crosses(result2), "Results should cross");
    });
    
    QUnit.test("Can determine that two results do not cross between because the first one has a null split", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, null, 384, 521]);
        var result2 = fromCumTimes(2, 10 * 3600 - 60, [0, 65, 221, 384, 521]);
        assert.ok(!result1.crosses(result2), "Results should not cross");
    });
    
    QUnit.test("Can determine that two results do not cross between because the second one has a null split", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521]);
        var result2 = fromCumTimes(2, 10 * 3600 - 60, [0, 65, 221, null, 521]);
        assert.ok(!result1.crosses(result2), "Results should not cross");
    });
    
    QUnit.test("Returns null value for cumulative rank when no ranks set", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521]);
        assert.strictEqual(result.getCumulativeRankTo(2), null, "A null cumulative rank should be returned");
    });
    
    QUnit.test("Returns non-null value for cumulative rank when ranks set", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521]);
        result.setSplitAndCumulativeRanks([1, 1, 1, 1], [2, 2, 2, 2]);
        assert.strictEqual(result.getCumulativeRankTo(2), 2, "A non-null cumulative rank should be returned");
    });
    
    QUnit.test("Returns null value for cumulative rank at start control", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521]);
        result.setSplitAndCumulativeRanks([1, 1, 1, 1], [2, 2, 2, 2]);
        assert.strictEqual(result.getCumulativeRankTo(0), null, "A null cumulative rank should be returned for the start");
    });
    
    QUnit.test("Returns null value for split rank when no ranks set", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521]);
        assert.strictEqual(result.getSplitRankTo(2), null, "A null split rank should be returned");
    });
    
    QUnit.test("Returns non-null value for split rank when ranks set", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521]);
        result.setSplitAndCumulativeRanks([1, 1, 1, 1], [2, 2, 2, 2]);
        assert.strictEqual(result.getSplitRankTo(2), 1, "A non-null split rank should be returned");
    });
    
    QUnit.test("Returns null value for split rank at start control", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521]);
        result.setSplitAndCumulativeRanks([1, 1, 1, 1], [2, 2, 2, 2]);
        assert.strictEqual(result.getSplitRankTo(0), null, "A null split rank should be returned for the start");
    });
    
    QUnit.test("Result with no omitted times has no indexes around omitted cumulative times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521]);
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), []);
    });
    
    QUnit.test("Result with single dubious cumulative time not at the end has indexes around it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, NaN, 384, 521]);
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 1, end: 3}]);
    });
    
    QUnit.test("Result with single missing cumulative time not at the end has indexes around it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, null, 384, 521]);
        result.setOKDespiteMissingTimes();
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 1, end: 3}]);
    });
    
    QUnit.test("Result with consecutive pair of dubious cumulative times not at the end has indexes around it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, NaN, NaN, 521]);
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 1, end: 4}]);
    });    
    
    QUnit.test("Result with consecutive pair of missing cumulative times not at the end has indexes around it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, null, null, 521]);
        result.setOKDespiteMissingTimes();
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 1, end: 4}]);
    });    
    
    QUnit.test("Result with consecutive pair of dubious and omitted cumulative times not at the end has indexes around it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, NaN, null, 521]);
        result.setOKDespiteMissingTimes();
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 1, end: 4}]);
    });    
    
    QUnit.test("Result with consecutive pair of omitted and dubious cumulative times not at the end has indexes around it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, null, NaN, 521]);
        result.setOKDespiteMissingTimes();
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 1, end: 4}]);
    });    

    QUnit.test("Result with two non-consecutive omitted cumulative times not at the end has separate indexes around them", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, NaN, 221, null, 521]);
        result.setOKDespiteMissingTimes();
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 0, end: 2}, {start: 2, end: 4}]);
    });    
    
    QUnit.test("Result with dubious cumulative time at at the end has no index for it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, NaN]);
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), []);
    });    
    
    QUnit.test("Result with two non-consecutive dubious cumulative times, one at the end has only an index for the one not at the end", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, NaN, 221, 384, NaN]);
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 0, end: 2}]);
    });    
    
    QUnit.test("Result with single dubious cumulative time followed by a null has no indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, NaN, null, 521]);
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), []);
    });
    
    QUnit.test("Result with single dubious cumulative time preceded by a null has no indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, null, NaN, 384, 521]);
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), []);
    });

    QUnit.test("Result with single dubious cumulative time with a null time two controls before has a pair of indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, null, 221, NaN, 521]);
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 2, end: 4}]);
    });

    QUnit.test("Result with single dubious cumulative time with a null time two controls after has a pair of indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, NaN, 221, null, 521]);
        assert.deepEqual(result.getControlIndexesAroundOmittedCumulativeTimes(), [{start: 0, end: 2}]);
    });
        
    QUnit.test("Result with no dubious times has no indexes around dubious split times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), []);
    });
    
    QUnit.test("Result with single dubious cumulative time not at the end has indexes around the two split times it makes dubious", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, NaN, 384, 521, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), [{start: 1, end: 4}]);
    });
    
    QUnit.test("Result with single dubious cumulative time not at the end has indexes around the two split times it makes dubious", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, null, 384, 521, 588, 655]);
        result.setOKDespiteMissingTimes();
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), [{start: 1, end: 4}]);
    });
    
    QUnit.test("Result with consecutive pair of dubious cumulative times not at the end has indexes around it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, NaN, NaN, 521, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), [{start: 1, end: 5}]);
    });    
    
    QUnit.test("Result with two non dubious cumulative times with one non-dubious value between them has one pair of indexes around them", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, NaN, 221, NaN, 521, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), [{start: 0, end: 5}]);
    });    
    
    QUnit.test("Result with two non dubious cumulative times with two non-dubious values between them has two pair of indexes, one around each pair of dubious split times", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, NaN, 221, 384, NaN, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), [{start: 0, end: 3}, {start: 3, end: 6}]);
    });    
    
    QUnit.test("Result with dubious final cumulative time only has no indexes around it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521, 588, NaN]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), []);
    });
    
    QUnit.test("Result with dubious penultimate cumulative time only has no indexes around it", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 384, 521, NaN, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), []);
    });
    
    QUnit.test("Result with single dubious cumulative time not at the end with null immediately before the dubious split has no indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, null, NaN, 521, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), []);
    });
    
    QUnit.test("Result with single dubious cumulative time not at the end with null immediately after the dubious split has no indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, NaN, null, 521, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), []);
    });
    
    QUnit.test("Result with single dubious cumulative time not at the end with null two controls before the dubious split has no indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, null, 384, NaN, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), []);
    });
    
    QUnit.test("Result with single dubious cumulative time not at the end with null two controls after the dubious split has no indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, NaN, 384, null, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), []);
    });
    
    QUnit.test("Result with single dubious cumulative time not at the end with null three controls after the dubious split has a pair of indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, null, 221, 384, NaN, 588, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), [{start: 3, end: 6}]);
    });
    
    QUnit.test("Result with single dubious cumulative time not at the end with null three controls after the dubious split has a pair of indexes", function (assert) {
        var result = fromCumTimes(1, 10 * 3600, [0, 65, NaN, 384, 512, null, 655]);
        assert.deepEqual(result.getControlIndexesAroundOmittedSplitTimes(), [{start: 1, end: 4}]);
    });   

    var teamResult1 = createTeamResult(1, [
        fromCumTimes(1, 10 * 3600, [0, 65, 286, 470, 570]),
        fromCumTimes(1, 10 * 3600 + 570, [0, 61, 254, 430, 533])
    ]);

    var teamResultWithMissingTime = createTeamResult(1, [
        fromCumTimes(1, 10 * 3600, [0, 65, 286, 470, 570]),
        fromCumTimes(1, 10 * 3600 + 570, [0, 61, 254, null, 533])
    ]);
    
    var dubiousTeamResult = (function () {
        var cumTimes1 = [0, 65, 286, 470, 570];
        var result1 = fromOriginalCumTimes(1, 10 * 3600, cumTimes1);
        result1.setRepairedCumulativeTimes([0, 65, 286, NaN, 570]);
        
        var cumTimes2 = [0, 61, 254, 430, 533];
        var result2 = fromOriginalCumTimes(1, 10 * 3600, cumTimes2);
        result2.setRepairedCumulativeTimes([0, 61, NaN, 430 ,533]);
    
        return createTeamResult(1, [result1, result2]);
    })();
    
    QUnit.test("Cannot create an empty team", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            createTeamResult(1, []);
        });
    });
    
    QUnit.test("Cannot create an empty team", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            createTeamResult(1, []);
        });
    });
    
    QUnit.test("Cannot create a team with only one member", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            createTeamResult(1, [fromCumTimes(1, 10 * 3600, [0, 65, 286, 470, 570])]);
        });
    });

    QUnit.test("Can get cumulative times of a team", function (assert) {
        assert.deepEqual(teamResult1.getAllCumulativeTimes(), [0, 65, 286, 470, 570, 631, 824, 1000, 1103]); 
        assert.deepEqual(teamResult1.getAllOriginalCumulativeTimes(), teamResult1.getAllCumulativeTimes()); 
    });

    QUnit.test("Can get all split times of a team", function (assert) {
        assert.deepEqual(teamResult1.getAllSplitTimes(),  [65, 221, 184, 100, 61, 193, 176, 103]);
    });


    QUnit.test("Can get cumulative times of a team with missing times", function (assert) {
        assert.deepEqual(teamResultWithMissingTime.getAllCumulativeTimes(), [0, 65, 286, 470, 570, 631, 824, null, 1103]); 
    });

    QUnit.test("Can get cumulative times of a team with dubious times", function (assert) {
        assert.deepEqual(dubiousTeamResult.getAllCumulativeTimes(), [0, 65, 286, NaN, 570, 631, NaN, 1000, 1103]); 
    });

    QUnit.test("Can get split times of a team with dubious times", function (assert) {
        assert.deepEqual(dubiousTeamResult.getAllSplitTimes(), [65, 221, NaN, NaN, 61, NaN, NaN, 103]); 
    });

    QUnit.test("Can get original cumulative times of a team with dubious times", function (assert) {
        assert.deepEqual(dubiousTeamResult.getAllOriginalCumulativeTimes(), [0, 65, 286, 470, 570, 631, 824, 1000, 1103]); 
    });
    
    function createModifiedTeamResult(member1Action, member2Action) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, 286, 470, 570]);
        var result2 = fromCumTimes(1, 10 * 3600 + 570, [0, 61, 254, 430, 533]);
        if (member1Action) {
            member1Action(result1);
        }
        if (member2Action) {
            member2Action(result2);
        }
        return createTeamResult(1, [result1, result2]);
    }
    
    QUnit.test("Ordinary team is not disqualified, non-starter, over-max-time nor non-competitive", function (assert) {
        assert.ok(!teamResult1.isDisqualified);
        assert.ok(!teamResult1.isNonStarter);
        assert.ok(!teamResult1.isNonFinisher);
        assert.ok(!teamResult1.isOverMaxTime);
        assert.ok(!teamResult1.isNonCompetitive);
        assert.ok(teamResult1.completed());
    });
    
    QUnit.test("Disqualified team member causes the entire team to be disqualified", function (assert) {
        var teamResult = createModifiedTeamResult(function (result) { result.disqualify(); }, null);
        assert.ok(teamResult.isDisqualified);
        assert.ok(!teamResult.isNonStarter);
        assert.ok(!teamResult.isNonFinisher);
        assert.ok(!teamResult.isOverMaxTime);
        assert.ok(!teamResult.isNonCompetitive);
        assert.ok(!teamResult.completed());
    });
    
    QUnit.test("Entire team of non-starters is a non-starter", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, null, null, null, null]);
        var result2 = fromCumTimes(1, 10 * 3600 + 570, [0, null, null, null, null]);
        result1.setNonStarter();
        result2.setNonStarter();
        var teamResult = createTeamResult(1, [result1, result2]);
        
        assert.ok(!teamResult.isDisqualified);
        assert.ok(teamResult.isNonStarter);
        assert.ok(!teamResult.isNonFinisher);
        assert.ok(!teamResult.isOverMaxTime);
        assert.ok(!teamResult.isNonCompetitive);
        assert.ok(!teamResult.completed());        
    });
    
    QUnit.test("Team with only one non-starter is not a non-starter", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, null, null, null, null]);
        var result2 = fromCumTimes(1, 10 * 3600 + 570,  [0, 61, 254, 430, 533]);
        result2.setNonStarter();
        var teamResult = createTeamResult(1, [result1, result2]);
        
        assert.ok(!teamResult.isDisqualified);
        assert.ok(!teamResult.isNonStarter);
        assert.ok(!teamResult.isNonFinisher);
        assert.ok(!teamResult.isOverMaxTime);
        assert.ok(!teamResult.isNonCompetitive);
        assert.ok(!teamResult.completed());
    });
    
    QUnit.test("Team with two finishers and a non-finisher is a non-finishing team.", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600,        [0, 65, 286, 470, 570]);
        var result2 = fromCumTimes(1, 10 * 3600 + 570,  [0, 61, 254, 430, 533]);
        var result3 = fromCumTimes(1, 10 * 3600 + 1103, [0, 71, 278, null, null]);
        result3.setNonFinisher();
        var teamResult = createTeamResult(1, [result1, result2, result3]);
        
        assert.ok(!teamResult.isDisqualified);
        assert.ok(!teamResult.isNonStarter);
        assert.ok(teamResult.isNonFinisher);
        assert.ok(!teamResult.isOverMaxTime);
        assert.ok(!teamResult.isNonCompetitive);
        assert.ok(!teamResult.completed());
    });
    
    QUnit.test("Team with two finishers and a non-starter is a non-finishing team.", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600,        [0, 65, 286, 470, 570]);
        var result2 = fromCumTimes(1, 10 * 3600 + 570,  [0, 61, 254, 430, 533]);
        var result3 = fromCumTimes(1, 10 * 3600 + 1103, [0, null, null, null, null]);
        result3.setNonStarter();
        var teamResult = createTeamResult(1, [result1, result2, result3]);
        
        assert.ok(!teamResult.isDisqualified);
        assert.ok(!teamResult.isNonStarter);
        assert.ok(teamResult.isNonFinisher);
        assert.ok(!teamResult.isOverMaxTime);
        assert.ok(!teamResult.isNonCompetitive);
        assert.ok(!teamResult.completed());
    });
    
    QUnit.test("Team with a finisher, a non-finisher and a non-starter is a non-finishing team.", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600,        [0, 65, 286, 470, 570]);
        var result2 = fromCumTimes(1, 10 * 3600 + 570,  [0, 61, 254, null, null]);
        var result3 = fromCumTimes(1, 10 * 3600 + 1103, [0, null, null, null, null]);
        result2.setNonFinisher();
        result3.setNonStarter();
        var teamResult = createTeamResult(1, [result1, result2, result3]);
        
        assert.ok(!teamResult.isDisqualified);
        assert.ok(!teamResult.isNonStarter);
        assert.ok(teamResult.isNonFinisher);
        assert.ok(!teamResult.isOverMaxTime);
        assert.ok(!teamResult.isNonCompetitive);
        assert.ok(!teamResult.completed());
    });
    
    QUnit.test("Team with a finisher and two non-starters is a non-finishing team.", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600,        [0, 65, 286, 470, 570]);
        var result2 = fromCumTimes(1, 10 * 3600 + 570,  [0, null, null, null, null]);
        var result3 = fromCumTimes(1, 10 * 3600 + 1103, [0, null, null, null, null]);
        result2.setNonStarter();
        result3.setNonStarter();
        var teamResult = createTeamResult(1, [result1, result2, result3]);
        
        assert.ok(!teamResult.isDisqualified);
        assert.ok(!teamResult.isNonStarter);
        assert.ok(teamResult.isNonFinisher);
        assert.ok(!teamResult.isOverMaxTime);
        assert.ok(!teamResult.isNonCompetitive);
        assert.ok(!teamResult.completed());
    });
    
    QUnit.test("Team with a non-finisher and two non-starters is a non-finishing team.", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600,        [0, 65, 286, null, null]);
        var result2 = fromCumTimes(1, 10 * 3600 + 570,  [0, null, null, null, null]);
        var result3 = fromCumTimes(1, 10 * 3600 + 1103, [0, null, null, null, null]);
        result1.setNonFinisher();
        result2.setNonStarter();
        result3.setNonStarter();
        var teamResult = createTeamResult(1, [result1, result2, result3]);
        
        assert.ok(!teamResult.isDisqualified);
        assert.ok(!teamResult.isNonStarter);
        assert.ok(teamResult.isNonFinisher);
        assert.ok(!teamResult.isOverMaxTime);
        assert.ok(!teamResult.isNonCompetitive);
        assert.ok(!teamResult.completed());
    });
    
    QUnit.test("Team with an over-max-time member is over max time", function (assert) {
        var teamResult = createModifiedTeamResult(null, function (result) { result.setOverMaxTime(); });
        assert.ok(!teamResult.isDisqualified);
        assert.ok(!teamResult.isNonStarter);
        assert.ok(!teamResult.isNonFinisher);
        assert.ok(teamResult.isOverMaxTime);
        assert.ok(!teamResult.isNonCompetitive);
        assert.ok(!teamResult.completed());
    });
    
    QUnit.test("Team with a non-competitive team member is non-competitive", function (assert) {
        var teamResult = createModifiedTeamResult(function (result) { result.setNonCompetitive(); }, null);
        assert.ok(!teamResult.isDisqualified);
        assert.ok(!teamResult.isNonStarter);
        assert.ok(!teamResult.isNonFinisher);
        assert.ok(!teamResult.isOverMaxTime);
        assert.ok(teamResult.isNonCompetitive);
        assert.ok(teamResult.completed());
    });
})();
