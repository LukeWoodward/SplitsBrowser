(function (){
    "use strict";
    
    /**
    * A control that wraps a drop-down list used to choose the types of chart to view.
    * @param {HTMLElement} parent - The parent element to add the control to.
    * @param {Array} chartTypes - Array of types of chart to list.
    */
    SplitsBrowser.Controls.ChartTypeSelector = function (parent, chartTypes) {
        this.changeHandlers = [];
        this.chartTypes = chartTypes;
        
        var span = d3.select(parent).append("span");
        span.text("View: ");
        var outerThis = this;
        this.dropDown = span.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        var optionsList = d3.select(this.dropDown).selectAll("option").data(chartTypes);
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
        return this.chartTypes[Math.max(this.dropDown.selectedIndex, 0)];
    };
    
    /**
    * Handle a change of the selected option in the drop-down list.
    */
    SplitsBrowser.Controls.ChartTypeSelector.prototype.onSelectionChanged = function () {
        this.changeHandlers.forEach(function(handler) { handler(this.chartTypes[this.dropDown.selectedIndex]); }, this);
    };
})();
