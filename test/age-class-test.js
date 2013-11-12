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
    
    QUnit.test("Can return fastest split for a control", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test class name", 3, [competitor1, competitor2]);
        var fastestSplitComp = ageClass.getFastestSplitTo(3);
        assert.deepEqual(fastestSplitComp, {name: competitor2.name, split: 184});
    });
    
    QUnit.test("Can return fastest split for the finish control", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test class name", 3, [competitor1, competitor2]);
        var fastestSplitComp = ageClass.getFastestSplitTo(4);
        assert.deepEqual(fastestSplitComp, {name: competitor2.name, split: 100});
    });
    
    QUnit.test("Can return fastest split for a control ignoring null times", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
        var ageClass = new AgeClass("Test class name", 3, [competitor1, competitor2]);
        var fastestSplitComp = ageClass.getFastestSplitTo(3);
        assert.deepEqual(fastestSplitComp, {name: competitor1.name, split: 212});
    });
    
    QUnit.test("Returns null fastest split for a control that all competitors mispunched", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, null, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
        var ageClass = new AgeClass("Test class name", 3, [competitor1, competitor2]);
        var fastestSplitComp = ageClass.getFastestSplitTo(3);
        assert.strictEqual(fastestSplitComp, null);
    });
    
    QUnit.test("Returns null fastest split for a control in empty age class", function (assert) {
        var ageClass = new AgeClass("Test class name", 3, []);
        var fastestSplitComp = ageClass.getFastestSplitTo(3);
        assert.strictEqual(fastestSplitComp, null);
    });
    
    QUnit.test("Cannot return fastest split to control 0", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test class name", 3, [competitor1, competitor2]);
        SplitsBrowserTest.assertInvalidData(assert, function() { ageClass.getFastestSplitTo(0); });
    });
    
    QUnit.test("Cannot return fastest split to control too large", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test class name", 3, [competitor1, competitor2]);
        SplitsBrowserTest.assertInvalidData(assert, function() { ageClass.getFastestSplitTo(5); });
    });
    
    QUnit.test("Cannot return fastest split to a non-numeric control", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test class name", 3, [competitor1, competitor2]);
        SplitsBrowserTest.assertInvalidData(assert, function() { ageClass.getFastestSplitTo("this is not a number"); });
    });
})();
