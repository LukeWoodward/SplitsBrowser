/*
 *  SplitsBrowser Query-string - Query-string parsing and merging
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

    const isNaNStrict = SplitsBrowser.isNaNStrict;
    const ChartTypes = SplitsBrowser.Model.ChartTypes;
    const CourseClassSet = SplitsBrowser.Model.CourseClassSet;

    /**
     * Remove all matches of the given regular expression from the given string.
     * The regexp is not assumed to contain the "g" flag.
     * @param {String} queryString The query-string to process.
     * @param {RegExp} regexp The regular expression to use to remove text.
     * @return {String} The given query-string with all regexp matches removed.
     */
    function removeAll(queryString, regexp) {
        return queryString.replace(new RegExp(regexp.source, "g"), "");
    }

    const CLASS_NAME_REGEXP = /(?:^|&|\?)class=([^&]+)/;

    /**
     * Reads the selected class names from a query string.
     * @param {String} queryString The query string to read the class name
     *     from.
     * @param {Event} eventData The event data read in, used to validate the
     *     selected classes.
     * @return {CourseClassSet|null} Array of selected CourseClass objects, or null
     *     if none were found.
     */
    function readSelectedClasses(queryString, eventData) {
        let classNameMatch = CLASS_NAME_REGEXP.exec(queryString);
        if (classNameMatch === null) {
            // No class name specified in the URL.
            return null;
        } else {
            let classesByName = new Map();
            for (let courseClass of eventData.classes) {
                classesByName.set(courseClass.name, courseClass);
            }

            let classNames = decodeURIComponent(classNameMatch[1]).split(";");
            classNames = Array.from(new Set(classNames));
            let selectedClasses = classNames.filter(className => classesByName.has(className))
                                            .map(className => classesByName.get(className));

            if (selectedClasses.length === 0) {
                // No classes recognised, or none were specified.
                return null;
            } else {
                // Ignore any classes that are not on the same course as the
                // first class.
                let course = selectedClasses[0].course;
                selectedClasses = selectedClasses.filter(selectedClass => selectedClass.course === course);
                return new CourseClassSet(selectedClasses);
            }
        }
    }

    /**
     * Formats the selected classes into the given query-string, removing any
     * previous matches.
     * @param {String} queryString The original query-string.
     * @param {Event} eventData The event data.
     * @param {Array} classIndexes Array of indexes of selected classes.
     * @return {String} The query-string with the selected classes formatted in.
     */
    function formatSelectedClasses(queryString, eventData, classIndexes) {
        queryString = removeAll(queryString, CLASS_NAME_REGEXP);
        let classNames = classIndexes.map(index => eventData.classes[index].name);
        return queryString + "&class=" + encodeURIComponent(classNames.join(";"));
    }

    const CHART_TYPE_REGEXP = /(?:^|&|\?)chartType=([^&]+)/;

    /**
     * Reads the selected chart type from a query string.
     * @param {String} queryString The query string to read the chart type
     *     from.
     * @return {Object|null} Selected chart type, or null if not recognised.
     */
    function readChartType(queryString) {
        let chartTypeMatch = CHART_TYPE_REGEXP.exec(queryString);
        if (chartTypeMatch === null) {
            return null;
        } else {
            let chartTypeName = chartTypeMatch[1];
            if (ChartTypes.has(chartTypeName)) {
                return ChartTypes.get(chartTypeName);
            } else {
                return null;
            }
        }
    }

    /**
     * Formats the given chart type into the query-string
     * @param {String} queryString The original query-string.
     * @param {Object} givenChartType The given chart type
     * @return {String} The query-string with the chart-type formatted in.
     */
    function formatChartType(queryString, givenChartType) {
        queryString = removeAll(queryString, CHART_TYPE_REGEXP);
        for (let [chartTypeName, chartType] of ChartTypes.entries()) {
            if (chartType === givenChartType) {
                return queryString + "&chartType=" + encodeURIComponent(chartTypeName);
            }
        }

        // Unrecognised chart type?
        return queryString;
    }

    const COMPARE_WITH_REGEXP = /(?:^|&|\?)compareWith=([^&]+)/;

    const BUILTIN_COMPARISON_TYPES = ["Winner", "FastestTime", "FastestTimePlus5", "FastestTimePlus25", "FastestTimePlus50", "FastestTimePlus100"];

    /**
     * Reads what to compare against.
     * @param {String} queryString The query string to read the comparison
     *     type from.
     * @param {CourseClassSet|null} courseClassSet Course-class set containing
     *     selected course-classes, or null if none are selected.
     * @return {Object|null} Selected comparison type, or null if not
     *     recognised.
     */
    function readComparison(queryString, courseClassSet) {
        let comparisonMatch = COMPARE_WITH_REGEXP.exec(queryString);
        if (comparisonMatch === null) {
            return null;
        } else {
            let comparisonName = decodeURIComponent(comparisonMatch[1]);
            let defaultIndex = BUILTIN_COMPARISON_TYPES.indexOf(comparisonName);
            if (defaultIndex >= 1) {
                return {index: defaultIndex, result: null};
            } else if (defaultIndex === 0 && courseClassSet !== null) {
                let hasCompleters = courseClassSet.allResults.some(result => result.completed());
                if (hasCompleters) {
                    return {index: 0, result: null};
                } else {
                    // Cannot select 'Winner' as there was no winner.
                    return null;
                }
            } else if (courseClassSet === null) {
                // Not one of the recognised comparison types and we have no
                // classes to look for result names within.
                return null;
            } else {
                for (let resultIndex = 0; resultIndex < courseClassSet.allResults.length; resultIndex += 1) {
                    let result = courseClassSet.allResults[resultIndex];
                    if (result.owner.name === comparisonName && result.completed()) {
                        return {index: BUILTIN_COMPARISON_TYPES.length, result: result};
                    }
                }

                // Didn't find the result.
                return null;
            }
        }
    }

    /**
     * Formats the given comparison into the given query-string.
     * @param {String} queryString The original query-string.
     * @param {Number} index Index of the comparison type.
     * @param {Result} result The result to format.
     * @return {String} The formatted query-string.
     */
    function formatComparison(queryString, index, result) {
        queryString = removeAll(queryString, COMPARE_WITH_REGEXP);
        let comparison = null;
        if (typeof index === typeof 0 && 0 <= index && index < BUILTIN_COMPARISON_TYPES.length) {
            comparison = BUILTIN_COMPARISON_TYPES[index];
        } else if (result !== null) {
            comparison = result.owner.name;
        }

        if (comparison === null) {
            return queryString;
        } else {
            return queryString + "&compareWith=" + encodeURIComponent(comparison);
        }
    }

    const SELECTED_RESULTS_REGEXP = /(?:^|&|\?)selected=([^&]+)/;

    /**
     * Reads what to compare against.
     * @param {String} queryString The query string to read the comparison
     *     type from.
     * @param {CourseClassSet|null} courseClassSet Course-class set containing
     *     selected course-classes, or null if none are selected.
     * @return {Array|null} Array of selected result indexes, or null if none
     *     found.
     */
    function readSelectedResults(queryString, courseClassSet) {
        if (courseClassSet === null) {
            return null;
        } else {
            let selectedResultsMatch = SELECTED_RESULTS_REGEXP.exec(queryString);
            if (selectedResultsMatch === null) {
                return null;
            } else {
                let resultNames = decodeURIComponent(selectedResultsMatch[1]).split(";");
                if (resultNames.includes("*")) {
                    // All results selected.
                    return d3.range(0, courseClassSet.allResults.length);
                }

                resultNames = Array.from(new Set(resultNames));
                let allResultNames = courseClassSet.allResults.map(result => result.owner.name);
                let selectedResultIndexes = [];
                for (let resultName of resultNames) {
                    let index = allResultNames.indexOf(resultName);
                    if (index >= 0) {
                        selectedResultIndexes.push(index);
                    }
                }

                selectedResultIndexes.sort(d3.ascending);
                return (selectedResultIndexes.length === 0) ? null : selectedResultIndexes;
            }
        }
    }

    /**
     * Formats the given selected results into the given query-string.
     * @param {String} queryString The original query-string.
     * @param {CourseClassSet} courseClassSet The current course-class set.
     * @param {Array} selected Array of indexes within the course-class set's
     *     list of results of those that are selected.
     * @return {String} Query-string with the selected result formatted into it.
     */
    function formatSelectedResults(queryString, courseClassSet, selected) {
        queryString = removeAll(queryString, SELECTED_RESULTS_REGEXP);
        let selectedResults = selected.map(index => courseClassSet.allResults[index]);
        if (selectedResults.length === 0) {
            return queryString;
        } else if (selectedResults.length === courseClassSet.allResults.length) {
            // Assume all selected results are different, so all must be
            // selected.
            return queryString + "&selected=*";
        } else {
            let resultNames = selectedResults.map(result => result.owner.name).join(";");
            return queryString + "&selected=" + encodeURIComponent(resultNames);
        }
    }

    const SELECTED_STATISTICS_REGEXP = /(?:^|&|\?)stats=([^&]*)/;

    const ALL_STATS_NAMES = ["TotalTime", "SplitTime", "BehindFastest", "TimeLoss"];

    /**
     * Reads the selected statistics from the query string.
     * @param {String} queryString The query string to read the selected
     *     statistics from.
     * @return {Map|null} Map containing the statistics read, or null
     *     if no statistics parameter was found.
     */
    function readSelectedStatistics(queryString) {
        let statsMatch = SELECTED_STATISTICS_REGEXP.exec(queryString);
        if (statsMatch === null) {
            return null;
        } else {
            let statsNames = decodeURIComponent(statsMatch[1]).split(";");
            let stats = new Map();
            for (let statsName of ALL_STATS_NAMES) {
                stats.set(statsName, false);
            }

            for (let name of statsNames) {
                if (stats.has(name)) {
                    stats.set(name, true);
                } else if (name !== "") {
                    // Ignore unrecognised non-empty statistic name.
                    return null;
                }
            }

            return stats;
        }
    }

    /**
     * Formats the selected statistics into the given query string.
     * @param {String} queryString The original query-string.
     * @param {Map} stats The statistics to format.
     * @return {String} Query-string with the selected statistics formatted in.
     */
    function formatSelectedStatistics(queryString, stats) {
        queryString = removeAll(queryString, SELECTED_STATISTICS_REGEXP);
        let statsNames = ALL_STATS_NAMES.filter(name => stats.get(name));
        return queryString + "&stats=" + encodeURIComponent(statsNames.join(";"));
    }

    const SHOW_ORIGINAL_REGEXP = /(?:^|&|\?)showOriginal=([^&]*)/;

    /**
     * Reads the show-original-data flag from the given query-string.
     *
     * To show original data, the parameter showOriginal=1 must be part of the
     * URL.  If this parameter does not exist or has some other value, original
     * data will not be shown.  If the selected classes do not contain any
     * dubious splits, this option will have no effect.
     * @param {String} queryString The query-string to read.
     * @return {Boolean} True to show original data, false not to.
     */
    function readShowOriginal(queryString) {
        let showOriginalMatch = SHOW_ORIGINAL_REGEXP.exec(queryString);
        return (showOriginalMatch !== null && showOriginalMatch[1] === "1");
    }

    /**
     * Formats the show-original-data flag into the given query-string.
     * @param {String} queryString The original query-string.
     * @param {Boolean} showOriginal True to show original data, false not to.
     * @return {String} The query-string with the show-original-data flag
     *     formatted in.
     */
    function formatShowOriginal(queryString, showOriginal) {
        queryString = removeAll(queryString, SHOW_ORIGINAL_REGEXP);
        return (showOriginal) ? queryString + "&showOriginal=1" : queryString;
    }

    const SELECTED_LEG_REGEXP = /(?:^|&|\?)selectedLeg=([^&]*)/;

    /**
     * Reads the selected leg from the given query-string
     * @param {String} queryString The query-string to read.
     * @return {Number|null} The selected leg, or null for none.
     */
    function readSelectedLeg(queryString) {
        let selectedLegMatch = SELECTED_LEG_REGEXP.exec(queryString);
        if (selectedLegMatch === null) {
            return null;
        } else {
            let legIndex = parseInt(selectedLegMatch[1], 10);
            return (isNaNStrict(legIndex)) ? null : legIndex;
        }
    }

    /**
     * Formats the selected leg into the given query-string.
     * @param {String} queryString The original query-string.
     * @param {Number|null} selectedLeg The selected leg, or null for none.
     * @return {String} The query string with the selected-leg value formatted
     *     in.
     */
    function formatSelectedLeg(queryString, selectedLeg) {
        queryString = removeAll(queryString, SELECTED_LEG_REGEXP);
        return (selectedLeg === null) ? queryString : queryString + "&selectedLeg=" + encodeURIComponent(selectedLeg);
    }

    const FILTER_TEXT_REGEXP = /(?:^|&|\?)filterText=([^&]*)/;

    /**
     * Reads the filter text from the given query string.
     *
     * If no filter text is found, an empty string is returned.
     *
     * @param {String} queryString The query-string to read.
     * @return {String} The filter text read.
     */
    function readFilterText(queryString) {
        let filterTextMatch = FILTER_TEXT_REGEXP.exec(queryString);
        if (filterTextMatch === null) {
            return "";
        } else {
            return decodeURIComponent(filterTextMatch[1]);
        }
    }

    /**
     * Formats filter text into the given query-string.
     * @param {String} queryString The original query-string.
     * @param {String} filterText The filter text.
     * @return {String} The query-string with the filter text formatted in.
     */
    function formatFilterText(queryString, filterText) {
        queryString = removeAll(queryString, FILTER_TEXT_REGEXP);
        return (filterText === "") ? queryString : queryString + "&filterText=" + encodeURIComponent(filterText);
    }

    /**
     * Attempts to parse the given query string.
     * @param {String} queryString The query string to parse.
     * @param {Event} eventData The parsed event data.
     * @return {Object} The data parsed from the given query string.
     */
    function parseQueryString(queryString, eventData) {
        let courseClassSet = readSelectedClasses(queryString, eventData);
        let classIndexes = (courseClassSet === null) ? null : courseClassSet.classes.map(courseClass => eventData.classes.indexOf(courseClass));
        return {
            classes: classIndexes,
            chartType: readChartType(queryString),
            compareWith: readComparison(queryString, courseClassSet),
            selected: readSelectedResults(queryString, courseClassSet),
            stats: readSelectedStatistics(queryString),
            showOriginal: readShowOriginal(queryString),
            selectedLeg: readSelectedLeg(queryString),
            filterText: readFilterText(queryString)
        };
    }

    /**
     * Formats a query string with the given data.
     *
     * The original query-string is provided, and any argument values within it
     * are replaced with those given, and new ones added.  Unrecognised query-
     * string parameters are preserved; they could be used server-side by
     * whatever web application is hosting SplitsBrowser.
     *
     * @param {String} queryString The original query-string.
     * @param {Event} eventData The event data.
     * @param {CourseClassSet} courseClassSet The current course-class set.
     * @param {Object} data Object containing the data to format into the
     *     query-string.
     * @return {String} The formatted query-string.
     */
    function formatQueryString(queryString, eventData, courseClassSet, data) {
        queryString = formatSelectedClasses(queryString, eventData, data.classes);
        queryString = formatChartType(queryString, data.chartType);
        queryString = formatComparison(queryString, data.compareWith.index, data.compareWith.result);
        queryString = formatSelectedResults(queryString, courseClassSet, data.selected);
        queryString = formatSelectedStatistics(queryString, data.stats);
        queryString = formatShowOriginal(queryString, data.showOriginal);
        queryString = formatSelectedLeg(queryString, data.selectedLeg);
        queryString = formatFilterText(queryString, data.filterText);
        queryString = queryString.replace(/^\??&/, "");
        return queryString;
    }

    SplitsBrowser.parseQueryString = parseQueryString;
    SplitsBrowser.formatQueryString = formatQueryString;
})();