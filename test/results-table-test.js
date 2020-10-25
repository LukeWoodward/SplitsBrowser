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

    const getMessage = SplitsBrowser.getMessage;
    const ResultsTable = SplitsBrowser.Controls.ResultsTable;
    const fromOriginalCumTimes = SplitsBrowser.Model.Result.fromOriginalCumTimes;
    const fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;
    const createTeamResult = SplitsBrowser.Model.Result.createTeamResult;
    const Competitor = SplitsBrowser.Model.Competitor;
    const CourseClass = SplitsBrowser.Model.CourseClass;
    const CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    const Course = SplitsBrowser.Model.Course;
    const Team = SplitsBrowser.Model.Team;

    const fromSplitTimes = SplitsBrowserTest.fromSplitTimes;

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
        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(null);
        assert.strictEqual(d3.selectAll("table.resultsTable tbody tr").size(), 0, "There should be no table rows in the body");
    });

    QUnit.test("Can create a results table with two results finishing", function (assert) {
        const result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        const result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("thead").size(), 1);
        assert.strictEqual(table.selectAll("thead tr").size(), 1);
        const tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        assert.strictEqual(tableHeaders.nodes()[3].innerHTML, "1");
        assert.strictEqual(tableHeaders.nodes()[4].innerHTML, "2");
        assert.strictEqual(tableHeaders.nodes()[5].innerHTML, "3");
        assert.strictEqual(table.selectAll("tbody").size(), 1);
        assert.strictEqual(table.selectAll("tbody tr").size(), 2);
        assert.strictEqual(table.selectAll("tbody tr:first-child td").size(), 7);
        assert.strictEqual(table.selectAll("tbody tr:last-child td").size(), 7);

        assert.strictEqual(table.selectAll("tbody tr td[title]").size(), 0);

        const topRowCells = $("tbody tr:first-child td", table.node());
        const cum1Cell = $("span:first-child", topRowCells[3]);
        assert.ok(cum1Cell.hasClass("fastest"));
        const split1Cell = $("span:last-child", topRowCells[3]);
        assert.ok(split1Cell.hasClass("fastest"));
        const cum2Cell = $("span:first-child", topRowCells[4]);
        assert.strictEqual(cum2Cell.text(), "04:46");
        assert.ok(!cum2Cell.hasClass("fastest"));
        const split2Cell = $("span:last-child", topRowCells[4]);
        assert.strictEqual(split2Cell.text(), "03:41");
        assert.ok(!split2Cell.hasClass("fastest"));

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, 3 controls, 4.1km, 140m");
    });

    QUnit.test("Can create a results table with two results finishing and with control codes", function (assert) {
        const result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        const result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, ["138", "152", "141"]));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable");
        const tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        assert.strictEqual(tableHeaders.nodes()[3].innerHTML, "1&nbsp;(138)");
        assert.strictEqual(tableHeaders.nodes()[4].innerHTML, "2&nbsp;(152)");
        assert.strictEqual(tableHeaders.nodes()[5].innerHTML, "3&nbsp;(141)");
    });

    QUnit.test("Can create a results table with one result not finishing sorted to the bottom", function (assert) {
        const result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, 100]);
        const result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        const table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        const lastRow = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", lastRow[2]).text(), getMessage("MispunchedShort"), "Mispunching result should be marked as such");
    });

    QUnit.test("Can create a results table with one mispunching result", function (assert) {
        const result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, 100]);
        const courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        const table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        const row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("MispunchedShort"), "Mispunching result should be marked as such");
    });

    QUnit.test("Can create a results table with one non-starting result", function (assert) {
        const result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [null, null, null, null]);
        result.setNonStarter();
        const courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        const table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        const row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("DidNotStartShort"), "Non-starting result should be marked as such");
    });

    QUnit.test("Can create a results table with one non-finishing result", function (assert) {
        const result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, null, null]);
        result.setNonFinisher();
        const courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        const table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        const row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("DidNotFinishShort"), "Non-finishing result should be marked as such");
    });

    QUnit.test("Can create a results table with one disqualified result", function (assert) {
        const result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        result.disqualify();
        const courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        const table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        const row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("DisqualifiedShort"), "Disqualified result should be marked as such");
    });

    QUnit.test("Can create a results table with one over-max-time result", function (assert) {
        const result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        result.setOverMaxTime();
        const courseClass = new CourseClass("Test", 3, [result]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        const table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");

        const row = $("tbody tr:last-child td", table.node());
        assert.strictEqual($("span:first-child", row[2]).text(), getMessage("OverMaxTimeShort"), "Over-max-time result should be marked as such");
    });

    QUnit.test("Can create a results table with one non-competitive result and the other result getting rank 1", function (assert) {
        const result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        result1.setNonCompetitive();
        const result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        const table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "1");
    });

    QUnit.test("Can create a results table with one disqualified result and the other result getting rank 1", function (assert) {
        const result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        result1.disqualify();
        const result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1);
        const table = d3.select("table.resultsTable");
        assert.strictEqual(table.selectAll("tbody tr:last-child td:first-child").text(), "");
    });

    QUnit.test("Can create a results table with course with no length and climb", function (assert) {
        const result1 = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        const result2 = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const courseClass = new CourseClass("Test", 3, [result1, result2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, 3 controls");
    });

    QUnit.test("Can create a results table with one result with dubious times appropriately classed", function (assert) {
        const result = fromOriginalCumTimes(1, 10 * 3600 + 30 * 60, [0, 65, 65 + 0, 65 + 221 + 184, 65 + 221 + 184 + 100], new Competitor("First Runner", "DEF"));
        result.setRepairedCumulativeTimes([0, 65, NaN, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        const courseClass = new CourseClass("Test", 3, [result]);
        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        calculateRanks(courseClass);

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable").node();
        assert.strictEqual($("tbody", table).length, 1);
        assert.strictEqual($("tbody tr", table).length, 1);
        const tableCells = $("tbody tr td", table);
        assert.strictEqual(tableCells.length, 7);

        for (let cellIndex = 0; cellIndex < 7; cellIndex += 1) {
            const cell = tableCells[cellIndex];

            // Cell index 4 is control 2, and index 5 is control 3.
            // As the cumulative time to control 2 is NaN, this cumulative time
            // should be regarded as dubious, as should the split times to it
            // and away from it.
            assert.strictEqual($("span:first-child", cell).hasClass("dubious"), (cellIndex === 4));
            assert.strictEqual($("span:last-child", cell).hasClass("dubious"), (cellIndex === 4 || cellIndex === 5));
        }
    });

    QUnit.test("Can create a results table with one result with missing times appropriately classed", function (assert) {
        const result = fromCumTimes(1, 10 * 3600 + 30 * 60, [0, 65, null, 65 + 221 + 184, 65 + 221 + 184 + 100], new Competitor("First Runner", "DEF"));
        result.setOKDespiteMissingTimes();
        const courseClass = new CourseClass("Test", 3, [result]);
        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        calculateRanks(courseClass);

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable").node();
        assert.strictEqual($("tbody", table).length, 1);
        assert.strictEqual($("tbody tr", table).length, 1);
        const tableCells = $("tbody tr td", table);
        assert.strictEqual(tableCells.length, 7);

        for (let cellIndex = 0; cellIndex < 7; cellIndex += 1) {
            const cell = tableCells[cellIndex];

            // Cell index 4 is control 2, and index 5 is control 3.
            // As the cumulative time to control 2 is missing, this cumulative time
            // should be regarded as omitted, as should the split times to it
            // and away from it.
            assert.strictEqual($("span:first-child", cell).hasClass("missing"), (cellIndex === 4));
            assert.strictEqual($("span:last-child", cell).hasClass("missing"), (cellIndex === 4 || cellIndex === 5));
        }
    });

    QUnit.test("Can create a results table with one result with fractional times appropriately formatted", function (assert) {
        const result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65.3, 221.0, 184.7, 100.5]);
        const courseClass = new CourseClass("Test", 3, [result]);
        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        calculateRanks(courseClass);

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable").node();
        assert.strictEqual($("tbody", table).length, 1);
        assert.strictEqual($("tbody tr", table).length, 1);
        const tableCells = $("tbody tr td", table);
        assert.strictEqual(tableCells.length, 7);

        const cum2Cell = $("span:first-child", tableCells[4]);
        assert.strictEqual(cum2Cell.text(), "04:46.3");
        const split2Cell = $("span:last-child", tableCells[4]);
        assert.strictEqual(split2Cell.text(), "03:41.0");

        const cum3Cell = $("span:first-child", tableCells[5]);
        assert.strictEqual(cum3Cell.text(), "07:51.0");
        const split3Cell = $("span:last-child", tableCells[5]);
        assert.strictEqual(split3Cell.text(), "03:04.7");
    });

    QUnit.test("Can create a results table with one result with fractional split times and a finish time with a whole number of seconds appropriately formatted", function (assert) {
        const result = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65.3, 221.0, 184.7, 100.0]);
        const courseClass = new CourseClass("Test", 3, [result]);
        courseClass.setCourse(new Course("Test", [courseClass], 4.1, 140, null));
        calculateRanks(courseClass);

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable").node();
        assert.strictEqual($("tbody", table).length, 1);
        assert.strictEqual($("tbody tr", table).length, 1);
        const tableCells = $("tbody tr td", table);
        assert.strictEqual(tableCells.length, 7);

        const cum2Cell = $("span:first-child", tableCells[2]);
        assert.strictEqual(cum2Cell.text(), "09:31.0");
    });

    QUnit.test("Can create a results table with two team results finishing and label the control headers", function (assert) {
        const result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        const result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 199, 103]);
        const result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 220, 111]);
        const team1 = new Team("Team 1", "DEF", [result1a.owner, result1b.owner]);
        const team2 = new Team("Team 2", "ABC", [result2a.owner, result2b.owner]);
        const courseClass = new CourseClass("Test", 7, [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)]);
        courseClass.setIsTeamClass([3, 3]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        resultsTable.setSelectedLegIndex(null);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable");
        const tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 11);
        const controlHeaders = tableHeaders.nodes().slice(3).map(node => node.innerHTML);
        assert.deepEqual(controlHeaders, ["1-1", "2-1", "3-1", "Finish-1", "1-2", "2-2", "3-2", "Finish-2"]);

        assert.strictEqual(table.selectAll("tbody tr td[title]").size(), 2);
        assert.strictEqual(table.selectAll("tbody tr td:nth-child(2)[title]").size(), 2);

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, 3 + 3 controls");
    });

    QUnit.test("Can create a results table with two team results with different numbers of controls per leg and label the control headers", function (assert) {
        const result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        const result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 103]);
        const result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 111]);
        const team1 = new Team("Team 1", "DEF", [result1a.owner, result1b.owner]);
        const team2 = new Team("Team 2", "ABC", [result2a.owner, result2b.owner]);
        const courseClass = new CourseClass("Test", 3, [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)]);
        courseClass.setIsTeamClass([3, 2]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable");
        const tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 10);
        const controlHeaders = tableHeaders.nodes().slice(3).map(node => node.innerHTML);
        assert.deepEqual(controlHeaders, ["1-1", "2-1", "3-1", "Finish-1", "1-2", "2-2", "Finish-2"]);
    });

    QUnit.test("Can create a results table with two team results finishing and switch to the first leg", function (assert) {
        const result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        const result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 199, 103]);
        const result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 220, 111]);
        const team1 = new Team("Team 1", "DEF", [result1a.owner, result1b.owner]);
        const team2 = new Team("Team 2", "ABC", [result2a.owner, result2b.owner]);
        const courseClass = new CourseClass("Test", 3, [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)]);
        courseClass.setIsTeamClass([3, 3]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        resultsTable.setSelectedLegIndex(0);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable");
        const tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        const controlHeaders = tableHeaders.nodes().slice(3).map(node => node.innerHTML);
        assert.deepEqual(controlHeaders, ["1", "2", "3", "Finish"]);

        const topOfFirstRow = table.selectAll("tbody tr:first-child td span:first-child").nodes().map(node => node.innerHTML);
        assert.deepEqual(topOfFirstRow, ["First Runner", "09:30", "01:05", "04:46", "07:50", "09:30"]);
        const bottomOfFirstRow = table.selectAll("tbody tr:first-child td span:nth-child(3)").nodes().map(node => node.innerHTML);
        assert.deepEqual(bottomOfFirstRow, ["DEF", "&nbsp;", "01:05", "03:41", "03:04", "01:40"]);

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, Leg 1, 3 controls");
    });

    QUnit.test("Can create a results table with two team results finishing and switch to the second leg", function (assert) {
        const result1a = fromSplitTimes(1, "First Runner", "DEF", 10 * 3600 + 30 * 60, [65, 221, 184, 100]);
        const result2a = fromSplitTimes(2, "Second Runner", "ABC", 10 * 3600, [81, 197, 212, 106]);
        const result1b = fromSplitTimes(1, "Third Runner", "DEF", 10 * 3600 + 570, [78, 234, 199, 103]);
        const result2b = fromSplitTimes(2, "Fourth Runner", "ABC", 10 * 3600 + 596, [88, 192, 220, 111]);
        const team1 = new Team("Team 1", "DEF", [result1a.owner, result1b.owner]);
        const team2 = new Team("Team 2", "ABC", [result2a.owner, result2b.owner]);
        const courseClass = new CourseClass("Test", 3, [createTeamResult(1, [result1a, result1b], team1), createTeamResult(2, [result2a, result2b], team2)]);
        courseClass.setIsTeamClass([3, 3]);
        calculateRanks(courseClass);

        courseClass.setCourse(new Course("Test", [courseClass], null, null, null));

        const resultsTable = new ResultsTable(d3.select("#qunit-fixture").node());
        resultsTable.setClass(courseClass);
        resultsTable.setSelectedLegIndex(1);

        assert.strictEqual(d3.selectAll("table.resultsTable").size(), 1, "There should be one table");
        const table = d3.select("table.resultsTable");
        const tableHeaders = table.selectAll("thead tr th");
        assert.strictEqual(tableHeaders.size(), 7);
        const controlHeaders = tableHeaders.nodes().slice(3).map(node => node.innerHTML);
        assert.deepEqual(controlHeaders, ["1", "2", "3", "Finish"]);

        const topOfFirstRow = table.selectAll("tbody tr:first-child td span:first-child").nodes().map(node => node.innerHTML);
        assert.deepEqual(topOfFirstRow, ["Third Runner", "10:14", "01:18", "05:12", "08:31", "10:14"]);
        const bottomOfFirstRow = table.selectAll("tbody tr:first-child td span:nth-child(3)").nodes().map(node => node.innerHTML);
        assert.deepEqual(bottomOfFirstRow, ["DEF", "&nbsp;", "01:18", "03:54", "03:19", "01:43"]);

        assert.strictEqual($("span.resultsTableHeader").text(), "Test, Leg 2, 3 controls");
    });
})();
