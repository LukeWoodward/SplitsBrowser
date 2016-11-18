/*
 *  Messages - UK English messages for SplitsBrowser
 *  
 *  Copyright (C) 2000-2016 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
SplitsBrowser.Messages.en_gb = {

    ApplicationVersion: "SplitsBrowser - Version $$VERSION$$",
    Language: "English",
    
    MispunchedShort: "mp",
    NonCompetitiveShort: "n/c",
    
    StartName: "Start",
    ControlName: "Control $$CODE$$",
    FinishName: "Finish",

    // The start and finish, as they appear at the top of the chart.
    StartNameShort: "S",
    FinishNameShort: "F",
    
    // Button labels.
    SelectAllCompetitors: "All",
    SelectNoCompetitors: "None",
    SelectCrossingRunners: "Crossing runners",
    
    LowerXAxisChartLabel: "Time (min)",

    // Chart type names and Y-axis labels.
    SplitsGraphChartType: "Splits graph",
    SplitsGraphYAxisLabel: "Time (min)",
    RaceGraphChartType: "Race graph",
    RaceGraphYAxisLabel: "Time",
    PositionAfterLegChartType: "Position after leg",
    SplitPositionChartType: "Split position",
    PositionYAxisLabel: "Position", // Shared between position-after-leg and split-position.
    PercentBehindChartType: "Percent behind",
    PercentBehindYAxisLabel: "Percent behind",
    ResultsTableChartType: "Results table",
    
    ChartTypeSelectorLabel: "View: ",
    
    ClassSelectorLabel: "Class: ",
    AdditionalClassSelectorLabel: "and",
    NoClassesLoadedPlaceholder: "[No classes loaded]",
    
    // Placeholder text shown when additional classes are available to be
    // selected but none have been selected.
    NoAdditionalClassesSelectedPlaceholder: "<select>",

    ComparisonSelectorLabel: "Compare with ",
    CompareWithWinner: "Winner",
    CompareWithFastestTime: "Fastest time",
    CompareWithFastestTimePlusPercentage: "Fastest time + $$PERCENT$$%",
    CompareWithAnyRunner: "Any runner...",
    CompareWithAnyRunnerLabel: "Runner: ",
    // Warning message shown to the user when a comparison option cannot be
    // chosen because the course has no winner.
    CannotCompareAsNoWinner: "Cannot compare against '$$OPTION$$' because no competitors in this class complete the course.",
    
    // Label of checkbox that shows the original data as opposed to the
    // 'repaired' data.  This only appears if data that needs repair has been
    // loaded.
    ShowOriginalData: "Show original data",
  
    // Tooltip of 'Show original' checkbox.  This appears when SplitsBrowser
    // deduces that some of the cumulatives times in the data shown are
    // unrealistic.
    ShowOriginalDataTooltip: "SplitsBrowser has removed some of the times from the data in the selected class(es), believing these times to be unrealistic.  " +
                             "Use this checkbox to control whether the amended or original data is plotted.",
    
    StatisticsTotalTime: "Total time",
    StatisticsSplitTime: "Split time",
    StatisticsBehindFastest: "Behind fastest",
    StatisticsTimeLoss: "Time loss",
    
    ResultsTableHeaderSingleControl: "1 control",
    ResultsTableHeaderMultipleControls: "$$NUM$$ controls",
    ResultsTableHeaderCourseLength: "$$DISTANCE$$km",
    ResultsTableHeaderClimb: "$$CLIMB$$m",
    
    ResultsTableHeaderControlNumber: "#",
    ResultsTableHeaderName: "Name",
    ResultsTableHeaderTime: "Time",
    
    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show.
    RaceGraphNoCrossingRunners: "$$NAME$$ has no crossing runners.",
    RaceGraphDisabledAsStartTimesMissing: "The Race Graph cannot be shown because the start times of the competitors are missing.",
    
    LoadFailedHeader: "SplitsBrowser \u2013 Error",
    LoadFailedInvalidData: "Sorry, it wasn't possible to read in the results data, as the data appears to be invalid: '$$MESSAGE$$'.",
    LoadFailedUnrecognisedData: "Sorry, it wasn't possible to read in the results data.  The data doesn't appear to be in any recognised format.",
    LoadFailedStatusNotSuccess: "Sorry, it wasn't possible to read in the results data.  The status of the request was '$$STATUS$$'.",
    LoadFailedReadError: "Sorry, it wasn't possible to load the results data.  The error message returned from the server was '$$ERROR$$'.",
    
    // Chart popups.
    
    SelectedClassesPopupHeader: "Selected classes",
    
    // Placeholder text shown when the Selected classes dialog is empty,
    // because no competitors registered a split for the control, or those
    // that did only registered a dubious split.
    SelectedClassesPopupPlaceholder: "No competitors",
    
    // Header for the 'Fastest leg time' popup dialog.
    FastestLegTimePopupHeader: "Fastest leg-time $$START$$ to $$END$$",

    // Header for the nearby-competitors dialog on the race graph.
    NearbyCompetitorsPopupHeader: "$$START$$ - $$END$$: $$CONTROL$$",
    
    // Placeholder text shown in the nearby-competitors dialog on the race
    // graph when there aren't any competitors visiting the control within the
    // +/- 2 minute window.
    NoNearbyCompetitors: "No competitors",
    
    // Link that appears at the top and opens SplitsBrowser with the settings
    // (selected classes, competitors, comparison, chart type, etc.) that are
    // currently shown.
    DirectLink: "Link",
    DirectLinkToolTip: "Links to a URL that opens SplitsBrowser with the current settings",
    
    // The placeholder text shown in the competitor-list filter box when no
    // text has been entered into this box.
    CompetitorListFilter: "Filter",
    
    // Labels that appear beside a competitor on the Results Table to indicate
    // that they did not start, did not finish, or were disqualified.
    DidNotStartShort: "dns",
    DidNotFinishShort: "dnf",
    DisqualifiedShort: "dsq",
    
    // Placeholder message shown inside the competitor list if all competitors
    // in the class did not start.
    NoCompetitorsStarted: "No competitors started",
    
    // Label of the language-selector control.
    LanguageSelectorLabel: "Language:",
    
    // Label that appears beside a competitor on the Results Table to indicate
    // that they were over the maximum time.
    OverMaxTimeShort: "over max time",

    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show and also a filter is active.
    RaceGraphNoCrossingRunnersFiltered: "$$NAME$$ has no crossing runners among the filtered competitors.",
    
    // Tooltip of the warning-triangle shown along the top if warnings were
    // issued reading in the file.
    WarningsTooltip: "It was not possible to read all of the data for this event.  One or more competitors or classes may have been omitted.  Click for more details."
};