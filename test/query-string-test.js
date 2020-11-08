/*
 *  SplitsBrowser - Query-string tests
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

    const CourseClass = SplitsBrowser.Model.CourseClass;
    const CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    const Course = SplitsBrowser.Model.Course;
    const Event = SplitsBrowser.Model.Event;
    const ChartTypes = SplitsBrowser.Model.ChartTypes;

    const parseQueryString = SplitsBrowser.parseQueryString;
    const formatQueryString = SplitsBrowser.formatQueryString;

    const fromSplitTimes = SplitsBrowserTest.fromSplitTimes;

    const makeStatsMap = SplitsBrowserTest.makeStatsMap;

    const VALID_SPLIT_TIMES = [177, 99, 211, 121];

    const INVALID_SPLIT_TIMES = [null, null, null, null];

    const TOTAL_TIME_AND_TIME_LOSS = makeStatsMap(true, false, false, true);
    const NO_STATS = makeStatsMap(false, false, false, false);

    /**
     * Fabricates an Event object from the data given.
     * @param {Object} courseData The data to create an Event using.
     * @return {Event} The fabricated Event.
     */
    function makeEvent(courseData) {
        const courses = [];
        const allClasses = [];
        for (let course of courseData) {
            const courseClasses = [];
            for (let courseClass of course.classes) {
                const classResults = (courseClass.competitors || []).map((result, index) =>
                    fromSplitTimes(index + 1, result.name, "club", null, (result.invalid) ? INVALID_SPLIT_TIMES : VALID_SPLIT_TIMES));

                const createdClass = new CourseClass(courseClass.name, 3, classResults);
                courseClasses.push(createdClass);
                allClasses.push(createdClass);
            }

            const createdCourse = new Course(course.name, courseClasses, null, null, null);
            for (let courseClass of courseClasses) {
                courseClass.setCourse(createdCourse);
            }
            courses.push(createdCourse);
        }

        return new Event(allClasses, courses, []);
    }

    function defaultValue(value, defltVal) {
        return (typeof value === "undefined") ? defltVal : value;
    }

    /**
     * Creates and returns an expected-data object that contains default values
     * for all parameters not specified.
     * @param {Object} data Object with some data values set.
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
            selectedLeg: defaultValue(data.selectedLeg, null),
            filterText: defaultValue(data.filterText, "")
        };
    }

    QUnit.module("Query-string");

    QUnit.test("Parsing an empty string should return all-null values", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test class 1"}]}]);
        assert.deepEqual(
            parseQueryString("", eventData),
            makeExpectedData({})
        );
    });

    QUnit.test("Parsing a string containing a single class with a question-mark prefix should return only that class", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(
            parseQueryString("?class=TestClass1", eventData),
            makeExpectedData({classes: [0]})
        );
    });

    QUnit.test("Parsing a string containing a single class should return only that class", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1", eventData),
            makeExpectedData({classes: [0]})
        );
    });

    QUnit.test("Parsing a string containing a single unrecognised class should return null", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(
            parseQueryString("class=Unrecognised", eventData),
            makeExpectedData({classes: null})
        );
    });

    QUnit.test("Parsing a string containing a single recognised class and a single unrecognised class should return only the recognised class", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(
            parseQueryString("class=Unrecognised;TestClass1", eventData),
            makeExpectedData({classes: [0]})
        );
    });

    QUnit.test("Parsing a string containing a single class that needs URL-encoding should return only that class", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class %^$ 1"}]}]);
        assert.deepEqual(
            parseQueryString("class=Test%20Class%20%25%5e%24%201", eventData),
            makeExpectedData({classes: [0]})
        );
    });

    QUnit.test("Parsing a string containing multiple classes should return only those classes", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}, {name: "TestClass2"}, {name: "TestClass3"}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1;TestClass2;TestClass3", eventData),
            makeExpectedData({classes: [0, 1, 2]})
        );
    });

    QUnit.test("Parsing a string containing a single class repeated should return that class only once", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}, {name: "TestClass2"}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass2;TestClass2", eventData),
            makeExpectedData({classes: [1]})
        );
    });

    QUnit.test("Parsing a string containing multiple classes in multiple courses should return only those on the same course as the first", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}, {name: "TestClass2"}]}, {name: "Course2", classes:[{name: "TestClass3"}, {name: "TestClass4"}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1;TestClass4;TestClass2;TestClass3", eventData),
            makeExpectedData({classes: [0, 1]})
        );
    });

    QUnit.test("Parsing a string containing the splits-graph chart type should return the splits-graph chart type",
        assert => assert.deepEqual(
            parseQueryString("chartType=SplitsGraph"),
            makeExpectedData({chartType: ChartTypes.get("SplitsGraph")})));

    QUnit.test("Parsing a string containing the splits-graph chart type with a leading question-mark should return the splits-graph chart type",
        assert => assert.deepEqual(
            parseQueryString("?chartType=SplitsGraph"),
            makeExpectedData({chartType: ChartTypes.get("SplitsGraph")})));

    QUnit.test("Parsing a string containing the race-graph chart type should return the race-graph chart type",
        assert => assert.deepEqual(
            parseQueryString("chartType=RaceGraph"),
            makeExpectedData({chartType: ChartTypes.get("RaceGraph")})));

    QUnit.test("Parsing a string containing the position-after-leg chart type should return the position-after-leg chart type",
        assert => assert.deepEqual(
            parseQueryString("chartType=PositionAfterLeg"),
            makeExpectedData({chartType: ChartTypes.get("PositionAfterLeg")})));

    QUnit.test("Parsing a string containing the split-position chart type should return the split-position chart type",
        assert => assert.deepEqual(
            parseQueryString("chartType=SplitPosition"),
            makeExpectedData({chartType: ChartTypes.get("SplitPosition")})));

    QUnit.test("Parsing a string containing the percent-behind chart type should return the percent-behind chart type",
        assert => assert.deepEqual(
            parseQueryString("chartType=PercentBehind"),
            makeExpectedData({chartType: ChartTypes.get("PercentBehind")})));

    QUnit.test("Parsing a string containing the results-table chart type should return the results-table chart type",
        assert => assert.deepEqual(
            parseQueryString("chartType=ResultsTable"),
            makeExpectedData({chartType: ChartTypes.get("ResultsTable")})));

    QUnit.test("Parsing a string containing an unrecognised chart type should return null",
        assert => assert.deepEqual(
            parseQueryString("chartType=UnrecognisedChartType"),
            makeExpectedData({chartType: null})));

    QUnit.test("Parsing a string containing the winner comparison type returns that comparison type if a class is selected and the class has a winner", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&compareWith=Winner", eventData),
            makeExpectedData({classes: [0], compareWith: {index: 0, result: null}})
        );
    });

    QUnit.test("Parsing a string with a leading question mark containing the winner comparison type returns that comparison type if a class is selected and the class has a winner", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("?compareWith=Winner&class=TestClass1", eventData),
            makeExpectedData({classes: [0], compareWith: {index: 0, result: null}})
        );
    });

    QUnit.test("Parsing a string containing the winner comparison type returns null if no classes are specified", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("compareWith=Winner", eventData),
            makeExpectedData({compareWith: null})
        );
    });

    QUnit.test("Parsing a string containing the winner comparison type when the selected class has no winner returns null", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner", invalid: true}]}]}]);
        assert.deepEqual(
            parseQueryString("compareWith=Winner", eventData),
            makeExpectedData({compareWith: null})
        );
    });

    QUnit.test("Parsing a string containing the fastest-time comparison type returns that comparison type", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(
            parseQueryString("compareWith=FastestTime", eventData),
            makeExpectedData({compareWith: {index: 1, result: null}})
        );
    });

    QUnit.test("Parsing a string containing the fastest-time-plus-5% comparison type returns that comparison type", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(
            parseQueryString("compareWith=FastestTimePlus5", eventData),
            makeExpectedData({compareWith: {index: 2, result: null}})
        );
    });

    QUnit.test("Parsing a string containing the fastest-time-plus-25% comparison type returns that comparison type", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(
            parseQueryString("compareWith=FastestTimePlus25", eventData),
            makeExpectedData({compareWith: {index: 3, result: null}})
        );
    });

    QUnit.test("Parsing a string containing the fastest-time-plus-50% comparison type returns that comparison type", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(
            parseQueryString("compareWith=FastestTimePlus50", eventData),
            makeExpectedData({compareWith: {index: 4, result: null}})
        );
    });

    QUnit.test("Parsing a string containing the fastest-time-plus-100% comparison type returns that comparison type", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1"}]}]);
        assert.deepEqual(
            parseQueryString("compareWith=FastestTimePlus100", eventData),
            makeExpectedData({compareWith: {index: 5, result: null}})
        );
    });

    QUnit.test("Parsing a string containing the compare-against-named-result comparison type returns that comparison type if the result is recognised", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&compareWith=First%20Runner", eventData),
            makeExpectedData({classes: [0], compareWith: {index: 6, result: eventData.classes[0].results[0]}})
        );
    });

    QUnit.test("Parsing a string containing the compare-against-named-result comparison type returns that comparison type if the result is recognised in the second of two classes", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}, {name: "TestClass2", competitors: [{name: "Second Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1;TestClass2&compareWith=Second%20Runner", eventData),
            makeExpectedData({classes: [0, 1], compareWith: {index: 6, result: eventData.classes[1].results[0]}})
        );
    });

    QUnit.test("Parsing a string containing the compare-against-named-result comparison type returns null if the result is recognised but no classes are selected", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("compareWith=First%20Runner", eventData),
            makeExpectedData({compareWith: null})
        );
    });

    QUnit.test("Parsing a string containing the compare-against-named-result comparison type returns null if the result is unrecognised", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&compareWith=WrongName", eventData),
            makeExpectedData({classes: [0], compareWith: null})
        );
    });

    QUnit.test("Parsing a string containing the compare-against-named-result comparison type returns null if the result does not finish", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner", invalid: true}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&compareWith=First%20Runner", eventData),
            makeExpectedData({classes: [0], compareWith: null})
        );
    });

    QUnit.test("Parsing a string with a single result selected returns that result as selected", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&selected=First%20Runner", eventData),
            makeExpectedData({classes: [0], selected: [0]})
        );
    });

    QUnit.test("Parsing a string with a leading question-mark and a single result selected returns that result as selected", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("?selected=First%20Runner&class=TestClass1", eventData),
            makeExpectedData({classes: [0], selected: [0]})
        );
    });

    QUnit.test("Parsing a string with an unrecognised result name returns no selected results", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&selected=Unrecognised%20Person", eventData),
            makeExpectedData({classes: [0], selected: null})
        );
    });

    QUnit.test("Parsing a string with a valid selected result name but no selected classes returns no selected results", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("selected=First%20Runner", eventData),
            makeExpectedData({selected: null})
        );
    });

    QUnit.test("Parsing a string with two results selected returns those results as selected", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&selected=First%20Runner;Third%20Runner", eventData),
            makeExpectedData({classes:[0], selected: [0, 2]})
        );
    });

    QUnit.test("Parsing a string with a single result selected twice returns that result as selected once", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&selected=First%20Runner;First%20Runner", eventData),
            makeExpectedData({classes: [0], selected: [0]})
        );
    });

    QUnit.test("Parsing a string with an asterisk in the selected string selects all competitors", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&selected=*", eventData),
            makeExpectedData({classes:[0], selected: [0, 1, 2]})
        );
    });

    QUnit.test("Parsing a string with an asterisk in the selected string and other names selects all results", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        assert.deepEqual(
            parseQueryString("class=TestClass1&selected=Second%20Runner;*;First%20Runner", eventData),
            makeExpectedData({classes: [0], selected: [0, 1, 2]})
        );
    });

    QUnit.test("Can parse a query-string containing an empty list of statistics",
        assert => assert.deepEqual(
            parseQueryString("stats="),
            makeExpectedData({stats: NO_STATS})));

    QUnit.test("Can parse a query-string containing a single statistic",
        assert => assert.deepEqual(
            parseQueryString("stats=BehindFastest"),
            makeExpectedData({stats: makeStatsMap(false, false, true, false)})));

    QUnit.test("Can parse a query-string containing a single statistic repeated",
        assert => assert.deepEqual(
            parseQueryString("stats=BehindFastest;BehindFastest"),
            makeExpectedData({stats: makeStatsMap(false, false, true, false)})));

    QUnit.test("Can parse a query-string containing an unrecognised statistic as null",
        assert => assert.deepEqual(
            parseQueryString("stats=ThisIsNotRecognised"),
            makeExpectedData({stats: null})));

    QUnit.test("Can parse a query-string containing all four statistics",
        assert => assert.deepEqual(
            parseQueryString("stats=TotalTime;SplitTime;BehindFastest;TimeLoss"),
            makeExpectedData({stats: makeStatsMap(true, true, true, true)})));

    QUnit.test("Can parse a query-string containing just the show-original flag",
        assert => assert.deepEqual(
            parseQueryString("showOriginal=1"),
            makeExpectedData({showOriginal: true})));

    QUnit.test("Can parse a query-string containing just the show-original flag with a value other than '1', considered to be false",
        assert => assert.deepEqual(
            parseQueryString("showOriginal=Yes"),
            makeExpectedData({showOriginal: false})));

    QUnit.test("Can parse a query-string containing an empty filter-text string",
        assert => assert.deepEqual(
            parseQueryString("filterText="),
            makeExpectedData({filterText: ""})));

    QUnit.test("Can parse a query-string containing a non-empty filter-text string",
        assert => assert.deepEqual(
            parseQueryString("filterText=test"),
            makeExpectedData({filterText: "test"})));

    QUnit.test("Can parse a query-string containing a filter-text string that needs URL-decoding",
        assert => assert.deepEqual(
            parseQueryString("filterText=Test%20%23%31"),
            makeExpectedData({filterText: "Test #1"})));

    QUnit.test("Can parse a query-string containing a selected leg",
        assert => assert.deepEqual(
            parseQueryString("selectedLeg=5"),
            makeExpectedData({selectedLeg: 5})));

    QUnit.test("Can parse a query-string containing a non-integer selected leg as the integer part",
        assert => assert.deepEqual(
            parseQueryString("selectedLeg=2.5"),
            makeExpectedData({selectedLeg: 2})));

    QUnit.test("Can parse a query-string containing a non-numeric selected leg as null",
        assert => assert.deepEqual(
            parseQueryString("selectedLeg=invalid"),
            makeExpectedData({selectedLeg: null})));

    QUnit.test("Can parse a query string containing values for all eight arguments", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "TestClass1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const courseClass = eventData.classes[0];
        const compareWith = {index: 6, result: courseClass.results[2]};
        assert.deepEqual(
            parseQueryString("class=TestClass1&chartType=PositionAfterLeg&compareWith=Third%20Runner&selected=Second%20Runner;First%20Runner&stats=TimeLoss;TotalTime&showOriginal=1&selectedLeg=2&filterText=test", eventData),
            {classes: [0], chartType: ChartTypes.get("PositionAfterLeg"), compareWith: compareWith, selected: [0, 1], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, selectedLeg: 2, filterText: "test"});
    });

    QUnit.test("Can format an empty query-string with values for all eight arguments", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const data = {classes: [0], chartType: ChartTypes.get("SplitPosition"), compareWith: {index: 1, result: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, selectedLeg: 2, filterText: "test 1"};
        const courseClassSet = new CourseClassSet([eventData.classes[0]]);
        const queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=Second%20Runner%3BThird%20Runner&stats=TotalTime%3BTimeLoss&showOriginal=1&selectedLeg=2&filterText=test%201");
    });

    QUnit.test("Can format a query-string with a value for some other parameter, adding values for all eight arguments and retaining the existing parameter", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const data = {classes: [0], chartType: ChartTypes.get("SplitPosition"), compareWith: {index: 1, result: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, selectedLeg: 2, filterText: "test"};
        const courseClassSet = new CourseClassSet([eventData.classes[0]]);
        const queryString = formatQueryString("?eventId=6789", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "?eventId=6789&class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=Second%20Runner%3BThird%20Runner&stats=TotalTime%3BTimeLoss&showOriginal=1&selectedLeg=2&filterText=test");
    });

    QUnit.test("Can format a query-string that contains existing values with new values for all eight arguments", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const data = {classes: [0], chartType: ChartTypes.get("SplitPosition"), compareWith: {index: 1, result: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, selectedLeg: 2, filterText: "testNew"};
        const courseClassSet = new CourseClassSet([eventData.classes[0]]);
        const queryString = formatQueryString("class=SomeOtherClass&chartType=SomeChartType&compareWith=SomeComparison&selected=SomeCompetitors&stats=SomeStats&showOriginal=Yes&selectedLeg=1&filterText=testOld", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=Second%20Runner%3BThird%20Runner&stats=TotalTime%3BTimeLoss&showOriginal=1&selectedLeg=2&filterText=testNew");
    });

    QUnit.test("Can format a query-string that contains multiple existing values with new values for all eight arguments", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const data = {classes: [0], chartType: ChartTypes.get("SplitPosition"), compareWith: {index: 1, result: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, selectedLeg: 2, filterText: "test"};
        const courseClassSet = new CourseClassSet([eventData.classes[0]]);
        const queryString = formatQueryString(
            "class=SomeOtherClass&class=YetAnotherClass&chartType=SomeChartType&compareWith=SomeComparison&compareWith=SomeOtherComparison&chartType=SomeOtherChartType" +
            "&selected=SomeCompetitors&stats=SomeStats&selected=SomeOtherCompetitors&stats=SomeOtherStats&showOriginal=Oui&showOriginal=Ja&selectedLeg=3&selectedLeg=4&filterText=testOld&filterText=testNew",
            eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=Second%20Runner%3BThird%20Runner&stats=TotalTime%3BTimeLoss&showOriginal=1&selectedLeg=2&filterText=test");
    });

    QUnit.test("Can format a query-string that contains no selected results and no statistics, does not show original data and has no filter text", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const data = {classes: [0], chartType: ChartTypes.get("SplitPosition"), compareWith: {index: 1, result: null}, selected: [], stats: NO_STATS, showOriginal: false, selectedLeg: null, filterText: ""};
        const courseClassSet = new CourseClassSet([eventData.classes[0]]);
        const queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&stats=");
    });

    QUnit.test("Can format a query-string that contains all selected results and no statistics", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const data = {classes: [0], chartType: ChartTypes.get("SplitPosition"), compareWith: {index: 1, result: null}, selected: [0, 1, 2], stats: NO_STATS, showOriginal: false, selectedLeg: null, filterText: ""};
        const courseClassSet = new CourseClassSet([eventData.classes[0]]);
        const queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=FastestTime&selected=*&stats=");
    });

    QUnit.test("Can format a query-string that compares against a named result", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const courseClassSet = new CourseClassSet([eventData.classes[0]]);
        const data = {classes: [0], chartType: ChartTypes.get("SplitPosition"), compareWith: {index: 6, result: courseClassSet.allResults[0]}, selected: [], stats: NO_STATS, showOriginal: false, selectedLeg: null, filterText: ""};
        const queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&chartType=SplitPosition&compareWith=First%20Runner&stats=");
    });

    QUnit.test("Can format a query-string that has an unrecognised chart type and comparison", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const courseClassSet = new CourseClassSet([eventData.classes[0]]);
        const data = {classes: [0], chartType: "This is not a valid chart type", compareWith: {index: 77, result: null}, selected: [], stats: NO_STATS, showOriginal: false, selectedLeg: null, filterText: ""};
        const queryString = formatQueryString("", eventData, courseClassSet, data);
        assert.strictEqual(queryString, "class=Test%20Class%201&stats=");
    });

    QUnit.test("Can obtain the same data by formatting and parsing a query string using a built-in comparison and original data", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}, {name: "Test Class 2"}]}]);
        const data = {classes: [0, 1], chartType: ChartTypes.get("SplitPosition"), compareWith: {index: 1, result: null}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: true, selectedLeg: null, filterText: "test"};
        const courseClassSet = new CourseClassSet(eventData.classes.slice(0));
        const queryString = formatQueryString("", eventData, courseClassSet, data);
        const parsedData = parseQueryString(queryString, eventData);
        assert.deepEqual(parsedData, data, "Should have read the same data back after formatting a query string.  Query string: " + queryString);
    });

    QUnit.test("Can obtain the same data by formatting and parsing a query string comparing against a runner and not showing original data", assert => {
        const eventData = makeEvent([{name: "Course1", classes: [{name: "Test Class 1", competitors: [{name: "First Runner"}, {name: "Second Runner"}, {name: "Third Runner"}]}]}]);
        const result = eventData.classes[0].results[1];
        const data = {classes: [0], chartType: ChartTypes.get("SplitPosition"), compareWith: {index: 6, result: result}, selected: [1, 2], stats: TOTAL_TIME_AND_TIME_LOSS, showOriginal: false, selectedLeg: null, filterText: "test"};
        const courseClassSet = new CourseClassSet(eventData.classes.slice(0));
        const queryString = formatQueryString("", eventData, courseClassSet, data);
        const parsedData = parseQueryString(queryString, eventData);
        assert.deepEqual(parsedData, data, "Should have read the same data back after formatting a query string.  Query string: " + queryString);
    });
}());