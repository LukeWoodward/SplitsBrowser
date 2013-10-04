/*
 * Namespace declarations that the rest of the code can depend upon.
 */
var SplitsBrowser = { Model: {}, Input: {}, Controls: {} };


(function () {
    "use strict";

    /**
     * Utility function used with filters that simply returns the object given.
     * @param x - Any input value
     * @returns The input value.
     */
    SplitsBrowser.isTrue = function (x) { return x; };

    /**
    * Utility function that returns whether a value is null.
    * @param x - Any input value.
    * @returns True if the value is not null, false otherwise.
    */
    SplitsBrowser.isNotNull = function (x) { return x !== null; };

    /**
    * Exception object raised if invalid data is passed.
    * @constructor.
    * @param {string} message - The exception detail message.
    */
    SplitsBrowser.InvalidData = function (message) {
        this.name = "InvalidData";
        this.message = message;
    };

    /**
    * Returns a string representation of this exception.
    * @returns {String} String representation.
    */
    SplitsBrowser.InvalidData.prototype.toString = function () {
        return this.name + ": " + this.message;
    };

    /**
    * Utility function to throw an 'InvalidData' exception object.
    * @param {string} message - The exception message.
    * @throws {InvalidData}
    */
    SplitsBrowser.throwInvalidData = function (message) {
        throw new SplitsBrowser.InvalidData(message);
    };

    /**
    * Formats a time period given as a number of seconds as a string in the form
    *  [-][h:]mm:ss.
    * @param {Number} seconds - The number of seconds.
    * @returns {string} The string formatting of the time.
    */
    SplitsBrowser.formatTime = function (seconds) {
        var result = "";
        if (seconds < 0) {
            result = "-";
            seconds = -seconds;
        }
        
        var hours = Math.floor(seconds / (60 * 60));
        var mins = Math.floor(seconds / 60) % 60;
        var secs = seconds % 60;
        if (hours > 0) {
            result += hours.toString() + ":";
        }
        
        if (mins < 10) {
            result += "0";
        }
        
        result += mins + ":";
        
        if (secs < 10) {
            result += "0";
        }
        
        result += secs;
        
        return result;
    };
})();


/* global SplitsBrowser, d3, $ */
(function (){
    "use strict";

    var _COMPETITOR_LIST_ID = "competitorList";
    var _COMPETITOR_LIST_ID_SELECTOR = "#" + _COMPETITOR_LIST_ID;

    /**
    * Object that controls a list of competitors from which the user can select.
    * @constructor
    * @param {HTMLElement} parent - Parent element to add this listbox to.
    */
    SplitsBrowser.Controls.CompetitorListBox = function (parent) {
        this.parent = parent;
        this.handler = null;
        this.competitorSelection = null;

        this.listDiv = d3.select(parent).append("div")
                                        .attr("id", _COMPETITOR_LIST_ID);
    };

    /**
    * Returns the width of the listbox, in pixels.
    * @returns {Number} Width of the listbox.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.width = function () {
        return $(_COMPETITOR_LIST_ID_SELECTOR).width();
    };

    /**
    * Handles a change to the selection of competitors, by highlighting all
    * those selected and unhighlighting all those no longer selected.
    * @param {Array} indexes - Array of indexes corresponding to selected
    *                          competitors.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.selectionChanged = function (indexes) {
        var outerThis = this;
        this.listDiv.selectAll("div.competitor")
                    .data(d3.range(this.competitorSelection.count))
                    .classed("selected", function (comp, index) { return outerThis.competitorSelection.isSelected(index); });
    };

    /**
    * Toggle the selectedness of a competitor.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.toggleCompetitor = function (index) {
        this.competitorSelection.toggle(index);
    };

    /**
    * Sets the list of competitors.
    * @param {Array} competitorData - Array of competitor data.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.setCompetitorList = function (competitorData) {

        $("div.competitor").off("click");
        
        var competitors = this.listDiv.selectAll("div.competitor").data(competitorData);
        var outerThis = this;

        competitors.enter().append("div")
                           .classed("competitor", true);

        competitors.text(function (comp) { return comp.name; });
        //         .on("click", function (comp, idx) { outerThis.toggleCompetitor(idx); });

        competitors.exit().remove();
        
        $("div.competitor").each(function (index, div) {
            $(div).on("click", function () { outerThis.toggleCompetitor(index); });
        });
    };

    /**
    * Sets the competitor selection object.
    * @param {SplitsBrowser.Controls.CompetitorSelection} selection - Competitor selection.
    */
    SplitsBrowser.Controls.CompetitorListBox.prototype.setSelection = function (selection) {
        if (this.competitorSelection !== null) {
            this.competitorSelection.deregisterChangeHandler(this.handler);
        }

        var outerThis = this;
        this.competitorSelection = selection;
        this.handler = function (indexes) { outerThis.selectionChanged(indexes); };
        this.competitorSelection.registerChangeHandler(this.handler);
        this.selectionChanged(d3.range(selection.count));
    };
})();


/* global SplitsBrowser, d3 */
(function (){
    "use strict";

    /*
    * An object that keeps track of the current selection of competitors, and
    * provides a notification mechanism for changes to the selection.
    */

    var _NUMBER_TYPE = typeof 0;

    /**
    * Represents the currently-selected competitors, and offers a callback
    * mechanism for when the selection changes.
    * @constructor
    * @param {Number} count - The number of competitors that can be chosen.
    */
    SplitsBrowser.Model.CompetitorSelection = function (count) {
        if (typeof (count) != _NUMBER_TYPE) {
            SplitsBrowser.throwInvalidData("Competitor count must be a number");
        } else if (count <= 0) {
            SplitsBrowser.throwInvalidData("Competitor count must be a positive number");
        }

        this.count = count;
        this.currentIndexes = [];
        this.changeHandlers = [];
    };

    /**
    * Returns whether the competitor at the given index is selected.
    * @param {Number} index - The index of the competitor.
    * @returns {boolean} True if the competitor is selected, false if not.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.isSelected = function (index) {
        return this.currentIndexes.indexOf(index) > -1;
    };

    /**
    * Fires all of the change handlers currently registered.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.fireChangeHandlers = function () {
        var outerThis = this;
        // Call slice(0) to return a copy of the list.
        this.changeHandlers.forEach(function (handler) { handler(outerThis.currentIndexes.slice(0)); });
    };

    /**
    * Select all of the competitors.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.selectAll = function () {
        this.currentIndexes = d3.range(this.count);
        this.fireChangeHandlers();
    };

    /**
    * Select none of the competitors.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.selectNone = function () {
        this.currentIndexes = [];
        this.fireChangeHandlers();
    };

    /**
    * Register a handler to be called whenever the list of indexes changes.
    *
    * When a change is made, this function will be called, with the array of
    * indexes being the only argument.  The array of indexes passed will be a
    * copy of that stored internally, so the handler is free to store this
    * array and/or modify it.
    *
    * If the handler has already been registered, nothing happens.
    *
    * @param {function} handler - The handler to register.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.registerChangeHandler = function (handler) {
        if (this.changeHandlers.indexOf(handler) == -1) {
            this.changeHandlers.push(handler);
        }
    };

    /**
    * Unregister a handler from being called when the list of indexes changes.
    *
    * If the handler given was never registered, nothing happens.
    *
    * @param {function} handler - The handler to register.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.deregisterChangeHandler = function (handler) {
        var index = this.changeHandlers.indexOf(handler);
        if (index > -1) {
            this.changeHandlers.splice(index, 1);
        }
    };

    /**
    * Toggles whether the competitor at the given index is selected.
    * @param {Number} index - The index of the competitor.
    */
    SplitsBrowser.Model.CompetitorSelection.prototype.toggle = function (index) {
        if (typeof (index) == _NUMBER_TYPE) {
            if (0 <= index && index < this.count) {
                var position = this.currentIndexes.indexOf(index);
                if (position == -1) {
                    this.currentIndexes.push(index);
                    this.currentIndexes.sort(d3.ascending);
                } else {
                    this.currentIndexes.splice(position, 1);
                }

                this.fireChangeHandlers();
            } else {
                SplitsBrowser.throwInvalidData("Index '" + index + "' is out of range");
            }
        } else {
            SplitsBrowser.throwInvalidData("Index is not a number");
        }
    };
})();


