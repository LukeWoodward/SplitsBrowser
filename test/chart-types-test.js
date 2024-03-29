/*
 *  SplitsBrowser - ChartTypes tests.
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

    var hasProperty = SplitsBrowser.hasProperty;
    var fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    var ChartTypes = SplitsBrowser.Model.ChartTypes;

    var fromSplitTimes = SplitsBrowserTest.fromSplitTimes;

    QUnit.module("Chart types");

    var ALL_CHART_TYPES = [];
    for (var type in ChartTypes) {
        if (hasProperty(ChartTypes, type)) {
            ALL_CHART_TYPES.push(ChartTypes[type]);
        }
    }

    QUnit.test("Splits graph selector returns result data adjusted to reference, in units of minutes", function (assert) {
        var chartType = ChartTypes.SplitsGraph;
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 409, 578], {});
        var referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes), [0, (65 - 58) / 60, (221 - 224) / 60, (409 - 381) / 60, (578 - 552) / 60]);
    });

    QUnit.test("Splits graph selector returns result data with a missed control adjusted to reference, in units of minutes", function (assert) {
        var chartType = ChartTypes.SplitsGraph;
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, null, 578], {});
        var referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes), [0, (65 - 58) / 60, (221 - 224) / 60, null, (578 - 552) / 60]);
    });

    QUnit.test("Race graph selector returns result data adjusted to reference with start time added, in units of minutes", function (assert) {
        var chartType = ChartTypes.RaceGraph;
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 409, 578], {});
        var referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes, null), [10 * 60, 10 * 60 + (65 - 58) / 60, 10 * 60 + (221 - 224) / 60, 10 * 60 + (409 - 381) / 60, 10 * 60 + (578 - 552) / 60]);
    });

    QUnit.test("Race graph selector returns result data with a missed control adjusted to reference with start time added, in units of minutes", function (assert) {
        var chartType = ChartTypes.RaceGraph;
        var result = fromCumTimes(1, 10 * 3600, [0, 65, null, 409, 578], {});
        var referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes, null), [10 * 60, 10 * 60 + (65 - 58) / 60, null, 10 * 60 + (409 - 381) / 60, 10 * 60 + (578 - 552) / 60]);
    });

    QUnit.test("Race graph selector returns result data adjusted to reference with leg-index start time added, in units of minutes", function (assert) {
        var chartType = ChartTypes.RaceGraph;
        var result = fromCumTimes(1, 10 * 3600, [0, 65, 221, 409, 578], {});
        result.setOffsets([0, 2]);
        var referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes, 1), [10 * 60 + (224 / 60), 10 * 60 + (65 - 58 + 224) / 60, 10 * 60 + (221 - 224 + 224) / 60, 10 * 60 + (409 - 381 + 224) / 60, 10 * 60 + (578 - 552 + 224) / 60]);
    });

    QUnit.test("Position after leg returns cumulative ranks", function (assert) {
        var chartType = ChartTypes.PositionAfterLeg;
        var result1 = fromCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 278, 490, 596], {});
        var result2 = fromCumTimes(2, 10 * 3600, [0, 65, 286, 495, 595], {});
        new CourseClassSet([new CourseClass("Test", 3, [result1, result2])]);

        assert.deepEqual(chartType.dataSelector(result1), [null, 2, 1, 1, 2]);
        assert.deepEqual(chartType.dataSelector(result2), [null, 1, 2, 2, 1]);
    });

    QUnit.test("Split position returns split ranks", function (assert) {
        var chartType = ChartTypes.SplitPosition;
        var result1 = fromSplitTimes(1, "Second Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var result2 = fromSplitTimes(2, "First Runner", "ABC", 10 * 3600, [65, 221, 209, 100]);
        new CourseClassSet([new CourseClass("Test", 3, [result1, result2])]);

        assert.deepEqual(chartType.dataSelector(result1), [null, 2, 1, 2, 2]);
        assert.deepEqual(chartType.dataSelector(result2), [null, 1, 2, 1, 1]);
    });

    QUnit.test("Percent behind returns percents behind the reference time.", function (assert) {
        var chartType = ChartTypes.PercentBehind;
        var result = fromSplitTimes(1, "Second Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var referenceCumTimes = [0, 58, 224, 381, 552]; // Splits are 58, 166, 157, 171.

        var expectedData = [0, 100 * (81 - 58) / 58, 100 * (197 - 166) / 166, 100 * (212 - 157) / 157, 100 * (106 - 171) / 171];

        assert.deepEqual(chartType.dataSelector(result, referenceCumTimes), expectedData);
    });

    QUnit.test("All chart types have a name key", function (assert) {
        ALL_CHART_TYPES.forEach(function (chartType) {
            assert.strictEqual(typeof chartType.nameKey, "string");
        });
    });

    QUnit.test("All chart types except the results table have a y-axis label key", function (assert) {
        ALL_CHART_TYPES.forEach(function (chartType) {
            if (chartType !== ChartTypes.ResultsTable) {
                assert.strictEqual(typeof chartType.yAxisLabelKey, "string");
            }
        });
    });

    QUnit.test("Only the Race Graph shows the Crossing Runners button", function (assert) {
        ALL_CHART_TYPES.forEach(function (chartType) {
            assert.strictEqual(chartType.isRaceGraph, chartType === ChartTypes.RaceGraph);
        });
    });

    QUnit.test("Only the Results Table is the Results Table", function (assert) {
        ALL_CHART_TYPES.forEach(function (chartType) {
            assert.strictEqual(chartType.isResultsTable, chartType === ChartTypes.ResultsTable);
        });
    });

    QUnit.test("All chart types have a minimum viewable control", function (assert) {
        ALL_CHART_TYPES.forEach(function (chartType) {
            assert.strictEqual(typeof chartType.minViewableControl, "number");
        });
    });

    QUnit.test("Race graph's min viewable control is the start, for all others it's control 1", function (assert) {
        ALL_CHART_TYPES.forEach(function (chartType) {
            assert.strictEqual(chartType.minViewableControl, (chartType === ChartTypes.RaceGraph) ? 0 : 1);
        });
    });

    QUnit.test("All chart types except the results table have the correct dubious-indexes function for a dubious control after the first", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600, [0, 96, 96, 96 + 221 + 184, 96 + 221 + 184 + 100], {});
        result.setRepairedCumulativeTimes([0, 96, NaN, 96 + 221 + 184, 96 + 221 + 184 + 100]);

        ALL_CHART_TYPES.forEach(function (chartType) {
            if (chartType !== ChartTypes.ResultsTable) {
                assert.strictEqual(typeof chartType.indexesAroundOmittedTimesFunc, "function");
                var expectedDubiousTimeInfo;
                if (chartType === ChartTypes.SplitsGraph || chartType === ChartTypes.RaceGraph || chartType === ChartTypes.PositionAfterLeg) {
                    expectedDubiousTimeInfo = [{start: 1, end: 3}];
                } else if (chartType === ChartTypes.SplitPosition || chartType === ChartTypes.PercentBehind) {
                    expectedDubiousTimeInfo = [{start: 1, end: 4}];
                } else {
                    assert.ok(false, "Unrecognised chart type: '" + chartType.nameKey + "'");
                    expectedDubiousTimeInfo = null;
                }

                assert.deepEqual(chartType.indexesAroundOmittedTimesFunc(result), expectedDubiousTimeInfo, "Dubious-time info for " + chartType.nameKey + " should be correct");
            }
        });

        assert.strictEqual(ChartTypes.ResultsTable.indexesAroundOmittedTimesFunc, null);
    });

    QUnit.test("All chart types except the results table have the correct dubious-indexes function for a dubious first control", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600, [0, 96, 96, 96 + 221 + 184, 96 + 221 + 184 + 100], {});
        result.setRepairedCumulativeTimes([0, NaN, 96 + 221, 96 + 221 + 184, 96 + 221 + 184 + 100]);

        ALL_CHART_TYPES.forEach(function (chartType) {
            if (chartType !== ChartTypes.ResultsTable) {
                assert.strictEqual(typeof chartType.indexesAroundOmittedTimesFunc, "function");
                var expectedDubiousTimeInfo;
                if (chartType === ChartTypes.SplitsGraph || chartType === ChartTypes.RaceGraph) {
                    expectedDubiousTimeInfo = [{start: 0, end: 2}];
                } else if (chartType === ChartTypes.PercentBehind) {
                    expectedDubiousTimeInfo = [{start: 0, end: 3}];
                } else if (chartType === ChartTypes.PositionAfterLeg || chartType === ChartTypes.SplitPosition) {
                    expectedDubiousTimeInfo = [];
                } else {
                    assert.ok(false, "Unrecognised chart type: '" + chartType.nameKey + "'");
                    expectedDubiousTimeInfo = null;
                }

                assert.deepEqual(chartType.indexesAroundOmittedTimesFunc(result), expectedDubiousTimeInfo, "Dubious-time info for " + chartType.nameKey + " should be correct");
            }
        });

        assert.strictEqual(ChartTypes.ResultsTable.indexesAroundOmittedTimesFunc, null);
    });

})();