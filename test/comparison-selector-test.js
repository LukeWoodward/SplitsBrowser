/*
 *  SplitsBrowser - ComparisonSelector tests.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
(function() {
    "use strict";

    var ComparisonSelector = SplitsBrowser.Controls.ComparisonSelector;

    module("Comparison Selector");

    var lastSelector = null;
    var callCount = 0;

    var alertsReceived = [];
    
    function resetLastSelector() {
        lastSelector = null;
        callCount = 0;
        alertsReceived = [];
    }

    var _FASTEST_TIME = "fastest time";

    var _WINNER = "winner";
    
    // CSS selector for the comparison drop-down.
    var _COMPARISON_SELECTOR_SELECTOR = "#qunit-fixture select#comparisonSelector";
    
    // CSS selector for the runner drop-down.
    var _RUNNER_SELECTOR_SELECTOR = "#qunit-fixture select#runnerSelector";

    function alerter(message) {
        alertsReceived.push(message);
    }
    
    function handleComparisonChanged(selector) {
        lastSelector = selector;
        callCount += 1;
    }
    
    function getDummyAgeClassSet(competitors) {
        return {
            allCompetitors: competitors,
            getWinnerCumTimes: function () { return _WINNER; },
            getFastestCumTimes: function () { return _FASTEST_TIME; },
            getFastestCumTimesPlusPercentage: function(percent) { return _FASTEST_TIME + ":" + percent; },
            getCumulativeTimesForCompetitor: function (index) { return competitors[index].getAllCumulativeTimes(); }
        };
    }
    
    function returnTrue() {
        return true;
    }

    var competitors =  [
        { name: "one", getAllCumulativeTimes: function() { return [1, 2]; }, completed: returnTrue },
        { name: "two", getAllCumulativeTimes: function() { return [3, 4]; }, completed: returnTrue },
        { name: "three", getAllCumulativeTimes: function() { return [5, 6]; }, completed: returnTrue }
    ];
    
    var DUMMY_CLASS_SET = getDummyAgeClassSet(competitors);
    
    function getDummyAgeClassSetWithMispuncher() {
        var competitorsWithMispuncher = competitors.slice(0);
        competitorsWithMispuncher[1] = { name : competitors[1].name, completed: function () { return false; } };
        return getDummyAgeClassSet(competitorsWithMispuncher);
    }
    
    function getDummyAgeClassSetWithNoWinner() {
        var returnFalse = function () { return false; };
        var winnerlessCompetitors = competitors.map(function (comp) {
            return { name: comp.name, getAllCumulativeTimes: comp.getAllCumulativeTimes, completed: returnFalse };
        });

        return getDummyAgeClassSet(winnerlessCompetitors);
    }
    
    function createSelector() {
        return new ComparisonSelector(d3.select("#qunit-fixture").node(), alerter);
    }

    QUnit.test("Comparison selector created enabled and with runner selector populated but not displayed", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        
        var htmlSelectSelection = d3.select(_COMPARISON_SELECTOR_SELECTOR);
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.disabled, false, "Selector should be enabled");
        assert.ok(htmlSelect.options.length > 2, "More than two options should be created");
        assert.ok(htmlSelect.selectedIndex >= 0, "Selected index should not be negative");
        
        var func = selector.getComparisonFunction();
        assert.strictEqual(_FASTEST_TIME, func(DUMMY_CLASS_SET));
        
        htmlSelectSelection = d3.select(_RUNNER_SELECTOR_SELECTOR);
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        
        htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.options.length, DUMMY_CLASS_SET.allCompetitors.length, "Wrong number of options created");
        assert.strictEqual(htmlSelect.selectedIndex, 0, "Runner selector should be created with the first item selected");
        
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
        
        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Comparison selector created enabled and with runner selector populated with completing competitors only", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        var ageClassSet = getDummyAgeClassSetWithMispuncher();
        selector.setAgeClassSet(ageClassSet);
        
        var htmlSelectSelection = d3.select(_RUNNER_SELECTOR_SELECTOR);
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.options.length, ageClassSet.allCompetitors.length - 1, "Expected one fewer item than the number of competitors");
        assert.strictEqual(htmlSelect.selectedIndex, 0, "Runner selector should be created with the first item selected");
        
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
        
        assert.deepEqual(selector.getComparisonType(), {index: 1, runner: null});
    });

    QUnit.test("Comparison selector created and runner selector displayed when selecting last item", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allCompetitors[0].getAllCumulativeTimes());
        
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), true, "Runner selector should be shown");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Correct competitor index selected when runner list contains a mispuncher", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        var ageClassSet = getDummyAgeClassSetWithMispuncher();
        selector.setAgeClassSet(ageClassSet);
        
        var htmlComparisonSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlComparisonSelect).val(htmlComparisonSelect.options.length - 1).change();
        
        var htmlRunnerSelector = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        $(htmlRunnerSelector).val(2).change();
        assert.strictEqual(htmlRunnerSelector.selectedIndex, 1);
        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allCompetitors[2].getAllCumulativeTimes()); 

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Registering a handler and changing a value in the comparison selector triggers a call to change callback", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);
        
        var htmlSelectSelection = d3.select(_COMPARISON_SELECTOR_SELECTOR);
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();

        var func = selector.getComparisonFunction();
        assert.strictEqual(func(DUMMY_CLASS_SET), _FASTEST_TIME + ":5");
        assert.strictEqual(callCount, 1, "One change should have been recorded");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Registering a handler and changing a value in the runner selector triggers a call to change callback", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);        

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), true, "Runner selector should be shown");
        $(htmlSelect).val(0).change();
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
        
        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Registering two handlers and changing a value in the selector triggers a call to both callbacks", function(assert) {
        resetLastSelector();
        
        var lastSelector2 = null;
        var callCount2 = null;
        var secondHandler = function(selector) {
            lastSelector2 = selector;
            callCount2 += 1;
        };
        
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        
        selector.registerChangeHandler(handleComparisonChanged);
        selector.registerChangeHandler(secondHandler);
        
        var htmlSelectSelection = d3.select(_COMPARISON_SELECTOR_SELECTOR);
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        
        assert.strictEqual(typeof lastSelector, "function");
        assert.strictEqual(lastSelector(DUMMY_CLASS_SET), _FASTEST_TIME + ":5", "Second comparison option should have been changed");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
        assert.strictEqual(lastSelector2(DUMMY_CLASS_SET), _FASTEST_TIME + ":5", "Second comparison option should have been changed");
        assert.strictEqual(callCount2, 1, "One change should have been recorded");
        
        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Registering the same handler twice and changing a value in the selector triggers only one call to change callback", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        
        selector.registerChangeHandler(handleComparisonChanged);
        selector.registerChangeHandler(handleComparisonChanged);
        
        var htmlSelectSelection = d3.select(_COMPARISON_SELECTOR_SELECTOR);
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        
        assert.strictEqual(typeof lastSelector, "function");
        assert.strictEqual(lastSelector(DUMMY_CLASS_SET), _FASTEST_TIME + ":5", "Second comparison option should have been changed");
        assert.strictEqual(callCount, 1, "One change should have been recorded");
        
        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Runner selector appears if 'Any Runner...' is selected and disappears when deselected", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);        
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        selector.registerChangeHandler(handleComparisonChanged);
        
        htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(1).change();

        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allCompetitors[1].getAllCumulativeTimes());
        assert.strictEqual(callCount, 1, "One change should have been recorded");
        
        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Can get comparison type when selecting a runner from the 'Any runner...' drop-down", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);        
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        var anyRunnerOptionIndex = htmlSelect.options.length - 1;
        $(htmlSelect).val(anyRunnerOptionIndex).change();
        
        htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(1).change();

        var comparisonType = selector.getComparisonType();
        assert.deepEqual(comparisonType, {index: anyRunnerOptionIndex, runner: competitors[1]}, "Selected runner should be in the comparison type");
    });

    QUnit.test("Runner selector repopulated when class data changes", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        var htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        
        selector.setAgeClassSet(DUMMY_CLASS_SET);        
        assert.strictEqual(htmlSelect.options.length, DUMMY_CLASS_SET.allCompetitors.length, "Expected "  + DUMMY_CLASS_SET.allCompetitors.length + " options to be created");

        selector.setAgeClassSet(getDummyAgeClassSet([{name: "four", completed: returnTrue}, {name: "five", completed: returnTrue}, {name: "six", completed: returnTrue}, {name: "seven", completed: returnTrue}]));
        assert.strictEqual(htmlSelect.options.length, 4, "Wrong number of options created");

        selector.setAgeClassSet(getDummyAgeClassSet([{name: "eight", completed: returnTrue}, {name: "nine", completed: returnTrue}]));
        assert.strictEqual(htmlSelect.options.length, 2, "Wrong number of options created");
        
        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Runner selector remains selected on same runner if age-class set changes and selected runner still in list", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        
        $(htmlSelect).val(2).change();

        selector.setAgeClassSet(getDummyAgeClassSet(competitors.slice(1)));
        assert.strictEqual($(htmlSelect).val(), "1");
        
        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Runner selector returns to first runner if age-class set changes and selected runner no longer in list", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        
        $(htmlSelect).val(2).change();

        selector.setAgeClassSet(getDummyAgeClassSet(competitors.slice(0, 2)));
        assert.strictEqual($(htmlSelect).val(), "0");
        
        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Alert issued and selector returns to previous index without firing handlers if age-class set has no winner and 'Winner' option chosen", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(getDummyAgeClassSetWithNoWinner());
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(2).change();
        
        selector.registerChangeHandler(handleComparisonChanged);
        $(htmlSelect).val(0).change();
        
        assert.strictEqual($(htmlSelect).val(), "2", "Selector should return to previous index: selector index is " + $(htmlSelect)[0].selectedIndex);
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");
        
        assert.strictEqual(alertsReceived.length, 1, "One alert should have been issued");
    });

    QUnit.test("Alert issued and selector returns to previous index without firing handlers if age-class set has no winner and 'Any runner...' option chosen", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(getDummyAgeClassSetWithNoWinner());
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(3).change();
        
        selector.registerChangeHandler(handleComparisonChanged);
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        assert.strictEqual($(htmlSelect).val(), "3", "Selector should return to previous index");
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 1, "One alert should have been issued, message was '" + ((alertsReceived.length === 0) ? "(none)" : alertsReceived[0]) + "'");
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
    });    

    QUnit.test("Can set selector value to a given index that isn't Any Runner", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);
        
        selector.setComparisonType(3, null);
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        assert.strictEqual($(htmlSelect).val(), "3");               
        assert.strictEqual(callCount, 1, "One call to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
    });    

    QUnit.test("Cannot set selector value to a negative index", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);
        
        selector.setComparisonType(-1, null);
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        assert.strictEqual($(htmlSelect).val(), "1");               
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
    });    

    QUnit.test("Cannot set selector value to an index too large", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(htmlSelect.options.length, null);
        
        assert.strictEqual($(htmlSelect).val(), "1");               
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
    });    

    QUnit.test("Can set selector value to a named runner", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(htmlSelect.options.length - 1,  competitors[1]);
        
        assert.strictEqual($(htmlSelect).val(), (htmlSelect.options.length - 1).toString());               
        assert.strictEqual(callCount, 1, "One call to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        
        var runnerSelect = $(_RUNNER_SELECTOR_SELECTOR);
        assert.strictEqual(runnerSelect.is(":visible"), true, "Runner should not be shown");
        assert.strictEqual(runnerSelect.val(), "1", "Second competitor should have been selected");
    });

    QUnit.test("Setting selector value to a nonexistent runner has no effect", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(htmlSelect.options.length - 1, "This is not a valid competitor");
        
        assert.strictEqual($(htmlSelect).val(), "1");               
        assert.strictEqual(callCount, 0, "No call to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
    });
    
})();