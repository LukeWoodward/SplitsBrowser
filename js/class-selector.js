(function (){
    "use strict";

    /**
    * A control that wraps a drop-down list used to choose between classes.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.ClassSelector = function(parent) {
        this.changeHandlers = [];
        
        var span = d3.select(parent).append("span");
        span.text("Class: ");
        var outerThis = this;
        this.dropDown = span.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        this.setClasses([]);
    };

    /**
    * Sets the list of classes that this selector can choose between.
    * 
    * If there are no classes, a 'dummy' entry is added
    * @param {Array} classes - Array of AgeClass objects containing class data.
    */
    SplitsBrowser.Controls.ClassSelector.prototype.setClasses = function(classes) {
        if ($.isArray(classes)) {
            var options;
            if (classes.length === 0) {
                this.dropDown.disabled = true;
                options = ["[No classes loaded]"];
            } else {
                this.dropDown.disabled = false;
                options = classes.map(function(ageClass) { return ageClass.name; });
            }
            
            var optionsList = d3.select(this.dropDown).selectAll("option").data(options);
            optionsList.enter().append("option");
            
            optionsList.attr("value", function(_value, index) { return index.toString(); })
                       .text(function(value) { return value; });
                       
            optionsList.exit().remove();
        } else {
            SplitsBrowser.throwInvalidData("ClassSelector.setClasses: classes is not an array");
        }
    };

    /**
    * Add a change handler to be called whenever the selected class is changed.
    *
    * The index of the newly-selected item is passed to each handler function.
    *
    * @param {Function} handler - Handler function to be called whenever the class
    *                   changes.
    */
    SplitsBrowser.Controls.ClassSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    SplitsBrowser.Controls.ClassSelector.prototype.onSelectionChanged = function() {
        var outerThis = this;
        this.changeHandlers.forEach(function(handler) { handler(outerThis.dropDown.selectedIndex); });
    };
})();
