"use strict";

var _TEXT_SIZE_SHIM_ID = "sb-text-size-shim";
var _TEXT_SIZE_SHIM_ID_SELECTOR = "#" + _TEXT_SIZE_SHIM_ID;

var _CHART_SVG_ID = "chart";
var _CHART_SVG_ID_SELECTOR = "#" + _CHART_SVG_ID;

var margin = { top: 20, right: 20, bottom: 30, left: 50 };

var legendLineWidth = 10;

var colours = [
    "red", "blue", "green", "black", "#CC0066", "#000099", "#FFCC00", "#996600",
    "#9900FF", "#CCCC00", "#FFFF66",  "#CC6699", "#99FF33", "#3399FF",
    "#CC33CC", "#33FFFF", "#FF00FF"
];

var backgroundColour1 = '#EEEEEE';
var backgroundColour2 = '#DDDDDD';

/**
* A chart object in a window.
* @constructor
* @param {HTMLElement} parent - The parent object to create the element within.
*/
SplitsBrowser.Charts.Chart = function (parent) {
    this.parent = parent;

    this.xScale = null;
    this.yScale = null;
    this.yScaleMinutes = null;
    this.overallWidth = -1;
    this.overallHeight = -1;
    this.contentWidth = -1;
    this.contentHeight = -1;
    this.numControls = -1;
    this.selectedIndexes = [];
    this.names = [];

    this.svg = d3.select(this.parent).append("svg")
                                     .attr("id", _CHART_SVG_ID)
                                     .append("g")
                                     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add an invisible text element used for determining text size.
    this.svg.append("text").attr("fill", "transparent").attr("id", _TEXT_SIZE_SHIM_ID);
};

/**
* Returns a tick-formatting function that formats the label of a tick on the
* top X-axis.
*
* The function returned is suitable for use with the D3 axis.tickFormat method.
* This label is "S" for index 0 (the start), "F" for the finish, and
* the control number for intermediate controls.
*
* @returns {function} Tick-formatting function.
*/
SplitsBrowser.Charts.Chart.prototype.getTickFormatter = function () {
    var outerThis = this;
    return function (value, idx) {
        return (idx == 0) ? "S" : ((idx == outerThis.numControls + 1) ? "F" : idx.toString());
    };
}

/**
* Get the width of a piece of text.
* @param {string} text - The piece of text to measure the width of.
* @returns {Number} The width of the piece of text, in pixels. 
*/
SplitsBrowser.Charts.Chart.prototype.getTextWidth = function (text) {
    return d3.select(_TEXT_SIZE_SHIM_ID_SELECTOR).text(text).node().getBBox().width;
};

/**
* Gets the height of a piece of text.
*
* @param {string} text - The piece of text to measure the height of.
* @returns {Number} The height of the piece of text, in pixels.
*/
SplitsBrowser.Charts.Chart.prototype.getTextHeight = function (text) {
    return d3.select(_TEXT_SIZE_SHIM_ID_SELECTOR).text(text).node().getBBox().height;
};

/**
* Return the maximum width of the end-text shown to the right of the graph.
*
* This function considers only the competitors whose indexes are in the
* list given.  This method returns zero if the list is empty.
* @returns {Number} Maximum width of text, in pixels.
*/
SplitsBrowser.Charts.Chart.prototype.getMaxGraphEndTextWidth = function () {
    if (this.selectedIndexes.length == 0 || this.names.length == 0) {
        // No competitors selected or no names yet.  Avoid problems caused
        // by trying to find the maximum of an empty array.
        return 0;
    } else {
        var outerThis = this;
        var widths = this.names.map(function (name) { return outerThis.getTextWidth(name); });
        return d3.max(widths);
    }
};

/**
* Creates the X and Y scales necessary for the chart and its axes.
* @param {object} chartData - Chart data object.
*/
SplitsBrowser.Charts.Chart.prototype.createScales = function (chartData) {
    this.xScale = d3.scale.linear().domain(chartData.xExtent).range([0, this.contentWidth]);
    this.yScale = d3.scale.linear().domain(chartData.yExtent).range([0, this.contentHeight]);
    this.yScaleMinutes = d3.scale.linear().domain([chartData.yExtent[0] / 60, chartData.yExtent[1] / 60]).range([0, this.contentHeight]);
};

/**
* Draw the background rectangles that indicate sections of the course
* between controls.
* @param {Array} cumTimes - List of cumulative times of the 'reference'
*                           competitor, in seconds.
*/
SplitsBrowser.Charts.Chart.prototype.drawBackgroundRectangles = function (cumTimes) {
    var rects = this.svg.selectAll("rect")
                        .data(d3.range(this.numControls + 1))

    var outerThis = this;

    rects.enter().append("rect");

    rects.attr("x", function (index) { return outerThis.xScale(cumTimes[index]); })
            .attr("y", 0)
            .attr("width", function (index) { return outerThis.xScale(cumTimes[index + 1] - cumTimes[index]) })
            .attr("height", this.contentHeight)
            .attr("fill", function (index) { return (index % 2 == 0) ? backgroundColour1 : backgroundColour2; });

    rects.exit().remove();
};

