/* global QUnit, module, d3 */
/* global SplitsBrowser */

(function () {
    "use strict";
    
    module("Chart popup");
        
    var Popup = SplitsBrowser.Controls.ChartPopup;
        
    QUnit.test("Can create a popup without it initially being hidden", function (assert) { 
        var popup = new Popup(d3.select("#qunit-fixture").node(), {});
        
        assert.ok(!popup.isShown(), "Popup should initially be hidden");
    });
        
    QUnit.test("Can create a popup, show it and then hide it", function (assert) { 
        var popup = new Popup(d3.select("#qunit-fixture").node(), {});
        
        popup.show(0, 0);
        assert.ok(popup.isShown(), "Popup should be shown");
        
        popup.hide();
        assert.ok(!popup.isShown(), "Popup should be hidden again");
    });
}());