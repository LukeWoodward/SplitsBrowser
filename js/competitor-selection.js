/* global SplitsBrowser, d3 */
(function (){
    "use strict";

    /*
    * An object that keeps track of the current selection of competitors, and
    * provides a notification mechanism for changes to the selection.
    */

    var NUMBER_TYPE = typeof 0;

    /**
    * Represents the currently-selected competitors, and offers a callback
    * mechanism for when the selection changes.
    * @constructor
    * @param {Number} count - The number of competitors that can be chosen.
    */
    SplitsBrowser.Model.CompetitorSelection = function (count) {
        if (typeof count !== NUMBER_TYPE) {
            SplitsBrowser.throwInvalidData("Competitor count must be a number");
        } else if (count <= 0) {
            SplitsBrowser.throwInvalidData("Competitor count must be a positive number");
        }

        this.count = count;
        this.currentIndexes = [];
        this.changeHandlers = [];
    };

    /**
    * Returns whether the competitor at the given index is selected.
    * @param {Number} index - The index of the competitor.
    * @returns {boolean} True if the competitor is selected, false if not.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.isSelected = function (index) {
        return this.currentIndexes.indexOf(index) > -1;
    };
    
    /**
    * Returns whether the selection consists of exactly one competitor.
    * @returns {boolean} True if precisely one competitor is selected, false if
    *     either no competitors, or two or more competitors, are selected.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.isSingleRunnerSelected = function () {
        return this.currentIndexes.length === 1;
    };

    /**
    * Given that a single runner is selected, select also all of the runners
    * that 'cross' this runner.
    * @param {Array} competitors - All competitors in the same course.
    */    
    SplitsBrowser.Model.CompetitorSelection.prototype.selectCrossingRunners = function (competitors) {
        if (this.isSingleRunnerSelected()) {
            var refCompetitor = competitors[this.currentIndexes[0]];
            
            var outerThis = this;
            competitors.forEach(function (comp, idx) {
                if (comp.crosses(refCompetitor)) {
                    outerThis.currentIndexes.push(idx);
                }
            });
            
            this.currentIndexes.sort(d3.ascending);
            this.fireChangeHandlers();
        }
    };
    
    /**
    * Fires all of the change handlers currently registered.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.fireChangeHandlers = function () {
        var outerThis = this;
        // Call slice(0) to return a copy of the list.
        this.changeHandlers.forEach(function (handler) { handler(outerThis.currentIndexes.slice(0)); });
    };

    /**
    * Select all of the competitors.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.selectAll = function () {
        this.currentIndexes = d3.range(this.count);
        this.fireChangeHandlers();
    };

    /**
    * Select none of the competitors.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.selectNone = function () {
        this.currentIndexes = [];
        this.fireChangeHandlers();
    };

    /**
    * Register a handler to be called whenever the list of indexes changes.
    *
    * When a change is made, this function will be called, with the array of
    * indexes being the only argument.  The array of indexes passed will be a
    * copy of that stored internally, so the handler is free to store this
    * array and/or modify it.
    *
    * If the handler has already been registered, nothing happens.
    *
    * @param {function} handler - The handler to register.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Unregister a handler from being called when the list of indexes changes.
    *
    * If the handler given was never registered, nothing happens.
    *
    * @param {function} handler - The handler to register.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.deregisterChangeHandler = function (handler) {
        var index = this.changeHandlers.indexOf(handler);
        if (index > -1) {
            this.changeHandlers.splice(index, 1);
        }
    };

    /**
    * Toggles whether the competitor at the given index is selected.
    * @param {Number} index - The index of the competitor.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.toggle = function (index) {
        if (typeof index === NUMBER_TYPE) {
            if (0 <= index && index < this.count) {
                var position = this.currentIndexes.indexOf(index);
                if (position === -1) {
                    this.currentIndexes.push(index);
                    this.currentIndexes.sort(d3.ascending);
                } else {
                    this.currentIndexes.splice(position, 1);
                }

                this.fireChangeHandlers();
            } else {
                SplitsBrowser.throwInvalidData("Index '" + index + "' is out of range");
            }
        } else {
            SplitsBrowser.throwInvalidData("Index is not a number");
        }
    };
})();
