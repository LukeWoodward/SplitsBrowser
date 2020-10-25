/*
 *  SplitsBrowser Alternative CSV - Read in alternative CSV files.
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

    const throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    const normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    const parseTime = SplitsBrowser.parseTime;
    const parseCourseLength = SplitsBrowser.parseCourseLength;
    const parseCourseClimb = SplitsBrowser.parseCourseClimb;
    const fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    const Competitor = SplitsBrowser.Model.Competitor;
    const CourseClass = SplitsBrowser.Model.CourseClass;
    const Course = SplitsBrowser.Model.Course;
    const Event = SplitsBrowser.Model.Event;

    // This reader reads in alternative CSV formats, where each row defines a
    // separate competitor, and includes course details such as name, controls
    // and possibly distance and climb.

    // There is presently one variation supported:
    // * one, distinguished by having three columns per control: control code,
    //   cumulative time and 'points'.  (Points is never used.)  Generally,
    //   these formats are quite sparse; many columns (e.g. club, placing,
    //   start time) are blank or are omitted altogether.

    const TRIPLE_COLUMN_FORMAT = {
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
        placing: null,
        finishTime: null,
        allowMultipleCompetitorNames: true
    };

    // Supported delimiters.
    const DELIMITERS = [",", ";"];

    // All control codes except perhaps the finish are alphanumeric.
    const controlCodeRegexp = /^[A-Za-z0-9]+$/;

    /**
     * Trim trailing empty-string entries from the given array.
     * The given array is mutated.
     * @param {Array} array The array of string values.
     */
    function trimTrailingEmptyCells (array) {
        let index = array.length - 1;
        while (index >= 0 && array[index] === "") {
            index -= 1;
        }

        array.splice(index + 1, array.length - index - 1);
    }

    /**
     * Object used to read data from an alternative CSV file.
     * @constructor
     * @param {Object} format Object that describes the data format to read.
     */
    class Reader {
        constructor(format) {
            this.format = format;
            this.classes = new Map();
            this.delimiter = null;
            this.hasAnyStarters = false;
            this.warnings = [];

            // Return the offset within the control data that should be used when
            // looking for control codes.  This will be 0 if the format specifies a
            // finish time, and the format step if the format has no finish time.
            // (In this case, the finish time is with the control data, but we
            // don't wish to read any control code specified nor validate it.)
            this.controlsTerminationOffset = (format.finishTime === null) ? format.step : 0;
        }

        /**
         * Determine the delimiter used to delimit data.
         * @param {String} firstDataLine The first data line of the file.
         * @return {String|null} The delimiter separating the data, or null if no
         *    suitable delimiter was found.
         */
        determineDelimiter(firstDataLine) {
            for (let delimiter of DELIMITERS) {
                const lineParts = firstDataLine.split(delimiter);
                trimTrailingEmptyCells(lineParts);
                if (lineParts.length > this.format.controlsOffset) {
                    return delimiter;
                }
            }

            return null;
        }

        /**
         * Some lines of some formats can have multiple delimited competitors, which
         * will move the following columns out of their normal place.  Identify any
         * such situations and merge them together.
         * @param {Array} row The row of data read from the file.
         */
        adjustLinePartsForMultipleCompetitors(row) {
            if (this.format.allowMultipleCompetitorNames) {
                while (row.length > this.format.name + 1 && row[this.format.name + 1].match(/^\s\S/)) {
                    row[this.format.name] += "," + row[this.format.name + 1];
                    row.splice(this.format.name + 1, 1);
                }
            }
        }

        /**
         * Check the first line of data read in to verify that all of the control
         * codes specified are alphanumeric.
         * @param {String} firstLine The first line of data from the file (not
         *     the header line).
         */
        checkControlCodesAlphaNumeric(firstLine) {
            const lineParts = firstLine.split(this.delimiter);
            trimTrailingEmptyCells(lineParts);
            this.adjustLinePartsForMultipleCompetitors(lineParts, this.format);

            for (let index = this.format.controlsOffset; index + this.controlsTerminationOffset < lineParts.length; index += this.format.step) {
                if (!controlCodeRegexp.test(lineParts[index])) {
                    throwWrongFileFormat(`Data appears not to be in an alternative CSV format - data in cell ${index} of the first row ('${lineParts[index]}') is not an number`);
                }
            }
        }

        /**
         * Adds the result to the course with the given name.
         * @param {Result} result The result object read from the row.
         * @param {String} courseName The name of the course.
         * @param {Array} row Array of string parts making up the row of data read.
         */
        addResultToCourse(result, courseName, row) {
            if (this.classes.has(courseName)) {
                const cls = this.classes.get(courseName);
                const cumTimes = result.getAllOriginalCumulativeTimes();
                // Subtract one from the list of cumulative times for the
                // cumulative time at the start (always 0), and add one on to
                // the count of controls in the class to cater for the finish.
                if (cumTimes.length - 1 !== (cls.controls.length + 1)) {
                    this.warnings.push(`Competitor '${result.owner.name}' has the wrong number of splits for course '${courseName}': ` +
                        `expected ${cls.controls.length + 1}, actual ${cumTimes.length - 1}`);
                } else {
                    cls.results.push(result);
                }
            } else {
                // New course/class.
                // Determine the list of controls, ignoring the finish.
                const controls = [];
                for (let controlIndex = this.format.controlsOffset; controlIndex + this.controlsTerminationOffset < row.length; controlIndex += this.format.step) {
                    controls.push(row[controlIndex]);
                }

                let courseLength = (this.format.length === null) ? null : parseCourseLength(row[this.format.length]);
                let courseClimb = (this.format.climb === null) ? null : parseCourseClimb(row[this.format.climb]);

                this.classes.set(courseName, { length: courseLength, climb: courseClimb, controls: controls, results: [result] });
            }
        }

        /**
         * Read a row of data from a line of the file.
         * @param {String} line The line of data read from the file.
         */
        readDataRow(line) {
            const row = line.split(this.delimiter);
            trimTrailingEmptyCells(row);
            this.adjustLinePartsForMultipleCompetitors(row);

            if (row.length < this.format.controlsOffset) {
                // Probably a blank line.  Ignore it.
                return;
            }

            while ((row.length - this.format.controlsOffset) % this.format.step !== 0) {
                // Competitor might be missing cumulative time to last control.
                row.push("");
            }

            const competitorName = row[this.format.name];
            const club = row[this.format.club];
            const courseName = row[this.format.courseName];
            const startTime = parseTime(row[this.format.startTime]);

            const cumTimes = [0];
            for (let cumTimeIndex = this.format.controlsOffset + 1; cumTimeIndex < row.length; cumTimeIndex += this.format.step) {
                cumTimes.push(parseTime(row[cumTimeIndex]));
            }

            if (this.format.finishTime !== null) {
                const finishTime = parseTime(row[this.format.finishTime]);
                const totalTime = (startTime === null || finishTime === null) ? null : (finishTime - startTime);
                cumTimes.push(totalTime);
            }

            if (cumTimes.length === 1) {
                // Only cumulative time is the zero.
                if (competitorName !== "") {
                    this.warnings.push(
                        `Competitor '${competitorName}' on course '${courseName === "" ? "(unnamed)" : courseName}' has no times recorded`);
                }

                return;
            }

            const order = (this.classes.has(courseName)) ? this.classes.get(courseName).results.length + 1 : 1;

            const result = fromOriginalCumTimes(order, startTime, cumTimes, new Competitor(competitorName, club));
            if (this.format.placing !== null && result.completed()) {
                const placing = row[this.format.placing];
                if (!placing.match(/^\d*$/)) {
                    result.setNonCompetitive();
                }
            }

            if (result.hasAnyTimes()) {
                this.hasAnyStarters = true;
            }
            else {
                result.setNonStarter();
            }

            this.addResultToCourse(result, courseName, row);
        }

        /**
         * Given an array of objects containing information about each of the
         * course-classes in the data, create CourseClass and Course objects,
         * grouping classes by the list of controls
         * @return {Object} Object that contains the courses and classes.
         */
        createClassesAndCourses() {
            const courseClasses = [];

            // Group the classes by the list of controls.  Two classes using the
            // same list of controls can be assumed to be using the same course.
            const coursesByControlsLists = new Map();

            for (let [className, cls] of this.classes.entries()) {
                const courseClass = new CourseClass(className, cls.controls.length, cls.results);
                courseClasses.push(courseClass);

                const controlsList = cls.controls.join(",");
                if (coursesByControlsLists.has(controlsList)) {
                    coursesByControlsLists.get(controlsList).classes.push(courseClass);
                } else {
                    coursesByControlsLists.set(
                        controlsList, { name: className, classes: [courseClass], length: cls.length, climb: cls.climb, controls: cls.controls });
                }
            }

            const courses = [];
            for (let courseObject of coursesByControlsLists.values()) {
                const course = new Course(courseObject.name, courseObject.classes, courseObject.length, courseObject.climb, courseObject.controls);
                courseObject.classes.forEach(courseClass => courseClass.setCourse(course));
                courses.push(course);
            }

            return { classes: courseClasses, courses: courses };
        }

        /**
         * Parse alternative CSV data for an entire event.
         * @param {String} eventData String containing the entire event data.
         * @return {SplitsBrowser.Model.Event} All event data read in.
         */
        parseEventData(eventData) {
            this.warnings = [];
            eventData = normaliseLineEndings(eventData);

            const lines = eventData.split(/\n/);

            if (lines.length < 2) {
                throwWrongFileFormat("Data appears not to be in an alternative CSV format - too few lines");
            }

            const firstDataLine = lines[1];

            this.delimiter = this.determineDelimiter(firstDataLine);
            if (this.delimiter === null) {
                throwWrongFileFormat("Data appears not to be in an alternative CSV format - first data line has fewer than " + this.format.controlsOffset + " parts when separated by any recognised delimiter");
            }

            this.checkControlCodesAlphaNumeric(firstDataLine);

            for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
                this.readDataRow(lines[rowIndex]);
            }

            const classesAndCourses = this.createClassesAndCourses();

            if (!this.hasAnyStarters) {
                // Everyone marked as a non-starter.  This file is probably not of this
                // format.
                throwWrongFileFormat("Data appears not to be in an alternative CSV format - data apparently could be read but everyone was a non-starter");
            }

            return new Event(classesAndCourses.classes, classesAndCourses.courses, this.warnings);
        }
    }

    SplitsBrowser.Input.AlternativeCSV = {
        parseTripleColumnEventData: function (eventData) {
            const reader = new Reader(TRIPLE_COLUMN_FORMAT);
            return reader.parseEventData(eventData);
        }
    };
})();