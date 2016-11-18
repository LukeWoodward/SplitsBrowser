/*
 *  Messages - German messages for SplitsBrowser (Simon@Harston.de)
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward, Simon Harston
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
SplitsBrowser.Messages.de = {

    ApplicationVersion: "SplitsBrowser - Version $$VERSION$$",
    Language: "Deutsch",
    
    MispunchedShort: "Fehlst",
    NonCompetitiveShort: "a.K.",
    
    StartName: "Start",
    ControlName: "Posten $$CODE$$",
    FinishName: "Ziel",

    // The start and finish, as they appear at the top of the chart.
    StartNameShort: "S",
    FinishNameShort: "Z",
    
    // Button labels.
    SelectAllCompetitors: "Alle",
    SelectNoCompetitors: "Keine",
    SelectCrossingRunners: "Kreuzende Läufer",
    
    LowerXAxisChartLabel: "Laufzeit (Min)",

    // Chart type names and Y-axis labels.
    SplitsGraphChartType: "Zwischenzeiten",
    SplitsGraphYAxisLabel: "Zeitverlust (Min)",
    RaceGraphChartType: "Absolutzeiten",
    RaceGraphYAxisLabel: "Zeit",
    PositionAfterLegChartType: "Platz nach Posten",
    SplitPositionChartType: "Zwischenzeit Platz",
    PositionYAxisLabel: "Platz", // Shared between position-after-leg and split-position.
    PercentBehindChartType: "Prozent Rückstand",
    PercentBehindYAxisLabel: "Prozent Rückstand",
    ResultsTableChartType: "Ergebnis-Tabelle",
    
    ChartTypeSelectorLabel: "Ansicht: ",
    
    ClassSelectorLabel: "Kategorie: ",
    AdditionalClassSelectorLabel: "und",
    NoClassesLoadedPlaceholder: "[Keine Kategorien geladen]",
    
    // Placeholder text shown when additional classes are available to be
    // selected but none have been selected.
    NoAdditionalClassesSelectedPlaceholder: "<Auswahl>",

    ComparisonSelectorLabel: "Vergleichen mit ",
    CompareWithWinner: "Sieger",
    CompareWithFastestTime: "Schnellste Zeit",
    CompareWithFastestTimePlusPercentage: "Schnellste Zeit + $$PERCENT$$%",
    CompareWithAnyRunner: "Läufer...",
    CompareWithAnyRunnerLabel: "Läufer: ",
    // Warning message shown to the user when a comparison option cannot be
    // chosen because the course has no winner.
    CannotCompareAsNoWinner: "Vergleich mit '$$OPTION$$' nicht möglich, weil kein Läufer die Bahn absolviert hat.",
    
    // Label of checkbox that shows the original data as opposed to the
    // 'repaired' data.  This only appears if data that needs repair has been
    // loaded.
    ShowOriginalData: "Zeige Original-Daten",
  
    // Tooltip of 'Show original' checkbox.  This appears when SplitsBrowser
    // deduces that some of the cumulatives times in the data shown are
    // unrealistic.
    ShowOriginalDataTooltip: "SplitsBrowser hat einige Zeiten aus den Daten entfernt, weil es sie für unrealistisch hält.  " +
                             "Nutze diese CheckBox zur Wahl zwischen den korrigierten oder den Original-Daten.",
    
    StatisticsTotalTime: "Gesamtzeit",
    StatisticsSplitTime: "Zwischenzeit",
    StatisticsBehindFastest: "Rückstand zu optimal",
    StatisticsTimeLoss: "Zeitverlust",
    
    ResultsTableHeaderSingleControl: "1 Posten",
    ResultsTableHeaderMultipleControls: "$$NUM$$ Posten",
    ResultsTableHeaderCourseLength: "$$DISTANCE$$km",
    ResultsTableHeaderClimb: "$$CLIMB$$m",
    
    ResultsTableHeaderControlNumber: "#",
    ResultsTableHeaderName: "Name",
    ResultsTableHeaderTime: "Zeit",
    
    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show.
    RaceGraphNoCrossingRunners: "$$NAME$$ hat keine kreuzenden Läufer.",
    RaceGraphDisabledAsStartTimesMissing: "Die Ansicht Absolutzeiten ist deaktiviert, weil die Daten keine Startzeiten enthalten.",
    
    LoadFailedHeader: "SplitsBrowser \u2013 Fehler",
    LoadFailedInvalidData: "Entschuldigung, es war nicht möglich die Ergebnisdaten einzulesen. Sie scheinen ungültig zu sein: '$$MESSAGE$$'.",
    LoadFailedUnrecognisedData: "Entschuldigung, es war nicht möglich die Ergebnisdaten einzulesen. Die Daten sind in keinem bekannten Datenformat.",
    LoadFailedStatusNotSuccess: "Entschuldigung, es war nicht möglich die Ergebnisdaten einzulesen. Das Ergebnis der Anfrage war: '$$STATUS$$'.",
    LoadFailedReadError: "Entschuldigung, es war nicht möglich die Ergebnisdaten einzulesen. Die Antwort des Servers war: '$$ERROR$$'.",
    
    // Chart popups.
    
    SelectedClassesPopupHeader: "Zwischenzeiten",
    
    // Placeholder text shown when the Selected classes dialog is empty,
    // because no competitors registered a split for the control, or those
    // that did only registered a dubious split.
    SelectedClassesPopupPlaceholder: "Keine Teilnehmer",
    
    // Header for the 'Fastest leg time' popup dialog.
    FastestLegTimePopupHeader: "Schnellste Abschnittszeit $$START$$ zu $$END$$",

    // Header for the nearby-competitors dialog on the race graph.
    NearbyCompetitorsPopupHeader: "$$START$$ - $$END$$: $$CONTROL$$",
    
    // Placeholder text shown in the nearby-competitors dialog on the race
    // graph when there aren't any competitors visiting the control within the
    // +/- 2 minute window.
    NoNearbyCompetitors: "Keine Teilnehmer",
    
    // Link that appears at the top and opens SplitsBrowser with the settings
    // (selected classes, competitors, comparison, chart type, etc.) that are
    // currently shown.
    DirectLink: "Link",
    DirectLinkToolTip: "Öffnet eine URL, die SplitsBrowser mit den aktuellen Einstellungen öffnet",
    
    // The placeholder text shown in the competitor-list filter box when no
    // text has been entered into this box.
    CompetitorListFilter: "Filter",
    
    // Labels that appear beside a competitor on the Results Table to indicate
    // that they did not start, did not finish, or were disqualified.
    DidNotStartShort: "n.ang.",
    DidNotFinishShort: "aufg.",
    DisqualifiedShort: "disq.",
    
    // Placeholder message shown inside the competitor list if all competitors
    // in the class did not start.
    NoCompetitorsStarted: "Keine Teilnehmer gestartet",
    
    // Label of the language-selector control.
    LanguageSelectorLabel: "Sprache:",
    
    // Label that appears beside a competitor on the Results Table to indicate
    // that they were over the maximum time.
    OverMaxTimeShort: "ZeitUeb",

    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show and also a filter is active.
    // TO BE TRANSLATED
    RaceGraphNoCrossingRunnersFiltered: "$$NAME$$ has no crossing runners among the filtered competitors.",
    
    // Tooltip of the warning-triangle shown along the top if warnings were
    // issued reading in the file.
    // TO BE TRANSLATED
    WarningsTooltip: "It was not possible to read all of the data for this event.  One or more competitors or classes may have been omitted.  Click for more details."
};