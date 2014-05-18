/*
 *  SplitsBrowser - Query-string tests
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
    
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    var ChartTypes = SplitsBrowser.Model.ChartTypes;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    
    var parseQueryString = SplitsBrowser.parseQueryString;
    
    var VALID_SPLIT_TIMES = [177, 99, 211, 121];
    
    var INVALID_SPLIT_TIMES = [null, null, null, null];
    
    /**
    * Fabricates an Event object from the data given.
    * @param {Object} courseData - The data to create an Event using.
    * @return The fabricated Event.
    */
    function makeEvent(courseData) {
        var courses = [];
        var allClasses = [];
        courseData.forEach(function (course) {
            var courseClasses = [];
            course.classes.forEach(function (ageClass) {
                var classCompetitors = (ageClass.competitors || []).map(function (competitor, index) {
                    return fromSplitTimes(index + 1, competitor.name, "club", null, (competitor.invalid) ? INVALID_SPLIT_TIMES : VALID_SPLIT_TIMES);
                });
                
                var createdClass = new AgeClass(ageClass.name, 3, classCompetitors);
                courseClasses.push(createdClass);
                allClasses.push(createdClass);
            });
            
            var createdCourse = new Course(course.name, courseClasses, null, null, null);
            courseClasses.forEach(function (ageClass) { ageClass.setCourse(createdCourse); });
            courses.push(createdCourse);
        });
    
        return new Event(allClasses, courses);
    }
    
    module("Query-string");
    
    QUnit.test("Parsing an empty string should return all-null values", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test class 1"}]}]);
        assert.deepEqual(parseQueryString("", eventData),
                         {classes: null, view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing a single class should return only that class", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);    
        assert.deepEqual(parseQueryString("class=TestClass1", eventData),
                         {classes: [0], view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing a single unrecognised class should return null", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);    
        assert.deepEqual(parseQueryString("class=Unrecognised", eventData),
                         {classes: null, view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing a single recognised class and a single unrecognised class should return only the recognised class", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);    
        assert.deepEqual(parseQueryString("class=Unrecognised;TestClass1", eventData),
                         {classes: [0], view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing a single class that needs URL-encoding should return only that class", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class %^$ 1"}]}]); 
        assert.deepEqual(parseQueryString("class=Test%20Class%20%25%5e%24%201", eventData),
                         {classes: [0], view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing multiple classes should return only those classes", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}, {name: "TestClass2"}, {name: "TestClass3"}]}]);    
        assert.deepEqual(parseQueryString("class=TestClass1;TestClass2;TestClass3", eventData),
                         {classes: [0, 1, 2], view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing a single class repeated should return that class only once", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}, {name: "TestClass2"}]}]);    
        assert.deepEqual(parseQueryString("class=TestClass2;TestClass2", eventData),
                         {classes: [1], view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing multiple classes in multiple courses should return only those on the same course as the first", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}, {name: "TestClass2"}]}, {name: "Course2", classes:[{name: "TestClass3"}, {name: "TestClass4"}]}]);    
        assert.deepEqual(parseQueryString("class=TestClass1;TestClass4;TestClass2;TestClass3", eventData),
                         {classes: [0, 1], view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the splits-graph chart type should return the splits-graph chart type", function (assert) {
        assert.deepEqual(parseQueryString("view=SplitsGraph"),
                         {classes: null, view: ChartTypes.SplitsGraph, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the race-graph chart type should return the race-graph chart type", function (assert) {
        assert.deepEqual(parseQueryString("view=RaceGraph"),
                         {classes: null, view: ChartTypes.RaceGraph, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the position-after-leg chart type should return the position-after-leg chart type", function (assert) {
        assert.deepEqual(parseQueryString("view=PositionAfterLeg"),
                         {classes: null, view: ChartTypes.PositionAfterLeg, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the split-position chart type should return the split-position chart type", function (assert) {
        assert.deepEqual(parseQueryString("view=SplitPosition"),
                         {classes: null, view: ChartTypes.SplitPosition, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the percent-behind chart type should return the percent-behind chart type", function (assert) {
        assert.deepEqual(parseQueryString("view=PercentBehind"),
                         {classes: null, view: ChartTypes.PercentBehind, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the results-table chart type should return the results-table chart type", function (assert) {
        assert.deepEqual(parseQueryString("view=ResultsTable"),
                         {classes: null, view: ChartTypes.ResultsTable, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing an unrecognised chart type should return null", function (assert) {
        assert.deepEqual(parseQueryString("view=UnrecognisedChartType"),
                         {classes: null, view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the winner comparison type returns that comparison type if a class is selected and the class has a winner", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&compareWith=Winner", eventData),
                         {classes: [0], view: null, compareWith: {index: 0, runner: null}, selected: null});
    });
    
    QUnit.test("Parsing a string containing the winner comparison type returns null if no classes are specified", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("compareWith=Winner", eventData),
                         {classes: null, view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the winner comparison type when the selected class has no winner returns null", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith", invalid: true}]}]}]);
        assert.deepEqual(parseQueryString("compareWith=Winner", eventData),
                         {classes: null, view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the fastest-time comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTime", eventData),
                         {classes: null, view: null, compareWith: {index: 1, runner: null}, selected: null});
    });
    
    QUnit.test("Parsing a string containing the fastest-time-plus-5% comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTimePlus5", eventData),
                         {classes: null, view: null, compareWith: {index: 2, runner: null}, selected: null});
    });
    
    QUnit.test("Parsing a string containing the fastest-time-plus-25% comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTimePlus25", eventData),
                         {classes: null, view: null, compareWith: {index: 3, runner: null}, selected: null});
    });
    
    QUnit.test("Parsing a string containing the fastest-time-plus-50% comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTimePlus50", eventData),
                         {classes: null, view: null, compareWith: {index: 4, runner: null}, selected: null});
    });
    
    QUnit.test("Parsing a string containing the fastest-time-plus-100% comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTimePlus100", eventData),
                         {classes: null, view: null, compareWith: {index: 5, runner: null}, selected: null});
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns that comparison type if the runner is recognised", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&compareWith=John%20Smith", eventData),
                         {classes: [0], view: null, compareWith: {index: 6, runner: eventData.classes[0].competitors[0]}, selected: null});
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns that comparison type if the runner is recognised in the second of two classes", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}, {name: "TestClass2", competitors: [{name: "Fred Jones"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1;TestClass2&compareWith=Fred%20Jones", eventData),
                         {classes: [0, 1], view: null, compareWith: {index: 6, runner: eventData.classes[1].competitors[0]}, selected: null});
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns null if the runner is recognised but no classes are selected", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("compareWith=John%20Smith", eventData),
                         {classes: null, view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns null if the runner is unrecognised", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("compareWith=WrongName", eventData),
                         {classes: null, view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns null if the runner does not finish", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith", invalid: true}]}]}]);
        assert.deepEqual(parseQueryString("compareWith=John%20Smith", eventData),
                         {classes: null, view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string with a single competitor selected returns that competitor as selected", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=John%20Smith", eventData),
                         {classes: [0], view: null, compareWith: null, selected: [0]});
    });
    
    QUnit.test("Parsing a string with an unrecognised competitor name returns no selected competitors", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=Unrecognised%20Person", eventData),
                         {classes: [0], view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string with a valid selected competitor name but no selected classes returns no selected competitors", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("selected=John%20Smith", eventData),
                         {classes: null, view: null, compareWith: null, selected: null});
    });
    
    QUnit.test("Parsing a string with two competitors selected returns those competitors as selected", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=John%20Smith;Alan%20Berry", eventData),
                         {classes:[0], view: null, compareWith: null, selected: [0, 2]});
    });
    
    QUnit.test("Parsing a string with a single competitor selected twice returns that competitor as selected once", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=John%20Smith;John%20Smith", eventData),
                         {classes: [0], view: null, compareWith: null, selected: [0]});
    });
    
    QUnit.test("Parsing a string with an asterisk in the selected string selects all competitors", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=*", eventData),
                         {classes:[0], view: null, compareWith: null, selected: [0, 1, 2]});
    });
    
    QUnit.test("Parsing a string with an asterisk in the selected string and other names selects all competitors", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=Fred%20Jones;*;John%20Smith", eventData),
                         {classes: [0], view: null, compareWith: null, selected: [0, 1, 2]});
    });
    
    QUnit.test("Can parse a query string containing values for all four arguments", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var ageClass = eventData.classes[0];
        assert.deepEqual(parseQueryString("class=TestClass1&view=PositionAfterLeg&compareWith=Alan%20Berry&selected=Fred%20Jones;John%20Smith", eventData),
                         {classes: [0], view: ChartTypes.PositionAfterLeg, compareWith: {index: 6, runner: ageClass.competitors[2]}, selected: [0, 1]});
    });
    
}());