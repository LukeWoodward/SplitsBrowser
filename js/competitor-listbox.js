/* global SplitsBrowser, d3, $ */
(function (){
    "use strict";

    var COMPETITOR_LIST_ID = "competitorList";
    var COMPETITOR_LIST_ID_SELECTOR = "#" + COMPETITOR_LIST_ID;

    /**
    * Object that controls a list of competitors from which the user can select.
    * @constructor
    * @param {HTMLElement} parent - Parent element to add this listbox to.
    */
    SplitsBrowser.Controls.CompetitorListBox = function (parent) {
        this.parent = parent;
        this.handler = null;
        this.competitorSelection = null;

        this.listDiv = d3.select(parent).append("div")
                                        .attr("id", COMPETITOR_LIST_ID);
    };

    /**
    * Returns the width of the listbox, in pixels.
    * @returns {Number} Width of the listbox.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.width = function () {
        return $(COMPETITOR_LIST_ID_SELECTOR).width();
    };

    /**
    * Handles a change to the selection of competitors, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    * @param {Array} indexes - Array of indexes corresponding to selected
    *                          competitors.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.selectionChanged = function (indexes) {
        var outerThis = this;
        this.listDiv.selectAll("div.competitor")
                    .data(d3.range(this.competitorSelection.count))
                    .classed("selected", function (comp, index) { return outerThis.competitorSelection.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a competitor.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.toggleCompetitor = function (index) {
        this.competitorSelection.toggle(index);
    };

    /**
    * Sets the list of competitors.
    * @param {Array} competitors - Array of competitor data.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.setCompetitorList = function (competitors) {
        // Note that we use jQuery's click event handling here instead of d3's,
        // as d3's doesn't seem to work in PhantomJS.
        $("div.competitor").off("click");
        
        var competitorDivs = this.listDiv.selectAll("div.competitor").data(competitors);

        competitorDivs.enter().append("div")
                              .classed("competitor", true);

        competitorDivs.classed("mispunched", function (comp) { return !comp.completed(); })
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
    SplitsBrowser.Controls.CompetitorListBox.prototype.setSelection = function (selection) {
        if (this.competitorSelection !== null) {
            this.competitorSelection.deregisterChangeHandler(this.handler);
        }

        var outerThis = this;
        this.competitorSelection = selection;
        this.handler = function (indexes) { outerThis.selectionChanged(indexes); };
        this.competitorSelection.registerChangeHandler(this.handler);
        this.selectionChanged(d3.range(selection.count));
    };
})();
