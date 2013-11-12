(function () {
    "use strict";
    
    var CLUB_COLUMN_NAME = "City";
    
    var CLASS_COLUMN_NAME = "Short";
    
    var COURSE_COLUMN_NAME = "Course";
    
    var PLACING_COLUMN_NAME = "Pl";
    
    var MANDATORY_COLUMN_NAMES = ["First name", "Surname", CLUB_COLUMN_NAME, "Start", "Time", CLASS_COLUMN_NAME, "Course controls", PLACING_COLUMN_NAME, COURSE_COLUMN_NAME];
    
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
    * Sort through the data read in and create the course objects.
    * @param {Array} classes - Array of AgeClass objects.
    * @param {d3.map} courseDetails - Map that maps course names to lengths and
    *      climbs.
    * @param {Array} classCoursePairs - Array of 2-element array of
    *      (class name, curse name) pairs.
    * @return {Array} Array of course objects.
    */
    SplitsBrowser.Input.SI.determineCourses = function (classes, courseDetails, classCoursePairs) {
        // What we have to watch out for is one class using the multiple courses.
        // We support either:
        // * One class made up from multiple courses, or
        // * One course made up from multiple classes.
        // Anything else is not supported.
        
        var classesToCourses = d3.map();
        var coursesToClasses = d3.map();
        
        classCoursePairs.forEach(function (pair) {
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
        
        
        // As we work our way through the courses and classes, we may find one
        // class made up from multiple courses (e.g. in BOC2013, class M21E
        // uses course 1A and 1B).  In this set we collect up all of the
        // courses that we have now processed, so that if we later come across
        // one we've already dealt with, we can ignore it.
        var doneCourses = d3.set();
        
        var classesMap = d3.map();
        classes.forEach(function (ageClass) {
            classesMap.set(ageClass.name, ageClass);
        });
        
        var courses = [];
        
        coursesToClasses.keys().forEach(function (courseName) {
            
            if (!doneCourses.has(courseName)) {
                // Find all of the courses and classes that are related.
                // It's not always as simple as one course having multiple
                // classes, as there can be multiple courses for one single
                // class, and even multiple courses among multiple classes
                // (e.g. M20E, M18E on courses 3, 3B at BOC 2013.)
                
                // (For the graph theorists among you, imagine the bipartite
                // graph with classes on one side and courses on the other.  We
                // want to find the connected subgraph that this course belongs
                // to.)
                
                var courseNamesToDo = [courseName];
                var classNamesToDo = [];
                var relatedCourseNames = [];
                var relatedClassNames = [];
                
                var crsName;
                var clsName;
                
                while (courseNamesToDo.length > 0 || classNamesToDo.length > 0) {
                    while (courseNamesToDo.length > 0) {
                        crsName = courseNamesToDo.shift();
                        var clsNames = coursesToClasses.get(crsName);
                        for (var clsIdx = 0; clsIdx < clsNames.length; clsIdx += 1) {
                            clsName = clsNames[clsIdx];
                            if (classNamesToDo.indexOf(clsName) < 0 && relatedClassNames.indexOf(clsName) < 0) {
                                classNamesToDo.push(clsName);
                            }
                        }
                        
                        relatedCourseNames.push(crsName);
                    }
                    
                    while (classNamesToDo.length > 0) {
                        clsName = classNamesToDo.shift();
                        var crsNames = classesToCourses.get(clsName);
                        for (var crsIdx = 0; crsIdx < crsNames.length; crsIdx += 1) {
                            crsName = crsNames[crsIdx];
                            if (courseNamesToDo.indexOf(crsName) < 0 && relatedCourseNames.indexOf(crsName) < 0) {
                                courseNamesToDo.push(crsName);
                            }
                        }
                        
                        relatedClassNames.push(clsName);
                    }
                }
                
                // Mark all of the courses that we handled here as done.
                relatedCourseNames.forEach(function (crsName) {
                    doneCourses.add(crsName);
                });
                
                var courseClasses = relatedClassNames.map(function (clsName) { return classesMap.get(clsName); });
                var details = courseDetails.get(courseName);
                var course = new SplitsBrowser.Model.Course(courseName, courseClasses, details.length, details.climb, details.controls);
                
                courseClasses.forEach(function (ageClass) {
                    ageClass.setCourse(course);
                });
                
                courses.push(course);
            }
        });
        
        return courses;
    };
    
    /**
    * Parse 'SI' data read from a semicolon-separated data string.
    * @param {String} data - The input data string read.
    * @return {SplitsBrowser.Model.Event} All event data read.
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
        
        // Map that associates courses to length and climb objects.
        var courseDetails = d3.map();
        
        // Set of all pairs of classes and courses.
        // (While it is common that one course may have multiple classes, it
        // seems also that one class can be made up of multiple courses, e.g.
        // M21E at BOC 2013.)
        var classCoursePairs = [];
        
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
                numControls = parseInt(row["Course controls"], 10);
                ageClasses.set(className, { numControls: numControls, competitors: [] });
            }
            
            var courseName = row[COURSE_COLUMN_NAME];
            if (!courseDetails.has(courseName)) {
                var controlNums = d3.range(1, numControls + 1).map(function (controlNum) {
                    var key = "Control" + controlNum;
                    if (row.hasOwnProperty(key)) {
                        return row[key];
                    } else {
                        SplitsBrowser.throwInvalidData("No '" + key + "' column");
                    }
                });
            
                courseDetails.set(courseName, {length: parseFloat(row.Km) || null, climb: parseInt(row.m, 10) || null, controls: controlNums});
            }
            
            if (!classCoursePairs.some(function (pair) { return pair[0] === className && pair[1] === courseName; })) {
                classCoursePairs.push([className, courseName]);
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
        var classes = classNames.map(function (className) {
            var ageClass = ageClasses.get(className);
            return new SplitsBrowser.Model.AgeClass(className, ageClass.numControls, ageClass.competitors);
        });
        
        var courses = SplitsBrowser.Input.SI.determineCourses(classes, courseDetails, classCoursePairs);
        return new SplitsBrowser.Model.Event(classes, courses);
    };
})();