(function () {
    "use strict";

    /*
     * Functions for reading in 'plain' CSV files.
     */


    SplitsBrowser.Input.CSV = {
    
        /**
        * Parse a row of competitor data.
        * @param {Number} index - Index of the competitor line.
        * @param {string} line - The line of competitor data read from a CSV file.
        * @param {Number} controlCount - The number of controls (not including the finish).
        * @return {Object} Competitor object representing the competitor data read in.
        */
        parseCompetitors: function (index, line, controlCount) {
            // Expect forename, surname, club, start time then (controlCount + 1) split times in the form MM:SS.
            var parts = line.split(",");
            if (parts.length === controlCount + 5) {
                var forename = parts.shift();
                var surname = parts.shift();
                var club = parts.shift();
                var startTime = parts.shift();
                var splitTimes = parts.map(SplitsBrowser.parseTime);
                return SplitsBrowser.Model.Competitor.fromSplitTimes(index + 1, forename, surname, club, startTime, splitTimes);
            } else {
                SplitsBrowser.throwInvalidData("Expected " + (controlCount + 5) + " items in row for competitor on course with " + controlCount + " controls, got " + (parts.length) + " instead.");
            }
        },

        /**
        * Parse CSV data for a course.
        * @param {string} course - The string containing data for that course.
        * @return {SplitsBrowser.Model.Course} Parsed course data.
        */
        parseCourse: function (course) {
            var lines = course.split("\r\n").filter(SplitsBrowser.isTrue);
            if (lines.length === 0) {
                SplitsBrowser.throwInvalidData("parseCourse got an empty list of lines");
            }

            var firstLineParts = lines.shift().split(",");
            if (firstLineParts.length === 2) {
                var courseName = firstLineParts.shift();
                var controlCountStr = firstLineParts.shift();
                var controlCount = parseInt(controlCountStr, 10);
                if (isNaN(controlCount)) {
                    SplitsBrowser.throwInvalidData("Could not read control count: '" + controlCountStr + "'");
                } else if (controlCount < 0) {
                    SplitsBrowser.throwInvalidData("Expected a positive control count, got " + controlCount + " instead");
                } else {
                    var competitors = lines.map(function (line, index) { return SplitsBrowser.Input.CSV.parseCompetitors(index, line, controlCount); });
                    competitors.sort(SplitsBrowser.Model.compareCompetitors);
                    return new SplitsBrowser.Model.Course(courseName, controlCount, competitors);
                }
            } else {
                SplitsBrowser.throwWrongFileFormat("Expected first line to have two parts (course name and number of controls), got " + firstLineParts.length + " part(s) instead");
            }
        },

        /**
        * Parse CSV data for an entire event.
        * @param {string} eventData - String containing the entire event data.
        * @return {Array} Array of Course objects.
        */
        parseEventData: function (eventData) {
            var courses = eventData.split("\r\n\r\n").map($.trim).filter(SplitsBrowser.isTrue);
            return courses.map(SplitsBrowser.Input.CSV.parseCourse);
        }
    };
})();
