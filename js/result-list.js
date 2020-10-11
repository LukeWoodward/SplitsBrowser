/*
 *  SplitsBrowser ResultList - Lists the results down the left side.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
(function (){
    "use strict";

    // ID of the result list div.
    // Must match that used in styles.css.
    var RESULT_LIST_ID = "resultList";

    // The number that identifies the left mouse button.
    var LEFT_BUTTON = 1;

    // Dummy index used to represent the mouse being let go off the bottom of
    // the list of results.
    var CONTAINER_RESULT_INDEX = -1;

    // ID of the container that contains the list and the filter textbox.
    var RESULT_LIST_CONTAINER_ID = "resultListContainer";

    // Prefix showing which runner in a tooltip is currently shown.
    var SELECTED_RUNNER_TOOLTIP_PREFIX = "> ";

    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    /**
    * Object that controls a list of results from which the user can select.
    * @constructor
    * @param {HTMLElement} parent Parent element to add this list to.
    * @param {Function} alerter Function to call to issue an alert message.
    */
    var ResultList = function (parent, alerter) {
        this.parent = parent;
        this.alerter = alerter;
        this.handler = null;
        this.resultSelection = null;
        this.lastFilterString = "";
        this.allResults = [];
        this.allResultDetails = [];
        this.dragging = false;
        this.dragStartResultIndex = null;
        this.currentDragResultIndex = null;
        this.allResultDivs = [];
        this.inverted = false;
        this.hasTeamData = false;
        this.selectedLegIndex = null;
        this.placeholderDiv = null;

        this.changeHandlers = [];

        this.containerDiv = d3.select(parent).append("div")
                                             .attr("id", RESULT_LIST_CONTAINER_ID);

        this.buttonsPanel = this.containerDiv.append("div");

        var outerThis = this;
        this.allButton = this.buttonsPanel.append("button")
                                          .attr("id", "selectAllResults")
                                          .style("width", "50%")
                                          .on("click", function () { outerThis.selectAllFiltered(); });

        this.noneButton = this.buttonsPanel.append("button")
                                           .attr("id", "selectNoResults")
                                           .style("width", "50%")
                                           .on("click", function () { outerThis.selectNoneFiltered(); });

        // Wire up double-click event with jQuery for easier testing.
        $(this.noneButton.node()).dblclick(function () { outerThis.selectNone(); });

        this.buttonsPanel.append("br");

        this.crossingRunnersButton = this.buttonsPanel.append("button")
                                                      .attr("id", "selectCrossingRunners")
                                                      .style("width", "100%")
                                                      .on("click", function () { outerThis.selectCrossingRunners(); })
                                                      .style("display", "none");

        this.filter = this.buttonsPanel.append("input")
                                       .attr("type", "text");

        // Update the filtered list of result on any change to the contents of
        // the filter textbox.  The last two are for the benefit of IE9 which
        // doesn't fire the input event upon text being deleted via selection
        // or the X button at the right.  Instead, we use delayed updates to
        // filter on key-up and mouse-up, which I believe *should* catch every
        // change.  It's not a problem to update the filter too often: if the
        // filter text hasn't changed, nothing happens.
        this.filter.on("input", function () { outerThis.updateFilterIfChanged(); })
                   .on("keyup", function () { outerThis.updateFilterIfChangedDelayed(); })
                   .on("mouseup", function () { outerThis.updateFilterIfChangedDelayed(); });

        this.listDiv = this.containerDiv.append("div")
                                        .attr("id", RESULT_LIST_ID);

        this.listDiv.on("mousedown", function (event) { outerThis.startDrag(event, CONTAINER_RESULT_INDEX); })
                    .on("mousemove", function (event) { outerThis.mouseMove(event, CONTAINER_RESULT_INDEX); })
                    .on("mouseup", function (event) { outerThis.stopDrag(event); });

        d3.select(document.body).on("mouseup", function (event) { outerThis.stopDrag(event); });

        this.setMessages();
    };

    /**
    * Sets messages within this control, following either its creation or a
    * change of language.
    */
    ResultList.prototype.setMessages = function () {
        this.allButton.text(getMessage("SelectAllCompetitors"));
        this.noneButton.text(getMessage("SelectNoCompetitors"));
        this.crossingRunnersButton.text(getMessage("SelectCrossingRunners"));
        this.filter.attr("placeholder", getMessage("CompetitorListFilter"));
    };

    /**
    * Retranslates this control following a change of language.
    */
    ResultList.prototype.retranslate = function () {
        this.setMessages();
        if (this.placeholderDiv !== null) {
            this.setPlaceholderDivText();
            this.fireChangeHandlers();
        }
    };

    /**
    * Sets the text in the placeholder div shown when the list of results
    * contains only non-starters.
    */
    ResultList.prototype.setPlaceholderDivText = function () {
        this.placeholderDiv.text(getMessage((this.hasTeamData) ? "NoTeamsStarted" : "NoCompetitorsStarted"));
    };

    /**
    * Register a handler to be called whenever the filter text changes.
    *
    * When a change is made, this function will be called, with no arguments.
    *
    * If the handler has already been registered, nothing happens.
    *
    * @param {Function} handler The handler to register.
    */
    ResultList.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Unregister a handler from being called when the filter text changes.
    *
    * If the handler given was never registered, nothing happens.
    *
    * @param {Function} handler The handler to register.
    */
    ResultList.prototype.deregisterChangeHandler = function (handler) {
        var index = this.changeHandlers.indexOf(handler);
        if (index > -1) {
            this.changeHandlers.splice(index, 1);
        }
    };

    /**
    * Fires all of the change handlers currently registered.
    */
    ResultList.prototype.fireChangeHandlers = function () {
        this.changeHandlers.forEach(function (handler) { handler(); }, this);
    };

    /**
    * Returns whether the current mouse event is off the bottom of the list of
    * result divs.
    * @param {Event} event The event.
    * @return {Boolean} True if the mouse is below the last visible div, false
    *     if not.
    */
    ResultList.prototype.isMouseOffBottomOfResultList = function (event) {
        return this.lastVisibleDiv === null || d3.pointer(event)[1] >= $(this.lastVisibleDiv).height();
    };

    /**
    * Returns the name of the CSS class to apply to result divs currently
    * part of the selection/deselection.
    * @return {String} CSS class name;
    */
    ResultList.prototype.getDragClassName = function () {
        return (this.inverted) ? "dragDeselected" : "dragSelected";
    };

    /**
    * Handles the start of a drag over the list of results.
    * @param {Event} event The mouse event.
    * @param {Number} index Index of the result div that the drag started
    *     over, or RESULT_CONTAINER_INDEX if below the list of results.
    */
    ResultList.prototype.startDrag = function (event, index) {
        if (event.which === LEFT_BUTTON) {
            this.dragStartResultIndex = index;
            this.currentDragResultIndex = index;
            this.allResultDivs = $("div.result");
            var visibleDivs = this.allResultDivs.filter(":visible");
            this.lastVisibleDiv = (visibleDivs.length === 0) ? null : visibleDivs[visibleDivs.length - 1];
            this.inverted = event.shiftKey;
            if (index === CONTAINER_RESULT_INDEX) {
                // Drag not starting on one of the results.
                if (!this.isMouseOffBottomOfResultList(event)) {
                    // User has started the drag in the scrollbar.  Ignore it.
                    return;
                }
            } else {
                d3.select(this.allResultDivs[index]).classed(this.getDragClassName(), true);
            }

            event.stopPropagation();
            this.dragging = true;
        }
    };

    /**
    * Handles a mouse-move event. by adjust the range of dragged results to
    * include the current index.
    * @param {Event} event The event.
    * @param {Number} dragIndex The index to which the drag has now moved.
    */
    ResultList.prototype.mouseMove = function (event, dragIndex) {
        if (this.dragging) {
            event.stopPropagation();
            if (dragIndex !== this.currentDragResultIndex) {
                var dragClassName = this.getDragClassName();
                d3.selectAll("div.result." + dragClassName).classed(dragClassName, false);

                if (this.dragStartResultIndex === CONTAINER_RESULT_INDEX && dragIndex === CONTAINER_RESULT_INDEX) {
                    // Drag is currently all off the list, so do nothing further.
                    return;
                } else if (dragIndex === CONTAINER_RESULT_INDEX && !this.isMouseOffBottomOfResultList(event)) {
                    // Drag currently goes onto the div's scrollbar.
                    return;
                }

                var leastIndex, greatestIndex;
                if (this.dragStartResultIndex === CONTAINER_RESULT_INDEX || dragIndex === CONTAINER_RESULT_INDEX) {
                    // One of the ends is off the bottom.
                    leastIndex = this.dragStartResultIndex + dragIndex - CONTAINER_RESULT_INDEX;
                    greatestIndex = this.allResultDivs.length - 1;
                } else {
                    leastIndex = Math.min(this.dragStartResultIndex, dragIndex);
                    greatestIndex  = Math.max(this.dragStartResultIndex, dragIndex);
                }

                var selectedResults = [];
                for (var index = leastIndex; index <= greatestIndex; index += 1) {
                    if (this.allResultDetails[index].visible) {
                        selectedResults.push(this.allResultDivs[index]);
                    }
                }

                d3.selectAll(selectedResults).classed(dragClassName, true);
                this.currentDragResultIndex = dragIndex;
            }
        }
    };

    /**
    * Handles the end of a drag in the result list.
    * @param {Event} event The event.
    */
    ResultList.prototype.stopDrag = function (event) {
        if (!this.dragging) {
            // This handler is wired up to mouseUp on the entire document, in
            // order to cancel the drag if it is let go away from the list.  If
            // we're not dragging then we have a mouse-up after a mouse-down
            // somewhere outside of this result list.  Ignore it.
            return;
        }

        this.dragging = false;

        var selectedResultIndexes = [];
        var dragClassName = this.getDragClassName();
        for (var index = 0; index < this.allResultDivs.length; index += 1) {
            if ($(this.allResultDivs[index]).hasClass(dragClassName)) {
                selectedResultIndexes.push(index);
            }
        }

        d3.selectAll("div.result." + dragClassName).classed(dragClassName, false);

        if (event.currentTarget === document) {
            // Drag ended outside the list.
        } else if (this.currentDragResultIndex === CONTAINER_RESULT_INDEX && !this.isMouseOffBottomOfResultList(event)) {
            // Drag ended in the scrollbar.
        } else if (selectedResultIndexes.length === 1) {
            // User clicked, or maybe dragged within the same result.
            this.toggleResult(selectedResultIndexes[0]);
        } else if (this.inverted) {
            this.resultSelection.bulkDeselect(selectedResultIndexes);
        } else {
            this.resultSelection.bulkSelect(selectedResultIndexes);
        }

        this.dragStartResultIndex = null;
        this.currentDragResultIndex = null;

        event.stopPropagation();
    };

    /**
    * Returns the width of the list, in pixels.
    * @return {Number} Width of the list.
    */
    ResultList.prototype.width = function () {
        return $(this.containerDiv.node()).width();
    };

    /**
    * Sets the overall height of the result list.
    * @param {Number} height The height of the control, in pixels.
    */
    ResultList.prototype.setHeight = function (height) {
        $(this.listDiv.node()).height(height - $(this.buttonsPanel.node()).height());
    };

    /**
    * Returns all visible indexes.  This is the indexes of all results that
    * have not been excluded by the filters.
    * @return {Array} Array of indexes of visible results.
    */
    ResultList.prototype.getAllVisibleIndexes = function () {
        return d3.range(this.allResultDetails.length).filter(function (index) {
            return this.allResultDetails[index].visible;
        }, this);
    };

    /**
    * Selects all of the result that are matched by the filter.
    */
    ResultList.prototype.selectAllFiltered = function () {
        this.resultSelection.bulkSelect(this.getAllVisibleIndexes());
    };

    /**
    * Selects none of the results that are matched by the filter.
    */
    ResultList.prototype.selectNoneFiltered = function () {
        this.resultSelection.bulkDeselect(this.getAllVisibleIndexes());
    };

    /**
    * Selects none of the results at all.
    */
    ResultList.prototype.selectNone = function () {
        this.resultSelection.selectNone();
    };

    /**
    * Returns whether the result with the given index is selected.
    * @param {Number} index Index of the result within the list.
    * @return {Boolean} True if the result is selected, false if not.
    */
    ResultList.prototype.isSelected = function (index) {
        return this.resultSelection !== null && this.resultSelection.isSelected(index);
    };

    /**
    * Select all of the results that cross the unique selected result.
    */
    ResultList.prototype.selectCrossingRunners = function () {
        this.resultSelection.selectCrossingRunners(this.allResultDetails, this.selectedLegIndex);
        if (this.resultSelection.isSingleRunnerSelected()) {
            // Only a single runner is still selected, so nobody crossed the
            // selected runner.
            var resultName = this.allResults[this.resultSelection.getSingleRunnerIndex()].getOwnerNameForLeg(this.selectedLegIndex);
            var filterInEffect = (this.lastFilterString.length > 0);
            var messageKey = (filterInEffect) ? "RaceGraphNoCrossingRunnersFiltered" : "RaceGraphNoCrossingRunners";
            this.alerter(getMessageWithFormatting(messageKey, {"$$NAME$$": resultName}));
        }
    };

    /**
    * Enables or disables the crossing-runners button as appropriate.
    */
    ResultList.prototype.enableOrDisableCrossingRunnersButton = function () {
        this.crossingRunnersButton.node().disabled = !this.resultSelection.isSingleRunnerSelected();
    };

    /**
    * Sets the chart type, so that the result list knows whether to show or
    * hide the Crossing Runners button.
    * @param {Object} chartType The chart type selected.
    */
    ResultList.prototype.setChartType = function (chartType) {
        this.crossingRunnersButton.style("display", (chartType.isRaceGraph) ? "block" : "none");
    };

    /**
    * Handles a change to the selection of results, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    */
    ResultList.prototype.selectionChanged = function () {
        var outerThis = this;
        this.listDiv.selectAll("div.result")
                    .data(d3.range(this.resultSelection.count))
                    .classed("selected", function (result, index) { return outerThis.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a result.
    * @param {Number} index The index of the result to toggle.
    */
    ResultList.prototype.toggleResult = function (index) {
        this.resultSelection.toggle(index);
    };

    /**
    * 'Normalise' a name or a search string into a common format.
    *
    * This is used before searching: a name matches a search string if the
    * normalised name contains the normalised search string.
    *
    * At present, the normalisations carried out are:
    * * Conversion to lower case
    * * Removing all non-alphanumeric characters.
    *
    * @param {String} name The name to normalise.
    * @return {String} The normalised names.
    */
    function normaliseName(name) {
        return name.toLowerCase().replace(/\W/g, "");
    }

    /**
    * Formats a tooltip for a team.
    * @param {Result} result The result to format the tooltip for
    * @return {String} The formatted tooltip contents.
    */
    ResultList.prototype.formatTooltip = function(result) {
        var names = [result.owner.name];
        result.owner.members.forEach(function (competitor) { names.push(competitor.name); });

        var nameIndex = (this.selectedLegIndex === null) ? 0 : this.selectedLegIndex + 1;
        names[nameIndex] = SELECTED_RUNNER_TOOLTIP_PREFIX + names[nameIndex];
        return names.join("\n");
    };

    /**
    * Sets the list of results.
    * @param {Array} results Array of result data.
    * @param {Boolean} multipleClasses Whether the list of results is
    *      made up from those in multiple classes.
    * @param {Boolean} hasTeamData Whether the list of results shows
    *      team data as opposed to individual data.
    * @param {Number|null} selectedLegIndex The selected leg index, or
    *      null to show the team.
    */
    ResultList.prototype.setResultList = function (results, multipleClasses, hasTeamData, selectedLegIndex) {
        /**
        * Returns the text to show for a result's name.
        * @param {Result} result The result.
        * @return {String} The text to show for a result's name.
        */
        function resultText(result) {
            var name;
            if (hasTeamData && selectedLegIndex !== null) {
                name = result.owner.members[selectedLegIndex].name;
            }
            else {
                name = result.owner.name;
            }

            if (result.completed()) {
                // \u00a0 is a non-breaking space.  We substitute this in place of
                // a blank name to prevent the height of the item being dropped to
                // a few pixels.
                return (name === "") ? "\u00a0" : name;
            }
            else {
                return "* " + name;
            }
        }

        this.allResults = results;
        this.hasTeamData = hasTeamData;
        this.selectedLegIndex = selectedLegIndex;
        this.allResultDetails = this.allResults.map(function (result) {
            return { result: result, normedName: normaliseName(result.owner.name), visible: true };
        });

        var tooltipFunction;
        if (hasTeamData) {
            tooltipFunction = this.formatTooltip.bind(this);
        } else {
            tooltipFunction = function () { return null; };
        }

        if (this.placeholderDiv !== null) {
            this.placeholderDiv.remove();
            this.placeholderDiv = null;
        }

        var resultDivs = this.listDiv.selectAll("div.result").data(this.allResults);

        var outerThis = this;
        resultDivs.enter().append("div")
                          .classed("result", true)
                          .classed("selected", function (result, index) { return outerThis.isSelected(index); });

        resultDivs.selectAll("span").remove();

        resultDivs = this.listDiv.selectAll("div.result")
                                 .data(this.allResults)
                                 .attr("title", tooltipFunction);

        if (multipleClasses) {
            resultDivs.append("span")
                      .classed("resultClassLabel", true)
                      .text(function (result) { return result.className; });
        }

        resultDivs.append("span")
                  .classed("nonfinisher", function (result) { return !result.completed(); })
                  .text(resultText);

        resultDivs.exit().remove();

        if (this.allResults.length === 0) {
            this.placeholderDiv = this.listDiv.append("div")
                                              .classed("resultListPlaceholder", true);
            this.setPlaceholderDivText();
        }

        this.allButton.property("disabled", this.allResults.length === 0);
        this.noneButton.property("disabled", this.allResults.length === 0);
        this.filter.property("disabled", this.allResults.length === 0);

        resultDivs.on("mousedown", function (event, index) { outerThis.startDrag(event, index); })
                  .on("mousemove", function (event, index) { outerThis.mouseMove(event, index); })
                  .on("mouseup", function (event) { outerThis.stopDrag(event); });

        // Force an update on the filtering.
        this.updateFilter();
    };

    /**
    * Sets the result selection object.
    * @param {SplitsBrowser.Controls.ResultSelection} selection Result selection.
    */
    ResultList.prototype.setSelection = function (selection) {
        if (this.resultSelection !== null) {
            this.resultSelection.deregisterChangeHandler(this.handler);
        }

        var outerThis = this;
        this.resultSelection = selection;
        this.handler = function () { outerThis.selectionChanged(); };
        this.resultSelection.registerChangeHandler(this.handler);
        this.selectionChanged();
    };

    /**
    * Returns the filter text currently being used.
    * @return {String} Filter text.
    */
    ResultList.prototype.getFilterText = function () {
        return this.filter.node().value;
    };

    /**
    * Sets the filter text to use.
    * @param {String} filterText The filter text to use.
    */
    ResultList.prototype.setFilterText = function (filterText) {
        this.filter.node().value = filterText;
        this.updateFilterIfChanged();
    };

    /**
    * Updates the filtering.
    */
    ResultList.prototype.updateFilter = function () {
        var currentFilterString = this.filter.node().value;
        var normedFilter = normaliseName(currentFilterString);
        this.allResultDetails.forEach(function (result) {
            result.visible = (result.normedName.indexOf(normedFilter) >= 0);
        });

        var outerThis = this;
        this.listDiv.selectAll("div.result")
                    .style("display", function (div, index) { return (outerThis.allResultDetails[index].visible) ? null : "none"; });
    };

    /**
    * Updates the filtering following a change in the filter text input, if the
    * filter text has changed since last time.  If not, nothing happens.
    */
    ResultList.prototype.updateFilterIfChanged = function () {
        var currentFilterString = this.getFilterText();
        if (currentFilterString !== this.lastFilterString) {
            this.updateFilter();
            this.lastFilterString = currentFilterString;
            this.fireChangeHandlers();
        }
    };

    /**
    * Updates the filtering following a change in the filter text input
    * in a short whiie.
    */
    ResultList.prototype.updateFilterIfChangedDelayed = function () {
        var outerThis = this;
        setTimeout(function () { outerThis.updateFilterIfChanged(); }, 1);
    };

    SplitsBrowser.Controls.ResultList = ResultList;
})();
