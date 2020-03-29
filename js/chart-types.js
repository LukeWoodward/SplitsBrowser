/*
 *  SplitsBrowser Chart Types - Defines the types of charts that can be plotted.
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
    
    /**
    * Converts a number of seconds into the corresponding number of minutes.
    * This conversion is as simple as dividing by 60.
    * @param {Number} seconds - The number of seconds to convert.
    * @return {Number} The corresponding number of minutes.
    */
    function secondsToMinutes(seconds) { 
        return (seconds === null) ? null : seconds / 60;
    }
    
    /**
    * Returns indexes around the given competitor's omitted cumulative times.
    * @param {Result} result - The result to get the indexes for.
    * @return {Array} Array of objects containing indexes around omitted
    *     cumulative times.
    */
    function getIndexesAroundOmittedCumulativeTimes(result) {
        return result.getControlIndexesAroundOmittedCumulativeTimes();
    }
    
    /**
    * Returns indexes around the given competitor's omitted split times.
    * @param {Result} result - The result to get the indexes for.
    * @return {Array} Array of objects containing indexes around omitted split
    *     times.
    */
    function getIndexesAroundOmittedSplitTimes(result) {
        return result.getControlIndexesAroundOmittedSplitTimes();
    }

    SplitsBrowser.Model.ChartTypes = {
        SplitsGraph: {
            nameKey: "SplitsGraphChartType",
            dataSelector: function (result, referenceCumTimes) { return result.getCumTimesAdjustedToReference(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabelKey: "SplitsGraphYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumulativeTimes
        },
        RaceGraph: {
            nameKey: "RaceGraphChartType",
            dataSelector: function (result, referenceCumTimes) { return result.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabelKey: "RaceGraphYAxisLabel",
            isRaceGraph: true,
            isResultsTable: false,
            minViewableControl: 0,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumulativeTimes
        },
        PositionAfterLeg: {
            nameKey:  "PositionAfterLegChartType",
            dataSelector: function (result) { return result.cumRanks; },
            skipStart: true,
            yAxisLabelKey: "PositionYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumulativeTimes
        },
        SplitPosition: {
            nameKey: "SplitPositionChartType",
            dataSelector: function (result) { return result.splitRanks; },
            skipStart: true,
            yAxisLabelKey: "PositionYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedSplitTimes
        },
        PercentBehind: {
            nameKey: "PercentBehindChartType",
            dataSelector: function (result, referenceCumTimes) { return result.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes); },
            skipStart: false,
            yAxisLabelKey: "PercentBehindYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedSplitTimes
        },
        ResultsTable: {
            nameKey: "ResultsTableChartType",
            dataSelector: null,
            skipStart: false,
            yAxisLabelKey: null,
            isRaceGraph: false,
            isResultsTable: true,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: null
        }
    };
})();