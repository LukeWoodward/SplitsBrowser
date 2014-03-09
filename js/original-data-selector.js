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
    * @param {Function} showOriginalData - Function to call when original data
    *     is to be shown.
    * @param {Function} showRepairedData - Function to call when repaired data
    *     is to be shown.
    */
    var OriginalDataSelector = function (parent, showOriginalData, showRepairedData) {
        this.parent = parent;
        this.showRepairedData = showRepairedData;
        this.showOriginalData = showOriginalData;

        var checkboxId = "originalDataCheckbox";
        this.containerDiv = parent.append("div")
                                  .attr("id", CONTAINER_DIV_ID);

        this.containerDiv.append("div").classed("topRowSpacer", true);    
        
        var span = this.containerDiv.append("span");
        
        var outerThis = this;
        this.checkbox = span.append("input")
                            .attr("type", "checkbox")
                            .attr("id", checkboxId)
                            .on("click", function() { outerThis.showOriginalOrRepairedData(); })
                            .node();
                                 
        span.append("label")
            .attr("for", checkboxId)
            .classed("originalDataSelectorLabel", true)
            .text(getMessage("ShowOriginalData"));
            
        this.containerDiv.attr("title", getMessage("ShowOriginalDataTooltip"));
    };

    /**
    * Shows original or repaired data depending on whether the checkbox is
    * checked.
    */
    OriginalDataSelector.prototype.showOriginalOrRepairedData = function () {
        if (this.checkbox.checked) {
            this.showOriginalData();
        } else {
            this.showRepairedData();
        }
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