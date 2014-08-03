/*
 *  SplitsBrowser CompetitorSelection - The currently-selected competitors.
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
(function (){
    "use strict";
    
    var NUMBER_TYPE = typeof 0;
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
    * Represents the currently-selected competitors, and offers a callback
    * mechanism for when the selection changes.
    * @constructor
    * @param {Number} count - The number of competitors that can be chosen.
    */
    function CompetitorSelection(count) {
        if (typeof count !== NUMBER_TYPE) {
            throwInvalidData("Competitor count must be a number");
        } else if (count < 0) {
            throwInvalidData("Competitor count must be a non-negative number");
        }

        this.count = count;
        this.currentIndexes = [];
        this.changeHandlers = [];
    }

    /**
    * Returns whether the competitor at the given index is selected.
    * @param {Number} index - The index of the competitor.
    * @returns {boolean} True if the competitor is selected, false if not.
    */
    CompetitorSelection.prototype.isSelected = function (index) {
        return this.currentIndexes.indexOf(index) > -1;
    };
    
    /**
    * Returns whether the selection consists of exactly one competitor.
    * @returns {boolean} True if precisely one competitor is selected, false if
    *     either no competitors, or two or more competitors, are selected.
    */
    CompetitorSelection.prototype.isSingleRunnerSelected = function () {
        return this.currentIndexes.length === 1;
    };
    
    /**
    * Returns the index of the single selected competitor.
    *
    * If no competitors, or more than two competitors, are selected, null is
    * returned
    *
    * @return {Number|null} Index of the single selected competitor, or null.
    */
    CompetitorSelection.prototype.getSingleRunnerIndex = function () {
        return (this.isSingleRunnerSelected()) ? this.currentIndexes[0] : null;
    };

    /**
    * Given that a single runner is selected, select also all of the runners
    * that 'cross' this runner and are also marked as visible.
    * @param {Array} competitorDetails - Array of competitor details to
    *     check within.
    */    
    CompetitorSelection.prototype.selectCrossingRunners = function (competitorDetails) {
        if (this.isSingleRunnerSelected()) {
            var refCompetitor = competitorDetails[this.currentIndexes[0]].competitor;
            
            competitorDetails.forEach(function (compDetails, idx) {
                if (compDetails.visible && compDetails.competitor.crosses(refCompetitor)) {
                    this.currentIndexes.push(idx);
                }
            }, this);
            
            this.currentIndexes.sort(d3.ascending);
            this.fireChangeHandlers();
        }
    };
    
    /**
    * Fires all of the change handlers currently registered.
    */
    CompetitorSelection.prototype.fireChangeHandlers = function () {
        // Call slice(0) to return a copy of the list.
        this.changeHandlers.forEach(function (handler) { handler(this.currentIndexes.slice(0)); }, this);
    };

    /**
    * Select all of the competitors.
    */
    CompetitorSelection.prototype.selectAll = function () {
        this.currentIndexes = d3.range(this.count);
        this.fireChangeHandlers();
    };

    /**
    * Select none of the competitors.
    */
    CompetitorSelection.prototype.selectNone = function () {
        this.currentIndexes = [];
        this.fireChangeHandlers();
    };

    /**
    * Returns an array of all currently-selected competitor indexes.
    * @return {Array} Array of selected indexes.
    */
    CompetitorSelection.prototype.getSelectedIndexes = function () {
        return this.currentIndexes.slice(0);
    };
    
    /**
    * Set the selected competitors to those in the given array.
    * @param {Array} selectedIndex - Array of indexes of selected competitors.
    */
    CompetitorSelection.prototype.setSelectedIndexes = function (selectedIndexes) {
        if (selectedIndexes.every(function (index) { return 0 <= index && index < this.count; }, this)) {
            this.currentIndexes = selectedIndexes;
            this.fireChangeHandlers();
        }
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
    * @param {Function} handler - The handler to register.
    */
    CompetitorSelection.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Unregister a handler from being called when the list of indexes changes.
    *
    * If the handler given was never registered, nothing happens.
    *
    * @param {Function} handler - The handler to register.
    */
    CompetitorSelection.prototype.deregisterChangeHandler = function (handler) {
        var index = this.changeHandlers.indexOf(handler);
        if (index > -1) {
            this.changeHandlers.splice(index, 1);
        }
    };

    /**
    * Toggles whether the competitor at the given index is selected.
    * @param {Number} index - The index of the competitor.
    */
    CompetitorSelection.prototype.toggle = function (index) {
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
                throwInvalidData("Index '" + index + "' is out of range");
            }
        } else {
            throwInvalidData("Index is not a number");
        }
    };
    
    /**
    * Selects a number of competitors, firing the change handlers once at the
    * end if any indexes were added.
    * @param {Array} indexes - Array of indexes of competitors to select.
    */
    CompetitorSelection.prototype.bulkSelect = function (indexes) {
        if (indexes.some(function (index) {
            return (typeof index !== NUMBER_TYPE || index < 0 || index >= this.count);
        }, this)) {
            throwInvalidData("Indexes not all numeric and in range");
        }
        
        // Remove from the set of indexes given any that are already selected.
        var currentIndexSet = d3.set(this.currentIndexes);
        indexes = indexes.filter(function (index) { return !currentIndexSet.has(index); });
        
        if (indexes.length > 0) {
            this.currentIndexes = this.currentIndexes.concat(indexes);
            this.currentIndexes.sort(d3.ascending);
            this.fireChangeHandlers();
        }
    };
    
    /**
    * Deselects a number of competitors, firing the change handlers once at the
    * end if any indexes were removed.
    * @param {Array} indexes - Array of indexes of competitors to deselect.
    */
    CompetitorSelection.prototype.bulkDeselect = function (indexes) {
        if (indexes.some(function (index) {
            return (typeof index !== NUMBER_TYPE || index < 0 || index >= this.count);
        }, this)) {
            throwInvalidData("Indexes not all numeric and in range");
        }
        
        // Remove from the set of indexes given any that are not already selected.
        var currentIndexSet = d3.set(this.currentIndexes);
        var anyRemoved = false;
        for (var i = 0; i < indexes.length; i += 1) {
            if (currentIndexSet.has(indexes[i])) {
                currentIndexSet.remove(indexes[i]);
                anyRemoved = true;
            }
        }
        
        if (anyRemoved) {
            this.currentIndexes = currentIndexSet.values().map(function (index) { return parseInt(index, 10); });
            this.currentIndexes.sort(d3.ascending);
            this.fireChangeHandlers();
        }
    };
    
    /**
    * Migrates the selected competitors from one list to another.
    *
    * After the migration, any competitors in the old list that were selected
    * and are also in the new competitors list remain selected.
    *
    * Note that this method does NOT fire change handlers when it runs.  This
    * is typically used during a change of class, when the application may be
    * making other changes.
    *
    * @param {Array} oldCompetitors - Array of Competitor objects for the old
    *      selection.  The length of this must match the current count of
    *      competitors.
    * @param {Array} newCompetitors - Array of Competitor objects for the new
    *      selection.  This array must not be empty.
    */
    CompetitorSelection.prototype.migrate = function (oldCompetitors, newCompetitors) {
        if (!$.isArray(oldCompetitors)) {
            throwInvalidData("CompetitorSelection.migrate: oldCompetitors not an array");
        } else if (!$.isArray(newCompetitors)) {
            throwInvalidData("CompetitorSelection.migrate: newCompetitors not an array");
        } else if (oldCompetitors.length !== this.count) {
            throwInvalidData("CompetitorSelection.migrate: oldCompetitors list must have the same length as the current count"); 
        } else if (newCompetitors.length === 0 && this.currentIndexes.length > 0) {
            throwInvalidData("CompetitorSelection.migrate: newCompetitors list must not be empty if current list has competitors selected");
        }
    
        var selectedCompetitors = this.currentIndexes.map(function (index) { return oldCompetitors[index]; });
        
        this.count = newCompetitors.length;
        this.currentIndexes = [];
        newCompetitors.forEach(function (comp, idx) {
            if (selectedCompetitors.indexOf(comp) >= 0) {
                this.currentIndexes.push(idx);
            }
        }, this);
    };

    SplitsBrowser.Model.CompetitorSelection = CompetitorSelection;
})();
