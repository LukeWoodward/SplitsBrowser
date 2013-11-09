(function () { 
    "use strict";

    var CompetitorListBox = SplitsBrowser.Controls.CompetitorListBox;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var CompetitorSelection = SplitsBrowser.Model.CompetitorSelection;

    module("Competitor listbox");

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
            fromSplitTimes(1, "A", "B", "CDO", 10 * 3600, [13, 86, 35]),
            fromSplitTimes(2, "E", "F", "GHO", 10 * 3600 + 16, [15, 79, 41]),
            fromSplitTimes(3, "I", "J", "KLO", 10 * 3600 + 33, [18, 81, 37])
        ];
        
        var selection = new CompetitorSelection(compList.length);
        selectedIndexes.forEach(function (index) { selection.toggle(index); });
        
        var listbox = new CompetitorListBox(parent);
        listbox.setCompetitorList(compList, multipleClasses);
        listbox.setSelection(selection);
        return { selection: selection, listbox: listbox };
    }

    QUnit.test("Can create a listbox for a single class with all competitors deselected and without class labels", function (assert) {

        createSampleListbox([], false);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor").size(), 3);
        assert.strictEqual(d3.selectAll("div#qunit-fixture div.competitor.selected").size(), 0);
        assert.strictEqual(d3.selectAll("div#qunit-fixture span.competitorClassLabel").size(), 0);
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
})();
