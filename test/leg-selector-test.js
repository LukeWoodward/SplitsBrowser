/*
 *  SplitsBrowser Leg Selector tests.
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

    QUnit.module("Leg Selector");
    
    var LegSelector = SplitsBrowser.Controls.LegSelector;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var CourseClassSet = SplitsBrowser.Model.CourseClassSet;
       
    // The selected leg indexes returned.
    var legIndexes = [];
    
    var LEG_SELECTOR_ID = "legSelector";
    var LEG_SELECTOR_CONTAINER_ID = "legSelectorContainer";
    
    function testChangeHandler(legIndex) {
        legIndexes.push(legIndex);
    }
    
    function reset() {
        legIndexes = [];
    }
    
    var individualCourseClassSet = new CourseClassSet([new CourseClass("Test", 3, [])]);
    
    var teamCourseClassSet = (function () {
        var courseClass = new CourseClass("Test", 3, []);
        courseClass.setIsTeamClass([3, 3]);
        return new CourseClassSet([courseClass]);
    })();
    
    function setSelectorValue(newValue) {
        var parent = d3.select("#qunit-fixture");
        $(parent.select("select").node()).val(newValue).change();
    }
    
    QUnit.test("Can create selector", function (assert) {
        var parent = d3.select("#qunit-fixture");
        new LegSelector(parent);
        
        assert.strictEqual(parent.select("select").size(), 1);
        assert.strictEqual(parent.select("#" + LEG_SELECTOR_ID).size(), 1);
    });
    
    QUnit.test("Selector is initially invisible", function (assert) {
        var parent = d3.select("#qunit-fixture");
        new LegSelector(parent);
        assert.strictEqual($("#" + LEG_SELECTOR_CONTAINER_ID, $("#qunit-fixture")).is(":visible"), false);
        assert.strictEqual($("#" + LEG_SELECTOR_ID, $("#qunit-fixture")).is(":visible"), false);
    });
    
    QUnit.test("Selector remains invisible for individual course-class set", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(individualCourseClassSet);
        
        assert.strictEqual($("#" + LEG_SELECTOR_CONTAINER_ID, $("#qunit-fixture")).is(":visible"), false);
        assert.strictEqual($("#" + LEG_SELECTOR_ID, $("#qunit-fixture")).is(":visible"), false);
    });
    
    QUnit.test("Selected leg is null for individual course-class set", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(individualCourseClassSet);
        
        assert.strictEqual(selector.getSelectedLeg(), null);
    });
    
    QUnit.test("Selector becomes visible when team class set", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        
        selector.setCourseClassSet(teamCourseClassSet);
        
        assert.strictEqual($("#" + LEG_SELECTOR_CONTAINER_ID, $("#qunit-fixture")).is(":visible"), true);
        assert.strictEqual($("#" + LEG_SELECTOR_ID, $("#qunit-fixture")).is(":visible"), true);
    });
    
    QUnit.test("Selector becomes invisible when team class set and then individual class set", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        
        selector.setCourseClassSet(teamCourseClassSet);
        
        assert.strictEqual($("#" + LEG_SELECTOR_CONTAINER_ID, $("#qunit-fixture")).is(":visible"), true);
        assert.strictEqual($("#" + LEG_SELECTOR_ID, $("#qunit-fixture")).is(":visible"), true);
        
        selector.setCourseClassSet(individualCourseClassSet);
        
        assert.strictEqual($("#" + LEG_SELECTOR_CONTAINER_ID, $("#qunit-fixture")).is(":visible"), false);
        assert.strictEqual($("#" + LEG_SELECTOR_ID, $("#qunit-fixture")).is(":visible"), false);
    });
    
    QUnit.test("Can return the selected leg when changed", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        
        selector.setCourseClassSet(teamCourseClassSet);
        
        setSelectorValue(1);
        
        assert.strictEqual(selector.getSelectedLeg(), 1);
    });
    
    QUnit.test("Can return the selected leg when changed several times", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        
        setSelectorValue(1);
        assert.strictEqual(selector.getSelectedLeg(), 1);
        
        setSelectorValue(null);
        assert.strictEqual(selector.getSelectedLeg(), null);
        
        setSelectorValue(0);
        assert.strictEqual(selector.getSelectedLeg(), 0);
        
        setSelectorValue(1);
        assert.strictEqual(selector.getSelectedLeg(), 1);
    });
    
    QUnit.test("Setting selected leg when course-class set never set does nothing", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setSelectedLeg(1);
        assert.expect(0);
    });
    
    QUnit.test("Setting selected leg for individual course-class set does nothing", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(individualCourseClassSet);
        selector.setSelectedLeg(1);
        assert.expect(0);
    });
    
    QUnit.test("Can set the selected leg to a not-null value", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        
        setSelectorValue(0);
        assert.strictEqual(selector.getSelectedLeg(), 0);
        
        selector.setSelectedLeg(1);
        assert.strictEqual(selector.getSelectedLeg(), 1);
    });

    QUnit.test("Can set the selected leg to null when something else selected", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        
        setSelectorValue(1);
        assert.strictEqual(selector.getSelectedLeg(), 1);
        
        selector.setSelectedLeg(null);
        assert.strictEqual(selector.getSelectedLeg(), null);
    });
    
    QUnit.test("Setting the selected leg to a negative value sets it to null", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        selector.setSelectedLeg(-1);
        assert.strictEqual(selector.getSelectedLeg(), null);
    });
    
    QUnit.test("Setting the selected leg to a value too large sets it to null", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        selector.setSelectedLeg(2);
        assert.strictEqual(selector.getSelectedLeg(), null);
    });
    
    QUnit.test("Calls change handler when registered", function (assert) {
        reset();
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        selector.registerChangeHandler(testChangeHandler);
        
        setSelectorValue(1);
        
        assert.deepEqual(legIndexes, [1], "Handler should have been called once");
    });
    
    QUnit.test("Calls change handler for all changes in turn", function (assert) {
        reset();
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        selector.registerChangeHandler(testChangeHandler);
        
        setSelectorValue(0);
        setSelectorValue(1);
        setSelectorValue("");
        setSelectorValue(1);
        setSelectorValue("");
        
        assert.deepEqual(legIndexes, [0, 1, null, 1, null], "Handler should have been called five times");
    });
    
    QUnit.test("Calls change handler once when registered twice", function (assert) {
        reset();
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        selector.registerChangeHandler(testChangeHandler);
        selector.registerChangeHandler(testChangeHandler);
        
        setSelectorValue(1);
        
        assert.deepEqual(legIndexes, [1], "Handler should have been called once");
    });
    
    QUnit.test("Calls multiple change handlers when unchecked and clicked", function (assert) {
        reset();
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        selector.registerChangeHandler(testChangeHandler);
        
        var legIndexes2 = [];
        selector.registerChangeHandler(function (legIndex) { legIndexes2.push(legIndex); });
        
        setSelectorValue(1);

        assert.deepEqual(legIndexes, [1], "Handler should have been called with the index set to 1");
        assert.deepEqual(legIndexes2, [1], "Second handler should have been called with the index set to 1");
    });
    
    QUnit.test("Resets leg selection when setting course class", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new LegSelector(parent);
        selector.setCourseClassSet(teamCourseClassSet);
        
        setSelectorValue(1);
        assert.strictEqual($("#" + LEG_SELECTOR_ID, $("#qunit-fixture")).val(), "1");
        
        selector.setCourseClassSet(teamCourseClassSet);
        assert.strictEqual($("#" + LEG_SELECTOR_ID, $("#qunit-fixture")).val(), "");
    });    
})();