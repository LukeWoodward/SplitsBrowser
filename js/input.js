/*
 *  SplitsBrowser Input - Top-level data file reading.
 *
 *  Copyright (C) 2000-2015 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    // All the parsers for parsing event data that are known about.
    var PARSERS = [
        SplitsBrowser.Input.CSV.parseEventData,
        SplitsBrowser.Input.OE.parseEventData,
        SplitsBrowser.Input.Html.parseEventData,
        SplitsBrowser.Input.AlternativeCSV.parseTripleColumnEventData,
        SplitsBrowser.Input.IOFXml.parseEventData
    ];

    /**
    * Attempts to parse the given event data, which may be of any of the
    * supported formats, or may be invalid.  This function returns the results
    * as an Event object if successful, or null in the event of failure.
    * @param {String} data - The data read.
    * @return {Event} Event data read in, or null for failure.
    */
    SplitsBrowser.Input.parseEventData = function (data) {
        for (var i = 0; i < PARSERS.length; i += 1) {
            var parser = PARSERS[i];
            try {
                return parser(data);
            } catch (e) {
                if (e.name !== "WrongFileFormat") {
                    throw e;
                }
            }
        }

        // If we get here, none of the parsers succeeded.
        return null;
    };
})();