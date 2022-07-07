/*
 *  SplitsBrowser data-repair - Attempt to work around nonsensical data.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var throwInvalidData = SplitsBrowser.throwInvalidData;

    // Maximum number of minutes added to finish splits to ensure that all
    // results have sensible finish splits.
    var MAX_FINISH_SPLIT_MINS_ADDED = 5;

    /**
     * Construct a Repairer, for repairing some data.
     * @constructor
     * @param {Boolean} permitZeroSplits Whether to permit zero-second splits.
    */
    var Repairer = function (permitZeroSplits) {
        this.madeAnyChanges = false;
        this.permitZeroSplits = permitZeroSplits;
    };

    /**
    * Returns the positions at which the first pair of non-ascending cumulative
    * times are found.  This is returned as an object with 'first' and 'second'
    * properties.
    *
    * If the entire array of cumulative times is strictly ascending, this
    * returns null.
    *
    * @param {Array} cumTimes Array of cumulative times.
    * @return {Object|null} Object containing indexes of non-ascending entries, or
    *     null if none found.
    */
    Repairer.prototype.getFirstNonAscendingIndexes = function (cumTimes) {
        if (cumTimes.length === 0 || cumTimes[0] !== 0) {
            throwInvalidData("cumulative times array does not start with a zero cumulative time");
        }

        var lastNumericTimeIndex = 0;

        for (var index = 1; index < cumTimes.length; index += 1) {
            var time = cumTimes[index];
            if (isNotNullNorNaN(time)) {
                // This entry is numeric.
                if (time < cumTimes[lastNumericTimeIndex] || (time === cumTimes[lastNumericTimeIndex] && (!this.permitZeroSplits || lastNumericTimeIndex < index - 1))) {
                    return {first: lastNumericTimeIndex, second: index};
                }

                lastNumericTimeIndex = index;
            }
        }

        // If we get here, the entire array is in strictly-ascending order.
        return null;
    };

    /**
    * Remove from the cumulative times given any individual times that cause
    * negative splits and whose removal leaves all of the remaining splits in
    * strictly-ascending order.
    *
    * This method does not compare the last two cumulative times, so if the
    * finish time is not after the last control time, no changes will be made.
    *
    * @param {Array} cumTimes Array of cumulative times.
    * @return {Array} Array of cumulaive times with perhaps some cumulative
    *     times taken out.
    */
    Repairer.prototype.removeCumulativeTimesCausingNegativeSplits = function (cumTimes) {

        var nonAscIndexes = this.getFirstNonAscendingIndexes(cumTimes);
        while (nonAscIndexes !== null && nonAscIndexes.second + 1 < cumTimes.length) {

            // So, we have a pair of cumulative times that are not in strict
            // ascending order, with the second one not being the finish.  If
            // the second time is not the finish cumulative time for a
            // completing result, try the following in order until we get a
            // list of cumulative times in ascending order:
            // * Remove the second cumulative time,
            // * Remove the first cumulative time.
            // If one of these allows us to push the next non-ascending indexes
            // beyond the second, remove the offending time and keep going.  By
            // 'remove' we mean 'replace with NaN'.
            //
            // We don't want to remove the finish time for a result as that
            // removes their total time as well.  If the result didn't
            // complete the course, then we're not so bothered; they've
            // mispunched so they don't have a total time anyway.

            var first = nonAscIndexes.first;
            var second = nonAscIndexes.second;

            var progress = false;

            for (var attempt = 1; attempt <= 3; attempt += 1) {
                // 1 = remove second, 2 = remove first, 3 = remove first and the one before.
                var adjustedCumTimes = cumTimes.slice();

                if (attempt === 3 && (first === 1 || !isNotNullNorNaN(cumTimes[first - 1]))) {
                    // Can't remove first and the one before because there
                    // isn't a time before or it's already blank.
                } else {
                    if (attempt === 1) {
                        adjustedCumTimes[second] = NaN;
                    } else if (attempt === 2 && first > 0) {
                        adjustedCumTimes[first] = NaN;
                    } else if (attempt === 3 && first > 1) {
                        adjustedCumTimes[first] = NaN;
                        adjustedCumTimes[first - 1] = NaN;
                    }

                    var nextNonAscIndexes = this.getFirstNonAscendingIndexes(adjustedCumTimes);
                    if (nextNonAscIndexes === null || nextNonAscIndexes.first > second) {
                        progress = true;
                        cumTimes = adjustedCumTimes;
                        this.madeAnyChanges = true;
                        nonAscIndexes = nextNonAscIndexes;
                        break;
                    }
                }
            }

            if (!progress) {
                break;
            }
        }

        return cumTimes;
    };

    /**
    * Removes the finish cumulative time from a result if it is absurd.
    *
    * It is absurd if it is less than the time at the previous control by at
    * least the maximum amount of time that can be added to finish splits.
    *
    * @param {Array} cumTimes The cumulative times to perhaps remove the
    *     finish split from.
    */
    Repairer.prototype.removeFinishTimeIfAbsurd = function (cumTimes) {
        var finishTime = cumTimes[cumTimes.length - 1];
        var lastControlTime = cumTimes[cumTimes.length - 2];
        if (isNotNullNorNaN(finishTime) && isNotNullNorNaN(lastControlTime) && finishTime <= lastControlTime - MAX_FINISH_SPLIT_MINS_ADDED * 60) {
            cumTimes[cumTimes.length - 1] = NaN;
            this.madeAnyChanges = true;
        }
    };

    /**
    * Attempts to repair the cumulative times within a result.  The repaired
    * cumulative times are written back into the result.
    *
    * @param {Result} result Result whose cumulative times we wish to repair.
    */
    Repairer.prototype.repairResult = function (result) {
        var cumTimes = result.originalCumTimes.slice(0);

        cumTimes = this.removeCumulativeTimesCausingNegativeSplits(cumTimes);

        if (!result.completed()) {
            this.removeFinishTimeIfAbsurd(cumTimes);
        }

        result.setRepairedCumulativeTimes(cumTimes);
    };

    /**
    * Attempt to repair all of the data within a course-class.
    * @param {CourseClass} courseClass The class whose data we wish to
    *     repair.
    */
    Repairer.prototype.repairCourseClass = function (courseClass) {
        this.madeAnyChanges = false;
        courseClass.results.forEach(function (result) {
            this.repairResult(result);
        }, this);

        if (this.madeAnyChanges) {
            courseClass.recordHasDubiousData();
        }
    };

    /**
    * Attempt to carry out repairs to the data in an event.
    * @param {Event} eventData The event data to repair.
    */
    Repairer.prototype.repairEventData = function (eventData) {
        eventData.classes.forEach(function (courseClass) {
            this.repairCourseClass(courseClass);
        }, this);
    };

    /**
    * Attempt to carry out repairs to the data in an event.
    * @param {Event} eventData The event data to repair.
    * @param {Boolean} permitZeroSplits Whether zero-second splits are permitted.
    */
    function repairEventData(eventData, permitZeroSplits) {
        var repairer = new Repairer(permitZeroSplits);
        repairer.repairEventData(eventData);
    }

    /**
    * Transfer the 'original' data for each result to the 'final' data.
    *
    * This is used if the input data has been read in a format that requires
    * the data to be checked, but the user has opted not to perform any such
    * reparations and wishes to view the original data.
    * @param {Event} eventData The event data to repair.
    */
    function transferResultData(eventData) {
        eventData.classes.forEach(function (courseClass) {
            courseClass.results.forEach(function (result) {
                result.setRepairedCumulativeTimes(result.getAllOriginalCumulativeTimes());
            });
        });
    }

    SplitsBrowser.DataRepair = {
        repairEventData: repairEventData,
        transferResultData: transferResultData
    };
})();