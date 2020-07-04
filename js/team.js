/*
 *  SplitsBrowser Team - A team of competitors that competed at an event.
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

    /**
    * Object that represents the data for a single team.
    *
    * @constructor
    * @param {String} name The name of the team.
    * @param {String} club The name of the team's club.
    */
    function Team(name, club) {
        this.name = name;
        this.club = club;
    }

    /**
    * Sets the members of the team.
    * @param {Array} members The members of the team.
    */
    Team.prototype.setMembers = function (members) {
        this.members = members;
    };

    SplitsBrowser.Model.Team = Team;
})();