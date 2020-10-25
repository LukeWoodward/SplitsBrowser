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

    const Competitor = SplitsBrowser.Model.Competitor;

    QUnit.module("Competitor");

    QUnit.test("Can create a competitor with gender and year of birth and read them back", function (assert) {
        const competitor = new Competitor("First Runner", "ABC");
        competitor.setYearOfBirth(1984);
        competitor.setGender("M");
        assert.strictEqual(competitor.yearOfBirth, 1984);
        assert.strictEqual(competitor.gender, "M");
    });
})();
