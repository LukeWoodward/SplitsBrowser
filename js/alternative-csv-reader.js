/*
 *  SplitsBrowser Alternative CSV - Read in alternative CSV files.
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
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    // This reader reads an 'alternative' CSV format, distinguished by the
    // control times data for each competitor occupying three columns per
    // control: control code, time and points.
    
    // Control data starts in column AM (index 38).
    var CONTROLS_OFFSET = 38;
    
    /**
    * Trim trailing empty-string entries from the given array.
    * The given array is mutated.
    * @param {Array} array - The array of string values.
    */
    function trimTrailingEmptyCells (array) {
        var index = array.length - 1;
        while (index >= 0 && array[index] === "") {
            index -= 1;
        }
        
        array.splice(index + 1, array.length - index - 1);
    }
    
    /**
    * Parse alternative CSV data for an entire event.
    * @param {string} eventData - String containing the entire event data.
    * @return {SplitsBrowser.Model.Event} All event data read in.
    */    
    function parseEventData (eventData) {
        // Normalise line endings to LF.
        eventData = eventData.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        
        var lines = eventData.split(/\n/);
        
        if (lines.length < 2) {
            throwWrongFileFormat("Data appears not to be in the alternative CSV format - too few lines");
        }
        
        var firstDataLine = lines[1];
        var lineParts = firstDataLine.split(",");
        trimTrailingEmptyCells(lineParts);
        
        if (lineParts.length < CONTROLS_OFFSET) {
            throwWrongFileFormat("Data appears not to be in the alternative CSV format - first data line has fewer than 38 parts");
        }
        
        trimTrailingEmptyCells(lineParts);
        
        // Check that all control codes except perhaps the finish are numeric.
        var digitsOnly = /^\d+$/;
        for (var index = CONTROLS_OFFSET; index + 3 < lineParts.length; index += 3) {
            if (!digitsOnly.test(lineParts[index])) {
                throwWrongFileFormat("Data appears not to be in the alternative CSV format - data in cell " + index + " of the first row ('" + lineParts[index] + "') is not an number");
            }
        }
        
        var classes = d3.map();
        for (var rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
            var row = lines[rowIndex].split(",");
            trimTrailingEmptyCells(row);
            
            if (row.length < CONTROLS_OFFSET) {
                // Probably a blank line.  Ignore it.
                continue;
            }
            
            if (row.length % 3 === 0) {
                // Competitor might be missing cumulative time to last control.
                row.push("");
            }
            
            // In all the files I have, clubs and start times are always blank.
            // Nonetheless, let's trust the headers and attempt to read them
            // in from where we would expect them to be.
            var competitorName = row[3];
            var club = row[5];
            var courseName = row[7];
            var startTime = parseTime(row[8]);
            
            var cumTimes = [0];
            for (var cumTimeIndex = CONTROLS_OFFSET + 1; cumTimeIndex < row.length; cumTimeIndex += 3) {
                cumTimes.push(parseTime(row[cumTimeIndex]));
            }
            
            var order = (classes.has(courseName)) ? classes.get(courseName).competitors.length + 1 : 1;
            
            var competitor = fromOriginalCumTimes(order, competitorName, club, startTime, cumTimes);
            
            if (classes.has(courseName)) {
                var cls = classes.get(courseName);
                // Subtract one from the list of cumulative times for the 
                // cumulative time at the start (always 0), and add one on to
                // the count of controls in the class to cater for the finish.
                if (cumTimes.length - 1 !== (cls.controls.length + 1)) {
                    throwInvalidData("Competitor '" + competitorName + "' has the wrong number of splits for course '" + courseName + "': " +
                             "expected " + (cls.controls.length + 1) + ", actual " + (cumTimes.length - 1));
                }
                
                cls.competitors.push(competitor);
            } else {
                // New course/class.
                
                // Determine the list of controls, ignoring the finish.
                // (Sometimes this is a number, some times it is 'F1'.  Either
                // way, we don't really care.)
                var controls = [];
                for (var controlIndex = CONTROLS_OFFSET; controlIndex + 3 < row.length; controlIndex += 3) {
                    controls.push(row[controlIndex]);
                }
            
                classes.set(courseName, {controls: controls, competitors: [competitor]});
            }
        }
        
        var ageClasses = [];
        var courses = [];
        classes.keys().forEach(function (className) {
            var cls = classes.get(className);
            var ageClass = new AgeClass(className, cls.controls.length, cls.competitors);
            
            // Nulls indicate no course distance and climb.
            var course = new Course(className, [ageClass], null, null, cls.controls);
            ageClass.setCourse(course);
            ageClasses.push(ageClass);
            courses.push(course);
        });
    
        return new Event(ageClasses, courses);
    }
    
    SplitsBrowser.Input.AlternativeCSV = { parseEventData: parseEventData };
})();