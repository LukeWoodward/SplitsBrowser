(function () {
    "use strict";
    
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var Event = SplitsBrowser.Model.Event;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    
    module("Event");
    
    QUnit.test("Returns empty list of fastest splits to a leg if the event has no competitors", function (assert) {
        var event = new Event([], []);
        assert.deepEqual(event.getFastestSplitsForLeg("235", "212"), []);
    });
    
    QUnit.test("Returns fastest split to a leg if the event has a single class with competitors on that leg", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test class", 3, [competitor1, competitor2]);
        var course = new Course("Test course", [ageClass], null, null, ["235", "212", "189"]);
    
        var event = new Event([ageClass], [course]);
        assert.deepEqual(event.getFastestSplitsForLeg("212", "189"), [{name: competitor2.name, className: ageClass.name, split: 184}]);
    });
    
    QUnit.test("Returns empty list of fastest splits to a leg if the event has a single course with competitors not on that leg", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test class", 3, [competitor1, competitor2]);
        var course = new Course("Test course", [ageClass], null, null, ["235", "212", "189"]);
    
        var event = new Event([ageClass], [course]);
        assert.deepEqual(event.getFastestSplitsForLeg("235", "189"), []);
    });
    
    QUnit.test("Returns list of fastest splits to a leg if the event has two courses with competitors in each on that leg, sorted into split order", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 143, 100]);
        var ageClass1 = new AgeClass("Test class 1", 3, [competitor1]);
        var ageClass2 = new AgeClass("Test class 2", 4, [competitor2]);
        var course1 = new Course("Test course 1", [ageClass1], null, null, ["235", "212", "189"]);
        var course2 = new Course("Test course 2", [ageClass2], null, null, ["226", "212", "189", "211"]);
    
        var event = new Event([ageClass1, ageClass2], [course1, course2]);
        assert.deepEqual(event.getFastestSplitsForLeg("212", "189"), [{name: competitor2.name, className: ageClass2.name, split: 184}, {name: competitor1.name, className: ageClass1.name, split: 212}]);
    });
    
    QUnit.test("Returns empty list of competitors visiting a control during an interval when the event has no courses", function (assert) {
        var event = new Event([], []);
        assert.deepEqual(event.getCompetitorsAtControlInTimeRange("212", 10 * 3600, 11 * 3600), []);
    });
    
    QUnit.test("Returns list of competitors visiting a control during an interval if the event has a single class with competitors visiting that control, with competitors sorted in order of time", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
        var ageClass = new AgeClass("Test class", 3, [competitor1, competitor2]);
        var course = new Course("Test course", [ageClass], null, null, ["235", "212", "189"]);
    
        var event = new Event([ageClass], [course]);
        var competitor1Time = 10 * 3600 + 30 * 60 + 81 + 197;
        var competitor2Time = 10 * 3600 + 65 + 221;
        assert.deepEqual(event.getCompetitorsAtControlInTimeRange("212", competitor2Time - 1, competitor1Time + 1),
                [{name: competitor2.name, className: ageClass.name, time: competitor2Time},
                 {name: competitor1.name, className: ageClass.name, time: competitor1Time}]);
    });
    
    QUnit.test("Returns list of competitors visiting a control during an interval if the event has two courses and with one class each with competitors visiting that control, with competitors sorted in order of time", function (assert) {
        var competitor1 = fromSplitTimes(1, "Fred", "Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
        var competitor2 = fromSplitTimes(2, "John", "Smith", "ABC", 10 * 3600, [65, 221, 184, 143, 100]);
        var ageClass1 = new AgeClass("Test class 1", 3, [competitor1]);
        var ageClass2 = new AgeClass("Test class 2", 4, [competitor2]);
        var course1 = new Course("Test course 1", [ageClass1], null, null, ["235", "212", "189"]);
        var course2 = new Course("Test course 2", [ageClass2], null, null, ["226", "212", "189", "211"]);
    
        var event = new Event([ageClass1, ageClass2], [course1, course2]);
        var competitor1Time = 10 * 3600 + 30 * 60 + 81 + 197;
        var competitor2Time = 10 * 3600 + 65 + 221;
        assert.deepEqual(event.getCompetitorsAtControlInTimeRange("212", competitor2Time - 1, competitor1Time + 1),
                [{name: competitor2.name, className: ageClass2.name, time: competitor2Time},
                 {name: competitor1.name, className: ageClass1.name, time: competitor1Time}]);
    });
    
})();