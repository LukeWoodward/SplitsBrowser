/*
 *  SplitsBrowser - LanguageSelector tests.
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

    const LanguageSelector = SplitsBrowser.Controls.LanguageSelector;

    QUnit.module("Language Selector");

    let callCount = 0;

    function reset() {
        callCount = 0;
    }

    function handleLanguageChanged() {
        callCount += 1;
    }

    function createSelector() {
        return new LanguageSelector($("#qunit-fixture")[0]);
    }

    QUnit.test("Can construct the selector when there are two languages", assert => {
        createSelector();
        assert.strictEqual($("#qunit-fixture select").length, 1, "One select element should have been created");
        assert.strictEqual($("#qunit-fixture select > option").length, 2, "Two languages should be created");
    });

    QUnit.test("Attempting to construct the selector when there is only one language does nothing", assert => {
        const oldGermanMessages = SplitsBrowser.Messages.de;
        delete SplitsBrowser.Messages.de;
        SplitsBrowser.initialiseMessages("en_gb");
        try {
            createSelector();
            assert.strictEqual($("#qunit-fixture select").length, 0, "No select element should have been created");
        } finally {
            SplitsBrowser.Messages.de = oldGermanMessages;
            SplitsBrowser.initialiseMessages("en_gb");
        }
    });

    QUnit.test("Attempting to construct the selector when there are no languages creates nothing", assert => {
        const english = "en_gb";
        const oldGermanMessages = SplitsBrowser.Messages.de;
        const oldEnglishMessages = SplitsBrowser.Messages[english];
        delete SplitsBrowser.Messages.de;
        delete SplitsBrowser.Messages[english];
        SplitsBrowser.initialiseMessages();
        try {
            createSelector();
            assert.strictEqual($("#qunit-fixture select").length, 0, "No select element should have been created");
        } finally {
            SplitsBrowser.Messages[english] = oldEnglishMessages;
            SplitsBrowser.Messages.de = oldGermanMessages;
            SplitsBrowser.initialiseMessages("en_gb");
        }
    });

    QUnit.test("Registering a handler and changing a value in the selector triggers a call to change callback", assert => {
        reset();
        const selector = createSelector();
        selector.registerChangeHandler(handleLanguageChanged);

        const htmlSelect = $("#qunit-fixture select");
        assert.strictEqual(htmlSelect.length, 1, "One select element should have been created");
        try {
            htmlSelect.val("de").change();
            assert.strictEqual(callCount, 1, "One change should have been recorded");
        } finally {
            SplitsBrowser.setLanguage("en-gb");
        }
    });

    QUnit.test("Registering two handlers and changing a value in the selector triggers a call to both callbacks", assert => {
        reset();

        let callCount2 = 0;
        function secondHandler() {
            callCount2 += 1;
        }

        const selector = createSelector();
        selector.registerChangeHandler(handleLanguageChanged);
        selector.registerChangeHandler(secondHandler);

        try {
            $("#qunit-fixture select").val("de").change();
            assert.strictEqual(callCount, 1, "One change should have been recorded");
            assert.strictEqual(callCount2, 1, "One change should have been recorded");
        } finally {
            SplitsBrowser.setLanguage("en_gb");
        }
    });

    QUnit.test("Registering the same handler twice and changing a value in the selector triggers only one call to change callback", assert => {
        reset();
        const selector = createSelector();
        selector.registerChangeHandler(handleLanguageChanged);
        selector.registerChangeHandler(handleLanguageChanged);

        try {
            $("#qunit-fixture select").val("de").change();
            assert.strictEqual(callCount, 1, "One change should have been recorded");
        } finally {
            SplitsBrowser.setLanguage("en_gb");
        }
    });

    QUnit.test("Setting the language to a recognised language code sets the language and calls change handler", assert => {
        reset();
        const selector = createSelector();
        selector.registerChangeHandler(handleLanguageChanged);

        try {
            selector.setLanguage("de");
            assert.strictEqual($("#qunit-fixture select")[0].selectedIndex, 1);
            assert.strictEqual(callCount, 1, "One change should have been recorded");
        } finally {
            SplitsBrowser.setLanguage("en_gb");
        }
    });

    QUnit.test("Setting the language to an unrecognised language code does nothing", assert => {
        reset();
        const selector = createSelector();
        selector.registerChangeHandler(handleLanguageChanged);

        selector.setLanguage("This is not a recognised language code");
        assert.strictEqual($("#qunit-fixture select")[0].selectedIndex, 0);

        assert.strictEqual(callCount, 0, "No changes should have been recorded");
    });
})();
