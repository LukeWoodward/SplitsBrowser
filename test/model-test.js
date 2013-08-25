/* jslint -W097 */  // Disable grumbling about use strict not inside a function.
/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */
"use strict";

var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
var CompetitorData = SplitsBrowser.Model.CompetitorData;
var CourseData = SplitsBrowser.Model.CourseData;

module("compareCompetitors");

function signum(n) {
    return (n < 0) ? -1 : ((n > 0) ? 1 : 0);
}

QUnit.test("Competitor with valid time compares equal to itself", function (assert) {
    var competitor = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [154]);
    assert.equal(compareCompetitors(competitor, competitor), 0);
});

QUnit.test("Competitor with lower total time comes before competitor with higher total time", function (assert) {
    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [154]);
    var competitor2 = new CompetitorData(2, "Fred", "Baker", "DEF", "12:00", [188]);
    assert.equal(signum(compareCompetitors(competitor1, competitor2)), -1);
});

QUnit.test("Competitor with higher total time comes before competitor with higher total time", function (assert) {
    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [188]);
    var competitor2 = new CompetitorData(2, "Fred", "Baker", "DEF", "12:00", [154]);
    assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
});

QUnit.test("Competitor with lower order comes before competitor with same total time but higher order", function (assert) {
    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [188]);
    var competitor2 = new CompetitorData(2, "Fred", "Baker", "DEF", "12:00", [188]);
    assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
});

QUnit.test("Competitor with higher order comes after competitor with same total time but lower order", function (assert) {
    var competitor1 = new CompetitorData(3, "John", "Smith", "ABC", "10:00", [188]);
    var competitor2 = new CompetitorData(2, "Fred", "Baker", "DEF", "12:00", [188]);
    assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
});

QUnit.test("Competitor with valid time comes before mispunching competitor", function (assert) {
    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [154]);
    var competitor2 = new CompetitorData(2, "Fred", "Baker", "DEF", "12:00", [null]);
    assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
});

QUnit.test("Mispunching competitor compares equal to itself", function (assert) {
    var competitor = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [null]);
    assert.equal(compareCompetitors(competitor, competitor), 0);
});

QUnit.test("Mispunching competitor comes after competitor with valid time", function (assert) {
    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [null]);
    var competitor2 = new CompetitorData(2, "Fred", "Baker", "DEF", "12:00", [188]);
    assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
});

QUnit.test("Mispunching competitor with lower order comes before mispunching competitor with higher order", function (assert) {
    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [null]);
    var competitor2 = new CompetitorData(2, "Fred", "Baker", "DEF", "12:00", [null]);
    assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
});

QUnit.test("Mispunching competitor with higher order comes before mispunching competitor with lower order", function (assert) {
    var competitor1 = new CompetitorData(3, "John", "Smith", "ABC", "10:00", [null]);
    var competitor2 = new CompetitorData(2, "Fred", "Baker", "DEF", "12:00", [null]);
    assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
});

module("CompetitorData");

QUnit.test("Can determine total time of a competitor that punches all controls", function (assert) {

    var competitor = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    assert.equal(competitor.totalTime, 65 + 221 + 184 + 100, "Wrong total time");
});

QUnit.test("Determines total time of a competitor that mispunches as null", function (assert) {

    var competitor = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, null, 100]);
    assert.strictEqual(competitor.totalTime, null, "Total time should be null");
});

QUnit.test("Cannot adjust a CompetitorData object by something that isn't a CompetitorData", function (assert) {

    var competitor = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    try {
        competitor.adjustToReference("this is not a valid reference");
        assert.ok(false, "This should not be reached");
    } catch (e) {
        assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
    }
});

QUnit.test("Cannot adjust a CompetitorData object by a CompetitorData with a different number of controls", function (assert) {

    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var competitor2 = new CompetitorData(2, "Fred", "Brown", "DEF", "10:30", [77, 200, 159, 66, 149]);
    try {
        competitor1.adjustToReference(competitor2);
        assert.ok(false, "This should not be reached");
    } catch (e) {
        assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
    }
});

QUnit.test("Cannot adjust a CompetitorData object by a CompetitorData with a missing split time", function (assert) {

    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var competitor2 = new CompetitorData(2, "Fred", "Brown", "DEF", "10:30", [81, null, 212, 106]);
    try {
        competitor1.adjustToReference(competitor2);
        assert.ok(false, "This should not be reached");
    } catch (e) {
        assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
    }
});

QUnit.test("Can adjust a CompetitorData object by a CompetitorData with all valid times and same number of controls", function (assert) {

    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var competitor2 = new CompetitorData(2, "Fred", "Brown", "DEF", "10:30", [61, 193, 176, 103]);
    var expectedCompetitor = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [4, 28, 8, -3]);
    assert.deepEqual(competitor1.adjustToReference(competitor2), expectedCompetitor);
});

