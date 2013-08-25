/* global window, document, $, SplitsBrowser, d3, setTimeout, clearTimeout */

(function () {
"use strict";
// Delay in milliseconds between a resize event being triggered and the
// page responding to it.
// (Resize events tend to come more than one at a time; if a resize event
// comes in while a previous event is waiting, the previous event is
// cancelled.)
var RESIZE_DELAY_MS = 100;

var currentResizeTimeout = null;

var courses = null;
var currentResult = null;
var currentIndexes = null;

var selection = null;
var courseSelector = null;
var statisticsSelector = null;
var competitorListBox = null;
var chart = null;
var topPanel = null;
var mainPanel = null;

var _TOP_PANEL_ID = "topPanel";
var _TOP_PANEL_ID_SELECTOR = "#" + _TOP_PANEL_ID;

var _COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
var _COMPETITOR_LIST_CONTAINER_ID_SELECTOR = "#" + _COMPETITOR_LIST_CONTAINER_ID;

var _ALL_OR_NONE_BUTTONS_PANEL_ID = "allOrNoneButtonsPanel";
var _ALL_OR_NONE_BUTTONS_PANEL_ID_SELECTOR = "#" + _ALL_OR_NONE_BUTTONS_PANEL_ID;


/**
* Construct the UI inside the HTML body.
*/
function buildUi() {
    var body = d3.select("body");
    
    var topPanel = body.append("div")
                       .attr("id", _TOP_PANEL_ID);
                       
    courseSelector = new SplitsBrowser.Controls.CourseSelector(topPanel.node());
    courseSelector.registerChangeHandler(selectCourse);
    
    statisticsSelector = new SplitsBrowser.Controls.StatisticsSelector(topPanel.node());
    
    var mainPanel = body.append("div");
    
    var competitorListContainer = mainPanel.append("div")
                                           .attr("id", _COMPETITOR_LIST_CONTAINER_ID);
                                           
    var buttonsContainer = competitorListContainer.append("div")
                                                  .attr("id", _ALL_OR_NONE_BUTTONS_PANEL_ID);
                                     
    buttonsContainer.append("button")
                    .text("All")
                    .on("click", selectAll);
                    
    buttonsContainer.append("button")
                    .text("None")
                    .on("click", selectNone);
                                                       
    competitorListBox = new SplitsBrowser.Controls.CompetitorListBox(competitorListContainer.node());
    chart = new SplitsBrowser.Controls.Chart(mainPanel.node());
}

/**
* Select all of the competitors.
*/
function selectAll() {
    selection.selectAll();
}

/**
* Select none of the competitors.
*/
function selectNone() {
    selection.selectNone();
}

/**
 * Handle a resize of the window.
 */
function handleWindowResize() {
    if (currentResizeTimeout !== null) {
        clearTimeout(currentResizeTimeout);
    }

    currentResizeTimeout = setTimeout(function () { currentResizeTimeout = null; drawChart(); }, RESIZE_DELAY_MS);
}

/**
* Draw the chart using the current data.
*/
function drawChart() {

    var fastestTime = currentResult.getFastestTime();
    var chartData = currentResult.getChartData(fastestTime, currentIndexes);
    var cumTimes = fastestTime.getCumulativeTimes();
    var splitInfo = new SplitsBrowser.Model.CompetitorSplitInfo(currentResult);

    var selectionChangeHandler = null;
    var statisticsChangeHandler = null;
    
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    
    var currentVisibleStatistics = statisticsSelector.getVisibleStatistics();

    competitorListBox.setCompetitorList(currentResult.competitorData);

    var topPanelHeight = $(_TOP_PANEL_ID_SELECTOR).height();
    
    // Subtract some values to avoid scrollbars appearing.
    var chartWidth = windowWidth - 18 - competitorListBox.width() - 40;
    var chartHeight = windowHeight - 19 - topPanelHeight;

    chart.setSize(chartWidth, chartHeight);
    chart.drawChart(chartData, splitInfo, cumTimes, currentIndexes, currentVisibleStatistics);

    if (selectionChangeHandler !== null) {
        selection.deregisterChangeHandler(selectionChangeHandler);
    }
    
    if (statisticsChangeHandler !== null) {
        statisticsSelector.deregisterChangeHandler(statisticsChangeHandler);
    }

    
    var redraw = function() {
        chartData = currentResult.getChartData(fastestTime, currentIndexes);
        chart.drawChart(chartData, splitInfo, cumTimes, currentIndexes, currentVisibleStatistics);
    };
    
    selectionChangeHandler = function (indexes) {
        currentIndexes = indexes;
        redraw();
    };

    selection.registerChangeHandler(selectionChangeHandler);
    
    statisticsChangeHandler = function (visibleStatistics) {
        currentVisibleStatistics = visibleStatistics;
        redraw();
    };
    
    statisticsSelector.registerChangeHandler(statisticsChangeHandler);

    $("body").height(windowHeight - 19 - topPanelHeight);
    $(_COMPETITOR_LIST_CONTAINER_ID_SELECTOR).height(windowHeight - 19 - $(_ALL_OR_NONE_BUTTONS_PANEL_ID_SELECTOR).height() - topPanelHeight);
}

/**
* Change the graph to show the course with the given index.
* @param {Number} index - The (zero-based) index of the course.
*/
function selectCourse(index) {
    if (0 <= index && index < courses.length) {
        if (selection !== null) {
            selection.selectNone();
        }
        currentIndexes = [];
        currentResult = courses[index];
        courseSelector.setCourses(courses);
        selection = new SplitsBrowser.Model.CompetitorSelection(currentResult.competitorData.length);
        competitorListBox.setSelection(selection);
        drawChart();
    }
}

/**
* JQuery AJAX callback to handle the request to get some data and parse it.
*/
function readEventData(data, status, jqXHR) {
    if (status === "success") {
        courses = SplitsBrowser.Input.CSV.parseEventData(data);
        selectCourse(0);
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

$(document).ready(buildUi);
$(document).ready(testReadSplits('data/eventdata'));

$(window).resize(handleWindowResize);
})();