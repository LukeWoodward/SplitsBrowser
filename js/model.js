(function () {
    "use strict";

    var _NUMBER_TYPE = typeof 0;

    /**
    * Function used with the JavaScript sort method to sort competitors in order
    * by finishing time.
    * 
    * Competitors that mispunch are sorted to the end of the list.
    * 
    * The return value of this method will be:
    * (1) a negative number if competitor a comes before competitor b,
    * (2) a positive number if competitor a comes after competitor a,
    * (3) zero if the order of a and b makes no difference (i.e. they have the
    *     same total time, or both mispunched.)
    * 
    * @param {SplitsBrowser.Model.CompetitorData} a - One competitor to compare.
    * @param {SplitsBrowser.Model.CompetitorData} b - The other competitor to compare.
    * @returns {Number} Result of comparing two competitors.  TH
    */
    SplitsBrowser.Model.compareCompetitors = function (a, b) {
        if (a.totalTime === b.totalTime) {
            return a.order - b.order;
        } else if (a.totalTime === null) {
            return (b.totalTime === null) ? 0 : 1;
        } else {
            return (b.totalTime === null) ? -1 : a.totalTime - b.totalTime;
        }
    };

    /**
     * Object that represents the data for a single competitor.
     *
     * The first parameter (order) merely stores the order in which the competitor
     * appears in the given list of results.  Its sole use is to stabilise sorts of
     * competitors, as JavaScript's sort() method is not guaranteed to be a stable
     * sort.  However, it is not strictly the finishing order of the competitors,
     * as it has been known for them to be given not in the correct order.
     *
     * @constructor
     * @param {Number} order - The position of the competitor within the list of results.
     * @param {string} forename - The forename of the competitor.
     * @param {string} surname - The surname of the competitor.
     * @param {string} club - The name of the competitor's club.
     * @param {string} startTime - The competitor's start time.
     * @param {Array} times - Array of split times, as numbers, with nulls for missed controls.
     */
    SplitsBrowser.Model.CompetitorData = function (order, forename, surname, club, startTime, times) {

        if (typeof (order) !== _NUMBER_TYPE) {
            throwInvalidData("Competitor order must be a number, got " + typeof order + " '" + order + "' instead");
        } else if (!$.isArray(times)) {
            throw new TypeError("times must be an array - got " + typeof (times) + " instead");
        }

        this.order = order;
        this.forename = forename;
        this.surname = surname;
        this.club = club;
        this.startTime = startTime;
        this.times = times;

        this.name = forename + " " + surname;
        this.totalTime = (times.indexOf(null) > -1) ? null : d3.sum(times);
    };

    /**
    * Adjust this competitor's data to a given 'reference' competitor, such as the
    * winner, or the imaginary 'fastest' runner who has the fastest splits on each
    * leg.
    * @param {SplitsBrowser.Model.CompetitorData} reference - The reference data to adjust by.
    * @return {SplitsBrowser.Model.CompetitorData} 
    */
    SplitsBrowser.Model.CompetitorData.prototype.adjustToReference = function (reference) {
        if (typeof (reference.times) === "undefined") {
            throwInvalidData("Cannot adjust competitor times because reference object does not have times (is it a competitor object?)");
        } else if (reference.times.length !== this.times.length) {
            throwInvalidData("Cannot adjust competitor times because the numbers of times are different (" + this.times.length + " and " + reference.times.length + ")");
        } else if (reference.times.indexOf(null) > -1) {
            throwInvalidData("Cannot adjust a competitor time by a competitor with missing times");
        }

        var adjustedTimes = this.times.map(function (time, idx) { return (time === null) ? null : (time - reference.times[idx]); });
        return new SplitsBrowser.Model.CompetitorData(this.order, this.forename, this.surname, this.club, this.startTime, adjustedTimes);
    };

    /**
    * Return cumulative times for this competitor.
    *
    * If the competitor missed a control, the corresponding item in the
    * cumulative sum is null, but the cumulative sum continues on in the next
    * time as if the time was null.
    * @returns {Array} Array of cumulative times, in seconds.
    */
    SplitsBrowser.Model.CompetitorData.prototype.getCumulativeTimes = function() {
        var totalTime = 0;
        var cumulativeTimes = new Array(this.times.length + 1);
        cumulativeTimes[0] = 0;
        for (var i = 0; i < this.times.length; ++i) {
            if (this.times[i] === null) {
                cumulativeTimes[i + 1] = null;
            } else {
                totalTime += this.times[i];
                cumulativeTimes[i + 1] = totalTime;
            }
        }

        return cumulativeTimes;
    };

    /**
     * Object that represents a collection of competitor data for a course.
     * @constructor.
     * @param {string} course - Name of the course.
     * @param {Number} numControls - Number of controls.
     * @param {Array} competitorData - Array of CompetitorData objects.
     */
    SplitsBrowser.Model.CourseData = function (course, numControls, competitorData) {
        this.course = course;
        this.numControls = numControls;
        this.competitorData = competitorData;
    };

    /**
    * Return whether this course is empty, i.e. has no competitors.
    * @returns {boolean} True if course empty, false if course not empty.
    */
    SplitsBrowser.Model.CourseData.prototype.isEmpty = function () {
        return this.competitorData.length === 0;
    };

    /**
    * Return the name of the competitor at the given index.
    * @param {Number} index - The index of the competitor within the list of all of them.
    * @returns {string} Name of the competitor.
    */
    SplitsBrowser.Model.CourseData.prototype.getCompetitorName = function (index) {
        return this.competitorData[index].name;
    };

    /**
    * Adjust the data to a given 'reference' competitor, such as the winner,
    * or the imaginary 'fastest' runner who has the fastest splits on each
    * leg.
    * @param {SplitsBrowser.Model.CompetitorData} reference - The reference data to adjust by.
    */
    SplitsBrowser.Model.CourseData.prototype.adjustToReference = function (reference) {
        var adjustedData = this.competitorData.map(function (competitor) { return competitor.adjustToReference(reference); });
        return new SplitsBrowser.Model.CourseData(this.course, this.numControls, adjustedData);
    };

    /**
    * Return the 'winner' of this course, i.e. the competitor with the fastest
    * total time.  If there are no competitors that have completed the course,
    * null is returned. 
    * @returns {SplitsBrowser.Model.Competitor|null} Winning competitor, if any.
    */
    SplitsBrowser.Model.CourseData.prototype.getWinner = function () {
        var completed = this.competitorData.filter(function (comp) { return comp.totalTime !== null; });
        if (completed.length === 0) {
            return null;
        } else {
            var winner = completed[0];
            for (var i = 1; i < completed.length; ++i) {
                if (completed[i].totalTime < winner.totalTime) {
                    winner = completed[i];
                }
            }

            return winner;
        }
    };

    /**
    * Return the imaginary competitor who recorded the fastest time on each leg
    * of the course.
    * If at least one control has no competitors punching it, null is returned.
    * @returns {SplitsBrowser.Model.Competitor|null} Imaginary competitor with
    *           fastest time, if any.
    */
    SplitsBrowser.Model.CourseData.prototype.getFastestTime = function () {
        var fastestTimes = new Array(this.numControls + 1);
        for (var i = 0; i <= this.numControls; ++i) {
            var fastestForThisControl = null;
            for (var j = 0; j < this.competitorData.length; ++j) {
                var thisTime = this.competitorData[j].times[i];
                if (thisTime !== null && (fastestForThisControl === null || thisTime < fastestForThisControl)) {
                    fastestForThisControl = thisTime;
                }
            }

            if (fastestForThisControl === null) {
                // No fastest time recorded for this control.
                return null;
            } else {
                fastestTimes[i] = fastestForThisControl;
            }
        }

        return new SplitsBrowser.Model.CompetitorData(0, "Fastest time", "Fastest time", "", "", fastestTimes);
    };

    /**
    * Return data from this course in a form suitable for plotting in a chart.
    * This is in a form suitable for use with the chart.
    * @param {SplitsBrowser.Model.CompetitorData} referenceData - 'Reference'
    *        competitor data (such as winner, or fastest time).
    * @param {Number} currentIndexes - Array of indexes that indicate which
                competitors from the overall list are plotted.
    * @returns {Array} Array of data.
    */
    SplitsBrowser.Model.CourseData.prototype.getChartData = function (referenceData, currentIndexes) {
        if (this.isEmpty()) {
            throwInvalidData("Cannot return data as columns when there is no data");
        } else if (typeof referenceData === "undefined") {
            throw new TypeError("referenceData object undefined or missing");
        }

        // Cumulative times adjusted by the reference, for each competitor.
        var adjustedCompetitorData = this.adjustToReference(referenceData).competitorData;
        var selectedCompetitorData = currentIndexes.map(function (index) { return adjustedCompetitorData[index]; });
        var cumulativeTimesByCompetitor = selectedCompetitorData.map(function (compData) { return compData.getCumulativeTimes(); });

        var xMax = d3.sum(referenceData.times);
        var yMin;
        var yMax;
        if (currentIndexes.length === 0) {
            // No competitors selected.  Set yMin and yMax to the boundary
            // values of the first competitor.
            var firstCompetitorTimes = adjustedCompetitorData[0].getCumulativeTimes();
            yMin = d3.min(firstCompetitorTimes);
            yMax = d3.max(firstCompetitorTimes);
        } else {
            yMin = d3.min(cumulativeTimesByCompetitor.map(function (values) { return d3.min(values); }));
            yMax = d3.max(cumulativeTimesByCompetitor.map(function (values) { return d3.max(values); }));
        }

        if (yMax === yMin) {
            // yMin and yMax will be used to scale a y-axis, so we'd better
            // make sure that they're not equal.
            yMax = yMin + 1;
        }

        var cumulativeTimesByControl = d3.transpose(cumulativeTimesByCompetitor);
        var zippedData = d3.zip(referenceData.getCumulativeTimes(), cumulativeTimesByControl);
        return {
            dataColumns: zippedData.map(function (data) { return { x: data[0], ys: data[1] }; }),
            competitorNames: selectedCompetitorData.map(function (competitor) { return competitor.name; }),
            numControls: this.numControls,
            xExtent: [0, xMax],
            yExtent: [yMin, yMax]
        };
    };
})();