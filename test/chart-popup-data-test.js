/*
 *  SplitsBrowser - ChartPopupData tests.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward.
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

    QUnit.module("Chart popup data");

    const formatTime = SplitsBrowser.formatTime;
    const getMessage = SplitsBrowser.getMessage;
    const getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    const createTeamResult = SplitsBrowser.Model.Result.createTeamResult;
    const Team = SplitsBrowser.Model.Team;
    const CourseClass = SplitsBrowser.Model.CourseClass;
    const CourseClassSet = SplitsBrowser.Model.CourseClassSet;
    const Course = SplitsBrowser.Model.Course;
    const Event = SplitsBrowser.Model.Event;

    const ChartPopupData = SplitsBrowser.Model.ChartPopupData;

    const fromSplitTimes = SplitsBrowserTest.fromSplitTimes;

    function getTestCourseClassSet() {
        let results = d3.range(0, 11).map(num => {
            let timeOffset = (num * 7) % 11;
            return fromSplitTimes(1, "Name" + num, "Club" + num, 10 * 3600 + 127 * num, [65 + 10 * timeOffset, 221 + 20 * timeOffset, 209 + 15 * timeOffset, 100 + 5 * timeOffset]);
        });

        return new CourseClassSet([new CourseClass("Test class", 3, results)]);
    }

    function setCourseInCourseClassSet(course, courseClassSet) {
        for (let courseClass of courseClassSet.classes) {
            courseClass.setCourse(course);
        }
    }

    function getTestTeamCourseClassSet() {
        let results = d3.range(0, 5).map(num => {
            let timeOffset1 = (num * 7) % 11;
            let memberResult1 = fromSplitTimes(1, "Name" + num, "Club" + num, 10 * 3600 + 127 * num, [65 + 10 * timeOffset1, 221 + 20 * timeOffset1, 209 + 15 * timeOffset1, 100 + 5 * timeOffset1]);
            let timeOffset2 = ((num + 5) * 7) % 11;
            let memberResult2 = fromSplitTimes(1, "SecondName" + num, "Club" + num, 10 * 3600 + 127 * num, [65 + 10 * timeOffset2, 221 + 20 * timeOffset2, 209 + 15 * timeOffset2, 100 + 5 * timeOffset2]);
            return createTeamResult(1, [memberResult1, memberResult2], new Team("Team " + num, "Club " + num));
        });

        let courseClass = new CourseClass("Test class", 3, results);
        courseClass.setIsTeamClass([3, 3]);
        return new CourseClassSet([courseClass]);
    }

    QUnit.test("Can get selected classes popup data", function (assert) {
        let courseClassSet = getTestCourseClassSet();
        let actualData = ChartPopupData.getFastestSplitsPopupData(courseClassSet, 2, null);

        let expectedData = {
            title: getMessage("SelectedClassesPopupHeader"),
            data: d3.range(0, 10).map(num => {
                // 8 is the multiplicative inverse of 7 modulo 11,
                // so we multiply by 8 to reverse the effect of
                // multiplying by 7 modulo 11.
                let compIndex = (num * 8) % 11;
                return { name: "Name" + compIndex, time: 221 + num * 20, highlight: false };
            }),
            placeholder: getMessage("SelectedClassesPopupPlaceholder")
        };

        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get selected classes popup data for team event", function (assert) {
        let courseClassSet = getTestTeamCourseClassSet();
        let actualData = ChartPopupData.getFastestSplitsPopupData(courseClassSet, 2, null);

        let expectedTimes = [221, 281, 341, 361, 421];
        let expectedData = {
            title: getMessage("SelectedClassesPopupHeader"),
            data: d3.range(0, 5).map(num => {
                let teamIndex = (num * 2) % 5;
                return { name: "Team " + teamIndex, time: expectedTimes[num], highlight: false };
            }),
            placeholder: getMessage("SelectedClassesPopupPlaceholderTeams")
        };

        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get selected classes popup data for second leg of team event", function (assert) {
        let courseClassSet = getTestTeamCourseClassSet();
        let actualData = ChartPopupData.getFastestSplitsPopupData(courseClassSet, 1, 1);

        let expectedTimes = [65, 95, 125, 135, 165];
        let expectedData = {
            title: getMessage("SelectedClassesPopupHeader"),
            data: d3.range(0, 5).map(num => {
                let teamIndex = (num * 2) % 5;
                return { name: "SecondName" + teamIndex, time: expectedTimes[num], highlight: false };
            }),
            placeholder: getMessage("SelectedClassesPopupPlaceholder")
        };

        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get fastest splits to intermediate control", function (assert) {
        let courseClassSet1 = getTestCourseClassSet();
        let course1 = new Course("Test course", courseClassSet1.classes, null, null, ["235", "189", "212"]);
        setCourseInCourseClassSet(course1, courseClassSet1);

        let courseClassSet2 = new CourseClassSet([new CourseClass("Test class 2", 3, [fromSplitTimes(1, "First Runner", "ABC", 10 * 3600, [75, 242, 200, 157])])]);
        let course2 = new Course("Test course 2", courseClassSet2.classes, null, null, ["235", "189", "212"]);
        setCourseInCourseClassSet(course2, courseClassSet2);

        let eventData = new Event(courseClassSet1.classes.concat(courseClassSet2.classes), [course1, course2]);
        let actualData = ChartPopupData.getFastestSplitsForLegPopupData(courseClassSet1, eventData, 2);

        let expectedData = {
            title: getMessageWithFormatting("FastestLegTimePopupHeader", {"$$START$$": "235", "$$END$$": "189"}),
            data: [{
                className: "Test class",
                highlight: true,
                name: "Name0",
                time: 221
            },
            {
                className: "Test class 2",
                highlight: false,
                name: "First Runner",
                time: 242
            }],
            placeholder: null
        };

        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get fastest splits from start to first control", function (assert) {
        let courseClassSet = getTestCourseClassSet();
        let course = new Course("Test course", courseClassSet.classes, null, null, ["235", "189", "212"]);
        setCourseInCourseClassSet(course, courseClassSet);

        let eventData = new Event(courseClassSet.classes, [course]);
        let actualData = ChartPopupData.getFastestSplitsForLegPopupData(courseClassSet, eventData, 1);

        let expectedData = {
            title: getMessageWithFormatting("FastestLegTimePopupHeader", {"$$START$$": getMessage("StartName"), "$$END$$": "235"}),
            data: [{
                className: "Test class",
                highlight: true,
                name: "Name0",
                time: 65
            }],
            placeholder: null
        };

        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get fastest splits from last control to finish", function (assert) {
        let courseClassSet = getTestCourseClassSet();
        let course = new Course("Test course", courseClassSet.classes, null, null, ["235", "189", "212"]);
        setCourseInCourseClassSet(course, courseClassSet);

        let eventData = new Event(courseClassSet.classes, [course]);
        let actualData = ChartPopupData.getFastestSplitsForLegPopupData(courseClassSet, eventData, 4);

        let expectedData = {
            title: getMessageWithFormatting("FastestLegTimePopupHeader", {"$$START$$": "212", "$$END$$": getMessage("FinishName")}),
            data: [{
                className: "Test class",
                highlight: true,
                name: "Name0",
                time: 100
            }],
            placeholder: null
        };

        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get results near intermediate control", function (assert) {
        let courseClassSet = getTestCourseClassSet();
        let course = new Course("Test course", courseClassSet.classes, null, null, ["235", "189", "212"]);
        setCourseInCourseClassSet(course, courseClassSet);

        let eventData = new Event(courseClassSet.classes, [course]);

        let testTime = 10 * 3600 + 12 * 60;

        let expectedData = {
            title: getMessageWithFormatting("NearbyCompetitorsPopupHeader", {
                "$$START$$": formatTime(testTime - 120),
                "$$END$$": formatTime(testTime + 120),
                "$$CONTROL$$": getMessageWithFormatting("ControlName", {"$$CODE$$": "189"})
            }),
            data: [
                { className: "Test class", highlight: true, name: "Name1", time: 36623 },
                { className: "Test class", highlight: true, name: "Name2", time: 36630 }
            ],
            placeholder: getMessage("NoNearbyCompetitors")
        };

        let actualData = ChartPopupData.getResultsVisitingCurrentControlPopupData(courseClassSet, eventData, 2, testTime);

        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get results near start control", function (assert) {
        let courseClassSet = getTestCourseClassSet();
        let course = new Course("Test course", courseClassSet.classes, null, null, ["235", "189", "212"]);
        setCourseInCourseClassSet(course, courseClassSet);

        let eventData = new Event(courseClassSet.classes, [course]);

        let testTime = 10 * 3600 + 12 * 60;

        let expectedData = {
            title: getMessageWithFormatting("NearbyCompetitorsPopupHeader", {
                "$$START$$": formatTime(testTime - 120),
                "$$END$$": formatTime(testTime + 120),
                "$$CONTROL$$": getMessage("StartName")
            }),
            data: [
                { className: "Test class", highlight: true, name: "Name5", time: 36635 },
                { className: "Test class", highlight: true, name: "Name6", time: 36762 }
            ],
            placeholder: getMessage("NoNearbyCompetitors")
        };

        let actualData = ChartPopupData.getResultsVisitingCurrentControlPopupData(courseClassSet, eventData, 0, testTime);

        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get results near finish control", function (assert) {
        let courseClassSet = getTestCourseClassSet();
        let course = new Course("Test course", courseClassSet.classes, null, null, ["235", "189", "212"]);
        setCourseInCourseClassSet(course, courseClassSet);

        let eventData = new Event(courseClassSet.classes, [course]);

        let testTime = 10 * 3600 + 28 * 60;

        let expectedData = {
            title: getMessageWithFormatting("NearbyCompetitorsPopupHeader", {
                "$$START$$": formatTime(testTime - 120),
                "$$END$$": formatTime(testTime + 120),
                "$$CONTROL$$": getMessage("FinishName")
            }),
            data: [
                { className: "Test class", highlight: true, name: "Name8", time: 37661 },
                { className: "Test class", highlight: true, name: "Name7", time: 37734 }
            ],
            placeholder: getMessage("NoNearbyCompetitors")
        };

        let actualData = ChartPopupData.getResultsVisitingCurrentControlPopupData(courseClassSet, eventData, 4, testTime);

        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get courses and next controls using numeric sorting of course names where appropriate", function (assert) {
        let course5 = new Course("Test course 5", [], null, null, ["235", "189", "212"]);
        let course8 = new Course("Test course 8", [], null, null, ["235", "189", "212"]);
        let course10 = new Course("Test course 10", [], null, null, ["235", "189", "212"]);
        let course23 = new Course("Test course 23", [], null, null, ["235", "189", "212"]);
        let courseBefore = new Course("AAAAA", [], null, null, ["235", "189", "212"]);
        let courseAfter = new Course("ZZZZZ", [], null, null, ["235", "189", "212"]);

        let eventData = new Event([], [course10, courseAfter, course5, course23, courseBefore, course8]);

        let expectedData = {
            nextControls: [
                { course: courseBefore, nextControls: "212" },
                { course: course5, nextControls: "212" },
                { course: course8, nextControls: "212" },
                { course: course10, nextControls: "212" },
                { course: course23, nextControls: "212" },
                { course: courseAfter, nextControls: "212" }
            ],
            thisControl: getMessageWithFormatting("ControlName", {"$$CODE$$": "189"})
        };

        let actualData = ChartPopupData.getNextControlData(course5, eventData, 2);
        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get next controls of course after intermediate control when control repeated", function (assert) {
        let course = new Course("Test course", [], null, null, ["235", "189", "241", "189", "212"]);
        let eventData = new Event([], [course]);

        let expectedData = {
            nextControls: [{ course: course, nextControls: "241, 212" }],
            thisControl: getMessageWithFormatting("ControlName", {"$$CODE$$": "189"})
        };

        let actualData = ChartPopupData.getNextControlData(course, eventData, 2);
        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get next controls of course after start control", function (assert) {
        let course = new Course("Test course", [], null, null, ["235", "189", "212"]);
        let eventData = new Event([], [course]);

        let expectedData = {
            nextControls: [{ course: course, nextControls: "235" }],
            thisControl: getMessage("StartName")
        };

        let actualData = ChartPopupData.getNextControlData(course, eventData, 0);
        assert.deepEqual(actualData, expectedData);
    });

    QUnit.test("Can get next controls of course after last control", function (assert) {
        let course = new Course("Test course", [], null, null, ["235", "189", "212"]);
        let eventData = new Event([], [course]);

        let expectedData = {
            nextControls: [{ course: course, nextControls: getMessage("FinishName") }],
            thisControl: getMessageWithFormatting("ControlName", {"$$CODE$$": "212"})
        };

        let actualData = ChartPopupData.getNextControlData(course, eventData, 3);
        assert.deepEqual(actualData, expectedData);
    });
})();
