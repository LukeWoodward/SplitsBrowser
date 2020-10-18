/*
 *  SplitsBrowser Result - The results for a competitor or a team.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    const NUMBER_TYPE = typeof 0;

    const isNotNull = SplitsBrowser.isNotNull;
    const isNaNStrict = SplitsBrowser.isNaNStrict;
    const hasProperty = SplitsBrowser.hasProperty;
    const addIfNotNull = SplitsBrowser.addIfNotNull;
    const subtractIfNotNull = SplitsBrowser.subtractIfNotNull;
    const throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
    * Function used with the JavaScript sort method to sort results in order.
    *
    * Results that are mispunched are sorted to the end of the list.
    *
    * The return value of this method will be:
    * (1) a negative number if result a comes before result b,
    * (2) a positive number if result a comes after result a,
    * (3) zero if the order of a and b makes no difference (i.e. they have the
    *     same total time, or both mispunched.)
    *
    * @param {SplitsBrowser.Model.Result} a One result to compare.
    * @param {SplitsBrowser.Model.Result} b The other result to compare.
    * @return {Number} Result of comparing two results.
    */
    SplitsBrowser.Model.compareResults = function (a, b) {
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
    * Convert an array of cumulative times into an array of split times.
    * If any null cumulative splits are given, the split times to and from that
    * control are null also.
    *
    * The input array should begin with a zero, for the cumulative time to the
    * start.
    * @param {Array} cumTimes Array of cumulative split times.
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

        let splitTimes = [];
        for (let i = 0; i + 1 < cumTimes.length; i += 1) {
            splitTimes.push(subtractIfNotNull(cumTimes[i + 1], cumTimes[i]));
        }

        return splitTimes;
    }

    /**
    * Object that represents the data for a single competitor or team.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * or team appears in the given list of results.  Its sole use is to stabilise
    * sorts of competitors or teams, as JavaScript's sort() method is not
    * guaranteed to be a stable sort.  However, it is not strictly the finishing
    * order of the competitors, as it has been known for them to be given not in
    * the correct order.
    *
    * The split and cumulative times passed here should be the 'original' times,
    * before any attempt is made to repair the data.
    *
    * It is not recommended to use this constructor directly.  Instead, use one
    * of the factory methods fromCumTimes or fromOriginalCumTimes to pass in
    * either the split or cumulative times and have the other calculated.
    *
    * @constructor
    * @param {Number} order The order of the result.
    * @param {Number|null} startTime The start time of the competitor or team, in
    *      seconds past midnight
    * @param {Array} originalSplitTimes Array of split times, as numbers,
    *      with nulls for missed controls.
    * @param {Array} originalCumTimes Array of cumulative times, as
    *      numbers, with nulls for missed controls.
    & @param {Object} owner The competitor or team that recorded this result.
    */
    class Result {
        constructor(order, startTime, originalSplitTimes, originalCumTimes, owner) {
            if (typeof order !== NUMBER_TYPE) {
                throwInvalidData(`Result order must be a number, got ${typeof order} '${order}' instead`);
            }

            if (typeof startTime !== NUMBER_TYPE && startTime !== null) {
                throwInvalidData(`Start time must be a number, got ${typeof startTime} '${startTime}' instead`);
            }

            this.order = order;
            this.startTime = startTime;
            this.owner = owner;

            this.isOKDespiteMissingTimes = false;
            this.isNonCompetitive = false;
            this.isNonStarter = false;
            this.isNonFinisher = false;
            this.isDisqualified = false;
            this.isOverMaxTime = false;

            this.originalSplitTimes = originalSplitTimes;
            this.originalCumTimes = originalCumTimes;
            this.splitTimes = null;
            this.cumTimes = null;
            this.splitRanks = null;
            this.cumRanks = null;
            this.timeLosses = null;
            this.className = null;
            this.offsets = null;

            this.totalTime = (originalCumTimes === null || originalCumTimes.includes(null)) ? null : originalCumTimes[originalCumTimes.length - 1];
        }

        /**
        * Marks this result as having completed the course despite having missing times.
        */
        setOKDespiteMissingTimes() {
            this.isOKDespiteMissingTimes = true;
            if (this.originalCumTimes !== null) {
                this.totalTime = this.originalCumTimes[this.originalCumTimes.length - 1];
            }
        }

        /**
        * Marks this result as non-competitive.
        */
        setNonCompetitive() {
            this.isNonCompetitive = true;
        }

        /**
        * Marks this result as not starting.
        */
        setNonStarter() {
            this.isNonStarter = true;
        }

        /**
        * Marks this result as not finishing.
        */
        setNonFinisher() {
            this.isNonFinisher = true;
        }

        /**
        * Marks this result as disqualified, for reasons other than a missing
        * punch.
        */
        disqualify() {
            this.isDisqualified = true;
        }

        /**
        * Marks this result as over maximum time.
        */
        setOverMaxTime() {
            this.isOverMaxTime = true;
        }

        /**
        * Sets the name of the class that the result belongs to.
        * This is the course-class, not the result's age class.
        * @param {String} className The name of the class.
        */
        setClassName(className) {
            this.className = className;
        }

        /**
        * Sets the control offsets of the various competitors that make up the team.
        * offsets[legIndex] should be the index of the start control of the competitor
        * who ran in leg 'legIndex'.
        * @param {Array} offsets The control offsets of the competitors.
        */
        setOffsets(offsets) {
            this.offsets = offsets;
        }

        /**
        * Sets the 'repaired' cumulative times.  This also calculates the repaired
        * split times.
        * @param {Array} cumTimes The 'repaired' cumulative times.
        */
        setRepairedCumulativeTimes(cumTimes) {
            this.cumTimes = cumTimes;
            this.splitTimes = splitTimesFromCumTimes(cumTimes);
        }

        /**
        * Returns whether this result indicated the competitor or team completed the
        * course and did not get
        * disqualified.
        * @return {Boolean} True if the competitor or team completed the course and
        *     did not get disqualified, false if they did not complete the course or
        *     got disqualified.
        */
        completed() {
            return this.totalTime !== null && !this.isDisqualified && !this.isOverMaxTime;
        }

        /**
        * Returns whether the result has any times at all.
        * @return {Boolean} True if the result includes at least one time,
        *     false if the result has no times.
        */
        hasAnyTimes() {
            // Trim the leading zero
            return this.originalCumTimes.slice(1).some(isNotNull);
        }

        /**
        * Returns the split to the given control.  If the control index given is zero
        * (i.e. the start), zero is returned.  If the competitor or team has no time
        * recorded for that control, null is returned.  If the value is missing,
        * because the value read from the file was invalid, NaN is returned.
        *
        * @param {Number} controlIndex Index of the control (0 = start).
        * @return {Number|null} The split time in seconds to the given control.
        */
        getSplitTimeTo(controlIndex) {
            return (controlIndex === 0) ? 0 : this.splitTimes[controlIndex - 1];
        }

        /**
        * Returns the 'original' split to the given control.  This is always the
        * value read from the source data file, or derived directly from this data,
        * before any attempt was made to repair the data.
        *
        * If the control index given is zero (i.e. the start), zero is returned.
        * If no time is recorded for that control, null is returned.
        * @param {Number} controlIndex Index of the control (0 = start).
        * @return {Number|null} The split time in seconds to the given control.
        */
        getOriginalSplitTimeTo(controlIndex) {
            if (this.isNonStarter) {
                return null;
            } else {
                return (controlIndex === 0) ? 0 : this.originalSplitTimes[controlIndex - 1];
            }
        }

        /**
        * Returns whether the control with the given index is deemed to have a
        * dubious split time.
        * @param {Number} controlIndex The index of the control.
        * @return {Boolean} True if the split time to the given control is dubious,
        *     false if not.
        */
        isSplitTimeDubious(controlIndex) {
            return (controlIndex > 0 && this.originalSplitTimes[controlIndex - 1] !== this.splitTimes[controlIndex - 1]);
        }

        /**
        * Returns the cumulative split to the given control.  If the control index
        * given is zero (i.e. the start), zero is returned.   If there is no
        * cumulative time recorded for that control, null is returned.  If no time
        * is recorded, but the time was deemed to be invalid, NaN will be returned.
        * @param {Number} controlIndex Index of the control (0 = start).
        * @return {Number|null} The cumulative split time in seconds to the given control.
        */
        getCumulativeTimeTo(controlIndex) {
            return this.cumTimes[controlIndex];
        }

        /**
        * Returns the 'original' cumulative time the competitor or team took to the
        * given control.  This is always the value read from the source data file,
        * before any attempt was made to repair the data.
        * @param {Number} controlIndex Index of the control (0 = start).
        * @return {Number|null} The cumulative split time in seconds to the given control.
        */
        getOriginalCumulativeTimeTo(controlIndex) {
            return (this.isNonStarter) ? null : this.originalCumTimes[controlIndex];
        }

        /**
        * Returns whether the control with the given index is deemed to have a
        * dubious cumulative time.
        * @param {Number} controlIndex The index of the control.
        * @return {Boolean} True if the cumulative time to the given control is
        *     dubious, false if not.
        */
        isCumulativeTimeDubious(controlIndex) {
            return this.originalCumTimes[controlIndex] !== this.cumTimes[controlIndex];
        }

        /**
        * Returns the rank of the split to the given control.  If the control index
        * given is zero (i.e. the start), or if there is no time recorded for that
        * control, or the ranks have not been set on this result, null is
        * returned.
        * @param {Number} controlIndex Index of the control (0 = start).
        * @return {Number|null} The split rank to the given control.
        */
        getSplitRankTo(controlIndex) {
            return (this.splitRanks === null) ? null : this.splitRanks[controlIndex];
        }

        /**
        * Returns the rank of the cumulative split to the given control.  If the
        * control index given is zero (i.e. the start), or if there is no time
        * recorded for that control, or if the ranks have not been set on this
        * result, null is returned.
        * @param {Number} controlIndex Index of the control (0 = start).
        * @return {Number|null} The cumulative rank to the given control.
        */
        getCumulativeRankTo(controlIndex) {
            return (this.cumRanks === null) ? null : this.cumRanks[controlIndex];
        }

        /**
        * Returns the time loss at the given control, or null if time losses cannot
        * be calculated or have not yet been calculated.
        * @param {Number} controlIndex Index of the control.
        * @return {Number|null} Time loss in seconds, or null.
        */
        getTimeLossAt(controlIndex) {
            return (controlIndex === 0 || this.timeLosses === null) ? null : this.timeLosses[controlIndex - 1];
        }

        /**
        * Returns all of the cumulative time splits.
        * @return {Array} The cumulative split times in seconds for the competitor
        *     or team.
        */
        getAllCumulativeTimes() {
            return this.cumTimes;
        }

        /**
        * Returns all of the original cumulative time splits.
        * @return {Array} The original cumulative split times in seconds for the
        *     competitor or team.
        */
        getAllOriginalCumulativeTimes() {
            return this.originalCumTimes;
        }

        /**
        * Returns all of the split times.
        * @return {Array} The split times in seconds for the competitor or team.
        */
        getAllSplitTimes() {
            return this.splitTimes;
        }

        /**
        * Returns whether this result is missing a start time.
        *
        * The result is missing its start time if it doesn't have a start time and
        * it also has at least one split.  This second condition allows the Race
        * Graph to be shown even if there are results with no times and no start
        * time.
        *
        * @return {Boolean} True if there is no a start time, false if there is, or
        *     if they have no other splits.
        */
        lacksStartTime() {
            return this.startTime === null && this.splitTimes.some(isNotNull);
        }

        /**
        * Sets the split and cumulative-split ranks for this result.  The first
        * items in both arrays should be null, to indicate that the split and
        * cumulative ranks don't make any sense at the start.
        * @param {Array} splitRanks Array of split ranks for this result.
        * @param {Array} cumRanks Array of cumulative-split ranks for this result.
        */
        setSplitAndCumulativeRanks(splitRanks, cumRanks) {
            if (splitRanks[0] !== null || cumRanks[0] !== null) {
                throwInvalidData("Split and cumulative ranks arrays must both start with null");
            }

            this.splitRanks = splitRanks;
            this.cumRanks = cumRanks;
        }

        /**
        * Return this result's cumulative times after being adjusted by a 'reference'
        * result.
        * @param {Array} referenceCumTimes The reference cumulative-split-time data
        *     to adjust by.
        * @return {Array} The array of adjusted data.
        */
        getCumTimesAdjustedToReference(referenceCumTimes) {
            if (referenceCumTimes.length !== this.cumTimes.length) {
                throwInvalidData(`Cannot adjust cumulative times because the numbers of times are different (${this.cumTimes.length} and ${referenceCumTimes.length})`);
            } else if (referenceCumTimes.indexOf(null) > -1) {
                throwInvalidData("Cannot adjust cumulative times because a null value is in the reference data");
            }

            let adjustedTimes = this.cumTimes.map((time, idx) => subtractIfNotNull(time, referenceCumTimes[idx]));
            return adjustedTimes;
        }

        /**
        * Returns the cumulative times of this result with the start time added on.
        * @param {Array} referenceCumTimes The reference cumulative-split-time data to adjust by.
        * @return {Array} The array of adjusted data.
        */
        getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes) {
            let adjustedTimes = this.getCumTimesAdjustedToReference(referenceCumTimes);
            let startTime = this.startTime;
            return adjustedTimes.map(adjTime => addIfNotNull(adjTime, startTime));
        }

        /**
        * Returns an array of percentages that this splits are behind when compared
        * to those of a reference result.
        * @param {Array} referenceCumTimes The reference cumulative split times
        * @return {Array} The array of percentages.
        */
        getSplitPercentsBehindReferenceCumTimes(referenceCumTimes) {
            if (referenceCumTimes.length !== this.cumTimes.length) {
                throwInvalidData(`Cannot determine percentages-behind because the numbers of times are different (${this.cumTimes.length} and ${referenceCumTimes.length})`);
            } else if (referenceCumTimes.includes(null)) {
                throwInvalidData("Cannot determine percentages-behind because a null value is in the reference data");
            }

            let percentsBehind = [0];
            this.splitTimes.forEach((splitTime, index) => {
                if (splitTime === null) {
                    percentsBehind.push(null);
                } else {
                    let referenceSplit = referenceCumTimes[index + 1] - referenceCumTimes[index];
                    if (referenceSplit > 0) {
                        percentsBehind.push(100 * (splitTime - referenceSplit) / referenceSplit);
                    } else {
                        percentsBehind.push(null);
                    }
                }
            });

            return percentsBehind;
        }

        /**
        * Determines the time losses for this result.
        * @param {Array} fastestSplitTimes Array of fastest split times.
        */
        determineTimeLosses(fastestSplitTimes) {
            if (this.completed()) {
                if (fastestSplitTimes.length !== this.splitTimes.length) {
                    throwInvalidData(`Cannot determine time loss with ${this.splitTimes.length} split times using ${fastestSplitTimes.length} fastest splits`);
                } else if (fastestSplitTimes.some(isNaNStrict)) {
                    throwInvalidData("Cannot determine time loss when there is a NaN value in the fastest splits");
                }

                if (fastestSplitTimes.some(split => split === 0)) {
                    // Someone registered a zero split on this course.  In this
                    // situation the time losses don't really make sense.
                    this.timeLosses = this.splitTimes.map(() => NaN);
                } else if (this.isOKDespiteMissingTimes || this.splitTimes.some(isNaNStrict)) {
                    // There are some missing or dubious times.  Unfortunately
                    // this means we cannot sensibly calculate the time losses.
                    this.timeLosses = this.splitTimes.map(() => NaN);
                } else {
                    // We use the same algorithm for calculating time loss as the
                    // original, with a simplification: we calculate split ratios
                    // (split[i] / fastest[i]) rather than time loss rates
                    // (split[i] - fastest[i])/fastest[i].  A control's split ratio
                    // is its time loss rate plus 1.  Not subtracting one at the start
                    // means that we then don't have to add it back on at the end.
                    let splitRatios = this.splitTimes.map((splitTime, index) => splitTime / fastestSplitTimes[index]);

                    splitRatios.sort(d3.ascending);

                    let medianSplitRatio;
                    if (splitRatios.length % 2 === 1) {
                        medianSplitRatio = splitRatios[(splitRatios.length - 1) / 2];
                    } else {
                        let midpt = splitRatios.length / 2;
                        medianSplitRatio = (splitRatios[midpt - 1] + splitRatios[midpt]) / 2;
                    }

                    this.timeLosses = this.splitTimes.map((splitTime, index) =>
                        Math.round(splitTime - fastestSplitTimes[index] * medianSplitRatio));
                }
            }
        }

        /**
        * Returns whether this result 'crosses' another.  Two results are considered
        * to have crossed if their chart lines on the Race Graph cross.
        * @param {Result} other The result to compare against.
        * @param {Number|null} selectedLegIndex The index of the selected leg, or null to
        *     not filter by selected leg.
        * @return {Boolean} True if the results cross, false if they don't.
        */
        crosses(other, selectedLegIndex) {
            if (other.cumTimes.length !== this.cumTimes.length) {
                throwInvalidData("Two results with different numbers of controls cannot cross");
            }

            // We determine whether two results cross by keeping track of whether
            // this result is ahead of other at any point, and whether this result
            // is behind the other one.  If both, the results cross.
            let beforeOther = false;
            let afterOther = false;

            // Determine the range of controls to check.
            let startIndex;
            let endIndex;
            if (selectedLegIndex === null || this.offsets === null) {
                startIndex = 0;
                endIndex = this.cumTimes.length;
            } else {
                startIndex = this.offsets[selectedLegIndex];
                endIndex = (selectedLegIndex + 1 === this.offsets.length) ? this.cumTimes.length : this.offsets[selectedLegIndex + 1] + 1;
            }

            for (let controlIdx = startIndex; controlIdx < endIndex; controlIdx += 1) {
                if (this.cumTimes[controlIdx] !== null && other.cumTimes[controlIdx] !== null) {
                    let thisTotalTime = this.startTime + this.cumTimes[controlIdx];
                    let otherTotalTime = other.startTime + other.cumTimes[controlIdx];
                    if (thisTotalTime < otherTotalTime) {
                        beforeOther = true;
                    } else if (thisTotalTime > otherTotalTime) {
                        afterOther = true;
                    }
                }
            }

            return beforeOther && afterOther;
        }

        /**
        * Returns whether the given time has been omitted: i.e. it is dubious, or
        * it is missing but the result has been marked as OK despite that.
        * @param {Number|null} time The time to test.
        * @return {Boolean} True if the time is dubious or missing, false if not.
        */
        isTimeOmitted(time) {
            return isNaNStrict(time) || (this.isOKDespiteMissingTimes && time === null);
        }

        /**
        * Returns an array of objects that record the indexes around which times in
        * the given array are omitted, due to the times being dubious or missing.
        * @param {Array} times Array of time values.
        * @return {Array} Array of objects that record indexes around omitted times.
        */
        getIndexesAroundOmittedTimes(times) {
            let omittedTimeInfo = [];
            let startIndex = 1;
            while (startIndex + 1 < times.length) {
                if (this.isTimeOmitted(times[startIndex])) {
                    let endIndex = startIndex;
                    while (endIndex + 1 < times.length && this.isTimeOmitted(times[endIndex + 1])) {
                        endIndex += 1;
                    }

                    if (endIndex + 1 < times.length && times[startIndex - 1] !== null && times[endIndex + 1] !== null) {
                        omittedTimeInfo.push({ start: startIndex - 1, end: endIndex + 1 });
                    }

                    startIndex = endIndex + 1;

                } else {
                    startIndex += 1;
                }
            }

            return omittedTimeInfo;

        }
        /**
        * Returns an array of objects that list the controls around those that have
        * omitted cumulative times.
        * @return {Array} Array of objects that detail the start and end indexes
        *     around omitted cumulative times.
        */
        getControlIndexesAroundOmittedCumulativeTimes() {
            return this.getIndexesAroundOmittedTimes(this.cumTimes);
        }

        /**
        * Returns an array of objects that list the controls around those that have
        * omitted split times.
        * @return {Array} Array of objects that detail the start and end indexes
        *     around omitted split times.
        */
        getControlIndexesAroundOmittedSplitTimes() {
            return this.getIndexesAroundOmittedTimes([0].concat(this.splitTimes));
        }

        /**
        * Returns the name of the owner for the leg with the given index.  If the
        * leg index is not null and this is a team result, the name of the corresponding
        * member is returned, otherwise the name of this result's owner is returned.
        * @param {Number|null} legIndex The index of the leg, or null for the team.
        * @return {String} The name of the owner for that leg.
        */
        getOwnerNameForLeg(legIndex) {
            if (hasProperty(this.owner, "members") && legIndex !== null) {
                return this.owner.members[legIndex].name;
            } else {
                return this.owner.name;
            }
        }

        /**
        * Determines the status of a relay result from the status of the component
        * results and records it within this result.
        * @param {Array} results The array of component results.
        */
        determineAggregateStatus(results) {
            if (results.some(result => result.isDisqualified)) {
                this.isDisqualified = true;
                return;
            }

            if (results.every(result => result.isNonStarter)) {
                this.isNonStarter = true;
                return;
            }

            // After this loop, okResultIndex points to the last OK result, or -1 if none.
            let okResultIndex;
            for (okResultIndex = -1; okResultIndex + 1 < results.length; okResultIndex += 1) {
                let nextResult = results[okResultIndex + 1];
                if (nextResult.isNonStarter || nextResult.isNonFinisher || !nextResult.completed()) {
                    break;
                }
            }

            // After this loop, dnsResultIndex points to the last DNS result, or the end of the list if none.
            let dnsResultIndex;
            for (dnsResultIndex = results.length; dnsResultIndex > 0; dnsResultIndex -= 1) {
                let prevResult = results[dnsResultIndex - 1];
                if (!prevResult.isNonStarter) {
                    break;
                }
            }

            if (okResultIndex < results.length - 1) {
                if (okResultIndex + 1 === dnsResultIndex) {
                    // A run of OK results then some DNS ones.
                    this.isNonFinisher = true;
                    return;
                }

                if (okResultIndex + 2 === dnsResultIndex && results[okResultIndex + 1].isNonFinisher) {
                    // A run of OK results then a DNF and then possibly some DNS ones.
                    this.isNonFinisher = true;
                    return;
                }
            }

            if (results.some(result => result.isOverMaxTime)) {
                this.isOverMaxTime = true;
                return;
            }

            if (results.some(result => result.isNonCompetitive)) {
                this.isNonCompetitive = true;
            }

            if (results.some(result => result.isOKDespiteMissingTimes)) {
                this.setOKDespiteMissingTimes();
            }
        }

        /**
        * Create and return a Result object where the times are given as a list of
        * cumulative times.
        *
        * This method does not assume that the data given has been 'repaired'.  This
        * function should therefore be used to create a result if the data may later
        * need to be repaired.
        *
        * @param {Number} order The order of the result.
        * @param {Number|null} startTime The start time, as seconds past midnight.
        * @param {Array} cumTimes Array of cumulative split times, as numbers, with
        *     nulls for missed controls.
        & @param {Object} owner The competitor or team that recorded this result.
        * @return {Result} Created result.
        */
        static fromOriginalCumTimes(order, startTime, cumTimes, owner) {
            let splitTimes = splitTimesFromCumTimes(cumTimes);
            return new Result(order, startTime, splitTimes, cumTimes, owner);
        }

        /**
        * Create and return a Result object where the times are given as a list of
        * cumulative times.
        *
        * This method assumes that the data given has been repaired, so it is ready
        * to be viewed.
        *
        * @param {Number} order The order of the result.
        * @param {Number|null} startTime The start time, as seconds past midnight.
        * @param {Array} cumTimes Array of cumulative split times, as numbers, with
        *     nulls for missed controls.
        & @param {Object} owner The competitor or team that recorded this result.
        * @return {Result} Created result.
        */
        static fromCumTimes(order, startTime, cumTimes, owner) {
            let result = Result.fromOriginalCumTimes(order, startTime, cumTimes, owner);
            result.splitTimes = result.originalSplitTimes;
            result.cumTimes = result.originalCumTimes;
            return result;
        }

        /**
        * Creates and returns a result object representing the combined result of all
        * of the given results.
        * @param {Number} order The order of the team among the others.
        * @param {Array} results The individual team member results.
        * @param {Object} owner The team that owns this result.
        * @return {Result} A result object for the entire team.
        */
        static createTeamResult(order, results, owner) {
            if (results.length < 2) {
                throwInvalidData("Team results can only be created from at least two other results");
            }

            // Firstly, compute cumulative-time offsets for each of the component results.
            let offsets = calculateOffsets(results);
            owner.setMembers(results.map(result => result.owner));

            let originalCumTimes = calculateCumulativeTimesFromResults(
                results, offsets, result => result.originalCumTimes);

            let teamResult = Result.fromOriginalCumTimes(order, results[0].startTime, originalCumTimes, owner);
            if (results.every(result => result.cumTimes !== null)) {
                teamResult.cumTimes = calculateCumulativeTimesFromResults(
                    results, offsets, r => r.cumTimes);
                teamResult.splitTimes = splitTimesFromCumTimes(teamResult.cumTimes);
            }

            teamResult.determineAggregateStatus(results);
            return teamResult;
        }
    }

    /**
    * Calculates and returns the offsets of the results.  The returned array
    * contains one offset for each result plus the overall total time in the
    * last element.
    * @param {Array} results The array of results.
    * @return {Array} Array of offsets.
    */
    function calculateOffsets(results) {
        let offsets = [0];
        results.forEach((comp, resultIndex) => {

            // Calculate the offset for result resultIndex + 1.
            let lastOffset = offsets[offsets.length - 1];
            let nextResult = (resultIndex + 1 < results.length) ? results[resultIndex + 1] : null;
            let nextFinishTime;
            if (lastOffset !== null && comp.totalTime !== null) {
                // We have an offset for the last result and their total time.
                nextFinishTime = lastOffset + comp.totalTime;
            } else if (nextResult !== null && nextResult.startTime !== null && results[0].startTime !== null) {
                // Use the start time of the next result.
                nextFinishTime = nextResult.startTime - results[0].startTime;
            } else {
                nextFinishTime = null;
            }

            offsets.push(nextFinishTime);
        });

        // The above loop will add an item to the end of 'offsets' for the
        // finish time of the last competitor, but we don't need that.
        return offsets.slice(0, offsets.length - 1);
    }

    /**
    * Calculate the full list of cumulative times for a collection of results.
    * @param {Array} results The list of results.
    * @param {Array} offsets The offsets of the results.
    * @param {Function} cumulativeTimesGetter Function that returns a list of
    *     cumulative times from a result.
    * @return {Array} The full list of cumulative times.
    */
    function calculateCumulativeTimesFromResults(results, offsets, cumulativeTimesGetter) {
        let times = [0];
        for (let resultIndex = 0; resultIndex < results.length; resultIndex += 1) {
            let resultTimes = cumulativeTimesGetter(results[resultIndex]);
            for (let controlIndex = 1; controlIndex < resultTimes.length; controlIndex += 1) {
                times.push(addIfNotNull(offsets[resultIndex], resultTimes[controlIndex]));
            }
        }

        return times;
    }

    SplitsBrowser.Model.Result = Result;
})();