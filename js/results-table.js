(function () {
    "use strict";
    
    var _DEFAULT_NULL_TIME_PLACEHOLDER = "-----";
    
    var _NON_BREAKING_SPACE_CHAR = "\u00a0";
    
    /**
    * Formats the given time, unless the value given is null, in which case a
    * placeholder value is given.
    * @param {Number|null} time - The time to format.
    * @param {String|undefined} placeholder - Optional placeholder value.
    * @return {String} The formatted time string.
    */
    function nullSafeFormatTime(time, placeholder) {
        return (time === null) ? (placeholder || _DEFAULT_NULL_TIME_PLACEHOLDER) : SplitsBrowser.formatTime(time);
    }

    /**
    * A control that shows an entire table of results.
    * @constructor
    * @param {HTMLElement} parent - The parent element to add this control to.
    */
    SplitsBrowser.Controls.ResultsTable = function (parent) {
        this.parent = parent;
        this.course = null;
        this.div = null;
        this.headerSpan = null;
        this.table = null;
        this.buildTable();
    };
    
    /**
    * Build the results table.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.buildTable = function () {
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
    * Populates the contents of the table with the course data.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.populateTable = function () {
        var resultLines = [];
        
        // TODO add course distance and climb, if known?
        this.headerSpan.text(this.course.name + ", " + this.course.numControls + " control" + ((this.course.numControls === 1) ? "" : "s"));
        
        var headerRow = this.table.select("thead");
        var headerCellData = ["#", "Name", "Time"].concat(d3.range(1, this.course.numControls + 1)).concat(["Finish"]);
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
        
        var competitors = this.course.competitors.slice(0);
        competitors.sort(SplitsBrowser.Model.compareCompetitors);
        
        var outerThis = this;
        var nonCompCount = 0;
        competitors.forEach(function (competitor) {
            var tableRow = tableBody.append("tr");
            var numberCell = tableRow.append("td");
            if (competitor.isNonCompetitive) {
                numberCell.text("n/c");
                nonCompCount += 1;
            } else if (competitor.completed()) {
                numberCell.text(competitor.cumRanks[competitor.cumRanks.length - 1] - nonCompCount);
            }
            
            addCell(tableRow, competitor.name, competitor.club);
            addCell(tableRow, nullSafeFormatTime(competitor.totalTime, "mp"), _NON_BREAKING_SPACE_CHAR, "time");
            
            d3.range(1, outerThis.course.numControls + 2).forEach(function (controlNum) {
                addCell(tableRow, nullSafeFormatTime(competitor.getCumulativeTimeTo(controlNum)), nullSafeFormatTime(competitor.getSplitTimeTo(controlNum)), "time");
            });
        });
    };
    
    /**
    * Sets the course whose data is displayed.
    * @param {SplitsBrowser.Model.Course} course - The course displayed.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.setCourse = function (course) {
        this.course = course;
        this.populateTable();
        if (this.div.style("display") !== "none") {
            this.adjustTableCellWidths();
        }
    };
    
    /**
    * Adjust the widths of the time table cells so that they have the same width.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.adjustTableCellWidths = function () {
        var lastCellOnFirstRow = d3.select("tbody tr td:last-child").node();
        $("tbody td.time").width($(lastCellOnFirstRow).width());
    };
    
    /**
    * Shows the table of results.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.show = function () {
        this.div.style("display", "");
        this.adjustTableCellWidths();
    };
    
    /**
    * Hides the table of results.
    */
    SplitsBrowser.Controls.ResultsTable.prototype.hide = function () {
        this.div.style("display", "none");
    };
})();