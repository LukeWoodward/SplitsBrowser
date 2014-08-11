/*
 *  SplitsBrowser Original Data Selector - Selects original/repaired data.
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
(function () {
    "use strict";
    
    // ID of the div used to contain the object.
    // Must match the name defined in styles.css.
    var CONTAINER_DIV_ID = "originalDataSelectorContainer";
    
    var getMessage = SplitsBrowser.getMessage;
    
    /**
    * Constructs a new OriginalDataSelector object.
    * @constructor
    * @param {d3.selection} parent - d3 selection containing the parent to
    *     insert the selector into.
    */
    function OriginalDataSelector(parent) {
        this.parent = parent;

        var checkboxId = "originalDataCheckbox";
        this.containerDiv = parent.append("div")
                                  .classed("topRowStart", true)
                                  .attr("id", CONTAINER_DIV_ID);

        this.containerDiv.append("div").classed("topRowStartSpacer", true);
        
        var span = this.containerDiv.append("span");
        
        var outerThis = this;
        this.checkbox = span.append("input")
                            .attr("type", "checkbox")
                            .attr("id", checkboxId)
                            .on("click", function() { outerThis.fireChangeHandlers(); })
                            .node();
                                 
        this.label = span.append("label")
                         .attr("for", checkboxId)
                         .classed("originalDataSelectorLabel", true);
                         
        this.handlers = [];
        this.setMessages();
    }
    
    /**
    * Sets the messages in this control, following either its creation of a
    * change of selected language.
    */
    OriginalDataSelector.prototype.setMessages = function () {
        this.label.text(getMessage("ShowOriginalData"));
        this.containerDiv.attr("title", getMessage("ShowOriginalDataTooltip"));    
    };

    /**
    * Register a change handler to be called whenever the choice of original or
    * repaired data is changed.
    *
    * If the handler was already registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    OriginalDataSelector.prototype.registerChangeHandler = function (handler) {
        if (this.handlers.indexOf(handler) === -1) {
            this.handlers.push(handler);
        }
    };
       
    /**
    * Deregister a change handler from being called whenever the choice of
    * original or repaired data is changed.
    *
    * If the handler given was never registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    OriginalDataSelector.prototype.deregisterChangeHandler = function (handler) {
        var index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    };
    
    /**
    * Fires all change handlers registered.
    */
    OriginalDataSelector.prototype.fireChangeHandlers = function () {
        this.handlers.forEach(function (handler) { handler(this.checkbox.checked); }, this);
    };
    
    /**
    * Returns whether original data is selected.
    * @return {boolean} True if original data is selected, false if not.
    */
    OriginalDataSelector.prototype.isOriginalDataSelected = function () {
        return this.checkbox.checked;
    };
    
    /**
    * Selects original data.
    */
    OriginalDataSelector.prototype.selectOriginalData = function () {
        this.checkbox.checked = true;
        this.fireChangeHandlers();
    };
    
    /**
    * Sets whether this original-data selector should be visible.
    * @param {boolean} isVisible - True if the original-data selector should be
    *     visible, false if it should be hidden.
    */
    OriginalDataSelector.prototype.setVisible = function (isVisible) {
        this.containerDiv.style("display", (isVisible) ? null : "none");
    };
    
    /**
    * Sets whether the control is enabled.
    * @param {boolean} isEnabled - True if the control is enabled, false if
    *      disabled.
    */
    OriginalDataSelector.prototype.setEnabled = function (isEnabled) {
        this.parent.selectAll("label.originalDataSelectorLabel")
                   .classed("disabled", !isEnabled);
                              
        this.checkbox.disabled = !isEnabled;
    };
    
    SplitsBrowser.Controls.OriginalDataSelector = OriginalDataSelector;

})();