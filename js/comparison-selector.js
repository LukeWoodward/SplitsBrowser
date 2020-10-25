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

    const getMessage = SplitsBrowser.getMessage;
    const getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    const ALL_COMPARISON_OPTIONS = [
        {
            nameKey: "CompareWithWinner",
            selector: courseClassSet => courseClassSet.getWinnerCumTimes(),
            requiresWinner: true,
            percentage: ""
        },
        {
            nameKey: "CompareWithFastestTime",
            selector: courseClassSet => courseClassSet.getFastestCumTimes(),
            requiresWinner: false,
            percentage: ""
        }
    ];

    // All 'Fastest time + N %' values (not including zero).
    const FASTEST_PLUS_PERCENTAGES = [5, 25, 50, 100];

    FASTEST_PLUS_PERCENTAGES.forEach(percent => {
        ALL_COMPARISON_OPTIONS.push({
            nameKey: "CompareWithFastestTimePlusPercentage",
            selector: courseClassSet => courseClassSet.getFastestCumTimesPlusPercentage(percent),
            requiresWinner: false,
            percentage: percent
        });
    });

    const ALL_INDIVIDUAL_COMPARISON_OPTIONS = ALL_COMPARISON_OPTIONS.slice(0);

    ALL_INDIVIDUAL_COMPARISON_OPTIONS.push({
        nameKey: "CompareWithAnyRunner",
        selector: null,
        requiresWinner: true,
        percentage: ""
    });

    const ALL_TEAM_COMPARISON_OPTIONS = ALL_COMPARISON_OPTIONS.slice(0);

    ALL_TEAM_COMPARISON_OPTIONS.push({
        nameKey: "CompareWithAnyTeam",
        selector: null,
        requiresWinner: true,
        percentage: ""
    });

    // Default selected index of the comparison function.
    const DEFAULT_COMPARISON_INDEX = 1; // 1 = fastest time.

    // The id of the comparison selector.
    const COMPARISON_SELECTOR_ID = "comparisonSelector";

    // The id of the result selector
    const RESULT_SELECTOR_ID = "resultSelector";

    // The id of the 'Runner' or 'Team' text before the selector for a specific
    // runner or team.
    const RESULT_SPAN_ID = "resultSpan";

    /**
     * A control that wraps a drop-down list used to choose what to compare
     * times against.
     * @param {HTMLElement} parent The parent element to add the control to.
     * @param {Function} alerter Function to call with any messages to show to
     *     the user.
     */
    class ComparisonSelector {
        constructor(parent, alerter) {
            this.changeHandlers = [];
            this.classes = null;
            this.currentResultIndex = null;
            this.previousResultList = null;
            this.parent = parent;
            this.alerter = alerter;
            this.hasWinner = false;
            this.previousSelectedIndex = -1;
            this.courseClassSet = null;
            this.selectedLegIndex = null;
            this.comparisonOptions = ALL_INDIVIDUAL_COMPARISON_OPTIONS;

            let div = d3.select(parent).append("div")
                .classed("topRowStart", true);

            this.comparisonSelectorLabel = div.append("span")
                .classed("comparisonSelectorLabel", true);

            this.dropDown = div.append("select")
                .attr("id", COMPARISON_SELECTOR_ID)
                .node();

            $(this.dropDown).bind("change", () => this.onSelectionChanged());

            this.optionsList = d3.select(this.dropDown).selectAll("option")
                .data(this.comparisonOptions);
            this.optionsList.enter().append("option");

            this.optionsList = d3.select(this.dropDown).selectAll("option")
                .data(this.comparisonOptions);
            this.optionsList.attr("value", (_opt, index) => index.toString());

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

            $(this.resultDropDown).bind("change", () => this.onSelectionChanged());

            this.dropDown.selectedIndex = DEFAULT_COMPARISON_INDEX;
            this.previousSelectedIndex = DEFAULT_COMPARISON_INDEX;

            this.setMessages();
        }

        /**
         * Sets the messages in this control, following its creation or a change of
         * selected language.
         */
        setMessages() {
            this.comparisonSelectorLabel.text(getMessage("ComparisonSelectorLabel"));
            this.setCompareWithAnyLabel();
            this.optionsList.text(opt => getMessageWithFormatting(opt.nameKey, { "$$PERCENT$$": opt.percentage }));
        }

        /**
         * Updates the 'Compare with any' label, following a change of language,
         * course-class set or selected leg index.
         */
        setCompareWithAnyLabel() {
            if (this.courseClassSet !== null && this.courseClassSet.hasTeamData() && this.selectedLegIndex === null) {
                this.resultSpan.text(getMessage("CompareWithAnyTeamLabel"));
            }
            else {
                this.resultSpan.text(getMessage("CompareWithAnyRunnerLabel"));
            }
        }

        /**
         * Add a change handler to be called whenever the selected class is changed.
         *
         * The function used to return the comparison result is returned.
         *
         * @param {Function} handler Handler function to be called whenever the class
         *                   changes.
         */
        registerChangeHandler(handler) {
            if (!this.changeHandlers.includes(handler)) {
                this.changeHandlers.push(handler);
            }
        }

        /**
         * Returns whether the 'Any Result...' option is selected.
         * @return {Boolean} True if the 'Any Result...' option is selected, false
         *     if any other option is selected.
         */
        isAnyResultSelected() {
            return this.dropDown.selectedIndex === this.comparisonOptions.length - 1;
        }

        /**
         * Sets the course-class set to use.
         * @param {CourseClassSet} courseClassSet The course-class set to set.
         */
        setCourseClassSet(courseClassSet) {
            this.courseClassSet = courseClassSet;
            this.selectedLegIndex = null;
            this.comparisonOptions = (courseClassSet.hasTeamData()) ? ALL_TEAM_COMPARISON_OPTIONS : ALL_INDIVIDUAL_COMPARISON_OPTIONS;
            this.optionsList = d3.select(this.dropDown).selectAll("option")
                .data(this.comparisonOptions);
            this.optionsList.text(opt => getMessageWithFormatting(opt.nameKey, { "$$PERCENT$$": opt.percentage }));
            this.setResults();
            this.setCompareWithAnyLabel();
        }

        /**
         * Handles a change of selected leg.
         * @param {Number|null} selectedLegIndex The index of the selected leg.
         */
        setSelectedLeg(selectedLegIndex) {
            this.selectedLegIndex = selectedLegIndex;
            this.setResults();
            this.setCompareWithAnyLabel();
            this.optionsList.data(selectedLegIndex === null ? ALL_TEAM_COMPARISON_OPTIONS : ALL_INDIVIDUAL_COMPARISON_OPTIONS);
            this.optionsList.text(opt => getMessageWithFormatting(opt.nameKey, { "$$PERCENT$$": opt.percentage }));
        }

        /**
         * Populates the drop-down list of results from a course-class set.
         */
        setResults() {
            let results = this.courseClassSet.allResults;
            let completingResultIndexes = d3.range(results.length).filter(idx => results[idx].completed());
            let completingResults = results.filter(result => result.completed());

            this.hasWinner = (completingResults.length > 0);
            let selectedLegIndex = this.selectedLegIndex;

            let optionsList = d3.select(this.resultDropDown).selectAll("option")
                .data(completingResults);

            optionsList.enter().append("option");
            optionsList = d3.select(this.resultDropDown).selectAll("option")
                .data(completingResults);
            optionsList.attr("value", (_res, complResultIndex) => completingResultIndexes[complResultIndex].toString())
                .text(result => result.getOwnerNameForLeg(selectedLegIndex));
            optionsList.exit().remove();

            if (this.previousResultList === null) {
                this.currentResultIndex = 0;
            } else if (this.hasWinner) {
                let oldSelectedResult = this.previousResultList[this.currentResultIndex];
                let newIndex = results.indexOf(oldSelectedResult);
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
        }

        /**
         * Sets whether the control is enabled.
         * @param {Boolean} isEnabled True if the control is enabled, false if
         *      disabled.
         */
        setEnabled(isEnabled) {
            d3.select(this.parent).selectAll("span.comparisonSelectorLabel")
                .classed("disabled", !isEnabled);

            this.dropDown.disabled = !isEnabled;
            this.resultDropDown.disabled = !isEnabled;
        }

        /**
         * Returns the function that compares a result's splits against some
         * reference data.
         * @return {Function} Comparison function.
         */
        getComparisonFunction() {
            if (this.isAnyResultSelected()) {
                return courseClassSet => courseClassSet.getCumulativeTimesForResult(this.currentResultIndex);
            } else {
                return this.comparisonOptions[this.dropDown.selectedIndex].selector;
            }
        }

        /**
         * Returns the comparison type.
         * @return {Object} Object containing the comparison type (type index and result).
         */
        getComparisonType() {
            let result;
            if (this.isAnyResultSelected()) {
                if (this.resultDropDown.selectedIndex < 0) {
                    this.resultDropDown.selectedIndex = 0;
                }

                result = this.courseClassSet.allResults[this.resultDropDown.selectedIndex];
            } else {
                result = null;
            }

            return { index: this.dropDown.selectedIndex, result: result };
        }

        /**
         * Sets the comparison type.
         * @param {Number} typeIndex The index of the comparison type.
         * @param {Result|null} result The selected 'Any result', or null if
         *     'Any Result' has not been selected.
         */
        setComparisonType(typeIndex, result) {
            if (0 <= typeIndex && typeIndex < this.comparisonOptions.length) {
                if (typeIndex === this.comparisonOptions.length - 1) {
                    let resultIndex = this.courseClassSet.allResults.indexOf(result);
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
        }

        /**
         * Handle a change of the selected option in either drop-down list.
         */
        onSelectionChanged() {
            let resultDropdownSelectedIndex = Math.max(this.resultDropDown.selectedIndex, 0);
            let option = this.comparisonOptions[this.dropDown.selectedIndex];
            if (!this.hasWinner && option.requiresWinner) {
                // No winner on this course means you can't select this option.
                this.alerter(getMessageWithFormatting(
                    (this.courseClassSet !== null && this.courseClassSet.hasTeamData()) ? "CannotCompareAsNoWinnerTeam" : "CannotCompareAsNoWinner",
                    { "$$OPTION$$": getMessage(option.nameKey) }));
                this.dropDown.selectedIndex = this.previousSelectedIndex;
            } else {
                this.resultDiv.style("display", (this.isAnyResultSelected()) ? null : "none");
                this.currentResultIndex = (this.resultDropDown.options.length === 0) ? 0 : parseInt(this.resultDropDown.options[resultDropdownSelectedIndex].value, 10);
                this.previousSelectedIndex = this.dropDown.selectedIndex;
                this.changeHandlers.forEach(handler => handler(this.getComparisonFunction()));
            }
        }
    }

    SplitsBrowser.Controls.ComparisonSelector = ComparisonSelector;
})();
