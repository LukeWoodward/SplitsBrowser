/*
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
    
    // ID of the container that contains the list and the filter textbox.
    var COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    /**
    * Object that controls a list of competitors from which the user can select.
    * @constructor
    * @param {HTMLElement} parent - Parent element to add this listbox to.
    * @param {Function} alerter - Function to call to issue an alert message.
    */
    var CompetitorListBox = function (parent, alerter) {
        this.parent = parent;
        this.alerter = alerter;
        this.handler = null;
        this.competitorSelection = null;
        this.lastFilterString = "";
        this.allCompetitors = [];
        this.normedNames = [];
        
        this.containerDiv = d3.select(parent).append("div")
                                             .attr("id", COMPETITOR_LIST_CONTAINER_ID);
                                               
        this.buttonsPanel = this.containerDiv.append("div");
                           
        var outerThis = this;
        this.allButton = this.buttonsPanel.append("button")
                                          .attr("id", "selectAllCompetitors")
                                          .text(getMessage("SelectAllCompetitors"))
                                          .style("width", "50%")
                                          .on("click", function () { outerThis.selectAll(); });
                        
        this.noneButton = this.buttonsPanel.append("button")
                                           .attr("id", "selectNoCompetitors")
                                           .text(getMessage("SelectNoCompetitors"))
                                           .style("width", "50%")
                                           .on("click", function () { outerThis.selectNone(); });
                        
        this.buttonsPanel.append("br");
                        
        this.crossingRunnersButton = this.buttonsPanel.append("button")
                                                      .attr("id", "selectCrossingRunners")
                                                      .text(getMessage("SelectCrossingRunners"))
                                                      .style("width", "100%")
                                                      .on("click", function () { outerThis.selectCrossingRunners(); })
                                                      .style("display", "none");
        
        this.filter = this.buttonsPanel.append("input")
                                       .attr("type", "text")
                                       .attr("placeholder", "Filter");

        this.filter.on("keyup", function () { outerThis.onFilterKeyUp(); });
                                      
        this.listDiv = this.containerDiv.append("div")
                                        .attr("id", COMPETITOR_LIST_ID);
    };

    /**
    * Returns the width of the listbox, in pixels.
    * @returns {Number} Width of the listbox.
    */
    CompetitorListBox.prototype.width = function () {
        return $(this.listDiv.node()).width();
    };
    
    /**
    * Sets the overall height of the competitor listbox.
    * @param {Number} height - The height of the control, in pixels.
    */
    CompetitorListBox.prototype.setHeight = function (height) {
        $(this.listDiv.node()).height(height - $(this.buttonsPanel.node()).height());
    };

    /**
    * Select all of the competitors.
    */
    CompetitorListBox.prototype.selectAll = function () {
        this.competitorSelection.selectAll();
    };

    /**
    * Select none of the competitors.
    */
    CompetitorListBox.prototype.selectNone = function () {
        this.competitorSelection.selectNone();
    };

    /**
    * Select all of the competitors that cross the unique selected competitor.
    */
    CompetitorListBox.prototype.selectCrossingRunners = function () {
        this.competitorSelection.selectCrossingRunners(this.allCompetitors); 
        if (this.competitorSelection.isSingleRunnerSelected()) {
            // Only a single runner is still selected, so nobody crossed the
            // selected runner.
            var competitorName = this.allCompetitors[this.competitorSelection.getSingleRunnerIndex()].name;
            this.alerter(getMessageWithFormatting("RaceGraphNoCrossingRunners", {"$$NAME$$": competitorName}));
        }
    };
    
    /**
    * Enables or disables the crossing-runners button as appropriate.
    */
    CompetitorListBox.prototype.enableOrDisableCrossingRunnersButton = function () {
        this.crossingRunnersButton.node().disabled = !this.competitorSelection.isSingleRunnerSelected();
    };
    
    /**
    * Sets the chart type, so that the competitor list knows whether to show or
    * hide the Crossing Runners button.
    * @param {Object} chartType - The chart type selected.
    */
    CompetitorListBox.prototype.setChartType = function (chartType) {
        this.crossingRunnersButton.style("display", (chartType.isRaceGraph) ? "block" : "none");    
    };

    /**
    * Handles a change to the selection of competitors, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    */
    CompetitorListBox.prototype.selectionChanged = function () {
        var outerThis = this;
        this.listDiv.selectAll("div.competitor")
                    .data(d3.range(this.competitorSelection.count))
                    .classed("selected", function (comp, index) { return outerThis.competitorSelection.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a competitor.
    */
    CompetitorListBox.prototype.toggleCompetitor = function (index) {
        this.competitorSelection.toggle(index);
    };

    /**
    * 'Normalise' a name or a search string into a common format.
    *
    * This is used before searching: a name matches a search string if the
    * normalised name contains the normalised search string.
    *
    * At present, the normalisations carried out are:
    * * Conversion to lower case
    * * Removing all non-alphanumeric characters.
    *
    * @param {String} name - The name to normalise.
    * @return {String} The normalised names.
    */
    function normaliseName(name) {
        return name.toLowerCase().replace(/\W/g, "");
    }

    /**
    * Sets the list of competitors.
    * @param {Array} competitors - Array of competitor data.
    * @param {boolean} hasMultipleClasses - Whether the list of competitors is
    *      made up from those in multiple classes.
    */
    CompetitorListBox.prototype.setCompetitorList = function (competitors, multipleClasses) {
        // Note that we use jQuery's click event handling here instead of d3's,
        // as d3's doesn't seem to work in PhantomJS.
        $("div.competitor").off("click");
        
        this.allCompetitors = competitors;
        this.normedNames = competitors.map(function (comp) { return normaliseName(comp.name); });
        
        var competitorDivs = this.listDiv.selectAll("div.competitor").data(competitors);

        competitorDivs.enter().append("div")
                              .classed("competitor", true);

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
        
        var outerThis = this;
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
        this.handler = function (indexes) { outerThis.selectionChanged(indexes); };
        this.competitorSelection.registerChangeHandler(this.handler);
        this.selectionChanged(d3.range(selection.count));
    };
    
    /**
    * Handles a key-up event in the filter textbox.
    */
    CompetitorListBox.prototype.onFilterKeyUp = function () {
        var currentFilterString = this.filter.node().value;
        if (currentFilterString !== this.lastFilterString) {
            var normedFilter = normaliseName(currentFilterString);
            var outerThis = this;
            this.listDiv.selectAll("div.competitor")
                        .style("display", function (div, index) { return (outerThis.normedNames[index].indexOf(normedFilter) >= 0) ? null : "none"; });
            
            this.lastFilterString = currentFilterString;
        }
    };
    
    SplitsBrowser.Controls.CompetitorListBox = CompetitorListBox;
})();
