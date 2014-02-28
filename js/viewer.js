/*
 *  SplitsBrowser Viewer - Top-level class that runs the application.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    // Delay in milliseconds between a resize event being triggered and the
    // page responding to it.
    // (Resize events tend to come more than one at a time; if a resize event
    // comes in while a previous event is waiting, the previous event is
    // cancelled.)
    var RESIZE_DELAY_MS = 100;

    // ID of the div that contains the competitor list.
    // Must match that used in styles.css.
    var COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    
    var ClassSelector = SplitsBrowser.Controls.ClassSelector;
    var ChartTypeSelector = SplitsBrowser.Controls.ChartTypeSelector;
    var ComparisonSelector = SplitsBrowser.Controls.ComparisonSelector;
    var StatisticsSelector = SplitsBrowser.Controls.StatisticsSelector;
    var CompetitorListBox = SplitsBrowser.Controls.CompetitorListBox;
    var Chart = SplitsBrowser.Controls.Chart;
    var ResultsTable = SplitsBrowser.Controls.ResultsTable;
    var repairEventData = SplitsBrowser.DataRepair.repairEventData;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    
    /**
    * Enables or disables a control, by setting or clearing an HTML "disabled"
    * attribute as necessary.
    * @param {d3.selection} control - d3 selection containing the control.
    * @param {boolean} isEnabled - Whether the control is enabled.
    */
    function enableControl(control, isEnabled) {
        control.node().disabled = !isEnabled;
    }
    
    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    * @param {String|HTMLElement|undefined} - Optional HTML element that forms
    *     a 'banner' across the top of the page.  This can be specified by a
    *     CSS selector or the HTML element itself.
    */
    var Viewer = function (topDiv) {
    
        this.eventData = null;
        this.classes = null;
        this.currentClasses = [];
        this.currentIndexes = null;
        this.chartData = null;
        this.referenceCumTimes = null;
        this.fastestCumTimes = null;
        this.previousCompetitorList = [];
        this.topDivHeight = (topDiv && $(topDiv).length > 0) ? $(topDiv).height() : 0;
        
        this.isChartEnabled = false;

        this.selection = null;
        this.ageClassSet = null;
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
    * Pops up an alert box informing the user that the race graph cannot be
    * chosen as the start times are missing.
    */ 
    function alertRaceGraphDisabledAsStartTimesMissing() {
        alert(getMessage("RaceGraphDisabledAsStartTimesMissing"));
    }
    
    /**
    * Enables or disables the race graph option in the chart type selector
    * depending on whether all visible competitors have start times.
    */
    Viewer.prototype.enableOrDisableRaceGraph = function () {
        var anyStartTimesMissing = this.ageClassSet.allCompetitors.some(function (competitor) { return competitor.lacksStartTime(); });
        this.chartTypeSelector.setRaceGraphDisabledNotifier((anyStartTimesMissing) ? alertRaceGraphDisabledAsStartTimesMissing : null);
    };
    
    /**
    * Sets the classes that the viewer can view.
    * @param {SplitsBrowser.Model.Event} eventData - All event data loaded.
    */
    Viewer.prototype.setEvent = function (eventData) {
        this.eventData = eventData;
        this.classes = eventData.classes;
        if (this.classSelector !== null) {
            this.classSelector.setClasses(this.classes);
        }
    };

    /**
    * Draws the logo in the top panel.
    */
    Viewer.prototype.drawLogo = function () {
        var logoSvg = this.topPanel.append("svg")
                                   .style("float", "left");

        logoSvg.style("width", "19px")
               .style("height", "19px")
               .style("margin-bottom", "-3px")
               .style("margin-right", "20px");
               
        logoSvg.append("rect")
               .attr("x", "0")
               .attr("y", "0")
               .attr("width", "19")
               .attr("height", "19")
               .attr("fill", "white");
         
        logoSvg.append("polygon")
               .attr("points", "0,19 19,0 19,19")
               .attr("fill", "red");
               
        logoSvg.append("polyline")
               .attr("points", "0.5,0.5 0.5,18.5 18.5,18.5 18.5,0.5 0.5,0.5 0.5,18.5")
               .attr("stroke", "black")
               .attr("fill", "none");
               
        logoSvg.append("polyline")
               .attr("points", "1,12 5,8 8,14 17,11")
               .attr("fill", "none")
               .attr("stroke", "blue")
               .attr("stroke-width", "2");
                                   
        logoSvg.selectAll("*")
               .append("title")
               .text(getMessageWithFormatting("ApplicationVersion", {"$$VERSION$$": SplitsBrowser.Version}));
    };

    /**
    * Adds a spacer between controls on the top row.
    */
    Viewer.prototype.addSpacer = function () {
        this.topPanel.append("div").classed("topRowSpacer", true);    
    };
    
    /**
    * Adds the class selector control to the top panel.
    */
    Viewer.prototype.addClassSelector = function () {
        this.classSelector = new ClassSelector(this.topPanel.node());
        if (this.classes !== null) {
            this.classSelector.setClasses(this.classes);
        }
    };
    
    /**
    * Adds the chart-type selector to the top panel.
    */
    Viewer.prototype.addChartTypeSelector = function () {
        var types = SplitsBrowser.Model.ChartTypes;
        var chartTypes = [types.SplitsGraph, types.RaceGraph, types.PositionAfterLeg,
                          types.SplitPosition, types.PercentBehind, types.ResultsTable];
        
        this.chartTypeSelector = new ChartTypeSelector(this.topPanel.node(), chartTypes);
        
        this.chartType = this.chartTypeSelector.getChartType();    
    };
    
    /**
    * Adds the comparison selector to the top panel.
    */
    Viewer.prototype.addComparisonSelector = function () {
        this.comparisonSelector = new ComparisonSelector(this.topPanel.node(), function (message) { alert(message); });
        if (this.classes !== null) {
            this.comparisonSelector.setClasses(this.classes);
        }
        
        this.comparisonFunction = this.comparisonSelector.getComparisonFunction();    
    };
    
    /**
    * Adds the list of competitors, and the buttons, to the page.
    */
    Viewer.prototype.addCompetitorList = function () {
        this.competitorListContainer = this.mainPanel.append("div")
                                                     .attr("id", COMPETITOR_LIST_CONTAINER_ID);
                                               
        this.buttonsPanel = this.competitorListContainer.append("div");
                           
        var outerThis = this;
        this.allButton = this.buttonsPanel.append("button")
                                          .text(getMessage("SelectAllCompetitors"))
                                          .style("width", "50%")
                                          .on("click", function () { outerThis.selectAll(); });
                        
        this.noneButton = this.buttonsPanel.append("button")
                                           .text(getMessage("SelectNoCompetitors"))
                                           .style("width", "50%")
                                           .on("click", function () { outerThis.selectNone(); });
                        
        this.buttonsPanel.append("br");
                        
        this.crossingRunnersButton = this.buttonsPanel.append("button")
                                                      .text(getMessage("SelectCrossingRunners"))
                                                      .style("width", "100%")
                                                      .on("click", function () { outerThis.selectCrossingRunners(); })
                                                      .style("display", "none");

        this.competitorListBox = new CompetitorListBox(this.competitorListContainer.node());
    };

    /**
    * Construct the UI inside the HTML body.
    */
    Viewer.prototype.buildUi = function () {
        var body = d3.select("body");
        
        this.topPanel = body.append("div");
        
        this.drawLogo();
        this.addClassSelector();
        this.addSpacer();
        this.addChartTypeSelector();
        this.addSpacer();
        this.addComparisonSelector();
        
        this.statisticsSelector = new StatisticsSelector(this.topPanel.node());

        // Add an empty div to clear the floating divs and ensure that the
        // top panel 'contains' all of its children.
        this.topPanel.append("div")
                     .style("clear", "both");
        
        this.mainPanel = body.append("div");
                             
        this.addCompetitorList();
        this.chart = new Chart(this.mainPanel.node());
        
        this.resultsTable = new ResultsTable(body.node());
        this.resultsTable.hide();
        
        var outerThis = this;
        this.classSelector.registerChangeHandler(function (indexes) { outerThis.selectClasses(indexes); });
        this.chartTypeSelector.registerChangeHandler(function (chartType) { outerThis.selectChartType(chartType); });
        this.comparisonSelector.registerChangeHandler(function (comparisonFunc) { outerThis.selectComparison(comparisonFunc); });
           
        $(window).resize(function () { outerThis.handleWindowResize(); });
        
        // Disable text selection anywhere.
        // This is for the benefit of IE9, which doesn't support the
        // -ms-user-select CSS style.  IE10, IE11 do support -ms-user-select
        // and other browsers have their own vendor-specific CSS styles for
        // this, and in these browsers this event handler never gets called.
        $("body").bind("selectstart", function () { return false; });
    };

    /**
    * Select all of the competitors.
    */
    Viewer.prototype.selectAll = function () {
        this.selection.selectAll();
    };

    /**
    * Select none of the competitors.
    */
    Viewer.prototype.selectNone = function () {
        this.selection.selectNone();
    };

    /**
    * Select all of the competitors that cross the unique selected competitor.
    */
    Viewer.prototype.selectCrossingRunners = function () {
        this.selection.selectCrossingRunners(this.ageClassSet.allCompetitors); 
        if (this.selection.isSingleRunnerSelected()) {
            // Only a single runner is still selected, so nobody crossed the
            // selected runner.
            var competitorName = this.ageClassSet.allCompetitors[this.currentIndexes[0]].name;
            alert(getMessageWithFormatting("RaceGraphNoCrossingRunners", {"$$NAME$$": competitorName}));
        }
    };

    /**
     * Handle a resize of the window.
     */
    Viewer.prototype.handleWindowResize = function () {
        if (this.currentResizeTimeout !== null) {
            clearTimeout(this.currentResizeTimeout);
        }

        var outerThis = this;
        this.currentResizeTimeout = setTimeout(function() { outerThis.postResizeHook(); }, RESIZE_DELAY_MS);
    };
    
    /**
    * Resize the chart following a change of size of the chart.
    */
    Viewer.prototype.postResizeHook = function () {
        this.currentResizeTimeout = null;
        this.drawChart();
    };

    /**
    * Adjusts the size of the viewer.
    */
    Viewer.prototype.adjustSize = function () {
        // Margin around the body element.
        var horzMargin = parseInt($("body").css("margin-left"), 10) + parseInt($("body").css("margin-right"), 10);
        var vertMargin = parseInt($("body").css("margin-top"), 10) + parseInt($("body").css("margin-bottom"), 10);
        
        // Extra amount subtracted off of the width of the chart in order to
        // prevent wrapping, in units of pixels.
        // 2 to prevent wrapping when zoomed out to 33% in Chrome.
        var EXTRA_WRAP_PREVENTION_SPACE = 2;
        
        var bodyWidth = $(window).width() - horzMargin;
        var bodyHeight = $(window).height() - vertMargin - this.topDivHeight;

        $("body").width(bodyWidth).height(bodyHeight);
        
        var topPanelHeight = $(this.topPanel.node()).height();

        // Hide the chart before we adjust the width of the competitor list.
        // If the competitor list gets wider, the new competitor list and the
        // old chart may be too wide together, and so the chart wraps onto a
        // new line.  Even after shrinking the chart back down, there still
        // might not be enough horizontal space, because of the vertical
        // scrollbar.  So, hide the chart now, and re-show it later once we
        // know what size it should have.
        this.chart.hide();
        
        this.competitorListBox.setCompetitorList(this.ageClassSet.allCompetitors, (this.currentClasses.length > 1));
        
        var chartWidth = bodyWidth - this.competitorListBox.width() - EXTRA_WRAP_PREVENTION_SPACE;
        var chartHeight = bodyHeight - topPanelHeight;

        this.chart.setSize(chartWidth, chartHeight);
        this.chart.show();
        
        $(this.competitorListContainer.node()).height(bodyHeight - $(this.buttonsPanel.node()).height() - topPanelHeight);    
    };
    
    /**
    * Draw the chart using the current data.
    */
    Viewer.prototype.drawChart = function () {
        if (this.chartType.isResultsTable) {
            return;
        }
        
        this.adjustSize();
        
        this.currentVisibleStatistics = this.statisticsSelector.getVisibleStatistics();
        
        if (this.selectionChangeHandler !== null) {
            this.selection.deregisterChangeHandler(this.selectionChangeHandler);
        }
        
        if (this.statisticsChangeHandler !== null) {
            this.statisticsSelector.deregisterChangeHandler(this.statisticsChangeHandler);
        }
        
        var outerThis = this;
        
        this.selectionChangeHandler = function (indexes) {
            outerThis.currentIndexes = indexes;
            outerThis.enableOrDisableCrossingRunnersButton();
            outerThis.redraw();
        };

        this.selection.registerChangeHandler(this.selectionChangeHandler);
        
        this.statisticsChangeHandler = function (visibleStatistics) {
            outerThis.currentVisibleStatistics = visibleStatistics;
            outerThis.redraw();
        };
        
        this.statisticsSelector.registerChangeHandler(this.statisticsChangeHandler);

        var missedControls = this.ageClassSet.getControlsWithNoSplits();
        this.isChartEnabled = (missedControls.length === 0);
        this.updateControlEnabledness();
        if (this.isChartEnabled) {
            this.referenceCumTimes = this.comparisonFunction(this.ageClassSet);
            this.fastestCumTimes = this.ageClassSet.getFastestCumTimes();
            this.chartData = this.ageClassSet.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);
            this.redrawChart();
        } else {
            var showAddendum = (this.ageClassSet.getCourse().getNumClasses() > this.ageClassSet.getNumClasses());
            var message = getMessageWithFormatting((showAddendum) ? "NoSplitsForControlTryOtherClasses" : "NoSplitsForControl", {"$$CONTROL$$": missedControls[0]});
            this.chart.clearAndShowWarning(message);
        }
    };

    /**
    * Redraws the chart using all of the current data.
    */ 
    Viewer.prototype.redrawChart = function () {
        var data = {
            chartData: this.chartData,
            eventData: this.eventData,
            ageClassSet: this.ageClassSet,
            referenceCumTimes: this.referenceCumTimes,
            fastestCumTimes: this.fastestCumTimes
        };
            
        this.chart.drawChart(data, this.currentIndexes, this.currentVisibleStatistics, this.chartType);
    };
    
    /**
    * Redraw the chart, possibly using new data.
    */
    Viewer.prototype.redraw = function () {
        if (!this.chartType.isResultsTable && this.isChartEnabled) {
            this.chartData = this.ageClassSet.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);
            this.redrawChart();
        }
    };
    
    /**
    * Change the graph to show the classes with the given indexes.
    * @param {Number} classIndexes - The (zero-based) indexes of the classes.
    */
    Viewer.prototype.selectClasses = function (classIndexes) {
    
        if (this.selection === null) {
            this.selection = new SplitsBrowser.Model.CompetitorSelection(0);
            this.competitorListBox.setSelection(this.selection);
        } else {
            if (classIndexes.length > 0 && this.currentClasses.length > 0 && this.classes[classIndexes[0]] === this.currentClasses[0]) {
                // The 'primary' class hasn't changed, only the 'other' ones.
                // In this case we don't clear the selection.
            } else {
                this.selection.selectNone();
            }
        }
        
        this.currentIndexes = [];
        this.currentClasses = classIndexes.map(function (index) { return this.classes[index]; }, this);
        this.ageClassSet = new SplitsBrowser.Model.AgeClassSet(this.currentClasses);
        this.comparisonSelector.setAgeClassSet(this.ageClassSet);
        this.resultsTable.setClass(this.currentClasses[0]);
        this.drawChart();
        this.selection.migrate(this.previousCompetitorList, this.ageClassSet.allCompetitors);
        this.previousCompetitorList = this.ageClassSet.allCompetitors;
        this.enableOrDisableRaceGraph();
    };
    
    /**
    * Change the graph to compare against a different reference.
    * @param {Function} comparisonFunc - The function that returns the
    *      reference class data from the class data.
    */
    Viewer.prototype.selectComparison = function (comparisonFunc) {
        this.comparisonFunction = comparisonFunc;
        this.drawChart();
    };
    
    /**
    * Change the type of chart shown.
    * @param {Object} chartType - The type of chart to draw.
    */
    Viewer.prototype.selectChartType = function (chartType) {
        this.chartType = chartType;
        if (chartType.isResultsTable) {
            this.mainPanel.style("display", "none");
            this.resultsTable.show();
        } else {
            this.resultsTable.hide();
            this.mainPanel.style("display", null);
        }
        
        this.updateControlEnabledness();
        
        this.crossingRunnersButton.style("display", (chartType.isRaceGraph) ? null : "none");
        
        this.drawChart();
    };
    
    /**
    * Updates whether a number of controls are enabled.
    */
    Viewer.prototype.updateControlEnabledness = function () {
        this.classSelector.setOtherClassesEnabled(!this.chartType.isResultsTable);
        this.comparisonSelector.setEnabled(this.isChartEnabled && !this.chartType.isResultsTable);
        this.statisticsSelector.setEnabled(this.isChartEnabled && !this.chartType.isResultsTable);
        this.competitorListBox.setEnabled(this.isChartEnabled);
        enableControl(this.allButton, this.isChartEnabled);
        enableControl(this.noneButton, this.isChartEnabled);
        this.enableOrDisableCrossingRunnersButton();
    };
    
    /**
    * Enables or disables the crossing-runners button as appropriate.
    */
    Viewer.prototype.enableOrDisableCrossingRunnersButton = function () {
        enableControl(this.crossingRunnersButton, this.isChartEnabled && this.selection.isSingleRunnerSelected());
    };
    
    SplitsBrowser.Viewer = Viewer;

    /**
    * Shows a message that appears if SplitsBrowser is unable to load event
    * data.
    * @param {String} key - The key of the message to show.
    * @param {Object} params - Object mapping parameter names to values.
    */
    function showLoadFailureMessage(key, params) {
        d3.select("body")
          .append("h1")
          .text(getMessage("LoadFailedHeader"));
          
        d3.select("body")
          .append("p")
          .text(getMessageWithFormatting(key, params));
    }
    
    /**
    * Handles an asynchronous callback that fetched event data, by parsing the
    * data and starting SplitsBrowser.
    * @param {String} data - The data returned from the AJAX request.
    * @param {String} status - The status of the request.
    * @param {String|HTMLElement|undefined} - Optional HTML element that forms
    *     a 'banner' across the top of the page.  This can be specified by a
    *     CSS selector or the HTML element itself.
    */
    function readEventData(data, status, topDiv) {
        if (status === "success") {
            var eventData;
            try {
                eventData = SplitsBrowser.Input.parseEventData(data);
            } catch (e) {
                if (e.name === "InvalidData") {
                    showLoadFailureMessage("LoadFailedInvalidData", {"$$MESSAGE$$": e.message});
                    return;
                } else {
                    throw e;
                }
            }
            
            if (eventData === null) {
                showLoadFailureMessage("LoadFailedUnrecognisedData", {});
            } else {
                if (eventData.needsRepair()) {
                    repairEventData(eventData);
                }
                
                eventData.determineTimeLosses();
                
                var viewer = new Viewer(topDiv);
                viewer.buildUi();
                viewer.setEvent(eventData);
                viewer.selectClasses([0]);
            }
        } else {
            showLoadFailureMessage("LoadFailedStatusNotSuccess", {"$$STATUS$$": status});
        }
    }
    
    /**
    * Handles the failure to read an event.
    * @param {jQuery.jqXHR} jqXHR - jQuery jqHXR object.
    * @param {String} textStatus - The text status of the request.
    * @param {String} errorThrown - The error message returned from the server.
    */
    function readEventDataError(jqXHR, textStatus, errorThrown) {
        showLoadFailureMessage("LoadFailedReadError", {"$$ERROR$$": errorThrown});
    }

    /**
    * Loads the event data in the given URL and starts SplitsBrowser.
    * @param {String} eventUrl - The URL that points to the event data to load.
    * @param {String|HTMLElement|undefined} - Optional HTML element that forms
    *     a 'banner' across the top of the page.  This can be specified by a
    *     CSS selector or the HTML element itself.
    */
    SplitsBrowser.loadEvent = function (eventUrl, topDiv) {
        $.ajax({
            url: eventUrl,
            data: "",
            success: function (data, status) { readEventData(data, status, topDiv); },
            dataType: "text",
            error: readEventDataError
        });
    };    
})();
