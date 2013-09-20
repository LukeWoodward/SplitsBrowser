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

    function handleComparisonChanged(selector) {
        lastSelector = selector;
        callCount += 1;
    }

    var DUMMY_COURSE_DATA = {
        getWinner: function () { return _WINNER; },
        getFastestTime: function () { return _FASTEST_TIME; },
        getFastestTimePlusPercentage: function(percent) { return _FASTEST_TIME + ":" + percent; }
    };

    QUnit.test("Comparison selector created enabled", function(assert) {
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.equal(htmlSelect.disabled, false, "Selector should be enabled");
        assert.ok(htmlSelect.options.length > 2, "More than two options should be created");
        assert.ok(htmlSelect.selectedIndex >= 0, "Selected index should not be negative");
        
        var func = selector.getComparisonFunction();
        assert.equal(_FASTEST_TIME, func(DUMMY_COURSE_DATA));    
    });

    QUnit.test("Registering a handler and changing a value in the selector triggers a call to change callback", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleComparisonChanged);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();

        var func = selector.getComparisonFunction();
        assert.equal(func(DUMMY_COURSE_DATA), _FASTEST_TIME + ":5");
        assert.equal(callCount, 1, "One change should have been recorded");
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
        selector.registerChangeHandler(handleComparisonChanged);
        selector.registerChangeHandler(secondHandler);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        
        assert.equal(typeof lastSelector, "function");
        assert.equal(lastSelector(DUMMY_COURSE_DATA), _FASTEST_TIME + ":5", "Second comparison option should have been changed");
        assert.equal(callCount, 1, "One change should have been recorded");
        assert.equal(lastSelector2(DUMMY_COURSE_DATA), _FASTEST_TIME + ":5", "Second comparison option should have been changed");
        assert.equal(callCount2, 1, "One change should have been recorded");
    });


    QUnit.test("Registering the same handler twice and changing a value in the selector triggers only one call to change callback", function(assert) {
        resetLastSelector();
        var selector = new ComparisonSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleComparisonChanged);
        selector.registerChangeHandler(handleComparisonChanged);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        
        assert.equal(typeof lastSelector, "function");
        assert.equal(lastSelector(DUMMY_COURSE_DATA), _FASTEST_TIME + ":5", "Second comparison option should have been changed");
        assert.equal(callCount, 1, "One change should have been recorded");
    });
})();