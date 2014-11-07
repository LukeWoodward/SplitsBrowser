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
    
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    var Course = SplitsBrowser.Model.Course;
    var Event = SplitsBrowser.Model.Event;
    var ChartTypes = SplitsBrowser.Model.ChartTypes;
    
    var parseQueryString = SplitsBrowser.parseQueryString;
    var formatQueryString = SplitsBrowser.formatQueryString;
    
    var fromSplitTimes = SplitsBrowserTest.fromSplitTimes;
    
    var VALID_SPLIT_TIMES = [177, 99, 211, 121];
    
    var INVALID_SPLIT_TIMES = [null, null, null, null];
    
    var TOTAL_TIME_AND_TIME_LOSS = {TotalTime: true, SplitTime: false, BehindFastest: false, TimeLoss: true};
    var NO_STATS = {TotalTime: false, SplitTime: false, BehindFastest: false, TimeLoss: false};    
    
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
            course.classes.forEach(function (courseClass) {
                var classCompetitors = (courseClass.competitors || []).map(function (competitor, index) {
                    return fromSplitTimes(index + 1, competitor.name, "club", null, (competitor.invalid) ? INVALID_SPLIT_TIMES : VALID_SPLIT_TIMES);
                });
                
                var createdClass = new CourseClass(courseClass.name, 3, classCompetitors);
                courseClasses.push(createdClass);
                allClasses.push(createdClass);
            });
            
            var createdCourse = new Course(course.name, courseClasses, null, null, null);
            courseClasses.forEach(function (courseClass) { courseClass.setCourse(createdCourse); });
            courses.push(createdCourse);
        });
    
        return new Event(allClasses, courses);
    }
    
    function defaultValue(value, defltVal) {
        return (typeof value === "undefined") ? defltVal : value;
    }
    
    /**
    * Creates and returns an expected-data object that contains default values
    * for all parameters not specified.
    * @param {Object} data - Object with some data values set.
    * @return {Object} Object with the same data values set, and with all
    *     others set to their defaults.
    */
    function makeExpectedData(data) {
        return {
            classes: defaultValue(data.classes, null),
            chartType: defaultValue(data.chartType, null),
            compareWith: defaultValue(data.compareWith, null),
            selected: defaultValue(data.selected, null),
            stats: defaultValue(data.stats, null),
            showOriginal: defaultValue(data.showOriginal, false),
            filterText: defaultValue(data.filterText, "")
        };
    }
    
    module("Query-string");
    
    QUnit.test("Parsing an empty string should return all-null values", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test class 1"}]}]);
        assert.deepEqual(parseQueryString("", eventData),
                         makeExpectedData({}));
    });
    
    QUnit.test("Parsing a string containing a single class with a question-mark prefix should return only that class", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);    
        assert.deepEqual(parseQueryString("?class=TestClass1", eventData),
                         makeExpectedData({classes: [0]}));
    });
    
    QUnit.test("Parsing a string containing a single class should return only that class", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);    
        assert.deepEqual(parseQueryString("class=TestClass1", eventData),
                         makeExpectedData({classes: [0]}));
    });
    
    QUnit.test("Parsing a string containing a single unrecognised class should return null", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);    
        assert.deepEqual(parseQueryString("class=Unrecognised", eventData),
                         makeExpectedData({classes: null}));
    });
    
    QUnit.test("Parsing a string containing a single recognised class and a single unrecognised class should return only the recognised class", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);    
        assert.deepEqual(parseQueryString("class=Unrecognised;TestClass1", eventData),
                         makeExpectedData({classes: [0]}));
    });
    
    QUnit.test("Parsing a string containing a single class that needs URL-encoding should return only that class", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class %^$ 1"}]}]); 
        assert.deepEqual(parseQueryString("class=Test%20Class%20%25%5e%24%201", eventData),
                         makeExpectedData({classes: [0]}));
    });
    
    QUnit.test("Parsing a string containing multiple classes should return only those classes", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}, {name: "TestClass2"}, {name: "TestClass3"}]}]);    
        assert.deepEqual(parseQueryString("class=TestClass1;TestClass2;TestClass3", eventData),
                         makeExpectedData({classes: [0, 1, 2]}));
    });
    
    QUnit.test("Parsing a string containing a single class repeated should return that class only once", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}, {name: "TestClass2"}]}]);    
        assert.deepEqual(parseQueryString("class=TestClass2;TestClass2", eventData),
                         makeExpectedData({classes: [1]}));
    });
    
    QUnit.test("Parsing a string containing multiple classes in multiple courses should return only those on the same course as the first", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}, {name: "TestClass2"}]}, {name: "Course2", classes:[{name: "TestClass3"}, {name: "TestClass4"}]}]);    
        assert.deepEqual(parseQueryString("class=TestClass1;TestClass4;TestClass2;TestClass3", eventData),
                         makeExpectedData({classes: [0, 1]}));
    });
    
    QUnit.test("Parsing a string containing the splits-graph chart type should return the splits-graph chart type", function (assert) {
        assert.deepEqual(parseQueryString("chartType=SplitsGraph"),
                         makeExpectedData({chartType: ChartTypes.SplitsGraph}));
    });
    
    QUnit.test("Parsing a string containing the splits-graph chart type with a leading question-mark should return the splits-graph chart type", function (assert) {
        assert.deepEqual(parseQueryString("?chartType=SplitsGraph"),
                         makeExpectedData({chartType: ChartTypes.SplitsGraph}));
    });
    
    QUnit.test("Parsing a string containing the race-graph chart type should return the race-graph chart type", function (assert) {
        assert.deepEqual(parseQueryString("chartType=RaceGraph"),
                         makeExpectedData({chartType: ChartTypes.RaceGraph}));
    });
    
    QUnit.test("Parsing a string containing the position-after-leg chart type should return the position-after-leg chart type", function (assert) {
        assert.deepEqual(parseQueryString("chartType=PositionAfterLeg"),
                         makeExpectedData({chartType: ChartTypes.PositionAfterLeg}));
    });
    
    QUnit.test("Parsing a string containing the split-position chart type should return the split-position chart type", function (assert) {
        assert.deepEqual(parseQueryString("chartType=SplitPosition"),
                         makeExpectedData({chartType: ChartTypes.SplitPosition}));
    });
    
    QUnit.test("Parsing a string containing the percent-behind chart type should return the percent-behind chart type", function (assert) {
        assert.deepEqual(parseQueryString("chartType=PercentBehind"),
                         makeExpectedData({chartType: ChartTypes.PercentBehind}));
    });
    
    QUnit.test("Parsing a string containing the results-table chart type should return the results-table chart type", function (assert) {
        assert.deepEqual(parseQueryString("chartType=ResultsTable"),
                         makeExpectedData({chartType: ChartTypes.ResultsTable}));
    });
    
    QUnit.test("Parsing a string containing an unrecognised chart type should return null", function (assert) {
        assert.deepEqual(parseQueryString("chartType=UnrecognisedChartType"),
                         makeExpectedData({chartType: null}));
    });
    
    QUnit.test("Parsing a string containing the winner comparison type returns that comparison type if a class is selected and the class has a winner", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&compareWith=Winner", eventData),
                         makeExpectedData({classes: [0], compareWith: {index: 0, runner: null}}));
    });
    
    QUnit.test("Parsing a string with a leading question mark containing the winner comparison type returns that comparison type if a class is selected and the class has a winner", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("?compareWith=Winner&class=TestClass1", eventData),
                         makeExpectedData({classes: [0], compareWith: {index: 0, runner: null}}));
    });
    
    QUnit.test("Parsing a string containing the winner comparison type returns null if no classes are specified", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("compareWith=Winner", eventData),
                         makeExpectedData({compareWith: null}));
    });
    
    QUnit.test("Parsing a string containing the winner comparison type when the selected class has no winner returns null", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith", invalid: true}]}]}]);
        assert.deepEqual(parseQueryString("compareWith=Winner", eventData),
                         makeExpectedData({compareWith: null}));
    });
    
    QUnit.test("Parsing a string containing the fastest-time comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTime", eventData),
                         makeExpectedData({compareWith: {index: 1, runner: null}}));
    });
    
    QUnit.test("Parsing a string containing the fastest-time-plus-5% comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTimePlus5", eventData),
                         makeExpectedData({compareWith: {index: 2, runner: null}}));
    });
    
    QUnit.test("Parsing a string containing the fastest-time-plus-25% comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTimePlus25", eventData),
                         makeExpectedData({compareWith: {index: 3, runner: null}}));
    });
    
    QUnit.test("Parsing a string containing the fastest-time-plus-50% comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTimePlus50", eventData),
                         makeExpectedData({compareWith: {index: 4, runner: null}}));
    });
    
    QUnit.test("Parsing a string containing the fastest-time-plus-100% comparison type returns that comparison type", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(parseQueryString("compareWith=FastestTimePlus100", eventData),
                         makeExpectedData({compareWith: {index: 5, runner: null}}));
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns that comparison type if the runner is recognised", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&compareWith=John%20Smith", eventData),
                         makeExpectedData({classes: [0], compareWith: {index: 6, runner: eventData.classes[0].competitors[0]}}));
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns that comparison type if the runner is recognised in the second of two classes", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}, {name: "TestClass2", competitors: [{name: "Fred Jones"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1;TestClass2&compareWith=Fred%20Jones", eventData),
                         makeExpectedData({classes: [0, 1], compareWith: {index: 6, runner: eventData.classes[1].competitors[0]}}));
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns null if the runner is recognised but no classes are selected", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("compareWith=John%20Smith", eventData),
                         makeExpectedData({compareWith: null}));
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns null if the runner is unrecognised", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&compareWith=WrongName", eventData),
                         makeExpectedData({classes: [0], compareWith: null}));
    });
    
    QUnit.test("Parsing a string containing the compare-against-named-runner comparison type returns null if the runner does not finish", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith", invalid: true}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&compareWith=John%20Smith", eventData),
                         makeExpectedData({classes: [0], compareWith: null}));
    });
    
    QUnit.test("Parsing a string with a single competitor selected returns that competitor as selected", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=John%20Smith", eventData),
                         makeExpectedData({classes: [0], selected: [0]}));
    });
    
    QUnit.test("Parsing a string with a leading question-mark and a single competitor selected returns that competitor as selected", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("?selected=John%20Smith&class=TestClass1", eventData),
                         makeExpectedData({classes: [0], selected: [0]}));
    });
    
    QUnit.test("Parsing a string with an unrecognised competitor name returns no selected competitors", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=Unrecognised%20Person", eventData),
                         makeExpectedData({classes: [0], selected: null}));
    });
    
    QUnit.test("Parsing a string with a valid selected competitor name but no selected classes returns no selected competitors", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("selected=John%20Smith", eventData),
                         makeExpectedData({selected: null}));
    });
    
    QUnit.test("Parsing a string with two competitors selected returns those competitors as selected", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=John%20Smith;Alan%20Berry", eventData),
                         makeExpectedData({classes:[0], selected: [0, 2]}));
    });
    
    QUnit.test("Parsing a string with a single competitor selected twice returns that competitor as selected once", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=John%20Smith;John%20Smith", eventData),
                         makeExpectedData({classes: [0], selected: [0]}));
    });
    
    QUnit.test("Parsing a string with an asterisk in the selected string selects all competitors", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=*", eventData),
                         makeExpectedData({classes:[0], selected: [0, 1, 2]}));
    });
    
    QUnit.test("Parsing a string with an asterisk in the selected string and other names selects all competitors", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        assert.deepEqual(parseQueryString("class=TestClass1&selected=Fred%20Jones;*;John%20Smith", eventData),
                         makeExpectedData({classes: [0], selected: [0, 1, 2]}));
    });
    
    QUnit.test("Can parse a query-string containing an empty list of statistics", function (assert) {
        assert.deepEqual(parseQueryString("stats="),
                         makeExpectedData({stats: NO_STATS}));
    });
    
    QUnit.test("Can parse a query-string containing a single statistic", function (assert) {
        assert.deepEqual(parseQueryString("stats=BehindFastest"),
                         makeExpectedData({stats: {TotalTime: false, SplitTime: false, BehindFastest: true, TimeLoss: false}}));
    });
    
    QUnit.test("Can parse a query-string containing a single statistic repeated", function (assert) {
        assert.deepEqual(parseQueryString("stats=BehindFastest;BehindFastest"),
                         makeExpectedData({stats: {TotalTime: false, SplitTime: false, BehindFastest: true, TimeLoss: false}}));
    });
    
    QUnit.test("Can parse a query-string containing an unrecognised statistic as null", function (assert) {
        assert.deepEqual(parseQueryString("stats=ThisIsNotRecognised"),
                         makeExpectedData({stats: null}));
    });
    
    QUnit.test("Can parse a query-string containing all four statistics", function (assert) {
        assert.deepEqual(parseQueryString("stats=TotalTime;SplitTime;BehindFastest;TimeLoss"),
                         makeExpectedData({stats: {TotalTime: true, SplitTime: true, BehindFastest: true, TimeLoss: true}}));
    });
    
    QUnit.test("Can parse a query-string containing just the show-original flag", function (assert) {
        assert.deepEqual(parseQueryString("showOriginal=1"),
                         makeExpectedData({showOriginal: true}));
    });
    
    QUnit.test("Can parse a query-string containing just the show-original flag with a value other than '1', considered to be false", function (assert) {
        assert.deepEqual(parseQueryString("showOriginal=Yes"),
                         makeExpectedData({showOriginal: false}));
    });
    
    QUnit.test("Can parse a query-string containing an empty filter-text string", function (assert) {
        assert.deepEqual(parseQueryString("filterText="),
                         makeExpectedData({filterText: ""}));
    });
    
    QUnit.test("Can parse a query-string containing a non-empty filter-text string", function (assert) {
        assert.deepEqual(parseQueryString("filterText=test"),
                         makeExpectedData({filterText: "test"}));
    });
    
    QUnit.test("Can parse a query-string containing a filter-text string that needs URL-decoding", function (assert) {
        assert.deepEqual(parseQueryString("filterText=Test%20%23%31"),
                         makeExpectedData({filterText: "Test #1"}));
    });
    
    QUnit.test("Can parse a query string containing values for all seven arguments", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var courseClass = eventData.classes[0];
        var compareWith = {index: 6, runner: courseClass.competitors[2]};
        assert.deepEqual(parseQueryString("class=TestClass1&chartType=PositionAfterLeg&compareWith=Alan%20Berry&selected=Fred%20Jones;John%20Smith&stats=TimeLoss;TotalTime&showOriginal=1&filterText=test", eventData),
                         {classes: [0], chartType: ChartTypes.PositionAfterLeg, compareWith: compareWith, selected: [0, 1], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, filterText: "test"});
    });
    
    QUnit.test("Can format an empty query-string with values for all seven arguments", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var data = {classes: [0], chartType: ChartTypes.SplitPosition, compareWith: {index: 1, runner: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, filterText: "test 1"};
        var courseClassSet = new CourseClassSet([eventData.classes[0]]);
        var queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=Fred%20Jones%3BAlan%20Berry&stats=TotalTime%3BTimeLoss&showOriginal=1&filterText=test%201");
    });
    
    QUnit.test("Can format a query-string with a value for some other parameter, adding values for all seven arguments and retaining the existing parameter", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var data = {classes: [0], chartType: ChartTypes.SplitPosition, compareWith: {index: 1, runner: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, filterText: "test"};
        var courseClassSet = new CourseClassSet([eventData.classes[0]]);
        var queryString = formatQueryString("?eventId=6789", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "?eventId=6789&class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=Fred%20Jones%3BAlan%20Berry&stats=TotalTime%3BTimeLoss&showOriginal=1&filterText=test");
    });
    
    QUnit.test("Can format a query-string that contains existing values with new values for all seven arguments", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var data = {classes: [0], chartType: ChartTypes.SplitPosition, compareWith: {index: 1, runner: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, filterText: "testNew"};
        var courseClassSet = new CourseClassSet([eventData.classes[0]]);
        var queryString = formatQueryString("class=SomeOtherClass&chartType=SomeChartType&compareWith=SomeComparison&selected=SomeCompetitors&stats=SomeStats&showOriginal=Yes&filterText=testOld", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=Fred%20Jones%3BAlan%20Berry&stats=TotalTime%3BTimeLoss&showOriginal=1&filterText=testNew");
    });
    
    QUnit.test("Can format a query-string that contains multiple existing values with new values for all seven arguments", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var data = {classes: [0], chartType: ChartTypes.SplitPosition, compareWith: {index: 1, runner: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, filterText: "test"};
        var courseClassSet = new CourseClassSet([eventData.classes[0]]);
        var queryString = formatQueryString("class=SomeOtherClass&class=YetAnotherClass&chartType=SomeChartType&compareWith=SomeComparison&compareWith=SomeOtherComparison&chartType=SomeOtherChartType" +
                                            "&selected=SomeCompetitors&stats=SomeStats&selected=SomeOtherCompetitors&stats=SomeOtherStats&showOriginal=Oui&showOriginal=Ja&filterText=testOld&filterText=testNew",
                                            eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=Fred%20Jones%3BAlan%20Berry&stats=TotalTime%3BTimeLoss&showOriginal=1&filterText=test");
    });
        
    QUnit.test("Can format a query-string that contains no selected competitors and no statistics, does not show original data and has no filter text", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var data = {classes: [0], chartType: ChartTypes.SplitPosition, compareWith: {index: 1, runner: null}, selected: [], stats: NO_STATS, showOriginal: false, filterText: ""};
        var courseClassSet = new CourseClassSet([eventData.classes[0]]);
        var queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&stats=");
    });
    
    QUnit.test("Can format a query-string that contains all selected competitors and no statistics", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var data = {classes: [0], chartType: ChartTypes.SplitPosition, compareWith: {index: 1, runner: null}, selected: [0, 1, 2], stats: NO_STATS, showOriginal: false, filterText: ""};
        var courseClassSet = new CourseClassSet([eventData.classes[0]]);
        var queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=*&stats=");
    });
    
    QUnit.test("Can format a query-string that compares against a named runner", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var courseClassSet = new CourseClassSet([eventData.classes[0]]);
        var data = {classes: [0], chartType: ChartTypes.SplitPosition, compareWith: {index: 6, runner: courseClassSet.allCompetitors[0]}, selected: [], stats: NO_STATS, showOriginal: false, filterText: ""};
        var queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=John%20Smith&stats=");
    });
    
    QUnit.test("Can format a query-string that has an unrecognised chart type and comparison", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var courseClassSet = new CourseClassSet([eventData.classes[0]]);
        var data = {classes: [0], chartType: "This is not a valid chart type", compareWith: {index: 77, runner: null}, selected: [], stats: NO_STATS, showOriginal: false, filterText: ""};
        var queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&stats=");
    });
    
    QUnit.test("Can obtain the same data by formatting and parsing a query string using a built-in comparison and original data", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}, {name: "Test Class 2"}]}]);
        var data = {classes: [0, 1], chartType: ChartTypes.SplitPosition, compareWith: {index: 1, runner: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, filterText: "test"};
        var courseClassSet = new CourseClassSet(eventData.classes.slice(0));
        var queryString = formatQueryString("", eventData, courseClassSet, data);
        var parsedData = parseQueryString(queryString, eventData);
        assert.deepEqual(parsedData, data, "Should have read the same data back after formatting a query string.  Query string: " + queryString);
    });

    QUnit.test("Can obtain the same data by formatting and parsing a query string comparing against a runner and not showing original data", function (assert) {
        var eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "John Smith"}, {name: "Fred Jones"}, {name: "Alan Berry"}]}]}]);
        var competitor = eventData.classes[0].competitors[1];
        var data = {classes: [0], chartType: ChartTypes.SplitPosition, compareWith: {index: 6, runner: competitor}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: false, filterText: "test"};
        var courseClassSet = new CourseClassSet(eventData.classes.slice(0));
        var queryString = formatQueryString("", eventData, courseClassSet, data);
        var parsedData = parseQueryString(queryString, eventData);
        assert.deepEqual(parsedData, data, "Should have read the same data back after formatting a query string.  Query string: " + queryString);
    });
        
}());