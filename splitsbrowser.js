/*
 * Namespace declarations that the rest of the code can depend upon.
 */
var SplitsBrowser = { Model: {}, Input: {}, Controls: {} };


(function () {
    "use strict";

    /**
     * Utility function used with filters that simply returns the object given.
     * @param x - Any input value
     * @returns The input value.
     */
    SplitsBrowser.isTrue = function (x) { return x; };

    /**
    * Utility function that returns whether a value is null.
    * @param x - Any input value.
    * @returns True if the value is not null, false otherwise.
    */
    SplitsBrowser.isNotNull = function (x) { return x !== null; };

    /**
    * Exception object raised if invalid data is passed.
    * @constructor.
    * @param {string} message - The exception detail message.
    */
    SplitsBrowser.InvalidData = function (message) {
        this.name = "InvalidData";
        this.message = message;
    };

    /**
    * Returns a string representation of this exception.
    * @returns {String} String representation.
    */
    SplitsBrowser.InvalidData.prototype.toString = function () {
        return this.name + ": " + this.message;
    };

    /**
    * Utility function to throw an 'InvalidData' exception object.
    * @param {string} message - The exception message.
    * @throws {InvalidData} if invoked.
    */
    SplitsBrowser.throwInvalidData = function (message) {
        throw new SplitsBrowser.InvalidData(message);
    };
    
    /**
    * Exception object raised if a data parser for a format deems that the data
    * given is not of that format.
    * @constructor
    * @param {String} message - The exception message.
    */
    SplitsBrowser.WrongFileFormat = function (message) {
        this.name = "WrongFileFormat";
        this.message = message;
    };
    
    /**
    * Returns a string representation of this exception.
    * @returns {String} String representation.
    */
    SplitsBrowser.WrongFileFormat.prototype.toString = function () {
        return this.name + ": " + this.message;
    };
    
    /**
    * Utility funciton to throw a 'WrongFileFormat' exception object.
    * @param {string} message - The exception message.
    * @throws {WrongFileFormat} if invoked.
    */
    SplitsBrowser.throwWrongFileFormat = function (message) {
        throw new SplitsBrowser.WrongFileFormat(message);
    };
})();


(function () {
    "use strict";

    SplitsBrowser.NULL_TIME_PLACEHOLDER = "-----";
    
    /**
    * Formats a time period given as a number of seconds as a string in the form
    *  [-][h:]mm:ss.
    * @param {Number} seconds - The number of seconds.
    * @returns {string} The string formatting of the time.
    */
    SplitsBrowser.formatTime = function (seconds) {
        
        if (seconds === null) {
            return SplitsBrowser.NULL_TIME_PLACEHOLDER;
        }
    
        var result = "";
        if (seconds < 0) {
            result = "-";
            seconds = -seconds;
        }
        
        var hours = Math.floor(seconds / (60 * 60));
        var mins = Math.floor(seconds / 60) % 60;
        var secs = seconds % 60;
        if (hours > 0) {
            result += hours.toString() + ":";
        }
        
        if (mins < 10) {
            result += "0";
        }
        
        result += mins + ":";
        
        if (secs < 10) {
            result += "0";
        }
        
        result += secs;
        
        return result;
    };
    
    /**  
    * Parse a time of the form MM:SS or H:MM:SS into a number of seconds.
    * @param {string} time - The time of the form MM:SS.
    * @return {Number} The number of seconds.
    */
    SplitsBrowser.parseTime = function (time) {
        if (time.match(/^\d+:\d\d$/)) {
            return parseInt(time.substring(0, time.length - 3), 10) * 60 + parseInt(time.substring(time.length - 2), 10);
        } else if (time.match(/^\d+:\d\d:\d\d$/)) {
            return parseInt(time.substring(0, time.length - 6), 10) * 3600 + parseInt(time.substring(time.length - 5, time.length - 3), 10) * 60 + parseInt(time.substring(time.length - 2), 10);
        } else {
            // Assume anything unrecognised is a missed split.
            return null;
        }
    };
})();

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
    * @param {SplitsBrowser.Model.Competitor} a - One competitor to compare.
    * @param {SplitsBrowser.Model.Competitor} b - The other competitor to compare.
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
    * Returns the sum of two numbers, or null if either is null.
    * @param {Number|null} a - One number, or null, to add.
    * @param {Number|null} b - The other number, or null, to add.
    * @return {Number|null} null if at least one of a or b is null,
    *      otherwise a + b.
    */
    function addIfNotNull(a, b) {
        return (a === null || b === null) ? null : (a + b);
    }
    
    /**
    * Returns the difference of two numbers, or null if either is null.
    * @param {Number|null} a - One number, or null, to add.
    * @param {Number|null} b - The other number, or null, to add.
    * @return {Number|null} null if at least one of a or b is null,
    *      otherwise a - b.
    */    
    function subtractIfNotNull(a, b) {
        return (a === null || b === null) ? null : (a - b);
    }
    
    /**
    * Convert an array of split times into an array of cumulative times.
    * If any null splits are given, all cumulative splits from that time
    * onwards are null also.
    *
    * The returned array of cumulative split times includes a zero value for
    * cumulative time at the start.
    * @param {Array} splitTimes - Array of split times.
    * @return {Array} Corresponding array of cumulative split times.
    */
    function cumTimesFromSplitTimes(splitTimes) {
        if (!$.isArray(splitTimes)) {
            throw new TypeError("Split times must be an array - got " + typeof (splitTimes) + " instead");
        } else if (splitTimes.length === 0) {
            SplitsBrowser.throwInvalidData("Array of split times must not be empty");
        }
        
        var cumTimes = [0];
        for (var i = 0; i < splitTimes.length; i += 1) {
            cumTimes.push(addIfNotNull(cumTimes[i], splitTimes[i]));
        }

        return cumTimes;
    }
    
    /**
    * Convert an array of cumulative times into an array of split times.
    * If any null cumulative splits are given, the split times to and from that
    * control are null also.
    *
    * The input array should begin with a zero, for the cumulative time to the
    * start.
    * @param {Array} cumTimes - Array of cumulative split times.
    * @return {Array} Corresponding array of split times.
    */
    function splitTimesFromCumTimes(cumTimes) {
        if (!$.isArray(cumTimes)) {
            throw new TypeError("Cumulative times must be an array - got " + typeof (cumTimes) + " instead");
        } else if (cumTimes.length === 0) {
            SplitsBrowser.throwInvalidData("Array of cumulative times must not be empty");
        } else if (cumTimes[0] !== 0) {
            SplitsBrowser.throwInvalidData("Array of cumulative times must have zero as its first item");
        } else if (cumTimes.length === 1) {
            SplitsBrowser.throwInvalidData("Array of cumulative times must contain more than just a single zero");
        }
        
        var splitTimes = [];
        for (var i = 0; i + 1 < cumTimes.length; i += 1) {
            splitTimes.push(subtractIfNotNull(cumTimes[i + 1], cumTimes[i]));
        }
        
        return splitTimes;
    }

    /**
     * Private object that represents the data for a single competitor.
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
     * @param {Array} splitTimes - Array of split times, as numbers, with nulls for missed controls.
     * @param {Array} cumTimes - Array of cumulative split times, as numbers, with nulls for missed controls.
     */
    var Competitor = function (order, forename, surname, club, startTime, splitTimes, cumTimes) {

        if (typeof (order) !== _NUMBER_TYPE) {
            SplitsBrowser.throwInvalidData("Competitor order must be a number, got " + typeof order + " '" + order + "' instead");
        }

        this.order = order;
        this.forename = forename;
        this.surname = surname;
        this.club = club;
        this.startTime = startTime;
        this.isNonCompetitive = false;
        
        this.splitTimes = splitTimes;
        this.cumTimes = cumTimes;
        this.splitRanks = null;
        this.cumRanks = null;

        this.name = forename + " " + surname;
        this.totalTime = (this.cumTimes.indexOf(null) > -1) ? null : this.cumTimes[this.cumTimes.length - 1];
    };
    
    /**
    * Marks this competitor as being non-competitive.
    */
    Competitor.prototype.setNonCompetitive = function () {
        this.isNonCompetitive = true;
    };
    
    SplitsBrowser.Model.Competitor = {};
    
    /**
    * Create and return a Competitor object where the competitor's times are given
    * as a list of split times.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * @param {Number} order - The position of the competitor within the list of results.
    * @param {string} forename - The forename of the competitor.
    * @param {string} surname - The surname of the competitor.
    * @param {string} club - The name of the competitor's club.
    * @param {string} startTime - The competitor's start time.
    * @param {Array} splitTimes - Array of split times, as numbers, with nulls for missed controls.
    */
    SplitsBrowser.Model.Competitor.fromSplitTimes = function (order, forename, surname, club, startTime, splitTimes) {
        var cumTimes = cumTimesFromSplitTimes(splitTimes);
        return new Competitor(order, forename, surname, club, startTime, splitTimes, cumTimes);
    };
    
    /**
    * Create and return a Competitor object where the competitor's times are given
    * as a list of cumulative split times.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * @param {Number} order - The position of the competitor within the list of results.
    * @param {string} forename - The forename of the competitor.
    * @param {string} surname - The surname of the competitor.
    * @param {string} club - The name of the competitor's club.
    * @param {string} startTime - The competitor's start time.
    * @param {Array} cumTimes - Array of cumulative split times, as numbers, with nulls for missed controls.
    */
    SplitsBrowser.Model.Competitor.fromCumTimes = function (order, forename, surname, club, startTime, cumTimes) {
        var splitTimes = splitTimesFromCumTimes(cumTimes);
        return new Competitor(order, forename, surname, club, startTime, splitTimes, cumTimes);
    };
    
    /**
    * Returns whether this competitor completed the course.
    * @return {boolean} Whether the competitor completed the course.
    */
    Competitor.prototype.completed = function () {
        return this.totalTime !== null;
    };
    
    /**
    * Returns the competitor's split to the given control.  If the control
    * index given is zero (i.e. the start), zero is returned.  If the
    * competitor has no time recorded for that control, null is returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getSplitTimeTo = function (controlIndex) {
        return (controlIndex === 0) ? 0 : this.splitTimes[controlIndex - 1];
    };
    
    /**
    * Returns the competitor's cumulative split to the given control.  If the
    * control index given is zero (i.e. the start), zero is returned.   If the
    * competitor has no cumulative time recorded for that control, null is
    * returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The cumulative split time in seconds for the competitor
    *      to the given control.
    */
    Competitor.prototype.getCumulativeTimeTo = function (controlIndex) {
        return this.cumTimes[controlIndex];
    };
    
    /**
    * Returns the rank of the competitor's split to the given control.  If the
    * control index given is zero (i.e. the start), or if the competitor has no
    * time recorded for that control, null is returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getSplitRankTo = function (controlIndex) {
       return (controlIndex === 0) ? null : this.splitRanks[controlIndex - 1];
    };
    
    /**
    * Returns the rank of the competitor's cumulative split to the given
    * control.  If the control index given is zero (i.e. the start), or if the
    * competitor has no time recorded for that control, null is returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getCumulativeRankTo = function (controlIndex) {
        return (controlIndex === 0) ? null : this.cumRanks[controlIndex - 1];
    };
    
    /**
    * Returns all of the competitor's cumulative time splits.
    * @return {Array} The cumulative split times in seconds for the competitor.
    */
    Competitor.prototype.getAllCumulativeTimes = function () {
        return this.cumTimes;
    };
    
    /**
    * Sets the split and cumulative-split ranks for this competitor.
    * @param {Array} splitRanks - Array of split ranks for this competitor.
    * @param {Array} cumRanks - Array of cumulative-split ranks for this competitor.
    */
    Competitor.prototype.setSplitAndCumulativeRanks = function (splitRanks, cumRanks) {
        this.splitRanks = splitRanks;
        this.cumRanks = cumRanks;
    };

    /**
    * Return this competitor's cumulative times after being adjusted by a 'reference' competitor.
    * @param {Array} referenceCumTimes - The reference cumulative-split-time data to adjust by.
    * @return {Array} The array of adjusted data.
    */
    Competitor.prototype.getCumTimesAdjustedToReference = function (referenceCumTimes) {
        if (referenceCumTimes.length !== this.cumTimes.length) {
            SplitsBrowser.throwInvalidData("Cannot adjust competitor times because the numbers of times are different (" + this.cumTimes.length + " and " + referenceCumTimes.length + ")");
        } else if (referenceCumTimes.indexOf(null) > -1) {
            SplitsBrowser.throwInvalidData("Cannot adjust competitor times because a null value is in the reference data");
        }

        var adjustedTimes = this.cumTimes.map(function (time, idx) { return subtractIfNotNull(time, referenceCumTimes[idx]); });
        return adjustedTimes;
    };
    
    /**
    * Returns an array of percentages that this competitor's splits were behind
    * those of a reference competitor.
    * @param {Array} referenceCumTimes - The reference cumulative split times
    * @return {Array} The array of percentages.
    */
    Competitor.prototype.getSplitPercentsBehindReferenceCumTimes = function (referenceCumTimes) {
        if (referenceCumTimes.length !== this.cumTimes.length) {
            SplitsBrowser.throwInvalidData("Cannot determine percentages-behind because the numbers of times are different (" + this.cumTimes.length + " and " + referenceCumTimes.length + ")");
        } else if (referenceCumTimes.indexOf(null) > -1) {
            SplitsBrowser.throwInvalidData("Cannot determine percentages-behind because a null value is in the reference data");
        }
        
        var percentsBehind = [0];
        this.splitTimes.forEach(function (splitTime, index) {
            if (splitTime === null) {
                percentsBehind.push(null);
            } else {
                var referenceSplit = referenceCumTimes[index + 1] - referenceCumTimes[index];
                percentsBehind.push(100 * (splitTime - referenceSplit) / referenceSplit);
            }
        });
        
        return percentsBehind;
    };
})();

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
     * @param {string} name - Name of the course.
     * @param {Number} numControls - Number of controls.
     * @param {Array} competitors - Array of Competitor objects.
     */
    SplitsBrowser.Model.Course = function (name, numControls, competitors) {
        this.name = name;
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
            // We want to null out all subsequent cumulative ranks after a
            // competitor mispunches.
            var cumSplitsByCompetitor = outerThis.competitors.map(function (comp, idx) {
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
            outerThis.competitors.forEach(function (_comp, idx) { cumRanksByCompetitor[idx].push(cumRanksForThisControl[idx]); });
        });
        
        this.competitors.forEach(function (comp, idx) {
            comp.setSplitAndCumulativeRanks(splitRanksByCompetitor[idx], cumRanksByCompetitor[idx]);
        });
    };
    
    
})();

