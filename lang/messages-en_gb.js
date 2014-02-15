/*
 *  Messages - UK English messages for SplitsBrowser
 *  
 *  Copyright (C) 2000-2013 Dave Ryder, Reinhard Balling, Andris Strazdins,
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
SplitsBrowser.Messages = {

    ApplicationVersion: "SplitsBrowser - Version $$VERSION$$",
    
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

    NoSplitsForControl: "Cannot draw a graph because no competitor has recorded a split time for control $$CONTROL$$.",
    NoSplitsForControlTryOtherClasses: "Cannot draw a graph because no competitor has recorded a split time for control $$CONTROL$$.  Try selecting some other classes.",
    
    LoadFailedHeader: "SplitsBrowser \u2013 Error",
    LoadFailedInvalidData: "Sorry, it wasn't possible to read in the results data, as the data appears to be invalid: '$$MESSAGE$$'.",
    LoadFailedUnrecognisedData: "Sorry, it wasn't possible to read in the results data.  The data doesn't appear to be in any recognised format.",
    LoadFailedStatusNotSuccess: "Sorry, it wasn't possible to read in the results data.  The status of the request was '$$STATUS$$'.",
    LoadFailedReadError: "Sorry, it wasn't possible to load the results data.  The error message returned from the server was '$$ERROR$$'.",
    
    // Chart popups.
    
    SelectedClassesPopupHeader: "Selected classes",
    
    // Placeholder text shown when the Selected classes dialog is empty,
    // because no competitors completed the course.
    SelectedClassesPopupPlaceholder: "No competitors completed this course",
    
    // Header for the 'Fastest leg time' popup dialog.
    FastestLegTimePopupHeader: "Fastest leg-time $$START$$ to $$END$$",

    // Header for the nearby-competitors dialog on the race graph.
    NearbyCompetitorsPopupHeader: "$$START$$ - $$END$$: $$CONTROL$$",
    
    // Placeholder text shown in the nearby-competitors dialog on the race
    // graph when there aren't any competitors visiting the control within the
    // +/- 2 minute window.
    NoNearbyCompetitors: "No competitors"
};