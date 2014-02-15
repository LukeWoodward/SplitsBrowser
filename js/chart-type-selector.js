/*
 *  SplitsBrowser ChartTypeSelector - Provides a choice of chart types.
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
(function (){
    "use strict";
    
    var getMessage = SplitsBrowser.getMessage;
    
    /**
    * A control that wraps a drop-down list used to choose the types of chart to view.
    * @param {HTMLElement} parent - The parent element to add the control to.
    * @param {Array} chartTypes - Array of types of chart to list.
    */
    var ChartTypeSelector = function (parent, chartTypes) {
        this.changeHandlers = [];
        this.chartTypes = chartTypes;
        this.raceGraphDisabledNotifier = null;
        this.lastSelectedIndex = 0;
        
        var div = d3.select(parent).append("div")
                                    .attr("id", "chartTypeSelector");
        div.append("span")
           .text(getMessage("ChartTypeSelectorLabel"));
           
        var outerThis = this;
        this.dropDown = div.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        var optionsList = d3.select(this.dropDown).selectAll("option").data(chartTypes);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_value, index) { return index.toString(); })
                   .text(function (value) { return getMessage(value.nameKey); });
                   
        optionsList.exit().remove();
    };
    
    /**
    * Sets the function used to disable the selection of the race graph.
    *
    * If not null, this will be called whenever an attempt to select the race
    * graph is made, and the selection will revert to what it was before.  If
    * it is null, the race graph can be selected.
    *
    * @param {Function|null} raceGraphDisabledNotifier - Function to call when
    *     the race graph is selected
    */
    ChartTypeSelector.prototype.setRaceGraphDisabledNotifier = function (raceGraphDisabledNotifier) {
        this.raceGraphDisabledNotifier = raceGraphDisabledNotifier;
    };
    
    /**
    * Add a change handler to be called whenever the selected type of chart is changed.
    *
    * The selected type of chart is passed to the handler function.
    *
    * @param {Function} handler - Handler function to be called whenever the
    *                             chart type changes.
    */
    ChartTypeSelector.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns the currently-selected chart type.
    * @return {Array} The currently-selected chart type.
    */
    ChartTypeSelector.prototype.getChartType = function () {
        return this.chartTypes[Math.max(this.dropDown.selectedIndex, 0)];
    };
    
    /**
    * Handle a change of the selected option in the drop-down list.
    */
    ChartTypeSelector.prototype.onSelectionChanged = function () {
        if (this.raceGraphDisabledNotifier !== null && this.chartTypes[this.dropDown.selectedIndex].isRaceGraph) {
            this.raceGraphDisabledNotifier();
            this.dropDown.selectedIndex = Math.max(this.lastSelectedIndex, 0);
        }
        
        this.changeHandlers.forEach(function(handler) { handler(this.chartTypes[this.dropDown.selectedIndex]); }, this);
        this.lastSelectedIndex = this.dropDown.selectedIndex;
    };
    
    SplitsBrowser.Controls.ChartTypeSelector = ChartTypeSelector;
})();
