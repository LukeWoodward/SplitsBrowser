/*
 *  SplitsBrowser Messages - Fetches internationalised message strings.
 *
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
(function () {
    "use strict";

    var hasProperty = SplitsBrowser.hasProperty;

    // Whether a warning about missing messages has been given.  We don't
    // really want to irritate the user with many alert boxes if there's a
    // problem with the messages.
    var warnedAboutMessages = false;

    // Default alerter function, just calls window.alert.
    var alertFunc = function (message) { window.alert(message); };

    // The currently-chosen language, or null if none chosen or found yet.
    var currentLanguage = null;

    // The list of all languages read in, or null if none.
    var allLanguages = null;

    // The messages object.
    var messages = SplitsBrowser.Messages;

    /**
    * Issue a warning about the messages, if a warning hasn't already been
    * issued.
    * @param {String} warning - The warning message to issue.
    */
    function warn(warning) {
        if (!warnedAboutMessages) {
            alertFunc(warning);
            warnedAboutMessages = true;
        }
    }

    /**
    * Sets the alerter to use when a warning message should be shown.
    *
    * This function is intended only for testing purposes.

    * @param {Function} alerter - The function to be called when a warning is
    *     to be shown.
    */
    SplitsBrowser.setMessageAlerter = function (alerter) {
        alertFunc = alerter;
    };

    /**
    * Attempts to get a message, returning a default string if it does not
    * exist.
    * @param {String} key - The key of the message.
    * @param {String} defaultValue - Value to be used
    * @return {String} The message with the given key, if the key exists,
    *     otherwise the default value.
    */
    SplitsBrowser.tryGetMessage = function (key, defaultValue) {
        return (currentLanguage !== null && hasProperty(messages[currentLanguage], key)) ? SplitsBrowser.getMessage(key) : defaultValue;
    };

    /**
    * Returns the message with the given key.
    * @param {String} key - The key of the message.
    * @return {String} The message with the given key, or a placeholder string
    *     if the message could not be looked up.
    */
    SplitsBrowser.getMessage = function (key) {
        if (allLanguages === null) {
            SplitsBrowser.initialiseMessages();
        }

        if (currentLanguage !== null) {
            if (hasProperty(messages[currentLanguage], key)) {
                return messages[currentLanguage][key];
            } else {
                warn("Message not found for key '" + key + "' in language '" + currentLanguage + "'");
                return "?????";
            }
        } else {
            warn("No messages found.  Has a language file been loaded?");
            return "?????";
        }
    };

    /**
    * Returns the message with the given key, with some string formatting
    * applied to the result.
    *
    * The object 'params' should map search strings to their replacements.
    *
    * @param {String} key - The key of the message.
    * @param {Object} params - Object mapping parameter names to values.
    * @return {String} The resulting message.
    */
    SplitsBrowser.getMessageWithFormatting = function (key, params) {
        var message = SplitsBrowser.getMessage(key);
        for (var paramName in params) {
            if (hasProperty(params, paramName)) {
                // Irritatingly there isn't a way of doing global replace
                // without using regexps.  So we must escape any magic regex
                // metacharacters first, so that we have a regexp that will
                // match a single static string.
                var paramNameRegexEscaped = paramName.replace(/([.+*?|{}()^$[\]\\])/g, "\\$1");
                message = message.replace(new RegExp(paramNameRegexEscaped, "g"), params[paramName]);
            }
        }

        return message;
    };

    /**
    * Returns an array of codes of languages that have been loaded.
    * @return {Array} Array of language codes.
    */
    SplitsBrowser.getAllLanguages = function () {
        return allLanguages.slice(0);
    };

    /**
    * Returns the language code of the current language, e.g. "en_gb".
    * @return {String} Language code of the current language.
    */
    SplitsBrowser.getLanguage = function () {
        return currentLanguage;
    };

    /**
    * Returns the name of the language with the given code.
    * @param {String} language - The code of the language, e.g. "en_gb".
    * @return {String} The name of the language, e.g. "English".
    */
    SplitsBrowser.getLanguageName = function (language) {
        if (hasProperty(messages, language) && hasProperty(messages[language], "Language")) {
            return messages[language].Language;
        } else {
            return "?????";
        }
    };

    /**
    * Sets the current language.
    * @param {String} language - The code of the new language to set.
    */
    SplitsBrowser.setLanguage = function (language) {
        if (hasProperty(messages, language)) {
            currentLanguage = language;
        }
    };

    /**
    * Initialises the messages from those read in.
    *
    * @param {String} defaultLanguage - (Optional) The default language to choose.
    */
    SplitsBrowser.initialiseMessages = function (defaultLanguage) {
        allLanguages = [];
        if (messages !== SplitsBrowser.Messages) {
            // SplitsBrowser.Messages has changed since the JS source was
            // loaded and now.  Likely culprit is an old-format language file.
            warn("You appear to have loaded a messages file in the old format.  This file, and all " +
                 "others loaded after it, will not work.\n\nPlease check the messages files.");
        }

        for (var messageKey in messages) {
            if (hasProperty(messages, messageKey)) {
                allLanguages.push(messageKey);
            }
        }

        if (allLanguages.length === 0) {
            warn("No messages files were found.");
        } else if (defaultLanguage && hasProperty(messages, defaultLanguage)) {
            currentLanguage = defaultLanguage;
        } else {
            currentLanguage = allLanguages[0];
        }
    };
})();