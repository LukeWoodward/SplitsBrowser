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
    
    /**
    * Construct a Repairer, for repairing some data.
    */
    var Repairer = function () {
        // Intentionally empty.
    };
    
    /**
    * Attempts to repair the cumulative times for a competitor.  The repaired
    * cumulative times are written back into the competitor.
    *
    * @param {Competitor} competitor - Competitor whose cumulative times we
    *     wish to repair.
    */
    Repairer.prototype.repairCompetitor = function (competitor) {
        var cumTimes = competitor.originalCumTimes;
        competitor.setRepairedCumulativeTimes(cumTimes);
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