/*
 *  SplitsBrowser - CompetitorListBox tests.
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

    var CompetitorListBox = SplitsBrowser.Controls.CompetitorListBox;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var CompetitorSelection = SplitsBrowser.Model.CompetitorSelection;
    var ChartTypes = SplitsBrowser.Model.ChartTypes;

    // CSS selector for the Crossing Runners button.
    var CROSSING_RUNNERS_BUTTON_SELECTOR = "div#qunit-fixture button#selectCrossingRunners";
    
    module("Competitor listbox");

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
    
    /**
    * Creates a listbox with three options in it, and return the listbox and the
    * selection.
    * @param {Array} selectedIndexes - Indexes of selected competitors in the selection.
    * @param {boolean} multipleClasses - Whether the list of competitors is built from
    *                                    multiple classes.
    * @return 2-element object containing the selection and listbox.
    */
    function createSampleListbox(selectedIndexes, multipleClasses) {
        var parent = d3.select("div#qunit-fixture").node();
        
        var compList = [
            fromSplitTimes(1, "John Watson", "CDO", 10 * 3600, [13, 96, 35]),
            fromSplitTimes(2, "Mark O'Connor", "GHO", 10 * 3600 + 6, [15, 79, 41]),
            fromSplitTimes(3, "Keith Wilson", "KLO", 10 * 3600 + 33, [18, 81, 37])
        ];
        
        var selection = new CompetitorSelection(compList.length);
        selectedIndexes.forEach(function (index) { selection.toggle(index); });
        
        var listbox = new CompetitorListBox(parent, customAlert);
        listbox.setCompetitorList(compList, multipleClasses);
        listbox.setSelection(selection);
        return { selection: selection, listbox: listbox };
    }
    
    /**
    * Creates a listbox with three options in it, set it up on the race graph
    * and return the listbox and the selection.
    * @param {Array} selectedIndexes - Indexes of selected competitors in the selection.
    * @param {boolean} multipleClasses - Whether the list of competitors is built from
    *                                    multiple classes.
    * @return 2-element object containing the selection and listbox.
    */
    function createSampleListboxForRaceGraph(selectedIndexes, multipleClasses) {
        var listboxAndSelection = createSampleListbox(selectedIndexes, multipleClasses);
        listboxAndSelection.listbox.setChartType(ChartTypes.RaceGraph);
        listboxAndSelection.listbox.enableOrDisableCrossingRunnersButton();
        return listboxAndSelection;
    }

    QUnit.test("Can create a listbox for a single class with all competitors deselected and without class labels", function (assert) {
        createSampleListbox([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture span.competitorClassLabel").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture button").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture input[type=text]").size(), 1);
    });

    QUnit.test("Can create a listbox for multiple classes with all competitors deselected but with class labels shown", function (assert) {
        createSampleListbox([], true);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture span.competitorClassLabel").size(), 3);
    });

    QUnit.test("Can create a listbox with two of three competitors initially selected", function (assert) {
        createSampleListbox([0, 2], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 2);
    });

    QUnit.test("Can create a listbox with all competitors deselected, and then select them all", function (assert) {
        var listboxAndSelection = createSampleListbox([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        listboxAndSelection.selection.selectAll();
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
    });

    QUnit.test("Can create a listbox with all competitors selected, and then deselect them all", function (assert) {
        var listboxAndSelection = createSampleListbox([0, 1, 2], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
        listboxAndSelection.selection.selectNone();
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
    });

    QUnit.test("Can create a listbox, change the selection and ignore changes made to the old selection", function (assert) {
        var listboxAndSelection = createSampleListbox([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        
        var newSelection = new CompetitorSelection(3);
        listboxAndSelection.listbox.setSelection(newSelection);
        
        var oldSelection = listboxAndSelection.selection;
        oldSelection.selectAll();
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
    });

    QUnit.test("Can create a listbox with all competitors deselected, and click to select one of them", function (assert) {
        var listboxAndSelection = createSampleListbox([], false);
        
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        
        $($("div#qunit-fixture div.competitor")[1]).click();
        
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 1);
        assert.ok(listboxAndSelection.selection.isSelected(1));
    });

    QUnit.test("Can create a listbox with all competitors selected, and click to deselect one of them", function (assert) {

        var listboxAndSelection = createSampleListbox([0, 1, 2], false);

        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
        
        $($("div#qunit-fixture div.competitor")[2]).click();
        
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 2);
        assert.ok(!listboxAndSelection.selection.isSelected(2));
    });
    
    QUnit.test("Can create a listbox with all competitors deselected, and click 'Select All' to select all of them", function (assert) {
        var listboxAndSelection = createSampleListbox([], false);
        
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        
        $("div#qunit-fixture button#selectAllCompetitors").click();
        
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
        for (var i = 0; i < 3; i += 1) {
            assert.ok(listboxAndSelection.selection.isSelected(i));
        }
    });
    
    QUnit.test("Can create a listbox with all competitors selected, and click 'Select None' to select none of them", function (assert) {
        var listboxAndSelection = createSampleListbox([0, 1, 2], false);
        
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
        
        $("div#qunit-fixture button#selectNoCompetitors").click();
        
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        for (var i = 0; i < 3; i += 1) {
            assert.ok(!listboxAndSelection.selection.isSelected(i));
        }
    });
    
    QUnit.test("Cannot view the Crossing Runners button if not showing the race graph", function (assert) {
        var listboxAndSelection = createSampleListbox([], false);
        listboxAndSelection.listbox.setChartType(ChartTypes.SplitsGraph);
        assert.strictEqual($(CROSSING_RUNNERS_BUTTON_SELECTOR).size(), 1);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":visible"));
    });
    
    QUnit.test("Can view the Crossing Runners button if showing the race graph", function (assert) {
        createSampleListboxForRaceGraph([], false);
        assert.ok($(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":visible"));
    });
    
    QUnit.test("Crossing Runners button is not enabled if no competitors are selected", function (assert) {
        createSampleListboxForRaceGraph([], false);
        assert.ok($(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
    });
    
    QUnit.test("Crossing Runners button is not enabled if two competitors are selected", function (assert) {
        createSampleListboxForRaceGraph([1, 2], false);
        assert.ok($(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
    });
    
    QUnit.test("Crossing Runners button is enabled if one competitor is selected", function (assert) {
        createSampleListboxForRaceGraph([1], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        resetAlert();
    });
    
    QUnit.test("Clicking the Crossing Runners button when a crossing runner exists selects the crossing runner", function (assert) {
        resetAlert();
        var listboxAndSelection = createSampleListboxForRaceGraph([1], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 0);
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual(listboxAndSelection.selection.isSelected(i), (i < 2));
        }
    });
    
    QUnit.test("Clicking the Crossing Runners button when no crossing runner exists pops up an alert message", function (assert) {
        resetAlert();
        var listboxAndSelection = createSampleListboxForRaceGraph([2], false);
        assert.ok(!$(CROSSING_RUNNERS_BUTTON_SELECTOR).is(":disabled"));
        $(CROSSING_RUNNERS_BUTTON_SELECTOR).click();
        assert.strictEqual(alertCount, 1);
        assert.ok(typeof lastAlertMessage !== "undefined" && lastAlertMessage !== null);
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual(listboxAndSelection.selection.isSelected(i), (i === 2), "Wrong selectedness for competitor " + i);
        }
    });

    QUnit.test("Filtering by a string contained in one competitor only matches only that competitor", function (assert) {
        var listboxAndSelection = createSampleListboxForRaceGraph([], false);
            
        $("div#qunit-fixture input:text").val("John");
        listboxAndSelection.listbox.onFilterKeyUp();
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i === 0), "Only the first competitor should be visible");
        }
    });

    QUnit.test("Filtering by a string contained in one competitor but not matching case only matches only that competitor", function (assert) {
        var listboxAndSelection = createSampleListboxForRaceGraph([], false);
            
        $("div#qunit-fixture input:text").val("joHn");
        listboxAndSelection.listbox.onFilterKeyUp();
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i === 0), "Only the first competitor should be visible");
        }
    });

    QUnit.test("Filtering by a string contained in one competitor with apostrophe in name but not in search string matches only that competitor", function (assert) {
        var listboxAndSelection = createSampleListboxForRaceGraph([], false);
            
        $("div#qunit-fixture input:text").val("OConnor");
        listboxAndSelection.listbox.onFilterKeyUp();
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i === 1), "Only the second competitor should be visible");
        }
    });

    QUnit.test("Filtering by a string contained in two competitors matches both of those competitors", function (assert) {
        var listboxAndSelection = createSampleListboxForRaceGraph([], false);
            
        $("div#qunit-fixture input:text").val("son");
        listboxAndSelection.listbox.onFilterKeyUp();
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), (i === 0 || i === 2), "Only the first and third competitors should be visible: this is competitor " + i);
        }
    });

    QUnit.test("Filtering by a string contained in no competitors matches no competitors", function (assert) {
        var listboxAndSelection = createSampleListboxForRaceGraph([], false);
            
        $("div#qunit-fixture input:text").val("xxxxxx");
        listboxAndSelection.listbox.onFilterKeyUp();
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), false, "No competitors should be visible");
        }
    });

    QUnit.test("Filtering by an empty string matches allo competitors", function (assert) {
        var listboxAndSelection = createSampleListboxForRaceGraph([], false);
            
        $("div#qunit-fixture input:text").val("");
        listboxAndSelection.listbox.onFilterKeyUp();
        
        for (var i = 0; i < 3; i += 1) {
            assert.strictEqual($("div#qunit-fixture div.competitor:eq(" + i + ")").is(":visible"), true, "No competitors should be visible");
        }
    });
    
})();
