(function (){
    "use strict";

    // ID of the hidden text-size element.
    // Must match that used in styles.css.
    var TEXT_SIZE_ELEMENT_ID = "sb-text-size-element";
    
    // ID of the chart.
    // Must match that used in styles.css
    var CHART_SVG_ID = "chart";
    
    // X-offset in pixels between the mouse and the popup that opens.
    var CHART_POPUP_X_OFFSET = 10;
    
    // The maximum number of fastest splits to show when the popup is open.
    var MAX_FASTEST_SPLITS = 10;
    
    var MARGIN = { top: 20, right: 20, bottom: 30, left: 50 };

    var legendLineWidth = 10;
    
    // Minimum distance between a Y-axis tick label and a competitor's start
    // time, in pixels.
    var MIN_COMPETITOR_TICK_MARK_DISTANCE = 10;
    
    // The number that identifies the left mouse button in a jQuery event.
    var JQUERY_EVENT_LEFT_BUTTON = 1;

    var SPACER = "\xa0\xa0\xa0\xa0";

    var colours = [
        "#FF0000", "#4444FF", "#00FF00", "#000000", "#CC0066", "#000099",
        "#FFCC00", "#884400", "#9900FF", "#CCCC00", "#888800", "#CC6699",
        "#00DD00", "#3399FF", "#BB00BB", "#00DDDD", "#FF00FF", "#0088BB",
        "#888888", "#FF99FF", "#55BB33"
    ];

    /**
    * Format a time and a rank as a string, with the split time in mm:ss or h:mm:ss
    * as appropriate.
    * @param {Number|null} time - The time, in seconds, or null.
    * @param {Number|null} rank - The rank, or null.
    * @returns Time and rank formatted as a string.
    */
    function formatTimeAndRank(time, rank) {
        return SPACER + SplitsBrowser.formatTime(time) + " (" + ((rank === null) ? "-" : rank) + ")";
    }
    
    /**
    * Formats and returns a competitor's name and optional suffix.
    * @param {String} name - The name of the competitor.
    * @param {String} suffix - The optional suffix of the competitor (may be an
    *      empty string to indicate no suffix).
    * @return Competitor name and suffix, formatted.
    */
    function formatNameAndSuffix(name, suffix) {
        return (suffix === "") ? name : name + " (" + suffix + ")";
    }

    /**
    * A chart object in a window.
    * @constructor
    * @param {HTMLElement} parent - The parent object to create the element within.
    */
    SplitsBrowser.Controls.Chart = function (parent) {
        this.parent = parent;

        this.xScale = null;
        this.yScale = null;
        this.overallWidth = -1;
        this.overallHeight = -1;
        this.contentWidth = -1;
        this.contentHeight = -1;
        this.numControls = -1;
        this.selectedIndexes = [];
        this.currentCompetitorData = null;
        this.isPopupOpen = false;
        
        // Indexes of the currently-selected competitors, in the order that
        // they appear in the list of labels.
        this.selectedIndexesOrderedByLastYValue = [];
        this.referenceCumTimes = [];
        this.fastestCumTimes = [];
        
        this.isMouseIn = false;
        
        // The position the mouse cursor is currently over, or null for not over
        // the charts.
        this.currentControlIndex = null;
        
        this.controlLine = null;

        this.svg = d3.select(this.parent).append("svg")
                                         .attr("id", CHART_SVG_ID);

        this.svgGroup = this.svg.append("g");
        this.setLeftMargin(MARGIN.left);

        var outerThis = this;
        var mousemoveHandler = function (event) { outerThis.onMouseMove(event); };
        var mouseupHandler = function (event) { outerThis.onMouseUp(event); };
        var mousedownHandler = function (event) { outerThis.onMouseDown(event); };
        $(this.svg.node()).mouseenter(function (event) { outerThis.onMouseEnter(event); })
                          .mousemove(mousemoveHandler)
                          .mouseleave(function (event) { outerThis.onMouseLeave(event); })
                          .mousedown(mousedownHandler)
                          .mouseup(mouseupHandler);

        // Add an invisible text element used for determining text size.
        this.textSizeElement = this.svg.append("text").attr("fill", "transparent")
                                                      .attr("id", TEXT_SIZE_ELEMENT_ID);
        
        var handlers = {"mousemove": mousemoveHandler, "mousedown": mousedownHandler, "mouseup": mouseupHandler};
        this.popup = new SplitsBrowser.Controls.ChartPopup(parent, handlers);
    };

    /**
    * Handle the mouse entering the chart.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseEnter = function() {
        this.isMouseIn = true;
    };
    
    /**
    * Sets the left margin of the chart.
    * @param {Number} leftMargin - The left margin of the chart.
    */
    SplitsBrowser.Controls.Chart.prototype.setLeftMargin = function (leftMargin) {
        this.currentLeftMargin = leftMargin;
        this.svgGroup.attr("transform", "translate(" + this.currentLeftMargin + "," + MARGIN.top + ")");
    };

    /**
    * Handle a mouse movement.
    * @param {EventObject} event - The event object.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseMove = function(event) {
        if (this.isMouseIn && this.xScale !== null) {
            var svgNodeAsJQuery = $(this.svg.node());
            var offset = svgNodeAsJQuery.offset();
            var xOffset = event.pageX - offset.left;
            var yOffset = event.pageY - offset.top;
            
            if (this.currentLeftMargin <= xOffset && xOffset < svgNodeAsJQuery.width() - MARGIN.right && 
                MARGIN.top <= yOffset && yOffset < svgNodeAsJQuery.height() - MARGIN.bottom) {
                // In the chart.
                // Get the time offset that the mouse is currently over.
                var chartX = this.xScale.invert(xOffset - this.currentLeftMargin);
                var bisectIndex = d3.bisect(this.referenceCumTimes, chartX);
                
                // bisectIndex is the index at which to insert chartX into
                // referenceCumTimes in order to keep the array sorted.  So if
                // this index is N, the mouse is between N - 1 and N.  Find
                // which is nearer.
                var controlIndex;
                if (bisectIndex >= this.referenceCumTimes.length) {
                    // Off the right-hand end, use the finish.
                    controlIndex = this.numControls + 1;
                } else if (bisectIndex === 1) {
                    // Before control 1, so use control 1 even if we are closer
                    // to the start.
                    controlIndex = 1;
                } else {
                    var diffToNext = Math.abs(this.referenceCumTimes[bisectIndex] - chartX);
                    var diffToPrev = Math.abs(chartX - this.referenceCumTimes[bisectIndex - 1]);
                    controlIndex = (diffToPrev < diffToNext) ? bisectIndex - 1 : bisectIndex;
                }
                
                if (this.currentControlIndex === null || this.currentControlIndex !== controlIndex) {
                    // The control line has appeared for ths first time or has moved, so redraw it.
                    this.removeControlLine();
                    this.drawControlLine(controlIndex);
                }
                
                if (this.popup.isShown()) {
                    this.popup.setSelectedClasses(this.getFastestSplits());
                    this.popup.setLocation(event.pageX + 10, event.pageY - this.popup.height() / 2);
                }
                
            } else {
                // In the SVG element but outside the chart area.
                this.removeControlLine();
                this.popup.hide();
            }
        }
    };

    /**
    * Returns the fastest splits to the current control.
    * @return {Array} Array of fastest-split data.
    */
    SplitsBrowser.Controls.Chart.prototype.getFastestSplits = function () {
        // There's no split to the start, so if the current control is the
        // start, show the statistics for control 1 instead.
        return this.ageClassSet.getFastestSplitsTo(MAX_FASTEST_SPLITS, this.currentControlIndex);
    };
     
    /**
    * Handle the mouse leaving the chart.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseLeave = function() {
        var outerThis = this;
        // Check that the mouse hasn't entered the popup.
        // It seems that the mouseleave event for the chart is sent before the
        // mouseenter event for the popup, so we use a timeout to check a short
        // time later whether the mouse has left the chart and the popup.
        // This is only necessary for IE9 and IE10; other browsers support
        // "pointer-events: none" in CSS so the popup never gets any mouse
        // events.
        setTimeout(function() {
            if (!outerThis.popup.isMouseIn()) {
                outerThis.isMouseIn = false;
                outerThis.removeControlLine();
            }
        }, 1);
    };
    
    /**
    * Handles a mouse button being pressed over the chart.
    * @param {jQuery.Event} event - jQuery event object.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseDown = function (event) {
        if (this.isMouseIn && event.which === JQUERY_EVENT_LEFT_BUTTON) {
            // Left button pressed.
            this.popup.setSelectedClasses(this.getFastestSplits());
            this.popup.show(event.pageX + CHART_POPUP_X_OFFSET, event.pageY - this.popup.height() / 2);
        }
    };
    
    /**
    * Handles a mouse button being pressed over the chart.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseUp = function () {
        this.popup.hide();
    };

    /**
    * Draw a 'control line'.  This is a vertical line running the entire height of
    * the chart, at one of the controls.
    * @param {Number} controlIndex - The index of the control at which to draw the
    *                                control line.
    */
    SplitsBrowser.Controls.Chart.prototype.drawControlLine = function(controlIndex) {
        this.currentControlIndex = controlIndex;
        this.updateCompetitorStatistics();    
        var xPosn = this.xScale(this.referenceCumTimes[controlIndex]);
        this.controlLine = this.svgGroup.append("line")
                                        .attr("x1", xPosn)
                                        .attr("y1", 0)
                                        .attr("x2", xPosn)
                                        .attr("y2", this.contentHeight)
                                        .attr("class", "controlLine")
                                        .node();
    };

    /**
    * Remove any previously-drawn control line.  If no such line existed, nothing
    * happens.
    */
    SplitsBrowser.Controls.Chart.prototype.removeControlLine = function() {
        this.currentControlIndex = null;
        this.updateCompetitorStatistics();
        if (this.controlLine !== null) {
            d3.select(this.controlLine).remove();
            this.controlLine = null;
        }
    };

    /**
    * Returns an array of the the times that the selected competitors are
    * behind the fastest time at the given control.
    * @param {Number} controlIndex - Index of the given control.
    * @param {Array} indexes - Array of indexes of selected competitors.
    * @return {Array} Array of times in seconds that the given competitors are
    *     behind the fastest time.
    */
    SplitsBrowser.Controls.Chart.prototype.getTimesBehindFastest = function (controlIndex, indexes) {
        var selectedCompetitors = indexes.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        var fastestSplit = this.fastestCumTimes[controlIndex] - this.fastestCumTimes[controlIndex - 1];
        var timesBehind = selectedCompetitors.map(function (comp) { var compSplit = comp.getSplitTimeTo(controlIndex); return (compSplit === null) ? null : compSplit - fastestSplit; });
        return timesBehind;
    };
    
    /**
    * Updates the statistics text shown after the competitors.
    */
    SplitsBrowser.Controls.Chart.prototype.updateCompetitorStatistics = function() {
        var selectedCompetitors = this.selectedIndexesOrderedByLastYValue.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        var labelTexts = selectedCompetitors.map(function (comp) { return formatNameAndSuffix(comp.name, comp.getSuffix()); });
        
        if (this.currentControlIndex !== null && this.currentControlIndex > 0) {
            if (this.visibleStatistics[0]) {
                var cumTimes = selectedCompetitors.map(function (comp) { return comp.getCumulativeTimeTo(this.currentControlIndex); }, this);
                var cumRanks = selectedCompetitors.map(function (comp) { return comp.getCumulativeRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, cumTimes, cumRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
                           
            if (this.visibleStatistics[1]) {
                var splitTimes = selectedCompetitors.map(function (comp) { return comp.getSplitTimeTo(this.currentControlIndex); }, this);
                var splitRanks = selectedCompetitors.map(function (comp) { return comp.getSplitRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, splitTimes, splitRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
             
            if (this.visibleStatistics[2]) {
                var timesBehind = this.getTimesBehindFastest(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                labelTexts = d3.zip(labelTexts, timesBehind)
                               .map(function(pair) { return pair[0] + SPACER + SplitsBrowser.formatTime(pair[1]); });
            }
        }
        
        // Update the current competitor data.
        this.currentCompetitorData.forEach(function (data, index) { data.label = labelTexts[index]; });
        
        // This data is already joined to the labels; just update the text.
        d3.selectAll("text.competitorLabel").text(function (data) { return data.label; });
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
    SplitsBrowser.Controls.Chart.prototype.getTickFormatter = function () {
        var outerThis = this;
        return function (value, idx) {
            return (idx === 0) ? "S" : ((idx === outerThis.numControls + 1) ? "F" : idx.toString());
        };
    };

    /**
    * Get the width of a piece of text.
    * @param {string} text - The piece of text to measure the width of.
    * @returns {Number} The width of the piece of text, in pixels. 
    */
    SplitsBrowser.Controls.Chart.prototype.getTextWidth = function (text) {
        return this.textSizeElement.text(text).node().getBBox().width;
    };

    /**
    * Gets the height of a piece of text.
    *
    * @param {string} text - The piece of text to measure the height of.
    * @returns {Number} The height of the piece of text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getTextHeight = function (text) {
        return this.textSizeElement.text(text).node().getBBox().height;
    };

    /**
    * Return the maximum width of the end-text shown to the right of the graph.
    *
    * This function considers only the competitors whose indexes are in the
    * list given.  This method returns zero if the list is empty.
    * @returns {Number} Maximum width of text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxGraphEndTextWidth = function () {
        if (this.selectedIndexes.length === 0) {
            // No competitors selected.  Avoid problems caused by trying to
            // find the maximum of an empty array.
            return 0;
        } else {
            var nameWidths = this.selectedIndexes.map(function (index) {
                var comp = this.ageClassSet.allCompetitors[index];
                return this.getTextWidth(formatNameAndSuffix(comp.name, comp.getSuffix()));
            }, this);
            return d3.max(nameWidths) + this.determineMaxStatisticTextWidth();
        }
    };

    /**
    * Return the maximum width of a piece of time and rank text shown to the right
    * of each competitor 
    * @param {string} timeFuncName - Name of the function to call to get the time
                                     data.
    * @param {string} rankFuncName - Name of the function to call to get the rank
                                     data.
    * @returns {Number} Maximum width of split-time and rank text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxTimeAndRankTextWidth = function(timeFuncName, rankFuncName) {
        var maxTime = 0;
        var maxRank = 0;
        
        var selectedCompetitors = this.selectedIndexes.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        
        d3.range(1, this.numControls + 2).forEach(function (controlIndex) {
            var times = selectedCompetitors.map(function (comp) { return comp[timeFuncName](controlIndex); });
            maxTime = Math.max(maxTime, d3.max(times.filter(SplitsBrowser.isNotNull)));
            
            var ranks = selectedCompetitors.map(function (comp) { return comp[rankFuncName](controlIndex); });
            maxRank = Math.max(maxRank, d3.max(ranks.filter(SplitsBrowser.isNotNull)));
        });
        
        var text = formatTimeAndRank(maxTime, maxRank);
        return this.getTextWidth(text);
    };

    /**
    * Return the maximum width of the split-time and rank text shown to the right
    * of each competitor 
    * @returns {Number} Maximum width of split-time and rank text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxSplitTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getSplitTimeTo", "getSplitRankTo");
    };

    /**
    * Return the maximum width of the cumulative time and cumulative-time rank text
    * shown to the right of each competitor 
    * @returns {Number} Maximum width of cumulative time and cumulative-time rank text, in
    *                   pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxCumulativeTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getCumulativeTimeTo", "getCumulativeRankTo");
    };

    /**
    * Return the maximum width of the behind-fastest time shown to the right of
    * each competitor 
    * @returns {Number} Maximum width of behind-fastest time rank text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxTimeBehindFastestWidth = function() {
        var maxTime = 0;
        
        for (var controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
            var times = this.getTimesBehindFastest(controlIndex, this.selectedIndexes);
            maxTime = Math.max(maxTime, d3.max(times.filter(SplitsBrowser.isNotNull)));
        }
        
        return this.getTextWidth(SPACER + SplitsBrowser.formatTime(maxTime));
    };

    /**
    * Determines the maximum width of the statistics text at the end of the competitor.
    * @returns {Number} Maximum width of the statistics text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.determineMaxStatisticTextWidth = function() {
        var maxWidth = 0;
        if (this.visibleStatistics[0]) {
            maxWidth += this.getMaxCumulativeTimeAndRankTextWidth();
        }
        if (this.visibleStatistics[1]) {
            maxWidth += this.getMaxSplitTimeAndRankTextWidth();
        }
        if (this.visibleStatistics[2]) {
            maxWidth += this.getMaxTimeBehindFastestWidth();
        }
        
        return maxWidth;
    };
    
    /**
    * Determines the maximum width of all of the visible start time labels.
    * If none are presently visible, zero is returned.
    * @param {object} chartData - Object containing the chart data.
    * @return {Number} Maximum width of a start time label.
    */
    SplitsBrowser.Controls.Chart.prototype.determineMaxStartTimeLabelWidth = function (chartData) {
        var maxWidth;
        if (chartData.competitorNames.length > 0) {
            maxWidth = d3.max(chartData.competitorNames.map(function (name) { return this.getTextWidth("00:00:00 " + name); }, this));
        } else {
            maxWidth = 0;
        }
        
        return maxWidth;
    };

    /**
    * Creates the X and Y scales necessary for the chart and its axes.
    * @param {object} chartData - Chart data object.
    */
    SplitsBrowser.Controls.Chart.prototype.createScales = function (chartData) {
        this.xScale = d3.scale.linear().domain(chartData.xExtent).range([0, this.contentWidth]);
        this.yScale = d3.scale.linear().domain(chartData.yExtent).range([0, this.contentHeight]);
        this.xScaleMinutes = d3.scale.linear().domain([chartData.xExtent[0] / 60, chartData.xExtent[1] / 60]).range([0, this.contentWidth]);
    };

    /**
    * Draw the background rectangles that indicate sections of the course
    * between controls.
    */
    SplitsBrowser.Controls.Chart.prototype.drawBackgroundRectangles = function () {
        var rects = this.svgGroup.selectAll("rect")
                                 .data(d3.range(this.numControls + 1));

        var outerThis = this;

        rects.enter().append("rect");

        rects.attr("x", function (index) { return outerThis.xScale(outerThis.referenceCumTimes[index]); })
             .attr("y", 0)
             .attr("width", function (index) { return outerThis.xScale(outerThis.referenceCumTimes[index + 1] - outerThis.referenceCumTimes[index]); })
             .attr("height", this.contentHeight)
             .attr("class", function (index) { return (index % 2 === 0) ? "background1" : "background2"; });

        rects.exit().remove();
    };
    
    /**
    * Returns a function used to format tick labels on the Y-axis.
    *
    * If start times are to be shown (i.e. for the race graph), then the Y-axis
    * values are start times.  We format these as times, as long as there isn't
    * a competitor's start time too close to it.
    *
    * For other graph types, this method returns null, which tells d3 to use
    * its default tick formatter.
    * 
    * @param {object} chartData - The chart data to read start times from.
    */
    SplitsBrowser.Controls.Chart.prototype.determineYAxisTickFormatter = function (chartData) {
        if (this.showStartTimes) {
            // Assume column 0 of the data is the start times.
            // However, beware that there might not be any data.
            var startTimes = (chartData.dataColumns.length === 0) ? [] : chartData.dataColumns[0].ys;
            if (startTimes.length === 0) {
                // No start times - draw all tick marks.
                return function (time) { return SplitsBrowser.formatTime(time * 60); };
            } else {
                // Some start times are to be drawn - only draw tick marks if
                // they are far enough away from competitors.
                var yScale = this.yScale;
                return function (time) {
                    var nearestOffset = d3.min(startTimes.map(function (startTime) { return Math.abs(yScale(startTime) - yScale(time)); }));
                    return (nearestOffset >= MIN_COMPETITOR_TICK_MARK_DISTANCE) ? SplitsBrowser.formatTime(time * 60) : "";
                };
           }
        } else {
            // Use the default d3 tick formatter.
            return null;
        }
    };

    /**
    * Draw the chart axes.
    * @param {String} yAxisLabel - The label to use for the Y-axis.
    * @param {object} chartData - The chart data to use.
    */
    SplitsBrowser.Controls.Chart.prototype.drawAxes = function (yAxisLabel, chartData) {
    
        var tickFormatter = this.determineYAxisTickFormatter(chartData);
        
        var xAxis = d3.svg.axis()
                          .scale(this.xScale)
                          .orient("top")
                          .tickFormat(this.getTickFormatter())
                          .tickValues(this.referenceCumTimes);

        var yAxis = d3.svg.axis()
                          .scale(this.yScale)
                          .tickFormat(tickFormatter)
                          .orient("left");
                     
        var lowerXAxis = d3.svg.axis()
                               .scale(this.xScaleMinutes)
                               .orient("bottom");

        this.svgGroup.selectAll("g.axis").remove();

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .call(xAxis);

        this.svgGroup.append("g")
                     .attr("class", "y axis")
                     .call(yAxis)
                     .append("text")
                     .attr("transform", "rotate(-90)")
                     .attr("x", -(this.contentHeight - 6))
                     .attr("y", 6)
                     .attr("dy", ".71em")
                     .style("text-anchor", "start")
                     .text(yAxisLabel);

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .attr("transform", "translate(0," + this.contentHeight + ")")                     
                     .call(lowerXAxis)
                     .append("text")
                     .attr("x", 60)
                     .attr("y", -5)
                     .style("text-anchor", "start")
                     .text("Time (min)");
    };
    
    /**
    * Draw the lines on the chart.
    * @param {Array} chartData - Array of chart data.
    */
    SplitsBrowser.Controls.Chart.prototype.drawChartLines = function (chartData) {
        var outerThis = this;
        var lineFunctionGenerator = function (selCompIdx) {
            if (chartData.dataColumns.every(function (col) { return col.ys[selCompIdx] === null; })) {
                // This competitor's entire row is null, so there's no data to
                // draw.  d3 will report an error ('Error parsing d=""') if no
                // points on the line are defined, as will happen in this case,
                // so we substitute some dummy data instead.
                return d3.svg.line().x(-10000)
                                    .y(-10000);
            }
            else {
                return d3.svg.line()
                                .x(function (d) { return outerThis.xScale(d.x); })
                                .y(function (d) { return outerThis.yScale(d.ys[selCompIdx]); })
                                .defined(function (d) { return d.ys[selCompIdx] !== null; })
                                .interpolate("linear");
            }
        };

        var graphLines = this.svgGroup.selectAll("path.graphLine")
                                      .data(d3.range(this.numLines));

        graphLines.enter()
                  .append("path");

        graphLines.attr("d", function (selCompIdx) { return lineFunctionGenerator(selCompIdx)(chartData.dataColumns); })
                  .attr("stroke", function (selCompIdx) { return colours[outerThis.selectedIndexes[selCompIdx] % colours.length]; })
                  .attr("class", function (selCompIdx) { return "graphLine competitor" + outerThis.selectedIndexes[selCompIdx]; })
                  .on("mouseenter", function (selCompIdx) { outerThis.highlight(outerThis.selectedIndexes[selCompIdx]); })
                  .on("mouseleave", function () { outerThis.unhighlight(); });

        graphLines.exit().remove();
    };

    /**
    * Highlights the competitor with the given index.
    * @param {Number} competitorIdx - The index of the competitor to highlight.
    */
    SplitsBrowser.Controls.Chart.prototype.highlight = function (competitorIdx) {
        this.svg.selectAll("path.graphLine.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("line.competitorLegendLine.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("text.competitorLabel.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("text.startLabel.competitor" + competitorIdx).classed("selected", true);
    };

    /**
    * Removes any competitor-specific higlighting.
    */
    SplitsBrowser.Controls.Chart.prototype.unhighlight = function () {
        this.svg.selectAll("path.graphLine.selected").classed("selected", false);
        this.svg.selectAll("line.competitorLegendLine.selected").classed("selected", false);
        this.svg.selectAll("text.competitorLabel.selected").classed("selected", false);
        this.svg.selectAll("text.startLabel.selected").classed("selected", false);
    };

    /**
    * Draws the start-time labels for the currently-selected competitors.
    * @param {object} chartData - The chart data that contains the start offsets.
    */ 
    SplitsBrowser.Controls.Chart.prototype.drawCompetitorStartTimeLabels = function (chartData) {
        var startColumn = chartData.dataColumns[0];
        var outerThis = this;
        
        var startLabels = this.svgGroup.selectAll("text.startLabel").data(this.selectedIndexes);
        
        startLabels.enter().append("text");
        
        startLabels.attr("x", -7)
                   .attr("y", function (_compIndex, selCompIndex) { return outerThis.yScale(startColumn.ys[selCompIndex]) + outerThis.getTextHeight(chartData.competitorNames[selCompIndex]) / 4; })
                   .attr("class", function (compIndex) { return "startLabel competitor" + compIndex; })
                   .on("mouseenter", function (compIndex) { outerThis.highlight(compIndex); })
                   .on("mouseleave", function () { outerThis.unhighlight(); })
                   .text(function (_compIndex, selCompIndex) { return SplitsBrowser.formatTime(startColumn.ys[selCompIndex] * 60) + " " + chartData.competitorNames[selCompIndex]; });
        
        startLabels.exit().remove();
    };
    
    /**
    * Removes all of the competitor start-time labels from the chart.
    */ 
    SplitsBrowser.Controls.Chart.prototype.removeCompetitorStartTimeLabels = function () {
        this.svgGroup.selectAll("text.startLabel").remove();
    };

    /**
    * Draw legend labels to the right of the chart.
    * @param {object} chartData - The chart data that contains the final time offsets.
    */
    SplitsBrowser.Controls.Chart.prototype.drawCompetitorLegendLabels = function (chartData) {
        
        if (chartData.dataColumns.length === 0) {
            this.currentCompetitorData = [];
        } else {
            var finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
            this.currentCompetitorData = d3.range(this.numLines).map(function (i) {
                var competitorIndex = this.selectedIndexes[i];
                var name = this.ageClassSet.allCompetitors[competitorIndex].name;
                return {
                    label: formatNameAndSuffix(name, this.ageClassSet.allCompetitors[competitorIndex].getSuffix()),
                    textHeight: this.getTextHeight(name),
                    y: (finishColumn.ys[i] === null) ? null : this.yScale(finishColumn.ys[i]),
                    colour: colours[competitorIndex % colours.length],
                    index: competitorIndex
                };
            }, this);
            
            // Draw the mispunchers at the bottom of the chart, with the last
            // one of them at the bottom.
            var lastMispuncherY = null;
            for (var selCompIdx = this.currentCompetitorData.length - 1; selCompIdx >= 0; selCompIdx -= 1) {
                if (this.currentCompetitorData[selCompIdx].y === null) {
                    this.currentCompetitorData[selCompIdx].y = (lastMispuncherY === null) ? this.contentHeight : lastMispuncherY - this.currentCompetitorData[selCompIdx].textHeight;
                    lastMispuncherY = this.currentCompetitorData[selCompIdx].y;
                }
            }
        }
        
        // Sort by the y-offset values, which doesn't always agree with the end
        // positions of the competitors.
        this.currentCompetitorData.sort(function (a, b) { return a.y - b.y; });
        
        this.selectedIndexesOrderedByLastYValue = this.currentCompetitorData.map(function (comp) { return comp.index; });

        // Some ys may be too close to the previous one.  Adjust them downwards
        // as necessary.
        for (var i = 1; i < this.currentCompetitorData.length; i += 1) {
            if (this.currentCompetitorData[i].y < this.currentCompetitorData[i - 1].y + this.currentCompetitorData[i - 1].textHeight) {
                this.currentCompetitorData[i].y = this.currentCompetitorData[i - 1].y + this.currentCompetitorData[i - 1].textHeight;
            }
        }

        var legendLines = this.svgGroup.selectAll("line.competitorLegendLine").data(this.currentCompetitorData);
        legendLines.enter()
                   .append("line");

        var outerThis = this;
        legendLines.attr("x1", this.contentWidth + 1)
                   .attr("y1", function (data) { return data.y; })
                   .attr("x2", this.contentWidth + legendLineWidth + 1)
                   .attr("y2", function (data) { return data.y; })
                   .attr("stroke", function (data) { return data.colour; })
                   .attr("class", function (data) { return "competitorLegendLine competitor" + data.index; })
                   .on("mouseenter", function (data) { outerThis.highlight(data.index); })
                   .on("mouseleave", function () { outerThis.unhighlight(); });

        legendLines.exit().remove();

        var labels = this.svgGroup.selectAll("text.competitorLabel").data(this.currentCompetitorData);
        labels.enter()
              .append("text");

        labels.attr("x", this.contentWidth + legendLineWidth + 2)
              .attr("y", function (data) { return data.y + data.textHeight / 4; })
              .attr("class", function (data) { return "competitorLabel competitor" + data.index; })
              .on("mouseenter", function (data) { outerThis.highlight(data.index); })
              .on("mouseleave", function () { outerThis.unhighlight(); })
              .text(function (data) { return data.label; });

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
    SplitsBrowser.Controls.Chart.prototype.adjustContentSize = function () {
        var maxTextWidth = this.getMaxGraphEndTextWidth();
        this.setLeftMargin(this.maxStartTimeLabelWidth + MARGIN.left);
        this.contentWidth = Math.max(this.overallWidth - this.currentLeftMargin - MARGIN.right - maxTextWidth - (legendLineWidth + 2), 100);
        this.contentHeight = Math.max(this.overallHeight - MARGIN.top - MARGIN.bottom, 100);
    };

    /**
    * Sets the overall size of the chart control, including margin, axes and legend labels.
    * @param {Number} overallWidth - Overall width
    * @param {Number} overallHeight - Overall height
    */
    SplitsBrowser.Controls.Chart.prototype.setSize = function (overallWidth, overallHeight) {
        this.overallWidth = overallWidth;
        this.overallHeight = overallHeight;
        $(this.svg.node()).width(overallWidth).height(overallHeight);
        this.adjustContentSize();
    };

    /**
    * Draws the chart.
    * @param {object} chartData - Data for all of the currently-visible
    *                 competitors.
    * @param {SplitsBrowser.Model.ageClass} ageClass - The age-class data object.
    * @param {Array} referenceCumTimes - Array of cumulative times of the
    *                            'reference', in units of seconds.
    * @param {Array} fastestCumTimes - Array of cumulative times of the fastest
    *                            splits, in units of seconds.
    * @param {Array} selectedIndexes - Array of indexes of selected competitors
    *                (0 in this array means the first competitor is selected, 1
    *                means the second is selected, and so on.)
    * @param {Array} visibleStatistics - Array of boolean flags indicating whether
    *                                    certain statistics are visible.
    * @param {yAxisLabel} yAxisLabel - The label of the y-axis.                                    
    * @param {boolean} showStartTimes - Whether to show start times to the left
    *                                   of the chart.
    */
    SplitsBrowser.Controls.Chart.prototype.drawChart = function (chartData, ageClassSet, referenceCumTimes, fastestCumTimes, selectedIndexes, visibleStatistics, yAxisLabel, showStartTimes) {
        this.numControls = chartData.numControls;
        this.numLines = chartData.competitorNames.length;
        this.selectedIndexes = selectedIndexes;
        this.referenceCumTimes = referenceCumTimes;
        this.fastestCumTimes = fastestCumTimes;
        this.ageClassSet = ageClassSet;
        this.showStartTimes = showStartTimes;
        this.visibleStatistics = visibleStatistics;
        this.maxStatisticTextWidth = this.determineMaxStatisticTextWidth();
        this.maxStartTimeLabelWidth = (showStartTimes) ? this.determineMaxStartTimeLabelWidth(chartData) : 0;
        this.adjustContentSize();
        this.createScales(chartData);
        this.drawBackgroundRectangles();
        this.drawAxes(yAxisLabel, chartData);
        this.drawChartLines(chartData);
        this.drawCompetitorLegendLabels(chartData);
        if (showStartTimes) {
            this.drawCompetitorStartTimeLabels(chartData);
        } else {
            this.removeCompetitorStartTimeLabels();
        }
    };
})();
