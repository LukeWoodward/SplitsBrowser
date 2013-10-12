(function (){
    "use strict";

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
     * Object that represents a collection of competitor data for a course.
     * @constructor.
     * @param {string} course - Name of the course.
     * @param {Number} numControls - Number of controls.
     * @param {Array} competitors - Array of Competitor objects.
     */
    SplitsBrowser.Model.Course = function (course, numControls, competitors) {
        this.course = course;
        this.numControls = numControls;
        this.competitors = competitors;
        this.computeRanks();
    };

    /**
    * Return whether this course is empty, i.e. has no competitors.
    * @returns {boolean} True if course empty, false if course not empty.
    */
    SplitsBrowser.Model.Course.prototype.isEmpty = function () {
        return this.competitors.length === 0;
    };

    /**
    * Return the name of the competitor at the given index.
    * @param {Number} index - The index of the competitor within the list of all of them.
    * @returns {string} Name of the competitor.
    */
    SplitsBrowser.Model.Course.prototype.getCompetitorName = function (index) {
        return this.competitors[index].name;
    };

    /**
    * Return the cumulative times of the 'winner' of this course, i.e. the
    * competitor with the least total time.  If there are no competitors that
    * have completed the course, null is returned. 
    * @returns {Array|null} Array of cumulative times, or null if none.
    */
    SplitsBrowser.Model.Course.prototype.getWinnerCumTimes = function () {
        var completingCompetitors = this.competitors.filter(function (comp) { return comp.completed(); });
        if (completingCompetitors.length === 0) {
            return null;
        } else {
            var winner = completingCompetitors[0];
            for (var i = 1; i < completingCompetitors.length; i += 1) {
                if (completingCompetitors[i].totalTime < winner.totalTime) {
                    winner = completingCompetitors[i];
                }
            }

            return winner.cumTimes;
        }
    };

    /**
    * Return the imaginary competitor who recorded the fastest time on each leg
    * of the course.
    * If at least one control has no competitors recording a time for it, null
    * is returned.
    * @returns {Array|null} Cumulative splits of the imaginary competitor with
    *           fastest time, if any.
    */
    SplitsBrowser.Model.Course.prototype.getFastestCumTimes = function () {
        return this.getFastestCumTimesPlusPercentage(0);
    };

    /**
    * Return the imaginary competitor who recorded the fastest time on each leg
    * of the course, with a given percentage of their time added.
    * If at least one control has no competitors recording a time for it, null
    * is returned.
    * @param {Number} percent - The percentage of time to add.
    * @returns {Array|null} Cumulative splits of the imaginary competitor with
    *           fastest time, if any, after adding a percentage.
    */
    SplitsBrowser.Model.Course.prototype.getFastestCumTimesPlusPercentage = function (percent) {
        var ratio = 1 + percent / 100;
        var fastestCumTimes = new Array(this.numControls + 1);
        fastestCumTimes[0] = 0;
        for (var controlIdx = 1; controlIdx <= this.numControls + 1; controlIdx += 1) {
            var fastestForThisControl = null;
            for (var competitorIdx = 0; competitorIdx < this.competitors.length; competitorIdx += 1) {
                var thisTime = this.competitors[competitorIdx].getSplitTimeTo(controlIdx);
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
    * Return data from this course in a form suitable for plotting in a chart.
    * @param {Array} referenceCumTimes - 'Reference' cumulative time data, such
    *            as that of the winner, or the fastest time.
    * @param {Array} currentIndexes - Array of indexes that indicate which
    *           competitors from the overall list are plotted.
    * @param {Object} chartType - The type of chart to draw.
    * @returns {Array} Array of data.
    */
    SplitsBrowser.Model.Course.prototype.getChartData = function (referenceCumTimes, currentIndexes, chartType) {
        if (this.isEmpty()) {
            SplitsBrowser.throwInvalidData("Cannot return chart data when there is no data");
        } else if (typeof referenceCumTimes === "undefined") {
            throw new TypeError("referenceCumTimes undefined or missing");
        } else if (typeof currentIndexes === "undefined") {
            throw new TypeError("currentIndexes undefined or missing");
        } else if (typeof chartType === "undefined") {
            throw new TypeError("chartType undefined or missing");
        }

        var competitorData = this.competitors.map(function (comp) { return chartType.dataSelector(comp, referenceCumTimes); });
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

        var outerThis = this;
        var cumulativeTimesByControl = d3.transpose(selectedCompetitorData);
        var xData = (chartType.skipStart) ? referenceCumTimes.slice(1) : referenceCumTimes;
        var zippedData = d3.zip(xData, cumulativeTimesByControl);
        var competitorNames = currentIndexes.map(function (index) { return outerThis.getCompetitorName(index); });
        return {
            dataColumns: zippedData.map(function (data) { return { x: data[0], ys: data[1] }; }),
            competitorNames: competitorNames,
            numControls: this.numControls,
            xExtent: [0, xMax],
            yExtent: [yMin, yMax]
        };
    };
    
    /**
    * Compute the ranks of each competitor within their course.
    */
    SplitsBrowser.Model.Course.prototype.computeRanks = function () {
        var splitRanksByCompetitor = [];
        var cumRanksByCompetitor = [];
        var outerThis = this;
        
        this.competitors.forEach(function (_comp) {
            splitRanksByCompetitor.push([]);
            cumRanksByCompetitor.push([]);
        });
        
        d3.range(1, this.numControls + 2).forEach(function (control) {
            var splitsByCompetitor = outerThis.competitors.map(function(comp) { return comp.getSplitTimeTo(control); });
            var splitRanksForThisControl = SplitsBrowser.Model.getRanks(splitsByCompetitor);
            outerThis.competitors.forEach(function (_comp, idx) { splitRanksByCompetitor[idx].push(splitRanksForThisControl[idx]); });
        });
        
        d3.range(1, this.numControls + 2).forEach(function (control) {
            var cumSplitsByCompetitor = outerThis.competitors.map(function(comp) { return comp.getCumulativeTimeTo(control); });
            var cumRanksForThisControl = SplitsBrowser.Model.getRanks(cumSplitsByCompetitor);
            outerThis.competitors.forEach(function (_comp, idx) { cumRanksByCompetitor[idx].push(cumRanksForThisControl[idx]); });
        });
        
        this.competitors.forEach(function (comp, idx) {
            comp.setSplitAndCumulativeRanks(splitRanksByCompetitor[idx], cumRanksByCompetitor[idx]);
        });
    };
    
    
})();