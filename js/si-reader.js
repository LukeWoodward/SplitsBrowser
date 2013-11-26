/*
 *  SplitsBrowser SI - Reads in 'SI' results data files.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    
    // Indexes into the columns.
    var COLUMN_INDEXES = {
        SURNAME: 3,
        FORENAME: 4,
        START: 9,
        TIME: 11,
        CLUB: 15,
        AGE_CLASS: 18,
        COURSE: 39,
        DISTANCE: 40,
        CLIMB: 41,
        CONTROL_COUNT: 42,
        PLACING: 43
    };
    
    // Index of the first column of control-specific data.
    var CONTROLS_OFFSET = 46;
    
    SplitsBrowser.Input.SI = {};
    
    /**
    * Checks that two consecutive cumulative times are in strictly ascending
    * order, and throws an exception if not.  The previous time should not be
    * null, but the next time may, and no exception will be thrown in this
    * case.
    * @param {Number} prevTime - The previous cumulative time, in seconds.
    * @param {Number} nextTime - The next cumulative time, in seconds.
    */
    SplitsBrowser.Input.SI.verifyCumulativeTimesInOrder = function (prevTime, nextTime) {
        if (nextTime !== null && nextTime <= prevTime) {
            SplitsBrowser.throwInvalidData("Cumulative times must be strictly ascending: read " +
                    SplitsBrowser.formatTime(prevTime) + " and " + SplitsBrowser.formatTime(nextTime) +
                    " in that order");
        }
    };
    
    /**
    * Sort through the data read in and create the course objects.
    * @param {Array} classes - Array of AgeClass objects.
    * @param {d3.map} courseDetails - Map that maps course names to lengths and
    *      climbs.
    * @param {Array} classCoursePairs - Array of 2-element array of
    *      (class name, curse name) pairs.
    * @return {Array} Array of course objects.
    */
    SplitsBrowser.Input.SI.determineCourses = function (classes, courseDetails, classCoursePairs) {
        // What we have to watch out for is one class using the multiple courses.
        // We support either:
        // * One class made up from multiple courses, or
        // * One course made up from multiple classes.
        // Anything else is not supported.
        
        var classesToCourses = d3.map();
        var coursesToClasses = d3.map();
        
        classCoursePairs.forEach(function (pair) {
            var className = pair[0];
            var courseName = pair[1];
            
            if (classesToCourses.has(className)) {
                classesToCourses.get(className).push(courseName);
            } else {
                classesToCourses.set(className, [courseName]);
            }
            
            if (coursesToClasses.has(courseName)) {
                coursesToClasses.get(courseName).push(className);
            } else {
                coursesToClasses.set(courseName, [className]);
            }
        });
        
        
        // As we work our way through the courses and classes, we may find one
        // class made up from multiple courses (e.g. in BOC2013, class M21E
        // uses course 1A and 1B).  In this set we collect up all of the
        // courses that we have now processed, so that if we later come across
        // one we've already dealt with, we can ignore it.
        var doneCourses = d3.set();
        
        var classesMap = d3.map();
        classes.forEach(function (ageClass) {
            classesMap.set(ageClass.name, ageClass);
        });
        
        var courses = [];
        
        coursesToClasses.keys().forEach(function (courseName) {
            
            if (!doneCourses.has(courseName)) {
                // Find all of the courses and classes that are related.
                // It's not always as simple as one course having multiple
                // classes, as there can be multiple courses for one single
                // class, and even multiple courses among multiple classes
                // (e.g. M20E, M18E on courses 3, 3B at BOC 2013.)
                
                // (For the graph theorists among you, imagine the bipartite
                // graph with classes on one side and courses on the other.  We
                // want to find the connected subgraph that this course belongs
                // to.)
                
                var courseNamesToDo = [courseName];
                var classNamesToDo = [];
                var relatedCourseNames = [];
                var relatedClassNames = [];
                
                var crsName;
                var clsName;
                
                while (courseNamesToDo.length > 0 || classNamesToDo.length > 0) {
                    while (courseNamesToDo.length > 0) {
                        crsName = courseNamesToDo.shift();
                        var clsNames = coursesToClasses.get(crsName);
                        for (var clsIdx = 0; clsIdx < clsNames.length; clsIdx += 1) {
                            clsName = clsNames[clsIdx];
                            if (classNamesToDo.indexOf(clsName) < 0 && relatedClassNames.indexOf(clsName) < 0) {
                                classNamesToDo.push(clsName);
                            }
                        }
                        
                        relatedCourseNames.push(crsName);
                    }
                    
                    while (classNamesToDo.length > 0) {
                        clsName = classNamesToDo.shift();
                        var crsNames = classesToCourses.get(clsName);
                        for (var crsIdx = 0; crsIdx < crsNames.length; crsIdx += 1) {
                            crsName = crsNames[crsIdx];
                            if (courseNamesToDo.indexOf(crsName) < 0 && relatedCourseNames.indexOf(crsName) < 0) {
                                courseNamesToDo.push(crsName);
                            }
                        }
                        
                        relatedClassNames.push(clsName);
                    }
                }
                
                // Mark all of the courses that we handled here as done.
                relatedCourseNames.forEach(function (crsName) {
                    doneCourses.add(crsName);
                });
                
                var courseClasses = relatedClassNames.map(function (clsName) { return classesMap.get(clsName); });
                var details = courseDetails.get(courseName);
                var course = new SplitsBrowser.Model.Course(courseName, courseClasses, details.length, details.climb, details.controls);
                
                courseClasses.forEach(function (ageClass) {
                    ageClass.setCourse(course);
                });
                
                courses.push(course);
            }
        });
        
        return courses;
    };
    
    /**
    * Parse 'SI' data read from a semicolon-separated data string.
    * @param {String} data - The input data string read.
    * @return {SplitsBrowser.Model.Event} All event data read.
    */
    SplitsBrowser.Input.SI.parseEventData = function (data) {
        
        var lines = data.split(/\r?\n/);
        
        if (lines.length <= 1) {
             SplitsBrowser.throwWrongFileFormat("No data found to read");
        }
        
        var headers = lines[0].split(";");
        if (headers.length <= 1) {
            SplitsBrowser.throwWrongFileFormat("Data appears not to be in the SI CSV format");
        }
        
        // Discard the header row.
        lines.shift();
        
        // Map that associates classes to all of the competitors running on
        // that age class.
        var ageClasses = d3.map();
        
        // Map that associates courses to length and climb objects.
        var courseDetails = d3.map();
        
        // Set of all pairs of classes and courses.
        // (While it is common that one course may have multiple classes, it
        // seems also that one class can be made up of multiple courses, e.g.
        // M21E at BOC 2013.)
        var classCoursePairs = [];
        
        var anyLines = false;
        
        lines.forEach(function (line, lineIndex) {
        
            if (line === "") {
                // Skip this blank line.
                return;
            }
            
            anyLines = true;
        
            var row = line.split(";");
            
            // Check the row is long enough to have basic data.
            if (row.length < CONTROLS_OFFSET) {
                SplitsBrowser.throwInvalidData("Too few items on line " + (lineIndex + 1) + " of the input file: expected at least " + CONTROLS_OFFSET + ", got " + row.length);
            }
            
            var className = row[COLUMN_INDEXES.AGE_CLASS];
            
            var numControls;
            if (ageClasses.has(className)) {
                numControls = ageClasses.get(className).numControls;
            } else {
                numControls = parseInt(row[COLUMN_INDEXES.CONTROL_COUNT], 10);
            }
            
            // Check that the row is long enough, given that we now know how
            // many controls it should contain
            if (row.length <= CONTROLS_OFFSET + 1 + 2 * (numControls - 1)) {
                SplitsBrowser.throwInvalidData("Line " + (lineIndex + 1) + " reports " + numControls + " controls but there aren't enough data values in the row for this many controls");
            }
            
            var cumTimes = [0];
            var lastCumTime = 0;
            var anyTimes = false;
            
            for (var controlIdx = 0; controlIdx < numControls; controlIdx += 1) {
                var cumTimeStr = row[CONTROLS_OFFSET + 1 + 2 * controlIdx];
                var cumTime = SplitsBrowser.parseTime(cumTimeStr);
                SplitsBrowser.Input.SI.verifyCumulativeTimesInOrder(lastCumTime, cumTime);
                
                cumTimes.push(cumTime);
                if (cumTime !== null) {
                    lastCumTime = cumTime;
                    anyTimes = true;
                }
            }
            
            if (!anyTimes) {
                // No splits at all. Ignore this competitor.
                return;
            }
            
            if (!ageClasses.has(className)) {
                ageClasses.set(className, { numControls: numControls, competitors: [] });
            }
            
            var courseName = row[COLUMN_INDEXES.COURSE];
            if (!courseDetails.has(courseName)) {
                var controlNums = d3.range(0, numControls).map(function (controlIdx) { return row[CONTROLS_OFFSET + 2 * controlIdx]; });
                courseDetails.set(courseName, {
                    length: parseFloat(row[COLUMN_INDEXES.DISTANCE]) || null,
                    climb: parseInt(row[COLUMN_INDEXES.CLIMB], 10) || null,
                    controls: controlNums
                });
            }
            
            if (!classCoursePairs.some(function (pair) { return pair[0] === className && pair[1] === courseName; })) {
                classCoursePairs.push([className, courseName]);
            }
            
            var totalTime = SplitsBrowser.parseTime(row[COLUMN_INDEXES.TIME]);
            SplitsBrowser.Input.SI.verifyCumulativeTimesInOrder(lastCumTime, totalTime);
            
            cumTimes.push(totalTime);
        
            var forename = row[COLUMN_INDEXES.FORENAME];
            var surname = row[COLUMN_INDEXES.SURNAME];
            var club = row[COLUMN_INDEXES.CLUB];
            var startTime = SplitsBrowser.parseTime(row[COLUMN_INDEXES.START]);
            
            // Some surnames have their placing appended to them.  If so,
            // remove it.
            var placing = row[COLUMN_INDEXES.PLACING];
            if (isNaN(parseInt(placing, 10)) && surname.substring(surname.length - placing.length) === placing) {
                surname = $.trim(surname.substring(0, surname.length - placing.length));
            }
            
            var order = ageClasses.get(className).competitors.length + 1;
            var competitor = SplitsBrowser.Model.Competitor.fromCumTimes(order, forename, surname, club, startTime, cumTimes);
            if (isNaN(parseInt(row[COLUMN_INDEXES.PLACING], 10)) && competitor.completed()) {
                // Competitor has completed the course but has no placing.
                // Assume that they are non-competitive.
                competitor.setNonCompetitive();
            }

            ageClasses.get(className).competitors.push(competitor);
        });
        
        if (!anyLines) {
            SplitsBrowser.throwWrongFileFormat("No rows of data were found");
        }
        
        var classNames = ageClasses.keys();
        classNames.sort();
        var classes = classNames.map(function (className) {
            var ageClass = ageClasses.get(className);
            return new SplitsBrowser.Model.AgeClass(className, ageClass.numControls, ageClass.competitors);
        });
        
        var courses = SplitsBrowser.Input.SI.determineCourses(classes, courseDetails, classCoursePairs);
        return new SplitsBrowser.Model.Event(classes, courses);
    };
})();