(function () {
    "use strict";

    SplitsBrowser.Input.CSV = {};
    
    /**
    * Parse a row of competitor data.
    * @param {Number} index - Index of the competitor line.
    * @param {string} line - The line of competitor data read from a CSV file.
    * @param {Number} controlCount - The number of controls (not including the finish).
    * @return {Object} Competitor object representing the competitor data read in.
    */
    SplitsBrowser.Input.CSV.parseCompetitors = function (index, line, controlCount) {
        // Expect forename, surname, club, start time then (controlCount + 1) split times in the form MM:SS.
        var parts = line.split(",");
        if (parts.length === controlCount + 5) {
            var forename = parts.shift();
            var surname = parts.shift();
            var club = parts.shift();
            var startTime = SplitsBrowser.parseTime(parts.shift()) * 60;
            var splitTimes = parts.map(SplitsBrowser.parseTime);
            if (splitTimes.indexOf(0) >= 0) {
                SplitsBrowser.throwInvalidData("Zero split times are not permitted - found one or more zero splits for competitor '" + forename + " " + surname + "'");
            }
            return SplitsBrowser.Model.Competitor.fromSplitTimes(index + 1, forename, surname, club, startTime, splitTimes);
        } else {
            SplitsBrowser.throwInvalidData("Expected " + (controlCount + 5) + " items in row for competitor in class with " + controlCount + " controls, got " + (parts.length) + " instead.");
        }
    };

    /**
    * Parse CSV data for a class.
    * @param {string} class - The string containing data for that class.
    * @return {SplitsBrowser.Model.AgeClass} Parsed class data.
    */
    SplitsBrowser.Input.CSV.parseAgeClass = function (ageClass) {
        var lines = ageClass.split("\r\n").filter(SplitsBrowser.isTrue);
        if (lines.length === 0) {
            SplitsBrowser.throwInvalidData("parseAgeClass got an empty list of lines");
        }

        var firstLineParts = lines.shift().split(",");
        if (firstLineParts.length === 2) {
            var className = firstLineParts.shift();
            var controlCountStr = firstLineParts.shift();
            var controlCount = parseInt(controlCountStr, 10);
            if (isNaN(controlCount)) {
                SplitsBrowser.throwInvalidData("Could not read control count: '" + controlCountStr + "'");
            } else if (controlCount < 0) {
                SplitsBrowser.throwInvalidData("Expected a positive control count, got " + controlCount + " instead");
            } else {
                var competitors = lines.map(function (line, index) { return SplitsBrowser.Input.CSV.parseCompetitors(index, line, controlCount); });
                competitors.sort(SplitsBrowser.Model.compareCompetitors);
                return new SplitsBrowser.Model.AgeClass(className, controlCount, competitors);
            }
        } else {
            SplitsBrowser.throwWrongFileFormat("Expected first line to have two parts (class name and number of controls), got " + firstLineParts.length + " part(s) instead");
        }
    };

        /**
        * Parse CSV data for an entire event.
        * @param {string} eventData - String containing the entire event data.
        * @return {SplitsBrowser.Model.Event} All event data read in.
        */
    SplitsBrowser.Input.CSV.parseEventData = function (eventData) {
        var classSections = eventData.split("\r\n\r\n").map($.trim).filter(SplitsBrowser.isTrue);
       
        var classes = classSections.map(SplitsBrowser.Input.CSV.parseAgeClass);
        
        // Nulls are for the course length, climb and controls, which aren't in
        // the source data files, so we can't do anything about them.
        var courses = classes.map(function (cls) { return new SplitsBrowser.Model.Course(cls.name, [cls], null, null, null); });
        
        for (var i = 0; i < classes.length; i += 1) {
            classes[i].setCourse(courses[i]);
        }
        
        return new SplitsBrowser.Model.Event(classes, courses);
    };
})();
