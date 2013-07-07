"use strict";

var SplitInfo = SplitsBrowser.Model.CompetitorSplitInfo;

module("getRanks");

QUnit.test("getRanks returns empty array for ranks of empty array", function(assert) {
    assert.deepEqual(getRanks([]), [], "Ranks of an empty array should be empty");
});

QUnit.test("getRanks returns ordered array for array that is already sorted", function(assert) {
    assert.deepEqual(getRanks([14, 19, 55]), [1, 2, 3], "Ranks of a sorted array should be sorted");
});

QUnit.test("getRanks returns unordered array for array that correspondingly unordered", function(assert) {
    assert.deepEqual(getRanks([55, 14, 19]), [3, 1, 2], "Ranks of an unsorted array should be similarly unsorted");
});

QUnit.test("getRanks returns null rank for null value", function(assert) {
    assert.deepEqual(getRanks([55, null, 19]), [2, null, 1], "Null values should have null ranks");
});

QUnit.test("getRanks returns all null ranks for all null values", function(assert) {
    assert.deepEqual(getRanks([null, null, null]), [null, null, null], "An all-null array should have all-null ranks");
});

QUnit.test("getRanks returns equal rank for two values the same", function(assert) {
    assert.deepEqual(getRanks([55, 14, 55]), [2, 1, 2], "Equal values should have equal ranks");
});

QUnit.test("getRanks skips a rank after two equal values", function(assert) {
    assert.deepEqual(getRanks([55, 14, 14]), [3, 1, 1], "Rank 2 should be skipped as there are two values of rank 1");
});

module("selectByIndexes");

QUnit.test("Selecting by an empty array of indexes returns an empty array", function(assert) {
    assert.deepEqual(selectByIndexes(["one", "two", "three"], []), []);
});

QUnit.test("Selecting by a non-empty array of indexes returns the corresponding values", function(assert) {
    assert.deepEqual(selectByIndexes(["one", "two", "three"], [2, 1, 2, 0]), ["three", "two", "three", "one"]);
});



function getTestCourseData() {
    var competitor1 = new CompetitorData(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
    var competitor2 = new CompetitorData(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
    var competitor3 = new CompetitorData(3, "Bill", "Palmer", "GHI", "11:00", [74, 249, 184, 106]);
    return new CourseData("Test", 3, [competitor1, competitor2, competitor3]);
}

module("Competitor Split Info - split times");

QUnit.test("Gets null array of splits for control zero", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.equal(splitInfo.getSplits(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of splits for empty list of competitors", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getSplits(2, []), []);
});

QUnit.test("Gets nonempty array of splits for full list of competitors in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getSplits(2, [0, 1, 2]), [197, 221, 249]);
});

QUnit.test("Gets nonempty array of splits for full list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getSplits(2, [2, 0, 1]), [249, 197, 221]);
});

QUnit.test("Gets nonempty array of splits for partial list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getSplits(2, [2, 1]), [249, 221]);
});

module("Competitor Split Info - split-time ranks");

QUnit.test("Gets null array of split-time ranks for control zero", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.equal(splitInfo.getSplitRanks(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of split-time ranks for empty list of competitors", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getSplitRanks(2, []), []);
});

QUnit.test("Gets nonempty array of split-time ranks for full list of competitors in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getSplitRanks(2, [0, 1, 2]), [1, 2, 3]);
});

QUnit.test("Gets nonempty array of split-time ranks for full list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getSplitRanks(2, [2, 0, 1]), [3, 1, 2]);
});

QUnit.test("Gets nonempty array of split-time ranks for partial list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getSplitRanks(2, [2, 1]), [3, 2]);
});

module("Competitor Split Info - cumulative times");

QUnit.test("Gets null array of cumulative times for control zero", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.equal(splitInfo.getCumulativeTimes(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of cumulative times for empty list of competitors", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getCumulativeTimes(2, []), []);
});

QUnit.test("Gets nonempty array of cumulative times for full list of competitors in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getCumulativeTimes(2, [0, 1, 2]), [81 + 197, 65 + 221, 74 + 249]);
});

QUnit.test("Gets nonempty array of cumulative times for full list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getCumulativeTimes(2, [2, 0, 1]), [74 + 249, 81 + 197, 65 + 221]);
});

QUnit.test("Gets nonempty array of cumulative times for partial list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getCumulativeTimes(2, [2, 1]), [74 + 249, 65 + 221]);
});

module("Competitor Split Info - cumulative-time ranks");

QUnit.test("Gets null array of cumulative-time ranks for control zero", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.equal(splitInfo.getCumulativeRanks(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of cumulative-time ranks for empty list of competitors", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getCumulativeRanks(2, []), []);
});

QUnit.test("Gets nonempty array of cumulative-time ranks for full list of competitors in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getCumulativeRanks(2, [0, 1, 2]), [1, 2, 3]);
});

QUnit.test("Gets nonempty array of cumulative-time ranks for full list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getCumulativeRanks(2, [2, 0, 1]), [3, 1, 2]);
});

QUnit.test("Gets nonempty array of cumulative-time ranks for partial list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getCumulativeRanks(2, [2, 1]), [3, 2]);
});

module("Competitor Split Info - times behind fastest");

QUnit.test("Gets null array of times behind fastest for control zero", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.equal(splitInfo.getTimesBehindFastest(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of times behind fastest for empty list of competitors", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getTimesBehindFastest(2, []), []);
});

QUnit.test("Gets nonempty array of times behind fastest for full list of competitors in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getTimesBehindFastest(2, [0, 1, 2]), [197 - 197, 221 - 197, 249 - 197]);
});

QUnit.test("Gets nonempty array of times behind fastest for full list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getTimesBehindFastest(2, [2, 0, 1]), [249 - 197, 197 - 197, 221 - 197]);
});

QUnit.test("Gets nonempty array of times behind fastest for partial list of competitors not in order", function(assert) {
    var splitInfo = new SplitInfo(getTestCourseData());
    assert.deepEqual(splitInfo.getTimesBehindFastest(2, [2, 1]), [249 - 197, 221 - 197]);
});