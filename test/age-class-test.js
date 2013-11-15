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
    
    function getTestAgeClass() {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        return new AgeClass("Test class name", 3, [competitor1, competitor2]);
    }
    
    QUnit.test("Cannot return fastest split to control 0", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestAgeClass().getFastestSplitTo(0); });
    });
    
    QUnit.test("Cannot return fastest split to control too large", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestAgeClass().getFastestSplitTo(5); });
    });
    
    QUnit.test("Cannot return fastest split to a non-numeric control", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestAgeClass().getFastestSplitTo("this is not a number"); });
    });
    
    QUnit.test("Cannot return competitors visiting a control in an interval if the control number is not numeric", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestAgeClass().getCompetitorsAtControlInTimeRange("this is not a number", 10 * 3600, 12 * 3600); });
    });
    
    QUnit.test("Cannot return competitors visiting a control in an interval if the control number is NaN", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestAgeClass().getCompetitorsAtControlInTimeRange(NaN, 10 * 3600, 12 * 3600); });
    });
    
    QUnit.test("Cannot return competitors visiting a control in an interval if the control number is negative", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestAgeClass().getCompetitorsAtControlInTimeRange(-1, 10 * 3600, 12 * 3600); });
    });
    
    QUnit.test("Cannot return competitors visiting a control in an interval if the control number is too large", function (assert) {
        var ageClass = getTestAgeClass();
        SplitsBrowserTest.assertInvalidData(assert, function() { getTestAgeClass().getCompetitorsAtControlInTimeRange(ageClass.numControls + 2, 10 * 3600, 12 * 3600); });
    });
    
    QUnit.test("Can return competitors visiting the start in an interval including only one competitor", function (assert) {
        var ageClass = getTestAgeClass();
        var comp2 = ageClass.competitors[1];
        assert.deepEqual(ageClass.getCompetitorsAtControlInTimeRange(0, 10 * 3600 - 1, 10 * 3600 + 1), [{name: comp2.name, time: 10 * 3600}]); 
    });
    
    QUnit.test("Can return both competitors visiting the start in an interval including both competitors", function (assert) {
        assert.strictEqual(getTestAgeClass().getCompetitorsAtControlInTimeRange(0, 10 * 3600 - 1, 10 * 3600 + 30 * 60 + 1).length, 2);
    });
    
    QUnit.test("Can return one competitor visiting control 2 when time interval surrounds the time the competitor visited that control", function (assert) {
        var expectedTime = 10 * 3600 + 30 * 60 + 81 + 197;
        var ageClass = getTestAgeClass();
        var comp1 = ageClass.competitors[0];
        assert.deepEqual(ageClass.getCompetitorsAtControlInTimeRange(2, expectedTime - 1, expectedTime + 1), [{name: comp1.name, time: expectedTime}]);
    });
    
    QUnit.test("Can return one competitor visiting control 2 when time interval starts at the time the competitor visited that control", function (assert) {
        var expectedTime = 10 * 3600 + 30 * 60 + 81 + 197;
        var ageClass = getTestAgeClass();
        var comp1 = ageClass.competitors[0];
        assert.deepEqual(ageClass.getCompetitorsAtControlInTimeRange(2, expectedTime, expectedTime + 2), [{name: comp1.name, time: expectedTime}]);
    });
    
    QUnit.test("Can return one competitor visiting control 2 when time interval ends at the time the competitor visited that control", function (assert) {
        var expectedTime = 10 * 3600 + 30 * 60 + 81 + 197;
        var ageClass = getTestAgeClass();
        var comp1 = ageClass.competitors[0];
        assert.deepEqual(ageClass.getCompetitorsAtControlInTimeRange(2, expectedTime - 2, expectedTime), [{name: comp1.name, time: expectedTime}]);
    });
    
    QUnit.test("Can return empty list of competitors visiting the finish if the time interval doesn't include any of their finishing times", function (assert) {
        var ageClass = getTestAgeClass();
        assert.deepEqual(ageClass.getCompetitorsAtControlInTimeRange(4, 10 * 3600 - 2, 10 * 3600 - 1), []);
    });
    
})();
