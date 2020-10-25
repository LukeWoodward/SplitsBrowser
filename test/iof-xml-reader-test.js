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

    const formatTime = SplitsBrowser.formatTime;
    const parseEventData = SplitsBrowser.Input.IOFXml.parseEventData;

    // The number of feet per kilometre.
    const FEET_PER_KILOMETRE = 3280;

    const V2_HEADER = '<?xml version="1.0" ?>\n<!DOCTYPE ResultList SYSTEM "IOFdata.dtd">\n';

    const V3_HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n<ResultList xmlns="http://www.orienteering.org/datastandard/3.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" iofVersion="3.0">\n';

    QUnit.module("Input.IOFXml");

    /**
     * Returns a person map with values for the forename, surname, club, startTime,
     * totalTime, courseLength, controls and cumTimes keys.
     * @return {Map} Person map.
     */
    function getPerson() {
        return new Map([
            ["forename", "First"],
            ["surname", "Runner"],
            ["club", "TestClub"],
            ["gender", "M"],
            ["birthDate", "1976-04-11"],
            ["startTime", 10 * 3600 + 11 * 60 + 37],
            ["finishTime", 10 * 3600 + 21 * 60 + 7],
            ["totalTime", 65 + 221 + 184 + 100],
            ["controls", ["182", "148", "167"]],
            ["cumTimes", [65, 65 + 221, 65 + 221 + 184]],
            ["result", true]
        ]);
    }

    function getTeam() {
        let teamMember1 = getPerson();
        let teamMember2 = new Map([
            ["forename", "Second"],
            ["surname", "Runner"],
            ["club", "TestClub"],
            ["gender", "M"],
            ["birthDate", "1978-08-18"],
            ["startTime", 10 * 3600 + 21 * 60 + 7],
            ["finishTime", 10 * 3600 + 29 * 60 + 53],
            ["totalTime", 61 + 193 + 176 + 103],
            ["controls", ["183", "149", "167"]],
            ["cumTimes", [61, 61 + 193, 65 + 193 + 176]],
            ["result", true]
        ]);

        return new Map([["name", "TestTeam"], ["club", "TeamClubName"], ["members", [teamMember1, teamMember2]]]);
    }

    // In all of the following XML generation functions, it is assumed that the
    // input argument contains no characters that are interpreted by XML, such
    // as < > & " '.  This is only test code; we assume those writing these
    // tests are smart enough to know not to do this.

    let Version2Formatter = {
        name: "version 2.0.3",
        header: `${V2_HEADER}\n<ResultList>\n<IOFVersion version="2.0.3" />\n`
    };

    /**
     * Returns a chunk of XML that contains a class name.
     * @param {String} className The name of the class.
     * @return {String} XML string containing the class name.
     */
    Version2Formatter.getClassXml = className => `<ClassShortName>${className}</ClassShortName>\n`;

    /**
     * Returns a chunk of XML that contains course details.
     * This formatter does not support course details, so this function returns
     * an empty string.
     * @return {String} An empty string.
     */
    Version2Formatter.getCourseXml = () => "";

    /**
     * Returns a chunk of XML that contains club details.
     * @param {Map} resultData The person or team data
     * @return {String} Generated XML string.
     */
    Version2Formatter.getClubXml = resultData => {
        if (resultData.has("club")) {
            return `<Club><ShortName>${resultData.get("club")}</ShortName></Club>\n`;
        } else if (resultData.has("clubFull")) {
            return `<Club><Name>${resultData.get("clubFull")}</Name></Club>\n`;
        } else {
            return "";
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
     * @param {Map} personData The person data.
     * @param {Map} classData The class data.
     * @return {String} Generated XML string.
     */
    Version2Formatter.getPersonResultXml = (personData, classData) => {
        if (!personData.has("controls") || !personData.has("cumTimes")) {
            throw new Error("controls and cumTimes must both be specified");
        }

        if (personData.get("controls").length !== personData.get("cumTimes").length) {
            throw new Error("Controls and cumulative times have different lengths");
        }

        let personNameXml = "";
        if (personData.has("forename") || personData.has("surname")) {
            personNameXml = "<Person";
            if (personData.has("gender")) {
                personNameXml += ` sex="${personData.get("gender")}"`;
            }

            personNameXml += "><PersonName>\n";
            if (personData.has("forename")) {
                personNameXml += `<Given>${personData.get("forename")}</Given>\n`;
            }
            if (personData.has("surname")) {
                personNameXml += `<Family>${personData.get("surname")}</Family>\n`;
            }
            personNameXml += "</PersonName>";

            if (personData.has("birthDate")) {
                personNameXml += `<BirthDate><Date>${personData.get("birthDate")}</Date></BirthDate>\n`;
            }

            personNameXml += "</Person>\n";
        }

        let clubXml = Version2Formatter.getClubXml(personData);

        let startTimeXml = (personData.has("startTime")) ? `<StartTime><Clock>${formatTime(personData.get("startTime"))}</Clock></StartTime>\n` : "";
        let finishTimeXml = (personData.has("finishTime")) ? `<FinishTime><Clock>${formatTime(personData.get("finishTime"))}</Clock></FinishTime>\n` : "";
        let totalTimeXml = (personData.has("totalTime")) ? `<Time>${formatTime(personData.get("totalTime"))}</Time>\n` : "";

        let status;
        if (personData.has("okDespiteMissingTimes")) {
            status = "OK";
        } else if (personData.has("nonStarter")) {
            status = "DidNotStart";
        } else if (personData.has("nonFinisher")) {
            status = "DidNotFinish";
        } else if (personData.has("disqualified")) {
            status = "Disqualified";
        } else if (personData.has("overMaxTime")) {
            status = "OverTime";
        } else if (personData.get("cumTimes").includes(null)) {
            status = "MisPunch";
        } else if (!personData.has("competitive") || personData.get("competitive")) {
            status = "OK";
        } else {
            status = "NotCompeting";
        }

        let statusXml = `<CompetitorStatus value="${status}" />\n`;

        let courseLengthXml = "";
        if (classData.has("length")) {
            if (classData.has("lengthUnit")) {
                courseLengthXml = `<CourseLength unit="${classData.get("lengthUnit")}">${classData.get("length")}</CourseLength>\n`;
            } else {
                courseLengthXml = `<CourseLength>${classData.get("length")}</CourseLength>\n`;
            }
        }

        let splitTimesXmls = [];
        for (let index = 0; index < personData.get("cumTimes").length; index += 1) {
            splitTimesXmls.push(`<SplitTime><ControlCode>${personData.get("controls")[index]}</ControlCode><Time>${formatTime(personData.get("cumTimes")[index])}</Time></SplitTime>\n`);
        }

        let resultXml = personData.has("result") ? "<Result>" + startTimeXml + finishTimeXml + totalTimeXml + statusXml + courseLengthXml + splitTimesXmls.join("") + "</Result>\n" : "";

        return "<PersonResult>" + personNameXml + clubXml + resultXml + "</PersonResult>\n";
    };

    /**
     * Generates some XML for a team name.
     * @param {String} name The name of the team.
     * @return {String} Generated XML string.
     */
    Version2Formatter.getTeamNameXml = name => `<TeamName>${name}</TeamName>`;

    /**
     * Generates some XML for a team member result.
     *
     * For IOF XML v2 the format is identical to that for a PersonResult.
     *
     * @param {Map} personData The person data.
     * @param {Map} classData The class data.
     * @return {String} Generated XML string.
     */
    Version2Formatter.getTeamMemberResultXml = (personData, classData) => Version2Formatter.getPersonResultXml(personData, classData);

    /**
     * Zero-pads the given value to two digits.
     * @param {Number} value The value to pad.
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
     * @param {Number} time The time to format.
     * @return {String} The formatted date.
     */
    function formatStartOrFinishTime(time) {
        return `2014-06-07T${hours(time)}:${minutes(time)}:${seconds(time)}.000+01:00`;
    }

    /**
     * Formats a start or finish time as an ISO-8601 date, but ending after the
     * minutes.
     * @param {Number} time The time to format.
     * @return {String} The formatted date.
     */
    function formatStartOrFinishTimeNoSeconds (time) {
        return `2014-06-07T${hours(time)}:${minutes(time)}`;
    }

    /**
     * Formats a start or finish time as a 'basic' ISO-8601 date, i.e. one
     * without all of the separating characters.
     * @param {Number} time The time to format.
     * @return {String} The formatted date.
     */
    function formatStartOrFinishTimeBasic (time) {
        return `20140607${hours(time)}${minutes(time)}${seconds(time)}`;
    }

    let Version3Formatter = {
        name: "version 3.0",
        header: `${V3_HEADER}<Event><Name>Test event name</Name></Event>\n`
    };

    /**
     * Returns a chunk of XML that contains a class name.
     * @param {String} className The name of the class.
     * @return {String} XML string containing the class name.
     */
    Version3Formatter.getClassXml = className => `<Class><Name>${className}</Name></Class>\n`;

    /**
     * Returns a chunk of XML that contains course details.
     * @param {Map} class_ Map containing class data.
     * @return {String} XML string.
     */
    Version3Formatter.getCourseXml = class_ => {
        let xml = "<Course>\n";
        if (class_.has("courseId")) {
            xml += `<Id>${class_.get("courseId")}</Id>\n`;
        }

        if (class_.has("courseName")) {
            xml += `<Name>${class_.get("courseName")}</Name>\n`;
        } else if (class_.has("name")) {
            xml += `<Name>${class_.get("name")}</Name>\n`;
        }

        if (class_.get("length")) {
            xml += `<Length>${class_.get("length")}</Length>\n`;
        }

        if (class_.get("climb")) {
            xml += `<Climb>${class_.get("climb")}</Climb>\n`;
        }

        if (class_.get("numberOfControls")) {
            xml += `<NumberOfControls>${class_.get("numberOfControls")}</NumberOfControls>\n`;
        }

        xml += "</Course>\n";

        return xml;
    };

    /**
     * Returns a chunk of XML that contains club details.
     * @param {Map} resultData The person or team data
     * @return {String} Generated XML string.
     */
    Version3Formatter.getClubXml = resultData => {
        if (resultData.has("club")) {
            return `<Organisation><ShortName>${resultData.get("club")}</ShortName></Organisation>\n`;
        } else if (resultData.has("clubFull")) {
            return `<Organisation><Name>${resultData.get("clubFull")}</Name></Organisation>\n`;
        } else {
            return "";
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
     * @param {Map} personData The person data.
     * @param {String} elementName The name of the root element.
     * @return {String} Generated XML string.
     */
    Version3Formatter.getIndividualResultXml = (personData, elementName) => {
        if (!personData.has("controls") || !personData.has("cumTimes")) {
            throw new Error("controls and cumTimes must both be specified");
        }

        if (personData.get("controls").length !== personData.get("cumTimes").length) {
            throw new Error("Controls and cumulative times have different lengths");
        }

        let personNameXml = "";
        if (personData.has("forename") || personData.has("surname")) {
            personNameXml = "<Person";

            if (personData.has("gender")) {
                personNameXml += ` sex="${personData.get("gender")}"`;
            }

            personNameXml += "><Name>\n";

            if (personData.has("forename")) {
                personNameXml += `<Given>${personData.get("forename")}</Given>\n`;
            }
            if (personData.has("surname")) {
                personNameXml += `<Family>${personData.get("surname")}</Family>\n`;
            }

            personNameXml += "</Name>";

            if (personData.has("birthDate")) {
                personNameXml += `<BirthDate>${personData.get("birthDate")}</BirthDate>\n`;
            }

            personNameXml += "</Person>\n";
        }

        let startTimeStr;
        if (personData.get("startTime") === null) {
            startTimeStr = "";
        } else if (personData.has("startTimeBasic")) {
            startTimeStr = formatStartOrFinishTimeBasic(personData.get("startTime"));
        } else if (personData.has("startTimeNoSeconds")) {
            startTimeStr = formatStartOrFinishTimeNoSeconds(personData.get("startTime"));
        } else {
            startTimeStr = formatStartOrFinishTime(personData.get("startTime"));
        }

        let finishTimeStr;
        if (personData.get("finishTime") === null) {
            finishTimeStr = "";
        } else if (personData.has("finishTimeBasic")) {
            finishTimeStr = formatStartOrFinishTimeBasic(personData.get("finishTime"));
        } else if (personData.has("finishTimeNoSeconds")) {
            finishTimeStr = formatStartOrFinishTimeNoSeconds(personData.get("finishTime"));
        } else {
            finishTimeStr = formatStartOrFinishTime(personData.get("finishTime"));
        }

        let clubXml = Version3Formatter.getClubXml(personData);

        let startTimeXml = (personData.has("startTime")) ? `<StartTime>${startTimeStr}</StartTime>\n` : "";
        let finishTimeXml = (personData.has("finishTime")) ? `<FinishTime>${finishTimeStr}</FinishTime>\n` : "";
        let totalTimeXml = (personData.has("totalTime")) ? `<Time>${personData.get("totalTime")}</Time>` : "";

        let status;
        if (personData.has("okDespiteMissingTimes")) {
            status = "OK";
        } else if (personData.has("nonStarter")) {
            status = "DidNotStart";
        } else if (personData.has("nonFinisher")) {
            status = "DidNotFinish";
        } else if (personData.has("disqualified")) {
            status = "Disqualified";
        } else if (personData.has("overMaxTime")) {
            status = "OverTime";
        } else if (personData.get("cumTimes").includes(null)) {
            status = "MissingPunch";
        } else if (!personData.has("competitive") || personData.get("competitive")) {
            status = "OK";
        } else {
            status = "NotCompeting";
        }

        let statusXml = `<Status>${status}</Status>\n`;

        let splitTimesXmls = [];
        for (let index = 0; index < personData.get("cumTimes").length; index += 1) {
            let time = personData.get("cumTimes")[index];
            if (time === null) {
                splitTimesXmls.push(`<SplitTime status="Missing"><ControlCode>${personData.get("controls")[index]}</ControlCode></SplitTime>\n`);
            } else {
                splitTimesXmls.push(`<SplitTime><ControlCode>${personData.get("controls")[index]}</ControlCode><Time>${time}</Time></SplitTime>\n`);
            }
        }

        let resultXml = personData.has("result") ? `<Result>${startTimeXml}${finishTimeXml}${totalTimeXml}${statusXml}${splitTimesXmls.join("")}</Result>\n` : "";

        return `<${elementName}>${personNameXml}${clubXml}${resultXml}</${elementName}>\n`;
    };

    /**
     * Generates some XML for an individual competitor result.
     *
     * For IOF XML v3 this uses a PersonResult element.
     *
     * @param {Map} personData The person data.
     * @return {String} Generated XML string.
     */
    Version3Formatter.getPersonResultXml = personData => Version3Formatter.getIndividualResultXml(personData, "PersonResult");

    /**
     * Generates some XML for a team name.
     * @param {String} name The name of the team.
     * @return {String} Generated XML string.
     */
    Version3Formatter.getTeamNameXml = name => `<Name>${name}</Name>`;

    /**
     * Generates some XML for an team member result.
     *
     * For IOF XML v3 this uses a TeamMemberResult element.
     *
     * @param {Map} personData The person data.
     * @return {String} Generated XML string.
     */
    Version3Formatter.getTeamMemberResultXml = personData => Version3Formatter.getIndividualResultXml(personData, "TeamMemberResult");

    const ALL_FORMATTERS = [Version2Formatter, Version3Formatter];

    /**
     * Formats a relay team to XML
     * @param {Object} formatter The formatter to generate the XML with.
     * @param {Map} team The team data.
     * @param {Map} class_ The class data.
     * @return {String} Generated XML string.
     */
    function formatRelayTeam(formatter, team, class_) {
        return "<TeamResult>\n" + formatter.getTeamNameXml(team.get("name")) + formatter.getClubXml(team) +
                    team.get("members").map(member => formatter.getTeamMemberResultXml(member, class_)).join("\n") +
                    "\n</TeamResult>";
    }

    /**
     * Uses the given formatter to format the given class data as XML.
     * @param {Object} formatter Formatter object.
     * @param {Array} classes Array of maps containing data to format.
     * @return {String} Formatted XML string.
     */
    function getXmlFromFormatter(formatter, classes) {
        let xml = formatter.header;
        for (let class_ of classes) {
            xml += "<ClassResult>\n";
            if (class_.has("name")) {
                xml += formatter.getClassXml(class_.get("name"));
            }

            xml += formatter.getCourseXml(class_);

            if (class_.has("competitors")) {
                xml += class_.get("competitors").map(comp => formatter.getPersonResultXml(comp, class_)).join("\n");
            }

            if (class_.has("teams")) {
                xml += class_.get("teams").map(team => formatRelayTeam(formatter, team, class_)).join("\n");
            }

            if (!class_.has("competitors") && !class_.has("teams")) {
                throw new Error("Class has no competitor nor team results");
            }

            xml += "</ClassResult>\n";
        }

        xml += "</ResultList>\n";
        return xml;
    }

    /**
     * Returns the single result in the given event.
     *
     * This function also asserts that the event has exactly one course-class and
     * exactly one result within that class.  This one result is what
     * it returns.
     * @param {QUnit.assert} assert QUnit assert object.
     * @param {Event} eventData Event data parsed by the reader.
     * @param {String} formatterName Name of the formatter used to generate
     *     the XML.
     * @return {Result} The single result.
     */
    function getSingleResult(assert, eventData, formatterName) {
        assert.strictEqual(eventData.classes.length, 1, `Expected one class - ${formatterName}`);
        if (eventData.classes.length === 1) {
            let courseClass = eventData.classes[0];
            assert.strictEqual(courseClass.results.length, 1, `Expected one result - ${formatterName}`);
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
     * @param {QUnit.assert} assert QUnit assert object.
     * @param {String} xml The XML string to attempt to parse.
     * @param {String|undefined} failureMessage Optional message to show in assertion
     *     failure message if no exception is thrown.  A default message is used
     *     instead if this is not specified.
     */
    function assertInvalidData(assert, xml, failureMessage) {
        SplitsBrowserTest.assertInvalidData(assert, () => parseEventData(xml), failureMessage);
    }

    /**
     * Asserts that attempting to parse the given string will fail with a
     * WrongFileFormat exception being thrown.
     * @param {QUnit.assert} assert QUnit assert object.
     * @param {String} data The string to attempt to parse.
     * @param {String|undefined} failureMessage Optional message to show in assertion
     *     failure message if no exception is thrown.  A default message is used
     *     instead if this is not specified.
     */
    function assertWrongFileFormat(assert, data, failureMessage) {
        SplitsBrowserTest.assertException(assert, "WrongFileFormat", () => parseEventData(data), failureMessage);
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
     * @param {QUnit.assert} assert QUnit assert object.
     * @param {Array} classes Array of class objects to generate the XML from.
     * @param {Function} checkFunc Checking function called for each parsed
     *     event data object.  It is passed the data, and also the name of the
     *     formatter used.
     * @param {Object} options Options object, the contents of which are
     *     described above.
     */
    function runXmlFormatParseTest(classes, checkFunc, options) {
        let formatters = (options && options.formatters) || ALL_FORMATTERS;
        for (let formatter of formatters) {
            let xml = getXmlFromFormatter(formatter, classes);
            if (options && options.preprocessor) {
                xml = options.preprocessor(xml);
            }
            let eventData = parseEventData(xml);
            checkFunc(eventData, formatter.name);
        }
    }

    /**
     * Generates XML using each available formatter, parses the resulting XML,
     * and calls the given checking function on the result.  This function
     * asserts that the resulting data contains only a single result, and
     * then calls the check function with the parsed result.
     *
     * The options supported are the same as those for runXmlFormatParseTest.
     *
     * @param {QUnit.assert} assert QUnit assert object.
     * @param {Map} class_ Class map to generate the XML from.
     * @param {Function} checkFunc Checking function called for the parsed
     *     result, if a single result results.  It is passed the parsed result.
     * @param {Object} options Options object, the contents of which are
     *     described above.
     */
    function runSingleCompetitorXmlFormatParseTest(assert, class_, checkFunc, options) {
        runXmlFormatParseTest([class_], (eventData, formatterName) => {
            let result = getSingleResult(assert, eventData, formatterName);
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
     * @param {Array} classes Array of class objects to generate the XML from.
     * @param {Function} checkFunc Checking function called for the parsed
     *     course, if a single course results.  It is passed the parsed course.
     * @param {Object} options Options object, the contents of which are
     *     described above.
     */
    function runSingleCourseXmlFormatParseTest(assert, classes, checkFunc, options) {
        runXmlFormatParseTest(classes, (eventData, formatterName) => {
            assert.strictEqual(eventData.courses.length, 1, `Expected one course - ${formatterName}`);
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
     * @param {QUnit.assert} assert QUnit assert object.
     * @param {Array} classes Array of class objects to generate the XML
     *     using.
     * @param {Object} options Options object, the contents of which are
     *     described above.
     */
    function runFailingXmlFormatParseTest(assert, classes, options) {
        let formatters = (options && options.formatters) || ALL_FORMATTERS;
        for (let formatter of formatters) {
            let xml = getXmlFromFormatter(formatter, classes);
            if (options && options.preprocessor) {
                xml = options.preprocessor(xml);
            }
            assertInvalidData(assert, xml, `Expected invalid data - ${formatter.name}`);
        }
    }

    /**
     * Asserts that the given event data contains a single class with no results.
     * @param {QUnit.assert} assert QUnit assert object.
     * @param {Event} eventData The event data parsed.
     * @param {String} formatterName The name of the formatter used to generate the XML.
     */
    function assertSingleClassNoResults(assert, eventData, formatterName) {
        assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
        if (eventData.classes.length === 1) {
            assert.strictEqual(eventData.classes[0].results.length, 0, `No results should have been read - ${formatterName}`);
        }
    }

    /**
     * Asserts that the given event data contains a single class with a single result.
     * @param {QUnit.assert} assert QUnit assert object.
     * @param {Event} eventData The event data parsed.
     * @param {String} formatterName The name of the formatter used to generate the XML.
     */
    function assertSingleClassSingleResult(assert, eventData, formatterName) {
        assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
        if (eventData.classes.length === 1) {
            assert.strictEqual(eventData.classes[0].results.length, 1, `One result should have been read - ${formatterName}`);
        }
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
        assertInvalidData(assert, V2_HEADER + "<ResultList <<<");
    });

    QUnit.test("Cannot parse a string for the v2.0.3 format that uses the wrong root element name", function (assert) {
        assertWrongFileFormat(assert, V2_HEADER + "<Wrong />");
    });

    QUnit.test("Cannot parse a string for the v2.0.3 format that does not contain an IOFVersion element", function (assert) {
        assertWrongFileFormat(assert, V2_HEADER + '<ResultList><NotTheIOFVersion version="1.2.3" /><ClassResult /></ResultList>\n');
    });

    QUnit.test("Cannot parse a string for the v2.0.3 format that has an IOFVersion element with no version attribute", function (assert) {
        assertWrongFileFormat(assert, V2_HEADER + "<ResultList><IOFVersion /><ClassResult /></ResultList>\n");
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
        assertInvalidData(assert, V3_HEADER.replace("<ResultList", "<ResultList <<<"));
    });

    QUnit.test("Cannot parse a string for the v3.0 format that uses the wrong root element name", function (assert) {
        assertWrongFileFormat(assert, V3_HEADER.replace("<ResultList", "<Wrong") + "</Wrong>");
    });

    QUnit.test("Cannot parse a string for the v3.0 format that contains no iofVersion attribute", function (assert) {
        assertWrongFileFormat(assert, V3_HEADER.replace('iofVersion="3.0"', "") + "</ResultList>");
    });

    QUnit.test("Cannot parse a string for the v3.0 format that has an iofVersion element with a version other than 3.0", function (assert) {
        assertWrongFileFormat(assert, V3_HEADER.replace('iofVersion="3.0"', 'iofVersion="4.6"') + "</ResultList>");
    });

    QUnit.test("Cannot parse a string for the v3.0 format that has a status of something other than complete", function (assert) {
        assertInvalidData(assert,
            V3_HEADER.replace("<ResultList", '<ResultList status="Delta"') + "</ResultList>",
            "Exception should be thrown attempting to parse XML that contains an IOFVersion element with a wrong version");
    });

    QUnit.test("Cannot parse a string that has no class results in it", function (assert) {
        runFailingXmlFormatParseTest(assert, []);
    });

    QUnit.test("Can parse with warnings a string that has a class with no name", function (assert) {
        runXmlFormatParseTest([new Map([["length", 2300], ["courseId", 1], ["competitors", [getPerson()]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
                assert.ok(eventData.classes[0].name !== "");
            });
    });

    QUnit.test("Can parse a string that has a single class with no competitors", function (assert) {
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", []]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 0, `No classes should have been read - ${formatterName}`);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that has a single class with a single competitor", function (assert) {
        let className = "Test Class";
        let classLength = 2300;
        let person = getPerson();
        runXmlFormatParseTest([new Map([["name", className], ["length", classLength], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
                if (eventData.classes.length === 1) {
                    let courseClass = eventData.classes[0];
                    assert.strictEqual(courseClass.name, className);
                    assert.strictEqual(courseClass.results.length, 1, `One competitor should have been read - ${formatterName}`);
                    assert.strictEqual(courseClass.numControls, 3);
                    assert.ok(!courseClass.isTeamClass, `Course-class should not be marked as a team class - ${formatterName}`);

                    if (courseClass.results.length === 1) {
                        let result = courseClass.results[0];
                        assert.strictEqual(result.owner.name, person.get("forename") + " " + person.get("surname"));
                        assert.strictEqual(result.owner.club, person.get("club"));
                        assert.strictEqual(result.owner.gender, "M");
                        assert.strictEqual(result.owner.yearOfBirth, 1976);
                        assert.strictEqual(result.startTime, person.get("startTime"));
                        assert.strictEqual(result.totalTime, person.get("totalTime"));
                        assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0].concat(person.get("cumTimes")).concat(person.get("totalTime")));
                        assert.ok(result.completed());
                        assert.ok(!result.isNonCompetitive);
                    }

                    assert.strictEqual(eventData.courses.length, 1, `One course should have been read - ${formatterName}`);
                    if (eventData.courses.length > 0) {
                        let course = eventData.courses[0];
                        assert.strictEqual(course.name, className);
                        assert.strictEqual(course.length, classLength / 1000);
                        assert.deepEqual(course.controls, person.get("controls"));

                        assert.deepEqual(course.classes, [courseClass]);
                        assert.strictEqual(courseClass.course, course);
                    }
                }
            });
    });

    QUnit.test("Can parse a string that has a single class with a single competitor and complete status in IOF v2.0.3 format", function (assert) {
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["length", 2300], ["competitors", [getPerson()]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
            },
            {
                preprocessor: xml => xml.replace(/<ResultList>/, '<ResultList status="complete">'),
                formatters: [Version2Formatter]
            }
        );
    });

    QUnit.test("Can parse a string that has a single class with a single competitor and complete status in IOF v3.0 format", function (assert) {
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["length", 2300], ["competitors", [getPerson()]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
            },
            {
                preprocessor: xml => xml.replace(/<ResultList/, '<ResultList status="Complete"'),
                formatters: [Version3Formatter]
            }
        );
    });

    QUnit.test("Can parse a string that has a single class with a single competitor with forename only", function (assert) {
        let person = getPerson();
        person.delete("surname");
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.owner.name, person.get("forename")));
    });

    QUnit.test("Can parse a string that has a single class with a single competitor with surname only", function (assert) {
        let person = getPerson();
        person.delete("forename");
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.owner.name, person.get("surname")));
    });

    QUnit.test("Can parse with warnings a string that contains a competitor with no name", function (assert) {
        let person = getPerson();
        person.delete("forename");
        person.delete("surname");
        runXmlFormatParseTest(
            [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assertSingleClassNoResults(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that contains a competitor with a full club name", function (assert) {
        let person = getPerson();
        person.delete("club");
        person.set("clubFull", "Test Full Club Name");
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.owner.club, person.get("clubFull")));
    });

    QUnit.test("Can parse a string that contains a competitor with missing club", function (assert) {
        let person = getPerson();
        person.delete("club");
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.owner.club, ""));
    });

    QUnit.test("Can parse a string that contains a competitor with no year of birth", function (assert) {
        let person = getPerson();
        person.delete("birthDate");
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["length", 2300], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.yearOfBirth, null);
            });
    });

    QUnit.test("Can parse a string that contains a competitor with an invalid year of birth, ignoring it", function (assert) {
        let person = getPerson();
        person.set("birthDate", "This is not a valid birth date");
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["length", 2300], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.yearOfBirth, null);
            });
    });

    QUnit.test("Can parse a string that contains a female competitor", function (assert) {
        let person = getPerson();
        person.set("gender", "F");
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["length", 2300], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.gender, "F");
            });
    });

    QUnit.test("Can parse a string that contains a competitor with no gender specified", function (assert) {
        let person = getPerson();
        person.delete("gender");
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["length", 2300], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.gender, null);
            });
    });

    QUnit.test("Can parse a string that contains a competitor with an invalid gender, ignoring it", function (assert) {
        let person = getPerson();
        person.set("gender", "This is not a valid gender");
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["length", 2300], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.classes[0].results[0].owner.gender, null);
            });
    });

    QUnit.test("Can parse with warnings a string that contains a competitor with no Result", function (assert) {
        let person = getPerson();
        person.delete("result");
        runXmlFormatParseTest(
            [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that contains a competitor with missing start time", function (assert) {
        let person = getPerson();
        person.delete("startTime");
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.startTime, null));
    });

    QUnit.test("Can parse a string that contains a competitor with invalid start time", function (assert) {
        let person = getPerson();
        person.set("startTime", null);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.startTime, null));
    });

    QUnit.test("Can parse a string that contains a competitor with start time using ISO 8601 basic formatting", function (assert) {
        let person = getPerson();
        person.set("startTimeBasic", true);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.startTime, person.get("startTime")),
            {formatters: [Version3Formatter]});
    });

    QUnit.test("Can parse a string that contains a competitor with start time without seconds", function (assert) {
        let person = getPerson();
        person.set("startTimeNoSeconds", true);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.startTime, person.get("startTime") - (person.get("startTime") % 60)),
            {formatters: [Version3Formatter]});
    });

    QUnit.test("Can parse a string that contains a competitor with missing total time", function (assert) {
        let person = getPerson();
        person.delete("totalTime");
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => {
                assert.strictEqual(result.totalTime, null);
                assert.ok(!result.completed());
            });
    });

    QUnit.test("Can parse a string that contains a competitor with invalid total time", function (assert) {
        let person = getPerson();
        person.set("totalTime", null);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => {
                assert.strictEqual(result.totalTime, null);
                assert.ok(!result.completed());
            });
    });

    QUnit.test("Can parse a string that contains a competitor with fractional seconds to controls", function (assert) {
        let person = getPerson();
        person.set("cumTimes", [65.7, 65.7 + 221.4, 65.7 + 221.4 + 184.6]);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0].concat(person.get("cumTimes")).concat(person.get("totalTime"))),
            {formatters: [Version3Formatter]});
    });

    QUnit.test("Can parse a string that contains a course with no length", function (assert) {
        runSingleCourseXmlFormatParseTest(assert, [new Map([["name", "Test Class"], ["competitors", [getPerson()]]])],
            course => assert.strictEqual(course.length, null));
    });

    QUnit.test("Can parse with warnings a string that contains an invalid course length", function (assert) {
        runXmlFormatParseTest(
            [new Map([["name", "Test Class"], ["length", "This is not a valid number"], ["competitors", [getPerson()]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.courses.length, 1, `One course should have been read - ${formatterName}`);
                assert.strictEqual(eventData.courses[0].length, null, `No course length should have been read - ${formatterName}`);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that contains a course length specified in metres", function (assert) {
        runSingleCourseXmlFormatParseTest(assert,
            [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["lengthUnit", "m"], ["competitors", [getPerson()]]])],
            course => assert.strictEqual(course.length, 2.3),
            {formatters: [Version2Formatter]});
    });

    QUnit.test("Can parse a string that contains a course length specified in kilometres", function (assert) {
        runSingleCourseXmlFormatParseTest(assert,
            [new Map([["name", "Test Class"], ["length", 2.3], ["lengthUnit", "km"], ["courseId", 1], ["competitors", [getPerson()]]])],
            course => assert.strictEqual(course.length, 2.3),
            {formatters: [Version2Formatter]});
    });

    QUnit.test("Can parse a string that contains a course length specified in feet", function (assert) {
        let courseLength = 10176;
        let expectedLengthKm = courseLength / FEET_PER_KILOMETRE;
        runSingleCourseXmlFormatParseTest(assert,
            [new Map([["name", "Test Class"], ["length", courseLength], ["lengthUnit", "ft"], ["courseId", 1], ["competitors", [getPerson()]]])],
            course => assert.ok(Math.abs(expectedLengthKm - course.length) < 1e-7, `Expected length: ${expectedLengthKm}, actual: ${course.length}`),
            {formatters: [Version2Formatter]});
    });

    QUnit.test("Can parse with warnings a string that contains an unrecognised course length unit", function (assert) {
        runXmlFormatParseTest(
            [new Map([["name", "Test Class"], ["length", "100"], ["lengthUnit", "furlong"], ["competitors", [getPerson()]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.courses.length, 1, `One course should have been read - ${formatterName}`);
                assert.strictEqual(eventData.courses[0].length, null, `No course length should have been read - ${formatterName}`);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued - ${formatterName}`);
            },
            {formatters: [Version2Formatter]});
    });

    QUnit.test("Can parse a string that contains a course climb", function (assert) {
        runSingleCourseXmlFormatParseTest(assert,
            [new Map([["name", "Test Class"], ["length", 2300], ["climb", 105], ["courseId", 1], ["competitors", [getPerson()]]])],
            course => assert.strictEqual(course.climb, 105),
            {formatters: [Version3Formatter]});
    });

    QUnit.test("Can parse a string that contains a non-competitive competitor", function (assert) {
        let person = getPerson();
        person.set("competitive", false);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            (result) => assert.strictEqual(result.isNonCompetitive, true));
    });

    QUnit.test("Can parse a string that contains a non-starting competitor", function (assert) {
        let person = getPerson();
        person.set("nonStarter", true);
        person.set("cumTimes", [null, null, null]);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => {
                assert.strictEqual(result.isNonStarter, true);
                assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0, null, null, null, null]);
            });
    });

    QUnit.test("Can parse a string that contains a non-finishing competitor", function (assert) {
        let person = getPerson();
        person.set("nonFinisher", true);
        person.get("cumTimes")[2] = null;
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.isNonFinisher, true));
    });

    QUnit.test("Can parse a string that contains a disqualified competitor", function (assert) {
        let person = getPerson();
        person.set("disqualified", true);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.isDisqualified, true));
    });

    QUnit.test("Can parse a string that contains an over-max-time competitor", function (assert) {
        let person = getPerson();
        person.set("overMaxTime", true);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.isOverMaxTime, true));
    });

    QUnit.test("Can parse a string that contains an competitor that is OK despite missing times", function (assert) {
        let person = getPerson();
        person.get("cumTimes")[1] = null;
        person.set("okDespiteMissingTimes", true);
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => assert.strictEqual(result.isOKDespiteMissingTimes, true));
    });

    QUnit.test("Can parse a string that uses alternative element name for control codes", function (assert) {
        let person = getPerson();
        runSingleCourseXmlFormatParseTest(assert, [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]])],
            course => assert.deepEqual(course.controls, person.get("controls")),
            {
                preprocessor: xml => xml.replace(/<ControlCode>/g, "<Control><ControlCode>")
                              .replace(/<\/ControlCode>/g, "</ControlCode></Control>"),
                formatters: [Version2Formatter]
            });
    });

    QUnit.test("Can parse a string that uses separate course names", function (assert) {
        let person = getPerson();
        runSingleCourseXmlFormatParseTest(assert,
            [new Map([["name", "Test Class"], ["courseName", "Test Course"], ["length", 2300], ["courseId", 1], ["competitors", [person]]])],
            course => assert.deepEqual(course.name, "Test Course"),
            {formatters: [Version3Formatter]});
    });

    QUnit.test("Cannot parse a string that contains a competitor with a split with a missing control code", function (assert) {
        let person = getPerson();
        runFailingXmlFormatParseTest(assert, [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]])],
            {preprocessor: xml => xml.replace(`<ControlCode>${person.get("controls")[1]}</ControlCode>`, "")});
    });

    QUnit.test("Can parse a string that contains a competitor with an additional control, ignoring the additional control", function (assert) {
        let person = getPerson();
        runSingleCourseXmlFormatParseTest(assert,
            [new Map([["name", "Test Class"], ["courseName", "Test Course"], ["length", 2300], ["courseId", 1], ["competitors", [person]]])],
            course => {
                assert.strictEqual(course.classes.length, 1);
                assert.strictEqual(course.classes[0].numControls, 3);
            },
            {
                preprocessor: xml => xml.replace(/<\/Result>/, '<SplitTime status="Additional"><ControlCode>987</ControlCode><Time>234</Time></SplitTime></Result>'),
                formatters: [Version3Formatter]
            });
    });

    QUnit.test("Can parse a string that contains a competitor with a split with a missing time", function (assert) {
        let person = getPerson();
        runSingleCourseXmlFormatParseTest(assert, [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]])],
            course => {
                assert.strictEqual(course.classes.length, 1);
                assert.strictEqual(course.classes[0].numControls, 3);
            },
            {preprocessor: xml => {
                let timeRegex = /<Time>[^<]+<\/Time>/g;
                timeRegex.exec(xml); // Skip the first match.
                let secondMatch = timeRegex.exec(xml)[0];
                return xml.replace(secondMatch, "");
            }});
    });

    QUnit.test("Can parse a string that contains a competitor with their total time wrapped in a Clock element.", function (assert) {
        let person = getPerson();
        runSingleCourseXmlFormatParseTest(assert, [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]])],
            course => {
                assert.strictEqual(course.classes.length, 1);
                assert.strictEqual(course.classes[0].results.length, 1);
                assert.strictEqual(course.classes[0].results[0].totalTime, person.get("totalTime"), "Should read competitor's total time");
            },
            {preprocessor: xml => {
                let timeRegex = /<Time>[^<]+<\/Time>/g;
                let firstMatch = timeRegex.exec(xml)[0];
                let firstMatchTime = firstMatch.substring(6, firstMatch.length - 7);
                xml = xml.replace(firstMatch, `<Time>\r\n<Clock>${firstMatchTime}</Clock>\r\n</Time>`);
                return xml;
            },
            formatters: [Version2Formatter]});
    });

    QUnit.test("Can parse a string that contains a competitor that mispunched a control", function (assert) {
        let person = getPerson();
        person.get("cumTimes")[1] = null;
        runSingleCompetitorXmlFormatParseTest(assert, new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]]),
            result => {
                assert.deepEqual(result.getAllOriginalCumulativeTimes(), [0].concat(person.get("cumTimes")).concat([person.get("totalTime")]));
                assert.ok(!result.completed());
            });
    });

    QUnit.test("Cannot parse a string that contains a class with two competitors with different numbers of controls", function (assert) {
        let person1 = getPerson();
        let person2 = getPerson();
        person2.set("forename", "Second");
        person2.set("surname", "Runner");
        person2.get("controls").push("199");
        person2.get("cumTimes").push(person2.get("cumTimes")[2] + 177);
        person2.set("totalTime", person2.get("cumTimes")[2] + 177 + 94);

        runXmlFormatParseTest(
            [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person1, person2]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued - ${formatterName}`);
                assert.ok(eventData.warnings[0].match(/number of controls/));
            }
        );
    });

    QUnit.test("Can parse a string that contains a class with one competitor whose number of controls matches that specified by the course", function (assert) {
        let person = getPerson();
        runSingleCompetitorXmlFormatParseTest(
            assert,
            new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["numberOfControls", person.get("controls").length], ["competitors", [person]]]),
            // In this test we only really want to be sure that the
            // competitor was read without the number-of-controls
            // validation firing.  So there aren't any assertions we really
            // need to run.
            () => { /* empty */ },
            {formatters: [Version3Formatter]}
        );
    });

    QUnit.test("Can parse with warnings a string that contains a class with one competitor whose number of controls doesn't match that specified by the course", function (assert) {
        let person = getPerson();
        runXmlFormatParseTest(
            [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["numberOfControls", person.get("controls").length + 2], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assertSingleClassNoResults(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued - ${formatterName}`);
            },
            {formatters: [Version3Formatter]}
        );
    });

    QUnit.test("Can parse with warnings a string that contains one class with two competitors having different control codes", function (assert) {
        let person1 = getPerson();
        let person2 = getPerson();
        person2.set("forename", "Second");
        person2.set("surname", "Runner");
        person2.get("controls")[1] += "9";

        runXmlFormatParseTest(
            [new Map([["name", "Test Class 1"], ["length", 2300], ["competitors", [person1, person2]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that contains two classes nominally the same course each with one competitor but with different controls as two separate courses", function (assert) {
        let person1 = getPerson();
        let person2 = getPerson();
        person2.set("forename", "Second");
        person2.set("surname", "Runner");
        person2.get("controls")[1] += "9";

        let classes = [
            new Map([["name", "Test Class 1"], ["length", 2300], ["courseId", 1], ["competitors", [person1]]]),
            new Map([["name", "Test Class 2"], ["length", 2300], ["courseId", 1], ["competitors", [person2]]])
        ];

        runXmlFormatParseTest(classes,
            (eventData, formatterName) => assert.strictEqual(eventData.courses.length, 2, `Should read the classes' courses as separate - ${formatterName}`),
            {formatters: [Version3Formatter]}
        );
    });

    QUnit.test("Cannot parse a string that contains two classes using the same course each with one competitor but with different numbers of controls", function (assert) {
        let person1 = getPerson();
        let person2 = getPerson();
        person2.set("forename", "Second");
        person2.set("surname", "Runner");
        person2.get("controls").push("199");
        person2.get("cumTimes").push(person2.get("cumTimes")[2] + 177);
        person2.set("totalTime", person2.get("cumTimes")[2] + 177 + 94);

        let classes = [
            new Map([["name", "Test Class 1"], ["length", 2300], ["courseId", 1], ["competitors", [person1]]]),
            new Map([["name", "Test Class 2"], ["length", 2300], ["courseId", 1], ["competitors", [person2]]])
        ];

        runXmlFormatParseTest(classes,
            (eventData, formatterName) => assert.strictEqual(eventData.courses.length, 2, `Should read the classes' courses as separate - ${formatterName}`),
            {formatters: [Version3Formatter]}
        );
    });

    QUnit.test("Can parse a string that contains two classes each with one competitor", function (assert) {
        let person1 = getPerson();
        let person2 = getPerson();
        person2.set("forename", "Second");
        person2.set("surname", "Runner");
        person2.get("controls").push("199");
        person2.get("cumTimes").push(person2.get("cumTimes")[2] + 177);
        person2.set("totalTime", person2.get("cumTimes")[2] + 177 + 94);

        let persons = [person1, person2];
        let classes = [
            new Map([["name", "Test Class 1"], ["length", 2300], ["courseId", 1], ["competitors", [person1]]]),
            new Map([["name", "Test Class 2"], ["length", 2300], ["courseId", 1], ["competitors", [person2]]])
        ];

        runXmlFormatParseTest(classes,
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 2, `Expected two classes - ${formatterName}`);
                assert.strictEqual(eventData.courses.length, 2, `Expected two courses - ${formatterName}`);

                if (eventData.classes.length === 2 && eventData.courses.length === 2) {
                    for (let i = 0; i < 2; i += 1) {
                        assert.deepEqual(eventData.classes[i].course, eventData.courses[i]);
                        assert.deepEqual(eventData.courses[i].classes, [eventData.classes[i]]);
                        assert.strictEqual(eventData.classes[i].results.length, 1);
                        assert.deepEqual(eventData.classes[i].results[0].owner.name, persons[i].get("forename") + " " + persons[i].get("surname"));
                    }
                }
            });
    });

    QUnit.test("Can parse a string that contains two classes each with one competitor, both on the same course", function (assert) {
        let person1 = getPerson();
        let person2 = getPerson();
        person2.set("forename", "Second");
        person2.set("surname", "Runner");

        let persons = [person1, person2];
        let classes = [
            new Map([["name", "Test Class 1"], ["length", 2300], ["courseId", 1], ["competitors", [person1]]]),
            new Map([["name", "Test Class 2"], ["length", 2300], ["courseId", 1], ["competitors", [person2]]])
        ];

        runXmlFormatParseTest(classes,
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 2, `Expected two classes - ${formatterName}`);
                assert.strictEqual(eventData.courses.length, 1, `Expected one course - ${formatterName}`);

                if (eventData.classes.length === 2 && eventData.courses.length === 1) {
                    for (let i = 0; i < 2; i += 1) {
                        assert.deepEqual(eventData.classes[i].course, eventData.courses[0]);
                        assert.strictEqual(eventData.classes[i].results.length, 1);
                        assert.deepEqual(eventData.classes[i].results[0].owner.name, persons[i].get("forename") + " " + persons[i].get("surname"));
                    }
                    assert.deepEqual(eventData.courses[0].classes, eventData.classes);
                }
            },
            {formatters: [Version3Formatter]});
    });

    QUnit.test("Can parse a string that contains two classes each with one competitor, deducing that the courses are the same using control codes", function (assert) {
        let person1 = getPerson();
        let person2 = getPerson();
        person2.set("forename", "Second");
        person2.set("surname", "Runner");

        let classes = [
            new Map([["name", "Test Class 1"], ["length", 2300], ["courseId", 1], ["competitors", [person1]]]),
            new Map([["name", "Test Class 2"], ["length", 2300], ["courseId", 1], ["competitors", [person2]]])
        ];

        runXmlFormatParseTest(classes,
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 2, `Expected two classes - ${formatterName}`);
                assert.strictEqual(eventData.courses.length, 1, `Expected one course - ${formatterName}`);
                if (eventData.classes.length === 2 && eventData.courses.length === 1) {
                    assert.deepEqual(eventData.courses[0].classes, eventData.classes);
                }
            });
    });

    QUnit.test("Can parse a string that contains two classes each with one competitor and no controls, without deducing that the courses are the same", function (assert) {
        let person1 = getPerson();
        let person2 = getPerson();
        person2.set("forename", "Second");
        person2.set("surname", "Runner");
        for (let person of [person1, person2]) {
            person.set("totalTime", 100);
            person.set("controls", []);
            person.set("cumTimes", []);
        }

        let classes = [
            new Map([["name", "Test Class 1"], ["length", 2300], ["competitors", [person1]]]),
            new Map([["name", "Test Class 2"], ["length", 2300], ["competitors", [person2]]])
        ];

        runXmlFormatParseTest(classes,
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 2, `Expected two classes - ${formatterName}`);
                assert.strictEqual(eventData.courses.length, 2, `Expected two courses - ${formatterName}`);
            });
    });

    QUnit.test("Can parse with no warnings a string that contains a normal competitor and a non-starting competitor with no controls", function (assert) {
        let person1 = getPerson();
        let person2 = getPerson();
        person2.set("forename", "Non");
        person2.set("surname", "Starter");
        person2.set("controls", []);
        person2.set("cumTimes", []);
        person2.set("nonStarter", true);

        runXmlFormatParseTest(
            [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person1, person2]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
                assert.strictEqual(eventData.classes[0].results.length, 2, `Two competitors should have been read - ${formatterName}`);
                assert.strictEqual(eventData.warnings.length, 0, `No warning should have been issued: ${eventData.warnings[0]}`);
            });
    });

    QUnit.test("Can parse with no warnings a string that contains only a non-starting competitor with no controls", function (assert) {
        let person = getPerson();
        person.set("controls", []);
        person.set("cumTimes", []);
        person.set("nonStarter", true);

        runXmlFormatParseTest(
            [new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["competitors", [person]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
                if (eventData.classes.length === 1) {
                    let courseClass = eventData.classes[0];
                    assert.strictEqual(courseClass.results.length, 1, `One competitor should have been read - ${formatterName}`);
                    assert.strictEqual(courseClass.numControls, 0);
                    assert.strictEqual(eventData.warnings.length, 0, `No warning should have been issued: ${eventData.warnings[0]}`);
                }
            });
    });

    QUnit.test("Can parse a string that has a single class with no teams", function (assert) {
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["length", 2300], ["courseId", 1], ["teams", []]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 0, `No classes should have been read - ${formatterName}`);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that has a single class with a single team", function (assert) {
        let className = "Test Class";
        let team = getTeam();

        runXmlFormatParseTest([new Map([["name", className], ["teams", [team]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
                if (eventData.classes.length === 1) {
                    let courseClass = eventData.classes[0];
                    assert.strictEqual(courseClass.name, className);
                    assert.strictEqual(courseClass.results.length, 1, `One result should have been read - ${formatterName}`);
                    assert.strictEqual(courseClass.numControls, 7); // 3 numbered controls for each competitor plus 1 for the intermediate finish.
                    assert.deepEqual(courseClass.numbersOfControls, [3, 3]);
                    assert.ok(courseClass.isTeamClass, "Course-class should be marked as a team class");

                    if (courseClass.results.length === 1) {
                        let result = courseClass.results[0];
                        assert.strictEqual(result.owner.name, "TestTeam");
                        assert.strictEqual(result.owner.club, team.get("club"));
                        assert.strictEqual(result.owner.members.length, team.get("members").length);
                        for (let index = 0; index < team.get("members").length; index += 1) {
                            assert.strictEqual(result.owner.members[index].name, team.get("members")[index].get("forename") + " " + team.get("members")[index].get("surname"));
                            assert.strictEqual(result.owner.members[index].club, team.get("members")[index].get("club"));
                        }
                        assert.strictEqual(result.startTime, team.get("members")[0].get("startTime"));
                        assert.strictEqual(result.totalTime, team.get("members")[0].get("totalTime") + team.get("members")[1].get("totalTime"));
                        let expectedCumulativeTimes = [0].concat(team.get("members")[0].get("cumTimes"))
                                .concat([team.get("members")[0].get("totalTime")])
                                .concat(team.get("members")[1].get("cumTimes").map(time => team.get("members")[0].get("totalTime") + time))
                                .concat(result.totalTime);
                        assert.deepEqual(result.getAllOriginalCumulativeTimes(), expectedCumulativeTimes);
                        assert.ok(result.completed());
                        assert.ok(!result.isNonCompetitive);
                    }

                    assert.strictEqual(eventData.courses.length, 1, `One course should have been read - ${formatterName}`);
                    if (eventData.courses.length > 0) {
                        let course = eventData.courses[0];
                        assert.strictEqual(course.name, className);
                        assert.strictEqual(course.controls, null);

                        assert.deepEqual(course.classes, [courseClass]);
                        assert.strictEqual(courseClass.course, course);
                    }
                }

                assert.deepEqual(eventData.warnings, [], `No warnings should have been issued - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that has a single class with a single empty team, generating a warning for the empty team", function (assert) {
        let emptyTeam = new Map([["name", "EmptyTeam"], ["club", "EmptyName"], ["members", []]]);

        runXmlFormatParseTest([new Map([["name", "Test Class"], ["teams", [emptyTeam]]])],
            (eventData, formatterName) => {
                assertSingleClassNoResults(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued for the empty team - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that has a single class with a single empty team, generating a warning for the empty team", function (assert) {
        let singletonTeam = getTeam();
        singletonTeam.get("members").pop();

        runXmlFormatParseTest([new Map([["name", "Test Class"], ["teams", [singletonTeam]]])],
            (eventData, formatterName) => {
                assertSingleClassNoResults(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued for the singleton team - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that has a single class with a single team and an empty team, generating a warning for the empty team", function (assert) {
        let team = getTeam();
        let emptyTeam = new Map([["name", "EmptyTeam"], ["club", "EmptyName"], ["members", []]]);

        runXmlFormatParseTest([new Map([["name", "Test Class"], ["teams", [team, emptyTeam]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued for the empty team - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string that has a single class with a single two-person team and a one-person team, generating a warning for the one-person team", function (assert) {
        let team = getTeam();
        let shortTeam = new Map([["name", "ShortTeam"], ["club", "ShortName"], ["members", [getPerson()]]]);

        runXmlFormatParseTest([new Map([["name", "Test Class"], ["teams", [team, shortTeam]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued for the one-person team - ${formatterName}`);
            });
    });

    QUnit.test("Parsing a string that has a single class with a single team with the second team member not starting at the same time the first one finishes generates a warning only", function (assert) {
        let team = getTeam();
        team.get("members")[1].set("startTime", team.get("members")[1].get("startTime") + 10);

        runXmlFormatParseTest([new Map([["name", "Test Class"], ["teams", [team]]])],
            (eventData, formatterName) => {
                assertSingleClassNoResults(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 1, `One warning should have been issued for the team with a starter not at the same time as the previous finisher - ${formatterName}`);
            });
    });

    QUnit.test("Parsing a string that has a single class with a single team with the second team member a non-starter and with no start time generates no warning", function (assert) {
        let team = getTeam();
        team.get("members")[1].set("startTime", null);
        team.get("members")[1].set("nonStarter", true);
        team.get("members")[1].set("cumTimes", [null, null, null]);

        runXmlFormatParseTest([new Map([["name", "Test Class"], ["teams", [team]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.strictEqual(eventData.warnings.length, 0, `No warning should have been issued for the team with a non-starter whose start time was not at the same time as the previous finisher - ${formatterName}: first warning is '${eventData.warnings[0]}`);
            });
    });

    QUnit.test("Can parse a string containing two results with different controls", function (assert) {
        let team1 = getTeam();

        let team2 = getTeam();
        team2.set("name", team2.get("name" + " 2"));
        for (let member of team2.get("members")) {
            member.set("surname", member.get("surname") + " 2");
            member.set("startTime", member.get("startTime") + 100);
            member.set("finishTime", member.get("finishTime") + 100);
            member.get("controls").reverse();
        }

        runXmlFormatParseTest([new Map([["name", "Test Class"], ["teams", [team1, team2]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 1, `One class should have been read - ${formatterName}`);
                if (eventData.classes.length === 1) {
                    assert.strictEqual(eventData.classes[0].results.length, 2, `Two results should have been read - ${formatterName}`);
                }

                assert.deepEqual(eventData.warnings, [], `No warnings should have been issued - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string containing two results with different numbers of controls, rejecting the second row", function (assert) {
        let team1 = getTeam();
        let team2 = getTeam();
        team2.set("name", team2.get("name") + " 2");
        for (let member of team2.get("members")) {
            member.set("surname", member.get("surname") + " 2");
            member.set("startTime", member.get("startTime") + 100);
            member.set("finishTime", member.get("finishTime") + 100);
        }

        team2.get("members")[1].get("controls").pop();
        team2.get("members")[1].get("cumTimes").pop();

        runXmlFormatParseTest([new Map([["name", "Test Class"], ["teams", [team1, team2]]])],
            (eventData, formatterName) => {
                assertSingleClassSingleResult(assert, eventData, formatterName);
                assert.deepEqual(eventData.warnings.length, 1, `One warning should have been issued for the team with a missing control - ${formatterName}`);
            });
    });

    QUnit.test("Cannot parse a string containing a class with an individual result and a team result", function (assert) {
        runXmlFormatParseTest([new Map([["name", "Test Class"], ["competitors", [getPerson()]], ["teams", [getTeam()]]])],
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 0, `No class should have been read - ${formatterName}`);
                assert.deepEqual(eventData.warnings.length, 1, `One warning should have been issued for the class with inconsistent results - ${formatterName}`);
            });
    });

    QUnit.test("Can parse a string containing an individual class and a team class", function (assert) {
        let classData = [
            new Map([["name", "Individual Class"], ["competitors", [getPerson()]]]),
            new Map([["name", "Team Class"], ["teams", [getTeam()]]])
        ];
        runXmlFormatParseTest(classData,
            (eventData, formatterName) => {
                assert.strictEqual(eventData.classes.length, 2, `Two classes should have been read - ${formatterName}`);
                if (eventData.classes.length === 2) {
                    assert.strictEqual(eventData.classes[0].results.length, 1, `One result should have been read in the individual class - ${formatterName}`);
                    assert.strictEqual(eventData.classes[0].name, classData[0].get("name"), `Individual class should have correct name - ${formatterName}`);
                    assert.strictEqual(eventData.classes[1].results.length, 1, `One result should have been read in the relay class - ${formatterName}`);
                    assert.strictEqual(eventData.classes[1].name, classData[1].get("name"), `Team class should have correct name - ${formatterName}`);
                }

                assert.deepEqual(eventData.warnings, [], `No warnings should have been issued - ${formatterName}`);
            });
    });
})();