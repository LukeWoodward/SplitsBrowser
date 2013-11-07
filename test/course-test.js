/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function () {
    "use strict";

    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;
    
    
    module("Course");
    
    QUnit.test("Getting other classes of a course with one class returns empty list when given that one class", function (assert) {
        var ageClass = new AgeClass("Test class", 3, []);
        var course = new Course("Test course", [ageClass], null, null);
        
        assert.deepEqual(course.getOtherClasses(ageClass), [], "There should be no other classes");
    });
    
    QUnit.test("Getting other classes of a course with three classes returns the other two when given one of the others", function (assert) {
        var ageClass1 = new AgeClass("Test class 1", 3, []);
        var ageClass2 = new AgeClass("Test class 2", 3, []);
        var ageClass3 = new AgeClass("Test class 3", 3, []);
        var course = new Course("Test course", [ageClass1, ageClass2, ageClass3], null, null);
        
        assert.deepEqual(course.getOtherClasses(ageClass2), [ageClass1, ageClass3], "There should be no other classes");
    });
    
    QUnit.test("Attempting to get other courses of a course with three classes when given some other class throws an exception", function (assert) {
        var ageClass1 = new AgeClass("Test class 1", 3, []);
        var ageClass2 = new AgeClass("Test class 2", 3, []);
        var ageClass3 = new AgeClass("Test class 3", 3, []);
        var course = new Course("Test course", [ageClass1, ageClass2], null, null);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            course.getOtherClasses(ageClass3);
        });
    });
    
})();