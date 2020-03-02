/*
 *  SplitsBrowser - ResultsTable tests.
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
    
    var getMessage = SplitsBrowser.getMessage;
    var ResultsTable = SplitsBrowser.Controls.ResultsTable;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    var Course = SplitsBrowser.Model.Course;

    var fromSplitTimes = SplitsBrowserTest.fromSplitTimes;
    
    QUnit.module("Results Table");
    
    /**
    * Computes the ranks within the course-class.
    */
    function calculateRanks(courseClass) {
        // Course-class sets compute ranks on construction, so let's create one
        // just for that purpose.
        new CourseClassSet([courseClass]);
    }
    
    QUnit.test("Can create a results table for an empty course-class", function (assert) {
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(null);
        assert.strictEqual(d3.selectAll("table.resultsTable tbody tr").size(), 0, "There should be no table rows in the body");
    });
    
    QUnit.test("Can create a results table with two competitors finishing", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [competitor1, competitor2]);
        calculateRanks(courseClass);
        
        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("thead").size(), 1);
        assert.strictEqual(table.selectAll("thead tr").size(), 1);
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        assert.strictEqual(tableHeaders.nodes()[3].innerHTML, "1");
        assert.strictEqual(tableHeaders.nodes()[4].innerHTML, "2");
        assert.strictEqual(tableHeaders.nodes()[5].innerHTML, "3");        
        assert.strictEqual(table.selectAll("tbody").size(), 1);
        assert.strictEqual(table.selectAll("tbody tr").size(), 2);
        assert.strictEqual(table.selectAll("tbody tr:first-child td").size(), 7);
        assert.strictEqual(table.selectAll("tbody tr:last-child td").size(), 7);    
        
        var topRowCells = $("tbody tr:first-child td", table.node());
        var cum1Cell = $("span:first-child", topRowCells[3]);
        assert.ok(cum1Cell.hasClass("fastest"));
        var split1Cell = $("span:last-child", topRowCells[3]);
        assert.ok(split1Cell.hasClass("fastest"));
        var cum2Cell = $("span:first-child", topRowCells[4]);
        assert.strictEqual(cum2Cell.text(), "04:46");
        assert.ok(!cum2Cell.hasClass("fastest"));
        var split2Cell = $("span:last-child", topRowCells[4]);
        assert.strictEqual(split2Cell.text(), "03:41");
        assert.ok(!split2Cell.hasClass("fastest"));
    });
    
    QUnit.test("Can create a results table with two competitors finishing and with control codes", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [competitor1, competitor2]);
        calculateRanks(courseClass);
        
        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, ["138", "152", "141"]));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        assert.strictEqual(tableHeaders.nodes()[3].innerHTML, "1&nbsp;(138)");
        assert.strictEqual(tableHeaders.nodes()[4].innerHTML, "2&nbsp;(152)");
        assert.strictEqual(tableHeaders.nodes()[5].innerHTML, "3&nbsp;(141)");
    });
    
    QUnit.test("Can create a results table with one competitor not finishing sorted to the bottom", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, 100]);
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [competitor1, competitor2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
        
        var lastRow = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", lastRow[2]).text(), getMessage("MispunchedShort"), "Mispunching competitor should be marked as such");
    });
    
    QUnit.test("Can create a results table with one mispunching competitor", function (assert) {
        var competitor = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, 100]);
        var courseClass = new CourseClass("Test", 3, [competitor]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
        
        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("MispunchedShort"), "Mispunching competitor should be marked as such");
    });
    
    QUnit.test("Can create a results table with one non-starting competitor", function (assert) {
        var competitor = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [null, null, null, null]);
        competitor.setNonStarter();
        var courseClass = new CourseClass("Test", 3, [competitor]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
        
        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("DidNotStartShort"), "Non-starting competitor should be marked as such");
    });

    QUnit.test("Can create a results table with one non-finishing competitor", function (assert) {
        var competitor = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, null]);
        competitor.setNonFinisher();
        var courseClass = new CourseClass("Test", 3, [competitor]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
        
        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("DidNotFinishShort"), "Non-finishing competitor should be marked as such");
    });

    QUnit.test("Can create a results table with one disqualified competitor", function (assert) {
        var competitor = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        competitor.disqualify();
        var courseClass = new CourseClass("Test", 3, [competitor]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
        
        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("DisqualifiedShort"), "Disqualified competitor should be marked as such");
    });

    QUnit.test("Can create a results table with one over-max-time competitor", function (assert) {
        var competitor = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        competitor.setOverMaxTime();
        var courseClass = new CourseClass("Test", 3, [competitor]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
        
        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("OverMaxTimeShort"), "Over-max-time competitor should be marked as such");
    });

    QUnit.test("Can create a results table with one non-competitive competitor and the other competitor getting rank 1", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        competitor1.setNonCompetitive();
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [competitor1, competitor2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "1");
    });

    QUnit.test("Can create a results table with one disqualified competitor and the other competitor getting rank 1", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        competitor1.disqualify();
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [competitor1, competitor2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
    });
    
    QUnit.test("Can create a results table with course with no length and climb", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [competitor1, competitor2]);
        calculateRanks(courseClass);
        
        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
            
        // We don't expect any errors, but we also make no assertions here.
        assert.expect(0);
    });
    
    QUnit.test("Can create a results table with one competitor with suspicious times appropriately classed", function (assert) {
        var competitor1 = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 65, 65 + 0, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        competitor1.setRepairedCumulativeTimes([0, 65, NaN, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var courseClass = new CourseClass("Test", 3, [competitor1]);
        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        calculateRanks(courseClass);
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable").node();
        assert.strictEqual($("tbody", table).length, 1);
        assert.strictEqual($("tbody tr", table).length, 1);
        var tableCells = $("tbody tr td", table);
        assert.strictEqual(tableCells.length, 7);
        
        for (var cellIndex = 0; cellIndex < 7; cellIndex += 1) {
            var cell = tableCells[cellIndex];
            
            // Cell index 4 is control 2, and index 5 is control 3.
            // As the cumulative time to control 2 is NaN, this cumulative time
            // should be regarded as dubious, as should the split times to it
            // and away from it.
            assert.strictEqual($("span:first-child", cell).hasClass("dubious"), (cellIndex === 4));
            assert.strictEqual($("span:last-child", cell).hasClass("dubious"), (cellIndex === 4 || cellIndex === 5));
        }
    });
    
    QUnit.test("Can create a results table with one competitor with fractional times appropriately formatted", function (assert) {
        var competitor = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65.3, 221.0, 184.7, 100.5]);
        var courseClass = new CourseClass("Test", 3, [competitor]);
        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        calculateRanks(courseClass);
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable").node();
        assert.strictEqual($("tbody", table).length, 1);
        assert.strictEqual($("tbody tr", table).length, 1);
        var tableCells = $("tbody tr td", table);
        assert.strictEqual(tableCells.length, 7);
        
        var cum2Cell = $("span:first-child", tableCells[4]);
        assert.strictEqual(cum2Cell.text(), "04:46.3");
        var split2Cell = $("span:last-child", tableCells[4]);
        assert.strictEqual(split2Cell.text(), "03:41.0");
        
        var cum3Cell = $("span:first-child", tableCells[5]);
        assert.strictEqual(cum3Cell.text(), "07:51.0");
        var split3Cell = $("span:last-child", tableCells[5]);
        assert.strictEqual(split3Cell.text(), "03:04.7");
    });
    
    QUnit.test("Can create a results table with one competitor with fractional split times and a finish time with a whole number of seconds appropriately formatted", function (assert) {
        var competitor = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65.3, 221.0, 184.7, 100.0]);
        var courseClass = new CourseClass("Test", 3, [competitor]);
        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        calculateRanks(courseClass);
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable").node();
        assert.strictEqual($("tbody", table).length, 1);
        assert.strictEqual($("tbody tr", table).length, 1);
        var tableCells = $("tbody tr td", table);
        assert.strictEqual(tableCells.length, 7);
        
        var cum2Cell = $("span:first-child", tableCells[2]);
        assert.strictEqual(cum2Cell.text(), "09:31.0");
    });
})();