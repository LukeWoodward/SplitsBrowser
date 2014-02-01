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
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var formatTime = SplitsBrowser.formatTime;
    var parseTime = SplitsBrowser.parseTime;
    var Competitor = SplitsBrowser.Model.Competitor;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
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
    
    /**
    * Checks that two consecutive cumulative times are in strictly ascending
    * order, and throws an exception if not.  The previous time should not be
    * null, but the next time may, and no exception will be thrown in this
    * case.
    * @param {Number} prevTime - The previous cumulative time, in seconds.
    * @param {Number} nextTime - The next cumulative time, in seconds.
    */
    function verifyCumulativeTimesInOrder(prevTime, nextTime) {
        if (nextTime !== null && nextTime <= prevTime) {
            throwInvalidData("Cumulative times must be strictly ascending: read " +
                    formatTime(prevTime) + " and " + formatTime(nextTime) +
                    " in that order");
        }
    }
    
    /**
    * Constructs an SI-format data reader.
    *
    * NOTE: The reader constructed can only be used to read data in once.
    * @constructor
    * @param {String} data - The SI data to read in.
    */
    var Reader = function (data) {
        this.data = data;
        
        // Map that associates classes to all of the competitors running on
        // that age class.
        this.ageClasses = d3.map();
        
        // Map that associates course names to length and climb values.
        this.courseDetails = d3.map();
        
        // Set of all pairs of classes and courses.
        // (While it is common that one course may have multiple classes, it
        // seems also that one class can be made up of multiple courses, e.g.
        // M21E at BOC 2013.)
        this.classCoursePairs = [];

        // Whether any competitors have been read in at all.  Blank lines are
        // ignored, as are competitors that have no times at all.
        this.anyCompetitors = false;
    };

    /**
    * Checks that the data read in contains a header that suggests it is
    * SI-format data.
    */
    Reader.prototype.checkHeader = function() {
        if (this.lines.length <= 1) {
            throwWrongFileFormat("No data found to read");
        }
        
        var headers = this.lines[0].split(";");
        if (headers.length <= 1) {
            throwWrongFileFormat("Data appears not to be in the SI CSV format");
        }
    };
    
    /**
    * Returns the number of controls to expect on the given line.
    * @param {Array} row - Array of row data items.
    * @return {Number} Number of controls read.
    */
    Reader.prototype.getNumControls = function (row) {
        var className = row[COLUMN_INDEXES.AGE_CLASS];
        if (this.ageClasses.has(className)) {
            return this.ageClasses.get(className).numControls;
        } else {
            return parseInt(row[COLUMN_INDEXES.CONTROL_COUNT], 10);
        }    
    };
    
    /**
    * Reads the split times out of a row of competitor data.
    * @param {Array} row - Array of row data items.
    * @param {Number} lineNumber - Line number of the row within the source data.
    * @param {Number} numControls - The number of controls to read.
    */
    Reader.prototype.readCumulativeTimes = function (row, lineNumber, numControls) {
        
        // Check that the row is long enough for all of the control data,
        // given that we now know how many controls it should contain.
        if (row.length <= CONTROLS_OFFSET + 1 + 2 * (numControls - 1)) {
            throwInvalidData("Line " + lineNumber + " reports " + numControls + " controls but there aren't enough data values in the row for this many controls");
        }
        
        var cumTimes = [0];
        var lastCumTime = 0;
        
        for (var controlIdx = 0; controlIdx < numControls; controlIdx += 1) {
            var cumTimeStr = row[CONTROLS_OFFSET + 1 + 2 * controlIdx];
            var cumTime = parseTime(cumTimeStr);
            verifyCumulativeTimesInOrder(lastCumTime, cumTime);
            
            cumTimes.push(cumTime);
            if (cumTime !== null) {
                lastCumTime = cumTime;
            }
        }
        
        var totalTime = parseTime(row[COLUMN_INDEXES.TIME]);
        verifyCumulativeTimesInOrder(lastCumTime, totalTime);
        cumTimes.push(totalTime);
    
        return cumTimes;
    };
    
    /**
    * Checks to see whether the given row contains a new age-class, and if so,
    * creates it.
    * @param {Array} row - Array of row data items.
    * @param {Number} numControls - The number of controls to read.
    */
    Reader.prototype.createAgeClassIfNecessary = function (row, numControls) {
        var className = row[COLUMN_INDEXES.AGE_CLASS];
        if (!this.ageClasses.has(className)) {
            this.ageClasses.set(className, { numControls: numControls, competitors: [] });
        }
    };
    
    /**
    * Checks to see whether the given row contains a new course, and if so,
    * creates it.
    * @param {Array} row - Array of row data items.
    * @param {Number} numControls - The number of controls to read.
    */
    Reader.prototype.createCourseIfNecessary = function (row, numControls) {

        var courseName = row[COLUMN_INDEXES.COURSE];
        if (!this.courseDetails.has(courseName)) {
            var controlNums = d3.range(0, numControls).map(function (controlIdx) { return row[CONTROLS_OFFSET + 2 * controlIdx]; });
            this.courseDetails.set(courseName, {
                length: parseFloat(row[COLUMN_INDEXES.DISTANCE]) || null,
                climb: parseInt(row[COLUMN_INDEXES.CLIMB], 10) || null,
                controls: controlNums
            });
        }
    };

    /**
    * Checks to see whether the given row contains a class-course pairing that
    * we haven't seen so far, and adds one if not.
    * @param {Array} row - Array of row data items.
    */
    Reader.prototype.createClassCoursePairIfNecessary = function (row) {
        var className = row[COLUMN_INDEXES.AGE_CLASS];
        var courseName = row[COLUMN_INDEXES.COURSE];
        
        if (!this.classCoursePairs.some(function (pair) { return pair[0] === className && pair[1] === courseName; })) {
            this.classCoursePairs.push([className, courseName]);
        }
    };
    
    /**
    * Reads in the competitor-specific data from the given row and adds it to
    * the event data read so far.
    * @param {Array} row - Row of items read from a line of the input data.
    * @param {Array} cumTimes - Array of cumulative times for the competitor.
    */
    Reader.prototype.addCompetitor = function (row, cumTimes) {
    
        var className = row[COLUMN_INDEXES.AGE_CLASS];
        
        var forename = row[COLUMN_INDEXES.FORENAME];
        var surname = row[COLUMN_INDEXES.SURNAME];
        var club = row[COLUMN_INDEXES.CLUB];
        var startTime = parseTime(row[COLUMN_INDEXES.START]);
        
        // Some surnames have their placing appended to them, if their placing
        // isn't a number (e.g. mp, n/c).  If so, remove this.
        var placing = row[COLUMN_INDEXES.PLACING];
        var isPlacingNonNumeric = isNaN(parseInt(placing, 10));
        if (isPlacingNonNumeric && surname.substring(surname.length - placing.length) === placing) {
            surname = $.trim(surname.substring(0, surname.length - placing.length));
        }
        
        var order = this.ageClasses.get(className).competitors.length + 1;
        var competitor = Competitor.fromCumTimes(order, forename + " " + surname, club, startTime, cumTimes);
        if (isPlacingNonNumeric && competitor.completed()) {
            // Competitor has completed the course but has no placing.
            // Assume that they are non-competitive.
            competitor.setNonCompetitive();
        }

        this.ageClasses.get(className).competitors.push(competitor);
    };
    
    /**
    * Parses the given line and adds it to the event data accumulated so far.
    * @param {String} line - The line to parse.
    * @param {Number} lineNumber - The number of the line (used in error
    *     messages).
    */
    Reader.prototype.readLine = function (line, lineNumber) {
    
        if ($.trim(line) === "") {
            // Skip this blank line.
            return;
        }
    
        var row = line.split(";");
        
        // Check the row is long enough to have all the data besides the
        // controls data.
        if (row.length < CONTROLS_OFFSET) {
            throwInvalidData("Too few items on line " + lineNumber + " of the input file: expected at least " + CONTROLS_OFFSET + ", got " + row.length);
        }
        
        var numControls = this.getNumControls(row);
        
        var cumTimes = this.readCumulativeTimes(row, lineNumber, numControls);
        if (cumTimes.some(function (time) { return (time !== null && time !== 0); })) {
            // This competitor has at least one cumulative split, so add them.
            this.anyCompetitors = true;
            
            this.createAgeClassIfNecessary(row, numControls);
            this.createCourseIfNecessary(row, numControls);
            this.createClassCoursePairIfNecessary(row);
            
            this.addCompetitor(row, cumTimes);
        }
    };
    
    /**
    * Creates maps that describe the many-to-many join between the class names
    * and course names. 
    * @return {Object} Object that contains two maps describing the
    *     many-to-many join.
    */    
    Reader.prototype.getMapsBetweenClassesAndCourses = function () {
        
        var classesToCourses = d3.map();
        var coursesToClasses = d3.map();
        
        this.classCoursePairs.forEach(function (pair) {
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
        
        return {classesToCourses: classesToCourses, coursesToClasses: coursesToClasses};
    };
    
    /**
    * Creates and return a list of AgeClass objects from all of the data read.
    * @return {Array} Array of AgeClass objects.
    */
    Reader.prototype.createAgeClasses = function () {
        var classNames = this.ageClasses.keys();
        classNames.sort();
        return classNames.map(function (className) {
            var ageClass = this.ageClasses.get(className);
            return new AgeClass(className, ageClass.numControls, ageClass.competitors);
        }, this);
    };
    
    /**
    * Find all of the courses and classes that are related to the given course.
    *
    * It's not always as simple as one course having multiple classes, as there
    * can be multiple courses for one single class, and even multiple courses
    * among multiple classes (e.g. M20E, M18E on courses 3, 3B at BOC 2013.)
    * Essentially, we have a many-to-many join, and we want to pull out of that
    * all of the classes and courses linked to the one course with the given
    * name.
    * 
    * (For the graph theorists among you, imagine the bipartite graph with
    * classes on one side and courses on the other.  We want to find the
    * connected subgraph that this course belongs to.)
    *
    * @param {String} initCourseName - The name of the initial course.
    * @param {Object} manyToManyMaps - Object that contains the two maps that
    *     map between class names and course names.
    * @param {d3.set} doneCourseNames - Set of all course names that have been
    *     'done', i.e. included in a Course object that has been returned from
    *     a call to this method.
    * @param {d3.map} classesMap - Map that maps age-class names to AgeClass
    *     objects.
    * @return {SplitsBrowser.Model.Course} - The created Course object.
    */
    Reader.prototype.createCourseFromLinkedClassesAndCourses = function (initCourseName, manyToManyMaps, doneCourseNames, classesMap) {

        var courseNamesToDo = [initCourseName];
        var classNamesToDo = [];
        var relatedCourseNames = [];
        var relatedClassNames = [];
        
        var courseName;
        var className;
        
        while (courseNamesToDo.length > 0 || classNamesToDo.length > 0) {
            while (courseNamesToDo.length > 0) {
                courseName = courseNamesToDo.shift();
                var classNames = manyToManyMaps.coursesToClasses.get(courseName);
                for (var clsIdx = 0; clsIdx < classNames.length; clsIdx += 1) {
                    className = classNames[clsIdx];
                    if (classNamesToDo.indexOf(className) < 0 && relatedClassNames.indexOf(className) < 0) {
                        classNamesToDo.push(className);
                    }
                }
                
                relatedCourseNames.push(courseName);
            }
            
            while (classNamesToDo.length > 0) {
                className = classNamesToDo.shift();
                var courseNames = manyToManyMaps.classesToCourses.get(className);
                for (var crsIdx = 0; crsIdx < courseNames.length; crsIdx += 1) {
                    courseName = courseNames[crsIdx];
                    if (courseNamesToDo.indexOf(courseName) < 0 && relatedCourseNames.indexOf(courseName) < 0) {
                        courseNamesToDo.push(courseName);
                    }
                }
                
                relatedClassNames.push(className);
            }
        }
        
        // Mark all of the courses that we handled here as done.
        relatedCourseNames.forEach(function (courseName) {
            doneCourseNames.add(courseName);
        });
        
        var courseClasses = relatedClassNames.map(function (className) { return classesMap.get(className); });
        var details = this.courseDetails.get(initCourseName);
        var course = new Course(initCourseName, courseClasses, details.length, details.climb, details.controls);
        
        courseClasses.forEach(function (ageClass) {
            ageClass.setCourse(course);
        });
        
        return course;
    };
    
    /**
    * Sort through the data read in and create Course objects representing each
    * course in the event.
    * @param {Array} classes - Array of AgeClass objects read.
    * @return {Array} Array of course objects.
    */
    Reader.prototype.determineCourses = function (classes) {
        
        var manyToManyMaps = this.getMapsBetweenClassesAndCourses();
        
        // As we work our way through the courses and classes, we may find one
        // class made up from multiple courses (e.g. in BOC2013, class M21E
        // uses course 1A and 1B).  In this set we collect up all of the
        // courses that we have now processed, so that if we later come across
        // one we've already dealt with, we can ignore it.
        var doneCourseNames = d3.set();
        
        var classesMap = d3.map();
        classes.forEach(function (ageClass) {
            classesMap.set(ageClass.name, ageClass);
        });
        
        // List of all Course objects created so far.
        var courses = [];
        manyToManyMaps.coursesToClasses.keys().forEach(function (courseName) {
            if (!doneCourseNames.has(courseName)) {
                var course = this.createCourseFromLinkedClassesAndCourses(courseName, manyToManyMaps, doneCourseNames, classesMap);
                courses.push(course);
            }
        }, this);
        
        return courses;
    };
    
    /**
    * Parses the read-in data and returns it.
    * @return {SplitsBrowser.Model.Event} Event-data read.
    */
    Reader.prototype.parseEventData = function () {
        
        this.lines = this.data.split(/\r?\n/);
        
        this.checkHeader();
        
        // Discard the header row.
        this.lines.shift();
        
        this.lines.forEach(function (line, lineIndex) {
            this.readLine(line, lineIndex + 1);
        }, this);
        
        if (!this.anyCompetitors) {
            throwInvalidData("No competitors' data were found");
        }
        
        var classes = this.createAgeClasses();
        var courses = this.determineCourses(classes);
        return new Event(classes, courses);
    };
    
    SplitsBrowser.Input.SI = {};
    
    /**
    * Parse 'SI' data read from a semicolon-separated data string.
    * @param {String} data - The input data string read.
    * @return {SplitsBrowser.Model.Event} All event data read.
    */
    SplitsBrowser.Input.SI.parseEventData = function (data) {
        var reader = new Reader(data);
        return reader.parseEventData();
    };
})();