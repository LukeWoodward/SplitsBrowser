/*
 *  SplitsBrowser Chart Popup - Shows data near the cursor in a popup window.
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
(function () {
    "use strict";

    const formatTime = SplitsBrowser.formatTime;

    /**
     * Creates a ChartPopup control.
     * @constructor
     * @param {HTMLElement} parent Parent HTML element.
     */
    class ChartPopup {
        constructor(parent) {
            this.shown = false;
            this.mouseIn = false;
            this.popupDiv = d3.select(parent).append("div");
            this.popupDiv.classed("chartPopup", true)
                .style("display", "none")
                .style("position", "absolute");

            this.dataHeader = this.popupDiv.append("div")
                .classed("chartPopupHeader", true)
                .append("span");

            let tableContainer = this.popupDiv.append("div")
                .classed("chartPopupTableContainer", true);

            this.dataTable = tableContainer.append("table");

            this.popupDiv.selectAll(".nextControls").style("display", "none");

            $(this.popupDiv.node()).mouseenter(() => this.mouseIn = true);
            $(this.popupDiv.node()).mouseleave(() => this.mouseIn = false);
        }

        /**
         * Returns whether the popup is currently shown.
         * @return {Boolean} True if the popup is shown, false otherwise.
         */
        isShown() {
            return this.shown;
        }

        /**
         * Returns whether the mouse is currently over the popup.
         * @return {Boolean} True if the mouse is over the popup, false otherwise.
         */
        isMouseIn() {
            return this.mouseIn;
        }

        /**
         * Populates the chart popup with data.
         *
         * 'competitorData' should be an object that contains a 'title', a 'data'
         * and a 'placeholder' property.  The 'title' is a string used as the
         * popup's title.  The 'data' property is an array where each element should
         * be an object that contains the following properties:
         * * time - A time associated with a competitor.  This may be a split time,
         *   cumulative time or the time of day.
         * * className (Optional) - Name of the competitor's class.
         * * name - The name of the competitor.
         * * highlight - A boolean value which indicates whether to highlight the
         *   competitor.
         * The 'placeholder' property is a placeholder string to show if there is no
         * 'data' array is empty.  It can be null to show no such message.
         * @param {Object} competitorData Array of data to show.
         * @param {Boolean} includeClassNames Whether to include class names.
         */
        setData(competitorData, includeClassNames) {
            this.dataHeader.text(competitorData.title);

            let rows = this.dataTable.selectAll("tr")
                .data(competitorData.data);

            rows.enter().append("tr");

            rows = this.dataTable.selectAll("tr")
                .data(competitorData.data);
            rows.classed("highlighted", row => row.highlight);

            rows.selectAll("td").remove();
            rows.append("td").text(row => formatTime(row.time));
            if (includeClassNames) {
                rows.append("td").text(row => row.className);
            }
            rows.append("td").text(row => row.name);

            rows.exit().remove();

            if (competitorData.data.length === 0 && competitorData.placeholder !== null) {
                this.dataTable.append("tr")
                    .append("td")
                    .text(competitorData.placeholder);
            }
        }

        /**
         * Sets the next-controls data.
         *
         * The next-controls data should be an object that contains two properties:
         * * thisControl - The 'current' control.
         * * nextControls - Array of objects, each with 'course' and 'nextControl'
         *   properties.
         *
         * @param {Object} nextControlsData The next-controls data.
         */
        setNextControlData(nextControlsData) {
            this.dataHeader.text(nextControlsData.thisControl);

            const rows = this.dataTable.selectAll("tr")
                .data(nextControlsData.nextControls);
            rows.enter().append("tr");

            rows.selectAll("td").remove();
            rows.classed("highlighted", false);
            rows.append("td").text(nextControlData => nextControlData.course.name);
            rows.append("td").text("-->");
            rows.append("td").text(nextControlData => nextControlData.nextControls);

            rows.exit().remove();
        }

        /**
         * Adjusts the location of the chart popup.
         *
         * The location object should contain "x" and "y" properties.  The two
         * coordinates are in units of pixels from top-left corner of the viewport.
         *
         * @param {Object} location The location of the chart popup.
         */
        setLocation(location) {
            this.popupDiv.style("left", `${location.x}px`)
                .style("top", `${location.y}px`);
        }

        /**
         * Shows the chart popup.
         *
         * The location object should contain "x" and "y" properties.  The two
         * coordinates are in units of pixels from top-left corner of the viewport.
         *
         * @param {Object} location The location of the chart popup.
         */
        show(location) {
            this.popupDiv.style("display", null);
            this.shown = true;
            this.setLocation(location);
        }

        /**
         * Hides the chart popup.
         */
        hide() {
            this.popupDiv.style("display", "none");
            this.shown = false;
        }

        /**
         * Returns the height of the popup, in units of pixels.
         * @return {Number} Height of the popup, in pixels.
         */
        height() {
            return $(this.popupDiv.node()).height();
        }
    }

    SplitsBrowser.Controls.ChartPopup = ChartPopup;
})();