(function () {
    "use strict";
    
    // 'City' is club name!
    var _MANDATORY_COLUMN_NAMES = ["First name", "Surname", "City", "Start", "Time", "Course", "Course controls"];

    /**  
    * Parse a time of the form MM:SS into a number of seconds.
    * @param {string} time - The time of the form MM:SS.
    * @return {Number} The number of seconds.
    */
    var parseCompetitorTime = function (time) {
        if (time.match(/^\d+:\d\d$/)) {
            return parseInt(time.substring(0, time.length - 3), 10) * 60 + parseInt(time.substring(time.length - 2), 10);
        } else if (time.match(/^\d+:\d\d:\d\d$/)) {
            return parseInt(time.substring(0, time.length - 6), 10) * 3600 + parseInt(time.substring(time.length - 5, time.length - 3), 10) * 60 + parseInt(time.substring(time.length - 2), 10);
        } else {
            // Assume anything unrecognised is a missed split.
            return null;
        }
    };
    
    SplitsBrowser.Input.SI = {};
    
    /**
    * Parse 'SI' data read from a semicolon-separated data string.
    * @param {String} data - The input data string read.
    * @return {Array} Array of courses.
    */
    SplitsBrowser.Input.SI.parseEventData = function (data) {
        
        // Work around oddity of the file format: 'City' seems to contain the
        // club name, and it seems to be repeated later on.  Replace the
        // second.
        data = data.replace(/;Zip;City;/, ";Zip;City2;");
        var dsvData = d3.dsv(";").parse(data);
        
        if (!$.isArray(dsvData) || dsvData.length === 0) {
            SplitsBrowser.throwWrongFileFormat("No data found to read");
        } else if (dsvData[0].length === 1) {
            SplitsBrowser.throwWrongFileFormat("Data seems not to be in the SI semicolon-separated format");
        }
        
        // Map that associates courses to all of the competitors running on
        // that course.
        var courses = d3.map();
        
        dsvData.forEach(function (row) {
            
            _MANDATORY_COLUMN_NAMES.forEach(function (columnName) {
                if (!row.hasOwnProperty(columnName)) {
                    SplitsBrowser.throwInvalidData("Column '" + columnName + "' missing");
                }
            });
        
            var forename = row["First name"];
            var surname = row.Surname;
            var club = row.City;
            var startTime = row.Start;
            
            var courseName = row.Course;
            
            var numControls;
            if (courses.has(courseName)) {
                numControls = courses.get(courseName).numControls;
            } else {
                // TODO add these later?
                // var courseDistance = row.Km;
                // var courseClimb = row.m;
                
                numControls = parseInt(row["Course controls"], 10);
                courses.set(courseName, { numControls: numControls, competitors: [] });
            }
            
            var cumTimes = [0];
            for (var i = 1; i <= numControls; i += 1) {
                var key = "Punch" + i;
                if (row.hasOwnProperty(key)) {
                    var cumTimeStr = row[key];
                    var cumTime = parseCompetitorTime(cumTimeStr);
                    cumTimes.push(cumTime);
                } else {
                    SplitsBrowser.throwInvalidData("No '" + key + "' column");
                }
            }
            
            cumTimes.push(parseCompetitorTime(row.Time));
            
            var order = courses.get(courseName).competitors.length + 1;
            var competitor = SplitsBrowser.Model.Competitor.fromCumTimes(order, forename, surname, club, startTime, cumTimes);
            courses.get(courseName).competitors.push(competitor);
        });
        
        var courseNames = courses.keys();
        courseNames.sort();
        return courseNames.map(function (courseName) {
            var course = courses.get(courseName);
            return new SplitsBrowser.Model.Course(courseName, course.numControls, course.competitors);
        });
    };
})();