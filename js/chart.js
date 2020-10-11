/*
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
    const TEXT_SIZE_ELEMENT_ID = "sb-text-size-element";

    // ID of the chart.
    // Must match that used in styles.css
    const CHART_SVG_ID = "chart";

    // X-offset in pixels between the mouse and the popup that opens.
    const CHART_POPUP_X_OFFSET = 10;

    // Margins on the four sides of the chart.
    const MARGIN = {
        top: 18, // Needs to be high enough not to obscure the upper X-axis.
        right: 0,
        bottom: 18, // Needs to be high enough not to obscure the lower X-axis.
        left: 53 // Needs to be wide enough for times on the race graph.
    };

    const LEGEND_LINE_WIDTH = 10;

    // Minimum distance between a Y-axis tick label and a result's start
    // time, in pixels.
    const MIN_RESULT_TICK_MARK_DISTANCE = 10;

    // The number that identifies the left mouse button in a jQuery event.
    const JQUERY_EVENT_LEFT_BUTTON = 1;

    // The number that identifies the right mouse button in a jQuery event.
    const JQUERY_EVENT_RIGHT_BUTTON = 3;

    const SPACER = "\xa0\xa0\xa0\xa0";

    const colours = [
        "#FF0000", "#4444FF", "#00FF00", "#000000", "#CC0066", "#000099",
        "#FFCC00", "#884400", "#9900FF", "#CCCC00", "#888800", "#CC6699",
        "#00DD00", "#3399FF", "#BB00BB", "#00DDDD", "#FF00FF", "#0088BB",
        "#888888", "#FF99FF", "#55BB33"
    ];

    // 'Imports'.
    const formatTime = SplitsBrowser.formatTime;
    const formatTimeOfDay = SplitsBrowser.formatTimeOfDay;
    const getMessage = SplitsBrowser.getMessage;
    const isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    const isNaNStrict = SplitsBrowser.isNaNStrict;

    const ChartPopupData = SplitsBrowser.Model.ChartPopupData;
    const ChartPopup = SplitsBrowser.Controls.ChartPopup;

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

        let rankStr;
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
    class Chart {
        constructor(parent) {
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

            $(this.svg.node()).mouseenter(event => this.onMouseEnter(event))
                .mousemove(event => this.onMouseMove(event))
                .mouseleave(event => this.onMouseLeave(event))
                .mousedown(event => this.onMouseDown(event))
                .mouseup(event => this.onMouseUp(event));

            // Disable the context menu on the chart, so that it doesn't open when
            // showing the right-click popup.
            $(this.svg.node()).contextmenu(e => e.preventDefault());

            // Add an invisible text element used for determining text size.
            this.textSizeElement = this.svg.append("text").attr("fill", "transparent")
                .attr("id", TEXT_SIZE_ELEMENT_ID);

            this.popup = new ChartPopup(parent);

            $(document).mouseup(() => this.popup.hide());
        }

        /**
        * Sets the left margin of the chart.
        * @param {Number} leftMargin The left margin of the chart.
        */
        setLeftMargin(leftMargin) {
            this.currentLeftMargin = leftMargin;
            this.svgGroup.attr("transform", `translate(${this.currentLeftMargin},${MARGIN.top})`);
        }

        /**
        * Gets the location the chart popup should be at following a mouse-button
        * press or a mouse movement.
        * @param {jQuery.event} event jQuery mouse-down or mouse-move event.
        * @return {Object} Location of the popup.
        */
        getPopupLocation(event) {
            return {
                x: event.pageX + CHART_POPUP_X_OFFSET,
                y: Math.max(event.pageY - this.popup.height() / 2, 0)
            };
        }

        /**
        * Returns the fastest splits to the current control.
        * @return {Array} Array of fastest-split data.
        */
        getFastestSplitsPopupData() {
            return ChartPopupData.getFastestSplitsPopupData(this.courseClassSet, this.currentControlIndex, this.selectedLegIndex);
        }

        /**
        * Returns the fastest splits for the currently-shown leg.  The list
        * returned contains the fastest splits for the current leg for each class.
        * @return {Object} Object that contains the title for the popup and the
        *     array of data to show within it.
        */
        getFastestSplitsForCurrentLegPopupData() {
            return ChartPopupData.getFastestSplitsForLegPopupData(this.courseClassSet, this.eventData, this.currentControlIndex);
        }

        /**
        * Stores the current time the mouse is at, on the race graph.
        * @param {jQuery.event} event The mouse-down or mouse-move event.
        */
        setCurrentChartTime(event) {
            let yOffset = event.pageY - $(this.svg.node()).offset().top - MARGIN.top;
            this.currentChartTime = Math.round(this.yScale.invert(yOffset) * 60) + this.referenceCumTimes[this.currentControlIndex];
        }

        /**
        * Returns an array of the results visiting the current control at the
        * current time.
        * @return {Array} Array of result data.
        */
        getResultsVisitingCurrentControlPopupData() {
            return ChartPopupData.getResultsVisitingCurrentControlPopupData(this.courseClassSet, this.eventData, this.currentControlIndex, this.currentChartTime);
        }

        /**
        * Returns next-control data to show on the chart popup.
        * @return {Array} Array of next-control data.
        */
        getNextControlData() {
            return ChartPopupData.getNextControlData(this.courseClassSet.getCourse(), this.eventData, this.actualControlIndex);
        }

        /**
        * Handle the mouse entering the chart.
        * @param {jQuery.event} event jQuery event object.
        */
        onMouseEnter(event) {
            if (this.mouseOutTimeout !== null) {
                clearTimeout(this.mouseOutTimeout);
                this.mouseOutTimeout = null;
            }

            this.isMouseIn = true;
            if (this.hasData) {
                this.updateControlLineLocation(event);
            }
        }

        /**
        * Handle a mouse movement.
        * @param {jQuery.event} event jQuery event object.
        */
        onMouseMove(event) {
            if (this.hasData && this.isMouseIn && this.xScale !== null) {
                this.updateControlLineLocation(event);
            }
        }

        /**
        * Handle the mouse leaving the chart.
        */
        onMouseLeave() {
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
            this.mouseOutTimeout = setTimeout(() => {
                if (!this.popup.isMouseIn()) {
                    this.isMouseIn = false;
                    this.removeControlLine();
                }
            }, 1);
        }

        /**
        * Handles a mouse button being pressed over the chart.
        * @param {jQuery.Event} event jQuery event object.
        */
        onMouseDown(event) {
            // Use a timeout to open the dialog as we require other events
            // (mouseover in particular) to be processed first, and the precise
            // order of these events is not consistent between browsers.
            setTimeout(() => this.showPopupDialog(event), 1);
        }

        /**
        * Handles a mouse button being pressed over the chart.
        * @param {jQuery.event} event The jQuery onMouseUp event.
        */
        onMouseUp(event) {
            this.popup.hide();
            event.preventDefault();
        }

        /**
        * Shows the popup window, populating it with data as necessary
        * @param {jQuery.event} event The jQuery onMouseDown event that triggered
        *     the popup.
        */
        showPopupDialog(event) {
            if (this.isMouseIn && this.currentControlIndex !== null) {
                let showPopup = false;
                if (this.isRaceGraph && (event.which === JQUERY_EVENT_LEFT_BUTTON || event.which === JQUERY_EVENT_RIGHT_BUTTON)) {
                    if (this.hasControls) {
                        this.setCurrentChartTime(event);
                        this.popupUpdateFunc = () => this.popup.setData(this.getResultsVisitingCurrentControlPopupData(), true);
                        showPopup = true;
                    }
                } else if (event.which === JQUERY_EVENT_LEFT_BUTTON) {
                    this.popupUpdateFunc = () => this.popup.setData(this.getFastestSplitsPopupData(), false);
                    showPopup = true;
                } else if (event.which === JQUERY_EVENT_RIGHT_BUTTON) {
                    if (this.hasControls) {
                        this.popupUpdateFunc = () =>  this.popup.setData(this.getFastestSplitsForCurrentLegPopupData(), true);
                        showPopup = true;
                    }
                }

                if (showPopup) {
                    this.updatePopupContents(event);
                    this.popup.show(this.getPopupLocation(event));
                }
            }
        }

        /**
        * Updates the chart popup with the contents it should contain.
        *
        * If the current course has control data, and the cursor is above the top
        * X-axis, control information is shown instead of whatever other data would
        * be being shown.
        *
        * @param {jQuery.event} event jQuery mouse-move event.
        */
        updatePopupContents(event) {
            let yOffset = event.pageY - $(this.svg.node()).offset().top;
            let showNextControls = this.hasControls && yOffset < MARGIN.top;
            if (showNextControls) {
                this.updateNextControlInformation();
            } else {
                this.popupUpdateFunc();
            }
        }

        /**
        * Updates the next-control information.
        */
        updateNextControlInformation() {
            if (this.hasControls) {
                this.popup.setNextControlData(this.getNextControlData());
            }
        }

        /**
        * Draw a 'control line'.  This is a vertical line running the entire height of
        * the chart, at one of the controls.
        * @param {Number} controlIndex The index of the control at which to draw the
        *                              control line.
        */
        drawControlLine(controlIndex) {
            this.currentControlIndex = controlIndex;
            this.updateResultStatistics();
            let xPosn = this.xScale(this.referenceCumTimes[controlIndex]);
            this.controlLine = this.svgGroup.append("line")
                .attr("x1", xPosn)
                .attr("y1", 0)
                .attr("x2", xPosn)
                .attr("y2", this.contentHeight)
                .attr("class", "controlLine")
                .node();
        }

        /**
        * Updates the location of the control line from the given mouse event.
        * @param {jQuery.event} event jQuery mousedown or mousemove event.
        */
        updateControlLineLocation(event) {

            let svgNodeAsJQuery = $(this.svg.node());
            let offset = svgNodeAsJQuery.offset();
            let xOffset = event.pageX - offset.left;
            let yOffset = event.pageY - offset.top;

            if (this.currentLeftMargin <= xOffset && xOffset < svgNodeAsJQuery.width() - MARGIN.right &&
                yOffset < svgNodeAsJQuery.height() - MARGIN.bottom) {
                // In the chart.
                // Get the time offset that the mouse is currently over.
                let chartX = this.xScale.invert(xOffset - this.currentLeftMargin);
                let bisectIndex = d3.bisect(this.referenceCumTimesSorted, chartX);

                // bisectIndex is the index at which to insert chartX into
                // referenceCumTimes in order to keep the array sorted.  So if
                // this index is N, the mouse is between N - 1 and N.  Find
                // which is nearer.
                let sortedControlIndex;
                if (bisectIndex >= this.referenceCumTimesSorted.length) {
                    // Off the right-hand end, use the last control (usually the
                    // finish).
                    sortedControlIndex = this.referenceCumTimesSorted.length - 1;
                } else {
                    let diffToNext = Math.abs(this.referenceCumTimesSorted[bisectIndex] - chartX);
                    let diffToPrev = Math.abs(chartX - this.referenceCumTimesSorted[bisectIndex - 1]);
                    sortedControlIndex = (diffToPrev < diffToNext) ? bisectIndex - 1 : bisectIndex;
                }

                let controlIndex = this.referenceCumTimeIndexes[sortedControlIndex];

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
        }

        /**
        * Remove any previously-drawn control line.  If no such line existed, nothing
        * happens.
        */
        removeControlLine() {
            this.currentControlIndex = null;
            this.actualControlIndex = null;
            this.updateResultStatistics();
            if (this.controlLine !== null) {
                d3.select(this.controlLine).remove();
                this.controlLine = null;
            }
        }

        /**
        * Returns an array of the the times that the selected results are behind
        * the fastest time at the given control.
        * @param {Number} controlIndex Index of the given control.
        * @param {Array} indexes Array of indexes of selected results.
        * @return {Array} Array of times in seconds that the given results are
        *     behind the fastest time.
        */
        getTimesBehindFastest(controlIndex, indexes) {
            let selectedResults = indexes.map(index => this.courseClassSet.allResults[index]);
            let fastestSplit = this.fastestCumTimes[controlIndex] - this.fastestCumTimes[controlIndex - 1];
            let timesBehind = selectedResults.map(result => { let resultSplit = result.getSplitTimeTo(controlIndex); return (resultSplit === null) ? null : resultSplit - fastestSplit; });
            return timesBehind;
        }

        /**
        * Returns an array of the the time losses of the selected results at the
        * given control.
        * @param {Number} controlIndex Index of the given control.
        * @param {Array} indexes Array of indexes of selected results.
        * @return {Array} Array of times in seconds that the given results are
        *     deemed to have lost at the given control.
        */
        getTimeLosses(controlIndex, indexes) {
            let selectedResults = indexes.map(index => this.courseClassSet.allResults[index]);
            let timeLosses = selectedResults.map(result => result.getTimeLossAt(controlIndex));
            return timeLosses;
        }

        /**
        * Updates the statistics text shown after the results.
        */
        updateResultStatistics() {
            let selectedResults = this.selectedIndexesOrderedByLastYValue.map(index => this.courseClassSet.allResults[index]);
            let labelTexts = selectedResults.map(result => formatNameAndSuffix(result.getOwnerNameForLeg(this.selectedLegIndex), getSuffix(result)));

            if (this.currentControlIndex !== null && this.currentControlIndex > 0) {
                let okDespites = selectedResults.map(result => result.isOKDespiteMissingTimes);
                if (this.visibleStatistics.TotalTime) {
                    let cumTimes = selectedResults.map(result => result.getCumulativeTimeTo(this.currentControlIndex));
                    let cumRanks = selectedResults.map(result => result.getCumulativeRankTo(this.currentControlIndex));
                    labelTexts = d3.zip(labelTexts, cumTimes, cumRanks, okDespites)
                        .map(quad => quad[0] + formatTimeAndRank(quad[1], quad[2], quad[3]));
                }

                if (this.visibleStatistics.SplitTime) {
                    let splitTimes = selectedResults.map(result => result.getSplitTimeTo(this.currentControlIndex));
                    let splitRanks = selectedResults.map(result => result.getSplitRankTo(this.currentControlIndex));
                    labelTexts = d3.zip(labelTexts, splitTimes, splitRanks, okDespites)
                        .map(quad => quad[0] + formatTimeAndRank(quad[1], quad[2], quad[3]));
                }

                if (this.visibleStatistics.BehindFastest) {
                    let timesBehind = this.getTimesBehindFastest(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                    labelTexts = d3.zip(labelTexts, timesBehind, okDespites)
                        .map(triple => triple[0] + SPACER + formatTime((triple[2] && triple[1] === null) ? NaN : triple[1]));
                }

                if (this.visibleStatistics.TimeLoss) {
                    let timeLosses = this.getTimeLosses(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                    labelTexts = d3.zip(labelTexts, timeLosses)
                        .map(pair => pair[0] + SPACER + formatTime(pair[1]));
                }
            }

            // Update the current result data.
            if (this.hasData) {
                this.currentResultData.forEach((data, index) => data.label = labelTexts[index]);
            }

            // This data is already joined to the labels; just update the text.
            d3.selectAll("text.resultLabel").text(data => data.label);
        }

        /**
        * Returns a tick-formatting function that formats the label of a tick on the
        * top X-axis.
        *
        * The function returned is suitable for use with the D3 axis.tickFormat method.
        *
        * @return {Function} Tick-formatting function.
        */
        getTickFormatter() {
            if (this.courseClassSet.hasTeamData()) {
                let allControls = [getMessage("StartNameShort")];
                let numbersOfControls = this.courseClassSet.classes[0].numbersOfControls;
                if (this.selectedLegIndex !== null) {
                    numbersOfControls = [numbersOfControls[this.selectedLegIndex]];
                }

                for (let legIndex = 0; legIndex < numbersOfControls.length; legIndex += 1) {
                    for (let controlIndex = 1; controlIndex <= numbersOfControls[legIndex]; controlIndex += 1) {
                        allControls.push(controlIndex.toString());
                    }
                    allControls.push(getMessage("FinishNameShort"));
                }

                return (value, idx) => allControls[idx];
            }
            else {
                return (value, idx) =>
                    (idx === 0) ? getMessage("StartNameShort") : ((idx === this.numControls + 1) ? getMessage("FinishNameShort") : idx.toString());
            }
        }

        /**
        * Get the width of a piece of text.
        * @param {String} text The piece of text to measure the width of.
        * @return {Number} The width of the piece of text, in pixels.
        */
        getTextWidth(text) {
            return this.textSizeElement.text(text).node().getBBox().width;
        }

        /**
        * Gets the height of a piece of text.
        *
        * @param {String} text The piece of text to measure the height of.
        * @return {Number} The height of the piece of text, in pixels.
        */
        getTextHeight(text) {
            return this.textSizeElement.text(text).node().getBBox().height;
        }

        /**
        * Return the maximum width of the end-text shown to the right of the graph.
        *
        * This function considers only the results whose indexes are in the list
        * given.  This method returns zero if the list is empty.
        * @return {Number} Maximum width of text, in pixels.
        */
        getMaxGraphEndTextWidth() {
            if (this.selectedIndexes.length === 0) {
                // No results selected.  Avoid problems caused by trying to find
                // the maximum of an empty array.
                return 0;
            } else {
                let nameWidths = this.selectedIndexes.map(index => {
                    let result = this.courseClassSet.allResults[index];
                    return this.getTextWidth(formatNameAndSuffix(result.getOwnerNameForLeg(this.selectedLegIndex), getSuffix(result)));
                });
                return d3.max(nameWidths) + this.determineMaxStatisticTextWidth();
            }
        }

        /**
        * Return the maximum width of a piece of time and rank text shown to the right
        * of each result.
        * @param {String} timeFuncName Name of the function to call to get the time
        *                               data.
        * @param {String} rankFuncName Name of the function to call to get the rank
        *                               data.
        * @return {Number} Maximum width of split-time and rank text, in pixels.
        */
        getMaxTimeAndRankTextWidth(timeFuncName, rankFuncName) {
            let maxTime = 0;
            let maxRank = 0;

            let selectedResults = this.selectedIndexes.map(index => this.courseClassSet.allResults[index]);

            d3.range(1, this.numControls + 2).forEach(controlIndex => {
                let times = selectedResults.map(result => result[timeFuncName](controlIndex));
                maxTime = Math.max(maxTime, maxNonNullNorNaNValue(times));

                let ranks = selectedResults.map(result => result[rankFuncName](controlIndex));
                maxRank = Math.max(maxRank, maxNonNullNorNaNValue(ranks));
            });

            let text = formatTimeAndRank(maxTime, maxRank);
            return this.getTextWidth(text);
        }

        /**
        * Return the maximum width of the split-time and rank text shown to the right
        * of each result.
        * @return {Number} Maximum width of split-time and rank text, in pixels.
        */
        getMaxSplitTimeAndRankTextWidth() {
            return this.getMaxTimeAndRankTextWidth("getSplitTimeTo", "getSplitRankTo");
        }

        /**
        * Return the maximum width of the cumulative time and cumulative-time rank text
        * shown to the right of each result.
        * @return {Number} Maximum width of cumulative time and cumulative-time rank text, in
        *                  pixels.
        */
        getMaxCumulativeTimeAndRankTextWidth() {
            return this.getMaxTimeAndRankTextWidth("getCumulativeTimeTo", "getCumulativeRankTo");
        }

        /**
        * Return the maximum width of the behind-fastest time shown to the right of
        * each result.
        * @return {Number} Maximum width of behind-fastest time rank text, in pixels.
        */
        getMaxTimeBehindFastestWidth() {
            let maxTime = 0;

            for (let controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
                let times = this.getTimesBehindFastest(controlIndex, this.selectedIndexes);
                maxTime = Math.max(maxTime, maxNonNullNorNaNValue(times));
            }

            return this.getTextWidth(SPACER + formatTime(maxTime));
        }
        /**
            * Return the maximum width of the behind-fastest time shown to the right of
            * each result.
            * @return {Number} Maximum width of behind-fastest time rank text, in pixels.
            */
        getMaxTimeLossWidth() {
            let maxTimeLoss = 0;
            let minTimeLoss = 0;
            for (let controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
                let timeLosses = this.getTimeLosses(controlIndex, this.selectedIndexes);
                let nonNullTimeLosses = timeLosses.filter(isNotNullNorNaN);
                if (nonNullTimeLosses.length > 0) {
                    maxTimeLoss = Math.max(maxTimeLoss, d3.max(nonNullTimeLosses));
                    minTimeLoss = Math.min(minTimeLoss, d3.min(nonNullTimeLosses));
                }
            }

            return Math.max(
                this.getTextWidth(SPACER + formatTime(maxTimeLoss)),
                this.getTextWidth(SPACER + formatTime(minTimeLoss))
            );
        }

        /**
        * Determines the maximum width of the statistics text at the end of the result.
        * @return {Number} Maximum width of the statistics text, in pixels.
        */
        determineMaxStatisticTextWidth() {
            let maxWidth = 0;
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
        }

        /**
        * Determines the maximum width of all of the visible start time labels.
        * If none are presently visible, zero is returned.
        * @param {Object} chartData Object containing the chart data.
        * @return {Number} Maximum width of a start time label.
        */
        determineMaxStartTimeLabelWidth(chartData) {
            let maxWidth;
            if (chartData.resultNames.length > 0) {
                maxWidth = d3.max(chartData.resultNames.map(name => this.getTextWidth(`00:00:00 ${name}`)));
            } else {
                maxWidth = 0;
            }

            return maxWidth;
        }

        /**
        * Creates the X and Y scales necessary for the chart and its axes.
        * @param {Object} chartData Chart data object.
        */
        createScales(chartData) {
            this.xScale = d3.scaleLinear().domain(chartData.xExtent).range([0, this.contentWidth]);
            this.yScale = d3.scaleLinear().domain(chartData.yExtent).range([0, this.contentHeight]);
            this.xScaleMinutes = d3.scaleLinear().domain([chartData.xExtent[0] / 60, chartData.xExtent[1] / 60]).range([0, this.contentWidth]);
        }

        /**
        * Draw the background rectangles that indicate sections of the course
        * between controls.
        */
        drawBackgroundRectangles() {

            // We can't guarantee that the reference cumulative times are in
            // ascending order, but we need such a list of times in order to draw
            // the rectangles.  So, sort the reference cumulative times.
            let refCumTimesSorted = this.courseClassSet.sliceForLegIndex(this.referenceCumTimes, this.selectedLegIndex);
            refCumTimesSorted.sort(d3.ascending);

            // Now remove any duplicate times.
            let index = 1;
            while (index < refCumTimesSorted.length) {
                if (refCumTimesSorted[index] === refCumTimesSorted[index - 1]) {
                    refCumTimesSorted.splice(index, 1);
                } else {
                    index += 1;
                }
            }

            let rects = this.svgGroup.selectAll("rect")
                .data(d3.range(refCumTimesSorted.length - 1));

            rects.enter().append("rect");

            let backgroundIndexes = [];
            let numbersOfControls = (this.courseClassSet.hasTeamData()) ? this.courseClassSet.classes[0].numbersOfControls : [this.courseClassSet.numControls];
            if (this.courseClassSet.hasTeamData() && this.selectedLegIndex !== null) {
                numbersOfControls = [numbersOfControls[this.selectedLegIndex]];
            }

            for (let legIndex = 0; legIndex < numbersOfControls.length; legIndex += 1) {
                for (let controlIndex = 0; controlIndex <= numbersOfControls[legIndex]; controlIndex += 1) {
                    backgroundIndexes.push(1 + controlIndex % 2 + ((legIndex + (this.selectedLegIndex || 0)) % 2) * 2);
                }
            }

            rects = this.svgGroup.selectAll("rect")
                .data(d3.range(refCumTimesSorted.length - 1));
            rects.attr("x", index => this.xScale(refCumTimesSorted[index]))
                .attr("y", 0)
                .attr("width", index => this.xScale(refCumTimesSorted[index + 1]) - this.xScale(refCumTimesSorted[index]))
                .attr("height", this.contentHeight)
                .attr("class", index => `background${backgroundIndexes[index]}`);

            rects.exit().remove();
        }

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
        determineYAxisTickFormatter(chartData) {
            if (this.isRaceGraph) {
                // Assume column 0 of the data is the start times.
                // However, beware that there might not be any data.
                let startTimes = (chartData.dataColumns.length === 0) ? [] : chartData.dataColumns[0].ys;
                if (startTimes.length === 0) {
                    // No start times - draw all tick marks.
                    return time => formatTimeOfDay(time * 60);
                } else {
                    // Some start times are to be drawn - only draw tick marks if
                    // they are far enough away from results.
                    let yScale = this.yScale;
                    return time => {
                        let nearestOffset = d3.min(startTimes.map(startTime => Math.abs(yScale(startTime) - yScale(time))));
                        return (nearestOffset >= MIN_RESULT_TICK_MARK_DISTANCE) ? formatTimeOfDay(Math.round(time * 60)) : "";
                    };
                }
            } else {
                // Use the default d3 tick formatter.
                return null;
            }
        }

        /**
        * Draw the chart axes.
        * @param {String} yAxisLabel The label to use for the Y-axis.
        * @param {Object} chartData The chart data to use.
        */
        drawAxes(yAxisLabel, chartData) {

            let tickFormatter = this.determineYAxisTickFormatter(chartData);

            let xAxis = d3.axisTop()
                .scale(this.xScale)
                .tickFormat(this.getTickFormatter())
                .tickValues(this.courseClassSet.sliceForLegIndex(this.referenceCumTimes, this.selectedLegIndex));

            let yAxis = d3.axisLeft()
                .scale(this.yScale)
                .tickFormat(tickFormatter);

            let lowerXAxis = d3.axisBottom()
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
                .attr("transform", `translate(0,${this.contentHeight})`)
                .call(lowerXAxis)
                .append("text")
                .attr("x", 60)
                .attr("y", -5)
                .style("text-anchor", "start")
                .style("fill", "black")
                .text(getMessage("LowerXAxisChartLabel"));
        }

        /**
        * Draw the lines on the chart.
        * @param {Array} chartData Array of chart data.
        */
        drawChartLines(chartData) {
            let lineFunctionGenerator = selResultIdx => {
                if (!chartData.dataColumns.some(col => isNotNullNorNaN(col.ys[selResultIdx]))) {
                    // This result's entire row is null/NaN, so there's no data to
                    // draw.  WebKit will report an error ('Error parsing d=""') if
                    // no points on the line are defined, as will happen in this
                    // case, so we substitute a single zero point instead.
                    return d3.line()
                        .x(0)
                        .y(0)
                        .defined((d, i) => i === 0);
                }
                else {
                    return d3.line()
                        .x(d => this.xScale(d.x))
                        .y(d => this.yScale(d.ys[selResultIdx]))
                        .defined(d => isNotNullNorNaN(d.ys[selResultIdx]));
                }
            };

            this.svgGroup.selectAll("path.graphLine").remove();

            this.svgGroup.selectAll("line.aroundOmittedTimes").remove();

            d3.range(this.numLines).forEach(selResultIdx => {
                let strokeColour = colours[this.selectedIndexes[selResultIdx] % colours.length];
                let highlighter = () => this.highlight(this.selectedIndexes[selResultIdx]);
                let unhighlighter = () => this.unhighlight();

                this.svgGroup.append("path")
                    .attr("d", lineFunctionGenerator(selResultIdx)(chartData.dataColumns))
                    .attr("stroke", strokeColour)
                    .attr("class", `graphLine result${this.selectedIndexes[selResultIdx]}`)
                    .on("mouseenter", highlighter)
                    .on("mouseleave", unhighlighter)
                    .append("title")
                    .text(chartData.resultNames[selResultIdx]);

                chartData.dubiousTimesInfo[selResultIdx].forEach(dubiousTimeInfo => {
                    this.svgGroup.append("line")
                        .attr("x1", this.xScale(chartData.dataColumns[dubiousTimeInfo.start].x))
                        .attr("y1", this.yScale(chartData.dataColumns[dubiousTimeInfo.start].ys[selResultIdx]))
                        .attr("x2", this.xScale(chartData.dataColumns[dubiousTimeInfo.end].x))
                        .attr("y2", this.yScale(chartData.dataColumns[dubiousTimeInfo.end].ys[selResultIdx]))
                        .attr("stroke", strokeColour)
                        .attr("class", `aroundOmittedTimes result${this.selectedIndexes[selResultIdx]}`)
                        .on("mouseenter", highlighter)
                        .on("mouseleave", unhighlighter)
                        .append("title")
                        .text(chartData.resultNames[selResultIdx]);
                });
            });
        }

        /**
        * Highlights the result with the given index.
        * @param {Number} resultIdx The index of the result to highlight.
        */
        highlight(resultIdx) {
            this.svg.selectAll("path.graphLine.result" + resultIdx).classed("selected", true);
            this.svg.selectAll("line.resultLegendLine.result" + resultIdx).classed("selected", true);
            this.svg.selectAll("text.resultLabel.result" + resultIdx).classed("selected", true);
            this.svg.selectAll("text.startLabel.result" + resultIdx).classed("selected", true);
            this.svg.selectAll("line.aroundOmittedTimes.result" + resultIdx).classed("selected", true);
        }

        /**
        * Removes any result-specific higlighting.
        */
        unhighlight() {
            this.svg.selectAll("path.graphLine.selected").classed("selected", false);
            this.svg.selectAll("line.resultLegendLine.selected").classed("selected", false);
            this.svg.selectAll("text.resultLabel.selected").classed("selected", false);
            this.svg.selectAll("text.startLabel.selected").classed("selected", false);
            this.svg.selectAll("line.aroundOmittedTimes.selected").classed("selected", false);
        }

        /**
        * Draws the start-time labels for the currently-selected results.
        * @param {Object} chartData The chart data that contains the start offsets.
        */
        drawResultStartTimeLabels(chartData) {
            let startColumn = chartData.dataColumns[0];
            let startLabels = this.svgGroup.selectAll("text.startLabel").data(this.selectedIndexes);

            startLabels.enter().append("text")
                .classed("startLabel", true);

            startLabels = this.svgGroup.selectAll("text.startLabel").data(this.selectedIndexes);
            startLabels.attr("x", -7)
                .attr("y", (_resultIndex, selResultIndex) => this.yScale(startColumn.ys[selResultIndex]) + this.getTextHeight(chartData.resultNames[selResultIndex]) / 4)
                .attr("class", resultIndex => `startLabel result${resultIndex}`)
                .on("mouseenter", resultIndex => this.highlight(resultIndex))
                .on("mouseleave", () => this.unhighlight())
                .text((_resultIndex, selResultIndex) => formatTimeOfDay(Math.round(startColumn.ys[selResultIndex] * 60)) + " " + chartData.resultNames[selResultIndex]);

            startLabels.exit().remove();
        }

        /**
        * Removes all of the result start-time labels from the chart.
        */
        removeResultStartTimeLabels() {
            this.svgGroup.selectAll("text.startLabel").remove();
        }

        /**
        * Adjust the locations of the legend labels downwards so that two labels
        * do not overlap.
        */
        adjustResultLegendLabelsDownwardsIfNecessary() {
            for (let i = 1; i < this.numLines; i += 1) {
                let prevResult = this.currentResultData[i - 1];
                let thisResult = this.currentResultData[i];
                if (thisResult.y < prevResult.y + prevResult.textHeight) {
                    thisResult.y = prevResult.y + prevResult.textHeight;
                }
            }
        }

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
        adjustResultLegendLabelsUpwardsIfNecessary(minLastY) {
            if (this.numLines > 0 && this.currentResultData[this.numLines - 1].y > this.contentHeight) {
                // The list of results runs off the bottom.
                // Put the last result at the bottom, or at its minimum Y-offset,
                // whichever is larger, and move all labels up as much as we can.
                this.currentResultData[this.numLines - 1].y = Math.max(minLastY, this.contentHeight);
                for (let i = this.numLines - 2; i >= 0; i -= 1) {
                    let nextResult = this.currentResultData[i + 1];
                    let thisResult = this.currentResultData[i];
                    if (thisResult.y + thisResult.textHeight > nextResult.y) {
                        thisResult.y = nextResult.y - thisResult.textHeight;
                    } else {
                        // No more adjustments need to be made.
                        break;
                    }
                }
            }
        }

        /**
        * Draw legend labels to the right of the chart.
        * Draw legend labels to the right of the chart.
        * @param {Object} chartData The chart data that contains the final time offsets.
        */
        drawResultLegendLabels(chartData) {

            let minLastY = 0;
            if (chartData.dataColumns.length === 0) {
                this.currentResultData = [];
            } else {
                let finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
                this.currentResultData = d3.range(this.numLines).map(i => {
                    let resultIndex = this.selectedIndexes[i];
                    let name = this.courseClassSet.allResults[resultIndex].getOwnerNameForLeg(this.selectedLegIndex);
                    let textHeight = this.getTextHeight(name);
                    minLastY += textHeight;
                    return {
                        label: formatNameAndSuffix(name, getSuffix(this.courseClassSet.allResults[resultIndex])),
                        textHeight: textHeight,
                        y: (isNotNullNorNaN(finishColumn.ys[i])) ? this.yScale(finishColumn.ys[i]) : null,
                        colour: colours[resultIndex % colours.length],
                        index: resultIndex
                    };
                });

                minLastY -= this.currentResultData[this.numLines - 1].textHeight;

                // Draw the mispunchers at the bottom of the chart, with the last
                // one of them at the bottom.
                let lastMispuncherY = null;
                for (let selResultIdx = this.numLines - 1; selResultIdx >= 0; selResultIdx -= 1) {
                    if (this.currentResultData[selResultIdx].y === null) {
                        this.currentResultData[selResultIdx].y = (lastMispuncherY === null) ? this.contentHeight : lastMispuncherY - this.currentResultData[selResultIdx].textHeight;
                        lastMispuncherY = this.currentResultData[selResultIdx].y;
                    }
                }
            }

            // Sort by the y-offset values, which doesn't always agree with the end
            // positions of the results.
            this.currentResultData.sort((a, b) => a.y - b.y);

            this.selectedIndexesOrderedByLastYValue = this.currentResultData.map(result => result.index);

            this.adjustResultLegendLabelsDownwardsIfNecessary();

            this.adjustResultLegendLabelsUpwardsIfNecessary(minLastY);

            let legendLines = this.svgGroup.selectAll("line.resultLegendLine").data(this.currentResultData);
            legendLines.enter().append("line").classed("resultLegendLine", true);

            legendLines = this.svgGroup.selectAll("line.resultLegendLine").data(this.currentResultData);
            legendLines.attr("x1", this.contentWidth + 1)
                .attr("y1", data => data.y)
                .attr("x2", this.contentWidth + LEGEND_LINE_WIDTH + 1)
                .attr("y2", data => data.y)
                .attr("stroke", data => data.colour)
                .attr("class", data => `resultLegendLine result${data.index}`)
                .on("mouseenter", data => this.highlight(data.index))
                .on("mouseleave", () => this.unhighlight());

            legendLines.exit().remove();

            let labels = this.svgGroup.selectAll("text.resultLabel").data(this.currentResultData);
            labels.enter().append("text").classed("resultLabel", true);

            labels = this.svgGroup.selectAll("text.resultLabel").data(this.currentResultData);
            labels.attr("x", this.contentWidth + LEGEND_LINE_WIDTH + 2)
                .attr("y", data => data.y + data.textHeight / 4)
                .attr("class", data => `resultLabel result${data.index}`)
                .on("mouseenter", data => this.highlight(data.index))
                .on("mouseleave", () => this.unhighlight())
                .text(data => data.label);

            labels.exit().remove();
        }

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
        adjustContentSize() {
            // Extra length added to the maximum start-time label width to
            // include the lengths of the Y-axis ticks.
            let EXTRA_MARGIN = 8;
            let maxTextWidth = this.getMaxGraphEndTextWidth();
            this.setLeftMargin(Math.max(this.maxStartTimeLabelWidth + EXTRA_MARGIN, MARGIN.left));
            this.contentWidth = Math.max(this.overallWidth - this.currentLeftMargin - MARGIN.right - maxTextWidth - (LEGEND_LINE_WIDTH + 2), 100);
            this.contentHeight = Math.max(this.overallHeight - MARGIN.top - MARGIN.bottom, 100);
        }

        /**
        * Sets the overall size of the chart control, including margin, axes and legend labels.
        * @param {Number} overallWidth Overall width
        * @param {Number} overallHeight Overall height
        */
        setSize(overallWidth, overallHeight) {
            this.overallWidth = overallWidth;
            this.overallHeight = overallHeight;
            $(this.svg.node()).width(overallWidth).height(overallHeight);
            this.adjustContentSize();
        }

        /**
        * Clears the graph by removing all controls from it.
        */
        clearGraph() {
            this.svgGroup.selectAll("*").remove();
        }

        /**
        * Sorts the reference cumulative times, and creates a list of the sorted
        * reference cumulative times and their indexes into the actual list of
        * reference cumulative times.
        *
        * This sorted list is used by the chart to find which control the cursor
        * is closest to.
        */
        sortReferenceCumTimes() {
            // Put together a map that maps cumulative times to the first split to
            // register that time.
            let cumTimesToControlIndex = new Map();
            this.referenceCumTimes.forEach((cumTime, index) => {
                if (!cumTimesToControlIndex.has(cumTime)) {
                    cumTimesToControlIndex.set(cumTime, index);
                }
            });

            // Sort and deduplicate the reference cumulative times.
            this.referenceCumTimesSorted = this.referenceCumTimes.slice(0);
            this.referenceCumTimesSorted.sort(d3.ascending);
            for (let index = this.referenceCumTimesSorted.length - 1; index > 0; index -= 1) {
                if (this.referenceCumTimesSorted[index] === this.referenceCumTimesSorted[index - 1]) {
                    this.referenceCumTimesSorted.splice(index, 1);
                }
            }

            this.referenceCumTimeIndexes = this.referenceCumTimesSorted.map(cumTime => cumTimesToControlIndex.get(cumTime));
        }

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
        drawChart(data, selectedIndexes, visibleStatistics, chartType, selectedLegIndex) {
            let chartData = data.chartData;
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
        }
    }

    /**
    * Returns the maximum value from the given array, not including any null or
    * NaN values.  If the array contains no non-null, non-NaN values, zero is
    * returned.
    * @param {Array} values Array of values.
    * @return {Number} Maximum non-null or NaN value.
    */
    function maxNonNullNorNaNValue(values) {
        let nonNullNorNaNValues = values.filter(isNotNullNorNaN);
        return (nonNullNorNaNValues.length > 0) ? d3.max(nonNullNorNaNValues) : 0;
    }

    SplitsBrowser.Controls.Chart = Chart;
})();
