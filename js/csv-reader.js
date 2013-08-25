(function () {
    "use strict";

    /*
     * Functions for reading in 'plain' CSV files.
     */


    SplitsBrowser.Input.CSV = {

        /**  
        * Parse a time of the form MM:SS into a number of seconds.
        * @param {string} time - The time of the form MM:SS.
        * @return {Number} The number of seconds.
        */
        parseCompetitorTime: function (time) {
            if (time.match(/^\d\d:\d\d$/)) {
                return parseInt(time.substring(0, 2), 10) * 60 + parseInt(time.substring(3), 10);
            } else {
                // TODO how are missing values represented, if at all?  At the moment,
                // anything unrecognised is simply nulled out.
                return null;
            }
        },

        /**
        * Parse a row of competitor data.
        * @param {Number} index - Index of the competitor line.
        * @param {string} line - The line of competitor data read from a CSV file.
        * @param {Number} controlCount - The number of controls (not including the finish).
        * @return {SplitsBrowser.Model.CompetitorData} Object representing the competitor data read in.
        */
        parseCompetitorData: function (index, line, controlCount) {
            // Expect forename, surname, club, start time then (controlCount + 1) times in the form MM:SS.
            var parts = line.split(",");
            if (parts.length === controlCount + 5) {
                var forename = parts.shift();
                var surname = parts.shift();
                var club = parts.shift();
                var startTime = parts.shift();
                var times = parts.map(SplitsBrowser.Input.CSV.parseCompetitorTime);
                return new SplitsBrowser.Model.CompetitorData(index + 1, forename, surname, club, startTime, times);
            } else {
                throwInvalidData("Expected " + (controlCount + 5) + " items in row for competitor on course with " + controlCount + " controls, got " + (parts.length) + " instead.");
            }
        },

        /**
        * Parse CSV data for a course.
        * @param {string} courseData - The string containing data for that course.
        * @return {SplitsBrowser.Model.CourseData} Parsed course data.
        */
        parseCourseData: function (courseData) {
            var lines = courseData.split("\r\n").filter(isTrue);
            if (lines.length === 0) {
                throwInvalidData("parseCourseData got an empty list of lines");
            }

            var firstLineParts = lines.shift().split(",");
            if (firstLineParts.length === 2) {
                var courseName = firstLineParts.shift();
                var controlCountStr = firstLineParts.shift();
                var controlCount = parseInt(controlCountStr, 10);
                if (isNaN(controlCount)) {
                    throwInvalidData("Could not read control count: '" + controlCountStr + "'");
                } else if (controlCount < 0) {
                    throwInvalidData("Expected a positive control count, got " + controlCount + " instead");
                } else {
                    var competitorData = lines.map(function (line, index) { return SplitsBrowser.Input.CSV.parseCompetitorData(index, line, controlCount); });
                    competitorData.sort(SplitsBrowser.Model.compareCompetitors);
                    return new SplitsBrowser.Model.CourseData(courseName, controlCount, competitorData);
                }
            } else {
                throwInvalidData("Expected first line to have two parts (course name and number of controls), got " + firstLineParts.length + " part(s) instead");
            }
        },

        /**
        * Parse CSV data for an entire event.
        * @param {string} eventData - String containing the entire event data.
        * @return {Array} Array of CourseData objects.
        */
        parseEventData: function (eventData) {
            var courseDatas = eventData.split("\r\n\r\n").map($.trim).filter(isTrue);
            return courseDatas.map(SplitsBrowser.Input.CSV.parseCourseData);
        }
    };
})();