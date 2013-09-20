/* global d3 */
/* global QUnit, module, expect, document, $ */
/* global SplitsBrowser */

(function () { 
    "use strict";

    var CompetitorListBox = SplitsBrowser.Controls.CompetitorListBox;
    var CompetitorData = SplitsBrowser.Model.CompetitorData;
    var CompetitorSelection = SplitsBrowser.Model.CompetitorSelection;

    module("Competitor listbox");

    /**
    * Creates a listbox with three options in it, and return the listbox and the
    * selection.
    * @param {Array} selectedIndexes - Indexes of selected competitors in the selection.
    * @return 2-element object containing the selection and listbox.
    */
    function createSampleListbox(selectedIndexes) {
        var parent = d3.select("div#qunit-fixture").node();
        
        var compList = [
            new CompetitorData(1, "A", "B", "CDO", "10:00", [13, 86, 35]),
            new CompetitorData(2, "E", "F", "GHO", "10:16", [15, 79, 41]),
            new CompetitorData(3, "I", "J", "KLO", "10:33", [18, 81, 37])
        ];
        
        var selection = new CompetitorSelection(compList.length);
        selectedIndexes.forEach(function (index) { selection.toggle(index); });
        
        var listbox = new CompetitorListBox(parent);
        listbox.setCompetitorList(compList);
        listbox.setSelection(selection);
        return { selection: selection, listbox: listbox };
    }

    QUnit.test("Can create a listbox with all competitors deselected", function (assert) {

        var listboxAndSelection = createSampleListbox([]);
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
    });

    QUnit.test("Can create a listbox with two of three competitors initially selected", function (assert) {

        var listboxAndSelection = createSampleListbox([0, 2]);
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 2);
    });

    QUnit.test("Can create a listbox with all competitors deselected, and then select them all", function (assert) {

        var listboxAndSelection = createSampleListbox([]);
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        listboxAndSelection.selection.selectAll();
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
    });

    QUnit.test("Can create a listbox with all competitors selected, and then deselect them all", function (assert) {

        var listboxAndSelection = createSampleListbox([0, 1, 2]);
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
        listboxAndSelection.selection.selectNone();
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
    });

    QUnit.test("Can create a listbox, change the selection and ignore changes made to the old selection", function (assert) {

        var listboxAndSelection = createSampleListbox([]);
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        
        var newSelection = new CompetitorSelection(3);
        listboxAndSelection.listbox.setSelection(newSelection);
        
        var oldSelection = listboxAndSelection.selection;
        oldSelection.selectAll();
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
    });

    QUnit.test("Can create a listbox with all competitors deselected, and click to select one of them", function (assert) {

        var listboxAndSelection = createSampleListbox([]);
        
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        
        $($("div#qunit-fixture div.competitor")[1]).click();
        
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 1);
        assert.ok(listboxAndSelection.selection.isSelected(1));
    });

    QUnit.test("Can create a listbox with all competitors selected, and click to deselect one of them", function (assert) {

        var listboxAndSelection = createSampleListbox([0, 1, 2]);

        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 3);
        
        $($("div#qunit-fixture div.competitor")[2]).click();
        
        assert.equal(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 2);
        assert.ok(!listboxAndSelection.selection.isSelected(2));
    });
})();
