/*
 *  SplitsBrowser LanguageSelector - Provides a choice of language.
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

    const getMessage = SplitsBrowser.getMessage;
    const getAllLanguages = SplitsBrowser.getAllLanguages;
    const getLanguage = SplitsBrowser.getLanguage;
    const getLanguageName = SplitsBrowser.getLanguageName;
    const setLanguage = SplitsBrowser.setLanguage;

    /**
     * A control that wraps a drop-down list used to choose the language to view.
     * @param {HTMLElement} parent The parent element to add the control to.
     */
    class LanguageSelector {
        constructor(parent) {
            this.changeHandlers = [];
            this.label = null;
            this.dropDown = null;

            this.allLanguages = getAllLanguages();

            if (this.allLanguages.length < 2) {
                // User hasn't loaded multiple languages, so no point doing
                // anything further here.
                return;
            }

            d3.select(parent).append("div")
                .classed("topRowStartSpacer", true);

            let div = d3.select(parent).append("div")
                .classed("topRowStart", true);

            this.label = div.append("span");

            this.dropDown = div.append("select").node();
            $(this.dropDown).bind("change", () => this.onLanguageChanged());

            let optionsList = d3.select(this.dropDown).selectAll("option").data(this.allLanguages);
            optionsList.enter().append("option");

            optionsList = d3.select(this.dropDown).selectAll("option").data(this.allLanguages);
            optionsList.attr("value", language => language)
                .text(language => getLanguageName(language));

            optionsList.exit().remove();

            this.setLanguage(getLanguage());
            this.setMessages();
        }

        /**
         * Sets the text of various messages in this control, following either its
         * creation or a change of language.
         */
        setMessages() {
            this.label.text(getMessage("LanguageSelectorLabel"));
        }

        /**
         * Add a change handler to be called whenever the selected language is changed.
         *
         * The handler function is called with no arguments.
         *
         * @param {Function} handler Handler function to be called whenever the
         *                           language changes.
         */
        registerChangeHandler(handler) {
            if (!this.changeHandlers.includes(handler)) {
                this.changeHandlers.push(handler);
            }
        }

        /**
         * Sets the language.  If the language given is not recognised, nothing
         * happens.
         * @param {String} language The language code.
         */
        setLanguage(language) {
            let index = this.allLanguages.indexOf(language);
            if (index >= 0) {
                this.dropDown.selectedIndex = index;
                this.onLanguageChanged();
            }
        }

        /**
         * Handle a change of the selected option in the drop-down list.
         */
        onLanguageChanged() {
            setLanguage(this.dropDown.options[this.dropDown.selectedIndex].value);
            for (let handler of this.changeHandlers) {
                handler();
            }
        }
    }

    SplitsBrowser.Controls.LanguageSelector = LanguageSelector;
})();
