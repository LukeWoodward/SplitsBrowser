/*
 *  SplitsBrowser Competitor - An individual competitor who competed at an event.
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

    var NUMBER_TYPE = typeof 0;
    
    var isNotNull = SplitsBrowser.isNotNull;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
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
    * @returns {Number} Result of comparing two competitors.
    */
    SplitsBrowser.Model.compareCompetitors = function (a, b) {
        if (a.isDisqualified !== b.isDisqualified) {
            return (a.isDisqualified) ? 1 : -1;
        } else if (a.totalTime === b.totalTime) {
            return a.order - b.order;
        } else if (a.totalTime === null) {
            return (b.totalTime === null) ? 0 : 1;
        } else {
            return (b.totalTime === null) ? -1 : a.totalTime - b.totalTime;
        }
    };
    
    /**
    * Returns the sum of two numbers, or null if either is null.
    * @param {?Number} a - One number, or null, to add.
    * @param {?Number} b - The other number, or null, to add.
    * @return {?Number} null if at least one of a or b is null,
    *      otherwise a + b.
    */
    function addIfNotNull(a, b) {
        return (a === null || b === null) ? null : (a + b);
    }
    
    /**
    * Returns the difference of two numbers, or null if either is null.
    * @param {?Number} a - One number, or null, to add.
    * @param {?Number} b - The other number, or null, to add.
    * @return {?Number} null if at least one of a or b is null,
    *      otherwise a - b.
    */    
    function subtractIfNotNull(a, b) {
        return (a === null || b === null) ? null : (a - b);
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
    * The split and cumulative times passed here should be the 'original' times,
    * before any attempt is made to repair the data.
    *
    * It is not recommended to use this constructor directly.  Instead, use one of
    * the factory methods fromSplitTimes, fromCumTimes or fromOriginalCumTimes to
    * pass in either the split or cumulative times and have the other calculated.
    *
    * @constructor
    * @param {Number} order - The position of the competitor within the list of
    *     results.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {String} startTime - The competitor's start time.
    * @param {Array} originalSplitTimes - Array of split times, as numbers,
    *      with nulls for missed controls.
    * @param {Array} originalCumTimes - Array of cumulative split times, as
    *     numbers, with nulls for missed controls.
    */
    function Competitor(order, name, club, startTime, originalSplitTimes, originalCumTimes) {

        if (typeof order !== NUMBER_TYPE) {
            throwInvalidData("Competitor order must be a number, got " + typeof order + " '" + order + "' instead");
        }

        this.order = order;
        this.name = name;
        this.club = club;
        this.startTime = startTime;
        this.isNonCompetitive = false;
        this.isNonStarter = false;
        this.isNonFinisher = false;
        this.isDisqualified = false;
        this.isOverMaxTime = false;
        this.className = null;
        this.yearOfBirth = null;
        this.gender = null; // "M" or "F" for male or female.
        
        this.originalSplitTimes = originalSplitTimes;
        this.originalCumTimes = originalCumTimes;
        this.splitTimes = null;
        this.cumTimes = null;
        this.splitRanks = null;
        this.cumRanks = null;
        this.timeLosses = null;

        this.totalTime = (originalCumTimes === null || originalCumTimes.indexOf(null) > -1) ? null : originalCumTimes[originalCumTimes.length - 1];
    }
    
    /**
    * Marks this competitor as being non-competitive.
    */
    Competitor.prototype.setNonCompetitive = function () {
        this.isNonCompetitive = true;
    };
    
    /**
    * Marks this competitor as not starting.
    */
    Competitor.prototype.setNonStarter = function () {
        this.isNonStarter = true;
    };
    
    /**
    * Marks this competitor as not finishing.
    */
    Competitor.prototype.setNonFinisher = function () {
        this.isNonFinisher = true;
    };
    
    /**
    * Marks this competitor as disqualified, for reasons other than a missing
    * punch.
    */
    Competitor.prototype.disqualify = function () {
        this.isDisqualified = true;
    };
    
    /**
    * Marks this competitor as over maximum time.
    */
    Competitor.prototype.setOverMaxTime = function () {
        this.isOverMaxTime = true;
    };
    
    /**
    * Sets the name of the class that the competitor belongs to.
    * This is the course-class, not the competitor's age class.
    * @param {String} className - The name of the class.
    */
    Competitor.prototype.setClassName = function (className) {
        this.className = className;
    };
    
    /**
    * Sets the competitor's year of birth.
    * @param {Number} yearOfBirth - The competitor's year of birth.
    */
    Competitor.prototype.setYearOfBirth = function (yearOfBirth) {
        this.yearOfBirth = yearOfBirth;
    };
    
    /**
    * Sets the competitor's gender.  This should be "M" or "F".
    * @param {String} gender - The competitor's gender, "M" or "F".
    */
    Competitor.prototype.setGender = function (gender) {
        this.gender = gender;
    };
    
    /**
    * Create and return a Competitor object where the competitor's times are given
    * as a list of cumulative times.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * This method does not assume that the data given has been 'repaired'.  This
    * function should therefore be used to create a competitor if the data may
    * later need to be repaired.
    *
    * @param {Number} order - The position of the competitor within the list of results.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {Number} startTime - The competitor's start time, as seconds past midnight.
    * @param {Array} cumTimes - Array of cumulative split times, as numbers, with nulls for missed controls.
    * @return {Competitor} Created competitor.
    */
    Competitor.fromOriginalCumTimes = function (order, name, club, startTime, cumTimes) {
        var splitTimes = splitTimesFromCumTimes(cumTimes);
        return new Competitor(order, name, club, startTime, splitTimes, cumTimes);
    };
    
    /**
    * Create and return a Competitor object where the competitor's times are given
    * as a list of cumulative times.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * This method assumes that the data given has been repaired, so it is ready
    * to be viewed.
    *
    * @param {Number} order - The position of the competitor within the list of results.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {Number} startTime - The competitor's start time, as seconds past midnight.
    * @param {Array} cumTimes - Array of cumulative split times, as numbers, with nulls for missed controls.
    * @return {Competitor} Created competitor.
    */
    Competitor.fromCumTimes = function (order, name, club, startTime, cumTimes) {
        var competitor = Competitor.fromOriginalCumTimes(order, name, club, startTime, cumTimes);
        competitor.splitTimes = competitor.originalSplitTimes;
        competitor.cumTimes = competitor.originalCumTimes;
        return competitor;
    };
    
    /**
    * Sets the 'repaired' cumulative times for a competitor.  This also
    * calculates the repaired split times.
    * @param {Array} cumTimes - The 'repaired' cumulative times.
    */
    Competitor.prototype.setRepairedCumulativeTimes = function (cumTimes) {
        this.cumTimes = cumTimes;
        this.splitTimes = splitTimesFromCumTimes(cumTimes);
    };
    
    /**
    * Returns whether this competitor completed the course and did not get
    * disqualified.
    * @return {boolean} True if the competitor completed the course and did not
    *     get disqualified, false if the competitor did not complete the course
    *     or got disqualified.
    */
    Competitor.prototype.completed = function () {
        return this.totalTime !== null && !this.isDisqualified && !this.isOverMaxTime;
    };

    /**
    * Returns whether the competitor has any times recorded at all.
    * @return {boolean} True if the competitor has recorded at least one time,
    *     false if the competitor has recorded no times.
    */
    Competitor.prototype.hasAnyTimes = function () {
        // Trim the leading zero
        return this.originalCumTimes.slice(1).some(isNotNull);
    };
    
    /**
    * Returns the competitor's split to the given control.  If the control
    * index given is zero (i.e. the start), zero is returned.  If the
    * competitor has no time recorded for that control, null is returned.
    * If the value is missing, because the value read from the file was
    * invalid, NaN is returned.
    * 
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {?Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getSplitTimeTo = function (controlIndex) {
        return (controlIndex === 0) ? 0 : this.splitTimes[controlIndex - 1];
    };
    
    /**
    * Returns the competitor's 'original' split to the given control.  This is
    * always the value read from the source data file, or derived directly from
    * this data, before any attempt was made to repair the competitor's data.
    * 
    * If the control index given is zero (i.e. the start), zero is returned.
    * If the competitor has no time recorded for that control, null is
    * returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {?Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getOriginalSplitTimeTo = function (controlIndex) {
        return (controlIndex === 0) ? 0 : this.originalSplitTimes[controlIndex - 1];
    };
    
    /**
    * Returns whether the control with the given index is deemed to have a
    * dubious split time.
    * @param {Number} controlIndex - The index of the control.
    * @return {boolean} True if the split time to the given control is dubious,
    *     false if not.
    */
    Competitor.prototype.isSplitTimeDubious = function (controlIndex) {
        return (controlIndex > 0 && this.originalSplitTimes[controlIndex - 1] !== this.splitTimes[controlIndex - 1]);
    };
    
    /**
    * Returns the competitor's cumulative split to the given control.  If the
    * control index given is zero (i.e. the start), zero is returned.   If the
    * competitor has no cumulative time recorded for that control, null is
    * returned.  If the competitor recorded a time, but the time was deemed to
    * be invalid, NaN will be returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The cumulative split time in seconds for the competitor
    *      to the given control.
    */
    Competitor.prototype.getCumulativeTimeTo = function (controlIndex) {
        return this.cumTimes[controlIndex];
    };
    
    /**
    * Returns the 'original' cumulative time the competitor took to the given
    * control.  This is always the value read from the source data file, before
    * any attempt was made to repair the competitor's data.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The cumulative split time in seconds for the competitor
    *      to the given control.
    */
    Competitor.prototype.getOriginalCumulativeTimeTo = function (controlIndex) {
        return this.originalCumTimes[controlIndex];
    };
    
    /**
    * Returns whether the control with the given index is deemed to have a
    * dubious cumulative time.
    * @param {Number} controlIndex - The index of the control.
    * @return {boolean} True if the cumulative time to the given control is
    *     dubious, false if not.
    */
    Competitor.prototype.isCumulativeTimeDubious = function (controlIndex) {
        return this.originalCumTimes[controlIndex] !== this.cumTimes[controlIndex];
    };
    
    /**
    * Returns the rank of the competitor's split to the given control.  If the
    * control index given is zero (i.e. the start), or if the competitor has no
    * time recorded for that control, or the ranks have not been set on this
    * competitor, null is returned.
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getSplitRankTo = function (controlIndex) {
        return (this.splitRanks === null || controlIndex === 0) ? null : this.splitRanks[controlIndex - 1];
    };
    
    /**
    * Returns the rank of the competitor's cumulative split to the given
    * control.  If the control index given is zero (i.e. the start), or if the
    * competitor has no time recorded for that control, or if the ranks have
    * not been set on this competitor, null is returned.  
    * @param {Number} controlIndex - Index of the control (0 = start).
    * @return {Number} The split time in seconds for the competitor to the
    *      given control.
    */
    Competitor.prototype.getCumulativeRankTo = function (controlIndex) {
        return (this.cumRanks === null || controlIndex === 0) ? null : this.cumRanks[controlIndex - 1];
    };
    
    /**
    * Returns the time loss of the competitor at the given control, or null if
    * time losses cannot be calculated for the competitor or have not yet been
    * calculated.
    * @param {Number} controlIndex - Index of the control.
    * @return {?Number} Time loss in seconds, or null.
    */
    Competitor.prototype.getTimeLossAt = function (controlIndex) {
        return (controlIndex === 0 || this.timeLosses === null) ? null : this.timeLosses[controlIndex - 1];
    };
    
    /**
    * Returns all of the competitor's cumulative time splits.
    * @return {Array} The cumulative split times in seconds for the competitor.
    */
    Competitor.prototype.getAllCumulativeTimes = function () {
        return this.cumTimes;
    };
    
    /**
    * Returns all of the competitor's cumulative time splits.
    * @return {Array} The cumulative split times in seconds for the competitor.
    */
    Competitor.prototype.getAllOriginalCumulativeTimes = function () {
        return this.originalCumTimes;
    };
    
    /**
    * Returns whether this competitor is missing a start time.
    * 
    * The competitor is missing its start time if it doesn't have a start time
    * and it also has at least one split.  (A competitor that has no start time
    * and no splits either didn't start the race.)
    *
    * @return {boolean} True if the competitor doesn't have a start time, false
    *     if they do, or if they have no other splits.
    */
    Competitor.prototype.lacksStartTime = function () {
        return this.startTime === null && this.splitTimes.some(isNotNull);
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
                if (referenceSplit > 0) {
                    percentsBehind.push(100 * (splitTime - referenceSplit) / referenceSplit);
                } else {
                    percentsBehind.push(null);
                }
            }
        });
        
        return percentsBehind;
    };
    
    /**
    * Determines the time losses for this competitor.
    * @param {Array} fastestSplitTimes - Array of fastest split times.
    */
    Competitor.prototype.determineTimeLosses = function (fastestSplitTimes) {
        if (this.completed()) {
            if (fastestSplitTimes.length !== this.splitTimes.length) {
                throwInvalidData("Cannot determine time loss of competitor with " + this.splitTimes.length + " split times using " + fastestSplitTimes.length + " fastest splits");
            }  else if (fastestSplitTimes.some(isNaNStrict)) {
                throwInvalidData("Cannot determine time loss of competitor when there is a NaN value in the fastest splits");
            }
            
            if (fastestSplitTimes.some(function (split) { return split === 0; })) {
                // Someone registered a zero split on this course.  In this
                // situation the time losses don't really make sense.
                this.timeLosses = this.splitTimes.map(function () { return NaN; });
            } else if (this.splitTimes.some(isNaNStrict)) {
                // Competitor has some dubious times.  Unfortunately this
                // means we cannot sensibly calculate the time losses.
                this.timeLosses = this.splitTimes.map(function () { return NaN; });
            } else {
                // We use the same algorithm for calculating time loss as the
                // original, with a simplification: we calculate split ratios
                // (split[i] / fastest[i]) rather than time loss rates
                // (split[i] - fastest[i])/fastest[i].  A control's split ratio
                // is its time loss rate plus 1.  Not subtracting one at the start
                // means that we then don't have to add it back on at the end.
                
                var splitRatios = this.splitTimes.map(function (splitTime, index) {
                    return splitTime / fastestSplitTimes[index];
                });
                
                splitRatios.sort(d3.ascending);
                
                var medianSplitRatio;
                if (splitRatios.length % 2 === 1) {
                    medianSplitRatio = splitRatios[(splitRatios.length - 1) / 2];
                } else {
                    var midpt = splitRatios.length / 2;
                    medianSplitRatio = (splitRatios[midpt - 1] + splitRatios[midpt]) / 2;
                }
                
                this.timeLosses = this.splitTimes.map(function (splitTime, index) {
                    return Math.round(splitTime - fastestSplitTimes[index] * medianSplitRatio);
                });
            }
        }
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
    
    /**
    * Returns an array of objects that record the indexes around which times in
    * the given array are NaN.
    * @param {Array} times - Array of time values.
    * @return {Array} Array of objects that record indexes around dubious times.
    */
    function getIndexesAroundDubiousTimes(times) {
        var dubiousTimeInfo = [];
        var startIndex = 1;
        while (startIndex + 1 < times.length) {
            if (isNaNStrict(times[startIndex])) {
                var endIndex = startIndex;
                while (endIndex + 1 < times.length && isNaNStrict(times[endIndex + 1])) {
                    endIndex += 1;
                }
                
                if (endIndex + 1 < times.length && times[startIndex - 1] !== null && times[endIndex + 1] !== null) {
                    dubiousTimeInfo.push({start: startIndex - 1, end: endIndex + 1});
                }
                
                startIndex = endIndex + 1;
                
            } else {
                startIndex += 1;
            }
        }
        
        return dubiousTimeInfo;
    }
    
    /**
    * Returns an array of objects that list the controls around those that have
    * dubious cumulative times.
    * @return {Array} Array of objects that detail the start and end indexes
    *     around dubious cumulative times.
    */
    Competitor.prototype.getControlIndexesAroundDubiousCumulativeTimes = function () {
        return getIndexesAroundDubiousTimes(this.cumTimes);
    };
    
    /**
    * Returns an array of objects that list the controls around those that have
    * dubious cumulative times.
    * @return {Array} Array of objects that detail the start and end indexes
    *     around dubious cumulative times.
    */
    Competitor.prototype.getControlIndexesAroundDubiousSplitTimes = function () {
        return getIndexesAroundDubiousTimes([0].concat(this.splitTimes));
    };
    
    SplitsBrowser.Model.Competitor = Competitor;
})();