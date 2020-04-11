/*
 *  SplitsBrowser - ResultSelection tests.
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

    QUnit.module("Result Selection");

    var ResultSelection = SplitsBrowser.Model.ResultSelection;

    var fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;
    
    // Test code for handling notifications 
    var lastIndexes = null;
    var callCount = 0;

    function testHandler(indexes) {
        lastIndexes = indexes;
        callCount += 1;
    }

    function reset() {
        lastIndexes = null;
        callCount = 0;
    }

    QUnit.test("Cannot create a result selection if the number of results is not a number", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            new ResultSelection("this is not a number");
        });
    });

    QUnit.test("Cannot create a result selection if the number of results is negative", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            new ResultSelection(-1);
        });
    });

    QUnit.test("Can create a result selection if the number of results is zero", function (assert) {
        var selection = new ResultSelection(0);
        assert.strictEqual(selection.count, 0);
    });

    QUnit.test("Cannot toggle the selectedness of a result whose index is not numeric", function (assert) {
        var selection = new ResultSelection(3);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.toggle("this is not a number");
        });
    });

    QUnit.test("Cannot toggle the selectedness of a result whose index is negative", function (assert) {
        var selection = new ResultSelection(3);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.toggle(-1);
        });
    });

    QUnit.test("Cannot toggle the selectedness of a result whose index is too large", function (assert) {
        var selection = new ResultSelection(3);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.toggle(3);
        });
    });

    QUnit.test("All results unselected in newly-created selection", function (assert) {
        var selection = new ResultSelection(3);
        assert.deepEqual(selection.getSelectedIndexes(), [], "Results should all be deselected");
    });

    QUnit.test("Toggling an unselected result makes them selected and vice versa", function (assert) {
        var selection = new ResultSelection(3);
        assert.deepEqual(selection.getSelectedIndexes(), [], "No results should be selected");

        selection.toggle(1);
        
        assert.deepEqual(selection.getSelectedIndexes(), [1], "Only result 1 should be selected");

        selection.toggle(1);

        assert.deepEqual(selection.getSelectedIndexes(), [], "No results should be selected");
    });

    QUnit.test("Selecting all results makes all results selected, and selecting none makes all results unselected", function (assert) {
        var selection = new ResultSelection(3);
        assert.deepEqual(selection.getSelectedIndexes(), [], "No results should be selected");

        selection.selectAll();

        assert.deepEqual(selection.getSelectedIndexes(), [0, 1, 2], "All results should be selected");

        selection.selectNone();
        
        assert.deepEqual(selection.getSelectedIndexes(), [], "No results should be selected");
    });

    QUnit.test("Can determine whether individual results are selected", function (assert) {
        var selection = new ResultSelection(3);
        selection.setSelectedIndexes([0, 2]);
        assert.ok(selection.isSelected(0), "Result 0 should be selected");
        assert.ok(!selection.isSelected(1), "Result 1 should not be selected");
        assert.ok(selection.isSelected(2), "Result 2 should be selected");
    });

    QUnit.test("Can register handler and have it called when result toggled", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only result 2 should be selected");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Modifying the returned list from a handler has no effect on the the selection", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(0);
        assert.deepEqual(lastIndexes, [0], "Only result 0 should be selected");
        lastIndexes.push(2);
        assert.ok(!selection.isSelected(2), "Result 2 should remain deselected");
    });

    QUnit.test("Can register handler and have it called multiple times when multiple results toggled", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        selection.toggle(0);
        assert.deepEqual(lastIndexes, [0, 2], "Only results 0 and 2 should be selected");
        assert.strictEqual(callCount, 2, "Handler should have been called twice");
    });

    QUnit.test("Can register handler and have it called when all results selected", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.selectAll();
        assert.deepEqual(lastIndexes, [0, 1, 2], "All results should be selected");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Can register handler and have it called when all results deselected", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.selectAll();
        selection.registerChangeHandler(testHandler);
        selection.selectNone();
        assert.deepEqual(lastIndexes, [], "No results should be selected");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Can register multiple handlers and have them all called when result selection toggled", function (assert) {
        reset();
        var selection = new ResultSelection(3);

        var lastIndexes2 = null;
        var callCount2 = 0;
        var handler2 = function (indexes) {
            lastIndexes2 = indexes;
            callCount2 += 1;
        };

        selection.registerChangeHandler(testHandler);
        selection.registerChangeHandler(handler2);

        selection.toggle(2);

        assert.deepEqual(lastIndexes, [2], "Only result 2 should have been selected");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");
        assert.deepEqual(lastIndexes2, [2], "Only result 2 should have been selected");
        assert.strictEqual(callCount2, 1, "Handler should only have been called once");
    });

    QUnit.test("Handler only called once even if registered miltiple times", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only result 2 should have been selected");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Can deregister previously-registered handler", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only result 2 should have been selected");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");

        selection.deregisterChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only result 2 should have been selected");
        assert.strictEqual(callCount, 1, "Handler should still only have been called once");
    });

    QUnit.test("Can deregister previously-registered handler multiple times without error", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only result 2 should have been selected");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");

        selection.deregisterChangeHandler(testHandler);
        selection.deregisterChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only result 2 should have been selected");
        assert.strictEqual(callCount, 1, "Handler should still only have been called once");
    });

    QUnit.test("Can deregister handler that was never registered without error", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.deregisterChangeHandler(testHandler);
        assert.expect(0); // No assertions here, but there should also have been no errors.
    });

    QUnit.test("A single runner is not selected if no runners are selected", function (assert) {
        var selection = new ResultSelection(3);
        assert.ok(!selection.isSingleRunnerSelected(), "A single runner should not be selected if there are no results selected");
    });

    QUnit.test("A single runner is selected if one runner is selected", function (assert) {
        var selection = new ResultSelection(3);
        selection.toggle(2);
        assert.ok(selection.isSingleRunnerSelected(), "A single runner should be selected if there one result is selected");
    });

    QUnit.test("A single runner is not selected if all runners are selected", function (assert) {
        var selection = new ResultSelection(3);
        selection.selectAll();
        assert.ok(!selection.isSingleRunnerSelected(), "A single runner should not be selected if all results are selected");
    });

    QUnit.test("Cannot get single runner index if no runners are selected", function (assert) {
        var selection = new ResultSelection(3);
        assert.strictEqual(selection.getSingleRunnerIndex(), null);
    });

    QUnit.test("Can get single runner index if one runner is selected", function (assert) {
        var selection = new ResultSelection(3);
        selection.toggle(2);
        assert.strictEqual(selection.getSingleRunnerIndex(), 2);
    });

    QUnit.test("A single runner is selected if one runners is selected", function (assert) {
        var selection = new ResultSelection(3);
        selection.selectAll();
        assert.strictEqual(selection.getSingleRunnerIndex(), null);
    });

    /**
    * Returns some test result-details objects for testing the crossing-
    * runners functionality.
    * @return {Array} Array of result-details objects.
    */
    function getResultDetailsForCrossingRunners() {
        return [
            {result: fromCumTimes(1, 10 * 3600, [0, 65, 184, 229, 301]), visible: true},
            {result: fromCumTimes(2, 11 * 3600, [0, 77, 191, 482, 561]), visible: true},
            {result: fromCumTimes(3, 11 * 3600 + 2 * 60, [0, 72, 200, 277, 381]), visible: true}
        ];
    }

    QUnit.test("If no runners are selected, when crossing results are selected, no other results are selected", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.selectCrossingRunners(getResultDetailsForCrossingRunners());
        assert.strictEqual(callCount, 0, "No call to the change-handler should be registered");
    });
    
    QUnit.test("If a single runner is selected, when crossing results are selected, then one other result is selected", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.toggle(1);
        selection.registerChangeHandler(testHandler);
        selection.selectCrossingRunners(getResultDetailsForCrossingRunners());
        assert.deepEqual(lastIndexes, [1, 2], "Selected indexes should be 1 and 2");
        assert.strictEqual(callCount, 1, "One call to the change-handler should be registered");
    });

    QUnit.test("If two runners are selected, when crossing results are selected, no other results are selected", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.toggle(0);
        selection.toggle(1);
        selection.registerChangeHandler(testHandler);
        selection.selectCrossingRunners(getResultDetailsForCrossingRunners());
        assert.strictEqual(callCount, 0, "No call to the change-handler should be registered");
    });

    QUnit.test("If a single runner is selected but the crossing runner is not visible then no further results are selected", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.toggle(1);
        selection.registerChangeHandler(testHandler);
        var resultDetails = getResultDetailsForCrossingRunners();
        resultDetails[2].visible = false;
        selection.selectCrossingRunners(resultDetails);
        assert.deepEqual(lastIndexes, [1], "Selected indexes should be just 1");
        assert.strictEqual(callCount, 1, "No call to the change-handler should be registered");
    });

    QUnit.test("Cannot migrate from an old list of results that isn't an array", function (assert) {
        var selection = new ResultSelection(1);
        var newResults = [fromCumTimes(1, 10 * 3600, [0, 65, 184, 229, 301])];
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.migrate("this is not an array", newResults);
        });
    });

    QUnit.test("Cannot migrate from an old list of results that doesn't match the previous count", function (assert) {
        var selection = new ResultSelection(2);
        var oldResults = [fromCumTimes(2, 11 * 3600, [0, 77, 191, 482, 561])];
        var newResults = [fromCumTimes(1, 10 * 3600, [0, 65, 184, 229, 301])];
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.migrate(oldResults, newResults);
        });
    });

    QUnit.test("Cannot migrate to a new list of results that isn't an array", function (assert) {
        var selection = new ResultSelection(1);
        var oldResults = [fromCumTimes(2, 11 * 3600, [0, 77, 191, 482, 561])];
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.migrate(oldResults, "this is not an array");
        });
    });

    QUnit.test("Cannot migrate to an empty new list of results if a result is selected", function (assert) {
        var selection = new ResultSelection(1);
        selection.toggle(0);
        var oldResults = [fromCumTimes(2, 11 * 3600, [0, 77, 191, 482, 561])];
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.migrate(oldResults, []);
        });
    });

    QUnit.test("Can migrate to an empty new list of results if no results are selected", function (assert) {
        var selection = new ResultSelection(1);
        selection.selectNone();
        var oldResults = [fromCumTimes(2, 11 * 3600, [0, 77, 191, 482, 561])];
        selection.migrate(oldResults, []);
        assert.deepEqual(selection.getSelectedIndexes(), []);
    });

    QUnit.test("Can migrate to new list of results", function (assert) {
        reset();
        var result1 = fromCumTimes(1, 10 * 3600, [0, 65, 184, 229, 301]);
        var result2 = fromCumTimes(2, 11 * 3600, [0, 77, 191, 482, 561]);
        var result3 = fromCumTimes(3, 11 * 3600 + 2 * 60, [0, 72, 200, 277, 381]);
        var result4 = fromCumTimes(4, 10 * 3600 + 2 * 60, [0, 78, 188, 252, 406]);
        var oldResults = [result2, result1, result3];
        var newResults = [result1, result2, result4];
        var selection = new ResultSelection(oldResults.length);
        selection.toggle(1);
        selection.toggle(2);
        selection.registerChangeHandler(testHandler);        
        selection.migrate(oldResults, newResults);
        assert.strictEqual(selection.count, newResults.length);
        assert.strictEqual(callCount, 0);
    });
    
    QUnit.test("Can set array of selected results to an empty array", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);        
        selection.setSelectedIndexes([]);
        assert.deepEqual(lastIndexes, []);
        assert.deepEqual(callCount, 1);
    });
    
    QUnit.test("Can set array of selected results to an non-empty array", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);        
        selection.setSelectedIndexes([0, 2]);
        assert.deepEqual(lastIndexes, [0, 2]);
        assert.deepEqual(callCount, 1);
    });
    
    QUnit.test("Cannot set array of selected results to an array containing a negative index", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);        
        selection.setSelectedIndexes([0, -1]);
        assert.deepEqual(callCount, 0);
    });
    
    QUnit.test("Can bulk-select an empty list of results without firing change handlers", function (assert) {
        reset();
        var selection = new ResultSelection(5);
        selection.registerChangeHandler(testHandler);        
        selection.bulkSelect([]);
        assert.strictEqual(callCount, 0);
    });
    
    QUnit.test("Can bulk-select three results when none originally selected, firing change handlers once", function (assert) {
        reset();
        var selection = new ResultSelection(5);
        selection.registerChangeHandler(testHandler);        
        selection.bulkSelect([1, 3, 4]);
        assert.deepEqual(lastIndexes, [1, 3, 4]);
        assert.strictEqual(callCount, 1);
    });
    
    QUnit.test("Can bulk-select three results in the wrong order when none originally selected, firing change handlers once", function (assert) {
        reset();
        var selection = new ResultSelection(5);
        selection.registerChangeHandler(testHandler);        
        selection.bulkSelect([4, 3, 1]);
        assert.deepEqual(lastIndexes, [1, 3, 4]);
        assert.strictEqual(callCount, 1);
    });
    
    QUnit.test("Can bulk-select three results when two originally selected, with correct list of last indexes and firing change handlers once", function (assert) {
        reset();
        var selection = new ResultSelection(5);
        selection.toggle(1);
        selection.toggle(4);
        selection.registerChangeHandler(testHandler);        
        selection.bulkSelect([1, 3, 4]);
        assert.deepEqual(lastIndexes, [1, 3, 4]);
        assert.strictEqual(callCount, 1);
    });
    
    QUnit.test("Bulk-selecting three results when all three originally selected does not fire change handlers", function (assert) {
        reset();
        var selection = new ResultSelection(5);
        selection.toggle(1);
        selection.toggle(3);
        selection.toggle(4);
        selection.registerChangeHandler(testHandler);        
        selection.bulkSelect([1, 3, 4]);
        assert.strictEqual(callCount, 0);
    });

    QUnit.test("Cannot bulk-select when one of the entries in the list is not a number", function (assert) {
        var selection = new ResultSelection(5);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.bulkSelect([1, "This is not a number", 4]);
        });
    });

    QUnit.test("Cannot bulk-select when one of the entries in the list is a negative number", function (assert) {
        var selection = new ResultSelection(5);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.bulkSelect([1, -1, 4]);
        });
    });

    QUnit.test("Cannot bulk-select when one of the entries in the list is too large", function (assert) {
        var selection = new ResultSelection(5);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.bulkSelect([1, 5, 4]);
        });
    });
    
    /**
    * Creates and returns a ResultSelection object with all results
    * selected
    * @param {Number} count - The number of results to create.
    * @return {ResultSelection} ResultSelection object with the given
    *     number of results, all selected.
    */
    function createSelectionWithAllSelected(count) {
        var selection = new ResultSelection(count);
        for (var i = 0; i < count; i += 1) {
            selection.toggle(i);
        }
        return selection;
    }
    
    QUnit.test("Can bulk-deselect an empty list of results without firing change handlers", function (assert) {
        reset();
        var selection = createSelectionWithAllSelected(5);
        selection.registerChangeHandler(testHandler);
        selection.bulkDeselect([]);
        assert.strictEqual(callCount, 0);
    });
    
    QUnit.test("Can bulk-deselect three results when all were originally selected, firing change handlers once", function (assert) {
        reset();
        var selection = createSelectionWithAllSelected(5);
        selection.registerChangeHandler(testHandler);
        selection.bulkDeselect([1, 3, 4]);
        assert.deepEqual(lastIndexes, [0, 2]);
        assert.strictEqual(callCount, 1);
    });
    
    QUnit.test("Can bulk-deselect three results in the wrong order when all were originally selected, firing change handlers once", function (assert) {
        reset();
        var selection = createSelectionWithAllSelected(5);
        selection.registerChangeHandler(testHandler);        
        selection.bulkDeselect([4, 3, 1]);
        assert.deepEqual(lastIndexes, [0, 2]);
        assert.strictEqual(callCount, 1);
    });
    
    QUnit.test("Can bulk-deselect three results when two originally deselected, with correct list of last indexes and firing change handlers once", function (assert) {
        reset();
        var selection = createSelectionWithAllSelected(5);
        selection.toggle(1);
        selection.toggle(4);
        selection.registerChangeHandler(testHandler);        
        selection.bulkDeselect([1, 3, 4]);
        assert.deepEqual(lastIndexes, [0, 2]);
        assert.strictEqual(callCount, 1);
    });
    
    QUnit.test("Bulk-deselecting three results when all three originally deselected does not fire change handlers", function (assert) {
        reset();
        var selection = createSelectionWithAllSelected(5);
        selection.toggle(1);
        selection.toggle(3);
        selection.toggle(4);
        selection.registerChangeHandler(testHandler);        
        selection.bulkDeselect([1, 3, 4]);
        assert.strictEqual(callCount, 0);
    });

    QUnit.test("Cannot bulk-deselect when one of the entries in the list is not a number", function (assert) {
        var selection = createSelectionWithAllSelected(5);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.bulkDeselect([1, "This is not a number", 4]);
        });
    });

    QUnit.test("Cannot bulk-select when one of the entries in the list is a negative number", function (assert) {
        var selection = createSelectionWithAllSelected(5);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.bulkDeselect([1, -1, 4]);
        });
    });

    QUnit.test("Cannot bulk-select when one of the entries in the list is too large", function (assert) {
        var selection = createSelectionWithAllSelected(5);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            selection.bulkDeselect([1, 5, 4]);
        });
    });

    QUnit.test("Cannot set array of selected results to an array containing an index too large", function (assert) {
        reset();
        var selection = new ResultSelection(3);
        selection.registerChangeHandler(testHandler);        
        selection.setSelectedIndexes([0, 3]);
        assert.deepEqual(callCount, 0);
    });

})();