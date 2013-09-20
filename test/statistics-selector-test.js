/* global d3, $ */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function () {
    "use strict";

    var Selector = SplitsBrowser.Controls.StatisticsSelector;

    module("Statistics selector");

    var lastVisibleStats = null;
    var callCount = 0;

    var testChangeHandler = function (visibleStats) {
        lastVisibleStats = visibleStats;
        callCount += 1;
    };

    var reset = function () {
        lastVisibleStats = null;
        callCount = 0;
    };

    QUnit.test("All statistics disabled by default", function (assert) {
        var selector = new Selector(d3.select("#qunit-fixture").node());
        assert.deepEqual(selector.getVisibleStatistics(), [false, false, false]);
    });

    QUnit.test("Can register change handler and have it called", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        
        selector.registerChangeHandler(testChangeHandler);
        
        var checkboxes = $("#qunit-fixture input");
        $(checkboxes[0]).prop("checked", true).change();
        assert.deepEqual(lastVisibleStats, [true, false, false]);
        assert.equal(1, callCount);
    });

    QUnit.test("Can register change handler twice and have it called only once", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        
        selector.registerChangeHandler(testChangeHandler);
        selector.registerChangeHandler(testChangeHandler);
        
        var checkboxes = $("#qunit-fixture input");
        $(checkboxes[1]).prop("checked", true).change();
        
        assert.deepEqual(lastVisibleStats, [false, true, false]);
        assert.equal(1, callCount);
    });

    QUnit.test("Can register two change handlers and have them both called", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        
        var lastVisibleStats2 = null;
        var callCount2 = 0;
        var secondHandler = function (visibleStats) {
            lastVisibleStats2 = visibleStats;
            callCount2 += 1;
        };
        
        selector.registerChangeHandler(testChangeHandler);
        selector.registerChangeHandler(secondHandler);
        
        
        var checkboxes = $("#qunit-fixture input");
        $(checkboxes[2]).prop("checked", true).change();
        
        assert.deepEqual(lastVisibleStats, [false, false, true]);
        assert.equal(1, callCount);
        assert.deepEqual(lastVisibleStats2, [false, false, true]);
        assert.equal(1, callCount2); 
    });

    QUnit.test("Can deregister change handler and have it no longer called", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        
        selector.registerChangeHandler(testChangeHandler);
        
        var checkboxes = $("#qunit-fixture input");
        $(checkboxes[0]).prop("checked", true).change();
        assert.deepEqual(lastVisibleStats, [true, false, false]);
        assert.equal(1, callCount);
        
        selector.deregisterChangeHandler(testChangeHandler);
        $(checkboxes[2]).prop("checked", true).change();
        assert.deepEqual(lastVisibleStats, [true, false, false]);
        assert.equal(1, callCount);
    });

    QUnit.test("Can deregister change handler that was never registered without error", function (assert) {
        reset();
        var selector = new Selector(d3.select("#qunit-fixture").node());
        
        selector.deregisterChangeHandler(testChangeHandler);
        
        expect(0); // Tell QUnit to expect no assertions.
    });
})();