(function (){
    "use strict";

    /**
    * Given an array of numbers, return a list of the corresponding ranks of those
    * numbers.
    * @param {Array} sourceData - Array of number values.
    * @returns Array of corresponding ranks.
    */
    SplitsBrowser.getRanks = function (sourceData) {
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
    };

    /**
    * Return the values in the given array indexed by the given values.
    * @param {Array} data - Array of data values.
    * @param {Array} indexes - Array of indexes.
    * @returns Array of values indexed by the given values.
    */
    SplitsBrowser.selectByIndexes = function (data, indexes) {
        if (typeof data === "undefined") {
            throw new TypeError("data is undefined");
        }
        
        return indexes.map(function(index) { return data[index]; });
    };

    /**
    * Represents an object that can determine split times and ranks.
    * @constructor
    * @param {SplitsBrowser.Model.CourseData} courseData - The course data.
    * @param {SplitsBrowser.Model.CompetitorData} reference -
    *     Reference competitor that times are compared against.
    */
    SplitsBrowser.Model.CompetitorSplitInfo = function(courseData, reference) {
        this.courseData = courseData;
        this.reference = reference;
        
        // The null values are sentinel values for control 0 (the start).
        this.splitsPerControl = [null];
        this.splitRanksPerControl = [null];
        this.cumulativeTimesPerControl = [null];
        this.cumulativeRanksPerControl = [null];
        this.timesBehindReferencePerControl = [null];
        this.computeTimesAndRanks();
    };

    /**
    * Compute all of the split and total times and their ranks.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.computeTimesAndRanks = function() {
        
        var workingTotalTimesByCompetitor = new Array(this.courseData.competitorData.length);
        for (var i = 0; i < workingTotalTimesByCompetitor.length; i += 1) {
            workingTotalTimesByCompetitor[i] = 0;
        }
        
        var outerThis = this;
        d3.range(1, this.courseData.numControls + 2).forEach(function (controlIndex) {
            var splitsByCompetitor = outerThis.courseData.competitorData.map(function(comp) { return comp.times[controlIndex - 1]; });
            outerThis.splitsPerControl.push(splitsByCompetitor);
            
            var splitRanksByCompetitor = SplitsBrowser.getRanks(splitsByCompetitor);
            outerThis.splitRanksPerControl.push(splitRanksByCompetitor);
            
            workingTotalTimesByCompetitor = d3.zip(workingTotalTimesByCompetitor, splitsByCompetitor).map(function (pair) { return pair[0] + pair[1]; });
            outerThis.cumulativeTimesPerControl.push(workingTotalTimesByCompetitor);
            
            var totalTimeRanksByCompetitor = SplitsBrowser.getRanks(workingTotalTimesByCompetitor);
            outerThis.cumulativeRanksPerControl.push(totalTimeRanksByCompetitor);
            
            var timesBehindReference = splitsByCompetitor.map(function (time) { return time - outerThis.reference.times[controlIndex - 1]; });
            outerThis.timesBehindReferencePerControl.push(timesBehindReference);
        });
    };

    /**
    * Returns the splits for a number of competitors at a given control.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of split times for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getSplits = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : SplitsBrowser.selectByIndexes(this.splitsPerControl[controlIndex], indexes);
    };

    /**
    * Returns the split-time ranks for a number of competitors at a given control.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of split-time ranks for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getSplitRanks = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : SplitsBrowser.selectByIndexes(this.splitRanksPerControl[controlIndex], indexes);
    };

    /**
    * Returns the cumulative times for a number of competitors up to a given control.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of cumulative times for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getCumulativeTimes = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : SplitsBrowser.selectByIndexes(this.cumulativeTimesPerControl[controlIndex], indexes);
    };

    /**
    * Returns the cumulative-time ranks for a number of competitors at a given control.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of cumulative-time ranks for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getCumulativeRanks = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : SplitsBrowser.selectByIndexes(this.cumulativeRanksPerControl[controlIndex], indexes);
    };

    /**
    * Returns the times behind the reference at a given control for a number of competitors.
    * @param {Number} controlIndex - The index of the control.
    * @param {Array} indexes - Indexes of the competitors required.
    * @returns {Array} Array of times-behind-reference for the given competitors.
    */
    SplitsBrowser.Model.CompetitorSplitInfo.prototype.getTimesBehindReference = function (controlIndex, indexes) {
        return (controlIndex === 0) ? null : SplitsBrowser.selectByIndexes(this.timesBehindReferencePerControl[controlIndex], indexes);
    };
})();


(function (){
    "use strict";

    /**
    * A control that wraps a drop-down list used to choose between course.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.CourseSelector = function(parent) {
        this.changeHandlers = [];
        
        var span = d3.select(parent).append("span");
        span.text("Course: ");
        var outerThis = this;
        this.dropDown = span.append("select").node();
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });
        
        this.setCourses([]);
    };

    /**
    * Sets the list of courses that this selector can choose between.
    * 
    * If there are no courses, a 'dummy' entry is added
    * @param {Array} courses - Array of CourseData objects containing course data.
    */
    SplitsBrowser.Controls.CourseSelector.prototype.setCourses = function(courses) {
        if ($.isArray(courses)) {
            var options;
            if (courses.length === 0) {
                this.dropDown.disabled = true;
                options = ["[No courses loaded]"];
            } else {
                this.dropDown.disabled = false;
                options = courses.map(function(course) { return course.course; });
            }
            
            var optionsList = d3.select(this.dropDown).selectAll("option").data(options);
            optionsList.enter().append("option");
            
            optionsList.attr("value", function(_value, index) { return index.toString(); })
                       .text(function(value) { return value; });
                       
            optionsList.exit().remove();
        } else {
            SplitsBrowser.throwInvalidData("CourseSelector.setCourses: courses is not an array");
        }
    };

    /**
    * Add a change handler to be called whenever the selected course is changed.
    *
    * The index of the newly-selected item is passed to each handler function.
    *
    * @param {Function} handler - Handler function to be called whenever the course
    *                   changes.
    */
    SplitsBrowser.Controls.CourseSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Handle a change of the selected option in the drop-down list.
    */
    SplitsBrowser.Controls.CourseSelector.prototype.onSelectionChanged = function() {
        var outerThis = this;
        this.changeHandlers.forEach(function(handler) { handler(outerThis.dropDown.selectedIndex); });
    };
})();


