/*
 *  SplitsBrowser IOF XML - Read event data in IOF XML-format files.
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

    var throwInvalidData = SplitsBrowser.throwInvalidData;
    var throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var parseTime = SplitsBrowser.parseTime;
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var createTeamResult = SplitsBrowser.Model.Result.createTeamResult;
    var Competitor = SplitsBrowser.Model.Competitor;
    var Team = SplitsBrowser.Model.Team;
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
    * Returns the sum of all of the numbers in the given array
    * @param {Array} array The array of numbers to find the sum of.
    * @return The sum of the numbers in the given array.
    */
    function arraySum(array) {
        return array.reduce(function (a, b) { return a + b; }, 0);
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

        if (forename === "") {
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
    * Reads the team name from a TeamResult element.
    * @param {jQuery.selection} teamResultElement - TeamResult element
    *     containing the team result details.
    * @return {String} Team name.
    */
    Version2Reader.readTeamName = function (teamResultElement) {
        return $("> TeamName", teamResultElement).text();
    };

    /**
    * Returns a list of elements to be read to pull out team-member information.
    * @param {jQuery.selection} teamResultElement - TeamResult element
    *     containing the team result details.
    * @return {Array} Elements to parse to read team member results.
    */
    Version2Reader.readTeamMemberResults = function (teamResultElement) {
        return $("> PersonResult", teamResultElement);
    };

    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @param {Array} warnings - Array that accumulates warning messages.
    * @return {Object} Course details: id, name, length, climb and numberOfControls
    */
    Version2Reader.readCourseFromClass = function (classResultElement, warnings) {
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
                        warnings.push("Course '" + courseName + "' gives its length in a unit '" + unit + "', but this unit was not recognised");
                        length = null;
                    }
                } else {
                    warnings.push("Course '" + courseName + "' specifies a course length that was not understood: '" + lengthStr + "'");
                    length = null;
                }
            }
        }

        // Climb does not appear in the per-competitor results, and there is
        // no NumberOfControls.
        return {id: null, name: courseName, length: length, climb: null, numberOfControls: null};
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
    * Returns the name of the competitor or team's club.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult or TeamResult element.
    * @return {String} Competitor's club name.
    */
    Version2Reader.readClubName = function (element) {
        var clubName = $("> Club > ShortName", element).text();
        return (clubName === "") ?  $("> Club > Name", element).text() : clubName;
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
    * Reads the team name from a TeamResult element.
    * @param {jQuery.selection} teamResultElement - TeamResult element
    *     containing the team result details.
    * @return {String} Team name.
    */
    Version3Reader.readTeamName = function (teamResultElement) {
        return $("> Name", teamResultElement).text();
    };

    /**
    * Returns a list of elements to be read to pull out team-member information.
    * @param {jQuery.selection} teamResultElement - TeamResult element
    *     containing the team result details.
    * @return {Array} Elements to parse to read team member results.
    */
    Version3Reader.readTeamMemberResults = function (teamResultElement) {
        return $("> TeamMemberResult", teamResultElement);
    };

    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement - ClassResult element
    *     containing the course details.
    * @param {Array} warnings - Array that accumulates warning messages.
    * @return {Object} Course details: id, name, length, climb and number of
    *     controls.
    */
    Version3Reader.readCourseFromClass = function (classResultElement, warnings) {
        var courseElement = $("> Course", classResultElement);
        var id = $("> Id", courseElement).text() || null;
        var name = $("> Name", courseElement).text();
        var lengthStr = $("> Length", courseElement).text();
        var length;
        if (lengthStr === "") {
            length = null;
        } else {
            length = parseInt(lengthStr, 10);
            if (isNaNStrict(length)) {
                warnings.push("Course '" + name + "' specifies a course length that was not understood: '" + lengthStr + "'");
                length = null;
            } else {
                // Convert from metres to kilometres.
                length /= 1000;
            }
        }

        var numberOfControlsStr = $("> NumberOfControls", courseElement).text();
        var numberOfControls = parseInt(numberOfControlsStr, 10);
        if (isNaNStrict(numberOfControls)) {
            numberOfControls = null;
        }

        var climbStr = $("> Climb", courseElement).text();
        var climb = parseInt(climbStr, 10);
        if (isNaNStrict(climb)) {
            climb = null;
        }

        return {id: id, name: name, length: length, climb: climb, numberOfControls: numberOfControls};
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
    * Returns the name of the competitor or team's club.
    * @param {jQuery.selection} element - jQuery selection containing a
    *     PersonResult or TeamResult element.
    * @return {String} Competitor's club name.
    */
    Version3Reader.readClubName = function (element) {
        var clubName = $("> Organisation > ShortName", element).text();
        return (clubName === "") ? $("> Organisation > Name", element).text() : clubName;
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
    * @param {Array} warnings - Array that accumulates warning messages.
    * @return {Object?} Object containing the competitor data, or null if no
    *     competitor could be read.
    */
    function parseCompetitor(element, number, reader, warnings) {
        var jqElement = $(element);

        var nameElement = reader.getCompetitorNameElement(jqElement);
        var name = readCompetitorName(nameElement);

        if (name === "") {
            warnings.push("Could not find a name for a competitor");
            return null;
        }

        var club = reader.readClubName(jqElement);

        var dateOfBirth =  reader.readDateOfBirth(jqElement);
        var regexResult = yearRegexp.exec(dateOfBirth);
        var yearOfBirth = (regexResult === null) ? null : parseInt(regexResult[0], 10);

        var gender = $("> Person", jqElement).attr("sex");

        var resultElement = $("Result", jqElement);
        if (resultElement.length === 0) {
            warnings.push("Could not find any result information for competitor '" + name + "'");
            return null;
        }

        var startTime = reader.readStartTime(resultElement);

        var totalTime = reader.readTotalTime(resultElement);

        var status = reader.getStatus(resultElement);

        var splitTimes = $("> SplitTime", resultElement).toArray();
        var splitData = splitTimes.filter(function (splitTime) { return !reader.isAdditional($(splitTime)); })
                                  .map(function (splitTime) { return reader.readSplitTime($(splitTime)); });

        var controls = splitData.map(function (datum) { return datum.code; });
        var cumTimes = splitData.map(function (datum) { return datum.time; });

        cumTimes.unshift(0); // Prepend a zero time for the start.

        // Append the total time, ignoring any value given for a non-starter.
        cumTimes.push((status === reader.StatusNonStarter) ? null : totalTime);

        var competitor = new Competitor(name, club);

        if (yearOfBirth !== null) {
            competitor.setYearOfBirth(yearOfBirth);
        }

        if (gender === "M" || gender === "F") {
            competitor.setGender(gender);
        }

        var result = fromOriginalCumTimes(number, startTime, cumTimes, competitor);

        if (status === "OK" && totalTime !== null && cumTimes.indexOf(null) >= 0) {
            result.setOKDespiteMissingTimes();
        } else if (status === reader.StatusNonCompetitive) {
            result.setNonCompetitive();
        } else if (status === reader.StatusNonStarter) {
            result.setNonStarter();
        } else if (status === reader.StatusNonFinisher) {
            result.setNonFinisher();
        } else if (status === reader.StatusDisqualified) {
            result.disqualify();
        } else if (status === reader.StatusOverMaxTime) {
            result.setOverMaxTime();
        }

        return {
            result: result,
            controls: controls
        };
    }

    /**
    * Parses a PersonResult element into a competitor and adds the resulting
    * competitor to the class.
    * @param {XMLElement} element XML PersonResult element.
    * @param {Number} number The position number within the class.
    * @param {Object} cls The class read so far.
    * @param {Object} reader XML reader used to assist with format-specific parsing.
    * @param {Array} warnings Array that accumulates warning messages.
    */
    function parsePersonResult(element, number, cls, reader, warnings) {
        var resultAndControls = parseCompetitor(element, number, reader, warnings);
        if (resultAndControls !== null) {
            var result = resultAndControls.result;
            var controls = resultAndControls.controls;
            if (cls.results.length === 0 && !(result.isNonStarter && controls.length === 0)) {
                // First result (not including non-starters with no controls).
                // Record the list of controls.
                cls.controls = controls;

                // Set the number of controls on the course if we didn't read
                // it from the XML.  Assume the first competitor's number of
                // controls is correct.
                if (cls.course.numberOfControls === null) {
                    cls.course.numberOfControls = cls.controls.length;
                }
            }

            // Subtract 2 for the start and finish cumulative times.
            var actualControlCount = result.getAllOriginalCumulativeTimes().length - 2;
            var warning = null;
            if (result.isNonStarter && actualControlCount === 0) {
                // Don't generate warnings for non-starting competitors with no controls.
            } else if (actualControlCount !== cls.course.numberOfControls) {
                warning = "Competitor '" + result.owner.name + "' in class '" + cls.name + "' has an unexpected number of controls: expected " + cls.course.numberOfControls + ", actual " + actualControlCount;
            } else {
                for (var controlIndex = 0; controlIndex < actualControlCount; controlIndex += 1) {
                    if (cls.controls[controlIndex] !== controls[controlIndex]) {
                        warning = "Competitor '" + result.owner.name + "' has an unexpected control code at control " + (controlIndex + 1) +
                            ": expected '" + cls.controls[controlIndex] + "', actual '" + controls[controlIndex] + "'";
                        break;
                    }
                }
            }

            if (warning === null) {
                cls.results.push(result);
            } else {
                warnings.push(warning);
            }
        }
    }

    /**
    * Parses a TeamResult element into a team and adds the resulting
    * team to the class.
    * @param {XMLElement} teamResultElement XML TeamResult element.
    * @param {Number} number The position number within the class.
    * @param {Object} cls The class read so far.
    * @param {Object} XML reader used to assist with format-specific parsing.
    * @param {Array} warnings Array that accumulates warning messages.
    */
    function parseTeamResult(teamResultElement, number, cls, reader, warnings) {
        var teamName = reader.readTeamName(teamResultElement);
        var teamClubName = reader.readClubName(teamResultElement);
        var members = reader.readTeamMemberResults(teamResultElement);

        if (members.length === 0) {
            warnings.push("Ignoring team " + (teamName === "" ? "(unnamed team)" : teamName) + " with no members");
            return;
        } else if (cls.results.length === 0 && members.length === 1) {
            // First team in the class has only a single member.
            // (If this is a subsequent team in a class where there are teams
            // with more than one member, the team-size check later on will
            // catch this case.)
            warnings.push("Ignoring team " + (teamName === "" ? "(unnamed team)" : teamName) + " with only a single member");
            return;
        }

        var results = [];
        var allControls = [];
        for (var index = 0; index < members.length; index += 1) {
            var resultAndControls = parseCompetitor(members[index], number, reader, warnings);
            if (resultAndControls === null) {
                // A warning for this competitor rules out the entire team.
                return;
            }

            results.push(resultAndControls.result);
            allControls.push(resultAndControls.controls);
        }

        for (index = 1; index < members.length; index += 1) {
            var previousFinishTime = $("> Result > FinishTime", members[index - 1]).text();
            var nextStartTime = $("> Result > StartTime", members[index]).text();
            if (previousFinishTime !== nextStartTime) {
                warnings.push("In team " + (teamName === "" ? "(unnamed team)" : teamName) + " in class '" + cls.name + "', " + results[index - 1].owner.name + " does not finish at the same time as " + results[index].owner.name + " starts" );
                return;
            }
        }

        var thisTeamControlCounts = allControls.map(function (controls) { return controls.length; });

        if (cls.results.length === 0) {
            // First team.  Record the team size.
            cls.teamSize = results.length;

            // Set the numbers of controls on the legs if we didn't read it
            // from the XML.  Assume the first team's numbers of controls are
            // correct.
            if (cls.course.numbersOfControls === null) {
                cls.course.numbersOfControls = thisTeamControlCounts;
            }
        }

        if (results.length !== cls.teamSize) {
            warnings.push("Team " + (teamName === "" ? "(unnamed team)" : "'" + teamName + "'") + " in class '" + cls.name + "' has an unexpected number of members: expected " + cls.teamSize + " but was actually " + results.length);
        }
        else {
            var warning = null;
            var teamResult = createTeamResult(number, results, new Team(teamName, teamClubName));

            for (var teamMemberIndex = 0; teamMemberIndex < results.length; teamMemberIndex += 1) {
                var expectedControlCount = cls.course.numbersOfControls[teamMemberIndex];
                var memberResult = results[teamMemberIndex];

                // Subtract 2 for the start and finish cumulative times.
                var actualControlCount = memberResult.getAllOriginalCumulativeTimes().length - 2;

                if (actualControlCount !== expectedControlCount) {
                    warning = "Competitor '" + memberResult.owner.name + "' in team '" + teamName + "' in class '" + cls.name + "' has an unexpected number of controls: expected " + expectedControlCount + ", actual " + actualControlCount;
                    break;
                }
            }

            if (warning === null) {
                cls.results.push(teamResult);
            } else {
                warnings.push(warning);
            }
        }
    }

    /**
    * Parses data for a single class.
    * @param {XMLElement} element - XML ClassResult element
    * @param {Object} reader - XML reader used to assist with format-specific
    *     XML reading.
    * @param {Array} warnings - Array to accumulate any warning messages within.
    * @return {Object} Object containing parsed data.
    */
    function parseClassData(element, reader, warnings) {
        var jqElement = $(element);
        var cls = {name: null, results: [], teamSize: null, controls: [], course: null};

        cls.course = reader.readCourseFromClass(jqElement, warnings);

        var className = reader.readClassName(jqElement);

        if (className === "") {
            className = "<unnamed class>";
        }

        cls.name = className;
        cls.course.numbersOfControls = null;

        var personResults = $("> PersonResult", jqElement);
        var teamResults = $("> TeamResult", jqElement);

        if (personResults.length > 0 && teamResults.length > 0) {
            warnings.push("Class '" + className + "' has a combination of relay teams and individual results");
            return null;
        } else if (personResults.length > 0) {
            for (var personIndex = 0; personIndex < personResults.length; personIndex += 1) {
                parsePersonResult(personResults[personIndex], personIndex + 1, cls, reader, warnings);
            }
        } else if (teamResults.length > 0) {
            for (var teamIndex = 0; teamIndex < teamResults.length; teamIndex += 1) {
                parseTeamResult(teamResults[teamIndex], teamIndex + 1, cls, reader, warnings);
            }
        } else {
            warnings.push("Class '" + className + "' has no competitors");
            return null;
        }

        if (cls.course.id === null && cls.controls.length > 0) {
            // No course ID given, so join the controls together with commas
            // and use that instead.  Course IDs are only used internally by
            // this reader in order to merge classes, and the comma-separated
            // list of controls ought to work as a substitute identifier in
            // lieu of an 'official' course ID.
            //
            // This is intended mainly for IOF XML v2.0.3 files in particular
            // as they tend not to have course IDs.  However, this can also be
            // used with IOF XML v3.0 files that happen not to have course IDs.
            //
            // Idea thanks to 'dfgeorge' (David George?)
            cls.course.id = cls.controls.join(",");
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
    * Parses IOF XML data in either the 2.0.3 format or the 3.0 format and
    * returns the data.
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

        // d3 map that maps course IDs plus comma-separated lists of controls
        // to the temporary course with that ID and controls.
        // (We expect that all classes with the same course ID have consistent
        // controls, but we don't assume that.)
        var coursesMap = d3.map();

        var warnings = [];

        classResultElements.forEach(function (classResultElement) {
            var parsedClass = parseClassData(classResultElement, reader, warnings);
            if (parsedClass === null) {
                // Class could not be parsed.
                return;
            }

            var tempCourse = parsedClass.course;

            var numberOfControls;
            var courseKey;
            var isTeamClass;
            if (parsedClass.teams !== null && parsedClass.course.numbersOfControls !== null && parsedClass.course.numbersOfControls.length > 0) {
                numberOfControls = arraySum(parsedClass.course.numbersOfControls) + parsedClass.teamSize - 1;
                parsedClass.controls = null;
                courseKey = null;
                isTeamClass = true;
            } else {
                numberOfControls = parsedClass.controls.length;
                courseKey = tempCourse.id + "," + parsedClass.controls.join(",");
                isTeamClass = false;
            }

            var courseClass = new CourseClass(parsedClass.name, numberOfControls, parsedClass.results);
            if (isTeamClass) {
                courseClass.setIsTeamClass(parsedClass.course.numbersOfControls);
            }

            classes.push(courseClass);

            // Add to each temporary course object a list of all classes.
            if (tempCourse.id !== null && courseKey !== null && coursesMap.has(courseKey)) {
                // We've come across this course before, so just add a class to
                // it.
                coursesMap.get(courseKey).classes.push(courseClass);
            } else {
                // New course.  Add some further details from the class.
                tempCourse.classes = [courseClass];
                tempCourse.controls = parsedClass.controls;
                tempCourses.push(tempCourse);
                if (tempCourse.id !== null) {
                    coursesMap.set(courseKey, tempCourse);
                }
            }
        });

        // Now build up the array of courses.
        var courses = tempCourses.map(function (tempCourse) {
            var course = new Course(tempCourse.name, tempCourse.classes, tempCourse.length, tempCourse.climb, tempCourse.controls);
            tempCourse.classes.forEach(function (courseClass) { courseClass.setCourse(course); });
            return course;
        });

        return new Event(classes, courses, warnings);
    }

    SplitsBrowser.Input.IOFXml = { parseEventData: parseEventData };
})();