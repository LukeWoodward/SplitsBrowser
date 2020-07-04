/*
 *  SplitsBrowser Event - Contains all of the courses for a single event.
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
    
    var Course = SplitsBrowser.Model.Course;

    /**
    * Contains all of the data for an event.
    * @param {Array} classes - Array of CourseClass objects representing all of
    *     the classes of competitors.
    * @param {Array} courses - Array of Course objects representing all of the
    *     courses of the event.
    * @param {Array} warnings - Array of strings containing warning messages
    *     encountered when reading in the event dara.
    */ 
    function Event(classes, courses, warnings) {
        this.classes = classes;
        this.courses = courses;
        this.warnings = warnings;
    }
    
    /**
    * Determines time losses for each result in each class.
    * 
    * This method should be called after reading in the event data but before
    * attempting to plot it.
    */
    Event.prototype.determineTimeLosses = function () {
        this.classes.forEach(function (courseClass) {
            courseClass.determineTimeLosses();
        });
    };
    
    /**
    * Returns whether the event data needs any repairing.
    *
    * The event data needs repairing if any results are missing their
    * 'repaired' cumulative times.
    *
    * @return {boolean} True if the event data needs repairing, false
    *     otherwise.
    */
    Event.prototype.needsRepair = function () {
        return this.classes.some(function (courseClass) {
            return courseClass.results.some(function (result) {
                return (result.getAllCumulativeTimes() === null);
            });
        });
    };
    
    /**
    * Returns the fastest splits for each class on a given leg.
    *
    * The fastest splits are returned as an array of objects, where each object
    * lists the results name, the class, and the split time in seconds.
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
    * Returns a list of results that visit the control with the given code
    * within the given time interval.
    *
    * The fastest splits are returned as an array of objects, where each object
    * lists the results name, the class, and the split time in seconds.
    *
    * @param {String} controlCode - Code for the control.
    * @param {Number} intervalStart - Start of the time interval, in seconds
    *     since midnight.
    * @param {?Number} intervalEnd - End of the time interval, in seconds, or
    *     null for the finish.
    * @return {Array} Array of objects containing fastest splits for that leg.
    */
    Event.prototype.getResultsAtControlInTimeRange = function (controlCode, intervalStart, intervalEnd) {
        var results = [];
        this.courses.forEach(function (course) {
            course.getResultsAtControlInTimeRange(controlCode, intervalStart, intervalEnd).forEach(function (result) {
                results.push(result);
            });
        });
        
        results.sort(function (a, b) { return d3.ascending(a.time, b.time); });
        
        return results;
    };
    
    /**
    * Returns the list of controls that follow after a given control.
    * @param {String} controlCode - The code for the control.
    * @return {Array} Array of objects for each course using that control,
    *    with each object listing course name and next control.
    */
    Event.prototype.getNextControlsAfter = function (controlCode) {
        var courses = this.courses;
        if (controlCode !== Course.START) {
            courses = courses.filter(function (course) { return course.hasControl(controlCode); });
        }
        
        return courses.map(function (course) { return {course: course, nextControls: course.getNextControls(controlCode)}; });
    };
    
    SplitsBrowser.Model.Event = Event;
})();