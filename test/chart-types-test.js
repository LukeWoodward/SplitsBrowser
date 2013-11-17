(function () {
    "use strict";
    
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var fromCumTimes = SplitsBrowser.Model.Competitor.fromCumTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var AgeClassSet = SplitsBrowser.Model.AgeClassSet;
    var ChartTypes = SplitsBrowser.Model.ChartTypes;
    
    module("Chart types");

    var ALL_CHART_TYPES = [];
    for (var type in ChartTypes) {
        if (ChartTypes.hasOwnProperty(type)) {
            ALL_CHART_TYPES.push(ChartTypes[type]);
        }
    }
    
    QUnit.test("Splits graph selector returns competitor data adjusted to reference, in units of minutes", function (assert) {
        var chartType = ChartTypes.SplitsGraph;
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, [0, 65, 221, 409, 578]);
        var referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(competitor, referenceCumTimes), [0, (65 - 58) / 60, (221 - 224) / 60, (409 - 381) / 60, (578 - 552) / 60]);
    });

    QUnit.test("Splits graph selector returns competitor data with a missed control adjusted to reference, in units of minutes", function (assert) {
        var chartType = ChartTypes.SplitsGraph;
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, [0, 65, 221, null, 578]);
        var referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(competitor, referenceCumTimes), [0, (65 - 58) / 60, (221 - 224) / 60, null, (578 - 552) / 60]);
    });

    QUnit.test("Race graph selector returns competitor data adjusted to reference with start time added, in units of minutes", function (assert) {
        var chartType = ChartTypes.RaceGraph;
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, [0, 65, 221, 409, 578]);
        var referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(competitor, referenceCumTimes), [10 * 60, 10 * 60 + (65 - 58) / 60, 10 * 60 + (221 - 224) / 60, 10 * 60 + (409 - 381) / 60, 10 * 60 + (578 - 552) / 60]);
    });

    QUnit.test("Race graph selector returns competitor data with a missed control adjusted to reference with start time added, in units of minutes", function (assert) {
        var chartType = ChartTypes.RaceGraph;
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", 10 * 3600, [0, 65, null, 409, 578]);
        var referenceCumTimes = [0, 58, 224, 381, 552];
        assert.deepEqual(chartType.dataSelector(competitor, referenceCumTimes), [10 * 60, 10 * 60 + (65 - 58) / 60, null, 10 * 60 + (409 - 381) / 60, 10 * 60 + (578 - 552) / 60]);
    });
    
    QUnit.test("Position after leg returns cumulative ranks", function (assert) {
        var chartType = ChartTypes.PositionAfterLeg;
        var competitor1 = fromCumTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 278, 490, 596]);
        var competitor2 = fromCumTimes(2, "John", "Smith", "ABC", 10 * 3600, [0, 65, 286, 495, 595]);
        new AgeClassSet([new AgeClass("Test", 3, [competitor1, competitor2])]);

        assert.deepEqual(chartType.dataSelector(competitor1), [2, 1, 1, 2]);
        assert.deepEqual(chartType.dataSelector(competitor2), [1, 2, 2, 1]);
    });
    
    QUnit.test("Split position returns split ranks", function (assert) {
        var chartType = ChartTypes.SplitPosition;
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        new AgeClassSet([new AgeClass("Test", 3, [competitor1, competitor2])]);
        
        assert.deepEqual(chartType.dataSelector(competitor1), [2, 1, 2, 2]);
        assert.deepEqual(chartType.dataSelector(competitor2), [1, 2, 1, 1]);
    });
    
    QUnit.test("Percent behind returns percents behind the reference time.", function (assert) {
        var chartType = ChartTypes.PercentBehind;
        var competitor = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var referenceCumTimes = [0, 58, 224, 381, 552]; // Splits are 58, 166, 157, 171.
        
        var expectedData = [0, 100 * (81 - 58) / 58, 100 * (197 - 166) / 166, 100 * (212 - 157) / 157, 100 * (106 - 171) / 171];
        
        assert.deepEqual(chartType.dataSelector(competitor, referenceCumTimes), expectedData);
    });

    QUnit.test("All chart types have a name", function (assert) {
        ALL_CHART_TYPES.forEach(function (chartType) {
            assert.strictEqual(typeof chartType.name, "string");
        });
    });
    
    QUnit.test("Only the position-after-leg and split-position chart types skip the start", function (assert) {
        ALL_CHART_TYPES.forEach(function (chartType) {
            if (chartType !== ChartTypes.ResultsTable) {
                assert.strictEqual(chartType.skipStart, chartType === ChartTypes.PositionAfterLeg || chartType === ChartTypes.SplitPosition);
            }
        });
    });
   
    QUnit.test("All chart types except the results table have a y-axis label", function (assert) {
        ALL_CHART_TYPES.forEach(function (chartType) {
            if (chartType !== ChartTypes.ResultsTable) {
                assert.strictEqual(typeof chartType.yAxisLabel, "string");
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
    
})();