/*
 *  SplitsBrowser ComparisonSelector - Provides a choice of 'reference' results.
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

    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    var ALL_COMPARISON_OPTIONS = [
        {
            nameKey: "CompareWithWinner",
            selector: function (courseClassSet) { return courseClassSet.getWinnerCumTimes(); },
            requiresWinner: true,
            percentage: ""
        },
        {
            nameKey: "CompareWithFastestTime",
            selector: function (courseClassSet) { return courseClassSet.getFastestCumTimes(); },
            requiresWinner: false,
            percentage: ""
        }
    ];

    // All 'Fastest time + N %' values (not including zero).
    var FASTEST_PLUS_PERCENTAGES = [5, 25, 50, 100];

    FASTEST_PLUS_PERCENTAGES.forEach(function (percent) {
        ALL_COMPARISON_OPTIONS.push({
            nameKey: "CompareWithFastestTimePlusPercentage",
            selector: function (courseClassSet) { return courseClassSet.getFastestCumTimesPlusPercentage(percent); },
            requiresWinner: false,
            percentage: percent
        });
    });

    var ALL_INDIVIDUAL_COMPARISON_OPTIONS = ALL_COMPARISON_OPTIONS.slice(0);

    ALL_INDIVIDUAL_COMPARISON_OPTIONS.push({
        nameKey: "CompareWithAnyRunner",
        selector: null,
        requiresWinner: true,
        percentage: ""
    });

    var ALL_TEAM_COMPARISON_OPTIONS = ALL_COMPARISON_OPTIONS.slice(0);

    ALL_TEAM_COMPARISON_OPTIONS.push({
        nameKey: "CompareWithAnyTeam",
        selector: null,
        requiresWinner: true,
        percentage: ""
    });

    // Default selected index of the comparison function.
    var DEFAULT_COMPARISON_INDEX = 1; // 1 = fastest time.

    // The id of the comparison selector.
    var COMPARISON_SELECTOR_ID = "comparisonSelector";

    // The id of the result selector
    var RESULT_SELECTOR_ID = "resultSelector";

    // The id of the 'Runner' or 'Team' text before the selector for a specific
    // runner or team.
    var RESULT_SPAN_ID = "resultSpan";

    /**
    * A control that wraps a drop-down list used to choose what to compare
    * times against.
    * @param {HTMLElement} parent - The parent element to add the control to.
    * @param {Function} alerter - Function to call with any messages to show to
    *     the user.
    */
    function ComparisonSelector(parent, alerter) {
        this.changeHandlers = [];
        this.classes = null;
        this.currentResultIndex = null;
        this.previousResultList = null;
        this.parent = parent;
        this.alerter = alerter;
        this.hasWinner = false;
        this.previousSelectedIndex = -1;
        this.courseClassSet = null;
        this.comparisonOptions = ALL_INDIVIDUAL_COMPARISON_OPTIONS;

        var div = d3.select(parent).append("div")
                                   .classed("topRowStart", true);

        this.comparisonSelectorLabel = div.append("span")
                                          .classed("comparisonSelectorLabel", true);


        var outerThis = this;
        this.dropDown = div.append("select")
                           .attr("id", COMPARISON_SELECTOR_ID)
                           .node();

        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        this.optionsList = d3.select(this.dropDown).selectAll("option")
                                                   .data(this.comparisonOptions);
        this.optionsList.enter().append("option");

        this.optionsList = d3.select(this.dropDown).selectAll("option")
                                                   .data(this.comparisonOptions);
        this.optionsList.attr("value", function (_opt, index) { return index.toString(); });

        this.optionsList.exit().remove();

        this.resultDiv = d3.select(parent).append("div")
                                          .classed("topRowStart", true)
                                          .style("display", "none")
                                          .style("padding-left", "20px");

        this.resultSpan = this.resultDiv.append("span")
                                        .attr("id", RESULT_SPAN_ID)
                                        .classed("comparisonSelectorLabel", true);

        this.resultDropDown = this.resultDiv.append("select")
                                            .attr("id", RESULT_SELECTOR_ID)
                                            .node();

        $(this.resultDropDown).bind("change", function () { outerThis.onSelectionChanged(); });

        this.dropDown.selectedIndex = DEFAULT_COMPARISON_INDEX;
        this.previousSelectedIndex = DEFAULT_COMPARISON_INDEX;

        this.setMessages();
    }

    /**
    * Sets the messages in this control, following its creation or a change of
    * selected language.
    */
    ComparisonSelector.prototype.setMessages = function () {
        this.comparisonSelectorLabel.text(getMessage("ComparisonSelectorLabel"));
        this.setCompareWithAnyLabel();
        this.optionsList.text(function (opt) { return getMessageWithFormatting(opt.nameKey, {"$$PERCENT$$": opt.percentage}); });
    };

    /**
    * Updates the 'Compare with any' label, following a change of language or
    * course-class set.
    */
    ComparisonSelector.prototype.setCompareWithAnyLabel = function () {
        if (this.courseClassSet !== null && this.courseClassSet.hasTeamData()) {
            this.resultSpan.text(getMessage("CompareWithAnyTeamLabel"));
        }
        else {
            this.resultSpan.text(getMessage("CompareWithAnyRunnerLabel"));
        }
    };

    /**
    * Add a change handler to be called whenever the selected class is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler - Handler function to be called whenever the class
    *                   changes.
    */
    ComparisonSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Returns whether the 'Any Result...' option is selected.
    * @return {boolean} True if the 'Any Result...' option is selected, false
    *     if any other option is selected.
    */
    ComparisonSelector.prototype.isAnyResultSelected = function () {
        return this.dropDown.selectedIndex === this.comparisonOptions.length - 1;
    };

    /**
    * Sets the course-class set to use.
    * @param {CourseClassSet} courseClassSet - The course-class set to set.
    */
    ComparisonSelector.prototype.setCourseClassSet = function (courseClassSet) {
        this.courseClassSet = courseClassSet;
        this.comparisonOptions = (courseClassSet.hasTeamData()) ? ALL_TEAM_COMPARISON_OPTIONS : ALL_INDIVIDUAL_COMPARISON_OPTIONS;
        this.optionsList = d3.select(this.dropDown).selectAll("option")
                                                   .data(this.comparisonOptions);
        this.optionsList.text(function (opt) { return getMessageWithFormatting(opt.nameKey, {"$$PERCENT$$": opt.percentage}); });
        this.setResults();
        this.setCompareWithAnyLabel();
    };

    /**
    * Populates the drop-down list of results from a course-class set.
    */
    ComparisonSelector.prototype.setResults = function () {
        var results = this.courseClassSet.allResults;
        var completingResultIndexes = d3.range(results.length).filter(function (idx) { return results[idx].completed(); });
        var completingResults = results.filter(function (result) { return result.completed(); });

        this.hasWinner = (completingResults.length > 0);

        var optionsList = d3.select(this.resultDropDown).selectAll("option")
                                                        .data(completingResults);

        optionsList.enter().append("option");
        optionsList = d3.select(this.resultDropDown).selectAll("option")
                                                    .data(completingResults);
        optionsList.attr("value", function (_res, complResultIndex) { return completingResultIndexes[complResultIndex].toString(); })
                   .text(function (result) { return result.owner.name; });
        optionsList.exit().remove();

        if (this.previousResultList === null) {
            this.currentResultIndex = 0;
        } else if (this.hasWinner) {
            var oldSelectedResult = this.previousResultList[this.currentResultIndex];
            var newIndex = results.indexOf(oldSelectedResult);
            this.currentResultIndex = Math.max(newIndex, 0);
        } else if (this.comparisonOptions[this.dropDown.selectedIndex].requiresWinner) {
            // We're currently viewing a comparison type that requires a
            // winner.  However, there is no longer a winner, presumably
            // because there was a winner but following the removal of a class
            // there isn't any more.  Switch back to the fastest time.
            this.setComparisonType(1, null);
        }

        this.resultDropDown.selectedIndex = this.currentResultIndex;

        this.previousResultList = results;
    };

    /**
    * Sets whether the control is enabled.
    * @param {boolean} isEnabled - True if the control is enabled, false if
    *      disabled.
    */
    ComparisonSelector.prototype.setEnabled = function (isEnabled) {
        d3.select(this.parent).selectAll("span.comparisonSelectorLabel")
                              .classed("disabled", !isEnabled);

        this.dropDown.disabled = !isEnabled;
        this.resultDropDown.disabled = !isEnabled;
    };

    /**
    * Returns the function that compares a result's splits against some
    * reference data.
    * @return {Function} Comparison function.
    */
    ComparisonSelector.prototype.getComparisonFunction = function () {
        if (this.isAnyResultSelected()) {
            var outerThis = this;
            return function (courseClassSet) { return courseClassSet.getCumulativeTimesForResult(outerThis.currentResultIndex); };
        } else {
            return this.comparisonOptions[this.dropDown.selectedIndex].selector;
        }
    };

    /**
    * Returns the comparison type.
    * @return {Object} Object containing the comparison type (type index and result).
    */
    ComparisonSelector.prototype.getComparisonType = function () {
        var result;
        if (this.isAnyResultSelected()) {
            if (this.resultDropDown.selectedIndex < 0) {
                this.resultDropDown.selectedIndex = 0;
            }

            result = this.courseClassSet.allResults[this.resultDropDown.selectedIndex];
        } else {
            result = null;
        }

        return {index: this.dropDown.selectedIndex, result: result };
    };

    /**
    * Sets the comparison type.
    * @param {Number} typeIndex - The index of the comparison type.
    * @param {Result|null} result - The selected 'Any result', or null if
    *     Any Result has not been selected.
    */
    ComparisonSelector.prototype.setComparisonType = function (typeIndex, result) {
        if (0 <= typeIndex && typeIndex < this.comparisonOptions.length) {
            if (typeIndex === this.comparisonOptions.length - 1) {
                var resultIndex = this.courseClassSet.allResults.indexOf(result);
                if (resultIndex >= 0) {
                    this.dropDown.selectedIndex = typeIndex;
                    this.resultDropDown.selectedIndex = resultIndex;
                    this.onSelectionChanged();
                }
            } else {
                this.dropDown.selectedIndex = typeIndex;
                this.onSelectionChanged();
            }
        }
    };

    /**
    * Handle a change of the selected option in either drop-down list.
    */
    ComparisonSelector.prototype.onSelectionChanged = function() {
        var resultDropdownSelectedIndex = Math.max(this.resultDropDown.selectedIndex, 0);
        var option = this.comparisonOptions[this.dropDown.selectedIndex];
        if (!this.hasWinner && option.requiresWinner) {
            // No winner on this course means you can't select this option.
            this.alerter(getMessageWithFormatting(
                (this.courseClassSet !== null && this.courseClassSet.hasTeamData()) ? "CannotCompareAsNoWinnerTeam" : "CannotCompareAsNoWinner",
                {"$$OPTION$$": getMessage(option.nameKey)}));
            this.dropDown.selectedIndex = this.previousSelectedIndex;
        } else {
            this.resultDiv.style("display", (this.isAnyResultSelected()) ? null : "none");
            this.currentResultIndex = (this.resultDropDown.options.length === 0) ? 0 : parseInt(this.resultDropDown.options[resultDropdownSelectedIndex].value, 10);
            this.previousSelectedIndex = this.dropDown.selectedIndex;
            this.changeHandlers.forEach(function (handler) { handler(this.getComparisonFunction()); }, this);
        }
    };

    SplitsBrowser.Controls.ComparisonSelector = ComparisonSelector;
})();
