(function (){
    "use strict";

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
    * Return the cumulative times of the competitors after being adjusted to a
    * 'reference' competitor's times.
    * @param {Array} reference - Array of cumulative times reference data to adjust by.
    * @return Array of arrays of adjusted competitor data.
    */
    SplitsBrowser.Model.Course.prototype.getCumTimesAdjustedToReference = function (reference) {
        var adjustedData = this.competitors.map(function (competitor) { return competitor.getCumTimesAdjustedToReference(reference); });
        return adjustedData;
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
        for (var i = 0; i <= this.numControls; i += 1) {
            var fastestForThisControl = null;
            for (var j = 0; j < this.competitors.length; j += 1) {
                var thisTime = this.competitors[j].getSplitTimes()[i];
                if (thisTime !== null && (fastestForThisControl === null || thisTime < fastestForThisControl)) {
                    fastestForThisControl = thisTime;
                }
            }

            if (fastestForThisControl === null) {
                // No fastest time recorded for this control.
                return null;
            } else {
                fastestCumTimes[i + 1] = fastestCumTimes[i] + fastestForThisControl * ratio;
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
    * @returns {Array} Array of data.
    */
    SplitsBrowser.Model.Course.prototype.getChartData = function (referenceCumTimes, currentIndexes) {
        if (this.isEmpty()) {
            SplitsBrowser.throwInvalidData("Cannot return chart data when there is no data");
        } else if (typeof referenceCumTimes === "undefined") {
            throw new TypeError("referenceCumTimes undefined or missing");
        } else if (typeof currentIndexes === "undefined") {
            throw new TypeError("currentIndexes undefined or missing");
        }

        // Cumulative times adjusted by the reference, for each competitor.
        var adjustedCompetitors = this.getCumTimesAdjustedToReference(referenceCumTimes);
        var selectedCompetitors = currentIndexes.map(function (index) { return adjustedCompetitors[index]; });

        var xMax = referenceCumTimes[referenceCumTimes.length - 1];
        var yMin;
        var yMax;
        if (currentIndexes.length === 0) {
            // No competitors selected.  Set yMin and yMax to the boundary
            // values of the first competitor.
            var firstCompetitorTimes = adjustedCompetitors[0];
            yMin = d3.min(firstCompetitorTimes);
            yMax = d3.max(firstCompetitorTimes);
        } else {
            yMin = d3.min(selectedCompetitors.map(function (values) { return d3.min(values); }));
            yMax = d3.max(selectedCompetitors.map(function (values) { return d3.max(values); }));
        }

        if (yMax === yMin) {
            // yMin and yMax will be used to scale a y-axis, so we'd better
            // make sure that they're not equal.
            yMax = yMin + 1;
        }

        var outerThis = this;
        var cumulativeTimesByControl = d3.transpose(selectedCompetitors);
        var zippedData = d3.zip(referenceCumTimes, cumulativeTimesByControl);
        var competitorNames = currentIndexes.map(function (index) { return outerThis.getCompetitorName(index); });
        return {
            dataColumns: zippedData.map(function (data) { return { x: data[0], ys: data[1] }; }),
            competitorNames: competitorNames,
            numControls: this.numControls,
            xExtent: [0, xMax],
            yExtent: [yMin, yMax]
        };
    };
})();