/*
 *  SplitsBrowser Chart Types - Defines the types of charts that can be plotted.
 *
 *  Copyright (C) 2000-2022 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    * @param {Number|null} seconds The number of seconds to convert.
    * @return {Number|null} The corresponding number of minutes.
    */
    function secondsToMinutes(seconds) {
        return (seconds === null) ? null : seconds / 60;
    }

    /**
    * Returns indexes around the given competitor's omitted cumulative times.
    * @param {Result} result The result to get the indexes for.
    * @return {Array} Array of objects containing indexes around omitted
    *     cumulative times.
    */
    function getIndexesAroundOmittedCumulativeTimes(result) {
        return result.getControlIndexesAroundOmittedCumulativeTimes();
    }

    /**
    * Wraps an index-around-omitted-cumulative-times function and returns a
    * function that filters out any range it returned that covers the start.
    * @param {Function} func The function to wrap.
    * @return {Function} Function that wraps the given function and filters out
    *       any ranges it returned that cover the start.
    */
    function excludeIfCoveringStart(func) {
        return function (result) {
            return func(result).filter(function (range) { return range.start > 0; });
        };
    }

    /**
    * Returns indexes around the given competitor's omitted split times.
    * @param {Result} result The result to get the indexes for.
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
            yAxisLabelKey: "SplitsGraphYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumulativeTimes
        },
        RaceGraph: {
            nameKey: "RaceGraphChartType",
            dataSelector: function (result, referenceCumTimes, legIndex) {
                return result.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes, legIndex).map(secondsToMinutes);
            },
            yAxisLabelKey: "RaceGraphYAxisLabel",
            isRaceGraph: true,
            isResultsTable: false,
            minViewableControl: 0,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedCumulativeTimes
        },
        PositionAfterLeg: {
            nameKey:  "PositionAfterLegChartType",
            dataSelector: function (result) { return result.cumRanks; },
            yAxisLabelKey: "PositionYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: excludeIfCoveringStart(getIndexesAroundOmittedCumulativeTimes)
        },
        SplitPosition: {
            nameKey: "SplitPositionChartType",
            dataSelector: function (result) { return result.splitRanks; },
            yAxisLabelKey: "PositionYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: excludeIfCoveringStart(getIndexesAroundOmittedSplitTimes)
        },
        PercentBehind: {
            nameKey: "PercentBehindChartType",
            dataSelector: function (result, referenceCumTimes) { return result.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes); },
            yAxisLabelKey: "PercentBehindYAxisLabel",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: getIndexesAroundOmittedSplitTimes
        },
        ResultsTable: {
            nameKey: "ResultsTableChartType",
            dataSelector: null,
            yAxisLabelKey: null,
            isRaceGraph: false,
            isResultsTable: true,
            minViewableControl: 1,
            indexesAroundOmittedTimesFunc: null
        }
    };
})();