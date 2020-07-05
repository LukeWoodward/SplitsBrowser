/*
 *  SplitsBrowser Language-file consistency tests.
 *
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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

    var hasProperty = SplitsBrowser.hasProperty;

    var REFERENCE_LANGUAGE = "en_gb";

    /**
    * Checks that an 'other' language has all of the message keys that a given
    * reference language has.
    * @param {String} referenceLanguageKey - Key of the reference language.
    * @param {String} otherLanguageKey - Key of the other language.
    * @param {Array} consistencyErrors - Array to append any consistency errors
    *     found.
    */
    function verifyConsistency(referenceLanguageKey, otherLanguageKey, consistencyErrors) {
        var referenceLanguage = SplitsBrowser.Messages[referenceLanguageKey];
        var otherLanguage = SplitsBrowser.Messages[otherLanguageKey];
        for (var refKey in referenceLanguage) {
            if (hasProperty(referenceLanguage, refKey)) {
                if (!hasProperty(otherLanguage, refKey)) {
                    consistencyErrors.push("Language '" + referenceLanguageKey + "' has message with key '" + refKey + "', but language '" + otherLanguageKey + "' does not");
                }
            }
        }
    }

    QUnit.test("All languages are consistent", function (assert) {
        if (typeof SplitsBrowser.Messages === "undefined") {
            throw new Error("Languages not defined");
        } else if (!hasProperty(SplitsBrowser.Messages, REFERENCE_LANGUAGE)) {
            throw new Error("Reference language not found");
        }

        var consistencyErrors = [];
        var languageCount = 1;
        for (var language in SplitsBrowser.Messages) {
            if (hasProperty(SplitsBrowser.Messages, language) && language !== REFERENCE_LANGUAGE) {
                verifyConsistency(REFERENCE_LANGUAGE, language, consistencyErrors);
                verifyConsistency(language, REFERENCE_LANGUAGE, consistencyErrors);
                languageCount += 1;
            }
        }

        assert.deepEqual(consistencyErrors, [], "The " + languageCount + " language files should be consistent");
    });
})();