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
    
    var getMessage = SplitsBrowser.getMessage;

    // ID of the statistics selector control.
    // Must match that used in styles.css.
    var STATISTIC_SELECTOR_ID = "statisticSelector";

    var LABEL_ID_PREFIX = "statisticCheckbox";

    // Internal names of the statistics.
    var STATISTIC_NAMES = ["TotalTime", "SplitTime", "BehindFastest", "TimeLoss"];

    // Message keys for the labels of the four checkboxes.
    var STATISTIC_NAME_KEYS = ["StatisticsTotalTime", "StatisticsSplitTime", "StatisticsBehindFastest", "StatisticsTimeLoss"];
    
    // Names of statistics that are selected by default when the application
    // starts.
    var DEFAULT_SELECTED_STATISTICS = ["SplitTime", "TimeLoss"];

    /**
    * Control that contains a number of checkboxes for enabling and/or disabling
    * the display of various statistics.
    * @constructor
    * @param {HTMLElement} parent - The parent element.
    */
    function StatisticsSelector (parent) {
        this.div = d3.select(parent).append("div")
                                     .classed("topRowEnd", true)
                                     .attr("id", STATISTIC_SELECTOR_ID);   

        var childDivs = this.div.selectAll("div")
                                .data(STATISTIC_NAMES)
                                .enter()
                                .append("div")
                                .style("display", "inline-block");
         
        childDivs.append("input")
                 .attr("id", function(name) { return LABEL_ID_PREFIX + name; }) 
                 .attr("type", "checkbox")
                 .attr("checked", function (name) { return (DEFAULT_SELECTED_STATISTICS.indexOf(name) >= 0) ? "checked" : null; });
                  
        this.statisticLabels  = childDivs.append("label")
                                         .attr("for", function(name) { return LABEL_ID_PREFIX + name; })
                                         .classed("statisticsSelectorLabel", true);

        
        var outerThis = this;
        $("input", this.div.node()).bind("change", function () { return outerThis.onCheckboxChanged(); });
                   
        this.handlers = [];
        
        this.setMessages();
    }
    
    /**
    * Sets the messages in this control, following either its creation or a
    * change of selected language.
    */
    StatisticsSelector.prototype.setMessages = function () {
        this.statisticLabels.text(function (name, index) { return getMessage(STATISTIC_NAME_KEYS[index]); });    
    };
    
    /**
    * Deselects all checkboxes.
    * 
    * This method is intended only for test purposes.
    */
    StatisticsSelector.prototype.clearAll = function () {
        this.div.selectAll("input").attr("checked", null);
    };

    /**
    * Sets whether the statistics selector controls are enabled.
    * @param {boolean} isEnabled - True if the controls are to be enabled,
    *      false if the controls are to be disabled.
    */
    StatisticsSelector.prototype.setEnabled = function (isEnabled) {
        this.div.selectAll("label.statisticsSelectorLabel")
                .classed("disabled", !isEnabled);
        this.div.selectAll("input")
                .attr("disabled", (isEnabled) ? null : "disabled");
    };
    
    /**
    * Register a change handler to be called whenever the choice of currently-
    * visible statistics is changed.
    *
    * If the handler was already registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    StatisticsSelector.prototype.registerChangeHandler = function (handler) {
        if (this.handlers.indexOf(handler) === -1) {
            this.handlers.push(handler);
        }
    };
       
    /**
    * Deregister a change handler from being called whenever the choice of
    *  currently-visible statistics is changed.
    *
    * If the handler given was never registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    StatisticsSelector.prototype.deregisterChangeHandler = function (handler) {
        var index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    };

    /**
    * Return the statistics that are currently enabled.
    * @returns {Object} Object that lists all the statistics and whether they
    *     are enabled.
    */
    StatisticsSelector.prototype.getVisibleStatistics = function () {
        var visibleStats = {};
        this.div.selectAll("input")[0].forEach(function (checkbox, index) {
            visibleStats[STATISTIC_NAMES[index]] = checkbox.checked;
        });
        
        return visibleStats;
    };
    
    /**
    * Sets the visible statistics.
    * @param {Object} visibleStats - The statistics to make visible.
    */
    StatisticsSelector.prototype.setVisibleStatistics = function (visibleStats) {
        this.div.selectAll("input")[0].forEach(function (checkbox, index) {
            checkbox.checked = visibleStats[STATISTIC_NAMES[index]] || false;
        });
        
        this.onCheckboxChanged();
    };

    /**
    * Handles the change in state of a checkbox, by firing all of the handlers.
    */
    StatisticsSelector.prototype.onCheckboxChanged = function () {
        var checkedFlags = this.getVisibleStatistics();
        this.handlers.forEach(function (handler) { handler(checkedFlags); });
    };
    
    SplitsBrowser.Controls.StatisticsSelector = StatisticsSelector;
})();
