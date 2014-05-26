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
    var AgeClass = SplitsBrowser.Model.AgeClass;
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
            throwInvalidData("XML data not well-formed: " + e.message);
        }
        
        if ($("> *", $(xml)).length === 0) {
            // PhantomJS doesn't always fail parsing invalid XML; we may be
            // left with 'xml' just containing the DOCTYPE and no root element.
            throwInvalidData("XML data not well-formed: " + xmlString);
        }
        
        return xml;
    }

    /**
    * Check that the XML document passed is in a suitable format for parsing.
    *
    * If any problems arise, this function will throw an exception.  If the
    * data is valid, the function will return normally.
    * @param {XMLDocument} xml - The parsed XML document.
    */
    function validateData(xml) {
        var rootElement = $("> *", xml);        
        var rootElementNodeName = rootElement.prop("tagName");
        
        if (rootElementNodeName !== "ResultList")  {
            throwWrongFileFormat("Root element of XML document does not have expected name 'ResultList', got '" + rootElementNodeName + "'");
        }
        
        var iofVersionElement = $("> IOFVersion", rootElement);
        if (iofVersionElement.length === 0) {
            throwWrongFileFormat("Could not find IOFVersion element");        
        } else { 
            var version = iofVersionElement.attr("version");
            if (isUndefined(version)) {
                throwWrongFileFormat("Version attribute missing from IOFVersion element");
            } else if (version !== "2.0.3") {
                throwWrongFileFormat("IOF data format version 2.0.3 is the only format supported: found '" + version + "'");
            }
        }
        
        var status = rootElement.attr("status");
        if (!isUndefined(status) && status !== "complete") {
            throwInvalidData("Only complete IOF data supported; snapshot and delta are not supported");
        }
    }
    
    /**
    * Parses data for a single competitor.
    * @param {XMLElement} element - XML PersonResult element.
    * @param {Number} number - The competitor number (1 for first in the array
    *     of those read so far, 2 for the second, ...)
    * @return {Object} Object containing the competitor data.
    */
    function parseCompetitor(element, number) {
        var jqElement = $(element);
        var forename = $("> Person > PersonName > Given", jqElement).text();
        var surname = $("> Person > PersonName > Family", jqElement).text();

        var name = null;
        if (forename === "" && surname === "") {
            var personId = $("> PersonId", jqElement).text();
            if (personId === "") {
                throwInvalidData("Cannot read person name nor ID");
            } else {
                name = personId;
            }
        } else {
            name = forename;
            if (forename !== "" && surname !== "") {
                name += " ";
            }
            
            name += surname;
        }
        
        var club = $("> Club > ShortName", jqElement).text();
        
        var resultElement = $("Result", jqElement);
        if (resultElement.length === 0) {
            throwInvalidData("No result found for competitor '" + name + "'");
        }
        
        var startTimeStr = $("> StartTime > Clock", resultElement).text();
        var startTime = (startTimeStr === "") ? null : parseTime(startTimeStr);
        
        var totalTimeStr = $("> Time", resultElement).text();
        var totalTime = (totalTimeStr === "") ? null : parseTime(totalTimeStr);
        
        var lengthElement = $("> CourseLength", resultElement);
        var lengthStr = lengthElement.text();
        var length;
        if (lengthStr === "") {
            length = null;
        } else {
            length = parseInt(lengthStr, 10);
            if (isNaNStrict(length)) {
                throwInvalidData("Invalid course length '" + lengthStr + "'");
            }
            
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
        }
        
        var nonCompetitive = false;
        var statusElement = $("> CompetitorStatus", resultElement);
        if (statusElement.length === 1 && statusElement.attr("value") === "NotCompeting") {
            nonCompetitive = true;
        }
        
        var splitTimes = $("> SplitTime", resultElement);
        var splitData = [];
        for (var index = 0; index < splitTimes.length; index += 1) {
            var splitTimeElement = $(splitTimes[index]);
            var sequenceNumberStr = splitTimeElement.attr("sequence");
            var sequenceNumber = null;
            if (isUndefined(sequenceNumberStr)) {
                throwInvalidData("Missing sequence number for control");
            } else {
                sequenceNumber = parseInt(sequenceNumberStr, 10);
                if (isNaNStrict(sequenceNumber)) {
                    throwInvalidData("Sequence number '" + sequenceNumberStr + "' is not numeric");
                }
            }
            
            var code = $("> ControlCode", splitTimeElement).text();
            if (code === "") {
                code = $("> Control", splitTimeElement).text();
            }
            
            if (code === "") {
                throwInvalidData("Cannot read control code of control with sequence number " + sequenceNumber);
            }
            
            var time = $("> Time", splitTimeElement).text();
            if (time === "") {
                throwInvalidData("Cannot read time of control with sequence number " + sequenceNumber);            
            }
            
            splitData.push({sequenceNumber: sequenceNumber, code: code, time: parseTime(time)});
        }
        
        splitData.sort(function (a, b) { return d3.ascending(a.sequenceNumber, b.sequenceNumber); });
        
        var controls = splitData.map(function (datum) { return datum.code; });
        var cumTimes = splitData.map(function (datum) { return datum.time; });
        
        cumTimes.splice(0, 0, 0); // Prepend a zero time for the start.
        cumTimes.push(totalTime);
        
        var competitor = fromOriginalCumTimes(number, name, club, startTime, cumTimes);
        if (nonCompetitive) {
            competitor.setNonCompetitive();
        }
        
        return {
            competitor: competitor,
            controls: controls,
            length: length
        };
    }
    
    /**
    * Parses data for a single class.
    * @param {XMLElement} element - XML ClassResult element
    * @return {Object} Object containing parsed data.
    */
    function parseClassData(element) {
        var jqElement = $(element);
        var cls = {name: null, competitors: [], controls: [], length: null};
        
        var className = $("> ClassShortName", jqElement).text();
        if (className === "") {
            throwInvalidData("Missing class name");
        }
        
        cls.name = className;
        
        var personResults = $("> PersonResult", jqElement);

        if (personResults.length === 0) {
            throwInvalidData("Class '" + className + "' has no competitors");
        }
        
        for (var index = 0; index < personResults.length; index += 1) {
            var competitor = parseCompetitor(personResults[index], index + 1);
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
    * Parses IOF XML data in the 2.0.3 format and returns the data.
    * @param {String} data - String to parse as XML.
    * @return {Event} Parsed event object.
    */
    function parseEventData(data) {
        if (data.indexOf("IOFdata.dtd") < 0) {
            throwWrongFileFormat("Data apparently not of the IOF XML format");
        }
    
        var xml = parseXml(data);
        
        validateData(xml);
        
        var classResultElements = $("> ResultList > ClassResult", $(xml));
        
        if (classResultElements.length === 0) {
            throwInvalidData("No class result elements found");
        }
        
        var classes = [];
        var courses = [];
        
        for (var index = 0; index < classResultElements.length; index += 1) {
            var parsedClass = parseClassData(classResultElements[index]);
            
            var ageClass = new AgeClass(parsedClass.name, parsedClass.controls.length, parsedClass.competitors);
            // The null value is for the climb.
            var course = new Course(parsedClass.name, [ageClass], parsedClass.length, null, parsedClass.controls);
            ageClass.setCourse(course);
            classes.push(ageClass);
            courses.push(course);
        }
        
        return new Event(classes, courses);
    }
    
    SplitsBrowser.Input.IOFXml = { parseEventData: parseEventData };
})();