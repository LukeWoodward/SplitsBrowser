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
})();