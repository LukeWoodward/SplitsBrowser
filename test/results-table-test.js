/*
 *  SplitsBrowser - ResultsTable tests.
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
    
    var ResultsTable = SplitsBrowser.Controls.ResultsTable;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    
    module("Results Table");
    
    QUnit.test("Can create a results table with two competitors finishing", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        
        ageClass.setCourse(new Course("Test", [ageClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(ageClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("thead").size(), 1);
        assert.strictEqual(table.selectAll("thead tr").size(), 1);
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        assert.strictEqual(tableHeaders[0][3].innerHTML, "1");
        assert.strictEqual(tableHeaders[0][4].innerHTML, "2");
        assert.strictEqual(tableHeaders[0][5].innerHTML, "3");        
        assert.strictEqual(table.selectAll("tbody").size(), 1);
        assert.strictEqual(table.selectAll("tbody tr").size(), 2);
        assert.strictEqual(table.selectAll("tbody tr:first-child td").size(), 7);
        assert.strictEqual(table.selectAll("tbody tr:last-child td").size(), 7);    
    });
    
    QUnit.test("Can create a results table with two competitors finishing and with control codes", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        
        ageClass.setCourse(new Course("Test", [ageClass], 4.1, 140, ["138", "152", "141"]));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(ageClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        assert.strictEqual(tableHeaders[0][3].innerHTML, "1&nbsp;(138)");
        assert.strictEqual(tableHeaders[0][4].innerHTML, "2&nbsp;(152)");
        assert.strictEqual(tableHeaders[0][5].innerHTML, "3&nbsp;(141)");
    });
    
    QUnit.test("Can create a results table with one competitor not finishing sorted to the bottom", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, 100]);
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);

        ageClass.setCourse(new Course("Test", [ageClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(ageClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
    });
    
    QUnit.test("Can create a results table with one non-competitive competitor and the other competitor getting rank 1", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        competitor1.setNonCompetitive();
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);

        ageClass.setCourse(new Course("Test", [ageClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(ageClass);
        
        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "1");
    });
    
    QUnit.test("Can create a results table with course with no length and climb", function () {
        var competitor1 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var competitor2 = fromSplitTimes(2, "John Smith", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var ageClass = new AgeClass("Test", 3, [competitor1, competitor2]);
        
        ageClass.setCourse(new Course("Test", [ageClass], null, null, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(ageClass);
            
        // We don't expect any errors, but we also make no assertions here.
        expect(0);
    });
    
    QUnit.test("Can create a results table with one competitor with suspicious times appropriately classed", function (assert) {
        var competitor1 = fromOriginalCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 65, 65 + 0, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        competitor1.setRepairedCumulativeTimes([0, 65, NaN, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var ageClass = new AgeClass("Test", 3, [competitor1]);
        ageClass.setCourse(new Course("Test", [ageClass], 4.1, 140, null));
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(ageClass);
        
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
})();