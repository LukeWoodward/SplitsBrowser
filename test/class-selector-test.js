/* global d3, $ */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function (){
    "use strict";

    var ClassSelector = SplitsBrowser.Controls.ClassSelector;
    var AgeClass = SplitsBrowser.Model.AgeClass;
    var Course = SplitsBrowser.Model.Course;

    module("Class Selector");

    var lastClassId = null;
    var callCount = 0;

    function resetLastClass() {
        lastClassId = null;
        callCount = 0;
    }

    function handleClassChanged(classId) {
        lastClassId = classId;
        callCount += 1;
    }

        
    function setClassesInSelector(selector, classes) {
        var course = new Course("Test", classes, null, null);
        classes.forEach(function (cls) { cls.setCourse(course); });
        selector.setClasses(classes);
    }

    QUnit.test("Class selector created disabled and with only a dummy entry", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.equal(htmlSelect.disabled, true, "Selector should be disabled");
        assert.equal(htmlSelect.options.length, 1, "One placeholder option should be created");
    });

    QUnit.test("Setting a list of classes sets the selector to the list of class names", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.equal(htmlSelect.disabled, false, "Selector should not be disabled");
        assert.equal(htmlSelect.options.length, 3, "Three items should be created");
        for (var i = 0; i < 3; i += 1) {
            assert.equal(htmlSelect.options[i].value, i);
            assert.equal(htmlSelect.options[i].text, "Class " + (i + 1));
        }
    });

    QUnit.test("Setting a shorter list of classes sets the selector to the shorter list of class names", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());

        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        setClassesInSelector(selector,[new AgeClass("Class 4", 20, [])]);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.equal(htmlSelect.disabled, false, "Selector should not be disabled");
        assert.equal(htmlSelect.options.length, 1, "One item should be created");
        assert.equal(htmlSelect.options[0].value, 0);
        assert.equal(htmlSelect.options[0].text, "Class 4");
    });

    QUnit.test("Setting the selector back to an empty list of classes disables the selector again", function(assert) {
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        setClassesInSelector(selector, []);
        
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        
        var htmlSelect = htmlSelectSelection.node();
        assert.equal(htmlSelect.disabled, true, "Selector should be disabled");
        assert.equal(htmlSelect.options.length, 1, "One placeholder option should be created");
    });

    QUnit.test("Registering a handler and changing a value in the selector triggers a call to change callback", function(assert) {
        resetLastClass();
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleClassChanged);
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        assert.equal(lastClassId, 2, "Class 2 should have been changed");
        assert.equal(callCount, 1, "One change should have been recorded");
    });

    QUnit.test("Registering two handlers and changing a value in the selector triggers a call to both callbacks", function(assert) {
        resetLastClass();
        
        var lastclassId2 = null;
        var callCount2 = null;
        var secondHandler = function(classId) {
            lastclassId2 = classId;
            callCount2 += 1;
        };
        
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleClassChanged);
        selector.registerChangeHandler(secondHandler);
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        assert.equal(lastClassId, 2, "Class 2 should have been changed");
        assert.equal(callCount, 1, "One change should have been recorded");
        assert.equal(lastclassId2, 2, "Class 2 should have been changed");
        assert.equal(callCount2, 1, "One change should have been recorded");
    });


    QUnit.test("Registering the same handler twice and changing a value in the selector triggers only one call to change callback", function(assert) {
        resetLastClass();
        var selector = new ClassSelector(d3.select("#qunit-fixture").node());
        selector.registerChangeHandler(handleClassChanged);
        selector.registerChangeHandler(handleClassChanged);
        
        setClassesInSelector(selector, [new AgeClass("Class 1", 11, []), new AgeClass("Class 2", 17, []), new AgeClass("Class 3", 22, [])]);
        var htmlSelectSelection = d3.select("#qunit-fixture select");
        assert.equal(htmlSelectSelection.size(), 1, "One element should be selected");
        var htmlSelect = htmlSelectSelection.node();

        $(htmlSelect).val(2).change();
        assert.equal(lastClassId, 2, "Class 2 should have been changed");
        assert.equal(callCount, 1, "One change should have been recorded");
    });
})();
