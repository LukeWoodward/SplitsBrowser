(function (){
    "use strict";
    
    var _ALL_COMPARISON_OPTIONS = [
        { name: "Winner", selector: function (courseData) { return courseData.getWinner(); } },
        { name: "Fastest time", selector: function (courseData) { return courseData.getFastestTime(); } }
    ];
    
    // All 'Fastest time + N %' values (not including zero, of course).
    var _FASTEST_PLUS_PERCENTAGES = [5, 25, 50, 100];
    
    _FASTEST_PLUS_PERCENTAGES.forEach(function (percent) {
        _ALL_COMPARISON_OPTIONS.push({
            name: "Fastest time + " + percent + "%",
            selector: function (courseData) { return courseData.getFastestTimePlusPercentage(percent); }
        });
    });
    
    _ALL_COMPARISON_OPTIONS.push({ name: "Any runner..." });
    
    // Default selected index of the comparison function.
    var _DEFAULT_COMPARISON_INDEX = 1; // 1 = fastest time.
    
    // The id of the comparison selector.
    var _COMPARISON_SELECTOR_ID = "comparisonSelector";
    
    // The id of the runner selector
    var _RUNNER_SELECTOR_ID = "runnerSelector";

    /**
    * A control that wraps a drop-down list used to choose what to compare
    * times against.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.ComparisonSelector = function(parent) {
        this.changeHandlers = [];
        this.courses = null;
        
        var span = d3.select(parent).append("span");
        span.text("Compare with ");
        var outerThis = this;
        this.dropDown = span.append("select")
                            .attr("id", _COMPARISON_SELECTOR_ID)
                            .node();
                            
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        var optionsList = d3.select(this.dropDown).selectAll("option")
                                                  .data(_ALL_COMPARISON_OPTIONS);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_opt, index) { return index.toString(); })
                   .text(function (opt) { return opt.name; });
                   
        optionsList.exit().remove();
        
        this.runnerSpan = d3.select(parent).append("span")
                                           .style("display", "none")
                                           .style("padding-left", "20px");
        
        this.runnerSpan.text("Runner: ");
        
        this.runnerDropDown = this.runnerSpan.append("select")
                                             .attr("id", _RUNNER_SELECTOR_ID)
                                             .node();
        $(this.runnerDropDown).bind("change", function () { outerThis.onSelectionChanged(); });
        
        this.dropDown.selectedIndex = _DEFAULT_COMPARISON_INDEX;
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
    * Returns whether the 'Any Runner...' option is selected.
    * @return Whether the 'Any Runner...' option is selected.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.isAnyRunnerSelected = function () {
        return this.dropDown.selectedIndex === _ALL_COMPARISON_OPTIONS.length - 1;
    };
    
    /**
    * Sets the list of courses.
    * @param {Array} courses - Array of CourseData objects.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.setCourses = function (courses) {
        var wasNull = (this.courses === null);
        this.courses = courses;
        
        if (wasNull && this.courses !== null && this.courses.length > 0) {
            this.setRunnersFromCourse(0);
        }
    };
    
    /**
    * Handles a change of selected course, by updating the list of runners that
    * can be chosen from.
    * @param {Number} courseIndex - The index of the chosen course among the
    *     list of them.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.updateRunnerList = function (courseIndex) {
        if (this.courses !== null && 0 <= courseIndex && courseIndex < this.courses.length) {
            this.setRunnersFromCourse(courseIndex);
        }
    };

    /**
    * Populates the list of runners in the Runner drop-down.
    * @param {Number} courseIndex - Index of the course among the list of all
    *      courses.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.setRunnersFromCourse = function (courseIndex) {
        var optionsList = d3.select(this.runnerDropDown).selectAll("option")
                                                        .data(this.courses[courseIndex].competitorData);
        
        optionsList.enter().append("option");
        optionsList.attr("value", function (_comp, compIndex) { return compIndex.toString(); })
                   .text(function (comp) { return comp.name; });
        optionsList.exit().remove();
        
        this.runnerDropDown.selectedIndex = 0;
    };
    
    /**
    * Returns the function that compares a competitor's splits against some
    * reference data.
    * @return {Function} Comparison function.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.getComparisonFunction = function () {
        if (this.isAnyRunnerSelected()) {
            var runnerIndex = Math.max(this.runnerDropDown.selectedIndex, 0);
            return function (courseData) { return courseData.competitorData[runnerIndex]; };
        } else {
            return _ALL_COMPARISON_OPTIONS[this.dropDown.selectedIndex].selector;
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
