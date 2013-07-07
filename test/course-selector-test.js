"use strict";

var CourseSelector = SplitsBrowser.Controls.CourseSelector;
var CourseData = SplitsBrowser.Model.CourseData;

module("Course Selector");

var lastCourseId = null;
var callCount = 0;

function resetLastCourse() {
    lastCourseId = null;
    callCount = 0;
}

function handleCourseChanged(courseId) {
    lastCourseId = courseId;
    callCount += 1;
}

QUnit.test("Course selector created disabled and with only a dummy entry", function(assert) {
    var selector = new CourseSelector(d3.select("#qunit-fixture").node());
    
    var htmlSelectSelection = d3.select("#qunit-fixture select");
    assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
    
    var htmlSelect = htmlSelectSelection.node();
    assert.equal(htmlSelect.disabled, true, "Selector should be disabled");
    assert.equal(htmlSelect.options.length, 1, "One placeholder option should be created");
});

QUnit.test("Setting a list of courses sets the selector to the list of course names", function(assert) {
    var selector = new CourseSelector(d3.select("#qunit-fixture").node());
    
    selector.setCourses([new CourseData("Course 1", 11, []), new CourseData("Course 2", 17, []), new CourseData("Course 3", 22, [])])
    
    var htmlSelectSelection = d3.select("#qunit-fixture select");
    assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
    
    var htmlSelect = htmlSelectSelection.node();
    assert.equal(htmlSelect.disabled, false, "Selector should not be disabled");
    assert.equal(htmlSelect.options.length, 3, "Three items should be created");
    for (var i = 0; i < 3; ++i) {
        assert.equal(htmlSelect.options[i].value, i);
        assert.equal(htmlSelect.options[i].text, "Course " + (i + 1));
    }
});

QUnit.test("Setting a shorter list of courses sets the selector to the shorter list of course names", function(assert) {
    var selector = new CourseSelector(d3.select("#qunit-fixture").node());
    
    selector.setCourses([new CourseData("Course 1", 11, []), new CourseData("Course 2", 17, []), new CourseData("Course 3", 22, [])])
    selector.setCourses([new CourseData("Course 4", 20, [])])
    
    var htmlSelectSelection = d3.select("#qunit-fixture select");
    assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
    
    var htmlSelect = htmlSelectSelection.node();
    assert.equal(htmlSelect.disabled, false, "Selector should not be disabled");
    assert.equal(htmlSelect.options.length, 1, "One item should be created");
    assert.equal(htmlSelect.options[0].value, 0);
    assert.equal(htmlSelect.options[0].text, "Course 4");
});

QUnit.test("Setting the selector back to an empty list of courses disables the selector again", function(assert) {
    var selector = new CourseSelector(d3.select("#qunit-fixture").node());
    
    selector.setCourses([new CourseData("Course 1", 11, []), new CourseData("Course 2", 17, []), new CourseData("Course 3", 22, [])])
    selector.setCourses([])
    
    var htmlSelectSelection = d3.select("#qunit-fixture select");
    assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
    
    var htmlSelect = htmlSelectSelection.node();
    assert.equal(htmlSelect.disabled, true, "Selector should be disabled");
    assert.equal(htmlSelect.options.length, 1, "One placeholder option should be created");
});

QUnit.test("Registering a handler and changing a value in the selector triggers a call to change callback", function(assert) {
    resetLastCourse();
    var selector = new CourseSelector(d3.select("#qunit-fixture").node());
    selector.registerChangeHandler(handleCourseChanged);
    
    selector.setCourses([new CourseData("Course 1", 11, []), new CourseData("Course 2", 17, []), new CourseData("Course 3", 22, [])])
    var htmlSelectSelection = d3.select("#qunit-fixture select");
    assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
    var htmlSelect = htmlSelectSelection.node();

    $(htmlSelect).val(2).change();
    assert.equal(lastCourseId, 2, "Course 2 should have been changed");
    assert.equal(callCount, 1, "One change should have been recorded");
});

QUnit.test("Registering two handlers and changing a value in the selector triggers a call to both callbacks", function(assert) {
    resetLastCourse();
    
    var lastCourseId2 = null;
    var callCount2 = null;
    var secondHandler = function(courseId) {
        lastCourseId2 = courseId;
        callCount2 += 1;
    };
    
    var selector = new CourseSelector(d3.select("#qunit-fixture").node());
    selector.registerChangeHandler(handleCourseChanged);
    selector.registerChangeHandler(secondHandler);
    
    selector.setCourses([new CourseData("Course 1", 11, []), new CourseData("Course 2", 17, []), new CourseData("Course 3", 22, [])])
    var htmlSelectSelection = d3.select("#qunit-fixture select");
    assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
    var htmlSelect = htmlSelectSelection.node();

    $(htmlSelect).val(2).change();
    assert.equal(lastCourseId, 2, "Course 2 should have been changed");
    assert.equal(callCount, 1, "One change should have been recorded");
    assert.equal(lastCourseId2, 2, "Course 2 should have been changed");
    assert.equal(callCount2, 1, "One change should have been recorded");
});


QUnit.test("Registering the same handler twice and changing a value in the selector triggers only one call to change callback", function(assert) {
    resetLastCourse();
    var selector = new CourseSelector(d3.select("#qunit-fixture").node());
    selector.registerChangeHandler(handleCourseChanged);
    selector.registerChangeHandler(handleCourseChanged);
    
    selector.setCourses([new CourseData("Course 1", 11, []), new CourseData("Course 2", 17, []), new CourseData("Course 3", 22, [])])
    var htmlSelectSelection = d3.select("#qunit-fixture select");
    assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
    var htmlSelect = htmlSelectSelection.node();

    $(htmlSelect).val(2).change();
    assert.equal(lastCourseId, 2, "Course 2 should have been changed");
    assert.equal(callCount, 1, "One change should have been recorded");
});

