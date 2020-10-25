/*
 *  SplitsBrowser ChartPopupData - Gets data for the chart popup window.
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

    // The maximum number of fastest splits to show when the popup is open.
    const MAX_FASTEST_SPLITS = 10;

    // Width of the time interval, in seconds, when viewing nearby results
    // at a control on the race graph.
    const RACE_GRAPH_RESULT_WINDOW = 240;

    const formatTime = SplitsBrowser.formatTime;
    const getMessage = SplitsBrowser.getMessage;
    const getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;

    const Course = SplitsBrowser.Model.Course;

    const ChartPopupData = {};

    /**
     * Returns the fastest splits to a control.
     * @param {SplitsBrowser.Model.CourseClassSet} courseClassSet The
     *     course-class set containing the splits data.
     * @param {Number} controlIndex The index of the control.
     * @param {Number|null} selectedLegIndex The index of the selected leg, or null
     *     to not return leg-specific data.
     * @return {Object} Fastest-split data.
     */
    ChartPopupData.getFastestSplitsPopupData = function (courseClassSet, controlIndex, selectedLegIndex) {
        let data = courseClassSet.getFastestSplitsTo(MAX_FASTEST_SPLITS, controlIndex, selectedLegIndex);
        data = data.map(comp => ({time: comp.split, name: comp.name, highlight: false}));

        let placeholderMessageKey;
        if (courseClassSet.hasTeamData() && selectedLegIndex === null) {
            placeholderMessageKey = "SelectedClassesPopupPlaceholderTeams";
        } else {
            placeholderMessageKey = "SelectedClassesPopupPlaceholder";
        }

        return {title: getMessage("SelectedClassesPopupHeader"), data: data, placeholder: getMessage(placeholderMessageKey)};
    };

    /**
     * Returns the fastest splits for the currently-shown leg.  The list
     * returned contains the fastest splits for the current leg for each class.
     * @param {SplitsBrowser.Model.CourseClassSet} courseClassSet The course-class set
     *     containing the splits data.
     * @param {SplitsBrowser.Model.EventData} eventData Data for the entire
     *     event.
     * @param {Number} controlIndex The index of the control.
     * @return {Object} Object that contains the title for the popup and the
     *     array of data to show within it.
     */
    ChartPopupData.getFastestSplitsForLegPopupData = function (courseClassSet, eventData, controlIndex) {
        let course = courseClassSet.getCourse();
        let startCode = course.getControlCode(controlIndex - 1);
        let endCode = course.getControlCode(controlIndex);

        let startControl = (startCode === Course.START) ? getMessage("StartName") : startCode;
        let endControl = (endCode === Course.FINISH) ? getMessage("FinishName") : endCode;

        let title = getMessageWithFormatting("FastestLegTimePopupHeader", {"$$START$$": startControl, "$$END$$": endControl});

        let primaryClass = courseClassSet.getPrimaryClassName();
        let data = eventData.getFastestSplitsForLeg(startCode, endCode)
                            .map(row => ({ name: row.name, className: row.className, time: row.split, highlight: (row.className === primaryClass)}));

        return {title: title, data: data, placeholder: null};
    };

    /**
     * Returns an object containing an array of the results visiting a
     * control at a given time.
     * @param {SplitsBrowser.Model.CourseClassSet} courseClassSet The course-class set
     *     containing the splits data.
     * @param {SplitsBrowser.Model.EventData} eventData Data for the entire
     *     event.
     * @param {Number} controlIndex The index of the control.
     * @param {Number} time The current time, in units of seconds past midnight.
     * @return {Object} Object containing result data.
     */
    ChartPopupData.getResultsVisitingCurrentControlPopupData = function (courseClassSet, eventData, controlIndex, time) {
        let controlCode = courseClassSet.getCourse().getControlCode(controlIndex);
        let intervalStart = Math.round(time) - RACE_GRAPH_RESULT_WINDOW / 2;
        let intervalEnd = Math.round(time) + RACE_GRAPH_RESULT_WINDOW / 2;
        let results = eventData.getResultsAtControlInTimeRange(controlCode, intervalStart, intervalEnd);

        let primaryClass = courseClassSet.getPrimaryClassName();
        let resultData = results.map(row => ({name: row.name, className: row.className, time: row.time, highlight: (row.className === primaryClass)}));

        let controlName;
        if (controlCode === Course.START) {
            controlName = getMessage("StartName");
        } else if (controlCode === Course.FINISH) {
            controlName = getMessage("FinishName");
        } else {
            controlName = getMessageWithFormatting("ControlName", {"$$CODE$$": controlCode});
        }

        let title = getMessageWithFormatting(
            "NearbyCompetitorsPopupHeader",
            {"$$START$$": formatTime(intervalStart), "$$END$$": formatTime(intervalEnd), "$$CONTROL$$": controlName});

        return {title: title, data: resultData, placeholder: getMessage("NoNearbyCompetitors")};
    };

    /**
     * Compares two course names.
     * @param {String} name1 One course name to compare.
     * @param {String} name2 The other course name to compare.
     * @return {Number} Comparison result: negative if name1 < name2,
     *     positive if name1 > name2 and zero if name1 === name2.
     */
    function compareCourseNames(name1, name2) {
        if (name1 === name2) {
            return 0;
        } else if (name1 === "" || name2 === "" || name1[0] !== name2[0]) {
            return (name1 < name2) ? -1 : 1;
        } else {
            // Both courses begin with the same letter.
            let regexResult = /^[^0-9]+/.exec(name1);
            if (regexResult !== null && regexResult.length > 0) {
                // regexResult should be a 1-element array.
                let result = regexResult[0];
                if (0 < result.length && result.length < name1.length && name2.substring(0, result.length) === result) {
                    let num1 = parseInt(name1.substring(result.length), 10);
                    let num2 = parseInt(name2.substring(result.length), 10);
                    if (!isNaN(num1) && !isNaN(num2)) {
                        return num1 - num2;
                    }
                }
            }

            return (name1 < name2) ? -1 : 1;
        }
    }

    /**
     * Tidy next-control data, by joining up multiple controls into one string,
     * and substituting the display-name of the finish if necessary.
     * @param {Array} nextControls Array of next-control information objects.
     * @return {String} Next-control information containing joined-up control names.
     */
    function tidyNextControlsList(nextControls) {
        return nextControls.map(function (nextControlRec) {
            let codes = nextControlRec.nextControls.slice(0);
            if (codes[codes.length - 1] === Course.FINISH) {
                codes[codes.length - 1] = getMessage("FinishName");
            }

            return {course: nextControlRec.course, nextControls: codes.join(", ")};
        });
    }

    /**
     * Returns next-control data to show on the chart popup.
     * @param {SplitsBrowser.Model.Course} course The course containing the
     *     controls data.
     * @param {SplitsBrowser.Model.EventData} eventData Data for the entire
     *     event.
     * @param {Number} controlIndex The index of the control.
     * @return {Object} Next-control data.
     */
    ChartPopupData.getNextControlData = function (course, eventData, controlIndex) {
        let controlIdx = Math.min(controlIndex, course.controls.length);
        let controlCode = course.getControlCode(controlIdx);
        let nextControls = eventData.getNextControlsAfter(controlCode);
        nextControls.sort((c1, c2) => compareCourseNames(c1.course.name, c2.course.name));
        let thisControlName = (controlCode === Course.START) ? getMessage("StartName") : getMessageWithFormatting("ControlName", {"$$CODE$$": controlCode});
        return {thisControl: thisControlName, nextControls: tidyNextControlsList(nextControls)};
    };

    SplitsBrowser.Model.ChartPopupData = ChartPopupData;
})();