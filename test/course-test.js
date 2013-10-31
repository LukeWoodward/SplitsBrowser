/* global QUnit, module, expect */
/* global SplitsBrowser */

(function (){
    "use strict";

    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var fromCumTimes = SplitsBrowser.Model.Competitor.fromCumTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;

    var _DUMMY_CHART_TYPE = {
        name: "dummy",
        dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReference(referenceCumTimes); },
        skipStart: false
    };
    
    module("Class");

    QUnit.test("Class object with no competitors is empty", function (assert) {
        var ageClass = new AgeClass("Test", 3, []);
        assert.ok(ageClass.isEmpty());
    });

    QUnit.test("Class object with one competitor is not empty", function (assert) {
        var ageClass = new AgeClass("Test", 3, [fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100])]);
        assert.ok(!ageClass.isEmpty());
    });

    QUnit.test("Cumulative times of the winner of an empty class is null", function (assert) {
        var ageClass = new AgeClass("Test", 3, []);
        assert.strictEqual(ageClass.getWinnerCumTimes(), null, "There should be no winner if there are no competitors");
    });

    QUnit.test("Cumulative times of the winner of a class with only mispunchers is null", function (assert) {
        var ageClass = new AgeClass("Test", 3, [
            fromSplitTimes(1, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, null]),
            fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, null, 212, 106])
        ]);
        assert.strictEqual(ageClass.getWinnerCumTimes(), null, "There should be no winner if there are no competitors that completed the course");
    });

    QUnit.test("Cumulative times of the winner are those with quickest time", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        var winTimes = ageClass.getWinnerCumTimes();
        assert.deepEqual(winTimes, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100], "John Smith should be the winner");
    });

    QUnit.test("Fastest cumulative times on class with no competitors is null", function (assert) {
        var ageClass = new AgeClass("Test", 3, []);
        assert.strictEqual(ageClass.getFastestCumTimes(), null, "Empty class should have null fastest time");
    });

    QUnit.test("Fastest cumulative times on class with one control mispunched by everyone is null", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        assert.strictEqual(ageClass.getFastestCumTimes(), null, "Class with one control mispunched by all should have null fastest time");
    });

    QUnit.test("Fastest cumulative times on class should be made up of fastest times", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);

        assert.deepEqual(ageClass.getFastestCumTimes(), [0, 65, 65 + 197, 65 + 197 + 184, 65 + 197 + 184 + 100], "Fastest cumulative time should be made up of fastest splits");
    });

    QUnit.test("Fastest cumulative times plus 75% on class should be made up of fastest times with 75%", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);

        assert.deepEqual(ageClass.getFastestCumTimesPlusPercentage(75), [0, 65 * 1.75, (65 + 197) * 1.75, (65 + 197 + 184) * 1.75, (65 + 197 + 184 + 100) * 1.75],
                                "Fastest cumulative times + 75% should be made up of fastest cumulative splits with 75% added");
    });

    QUnit.test("Fastest cumulative times on class should be made up of fastest split times ignoring nulls", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, null, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, null]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);

        assert.deepEqual(ageClass.getFastestCumTimes(), [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 106],
                            "Fastest cumulative times should be made up of fastest splits where not null");
    });

    QUnit.test("Cannot return chart data when no data", function (assert) {
        var ageClass = new AgeClass("Test", 3, []);
        try {
            ageClass.getChartData([0, 87, 87 + 147, 87 + 147 + 92], [0, 2], _DUMMY_CHART_TYPE);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    });

    QUnit.test("Cannot return chart data when no reference data given", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        try {
            ageClass.getChartData();
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "TypeError", "Exception should have name TypeError: exception message is " + e.message);
        }
    });

    QUnit.test("Cannot return chart data when no current indexes given", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        try {
            ageClass.getChartData([0, 65, 65 + 197, 65 + 197 + 184, 65 + 197 + 184 + 100], _DUMMY_CHART_TYPE);
            assert.ok(false, "Should not get here");
        } catch (e) {
            assert.equal(e.name, "TypeError", "Exception should have name TypeError: exception message is " + e.message);
        }
    });

    QUnit.test("Can get competitor name", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        assert.equal(ageClass.getCompetitorName(1), "John Smith", "Wrong competitor name");
    });

    QUnit.test("Can return data for two competitors", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        var fastestTime = ageClass.getFastestCumTimes();

        var chartData = ageClass.getChartData(fastestTime, [0, 1], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0, 0] },
                { x: 65, ys: [16, 0] },
                { x: 65 + 197, ys: [16, 24] },
                { x: 65 + 197 + 184, ys: [44, 24] },
                { x: 65 + 197 + 184 + 100, ys: [50, 24] }
            ],
            xExtent: [0, 65 + 197 + 184 + 100],
            yExtent: [0, 50],
            numControls: 3,
            competitorNames: ["Fred Brown", "John Smith"]
        };

        assert.deepEqual(chartData, expectedChartData);
    });


    QUnit.test("Can return data for first competitor only as columns", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        var fastestTime = ageClass.getFastestCumTimes();

        var chartData = ageClass.getChartData(fastestTime, [0], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0] },
                { x: 65, ys: [16] },
                { x: 65 + 197, ys: [16] },
                { x: 65 + 197 + 184, ys: [44] },
                { x: 65 + 197 + 184 + 100, ys: [50] }
            ],
            xExtent: [0, 65 + 197 + 184 + 100],
            yExtent: [0, 50],
            numControls: 3,
            competitorNames: ["Fred Brown"]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    QUnit.test("Can return data for second competitor only", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        var fastestTime = ageClass.getFastestCumTimes();

        var chartData = ageClass.getChartData(fastestTime, [1], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0] },
                { x: 65, ys: [0] },
                { x: 65 + 197, ys: [24] },
                { x: 65 + 197 + 184, ys: [24] },
                { x: 65 + 197 + 184 + 100, ys: [24] }
            ],
            xExtent: [0, 65 + 197 + 184 + 100],
            yExtent: [0, 24],
            numControls: 3,
            competitorNames: ["John Smith"]
        };

        assert.deepEqual(chartData, expectedChartData);
    });


    QUnit.test("Can return data for empty list of competitors", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        var fastestTime = ageClass.getFastestCumTimes();

        var chartData = ageClass.getChartData(fastestTime, [], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [],
            xExtent: [0, 65 + 197 + 184 + 100],
            yExtent: chartData.yExtent, // Deliberately set this equal, we'll test it later.
            numControls: 3,
            competitorNames: []
        };

        assert.deepEqual(chartData, expectedChartData);

        assert.ok(chartData.yExtent[0] < chartData.yExtent[1], "The y-axis should have a positive extent: got values " + chartData.yExtent[0] + " and " + chartData.yExtent[1]);
    });
    
    function assertSplitRanks(assert, competitor, expectedSplitRanks) {
        expectedSplitRanks.forEach(function (splitRank, index) {
            assert.equal(competitor.getSplitRankTo(index + 1), splitRank);
        });
    }
    
    function assertCumulativeRanks(assert, competitor, expectedCumulativeRanks) {
        expectedCumulativeRanks.forEach(function (cumulativeRank, index) {
            assert.equal(competitor.getCumulativeRankTo(index + 1), cumulativeRank);
        });
    }
    
    QUnit.test("Can compute ranks of single competitor as all 1s", function (assert) {
        var competitor = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var ageClass = new AgeClass("Test", 3, [competitor]);
        assertSplitRanks(assert, competitor, [1, 1, 1, 1]);
        assertCumulativeRanks(assert, competitor, [1, 1, 1, 1]);
    });
    
    QUnit.test("Can compute ranks when there are two competitors with no equal times", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        
        assertSplitRanks(assert, competitor1, [2, 1, 2, 2]);
        assertCumulativeRanks(assert, competitor1, [2, 1, 1, 2]);
        assertSplitRanks(assert, competitor2, [1, 2, 1, 1]);
        assertCumulativeRanks(assert, competitor2, [1, 2, 2, 1]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors with no equal times", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, 209, 199, 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        assertSplitRanks(assert, competitor1, [3, 1, 3, 2]);
        assertCumulativeRanks(assert, competitor1, [3, 1, 2, 2]);
        assertSplitRanks(assert, competitor2, [1, 3, 2, 1]);
        assertCumulativeRanks(assert, competitor2, [1, 2, 3, 1]);
        assertSplitRanks(assert, competitor3, [2, 2, 1, 3]);
        assertCumulativeRanks(assert, competitor3, [2, 3, 1, 3]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors with one pair of equal split times", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 197, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, 209, 199, 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        assertSplitRanks(assert, competitor1, [3, 1, 3, 2]);
        assertCumulativeRanks(assert, competitor1, [3, 2, 3, 2]);
        assertSplitRanks(assert, competitor2, [1, 1, 2, 1]);
        assertCumulativeRanks(assert, competitor2, [1, 1, 1, 1]);
        assertSplitRanks(assert, competitor3, [2, 3, 1, 3]);
        assertCumulativeRanks(assert, competitor3, [2, 3, 2, 3]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors with one pair of equal cumulative times", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, 209, 199, 109]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        assertSplitRanks(assert, competitor1, [3, 1, 3, 2]);
        assertCumulativeRanks(assert, competitor1, [3, 1, 2, 3]);
        assertSplitRanks(assert, competitor2, [1, 3, 2, 1]);
        assertCumulativeRanks(assert, competitor2, [1, 2, 3, 1]);
        assertSplitRanks(assert, competitor3, [2, 2, 1, 3]);
        assertCumulativeRanks(assert, competitor3, [2, 3, 1, 1]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors with one missing split times", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, null, 199, 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        assertSplitRanks(assert, competitor1, [3, 1, 3, 2]);
        assertCumulativeRanks(assert, competitor1, [3, 1, 1, 2]);
        assertSplitRanks(assert, competitor2, [1, 2, 2, 1]);
        assertCumulativeRanks(assert, competitor2, [1, 2, 2, 1]);
        assertSplitRanks(assert, competitor3, [2, null, 1, 3]);
        assertCumulativeRanks(assert, competitor3, [2, null, null, null]);
    });
    
    QUnit.test("Can compute ranks when there is one control that all three competitors mispunch", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, null]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, null]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, 209, 199, null]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        assertSplitRanks(assert, competitor1, [3, 1, 3, null]);
        assertCumulativeRanks(assert, competitor1, [3, 1, 2, null]);
        assertSplitRanks(assert, competitor2, [1, 3, 2, null]);
        assertCumulativeRanks(assert, competitor2, [1, 2, 3, null]);
        assertSplitRanks(assert, competitor3, [2, 2, 1, null]);
        assertCumulativeRanks(assert, competitor3, [2, 3, 1, null]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors specified by cumulative times with one missing split times", function (assert) {
        var competitor1 = fromCumTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var competitor2 = fromCumTimes(2, "John", "Smith", "ABC", 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 209, 65 + 221 + 209 + 100]);
        var competitor3 = fromCumTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [0, 78, null,     78 + 209 + 199, 78 + 209 + 199 + 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        assertSplitRanks(assert, competitor1, [3, 1, 2, 2]);
        assertCumulativeRanks(assert, competitor1, [3, 1, 1, 2]);
        assertSplitRanks(assert, competitor2, [1, 2, 1, 1]);
        assertCumulativeRanks(assert, competitor2, [1, 2, 2, 1]);
        assertSplitRanks(assert, competitor3, [2, null, null, 3]);
        
        // No cumulative ranks from control 2 onwards: as competitor 3
        // mispunches they no don't have a cumulative rank from that point
        // onwards.
        assertCumulativeRanks(assert, competitor3, [2, null, null, null]);
    });
    
    QUnit.test("Can get fastest two splits to control 3 from class with three competitors", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, 209, 199, 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        var fastestSplits = ageClass.getFastestSplitsTo(2, 3);
        assert.deepEqual(fastestSplits, [[199, "Bill Baker"], [209, "John Smith"]]);
    });
    
    QUnit.test("Can get fastest two splits to finish from class with three competitors", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, 209, 199, 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        var fastestSplits = ageClass.getFastestSplitsTo(2, 4);
        assert.deepEqual(fastestSplits, [[100, "John Smith"], [106, "Fred Brown"]]);
    });
    
    QUnit.test("When getting fastest four splits to control 3 from class with three competitors then three splits returned", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, 209, 199, 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        var fastestSplits = ageClass.getFastestSplitsTo(4, 3);
        assert.deepEqual(fastestSplits, [[199, "Bill Baker"], [209, "John Smith"], [212, "Fred Brown"]]);
    });
    
    QUnit.test("When getting fastest two splits to control 3 from class with three competitors with one mispunching control 3 then splits for other two competitors returned", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, 209, 199, 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        var fastestSplits = ageClass.getFastestSplitsTo(2, 3);
        assert.deepEqual(fastestSplits, [[199, "Bill Baker"], [209, "John Smith"]]);
    });
    
    QUnit.test("When getting fastest two splits to control 3 from class with three competitors with one mispunching a different control then splits for other two competitors returned", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, null, 199, 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        var fastestSplits = ageClass.getFastestSplitsTo(2, 3);
        assert.deepEqual(fastestSplits, [[209, "John Smith"], [212, "Fred Brown"]]);
    });
    
    QUnit.test("When getting fastest two splits to control 3 from class with three competitors with two mispunching control 3 then one split returned", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
        var competitor3 = fromSplitTimes(2, "Bill", "Baker", "GHI", 11 * 3600, [78, 209, null, 117]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2, competitor3]);
        
        var fastestSplits = ageClass.getFastestSplitsTo(2, 3);
        assert.deepEqual(fastestSplits, [[209, "John Smith"]]);
    });

    /**
    * Asserts that attempting to get the fastest splits of the given competitors
    * will fail with an InvalidData exception.
    * @param {QUnit.assert} assert - QUnit assertion object.
    * @param {Array} competitors - Array of competitor objects.
    * @param {Number} numSplits - The number of fastest splits to attempt to return.
    * @param {Number} controlIdx - The index of the control.
    */
    function assertCannotGetFastestSplits(assert, competitors, numSplits, controlIdx) {
        var ageClass = new AgeClass("Test", 3, competitors);
        try {
            ageClass.getFastestSplitsTo(numSplits, controlIdx);
            assert.ok(false, "An InvalidData exception should have been thrown but was not");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
        }
    }
    
    QUnit.test("Cannot return fastest 0 splits to a control", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
        assertCannotGetFastestSplits(assert, [competitor1], 0, 3);
    });
    
    QUnit.test("Cannot return fastest splits to a control when the number of such splits is not numeric", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
        assertCannotGetFastestSplits(assert, [competitor1], "this is not a number", 3);
    });
    
    QUnit.test("Cannot return fastest splits to control zero", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
        assertCannotGetFastestSplits(assert, [competitor1], 1, 0);
    });
    
    QUnit.test("Cannot return fastest splits to control out of range", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
        assertCannotGetFastestSplits(assert, [competitor1], 1, 5);
    });
    
    QUnit.test("Cannot return fastest splits to control that is not a number", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
        assertCannotGetFastestSplits(assert, [competitor1], 1, "this is not a number");
    });
})();
