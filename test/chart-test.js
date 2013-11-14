(function () {
    "use strict";

    var Chart = SplitsBrowser.Controls.Chart;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var AgeClassSet = SplitsBrowser.Model.AgeClassSet;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    var _DUMMY_CHART_TYPE_NO_SKIP = {
        name: "dummy",
        dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReference(referenceCumTimes); },
        skipStart: false
    };
    
    var _DUMMY_CHART_TYPE_SKIP = {
        name: "dummy skip",
        dataSelector: function (comp) { return comp.splitRanks; },
        skipStart: true
    };

    var TEXT_WIDTHS = {
        "Fred Brown": 85,
        "John Smith": 100,
        "00:28": 58,
        "03:41 (2)": 77,
        "09:56 (2)": 77,
        "00:00:00 Fred Brown": 175,
        "00:00:00 John Smith": 190
    };

    var TEXT_HEIGHTS = {
        "Fred Brown": 12,
        "John Smith": 12
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
        return chart;
    }

    module("Chart");
    
    /**
    * Creates and returns a AgeClassSet object populated with test data.
    */
    function getTestAgeClassSetAndEvent() {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        var ageClassSet = new AgeClassSet([ageClass]);
        var course = new Course("Test course", [ageClass], null, null, null);
        ageClass.setCourse(course);
        var eventData = new Event([ageClass], [course]);
        return {ageClassSet: ageClassSet, eventData: eventData};
    }

    // Most of the testing of the chart functionality is visual, so it isn't
    // realistic to perform any automated tests for this.  However, it is
    // useful to have a check that the code at least runs without errors.  So
    // we do no further testing.

    // The expect(0) lines are there to tell QUnit that no assertions are
    // expected.  If we don't do this, it will complain that the test isn't
    // testing anything.

    QUnit.test("Can create a chart", function () {
        var ageClassSetAndEvent = getTestAgeClassSetAndEvent();
        var fastestCumTimes = ageClassSetAndEvent.ageClassSet.getFastestCumTimes();
        var chartData = ageClassSetAndEvent.ageClassSet.getChartData(fastestCumTimes, [0, 1], _DUMMY_CHART_TYPE_NO_SKIP);
        
        var chart = createTestChart();
        chart.setSize(1000, 1000);
        chart.drawChart(chartData, ageClassSetAndEvent.eventData, ageClassSetAndEvent.ageClassSet, fastestCumTimes, fastestCumTimes, [0, 1], [true, true, true], "y-axis label", false);
        expect(0);
    });

    QUnit.test("Can create a chart with a chart type skipping the start", function () {
        var ageClassSetAndEvent = getTestAgeClassSetAndEvent();
        var fastestCumTimes = ageClassSetAndEvent.ageClassSet.getFastestCumTimes();
        var chartData = ageClassSetAndEvent.ageClassSet.getChartData(fastestCumTimes, [0, 1], _DUMMY_CHART_TYPE_SKIP);

        var chart = createTestChart();
        chart.setSize(1000, 1000);
        chart.drawChart(chartData, ageClassSetAndEvent.eventData, ageClassSetAndEvent.ageClassSet, fastestCumTimes, fastestCumTimes, [0, 1], [true, true, true], "y-axis label", false);
        expect(0);
    });

    QUnit.test("Can create a chart with start-time labels", function () {
        var ageClassSetAndEvent = getTestAgeClassSetAndEvent();
        var fastestCumTimes = ageClassSetAndEvent.ageClassSet.getFastestCumTimes();
        var chartData = ageClassSetAndEvent.ageClassSet.getChartData(fastestCumTimes, [0, 1], _DUMMY_CHART_TYPE_NO_SKIP);

        var chart = createTestChart();
        chart.setSize(1000, 1000);
        chart.drawChart(chartData, ageClassSetAndEvent.eventData, ageClassSetAndEvent.ageClassSet, fastestCumTimes, fastestCumTimes, [0, 1], [true, true, true], "y-axis label", true);
        expect(0);
    });
    
})();