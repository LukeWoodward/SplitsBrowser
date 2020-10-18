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

    const throwInvalidData = SplitsBrowser.throwInvalidData;
    const throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    const isNaNStrict = SplitsBrowser.isNaNStrict;
    const parseTime = SplitsBrowser.parseTime;
    const fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    const createTeamResult = SplitsBrowser.Model.Result.createTeamResult;
    const Competitor = SplitsBrowser.Model.Competitor;
    const Team = SplitsBrowser.Model.Team;
    const CourseClass = SplitsBrowser.Model.CourseClass;
    const Course = SplitsBrowser.Model.Course;
    const Event = SplitsBrowser.Model.Event;

    // Number of feet in a kilometre.
    const FEET_PER_KILOMETRE = 3280;

    /**
    * Returns whether the given value is undefined.
    * @param {any} value The value to check.
    * @return {Boolean} True if the value is undefined, false otherwise.
    */
    function isUndefined(value) {
        return typeof value === "undefined";
    }

    /**
    * Returns the sum of all of the numbers in the given array
    * @param {Array} array The array of numbers to find the sum of.
    * @return {Number} The sum of the numbers in the given array.
    */
    function arraySum(array) {
        return array.reduce((a, b) => a + b, 0);
    }

    /**
    * Parses the given XML string and returns the parsed XML.
    * @param {String} xmlString The XML string to parse.
    * @return {XMLDocument} The parsed XML document.
    */
    function parseXml(xmlString) {
        let xml;
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
    * The XML element should have name PersonName for v2.0.3 or Name for
    * v3.0.  It should contain Given and Family child elements from which
    * the name will be formed.
    *
    * @param {jQuery.selection} nameElement jQuery selection containing the
    *     PersonName or Name element.
    * @return {String} Name read from the element.
    */
    function readCompetitorName(nameElement) {
        let forename = $("> Given", nameElement).text();
        let surname = $("> Family", nameElement).text();
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
    const yearRegexp = /^\d{4}/;

    // Object that contains various functions for parsing bits of data from
    // IOF v2.0.3 XML event data.
    const Version2Reader = {};

    /**
    * Returns whether the given event data is likely to be results data of the
    * version 2.0.3 format.
    *
    * This function is called before the XML is parsed and so can provide a
    * quick way to discount files that are not of the v2.0.3 format.  Further
    * functions of this reader are only called if this method returns true.
    *
    * @param {String} data The event data.
    * @return {Boolean} True if the data is likely to be v2.0.3-format data,
    *     false if not.
    */
    Version2Reader.isOfThisVersion = data => data.indexOf("IOFdata.dtd") >= 0;

    /**
    * Makes a more thorough check that the parsed XML data is likely to be of
    * the v2.0.3 format.  If not, a WrongFileFormat exception is thrown.
    * @param {jQuery.selection} rootElement The root element.
    */
    Version2Reader.checkVersion = function (rootElement) {
        let iofVersionElement = $("> IOFVersion", rootElement);
        if (iofVersionElement.length === 0) {
            throwWrongFileFormat("Could not find IOFVersion element");
        } else {
            let version = iofVersionElement.attr("version");
            if (isUndefined(version)) {
                throwWrongFileFormat("Version attribute missing from IOFVersion element");
            } else if (version !== "2.0.3") {
                throwWrongFileFormat(`Found unrecognised IOF XML data format '${version}'`);
            }
        }

        let status = rootElement.attr("status");
        if (!isUndefined(status) && status.toLowerCase() !== "complete") {
            throwInvalidData("Only complete IOF data supported; snapshot and delta are not supported");
        }
    };

    /**
    * Reads the class name from a ClassResult element.
    * @param {jQuery.selection} classResultElement ClassResult element
    *     containing the course details.
    * @return {String} Class name.
    */
    Version2Reader.readClassName = classResultElement => $("> ClassShortName", classResultElement).text();

    /**
    * Reads the team name from a TeamResult element.
    * @param {jQuery.selection} teamResultElement TeamResult element
    *     containing the team result details.
    * @return {String} Team name.
    */
    Version2Reader.readTeamName = teamResultElement => $("> TeamName", teamResultElement).text();

    /**
    * Returns a list of elements to be read to pull out team-member information.
    * @param {jQuery.selection} teamResultElement TeamResult element
    *     containing the team result details.
    * @return {Array} Elements to parse to read team member results.
    */
    Version2Reader.readTeamMemberResults = teamResultElement => $("> PersonResult", teamResultElement);

    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement ClassResult element
    *     containing the course details.
    * @param {Array} warnings Array that accumulates warning messages.
    * @return {Object} Course details: id, name, length, climb and numberOfControls
    */
    Version2Reader.readCourseFromClass = function (classResultElement, warnings) {
        // Although the IOF v2 format appears to support courses, they
        // haven't been specified in any of the files I've seen.
        // So instead grab course details from the class and the first
        // competitor.
        let courseName = $("> ClassShortName", classResultElement).text();

        let firstResult = $("> PersonResult > Result", classResultElement).first();
        let length = null;

        if (firstResult.length > 0) {
            let lengthElement = $("> CourseLength", firstResult);
            let lengthStr = lengthElement.text();

            // Course lengths in IOF v2 are a pain, as you have to handle three
            // units.
            if (lengthStr.length > 0) {
                length = parseFloat(lengthStr);
                if (isFinite(length)) {
                    let unit = lengthElement.attr("unit");
                    if (isUndefined(unit) || unit === "m") {
                        length /= 1000;
                    } else if (unit === "km") {
                        // Length already in kilometres, do nothing further.
                    } else if (unit === "ft") {
                        length /= FEET_PER_KILOMETRE;
                    } else {
                        warnings.push(`Course '${courseName}' gives its length in a unit '${unit}', but this unit was not recognised`);
                        length = null;
                    }
                } else {
                    warnings.push(`Course '${courseName}' specifies a course length that was not understood: '${lengthStr}'`);
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
    * should contain child elements with names Given and Family.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult element.
    * @return {jQuery.selection} jQuery selection containing any child
    *     PersonName element.
    */
    Version2Reader.getCompetitorNameElement = element => $("> Person > PersonName", element);

    /**
    * Returns the name of the competitor or team's club.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult or TeamResult element.
    * @return {String} Competitor or team's club name.
    */
    Version2Reader.readClubName = function (element) {
        let clubName = $("> Club > ShortName", element).text();
        return (clubName === "") ?  $("> Club > Name", element).text() : clubName;
    };

    /**
    * Returns the competitor's date of birth, as a string.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult element.
    * @return {String} The competitor's date of birth, as a string.
    */
    Version2Reader.readDateOfBirth = element => $("> Person > BirthDate > Date", element).text();

    /**
    * Reads a start time from the given Result element.
    * @param {jQuery.selection} resultElement jQuery selection containing a
    *     Result element.
    * @return {Number|null} Start time in seconds since midnight, or null if
    *     not found.
    */
    Version2Reader.readStartTime = function (resultElement) {
        let startTimeStr = $("> StartTime > Clock", resultElement).text();
        let startTime = (startTimeStr === "") ? null : parseTime(startTimeStr);
        return startTime;
    };

    /**
    * Reads a competitor's total time from the given Result element.
    * @param {jQuery.selection} resultElement jQuery selection containing a
    *     Result element.
    * @return {Number|null} The competitor's total time in seconds, or null if
    *     a valid time was not found.
    */
    Version2Reader.readTotalTime = function (resultElement) {
        let totalTimeStr = $("> Time", resultElement).text();
        let totalTime = (totalTimeStr === "") ? null : parseTime(totalTimeStr);
        return totalTime;
    };

    /**
    * Returns the status of the competitor with the given result.
    * @param {jQuery.selection} resultElement jQuery selection containing a
    *     Result element.
    * @return {String} Status of the competitor.
    */
    Version2Reader.getStatus = function (resultElement) {
        let statusElement = $("> CompetitorStatus", resultElement);
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
    * @return {Boolean} false.
    */
    Version2Reader.isAdditional = () => false;

    /**
    * Reads a control code and split time from a SplitTime element.
    * @param {jQuery.selection} splitTimeElement jQuery selection containing
    *     a SplitTime element.
    * @return {Object} Object containing code and time.
    */
    Version2Reader.readSplitTime = function (splitTimeElement) {
        // IOF v2 allows ControlCode or Control elements.
        let code = $("> ControlCode", splitTimeElement).text();
        if (code === "") {
            code = $("> Control > ControlCode", splitTimeElement).text();
        }

        if (code === "") {
            throwInvalidData("Control code missing for control");
        }

        let timeStr = $("> Time", splitTimeElement).text();
        let time = (timeStr === "") ? null : parseTime(timeStr);
        return {code: code, time: time};
    };

    // Regexp to match ISO-8601 dates.
    // Ignores timezone info - always display times as local time.
    // We don't assume there are separator characters, and we also don't assume
    // that the seconds will be specified.
    const ISO_8601_RE = /^\d\d\d\d-?\d\d-?\d\dT?(\d\d):?(\d\d)(?::?(\d\d))?/;

    // Object that contains various functions for parsing bits of data from
    // IOF v3.0 XML event data.
    const Version3Reader = {};

    /**
    * Returns whether the given event data is likely to be results data of the
    * version 3.0 format.
    *
    * This function is called before the XML is parsed and so can provide a
    * quick way to discount files that are not of the v3.0 format.  Further
    * functions of this reader are only called if this method returns true.
    *
    * @param {String} data The event data.
    * @return {Boolean} True if the data is likely to be v3.0-format data,
    *     false if not.
    */
    Version3Reader.isOfThisVersion = data => data.indexOf("http://www.orienteering.org/datastandard/3.0") >= 0;

    /**
    * Makes a more thorough check that the parsed XML data is likely to be of
    * the v2.0.3 format.  If not, a WrongFileFormat exception is thrown.
    * @param {jQuery.selection} rootElement The root element.
    */
    Version3Reader.checkVersion = function (rootElement) {
        let iofVersion = rootElement.attr("iofVersion");
        if (isUndefined(iofVersion)) {
            throwWrongFileFormat("Could not find IOF version number");
        } else if (iofVersion !== "3.0") {
            throwWrongFileFormat(`Found unrecognised IOF XML data format '${iofVersion}'`);
        }

        let status = rootElement.attr("status");
        if (!isUndefined(status) && status.toLowerCase() !== "complete") {
            throwInvalidData("Only complete IOF data supported; snapshot and delta are not supported");
        }
    };

    /**
    * Reads the class name from a ClassResult element.
    * @param {jQuery.selection} classResultElement ClassResult element
    *     containing the course details.
    * @return {String} Class name.
    */
    Version3Reader.readClassName = classResultElement =>$("> Class > Name", classResultElement).text();

    /**
    * Reads the team name from a TeamResult element.
    * @param {jQuery.selection} teamResultElement TeamResult element
    *     containing the team result details.
    * @return {String} Team name.
    */
    Version3Reader.readTeamName = teamResultElement => $("> Name", teamResultElement).text();

    /**
    * Returns a list of elements to be read to pull out team-member information.
    * @param {jQuery.selection} teamResultElement TeamResult element
    *     containing the team result details.
    * @return {Array} Elements to parse to read team member results.
    */
    Version3Reader.readTeamMemberResults = teamResultElement => $("> TeamMemberResult", teamResultElement);

    /**
    * Reads the course details from the given ClassResult element.
    * @param {jQuery.selection} classResultElement ClassResult element
    *     containing the course details.
    * @param {Array} warnings Array that accumulates warning messages.
    * @return {Object} Course details: id, name, length, climb and number of
    *     controls.
    */
    Version3Reader.readCourseFromClass = function (classResultElement, warnings) {
        let courseElement = $("> Course", classResultElement);
        let id = $("> Id", courseElement).text() || null;
        let name = $("> Name", courseElement).text();
        let lengthStr = $("> Length", courseElement).text();
        let length;
        if (lengthStr === "") {
            length = null;
        } else {
            length = parseInt(lengthStr, 10);
            if (isNaNStrict(length)) {
                warnings.push(`Course '${name}' specifies a course length that was not understood: '${lengthStr}'`);
                length = null;
            } else {
                // Convert from metres to kilometres.
                length /= 1000;
            }
        }

        let numberOfControlsStr = $("> NumberOfControls", courseElement).text();
        let numberOfControls = parseInt(numberOfControlsStr, 10);
        if (isNaNStrict(numberOfControls)) {
            numberOfControls = null;
        }

        let climbStr = $("> Climb", courseElement).text();
        let climb = parseInt(climbStr, 10);
        if (isNaNStrict(climb)) {
            climb = null;
        }

        return {id: id, name: name, length: length, climb: climb, numberOfControls: numberOfControls};
    };

    /**
    * Returns the XML element that contains a competitor's name.  This element
    * should contain child elements with names Given and Family.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult element.
    * @return {jQuery.selection} jQuery selection containing any child Name
    *     element.
    */
    Version3Reader.getCompetitorNameElement = element => $("> Person > Name", element);

    /**
    * Returns the name of the competitor or team's club.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult or TeamResult element.
    * @return {String} Competitor or team's club name.
    */
    Version3Reader.readClubName = function (element) {
        let clubName = $("> Organisation > ShortName", element).text();
        return (clubName === "") ? $("> Organisation > Name", element).text() : clubName;
    };

    /**
    * Returns the competitor's date of birth, as a string.
    * @param {jQuery.selection} element jQuery selection containing a
    *     PersonResult element.
    * @return {String} The competitor's date of birth, as a string.
    */
    Version3Reader.readDateOfBirth = function (element) {
        let birthDate = $("> Person > BirthDate", element).text();
        let regexResult = yearRegexp.exec(birthDate);
        return (regexResult === null) ? null : parseInt(regexResult[0], 10);
    };

    /**
    * Reads a competitor's start time from the given Result element.
    * @param {jQuery.selection} element jQuery selection containing a
    *     Result element.
    * @return {Number|null} Competitor's start time, in seconds since midnight,
    *     or null if not known.
    */
    Version3Reader.readStartTime = function (resultElement) {
        let startTimeStr = $("> StartTime", resultElement).text();
        let result = ISO_8601_RE.exec(startTimeStr);
        if (result === null) {
            return null;
        } else {
            let hours = parseInt(result[1], 10);
            let minutes = parseInt(result[2], 10);
            let seconds = (isUndefined(result[3])) ? 0 : parseInt(result[3], 10);
            return hours * 60 * 60 + minutes * 60 + seconds;
        }
    };

    /**
    * Reads a time, in seconds, from a string.  If the time was not valid,
    * null is returned.
    * @param {String} timeStr The time string to read.
    * @return {Number|null} The parsed time, in seconds, or null if it could not
    *     be read.
    */
    Version3Reader.readTime = function (timeStr) {
        // IOF v3 allows fractional seconds, so we use parseFloat instead
        // of parseInt.
        let time = parseFloat(timeStr);
        return (isFinite(time)) ? time : null;
    };

    /**
    * Read a competitor's total time from the given Time element.
    * @param {jQuery.selection} element jQuery selection containing a
    *     Result element.
    * @return {Number|null} Competitor's total time, in seconds, or null if a time
    *     was not found or was invalid.
    */
    Version3Reader.readTotalTime = function (resultElement) {
        let totalTimeStr = $("> Time", resultElement).text();
        return Version3Reader.readTime(totalTimeStr);
    };

    /**
    * Returns the status of the competitor with the given result.
    * @param {jQuery.selection} resultElement jQuery selection containing a
    *     Result element.
    * @return {String} Status of the competitor.
    */
    Version3Reader.getStatus = resultElement => $("> Status", resultElement).text();

    Version3Reader.StatusNonCompetitive = "NotCompeting";
    Version3Reader.StatusNonStarter = "DidNotStart";
    Version3Reader.StatusNonFinisher = "DidNotFinish";
    Version3Reader.StatusDisqualified = "Disqualified";
    Version3Reader.StatusOverMaxTime = "OverTime";

    /**
    * Returns whether the given split-time element is for an additional
    * control, and hence should be ignored.
    * @param {jQuery.selection} splitTimeElement jQuery selection containing
    *     a SplitTime element.
    * @return {Boolean} True if the control is additional, false if not.
    */
    Version3Reader.isAdditional = splitTimeElement => (splitTimeElement.attr("status") === "Additional");

    /**
    * Reads a control code and split time from a SplitTime element.
    * @param {jQuery.selection} splitTimeElement jQuery selection containing
    *     a SplitTime element.
    * @return {Object} Object containing code and time.
    */
    Version3Reader.readSplitTime = function (splitTimeElement) {
        let code = $("> ControlCode", splitTimeElement).text();
        if (code === "") {
            throwInvalidData("Control code missing for control");
        }

        let time;
        if (splitTimeElement.attr("status") === "Missing") {
            // Missed controls have their time omitted.
            time = null;
        } else {
            let timeStr = $("> Time", splitTimeElement).text();
            time = (timeStr === "") ? null : Version3Reader.readTime(timeStr);
        }

        return {code: code, time: time};
    };

    const ALL_READERS = [Version2Reader, Version3Reader];

    /**
    * Check that the XML document passed is in a suitable format for parsing.
    *
    * If any problems arise, this function will throw an exception.  If the
    * data is valid, the function will return normally.
    * @param {XMLDocument} xml The parsed XML document.
    * @param {Object} reader XML reader used to assist with format-specific
    *     XML reading.
    */
    function validateData(xml, reader) {
        let rootElement = $("> *", xml);
        let rootElementNodeName = rootElement.prop("tagName");

        if (rootElementNodeName !== "ResultList")  {
            throwWrongFileFormat(`Root element of XML document does not have expected name 'ResultList', got '${rootElementNodeName}'`);
        }

        reader.checkVersion(rootElement);
    }

    /**
    * Parses data for a single competitor.
    * @param {XMLElement} element XML PersonResult element.
    * @param {Number} number The competitor number (1 for first in the array
    *     of those read so far, 2 for the second, ...)
    * @param {Object} reader XML reader used to assist with format-specific
    *     XML reading.
    * @param {Array} warnings Array that accumulates warning messages.
    * @return {Object|null} Object containing the competitor data, or null if no
    *     competitor could be read.
    */
    function parseCompetitor(element, number, reader, warnings) {
        let jqElement = $(element);

        let nameElement = reader.getCompetitorNameElement(jqElement);
        let name = readCompetitorName(nameElement);

        if (name === "") {
            warnings.push("Could not find a name for a competitor");
            return null;
        }

        let club = reader.readClubName(jqElement);

        let dateOfBirth =  reader.readDateOfBirth(jqElement);
        let regexResult = yearRegexp.exec(dateOfBirth);
        let yearOfBirth = (regexResult === null) ? null : parseInt(regexResult[0], 10);

        let gender = $("> Person", jqElement).attr("sex");

        let resultElement = $("Result", jqElement);
        if (resultElement.length === 0) {
            warnings.push(`Could not find any result information for competitor '${name}'`);
            return null;
        }

        let startTime = reader.readStartTime(resultElement);

        let totalTime = reader.readTotalTime(resultElement);

        let status = reader.getStatus(resultElement);

        let splitTimes = $("> SplitTime", resultElement).toArray();
        let splitData = splitTimes.filter(splitTime => !reader.isAdditional($(splitTime)))
                                  .map(splitTime => reader.readSplitTime($(splitTime)));

        let controls = splitData.map(datum => datum.code);
        let cumTimes = splitData.map(datum => datum.time);

        cumTimes.unshift(0); // Prepend a zero time for the start.

        // Append the total time, ignoring any value given for a non-starter.
        cumTimes.push((status === reader.StatusNonStarter) ? null : totalTime);

        let competitor = new Competitor(name, club);

        if (yearOfBirth !== null) {
            competitor.setYearOfBirth(yearOfBirth);
        }

        if (gender === "M" || gender === "F") {
            competitor.setGender(gender);
        }

        let result = fromOriginalCumTimes(number, startTime, cumTimes, competitor);

        if (status === "OK" && totalTime !== null && cumTimes.includes(null)) {
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
        let resultAndControls = parseCompetitor(element, number, reader, warnings);
        if (resultAndControls !== null) {
            let result = resultAndControls.result;
            let controls = resultAndControls.controls;
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
            let actualControlCount = result.getAllOriginalCumulativeTimes().length - 2;
            let warning = null;
            if (result.isNonStarter && actualControlCount === 0) {
                // Don't generate warnings for non-starting competitors with no controls.
            } else if (actualControlCount !== cls.course.numberOfControls) {
                warning = `Competitor '${result.owner.name}' in class '${cls.name}' has an unexpected number of controls: expected ${cls.course.numberOfControls}, actual ${actualControlCount}`;
            } else {
                for (let controlIndex = 0; controlIndex < actualControlCount; controlIndex += 1) {
                    if (cls.controls[controlIndex] !== controls[controlIndex]) {
                        warning = `Competitor '${result.owner.name}' has an unexpected control code at control ${controlIndex + 1}` +
                            `: expected '${cls.controls[controlIndex]}', actual '${controls[controlIndex]}'`;
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
        let teamName = reader.readTeamName(teamResultElement);
        let teamClubName = reader.readClubName(teamResultElement);
        let members = reader.readTeamMemberResults(teamResultElement);

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

        let results = [];
        let allControls = [];
        for (let member of members) {
            let resultAndControls = parseCompetitor(member, number, reader, warnings);
            if (resultAndControls === null) {
                // A warning for this competitor rules out the entire team.
                return;
            }

            results.push(resultAndControls.result);
            allControls.push(resultAndControls.controls);
        }

        for (let index = 1; index < members.length; index += 1) {
            let previousFinishTime = $("> Result > FinishTime", members[index - 1]).text();
            let nextStartTime = $("> Result > StartTime", members[index]).text();
            if (!results[index].isNonStarter && previousFinishTime !== nextStartTime) {
                warnings.push(`In team ${(teamName === "" ? "(unnamed team)" : teamName)} in class '${cls.name}', ${results[index - 1].owner.name} does not finish at the same time as ${results[index].owner.name} starts`);
                return;
            }
        }

        let thisTeamControlCounts = allControls.map(controls => controls.length);

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
            warnings.push(`Team ${(teamName === "" ? "(unnamed team)" : "'" + teamName + "'")} in class '${cls.name}' has an unexpected number of members: expected ${cls.teamSize} but was actually ${results.length}`);
        }
        else {
            let warning = null;
            let teamResult = createTeamResult(number, results, new Team(teamName, teamClubName));

            for (let teamMemberIndex = 0; teamMemberIndex < results.length; teamMemberIndex += 1) {
                let expectedControlCount = cls.course.numbersOfControls[teamMemberIndex];
                let memberResult = results[teamMemberIndex];

                // Subtract 2 for the start and finish cumulative times.
                let actualControlCount = memberResult.getAllOriginalCumulativeTimes().length - 2;

                if (actualControlCount !== expectedControlCount) {
                    warning = `Competitor '${memberResult.owner.name}' in team '${teamName}' in class '${cls.name}' has an unexpected number of controls: expected ${expectedControlCount}, actual ${actualControlCount}`;
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
    * @param {XMLElement} element XML ClassResult element
    * @param {Object} reader XML reader used to assist with format-specific
    *     XML reading.
    * @param {Array} warnings Array to accumulate any warning messages within.
    * @return {Object} Object containing parsed data.
    */
    function parseClassData(element, reader, warnings) {
        let jqElement = $(element);
        let cls = {name: null, results: [], teamSize: null, controls: [], course: null};

        cls.course = reader.readCourseFromClass(jqElement, warnings);

        let className = reader.readClassName(jqElement);

        if (className === "") {
            className = "<unnamed class>";
        }

        cls.name = className;
        cls.course.numbersOfControls = null;

        let personResults = $("> PersonResult", jqElement);
        let teamResults = $("> TeamResult", jqElement);

        if (personResults.length > 0 && teamResults.length > 0) {
            warnings.push(`Class '${className}' has a combination of relay teams and individual results`);
            return null;
        } else if (personResults.length > 0) {
            for (let personIndex = 0; personIndex < personResults.length; personIndex += 1) {
                parsePersonResult(personResults[personIndex], personIndex + 1, cls, reader, warnings);
            }
        } else if (teamResults.length > 0) {
            for (let teamIndex = 0; teamIndex < teamResults.length; teamIndex += 1) {
                parseTeamResult(teamResults[teamIndex], teamIndex + 1, cls, reader, warnings);
            }
        } else {
            warnings.push(`Class '${className}' has no competitors`);
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
    * @param {String} data The event data.
    * @return {Object} XML reader used to read version-specific information.
    */
    function determineReader(data) {
        for (let reader of ALL_READERS) {
            if (reader.isOfThisVersion(data)) {
                return reader;
            }
        }

        throwWrongFileFormat("Data apparently not of any recognised IOF XML format");
    }

    /**
    * Parses IOF XML data in either the 2.0.3 format or the 3.0 format and
    * returns the data.
    * @param {String} data String to parse as XML.
    * @return {Event} Parsed event object.
    */
    function parseEventData(data) {

        let reader = determineReader(data);

        let xml = parseXml(data);

        validateData(xml, reader);

        let classResultElements = $("> ResultList > ClassResult", $(xml)).toArray();

        if (classResultElements.length === 0) {
            throwInvalidData("No class result elements found");
        }

        let classes = [];

        // Array of all 'temporary' courses, intermediate objects that contain
        // course data but not yet in a suitable form to return.
        let tempCourses = [];

        // Map that maps course IDs plus comma-separated lists of controls
        // to the temporary course with that ID and controls.
        // (We expect that all classes with the same course ID have consistent
        // controls, but we don't assume that.)
        let coursesMap = new Map();

        let warnings = [];

        for (let classResultElement of classResultElements) {
            let parsedClass = parseClassData(classResultElement, reader, warnings);
            if (parsedClass === null) {
                // Class could not be parsed.
                continue;
            }

            let tempCourse = parsedClass.course;

            let numberOfControls;
            let courseKey;
            let isTeamClass;
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

            let courseClass = new CourseClass(parsedClass.name, numberOfControls, parsedClass.results);
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
        }

        // Now build up the array of courses.
        let courses = tempCourses.map(tempCourse => {
            let course = new Course(tempCourse.name, tempCourse.classes, tempCourse.length, tempCourse.climb, tempCourse.controls);
            for (let courseClass of tempCourse.classes) {
                courseClass.setCourse(course);
            }
            return course;
        });

        return new Event(classes, courses, warnings);
    }

    SplitsBrowser.Input.IOFXml = { parseEventData: parseEventData };
})();