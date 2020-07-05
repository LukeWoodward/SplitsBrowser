/*
 *  SplitsBrowser - Chart tests.
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

    var Chart = SplitsBrowser.Controls.Chart;
    var fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var Competitor = SplitsBrowser.Model.Competitor;
    var Team = SplitsBrowser.Model.Team;
    var createTeamResult = SplitsBrowser.Model.Result.createTeamResult;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    var fromSplitTimes = SplitsBrowserTest.fromSplitTimes;

    function getIndexesAroundOmittedCumTimes(result) {
        return result.getControlIndexesAroundOmittedCumulativeTimes();
    }

    var DUMMY_CHART_TYPE = {
        name: "dummy",
        dataSelector: function (result, referenceCumTimes) { return result.getCumTimesAdjustedToReference(referenceCumTimes); },
        yAxisLabelKey: "SplitsGraphYAxisLabel",
        isRaceGraph: false,
        indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumTimes
    };

    var DUMMY_CHART_TYPE_RACE_GRAPH = {
        name: "dummy race graph",
        dataSelector: function (result, referenceCumTimes) { return result.getCumTimesAdjustedToReference(referenceCumTimes); },
        yAxisLabelKey: "SplitsGraphYAxisLabel",
        isRaceGraph: true,
        indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumTimes
    };

    var TEXT_WIDTHS = {
        "Second Runner": 85,
        "First Runner": 100,
        "00:28": 58,
        "03:41 (2)": 77,
        "09:56 (2)": 77,
        "00:00:00 Second Runner": 175,
        "00:00:00 First Runner": 190,
        "Team 1": 70,
        "Team 2": 70
    };

    var TEXT_HEIGHTS = {
        "Second Runner": 12,
        "First Runner": 12,
        "Team 1": 12,
        "Team 2": 12
    };

    // Dummy functions for returning the width/height of pieces of text.
    function getTextWidth(text) {
        while (text.substring(0, 1) === "\xa0") {
            text = text.substring(1);
        }

        if (text in TEXT_WIDTHS) {
            return TEXT_WIDTHS[text];
        } else {
            throw new Error("Width of text '" + text + "' not known");
        }
    }

    function getTextHeight(text) {
        if (text in TEXT_HEIGHTS) {
            return TEXT_HEIGHTS[text];
        } else {
            throw new Error("Height of text '" + text + "' not known");
        }
    }

    // Utility function to set up a chart in a parent element and mock out the
    // width and height methods.
    function createTestChart() {
        var div = document.createElement("div");
        var chart = new Chart(div);
        chart.getTextWidth = getTextWidth;
        chart.getTextHeight = getTextHeight;
        chart.setSize(1000, 1000);
        return chart;
    }

    QUnit.module("Chart");

    /**
    * Creates and returns a CourseClassSet object and event object populated with
    * test data.  If no value is provided for the optional competitors parameter,
    * a list of two competitors is used as a default.
    * @param {Array} competitors - Optional array of competitors.
    * @return {Object} Object containing a course-class set and event data.
    */
    function getTestCourseClass(results) {
        if (typeof results === "undefined") {
            var result1 = fromSplitTimes(1, "Second Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
            var result2 = fromSplitTimes(2, "First Runner", "ABC", 10 * 3600, [65, 221, 184, 100]);
            results = [result1, result2];
        }

        return new CourseClass("Test", 3, results);
    }

    /**
    * Runs a test for creating a chart.  The test doesn't make any assertions;
    * it just checks that the chart gets created successfully.
	* @param {QUnit.assert} assert - QUnit assert object.
    * @param {Object} chartType - The chart type.
    * @param {Array} results - Optional array of results.
    */
    function runChartCreationTest(assert, chartType, results) {
        runChartCreationTestGivenCourseClass(assert, chartType, getTestCourseClass(results));
    }

    /**
    * Runs a test for creating a chart.  The test doesn't make any assertions;
    * it just checks that the chart gets created successfully.
	* @param {QUnit.assert} assert - QUnit assert object.
    * @param {Object} chartType - The chart type.
    * @param {CourseClass} courseClass - The course-class to run the tests on.
    */
    function runChartCreationTestGivenCourseClass(assert, chartType, courseClass) {
        var courseClassSet = new CourseClassSet([courseClass]);
        var course = new Course("Test course", [courseClass], null, null, null);
        courseClass.setCourse(course);
        var eventData = new Event([courseClass], [course]);
        var fastestCumTimes = courseClassSet.getFastestCumTimes();
        var chart = createTestChart(chartType);
        var data = {
            chartData: courseClassSet.getChartData(fastestCumTimes, [0, 1], chartType, null),
            eventData: eventData,
            courseClassSet: courseClassSet,
            referenceCumTimes: fastestCumTimes,
            fastestCumTimes: fastestCumTimes
        };

        chart.drawChart(data, [0, 1], [true, true, true], chartType, null);
        assert.expect(0);
    }

    // Most of the testing of the chart functionality is visual, so it isn't
    // realistic to perform any automated tests for this.  However, it is
    // useful to have a check that the code at least runs without errors.  So
    // we do no further testing.

    // The expect(0) lines are there to tell QUnit that no assertions are
    // expected.  If we don't do this, it will complain that the test isn't
    // testing anything.

    QUnit.test("Can create a chart without start-time labels", function (assert) {
        runChartCreationTest(assert, DUMMY_CHART_TYPE);
    });

    QUnit.test("Can create a chart with start-time labels", function (assert) {
        runChartCreationTest(assert, DUMMY_CHART_TYPE_RACE_GRAPH);
    });

    QUnit.test("Can create a chart with dubious info", function (assert) {
        var results = [
            fromCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106], new Competitor("Second Runner", "DEF")),
            fromOriginalCumTimes(2, 10 * 3600, [0, 65, 65 - 10, 65 + 221 + 184, 65 + 221 + 184 + 100], new Competitor("First Runner", "ABC"))
        ];

        results[1].setRepairedCumulativeTimes([0, 65, NaN, 65 + 221 + 184, 65 + 221 + 184 + 100]);

        runChartCreationTest(assert, DUMMY_CHART_TYPE, results);
    });

    QUnit.test("Can create a chart for a team event", function (assert) {
        var result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 199, 103]);
        var result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 220, 111]);
        var team1 = new Team("Team 1", "DEF");
        var team2 = new Team("Team 2", "ABC");
        var results = [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)];

        var courseClass = new CourseClass("Test", 7, results);
        courseClass.setIsTeamClass([3, 3]);

        runChartCreationTestGivenCourseClass(assert, DUMMY_CHART_TYPE, courseClass);
    });
})();