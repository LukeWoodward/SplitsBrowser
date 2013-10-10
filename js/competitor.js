(function () {
    "use strict";

    var _NUMBER_TYPE = typeof 0;

    /**
    * Function used with the JavaScript sort method to sort competitors in order
    * by finishing time.
    * 
    * Competitors that mispunch are sorted to the end of the list.
    * 
    * The return value of this method will be:
    * (1) a negative number if competitor a comes before competitor b,
    * (2) a positive number if competitor a comes after competitor a,
    * (3) zero if the order of a and b makes no difference (i.e. they have the
    *     same total time, or both mispunched.)
    * 
    * @param {SplitsBrowser.Model.Competitor} a - One competitor to compare.
    * @param {SplitsBrowser.Model.Competitor} b - The other competitor to compare.
    * @returns {Number} Result of comparing two competitors.  TH
    */
    SplitsBrowser.Model.compareCompetitors = function (a, b) {
        if (a.totalTime === b.totalTime) {
            return a.order - b.order;
        } else if (a.totalTime === null) {
            return (b.totalTime === null) ? 0 : 1;
        } else {
            return (b.totalTime === null) ? -1 : a.totalTime - b.totalTime;
        }
    };
    
    /**
    * Returns the sum of two numbers, or null if either is null.
    * @param {Number|null} a - One number, or null, to add.
    * @param {Number|null} b - The other number, or null, to add.
    * @return {Number|null} null if at least one of a or b is null,
    *      otherwise a + b.
    */
    function addIfNotNull(a, b) {
        return (a === null || b === null) ? null : (a + b);
    }
    
    /**
    * Returns the difference of two numbers, or null if either is null.
    * @param {Number|null} a - One number, or null, to add.
    * @param {Number|null} b - The other number, or null, to add.
    * @return {Number|null} null if at least one of a or b is null,
    *      otherwise a - b.
    */    
    function subtractIfNotNull(a, b) {
        return (a === null || b === null) ? null : (a - b);
    }
    
    /**
    * Convert an array of split times into an array of cumulative times.
    * If any null splits are given, all cumulative splits from that time
    * onwards are null also.
    *
    * The returned array of cumulative split times includes a zero value for
    * cumulative time at the start.
    * @param {Array} splitTimes - Array of split times.
    * @return {Array} Corresponding array of cumulative split times.
    */
    function cumTimesFromSplitTimes(splitTimes) {
        if (!$.isArray(splitTimes)) {
            throw new TypeError("Split times must be an array - got " + typeof (splitTimes) + " instead");
        }
        
        var cumTimes = [0];
        for (var i = 0; i < splitTimes.length; i += 1) {
            cumTimes.push(addIfNotNull(cumTimes[i], splitTimes[i]));
        }

        return cumTimes;
    }
    
    /**
    * Convert an array of cumulative times into an array of split times.
    * If any null cumulative splits are given, the split times to and from that
    * control are null also.
    *
    * The input array should begin with a zero, for the cumulative time to the
    * start.
    * @param {Array} cumTimes - Array of cumulative split times.
    * @return {Array} Corresponding array of split times.
    */
    function splitTimesFromCumTimes(cumTimes) {
        if (!$.isArray(cumTimes)) {
            throw new TypeError("Cumulative times must be an array - got " + typeof (cumTimes) + " instead");
        }
        
        var splitTimes = [];
        for (var i = 0; i + 1 < cumTimes.length; i += 1) {
            splitTimes.push(subtractIfNotNull(cumTimes[i + 1], cumTimes[i]));
        }
        
        return splitTimes;
    }

    /**
     * Private object that represents the data for a single competitor.
     *
     * The first parameter (order) merely stores the order in which the competitor
     * appears in the given list of results.  Its sole use is to stabilise sorts of
     * competitors, as JavaScript's sort() method is not guaranteed to be a stable
     * sort.  However, it is not strictly the finishing order of the competitors,
     * as it has been known for them to be given not in the correct order.
     *
     * @constructor
     * @param {Number} order - The position of the competitor within the list of results.
     * @param {string} forename - The forename of the competitor.
     * @param {string} surname - The surname of the competitor.
     * @param {string} club - The name of the competitor's club.
     * @param {string} startTime - The competitor's start time.
     * @param {Array} splitTimes - Array of split times, as numbers, with nulls for missed controls.
     * @param {Array} cumTimes - Array of cumulative split times, as numbers, with nulls for missed controls.
     */
    var Competitor = function (order, forename, surname, club, startTime, splitTimes, cumTimes) {

        if (typeof (order) !== _NUMBER_TYPE) {
            SplitsBrowser.throwInvalidData("Competitor order must be a number, got " + typeof order + " '" + order + "' instead");
        }

        this.order = order;
        this.forename = forename;
        this.surname = surname;
        this.club = club;
        this.startTime = startTime;
        
        this.splitTimes = splitTimes;
        this.cumTimes = cumTimes;
        this.splitRanks = null;
        this.cumRanks = null;

        this.name = forename + " " + surname;
        this.totalTime = (this.cumTimes.indexOf(null) > -1) ? null : this.cumTimes[this.cumTimes.length - 1];
    };
    
    SplitsBrowser.Model.Competitor = {};
    
    /**
    * Create and return a Competitor object where the competitor's times are given
    * as a list of split times.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * @param {Number} order - The position of the competitor within the list of results.
    * @param {string} forename - The forename of the competitor.
    * @param {string} surname - The surname of the competitor.
    * @param {string} club - The name of the competitor's club.
    * @param {string} startTime - The competitor's start time.
    * @param {Array} splitTimes - Array of split times, as numbers, with nulls for missed controls.
    */
    SplitsBrowser.Model.Competitor.fromSplitTimes = function (order, forename, surname, club, startTime, splitTimes) {
        var cumTimes = cumTimesFromSplitTimes(splitTimes);
        return new Competitor(order, forename, surname, club, startTime, splitTimes, cumTimes);
    };
    
    /**
    * Create and return a Competitor object where the competitor's times are given
    * as a list of cumulative split times.
    *
    * The first parameter (order) merely stores the order in which the competitor
    * appears in the given list of results.  Its sole use is to stabilise sorts of
    * competitors, as JavaScript's sort() method is not guaranteed to be a stable
    * sort.  However, it is not strictly the finishing order of the competitors,
    * as it has been known for them to be given not in the correct order.
    *
    * @param {Number} order - The position of the competitor within the list of results.
    * @param {string} forename - The forename of the competitor.
    * @param {string} surname - The surname of the competitor.
    * @param {string} club - The name of the competitor's club.
    * @param {string} startTime - The competitor's start time.
    * @param {Array} cumTimes - Array of cumulative split times, as numbers, with nulls for missed controls.
    */
    SplitsBrowser.Model.Competitor.fromCumTimes = function (order, forename, surname, club, startTime, cumTimes) {
        var splitTimes = splitTimesFromCumTimes(cumTimes);
        return new Competitor(order, forename, surname, club, startTime, splitTimes, cumTimes);
    };
    
    /**
    * Returns whether this competitor completed the course.
    * @return {boolean} Whether the competitor completed the course.
    */
    Competitor.prototype.completed = function () {
        return this.totalTime !== null;
    };
    
    /**
    * Returns an array of this competitor's split times.
    * @return {Array} Array of competitor's split times.
    */
    Competitor.prototype.getSplitTimes = function () {
        return this.splitTimes;
    };
    
    /**
    * Returns an array of this competitor's cumulative split times.
    * @return {Array} Array of competitor's cumulative split times.
    */
    Competitor.prototype.getCumulativeTimes = function() {
        return this.cumTimes;
    };

    /**
    * Return this competitor's cumulative times after being adjusted by a 'reference' competitor.
    * @param {Array} referenceCumTimes - The reference cumulative-split-time data to adjust by.
    * @return {Array} The array of adjusted data.
    */
    Competitor.prototype.getCumTimesAdjustedToReference = function (referenceCumTimes) {
        if (referenceCumTimes.length !== this.cumTimes.length) {
            SplitsBrowser.throwInvalidData("Cannot adjust competitor times because the numbers of times are different (" + this.cumTimes.length + " and " + referenceCumTimes.length + ")");
        } else if (referenceCumTimes.indexOf(null) > -1) {
            SplitsBrowser.throwInvalidData("Cannot adjust competitor times because a null value is in the reference data");
        }

        var adjustedTimes = this.cumTimes.map(function (time, idx) { return subtractIfNotNull(time, referenceCumTimes[idx]); });
        return adjustedTimes;
    };
})();