/* global window, $, SplitsBrowser, d3, setTimeout, clearTimeout */

(function () {
    "use strict";
    // Delay in milliseconds between a resize event being triggered and the
    // page responding to it.
    // (Resize events tend to come more than one at a time; if a resize event
    // comes in while a previous event is waiting, the previous event is
    // cancelled.)
    var RESIZE_DELAY_MS = 100;

    // ID of the div that contains the competitor list.
    // Must match that used in styles.css.
    var COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    
    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    */
    SplitsBrowser.Viewer = function () {

        this.classes = null;
        this.currentClass = null;
        this.currentIndexes = null;
        this.chartData = null;
        this.referenceCumTimes = null;

        this.selection = null;
        this.classSelector = null;
        this.statisticsSelector = null;
        this.competitorListBox = null;
        this.chart = null;
        this.topPanel = null;
        this.mainPanel = null;
        this.buttonsPanel = null;
        this.competitorListContainer = null;
        
        this.currentResizeTimeout = null;
    };
    
    /**
    * Sets the classes that the viewer can view.
    * @param {Array} classes - The array of classes that can be viewed.
    */
    SplitsBrowser.Viewer.prototype.setClasses = function (classes) {
        this.classes = classes;
        if (this.comparisonSelector !== null) {
            this.comparisonSelector.setClasses(classes);
        }
        if (this.classSelector !== null) {
            this.classSelector.setClasses(this.classes);
        }
    };

    /**
    * Construct the UI inside the HTML body.
    */
    SplitsBrowser.Viewer.prototype.buildUi = function () {
        var body = d3.select("body");
        
        this.topPanel = body.append("div");
                           
        var outerThis = this;
        this.classSelector = new SplitsBrowser.Controls.ClassSelector(this.topPanel.node());
        if (this.classes !== null) {
            this.classSelector.setClasses(this.classes);
        }
        
        this.topPanel.append("span").style("padding", "0px 30px 0px 30px");
        
        this.chartTypeSelector = new SplitsBrowser.Controls.ChartTypeSelector(this.topPanel.node());
        
        this.chartType = this.chartTypeSelector.getChartType();
        
        this.topPanel.append("span").style("padding", "0px 30px 0px 30px");
        
        this.comparisonSelector = new SplitsBrowser.Controls.ComparisonSelector(this.topPanel.node());
        if (this.classes !== null) {
            this.comparisonSelector.setClasses(this.classes);
        }
        
        this.comparisonFunction = this.comparisonSelector.getComparisonFunction();
        
        this.statisticsSelector = new SplitsBrowser.Controls.StatisticsSelector(this.topPanel.node());
        
        this.mainPanel = body.append("div");
        
        this.competitorListContainer = this.mainPanel.append("div")
                                                     .attr("id", COMPETITOR_LIST_CONTAINER_ID);
                                               
        this.buttonsPanel = this.competitorListContainer.append("div");
                     
        this.buttonsPanel.append("button")
                         .text("All")
                         .style("width", "50%")
                         .on("click", function () { outerThis.selectAll(); });
                        
        this.buttonsPanel.append("button")
                         .text("None")
                         .style("width", "50%")
                         .on("click", function () { outerThis.selectNone(); });
                        
        this.buttonsPanel.append("br");
                        
        this.crossingRunnersButton = this.buttonsPanel.append("button")
                                                      .text("Crossing runners")
                                                      .style("width", "100%")
                                                      .on("click", function () { outerThis.selectCrossingRunners(); })
                                                      .attr("disabled", "disabled")
                                                      .style("display", "none");

        this.competitorListBox = new SplitsBrowser.Controls.CompetitorListBox(this.competitorListContainer.node());
        this.chart = new SplitsBrowser.Controls.Chart(this.mainPanel.node());
        
        this.resultsTable = new SplitsBrowser.Controls.ResultsTable(body.node());
        this.resultsTable.hide();
        
        this.classSelector.registerChangeHandler(function (index) {
            outerThis.comparisonSelector.updateRunnerList(index);
            outerThis.selectClass(index);
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
        this.selection.selectCrossingRunners(this.currentClass.competitors);
        if (this.selection.isSingleRunnerSelected()) {
            var competitorName = this.currentClass.competitors[this.currentIndexes[0]].name;
            alert(competitorName + " has no crossing runners.");
        }
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

        this.referenceCumTimes = this.comparisonFunction(this.currentClass);
        this.chartData = this.currentClass.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);

        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        
        this.currentVisibleStatistics = this.statisticsSelector.getVisibleStatistics();

        this.competitorListBox.setCompetitorList(this.currentClass.competitors);

        var topPanelHeight = $(this.topPanel.node()).height();
        
        // Subtract some values to avoid scrollbars appearing.
        var chartWidth = windowWidth - 18 - this.competitorListBox.width() - 40;
        var chartHeight = windowHeight - 19 - topPanelHeight;

        this.chart.setSize(chartWidth, chartHeight);
        this.redrawChart();

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
        $(this.competitorListContainer.node()).height(windowHeight - 19 - $(this.buttonsPanel.node()).height() - topPanelHeight);
    };

    /**
    * Redraws the chart using all of the current data.
    */ 
    SplitsBrowser.Viewer.prototype.redrawChart = function () {
        this.chart.drawChart(this.chartData, this.currentClass, this.referenceCumTimes, this.currentIndexes, this.currentVisibleStatistics, this.chartType.yAxisLabel, (this.chartType.showCrossingRunnersButton));
    };
    
    /**
    * Redraw the chart, possibly using new data.
    */
    SplitsBrowser.Viewer.prototype.redraw = function () {
        if (!this.chartType.isResultsTable) {
            this.chartData = this.currentClass.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);
            this.redrawChart();
        }
    };
    
    /**
    * Change the graph to show the class with the given index.
    * @param {Number} index - The (zero-based) index of the class.
    */
    SplitsBrowser.Viewer.prototype.selectClass = function (index) {
        if (0 <= index && index < this.classes.length) {
            if (this.selection !== null) {
                this.selection.selectNone();
            }
            this.currentIndexes = [];
            this.currentClass = this.classes[index];
            this.selection = new SplitsBrowser.Model.CompetitorSelection(this.currentClass.competitors.length);
            this.competitorListBox.setSelection(this.selection);
            this.resultsTable.setClass(this.currentClass);
            this.drawChart();
        }
    };
    
    /**
    * Change the graph to compare against a different reference.
    * @param {Function} comparisonFunc - The function that returns the
    *      reference class data from the class data.
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
            this.mainPanel.style("display", "none");
            this.resultsTable.show();
        } else {
            this.resultsTable.hide();
            this.mainPanel.style("display", "");
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
            var classes = SplitsBrowser.Input.parseEventData(data);
            if (classes === null) {
                alert("Unable to read in event data file");
            } else {
                var viewer = new SplitsBrowser.Viewer();
                viewer.buildUi();
                viewer.setClasses(classes);
                viewer.selectClass(0);
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
