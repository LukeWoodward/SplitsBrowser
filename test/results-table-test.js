/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function () {
    "use strict";
    
    var ResultsTable = SplitsBrowser.Controls.ResultsTable;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var Course = SplitsBrowser.Model.Course;
    
    module("Results Table");
    
    QUnit.test("Can create a results table with two competitors finishing", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", "10:30", [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
        var course = new Course("Test", 3, [competitor1, competitor2]);
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setCourse(course);
        
        assert.equal(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        assert.equal(table.selectAll("thead").size(), 1);
        assert.equal(table.selectAll("thead tr").size(), 1);
        assert.equal(table.selectAll("thead tr th").size(), 7);
        assert.equal(table.selectAll("tbody").size(), 1);
        assert.equal(table.selectAll("tbody tr").size(), 2);
        assert.equal(table.selectAll("tbody tr:first-child td").size(), 7);
        assert.equal(table.selectAll("tbody tr:last-child td").size(), 7);    
    });
    
    QUnit.test("Can create a results table with one competitor not finishing sorted to the bottom", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", "10:30", [81, 197, null, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
        var course = new Course("Test", 3, [competitor1, competitor2]);
        
        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setCourse(course);
        
        assert.equal(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.equal(table.selectAll("tbody tr:last-child td:first-child").text(), "");
    });
})();