QUnit.test("Can adjust a CompetitorData object with a missing time by a CompetitorData with all valid times and same number of controls", function (assert) {

    var competitor1 = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, null, 100]);
    var competitor2 = new CompetitorData(2, "Fred", "Brown", "DEF", "10:30", [61, 193, 176, 103]);
    var expectedCompetitor = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [4, 28, null, -3]);
    assert.deepEqual(competitor1.adjustToReference(competitor2), expectedCompetitor);
});

QUnit.test("Can determine cumulative times of a competitor that has punched all controls", function (assert) {
    var competitor = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var expectedCumulativeTimes = [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
    assert.deepEqual(competitor.getCumulativeTimes(), expectedCumulativeTimes);
});

QUnit.test("Can determine cumulative times of a competitor that has missed a controls", function (assert) {
    var competitor = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221,  null, 184, 100]);
    var expectedCumulativeTimes = [0, 65, 65 + 221, null, 65 + 221 + 184, 65 + 221 + 184 + 100];
    assert.deepEqual(competitor.getCumulativeTimes(), expectedCumulativeTimes);
});

QUnit.test("Can determine cumulative times of a competitor that has missed multiple consecutive controls", function (assert) {
    var competitor = new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, null, null, null, null, 184, 100]);
    var expectedCumulativeTimes = [0, 65, 65 + 221, null, null, null, null, 65 + 221 + 184, 65 + 221 + 184 + 100];
    assert.deepEqual(competitor.getCumulativeTimes(), expectedCumulativeTimes);
});


module("CourseData");

QUnit.test("CourseData object with no competitors is empty", function (assert) {
    var courseData = new CourseData("Test", 3, []);
    assert.ok(courseData.isEmpty());
});

QUnit.test("CourseData object with one competitor is not empty", function (assert) {
    var courseData = new CourseData("Test", 3, [new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100])]);
    assert.ok(!courseData.isEmpty());
});

QUnit.test("Winner of empty course is null", function (assert) {
    var courseData = new CourseData("Test", 3, []);
    assert.strictEqual(courseData.getWinner(), null, "There should be no winner if there are no competitors");
});

QUnit.test("Winner of course with only mispunchers is null", function (assert) {
    var courseData = new CourseData("Test", 3, [
        new CompetitorData(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, null]),
        new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, null, 212, 106])
    ]);
    assert.strictEqual(courseData.getWinner(), null, "There should be no winner if there are no competitors that completed the course");
});

QUnit.test("Winner of course is competitor with quickest time", function (assert) {
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);
    assert.equal(courseData.getWinner(), competitor2, "John Smith should be the winner");
});

QUnit.test("Fastest time on course with no competitors is null", function (assert) {
    var courseData = new CourseData("Test", 3, []);
    assert.strictEqual(courseData.getFastestTime(), null, "Empty course should have null fastest time");
});

QUnit.test("Fastest time on course with one control mispunched by everyone is null", function (assert) {
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, null, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, null, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);
    assert.strictEqual(courseData.getFastestTime(), null, "Course with one control mispunched by all should have null fastest time");
});

QUnit.test("Fastest time on course should be made up of fastest times", function (assert) {
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);

    // Don't do a full deep-equal on the other parts.
    assert.deepEqual(courseData.getFastestTime().times, [65, 197, 184, 100], "Fastest time should be made up of fastest splits");
});

QUnit.test("Fastest time on course should be made up of fastest times ignoring nulls.", function (assert) {
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, null, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, null]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);

    // Don't do a full deep-equal on the other parts.
    assert.deepEqual(courseData.getFastestTime().times, [65, 221, 184, 106], "Fastest time should be made up of fastest splits where present");
});

QUnit.test("Cannot return chart data when no data", function (assert) {
    var courseData = new CourseData("Test", 3, []);
    try {
        courseData.getChartData(new CompetitorData("Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]));
        assert.ok(false, "Should not get here");
    } catch (e) {
        assert.equal(e.name, "InvalidData", "Exception should have name InvalidData: exception message is " + e.message);
    }
});

QUnit.test("Cannot return chart data when no reference data given", function (assert) {
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);
    try {
        courseData.getChartData();
        assert.ok(false, "Should not get here");
    } catch (e) {
        assert.equal(e.name, "TypeError", "Exception should have name TypeError: exception message is " + e.message);
    }
});

QUnit.test("Can get competitor name", function (assert) {
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);
    assert.equal(courseData.getCompetitorName(1), "John Smith", "Wrong competitor name");
});

// TODO: more tests: with 0 only, 1 only and maybe none as well?

QUnit.test("Can return data for two competitors", function (assert) {
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);
    var fastestTime = courseData.getFastestTime();

    var chartData = courseData.getChartData(fastestTime, [0, 1]);

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
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);
    var fastestTime = courseData.getFastestTime();

    var chartData = courseData.getChartData(fastestTime, [0]);

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
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);
    var fastestTime = courseData.getFastestTime();

    var chartData = courseData.getChartData(fastestTime, [1]);

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
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var courseData = new CourseData("Test", 3, [competitor1, competitor2]);
    var fastestTime = courseData.getFastestTime();

    var chartData = courseData.getChartData(fastestTime, []);

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
