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
    
    var originalDataCalls;
    
    var repairedDataCalls;
    
    function showOriginalData() {
        originalDataCalls = true;
    }
    
    function showRepairedData() {
        repairedDataCalls = true;
    }
    
    QUnit.test("Can create selector with checkbox", function (assert) {
        var parent = d3.select("#qunit-fixture");
        new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        
        assert.strictEqual(parent.select("input[type=checkbox]").size(), 1);
    });
    
    QUnit.test("Calls show-original-data function when unchecked and clicked", function (assert) {
        var parent = d3.select("#qunit-fixture");
        new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        
        originalDataCalls = false;
        repairedDataCalls = false;
        $(parent.select("input[type=checkbox]").node()).attr("checked", false).trigger("click");
        assert.strictEqual(originalDataCalls, true, "showOriginalData should have been called");
        assert.strictEqual(repairedDataCalls, false, "showRepairedData should not have been called");
    });
    
    QUnit.test("Calls show-repaired-data function when checked and clicked", function (assert) {
        var parent = d3.select("#qunit-fixture");
        new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        
        originalDataCalls = false;
        repairedDataCalls = false;
        $(parent.select("input[type=checkbox]").node()).attr("checked", true).trigger("click");
        assert.strictEqual(originalDataCalls, false, "showOriginalData should not have been called");
        assert.strictEqual(repairedDataCalls, true, "showRepairedData should have been called");
    });
    
    QUnit.test("Does nothing when disabled and clicked", function (assert) {
        var parent = d3.select("#qunit-fixture");
        var selector = new OriginalDataSelector(parent, showOriginalData, showRepairedData);
        selector.setEnabled(false);
        
        originalDataCalls = false;
        repairedDataCalls = false;
        $(parent.select("input[type=checkbox]").node()).attr("checked", true).trigger("click");
        assert.strictEqual(originalDataCalls, false, "showOriginalData should not have been called");
        assert.strictEqual(repairedDataCalls, false, "showRepairedData should not have been called");
    });
    
})();