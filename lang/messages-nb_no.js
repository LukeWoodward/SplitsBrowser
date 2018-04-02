/*
 *  Messages - NB Norwegian messages for SplitsBrowser
 *
 *  Copyright (C) 2000-2015 Luke Woodward
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
SplitsBrowser.Messages.nb_no = {

    ApplicationVersion: "SplitsBrowser - Versjon $$VERSION$$",
    Language: "Norwegian",

    MispunchedShort: "mp",
    NonCompetitiveShort: "n/c",

    StartName: "Start",
    ControlName: "Post $$CODE$$",
    FinishName: "Mål",

    // The start and finish, as they appear at the top of the chart.
    StartNameShort: "S",
    FinishNameShort: "M",

    // Button labels.
    SelectAllCompetitors: "Alle",
    SelectNoCompetitors: "Ingen",
    SelectCrossingRunners: "Kryssende løpere",

    LowerXAxisChartLabel: "Tid (min)",

    // Chart type names and Y-axis labels.
    SplitsGraphChartType: "Strekktids-graf",
    SplitsGraphYAxisLabel: "Tid (min)",
    RaceGraphChartType: "Sanntids-graf",
    RaceGraphYAxisLabel: "Tid",
    PositionAfterLegChartType: "Posisjon akkumulert",
    SplitPositionChartType: "Posisjon på strekk",
    PositionYAxisLabel: "Posisjon", // Shared between position-after-leg and split-position.
    PercentBehindChartType: "Prosent bak",
    PercentBehindYAxisLabel: "Prosent bak",
    ResultsTableChartType: "Resultat-tabell",

    ChartTypeSelectorLabel: "Vis graf: ",

    ClassSelectorLabel: "Klasse: ",
    AdditionalClassSelectorLabel: "og",
    NoClassesLoadedPlaceholder: "[Ingen klasser lastet inn]",

    // Placeholder text shown when additional classes are available to be
    // selected but none have been selected.
    NoAdditionalClassesSelectedPlaceholder: "<velg>",

    ComparisonSelectorLabel: "Sammelign med ",
    CompareWithWinner: "Vinner",
    CompareWithFastestTime: "Raskeste tid",
    CompareWithFastestTimePlusPercentage: "Raskeste tid + $$PERCENT$$%",
    CompareWithAnyRunner: "Valgt løper...",
    CompareWithAnyRunnerLabel: "Løper: ",
    // Warning message shown to the user when a comparison option cannot be
    // chosen because the course has no winner.
    CannotCompareAsNoWinner: "Kan ikke sammenligne med '$$OPTION$$', fordi ingen deltakere i denne klassen fullførte løypa.",

    // Label of checkbox that shows the original data as opposed to the
    // 'repaired' data.  This only appears if data that needs repair has been
    // loaded.
    ShowOriginalData: "Vis originaldata",

    // Tooltip of 'Show original' checkbox.  This appears when SplitsBrowser
    // deduces that some of the cumulatives times in the data shown are
    // unrealistic.
    ShowOriginalDataTooltip: "SplitsBrowser har fjernet noen av tidene fra dataen i de(n) valgte klassen(e), ettersom disse ser ut til å være urealistiske.  " +
                             "Bruk denne avkryssningsboksen til å kontrollere om  det er den endrede eller den originale dataen som plottes.",

    StatisticsTotalTime: "Totaltid",
    StatisticsSplitTime: "Strekktid",
    StatisticsBehindFastest: "Bak den raskeste",
    StatisticsTimeLoss: "Tidstap",

    ResultsTableHeaderSingleControl: "1 post",
    ResultsTableHeaderMultipleControls: "$$NUM$$ poster",
    ResultsTableHeaderCourseLength: "$$DISTANCE$$km",
    ResultsTableHeaderClimb: "$$CLIMB$$m",

    ResultsTableHeaderControlNumber: "#",
    ResultsTableHeaderName: "Navn",
    ResultsTableHeaderTime: "Tid",

    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show.
    RaceGraphNoCrossingRunners: "$$NAME$$ har ingen kryssende løpere.",
    RaceGraphDisabledAsStartTimesMissing: "Sanntidsgrafen kan ikke bli vist fordi starttidene til deltakerne mangler.",

    LoadFailedHeader: "SplitsBrowser \u2013 feil",
    LoadFailedInvalidData: "Beklager, det var ikke mulig å lese inn resultatdataen, ettersom dataen ser ut til å være ugyldig: '$$MESSAGE$$'.",
    LoadFailedUnrecognisedData: "Beklager, det var ikke mulig å lese inn resultatdataen.  Dataen ser ikke ut til å være i et kjent format.",
    LoadFailedStatusNotSuccess: "Beklager, det var ikke mulig å lese inn resultatdataen.  Status for forespørselen var '$$STATUS$$'.",
    LoadFailedReadError: "Beklager, det var ikke mulig å lese inn resultatdataen.  Feilmeldingen returnert fra tjeneren var '$$ERROR$$'.",

    // Chart popups.

    SelectedClassesPopupHeader: "Valgte klasser",

    // Placeholder text shown when the Selected classes dialog is empty,
    // because no competitors registered a split for the control, or those
    // that did only registered a dubious split.
    SelectedClassesPopupPlaceholder: "Ingen deltakere",

    // Header for the 'Fastest leg time' popup dialog.
    FastestLegTimePopupHeader: "Raskeste strekktid $$START$$ til $$END$$",

    // Header for the nearby-competitors dialog on the race graph.
    NearbyCompetitorsPopupHeader: "$$START$$ - $$END$$: $$CONTROL$$",

    // Placeholder text shown in the nearby-competitors dialog on the race
    // graph when there aren't any competitors visiting the control within the
    // +/- 2 minute window.
    NoNearbyCompetitors: "Ingen deltakere",

    // Link that appears at the top and opens SplitsBrowser with the settings
    // (selected classes, competitors, comparison, chart type, etc.) that are
    // currently shown.
    DirectLink: "Lenke",
    DirectLinkToolTip: "Lenke til en URL som åpner SplitsBrowser med valgte innstillinger",

    // The placeholder text shown in the competitor-list filter box when no
    // text has been entered into this box.
    CompetitorListFilter: "Filtrer",

    // Labels that appear beside a competitor on the Results Table to indicate
    // that they did not start, did not finish, or were disqualified.
    DidNotStartShort: "dns",
    DidNotFinishShort: "dnf",
    DisqualifiedShort: "dsq",

    // Placeholder message shown inside the competitor list if all competitors
    // in the class did not start.
    NoCompetitorsStarted: "Ingen deltakere startet",

    // Label of the language-selector control.
    LanguageSelectorLabel: "Språk:",

    // Label that appears beside a competitor on the Results Table to indicate
    // that they were over the maximum time.
    OverMaxTimeShort: "over makstiden",

    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show and also a filter is active.
    RaceGraphNoCrossingRunnersFiltered: "$$NAME$$ har ingen kryssende løpere blant de filtrerte deltakerne.",
    
    // Tooltip of the warning-triangle shown along the top if warnings were
    // issued reading in the file.
    WarningsTooltip: "Det var ikke mulig å lese all data fra dette arrangementet. En eller flere utøvere eller klasser kan ha blitt utelatt. Klikk for mer informasjon."
};
