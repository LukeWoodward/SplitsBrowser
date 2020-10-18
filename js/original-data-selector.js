/*
 *  SplitsBrowser Original Data Selector - Selects original/repaired data.
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

    // ID of the div used to contain the object.
    // Must match the name defined in styles.css.
    const CONTAINER_DIV_ID = "originalDataSelectorContainer";

    const getMessage = SplitsBrowser.getMessage;

    /**
    * Constructs a new OriginalDataSelector object.
    * @constructor
    * @param {d3.selection} parent d3 selection containing the parent to
    *     insert the selector into.
    */
    class OriginalDataSelector {
        constructor(parent) {
            this.parent = parent;

            let checkboxId = "originalDataCheckbox";
            this.containerDiv = parent.append("div")
                .classed("topRowStart", true)
                .attr("id", CONTAINER_DIV_ID);

            this.containerDiv.append("div").classed("topRowStartSpacer", true);

            let span = this.containerDiv.append("span");

            this.checkbox = span.append("input")
                .attr("type", "checkbox")
                .attr("id", checkboxId)
                .on("click", () => this.fireChangeHandlers())
                .node();

            this.label = span.append("label")
                .attr("for", checkboxId)
                .classed("originalDataSelectorLabel", true);

            this.handlers = [];
            this.setMessages();
        }

        /**
        * Sets the messages in this control, following either its creation of a
        * change of selected language.
        */
        setMessages() {
            this.label.text(getMessage("ShowOriginalData"));
            this.containerDiv.attr("title", getMessage("ShowOriginalDataTooltip"));
        }

        /**
        * Register a change handler to be called whenever the choice of original or
        * repaired data is changed.
        *
        * If the handler was already registered, nothing happens.
        * @param {Function} handler Function to be called whenever the choice
        *                           changes.
        */
        registerChangeHandler(handler) {
            if (!this.handlers.includes(handler)) {
                this.handlers.push(handler);
            }
        }

        /**
        * Deregister a change handler from being called whenever the choice of
        * original or repaired data is changed.
        *
        * If the handler given was never registered, nothing happens.
        * @param {Function} handler Function to be called whenever the choice
        *                           changes.
        */
        deregisterChangeHandler(handler) {
            var index = this.handlers.indexOf(handler);
            if (index !== -1) {
                this.handlers.splice(index, 1);
            }
        }

        /**
        * Fires all change handlers registered.
        */
        fireChangeHandlers() {
            for (let handler of this.handlers) {
                handler(this.checkbox.checked);
            }
        }

        /**
        * Returns whether original data is selected.
        * @return {Boolean} True if original data is selected, false if not.
        */
        isOriginalDataSelected() {
            return this.checkbox.checked;
        }

        /**
        * Selects original data.
        */
        selectOriginalData() {
            this.checkbox.checked = true;
            this.fireChangeHandlers();
        }

        /**
        * Sets whether this original-data selector should be visible.
        * @param {Boolean} isVisible True if the original-data selector should be
        *     visible, false if it should be hidden.
        */
        setVisible(isVisible) {
            this.containerDiv.style("display", (isVisible) ? null : "none");
        }

        /**
        * Sets whether the control is enabled.
        * @param {Boolean} isEnabled True if the control is enabled, false if
        *      disabled.
        */
        setEnabled(isEnabled) {
            this.parent.selectAll("label.originalDataSelectorLabel")
                .classed("disabled", !isEnabled);

            this.checkbox.disabled = !isEnabled;
        }
    }

    SplitsBrowser.Controls.OriginalDataSelector = OriginalDataSelector;
})();