(function (){
    "use strict";
    
    /**
    * Converts a number of seconds into the corresponding number of minutes.
    * This conversion is as simple as dividing by 60.
    * @param {Number} seconds - The number of seconds to convert.
    * @return {Number} The corresponding number of minutes.
    */
    function secondsToMinutes(seconds) { 
        return (seconds === null) ? null : seconds / 60;
    }

    var _ALL_CHART_TYPES = [
        {
            name: "Splits graph",
            dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReference(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabel: "Time loss (min)",
            isResultsTable: false
        },
        {
            name: "Position after leg",
            dataSelector: function (comp) { return comp.cumRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            isResultsTable: false
        },
        {
            name: "Split position",
            dataSelector: function (comp) { return comp.splitRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            isResultsTable: false
        },
        {
            name: "Percent behind",
            dataSelector: function (comp, referenceCumTimes) { return comp.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes); },
            skipStart: false,
            yAxisLabel: "Percent behind",
            isResultsTable: false
        },
        {
            name: "Results table",
            dataSelector: null,
            skipStart: false,
            yAxisLabel: null,
            isResultsTable: true
        }
    ];
    
    /**
    * A control that wraps a drop-down list used to choose the types of chart to view.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.ChartTypeSelector = function(parent) {
        this.changeHandlers = [];
        
        var span = d3.select(parent).append("span");
        span.text("View: ");
        var outerThis = this;
        this.dropDown = span.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        var optionsList = d3.select(this.dropDown).selectAll("option").data(_ALL_CHART_TYPES);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_value, index) { return index.toString(); })
                   .text(function (value) { return value.name; });
                   
        optionsList.exit().remove();
    };

    /**
    * Add a change handler to be called whenever the selected type of chart is changed.
    *
    * The selected type of chart is passed to the handler function.
    *
    * @param {Function} handler - Handler function to be called whenever the
    *                             chart type changes.
    */
    SplitsBrowser.Controls.ChartTypeSelector.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns the currently-selected chart type.
    * @return {Array} The currently-selected chart type.
    */
    SplitsBrowser.Controls.ChartTypeSelector.prototype.getChartType = function () {
        return _ALL_CHART_TYPES[Math.max(this.dropDown.selectedIndex, 0)];
    };
    
    /**
    * Handle a change of the selected option in the drop-down list.
    */
    SplitsBrowser.Controls.ChartTypeSelector.prototype.onSelectionChanged = function () {
        var outerThis = this;
        this.changeHandlers.forEach(function(handler) { handler(_ALL_CHART_TYPES[outerThis.dropDown.selectedIndex]); });
    };
})();
