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
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    var fromSplitTimes = SplitsBrowserTest.fromSplitTimes;
    
    function getIndexesAroundOmittedCumTimes(result) {
        return result.getControlIndexesAroundOmittedCumulativeTimes();
    }

    var DUMMY_CHART_TYPE_NO_SKIP = {
        name: "dummy",
        dataSelector: function (result, referenceCumTimes) { return result.getCumTimesAdjustedToReference(referenceCumTimes); },
        skipStart: false,
        yAxisLabelKey: "SplitsGraphYAxisLabel",
        isRaceGraph: false,
        indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumTimes
    };
    
    var DUMMY_CHART_TYPE_SKIP = {
        name: "dummy skip",
        dataSelector: function (result) { return result.splitRanks; },
        skipStart: true,
        yAxisLabelKey: "SplitsGraphYAxisLabel",
        isRaceGraph: false,
        indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumTimes
    };

    var DUMMY_CHART_TYPE_RACE_GRAPH = {
        name: "dummy race graph",
        dataSelector: function (result, referenceCumTimes) { return result.getCumTimesAdjustedToReference(referenceCumTimes); },
        skipStart: false,
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
        "00:00:00 First Runner": 190
    };

    var TEXT_HEIGHTS = {
        "Second Runner": 12,
        "First Runner": 12
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
    function getTestCourseClassSetAndEvent(results) {
        if (typeof results === "undefined") {
            var result1 = fromSplitTimes(1, "Second Runner", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]).result;
            var result2 = fromSplitTimes(2, "First Runner", "ABC", 10 * 3600, [65, 221, 184, 100]).result;
            results = [result1, result2];
        }
        
        var courseClass = new CourseClass("Test", 3, results);
        var courseClassSet = new CourseClassSet([courseClass]);
        var course = new Course("Test course", [courseClass], null, null, null);
        courseClass.setCourse(course);
        var eventData = new Event([courseClass], [course]);
        return {courseClassSet: courseClassSet, eventData: eventData};
    }
    
    /**
    * Runs a test for creating a chart.  The test doesn't make any assertions;
    * it just checks that the chart gets created successfully.
	* @param {QUnit.assert} assert - QUnit assert object.
    * @param {Object} chartType - The chart type.
    * @param {Array} results - Optional array of results.
    */
    function runChartCreationTest(assert, chartType, results) {
        var courseClassSetAndEvent = getTestCourseClassSetAndEvent(results);
        var fastestCumTimes = courseClassSetAndEvent.courseClassSet.getFastestCumTimes();
        var chart = createTestChart(chartType);
        var data = {
            chartData: courseClassSetAndEvent.courseClassSet.getChartData(fastestCumTimes, [0, 1], chartType),
            eventData: courseClassSetAndEvent.eventData,
            courseClassSet: courseClassSetAndEvent.courseClassSet,
            referenceCumTimes: fastestCumTimes,
            fastestCumTimes: fastestCumTimes
        };
        
        chart.drawChart(data, [0, 1], [true, true, true], chartType);
        assert.expect(0);
    }

    // Most of the testing of the chart functionality is visual, so it isn't
    // realistic to perform any automated tests for this.  However, it is
    // useful to have a check that the code at least runs without errors.  So
    // we do no further testing.

    // The expect(0) lines are there to tell QUnit that no assertions are
    // expected.  If we don't do this, it will complain that the test isn't
    // testing anything.

    QUnit.test("Can create a chart without skipping the start", function (assert) {
        runChartCreationTest(assert, DUMMY_CHART_TYPE_NO_SKIP);
    });

    QUnit.test("Can create a chart with a chart type skipping the start", function (assert) {
        runChartCreationTest(assert, DUMMY_CHART_TYPE_SKIP);
    });

    QUnit.test("Can create a chart with start-time labels", function (assert) {
        runChartCreationTest(assert, DUMMY_CHART_TYPE_RACE_GRAPH);
    });
    
    QUnit.test("Can create a chart with dubious info", function (assert) {
        var competitors = [
            new Competitor("Second Runner", "DEF", fromCumTimes(1, 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106])),
            new Competitor("First Runner", "ABC", fromOriginalCumTimes(2, 10 * 3600, [0, 65, 65 - 10, 65 + 221 + 184, 65 + 221 + 184 + 100]))
        ];
        
        competitors[1].result.setRepairedCumulativeTimes([0, 65, NaN, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        
        runChartCreationTest(assert, DUMMY_CHART_TYPE_NO_SKIP);
    });
    
})();