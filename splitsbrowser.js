// Tell JSHint not to complain that this isn't used anywhere.
/* exported SplitsBrowser */
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
    * Utility function that returns whether a value is not null.
    * @param x - Any input value.
    * @returns True if the value is not null, false otherwise.
    */
    SplitsBrowser.isNotNull = function (x) { return x !== null; };

    /**
    * Exception object raised if invalid data is passed.
    * @constructor.
    * @param {string} message - The exception detail message.
    */
    var InvalidData = function (message) {
        this.name = "InvalidData";
        this.message = message;
    };

    /**
    * Returns a string representation of this exception.
    * @returns {String} String representation.
    */
    InvalidData.prototype.toString = function () {
        return this.name + ": " + this.message;
    };

    /**
    * Utility function to throw an 'InvalidData' exception object.
    * @param {string} message - The exception message.
    * @throws {InvalidData} if invoked.
    */
    SplitsBrowser.throwInvalidData = function (message) {
        throw new InvalidData(message);
    };
    
    /**
    * Exception object raised if a data parser for a format deems that the data
    * given is not of that format.
    * @constructor
    * @param {String} message - The exception message.
    */
    var WrongFileFormat = function (message) {
        this.name = "WrongFileFormat";
        this.message = message;
    };
    
    /**
    * Returns a string representation of this exception.
    * @returns {String} String representation.
    */
    WrongFileFormat.prototype.toString = function () {
        return this.name + ": " + this.message;
    };
    
    /**
    * Utility funciton to throw a 'WrongFileFormat' exception object.
    * @param {string} message - The exception message.
    * @throws {WrongFileFormat} if invoked.
    */
    SplitsBrowser.throwWrongFileFormat = function (message) {
        throw new WrongFileFormat(message);
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

    var NUMBER_TYPE = typeof 0;
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;

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
            throw new TypeError("Split times must be an array - got " + typeof splitTimes + " instead");
        } else if (splitTimes.length === 0) {
            throwInvalidData("Array of split times must not be empty");
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
            throw new TypeError("Cumulative times must be an array - got " + typeof cumTimes + " instead");
        } else if (cumTimes.length === 0) {
            throwInvalidData("Array of cumulative times must not be empty");
        } else if (cumTimes[0] !== 0) {
            throwInvalidData("Array of cumulative times must have zero as its first item");
        } else if (cumTimes.length === 1) {
            throwInvalidData("Array of cumulative times must contain more than just a single zero");
        }
        
        var splitTimes = [];
        for (var i = 0; i + 1 < cumTimes.length; i += 1) {
            splitTimes.push(subtractIfNotNull(cumTimes[i + 1], cumTimes[i]));
        }
        
        return splitTimes;
    }

    /**
    * Object that represents the data for a single competitor.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * It is not recommended to use this constructor directly.  Instead, use one of
    * the factory methods fromSplitTimes or fromCumTimes to pass in either the
    * split or cumulative times and have the other calculated.
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

        if (typeof order !== NUMBER_TYPE) {
            throwInvalidData("Competitor order must be a number, got " + typeof order + " '" + order + "' instead");
        }

        this.order = order;
        this.forename = forename;
        this.surname = surname;
        this.club = club;
        this.startTime = startTime;
        this.isNonCompetitive = false;
        this.className = null;
        
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
    
    /**
    * Sets the name of the class that the competitor belongs to.
    * @param {String} className - The name of the class.
    */
    Competitor.prototype.setClassName = function (className) {
        this.className = className;
    };
    
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
    * @param {Number} startTime - The competitor's start time, as seconds past midnight.
    * @param {Array} splitTimes - Array of split times, as numbers, with nulls for missed controls.
    */
    Competitor.fromSplitTimes = function (order, forename, surname, club, startTime, splitTimes) {
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
    * @param {Number} startTime - The competitor's start time, as seconds past midnight.
    * @param {Array} cumTimes - Array of cumulative split times, as numbers, with nulls for missed controls.
    */
    Competitor.fromCumTimes = function (order, forename, surname, club, startTime, cumTimes) {
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
    * Returns the 'suffix' to use with a competitor.
    * The suffix indicates whether they are non-competitive or a mispuncher.  If
    * they are neither, an empty string is returned.
    * @return Suffix.
    */
    Competitor.prototype.getSuffix = function () {
        if (this.completed()) {
            return (this.isNonCompetitive) ? "n/c" : "";
        } else {
            return "mp";
        }
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
            throwInvalidData("Cannot adjust competitor times because the numbers of times are different (" + this.cumTimes.length + " and " + referenceCumTimes.length + ")");
        } else if (referenceCumTimes.indexOf(null) > -1) {
            throwInvalidData("Cannot adjust competitor times because a null value is in the reference data");
        }

        var adjustedTimes = this.cumTimes.map(function (time, idx) { return subtractIfNotNull(time, referenceCumTimes[idx]); });
        return adjustedTimes;
    };
    
    /**
    * Returns the cumulative times of this competitor with the start time added on.
    * @param {Array} referenceCumTimes - The reference cumulative-split-time data to adjust by.
    * @return {Array} The array of adjusted data.
    */
    Competitor.prototype.getCumTimesAdjustedToReferenceWithStartAdded = function (referenceCumTimes) {
        var adjustedTimes = this.getCumTimesAdjustedToReference(referenceCumTimes);
        var startTime = this.startTime;
        return adjustedTimes.map(function (adjTime) { return addIfNotNull(adjTime, startTime); });
    };
    
    /**
    * Returns an array of percentages that this competitor's splits were behind
    * those of a reference competitor.
    * @param {Array} referenceCumTimes - The reference cumulative split times
    * @return {Array} The array of percentages.
    */
    Competitor.prototype.getSplitPercentsBehindReferenceCumTimes = function (referenceCumTimes) {
        if (referenceCumTimes.length !== this.cumTimes.length) {
            throwInvalidData("Cannot determine percentages-behind because the numbers of times are different (" + this.cumTimes.length + " and " + referenceCumTimes.length + ")");
        } else if (referenceCumTimes.indexOf(null) > -1) {
            throwInvalidData("Cannot determine percentages-behind because a null value is in the reference data");
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
    
    /**
    * Returns whether this competitor 'crosses' another.  Two competitors are
    * considered to have crossed if their chart lines on the Race Graph cross.
    * @param {Competitor} other - The competitor to compare against.
    * @return {Boolean} true if the competitors cross, false if they don't.
    */
    Competitor.prototype.crosses = function (other) {
        if (other.cumTimes.length !== this.cumTimes.length) {
            throwInvalidData("Two competitors with different numbers of controls cannot cross");
        }
        
        // We determine whether two competitors cross by keeping track of
        // whether this competitor is ahead of other at any point, and whether
        // this competitor is behind the other one.  If both, the competitors
        // cross.
        var beforeOther = false;
        var afterOther = false;
        
        for (var controlIdx = 0; controlIdx < this.cumTimes.length; controlIdx += 1) {
            if (this.cumTimes[controlIdx] !== null && other.cumTimes[controlIdx] !== null) {
                var thisTotalTime = this.startTime + this.cumTimes[controlIdx];
                var otherTotalTime = other.startTime + other.cumTimes[controlIdx];
                if (thisTotalTime < otherTotalTime) {
                    beforeOther = true;
                } else if (thisTotalTime > otherTotalTime) {
                    afterOther = true;
                }
            }
         }
         
         return beforeOther && afterOther;
    };
    
    SplitsBrowser.Model.Competitor = Competitor;
})();

(function (){
    "use strict";

    var throwInvalidData = SplitsBrowser.throwInvalidData;
    
    /**
     * Object that represents a collection of competitor data for a class.
     * @constructor.
     * @param {string} name - Name of the age class.
     * @param {Number} numControls - Number of controls.
     * @param {Array} competitors - Array of Competitor objects.
     */
    var AgeClass = function (name, numControls, competitors) {
        this.name = name;
        this.numControls = numControls;
        this.competitors = competitors;
        this.course = null;
        
        this.competitors.forEach(function (comp) {
            comp.setClassName(this.name);
        }, this);
    };
    
    /**
    * Returns whether this age-class is empty, i.e. has no competitors.
    * @return {boolean} True if this age class has no competitors, false if it
    *     has at least one competitor.
    */
    AgeClass.prototype.isEmpty = function () {
        return (this.competitors.length === 0);
    };
    
    /**
    * Sets the course that this age class belongs to.
    * @param {SplitsBrowser.Model.Course} course - The course this class belongs to.
    */
    AgeClass.prototype.setCourse = function (course) {
        this.course = course;
    };
    
    /**
    * Returns the controls that all competitors in this class failed to punch.
    *
    * @return {Array} Array of numbers of controls that all competitors in this
    *     class failed to punch.
    */
    AgeClass.prototype.getControlsWithNoSplits = function () {
        return d3.range(1, this.numControls + 1).filter(function (controlNum) {
            return this.competitors.every(function (competitor) { return competitor.getSplitTimeTo(controlNum) === null; });
        }, this);
    };
    
    /**
    * Returns the fastest split time recorded by competitors in this class.  If
    * no fastest split time is recorded (e.g. because all competitors
    * mispunched that control, or the class is empty), null is returned.
    * @param {Number} controlIdx - The index of the control to return the
    *      fastest split to.
    * @return {Object|null} Object containing the name and fastest split, or
    *      null if no split times for that control were recorded.
    */
    AgeClass.prototype.getFastestSplitTo = function (controlIdx) {
        if (typeof controlIdx !== "number" || controlIdx < 1 || controlIdx > this.numControls + 1) {
            throwInvalidData("Cannot return splits to leg '" + this.numControls + "' in a course with " + this.numControls + " control(s)");
        }
    
        var fastestSplit = null;
        var fastestCompetitor = null;
        this.competitors.forEach(function (comp) {
            var compSplit = comp.getSplitTimeTo(controlIdx);
            if (compSplit !== null) {
                if (fastestSplit === null || compSplit < fastestSplit) {
                    fastestSplit = compSplit;
                    fastestCompetitor = comp;
                }
            }
        });
        
        return (fastestSplit === null) ? null : {split: fastestSplit, name: fastestCompetitor.name};
    };
    
    /**
    * Returns all competitors that visited the control in the given time
    * interval.
    * @param {Number} controlNum - The number of the control, with 0 being the
    *     start, and this.numControls + 1 being the finish.
    * @param {Number} intervalStart - The start time of the interval, as
    *     seconds past midnight.
    * @param {Number} intervalEnd - The end time of the interval, as seconds
    *     past midnight.
    * @return {Array} Array of objects listing the name and start time of each
    *     competitor visiting the control within the given time interval.
    */
    AgeClass.prototype.getCompetitorsAtControlInTimeRange = function (controlNum, intervalStart, intervalEnd) {
        if (typeof controlNum !== "number" || isNaN(controlNum) || controlNum < 0 || controlNum > this.numControls + 1) {
            throwInvalidData("Control number must be a number between 0 and " + this.numControls + " inclusive");
        }
        
        var matchingCompetitors = [];
        this.competitors.forEach(function (comp) {
            var cumTime = comp.getCumulativeTimeTo(controlNum);
            if (cumTime !== null && comp.startTime !== null) {
                var actualTimeAtControl = cumTime + comp.startTime;
                if (intervalStart <= actualTimeAtControl && actualTimeAtControl <= intervalEnd) {
                    matchingCompetitors.push({name: comp.name, time: actualTimeAtControl});
                }
            }
        });
        
        return matchingCompetitors;
    };
    
    SplitsBrowser.Model.AgeClass = AgeClass;
})();

(function () {
    "use strict";
      
    var throwInvalidData = SplitsBrowser.throwInvalidData; 
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    
    /**
    * Utility function to merge the lists of all competitors in a number of age
    * classes.  All age classes must contain the same number of controls.
    * @param {Array} ageClasses - Array of AgeClass objects.
    */
    function mergeCompetitors(ageClasses) {
        if (ageClasses.length === 0) {
            throwInvalidData("Cannot create an AgeClassSet from an empty set of competitors");
        }
        
        var allCompetitors = [];
        var expectedControlCount = ageClasses[0].numControls;
        ageClasses.forEach(function (ageClass) {
            if (ageClass.numControls !== expectedControlCount) {
                throwInvalidData("Cannot merge age classes with " + expectedControlCount + " and " + ageClass.numControls + " controls");
            }
            
            ageClass.competitors.forEach(function (comp) { allCompetitors.push(comp); });
        });

        allCompetitors.sort(compareCompetitors);
        return allCompetitors;
    }

    /**
    * Given an array of numbers, return a list of the corresponding ranks of those
    * numbers.
    * @param {Array} sourceData - Array of number values.
    * @returns Array of corresponding ranks.
    */
    function getRanks(sourceData) {
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
    }
    
    /**
    * An object that represents the currently-selected age classes.
    * @constructor
    * @param {Array} ageClasses - Array of currently-selected age classes.
    */
    var AgeClassSet = function (ageClasses) {
        this.allCompetitors = mergeCompetitors(ageClasses);
        this.ageClasses = ageClasses;
        this.numControls = ageClasses[0].numControls;
        this.computeRanks();
    };
    
    /**
    * Returns whether this age-class set is empty, i.e. whether it has no
    * competitors at all.
    */    
    AgeClassSet.prototype.isEmpty = function () {
        return this.allCompetitors.length === 0;
    };
    
    /**
    * Returns the course used by all of the age classes that make up this set.
    * @return {SplitsBrowser.Model.Course} The course used by all age-classes.
    */
    AgeClassSet.prototype.getCourse = function () {
        return this.ageClasses[0].course;
    };
    
    /**
    * Returns the name of the 'primary' age class, i.e. that that has been
    * chosen in the drop-down list.
    * @return {String} Name of the primary age class.
    */
    AgeClassSet.prototype.getPrimaryClassName = function () {
        return this.ageClasses[0].name;
    };
    
    /**
    * Returns the number of age classes that this age-class set is made up of.
    * @return {Number} The number of age classes that this age-class set is
    *     made up of.
    */
    AgeClassSet.prototype.getNumClasses = function () {
        return this.ageClasses.length;
    };
    
    /**
    * Returns an array of the cumulative times of the winner of the set of age
    * classes.
    * @return {Array} Array of the winner's cumulative times.
    */
    AgeClassSet.prototype.getWinnerCumTimes = function () {
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
    AgeClassSet.prototype.getFastestCumTimes = function () {
        return this.getFastestCumTimesPlusPercentage(0);
    };

    /**
    * Returns an array of controls that no competitor in any of the age-classes
    * in this set punched.
    * @return {Array} Array of control numbers of controls that no competitor
    *     punched.
    */
    AgeClassSet.prototype.getControlsWithNoSplits = function () {
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
    AgeClassSet.prototype.getFastestCumTimesPlusPercentage = function (percent) {
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
    AgeClassSet.prototype.computeRanks = function () {
        var splitRanksByCompetitor = [];
        var cumRanksByCompetitor = [];
        
        this.allCompetitors.forEach(function () {
            splitRanksByCompetitor.push([]);
            cumRanksByCompetitor.push([]);
        });
        
        d3.range(1, this.numControls + 2).forEach(function (control) {
            var splitsByCompetitor = this.allCompetitors.map(function(comp) { return comp.getSplitTimeTo(control); });
            var splitRanksForThisControl = getRanks(splitsByCompetitor);
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
            var cumRanksForThisControl = getRanks(cumSplitsByCompetitor);
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
    AgeClassSet.prototype.getFastestSplitsTo = function (numSplits, controlIdx) {
        if (typeof numSplits !== "number" || numSplits <= 0) {
            throwInvalidData("The number of splits must be a positive integer");
        } else if (typeof controlIdx !== "number" || controlIdx <= 0 || controlIdx > this.numControls + 1) {
            throwInvalidData("Control " + controlIdx + " out of range");
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
    AgeClassSet.prototype.getChartData = function (referenceCumTimes, currentIndexes, chartType) {
        if (this.isEmpty()) {
            throwInvalidData("Cannot return chart data when there is no data");
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
    
    SplitsBrowser.Model.AgeClassSet = AgeClassSet;
})();

(function () {
    "use strict";
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    
    /**
    * A collection of 'classes', all runners within which ran the same physical
    * course.
    *
    * Course length and climb are both optional and can both be null.
    * @constructor
    * @param {String} name - The name of the course.
    * @param {Array} classes - Array of AgeClass objects comprising the course.
    * @param {Number|null} length - Length of the course, in kilometres.
    * @param {Number|null} climb - The course climb, in metres.
    * @param {Array|null} controls - Array of codes of the controls that make
    *     up this course.  This may be null if no such information is provided.
    */
    var Course = function (name, classes, length, climb, controls) {
        this.name = name;
        this.classes = classes;
        this.length = length;
        this.climb = climb;
        this.controls = controls;
    };
    
    /** 'Magic' control code that represents the start. */
    Course.START = "__START__";
    
    /** 'Magic' control code that represents the finish. */
    Course.FINISH = "__FINISH__";
    
    var START = Course.START;
    var FINISH = Course.FINISH;
    
    /**
    * Returns an array of the 'other' classes on this course.
    * @param {SplitsBrowser.Model.AgeClass} ageClass - An age class that should
    *     be on this course,
    * @return {Array} Array of other age classes.
    */
    Course.prototype.getOtherClasses = function (ageClass) {
        var otherClasses = this.classes.filter(function (cls) { return cls !== ageClass; });
        if (otherClasses.length === this.classes.length) {
            // Given class not found.
            throwInvalidData("Course.getOtherClasses: given class is not in this course");
        } else {
            return otherClasses;
        }
    };
    
    /**
    * Returns the number of age classes that use this course.
    * @return {Number} Number of age classes that use this course.
    */
    Course.prototype.getNumClasses = function () {
        return this.classes.length;
    };
    
    /**
    * Returns whether this course has control code data.
    * @return {boolean} true if this course has control codes, false if it does
    *     not.
    */
    Course.prototype.hasControls = function () {
        return (this.controls !== null);
    };
    
    /**
    * Returns the code of the control at the given number.
    *
    * The start is control number 0 and the finish has number one more than the
    * number of controls.  Numbers outside this range are invalid and cause an
    * exception to be thrown.
    *
    * The codes for the start and finish are given by the constants
    * SplitsBrowser.Model.Course.START and SplitsBrowser.Model.Course.FINISH.
    *
    * @param {Number} controlNum - The number of the control.
    * @return {String|null} The code of the control, or one of the
    *     aforementioned constants for the start or finish.
    */
    Course.prototype.getControlCode = function (controlNum) {
        if (controlNum === 0) {
            // The start.
            return START;
        } else if (1 <= controlNum && controlNum <= this.controls.length) {
            return this.controls[controlNum - 1];
        } else if (controlNum === this.controls.length + 1) {
            // The finish.
            return FINISH;
        } else {
            throwInvalidData("Cannot get control code of control " + controlNum + " because it is out of range");
        }
    };
    
    /**
    * Returns whether this course uses the given leg.
    *
    * If this course lacks leg information, it is assumed not to contain any
    * legs and so will return false for every leg.
    *
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {boolean} Whether this course uses the given leg.
    */
    Course.prototype.usesLeg = function (startCode, endCode) {
        return this.getLegNumber(startCode, endCode) >= 0;
    };
    
    /**
    * Returns the number of a leg in this course, given the start and end
    * control codes.
    *
    * The number of a leg is the number of the end control (so the leg from
    * control 3 to control 4 is leg number 4.)  The number of the finish
    * control is one more than the number of controls.
    *
    * A negative number is returned if this course does not contain this leg.
    *
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Number} The control number of the leg in this course, or a
    *     negative number if the leg is not part of this course.
    */
    Course.prototype.getLegNumber = function (startCode, endCode) {
        if (this.controls === null) {
            // No controls, so no, it doesn't contain the leg specified.
            return -1;
        }
        
        if (startCode === null && endCode === null) {
            // No controls - straight from the start to the finish.
            // This leg is only present, and is leg 1, if there are no
            // controls.
            return (this.controls.length === 0) ? 1 : -1;
        } else if (startCode === START) {
            // From the start to control 1.
            return (this.controls.length > 0 && this.controls[0] === endCode) ? 1 : -1;
        } else if (endCode === FINISH) {
            return (this.controls.length > 0 && this.controls[this.controls.length - 1] === startCode) ? (this.controls.length + 1) : -1;
        } else {
            for (var controlIdx = 1; controlIdx < this.controls.length; controlIdx += 1) {
                if (this.controls[controlIdx - 1] === startCode && this.controls[controlIdx] === endCode) {
                    return controlIdx + 1;
                }
            }
            
            // If we get here, the given leg is not part of this course.
            return -1;
        }
    };
    
    /**
    * Returns the fastest splits recorded for a given leg of the course.
    *
    * Note that this method should only be called if the course is known to use
    * the given leg.
    *
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or SplitsBrowser.Model.Course.START for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     SplitsBrowser.Model.Course.FINISH for the finish.
    * @return {Array} Array of fastest splits for each age class using this
    *      course.
    */
    Course.prototype.getFastestSplitsForLeg = function (startCode, endCode) {
        if (this.legs === null) {
            throwInvalidData("Cannot determine fastest splits for a leg because leg information is not available");
        }
        
        var legNumber = this.getLegNumber(startCode, endCode);
        if (legNumber < 0) {
            var legStr = ((startCode === START) ? "start" : startCode) + " to " + ((endCode === FINISH) ? "end" : endCode);
            throwInvalidData("Leg from " +  legStr + " not found in course " + this.name);
        }
        
        var controlNum = legNumber;
        var fastestSplits = [];
        this.classes.forEach(function (ageClass) {
            var classFastest = ageClass.getFastestSplitTo(controlNum);
            if (classFastest !== null) {
                fastestSplits.push({name: classFastest.name, className: ageClass.name, split: classFastest.split});
            }
        });
        
        return fastestSplits;
    };
    
    /**
    * Returns a list of all competitors on this course that visit the control
    * with the given code in the time interval given.
    *
    * Specify SplitsBrowser.Model.Course.START for the start and
    * SplitsBrowser.Model.Course.FINISH for the finish.
    *
    * If the given control is not on this course, an empty list is returned.
    *
    * @param {String} controlCode - Control code of the required control.
    * @param {Number} intervalStart - The start of the interval, as seconds
    *     past midnight.
    * @param {Number} intervalEnd - The end of the interval, as seconds past
    *     midnight.
    * @return  {Array} Array of all competitors visiting the given control
    *     within the given time interval.
    */
    Course.prototype.getCompetitorsAtControlInTimeRange = function (controlCode, intervalStart, intervalEnd) {
        if (this.controls === null) {
            // No controls means don't return any competitors.
            return [];
        } else if (controlCode === START) {
            return this.getCompetitorsAtControlNumInTimeRange(0, intervalStart, intervalEnd);
        } else if (controlCode === FINISH) {
            return this.getCompetitorsAtControlNumInTimeRange(this.controls.length + 1, intervalStart, intervalEnd);
        } else {
            var controlIdx = this.controls.indexOf(controlCode);
            if (controlIdx >= 0) {
                return this.getCompetitorsAtControlNumInTimeRange(controlIdx + 1, intervalStart, intervalEnd);
            } else {
                // Control not in this course.
                return [];
            }
        }
    };
    
    /**
    * Returns a list of all competitors on this course that visit the control
    * with the given number in the time interval given.
    *
    * @param {Number} controlNum - The number of the control (0 = start).
    * @param {Number} intervalStart - The start of the interval, as seconds
    *     past midnight.
    * @param {Number} intervalEnd - The end of the interval, as seconds past
    *     midnight.
    * @return  {Array} Array of all competitors visiting the given control
    *     within the given time interval.
    */
    Course.prototype.getCompetitorsAtControlNumInTimeRange = function (controlNum, intervalStart, intervalEnd) {
        var matchingCompetitors = [];
        this.classes.forEach(function (ageClass) {
            ageClass.getCompetitorsAtControlInTimeRange(controlNum, intervalStart, intervalEnd).forEach(function (comp) {
                matchingCompetitors.push({name: comp.name, time: comp.time, className: ageClass.name});
            });
        });
        
        return matchingCompetitors;
    };
    
    SplitsBrowser.Model.Course = Course;
})();

(function () {
    "use strict";
    
    /**
    * Contains all of the data for an event.
    * @param {Array} classes - Array of AgeClass objects representing all of
    *     the classes of competitors.
    * @param {Array} courses - Array of Course objects representing all of the
    *     courses of the event.
    */ 
    var Event = function (classes, courses) {
        this.classes = classes;
        this.courses = courses;
    };
    
    /**
    * Returns the fastest splits for each class on a given leg.
    *
    * The fastest splits are returned as an array of objects, where each object
    * lists the competitors name, the class, and the split time in seconds.
    *
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Array} Array of objects containing fastest splits for that leg.
    */
    Event.prototype.getFastestSplitsForLeg = function (startCode, endCode) {
        var fastestSplits = [];
        this.courses.forEach(function (course) {
            if (course.usesLeg(startCode, endCode)) {
                fastestSplits = fastestSplits.concat(course.getFastestSplitsForLeg(startCode, endCode));
            }
        });
        
        fastestSplits.sort(function (a, b) { return d3.ascending(a.split, b.split); });
        
        return fastestSplits;
    };
    
    /**
    * Returns a list of competitors that visit the control with the given code
    * within the given time interval.
    *
    * The fastest splits are returned as an array of objects, where each object
    * lists the competitors name, the class, and the split time in seconds.
    *
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Array} Array of objects containing fastest splits for that leg.
    */
    Event.prototype.getCompetitorsAtControlInTimeRange = function (controlCode, intervalStart, intervalEnd) {
        var competitors = [];
        this.courses.forEach(function (course) {
            course.getCompetitorsAtControlInTimeRange(controlCode, intervalStart, intervalEnd).forEach(function (comp) {
                competitors.push(comp);
            });
        });
        
        competitors.sort(function (a, b) { return d3.ascending(a.time, b.time); });
        
        return competitors;
    };
    
    SplitsBrowser.Model.Event = Event;
})();

(function () {
    
    /**
    * Converts a number of seconds into the corresponding number of minutes.
    * This conversion is as simple as dividing by 60.
    * @param {Number} seconds - The number of seconds to convert.
    * @return {Number} The corresponding number of minutes.
    */
    function secondsToMinutes(seconds) { 
        return (seconds === null) ? null : seconds / 60;
    }

    SplitsBrowser.Model.ChartTypes = {
        SplitsGraph: {
            name: "Splits graph",
            dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReference(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabel: "Time loss (min)",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1
        },
        RaceGraph: {
            name: "Race graph",
            dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabel: "Time",
            isRaceGraph: true,
            isResultsTable: false,
            minViewableControl: 0
        },
        PositionAfterLeg: {
            name: "Position after leg",
            dataSelector: function (comp) { return comp.cumRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1
        },
        SplitPosition: {
            name: "Split position",
            dataSelector: function (comp) { return comp.splitRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1
        },
        PercentBehind: {
            name: "Percent behind",
            dataSelector: function (comp, referenceCumTimes) { return comp.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes); },
            skipStart: false,
            yAxisLabel: "Percent behind",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1
        },
        ResultsTable: {
            name: "Results table",
            dataSelector: null,
            skipStart: false,
            yAxisLabel: null,
            isRaceGraph: false,
            isResultsTable: true,
            minViewableControl: 1
        }
    };
})();

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
    var CompetitorSelection = function (count) {
        if (typeof count !== NUMBER_TYPE) {
            throwInvalidData("Competitor count must be a number");
        } else if (count < 0) {
            throwInvalidData("Competitor count must be a non-negative number");
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
    * Given that a single runner is selected, select also all of the runners
    * that 'cross' this runner.
    * @param {Array} competitors - All competitors in the same class.
    */    
    CompetitorSelection.prototype.selectCrossingRunners = function (competitors) {
        if (this.isSingleRunnerSelected()) {
            var refCompetitor = competitors[this.currentIndexes[0]];
            
            competitors.forEach(function (comp, idx) {
                if (comp.crosses(refCompetitor)) {
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
    * @param {function} handler - The handler to register.
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
    * Migrates the selected competitors from one list to another.
    *
    * After the migration, any competitors in the old list that were selected
    * and are also in the new competitors list remain selected.
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
        } else if (newCompetitors.length === 0) {
            throwInvalidData("CompetitorSelection.migrate: newCompetitors list must not be empty"); 
        }
    
        var selectedCompetitors = this.currentIndexes.map(function (index) { return oldCompetitors[index]; });
        
        this.count = newCompetitors.length;
        this.currentIndexes = [];
        newCompetitors.forEach(function (comp, idx) {
            if (selectedCompetitors.indexOf(comp) >= 0) {
                this.currentIndexes.push(idx);
            }
        }, this);
        
        this.fireChangeHandlers();
    };

    SplitsBrowser.Model.CompetitorSelection = CompetitorSelection;
})();


(function () {
    "use strict";
    
    var isTrue = SplitsBrowser.isTrue;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var parseTime = SplitsBrowser.parseTime;
    var Competitor = SplitsBrowser.Model.Competitor;
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;

    /**
    * Parse a row of competitor data.
    * @param {Number} index - Index of the competitor line.
    * @param {string} line - The line of competitor data read from a CSV file.
    * @param {Number} controlCount - The number of controls (not including the finish).
    * @return {Object} Competitor object representing the competitor data read in.
    */
    function parseCompetitors(index, line, controlCount) {
        // Expect forename, surname, club, start time then (controlCount + 1) split times in the form MM:SS.
        var parts = line.split(",");
        if (parts.length === controlCount + 5) {
            var forename = parts.shift();
            var surname = parts.shift();
            var club = parts.shift();
            var startTime = parseTime(parts.shift()) * 60;
            var splitTimes = parts.map(parseTime);
            if (splitTimes.indexOf(0) >= 0) {
                throwInvalidData("Zero split times are not permitted - found one or more zero splits for competitor '" + forename + " " + surname + "'");
            }
            return Competitor.fromSplitTimes(index + 1, forename, surname, club, startTime, splitTimes);
        } else {
            throwInvalidData("Expected " + (controlCount + 5) + " items in row for competitor in class with " + controlCount + " controls, got " + (parts.length) + " instead.");
        }
    }

    /**
    * Parse CSV data for a class.
    * @param {string} class - The string containing data for that class.
    * @return {SplitsBrowser.Model.AgeClass} Parsed class data.
    */
    function parseAgeClass (ageClass) {
        var lines = ageClass.split("\r\n").filter(isTrue);
        if (lines.length === 0) {
            throwInvalidData("parseAgeClass got an empty list of lines");
        }

        var firstLineParts = lines.shift().split(",");
        if (firstLineParts.length === 2) {
            var className = firstLineParts.shift();
            var controlCountStr = firstLineParts.shift();
            var controlCount = parseInt(controlCountStr, 10);
            if (isNaN(controlCount)) {
                throwInvalidData("Could not read control count: '" + controlCountStr + "'");
            } else if (controlCount < 0) {
                throwInvalidData("Expected a positive control count, got " + controlCount + " instead");
            } else {
                var competitors = lines.map(function (line, index) { return parseCompetitors(index, line, controlCount); });
                competitors.sort(compareCompetitors);
                return new AgeClass(className, controlCount, competitors);
            }
        } else {
            throwWrongFileFormat("Expected first line to have two parts (class name and number of controls), got " + firstLineParts.length + " part(s) instead");
        }
    }

    /**
    * Parse CSV data for an entire event.
    * @param {string} eventData - String containing the entire event data.
    * @return {SplitsBrowser.Model.Event} All event data read in.
    */
    function parseEventData (eventData) {
        var classSections = eventData.split("\r\n\r\n").map($.trim).filter(isTrue);
       
        var classes = classSections.map(parseAgeClass);
        
        classes = classes.filter(function (ageClass) { return !ageClass.isEmpty(); });
        
        if (classes.length === 0) {
            throwInvalidData("No competitor data was found");
        }
        
        // Nulls are for the course length, climb and controls, which aren't in
        // the source data files, so we can't do anything about them.
        var courses = classes.map(function (cls) { return new Course(cls.name, [cls], null, null, null); });
        
        for (var i = 0; i < classes.length; i += 1) {
            classes[i].setCourse(courses[i]);
        }
        
        return new Event(classes, courses);
    }
    
    SplitsBrowser.Input.CSV = { parseEventData: parseEventData };
})();


(function () {
    "use strict";
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var formatTime = SplitsBrowser.formatTime;
    var parseTime = SplitsBrowser.parseTime;
    var Competitor = SplitsBrowser.Model.Competitor;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    // Indexes into the columns.
    var COLUMN_INDEXES = {
        SURNAME: 3,
        FORENAME: 4,
        START: 9,
        TIME: 11,
        CLUB: 15,
        AGE_CLASS: 18,
        COURSE: 39,
        DISTANCE: 40,
        CLIMB: 41,
        CONTROL_COUNT: 42,
        PLACING: 43
    };
    
    // Index of the first column of control-specific data.
    var CONTROLS_OFFSET = 46;
    
    /**
    * Checks that two consecutive cumulative times are in strictly ascending
    * order, and throws an exception if not.  The previous time should not be
    * null, but the next time may, and no exception will be thrown in this
    * case.
    * @param {Number} prevTime - The previous cumulative time, in seconds.
    * @param {Number} nextTime - The next cumulative time, in seconds.
    */
    function verifyCumulativeTimesInOrder(prevTime, nextTime) {
        if (nextTime !== null && nextTime <= prevTime) {
            throwInvalidData("Cumulative times must be strictly ascending: read " +
                    formatTime(prevTime) + " and " + formatTime(nextTime) +
                    " in that order");
        }
    }
    
    SplitsBrowser.Input.SI = {};
    
    /**
    * Constructs an SI-format data reader.
    *
    * NOTE: The reader constructed can only be used to read data in once.
    * @constructor
    * @param {String} data - The SI data to read in.
    */
    SplitsBrowser.Input.SI.Reader = function (data) {
        this.data = data;
        
        // Map that associates classes to all of the competitors running on
        // that age class.
        this.ageClasses = d3.map();
        
        // Map that associates course names to length and climb values.
        this.courseDetails = d3.map();
        
        // Set of all pairs of classes and courses.
        // (While it is common that one course may have multiple classes, it
        // seems also that one class can be made up of multiple courses, e.g.
        // M21E at BOC 2013.)
        this.classCoursePairs = [];

        // Whether any competitors have been read in at all.  Blank lines are
        // ignored, as are competitors that have no times at all.
        this.anyCompetitors = false;
    };
    
    var Reader = SplitsBrowser.Input.SI.Reader;

    /**
    * Checks that the data read in contains a header that suggests it is
    * SI-format data.
    */
    Reader.prototype.checkHeader = function() {
        if (this.lines.length <= 1) {
             throwWrongFileFormat("No data found to read");
        }
        
        var headers = this.lines[0].split(";");
        if (headers.length <= 1) {
            throwWrongFileFormat("Data appears not to be in the SI CSV format");
        }
    };
    
    /**
    * Returns the number of controls to expect on the given line.
    * @param {Array} row - Array of row data items.
    * @return {Number} Number of controls read.
    */
    Reader.prototype.getNumControls = function (row) {
        var className = row[COLUMN_INDEXES.AGE_CLASS];
        if (this.ageClasses.has(className)) {
            return this.ageClasses.get(className).numControls;
        } else {
            return parseInt(row[COLUMN_INDEXES.CONTROL_COUNT], 10);
        }    
    };
    
    /**
    * Reads the split times out of a row of competitor data.
    * @param {Array} row - Array of row data items.
    * @param {Number} lineNumber - Line number of the row within the source data.
    * @param {Number} numControls - The number of controls to read.
    */
    Reader.prototype.readCumulativeTimes = function (row, lineNumber, numControls) {
        
        // Check that the row is long enough for all of the control data,
        // given that we now know how many controls it should contain.
        if (row.length <= CONTROLS_OFFSET + 1 + 2 * (numControls - 1)) {
            throwInvalidData("Line " + lineNumber + " reports " + numControls + " controls but there aren't enough data values in the row for this many controls");
        }
        
        var cumTimes = [0];
        var lastCumTime = 0;
        
        for (var controlIdx = 0; controlIdx < numControls; controlIdx += 1) {
            var cumTimeStr = row[CONTROLS_OFFSET + 1 + 2 * controlIdx];
            var cumTime = parseTime(cumTimeStr);
            verifyCumulativeTimesInOrder(lastCumTime, cumTime);
            
            cumTimes.push(cumTime);
            if (cumTime !== null) {
                lastCumTime = cumTime;
            }
        }
        
        var totalTime = parseTime(row[COLUMN_INDEXES.TIME]);
        verifyCumulativeTimesInOrder(lastCumTime, totalTime);
        cumTimes.push(totalTime);
    
        return cumTimes;
    };
    
    /**
    * Checks to see whether the given row contains a new age-class, and if so,
    * creates it.
    * @param {Array} row - Array of row data items.
    * @param {Number} numControls - The number of controls to read.
    */
    Reader.prototype.createAgeClassIfNecessary = function (row, numControls) {
        var className = row[COLUMN_INDEXES.AGE_CLASS];
        if (!this.ageClasses.has(className)) {
            this.ageClasses.set(className, { numControls: numControls, competitors: [] });
        }
    };
    
    /**
    * Checks to see whether the given row contains a new course, and if so,
    * creates it.
    * @param {Array} row - Array of row data items.
    * @param {Number} numControls - The number of controls to read.
    */
    Reader.prototype.createCourseIfNecessary = function (row, numControls) {

        var courseName = row[COLUMN_INDEXES.COURSE];
        if (!this.courseDetails.has(courseName)) {
            var controlNums = d3.range(0, numControls).map(function (controlIdx) { return row[CONTROLS_OFFSET + 2 * controlIdx]; });
            this.courseDetails.set(courseName, {
                length: parseFloat(row[COLUMN_INDEXES.DISTANCE]) || null,
                climb: parseInt(row[COLUMN_INDEXES.CLIMB], 10) || null,
                controls: controlNums
            });
        }
    };

    /**
    * Checks to see whether the given row contains a class-course pairing that
    * we haven't seen so far, and adds one if not.
    * @param {Array} row - Array of row data items.
    */
    Reader.prototype.createClassCoursePairIfNecessary = function (row) {
        var className = row[COLUMN_INDEXES.AGE_CLASS];
        var courseName = row[COLUMN_INDEXES.COURSE];
        
        if (!this.classCoursePairs.some(function (pair) { return pair[0] === className && pair[1] === courseName; })) {
            this.classCoursePairs.push([className, courseName]);
        }
    };
    
    /**
    * Reads in the competitor-specific data from the given row and adds it to
    * the event data read so far.
    * @param {Array} row - Row of items read from a line of the input data.
    * @param {Array} cumTimes - Array of cumulative times for the competitor.
    */
    Reader.prototype.addCompetitor = function (row, cumTimes) {
    
        var className = row[COLUMN_INDEXES.AGE_CLASS];
        
        var forename = row[COLUMN_INDEXES.FORENAME];
        var surname = row[COLUMN_INDEXES.SURNAME];
        var club = row[COLUMN_INDEXES.CLUB];
        var startTime = parseTime(row[COLUMN_INDEXES.START]);
        
        // Some surnames have their placing appended to them, if their placing
        // isn't a number (e.g. mp, n/c).  If so, remove this.
        var placing = row[COLUMN_INDEXES.PLACING];
        var isPlacingNonNumeric = isNaN(parseInt(placing, 10));
        if (isPlacingNonNumeric && surname.substring(surname.length - placing.length) === placing) {
            surname = $.trim(surname.substring(0, surname.length - placing.length));
        }
        
        var order = this.ageClasses.get(className).competitors.length + 1;
        var competitor = Competitor.fromCumTimes(order, forename, surname, club, startTime, cumTimes);
        if (isPlacingNonNumeric && competitor.completed()) {
            // Competitor has completed the course but has no placing.
            // Assume that they are non-competitive.
            competitor.setNonCompetitive();
        }

        this.ageClasses.get(className).competitors.push(competitor);
    };
    
    /**
    * Parses the given line and adds it to the event data accumulated so far.
    * @param {String} line - The line to parse.
    * @param {Number} lineNumber - The number of the line (used in error
    *     messages).
    */
    Reader.prototype.readLine = function (line, lineNumber) {
    
        if ($.trim(line) === "") {
            // Skip this blank line.
            return;
        }
    
        var row = line.split(";");
        
        // Check the row is long enough to have all the data besides the
        // controls data.
        if (row.length < CONTROLS_OFFSET) {
            throwInvalidData("Too few items on line " + lineNumber + " of the input file: expected at least " + CONTROLS_OFFSET + ", got " + row.length);
        }
        
        var numControls = this.getNumControls(row);
        
        var cumTimes = this.readCumulativeTimes(row, lineNumber, numControls);
        if (cumTimes.some(function (time) { return (time !== null && time !== 0); })) {
            // This competitor has at least one cumulative split, so add them.
            this.anyCompetitors = true;
            
            this.createAgeClassIfNecessary(row, numControls);
            this.createCourseIfNecessary(row, numControls);
            this.createClassCoursePairIfNecessary(row);
            
            this.addCompetitor(row, cumTimes);
        }
    };
    
    /**
    * Creates maps that describe the many-to-many join between the class names
    * and course names. 
    * @return {Object} Object that contains two maps describing the
    *     many-to-many join.
    */    
    Reader.prototype.getMapsBetweenClassesAndCourses = function () {
        
        var classesToCourses = d3.map();
        var coursesToClasses = d3.map();
        
        this.classCoursePairs.forEach(function (pair) {
            var className = pair[0];
            var courseName = pair[1];
            
            if (classesToCourses.has(className)) {
                classesToCourses.get(className).push(courseName);
            } else {
                classesToCourses.set(className, [courseName]);
            }
            
            if (coursesToClasses.has(courseName)) {
                coursesToClasses.get(courseName).push(className);
            } else {
                coursesToClasses.set(courseName, [className]);
            }
        });
        
        return {classesToCourses: classesToCourses, coursesToClasses: coursesToClasses};
    };
    
    /**
    * Creates and return a list of AgeClass objects from all of the data read.
    * @return {Array} Array of AgeClass objects.
    */
    Reader.prototype.createAgeClasses = function () {
        var classNames = this.ageClasses.keys();
        classNames.sort();
        return classNames.map(function (className) {
            var ageClass = this.ageClasses.get(className);
            return new AgeClass(className, ageClass.numControls, ageClass.competitors);
        }, this);
    };
    
    /**
    * Find all of the courses and classes that are related to the given course.
    *
    * It's not always as simple as one course having multiple classes, as there
    * can be multiple courses for one single class, and even multiple courses
    * among multiple classes (e.g. M20E, M18E on courses 3, 3B at BOC 2013.)
    * Essentially, we have a many-to-many join, and we want to pull out of that
    * all of the classes and courses linked to the one course with the given
    * name.
    * 
    * (For the graph theorists among you, imagine the bipartite graph with
    * classes on one side and courses on the other.  We want to find the
    * connected subgraph that this course belongs to.)
    *
    * @param {String} initCourseName - The name of the initial course.
    * @param {Object} manyToManyMaps - Object that contains the two maps that
    *     map between class names and course names.
    * @param {d3.set} doneCourseNames - Set of all course names that have been
    *     'done', i.e. included in a Course object that has been returned from
    *     a call to this method.
    * @param {d3.map} classesMap - Map that maps age-class names to AgeClass
    *     objects.
    * @return {SplitsBrowser.Model.Course} - The created Course object.
    */
    Reader.prototype.createCourseFromLinkedClassesAndCourses = function (initCourseName, manyToManyMaps, doneCourseNames, classesMap) {

        var courseNamesToDo = [initCourseName];
        var classNamesToDo = [];
        var relatedCourseNames = [];
        var relatedClassNames = [];
        
        var courseName;
        var className;
        
        while (courseNamesToDo.length > 0 || classNamesToDo.length > 0) {
            while (courseNamesToDo.length > 0) {
                courseName = courseNamesToDo.shift();
                var classNames = manyToManyMaps.coursesToClasses.get(courseName);
                for (var clsIdx = 0; clsIdx < classNames.length; clsIdx += 1) {
                    className = classNames[clsIdx];
                    if (classNamesToDo.indexOf(className) < 0 && relatedClassNames.indexOf(className) < 0) {
                        classNamesToDo.push(className);
                    }
                }
                
                relatedCourseNames.push(courseName);
            }
            
            while (classNamesToDo.length > 0) {
                className = classNamesToDo.shift();
                var courseNames = manyToManyMaps.classesToCourses.get(className);
                for (var crsIdx = 0; crsIdx < courseNames.length; crsIdx += 1) {
                    courseName = courseNames[crsIdx];
                    if (courseNamesToDo.indexOf(courseName) < 0 && relatedCourseNames.indexOf(courseName) < 0) {
                        courseNamesToDo.push(courseName);
                    }
                }
                
                relatedClassNames.push(className);
            }
        }
        
        // Mark all of the courses that we handled here as done.
        relatedCourseNames.forEach(function (courseName) {
            doneCourseNames.add(courseName);
        });
        
        var courseClasses = relatedClassNames.map(function (className) { return classesMap.get(className); });
        var details = this.courseDetails.get(initCourseName);
        var course = new Course(initCourseName, courseClasses, details.length, details.climb, details.controls);
        
        courseClasses.forEach(function (ageClass) {
            ageClass.setCourse(course);
        });
        
        return course;
    };
    
    /**
    * Sort through the data read in and create Course objects representing each
    * course in the event.
    * @param {Array} classes - Array of AgeClass objects read.
    * @return {Array} Array of course objects.
    */
    Reader.prototype.determineCourses = function (classes) {
        
        var manyToManyMaps = this.getMapsBetweenClassesAndCourses();
        
        // As we work our way through the courses and classes, we may find one
        // class made up from multiple courses (e.g. in BOC2013, class M21E
        // uses course 1A and 1B).  In this set we collect up all of the
        // courses that we have now processed, so that if we later come across
        // one we've already dealt with, we can ignore it.
        var doneCourseNames = d3.set();
        
        var classesMap = d3.map();
        classes.forEach(function (ageClass) {
            classesMap.set(ageClass.name, ageClass);
        });
        
        // List of all Course objects created so far.
        var courses = [];
        manyToManyMaps.coursesToClasses.keys().forEach(function (courseName) {
            if (!doneCourseNames.has(courseName)) {
                var course = this.createCourseFromLinkedClassesAndCourses(courseName, manyToManyMaps, doneCourseNames, classesMap);
                courses.push(course);
            }
        }, this);
        
        return courses;
    };
    
    /**
    * Parses the read-in data and returns it.
    * @return {SplitsBrowser.Model.Event} Event-data read.
    */
    Reader.prototype.parseEventData = function () {
        
        this.lines = this.data.split(/\r?\n/);
        
        this.checkHeader();
        
        // Discard the header row.
        this.lines.shift();
        
        this.lines.forEach(function (line, lineIndex) {
            this.readLine(line, lineIndex + 1);
        }, this);
        
        if (!this.anyCompetitors) {
            throwInvalidData("No competitors' data were found");
        }
        
        var classes = this.createAgeClasses();
        var courses = this.determineCourses(classes);
        return new Event(classes, courses);
    };
    
    /**
    * Parse 'SI' data read from a semicolon-separated data string.
    * @param {String} data - The input data string read.
    * @return {SplitsBrowser.Model.Event} All event data read.
    */
    SplitsBrowser.Input.SI.parseEventData = function (data) {
        var reader = new Reader(data);
        return reader.parseEventData();
    };
})();

(function () {
    "use strict";
    
    // All the parsers for parsing event data that are known about.
    var PARSERS = [
        SplitsBrowser.Input.CSV.parseEventData,
        SplitsBrowser.Input.SI.parseEventData
   ];
    
    /**
    * Attempts to parse the given event data, which may be of any of the
    * supported formats, or may be invalid.  This function returns the results
    * as an array of SplitsBrowser.Model.AgeClass objects, or null in the event
    * of failure.
    * @param {String} data - The data read.
    * @return {Event} Event data read in, or null for failure.
    */ 
    SplitsBrowser.Input.parseEventData = function (data) {
        for (var i = 0; i < PARSERS.length; i += 1) {
            var parser = PARSERS[i];
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

(function (){
    "use strict";

    // ID of the competitor list div.
    // Must match that used in styles.css.
    var COMPETITOR_LIST_ID = "competitorList";

    /**
    * Object that controls a list of competitors from which the user can select.
    * @constructor
    * @param {HTMLElement} parent - Parent element to add this listbox to.
    */
    var CompetitorListBox = function (parent) {
        this.parent = parent;
        this.handler = null;
        this.competitorSelection = null;
        this.isEnabled = true;

        this.listDiv = d3.select(parent).append("div")
                                        .attr("id", COMPETITOR_LIST_ID);
    };
    
    /**
    * Sets whether this competitor list-box is enabled.
    * @param {boolean} isEnabled - Whether this list-box is enabled.
    */
    CompetitorListBox.prototype.setEnabled = function (isEnabled) {
        this.isEnabled = isEnabled;
        this.listDiv.selectAll("div.competitor").classed("disabled", !isEnabled);
    };

    /**
    * Returns the width of the listbox, in pixels.
    * @returns {Number} Width of the listbox.
    */
    CompetitorListBox.prototype.width = function () {
        return $(this.listDiv.node()).width();
    };

    /**
    * Handles a change to the selection of competitors, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    */
    CompetitorListBox.prototype.selectionChanged = function () {
        var outerThis = this;
        this.listDiv.selectAll("div.competitor")
                    .data(d3.range(this.competitorSelection.count))
                    .classed("selected", function (comp, index) { return outerThis.competitorSelection.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a competitor.
    */
    CompetitorListBox.prototype.toggleCompetitor = function (index) {
        if (this.isEnabled) {
            this.competitorSelection.toggle(index);
        }
    };

    /**
    * Sets the list of competitors.
    * @param {Array} competitors - Array of competitor data.
    * @param {boolean} hasMultipleClasses - Whether the list of competitors is
    *      made up from those in multiple classes.
    */
    CompetitorListBox.prototype.setCompetitorList = function (competitors, multipleClasses) {
        // Note that we use jQuery's click event handling here instead of d3's,
        // as d3's doesn't seem to work in PhantomJS.
        $("div.competitor").off("click");
        
        var competitorDivs = this.listDiv.selectAll("div.competitor").data(competitors);

        competitorDivs.enter().append("div")
                              .classed("competitor", true);

        competitorDivs.selectAll("span").remove();
        
        if (multipleClasses) {
            competitorDivs.append("span")
                          .classed("competitorClassLabel", true)
                          .text(function (comp) { return comp.className; });
        }
        
        competitorDivs.append("span")
                      .classed("nonfinisher", function (comp) { return !comp.completed(); })
                      .text(function (comp) { return (comp.completed()) ? comp.name : "* " + comp.name; });        

        competitorDivs.exit().remove();
        
        var outerThis = this;
        $("div.competitor").each(function (index, div) {
            $(div).on("click", function () { outerThis.toggleCompetitor(index); });
        });
    };

    /**
    * Sets the competitor selection object.
    * @param {SplitsBrowser.Controls.CompetitorSelection} selection - Competitor selection.
    */
    CompetitorListBox.prototype.setSelection = function (selection) {
        if (this.competitorSelection !== null) {
            this.competitorSelection.deregisterChangeHandler(this.handler);
        }

        var outerThis = this;
        this.competitorSelection = selection;
        this.handler = function (indexes) { outerThis.selectionChanged(indexes); };
        this.competitorSelection.registerChangeHandler(this.handler);
        this.selectionChanged(d3.range(selection.count));
    };
    
    SplitsBrowser.Controls.CompetitorListBox = CompetitorListBox;
})();


(function (){
    "use strict";
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
    * A control that wraps a drop-down list used to choose between classes.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    var ClassSelector = function(parent) {
        this.changeHandlers = [];
        this.otherClassesEnabled = true;
        
        var span = d3.select(parent).append("span");
        span.text("Class: ");
        var outerThis = this;
        this.dropDown = span.append("select").node();
        $(this.dropDown).bind("change", function() {
            outerThis.updateOtherClasses();
            outerThis.onSelectionChanged();
        });
        
        this.otherClassesCombiningLabel = span.append("span")
                                              .classed("otherClassCombining", true)
                                              .style("display", "none")
                                              .text("and");
        
        this.otherClassesSelector = span.append("div")
                                   .classed("otherClassSelector", true)
                                   .style("display", "none");
                                   
        this.otherClassesSpan = this.otherClassesSelector.append("span");
        
        this.otherClassesList = d3.select(parent).append("div")
                                                .classed("otherClassList", true)
                                                .style("position", "absolute")
                                                .style("display", "none");
                                   
        this.otherClassesSelector.on("click", function () { outerThis.showHideClassSelector(); });
         
        this.setClasses([]);
        
        // Indexes of the selected 'other classes'.
        this.selectedOtherClassIndexes = d3.set();
        
        // Ensure that a click outside of the drop-down list or the selector
        // box closes it.
        // Taken from http://stackoverflow.com/questions/1403615 and adjusted.
        $(document).click(function (e) {
            var listDiv = outerThis.otherClassesList.node();
            if (listDiv.style.display !== "none") {
                var container = $("div.otherClassList,div.otherClassSelector");
                if (!container.is(e.target) && container.has(e.target).length === 0) { 
                    listDiv.style.display = "none";
                }
            }
        });
        
        // Close the class selector if Escape is pressed.
        // 27 is the key code for the Escape key.
        $(document).keydown(function (e) {
            if (e.which === 27) {
                outerThis.otherClassesList.style("display", "none");
            }
        });
    };

    /**
    * Sets whether the other-classes selector is enabled, if it is shown at
    * all.
    * @param {boolean} otherClassesEnabled - true to enable the selector, false
    *      to disable it.
    */
    ClassSelector.prototype.setOtherClassesEnabled = function (otherClassesEnabled) {
        this.otherClassesCombiningLabel.classed("disabled", !otherClassesEnabled);
        this.otherClassesSelector.classed("disabled", !otherClassesEnabled);
        this.otherClassesEnabled = otherClassesEnabled;
    };

    /**
    * Sets the list of classes that this selector can choose between.
    * 
    * If there are no classes, a 'dummy' entry is added
    * @param {Array} classes - Array of AgeClass objects containing class data.
    */
    ClassSelector.prototype.setClasses = function(classes) {
        if ($.isArray(classes)) {
            this.classes = classes;
            var options;
            if (classes.length === 0) {
                this.dropDown.disabled = true;
                options = ["[No classes loaded]"];
            } else {
                this.dropDown.disabled = false;
                options = classes.map(function(ageClass) { return ageClass.name; });
            }
            
            var optionsList = d3.select(this.dropDown).selectAll("option").data(options);
            optionsList.enter().append("option");
            
            optionsList.attr("value", function(_value, index) { return index.toString(); })
                       .text(function(value) { return value; });
                       
            optionsList.exit().remove();
      
            this.updateOtherClasses();
        } else {
            throwInvalidData("ClassSelector.setClasses: classes is not an array");
        }
    };

    /**
    * Add a change handler to be called whenever the selected class or classes
    * is changed.
    *
    * An array containing the indexes of the newly-selected classes is passed to
    * each handler function.  This array is guaranteed to be non-empty.  The
    * first index in the array is the 'primary' class.
    *
    * @param {Function} handler - Handler function to be called whenever the class
    *                   changes.
    */
    ClassSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    ClassSelector.prototype.onSelectionChanged = function() {
        var indexes = [this.dropDown.selectedIndex];
        this.selectedOtherClassIndexes.forEach(function (index) { indexes.push(parseInt(index, 10)); });
        this.changeHandlers.forEach(function(handler) { handler(indexes); });
    };
    
    /**
    * Updates the text in the other-class box at the top.
    *
    * This text contains either a list of the selected classes, or placeholder
    * text if none are selected.
    */ 
    ClassSelector.prototype.updateOtherClassText = function () {
        var classIdxs = this.selectedOtherClassIndexes.values();
        classIdxs.sort(d3.ascending);
        var text;
        if (classIdxs.length === 0) {
            text = "<select>";
        } else {
            text = classIdxs.map(function (classIdx) { return this.classes[classIdx].name; }, this)
                            .join(", ");
        }
        
        this.otherClassesSpan.text(text);
    };
    
    /**
    * Updates the other-classes selector div following a change of selected
    * 'main' class.
    */
    ClassSelector.prototype.updateOtherClasses = function () {
        this.otherClassesList.style("display", "none");
        this.selectedOtherClassIndexes = d3.set();
        this.updateOtherClassText();
            
        $("div.otherClassItem").off("click");
            
        var outerThis = this;
        var otherClasses;
        if (this.classes.length > 0) {
            var newClass = this.classes[this.dropDown.selectedIndex];
            otherClasses = newClass.course.getOtherClasses(newClass);
        } else {
            otherClasses = [];
        }
        
        var otherClassIndexes = otherClasses.map(function (cls) { return this.classes.indexOf(cls); }, this);
        
        var otherClassesSelection = this.otherClassesList.selectAll("div")
                                                         .data(otherClassIndexes);
        
        otherClassesSelection.enter().append("div")
                                     .classed("otherClassItem", true);
        
        otherClassesSelection.attr("id", function (classIdx) { return "ageClassIdx_" + classIdx; })
                             .classed("selected", false)
                             .text(function (classIdx) { return outerThis.classes[classIdx].name; });
                             
        otherClassesSelection.exit().remove();
        
        if (otherClassIndexes.length > 0) {
            this.otherClassesSelector.style("display", "inline-block");
            this.otherClassesCombiningLabel.style("display", "");
        } else {
            this.otherClassesSelector.style("display", "none");
            this.otherClassesCombiningLabel.style("display", "none");
        }
        
        var offset = $(this.otherClassesSelector.node()).offset();
        var height = $(this.otherClassesSelector.node()).outerHeight();
        this.otherClassesList.style("left", offset.left + "px")
                            .style("top", offset.top + height + "px");
                            
        $("div.otherClassItem").each(function (index, div) {
            $(div).on("click", function () { outerThis.toggleOtherClass(otherClassIndexes[index]); });
        });
    };
    
    /**
    * Shows or hides the other-class selector, if it is enabled.
    */
    ClassSelector.prototype.showHideClassSelector = function () {
        if (this.otherClassesEnabled) {
            this.otherClassesList.style("display", (this.otherClassesList.style("display") === "none") ? "" : "none");
        }
    };
    
    /**
    * Toggles the selection of an other class.
    * @param {Number} classIdx - Index of the class among the list of all classes.
    */
    ClassSelector.prototype.toggleOtherClass = function (classIdx) {
        if (this.selectedOtherClassIndexes.has(classIdx)) {
            this.selectedOtherClassIndexes.remove(classIdx);
        } else {
            this.selectedOtherClassIndexes.add(classIdx);
        }
        
        d3.select("div#ageClassIdx_" + classIdx).classed("selected", this.selectedOtherClassIndexes.has(classIdx));
        this.updateOtherClassText();
        this.onSelectionChanged();
    };
    
    SplitsBrowser.Controls.ClassSelector = ClassSelector;
})();


(function (){
    "use strict";
    
    var ALL_COMPARISON_OPTIONS = [
        { name: "Winner", selector: function (ageClassSet) { return ageClassSet.getWinnerCumTimes(); }, requiresWinner: true },
        { name: "Fastest time", selector: function (ageClassSet) { return ageClassSet.getFastestCumTimes(); }, requiresWinner: false }
    ];
    
    // All 'Fastest time + N %' values (not including zero).
    var FASTEST_PLUS_PERCENTAGES = [5, 25, 50, 100];
    
    FASTEST_PLUS_PERCENTAGES.forEach(function (percent) {
        ALL_COMPARISON_OPTIONS.push({
            name: "Fastest time + " + percent + "%",
            selector: function (ageClassSet) { return ageClassSet.getFastestCumTimesPlusPercentage(percent); },
            requiresWinner: false
        });
    });
    
    ALL_COMPARISON_OPTIONS.push({ name: "Any runner...", requiresWinner: true });
    
    // Default selected index of the comparison function.
    var DEFAULT_COMPARISON_INDEX = 1; // 1 = fastest time.
    
    // The id of the comparison selector.
    var COMPARISON_SELECTOR_ID = "comparisonSelector";
    
    // The id of the runner selector
    var RUNNER_SELECTOR_ID = "runnerSelector";

    /**
    * A control that wraps a drop-down list used to choose what to compare
    * times against.
    * @param {HTMLElement} parent - The parent element to add the control to.
    * @param {Function} alerter - Function to call with any messages to show to
    *     the user.
    */
    var ComparisonSelector = function (parent, alerter) {
        this.changeHandlers = [];
        this.classes = null;
        this.currentRunnerIndex = null;
        this.previousCompetitorList = null;
        this.parent = parent;
        this.alerter = alerter;
        this.hasWinner = false;
        this.previousSelectedIndex = -1;
        
        var span = d3.select(parent).append("span");
        
        span.append("span")
            .classed("comparisonSelectorLabel", true)
            .text("Compare with ");

        var outerThis = this;
        this.dropDown = span.append("select")
                            .attr("id", COMPARISON_SELECTOR_ID)
                            .node();
                            
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        var optionsList = d3.select(this.dropDown).selectAll("option")
                                                  .data(ALL_COMPARISON_OPTIONS);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_opt, index) { return index.toString(); })
                   .text(function (opt) { return opt.name; });
                   
        optionsList.exit().remove();
        
        this.runnerSpan = d3.select(parent).append("span")
                                           .style("display", "none")
                                           .style("padding-left", "20px");
        
        this.runnerSpan.append("span")
                       .classed("comparisonSelectorLabel", true)
                       .text("Runner: ");
        
        this.runnerDropDown = this.runnerSpan.append("select")
                                             .attr("id", RUNNER_SELECTOR_ID)
                                             .node();
        $(this.runnerDropDown).bind("change", function () { outerThis.onSelectionChanged(); });
        
        this.dropDown.selectedIndex = DEFAULT_COMPARISON_INDEX;
        this.previousSelectedIndex = DEFAULT_COMPARISON_INDEX;
    };

    /**
    * Add a change handler to be called whenever the selected class is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler - Handler function to be called whenever the class
    *                   changes.
    */
    ComparisonSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns whether the 'Any Runner...' option is selected.
    * @return Whether the 'Any Runner...' option is selected.
    */
    ComparisonSelector.prototype.isAnyRunnerSelected = function () {
        return this.dropDown.selectedIndex === ALL_COMPARISON_OPTIONS.length - 1;
    };
    
    /**
    * Sets the list of classes.
    * @param {Array} classes - Array of AgeClass objects.
    */
    ComparisonSelector.prototype.setAgeClassSet = function (ageClassSet) {
        this.ageClassSet = ageClassSet;
        this.setRunners();
    };

    /**
    * Populates the drop-down list of runners from an age-class set.
    * @param {SplitsBrowser.Model.AgeClassSet} ageClassSet - Age-class set
    *     containing all of the runners to populate the list from.
    */
    ComparisonSelector.prototype.setRunners = function () {
        var competitors = this.ageClassSet.allCompetitors;
        var completingCompetitorIndexes = d3.range(competitors.length).filter(function (idx) { return competitors[idx].completed(); });
        var completingCompetitors = competitors.filter(function (comp) { return comp.completed(); });
        
        this.hasWinner = (completingCompetitors.length > 0);
        
        var optionsList = d3.select(this.runnerDropDown).selectAll("option")
                                                        .data(completingCompetitors);
        
        optionsList.enter().append("option");
        optionsList.attr("value", function (_comp, complCompIndex) { return completingCompetitorIndexes[complCompIndex].toString(); })
                   .text(function (comp) { return comp.name; });
        optionsList.exit().remove();

        if (this.previousCompetitorList === null) {
            this.currentRunnerIndex = 0;
        } else {
            var oldSelectedRunner = this.previousCompetitorList[this.currentRunnerIndex];
            var newIndex = this.ageClassSet.allCompetitors.indexOf(oldSelectedRunner);
            this.currentRunnerIndex = Math.max(newIndex, 0);
        }
        
        this.runnerDropDown.selectedIndex = this.currentRunnerIndex;
       
        this.previousCompetitorList = this.ageClassSet.allCompetitors;
    };
    
    /**
    * Sets whether the control is enabled.
    * @param {boolean} isEnabled - True if the control is enabled, false if
    *      disabled.
    */
    ComparisonSelector.prototype.setEnabled = function (isEnabled) {
        d3.select(this.parent).selectAll("span.comparisonSelectorLabel")
                              .classed("disabled", !isEnabled);
                              
        this.dropDown.disabled = !isEnabled;
        this.runnerDropDown.disabled = !isEnabled;
    };
    
    /**
    * Returns the function that compares a competitor's splits against some
    * reference data.
    * @return {Function} Comparison function.
    */
    ComparisonSelector.prototype.getComparisonFunction = function () {
        if (this.isAnyRunnerSelected()) {
            var outerThis = this;
            return function (ageClassSet) { return ageClassSet.allCompetitors[outerThis.currentRunnerIndex].getAllCumulativeTimes(); };
        } else {
            return ALL_COMPARISON_OPTIONS[this.dropDown.selectedIndex].selector;
        }
    };
    
    /**
    * Handle a change of the selected option in either drop-down list.
    */
    ComparisonSelector.prototype.onSelectionChanged = function() {
        var runnerDropdownSelectedIndex = Math.max(this.runnerDropDown.selectedIndex, 0);
        var option = ALL_COMPARISON_OPTIONS[this.dropDown.selectedIndex];
        if (!this.hasWinner && option.requiresWinner) {
            // No winner on this course means you can't select this option.
            this.alerter("Cannot compare against '" + option.name + "' because no competitors in this class complete the course.");
            this.dropDown.selectedIndex = this.previousSelectedIndex;
        } else {
            this.runnerSpan.style("display", (this.isAnyRunnerSelected()) ? "" : "none");
            this.currentRunnerIndex = (this.runnerDropDown.options.length === 0) ? 0 : parseInt(this.runnerDropDown.options[runnerDropdownSelectedIndex].value, 10);
            this.previousSelectedIndex = this.dropDown.selectedIndex;
            this.changeHandlers.forEach(function (handler) { handler(this.getComparisonFunction()); }, this);
        }
    };
    
    SplitsBrowser.Controls.ComparisonSelector = ComparisonSelector;
})();


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
    var StatisticsSelector = function (parent) {
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
                  .classed("statisticsSelectorLabel", true)
                  .text(function(name) { return name; });
        
        var outerThis = this;
        $("input", this.span.node()).bind("change", function () { return outerThis.onCheckboxChanged(); });
                   
        this.handlers = [];
    };

    /**
    * Sets whether the statistics selector controls are enabled.
    * @param {boolean} isEnabled - True if the controls are to be enabled,
    *      false if the controls are to be disabled.
    */
    StatisticsSelector.prototype.setEnabled = function (isEnabled) {
        this.span.selectAll("label.statisticsSelectorLabel")
                 .classed("disabled", !isEnabled);
        this.span.selectAll("input")
                 .attr("disabled", (isEnabled) ? null : "disabled");
    };
    
    /**
    * Register a change handler to be called whenever the choice of currently-
    * visible statistics is changed.
    *
    * If the handler was already registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    StatisticsSelector.prototype.registerChangeHandler = function (handler) {
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
    StatisticsSelector.prototype.deregisterChangeHandler = function (handler) {
        var index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    };

    /**
    * Return the statistics that are currently enabled.
    * @returns {Array} Array of booleans corresponding to enabled statistics.
    */
    StatisticsSelector.prototype.getVisibleStatistics = function () {
        return this.span.selectAll("input")[0].map(function (checkbox) { return checkbox.checked; });
    };

    /**
    * Handles the change in state of a checkbox, by firing all of the handlers.
    */
    StatisticsSelector.prototype.onCheckboxChanged = function () {
        var checkedFlags = this.getVisibleStatistics();
        this.handlers.forEach(function (handler) { handler(checkedFlags); });
    };
    
    SplitsBrowser.Controls.StatisticsSelector = StatisticsSelector;
})();


(function (){
    "use strict";
    
    /**
    * A control that wraps a drop-down list used to choose the types of chart to view.
    * @param {HTMLElement} parent - The parent element to add the control to.
    * @param {Array} chartTypes - Array of types of chart to list.
    */
    var ChartTypeSelector = function (parent, chartTypes) {
        this.changeHandlers = [];
        this.chartTypes = chartTypes;
        
        var span = d3.select(parent).append("span");
        span.text("View: ");
        var outerThis = this;
        this.dropDown = span.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        var optionsList = d3.select(this.dropDown).selectAll("option").data(chartTypes);
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
    ChartTypeSelector.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns the currently-selected chart type.
    * @return {Array} The currently-selected chart type.
    */
    ChartTypeSelector.prototype.getChartType = function () {
        return this.chartTypes[Math.max(this.dropDown.selectedIndex, 0)];
    };
    
    /**
    * Handle a change of the selected option in the drop-down list.
    */
    ChartTypeSelector.prototype.onSelectionChanged = function () {
        this.changeHandlers.forEach(function(handler) { handler(this.chartTypes[this.dropDown.selectedIndex]); }, this);
    };
    
    SplitsBrowser.Controls.ChartTypeSelector = ChartTypeSelector;
})();


(function () {
    "use strict";
    
    var formatTime = SplitsBrowser.formatTime;
    
    /**
    * Creates a ChartPopup control.
    * @constructor
    * @param {HTMLElement} Parent HTML element.
    * @param {Object} handlers - Object that maps mouse event names to handlers.
    */
    var ChartPopup = function (parent, handlers) {

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
    ChartPopup.prototype.isShown = function () {
        return this.shown;
    };
    
    /**
    * Returns whether the mouse is currently over the popup.
    * @return {boolean} True if the mouse is over the popup, false otherwise.
    */
    ChartPopup.prototype.isMouseIn = function () {
        return this.mouseIn;
    };
    
    /**
    * Populates the chart popup with data.
    *
    * 'competitorData' should be an object that contains a 'title', a 'data'
    * and a 'placeholder' property.  The 'title' is a string used as the
    * popup's title.  The 'data' property is an array where each element should
    * be an object that contains the following properties:
    * * time - A time associated with a competitor.  This may be a split time,
    *   cumulative time or the time of day.
    * * className (Optional) - Name of the competitor's class.
    * * name - The name of the competitor.
    * * highlight - A boolean value which indicates whether to highlight the
    *   competitor.
    * The 'placeholder' property is a placeholder string to show if there is no
    * 'data' array is empty.  It can be null to show no such message.
    * @param {Object} competitorData - Array of data to show.
    * @param {boolean} includeClassNames - Whether to include class names.
    */
    ChartPopup.prototype.setData = function (competitorData, includeClassNames) {
        this.popupDivHeader.text(competitorData.title);
        
        var rows = this.popupDivTable.selectAll("tr")
                                     .data(competitorData.data);
                                     
        rows.enter().append("tr");
        
        rows.classed("highlighted", function (row) { return row.highlight; });
        
        rows.selectAll("td").remove();
        rows.append("td").text(function (row) { return formatTime(row.time); });
        if (includeClassNames) {
            rows.append("td").text(function (row) { return row.className; });
        }
        rows.append("td").text(function (row) { return row.name; });
        
        rows.exit().remove();
        
        if (competitorData.data.length === 0 && competitorData.placeholder !== null) {
            this.popupDivTable.append("tr")
                              .append("td")
                              .text(competitorData.placeholder);
        }
    };
    
    /**
    * Adjusts the location of the chart popup.
    *
    * The location object should contain "x" and "y" properties.  The two
    * coordinates are in units of pixels from top-left corner of the viewport.
    *
    * @param {Object} location - The location of the chart popup.
    */
    ChartPopup.prototype.setLocation = function (location) {
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
    ChartPopup.prototype.show = function (location) {
        this.popupDiv.style("display", "");
        this.shown = true;
        this.setLocation(location);
    };
    
    /**
    * Hides the chart popup.
    */
    ChartPopup.prototype.hide = function () {
        this.popupDiv.style("display", "none");
        this.shown = false;
    };
    
    /**
    * Returns the height of the popup, in units of pixels.
    * @return {Number} Height of the popup, in pixels.
    */
    ChartPopup.prototype.height = function () {
        return $(this.popupDiv.node()).height();
    };
    
    SplitsBrowser.Controls.ChartPopup = ChartPopup;    
})();

(function (){
    "use strict";

    // ID of the hidden text-size element.
    // Must match that used in styles.css.
    var TEXT_SIZE_ELEMENT_ID = "sb-text-size-element";
    
    // ID of the chart.
    // Must match that used in styles.css
    var CHART_SVG_ID = "chart";
    
    // X-offset in pixels between the mouse and the popup that opens.
    var CHART_POPUP_X_OFFSET = 10;
    
    // The maximum number of fastest splits to show when the popup is open.
    var MAX_FASTEST_SPLITS = 10;
    
    // Margins on the four sides of the chart.
    var MARGIN = {
        top: 18, // Needs to be high enough not to obscure the upper X-axis.
        right: 0,
        bottom: 18, // Needs to be high enough not to obscure the lower X-axis.
        left: 53 // Needs to be wide enough for times on the race graph.
    };

    var LEGEND_LINE_WIDTH = 10;
    
    // Minimum distance between a Y-axis tick label and a competitor's start
    // time, in pixels.
    var MIN_COMPETITOR_TICK_MARK_DISTANCE = 10;

    // Width of the time interval, in seconds, when viewing nearby competitors
    // at a control on the race graph.
    var RACE_GRAPH_COMPETITOR_WINDOW = 240;
    
    // The number that identifies the left mouse button in a jQuery event.
    var JQUERY_EVENT_LEFT_BUTTON = 1;
    
    // The number that identifies the right mouse button in a jQuery event.
    var JQUERY_EVENT_RIGHT_BUTTON = 3;

    var SPACER = "\xa0\xa0\xa0\xa0";

    var colours = [
        "#FF0000", "#4444FF", "#00FF00", "#000000", "#CC0066", "#000099",
        "#FFCC00", "#884400", "#9900FF", "#CCCC00", "#888800", "#CC6699",
        "#00DD00", "#3399FF", "#BB00BB", "#00DDDD", "#FF00FF", "#0088BB",
        "#888888", "#FF99FF", "#55BB33"
    ];

    // 'Imports'.
    var START = SplitsBrowser.Model.Course.START;
    var FINISH = SplitsBrowser.Model.Course.FINISH;
    
    var isNotNull = SplitsBrowser.isNotNull;
    var formatTime = SplitsBrowser.formatTime;
    
    var ChartPopup = SplitsBrowser.Controls.ChartPopup;
    
    /**
    * Format a time and a rank as a string, with the split time in mm:ss or h:mm:ss
    * as appropriate.
    * @param {Number|null} time - The time, in seconds, or null.
    * @param {Number|null} rank - The rank, or null.
    * @returns Time and rank formatted as a string.
    */
    function formatTimeAndRank(time, rank) {
        return SPACER + formatTime(time) + " (" + ((rank === null) ? "-" : rank) + ")";
    }
    
    /**
    * Formats and returns a competitor's name and optional suffix.
    * @param {String} name - The name of the competitor.
    * @param {String} suffix - The optional suffix of the competitor (may be an
    *      empty string to indicate no suffix).
    * @return Competitor name and suffix, formatted.
    */
    function formatNameAndSuffix(name, suffix) {
        return (suffix === "") ? name : name + " (" + suffix + ")";
    }

    /**
    * A chart object in a window.
    * @constructor
    * @param {HTMLElement} parent - The parent object to create the element within.
    */
    var Chart = function (parent) {
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
        this.isPopupOpen = false;
        this.popupUpdateFunc = null;
        this.maxStartTimeLabelWidth = 0;
        this.warningPanel = null;
        
        this.mouseOutTimeout = null;
        
        // Indexes of the currently-selected competitors, in the order that
        // they appear in the list of labels.
        this.selectedIndexesOrderedByLastYValue = [];
        this.referenceCumTimes = [];
        this.fastestCumTimes = [];
        
        this.isMouseIn = false;
        
        // The position the mouse cursor is currently over, or null for not over
        // the charts.
        this.currentControlIndex = null;
        
        this.controlLine = null;

        this.svg = d3.select(this.parent).append("svg")
                                         .attr("id", CHART_SVG_ID);

        this.svgGroup = this.svg.append("g");
        this.setLeftMargin(MARGIN.left);

        var outerThis = this;
        var mousemoveHandler = function (event) { outerThis.onMouseMove(event); };
        var mouseupHandler = function (event) { outerThis.onMouseUp(event); };
        var mousedownHandler = function (event) { outerThis.onMouseDown(event); };
        $(this.svg.node()).mouseenter(function (event) { outerThis.onMouseEnter(event); })
                          .mousemove(mousemoveHandler)
                          .mouseleave(function (event) { outerThis.onMouseLeave(event); })
                          .mousedown(mousedownHandler)
                          .mouseup(mouseupHandler);
                          
        // Disable the context menu on the chart, so that it doesn't open when
        // showing the right-click popup.
        $(this.svg.node()).contextmenu(function(e) { e.preventDefault(); });

        // Add an invisible text element used for determining text size.
        this.textSizeElement = this.svg.append("text").attr("fill", "transparent")
                                                      .attr("id", TEXT_SIZE_ELEMENT_ID);
        
        var handlers = {"mousemove": mousemoveHandler, "mousedown": mousedownHandler, "mouseup": mouseupHandler};
        this.popup = new ChartPopup(parent, handlers);
    };
    
    /**
    * Hides the chart.
    */
    Chart.prototype.hide = function () {
        this.svg.style("position", "absolute")
                .style("left", "-9999px");
        
    };
    
    /**
    * Shows the chart, after it has been hidden.
    */
    Chart.prototype.show = function () {
        this.svg.style("position", "static")
                .style("left", null);
    };
    
    /**
    * Sets the left margin of the chart.
    * @param {Number} leftMargin - The left margin of the chart.
    */
    Chart.prototype.setLeftMargin = function (leftMargin) {
        this.currentLeftMargin = leftMargin;
        this.svgGroup.attr("transform", "translate(" + this.currentLeftMargin + "," + MARGIN.top + ")");
    };

    /**
    * Gets the location the chart popup should be at following a mouse-button
    * press or a mouse movement.
    * @param {jQuery.event} event - jQuery mouse-down or mouse-move event.
    */
    Chart.prototype.getPopupLocation = function (event) {
        return {
            x: event.pageX + CHART_POPUP_X_OFFSET,
            y: Math.max(event.pageY - this.popup.height() / 2, 0)
        };
    };
    
    /**
    * Returns the fastest splits to the current control.
    * @return {Array} Array of fastest-split data.
    */
    Chart.prototype.getFastestSplitsPopupData = function () {
        // There's no split to the start, so if the current control is the
        // start, show the statistics for control 1 instead.
        var data = this.ageClassSet.getFastestSplitsTo(MAX_FASTEST_SPLITS, this.currentControlIndex);
        data = data.map(function (comp) {
            return {time: comp.split, name: comp.name, highlight: false};
        });
        
        return {title: "Selected classes", data: data, placeholder: "No competitors completed this course"};
    };
    
    /**
    * Returns the fastest splits for the currently-shown leg.  The list
    * returned contains the fastest splits for the current leg for each class.
    * @return {Object} Object that contains the title for the popup and the
    *     array of data to show within it.
    */
    Chart.prototype.getFastestSplitsForCurrentLegPopupData = function () {
        var course = this.ageClassSet.getCourse();
        var startCode = course.getControlCode(this.currentControlIndex - 1);
        var endCode = course.getControlCode(this.currentControlIndex);
        
        var title = "Fastest leg-time " + ((startCode === START) ? "Start" : startCode) + " to " + ((endCode === FINISH) ? "Finish" : endCode);
        
        var primaryClass = this.ageClassSet.getPrimaryClassName();
        var data = this.eventData.getFastestSplitsForLeg(startCode, endCode)
                                 .map(function (row) { return { name: row.name, className: row.className, time: row.split, highlight: (row.className === primaryClass)}; });
        
        return {title: title, data: data, placeholder: null};
    };
    
    /**
    * Stores the current time the mouse is at, on the race graph.
    * @param {jQuery.event} event - The mouse-down or mouse-move event.
    */
    Chart.prototype.setCurrentChartTime = function (event) {
        var yOffset = event.pageY - $(this.svg.node()).offset().top - MARGIN.top;
        this.currentChartTime = Math.round(this.yScale.invert(yOffset) * 60) + this.referenceCumTimes[this.currentControlIndex];
    };
    
    /**
    * Returns an array of the competitors visiting the current control at the
    * current time.
    * @return {Array} Array of competitor data.
    */
    Chart.prototype.getCompetitorsVisitingCurrentControlPopupData = function () {
        var controlCode = this.ageClassSet.getCourse().getControlCode(this.currentControlIndex);
        var intervalStart = this.currentChartTime - RACE_GRAPH_COMPETITOR_WINDOW / 2;
        var intervalEnd = this.currentChartTime + RACE_GRAPH_COMPETITOR_WINDOW / 2;
        var competitors = this.eventData.getCompetitorsAtControlInTimeRange(controlCode, intervalStart, intervalEnd);
            
        var primaryClass = this.ageClassSet.getPrimaryClassName();
        var competitorData = competitors.map(function (row) { return {name: row.name, className: row.className, time: row.time, highlight: (row.className === primaryClass)}; });
        
        var title = formatTime(intervalStart) + " - " + formatTime(intervalEnd) + ": ";
        if (controlCode === START) {
            title += "Start";
        } else if (controlCode === FINISH) {
            title += "Finish";
        } else {
            title += "Control " + controlCode;
        }
        
        return {title: title, data: competitorData, placeholder: "No competitors."};
    };

    /**
    * Handle the mouse entering the chart.
    * @param {jQuery.event} event - jQuery event object.
    */
    Chart.prototype.onMouseEnter = function (event) {
        if (this.warningPanel === null) {
            if (this.mouseOutTimeout !== null) {
                clearTimeout(this.mouseOutTimeout);
                this.mouseOutTimeout = null;
            }
            
            this.isMouseIn = true;
            this.updateControlLineLocation(event);            
        }
    };

    /**
    * Handle a mouse movement.
    * @param {jQuery.event} event - jQuery event object.
    */
    Chart.prototype.onMouseMove = function (event) {
        if (this.isMouseIn && this.xScale !== null && this.warningPanel === null) {
            this.updateControlLineLocation(event);
        }
    };
     
    /**
    * Handle the mouse leaving the chart.
    */
    Chart.prototype.onMouseLeave = function () {
        if (this.warningPanel === null) {
            var outerThis = this;
            // Check that the mouse hasn't entered the popup.
            // It seems that the mouseleave event for the chart is sent before the
            // mouseenter event for the popup, so we use a timeout to check a short
            // time later whether the mouse has left the chart and the popup.
            // This is only necessary for IE9 and IE10; other browsers support
            // "pointer-events: none" in CSS so the popup never gets any mouse
            // events.
            
            // Note that we keep a reference to the 'timeout', so that we can
            // clear it if the mouse subsequently re-enters.  This happens a lot
            // more often than might be expected for a function with a timeout of
            // only a single millisecond.
            this.mouseOutTimeout = setTimeout(function() {
                if (!outerThis.popup.isMouseIn()) {
                    outerThis.isMouseIn = false;
                    outerThis.removeControlLine();
                }
            }, 1);
        }
    };
    
    /**
    * Handles a mouse button being pressed over the chart.
    * @param {jQuery.Event} event - jQuery event object.
    */
    Chart.prototype.onMouseDown = function (event) {
        if (this.warningPanel === null) {
            var outerThis = this;
            // Use a timeout to open the dialog as we require other events
            // (mouseover in particular) to be processed first, and the precise
            // order of these events is not consistent between browsers.
            setTimeout(function () { outerThis.showPopupDialog(event); }, 1);
        }
    };
    
    /**
    * Handles a mouse button being pressed over the chart.
    */
    Chart.prototype.onMouseUp = function (event) {
        if (this.warningPanel === null) {
            this.popup.hide();
            event.preventDefault();
        }
    };
    
    /**
    * Shows the popup window, populating it with data as necessary
    * @param {jQuery event} event - The jQuery onMouseDown event that triggered
    *     the popup.
    */ 
    Chart.prototype.showPopupDialog = function (event) {
        if (this.isMouseIn && this.currentControlIndex !== null) {
            var showPopup = false;
            var outerThis = this;
            if (this.isRaceGraph && (event.which === JQUERY_EVENT_LEFT_BUTTON || event.which === JQUERY_EVENT_RIGHT_BUTTON)) {
                if (this.hasControls) {
                    this.setCurrentChartTime(event);
                    this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getCompetitorsVisitingCurrentControlPopupData(), true); };
                    showPopup = true;
                }
            } else if (event.which === JQUERY_EVENT_LEFT_BUTTON) {
                this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getFastestSplitsPopupData(), false); };
                showPopup = true;
            } else if (event.which === JQUERY_EVENT_RIGHT_BUTTON) {
                if (this.hasControls) {
                    this.popupUpdateFunc = function () { outerThis.popup.setData(outerThis.getFastestSplitsForCurrentLegPopupData(), true); };
                    showPopup = true;
                }
            }
            
            if (showPopup) {
                this.popupUpdateFunc();
                this.popup.show(this.getPopupLocation(event));
            }
        }
    };

    /**
    * Draw a 'control line'.  This is a vertical line running the entire height of
    * the chart, at one of the controls.
    * @param {Number} controlIndex - The index of the control at which to draw the
    *                                control line.
    */
    Chart.prototype.drawControlLine = function(controlIndex) {
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
    * Updates the location of the control line from the given mouse event.
    * @param {jQuery.event} event - jQuery mousedown or mousemove event.
    */
    Chart.prototype.updateControlLineLocation = function (event) {

        var svgNodeAsJQuery = $(this.svg.node());
        var offset = svgNodeAsJQuery.offset();
        var xOffset = event.pageX - offset.left;
        var yOffset = event.pageY - offset.top;
        
        if (this.currentLeftMargin <= xOffset && xOffset < svgNodeAsJQuery.width() - MARGIN.right && 
            MARGIN.top <= yOffset && yOffset < svgNodeAsJQuery.height() - MARGIN.bottom) {
            // In the chart.
            // Get the time offset that the mouse is currently over.
            var chartX = this.xScale.invert(xOffset - this.currentLeftMargin);
            var bisectIndex = d3.bisect(this.referenceCumTimes, chartX);
            
            // bisectIndex is the index at which to insert chartX into
            // referenceCumTimes in order to keep the array sorted.  So if
            // this index is N, the mouse is between N - 1 and N.  Find
            // which is nearer.
            var controlIndex;
            if (bisectIndex >= this.referenceCumTimes.length) {
                // Off the right-hand end, use the finish.
                controlIndex = this.numControls + 1;
            } else if (bisectIndex <= this.minViewableControl) {
                // Before the minimum viewable control, so use that.
                controlIndex = this.minViewableControl;
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
            
            if (this.popup.isShown() && this.currentControlIndex !== null) {
                if (this.isRaceGraph) {
                    this.setCurrentChartTime(event);
                }
                
                this.popupUpdateFunc();
                this.popup.setLocation(this.getPopupLocation(event));
            }
            
        } else {
            // In the SVG element but outside the chart area.
            this.removeControlLine();
            this.popup.hide();
        }
    };

    /**
    * Remove any previously-drawn control line.  If no such line existed, nothing
    * happens.
    */
    Chart.prototype.removeControlLine = function() {
        this.currentControlIndex = null;
        this.updateCompetitorStatistics();
        if (this.controlLine !== null) {
            d3.select(this.controlLine).remove();
            this.controlLine = null;
        }
    };

    /**
    * Returns an array of the the times that the selected competitors are
    * behind the fastest time at the given control.
    * @param {Number} controlIndex - Index of the given control.
    * @param {Array} indexes - Array of indexes of selected competitors.
    * @return {Array} Array of times in seconds that the given competitors are
    *     behind the fastest time.
    */
    Chart.prototype.getTimesBehindFastest = function (controlIndex, indexes) {
        var selectedCompetitors = indexes.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        var fastestSplit = this.fastestCumTimes[controlIndex] - this.fastestCumTimes[controlIndex - 1];
        var timesBehind = selectedCompetitors.map(function (comp) { var compSplit = comp.getSplitTimeTo(controlIndex); return (compSplit === null) ? null : compSplit - fastestSplit; });
        return timesBehind;
    };
    
    /**
    * Updates the statistics text shown after the competitors.
    */
    Chart.prototype.updateCompetitorStatistics = function() {
        var selectedCompetitors = this.selectedIndexesOrderedByLastYValue.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        var labelTexts = selectedCompetitors.map(function (comp) { return formatNameAndSuffix(comp.name, comp.getSuffix()); });
        
        if (this.currentControlIndex !== null && this.currentControlIndex > 0) {
            if (this.visibleStatistics[0]) {
                var cumTimes = selectedCompetitors.map(function (comp) { return comp.getCumulativeTimeTo(this.currentControlIndex); }, this);
                var cumRanks = selectedCompetitors.map(function (comp) { return comp.getCumulativeRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, cumTimes, cumRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
                           
            if (this.visibleStatistics[1]) {
                var splitTimes = selectedCompetitors.map(function (comp) { return comp.getSplitTimeTo(this.currentControlIndex); }, this);
                var splitRanks = selectedCompetitors.map(function (comp) { return comp.getSplitRankTo(this.currentControlIndex); }, this);
                labelTexts = d3.zip(labelTexts, splitTimes, splitRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
             
            if (this.visibleStatistics[2]) {
                var timesBehind = this.getTimesBehindFastest(this.currentControlIndex, this.selectedIndexesOrderedByLastYValue);
                labelTexts = d3.zip(labelTexts, timesBehind)
                               .map(function(pair) { return pair[0] + SPACER + formatTime(pair[1]); });
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
    Chart.prototype.getTickFormatter = function () {
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
    Chart.prototype.getTextWidth = function (text) {
        return this.textSizeElement.text(text).node().getBBox().width;
    };

    /**
    * Gets the height of a piece of text.
    *
    * @param {string} text - The piece of text to measure the height of.
    * @returns {Number} The height of the piece of text, in pixels.
    */
    Chart.prototype.getTextHeight = function (text) {
        return this.textSizeElement.text(text).node().getBBox().height;
    };

    /**
    * Return the maximum width of the end-text shown to the right of the graph.
    *
    * This function considers only the competitors whose indexes are in the
    * list given.  This method returns zero if the list is empty.
    * @returns {Number} Maximum width of text, in pixels.
    */
    Chart.prototype.getMaxGraphEndTextWidth = function () {
        if (this.selectedIndexes.length === 0) {
            // No competitors selected.  Avoid problems caused by trying to
            // find the maximum of an empty array.
            return 0;
        } else {
            var nameWidths = this.selectedIndexes.map(function (index) {
                var comp = this.ageClassSet.allCompetitors[index];
                return this.getTextWidth(formatNameAndSuffix(comp.name, comp.getSuffix()));
            }, this);
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
    Chart.prototype.getMaxTimeAndRankTextWidth = function(timeFuncName, rankFuncName) {
        var maxTime = 0;
        var maxRank = 0;
        
        var selectedCompetitors = this.selectedIndexes.map(function (index) { return this.ageClassSet.allCompetitors[index]; }, this);
        
        d3.range(1, this.numControls + 2).forEach(function (controlIndex) {
            var times = selectedCompetitors.map(function (comp) { return comp[timeFuncName](controlIndex); });
            maxTime = Math.max(maxTime, d3.max(times.filter(isNotNull)));
            
            var ranks = selectedCompetitors.map(function (comp) { return comp[rankFuncName](controlIndex); });
            maxRank = Math.max(maxRank, d3.max(ranks.filter(isNotNull)));
        });
        
        var text = formatTimeAndRank(maxTime, maxRank);
        return this.getTextWidth(text);
    };

    /**
    * Return the maximum width of the split-time and rank text shown to the right
    * of each competitor 
    * @returns {Number} Maximum width of split-time and rank text, in pixels.
    */
    Chart.prototype.getMaxSplitTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getSplitTimeTo", "getSplitRankTo");
    };

    /**
    * Return the maximum width of the cumulative time and cumulative-time rank text
    * shown to the right of each competitor 
    * @returns {Number} Maximum width of cumulative time and cumulative-time rank text, in
    *                   pixels.
    */
    Chart.prototype.getMaxCumulativeTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getCumulativeTimeTo", "getCumulativeRankTo");
    };

    /**
    * Return the maximum width of the behind-fastest time shown to the right of
    * each competitor 
    * @returns {Number} Maximum width of behind-fastest time rank text, in pixels.
    */
    Chart.prototype.getMaxTimeBehindFastestWidth = function() {
        var maxTime = 0;
        
        for (var controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
            var times = this.getTimesBehindFastest(controlIndex, this.selectedIndexes);
            maxTime = Math.max(maxTime, d3.max(times.filter(isNotNull)));
        }
        
        return this.getTextWidth(SPACER + formatTime(maxTime));
    };

    /**
    * Determines the maximum width of the statistics text at the end of the competitor.
    * @returns {Number} Maximum width of the statistics text, in pixels.
    */
    Chart.prototype.determineMaxStatisticTextWidth = function() {
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
    * Determines the maximum width of all of the visible start time labels.
    * If none are presently visible, zero is returned.
    * @param {object} chartData - Object containing the chart data.
    * @return {Number} Maximum width of a start time label.
    */
    Chart.prototype.determineMaxStartTimeLabelWidth = function (chartData) {
        var maxWidth;
        if (chartData.competitorNames.length > 0) {
            maxWidth = d3.max(chartData.competitorNames.map(function (name) { return this.getTextWidth("00:00:00 " + name); }, this));
        } else {
            maxWidth = 0;
        }
        
        return maxWidth;
    };

    /**
    * Creates the X and Y scales necessary for the chart and its axes.
    * @param {object} chartData - Chart data object.
    */
    Chart.prototype.createScales = function (chartData) {
        this.xScale = d3.scale.linear().domain(chartData.xExtent).range([0, this.contentWidth]);
        this.yScale = d3.scale.linear().domain(chartData.yExtent).range([0, this.contentHeight]);
        this.xScaleMinutes = d3.scale.linear().domain([chartData.xExtent[0] / 60, chartData.xExtent[1] / 60]).range([0, this.contentWidth]);
    };

    /**
    * Draw the background rectangles that indicate sections of the course
    * between controls.
    */
    Chart.prototype.drawBackgroundRectangles = function () {
        var rects = this.svgGroup.selectAll("rect")
                                 .data(d3.range(this.numControls + 1));

        var outerThis = this;

        rects.enter().append("rect");

        rects.attr("x", function (index) { return outerThis.xScale(outerThis.referenceCumTimes[index]); })
             .attr("y", 0)
             .attr("width", function (index) { return outerThis.xScale(outerThis.referenceCumTimes[index + 1] - outerThis.referenceCumTimes[index]); })
             .attr("height", this.contentHeight)
             .attr("class", function (index) { return (index % 2 === 0) ? "background1" : "background2"; });

        rects.exit().remove();
    };
    
    /**
    * Returns a function used to format tick labels on the Y-axis.
    *
    * If start times are to be shown (i.e. for the race graph), then the Y-axis
    * values are start times.  We format these as times, as long as there isn't
    * a competitor's start time too close to it.
    *
    * For other graph types, this method returns null, which tells d3 to use
    * its default tick formatter.
    * 
    * @param {object} chartData - The chart data to read start times from.
    */
    Chart.prototype.determineYAxisTickFormatter = function (chartData) {
        if (this.isRaceGraph) {
            // Assume column 0 of the data is the start times.
            // However, beware that there might not be any data.
            var startTimes = (chartData.dataColumns.length === 0) ? [] : chartData.dataColumns[0].ys;
            if (startTimes.length === 0) {
                // No start times - draw all tick marks.
                return function (time) { return formatTime(time * 60); };
            } else {
                // Some start times are to be drawn - only draw tick marks if
                // they are far enough away from competitors.
                var yScale = this.yScale;
                return function (time) {
                    var nearestOffset = d3.min(startTimes.map(function (startTime) { return Math.abs(yScale(startTime) - yScale(time)); }));
                    return (nearestOffset >= MIN_COMPETITOR_TICK_MARK_DISTANCE) ? formatTime(Math.round(time * 60)) : "";
                };
           }
        } else {
            // Use the default d3 tick formatter.
            return null;
        }
    };

    /**
    * Draw the chart axes.
    * @param {String} yAxisLabel - The label to use for the Y-axis.
    * @param {object} chartData - The chart data to use.
    */
    Chart.prototype.drawAxes = function (yAxisLabel, chartData) {
    
        var tickFormatter = this.determineYAxisTickFormatter(chartData);
        
        var xAxis = d3.svg.axis()
                          .scale(this.xScale)
                          .orient("top")
                          .tickFormat(this.getTickFormatter())
                          .tickValues(this.referenceCumTimes);

        var yAxis = d3.svg.axis()
                          .scale(this.yScale)
                          .tickFormat(tickFormatter)
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
    Chart.prototype.drawChartLines = function (chartData) {
        var outerThis = this;
        var lineFunctionGenerator = function (selCompIdx) {
            if (chartData.dataColumns.every(function (col) { return col.ys[selCompIdx] === null; })) {
                // This competitor's entire row is null, so there's no data to
                // draw.  d3 will report an error ('Error parsing d=""') if no
                // points on the line are defined, as will happen in this case,
                // so we substitute some dummy data instead.
                return d3.svg.line().x(-10000)
                                    .y(-10000);
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
    Chart.prototype.highlight = function (competitorIdx) {
        this.svg.selectAll("path.graphLine.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("line.competitorLegendLine.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("text.competitorLabel.competitor" + competitorIdx).classed("selected", true);
        this.svg.selectAll("text.startLabel.competitor" + competitorIdx).classed("selected", true);
    };

    /**
    * Removes any competitor-specific higlighting.
    */
    Chart.prototype.unhighlight = function () {
        this.svg.selectAll("path.graphLine.selected").classed("selected", false);
        this.svg.selectAll("line.competitorLegendLine.selected").classed("selected", false);
        this.svg.selectAll("text.competitorLabel.selected").classed("selected", false);
        this.svg.selectAll("text.startLabel.selected").classed("selected", false);
    };

    /**
    * Draws the start-time labels for the currently-selected competitors.
    * @param {object} chartData - The chart data that contains the start offsets.
    */ 
    Chart.prototype.drawCompetitorStartTimeLabels = function (chartData) {
        var startColumn = chartData.dataColumns[0];
        var outerThis = this;
        
        var startLabels = this.svgGroup.selectAll("text.startLabel").data(this.selectedIndexes);
        
        startLabels.enter().append("text");
        
        startLabels.attr("x", -7)
                   .attr("y", function (_compIndex, selCompIndex) { return outerThis.yScale(startColumn.ys[selCompIndex]) + outerThis.getTextHeight(chartData.competitorNames[selCompIndex]) / 4; })
                   .attr("class", function (compIndex) { return "startLabel competitor" + compIndex; })
                   .on("mouseenter", function (compIndex) { outerThis.highlight(compIndex); })
                   .on("mouseleave", function () { outerThis.unhighlight(); })
                   .text(function (_compIndex, selCompIndex) { return formatTime(Math.round(startColumn.ys[selCompIndex] * 60)) + " " + chartData.competitorNames[selCompIndex]; });
        
        startLabels.exit().remove();
    };
    
    /**
    * Removes all of the competitor start-time labels from the chart.
    */ 
    Chart.prototype.removeCompetitorStartTimeLabels = function () {
        this.svgGroup.selectAll("text.startLabel").remove();
    };

    /**
    * Draw legend labels to the right of the chart.
    * @param {object} chartData - The chart data that contains the final time offsets.
    */
    Chart.prototype.drawCompetitorLegendLabels = function (chartData) {
        
        if (chartData.dataColumns.length === 0) {
            this.currentCompetitorData = [];
        } else {
            var finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
            this.currentCompetitorData = d3.range(this.numLines).map(function (i) {
                var competitorIndex = this.selectedIndexes[i];
                var name = this.ageClassSet.allCompetitors[competitorIndex].name;
                return {
                    label: formatNameAndSuffix(name, this.ageClassSet.allCompetitors[competitorIndex].getSuffix()),
                    textHeight: this.getTextHeight(name),
                    y: (finishColumn.ys[i] === null) ? null : this.yScale(finishColumn.ys[i]),
                    colour: colours[competitorIndex % colours.length],
                    index: competitorIndex
                };
            }, this);
            
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
        for (var i = 1; i < this.currentCompetitorData.length; i += 1) {
            if (this.currentCompetitorData[i].y < this.currentCompetitorData[i - 1].y + this.currentCompetitorData[i - 1].textHeight) {
                this.currentCompetitorData[i].y = this.currentCompetitorData[i - 1].y + this.currentCompetitorData[i - 1].textHeight;
            }
        }

        var legendLines = this.svgGroup.selectAll("line.competitorLegendLine").data(this.currentCompetitorData);
        legendLines.enter()
                   .append("line");

        var outerThis = this;
        legendLines.attr("x1", this.contentWidth + 1)
                   .attr("y1", function (data) { return data.y; })
                   .attr("x2", this.contentWidth + LEGEND_LINE_WIDTH + 1)
                   .attr("y2", function (data) { return data.y; })
                   .attr("stroke", function (data) { return data.colour; })
                   .attr("class", function (data) { return "competitorLegendLine competitor" + data.index; })
                   .on("mouseenter", function (data) { outerThis.highlight(data.index); })
                   .on("mouseleave", function () { outerThis.unhighlight(); });

        legendLines.exit().remove();

        var labels = this.svgGroup.selectAll("text.competitorLabel").data(this.currentCompetitorData);
        labels.enter()
              .append("text");

        labels.attr("x", this.contentWidth + LEGEND_LINE_WIDTH + 2)
              .attr("y", function (data) { return data.y + data.textHeight / 4; })
              .attr("class", function (data) { return "competitorLabel competitor" + data.index; })
              .on("mouseenter", function (data) { outerThis.highlight(data.index); })
              .on("mouseleave", function () { outerThis.unhighlight(); })
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
    Chart.prototype.adjustContentSize = function () {
        // Extra length added to the maximum start-time label width to
        // include the lengths of the Y-axis ticks.
        var EXTRA_MARGIN = 8;
        var maxTextWidth = this.getMaxGraphEndTextWidth();
        this.setLeftMargin(Math.max(this.maxStartTimeLabelWidth + EXTRA_MARGIN, MARGIN.left));
        this.contentWidth = Math.max(this.overallWidth - this.currentLeftMargin - MARGIN.right - maxTextWidth - (LEGEND_LINE_WIDTH + 2), 100);
        this.contentHeight = Math.max(this.overallHeight - MARGIN.top - MARGIN.bottom, 100);
    };

    /**
    * Sets the overall size of the chart control, including margin, axes and legend labels.
    * @param {Number} overallWidth - Overall width
    * @param {Number} overallHeight - Overall height
    */
    Chart.prototype.setSize = function (overallWidth, overallHeight) {
        this.overallWidth = overallWidth;
        this.overallHeight = overallHeight;
        $(this.svg.node()).width(overallWidth).height(overallHeight);
        this.adjustContentSize();
    };

    /**
    * Clears the graph by removing all controls from it.
    */
    Chart.prototype.clearGraph = function () {
        this.svgGroup.selectAll("*").remove();
    };
    
    /**
    * Removes the warning panel, if it is still shown.
    */
    Chart.prototype.clearWarningPanel = function () {
        if (this.warningPanel !== null) {
            this.warningPanel.remove();
            this.warningPanel = null;
        }
    };
    
    /**
    * Shows a warning panel over the chart, with the given message.
    * @param message The message to show.
    */
    Chart.prototype.showWarningPanel = function (message) {
        this.clearWarningPanel();
        this.warningPanel = d3.select(this.parent).append("div")
                                                  .classed("warningPanel", true);
        this.warningPanel.text(message);
        
        var panelWidth = $(this.warningPanel.node()).width();
        var panelHeight = $(this.warningPanel.node()).height();
        this.warningPanel.style("left", (($(this.parent).width() - panelWidth) / 2) + "px")
                         .style("top", ((this.overallHeight - panelHeight) / 2) + "px");
    };
    
    /**
    * Draws the chart.
    * @param {object} data - Object that contains various chart data.  This
    *     must contain the following properties:
    *     * chartData {Object} - the data to plot on the chart
    *     * eventData {SplitsBrowser.Model.Event} - the overall Event object.
    *     * ageClassSet {SplitsBrowser.Model.Event} - the age-class set.
    *     * referenceCumTimes {Array} - Array of cumulative split times of the
    *       'reference'.
    *     * fastestCumTimes {Array} - Array of cumulative times of the
    *       imaginary 'fastest' competitor.
    * @param {Array} selectedIndexes - Array of indexes of selected competitors
    *                (0 in this array means the first competitor is selected, 1
    *                means the second is selected, and so on.)
    * @param {Array} visibleStatistics - Array of boolean flags indicating whether
    *                                    certain statistics are visible.
    * @param {Object} chartType - The type of chart being drawn.
    */
    Chart.prototype.drawChart = function (data, selectedIndexes, visibleStatistics, chartType) {
        var chartData = data.chartData;
        this.numControls = chartData.numControls;
        this.numLines = chartData.competitorNames.length;
        this.selectedIndexes = selectedIndexes;
        this.referenceCumTimes = data.referenceCumTimes;
        this.fastestCumTimes = data.fastestCumTimes;
        this.eventData = data.eventData;
        this.ageClassSet = data.ageClassSet;
        this.hasControls = data.ageClassSet.getCourse().hasControls();
        this.isRaceGraph = chartType.isRaceGraph;
        this.minViewableControl = chartType.minViewableControl;
        this.visibleStatistics = visibleStatistics;
        
        this.maxStatisticTextWidth = this.determineMaxStatisticTextWidth();
        this.maxStartTimeLabelWidth = (this.isRaceGraph) ? this.determineMaxStartTimeLabelWidth(chartData) : 0;
        this.clearWarningPanel();
        this.adjustContentSize();
        this.createScales(chartData);
        this.drawBackgroundRectangles();
        this.drawAxes(chartType.yAxisLabel, chartData);
        this.drawChartLines(chartData);
        this.drawCompetitorLegendLabels(chartData);
        if (this.isRaceGraph) {
            this.drawCompetitorStartTimeLabels(chartData);
        } else {
            this.removeCompetitorStartTimeLabels();
        }
    };
    
    /**
    * Clears the chart and shows a warning message instead.
    * @param {String} message - The text of the warning message to show.
    */
    Chart.prototype.clearAndShowWarning = function (message) {
        this.numControls = 0;
        this.numLines = 0;
        
        var dummyChartData = {
            dataColumns: [],
            competitorNames: [],
            numControls: 0,
            xExtent: [0, 3600],
            yExtent: [0, 1]
        };
        
        this.maxStatisticTextWidth = 0;
        this.maxStartTimeWidth = 0;
        this.clearGraph();
        this.adjustContentSize();
        this.referenceCumTimes = [0];
        this.createScales(dummyChartData);
        this.drawAxes("", dummyChartData);
        this.showWarningPanel(message);
    };
    
    SplitsBrowser.Controls.Chart = Chart;
})();


(function () {
    "use strict";
    
    var formatTime = SplitsBrowser.formatTime;
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    
    var NON_BREAKING_SPACE_CHAR = "\u00a0";

    /**
    * A control that shows an entire table of results.
    * @constructor
    * @param {HTMLElement} parent - The parent element to add this control to.
    */
    var ResultsTable = function (parent) {
        this.parent = parent;
        this.ageClass = null;
        this.div = null;
        this.headerSpan = null;
        this.table = null;
        this.buildTable();
    };
    
    /**
    * Build the results table.
    */
    ResultsTable.prototype.buildTable = function () {
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
    * Populates the contents of the table with the age-class data.
    */
    ResultsTable.prototype.populateTable = function () {
        var headerText = this.ageClass.name + ", " + this.ageClass.numControls + " control" + ((this.ageClass.numControls === 1) ? "" : "s");
        var course = this.ageClass.course;
        if (course.length !== null) {
            headerText += ", " + course.length.toFixed(1) + "km";
        }
        if (course.climb !== null) {
            headerText += ", " + course.climb + "m";
        }
        
        this.headerSpan.text(headerText);
        
        var headerCellData = ["#", "Name", "Time"].concat(d3.range(1, this.ageClass.numControls + 1)).concat(["Finish"]);
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
        
        var competitors = this.ageClass.competitors.slice(0);
        competitors.sort(compareCompetitors);
        
        var nonCompCount = 0;
        var rank = 0;
        competitors.forEach(function (competitor, index) {
            var tableRow = tableBody.append("tr");
            var numberCell = tableRow.append("td");
            if (competitor.isNonCompetitive) {
                numberCell.text("n/c");
                nonCompCount += 1;
            } else if (competitor.completed()) {
                if (index === 0 || competitors[index - 1].totalTime !== competitor.totalTime) {
                    rank = index + 1 - nonCompCount;
                }
                
                numberCell.text(rank);
            }
            
            addCell(tableRow, competitor.name, competitor.club);
            addCell(tableRow, (competitor.completed()) ? formatTime(competitor.totalTime) : "mp", NON_BREAKING_SPACE_CHAR, "time");
            
            d3.range(1, this.ageClass.numControls + 2).forEach(function (controlNum) {
                addCell(tableRow, formatTime(competitor.getCumulativeTimeTo(controlNum)), formatTime(competitor.getSplitTimeTo(controlNum)), "time");
            });
        }, this);
    };
    
    /**
    * Sets the class whose data is displayed.
    * @param {SplitsBrowser.Model.AgeClass} ageClass - The class displayed.
    */
    ResultsTable.prototype.setClass = function (ageClass) {
        this.ageClass = ageClass;
        this.populateTable();
        if (this.div.style("display") !== "none") {
            this.adjustTableCellWidths();
        }
    };
    
    /**
    * Adjust the widths of the time table cells so that they have the same width.
    */
    ResultsTable.prototype.adjustTableCellWidths = function () {
        var lastCellOnFirstRow = d3.select("tbody tr td:last-child").node();
        $("tbody td.time").width($(lastCellOnFirstRow).width());
    };
    
    /**
    * Shows the table of results.
    */
    ResultsTable.prototype.show = function () {
        this.div.style("display", "");
        this.adjustTableCellWidths();
    };
    
    /**
    * Hides the table of results.
    */
    ResultsTable.prototype.hide = function () {
        this.div.style("display", "none");
    };
    
    SplitsBrowser.Controls.ResultsTable = ResultsTable;
})();

(function () {
    "use strict";
    // Delay in milliseconds between a resize event being triggered and the
    // page responding to it.
    // (Resize events tend to come more than one at a time; if a resize event
    // comes in while a previous event is waiting, the previous event is
    // cancelled.)
    var RESIZE_DELAY_MS = 100;

    // ID of the div that contains the competitor list.
    // Must match that used in styles.css.
    var COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    
    var ClassSelector = SplitsBrowser.Controls.ClassSelector;
    var ChartTypeSelector = SplitsBrowser.Controls.ChartTypeSelector;
    var ComparisonSelector = SplitsBrowser.Controls.ComparisonSelector;
    var StatisticsSelector = SplitsBrowser.Controls.StatisticsSelector;
    var CompetitorListBox = SplitsBrowser.Controls.CompetitorListBox;
    var Chart = SplitsBrowser.Controls.Chart;
    var ResultsTable = SplitsBrowser.Controls.ResultsTable;
    
    /**
    * Enables or disables a control, by setting or clearing an HTML "disabled"
    * attribute as necessary.
    * @param {d3.selection} control - d3 selection containing the control.
    * @param {boolean} isEnabled - Whether the control is enabled.
    */
    function enableControl(control, isEnabled) {
        control.node().disabled = !isEnabled;
    }
    
    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    */
    var Viewer = function () {
    
        this.eventData = null;
        this.classes = null;
        this.currentClasses = [];
        this.currentIndexes = null;
        this.chartData = null;
        this.referenceCumTimes = null;
        this.fastestCumTimes = null;
        this.previousCompetitorList = [];
        
        this.isChartEnabled = false;

        this.selection = null;
        this.ageClassSet = null;
        this.classSelector = null;
        this.statisticsSelector = null;
        this.competitorListBox = null;
        this.chart = null;
        this.topPanel = null;
        this.mainPanel = null;
        this.buttonsPanel = null;
        this.competitorListContainer = null;
        
        this.currentResizeTimeout = null;
    };
    
    /**
    * Sets the classes that the viewer can view.
    * @param {SplitsBrowser.Model.Event} eventData - All event data loaded.
    */
    Viewer.prototype.setEvent = function (eventData) {
        this.eventData = eventData;
        this.classes = eventData.classes;
        if (this.classSelector !== null) {
            this.classSelector.setClasses(this.classes);
        }
    };

    /**
    * Construct the UI inside the HTML body.
    */
    Viewer.prototype.buildUi = function () {
        var body = d3.select("body");
        
        this.topPanel = body.append("div");
                           
        var outerThis = this;
        this.classSelector = new ClassSelector(this.topPanel.node());
        if (this.classes !== null) {
            this.classSelector.setClasses(this.classes);
        }
        
        this.topPanel.append("span").classed("topRowSpacer", true);
        
        var types = SplitsBrowser.Model.ChartTypes;
        var chartTypes = [types.SplitsGraph, types.RaceGraph, types.PositionAfterLeg,
                          types.SplitPosition, types.PercentBehind, types.ResultsTable];
        
        this.chartTypeSelector = new ChartTypeSelector(this.topPanel.node(), chartTypes);
        
        this.chartType = this.chartTypeSelector.getChartType();
        
        this.topPanel.append("span").classed("topRowSpacer", true);
        
        this.comparisonSelector = new ComparisonSelector(this.topPanel.node(), function (message) { alert(message); });
        if (this.classes !== null) {
            this.comparisonSelector.setClasses(this.classes);
        }
        
        this.comparisonFunction = this.comparisonSelector.getComparisonFunction();
        
        this.statisticsSelector = new StatisticsSelector(this.topPanel.node());
        
        this.mainPanel = body.append("div");
        
        this.competitorListContainer = this.mainPanel.append("div")
                                                     .attr("id", COMPETITOR_LIST_CONTAINER_ID);
                                               
        this.buttonsPanel = this.competitorListContainer.append("div");
                     
        this.allButton = this.buttonsPanel.append("button")
                                          .text("All")
                                          .style("width", "50%")
                                          .on("click", function () { outerThis.selectAll(); });
                        
        this.noneButton = this.buttonsPanel.append("button")
                                           .text("None")
                                           .style("width", "50%")
                                           .on("click", function () { outerThis.selectNone(); });
                        
        this.buttonsPanel.append("br");
                        
        this.crossingRunnersButton = this.buttonsPanel.append("button")
                                                      .text("Crossing runners")
                                                      .style("width", "100%")
                                                      .on("click", function () { outerThis.selectCrossingRunners(); })
                                                      .style("display", "none");

        this.competitorListBox = new CompetitorListBox(this.competitorListContainer.node());
        this.chart = new Chart(this.mainPanel.node());
        
        this.resultsTable = new ResultsTable(body.node());
        this.resultsTable.hide();
        
        this.classSelector.registerChangeHandler(function (indexes) { outerThis.selectClasses(indexes); });
        
        this.chartTypeSelector.registerChangeHandler(function (chartType) { outerThis.selectChartType(chartType); });
        
        this.comparisonSelector.registerChangeHandler(function (comparisonFunc) { outerThis.selectComparison(comparisonFunc); });
           
        $(window).resize(function () { outerThis.handleWindowResize(); });
    };

    /**
    * Select all of the competitors.
    */
    Viewer.prototype.selectAll = function () {
        this.selection.selectAll();
    };

    /**
    * Select none of the competitors.
    */
    Viewer.prototype.selectNone = function () {
        this.selection.selectNone();
    };

    /**
    * Select all of the competitors that cross the unique selected competitor.
    */
    Viewer.prototype.selectCrossingRunners = function () {
        this.selection.selectCrossingRunners(this.ageClassSet.allCompetitors); 
        if (this.selection.isSingleRunnerSelected()) {
            var competitorName = this.ageClassSet.allCompetitors[this.currentIndexes[0]].name;
            alert(competitorName + " has no crossing runners.");
        }
    };

    /**
     * Handle a resize of the window.
     */
    Viewer.prototype.handleWindowResize = function () {
        if (this.currentResizeTimeout !== null) {
            clearTimeout(this.currentResizeTimeout);
        }

        var outerThis = this;
        this.currentResizeTimeout = setTimeout(function() { outerThis.postResizeHook(); }, RESIZE_DELAY_MS);
    };
    
    /**
    * Resize the chart following a change of size of the chart.
    */
    Viewer.prototype.postResizeHook = function () {
        this.currentResizeTimeout = null;
        this.drawChart();
    };

    /**
    * Adjusts the size of the viewer.
    */
    Viewer.prototype.adjustSize = function () {
        // Margin around the body element.
        var horzMargin = parseInt($("body").css("margin-left"), 10) + parseInt($("body").css("margin-right"), 10);
        var vertMargin = parseInt($("body").css("margin-top"), 10) + parseInt($("body").css("margin-bottom"), 10);
        
        // Extra amount subtracted off of the width of the chart in order to
        // prevent wrapping, in units of pixels.
        // 1 for the benefit of IE; Firefox, Chrome and Opera work with 0.
        var EXTRA_WRAP_PREVENTION_SPACE = 1;
        
        var bodyWidth = $(window).width() - horzMargin;
        var bodyHeight = $(window).height() - vertMargin;

        $("body").width(bodyWidth).height(bodyHeight);
        
        var topPanelHeight = $(this.topPanel.node()).height();

        // Hide the chart before we adjust the width of the competitor list.
        // If the competitor list gets wider, the new competitor list and the
        // old chart may be too wide together, and so the chart wraps onto a
        // new line.  Even after shrinking the chart back down, there still
        // might not be enough horizontal space, because of the horizontal
        // scrollbar.  So, hide the chart now, and re-show it later once we
        // know what size it should have.
        this.chart.hide();
        
        this.competitorListBox.setCompetitorList(this.ageClassSet.allCompetitors, (this.currentClasses.length > 1));
        
        var chartWidth = bodyWidth - this.competitorListBox.width() - EXTRA_WRAP_PREVENTION_SPACE;
        var chartHeight = bodyHeight - topPanelHeight;

        this.chart.setSize(chartWidth, chartHeight);
        this.chart.show();
        
        $(this.competitorListContainer.node()).height(bodyHeight - $(this.buttonsPanel.node()).height() - topPanelHeight);    
    };
    
    /**
    * Draw the chart using the current data.
    */
    Viewer.prototype.drawChart = function () {
        if (this.chartType.isResultsTable) {
            return;
        }
        
        this.adjustSize();
        
        this.currentVisibleStatistics = this.statisticsSelector.getVisibleStatistics();
        
        if (this.selectionChangeHandler !== null) {
            this.selection.deregisterChangeHandler(this.selectionChangeHandler);
        }
        
        if (this.statisticsChangeHandler !== null) {
            this.statisticsSelector.deregisterChangeHandler(this.statisticsChangeHandler);
        }
        
        var outerThis = this;
        
        this.selectionChangeHandler = function (indexes) {
            outerThis.currentIndexes = indexes;
            outerThis.enableOrDisableCrossingRunnersButton();
            outerThis.redraw();
        };

        this.selection.registerChangeHandler(this.selectionChangeHandler);
        
        this.statisticsChangeHandler = function (visibleStatistics) {
            outerThis.currentVisibleStatistics = visibleStatistics;
            outerThis.redraw();
        };
        
        this.statisticsSelector.registerChangeHandler(this.statisticsChangeHandler);

        var missedControls = this.ageClassSet.getControlsWithNoSplits();
        this.isChartEnabled = (missedControls.length === 0);
        this.updateControlEnabledness();
        if (this.isChartEnabled) {
            this.referenceCumTimes = this.comparisonFunction(this.ageClassSet);
            this.fastestCumTimes = this.ageClassSet.getFastestCumTimes();
            this.chartData = this.ageClassSet.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);
            this.redrawChart();
        } else {
            var message = "Cannot draw a graph because no competitor has recorded a split time for control " + missedControls[0] + ".";
            if (this.ageClassSet.getCourse().getNumClasses() > this.ageClassSet.getNumClasses()) {
                message += "\n\nTry selecting some other classes.";
            }
            
            this.chart.clearAndShowWarning(message);
        }
    };

    /**
    * Redraws the chart using all of the current data.
    */ 
    Viewer.prototype.redrawChart = function () {
        var data = {
            chartData: this.chartData,
            eventData: this.eventData,
            ageClassSet: this.ageClassSet,
            referenceCumTimes: this.referenceCumTimes,
            fastestCumTimes: this.fastestCumTimes
        };
            
        this.chart.drawChart(data, this.currentIndexes, this.currentVisibleStatistics, this.chartType);
    };
    
    /**
    * Redraw the chart, possibly using new data.
    */
    Viewer.prototype.redraw = function () {
        if (!this.chartType.isResultsTable && this.isChartEnabled) {
            this.chartData = this.ageClassSet.getChartData(this.referenceCumTimes, this.currentIndexes, this.chartType);
            this.redrawChart();
        }
    };
    
    /**
    * Change the graph to show the classes with the given indexes.
    * @param {Number} classIndexes - The (zero-based) indexes of the classes.
    */
    Viewer.prototype.selectClasses = function (classIndexes) {
    
        if (this.selection === null) {
            this.selection = new SplitsBrowser.Model.CompetitorSelection(0);
            this.competitorListBox.setSelection(this.selection);
        } else {
            if (classIndexes.length > 0 && this.currentClasses.length > 0 && this.classes[classIndexes[0]] === this.currentClasses[0]) {
                // The 'primary' class hasn't changed, only the 'other' ones.
                // In this case we don't clear the selection.
            } else {
                this.selection.selectNone();
            }
        }
        
        this.currentIndexes = [];
        this.currentClasses = classIndexes.map(function (index) { return this.classes[index]; }, this);
        this.ageClassSet = new SplitsBrowser.Model.AgeClassSet(this.currentClasses);
        this.comparisonSelector.setAgeClassSet(this.ageClassSet);
        this.resultsTable.setClass(this.currentClasses[0]);
        this.drawChart();
        this.selection.migrate(this.previousCompetitorList, this.ageClassSet.allCompetitors);
        this.previousCompetitorList = this.ageClassSet.allCompetitors;
    };
    
    /**
    * Change the graph to compare against a different reference.
    * @param {Function} comparisonFunc - The function that returns the
    *      reference class data from the class data.
    */
    Viewer.prototype.selectComparison = function (comparisonFunc) {
        this.comparisonFunction = comparisonFunc;
        this.drawChart();
    };
    
    /**
    * Change the type of chart shown.
    * @param {Object} chartType - The type of chart to draw.
    */
    Viewer.prototype.selectChartType = function (chartType) {
        this.chartType = chartType;
        if (chartType.isResultsTable) {
            this.mainPanel.style("display", "none");
            this.resultsTable.show();
        } else {
            this.resultsTable.hide();
            this.mainPanel.style("display", "");
        }
        
        this.updateControlEnabledness();
        
        this.crossingRunnersButton.style("display", (chartType.isRaceGraph) ? "" : "none");
        
        this.drawChart();
    };
    
    /**
    * Updates whether a number of controls are enabled.
    */
    Viewer.prototype.updateControlEnabledness = function () {
        this.classSelector.setOtherClassesEnabled(!this.chartType.isResultsTable);
        this.comparisonSelector.setEnabled(this.isChartEnabled && !this.chartType.isResultsTable);
        this.statisticsSelector.setEnabled(this.isChartEnabled && !this.chartType.isResultsTable);
        this.competitorListBox.setEnabled(this.isChartEnabled);
        enableControl(this.allButton, this.isChartEnabled);
        enableControl(this.noneButton, this.isChartEnabled);
        this.enableOrDisableCrossingRunnersButton();
    };
    
    /**
    * Enables or disables the crossing-runners button as appropriate.
    */
    Viewer.prototype.enableOrDisableCrossingRunnersButton = function () {
        enableControl(this.crossingRunnersButton, this.isChartEnabled && this.selection.isSingleRunnerSelected());
    };
    
    SplitsBrowser.Viewer = Viewer;

    /**
    * Shows a message that appears if SplitsBrowser is unable to load event
    * data.
    * @param {String} message - The text of the message to show.
    */
    function showLoadFailureMessage(message) {
        d3.select("body")
          .append("h1")
          .text("SplitsBrowser \u2013 Error");
          
       d3.select("body")
         .append("p")
         .text(message);
    }
    
    /**
    * Handles an asynchronous callback that fetched event data, by parsing the
    * data and starting SplitsBrowser.
    * @param {String} data - The data returned from the AJAX request.
    * @param {String} status - The status of the request.
    */
    function readEventData(data, status) {
        if (status === "success") {
            var eventData;
            try {
                eventData = SplitsBrowser.Input.parseEventData(data);
            } catch (e) {
                if (e.name === "InvalidData") {
                    showLoadFailureMessage("Sorry, it wasn't possible to read in the results data, as the data appears to be invalid: '" + e.message + "'.");
                    return;
                } else {
                    throw e;
                }
            }
            
            if (eventData === null) {
                showLoadFailureMessage("Sorry, it wasn't possible to read in the results data.  The data doesn't appear to be in any recognised format.");
            } else {
                var viewer = new Viewer();
                viewer.buildUi();
                viewer.setEvent(eventData);
                viewer.selectClasses([0]);
            }
        } else {
            showLoadFailureMessage("Sorry, it wasn't possible to read in the results data.  Status: " + status);
        }
    }
    
    /**
    * Handles the failure to read an event.
    * @param {jQuery.jqXHR} jqXHR - jQuery jqHXR object.
    * @param {String} textStatus - The text status of the request.
    * @param {String} errorThrown - The error message returned from the server.
    */
    function readEventDataError(jqXHR, textStatus, errorThrown) {
        showLoadFailureMessage("Sorry, it wasn't possible to load the results data.  The message returned from the server was '" + errorThrown + "'.");
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
            error: readEventDataError
        });
    };    
})();
