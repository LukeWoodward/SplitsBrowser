/*
 *  SplitsBrowser - data-repair tests.
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

    QUnit.module("Data Repair");

    var BOTH_BOOLS = [false, true];

    var repairEventData = SplitsBrowser.DataRepair.repairEventData;
    var transferResultData = SplitsBrowser.DataRepair.transferResultData;
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    function wrapInEvent(results) {
        var courseClass = new CourseClass("Test class", results[0].originalCumTimes.length - 2, results);
        var course = new Course("Test course", [courseClass], null, null, null);
        var eventData = new Event([courseClass], [course]);
        return eventData;
    }

    /**
    * Wraps the given array of results in a course-class, course and event,
    * repair the event and return whether the course-class has dubious data.
    * @param {Array} results Array of Result objects.
    * @param {Boolean} permitZeroSplits Whether to permit zero-second splits.
    * @return {Boolean} True if the course-class has dubious data, false
    *     otherwise.
    */
    function wrapInEventAndRepair(results, permitZeroSplits) {
        var eventData = wrapInEvent(results);
        repairEventData(eventData, permitZeroSplits);
        return eventData.classes[0].hasDubiousData;
    }

    function wrapInEventAndTransfer(results) {
        transferResultData(wrapInEvent(results));
    }

    QUnit.test("Can repair result with ascending cumulative times leaving them in ascending order", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(!hasDubiousData);
            assert.deepEqual(result.cumTimes, result.originalCumTimes);
        });
    });

    QUnit.test("Can repair result with ascending or equal cumulative times removing a zero-second split if not permitted", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
        var hasDubiousData = wrapInEventAndRepair([result], false);
        assert.ok(hasDubiousData);
        assert.deepEqual(result.cumTimes, [0, 81, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    });

    QUnit.test("Can repair result with ascending or equal cumulative times leaving them in ascending order if zero-second splits are permitted", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
        var hasDubiousData = wrapInEventAndRepair([result], true);
        assert.ok(!hasDubiousData);
        assert.deepEqual(result.cumTimes, result.originalCumTimes);
    });

    QUnit.test("Can repair result with multiple missed splits by doing nothing", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, null, null, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(!hasDubiousData);
            assert.deepEqual(result.cumTimes, result.originalCumTimes);
        });
    });

    QUnit.test("Can repair result with finish time equal to last control by doing nothing", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(!hasDubiousData);
            SplitsBrowserTest.assertStrictEqualArrays(assert, result.cumTimes, result.originalCumTimes);
        });
    });

    QUnit.test("Can repair result with absurdly high cumulative time by removing the offending time", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(hasDubiousData);
            assert.deepEqual(result.cumTimes, [0, 81, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        });
    });

    QUnit.test("Can repair result with multiple absurdly high cumulative times by removing the offending times", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(hasDubiousData);
            assert.deepEqual(result.cumTimes, [0, 81, NaN, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        });
    });

    QUnit.test("Can repair result with absurdly high cumulative time followed by nulls by removing the offending time", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 99999, null, null, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(hasDubiousData);
            assert.deepEqual(result.cumTimes, [0, 81, NaN, null, null, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        });
    });

    QUnit.test("Can repair result with absurdly low cumulative time by removing the offending time", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(hasDubiousData);
            assert.deepEqual(result.cumTimes, [0, 81, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        });
    });

    QUnit.test("Can repair result with multiple absurdly low cumulative times by removing the offending times", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197, 1, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(hasDubiousData);
            assert.deepEqual(result.cumTimes, [0, 81, NaN, 81 + 197, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        });
    });

    QUnit.test("Can repair result with absurdly low cumulative time preceded by nulls by removing the offending time", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, null, null, 1, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(hasDubiousData);
            assert.deepEqual(result.cumTimes, [0, 81, null, null, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        });
    });

    QUnit.test("Removes ridiculously low finish time of result if result mispunched but punches the last control and the finish", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, null, 81 + 197 + 212, 1], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(hasDubiousData);
            assert.deepEqual(result.cumTimes, [0, 81, null, 81 + 197 + 212, NaN]);
        });
    });

    QUnit.test("Makes no changes to a result that has failed to punch the finish but all other cumulative times are in order", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, null], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(!hasDubiousData);
            assert.deepEqual(result.cumTimes, result.originalCumTimes);
        });
    });

    QUnit.test("Makes no changes to the start time if the first cumulative time is negative", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, -381, -224, -150, -74, null], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(!hasDubiousData);
            assert.deepEqual(result.cumTimes, result.originalCumTimes);
        });
    });

    QUnit.test("Does not remove ridiculously low finish time from mispunching result if they did not punch the last control", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, null, 81 + 197 + 212, null, 1], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(!hasDubiousData);
            assert.deepEqual(result.cumTimes, result.originalCumTimes);
        });
    });

    QUnit.test("Can repair result with two consecutive absurdly high cumulative times by removing them", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 5000, 6000, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(hasDubiousData);
            assert.deepEqual(result.cumTimes, [0, NaN, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        });
    });

    QUnit.test("Does not repair result with two absurdly high cumulative times separated only by a missing split", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 5000, null, 6000, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(!hasDubiousData);
            assert.deepEqual(result.cumTimes, result.originalCumTimes);
        });
    });

    QUnit.test("Can repair result with zero cumulative times separated by two runs of nulls", function (assert) {
        BOTH_BOOLS.forEach(function (permitZeroSplits) {
            var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, null, null, null, 0, null, 0, 842, 1647], {});
            var hasDubiousData = wrapInEventAndRepair([result], permitZeroSplits);
            assert.ok(!hasDubiousData);
            assert.deepEqual(result.cumTimes, [0, null, null, null, 0, null, 0, 842, 1647]);
        });
    });

    QUnit.test("Can transfer result with ascending cumulative times leaving them in ascending order", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
        wrapInEventAndTransfer([result]);
        assert.deepEqual(result.cumTimes, result.originalCumTimes);
    });

    QUnit.test("Can transfer result data with absurdly high cumulative time by leaving it as it is", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 99999, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
        wrapInEventAndTransfer([result]);
        assert.deepEqual(result.cumTimes, result.originalCumTimes);
    });

    QUnit.test("Can transfer result data with absurdly low cumulative time by leaving it as it is", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 1, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
        wrapInEventAndTransfer([result]);
        assert.deepEqual(result.cumTimes, result.originalCumTimes);
    });

    QUnit.test("Can transfer result data with ridiculously low finish time by leaving it as it is", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, null, 81 + 197 + 212, 1], {});
        wrapInEventAndTransfer([result]);
        assert.deepEqual(result.cumTimes, result.originalCumTimes);
    });

    QUnit.test("Can transfer result data with two consecutive absurdly high cumulative times by leaving them as they are", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 5000, 6000, 81 + 197 + 212, 81 + 197 + 212 + 106], {});
        wrapInEventAndTransfer([result]);
        assert.deepEqual(result.cumTimes, result.originalCumTimes);
    });

})();