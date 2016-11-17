/*
 *  SplitsBrowser ClassSelector - Provides a choice of classes to compare.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var getMessage = SplitsBrowser.getMessage;

    /**
    * A control that wraps a drop-down list used to choose between classes.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    function ClassSelector(parent) {
        this.changeHandlers = [];
        this.otherClassesEnabled = true;
        
        var div = d3.select(parent).append("div")
                                   .classed("topRowStart", true);
        
        this.labelSpan = div.append("span");
        
        var outerThis = this;
        this.dropDown = div.append("select").node();
        $(this.dropDown).bind("change", function() {
            outerThis.updateOtherClasses(d3.set());
            outerThis.onSelectionChanged();
        });
        
        this.otherClassesContainer = d3.select(parent).append("div")
                                                      .attr("id", "otherClassesContainer")
                                                      .classed("topRowStart", true)
                                                      .style("display", "none");
                                                      
        this.otherClassesCombiningLabel = this.otherClassesContainer.append("span")
                                                                    .classed("otherClassCombining", true);
        
        this.otherClassesSelector = this.otherClassesContainer.append("div")
                                                              .classed("otherClassSelector", true)
                                                              .style("display", "inline-block");
                                   
        this.otherClassesSpan = this.otherClassesSelector.append("span");
        
        this.otherClassesList = d3.select(parent).append("div")
                                                 .classed("otherClassList", true)
                                                 .classed("transient", true)
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
        
        this.setMessages();
    }
    
    /**
    * Sets some messages following either the creation of this control or a
    * change of selected language.
    */
    ClassSelector.prototype.setMessages = function () {
        this.labelSpan.text(getMessage("ClassSelectorLabel"));    
        this.otherClassesCombiningLabel.text(getMessage("AdditionalClassSelectorLabel"));
    };

    /**
    * Sets whether the other-classes selector is enabled, if it is shown at
    * all.
    * @param {boolean} otherClassesEnabled - true to enable the selector, false
    *      to disable it.
    */
    ClassSelector.prototype.setOtherClassesEnabled = function (otherClassesEnabled) {
        this.otherClassesCombiningLabel.classed("disabled", !otherClassesEnabled);
        this.otherClassesSelector.classed("disabled", !otherClassesEnabled);
        this.otherClassesEnabled = otherClassesEnabled;
    };

    /**
    * Sets the list of classes that this selector can choose between.
    * 
    * If there are no classes, a 'dummy' entry is added
    * @param {Array} classes - Array of CourseClass objects containing class
    *     data.
    */
    ClassSelector.prototype.setClasses = function(classes) {
        if ($.isArray(classes)) {
            this.classes = classes;
            var options;
            if (classes.length === 0) {
                this.dropDown.disabled = true;
                options = [getMessage("NoClassesLoadedPlaceholder")];
            } else {
                this.dropDown.disabled = false;
                options = classes.map(function(courseClass) { return courseClass.name; });
            }
            
            var optionsList = d3.select(this.dropDown).selectAll("option").data(options);
            optionsList.enter().append("option");
            
            optionsList = d3.select(this.dropDown).selectAll("option").data(options);
            optionsList.attr("value", function(_value, index) { return index.toString(); })
                       .text(function(value) { return value; });
                       
            optionsList.exit().remove();
      
            this.updateOtherClasses(d3.set());
        } else {
            throwInvalidData("ClassSelector.setClasses: classes is not an array");
        }
    };

    /**
    * Add a change handler to be called whenever the selected class or classes
    * is changed.
    *
    * An array containing the indexes of the newly-selected classes is passed to
    * each handler function.  This array is guaranteed to be non-empty.  The
    * first index in the array is the 'primary' class.
    *
    * @param {Function} handler - Handler function to be called whenever the class
    *                   changes.
    */
    ClassSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };
    
    /**
    * Sets the selected classes.
    * @param {Array} selectedIndexes - Array of indexes of classes.
    */
    ClassSelector.prototype.selectClasses = function (selectedIndexes) {
        if (selectedIndexes.length > 0 && selectedIndexes.every(function (index) { return 0 <= index && index < this.dropDown.options.length; }, this)) {
            this.dropDown.selectedIndex = selectedIndexes[0];
            this.updateOtherClasses(d3.set(selectedIndexes.slice(1)));
            this.onSelectionChanged();
        }
    };
    
    /**
    * Returns the indexes of the selected classes.
    * @param {Array} Indexes of selected classes.
    */
    ClassSelector.prototype.getSelectedClasses = function () {
        if (this.dropDown.disabled) {
            return [];
        } else {
            var indexes = [this.dropDown.selectedIndex];
            this.selectedOtherClassIndexes.each(function (index) { indexes.push(parseInt(index, 10)); });
            return indexes;
        }
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    ClassSelector.prototype.onSelectionChanged = function() {
        var indexes = this.getSelectedClasses();
        this.changeHandlers.forEach(function(handler) { handler(indexes); });
    };
    
    /**
    * Updates the text in the other-class box at the top.
    *
    * This text contains either a list of the selected classes, or placeholder
    * text if none are selected.
    */ 
    ClassSelector.prototype.updateOtherClassText = function () {
        var classIdxs = this.selectedOtherClassIndexes.values();
        classIdxs.sort(d3.ascending);
        var text;
        if (classIdxs.length === 0) {
            text = getMessage("NoAdditionalClassesSelectedPlaceholder");
        } else {
            text = classIdxs.map(function (classIdx) { return this.classes[classIdx].name; }, this)
                            .join(", ");
        }
        
        this.otherClassesSpan.text(text);
    };
    
    /**
    * Updates the other-classes selector div following a change of selected
    * 'main' class.
    * @param {d3.set} selectedOtherClassIndexes - Array of selected other-class indexes.
    */
    ClassSelector.prototype.updateOtherClasses = function (selectedOtherClassIndexes) {
        this.otherClassesList.style("display", "none");
        this.selectedOtherClassIndexes = selectedOtherClassIndexes;
        this.updateOtherClassText();
            
        $("div.otherClassItem").off("click");
            
        var outerThis = this;
        var otherClasses;
        if (this.classes.length > 0) {
            var newClass = this.classes[this.dropDown.selectedIndex];
            otherClasses = newClass.course.getOtherClasses(newClass);
        } else {
            otherClasses = [];
        }
        
        var otherClassIndexes = otherClasses.map(function (cls) { return this.classes.indexOf(cls); }, this);
        
        var otherClassesSelection = this.otherClassesList.selectAll("div")
                                                         .data(otherClassIndexes);
        
        otherClassesSelection.enter().append("div")
                                     .classed("otherClassItem", true);
        
        otherClassesSelection = this.otherClassesList.selectAll("div")
                                                     .data(otherClassIndexes);
        
        otherClassesSelection.attr("id", function (classIdx) { return "courseClassIdx_" + classIdx; })
                             .classed("selected", function (classIdx) { return selectedOtherClassIndexes.has(classIdx); })
                             .text(function (classIdx) { return outerThis.classes[classIdx].name; });
                             
        otherClassesSelection.exit().remove();
        
        if (otherClassIndexes.length > 0) {
            this.otherClassesContainer.style("display", null);
        } else {
            this.otherClassesContainer.style("display", "none");
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
    * Shows or hides the other-class selector, if it is enabled.
    */
    ClassSelector.prototype.showHideClassSelector = function () {
        if (this.otherClassesEnabled) {
            this.otherClassesList.style("display", (this.otherClassesList.style("display") === "none") ? null : "none");
        }
    };
    
    /**
    * Toggles the selection of an other class.
    * @param {Number} classIdx - Index of the class among the list of all classes.
    */
    ClassSelector.prototype.toggleOtherClass = function (classIdx) {
        if (this.selectedOtherClassIndexes.has(classIdx)) {
            this.selectedOtherClassIndexes.remove(classIdx);
        } else {
            this.selectedOtherClassIndexes.add(classIdx);
        }
        
        d3.select("div#courseClassIdx_" + classIdx).classed("selected", this.selectedOtherClassIndexes.has(classIdx));
        this.updateOtherClassText();
        this.onSelectionChanged();
    };
    
    /**
    * Retranslates this control following a change of selected language.
    */
    ClassSelector.prototype.retranslate = function () {
        this.setMessages();
        if (this.classes.length === 0) {
            d3.select(this.dropDown.options[0]).text(getMessage("NoClassesLoadedPlaceholder"));
        }
        if (this.selectedOtherClassIndexes.values().length === 0) {
            this.otherClassesSpan.text(getMessage("NoAdditionalClassesSelectedPlaceholder"));
        }
    };
    
    SplitsBrowser.Controls.ClassSelector = ClassSelector;
})();