(function () {
    "use strict";

    /*
     * Functions for reading in 'plain' CSV files.
     */


    SplitsBrowser.Input.CSV = {

        /**  
        * Parse a time of the form MM:SS into a number of seconds.
        * @param {string} time - The time of the form MM:SS.
        * @return {Number} The number of seconds.
        */
        parseCompetitorTime: function (time) {
            if (time.match(/^\d\d:\d\d$/)) {
                return parseInt(time.substring(0, 2), 10) * 60 + parseInt(time.substring(3), 10);
            } else {
                // TODO how are missing values represented, if at all?  At the moment,
                // anything unrecognised is simply nulled out.
                return null;
            }
        },

        /**
        * Parse a row of competitor data.
        * @param {Number} index - Index of the competitor line.
        * @param {string} line - The line of competitor data read from a CSV file.
        * @param {Number} controlCount - The number of controls (not including the finish).
        * @return {SplitsBrowser.Model.CompetitorData} Object representing the competitor data read in.
        */
        parseCompetitorData: function (index, line, controlCount) {
            // Expect forename, surname, club, start time then (controlCount + 1) times in the form MM:SS.
            var parts = line.split(",");
            if (parts.length === controlCount + 5) {
                var forename = parts.shift();
                var surname = parts.shift();
                var club = parts.shift();
                var startTime = parts.shift();
                var times = parts.map(SplitsBrowser.Input.CSV.parseCompetitorTime);
                return new SplitsBrowser.Model.CompetitorData(index + 1, forename, surname, club, startTime, times);
            } else {
                SplitsBrowser.throwInvalidData("Expected " + (controlCount + 5) + " items in row for competitor on course with " + controlCount + " controls, got " + (parts.length) + " instead.");
            }
        },

        /**
        * Parse CSV data for a course.
        * @param {string} courseData - The string containing data for that course.
        * @return {SplitsBrowser.Model.CourseData} Parsed course data.
        */
        parseCourseData: function (courseData) {
            var lines = courseData.split("\r\n").filter(SplitsBrowser.isTrue);
            if (lines.length === 0) {
                SplitsBrowser.throwInvalidData("parseCourseData got an empty list of lines");
            }

            var firstLineParts = lines.shift().split(",");
            if (firstLineParts.length === 2) {
                var courseName = firstLineParts.shift();
                var controlCountStr = firstLineParts.shift();
                var controlCount = parseInt(controlCountStr, 10);
                if (isNaN(controlCount)) {
                    SplitsBrowser.throwInvalidData("Could not read control count: '" + controlCountStr + "'");
                } else if (controlCount < 0) {
                    SplitsBrowser.throwInvalidData("Expected a positive control count, got " + controlCount + " instead");
                } else {
                    var competitorData = lines.map(function (line, index) { return SplitsBrowser.Input.CSV.parseCompetitorData(index, line, controlCount); });
                    competitorData.sort(SplitsBrowser.Model.compareCompetitors);
                    return new SplitsBrowser.Model.CourseData(courseName, controlCount, competitorData);
                }
            } else {
                SplitsBrowser.throwInvalidData("Expected first line to have two parts (course name and number of controls), got " + firstLineParts.length + " part(s) instead");
            }
        },

        /**
        * Parse CSV data for an entire event.
        * @param {string} eventData - String containing the entire event data.
        * @return {Array} Array of CourseData objects.
        */
        parseEventData: function (eventData) {
            var courseDatas = eventData.split("\r\n\r\n").map($.trim).filter(SplitsBrowser.isTrue);
            return courseDatas.map(SplitsBrowser.Input.CSV.parseCourseData);
        }
    };
})();


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
    * @param {SplitsBrowser.Model.CompetitorData} a - One competitor to compare.
    * @param {SplitsBrowser.Model.CompetitorData} b - The other competitor to compare.
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
     * Object that represents the data for a single competitor.
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
     * @param {Array} times - Array of split times, as numbers, with nulls for missed controls.
     */
    SplitsBrowser.Model.CompetitorData = function (order, forename, surname, club, startTime, times) {

        if (typeof (order) !== _NUMBER_TYPE) {
            SplitsBrowser.throwInvalidData("Competitor order must be a number, got " + typeof order + " '" + order + "' instead");
        } else if (!$.isArray(times)) {
            throw new TypeError("times must be an array - got " + typeof (times) + " instead");
        }

        this.order = order;
        this.forename = forename;
        this.surname = surname;
        this.club = club;
        this.startTime = startTime;
        this.times = times;

        this.name = forename + " " + surname;
        this.totalTime = (times.indexOf(null) > -1) ? null : d3.sum(times);
    };

    /**
    * Adjust this competitor's data to a given 'reference' competitor, such as the
    * winner, or the imaginary 'fastest' runner who has the fastest splits on each
    * leg.
    * @param {SplitsBrowser.Model.CompetitorData} reference - The reference data to adjust by.
    * @return {SplitsBrowser.Model.CompetitorData} 
    */
    SplitsBrowser.Model.CompetitorData.prototype.adjustToReference = function (reference) {
        if (typeof (reference.times) === "undefined") {
            SplitsBrowser.throwInvalidData("Cannot adjust competitor times because reference object does not have times (is it a competitor object?)");
        } else if (reference.times.length !== this.times.length) {
            SplitsBrowser.throwInvalidData("Cannot adjust competitor times because the numbers of times are different (" + this.times.length + " and " + reference.times.length + ")");
        } else if (reference.times.indexOf(null) > -1) {
            SplitsBrowser.throwInvalidData("Cannot adjust a competitor time by a competitor with missing times");
        }

        var adjustedTimes = this.times.map(function (time, idx) { return (time === null) ? null : (time - reference.times[idx]); });
        return new SplitsBrowser.Model.CompetitorData(this.order, this.forename, this.surname, this.club, this.startTime, adjustedTimes);
    };

    /**
    * Return cumulative times for this competitor.
    *
    * If the competitor missed a control, the corresponding item in the
    * cumulative sum is null, but the cumulative sum continues on in the next
    * time as if the time was null.
    * @returns {Array} Array of cumulative times, in seconds.
    */
    SplitsBrowser.Model.CompetitorData.prototype.getCumulativeTimes = function() {
        var totalTime = 0;
        var cumulativeTimes = new Array(this.times.length + 1);
        cumulativeTimes[0] = 0;
        for (var i = 0; i < this.times.length; ++i) {
            if (this.times[i] === null) {
                cumulativeTimes[i + 1] = null;
            } else {
                totalTime += this.times[i];
                cumulativeTimes[i + 1] = totalTime;
            }
        }

        return cumulativeTimes;
    };

    /**
     * Object that represents a collection of competitor data for a course.
     * @constructor.
     * @param {string} course - Name of the course.
     * @param {Number} numControls - Number of controls.
     * @param {Array} competitorData - Array of CompetitorData objects.
     */
    SplitsBrowser.Model.CourseData = function (course, numControls, competitorData) {
        this.course = course;
        this.numControls = numControls;
        this.competitorData = competitorData;
    };

    /**
    * Return whether this course is empty, i.e. has no competitors.
    * @returns {boolean} True if course empty, false if course not empty.
    */
    SplitsBrowser.Model.CourseData.prototype.isEmpty = function () {
        return this.competitorData.length === 0;
    };

    /**
    * Return the name of the competitor at the given index.
    * @param {Number} index - The index of the competitor within the list of all of them.
    * @returns {string} Name of the competitor.
    */
    SplitsBrowser.Model.CourseData.prototype.getCompetitorName = function (index) {
        return this.competitorData[index].name;
    };

    /**
    * Adjust the data to a given 'reference' competitor, such as the winner,
    * or the imaginary 'fastest' runner who has the fastest splits on each
    * leg.
    * @param {SplitsBrowser.Model.CompetitorData} reference - The reference data to adjust by.
    */
    SplitsBrowser.Model.CourseData.prototype.adjustToReference = function (reference) {
        var adjustedData = this.competitorData.map(function (competitor) { return competitor.adjustToReference(reference); });
        return new SplitsBrowser.Model.CourseData(this.course, this.numControls, adjustedData);
    };

    /**
    * Return the 'winner' of this course, i.e. the competitor with the fastest
    * total time.  If there are no competitors that have completed the course,
    * null is returned. 
    * @returns {SplitsBrowser.Model.Competitor|null} Winning competitor, if any.
    */
    SplitsBrowser.Model.CourseData.prototype.getWinner = function () {
        var completed = this.competitorData.filter(function (comp) { return comp.totalTime !== null; });
        if (completed.length === 0) {
            return null;
        } else {
            var winner = completed[0];
            for (var i = 1; i < completed.length; ++i) {
                if (completed[i].totalTime < winner.totalTime) {
                    winner = completed[i];
                }
            }

            return winner;
        }
    };

    /**
    * Return the imaginary competitor who recorded the fastest time on each leg
    * of the course.
    * If at least one control has no competitors punching it, null is returned.
    * @returns {SplitsBrowser.Model.Competitor|null} Imaginary competitor with
    *           fastest time, if any.
    */
    SplitsBrowser.Model.CourseData.prototype.getFastestTime = function () {
        return this.getFastestTimePlusPercentage(0);
    };

    /**
    * Return the imaginary competitor who recorded the fastest time on each leg
    * of the course, with a given percentage of their time added.
    * If at least one control has no competitors punching it, null is returned.
    * @param {Number} percent - The percentage of time to add.
    * @returns {SplitsBrowser.Model.Competitor|null} Imaginary competitor with
    *           fastest time, if any.
    */
    SplitsBrowser.Model.CourseData.prototype.getFastestTimePlusPercentage = function (percent) {
        var ratio = 1 + percent / 100;
        var fastestTimes = new Array(this.numControls + 1);
        for (var i = 0; i <= this.numControls; ++i) {
            var fastestForThisControl = null;
            for (var j = 0; j < this.competitorData.length; ++j) {
                var thisTime = this.competitorData[j].times[i];
                if (thisTime !== null && (fastestForThisControl === null || thisTime < fastestForThisControl)) {
                    fastestForThisControl = thisTime;
                }
            }

            if (fastestForThisControl === null) {
                // No fastest time recorded for this control.
                return null;
            } else {
                fastestTimes[i] = fastestForThisControl * ratio;
            }
        }

        return new SplitsBrowser.Model.CompetitorData(0, "Fastest time", "Fastest time", "", "", fastestTimes);
    };

    /**
    * Return data from this course in a form suitable for plotting in a chart.
    * This is in a form suitable for use with the chart.
    * @param {SplitsBrowser.Model.CompetitorData} referenceData - 'Reference'
    *        competitor data (such as winner, or fastest time).
    * @param {Number} currentIndexes - Array of indexes that indicate which
                competitors from the overall list are plotted.
    * @returns {Array} Array of data.
    */
    SplitsBrowser.Model.CourseData.prototype.getChartData = function (referenceData, currentIndexes) {
        if (this.isEmpty()) {
            SplitsBrowser.throwInvalidData("Cannot return data as columns when there is no data");
        } else if (typeof referenceData === "undefined") {
            throw new TypeError("referenceData object undefined or missing");
        }

        // Cumulative times adjusted by the reference, for each competitor.
        var adjustedCompetitorData = this.adjustToReference(referenceData).competitorData;
        var selectedCompetitorData = currentIndexes.map(function (index) { return adjustedCompetitorData[index]; });
        var cumulativeTimesByCompetitor = selectedCompetitorData.map(function (compData) { return compData.getCumulativeTimes(); });

        var xMax = d3.sum(referenceData.times);
        var yMin;
        var yMax;
        if (currentIndexes.length === 0) {
            // No competitors selected.  Set yMin and yMax to the boundary
            // values of the first competitor.
            var firstCompetitorTimes = adjustedCompetitorData[0].getCumulativeTimes();
            yMin = d3.min(firstCompetitorTimes);
            yMax = d3.max(firstCompetitorTimes);
        } else {
            yMin = d3.min(cumulativeTimesByCompetitor.map(function (values) { return d3.min(values); }));
            yMax = d3.max(cumulativeTimesByCompetitor.map(function (values) { return d3.max(values); }));
        }

        if (yMax === yMin) {
            // yMin and yMax will be used to scale a y-axis, so we'd better
            // make sure that they're not equal.
            yMax = yMin + 1;
        }

        var cumulativeTimesByControl = d3.transpose(cumulativeTimesByCompetitor);
        var zippedData = d3.zip(referenceData.getCumulativeTimes(), cumulativeTimesByControl);
        return {
            dataColumns: zippedData.map(function (data) { return { x: data[0], ys: data[1] }; }),
            competitorNames: selectedCompetitorData.map(function (competitor) { return competitor.name; }),
            numControls: this.numControls,
            xExtent: [0, xMax],
            yExtent: [yMin, yMax]
        };
    };
})();


