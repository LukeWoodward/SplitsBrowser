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
    * Populates the chart popup with the 'Selected classes' data.
    * @param {Array} competitorData - Array of selected-classes data to show.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.setSelectedClasses = function (competitorData) {
        this.popupDivHeader.text("Selected classes");
        
        var rows = this.popupDivTable.selectAll("tr")
                                     .data(competitorData);
                                     
        rows.enter().append("tr");
        
        rows.selectAll("td").remove();
        rows.append("td").text(function (row) { return SplitsBrowser.formatTime(row[0]); });
        rows.append("td").text(function (row) { return row[1]; });
        
        rows.exit().remove();
    };
    
    /**
    * Adjusts the location of the chart popup.
    *
    * The coordinates are in units of pixels from top-left corner of the
    * viewport.
    * @param {Number} x - The x-coordinate of the popup.
    * @param {Number} y - The y-coordinate of the popup.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.setLocation = function (x, y) {
        this.popupDiv.style("left", x + "px")
                     .style("top", y + "px");
    };
    
    /**
    * Shows the chart popup.
    * @param {Number} x - The x-coordinate of the popup.
    * @param {Number} y - The y-coordinate of the popup.
    */
    SplitsBrowser.Controls.ChartPopup.prototype.show = function (x, y) {
        this.popupDiv.style("display", "");
        this.shown = true;
        this.setLocation(x, y);
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