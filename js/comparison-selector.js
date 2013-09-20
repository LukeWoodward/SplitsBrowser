(function (){
    "use strict";
    
    var _ALL_COMPARISON_OPTIONS = [
        { name: "Fastest time", selector: function (courseData) { return courseData.getFastestTime(); } },
        { name: "Winner", selector: function (courseData) { return courseData.getWinner(); } }
    ];

    /**
    * A control that wraps a drop-down list used to choose what to compare
    * times against.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.ComparisonSelector = function(parent) {
        this.changeHandlers = [];
        
        var span = d3.select(parent).append("span");
        span.text("Compare with ");
        var outerThis = this;
        this.dropDown = span.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        var optionsList = d3.select(this.dropDown).selectAll("option").data(_ALL_COMPARISON_OPTIONS);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_opt, index) { return index.toString(); })
                   .text(function (opt) { return opt.name; });
                   
        optionsList.exit().remove();
    };
    
    /**
    * Returns the function that compares a competitor's splits against some
    * reference data.
    * @return {Function} Comparison function.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.getComparisonFunction = function () {
        return _ALL_COMPARISON_OPTIONS[this.dropDown.selectedIndex].selector;
    };

    /**
    * Add a change handler to be called whenever the selected course is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler - Handler function to be called whenever the course
    *                   changes.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.onSelectionChanged = function() {
        var outerThis = this;
        this.changeHandlers.forEach(function (handler) { handler(outerThis.getComparisonFunction()); });
    };
})();
