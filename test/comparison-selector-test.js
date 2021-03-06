/*
 *  SplitsBrowser - ComparisonSelector tests.
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
(function() {
    "use strict";

    var ComparisonSelector = SplitsBrowser.Controls.ComparisonSelector;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    var Result = SplitsBrowser.Model.Result;
    var Competitor = SplitsBrowser.Model.Competitor;
    var Team = SplitsBrowser.Model.Team;

    QUnit.module("Comparison Selector");

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

    // CSS selector for the result drop-down.
    var _RESULT_SELECTOR_SELECTOR = "#qunit-fixture select#resultSelector";

    // CSS selector for the "Runner:" or "Team:" text.
    var _RESULT_SPAN_SELECTOR = "#qunit-fixture span#resultSpan";

    function alerter(message) {
        alertsReceived.push(message);
    }

    function handleComparisonChanged(selector) {
        lastSelector = selector;
        callCount += 1;
    }

    function getDummyCourseClassSet(results, hasTeamData) {
        return {
            allResults: results,
            getWinnerCumTimes: function () { return _WINNER; },
            getFastestCumTimes: function () { return _FASTEST_TIME; },
            getFastestCumTimesPlusPercentage: function(percent) { return _FASTEST_TIME + ":" + percent; },
            getCumulativeTimesForResult: function (index) { return results[index].getAllCumulativeTimes(); },
            hasTeamData: function () { return hasTeamData; }
        };
    }

    var results =  [
        Result.fromCumTimes(1, null, [0, 1, 2], new Competitor("one", null)),
        Result.fromCumTimes(2, null, [0, 3, 4], new Competitor("two", null)),
        Result.fromCumTimes(3, null, [0, 5, 6], new Competitor("three", null)),
    ];

    var extraResult = Result.fromCumTimes(4, null, [0, 7, 8], new Competitor("four", null));

    var DUMMY_CLASS_SET = getDummyCourseClassSet(results, false);

    function getDummyCourseClassSetWithMispuncher() {
        var resultsWithMispuncher = results.slice(0);
        resultsWithMispuncher[1] = Result.fromCumTimes(2, null, [0, 3, null], results[1].owner);
        return getDummyCourseClassSet(resultsWithMispuncher, false);
    }

    /**
     * Clones the given result and disqualifies them.  (This is used for creating classes
     * that have no winners.)
     * @param {Result} result The result to clone.
     * @returns {Result} The cloned result.
     */
    function cloneAndDisqualify(result) {
        var dsqResult = Result.fromCumTimes(result.order, null, result.getAllCumulativeTimes(), result.owner);
        dsqResult.disqualify();
        return dsqResult;
    }

    function getDummyCourseClassSetWithNoWinner(hasTeamData) {
        return getDummyCourseClassSet(results.map(cloneAndDisqualify), hasTeamData);
    }

    function getDummyCourseClassSetWithNoWinnerOnOneClassAndAWinnerOnAnother() {
        var allResults = [extraResult].concat(results.map(cloneAndDisqualify));
        return getDummyCourseClassSet(allResults, false);
    }

    function getDummyTeamCourseClassSet() {
        var team1 = new Team("Team 1", null);
        var team2 = new Team("Team 2", null);
        var team3 = new Team("Team 3", null);

        team1.setMembers([new Competitor("1a", null), new Competitor("1b", null)]);
        team2.setMembers([new Competitor("2a", null), new Competitor("2b", null)]);
        team3.setMembers([new Competitor("3a", null), new Competitor("3b", null)]);

        return getDummyCourseClassSet([
            Result.fromCumTimes(1, null, [0, 1, 2], team1),
            Result.fromCumTimes(1, null, [0, 3, 4], team2),
            Result.fromCumTimes(1, null, [0, 5, 6], team3)
        ], true);
    }

    function createSelector() {
        return new ComparisonSelector(d3.select("#qunit-fixture").node(), alerter);
    }

    QUnit.test("Comparison selector created enabled and with result selector populated but not displayed", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);

        var htmlSelectSelection = d3.select(_COMPARISON_SELECTOR_SELECTOR);
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");

        var htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.disabled, false, "Selector should be enabled");
        assert.ok(htmlSelect.options.length > 2, "More than two options should be created");
        assert.ok(htmlSelect.selectedIndex >= 0, "Selected index should not be negative");

        var func = selector.getComparisonFunction();
        assert.strictEqual(_FASTEST_TIME, func(DUMMY_CLASS_SET));

        htmlSelectSelection = d3.select(_RESULT_SELECTOR_SELECTOR);
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");

        htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.options.length, DUMMY_CLASS_SET.allResults.length, "Wrong number of options created");
        assert.strictEqual(htmlSelect.selectedIndex, 0, "Result selector should be created with the first item selected");

        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should not be shown");

        assert.strictEqual($(_RESULT_SPAN_SELECTOR).text(), getMessage("CompareWithAnyRunnerLabel"), "Result span should contain 'Runner:' or suchlike");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Comparison selector created enabled and with result selector populated with completing results only", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        var courseClassSet = getDummyCourseClassSetWithMispuncher();
        selector.setCourseClassSet(courseClassSet);

        var htmlSelectSelection = d3.select(_RESULT_SELECTOR_SELECTOR);
        assert.strictEqual(htmlSelectSelection.size(), 1, "One element should be selected");

        var htmlSelect = htmlSelectSelection.node();
        assert.strictEqual(htmlSelect.options.length, courseClassSet.allResults.length - 1, "Expected one fewer item than the number of results");
        assert.strictEqual(htmlSelect.selectedIndex, 0, "Result selector should be created with the first item selected");

        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should not be shown");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");

        assert.deepEqual(selector.getComparisonType(), {index: 1, result: null});
    });

    QUnit.test("Comparison selector created and result selector displayed when selecting last item", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();

        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allResults[0].getAllCumulativeTimes());

        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), true, "Result selector should be shown");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Correct result index selected when result list contains a mispuncher", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        var courseClassSet = getDummyCourseClassSetWithMispuncher();
        selector.setCourseClassSet(courseClassSet);

        var htmlComparisonSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlComparisonSelect).val(htmlComparisonSelect.options.length - 1).change();

        var htmlResultSelector = d3.select(_RESULT_SELECTOR_SELECTOR).node();
        $(htmlResultSelector).val(2).change();
        assert.strictEqual(htmlResultSelector.selectedIndex, 1);
        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allResults[2].getAllCumulativeTimes());

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Registering a handler and changing a value in the comparison selector triggers a call to change callback", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);
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

    QUnit.test("Registering a handler and changing a value in the result selector triggers a call to change callback", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();

        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should not be shown");
        $(htmlSelect).val(htmlSelect.options.length - 1).change();
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), true, "Result selector should be shown");
        $(htmlSelect).val(0).change();
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should not be shown");

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
        selector.setCourseClassSet(DUMMY_CLASS_SET);

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
        selector.setCourseClassSet(DUMMY_CLASS_SET);

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

    QUnit.test("Result selector appears if 'Any Result...' is selected and disappears when deselected", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();

        $(htmlSelect).val(htmlSelect.options.length - 1).change();

        selector.registerChangeHandler(handleComparisonChanged);

        htmlSelect = d3.select(_RESULT_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(1).change();

        var func = selector.getComparisonFunction();
        assert.deepEqual(func(DUMMY_CLASS_SET), DUMMY_CLASS_SET.allResults[1].getAllCumulativeTimes());
        assert.strictEqual(callCount, 1, "One change should have been recorded");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Can get comparison type when selecting a result from the 'Any result...' drop-down", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        var anyResultOptionIndex = htmlSelect.options.length - 1;
        $(htmlSelect).val(anyResultOptionIndex).change();

        htmlSelect = d3.select(_RESULT_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(1).change();

        var comparisonType = selector.getComparisonType();
        assert.deepEqual(comparisonType, {index: anyResultOptionIndex, result: results[1]}, "Selected result should be in the comparison type");
    });

    QUnit.test("Result selector repopulated when class data changes", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        var htmlSelect = d3.select(_RESULT_SELECTOR_SELECTOR).node();

        selector.setCourseClassSet(DUMMY_CLASS_SET);
        assert.strictEqual(htmlSelect.options.length, DUMMY_CLASS_SET.allResults.length, "Expected "  + DUMMY_CLASS_SET.allResults.length + " options to be created");

        selector.setCourseClassSet(getDummyCourseClassSet(
            [
                Result.fromCumTimes(4, null, [0, 7, 8], new Competitor("four", null)),
                Result.fromCumTimes(4, null, [0, 9, 10], new Competitor("five", null)),
                Result.fromCumTimes(4, null, [0, 11, 12], new Competitor("six", null)),
                Result.fromCumTimes(4, null, [0, 13, 14], new Competitor("seven", null))
            ],
            false
        ));
        assert.strictEqual(htmlSelect.options.length, 4, "Wrong number of options created");

        selector.setCourseClassSet(getDummyCourseClassSet(
            [
                Result.fromCumTimes(4, null, [0, 15, 16], new Competitor("eight", null)),
                Result.fromCumTimes(4, null, [0, 17, 18], new Competitor("nine", null))
            ],
            false));
        assert.strictEqual(htmlSelect.options.length, 2, "Wrong number of options created");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Result selector remains selected on same result if course-class set changes and selected result still in list", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();

        htmlSelect = d3.select(_RESULT_SELECTOR_SELECTOR).node();

        $(htmlSelect).val(2).change();

        selector.setCourseClassSet(getDummyCourseClassSet(results.slice(1), false));
        assert.strictEqual($(htmlSelect).val(), "1");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Result selector returns to first result if course-class set changes and selected result no longer in list", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(htmlSelect.options.length - 1).change();

        htmlSelect = d3.select(_RESULT_SELECTOR_SELECTOR).node();

        $(htmlSelect).val(2).change();

        selector.setCourseClassSet(getDummyCourseClassSet(results.slice(0, 2), false));
        assert.strictEqual($(htmlSelect).val(), "0");

        assert.strictEqual(alertsReceived.length, 0, "No alerts should have been issued");
    });

    QUnit.test("Alert issued and selector returns to previous index without firing handlers if course-class set has no winner and 'Winner' option chosen", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinner(false));
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(2).change();

        selector.registerChangeHandler(handleComparisonChanged);
        $(htmlSelect).val(0).change();

        assert.strictEqual($(htmlSelect).val(), "2", "Selector should return to previous index: selector index is " + $(htmlSelect)[0].selectedIndex);
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");

        assert.strictEqual(alertsReceived.length, 1, "One alert should have been issued");
        assert.strictEqual(alertsReceived[0], getMessageWithFormatting("CannotCompareAsNoWinner", {"$$OPTION$$": getMessage("CompareWithWinner")}));
    });

    QUnit.test("Alert issued and selector returns to previous index without firing handlers if course-class set has no winner and 'Any result...' option chosen", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinner(false));
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(3).change();

        selector.registerChangeHandler(handleComparisonChanged);
        $(htmlSelect).val(htmlSelect.options.length - 1).change();

        assert.strictEqual($(htmlSelect).val(), "3", "Selector should return to previous index");
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 1, "One alert should have been issued, message was '" + ((alertsReceived.length === 0) ? "(none)" : alertsReceived[0]) + "'");
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should not be shown");
    });

    QUnit.test("Can set selector value to a given index that isn't Any Result", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);

        selector.setComparisonType(3, null);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        assert.strictEqual($(htmlSelect).val(), "3");
        assert.strictEqual(callCount, 1, "One call to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should not be shown");
    });

    QUnit.test("Cannot set selector value to a negative index", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);

        selector.setComparisonType(-1, null);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        assert.strictEqual($(htmlSelect).val(), "1");
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should not be shown");
    });

    QUnit.test("Cannot set selector value to an index too large", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(htmlSelect.options.length, null);

        assert.strictEqual($(htmlSelect).val(), "1");
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should not be shown");
    });

    QUnit.test("Can set selector value to a named result", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(htmlSelect.options.length - 1,  results[1]);

        assert.strictEqual($(htmlSelect).val(), (htmlSelect.options.length - 1).toString());
        assert.strictEqual(callCount, 1, "One call to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");

        var resultSelect = $(_RESULT_SELECTOR_SELECTOR);
        assert.strictEqual(resultSelect.is(":visible"), true, "Result should not be shown");
        assert.strictEqual(resultSelect.val(), "1", "Second result should have been selected");
    });

    QUnit.test("Setting selector value to a nonexistent result has no effect", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(DUMMY_CLASS_SET);
        selector.registerChangeHandler(handleComparisonChanged);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(htmlSelect.options.length - 1, "This is not a valid result");

        assert.strictEqual($(htmlSelect).val(), "1");
        assert.strictEqual(callCount, 0, "No call to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should not be shown");
    });

    QUnit.test("Can get the compared-against result after selecting to compare against any result", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinnerOnOneClassAndAWinnerOnAnother());
        selector.registerChangeHandler(handleComparisonChanged);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(htmlSelect.options.length - 1, extraResult);

        assert.strictEqual($(htmlSelect).val(), (htmlSelect.options.length - 1).toString(), "Initially the comparison should be set to 'Any result...'");
        assert.strictEqual(callCount, 1, "One call to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), true, "Result selector should be shown");

        assert.deepEqual(selector.getComparisonType(), {index: 6, result: extraResult});
    });

    QUnit.test("Comparison type reverts to from Winner to Fastest Time if removing a class removes the winner", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinnerOnOneClassAndAWinnerOnAnother());
        selector.registerChangeHandler(handleComparisonChanged);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(0, extraResult);

        assert.strictEqual($(htmlSelect).val(), "0", "Initially the comparison should be set to 'Winner'");

        resetLastSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinner(false));

        assert.strictEqual($(htmlSelect).val(), "1", "Later the comparison should be set to 'Fastest time'");
        assert.strictEqual(callCount, 1, "One call to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");

        assert.deepEqual(selector.getComparisonType(), {index: 1, result: null});
    });

    QUnit.test("Comparison type doesn't change from Fastest Time + 5% if removing a class removes the winner", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinnerOnOneClassAndAWinnerOnAnother());
        selector.registerChangeHandler(handleComparisonChanged);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(2, extraResult);

        assert.strictEqual($(htmlSelect).val(), "2", "Initially the comparison should be set to 'Fastest Time + 5%'");

        resetLastSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinner(false));

        assert.strictEqual($(htmlSelect).val(), "2", "The comparison should still be set to 'Fastest time + 5%'");
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");

        assert.deepEqual(selector.getComparisonType(), {index: 2, result: null});
    });

    QUnit.test("Comparison type reverts to from Any Result to Fastest Time if removing a class removes the winner", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinnerOnOneClassAndAWinnerOnAnother());
        selector.registerChangeHandler(handleComparisonChanged);

        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setComparisonType(htmlSelect.options.length - 1, extraResult);

        assert.strictEqual($(htmlSelect).val(), (htmlSelect.options.length - 1).toString(), "Initially the comparison should be set to 'Any result...'");
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), true, "Result selector should be shown");

        resetLastSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinner(false));

        assert.strictEqual($(htmlSelect).val(), "1", "Later the comparison should be set to 'Fastest time'");
        assert.strictEqual(callCount, 1, "One call to the change-handler should have been made");
        assert.strictEqual(alertsReceived.length, 0, "No alert should have been issued");
        assert.strictEqual($(_RESULT_SELECTOR_SELECTOR).is(":visible"), false, "Result selector should no longer be shown");

        assert.deepEqual(selector.getComparisonType(), {index: 1, result: null});
    });

    QUnit.test("Comparison type set to Any Team for a team class", function(assert) {
        var selector = createSelector();
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        selector.setCourseClassSet(getDummyTeamCourseClassSet());
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyTeam"));
        assert.strictEqual($(_RESULT_SPAN_SELECTOR).text(), getMessage("CompareWithAnyTeamLabel"));
    });

    QUnit.test("Comparison type option changes from Any Runner to Any Team when changing from an individual to a team class", function(assert) {
        var selector = createSelector();
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        var resultSpan = $(_RESULT_SPAN_SELECTOR);
        selector.setCourseClassSet(DUMMY_CLASS_SET);
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyRunner"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyRunnerLabel"));
        selector.setCourseClassSet(getDummyTeamCourseClassSet());
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyTeam"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyTeamLabel"));
    });

    QUnit.test("Comparison type option changes from Any Team back to Any Runner when changing from a team to an individual class", function(assert) {
        var selector = createSelector();
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        var resultSpan = $(_RESULT_SPAN_SELECTOR);
        selector.setCourseClassSet(getDummyTeamCourseClassSet());
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyTeam"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyTeamLabel"));
        selector.setCourseClassSet(DUMMY_CLASS_SET);
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyRunner"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyRunnerLabel"));
    });

    QUnit.test("Comparison type option changes from Any Team to Any Runner when changing from all legs to one specific leg", function (assert) {
        var selector = createSelector();
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        var resultSpan = $(_RESULT_SPAN_SELECTOR);
        selector.setCourseClassSet(getDummyTeamCourseClassSet());
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyTeam"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyTeamLabel"));
        selector.setSelectedLeg(1);
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyRunner"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyRunnerLabel"));
    });

    QUnit.test("Comparison type option changes from Any Team to Any Runner when changing from one specific leg to all legs", function (assert) {
        var selector = createSelector();
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        var resultSpan = $(_RESULT_SPAN_SELECTOR);
        selector.setCourseClassSet(getDummyTeamCourseClassSet());
        selector.setSelectedLeg(1);
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyRunner"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyRunnerLabel"));
        selector.setSelectedLeg(null);
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyTeam"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyTeamLabel"));
    });

    QUnit.test("Items in result-selector drop-down record individual names if individual leg selected", function (assert) {
        var selector = createSelector();
        var htmlSelect = d3.select(_RESULT_SELECTOR_SELECTOR).node();
        selector.setCourseClassSet(getDummyTeamCourseClassSet());

        function getOptions() {
            return [0, 1, 2].map(function (index) {
                return $(htmlSelect.options[index]).text();
            });
        }

        selector.setSelectedLeg(0);
        assert.strictEqual(htmlSelect.options.length, 3);
        assert.deepEqual(["1a", "2a", "3a"], getOptions());

        selector.setSelectedLeg(1);
        assert.strictEqual(htmlSelect.options.length, 3);
        assert.deepEqual(["1b", "2b", "3b"], getOptions());

        selector.setSelectedLeg(null);
        assert.strictEqual(htmlSelect.options.length, 3);
        assert.deepEqual(["Team 1", "Team 2", "Team 3"], getOptions());
    });

    QUnit.test("Changing course class resets the selected leg to all legs", function (assert) {
        var selector = createSelector();
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        var resultSpan = $(_RESULT_SPAN_SELECTOR);
        selector.setCourseClassSet(getDummyTeamCourseClassSet());
        selector.setSelectedLeg(1);
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyRunner"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyRunnerLabel"));
        selector.setCourseClassSet(getDummyTeamCourseClassSet());
        assert.strictEqual($(htmlSelect.options[htmlSelect.options.length - 1]).text(), getMessage("CompareWithAnyTeam"));
        assert.strictEqual(resultSpan.text(), getMessage("CompareWithAnyTeamLabel"));
    });

    QUnit.test("Alert issued and selector returns to previous index without firing handlers if course-class set has teams but no winner and 'Winner' option chosen", function(assert) {
        resetLastSelector();
        var selector = createSelector();
        selector.setCourseClassSet(getDummyCourseClassSetWithNoWinner(true));
        var htmlSelect = d3.select(_COMPARISON_SELECTOR_SELECTOR).node();
        $(htmlSelect).val(2).change();

        selector.registerChangeHandler(handleComparisonChanged);
        $(htmlSelect).val(0).change();

        assert.strictEqual($(htmlSelect).val(), "2", "Selector should return to previous index: selector index is " + $(htmlSelect)[0].selectedIndex);
        assert.strictEqual(callCount, 0, "No calls to the change-handler should have been made");

        assert.strictEqual(alertsReceived.length, 1, "One alert should have been issued");
        assert.strictEqual(alertsReceived[0], getMessageWithFormatting("CannotCompareAsNoWinnerTeam", {"$$OPTION$$": getMessage("CompareWithWinner")}));
    });
})();