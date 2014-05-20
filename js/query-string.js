/*
 *  SplitsBrowser Query-string - Query-string parsing and merging
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
    
    var ChartTypes = SplitsBrowser.Model.ChartTypes;
    var AgeClassSet = SplitsBrowser.Model.AgeClassSet;
    
    // Parameters supported:
    // * class: semicolon-separated list of class names
    // * view: what to view: (SplitsGraph, RaceGraph, PositionAfterLeg,
    //   SplitPosition, PercentBehind, ResultsTable)
    // * compareWith: what to compare against (Winner, Fastest,
    //   FastestPlus5, FastestPlus25, FastestPlus50, FastestPlus100, or any
    //   runner from any of the selected classes.
    // * selected: semicolon-separated list of competitor names, or * to
    //   select the lot.
    
    // Error handling:
    // Generally, in all cases we plan to ignore anything invalid.
    // * class:
    //   * Ignore unrecognised class names,
    //   * If > 1 class specified, ignore any that are not on the same course
    //     as the first.
    //   * If empty, or nothing valid, leave as default.
    // * view:
    //   * ignore anything unrecognised and leave with default.
    //   * if RaceGraph selected and no start times, back to SplitsGraph.
    // * compareWith:
    //   * if Winner and class has no winner, ignore and leave as default.
    //   * Ignore any unrecognised runner name.
    // * selected:
    //   * Ignore any unrecognised names, or repeated selections,
    // * general:
    //   * Use only the first occurrence of each parameter.
    
    // We also need to be careful handling query strings as the website hosting
    // SplitsBrowser may also use the query string for other information (e.g.
    // event ID.)
    
    /**
    * Remove all matches of the given regular expression from the given string.
    * The regexp is not assumed to contain the "g" flag.
    * @param {String} queryString - The query-string to process.
    * @param {RegExp} regexp - The regular expression to use to remove text.
    * @return {String} The given query-string with all regexp matches removed.
    */
    function removeAll(queryString, regexp) {
        return queryString.replace(new RegExp(regexp.source, "g"), "");
    }
    
    var CLASS_NAME_REGEXP = /(?:^|&|\?)class=([^&]+)/;
    
    /**
    * Reads the selected class names from a query string.
    * @param {String} queryString - The query string to read the class name
    *     from.
    * @param {Event} eventData - The event data read in, used to validate the 
    *     selected classes.
    * @return {AgeClassSet|null} - Array of selected AgeClass objects, or null
    *     if none were found.
    */
    function readSelectedClasses(queryString, eventData) {
        var classNameMatch = CLASS_NAME_REGEXP.exec(queryString);
        if (classNameMatch === null) {
            // No class name specified in the URL.
            return null;
        } else {
            var classesByName = d3.map();
            for (var index = 0; index < eventData.classes.length; index += 1) {
                classesByName.set(eventData.classes[index].name, eventData.classes[index]);
            }
            
            var classNames = decodeURIComponent(classNameMatch[1]).split(";");
            classNames = d3.set(classNames).values();
            var selectedClasses = classNames.filter(function (className) { return classesByName.has(className); })
                                            .map(function (className) { return classesByName.get(className); });
            
            if (selectedClasses.length === 0) {
                // No classes recognised, or none were specified.
                return null;
            } else {
                // Ignore any classes that are not on the same course as the
                // first class.
                var course = selectedClasses[0].course;
                selectedClasses = selectedClasses.filter(function (selectedClass) { return selectedClass.course === course; });
                return new AgeClassSet(selectedClasses);
            }
        }
    }
    
    /**
    * Formats the selected classes into the given query-string, removing any
    * previous matches.
    * @param {String} queryString - The original query-string.
    * @param {Event} eventData - The event data.
    * @param {Array} classIndexes - Array of indexes of selected classes.
    * @return {String} The query-string with the selected classes formatted in.
    */
    function formatSelectedClasses(queryString, eventData, classIndexes) {
        queryString = removeAll(queryString, CLASS_NAME_REGEXP);
        var classNames = classIndexes.map(function (index) { return eventData.classes[index].name; });
        return queryString + "&class=" + encodeURIComponent(classNames.join(";"));
    }

    var VIEW_TYPE_REGEXP = /(?:^|&|\?)view=([^&]+)/;
    
    /**
    * Reads the selected chart type from a query string.
    * @param {String} queryString - The query string to read the chart type
    *     from.
    * @return {Object|null} Selected chart type, or null if not recognised.
    */    
    function readChartType(queryString) {
        var viewTypeMatch = VIEW_TYPE_REGEXP.exec(queryString);
        if (viewTypeMatch === null) {
            return null;
        } else { 
            var chartTypeName = viewTypeMatch[1];
            if (ChartTypes.hasOwnProperty(chartTypeName)) {
                return ChartTypes[chartTypeName];
            } else {
                return null;
            }
        }
    }
    
    /**
    * Formats the given chart type into the query-string
    * @param {String} queryString - The original query-string.
    * @param {Object} chartType - The chart type
    * @return {String} The query-string with the chart-type formatted in.
    */
    function formatChartType(queryString, chartType) {
        queryString = removeAll(queryString, VIEW_TYPE_REGEXP);
        for (var chartTypeName in ChartTypes) {
            if (ChartTypes.hasOwnProperty(chartTypeName) && ChartTypes[chartTypeName] === chartType) {
                return queryString + "&view=" + encodeURIComponent(chartTypeName);
            }
        }
        
        // Unrecognised chart type?
        return queryString;
    }
    
    var COMPARE_WITH_REGEXP = /(?:^|&|\?)compareWith=([^&]+)/;
    
    var BUILTIN_COMPARISON_TYPES = ["Winner", "FastestTime", "FastestTimePlus5", "FastestTimePlus25", "FastestTimePlus50", "FastestTimePlus100"];
    
    /**
    * Reads what to compare against.
    * @param {String} queryString - The query string to read the comparison
    *     type from.
    * @param {AgeClassSet|null} ageClassSet - Age-class set containing selected
    *     age-classes, or null if none are selected.
    * @return {Object|null} Selected comparison type, or null if not
    *     recognised.
    */
    function readComparison(queryString, ageClassSet) {
        var comparisonMatch = COMPARE_WITH_REGEXP.exec(queryString);
        if (comparisonMatch === null) {
            return null;
        } else {
            var comparisonName = decodeURIComponent(comparisonMatch[1]);
            var defaultIndex = BUILTIN_COMPARISON_TYPES.indexOf(comparisonName);
            if (defaultIndex >= 1) {
                return {index: defaultIndex, runner: null};
            } else if (defaultIndex === 0 && ageClassSet !== null) {
                var hasCompleters = ageClassSet.allCompetitors.some(function (competitor) {
                    return competitor.completed();
                });
                
                if (hasCompleters) {
                    return {index: 0, runner: null};
                } else {
                    // Cannot select 'Winner' as there was no winner.
                    return null;
                }
            } else if (ageClassSet === null) {
                // Not one of the recognised comparison types and we have no
                // classes to look for competitor names within.
                return null;
            } else {
                for (var competitorIndex = 0; competitorIndex < ageClassSet.allCompetitors.length; competitorIndex += 1) {
                    var competitor = ageClassSet.allCompetitors[competitorIndex];
                    if (competitor.name === comparisonName && competitor.completed()) {
                        return {index: BUILTIN_COMPARISON_TYPES.length, runner: competitor};
                    }
                }
                
                // Didn't find the competitor.
                return null;
            }
        }
    }
    
    /**
    * Formats the given comparison into the given query-string.
    * @param {String} queryString - The original query-string.
    * @param {Number} index - Index of the comparison type.
    * @param {String} The formatted query-string.
    */
    function formatComparison(queryString, index, runner) {
        queryString = removeAll(queryString, COMPARE_WITH_REGEXP);
        var comparison = null;
        if (typeof index === typeof 0 && 0 <= index && index < BUILTIN_COMPARISON_TYPES.length) {
            comparison = BUILTIN_COMPARISON_TYPES[index];
        } else if (runner !== null) {
            comparison = runner.name;
        }
        
        if (comparison === null) {
            return queryString;
        } else {
            return queryString + "&compareWith=" + encodeURIComponent(comparison);
        }
    }
    
    var SELECTED_COMPETITORS_REGEXP = /(?:^|&|\?)selected=([^&]+)/;
    
    /**
    * Reads what to compare against.
    * @param {String} queryString - The query string to read the comparison
    *     type from.
    * @param {AgeClassSet|null} ageClassSet - Age-class set containing selected
    *     age-classes, or null if none are selected.
    * @return {Array|null} Array of selected competitor indexes, or null if
    *     none found.
    */
    function readSelectedCompetitors(queryString, ageClassSet) {
        if (ageClassSet === null) {
            return null;
        } else {
            var selectedCompetitorsMatch = SELECTED_COMPETITORS_REGEXP.exec(queryString);
            if (selectedCompetitorsMatch === null) {
                return null;
            } else {
                var competitorNames = decodeURIComponent(selectedCompetitorsMatch[1]).split(";");
                if (competitorNames.indexOf("*") >= 0) {
                    // All competitors selected.
                    return d3.range(0, ageClassSet.allCompetitors.length);
                }
                
                competitorNames = d3.set(competitorNames).values();
                var allCompetitorNames = ageClassSet.allCompetitors.map(function (competitor) { return competitor.name; });
                var selectedCompetitorIndexes = [];
                competitorNames.forEach(function (competitorName) {
                    var index = allCompetitorNames.indexOf(competitorName);
                    if (index >= 0) {
                        selectedCompetitorIndexes.push(index);
                    }
                });
                
                selectedCompetitorIndexes.sort(d3.ascending);
                return (selectedCompetitorIndexes.length === 0) ? null : selectedCompetitorIndexes;
            }
        }
    }
    
    /**
    * Formats the given selected competitors into the given query-string.
    * @param {String} queryString - The original query-string.
    * @param {AgeClassSet} ageClassSet - The current age-class set.
    * @param {Array} selected - Array of indexes within the age-class set's
    *     list of competitors of those that are selected.
    * @return {String} Query-string with the selected competitors formatted
    *     into it.
    */
    function formatSelectedCompetitors(queryString, ageClassSet, selected) {
        queryString = removeAll(queryString, SELECTED_COMPETITORS_REGEXP);
        var selectedCompetitors = selected.map(function (index) { return ageClassSet.allCompetitors[index]; });
        if (selectedCompetitors.length === 0) {
            return queryString;
        } else if (selectedCompetitors.length === ageClassSet.allCompetitors.length) {
            // Assume all selected competitors are different, so all must be
            // selected.
            return queryString + "&selected=*";
        } else {
            var competitorNames = selectedCompetitors.map(function (comp) { return comp.name; }).join(";");
            return queryString + "&selected=" + encodeURIComponent(competitorNames);
        }
    }
    
    var SELECTED_STATISTICS_REGEXP = /(?:^|&|\?)stats=([^&]*)/;
    
    var ALL_STATS_NAMES = ["TotalTime", "SplitTime", "BehindFastest", "TimeLoss"];
    
    /**
    * Reads the selected statistics from the query string.
    * @param {String} queryString - The query string to read the selected
    *     statistics from.
    * @return {Object|null} - Object containing the statistics read, or null
    *     if no statistics parameter was found.
    */
    function readSelectedStatistics(queryString) {
        var statsMatch = SELECTED_STATISTICS_REGEXP.exec(queryString);
        if (statsMatch === null) {
            return null;
        } else {
            var statsNames = statsMatch[1].split(";");
            var stats = {};
            ALL_STATS_NAMES.forEach(function (statsName) { stats[statsName] = false; });
            
            for (var index = 0; index < statsNames.length; index += 1) {
                var name = statsNames[index];
                if (stats.hasOwnProperty(name)) {
                    stats[name] = true;
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
    * @param {String} queryString - The original query-string.
    * @param {Object} stats - The statistics to format.
    * @return Query-string with the selected statistics formatted in.
    */
    function formatSelectedStatistics(queryString, stats) {
        queryString = removeAll(queryString, SELECTED_STATISTICS_REGEXP);
        var statsNames = ALL_STATS_NAMES.filter(function (name) { return stats.hasOwnProperty(name) && stats[name]; });
        return queryString + "&stats=" + encodeURIComponent(statsNames.join(";"));
    }
    
    /**
    * Attempts to parse the given query string.
    * @param {String} queryString - The query string to parse.
    * @param {Event} eventData - The parsed event data.
    * @return {Object} The data parsed from the given query string.
    */
    function parseQueryString(queryString, eventData) {
        var ageClassSet = readSelectedClasses(queryString, eventData);
        var classIndexes = (ageClassSet === null) ? null : ageClassSet.ageClasses.map(function (ageClass) { return eventData.classes.indexOf(ageClass); });
        return {
            classes: classIndexes,
            view: readChartType(queryString),
            compareWith: readComparison(queryString, ageClassSet),
            selected: readSelectedCompetitors(queryString, ageClassSet),
            stats: readSelectedStatistics(queryString)
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
    * @param {String} queryString - The original query-string.
    * @param {Event} eventData - The event data.
    * @param {AgeClassSet} ageClassSet - The current age-class set.
    * @param {Object} data - Object containing the data to format into the
    *     query-string.
    * @return The formatted query-string.
    */
    function formatQueryString(queryString, eventData, ageClassSet, data) {
        queryString = formatSelectedClasses(queryString, eventData, data.classes);
        queryString = formatChartType(queryString, data.view);
        queryString = formatComparison(queryString, data.compareWith.index, data.compareWith.runner);
        queryString = formatSelectedCompetitors(queryString, ageClassSet, data.selected);
        queryString = formatSelectedStatistics(queryString, data.stats);
        queryString = queryString.replace(/^(\??)&/, "$1");
        return queryString;
    }
    
    SplitsBrowser.parseQueryString = parseQueryString;
    SplitsBrowser.formatQueryString = formatQueryString;
})();