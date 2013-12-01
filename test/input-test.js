/*
 *  SplitsBrowser - Input tests
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    
    var Event = SplitsBrowser.Model.Event;
    var parseEventData = SplitsBrowser.Input.parseEventData;
    
    var SI_HEADER = "Stno;SI card;Database Id;Surname;First name;YB;S;Block;nc;Start;Finish;Time;Classifier;Club no.;Cl.name;City;Nat;Cl. no.;Short;Long;Num1;Num2;Num3;Text1;Text2;Text3;Adr. name;Street;Line2;Zip;City;Phone;Fax;Email;Id/Club;Rented;Start fee;Paid;Course no.;Course;Km;m;Course controls;Pl;Start punch;Finish punch;Control1;Punch1;Control2;Punch2;Control3;Punch3;Control4;Punch4;\r\n";
    
    module("Input");
    
    QUnit.test("Can read in 'EMIT' CSV data", function (assert) {
        var csvData = "Example, 4\r\nJohn,Smith,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\nFred,Baker,DEF,12:12,02:42,01:51,04:00,01:31,00:30\r\n\r\n" + 
                      "Another example class, 5\r\nJane,Palmer,GHI,11:22,02:50,01:44,03:29,01:40,03:09,00:28\r\nFaye,Claidey,JKL,10:58,02:55,02:00,03:48,01:49,03:32,00:37";
        
        var result = parseEventData(csvData);
        assert.ok(result !== null, "There should be an array of classes returned");
        assert.ok(result instanceof Event, "An event should be returned");
        assert.strictEqual(result.classes.length, 2, "Two classes should be read in");
        assert.strictEqual(result.courses.length, 2, "Two courses should be read in");
    });
    
    QUnit.test("Can read in 'SI' semicolon-delimited data", function (assert) { 
        var siData = SI_HEADER + "0;1;2;Smith;John;5;6;7;8;11:27:45;10;06:33;12;13;14;ABC;16;17;Test class;19;20;21;22;23;24;25;26;27;28;29;30;31;32;33;34;35;36;37;38;Test course;4.1;140;3;1;44;45;208;01:50;227;03:38;212;06:02";
        var eventData = parseEventData(siData);
        assert.ok(eventData !== null, "There should be an array of classes returned");
        assert.strictEqual(eventData.classes.length, 1, "One class should be read in");
        assert.strictEqual(eventData.courses.length, 1, "One course should be read in");
    });
    
    QUnit.test("Cannot read in invalid data", function (assert) {
        var invalidData = "This is not valid results data in any format";
        var result = parseEventData(invalidData);
        assert.strictEqual(result, null, "There should be no result");
    });
    
    QUnit.test("Cannot read in empty data", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () { parseEventData(""); });
    });
    
})();
