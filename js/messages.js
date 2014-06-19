/*
 *  SplitsBrowser Messages - Fetches internationalised message strings.
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
    
    // Whether a warning about missing messages has been given.  We don't
    // really want to irritate the user with many alert boxes if there's a
    // problem with the messages.
    var warnedAboutMessages = false;
    
    // Default alerter function, just calls window.alert.
    var alertFunc = function (message) { window.alert(message); };
    
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
        return (SplitsBrowser.Messages && SplitsBrowser.Messages.hasOwnProperty(key)) ? SplitsBrowser.getMessage(key) : defaultValue;
    };
    
    /**
    * Returns the message with the given key.
    * @param {String} key - The key of the message.
    * @return {String} The message with the given key, or a placeholder string
    *     if the message could not be looked up.
    */
    SplitsBrowser.getMessage = function (key) {
        if (SplitsBrowser.hasOwnProperty("Messages")) {
            if (SplitsBrowser.Messages.hasOwnProperty(key)) {
                return SplitsBrowser.Messages[key];
            } else {
                warn("Message not found for key '" + key + "'");
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
            if (params.hasOwnProperty(paramName)) {
                // Irritatingly there isn't a way of doing global replace
                // without using regexps.  So we must escape any magic regex
                // metacharacters first, so that we have a regexp that will
                // match a single static string.
                var paramNameRegexEscaped = paramName.replace(/([.+*?|{}()^$\[\]\\])/g, "\\$1");
                message = message.replace(new RegExp(paramNameRegexEscaped, "g"), params[paramName]);
            }
        }
        
        return message;
    };
})();