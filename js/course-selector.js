"use strict";

/**
* A control that wraps a drop-down list used to choose between course.
* @param {HTMLElement} parent - The parent element to add the control to.
*/
SplitsBrowser.Controls.CourseSelector = function(parent) {
    this.changeHandlers = [];
    
    var span = d3.select(parent).append("span");
    span.text("Course: ");
    var outerThis = this;
    this.dropDown = span.append("select").node();
    $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
    
    this.setCourses([]);
};

/**
* Sets the list of courses that this selector can choose between.
* 
* If there are no courses, a 'dummy' entry is added
* @param {Array} courses - Array of CourseData objects containing course data.
*/
SplitsBrowser.Controls.CourseSelector.prototype.setCourses = function(courses) {
    if ($.isArray(courses)) {
        var options;
        if (courses.length == 0) {
            this.dropDown.disabled = true;
            options = ["[No courses loaded]"];
        } else {
            this.dropDown.disabled = false;
            options = courses.map(function(course) { return course.course; });
        }
        
        var optionsList = d3.select(this.dropDown).selectAll("option").data(options);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function(_value, index) { return index.toString(); })
                   .text(function(value) { return value; });
                   
        optionsList.exit().remove();
    } else {
        throwInvalidData("CourseSelector.setCourses: options is not an array");
    }
};

/**
* Add a change handler to be called whenever the selected course is changed.
* changes.
*
* The index of the newly-selected item is passed to each handler function.
*
* @param {Function} handler - Handler function to be called whenever the course
*                   changes.
*/
SplitsBrowser.Controls.CourseSelector.prototype.onCourseChanged = function(handler) {
    if (this.changeHandlers.indexOf(handler) == -1) {
        this.changeHandlers.push(handler);
    }    
};

/**
* Handle a change of the selected option in the drop-down list.
*/
SplitsBrowser.Controls.CourseSelector.prototype.onSelectionChanged = function() {
    var outerThis = this;
    this.changeHandlers.forEach(function(handler) { handler(outerThis.dropDown.selectedIndex); });
};