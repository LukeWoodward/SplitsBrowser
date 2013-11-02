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
        
        this.otherClassesCombiningLabel = span.append("span")
                                              .classed("otherClassCombining", true)
                                              .text("and");
        
        this.otherClassesSelector = span.append("div")
                                   .classed("otherClassSelector", true)
                                   .style("display", "none");
                                   
        this.otherClassesSpan = this.otherClassesSelector.append("span");
        
        this.otherClassesList = d3.select(parent).append("div")
                                                .classed("otherClassList", true)
                                                .style("position", "absolute")
                                                .style("display", "none");
                                   
        this.otherClassesSelector.on("click", function () { outerThis.showHideClassSelector(); });
         
        this.setClasses([]);
        
        // Indexes of the selected 'other classes'.
        this.selectedOtherClassIndexes = d3.set();
        
        // Ensure that a click outside of the drop-down list or the selector
        // box closes it.
        // Taken from http://stackoverflow.com/questions/1403615 and adjusted.
        $(document).click(function (e) {
            var listDiv = outerThis.otherClassesList.node();
            if (listDiv.style.display !== "none") {
                var container = $("div.otherClassList,div.otherClassSelector");
                if (!container.is(e.target) && container.has(e.target).length === 0) { 
                    listDiv.style.display = "none";
                }
            }
        });        
    };

    /**
    * Sets the list of classes that this selector can choose between.
    * 
    * If there are no classes, a 'dummy' entry is added
    * @param {Array} classes - Array of AgeClass objects containing class data.
    */
    SplitsBrowser.Controls.ClassSelector.prototype.setClasses = function(classes) {
        if ($.isArray(classes)) {
            this.classes = classes;
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
      
            if (classes.length > 0) {
                this.updateOtherClasses();
            }
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
    *
    * This text contains either a list of the selected classes, or placeholder
    * text if none are selected.
    */
    SplitsBrowser.Controls.ClassSelector.prototype.onSelectionChanged = function() {
        var outerThis = this;
        this.changeHandlers.forEach(function(handler) { handler(outerThis.dropDown.selectedIndex); });
        this.updateOtherClasses();
    };
    
    /**
    * Updates the text in the other-class box at the top.
    */ 
    SplitsBrowser.Controls.ClassSelector.prototype.updateOtherClassText = function () {
        var classIdxs = this.selectedOtherClassIndexes.values();
        classIdxs.sort(d3.ascending);
        var text;
        if (classIdxs.length === 0) {
            text = "<select>";
        } else {
            var outerThis = this;
            text = classIdxs.map(function (classIdx) { return outerThis.classes[classIdx].name; })
                                 .join(", ");
        }
        
        this.otherClassesSpan.text(text);
    };
    
    /**
    * Updates the other-classes selector div following a change of selected
    * 'main' class.
    */
    SplitsBrowser.Controls.ClassSelector.prototype.updateOtherClasses = function () {
        this.otherClassesList.style("display", "none");
        this.selectedOtherClassIndexes = d3.set();
        this.updateOtherClassText();
            
        $("div.otherClassItem").off("click");
            
        var outerThis = this;
        var newClass = this.classes[this.dropDown.selectedIndex];
        var otherClasses = newClass.course.getOtherClasses(newClass);
        
        var otherClassIndexes = otherClasses.map(function (cls) { return outerThis.classes.indexOf(cls); });
        
        var otherClassesSelection = this.otherClassesList.selectAll("div")
                                                         .data(otherClassIndexes);
        
        otherClassesSelection.enter().append("div")
                                     .classed("otherClassItem", true);
        
        otherClassesSelection.attr("id", function (classIdx) { return "ageClassIdx_" + classIdx; })
                             .classed("selected", false)
                             .text(function (classIdx) { return outerThis.classes[classIdx].name; });
                             
        otherClassesSelection.exit().remove();
        
        if (otherClassIndexes.length > 0) {
            this.otherClassesSelector.style("display", "inline-block");
            this.otherClassesCombiningLabel.style("display", "");
        } else {
            this.otherClassesSelector.style("display", "none");
            this.otherClassesCombiningLabel.style("display", "none");
        }
        
        var offset = $(this.otherClassesSelector.node()).offset();
        var height = $(this.otherClassesSelector.node()).outerHeight();
        this.otherClassesList.style("left", offset.left + "px")
                            .style("top", offset.top + height + "px");
                            
        $("div.otherClassItem").each(function (index, div) {
            $(div).on("click", function () { outerThis.toggleOtherClass(otherClassIndexes[index]); });
        });
    };
    
    /**
    * Shows or hides the class-selector.
    */
    SplitsBrowser.Controls.ClassSelector.prototype.showHideClassSelector = function () {
        this.otherClassesList.style("display", (this.otherClassesList.style("display") === "none") ? "" : "none");
    };
    
    /**
    * Toggles the selection of an other class.
    * @param {Number} classIdx - Index of the class among the list of all classes.
    */
    SplitsBrowser.Controls.ClassSelector.prototype.toggleOtherClass = function (classIdx) {
        if (this.selectedOtherClassIndexes.has(classIdx)) {
            this.selectedOtherClassIndexes.remove(classIdx);
        } else {
            this.selectedOtherClassIndexes.add(classIdx);
        }
        
        d3.select("div#ageClassIdx_" + classIdx).classed("selected", this.selectedOtherClassIndexes.has(classIdx));
        this.updateOtherClassText();
    };
    
})();
