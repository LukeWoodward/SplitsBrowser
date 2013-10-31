(function () {
    "use strict";
    
    var CLUB_COLUMN_NAME = "City";
    
    var CLASS_COLUMN_NAME = "Short";
    
    var PLACING_COLUMN_NAME = "Pl";
    
    var MANDATORY_COLUMN_NAMES = ["First name", "Surname", CLUB_COLUMN_NAME, "Start", "Time", CLASS_COLUMN_NAME, "Course controls", PLACING_COLUMN_NAME];
    
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
    * Parse 'SI' data read from a semicolon-separated data string.
    * @param {String} data - The input data string read.
    * @return {Array} Array of classes.
    */
    SplitsBrowser.Input.SI.parseEventData = function (data) {
        
        // Work around oddity of the file format: 'City' seems to contain the
        // club name, and it seems to be repeated later on.  Adjust the second
        // occurrence to move it out of the way.
        data = data.replace(/;City;(.*?);City;/, ";City;$1;City2;");
        var dsvData = d3.dsv(";").parse(data);
        
        if (!$.isArray(dsvData) || dsvData.length === 0) {
            SplitsBrowser.throwWrongFileFormat("No data found to read");
        } else if (dsvData[0].length === 1) {
            SplitsBrowser.throwWrongFileFormat("Data seems not to be in the SI semicolon-separated format");
        }
        
        // Map that associates classes to all of the competitors running on
        // that age class.
        var ageClasses = d3.map();
        
        dsvData.forEach(function (row) {
            
            MANDATORY_COLUMN_NAMES.forEach(function (columnName) {
                if (!row.hasOwnProperty(columnName)) {
                    SplitsBrowser.throwInvalidData("Column '" + columnName + "' missing");
                }
            });
        
            var forename = row["First name"];
            var surname = row.Surname;
            var club = row[CLUB_COLUMN_NAME];
            var startTime = SplitsBrowser.parseTime(row.Start);
            
            var className = row[CLASS_COLUMN_NAME];
            
            var numControls;
            if (ageClasses.has(className)) {
                numControls = ageClasses.get(className).numControls;
            } else {
                // TODO add these later?
                // var courseDistance = row.Km;
                // var courseClimb = row.m;
                
                numControls = parseInt(row["Course controls"], 10);
                ageClasses.set(className, { numControls: numControls, competitors: [] });
            }
            
            var cumTimes = [0];
            var lastCumTime = 0;
            for (var i = 1; i <= numControls; i += 1) {
                var key = "Punch" + i;
                if (row.hasOwnProperty(key)) {
                    var cumTimeStr = row[key];
                    var cumTime = SplitsBrowser.parseTime(cumTimeStr);
                    SplitsBrowser.Input.SI.verifyCumulativeTimesInOrder(lastCumTime, cumTime);
                    
                    cumTimes.push(cumTime);
                    if (cumTime !== null) {
                        lastCumTime = cumTime;
                    }
                } else {
                    SplitsBrowser.throwInvalidData("No '" + key + "' column");
                }
            }
            
            var totalTime = SplitsBrowser.parseTime(row.Time);
            SplitsBrowser.Input.SI.verifyCumulativeTimesInOrder(lastCumTime, totalTime);
            
            // Some surnames have an 'mp' suffix or an 'n/c' suffix added to
            // them.  Remove either of them if they exist.
            surname = surname.replace(/ mp$| n\/c$/, "");
            
            cumTimes.push(totalTime);
            
            var order = ageClasses.get(className).competitors.length + 1;
            var competitor = SplitsBrowser.Model.Competitor.fromCumTimes(order, forename, surname, club, startTime, cumTimes);
            if (row[PLACING_COLUMN_NAME] === "n/c") {
                competitor.setNonCompetitive();
            }

            ageClasses.get(className).competitors.push(competitor);
        });
        
        var classNames = ageClasses.keys();
        classNames.sort();
        return classNames.map(function (className) {
            var ageClass = ageClasses.get(className);
            return new SplitsBrowser.Model.AgeClass(className, ageClass.numControls, ageClass.competitors);
        });
    };
})();