/*
 *  SplitsBrowser SI - Reads in 'SI' results data files.
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
    
    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var parseCourseLength = SplitsBrowser.parseCourseLength;
    var parseCourseClimb = SplitsBrowser.parseCourseClimb;
    var normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    var DELIMITERS = [";", ",", "\t", "\\"];
    
    // Indexes of the various columns relative to the column for control-1.
    
    var COLUMN_INDEXES = {};
    
    [44, 46, 60].forEach(function (columnOffset) {
        COLUMN_INDEXES[columnOffset] = {
            course: columnOffset - 7,
            distance: columnOffset - 6,
            climb: columnOffset - 5,
            controlCount: columnOffset - 4,
            placing: columnOffset - 3,
            startPunch: columnOffset - 2,
            finish: columnOffset - 1,
            control1: columnOffset
        };
    });
    
    [44, 46].forEach(function (columnOffset) {
        COLUMN_INDEXES[columnOffset].nonCompetitive = columnOffset - 38;
        COLUMN_INDEXES[columnOffset].startTime = columnOffset - 37;
        COLUMN_INDEXES[columnOffset].time = columnOffset - 35;
        COLUMN_INDEXES[columnOffset].classifier = columnOffset - 34;
        COLUMN_INDEXES[columnOffset].club =  columnOffset - 31;
        COLUMN_INDEXES[columnOffset].className = columnOffset - 28;
    });
    
    COLUMN_INDEXES[44].combinedName = 3;
    COLUMN_INDEXES[44].yearOfBirth = 4;
    
    COLUMN_INDEXES[46].forename = 4;
    COLUMN_INDEXES[46].surname = 3;
    COLUMN_INDEXES[46].yearOfBirth = 5;
    COLUMN_INDEXES[46].gender = 6;
    
    COLUMN_INDEXES[60].forename = 6;
    COLUMN_INDEXES[60].surname = 5;
    COLUMN_INDEXES[60].yearOfBirth = 7;
    COLUMN_INDEXES[60].gender = 8;
    COLUMN_INDEXES[60].combinedName = 3;
    COLUMN_INDEXES[60].nonCompetitive = 10;
    COLUMN_INDEXES[60].startTime = 11;
    COLUMN_INDEXES[60].time = 13;
    COLUMN_INDEXES[60].classifier = 14;
    COLUMN_INDEXES[60].club = 20;
    COLUMN_INDEXES[60].className = 26;
    COLUMN_INDEXES[60].classNameFallback = COLUMN_INDEXES[60].course;
    COLUMN_INDEXES[60].clubFallback = 18;
    
    // Minimum control offset.
    var MIN_CONTROLS_OFFSET = 37;
    
    /**
    * Remove any leading and trailing double-quotes from the given string.
    * @param {String} value - The value to trim quotes from.
    * @return {String} The string with any leading and trailing quotes removed.
    */
    function dequote(value) {
        if (value[0] === '"' && value[value.length - 1] === '"') {
            value = value.substring(1, value.length - 1).replace(/""/g, '"').trim();
        }
        
        return value;
    }
    
    /**
    * Constructs an SI-format data reader.
    *
    * NOTE: The reader constructed can only be used to read data in once.
    * @constructor
    * @param {String} data - The SI data to read in.
    */
    function Reader(data) {
        this.data = normaliseLineEndings(data);
        
        // Map that associates classes to all of the competitors running on
        // that class.
        this.classes = d3.map();
        
        // Map that associates course names to length and climb values.
        this.courseDetails = d3.map();
        
        // Set of all pairs of classes and courses.
        // (While it is common that one course may have multiple classes, it
        // seems also that one class can be made up of multiple courses, e.g.
        // M21E at BOC 2013.)
        this.classCoursePairs = [];
        
        // The indexes of the columns that we read data from.
        this.columnIndexes = null;
    }

    /**
    * Identifies the delimiter character that delimits the columns of data.
    * @return {String} The delimiter character identified.
    */
    Reader.prototype.identifyDelimiter = function () {
        if (this.lines.length <= 1) {
            throwWrongFileFormat("No data found to read");
        }
        
        var firstDataLine = this.lines[1];
        for (var i = 0; i < DELIMITERS.length; i += 1) {
            var delimiter = DELIMITERS[i];
            if (firstDataLine.split(delimiter).length > MIN_CONTROLS_OFFSET) {
                return delimiter;
            }
        }
        
        throwWrongFileFormat("Data appears not to be in the SI CSV format");
    };
    
    /**
    * Identifies which variation on the SI CSV format we are parsing.
    *
    * At present, the only variations supported are 44-column, 46-column and
    * 60-column.  In all cases, the numbers count the columns before the
    * controls data.
    *
    * @param {String} delimiter - The character used to delimit the columns of
    *     data.
    */
    Reader.prototype.identifyFormatVariation = function (delimiter) {
        
        var firstLine = this.lines[1].split(delimiter);
        
        var controlCodeRegexp = /^[A-Za-z0-9]+$/;
        for (var columnOffset in COLUMN_INDEXES) {
            if (COLUMN_INDEXES.hasOwnProperty(columnOffset)) {
                // Convert columnOffset to a number.  It will presently be a
                // string because it is an object property.
                columnOffset = parseInt(columnOffset, 10);
                
                // We want there to be a control code at columnOffset, with
                // both preceding columns either blank or containing a valid
                // time.
                if (columnOffset < firstLine.length &&
                        controlCodeRegexp.test(firstLine[columnOffset]) &&
                        (firstLine[columnOffset - 2].trim() === "" || parseTime(firstLine[columnOffset - 2]) !== null) &&
                        (firstLine[columnOffset - 1].trim() === "" || parseTime(firstLine[columnOffset - 1]) !== null)) {
                           
                    // Now check the control count exists.  If not, we've
                    // probably got a triple-column CSV file instead.
                    var controlCountColumnIndex = COLUMN_INDEXES[columnOffset].controlCount;
                    if (firstLine[controlCountColumnIndex].trim() !== "") {
                        this.columnIndexes = COLUMN_INDEXES[columnOffset];
                        return;
                    }
                }
            }
        }
        
        throwWrongFileFormat("Did not find control 1 at any of the supported indexes");
    };
    
    /**
    * Returns the name of the class in the given row.
    * @param {Array} row - Array of row data.
    * @return {String} Class name.
    */
    Reader.prototype.getClassName = function (row) {
        var className = row[this.columnIndexes.className];
        if (className === "" && this.columnIndexes.hasOwnProperty("classNameFallback")) {
            // 'Nameless' variation: no class names.
            className = row[this.columnIndexes.classNameFallback];
        }
        return className;
    };

    /**
    * Reads the start-time in the given row.  The start punch time will
    * be used if it is available, otherwise the start time.
    * @param {Array} row - Array of row data.
    * @return {?Number} Parsed start time, or null for none.
    */
    Reader.prototype.getStartTime = function (row) {
        var startTimeStr = row[this.columnIndexes.startPunch];
        if (startTimeStr === "") {
            startTimeStr = row[this.columnIndexes.startTime];
        }
        
        return parseTime(startTimeStr);
    };
    
    /**
    * Returns the number of controls to expect on the given line.
    * @param {Array} row - Array of row data items.
    * @param {Number} lineNumber - The line number of the line.
    * @return {Number} Number of controls read.
    */
    Reader.prototype.getNumControls = function (row, lineNumber) {
        var className = this.getClassName(row);
        if (className.trim() === "") {
            throwInvalidData("Line " + lineNumber + " does not contain a class for the competitor");
        } else if (this.classes.has(className)) {
            return this.classes.get(className).numControls;
        } else {
            var numControls = parseInt(row[this.columnIndexes.controlCount], 10);
            if (isFinite(numControls)) {
                return numControls;
            } else {
                throwInvalidData("Could not read control count '" + row[this.columnIndexes.controlCount] + "' from line " + lineNumber);
            }
        }    
    };
    
    /**
    * Reads the cumulative times out of a row of competitor data.
    * @param {Array} row - Array of row data items.
    * @param {Number} lineNumber - Line number of the row within the source data.
    * @param {Number} numControls - The number of controls to read.
    * @return {Array} Array of cumulative times.
    */
    Reader.prototype.readCumulativeTimes = function (row, lineNumber, numControls) {
        
        var cumTimes = [0];
        
        for (var controlIdx = 0; controlIdx < numControls; controlIdx += 1) {
            var cellIndex = this.columnIndexes.control1 + 1 + 2 * controlIdx;
            var cumTimeStr = (cellIndex < row.length) ? row[cellIndex] : null;
            var cumTime = (cumTimeStr === null) ? null : parseTime(cumTimeStr);
            cumTimes.push(cumTime);
        }
        
        var totalTime = parseTime(row[this.columnIndexes.time]);
        if (totalTime === null) {
            // 'Nameless' variation: total time missing, so calculate from
            // start and finish times.
            var startTime = this.getStartTime(row);
            var finishTime = parseTime(row[this.columnIndexes.finish]);
            if (startTime !== null && finishTime !== null) {
                totalTime = finishTime - startTime;
            }
        }
        
        cumTimes.push(totalTime);
    
        return cumTimes;
    };
    
    /**
    * Checks to see whether the given row contains a new class, and if so,
    * creates it.
    * @param {Array} row - Array of row data items.
    * @param {Number} numControls - The number of controls to read.
    */
    Reader.prototype.createClassIfNecessary = function (row, numControls) {
        var className = this.getClassName(row);
        if (!this.classes.has(className)) {
            this.classes.set(className, { numControls: numControls, competitors: [] });
        }
    };
    
    /**
    * Checks to see whether the given row contains a new course, and if so,
    * creates it.
    * @param {Array} row - Array of row data items.
    * @param {Number} numControls - The number of controls to read.
    */
    Reader.prototype.createCourseIfNecessary = function (row, numControls) {
        var courseName = row[this.columnIndexes.course];
        if (!this.courseDetails.has(courseName)) {
            var controlNums = d3.range(0, numControls).map(function (controlIdx) { return row[this.columnIndexes.control1 + 2 * controlIdx]; }, this);
            this.courseDetails.set(courseName, {
                length: parseCourseLength(row[this.columnIndexes.distance]), 
                climb: parseCourseClimb(row[this.columnIndexes.climb]),
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
        var className = this.getClassName(row);
        var courseName = row[this.columnIndexes.course];
        
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
    
        var className = this.getClassName(row);
        var placing = row[this.columnIndexes.placing];
        var club = row[this.columnIndexes.club];
        if (club === "" && this.columnIndexes.hasOwnProperty("clubFallback")) {
            // Nameless variation: no club name, just number...
            club = row[this.columnIndexes.clubFallback];
        }
        
        var startTime = this.getStartTime(row);

        var isPlacingNonNumeric = (placing !== "" && isNaNStrict(parseInt(placing, 10)));
        
        var name = "";
        if (this.columnIndexes.hasOwnProperty("forename") && this.columnIndexes.hasOwnProperty("surname")) {
            var forename = row[this.columnIndexes.forename];
            var surname = row[this.columnIndexes.surname];
        
            // Some surnames have their placing appended to them, if their placing
            // isn't a number (e.g. mp, n/c).  If so, remove this.
            if (isPlacingNonNumeric && surname.substring(surname.length - placing.length) === placing) {
                surname = surname.substring(0, surname.length - placing.length).trim();
            }
            
            name = (forename + " " + surname).trim();
        }
        
        if (name === "" && this.columnIndexes.hasOwnProperty("combinedName")) {
            // 'Nameless' or 44-column variation.
            name = row[this.columnIndexes.combinedName];
            if (isPlacingNonNumeric && name.substring(name.length - placing.length) === placing) {
                name = name.substring(0, name.length - placing.length).trim();
            }
        }
        
        var order = this.classes.get(className).competitors.length + 1;
        var competitor = fromOriginalCumTimes(order, name, club, startTime, cumTimes);
        if ((row[this.columnIndexes.nonCompetitive] === "1" || isPlacingNonNumeric) && competitor.completed()) {
            // Competitor either marked as non-competitive, or has completed
            // the course but has a non-numeric placing.  In the latter case,
            // assume that they are non-competitive.
            competitor.setNonCompetitive();
        }
        
        var classifier = row[this.columnIndexes.classifier];
        if (classifier !== "" && classifier !== "0") {
            if (classifier === "1") {
                competitor.setNonStarter();
            } else if (classifier === "2") {
                competitor.setNonFinisher();
            } else if (classifier === "4") {
                competitor.disqualify();
            } else if (classifier === "5") {
                competitor.setOverMaxTime();
            }
        } else if (!competitor.hasAnyTimes()) {
            competitor.setNonStarter();
        }
        
        var yearOfBirthStr = row[this.columnIndexes.yearOfBirth];
        if (yearOfBirthStr !== "") {
            var yearOfBirth = parseInt(yearOfBirthStr, 10);
            if (!isNaNStrict(yearOfBirth)) {
                competitor.setYearOfBirth(yearOfBirth);
            }
        }
        
        if (this.columnIndexes.hasOwnProperty("gender")) {
            var gender = row[this.columnIndexes.gender];
            if (gender === "M" || gender === "F") {
                competitor.setGender(gender);
            }
        }

        this.classes.get(className).competitors.push(competitor);
    };
    
    /**
    * Parses the given line and adds it to the event data accumulated so far.
    * @param {String} line - The line to parse.
    * @param {Number} lineNumber - The number of the line (used in error
    *     messages).
    * @param {String} delimiter - The character used to delimit the columns of
    *     data.
    */
    Reader.prototype.readLine = function (line, lineNumber, delimiter) {
    
        if (line.trim() === "") {
            // Skip this blank line.
            return;
        }
    
        var row = line.split(delimiter).map(function (s) { return s.trim(); }).map(dequote);
        
        // Check the row is long enough to have all the data besides the
        // controls data.
        if (row.length < MIN_CONTROLS_OFFSET) {
            throwInvalidData("Too few items on line " + lineNumber + " of the input file: expected at least " + MIN_CONTROLS_OFFSET + ", got " + row.length);
        }
        
        var numControls = this.getNumControls(row, lineNumber);
        
        var cumTimes = this.readCumulativeTimes(row, lineNumber, numControls);
        
        this.createClassIfNecessary(row, numControls);
        this.createCourseIfNecessary(row, numControls);
        this.createClassCoursePairIfNecessary(row);
        
        this.addCompetitor(row, cumTimes);
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
    * Creates and return a list of CourseClass objects from all of the data read.
    * @return {Array} Array of CourseClass objects.
    */
    Reader.prototype.createClasses = function () {
        var classNames = this.classes.keys();
        classNames.sort();
        return classNames.map(function (className) {
            var courseClass = this.classes.get(className);
            return new CourseClass(className, courseClass.numControls, courseClass.competitors);
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
    * @param {d3.map} classesMap - Map that maps class names to CourseClass
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
        
        var classesForThisCourse = relatedClassNames.map(function (className) { return classesMap.get(className); });
        var details = this.courseDetails.get(initCourseName);
        var course = new Course(initCourseName, classesForThisCourse, details.length, details.climb, details.controls);
        
        classesForThisCourse.forEach(function (courseClass) {
            courseClass.setCourse(course);
        });
        
        return course;
    };
    
    /**
    * Sort through the data read in and create Course objects representing each
    * course in the event.
    * @param {Array} classes - Array of CourseClass objects read.
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
        classes.forEach(function (courseClass) {
            classesMap.set(courseClass.name, courseClass);
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
        
        this.lines = this.data.split(/\n/);
        
        var delimiter = this.identifyDelimiter();
        
        this.identifyFormatVariation(delimiter);
        
        // Discard the header row.
        this.lines.shift();
        
        this.lines.forEach(function (line, lineIndex) {
            this.readLine(line, lineIndex + 1, delimiter);
        }, this);
        
        var classes = this.createClasses();
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