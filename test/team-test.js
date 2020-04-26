/*
 *  SplitsBrowser - Team tests.
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
    var Team = SplitsBrowser.Model.Team;

    QUnit.module("Team");
    
    QUnit.test("Can create a team and set members", function (assert) {
        var team = new Team("Team 1", "ABC");
        team.setMembers([new Competitor("First Runner", "ABC"), new Competitor("Second Runner", "ABC")]);
        assert.strictEqual(team.name, "Team 1");
        assert.strictEqual(team.club, "ABC");
        assert.strictEqual(team.members[0].name, "First Runner");
        assert.strictEqual(team.members[1].name, "Second Runner");
    });
})();
