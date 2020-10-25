/*
 *  SplitsBrowser OE Reader - Reads in OE CSV results data files.
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

    const throwInvalidData = SplitsBrowser.throwInvalidData;
    const throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    const isNaNStrict = SplitsBrowser.isNaNStrict;
    const parseCourseLength = SplitsBrowser.parseCourseLength;
    const parseCourseClimb = SplitsBrowser.parseCourseClimb;
    const normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    const parseTime = SplitsBrowser.parseTime;
    const fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    const Competitor = SplitsBrowser.Model.Competitor;
    const CourseClass = SplitsBrowser.Model.CourseClass;
    const Course = SplitsBrowser.Model.Course;
    const Event = SplitsBrowser.Model.Event;

    const DELIMITERS = [";", ",", "\t", "\\"];

    // Indexes of the various columns relative to the column for control-1.

    const COLUMN_INDEXES = new Map();

    for (let columnOffset of [44, 46, 60]) {
        COLUMN_INDEXES.set(columnOffset, new Map([
            ["course", columnOffset - 7],
            ["distance", columnOffset - 6],
            ["climb", columnOffset - 5],
            ["controlCount", columnOffset - 4],
            ["placing", columnOffset - 3],
            ["startPunch", columnOffset - 2],
            ["finish", columnOffset - 1],
            ["control1", columnOffset]
        ]));
    }

    for (let columnOffset of [44, 46]) {
        COLUMN_INDEXES.get(columnOffset).set("nonCompetitive", columnOffset - 38);
        COLUMN_INDEXES.get(columnOffset).set("startTime", columnOffset - 37);
        COLUMN_INDEXES.get(columnOffset).set("time", columnOffset - 35);
        COLUMN_INDEXES.get(columnOffset).set("classifier", columnOffset - 34);
        COLUMN_INDEXES.get(columnOffset).set("club", columnOffset - 31);
        COLUMN_INDEXES.get(columnOffset).set("className", columnOffset - 28);
    }

    COLUMN_INDEXES.get(44).set("combinedName", 3);
    COLUMN_INDEXES.get(44).set("yearOfBirth", 4);

    COLUMN_INDEXES.get(46).set("forename", 4);
    COLUMN_INDEXES.get(46).set("surname", 3);
    COLUMN_INDEXES.get(46).set("yearOfBirth", 5);
    COLUMN_INDEXES.get(46).set("gender", 6);

    COLUMN_INDEXES.get(60).set("forename", 6);
    COLUMN_INDEXES.get(60).set("surname", 5);
    COLUMN_INDEXES.get(60).set("yearOfBirth", 7);
    COLUMN_INDEXES.get(60).set("gender", 8);
    COLUMN_INDEXES.get(60).set("combinedName", 3);
    COLUMN_INDEXES.get(60).set("nonCompetitive", 10);
    COLUMN_INDEXES.get(60).set("startTime", 11);
    COLUMN_INDEXES.get(60).set("time", 13);
    COLUMN_INDEXES.get(60).set("classifier", 14);
    COLUMN_INDEXES.get(60).set("club", 20);
    COLUMN_INDEXES.get(60).set("className", 26);
    COLUMN_INDEXES.get(60).set("classNameFallback", COLUMN_INDEXES.get(60).get("course"));
    COLUMN_INDEXES.get(60).set("clubFallback", 18);

    // Minimum control offset.
    const MIN_CONTROLS_OFFSET = 37;

    /**
     * Remove any leading and trailing double-quotes from the given string.
     * @param {String} value The value to trim quotes from.
     * @return {String} The string with any leading and trailing quotes removed.
     */
    function dequote(value) {
        if (value[0] === '"' && value[value.length - 1] === '"') {
            value = value.substring(1, value.length - 1).replace(/""/g, '"').trim();
        }

        return value;
    }

    /**
     * Constructs an OE-format data reader.
     *
     * NOTE: The reader constructed can only be used to read data in once.
     * @constructor
     * @param {String} data The OE data to read in.
     */
    class Reader {
        constructor(data) {
            this.data = normaliseLineEndings(data);

            // Map that associates classes to all of the results running on
            // that class.
            this.classes = new Map();

            // Map that associates course names to length and climb values.
            this.courseDetails = new Map();

            // Set of all pairs of classes and courses.
            // (While it is common that one course may have multiple classes, it
            // seems also that one class can be made up of multiple courses, e.g.
            // M21E at BOC 2013.)
            this.classCoursePairs = [];

            // The indexes of the columns that we read data from.
            this.columnIndexes = null;

            // Warnings about results that cannot be read in.
            this.warnings = [];
        }

        /**
         * Identifies the delimiter character that delimits the columns of data.
         * @return {String} The delimiter character identified.
         */
        identifyDelimiter() {
            if (this.lines.length <= 1) {
                throwWrongFileFormat("No data found to read");
            }

            let firstDataLine = this.lines[1];
            for (let delimiter of DELIMITERS) {
                if (firstDataLine.split(delimiter).length > MIN_CONTROLS_OFFSET) {
                    return delimiter;
                }
            }

            throwWrongFileFormat("Data appears not to be in the OE CSV format");
        }

        /**
         * Identifies which variation on the OE CSV format we are parsing.
         *
         * At present, the only variations supported are 44-column, 46-column and
         * 60-column.  In all cases, the numbers count the columns before the
         * controls data.
         *
         * @param {String} delimiter The character used to delimit the columns of
         *     data.
         */
        identifyFormatVariation(delimiter) {

            let firstLine = this.lines[1].split(delimiter);

            let controlCodeRegexp = /^[A-Za-z0-9]+$/;
            for (let [columnOffset, columnIndexes] of COLUMN_INDEXES.entries()) {
                // We want there to be a control code at columnOffset, with
                // both preceding columns either blank or containing a valid
                // time.
                if (columnOffset < firstLine.length &&
                    controlCodeRegexp.test(firstLine[columnOffset]) &&
                    (firstLine[columnOffset - 2].trim() === "" || parseTime(firstLine[columnOffset - 2]) !== null) &&
                    (firstLine[columnOffset - 1].trim() === "" || parseTime(firstLine[columnOffset - 1]) !== null)) {

                    // Now check the control count exists.  If not, we've
                    // probably got a triple-column CSV file instead.
                    let controlCountColumnIndex = columnIndexes.get("controlCount");
                    if (firstLine[controlCountColumnIndex].trim() !== "") {
                        this.columnIndexes = columnIndexes;
                        return;
                    }
                }
            }

            throwWrongFileFormat("Did not find control 1 at any of the supported indexes");
        }

        /**
         * Returns the name of the class in the given row.
         * @param {Array} row Array of row data.
         * @return {String} Class name.
         */
        getClassName(row) {
            let className = row[this.columnIndexes.get("className")];
            if (className === "" && this.columnIndexes.has("classNameFallback")) {
                // 'Nameless' variation: no class names.
                className = row[this.columnIndexes.get("classNameFallback")];
            }
            return className;
        }

        /**
         * Reads the start-time in the given row.  The start punch time will
         * be used if it is available, otherwise the start time.
         * @param {Array} row Array of row data.
         * @return {Number|null} Parsed start time, or null for none.
         */
        getStartTime(row) {
            let startTimeStr = row[this.columnIndexes.get("startPunch")];
            if (startTimeStr === "") {
                startTimeStr = row[this.columnIndexes.get("startTime")];
            }

            return parseTime(startTimeStr);
        }

        /**
         * Returns the number of controls to expect on the given line.
         * @param {Array} row Array of row data items.
         * @param {Number} lineNumber The line number of the line.
         * @return {Number|null} The number of controls, or null if the count could not be read.
         */
        getNumControls(row, lineNumber) {
            let className = this.getClassName(row);
            let name;
            if (className.trim() === "") {
                name = this.getName(row) || "<name unknown>";
                this.warnings.push(`Could not find a class for competitor '${name}' (line ${lineNumber})`);
                return null;
            } else if (this.classes.has(className)) {
                return this.classes.get(className).numControls;
            } else {
                let numControls = parseInt(row[this.columnIndexes.get("controlCount")], 10);
                if (isFinite(numControls)) {
                    return numControls;
                } else {
                    name = this.getName(row) || "<name unknown>";
                    this.warnings.push(`Could not read the control count '${row[this.columnIndexes.get("controlCount")]}' for competitor '${name}' from line ${lineNumber}`);
                    return null;
                }
            }
        }

        /**
         * Reads the cumulative times out of a row of competitor data.
         * @param {Array} row Array of row data items.
         * @param {Number} lineNumber Line number of the row within the source data.
         * @param {Number} numControls The number of controls to read.
         * @return {Array} Array of cumulative times.
         */
        readCumulativeTimes(row, lineNumber, numControls) {
            let cumTimes = [0];

            for (let controlIdx = 0; controlIdx < numControls; controlIdx += 1) {
                let cellIndex = this.columnIndexes.get("control1") + 1 + 2 * controlIdx;
                let cumTimeStr = (cellIndex < row.length) ? row[cellIndex] : null;
                let cumTime = (cumTimeStr === null) ? null : parseTime(cumTimeStr);
                cumTimes.push(cumTime);
            }

            let totalTime = parseTime(row[this.columnIndexes.get("time")]);
            if (totalTime === null) {
                // 'Nameless' variation: total time missing, so calculate from
                // start and finish times.
                let startTime = this.getStartTime(row);
                let finishTime = parseTime(row[this.columnIndexes.get("finish")]);
                if (startTime !== null && finishTime !== null) {
                    totalTime = finishTime - startTime;
                }
            }

            cumTimes.push(totalTime);

            return cumTimes;
        }

        /**
         * Checks to see whether the given row contains a new class, and if so,
         * creates it.
         * @param {Array} row Array of row data items.
         * @param {Number} numControls The number of controls to read.
         */
        createClassIfNecessary(row, numControls) {
            let className = this.getClassName(row);
            if (!this.classes.has(className)) {
                this.classes.set(className, { numControls: numControls, results: [] });
            }
        }

        /**
         * Checks to see whether the given row contains a new course, and if so,
         * creates it.
         * @param {Array} row Array of row data items.
         * @param {Number} numControls The number of controls to read.
         */
        createCourseIfNecessary(row, numControls) {
            let courseName = row[this.columnIndexes.get("course")];
            if (!this.courseDetails.has(courseName)) {
                let controlNums = d3.range(0, numControls).map(controlIdx => row[this.columnIndexes.get("control1") + 2 * controlIdx]);
                this.courseDetails.set(courseName, {
                    length: parseCourseLength(row[this.columnIndexes.get("distance")]),
                    climb: parseCourseClimb(row[this.columnIndexes.get("climb")]),
                    controls: controlNums
                });
            }
        }

        /**
         * Checks to see whether the given row contains a class-course pairing that
         * we haven't seen so far, and adds one if not.
         * @param {Array} row Array of row data items.
         */
        createClassCoursePairIfNecessary(row) {
            let className = this.getClassName(row);
            let courseName = row[this.columnIndexes.get("course")];

            if (!this.classCoursePairs.some(pair => pair[0] === className && pair[1] === courseName)) {
                this.classCoursePairs.push([className, courseName]);
            }
        }

        /**
         * Reads the name of the competitor from the row.
         * @param {Array} row Array of row data items.
         * @return {String} The name of the competitor.
         */
        getName(row) {
            let name = "";

            if (this.columnIndexes.has("forename") && this.columnIndexes.has("surname")) {
                let forename = row[this.columnIndexes.get("forename")];
                let surname = row[this.columnIndexes.get("surname")];
                name = (forename + " " + surname).trim();
            }

            if (name === "" && this.columnIndexes.has("combinedName")) {
                // 'Nameless' or 44-column variation.
                name = row[this.columnIndexes.get("combinedName")];
            }

            return name;
        }

        /**
         * Reads in the competitor-specific data from the given row and adds it to
         * the event data read so far.
         * @param {Array} row Row of items read from a line of the input data.
         * @param {Array} cumTimes Array of cumulative times for the competitor.
         */
        addCompetitor(row, cumTimes) {

            let className = this.getClassName(row);
            let placing = row[this.columnIndexes.get("placing")];
            let club = row[this.columnIndexes.get("club")];
            if (club === "" && this.columnIndexes.has("clubFallback")) {
                // Nameless variation: no club name, just number...
                club = row[this.columnIndexes.get("clubFallback")];
            }

            let startTime = this.getStartTime(row);

            let name = this.getName(row);
            let isPlacingNonNumeric = (placing !== "" && isNaNStrict(parseInt(placing, 10)));
            if (isPlacingNonNumeric && name.substring(name.length - placing.length) === placing) {
                name = name.substring(0, name.length - placing.length).trim();
            }

            let order = this.classes.get(className).results.length + 1;
            let competitor = new Competitor(name, club);

            let yearOfBirthStr = row[this.columnIndexes.get("yearOfBirth")];
            if (yearOfBirthStr !== "") {
                let yearOfBirth = parseInt(yearOfBirthStr, 10);
                if (!isNaNStrict(yearOfBirth)) {
                    competitor.setYearOfBirth(yearOfBirth);
                }
            }

            if (this.columnIndexes.has("gender")) {
                let gender = row[this.columnIndexes.get("gender")];
                if (gender === "M" || gender === "F") {
                    competitor.setGender(gender);
                }
            }

            let result = fromOriginalCumTimes(order, startTime, cumTimes, competitor);
            if ((row[this.columnIndexes.get("nonCompetitive")] === "1" || isPlacingNonNumeric) && result.completed()) {
                // Competitor either marked as non-competitive, or has completed
                // the course but has a non-numeric placing.  In the latter case,
                // assume that they are non-competitive.
                result.setNonCompetitive();
            }

            let classifier = row[this.columnIndexes.get("classifier")];
            if (classifier !== "") {
                if (classifier === "0" && cumTimes.includes(null) && cumTimes[cumTimes.length - 1] !== null) {
                    result.setOKDespiteMissingTimes();
                } else if (classifier === "1") {
                    result.setNonStarter();
                } else if (classifier === "2") {
                    result.setNonFinisher();
                } else if (classifier === "4") {
                    result.disqualify();
                } else if (classifier === "5") {
                    result.setOverMaxTime();
                }
            } else if (!result.hasAnyTimes()) {
                result.setNonStarter();
            }

            this.classes.get(className).results.push(result);
        }

        /**
         * Parses the given line and adds it to the event data accumulated so far.
         * @param {String} line The line to parse.
         * @param {Number} lineNumber The number of the line (used in error
         *     messages).
         * @param {String} delimiter The character used to delimit the columns of
         *     data.
         */
        readLine(line, lineNumber, delimiter) {

            if (line.trim() === "") {
                // Skip this blank line.
                return;
            }

            let row = line.split(delimiter).map(s => s.trim()).map(dequote);

            // Check the row is long enough to have all the data besides the
            // controls data.
            if (row.length < MIN_CONTROLS_OFFSET) {
                throwInvalidData(`Too few items on line ${lineNumber} of the input file: expected at least ${MIN_CONTROLS_OFFSET}, got ${row.length}`);
            }

            let numControls = this.getNumControls(row, lineNumber);
            if (numControls !== null) {
                let cumTimes = this.readCumulativeTimes(row, lineNumber, numControls);

                this.createClassIfNecessary(row, numControls);
                this.createCourseIfNecessary(row, numControls);
                this.createClassCoursePairIfNecessary(row);

                this.addCompetitor(row, cumTimes);
            }
        }

        /**
         * Creates maps that describe the many-to-many join between the class names
         * and course names.
         * @return {Object} Object that contains two maps describing the
         *     many-to-many join.
         */
        getMapsBetweenClassesAndCourses() {

            let classesToCourses = new Map();
            let coursesToClasses = new Map();

            for (let pair of this.classCoursePairs) {
                let className = pair[0];
                let courseName = pair[1];

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
            }

            return { classesToCourses: classesToCourses, coursesToClasses: coursesToClasses };
        }

        /**
         * Creates and return a list of CourseClass objects from all of the data read.
         * @return {Array} Array of CourseClass objects.
         */
        createClasses() {
            let classNames = Array.from(this.classes.keys());
            classNames.sort();
            return classNames.map(className => {
                let courseClass = this.classes.get(className);
                return new CourseClass(className, courseClass.numControls, courseClass.results);
            });
        }

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
         * @param {String} initCourseName The name of the initial course.
         * @param {Object} manyToManyMaps Object that contains the two maps that
         *     map between class names and course names.
         * @param {Set} doneCourseNames Set of all course names that have been
         *     'done', i.e. included in a Course object that has been returned from
         *     a call to this method.
         * @param {Map} classesMap Map that maps class names to CourseClass
         *     objects.
         * @return {SplitsBrowser.Model.Course} - The created Course object.
         */
        createCourseFromLinkedClassesAndCourses(initCourseName, manyToManyMaps, doneCourseNames, classesMap) {
            let courseNamesToDo = [initCourseName];
            let classNamesToDo = [];
            let relatedCourseNames = [];
            let relatedClassNames = [];

            let courseName;
            let className;

            while (courseNamesToDo.length > 0 || classNamesToDo.length > 0) {
                while (courseNamesToDo.length > 0) {
                    courseName = courseNamesToDo.shift();
                    let classNames = manyToManyMaps.coursesToClasses.get(courseName);
                    for (let className of classNames) {
                        if (!classNamesToDo.includes(className) && !relatedClassNames.includes(className)) {
                            classNamesToDo.push(className);
                        }
                    }

                    relatedCourseNames.push(courseName);
                }

                while (classNamesToDo.length > 0) {
                    className = classNamesToDo.shift();
                    let courseNames = manyToManyMaps.classesToCourses.get(className);
                    for (let courseName of courseNames) {
                        if (!courseNamesToDo.includes(courseName) && !relatedCourseNames.includes(courseName)) {
                            courseNamesToDo.push(courseName);
                        }
                    }

                    relatedClassNames.push(className);
                }
            }

            // Mark all of the courses that we handled here as done.
            for (let courseName of relatedCourseNames) {
                doneCourseNames.add(courseName);
            }

            let classesForThisCourse = relatedClassNames.map(className => classesMap.get(className));
            let details = this.courseDetails.get(initCourseName);
            let course = new Course(initCourseName, classesForThisCourse, details.length, details.climb, details.controls);

            for (let courseClass of classesForThisCourse) {
                courseClass.setCourse(course);
            }

            return course;
        }

        /**
         * Sort through the data read in and create Course objects representing each
         * course in the event.
         * @param {Array} classes Array of CourseClass objects read.
         * @return {Array} Array of course objects.
         */
        determineCourses(classes) {

            let manyToManyMaps = this.getMapsBetweenClassesAndCourses();

            // As we work our way through the courses and classes, we may find one
            // class made up from multiple courses (e.g. in BOC2013, class M21E
            // uses course 1A and 1B).  In this set we collect up all of the
            // courses that we have now processed, so that if we later come across
            // one we've already dealt with, we can ignore it.
            let doneCourseNames = new Set();

            let classesMap = new Map();
            for (let courseClass of classes) {
                classesMap.set(courseClass.name, courseClass);
            }

            // List of all Course objects created so far.
            let courses = [];
            for (let courseName of manyToManyMaps.coursesToClasses.keys()) {
                if (!doneCourseNames.has(courseName)) {
                    let course = this.createCourseFromLinkedClassesAndCourses(courseName, manyToManyMaps, doneCourseNames, classesMap);
                    courses.push(course);
                }
            }

            return courses;
        }

        /**
         * Parses the read-in data and returns it.
         * @return {SplitsBrowser.Model.Event} Event-data read.
         */
        parseEventData() {

            this.warnings = [];

            this.lines = this.data.split(/\n/);

            let delimiter = this.identifyDelimiter();

            this.identifyFormatVariation(delimiter);

            // Discard the header row.
            this.lines.shift();

            for (let lineIndex = 0; lineIndex < this.lines.length; lineIndex += 1) {
                this.readLine(this.lines[lineIndex], lineIndex + 1, delimiter);
            }

            let classes = this.createClasses();
            if (classes.length === 0 && this.warnings.length > 0) {
                // A warning was generated for every single competitor in the file.
                // This file is quite probably not an OE-CSV file.
                throwWrongFileFormat("This file may have looked vaguely like an OE CSV file but no data could be read out of it");
            }

            let courses = this.determineCourses(classes);
            return new Event(classes, courses, this.warnings);
        }
    }

    SplitsBrowser.Input.OE = {};

    /**
     * Parse OE data read from a semicolon-separated data string.
     * @param {String} data The input data string read.
     * @return {SplitsBrowser.Model.Event} All event data read.
     */
    SplitsBrowser.Input.OE.parseEventData = function (data) {
        let reader = new Reader(data);
        return reader.parseEventData();
    };
})();