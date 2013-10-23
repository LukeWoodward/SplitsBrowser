/* global d3, $ */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function (){
    "use strict";

    var ChartTypeSelector = SplitsBrowser.Controls.ChartTypeSelector;

    module("Chart Type Selector");

    var lastChartTypeName = null;
    var callCount = 0;

    function resetLastChartType() {
        lastChartTypeName = null;
        callCount = 0;
    }

    function handleChartTypeChanged(chartType) {
        lastChartTypeName = chartType.name;
        callCount += 1;
    }

    QUnit.test("Can construct the selector", function(assert) {
        var selector = new ChartTypeSelector(d3.select("#qunit-fixture").node());
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.ok(htmlSelect.options.length > 4, "At least four items should be created");
    });

    QUnit.test("Registering a handler and changing a value in the selector triggers a call to change callback", function(assert) {
        resetLastChartType();
        var selector = new ChartTypeSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleChartTypeChanged);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();
        $(htmlSelect).val(3).change();
        
        assert.equal(lastChartTypeName, "Split position", "The fourth chart type should have been selected");
        assert.equal(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Registering two handlers and changing a value in the selector triggers a call to both callbacks", function(assert) {
        resetLastChartType();
        
        var lastChartTypeName2 = null;
        var callCount2 = null;
        var secondHandler = function (chartType) {
            lastChartTypeName2 = chartType.name;
            callCount2 += 1;
        };
        
        var selector = new ChartTypeSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleChartTypeChanged);
        selector.registerChangeHandler(secondHandler);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();
        $(htmlSelect).val(3).change();
        
        assert.equal(lastChartTypeName, "Split position", "The fourth chart type should have been selected");
        assert.equal(callCount, 1, "One change should have been recorded");
        assert.equal(lastChartTypeName2, "Split position", "The fourth chart type should have been selected");
        assert.equal(callCount2, 1, "One change should have been recorded");
    });


    QUnit.test("Registering the same handler twice and changing a value in the selector triggers only one call to change callback", function(assert) {
        resetLastChartType();
        var selector = new ChartTypeSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleChartTypeChanged);
        selector.registerChangeHandler(handleChartTypeChanged);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(3).change();
        
        assert.equal(lastChartTypeName, "Split position", "The fourth chart type should have been selected");
        assert.equal(callCount, 1, "One change should have been recorded");
    });
})();
