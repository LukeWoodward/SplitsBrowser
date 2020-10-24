/*
 *  SplitsBrowser - ChartTypes tests.
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

    const fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;
    const fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    const CourseClass = SplitsBrowser.Model.CourseClass;
    const CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    const ChartTypes = SplitsBrowser.Model.ChartTypes;

    const fromSplitTimes = SplitsBrowserTest.fromSplitTimes;

    QUnit.module("Chart types");

    const ALL_CHART_TYPES = [];
    for (let [_name, type] of ChartTypes.entries()) {
        ALL_CHART_TYPES.push(type);
    }

    QUnit.test("Splits graph selector returns result data adjusted to reference, in units of minutes", function (assert) {
        let chartType = ChartTypes.get("SplitsGraph");
        let result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 409, 578], {});
        let referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes), [0, (65 - 58) / 60, (221 - 224) / 60, (409 - 381) / 60, (578 - 552) / 60]);
    });

    QUnit.test("Splits graph selector returns result data with a missed control adjusted to reference, in units of minutes", function (assert) {
        let chartType = ChartTypes.get("SplitsGraph");
        let result = fromCumTimes(1, 10 * 3600, [0, 65, 221, null, 578], {});
        let referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes), [0, (65 - 58) / 60, (221 - 224) / 60, null, (578 - 552) / 60]);
    });

    QUnit.test("Race graph selector returns result data adjusted to reference with start time added, in units of minutes", function (assert) {
        let chartType = ChartTypes.get("RaceGraph");
        let result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 409, 578], {});
        let referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes), [10 * 60, 10 * 60 + (65 - 58) / 60, 10 * 60 + (221 - 224) / 60, 10 * 60 + (409 - 381) / 60, 10 * 60 + (578 - 552) / 60]);
    });

    QUnit.test("Race graph selector returns result data with a missed control adjusted to reference with start time added, in units of minutes", function (assert) {
        let chartType = ChartTypes.get("RaceGraph");
        let result = fromCumTimes(1, 10 * 3600, [0, 65, null, 409, 578], {});
        let referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes), [10 * 60, 10 * 60 + (65 - 58) / 60, null, 10 * 60 + (409 - 381) / 60, 10 * 60 + (578 - 552) / 60]);
    });

    QUnit.test("Position after leg returns cumulative ranks", function (assert) {
        let chartType = ChartTypes.get("PositionAfterLeg");
        let result1 = fromCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 278, 490, 596], {});
        let result2 = fromCumTimes(2, 10 * 3600, [0, 65, 286, 495, 595], {});
        new CourseClassSet([new CourseClass("Test", 3, [result1, result2])]);

        assert.deepEqual(chartType.dataSelector(result1), [null, 2, 1, 1, 2]);
        assert.deepEqual(chartType.dataSelector(result2), [null, 1, 2, 2, 1]);
    });

    QUnit.test("Split position returns split ranks", function (assert) {
        let chartType = ChartTypes.get("SplitPosition");
        let result1 = fromSplitTimes(1, "Second Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        let result2 = fromSplitTimes(2, "First Runner", "ABC", 10 * 3600, [65, 221, 209, 100]);
        new CourseClassSet([new CourseClass("Test", 3, [result1, result2])]);

        assert.deepEqual(chartType.dataSelector(result1), [null, 2, 1, 2, 2]);
        assert.deepEqual(chartType.dataSelector(result2), [null, 1, 2, 1, 1]);
    });

    QUnit.test("Percent behind returns percents behind the reference time.", function (assert) {
        let chartType = ChartTypes.get("PercentBehind");
        let result = fromSplitTimes(1, "Second Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        let referenceCumTimes = [0, 58, 224, 381, 552]; // Splits are 58, 166, 157, 171.

        let expectedData = [0, 100 * (81 - 58) / 58, 100 * (197 - 166) / 166, 100 * (212 - 157) / 157, 100 * (106 - 171) / 171];

        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes), expectedData);
    });

    QUnit.test("All chart types have a name key", function (assert) {
        for (let chartType of ALL_CHART_TYPES) {
            assert.strictEqual(typeof chartType.nameKey, "string");
        }
    });

    QUnit.test("All chart types except the results table have a y-axis label key", function (assert) {
        for (let chartType of ALL_CHART_TYPES) {
            if (chartType !== ChartTypes.get("ResultsTable")) {
                assert.strictEqual(typeof chartType.yAxisLabelKey, "string");
            }
        }
    });

    QUnit.test("Only the Race Graph shows the Crossing Runners button", function (assert) {
        for (let chartType of ALL_CHART_TYPES) {
            assert.strictEqual(chartType.isRaceGraph, chartType === ChartTypes.get("RaceGraph"));
        }
    });

    QUnit.test("Only the Results Table is the Results Table", function (assert) {
        for (let chartType of ALL_CHART_TYPES) {
            assert.strictEqual(chartType.isResultsTable, chartType === ChartTypes.get("ResultsTable"));
        }
    });

    QUnit.test("All chart types have a minimum viewable control", function (assert) {
        for (let chartType of ALL_CHART_TYPES) {
            assert.strictEqual(typeof chartType.minViewableControl, "number");
        }
    });

    QUnit.test("Race graph's min viewable control is the start, for all others it's control 1", function (assert) {
        for (let chartType of ALL_CHART_TYPES) {
            assert.strictEqual(chartType.minViewableControl, (chartType === ChartTypes.get("RaceGraph")) ? 0 : 1);
        }
    });

    QUnit.test("All chart types except the results table have the correct dubious-indexes function", function (assert) {
        let result = fromOriginalCumTimes(1, 10 * 3600, [0, 96, 96, 96 + 221 + 184, 96 + 221 + 184 + 100], {});
        result.setRepairedCumulativeTimes([0, 96, NaN, 96 + 221 + 184, 96 + 221 + 184 + 100]);

        for (let chartType of ALL_CHART_TYPES) {
            if (chartType !== ChartTypes.get("ResultsTable")) {
                assert.strictEqual(typeof chartType.indexesAroundOmittedTimesFunc, "function");
                let expectedDubiousTimeInfo;
                if (chartType === ChartTypes.get("SplitsGraph") || chartType === ChartTypes.get("RaceGraph") || chartType === ChartTypes.get("PositionAfterLeg")) {
                    expectedDubiousTimeInfo = [{start: 1, end: 3}];
                } else if (chartType === ChartTypes.get("SplitPosition") || chartType === ChartTypes.get("PercentBehind")) {
                    expectedDubiousTimeInfo = [{start: 1, end: 4}];
                } else {
                    assert.ok(false, `Unrecognised chart type: '${chartType.nameKey}'`);
                    expectedDubiousTimeInfo = null;
                }

                assert.deepEqual(chartType.indexesAroundOmittedTimesFunc(result), expectedDubiousTimeInfo, `Dubious-time info for ${chartType.nameKey} should be correct`);
            }
        }

        assert.strictEqual(ChartTypes.get("ResultsTable").indexesAroundOmittedTimesFunc, null);
    });
})();