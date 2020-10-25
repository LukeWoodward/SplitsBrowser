/*
 *  SplitsBrowser CSV - Reads in CSV result data files.
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

    const isTrue = SplitsBrowser.isTrue;
    const isNotNull = SplitsBrowser.isNotNull;
    const throwInvalidData = SplitsBrowser.throwInvalidData;
    const throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    const normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    const parseTime = SplitsBrowser.parseTime;
    const fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;
    const Competitor = SplitsBrowser.Model.Competitor;
    const compareResults = SplitsBrowser.Model.compareResults;
    const CourseClass = SplitsBrowser.Model.CourseClass;
    const Course = SplitsBrowser.Model.Course;
    const Event = SplitsBrowser.Model.Event;

    /**
     * Parse a row of competitor data.
     * @param {Number} index Index of the competitor line.
     * @param {String} line The line of competitor data read from a CSV file.
     * @param {Number} controlCount The number of controls (not including the finish).
     * @param {String} className The name of the class.
     * @param {Array} warnings Array of warnings to add any warnings found to.
     * @return {Object} Competitor object representing the competitor data read in.
     */
    function parseResults(index, line, controlCount, className, warnings) {
        // Expect forename, surname, club, start time then (controlCount + 1) split times in the form MM:SS.
        const parts = line.split(",");

        while (parts.length > controlCount + 5 && parts[3].match(/[^0-9.,:-]/)) {
            // As this line is too long and the 'start time' cell has something
            // that appears not to be a start time, assume that the club name
            // has a comma in it.
            parts[2] += "," + parts[3];
            parts.splice(3, 1);
        }

        const originalPartCount = parts.length;
        const forename = parts.shift() || "";
        const surname = parts.shift() || "";
        const name = (forename + " " + surname).trim() || "<name unknown>";
        if (originalPartCount === controlCount + 5) {
            const club = parts.shift();
            const startTimeStr = parts.shift();
            let startTime = parseTime(startTimeStr);
            if (startTime === 0) {
                startTime = null;
            } else if (!startTimeStr.match(/^\d+:\d\d:\d\d$/)) {
                // Start time given in hours and minutes instead of hours,
                // minutes and seconds.
                startTime *= 60;
            }

            const cumTimes = [0];
            let lastCumTimeRecorded = 0;
            for (let part of parts) {
                const splitTime = parseTime(part);
                if (splitTime !== null && splitTime > 0) {
                    lastCumTimeRecorded += splitTime;
                    cumTimes.push(lastCumTimeRecorded);
                } else {
                    cumTimes.push(null);
                }
            }

            const result = fromCumTimes(index + 1, startTime, cumTimes, new Competitor(name, club));
            if (lastCumTimeRecorded === 0) {
                result.setNonStarter();
            }
            return result;
        } else {
            const difference = originalPartCount - (controlCount + 5);
            const error = (difference < 0) ? `${-difference} too few` : `${difference} too many`;
            warnings.push(`Competitor '${name}' appears to have the wrong number of split times - ${error}` +
                                  ` (row ${index + 1} of class '${className}')`);
            return null;
        }
    }

    /**
     * Parse CSV data for a class.
     * @param {String} courseClass The string containing data for that class.
     * @param {Array} warnings Array of warnings to add any warnings found to.
     * @return {SplitsBrowser.Model.CourseClass} Parsed class data.
     */
    function parseCourseClass (courseClass, warnings) {
        const lines = courseClass.split(/\r?\n/).filter(isTrue);
        if (lines.length === 0) {
            throwInvalidData("parseCourseClass got an empty list of lines");
        }

        const firstLineParts = lines.shift().split(",");
        if (firstLineParts.length === 2) {
            const className = firstLineParts.shift();
            const controlCountStr = firstLineParts.shift();
            const controlCount = parseInt(controlCountStr, 10);
            if (isNaN(controlCount)) {
                throwInvalidData(`Could not read control count: '${controlCountStr}'`);
            } else if (controlCount < 0 && lines.length > 0) {
                // Only complain about a negative control count if there are
                // any results.  Event 7632 ends with a line 'NOCLAS,-1' -
                // we may as well ignore this.
                throwInvalidData(`Expected a non-negative control count, got ${controlCount} instead`);
            } else {
                const results = lines.map((line, index) => parseResults(index, line, controlCount, className, warnings))
                                       .filter(isNotNull);

                results.sort(compareResults);
                return new CourseClass(className, controlCount, results);
            }
        } else {
            throwWrongFileFormat(`Expected first line to have two parts (class name and number of controls), got ${firstLineParts.length} part(s) instead`);
        }
    }

    /**
     * Parse CSV data for an entire event.
     * @param {String} eventData String containing the entire event data.
     * @return {SplitsBrowser.Model.Event} All event data read in.
     */
    function parseEventData (eventData) {
        if (/<html/i.test(eventData)) {
            throwWrongFileFormat("Cannot parse this file as CSV as it appears to be HTML");
        }

        eventData = normaliseLineEndings(eventData);

        // Remove trailing commas.
        eventData = eventData.replace(/,+\n/g, "\n").replace(/,+$/, "");

        const classSections = eventData.split(/\n\n/).map(s =>s.trim()).filter(isTrue);
        const warnings = [];

        const classes = classSections.map(section => parseCourseClass(section, warnings))
                .filter(courseClass => !courseClass.isEmpty());

        if (classes.length === 0) {
            throwInvalidData("No competitor data was found");
        }

        // Nulls are for the course length, climb and controls, which aren't in
        // the source data files, so we can't do anything about them.
        const courses = classes.map(cls => new Course(cls.name, [cls], null, null, null));

        for (let i = 0; i < classes.length; i += 1) {
            classes[i].setCourse(courses[i]);
        }

        return new Event(classes, courses, warnings);
    }

    SplitsBrowser.Input.CSV = { parseEventData: parseEventData };
})();
