/*
 *  SplitsBrowser - IOF XML format parser tests.
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
(function (){
    "use strict";
    
    var formatTime = SplitsBrowser.formatTime;
    var parseEventData = SplitsBrowser.Input.IOFXml.parseEventData;

    // The number of feet per kilometre.
    var FEET_PER_KILOMETRE = 3280;
    
    var V2_HEADER = '<?xml version="1.0" ?>\n<!DOCTYPE ResultList SYSTEM "IOFdata.dtd">\n';
    
    var V3_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n<ResultList xmlns="http://www.orienteering.org/datastandard/3.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" iofVersion="3.0">\n';
    
    QUnit.module("Input.IOFXml");
    
    /**
    * Returns a person object with the forename, surname, club, startTime,
    * totalTime, courseLength, controls and cumTimes properties set.
    * @return {Object} Person object.
    */
    function getPerson() {
        return {
            forename: "First",
            surname: "Runner",
            club: "TestClub",
            gender: "M",
            birthDate: "1976-04-11",
            startTime: 10 * 3600 + 11 * 60 + 37,
            finishTime: 10 * 3600 + 21 * 60 + 7,
            totalTime: 65 + 221 + 184 + 100,
            controls: ["182", "148", "167"],
            cumTimes: [65, 65 + 221, 65 + 221 + 184],
            result: true
        };
    }
    
    function getTeam() {
        var teamMember1 = getPerson();
        var teamMember2 = { 
            forename: "Second",
            surname: "Runner",
            club: "TestClub",
            gender: "M",
            birthDate: "1978-08-18",
            startTime: 10 * 3600 + 21 * 60 + 7,
            finishTime: 10 * 3600 + 29 * 60 + 53,
            totalTime: 61 + 193 + 176 + 103,
            controls: ["183", "149", "167"],
            cumTimes: [61, 61 + 193, 65 + 193 + 176],
            result: true
        };
        
        return {name: "TestTeam", club: "TeamClubName", members: [teamMember1, teamMember2]};
    }
    
    // In all of the following XML generation functions, it is assumed that the
    // input argument contains no characters that are interpreted by XML, such
    // as < > & " '.  This is only test code; we assume those writing these
    // tests are smart enough to know not to do this.
    
    var Version2Formatter = {
        name: "version 2.0.3",
        header: V2_HEADER + '\n<ResultList>\n<IOFVersion version="2.0.3" />\n'
    };
       
    /**
    * Returns a chunk of XML that contains a class name.
    * @param {String} className - The name of the class.
    * @return {String} XML string containing the class name.
    */
    Version2Formatter.getClassXml = function (className) {
        return "<ClassShortName>" + className + "</ClassShortName>\n";
    };

    /**
    * Returns a chunk of XML that contains course details.
    * This formatter does not support course details, so this function returns
    * an empty string.
    * @returns {String} An empty string.
    */
    Version2Formatter.getCourseXml = function () {
        return "";
    };

    /**
    * Returns a chunk of XML that contains club details.
    * @param {Object} resultData - The person or team data
    * @return {String} Generated XML string.
    */
    Version2Formatter.getClubXml = function (resultData) {
        if (resultData.hasOwnProperty("club")) {
            return '<Club><ShortName>' + resultData.club + '</ShortName></Club>\n';
        } else if (resultData.hasOwnProperty("clubFull")) {
            return '<Club><Name>' + resultData.clubFull + '</Name></Club>\n';
        } else {
            return '';
        }
    };
    
    /**
    * Generates some XML for a person.
    *
    * The properties supported are as follows.  Unless specified otherwise, the
    * XML generated for each property is omitted if the property is not
    * specified:
    * * forename (String) - The person's forename.
    * * surname (String) - The person's surname.
    * * club {String} The person's club.
    * * startTime (Number) - The person's start time, in seconds since
    *       midnight.
    * * finishTime (Number) - The person's finish time, in seconds since
    *       midnight.
    * * totalTime (Number) - The person's total time, in seconds.
    * * competitive (boolean) - True if competitive, false if non-competitive.  
    *       Assumed competitive if not specified.
    * * controls (Array) - Array of control codes.  Must be specified.
    * * cumTimes {Array} - Array of cumulative times.  Must be specified.
    * * result {Any} - Specified to include the <Result> element, omit to
    *       skip it.
    *
    * Additionally the classData object has the following properties:    
    * * courseLength (Number) - The length of the course.
    * * courseLengthUnit (String) - The unit that the length of the course is
    *       measured in.
    *
    * @param {Object} personData - The person data.
    * @param {Object} classData - The class data.
    * @return {String} Generated XML string.
    */
    Version2Formatter.getPersonResultXml = function (personData, classData) {
        
        function exists(name) {
            return personData.hasOwnProperty(name);
        }
    
        if (!exists("controls") || !exists("cumTimes")) {
            throw new Error("controls and cumTimes must both be specified");
        }
    
        if (personData.controls.length !== personData.cumTimes.length) {
            throw new Error("Controls and cumulative times have different lengths");
        }
    
        var personNameXml = "";
        if (exists("forename") || exists("surname")) {
            personNameXml = '<Person';
            if (exists("gender")) {
                personNameXml += ' sex="' + personData.gender + '"';
            }
            
            personNameXml += '><PersonName>\n';
            if (exists("forename")) {
                personNameXml += '<Given>' + personData.forename + '</Given>\n';
            }
            if (exists("surname")) {
                personNameXml += '<Family>' + personData.surname + '</Family>\n';
            }
            personNameXml += '</PersonName>';
            
            if (exists("birthDate")) {
                personNameXml += '<BirthDate><Date>' + personData.birthDate + '</Date></BirthDate>\n';
            }
            
            personNameXml += '</Person>\n';
        }
        
        var clubXml = Version2Formatter.getClubXml(personData);

        var startTimeXml = (exists("startTime")) ? '<StartTime><Clock>' + formatTime(personData.startTime) + '</Clock></StartTime>\n' : '';
        var finishTimeXml = (exists("finishTime")) ? '<FinishTime><Clock>' + formatTime(personData.finishTime) + '</Clock></FinishTime>\n' : '';
        var totalTimeXml = (exists("totalTime")) ? '<Time>' + formatTime(personData.totalTime) + '</Time>\n' : '';
        
        var status;
        if (exists("okDespiteMissingTimes")) {
            status = "OK";
        } else if (exists("nonStarter")) {
            status = "DidNotStart";
        } else if (exists("nonFinisher")) {
            status = "DidNotFinish";
        } else if (exists("disqualified")) {
            status = "Disqualified";
        } else if (exists("overMaxTime")) {
            status = "OverTime";
        } else if (personData.cumTimes.indexOf(null) >= 0) {
            status = "MisPunch";
        } else if (!exists("competitive") || personData.competitive) {
            status = "OK";
        } else {
            status = "NotCompeting";
        }
        
        var statusXml = '<CompetitorStatus value="' + status + '" />\n';
        
        var courseLengthXml = "";
        if (classData.hasOwnProperty("length")) {
            if (classData.hasOwnProperty("lengthUnit")) {
                courseLengthXml = '<CourseLength unit="' + classData.lengthUnit + '">' + classData.length + '</CourseLength>\n';       
            } else {
                courseLengthXml = '<CourseLength>' + classData.length + '</CourseLength>\n';
            }
        }
        
        var splitTimesXmls = [];
        for (var index = 0; index < personData.cumTimes.length; index += 1) {
            splitTimesXmls.push('<SplitTime><ControlCode>' + personData.controls[index] + '</ControlCode><Time>' + formatTime(personData.cumTimes[index]) + '</Time></SplitTime>\n');
        }
        
        var resultXml = exists("result") ? '<Result>' + startTimeXml + finishTimeXml + totalTimeXml + statusXml + courseLengthXml + splitTimesXmls.join("") + '</Result>\n' : '';
        
        return '<PersonResult>' + personNameXml + clubXml + resultXml + '</PersonResult>\n';
    };

    /**
    * Generates some XML for a team name.
    * @param {String} name The name of the team.
    * @return {String} Generated XML string.
    */
    Version2Formatter.getTeamNameXml = function (name) {
        return '<TeamName>' + name + '</TeamName>';
    };

    /**
    * Generates some XML for a team member result.
    *
    * For IOF XML v2 the format is identical to that for a PersonResult.
    *
    * @param {Object} personData - The person data.
    * @param {Object} classData - The class data.
    * @return {String} Generated XML string.
    */
    Version2Formatter.getTeamMemberResultXml = function (personData, classData) {
        return Version2Formatter.getPersonResultXml(personData, classData);
    };
    
    /**
    * Zero-pads the given value to two digits.
    * @param {Number} value - The value to pad.
    * @return {String} Zero-padded number as a string.
    */
    function zeroPadTwoDigits (value) {
        return (value < 10) ? "0" + value : value.toString();
    }
    
    function hours (value) { return zeroPadTwoDigits(Math.floor(value / 3600)); }
    function minutes (value) { return zeroPadTwoDigits(Math.floor(value / 60) % 60); }
    function seconds (value) { return zeroPadTwoDigits(value % 60); }
    
    /**
    * Formats a start or finish time as an ISO-8601 date.
    * @param {Number} time - The time to format.
    * @return {String} The formatted date.
    */ 
    function formatStartOrFinishTime(time) {
        return "2014-06-07T" + hours(time) + ":" + minutes(time) + ":" + seconds(time) + ".000+01:00";
    }
    
    /**
    * Formats a start or finish time as an ISO-8601 date, but ending after the
    * minutes.
    * @param {Number} time - The time to format.
    * @return {String} The formatted date.
    */ 
    function formatStartOrFinishTimeNoSeconds (time) {
        return "2014-06-07T" + hours(time) + ":" + minutes(time);
    }
    
    /**
    * Formats a start or finish time as a 'basic' ISO-8601 date, i.e. one
    * without all of the separating characters.
    * @param {Number} time - The time to format.
    * @return {String} The formatted date.
    */ 
    function formatStartOrFinishTimeBasic (time) {
        return "20140607" + hours(time) + minutes(time) + seconds(time);
    }

    var Version3Formatter = {
        name: 'version 3.0',
        header: V3_HEADER + '<Event><Name>Test event name</Name></Event>\n'
    };
       
    /**
    * Returns a chunk of XML that contains a class name.
    * @param {String} className - The name of the class.
    * @return {String} XML string containing the class name.
    */
    Version3Formatter.getClassXml = function (className) {
        return '<Class><Name>' + className + '</Name></Class>\n';
    };

    /**
    * Returns a chunk of XML that contains course details.
    * @param {Object} clazz - Object containing class data.
    * @returns {String} XML string.
    */
    Version3Formatter.getCourseXml = function (clazz) {
        var xml = '<Course>\n';
        if (clazz.hasOwnProperty("courseId")) {
            xml += '<Id>' + clazz.courseId + '</Id>\n';
        }
        
        if (clazz.hasOwnProperty("courseName")) {
            xml += '<Name>' + clazz.courseName + '</Name>\n';
        } else if (clazz.hasOwnProperty("name")) {
            xml += '<Name>' + clazz.name + '</Name>\n';
        }
        
        if (clazz.hasOwnProperty("length")) {
            xml += '<Length>' + clazz.length + '</Length>\n';
        }
        
        if (clazz.hasOwnProperty("climb")) {
            xml += '<Climb>' + clazz.climb + '</Climb>\n';
        }
        
        if (clazz.hasOwnProperty("numberOfControls")) {
            xml += '<NumberOfControls>' + clazz.numberOfControls + '</NumberOfControls>\n';
        }

        xml += '</Course>\n';
  
        return xml;
    };
    
    /**
    * Returns a chunk of XML that contains club details.
    * @param {Object} resultData - The person or team data
    * @return {String} Generated XML string.
    */
    Version3Formatter.getClubXml = function (resultData) {
        if (resultData.hasOwnProperty("club")) {
            return '<Organisation><ShortName>' + resultData.club + '</ShortName></Organisation>\n';
        } else if (resultData.hasOwnProperty("clubFull")) {
            return '<Organisation><Name>' + resultData.clubFull + '</Name></Organisation>\n';
        } else {
            return '';
        }
    };

    /**
    * Generates some XML for an individual result, either a competitor in an
    * individual event or a team member in a relay.
    *
    * The properties supported are as follows.  Unless specified otherwise, the
    * XML generated for each property is omitted if the property is not
    * specified:
    * * forename (String) - The person's forename.
    * * surname (String) - The person's surname.
    * * club {String} The person's club.
    * * startTime (Number) - The person's start time, in seconds since
    *       midnight.
    * * finishTime (Number) - The person's start time, in seconds since
    *       midnight.
    * * totalTime (Number) - The person's total time, in seconds.
    * * competitive (boolean) - True if competitive, false if non-competitive.  
    *       Assumed competitive if not specified.
    * * controls (Array) - Array of control codes.  Must be specified.
    * * cumTimes {Array} - Array of cumulative times.  Must be specified.
    * * result {Any} - Specified to include the <Result> element, omit to
    *       skip it.
    *
    * @param {Object} personData - The person data.
    * @param {String} elementName - The name of the root element.
    * @return {String} Generated XML string.
    */
    Version3Formatter.getIndividualResultXml = function (personData, elementName) {
        
        function exists(name) {
            return personData.hasOwnProperty(name);
        }
    
        if (!exists("controls") || !exists("cumTimes")) {
            throw new Error("controls and cumTimes must both be specified");
        }
    
        if (personData.controls.length !== personData.cumTimes.length) {
            throw new Error("Controls and cumulative times have different lengths");
        }
    
        var personNameXml = "";
        if (exists("forename") || exists("surname")) {
            personNameXml = '<Person';
            
            if (exists("gender")) {
                personNameXml += ' sex="' + personData.gender + '"';
            }
            
            personNameXml += '><Name>\n';
            
            if (exists("forename")) {
                personNameXml += '<Given>' + personData.forename + '</Given>\n';
            }
            if (exists("surname")) {
                personNameXml += '<Family>' + personData.surname + '</Family>\n';
            }
            
            personNameXml += '</Name>';
            
            if (exists("birthDate")) {
                personNameXml += '<BirthDate>' + personData.birthDate + '</BirthDate>\n';
            }
            
            personNameXml += '</Person>\n';
        }
        
        var startTimeStr;
        if (personData.startTime === null) {
            startTimeStr = '';
        } else if (exists("startTimeBasic")) {
            startTimeStr = formatStartOrFinishTimeBasic(personData.startTime);
        } else if (exists("startTimeNoSeconds")) {
            startTimeStr = formatStartOrFinishTimeNoSeconds(personData.startTime);
        } else {
            startTimeStr = formatStartOrFinishTime(personData.startTime);
        }
        
        var finishTimeStr;
        if (personData.finishTime === null) {
            finishTimeStr = '';
        } else if (exists("finishTimeBasic")) {
            finishTimeStr = formatStartOrFinishTimeBasic(personData.finishTime);
        } else if (exists("finishTimeNoSeconds")) {
            finishTimeStr = formatStartOrFinishTimeNoSeconds(personData.finishTime);
        } else {
            finishTimeStr = formatStartOrFinishTime(personData.finishTime);
        }
        
        var clubXml = Version3Formatter.getClubXml(personData);
        
        var startTimeXml = (exists("startTime")) ? '<StartTime>' + startTimeStr + '</StartTime>\n' : '';
        var finishTimeXml = (exists("finishTime")) ? '<FinishTime>' + finishTimeStr + '</FinishTime>\n' : '';
        var totalTimeXml = (exists("totalTime")) ? '<Time>' + personData.totalTime + '</Time>' : '';
        
        var status;
        if (exists("okDespiteMissingTimes")) {
            status = "OK";
        } else if (exists("nonStarter")) {
            status = "DidNotStart";
        } else if (exists("nonFinisher")) {
            status = "DidNotFinish";
        } else if (exists("disqualified")) {
            status = "Disqualified";
        } else if (exists("overMaxTime")) {
            status = "OverTime";
        } else if (personData.cumTimes.indexOf(null) >= 0) {
            status = "MissingPunch";
        } else if (!exists("competitive") || personData.competitive) {
            status = "OK";
        } else {
            status = "NotCompeting";
        }
        
        var statusXml = '<Status>' + status + '</Status>\n';
        
        var splitTimesXmls = [];
        for (var index = 0; index < personData.cumTimes.length; index += 1) {
            var time = personData.cumTimes[index];
            if (time === null) {
                splitTimesXmls.push('<SplitTime status="Missing"><ControlCode>' + personData.controls[index] + '</ControlCode></SplitTime>\n');
            } else {
                splitTimesXmls.push('<SplitTime><ControlCode>' + personData.controls[index] + '</ControlCode><Time>' + time + '</Time></SplitTime>\n');
            }
        }
        
        var resultXml = exists("result") ? '<Result>' + startTimeXml + finishTimeXml + totalTimeXml + statusXml + splitTimesXmls.join('') + '</Result>\n' : '';
        
        return '<' + elementName + '>' + personNameXml + clubXml + resultXml + '</' + elementName + '>\n';
    };

    /**
    * Generates some XML for an individual competitor result.
    *
    * For IOF XML v3 this uses a PersonResult element.
    *
    * @param {Object} personData - The person data.
    * @return {String} Generated XML string.
    */
    Version3Formatter.getPersonResultXml = function (personData) {
        return Version3Formatter.getIndividualResultXml(personData, "PersonResult");
    };

    /**
    * Generates some XML for a team name.
    * @param {String} name The name of the team.
    * @return {String} Generated XML string.
    */
    Version3Formatter.getTeamNameXml = function (name) {
        return '<Name>' + name + '</Name>';
    };

    /**
    * Generates some XML for an team member result.
    *
    * For IOF XML v3 this uses a TeamMemberResult element.
    *
    * @param {Object} personData - The person data.
    * @return {String} Generated XML string.
    */
    Version3Formatter.getTeamMemberResultXml = function (personData) {
        return Version3Formatter.getIndividualResultXml(personData, "TeamMemberResult");
    };
    
    var ALL_FORMATTERS = [Version2Formatter, Version3Formatter];
    
    /**
    * Formats a relay team to XML
    * @param {Object} formatter The formatter to generate the XML with.
    * @param {Object} team The team data.
    * @param {Object} clazz The class data.
    * @return {String} Generated XML string.
    */
    function formatRelayTeam(formatter, team, clazz) {
        return '<TeamResult>\n' + formatter.getTeamNameXml(team.name) + formatter.getClubXml(team) +
                    team.members.map(function (member) { return formatter.getTeamMemberResultXml(member, clazz); }).join("\n") +
                    "\n</TeamResult>";
    }
    
    /**
    * Uses the given formatter to format the given class data as XML.
    * @param {Object} formatter - Formatter object.
    * @param {Array} classes - Array of objects containing data to format.
    * @return {String} Formatted XML string.
    */
    function getXmlFromFormatter(formatter, classes) {
        var xml = formatter.header;
        classes.forEach(function (clazz) {
            xml += '<ClassResult>\n';
            if (clazz.hasOwnProperty("name")) {
                xml += formatter.getClassXml(clazz.name);
            }
            
            xml += formatter.getCourseXml(clazz);
            
            if (clazz.hasOwnProperty("competitors")) {
                xml += clazz.competitors.map(function (comp) { return formatter.getPersonResultXml(comp, clazz); }).join("\n");
            }
            
            if (clazz.hasOwnProperty("teams")) {
                xml += clazz.teams.map(function (team) { return formatRelayTeam(formatter, team, clazz); }).join("\n");
            }
            
            if (!clazz.hasOwnProperty("competitors") && !clazz.hasOwnProperty("teams")) {
                throw new Error("Class has no competitor nor team results");
            }
            
            xml += '</ClassResult>\n';
        });
        
        xml += '</ResultList>\n';
        return xml;
    }
    
    /**
    * Returns the single result in the given event.
    *
    * This function also asserts that the event has exactly one course-class and
    * exactly one result within that class.  This one result is what
    * it returns.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Event} eventData - Event data parsed by the reader.
    * @param {String} formatterName - Name of the formatter used to generate
    *     the XML.
    * @return {Result} The single result.
    */
    function getSingleResult(assert, eventData, formatterName) {
        assert.strictEqual(eventData.classes.length, 1, "Expected one class - " + formatterName);
        if (eventData.classes.length === 1) {
            var courseClass = eventData.classes[0];
            assert.strictEqual(courseClass.results.length, 1, "Expected one result - " + formatterName);
            if (courseClass.results.length === 1) {
                return eventData.classes[0].results[0];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    
    /**
    * Asserts that attempting to parse the given XML string will fail with an
    * InvalidData exception being thrown.
    * @param {QUnit.assert] assert - QUnit assert object.
    * @param {String} xml - The XML string to attempt to parse.
    * @param {String} failureMessage - Optional message to show in assertion
    *     failure message if no exception is thrown.  A default message is used
    *     instead if this is not specified.
    */
    function assertInvalidData(assert, xml, failureMessage) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            parseEventData(xml);
        }, failureMessage);    
    }
    
    /**
    * Asserts that attempting to parse the given string will fail with a
    * WrongFileFormat exception being thrown.
    * @param {QUnit.assert] assert - QUnit assert object.
    * @param {String} data - The string to attempt to parse.
    * @param {String} failureMessage - Optional message to show in assertion
    *     failure message if no exception is thrown.  A default message is used
    *     instead if this is not specified.
    */
    function assertWrongFileFormat(assert, data, failureMessage) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", function () {
            parseEventData(data);
        }, failureMessage);    
    }
    
    /**
    * Generates XML using each available formatter, parses the resulting XML,
    * and calls the given checking function on the result.
    *
    * The options supported are:
    * * formatters (Array): Array of formatters to use with this parser.
    *       Defaults to all formatters.
    * * preprocessor (Function): Function used to preprocess the
    *       XML before it is parsed.  Defaults to no preprocessing.
    * If none of the above options are required, the options object itself can
    * be omitted.
    *
    * @param {QUnit.assert] assert - QUnit assert object.
    * @param {Array} classes - Array of class objects to generate the XML from.
    * @param {Function} checkFunc - Checking function called for each parsed
    *     event data object.  It is passed the data, and also the name of the
    *     formatter used.
    * @param {Object} options - Options object, the contents of which are
    *     described above.
    */
    function runXmlFormatParseTest(classes, checkFunc, options) {
        var formatters = (options && options.formatters) || ALL_FORMATTERS;
        formatters.forEach(function (formatter) {
            var xml = getXmlFromFormatter(formatter, classes);
            if (options && options.preprocessor) {
                xml = options.preprocessor(xml);
            }
            var eventData = parseEventData(xml);
            checkFunc(eventData, formatter.name);
        });
    }
    
    /**
    * Generates XML using each available formatter, parses the resulting XML,
    * and calls the given checking function on the result.  This function
    * asserts that the resulting data contains only a single result, and
    * then calls the check function with the parsed result.
    *
    * The options supported are the same as those for runXmlFormatParseTest.
    *
    * @param {QUnit.assert] assert - QUnit assert object.
    * @param {Object} clazz - Class object to generate the XML from.
    * @param {Function} checkFunc - Checking function called for the parsed
    *     result, if a single result results.  It is passed the parsed result.
    * @param {Object} options - Options object, the contents of which are
    *     described above.
    */
    function runSingleCompetitorXmlFormatParseTest(assert, clazz, checkFunc, options) {
        runXmlFormatParseTest([clazz], function (eventData, formatterName) {
            var result = getSingleResult(assert, eventData, formatterName);
            if (result !== null) {
                checkFunc(result);
            }
        }, options);
    }
    
    /**
    * Generates XML using each available formatter, parses the resulting XML,
    * and calls the given checking function on the result.  This function
    * asserts that the resulting data contains only a single course, and
    * then calls the check function with the parsed course.
    *
    * The options supported are the same as those for runXmlFormatParseTest.
    *
    * @param {Array} classes - Array of class objects to generate the XML from.
    * @param {Function} checkFunc - Checking function called for the parsed
    *     course, if a single course results.  It is passed the parsed course.
    * @param {Object} options - Options object, the contents of which are
    *     described above.
    */
    function runSingleCourseXmlFormatParseTest(assert, classes, checkFunc, options) {
        runXmlFormatParseTest(classes, function (eventData, formatterName) {
            assert.strictEqual(eventData.courses.length, 1, "Expected one course - " + formatterName);
            if (eventData.courses.length === 1) {
                checkFunc(eventData.courses[0]);
            }
        }, options);
    }
    
    /**
    * Generates XML using each available formatter, attempts to parse each
    * generated XML string and asserts that each attempt fails.
    *
    * The options supported are:
    * * formatters (Array): Array of formatters to use with this parser.
    *       Defaults to all formatters.
    * * preprocessor (Function): Function used to preprocess the
    *       XML before it is parsed.  Defaults to no preprocessing.
    * If none of the above options are required, the options object itself can
    * be omitted.
    *
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Array} classes - Array of class objects to generate the XML
    *     using.
    * @param {Object} options - Options object, the contents of which are
    *     described above.
    */
    function runFailingXmlFormatParseTest(assert, classes, options) {
        var formatters = (options && options.formatters) || ALL_FORMATTERS;    
        formatters.forEach(function (formatter) {
            var xml = getXmlFromFormatter(formatter, classes);
            if (options && options.preprocessor) {
                xml = options.preprocessor(xml);
            }
            assertInvalidData(assert, xml, "Expected invalid data - " + formatter.name);
        });
    }

    QUnit.test("Cannot parse an empty string", function (assert) {
        assertWrongFileFormat(assert, "");
    });
    
    QUnit.test("Cannot parse a non-empty string that is not XML", function (assert) {
        assertWrongFileFormat(assert, "This is not valid IOF XML data");
    });
    
    QUnit.test("Cannot parse a string that is XML but does not mention the IOFdata DTD", function (assert) {
        assertWrongFileFormat(assert, "<ResultList />");
    });

    QUnit.test("Cannot parse a string for the v2.0.3 format that mentions the IOFdata DTD but is not well-formed XML", function (assert) {
        assertInvalidData(assert, V2_HEADER + '<ResultList <<<');
    });

    QUnit.test("Cannot parse a string for the v2.0.3 format that uses the wrong root element name", function (assert) {
        assertWrongFileFormat(assert, V2_HEADER + '<Wrong />');
    });
    
    QUnit.test("Cannot parse a string for the v2.0.3 format that does not contain an IOFVersion element", function (assert) {
        assertWrongFileFormat(assert, V2_HEADER + '<ResultList><NotTheIOFVersion version="1.2.3" /><ClassResult /></ResultList>\n');
    });
    
    QUnit.test("Cannot parse a string for the v2.0.3 format that has an IOFVersion element with no version attribute", function (assert) {
        assertWrongFileFormat(assert, V2_HEADER + '<ResultList><IOFVersion /><ClassResult /></ResultList>\n');
    });
    
    QUnit.test("Cannot parse a string for the v2.0.3 format that has an IOFVersion element with a version other than 2.0.3", function (assert) {
        assertWrongFileFormat(assert, V2_HEADER + '<ResultList><IOFVersion version="wrong" /><ClassResult /></ResultList>\n');
    });
    
    QUnit.test("Cannot parse a string for the v2.0.3 format that has a status of something other than complete", function (assert) {
        assertInvalidData(assert,
            V2_HEADER + '<ResultList status="delta"><IOFVersion version="2.0.3" /></ResultList>\n',
            "Exception should be thrown attempting to parse XML that contains an IOFVersion element with a wrong version");
    });

    QUnit.test("Cannot parse a string for the v3.0 format that mentions the IOF XSD but is not well-formed XML", function (assert) {
        assertInvalidData(assert, V3_HEADER.replace('<ResultList', '<ResultList <<<'));
    });

    QUnit.test("Cannot parse a string for the v3.0 format that uses the wrong root element name", function (assert) {
        assertWrongFileFormat(assert, V3_HEADER.replace('<ResultList', '<Wrong') + '</Wrong>');
    });
    
    QUnit.test("Cannot parse a string for the v3.0 format that contains no iofVersion attribute", function (assert) {
        assertWrongFileFormat(assert, V3_HEADER.replace('iofVersion="3.0"', '') + '</ResultList>');
    });
    
    QUnit.test("Cannot parse a string for the v3.0 format that has an iofVersion element with a version other than 3.0", function (assert) {
        assertWrongFileFormat(assert, V3_HEADER.replace('iofVersion="3.0"', 'iofVersion="4.6"') + '</ResultList>');
    });
    
    QUnit.test("Cannot parse a string for the v3.0 format that has a status of something other than complete", function (assert) {
        assertInvalidData(assert,
            V3_HEADER.replace('<ResultList', '<ResultList status="Delta"') + '</ResultList>',
            "Exception should be thrown attempting to parse XML that contains an IOFVersion element with a wrong version");
    });
    
    QUnit.test("Cannot parse a string that has no class results in it", function (assert) {
        runFailingXmlFormatParseTest(assert, []);
    });
    
    QUnit.test("Can parse with warnings a string that has a class with no name", function (assert) {
        runXmlFormatParseTest([{length: 2300, courseId: 1, competitors: [getPerson()]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.ok(eventData.classes[0].name !== "");
            });
    });
    
    QUnit.test("Can parse a string that has a single class with no competitors", function (assert) {
        runXmlFormatParseTest([{name: "Test Class", length: 2300, courseId: 1, competitors: []}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 0, "No classes should have been read - " + formatterName);
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued");
            });
    });
    
    QUnit.test("Can parse a string that has a single class with a single competitor", function (assert) {
        var className = "Test Class";
        var classLength = 2300;
        var person = getPerson();
        runXmlFormatParseTest([{name: className, length: classLength, competitors: [person]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    var courseClass = eventData.classes[0];
                    assert.strictEqual(courseClass.name, className);
                    assert.strictEqual(courseClass.results.length, 1, "One competitor should have been read - " + formatterName);
                    assert.strictEqual(courseClass.numControls, 3);
                    assert.ok(!courseClass.isTeamClass, "Course-class should not be marked as a team class");
                    
                    if (courseClass.results.length === 1) {
                        var result = courseClass.results[0];
                        assert.strictEqual(result.owner.name, person.forename + " " + person.surname);
                        assert.strictEqual(result.owner.club, person.club);
                        assert.strictEqual(result.owner.gender, "M");
                        assert.strictEqual(result.owner.yearOfBirth, 1976);
                        assert.strictEqual(result.startTime, person.startTime);
                        assert.strictEqual(result.totalTime, person.totalTime);
                        assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0].concat(person.cumTimes).concat(person.totalTime));
                        assert.ok(result.completed());
                        assert.ok(!result.isNonCompetitive);
                    }
                
                    assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatterName);
                    if (eventData.courses.length > 0) {
                        var course = eventData.courses[0];
                        assert.strictEqual(course.name, className);
                        assert.strictEqual(course.length, classLength / 1000);
                        assert.deepEqual(course.controls, person.controls);
                        
                        assert.deepEqual(course.classes, [courseClass]);
                        assert.strictEqual(courseClass.course, course);
                    }
                }
            });
    });
    
    QUnit.test("Can parse a string that has a single class with a single competitor and complete status in IOF v2.0.3 format", function (assert) {
        runXmlFormatParseTest([{name: "Test Class", length: 2300, competitors: [getPerson()]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
            },
            {
                preprocessor: function (xml) { return xml.replace(/<ResultList>/, '<ResultList status="complete">'); },
                formatters: [Version2Formatter]
            }
        );
    });
    
    QUnit.test("Can parse a string that has a single class with a single competitor and complete status in IOF v3.0 format", function (assert) {
        runXmlFormatParseTest([{name: "Test Class", length: 2300, competitors: [getPerson()]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
            },
            {
                preprocessor: function (xml) { return xml.replace(/<ResultList/, '<ResultList status="Complete"'); },
                formatters: [Version3Formatter]
            }
        );
    });
    
    QUnit.test("Can parse a string that has a single class with a single competitor with forename only", function (assert) {
        var person = getPerson();
        delete person.surname;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.owner.name, person.forename);
            });
    });
    
    QUnit.test("Can parse a string that has a single class with a single competitor with surname only", function (assert) {
        var person = getPerson();
        delete person.forename;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.owner.name, person.surname);
            });
    });
    
    QUnit.test("Can parse with warnings a string that contains a competitor with no name", function (assert) {
        var person = getPerson();
        delete person.forename;
        delete person.surname;
        runXmlFormatParseTest(
            [{name: "Test Class", length: 2300, courseId: 1, competitors: [person]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results.length, 0, "No competitors should have been read - " + formatterName);
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with a full club name", function (assert) {
        var person = getPerson();
        delete person.club;
        person.clubFull = "Test Full Club Name";
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.owner.club, person.clubFull);
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with missing club", function (assert) {
        var person = getPerson();
        delete person.club;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.owner.club, "");
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with no year of birth", function (assert) {
        var person = getPerson();
        delete person.birthDate;
        runXmlFormatParseTest([{name: "Test Class", length: 2300, competitors: [person]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results.length, 1, "One competitor should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.yearOfBirth, null);
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with an invalid year of birth, ignoring it", function (assert) {
        var person = getPerson();
        person.birthDate = "This is not a valid birth date";
        runXmlFormatParseTest([{name: "Test Class", length: 2300, competitors: [person]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results.length, 1, "One competitor should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.yearOfBirth, null);
            });
    });
    
    QUnit.test("Can parse a string that contains a female competitor", function (assert) {
        var person = getPerson();
        person.gender = "F";
        runXmlFormatParseTest([{name: "Test Class", length: 2300, competitors: [person]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results.length, 1, "One competitor should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.gender, "F");
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with no gender specified", function (assert) {
        var person = getPerson();
        delete person.gender;
        runXmlFormatParseTest([{name: "Test Class", length: 2300, competitors: [person]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results.length, 1, "One competitor should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.gender, null);
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with an invalid gender, ignoring it", function (assert) {
        var person = getPerson();
        person.gender = "This is not a valid gender";
        runXmlFormatParseTest([{name: "Test Class", length: 2300, competitors: [person]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results.length, 1, "One competitor should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.gender, null);
            });
    });
    
    QUnit.test("Can parse with warnings a string that contains a competitor with no Result", function (assert) {
        var person = getPerson();
        delete person.result;
        runXmlFormatParseTest(
            [{name: "Test Class", length: 2300, courseId: 1, competitors: [person]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued");
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with missing start time", function (assert) {
        var person = getPerson();
        delete person.startTime;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.startTime, null);
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with invalid start time", function (assert) {
        var person = getPerson();
        person.startTime = null;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.startTime, null);
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with start time using ISO 8601 basic formatting", function (assert) {
        var person = getPerson();
        person.startTimeBasic = true;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.startTime, person.startTime);
            },
            {formatters: [Version3Formatter]});
    });
    
    QUnit.test("Can parse a string that contains a competitor with start time without seconds", function (assert) {
        var person = getPerson();
        person.startTimeNoSeconds = true;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.startTime, person.startTime - (person.startTime % 60));
            },
            {formatters: [Version3Formatter]});
    });
    
    QUnit.test("Can parse a string that contains a competitor with missing total time", function (assert) {
        var person = getPerson();
        delete person.totalTime;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.totalTime, null);
                assert.ok(!result.completed());
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with invalid total time", function (assert) {
        var person = getPerson();
        person.totalTime = null;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.totalTime, null);
                assert.ok(!result.completed());
            });
    });
    
    QUnit.test("Can parse a string that contains a competitor with fractional seconds to controls", function (assert) {
        var person = getPerson();
        person.cumTimes = [65.7, 65.7 + 221.4, 65.7 + 221.4 + 184.6];
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0].concat(person.cumTimes).concat(person.totalTime));
            },
            {formatters: [Version3Formatter]});
    });
    
    QUnit.test("Can parse a string that contains a course with no length", function (assert) {
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", competitors: [getPerson()]}],
            function (course) {
                assert.strictEqual(course.length, null);
            });
    });
    
    QUnit.test("Can parse with warnings a string that contains an invalid course length", function (assert) {
        runXmlFormatParseTest(
            [{name: "Test Class", length: "This is not a valid number", competitors: [getPerson()]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatterName);
                assert.strictEqual(eventData.courses[0].length, null, "No course length should have been read - " + formatterName);
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued");
            });
    });
    
    QUnit.test("Can parse a string that contains a course length specified in metres", function (assert) {
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", length: 2300, courseId: 1, lengthUnit: "m", competitors: [getPerson()]}],
            function (course) {
                assert.strictEqual(course.length, 2.3);
            },
            {formatters: [Version2Formatter]});
    });
    
    QUnit.test("Can parse a string that contains a course length specified in kilometres", function (assert) {
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", length: 2.3, lengthUnit: "km", courseId: 1, competitors: [getPerson()]}],
            function (course) {
                assert.strictEqual(course.length, 2.3);
            },
            {formatters: [Version2Formatter]});
    });
    
    QUnit.test("Can parse a string that contains a course length specified in feet", function (assert) {
        var courseLength = 10176;
        var expectedLengthKm = courseLength / FEET_PER_KILOMETRE;
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", length: courseLength, lengthUnit: "ft", courseId: 1, competitors: [getPerson()]}],
            function (course) {
                assert.ok(Math.abs(expectedLengthKm - course.length) < 1e-7, "Expected length: " + expectedLengthKm + ", actual: " + course.length);
            },
            {formatters: [Version2Formatter]});
    });
    
    QUnit.test("Can parse with warnings a string that contains an unrecognised course length unit", function (assert) {
        runXmlFormatParseTest(
            [{name: "Test Class", length: "100", lengthUnit: "furlong", competitors: [getPerson()]}],
            function (eventData) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read");
                assert.strictEqual(eventData.courses[0].length, null, "No course length should have been read");
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued");
            },
            {formatters: [Version2Formatter]});
    });
    
    QUnit.test("Can parse a string that contains a course climb", function (assert) {
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", length: 2300, climb: 105, courseId: 1, competitors: [getPerson()]}],
            function (course) {
                assert.strictEqual(course.climb, 105);
            },
            {formatters: [Version3Formatter]});
    });
    
    QUnit.test("Can parse a string that contains a non-competitive competitor", function (assert) {
        var person = getPerson();
        person.competitive = false;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.isNonCompetitive, true);        
            });
    });
    
    QUnit.test("Can parse a string that contains a non-starting competitor", function (assert) {
        var person = getPerson();
        person.nonStarter = true;
        person.cumTimes = [null, null, null];
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.isNonStarter, true);        
                assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0, null, null, null, null]);
            });
    });
    
    QUnit.test("Can parse a string that contains a non-finishing competitor", function (assert) {
        var person = getPerson();
        person.nonFinisher = true;
        person.cumTimes[2] = null;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.isNonFinisher, true);        
            });
    });
    
    QUnit.test("Can parse a string that contains a disqualified competitor", function (assert) {
        var person = getPerson();
        person.disqualified = true;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.isDisqualified, true);        
            });
    });
    
    QUnit.test("Can parse a string that contains an over-max-time competitor", function (assert) {
        var person = getPerson();
        person.overMaxTime = true;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.isOverMaxTime, true);        
            });
    });
    
    QUnit.test("Can parse a string that contains an competitor that is OK despite missing times", function (assert) {
        var person = getPerson();
        person.cumTimes[1] = null;
        person.okDespiteMissingTimes = true;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.strictEqual(result.isOKDespiteMissingTimes, true);        
            });
    });
    
    QUnit.test("Can parse a string that uses alternative element name for control codes", function (assert) {
        var person = getPerson();
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", length: 2300, courseId: 1, competitors: [person]}],
            function (course) {
                assert.deepEqual(course.controls, person.controls);
            },
            {
                preprocessor: function (xml) {
                    return xml.replace(/<ControlCode>/g, "<Control><ControlCode>")
                              .replace(/<\/ControlCode>/g, "</ControlCode></Control>");
                },
                formatters: [Version2Formatter]
            });
    });
    
    QUnit.test("Can parse a string that uses separate course names", function (assert) {
        var person = getPerson();
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", courseName: "Test Course", length: 2300, courseId: 1, competitors: [person]}],
            function (course) {
                assert.deepEqual(course.name, "Test Course");
            },
            {formatters: [Version3Formatter]});
    });
    
    QUnit.test("Cannot parse a string that contains a competitor with a split with a missing control code", function (assert) {
        var person = getPerson();      
        runFailingXmlFormatParseTest(assert, [{name: "Test Class", length: 2300, courseId: 1, competitors: [person]}],
            {preprocessor: function (xml) { return xml.replace('<ControlCode>' + person.controls[1] + '</ControlCode>', ''); }}); 
    });
    
    QUnit.test("Can parse a string that contains a competitor with an additional control, ignoring the additional control", function (assert) {
        var person = getPerson();
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", courseName: "Test Course", length: 2300, courseId: 1, competitors: [person]}],
            function (course) {
                assert.strictEqual(course.classes.length, 1);
                assert.strictEqual(course.classes[0].numControls, 3);
            },
            {preprocessor: function (xml) { return xml.replace(/<\/Result>/, '<SplitTime status="Additional"><ControlCode>987</ControlCode><Time>234</Time></SplitTime></Result>'); },
             formatters: [Version3Formatter]});
    });
    
    QUnit.test("Can parse a string that contains a competitor with a split with a missing time", function (assert) {
        var person = getPerson();      
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", length: 2300, courseId: 1, competitors: [person]}],
            function (course) {
                assert.strictEqual(course.classes.length, 1);
                assert.strictEqual(course.classes[0].numControls, 3);
            },
            {preprocessor: function (xml) {
                var timeRegex = /<Time>[^<]+<\/Time>/g;
                timeRegex.exec(xml); // Skip the first match.
                var secondMatch = timeRegex.exec(xml)[0];
                return xml.replace(secondMatch, '');
            }}); 
    });
    
    QUnit.test("Can parse a string that contains a competitor with their total time wrapped in a Clock element.", function (assert) {
        var person = getPerson();      
        runSingleCourseXmlFormatParseTest(assert, [{name: "Test Class", length: 2300, courseId: 1, competitors: [person]}],
            function (course) {
                assert.strictEqual(course.classes.length, 1);
                assert.strictEqual(course.classes[0].results.length, 1);
                assert.strictEqual(course.classes[0].results[0].totalTime, person.totalTime, "Should read competitor's total time");
            },
            {preprocessor: function (xml) {
                var timeRegex = /<Time>[^<]+<\/Time>/g;
                var firstMatch = timeRegex.exec(xml)[0];
                var firstMatchTime = firstMatch.substring(6, firstMatch.length - 7);
                xml = xml.replace(firstMatch, '<Time>\r\n<Clock>' + firstMatchTime + '</Clock>\r\n</Time>' );
                return xml;
            },
            formatters: [Version2Formatter]});
    });
    
    QUnit.test("Can parse a string that contains a competitor that mispunched a control", function (assert) {
        var person = getPerson();
        person.cumTimes[1] = null;
        runSingleCompetitorXmlFormatParseTest(assert, {name: "Test Class", length: 2300, courseId: 1, competitors: [person]},
            function (result) {
                assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0].concat(person.cumTimes).concat([person.totalTime]));
                assert.ok(!result.completed());
            });
    });
    
    QUnit.test("Cannot parse a string that contains a class with two competitors with different numbers of controls", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Second";
        person2.surname = "Runner";
        person2.controls.push("199");
        person2.cumTimes.push(person2.cumTimes[2] + 177);
        person2.totalTime = person2.cumTimes[2] + 177 + 94;
        
        runXmlFormatParseTest(
            [{name: "Test Class", length: 2300, courseId: 1, competitors: [person1, person2]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results.length, 1, "One competitor should have been read - " + formatterName);
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued - " + formatterName);
                assert.ok(eventData.warnings[0].match(/number of controls/));
            }
        );
    });
    
    QUnit.test("Can parse a string that contains a class with one competitor whose number of controls matches that specified by the course", function (assert) {
        var person = getPerson();
        runSingleCompetitorXmlFormatParseTest(
            assert,
            {name: "Test Class", length: 2300, courseId: 1, numberOfControls: person.controls.length, competitors: [person]},
            // In this test we only really want to be sure that the
            // competitor was read without the number-of-controls
            // validation firing.  So there aren't any assertions we really
            // need to run.
            function () { /* empty */ },
            {formatters: [Version3Formatter]}
        );
    });
    
    QUnit.test("Can parse with warnings a string that contains a class with one competitor whose number of controls doesn't match that specified by the course", function (assert) {
        var person = getPerson();
        runXmlFormatParseTest(
            [{name: "Test Class", length: 2300, courseId: 1, numberOfControls: person.controls.length + 2, competitors: [person]}],
            function (eventData) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read");
                assert.strictEqual(eventData.classes[0].results.length, 0, "No competitors should have been read");
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued");
            },
            {formatters: [Version3Formatter]}
        );
    });
    
    QUnit.test("Can parse with warnings a string that contains one class with two competitors having different control codes", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Second";
        person2.surname = "Runner";
        person2.controls[1] += "9";
        
        runXmlFormatParseTest(
            [{name: "Test Class 1", length: 2300, competitors: [person1, person2]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - "  + formatterName);
                assert.strictEqual(eventData.classes[0].results.length, 1, "One competitor should have been read - " + formatterName);
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string that contains two classes nominally the same course each with one competitor but with different controls as two separate courses", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Second";
        person2.surname = "Runner";
        person2.controls[1] += "9";
       
        var classes = [
            {name: "Test Class 1", length: 2300, courseId: 1, competitors: [person1]},
            {name: "Test Class 2", length: 2300, courseId: 1, competitors: [person2]}
        ];
        
        runXmlFormatParseTest(classes,
            function (eventData) {
                assert.strictEqual(eventData.courses.length, 2, "Should read the classes' courses as separate");
            },        
            {formatters: [Version3Formatter]}
        );
    });    
    
    QUnit.test("Cannot parse a string that contains two classes using the same course each with one competitor but with different numbers of controls", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Second";
        person2.surname = "Runner";
        person2.controls.push("199");
        person2.cumTimes.push(person2.cumTimes[2] + 177);
        person2.totalTime = person2.cumTimes[2] + 177 + 94;
        
        var classes = [
            {name: "Test Class 1", length: 2300, courseId: 1, competitors: [person1]},
            {name: "Test Class 2", length: 2300, courseId: 1, competitors: [person2]}
        ];
    
        runXmlFormatParseTest(classes,
            function (eventData) {
                assert.strictEqual(eventData.courses.length, 2, "Should read the classes' courses as separate");
            },        
            {formatters: [Version3Formatter]}
        );
    });

    QUnit.test("Can parse a string that contains two classes each with one competitor", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Second";
        person2.surname = "Runner";
        person2.controls.push("199");
        person2.cumTimes.push(person2.cumTimes[2] + 177);
        person2.totalTime = person2.cumTimes[2] + 177 + 94;
        
        var persons = [person1, person2];
        var classes = [
            {name: "Test Class 1", length: 2300, courseId: 1, competitors: [person1]},
            {name: "Test Class 2", length: 2300, courseId: 2, competitors: [person2]}
        ];
        
        runXmlFormatParseTest(classes,
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 2, "Expected two classes - " + formatterName);
                assert.strictEqual(eventData.courses.length, 2, "Expected two courses - " + formatterName);
                
                if (eventData.classes.length === 2 && eventData.courses.length === 2) {
                    for (var i = 0; i < 2; i += 1) {
                        assert.deepEqual(eventData.classes[i].course, eventData.courses[i]);
                        assert.deepEqual(eventData.courses[i].classes, [eventData.classes[i]]);
                        assert.strictEqual(eventData.classes[i].results.length, 1);
                        assert.deepEqual(eventData.classes[i].results[0].owner.name, persons[i].forename + " " + persons[i].surname);
                    }
                }
            });
    });
    
    QUnit.test("Can parse a string that contains two classes each with one competitor, both on the same course", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Second";
        person2.surname = "Runner";
        
        var persons = [person1, person2];
        var classes = [
            {name: "Test Class 1", length: 2300, courseId: 1, competitors: [person1]},
            {name: "Test Class 2", length: 2300, courseId: 1, competitors: [person2]}
        ];
        
        runXmlFormatParseTest(classes,
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 2, "Expected two classes - " + formatterName);
                assert.strictEqual(eventData.courses.length, 1, "Expected one course - " + formatterName);
                
                if (eventData.classes.length === 2 && eventData.courses.length === 1) {
                    for (var i = 0; i < 2; i += 1) {
                        assert.deepEqual(eventData.classes[i].course, eventData.courses[0]);
                        assert.strictEqual(eventData.classes[i].results.length, 1);
                        assert.deepEqual(eventData.classes[i].results[0].owner.name, persons[i].forename + " " + persons[i].surname);
                    }
                    assert.deepEqual(eventData.courses[0].classes, eventData.classes);
                }
            },
            {formatters: [Version3Formatter]});
    });
    
    QUnit.test("Can parse a string that contains two classes each with one competitor, deducing that the courses are the same using control codes", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Second";
        person2.surname = "Runner";
        
        var classes = [
            {name: "Test Class 1", length: 2300, competitors: [person1]},
            {name: "Test Class 2", length: 2300, competitors: [person2]}
        ];
        
        runXmlFormatParseTest(classes,
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 2, "Expected two classes - " + formatterName);
                assert.strictEqual(eventData.courses.length, 1, "Expected one course - " + formatterName);
                if (eventData.classes.length === 2 && eventData.courses.length === 1) {
                    assert.deepEqual(eventData.courses[0].classes, eventData.classes);
                }
            });
    });
    
    QUnit.test("Can parse a string that contains two classes each with one competitor and no controls, without deducing that the courses are the same", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Second";
        person2.surname = "Runner";
        [person1, person2].forEach(function (person) {
            person.totalTime = 100;
            person.controls = [];
            person.cumTimes = [];
        });
        
        var classes = [
            {name: "Test Class 1", length: 2300, competitors: [person1]},
            {name: "Test Class 2", length: 2300, competitors: [person2]}
        ];
        
        runXmlFormatParseTest(classes,
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 2, "Expected two classes - " + formatterName);
                assert.strictEqual(eventData.courses.length, 2, "Expected two courses - " + formatterName);
            });
    });
    
    QUnit.test("Can parse with no warnings a string that contains a normal competitor and a non-starting competitor with no controls", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Non";
        person2.surname = "Starter";
        person2.controls = [];
        person2.cumTimes = [];
        person2.nonStarter = true;
        
        runXmlFormatParseTest(
            [{name: "Test Class", length: 2300, courseId: 1, competitors: [person1, person2]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                assert.strictEqual(eventData.classes[0].results.length, 2, "Two competitors should have been read - " + formatterName);
                assert.strictEqual(eventData.warnings.length, 0, "No warning should have been issued: " + eventData.warnings[0]);
            });
    });
    
    QUnit.test("Can parse with no warnings a string that contains only a non-starting competitor with no controls", function (assert) {
        var person = getPerson();
        person.controls = [];
        person.cumTimes = [];
        person.nonStarter = true;
        
        runXmlFormatParseTest(
            [{name: "Test Class", length: 2300, courseId: 1, competitors: [person]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    var courseClass = eventData.classes[0];
                    assert.strictEqual(courseClass.results.length, 1, "One competitor should have been read - " + formatterName);
                    assert.strictEqual(courseClass.numControls, 0);
                    assert.strictEqual(eventData.warnings.length, 0, "No warning should have been issued: " + eventData.warnings[0]);
                }
            });
    });    
    
    QUnit.test("Can parse a string that has a single class with no teams", function (assert) {
        runXmlFormatParseTest([{name: "Test Class", length: 2300, courseId: 1, teams: []}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 0, "No classes should have been read - " + formatterName);
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string that has a single class with a single team", function (assert) {
        var className = "Test Class";
        var team = getTeam();

        runXmlFormatParseTest([{name: className, teams: [team]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    var courseClass = eventData.classes[0];
                    assert.strictEqual(courseClass.name, className);
                    assert.strictEqual(courseClass.results.length, 1, "One result should have been read - " + formatterName);
                    assert.strictEqual(courseClass.numControls, 7); // 3 numbered controls for each competitor plus 1 for the intermediate finish.
                    assert.ok(courseClass.isTeamClass, "Course-class should be marked as a team class");
                    
                    if (courseClass.results.length === 1) {
                        var result = courseClass.results[0];
                        assert.strictEqual(result.owner.name, "TestTeam");
                        assert.strictEqual(result.owner.club, team.club);
                        assert.strictEqual(result.startTime, team.members[0].startTime);
                        assert.strictEqual(result.totalTime, team.members[0].totalTime + team.members[1].totalTime);
                        var expectedCumulativeTimes = [0].concat(team.members[0].cumTimes).concat([team.members[0].totalTime]).concat(team.members[1].cumTimes.map(function (time) { return team.members[0].totalTime + time; })).concat(result.totalTime);
                        assert.deepEqual(result.getAllOriginalCumulativeTimes(), expectedCumulativeTimes);
                        assert.ok(result.completed());
                        assert.ok(!result.isNonCompetitive);
                    }
                
                    assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatterName);
                    if (eventData.courses.length > 0) {
                        var course = eventData.courses[0];
                        assert.strictEqual(course.name, className);
                        assert.strictEqual(course.controls, null);
                        
                        assert.deepEqual(course.classes, [courseClass]);
                        assert.strictEqual(courseClass.course, course);
                    }
                }
                
                assert.deepEqual(eventData.warnings, [], "No warnings should have been issued - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string that has a single class with a single empty team, generating a warning for the empty team", function (assert) {
        var emptyTeam = {name: "EmptyTeam", club: "EmptyName", members: []};

        runXmlFormatParseTest([{name: "Test Class", teams: [emptyTeam]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    assert.strictEqual(eventData.classes[0].results.length, 0, "No results should have been read - " + formatterName);
                }
                
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued for the empty team - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string that has a single class with a single empty team, generating a warning for the empty team", function (assert) {
        var singletonTeam = getTeam();
        singletonTeam.members.pop();

        runXmlFormatParseTest([{name: "Test Class", teams: [singletonTeam]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    assert.strictEqual(eventData.classes[0].results.length, 0, "No results should have been read - " + formatterName);
                }
                
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued for the singleton team - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string that has a single class with a single team and an empty team, generating a warning for the empty team", function (assert) {
        var team = getTeam();
        var emptyTeam = {name: "EmptyTeam", club: "EmptyName", members: []};

        runXmlFormatParseTest([{name: "Test Class", teams: [team, emptyTeam]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    assert.strictEqual(eventData.classes[0].results.length, 1, "One result should have been read - " + formatterName);
                }
                
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued for the empty team - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string that has a single class with a single two-person team and a one-person team, generating a warning for the one-person team", function (assert) {
        var team = getTeam();
        var shortTeam = {name: "ShortTeam", club: "ShortName", members: [getPerson()]};

        runXmlFormatParseTest([{name: "Test Class", teams: [team, shortTeam]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    assert.strictEqual(eventData.classes[0].results.length, 1, "One result should have been read - " + formatterName);
                }
                
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued for the one-person team - " + formatterName);
            });
    });
    
    QUnit.test("Parsing a string that has a single class with a single team with the second team member not starting at the same time the first one finishes generates a warning only", function (assert) {
        var team = getTeam();
        team.members[1].startTime += 10;

        runXmlFormatParseTest([{name: "Test Class", teams: [team]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    assert.strictEqual(eventData.classes[0].results.length, 0, "One result should have been read - " + formatterName);
                }
                
                assert.strictEqual(eventData.warnings.length, 1, "One warning should have been issued for the team with a starter not at the same time as the previous finisher - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string containing two results with different controls", function (assert) {
        var team1 = getTeam();
        
        var team2 = getTeam();
        team2.name += " 2";
        for (var memberIndex = 0; memberIndex < 2; memberIndex += 1) {
            team2.members[memberIndex].surname += " 2";
            team2.members[memberIndex].startTime += 100;
            team2.members[memberIndex].finishTime += 100;
            team2.members[memberIndex].controls.reverse();
        }

        runXmlFormatParseTest([{name: "Test Class", teams: [team1, team2]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    assert.strictEqual(eventData.classes[0].results.length, 2, "Two results should have been read - " + formatterName);
                }
                
                assert.deepEqual(eventData.warnings, [], "No warnings should have been issued - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string containing two results with different numbers of controls, rejecting the second row", function (assert) {
        var team1 = getTeam();
        var team2 = getTeam();
        team2.name += " 2";
        for (var memberIndex = 0; memberIndex < 2; memberIndex += 1) {
            team2.members[memberIndex].surname += " 2";
            team2.members[memberIndex].startTime += 100;
            team2.members[memberIndex].finishTime += 100;
        }
        
        team2.members[1].controls.pop();
        team2.members[1].cumTimes.pop();

        runXmlFormatParseTest([{name: "Test Class", teams: [team1, team2]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatterName);
                if (eventData.classes.length === 1) {
                    assert.strictEqual(eventData.classes[0].results.length, 1, "One result should have been read - " + formatterName);
                }
                
                assert.deepEqual(eventData.warnings.length, 1, "One warning should have been issued for the team with a missing control - " + formatterName);
            });
    });
    
    QUnit.test("Cannot parse a string containing a class with an individual result and a team result", function (assert) {
        runXmlFormatParseTest([{name: "Test Class", competitors: [getPerson()], teams: [getTeam()]}],
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 0, "No class should have been read - " + formatterName);
                assert.deepEqual(eventData.warnings.length, 1, "One warning should have been issued for the class with inconsistent results - " + formatterName);
            });
    });
    
    QUnit.test("Can parse a string containing an individual class and a team class", function (assert) {
        var classData = [
            {name: "Individual Class", competitors: [getPerson()]},
            {name: "Team Class", teams: [getTeam()]}
        ];
        runXmlFormatParseTest(classData,
            function (eventData, formatterName) {
                assert.strictEqual(eventData.classes.length, 2, "Two classes should have been read - " + formatterName);
                if (eventData.classes.length === 2) {
                    assert.strictEqual(eventData.classes[0].results.length, 1, "One result should have been read in the individual class - " + formatterName);
                    assert.strictEqual(eventData.classes[0].name, classData[0].name, "Individual class should have correct name - " + formatterName);
                    assert.strictEqual(eventData.classes[1].results.length, 1, "One result should have been read in the relay class - " + formatterName);
                    assert.strictEqual(eventData.classes[1].name, classData[1].name, "R class should have correct name - " + formatterName);
                }
                
                assert.deepEqual(eventData.warnings, [], "No warnings should have been issued - " + formatterName);
            });
    });
})();