/*
 *  SplitsBrowser ResultsTable - Shows class results in a table.
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
    
    var formatTime = SplitsBrowser.formatTime;
    var compareResults = SplitsBrowser.Model.compareResults;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    var subtractIfNotNull = SplitsBrowser.subtractIfNotNull;
    var isNotNullNorNaN = SplitsBrowser.isNotNullNorNaN;
    
    var NON_BREAKING_SPACE_CHAR = "\u00a0";

    // Maximum precision to show a results-table entry using.
    var MAX_PERMITTED_PRECISION = 2;
    
    /**
    * A control that shows an entire table of results.
    * @constructor
    * @param {HTMLElement} parent - The parent element to add this control to.
    */
    function ResultsTable(parent) {
        this.parent = parent;
        this.courseClass = null;
        this.div = null;
        this.headerSpan = null;
        this.table = null;
        this.selectedLegIndex = null;
        this.buildTable();
    }
    
    /**
    * Build the results table.
    */
    ResultsTable.prototype.buildTable = function () {
        this.div = d3.select(this.parent).append("div")
                                         .attr("id", "resultsTableContainer");
                                         
        this.headerSpan = this.div.append("div")
                                  .append("span")
                                  .classed("resultsTableHeader", true);
                                  
        this.table = this.div.append("table")
                             .classed("resultsTable", true);
                             
        this.table.append("thead")
                  .append("tr");
                  
        this.table.append("tbody");
    };
    
    /**
    * Determines the precision with which to show the results.
    * 
    * If there are some fractional times, then all times should be shown with
    * the same precision, even if not all of them need to.  For example, a
    * split time between controls punched after 62.7 and 108.7 seconds must be
    * shown as 46.0 seconds, not 46.
    *
    * @param {Array} results - Array of Result objects.
    * @return {Number} Maximum precision to use.
    */
    function determinePrecision(results) {
        var maxPrecision = 0;
        var maxPrecisionFactor = 1;        
        results.forEach(function (result) {
            result.getAllOriginalCumulativeTimes().forEach(function (cumTime) {
                if (isNotNullNorNaN(cumTime)) {
                    while (maxPrecision < MAX_PERMITTED_PRECISION && Math.abs(cumTime - Math.round(cumTime * maxPrecisionFactor) / maxPrecisionFactor) > 1e-7 * cumTime) {
                        maxPrecision += 1;
                        maxPrecisionFactor *= 10;
                    }
                }
            });
        });
        
        return maxPrecision;
    }
    
    /**
    * Returns the contents of the time or status column for the given
    * result.
    * 
    * The status may be a string that indicates the result mispunched.
    *
    * @param {Result} result The result to get the status of.
    * @param {Number?} time The time to format, if the result is OK.
    * @param {Number} precision The precision to use.
    * @return {String} Time or status for the given result.
    */
    function getTimeOrStatus (result, time, precision) {
        if (result.isNonStarter) {
            return getMessage("DidNotStartShort");
        } else if (result.isNonFinisher) {
            return getMessage("DidNotFinishShort");
        } else if (result.isDisqualified) {
            return getMessage("DisqualifiedShort");
        } else if (result.isOverMaxTime) {
            return getMessage("OverMaxTimeShort");
        } else if (result.completed()) {
            return formatTime(time, precision);
        } else {
            return getMessage("MispunchedShort");
        }
    }

    /**
    * Escapes a piece of text as HTML so that it can be concatenated into an
    * HTML string without the risk of any injection.
    * @param {String} value The HTML value to escape.
    * @return {String} The HTML value escaped.
    */ 
    function escapeHtml(value) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    
    /**
    * Formats a time (cumulative or split) for a result.  If the result is
    * deemed as completed despite having missing times, any such missing times are
    * replaced with "??:??".
    * @param {Number|null} time The time to format, in seconds.
    * @param {Number} precision The precision to format the time to.
    * @param {Boolean} resultOKDespiteMissingTimes True if the result is known to
    *       have completed the course despite having missing times, false otherwise.
    * @return Formatted time
    */
    function formatPossiblyMissingTime(time, precision, resultOKDespiteMissingTimes) {
        if (time === null && resultOKDespiteMissingTimes) {
            return "??:??";
        } else {
            return formatTime(time, precision);
        }
    }
    
    /**
    * Populates the contents of the table with the course-class data.
    */
    ResultsTable.prototype.populateTable = function () {
        var headerText = this.courseClass.name + ", ";
        
        var numControls, controlOffset, timeOffset;
        if (this.courseClass.isTeamClass && this.selectedLegIndex !== null) {
            numControls = this.courseClass.numbersOfControls[this.selectedLegIndex];
            controlOffset = this.courseClass.offsets[this.selectedLegIndex];
        } else {
            numControls = this.courseClass.numControls;
            controlOffset = 0;
            timeOffset = 0;
        }
        
        if (numControls === 1) {
            headerText += getMessage("ResultsTableHeaderSingleControl");
        } else {
            headerText += getMessageWithFormatting("ResultsTableHeaderMultipleControls", {"$$NUM$$": numControls});
        }

        var course = this.courseClass.course;
        if (course.length !== null) {
            headerText += ", " + getMessageWithFormatting("ResultsTableHeaderCourseLength", {"$$DISTANCE$$": course.length.toFixed(1)});
        }
        if (course.climb !== null) {
            headerText += ", " + getMessageWithFormatting("ResultsTableHeaderClimb", {"$$CLIMB$$": course.climb});
        }
        
        this.headerSpan.text(headerText);
        
        var headerCellData = [
            getMessage("ResultsTableHeaderControlNumber"),
            getMessage("ResultsTableHeaderName"),
            getMessage("ResultsTableHeaderTime")
        ];
        
        if (this.courseClass.isTeamClass) {
            var controlNumber;
            if (this.selectedLegIndex === null) {
                for (var legIndex = 0; legIndex < this.courseClass.numbersOfControls.length; legIndex += 1) {
                    var suffix = "-" + (legIndex + 1);
                    for (controlNumber = 1; controlNumber <= this.courseClass.numbersOfControls[legIndex]; controlNumber += 1) {
                        headerCellData.push(controlNumber + suffix);
                    }
                    headerCellData.push(getMessage("FinishName") + suffix);
                }
            } else {
                for (controlNumber = 1; controlNumber <= this.courseClass.numbersOfControls[this.selectedLegIndex]; controlNumber += 1) {
                    headerCellData.push(controlNumber);
                }
                headerCellData.push(getMessage("FinishName"));
            }
        } else {
            var controls = this.courseClass.course.controls;
            if (controls === null) {
                headerCellData = headerCellData.concat(d3.range(1, numControls + 1));
            } else {
                headerCellData = headerCellData.concat(controls.map(function (control, index) {
                    return (index + 1) + NON_BREAKING_SPACE_CHAR + "(" + control + ")";
                }));
            }
                
            headerCellData.push(getMessage("FinishName"));
        }
        
        var headerCells = this.table.select("thead tr")
                                    .selectAll("th")
                                    .data(headerCellData);
                                                       
        headerCells.enter().append("th");
        headerCells.exit().remove();
        headerCells = this.table.select("thead tr")
                                .selectAll("th")
                                .data(headerCellData);
                                
        headerCells.text(function (header) { return header; });
        
        // Array that accumulates bits of HTML for the table body.
        var htmlBits = [];
        
        function timeClasses(isFastest, isDubious, isMissing) {
            var classes = [];
            if (isFastest) {
                classes.push("fastest");
            }
            if (isDubious) {
                classes.push("dubious");
            }
            if (isMissing) {
                classes.push("missing");
            }
            
            return classes.join(" ");
        }
        
        // Adds a two-line cell to the array of table-body HTML parts.
        // If truthy, cssClass is assumed to be HTML-safe and not require
        // escaping.
        function addCell(topLine, bottomLine, cssClass, cumClasses, splitClasses, tooltip) {
            htmlBits.push("<td");
            if (cssClass) {
                htmlBits.push(" class=\"" + cssClass + "\"");
            }
            
            if (tooltip) {
                htmlBits.push(" title=\"" + escapeHtml(tooltip) + "\"");
            }
            
            htmlBits.push("><span");
            if (cumClasses !== "") {
                htmlBits.push(" class=\"" + cumClasses + "\"");
            }
            
            htmlBits.push(">");
            htmlBits.push(escapeHtml(topLine));
            htmlBits.push("</span><br><span");
            if (splitClasses !== "") {
                htmlBits.push(" class=\"" + splitClasses + "\"");
            }
            
            htmlBits.push(">");
            htmlBits.push(escapeHtml(bottomLine));
            htmlBits.push("</span></td>\n");
        }
        
        var results = this.courseClass.results.slice(0);
        results.sort(compareResults);
        
        var nonCompCount = 0;
        var rank = 0;
        
        var precision = determinePrecision(results);
        
        results.forEach(function (result, index) {
            htmlBits.push("<tr><td>");

            if (result.isNonCompetitive) {
                htmlBits.push(escapeHtml(getMessage("NonCompetitiveShort")));
                nonCompCount += 1;
            } else if (result.completed()) {
                if (index === 0 || results[index - 1].totalTime !== result.totalTime) {
                    rank = index + 1 - nonCompCount;
                }
                
                htmlBits.push("" + rank);
            }
            
            htmlBits.push("</td>");
            
            var tooltipText;
            if (this.courseClass.isTeamClass && this.selectedLegIndex === null) {
                tooltipText = result.owner.members.map(function (competitor) { return competitor.name; }).join("\n");
            } else {
                tooltipText = "";
            }
            
            var startTimeOffset = result.getOriginalCumulativeTimeTo(controlOffset);
            addCell(result.getOwnerNameForLeg(this.selectedLegIndex), result.owner.club, null, "", "", tooltipText);
            var time = (this.courseClass.isTeamClass && this.selectedLegIndex !== null) ? subtractIfNotNull(result.getOriginalCumulativeTimeTo(controlOffset + numControls + 1), startTimeOffset) : result.totalTime;
            addCell(getTimeOrStatus(result, time, precision), NON_BREAKING_SPACE_CHAR, "time", "", "", "");
            
            d3.range(controlOffset + 1, controlOffset + numControls + 2).forEach(function (controlNum) {
                var cumTime = subtractIfNotNull(result.getOriginalCumulativeTimeTo(controlNum), startTimeOffset);
                var splitTime = result.getOriginalSplitTimeTo(controlNum);
                var formattedCumTime = formatPossiblyMissingTime(cumTime, precision, result.isOKDespiteMissingTimes);
                var formattedSplitTime = formatPossiblyMissingTime(splitTime, precision, result.isOKDespiteMissingTimes);
                var isCumTimeFastest = (result.getCumulativeRankTo(controlNum) === 1);
                var isSplitTimeFastest = (result.getSplitRankTo(controlNum) === 1);
                var isCumDubious = result.isCumulativeTimeDubious(controlNum);
                var isSplitDubious = result.isSplitTimeDubious(controlNum);
                var isCumMissing = result.isOKDespiteMissingTimes && cumTime === null;
                var isSplitMissing = result.isOKDespiteMissingTimes && splitTime === null;
                addCell(formattedCumTime, formattedSplitTime, "time", timeClasses(isCumTimeFastest, isCumDubious, isCumMissing), timeClasses(isSplitTimeFastest, isSplitDubious, isSplitMissing), "");
            });
            
            htmlBits.push("</tr>\n");
            
        }, this);
        
        this.table.select("tbody").node().innerHTML = htmlBits.join("");
    };
    
    /**
    * Sets the class whose data is displayed.
    * @param {SplitsBrowser.Model.CourseClass} courseClass - The class displayed.
    */
    ResultsTable.prototype.setClass = function (courseClass) {
        this.courseClass = courseClass;
        this.selectedLegIndex = null;
        if (this.courseClass !== null) {
            this.populateTable();
        }
    };
    
    /**
    * Sets the selected leg index.
    * @param {Number?} selectedLegIndex - The selected leg index.
    */
    ResultsTable.prototype.setSelectedLegIndex = function (selectedLegIndex) {
        this.selectedLegIndex = selectedLegIndex;
        if (this.courseClass !== null) {
            this.populateTable();
        }
    };
    
    /**
    * Shows the table of results.
    */
    ResultsTable.prototype.show = function () {
        this.div.style("display", null);
    };
    
    /**
    * Hides the table of results.
    */
    ResultsTable.prototype.hide = function () {
        this.div.style("display", "none");
    };
    
    /**
    * Retranslates the results table following a change of selected language.
    */
    ResultsTable.prototype.retranslate = function () {
        this.populateTable();
    };
    
    SplitsBrowser.Controls.ResultsTable = ResultsTable;
})();