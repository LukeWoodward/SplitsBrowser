/*
 *  SplitsBrowser HTML - Reads in HTML-format results data files.
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

    const isNotNull = SplitsBrowser.isNotNull;
    const throwInvalidData = SplitsBrowser.throwInvalidData;
    const throwWrongFileFormat = SplitsBrowser.throwWrongFileFormat;
    const parseCourseLength = SplitsBrowser.parseCourseLength;
    const normaliseLineEndings = SplitsBrowser.normaliseLineEndings;
    const parseTime = SplitsBrowser.parseTime;
    const fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    const Competitor = SplitsBrowser.Model.Competitor;
    const CourseClass = SplitsBrowser.Model.CourseClass;
    const Course = SplitsBrowser.Model.Course;
    const Event = SplitsBrowser.Model.Event;

    // Regexps to help with parsing.
    const HTML_TAG_STRIP_REGEXP = /<[^>]+>/g;
    const DISTANCE_FIND_REGEXP = /([0-9.,]+)\s*(?:Km|km)/;
    const CLIMB_FIND_REGEXP = /(\d+)\s*(?:Cm|Hm|hm|m)/;

    /**
     * Returns whether the given string is nonempty.
     * @param {String} string The string to check.
     * @return {Boolean} True if the string is neither null nor empty, false if it is null
     *     or empty.
     */
    function isNonEmpty(string) {
        return string !== null && string !== "";
    }

    /**
     * Returns whether the given string contains a number.  The string is
     * considered to contain a number if, after stripping whitespace, the string
     * is not empty and calling isFinite on it returns true.
     * @param {String} string The string to test.
     * @return {Boolean} True if the string contains a number, false if not.
     */
    function hasNumber(string) {
        string = string.trim();
        // isFinite is not enough on its own: isFinite("") is true.
        return string !== "" && isFinite(string);
    }

    /**
     * Splits a line by whitespace.
     * @param {String} line The line to split.
     * @return {Array} Array of whitespace-separated strings.
     */
    function splitByWhitespace(line) {
        return line.split(/\s+/g).filter(isNonEmpty);
    }

    /**
     * Strips all HTML tags from a string and returns the remaining string.
     * @param {String} text The HTML string to strip tags from.
     * @return {String} The input string with HTML tags removed.
     */
    function stripHtml(text) {
        return text.replace(HTML_TAG_STRIP_REGEXP, "");
    }

    /**
     * Returns all matches of the given regexp within the given text,
     * after being stripped of HTML.
     *
     * Note that it is recommended to pass this function a new regular
     * expression each time, rather than using a precompiled regexp.
     *
     * @param {RegExp} regexp The regular expression to find all matches of.
     * @param {String} text The text to search for matches within.
     * @return {Array} Array of strings representing the HTML-stripped regexp
     *     matches.
     */
    function getHtmlStrippedRegexMatches(regexp, text) {
        let matches = [];
        let match;
        while (true) {
            match = regexp.exec(text);
            if (match === null) {
                break;
            } else {
                matches.push(stripHtml(match[1]));
            }
        }

        return matches;
    }

    /**
     * Returns the contents of all <font> ... </font> elements within the given
     * text.  The contents of the <font> elements are stripped of all other HTML
     * tags.
     * @param {String} text The HTML string containing the <font> elements.
     * @return {Array} Array of strings of text inside <font> elements.
     */
    function getFontBits(text) {
        return getHtmlStrippedRegexMatches(/<font[^>]*>(.*?)<\/font>/g, text);
    }

    /**
     * Returns the contents of all <td> ... </td> elements within the given
     * text.  The contents of the <td> elements are stripped of all other HTML
     * tags.
     * @param {String} text The HTML string containing the <td> elements.
     * @return {Array} Array of strings of text inside <td> elements.
     */
    function getTableDataBits(text) {
        return getHtmlStrippedRegexMatches(/<td[^>]*>(.*?)<\/td>/g, text).map(s => s.trim());
    }

    /**
     * Returns the contents of all <td> ... </td> elements within the given
     * text.  The contents of the <td> elements are stripped of all other HTML
     * tags.  Empty matches are removed.
     * @param {String} text The HTML string containing the <td> elements.
     * @return {Array} Array of strings of text inside <td> elements.
     */
    function getNonEmptyTableDataBits(text) {
        return getTableDataBits(text).filter(bit => bit !== "");
    }

    /**
     * Returns the contents of all <th> ... </th> elements within the given
     * text.  The contents of the <th> elements are stripped of all other HTML
     * tags.  Empty matches are removed.
     * @param {String} text The HTML string containing the <td> elements.
     * @return {Array} Array of strings of text inside <td> elements.
     */
    function getNonEmptyTableHeaderBits(text) {
        let matches = getHtmlStrippedRegexMatches(/<th[^>]*>(.*?)<\/th>/g, text);
        return matches.filter(bit => bit !== "");
    }

    /**
     * Attempts to read a course distance from the given string.
     * @param {String} text The text string to read a course distance from.
     * @return {Number|null} The parsed course distance, or null if no
     *     distance could be parsed.
     */
    function tryReadDistance(text) {
        let distanceMatch = DISTANCE_FIND_REGEXP.exec(text);
        if (distanceMatch === null) {
            return null;
        } else {
            return parseCourseLength(distanceMatch[1]);
        }
    }

    /**
     * Attempts to read a course climb from the given string.
     * @param {String} text The text string to read a course climb from.
     * @return {Number|null} The parsed course climb, or null if no climb
     *     could be parsed.
     */
    function tryReadClimb(text) {
        let climbMatch = CLIMB_FIND_REGEXP.exec(text);
        if (climbMatch === null) {
            return null;
        } else {
            return parseInt(climbMatch[1], 10);
        }
    }

    /**
     * Reads control codes from an array of strings.  Each code should be of the
     * form num(code), with the exception of the finish, which, if it appears,
     * should contain no parentheses and must be the last.  The finish is
     * returned as null.
     * @param {Array} labels Array of string labels.
     * @return {Array} Array of control codes, with null indicating the finish.
     */
    function readControlCodes(labels) {
        let controlCodes = [];
        for (let labelIdx = 0; labelIdx < labels.length; labelIdx += 1) {
            let label = labels[labelIdx];
            let parenPos = label.indexOf("(");
            if (parenPos > -1 && label[label.length - 1] === ")") {
                let controlCode = label.substring(parenPos + 1, label.length - 1);
                controlCodes.push(controlCode);
            } else if (labelIdx + 1 === labels.length) {
                controlCodes.push(null);
            } else {
                throwInvalidData(`Unrecognised control header label: '${label}'`);
            }
        }

        return controlCodes;
    }

    /**
     * Removes from the given arrays of cumulative and split times any 'extra'
     * controls.
     *
     * An 'extra' control is a control that a competitor punches without it
     * being a control on their course.  Extra controls are indicated by the
     * split 'time' beginning with an asterisk.
     *
     * This method does not return anything, instead it mutates the arrays
     * given.
     *
     * @param {Array} cumTimes Array of cumulative times.
     * @param {Array} splitTimes Array of split times.
     */
    function removeExtraControls(cumTimes, splitTimes) {
        while (splitTimes.length > 0 && splitTimes[splitTimes.length - 1][0] === "*") {
            splitTimes.splice(splitTimes.length - 1, 1);
            cumTimes.splice(cumTimes.length - 1, 1);
        }
    }

    /**
     * Represents the result of parsing lines of competitor data.  This can
     * represent intermediate data as well as complete data.
     * @constructor
     * @param {String} name The name of the competitor.
     * @param {String} club The name of the competitor's club.
     * @param {String} className The class of the competitor.
     * @param {Number|null} totalTime The total time taken by the competitor, or
     *     null for no total time.
     * @param {Array} cumTimes Array of cumulative split times.
     * @param {Boolean} competitive Whether the competitor's run is competitive.
     */
    class CompetitorParseRecord {
        constructor(name, club, className, totalTime, cumTimes, competitive) {
            this.name = name;
            this.club = club;
            this.className = className;
            this.totalTime = totalTime;
            this.cumTimes = cumTimes;
            this.competitive = competitive;
        }

        /**
         * Returns whether this competitor record is a 'continuation' record.
         * A continuation record is one that has no name, club, class name or total
         * time.  Instead it represents the data read from lines of data other than
         * the first two.
         * @return {Boolean} True if the record is a continuation record, false if not.
         */
        isContinuation() {
            return (this.name === "" && this.club === "" && this.className === null && this.totalTime === "" && !this.competitive);
        }

        /**
         * Appends the cumulative split times in another CompetitorParseRecord to
         * this one.  The one given must be a 'continuation' record.
         * @param {CompetitorParseRecord} other The record whose cumulative times
         *     we wish to append.
         */
        append(other) {
            if (other.isContinuation()) {
                this.cumTimes = this.cumTimes.concat(other.cumTimes);
            } else {
                throw new Error("Can only append a continuation CompetitorParseRecord");
            }
        }

        /**
         * Creates a Result object from this CompetitorParseRecord object.
         * @param {Number} order The number of this result within their class
         *     (1=first, 2=second, ...).
         * @return {Result} Converted result object.
         */
        toResult(order) {
            // Prepend a zero cumulative time.
            let cumTimes = [0].concat(this.cumTimes);

            // The null is for the start time.
            let result = fromOriginalCumTimes(order, null, cumTimes, new Competitor(this.name, this.club));
            if (result.completed() && !this.competitive) {
                result.setNonCompetitive();
            }

            if (!result.hasAnyTimes()) {
                result.setNonStarter();
            }

            return result;
        }
    }


    /*
     * There are three types of HTML format supported by this parser: one that is
     * based on pre-formatted text, one that is based around a single HTML table,
     * and one that uses many HTML tables.  The overall strategy when parsing
     * any format is largely the same, but the exact details vary.
     *
     * A 'Recognizer' is used to handle the finer details of the format parsing.
     * A recognizer should contain methods 'isTextOfThisFormat',
     * 'preprocess', 'canIgnoreThisLine', 'isCourseHeaderLine',
     * 'parseCourseHeaderLine', 'parseControlsLine' and 'parseCompetitor'.
     * See the documentation on the objects below for more information about
     * what these methods do.
     */

    /**
     * A Recognizer that handles the 'older' HTML format based on preformatted
     * text.
     * @constructor
     */
    class OldHtmlFormatRecognizer {
        constructor() {
            // There exists variations of the format depending on what the second
            // <font> ... </font> element on each row contains.  It can be blank,
            // contain a number (start number, perhaps?) or something else.
            // If blank or containing a number, the competitor's name is in column
            // 2 and there are four preceding columns.  Otherwise the competitor's
            // name is in column 1 and there are three preceding columns.
            this.precedingColumnCount = null;
        }

        /**
         * Returns whether this recognizer is likely to recognize the given HTML
         * text and possibly be able to parse it.  If this method returns true, the
         * parser will use this recognizer to attempt to parse the HTML.  If it
         * returns false, the parser will not use this recognizer.  Other methods on
         * this object can therefore assume that this method has returned true.
         *
         * As this recognizer is for recognizing preformatted text which also uses a
         * lot of &lt;font&gt; elements, it simply checks for the presence of
         * HTML &lt;pre&gt; and &lt;font&gt; elements.
         *
         * @param {String} text The entire input text read in.
         * @return {Boolean} True if the text contains any pre-formatted HTML, false
         *     otherwise.
         */
        isTextOfThisFormat(text) {
            return (text.includes("<pre>") && text.includes("<font"));
        }

        /**
         * Performs some pre-processing on the text before it is read in.
         *
         * This object strips everything up to and including the opening
         * &lt;pre&gt; tag, and everything from the closing &lt;/pre&gt; tag
         * to the end of the text.
         *
         * @param {String} text The HTML text to preprocess.
         * @return {String} The preprocessed text.
         */
        preprocess(text) {
            let prePos = text.indexOf("<pre>");
            if (prePos === -1) {
                throw new Error("Cannot find opening pre tag");
            }

            let lineEndPos = text.indexOf("\n", prePos);
            text = text.substring(lineEndPos + 1);

            // Replace blank lines.
            text = text.replace(/\n{2,}/g, "\n");

            let closePrePos = text.lastIndexOf("</pre>");
            if (closePrePos === -1) {
                throwInvalidData("Found opening <pre> but no closing </pre>");
            }

            lineEndPos = text.lastIndexOf("\n", closePrePos);
            text = text.substring(0, lineEndPos);
            return text.trim();
        }

        /**
         * Returns whether the HTML parser can ignore the given line altogether.
         *
         * The parser will call this method with every line read in, apart from
         * the second line of each pair of competitor data rows.  These are always
         * assumed to be in pairs.
         *
         * This recognizer ignores only blank lines.
         *
         * @param {String} line The line to check.
         * @return {Boolean} True if the line should be ignored, false if not.
         */
        canIgnoreThisLine(line) {
            return line === "";
        }

        /**
         * Returns whether the given line is the first line of a course.
         *
         * If so, it means the parser has finished processing the previous course
         * (if any), and can start a new course.
         *
         * This recognizer treats a line with exactly two
         * &lt;font&gt;...&lt;/font&gt; elements as a course header line, and
         * anything else not.
         *
         * @param {String} line The line to check.
         * @return {Boolean} True if this is the first line of a course, false
         *     otherwise.
         */
        isCourseHeaderLine(line) {
            return (getFontBits(line).length === 2);
        }

        /**
         * Parse a course header line and return the course name, distance and
         * climb.
         *
         * This method can assume that the line given is a course header line.
         *
         * @param {String} line The line to parse course details from.
         * @return {Object} Object containing the parsed course details.
         */
        parseCourseHeaderLine(line) {
            let bits = getFontBits(line);
            if (bits.length !== 2) {
                throw new Error("Course header line should have two parts");
            }

            let nameAndControls = bits[0];
            let distanceAndClimb = bits[1];

            let openParenPos = nameAndControls.indexOf("(");
            let courseName = (openParenPos > -1) ? nameAndControls.substring(0, openParenPos) : nameAndControls;

            let distance = tryReadDistance(distanceAndClimb);
            let climb = tryReadClimb(distanceAndClimb);

            return {
                name: courseName.trim(),
                distance: distance,
                climb: climb
            };
        }

        /**
         * Parse control codes from the given line and return a list of them.
         *
         * This method can assume that the previous line was the course header or a
         * previous control line.  It should also return null for the finish, which
         * should have no code.  The finish is assumed to he the last.
         *
         * @param {String} line The line to parse control codes from.
         * @return {Array} Array of control codes.
         */
        parseControlsLine(line) {
            let lastFontPos = line.lastIndexOf("</font>");
            let controlsText = (lastFontPos === -1) ? line : line.substring(lastFontPos + "</font>".length);

            let controlLabels = splitByWhitespace(controlsText.trim());
            return readControlCodes(controlLabels);
        }

        /**
         * Read either cumulative or split times from the given line of competitor
         * data.
         * (This method is not used by the parser, only elsewhere in the recognizer.)
         * @param {String} line The line to read the times from.
         * @return {Array} Array of times.
         */
        readCompetitorSplitDataLine(line) {
            for (let i = 0; i < this.precedingColumnCount; i += 1) {
                let closeFontPos = line.indexOf("</font>");
                line = line.substring(closeFontPos + "</font>".length);
            }

            let times = splitByWhitespace(stripHtml(line));
            return times;
        }

        /**
         * Parse two lines of competitor data into a CompetitorParseRecord object
         * containing the data.
         * @param {String} firstLine The first line of competitor data.
         * @param {String} secondLine The second line of competitor data.
         * @return {CompetitorParseRecord} The parsed competitor.
         */
        parseCompetitor(firstLine, secondLine) {
            let firstLineBits = getFontBits(firstLine);
            let secondLineBits = getFontBits(secondLine);

            if (this.precedingColumnCount === null) {
                // If column 1 is blank or a number, we have four preceding
                // columns.  Otherwise we have three.
                let column1 = firstLineBits[1].trim();
                this.precedingColumnCount = (column1.match(/^\d*$/)) ? 4 : 3;
            }

            let competitive = hasNumber(firstLineBits[0]);
            let name = firstLineBits[this.precedingColumnCount - 2].trim();
            let totalTime = firstLineBits[this.precedingColumnCount - 1].trim();
            let club = secondLineBits[this.precedingColumnCount - 2].trim();

            let cumulativeTimes = this.readCompetitorSplitDataLine(firstLine);
            let splitTimes = this.readCompetitorSplitDataLine(secondLine);
            cumulativeTimes = cumulativeTimes.map(parseTime);

            removeExtraControls(cumulativeTimes, splitTimes);

            let className = null;
            if (name !== null && name !== "") {
                let lastCloseFontPos = -1;
                for (let i = 0; i < this.precedingColumnCount; i += 1) {
                    lastCloseFontPos = firstLine.indexOf("</font>", lastCloseFontPos + 1);
                }

                let firstLineUpToLastPreceding = firstLine.substring(0, lastCloseFontPos + "</font>".length);
                let firstLineMinusFonts = firstLineUpToLastPreceding.replace(/<font[^>]*>(.*?)<\/font>/g, "");
                let lineParts = splitByWhitespace(firstLineMinusFonts);
                if (lineParts.length > 0) {
                    className = lineParts[0];
                }
            }

            return new CompetitorParseRecord(name, club, className, totalTime, cumulativeTimes, competitive);
        }
    }

    /**
     * Constructs a recognizer for formatting the 'newer' format of HTML
     * event results data.
     *
     * Data in this format is given within a number of HTML tables, three per
     * course.
     * @constructor
     */
    class NewHtmlFormatRecognizer {
        constructor() {
            this.timesOffset = null;
        }

        /**
         * Returns whether this recognizer is likely to recognize the given HTML
         * text and possibly be able to parse it.  If this method returns true, the
         * parser will use this recognizer to attempt to parse the HTML.  If it
         * returns false, the parser will not use this recognizer.  Other methods on
         * this object can therefore assume that this method has returned true.
         *
         * As this recognizer is for recognizing HTML formatted in tables, it
         * returns whether the number of HTML &lt;table&gt; tags is at least five.
         * Each course uses three tables, and there are two HTML tables before the
         * courses.
         *
         * @param {String} text The entire input text read in.
         * @return {Boolean} True if the text contains at least five HTML table
         *     tags.
         */
        isTextOfThisFormat(text) {
            let tablePos = -1;
            for (let i = 0; i < 5; i += 1) {
                tablePos = text.indexOf("<table", tablePos + 1);
                if (tablePos === -1) {
                    // Didn't find another table.
                    return false;
                }
            }

            return true;
        }

        /**
         * Performs some pre-processing on the text before it is read in.
         *
         * This recognizer performs a fair amount of pre-processing, to remove
         * parts of the file we don't care about, and to reshape what there is left
         * so that it is in a more suitable form to be parsed.
         *
         * @param {String} text The HTML text to preprocess.
         * @return {String} The preprocessed text.
         */
        preprocess(text) {
            // Remove the first table and end of the <div> it is contained in.
            let tableEndPos = text.indexOf("</table>");
            if (tableEndPos === -1) {
                throwInvalidData("Could not find any closing </table> tags");
            }

            text = text.substring(tableEndPos + "</table>".length);

            let closeDivPos = text.indexOf("</div>");
            let openTablePos = text.indexOf("<table");
            if (closeDivPos > -1 && closeDivPos < openTablePos) {
                text = text.substring(closeDivPos + "</div>".length);
            }

            // Rejig the line endings so that each row of competitor data is on its
            // own line, with table and table-row tags starting on new lines,
            // and closing table and table-row tags at the end of lines.
            text = text.replace(/>\n+</g, "><").replace(/><tr>/g, ">\n<tr>").replace(/<\/tr></g, "</tr>\n<")
                .replace(/><table/g, ">\n<table").replace(/<\/table></g, "</table>\n<");

            // Remove all <col> elements.
            text = text.replace(/<\/col[^>]*>/g, "");

            // Remove all rows that contain only a single non-breaking space.
            // In the file I have, the &nbsp; entities are missing their
            // semicolons.  However, this could well be fixed in the future.
            text = text.replace(/<tr[^>]*><td[^>]*>(?:<nobr>)?&nbsp;?(?:<\/nobr>)?<\/td><\/tr>/g, "");

            // Remove any anchor elements used for navigation...
            text = text.replace(/<a id="[^"]*"><\/a>/g, "");

            // ... and the navigation div.  Use [\s\S] to match everything
            // including newlines - JavaScript regexps have no /s modifier.
            text = text.replace(/<div id="navigation">[\s\S]*?<\/div>/g, "");

            // Finally, remove the trailing </body> and </html> elements.
            text = text.replace("</body></html>", "");

            return text.trim();
        }

        /**
         * Returns whether the HTML parser can ignore the given line altogether.
         *
         * The parser will call this method with every line read in, apart from
         * the second line of each pair of competitor data rows.  These are always
         * assumed to be in pairs.  This recognizer takes advantage of this to scan
         * the course header tables to see if class names are included.
         *
         * This recognizer ignores blank lines. It also ignores any that contain
         * opening or closing HTML table tags.  This is not a problem because the
         * preprocessing has ensured that the table data is not in the same line.
         *
         * @param {String} line The line to check.
         * @return {Boolean} True if the line should be ignored, false if not.
         */
        canIgnoreThisLine(line) {
            if (line.indexOf("<th>") > -1) {
                let bits = getNonEmptyTableHeaderBits(line);
                this.timesOffset = bits.length;
                return true;
            } else {
                return (line === "" || line.includes("<table") || line.includes("</table>"));
            }
        }

        /**
         * Returns whether the given line is the first line of a course.
         *
         * If so, it means the parser has finished processing the previous course
         * (if any), and can start a new course.
         *
         * This recognizer treats a line that contains a table-data cell with ID
         * "header" as the first line of a course.
         *
         * @param {String} line The line to check.
         * @return {Boolean} True if this is the first line of a course, false
         *     otherwise.
         */
        isCourseHeaderLine(line) {
            return line.includes('<td id="header"');
        }

        /**
         * Parse a course header line and return the course name, distance and
         * climb.
         *
         * This method can assume that the line given is a course header line.
         *
         * @param {String} line The line to parse course details from.
         * @return {Object} Object containing the parsed course details.
         */
        parseCourseHeaderLine(line) {
            let dataBits = getNonEmptyTableDataBits(line);
            if (dataBits.length === 0) {
                throwInvalidData("No parts found in course header line");
            }

            let name = dataBits[0];
            let openParenPos = name.indexOf("(");
            if (openParenPos > -1) {
                name = name.substring(0, openParenPos);
            }

            name = name.trim();

            let distance = null;
            let climb = null;

            for (let bitIndex = 1; bitIndex < dataBits.length; bitIndex += 1) {
                if (distance === null) {
                    distance = tryReadDistance(dataBits[bitIndex]);
                }

                if (climb === null) {
                    climb = tryReadClimb(dataBits[bitIndex]);
                }
            }

            return { name: name, distance: distance, climb: climb };
        }

        /**
         * Parse control codes from the given line and return a list of them.
         *
         * This method can assume that the previous line was the course header or a
         * previous control line.  It should also return null for the finish, which
         * should have no code.  The finish is assumed to he the last.
         *
         * @param {String} line The line to parse control codes from.
         * @return {Array} Array of control codes.
         */
        parseControlsLine(line) {
            let bits = getNonEmptyTableDataBits(line);
            return readControlCodes(bits);
        }

        /**
         * Read either cumulative or split times from the given line of competitor
         * data.
         * (This method is not used by the parser, only elsewhere in the recognizer.)
         * @param {String} line The line to read the times from.
         * @return {Array} Array of times.
         */
        readCompetitorSplitDataLine(line) {
            let bits = getTableDataBits(line);

            let startPos = this.timesOffset;

            // Discard the empty bits at the end.
            let endPos = bits.length;
            while (endPos > 0 && bits[endPos - 1] === "") {
                endPos -= 1;
            }

            return bits.slice(startPos, endPos).filter(isNonEmpty);
        }

        /**
         * Parse two lines of competitor data into a CompetitorParseRecord object
         * containing the data.
         * @param {String} firstLine The first line of competitor data.
         * @param {String} secondLine The second line of competitor data.
         * @return {CompetitorParseRecord} The parsed competitor.
         */
        parseCompetitor(firstLine, secondLine) {
            let firstLineBits = getTableDataBits(firstLine);
            let secondLineBits = getTableDataBits(secondLine);

            let competitive = hasNumber(firstLineBits[0]);
            let nameOffset = (this.timesOffset === 3) ? 1 : 2;
            let name = firstLineBits[nameOffset];
            let totalTime = firstLineBits[this.timesOffset - 1];
            let club = secondLineBits[nameOffset];

            let className = (this.timesOffset === 5 && name !== "") ? firstLineBits[3] : null;

            let cumulativeTimes = this.readCompetitorSplitDataLine(firstLine);
            let splitTimes = this.readCompetitorSplitDataLine(secondLine);
            cumulativeTimes = cumulativeTimes.map(parseTime);

            removeExtraControls(cumulativeTimes, splitTimes);

            let nonZeroCumTimeCount = cumulativeTimes.filter(isNotNull).length;

            if (nonZeroCumTimeCount !== splitTimes.length) {
                throwInvalidData(`Cumulative and split times do not have the same length: ${nonZeroCumTimeCount} cumulative times, ${splitTimes.length} split times`);
            }

            return new CompetitorParseRecord(name, club, className, totalTime, cumulativeTimes, competitive);
        }
    }

    /**
     * Constructs a recognizer for formatting an HTML format supposedly from
     * 'OEvent'.
     *
     * Data in this format is contained within a single HTML table, with another
     * table before it containing various (ignored) header information.
     * @constructor
     */
    class OEventTabularHtmlFormatRecognizer {
        constructor() {
            this.usesClasses = false;
        }

        /**
         * Returns whether this recognizer is likely to recognize the given HTML
         * text and possibly be able to parse it.  If this method returns true, the
         * parser will use this recognizer to attempt to parse the HTML.  If it
         * returns false, the parser will not use this recognizer.  Other methods on
         * this object can therefore assume that this method has returned true.
         *
         * As this recognizer is for recognizing HTML formatted in precisely two
         * tables, it returns whether the number of HTML &lt;table&gt; tags is
         * two.  If fewer than two tables are found, or more than two, this method
         * returns false.
         *
         * @param {String} text The entire input text read in.
         * @return {Boolean} True if the text contains precisely two HTML table
         *     tags.
         */
        isTextOfThisFormat(text) {
            let table1Pos = text.indexOf("<table");
            if (table1Pos >= 0) {
                let table2Pos = text.indexOf("<table", table1Pos + 1);
                if (table2Pos >= 0) {
                    let table3Pos = text.indexOf("<table", table2Pos + 1);
                    if (table3Pos < 0) {
                        // Format characterised by precisely two tables.
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * Performs some pre-processing on the text before it is read in.
         *
         * This recognizer performs a fair amount of pre-processing, to remove
         * parts of the file we don't care about, and to reshape what there is left
         * so that it is in a more suitable form to be parsed.
         *
         * @param {String} text The HTML text to preprocess.
         * @return {String} The preprocessed text.
         */
        preprocess(text) {
            // Remove the first table.
            let tableEndPos = text.indexOf("</table>");
            if (tableEndPos === -1) {
                throwInvalidData("Could not find any closing </table> tags");
            }

            if (text.indexOf('<td colspan="25">') >= 0) {
                // The table has 25 columns with classes and 24 without.
                this.usesClasses = true;
            }

            text = text.substring(tableEndPos + "</table>".length);

            // Remove all rows that contain only a single non-breaking space.
            text = text.replace(/<tr[^>]*><td colspan=[^>]*>&nbsp;<\/td><\/tr>/g, "");

            // Replace blank lines.
            text = text.replace(/\n{2,}/g, "\n");

            // Finally, remove the trailing </body> and </html> elements.
            text = text.replace("</body>", "").replace("</html>", "");

            return text.trim();
        }

        /**
         * Returns whether the HTML parser can ignore the given line altogether.
         *
         * The parser will call this method with every line read in, apart from
         * the second line of each pair of competitor data rows.  These are always
         * assumed to be in pairs.
         *
         * This recognizer ignores blank lines. It also ignores any that contain
         * opening or closing HTML table tags or horizontal-rule tags.
         *
         * @param {String} line The line to check.
         * @return {Boolean} True if the line should be ignored, false if not.
         */
        canIgnoreThisLine(line) {
            return (line === "" || line.includes("<table") || line.includes("</table>")|| line.includes("<hr>"));
        }

        /**
         * Returns whether the given line is the first line of a course.
         *
         * If so, it means the parser has finished processing the previous course
         * (if any), and can start a new course.
         *
         * This recognizer treats a line that contains a table-row cell with class
         * "clubName" as the first line of a course.
         *
         * @param {String} line The line to check.
         * @return {Boolean} True if this is the first line of a course, false
         *     otherwise.
         */
        isCourseHeaderLine(line) {
            return line.includes('<tr class="clubName"');
        }

        /**
         * Parse a course header line and return the course name, distance and
         * climb.
         *
         * This method can assume that the line given is a course header line.
         *
         * @param {String} line The line to parse course details from.
         * @return {Object} Object containing the parsed course details.
         */
        parseCourseHeaderLine(line) {
            let dataBits = getNonEmptyTableDataBits(line);
            if (dataBits.length === 0) {
                throwInvalidData("No parts found in course header line");
            }

            let part = dataBits[0];

            let name, distance, climb;
            let match = /^(.*?)\s+\((\d+)m,\s*(\d+)m\)$/.exec(part);
            if (match === null) {
                // Assume just course name.
                name = part;
                distance = null;
                climb = null;
            } else {
                name = match[1];
                distance = parseInt(match[2], 10) / 1000;
                climb = parseInt(match[3], 10);
            }

            return { name: name.trim(), distance: distance, climb: climb };
        }

        /**
         * Parse control codes from the given line and return a list of them.
         *
         * This method can assume that the previous line was the course header or a
         * previous control line.  It should also return null for the finish, which
         * should have no code.  The finish is assumed to he the last.
         *
         * @param {String} line The line to parse control codes from.
         * @return {Array} Array of control codes.
         */
        parseControlsLine(line) {
            let bits = getNonEmptyTableDataBits(line);
            return bits.map(bit => {
                let dashPos = bit.indexOf("-");
                return (dashPos === -1) ? null : bit.substring(dashPos + 1);
            });
        }

        /**
         * Read either cumulative or split times from the given line of competitor
         * data.
         * (This method is not used by the parser, only elsewhere in the recognizer.)
         * @param {Array} bits Array of all contents of table elements.
         * @return {Array} Array of times.
         */
        readCompetitorSplitDataLine(bits) {
            let startPos = (this.usesClasses) ? 5 : 4;

            // Discard the empty bits at the end.
            let endPos = bits.length;
            while (endPos > 0 && bits[endPos - 1] === "") {
                endPos -= 1;
            }

            // Alternate cells contain ranks, which we're not interested in.
            let timeBits = [];
            for (let index = startPos; index < endPos; index += 2) {
                let bit = bits[index];
                if (isNonEmpty(bit)) {
                    timeBits.push(bit);
                }
            }

            return timeBits;
        }

        /**
         * Parse two lines of competitor data into a CompetitorParseRecord object
         * containing the data.
         * @param {String} firstLine The first line of competitor data.
         * @param {String} secondLine The second line of competitor data.
         * @return {CompetitorParseRecord} The parsed competitor.
         */
        parseCompetitor(firstLine, secondLine) {
            let firstLineBits = getTableDataBits(firstLine);
            let secondLineBits = getTableDataBits(secondLine);

            let competitive = hasNumber(firstLineBits[0]);
            let name = firstLineBits[2];
            let totalTime = firstLineBits[(this.usesClasses) ? 4 : 3];
            let className = (this.usesClasses && name !== "") ? firstLineBits[3] : null;
            let club = secondLineBits[2];

            // If there is any cumulative time with a blank corresponding split
            // time, use a placeholder value for the split time.  Typically this
            // happens when a competitor has punched one control but not the
            // previous.
            for (let index = ((this.usesClasses) ? 5 : 4); index < firstLineBits.length && index < secondLineBits.length; index += 2) {
                if (firstLineBits[index] !== "" && secondLineBits[index] === "") {
                    secondLineBits[index] = "----";
                }
            }

            let cumulativeTimes = this.readCompetitorSplitDataLine(firstLineBits);
            let splitTimes = this.readCompetitorSplitDataLine(secondLineBits);
            cumulativeTimes = cumulativeTimes.map(parseTime);

            removeExtraControls(cumulativeTimes, splitTimes);

            if (cumulativeTimes.length !== splitTimes.length) {
                throwInvalidData("Cumulative and split times do not have the same length: " + cumulativeTimes.length + " cumulative times, " + splitTimes.length + " split times");
            }

            return new CompetitorParseRecord(name, club, className, totalTime, cumulativeTimes, competitive);
        }
    }

    /**
     * Represents the partial result of parsing a course.
     * @constructor
     * @param {String} name The name of the course.
     * @param {Number|null} distance The distance of the course in kilometres,
     *     if known, else null.
     * @param {Number|null} climb The climb of the course in metres, if known,
     *     else null.
     */
    class CourseParseRecord {
        constructor(name, distance, climb) {
            this.name = name;
            this.distance = distance;
            this.climb = climb;
            this.controls = [];
            this.competitors = [];
        }

        /**
         * Adds the given list of control codes to those built up so far.
         * @param {Array} controls Array of control codes read.
         */
        addControls(controls) {
            this.controls = this.controls.concat(controls);
        }

        /**
         * Returns whether the course has all of the controls it needs.
         * The course has all its controls if its last control is the finish, which
         * is indicated by a null control code.
         * @return {Boolean} True if the course has all of its controls, including
         *     the finish, false otherwise.
         */
        hasAllControls() {
            return this.controls.length > 0 && this.controls[this.controls.length - 1] === null;
        }

        /**
         * Adds a competitor record to the collection held by this course.
         * @param {CompetitorParseRecord} competitor The competitor to add.
         */
        addCompetitor(competitor) {
            if (!competitor.competitive && competitor.cumTimes.length === this.controls.length - 1) {
                // Odd quirk of the format: mispunchers may have their finish split
                // missing, i.e. not even '-----'.  If it looks like this has
                // happened, fill the gap by adding a missing time for the finish.
                competitor.cumTimes.push(null);
            }

            if (parseTime(competitor.totalTime) === null && competitor.cumTimes.length === 0) {
                while (competitor.cumTimes.length < this.controls.length) {
                    competitor.cumTimes.push(null);
                }
            }

            if (competitor.cumTimes.length === this.controls.length) {
                this.competitors.push(competitor);
            } else {
                throwInvalidData(`Competitor '${competitor.name}' should have ${this.controls.length} cumulative times, but has ${competitor.cumTimes.length} times`);
            }
        }
    }

    /**
     * A parser that is capable of parsing event data in a given HTML format.
     * @constructor
     * @param {Object} recognizer The recognizer to use to parse the HTML.
     */
    class HtmlFormatParser {
        constructor(recognizer) {
            this.recognizer = recognizer;
            this.courses = [];
            this.currentCourse = null;
            this.lines = null;
            this.linePos = -1;
            this.currentCompetitor = null;
        }

        /**
         * Attempts to read the next unread line from the data given.  If the end of
         * the data has been read, null will be returned.
         * @return {String|null} The line read, or null if the end of the data has
         *     been reached.
         */
        tryGetLine() {
            if (this.linePos + 1 < this.lines.length) {
                this.linePos += 1;
                return this.lines[this.linePos];
            } else {
                return null;
            }
        }

        /**
         * Adds the current competitor being constructed to the current course, and
         * clear the current competitor.
         *
         * If there is no current competitor, nothing happens.
         */
        addCurrentCompetitorIfNecessary() {
            if (this.currentCompetitor !== null) {
                this.currentCourse.addCompetitor(this.currentCompetitor);
                this.currentCompetitor = null;
            }
        }

        /**
         * Adds the current competitor being constructed to the current course, and
         * the current course being constructed to the list of all courses.
         *
         * If there is no current competitor nor no current course, nothing happens.
         */
        addCurrentCompetitorAndCourseIfNecessary() {
            this.addCurrentCompetitorIfNecessary();
            if (this.currentCourse !== null) {
                this.courses.push(this.currentCourse);
            }
        }

        /**
         * Reads in data for one competitor from two lines of the input data.
         *
         * The first of the two lines will be given; the second will be read.
         * @param {String} firstLine The first of the two lines to read the
         *     competitor data from.
         */
        readCompetitorLines(firstLine) {
            let secondLine = this.tryGetLine();
            if (secondLine === null) {
                throwInvalidData("Hit end of input data unexpectedly while parsing competitor: first line was '" + firstLine + "'");
            }

            let competitorRecord = this.recognizer.parseCompetitor(firstLine, secondLine);
            if (competitorRecord.isContinuation()) {
                if (this.currentCompetitor === null) {
                    throwInvalidData("First row of competitor data has no name nor time");
                } else {
                    this.currentCompetitor.append(competitorRecord);
                }
            } else {
                this.addCurrentCompetitorIfNecessary();
                this.currentCompetitor = competitorRecord;
            }
        }

        /**
         * Returns whether the classes are unique within courses.  If so, they can
         * be used to subdivide courses.  If not, CourseClasses and Courses must be
         * the same.
         * @return {Boolean} True if no two competitors in the same class are on
         *     different classes, false otherwise.
         */
        areClassesUniqueWithinCourses() {
            let classesToCoursesMap = new Map();
            for (let courseIndex = 0; courseIndex < this.courses.length; courseIndex += 1) {
                let course = this.courses[courseIndex];
                for (let competitorIndex = 0; competitorIndex < course.competitors.length; competitorIndex += 1) {
                    let competitor = course.competitors[competitorIndex];
                    if (classesToCoursesMap.has(competitor.className)) {
                        if (classesToCoursesMap.get(competitor.className) !== course.name) {
                            return false;
                        }
                    } else {
                        classesToCoursesMap.set(competitor.className, course.name);
                    }
                }
            }

            return true;
        }

        /**
         * Reads through all of the intermediate parse-record data and creates an
         * Event object with all of the courses and classes.
         * @return {Event} Event object containing all of the data.
         */
        createOverallEventObject() {
            // There is a complication here regarding classes.  Sometimes, classes
            // are repeated within multiple courses.  In this case, ignore the
            // classes given and create a CourseClass for each set.
            let classesUniqueWithinCourses = this.areClassesUniqueWithinCourses();

            let newCourses = [];
            let classes = [];

            let competitorsHaveClasses = this.courses.every(course =>
                course.competitors.every(competitor => isNotNull(competitor.className)));

            for (let course of this.courses) {
                // Firstly, sort competitors by class.
                let classToCompetitorsMap = new Map();
                for (let competitor of course.competitors) {
                    let className = (competitorsHaveClasses && classesUniqueWithinCourses) ? competitor.className : course.name;
                    if (classToCompetitorsMap.has(className)) {
                        classToCompetitorsMap.get(className).push(competitor);
                    } else {
                        classToCompetitorsMap.set(className, [competitor]);
                    }
                }

                let classesForThisCourse = [];

                for (let className of classToCompetitorsMap.keys()) {
                    let numControls = course.controls.length - 1;
                    let oldCompetitors = classToCompetitorsMap.get(className);
                    let newResults = oldCompetitors.map((competitor, index) => competitor.toResult(index + 1));
                    let courseClass = new CourseClass(className, numControls, newResults);
                    classesForThisCourse.push(courseClass);
                    classes.push(courseClass);
                }

                let newCourse = new Course(course.name, classesForThisCourse, course.distance, course.climb, course.controls.slice(0, course.controls.length - 1));
                newCourses.push(newCourse);
                for (let courseClass of classesForThisCourse) {
                    courseClass.setCourse(newCourse);
                }
            }

            // Empty array is for warnings, which aren't supported by the HTML
            // format parsers.
            return new Event(classes, newCourses, []);
        }

        /**
         * Parses the given HTML text containing results data into an Event object.
         * @param {String} text The HTML text to parse.
         * @return {Event} Event object containing all the parsed data.
         */
        parse(text) {
            this.lines = text.split("\n");
            while (true) {
                let line = this.tryGetLine();
                if (line === null) {
                    break;
                } else if (this.recognizer.canIgnoreThisLine(line)) {
                    // Do nothing - recognizer says we can ignore this line.
                } else if (this.recognizer.isCourseHeaderLine(line)) {
                    this.addCurrentCompetitorAndCourseIfNecessary();
                    let courseObj = this.recognizer.parseCourseHeaderLine(line);
                    this.currentCourse = new CourseParseRecord(courseObj.name, courseObj.distance, courseObj.climb);
                } else if (this.currentCourse === null) {
                    // Do nothing - still not found the start of the first course.
                } else if (this.currentCourse.hasAllControls()) {
                    // Course has all of its controls; read competitor data.
                    this.readCompetitorLines(line);
                } else {
                    let controls = this.recognizer.parseControlsLine(line);
                    this.currentCourse.addControls(controls);
                }
            }

            this.addCurrentCompetitorAndCourseIfNecessary();

            if (this.courses.length === 0) {
                throwInvalidData("No competitor data was found");
            }

            let eventData = this.createOverallEventObject();
            return eventData;
        }
    }

    const RECOGNIZER_CLASSES = [OldHtmlFormatRecognizer, NewHtmlFormatRecognizer, OEventTabularHtmlFormatRecognizer];

    SplitsBrowser.Input.Html = {};

    /**
     * Attempts to parse data as one of the supported HTML formats.
     *
     * If the data appears not to be HTML data, a WrongFileFormat exception
     * is thrown.  If the data appears to be HTML data but is invalid in some
     * way, an InvalidData exception is thrown.
     *
     * @param {String} data The string containing event data.
     * @return {Event} The parsed event.
     */
    SplitsBrowser.Input.Html.parseEventData = function (data) {
        data = normaliseLineEndings(data);
        for (let recognizerIndex = 0; recognizerIndex < RECOGNIZER_CLASSES.length; recognizerIndex += 1) {
            let RecognizerClass = RECOGNIZER_CLASSES[recognizerIndex];
            let recognizer = new RecognizerClass();
            if (recognizer.isTextOfThisFormat(data)) {
                data = recognizer.preprocess(data);
                let parser = new HtmlFormatParser(recognizer);
                let parsedEvent = parser.parse(data);
                return parsedEvent;
            }
        }

        // If we get here, the format wasn't recognized.
        throwWrongFileFormat("No HTML recognizers recognised this as HTML they could parse");
    };
})();
