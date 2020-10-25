/*
 *  SplitsBrowser CourseClass - A collection of runners competing against each other.
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
(function (){
    "use strict";

    const isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    const throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
     * Object that represents a collection of result data for a class.
     * @constructor.
     * @param {String} name Name of the class.
     * @param {Number} numControls Number of controls.
     * @param {Array} results Array of Result objects.
     */
    class CourseClass {
        constructor(name, numControls, results) {
            this.name = name;
            this.numControls = numControls;
            this.numbersOfControls = null;
            this.offsets = null;
            this.results = results;
            this.course = null;
            this.hasDubiousData = false;
            this.isTeamClass = false;
            for (let result of this.results) {
                result.setClassName(name);
            }
        }

        /**
         * Records that this course-class has result data that SplitsBrowser has
         * deduced as dubious.
         */
        recordHasDubiousData() {
            this.hasDubiousData = true;
        }

        /**
         * Records that this course-class contains team results rather than
         * individual results.
         * @param {Array} numbersOfControls The numbers of controls on the relay legs.
         */
        setIsTeamClass(numbersOfControls) {
            this.isTeamClass = true;
            this.numbersOfControls = numbersOfControls;
            this.offsets = [0];
            for (let index = 1; index < numbersOfControls.length; index += 1) {
                this.offsets.push(this.offsets[index - 1] + numbersOfControls[index - 1] + 1);
            }
            for (let result of this.results) {
                result.setOffsets(this.offsets);
            }
        }

        /**
         * Determines the time losses for the results in this course-class.
         */
        determineTimeLosses() {
            const fastestSplitTimes = d3.range(1, this.numControls + 2).map(controlIdx => {
                let splitRec = this.getFastestSplitTo(controlIdx);
                return (splitRec === null) ? null : splitRec.split;
            });

            for (let result of this.results) {
                result.determineTimeLosses(fastestSplitTimes);
            }
        }

        /**
         * Returns whether this course-class is empty, i.e. has no results.
         * @return {Boolean} True if this course-class has no results, false if it
         *     has at least one result.
         */
        isEmpty() {
            return (this.results.length === 0);
        }

        /**
         * Sets the course that this course-class belongs to.
         * @param {SplitsBrowser.Model.Course} course The course this class belongs to.
         */
        setCourse(course) {
            this.course = course;
        }

        /**
         * Returns the fastest split time recorded by results in this class.  If
         * no fastest split time is recorded (e.g. because all results
         * mispunched that control, or the class is empty), null is returned.
         * @param {Number} controlIdx The index of the control to return the
         *      fastest split to.
         * @return {Object|null} Object containing the name and fastest split, or
         *      null if no split times for that control were recorded.
         */
        getFastestSplitTo(controlIdx) {
            if (typeof controlIdx !== "number" || controlIdx < 1 || controlIdx > this.numControls + 1) {
                throwInvalidData(`Cannot return splits to leg '${controlIdx}' in a course with ${this.numControls} control(s)`);
            }

            let fastestSplit = null;
            let fastestResult = null;
            for (let result of this.results) {
                const resultSplit = result.getSplitTimeTo(controlIdx);
                if (isNotNullNorNaN(resultSplit)) {
                    if (fastestSplit === null || resultSplit < fastestSplit) {
                        fastestSplit = resultSplit;
                        fastestResult = result;
                    }
                }
            }

            return (fastestSplit === null) ? null : { split: fastestSplit, name: fastestResult.owner.name };
        }

        /**
         * Returns all results that visited the control in the given time
         * interval.
         * @param {Number} controlNum The number of the control, with 0 being the
         *     start, and this.numControls + 1 being the finish.
         * @param {Number} intervalStart The start time of the interval, as
         *     seconds past midnight.
         * @param {Number} intervalEnd The end time of the interval, as seconds
         *     past midnight.
         * @return {Array} Array of objects listing the name and start time of each
         *     result visiting the control within the given time interval.
         */
        getResultsAtControlInTimeRange(controlNum, intervalStart, intervalEnd) {
            if (typeof controlNum !== "number" || isNaN(controlNum) || controlNum < 0 || controlNum > this.numControls + 1) {
                throwInvalidData(`Control number must be a number between 0 and ${this.numControls} inclusive`);
            }

            const matchingResults = [];
            for (let result of this.results) {
                const cumTime = result.getCumulativeTimeTo(controlNum);
                if (cumTime !== null && result.startTime !== null) {
                    const actualTimeAtControl = cumTime + result.startTime;
                    if (intervalStart <= actualTimeAtControl && actualTimeAtControl <= intervalEnd) {
                        matchingResults.push({ name: result.owner.name, time: actualTimeAtControl });
                    }
                }
            }

            return matchingResults;
        }
    }

    SplitsBrowser.Model.CourseClass = CourseClass;
})();