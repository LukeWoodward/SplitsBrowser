/*
 *  SplitsBrowser StatisticsSelector - Provides a choice of the statistics to show.
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

    const getMessage = SplitsBrowser.getMessage;

    // ID of the statistics selector control.
    // Must match that used in styles.css.
    const STATISTIC_SELECTOR_ID = "statisticSelector";

    const LABEL_ID_PREFIX = "statisticCheckbox";

    // Internal names of the statistics.
    const STATISTIC_NAMES = ["TotalTime", "SplitTime", "BehindFastest", "TimeLoss"];

    // Message keys for the labels of the four checkboxes.
    const STATISTIC_NAME_KEYS = ["StatisticsTotalTime", "StatisticsSplitTime", "StatisticsBehindFastest", "StatisticsTimeLoss"];

    // Names of statistics that are selected by default when the application
    // starts.
    const DEFAULT_SELECTED_STATISTICS = ["SplitTime", "TimeLoss"];

    /**
     * Control that contains a number of checkboxes for enabling and/or disabling
     * the display of various statistics.
     * @constructor
     * @param {HTMLElement} parent The parent element.
     */
    class StatisticsSelector {
        constructor(parent) {
            this.div = d3.select(parent).append("div")
                .classed("topRowEnd", true)
                .attr("id", STATISTIC_SELECTOR_ID);

            let childDivs = this.div.selectAll("div")
                .data(STATISTIC_NAMES)
                .enter()
                .append("div")
                .style("display", "inline-block");

            childDivs.append("input")
                .attr("id", name => LABEL_ID_PREFIX + name)
                .attr("type", "checkbox")
                .attr("checked", name => (DEFAULT_SELECTED_STATISTICS.indexOf(name) >= 0) ? "checked" : null);

            this.statisticLabels = childDivs.append("label")
                .attr("for", name => LABEL_ID_PREFIX + name)
                .classed("statisticsSelectorLabel", true);

            $("input", this.div.node()).bind("change", () => this.onCheckboxChanged());

            this.handlers = [];

            this.setMessages();
        }

        /**
         * Sets the messages in this control, following either its creation or a
         * change of selected language.
         */
        setMessages() {
            this.statisticLabels.text((_name, index) => getMessage(STATISTIC_NAME_KEYS[index]));
        }

        /**
         * Deselects all checkboxes.
         *
         * This method is intended only for test purposes.
         */
        clearAll() {
            this.div.selectAll("input").attr("checked", null);
        }

        /**
         * Sets whether the statistics selector controls are enabled.
         * @param {Boolean} isEnabled True if the controls are to be enabled,
         *      false if the controls are to be disabled.
         */
        setEnabled(isEnabled) {
            this.div.selectAll("label.statisticsSelectorLabel")
                .classed("disabled", !isEnabled);
            this.div.selectAll("input")
                .attr("disabled", (isEnabled) ? null : "disabled");
        }

        /**
         * Register a change handler to be called whenever the choice of currently-
         * visible statistics is changed.
         *
         * If the handler was already registered, nothing happens.
         * @param {Function} handler Function to be called whenever the choice
         *                           changes.
         */
        registerChangeHandler(handler) {
            if (!this.handlers.includes(handler)) {
                this.handlers.push(handler);
            }
        }

        /**
         * Deregister a change handler from being called whenever the choice of
         *  currently-visible statistics is changed.
         *
         * If the handler given was never registered, nothing happens.
         * @param {Function} handler Function to be called whenever the choice
         *                           changes.
         */
        deregisterChangeHandler(handler) {
            let index = this.handlers.indexOf(handler);
            if (index !== -1) {
                this.handlers.splice(index, 1);
            }
        }

        /**
         * Return the statistics that are currently enabled.
         * @return {Map} Map that lists all the statistics and whether they
         *     are enabled.
         */
        getVisibleStatistics() {
            let visibleStats = new Map();
            this.div.selectAll("input").nodes().forEach((checkbox, index) => {
                visibleStats.set(STATISTIC_NAMES[index], checkbox.checked);
            });

            return visibleStats;
        }

        /**
         * Sets the visible statistics.
         * @param {Map} visibleStats Map that contains the statistics to make visible.
         */
        setVisibleStatistics(visibleStats) {
            this.div.selectAll("input").nodes().forEach((checkbox, index) => {
                checkbox.checked = visibleStats.has(STATISTIC_NAMES[index]) && visibleStats.get(STATISTIC_NAMES[index]);
            });

            this.onCheckboxChanged();
        }

        /**
         * Handles the change in state of a checkbox, by firing all of the handlers.
         */
        onCheckboxChanged() {
            let checkedFlags = this.getVisibleStatistics();
            for (let handler of this.handlers) {
                handler(checkedFlags);
            }
        }
    }

    SplitsBrowser.Controls.StatisticsSelector = StatisticsSelector;
})();
