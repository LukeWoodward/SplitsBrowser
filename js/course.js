/* global $, SplitsBrowser, d3 */

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
    */
    SplitsBrowser.Model.Course = function (name, classes, length, climb) {
        this.name = name;
        this.classes = classes;
        this.length = length;
        this.climb = climb;
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
})();