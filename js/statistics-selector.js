(function () {
    "use strict";

    // ID of the statistics selector control.
    // Must match that used in styles.css.
    var STATISTIC_SELECTOR_ID = "statisticSelector";

    var LABEL_ID_PREFIX = "statisticCheckbox";

    var STATISTIC_NAMES = ["Total time", "Split time", "Behind fastest"];

    /**
    * Control that contains a number of checkboxes for enabling and/or disabling
    * the display of various statistics.
    * @constructor
    * @param {HTMLElement} parent - The parent element.
    */
    SplitsBrowser.Controls.StatisticsSelector = function (parent) {
        this.span = d3.select(parent).append("span")
                                     .attr("id", STATISTIC_SELECTOR_ID);   

        var childSpans = this.span.selectAll("span")
                                  .data(STATISTIC_NAMES)
                                  .enter()
                                  .append("span");
         
        childSpans.append("input")
                  .attr("type", "checkbox")
                  .attr("id", function(val, index) { return LABEL_ID_PREFIX + index; });
                  
        childSpans.append("label")
                  .attr("for", function(val, index) { return LABEL_ID_PREFIX + index; })
                  .text(function(name) { return name; });
        
        var outerThis = this;
        $("input", this.span.node()).bind("change", function () { return outerThis.onCheckboxChanged(); });
                   
        this.handlers = [];
    };

    /**
    * Register a change handler to be called whenever the choice of currently-
    * visible statistics is changed.
    *
    * If the handler was already registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    SplitsBrowser.Controls.StatisticsSelector.prototype.registerChangeHandler = function (handler) {
        if (this.handlers.indexOf(handler) === -1) {
            this.handlers.push(handler);
        }
    };
       
    /**
    * Deregister a change handler from being called whenever the choice of
    *  currently-visible statistics is changed.
    *
    * If the handler given was never registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    SplitsBrowser.Controls.StatisticsSelector.prototype.deregisterChangeHandler = function (handler) {
        var index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    };

    /**
    * Return the statistics that are currently enabled.
    * @returns {Array} Array of booleans corresponding to enabled statistics.
    */
    SplitsBrowser.Controls.StatisticsSelector.prototype.getVisibleStatistics = function () {
        return this.span.selectAll("input")[0].map(function (checkbox) { return checkbox.checked; });
    };

    /**
    * Handles the change in state of a checkbox, by firing all of the handlers.
    */
    SplitsBrowser.Controls.StatisticsSelector.prototype.onCheckboxChanged = function () {
        var checkedFlags = this.getVisibleStatistics();
        this.handlers.forEach(function (handler) { handler(checkedFlags); });
    };
})();
