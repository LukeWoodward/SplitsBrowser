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
            showCrossingRunnersButton: false,
            isResultsTable: false
        },
        RaceGraph: {
            name: "Race graph",
            dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReferenceWithStartAdded(referenceCumTimes).map(secondsToMinutes); },
            skipStart: false,
            yAxisLabel: "Time",
            showCrossingRunnersButton: true,
            isResultsTable: false
        },
        PositionAfterLeg: {
            name: "Position after leg",
            dataSelector: function (comp) { return comp.cumRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            showCrossingRunnersButton: false,
            isResultsTable: false
        },
        SplitPosition: {
            name: "Split position",
            dataSelector: function (comp) { return comp.splitRanks; },
            skipStart: true,
            yAxisLabel: "Position",
            showCrossingRunnersButton: false,
            isResultsTable: false
        },
        PercentBehind: {
            name: "Percent behind",
            dataSelector: function (comp, referenceCumTimes) { return comp.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes); },
            skipStart: false,
            yAxisLabel: "Percent behind",
            showCrossingRunnersButton: false,
            isResultsTable: false
        },
        ResultsTable: {
            name: "Results table",
            dataSelector: null,
            skipStart: false,
            yAxisLabel: null,
            showCrossingRunnersButton: false,
            isResultsTable: true
        }
    };
})();