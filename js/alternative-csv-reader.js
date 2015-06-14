/*
 *  SplitsBrowser Alternative CSV - Read in alternative CSV files.
 *  
 *  Copyright (C) 2000-2015 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var parseCourseLength = SplitsBrowser.parseCourseLength;
    var parseCourseClimb = SplitsBrowser.parseCourseClimb;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    // This reader reads in alternative CSV formats, where each row defines a
    // separate competitor, and includes course details such as name, controls
    // and possibly distance and climb.
    
    // There is presently one variation supported:
    // * one, distinguished by having three columns per control: control code,
    //   cumulative time and 'points'.  (Points is never used.)  Generally,
    //   these formats are quite sparse; many columns (e.g. club, placing,
    //   start time) are blank or are omitted altogether.
    
    var TRIPLE_COLUMN_FORMAT = {
        // Control data starts in column AM (index 38).
        controlsOffset: 38,
        // Number of columns per control.
        step: 3,
        // Column indexes of various data
        name: 3,
        club: 5,
        courseName: 7,
        startTime: 8,
        length: null,
        climb: null,
        controlCount: null,
        placing: null,
        finishTime: null,
        allowMultipleCompetitorNames: true
    };
    
    // Supported delimiters.
    var DELIMITERS = [",", ";"];
    
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
    * Some lines of some formats can have multiple delimited competitors, which
    * will move the following columns out of their normal place.  Identify any
    * such situations and merge them together.
    * @param {Array} row - The row of data read from the file.
    * @param {Object} format - The format of this CSV file.
    */
    function adjustLinePartsForMultipleCompetitors(row, format) {
        if (format.allowMultipleCompetitorNames) {
            while (row.length > format.name + 1 && row[format.name + 1].match(/^\s\S/)) {
                row[format.name] += "," + row[format.name + 1];
                row.splice(format.name + 1, 1);
            }
        }
    }
    
    /**
    * Determine the delimiter used to delimit data.
    * @param {String} firstDataLine - The first data line of the file.
    * @param {Object} format - The data format.
    * @return {?String} The delimiter separating the data, or null if no
    *    suitable delimiter was found.
    */
    function determineDelimiter(firstDataLine, format) {
        for (var index = 0; index < DELIMITERS.length; index += 1) {
            var delimiter = DELIMITERS[index];
            var lineParts = firstDataLine.split(delimiter);
            trimTrailingEmptyCells(lineParts);
            if (lineParts.length > format.controlsOffset) {
                return delimiter;
            }
        }
        
        return null;
    }
    
    /**
    * Parse alternative CSV data for an entire event.
    * @param {String} eventData - String containing the entire event data.
    * @param {Object} format - The format object that describes the input format.
    * @return {SplitsBrowser.Model.Event} All event data read in.
    */    
    function parseEventDataWithFormat(eventData, format) {
        eventData = normaliseLineEndings(eventData);
        
        var lines = eventData.split(/\n/);
        
        if (lines.length < 2) {
            throwWrongFileFormat("Data appears not to be in an alternative CSV format - too few lines");
        }
        
        var delimiter = determineDelimiter(lines[1], format);
        if (delimiter === null) {
            throwWrongFileFormat("Data appears not to be in an alternative CSV format - first data line has fewer than " + format.controlsOffset + " parts when separated by any recognised delimiter");
        }
        
        var lineParts = lines[1].split(delimiter);
        trimTrailingEmptyCells(lineParts);
        adjustLinePartsForMultipleCompetitors(lineParts, format);
        
        // Check that all control codes except perhaps the finish are alphanumeric.
        var controlCodeRegexp = /^[A-Za-z0-9]+$/;
        
        // Don't check that the control code for the finish is alphanumeric if the
        // finish time is specified elsewhere.
        var terminationOffset = (format.finishTime === null) ? format.step : 0;
        
        for (var index = format.controlsOffset; index + terminationOffset < lineParts.length; index += format.step) {
            if (!controlCodeRegexp.test(lineParts[index])) {
                throwWrongFileFormat("Data appears not to be in an alternative CSV format - data in cell " + index + " of the first row ('" + lineParts[index] + "') is not an number");
            }
        }
        
        var classes = d3.map();
        for (var rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
            var row = lines[rowIndex].split(delimiter);
            trimTrailingEmptyCells(row);
            adjustLinePartsForMultipleCompetitors(row, format);
            
            if (row.length < format.controlsOffset) {
                // Probably a blank line.  Ignore it.
                continue;
            }
            
            while ((row.length - format.controlsOffset) % format.step !== 0) {
                // Competitor might be missing cumulative time to last control.
                row.push("");
            }
            
            var competitorName = row[format.name];
            var club = row[format.club];
            var courseName = row[format.courseName];
            var startTime = parseTime(row[format.startTime]);
            
            var expectedRowLength;
            if (format.controlCount === null) {
                expectedRowLength = row.length;
            } else {
                var controlCount = parseInt(row[format.controlCount], 10);
                if (isNaNStrict(controlCount)) {
                    throwInvalidData("Control count '" + row[format.controlCount] + "' is not a valid number");
                }
                
                expectedRowLength = format.controlsOffset + controlCount * format.step;
                if (row.length < expectedRowLength) {
                    throwInvalidData("Data in row " + rowIndex + " should have at least " + expectedRowLength + " parts (for " + controlCount + " controls) but only has " + row.length);
                }
            }
            
            var courseLength = (format.length === null) ? null : parseCourseLength(row[format.length]);
            var courseClimb = (format.climb === null) ? null : parseCourseClimb(row[format.climb]);
            
            var cumTimes = [0];
            for (var cumTimeIndex = format.controlsOffset + 1; cumTimeIndex < expectedRowLength; cumTimeIndex += format.step) {
                cumTimes.push(parseTime(row[cumTimeIndex]));
            }
            
            if (format.finishTime !== null) {
                var finishTime = parseTime(row[format.finishTime]);
                var totalTime = (startTime === null || finishTime === null) ? null : (finishTime - startTime);
                cumTimes.push(totalTime);
            }
            
            var order = (classes.has(courseName)) ? classes.get(courseName).competitors.length + 1 : 1;
            
            var competitor = fromOriginalCumTimes(order, competitorName, club, startTime, cumTimes);
            if (format.placing !== null && competitor.completed()) {
                var placing = row[format.placing];
                if (!placing.match(/^\d*$/)) {
                    competitor.setNonCompetitive();
                }
            }
            
            if (!competitor.hasAnyTimes()) {
                competitor.setNonStarter();
            }
            
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
                var controls = [];
                for (var controlIndex = format.controlsOffset; controlIndex + terminationOffset < expectedRowLength; controlIndex += format.step) {
                    controls.push(row[controlIndex]);
                }
            
                classes.set(courseName, {length: courseLength, climb: courseClimb, controls: controls, competitors: [competitor]});
            }
        }
        
        var courseClasses = [];

        // Group the classes by the list of controls.  Two classes using the
        // same list of controls can be assumed to be using the same course.
        var controlsLists = [];
        var coursesByControlsLists = d3.map();
        
        classes.keys().forEach(function (className) {
            var cls = classes.get(className);
            var courseClass = new CourseClass(className, cls.controls.length, cls.competitors);
            courseClasses.push(courseClass);
            
            var controlsList = cls.controls.join(",");
            if (coursesByControlsLists.has(controlsList)) {
                coursesByControlsLists.get(controlsList).classes.push(courseClass);
            } else {
                controlsLists.push(controlsList);
                coursesByControlsLists.set(
                    controlsList, {name: className, classes: [courseClass], length: cls.length, climb: cls.climb, controls: cls.controls});
            }
        });
        
        var courses = [];
        controlsLists.forEach(function(controlsList) {
            var courseObject = coursesByControlsLists.get(controlsList);
            var course = new Course(courseObject.name, courseObject.classes, courseObject.length, courseObject.climb, courseObject.controls);    
            courseObject.classes.forEach(function (courseClass) { courseClass.setCourse(course); });
            courses.push(course);
        });
    
        return new Event(courseClasses, courses);
    }
    
    SplitsBrowser.Input.AlternativeCSV = {
        parseTripleColumnEventData: function (eventData) {
            return parseEventDataWithFormat(eventData, TRIPLE_COLUMN_FORMAT);
        }
    };
})();