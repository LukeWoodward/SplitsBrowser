/*
 *  SplitsBrowser Original Data Selector tests.
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

    QUnit.module("Original Data Selector");

    const OriginalDataSelector = SplitsBrowser.Controls.OriginalDataSelector;

    let callCount = 0;

    let lastShowOriginalData = null;

    function testChangeHandler(showOriginalData) {
        lastShowOriginalData = showOriginalData;
        callCount += 1;
    }

    function reset() {
        lastShowOriginalData = null;
        callCount = 0;
    }

    QUnit.test("Can create selector with checkbox", assert => {
        const parent = d3.select("#qunit-fixture");
        new OriginalDataSelector(parent);

        assert.strictEqual(parent.select("input[type=checkbox]").size(), 1);
    });

    QUnit.test("Calls change handler when unchecked and clicked", assert => {
        reset();
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.registerChangeHandler(testChangeHandler);

        $(parent.select("input[type=checkbox]").node()).attr("checked", false).trigger("click");
        assert.strictEqual(lastShowOriginalData, true, "Handler should have been called with the show-original flag set to true");
        assert.strictEqual(callCount, 1, "Handler should have been called once");
        assert.strictEqual(selector.isOriginalDataSelected(), true, "Original data should be selected");
    });

    QUnit.test("Calls change handler when registered but not when deregistered", assert => {
        reset();
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.registerChangeHandler(testChangeHandler);

        $(parent.select("input[type=checkbox]").node()).attr("checked", false).trigger("click");
        assert.strictEqual(callCount, 1, "Handler should have been called once");

        selector.deregisterChangeHandler(testChangeHandler);
        $(parent.select("input[type=checkbox]").node()).trigger("click");
        assert.strictEqual(callCount, 1, "Handler should still have been called once");
    });

    QUnit.test("Calls change handler once when registered twice", assert => {
        reset();
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.registerChangeHandler(testChangeHandler);
        selector.registerChangeHandler(testChangeHandler);

        $(parent.select("input[type=checkbox]").node()).attr("checked", false).trigger("click");
        assert.strictEqual(callCount, 1, "Handler should have been called once");
    });

    QUnit.test("Can deregister handler that was never registered without error", assert => {
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.deregisterChangeHandler(testChangeHandler);
        assert.expect(0); // No assertions
    });

    QUnit.test("Calls multiple change handlers when unchecked and clicked", assert => {
        reset();
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.registerChangeHandler(testChangeHandler);

        let lastShowOriginalData2 = null;
        let callCount2 = null;
        const handler2 = showOriginalData => {
            lastShowOriginalData2 = showOriginalData;
            callCount2 += 1;
        };

        selector.registerChangeHandler(handler2);

        $(parent.select("input[type=checkbox]").node()).attr("checked", false).trigger("click");
        assert.strictEqual(lastShowOriginalData, true, "Handler should have been called with the show-original flag set to true");
        assert.strictEqual(callCount, 1, "Handler should have been called once");
        assert.strictEqual(lastShowOriginalData2, true, "Second handler should have been called with the show-original flag set to true");
        assert.strictEqual(callCount2, 1, "Second handler should have been called once");
    });

    QUnit.test("Calls change handler when checked and clicked", assert => {
        reset();
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.registerChangeHandler(testChangeHandler);

        $(parent.select("input[type=checkbox]").node()).attr("checked", true).trigger("click");
        assert.strictEqual(lastShowOriginalData, false, "Handler should have been called with the show-original flag set to false");
        assert.strictEqual(callCount, 1, "Handler should have been called once");
    });

    QUnit.test("Does nothing when disabled and clicked", assert => {
        reset();
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.setEnabled(false);
        selector.registerChangeHandler(testChangeHandler);

        $(parent.select("input[type=checkbox]").node()).attr("checked", true).trigger("click");
        assert.strictEqual(callCount, 0, "Change handler should not have been called");
    });

    QUnit.test("When selector is hidden, checkbox is no longer visible", assert => {
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.setVisible(false);
        assert.ok(!$("input[type=checkbox]", parent.node()).is(":visible"), "Selector should not be visible when set to not be visible");
    });

    QUnit.test("When selector is hidden and shown, checkbox is visible once again", assert => {
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.setVisible(false);
        selector.setVisible(true);
        assert.ok($("input[type=checkbox]", parent.node()).is(":visible"), "Selector should be visible when set to be visible");
    });

    QUnit.test("Calling selectOriginalData selects original data", assert => {
        reset();
        const parent = d3.select("#qunit-fixture");
        const selector = new OriginalDataSelector(parent);
        selector.setVisible(true);
        selector.registerChangeHandler(testChangeHandler);
        selector.selectOriginalData();
        assert.ok(lastShowOriginalData, true, "Handler should have been called with the show-original flag set to true");
        assert.ok($("input[type=checkbox]", parent.node()).is(":checked"), "Selector should be checked");
    });
})();