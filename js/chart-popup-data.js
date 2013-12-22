﻿/*
 *  SplitsBrowser ChartPopupData - Gets data for the chart popup window.
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    var MAX_FASTEST_SPLITS = 10;

    // Width of the time interval, in seconds, when viewing nearby competitors
    // at a control on the race graph.
    var RACE_GRAPH_COMPETITOR_WINDOW = 240;
    
    var formatTime = SplitsBrowser.formatTime;
    var getMessage = SplitsBrowser.getMessage;
    var getMessageWithFormatting = SplitsBrowser.getMessageWithFormatting;
    
    var Course = SplitsBrowser.Model.Course;
    
    var ChartPopupData = {};
    
    /**
    * Returns the fastest splits to a control.
    * @param {SplitsBrowser.Model.AgeClassSet} ageClassSet - The age-class set
    *     containing the splits data.
    * @param {Number} controlIndex - The index of the control.
    * @return {Array} Array of fastest-split data.
    */
    ChartPopupData.getFastestSplitsPopupData = function (ageClassSet, controlIndex) {
        var data = ageClassSet.getFastestSplitsTo(MAX_FASTEST_SPLITS, controlIndex);
        data = data.map(function (comp) {
            return {time: comp.split, name: comp.name, highlight: false};
        });
        
        return {title: getMessage("SelectedClassesPopupHeader"), data: data, placeholder: getMessage("SelectedClassesPopupPlaceholder")};
    };
    
    /**
    * Returns the fastest splits for the currently-shown leg.  The list
    * returned contains the fastest splits for the current leg for each class.
    * @param {SplitsBrowser.Model.AgeClassSet} ageClassSet - The age-class set
    *     containing the splits data.
    * @param {SplitsBrowser.Model.EventData} eventData - Data for the entire
    *     event.
    * @param {Number} controlIndex - The index of the control.
    * @return {Object} Object that contains the title for the popup and the
    *     array of data to show within it.
    */
    ChartPopupData.getFastestSplitsForLegPopupData = function (ageClassSet, eventData, controlIndex) {
        var course = ageClassSet.getCourse();
        var startCode = course.getControlCode(controlIndex - 1);
        var endCode = course.getControlCode(controlIndex);
        
        var startControl = (startCode === Course.START) ? getMessage("StartName") : startCode;
        var endControl = (endCode === Course.FINISH) ? getMessage("FinishName") : endCode;
        
        var title = getMessageWithFormatting("FastestLegTimePopupHeader", {"$$START$$": startControl, "$$END$$": endControl});
        
        var primaryClass = ageClassSet.getPrimaryClassName();
        var data = eventData.getFastestSplitsForLeg(startCode, endCode)
                            .map(function (row) { return { name: row.name, className: row.className, time: row.split, highlight: (row.className === primaryClass)}; });
        
        return {title: title, data: data, placeholder: null};
    };
    
    /**
    * Returns an array of the competitors visiting a control at a given time.
    * @param {SplitsBrowser.Model.AgeClassSet} ageClassSet - The age-class set
    *     containing the splits data.
    * @param {SplitsBrowser.Model.EventData} eventData - Data for the entire
    *     event.
    * @param {Number} controlIndex - The index of the control.
    * @param {time} The current time, in units of seconds past midnight.
    * @return {Array} Array of competitor data.
    */
    ChartPopupData.getCompetitorsVisitingCurrentControlPopupData = function (ageClassSet, eventData, controlIndex, time) {
        var controlCode = ageClassSet.getCourse().getControlCode(controlIndex);
        var intervalStart = time - RACE_GRAPH_COMPETITOR_WINDOW / 2;
        var intervalEnd = time + RACE_GRAPH_COMPETITOR_WINDOW / 2;
        var competitors = eventData.getCompetitorsAtControlInTimeRange(controlCode, intervalStart, intervalEnd);
            
        var primaryClass = ageClassSet.getPrimaryClassName();
        var competitorData = competitors.map(function (row) { return {name: row.name, className: row.className, time: row.time, highlight: (row.className === primaryClass)}; });
        
        var controlName;
        if (controlCode === Course.START) {
            controlName = getMessage("StartName");
        } else if (controlCode === Course.FINISH) {
            controlName = getMessage("FinishName");
        } else {
            controlName = getMessageWithFormatting("ControlName", {"$$CODE$$": controlCode});
        }
        
        var title = getMessageWithFormatting(
            "NearbyCompetitorsPopupHeader",
            {"$$START$$": formatTime(intervalStart), "$$END$$": formatTime(intervalEnd), "$$CONTROL$$": controlName});
        
        return {title: title, data: competitorData, placeholder: getMessage("NoNearbyCompetitors")};
    };    
        
    /**
    * Compares two course names.
    * @param {String} name1 - One course name to compare.
    * @param {String} name2 - The other course name to compare.
    * @return {Number} Comparison result: -1 if name1 < name2, 1 if
    *     name1 > name2 and 0 if name1 === name2.
    */
    function compareCourseNames(name1, name2) {
        if (name1 === name2) {
            return 0;
        } else if (name1 === "" || name2 === "" || name1[0] !== name2[0]) {
            return (name1 < name2) ? -1 : 1;
        } else {
            // Both courses begin with the same letter.
            var regexResult = /^[^0-9]+/.exec(name1);
            if (regexResult !== null && regexResult.length > 0) {
                // regexResult should be a 1-element array.
                var result = regexResult[0];
                if (0 < result.length && result.length < name1.length && name2.substring(0, result.length) === result) {
                    var num1 = parseInt(name1.substring(result.length), 10);
                    var num2 = parseInt(name2.substring(result.length), 10);
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
    * @param {Array} nextControls - Array of next-control information objects.
    * @return {String} Next-control information containing joined-up control names.
    */
    function tidyNextControlsList(nextControls) {
        return nextControls.map(function (nextControlRec) {
            var codes = nextControlRec.nextControls.slice(0);
            if (codes[codes.length - 1] === Course.FINISH) {
                codes[codes.length - 1] = getMessage("FinishName");
            }
            
            return {course: nextControlRec.course, nextControls: codes.join(", ")};
        });
    }
    
    /**
    * Returns next-control data to show on the chart popup.
    * @param {SplitsBrowser.Model.Course} course - The course containing the
    *     controls data.
    * @param {SplitsBrowser.Model.EventData} eventData - Data for the entire
    *     event.
    * @param {Number} controlIndex - The index of the control.
    * @return {Array} Array of next-control data.
    */
    ChartPopupData.getNextControlData = function (course, eventData, controlIndex) {
        var controlIdx = Math.min(controlIndex, course.controls.length);
        var controlCode = course.getControlCode(controlIdx);
        var nextControls = eventData.getNextControlsAfter(controlCode);
        nextControls.sort(function (c1, c2) { return compareCourseNames(c1.course.name, c2.course.name); });
        var thisControlName = (controlCode === Course.START) ? getMessage("StartName") : getMessageWithFormatting("ControlName", {"$$CODE$$": controlCode});
        return {thisControl: thisControlName, nextControls: tidyNextControlsList(nextControls) };
    };
    
    SplitsBrowser.Model.ChartPopupData = ChartPopupData;
})();