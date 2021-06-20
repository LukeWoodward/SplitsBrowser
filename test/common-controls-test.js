/*
 *  SplitsBrowser - Common Controls tests.
 *
 *  Copyright (C) 2000-2021 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var determineCommonControls = SplitsBrowser.determineCommonControls;

    QUnit.module("Common Controls");

    QUnit.test("Cannot determine the list of common controls of an empty list", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function () {
            determineCommonControls([], "no controls lists");
        });
    });

    QUnit.test("Returns empty list for single empty controls list", function (assert) {
        assert.deepEqual(determineCommonControls([[]], "single empty controls list"), []);
    });

    QUnit.test("Returns same list for single non-empty controls list", function (assert) {
        var controls = ["187", "209", "173"];
        assert.deepEqual(determineCommonControls([controls], "single non-empty controls list"), controls);
    });

    QUnit.test("Returns same list for repeated non-empty controls list", function (assert) {
        var controls = ["187", "209", "173"];
        assert.deepEqual(
            determineCommonControls([controls, controls, controls], "three copies of the same non-empty controls list"),
            controls);
    });

    QUnit.test("Returns expected list for two different lists of controls with common controls in same indexes", function (assert) {
        assert.deepEqual(determineCommonControls([
            ["187", "242", "209", "173", "186"],
            ["187", "239", "209", "173", "195"]
        ], "two lists of controls with common controls"), ["187", "209", "173"]);
    });

    QUnit.test("Returns expected list for two different lists of controls with common controls not all in same indexes", function (assert) {
        assert.deepEqual(determineCommonControls([
            ["187", "242", "201", "209", "173", "186"],
            ["187", "239", "209", "207", "195", "173"]
        ], "two lists of controls with common controls in same indexes"), ["187", "209", "173"]);
    });

    QUnit.test("Returns expected list for two different lists of controls with common controls not all in same indexes", function (assert) {
        assert.deepEqual(determineCommonControls([
            ["187", "242", "201", "209", "173", "186"],
            ["187", "239", "209", "207", "195", "173"]
        ], "two lists of controls with common controls in same indexes"), ["187", "209", "173"]);
    });

    QUnit.test("Returns expected list for three different lists of controls with some common controls", function (assert) {
        assert.deepEqual(determineCommonControls([
            ["187", "242", "201", "209", "173", "186"],
            ["187", "239", "209", "207", "195", "173"],
            ["187", "201", "209", "207", "186", "173"]
        ], "three lists of controls with common controls not in same indexes"), ["187", "209", "173"]);
    });

    QUnit.test("Returns empty list for three different lists of controls with no common controls", function (assert) {
        assert.deepEqual(determineCommonControls([
            ["187", "242", "201", "209", "173", "186"],
            ["181", "239", "209", "207", "195", "170"],
            ["192", "206", "222", "207", "186", "173"]
        ], "three lists of controls with no common controls"), []);
    });

    QUnit.test("Cannot determine list of controls if controls list has duplicated control", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() {
            determineCommonControls([
                ["187", "242", "209", "173", "186"],
                ["187", "239", "209", "187", "195"]
            ],
            "a duplicated control");
        });
    });

    QUnit.test("Cannot determine list of controls if controls lists have common controls not in the same order", function (assert) {
        SplitsBrowserTest.assertInvalidData(assert, function() {
            determineCommonControls([
                ["187", "242", "201", "209", "173", "186"],
                ["187", "239", "209", "207", "195", "173"],
                ["187", "201", "207", "173", "186", "209"]
            ],
            "common controls not in the same order");
        });
    });
})();