/* global SplitsBrowser, d3 */
(function (){
    "use strict";

    /*
    * An object that keeps track of the current selection of competitors, and
    * provides a notification mechanism for changes to the selection.
    */

    var _NUMBER_TYPE = typeof 0;

    /**
    * Represents the currently-selected competitors, and offers a callback
    * mechanism for when the selection changes.
    * @constructor
    * @param {Number} count - The number of competitors that can be chosen.
    */
    SplitsBrowser.Model.CompetitorSelection = function (count) {
        if (typeof (count) != _NUMBER_TYPE) {
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
        if (this.changeHandlers.indexOf(handler) == -1) {
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
        if (typeof (index) == _NUMBER_TYPE) {
            if (0 <= index && index < this.count) {
                var position = this.currentIndexes.indexOf(index);
                if (position == -1) {
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


(function () {
    "use strict";

    SplitsBrowser.Input.CSV = {};
    
    /**
    * Parse a row of competitor data.
    * @param {Number} index - Index of the competitor line.
    * @param {string} line - The line of competitor data read from a CSV file.
    * @param {Number} controlCount - The number of controls (not including the finish).
    * @return {Object} Competitor object representing the competitor data read in.
    */
    SplitsBrowser.Input.CSV.parseCompetitors = function (index, line, controlCount) {
        // Expect forename, surname, club, start time then (controlCount + 1) split times in the form MM:SS.
        var parts = line.split(",");
        if (parts.length === controlCount + 5) {
            var forename = parts.shift();
            var surname = parts.shift();
            var club = parts.shift();
            var startTime = parts.shift();
            var splitTimes = parts.map(SplitsBrowser.parseTime);
            if (splitTimes.indexOf(0) >= 0) {
                SplitsBrowser.throwInvalidData("Zero split times are not permitted - found one or more zero splits for competitor '" + forename + " " + surname + "'");
            }
            return SplitsBrowser.Model.Competitor.fromSplitTimes(index + 1, forename, surname, club, startTime, splitTimes);
        } else {
            SplitsBrowser.throwInvalidData("Expected " + (controlCount + 5) + " items in row for competitor on course with " + controlCount + " controls, got " + (parts.length) + " instead.");
        }
    };

    /**
    * Parse CSV data for a course.
    * @param {string} course - The string containing data for that course.
    * @return {SplitsBrowser.Model.Course} Parsed course data.
    */
    SplitsBrowser.Input.CSV.parseCourse = function (course) {
        var lines = course.split("\r\n").filter(SplitsBrowser.isTrue);
        if (lines.length === 0) {
            SplitsBrowser.throwInvalidData("parseCourse got an empty list of lines");
        }

        var firstLineParts = lines.shift().split(",");
        if (firstLineParts.length === 2) {
            var courseName = firstLineParts.shift();
            var controlCountStr = firstLineParts.shift();
            var controlCount = parseInt(controlCountStr, 10);
            if (isNaN(controlCount)) {
                SplitsBrowser.throwInvalidData("Could not read control count: '" + controlCountStr + "'");
            } else if (controlCount < 0) {
                SplitsBrowser.throwInvalidData("Expected a positive control count, got " + controlCount + " instead");
            } else {
                var competitors = lines.map(function (line, index) { return SplitsBrowser.Input.CSV.parseCompetitors(index, line, controlCount); });
                competitors.sort(SplitsBrowser.Model.compareCompetitors);
                return new SplitsBrowser.Model.Course(courseName, controlCount, competitors);
            }
        } else {
            SplitsBrowser.throwWrongFileFormat("Expected first line to have two parts (course name and number of controls), got " + firstLineParts.length + " part(s) instead");
        }
    };

        /**
        * Parse CSV data for an entire event.
        * @param {string} eventData - String containing the entire event data.
        * @return {Array} Array of Course objects.
        */
    SplitsBrowser.Input.CSV.parseEventData = function (eventData) {
        var courses = eventData.split("\r\n\r\n").map($.trim).filter(SplitsBrowser.isTrue);
        return courses.map(SplitsBrowser.Input.CSV.parseCourse);
    };
})();


(function () {
    "use strict";
    
    var _CLUB_COLUMN_NAME = "City";
    
    var _COURSE_COLUMN_NAME = "Short";
    
    var _PLACING_COLUMN_NAME = "Pl";
    
    var _MANDATORY_COLUMN_NAMES = ["First name", "Surname",_CLUB_COLUMN_NAME, "Start", "Time", _COURSE_COLUMN_NAME, "Course controls", _PLACING_COLUMN_NAME];
    
    SplitsBrowser.Input.SI = {};
    
    /**
    * Checks that two consecutive cumulative times are in strictly ascending
    * order, and throws an exception if not.  The previous time should not be
    * null, but the next time may, and no exception will be thrown in this
    * case.
    * @param {Number} prevTime - The previous cumulative time, in seconds.
    * @param {Number} nextTime - The next cumulative time, in seconds.
    */
    SplitsBrowser.Input.SI.verifyCumulativeTimesInOrder = function (prevTime, nextTime) {
        if (nextTime !== null && nextTime <= prevTime) {
            SplitsBrowser.throwInvalidData("Cumulative times must be strictly ascending: read " +
                    SplitsBrowser.formatTime(prevTime) + " and " + SplitsBrowser.formatTime(nextTime) +
                    " in that order");
        }
    };
    
    /**
    * Parse 'SI' data read from a semicolon-separated data string.
    * @param {String} data - The input data string read.
    * @return {Array} Array of courses.
    */
    SplitsBrowser.Input.SI.parseEventData = function (data) {
        
        // Work around oddity of the file format: 'City' seems to contain the
        // club name, and it seems to be repeated later on.  Adjust the second
        // occurrence to move it out of the way.
        data = data.replace(/;City;(.*?);City;/, ";City;$1;City2;");
        var dsvData = d3.dsv(";").parse(data);
        
        if (!$.isArray(dsvData) || dsvData.length === 0) {
            SplitsBrowser.throwWrongFileFormat("No data found to read");
        } else if (dsvData[0].length === 1) {
            SplitsBrowser.throwWrongFileFormat("Data seems not to be in the SI semicolon-separated format");
        }
        
        // Map that associates courses to all of the competitors running on
        // that course.
        var courses = d3.map();
        
        dsvData.forEach(function (row) {
            
            _MANDATORY_COLUMN_NAMES.forEach(function (columnName) {
                if (!row.hasOwnProperty(columnName)) {
                    SplitsBrowser.throwInvalidData("Column '" + columnName + "' missing");
                }
            });
        
            var forename = row["First name"];
            var surname = row.Surname;
            var club = row[_CLUB_COLUMN_NAME];
            var startTime = row.Start;
            
            var courseName = row[_COURSE_COLUMN_NAME];
            
            var numControls;
            if (courses.has(courseName)) {
                numControls = courses.get(courseName).numControls;
            } else {
                // TODO add these later?
                // var courseDistance = row.Km;
                // var courseClimb = row.m;
                
                numControls = parseInt(row["Course controls"], 10);
                courses.set(courseName, { numControls: numControls, competitors: [] });
            }
            
            var cumTimes = [0];
            var lastCumTime = 0;
            for (var i = 1; i <= numControls; i += 1) {
                var key = "Punch" + i;
                if (row.hasOwnProperty(key)) {
                    var cumTimeStr = row[key];
                    var cumTime = SplitsBrowser.parseTime(cumTimeStr);
                    SplitsBrowser.Input.SI.verifyCumulativeTimesInOrder(lastCumTime, cumTime);
                    
                    cumTimes.push(cumTime);
                    if (cumTime !== null) {
                        lastCumTime = cumTime;
                    }
                } else {
                    SplitsBrowser.throwInvalidData("No '" + key + "' column");
                }
            }
            
            var totalTime = SplitsBrowser.parseTime(row.Time);
            SplitsBrowser.Input.SI.verifyCumulativeTimesInOrder(lastCumTime, totalTime);
            
            // Some surnames have an 'mp' suffix or an 'n/c' suffix added to
            // them.  Remove either of them if they exist.
            surname = surname.replace(/ mp$| n\/c$/, "");
            
            cumTimes.push(totalTime);
            
            var order = courses.get(courseName).competitors.length + 1;
            var competitor = SplitsBrowser.Model.Competitor.fromCumTimes(order, forename, surname, club, startTime, cumTimes);
            if (row[_PLACING_COLUMN_NAME] === "n/c") {
                competitor.setNonCompetitive();
            }

            courses.get(courseName).competitors.push(competitor);
        });
        
        var courseNames = courses.keys();
        courseNames.sort();
        return courseNames.map(function (courseName) {
            var course = courses.get(courseName);
            return new SplitsBrowser.Model.Course(courseName, course.numControls, course.competitors);
        });
    };
})();

(function () {
    "use strict";
    
    // All the parsers for parsing event data that are known about.
    var _PARSERS = [
        SplitsBrowser.Input.CSV.parseEventData,
        SplitsBrowser.Input.SI.parseEventData
   ];
    
    /**
    * Attempts to parse the given event data, which may be of any of the
    * supported formats, or may be invalid.  This function returns the results
    * as an array of SplitsBrowser.Model.Course objects, or null in the event
    * of failure.
    * @param {String} data - The data read.
    * @return {Array} Array of courses read in, or null for failure.
    */ 
    SplitsBrowser.Input.parseEventData = function (data) {
        for (var i = 0; i < _PARSERS.length; ++i) {
            var parser = _PARSERS[i];
            try {
                return parser(data);
            } catch (e) {
                if (e.name !== "WrongFileFormat") {
                    throw e;
                }
            }
        }
            
        // If we get here, none of the parsers succeeded.
        return null;
    };
})();

/* global SplitsBrowser, d3, $ */
(function (){
    "use strict";

    var _COMPETITOR_LIST_ID = "competitorList";
    var _COMPETITOR_LIST_ID_SELECTOR = "#" + _COMPETITOR_LIST_ID;

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
                                        .attr("id", _COMPETITOR_LIST_ID);
    };

    /**
    * Returns the width of the listbox, in pixels.
    * @returns {Number} Width of the listbox.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.width = function () {
        return $(_COMPETITOR_LIST_ID_SELECTOR).width();
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

        $("div.competitor").off("click");
        
        var competitorDivs = this.listDiv.selectAll("div.competitor").data(competitors);
        var outerThis = this;

        competitorDivs.enter().append("div")
                           .classed("competitor", true);

        competitorDivs.text(function (comp) { return comp.name; });

        competitorDivs.exit().remove();
        
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


(function (){
    "use strict";

    /**
    * A control that wraps a drop-down list used to choose between course.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.CourseSelector = function(parent) {
        this.changeHandlers = [];
        
        var span = d3.select(parent).append("span");
        span.text("Course: ");
        var outerThis = this;
        this.dropDown = span.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        this.setCourses([]);
    };

    /**
    * Sets the list of courses that this selector can choose between.
    * 
    * If there are no courses, a 'dummy' entry is added
    * @param {Array} courses - Array of Course objects containing course data.
    */
    SplitsBrowser.Controls.CourseSelector.prototype.setCourses = function(courses) {
        if ($.isArray(courses)) {
            var options;
            if (courses.length === 0) {
                this.dropDown.disabled = true;
                options = ["[No courses loaded]"];
            } else {
                this.dropDown.disabled = false;
                options = courses.map(function(course) { return course.name; });
            }
            
            var optionsList = d3.select(this.dropDown).selectAll("option").data(options);
            optionsList.enter().append("option");
            
            optionsList.attr("value", function(_value, index) { return index.toString(); })
                       .text(function(value) { return value; });
                       
            optionsList.exit().remove();
        } else {
            SplitsBrowser.throwInvalidData("CourseSelector.setCourses: courses is not an array");
        }
    };

    /**
    * Add a change handler to be called whenever the selected course is changed.
    *
    * The index of the newly-selected item is passed to each handler function.
    *
    * @param {Function} handler - Handler function to be called whenever the course
    *                   changes.
    */
    SplitsBrowser.Controls.CourseSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    SplitsBrowser.Controls.CourseSelector.prototype.onSelectionChanged = function() {
        var outerThis = this;
        this.changeHandlers.forEach(function(handler) { handler(outerThis.dropDown.selectedIndex); });
    };
})();


(function (){
    "use strict";
    
    var _ALL_COMPARISON_OPTIONS = [
        { name: "Winner", selector: function (course) { return course.getWinnerCumTimes(); } },
        { name: "Fastest time", selector: function (course) { return course.getFastestCumTimes(); } }
    ];
    
    // All 'Fastest time + N %' values (not including zero, of course).
    var _FASTEST_PLUS_PERCENTAGES = [5, 25, 50, 100];
    
    _FASTEST_PLUS_PERCENTAGES.forEach(function (percent) {
        _ALL_COMPARISON_OPTIONS.push({
            name: "Fastest time + " + percent + "%",
            selector: function (course) { return course.getFastestCumTimesPlusPercentage(percent); }
        });
    });
    
    _ALL_COMPARISON_OPTIONS.push({ name: "Any runner..." });
    
    // Default selected index of the comparison function.
    var _DEFAULT_COMPARISON_INDEX = 1; // 1 = fastest time.
    
    // The id of the comparison selector.
    var _COMPARISON_SELECTOR_ID = "comparisonSelector";
    
    // The id of the runner selector
    var _RUNNER_SELECTOR_ID = "runnerSelector";

    /**
    * A control that wraps a drop-down list used to choose what to compare
    * times against.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.ComparisonSelector = function(parent) {
        this.changeHandlers = [];
        this.courses = null;
        this.currentRunnerIndex = null;
        
        var span = d3.select(parent).append("span");
        span.text("Compare with ");
        var outerThis = this;
        this.dropDown = span.append("select")
                            .attr("id", _COMPARISON_SELECTOR_ID)
                            .node();
                            
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        var optionsList = d3.select(this.dropDown).selectAll("option")
                                                  .data(_ALL_COMPARISON_OPTIONS);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_opt, index) { return index.toString(); })
                   .text(function (opt) { return opt.name; });
                   
        optionsList.exit().remove();
        
        this.runnerSpan = d3.select(parent).append("span")
                                           .style("display", "none")
                                           .style("padding-left", "20px");
        
        this.runnerSpan.text("Runner: ");
        
        this.runnerDropDown = this.runnerSpan.append("select")
                                             .attr("id", _RUNNER_SELECTOR_ID)
                                             .node();
        $(this.runnerDropDown).bind("change", function () { outerThis.onSelectionChanged(); });
        
        this.dropDown.selectedIndex = _DEFAULT_COMPARISON_INDEX;
    };

    /**
    * Add a change handler to be called whenever the selected course is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler - Handler function to be called whenever the course
    *                   changes.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns whether the 'Any Runner...' option is selected.
    * @return Whether the 'Any Runner...' option is selected.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.isAnyRunnerSelected = function () {
        return this.dropDown.selectedIndex === _ALL_COMPARISON_OPTIONS.length - 1;
    };
    
    /**
    * Sets the list of courses.
    * @param {Array} courses - Array of Course objects.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.setCourses = function (courses) {
        var wasNull = (this.courses === null);
        this.courses = courses;
        
        if (wasNull && this.courses !== null && this.courses.length > 0) {
            this.setRunnersFromCourse(0);
        }
    };
    
    /**
    * Handles a change of selected course, by updating the list of runners that
    * can be chosen from.
    * @param {Number} courseIndex - The index of the chosen course among the
    *     list of them.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.updateRunnerList = function (courseIndex) {
        if (this.courses !== null && 0 <= courseIndex && courseIndex < this.courses.length) {
            this.setRunnersFromCourse(courseIndex);
        }
    };

    /**
    * Populates the list of runners in the Runner drop-down.
    * @param {Number} courseIndex - Index of the course among the list of all
    *      courses.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.setRunnersFromCourse = function (courseIndex) {
        var optionsList = d3.select(this.runnerDropDown).selectAll("option")
                                                        .data(this.courses[courseIndex].competitors);
        
        optionsList.enter().append("option");
        optionsList.attr("value", function (_comp, compIndex) { return compIndex.toString(); })
                   .text(function (comp) { return comp.name; });
        optionsList.exit().remove();
       
        this.runnerDropDown.selectedIndex = 0;
        this.currentRunnerIndex = 0;
    };
    
    /**
    * Returns the function that compares a competitor's splits against some
    * reference data.
    * @return {Function} Comparison function.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.getComparisonFunction = function () {
        if (this.isAnyRunnerSelected()) {
            this.currentRunnerIndex = Math.max(this.runnerDropDown.selectedIndex, 0);
            var outerThis = this;
            return function (course) { return course.competitors[outerThis.currentRunnerIndex].getAllCumulativeTimes(); };
        } else {
            return _ALL_COMPARISON_OPTIONS[this.dropDown.selectedIndex].selector;
        }
    };
    
    /**
    * Handle a change of the selected option in either drop-down list.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.onSelectionChanged = function() {
        this.runnerSpan.style("display", (this.isAnyRunnerSelected()) ? "" : "none");
        var outerThis = this;
        this.changeHandlers.forEach(function (handler) { handler(outerThis.getComparisonFunction()); });
    };
})();


(function () {
    "use strict";

    var _STATISTIC_SELECTOR_ID = "statisticSelector";

    var _LABEL_ID_PREFIX = "statisticCheckbox";

    var _STATISTIC_NAMES = ["Total time", "Split time", "Behind fastest"];

    /**
    * Control that contains a number of checkboxes for enabling and/or disabling
    * the display of various statistics.
    * @constructor
    * @param {HTMLElement} parent - The parent element.
    */
    SplitsBrowser.Controls.StatisticsSelector = function (parent) {
        this.span = d3.select(parent).append("span")
                                     .attr("id", _STATISTIC_SELECTOR_ID);   

        var childSpans = this.span.selectAll("span")
                                  .data(_STATISTIC_NAMES)
                                  .enter()
                                  .append("span");
         
        childSpans.append("input")
                  .attr("type", "checkbox")
                  .attr("id", function(val, index) { return _LABEL_ID_PREFIX + index; });
                  
        childSpans.append("label")
                  .attr("for", function(val, index) { return _LABEL_ID_PREFIX + index; })
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


(function (){
    "use strict";
    
    /**
    * Converts a number of seconds into the corresponding number of minutes.
    * This conversion is as simple as dividing by 60.
    * @param {Number} seconds - The number of seconds to convert.
    * @return {Number} The corresponding number of minutes.
    */
    function secondsToMinutes(seconds) { 
        return (seconds === null) ? null : seconds / 60;
    }

    var _ALL_CHART_TYPES = [
        {
            name: "Splits graph",
            dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReference(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabel: "Time loss (min)",
            isResultsTable: false
        },
        {
            name: "Position after leg",
            dataSelector: function (comp) { return comp.cumRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            isResultsTable: false
        },
        {
            name: "Split position",
            dataSelector: function (comp) { return comp.splitRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            isResultsTable: false
        },
        {
            name: "Percent behind",
            dataSelector: function (comp, referenceCumTimes) { return comp.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes); },
            skipStart: false,
            yAxisLabel: "Percent behind",
            isResultsTable: false
        },
        {
            name: "Results table",
            dataSelector: null,
            skipStart: false,
            yAxisLabel: null,
            isResultsTable: true
        }
    ];
    
    /**
    * A control that wraps a drop-down list used to choose the types of chart to view.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.ChartTypeSelector = function(parent) {
        this.changeHandlers = [];
        
        var span = d3.select(parent).append("span");
        span.text("View: ");
        var outerThis = this;
        this.dropDown = span.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        var optionsList = d3.select(this.dropDown).selectAll("option").data(_ALL_CHART_TYPES);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_value, index) { return index.toString(); })
                   .text(function (value) { return value.name; });
                   
        optionsList.exit().remove();
    };

    /**
    * Add a change handler to be called whenever the selected type of chart is changed.
    *
    * The selected type of chart is passed to the handler function.
    *
    * @param {Function} handler - Handler function to be called whenever the
    *                             chart type changes.
    */
    SplitsBrowser.Controls.ChartTypeSelector.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns the currently-selected chart type.
    * @return {Array} The currently-selected chart type.
    */
    SplitsBrowser.Controls.ChartTypeSelector.prototype.getChartType = function () {
        return _ALL_CHART_TYPES[Math.max(this.dropDown.selectedIndex, 0)];
    };
    
    /**
    * Handle a change of the selected option in the drop-down list.
    */
    SplitsBrowser.Controls.ChartTypeSelector.prototype.onSelectionChanged = function () {
        var outerThis = this;
        this.changeHandlers.forEach(function(handler) { handler(_ALL_CHART_TYPES[outerThis.dropDown.selectedIndex]); });
    };
})();


/* global SplitsBrowser, d3, $ */

(function (){
    "use strict";

    var _TEXT_SIZE_ELEMENT_ID = "sb-text-size-element";
    var _TEXT_SIZE_ELEMENT_ID_SELECTOR = "#" + _TEXT_SIZE_ELEMENT_ID;

    var _CHART_SVG_ID = "chart";
    var _CHART_SVG_ID_SELECTOR = "#" + _CHART_SVG_ID;

    var margin = { top: 20, right: 20, bottom: 30, left: 50 };

    var legendLineWidth = 10;

    var SPACER = "\xa0\xa0\xa0\xa0";

    var colours = [
        "red", "blue", "green", "black", "#CC0066", "#000099", "#FFCC00", "#996600",
        "#9900FF", "#CCCC00", "#FFFF66",  "#CC6699", "#99FF33", "#3399FF",
        "#CC33CC", "#33FFFF", "#FF00FF"
    ];

    var backgroundColour1 = '#EEEEEE';
    var backgroundColour2 = '#DDDDDD';

    /**
    * Format a time and a rank as a string, with the split time in mm:ss or h:mm:ss
    * as appropriate.
    * @param {Number|null} time - The time, in seconds, or null.
    * @param {Number|null} rank - The rank, or null.
    * @returns Time and rank formatted as a string.
    */
    function formatTimeAndRank(time, rank) {
        return SPACER + SplitsBrowser.formatTime(time) + " (" + ((rank === null) ? "-" : rank) + ")";
    }

    /**
    * A chart object in a window.
    * @constructor
    * @param {HTMLElement} parent - The parent object to create the element within.
    */
    SplitsBrowser.Controls.Chart = function (parent) {
        this.parent = parent;

        this.xScale = null;
        this.yScale = null;
        this.overallWidth = -1;
        this.overallHeight = -1;
        this.contentWidth = -1;
        this.contentHeight = -1;
        this.numControls = -1;
        this.selectedIndexes = [];
        this.currentCompetitorData = null;
        
        // Indexes of the currently-selected competitors, in the order that
        // they appear in the list of labels.
        this.selectedIndexesOrderedByLastYValue = [];
        this.names = [];
        this.referenceCumTimes = [];
        
        this.isMouseIn = false;
        
        // The position the mouse cursor is currently over, or null for not over
        // the charts.
        this.currentControlIndex = null;
        
        this.controlLine = null;

        this.svg = d3.select(this.parent).append("svg")
                                         .attr("id", _CHART_SVG_ID);
        this.svgGroup = this.svg.append("g")
                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                                         
        var outerThis = this;
        $(this.svg.node()).mouseenter(function(event) { outerThis.onMouseEnter(event); })
                          .mousemove(function(event) { outerThis.onMouseMove(event); })
                          .mouseleave(function(event) { outerThis.onMouseLeave(event); });

        // Add an invisible text element used for determining text size.
        this.svg.append("text").attr("fill", "transparent").attr("id", _TEXT_SIZE_ELEMENT_ID);
    };

    /**
    * Handle the mouse entering the chart.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseEnter = function() {
        this.isMouseIn = true;
    };

    /**
    * Handle a mouse movement.
    * @param {EventObject} event - The event object.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseMove = function(event) {
        if (this.isMouseIn && this.xScale !== null) {
            var svgNodeAsJQuery = $(this.svg.node());
            var offset = svgNodeAsJQuery.offset();
            var xOffset = event.pageX - offset.left;
            var yOffset = event.pageY - offset.top;
            
            if (margin.left <= xOffset && xOffset < svgNodeAsJQuery.width() - margin.right && 
                margin.top <= yOffset && yOffset < svgNodeAsJQuery.height() - margin.bottom) {
                // In the chart.
                // Get the time offset that the mouse is currently over.
                var chartX = this.xScale.invert(xOffset - margin.left);
                var bisectIndex = d3.bisect(this.referenceCumTimes, chartX);
                
                // bisectIndex is the index at which to insert chartX into
                // referenceCumTimes in order to keep the array sorted.  So if
                // this index is N, the mouse is between N - 1 and N.  Find
                // which is nearer.
                var controlIndex;
                if (bisectIndex >= this.referenceCumTimes.length) {
                    // Off the right-hand end, use the finish.
                    controlIndex = this.numControls + 1;
                } else {
                    var diffToNext = Math.abs(this.referenceCumTimes[bisectIndex] - chartX);
                    var diffToPrev = Math.abs(chartX - this.referenceCumTimes[bisectIndex - 1]);
                    controlIndex = (diffToPrev < diffToNext) ? bisectIndex - 1 : bisectIndex;
                }
                
                if (this.currentControlIndex === null || this.currentControlIndex !== controlIndex) {
                    // The control line has appeared for ths first time or has moved, so redraw it.
                    this.removeControlLine();
                    this.drawControlLine(controlIndex);
                }
            } else {
                // In the SVG element but outside the chart area.
                this.removeControlLine();
            }
        }
    };

    /**
    * Handle the mouse leaving the chart.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseLeave = function() {
        this.isMouseIn = false;
        this.removeControlLine();
    };

    /**
    * Draw a 'control line'.  This is a vertical line running the entire height of
    * the chart, at one of the controls.
    * @param {Number} controlIndex - The index of the control at which to draw the
    *                                control line.
    */
    SplitsBrowser.Controls.Chart.prototype.drawControlLine = function(controlIndex) {
        this.currentControlIndex = controlIndex;
        this.updateCompetitorStatistics();    
        var xPosn = this.xScale(this.referenceCumTimes[controlIndex]);
        this.controlLine = this.svgGroup.append("line")
                                        .attr("x1", xPosn)
                                        .attr("y1", 0)
                                        .attr("x2", xPosn)
                                        .attr("y2", this.contentHeight)
                                        .attr("class", "controlLine")
                                        .node();
    };

    /**
    * Remove any previously-drawn control line.  If no such line existed, nothing
    * happens.
    */
    SplitsBrowser.Controls.Chart.prototype.removeControlLine = function() {
        this.currentControlIndex = null;
        this.updateCompetitorStatistics();
        if (this.controlLine !== null) {
            d3.select(this.controlLine).remove();
            this.controlLine = null;
        }
    };

    /**
    * Returns an array of the the times that the selected competitors are
    * behind the reference times at the given control.
    * @param {Number} controlIndex - Index of the given control.
    * @param {Array} indexes - Array of indexes of selected competitors.
    * @return {Array} Array of times in seconds that the given competitors are
    *     behind the reference time.
    */
    SplitsBrowser.Controls.Chart.prototype.getTimesBehind = function (controlIndex, indexes) {
        var outerThis = this;
        var selectedCompetitors = indexes.map(function (index) { return outerThis.course.competitors[index]; });
        var referenceSplit = this.referenceCumTimes[controlIndex] - this.referenceCumTimes[controlIndex - 1];
        var timesBehind = selectedCompetitors.map(function (comp) { var compSplit = comp.getSplitTimeTo(controlIndex); return (compSplit === null) ? null : compSplit - referenceSplit; });
        return timesBehind;
    };
    
    /**
    * Updates the statistics text shown after the competitor.
    */
    SplitsBrowser.Controls.Chart.prototype.updateCompetitorStatistics = function() {
        var outerThis = this;
        var selectedCompetitors = this.selectedIndexesOrderedByLastYValue.map(function (index) { return outerThis.course.competitors[index]; });
        var labelTexts = selectedCompetitors.map(function (comp) { return comp.name; });
        
        if (this.currentControlIndex !== null && this.currentControlIndex > 0) {
            if (this.visibleStatistics[0]) {
                var cumTimes = selectedCompetitors.map(function (comp) { return comp.getCumulativeTimeTo(outerThis.currentControlIndex); });
                var cumRanks = selectedCompetitors.map(function (comp) { return comp.getCumulativeRankTo(outerThis.currentControlIndex); });
                labelTexts = d3.zip(labelTexts, cumTimes, cumRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
                           
            if (this.visibleStatistics[1]) {
                var splitTimes = selectedCompetitors.map(function (comp) { return comp.getSplitTimeTo(outerThis.currentControlIndex); });
                var splitRanks = selectedCompetitors.map(function (comp) { return comp.getSplitRankTo(outerThis.currentControlIndex); });
                labelTexts = d3.zip(labelTexts, splitTimes, splitRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
             
            if (this.visibleStatistics[2]) {
                var timesBehind = this.getTimesBehind(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                labelTexts = d3.zip(labelTexts, timesBehind)
                               .map(function(pair) { return pair[0] + SPACER + SplitsBrowser.formatTime(pair[1]); });
            }
        }
        
        // Update the current competitor data.
        this.currentCompetitorData.forEach(function (data, index) { data.label = labelTexts[index]; });
        
        // This data is already joined to the labels; just update the text.
        d3.selectAll("text.competitorLabel").text(function (data) { return data.label; });
    };

    /**
    * Returns a tick-formatting function that formats the label of a tick on the
    * top X-axis.
    *
    * The function returned is suitable for use with the D3 axis.tickFormat method.
    * This label is "S" for index 0 (the start), "F" for the finish, and
    * the control number for intermediate controls.
    *
    * @returns {function} Tick-formatting function.
    */
    SplitsBrowser.Controls.Chart.prototype.getTickFormatter = function () {
        var outerThis = this;
        return function (value, idx) {
            return (idx === 0) ? "S" : ((idx === outerThis.numControls + 1) ? "F" : idx.toString());
        };
    };

    /**
    * Get the width of a piece of text.
    * @param {string} text - The piece of text to measure the width of.
    * @returns {Number} The width of the piece of text, in pixels. 
    */
    SplitsBrowser.Controls.Chart.prototype.getTextWidth = function (text) {
        return d3.select(_TEXT_SIZE_ELEMENT_ID_SELECTOR).text(text).node().getBBox().width;
    };

    /**
    * Gets the height of a piece of text.
    *
    * @param {string} text - The piece of text to measure the height of.
    * @returns {Number} The height of the piece of text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getTextHeight = function (text) {
        return d3.select(_TEXT_SIZE_ELEMENT_ID_SELECTOR).text(text).node().getBBox().height;
    };

    /**
    * Return the maximum width of the end-text shown to the right of the graph.
    *
    * This function considers only the competitors whose indexes are in the
    * list given.  This method returns zero if the list is empty.
    * @returns {Number} Maximum width of text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxGraphEndTextWidth = function () {
        if (this.selectedIndexes.length === 0 || this.names.length === 0) {
            // No competitors selected or no names yet.  Avoid problems caused
            // by trying to find the maximum of an empty array.
            return 0;
        } else {
            var outerThis = this;
            var nameWidths = this.names.map(function (name) { return outerThis.getTextWidth(name); });
            return d3.max(nameWidths) + this.determineMaxStatisticTextWidth();
        }
    };

    /**
    * Return the maximum width of a piece of time and rank text shown to the right
    * of each competitor 
    * @param {string} timeFuncName - Name of the function to call to get the time
                                     data.
    * @param {string} rankFuncName - Name of the function to call to get the rank
                                     data.
    * @returns {Number} Maximum width of split-time and rank text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxTimeAndRankTextWidth = function(timeFuncName, rankFuncName) {
        var maxTime = 0;
        var maxRank = 0;
        
        var outerThis = this;
        var selectedCompetitors = this.selectedIndexes.map(function (index) { return outerThis.course.competitors[index]; });
        
        d3.range(1, this.numControls + 2).forEach(function (controlIndex) {
            var times = selectedCompetitors.map(function (comp) { return comp[timeFuncName](controlIndex); });
            maxTime = Math.max(maxTime, d3.max(times.filter(SplitsBrowser.isNotNull)));
            
            var ranks = selectedCompetitors.map(function (comp) { return comp[rankFuncName](controlIndex); });
            maxRank = Math.max(maxRank, d3.max(ranks.filter(SplitsBrowser.isNotNull)));
        });
        
        var text = formatTimeAndRank(maxTime, maxRank);
        return this.getTextWidth(text);
    };

    /**
    * Return the maximum width of the split-time and rank text shown to the right
    * of each competitor 
    * @returns {Number} Maximum width of split-time and rank text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxSplitTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getSplitTimeTo", "getSplitRankTo");
    };

    /**
    * Return the maximum width of the cumulative time and cumulative-time rank text
    * shown to the right of each competitor 
    * @returns {Number} Maximum width of cumulative time and cumulative-time rank text, in
    *                   pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxCumulativeTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getCumulativeTimeTo", "getCumulativeRankTo");
    };

    /**
    * Return the maximum width of the behind-fastest time shown to the right of
    * each competitor 
    * @returns {Number} Maximum width of behind-fastest time rank text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxTimeBehindFastestWidth = function() {
        var maxTime = 0;
        
        for (var controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
            var times = this.getTimesBehind(controlIndex, this.selectedIndexes);
            maxTime = Math.max(maxTime, d3.max(times.filter(SplitsBrowser.isNotNull)));
        }
        
        return this.getTextWidth(SPACER + SplitsBrowser.formatTime(maxTime));
    };

    /**
    * Determines the maximum width of the statistics text at the end of the competitor.
    * @returns {Number} Maximum width of the statistics text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.determineMaxStatisticTextWidth = function() {
        var maxWidth = 0;
        if (this.visibleStatistics[0]) {
            maxWidth += this.getMaxCumulativeTimeAndRankTextWidth();
        }
        if (this.visibleStatistics[1]) {
            maxWidth += this.getMaxSplitTimeAndRankTextWidth();
        }
        if (this.visibleStatistics[2]) {
            maxWidth += this.getMaxTimeBehindFastestWidth();
        }
        
        return maxWidth;
    };

    /**
    * Creates the X and Y scales necessary for the chart and its axes.
    * @param {object} chartData - Chart data object.
    */
    SplitsBrowser.Controls.Chart.prototype.createScales = function (chartData) {
        this.xScale = d3.scale.linear().domain(chartData.xExtent).range([0, this.contentWidth]);
        this.yScale = d3.scale.linear().domain(chartData.yExtent).range([0, this.contentHeight]);
        this.xScaleMinutes = d3.scale.linear().domain([chartData.xExtent[0] / 60, chartData.xExtent[1] / 60]).range([0, this.contentWidth]);
    };

    /**
    * Draw the background rectangles that indicate sections of the course
    * between controls.
    */
    SplitsBrowser.Controls.Chart.prototype.drawBackgroundRectangles = function () {
        var rects = this.svgGroup.selectAll("rect")
                                 .data(d3.range(this.numControls + 1));

        var outerThis = this;

        rects.enter().append("rect");

        rects.attr("x", function (index) { return outerThis.xScale(outerThis.referenceCumTimes[index]); })
                .attr("y", 0)
                .attr("width", function (index) { return outerThis.xScale(outerThis.referenceCumTimes[index + 1] - outerThis.referenceCumTimes[index]); })
                .attr("height", this.contentHeight)
                .attr("fill", function (index) { return (index % 2 === 0) ? backgroundColour1 : backgroundColour2; });

        rects.exit().remove();
    };

    /**
    * Draw the chart axes.
    * @param {String} yAxisLabel - The label to use for the Y-axis.
    */
    SplitsBrowser.Controls.Chart.prototype.drawAxes = function (yAxisLabel) {
        var xAxis = d3.svg.axis()
                          .scale(this.xScale)
                          .orient("top")
                          .tickFormat(this.getTickFormatter())
                          .tickValues(this.referenceCumTimes);

        var yAxis = d3.svg.axis()
                          .scale(this.yScale)
                          .orient("left");
                     
        var lowerXAxis = d3.svg.axis()
                               .scale(this.xScaleMinutes)
                               .orient("bottom");

        this.svgGroup.selectAll("g.axis").remove();

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .call(xAxis);

        this.svgGroup.append("g")
                     .attr("class", "y axis")
                     .call(yAxis)
                     .append("text")
                     .attr("transform", "rotate(-90)")
                     .attr("x", -(this.contentHeight - 6))
                     .attr("y", 6)
                     .attr("dy", ".71em")
                     .style("text-anchor", "start")
                     .text(yAxisLabel);

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .attr("transform", "translate(0," + this.contentHeight + ")")                     
                     .call(lowerXAxis)
                     .append("text")
                     .attr("x", 60)
                     .attr("y", -5)
                     .style("text-anchor", "start")
                     .text("Time (min)");
    };
    
    /**
    * Draw the lines on the chart.
    * @param {Array} chartData - Array of chart data.
    */
    SplitsBrowser.Controls.Chart.prototype.drawChartLines = function (chartData) {
        var outerThis = this;
        var lineFunctionGenerator = function (selCompIdx) {
            if (chartData.dataColumns.every(function (col) { return col.ys[selCompIdx] === null; })) {
                // This competitor's entire row is null, so there's no data to
                // draw.  d3 will report an error ('Error parsing d=""') if no
                // points on the line are defined, as will happen in this case,
                // so we substitute some dummy data instead.
                return d3.svg.line().x(function (d) { return -10000; })
                                    .y(function (d) { return -10000; });
            }
            else {
                return d3.svg.line()
                                .x(function (d) { return outerThis.xScale(d.x); })
                                .y(function (d) { return outerThis.yScale(d.ys[selCompIdx]); })
                                .defined(function (d) { return d.ys[selCompIdx] !== null; })
                                .interpolate("linear");
            }
        };

        var graphLines = this.svgGroup.selectAll("path.graphLine")
                                      .data(d3.range(this.numLines));

        graphLines.enter()
                  .append("path");

        graphLines.attr("d", function (selCompIdx) { return lineFunctionGenerator(selCompIdx)(chartData.dataColumns); })
                  .attr("stroke", function (selCompIdx) { return colours[outerThis.selectedIndexes[selCompIdx] % colours.length]; })
                  .attr("class", function (selCompIdx) { return "graphLine competitor" + outerThis.selectedIndexes[selCompIdx]; })
                  .on("mouseenter", function (selCompIdx) { outerThis.highlight(outerThis.selectedIndexes[selCompIdx]); })
                  .on("mouseleave", function () { outerThis.unhighlight(); });

        graphLines.exit().remove();
    };

    /**
    * Highlights the competitor with the given index.
    * @param {Number} competitorIdx - The index of the competitor to highlight.
    */
    SplitsBrowser.Controls.Chart.prototype.highlight = function (competitorIdx) {
        this.svg.selectAll("path.graphLine.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("line.competitorLegendLine.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("text.competitorLabel.competitor" + competitorIdx).classed("selected", true);
    };

    /**
    * Removes any competitor-specific higlighting.
    */
    SplitsBrowser.Controls.Chart.prototype.unhighlight = function () {
        this.svg.selectAll("path.graphLine").classed("selected", false);
        this.svg.selectAll("line.competitorLegendLine").classed("selected", false);
        this.svg.selectAll("text.competitorLabel").classed("selected", false);
    };

    /**
    * Draw legend labels to the right of the chart.
    * @param {object} chartData - The chart data that contains the final time offsets.
    */
    SplitsBrowser.Controls.Chart.prototype.drawCompetitorLegendLabels = function (chartData) {
        
        if (chartData.dataColumns.length === 0) {
            this.currentCompetitorData = [];
        } else {
            var finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
            var outerThis = this;
            this.currentCompetitorData = d3.range(this.numLines).map(function (i) {
                return {
                    label: outerThis.names[i],
                    textHeight: outerThis.getTextHeight(outerThis.names[i]),
                    y: (finishColumn.ys[i] === null) ? null : outerThis.yScale(finishColumn.ys[i]),
                    colour: colours[outerThis.selectedIndexes[i] % colours.length],
                    index: outerThis.selectedIndexes[i]
                };
            });
            
            // Draw the mispunchers at the bottom of the chart, with the last
            // one of them at the bottom.
            var lastMispuncherY = null;
            for (var selCompIdx = this.currentCompetitorData.length - 1; selCompIdx >= 0; selCompIdx -= 1) {
                if (this.currentCompetitorData[selCompIdx].y === null) {
                    this.currentCompetitorData[selCompIdx].y = (lastMispuncherY === null) ? this.contentHeight : lastMispuncherY - this.currentCompetitorData[selCompIdx].textHeight;
                    lastMispuncherY = this.currentCompetitorData[selCompIdx].y;
                }
            }
        }
        
        // Sort by the y-offset values, which doesn't always agree with the end
        // positions of the competitors.
        this.currentCompetitorData.sort(function (a, b) { return a.y - b.y; });
        
        this.selectedIndexesOrderedByLastYValue = this.currentCompetitorData.map(function (comp) { return comp.index; });

        // Some ys may be too close to the previous one.  Adjust them downwards
        // as necessary.
        for (var i = 1; i < this.currentCompetitorData.length; ++i) {
            if (this.currentCompetitorData[i].y < this.currentCompetitorData[i - 1].y + this.currentCompetitorData[i - 1].textHeight) {
                this.currentCompetitorData[i].y = this.currentCompetitorData[i - 1].y + this.currentCompetitorData[i - 1].textHeight;
            }
        }

        var legendLines = this.svgGroup.selectAll("line.competitorLegendLine").data(this.currentCompetitorData);
        legendLines.enter()
                   .append("line");

        legendLines.attr("x1", this.contentWidth + 1)
                   .attr("y1", function (data) { return data.y; })
                   .attr("x2", this.contentWidth + legendLineWidth + 1)
                   .attr("y2", function (data) { return data.y; })
                   .attr("stroke", function (data) { return data.colour; })
                   .attr("class", function (data) { return "competitorLegendLine competitor" + data.index; })
                   .on("mouseenter", function (data) { outerThis.highlight(data.index); })
                   .on("mouseleave", function (data) { outerThis.unhighlight(); });

        legendLines.exit().remove();

        var labels = this.svgGroup.selectAll("text.competitorLabel").data(this.currentCompetitorData);
        labels.enter()
              .append("text");

        labels.attr("x", this.contentWidth + legendLineWidth + 2)
              .attr("y", function (data) { return data.y + data.textHeight / 4; })
              .attr("class", function (data) { return "competitorLabel competitor" + data.index; })
              .on("mouseenter", function (data) { outerThis.highlight(data.index); })
              .on("mouseleave", function (data) { outerThis.unhighlight(); })
              .text(function (data) { return data.label; });

        labels.exit().remove();
    };

    /**
    * Adjusts the computed values for the content size of the chart.
    *
    * This method should be called after any of the following occur:
    * (1) the overall size of the chart changes.
    * (2) the currently-selected set of indexes changes
    * (3) the chart data is set.
    * If you find part of the chart is missing sometimes, chances are you've
    * omitted a necessary call to this method.
    */
    SplitsBrowser.Controls.Chart.prototype.adjustContentSize = function () {
        var maxTextWidth = this.getMaxGraphEndTextWidth();
        this.contentWidth = Math.max(this.overallWidth - margin.left - margin.right - maxTextWidth - (legendLineWidth + 2), 100);
        this.contentHeight = Math.max(this.overallHeight - margin.top - margin.bottom, 100);
    };

    /**
    * Sets the overall size of the chart control, including margin, axes and legend labels.
    * @param {Number} overallWidth - Overall width
    * @param {Number} overallHeight - Overall height
    */
    SplitsBrowser.Controls.Chart.prototype.setSize = function (overallWidth, overallHeight) {
        this.overallWidth = overallWidth;
        this.overallHeight = overallHeight;
        $(_CHART_SVG_ID_SELECTOR).width(overallWidth).height(overallHeight);
        this.adjustContentSize();
    };

    /**
    * Draws the chart.
    * @param {object} chartData - Data for all of the currently-visible
    *                 competitors.
    * @param {SplitsBrowser.Model.Course} course - The course data object.
    * @param {Array} referenceCumTimes - Array of cumulative times of the
    *                            'reference', in units of seconds.
    * @param {Array} selectedIndexes - Array of indexes of selected competitors
    *                (0 in this array means the first competitor is selected, 1
    *                means the second is selected, and so on.)
    * @param {Array} visibleStatistics - Array of boolean flags indicating whether
    *                                    certain statistics are visible.
    * @param {yAxisLabel} yAxisLabel - The label of the y-axis.                                    
    */
    SplitsBrowser.Controls.Chart.prototype.drawChart = function (chartData, course, referenceCumTimes, selectedIndexes, visibleStatistics, yAxisLabel) {
        this.numControls = chartData.numControls;
        this.names = chartData.competitorNames;
        this.numLines = this.names.length;
        this.selectedIndexes = selectedIndexes;
        this.referenceCumTimes = referenceCumTimes;
        this.course = course;
        this.visibleStatistics = visibleStatistics;
        this.maxStatisticTextWidth = this.determineMaxStatisticTextWidth();
        this.adjustContentSize();
        this.createScales(chartData);
        this.drawBackgroundRectangles();
        this.drawAxes(yAxisLabel);
        this.drawChartLines(chartData);
        this.drawCompetitorLegendLabels(chartData);
    };
})();


(function () {
    "use strict";
    
    var _NON_BREAKING_SPACE_CHAR = "\u00a0";

    /**
    * A control that shows an entire table of results.
    * @constructor
    * @param {HTMLElement} parent - The parent element to add this control to.
    */
    SplitsBrowser.Controls.ResultsTable = function (parent) {
        this.parent = parent;
        this.course = null;
        this.div = null;
        this.headerSpan = null;
        this.table = null;
        this.buildTable();
    };
    
    /**
    * Build the results table.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.buildTable = function () {
        this.div = d3.select(this.parent).append("div")
                                         .attr("id", "resultsTableContainer");
                                         
        this.headerSpan = this.div.append("div")
                                  .append("span")
                                  .classed("resultsTableHeader", true);
                                  
        this.table = this.div.append("table")
                             .classed("resultsTable", true);
                             
        this.table.append("thead")
                  .append("tr");
                  
        this.table.append("tbody");
    };
    
    /**
    * Populates the contents of the table with the course data.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.populateTable = function () {
        var resultLines = [];
        
        // TODO add course distance and climb, if known?
        this.headerSpan.text(this.course.name + ", " + this.course.numControls + " control" + ((this.course.numControls === 1) ? "" : "s"));
        
        var headerRow = this.table.select("thead");
        var headerCellData = ["#", "Name", "Time"].concat(d3.range(1, this.course.numControls + 1)).concat(["Finish"]);
        var headerCells = this.table.select("thead tr")
                                    .selectAll("th")
                                    .data(headerCellData);
                                                       
        headerCells.enter().append("th");
        headerCells.text(function (header) { return header; });
        headerCells.exit().remove();
        
        var tableBody = this.table.select("tbody");
        tableBody.selectAll("tr").remove();
        
        function addCell(tableRow, topLine, bottomLine, cssClass) {
            var cell = tableRow.append("td");
            cell.append("span").text(topLine);
            cell.append("br");
            cell.append("span").text(bottomLine);
            if (cssClass) {
                cell.classed(cssClass, true);
            }
        }
        
        var competitors = this.course.competitors.slice(0);
        competitors.sort(SplitsBrowser.Model.compareCompetitors);
        
        var outerThis = this;
        var nonCompCount = 0;
        competitors.forEach(function (competitor) {
            var tableRow = tableBody.append("tr");
            var numberCell = tableRow.append("td");
            if (competitor.isNonCompetitive) {
                numberCell.text("n/c");
                nonCompCount += 1;
            } else if (competitor.completed()) {
                numberCell.text(competitor.cumRanks[competitor.cumRanks.length - 1] - nonCompCount);
            }
            
            addCell(tableRow, competitor.name, competitor.club);
            addCell(tableRow, SplitsBrowser.formatTime(competitor.totalTime, "mp"), _NON_BREAKING_SPACE_CHAR, "time");
            
            d3.range(1, outerThis.course.numControls + 2).forEach(function (controlNum) {
                addCell(tableRow, SplitsBrowser.formatTime(competitor.getCumulativeTimeTo(controlNum)), SplitsBrowser.formatTime(competitor.getSplitTimeTo(controlNum)), "time");
            });
        });
    };
    
    /**
    * Sets the course whose data is displayed.
    * @param {SplitsBrowser.Model.Course} course - The course displayed.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.setCourse = function (course) {
        this.course = course;
        this.populateTable();
        if (this.div.style("display") !== "none") {
            this.adjustTableCellWidths();
        }
    };
    
    /**
    * Adjust the widths of the time table cells so that they have the same width.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.adjustTableCellWidths = function () {
        var lastCellOnFirstRow = d3.select("tbody tr td:last-child").node();
        $("tbody td.time").width($(lastCellOnFirstRow).width());
    };
    
    /**
    * Shows the table of results.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.show = function () {
        this.div.style("display", "");
        this.adjustTableCellWidths();
    };
    
    /**
    * Hides the table of results.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.hide = function () {
        this.div.style("display", "none");
    };
})();

/* global window, document, $, SplitsBrowser, d3, setTimeout, clearTimeout */

(function () {
    "use strict";
    // Delay in milliseconds between a resize event being triggered and the
    // page responding to it.
    // (Resize events tend to come more than one at a time; if a resize event
    // comes in while a previous event is waiting, the previous event is
    // cancelled.)
    var RESIZE_DELAY_MS = 100;

    var _TOP_PANEL_ID = "topPanel";
    var _TOP_PANEL_ID_SELECTOR = "#" + _TOP_PANEL_ID;
    
    var _MAIN_PANEL_ID = "mainPanel";
    var _MAIN_PANEL_ID_SELECTOR = "#" + _MAIN_PANEL_ID;

    var _COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    var _COMPETITOR_LIST_CONTAINER_ID_SELECTOR = "#" + _COMPETITOR_LIST_CONTAINER_ID;

    var _ALL_OR_NONE_BUTTONS_PANEL_ID = "allOrNoneButtonsPanel";
    var _ALL_OR_NONE_BUTTONS_PANEL_ID_SELECTOR = "#" + _ALL_OR_NONE_BUTTONS_PANEL_ID;
    
    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    */
    SplitsBrowser.Viewer = function () {

        this.courses = null;
        this.currentCourse = null;
        this.currentIndexes = null;
        this.chartData = null;
        this.referenceCumTimes = null;

        this.selection = null;
        this.courseSelector = null;
        this.statisticsSelector = null;
        this.competitorListBox = null;
        this.chart = null;
        this.topPanel = null;
        this.mainPanel = null;
        
        this.currentResizeTimeout = null;
    };
    
    /**
    * Sets the courses that the viewer can view.
    * @param {Array} courses - The array of courses that can be viewed.
    */
    SplitsBrowser.Viewer.prototype.setCourses = function (courses) {
        this.courses = courses;
        if (this.comparisonSelector !== null) {
            this.comparisonSelector.setCourses(courses);
        }
        if (this.courseSelector !== null) {
            this.courseSelector.setCourses(this.courses);
        }
    };

    /**
    * Construct the UI inside the HTML body.
    */
    SplitsBrowser.Viewer.prototype.buildUi = function () {
        var body = d3.select("body");
        
        var topPanel = body.append("div")
                           .attr("id", _TOP_PANEL_ID);
                           
        var outerThis = this;
        this.courseSelector = new SplitsBrowser.Controls.CourseSelector(topPanel.node());
        if (this.courses !== null) {
            this.courseSelector.setCourses(this.courses);
        }
        
        topPanel.append("span").style("padding", "0px 30px 0px 30px");
        
        this.chartTypeSelector = new SplitsBrowser.Controls.ChartTypeSelector(topPanel.node());
        
        this.chartType = this.chartTypeSelector.getChartType();
        
        topPanel.append("span").style("padding", "0px 30px 0px 30px");
        
        this.comparisonSelector = new SplitsBrowser.Controls.ComparisonSelector(topPanel.node());
        if (this.courses !== null) {
            this.comparisonSelector.setCourses(this.courses);
        }
        
        this.comparisonFunction = this.comparisonSelector.getComparisonFunction();
        
        this.statisticsSelector = new SplitsBrowser.Controls.StatisticsSelector(topPanel.node());
        
        var mainPanel = body.append("div")
                            .attr("id", _MAIN_PANEL_ID);
        
        var competitorListContainer = mainPanel.append("div")
                                               .attr("id", _COMPETITOR_LIST_CONTAINER_ID);
                                               
        var buttonsContainer = competitorListContainer.append("div")
                                                      .attr("id", _ALL_OR_NONE_BUTTONS_PANEL_ID);
                     
        buttonsContainer.append("button")
                        .text("All")
                        .on("click", function () { outerThis.selectAll(); });
                        
        buttonsContainer.append("button")
                        .text("None")
                        .on("click", function () { outerThis.selectNone(); });
                                                           
        this.competitorListBox = new SplitsBrowser.Controls.CompetitorListBox(competitorListContainer.node());
        this.chart = new SplitsBrowser.Controls.Chart(mainPanel.node());
        
        this.resultsTable = new SplitsBrowser.Controls.ResultsTable(body.node());
        this.resultsTable.hide();
        
        this.courseSelector.registerChangeHandler(function (index) {
            outerThis.comparisonSelector.updateRunnerList(index);
            outerThis.selectCourse(index);
        });
        
        this.chartTypeSelector.registerChangeHandler(function (chartType) { outerThis.selectChartType(chartType); });
        
        this.comparisonSelector.registerChangeHandler(function (comparisonFunc) { outerThis.selectComparison(comparisonFunc); });
           
        $(window).resize(function () { outerThis.handleWindowResize(); });
    };

    /**
    * Select all of the competitors.
    */
    SplitsBrowser.Viewer.prototype.selectAll = function () {
        this.selection.selectAll();
    };

    /**
    * Select none of the competitors.
    */
    SplitsBrowser.Viewer.prototype.selectNone = function () {
        this.selection.selectNone();
    };

    /**
     * Handle a resize of the window.
     */
    SplitsBrowser.Viewer.prototype.handleWindowResize = function () {
        if (this.currentResizeTimeout !== null) {
            clearTimeout(this.currentResizeTimeout);
        }

        var outerThis = this;
        this.currentResizeTimeout = setTimeout(function() { outerThis.postResizeHook(); }, RESIZE_DELAY_MS);
    };
    
    /**
    * Resize the chart following a change of size of the chart.
    */
    SplitsBrowser.Viewer.prototype.postResizeHook = function () {
        this.currentResizeTimeout = null;
        this.drawChart();
    };

    /**
    * Draw the chart using the current data.
    */
    SplitsBrowser.Viewer.prototype.drawChart = function () {
        if (this.chartType.isResultsTable) {
            return;
        }

        this.referenceCumTimes = this.comparisonFunction(this.currentCourse);
        this.chartData = this.currentCourse.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);

        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        
        this.currentVisibleStatistics = this.statisticsSelector.getVisibleStatistics();

        this.competitorListBox.setCompetitorList(this.currentCourse.competitors);

        var topPanelHeight = $(_TOP_PANEL_ID_SELECTOR).height();
        
        // Subtract some values to avoid scrollbars appearing.
        var chartWidth = windowWidth - 18 - this.competitorListBox.width() - 40;
        var chartHeight = windowHeight - 19 - topPanelHeight;

        this.chart.setSize(chartWidth, chartHeight);
        this.chart.drawChart(this.chartData, this.currentCourse, this.referenceCumTimes, this.currentIndexes, this.currentVisibleStatistics, this.chartType.yAxisLabel);

        var outerThis = this;
        
        if (this.selectionChangeHandler !== null) {
            this.selection.deregisterChangeHandler(this.selectionChangeHandler);
        }
        
        if (this.statisticsChangeHandler !== null) {
            this.statisticsSelector.deregisterChangeHandler(this.statisticsChangeHandler);
        }
        
        this.selectionChangeHandler = function (indexes) {
            outerThis.currentIndexes = indexes;
            outerThis.redraw();
        };

        this.selection.registerChangeHandler(this.selectionChangeHandler);
        
        this.statisticsChangeHandler = function (visibleStatistics) {
            outerThis.currentVisibleStatistics = visibleStatistics;
            outerThis.redraw();
        };
        
        this.statisticsSelector.registerChangeHandler(this.statisticsChangeHandler);

        $("body").height(windowHeight - 19 - topPanelHeight);
        $(_COMPETITOR_LIST_CONTAINER_ID_SELECTOR).height(windowHeight - 19 - $(_ALL_OR_NONE_BUTTONS_PANEL_ID_SELECTOR).height() - topPanelHeight);
    };

    /**
    * Redraw the chart, possibly using new data.
    */
    SplitsBrowser.Viewer.prototype.redraw = function () {
        if (!this.chartType.isResultsTable) {
            this.chartData = this.currentCourse.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);
            this.chart.drawChart(this.chartData, this.currentCourse, this.referenceCumTimes, this.currentIndexes, this.currentVisibleStatistics, this.chartType.yAxisLabel);
        }
    };
    
    /**
    * Change the graph to show the course with the given index.
    * @param {Number} index - The (zero-based) index of the course.
    */
    SplitsBrowser.Viewer.prototype.selectCourse = function (index) {
        if (0 <= index && index < this.courses.length) {
            if (this.selection !== null) {
                this.selection.selectNone();
            }
            this.currentIndexes = [];
            this.currentCourse = this.courses[index];
            this.selection = new SplitsBrowser.Model.CompetitorSelection(this.currentCourse.competitors.length);
            this.competitorListBox.setSelection(this.selection);
            this.resultsTable.setCourse(this.currentCourse);
            this.drawChart();
        }
    };
    
    /**
    * Change the graph to compare against a different reference.
    * @param {Function} comparisonFunc - The function that returns the
    *      reference course data from the course data.
    */
    SplitsBrowser.Viewer.prototype.selectComparison = function (comparisonFunc) {
        this.comparisonFunction = comparisonFunc;
        this.drawChart();
    };
    
    /**
    * Change the type of chart shown.
    * @param {Object} chartType - The type of chart to draw.
    */
    SplitsBrowser.Viewer.prototype.selectChartType = function (chartType) {
        this.chartType = chartType;
        if (chartType.isResultsTable) {
            d3.select(_MAIN_PANEL_ID_SELECTOR).style("display", "none");
            this.resultsTable.show();
        } else {
            this.resultsTable.hide();
            d3.select(_MAIN_PANEL_ID_SELECTOR).style("display", "");
        }
        
        this.drawChart();
    };
    
    /**
    * Handles an asynchronous callback that fetched event data, by parsing the
    * data and starting SplitsBrowser.
    * @param {String} data - The data returned from the AJAX request.
    * @param {String} status - The status of the request.
    * @param {Object} jqXHR - jQuery XmlHttpRequest object.
    */
    function readEventData(data, status, jqXHR) {
        if (status === "success") {
            var courses = SplitsBrowser.Input.parseEventData(data);
            if (courses === null) {
                alert("Unable to read in event data file");
            } else {
                var viewer = new SplitsBrowser.Viewer();
                viewer.buildUi();
                viewer.setCourses(courses);
                viewer.selectCourse(0);
            }
        } else {
            alert("Unable to read event data.  Status: " + status);
        }
    }

    /**
    * Loads the event data in the given URL and starts SplitsBrowser.
    * @param {String} eventUrl - The URL that points to the event data to load.
    */
    SplitsBrowser.loadEvent = function (eventUrl) {
        $.ajax({
            url: eventUrl,
            data: "",
            success: readEventData,
            dataType: "text",
        });
    };
})();
