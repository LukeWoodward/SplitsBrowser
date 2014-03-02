/*
 *  SplitsBrowser data-repair - Attempt to work around nonsensical data.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    // competitors have sensible finish splits.
    var MAX_FINISH_SPLIT_MINS_ADDED = 5;
    
    /**
    * Construct a Repairer, for repairing some data.
    */
    var Repairer = function () {
        // Intentionally empty.
    };
    
    /**
    * Returns the positions at which the first pair of non-ascending cumulative
    * times are found.  This is returned as an object with 'first' and 'second'
    * properties.
    *
    * If the entire array of cumulative times is strictly ascending, this
    * returns null.
    * 
    * @param {Array} cumTimes - Array of cumulative times.
    * @return {Object|null} Object containing indexes of non-ascending entries,
    *     or null if none found.
    */
    function getFirstNonAscendingIndexes(cumTimes) {
        if (cumTimes.length === 0 || cumTimes[0] !== 0) {
            throwInvalidData("cumulative times array does not start with a zero cumulative time");
        }
        
        var lastNumericTimeIndex = 0;
        
        for (var index = 1; index < cumTimes.length; index += 1) {
            var time = cumTimes[index];
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
    * Remove, by setting to NaN, any cumulative time that is equal to the
    * previous cumulative time.
    * @param {Array} cumTimes - Array of cumulative times.
    */
    Repairer.prototype.removeCumulativeTimesEqualToPrevious = function (cumTimes) {
        var lastCumTime = cumTimes[0];
        for (var index = 1; index < cumTimes.length; index += 1) {
            if (cumTimes[index] !== null && cumTimes[index] === lastCumTime) {
                cumTimes[index] = NaN;
            } else {
                lastCumTime = cumTimes[index];
            }
        }
    };
    
    /**
    * Remove from the cumulative times given any individual times that cause
    * negative splits and whose removal leaves all of the remaining splits in
    * strictly-ascending order.
    *
    * This method does not compare the last two cumulative times, so if the 
    * finish time is not after the last control time, no changes will be made.
    *
    * @param {Array} cumTimes - Array of cumulative times.
    * @return {Array} Array of cumulaive times with perhaps some cumulative
    *     times taken out.
    */
    Repairer.prototype.removeCumulativeTimesCausingNegativeSplits = function (cumTimes) {

        var nonAscIndexes = getFirstNonAscendingIndexes(cumTimes);
        while (nonAscIndexes !== null && nonAscIndexes.second + 1 < cumTimes.length) {
            
            // So, we have a pair of cumulative times that are not in strict
            // ascending order, with the second one not being the finish.  If
            // the second time is not the finish cumulative time for a
            // completing competitor, try the following in order until we get a
            // list of cumulative times in ascending order:
            // * Remove the second cumulative time,
            // * Remove the first cumulative time.
            // If one of these allows us to push the next non-ascending indexes
            // beyond the second, remove the offending time and keep going.  By
            // 'remove' we mean 'replace with NaN'.
            //
            // We don't want to remove the finish time for a competitor as that
            // removes their total time as well.  If the competitor didn't
            // complete the course, then we're not so bothered; they've
            // mispunched so they don't have a total time anyway.
            
            var first = nonAscIndexes.first;
            var second = nonAscIndexes.second;
            
            var progress = false;
            
            for (var attempt = 1; attempt <= 2; attempt += 1) {
                // 1 = remove second, 2 = remove first.
                var adjustedCumTimes = cumTimes.slice();
                adjustedCumTimes[(attempt === 1) ? second : first] = NaN;
                var nextNonAscIndexes = getFirstNonAscendingIndexes(adjustedCumTimes);
                if (nextNonAscIndexes === null || nextNonAscIndexes.first > second) {
                    progress = true;
                    cumTimes = adjustedCumTimes;
                    nonAscIndexes = nextNonAscIndexes;
                    break;
                }
            }
            
            if (!progress) {
                this.success = false;
                break;
            }
        }
    
        return cumTimes;
    };
    
    /**
    * Attempts to repair the cumulative times for a competitor.  The repaired
    * cumulative times are written back into the competitor.
    *
    * @param {Competitor} competitor - Competitor whose cumulative times we
    *     wish to repair.
    */
    Repairer.prototype.repairCompetitor = function (competitor) {
        var cumTimes = competitor.originalCumTimes.slice(0);
        
        this.removeCumulativeTimesEqualToPrevious(cumTimes);
        
        cumTimes = this.removeCumulativeTimesCausingNegativeSplits(cumTimes);
        
        competitor.setRepairedCumulativeTimes(cumTimes);
    };
    
    /**
    * Attempt to repair course finish times.
    *
    * If the finish splits are currently negative, but no further negative than
    * a certain limit, a few whole minutes will be added to make the finish
    * splits positive.
    *
    * @param {Course} course - The course to repair finish times within.
    */
    Repairer.prototype.repairCourseFinishTimes = function (course) {
        var maxFinishSplitDeficit = null;
        course.classes.forEach(function (ageClass) {
            ageClass.competitors.forEach(function (competitor) {
                var penultCumTime = competitor.cumTimes[competitor.cumTimes.length - 2];
                var ultCumTime = competitor.cumTimes[competitor.cumTimes.length - 1];
                if (penultCumTime !== null && ultCumTime !== null && penultCumTime >= ultCumTime) {
                    var deficit = penultCumTime - ultCumTime;
                    if (maxFinishSplitDeficit === null || maxFinishSplitDeficit < deficit) {
                        maxFinishSplitDeficit = deficit;
                    }
                }
            }, this);
        }, this);
         
        if (maxFinishSplitDeficit !== null && maxFinishSplitDeficit < 60 * MAX_FINISH_SPLIT_MINS_ADDED) {
            // Determine the number of whole minutes in the maximum deficit,
            // and then add one to ensure the finish splits go positive.
            var timeToAdd = (Math.floor(maxFinishSplitDeficit / 60) + 1) * 60;
            
            // Add this time to each competitor on the course.
            course.classes.forEach(function (ageClass) {
                ageClass.competitors.forEach(function (competitor) {
                    var cumTimes = competitor.cumTimes;
                    var lastSplit = cumTimes[cumTimes.length - 1];
                    cumTimes = cumTimes.slice(0, cumTimes.length - 1);
                    cumTimes.push(lastSplit + timeToAdd);
                    competitor.setRepairedCumulativeTimes(cumTimes);
                });
            });
        }
    };
    
    /**
    * Attempt to repair all of the data within a course.
    * @param {Course} The course whose data we wish to repair.
    */
    Repairer.prototype.repairCourse = function (course) {
        course.classes.forEach(function (ageClass) {
            ageClass.competitors.forEach(function (competitor) {
                this.repairCompetitor(competitor);
            }, this);
        }, this);
        
        this.repairCourseFinishTimes(course);
    };
    
    /**
    * Attempt to carry out repairs to the data in an event.
    * @param {Event} eventData - The event data to repair.
    * @return {boolean} Whether any unrepairable issues were detected with the
    *     data.
    */
    Repairer.prototype.repairEventData = function (eventData) {
        this.success = true;
        eventData.courses.forEach(function (course) {
            this.repairCourse(course);
        }, this);
        
        return this.success;
    };
    
    /**
    * Attempt to carry out repairs to the data in an event.
    * @param {Event} eventData - The event data to repair.
    * @return {boolean} Whether any unrepairable issues were detected with the
    *     data.
    */
    function repairEventData (eventData) {
        return new Repairer().repairEventData(eventData);
    }
    
    SplitsBrowser.DataRepair = { repairEventData: repairEventData };
})();