/**
* Draw the chart axes.
* @param {Array} cumTimes - Array of cumulative times of the 'reference' competitor, in seconds.
*/
SplitsBrowser.Charts.Chart.prototype.drawAxes = function (cumTimes) {
    var xAxis = d3.svg.axis()
                    .scale(this.xScale)
                    .orient("top")
                    .tickFormat(this.getTickFormatter())
                    .tickValues(cumTimes);

    var yAxis = d3.svg.axis().scale(this.yScaleMinutes).orient("left");

    this.svg.selectAll("g.axis").remove();

    this.svg.append("g")
            .attr("class", "x axis")
            .call(xAxis);

    this.svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(this.contentHeight - 6))
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "start")
            .text("Time loss (min)");
};

/**
* Draw the lines on the chart.
* @param {Array} chartData - Array of chart data.
*/
SplitsBrowser.Charts.Chart.prototype.drawChartLines = function (chartData) {
    var outerThis = this;
    var lineFunctionGenerator = function (index) {
        return d3.svg.line()
                        .x(function (d) { return outerThis.xScale(d.x); })
                        .y(function (d) { return outerThis.yScale(d.ys[index]); })
                        .interpolate("linear");
    };

    var graphLines = this.svg.selectAll("path.graphLine")
                                .data(d3.range(this.numLines));

    graphLines.enter()
                .append("path")
                .attr("class", "graphLine")
                .attr("stroke-width", 2)
                .attr("fill", "none");

    graphLines.attr("d", function (i) { return lineFunctionGenerator(i)(chartData.dataColumns); })
                .attr("stroke", function (i) { return colours[outerThis.selectedIndexes[i] % colours.length]; });

    graphLines.exit().remove();
};

/**
* Draw legend labels to the right of the chart.
* @param {object} chartData - The chart data that contains the final time offsets.
*/
SplitsBrowser.Charts.Chart.prototype.drawCompetitorLegendLabels = function (chartData) {
    var finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
    var outerThis = this;

    var currCompData = d3.range(this.numLines).map(function (i) {
        return {
            name: outerThis.names[i],
            textHeight: outerThis.getTextHeight(outerThis.names[i]),
            y: outerThis.yScale(finishColumn.ys[i]),
            colour: colours[outerThis.selectedIndexes[i] % colours.length]
        };
    });

    // Some ys may be too close to the previous one.  Adjust them downwards
    // as necessary.
    for (var i = 1; i < currCompData.length; ++i) {
        if (currCompData[i].y < currCompData[i - 1].y + currCompData[i - 1].textHeight) {
            currCompData[i].y = currCompData[i - 1].y + currCompData[i - 1].textHeight;
        }
    }

    var legendLines = this.svg.selectAll("line.competitorLegendLine").data(currCompData);
    legendLines.enter()
                .append("line")
                .attr("class", "competitorLegendLine")
                .attr("stroke-width", 2);

    legendLines.attr("x1", this.contentWidth + 1)
                .attr("y1", function (data) { return data.y; })
                .attr("x2", this.contentWidth + legendLineWidth + 1)
                .attr("y2", function (data) { return data.y; })
                .attr("stroke", function (data) { return data.colour; });

    legendLines.exit().remove();

    var labels = this.svg.selectAll("text.competitorLabel").data(currCompData);
    labels.enter()
            .append("text")
            .attr("class", "competitorLabel");

    labels.text(function (data) { return data.name; })
            .attr("x", this.contentWidth + legendLineWidth + 2)
            .attr("y", function (data) { return data.y + data.textHeight / 4; });

    labels.exit().remove();
};

/**
* Adjusts the computed values for the content size of the chart.
*
* This method should be called after any of the following occur:
* (1) the overall size of the chart changes.
* (2) the currently-selected set of indexes changes
* (3) the chart data is set.
* If you find part of the chart is missing sometimes, chances are you've
* omitted a necessary call to this method.
*/
SplitsBrowser.Charts.Chart.prototype.adjustContentSize = function () {
    var maxTextWidth = this.getMaxGraphEndTextWidth();
    this.contentWidth = Math.max(this.overallWidth - margin.left - margin.right - maxTextWidth - (legendLineWidth + 2), 100);
    this.contentHeight = Math.max(this.overallHeight - margin.top - margin.bottom, 100);
};

/**
* Sets the overall size of the chart control, including margin, axes and legend labels.
* @param {Number} overallWidth - Overall width
* @param {Number} overallHeight - Overall height
*/
SplitsBrowser.Charts.Chart.prototype.setSize = function (overallWidth, overallHeight) {
    this.overallWidth = overallWidth;
    this.overallHeight = overallHeight;
    $(_CHART_SVG_ID_SELECTOR).width(overallWidth).height(overallHeight);
    this.adjustContentSize();
};

/**
* Draws the chart.
* @param {object} chartData - Data for all of the currently-visible
*                 competitors.
* @param {Array} cumTimes - Array of cumulative times of the 'reference'.
* @param {Array} selectedIndexes - Array of indexes of selected competitors
*                (0 in this array means the first competitor is selected, 1
*                means the second is selected, and so on.)
*/
SplitsBrowser.Charts.Chart.prototype.drawChart = function (chartData, cumTimes, selectedIndexes) {
    this.numControls = chartData.numControls;
    this.names = chartData.competitorNames;
    this.numLines = this.names.length;
    this.selectedIndexes = selectedIndexes;
    this.adjustContentSize();
    this.createScales(chartData);
    this.drawBackgroundRectangles(cumTimes);
    this.drawAxes(cumTimes);
    this.drawChartLines(chartData);
    this.drawCompetitorLegendLabels(chartData);
};
