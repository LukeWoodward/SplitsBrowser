/*
 *  SplitsBrowser Course - A single course at an event.
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
    "use strict";

    var throwInvalidData = SplitsBrowser.throwInvalidData;

    /**
    * A collection of 'classes', all runners within which ran the same physical
    * course.
    *
    * Course length and climb are both optional and can both be null.
    * @constructor
    * @param {String} name The name of the course.
    * @param {Array} classes Array of CourseClass objects comprising the course.
    * @param {Number|null} length Length of the course, in kilometres.
    * @param {Number|null} climb The course climb, in metres.
    * @param {Array|null} controls Array of codes of the controls that make
    *     up this course.  This may be null if no such information is provided.
    */
    function Course(name, classes, length, climb, controls) {
        this.name = name;
        this.classes = classes;
        this.length = length;
        this.climb = climb;
        this.controls = controls;
    }

    /** 'Magic' control code that represents the start. */
    Course.START = "__START__";

    /** 'Magic' control code that represents the finish. */
    Course.FINISH = "__FINISH__";

    /** 'Magic' control code that represents an intermediate start/finish control in a relay event */
    Course.INTERMEDIATE = "__INTERMEDIATE__";

    var START = Course.START;
    var FINISH = Course.FINISH;
    var INTERMEDIATE = Course.INTERMEDIATE;

    /**
    * Returns an array of the 'other' classes on this course.
    * @param {SplitsBrowser.Model.CourseClass} courseClass A course-class
    *    that should be on this course.
    * @return {Array} Array of other course-classes.
    */
    Course.prototype.getOtherClasses = function (courseClass) {
        var otherClasses = this.classes.filter(function (cls) { return cls !== courseClass; });
        if (otherClasses.length === this.classes.length) {
            // Given class not found.
            throwInvalidData("Course.getOtherClasses: given class is not in this course");
        } else {
            return otherClasses;
        }
    };

    /**
    * Returns the number of course-classes that use this course.
    * @return {Number} Number of course-classes that use this course.
    */
    Course.prototype.getNumClasses = function () {
        return this.classes.length;
    };

    /**
    * Returns whether this course has control code data.
    * @return {Boolean} true if this course has control codes, false if it does
    *     not.
    */
    Course.prototype.hasControls = function () {
        return (this.controls !== null);
    };

    /**
    * Returns the code of the control at the given number.
    *
    * The start is control number 0 and the finish has number one more than the
    * number of controls.  Numbers outside this range are invalid and cause an
    * exception to be thrown.
    *
    * The codes for the start and finish are given by the constants
    * SplitsBrowser.Model.Course.START and SplitsBrowser.Model.Course.FINISH.
    *
    * @param {Number} controlNum The number of the control.
    * @return {String} The code of the control, or one of the aforementioned
    *     constants for the start or finish.
    */
    Course.prototype.getControlCode = function (controlNum) {
        if (controlNum === 0) {
            // The start.
            return START;
        } else if (1 <= controlNum && controlNum <= this.controls.length) {
            return this.controls[controlNum - 1];
        } else if (controlNum === this.controls.length + 1) {
            // The finish.
            return FINISH;
        } else {
            throwInvalidData("Cannot get control code of control " + controlNum + " because it is out of range");
        }
    };

    /**
    * Returns whether this course uses the given leg.
    *
    * If this course lacks leg information, it is assumed not to contain any
    * legs and so will return false for every leg.
    *
    * @param {String} startCode Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Boolean} Whether this course uses the given leg.
    */
    Course.prototype.usesLeg = function (startCode, endCode) {
        return this.getLegNumber(startCode, endCode) >= 0;
    };

    /**
    * Returns the number of a leg in this course, given the start and end
    * control codes.
    *
    * The number of a leg is the number of the end control (so the leg from
    * control 3 to control 4 is leg number 4.)  The number of the finish
    * control is one more than the number of controls.
    *
    * A negative number is returned if this course does not contain this leg.
    *
    * @param {String} startCode Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Number} The control number of the leg in this course, or a
    *     negative number if the leg is not part of this course.
    */
    Course.prototype.getLegNumber = function (startCode, endCode) {
        if (this.controls === null) {
            // No controls, so no, it doesn't contain the leg specified.
            return -1;
        }

        if (startCode === START && endCode === FINISH) {
            // No controls - straight from the start to the finish.
            // This leg is only present, and is leg 1, if there are no
            // controls.
            return (this.controls.length === 0) ? 1 : -1;
        } else if (startCode === START) {
            // From the start to control 1.
            return (this.controls.length > 0 && this.controls[0] === endCode) ? 1 : -1;
        } else if (endCode === FINISH) {
            return (this.controls.length > 0 && this.controls[this.controls.length - 1] === startCode) ? (this.controls.length + 1) : -1;
        } else {
            for (var controlIdx = 1; controlIdx < this.controls.length; controlIdx += 1) {
                if (this.controls[controlIdx - 1] === startCode && this.controls[controlIdx] === endCode) {
                    return controlIdx + 1;
                }
            }

            // If we get here, the given leg is not part of this course.
            return -1;
        }
    };

    /**
    * Returns the fastest splits recorded for a given leg of the course.
    *
    * Note that this method should only be called if the course is known to use
    * the given leg.
    *
    * @param {String} startCode Code for the control at the start of the leg,
    *     or SplitsBrowser.Model.Course.START for the start.
    * @param {String} endCode Code for the control at the end of the leg, or
    *     SplitsBrowser.Model.Course.FINISH for the finish.
    * @return {Array} Array of fastest splits for each course-class using this
    *      course.
    */
    Course.prototype.getFastestSplitsForLeg = function (startCode, endCode) {
        if (this.legs === null) {
            throwInvalidData("Cannot determine fastest splits for a leg because leg information is not available");
        }

        var legNumber = this.getLegNumber(startCode, endCode);
        if (legNumber < 0) {
            var legStr = ((startCode === START || startCode === INTERMEDIATE) ? "start" : startCode) + " to " +
                ((endCode === FINISH || endCode === INTERMEDIATE) ? "end" : endCode);
            throwInvalidData("Leg from " +  legStr + " not found in course " + this.name);
        }

        var controlNum = legNumber;
        var fastestSplits = [];
        this.classes.forEach(function (courseClass) {
            var classFastest = courseClass.getFastestSplitTo(controlNum);
            if (classFastest !== null) {
                fastestSplits.push({name: classFastest.name, className: courseClass.name, split: classFastest.split});
            }
        });

        return fastestSplits;
    };

    /**
    * Returns a list of all results on this course that visit the control
    * with the given code in the time interval given.
    *
    * Specify SplitsBrowser.Model.Course.START for the start and
    * SplitsBrowser.Model.Course.FINISH for the finish.
    *
    * If the given control is not on this course, an empty list is returned.
    *
    * @param {String} controlCode Control code of the required control.
    * @param {Number} intervalStart The start of the interval, as seconds
    *     past midnight.
    * @param {Number} intervalEnd The end of the interval, as seconds past
    *     midnight.
    * @return {Array} Array of all results visiting the given control
    *     within the given time interval.
    */
    Course.prototype.getResultsAtControlInTimeRange = function (controlCode, intervalStart, intervalEnd) {
        if (this.controls === null) {
            // No controls means don't return any results.
            return [];
        } else if (controlCode === START) {
            return this.getResultsAtControlNumInTimeRange(0, intervalStart, intervalEnd);
        } else if (controlCode === FINISH) {
            return this.getResultsAtControlNumInTimeRange(this.controls.length + 1, intervalStart, intervalEnd);
        } else {
            // Be aware that the same control might be used more than once on a course.
            var lastControlIdx = -1;
            var matchingResults = [];
            var appendMatchingResult = function (result) { matchingResults.push(result); };
            while (true) {
                var controlIdx = this.controls.indexOf(controlCode, lastControlIdx + 1);
                if (controlIdx < 0) {
                    // No more occurrences of this control.
                    return matchingResults;
                } else {
                    var results = this.getResultsAtControlNumInTimeRange(controlIdx + 1, intervalStart, intervalEnd);
                    results.forEach(appendMatchingResult);
                    lastControlIdx = controlIdx;
                }
            }
        }
    };

    /**
    * Returns a list of all results on this course that visit the control
    * with the given number in the time interval given.
    *
    * @param {Number} controlNum The number of the control (0 = start).
    * @param {Number} intervalStart The start of the interval, as seconds
    *     past midnight.
    * @param {Number} intervalEnd The end of the interval, as seconds past
    *     midnight.
    * @return {Array} Array of all results visiting the given control
    *     within the given time interval.
    */
    Course.prototype.getResultsAtControlNumInTimeRange = function (controlNum, intervalStart, intervalEnd) {
        var matchingResults = [];
        this.classes.forEach(function (courseClass) {
            courseClass.getResultsAtControlInTimeRange(controlNum, intervalStart, intervalEnd).forEach(function (result) {
                matchingResults.push({name: result.name, time: result.time, className: courseClass.name});
            });
        });

        return matchingResults;
    };

    /**
    * Returns whether the course has the given control.
    * @param {String} controlCode The code of the control.
    * @return {Boolean} True if the course has the control, false if the
    *     course doesn't, or doesn't have any controls at all.
    */
    Course.prototype.hasControl = function (controlCode) {
        return this.controls !== null && this.controls.indexOf(controlCode) > -1;
    };

    /**
    * Returns the control code(s) of the control(s) after the one with the
    * given code.
    *
    * Controls can appear multiple times in a course.  If a control appears
    * multiple times, there will be multiple next controls.
    * @param {String} controlCode The code of the control.
    * @return {Array} The codes of the next controls.
    */
    Course.prototype.getNextControls = function (controlCode) {
        if (this.controls === null) {
            throwInvalidData("Course has no controls");
        } else if (controlCode === FINISH) {
            throwInvalidData("Cannot fetch next control after the finish");
        } else if (controlCode === START) {
            return [(this.controls.length === 0) ? FINISH : this.controls[0]];
        } else {
            var lastControlIdx = -1;
            var nextControls = [];
            do {
                var controlIdx = this.controls.indexOf(controlCode, lastControlIdx + 1);
                if (controlIdx === -1) {
                    break;
                } else if (controlIdx === this.controls.length - 1) {
                    nextControls.push(FINISH);
                } else {
                    nextControls.push(this.controls[controlIdx + 1]);
                }

                lastControlIdx = controlIdx;
            } while (true); // Loop exits when broken.

            if (nextControls.length === 0) {
                throwInvalidData("Control '" + controlCode + "' not found on course " + this.name);
            } else {
                return nextControls;
            }
        }
    };

    SplitsBrowser.Model.Course = Course;
})();