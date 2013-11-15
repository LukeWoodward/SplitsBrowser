(function (){
    "use strict";

    /**
     * Object that represents a collection of competitor data for a class.
     * @constructor.
     * @param {string} name - Name of the age class.
     * @param {Number} numControls - Number of controls.
     * @param {Array} competitors - Array of Competitor objects.
     */
    SplitsBrowser.Model.AgeClass = function (name, numControls, competitors) {
        this.name = name;
        this.numControls = numControls;
        this.competitors = competitors;
        this.course = null;
        
        this.competitors.forEach(function (comp) {
            comp.setClassName(this.name);
        }, this);
    };

    /**
    * Sets the course that this age class belongs to.
    * @param {SplitsBrowser.Model.Course} course - The course this class belongs to.
    */
    SplitsBrowser.Model.AgeClass.prototype.setCourse = function (course) {
        this.course = course;
    };
    
    /**
    * Returns the fastest split time recorded by competitors in this class.  If
    * no fastest split time is recorded (e.g. because all competitors
    * mispunched that control, or the class is empty), null is returned.
    * @param {Number} controlIdx - The index of the control to return the
    *      fastest split to.
    * @return {Object|null} Object containing the name and fastest split, or
    *      null if no split times for that control were recorded.
    */
    SplitsBrowser.Model.AgeClass.prototype.getFastestSplitTo = function (controlIdx) {
        if (typeof controlIdx !== "number" || controlIdx < 1 || controlIdx > this.numControls + 1) {
            SplitsBrowser.throwInvalidData("Cannot return splits to leg '" + this.numControls + "' in a course with " + this.numControls + " control(s)");
        }
    
        var fastestSplit = null;
        var fastestCompetitor = null;
        this.competitors.forEach(function (comp) {
            var compSplit = comp.getSplitTimeTo(controlIdx);
            if (compSplit !== null) {
                if (fastestSplit === null || compSplit < fastestSplit) {
                    fastestSplit = compSplit;
                    fastestCompetitor = comp;
                }
            }
        });
        
        return (fastestSplit === null) ? null : {split: fastestSplit, name: fastestCompetitor.name};
    };
    
    /**
    * Returns all competitors that visited the control in the given time
    * interval.
    * @param {Number} controlNum - The number of the control, with 0 being the
    *     start, and this.numControls + 1 being the finish.
    * @param {Number} intervalStart - The start time of the interval, as
    *     seconds past midnight.
    * @param {Number} intervalEnd - The end time of the interval, as seconds
    *     past midnight.
    * @return {Array} Array of objects listing the name and start time of each
    *     competitor visiting the control within the given time interval.
    */
    SplitsBrowser.Model.AgeClass.prototype.getCompetitorsAtControlInTimeRange = function (controlNum, intervalStart, intervalEnd) {
        if (typeof controlNum !== "number" || isNaN(controlNum) || controlNum < 0 || controlNum > this.numControls + 1) {
            SplitsBrowser.throwInvalidData("Control number must be a number between 0 and " + this.numControls + " inclusive");
        }
        
        var matchingCompetitors = [];
        this.competitors.forEach(function (comp) {
            var cumTime = comp.getCumulativeTimeTo(controlNum);
            if (cumTime !== null && comp.startTime !== null) {
                var actualTimeAtControl = cumTime + comp.startTime;
                if (intervalStart <= actualTimeAtControl && actualTimeAtControl <= intervalEnd) {
                    matchingCompetitors.push({name: comp.name, time: actualTimeAtControl});
                }
            }
        });
        
        return matchingCompetitors;
    };
})();