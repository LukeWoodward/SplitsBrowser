/*
 *  SplitsBrowser IOF XML - Read event data in IOF v2.0.3 XML-format files.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    
    // Number of feet in a kilometre.
    var FEET_PER_KILOMETRE = 3280;
    
    /**
    * Returns whether the given value is undefined.
    * @param {any} value - The value to check.
    * @return {boolean} True if the value is undefined, false otherwise.
    */
    function isUndefined(value) {
        return typeof value === "undefined";
    }
    
    /**
    * Parses the given XML string and returns the parsed XML.
    * @param {String} xmlString - The XML string to parse.
    * @return {XMLDocument} The parsed XML document.
    */
    function parseXml(xmlString) {
        var xml;
        try {
            xml = $.parseXML(xmlString);
        } catch (e) {
            throwInvalidData("XML data not well-formed");
        }
        
        if ($("> *", $(xml)).length === 0) {
            // PhantomJS doesn't always fail parsing invalid XML; we may be
            // left with 'xml' just containing the DOCTYPE and no root element.
            throwInvalidData("XML data not well-formed: " + xmlString);
        }
        
        return xml;
    }
    
    /**
    * Parses and returns a competitor name from the given XML element.
    *
    * The XML element should have name 'PersonName' for v2.0.3 or 'Name' for
    * v3.0.  It should contain 'Given' and 'Family' child elements from which
    * the name will be formed.
    *
    * @param {jQuery.selection} nameElement - jQuery selection containing the
    *     PersonName or Name element.
    * @return {String} Name read from the element.
    */
    function readCompetitorName(nameElement) {
        
        var forename = $("> Given", nameElement).text();
        var surname = $("> Family", nameElement).text();

        if (forename === "" && surname === "") {
            throwInvalidData("Cannot read competitor's name");
        } else if (forename === "") {
            return surname;
        } else if (surname === "") {
            return forename;
        } else {
            return forename + " " + surname;
        }
    }
    
    // Regexp that matches the year in an ISO-8601 date.
    // Both XML formats use ISO-8601 (YYYY-MM-DD) dates, so parsing is
    // fortunately straightforward.
    var yearRegexp = /^\d{4}/;
    
    // Object that contains various functions for parsing bits of data from
    // IOF v2.0.3 XML event data.
    var Version2Reader = {};
    
    /**
    * Returns whether the given event data is likely to be results data of the
    * version 2.0.3 format.
    *
    * This function is called before the XML is parsed and so can provide a
    * quick way to discount files that are not of the v2.0.3 format.  Further
    * functions of this reader are only called if this method returns true.
    *
    * @param {String} data - The event data.
    * @return {boolean} True if the data is likely to be v2.0.3-format data,
    *     false if not.
    */
    Version2Reader.isOfThisVersion = function (data) {
        return data.indexOf("IOFdata.dtd") >= 0;
    };
        
    /**
    * Makes a more thorough check that the parsed XML data is likely to be of
    * the v2.0.3 format.  If not, a WrongFileFormat exception is thrown.
    * @param {jQuery.selection} rootElement - The root element.
    */
    Version2Reader.checkVersion = function (rootElement) {
        var iofVersionElement = $("> IOFVersion", rootElement);
        if (iofVersionElement.length === 0) {
            throwWrongFileFormat("Could not find IOFVersion element");
        } else {
            var version = iofVersionElement.attr("version");
            if (isUndefined(version)) {
                throwWrongFileFormat("Version attribute missing from IOFVersion element");
            } else if (version !== "2.0.3") {
                throwWrongFileFormat("Found unrecognised IOF XML data format '" + version + "'");
            }
        }
        
        var status = rootElement.attr("status");
        if (!isUndefined(status) && status.toLowerCase() !== "complete") {
            throwInvalidData("Only complete IOF data supported; snapshot and delta are not supported");
        }
    };

    /**
    * Reads the class name from a ClassResult element.
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @return {String} Class name.
    */
    Version2Reader.readClassName = function (classResultElement) {
        return $("> ClassShortName", classResultElement).text();    
    };
    
    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @return {Object} Course details: id, name, length and climb.
    */
    Version2Reader.readCourseFromClass = function (classResultElement) {
        // Although the IOF v2 format appears to support courses, they
        // haven't been specified in any of the files I've seen.
        // So instead grab course details from the class and the first
        // competitor.
        var courseName = $("> ClassShortName", classResultElement).text();
        
        var firstResult = $("> PersonResult > Result", classResultElement).first();
        var length = null;
        
        if (firstResult.length > 0) {
            var lengthElement = $("> CourseLength", firstResult);
            var lengthStr = lengthElement.text();
            
            // Course lengths in IOF v2 are a pain, as you have to handle three
            // units.
            if (lengthStr.length > 0) {
                length = parseFloat(lengthStr);
                if (isFinite(length)) {
                    var unit = lengthElement.attr("unit");
                    if (isUndefined(unit) || unit === "m") {
                        length /= 1000;
                    } else if (unit === "km") {
                        // Length already in kilometres, do nothing further.
                    } else if (unit === "ft") {
                        length /= FEET_PER_KILOMETRE;
                    } else {
                        throwInvalidData("Unrecognised course-length unit: '" + unit + "'");
                    }
                } else {
                    throwInvalidData("Invalid course length: '" + lengthStr + "'");
                }
            }
        }
        
        // Climb does not appear in the per-competitor results.
        return {id: null, name: courseName, length: length, climb: null};
    };
    
    /**
    * Returns the XML element that contains a competitor's name.  This element
    * should contain child elements with names 'Given' and 'Family'.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {jQuery.selection} jQuery selection containing any child
    *     'PersonName' element.
    */
    Version2Reader.getCompetitorNameElement = function (element) {
        return $("> Person > PersonName", element);
    };
    
    /**
    * Returns the name of the competitor's club.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {String} Competitor's club name.
    */
    Version2Reader.readClubName = function (element) {
        return $("> Club > ShortName", element).text();
    };
        
    /**
    * Returns the competitor's date of birth, as a string.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {String} The competitors date of birth, as a string.
    */
    Version2Reader.readDateOfBirth = function (element) {
        return $("> Person > BirthDate > Date", element).text();
    };

    /**
    * Reads a competitor's start time from the given Result element.
    * @param {jQuery.selection} resultElement - jQuery selection containing a
    *     Result element.
    * @return {?Number} Competitor's start time in seconds since midnight, or
    *     null if not found.
    */
    Version2Reader.readStartTime = function (resultElement) {
        var startTimeStr = $("> StartTime > Clock", resultElement).text();
        var startTime = (startTimeStr === "") ? null : parseTime(startTimeStr);       
        return startTime;
    };
    
    /**
    * Reads a competitor's total time from the given Result element.
    * @param {jQuery.selection} resultElement - jQuery selection containing a
    *     Result element.
    * @return {?Number} - The competitor's total time in seconds, or
    *     null if a valid time was not found.
    */
    Version2Reader.readTotalTime = function (resultElement) {
        var totalTimeStr = $("> Time", resultElement).text();
        var totalTime = (totalTimeStr === "") ? null : parseTime(totalTimeStr);
        return totalTime;
    };

    /**
    * Returns the status of the competitor with the given result.
    * @param {jQuery.selection} resultElement - jQuery selection containing a
    *     Result element.
    * @return {String} Status of the competitor.
    */
    Version2Reader.getStatus = function (resultElement) {
        var statusElement = $("> CompetitorStatus", resultElement);
        return (statusElement.length === 1) ? statusElement.attr("value") : "";
    };
    
    Version2Reader.StatusNonCompetitive = "NotCompeting";
    Version2Reader.StatusNonStarter = "DidNotStart";
    Version2Reader.StatusNonFinisher = "DidNotFinish";
    Version2Reader.StatusDisqualified = "Disqualified";
    Version2Reader.StatusOverMaxTime = "OverTime";
    
    /**
    * Unconditionally returns false - IOF XML version 2.0.3 appears not to
    * support additional controls.
    * @return {boolean} false.
    */
    Version2Reader.isAdditional = function () {
        return false;
    };
    
    /**
    * Reads a control code and split time from a SplitTime element.
    * @param {jQuery.selection} splitTimeElement - jQuery selection containing
    *     a SplitTime element.
    * @return {Object} Object containing code and time.
    */
    Version2Reader.readSplitTime = function (splitTimeElement) {
        // IOF v2 allows ControlCode or Control elements.
        var code = $("> ControlCode", splitTimeElement).text();
        if (code === "") {
            code = $("> Control > ControlCode", splitTimeElement).text();
        }
        
        if (code === "") {
            throwInvalidData("Control code missing for control");
        }

        var timeStr = $("> Time", splitTimeElement).text();
        var time = (timeStr === "") ? null : parseTime(timeStr);
        return {code: code, time: time};
    };
    
    // Regexp to match ISO-8601 dates.
    // Ignores timezone info - always display times as local time.
    // We don't assume there are separator characters, and we also don't assume
    // that the seconds will be specified.
    var ISO_8601_RE = /^\d\d\d\d-?\d\d-?\d\dT?(\d\d):?(\d\d)(?::?(\d\d))?/;
    
    // Object that contains various functions for parsing bits of data from
    // IOF v3.0 XML event data.
    var Version3Reader = {};
    
    /**
    * Returns whether the given event data is likely to be results data of the
    * version 3.0 format.
    *
    * This function is called before the XML is parsed and so can provide a
    * quick way to discount files that are not of the v3.0 format.  Further
    * functions of this reader are only called if this method returns true.
    *
    * @param {String} data - The event data.
    * @return {boolean} True if the data is likely to be v3.0-format data,
    *     false if not.
    */
    Version3Reader.isOfThisVersion = function (data) {
        return data.indexOf("http://www.orienteering.org/datastandard/3.0") >= 0;
    };
    
    /**
    * Makes a more thorough check that the parsed XML data is likely to be of
    * the v2.0.3 format.  If not, a WrongFileFormat exception is thrown.
    * @param {jQuery.selection} rootElement - The root element.
    */    
    Version3Reader.checkVersion = function (rootElement) {
        var iofVersion = rootElement.attr("iofVersion");
        if (isUndefined(iofVersion)) {
            throwWrongFileFormat("Could not find IOF version number");
        } else if (iofVersion !== "3.0") {
            throwWrongFileFormat("Found unrecognised IOF XML data format '" + iofVersion + "'");
        }
        
        var status = rootElement.attr("status");
        if (!isUndefined(status) && status.toLowerCase() !== "complete") {
            throwInvalidData("Only complete IOF data supported; snapshot and delta are not supported");
        }
    };
    
    /**
    * Reads the class name from a ClassResult element.
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @return {String} Class name.
    */
    Version3Reader.readClassName = function (classResultElement) {
        return $("> Class > Name", classResultElement).text();
    };
    
    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @return {Object} Course details: id, name, length and climb.
    */
    Version3Reader.readCourseFromClass = function (classResultElement) {
        var courseElement = $("> Course", classResultElement);
        var id = $("> Id", courseElement).text();
        var name = $("> Name", courseElement).text();
        var lengthStr = $("> Length", courseElement).text();
        var length;
        if (lengthStr === "") {
            length = null;
        } else {
            length = parseInt(lengthStr, 10);
            if (isNaNStrict(length)) {
                throwInvalidData("Unrecognised course length: '" + lengthStr + "'");
            } else {
                // Convert from metres to kilometres.
                length /= 1000;
            }
        }
        
        var climbStr = $("> Climb", courseElement).text();
        var climb = parseInt(climbStr, 10);
        if (isNaNStrict(climb)) {
            climb = null;
        }
        
        return {id: id, name: name, length: length, climb: climb};
    };
    
    /**
    * Returns the XML element that contains a competitor's name.  This element
    * should contain child elements with names 'Given' and 'Family'.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {jQuery.selection} jQuery selection containing any child 'Name'
    *     element.
    */
    Version3Reader.getCompetitorNameElement = function (element) {
        return $("> Person > Name", element);
    };
    
    /**
    * Returns the name of the competitor's club.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {String} Competitor's club name.
    */
    Version3Reader.readClubName = function (element) {
        return $("> Organisation > ShortName", element).text();
    };
    
    /**
    * Returns the competitor's date of birth, as a string.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult element.
    * @return {String} The competitor's date of birth, as a string.
    */
    Version3Reader.readDateOfBirth = function (element) {
        var birthDate = $("> Person > BirthDate", element).text();
        var regexResult = yearRegexp.exec(birthDate);
        return (regexResult === null) ? null : parseInt(regexResult[0], 10);
    };
    
    /**
    * Reads a competitor's start time from the given Result element.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     Result element.
    * @return {?Number} Competitor's start time, in seconds since midnight,
    *     or null if not known.
    */
    Version3Reader.readStartTime = function (resultElement) {
        var startTimeStr = $("> StartTime", resultElement).text();
        var result = ISO_8601_RE.exec(startTimeStr);
        if (result === null) {
            return null;
        } else {
            var hours = parseInt(result[1], 10);
            var minutes = parseInt(result[2], 10);
            var seconds = (isUndefined(result[3])) ? 0 : parseInt(result[3], 10);
            return hours * 60 * 60 + minutes * 60 + seconds;
        }
    };

    /**
    * Reads a time, in seconds, from a string.  If the time was not valid,
    * null is returned.
    * @param {String} timeStr - The time string to read.
    * @return {?Number} The parsed time, in seconds, or null if it could not
    *     be read.
    */    
    Version3Reader.readTime = function (timeStr) {
        // IOF v3 allows fractional seconds, so we use parseFloat instead
        // of parseInt.
        var time = parseFloat(timeStr);
        return (isFinite(time)) ? time : null;
    };
    
    /**
    * Read a competitor's total time from the given Time element.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     Result element.
    * @return {?Number} Competitor's total time, in seconds, or null if a time
    *     was not found or was invalid.
    */
    Version3Reader.readTotalTime = function (resultElement) {
        var totalTimeStr = $("> Time", resultElement).text();
        return Version3Reader.readTime(totalTimeStr);
    };

    /**
    * Returns the status of the competitor with the given result.
    * @param {jQuery.selection} resultElement - jQuery selection containing a
    *     Result element.
    * @return {String} Status of the competitor.
    */
    Version3Reader.getStatus = function (resultElement) {
        return $("> Status", resultElement).text();
    };
    
    Version3Reader.StatusNonCompetitive = "NotCompeting";
    Version3Reader.StatusNonStarter = "DidNotStart";
    Version3Reader.StatusNonFinisher = "DidNotFinish";
    Version3Reader.StatusDisqualified = "Disqualified";
    Version3Reader.StatusOverMaxTime = "OverTime";
    
    /**
    * Returns whether the given split-time element is for an additional
    * control, and hence should be ignored.
    * @param {jQuery.selection} splitTimeElement - jQuery selection containing
    *     a SplitTime element.
    * @return {boolean} True if the control is additional, false if not.
    */
    Version3Reader.isAdditional = function (splitTimeElement) {
        return (splitTimeElement.attr("status") === "Additional");
    };

    /**
    * Reads a control code and split time from a SplitTime element.
    * @param {jQuery.selection} splitTimeElement - jQuery selection containing
    *     a SplitTime element.
    * @return {Object} Object containing code and time.
    */
    Version3Reader.readSplitTime = function (splitTimeElement) {
        var code = $("> ControlCode", splitTimeElement).text();
        if (code === "") {
            throwInvalidData("Control code missing for control");
        }
        
        var time;
        if (splitTimeElement.attr("status") === "Missing") {
            // Missed controls have their time omitted.
            time = null;
        } else {
            var timeStr = $("> Time", splitTimeElement).text();
            time = (timeStr === "") ? null : Version3Reader.readTime(timeStr);
        }
        
        return {code: code, time: time};
    };
    
    var ALL_READERS = [Version2Reader, Version3Reader];
    
    /**
    * Check that the XML document passed is in a suitable format for parsing.
    *
    * If any problems arise, this function will throw an exception.  If the
    * data is valid, the function will return normally.
    * @param {XMLDocument} xml - The parsed XML document.
    * @param {Object} reader - XML reader used to assist with format-specific
    *     XML reading.
    */
    function validateData(xml, reader) {
        var rootElement = $("> *", xml);        
        var rootElementNodeName = rootElement.prop("tagName");
        
        if (rootElementNodeName !== "ResultList")  {
            throwWrongFileFormat("Root element of XML document does not have expected name 'ResultList', got '" + rootElementNodeName + "'");
        }
        
        reader.checkVersion(rootElement);
    }
    
    /**
    * Parses data for a single competitor.
    * @param {XMLElement} element - XML PersonResult element.
    * @param {Number} number - The competitor number (1 for first in the array
    *     of those read so far, 2 for the second, ...)
    * @param {Object} reader - XML reader used to assist with format-specific
    *     XML reading.
    * @return {Object} Object containing the competitor data.
    */
    function parseCompetitor(element, number, reader) {
        var jqElement = $(element);
        
        var nameElement = reader.getCompetitorNameElement(jqElement);
        var name = readCompetitorName(nameElement);
        
        var club = reader.readClubName(jqElement);
        
        var dateOfBirth =  reader.readDateOfBirth(jqElement);
        var regexResult = yearRegexp.exec(dateOfBirth);
        var yearOfBirth = (regexResult === null) ? null : parseInt(regexResult[0], 10);
        
        var gender = $("> Person", jqElement).attr("sex");
        
        var resultElement = $("Result", jqElement);
        if (resultElement.length === 0) {
            throwInvalidData("No result found for competitor '" + name + "'");
        }
        
        var startTime = reader.readStartTime(resultElement);
        
        var totalTime = reader.readTotalTime(resultElement);
        
        var splitTimes = $("> SplitTime", resultElement).toArray();
        var splitData = splitTimes.filter(function (splitTime) { return !reader.isAdditional($(splitTime)); })
                                  .map(function (splitTime) { return reader.readSplitTime($(splitTime)); });
        
        var controls = splitData.map(function (datum) { return datum.code; });
        var cumTimes = splitData.map(function (datum) { return datum.time; });
        
        cumTimes.splice(0, 0, 0); // Prepend a zero time for the start.
        cumTimes.push(totalTime);
        
        var competitor = fromOriginalCumTimes(number, name, club, startTime, cumTimes);
        
        if (yearOfBirth !== null) {
            competitor.setYearOfBirth(yearOfBirth);
        }
        
        if (gender === "M" || gender === "F") {
            competitor.setGender(gender);
        }
        
        var status = reader.getStatus(resultElement);
        if (status === reader.StatusNonCompetitive) {
            competitor.setNonCompetitive();
        } else if (status === reader.StatusNonStarter) {
            competitor.setNonStarter();
        } else if (status === reader.StatusNonFinisher) {
            competitor.setNonFinisher();
        } else if (status === reader.StatusDisqualified) {
            competitor.disqualify();
        } else if (status === reader.StatusOverMaxTime) {
            competitor.setOverMaxTime();
        }
        
        return {
            competitor: competitor,
            controls: controls
        };
    }
    
    /**
    * Parses data for a single class.
    * @param {XMLElement} element - XML ClassResult element
    * @param {Object} reader - XML reader used to assist with format-specific
    *     XML reading.
    * @return {Object} Object containing parsed data.
    */
    function parseClassData(element, reader) {
        var jqElement = $(element);
        var cls = {name: null, competitors: [], controls: [], course: null};
        
        cls.course = reader.readCourseFromClass(jqElement, reader);
        
        var className = reader.readClassName(jqElement);
        
        if (className === "") {
            throwInvalidData("Missing class name");
        }
        
        cls.name = className;
        
        var personResults = $("> PersonResult", jqElement);

        if (personResults.length === 0) {
            throwInvalidData("Class '" + className + "' has no competitors");
        }
        
        for (var index = 0; index < personResults.length; index += 1) {
            var competitor = parseCompetitor(personResults[index], index + 1, reader);
            if (cls.competitors.length === 0) {
                cls.controls = competitor.controls;
                cls.length = competitor.length;
            } else {
                // Subtract 2 for the start and finish cumulative times.
                var actualControlCount = competitor.competitor.getAllOriginalCumulativeTimes().length - 2;
                if (actualControlCount !== cls.controls.length) {
                    throwInvalidData("Inconsistent numbers of controls on course '" + className + "': " + cls.controls.length + " and " + actualControlCount);
                }
            }
            
            cls.competitors.push(competitor.competitor);
        }
        
        return cls;
    }
   
    /**
    * Determine which XML reader to use to parse the given event data.
    * @param {String} data - The event data.
    * @return {Object} XML reader used to read version-specific information.
    */
    function determineReader(data) {
        for (var index = 0; index < ALL_READERS.length; index += 1) {
            var reader = ALL_READERS[index];
            if (reader.isOfThisVersion(data)) {
                return reader;
            }
        }
        
        throwWrongFileFormat("Data apparently not of any recognised IOF XML format");
    }
   
    /**
    * Parses IOF XML data in the 2.0.3 format and returns the data.
    * @param {String} data - String to parse as XML.
    * @return {Event} Parsed event object.
    */
    function parseEventData(data) {
    
        var reader = determineReader(data);
    
        var xml = parseXml(data);
        
        validateData(xml, reader);
        
        var classResultElements = $("> ResultList > ClassResult", $(xml)).toArray();
        
        if (classResultElements.length === 0) {
            throwInvalidData("No class result elements found");
        }
        
        var classes = [];
        
        // Array of all 'temporary' courses, intermediate objects that contain
        // course data but not yet in a suitable form to return.
        var tempCourses = [];
        
        // d3 map that maps course IDs to the temporary course with that ID.
        var coursesMap = d3.map();
        
        classResultElements.forEach(function (classResultElement) {
            var parsedClass = parseClassData(classResultElement, reader);
            var courseClass = new CourseClass(parsedClass.name, parsedClass.controls.length, parsedClass.competitors);
            classes.push(courseClass);
            
            // Add to each temporary course object a list of all classes.
            var tempCourse = parsedClass.course;
            if (tempCourse.id !== null && coursesMap.has(tempCourse.id)) {
                // We've come across this course before, so just add a class to
                // it.
                coursesMap.get(tempCourse.id).classes.push(courseClass);
            } else {
                // New course.  Add some further details from the class.
                tempCourse.classes = [courseClass];
                tempCourse.controls = parsedClass.controls;
                tempCourses.push(tempCourse);
                if (tempCourse.id !== null) {
                    coursesMap.set(tempCourse.id, tempCourse);
                }
            }
        });
        
        // Now build up the array of courses.
        var courses = tempCourses.map(function (tempCourse) {
            var course = new Course(tempCourse.name, tempCourse.classes, tempCourse.length, tempCourse.climb, tempCourse.controls);
            tempCourse.classes.forEach(function (courseClass) { courseClass.setCourse(course); });
            return course;
        });
        
        return new Event(classes, courses);
    }
    
    SplitsBrowser.Input.IOFXml = { parseEventData: parseEventData };
})();