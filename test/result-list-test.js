/*
 *  SplitsBrowser - ResultList tests.
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

    const ResultList = SplitsBrowser.Controls.ResultList;
    const ResultSelection = SplitsBrowser.Model.ResultSelection;
    const ChartTypes = SplitsBrowser.Model.ChartTypes;
    const getMessage = SplitsBrowser.getMessage;
    const Team = SplitsBrowser.Model.Team;
    const createTeamResult = SplitsBrowser.Model.Result.createTeamResult;

    const fromSplitTimes = SplitsBrowserTest.fromSplitTimes;

    // CSS selector for the Crossing Runners button.
    const CROSSING_RUNNERS_BUTTON_SELECTOR = "div#qunit-fixture button#selectCrossingRunners";

    const NUMBER_TYPE = typeof 0;

    QUnit.module("Result List");

    let lastAlertMessage;
    let alertCount;

    function resetAlert() {
        lastAlertMessage = null;
        alertCount = 0;
    }

    function customAlert(message) {
        lastAlertMessage = message;
        alertCount += 1;
    }

    // Test code for handling filter-text changes
    let callCount = 0;

    function testHandler() {
        callCount += 1;
    }

    function reset() {
        callCount = 0;
    }

    let propagationStopped = false;

    /**
    * Verifies that the given value is a Number.
    * @param {any} value Value to verify.
    */
    function verifyNumeric(value) {
        if (typeof value !== NUMBER_TYPE) {
            throw new Error(`${value} of type ${typeof value} is not a number`);
        }
    }

    /**
    * Sets up and returns the event before event handlers are called.
    * @param {Number|HTMLElement} target The target element, or the index of
    *     the result.
    * @param {Object} options The options.
    * @return {Object} The created event.
    */
    function setUpEvent(target, options) {
        propagationStopped = false;
        if (typeof target === NUMBER_TYPE) {
            target = $("div.result")[target];
        }
        options = options || {};
        let currentY = (target === document) ? 0 : target.getBoundingClientRect().top + target.clientTop;
        return {
            which: options.which || 1,
            currentTarget: target,
            stopPropagation: () => propagationStopped = true,
            clientY: currentY + (options.yOffset || 0),
            shiftKey: options.shiftKey || false
        };
    }

    /**
    * Sets up the event before event handlers are called and initiates a
    * start-drag.
    * @param {Number} targetIndex The index of the target result element.
    * @param {Object} options The options.
    * @param {Object} listAndSelection Object containing the result list and
    *     the result selection.
    */
    function setUpEventAndStartDrag(targetIndex, options, listAndSelection) {
        verifyNumeric(targetIndex);
        let event = setUpEvent(targetIndex, options);
        listAndSelection.list.startDrag(event, targetIndex);
    }

    /**
    * Sets up the event before event handlers are called and initiates a
    * start-drag followed by a stop-drag.
    * @param {Number} targetIndex The index of the target result element.
    * @param {Object} options The options.
    * @param {Object} listAndSelection Object containing the result list and
    *     the result selection.
    */
    function setUpEventAndStartDragAndStopDrag(targetIndex, options, listAndSelection) {
        verifyNumeric(targetIndex);
        let event = setUpEvent(targetIndex, options);
        listAndSelection.list.startDrag(event, targetIndex);
        listAndSelection.list.stopDrag(event);
    }

    /**
    * Sets up the event before event handlers are called and initiates a
    * start-drag from off the bottom of the list of results.
    * @param {Object} listAndSelection Object containing the result list and
    *     the result selection.
    * @param {Object} options The options.
    */
    function setUpEventAndStartDragOffTheBottom(listAndSelection, options) {
        options.yOffset = 250;
        let event = setUpEvent($("#resultList")[0], options);
        listAndSelection.list.startDrag(event, -1);
    }

    /**
    * Sets up the event before event handlers are called and initiates a
    * start-drag from within the scrollbar.
    * @param {Object} listAndSelection Object containing the result list and
    *     the result selection.
    * @param {Object} options The options.
    */
    function setUpEventAndStartDragInTheScrollbar(listAndSelection, options) {
        options.yOffset = -20;
        let event = setUpEvent($("#resultList")[0], options);
        listAndSelection.list.startDrag(event, -1);
    }

    /**
    * Sets up the event and initiates a mouse-move event.
    * @param {Number|HTMLElement} target The target element, or the index of
    *     the result.
    * @param {Object} listAndSelection Object containing the result list and
    *     the selected results.
    */
    function setUpEventAndMoveMouse(targetIndex, listAndSelection) {
        verifyNumeric(targetIndex);
        let event = setUpEvent(targetIndex);
        listAndSelection.list.mouseMove(event, targetIndex);
    }

    /**
    * Sets up the event and initiates a mouse-move event and a stop-drag
    * event.
    * @param {Number|HTMLElement} target The target element, or the index of
    *     the result.
    * @param {Object} listAndSelection Object containing the result list and
    *     the selected results.
    */
    function setUpEventAndMoveMouseAndStopDrag(targetIndex, listAndSelection) {
        verifyNumeric(targetIndex);
        let event = setUpEvent(targetIndex);
        listAndSelection.list.mouseMove(event, targetIndex);
        listAndSelection.list.stopDrag(event);
    }

    /**
    * Sets up the event and initiates a mouse-move event off the bottom of
    * the result list.
    * @param {Object} listAndSelection Object containing the result list and
    *     the selected results.
    */
    function setUpEventAndMoveMouseOffTheBottom(listAndSelection) {
        let event = setUpEvent($("#resultList")[0], {yOffset: 200});
        listAndSelection.list.mouseMove(event, -1);
    }

    /**
    * Sets up the event and initiates a stop-drag event off the bottom of
    * the result list and stops the drag there.
    * @param {Object} listAndSelection Object containing the result list and
    *     the selected results.
    */
    function setUpEventAndMoveMouseOffTheBottomAndStopDrag(listAndSelection) {
        let event = setUpEvent($("#resultList")[0], {yOffset: 200});
        listAndSelection.list.mouseMove(event, -1);
        listAndSelection.list.stopDrag(event);
    }

    /**
    * Sets up the event and initiates a mouse-move event into the scrollbar.
    * @param {Object} listAndSelection Object containing the result list and
    *     the selected results.
    */
    function setUpEventAndMoveMouseIntoTheScrollbar(listAndSelection) {
        let event = setUpEvent($("#resultList")[0], {yOffset: -20});
        listAndSelection.list.mouseMove(event, -1);
    }

    /**
    * Sets up the event and initiates a mouse-move event into the scrollbar
    * and a stop-drag event there.
    * @param {Object} listAndSelection Object containing the result list and
    *     the selected results.
    */
    function setUpEventAndMoveMouseIntoTheScrollbarAndStopDrag(listAndSelection) {
        let event = setUpEvent($("#resultList")[0], {yOffset: -20});
        listAndSelection.list.mouseMove(event, -1);
        listAndSelection.list.stopDrag(event);
    }

    /**
    * Creates a list with three results in it, and return the list and the
    * selection.
    * @param {Array} selectedIndexes Indexes of selected results in the selection.
    * @param {Boolean} multipleClasses Whether the list of results is built from
    *                                  multiple classes.
    * @return {Object} 2-element object containing the selection and list.
    */
    function createSampleList(selectedIndexes, multipleClasses) {
        let parent = d3.select("div#qunit-fixture").node();

        let resultList = [
            fromSplitTimes(1, "First Runnerson", "CDO", 10 * 3600, [13, 96, 35]),
            fromSplitTimes(2, "Second O'Runner", "GHO", 10 * 3600 + 6, [15, 79, 41]),
            fromSplitTimes(3, "Third Runnerson", "KLO", 10 * 3600 + 33, [18, 81, 37])
        ];

        let selection = new ResultSelection(resultList.length);
        for (let index of selectedIndexes) {
            selection.toggle(index);
        }

        let list = new ResultList(parent, customAlert);
        list.setResultList(resultList, multipleClasses, false, null);
        list.setSelection(selection);
        return { selection: selection, list: list };
    }

    /**
    * Creates a list with three team results in it, and return the list and the
    * selection.
    * @param {Array} selectedIndexes Indexes of selected results in the selection.
    * @return {Object} 2-element object containing the selection and list.
    */
    function createSampleTeamList(selectedIndexes) {
        let parent = d3.select("div#qunit-fixture").node();

        let resultList = [
            createTeamResult(
                1,
                [fromSplitTimes(1, "First Runner", "CDO", 10 * 3600, [13, 96, 35]), fromSplitTimes(1, "Second Runner", "CDO", 10 * 3600 + 144, [19, 92, 37])],
                new Team("First Team", "CDO")
            ),
            createTeamResult(
                2,
                [fromSplitTimes(1, "Third Runner", "GHO", 10 * 3600, [15, 79, 41]), fromSplitTimes(1, "Fourth Runner", "GHO", 10 * 3600 + 135, [22, 42, 41])],
                new Team("Second Team", "GHO")
            ),
            createTeamResult(
                3,
                [fromSplitTimes(1, "Fifth Runner", "KLO", 10 * 3600, [118, 81, 37]), fromSplitTimes(1, "Sixth Runner", "KLO", 10 * 3600 + 236, [20, 99, 44])],
                new Team("Third Team", "KLO")
            )
        ];

        for (let result of resultList) {
            result.setOffsets([0, 4]);
        }

        let selection = new ResultSelection(resultList.length);
        for (let index of selectedIndexes) {
            selection.toggle(index);
        }

        let list = new ResultList(parent, customAlert);
        list.setResultList(resultList, false, true, null);
        list.setSelection(selection);
        return { selection: selection, list: list };
    }

    /**
    * Creates a list with three options in it, set it up on the race graph
    * and return the list and the selection.
    * @param {Array} selectedIndexes Indexes of selected results in the selection.
    * @param {Boolean} multipleClasses Whether the list of results is built from
    *                                    multiple classes.
    * @return {Object} 2-element object containing the selection and list.
    */
    function createSampleListForRaceGraph(selectedIndexes, multipleClasses) {
        let listAndSelection = createSampleList(selectedIndexes, multipleClasses);
        listAndSelection.list.setChartType(ChartTypes.RaceGraph);
        listAndSelection.list.enableOrDisableCrossingRunnersButton();
        return listAndSelection;
    }

    /**
    * Creates a list with three team options in it, set it up on the race graph
    * and return the list and the selection.
    * @param {Array} selectedIndexes Indexes of selected results in the selection.
    * @return {Object} 2-element object containing the selection and list.
    */
    function createSampleTeamListForRaceGraph(selectedIndexes) {
        let listAndSelection = createSampleTeamList(selectedIndexes);
        listAndSelection.list.setChartType(ChartTypes.RaceGraph);
        listAndSelection.list.enableOrDisableCrossingRunnersButton();
        return listAndSelection;
    }

    /**
    * Creates a list with three options in it, wires up the test change handler
    * and returns the list and the selection.
    * @param {Array} selectedIndexes Indexes of selected results in the selection.
    * @param {Boolean} multipleClasses Whether the list of results is built from
    *                                    multiple classes.
    * @return {Object} 2-element object containing the selection and list.
    */
    function createSampleListWithChangeHandler(selectedIndexes, multipleClasses) {
        let listAndSelection = createSampleList(selectedIndexes, multipleClasses);
        listAndSelection.list.registerChangeHandler(testHandler);
        return listAndSelection;
    }

    /**
    * Asserts that the given expected list of results all have the given
    * CSS class in their associated div, and other result divs do not.
    * @param {QUnit.assert} assert QUnit assert object.
    * @param {Number} count Total number of results.
    * @param {String} className The name of the CSS class to test for.
    * @param {Array} expectedResults Array that contains the indexes of
    *     all results that should have the given CSS class.
    */
    function assertResultsClassed(assert, count, className, expectedResults) {
        let results = $("div.result");
        for (let index = 0; index < count; index += 1) {
            assert.strictEqual($(results[index]).hasClass(className), expectedResults.indexOf(index) >= 0);
        }
    }

    /**
    * Asserts that the currently-drag-selected results are as expected.
    * @param {QUnit.assert} assert QUnit assert object.
    * @param {Number} count Total number of results.
    * @param {Array} expectedDragSelected Array that contains the indexes of
    *     all results that should be drag-selected.
    */
    function assertDragSelected(assert, count, expectedDragSelected) {
        assertResultsClassed(assert, count, "dragSelected", expectedDragSelected);
    }

    /**
    * Asserts that the currently-drag-deselected results are as expected.
    * @param {QUnit.assert} assert QUnit assert object.
    * @param {Number} count Total number of results.
    * @param {Array} expectedDragDeselected Array that contains the indexes of
    *     all results that should be drag-deselected.
    */
    function assertDragDeselected(assert, count, expectedDragDeselected) {
        assertResultsClassed(assert, count, "dragDeselected", expectedDragDeselected);
    }

    /**
    * Asserts that the currently-selected results are as expected,  both in
    * the the divs and the underlying selection.
    * @param {QUnit.assert} assert QUnit assert object.
    * @param {Number} count Total number of results.
    * @param {Array} expectedSelected Array that contains the indexes of
    *     all results that should be selected.
    */
    function assertSelected(assert, count, expectedSelected, listAndSelection) {
        let results = $("div.result");
        for (let index = 0; index < count; index += 1) {
            let shouldBeSelected = expectedSelected.indexOf(index) >= 0;
            assert.strictEqual($(results[index]).hasClass("selected"), shouldBeSelected);
            assert.strictEqual(listAndSelection.selection.isSelected(index), shouldBeSelected);
        }
    }

    /**
    * Asserts that there are no drag-selected results.
    * @param {QUnit.assert} assert QUnit assert object.
    */
    function assertNoDragSelected(assert) {
        assert.strictEqual($("div.result.dragSelected").length, 0);
    }

    QUnit.test("Can create a list, set the filter text and read the same value back", function (assert) {
        let listAndSelection = createSampleList([], false);
        listAndSelection.list.setFilterText("test abc 123 DEF");
        assert.strictEqual(listAndSelection.list.getFilterText(), "test abc 123 DEF");
    });

    QUnit.test("Can create a list for a single individual class with all results deselected and without class labels", function (assert) {
        createSampleList([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result[title]").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture span.resultClassLabel").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture button").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture input[type=text]").size(), 1);
        assert.ok(!$("div#qunit-fixture button")[0].disabled);
        assert.ok(!$("div#qunit-fixture button")[1].disabled);
        assert.ok(!d3.select("div#qunit-fixture input[type=text]").property("disabled"));
    });

    QUnit.test("Can create a list for a single team class with all results deselected and with the correct tooltips", function (assert) {
        createSampleTeamList([]);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result[title]").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture span.resultClassLabel").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture button").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture input[type=text]").size(), 1);
        assert.ok(!$("div#qunit-fixture button")[0].disabled);
        assert.ok(!$("div#qunit-fixture button")[1].disabled);
        assert.ok(!d3.select("div#qunit-fixture input[type=text]").property("disabled"));

        let titledNodes = d3.selectAll("div#qunit-fixture div.result[title]").nodes();
        assert.strictEqual(titledNodes.length, 3);
        assert.strictEqual(titledNodes[0].getAttribute("title"), "> First Team\nFirst Runner\nSecond Runner");
        assert.strictEqual(titledNodes[1].getAttribute("title"), "> Second Team\nThird Runner\nFourth Runner");
        assert.strictEqual(titledNodes[2].getAttribute("title"), "> Third Team\nFifth Runner\nSixth Runner");
    });

    QUnit.test("Can create a list for the first leg of a team class with the correct tooltips", function (assert) {
        let list = createSampleTeamList([]).list;
        list.setResultList(list.allResults, false, true, 0);

        let nodes = d3.selectAll("div#qunit-fixture div.result").nodes();
        assert.strictEqual(nodes.length, 3);
        assert.strictEqual(d3.select(nodes[0]).text(), "First Runner");
        assert.strictEqual(d3.select(nodes[1]).text(), "Third Runner");
        assert.strictEqual(d3.select(nodes[2]).text(), "Fifth Runner");

        let titledNodes = d3.selectAll("div#qunit-fixture div.result[title]").nodes();
        assert.strictEqual(titledNodes.length, 3);
        assert.strictEqual(titledNodes[0].getAttribute("title"), "First Team\n> First Runner\nSecond Runner");
        assert.strictEqual(titledNodes[1].getAttribute("title"), "Second Team\n> Third Runner\nFourth Runner");
        assert.strictEqual(titledNodes[2].getAttribute("title"), "Third Team\n> Fifth Runner\nSixth Runner");
    });

    QUnit.test("Can create a list for the second leg of a team class with the correct tooltips", function (assert) {
        let list = createSampleTeamList([]).list;
        list.setResultList(list.allResults, false, true, 1);

        let nodes = d3.selectAll("div#qunit-fixture div.result").nodes();
        assert.strictEqual(nodes.length, 3);
        assert.strictEqual(d3.select(nodes[0]).text(), "Second Runner");
        assert.strictEqual(d3.select(nodes[1]).text(), "Fourth Runner");
        assert.strictEqual(d3.select(nodes[2]).text(), "Sixth Runner");

        let titledNodes = d3.selectAll("div#qunit-fixture div.result[title]").nodes();
        assert.strictEqual(titledNodes.length, 3);
        assert.strictEqual(titledNodes[0].getAttribute("title"), "First Team\nFirst Runner\n> Second Runner");
        assert.strictEqual(titledNodes[1].getAttribute("title"), "Second Team\nThird Runner\n> Fourth Runner");
        assert.strictEqual(titledNodes[2].getAttribute("title"), "Third Team\nFifth Runner\n> Sixth Runner");
    });

    QUnit.test("Can create a list for an empty class of individual results, with placeholder message", function (assert) {
        let parent = d3.select("div#qunit-fixture").node();
        let list = new ResultList(parent, customAlert);
        list.setResultList([], false, false, null);
        list.setSelection(new ResultSelection(0));
        assert.ok($("div#qunit-fixture button")[0].disabled);
        assert.ok($("div#qunit-fixture button")[1].disabled);
        assert.ok(d3.select("div#qunit-fixture input[type=text]").property("disabled"));
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.resultListPlaceholder").size(), 1);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.resultListPlaceholder").text(), getMessage("NoCompetitorsStarted"));
    });

    QUnit.test("Can create a list for an empty class of team results, with placeholder message", function (assert) {
        let parent = d3.select("div#qunit-fixture").node();
        let list = new ResultList(parent, customAlert);
        list.setResultList([], false, true, null);
        list.setSelection(new ResultSelection(0));
        assert.ok($("div#qunit-fixture button")[0].disabled);
        assert.ok($("div#qunit-fixture button")[1].disabled);
        assert.ok(d3.select("div#qunit-fixture input[type=text]").property("disabled"));
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.resultListPlaceholder").size(), 1);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.resultListPlaceholder").text(), getMessage("NoTeamsStarted"));
    });

    QUnit.test("Can create a list for an empty class of results and then a non-empty list, removing placeholder div", function (assert) {
        let parent = d3.select("div#qunit-fixture").node();
        let list = new ResultList(parent, customAlert);
        list.setResultList([], false, false, null);
        list.setSelection(new ResultSelection(0));
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.resultListPlaceholder").size(), 1);

        let compList = [fromSplitTimes(1, "First Runner", "CDO", 10 * 3600, [13, 96, 35])];
        list.setResultList(compList, false, false, null);
        list.setSelection(new ResultSelection(1));
        assert.ok(!$("div#qunit-fixture button")[0].disabled);
        assert.ok(!$("div#qunit-fixture button")[1].disabled);
        assert.ok(!d3.select("div#qunit-fixture input[type=text]").property("disabled"));
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.resultListPlaceholder").size(), 0);
    });

    QUnit.test("Can create a list for multiple classes with all results deselected but with class labels shown", function (assert) {
        createSampleList([], true);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture span.resultClassLabel").size(), 3);
    });

    QUnit.test("Can create a list with two of three results initially selected", function (assert) {
        createSampleList([0, 2], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 2);
    });

    QUnit.test("Can create a list with all results deselected, and then select them all", function (assert) {
        let listAndSelection = createSampleList([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 0);
        listAndSelection.selection.selectAll();
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 3);
    });

    QUnit.test("Can create a list with all results selected, and then deselect them all", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 3);
        listAndSelection.selection.selectNone();
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 0);
    });

    QUnit.test("Can create a list, change the selection and ignore changes made to the old selection", function (assert) {
        let listAndSelection = createSampleList([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 0);

        let newSelection = new ResultSelection(3);
        listAndSelection.list.setSelection(newSelection);

        let oldSelection = listAndSelection.selection;
        oldSelection.selectAll();
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.result.selected").size(), 0);
    });

    QUnit.test("Can create a list with all results deselected and click and hold to drag-select one of them", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);

        assertDragSelected(assert, 3, [1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag downwards to drag-select more than one of them", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);

        assertDragSelected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag upwards to drag-select more than one of them", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouse(0, listAndSelection);

        assertDragSelected(assert, 3, [0, 1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag downwards and then upwards to drag-select more than one of them", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);
        setUpEventAndMoveMouse(0, listAndSelection);

        assertDragSelected(assert, 3, [0, 1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with one result selected and drag downwards to drag-select both results", function (assert) {
        let listAndSelection = createSampleList([1], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);

        assertDragSelected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag downwards off the bottom of the list to drag-select the last two results", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouseOffTheBottom(listAndSelection);

        assertDragSelected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag off the list into the scrollbar to drag-select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouseIntoTheScrollbar(listAndSelection);

        assertDragSelected(assert, 3, []);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected, and drag onto the list to drag-select the last two results", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDragOffTheBottom(listAndSelection, {});
        setUpEventAndMoveMouse(1, listAndSelection);

        assertDragSelected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected, and drag from the scrollbar into the list to drag-select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDragInTheScrollbar(listAndSelection, {});
        setUpEventAndMoveMouse(1, listAndSelection);

        assertDragSelected(assert, 3, []);
    });

    QUnit.test("Can create a list with all results deselected, and drag around off the list to drag-select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDragOffTheBottom(listAndSelection, {});
        setUpEventAndMoveMouseOffTheBottom(listAndSelection);

        assertDragSelected(assert, 3, []);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected, and drag with the wrong mouse button to drag-select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {which: 4}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);

        assertDragSelected(assert, 3, []);
    });

    QUnit.test("Can create a list with all results deselected, filter the list and then select only all filtered results", function (assert) {
        let listAndSelection = createSampleList([], false);
        listAndSelection.list.setFilterText("son");
        $("div#qunit-fixture button#selectAllResults").click();
        assertSelected(assert, 3, [0, 2], listAndSelection);
    });

    QUnit.test("Can create a list with all results selected, filter the list and then deselect only all filtered results", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);
        listAndSelection.list.setFilterText("son");
        $("div#qunit-fixture button#selectNoResults").click();
        assertSelected(assert, 3, [1], listAndSelection);
    });

    QUnit.test("Can create a list with all results selected, filter the list and then deselect all results with a double-click", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);
        listAndSelection.list.setFilterText("son");
        $("div#qunit-fixture button#selectNoResults").dblclick();
        assertSelected(assert, 3, [], listAndSelection);
    });

    QUnit.test("Can create a list with all results deselected, filter the list and then drag-select those only in the filtered list", function (assert) {
        let listAndSelection = createSampleList([], false);
        listAndSelection.list.setFilterText("son");

        setUpEventAndStartDrag(0, {}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);

        assertDragSelected(assert, 3, [0, 2]);
    });

    QUnit.test("Can create a list with all results selected and shift-click and hold to drag-deselect one of them", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);

        assertDragDeselected(assert, 3, [1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag downwards to drag-deselect more than one of them", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);

        assertDragDeselected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag upwards to drag-deselect more than one of them", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouse(0, listAndSelection);

        assertDragDeselected(assert, 3, [0, 1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and shift-drag downwards and then upwards to drag-deselect more than one of them", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);
        setUpEventAndMoveMouse(0, listAndSelection);

        assertDragDeselected(assert, 3, [0, 1]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with one result deselected and shift-drag downwards to drag-deselect both results", function (assert) {
        let listAndSelection = createSampleList([0, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);

        assertDragDeselected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag downwards off the bottom of the list to drag-deselect the last two results", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouseOffTheBottom(listAndSelection);

        assertDragDeselected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag off the list into the scrollbar to drag-deselect nothing", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouseIntoTheScrollbar(listAndSelection);

        assertDragDeselected(assert, 3, []);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected, and shift-drag onto the list to drag-deselect the last two results", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDragOffTheBottom(listAndSelection, {shiftKey: true});
        setUpEventAndMoveMouse(1, listAndSelection);

        assertDragDeselected(assert, 3, [1, 2]);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected, and shift-drag from the scrollbar into the list to drag-deselect nothing", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDragInTheScrollbar(listAndSelection, {shiftKey: true});
        setUpEventAndMoveMouse(1, listAndSelection);

        assertDragDeselected(assert, 3, []);
    });

    QUnit.test("Can create a list with all results selected, and shift-drag around off the list to drag-deselect nothing", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDragOffTheBottom(listAndSelection, {shiftKey: true});
        setUpEventAndMoveMouseOffTheBottom(listAndSelection);

        assertDragDeselected(assert, 3, []);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected, and shift-drag with the wrong mouse button to drag-deselect nothing", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true, which: 4}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);

        assertDragSelected(assert, 3, []);
    });

    QUnit.test("Can create a list with all results selected, filter the list and then drag-deselect those only in the filtered list", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);
        listAndSelection.list.setFilterText("son");

        setUpEventAndStartDrag(0, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);

        assertDragDeselected(assert, 3, [0, 2]);
    });

    QUnit.test("Can create a list with all results deselected, and click to select one of them", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDragAndStopDrag(1, {}, listAndSelection);

        assertSelected(assert, 3, [1], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected, and click to deselect one of them", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDragAndStopDrag(1, {}, listAndSelection);

        assertSelected(assert, 3, [0, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected, and drag downwards to select more than one of them", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(2, listAndSelection);

        assertSelected(assert, 3, [1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected, and drag upwards to select more than one of them", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(0, listAndSelection);

        assertSelected(assert, 3, [0, 1], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected, and drag downwards and then upwards to select more than one of them", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(0, listAndSelection);

        assertSelected(assert, 3, [0, 1], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with one result selected and drag downwards to select that result and another", function (assert) {
        let listAndSelection = createSampleList([1], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(2, listAndSelection);

        assertSelected(assert, 3, [1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag downwards off the bottom of the list to select the last two results", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouseOffTheBottomAndStopDrag(listAndSelection);

        assertSelected(assert, 3, [1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag off the list into the scrollbar to select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        setUpEventAndMoveMouseIntoTheScrollbarAndStopDrag(listAndSelection);

        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag off the list altogether to select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {}, listAndSelection);
        listAndSelection.list.mouseMove(setUpEvent(document), -1);
        listAndSelection.list.stopDrag(setUpEvent(document));

        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag onto the list to select the last two results", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDragOffTheBottom(listAndSelection, {});
        setUpEventAndMoveMouseAndStopDrag(1, listAndSelection);

        assertSelected(assert, 3, [1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag from the scrollbar into the list to select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDragInTheScrollbar(listAndSelection, {});
        setUpEventAndMoveMouseAndStopDrag(1, listAndSelection);

        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
    });

    QUnit.test("Can create a list with all results deselected and drag around off the list to select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDragOffTheBottom(listAndSelection, {});
        setUpEventAndMoveMouseOffTheBottomAndStopDrag(listAndSelection);

        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results deselected and drag with the wrong mouse button to select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {which: 4}, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(2, listAndSelection);

        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
    });

    QUnit.test("Can create a list with all results selected, and shift-drag downwards to deselect more than one of them", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(2, listAndSelection);

        assertSelected(assert, 3, [0], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected, and shift-drag upwards to deselect more than one of them", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(0, listAndSelection);

        assertSelected(assert, 3, [2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected, and shift-drag downwards and then upwards to deselect more than one of them", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouse(2, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(0, listAndSelection);

        assertSelected(assert, 3, [2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with one result deselected and shift-drag downwards to deselect that result and another", function (assert) {
        let listAndSelection = createSampleList([0, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(2, listAndSelection);

        assertSelected(assert, 3, [0], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag downwards off the bottom of the list to deselect the last two results", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouseOffTheBottomAndStopDrag(listAndSelection);

        assertSelected(assert, 3, [0], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag off the list into the scrollbar to deselect nothing", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        setUpEventAndMoveMouseIntoTheScrollbarAndStopDrag(listAndSelection);

        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag off the list altogether to deselect nothing", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDrag(1, {shiftKey: true}, listAndSelection);
        listAndSelection.list.mouseMove(setUpEvent(document), -1);
        listAndSelection.list.stopDrag(setUpEvent(document));

        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag onto the list to deselect the last two results", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDragOffTheBottom(listAndSelection, {shiftKey: true});
        setUpEventAndMoveMouseAndStopDrag(1, listAndSelection);

        assertSelected(assert, 3, [0], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag from the scrollbar into the list to deselect nothing", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDragInTheScrollbar(listAndSelection, {shiftKey: true});
        setUpEventAndMoveMouseAndStopDrag(1, listAndSelection);

        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
        assertNoDragSelected(assert);
    });

    QUnit.test("Can create a list with all results selected and drag around off the list to deselect nothing", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);

        setUpEventAndStartDragOffTheBottom(listAndSelection, {shiftKey: true});
        setUpEventAndMoveMouseOffTheBottomAndStopDrag(listAndSelection);

        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
        assertNoDragSelected(assert);
        assert.ok(propagationStopped);
    });

    QUnit.test("Can create a list with all results selected and shift-drag with the wrong mouse button to select nothing", function (assert) {
        let listAndSelection = createSampleList([], false);

        setUpEventAndStartDrag(1, {shiftKey: true, which: 4}, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(2, listAndSelection);

        assertSelected(assert, 3, [], listAndSelection);
        assertNoDragSelected(assert);
    });

    QUnit.test("Can create a list with all results deselected, filter the list and then select those only in the filtered list", function (assert) {
        let listAndSelection = createSampleList([], false);
        listAndSelection.list.setFilterText("son");

        setUpEventAndStartDrag(0, {}, listAndSelection);
        setUpEventAndMoveMouseAndStopDrag(2, listAndSelection);

        assertSelected(assert, 3, [0, 2], listAndSelection);
        assertNoDragSelected(assert);
    });

    QUnit.test("Can create a list with all results deselected, and click 'Select All' to select all of them", function (assert) {
        let listAndSelection = createSampleList([], false);
        assertSelected(assert, 3, [], listAndSelection);

        $("div#qunit-fixture button#selectAllResults").click();

        assertSelected(assert, 3, [0, 1, 2], listAndSelection);
    });

    QUnit.test("Can create a list with all results selected, and click 'Select None' to select none of them", function (assert) {
        let listAndSelection = createSampleList([0, 1, 2], false);
        assertSelected(assert, 3, [0, 1, 2], listAndSelection);

        $("div#qunit-fixture button#selectNoResults").click();

        assertSelected(assert, 3, [], listAndSelection);
    });

    QUnit.test("Cannot view the Crossing Runners button if not showing the race graph", function (assert) {
        let listAndSelection = createSampleList([], false);
        listAndSelection.list.setChartType(ChartTypes.SplitsGraph);
        assert.strictEqual($(CROSSING_RUNNERS_BUTTON_SELECTOR).length, 1);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":visible"));
    });

    QUnit.test("Can view the Crossing Runners button if showing the race graph", function (assert) {
        createSampleListForRaceGraph([], false);
        assert.ok($(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":visible"));
    });

    QUnit.test("Crossing Runners button is not enabled if no results are selected", function (assert) {
        createSampleListForRaceGraph([], false);
        assert.ok($(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
    });

    QUnit.test("Crossing Runners button is not enabled if two results are selected", function (assert) {
        createSampleListForRaceGraph([1, 2], false);
        assert.ok($(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
    });

    QUnit.test("Crossing Runners button is enabled if one result is selected", function (assert) {
        createSampleListForRaceGraph([1], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        resetAlert();
    });

    QUnit.test("Clicking the Crossing Runners button when a crossing runner exists selects the crossing runner", function (assert) {
        resetAlert();
        let listAndSelection = createSampleListForRaceGraph([1], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 0);
        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i < 2));
        }
    });

    QUnit.test("Clicking the Crossing Runners button when no crossing runner exists pops up an alert message", function (assert) {
        resetAlert();
        let listAndSelection = createSampleListForRaceGraph([2], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 1);
        assert.ok(typeof lastAlertMessage !== "undefined" && lastAlertMessage !== null);
        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i === 2), "Wrong selectedness for result " + i);
        }
    });

    QUnit.test("Clicking the Crossing Runners button when a filter is active but there are no crossing runners among the filtered results pops up an alert message", function (assert) {
        resetAlert();
        let listAndSelection = createSampleListForRaceGraph([1], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        listAndSelection.list.setFilterText("k");
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 1);
        assert.ok(typeof lastAlertMessage !== "undefined" && lastAlertMessage !== null);
        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i === 1));
        }
    });

    QUnit.test("Clicking the Crossing Runners button when a crossing team exists selects the crossing team", function (assert) {
        resetAlert();
        let listAndSelection = createSampleTeamListForRaceGraph([1]);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"), "Crossing runners button enabled");
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 0);
        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i < 2), "Selectedness for result " + i);
        }
    });

    QUnit.test("Clicking the Crossing Runners button when a runner crosses in the first leg selects the crossing team", function (assert) {
        resetAlert();
        let listAndSelection = createSampleTeamListForRaceGraph([1]);
        listAndSelection.list.selectedLegIndex = 0;
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"), "Crossing runners button enabled");
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 0);
        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i < 2), "Selectedness for result " + i);
        }
    });

    QUnit.test("Clicking the Crossing Runners button when no runner crosses in the second leg pops up an alert message", function (assert) {
        resetAlert();
        let listAndSelection = createSampleTeamListForRaceGraph([1]);
        listAndSelection.list.selectedLegIndex = 1;
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"), "Crossing runners button enabled");
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 1);
        assert.ok(lastAlertMessage !== null && lastAlertMessage.indexOf("Fourth Runner") >= 0);
        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i === 1), "Selectedness for result " + i);
        }
    });

    QUnit.test("Clicking the Crossing Runners button when no crossing team exists pops up an alert message", function (assert) {
        resetAlert();
        let listAndSelection = createSampleTeamListForRaceGraph([2]);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"), "Crossing runners button enabled");
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 1);
        assert.ok(lastAlertMessage !== null && lastAlertMessage.indexOf("Third Team") >= 0);
        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual(listAndSelection.selection.isSelected(i), (i === 2), "Selectedness for result " + i);
        }
    });

    QUnit.test("Filtering by a string contained in one result only matches only that result", function (assert) {
        let listAndSelection = createSampleList([], false);

        listAndSelection.list.setFilterText("First");

        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual($(`div#qunit-fixture div.result:eq(${i})`).is(":visible"), (i === 0), "Only the first result should be visible");
        }
    });

    QUnit.test("Filtering by a string contained in one result but not matching case only matches only that result", function (assert) {
        let listAndSelection = createSampleList([], false);

        listAndSelection.list.setFilterText("fiRst");

        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual($(`div#qunit-fixture div.result:eq(${i})`).is(":visible"), (i === 0), "Only the first result should be visible");
        }
    });

    QUnit.test("Filtering by a string contained in one result with apostrophe in name but not in search string matches only that result", function (assert) {
        let listAndSelection = createSampleList([], false);

        listAndSelection.list.setFilterText("ORunner");

        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual($(`div#qunit-fixture div.result:eq(${i})`).is(":visible"), (i === 1), "Only the second result should be visible");
        }
    });

    QUnit.test("Filtering by a string contained in two results matches both of those results", function (assert) {
        let listAndSelection = createSampleList([], false);

        listAndSelection.list.setFilterText("son");

        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual($(`div#qunit-fixture div.result:eq(${i})`).is(":visible"), (i === 0 || i === 2), "Only the first and third results should be visible: this is result " + i);
        }
    });

    QUnit.test("Filtering by a string contained in no results matches no results", function (assert) {
        let listAndSelection = createSampleList([], false);

        listAndSelection.list.setFilterText("xxxxxx");

        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual($(`div#qunit-fixture div.result:eq(${i})`).is(":visible"), false, "No results should be visible");
        }
    });

    QUnit.test("Filtering by an empty string matches all results", function (assert) {
        let listAndSelection = createSampleList([], false);

        listAndSelection.list.setFilterText("");

        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual($(`div#qunit-fixture div.result:eq(${i})`).is(":visible"), true, "No results should be visible");
        }
    });

    QUnit.test("Filtering is updated when the list of results is changed", function (assert) {
        let listAndSelection = createSampleList([], false);

        listAndSelection.list.setFilterText("son");

        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual($(`div#qunit-fixture div.result:eq(${i})`).is(":visible"), (i !== 1), "The first and third results should be visible");
        }

        let newResults = [
            fromSplitTimes(1, "Fourth Runner", "CDO", 10 * 3600, [13, 96, 35]),
            fromSplitTimes(2, "Fifth Runnerson", "GHO", 10 * 3600 + 6, [15, 79, 41]),
            fromSplitTimes(3, "Sixth O'Runner", "KLO", 10 * 3600 + 33, [18, 81, 37])
        ];

        listAndSelection.list.setResultList(newResults, false, false, null);
        listAndSelection.list.setSelection(new ResultSelection(newResults.length));

        for (let i = 0; i < 3; i += 1) {
            assert.strictEqual($(`div#qunit-fixture div.result:eq(${i})`).is(":visible"), (i === 1), "Only the second result should be visible");
        }
    });

    QUnit.test("Can register handler and have it called when filter text changes", function (assert) {
        reset();
        let listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.setFilterText("son");
        assert.strictEqual(callCount, 1, "Handler should have been called once");
    });

    QUnit.test("Can register handler and have it called multiple times when filter text changed multiple times", function (assert) {
        reset();
        let listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.setFilterText("son");
        listAndSelection.list.setFilterText("fif");
        assert.strictEqual(callCount, 2, "Handler should have been called twice");
    });

    QUnit.test("Can register multiple handlers and have them all called when result selection toggled", function (assert) {
        reset();
        let listAndSelection = createSampleListWithChangeHandler([], false);

        let callCount2 = 0;
        let handler2 = () => callCount2 += 1;

        listAndSelection.list.registerChangeHandler(handler2);

        listAndSelection.list.setFilterText("son");

        assert.strictEqual(callCount, 1, "Handler should only have been called once");
        assert.strictEqual(callCount2, 1, "Handler should only have been called once");
    });

    QUnit.test("Handler only called once even if registered miltiple times", function (assert) {
        reset();
        let listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.registerChangeHandler(testHandler);
        listAndSelection.list.setFilterText("son");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");
    });

    QUnit.test("Can deregister previously-registered handler", function (assert) {
        reset();
        let listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.setFilterText("son");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");

        listAndSelection.list.deregisterChangeHandler(testHandler);
        listAndSelection.list.setFilterText("fif");
        assert.strictEqual(callCount, 1, "Handler should still only have been called once");
    });

    QUnit.test("Can deregister previously-registered handler multiple times without error", function (assert) {
        reset();
        let listAndSelection = createSampleListWithChangeHandler([], false);
        listAndSelection.list.setFilterText("son");
        assert.strictEqual(callCount, 1, "Handler should only have been called once");

        listAndSelection.list.deregisterChangeHandler(testHandler);
        listAndSelection.list.deregisterChangeHandler(testHandler);
        listAndSelection.list.setFilterText("fif");
        assert.strictEqual(callCount, 1, "Handler should still only have been called once");
    });

    QUnit.test("Can deregister handler that was never registered without error", function (assert) {
        reset();
        let listAndSelection = createSampleListWithChangeHandler([], false);
        let someOtherHandler = () => { /* do nothing */ };
        listAndSelection.list.deregisterChangeHandler(someOtherHandler);
        assert.expect(0); // No assertions here, but there should also have been no errors.
    });
})();
