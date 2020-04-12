/*
 *  SplitsBrowser Competitor - An individual competitor who competed at an event.
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
    * Object that represents the data for a single competitor.
    *
    * @constructor
    * @param {String} name - The name of the competitor.
    * @param {String} club - The name of the competitor's club.
    */
    function Competitor(name, club) {
        this.name = name;
        this.club = club;
        
        this.yearOfBirth = null;
        this.gender = null; // "M" or "F" for male or female.
    }
    
    /**
    * Sets the competitor's year of birth.
    * @param {Number} yearOfBirth - The competitor's year of birth.
    */
    Competitor.prototype.setYearOfBirth = function (yearOfBirth) {
        this.yearOfBirth = yearOfBirth;
    };
    
    /**
    * Sets the competitor's gender.  This should be "M" or "F".
    * @param {String} gender - The competitor's gender, "M" or "F".
    */
    Competitor.prototype.setGender = function (gender) {
        this.gender = gender;
    };
    
    SplitsBrowser.Model.Competitor = Competitor;
})();