/* global d3 */
/* global QUnit, module, expect */
/* global SplitsBrowser */

(function (){
    "use strict";

    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var fromSplitTimes = SplitsBrowser.Model.Competitor.fromSplitTimes;
    var fromCumTimes = SplitsBrowser.Model.Competitor.fromCumTimes;

    function signum(n) {
        return (n < 0) ? -1 : ((n > 0) ? 1 : 0);
    }

    module("Competitor");
    
    var assertSplitTimes = function (assert, competitor, expectedSplitTimes) {
        expectedSplitTimes.forEach(function (splitTime, controlIdx) {
            assert.equal(competitor.getSplitTimeTo(controlIdx + 1), splitTime);
        });
    };
    
    var assertCumulativeTimes = function (assert, competitor, expectedCumulativeTimes) {
        expectedCumulativeTimes.forEach(function (splitTime, controlIdx) {
            assert.equal(competitor.getCumulativeTimeTo(controlIdx), splitTime);
        });
    };

    QUnit.test("Can create a competitor from split times and determine cumulative times", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
        assertCumulativeTimes(assert, competitor, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assert.deepEqual(competitor.getAllCumulativeTimes(), [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]);
        assertSplitTimes(assert, competitor, [65, 221, 184, 100]);
        assert.ok(competitor.completed(), "Competitor should be marked as completing the course");
    });

    QUnit.test("Can create a competitor from split times and determine cumulative times when competitor has missed a control", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221,  null, 184, 100]);
        assertCumulativeTimes(assert, competitor, [0, 65, 65 + 221, null, null, null]);
        assertSplitTimes(assert, competitor, [65, 221, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Can create a competitor from split times and determine cumulative times when competitor has missed multiple consecutive controls", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, null, null, null, null, 184, 100]);
        assertCumulativeTimes(assert, competitor, [0, 65, 65 + 221, null, null, null, null, null, null]);
        assertSplitTimes(assert, competitor, [65, 221, null, null, null, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Can create a competitor from cumulative times and determine split times", function (assert) {
        var cumTimes = [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", "10:00", cumTimes);
        assertCumulativeTimes(assert, competitor, cumTimes);
        assert.deepEqual(competitor.getAllCumulativeTimes(), cumTimes);
        assertSplitTimes(assert, competitor, [65, 221, 184, 100]);
        assert.ok(competitor.completed(), "Competitor should be marked as completing the course");
    });

    QUnit.test("Can create a competitor from cumulative times and determine split times when competitor has missed a control", function (assert) {
        var cumTimes = [0, 65, null, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", "10:00", cumTimes);
        assertCumulativeTimes(assert, competitor, cumTimes);
        assert.deepEqual(competitor.getAllCumulativeTimes(), cumTimes);
        assertSplitTimes(assert, competitor, [65, null, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Can create a competitor from cumulative times and determine split times when competitor has missed multiple consecutive controls", function (assert) {
        var cumTimes = [0, 65, null, null, null, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100];
        var competitor = fromCumTimes(1, "John", "Smith", "ABC", "10:00", cumTimes);
        assertCumulativeTimes(assert, competitor, cumTimes);
        assertSplitTimes(assert, competitor, [65, null, null, null, null, 184, 100]);
        assert.ok(!competitor.completed(), "Competitor should be marked as not completing the course");
    });

    QUnit.test("Can determine total time of a competitor that punches all controls", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
        assert.equal(competitor.totalTime, 65 + 221 + 184 + 100, "Wrong total time");
    });

    QUnit.test("Determines total time of a competitor that mispunches as null", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, null, 100]);
        assert.strictEqual(competitor.totalTime, null, "Total time should be null");
    });
    
    QUnit.test("Competitor with valid time compares equal to itself", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [154]);
        assert.equal(compareCompetitors(competitor, competitor), 0);
    });

    QUnit.test("Competitor with lower total time comes before competitor with higher total time", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [154]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", "12:00", [188]);
        assert.equal(signum(compareCompetitors(competitor1, competitor2)), -1);
    });

    QUnit.test("Competitor with higher total time comes before competitor with higher total time", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [188]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", "12:00", [154]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Competitor with lower order comes before competitor with same total time but higher order", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [188]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", "12:00", [188]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
    });

    QUnit.test("Competitor with higher order comes after competitor with same total time but lower order", function (assert) {
        var competitor1 = fromSplitTimes(3, "John", "Smith", "ABC", "10:00", [188]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", "12:00", [188]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Competitor with valid time comes before mispunching competitor", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [154]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", "12:00", [null]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
    });

    QUnit.test("Mispunching competitor compares equal to itself", function (assert) {
        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [null]);
        assert.equal(compareCompetitors(competitor, competitor), 0);
    });

    QUnit.test("Mispunching competitor comes after competitor with valid time", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [null]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", "12:00", [188]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Mispunching competitor with lower order comes before mispunching competitor with higher order", function (assert) {
        var competitor1 = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [null]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", "12:00", [null]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)) , -1);
    });

    QUnit.test("Mispunching competitor with higher order comes before mispunching competitor with lower order", function (assert) {
        var competitor1 = fromSplitTimes(3, "John", "Smith", "ABC", "10:00", [null]);
        var competitor2 = fromSplitTimes(2, "Fred", "Baker", "DEF", "12:00", [null]);
        assert.ok(signum(compareCompetitors(competitor1, competitor2)), 1);
    });

    QUnit.test("Cannot adjust a Competitor object by reference data with a different number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
        var referenceCumTimes = [0, 77, 77 + 200, 77 + 200 + 159, 77 + 200 + 159 + 66, 77 + 200 + 159 + 66 + 149];
        try {
            competitor.getCumTimesAdjustedToReference(referenceCumTimes);
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
        }
    });

    QUnit.test("Cannot adjust a Competitor object by reference data with a missing split time", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
        var referenceCumTimes = [0, 77, 77 + 200, null, 77 + 200 + 159 + 66];
        try {
            competitor.getCumTimesAdjustedToReference(referenceCumTimes);
            assert.ok(false, "This should not be reached");
        } catch (e) {
            assert.equal(e.name, "InvalidData", "Exception should have name InvalidData, exception message is " + e.message);
        }
    });

    QUnit.test("Can adjust a competitor's cumulative times by a reference object with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [0, 4, 4 + 28, 4 + 28 + 8, 4 + 28 + 8 - 3];
        assert.deepEqual(competitor.getCumTimesAdjustedToReference(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Can adjust a competitor's cumulative times with a missing time by a reference object with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, null, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedCumTimes = [0, 4, 4 + 28, null, null];
        assert.deepEqual(competitor.getCumTimesAdjustedToReference(referenceCumTimes), expectedCumTimes);
    });

    QUnit.test("Can determine the percentages a competitor is behind a reference object with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, 184, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, 100 * (184 - 176) / 176, 100 * (100 - 103) / 103];
        assert.deepEqual(competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });

    QUnit.test("Can determine the percentages a competitor with a missing time is behind a reference object with all valid times and same number of controls", function (assert) {

        var competitor = fromSplitTimes(1, "John", "Smith", "ABC", "10:00", [65, 221, null, 100]);
        var referenceCumTimes = [0, 61, 61 + 193, 61 + 193 + 176, 61 + 193 + 176 + 103];
        var expectedPercentagesBehind = [0, 100 * (65 - 61) / 61, 100 * (221 - 193) / 193, null, 100 * (100 - 103) / 103];
        assert.deepEqual(competitor.getSplitPercentsBehindReferenceCumTimes(referenceCumTimes), expectedPercentagesBehind);
    });
})();
