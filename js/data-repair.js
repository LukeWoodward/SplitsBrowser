/*
 *  SplitsBrowser data-repair - Attempt to work around nonsensical data.
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

    const isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    const throwInvalidData = SplitsBrowser.throwInvalidData;

    // Maximum number of minutes added to finish splits to ensure that all
    // results have sensible finish splits.
    const MAX_FINISH_SPLIT_MINS_ADDED = 5;

    /**
     * Construct a Repairer, for repairing some data.
     */
    class Repairer {
        constructor() {
            this.madeAnyChanges = false;
        }

        /**
         * Remove, by setting to NaN, any cumulative time that is equal to the
         * previous cumulative time.
         * @param {Array} cumTimes Array of cumulative times.
         */
        removeCumulativeTimesEqualToPrevious(cumTimes) {
            let lastCumTime = cumTimes[0];
            for (let index = 1; index + 1 < cumTimes.length; index += 1) {
                if (cumTimes[index] !== null) {
                    if (cumTimes[index] === lastCumTime) {
                        cumTimes[index] = NaN;
                        this.madeAnyChanges = true;
                    } else {
                        lastCumTime = cumTimes[index];
                    }
                }
            }
        }

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
        removeCumulativeTimesCausingNegativeSplits(cumTimes) {
            let nonAscIndexes = getFirstNonAscendingIndexes(cumTimes);
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
                let first = nonAscIndexes.first;
                let second = nonAscIndexes.second;

                let progress = false;

                for (let attempt = 1; attempt <= 3; attempt += 1) {
                    // 1 = remove second, 2 = remove first, 3 = remove first and the one before.
                    let adjustedCumTimes = cumTimes.slice();

                    if (attempt === 3 && (first === 1 || !isNotNullNorNaN(cumTimes[first - 1]))) {
                        // Can't remove first and the one before because there
                        // isn't a time before or it's already blank.
                    } else {
                        if (attempt === 1) {
                            adjustedCumTimes[second] = NaN;
                        } else if (attempt === 2) {
                            adjustedCumTimes[first] = NaN;
                        } else if (attempt === 3) {
                            adjustedCumTimes[first] = NaN;
                            adjustedCumTimes[first - 1] = NaN;
                        }

                        let nextNonAscIndexes = getFirstNonAscendingIndexes(adjustedCumTimes);
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
        }

        /**
         * Removes the finish cumulative time from a result if it is absurd.
         *
         * It is absurd if it is less than the time at the previous control by at
         * least the maximum amount of time that can be added to finish splits.
         *
         * @param {Array} cumTimes The cumulative times to perhaps remove the
         *     finish split from.
         */
        removeFinishTimeIfAbsurd(cumTimes) {
            let finishTime = cumTimes[cumTimes.length - 1];
            let lastControlTime = cumTimes[cumTimes.length - 2];
            if (isNotNullNorNaN(finishTime) && isNotNullNorNaN(lastControlTime) && finishTime <= lastControlTime - MAX_FINISH_SPLIT_MINS_ADDED * 60) {
                cumTimes[cumTimes.length - 1] = NaN;
                this.madeAnyChanges = true;
            }
        }

        /**
         * Attempts to repair the cumulative times within a result.  The repaired
         * cumulative times are written back into the result.
         *
         * @param {Result} result Result whose cumulative times we wish to repair.
         */
        repairResult(result) {
            let cumTimes = result.originalCumTimes.slice(0);

            this.removeCumulativeTimesEqualToPrevious(cumTimes);

            cumTimes = this.removeCumulativeTimesCausingNegativeSplits(cumTimes);

            if (!result.completed()) {
                this.removeFinishTimeIfAbsurd(cumTimes);
            }

            result.setRepairedCumulativeTimes(cumTimes);
        }

        /**
         * Attempt to repair all of the data within a course-class.
         * @param {CourseClass} courseClass The class whose data we wish to
         *     repair.
         */
        repairCourseClass(courseClass) {
            this.madeAnyChanges = false;
            for (let result of courseClass.results) {
                this.repairResult(result);
            }

            if (this.madeAnyChanges) {
                courseClass.recordHasDubiousData();
            }
        }

        /**
         * Attempt to carry out repairs to the data in an event.
         * @param {Event} eventData The event data to repair.
         */
        repairEventData(eventData) {
            for (let courseClass of eventData.classes) {
                this.repairCourseClass(courseClass);
            }
        }
    }

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
    function getFirstNonAscendingIndexes(cumTimes) {
        if (cumTimes.length === 0 || cumTimes[0] !== 0) {
            throwInvalidData("cumulative times array does not start with a zero cumulative time");
        }

        let lastNumericTimeIndex = 0;

        for (let index = 1; index < cumTimes.length; index += 1) {
            let time = cumTimes[index];
            if (isNotNullNorNaN(time)) {
                // This entry is numeric.
                if (time <= cumTimes[lastNumericTimeIndex]) {
                    return {first: lastNumericTimeIndex, second: index};
                }

                lastNumericTimeIndex = index;
            }
        }

        // If we get here, the entire array is in strictly-ascending order.
        return null;
    }

    /**
     * Attempt to carry out repairs to the data in an event.
     * @param {Event} eventData The event data to repair.
     */
    function repairEventData(eventData) {
        let repairer = new Repairer();
        repairer.repairEventData(eventData);
    }

    /**
     * Transfer the 'original' data for each result to the 'final' data.
     *
     * This is used if the input data has been read in a format that requires
     * the data to be checked, but the user has opted not to perform any such
     * reparations and wishes to view the
     * @param {Event} eventData The event data to repair.
     */
    function transferResultData(eventData) {
        for (let courseClass of eventData.classes) {
            for (let result of courseClass.results) {
                result.setRepairedCumulativeTimes(result.getAllOriginalCumulativeTimes());
            }
        }
    }

    SplitsBrowser.DataRepair = {
        repairEventData: repairEventData,
        transferResultData: transferResultData
    };
})();