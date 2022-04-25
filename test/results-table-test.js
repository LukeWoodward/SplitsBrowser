/*
 *  SplitsBrowser - ResultsTable tests.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    var fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    var fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;
    var createTeamResult = SplitsBrowser.Model.Result.createTeamResult;
    var Competitor = SplitsBrowser.Model.Competitor;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    var Course = SplitsBrowser.Model.Course;
    var Team = SplitsBrowser.Model.Team;

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

    QUnit.test("Can create a results table with two results finishing", function (assert) {
        var result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [result1, result2]);
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

        assert.strictEqual(table.selectAll("tbody tr td[title]").size(), 0);

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

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, 3 controls, 4.1km, 140m");
    });

    QUnit.test("Can create a results table with two results finishing and with control codes", function (assert) {
        var result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, ["138", "152", "141"]));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        assert.strictEqual(tableHeaders.nodes()[3].innerHTML, "1 (138)");
        assert.strictEqual(tableHeaders.nodes()[4].innerHTML, "2 (152)");
        assert.strictEqual(tableHeaders.nodes()[5].innerHTML, "3 (141)");
    });

    QUnit.test("Can create a results table with one result not finishing sorted to the bottom", function (assert) {
        var result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, 100]);
        var result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        var lastRow = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", lastRow[2]).text(), getMessage("MispunchedShort"), "Mispunching result should be marked as such");
    });

    QUnit.test("Can create a results table with one mispunching result", function (assert) {
        var result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, 100]);
        var courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("MispunchedShort"), "Mispunching result should be marked as such");
    });

    QUnit.test("Can create a results table with one non-starting result", function (assert) {
        var result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [null, null, null, null]);
        result.setNonStarter();
        var courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("DidNotStartShort"), "Non-starting result should be marked as such");
    });

    QUnit.test("Can create a results table with one non-finishing result", function (assert) {
        var result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, null]);
        result.setNonFinisher();
        var courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("DidNotFinishShort"), "Non-finishing result should be marked as such");
    });

    QUnit.test("Can create a results table with one disqualified result", function (assert) {
        var result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        result.disqualify();
        var courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("DisqualifiedShort"), "Disqualified result should be marked as such");
    });

    QUnit.test("Can create a results table with one over-max-time result", function (assert) {
        var result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        result.setOverMaxTime();
        var courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        var row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("OverMaxTimeShort"), "Over-max-time result should be marked as such");
    });

    QUnit.test("Can create a results table with one non-competitive result and the other result getting rank 1", function (assert) {
        var result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        result1.setNonCompetitive();
        var result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "1");
    });

    QUnit.test("Can create a results table with one disqualified result and the other result getting rank 1", function (assert) {
        var result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        result1.disqualify();
        var result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        var table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
    });

    QUnit.test("Can create a results table with course with no length and climb", function (assert) {
        var result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, 3 controls");
    });

    QUnit.test("Can create a results table with one result with dubious times appropriately classed", function (assert) {
        var result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 65, 65 + 0, 65 + 221 + 184, 65 + 221 + 184 + 100], new Competitor("First Runner", "DEF"));
        result.setRepairedCumulativeTimes([0, 65, NaN, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        var courseClass = new CourseClass("Test", 3, [result]);
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

    QUnit.test("Can create a results table with one result with missing times appropriately classed", function (assert) {
        var result = fromCumTimes(1, 10 * 3600 + 30 * 60, [0, 65, null, 65 + 221 + 184, 65 + 221 + 184 + 100], new Competitor("First Runner", "DEF"));
        result.setOKDespiteMissingTimes();
        var courseClass = new CourseClass("Test", 3, [result]);
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
            // As the cumulative time to control 2 is missing, this cumulative time
            // should be regarded as omitted, as should the split times to it
            // and away from it.
            assert.strictEqual($("span:first-child", cell).hasClass("missing"), (cellIndex === 4));
            assert.strictEqual($("span:last-child", cell).hasClass("missing"), (cellIndex === 4 || cellIndex === 5));
        }
    });

    QUnit.test("Can create a results table with one result with fractional times appropriately formatted", function (assert) {
        var result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65.3, 221.0, 184.7, 100.5]);
        var courseClass = new CourseClass("Test", 3, [result]);
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

    QUnit.test("Can create a results table with negative cumulative times appropriately formatted", function (assert) {
        var result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [-35, 221, 184, 100]);
        var courseClass = new CourseClass("Test", 3, [result]);
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

        var cum1Cell = $("span:first-child", tableCells[3]);
        assert.strictEqual(cum1Cell.text(), "-00:35");
        var split1Cell = $("span:last-child", tableCells[3]);
        assert.strictEqual(split1Cell.text(), "-00:35");

        var cum2Cell = $("span:first-child", tableCells[4]);
        assert.strictEqual(cum2Cell.text(), "03:06");
        var split2Cell = $("span:last-child", tableCells[4]);
        assert.strictEqual(split2Cell.text(), "03:41");

        var cum3Cell = $("span:first-child", tableCells[5]);
        assert.strictEqual(cum3Cell.text(), "06:10");
        var split3Cell = $("span:last-child", tableCells[5]);
        assert.strictEqual(split3Cell.text(), "03:04");
    });

    QUnit.test("Can create a results table with one result with fractional split times and a finish time with a whole number of seconds appropriately formatted", function (assert) {
        var result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65.3, 221.0, 184.7, 100.0]);
        var courseClass = new CourseClass("Test", 3, [result]);
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

    QUnit.test("Can create a results table with two team results finishing and label the control headers", function (assert) {
        var result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 199, 103]);
        var result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 220, 111]);
        var team1 = new Team("Team 1", "DEF", [result1a.owner, result1b.owner]);
        var team2 = new Team("Team 2", "ABC", [result2a.owner, result2b.owner]);
        var courseClass = new CourseClass("Test", 7, [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)]);
        courseClass.setIsTeamClass([3, 3]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        resultsTable.setSelectedLegIndex(null);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 11);
        var controlHeaders = tableHeaders.nodes().slice(3).map(function (node) { return node.innerHTML; });
        assert.deepEqual(controlHeaders, ["1-1", "2-1", "3-1", "Finish-1", "1-2", "2-2", "3-2", "Finish-2"]);

        assert.strictEqual(table.selectAll("tbody tr td[title]").size(), 2);
        assert.strictEqual(table.selectAll("tbody tr td:nth-child(2)[title]").size(), 2);

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, 3 + 3 controls");
    });

    QUnit.test("Can create a results table with two team results finishing and label the control headers with control codes", function (assert) {
        var result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 199, 103]);
        var result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 220, 111]);
        var team1 = new Team("Team 1", "DEF", [result1a.owner, result1b.owner]);
        var team2 = new Team("Team 2", "ABC", [result2a.owner, result2b.owner]);
        var courseClass = new CourseClass("Test", 7, [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)]);
        courseClass.setIsTeamClass([3, 3]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, ["138", "152", "141", Course.INTERMEDIATE, "184", "202", "199"]));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        resultsTable.setSelectedLegIndex(null);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 11);
        var controlHeaders = tableHeaders.nodes().slice(3).map(function (node) { return node.innerHTML; });
        assert.deepEqual(controlHeaders, ["1-1 (138)", "2-1 (152)", "3-1 (141)", "Finish-1", "1-2 (184)", "2-2 (202)", "3-2 (199)", "Finish-2"]);

        assert.strictEqual(table.selectAll("tbody tr td[title]").size(), 2);
        assert.strictEqual(table.selectAll("tbody tr td:nth-child(2)[title]").size(), 2);

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, 3 + 3 controls");
    });

    QUnit.test("Can create a results table with two team results with different numbers of controls per leg and label the control headers", function (assert) {
        var result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 103]);
        var result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 111]);
        var team1 = new Team("Team 1", "DEF", [result1a.owner, result1b.owner]);
        var team2 = new Team("Team 2", "ABC", [result2a.owner, result2b.owner]);
        var courseClass = new CourseClass("Test", 3, [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)]);
        courseClass.setIsTeamClass([3, 2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 10);
        var controlHeaders = tableHeaders.nodes().slice(3).map(function (node) { return node.innerHTML; });
        assert.deepEqual(controlHeaders, ["1-1", "2-1", "3-1", "Finish-1", "1-2", "2-2", "Finish-2"]);
    });

    QUnit.test("Can create a results table with two team results finishing and switch to the first leg", function (assert) {
        var result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 199, 103]);
        var result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 220, 111]);
        var team1 = new Team("Team 1", "DEF", [result1a.owner, result1b.owner]);
        var team2 = new Team("Team 2", "ABC", [result2a.owner, result2b.owner]);
        var courseClass = new CourseClass("Test", 3, [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)]);
        courseClass.setIsTeamClass([3, 3]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        resultsTable.setSelectedLegIndex(0);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        var controlHeaders = tableHeaders.nodes().slice(3).map(function (node) { return node.innerHTML; });
        assert.deepEqual(controlHeaders, ["1", "2", "3", "Finish"]);

        var topOfFirstRow = table.selectAll("tbody tr:first-child td span:first-child").nodes().map(function (node) { return node.innerHTML; });
        assert.deepEqual(topOfFirstRow, ["First Runner", "09:30", "01:05", "04:46", "07:50", "09:30"]);
        var bottomOfFirstRow = table.selectAll("tbody tr:first-child td span:nth-child(3)").nodes().map(function (node) { return node.innerHTML; });
        assert.deepEqual(bottomOfFirstRow, ["DEF", "&nbsp;", "01:05", "03:41", "03:04", "01:40"]);

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, Leg 1, 3 controls");
    });

    QUnit.test("Can create a results table with two team results finishing and switch to the second leg", function (assert) {
        var result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        var result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        var result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 199, 103]);
        var result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 220, 111]);
        var team1 = new Team("Team 1", "DEF", [result1a.owner, result1b.owner]);
        var team2 = new Team("Team 2", "ABC", [result2a.owner, result2b.owner]);
        var courseClass = new CourseClass("Test", 3, [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)]);
        courseClass.setIsTeamClass([3, 3]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        var resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        resultsTable.setSelectedLegIndex(1);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        var table = d3.select("table.resultsTable");
        var tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        var controlHeaders = tableHeaders.nodes().slice(3).map(function (node) { return node.innerHTML; });
        assert.deepEqual(controlHeaders, ["1", "2", "3", "Finish"]);

        var topOfFirstRow = table.selectAll("tbody tr:first-child td span:first-child").nodes().map(function (node) { return node.innerHTML; });
        assert.deepEqual(topOfFirstRow, ["Third Runner", "10:14", "01:18", "05:12", "08:31", "10:14"]);
        var bottomOfFirstRow = table.selectAll("tbody tr:first-child td span:nth-child(3)").nodes().map(function (node) { return node.innerHTML; });
        assert.deepEqual(bottomOfFirstRow, ["DEF", "&nbsp;", "01:18", "03:54", "03:19", "01:43"]);

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, Leg 2, 3 controls");
    });
})();
