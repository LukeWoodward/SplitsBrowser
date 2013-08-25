(function (){
    "use strict";

    /**
    * Given an array of numbers, return a list of the corresponding ranks of those
    * numbers.
    * @param {Array} sourceData - Array of number values.
    * @returns Array of corresponding ranks.
    */
    function getRanks(sourceData) {
        // First, sort the source data, removing nulls.
        var sortedData = sourceData.filter(function (x) { return x !== null; });
        sortedData.sort(d3.ascending);
        
        // Now construct a map that maps from source value to rank.
        var rankMap = new d3.map();
        sortedData.forEach(function(value, index) {
            if (!rankMap.has(value)) {
                rankMap.set(value, index + 1);
            }
        });
        
        // Finally, build and return the list of ranks.
        var ranks = sourceData.map(function(value) {
            return (value === null) ? null : rankMap.get(value);
        });
        
        return ranks;
    }

    /**
    * Return the values in the given array indexed by the given values.
    * @param {Array} data - Array of data values.
    * @param {Array} indexes - Array of indexes.
    * @returns Array of values indexed by the given values.
    */
    function selectByIndexes(data, indexes) {
        if (typeof data === "undefined") {
            throw new TypeError("data is undefined");
        }
        
        return indexes.map(function(index) { return data[index]; });
    }

    /**
    * Represents an object that can determine split times and ranks.
    * @constructor
    * @param {SplitsBrowser.Model.CourseData} courseData - The course data.
    */
    SplitsBrowser.Model.CompetitorSplitInfo = function(courseData) {
        this.courseData = courseData;
        
        // The null values are sentinel values for control 0 (the start).
        this.splitsPerControl = [null];
        this.splitRanksPerControl = [null];
        this.cumulativeTimesPerControl = [null];
        this.cumulativeRanksPerControl = [null];
        this.timesBehindFastestPerControl = [null];
        this.computeTimesAndRanks();
    };

    /**
    * Compute all of the split and total times and their ranks.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.computeTimesAndRanks = function() {
        
        var fastest = this.courseData.getFastestTime();
        
        var workingTotalTimesByCompetitor = new Array(this.courseData.competitorData.length);
        for (var i = 0; i < workingTotalTimesByCompetitor.length; i += 1) {
            workingTotalTimesByCompetitor[i] = 0;
        }
        
        d3.range(1, this.courseData.numControls + 2).forEach(function (controlIndex) {
            var splitsByCompetitor = this.courseData.competitorData.map(function(comp) { return comp.times[controlIndex - 1]; });
            this.splitsPerControl.push(splitsByCompetitor);
            
            var splitRanksByCompetitor = getRanks(splitsByCompetitor);
            this.splitRanksPerControl.push(splitRanksByCompetitor);
            
            workingTotalTimesByCompetitor = d3.zip(workingTotalTimesByCompetitor, splitsByCompetitor).map(function (pair) { return pair[0] + pair[1]; });
            this.cumulativeTimesPerControl.push(workingTotalTimesByCompetitor);
            
            var totalTimeRanksByCompetitor = getRanks(workingTotalTimesByCompetitor);
            this.cumulativeRanksPerControl.push(totalTimeRanksByCompetitor);
            
            var timesBehindFastest = splitsByCompetitor.map(function (time) { return time - fastest.times[controlIndex - 1]; });
            this.timesBehindFastestPerControl.push(timesBehindFastest);
        });
    };

    /**
    * Returns the splits for a number of competitors at a given control.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of split times for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getSplits = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : selectByIndexes(this.splitsPerControl[controlIndex], indexes);
    };

    /**
    * Returns the split-time ranks for a number of competitors at a given control.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of split-time ranks for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getSplitRanks = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : selectByIndexes(this.splitRanksPerControl[controlIndex], indexes);
    };

    /**
    * Returns the cumulative times for a number of competitors up to a given control.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of cumulative times for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getCumulativeTimes = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : selectByIndexes(this.cumulativeTimesPerControl[controlIndex], indexes);
    };

    /**
    * Returns the cumulative-time ranks for a number of competitors at a given control.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of cumulative-time ranks for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getCumulativeRanks = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : selectByIndexes(this.cumulativeRanksPerControl[controlIndex], indexes);
    };

    /**
    * Returns the times behind the fastest at a given control for a number of competitors.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of times-behind-fastest for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getTimesBehindFastest = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : selectByIndexes(this.timesBehindFastestPerControl[controlIndex], indexes);
    };
})();