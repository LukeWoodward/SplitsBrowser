/* global window, document, $, SplitsBrowser, d3, setTimeout, clearTimeout */

(function () {
    "use strict";
    // Delay in milliseconds between a resize event being triggered and the
    // page responding to it.
    // (Resize events tend to come more than one at a time; if a resize event
    // comes in while a previous event is waiting, the previous event is
    // cancelled.)
    var RESIZE_DELAY_MS = 100;

    var _TOP_PANEL_ID = "topPanel";
    var _TOP_PANEL_ID_SELECTOR = "#" + _TOP_PANEL_ID;

    var _COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    var _COMPETITOR_LIST_CONTAINER_ID_SELECTOR = "#" + _COMPETITOR_LIST_CONTAINER_ID;

    var _ALL_OR_NONE_BUTTONS_PANEL_ID = "allOrNoneButtonsPanel";
    var _ALL_OR_NONE_BUTTONS_PANEL_ID_SELECTOR = "#" + _ALL_OR_NONE_BUTTONS_PANEL_ID;
    
    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    */
    SplitsBrowser.Viewer = function () {

        this.courses = null;
        this.currentResult = null;
        this.currentIndexes = null;
        this.reference = null;
        this.chartData = null;
        this.splitInfo = null;
        this.cumTimes = null;

        this.selection = null;
        this.courseSelector = null;
        this.statisticsSelector = null;
        this.competitorListBox = null;
        this.chart = null;
        this.topPanel = null;
        this.mainPanel = null;
        
        this.currentResizeTimeout = null;
    };
    
    /**
    * Sets the courses that the viewer can view.
    * @param {Array} courses - The array of courses that can be viewed.
    */
    SplitsBrowser.Viewer.prototype.setCourses = function (courses) {
        this.courses = courses;
        if (this.courseSelector !== null) {
            this.courseSelector.setCourses(this.courses);
        }
    };

    /**
    * Construct the UI inside the HTML body.
    */
    SplitsBrowser.Viewer.prototype.buildUi = function () {
        var body = d3.select("body");
        
        var topPanel = body.append("div")
                           .attr("id", _TOP_PANEL_ID);
                           
        var outerThis = this;
        this.courseSelector = new SplitsBrowser.Controls.CourseSelector(topPanel.node());
        this.courseSelector.registerChangeHandler(function (index) { outerThis.selectCourse(index); });
        if (this.courses !== null) {
            this.courseSelector.setCourses(this.courses);
        }
        
        topPanel.append("span").style("padding", "0px 30px 0px 30px");
        
        this.comparisonSelector = new SplitsBrowser.Controls.ComparisonSelector(topPanel.node());
        this.comparisonSelector.registerChangeHandler(function (comparisonFunc) { outerThis.selectComparison(comparisonFunc); });
        this.comparisonFunction = this.comparisonSelector.getComparisonFunction();
        
        this.statisticsSelector = new SplitsBrowser.Controls.StatisticsSelector(topPanel.node());
        
        var mainPanel = body.append("div");
        
        var competitorListContainer = mainPanel.append("div")
                                               .attr("id", _COMPETITOR_LIST_CONTAINER_ID);
                                               
        var buttonsContainer = competitorListContainer.append("div")
                                                      .attr("id", _ALL_OR_NONE_BUTTONS_PANEL_ID);
                     
        buttonsContainer.append("button")
                        .text("All")
                        .on("click", function () { outerThis.selectAll(); });
                        
        buttonsContainer.append("button")
                        .text("None")
                        .on("click", function () { outerThis.selectNone(); });
                                                           
        this.competitorListBox = new SplitsBrowser.Controls.CompetitorListBox(competitorListContainer.node());
        this.chart = new SplitsBrowser.Controls.Chart(mainPanel.node());
           
        $(window).resize(function () { outerThis.handleWindowResize(); });
    };

    /**
    * Select all of the competitors.
    */
    SplitsBrowser.Viewer.prototype.selectAll = function () {
        this.selection.selectAll();
    };

    /**
    * Select none of the competitors.
    */
    SplitsBrowser.Viewer.prototype.selectNone = function () {
        this.selection.selectNone();
    };

    /**
     * Handle a resize of the window.
     */
    SplitsBrowser.Viewer.prototype.handleWindowResize = function () {
        if (this.currentResizeTimeout !== null) {
            clearTimeout(this.currentResizeTimeout);
        }

        var outerThis = this;
        this.currentResizeTimeout = setTimeout(function() { outerThis.postResizeHook(); }, RESIZE_DELAY_MS);
    };
    
    /**
    * Resize the chart following a change of size of the chart.
    */
    SplitsBrowser.Viewer.prototype.postResizeHook = function () {
        this.currentResizeTimeout = null;
        this.drawChart();
    };

    /**
    * Draw the chart using the current data.
    */
    SplitsBrowser.Viewer.prototype.drawChart = function () {

        this.reference = this.comparisonFunction(this.currentResult);
        this.chartData = this.currentResult.getChartData(this.reference, this.currentIndexes);
        this.cumTimes = this.reference.getCumulativeTimes();
        this.splitInfo = new SplitsBrowser.Model.CompetitorSplitInfo(this.currentResult, this.reference);

        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        
        this.currentVisibleStatistics = this.statisticsSelector.getVisibleStatistics();

        this.competitorListBox.setCompetitorList(this.currentResult.competitorData);

        var topPanelHeight = $(_TOP_PANEL_ID_SELECTOR).height();
        
        // Subtract some values to avoid scrollbars appearing.
        var chartWidth = windowWidth - 18 - this.competitorListBox.width() - 40;
        var chartHeight = windowHeight - 19 - topPanelHeight;

        this.chart.setSize(chartWidth, chartHeight);
        this.chart.drawChart(this.chartData, this.splitInfo, this.cumTimes, this.currentIndexes, this.currentVisibleStatistics);

        var outerThis = this;
        
        if (this.selectionChangeHandler !== null) {
            this.selection.deregisterChangeHandler(this.selectionChangeHandler);
        }
        
        if (this.statisticsChangeHandler !== null) {
            this.statisticsSelector.deregisterChangeHandler(this.statisticsChangeHandler);
        }
        
        this.selectionChangeHandler = function (indexes) {
            outerThis.currentIndexes = indexes;
            outerThis.redraw();
        };

        this.selection.registerChangeHandler(this.selectionChangeHandler);
        
        this.statisticsChangeHandler = function (visibleStatistics) {
            outerThis.currentVisibleStatistics = visibleStatistics;
            outerThis.redraw();
        };
        
        this.statisticsSelector.registerChangeHandler(this.statisticsChangeHandler);

        $("body").height(windowHeight - 19 - topPanelHeight);
        $(_COMPETITOR_LIST_CONTAINER_ID_SELECTOR).height(windowHeight - 19 - $(_ALL_OR_NONE_BUTTONS_PANEL_ID_SELECTOR).height() - topPanelHeight);
    };

    /**
    * Redraw the chart, possibly using new data.
    */
    SplitsBrowser.Viewer.prototype.redraw = function () {
        this.chartData = this.currentResult.getChartData(this.reference, this.currentIndexes);
        this.chart.drawChart(this.chartData, this.splitInfo, this.cumTimes, this.currentIndexes, this.currentVisibleStatistics);
    };
    
    /**
    * Change the graph to show the course with the given index.
    * @param {Number} index - The (zero-based) index of the course.
    */
    SplitsBrowser.Viewer.prototype.selectCourse = function (index) {
        if (0 <= index && index < this.courses.length) {
            if (this.selection !== null) {
                this.selection.selectNone();
            }
            this.currentIndexes = [];
            this.currentResult = this.courses[index];
            this.selection = new SplitsBrowser.Model.CompetitorSelection(this.currentResult.competitorData.length);
            this.competitorListBox.setSelection(this.selection);
            this.drawChart();
        }
    };
    
    /**
    * Change the graph to compare against a different reference.
    * @param {Function} comparisonFunc - The function that returns the
    *      reference course data from the course data.
    */
    SplitsBrowser.Viewer.prototype.selectComparison = function (comparisonFunc) {
        this.comparisonFunction = comparisonFunc;
        this.drawChart();
    };

    var viewer = new SplitsBrowser.Viewer();
    
    /**
    * JQuery AJAX callback to handle the request to get some data and parse it.
    */
    function readEventData(data, status, jqXHR) {
        if (status === "success") {
            var courses = SplitsBrowser.Input.CSV.parseEventData(data);
            viewer.setCourses(courses);
            viewer.selectCourse(0);
        } else {
            alert("Got status " + status + ". :(");
        }
    }


    function testReadSplits(events_url) {
        $.ajax({
            url: events_url,
            data: "",
            success: readEventData,
            dataType: "text",
        });
    }

    $(document).ready(function() { viewer.buildUi(); testReadSplits('data/eventdata'); });
})();