(function () {
    "use strict";

    var _STATISTIC_SELECTOR_ID = "statisticSelector";

    var _LABEL_ID_PREFIX = "statisticCheckbox";

    var _STATISTIC_NAMES = ["Total time", "Split time", "Behind fastest"];

    /**
    * Control that contains a number of checkboxes for enabling and/or disabling
    * the display of various statistics.
    * @constructor
    * @param {HTMLElement} parent - The parent element.
    */
    SplitsBrowser.Controls.StatisticsSelector = function (parent) {
        this.span = d3.select(parent).append("span")
                                     .attr("id", _STATISTIC_SELECTOR_ID);   

        var childSpans = this.span.selectAll("span")
                                  .data(_STATISTIC_NAMES)
                                  .enter()
                                  .append("span");
         
        childSpans.append("input")
                  .attr("type", "checkbox")
                  .attr("id", function(val, index) { return _LABEL_ID_PREFIX + index; });
                  
        childSpans.append("label")
                  .attr("for", function(val, index) { return _LABEL_ID_PREFIX + index; })
                  .text(function(name) { return name; });
        
        var outerThis = this;
        $("input", this.span.node()).bind("change", function () { return outerThis.onCheckboxChanged(); });
                   
        this.handlers = [];
    };

    /**
    * Register a change handler to be called whenever the choice of currently-
    * visible statistics is changed.
    *
    * If the handler was already registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    SplitsBrowser.Controls.StatisticsSelector.prototype.registerChangeHandler = function (handler) {
        if (this.handlers.indexOf(handler) === -1) {
            this.handlers.push(handler);
        }
    };
       
    /**
    * Deregister a change handler from being called whenever the choice of
    *  currently-visible statistics is changed.
    *
    * If the handler given was never registered, nothing happens.
    * @param {Function} handler - Function to be called whenever the choice
    *                             changes.
    */
    SplitsBrowser.Controls.StatisticsSelector.prototype.deregisterChangeHandler = function (handler) {
        var index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    };

    /**
    * Return the statistics that are currently enabled.
    * @returns {Array} Array of booleans corresponding to enabled statistics.
    */
    SplitsBrowser.Controls.StatisticsSelector.prototype.getVisibleStatistics = function () {
        return this.span.selectAll("input")[0].map(function (checkbox) { return checkbox.checked; });
    };

    /**
    * Handles the change in state of a checkbox, by firing all of the handlers.
    */
    SplitsBrowser.Controls.StatisticsSelector.prototype.onCheckboxChanged = function () {
        var checkedFlags = this.getVisibleStatistics();
        this.handlers.forEach(function (handler) { handler(checkedFlags); });
    };
})();


(function (){
    "use strict";
    
    var _ALL_COMPARISON_OPTIONS = [
        { name: "Winner", selector: function (courseData) { return courseData.getWinner(); } },
        { name: "Fastest time", selector: function (courseData) { return courseData.getFastestTime(); } }
    ];
    
    // All 'Fastest time + N %' values (not including zero, of course).
    var _FASTEST_PLUS_PERCENTAGES = [5, 25, 50, 100];
    
    _FASTEST_PLUS_PERCENTAGES.forEach(function (percent) {
        _ALL_COMPARISON_OPTIONS.push({
            name: "Fastest time + " + percent + "%",
            selector: function (courseData) { return courseData.getFastestTimePlusPercentage(percent); }
        });
    });
    
    _ALL_COMPARISON_OPTIONS.push({ name: "Any runner..." });
    
    // Default selected index of the comparison function.
    var _DEFAULT_COMPARISON_INDEX = 1; // 1 = fastest time.
    
    // The id of the comparison selector.
    var _COMPARISON_SELECTOR_ID = "comparisonSelector";
    
    // The id of the runner selector
    var _RUNNER_SELECTOR_ID = "runnerSelector";

    /**
    * A control that wraps a drop-down list used to choose what to compare
    * times against.
    * @param {HTMLElement} parent - The parent element to add the control to.
    */
    SplitsBrowser.Controls.ComparisonSelector = function(parent) {
        this.changeHandlers = [];
        this.courses = null;
        
        var span = d3.select(parent).append("span");
        span.text("Compare with ");
        var outerThis = this;
        this.dropDown = span.append("select")
                            .attr("id", _COMPARISON_SELECTOR_ID)
                            .node();
                            
        $(this.dropDown).bind("change", function() { outerThis.onSelectionChanged(); });

        var optionsList = d3.select(this.dropDown).selectAll("option")
                                                  .data(_ALL_COMPARISON_OPTIONS);
        optionsList.enter().append("option");
        
        optionsList.attr("value", function (_opt, index) { return index.toString(); })
                   .text(function (opt) { return opt.name; });
                   
        optionsList.exit().remove();
        
        this.runnerSpan = d3.select(parent).append("span")
                                           .style("display", "none")
                                           .style("padding-left", "20px");
        
        this.runnerSpan.text("Runner: ");
        
        this.runnerDropDown = this.runnerSpan.append("select")
                                             .attr("id", _RUNNER_SELECTOR_ID)
                                             .node();
        $(this.runnerDropDown).bind("change", function () { outerThis.onSelectionChanged(); });
        
        this.dropDown.selectedIndex = _DEFAULT_COMPARISON_INDEX;
    };

    /**
    * Add a change handler to be called whenever the selected course is changed.
    *
    * The function used to return the comparison result is returned.
    *
    * @param {Function} handler - Handler function to be called whenever the course
    *                   changes.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.registerChangeHandler = function(handler) {
        if (this.changeHandlers.indexOf(handler) === -1) {
            this.changeHandlers.push(handler);
        }    
    };

    /**
    * Returns whether the 'Any Runner...' option is selected.
    * @return Whether the 'Any Runner...' option is selected.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.isAnyRunnerSelected = function () {
        return this.dropDown.selectedIndex === _ALL_COMPARISON_OPTIONS.length - 1;
    };
    
    /**
    * Sets the list of courses.
    * @param {Array} courses - Array of CourseData objects.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.setCourses = function (courses) {
        var wasNull = (this.courses === null);
        this.courses = courses;
        
        if (wasNull && this.courses !== null && this.courses.length > 0) {
            this.setRunnersFromCourse(0);
        }
    };
    
    /**
    * Handles a change of selected course, by updating the list of runners that
    * can be chosen from.
    * @param {Number} courseIndex - The index of the chosen course among the
    *     list of them.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.updateRunnerList = function (courseIndex) {
        if (this.courses !== null && 0 <= courseIndex && courseIndex < this.courses.length) {
            this.setRunnersFromCourse(courseIndex);
        }
    };

    /**
    * Populates the list of runners in the Runner drop-down.
    * @param {Number} courseIndex - Index of the course among the list of all
    *      courses.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.setRunnersFromCourse = function (courseIndex) {
        var optionsList = d3.select(this.runnerDropDown).selectAll("option")
                                                        .data(this.courses[courseIndex].competitorData);
        
        optionsList.enter().append("option");
        optionsList.attr("value", function (_comp, compIndex) { return compIndex.toString(); })
                   .text(function (comp) { return comp.name; });
        optionsList.exit().remove();
        
        this.runnerDropDown.selectedIndex = 0;
    };
    
    /**
    * Returns the function that compares a competitor's splits against some
    * reference data.
    * @return {Function} Comparison function.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.getComparisonFunction = function () {
        if (this.isAnyRunnerSelected()) {
            var runnerIndex = Math.max(this.runnerDropDown.selectedIndex, 0);
            return function (courseData) { return courseData.competitorData[runnerIndex]; };
        } else {
            return _ALL_COMPARISON_OPTIONS[this.dropDown.selectedIndex].selector;
        }
    };
    
    /**
    * Handle a change of the selected option in either drop-down list.
    */
    SplitsBrowser.Controls.ComparisonSelector.prototype.onSelectionChanged = function() {
        this.runnerSpan.style("display", (this.isAnyRunnerSelected()) ? "" : "none");
        var outerThis = this;
        this.changeHandlers.forEach(function (handler) { handler(outerThis.getComparisonFunction()); });
    };
})();


