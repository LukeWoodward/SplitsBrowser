/*
 *  SplitsBrowser - Competitor tests.
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
(function (){
    "use strict";

    var Competitor = SplitsBrowser.Model.Competitor;
    var compareCompetitors = SplitsBrowser.Model.compareCompetitors;
    var fromCumTimes = SplitsBrowser.Model.Result.fromCumTimes;

    QUnit.module("Competitor");

    QUnit.test("Can create a competitor with gender and year of birth and read them back", function (assert) {
        var competitor = new Competitor("First Runner", "ABC", fromCumTimes(1, 10 * 3600, [0, 65, 65 + 221, 65 + 221 + 184, 65 + 221 + 184 + 100]));
        competitor.setYearOfBirth(1984);
        competitor.setGender("M");
        assert.strictEqual(competitor.yearOfBirth, 1984);
        assert.strictEqual(competitor.gender, "M");
    });    

    QUnit.test("Competitor with lower total time comes before result with higher total time", function (assert) {
        var result1 = fromCumTimes(1, 10 * 3600, [0, 154]);
        var result2 = fromCumTimes(2, 12 * 3600, [0, 188]);
        var competitor1 = new Competitor("First Runner", "ABC", result1);
        var competitor2 = new Competitor("Second Runner", "DEF", result2);
        assert.ok(compareCompetitors(competitor1, competitor2) < 0, "Comparison result was not as affected");
    });  
})();
