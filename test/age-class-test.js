(function (){
    "use strict";

    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    
    module("Age-class");
    
    QUnit.test("Creating a class with competitors sets the class name in each competitor", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test class name", 3, [competitor1, competitor2]);
        assert.strictEqual(competitor1.className, ageClass.name);
        assert.strictEqual(competitor2.className, ageClass.name);
    });
})();
