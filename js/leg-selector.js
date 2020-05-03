/*
 *  SplitsBrowser LegSelector - Provides a choice of leg to view within a relay
 *                              class.
 *  
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    var LEG_SELECTOR_ID = "legSelector";
    var LEG_SELECTOR_CONTAINER_ID = "legSelectorContainer";

    /**
    * A control that wraps a drop-down list used to choose which leg of a relay
    * team to show, or whether to show all legs.
    * @param {d3.selection} parent - D3 selection containing the parent element
    *     to add the control to.
    */
    function LegSelector(parent) {
        this.changeHandlers = [];
        this.parent = parent;
        this.courseClassSet = null;
        this.legCount = null;
        
        this.containerDiv = parent.append("div")
                                  .attr("id", LEG_SELECTOR_CONTAINER_ID)
                                  .classed("topRowStart", true)
                                  .style("display", "none");
                                  
        this.containerDiv.append("div")
                         .classed("topRowStartSpacer", true);
        
        this.legSelectorLabel = this.containerDiv.append("span")
                                                 .classed("legSelectorLabel", true);

        var outerThis = this;
        this.dropDown = this.containerDiv.append("select")
                                         .attr("id", LEG_SELECTOR_ID)
                                         .node();
                            
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        this.options = null;
        
        this.dropDown.selectedIndex = 0;
        
        this.setMessages();
    }

    /**
    * Sets the messages in this control, following its creation or a change of
    * selected language.
    */ 
    LegSelector.prototype.setMessages = function () {
        this.legSelectorLabel.text(getMessage("LegSelectorLabel"));    
        this.setLegNames();
    };

    /**
    * Add a change handler to be called whenever the selected class is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler - Handler function to be called whenever the class
    *                   changes.
    */
    LegSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };
    
    /**
    * Sets the names of the legs within the control's drop-down list.
    */
    LegSelector.prototype.setLegNames = function () {
        var legNames = [getMessage("ShowAllLegs")];
        for (var legIndex = 0; legIndex < this.legCount; legIndex += 1) {
            legNames.push(getMessageWithFormatting("ShowLeg", {"$$LEG_NUMBER$$": legIndex + 1}));
        }
    
        this.options = d3.select(this.dropDown).selectAll("option")
                                               .data(legNames);
        this.options.enter().append("option");
        
        this.options = d3.select(this.dropDown).selectAll("option")
                                               .data(legNames);
        this.options.attr("value", function (_name, index) { return (index === 0) ? "" : index - 1; })
                    .text(function (name) { return name; });
                        
        this.options.exit().remove();
    };
    
    /**
    * Sets the course-class set to use.  This will also show or hide the control
    * as appropriate.
    * @param {CourseClassSet} courseClassSet - The course-class set to set.
    */
    LegSelector.prototype.setCourseClassSet = function (courseClassSet) {
        this.courseClassSet = courseClassSet;
        this.legCount = this.courseClassSet.getLegCount();
        if (this.legCount === null) {
            this.options = null;
            d3.select(this.dropDown).selectAll("option").remove();
            this.containerDiv.style("display", "none");
        } else {
            this.setLegNames();
            this.containerDiv.style("display", null);
            this.dropDown.selectedIndex = 0;
        }
    };
    
    /**
    * Returns the selected leg, i.e. the (0-based) leg index if a leg has been
    * chosen, or null if all legs are visible or a team class is not being
    * shown.
    * @return {Number?} Leg index, or null.
    */
    LegSelector.prototype.getSelectedLeg = function () {
        if (this.options === null) {
            return null;
        }
            
        var dropDownIndex = Math.max(this.dropDown.selectedIndex, 0);        
        return (dropDownIndex === 0) ? null : dropDownIndex - 1;
    };
    
    /**
    * Returns the selected leg, i.e. the (0-based) leg index if a leg has been
    * chosen, or null if all legs are visible or a team class is not being
    * shown.
    * @return {Number?} Leg index, or null.
    */
    LegSelector.prototype.setSelectedLeg = function (selectedLeg) {
        if (this.options === null) {
            // Not a relay class so do nothing.
            return;
        }
        
        var dropDownIndexToSet = (selectedLeg === null) ? 0 : selectedLeg + 1;
        if (dropDownIndexToSet < 0 || dropDownIndexToSet >= this.options.size()) {
            dropDownIndexToSet = 0;
        }
        
        this.dropDown.selectedIndex = dropDownIndexToSet;
        this.onSelectionChanged();
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    LegSelector.prototype.onSelectionChanged = function() {
        var selectedLeg = this.getSelectedLeg();
        this.changeHandlers.forEach(function (handler) { handler(selectedLeg); });
    };
    
    SplitsBrowser.Controls.LegSelector = LegSelector;
})();
