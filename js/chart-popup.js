(function () {
    "use strict";
    
    /**
    * Creates a ChartPopup control.
    * @constructor
    * @param {HTMLElement} Parent HTML element.
    * @param {Object} handlers - Object that maps mouse event names to handlers.
    */
    SplitsBrowser.Controls.ChartPopup = function (parent, handlers) {

        this.shown = false;
        this.mouseIn = false;
        this.popupDiv = d3.select(parent).append("div");
        this.popupDiv.classed("chartPopup", true)
                     .style("display", "none")
                     .style("position", "absolute");
                     
        this.popupDivHeader = this.popupDiv.append("div")
                                           .classed("chartPopupHeader", true)
                                           .append("span");
                                           
        var popupDivTableContainer = this.popupDiv.append("div")
                                                  .classed("chartPopupTableContainer", true);
                                                  
                                           
        this.popupDivTable = popupDivTableContainer.append("table");

        // At this point we need to pass through mouse events to the parent.
        // This is solely for the benefit of IE < 11, as IE11 and other
        // browsers support pointer-events: none, which means that this div
        // receives no mouse events at all.
        for (var eventName in handlers) {
            if (handlers.hasOwnProperty(eventName)) {
                $(this.popupDiv.node()).on(eventName, handlers[eventName]);
            }
        }
        
        var outerThis = this;
        $(this.popupDiv.node()).mouseenter(function () { outerThis.mouseIn = true; });
        $(this.popupDiv.node()).mouseleave(function () { outerThis.mouseIn = false; });
    };
    
    /**
    * Returns whether the popup is currently shown.
    * @return {boolean} True if the popup is shown, false otherwise.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.isShown = function () {
        return this.shown;
    };
    
    /**
    * Returns whether the mouse is currently over the popup.
    * @return {boolean} True if the mouse is over the popup, false otherwise.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.isMouseIn = function () {
        return this.mouseIn;
    };
    
    /**
    * Populates the chart popup with data.
    *
    * 'competitorData' should be an object that contains a 'title' and a 'data'
    * property.  The 'title' is a string used as the popup's title, and the
    * 'data' property is an array where each elementshould be an object that
    * contains the following properties:
    * * time - A time associated with a competitor.  This may be a split time,
    *   cumulative time or the time of day.
    * * className (Optional) - Name of the competitor's class.
    * * name - The name of the competitor.
    * * highlight - A boolean value which indicates whether to highlight the
    *   competitor.
    * @param {Object} competitorData - Array of data to show.
    * @param {boolean} includeClassNames - Whether to include class names.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.setData = function (competitorData, includeClassNames) {
        this.popupDivHeader.text(competitorData.title);
        
        var rows = this.popupDivTable.selectAll("tr")
                                     .data(competitorData.data);
                                     
        rows.enter().append("tr");
        
        rows.classed("highlighted", function (row) { return row.highlight; });
        
        rows.selectAll("td").remove();
        rows.append("td").text(function (row) { return SplitsBrowser.formatTime(row.time); });
        if (includeClassNames) {
            rows.append("td").text(function (row) { return row.className; });
        }
        rows.append("td").text(function (row) { return row.name; });
        
        rows.exit().remove();
    };
    
    /**
    * Adjusts the location of the chart popup.
    *
    * The location object should contain "x" and "y" properties.  The two
    * coordinates are in units of pixels from top-left corner of the viewport.
    *
    * @param {Object} location - The location of the chart popup.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.setLocation = function (location) {
        this.popupDiv.style("left", location.x + "px")
                     .style("top", location.y + "px");
    };
    
    /**
    * Shows the chart popup.
    *
    * The location object should contain "x" and "y" properties.  The two
    * coordinates are in units of pixels from top-left corner of the viewport.
    *
    * @param {Object} location - The location of the chart popup.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.show = function (location) {
        this.popupDiv.style("display", "");
        this.shown = true;
        this.setLocation(location);
    };
    
    /**
    * Hides the chart popup.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.hide = function () {
        this.popupDiv.style("display", "none");
        this.shown = false;
    };
    
    /**
    * Returns the height of the popup, in units of pixels.
    * @return {Number} Height of the popup, in pixels.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.height = function () {
        return $(this.popupDiv.node()).height();
    };
})();