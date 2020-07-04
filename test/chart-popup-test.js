/*
 *  SplitsBrowser - ChartPopup tests.
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

    QUnit.module("Chart popup");

    var Popup = SplitsBrowser.Controls.ChartPopup;

    QUnit.test("Can create a popup without it initially being hidden", function (assert) {
        var popup = new Popup(d3.select("#qunit-fixture").node(), {});

        assert.ok(!popup.isShown(), "Popup should initially be hidden");
    });

    QUnit.test("Can create a popup, show it and then hide it", function (assert) {
        var popup = new Popup(d3.select("#qunit-fixture").node(), {});

        popup.show({x: 0, y: 0});
        assert.ok(popup.isShown(), "Popup should be shown");

        popup.hide();
        assert.ok(!popup.isShown(), "Popup should be hidden again");
    });
}());