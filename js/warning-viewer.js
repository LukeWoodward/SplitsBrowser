/*
 *  SplitsBrowser Warning viewer - Allows the user to view any warnings
 *                encountered reading in data files.
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

    const getMessage = SplitsBrowser.getMessage;

    const CONTAINER_DIV_ID = "warningViewerContainer";

    /**
    * Constructs a new WarningViewer object.
    * @constructor
    * @param {d3.selection} parent d3 selection containing the parent to
    *     insert the selector into.
    */
    class WarningViewer {
        constructor(parent) {
            this.parent = parent;
            this.warnings = [];

            this.containerDiv = parent.append("div")
                .classed("topRowStart", true)
                .attr("id", CONTAINER_DIV_ID)
                .style("display", "none");

            this.containerDiv.append("div").classed("topRowStartSpacer", true);

            this.warningTriangle = this.createWarningTriangle(this.containerDiv);

            this.warningList = parent.append("div")
                .classed("warningList", true)
                .classed("transient", true)
                .style("position", "absolute")
                .style("display", "none");

            // Ensure that a click outside of the warning list or the selector
            // box closes it.
            // Taken from http://stackoverflow.com/questions/1403615 and adjusted.
            $(document).click(e => {
                if (this.warningList.style("display") !== "none") {
                    let container = $("div#warningTriangleContainer,div.warningList");
                    if (!container.is(e.target) && container.has(e.target).length === 0) {
                        this.warningList.style("display", "none");
                    }
                }
            });

            this.setMessages();
        }

        /**
        * Sets the message shown in the tooltip, either as part of initialisation or
        * following a change of selected language.
        */
        setMessages() {
            this.containerDiv.attr("title", getMessage("WarningsTooltip"));
        }

        /**
        * Creates the warning triangle.
        * @return {Object} d3 selection containing the warning triangle.
        */
        createWarningTriangle() {
            let svgContainer = this.containerDiv.append("div")
                .attr("id", "warningTriangleContainer");
            let svg = svgContainer.append("svg");

            svg.style("width", "21px")
                .style("height", "19px")
                .style("margin-bottom", "-3px");

            svg.append("polygon")
                .attr("points", "1,18 10,0 19,18")
                .style("stroke", "black")
                .style("stroke-width", "1.5px")
                .style("fill", "#ffd426");

            svg.append("text")
                .attr("x", 10)
                .attr("y", 16)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("!");

            svgContainer.on("click", () => this.showHideErrorList());

            return svg;
        }

        /**
        * Sets the list of visible warnings.
        * @param {Array} warnings Array of warning messages.
        */
        setWarnings(warnings) {
            let errorsSelection = this.warningList.selectAll("div")
                .data(warnings);

            errorsSelection.enter().append("div")
                .classed("warning", true);

            errorsSelection = this.warningList.selectAll("div")
                .data(warnings);

            errorsSelection.text(errorMessage => errorMessage);
            errorsSelection.exit().remove();
            this.containerDiv.style("display", (warnings && warnings.length > 0) ? "block" : "none");
        }

        /**
        * Shows or hides the list of warnings.
        */
        showHideErrorList() {
            if (this.warningList.style("display") === "none") {
                let offset = $(this.warningTriangle.node()).offset();
                let height = $(this.warningTriangle.node()).outerHeight();
                let width = $(this.warningList.node()).outerWidth();
                this.warningList.style("left", Math.max(offset.left - width / 2, 0) + "px")
                    .style("top", (offset.top + height + 5) + "px")
                    .style("display", "block");
            } else {
                this.warningList.style("display", "none");
            }
        }
    }

    SplitsBrowser.Controls.WarningViewer = WarningViewer;
})();