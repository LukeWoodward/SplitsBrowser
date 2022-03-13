/*
 *  SplitsBrowser Common controls - Functionality for handling 'common controls'
 *  within relay events.
 *
 *  Copyright (C) 2000-2021 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward.
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
(function() {

    var throwInvalidData = SplitsBrowser.throwInvalidData;

    // Constant value used to indicate that SplitsBrowser is in common-controls mode
    // when viewing relay data.
    SplitsBrowser.COMMON_CONTROLS_MODE = "commonControls";

    /**
    * Determines the common set of controls for a list of relay controls,
    * corresponding to one leg of the relay.
    * @param {Array} legControlsLists The list of controls for each leg.
    * @param {String} legDescription A description of the leg being processed.
    *     (This is only used in error messages.)
    */
    SplitsBrowser.determineCommonControls = function (legControlsLists, legDescription) {
        var controlCounts = d3.map();

        if (legControlsLists.length === 0) {
            throwInvalidData("Cannot determine the list of common controls of an empty array");
        }

        legControlsLists.forEach(function (legControls) {
            var controlsForThisLeg = d3.set();
            legControls.forEach(function (control) {
                if (controlsForThisLeg.has(control)) {
                    throwInvalidData(
                        "Cannot determine common controls because " + legDescription +
                        " contains duplicated control " + control);
                }

                controlsForThisLeg.add(control);

                if (controlCounts.has(control)) {
                    controlCounts.set(control, controlCounts.get(control) + 1);
                } else {
                    controlCounts.set(control, 1);
                }
            });
        });

        var teamCount = legControlsLists.length;

        var commonControls = legControlsLists[0].filter(
            function (control) { return controlCounts.get(control) === teamCount; });

        // Now verify that the common controls appear in the same order in each list of controls.
        for (var teamIndex = 1; teamIndex < teamCount; teamIndex += 1) {
            var commonControlsForThisTeamMember = legControlsLists[teamIndex].filter(
                function (control) { return controlCounts.get(control) === teamCount; });

            if (commonControlsForThisTeamMember.length !== commonControls.length) {
                throwInvalidData("Unexpectedly didn't get the same number of common controls for all competitors");
            }

            for (var index = 0; index < commonControls.length; index += 1) {
                if (commonControls[index] !== commonControlsForThisTeamMember[index]) {
                    throwInvalidData("Inconsistent ordering for control " + commonControls[index] + " in " + legDescription);
                }
            }
        }

        return commonControls;
    };
})();