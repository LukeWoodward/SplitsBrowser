/* jslint -W097 */  // Disable grumbling about use strict not inside a function.
/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

"use strict";

var SplitInfo = SplitsBrowser.Model.CompetitorSplitInfo;
var CompetitorData = SplitsBrowser.Model.CompetitorData;
var CourseData = SplitsBrowser.Model.CourseData;
var getRanks = SplitsBrowser.getRanks;
var selectByIndexes = SplitsBrowser.selectByIndexes;

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

function getTestSplitInfo() {
    var courseData = getTestCourseData();
    return new SplitInfo(courseData, courseData.getFastestTime());
}

module("Competitor Split Info - split times");

QUnit.test("Gets null array of splits for control zero", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.equal(splitInfo.getSplits(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of splits for empty list of competitors", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplits(2, []), []);
});

QUnit.test("Gets nonempty array of splits for full list of competitors in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplits(2, [0, 1, 2]), [197, 221, 249]);
});

QUnit.test("Gets nonempty array of splits for full list of competitors not in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplits(2, [2, 0, 1]), [249, 197, 221]);
});

QUnit.test("Gets nonempty array of splits for partial list of competitors not in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplits(2, [2, 1]), [249, 221]);
});

QUnit.test("Gets array of splits for last control", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplits(4, [0, 1, 2]), [106, 100, 106]);
});

module("Competitor Split Info - split-time ranks");

QUnit.test("Gets null array of split-time ranks for control zero", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.equal(splitInfo.getSplitRanks(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of split-time ranks for empty list of competitors", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplitRanks(2, []), []);
});

QUnit.test("Gets nonempty array of split-time ranks for full list of competitors in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplitRanks(2, [0, 1, 2]), [1, 2, 3]);
});

QUnit.test("Gets nonempty array of split-time ranks for full list of competitors not in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplitRanks(2, [2, 0, 1]), [3, 1, 2]);
});

QUnit.test("Gets nonempty array of split-time ranks for partial list of competitors not in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplitRanks(2, [2, 1]), [3, 2]);
});

QUnit.test("Gets array of split-time ranks for last control", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getSplitRanks(4, [0, 1, 2]), [2, 1, 2]);
});

module("Competitor Split Info - cumulative times");

QUnit.test("Gets null array of cumulative times for control zero", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.equal(splitInfo.getCumulativeTimes(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of cumulative times for empty list of competitors", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeTimes(2, []), []);
});

QUnit.test("Gets nonempty array of cumulative times for full list of competitors in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeTimes(2, [0, 1, 2]), [81 + 197, 65 + 221, 74 + 249]);
});

QUnit.test("Gets nonempty array of cumulative times for full list of competitors not in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeTimes(2, [2, 0, 1]), [74 + 249, 81 + 197, 65 + 221]);
});

QUnit.test("Gets nonempty array of cumulative times for partial list of competitors not in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeTimes(2, [2, 1]), [74 + 249, 65 + 221]);
});

QUnit.test("Gets array of cumulative times for last control", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeTimes(4, [0, 1, 2]), [81 + 197 + 212 + 106, 65 + 221 + 184 + 100, 74 + 249 + 184 + 106]);
});

module("Competitor Split Info - cumulative-time ranks");

QUnit.test("Gets null array of cumulative-time ranks for control zero", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.equal(splitInfo.getCumulativeRanks(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of cumulative-time ranks for empty list of competitors", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeRanks(2, []), []);
});

QUnit.test("Gets nonempty array of cumulative-time ranks for full list of competitors in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeRanks(2, [0, 1, 2]), [1, 2, 3]);
});

QUnit.test("Gets nonempty array of cumulative-time ranks for full list of competitors not in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeRanks(2, [2, 0, 1]), [3, 1, 2]);
});

QUnit.test("Gets nonempty array of cumulative-time ranks for partial list of competitors not in order", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeRanks(2, [2, 1]), [3, 2]);
});

QUnit.test("Gets array of cumulative-time ranks for last control", function(assert) {
    var splitInfo = getTestSplitInfo();
    assert.deepEqual(splitInfo.getCumulativeRanks(4, [0, 1, 2]), [2, 1, 3]);
});

module("Competitor Split Info - times behind reference");

QUnit.test("Gets null array of times behind reference for control zero", function(assert) {
    var courseData = getTestCourseData();
    var splitInfo = new SplitInfo(courseData, courseData.getFastestTime());
    assert.equal(splitInfo.getTimesBehindReference(0, [0, 1, 2]), null);
});

QUnit.test("Gets empty array of times behind reference for empty list of competitors", function(assert) {
    var courseData = getTestCourseData();
    var splitInfo = new SplitInfo(courseData, courseData.getFastestTime());
    assert.deepEqual(splitInfo.getTimesBehindReference(2, []), []);
});

QUnit.test("Gets nonempty array of times behind reference for full list of competitors in order", function(assert) {
    var courseData = getTestCourseData();
    var splitInfo = new SplitInfo(courseData, courseData.getFastestTime());
    assert.deepEqual(splitInfo.getTimesBehindReference(2, [0, 1, 2]), [197 - 197, 221 - 197, 249 - 197]);
});

QUnit.test("Gets nonempty array of times behind reference for full list of competitors not in order", function(assert) {
    var courseData = getTestCourseData();
    var splitInfo = new SplitInfo(courseData, courseData.getFastestTime());
    assert.deepEqual(splitInfo.getTimesBehindReference(2, [2, 0, 1]), [249 - 197, 197 - 197, 221 - 197]);
});

QUnit.test("Gets nonempty array of times behind reference for partial list of competitors not in order", function(assert) {
    var courseData = getTestCourseData();
    var splitInfo = new SplitInfo(courseData, courseData.getFastestTime());
    assert.deepEqual(splitInfo.getTimesBehindReference(2, [2, 1]), [249 - 197, 221 - 197]);
});

QUnit.test("Gets array of times behind reference for last control", function(assert) {
    var courseData = getTestCourseData();
    var splitInfo = new SplitInfo(courseData, courseData.getFastestTime());
    assert.deepEqual(splitInfo.getTimesBehindReference(4, [0, 1, 2]), [106 - 100, 100 - 100, 106 - 100]);
});
