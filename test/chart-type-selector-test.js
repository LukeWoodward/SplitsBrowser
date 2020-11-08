/*
 *  SplitsBrowser - ChartTypeSelector tests.
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
(function (){
    "use strict";

    const ChartTypeSelector = SplitsBrowser.Controls.ChartTypeSelector;

    QUnit.module("Chart Type Selector");

    const chartTypes = [
        SplitsBrowser.Model.ChartTypes.get("SplitsGraph"),
        SplitsBrowser.Model.ChartTypes.get("RaceGraph"),
        SplitsBrowser.Model.ChartTypes.get("PositionAfterLeg")
    ];

    let lastChartTypeName = null;
    let callCount = 0;

    function resetLastChartType() {
        lastChartTypeName = null;
        callCount = 0;
    }

    function handleChartTypeChanged(chartType) {
        lastChartTypeName = chartType.nameKey;
        callCount += 1;
    }

    function createSelector() {
        return new ChartTypeSelector(d3.select("#qunit-fixture").node(), chartTypes);
    }

    QUnit.test("Can construct the selector", assert => {
        createSelector();

        const htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");

        const htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.options.length, 3, "Three items should be created");
    });

    QUnit.test("Registering a handler and changing a value in the selector triggers a call to change callback", assert => {
        resetLastChartType();
        const selector = createSelector();
        selector.registerChangeHandler(handleChartTypeChanged);

        const htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        const htmlSelect = htmlSelectSelection.node();
        $(htmlSelect).val(2).change();

        assert.strictEqual(lastChartTypeName, chartTypes[2].nameKey, "The third chart type should have been selected");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Registering two handlers and changing a value in the selector triggers a call to both callbacks", assert => {
        resetLastChartType();

        let lastChartTypeName2 = null;
        let callCount2 = null;
        function secondHandler(chartType) {
            lastChartTypeName2 = chartType.nameKey;
            callCount2 += 1;
        }

        const selector = createSelector();
        selector.registerChangeHandler(handleChartTypeChanged);
        selector.registerChangeHandler(secondHandler);

        const htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        const htmlSelect = htmlSelectSelection.node();
        $(htmlSelect).val(2).change();

        assert.strictEqual(lastChartTypeName, chartTypes[2].nameKey, "The third chart type should have been selected");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
        assert.strictEqual(lastChartTypeName2, chartTypes[2].nameKey, "The third chart type should have been selected");
        assert.strictEqual(callCount2, 1, "One change should have been recorded");
    });

    QUnit.test("Registering the same handler twice and changing a value in the selector triggers only one call to change callback", assert => {
        resetLastChartType();
        const selector = createSelector();
        selector.registerChangeHandler(handleChartTypeChanged);
        selector.registerChangeHandler(handleChartTypeChanged);

        const htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        const htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();

        assert.strictEqual(lastChartTypeName, chartTypes[2].nameKey, "The third chart type should have been selected");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Race graph notifier function called and selection reverted if notifier set", assert => {
        resetLastChartType();
        const selector = createSelector();
        selector.registerChangeHandler(handleChartTypeChanged);

        let notifierCalled = false;
        selector.setRaceGraphDisabledNotifier(() => notifierCalled = true);

        const htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        const htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(1).change();

        assert.ok(notifierCalled, "Notifier function should have been called");
        assert.strictEqual(lastChartTypeName, chartTypes[0].nameKey, "The first chart type should have been selected");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Race graph notifier function called and selection reverted to previous selection if notifier set", assert => {
        resetLastChartType();
        const selector = createSelector();
        selector.registerChangeHandler(handleChartTypeChanged);

        let notifierCalled = false;
        selector.setRaceGraphDisabledNotifier(() => notifierCalled = true);

        const htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        const htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();

        assert.ok(!notifierCalled, "Notifier function should not have been called");
        assert.strictEqual(lastChartTypeName, chartTypes[2].nameKey, "The third chart type should have been selected");

        $(htmlSelect).val(1).change();

        assert.ok(notifierCalled, "Notifier function should have been called");
        assert.strictEqual(lastChartTypeName, chartTypes[2].nameKey, "The third chart type should still be selected");
    });

    QUnit.test("Setting the chart type to a recognised type sets the type and calls change handler", assert => {
        resetLastChartType();
        const selector = createSelector();
        selector.registerChangeHandler(handleChartTypeChanged);

        const htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        const htmlSelect = htmlSelectSelection.node();

        const chartType = chartTypes[2];

        selector.setChartType(chartType);

        assert.strictEqual(htmlSelect.selectedIndex, 2);
        assert.strictEqual(selector.getChartType(), chartType);

        assert.strictEqual(lastChartTypeName, chartType.nameKey, "The third chart type should have been selected");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Setting the chart type to an unrecognised type does nothing and does not call change handler", assert => {
        resetLastChartType();
        const selector = createSelector();
        selector.registerChangeHandler(handleChartTypeChanged);

        const htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        const htmlSelect = htmlSelectSelection.node();

        selector.setChartType("This is not a recognised chart type");

        assert.strictEqual(htmlSelect.selectedIndex, 0);

        assert.strictEqual(callCount, 0, "No changes should have been recorded");
    });

    QUnit.test("Race graph notifier function called and selection reverted to splits graph if notifier set while race graph selected", assert => {
        resetLastChartType();
        const selector = createSelector();

        const htmlSelect = $("#qunit-fixture select")[0];
        $(htmlSelect).val(1).change();

        selector.registerChangeHandler(handleChartTypeChanged);

        let notifierCalled = false;
        selector.setRaceGraphDisabledNotifier(() => notifierCalled = true);

        assert.ok(notifierCalled, "Notifier function should have been called");
        assert.strictEqual($(htmlSelect).val(), "0", "The splits graph should now be selected");
        assert.strictEqual(lastChartTypeName, chartTypes[0].nameKey, "The first chart type should have been selected");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
    });
})();
