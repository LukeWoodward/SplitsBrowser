(function () {
    "use strict";
    
    /**
    * A collection of 'classes', all runners within which ran the same physical
    * course.
    *
    * Course length and climb are both optional and can both be null.
    * @constructor
    * @param {String} name - The name of the course.
    * @param {Array} classes - Array of AgeClass objects comprising the course.
    * @param {Number|null} length - Length of the course, in kilometres.
    * @param {Number|null} climb - The course climb, in metres.
    * @param {Array|null} controls - Array of codes of the controls that make
    *     up this course.  This may be null if no such information is provided.
    */
    SplitsBrowser.Model.Course = function (name, classes, length, climb, controls) {
        this.name = name;
        this.classes = classes;
        this.length = length;
        this.climb = climb;
        this.controls = controls;
    };
    
    /**
    * Returns an array of the 'other' classes on this course.
    * @param {SplitsBrowser.Model.AgeClass} ageClass - An age class that should
    *     be on this course,
    * @return {Array} Array of other age classes.
    */
    SplitsBrowser.Model.Course.prototype.getOtherClasses = function (ageClass) {
        var otherClasses = this.classes.filter(function (cls) { return cls !== ageClass; });
        if (otherClasses.length === this.classes.length) {
            // Given class not found.
            SplitsBrowser.throwInvalidData("Course.getOtherClasses: given class is not in this course");
        } else {
            return otherClasses;
        }
    };
    
    /**
    * Returns whether this course has control code data.
    * @return {boolean} true if this course has control codes, false if it does
    *     not.
    */
    SplitsBrowser.Model.Course.prototype.hasControls = function () {
        return (this.controls !== null);
    };
    
    /**
    * Returns the code of the control at the given number.
    * 
    * The start is control number 0 and has code null, and the finish has
    * number one more than the number of controls and also has code null.
    * Numbers outside this range are invalid and cause an exception to be
    * thrown.
    *
    * @param {Number} controlNum - The number of the control.
    * @return {String|null} The code of the control, or null for the start or
    *     the finish.
    */
    SplitsBrowser.Model.Course.prototype.getControlCode = function (controlNum) {
        if (controlNum === 0) {
            // The start.
            return null;
        } else if (1 <= controlNum && controlNum <= this.controls.length) {
            return this.controls[controlNum - 1];
        } else if (controlNum === this.controls.length + 1) {
            // The finish.
            return null;
        } else {
            SplitsBrowser.throwInvalidData("Cannot get control code of control " + controlNum + " because it is out of range");
        }
    };
    
    /**
    * Returns whether this course uses the given leg.
    *
    * If this course lacks leg information, it is assumed not to contain any
    * legs and so will return false for every leg.
    *
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {boolean} Whether this course uses the given leg.
    */
    SplitsBrowser.Model.Course.prototype.usesLeg = function (startCode, endCode) {
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
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Number} The control number of the leg in this course, or a
    *     negative number if the leg is not part of this course.
    */
    SplitsBrowser.Model.Course.prototype.getLegNumber = function (startCode, endCode) {
        if (this.controls === null) {
            // No controls, so no, it doesn't contain the leg specified.
            return -1;
        }
        
        if (startCode === null && endCode === null) {
            // No controls - straight from the start to the finish.
            // This leg is only present, and is leg 1, if there are no
            // controls.
            return (this.controls.length === 0) ? 1 : -1;
        } else if (startCode === null) {
            // From the start to control 1.
            return (this.controls.length > 0 && this.controls[0] === endCode) ? 1 : -1;
        } else if (endCode === null) {
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
    * @param {String} startCode - Code for the control at the start of the leg,
    *     or null for the start.
    * @param {String} endCode - Code for the control at the end of the leg, or
    *     null for the finish.
    * @return {Array} Array of fastest splits for each age class using this
    *      course.
    */
    SplitsBrowser.Model.Course.prototype.getFastestSplitsForLeg = function (startCode, endCode) {
        if (this.legs === null) {
            SplitsBrowser.throwInvalidData("Cannot determine fastest splits for a leg because leg information is not available");
        }
        
        var legNumber = this.getLegNumber(startCode, endCode);
        if (legNumber < 0) {
            var legStr = ((startCode === null) ? "start" : startCode) + " to " + ((endCode === null) ? "end" : endCode);
            SplitsBrowser.throwInvalidData("Leg from " +  legStr + " not found in course " + this.name);
        }
        
        var controlNum = legNumber;
        var fastestSplits = [];
        this.classes.forEach(function (ageClass) {
            var classFastest = ageClass.getFastestSplitTo(controlNum);
            if (classFastest !== null) {
                fastestSplits.push({name: classFastest.name, className: ageClass.name, split: classFastest.split});
            }
        });
        
        return fastestSplits;
    };
})();