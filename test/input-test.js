/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function () {
    "use strict";
    
    var Event = SplitsBrowser.Model.Event;
    var parseEventData = SplitsBrowser.Input.parseEventData;
    
    module("Input");
    
    QUnit.test("Can read in 'EMIT' CSV data", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30\r\n\r\n" + 
                      "Another example class, 5\r\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,03:09,00:28\r\nFaye,Claidey,JKL,10:58,02:55,02:00,03:48,01:49,03:32,00:37";
        
        var result = parseEventData(csvData);
        assert.ok(result !== null, "There should be an array of classes returned");
        assert.ok(result instanceof Event, "An event should be returned");
        assert.equal(result.classes.length, 2, "Two classes should be read in");
        assert.equal(result.courses.length, 2, "Two courses should be read in");
    });
    
    QUnit.test("Can read in 'SI' semicolon-delimited data", function (assert) { 
        var siData = "First name;Surname;City;Start;Time;Short;Pl;Course;Km;m;Course controls;Punch1;Punch2;Punch3;\r\n" + 
                     "John;Smith;ABC;10:00:00;06:33;Test class;1;Test course;4.1;140;3;01:50;03:38;06:02;\r\n";
        var eventData = parseEventData(siData);
        assert.ok(eventData !== null, "There should be an array of classes returned");
        assert.equal(eventData.classes.length, 1, "One class should be read in");
        assert.equal(eventData.courses.length, 1, "One course should be read in");
    });
    
    QUnit.test("Cannot read in invalid data", function (assert) {
        var invalidData = "This is not valid results data in any format";
        var result = parseEventData(invalidData);
        assert.strictEqual(result, null, "There should be no result");
    });
})();
