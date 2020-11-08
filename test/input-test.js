/*
 *  SplitsBrowser - Input tests
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    const Event = SplitsBrowser.Model.Event;
    const parseEventData = SplitsBrowser.Input.parseEventData;

    const OE_HEADER = "Stno;SI card;Database Id;Surname;First name;YB;S;Block;nc;Start;Finish;Time;Classifier;Club no.;Cl.name;City;Nat;Cl. no.;Short;Long;Num1;Num2;Num3;Text1;Text2;Text3;Adr. name;Street;Line2;Zip;City;Phone;Fax;Email;Id/Club;Rented;Start fee;Paid;Course no.;Course;Km;m;Course controls;Pl;Start punch;Finish punch;Control1;Punch1;Control2;Punch2;Control3;Punch3;Control4;Punch4;\r\n";

    QUnit.module("Input");

    QUnit.test("Can read in CSV data", assert => {
        const csvData = "Example, 4\r\nFirst,Runner,ABC,10:34,02:57,01:39,03:31,02:01,00:23\r\nSecond,Runner,DEF,12:12,02:42,01:51,04:00,01:31,00:30\r\n\r\n" +
                      "Another example class, 5\r\nThird,Runner,GHI,11:22,02:50,01:44,03:29,01:40,03:09,00:28\r\nFourth,Runner,JKL,10:58,02:55,02:00,03:48,01:49,03:32,00:37";

        const eventData = parseEventData(csvData);
        assert.ok(eventData instanceof Event, "An event should be returned");
        assert.strictEqual(eventData.classes.length, 2, "Two classes should be read in");
        assert.strictEqual(eventData.courses.length, 2, "Two courses should be read in");
    });

    QUnit.test("Can read in OE semicolon-delimited data", assert => {
        const oeData = OE_HEADER + "0;1;2;Runner;First;5;6;7;8;11:27:45;10;06:33;0;13;14;ABC;16;17;Test class;19;20;21;22;23;24;25;26;27;28;29;30;31;32;33;34;35;36;37;38;Test course;4.1;140;3;1;;;208;01:50;227;03:38;212;06:02";
        const eventData = parseEventData(oeData);
        assert.ok(eventData instanceof Event, "An event should be returned");
        assert.strictEqual(eventData.classes.length, 1, "One class should be read in");
        assert.strictEqual(eventData.courses.length, 1, "One course should be read in");
    });

    QUnit.test("Can read in OE comma-delimited data", assert => {
        let oeData = OE_HEADER + "0;1;2;Runner;First;5;6;7;8;11:27:45;10;06:33;0;13;14;ABC;16;17;Test class;19;20;21;22;23;24;25;26;27;28;29;30;31;32;33;34;35;36;37;38;Test course;4.1;140;3;1;;;208;01:50;227;03:38;212;06:02";
        oeData = oeData.replace(/;/g, ",");
        const eventData = parseEventData(oeData);
        assert.ok(eventData instanceof Event, "An event should be returned");
        assert.strictEqual(eventData.classes.length, 1, "One class should be read in");
        assert.strictEqual(eventData.courses.length, 1, "One course should be read in");
    });

    QUnit.test("Can read in OE CSV data in nameless format", assert => {
        const namelessCSVData = "OE0014,Stno,XStno,Chipno,Database Id,Surname,First name,YB,S,Block,nc,Start,Finish,Time,Classifier,Credit -,Penalty +,Comment,Club no.," +
                              "Cl.name,City,Nat,Location,Region,Cl. no.,Short,Long,Entry cl. No,Entry class (short),Entry class (long),Rank,Ranking points,Num1,Num2,Num3," +
                              "Text1,Text2,Text3,Addr. surname,Addr. first name,Street,Line2,Zip,Addr. city,Phone,Mobile,Fax,EMail,Rented,Start fee,Paid,Team,Course no.," +
                              "Course,km,m,Course controls,Place,Start punch,Finish punch,Control1,Punch1,Control2,Punch2,Control3,Punch3,Control4,Punch4,Control5,Punch5," +
                              "Control6,Punch6\r\n" +
                              ",,,200972,,,,,,,,,,,,,,,3621,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,Course 1,2.7,150,3,1,10:38:00,10:41:22,152,01:12,188,02:21,163,03:06,,,,,,,,,,,\r\n";
        const eventData = parseEventData(namelessCSVData);
        assert.ok(eventData instanceof Event, "An event should be returned");
        assert.strictEqual(eventData.classes.length, 1, "One class should be read in");
        assert.strictEqual(eventData.courses.length, 1, "One course should be read in");
    });

    QUnit.test("Can read in HTML preformatted data", assert => {
        const htmlData = '<html><head></head><body>\n<pre>\n<font size="2"><b>   Test course 1 (2)</b></font><font size="2"><b>   2.7 km     35 m</b></font>\n' +
            '<font size="2"><b> </b></font><font size="2"><b> </b></font><font size="2"><b> </b></font><font size="2"><b>   </b></font>   1(138)     2(152)     3(141)    F  \n' +
            '<font size="2"><b> 1</b></font><font size="2"><b> 165</b></font><font size="2"><b> Test runner</b></font><font size="2"><b>   09:25</b></font>  01:47    04:02    08:13    <font size="2"><b>   09:25</b></font>\n' +
            '<font size="2"><b>   </b></font><font size="2"><b>   </b></font><font size="2"><b>   TEST</b></font><font size="2"><b>   </b></font>  01:47    02:15    04:11    <font size="2"><b>   01:12</b></font>\n' +
            "</pre></body></html>";
        const eventData = parseEventData(htmlData);
        assert.ok(eventData instanceof Event, "An event should be returned");
        assert.strictEqual(eventData.classes.length, 1, "One class should be read in");
        assert.strictEqual(eventData.courses.length, 1, "One course should be read in");
    });

    QUnit.test("Can read in HTML tabular data", assert => {
        const htmlData = '<body>\n<div id=reporttop>\n<table width=1105px style="table-layout:auto;">\n<tr><td><nobr>Event title</nobr></td><td id=rb><nobr>Sun 01/02/2013 12:34</nobr></td></tr>\n</table>\n' +
            "<hr>\n</div>\n<table id=ln><tr><td>&nbsp</td></tr></table>\n<table width=1105px>\n<tbody>\n" +
            '<tr><td id=c12><nobr>   Test course 1 (21)</nobr></td><td id=c12><nobr>   2.7 Km</nobr></td><td id=c12><nobr>   35 m</nobr></td><td id="header" ></td>\n' +
            "</tr>\n</tbody>\n</table>\n<table width=1105px>\n<col width=32px>\n<col width=39px>\n<col width=133px>\n<thead>\n" +
            "<tr><th id=rb>Pl</th><th id=rb>Stno</th><th>Name</th><th id=rb>Time</th><th id=rb></th><th id=rb></th></tr>\n" +
            "</thead><tbody></tbody></table>\n<table width=1105px>\n<col width=32px>\n<col width=39px>\n<col width=133px>\n<tbody>\n" +
            "<tr><td id=c12><nobr>   </nobr></td><td id=c12><nobr>   </nobr></td><td id=c12><nobr>   </nobr></td><td id=c12><nobr>   </nobr></td>" +
            "<td id=c12><nobr>   1(138)  </nobr></td><td id=c12><nobr>   2(152)  </nobr></td><td id=c12><nobr>   3(141)  </nobr></td><td id=c12><nobr>   F</nobr></td></tr>\n" +
            "<tr><td id=c12><nobr>   1</nobr></td><td id=c12><nobr>   165</nobr></td><td id=c12><nobr>   Test runner</nobr></td><td id=c12><nobr>   09:25</nobr></td>" +
            "<td id=c12><nobr>   01:47</nobr></td>  <td id=c12><nobr>   04:02</nobr></td>  <td id=c12><nobr>   08:13</nobr></td>  <td id=c12><nobr>   09:25</nobr></td></tr>\n" +
            "<tr><td id=c12><nobr>   </nobr></td><td id=c12><nobr>   </nobr></td><td id=c12><nobr>   TEST</nobr></td><td id=c12><nobr>   </nobr></td>" +
            "<td id=c12><nobr>   01:47</nobr></td>  <td id=c12><nobr>   02:15</nobr></td>  <td id=c12><nobr>   04:11</nobr></td>  <td id=c12><nobr>   01:12</nobr></td></tr>\n" +
            "<tr><td id=c10><nobr>&nbsp</nobr></td></tr>\n<tr><td id=c10><nobr>&nbsp</nobr></td></tr>\n</tbody>\n</table>\n</body>\n</html>";
        const eventData = parseEventData(htmlData);
        assert.ok(eventData instanceof Event, "An event should be returned");
        assert.strictEqual(eventData.classes.length, 1, "One class should be read in");
        assert.strictEqual(eventData.courses.length, 1, "One course should be read in");
    });

    QUnit.test("Can read in alternative CSV data in triple-column format", assert => {
        const tripleColumnCSVData = "RaceNumber,CardNumbers,MembershipNumbers,Name,AgeClass,Club,Country,CourseClass,StartTime,FinishTime,RaceTime,NonCompetitive," +
                                  "Position,Status,Handicap,PenaltyScore,ManualScoreAdjust,FinalScore,HandicapTime,HandicapScore,AwardLevel,SiEntriesIDs,Eligibility," +
                                  "NotUsed3,NotUsed4,NotUsed5,NotUsed6,NotUsed7,NotUsed8,NotUsed9,NotUsed10,NumSplits,ControlCode1,Split1,Points1,ControlCode2,Split2," +
                                  "Points2,ControlCode3,Split3,Points3,ControlCode4,Split4,Points4,ControlCode5,Split5,Points5,ControlCode6,Split6,Points6\r\n" +
                                  ",,,First Runner,,TEST,,Course 1,10:38:00,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,152,01:12,,188,02:21,,163,03:06,,F1,03:22,,,,,,,,,\r\n";
        const eventData = parseEventData(tripleColumnCSVData);
        assert.ok(eventData instanceof Event, "An event should be returned");
        assert.strictEqual(eventData.classes.length, 1, "One class should be read in");
        assert.strictEqual(eventData.courses.length, 1, "One course should be read in");
    });

    QUnit.test("Can read in IOF v2.0.3 XML data", assert => {
        const iofXmlData = '<?xml version="1.0" ?>\n<!DOCTYPE ResultList SYSTEM "IOFdata.dtd">\n<ResultList><IOFVersion version="2.0.3" />\n' +
                         "<ClassResult><ClassShortName>Test Class</ClassShortName><PersonResult>" +
                         "<Person><PersonName><Given>First</Given><Family>Runner</Family></PersonName></Person>" +
                         "<Club><ShortName>TestClub</ShortName></Club>" +
                         "<Result>" +
                         '<StartTime><Clock>10:11:00</Clock></StartTime><Time>09:30</Time><CompetitorStatus value="OK" /><CourseLength>2300</CourseLength>' +
                         '<SplitTime sequence="1"><ControlCode>182</ControlCode><Time>01:05</Time></SplitTime>' +
                         '<SplitTime sequence="2"><ControlCode>148</ControlCode><Time>04:46</Time></SplitTime>' +
                         '<SplitTime sequence="3"><ControlCode>167</ControlCode><Time>07:50</Time></SplitTime>' +
                         "</Result></PersonResult></ClassResult></ResultList>";
        const eventData = parseEventData(iofXmlData);
        assert.ok(eventData instanceof Event, "An event should be returned");
        assert.strictEqual(eventData.classes.length, 1, "One class should be read in");
        assert.strictEqual(eventData.courses.length, 1, "One course should be read in");
    });

    QUnit.test("Can read in IOF v3.0 XML data", assert => {
        const iofXmlData = '<?xml version="1.0" ?><ResultList xmlns="http://www.orienteering.org/datastandard/3.0"\n' +
                         'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\niofVersion="3.0">\n' +
                         "<ClassResult><Class><Name>Test Class</Name></Class>" +
                         "<Course><Id>1</Id><Length>2300</Length></Course>" +
                         "<PersonResult><Person><Name><Given>First</Given><Family>Runner</Family></Name></Person>" +
                         "<Organisation><ShortName>TestClub</ShortName></Organisation>" +
                         "<Result>" +
                         "<StartTime>2014-06-07T10:11:00</StartTime><Time>570</Time><Status>OK</Status>" +
                         "<SplitTime><ControlCode>182</ControlCode><Time>65</Time></SplitTime>" +
                         "<SplitTime><ControlCode>148</ControlCode><Time>286</Time></SplitTime>" +
                         "<SplitTime><ControlCode>167</ControlCode><Time>470</Time></SplitTime>" +
                         "</Result></PersonResult></ClassResult></ResultList>";
        const eventData = parseEventData(iofXmlData);
        assert.ok(eventData instanceof Event, "An event should be returned");
        assert.strictEqual(eventData.classes.length, 1, "One class should be read in");
        assert.strictEqual(eventData.courses.length, 1, "One course should be read in");
    });

    QUnit.test("Cannot read in invalid data", assert => {
        const invalidData = "This is not valid results data in any format";
        const result = parseEventData(invalidData);
        assert.strictEqual(result, null, "There should be no result");
    });

    QUnit.test("Cannot read in empty data", assert => SplitsBrowserTest.assertInvalidData(assert, () => parseEventData("")));
})();
