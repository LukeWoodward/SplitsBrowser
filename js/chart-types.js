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

    SplitsBrowser.Model.ChartTypes = {
        SplitsGraph: {
            name: "Splits graph",
            dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReference(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabel: "Time loss (min)",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1
        },
        RaceGraph: {
            name: "Race graph",
            dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabel: "Time",
            isRaceGraph: true,
            isResultsTable: false,
            minViewableControl: 0
        },
        PositionAfterLeg: {
            name: "Position after leg",
            dataSelector: function (comp) { return comp.cumRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1
        },
        SplitPosition: {
            name: "Split position",
            dataSelector: function (comp) { return comp.splitRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1
        },
        PercentBehind: {
            name: "Percent behind",
            dataSelector: function (comp, referenceCumTimes) { return comp.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes); },
            skipStart: false,
            yAxisLabel: "Percent behind",
            isRaceGraph: false,
            isResultsTable: false,
            minViewableControl: 1
        },
        ResultsTable: {
            name: "Results table",
            dataSelector: null,
            skipStart: false,
            yAxisLabel: null,
            isRaceGraph: false,
            isResultsTable: true,
            minViewableControl: 1
        }
    };
})();