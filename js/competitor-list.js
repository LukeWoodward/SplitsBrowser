/*
 *  SplitsBrowser CompetitorList - Lists the competitors down the left side.
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
    
    // The number that identifies the left mouse button in a jQuery event.
    var JQUERY_EVENT_LEFT_BUTTON = 1;
    
    // ID of the container that contains the list and the filter textbox.
    var COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    /**
    * Object that controls a list of competitors from which the user can select.
    * @constructor
    * @param {HTMLElement} parent - Parent element to add this list to.
    * @param {Function} alerter - Function to call to issue an alert message.
    */
    var CompetitorList = function (parent, alerter) {
        this.parent = parent;
        this.alerter = alerter;
        this.handler = null;
        this.competitorSelection = null;
        this.lastFilterString = "";
        this.allCompetitors = [];
        this.normedNames = [];
        this.dragging = false;
        this.dragStartX = null;
        this.dragStartY = null;
        this.dragStartCompetitorIndex = null;
        
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

        // Update the filtered list of competitors on any change to the
        // contents of the filter textbox.  The last two are for the benefit of
        // IE9 which doesn't fire the input event upon text being deleted via
        // selection or the X button at the right.  Instead, we use delayed
        // updates to filter on key-up and mouse-up, which I believe *should*
        // catch every change.  It's not a problem to update the filter too
        // often: if the filter text hasn't changed, nothing happens.
        this.filter.on("input", function () { outerThis.updateFilter(); })
                   .on("keyup", function () { outerThis.updateFilterDelayed(); })
                   .on("mouseup", function () { outerThis.updateFilterDelayed(); });
                                      
        this.listDiv = this.containerDiv.append("div")
                                        .attr("id", COMPETITOR_LIST_ID);
                                        
        this.dragDiv = this.listDiv.append("div")
                                   .attr("id", "dragDiv")
                                   .style("display", "none")
                                   .style("position", "absolute")
                                   .style("z-index", "100");
                                        
        $(this.listDiv.node()).mousedown(function (evt) { outerThis.startDrag(evt); })
                              .mousemove(function (evt) { outerThis.mouseMove(evt); })
                              .mouseup(function (evt) { outerThis.stopDrag(evt); });
                              
        $(document).mouseup(function (evt) { outerThis.stopDrag(evt); });
    };
    
    /**
    * Updates the position of the drag rectangle.
    * @param {Number} currentX - The current mouse X coordinate, relative to
    *     the page.
    * @param {Number} currentY - The current mouse Y coordinate, relative to
    *     the page.
    */
    CompetitorList.prototype.updateDragRectangle = function (currentX, currentY) {
        var xOffset = Math.min(currentX, this.dragStartX);
        var yOffset = Math.min(currentY, this.dragStartY);
        var width = Math.abs(currentX - this.dragStartX) + 1;
        var height = Math.abs(currentY - this.dragStartY) + 1;
        this.dragDiv.style("left", xOffset + "px")
                    .style("top", yOffset + "px")
                    .style("width", width + "px")
                    .style("height", height + "px");
    };
    
    /**
    * Handles the start of a drag over the list of competitors.
    * @param {jQuery.eventObject} evt - jQuery event object.
    */
    CompetitorList.prototype.startDrag = function (evt) {
        if (evt.which === JQUERY_EVENT_LEFT_BUTTON) {
            evt.preventDefault();
            evt.stopPropagation();
            this.dragStartX = evt.pageX;
            this.dragStartY = evt.pageY;
            this.dragDiv.style("display", null);
            this.dragStartCompetitorIndex = $("div.competitor").index(evt.currentTarget);
            this.updateDragRectangle(this.dragStartX, this.dragStartY);
            this.dragging = true;
        }
    };
    
    /**
    * Handles the movement of the mouse over the list of competitors.
    * @param {jQuery.eventObject} evt - jQuery event object.
    */
    CompetitorList.prototype.mouseMove = function (evt) {
        if (this.dragging) {
            this.updateDragRectangle(evt.pageX, evt.pageY);
            evt.stopPropagation();
        }
    };

    /**
    * Handles the end of a drag in the competitor list.
    * @param {jQuery.eventObject} evt - jQuery event object.
    */
    CompetitorList.prototype.stopDrag = function (evt) {
        if (!this.dragging) {
            // This handler is wired up to mouseUp on the entire document, in
            // order to cancel the drag if it is let go away from the list.  If
            // we're not dragging then we have a mouse-up after a mouse-down
            // somewhere outside of this competitor list.  Ignore it.
            return;
        }
        
        if (evt.currentTarget === this.dragDiv.node()) {
            // Event target is the dragging rubber-band div (IE9/10 only - on
            // other browsers the CSS property pointer-events: none prevents
            // this div from receiving mouse events).  Ignore it and let the
            // event propagate.
            return;
        }
        
        evt.stopPropagation();
        var competitors = $("div.competitor");
        var startIndex = this.dragStartCompetitorIndex;
        var endIndex = competitors.index(evt.currentTarget);
        this.dragging = false;
        this.dragDiv.style("display", "none");
        this.dragStartX = null;
        this.dragStartY = null;
        this.dragStartCompetitorIndex = null;
        if (evt.currentTarget === document) {
            // Drag ended outside the list, so do nothing further.
        } else if (startIndex === endIndex) {
            // Do nothing; the user clicked on a competitor, or dragged
            // entirely outside the list.
        } else {
            if (startIndex === -1) {
                startIndex = competitors.length - 1;
            }
            
            if (endIndex === -1) {
                endIndex = competitors.length - 1;
            }
            
            var minIndex = Math.min(startIndex, endIndex);
            var maxIndex = Math.max(startIndex, endIndex);
            var selectedIndexes = d3.range(minIndex, maxIndex + 1).filter(function (index) {
                return $(competitors[index]).is(":visible");
            });
            
            this.competitorSelection.bulkSelect(selectedIndexes);
        }
    };

    /**
    * Returns the width of the list, in pixels.
    * @returns {Number} Width of the list.
    */
    CompetitorList.prototype.width = function () {
        return $(this.listDiv.node()).width();
    };
    
    /**
    * Sets the overall height of the competitor list.
    * @param {Number} height - The height of the control, in pixels.
    */
    CompetitorList.prototype.setHeight = function (height) {
        $(this.listDiv.node()).height(height - $(this.buttonsPanel.node()).height());
    };

    /**
    * Select all of the competitors.
    */
    CompetitorList.prototype.selectAll = function () {
        this.competitorSelection.selectAll();
    };

    /**
    * Select none of the competitors.
    */
    CompetitorList.prototype.selectNone = function () {
        this.competitorSelection.selectNone();
    };

    /**
    * Select all of the competitors that cross the unique selected competitor.
    */
    CompetitorList.prototype.selectCrossingRunners = function () {
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
    CompetitorList.prototype.enableOrDisableCrossingRunnersButton = function () {
        this.crossingRunnersButton.node().disabled = !this.competitorSelection.isSingleRunnerSelected();
    };
    
    /**
    * Sets the chart type, so that the competitor list knows whether to show or
    * hide the Crossing Runners button.
    * @param {Object} chartType - The chart type selected.
    */
    CompetitorList.prototype.setChartType = function (chartType) {
        this.crossingRunnersButton.style("display", (chartType.isRaceGraph) ? "block" : "none");    
    };

    /**
    * Handles a change to the selection of competitors, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    */
    CompetitorList.prototype.selectionChanged = function () {
        var outerThis = this;
        this.listDiv.selectAll("div.competitor")
                    .data(d3.range(this.competitorSelection.count))
                    .classed("selected", function (comp, index) { return outerThis.competitorSelection.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a competitor.
    */
    CompetitorList.prototype.toggleCompetitor = function (index) {
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
    CompetitorList.prototype.setCompetitorList = function (competitors, multipleClasses) {
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
        $("div.competitor").mousedown(function (evt) { outerThis.startDrag(evt); })
                           .mousemove(function (evt) { outerThis.mouseMove(evt); })
                           .mouseup(function (evt) { outerThis.stopDrag(evt); });
        
        $("div.competitor").each(function (index, div) {
            $(div).on("click", function () { outerThis.toggleCompetitor(index); });
        });
    };

    /**
    * Sets the competitor selection object.
    * @param {SplitsBrowser.Controls.CompetitorSelection} selection - Competitor selection.
    */
    CompetitorList.prototype.setSelection = function (selection) {
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
    * Updates the filtering following a change in the filter text input.
    */
    CompetitorList.prototype.updateFilter = function () {
        var currentFilterString = this.filter.node().value;
        if (currentFilterString !== this.lastFilterString) {
            var normedFilter = normaliseName(currentFilterString);
            var outerThis = this;
            this.listDiv.selectAll("div.competitor")
                        .style("display", function (div, index) { return (outerThis.normedNames[index].indexOf(normedFilter) >= 0) ? null : "none"; });
            
            this.lastFilterString = currentFilterString;
        }
    };
    
    /**
    * Updates the filtering following a change in the filter text input
    * in a short whiie.
    */
    CompetitorList.prototype.updateFilterDelayed = function () {
        var outerThis = this;
        setTimeout(function () { outerThis.updateFilter(); }, 1);
    };
    
    SplitsBrowser.Controls.CompetitorList = CompetitorList;
})();
