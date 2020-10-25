/*
 *  SplitsBrowser ClassSelector - Provides a choice of classes to compare.
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

    const throwInvalidData = SplitsBrowser.throwInvalidData;
    const getMessage = SplitsBrowser.getMessage;

    /**
     * A control that wraps a drop-down list used to choose between classes.
     * @param {HTMLElement} parent The parent element to add the control to.
     */
    class ClassSelector {
        constructor(parent) {
            this.changeHandlers = [];
            this.otherClassesEnabled = true;

            let div = d3.select(parent).append("div")
                .classed("topRowStart", true);

            this.labelSpan = div.append("span");

            this.dropDown = div.append("select").node();
            $(this.dropDown).bind("change", () => {
                this.updateOtherClasses(new Set());
                this.onSelectionChanged();
            });

            this.otherClassesContainer = d3.select(parent).append("div")
                .attr("id", "otherClassesContainer")
                .classed("topRowStart", true)
                .style("display", "none");

            this.otherClassesCombiningLabel = this.otherClassesContainer.append("span")
                .classed("otherClassCombining", true);

            this.otherClassesSelector = this.otherClassesContainer.append("div")
                .classed("otherClassSelector", true)
                .style("display", "inline-block");

            this.otherClassesSpan = this.otherClassesSelector.append("span");

            this.otherClassesList = d3.select(parent).append("div")
                .classed("otherClassList", true)
                .classed("transient", true)
                .style("position", "absolute")
                .style("display", "none");

            this.otherClassesSelector.on("click", () => this.showHideClassSelector());

            this.setClasses([]);

            // Indexes of the selected 'other classes'.
            this.selectedOtherClassIndexes = new Set();

            // Ensure that a click outside of the drop-down list or the selector
            // box closes it.
            // Taken from http://stackoverflow.com/questions/1403615 and adjusted.
            $(document).click((event) => {
                let listDiv = this.otherClassesList.node();
                if (listDiv.style.display !== "none") {
                    let container = $("div.otherClassList,div.otherClassSelector");
                    if (!container.is(event.target) && container.has(event.target).length === 0) {
                        listDiv.style.display = "none";
                    }
                }
            });

            this.setMessages();
        }

        /**
         * Sets some messages following either the creation of this control or a
         * change of selected language.
         */
        setMessages() {
            this.labelSpan.text(getMessage("ClassSelectorLabel"));
            this.otherClassesCombiningLabel.text(getMessage("AdditionalClassSelectorLabel"));
        }

        /**
         * Sets whether the other-classes selector is enabled, if it is shown at
         * all.
         * @param {Boolean} otherClassesEnabled True to enable the selector, false
         *      to disable it.
         */
        setOtherClassesEnabled(otherClassesEnabled) {
            this.otherClassesCombiningLabel.classed("disabled", !otherClassesEnabled);
            this.otherClassesSelector.classed("disabled", !otherClassesEnabled);
            this.otherClassesEnabled = otherClassesEnabled;
        }

        /**
         * Sets the list of classes that this selector can choose between.
         *
         * If there are no classes, a 'dummy' entry is added
         * @param {Array} classes Array of CourseClass objects containing class
         *     data.
         */
        setClasses(classes) {
            if ($.isArray(classes)) {
                this.classes = classes;
                let options;
                if (classes.length === 0) {
                    this.dropDown.disabled = true;
                    options = [getMessage("NoClassesLoadedPlaceholder")];
                } else {
                    this.dropDown.disabled = false;
                    options = classes.map(courseClass => courseClass.name);
                }

                let optionsList = d3.select(this.dropDown).selectAll("option").data(options);
                optionsList.enter().append("option");

                optionsList = d3.select(this.dropDown).selectAll("option").data(options);
                optionsList.attr("value", (_value, index) => index.toString())
                    .text(value => value);

                optionsList.exit().remove();

                this.updateOtherClasses(new Set());
            } else {
                throwInvalidData("ClassSelector.setClasses: classes is not an array");
            }
        }

        /**
         * Add a change handler to be called whenever the selected class or classes
         * is changed.
         *
         * An array containing the indexes of the newly-selected classes is passed to
         * each handler function.  This array is guaranteed to be non-empty.  The
         * first index in the array is the 'primary' class.
         *
         * @param {Function} handler Handler function to be called whenever the class
         *                   changes.
         */
        registerChangeHandler(handler) {
            if (!this.changeHandlers.includes(handler)) {
                this.changeHandlers.push(handler);
            }
        }

        /**
         * Sets the selected classes.
         * @param {Array} selectedIndexes Array of indexes of classes.
         */
        selectClasses(selectedIndexes) {
            if (selectedIndexes.length > 0 && selectedIndexes.every(index => 0 <= index && index < this.dropDown.options.length)) {
                this.dropDown.selectedIndex = selectedIndexes[0];
                this.updateOtherClasses(new Set(selectedIndexes.slice(1)));
                this.onSelectionChanged();
            }
        }

        /**
         * Returns the indexes of the selected classes.
         * @return {Array} Indexes of selected classes.
         */
        getSelectedClasses() {
            if (this.dropDown.disabled) {
                return [];
            } else {
                let indexes = [this.dropDown.selectedIndex];
                this.selectedOtherClassIndexes.forEach(index => indexes.push(parseInt(index, 10)));
                return indexes;
            }
        }

        /**
         * Handle a change of the selected option in the drop-down list.
         */
        onSelectionChanged() {
            let indexes = this.getSelectedClasses();
            this.changeHandlers.forEach(handler => handler(indexes));
        }

        /**
         * Updates the text in the other-class box at the top.
         *
         * This text contains either a list of the selected classes, or placeholder
         * text if none are selected.
         */
        updateOtherClassText() {
            let classIdxs = Array.from(this.selectedOtherClassIndexes.values());
            classIdxs.sort(d3.ascending);
            let text;
            if (classIdxs.length === 0) {
                text = getMessage("NoAdditionalClassesSelectedPlaceholder");
            } else {
                text = classIdxs.map(classIdx => this.classes[classIdx].name)
                    .join(", ");
            }

            this.otherClassesSpan.text(text);
        }

        /**
         * Updates the other-classes selector div following a change of selected
         * 'main' class.
         * @param {Set} selectedOtherClassIndexes Array of selected other-class indexes.
         */
        updateOtherClasses(selectedOtherClassIndexes) {
            this.otherClassesList.style("display", "none");
            this.selectedOtherClassIndexes = selectedOtherClassIndexes;
            this.updateOtherClassText();

            $("div.otherClassItem").off("click");

            let otherClasses;
            if (this.classes.length > 0) {
                let newClass = this.classes[this.dropDown.selectedIndex];
                otherClasses = newClass.course.getOtherClasses(newClass);
            } else {
                otherClasses = [];
            }

            let otherClassIndexes = otherClasses.map(cls => this.classes.indexOf(cls));

            let otherClassesSelection = this.otherClassesList.selectAll("div")
                .data(otherClassIndexes);

            otherClassesSelection.enter().append("div")
                .classed("otherClassItem", true);

            otherClassesSelection = this.otherClassesList.selectAll("div")
                .data(otherClassIndexes);

            otherClassesSelection.attr("id", classIdx => `courseClassIdx_${classIdx}`)
                .classed("selected", classIdx => selectedOtherClassIndexes.has(classIdx))
                .text(classIdx => this.classes[classIdx].name);

            otherClassesSelection.exit().remove();

            if (otherClassIndexes.length > 0) {
                this.otherClassesContainer.style("display", null);
            } else {
                this.otherClassesContainer.style("display", "none");
            }

            let offset = $(this.otherClassesSelector.node()).offset();
            let height = $(this.otherClassesSelector.node()).outerHeight();
            this.otherClassesList.style("left", `${offset.left}px`)
                .style("top", `${offset.top + height}px`);

            $("div.otherClassItem").each((index, div) => {
                $(div).on("click", () => this.toggleOtherClass(otherClassIndexes[index]));
            });
        }

        /**
         * Shows or hides the other-class selector, if it is enabled.
         */
        showHideClassSelector() {
            if (this.otherClassesEnabled) {
                this.otherClassesList.style("display", (this.otherClassesList.style("display") === "none") ? null : "none");
            }
        }

        /**
         * Toggles the selection of an other class.
         * @param {Number} classIdx Index of the class among the list of all classes.
         */
        toggleOtherClass(classIdx) {
            if (this.selectedOtherClassIndexes.has(classIdx)) {
                this.selectedOtherClassIndexes.delete(classIdx);
            } else {
                this.selectedOtherClassIndexes.add(classIdx);
            }

            d3.select(`div#courseClassIdx_${classIdx}`).classed("selected", this.selectedOtherClassIndexes.has(classIdx));
            this.updateOtherClassText();
            this.onSelectionChanged();
        }

        /**
         * Retranslates this control following a change of selected language.
         */
        retranslate() {
            this.setMessages();
            if (this.classes.length === 0) {
                d3.select(this.dropDown.options[0]).text(getMessage("NoClassesLoadedPlaceholder"));
            }
            if (this.selectedOtherClassIndexes.values().length === 0) {
                this.otherClassesSpan.text(getMessage("NoAdditionalClassesSelectedPlaceholder"));
            }
        }
    }

    SplitsBrowser.Controls.ClassSelector = ClassSelector;
})();
