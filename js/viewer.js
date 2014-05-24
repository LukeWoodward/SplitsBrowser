/*
 *  SplitsBrowser Viewer - Top-level class that runs the application.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    
    var Version = SplitsBrowser.Version;
    var getMessage = SplitsBrowser.getMessage;
    var tryGetMessage = SplitsBrowser.tryGetMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    
    var Model = SplitsBrowser.Model;
    var CompetitorSelection = Model.CompetitorSelection;
    var AgeClassSet = Model.AgeClassSet;
    var ChartTypes = Model.ChartTypes;
    
    var parseEventData = SplitsBrowser.Input.parseEventData;
    var repairEventData = SplitsBrowser.DataRepair.repairEventData;
    var transferCompetitorData = SplitsBrowser.DataRepair.transferCompetitorData;
    var parseQueryString = SplitsBrowser.parseQueryString;
    var formatQueryString = SplitsBrowser.formatQueryString;
    
    var Controls = SplitsBrowser.Controls;
    var ClassSelector = Controls.ClassSelector;
    var ChartTypeSelector = Controls.ChartTypeSelector;
    var ComparisonSelector = Controls.ComparisonSelector;
    var OriginalDataSelector = Controls.OriginalDataSelector;
    var StatisticsSelector = Controls.StatisticsSelector;
    var CompetitorListBox = Controls.CompetitorListBox;
    var Chart = Controls.Chart;
    var ResultsTable = Controls.ResultsTable;
    
    /**
    * Enables or disables a control, by setting or clearing an HTML "disabled"
    * attribute as necessary.
    * @param {d3.selection} control - d3 selection containing the control.
    * @param {boolean} isEnabled - Whether the control is enabled.
    */
    function enableControl(control, isEnabled) {
        control.property("disabled", !isEnabled);
    }
    
    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    * @param {Object|undefined} options - Optional object containing various
    *     options to SplitsBrowser.
    */
    var Viewer = function (options) {
        this.options = options;
    
        this.eventData = null;
        this.classes = null;
        this.currentClasses = [];
        this.chartData = null;
        this.referenceCumTimes = null;
        this.fastestCumTimes = null;
        this.previousCompetitorList = [];
        
        this.topBarHeight = (options && options.topBar && $(options.topBar).length > 0) ? $(options.topBar).height() : 0;
        
        this.selection = null;
        this.ageClassSet = null;
        this.classSelector = null;
        this.comparisonSelector = null;
        this.originalDataSelector = null;
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
               .text(getMessageWithFormatting("ApplicationVersion", {"$$VERSION$$": Version}));
    };

    /**
    * Adds a spacer between controls on the top row.
    */
    Viewer.prototype.addSpacer = function () {
        this.topPanel.append("div").classed("topRowSpacer", true);    
    };
    
    /**
    * Adds a country flag to the top panel.
    */
    Viewer.prototype.addCountryFlag = function () {
        var flagImage = this.topPanel.append("img")
                                     .attr("id", "flagImage")
                                     .attr("src", this.options.flagImageURL)
                                     .attr("alt", tryGetMessage("Language", ""))
                                     .attr("title", tryGetMessage("Language", ""));
        if (this.options.hasOwnProperty("flagImageWidth")) {
            flagImage.attr("width", this.options.flagImageWidth);
        }
        if (this.options.hasOwnProperty("flagImageHeight")) {
            flagImage.attr("height", this.options.flagImageHeight);
        }
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
        var chartTypes = [ChartTypes.SplitsGraph, ChartTypes.RaceGraph, ChartTypes.PositionAfterLeg,
                          ChartTypes.SplitPosition, ChartTypes.PercentBehind, ChartTypes.ResultsTable];
        
        this.chartTypeSelector = new ChartTypeSelector(this.topPanel.node(), chartTypes);
    };
    
    /**
    * Adds the comparison selector to the top panel.
    */
    Viewer.prototype.addComparisonSelector = function () {
        this.comparisonSelector = new ComparisonSelector(this.topPanel.node(), function (message) { alert(message); });
        if (this.classes !== null) {
            this.comparisonSelector.setClasses(this.classes);
        }
    };
    
    /**
    * Adds a checkbox to select the 'original' data or data after SplitsBrowser
    * has attempted to repair it.
    */
    Viewer.prototype.addOriginalDataSelector = function () {
        this.originalDataSelector = new OriginalDataSelector(this.topPanel);
    };

    /**
    * Adds a direct link which links directly to SplitsBrowser with the given
    * settings.
    */
    Viewer.prototype.addDirectLink = function () {
        this.directLink = this.topPanel.append("a")
                                      .attr("title", tryGetMessage("DirectLinkToolTip", ""))
                                      .attr("id", "directLinkAnchor")
                                      .attr("href", document.location.href)
                                      .text(getMessage("DirectLink"));
    };
    
    /**
    * Updates the URL that the direct link points to.
    */
    Viewer.prototype.updateDirectLink = function () {
        var data = {
            classes: this.classSelector.getSelectedClasses(),
            view: this.chartTypeSelector.getChartType(),
            compareWith: this.comparisonSelector.getComparisonType(),
            selected: this.selection.getSelectedIndexes(),
            stats: this.statisticsSelector.getVisibleStatistics(),
            showOriginal: this.ageClassSet.hasDubiousData() && this.originalDataSelector.isOriginalDataSelected()
        };
        
        var oldQueryString = document.location.search;
        var newQueryString = formatQueryString(oldQueryString, this.eventData, this.ageClassSet, data);
        var oldHref = document.location.href;        
        this.directLink.attr("href", oldHref.substring(0, oldHref.length - oldQueryString.length) + "?" + newQueryString);
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
        if (this.options && this.options.flagImageURL) {
            this.addCountryFlag();
        }
        
        this.addClassSelector();
        this.addSpacer();
        this.addChartTypeSelector();
        this.addSpacer();
        this.addComparisonSelector();
        this.addOriginalDataSelector();
        this.addSpacer();
        this.addDirectLink();
        
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
           
        $(window).resize(function () { outerThis.handleWindowResize(); });
        
        // Disable text selection anywhere.
        // This is for the benefit of IE9, which doesn't support the
        // -ms-user-select CSS style.  IE10, IE11 do support -ms-user-select
        // and other browsers have their own vendor-specific CSS styles for
        // this, and in these browsers this event handler never gets called.
        $("body").bind("selectstart", function () { return false; });
    };

    /**
    * Registers change handlers.
    */
    Viewer.prototype.registerChangeHandlers = function () {
        var outerThis = this;
        this.classSelector.registerChangeHandler(function (indexes) { outerThis.selectClasses(indexes); });
        this.chartTypeSelector.registerChangeHandler(function (chartType) { outerThis.selectChartTypeAndRedraw(chartType); });
        this.comparisonSelector.registerChangeHandler(function (comparisonFunc) { outerThis.selectComparison(comparisonFunc); });
        this.originalDataSelector.registerChangeHandler(function (showOriginalData) { outerThis.showOriginalOrRepairedData(showOriginalData); });
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
            var competitorName = this.ageClassSet.allCompetitors[this.selection.getSelectedIndexes()[0]].name;
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
        var bodyHeight = $(window).height() - vertMargin - this.topBarHeight;

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
        if (this.chartTypeSelector.getChartType().isResultsTable) {
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
        
        this.selectionChangeHandler = function () {
            outerThis.enableOrDisableCrossingRunnersButton();
            outerThis.redraw();
            outerThis.updateDirectLink();
        };

        this.selection.registerChangeHandler(this.selectionChangeHandler);
        
        this.statisticsChangeHandler = function (visibleStatistics) {
            outerThis.currentVisibleStatistics = visibleStatistics;
            outerThis.redraw();
            outerThis.updateDirectLink();
        };
        
        this.statisticsSelector.registerChangeHandler(this.statisticsChangeHandler);

        this.updateControlEnabledness();
        var comparisonFunction = this.comparisonSelector.getComparisonFunction();
        this.referenceCumTimes = comparisonFunction(this.ageClassSet);
        this.fastestCumTimes = this.ageClassSet.getFastestCumTimes();
        this.chartData = this.ageClassSet.getChartData(this.referenceCumTimes, this.selection.getSelectedIndexes(), this.chartTypeSelector.getChartType());
        this.redrawChart();
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
            
        this.chart.drawChart(data, this.selection.getSelectedIndexes(), this.currentVisibleStatistics, this.chartTypeSelector.getChartType());
    };
    
    /**
    * Redraw the chart, possibly using new data.
    */
    Viewer.prototype.redraw = function () {
        var chartType = this.chartTypeSelector.getChartType();
        if (!chartType.isResultsTable) {
            this.chartData = this.ageClassSet.getChartData(this.referenceCumTimes, this.selection.getSelectedIndexes(), chartType);
            this.redrawChart();
        }
    };
    
    /**
    * Sets the currently-selected classes in various objects that need it:
    * current age-class set, comparison selector and results table.
    * @param {Array} classIndexes - Array of selected class indexes.    
    */
    Viewer.prototype.setClasses = function (classIndexes) {
        this.currentClasses = classIndexes.map(function (index) { return this.classes[index]; }, this);
        this.ageClassSet = new AgeClassSet(this.currentClasses);
        this.comparisonSelector.setAgeClassSet(this.ageClassSet);
        this.resultsTable.setClass(this.currentClasses[0]);    
        this.enableOrDisableRaceGraph();
        this.originalDataSelector.setVisible(this.ageClassSet.hasDubiousData());
    };
    
    /**
    * Initialises the viewer with the given initial classes.
    * @param {Array} classIndexes - Array of selected class indexes.
    */ 
    Viewer.prototype.initClasses = function (classIndexes) {
        this.classSelector.selectClasses(classIndexes);
        this.setClasses(classIndexes);
        this.selection = new CompetitorSelection(this.ageClassSet.allCompetitors.length);
        this.competitorListBox.setSelection(this.selection);
        this.previousCompetitorList = this.ageClassSet.allCompetitors;
    };
    
    /**
    * Change the graph to show the classes with the given indexes.
    * @param {Number} classIndexes - The (zero-based) indexes of the classes.
    */
    Viewer.prototype.selectClasses = function (classIndexes) {
    
        if (classIndexes.length > 0 && this.currentClasses.length > 0 && this.classes[classIndexes[0]] === this.currentClasses[0]) {
            // The 'primary' class hasn't changed, only the 'other' ones.
            // In this case we don't clear the selection.
        } else {
            this.selection.selectNone();
        }
        
        this.setClasses(classIndexes);
        this.drawChart();
        this.selection.migrate(this.previousCompetitorList, this.ageClassSet.allCompetitors);
        this.previousCompetitorList = this.ageClassSet.allCompetitors;
        this.updateDirectLink();
    };
    
    /**
    * Change the graph to compare against a different reference.
    */
    Viewer.prototype.selectComparison = function () {
        this.drawChart();
        this.updateDirectLink();
    };
    
    /**
    * Change the type of chart shown.
    * @param {Object} chartType - The type of chart to draw.
    */
    Viewer.prototype.selectChartType = function (chartType) {
        if (chartType.isResultsTable) {
            this.mainPanel.style("display", "none");
            
            // Remove any fixed width and height on the body, as we need the
            // window to be able to scroll if the results table is too wide or
            // too tall and also adjust size if one or both scrollbars appear.
            d3.select("body").style("width", null).style("height", null);
            
            this.resultsTable.show();
        } else {
            this.resultsTable.hide();
            this.mainPanel.style("display", null);
        }
        
        this.updateControlEnabledness();
        
        this.crossingRunnersButton.style("display", (chartType.isRaceGraph) ? null : "none");
    };
    
    /**
    * Change the type of chart shown.
    * @param {Object} chartType - The type of chart to draw.
    */
    Viewer.prototype.selectChartTypeAndRedraw = function (chartType) {
        this.selectChartType(chartType);
        this.drawChart();
        this.updateDirectLink();
    };
    
    /**
    * Selects original or repaired data, doing any recalculation necessary.
    * @param {boolean} showOriginalData - True to show original data, false to
    *     show repaired data.
    */
    Viewer.prototype.selectOriginalOrRepairedData = function (showOriginalData) {
        if (showOriginalData) {
            transferCompetitorData(this.eventData);
        } else {
            repairEventData(this.eventData);
        }
        
        this.eventData.determineTimeLosses();
    };
    
    /**
    * Shows original or repaired data.
    * @param {boolean} showOriginalData - True to show original data, false to
    *     show repaired data.
    */
    Viewer.prototype.showOriginalOrRepairedData = function (showOriginalData) {
        this.selectOriginalOrRepairedData(showOriginalData);
        this.drawChart();
        this.updateDirectLink();
    };
    
    /**
    * Updates whether a number of controls are enabled.
    */
    Viewer.prototype.updateControlEnabledness = function () {
        var chartType = this.chartTypeSelector.getChartType();
        this.classSelector.setOtherClassesEnabled(!chartType.isResultsTable);
        this.comparisonSelector.setEnabled(!chartType.isResultsTable);
        this.statisticsSelector.setEnabled(!chartType.isResultsTable);
        this.originalDataSelector.setEnabled(!chartType.isResultsTable);
        this.enableOrDisableCrossingRunnersButton();
    };
    
    /**
    * Enables or disables the crossing-runners button as appropriate.
    */
    Viewer.prototype.enableOrDisableCrossingRunnersButton = function () {
        enableControl(this.crossingRunnersButton, this.selection.isSingleRunnerSelected());
    };
    
    /**
    * Updates the state of the viewer to reflect query-string arguments parsed.
    * @param {Object} parsedQueryString - Parsed query-string object.
    */
    Viewer.prototype.updateFromQueryString = function (parsedQueryString) {
        if (parsedQueryString.classes === null) {
            this.initClasses([0]);
        } else {
            this.initClasses(parsedQueryString.classes);
        }
        
        if (parsedQueryString.view !== null) {
            this.chartTypeSelector.setChartType(parsedQueryString.view);
            this.selectChartType(parsedQueryString.view);
        }
        
        if (parsedQueryString.compareWith !== null) {
            this.comparisonSelector.setComparisonType(parsedQueryString.compareWith.index, parsedQueryString.compareWith.runner);
        }
        
        if (parsedQueryString.selected !== null) {
            this.selection.setSelectedIndexes(parsedQueryString.selected);
        }
        
        if (parsedQueryString.stats !== null) {
            this.statisticsSelector.setVisibleStatistics(parsedQueryString.stats);
        }
        
        if (parsedQueryString.showOriginal && this.ageClassSet.hasDubiousData()) {
            this.originalDataSelector.selectOriginalData();
            this.selectOriginalOrRepairedData(true);
        }
    };
    
    /**
    * Sets the default selected class.
    */
    Viewer.prototype.setDefaultSelectedClass = function () {
        this.initClasses([0]);
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
    * Reads in the data in the given string and starts SplitsBrowser.
    * @param {String} data - String containing the data to read.
    * @param {Object|String|HTMLElement|undefined} options - Optional object
    *     containing various options to SplitsBrowser.  It can also be used for
    *     an HTML element that forms a 'banner' across the top of the page.
    *     This element can be specified by a CSS selector for the element, or
    *     the HTML element itself, although this behaviour is deprecated.
    */
    SplitsBrowser.readEvent = function (data, options) {
        var eventData;
        try {
            eventData = parseEventData(data);
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
            
            if (typeof options === "string") {
                // Deprecated; support the top-bar specified only as a
                // string.
                options = {topBar: options};
            }
            
            eventData.determineTimeLosses();
            
            var viewer = new Viewer(options);
            viewer.buildUi();
            viewer.setEvent(eventData);
            
            var queryString = document.location.search;
            if (queryString !== null && queryString.length > 0) {
                var parsedQueryString = parseQueryString(queryString, eventData);
                viewer.updateFromQueryString(parsedQueryString);
            } else {
                viewer.setDefaultSelectedClass();
            }

            viewer.drawChart();
            viewer.registerChangeHandlers();
        }
    };
    
    /**
    * Handles an asynchronous callback that fetched event data, by parsing the
    * data and starting SplitsBrowser.
    * @param {String} data - The data returned from the AJAX request.
    * @param {String} status - The status of the request.
    * @param {Object|String|HTMLElement|undefined} options - Optional object
    *     containing various options to SplitsBrowser.  It can also be used for
    *     an HTML element that forms a 'banner' across the top of the page.
    *     This element can be specified by a CSS selector for the element, or
    *     the HTML element itself, although this behaviour is deprecated.
    */
    function readEventData(data, status, options) {
        if (status === "success") {
            SplitsBrowser.readEvent(data, options);
        } else {
            showLoadFailureMessage("LoadFailedStatusNotSuccess", {"$$STATUS$$": status});
        }
    }
    
    /**
    * Handles the failure to read an event.
    * @param {jQuery.jqXHR} jqXHR - jQuery jqXHR object.
    * @param {String} textStatus - The text status of the request.
    * @param {String} errorThrown - The error message returned from the server.
    */
    function readEventDataError(jqXHR, textStatus, errorThrown) {
        showLoadFailureMessage("LoadFailedReadError", {"$$ERROR$$": errorThrown});
    }

    /**
    * Loads the event data in the given URL and starts SplitsBrowser.
    * @param {String} eventUrl - The URL that points to the event data to load.
    * @param {Object|String|HTMLElement|undefined} options - Optional object
    *     containing various options to SplitsBrowser.  It can also be used for
    *     an HTML element that forms a 'banner' across the top of the page.
    *     This element can be specified by a CSS selector for the element, or
    *     the HTML element itself, although this behaviour is deprecated.
    */
    SplitsBrowser.loadEvent = function (eventUrl, options) {
        $.ajax({
            url: eventUrl,
            data: "",
            success: function (data, status) { readEventData(data, status, options); },
            dataType: "text",
            error: readEventDataError
        });
    };    
})();
