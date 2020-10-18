/*
 *  SplitsBrowser Course-Class Set - A collection of selected course classes.
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

    const isNotNull = SplitsBrowser.isNotNull;
    const isNaNStrict = SplitsBrowser.isNaNStrict;
    const isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    const throwInvalidData = SplitsBrowser.throwInvalidData;
    const compareResults = SplitsBrowser.Model.compareResults;

    /**
    * Utility function to merge the lists of all results in a number of
    * classes.  All classes must contain the same number of controls.
    * @param {Array} classes Array of CourseClass objects.
    * @return {Array} Merged array of results.
    */
    function mergeResults(classes) {
        if (classes.length === 0) {
            return [];
        }

        let allResults = [];
        let expectedControlCount = classes[0].numControls;
        for (let courseClass of classes) {
            if (courseClass.numControls !== expectedControlCount) {
                throwInvalidData(`Cannot merge classes with ${expectedControlCount} and ${courseClass.numControls} controls`);
            }

            for (let result of courseClass.results) {
                if (!result.isNonStarter) {
                    allResults.push(result);
                }
            }
        }

        allResults.sort(compareResults);
        return allResults;
    }

    /**
    * Given an array of numbers, return a list of the corresponding ranks of those
    * numbers.
    * @param {Array} sourceData Array of number values.
    * @return {Array} Array of corresponding ranks.
    */
    function getRanks(sourceData) {
        // First, sort the source data, removing nulls.
        let sortedData = sourceData.filter(isNotNullNorNaN);
        sortedData.sort(d3.ascending);

        // Now construct a map that maps from source value to rank.
        let rankMap = new Map();
        sortedData.forEach((value, index) => {
            if (!rankMap.has(value)) {
                rankMap.set(value, index + 1);
            }
        });

        // Finally, build and return the list of ranks.
        let ranks = sourceData.map(value => isNotNullNorNaN(value) ? rankMap.get(value) : value);

        return ranks;
    }

    /**
    * An object that represents the currently-selected classes.
    * @constructor
    * @param {Array} classes Array of currently-selected classes.
    */
    class CourseClassSet {
        constructor(classes) {
            this.allResults = mergeResults(classes);
            this.classes = classes;
            this.numControls = (classes.length > 0) ? classes[0].numControls : null;
            this.computeRanks();
        }

        /**
        * Returns whether this course-class set is empty, i.e. whether it has no
        * results at all.
        * @return {Boolean} True if the course-class set is empty, false if it is not
        *     empty.
        */
        isEmpty() {
            return this.allResults.length === 0;
        }

        /**
        * Returns the course used by all of the classes that make up this set.  If
        * there are no classes, null is returned instead.
        * @return {SplitsBrowser.Model.Course|null} The course used by all classes.
        */
        getCourse() {
            return (this.classes.length > 0) ? this.classes[0].course : null;
        }

        /**
        * Returns the name of the 'primary' class, i.e. that that has been
        * chosen in the drop-down list.  If there are no classes, null is returned
        * instead.
        * @return {String|null} Name of the primary class.
        */
        getPrimaryClassName() {
            return (this.classes.length > 0) ? this.classes[0].name : null;
        }

        /**
        * Returns the number of classes that this course-class set is made up of.
        * @return {Number} The number of classes that this course-class set is
        *     made up of.
        */
        getNumClasses() {
            return this.classes.length;
        }

        /**
        * Returns whether any of the classes within this set have data that
        * SplitsBrowser can identify as dubious.
        * @return {Boolean} True if any of the classes within this set contain
        *     dubious data, false if none of them do.
        */
        hasDubiousData() {
            return this.classes.some(courseClass => courseClass.hasDubiousData);
        }

        /**
        * Returns whether this course-class set has team data.
        * @return {Boolean} True if all of the classes within this course-class
        *     set contain team data, false otherwise.
        */
        hasTeamData() {
            return this.classes.length > 0 && this.classes.every(courseClass => courseClass.isTeamClass);
        }

        /**
        * Returns the number of legs in this course-class set, if this
        * course-class set contains team data.  If not, or the number of
        * legs among the classes is inconsistent, null is returned.
        * @return {Number|null} The number of legs in the team class, or null
        *     if this can't be determined.
        */
        getLegCount() {
            let legCount = null;
            for (let courseClass of this.classes) {
                if (courseClass.isTeamClass) {
                    let thisLegCount = courseClass.numbersOfControls.length;
                    if (legCount === null) {
                        legCount = thisLegCount;
                    } else if (legCount !== thisLegCount) {
                        // Inconsistent leg counts?
                        return null;
                    }
                } else {
                    return null;
                }
            }

            return legCount;
        }

        /**
        * Returns an array of the cumulative times of the winner of the set of
        * classes.
        * @return {Array} Array of the winner's cumulative times.
        */
        getWinnerCumTimes() {
            if (this.allResults.length === 0) {
                return null;
            }

            let firstResult = this.allResults[0];
            return (firstResult.completed()) ? fillBlankRangesInCumulativeTimes(firstResult.cumTimes) : null;
        }

        /**
        * Return the imaginary result who recorded the fastest time on each leg of
        * the class.
        * If at least one control has no results recording a time for it, null is
        * returned.  If there are no classes at all, null is returned.
        * @return {Array|null} Cumulative splits of the imaginary result with fastest
        *           time, if any.
        */
        getFastestCumTimes() {
            return this.getFastestCumTimesPlusPercentage(0);
        }

        /**
        * Return the imaginary result who recorded the fastest time on each leg of
        * the given classes, with a given percentage of their time added.
        * If at least one control has no results recording a time for it, null is
        * is returned.  If there are no classes at all, null is returned.
        * @param {Number} percent The percentage of time to add.
        * @return {Array|null} Cumulative splits of the imaginary result with fastest
        *           time, if any, after adding a percentage.
        */
        getFastestCumTimesPlusPercentage(percent) {
            if (this.numControls === null) {
                return null;
            }

            let ratio = 1 + percent / 100;

            let fastestSplits = new Array(this.numControls + 1);
            fastestSplits[0] = 0;

            for (let controlIdx = 1; controlIdx <= this.numControls + 1; controlIdx += 1) {
                let fastestForThisControl = null;
                for (let result of this.allResults) {
                    let thisTime = result.getSplitTimeTo(controlIdx);
                    if (isNotNullNorNaN(thisTime) && (fastestForThisControl === null || thisTime < fastestForThisControl)) {
                        fastestForThisControl = thisTime;
                    }
                }

                fastestSplits[controlIdx] = fastestForThisControl;
            }

            if (!fastestSplits.every(isNotNull)) {
                // We don't have fastest splits for every control, so there was one
                // control that either nobody punched or everybody had a dubious
                // split for.

                // Find the blank-ranges of the fastest times.  Include the end
                // of the range in case there are no cumulative times at the last
                // control but there is to the finish.
                let fastestBlankRanges = getBlankRanges(fastestSplits, true);

                // Find all blank-ranges of results.
                let allResultBlankRanges = [];
                for (let result of this.allResults) {
                    let resultBlankRanges = getBlankRanges(result.getAllCumulativeTimes(), false);
                    for (let range of resultBlankRanges) {
                        allResultBlankRanges.push({
                            start: range.start,
                            end: range.end,
                            size: range.end - range.start,
                            overallSplit: result.getCumulativeTimeTo(range.end) - result.getCumulativeTimeTo(range.start)
                        });
                    }
                }

                // Now, for each blank range of the fastest times, find the
                // size of the smallest result blank range that covers it,
                // and then the fastest split among those results.
                for (let fastestRange of fastestBlankRanges) {
                    let coveringResultRanges = allResultBlankRanges.filter(compRange =>
                        compRange.start <= fastestRange.start && fastestRange.end <= compRange.end + 1);

                    let minSize = null;
                    let minOverallSplit = null;
                    for (let coveringRange of coveringResultRanges) {
                        if (minSize === null || coveringRange.size < minSize) {
                            minSize = coveringRange.size;
                            minOverallSplit = null;
                        }

                        if (minOverallSplit === null || coveringRange.overallSplit < minOverallSplit) {
                            minOverallSplit = coveringRange.overallSplit;
                        }
                    }

                    // Assume that the fastest result across the range had equal
                    // splits for all controls on the range.  This won't always
                    // make sense but it's the best we can do.
                    if (minSize !== null && minOverallSplit !== null) {
                        for (let index = fastestRange.start + 1; index < fastestRange.end; index += 1) {
                            fastestSplits[index] = minOverallSplit / minSize;
                        }
                    }
                }
            }

            if (!fastestSplits.every(isNotNull)) {
                // Could happen if the results are created from split times and the
                // splits are not complete, and also if nobody punches the final
                // few controls.  Set any remaining missing splits to 3 minutes for
                // intermediate controls and 1 minute for the finish.
                for (let index = 0; index < fastestSplits.length; index += 1) {
                    if (fastestSplits[index] === null) {
                        fastestSplits[index] = (index === fastestSplits.length - 1) ? 60 : 180;
                    }
                }
            }

            let fastestCumTimes = new Array(this.numControls + 1);
            fastestSplits.forEach((fastestSplit, index) => {
                fastestCumTimes[index] = (index === 0) ? 0 : fastestCumTimes[index - 1] + fastestSplit * ratio;
            });

            return fastestCumTimes;
        }

        /**
        * Returns the cumulative times for the result with the given index, with
        * any runs of blanks filled in.
        * @param {Number} resultIndex The index of the result.
        * @return {Array} Array of cumulative times.
        */
        getCumulativeTimesForResult(resultIndex) {
            return fillBlankRangesInCumulativeTimes(this.allResults[resultIndex].getAllCumulativeTimes());
        }

        /**
        * Compute the ranks of each result within their class.
        */
        computeRanks() {
            if (this.allResults.length === 0) {
                // Nothing to compute.
                return;
            }

            let splitRanksByResult = [];
            let cumRanksByResult = [];
            for (let index = 0; index < this.allResults.length; index += 1) {
                splitRanksByResult.push([null]);
                cumRanksByResult.push([null]);
            }

            for (let control of d3.range(1, this.numControls + 2)) {
                let splitsByResult = this.allResults.map(result => result.getSplitTimeTo(control));
                let splitRanksForThisControl = getRanks(splitsByResult);
                this.allResults.forEach((_result, idx) => { splitRanksByResult[idx].push(splitRanksForThisControl[idx]); });
            }

            for (let control of d3.range(1, this.numControls + 2)) {
                // We want to null out all subsequent cumulative ranks after a
                // result mispunches.
                let cumSplitsByResult = this.allResults.map((result, idx) => {
                    // -1 for previous control.
                    if (control > 1 && cumRanksByResult[idx][control - 1] === null && !result.isOKDespiteMissingTimes) {
                        // This result has no cumulative rank for the previous
                        // control, and is not recorded as OK despite missing times,
                        // so either they mispunched it or mispunched a previous one.
                        // Give them a null time here, so that they end up with
                        // another null cumulative rank.
                        return null;
                    } else {
                        return result.getCumulativeTimeTo(control);
                    }
                });
                let cumRanksForThisControl = getRanks(cumSplitsByResult);
                this.allResults.forEach((_res, idx) => { cumRanksByResult[idx].push(cumRanksForThisControl[idx]); });
            }

            this.allResults.forEach((result, idx) => {
                result.setSplitAndCumulativeRanks(splitRanksByResult[idx], cumRanksByResult[idx]);
            });
        }

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
        * @param {Number} numSplits Maximum number of split times to return.
        * @param {Number} controlIdx Index of the control.
        * @param {Number|null} selectedLegIndex The index of the selected leg, or null
        *       to not filter by selected leg.
        * @return {Array} Array of the fastest splits to the given control.
        */
        getFastestSplitsTo(numSplits, controlIdx, selectedLegIndex) {
            if (typeof numSplits !== "number" || numSplits <= 0) {
                throwInvalidData("The number of splits must be a positive integer");
            } else if (typeof controlIdx !== "number" || controlIdx <= 0 || controlIdx > this.numControls + 1) {
                throwInvalidData("Control " + controlIdx + " out of range");
            } else {
                // Compare results by split time at this control, and, if those are
                // equal, total time.
                let comparator = (resultA, resultB) => {
                    let resultASplit = resultA.getSplitTimeTo(controlIdx);
                    let resultBSplit = resultB.getSplitTimeTo(controlIdx);
                    return (resultASplit === resultBSplit) ? d3.ascending(resultA.totalTime, resultB.totalTime) : d3.ascending(resultASplit, resultBSplit);
                };

                let results = this.allResults.filter(result => result.completed() && !isNaNStrict(result.getSplitTimeTo(controlIdx)));
                results.sort(comparator);
                let fastestSplits = [];
                for (let i = 0; i < results.length && i < numSplits; i += 1) {
                    fastestSplits.push({ name: results[i].getOwnerNameForLeg(selectedLegIndex), split: results[i].getSplitTimeTo(controlIdx) });
                }

                return fastestSplits;
            }
        }

        /**
        * Returns the relevant data for a single leg if necessary.
        * @param {Array} data Array of data to slice.
        * @param {Number} legIndex The selected leg index, or null for all results.
        * @return {Array} The relevant section of the given data array for the leg.
        */
        sliceForLegIndex(data, legIndex) {
            if (this.hasTeamData() && legIndex !== null) {
                let numControls = this.classes[0].numbersOfControls[legIndex] + 2;
                let offset = this.classes[0].offsets[legIndex];
                return data.slice(offset, offset + numControls);
            } else {
                return data.slice(0);
            }
        }

        /**
        * Return data from the current classes in a form suitable for plotting in a chart.
        * @param {Array} referenceCumTimes 'Reference' cumulative time data, such
        *            as that of the winner, or the fastest time.
        * @param {Array} currentIndexes Array of indexes that indicate which
        *           results from the overall list are plotted.
        * @param {Object} chartType The type of chart to draw.
        * @param {Number|null} legIndex The index of the selected leg, or null for all legs.
        * @return {Object} Array of data.
        */
        getChartData(referenceCumTimes, currentIndexes, chartType, legIndex) {
            if (typeof referenceCumTimes === "undefined") {
                throw new TypeError("referenceCumTimes undefined or missing");
            } else if (typeof currentIndexes === "undefined") {
                throw new TypeError("currentIndexes undefined or missing");
            } else if (typeof chartType === "undefined") {
                throw new TypeError("chartType undefined or missing");
            } else if (typeof legIndex === "undefined") {
                throw new TypeError("legIndex undefined or missing");
            }

            let resultData = this.allResults.map(result => chartType.dataSelector(result, referenceCumTimes));
            let selectedResultData = currentIndexes.map(index => resultData[index]);

            let numControls;
            if (this.hasTeamData() && legIndex !== null) {
                selectedResultData = selectedResultData.map(data => this.sliceForLegIndex(data, legIndex));
                numControls = this.classes[0].numbersOfControls[legIndex];
                referenceCumTimes = this.sliceForLegIndex(referenceCumTimes, legIndex);
            } else {
                numControls = this.numControls;
            }

            let xMin = d3.min(referenceCumTimes);
            let xMax = d3.max(referenceCumTimes);
            let yMin;
            let yMax;
            if (currentIndexes.length === 0) {
                // No results selected.
                if (this.isEmpty()) {
                    // No results at all.  Make up some values.
                    yMin = 0;
                    yMax = 60;
                } else {
                    // Set yMin and yMax to the boundary values of the first result.
                    let firstResultTimes = resultData[0];
                    yMin = d3.min(firstResultTimes);
                    yMax = d3.max(firstResultTimes);
                }
            } else {
                yMin = d3.min(selectedResultData.map(values => d3.min(values)));
                yMax = d3.max(selectedResultData.map(values => d3.max(values)));
            }

            if (Math.abs(yMax - yMin) < 1e-8) {
                // yMin and yMax will be used to scale a y-axis, so we'd better
                // make sure that they're not equal, optionally give-or-take some
                // floating-point noise.
                yMax = yMin + 1;
            }

            let offset = (this.hasTeamData() && legIndex !== null) ? this.classes[0].offsets[legIndex] : 0;
            let dubiousTimesInfo = currentIndexes.map(resultIndex => {
                let indexPairs = chartType.indexesAroundOmittedTimesFunc(this.allResults[resultIndex]);
                return indexPairs.filter(indexPair => indexPair.start >= offset && indexPair.end <= offset + numControls + 2)
                    .map(indexPair =>({ start: indexPair.start - offset, end: indexPair.end - offset }));
            });

            let cumulativeTimesByControl = d3.transpose(selectedResultData);
            let xData = referenceCumTimes;
            let zippedData = d3.zip(xData, cumulativeTimesByControl);
            let resultNames = currentIndexes.map(index => this.allResults[index].getOwnerNameForLeg(legIndex));
            return {
                dataColumns: zippedData.map(data => ({ x: data[0], ys: data[1] })),
                resultNames: resultNames,
                numControls: numControls,
                xExtent: [xMin, xMax],
                yExtent: [yMin, yMax],
                dubiousTimesInfo: dubiousTimesInfo
            };
        }
    }

    /**
    * Return a list of objects that describe when the given array of times has
    * null or NaN values.  This does not include trailing null or NaN values.
    * @param {Array} times Array of times, which may include NaNs and nulls.
    * @param {Boolean} includeEnd Whether to include a blank range that ends
    *    at the end of the array.
    * @return {Array} Array of objects that describes when the given array has
    *    ranges of null and/or NaN values.
    */
    function getBlankRanges(times, includeEnd) {
        let blankRangeInfo = [];
        let startIndex = 1;
        while (startIndex + 1 < times.length) {
            if (isNotNullNorNaN(times[startIndex])) {
                startIndex += 1;
            } else {
                let endIndex = startIndex;
                while (endIndex + 1 < times.length && !isNotNullNorNaN(times[endIndex + 1])) {
                    endIndex += 1;
                }

                if (endIndex + 1 < times.length || includeEnd) {
                    blankRangeInfo.push({start: startIndex - 1, end: endIndex + 1});
                }

                startIndex = endIndex + 1;
            }
        }

        return blankRangeInfo;
    }

    /**
    * Fill in any NaN values in the given list of cumulative times by doing
    * a linear interpolation on the missing values.
    * @param {Array} cumTimes Array of cumulative times.
    * @return {Array} Array of cumulative times with NaNs replaced.
    */
    function fillBlankRangesInCumulativeTimes(cumTimes) {
        cumTimes = cumTimes.slice(0);
        let blankRanges = getBlankRanges(cumTimes, false);
        for (let range of blankRanges) {
            let timeBefore = cumTimes[range.start];
            let timeAfter = cumTimes[range.end];
            let avgTimePerControl = (timeAfter - timeBefore) / (range.end - range.start);
            for (let index = range.start + 1; index < range.end; index += 1) {
                cumTimes[index] = timeBefore + (index - range.start) * avgTimePerControl;
            }
        }

        let lastNaNTimeIndex = cumTimes.length;
        while (lastNaNTimeIndex >= 0 && isNaNStrict(cumTimes[lastNaNTimeIndex - 1])) {
            lastNaNTimeIndex -= 1;
        }

        if (lastNaNTimeIndex > 0) {
            for (let timeIndex = lastNaNTimeIndex; timeIndex < cumTimes.length; timeIndex += 1) {
                cumTimes[timeIndex] = cumTimes[timeIndex - 1] + ((timeIndex === cumTimes.length - 1) ? 60 : 180);
            }
        }

        return cumTimes;
    }

    SplitsBrowser.Model.CourseClassSet = CourseClassSet;
})();