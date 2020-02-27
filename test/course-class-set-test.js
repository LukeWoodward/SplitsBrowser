/*
 *  SplitsBrowser - CourseClassSet tests.
 *  
 *  Copyright (C) 2000-2019 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    
    QUnit.module("Course-class set");

    var _DUMMY_CHART_TYPE = {
        name: "dummy",
        dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReference(referenceCumTimes); },
        skipStart: false,
        indexesAroundDubiousTimesFunc: function (comp) { return comp.getControlIndexesAroundDubiousCumulativeTimes(); }
    };
    
    var DUMMY_CHART_TYPE_SKIP = {
        name: "dummy",
        dataSelector: function (comp, referenceCumTimes) { return comp.getCumTimesAdjustedToReference(referenceCumTimes); },
        skipStart: true,
        indexesAroundDubiousTimesFunc: function (comp) { return comp.getControlIndexesAroundDubiousCumulativeTimes(); }    
    };
    
    var isNaNStrict = SplitsBrowser.isNaNStrict;
    var CourseClass = SplitsBrowser.Model.CourseClass;
    var Course = SplitsBrowser.Model.Course;
    var fromCumTimes = SplitsBrowser.Model.Competitor.fromCumTimes;
    var fromOriginalCumTimes = SplitsBrowser.Model.Competitor.fromOriginalCumTimes;
    var CourseClassSet = SplitsBrowser.Model.CourseClassSet;

    var fromSplitTimes = SplitsBrowserTest.fromSplitTimes;
    
    function getCompetitor1() {
        return fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 209, 100]);
    }
    
    function getFasterCompetitor1() {
        return fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, 100]);
    }
    
    function getCompetitor1WithNullSplitForControl2() {
        return fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, null, 184, 100]);
    }
    
    function getCompetitor1WithDubiousSplitForControl1() {
        var competitor = fromOriginalCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 0, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        competitor.setRepairedCumulativeTimes([0, NaN, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        return competitor;
    }
    
    function getCompetitor1WithDubiousSplitForControl2() {
        var competitor = fromOriginalCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 65 - 10, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        competitor.setRepairedCumulativeTimes([0, 65, NaN, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        return competitor;
    }
    
    function getCompetitor1WithDubiousFinishTime() {
        var competitor = fromOriginalCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184]);
        competitor.setRepairedCumulativeTimes([0, 65, 65 + 221, 65 + 221 + 184, NaN]);
        return competitor;
    }
    
    function getCompetitor1WithDubiousTimeToLastControlAndFinish() {
        var competitor = fromOriginalCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 65 + 221, 65 + 221, 65 + 221]);
        competitor.setRepairedCumulativeTimes([0, 65, 65 + 221, NaN, NaN]);
        return competitor;
    }
    
    function getCompetitor1WithNullSplitForControl3() {
        return fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, null, 100]);
    }
    
    function getCompetitor1WithNullFinishSplit() {
        return fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 221, 184, null]);
    }
    
    function getCompetitor1WithSameControl2SplitAsThatOfCompetitor2() {
        return fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [65, 197, 209, 100]);
    }
    
    function getNonStartingCompetitor1() {
        var competitor = fromSplitTimes(1, "John Smith", "ABC", 10 * 3600, [null, null, null, null]);
        competitor.setNonStarter();
        return competitor;
    }
    
    function getCompetitor2() {
        return fromSplitTimes(2, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106]);
    }
    
    function getCompetitor2WithNullSplitForControl2() {
        return fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [81, null, 212, 106]);
    }
    
    function getCompetitor2WithNullFinishSplit() {
        return fromSplitTimes(2, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, null]);
    }
    
    function getCompetitor2WithFinishCumTimeNotTheLargest() {
        return fromCumTimes(2, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 - 73]);
    }
    
    function getCompetitor2WithFirstControlLargerThanAllOthers() {
        return fromCumTimes(2, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 4103, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
    }
    
    function getCompetitor3() {
        return fromSplitTimes(3, "Bill Baker", "GHI", 11 * 3600, [78, 209, 199, 117]);    
    }
    
    function getCompetitor3WithSameTotalTimeAsCompetitor1() {
        return fromSplitTimes(3, "Bill Baker", "GHI", 11 * 3600, [78, 209, 199, 109]);
    }
    
    function getCompetitor3WithNullSplitForControl2() {
        return fromSplitTimes(3, "Bill Baker", "GHI", 11 * 3600, [78, null, 199, 117]);
    }
    
    function getCompetitor3WithNullSplitForControl3() {
        return fromSplitTimes(3, "Bill Baker", "GHI", 11 * 3600, [78, 209, null, 117]);
    }
    
    function getCompetitor3WithNullFinishSplit() {
        return fromSplitTimes(3, "Bill Baker", "GHI", 11 * 3600, [78, 209, 199, null]);
    }
    
    QUnit.test("Can create a CourseClassSet from an empty array of course-classes", function (assert) {
        var emptySet = new CourseClassSet([]);
        assert.ok(emptySet.isEmpty());
        assert.strictEqual(emptySet.getCourse(), null);
        assert.strictEqual(emptySet.getPrimaryClassName(), null);
        assert.strictEqual(emptySet.getNumClasses(), 0);
        assert.strictEqual(emptySet.getFastestCumTimes(), null);
    });
    
    QUnit.test("Can create a CourseClassSet from a single course-class", function (assert) {
        var courseClass = new CourseClass("Test", 3, [getCompetitor1(), getCompetitor2(), getCompetitor3()]);
        var courseClassSet = new CourseClassSet([courseClass]);
        assert.deepEqual(courseClassSet.allCompetitors, courseClass.competitors, "A CourseClassSet created from one course-class should contain the only the competitors of that class");
    });
    
    QUnit.test("Can create a CourseClassSet from a single course-class, ignoring non-starting competitor", function (assert) {
        var courseClass = new CourseClass("Test", 3, [getNonStartingCompetitor1(), getCompetitor2(), getCompetitor3()]);
        var courseClassSet = new CourseClassSet([courseClass]);
        assert.deepEqual(courseClassSet.allCompetitors, courseClass.competitors.slice(1), "A CourseClassSet created from one course-class should contain the only the competitors of that class that started");
    });
    
    QUnit.test("Can create a CourseClassSet from a single course-class and get the course", function (assert) {
        var courseClass = new CourseClass("Test", 3, [getCompetitor1()]);
        var course = new Course("Test course", [courseClass], null, null, null);
        courseClass.setCourse(course);
        var courseClassSet = new CourseClassSet([courseClass]);
        assert.deepEqual(courseClassSet.getCourse(), course);
    });
    
    QUnit.test("Can create a CourseClassSet from a single course-class and get the primary class name as that of the given class", function (assert) {
        var courseClass = new CourseClass("Test", 3, [getCompetitor1()]);
        var courseClassSet = new CourseClassSet([courseClass]);
        assert.deepEqual(courseClassSet.getPrimaryClassName(), courseClass.name);
    });
    
    QUnit.test("Can create a CourseClassSet from a multiple course-class and get the primary class name as that of the first class", function (assert) {
        var courseClass1 = new CourseClass("Test class 1", 3, [getCompetitor1()]);
        var courseClass2 = new CourseClass("Test class 2", 3, [getCompetitor2()]);
        var courseClassSet = new CourseClassSet([courseClass1, courseClass2]);
        assert.deepEqual(courseClassSet.getPrimaryClassName(), courseClass1.name);
    });
    
    QUnit.test("Can create a CourseClassSet from a single course-class, sorting competitors into order", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        var courseClass = new CourseClass("Test", 3, [competitor3, competitor1, competitor2]);
        var courseClassSet = new CourseClassSet([courseClass]);
        var expectedCompetitors = [competitor1, competitor2, competitor3];
        assert.deepEqual(courseClassSet.allCompetitors, expectedCompetitors, "A CourseClassSet created from one course-class should contain the only the competitors of that class");
    });
    
    QUnit.test("Can create a CourseClassSet from two course-classes", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        var courseClass1 = new CourseClass("Test", 3, [competitor3, competitor1]);
        var courseClass2 = new CourseClass("Test", 3, [competitor2]);
        var courseClassSet = new CourseClassSet([courseClass1, courseClass2]);
        var expectedCompetitors = [competitor1, competitor2, competitor3];
        assert.deepEqual(courseClassSet.allCompetitors, expectedCompetitors, "Merging one course-class should return the only the competitors of that class");
    });
    
    QUnit.test("Cannot create a CourseClassSet from two course-classes with different numbers of controls", function (assert) {
        var competitor2 = fromSplitTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [81, 197, 212, 106, 108]);
        var courseClass1 = new CourseClass("Test", 3, [getCompetitor1()]);
        var courseClass2 = new CourseClass("Test", 4, [competitor2]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            new CourseClassSet([courseClass1, courseClass2]);
        });
    });
    
    QUnit.test("CourseClassSet created from two course-classes has two course-classes", function (assert) {
        var courseClass1 = new CourseClass("Test class 1", 3, [getCompetitor1()]);
        var courseClass2 = new CourseClass("Test class 2", 3, [getCompetitor2()]);
        var courseClassSet = new CourseClassSet([courseClass1, courseClass2]);
        assert.deepEqual(courseClassSet.getNumClasses(), 2, "Course-class set should have two classes");
    });

    QUnit.test("Cumulative times of the winner of an empty course-class set is null", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [])]);
        assert.strictEqual(courseClassSet.getWinnerCumTimes(), null, "There should be no winner if there are no competitors");
    });

    QUnit.test("Course-class set made up of course-class without dubious data that should itself not have dubious data", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [])]);
        assert.ok(!courseClassSet.hasDubiousData());
    });

    QUnit.test("Course-class set made up of course-class with dubious data should also have dubious data", function (assert) {
        var courseClass = new CourseClass("Test", 3, []);
        courseClass.recordHasDubiousData();
        var courseClassSet = new CourseClassSet([courseClass]);
        assert.ok(courseClassSet.hasDubiousData());
    });

    QUnit.test("Course-class set made up of two course-classes, one with dubious data and one without, should have dubious data", function (assert) {
        var courseClass1 = new CourseClass("Test 1", 3, []);
        courseClass1.recordHasDubiousData();
        var courseClass2 = new CourseClass("Test 2", 3, []);
        var courseClassSet = new CourseClassSet([courseClass1, courseClass2]);
        assert.ok(courseClassSet.hasDubiousData());
    });

    QUnit.test("Cumulative times of the winner of a course-class set with only mispunchers is null", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [
            getCompetitor1WithNullFinishSplit(),
            getCompetitor2WithNullSplitForControl2()
        ])]);
        assert.strictEqual(courseClassSet.getWinnerCumTimes(), null, "There should be no winner if there are no competitors that completed the course");
    });

    QUnit.test("Cumulative times of the winner of a single-class set are those with quickest time", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getCompetitor2(), getFasterCompetitor1()])]);
        var winTimes = courseClassSet.getWinnerCumTimes();
        assert.deepEqual(winTimes, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100], "John Smith (second competitor) should be the winner");
    });

    QUnit.test("Cumulative times of the winner of a multiple-class set are those with quickest time", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [getCompetitor2()]), new CourseClass("Test 2", 3, [getFasterCompetitor1()])]);
        var winTimes = courseClassSet.getWinnerCumTimes();
        assert.deepEqual(winTimes, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100], "John Smith (second competitor) from the second course should be the winner");
    });
    
    QUnit.test("Cumulative times of the winner of a class containing only a single competitor with a dubious cumulative time include a filled gap", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [getCompetitor1WithDubiousSplitForControl2()])]);
        var winTimes = courseClassSet.getWinnerCumTimes();
        assert.deepEqual(winTimes, [0, 65, 65 + (221 + 184) / 2, 65 + 221 + 184, 65 + 221 + 184 + 100], "Cumulative times should have filled-in gap");
    });
    
    QUnit.test("Cumulative times of the winner of a class containing only a single competitor with a dubious finish time include a filled gap", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [getCompetitor1WithDubiousFinishTime()])]);
        var winTimes = courseClassSet.getWinnerCumTimes();
        assert.deepEqual(winTimes, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 60], "Cumulative times should have filled-in time to finish");
    });
    
    QUnit.test("Cumulative times of the winner of a class containing only a single competitor with dubious times to the last control and finish include a filled gap", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [getCompetitor1WithDubiousTimeToLastControlAndFinish()])]);
        var winTimes = courseClassSet.getWinnerCumTimes();
        assert.deepEqual(winTimes, [0, 65, 65 + 221, 65 + 221 + 180, 65 + 221 + 180 + 60], "Cumulative times should have filled-in time to last control and finish");
    });

    QUnit.test("Fastest cumulative times on course-class set with no competitors should have backpopulated dummy cumulative times", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [])]);
        assert.deepEqual(courseClassSet.getFastestCumTimes(), [0, 180, 360, 540, 600], "Empty course-class set should have dummy fastest times");
    });

    QUnit.test("Fastest cumulative times on course-class set when both competitors have dubious time at one control has backpopulated value for missing control", function (assert) {
        var competitor1 = fromOriginalCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 65, 65 + 221 + 209, 65 + 221 + 209 + 100]);
        competitor1.setRepairedCumulativeTimes([0, 65, NaN, 65 + 221 + 209, 65 + 221 + 209 + 100]);
        var competitor2 = fromOriginalCumTimes(2, "Fred Brown", "DEF", 10 * 3600 + 30, [0, 81, 81, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        competitor2.setRepairedCumulativeTimes([0, 81, NaN, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2])]);
        
        assert.deepEqual(courseClassSet.getFastestCumTimes(), [0, 65, 65 + (197 + 212) / 2, 65 + 197 + 212, 65 + 197 + 212 + 100],
                    "Class with one control mispunched by all should have dummy value for missing control");
    });

    QUnit.test("Fastest cumulative times on course-class set when only competitor has missing time at last control has backpopulated values from that competitor", function (assert) {
        var competitor = fromCumTimes(1, "John Smith", "ABC", 10 * 3600, [0, 65, 65 + 221, null, 65 + 221 + 209 + 100]);
        // modified
        competitor.totalTime = 209+100;
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [competitor])]);
        assert.deepEqual(courseClassSet.getFastestCumTimes(), [0, 65, 65 + 221, 65 + 221 + (209 + 100) / 2, 65 + 221 + 209 + 100],
                    "Class with penultimate control mispunched by only competitor should have correct dummy value for missing control");
    });
    
    QUnit.test("Fastest cumulative times on course-class set with one control mispunched by all has dummy fastest split for missing control", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getCompetitor1WithNullSplitForControl2(), getCompetitor2WithNullSplitForControl2()])]);
        // modified
        courseClassSet.classes[0].competitors[0].totalTime = 100;
        courseClassSet.classes[0].competitors[1].totalTime = 200;
        assert.deepEqual(courseClassSet.getFastestCumTimes(), [0, 65, 245, 429, 529], "Class with one control mispunched by all should have dummy value for missing control");
    });

    QUnit.test("Fastest cumulative times on a single-class set should be made up of fastest times", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2()])]);
        assert.deepEqual(courseClassSet.getFastestCumTimes(), [0, 65, 65 + 197, 65 + 197 + 184, 65 + 197 + 184 + 100], "Fastest cumulative time should be made up of fastest splits");
    });

    QUnit.test("Fastest cumulative times on a multiple-class set should be made up of fastest times from competitors from both classes", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1 ", 3, [getFasterCompetitor1()]), new CourseClass("Test 2", 3, [getCompetitor2()])]);
        assert.deepEqual(courseClassSet.getFastestCumTimes(), [0, 65, 65 + 197, 65 + 197 + 184, 65 + 197 + 184 + 100], "Fastest cumulative time should be made up of fastest splits");
    });

    QUnit.test("Fastest cumulative times plus 75% on single-class set should be made up of fastest times with 75%", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2()])]);
        assert.deepEqual(courseClassSet.getFastestCumTimesPlusPercentage(75), [0, 65 * 1.75, (65 + 197) * 1.75, (65 + 197 + 184) * 1.75, (65 + 197 + 184 + 100) * 1.75],
                                "Fastest cumulative times + 75% should be made up of fastest cumulative splits with 75% added");
    });

    QUnit.test("Fastest cumulative times on single-class set should be made up of fastest split times ignoring nulls", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getCompetitor1WithNullFinishSplit(), getCompetitor2WithNullSplitForControl2()])]);
        // modified
        courseClassSet.classes[0].competitors[0].totalTime = 65 + 221 + 184 + 12;
        courseClassSet.classes[0].competitors[1].totalTime = 81+ 20 + 212 + 106 ;
        assert.deepEqual(courseClassSet.getFastestCumTimes(), [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 106],
                            "Fastest cumulative times should be made up of fastest splits where not null");
    });

    QUnit.test("Fastest cumulative times on single-class set should be made up of fastest split times ignoring dubious splits", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getCompetitor1WithDubiousSplitForControl2(), getCompetitor2()])]);
        assert.deepEqual(courseClassSet.getFastestCumTimes(), [0, 65, 65 + 197, 65 + 197 + 212, 65 + 197 + 212 + 100],
                            "Fastest cumulative times should be made up of fastest splits where not NaN");
    });
    
    QUnit.test("Cumulative times of the second competitor in a single-class set are those of the second competitor", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getCompetitor2(), getFasterCompetitor1()])]);
        var competitorTimes = courseClassSet.getCumulativeTimesForCompetitor(1);
        assert.deepEqual(competitorTimes, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106], "Fred Brown (first competitor) should be the second competitor");
    });

    QUnit.test("Cumulative times of the second competitor of a multiple-class set are those of the second competitor", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [getCompetitor2()]), new CourseClass("Test 2", 3, [getFasterCompetitor1()])]);
        var competitorTimes = courseClassSet.getCumulativeTimesForCompetitor(1);
        assert.deepEqual(competitorTimes, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106], "Fred Brown (first competitor) from the first course should be the second competitor");
    });
    
    QUnit.test("Cumulative times of the competitor in a class containing only a single competitor with a dubious cumulative time include a filled gap", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [getCompetitor1WithDubiousSplitForControl2()])]);
        var competitorTimes = courseClassSet.getCumulativeTimesForCompetitor(0);
        assert.deepEqual(competitorTimes, [0, 65, 65 + (221 + 184) / 2, 65 + 221 + 184, 65 + 221 + 184 + 100], "Cumulative times should have filled-in gap");
    });
    
    QUnit.test("Cumulative times of the competitor in a class containing only a single competitor with a dubious finish time include a filled gap", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [getCompetitor1WithDubiousFinishTime()])]);
        var competitorTimes = courseClassSet.getCumulativeTimesForCompetitor(0);
        assert.deepEqual(competitorTimes, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 60], "Cumulative times should have filled-in time to finish include a filled gap");
    });
    
    QUnit.test("Cumulative times of the competitor in a class containing only a single competitor with dubious times to the last control and finish have the gap filled", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [getCompetitor1WithDubiousTimeToLastControlAndFinish()])]);
        var competitorTimes = courseClassSet.getCumulativeTimesForCompetitor(0);
        assert.deepEqual(competitorTimes, [0, 65, 65 + 221, 65 + 221 + 180, 65 + 221 + 180 + 60], "Cumulative times should have filled-in time to last control and finish");
    });
    
    function assertSplitRanks(assert, competitor, expectedSplitRanks) {
        expectedSplitRanks.forEach(function (splitRank, index) {
            if (isNaNStrict(splitRank)) {
                assert.ok(isNaNStrict(competitor.getSplitRankTo(index + 1)));
            } else {
                assert.strictEqual(competitor.getSplitRankTo(index + 1), splitRank);
            }
        });
    }
    
    function assertCumulativeRanks(assert, competitor, expectedCumulativeRanks) {
        expectedCumulativeRanks.forEach(function (cumulativeRank, index) {
            if (isNaNStrict(cumulativeRank)) {
                assert.ok(isNaNStrict(competitor.getCumulativeRankTo(index + 1)));
            } else {
                assert.strictEqual(competitor.getCumulativeRankTo(index + 1), cumulativeRank);
            }
        });
    }
    
    function assertSplitAndCumulativeRanks(assert, competitor, expectedSplitRanks, expectedCumulativeRanks) {
        assertSplitRanks(assert, competitor, expectedSplitRanks);
        assertCumulativeRanks(assert, competitor, expectedCumulativeRanks);
    }
    
    QUnit.test("Can compute ranks of single competitor as all 1s", function (assert) {
        var competitor = getCompetitor1();
        new CourseClassSet([new CourseClass("Test", 3, [competitor])]);
        assertSplitAndCumulativeRanks(assert, competitor, [1, 1, 1, 1], [1, 1, 1, 1]);
    });
    
    QUnit.test("Can compute ranks in single-class set when there are two competitors with no equal times", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2])]);
        
        assertSplitAndCumulativeRanks(assert, competitor1, [1, 2, 1, 1], [1, 2, 2, 1]);
        assertSplitAndCumulativeRanks(assert, competitor2, [2, 1, 2, 2], [2, 1, 1, 2]);
    });
    
    QUnit.test("Can compute ranks in multiple-class set when there are two competitors with no equal times", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        new CourseClassSet([new CourseClass("Test 1", 3, [competitor1]), new CourseClass("Test 2", 3, [competitor2])]);
        
        assertSplitAndCumulativeRanks(assert, competitor1, [1, 2, 1, 1], [1, 2, 2, 1]);
        assertSplitAndCumulativeRanks(assert, competitor2, [2, 1, 2, 2], [2, 1, 1, 2]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors with no equal times", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        assertSplitAndCumulativeRanks(assert, competitor1, [1, 3, 2, 1], [1, 2, 3, 1]);
        assertSplitAndCumulativeRanks(assert, competitor2, [3, 1, 3, 2], [3, 1, 2, 2]);
        assertSplitAndCumulativeRanks(assert, competitor3, [2, 2, 1, 3], [2, 3, 1, 3]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors with one pair of equal split times", function (assert) {
        var competitor1 = getCompetitor1WithSameControl2SplitAsThatOfCompetitor2();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        assertSplitAndCumulativeRanks(assert, competitor1, [1, 1, 2, 1], [1, 1, 1, 1]);
        assertSplitAndCumulativeRanks(assert, competitor2, [3, 1, 3, 2], [3, 2, 3, 2]);
        assertSplitAndCumulativeRanks(assert, competitor3, [2, 3, 1, 3], [2, 3, 2, 3]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors with one pair of equal cumulative times", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3WithSameTotalTimeAsCompetitor1();
        new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        assertSplitAndCumulativeRanks(assert, competitor1, [1, 3, 2, 1], [1, 2, 3, 1]);
        assertSplitAndCumulativeRanks(assert, competitor2, [3, 1, 3, 2], [3, 1, 2, 3]);
        assertSplitAndCumulativeRanks(assert, competitor3, [2, 2, 1, 3], [2, 3, 1, 1]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors with one missing split times", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2WithNullSplitForControl2();
        var competitor3 = getCompetitor3();
        new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        assertSplitAndCumulativeRanks(assert, competitor1, [1, 2, 2, 1], [1, 1, 2, 1]);
        assertSplitAndCumulativeRanks(assert, competitor2, [3, null, 3, 2], [3, null, null, null]);
        assertSplitAndCumulativeRanks(assert, competitor3, [2, 1, 1, 3], [2, 2, 1, 2]);
    });
    
    QUnit.test("Can compute ranks when there is one control that all three competitors mispunch", function (assert) {
        var competitor1 = getCompetitor1WithNullFinishSplit();
        var competitor2 = getCompetitor2WithNullFinishSplit();
        var competitor3 = getCompetitor3WithNullFinishSplit();
        new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        assertSplitAndCumulativeRanks(assert, competitor1, [1, 3, 1, null], [1, 2, 1, null]);
        assertSplitAndCumulativeRanks(assert, competitor2, [3, 1, 3, null], [3, 1, 3, null]);
        assertSplitAndCumulativeRanks(assert, competitor3, [2, 2, 2, null], [2, 3, 2, null]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors specified by cumulative times with one missing split times", function (assert) {
        var competitor1 = fromCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var competitor2 = fromCumTimes(2, "John Smith", "ABC", 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 209, 65 + 221 + 209 + 100]);
        var competitor3 = fromCumTimes(2, "Bill Baker", "GHI", 11 * 3600, [0, 78, null,     78 + 209 + 199, 78 + 209 + 199 + 117]);
        new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        assertSplitAndCumulativeRanks(assert, competitor1, [3, 1, 2, 2], [3, 1, 1, 2]);
        assertSplitAndCumulativeRanks(assert, competitor2, [1, 2, 1, 1], [1, 2, 2, 1]);
        
        // No cumulative ranks from control 2 onwards: as competitor 3
        // mispunches they no don't have a cumulative rank from that point
        // onwards.
        assertSplitAndCumulativeRanks(assert, competitor3, [2, null, null, 3], [2, null, null, null]);
    });
    
    QUnit.test("Can compute ranks when there are three competitors specified by cumulative times with one having a dubious split time", function (assert) {
        var competitor1 = fromCumTimes(1, "Fred Brown", "DEF", 10 * 3600 + 30 * 60, [0, 81, 81 + 197, 81 + 197 + 212, 81 + 197 + 212 + 106]);
        var competitor2 = fromCumTimes(2, "John Smith", "ABC", 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 209, 65 + 221 + 209 + 100]);
        var competitor3 = fromOriginalCumTimes(2, "Bill Baker", "GHI", 11 * 3600, [0, 78, 78 - 30, 78 + 209 + 199, 78 + 209 + 199 + 117]);
        competitor3.setRepairedCumulativeTimes([0, 78, NaN, 78 + 209 + 199, 78 + 209 + 199 + 117]);
        new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        assertSplitAndCumulativeRanks(assert, competitor1, [3, 1, 2, 2], [3, 1, 2, 2]);
        assertSplitAndCumulativeRanks(assert, competitor2, [1, 2, 1, 1], [1, 2, 3, 1]);
        
        assertSplitAndCumulativeRanks(assert, competitor3, [2, NaN, NaN, 3], [2, NaN, 1, 3]);
    });
    
    QUnit.test("Can get fastest two splits to control 3 from single-class set with three competitors", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        var fastestSplits = courseClassSet.getFastestSplitsTo(2, 3);
        assert.deepEqual(fastestSplits, [{split: 199, name: competitor3.name}, {split: 209, name: competitor1.name}]);
    });
    
    QUnit.test("Can get fastest two splits to control 3 from multiple-class set with three competitors", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [competitor1]), new CourseClass("Test 2", 3, [competitor2, competitor3])]);
        
        var fastestSplits = courseClassSet.getFastestSplitsTo(2, 3);
        assert.deepEqual(fastestSplits, [{split: 199, name: competitor3.name}, {split: 209, name: competitor1.name}]);
    });
    
    QUnit.test("Can get fastest two splits to finish from single-class set with three competitors", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        var fastestSplits = courseClassSet.getFastestSplitsTo(2, 4);
        assert.deepEqual(fastestSplits, [{split: 100, name: competitor1.name}, {split: 106, name: competitor2.name}]);
    });
    
    QUnit.test("When getting fastest four splits to control 3 from single-class set with three competitors then three splits returned", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        var fastestSplits = courseClassSet.getFastestSplitsTo(4, 3);
        assert.deepEqual(fastestSplits, [{split: 199, name: competitor3.name}, {split: 209, name: competitor1.name}, {split: 212, name: competitor2.name}]);
    });
    
    QUnit.test("When getting fastest two splits to control 3 from single-class set with three competitors with one mispunching control 3 then splits for other two competitors returned", function (assert) {
        var competitor1 = getCompetitor1WithNullSplitForControl3();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        var fastestSplits = courseClassSet.getFastestSplitsTo(2, 3);
        assert.deepEqual(fastestSplits, [{split: 199, name: competitor3.name}, {split: 212, name: competitor2.name}]);
    });
    
    QUnit.test("When getting fastest two splits to control 3 from single-class set with three competitors with one mispunching a different control then splits for other two competitors returned", function (assert) {
        var competitor1 = getCompetitor1();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3WithNullSplitForControl2();
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        var fastestSplits = courseClassSet.getFastestSplitsTo(2, 3);
        assert.deepEqual(fastestSplits, [{split: 209, name: competitor1.name}, {split: 212, name: competitor2.name}]);
    });
    
    QUnit.test("When getting fastest two splits to control 3 from single-class set with three competitors with two mispunching control 3 then one split returned", function (assert) {
        var competitor1 = getCompetitor1WithNullSplitForControl3();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3WithNullSplitForControl3();
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        var fastestSplits = courseClassSet.getFastestSplitsTo(2, 3);
        assert.deepEqual(fastestSplits, [{split: 212, name: competitor2.name}]);
    });
    
    QUnit.test("When getting fastest three splits to control 2 from single-class set with three competitors with one having a dubious split then competitor with dubious split omitted", function (assert) {
        var competitor1 = getCompetitor1WithDubiousSplitForControl2();
        var competitor2 = getCompetitor2();
        var competitor3 = getCompetitor3();
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [competitor1, competitor2, competitor3])]);
        
        var fastestSplits = courseClassSet.getFastestSplitsTo(3, 2);
        assert.deepEqual(fastestSplits, [{split: 197, name: competitor2.name}, {split: 209, name: competitor3.name}]);
    });

    /**
    * Asserts that attempting to get the fastest splits of the given competitors
    * will fail with an InvalidData exception.
    * @param {QUnit.assert} assert - QUnit assertion object.
    * @param {Array} competitors - Array of competitor objects.
    * @param {Number} numSplits - The number of fastest splits to attempt to return.
    * @param {Number} controlIdx - The index of the control.
    */
    function assertCannotGetFastestSplits(assert, competitors, numSplits, controlIdx) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, competitors)]);
        SplitsBrowserTest.assertInvalidData(assert, function () {
            courseClassSet.getFastestSplitsTo(numSplits, controlIdx);        
        });
    }
    
    QUnit.test("Cannot return fastest 0 splits to a control", function (assert) {
        assertCannotGetFastestSplits(assert, [getCompetitor1()], 0, 3);
    });
    
    QUnit.test("Cannot return fastest splits to a control when the number of such splits is not numeric", function (assert) {
        assertCannotGetFastestSplits(assert, [getCompetitor1()], "this is not a number", 3);
    });
    
    QUnit.test("Cannot return fastest splits to control zero", function (assert) {
        assertCannotGetFastestSplits(assert, [getCompetitor1()], 1, 0);
    });
    
    QUnit.test("Cannot return fastest splits to control out of range", function (assert) {
        assertCannotGetFastestSplits(assert, [getCompetitor1()], 1, 5);
    });
    
    QUnit.test("Cannot return fastest splits to control that is not a number", function (assert) {
        assertCannotGetFastestSplits(assert, [getCompetitor1()], 1, "this is not a number");
    });

    QUnit.test("Can return chart data for two competitors in same class", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2()])]);
        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [0, 1], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0, 0] },
                { x: 65, ys: [0, 16] },
                { x: 65 + 197, ys: [24, 16] },
                { x: 65 + 197 + 184, ys: [24, 44] },
                { x: 65 + 197 + 184 + 100, ys: [24, 50] }
            ],
            xExtent: [0, 65 + 197 + 184 + 100],
            yExtent: [0, 50],
            numControls: 3,
            competitorNames: ["John Smith", "Fred Brown"],
            dubiousTimesInfo: [[], []]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    QUnit.test("Can return chart data for two competitors where one of them has a dubious split", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getCompetitor1WithDubiousSplitForControl2(), getCompetitor2()])]);
        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [0, 1], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0, 0] },
                { x: 65, ys: [0, 16] },
                { x: 65 + 197, ys: [NaN, 16] },
                { x: 65 + 197 + 212, ys: [-4, 16] },
                { x: 65 + 197 + 212 + 100, ys: [-4, 22] }
            ],
            xExtent: [0, 65 + 197 + 212 + 100],
            yExtent: [-4, 22],
            numControls: 3,
            competitorNames: ["John Smith", "Fred Brown"],
            dubiousTimesInfo: [[{start: 1, end: 3}], []]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    QUnit.test("Can return chart data for two competitors where one of them has a dubious split and chart type has skip-start", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getCompetitor1WithDubiousSplitForControl2(), getCompetitor2()])]);
        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [0, 1], DUMMY_CHART_TYPE_SKIP);

        var expectedChartData = {
            dataColumns: [
                { x: 65, ys: [0, 0] },
                { x: 65 + 197, ys: [0, 16] },
                { x: 65 + 197 + 212, ys: [NaN, 16] },
                { x: 65 + 197 + 212 + 100, ys: [-4, 16] }
            ],
            xExtent: [0, 65 + 197 + 212 + 100],
            yExtent: [-4, 22],
            numControls: 3,
            competitorNames: ["John Smith", "Fred Brown"],
            dubiousTimesInfo: [[{start: 0, end: 2}], []]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    // If the start is being skipped, then we must ignore dubious times to control 1.
    QUnit.test("Can return chart data with no dubious time for two competitors where one of them has a dubious split to control 1 and chart type has skip-start", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getCompetitor1WithDubiousSplitForControl1(), getCompetitor2()])]);
        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [0, 1], DUMMY_CHART_TYPE_SKIP);

        var expectedChartData = {
            dataColumns: [
                { x: 81, ys: [0, 0] },
                { x: 81 + 197, ys: [NaN, 0] },
                { x: 81 + 197 + 184, ys: [8, 0] },
                { x: 81 + 197 + 184 + 100, ys: [8, 28] }
            ],
            xExtent: [0, 81 + 197 + 184 + 100],
            yExtent: [0, 34],
            numControls: 3,
            competitorNames: ["John Smith", "Fred Brown"],
            dubiousTimesInfo: [[/* none */], []]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    QUnit.test("Can return chart data for two competitors in same class with correct X-extent when one competitor has cumulative times not in order", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2WithFinishCumTimeNotTheLargest()])]);
        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [0, 1], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0, 0] },
                { x: 65, ys: [16, 0] },
                { x: 65 + 197, ys: [16, 24] },
                { x: 65 + 197 + 184, ys: [44, 24] },
                { x: 65 + 197 + 184 - 73, ys: [44, 197] }
            ],
            xExtent: [0, 65 + 197 + 184],
            yExtent: [0, 197],
            numControls: 3,
            competitorNames: ["Fred Brown", "John Smith"],
            dubiousTimesInfo: [[], []]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    QUnit.test("Can return chart data for two competitors in same class with correct X-extent when one competitor has the first cumulative time larger than all others", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2WithFirstControlLargerThanAllOthers()])]);

        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [0, 1], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0, 0] },
                { x: 65, ys: [0, 4038] },
                { x: 65 + (81 + 197 - 4103), ys: [4046, 4038] },
                { x: 65 + (81 + 197 - 4103) + 184, ys: [4046, 4066] },
                { x: 65 + (81 + 197 - 4103) + 184 + 100, ys: [4046, 4072] }
            ],
            xExtent: [65 + (81 + 197 - 4103), 65],
            yExtent: [0, 4072],
            numControls: 3,
            competitorNames: ["John Smith", "Fred Brown"],
            dubiousTimesInfo: [[], []]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    QUnit.test("Can return chart data for two competitors in different classes of the set", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test 1", 3, [getFasterCompetitor1()]), new CourseClass("Test 2", 3, [getCompetitor2()])]);
        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [0, 1], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0, 0] },
                { x: 65, ys: [0, 16] },
                { x: 65 + 197, ys: [24, 16] },
                { x: 65 + 197 + 184, ys: [24, 44] },
                { x: 65 + 197 + 184 + 100, ys: [24, 50] }
            ],
            xExtent: [0, 65 + 197 + 184 + 100],
            yExtent: [0, 50],
            numControls: 3,
            competitorNames: ["John Smith", "Fred Brown"],
            dubiousTimesInfo: [[], []]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    QUnit.test("Can return chart data for first competitor only", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2()])]);
        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [0], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0] },
                { x: 65, ys: [0] },
                { x: 65 + 197, ys: [24] },
                { x: 65 + 197 + 184, ys: [24] },
                { x: 65 + 197 + 184 + 100, ys: [24] }
            ],
            xExtent: [0, 65 + 197 + 184 + 100],
            yExtent: [0, 24],
            numControls: 3,
            competitorNames: ["John Smith"],
            dubiousTimesInfo: [[]]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    QUnit.test("Can return chart data for second competitor only", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2()])]);
        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [1], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [
                { x: 0, ys: [0] },
                { x: 65, ys: [16] },
                { x: 65 + 197, ys: [16] },
                { x: 65 + 197 + 184, ys: [44] },
                { x: 65 + 197 + 184 + 100, ys: [50] }
            ],
            xExtent: [0, 65 + 197 + 184 + 100],
            yExtent: [0, 50],
            numControls: 3,
            competitorNames: ["Fred Brown"],
            dubiousTimesInfo: [[]]
        };

        assert.deepEqual(chartData, expectedChartData);
    });

    QUnit.test("Can return chart data for empty list of competitors", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2()])]);
        var fastestTime = courseClassSet.getFastestCumTimes();

        var chartData = courseClassSet.getChartData(fastestTime, [], _DUMMY_CHART_TYPE);

        var expectedChartData = {
            dataColumns: [],
            xExtent: [0, 65 + 197 + 184 + 100],
            yExtent: chartData.yExtent, // Deliberately set this equal, we'll test it later.
            numControls: 3,
            competitorNames: [],
            dubiousTimesInfo: []
        };

        assert.deepEqual(chartData, expectedChartData);

        assert.ok(chartData.yExtent[0] < chartData.yExtent[1], "The y-axis should have a positive extent: got values " + chartData.yExtent[0] + " and " + chartData.yExtent[1]);
    });    

    QUnit.test("Can return empty chart data when no competitors", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [])]);
        var data = courseClassSet.getChartData([0, 87, 87 + 147, 87 + 147 + 92], [], _DUMMY_CHART_TYPE);
        var expectedChartData = {
            dataColumns: [],
            xExtent: data.xExtent,
            yExtent: data.yExtent,
            numControls: 3,
            competitorNames: [],
            dubiousTimesInfo: []
        };
        assert.deepEqual(data, expectedChartData);
    });

    QUnit.test("Cannot return chart data when no reference data given", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2()])]);
        SplitsBrowserTest.assertException(assert, "TypeError", function () {
            courseClassSet.getChartData();
        });
    });

    QUnit.test("Cannot return chart data when no current indexes given", function (assert) {
        var courseClassSet = new CourseClassSet([new CourseClass("Test", 3, [getFasterCompetitor1(), getCompetitor2()])]);
        SplitsBrowserTest.assertException(assert, "TypeError", function () {
            courseClassSet.getChartData([0, 65, 65 + 197, 65 + 197 + 184, 65 + 197 + 184 + 100], _DUMMY_CHART_TYPE);
        });
    });    
})();