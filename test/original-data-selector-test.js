/*
 *  SplitsBrowser Original Data Selector tests.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    module("Original Data Selector");
    
    var OriginalDataSelector = SplitsBrowser.Controls.OriginalDataSelector;
    
    var originalDataCalled;
    
    var repairedDataCalled;
    
    function showOriginalData() {
        originalDataCalled = true;
    }
    
    function showRepairedData() {
        repairedDataCalled = true;
    }
    
    QUnit.test("Can create selector with checkbox", function (assert) {
        var parent = d3.select("#qunit-fixture");
        new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        
        assert.strictEqual(parent.select("input[type=checkbox]").size(), 1);
    });
    
    QUnit.test("Calls show-original-data function when unchecked and clicked", function (assert) {
        var parent = d3.select("#qunit-fixture");
        new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        
        originalDataCalled = false;
        repairedDataCalled = false;
        $(parent.select("input[type=checkbox]").node()).attr("checked", false).trigger("click");
        assert.strictEqual(originalDataCalled, true, "showOriginalData should have been called");
        assert.strictEqual(repairedDataCalled, false, "showRepairedData should not have been called");
    });
    
    QUnit.test("Calls show-repaired-data function when checked and clicked", function (assert) {
        var parent = d3.select("#qunit-fixture");
        new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        
        originalDataCalled = false;
        repairedDataCalled = false;
        $(parent.select("input[type=checkbox]").node()).attr("checked", true).trigger("click");
        assert.strictEqual(originalDataCalled, false, "showOriginalData should not have been called");
        assert.strictEqual(repairedDataCalled, true, "showRepairedData should have been called");
    });
    
    QUnit.test("Does nothing when disabled and clicked", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        selector.setEnabled(false);
        
        originalDataCalled = false;
        repairedDataCalled = false;
        $(parent.select("input[type=checkbox]").node()).attr("checked", true).trigger("click");
        assert.strictEqual(originalDataCalled, false, "showOriginalData should not have been called");
        assert.strictEqual(repairedDataCalled, false, "showRepairedData should not have been called");
    });
    
    QUnit.test("When selector is hidden, checkbox is no longer visible", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        selector.setVisible(false);
        assert.ok(!$("input[type=checkbox]", parent.node()).is(":visible"), "Selector should not be visible when set to not be visible");
    });
    
    QUnit.test("When selector is hidden and shown, checkbox is visible once again", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        selector.setVisible(false);
        selector.setVisible(true);
        assert.ok($("input[type=checkbox]", parent.node()).is(":visible"), "Selector should be visible when set to be visible");
    });
    
    QUnit.test("Calling selectOriginalData selects original data", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        selector.setVisible(true);
        originalDataCalled = false;
        repairedDataCalled = false;
        selector.selectOriginalData();
        assert.ok(originalDataCalled, "showOriginalData should have been called");
        assert.ok(!repairedDataCalled, "showRepairedData should not have been called");
        assert.ok($("input[type=checkbox]", parent.node()).is(":checked"), "Selector should be checked");
    });    
})();