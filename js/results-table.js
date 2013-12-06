/*
 *  SplitsBrowser ResultsTable - Shows age-class results in a table.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    
    var NON_BREAKING_SPACE_CHAR = "\u00a0";

    /**
    * A control that shows an entire table of results.
    * @constructor
    * @param {HTMLElement} parent - The parent element to add this control to.
    */
    var ResultsTable = function (parent) {
        this.parent = parent;
        this.ageClass = null;
        this.div = null;
        this.headerSpan = null;
        this.table = null;
        this.buildTable();
    };
    
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
    * Populates the contents of the table with the age-class data.
    */
    ResultsTable.prototype.populateTable = function () {
        var headerText = this.ageClass.name + ", ";
        if (this.ageClass.numControls === 1) {
            headerText += getMessage("ResultsTableHeaderSingleControl");
        } else {
            headerText += getMessageWithFormatting("ResultsTableHeaderMultipleControls", {"$$NUM$$": this.ageClass.numControls});
        }

        var course = this.ageClass.course;
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
        ].concat(d3.range(1, this.ageClass.numControls + 1)).concat([getMessage("FinishName")]);
        
        var headerCells = this.table.select("thead tr")
                                    .selectAll("th")
                                    .data(headerCellData);
                                                       
        headerCells.enter().append("th");
        headerCells.text(function (header) { return header; });
        headerCells.exit().remove();
        
        var tableBody = this.table.select("tbody");
        tableBody.selectAll("tr").remove();
        
        function addCell(tableRow, topLine, bottomLine, cssClass) {
            var cell = tableRow.append("td");
            cell.append("span").text(topLine);
            cell.append("br");
            cell.append("span").text(bottomLine);
            if (cssClass) {
                cell.classed(cssClass, true);
            }
        }
        
        var competitors = this.ageClass.competitors.slice(0);
        competitors.sort(compareCompetitors);
        
        var nonCompCount = 0;
        var rank = 0;
        competitors.forEach(function (competitor, index) {
            var tableRow = tableBody.append("tr");
            var numberCell = tableRow.append("td");
            if (competitor.isNonCompetitive) {
                numberCell.text(getMessage("NonCompetitiveShort"));
                nonCompCount += 1;
            } else if (competitor.completed()) {
                if (index === 0 || competitors[index - 1].totalTime !== competitor.totalTime) {
                    rank = index + 1 - nonCompCount;
                }
                
                numberCell.text(rank);
            }
            
            addCell(tableRow, competitor.name, competitor.club);
            addCell(tableRow, (competitor.completed()) ? formatTime(competitor.totalTime) : getMessage("MispunchedShort"), NON_BREAKING_SPACE_CHAR, "time");
            
            d3.range(1, this.ageClass.numControls + 2).forEach(function (controlNum) {
                addCell(tableRow, formatTime(competitor.getCumulativeTimeTo(controlNum)), formatTime(competitor.getSplitTimeTo(controlNum)), "time");
            });
        }, this);
    };
    
    /**
    * Sets the class whose data is displayed.
    * @param {SplitsBrowser.Model.AgeClass} ageClass - The class displayed.
    */
    ResultsTable.prototype.setClass = function (ageClass) {
        this.ageClass = ageClass;
        this.populateTable();
        if (this.div.style("display") !== "none") {
            this.adjustTableCellWidths();
        }
    };
    
    /**
    * Adjust the widths of the time table cells so that they have the same width.
    */
    ResultsTable.prototype.adjustTableCellWidths = function () {
        var lastCellOnFirstRow = d3.select("tbody tr td:last-child").node();
        $("tbody td.time").width($(lastCellOnFirstRow).width());
    };
    
    /**
    * Shows the table of results.
    */
    ResultsTable.prototype.show = function () {
        this.div.style("display", null);
        this.adjustTableCellWidths();
    };
    
    /**
    * Hides the table of results.
    */
    ResultsTable.prototype.hide = function () {
        this.div.style("display", "none");
    };
    
    SplitsBrowser.Controls.ResultsTable = ResultsTable;
})();