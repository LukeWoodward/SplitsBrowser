/*
 *  SplitsBrowser - HTML reader tests.
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
    
    var parseEventData = SplitsBrowser.Input.Html.parseEventData;
    
    QUnit.module("Input.Html");
    
    /**
    * Runs a test for parsing invalid data that should fail.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {String} invalidData - The invalid string to parse.
    * @param {String} what - Description of the invalid data.
    * @param {String} exceptionName - Optional name of the exception (defaults
    *     to InvalidData.
    */
    function runInvalidDataTest(assert, invalidData, what, exceptionName) {
        try {
            parseEventData(invalidData);
            assert.ok(false, "Should throw an exception for parsing " + what);
        } catch (e) {
            assert.strictEqual(e.name, exceptionName || "InvalidData", "Exception should have been InvalidData; message is " + e.message);
        }
    }
    
    /**
    * Asserts that a course has been parsed is as expected.
    *
    * The parameter expectedDetails is an object that contains the properties
    * name, length, climb, controls and classCount, with the last two being
    * optional.
    * @param {QUnit.assert} assert - The QUnit assert object.
    * @param {Course} actualCourse - The parsed course.
    * @param {Object} expectedDetails - The expected details.
    */
    function assertCourse(assert, actualCourse, expectedDetails) {
        if (typeof expectedDetails === "undefined") {
            assert.ok(false, "expectedDetails is not defined - have you forgotten the QUnit assert?");
        }

        assert.strictEqual(actualCourse.name, expectedDetails.name);
        assert.strictEqual(actualCourse.length, expectedDetails.length);
        assert.strictEqual(actualCourse.climb, expectedDetails.climb);
        if (expectedDetails.hasOwnProperty("controls")) {
            assert.deepEqual(actualCourse.controls, expectedDetails.controls);
        }
        if (expectedDetails.hasOwnProperty("classCount")) {
            assert.strictEqual(actualCourse.classes.length, expectedDetails.classCount);
        }
    }
    
    /**
    * Asserts that a class has been parsed as expected.
    *
    * The parameter expectedDetails is an object that contains the properties
    * name, numControls, course and competitorCount.
    *
    * @param {QUnit.assert} assert - The QUnit assert object.
    * @param {CourseClass} actualClass - The parsed class.
    * @param {Object} expectedDetails - The expected details.
    */
    function assertCourseClass(assert, actualClass, expectedDetails) {
        assert.strictEqual(actualClass.name, expectedDetails.name);
        assert.strictEqual(actualClass.numControls, expectedDetails.numControls);
        assert.strictEqual(actualClass.course, expectedDetails.course);
        assert.strictEqual(actualClass.results.length, expectedDetails.competitorCount);
    }
    
    /**
    * Asserts that a result has been parsed as expected.
    *
    * The parameter expectedDetails is an object that contains the properties
    * name, club, totalTime, cumTimes, splitTimes, isNonCompetitive, completed.
    * All seven are optional.
    * 
    * @param {QUnit.assert} assert - The QUnit assert object.
    * @param {CourseClass} actualResult - The parsed result.
    * @param {Object} expectedDetails - The expected details.
    */
    function assertResult(assert, actualResult, expectedDetails) {
        ["name", "club"].forEach(function (propName) {
            if (expectedDetails.hasOwnProperty(propName)) {
                var assertion = (propName === "originalCumTimes" || propName === "originalSplitTimes") ? assert.deepEqual.bind(assert) : assert.strictEqual.bind(assert);
                assertion(actualResult.owner[propName], expectedDetails[propName], "Should have correct value for property '" + propName + "'");    
            }
        });
        
        var resultOptionalProps = ["totalTime", "originalCumTimes", "originalSplitTimes", "isNonCompetitive", "isNonStarter", "isNonFinisher", "isDisqualified"];
        resultOptionalProps.forEach(function (propName) {
            if (expectedDetails.hasOwnProperty(propName)) {
                var assertion = (propName === "originalCumTimes" || propName === "originalSplitTimes") ? assert.deepEqual.bind(assert) : assert.strictEqual.bind(assert);
                assertion(actualResult[propName], expectedDetails[propName], "Should have correct value for property '" + propName + "'");    
            }
        });
        
        if (expectedDetails.hasOwnProperty("completed")) {
            assert.strictEqual(actualResult.completed(), expectedDetails.completed);
        }
    }
    
    QUnit.test("Cannot parse an empty string", function (assert) {
        runInvalidDataTest(assert, "", "an empty string", "WrongFileFormat");
    });
    
    QUnit.test("Cannot parse a string that contains no HTML pre nor table tags", function (assert) {
        runInvalidDataTest(assert, "<html><head></head><body>blah blah blah</body></html>", "a string that contains no <pre> nor <table> tags", "WrongFileFormat");
    });
    
    QUnit.test("Cannot parse a string that contains an HTML pre tag but no font tag", function (assert) {
        runInvalidDataTest(assert, "<html><head></head><body><pre>blah blah blah</pre></body></html>", "a string that contains a <pre> tag but no <font> tags", "WrongFileFormat");
    });
    
    // HTML generation.
    // Old-format (preformatted).
    
    /**
    * Wrap some text in some HTML for an old-format file
    * @param {String} contents - The contents to wrap.
    * @return {String} The contents wrapped up in HTML.
    */
    function cellOld(contents) {
        return '<font size="2"><b>   ' + contents + '</b></font>';
    }
    
    /**
    * Returns an old-format course header line for a course with the given
    * name, length and climb.
    * @param {String} name - The name of the course.
    * @param {Number} length - The length of the course, in kilometres.
    * @param {Number} climb - The climb of the course, in metres.
    * @return {String} The created header line.
    */
    function getCourseHeaderLineOld(name, length, climb) {
        // The number is the number of competitors, which is ignored.
        var header = cellOld(name + " (2)");
        
        var secondCellContents = "";
        if (length !== null) {
            secondCellContents += length + " km";
        }
        
        secondCellContents += "     ";
        
        if (climb !== null) {
            secondCellContents += climb + " m";
        }
        
        header += cellOld(secondCellContents) + "\n";
        return header;
    }
    
    /**
    * Returns a controls-line for an old-format course.
    * @param {Array} codes - Array of control codes.
    * @param {Number} offset - Control number offset.
    * @param {boolean} includeFinish - Whether to add the finish control.
    *     (The finish will always be specified as "F"; don't add a code to the
    *     codes array for this.)
    * @return {String} The created controls-line.
    */
    function getControlsLineOld(codes, offset, includeFinish) {
        var line = cellOld("") + cellOld("");
        line += line;
        
        for (var index = 0; index < codes.length; index += 1) {
            line += "   " + (index + 1 + offset) + "(" + codes[index] + ")  "; 
        }
        
        if (includeFinish) {
            line += "  F  ";
        }
        
        line += "\n";
        
        return line;
    }
    
    /**
    * Returns a pair of lines for one row competitor data in the old format.
    * 
    * For a continuation line, pass empty strings for the position, name, start
    * number, club, class name and time.
    *
    * The arrays of cumulative and split times must have the same length.
    *
    * Each element in the array of extra controls should be an object
    * containing the properties cumTime and controlNum.  The parameter is
    * optional and can be omitted.
    * 
    * @param {String|Number} posn - The position of the competitor.
    * @param {?String} startNum - The start number of the competitor, or
    *     null to skip the first column.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {boolean} useClasses - This parameter is not used.  It is
    *     specified only for compatibility with the other getCompetitorLines
    *     functions.
    * @param {String} className - The name of the competitor's class, or "" to
    *     default to course name.
    * @param {Number} time - The total time of the competitor.
    * @param {Array} cumTimes - Array of cumulative times, as strings.
    * @param {Array} splits - Array of split times, as strings.
    * @param {Array} extras - Optional array of extra splits times.
    * @return {String} Both lines concatenated together.
    */
    function getCompetitorLinesOld(posn, startNum, name, club, useClasses, className, time, cumTimes, splits, extras) {
    
        if (cumTimes.length !== splits.length) {
            throw new Error("Cumulative times and split times must have the same length");
        }
    
        var line1 = cellOld(posn) + ((startNum === null) ? "" : cellOld(startNum)) + cellOld(name) + className + cellOld(time);
        var line2 = cellOld("") + ((startNum === null) ? "" : cellOld("")) + cellOld(club) + cellOld("");
        
        for (var index = 0; index < cumTimes.length; index += 1) {
            var splitTime = (cumTimes[index] === "-----") ? "" : splits[index];
            if (index % 5 === 3) {
                line1 += "  " + cellOld(cumTimes[index]);
                line2 += "  " + cellOld(splitTime);
            } else {
                line1 += "  " + cumTimes[index] + "  ";
                line2 += "  " + splitTime + "  ";
            }
        }
        
        if (extras) {
            for (index = 0; index < extras.length; index += 1) {
                line1 += " <i>  " + extras[index].cumTime + "  </i> ";
                line2 += " <i>  *" + extras[index].controlNum + " </i> ";
            }
        }
    
        return line1 + "\n" + line2 + "\n";
    }
    
    // New (tabular) format.
    
    /**
    * Wrap some text in some HTML for a new-format file
    * @param {String} contents - The contents to wrap.
    * @return {String} The contents wrapped up in HTML.
    */
    function cellNew(contents) {
        return '<td id=c12><nobr>   ' + contents + '</nobr></td>';
    }
    
    /**
    * Returns an new-format course header for a course with the given name,
    * length and climb.
    * @param {String} name - The name of the course.
    * @param {Number} length - The length of the course, in kilometres.
    * @param {Number} climb - The climb of the course, in metres.
    * @return {String} The created header line.
    */
    function getCourseHeaderNew(name, length, climb) {
        var header = '<table width=1105px>\n<tbody>\n<tr>' +
                     cellNew(name + " (21)") +
                     cellNew((length === null) ? "" : length + " Km") +
                     cellNew((climb === null) ? "" : climb + " m") +
                     '<td id="header" ></td>\n</tr>\n</tbody>\n</table>\n';
        return header;
    }
    
    /**
    * Returns a controls-line for a new-format course.
    * @param {Array} codes - Array of control codes.
    * @param {Number} offset - Control number offset.
    * @param {boolean} includeFinish - Whether to add the finish control.
    *     (The finish will always be specified as "F"; don't add a code to the
    *     codes array for this.)
    * @return {String} The created controls-line.
    */
    function getControlsLineNew(codes, offset, includeFinish) {
        var line = cellNew("") + cellNew("");
        line += line;
        
        for (var index = 0; index < codes.length; index += 1) {
            line += cellNew((index + 1 + offset) + "(" + codes[index] + ")  "); 
        }
        
        if (includeFinish) {
            line += cellNew("F");
        }
        
        line = "<tr>" + line + "</tr>\n";
        
        return line;
    }
    
    /**
    * Returns a pair of lines for one row competitor data in the new format.
    * 
    * For a continuation line, pass empty strings for the position, name, start
    * number, club, class name and time.
    *
    * The arrays of cumulative and split times must have the same length.
    *
    * Each element in the array of extra controls should be an object
    * containing the properties cumTime and controlNum.  The parameter is
    * optional and can be omitted.
    * 
    * @param {String|Number} posn - The position of the competitor.
    * @param {String} startNum - The start number of the competitor.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {boolean} useClasses - True to include a cell for the competitor's
    *     class name, false to default class name to course name.
    * @param {String} className - The name of the competitor's class, or "" to
    *     default to course name.
    * @param {Number} time - The total time of the competitor.
    * @param {Array} cumTimes - Array of cumulative times, as strings.
    * @param {Array} splits - Array of split times, as strings.
    * @param {Array} extras - Optional array of extra splits times.
    * @return {String} Both lines concatenated together.
    */
    function getCompetitorLinesNew(posn, startNum, name, club, useClasses, className, time, cumTimes, splits, extras) {
    
        if (cumTimes.length !== splits.length) {
            throw new Error("Cumulative times and split times must have the same length");
        }
    
        var line1 = cellNew(posn) + ((startNum === null) ? "" : cellNew(startNum)) + cellNew(name) + ((useClasses) ? cellNew(className) : "") + cellNew(time);
        var line2 = cellNew("") + ((startNum === null) ? "" : cellNew("")) + cellNew(club) + ((useClasses) ? cellNew("") : "") + cellNew("");
        
        for (var index = 0; index < cumTimes.length; index += 1) {
            var splitTime = (cumTimes[index] === "-----") ? "" : splits[index];
            line1 += "  " + cellNew(cumTimes[index]);
            line2 += "  " + cellNew(splitTime);
        }
        
        if (extras) {
            for (index = 0; index < extras.length; index += 1) {
                line1 += cellNew("") + cellNew("") + cellNew(" <i>  " + extras[index].cumTime + "  </i> ");
                line2 += cellNew("") + cellNew("") + cellNew(" <i>  *" + extras[index].controlNum + " </i> ");
            }
        }
    
        return "<tr>" + line1 + "</tr>\n<tr>" + line2 + "</tr>\n";
    }
    
    var NEW_FORMAT_DATA_HEADER = '<body>\n<div id=reporttop>\n<table width=1105px style="table-layout:auto;">\n<tr><td><nobr>Event title</nobr></td><td id=rb><nobr>Sun 01/02/2013 12:34</nobr></td></tr>\n</table>\n<hr>\n</div>\n<table id=ln><tr><td>&nbsp</td></tr></table>\n';
    
    var NEW_FORMAT_COURSE_HEADER_TABLE_CLASS = "<table width=1105px>\n<col width=32px>\n<col width=39px>\n<col width=133px>\n<thead>\n<tr><th id=rb>Pl</th><th id=rb>Stno</th><th>Name</th><th>Cl.</th><th id=rb>Time</th><th id=rb></th><th id=rb></th></tr>\n</thead><tbody></tbody></table>\n";

    var NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS = "<table width=1105px>\n<col width=32px>\n<col width=39px>\n<col width=133px>\n<thead>\n<tr><th id=rb>Pl</th><th id=rb>Stno</th><th>Name</th><th id=rb>Time</th><th id=rb></th><th id=rb></th></tr>\n</thead><tbody></tbody></table>\n";

    var NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS_NO_STARTNO = "<table width=1105px>\n<col width=32px>\n<col width=39px>\n<col width=133px>\n<thead>\n<tr><th id=rb>Pl</th><th>Name</th><th id=rb>Time</th><th id=rb></th><th id=rb></th></tr>\n</thead><tbody></tbody></table>\n";
    
    var NEW_FORMAT_RESULTS_TABLE_HEADER = "<table width=1105px>\n<col width=32px>\n<col width=39px>\n<col width=133px>\n<tbody>\n";
    
    // Separator used to separate the competitors that completed the course
    // from those that mispunched.
    var NEW_FORMAT_MID_TABLE_SEPARATOR = "<tr><td id=c10><nobr>&nbsp</nobr></td></tr>\n";
    
    var NEW_FORMAT_COURSE_TABLE_FOOTER = NEW_FORMAT_MID_TABLE_SEPARATOR + NEW_FORMAT_MID_TABLE_SEPARATOR + "</tbody>\n</table>\n";
    
    var NEW_FORMAT_DATA_FOOTER = "</body>\n</html>\n";
    
    //  OEvent tabular format.
    
    var OEVENT_FORMAT_HEADER = '<html>\n' +
                               '<head>\n' + 
                               '<META http-equiv="content-type" content="text/html" charset=utf-8>\n' +
                               '<title>Title</title>\n' +
                               '<STYLE type="text/css"></STYLE>\n' +
                               '</head>\n' +
                               '<body>\n' +
                               '<table width="100%" class="header">\n<tr><td>Title</td></tr>\n</table>\n' +
                               '<hr>\n' +
                               '<table>\n';
    
    /**
    * Returns a table cell in the OEvent tabular format.
    * @param {String} contents - The contents of the cell.
    * @return {String} The contents wrapped up in a table-data element.
    */
    function getCellOEventTabular(contents) {
        return '<td  align="right">' + contents + '</td>';
    }
    
    /**
    * Returns a course header line for the OEvent tabular format.
    * @param {String} name - The name of the course.
    * @param {Number} length - The length of the course, in km.
    * @param {Number} climb - The climb of the course, in km.
    * @return {String} Course header line.
    */
    function getCourseHeaderOEventTabular(name, length, climb) {
        var contents;
        if (length === "" || climb === "") {
            contents = name;
        } else {
            var lengthInMetres = Math.round(length * 1000);
            contents = name + '    (' + lengthInMetres + 'm, ' + climb + 'm)';
        }
        return '<tr class="clubName"><td colspan="24">' + contents + '</td></tr>\n';
    }
    
    /**
    * Returns a line of the table that contains the controls.
    * @param {Array} codes - Array of control code strings.
    * @param {Number} offset - The offset to add to the control numbers.
    * @param {boolean} includeFinish - True to include the finish, false to
    *     not include it.
    * @return {String} Line of the table.
    */
    function getControlsLineOEventTabular(codes, offset, includeFinish) {
        var emptyCell = getCellOEventTabular("");
        var line = emptyCell + emptyCell + emptyCell + emptyCell;
        for (var index = 0; index < codes.length; index += 1) {
            line += getCellOEventTabular((index + 1 + offset) + "-" + codes[index]) + emptyCell;
        }
        
        if (includeFinish) {
            line += getCellOEventTabular("F") + emptyCell;
        }
        
        return "<tr>" + line + "</tr>\n";
    }
    
    /**
    * Returns a pair of lines for one row competitor data in the OEvent tabular
    * format.
    * 
    * For a continuation line, pass empty strings for the position, name, start
    * number, club, class name and time.
    *
    * The arrays of cumulative and split times must have the same length.
    *
    * Each element in the array of extra controls should be an object
    * containing the properties cumTime and controlNum.  The parameter is
    * optional and can be omitted.
    * 
    * @param {String|Number} posn - The position of the competitor.
    * @param {String} startNum - The start number of the competitor.
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    * @param {boolean} useClasses - True to include a table cell containing the
    *     class, false to not include the class name cell.
    * @param {String} className - The name of the competitor's class, or "" to
    *     default to course name.
    * @param {Number} time - The total time of the competitor.
    * @param {Array} cumTimes - Array of cumulative times, as strings.
    * @param {Array} splits - Array of split times, as strings.
    * @param {Array} extras - Optional array of extra splits times.
    * @return {String} Both lines concatenated together.
    */
    function getCompetitorLinesOEventTabular(posn, startNum, name, club, useClasses, className, time, cumTimes, splits, extras) {
    
        if (cumTimes.length !== splits.length) {
            throw new Error("Cumulative times and split times must have the same length");
        }
        
        var emptyCell = getCellOEventTabular("");
        var rankCell = getCellOEventTabular("(3)");
        
        var firstLine = "<tr>" + getCellOEventTabular((posn === "") ? "" : (posn + ".")) +
                                 getCellOEventTabular(startNum) +
                                 getCellOEventTabular(name);
                                 
        var secondLine = "<tr>" + emptyCell + emptyCell + getCellOEventTabular(club);
        
        if (useClasses) {
            firstLine += getCellOEventTabular(className);
            secondLine += emptyCell;
        }
        
        firstLine += getCellOEventTabular(time);
        secondLine += emptyCell;
        
        for (var index = 0; index < cumTimes.length; index += 1) {
            var splitTime = (cumTimes[index] === "-----") ? "" : splits[index];
            firstLine += getCellOEventTabular(cumTimes[index]) + ((cumTimes[index] === "-----") ? emptyCell : rankCell);
            secondLine += getCellOEventTabular(splitTime) + ((splitTime === "") ? emptyCell : rankCell);
        }
        
        if (extras) {
            for (index = 0; index < extras.length; index += 1) {
                firstLine += getCellOEventTabular(extras[index].cumTime) + emptyCell;
                secondLine += getCellOEventTabular("*" + extras[index].controlNum) + emptyCell;
            }
        }
        
        firstLine += "</tr>\n";
        secondLine += "</tr>\n";
        return firstLine + secondLine;
    }
    
    var OLD_FORMAT = {
        name: "old format (preformatted)",
        header: "<html><head></head><body>\n<pre>\n<font>Dummy line</font>\n",
        courseHeaderFunc: getCourseHeaderLineOld,
        tableHeaderNoClass: "",
        tableHeaderWithClass: "",        
        controlsLineFunc: getControlsLineOld,
        competitorDataFunc: getCompetitorLinesOld,
        mispuncherSeparator: "",
        tableFooter: "",
        footer: "</pre></body></html>"
    };
    
    var NEW_FORMAT = {
        name: "new format (tabular)",
        header: NEW_FORMAT_DATA_HEADER,
        courseHeaderFunc: getCourseHeaderNew,
        tableHeaderNoClass: NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS + NEW_FORMAT_RESULTS_TABLE_HEADER,
        tableHeaderWithClass: NEW_FORMAT_COURSE_HEADER_TABLE_CLASS + NEW_FORMAT_RESULTS_TABLE_HEADER,
        controlsLineFunc: getControlsLineNew,
        competitorDataFunc: getCompetitorLinesNew,
        mispuncherSeparator: NEW_FORMAT_MID_TABLE_SEPARATOR,
        tableFooter: NEW_FORMAT_MID_TABLE_SEPARATOR + NEW_FORMAT_MID_TABLE_SEPARATOR + "</tbody>\n</table>\n",
        footer: "</body>\n</html>\n"
    };
    
    var OEVENT_FORMAT = {
        name: "OEvent tabular format",
        header: OEVENT_FORMAT_HEADER,
        courseHeaderFunc: getCourseHeaderOEventTabular,
        tableHeaderNoClass: '<tr><td colspan="24">&nbsp;</td></tr>\n',
        tableHeaderWithClass: '<tr><td colspan="25">&nbsp;</td></tr>\n',
        controlsLineFunc: getControlsLineOEventTabular,
        competitorDataFunc: getCompetitorLinesOEventTabular,
        mispuncherSeparator: "",
        tableFooter: "",
        footer: "</table>\n</body>\n</html>"
    };
    
    var ALL_TEMPLATES = [OLD_FORMAT, NEW_FORMAT, OEVENT_FORMAT];
    
    /**
    * Generates HTML from a template and a list of course data.
    *
    * Each course object within the courses array should contain the following:
    * * headerDetails: Array of arguments for header generation function.
    * * controlLines: Array of arrays of control codes, one sub-array per row.
    * * competitors: Array of arrays of data for each competitor.
    * @param {Object} template - The template object that details how to
    *                            construct an HTML file of a given format.
    * @param {Array} courses - Array of course data objects.
    * @param {boolean} useClasses - True to use classes, false not to.
    * @return {String} Created HTML.
    */
    function getHtmlFromTemplate(template, courses, useClasses) {
        var html = template.header;
        courses.forEach(function (course) {
            html += template.courseHeaderFunc.apply(null, course.headerDetails);
            html += (useClasses) ? template.tableHeaderWithClass : template.tableHeaderNoClass;
                    
            var offset = 0;
            course.controlsLines.forEach(function (controlLine, index) {
                var includeFinish = (index + 1 === course.controlsLines.length);
                html += template.controlsLineFunc(controlLine, offset, includeFinish);
                offset += controlLine.length;
            });

            course.competitors.forEach(function (competitor) {
                html += template.competitorDataFunc.apply(null, competitor);
            });
            
            html += template.tableFooter;        
        });
        
        html += template.footer;
        return html;
    }
    
    /**
    * Generates HTML using each available template, parses the resulting HTML,
    * and calls the given checking function on the result.
    *
    * The options supported are:
    * * useClasses (boolean): True to use class names separate from course
    *       names, false otherwise.  Defaults to false.
    * * preprocessor (Function): Function used to preprocess the
    *       HTML before it is parsed.  Defaults to no preprocessing.
    * * templates (Array): Array of templates to use with this parser.
    *       Defaults to all templates.
    * If none of the above three options are required, the options object
    * itself can be omitted.
    *
    * @param {Array} courses - Array of course objects to generate the HTML
    *                          using.
    * @param {Function} checkFunc - Checking function called for each parsed
    *                               event data object.  It is passed the data,
    *                               and also the name of the template used.
    * @param {Object} options - Options object, the contents of which are
    *     described above.
    */
    function runHtmlFormatParseTest(courses, checkFunc, options) {
        var useClasses = (options && options.useClasses) || false;
        var templates = (options && options.templates) || ALL_TEMPLATES;
        templates.forEach(function (template) {
            var html = getHtmlFromTemplate(template, courses, useClasses);
            if (options && options.preprocessor) {
                html = options.preprocessor(html);
            }
            var eventData = parseEventData(html);
            checkFunc(eventData, template.name);
        });
    }
    
    /**
    * Generates HTML using each available template, attempts to parse each
    * generated HTML string and asserts that each attempt fails.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Array} courses - Array of course objects to generate the HTML
    *                          using.
    * @param {boolean} useClasses - True to use classes, false not to.
    */
    function runFailingHtmlFormatParseTest(assert, courses, useClasses) {
        ALL_TEMPLATES.forEach(function (template) {
            var html = getHtmlFromTemplate(template, courses, useClasses);
            runInvalidDataTest(assert, html, "invalid data - " + template.name);
        });
    }
    
    QUnit.test("Cannot parse an empty event in any format", function (assert) {
        runFailingHtmlFormatParseTest(assert, [], false);
    });
    
    QUnit.test("Can parse an event with an empty course in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: []}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 0, "No classes should have been read - " + formatName);
                assertCourse(assert, eventData.courses[0], {name: "Test course 1", length: 2.7, climb: 35, controls: ["138", "152", "141"]});
            });
    });
    
    QUnit.test("Can parse an event with an empty course and non-numeric control code in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "ABC152", "141"]], competitors: []}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 0, "No classes should have been read - " + formatName);
                assertCourse(assert, eventData.courses[0], {name: "Test course 1", length: 2.7, climb: 35, controls: ["138", "ABC152", "141"]});
            });
    });
    
    QUnit.test("Can parse an event with an empty course with length but no climb in two formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", ""], controlsLines: [["138", "152", "141"]], competitors: []}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assertCourse(assert, eventData.courses[0], {name: "Test course 1", length: 2.7, climb: null});
            },
            // Don't run this on the OEvent format, it only supports both
            // length and climb, or neither.
            {templates: [OLD_FORMAT, NEW_FORMAT]});
    });
    
    QUnit.test("Can parse an event with an empty course with length with comma as the decimal separator in two formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2,7", ""], controlsLines: [["138", "152", "141"]], competitors: []}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assertCourse(assert, eventData.courses[0], {name: "Test course 1", length: 2.7, climb: null});
            },
            // Don't run this on the OEvent format, as lengths are in metres
            // and are never comma-separated.
            {templates: [OLD_FORMAT, NEW_FORMAT]});
    });
    
    QUnit.test("Can parse an event with an empty course with length specified in metres in two formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2700", ""], controlsLines: [["138", "152", "141"]], competitors: []}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assertCourse(assert, eventData.courses[0], {name: "Test course 1", length: 2.7, climb: null});
            },
            // Don't run this on the OEvent format as lengths are already in
            // metres.
            {templates: [OLD_FORMAT, NEW_FORMAT]});
    });
    
    QUnit.test("Can parse an event with an empty course with climb but no length in two formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "", "35"], controlsLines: [["138", "152", "141"]], competitors: []}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assertCourse(assert, eventData.courses[0], {name: "Test course 1", length: null, climb: 35});
            },
            // Don't run this on the OEvent format, it only supports both
            // length and climb, or neither.
            {templates: [OLD_FORMAT, NEW_FORMAT]});
    });
    
    QUnit.test("Can parse an event with an empty course with no climb nor length in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "", ""], controlsLines: [["138", "152", "141"]], competitors: []}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assertCourse(assert, eventData.courses[0], {name: "Test course 1", length: null, climb: null});
            });
    });
    
    QUnit.test("Can parse event data with a single course and single competitor in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);

                var courseClass = eventData.classes[0];
                assertCourseClass(assert, courseClass, {name: "Test course 1", numControls: 3, course: eventData.courses[0], competitorCount: 1});
                
                var result = courseClass.results[0];
                assertResult(assert, result, {name: "Test runner", club: "TEST", totalTime: 9 * 60 + 25,
                                              originalCumTimes: [0, 1 * 60 + 47, 4 * 60 +  2, 8 * 60 + 13, 9 * 60 + 25],
                                              originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, 4 * 60 + 11, 1 * 60 + 12],
                                              isNonCompetitive: false, completed: true,
                                              isNonStarter: false, isNonFinisher: false, isDisqualified: false});
                
                var course = eventData.courses[0];
                assertCourse(assert, course, {name: "Test course 1", length: 2.7, climb: 35, controls: ["138", "152", "141"], classCount: 1});
                assert.deepEqual(course.classes[0], courseClass);
            });
    });
    
    QUnit.test("Can parse event data with a single course and single non-starting competitor with no split times in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "dns", [], []]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);

                var courseClass = eventData.classes[0];
                assertCourseClass(assert, courseClass, {name: "Test course 1", numControls: 3, course: eventData.courses[0], competitorCount: 1});
                
                var result = courseClass.results[0];
                assertResult(assert, result, {name: "Test runner", club: "TEST", totalTime: null,
                                              originalCumTimes: [0, null, null, null, null],
                                              originalSplitTimes: [null, null, null, null],
                                              isNonCompetitive: false, completed: false,
                                              isNonStarter: true, isNonFinisher: false, isDisqualified: false});
            });
    });
    
    QUnit.test("Can parse event data with a single course and single competitor with negative split in the old format only", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "03:57", "09:25"], ["01:47", "02:15", "", "05:28"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);

                var courseClass = eventData.classes[0];
                assertCourseClass(assert, courseClass, {name: "Test course 1", numControls: 3, course: eventData.courses[0], competitorCount: 1});
                
                var result = courseClass.results[0];
                assertResult(assert, result, {name: "Test runner", club: "TEST", totalTime: 9 * 60 + 25,
                                              originalCumTimes: [0, 1 * 60 + 47, 4 * 60 +  2, 3 * 60 + 57, 9 * 60 + 25],
                                              originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, -5, 5 * 60 + 28],
                                              isNonCompetitive: false, completed: true});
                
                var course = eventData.courses[0];
                assertCourse(assert, course, {name: "Test course 1", length: 2.7, climb: 35, controls: ["138", "152", "141"], classCount: 1});
                assert.deepEqual(course.classes[0], courseClass);
            },
            {templates: [OLD_FORMAT]});
    });
    
    QUnit.test("Can parse event data with a single course and single competitor with plenty of blank lines in the old format only", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "03:57", "09:25"], ["01:47", "02:15", "", "05:28"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);

                var courseClass = eventData.classes[0];
                assertCourseClass(assert, courseClass, {name: "Test course 1", numControls: 3, course: eventData.courses[0], competitorCount: 1});
            },
            {
                templates: [OLD_FORMAT],
                preprocessor: function (html) {
                    // Six newlines (the length of the closing tag) should be enough
                    // to trigger the bug that caused this.
                    return html.replace("</pre>", "\n\n\n\n\n\n</pre>\n");
                }
            });
    });
    
    QUnit.test("Can parse event data with a single course and single competitor in a different class in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", true, "Class1", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);
                assert.strictEqual(eventData.classes[0].name, "Class1");
            },
            {useClasses: true});
    });
    
    QUnit.test("Can parse event data with a single course and single competitor ignoring extra controls in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"],
                    [{cumTime: "03:31", controlNum: "151"}, {cumTime: "08:44", controlNum: "133"}]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);

                var courseClass = eventData.classes[0];
                assertCourseClass(assert, courseClass, {name: "Test course 1", numControls: 3, course: eventData.courses[0], competitorCount: 1});
        
                var result = courseClass.results[0];
                assertResult(assert, result, {name: "Test runner", club: "TEST", totalTime: 9 * 60 + 25,
                                              originalCumTimes: [0, 1 * 60 + 47, 4 * 60 +  2, 8 * 60 + 13, 9 * 60 + 25],
                                              originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, 4 * 60 + 11, 1 * 60 + 12],
                                              isNonCompetitive: false, completed: true});
        
                var course = eventData.courses[0];
                assertCourse(assert, course, {name: "Test course 1", length: 2.7, climb: 35, controls: ["138", "152", "141"], classCount: 1});
                assert.deepEqual(course.classes[0], courseClass);
            });
    });
    
    // The zero split time with a decimal point turns up in event 6752.
    QUnit.test("Can parse event data with a single course and single competitor ignoring extra control with invalid cumulative time in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"],
                    [{cumTime: "0.00", controlNum: "133"}]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);
            });
    });
    
    QUnit.test("Can parse event data with a single course and two competitors in the same class in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner 1", "TEST", true, "Class1", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]],
                ["2", "184", "Test runner 2", "ABCD", true, "Class1", "09:59", ["01:52", "04:05", "08:40", "09:59"], ["01:52", "02:13", "04:35", "01:19"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);

                var courseClass = eventData.classes[0];
                assertCourseClass(assert, courseClass, {name: "Class1", numControls: 3, course: eventData.courses[0], competitorCount: 2});

                assertResult(assert, courseClass.results[0], {name: "Test runner 1", club: "TEST", totalTime: 9 * 60 + 25});
                assertResult(assert, courseClass.results[1], {name: "Test runner 2", club: "ABCD", totalTime: 9 * 60 + 59});

                assert.strictEqual(eventData.courses[0].name, "Test course 1");            
            },
            {useClasses: true});
    });

    QUnit.test("Can parse event data with a single course and two competitors in different classes in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner 1", "TEST", true, "Class1", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]],
                ["2", "184", "Test runner 2", "ABCD", true, "Class2", "09:59", ["01:52", "04:05", "08:40", "09:59"], ["01:52", "02:13", "04:35", "01:19"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 2, "Two classes should have been read - " + formatName);

                var course = eventData.courses[0];
                assert.strictEqual(course.name, "Test course 1");
                
                var courseClass1 = eventData.classes[0];
                assertCourseClass(assert, courseClass1, {name: "Class1", numControls: 3, course: course, competitorCount: 1});
                
                var courseClass2 = eventData.classes[1];
                assertCourseClass(assert, courseClass2, {name: "Class2", numControls: 3, course: course, competitorCount: 1});
                
                assertResult(assert, courseClass1.results[0], {name: "Test runner 1", club: "TEST", totalTime: 9 * 60 + 25});
                assertResult(assert, courseClass2.results[0], {name: "Test runner 2", club: "ABCD", totalTime: 9 * 60 + 59});
            },
            {useClasses: true});
    });
    
    QUnit.test("Can parse event data with two courses and two competitors in different classes in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner 1", "TEST", true, "Class1", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]]
            ]},
            {headerDetails: ["Test course 2", "2.4", "30"], controlsLines: [["132", "143", "139"]], competitors: [
                ["1", "184", "Test runner 2", "ABCD", true, "Class2", "09:59", ["01:52", "04:05", "08:40", "09:59"], ["01:52", "02:13", "04:35", "01:19"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 2, "Two classes should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 2, "Two classes should have been read - " + formatName);

                var course1 = eventData.courses[0];
                assertCourse(assert, course1, {name: "Test course 1", length: 2.7, climb: 35, controls: ["138", "152", "141"]});
                
                var course2 = eventData.courses[1];
                assertCourse(assert, course2, {name: "Test course 2", length: 2.4, climb: 30, controls: ["132", "143", "139"]});
                
                var courseClass1 = eventData.classes[0];
                assertCourseClass(assert, courseClass1, {name: "Class1", numControls: 3, course: course1, competitorCount: 1});
                
                var courseClass2 = eventData.classes[1];
                assertCourseClass(assert, courseClass2, {name: "Class2", numControls: 3, course: course2, competitorCount: 1});
                
                assert.strictEqual(courseClass1.results[0].owner.name, "Test runner 1");
                assert.strictEqual(courseClass2.results[0].owner.name, "Test runner 2");
            },
            {useClasses: true});
    });
    
    QUnit.test("Can parse event data with a two competitors in the same class but different course using course names in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner 1", "TEST", true, "Class1", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]]
            ]},
            {headerDetails: ["Test course 2", "2.7", "35"], controlsLines: [["141", "150", "145"]], competitors: [
                ["2", "184", "Test runner 2", "ABCD", true, "Class1", "09:59", ["01:52", "04:05", "08:40", "09:59"], ["01:52", "02:13", "04:35", "01:19"]]
            ]}],
            function (eventData, formatName) {
                // As the class is shared across courses, it cannot be used, so
                // class names should fall back to course names.
                assert.strictEqual(eventData.classes.length, 2, "Two classes should have been read - " + formatName);
                assert.strictEqual(eventData.classes[0].name, "Test course 1");
                assert.strictEqual(eventData.classes[1].name, "Test course 2");
            },
            {useClasses: true});
    });
    
    QUnit.test("Can parse event data with a single course and single competitor with CRLF line endings in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);
                assert.strictEqual(eventData.classes[0].results.length, 1);
                assert.deepEqual(eventData.courses[0].classes.length, 1);
            },
            {preprocessor: function (html) { return html.replace(/\n/g, "\r\n"); }});
    });
    
    QUnit.test("Can parse event data with a single course and single competitor with doubled line endings in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);
                assert.strictEqual(eventData.classes[0].results.length, 1);
                assert.deepEqual(eventData.courses[0].classes.length, 1);
            },
            {preprocessor: function (html) { return html.replace(/\n/g, "\n\n"); }}
        );
    });
    
    QUnit.test("Can parse event data with a single course and single competitor with CR line endings in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);
                assert.strictEqual(eventData.classes[0].results.length, 1);
                assert.deepEqual(eventData.courses[0].classes.length, 1);
            },
            {preprocessor: function (html) { return html.replace(/\n/g, "\r"); }});
    });
        
    QUnit.test("Can parse event data with a single course and single mispunching competitor in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "-----", "09:25"], ["01:47", "02:15", "-----", "01:12"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);
                var courseClass = eventData.classes[0];
                assert.strictEqual(courseClass.results.length, 1);
                assertResult(assert, courseClass.results[0], {totalTime: null,
                                                              originalCumTimes: [0, 1 * 60 + 47, 4 * 60 + 2, null, 9 * 60 + 25],
                                                              originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, null, null],
                                                              isNonCompetitive: false, completed: false});
            });
    });
    
    QUnit.test("Can parse event data with a single course and single mispunching competitor with missing cumulative split for the finish in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["", "165", "Test runner", "TEST", false, "", "mp", ["01:47", "04:02", "-----"], ["01:47", "02:15", "-----"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);
                var courseClass = eventData.classes[0];
                assert.strictEqual(courseClass.results.length, 1);
                assertResult(assert, courseClass.results[0], {totalTime: null,
                                                              originalCumTimes: [0, 1 * 60 + 47, 4 * 60 + 2, null, null],
                                                              originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, null, null],
                                                              isNonCompetitive: false, completed: false});
            });
    });
    
    QUnit.test("Can parse event data with a single course and single non-competitive competitor in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["", "165", "Test runner", "TEST", false, "", "n/c", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);
                var courseClass = eventData.classes[0];
                assert.strictEqual(courseClass.results.length, 1);
                assertResult(assert, courseClass.results[0], {totalTime: 9 * 60 + 25,
                                                              originalCumTimes: [0, 1 * 60 + 47, 4 * 60 +  2, 8 * 60 + 13, 9 * 60 + 25],
                                                              originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, 4 * 60 + 11, 1 * 60 + 12],
                                                              isNonCompetitive: true, completed: true,
                                                              isNonStarter: false, isNonFinisher: false, isDisqualified: false});
            });
    });
    
    QUnit.test("Can parse event data with a single course and single non-starting competitor in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["", "165", "Test runner", "TEST", false, "", "", ["-----", "-----", "-----", "-----"], ["-----", "-----", "-----", "-----"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);
                var courseClass = eventData.classes[0];
                assert.strictEqual(courseClass.results.length, 1);
                assertResult(assert, courseClass.results[0], {totalTime: null,
                                                              originalCumTimes: [0, null, null, null, null],
                                                              originalSplitTimes: [null, null, null, null],
                                                              isNonCompetitive: false, completed: false,
                                                              isNonStarter: true, isNonFinisher: false, isDisqualified: false});
            });
    });
    
    QUnit.test("Can parse event data with a single course and single competitor with 2 lines' worth of controls in all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"], ["140", "154"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "12:12", ["01:47", "04:02", "08:13"], ["01:47", "02:15", "04:11"]],
                ["", "", "", "", false, "", "", ["09:25", "11:09", "12:12"], ["01:12", "01:44", "01:03"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);

                var courseClass = eventData.classes[0];
                assertCourseClass(assert, courseClass, {name: "Test course 1", numControls: 5, course: eventData.courses[0], competitorCount: 1});
                
                assertResult(assert, courseClass.results[0], {name: "Test runner", club: "TEST", totalTime: 12 * 60 + 12,
                                                              originalCumTimes: [0, 1 * 60 + 47, 4 * 60 +  2, 8 * 60 + 13, 9 * 60 + 25, 11 * 60 + 9, 12 * 60 + 12],
                                                              originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, 4 * 60 + 11, 1 * 60 + 12, 1 * 60 + 44, 1 * 60 + 3],
                                                              isNonCompetitive: false, completed: true});
                
                var course = eventData.courses[0];
                assertCourse(assert, course, {name: "Test course 1", length: 2.7, climb: 35, controls: ["138", "152", "141", "140", "154"], classCount: 1});
                assert.deepEqual(course.classes[0], courseClass);
            });
    });
    
    QUnit.test("Can parse event data with a single course and single competitor with separate class name and 2 lines' worth of controls in the all formats", function (assert) {
        runHtmlFormatParseTest(
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"], ["140", "154"]], competitors: [
                ["1", "165", "Test runner", "TEST", true, "Class1", "12:12", ["01:47", "04:02", "08:13"], ["01:47", "02:15", "04:11"]],
                ["", "", "", "", true, "", "", ["09:25", "11:09", "12:12"], ["01:12", "01:44", "01:03"]]
            ]}],
            function (eventData, formatName) {
                assert.strictEqual(eventData.courses.length, 1, "One course should have been read - " + formatName);
                assert.strictEqual(eventData.classes.length, 1, "One class should have been read - " + formatName);

                var courseClass = eventData.classes[0];
                assertCourseClass(assert, courseClass, {name: "Class1", numControls: 5, course: eventData.courses[0], competitorCount: 1});
                
                assertResult(assert, courseClass.results[0], {name: "Test runner", club: "TEST", totalTime: 12 * 60 + 12,
                                                              originalCumTimes: [0, 1 * 60 + 47, 4 * 60 +  2, 8 * 60 + 13, 9 * 60 + 25, 11 * 60 + 9, 12 * 60 + 12],
                                                              originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, 4 * 60 + 11, 1 * 60 + 12, 1 * 60 + 44, 1 * 60 + 3],
                                                              isNonCompetitive: false, completed: true});
                
                var course = eventData.courses[0];
                assertCourse(assert, course, {name: "Test course 1", length: 2.7, climb: 35, controls: ["138", "152", "141", "140", "154"], classCount: 1});
                assert.deepEqual(course.classes[0], courseClass);
            },
            {useClasses: true});
    });
    
    QUnit.test("Cannot parse event data in each format where the competitor has the wrong number of cumulative times", function (assert) {
        runFailingHtmlFormatParseTest(
            assert,
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"], ["140", "154"]], competitors: [
                ["1", "165", "Test runner", "TEST", false, "", "12:12", ["01:47", "04:02", "08:13"], ["01:47", "02:15", "04:11"]]
            ]}],
            false);
    });
    
    QUnit.test("Cannot parse event data in each format where the first row of competitor details are all blank", function (assert) {
        runFailingHtmlFormatParseTest(
            assert,
            [{headerDetails: ["Test course 1", "2.7", "35"], controlsLines: [["138", "152", "141"]], competitors: [
                ["", "", "", "", false, "", "", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]]
            ]}],
            false);
    });
    
    // Format-specific tests.
    
    QUnit.test("Cannot parse a string that contains an opening pre tag but no closing pre tag", function (assert) {
        runInvalidDataTest(assert, "<html><head></head><body>\n<pre>\n<font>blah blah blah</font>\n</body></html>", "a string that contains <pre> but not </pre>", "InvalidData");
    });

    QUnit.test("Cannot read event data without any closing table elements", function (assert) {
        var html = NEW_FORMAT_DATA_HEADER.replace(/<\/table>/g, "") + "<table><table><table>" + NEW_FORMAT_DATA_FOOTER;
        runInvalidDataTest(assert, html, "no closing-table elements");
    });
    
    // Format-specific as handles a quirk of the old format.
    QUnit.test("Can parse event data with a single course and single valid competitor with no start number", function (assert) {
        var html = OLD_FORMAT.header +
                   getCourseHeaderLineOld("Test course 1", "2.7", "35") +
                   getControlsLineOld(["138", "152", "141"], 0, true) +
                   getCompetitorLinesOld("1", null, "Test runner 1", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]) +
                   OLD_FORMAT.footer;
        var eventData = parseEventData(html);
        assert.strictEqual(eventData.courses.length, 1, "One course should have been read");
        assert.strictEqual(eventData.classes.length, 1, "One class should have been read");
        var courseClass = eventData.classes[0];
        assert.strictEqual(courseClass.results.length, 1, "One competitor should should have been read");
        assertResult(assert, courseClass.results[0], {name: "Test runner 1", totalTime: 9 * 60 + 25,
                                                      originalCumTimes: [0, 1 * 60 + 47, 4 * 60 +  2, 8 * 60 + 13, 9 * 60 + 25],
                                                      originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, 4 * 60 + 11, 1 * 60 + 12],
                                                      isNonCompetitive: false, completed: true});
    });
    
    // Needs to remain format-specific as the newlines can only be inserted at specific locations.
    QUnit.test("Can parse event data with a single course and single competitor with extra blank lines in the old format", function (assert) {
        var html = "<html><head></head><body>\n<pre>\n\n\n" +
                   getCourseHeaderLineOld("Test course 1", "2.7", "35") + "\n" +
                   getControlsLineOld(["138", "152", "141"], 0, true) + "\n\n\n\n\n\n" +
                   getCompetitorLinesOld("1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]) + "\n\n\n" +
                   "</pre></body></html>\n\n\n\n";
        var eventData = parseEventData(html);
        assert.strictEqual(eventData.courses.length, 1, "One course should have been read");
        assert.strictEqual(eventData.classes.length, 1, "One class should have been read");
        assert.strictEqual(eventData.classes[0].results.length, 1);
        assert.deepEqual(eventData.courses[0].classes.length, 1);
    });
    
    QUnit.test("Can parse event data with a single course and single competitor with extra blank lines in the new format", function (assert) {
        var html = NEW_FORMAT_DATA_HEADER + 
                   getCourseHeaderNew("Test course 1", "2.7", "35") + "\n" +
                   NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS + NEW_FORMAT_RESULTS_TABLE_HEADER +
                   getControlsLineNew(["138", "152", "141"], 0, true) + "\n\n\n\n\n\n" +
                   getCompetitorLinesNew("1", "165", "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]) + "\n\n\n" +
                   NEW_FORMAT_COURSE_TABLE_FOOTER + NEW_FORMAT_DATA_FOOTER;
        var eventData = parseEventData(html);
        assert.strictEqual(eventData.courses.length, 1, "One course should have been read");
        assert.strictEqual(eventData.classes.length, 1, "One class should have been read");
        assert.strictEqual(eventData.classes[0].results.length, 1);
        assert.deepEqual(eventData.courses[0].classes.length, 1);
    });

    // Needs to remain format-specific as the string manipulation is format-specific.
    QUnit.test("Cannot parse event data in the old format where the second line of a competitor is missing", function (assert) {
        var html = "<html><head></head><body>\n<pre>\n" +
                   getCourseHeaderLineOld("Test course 1", "2.7", "35") +
                   getControlsLineOld(["138", "152", "141"], 0, true) +
                   getCompetitorLinesOld("1", "165", "Test runner", "TEST0123", false, "", "12:12", ["01:47", "04:02", "08:13"], ["01:47", "02:15", "04:11"]);
                   
        var clubIndex = html.indexOf("TEST0123");
        var lastNewlineIndex = html.lastIndexOf("\n", clubIndex);
        html = html.substring(0, lastNewlineIndex) + "\n</pre></body></html>";
        runInvalidDataTest(assert, html, "data with a missing second line of competitor data");
    });

    QUnit.test("Cannot parse event data in the new format where the second line of a competitor is missing", function (assert) {
        var html = NEW_FORMAT_DATA_HEADER + 
                   getCourseHeaderNew("Test course 1", "2.7", "35") +
                   NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS + NEW_FORMAT_RESULTS_TABLE_HEADER +
                   getControlsLineNew(["138", "152", "141"], 0, true) +
                   getCompetitorLinesNew("1", "165", "Test runner", "TEST0123", false, "", "12:12", ["01:47", "04:02", "08:13"], ["01:47", "02:15", "04:11"]);
                   
        var clubIndex = html.indexOf("TEST0123");
        var lastNewlineIndex = html.lastIndexOf("\n", clubIndex);
        html = html.substring(0, lastNewlineIndex) + NEW_FORMAT_COURSE_TABLE_FOOTER + NEW_FORMAT_DATA_FOOTER;
        runInvalidDataTest(assert, html, "data with a missing second line of competitor data");
    });
    
    QUnit.test("Can parse event data with a single course and single valid and single mispunching competitor with mid-table separator", function (assert) {
        var html = NEW_FORMAT_DATA_HEADER +
                   getCourseHeaderNew("Test course 1", "2.7", "35") +
                   NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS + NEW_FORMAT_RESULTS_TABLE_HEADER +
                   getControlsLineNew(["138", "152", "141"], 0, true) +
                   getCompetitorLinesNew("1", "165", "Test runner 1", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]) +
                   NEW_FORMAT_MID_TABLE_SEPARATOR + 
                   getCompetitorLinesNew("", "182", "Test runner 2", "ABCD", false, "", "mp", ["01:47", "04:02", "-----"], ["01:47", "02:15", "-----"]) +
                   NEW_FORMAT_COURSE_TABLE_FOOTER + NEW_FORMAT_DATA_FOOTER;
        var eventData = parseEventData(html);
        assert.strictEqual(eventData.courses.length, 1, "One course should have been read");
        assert.strictEqual(eventData.classes.length, 1, "One class should have been read");
        var courseClass = eventData.classes[0];
        assert.strictEqual(courseClass.results.length, 2, "Two competitors should should have been read");
        assertResult(assert, courseClass.results[1], {name: "Test runner 2", totalTime: null,
                                                      originalCumTimes: [0, 1 * 60 + 47, 4 * 60 +  2, null, null],
                                                      originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, null, null],
                                                      isNonCompetitive: false, completed: false});
    });
    
    QUnit.test("Can parse event data with a single course and single valid and single mispunching competitor with corrected mid-table separator", function (assert) {
        var html = NEW_FORMAT_DATA_HEADER +
                   getCourseHeaderNew("Test course 1", "2.7", "35") +
                   NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS + NEW_FORMAT_RESULTS_TABLE_HEADER +
                   getControlsLineNew(["138", "152", "141"], 0, true) +
                   getCompetitorLinesNew("1", "165", "Test runner 1", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]) +
                   NEW_FORMAT_MID_TABLE_SEPARATOR.replace(/&nbsp/g, "&nbsp;") + 
                   getCompetitorLinesNew("", "165", "Test runner 2", "ABCD", false, "", "mp", ["01:47", "04:02", "-----"], ["01:47", "02:15", "-----"]) +
                   NEW_FORMAT_COURSE_TABLE_FOOTER + NEW_FORMAT_DATA_FOOTER;
        var eventData = parseEventData(html);
        assert.strictEqual(eventData.courses.length, 1, "One course should have been read");
        assert.strictEqual(eventData.classes.length, 1, "One class should have been read");
        var courseClass = eventData.classes[0];
        assert.strictEqual(courseClass.results.length, 2, "Two competitors should should have been read");
        assertResult(assert, courseClass.results[1], {name: "Test runner 2", totalTime: null,
                                                      originalCumTimes: [0, 1 * 60 + 47, 4 * 60 +  2, null, null],
                                                      originalSplitTimes: [1 * 60 + 47, 2 * 60 + 15, null, null],
                                                      isNonCompetitive: false, completed: false});
    });
    
    QUnit.test("Can parse event data with two courses and navigation elements", function (assert) {
        var html = NEW_FORMAT_DATA_HEADER +
                   '<a id="1"></a>' +
                   getCourseHeaderNew("Test course 1", "2.7", "35") +
                   NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS + NEW_FORMAT_RESULTS_TABLE_HEADER +
                   getControlsLineNew(["138", "152", "141"], 0, true) +
                   getCompetitorLinesNew("1", "165", "Test runner 1", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]) +
                   NEW_FORMAT_COURSE_TABLE_FOOTER +
                   '<a id="2"></a>' +
                   getCourseHeaderNew("Test course 2", "2.7", "35") +
                   NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS + NEW_FORMAT_RESULTS_TABLE_HEADER +
                   getControlsLineNew(["164", "107", "133"], 0, true) +
                   getCompetitorLinesNew("", "165", "Test runner 2", "ABCD", false, "", "09:58", ["01:47", "04:02", "05:27", "09:58"], ["01:47", "02:15", "01:25", "04:31"]) +
                   NEW_FORMAT_COURSE_TABLE_FOOTER +
                   '<div id="navigation">\n<table>\n' +
                   '<tr>\n<td>etc. etc. etc.</td>\n</tr>\n' +
                   '</table>\n</div>\n' +
                   NEW_FORMAT_DATA_FOOTER;
        var eventData = parseEventData(html);
        assert.strictEqual(eventData.courses.length, 2, "Two courses should have been read");
        assert.strictEqual(eventData.classes.length, 2, "Two classes should have been read");
        assert.strictEqual(eventData.classes[0].results.length, 1, "One competitor should should have been read for course 1");
        assert.strictEqual(eventData.classes[1].results.length, 1, "One competitor should should have been read for course 2");
    });
    
    QUnit.test("Can parse event data in new-format with no start numbers", function (assert) {
        var html = NEW_FORMAT_DATA_HEADER + 
                   getCourseHeaderNew("Test course 1", "2.7", "35") + "\n" +
                   NEW_FORMAT_COURSE_HEADER_TABLE_NO_CLASS_NO_STARTNO + NEW_FORMAT_RESULTS_TABLE_HEADER +
                   getControlsLineNew(["138", "152", "141"], 0, true) + "\n\n\n\n\n\n" +
                   getCompetitorLinesNew("1", null, "Test runner", "TEST", false, "", "09:25", ["01:47", "04:02", "08:13", "09:25"], ["01:47", "02:15", "04:11", "01:12"]) + "\n\n\n" +
                   NEW_FORMAT_COURSE_TABLE_FOOTER + NEW_FORMAT_DATA_FOOTER;
        var eventData = parseEventData(html);
        assert.strictEqual(eventData.courses.length, 1, "One course should have been read");
        assert.strictEqual(eventData.classes.length, 1, "One class should have been read");
        assert.strictEqual(eventData.classes[0].results.length, 1);
        assert.strictEqual(eventData.classes[0].results[0].owner.name, "Test runner");
        assert.strictEqual(eventData.classes[0].results[0].owner.club, "TEST");
        assert.deepEqual(eventData.courses[0].classes.length, 1);
    });
})();