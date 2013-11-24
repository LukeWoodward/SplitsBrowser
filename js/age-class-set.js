/*
 *  SplitsBrowser Age-Class Set - A collection of selected age classes.
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
(function () {
    "use strict";
        
    /**
    * Utility function to merge the lists of all competitors in a number of age
    * classes.  All age classes must contain the same number of controls.
    * @param {Array} ageClasses - Array of AgeClass objects.
    */
    function mergeCompetitors(ageClasses) {
        if (ageClasses.length === 0) {
            SplitsBrowser.throwInvalidData("Cannot create an AgeClassSet from an empty set of competitors");
        }
        
        var allCompetitors = [];
        var expectedControlCount = ageClasses[0].numControls;
        ageClasses.forEach(function (ageClass) {
            if (ageClass.numControls !== expectedControlCount) {
                SplitsBrowser.throwInvalidData("Cannot merge age classes with " + expectedControlCount + " and " + ageClass.numControls + " controls");
            }
            
            ageClass.competitors.forEach(function (comp) { allCompetitors.push(comp); });
        });

        allCompetitors.sort(SplitsBrowser.Model.compareCompetitors);
        return allCompetitors;
    }

    /**
    * Given an array of numbers, return a list of the corresponding ranks of those
    * numbers.
    * @param {Array} sourceData - Array of number values.
    * @returns Array of corresponding ranks.
    */
    SplitsBrowser.Model.getRanks = function (sourceData) {
        // First, sort the source data, removing nulls.
        var sortedData = sourceData.filter(function (x) { return x !== null; });
        sortedData.sort(d3.ascending);
        
        // Now construct a map that maps from source value to rank.
        var rankMap = new d3.map();
        sortedData.forEach(function(value, index) {
            if (!rankMap.has(value)) {
                rankMap.set(value, index + 1);
            }
        });
        
        // Finally, build and return the list of ranks.
        var ranks = sourceData.map(function(value) {
            return (value === null) ? null : rankMap.get(value);
        });
        
        return ranks;
    };
    
    /**
    * An object that represents the currently-selected age classes.
    * @constructor
    * @param {Array} ageClasses - Array of currently-selected age classes.
    */
    SplitsBrowser.Model.AgeClassSet = function (ageClasses) {
        this.allCompetitors = mergeCompetitors(ageClasses);
        this.ageClasses = ageClasses;
        this.numControls = ageClasses[0].numControls;
        this.computeRanks();
    };
    
    /**
    * Returns whether this age-class set is empty, i.e. whether it has no
    * competitors at all.
    */    
    SplitsBrowser.Model.AgeClassSet.prototype.isEmpty = function () {
        return this.allCompetitors.length === 0;
    };
    
    /**
    * Returns the course used by all of the age classes that make up this set.
    * @return {SplitsBrowser.Model.Course} The course used by all age-classes.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.getCourse = function () {
        return this.ageClasses[0].course;
    };
    
    /**
    * Returns the name of the 'primary' age class, i.e. that that has been
    * chosen in the drop-down list.
    * @return {String} Name of the primary age class.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.getPrimaryClassName = function () {
        return this.ageClasses[0].name;
    };
    
    /**
    * Returns the number of age classes that this age-class set is made up of.
    * @return {Number} The number of age classes that this age-class set is
    *     made up of.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.getNumClasses = function () {
        return this.ageClasses.length;
    };
    
    /**
    * Returns an array of the cumulative times of the winner of the set of age
    * classes.
    * @return {Array} Array of the winner's cumulative times.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.getWinnerCumTimes = function () {
        if (this.allCompetitors.length === 0) {
            return null;
        }
        
        var firstCompetitor = this.allCompetitors[0];
        return (firstCompetitor.completed()) ? firstCompetitor.cumTimes : null;
    };

    /**
    * Return the imaginary competitor who recorded the fastest time on each leg
    * of the class.
    * If at least one control has no competitors recording a time for it, null
    * is returned.
    * @returns {Array|null} Cumulative splits of the imaginary competitor with
    *           fastest time, if any.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.getFastestCumTimes = function () {
        return this.getFastestCumTimesPlusPercentage(0);
    };

    /**
    * Returns an array of controls that no competitor in any of the age-classes
    * in this set punched.
    * @return {Array} Array of control numbers of controls that no competitor
    *     punched.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.getControlsWithNoSplits = function () {
        var controlsWithNoSplits = this.ageClasses[0].getControlsWithNoSplits();
        for (var classIndex = 1; classIndex < this.ageClasses.length && controlsWithNoSplits.length > 0; classIndex += 1) {
            var thisClassControlsWithNoSplits = this.ageClasses[classIndex].getControlsWithNoSplits();
            
            var controlIdx = 0;
            while (controlIdx < controlsWithNoSplits.length) {
                if (thisClassControlsWithNoSplits.indexOf(controlsWithNoSplits[controlIdx]) >= 0) {
                    controlIdx += 1;
                } else {
                    controlsWithNoSplits.splice(controlIdx, 1);
                }
            }
        }
        
        return controlsWithNoSplits;
    };

    /**
    * Return the imaginary competitor who recorded the fastest time on each leg
    * of the given classes, with a given percentage of their time added.
    * If at least one control has no competitors recording a time for it, null
    * is returned.
    * @param {Number} percent - The percentage of time to add.
    * @returns {Array|null} Cumulative splits of the imaginary competitor with
    *           fastest time, if any, after adding a percentage.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.getFastestCumTimesPlusPercentage = function (percent) {
        var ratio = 1 + percent / 100;
        var fastestCumTimes = new Array(this.numControls + 1);
        fastestCumTimes[0] = 0;
        for (var controlIdx = 1; controlIdx <= this.numControls + 1; controlIdx += 1) {
            var fastestForThisControl = null;
            for (var competitorIdx = 0; competitorIdx < this.allCompetitors.length; competitorIdx += 1) {
                var thisTime = this.allCompetitors[competitorIdx].getSplitTimeTo(controlIdx);
                if (thisTime !== null && (fastestForThisControl === null || thisTime < fastestForThisControl)) {
                    fastestForThisControl = thisTime;
                }
            }
            
            if (fastestForThisControl === null) {
                // No fastest time recorded for this control.
                return null;
            } else {
                fastestCumTimes[controlIdx] = fastestCumTimes[controlIdx - 1] + fastestForThisControl * ratio;
            }
        }

        return fastestCumTimes;
    };
    
    /**
    * Compute the ranks of each competitor within their class.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.computeRanks = function () {
        var splitRanksByCompetitor = [];
        var cumRanksByCompetitor = [];
        
        this.allCompetitors.forEach(function () {
            splitRanksByCompetitor.push([]);
            cumRanksByCompetitor.push([]);
        });
        
        d3.range(1, this.numControls + 2).forEach(function (control) {
            var splitsByCompetitor = this.allCompetitors.map(function(comp) { return comp.getSplitTimeTo(control); });
            var splitRanksForThisControl = SplitsBrowser.Model.getRanks(splitsByCompetitor);
            this.allCompetitors.forEach(function (_comp, idx) { splitRanksByCompetitor[idx].push(splitRanksForThisControl[idx]); });
        }, this);
        
        d3.range(1, this.numControls + 2).forEach(function (control) {
            // We want to null out all subsequent cumulative ranks after a
            // competitor mispunches.
            var cumSplitsByCompetitor = this.allCompetitors.map(function (comp, idx) {
                // -1 for previous control, another -1 because the cumulative
                // time to control N is cumRanksByCompetitor[idx][N - 1].
                if (control > 1 && cumRanksByCompetitor[idx][control - 1 - 1] === null) {
                    // This competitor has no cumulative rank for the previous
                    // control, so either they mispunched it or mispunched a
                    // previous one.  Give them a null time here, so that they
                    // end up with another null cumulative rank.
                    return null;
                } else {
                    return comp.getCumulativeTimeTo(control);
                }
            });
            var cumRanksForThisControl = SplitsBrowser.Model.getRanks(cumSplitsByCompetitor);
            this.allCompetitors.forEach(function (_comp, idx) { cumRanksByCompetitor[idx].push(cumRanksForThisControl[idx]); });
        }, this);
        
        this.allCompetitors.forEach(function (comp, idx) {
            comp.setSplitAndCumulativeRanks(splitRanksByCompetitor[idx], cumRanksByCompetitor[idx]);
        });
    };
    
    /**
    * Returns the best few splits to a given control.
    *
    * The number of splits returned may actually be fewer than that asked for,
    * if there are fewer than that number of people on the class or who punch
    * the control.
    *
    * The results are returned in an array of 2-element arrays, with each child
    * array containing the split time and the name.  The array is returned in
    * ascending order of split time.
    *
    * @param {Number} numSplits - Maximum number of split times to return.
    * @param {Number} controlIdx - Index of the control.
    * @return {Array} Array of the fastest splits to the given control.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.getFastestSplitsTo = function (numSplits, controlIdx) {
        if (typeof numSplits !== "number" || numSplits <= 0) {
            SplitsBrowser.throwInvalidData("The number of splits must be a positive integer");
        } else if (typeof controlIdx !== "number" || controlIdx <= 0 || controlIdx > this.numControls + 1) {
            SplitsBrowser.throwInvalidData("Control " + controlIdx + " out of range");
        } else {
            // Compare competitors by split time at this control, and, if those
            // are equal, total time.
            var comparator = function (compA, compB) {
                var compASplit = compA.getSplitTimeTo(controlIdx);
                var compBSplit = compB.getSplitTimeTo(controlIdx);
                return (compASplit === compBSplit) ? d3.ascending(compA.totalTime, compB.totalTime) : d3.ascending(compASplit, compBSplit);
            };
            
            var competitors = this.allCompetitors.filter(function (comp) { return comp.completed(); });
            competitors.sort(comparator);
            var results = [];
            for (var i = 0; i < competitors.length && i < numSplits; i += 1) {
                results.push({name: competitors[i].name, split: competitors[i].getSplitTimeTo(controlIdx)});
            }
            
            return results;
        }
    };    

    /**
    * Return data from the current classes in a form suitable for plotting in a chart.
    * @param {Array} referenceCumTimes - 'Reference' cumulative time data, such
    *            as that of the winner, or the fastest time.
    * @param {Array} currentIndexes - Array of indexes that indicate which
    *           competitors from the overall list are plotted.
    * @param {Object} chartType - The type of chart to draw.
    * @returns {Array} Array of data.
    */
    SplitsBrowser.Model.AgeClassSet.prototype.getChartData = function (referenceCumTimes, currentIndexes, chartType) {
        if (this.isEmpty()) {
            SplitsBrowser.throwInvalidData("Cannot return chart data when there is no data");
        } else if (typeof referenceCumTimes === "undefined") {
            throw new TypeError("referenceCumTimes undefined or missing");
        } else if (typeof currentIndexes === "undefined") {
            throw new TypeError("currentIndexes undefined or missing");
        } else if (typeof chartType === "undefined") {
            throw new TypeError("chartType undefined or missing");
        }

        var competitorData = this.allCompetitors.map(function (comp) { return chartType.dataSelector(comp, referenceCumTimes); });
        var selectedCompetitorData = currentIndexes.map(function (index) { return competitorData[index]; });

        var xMax = referenceCumTimes[referenceCumTimes.length - 1];
        var yMin;
        var yMax;
        if (currentIndexes.length === 0) {
            // No competitors selected.  Set yMin and yMax to the boundary
            // values of the first competitor.
            var firstCompetitorTimes = competitorData[0];
            yMin = d3.min(firstCompetitorTimes);
            yMax = d3.max(firstCompetitorTimes);
        } else {
            yMin = d3.min(selectedCompetitorData.map(function (values) { return d3.min(values); }));
            yMax = d3.max(selectedCompetitorData.map(function (values) { return d3.max(values); }));
        }

        if (yMax === yMin) {
            // yMin and yMax will be used to scale a y-axis, so we'd better
            // make sure that they're not equal.
            yMax = yMin + 1;
        }

        var cumulativeTimesByControl = d3.transpose(selectedCompetitorData);
        var xData = (chartType.skipStart) ? referenceCumTimes.slice(1) : referenceCumTimes;
        var zippedData = d3.zip(xData, cumulativeTimesByControl);
        var competitorNames = currentIndexes.map(function (index) { return this.allCompetitors[index].name; }, this);
        return {
            dataColumns: zippedData.map(function (data) { return { x: data[0], ys: data[1] }; }),
            competitorNames: competitorNames,
            numControls: this.numControls,
            xExtent: [0, xMax],
            yExtent: [yMin, yMax]
        };
    };

})();