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
    
    var _MAIN_PANEL_ID = "mainPanel";
    var _MAIN_PANEL_ID_SELECTOR = "#" + _MAIN_PANEL_ID;

    var _COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    var _COMPETITOR_LIST_CONTAINER_ID_SELECTOR = "#" + _COMPETITOR_LIST_CONTAINER_ID;

    var _BUTTONS_PANEL_ID = "buttonsPanel";
    var _BUTTONS_PANEL_ID_SELECTOR = "#" + _BUTTONS_PANEL_ID;
    
    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    */
    SplitsBrowser.Viewer = function () {

        this.courses = null;
        this.currentCourse = null;
        this.currentIndexes = null;
        this.chartData = null;
        this.referenceCumTimes = null;

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
        if (this.comparisonSelector !== null) {
            this.comparisonSelector.setCourses(courses);
        }
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
        if (this.courses !== null) {
            this.courseSelector.setCourses(this.courses);
        }
        
        topPanel.append("span").style("padding", "0px 30px 0px 30px");
        
        this.chartTypeSelector = new SplitsBrowser.Controls.ChartTypeSelector(topPanel.node());
        
        this.chartType = this.chartTypeSelector.getChartType();
        
        topPanel.append("span").style("padding", "0px 30px 0px 30px");
        
        this.comparisonSelector = new SplitsBrowser.Controls.ComparisonSelector(topPanel.node());
        if (this.courses !== null) {
            this.comparisonSelector.setCourses(this.courses);
        }
        
        this.comparisonFunction = this.comparisonSelector.getComparisonFunction();
        
        this.statisticsSelector = new SplitsBrowser.Controls.StatisticsSelector(topPanel.node());
        
        var mainPanel = body.append("div")
                            .attr("id", _MAIN_PANEL_ID);
        
        var competitorListContainer = mainPanel.append("div")
                                               .attr("id", _COMPETITOR_LIST_CONTAINER_ID);
                                               
        var buttonsContainer = competitorListContainer.append("div")
                                                      .attr("id", _BUTTONS_PANEL_ID);
                     
        buttonsContainer.append("button")
                        .text("All")
                        .on("click", function () { outerThis.selectAll(); });
                        
        buttonsContainer.append("button")
                        .text("None")
                        .on("click", function () { outerThis.selectNone(); });
                        
        buttonsContainer.append("br");
                        
        this.crossingRunnersButton = buttonsContainer.append("button")
                                                     .text("Crossing runners")
                                                     .on("click", function () { outerThis.selectCrossingRunners(); })
                                                     .attr("disabled", "disabled")
                                                     .style("display", "none");

        this.competitorListBox = new SplitsBrowser.Controls.CompetitorListBox(competitorListContainer.node());
        this.chart = new SplitsBrowser.Controls.Chart(mainPanel.node());
        
        this.resultsTable = new SplitsBrowser.Controls.ResultsTable(body.node());
        this.resultsTable.hide();
        
        this.courseSelector.registerChangeHandler(function (index) {
            outerThis.comparisonSelector.updateRunnerList(index);
            outerThis.selectCourse(index);
        });
        
        this.chartTypeSelector.registerChangeHandler(function (chartType) { outerThis.selectChartType(chartType); });
        
        this.comparisonSelector.registerChangeHandler(function (comparisonFunc) { outerThis.selectComparison(comparisonFunc); });
           
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
    * Select all of the competitors that cross the unique selected competitor.
    */
    SplitsBrowser.Viewer.prototype.selectCrossingRunners = function () {
        this.selection.selectCrossingRunners(this.currentCourse.competitors);
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
        if (this.chartType.isResultsTable) {
            return;
        }

        this.referenceCumTimes = this.comparisonFunction(this.currentCourse);
        this.chartData = this.currentCourse.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);

        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        
        this.currentVisibleStatistics = this.statisticsSelector.getVisibleStatistics();

        this.competitorListBox.setCompetitorList(this.currentCourse.competitors);

        var topPanelHeight = $(_TOP_PANEL_ID_SELECTOR).height();
        
        // Subtract some values to avoid scrollbars appearing.
        var chartWidth = windowWidth - 18 - this.competitorListBox.width() - 40;
        var chartHeight = windowHeight - 19 - topPanelHeight;

        this.chart.setSize(chartWidth, chartHeight);
        this.chart.drawChart(this.chartData, this.currentCourse, this.referenceCumTimes, this.currentIndexes, this.currentVisibleStatistics, this.chartType.yAxisLabel);

        var outerThis = this;
        
        if (this.selectionChangeHandler !== null) {
            this.selection.deregisterChangeHandler(this.selectionChangeHandler);
        }
        
        if (this.statisticsChangeHandler !== null) {
            this.statisticsSelector.deregisterChangeHandler(this.statisticsChangeHandler);
        }
        
        this.selectionChangeHandler = function (indexes) {
            outerThis.currentIndexes = indexes;
            outerThis.crossingRunnersButton.attr("disabled", (outerThis.selection.isSingleRunnerSelected()) ? null : "disabled");
            outerThis.redraw();
        };

        this.selection.registerChangeHandler(this.selectionChangeHandler);
        
        this.statisticsChangeHandler = function (visibleStatistics) {
            outerThis.currentVisibleStatistics = visibleStatistics;
            outerThis.redraw();
        };
        
        this.statisticsSelector.registerChangeHandler(this.statisticsChangeHandler);

        $("body").height(windowHeight - 19 - topPanelHeight);
        $(_COMPETITOR_LIST_CONTAINER_ID_SELECTOR).height(windowHeight - 19 - $(_BUTTONS_PANEL_ID_SELECTOR).height() - topPanelHeight);
    };

    /**
    * Redraw the chart, possibly using new data.
    */
    SplitsBrowser.Viewer.prototype.redraw = function () {
        if (!this.chartType.isResultsTable) {
            this.chartData = this.currentCourse.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);
            this.chart.drawChart(this.chartData, this.currentCourse, this.referenceCumTimes, this.currentIndexes, this.currentVisibleStatistics, this.chartType.yAxisLabel);
        }
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
            this.currentCourse = this.courses[index];
            this.selection = new SplitsBrowser.Model.CompetitorSelection(this.currentCourse.competitors.length);
            this.competitorListBox.setSelection(this.selection);
            this.resultsTable.setCourse(this.currentCourse);
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
    
    /**
    * Change the type of chart shown.
    * @param {Object} chartType - The type of chart to draw.
    */
    SplitsBrowser.Viewer.prototype.selectChartType = function (chartType) {
        this.chartType = chartType;
        if (chartType.isResultsTable) {
            d3.select(_MAIN_PANEL_ID_SELECTOR).style("display", "none");
            this.resultsTable.show();
        } else {
            this.resultsTable.hide();
            d3.select(_MAIN_PANEL_ID_SELECTOR).style("display", "");
        }
        
        this.crossingRunnersButton.style("display", (chartType.showCrossingRunnersButton) ? "" : "none");
        
        this.drawChart();
    };
    
    /**
    * Handles an asynchronous callback that fetched event data, by parsing the
    * data and starting SplitsBrowser.
    * @param {String} data - The data returned from the AJAX request.
    * @param {String} status - The status of the request.
    * @param {Object} jqXHR - jQuery XmlHttpRequest object.
    */
    function readEventData(data, status, jqXHR) {
        if (status === "success") {
            var courses = SplitsBrowser.Input.parseEventData(data);
            if (courses === null) {
                alert("Unable to read in event data file");
            } else {
                var viewer = new SplitsBrowser.Viewer();
                viewer.buildUi();
                viewer.setCourses(courses);
                viewer.selectCourse(0);
            }
        } else {
            alert("Unable to read event data.  Status: " + status);
        }
    }

    /**
    * Loads the event data in the given URL and starts SplitsBrowser.
    * @param {String} eventUrl - The URL that points to the event data to load.
    */
    SplitsBrowser.loadEvent = function (eventUrl) {
        $.ajax({
            url: eventUrl,
            data: "",
            success: readEventData,
            dataType: "text",
        });
    };
})();
