/*
 *  SplitsBrowser - IOF XML format parser tests.
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
(function (){
    "use strict";
    
    var formatTime = SplitsBrowser.formatTime;
    var parseEventData = SplitsBrowser.Input.IOFXml.parseEventData;

    // The number of feet per kilometre.
    var FEET_PER_KILOMETRE = 3280;
    
    var HEADER = '<?xml version="1.0" ?>\n<!DOCTYPE ResultList SYSTEM "IOFdata.dtd">\n';
    
    var IOF_VERSION = '<IOFVersion version="2.0.3" />';
    
    module("Input.IOFXml");
    
    // In all of the following XML generation functions, it is assumed that the
    // input argument contains no characters that are interpreted by XML, such
    // as "<", ">", "&", "'" and "\"".  This is only test code; we assume those
    // writing these tests are smart enough to know not to do this.
       
    /**
    * Returns a chunk of XML that contains a class name.
    * @param {String} className - The name of the class.
    * @return {String} XML string containing the class name.
    */
    function classXml(className) {
        return "<ClassShortName>" + className + "</ClassShortName>";
    }
    
    /**
    * Returns a person object with the forename, surname, club, startTime,
    * totalTime, courseLength, controls and cumTimes properties set.
    * @return {Object} Person object.
    */
    function getPerson() {
        return {
            forename: "John",
            surname: "Smith",
            club: "TestClub",
            startTime: 10 * 3600 + 11 * 60,
            totalTime: 65 + 221 + 184 + 100,
            courseLength: 2300,
            controls: ["182", "148", "167"],
            cumTimes: [65, 65 + 221, 65 + 221 + 184],
            result: true
        };
    }
    

    /**
    * Generates some XML for a person.
    *
    * The properties supported are as follows.  Unless specified otherwise, the
    * XML generated for each property is omitted if the property is not
    * specified:
    * * forename (String) - The person's forename.
    * * surname (String) - The person's surname.
    * * personId (String) - The person's ID.
    * * club {String} The person's club.
    * * startTime (Number) - The person's start time, in seconds since
    *       midnight.
    * * totalTime (Number) - The person's total time, in seconds.
    * * competitive (boolean) - True if competitive, false if non-competitive.  
    *       Assumed competitive if not specified.
    * * courseLength (Number) - The length of the course.
    * * courseLengthUnit (String) - The unit that the length of the course is
    *       measured in.
    * * controls (Array) - Array of control codes.  Must be specified.
    * * cumTimes {Array} - Array of cumulative times.  Must be specified.
    * * result {Any} - Specified to include the <Result> element, omit to
    *       skip it.
    *
    * @param {Object} personData - The person data.
    * @return {String} Generated XML string.
    */
    function getPersonResultXml(personData) {
        
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
            personNameXml = '<Person><PersonName>';
            if (exists("forename")) {
                personNameXml += '<Given>' + personData.forename + '</Given>';
            }
            if (exists("surname")) {
                personNameXml += '<Family>' + personData.surname + '</Family>';
            }
            personNameXml += '</PersonName></Person>';
        }
        
        var personIdXml = (exists("personId")) ? '<PersonId>' + personData.personId + '</PersonId>' : "";
        
        var clubXml = (exists("club")) ? '<Club><ShortName>' + personData.club + '</ShortName></Club>' : "";
        var startTimeXml = (exists("startTime")) ? '<StartTime><Clock>' + formatTime(personData.startTime) + '</Clock></StartTime>' : "";
        var totalTimeXml = (exists("totalTime")) ? '<Time>' + formatTime(personData.totalTime) + '</Time>' : "";
        
        var status;
        if (personData.cumTimes.indexOf(null) >= 0) {
            status = "MisPunch";
        } else if (!exists("competitive") || personData.competitive) {
            status = "OK";
        } else {
            status = "NotCompeting";
        }
        
        var statusXml = '<CompetitorStatus value="' + status + '" />';
        
        var courseLengthXml = "";
        if (exists("courseLength")) {
            if (exists("courseLengthUnit")) {
                courseLengthXml = '<CourseLength unit="' + personData.courseLengthUnit + '">' + personData.courseLength + '</CourseLength>\n';       
            } else {
                courseLengthXml = '<CourseLength>' + personData.courseLength + '</CourseLength>';
            }
        }
        
        var splitTimesXmls = [];
        for (var index = 0; index < personData.cumTimes.length; index += 1) {
            splitTimesXmls.push('<SplitTime sequence="' + (index + 1) + '"><ControlCode>' + personData.controls[index] + '</ControlCode><Time>' + formatTime(personData.cumTimes[index]) + '</Time></SplitTime>');
        }
        
        var resultXml = exists("result") ? '<Result>' + startTimeXml + totalTimeXml + statusXml + courseLengthXml + splitTimesXmls.join("") + '</Result>' : "";
        
        return '<PersonResult>' + personNameXml + personIdXml + clubXml + resultXml + '</PersonResult>';
    }
    
    /**
    * Returns an XML string that contains a single class with a single
    * competitor.
    * @param {String} className - The name of a class.
    * @param {Object} person - Object containing the competitor's details.
    * @return {String} XML string.
    */
    function getSingleClassSingleCompetitorXml(className, person) {
        return getSingleClassMultiCompetitorXml(className, [person]);
    }
    
    /**
    * Returns an XML string that contains a single class with multiple
    * competitors.
    * @param {String} className - The name of a class.
    * @param {Array} persons - Array of objects containing competitor details.
    * @return {String} XML string.
    */
    function getSingleClassMultiCompetitorXml(className, persons) {
        var xmlString = HEADER + '<ResultList>' + IOF_VERSION + '<ClassResult>' + classXml(className);
        persons.forEach(function (person) { xmlString += getPersonResultXml(person); });
        return xmlString + '</ClassResult></ResultList>\n';
    }
    
    /**
    * Returns the single competitor in the given event.
    *
    * This function also asserts that the event has exactly one ageclass and
    * exactly one competitor within that class.  This one competitor is what
    * it returns.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Event} eventData - Event data parsed by the reader.
    * @return {Competitor} The single competitor.
    */
    function getSingleCompetitor(assert, eventData) {
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        assert.strictEqual(ageClass.competitors.length, 1);
        
        return eventData.classes[0].competitors[0];
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

    QUnit.test("Cannot parse an empty string", function (assert) {
        assertWrongFileFormat(assert, "");
    });
    
    QUnit.test("Cannot parse a non-empty string that is not XML", function (assert) {
        assertWrongFileFormat(assert, "This is not valid IOF XML data");
    });
    
    QUnit.test("Cannot parse a string that is XML but does not mention the IOFdata DTD", function (assert) {
        assertWrongFileFormat(assert, "<ResultList />");
    });

    QUnit.test("Cannot parse a string that mentions the IOFdata DTD but is not well-formed XML", function (assert) {
        assertInvalidData(assert, HEADER + '<ResultList <<<');
    });

    QUnit.test("Cannot parse a string that uses the wrong root element", function (assert) {
        assertWrongFileFormat(assert, HEADER + '<Wrong />');
    });
    
    QUnit.test("Cannot parse a string that does not contain an IOFVersion element", function (assert) {
        assertWrongFileFormat(assert, HEADER + '<ResultList><NotTheIOFVersion version="1.2.3" /><ClassResult /></ResultList>\n');
    });
    
    QUnit.test("Cannot parse a string that has an IOFVersion element with no version attribute", function (assert) {
        assertWrongFileFormat(assert, HEADER + '<ResultList><IOFVersion /><ClassResult /></ResultList>\n');
    });
    
    QUnit.test("Cannot parse a string that has an IOFVersion element with a version other than 2.0.3", function (assert) {
        assertWrongFileFormat(assert, HEADER + '<ResultList><IOFVersion version="wrong" /><ClassResult /></ResultList>\n');
    });
    
    QUnit.test("Cannot parse a string that has a status of something other than complete", function (assert) {
        assertInvalidData(assert,
            HEADER + '<ResultList status="delta"><IOFVersion version="2.0.3" /></ResultList>\n',
            "Exception should be thrown attempting to parse XML that contains an IOFVersion element with a wrong version");
    });
    
    QUnit.test("Cannot parse a string that has no class results", function (assert) {
        assertInvalidData(assert, 
            HEADER + '<ResultList><IOFVersion version="2.0.3" /></ResultList>\n',
            "Exception should be thrown attempting to parse XML that that doesn't contain any ClassResult elements");
    });
    
    QUnit.test("Cannot parse a string that has a class with no name", function (assert) {
        assertInvalidData(assert,
            HEADER + '<ResultList><IOFVersion version="2.0.3" /><ClassResult /></ResultList>\n',
            "Exception should be thrown attempting to parse XML that that contains a ClassResult with no name");
    });
    
    QUnit.test("Cannot parse a string that has a single class with no competitors", function (assert) {
        var xml = getSingleClassMultiCompetitorXml("Test Class", []);
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that contains a class with no competitors");
    });
    
    QUnit.test("Can parse a string that has a single class with a single competitor", function (assert) {
        var person = getPerson();
        var className = "Test Class";
        var eventData = parseEventData(getSingleClassSingleCompetitorXml(className, person));
        assert.strictEqual(eventData.classes.length, 1);
        var ageClass = eventData.classes[0];
        assert.strictEqual(ageClass.name, className);
        assert.strictEqual(ageClass.competitors.length, 1);
        assert.strictEqual(ageClass.numControls, 3);
        
        var competitor = eventData.classes[0].competitors[0];
        assert.strictEqual(competitor.name, person.forename + " " + person.surname);
        assert.strictEqual(competitor.club, person.club);
        assert.strictEqual(competitor.startTime, person.startTime);
        assert.strictEqual(competitor.totalTime, person.totalTime);
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0].concat(person.cumTimes).concat(person.totalTime));
        assert.ok(competitor.completed());
        assert.ok(!competitor.isNonCompetitive);
        
        assert.strictEqual(eventData.courses.length, 1);
        var course = eventData.courses[0];
        assert.strictEqual(course.name, className);
        assert.strictEqual(course.length, person.courseLength / 1000);
        assert.deepEqual(course.controls, person.controls);
        
        assert.deepEqual(course.classes, [ageClass]);
        assert.strictEqual(ageClass.course, course);
    });
    
    QUnit.test("Can parse a string that has a single class with a single competitor with forename only", function (assert) {
        var person = getPerson();
        delete person.surname;
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        var competitor = getSingleCompetitor(assert, eventData);
        assert.strictEqual(competitor.name, person.forename);
    });
    
    QUnit.test("Can parse a string that has a single class with a single competitor with surname only", function (assert) {
        var person = getPerson();
        delete person.forename;
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        var competitor = getSingleCompetitor(assert, eventData);
        assert.strictEqual(competitor.name, person.surname);
    });
    
    QUnit.test("Can parse a string that has a single class with a single competitor with person-ID only", function (assert) {
        var person = getPerson();
        delete person.forename;
        delete person.surname;
        person.personId = "12358";
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        var competitor = getSingleCompetitor(assert, eventData);
        assert.strictEqual(competitor.name, person.personId);
    });
    
    QUnit.test("Cannot parse a string that contains a competitor with no name nor ID", function (assert) {
        var person = getPerson();
        delete person.forename;
        delete person.surname;
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that that contains a PersonResult with no name nor ID");
    });
    
    QUnit.test("Can parse a string that contains a competitor with missing club", function (assert) {
        var person = getPerson();
        delete person.club;
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        var competitor = getSingleCompetitor(assert, eventData);
        assert.strictEqual(competitor.club, "");
    });
    
    QUnit.test("Cannot parse a string that contains a competitor with no Result", function (assert) {
        var person = getPerson();
        delete person.result;
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that that contains a PersonResult with Result");
    });
    
    QUnit.test("Can parse a string that contains a competitor with missing start time", function (assert) {
        var person = getPerson();
        delete person.startTime;
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        var competitor = getSingleCompetitor(assert, eventData);
        assert.strictEqual(competitor.startTime, null);
    });
    
    QUnit.test("Can parse a string that contains a competitor with invalid start time", function (assert) {
        var person = getPerson();
        person.startTime = null;
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        var competitor = getSingleCompetitor(assert, eventData);
        assert.strictEqual(competitor.startTime, null);
    });
    
    QUnit.test("Can parse a string that contains a competitor with missing total time", function (assert) {
        var person = getPerson();
        delete person.totalTime;
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        var competitor = getSingleCompetitor(assert, eventData);
        assert.strictEqual(competitor.totalTime, null);
        assert.ok(!competitor.completed());
    });
    
    QUnit.test("Can parse a string that contains a competitor with invalid total time", function (assert) {
        var person = getPerson();
        person.totalTime = null;
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        var competitor = getSingleCompetitor(assert, eventData);
        assert.strictEqual(competitor.totalTime, null);
        assert.ok(!competitor.completed());
    });
    
    QUnit.test("Can parse a string that contains a competitor with no course length", function (assert) {
        var person = getPerson();
        delete person.courseLength;
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        assert.strictEqual(eventData.courses.length, 1);
        assert.strictEqual(eventData.courses[0].length, null);
    });
    
    QUnit.test("Cannot parse a string that contains a competitor with an invalid length", function (assert) {
        var person = getPerson();
        person.courseLength = "This is not a valid number";
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that that contains an invalid CourseLength");
    });
    
    QUnit.test("Can parse a string that contains a competitor with course length specified with metres as units", function (assert) {
        var person = getPerson();
        person.courseLengthUnit = "m";
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        assert.strictEqual(eventData.courses.length, 1);
        assert.strictEqual(eventData.courses[0].length, person.courseLength / 1000);
    });
    
    QUnit.test("Can parse a string that contains a competitor with course length specified with kilometres as units", function (assert) {
        var person = getPerson();
        person.courseLengthUnit = "km";
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        assert.strictEqual(eventData.courses.length, 1);
        assert.strictEqual(eventData.courses[0].length, person.courseLength);
    });
    
    QUnit.test("Can parse a string that contains a competitor with course length specified with feet as units", function (assert) {
        var person = getPerson();
        person.courseLengthUnit = "ft";
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        assert.strictEqual(eventData.courses.length, 1);
        var expectedValue = person.courseLength / FEET_PER_KILOMETRE;
        var actualValue = eventData.courses[0].length;
        assert.ok(Math.abs(expectedValue - actualValue) < 1e-7, "Expected length: " + expectedValue + ", actual: " + actualValue);
    });
    
    QUnit.test("Cannot parse a string that contains a competitor with an unrecognised course unit", function (assert) {
        var person = getPerson();
        person.courseLengthUnit = "furlong";
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that that contains a CourseLength with an invalid unit");
    });
    
    QUnit.test("Can parse a string that contains a non-competitive competitor", function (assert) {
        var person = getPerson();
        person.competitive = false;
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        var eventData = parseEventData(xml);
        var competitor = getSingleCompetitor(assert, eventData);
        assert.strictEqual(competitor.isNonCompetitive, true);
    });
    
    QUnit.test("Cannot parse a string that contains a competitor with a split missing a sequence number", function (assert) {
        var person = getPerson();
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        xml = xml.replace('sequence="2"', '');
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that that contains a split time missing a sequence number");
    });
    
    QUnit.test("Cannot parse a string that contains a competitor with a split with an invalid sequence number", function (assert) {
        var person = getPerson();
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        xml = xml.replace('sequence="2"', 'sequence="This is not a number"');
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that that contains a split time with an invalid sequence number");
    });
    
    QUnit.test("Can parse a string that uses alternative element name for control codes", function (assert) {
        var person = getPerson();
        person.competitive = false;
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        xml = xml.replace(/ControlCode>/g, "Control>");
        var eventData = parseEventData(xml);
        assert.strictEqual(eventData.courses.length, 1);
        var course = eventData.courses[0];
        assert.deepEqual(course.controls, person.controls);
    });
    
    QUnit.test("Cannot parse a string that contains a competitor with a split with a missing control code", function (assert) {
        var person = getPerson();
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        xml = xml.replace('<ControlCode>' + person.controls[1] + '</ControlCode>', '');
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that that contains a split time with a missing control code");
    });
    
    QUnit.test("Cannot parse a string that contains a competitor with a split with a missing time", function (assert) {
        var person = getPerson();
        var xml = getSingleClassSingleCompetitorXml("Test Class", person);
        xml = xml.replace('<Time>' + formatTime(person.cumTimes[1]) + '</Time>', '');
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that that contains a split with a missing time");
    });
    
    QUnit.test("Cannot parse a string that contains a competitor that mispunched a control", function (assert) {
        var person = getPerson();
        person.cumTimes[1] = null;
        var eventData = parseEventData(getSingleClassSingleCompetitorXml("Test Class", person));
        var competitor = getSingleCompetitor(assert, eventData);
        assert.deepEqual(competitor.getAllOriginalCumulativeTimes(), [0].concat(person.cumTimes).concat([person.totalTime]));
        assert.ok(!competitor.completed());
    });
    
    QUnit.test("Cannot parse a string that contains a class with two competitors with different numbers of controls", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Fred";
        person2.surname = "Jones";
        person2.controls.push("199");
        person2.cumTimes.push(person2.cumTimes[2] + 177);
        person2.totalTime = person2.cumTimes[2] + 177 + 94;
        var xml = getSingleClassMultiCompetitorXml("Test Class", [person1, person2]);
        assertInvalidData(assert, xml, "Exception should be thrown attempting to parse XML that that contains a class with two competitors with different numbers of controls");
    });
    
    QUnit.test("Can parse a string that contains two classes each with one competitor", function (assert) {
        var person1 = getPerson();
        var person2 = getPerson();
        person2.forename = "Fred";
        person2.surname = "Jones";
        person2.controls.push("199");
        person2.cumTimes.push(person2.cumTimes[2] + 177);
        person2.totalTime = person2.cumTimes[2] + 177 + 94;
        var persons = [person1, person2];
        var xml = HEADER + '<ResultList>' + IOF_VERSION;
        xml += '<ClassResult>' + classXml("Test Class 1") + getPersonResultXml(person1) + "</ClassResult>";
        xml += '<ClassResult>' + classXml("Test Class 2") + getPersonResultXml(person2) + "</ClassResult>";
        xml += '</ResultList>\n';
        var eventData = parseEventData(xml);
        assert.strictEqual(eventData.courses.length, 2);
        assert.strictEqual(eventData.classes.length, 2);
        
        for (var i = 0; i < 2; i += 1) {
            assert.deepEqual(eventData.classes[i].course, eventData.courses[i]);
            assert.deepEqual(eventData.courses[i].classes, [eventData.classes[i]]);
            assert.strictEqual(eventData.classes[i].competitors.length, 1);
            assert.deepEqual(eventData.classes[i].competitors[0].name, persons[i].forename + " " + persons[i].surname);
        }
    });
})();