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

    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    
    /**
     * Object that represents a collection of competitor data for a class.
     * @constructor.
     * @param {String} name - Name of the class.
     * @param {Number} numControls - Number of controls.
     * @param {Array} competitors - Array of Competitor objects.
     */
    function CourseClass(name, numControls, competitors) {
        this.name = name;
        this.numControls = numControls;
        this.competitors = competitors;
        this.course = null;
        this.hasDubiousData = false;
        this.competitors.forEach(function (comp) {
            comp.setClassName(name);
        });
    }
    
    /**
    * Records that this course-class has competitor data that SplitsBrowser has
    * deduced as dubious.
    */
    CourseClass.prototype.recordHasDubiousData = function () {
        this.hasDubiousData = true;
    };
     
    /**
    * Determines the time losses for the competitors in this course-class.
    */
    CourseClass.prototype.determineTimeLosses = function () {
        var fastestSplitTimes = d3.range(1, this.numControls + 2).map(function (controlIdx) {
            var splitRec = this.getFastestSplitTo(controlIdx);
            return (splitRec === null) ? null : splitRec.split;
        }, this);
        
        this.competitors.forEach(function (comp) {
            comp.result.determineTimeLosses(fastestSplitTimes);
        });
    };
    
    /**
    * Returns whether this course-class is empty, i.e. has no competitors.
    * @return {boolean} True if this course-class has no competitors, false if it
    *     has at least one competitor.
    */
    CourseClass.prototype.isEmpty = function () {
        return (this.competitors.length === 0);
    };
    
    /**
    * Sets the course that this course-class belongs to.
    * @param {SplitsBrowser.Model.Course} course - The course this class belongs to.
    */
    CourseClass.prototype.setCourse = function (course) {
        this.course = course;
    };
    
    /**
    * Returns an array of all results from the competitors in this course-class.
    * @return {Array} Array of competitor results.
    */ 
    CourseClass.prototype.getAllResults = function () {
        return this.competitors.map(function (comp) { return comp.result; });
    };

    /**
    * Returns the fastest split time recorded by competitors in this class.  If
    * no fastest split time is recorded (e.g. because all competitors
    * mispunched that control, or the class is empty), null is returned.
    * @param {Number} controlIdx - The index of the control to return the
    *      fastest split to.
    * @return {?Object} Object containing the name and fastest split, or
    *      null if no split times for that control were recorded.
    */
    CourseClass.prototype.getFastestSplitTo = function (controlIdx) {
        if (typeof controlIdx !== "number" || controlIdx < 1 || controlIdx > this.numControls + 1) {
            throwInvalidData("Cannot return splits to leg '" + controlIdx + "' in a course with " + this.numControls + " control(s)");
        }
    
        var fastestSplit = null;
        var fastestCompetitor = null;
        this.competitors.forEach(function (comp) {
            var compSplit = comp.result.getSplitTimeTo(controlIdx);
            if (isNotNullNorNaN(compSplit)) {
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
    CourseClass.prototype.getCompetitorsAtControlInTimeRange = function (controlNum, intervalStart, intervalEnd) {
        if (typeof controlNum !== "number" || isNaN(controlNum) || controlNum < 0 || controlNum > this.numControls + 1) {
            throwInvalidData("Control number must be a number between 0 and " + this.numControls + " inclusive");
        }
        
        var matchingCompetitors = [];
        this.competitors.forEach(function (comp) {
            var cumTime = comp.result.getCumulativeTimeTo(controlNum);
            if (cumTime !== null && comp.result.startTime !== null) {
                var actualTimeAtControl = cumTime + comp.result.startTime;
                if (intervalStart <= actualTimeAtControl && actualTimeAtControl <= intervalEnd) {
                    matchingCompetitors.push({name: comp.name, time: actualTimeAtControl});
                }
            }
        });
        
        return matchingCompetitors;
    };
    
    SplitsBrowser.Model.CourseClass = CourseClass;
})();