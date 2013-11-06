/* global d3, $ */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function() {
    "use strict";

    var ComparisonSelector = SplitsBrowser.Controls.ComparisonSelector;

    module("Comparison Selector");

    var lastSelector = null;
    var callCount = 0;

    function resetLastSelector() {
        lastSelector = null;
        callCount = 0;
    }

    var _FASTEST_TIME = "fastest time";

    var _WINNER = "winner";
    
    // CSS selector for the comparison drop-down.
    var _COMPARISON_SELECTOR_SELECTOR = "#qunit-fixture select#comparisonSelector";
    
    // CSS selector for the runner drop-down.
    var _RUNNER_SELECTOR_SELECTOR = "#qunit-fixture select#runnerSelector";

    function handleComparisonChanged(selector) {
        lastSelector = selector;
        callCount += 1;
    }
    
    function getDummyAgeClassSet(competitors) {
        return {
            allCompetitors: competitors,
            getWinnerCumTimes: function () { return _WINNER; },
            getFastestCumTimes: function () { return _FASTEST_TIME; },
            getFastestCumTimesPlusPercentage: function(percent) { return _FASTEST_TIME + ":" + percent; }
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

    QUnit.test("Comparison selector created enabled and with runner selector populated but not displayed", function(assert) {
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        
        var htmlSelectSelection = d3.select(_COMPARISON_SELECTOR_SELECTOR);
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.equal(htmlSelect.disabled, false, "Selector should be enabled");
        assert.ok(htmlSelect.options.length > 2, "More than two options should be created");
        assert.ok(htmlSelect.selectedIndex >= 0, "Selected index should not be negative");
        
        var func = selector.getComparisonFunction();
        assert.equal(_FASTEST_TIME, func(DUMMY_CLASS_SET));
        
        htmlSelectSelection = d3.select(_RUNNER_SELECTOR_SELECTOR);
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        
        htmlSelect = htmlSelectSelection.node();
        assert.equal(htmlSelect.options.length, DUMMY_CLASS_SET.allCompetitors.length, "Wrong number of options created");
        assert.equal(htmlSelect.selectedIndex, 0, "Runner selector should be created with the first item selected");
        
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
    });

    QUnit.test("Comparison selector created enabled and with runner selector populated with completing competitors only", function(assert) {
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        var ageClassSet = getDummyAgeClassSetWithMispuncher();
        selector.setAgeClassSet(ageClassSet);
        
        var htmlSelectSelection = d3.select(_RUNNER_SELECTOR_SELECTOR);
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.equal(htmlSelect.options.length, ageClassSet.allCompetitors.length - 1, "Expected one fewer item than the number of competitors");
        assert.equal(htmlSelect.selectedIndex, 0, "Runner selector should be created with the first item selected");
        
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
    });

    QUnit.test("Comparison selector created and runner selector displayed when selecting last item", function(assert) {
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allCompetitors[0].getAllCumulativeTimes());
        
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), true, "Runner selector should be shown");
    });

    QUnit.test("Correct competitor index selected when runner list contains a mispuncher", function(assert) {
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        var ageClassSet = getDummyAgeClassSetWithMispuncher();
        selector.setAgeClassSet(ageClassSet);
        
        var htmlComparisonSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlComparisonSelect).val(htmlComparisonSelect.options.length - 1).change();
        
        var htmlRunnerSelector = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        $(htmlRunnerSelector).val(2).change();
        assert.equal(htmlRunnerSelector.selectedIndex, 1);
        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allCompetitors[2].getAllCumulativeTimes()); 
    });

    QUnit.test("Registering a handler and changing a value in the comparison selector triggers a call to change callback", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);
        
        var htmlSelectSelection = d3.select(_COMPARISON_SELECTOR_SELECTOR);
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();

        var func = selector.getComparisonFunction();
        assert.equal(func(DUMMY_CLASS_SET), _FASTEST_TIME + ":5");
        assert.equal(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Registering a handler and changing a value in the runner selector triggers a call to change callback", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.setAgeClassSet(DUMMY_CLASS_SET);        

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), true, "Runner selector should be shown");
        $(htmlSelect).val(0).change();
        assert.strictEqual($(_RUNNER_SELECTOR_SELECTOR).is(":visible"), false, "Runner selector should not be shown");
    });

    QUnit.test("Registering two handlers and changing a value in the selector triggers a call to both callbacks", function(assert) {
        resetLastSelector();
        
        var lastSelector2 = null;
        var callCount2 = null;
        var secondHandler = function(selector) {
            lastSelector2 = selector;
            callCount2 += 1;
        };
        
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        
        selector.registerChangeHandler(handleComparisonChanged);
        selector.registerChangeHandler(secondHandler);
        
        var htmlSelectSelection = d3.select(_COMPARISON_SELECTOR_SELECTOR);
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        
        assert.equal(typeof lastSelector, "function");
        assert.equal(lastSelector(DUMMY_CLASS_SET), _FASTEST_TIME + ":5", "Second comparison option should have been changed");
        assert.equal(callCount, 1, "One change should have been recorded");
        assert.equal(lastSelector2(DUMMY_CLASS_SET), _FASTEST_TIME + ":5", "Second comparison option should have been changed");
        assert.equal(callCount2, 1, "One change should have been recorded");
    });

    QUnit.test("Registering the same handler twice and changing a value in the selector triggers only one call to change callback", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        
        selector.registerChangeHandler(handleComparisonChanged);
        selector.registerChangeHandler(handleComparisonChanged);
        
        var htmlSelectSelection = d3.select(_COMPARISON_SELECTOR_SELECTOR);
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        
        assert.equal(typeof lastSelector, "function");
        assert.equal(lastSelector(DUMMY_CLASS_SET), _FASTEST_TIME + ":5", "Second comparison option should have been changed");
        assert.equal(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Runner selector appears if 'Any Runner...' is selected and disappears when deselected", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.setAgeClassSet(DUMMY_CLASS_SET);        
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        selector.registerChangeHandler(handleComparisonChanged);
        
        htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(1).change();

        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allCompetitors[1].getAllCumulativeTimes());
        assert.equal(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Runner selector repopulated when class data changes", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        var htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        
        selector.setAgeClassSet(DUMMY_CLASS_SET);        
        assert.equal(htmlSelect.options.length, DUMMY_CLASS_SET.allCompetitors.length, "Expected "  + DUMMY_CLASS_SET.allCompetitors.length + " options to be created");

        selector.setAgeClassSet(getDummyAgeClassSet([{name: "four", completed: returnTrue}, {name: "five", completed: returnTrue}, {name: "six", completed: returnTrue}, {name: "seven", completed: returnTrue}]));
        assert.equal(htmlSelect.options.length, 4, "Wrong number of options created");

        selector.setAgeClassSet(getDummyAgeClassSet([{name: "eight", completed: returnTrue}, {name: "nine", completed: returnTrue}]));
        assert.equal(htmlSelect.options.length, 2, "Wrong number of options created");
    });

    QUnit.test("Runner selector appears if 'Any Runner...' is selected and disappears when deselected", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.setAgeClassSet(DUMMY_CLASS_SET);        
        
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        selector.registerChangeHandler(handleComparisonChanged);
        
        htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(1).change();

        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allCompetitors[1].getAllCumulativeTimes());
        assert.equal(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Runner selector remains selected on same runner if age-class set changes and selected runner still in list", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        
        selector.setAgeClassSet(DUMMY_CLASS_SET);
        $(htmlSelect).val(2).change();

        selector.setAgeClassSet(getDummyAgeClassSet(competitors.slice(1)));
        assert.strictEqual($(htmlSelect).val(), "1");
    });

    QUnit.test("Runner selector returns to first runner if age-class set changes and selected runner no longer in list", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        
        htmlSelect = d3.select(_RUNNER_SELECTOR_SELECTOR).node();
        
        selector.setAgeClassSet(DUMMY_CLASS_SET);        
        $(htmlSelect).val(2).change();

        selector.setAgeClassSet(getDummyAgeClassSet(competitors.slice(0, 2)));
        assert.strictEqual($(htmlSelect).val(), "0");
    });
})();