/* global SplitsBrowser, d3, $ */

(function (){
    "use strict";

    var _TEXT_SIZE_ELEMENT_ID = "sb-text-size-element";
    var _TEXT_SIZE_ELEMENT_ID_SELECTOR = "#" + _TEXT_SIZE_ELEMENT_ID;

    var _CHART_SVG_ID = "chart";
    var _CHART_SVG_ID_SELECTOR = "#" + _CHART_SVG_ID;

    var margin = { top: 20, right: 20, bottom: 30, left: 50 };

    var legendLineWidth = 10;

    var SPACER = "\xa0\xa0\xa0\xa0";

    var colours = [
        "red", "blue", "green", "black", "#CC0066", "#000099", "#FFCC00", "#996600",
        "#9900FF", "#CCCC00", "#FFFF66",  "#CC6699", "#99FF33", "#3399FF",
        "#CC33CC", "#33FFFF", "#FF00FF"
    ];

    var backgroundColour1 = '#EEEEEE';
    var backgroundColour2 = '#DDDDDD';

    /**
    * Format a time and a rank as a string, with the split time in mm:ss or h:mm:ss
    * as appropriate.
    * @param {Number} time - The time, in seconds.
    * @param {Number} rank - The rank.
    * @returns Time and rank formatted as a string.
    */
    function formatTimeAndRank(time, rank) {
        return SPACER + SplitsBrowser.formatTime(time) + " (" + rank + ")";
    }

    /**
    * A chart object in a window.
    * @constructor
    * @param {HTMLElement} parent - The parent object to create the element within.
    */
    SplitsBrowser.Controls.Chart = function (parent) {
        this.parent = parent;

        this.xScale = null;
        this.yScale = null;
        this.yScaleMinutes = null;
        this.overallWidth = -1;
        this.overallHeight = -1;
        this.contentWidth = -1;
        this.contentHeight = -1;
        this.numControls = -1;
        this.selectedIndexes = [];
        this.names = [];
        this.cumTimes = [];
        
        this.isMouseIn = false;
        
        // The position the mouse cursor is currently over, or null for not over
        // the charts.
        this.currentControlIndex = null;
        
        this.controlLine = null;

        this.svg = d3.select(this.parent).append("svg")
                                         .attr("id", _CHART_SVG_ID);
        this.svgGroup = this.svg.append("g")
                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                                         
        var outerThis = this;
        $(this.svg.node()).mouseenter(function(event) { outerThis.onMouseEnter(event); })
                          .mousemove(function(event) { outerThis.onMouseMove(event); })
                          .mouseleave(function(event) { outerThis.onMouseLeave(event); });

        // Add an invisible text element used for determining text size.
        this.svg.append("text").attr("fill", "transparent").attr("id", _TEXT_SIZE_ELEMENT_ID);
    };

    /**
    * Handle the mouse entering the chart.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseEnter = function() {
        this.isMouseIn = true;
    };

    /**
    * Handle a mouse movement.
    * @param {EventObject} event - The event object.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseMove = function(event) {
        if (this.isMouseIn && this.xScale !== null) {
            var svgNodeAsJQuery = $(this.svg.node());
            var offset = svgNodeAsJQuery.offset();
            var xOffset = event.pageX - offset.left;
            var yOffset = event.pageY - offset.top;
            
            if (margin.left <= xOffset && xOffset < svgNodeAsJQuery.width() - margin.right && 
                margin.top <= yOffset && yOffset < svgNodeAsJQuery.height() - margin.bottom) {
                // In the chart.
                // Get the time offset that the mouse is currently over.
                var chartX = this.xScale.invert(xOffset - margin.left);
                var bisectIndex = d3.bisect(this.cumTimes, chartX);
                
                // bisectIndex is the index at which to insert chartX into cumTimes
                // in order to keep the array sorted.  So if this index is N, the
                // mouse is between N - 1 and N.  Find which is nearer.
                var controlIndex;
                if (bisectIndex >= this.cumTimes.length) {
                    // Off the right-hand end, use the finish.
                    controlIndex = this.numControls + 1;
                } else {
                    var diffToNext = Math.abs(this.cumTimes[bisectIndex] - chartX);
                    var diffToPrev = Math.abs(chartX - this.cumTimes[bisectIndex - 1]);
                    controlIndex = (diffToPrev < diffToNext) ? bisectIndex - 1 : bisectIndex;
                }
                
                if (this.currentControlIndex === null || this.currentControlIndex !== controlIndex) {
                    // The control line has appeared for ths first time or has moved, so redraw it.
                    this.removeControlLine();
                    this.drawControlLine(controlIndex);
                }
            } else {
                // In the SVG element but outside the chart area.
                this.removeControlLine();
            }
        }
    };

    /**
    * Handle the mouse leaving the chart.
    */
    SplitsBrowser.Controls.Chart.prototype.onMouseLeave = function() {
        this.isMouseIn = false;
        this.removeControlLine();
    };

    /**
    * Draw a 'control line'.  This is a vertical line running the entire height of
    * the chart, at one of the controls.
    * @param {Number} controlIndex - The index of the control at which to draw the
    *                                control line.
    */
    SplitsBrowser.Controls.Chart.prototype.drawControlLine = function(controlIndex) {
        this.currentControlIndex = controlIndex;
        this.updateCompetitorStatistics();    
        var xPosn = this.xScale(this.cumTimes[controlIndex]);
        this.controlLine = this.svgGroup.append("line")
                                        .attr("x1", xPosn)
                                        .attr("y1", 0)
                                        .attr("x2", xPosn)
                                        .attr("y2", this.contentHeight)
                                        .attr("class", "controlLine")
                                        .node();
    };

    /**
    * Remove any previously-drawn control line.  If no such line existed, nothing
    * happens.
    */
    SplitsBrowser.Controls.Chart.prototype.removeControlLine = function() {
        this.currentControlIndex = null;
        this.updateCompetitorStatistics();
        if (this.controlLine !== null) {
            d3.select(this.controlLine).remove();
            this.controlLine = null;
        }
    };

    /**
    * Updates the statistics text shown after the competitor.
    */
    SplitsBrowser.Controls.Chart.prototype.updateCompetitorStatistics = function() {
            
        var labelTexts = this.names;
        if (this.currentControlIndex !== null && this.currentControlIndex > 0) {
            if (this.visibleStatistics[0]) {
                var cumTimes = this.splitInfo.getCumulativeTimes(this.currentControlIndex, this.selectedIndexes);
                var cumRanks = this.splitInfo.getCumulativeRanks(this.currentControlIndex, this.selectedIndexes);
                labelTexts = d3.zip(labelTexts, cumTimes, cumRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
                           
            if (this.visibleStatistics[1]) {
                var splitTimes = this.splitInfo.getSplits(this.currentControlIndex, this.selectedIndexes);
                var splitRanks = this.splitInfo.getSplitRanks(this.currentControlIndex, this.selectedIndexes);
                labelTexts = d3.zip(labelTexts, splitTimes, splitRanks)
                               .map(function(triple) { return triple[0] + formatTimeAndRank(triple[1], triple[2]); });
            }
             
            if (this.visibleStatistics[2]) {
                var timesBehind = this.splitInfo.getTimesBehindReference(this.currentControlIndex, this.selectedIndexes);
                labelTexts = d3.zip(labelTexts, timesBehind)
                               .map(function(pair) { return pair[0] + SPACER + SplitsBrowser.formatTime(pair[1]); });
            }
        }
           
        d3.selectAll("text.competitorLabel").data(labelTexts)
                                            .text(function (labelText) { return labelText; });
    };

    /**
    * Returns a tick-formatting function that formats the label of a tick on the
    * top X-axis.
    *
    * The function returned is suitable for use with the D3 axis.tickFormat method.
    * This label is "S" for index 0 (the start), "F" for the finish, and
    * the control number for intermediate controls.
    *
    * @returns {function} Tick-formatting function.
    */
    SplitsBrowser.Controls.Chart.prototype.getTickFormatter = function () {
        var outerThis = this;
        return function (value, idx) {
            return (idx === 0) ? "S" : ((idx === outerThis.numControls + 1) ? "F" : idx.toString());
        };
    };

    /**
    * Get the width of a piece of text.
    * @param {string} text - The piece of text to measure the width of.
    * @returns {Number} The width of the piece of text, in pixels. 
    */
    SplitsBrowser.Controls.Chart.prototype.getTextWidth = function (text) {
        return d3.select(_TEXT_SIZE_ELEMENT_ID_SELECTOR).text(text).node().getBBox().width;
    };

    /**
    * Gets the height of a piece of text.
    *
    * @param {string} text - The piece of text to measure the height of.
    * @returns {Number} The height of the piece of text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getTextHeight = function (text) {
        return d3.select(_TEXT_SIZE_ELEMENT_ID_SELECTOR).text(text).node().getBBox().height;
    };

    /**
    * Return the maximum width of the end-text shown to the right of the graph.
    *
    * This function considers only the competitors whose indexes are in the
    * list given.  This method returns zero if the list is empty.
    * @returns {Number} Maximum width of text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxGraphEndTextWidth = function () {
        if (this.selectedIndexes.length === 0 || this.names.length === 0) {
            // No competitors selected or no names yet.  Avoid problems caused
            // by trying to find the maximum of an empty array.
            return 0;
        } else {
            var outerThis = this;
            var nameWidths = this.names.map(function (name) { return outerThis.getTextWidth(name); });
            return d3.max(nameWidths) + this.determineMaxStatisticTextWidth();
        }
    };

    /**
    * Return the maximum width of a piece of time and rank text shown to the right
    * of each competitor 
    * @param {string} timeFuncName - Name of the function to call to get the time
                                     data.
    * @param {string} rankFuncName - Name of the function to call to get the rank
                                     data.
    * @returns {Number} Maximum width of split-time and rank text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxTimeAndRankTextWidth = function(timeFuncName, rankFuncName) {
        var maxTime = 0;
        var maxRank = 0;
        
        // Split times and ranks.
        for (var controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
            var times = this.splitInfo[timeFuncName](controlIndex, this.selectedIndexes);
            maxTime = Math.max(maxTime, d3.max(times.filter(SplitsBrowser.isNotNull)));
            
            var ranks = this.splitInfo[rankFuncName](controlIndex, this.selectedIndexes);
            maxRank = Math.max(maxRank, d3.max(ranks.filter(SplitsBrowser.isNotNull)));
        }
        
        var text = formatTimeAndRank(maxTime, maxRank);
        return this.getTextWidth(text);
    };

    /**
    * Return the maximum width of the split-time and rank text shown to the right
    * of each competitor 
    * @returns {Number} Maximum width of split-time and rank text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxSplitTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getSplits", "getSplitRanks");
    };

    /**
    * Return the maximum width of the cumulative time and cumulative-time rank text
    * shown to the right of each competitor 
    * @returns {Number} Maximum width of cumulative time and cumulative-time rank text, in
    *                   pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxCumulativeTimeAndRankTextWidth = function() {
        return this.getMaxTimeAndRankTextWidth("getCumulativeTimes", "getCumulativeRanks");
    };

    /**
    * Return the maximum width of the behind-fastest time shown to the right of
    * each competitor 
    * @returns {Number} Maximum width of behind-fastest time rank text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.getMaxTimeBehindFastestWidth = function() {
        var maxTime = 0;
        
        for (var controlIndex = 1; controlIndex <= this.numControls + 1; controlIndex += 1) {
            var times = this.splitInfo.getTimesBehindReference(controlIndex, this.selectedIndexes);
            maxTime = Math.max(maxTime, d3.max(times.filter(SplitsBrowser.isNotNull)));
        }
        
        return this.getTextWidth(SPACER + SplitsBrowser.formatTime(maxTime));
    };

    /**
    * Determines the maximum width of the statistics text at the end of the competitor.
    * @returns {Number} Maximum width of the statistics text, in pixels.
    */
    SplitsBrowser.Controls.Chart.prototype.determineMaxStatisticTextWidth = function() {
        var maxWidth = 0;
        if (this.visibleStatistics[0]) {
            maxWidth += this.getMaxCumulativeTimeAndRankTextWidth();
        }
        if (this.visibleStatistics[1]) {
            maxWidth += this.getMaxSplitTimeAndRankTextWidth();
        }
        if (this.visibleStatistics[2]) {
            maxWidth += this.getMaxTimeBehindFastestWidth();
        }
        
        return maxWidth;
    };

    /**
    * Creates the X and Y scales necessary for the chart and its axes.
    * @param {object} chartData - Chart data object.
    */
    SplitsBrowser.Controls.Chart.prototype.createScales = function (chartData) {
        this.xScale = d3.scale.linear().domain(chartData.xExtent).range([0, this.contentWidth]);
        this.yScale = d3.scale.linear().domain(chartData.yExtent).range([0, this.contentHeight]);
        this.xScaleMinutes = d3.scale.linear().domain([chartData.xExtent[0] / 60, chartData.xExtent[1] / 60]).range([0, this.contentWidth]);
        this.yScaleMinutes = d3.scale.linear().domain([chartData.yExtent[0] / 60, chartData.yExtent[1] / 60]).range([0, this.contentHeight]);
    };

    /**
    * Draw the background rectangles that indicate sections of the course
    * between controls.
    */
    SplitsBrowser.Controls.Chart.prototype.drawBackgroundRectangles = function () {
        var rects = this.svgGroup.selectAll("rect")
                                 .data(d3.range(this.numControls + 1));

        var outerThis = this;

        rects.enter().append("rect");

        rects.attr("x", function (index) { return outerThis.xScale(outerThis.cumTimes[index]); })
                .attr("y", 0)
                .attr("width", function (index) { return outerThis.xScale(outerThis.cumTimes[index + 1] - outerThis.cumTimes[index]); })
                .attr("height", this.contentHeight)
                .attr("fill", function (index) { return (index % 2 === 0) ? backgroundColour1 : backgroundColour2; });

        rects.exit().remove();
    };

    /**
    * Draw the chart axes.
    */
    SplitsBrowser.Controls.Chart.prototype.drawAxes = function () {
        var xAxis = d3.svg.axis()
                          .scale(this.xScale)
                          .orient("top")
                          .tickFormat(this.getTickFormatter())
                          .tickValues(this.cumTimes);

        var yAxis = d3.svg.axis()
                          .scale(this.yScaleMinutes)
                          .orient("left");
                     
        var lowerXAxis = d3.svg.axis()
                               .scale(this.xScaleMinutes)
                               .orient("bottom");

        this.svgGroup.selectAll("g.axis").remove();

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .call(xAxis);

        this.svgGroup.append("g")
                     .attr("class", "y axis")
                     .call(yAxis)
                     .append("text")
                     .attr("transform", "rotate(-90)")
                     .attr("x", -(this.contentHeight - 6))
                     .attr("y", 6)
                     .attr("dy", ".71em")
                     .style("text-anchor", "start")
                     .text("Time loss (min)");

        this.svgGroup.append("g")
                     .attr("class", "x axis")
                     .attr("transform", "translate(0," + this.contentHeight + ")")                     
                     .call(lowerXAxis)
                     .append("text")
                     .attr("x", 60)
                     .attr("y", -5)
                     .style("text-anchor", "start")
                     .text("Time (min)");
    };

    /**
    * Draw the lines on the chart.
    * @param {Array} chartData - Array of chart data.
    */
    SplitsBrowser.Controls.Chart.prototype.drawChartLines = function (chartData) {
        var outerThis = this;
        var lineFunctionGenerator = function (index) {
            return d3.svg.line()
                            .x(function (d) { return outerThis.xScale(d.x); })
                            .y(function (d) { return outerThis.yScale(d.ys[index]); })
                            .interpolate("linear");
        };

        var graphLines = this.svgGroup.selectAll("path.graphLine")
                                      .data(d3.range(this.numLines));

        graphLines.enter()
                  .append("path")
                  .attr("class", "graphLine")
                  .attr("stroke-width", 2)
                  .attr("fill", "none");

        graphLines.attr("d", function (i) { return lineFunctionGenerator(i)(chartData.dataColumns); })
                    .attr("stroke", function (i) { return colours[outerThis.selectedIndexes[i] % colours.length]; });

        graphLines.exit().remove();
    };

    /**
    * Draw legend labels to the right of the chart.
    * @param {object} chartData - The chart data that contains the final time offsets.
    */
    SplitsBrowser.Controls.Chart.prototype.drawCompetitorLegendLabels = function (chartData) {
        var finishColumn = chartData.dataColumns[chartData.dataColumns.length - 1];
        var outerThis = this;

        var currCompData = d3.range(this.numLines).map(function (i) {
            return {
                name: outerThis.names[i],
                textHeight: outerThis.getTextHeight(outerThis.names[i]),
                y: outerThis.yScale(finishColumn.ys[i]),
                colour: colours[outerThis.selectedIndexes[i] % colours.length]
            };
        });

        // Some ys may be too close to the previous one.  Adjust them downwards
        // as necessary.
        for (var i = 1; i < currCompData.length; ++i) {
            if (currCompData[i].y < currCompData[i - 1].y + currCompData[i - 1].textHeight) {
                currCompData[i].y = currCompData[i - 1].y + currCompData[i - 1].textHeight;
            }
        }

        var legendLines = this.svgGroup.selectAll("line.competitorLegendLine").data(currCompData);
        legendLines.enter()
                   .append("line")
                   .attr("class", "competitorLegendLine")
                   .attr("stroke-width", 2);

        legendLines.attr("x1", this.contentWidth + 1)
                   .attr("y1", function (data) { return data.y; })
                   .attr("x2", this.contentWidth + legendLineWidth + 1)
                   .attr("y2", function (data) { return data.y; })
                   .attr("stroke", function (data) { return data.colour; });

        legendLines.exit().remove();

        var labels = this.svgGroup.selectAll("text.competitorLabel").data(currCompData);
        labels.enter()
              .append("text")
              .attr("class", "competitorLabel");

        labels.text(function (data) { return data.name; })
              .attr("x", this.contentWidth + legendLineWidth + 2)
              .attr("y", function (data) { return data.y + data.textHeight / 4; });

        labels.exit().remove();
    };

    /**
    * Adjusts the computed values for the content size of the chart.
    *
    * This method should be called after any of the following occur:
    * (1) the overall size of the chart changes.
    * (2) the currently-selected set of indexes changes
    * (3) the chart data is set.
    * If you find part of the chart is missing sometimes, chances are you've
    * omitted a necessary call to this method.
    */
    SplitsBrowser.Controls.Chart.prototype.adjustContentSize = function () {
        var maxTextWidth = this.getMaxGraphEndTextWidth();
        this.contentWidth = Math.max(this.overallWidth - margin.left - margin.right - maxTextWidth - (legendLineWidth + 2), 100);
        this.contentHeight = Math.max(this.overallHeight - margin.top - margin.bottom, 100);
    };

    /**
    * Sets the overall size of the chart control, including margin, axes and legend labels.
    * @param {Number} overallWidth - Overall width
    * @param {Number} overallHeight - Overall height
    */
    SplitsBrowser.Controls.Chart.prototype.setSize = function (overallWidth, overallHeight) {
        this.overallWidth = overallWidth;
        this.overallHeight = overallHeight;
        $(_CHART_SVG_ID_SELECTOR).width(overallWidth).height(overallHeight);
        this.adjustContentSize();
    };

    /**
    * Draws the chart.
    * @param {object} chartData - Data for all of the currently-visible
    *                 competitors.
    * @param {object} splitInfo - Split-information object.
    * @param {Array} cumTimes - Array of cumulative times of the 'reference', in
    *                           units of seconds.
    * @param {Array} selectedIndexes - Array of indexes of selected competitors
    *                (0 in this array means the first competitor is selected, 1
    *                means the second is selected, and so on.)
    * @param {Array} visibleStatistics - Array of boolean flags indicating whether
                                         certain statistics are visible.
    */
    SplitsBrowser.Controls.Chart.prototype.drawChart = function (chartData, splitInfo, cumTimes, selectedIndexes, visibleStatistics) {
        this.numControls = chartData.numControls;
        this.names = chartData.competitorNames;
        this.numLines = this.names.length;
        this.selectedIndexes = selectedIndexes;
        this.cumTimes = cumTimes;
        this.splitInfo = splitInfo;
        this.visibleStatistics = visibleStatistics;
        this.maxStatisticTextWidth = this.determineMaxStatisticTextWidth();
        this.adjustContentSize();
        this.createScales(chartData);
        this.drawBackgroundRectangles();
        this.drawAxes();
        this.drawChartLines(chartData);
        this.drawCompetitorLegendLabels(chartData);
    };
})();


/* global window, document, $, SplitsBrowser, d3, setTimeout, clearTimeout */

(function () {
    "use strict";
    // Delay in milliseconds between a resize event being triggered and the
    // page responding to it.
    // (Resize events tend to come more than one at a time; if a resize event
    // comes in while a previous event is waiting, the previous event is
    // cancelled.)
    var RESIZE_DELAY_MS = 100;

    var _TOP_PANEL_ID = "topPanel";
    var _TOP_PANEL_ID_SELECTOR = "#" + _TOP_PANEL_ID;

    var _COMPETITOR_LIST_CONTAINER_ID = "competitorListContainer";
    var _COMPETITOR_LIST_CONTAINER_ID_SELECTOR = "#" + _COMPETITOR_LIST_CONTAINER_ID;

    var _ALL_OR_NONE_BUTTONS_PANEL_ID = "allOrNoneButtonsPanel";
    var _ALL_OR_NONE_BUTTONS_PANEL_ID_SELECTOR = "#" + _ALL_OR_NONE_BUTTONS_PANEL_ID;
    
    /**
    * The 'overall' viewer object responsible for viewing the splits graph.
    * @constructor
    */
    SplitsBrowser.Viewer = function () {

        this.courses = null;
        this.currentResult = null;
        this.currentIndexes = null;
        this.reference = null;
        this.chartData = null;
        this.splitInfo = null;
        this.cumTimes = null;

        this.selection = null;
        this.courseSelector = null;
        this.statisticsSelector = null;
        this.competitorListBox = null;
        this.chart = null;
        this.topPanel = null;
        this.mainPanel = null;
        
        this.currentResizeTimeout = null;
    };
    
    /**
    * Sets the courses that the viewer can view.
    * @param {Array} courses - The array of courses that can be viewed.
    */
    SplitsBrowser.Viewer.prototype.setCourses = function (courses) {
        this.courses = courses;
        if (this.comparisonSelector !== null) {
            this.comparisonSelector.setCourses(courses);
        }
        if (this.courseSelector !== null) {
            this.courseSelector.setCourses(this.courses);
        }
    };

    /**
    * Construct the UI inside the HTML body.
    */
    SplitsBrowser.Viewer.prototype.buildUi = function () {
        var body = d3.select("body");
        
        var topPanel = body.append("div")
                           .attr("id", _TOP_PANEL_ID);
                           
        var outerThis = this;
        this.courseSelector = new SplitsBrowser.Controls.CourseSelector(topPanel.node());
        this.courseSelector.registerChangeHandler(function (index) { outerThis.selectCourse(index); });
        if (this.courses !== null) {
            this.courseSelector.setCourses(this.courses);
        }
        
        topPanel.append("span").style("padding", "0px 30px 0px 30px");
        
        this.comparisonSelector = new SplitsBrowser.Controls.ComparisonSelector(topPanel.node());
        this.comparisonSelector.registerChangeHandler(function (comparisonFunc) { outerThis.selectComparison(comparisonFunc); });
        this.courseSelector.registerChangeHandler(function (index) { return outerThis.comparisonSelector.updateRunnerList(index); });
        if (this.courses !== null) {
            this.comparisonSelector.setCourses(this.courses);
        }
        
        this.comparisonFunction = this.comparisonSelector.getComparisonFunction();
        
        this.statisticsSelector = new SplitsBrowser.Controls.StatisticsSelector(topPanel.node());
        
        var mainPanel = body.append("div");
        
        var competitorListContainer = mainPanel.append("div")
                                               .attr("id", _COMPETITOR_LIST_CONTAINER_ID);
                                               
        var buttonsContainer = competitorListContainer.append("div")
                                                      .attr("id", _ALL_OR_NONE_BUTTONS_PANEL_ID);
                     
        buttonsContainer.append("button")
                        .text("All")
                        .on("click", function () { outerThis.selectAll(); });
                        
        buttonsContainer.append("button")
                        .text("None")
                        .on("click", function () { outerThis.selectNone(); });
                                                           
        this.competitorListBox = new SplitsBrowser.Controls.CompetitorListBox(competitorListContainer.node());
        this.chart = new SplitsBrowser.Controls.Chart(mainPanel.node());
           
        $(window).resize(function () { outerThis.handleWindowResize(); });
    };

    /**
    * Select all of the competitors.
    */
    SplitsBrowser.Viewer.prototype.selectAll = function () {
        this.selection.selectAll();
    };

    /**
    * Select none of the competitors.
    */
    SplitsBrowser.Viewer.prototype.selectNone = function () {
        this.selection.selectNone();
    };

    /**
     * Handle a resize of the window.
     */
    SplitsBrowser.Viewer.prototype.handleWindowResize = function () {
        if (this.currentResizeTimeout !== null) {
            clearTimeout(this.currentResizeTimeout);
        }

        var outerThis = this;
        this.currentResizeTimeout = setTimeout(function() { outerThis.postResizeHook(); }, RESIZE_DELAY_MS);
    };
    
    /**
    * Resize the chart following a change of size of the chart.
    */
    SplitsBrowser.Viewer.prototype.postResizeHook = function () {
        this.currentResizeTimeout = null;
        this.drawChart();
    };

    /**
    * Draw the chart using the current data.
    */
    SplitsBrowser.Viewer.prototype.drawChart = function () {

        this.reference = this.comparisonFunction(this.currentResult);
        this.chartData = this.currentResult.getChartData(this.reference, this.currentIndexes);
        this.cumTimes = this.reference.getCumulativeTimes();
        this.splitInfo = new SplitsBrowser.Model.CompetitorSplitInfo(this.currentResult, this.reference);

        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        
        this.currentVisibleStatistics = this.statisticsSelector.getVisibleStatistics();

        this.competitorListBox.setCompetitorList(this.currentResult.competitorData);

        var topPanelHeight = $(_TOP_PANEL_ID_SELECTOR).height();
        
        // Subtract some values to avoid scrollbars appearing.
        var chartWidth = windowWidth - 18 - this.competitorListBox.width() - 40;
        var chartHeight = windowHeight - 19 - topPanelHeight;

        this.chart.setSize(chartWidth, chartHeight);
        this.chart.drawChart(this.chartData, this.splitInfo, this.cumTimes, this.currentIndexes, this.currentVisibleStatistics);

        var outerThis = this;
        
        if (this.selectionChangeHandler !== null) {
            this.selection.deregisterChangeHandler(this.selectionChangeHandler);
        }
        
        if (this.statisticsChangeHandler !== null) {
            this.statisticsSelector.deregisterChangeHandler(this.statisticsChangeHandler);
        }
        
        this.selectionChangeHandler = function (indexes) {
            outerThis.currentIndexes = indexes;
            outerThis.redraw();
        };

        this.selection.registerChangeHandler(this.selectionChangeHandler);
        
        this.statisticsChangeHandler = function (visibleStatistics) {
            outerThis.currentVisibleStatistics = visibleStatistics;
            outerThis.redraw();
        };
        
        this.statisticsSelector.registerChangeHandler(this.statisticsChangeHandler);

        $("body").height(windowHeight - 19 - topPanelHeight);
        $(_COMPETITOR_LIST_CONTAINER_ID_SELECTOR).height(windowHeight - 19 - $(_ALL_OR_NONE_BUTTONS_PANEL_ID_SELECTOR).height() - topPanelHeight);
    };

    /**
    * Redraw the chart, possibly using new data.
    */
    SplitsBrowser.Viewer.prototype.redraw = function () {
        this.chartData = this.currentResult.getChartData(this.reference, this.currentIndexes);
        this.chart.drawChart(this.chartData, this.splitInfo, this.cumTimes, this.currentIndexes, this.currentVisibleStatistics);
    };
    
    /**
    * Change the graph to show the course with the given index.
    * @param {Number} index - The (zero-based) index of the course.
    */
    SplitsBrowser.Viewer.prototype.selectCourse = function (index) {
        if (0 <= index && index < this.courses.length) {
            if (this.selection !== null) {
                this.selection.selectNone();
            }
            this.currentIndexes = [];
            this.currentResult = this.courses[index];
            this.selection = new SplitsBrowser.Model.CompetitorSelection(this.currentResult.competitorData.length);
            this.competitorListBox.setSelection(this.selection);
            this.drawChart();
        }
    };
    
    /**
    * Change the graph to compare against a different reference.
    * @param {Function} comparisonFunc - The function that returns the
    *      reference course data from the course data.
    */
    SplitsBrowser.Viewer.prototype.selectComparison = function (comparisonFunc) {
        this.comparisonFunction = comparisonFunc;
        this.drawChart();
    };

    var viewer = new SplitsBrowser.Viewer();
    
    /**
    * JQuery AJAX callback to handle the request to get some data and parse it.
    */
    function readEventData(data, status, jqXHR) {
        if (status === "success") {
            var courses = SplitsBrowser.Input.CSV.parseEventData(data);
            viewer.setCourses(courses);
            viewer.selectCourse(0);
        } else {
            alert("Got status " + status + ". :(");
        }
    }


    function testReadSplits(events_url) {
        $.ajax({
            url: events_url,
            data: "",
            success: readEventData,
            dataType: "text",
        });
    }

    $(document).ready(function() { viewer.buildUi(); testReadSplits('data/eventdata'); });
})();
