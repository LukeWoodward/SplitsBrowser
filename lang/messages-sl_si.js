/*
 *  Messages - Slovenian messages for SplitsBrowser
 *
 *  Copyright (C) 2000-2016 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward, Klemen Kenda
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
SplitsBrowser.Messages.sl_si = {

    ApplicationVersion: "SplitsBrowser - Verzija $$VERSION$$",
    Language: "Slovenščina",

    MispunchedShort: "mp",
    NonCompetitiveShort: "n/c",

    StartName: "Start",
    ControlName: "KT $$CODE$$",
    FinishName: "Cilj",

    // The start and finish, as they appear at the top of the chart.
    StartNameShort: "S",
    FinishNameShort: "C",

    // Button labels.
    SelectAllCompetitors: "Vsi",
    SelectNoCompetitors: "Nihče",
    SelectCrossingRunners: "Križanje",

    LowerXAxisChartLabel: "Čas (min)",

    // Chart type names and Y-axis labels.
    SplitsGraphChartType: "Vmesni časi",
    SplitsGraphYAxisLabel: "Čas (min)",
    RaceGraphChartType: "Potek tekme",
    RaceGraphYAxisLabel: "Čas",
    PositionAfterLegChartType: "Mesto po etapi",
    SplitPositionChartType: "Mesto vmesnega časa",
    PositionYAxisLabel: "Mesto", // Shared between position-after-leg and split-position.
    PercentBehindChartType: "Zaostanek (%)",
    PercentBehindYAxisLabel: "Zaostanek (%)",
    ResultsTableChartType: "Tabela rezultatov",

    ChartTypeSelectorLabel: "Pogled: ",

    ClassSelectorLabel: "Kategorija: ",
    AdditionalClassSelectorLabel: "in",
    NoClassesLoadedPlaceholder: "[Nobena kategorija ni naložena]",

    // Placeholder text shown when additional classes are available to be
    // selected but none have been selected.
    NoAdditionalClassesSelectedPlaceholder: "<izberi>",

    ComparisonSelectorLabel: "Primerjaj z ",
    CompareWithWinner: "zmagovalecem",
    CompareWithFastestTime: "najhitrejšim časom",
    CompareWithFastestTimePlusPercentage: "najhitrejšim časom + $$PERCENT$$%",
    CompareWithAnyRunner: "izbranim tekmovalcem ...",
    CompareWithAnyRunnerLabel: "Tekmovalec: ",
    // Warning message shown to the user when a comparison option cannot be
    // chosen because the course has no winner.
    CannotCompareAsNoWinner: "Nemorem primerjati z '$$OPTION$$', saj noben tekmovalec ni zaključil s to progo.",

    // Label of checkbox that shows the original data as opposed to the
    // 'repaired' data.  This only appears if data that needs repair has been
    // loaded.
    ShowOriginalData: "Prikaži originalne podatke",

    // Tooltip of 'Show original' checkbox.  This appears when SplitsBrowser
    // deduces that some of the cumulatives times in the data shown are
    // unrealistic.
    ShowOriginalDataTooltip: "SplitsBrowser je odstranil nekaj podatkov za izbrano(e) kategorijo(e), saj je ocenil, da niso realni. " +
                             "Uporabi ta checkbox za izris bodisi popravljenih bodisi originalnih podatkov.",

    StatisticsTotalTime: "Skupni čas",
    StatisticsSplitTime: "Vmesni čas",
    StatisticsBehindFastest: "Za najhitrejšim",
    StatisticsTimeLoss: "Izguba časa",

    ResultsTableHeaderSingleControl: "1 KT",
    ResultsTableHeaderMultipleControls: "$$NUM$$ KT",
    ResultsTableHeaderCourseLength: "$$DISTANCE$$km",
    ResultsTableHeaderClimb: "$$CLIMB$$m",

    ResultsTableHeaderControlNumber: "#",
    ResultsTableHeaderName: "Ime",
    ResultsTableHeaderTime: "Čas",

    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show.
    RaceGraphNoCrossingRunners: "Pot osebe $$NAME$$ se ni križala z nikomer.",
    RaceGraphDisabledAsStartTimesMissing: "Grafa tekme ni moč prikazati, saj manjkajo startni časi tekmovalcev.",

    LoadFailedHeader: "SplitsBrowser \u2013 napaka",
    LoadFailedInvalidData: "Oprostite, podatkov z rezultati ni bilo mogoče prebrati; podatki so videti neveljavni: '$$MESSAGE$$'.",
    LoadFailedUnrecognisedData: "Oprostite, podatkov z rezultati ni bilo mogoče prebrati.  Podatki niso v razpoznavnem formatu.",
    LoadFailedStatusNotSuccess: "Oprostite, podatkov z rezultati ni bilo mogoče prebrati.  Status zahtevka je bil '$$STATUS$$'.",
    LoadFailedReadError: "Oprostite, podatkov z rezultati ni bilo mogoče naložiti.  Strežnik je vrnil napako '$$ERROR$$'.",

    // Chart popups.

    SelectedClassesPopupHeader: "Izbrane kategorije",

    // Placeholder text shown when the Selected classes dialog is empty,
    // because no competitors registered a split for the control, or those
    // that did only registered a dubious split.
    SelectedClassesPopupPlaceholder: "Ni tekmovalcev",

    // Header for the 'Fastest leg time' popup dialog.
    FastestLegTimePopupHeader: "Najhitrejši čas etape $$START$$ do $$END$$",

    // Header for the nearby-competitors dialog on the race graph.
    NearbyCompetitorsPopupHeader: "$$START$$ - $$END$$: $$CONTROL$$",

    // Placeholder text shown in the nearby-competitors dialog on the race
    // graph when there aren't any competitors visiting the control within the
    // +/- 2 minute window.
    NoNearbyCompetitors: "Ni tekmovalcev",

    // Link that appears at the top and opens SplitsBrowser with the settings
    // (selected classes, competitors, comparison, chart type, etc.) that are
    // currently shown.
    DirectLink: "Povezava",
    DirectLinkToolTip: "Povezava odpre SplitsBrowser s trenutnimi nastavitvami",

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
    NoCompetitorsStarted: "Noben tekmovalec ni startal",

    // Label of the language-selector control.
    LanguageSelectorLabel: "Jezik:",

    // Label that appears beside a competitor on the Results Table to indicate
    // that they were over the maximum time.
    OverMaxTimeShort: "čez maksimalni dovoljeni čas",

    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show and also a filter is active.
    RaceGraphNoCrossingRunnersFiltered: "Pot osebe $$NAME$$ se ni križala izbranimi tekmovalci.",

    // Tooltip of the warning-triangle shown along the top if warnings were
    // issued reading in the file.
    WarningsTooltip: "Vseh podatkov za to tekmovanje ni bilo mogoče prebrati. Enega ali več tekmovalcev ali kategorij smo izpustili.  Kliknite za več podrobnosti."
};
