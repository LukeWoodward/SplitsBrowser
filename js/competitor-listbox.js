﻿/*
 *  SplitsBrowser CompetitorListBox - Lists the competitors down the left side.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    // ID of the competitor list div.
    // Must match that used in styles.css.
    var COMPETITOR_LIST_ID = "competitorList";

    /**
    * Object that controls a list of competitors from which the user can select.
    * @constructor
    * @param {HTMLElement} parent - Parent element to add this listbox to.
    */
    function CompetitorListBox(parent) {
        this.parent = parent;
        this.handler = null;
        this.competitorSelection = null;

        this.listDiv = d3.select(parent).append("div")
                                        .attr("id", COMPETITOR_LIST_ID);
    }

    /**
    * Returns the width of the listbox, in pixels.
    * @returns {Number} Width of the listbox.
    */
    CompetitorListBox.prototype.width = function () {
        return $(this.listDiv.node()).width();
    };

    /**
    * Returns whether the competitor with the given index is selected.
    * @param {Number} index - Index of the competitor within the list.
    * @return True if the competitor is selected, false if not.
    */
    CompetitorListBox.prototype.isSelected = function (index) {
        return this.competitorSelection !== null && this.competitorSelection.isSelected(index);
    };
    
    /**
    * Handles a change to the selection of competitors, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    */
    CompetitorListBox.prototype.selectionChanged = function () {
        var outerThis = this;
        this.listDiv.selectAll("div.competitor")
                    .data(d3.range(this.competitorSelection.count))
                    .classed("selected", function (comp, index) { return outerThis.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a competitor.
    * @param {Number} index - The index of the competitor.
    */
    CompetitorListBox.prototype.toggleCompetitor = function (index) {
        this.competitorSelection.toggle(index);
    };

    /**
    * Sets the list of competitors.
    * @param {Array} competitors - Array of competitor data.
    * @param {boolean} multipleClasses - Whether the list of competitors is
    *      made up from those in multiple classes.
    */
    CompetitorListBox.prototype.setCompetitorList = function (competitors, multipleClasses) {
        // Note that we use jQuery's click event handling here instead of d3's,
        // as d3's doesn't seem to work in PhantomJS.
        $("div.competitor").off("click");
        
        var competitorDivs = this.listDiv.selectAll("div.competitor").data(competitors);

        var outerThis = this;
        competitorDivs.enter().append("div")
                              .classed("competitor", true)
                              .classed("selected", function (comp, index) { return outerThis.isSelected(index); });

        competitorDivs.selectAll("span").remove();
        
        if (multipleClasses) {
            competitorDivs.append("span")
                          .classed("competitorClassLabel", true)
                          .text(function (comp) { return comp.className; });
        }
        
        competitorDivs.append("span")
                      .classed("nonfinisher", function (comp) { return !comp.completed(); })
                      .text(function (comp) { return (comp.completed()) ? comp.name : "* " + comp.name; });        

        competitorDivs.exit().remove();
        
        $("div.competitor").each(function (index, div) {
            $(div).on("click", function () { outerThis.toggleCompetitor(index); });
        });
    };

    /**
    * Sets the competitor selection object.
    * @param {SplitsBrowser.Controls.CompetitorSelection} selection - Competitor selection.
    */
    CompetitorListBox.prototype.setSelection = function (selection) {
        if (this.competitorSelection !== null) {
            this.competitorSelection.deregisterChangeHandler(this.handler);
        }

        var outerThis = this;
        this.competitorSelection = selection;
        this.handler = function () { outerThis.selectionChanged(); };
        this.competitorSelection.registerChangeHandler(this.handler);
        this.selectionChanged();
    };
    
    SplitsBrowser.Controls.CompetitorListBox = CompetitorListBox;
})();
