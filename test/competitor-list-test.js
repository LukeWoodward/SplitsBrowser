/*
 *  SplitsBrowser - CompetitorList tests.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var CompetitorList = SplitsBrowser.Controls.CompetitorList;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var CompetitorSelection = SplitsBrowser.Model.CompetitorSelection;
    var ChartTypes = SplitsBrowser.Model.ChartTypes;

    // CSS selector for the Crossing Runners button.
    var CROSSING_RUNNERS_BUTTON_SELECTOR = "div#qunit-fixture button#selectCrossingRunners";
    
    var NUMBER_TYPE = typeof 0;
    
    module("Competitor List");

    var lastAlertMessage;
    var alertCount;
    
    function resetAlert() {
        lastAlertMessage = null;
        alertCount = 0;
    }
    
    function customAlert(message) {
        lastAlertMessage = message;
        alertCount += 1;
    }
    
    // Test code for handling filter-text changes 
    var callCount = 0;

    function testHandler() {
        callCount += 1;
    }

    function reset() {
        callCount = 0;
    }
    
    var propagationStopped = false;
   
    /**
    * Verifies that the given value is a Number.
    * @param {any} value - Value to verify.
    */
    function verifyNumeric(value) {
        if (typeof value !== NUMBER_TYPE) {
            throw new Error(value + " of type " + (typeof value) + " is not a number");
        }
    }
    
    /**
    * Sets up the d3 event before event handlers are called.
    * @param {Number|HTMLElement} target - The target element, or the index of
    *     the competitor.
    * @param {Object} options - The options.
    */
    function setUpD3Event(target, options) {
        propagationStopped = false;
        if (typeof target === NUMBER_TYPE) {
            target = $("div.competitor")[target];
        }
        options = options || {};
        var currentY = (target === document) ? 0 : target.getBoundingClientRect().top + target.clientTop;
        d3.event = {
            which: options.which || 1,
            currentTarget: target,
            stopPropagation: function () { propagationStopped = true; },
            clientY: currentY + (options.yOffset || 0),
            shiftKey: options.shiftKey || false
        };
    }
    
    /**
    * Sets up the d3 event before event handlers are called and initiates a
    * start-drag.
    * @param {Number} targetIndex - The index of the target competitor element.
    * @param {Object} options - The options.
    * @param {Boolean} holdShiftKey - Whether to hold down the Shift key.
    * @param {Object} listAndSelection - Object containing the competitor list
    *     and the competitor selection.
    */    
    function setUpD3EventAndStartDrag(targetIndex, options, listAndSelection) {
        verifyNumeric(targetIndex);
        setUpD3Event(targetIndex, options);
        listAndSelection.list.startDrag(targetIndex);
    }
    
    /**
    * Sets up the d3 event before event handlers are called and initiates a
    * start-drag from off the bottom of the list of competitors.
    * @param {Object} listAndSelection - Object containing the competitor list
    *     and the competitor selection.
    * @param {Object} options - The options.
    */    
    function setUpD3EventAndStartDragOffTheBottom(listAndSelection, options) {
        options.yOffset = 250;
        setUpD3Event($("#competitorList")[0], options);
        listAndSelection.list.startDrag(-1);
    }
    
    /**
    * Sets up the d3 event before event handlers are called and initiates a
    * start-drag from within the scrollbar.
    * @param {Object} listAndSelection - Object containing the competitor list
    *     and the competitor selection.
    * @param {Object} options - The options.
    */    
    function setUpD3EventAndStartDragInTheScrollbar(listAndSelection, options) {
        options.yOffset = -20;
        setUpD3Event($("#competitorList")[0], options);
        listAndSelection.list.startDrag(-1);
    }
    
    /**
    * Sets up the d3 event and initiates a mouse-move event.
    * start-drag.
    * @param {Number|HTMLElement} target - The target element, or the index of
    *     the competitor.
    * @param {Object} listAndSelection - Object containing the competitor list
    *     and the selected competitors.
    */    
    function setUpD3EventAndMoveMouse(targetIndex, listAndSelection) {
        verifyNumeric(targetIndex);
        setUpD3Event(targetIndex);
        listAndSelection.list.mouseMove(targetIndex);
    }
    
    /**
    * Sets up the d3 event and initiates a mouse-move event off the bottom of
    * the competitor list.
    * start-drag.
    * @param {Object} listAndSelection - Object containing the competitor list
    *     and the selected competitors.
    */    
    function setUpD3EventAndMoveMouseOffTheBottom(listAndSelection) {
        setUpD3Event($("#competitorList")[0], {yOffset: 200});
        listAndSelection.list.mouseMove(-1);
    }
    
    /**
    * Sets up the d3 event and initiates a mouse-move event into the scrollbar.
    * start-drag.
    * @param {Object} listAndSelection - Object containing the competitor list
    *     and the selected competitors.
    */    
    function setUpD3EventAndMoveMouseIntoTheScrollbar(listAndSelection) {
        setUpD3Event($("#competitorList")[0], {yOffset: -20});
        listAndSelection.list.mouseMove(-1);
    }
    
    /**
    * Creates a list with three competitors in it, and return the list and the
    * selection.
    * @param {Array} selectedIndexes - Indexes of selected competitors in the selection.
    * @param {boolean} multipleClasses - Whether the list of competitors is built from
    *                                    multiple classes.
    * @return 2-element object containing the selection and list.
    */
    function createSampleList(selectedIndexes, multipleClasses) {
        var parent = d3.select("div#qunit-fixture").node();
        
        var compList = [
            fromSplitTimes(1, "John Watson", "CDO", 10 * 3600, [13, 96, 35]),
            fromSplitTimes(2, "Mark O'Connor", "GHO", 10 * 3600 + 6, [15, 79, 41]),
            fromSplitTimes(3, "Keith Wilson", "KLO", 10 * 3600 + 33, [18, 81, 37])
        ];
        
        var selection = new CompetitorSelection(compList.length);
        selectedIndexes.forEach(function (index) { selection.toggle(index); });
        
        var list = new CompetitorList(parent, customAlert);
        list.setCompetitorList(compList, multipleClasses);
        list.setSelection(selection);
        return { selection: selection, list: list };
    }
    
    /**
    * Creates a list with three options in it, set it up on the race graph
    * and return the list and the selection.
    * @param {Array} selectedIndexes - Indexes of selected competitors in the selection.
    * @param {boolean} multipleClasses - Whether the list of competitors is built from
    *                                    multiple classes.
    * @return 2-element object containing the selection and list.
    */
    function createSampleListForRaceGraph(selectedIndexes, multipleClasses) {
        var listAndSelection = createSampleList(selectedIndexes, multipleClasses);
        listAndSelection.list.setChartType(ChartTypes.RaceGraph);
        listAndSelection.list.enableOrDisableCrossingRunnersButton();
        return listAndSelection;
    }

    /**
    * Creates a list with three options in it, wires up the test change handler
    * and returns the list and the selection.
    * @param {Array} selectedIndexes - Indexes of selected competitors in the selection.
    * @param {boolean} multipleClasses - Whether the list of competitors is built from
    *                                    multiple classes.
    * @return 2-element object containing the selection and list.
    */
    function createSampleListWithChangeHandler(selectedIndexes, multipleClasses) {
        var listAndSelection = createSampleList(selectedIndexes, multipleClasses);
        listAndSelection.list.registerChangeHandler(testHandler);
        return listAndSelection;
    }
    
    /**
    * Asserts that the given expected list of competitors all have the given
    * CSS class in their associated div, and other competitor divs do not.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Number} count - Total number of competitors.
    * @param {String} className - The name of the CSS class to test for.
    * @param {Array} expectedCompetitors - Array that contains the indexes of
    *     all competitors that should have the given CSS class.
    */
    function assertCompetitorsClassed(assert, count, className, expectedCompetitors) {
        var competitors = $("div.competitor");
        for (var index = 0; index < count; index += 1) {
            assert.strictEqual($(competitors[index]).hasClass(className), expectedCompetitors.indexOf(index) >= 0);
        }
    }
    
    /**
    * Asserts that the currently-drag-selected competitors are as expected.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Number} count - Total number of competitors.
    * @param {Array} expectedDragSelected - Array that contains the indexes of
    *     all competitors that should be drag-selected.
    */
    function assertDragSelected(assert, count, expectedDragSelected) {
        assertCompetitorsClassed(assert, count, "dragSelected", expectedDragSelected);
    }
    
    /**
    * Asserts that the currently-drag-deselected competitors are as expected.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Number} count - Total number of competitors.
    * @param {Array} expectedDragDeselected - Array that contains the indexes of
    *     all competitors that should be drag-deselected.
    */
    function assertDragDeselected(assert, count, expectedDragDeselected) {
        assertCompetitorsClassed(assert, count, "dragDeselected", expectedDragDeselected);
    }
    
    /**
    * Asserts that the currently-selected competitors are as expected,  both in
    * the the divs and the underlying selection.
    * @param {QUnit.assert} assert - QUnit assert object.
    * @param {Number} count - Total number of competitors.
    * @param {Array} expectedSelected - Array that contains the indexes of
    *     all competitors that should be selected.
    */
    function assertSelected(assert, count, expectedSelected, listAndSelection) {
        var competitors = $("div.competitor");
        for (var index = 0; index < count; index += 1) {
            var shouldBeSelected = expectedSelected.indexOf(index) >= 0;
            assert.strictEqual($(competitors[index]).hasClass("selected"), shouldBeSelected);
            assert.strictEqual(listAndSelection.selection.isSelected(index), shouldBeSelected);
        }
    }
    
    /**
    * Asserts that there are no drag-selected competitors.
    * @param {QUnit.assert} assert - QUnit assert object.
    */
    function assertNoDragSelected(assert) {
        assert.strictEqual($("div.competitor.dragSelected").length, 0);
    }

    QUnit.test("Can create a list, set the filter text and read the same value back", function (assert) {
        var listAndSelection = createSampleList([], false);
        listAndSelection.list.setFilterText("test abc 123 DEF");
        assert.strictEqual(listAndSelection.list.getFilterText(), "test abc 123 DEF");
    });

    QUnit.test("Can create a list for a single class with all competitors deselected and without class labels", function (assert) {
        createSampleList([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture span.competitorClassLabel").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture button").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture input[type=text]").size(), 1);
        assert.ok(!$("div#qunit-fixture button")[0].disabled);
        assert.ok(!$("div#qunit-fixture button")[1].disabled);
        assert.ok(!d3.select("div#qunit-fixture input[type=text]").property("disabled"));
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitorListPlaceholder").size(), 0);
    });
    
    QUnit.test("Can create a list for an empty class of competitors, with placeholder message", function (assert) {
        var parent = d3.select("div#qunit-fixture").node();
        var list = new CompetitorList(parent, customAlert);
        list.setCompetitorList([], false);
        list.setSelection(new CompetitorSelection(0));
        assert.ok($("div#qunit-fixture button")[0].disabled);
        assert.ok($("div#qunit-fixture button")[1].disabled);
        assert.ok(d3.select("div#qunit-fixture input[type=text]").property("disabled"));
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitorListPlaceholder").size(), 1);
    });
    
    QUnit.test("Can create a list for an empty class of competitors and then a non-empty list, removing placeholder div", function (assert) {
        var parent = d3.select("div#qunit-fixture").node();
        var list = new CompetitorList(parent, customAlert);
        list.setCompetitorList([], false);
        list.setSelection(new CompetitorSelection(0));
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitorListPlaceholder").size(), 1);
        
        var compList = [fromSplitTimes(1, "John Watson", "CDO", 10 * 3600, [13, 96, 35])];
        list.setCompetitorList(compList);
        list.setSelection(new CompetitorSelection(1));
        assert.ok(!$("div#qunit-fixture button")[0].disabled);
        assert.ok(!$("div#qunit-fixture button")[1].disabled);
        assert.ok(!d3.select("div#qunit-fixture input[type=text]").property("disabled"));
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitorListPlaceholder").size(), 0);
    });

    QUnit.test("Can create a list for multiple classes with all competitors deselected but with class labels shown", function (assert) {
        createSampleList([], true);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture span.competitorClassLabel").size(), 3);
    });

    QUnit.test("Can create a list with two of three competitors initially selected", function (assert) {
        createSampleList([0, 2], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 2);
    });

    QUnit.test("Can create a list with all competitors deselected, and then select them all", function (assert) {
        var listAndSelection = createSampleList([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        listAndSelection.selection.selectAll();
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
    });

    QUnit.test("Can create a list with all competitors selected, and then deselect them all", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
        listAndSelection.selection.selectNone();
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
    });

    QUnit.test("Can create a list, change the selection and ignore changes made to the old selection", function (assert) {
        var listAndSelection = createSampleList([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        
        var newSelection = new CompetitorSelection(3);
        listAndSelection.list.setSelection(newSelection);
        
        var oldSelection = listAndSelection.selection;
        oldSelection.selectAll();
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
    });
    
    QUnit.test("Can create a list with all competitors deselected and click and hold to drag-select one of them", function (assert) {
        var listAndSelection = createSampleList([], false);

        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        
        assertDragSelected(assert, 3, [1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag downwards to drag-select more than one of them", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        
        assertDragSelected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag upwards to drag-select more than one of them", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouse(0, listAndSelection);
        
        assertDragSelected(assert, 3, [0, 1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag downwards and then upwards to drag-select more than one of them", function (assert) {
        var listAndSelection = createSampleList([], false);

        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        setUpD3EventAndMoveMouse(0, listAndSelection);
        
        assertDragSelected(assert, 3, [0, 1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with one competitor selected and drag downwards to drag-select both competitors", function (assert) {
        var listAndSelection = createSampleList([1], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        
        assertDragSelected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag downwards off the bottom of the list to drag-select the last two competitors", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouseOffTheBottom(listAndSelection);
        
        assertDragSelected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag off the list into the scrollbar to drag-select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouseIntoTheScrollbar(listAndSelection);
        
        assertDragSelected(assert, 3, []);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected, and drag onto the list to drag-select the last two competitors", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDragOffTheBottom(listAndSelection, {});
        setUpD3EventAndMoveMouse(1, listAndSelection);
        
        assertDragSelected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected, and drag from the scrollbar into the list to drag-select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDragInTheScrollbar(listAndSelection, {});
        setUpD3EventAndMoveMouse(1, listAndSelection);
        
        assertDragSelected(assert, 3, []);
    });

    QUnit.test("Can create a list with all competitors deselected, and drag around off the list to drag-select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDragOffTheBottom(listAndSelection, {});
        setUpD3EventAndMoveMouseOffTheBottom(listAndSelection);
        
        assertDragSelected(assert, 3, []);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected, and drag with the wrong mouse button to drag-select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {which: 4}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        
        assertDragSelected(assert, 3, []);
    });
    
    QUnit.test("Can create a list with all competitors deselected, filter the list and then select only all filtered competitors", function (assert) {
        var listAndSelection = createSampleList([], false);
        listAndSelection.list.setFilterText("son");
        $("div#qunit-fixture button#selectAllCompetitors").click();
        assertSelected(assert, 3, [0, 2], listAndSelection);
    });
    
    QUnit.test("Can create a list with all competitors selected, filter the list and then deselect only all filtered competitors", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        listAndSelection.list.setFilterText("son");
        $("div#qunit-fixture button#selectNoCompetitors").click();
        assertSelected(assert, 3, [1], listAndSelection);
    });
    
    QUnit.test("Can create a list with all competitors selected, filter the list and then deselect all competitors with a double-click", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        listAndSelection.list.setFilterText("son");
        $("div#qunit-fixture button#selectNoCompetitors").dblclick();
        assertSelected(assert, 3, [], listAndSelection);
    });
    
    QUnit.test("Can create a list with all competitors deselected, filter the list and then drag-select those only in the filtered list", function (assert) {
        var listAndSelection = createSampleList([], false);
        listAndSelection.list.setFilterText("son");
        
        setUpD3EventAndStartDrag(0, {}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        
        assertDragSelected(assert, 3, [0, 2]);
    });
    
    QUnit.test("Can create a list with all competitors selected and shift-click and hold to drag-deselect one of them", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);

        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        
        assertDragDeselected(assert, 3, [1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag downwards to drag-deselect more than one of them", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        
        assertDragDeselected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag upwards to drag-deselect more than one of them", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouse(0, listAndSelection);
        
        assertDragDeselected(assert, 3, [0, 1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and shift-drag downwards and then upwards to drag-deselect more than one of them", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);

        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        setUpD3EventAndMoveMouse(0, listAndSelection);
        
        assertDragDeselected(assert, 3, [0, 1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with one competitor deselected and shift-drag downwards to drag-deselect both competitors", function (assert) {
        var listAndSelection = createSampleList([0, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        
        assertDragDeselected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag downwards off the bottom of the list to drag-deselect the last two competitors", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouseOffTheBottom(listAndSelection);
        
        assertDragDeselected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag off the list into the scrollbar to drag-deselect nothing", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouseIntoTheScrollbar(listAndSelection);
        
        assertDragDeselected(assert, 3, []);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected, and shift-drag onto the list to drag-deselect the last two competitors", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDragOffTheBottom(listAndSelection, {shiftKey: true});
        setUpD3EventAndMoveMouse(1, listAndSelection);
        
        assertDragDeselected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected, and shift-drag from the scrollbar into the list to drag-deselect nothing", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDragInTheScrollbar(listAndSelection, {shiftKey: true});
        setUpD3EventAndMoveMouse(1, listAndSelection);
        
        assertDragDeselected(assert, 3, []);
    });

    QUnit.test("Can create a list with all competitors selected, and shift-drag around off the list to drag-deselect nothing", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDragOffTheBottom(listAndSelection, {shiftKey: true});
        setUpD3EventAndMoveMouseOffTheBottom(listAndSelection);
        
        assertDragDeselected(assert, 3, []);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected, and shift-drag with the wrong mouse button to drag-deselect nothing", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true, which: 4}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        
        assertDragSelected(assert, 3, []);
    });
    
    QUnit.test("Can create a list with all competitors selected, filter the list and then drag-deselect those only in the filtered list", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        listAndSelection.list.setFilterText("son");
        
        setUpD3EventAndStartDrag(0, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        
        assertDragDeselected(assert, 3, [0, 2]);
    });
    
    QUnit.test("Can create a list with all competitors deselected, and click to select one of them", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [1], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected, and click to deselect one of them", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected, and drag downwards to select more than one of them", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected, and drag upwards to select more than one of them", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouse(0, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0, 1], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected, and drag downwards and then upwards to select more than one of them", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        setUpD3EventAndMoveMouse(0, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0, 1], listAndSelection);        
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with one competitor selected and drag downwards to select that competitor and another", function (assert) {
        var listAndSelection = createSampleList([1], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag downwards off the bottom of the list to select the last two competitors", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouseOffTheBottom(listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag off the list into the scrollbar to select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3EventAndMoveMouseIntoTheScrollbar(listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag off the list altogether to select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {}, listAndSelection);
        setUpD3Event(document);
        listAndSelection.list.mouseMove(-1);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag onto the list to select the last two competitors", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDragOffTheBottom(listAndSelection, {});
        setUpD3EventAndMoveMouse(1, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag from the scrollbar into the list to select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDragInTheScrollbar(listAndSelection, {});
        setUpD3EventAndMoveMouse(1, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
    });

    QUnit.test("Can create a list with all competitors deselected and drag around off the list to select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDragOffTheBottom(listAndSelection, {});
        setUpD3EventAndMoveMouseOffTheBottom(listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors deselected and drag with the wrong mouse button to select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {which: 4}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
    });

    QUnit.test("Can create a list with all competitors selected, and shift-drag downwards to deselect more than one of them", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected, and shift-drag upwards to deselect more than one of them", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouse(0, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected, and shift-drag downwards and then upwards to deselect more than one of them", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        setUpD3EventAndMoveMouse(0, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [2], listAndSelection);        
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with one competitor deselected and shift-drag downwards to deselect that competitor and another", function (assert) {
        var listAndSelection = createSampleList([0, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag downwards off the bottom of the list to deselect the last two competitors", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouseOffTheBottom(listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag off the list into the scrollbar to deselect nothing", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3EventAndMoveMouseIntoTheScrollbar(listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag off the list altogether to deselect nothing", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpD3Event(document);
        listAndSelection.list.mouseMove(-1);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag onto the list to deselect the last two competitors", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDragOffTheBottom(listAndSelection, {shiftKey: true});
        setUpD3EventAndMoveMouse(1, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag from the scrollbar into the list to deselect nothing", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDragInTheScrollbar(listAndSelection, {shiftKey: true});
        setUpD3EventAndMoveMouse(1, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
        assertNoDragSelected(assert);
    });

    QUnit.test("Can create a list with all competitors selected and drag around off the list to deselect nothing", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        
        setUpD3EventAndStartDragOffTheBottom(listAndSelection, {shiftKey: true});
        setUpD3EventAndMoveMouseOffTheBottom(listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all competitors selected and shift-drag with the wrong mouse button to select nothing", function (assert) {
        var listAndSelection = createSampleList([], false);
        
        setUpD3EventAndStartDrag(1, {shiftKey: true, which: 4}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
    });
    
    QUnit.test("Can create a list with all competitors deselected, filter the list and then select those only in the filtered list", function (assert) {
        var listAndSelection = createSampleList([], false);
        listAndSelection.list.setFilterText("son");
        
        setUpD3EventAndStartDrag(0, {}, listAndSelection);
        setUpD3EventAndMoveMouse(2, listAndSelection);
        listAndSelection.list.stopDrag();
        
        assertSelected(assert, 3, [0, 2], listAndSelection);
        assertNoDragSelected(assert);
    });
    
    QUnit.test("Can create a list with all competitors deselected, and click 'Select All' to select all of them", function (assert) {
        var listAndSelection = createSampleList([], false);
        assertSelected(assert, 3, [], listAndSelection);
        
        $("div#qunit-fixture button#selectAllCompetitors").click();
        
        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
    });
    
    QUnit.test("Can create a list with all competitors selected, and click 'Select None' to select none of them", function (assert) {
        var listAndSelection = createSampleList([0, 1, 2], false);
        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
        
        $("div#qunit-fixture button#selectNoCompetitors").click();
        
        assertSelected(assert, 3, [], listAndSelection);
    });
    
    QUnit.test("Cannot view the Crossing Runners button if not showing the race graph", function (assert) {
        var listAndSelection = createSampleList([], false);
        listAndSelection.list.setChartType(ChartTypes.SplitsGraph);
        assert.strictEqual($(CROSSING_RUNNERS_BUTTON_SELECTOR).size(), 1);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":visible"));
    });
    
    QUnit.test("Can view the Crossing Runners button if showing the race graph", function (assert) {
        createSampleListForRaceGraph([], false);
        assert.ok($(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":visible"));
    });
    
    QUnit.test("Crossing Runners button is not enabled if no competitors are selected", function (assert) {
        createSampleListForRaceGraph([], false);
        assert.ok($(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
    });
    
    QUnit.test("Crossing Runners button is not enabled if two competitors are selected", function (assert) {
        createSampleListForRaceGraph([1, 2], false);
        assert.ok($(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
    });
    
    QUnit.test("Crossing Runners button is enabled if one competitor is selected", function (assert) {
        createSampleListForRaceGraph([1], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        resetAlert();
    });
    
    QUnit.test("Clicking the Crossing Runners button when a crossing runner exists selects the crossing runner", function (assert) {
        resetAlert();
        var listAndSelection = createSampleListForRaceGraph([1], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 0);
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i < 2));
        }
    });
    
    QUnit.test("Clicking the Crossing Runners button when no crossing runner exists pops up an alert message", function (assert) {
        resetAlert();
        var listAndSelection = createSampleListForRaceGraph([2], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 1);
        assert.ok(typeof lastAlertMessage !== "undefined" && lastAlertMessage !== null);
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i === 2), "Wrong selectedness for competitor " + i);
        }
    });
    
    QUnit.test("Clicking the Crossing Runners button when a filter is active but there are no crossing runners among the filtered competitors pops up an alert messages", function (assert) {
        resetAlert();
        var listAndSelection = createSampleListForRaceGraph([1], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        listAndSelection.list.setFilterText("k");
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 1);
        assert.ok(typeof lastAlertMessage !== "undefined" && lastAlertMessage !== null);
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i === 1));
        }
    });

    QUnit.test("Filtering by a string contained in one competitor only matches only that competitor", function (assert) {
        var listAndSelection = createSampleList([], false);
            
        listAndSelection.list.setFilterText("John");
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i === 0), "Only the first competitor should be visible");
        }
    });

    QUnit.test("Filtering by a string contained in one competitor but not matching case only matches only that competitor", function (assert) {
        var listAndSelection = createSampleList([], false);
            
        listAndSelection.list.setFilterText("joHn");
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i === 0), "Only the first competitor should be visible");
        }
    });

    QUnit.test("Filtering by a string contained in one competitor with apostrophe in name but not in search string matches only that competitor", function (assert) {
        var listAndSelection = createSampleList([], false);
            
        listAndSelection.list.setFilterText("OConnor");
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i === 1), "Only the second competitor should be visible");
        }
    });

    QUnit.test("Filtering by a string contained in two competitors matches both of those competitors", function (assert) {
        var listAndSelection = createSampleList([], false);
            
        listAndSelection.list.setFilterText("son");
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i === 0 || i === 2), "Only the first and third competitors should be visible: this is competitor " + i);
        }
    });

    QUnit.test("Filtering by a string contained in no competitors matches no competitors", function (assert) {
        var listAndSelection = createSampleList([], false);
            
        listAndSelection.list.setFilterText("xxxxxx");
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), false, "No competitors should be visible");
        }
    });

    QUnit.test("Filtering by an empty string matches all competitors", function (assert) {
        var listAndSelection = createSampleList([], false);
            
        listAndSelection.list.setFilterText("");
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), true, "No competitors should be visible");
        }
    });

    QUnit.test("Filtering is updated when the list of competitors is changed", function (assert) {
        var listAndSelection = createSampleList([], false);
            
        listAndSelection.list.setFilterText("son");
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i !== 1), "The first and third competitors should be visible");
        }
        
        var newCompetitors = [
            fromSplitTimes(1, "Jane Smith", "CDO", 10 * 3600, [13, 96, 35]),
            fromSplitTimes(2, "Lucy Watson", "GHO", 10 * 3600 + 6, [15, 79, 41]),
            fromSplitTimes(3, "Kate Jones", "KLO", 10 * 3600 + 33, [18, 81, 37])
        ];
        
        listAndSelection.list.setCompetitorList(newCompetitors, false);
        listAndSelection.list.setSelection(new CompetitorSelection(newCompetitors.length));
        
        for (i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i === 1), "Only the second competitor should be visible");
        }
    });

    QUnit.test("Can register handler and have it called when filter text changes", function (assert) {
        reset();
        var listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.setFilterText("son");
        assert.strictEqual(callCount, 1, "Handler should have been called once");
    });

    QUnit.test("Can register handler and have it called multiple times when filter text changed multiple times", function (assert) {
        reset();
        var listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.setFilterText("son");
        listAndSelection.list.setFilterText("smi");
        assert.strictEqual(callCount, 2, "Handler should have been called twice");
    });

    QUnit.test("Can register multiple handlers and have them all called when competitor selection toggled", function (assert) {
        reset();
        var listAndSelection = createSampleListWithChangeHandler([], false);

        var callCount2 = 0;
        var handler2 = function () {
            callCount2 += 1;
        };

        listAndSelection.list.registerChangeHandler(handler2);

        listAndSelection.list.setFilterText("son");

        assert.strictEqual(callCount, 1, "Handler should only have been called once");
        assert.strictEqual(callCount2, 1, "Handler should only have been called once");
    });

    QUnit.test("Handler only called once even if registered miltiple times", function (assert) {
        reset();
        var listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.registerChangeHandler(testHandler);
        listAndSelection.list.setFilterText("son");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Can deregister previously-registered handler", function (assert) {
        reset();
        var listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.setFilterText("son");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");

        listAndSelection.list.deregisterChangeHandler(testHandler);
        listAndSelection.list.setFilterText("smi");
        assert.strictEqual(callCount, 1, "Handler should still only have been called once");
    });

    QUnit.test("Can deregister previously-registered handler multiple times without error", function (assert) {
        reset();
        var listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.setFilterText("son");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");

        listAndSelection.list.deregisterChangeHandler(testHandler);
        listAndSelection.list.deregisterChangeHandler(testHandler);
        listAndSelection.list.setFilterText("smi");
        assert.strictEqual(callCount, 1, "Handler should still only have been called once");
    });

    QUnit.test("Can deregister handler that was never registered without error", function () {
        reset();
        var listAndSelection = createSampleListWithChangeHandler([], false);
        var someOtherHandler = function() { /* do nothing */ };
        listAndSelection.list.deregisterChangeHandler(someOtherHandler);
        expect(0); // No assertions here, but there should also have been no errors.
    });  
})();
