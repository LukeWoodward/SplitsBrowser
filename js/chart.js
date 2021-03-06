﻿/*
 *  SplitsBrowser Chart - Draws a chart of data on an SVG element.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward.
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

    // Margins on the four sides of the chart.
    var MARGIN = {
        top: 18, // Needs to be high enough not to obscure the upper X-axis.
        right: 0,
        bottom: 18, // Needs to be high enough not to obscure the lower X-axis.
        left: 53 // Needs to be wide enough for times on the race graph.
    };

    var LEGEND_LINE_WIDTH = 10;

    // Minimum distance between a Y-axis tick label and a result's start
    // time, in pixels.
    var MIN_RESULT_TICK_MARK_DISTANCE = 10;

    // The number that identifies the left mouse button in a jQuery event.
    var JQUERY_EVENT_LEFT_BUTTON = 1;

    // The number that identifies the right mouse button in a jQuery event.
    var JQUERY_EVENT_RIGHT_BUTTON = 3;

    var SPACER = "\xa0\xa0\xa0\xa0";

    var colours = [
        "#FF0000", "#4444FF", "#00FF00", "#000000", "#CC0066", "#000099",
        "#FFCC00", "#884400", "#9900FF", "#CCCC00", "#888800", "#CC6699",
        "#00DD00", "#3399FF", "#BB00BB", "#00DDDD", "#FF00FF", "#0088BB",
        "#888888", "#FF99FF", "#55BB33"
    ];

    // 'Imports'.
    var formatTime = SplitsBrowser.formatTime;
    var formatTimeOfDay = SplitsBrowser.formatTimeOfDay;
    var getMessage = SplitsBrowser.getMessage;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var isNaNStrict = SplitsBrowser.isNaNStrict;

    var ChartPopupData = SplitsBrowser.Model.ChartPopupData;
    var ChartPopup = SplitsBrowser.Controls.ChartPopup;

    /**
    * Format a time and a rank as a string, with the split time in mm:ss or h:mm:ss
    * as appropriate.
    * @param {Number|null} time The time, in seconds, or null.
    * @param {Number|null} rank The rank, or null.
    * @param {Boolean} isOKDespiteMissingTimes True if the result is marked as
    *     OK despite having missing controls.
    * @return {String} Time and rank formatted as a string.
    */
    function formatTimeAndRank(time, rank, isOKDespiteMissingTimes) {
        if (isOKDespiteMissingTimes && time === null) {
            time = NaN;
            rank = NaN;
        }

        var rankStr;
        if (rank === null) {
            rankStr = "-";
        } else if (isNaNStrict(rank)) {
            rankStr = "?";
        } else {
            rankStr = rank.toString();
        }

        return SPACER + formatTime(time) + " (" + rankStr + ")";
    }

    /**
    * Formats and returns a result's name and optional suffix.
    * @param {String} name The name associated with the result.
    * @param {String} suffix The optional suffix of the result (may be an
    *      empty string to indicate no suffix).
    * @return {String} Result's associated name and suffix, formatted.
    */
    function formatNameAndSuffix(name, suffix) {
        return (suffix === "") ? name : name + " (" + suffix + ")";
    }

    /**
    * Returns the 'suffix' to use with the given result.
    * The suffix indicates whether they are non-competitive or a mispuncher,
    * were disqualified or did not finish.  If none of the above apply, an
    * empty string is returned.
    * @param {Result} result The result to get the suffix for.
    * @return {String} Suffix to use with the given result.
    */
    function getSuffix(result) {
        // Non-starters are not catered for here, as this is intended to only
        // be used on the chart and non-starters shouldn't appear on the chart.
        if (result.completed() && result.isNonCompetitive) {
            return getMessage("NonCompetitiveShort");
        } else if (result.isNonFinisher) {
            return getMessage("DidNotFinishShort");
        } else if (result.isDisqualified) {
            return getMessage("DisqualifiedShort");
        } else if (result.isOverMaxTime) {
            return getMessage("OverMaxTimeShort");
        } else if (result.completed()) {
            return "";
        } else {
            return getMessage("MispunchedShort");
        }
    }

    /**
    * A chart object in a window.
    * @constructor
    * @param {HTMLElement} parent The parent object to create the element within.
    */
    function Chart(parent) {
        this.parent = parent;

        this.xScale = null;
        this.yScale = null;
        this.hasData = false;
        this.overallWidth = -1;
        this.overallHeight = -1;
        this.contentWidth = -1;
        this.contentHeight = -1;
        this.numControls = -1;
        this.selectedIndexes = [];
        this.currentResultData = null;
        this.isPopupOpen = false;
        this.popupUpdateFunc = null;
        this.maxStartTimeLabelWidth = 0;

        this.mouseOutTimeout = null;

        // Indexes of the currently-selected results, in the order that
        // they appear in the list of labels.
        this.selectedIndexesOrderedByLastYValue = [];
        this.referenceCumTimes = [];
        this.referenceCumTimesSorted = [];
        this.referenceCumTimeIndexes = [];
        this.fastestCumTimes = [];
        this.selectedLegIndex = null;

        this.isMouseIn = false;

        // The position the mouse cursor is currently over, or null for not over
        // the charts.  This index is constrained by the minimum control that a
        // chart type specifies.
        this.currentControlIndex = null;

        // The position the mouse cursor is currently over, or null for not over
        // the charts.  Unlike this.currentControlIndex, this index is not
        // constrained by the minimum control that a chart type specifies.
        this.actualControlIndex = null;

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

        // Disable the context menu on the chart, so that it doesn't open when
        // showing the right-click popup.
        $(this.svg.node()).contextmenu(function(e) { e.preventDefault(); });

        // Add an invisible text element used for determining text size.
        this.textSizeElement = this.svg.append("text").attr("fill", "transparent")
                                                      .attr("id", TEXT_SIZE_ELEMENT_ID);

        var handlers = {"mousemove": mousemoveHandler, "mousedown": mousedownHandler, "mouseup": mouseupHandler};
        this.popup = new ChartPopup(parent, handlers);

        $(document).mouseup(function () { outerThis.popup.hide(); });
    }

    /**
    * Sets the left margin of the chart.
    * @param {Number} leftMargin The left margin of the chart.
    */
    Chart.prototype.setLeftMargin = function (leftMargin) {
        this.currentLeftMargin = leftMargin;
        this.svgGroup.attr("transform", "translate(" + this.currentLeftMargin + "," + MARGIN.top + ")");
    };

    /**
    * Gets the location the chart popup should be at following a mouse-button
    * press or a mouse movement.
    * @param {jQuery.event} event jQuery mouse-down or mouse-move event.
    * @return {Object} Location of the popup.
    */
    Chart.prototype.getPopupLocation = function (event) {
        return {
            x: event.pageX + CHART_POPUP_X_OFFSET,
            y: Math.max(event.pageY - this.popup.height() / 2, 0)
        };
    };

    /**
    * Returns the fastest splits to the current control.
    * @return {Array} Array of fastest-split data.
    */
    Chart.prototype.getFastestSplitsPopupData = function () {
        return ChartPopupData.getFastestSplitsPopupData(this.courseClassSet, this.currentControlIndex, this.selectedLegIndex);
    };

    /**
    * Returns the fastest splits for the currently-shown leg.  The list
    * returned contains the fastest splits for the current leg for each class.
    * @return {Object} Object that contains the title for the popup and the
    *     array of data to show within it.
    */
    Chart.prototype.getFastestSplitsForCurrentLegPopupData = function () {
        return ChartPopupData.getFastestSplitsForLegPopupData(this.courseClassSet, this.eventData, this.currentControlIndex);
    };

    /**
    * Stores the current time the mouse is at, on the race graph.
    * @param {jQuery.event} event The mouse-down or mouse-move event.
    */
    Chart.prototype.setCurrentChartTime = function (event) {
        var yOffset = event.pageY - $(this.svg.node()).offset().top - MARGIN.top;
        this.currentChartTime = Math.round(this.yScale.invert(yOffset) * 60) + this.referenceCumTimes[this.currentControlIndex];
    };

    /**
    * Returns an array of the results visiting the current control at the
    * current time.
    * @return {Array} Array of result data.
    */
    Chart.prototype.getResultsVisitingCurrentControlPopupData = function () {
        return ChartPopupData.getResultsVisitingCurrentControlPopupData(this.courseClassSet, this.eventData, this.currentControlIndex, this.currentChartTime);
    };

    /**
    * Returns next-control data to show on the chart popup.
    * @return {Array} Array of next-control data.
    */
    Chart.prototype.getNextControlData = function () {
        return ChartPopupData.getNextControlData(this.courseClassSet.getCourse(), this.eventData, this.actualControlIndex);
    };

    /**
    * Handle the mouse entering the chart.
    * @param {jQuery.event} event jQuery event object.
    */
    Chart.prototype.onMouseEnter = function (event) {
        if (this.mouseOutTimeout !== null) {
            clearTimeout(this.mouseOutTimeout);
            this.mouseOutTimeout = null;
        }

        this.isMouseIn = true;
        if (this.hasData) {
            this.updateControlLineLocation(event);
        }
    };

    /**
    * Handle a mouse movement.
    * @param {jQuery.event} event jQuery event object.
    */
    Chart.prototype.onMouseMove = function (event) {
        if (this.hasData&& this.isMouseIn && this.xScale !== null) {
            this.updateControlLineLocation(event);
        }
    };

    /**
    * Handle the mouse leaving the chart.
    */
    Chart.prototype.onMouseLeave = function () {
        var outerThis = this;
        // Check that the mouse hasn't entered the popup.
        // It seems that the mouseleave event for the chart is sent before the
        // mouseenter event for the popup, so we use a timeout to check a short
        // time later whether the mouse has left the chart and the popup.
        // This is only necessary for IE9 and IE10; other browsers support
        // "pointer-events: none" in CSS so the popup never gets any mouse
        // events.

        // Note that we keep a reference to the 'timeout', so that we can
        // clear it if the mouse subsequently re-enters.  This happens a lot
        // more often than might be expected for a function with a timeout of
        // only a single millisecond.
        this.mouseOutTimeout = setTimeout(function() {
            if (!outerThis.popup.isMouseIn()) {
                outerThis.isMouseIn = false;
                outerThis.removeControlLine();
            }
        }, 1);
    };

    /**
    * Handles a mouse button being pressed over the chart.
    * @param {jQuery.Event} event jQuery event object.
    */
    Chart.prototype.onMouseDown = function (event) {
        var outerThis = this;
        // Use a timeout to open the dialog as we require other events
        // (mouseover in particular) to be processed first, and the precise
        // order of these events is not consistent between browsers.
        setTimeout(function () { outerThis.showPopupDialog(event); }, 1);
    };

    /**
    * Handles a mouse button being pressed over the chart.
    * @param {jQuery.event} event The jQuery onMouseUp event.
    */
    Chart.prototype.onMouseUp = function (event) {
        this.popup.hide();
        event.preventDefault();
    };

    /**
    * Shows the popup window, populating it with data as necessary
    * @param {jQuery.event} event The jQuery onMouseDown event that triggered
    *     the popup.
    */
    Chart.prototype.showPopupDialog = function (event) {
        if (this.isMouseIn && this.currentControlIndex !== null) {
            var showPopup = false;
            var outerThis = this;
            if (this.isRaceGraph && (event.which === JQUERY_EVENT_LEFT_BUTTON || event.which === JQUERY_EVENT_RIGHT_BUTTON)) {
                if (this.hasControls) {
                    this.setCurrentChartTime(event);
                    this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getResultsVisitingCurrentControlPopupData(), true); };
                    showPopup = true;
                }
            } else if (event.which === JQUERY_EVENT_LEFT_BUTTON) {
                this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getFastestSplitsPopupData(), false); };
                showPopup = true;
            } else if (event.which === JQUERY_EVENT_RIGHT_BUTTON) {
                if (this.hasControls) {
                    this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getFastestSplitsForCurrentLegPopupData(), true); };
                    showPopup = true;
                }
            }

            if (showPopup) {
                this.updatePopupContents(event);
                this.popup.show(this.getPopupLocation(event));
            }
        }
    };

    /**
    * Updates the chart popup with the contents it should contain.
    *
    * If the current course has control data, and the cursor is above the top
    * X-axis, control information is shown instead of whatever other data would
    * be being shown.
    *
    * @param {jQuery.event} event jQuery mouse-move event.
    */
    Chart.prototype.updatePopupContents = function (event) {
        var yOffset = event.pageY - $(this.svg.node()).offset().top;
        var showNextControls = this.hasControls && yOffset < MARGIN.top;
        if (showNextControls) {
            this.updateNextControlInformation();
        } else {
            this.popupUpdateFunc();
        }
    };

    /**
    * Updates the next-control information.
    */
    Chart.prototype.updateNextControlInformation = function () {
        if (this.hasControls) {
            this.popup.setNextControlData(this.getNextControlData());
        }
    };

    /**
    * Draw a 'control line'.  This is a vertical line running the entire height of
    * the chart, at one of the controls.
    * @param {Number} controlIndex The index of the control at which to draw the
    *                              control line.
    */
    Chart.prototype.drawControlLine = function(controlIndex) {
        this.currentControlIndex = controlIndex;
        this.updateResultStatistics();
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
    * Updates the location of the control line from the given mouse event.
    * @param {jQuery.event} event jQuery mousedown or mousemove event.
    */
    Chart.prototype.updateControlLineLocation = function (event) {

        var svgNodeAsJQuery = $(this.svg.node());
        var offset = svgNodeAsJQuery.offset();
        var xOffset = event.pageX - offset.left;
        var yOffset = event.pageY - offset.top;

        if (this.currentLeftMargin <= xOffset && xOffset < svgNodeAsJQuery.width() - MARGIN.right &&
            yOffset < svgNodeAsJQuery.height() - MARGIN.bottom) {
            // In the chart.
            // Get the time offset that the mouse is currently over.
            var chartX = this.xScale.invert(xOffset - this.currentLeftMargin);
            var bisectIndex = d3.bisect(this.referenceCumTimesSorted, chartX);

            // bisectIndex is the index at which to insert chartX into
            // referenceCumTimes in order to keep the array sorted.  So if
            // this index is N, the mouse is between N - 1 and N.  Find
            // which is nearer.
            var sortedControlIndex;
            if (bisectIndex >= this.referenceCumTimesSorted.length) {
                // Off the right-hand end, use the last control (usually the
                // finish).
                sortedControlIndex = this.referenceCumTimesSorted.length - 1;
            } else {
                var diffToNext = Math.abs(this.referenceCumTimesSorted[bisectIndex] - chartX);
                var diffToPrev = Math.abs(chartX - this.referenceCumTimesSorted[bisectIndex - 1]);
                sortedControlIndex = (diffToPrev < diffToNext) ? bisectIndex - 1 : bisectIndex;
            }

            var controlIndex = this.referenceCumTimeIndexes[sortedControlIndex];

            if (this.actualControlIndex === null || this.actualControlIndex !== controlIndex) {
                // The control line has appeared for the first time or has moved, so redraw it.
                this.removeControlLine();
                this.actualControlIndex = controlIndex;
                this.drawControlLine(Math.max(this.minViewableControl, controlIndex));
            }

            if (this.popup.isShown() && this.currentControlIndex !== null) {
                if (this.isRaceGraph) {
                    this.setCurrentChartTime(event);
                }

                this.updatePopupContents(event);
                this.popup.setLocation(this.getPopupLocation(event));
            }

        } else {
            // In the SVG element but outside the chart area.
            this.removeControlLine();
            this.popup.hide();
        }
    };

    /**
    * Remove any previously-drawn control line.  If no such line existed, nothing
    * happens.
    */
    Chart.prototype.removeControlLine = function() {
        this.currentControlIndex = null;
        this.actualControlIndex = null;
        this.updateResultStatistics();
        if (this.controlLine !== null) {
            d3.select(this.controlLine).remove();
            this.controlLine = null;
        }
    };

    /**
    * Returns an array of the the times that the selected results are behind
    * the fastest time at the given control.
    * @param {Number} controlIndex Index of the given control.
    * @param {Array} indexes Array of indexes of selected results.
    * @return {Array} Array of times in seconds that the given results are
    *     behind the fastest time.
    */
    Chart.prototype.getTimesBehindFastest = function (controlIndex, indexes) {
        var selectedResults = indexes.map(function (index) { return this.courseClassSet.allResults[index]; }, this);
        var fastestSplit = this.fastestCumTimes[controlIndex] - this.fastestCumTimes[controlIndex - 1];
        var timesBehind = selectedResults.map(function (result) { var resultSplit = result.getSplitTimeTo(controlIndex); return (resultSplit === null) ? null : resultSplit - fastestSplit; });
        return timesBehind;
    };

    /**
    * Returns an array of the the time losses of the selected results at the
    * given control.
    * @param {Number} controlIndex Index of the given control.
    * @param {Array} indexes Array of indexes of selected results.
    * @return {Array} Array of times in seconds that the given results are
    *     deemed to have lost at the given control.
    */
    Chart.prototype.getTimeLosses = function (controlIndex, indexes) {
        var selectedResults = indexes.map(function (index) { return this.courseClassSet.allResults[index]; }, this);
        var timeLosses = selectedResults.map(function (result) { return result.getTimeLossAt(controlIndex); });
        return timeLosses;
    };

    /**
    * Updates the statistics text shown after the results.
    */
    Chart.prototype.updateResultStatistics = function() {
        var selectedResults = this.selectedIndexesOrderedByLastYValue.map(function (index) { return this.courseClassSet.allResults[index]; }, this);
        var labelTexts = selectedResults.map(function (result) { return formatNameAndSuffix(result.getOwnerNameForLeg(this.selectedLegIndex), getSuffix(result)); }, this);

        if (this.currentControlIndex !== null && this.currentControlIndex > 0) {
            var okDespites = selectedResults.map(function (result) { return result.isOKDespiteMissingTimes; });
            if (this.visibleStatistics.TotalTime) {
                var cumTimes = selectedResults.map(function (result) { return result.getCumulativeTimeTo(this.currentControlIndex); }, this);
                var cumRanks = selectedResults.map(function (result) { return result.getCumulativeRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, cumTimes, cumRanks, okDespites)
                               .map(function(quad) { return quad[0] + formatTimeAndRank(quad[1], quad[2], quad[3]); });
            }

            if (this.visibleStatistics.SplitTime) {
                var splitTimes = selectedResults.map(function (result) { return result.getSplitTimeTo(this.currentControlIndex); }, this);
                var splitRanks = selectedResults.map(function (result) { return result.getSplitRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, splitTimes, splitRanks, okDespites)
                               .map(function(quad) { return quad[0] + formatTimeAndRank(quad[1], quad[2], quad[3]); });
            }

            if (this.visibleStatistics.BehindFastest) {
                var timesBehind = this.getTimesBehindFastest(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                labelTexts = d3.zip(labelTexts, timesBehind, okDespites)
                               .map(function(triple) { return triple[0] + SPACER + formatTime((triple[2] && triple[1] === null) ? NaN : triple[1]); });
            }

            if (this.visibleStatistics.TimeLoss) {
                var timeLosses = this.getTimeLosses(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                labelTexts = d3.zip(labelTexts, timeLosses)
                               .map(function(pair) { return pair[0] + SPACER + formatTime(pair[1]); });
            }
        }

        // Update the current result data.
        if (this.hasData) {
            this.currentResultData.forEach(function (data, index) { data.label = labelTexts[index]; });
        }

        // This data is already joined to the labels; just update the text.
        d3.selectAll("text.resultLabel").text(function (data) { return data.label; });
    };

    /**
    * Returns a tick-formatting function that formats the label of a tick on the
    * top X-axis.
    *
    * The function returned is suitable for use with the D3 axis.tickFormat method.
    *
    * @return {Function} Tick-formatting function.
    */
    Chart.prototype.getTickFormatter = function () {
        var outerThis = this;
        if (this.courseClassSet.hasTeamData()) {
            var allControls = [getMessage("StartNameShort")];
            var numbersOfControls = this.courseClassSet.classes[0].numbersOfControls;
            if (this.selectedLegIndex !== null) {
                numbersOfControls = [numbersOfControls[this.selectedLegIndex]];
            }

            for (var legIndex = 0; legIndex < numbersOfControls.length; legIndex += 1) {
                for (var controlIndex = 1; controlIndex <= numbersOfControls[legIndex]; controlIndex += 1) {
                    allControls.push(controlIndex.toString());
                }
                allControls.push(getMessage("FinishNameShort"));
            }

            return function (value, idx) {
                return allControls[idx];
            };
        }
        else {
            return function (value, idx) {
                return (idx === 0) ? getMessage("StartNameShort") : ((idx === outerThis.numControls + 1) ? getMessage("FinishNameShort") : idx.toString());
            };
        }
    };

    /**
    * Get the width of a piece of text.
    * @param {String} text The piece of text to measure the width of.
    * @return {Number} The width of the piece of text, in pixels.
    */
    Chart.prototype.getTextWidth = function (text) {
        return this.textSizeElement.text(text).node().getBBox().width;
    };

    /**
    * Gets the height of a piece of text.
    *
    * @param {String} text The piece of text to measure the height of.
    * @return {Number} The height of the piece of text, in pixels.
    */
    Chart.prototype.getTextHeight = function (text) {
        return this.textSizeElement.text(text).node().getBBox().height;
    };

    /**
    * Return the maximum width of the end-text shown to the right of the graph.
    *
    * This function considers only the results whose indexes are in the list
    * given.  This method returns zero if the list is empty.
    * @return {Number} Maximum width of text, in pixels.
    */
    Chart.prototype.getMaxGraphEndTextWidth = function () {
        if (this.selectedIndexes.length === 0) {
            // No results selected.  Avoid problems caused by trying to find
            // the maximum of an empty array.
            return 0;
        } else {
            var nameWidths = this.selectedIndexes.map(function (index) {
                var result = this.courseClassSet.allResults[index];
                return this.getTextWidth(formatNameAndSuffix(result.getOwnerNameForLeg(this.selectedLegIndex), getSuffix(result)));
            }, this);
            return d3.max(nameWidths) + this.determineMaxStatisticTextWidth();
        }
    };

    /**
    * Returns the maximum value from the given array, not including any null or
    * NaN values.  If the array contains no non-null, non-NaN values, zero is
    * returned.
    * @param {Array} values Array of values.
    * @return {Number} Maximum non-null or NaN value.
    */
    function maxNonNullNorNaNValue(values) {
        var nonNullNorNaNValues = values.filter(isNotNullNorNaN);
        return (nonNullNorNaNValues.length > 0) ? d3.max(nonNullNorNaNValues) : 0;
    }

    /**
    * Return the maximum width of a piece of time and rank text shown to the right
    * of each result.
    * @param {String} timeFuncName Name of the function to call to get the time
                                   data.
    * @param {String} rankFuncName Name of the function to call to get the rank
                                   data.
    * @return {Number} Maximum width of split-time and rank text, in pixels.
    */
    Chart.prototype.getMaxTimeAndRankTextWidth = function(timeFuncName, rankFuncName) {
        var maxTime = 0;
        var maxRank = 0;

        var selectedResults = this.selectedIndexes.map(function (index) { return this.courseClassSet.allResults[index]; }, this);

        d3.range(1, this.numControls + 2).forEach(function (controlIndex) {
            var times = selectedResults.map(function (result) { return result[timeFuncName](controlIndex); });
            maxTime = Math.max(maxTime, maxNonNullNorNaNValue(times));

            var ranks = selectedResults.map(function (result) { return result[rankFuncName](controlIndex); });
            maxRank = Math.max(maxRank, maxNonNullNorNaNValue(ranks));
        });

        var text = formatTimeAndRank(maxTime, maxRank);
        return this.getTextWidth(text);
    };

    /**
    * Return the maximum width of the split-time and rank text shown to the right
    * of each result.
    * @return {Number} Maximum width of split-time and rank text, in pixels.
    */
    Chart.prototype.getMaxSplitTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getSplitTimeTo", "getSplitRankTo");
    };

    /**
    * Return the maximum width of the cumulative time and cumulative-time rank text
    * shown to the right of each result.
    * @return {Number} Maximum width of cumulative time and cumulative-time rank text, in
    *                  pixels.
    */
    Chart.prototype.getMaxCumulativeTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getCumulativeTimeTo", "getCumulativeRankTo");
    };

    /**
    * Return the maximum width of the behind-fastest time shown to the right of
    * each result.
    * @return {Number} Maximum width of behind-fastest time rank text, in pixels.
    */
    Chart.prototype.getMaxTimeBehindFastestWidth = function() {
        var maxTime = 0;

        for (var controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
            var times = this.getTimesBehindFastest(controlIndex, this.selectedIndexes);
            maxTime = Math.max(maxTime, maxNonNullNorNaNValue(times));
        }

        return this.getTextWidth(SPACER + formatTime(maxTime));
    };

    /**
    * Return the maximum width of the behind-fastest time shown to the right of
    * each result.
    * @return {Number} Maximum width of behind-fastest time rank text, in pixels.
    */
    Chart.prototype.getMaxTimeLossWidth = function() {
        var maxTimeLoss = 0;
        var minTimeLoss = 0;
        for (var controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
            var timeLosses = this.getTimeLosses(controlIndex, this.selectedIndexes);
            var nonNullTimeLosses = timeLosses.filter(isNotNullNorNaN);
            if (nonNullTimeLosses.length > 0) {
                maxTimeLoss = Math.max(maxTimeLoss, d3.max(nonNullTimeLosses));
                minTimeLoss = Math.min(minTimeLoss, d3.min(nonNullTimeLosses));
            }
        }

        return Math.max(
            this.getTextWidth(SPACER + formatTime(maxTimeLoss)),
            this.getTextWidth(SPACER + formatTime(minTimeLoss))
        );
    };

    /**
    * Determines the maximum width of the statistics text at the end of the result.
    * @return {Number} Maximum width of the statistics text, in pixels.
    */
    Chart.prototype.determineMaxStatisticTextWidth = function() {
        var maxWidth = 0;
        if (this.visibleStatistics.TotalTime) {
            maxWidth += this.getMaxCumulativeTimeAndRankTextWidth();
        }
        if (this.visibleStatistics.SplitTime) {
            maxWidth += this.getMaxSplitTimeAndRankTextWidth();
        }
        if (this.visibleStatistics.BehindFastest) {
            maxWidth += this.getMaxTimeBehindFastestWidth();
        }
        if (this.visibleStatistics.TimeLoss) {
            maxWidth += this.getMaxTimeLossWidth();
        }

        return maxWidth;
    };

    /**
    * Determines the maximum width of all of the visible start time labels.
    * If none are presently visible, zero is returned.
    * @param {Object} chartData Object containing the chart data.
    * @return {Number} Maximum width of a start time label.
    */
    Chart.prototype.determineMaxStartTimeLabelWidth = function (chartData) {
        var maxWidth;
        if (chartData.resultNames.length > 0) {
            maxWidth = d3.max(chartData.resultNames.map(function (name) { return this.getTextWidth("00:00:00 " + name); }, this));
        } else {
            maxWidth = 0;
        }

        return maxWidth;
    };

    /**
    * Creates the X and Y scales necessary for the chart and its axes.
    * @param {Object} chartData Chart data object.
    */
    Chart.prototype.createScales = function (chartData) {
        this.xScale = d3.scaleLinear().domain(chartData.xExtent).range([0, this.contentWidth]);
        this.yScale = d3.scaleLinear().domain(chartData.yExtent).range([0, this.contentHeight]);
        this.xScaleMinutes = d3.scaleLinear().domain([chartData.xExtent[0] / 60, chartData.xExtent[1] / 60]).range([0, this.contentWidth]);
    };

    /**
    * Draw the background rectangles that indicate sections of the course
    * between controls.
    */
    Chart.prototype.drawBackgroundRectangles = function () {

        // We can't guarantee that the reference cumulative times are in
        // ascending order, but we need such a list of times in order to draw
        // the rectangles.  So, sort the reference cumulative times.
        var refCumTimesSorted = this.courseClassSet.sliceForLegIndex(this.referenceCumTimes, this.selectedLegIndex);
        refCumTimesSorted.sort(d3.ascending);

        // Now remove any duplicate times.
        var index = 1;
        while (index < refCumTimesSorted.length) {
            if (refCumTimesSorted[index] === refCumTimesSorted[index - 1]) {
                refCumTimesSorted.splice(index, 1);
            } else {
                index += 1;
            }
        }

        var outerThis = this;

        var rects = this.svgGroup.selectAll("rect")
                                 .data(d3.range(refCumTimesSorted.length - 1));

        rects.enter().append("rect");

        var backgroundIndexes = [];
        var numbersOfControls = (this.courseClassSet.hasTeamData()) ? this.courseClassSet.classes[0].numbersOfControls : [this.courseClassSet.numControls];
        if (this.courseClassSet.hasTeamData() && this.selectedLegIndex !== null) {
            numbersOfControls = [numbersOfControls[this.selectedLegIndex]];
        }

        for (var legIndex = 0; legIndex < numbersOfControls.length; legIndex += 1) {
            for (var controlIndex = 0; controlIndex <= numbersOfControls[legIndex]; controlIndex += 1) {
                backgroundIndexes.push(1 + controlIndex % 2 + ((legIndex + (this.selectedLegIndex || 0)) % 2) * 2);
            }
        }

        rects = this.svgGroup.selectAll("rect")
                                 .data(d3.range(refCumTimesSorted.length - 1));
        rects.attr("x", function (index) { return outerThis.xScale(refCumTimesSorted[index]); })
             .attr("y", 0)
             .attr("width", function (index) { return outerThis.xScale(refCumTimesSorted[index + 1]) - outerThis.xScale(refCumTimesSorted[index]); })
             .attr("height", this.contentHeight)
             .attr("class", function (index) { return "background" + backgroundIndexes[index]; });

        rects.exit().remove();
    };

    /**
    * Returns a function used to format tick labels on the Y-axis.
    *
    * If start times are to be shown (i.e. for the race graph), then the Y-axis
    * values are start times.  We format these as times, as long as there isn't
    * a result's start time too close to it.
    *
    * For other graph types, this method returns null, which tells d3 to use
    * its default tick formatter.
    *
    * @param {Object} chartData The chart data to read start times from.
    * @return {Function|null} Tick formatter function, or null to use the default
    *     d3 formatter.
    */
    Chart.prototype.determineYAxisTickFormatter = function (chartData) {
        if (this.isRaceGraph) {
            // Assume column 0 of the data is the start times.
            // However, beware that there might not be any data.
            var startTimes = (chartData.dataColumns.length === 0) ? [] : chartData.dataColumns[0].ys;
            if (startTimes.length === 0) {
                // No start times - draw all tick marks.
                return function (time) { return formatTimeOfDay(time * 60); };
            } else {
                // Some start times are to be drawn - only draw tick marks if
                // they are far enough away from results.
                var yScale = this.yScale;
                return function (time) {
                    var nearestOffset = d3.min(startTimes.map(function (startTime) { return Math.abs(yScale(startTime) - yScale(time)); }));
                    return (nearestOffset >= MIN_RESULT_TICK_MARK_DISTANCE) ? formatTimeOfDay(Math.round(time * 60)) : "";
                };
            }
        } else {
            // Use the default d3 tick formatter.
            return null;
        }
    };

    /**
    * Draw the chart axes.
    * @param {String} yAxisLabel The label to use for the Y-axis.
    * @param {Object} chartData The chart data to use.
    */
    Chart.prototype.drawAxes = function (yAxisLabel, chartData) {

        var tickFormatter = this.determineYAxisTickFormatter(chartData);

        var xAxis = d3.axisTop()
                      .scale(this.xScale)
                      .tickFormat(this.getTickFormatter())
                      .tickValues(this.courseClassSet.sliceForLegIndex(this.referenceCumTimes, this.selectedLegIndex));

        var yAxis = d3.axisLeft()
                      .scale(this.yScale)
                      .tickFormat(tickFormatter);

        var lowerXAxis = d3.axisBottom()
                           .scale(this.xScaleMinutes);

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
                     .style("fill", "black")
                     .text(yAxisLabel);

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .attr("transform", "translate(0," + this.contentHeight + ")")
                     .call(lowerXAxis)
                     .append("text")
                     .attr("x", 60)
                     .attr("y", -5)
                     .style("text-anchor", "start")
                     .style("fill", "black")
                     .text(getMessage("LowerXAxisChartLabel"));
    };

    /**
    * Draw the lines on the chart.
    * @param {Array} chartData Array of chart data.
    */
    Chart.prototype.drawChartLines = function (chartData) {
        var outerThis = this;
        var lineFunctionGenerator = function (selResultIdx) {
            if (!chartData.dataColumns.some(function (col) { return isNotNullNorNaN(col.ys[selResultIdx]); })) {
                // This result's entire row is null/NaN, so there's no data to
                // draw.  WebKit will report an error ('Error parsing d=""') if
                // no points on the line are defined, as will happen in this
                // case, so we substitute a single zero point instead.
                return d3.line()
                           .x(0)
                           .y(0)
                           .defined(function (d, i) { return i === 0; });
            }
            else {
                return d3.line()
                           .x(function (d) { return outerThis.xScale(d.x); })
                           .y(function (d) { return outerThis.yScale(d.ys[selResultIdx]); })
                           .defined(function (d) { return isNotNullNorNaN(d.ys[selResultIdx]); });
            }
        };

        this.svgGroup.selectAll("path.graphLine").remove();

        this.svgGroup.selectAll("line.aroundOmittedTimes").remove();

        d3.range(this.numLines).forEach(function (selResultIdx) {
            var strokeColour = colours[this.selectedIndexes[selResultIdx] % colours.length];
            var highlighter = function () { outerThis.highlight(outerThis.selectedIndexes[selResultIdx]); };
            var unhighlighter = function () { outerThis.unhighlight(); };

            this.svgGroup.append("path")
                         .attr("d", lineFunctionGenerator(selResultIdx)(chartData.dataColumns))
                         .attr("stroke", strokeColour)
                         .attr("class", "graphLine result" + this.selectedIndexes[selResultIdx])
                         .on("mouseenter", highlighter)
                         .on("mouseleave", unhighlighter)
                         .append("title")
                         .text(chartData.resultNames[selResultIdx]);

            chartData.dubiousTimesInfo[selResultIdx].forEach(function (dubiousTimeInfo) {
                this.svgGroup.append("line")
                             .attr("x1", this.xScale(chartData.dataColumns[dubiousTimeInfo.start].x))
                             .attr("y1", this.yScale(chartData.dataColumns[dubiousTimeInfo.start].ys[selResultIdx]))
                             .attr("x2", this.xScale(chartData.dataColumns[dubiousTimeInfo.end].x))
                             .attr("y2", this.yScale(chartData.dataColumns[dubiousTimeInfo.end].ys[selResultIdx]))
                             .attr("stroke", strokeColour)
                             .attr("class", "aroundOmittedTimes result" + this.selectedIndexes[selResultIdx])
                             .on("mouseenter", highlighter)
                             .on("mouseleave", unhighlighter)
                             .append("title")
                             .text(chartData.resultNames[selResultIdx]);
            }, this);
        }, this);
    };

    /**
    * Highlights the result with the given index.
    * @param {Number} resultIdx The index of the result to highlight.
    */
    Chart.prototype.highlight = function (resultIdx) {
        this.svg.selectAll("path.graphLine.result" + resultIdx).classed("selected", true);
        this.svg.selectAll("line.resultLegendLine.result" + resultIdx).classed("selected", true);
        this.svg.selectAll("text.resultLabel.result" + resultIdx).classed("selected", true);
        this.svg.selectAll("text.startLabel.result" + resultIdx).classed("selected", true);
        this.svg.selectAll("line.aroundOmittedTimes.result" + resultIdx).classed("selected", true);
    };

    /**
    * Removes any result-specific higlighting.
    */
    Chart.prototype.unhighlight = function () {
        this.svg.selectAll("path.graphLine.selected").classed("selected", false);
        this.svg.selectAll("line.resultLegendLine.selected").classed("selected", false);
        this.svg.selectAll("text.resultLabel.selected").classed("selected", false);
        this.svg.selectAll("text.startLabel.selected").classed("selected", false);
        this.svg.selectAll("line.aroundOmittedTimes.selected").classed("selected", false);
    };

    /**
    * Draws the start-time labels for the currently-selected results.
    * @param {Object} chartData The chart data that contains the start offsets.
    */
    Chart.prototype.drawResultStartTimeLabels = function (chartData) {
        var startColumn = chartData.dataColumns[0];
        var outerThis = this;

        var startLabels = this.svgGroup.selectAll("text.startLabel").data(this.selectedIndexes);

        startLabels.enter().append("text")
                           .classed("startLabel", true);

        startLabels = this.svgGroup.selectAll("text.startLabel").data(this.selectedIndexes);
        startLabels.attr("x", -7)
                   .attr("y", function (_resultIndex, selResultIndex) { return outerThis.yScale(startColumn.ys[selResultIndex]) + outerThis.getTextHeight(chartData.resultNames[selResultIndex]) / 4; })
                   .attr("class", function (resultIndex) { return "startLabel result" + resultIndex; })
                   .on("mouseenter", function (resultIndex) { outerThis.highlight(resultIndex); })
                   .on("mouseleave", function () { outerThis.unhighlight(); })
                   .text(function (_resultIndex, selResultIndex) { return formatTimeOfDay(Math.round(startColumn.ys[selResultIndex] * 60)) + " " + chartData.resultNames[selResultIndex]; });

        startLabels.exit().remove();
    };

    /**
    * Removes all of the result start-time labels from the chart.
    */
    Chart.prototype.removeResultStartTimeLabels = function () {
        this.svgGroup.selectAll("text.startLabel").remove();
    };

    /**
    * Adjust the locations of the legend labels downwards so that two labels
    * do not overlap.
    */
    Chart.prototype.adjustResultLegendLabelsDownwardsIfNecessary = function () {
        for (var i = 1; i < this.numLines; i += 1) {
            var prevResult = this.currentResultData[i - 1];
            var thisResult = this.currentResultData[i];
            if (thisResult.y < prevResult.y + prevResult.textHeight) {
                thisResult.y = prevResult.y + prevResult.textHeight;
            }
        }
    };

    /**
    * Adjusts the locations of the legend labels upwards so that as many as
    * possible can fit on the chart.  If all result labels are already on the
    * chart, then this method does nothing.
    *
    * This method does not move off the chart any label that is currently on
    * the chart.
    *
    * @param {Number} minLastY The minimum Y-coordinate of the lowest label.
    */
    Chart.prototype.adjustResultLegendLabelsUpwardsIfNecessary = function (minLastY) {
        if (this.numLines > 0 && this.currentResultData[this.numLines - 1].y > this.contentHeight) {
            // The list of results runs off the bottom.
            // Put the last result at the bottom, or at its minimum Y-offset,
            // whichever is larger, and move all labels up as much as we can.
            this.currentResultData[this.numLines - 1].y = Math.max(minLastY, this.contentHeight);
            for (var i = this.numLines - 2; i >= 0; i -= 1) {
                var nextResult = this.currentResultData[i + 1];
                var thisResult = this.currentResultData[i];
                if (thisResult.y + thisResult.textHeight > nextResult.y) {
                    thisResult.y = nextResult.y - thisResult.textHeight;
                } else {
                    // No more adjustments need to be made.
                    break;
                }
            }
        }
    };

    /**
    * Draw legend labels to the right of the chart.
    * Draw legend labels to the right of the chart.
    * @param {Object} chartData The chart data that contains the final time offsets.
    */
    Chart.prototype.drawResultLegendLabels = function (chartData) {

        var minLastY = 0;
        if (chartData.dataColumns.length === 0) {
            this.currentResultData = [];
        } else {
            var finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
            this.currentResultData = d3.range(this.numLines).map(function (i) {
                var resultIndex = this.selectedIndexes[i];
                var name = this.courseClassSet.allResults[resultIndex].getOwnerNameForLeg(this.selectedLegIndex);
                var textHeight = this.getTextHeight(name);
                minLastY += textHeight;
                return {
                    label: formatNameAndSuffix(name, getSuffix(this.courseClassSet.allResults[resultIndex])),
                    textHeight: textHeight,
                    y: (isNotNullNorNaN(finishColumn.ys[i])) ? this.yScale(finishColumn.ys[i]) : null,
                    colour: colours[resultIndex % colours.length],
                    index: resultIndex
                };
            }, this);

            minLastY -= this.currentResultData[this.numLines - 1].textHeight;

            // Draw the mispunchers at the bottom of the chart, with the last
            // one of them at the bottom.
            var lastMispuncherY = null;
            for (var selResultIdx = this.numLines - 1; selResultIdx >= 0; selResultIdx -= 1) {
                if (this.currentResultData[selResultIdx].y === null) {
                    this.currentResultData[selResultIdx].y = (lastMispuncherY === null) ? this.contentHeight : lastMispuncherY - this.currentResultData[selResultIdx].textHeight;
                    lastMispuncherY = this.currentResultData[selResultIdx].y;
                }
            }
        }

        // Sort by the y-offset values, which doesn't always agree with the end
        // positions of the results.
        this.currentResultData.sort(function (a, b) { return a.y - b.y; });

        this.selectedIndexesOrderedByLastYValue = this.currentResultData.map(function (result) { return result.index; });

        this.adjustResultLegendLabelsDownwardsIfNecessary();

        this.adjustResultLegendLabelsUpwardsIfNecessary(minLastY);

        var legendLines = this.svgGroup.selectAll("line.resultLegendLine").data(this.currentResultData);
        legendLines.enter().append("line").classed("resultLegendLine", true);

        var outerThis = this;
        legendLines = this.svgGroup.selectAll("line.resultLegendLine").data(this.currentResultData);
        legendLines.attr("x1", this.contentWidth + 1)
                   .attr("y1", function (data) { return data.y; })
                   .attr("x2", this.contentWidth + LEGEND_LINE_WIDTH + 1)
                   .attr("y2", function (data) { return data.y; })
                   .attr("stroke", function (data) { return data.colour; })
                   .attr("class", function (data) { return "resultLegendLine result" + data.index; })
                   .on("mouseenter", function (data) { outerThis.highlight(data.index); })
                   .on("mouseleave", function () { outerThis.unhighlight(); });

        legendLines.exit().remove();

        var labels = this.svgGroup.selectAll("text.resultLabel").data(this.currentResultData);
        labels.enter().append("text").classed("resultLabel", true);

        labels = this.svgGroup.selectAll("text.resultLabel").data(this.currentResultData);
        labels.attr("x", this.contentWidth + LEGEND_LINE_WIDTH + 2)
              .attr("y", function (data) { return data.y + data.textHeight / 4; })
              .attr("class", function (data) { return "resultLabel result" + data.index; })
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
    Chart.prototype.adjustContentSize = function () {
        // Extra length added to the maximum start-time label width to
        // include the lengths of the Y-axis ticks.
        var EXTRA_MARGIN = 8;
        var maxTextWidth = this.getMaxGraphEndTextWidth();
        this.setLeftMargin(Math.max(this.maxStartTimeLabelWidth + EXTRA_MARGIN, MARGIN.left));
        this.contentWidth = Math.max(this.overallWidth - this.currentLeftMargin - MARGIN.right - maxTextWidth - (LEGEND_LINE_WIDTH + 2), 100);
        this.contentHeight = Math.max(this.overallHeight - MARGIN.top - MARGIN.bottom, 100);
    };

    /**
    * Sets the overall size of the chart control, including margin, axes and legend labels.
    * @param {Number} overallWidth Overall width
    * @param {Number} overallHeight Overall height
    */
    Chart.prototype.setSize = function (overallWidth, overallHeight) {
        this.overallWidth = overallWidth;
        this.overallHeight = overallHeight;
        $(this.svg.node()).width(overallWidth).height(overallHeight);
        this.adjustContentSize();
    };

    /**
    * Clears the graph by removing all controls from it.
    */
    Chart.prototype.clearGraph = function () {
        this.svgGroup.selectAll("*").remove();
    };

    /**
    * Sorts the reference cumulative times, and creates a list of the sorted
    * reference cumulative times and their indexes into the actual list of
    * reference cumulative times.
    *
    * This sorted list is used by the chart to find which control the cursor
    * is closest to.
    */
    Chart.prototype.sortReferenceCumTimes = function () {
        // Put together a map that maps cumulative times to the first split to
        // register that time.
        var cumTimesToControlIndex = d3.map();
        this.referenceCumTimes.forEach(function (cumTime, index) {
            if (!cumTimesToControlIndex.has(cumTime)) {
                cumTimesToControlIndex.set(cumTime, index);
            }
        });

        // Sort and deduplicate the reference cumulative times.
        this.referenceCumTimesSorted = this.referenceCumTimes.slice(0);
        this.referenceCumTimesSorted.sort(d3.ascending);
        for (var index = this.referenceCumTimesSorted.length - 1; index > 0; index -= 1) {
            if (this.referenceCumTimesSorted[index] === this.referenceCumTimesSorted[index - 1]) {
                this.referenceCumTimesSorted.splice(index, 1);
            }
        }

        this.referenceCumTimeIndexes = this.referenceCumTimesSorted.map(function (cumTime) { return cumTimesToControlIndex.get(cumTime); });
    };

    /**
    * Draws the chart.
    * @param {Object} data Object that contains various chart data.  This
    *     must contain the following properties:
    *     * chartData {Object} - the data to plot on the chart
    *     * eventData {SplitsBrowser.Model.Event} - the overall Event object.
    *     * courseClassSet {SplitsBrowser.Model.Event} - the course-class set.
    *     * referenceCumTimes {Array} - Array of cumulative split times of the
    *       'reference'.
    *     * fastestCumTimes {Array} - Array of cumulative times of the
    *       imaginary 'fastest' result.
    * @param {Array} selectedIndexes Array of indexes of selected results
    *                (0 in this array means the first result is selected, 1
    *                means the second is selected, and so on.)
    * @param {Array} visibleStatistics Array of boolean flags indicating whether
    *                                  certain statistics are visible.
    * @param {Object} chartType The type of chart being drawn.
    * @param {Number|null} selectedLegIndex The selected leg index, or null for all
    *                                       legs.
    */
    Chart.prototype.drawChart = function (data, selectedIndexes, visibleStatistics, chartType, selectedLegIndex) {
        var chartData = data.chartData;
        this.numControls = chartData.numControls;
        this.numLines = chartData.resultNames.length;
        this.selectedIndexes = selectedIndexes;
        this.referenceCumTimes = data.referenceCumTimes;
        this.fastestCumTimes = data.fastestCumTimes;
        this.eventData = data.eventData;
        this.courseClassSet = data.courseClassSet;
        this.hasControls = data.courseClassSet.getCourse().hasControls();
        this.isRaceGraph = chartType.isRaceGraph;
        this.minViewableControl = chartType.minViewableControl;
        this.visibleStatistics = visibleStatistics;
        this.selectedLegIndex = selectedLegIndex;
        this.hasData = true;

        this.maxStatisticTextWidth = this.determineMaxStatisticTextWidth();
        this.maxStartTimeLabelWidth = (this.isRaceGraph) ? this.determineMaxStartTimeLabelWidth(chartData) : 0;
        this.sortReferenceCumTimes();
        this.adjustContentSize();
        this.createScales(chartData);
        this.drawBackgroundRectangles();
        this.drawAxes(getMessage(chartType.yAxisLabelKey), chartData);
        this.drawChartLines(chartData);
        this.drawResultLegendLabels(chartData);
        this.removeControlLine();
        if (this.isRaceGraph) {
            this.drawResultStartTimeLabels(chartData);
        } else {
            this.removeResultStartTimeLabels();
        }
    };

    SplitsBrowser.Controls.Chart = Chart;
})();
