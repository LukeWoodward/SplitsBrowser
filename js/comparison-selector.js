(function (){
    "use strict";
    
    var ALL_COMPARISON_OPTIONS = [
        { name: "Winner", selector: function (ageClass) { return ageClass.getWinnerCumTimes(); } },
        { name: "Fastest time", selector: function (ageClass) { return ageClass.getFastestCumTimes(); } }
    ];
    
    // All 'Fastest time + N %' values (not including zero).
    var FASTEST_PLUS_PERCENTAGES = [5, 25, 50, 100];
    
    FASTEST_PLUS_PERCENTAGES.forEach(function (percent) {
        ALL_COMPARISON_OPTIONS.push({
            name: "Fastest time + " + percent + "%",
            selector: function (ageClass) { return ageClass.getFastestCumTimesPlusPercentage(percent); }
        });
    });
    
    ALL_COMPARISON_OPTIONS.push({ name: "Any runner..." });
    
    // Default selected index of the comparison function.
    var DEFAULT_COMPARISON_INDEX = 1; // 1 = fastest time.
    
    // The id of the comparison selector.
    var COMPARISON_SELECTOR_ID = "comparisonSelector";
    
    // The id of the runner selector
    var RUNNER_SELECTOR_ID = "runnerSelector";

    /**
    * A control that wraps a drop-down list used to choose what to compare
    * times against.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.ComparisonSelector = function(parent) {
        this.changeHandlers = [];
        this.classes = null;
        this.currentRunnerIndex = null;
        
        var span = d3.select(parent).append("span");
        span.text("Compare with ");
        var outerThis = this;
        this.dropDown = span.append("select")
                            .attr("id", COMPARISON_SELECTOR_ID)
                            .node();
                            
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        var optionsList = d3.select(this.dropDown).selectAll("option")
                                                  .data(ALL_COMPARISON_OPTIONS);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_opt, index) { return index.toString(); })
                   .text(function (opt) { return opt.name; });
                   
        optionsList.exit().remove();
        
        this.runnerSpan = d3.select(parent).append("span")
                                           .style("display", "none")
                                           .style("padding-left", "20px");
        
        this.runnerSpan.text("Runner: ");
        
        this.runnerDropDown = this.runnerSpan.append("select")
                                             .attr("id", RUNNER_SELECTOR_ID)
                                             .node();
        $(this.runnerDropDown).bind("change", function () { outerThis.onSelectionChanged(); });
        
        this.dropDown.selectedIndex = DEFAULT_COMPARISON_INDEX;
    };

    /**
    * Add a change handler to be called whenever the selected class is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler - Handler function to be called whenever the class
    *                   changes.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns whether the 'Any Runner...' option is selected.
    * @return Whether the 'Any Runner...' option is selected.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.isAnyRunnerSelected = function () {
        return this.dropDown.selectedIndex === ALL_COMPARISON_OPTIONS.length - 1;
    };
    
    /**
    * Sets the list of classes.
    * @param {Array} classes - Array of AgeClass objects.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.setClasses = function (classes) {
        var wasNull = (this.classes === null);
        this.classes = classes;
        
        if (wasNull && this.classes !== null && this.classes.length > 0) {
            this.setRunnersFromClass(0);
        }
    };
    
    /**
    * Handles a change of selected class, by updating the list of runners that
    * can be chosen from.
    * @param {Number} classIndex - The index of the chosen age class among the
    *     list of all of them.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.updateRunnerList = function (classIndex) {
        if (this.classes !== null && 0 <= classIndex && classIndex < this.classes.length) {
            this.setRunnersFromClass(classIndex);
        }
    };

    /**
    * Populates the list of runners within a class in the Runner drop-down.
    * @param {Number} classIndex - Index of the class among the list of all
    *      classes.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.setRunnersFromClass = function (classIndex) {
        var competitors = this.classes[classIndex].competitors;
        var completingCompetitorIndexes = d3.range(competitors.length).filter(function (idx) { return competitors[idx].completed(); });
        var completingCompetitors = competitors.filter(function (comp) { return comp.completed(); });
        
        var optionsList = d3.select(this.runnerDropDown).selectAll("option")
                                                        .data(completingCompetitors);
        
        optionsList.enter().append("option");
        optionsList.attr("value", function (_comp, complCompIndex) { return completingCompetitorIndexes[complCompIndex].toString(); })
                   .text(function (comp) { return comp.name; });
        optionsList.exit().remove();
       
        this.runnerDropDown.selectedIndex = 0;
        this.currentRunnerIndex = 0;
    };
    
    /**
    * Returns the function that compares a competitor's splits against some
    * reference data.
    * @return {Function} Comparison function.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.getComparisonFunction = function () {
        if (this.isAnyRunnerSelected()) {
            var dropdownSelectedIndex = Math.max(this.runnerDropDown.selectedIndex, 0);
            this.currentRunnerIndex = parseInt(this.runnerDropDown.options[dropdownSelectedIndex].value, 10);
            var outerThis = this;
            return function (ageClass) { return ageClass.competitors[outerThis.currentRunnerIndex].getAllCumulativeTimes(); };
        } else {
            return ALL_COMPARISON_OPTIONS[this.dropDown.selectedIndex].selector;
        }
    };
    
    /**
    * Handle a change of the selected option in either drop-down list.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.onSelectionChanged = function() {
        this.runnerSpan.style("display", (this.isAnyRunnerSelected()) ? "" : "none");
        var outerThis = this;
        this.changeHandlers.forEach(function (handler) { handler(outerThis.getComparisonFunction()); });
    };
})();
