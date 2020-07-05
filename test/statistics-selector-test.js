/*
 *  SplitsBrowser - StatisticsSelector tests.
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

    var Selector = SplitsBrowser.Controls.StatisticsSelector;

    QUnit.module("Statistics selector");

    var lastVisibleStats = null;
    var callCount = 0;

    var testChangeHandler = function (visibleStats) {
        lastVisibleStats = visibleStats;
        callCount += 1;
    };

    var reset = function () {
        lastVisibleStats = null;
        callCount = 0;
    };

    QUnit.test("All statistics disabled by clearAll method", function (assert) {
        var selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();
        assert.deepEqual(selector.getVisibleStatistics(), {TotalTime: false, SplitTime: false, BehindFastest: false, TimeLoss: false});
    });

    QUnit.test("Can register change handler and have it called", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.registerChangeHandler(testChangeHandler);

        var checkboxes = $("#qunit-fixture input");
        $(checkboxes[0]).prop("checked", true).change();
        assert.deepEqual(lastVisibleStats, {TotalTime: true, SplitTime: false, BehindFastest: false, TimeLoss: false});
        assert.strictEqual(1, callCount);
    });

    QUnit.test("Can register change handler twice and have it called only once", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.registerChangeHandler(testChangeHandler);
        selector.registerChangeHandler(testChangeHandler);

        var checkboxes = $("#qunit-fixture input");
        $(checkboxes[1]).prop("checked", true).change();

        assert.deepEqual(lastVisibleStats, {TotalTime: false, SplitTime: true, BehindFastest: false, TimeLoss: false});
        assert.strictEqual(1, callCount);
    });

    QUnit.test("Can register two change handlers and have them both called", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        var lastVisibleStats2 = null;
        var callCount2 = 0;
        var secondHandler = function (visibleStats) {
            lastVisibleStats2 = visibleStats;
            callCount2 += 1;
        };

        selector.registerChangeHandler(testChangeHandler);
        selector.registerChangeHandler(secondHandler);


        var checkboxes = $("#qunit-fixture input");
        $(checkboxes[2]).prop("checked", true).change();

        var expectedStats = {TotalTime: false, SplitTime: false, BehindFastest: true, TimeLoss: false};
        assert.deepEqual(lastVisibleStats, expectedStats);
        assert.strictEqual(1, callCount);
        assert.deepEqual(lastVisibleStats2, expectedStats);
        assert.strictEqual(1, callCount2);
    });

    QUnit.test("Can deregister change handler and have it no longer called", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.registerChangeHandler(testChangeHandler);

        var checkboxes = $("#qunit-fixture input");
        $(checkboxes[3]).prop("checked", true).change();
        var expectedResult = {TotalTime: false, SplitTime: false, BehindFastest: false, TimeLoss: true};
        assert.deepEqual(lastVisibleStats, expectedResult);
        assert.strictEqual(1, callCount);

        selector.deregisterChangeHandler(testChangeHandler);
        $(checkboxes[2]).prop("checked", true).change();
        assert.deepEqual(lastVisibleStats, expectedResult);
        assert.strictEqual(1, callCount);
    });

    QUnit.test("Can deregister change handler that was never registered without error", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.deregisterChangeHandler(testChangeHandler);

        assert.expect(0); // Tell QUnit to expect no assertions.
    });

    QUnit.test("Can set selected statistics", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.registerChangeHandler(testChangeHandler);

        selector.setVisibleStatistics({TotalTime: false, SplitTime: true, BehindFastest: false, TimeLoss: true});
        assert.deepEqual(lastVisibleStats, {TotalTime: false, SplitTime: true, BehindFastest: false, TimeLoss: true});
        assert.strictEqual(1, callCount);
        var checkboxes = $("#qunit-fixture input");
        for (var index = 0; index < 4; index += 1) {
            assert.strictEqual(checkboxes[index].checked, index % 2 === 1);
        }
    });
})();