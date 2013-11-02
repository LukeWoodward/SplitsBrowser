/* global SplitsBrowser, $, d3 */

(function () {
    "use strict";
    
    /**
    * Contains all of the data for an event.
    * @param {Array} classes - Array of AgeClass objects representing all of
    *     the classes of competitors.
    * @param {Array} courses - Array of Course objects representing all of the
    *     courses of the event.
    */ 
    SplitsBrowser.Model.Event = function (classes, courses) {
        this.classes = classes;
        this.courses = courses;
    };
})();