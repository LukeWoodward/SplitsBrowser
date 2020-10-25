/*
 *  SplitsBrowser - StatisticsSelector tests.
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

    const Selector = SplitsBrowser.Controls.StatisticsSelector;
    const makeStatsMap = SplitsBrowserTest.makeStatsMap;

    QUnit.module("Statistics selector");

    let lastVisibleStats = null;
    let callCount = 0;

    function testChangeHandler(visibleStats) {
        lastVisibleStats = visibleStats;
        callCount += 1;
    }

    function reset() {
        lastVisibleStats = null;
        callCount = 0;
    }

    QUnit.test("All statistics disabled by clearAll method", function (assert) {
        const selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();
        assert.deepEqual(selector.getVisibleStatistics(), makeStatsMap(false, false, false, false));
    });

    QUnit.test("Can register change handler and have it called", function (assert) {
        reset();
        const selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.registerChangeHandler(testChangeHandler);

        const checkboxes = $("#qunit-fixture input");
        $(checkboxes[0]).prop("checked", true).change();
        assert.deepEqual(lastVisibleStats, makeStatsMap(true, false, false, false));
        assert.strictEqual(1, callCount);
    });

    QUnit.test("Can register change handler twice and have it called only once", function (assert) {
        reset();
        const selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.registerChangeHandler(testChangeHandler);
        selector.registerChangeHandler(testChangeHandler);

        const checkboxes = $("#qunit-fixture input");
        $(checkboxes[1]).prop("checked", true).change();

        assert.deepEqual(lastVisibleStats, makeStatsMap(false, true, false, false));
        assert.strictEqual(1, callCount);
    });

    QUnit.test("Can register two change handlers and have them both called", function (assert) {
        reset();
        const selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        let lastVisibleStats2 = null;
        let callCount2 = 0;
        const secondHandler = (visibleStats) => {
            lastVisibleStats2 = visibleStats;
            callCount2 += 1;
        };

        selector.registerChangeHandler(testChangeHandler);
        selector.registerChangeHandler(secondHandler);

        const checkboxes = $("#qunit-fixture input");
        $(checkboxes[2]).prop("checked", true).change();

        const expectedStats = makeStatsMap(false, false, true, false);
        assert.deepEqual(lastVisibleStats, expectedStats);
        assert.strictEqual(1, callCount);
        assert.deepEqual(lastVisibleStats2, expectedStats);
        assert.strictEqual(1, callCount2);
    });

    QUnit.test("Can deregister change handler and have it no longer called", function (assert) {
        reset();
        const selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.registerChangeHandler(testChangeHandler);

        const checkboxes = $("#qunit-fixture input");
        $(checkboxes[3]).prop("checked", true).change();
        const expectedResult = makeStatsMap(false, false, false, true);
        assert.deepEqual(lastVisibleStats, expectedResult);
        assert.strictEqual(1, callCount);

        selector.deregisterChangeHandler(testChangeHandler);
        $(checkboxes[2]).prop("checked", true).change();
        assert.deepEqual(lastVisibleStats, expectedResult);
        assert.strictEqual(1, callCount);
    });

    QUnit.test("Can deregister change handler that was never registered without error", function (assert) {
        reset();
        const selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.deregisterChangeHandler(testChangeHandler);

        assert.expect(0); // Tell QUnit to expect no assertions.
    });

    QUnit.test("Can set selected statistics", function (assert) {
        reset();
        const selector = new Selector(d3.select("#qunit-fixture").node());
        selector.clearAll();

        selector.registerChangeHandler(testChangeHandler);

        selector.setVisibleStatistics(makeStatsMap(false, true, false, true));
        assert.deepEqual(lastVisibleStats, makeStatsMap(false, true, false, true));
        assert.strictEqual(1, callCount);
        const checkboxes = $("#qunit-fixture input");
        for (let index = 0; index < 4; index += 1) {
            assert.strictEqual(checkboxes[index].checked, index % 2 === 1);
        }
    });
})();