/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function() {
    "use strict";

    module("Competitor Selection");

    var CompetitorSelection = SplitsBrowser.Model.CompetitorSelection;

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

    QUnit.test("Cannot create a competitor selection if the number of competitors is not a number", function (assert) {
        try {
            new CompetitorSelection("this is not a number");
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should be an InvalidData.  Exception message is " + e.message);
        }
    });

    QUnit.test("Cannot create a competitor selection if the number of competitors is negative", function (assert) {
        try {
            new CompetitorSelection(-1);
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should be an InvalidData.  Exception message is " + e.message);
        }
    });

    QUnit.test("Cannot create a competitor selection if the number of competitors is not a number", function (assert) {
        try {
            new CompetitorSelection(0);
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should be an InvalidData.  Exception message is " + e.message);
        }
    });

    QUnit.test("Cannot toggle the selectedness of a competitor whose index is not numeric", function (assert) {
        var selection = new CompetitorSelection(3);
        try {
            selection.toggle("this is not a number");
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should be an InvalidData.  Exception message is " + e.message);
        }
    });

    QUnit.test("Cannot toggle the selectedness of a competitor whose index is negative", function (assert) {
        var selection = new CompetitorSelection(3);
        try {
            selection.toggle(-1);
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should be an InvalidData.  Exception message is " + e.message);
        }
    });

    QUnit.test("Cannot toggle the selectedness of a competitor whose index is too large", function (assert) {
        var selection = new CompetitorSelection(3);
        try {
            selection.toggle(3);
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should be an InvalidData.  Exception message is " + e.message);
        }
    });

    QUnit.test("All competitors unselected in newly-created selection", function (assert) {
        var selection = new CompetitorSelection(3);
        for (var i = 0; i < 3; ++i) {
            assert.ok(!selection.isSelected(i), "Competitors should all be deselected");
        }
    });

    QUnit.test("Toggling an unselected competitor makes them selected and vice versa", function (assert) {
        var selection = new CompetitorSelection(3);
        var i;
        for (i = 0; i < 3; ++i) {
            assert.ok(!selection.isSelected(i), "Competitor " + i + " should be deselected");
        }

        selection.toggle(1);

        for (i = 0; i < 3; ++i) {
            assert.ok(selection.isSelected(i) == (i == 1), "Competitor " + i + " should be " + ((i == 1) ? "selected" : "deselected"));
        }

        selection.toggle(1);

        for (i = 0; i < 3; ++i) {
            assert.ok(!selection.isSelected(i), "Competitor " + i + " should be deselected");
        }
    });

    QUnit.test("Selecting all competitors makes all competitors selected, and selecting none makes all competitors unselected", function (assert) {
        var selection = new CompetitorSelection(3);
        var i;
        for (i = 0; i < 3; ++i) {
            assert.ok(!selection.isSelected(i), "Competitor " + i + " should be deselected");
        }

        selection.selectAll();

        for (i = 0; i < 3; ++i) {
            assert.ok(selection.isSelected(i), "Competitor " + i + " should be selected");
        }

        selection.selectNone();

        for (i = 0; i < 3; ++i) {
            assert.ok(!selection.isSelected(i), "Competitor " + i + " should be deselected");
        }
    });

    QUnit.test("Can register handler and have it called when competitor toggled", function (assert) {
        reset();
        var selection = new CompetitorSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only competitor 2 should be selected");
        assert.equal(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Modifying the returned list from a handler has no effect on the the selection", function (assert) {
        var selection = new CompetitorSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(0);
        assert.deepEqual(lastIndexes, [0], "Only competitor 0 should be selected");
        lastIndexes.push(2);
        assert.ok(!selection.isSelected(2), "Competitor 2 should remain deselected");
    });

    QUnit.test("Can register handler and have it called multiple times when multiple competitors toggled", function (assert) {
        reset();
        var selection = new CompetitorSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        selection.toggle(0);
        assert.deepEqual(lastIndexes, [0, 2], "Only competitors 0 and 2 should be selected");
        assert.equal(callCount, 2, "Handler should have been called twice");
    });

    QUnit.test("Can register handler and have it called when all competitors selected", function (assert) {
        reset();
        var selection = new CompetitorSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.selectAll();
        assert.deepEqual(lastIndexes, [0, 1, 2], "All competitors should be selected");
        assert.equal(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Can register handler and have it called when all competitors deselected", function (assert) {
        reset();
        var selection = new CompetitorSelection(3);
        selection.selectAll();
        selection.registerChangeHandler(testHandler);
        selection.selectNone();
        assert.deepEqual(lastIndexes, [], "No competitors should be selected");
        assert.equal(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Can register multiple handlers and have them all called when competitor selection toggled", function (assert) {
        reset();
        var selection = new CompetitorSelection(3);

        var lastIndexes2 = null;
        var callCount2 = 0;
        var handler2 = function (indexes) {
            lastIndexes2 = indexes;
            callCount2 += 1;
        };

        selection.registerChangeHandler(testHandler);
        selection.registerChangeHandler(handler2);

        selection.toggle(2);

        assert.deepEqual(lastIndexes, [2], "Only competitor 2 should have been selected");
        assert.equal(callCount, 1, "Handler should only have been called once");
        assert.deepEqual(lastIndexes2, [2], "Only competitor 2 should have been selected");
        assert.equal(callCount2, 1, "Handler should only have been called once");
    });

    QUnit.test("Handler only called once even if registered miltiple times", function (assert) {
        reset();
        var selection = new CompetitorSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only competitor 2 should have been selected");
        assert.equal(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Can deregister previously-registered handler", function (assert) {
        reset();
        var selection = new CompetitorSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only competitor 2 should have been selected");
        assert.equal(callCount, 1, "Handler should only have been called once");

        selection.deregisterChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only competitor 2 should have been selected");
        assert.equal(callCount, 1, "Handler should still only have been called once");
    });

    QUnit.test("Can deregister previously-registered handler multiple times without error", function (assert) {
        reset();
        var selection = new CompetitorSelection(3);
        selection.registerChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only competitor 2 should have been selected");
        assert.equal(callCount, 1, "Handler should only have been called once");

        selection.deregisterChangeHandler(testHandler);
        selection.deregisterChangeHandler(testHandler);
        selection.toggle(2);
        assert.deepEqual(lastIndexes, [2], "Only competitor 2 should have been selected");
        assert.equal(callCount, 1, "Handler should still only have been called once");
    });

    QUnit.test("Can deregister handler that was never registered without error", function (assert) {
        reset();
        var selection = new CompetitorSelection(3);
        selection.deregisterChangeHandler(testHandler);
        expect(0); // No assertions here, but there should also have been no errors.
    });
})();