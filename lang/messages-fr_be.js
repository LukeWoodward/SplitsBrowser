/*
 *  Messages - Belgian French messages for SplitsBrowser
 *  
 *  Copyright (C) 2000-2014 Dave Ryder, Reinhard Balling, Andris Strazdins,
 *                          Ed Nash, Luke Woodward, Robert Marique
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
SplitsBrowser.Messages.fr_be = {

    ApplicationVersion: "SplitsBrowser - Version $$VERSION$$",
    Language: "Français",
    
    MispunchedShort: "pm",
    NonCompetitiveShort: "hc",
    
    StartName: "Départ",
    ControlName: "Contrôle $$CODE$$",
    FinishName: "Arrivée",

    // The start and finish, as they appear at the top of the chart.
    StartNameShort: "D",
    FinishNameShort: "A",
    
    // Button labels.
    SelectAllCompetitors: "Tous",
    SelectNoCompetitors: "Aucun",
    SelectCrossingRunners: "Coureurs rencontrés",
    
    LowerXAxisChartLabel: "Temps (min)",

    // Chart type names and Y-axis labels.
    SplitsGraphChartType: "Graphique",
    SplitsGraphYAxisLabel: "Temps (min)",
    RaceGraphChartType: "Heures réelles",
    RaceGraphYAxisLabel: "Temps",
    PositionAfterLegChartType: "Place après tronçon",
    SplitPositionChartType: "Place intermédiaire",
    PositionYAxisLabel: "Place", // Shared between position-after-leg and split-position.
    PercentBehindChartType: "% Retard",
    PercentBehindYAxisLabel: "% Retard",
    ResultsTableChartType: "Table",
    
    ChartTypeSelectorLabel: "Afficher: ",
    
    ClassSelectorLabel: "Circuit: ",
    AdditionalClassSelectorLabel: "et",
    NoClassesLoadedPlaceholder: "[Aucun circuit chargé]",
    
    // Placeholder text shown when additional classes are available to be
    // selected but none have been selected.
    NoAdditionalClassesSelectedPlaceholder: "<Choisir>",

    ComparisonSelectorLabel: "Comparer avec ",
    CompareWithWinner: "Vainqueur",
    CompareWithFastestTime: "Meilleur temps",
    CompareWithFastestTimePlusPercentage: "Meilleur temps + $$PERCENT$$%",
    CompareWithAnyRunner: "N'importe quel coureur...",
    CompareWithAnyRunnerLabel: "Coureur: ",
    // Warning message shown to the user when a comparison option cannot be
    // chosen because the course has no winner.
    CannotCompareAsNoWinner: "Impossible de comparer avec '$$OPTION$$' car aucun coureur de ce circuit n'a terminé le parcours.",
    
    // Label of checkbox that shows the original data as opposed to the
    // 'repaired' data.  This only appears if data that needs repair has been
    // loaded.
    ShowOriginalData: "Afficher les données d'origine",
  
    // Tooltip of 'Show original' checkbox.  This appears when SplitsBrowser
    // deduces that some of the cumulatives times in the data shown are
    // unrealistic.
    ShowOriginalDataTooltip: "SplitsBrowser a retiré certains temps des données du parcours sélectionné, les estimant non réalistes. " +
                             "Utilisez la case à cocher pour afficher les données originales ou modifiées.",
    
    StatisticsTotalTime: "Temps total",
    StatisticsSplitTime: "Temps intermédiaire",
    StatisticsBehindFastest: "Retard # 1",
    StatisticsTimeLoss: "Temps perdu",
    
    ResultsTableHeaderSingleControl: "1 contrôle",
    ResultsTableHeaderMultipleControls: "$$NUM$$ contrôles",
    ResultsTableHeaderCourseLength: "$$DISTANCE$$km",
    ResultsTableHeaderClimb: "$$CLIMB$$m",
    
    ResultsTableHeaderControlNumber: "#",
    ResultsTableHeaderName: "Nom",
    ResultsTableHeaderTime: "Temps",
    
    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show.
    RaceGraphNoCrossingRunners: "$$NAME$$ n'a rencontré aucun coureur.",
    RaceGraphDisabledAsStartTimesMissing: "Ce graphique ne peut être affiché car il n'y a pas d'heures de départ dans les données.",
    
    LoadFailedHeader: "SplitsBrowser \u2013 Erreur",
    LoadFailedInvalidData: "Désolé, il est impossible de lire les données; elles sont invalides: '$$MESSAGE$$'.",
    LoadFailedUnrecognisedData: "Désolé, il est impossible de lire les données.  Elles sont fournies dans un format inconnu.",
    LoadFailedStatusNotSuccess: "Désolé, il est impossible de lire les données.  l'état de la requête est '$$STATUS$$'.",
    LoadFailedReadError: "Désolé, il est impossible de charger les données.  Le message d'erreur reçu du serveur est '$$ERROR$$'.",
    
    // Chart popups.
    
    SelectedClassesPopupHeader: "Circuits sélectionnés",
    
    // Placeholder text shown when the Selected classes dialog is empty,
    // because no competitors registered a split for the control, or those
    // that did only registered a dubious split.
    SelectedClassesPopupPlaceholder: "Aucun coureur n'a terminé ce circuit",
    
    // Header for the 'Fastest leg time' popup dialog.
    FastestLegTimePopupHeader: "Intermédiaire le plus rapide $$START$$ - $$END$$",

    // Header for the nearby-competitors dialog on the race graph.
    NearbyCompetitorsPopupHeader: "$$START$$ - $$END$$: $$CONTROL$$",
    
    // Placeholder text shown in the nearby-competitors dialog on the race
    // graph when there aren't any competitors visiting the control within the
    // +/- 2 minute window.
    NoNearbyCompetitors: "Aucun coureur",

    // Link that appears at the top and opens SplitsBrowser with the settings
    // (selected classes, competitors, comparison, chart type, etc.) that are
    // currently shown.
    DirectLink: "Lien",
    DirectLinkToolTip: "Lien vers une URL qui lance SplitsBrowser avec les paramètres en cours",
    
    // The placeholder text shown in the competitor-list filter box when no
    // text has been entered into this box.
    CompetitorListFilter: "Filtre",
    
    // Labels that appear beside a competitor on the Results Table to indicate
    // that they did not start, did not finish, or were disqualified.
    DidNotStartShort: "dns",
    DidNotFinishShort: "ab",
    DisqualifiedShort: "dsq",
    
    // Placeholder message shown inside the competitor list if all competitors
    // in the class did not start.
    NoCompetitorsStarted: "Aucun coureur n'a encore pris le départ",
    
    // Label of the language-selector control.
    LanguageSelectorLabel: "Langue:",
    
    // Label that appears beside a competitor on the Results Table to indicate
    // that they were over the maximum time.
    OverMaxTimeShort: "Au delà du temps maximum",

    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show and also a filter is active.
    RaceGraphNoCrossingRunnersFiltered: "$$NAME$$ n'a rencontré aucun coureur du filtre en service.",
    
    // Tooltip of the warning-triangle shown along the top if warnings were
    // issued reading in the file.
    WarningsTooltip: "Impossible de lire toutes les données de cette compétition.  Un(e) ou plusieurs coureurs ou catégories peuvent avoir été omis.  Cliquer pour d'autres détails."
};