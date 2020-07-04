/*
 *  SplitsBrowser Warning Viewer tests.
 *
 *  Copyright (C) 2000-2019 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    QUnit.module("Warning Viewer");

    var WarningViewer = SplitsBrowser.Controls.WarningViewer;

    QUnit.test("Can create viewer with SVG element", function (assert) {
        var parent = d3.select("#qunit-fixture");
        new WarningViewer(parent);
        assert.strictEqual(parent.select("svg").size(), 1);
    });

    QUnit.test("Viewer is hidden when no warnings set", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var viewer = new WarningViewer(parent);
        viewer.setWarnings([]);
        assert.ok(!$("svg", $("#qunit-fixture")).is(":visible"), "Warning viewer should not be visible when no warnings");
    });

    QUnit.test("Viewer is visible when warnings set", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var viewer = new WarningViewer(parent);
        viewer.setWarnings(["Warning 1", "Warning 2", "Warning 3"]);
        assert.ok($("svg", $("#qunit-fixture")).is(":visible"), "Warning viewer should be visible when warnings");
        assert.strictEqual(d3.selectAll("#qunit-fixture div.warning").size(), 3, "Three warnings should be created");
    });

    QUnit.test("Warnings hidden when warning viewer created", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var viewer = new WarningViewer(parent);
        viewer.setWarnings(["Warning 1", "Warning 2", "Warning 3"]);
        assert.ok(!$("div#warningList").is(":visible"), "Warning list should not be visible");
    });

    QUnit.test("Warnings visible when warning triangle clicked", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var viewer = new WarningViewer(parent);
        viewer.setWarnings(["Warning 1", "Warning 2", "Warning 3"]);
        assert.ok(!$("div.warningList").is(":visible"), "Warning list should not be visible");
        $("#qunit-fixture div#warningTriangleContainer").click();
        assert.ok($("div.warningList").is(":visible"), "Warning list should be visible after warning triangle clicked");
    });

    QUnit.test("Warnings hidden when warning triangle clicked for the second time", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var viewer = new WarningViewer(parent);
        viewer.setWarnings(["Warning 1", "Warning 2", "Warning 3"]);
        assert.ok(!$("div.warningList").is(":visible"), "Warning list should not be visible");
        $("#qunit-fixture div#warningTriangleContainer").click();
        assert.ok($("div.warningList").is(":visible"), "Warning list should be visible after warning triangle clicked");
        $("#qunit-fixture div#warningTriangleContainer").click();
        assert.ok(!$("div.warningList").is(":visible"), "Warning list should not be visible after warning triangle clicked again");
    });
})();