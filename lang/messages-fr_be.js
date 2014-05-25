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
SplitsBrowser.Messages = {

    ApplicationVersion: "SplitsBrowser - Version $$VERSION$$",
    Language: "FranÃ§ais",
    
    MispunchedShort: "pm",
    NonCompetitiveShort: "hc",
    
    StartName: "DÃ©part",
    ControlName: "ContrÃ´le $$CODE$$",
    FinishName: "ArrivÃ©e",

    // The start and finish, as they appear at the top of the chart.
    StartNameShort: "D",
    FinishNameShort: "A",
    
    // Button labels.
    SelectAllCompetitors: "Tous",
    SelectNoCompetitors: "Aucun",
    SelectCrossingRunners: "Coureurs rencontrÃ©s",
    
    LowerXAxisChartLabel: "Temps (min)",

    // Chart type names and Y-axis labels.
    SplitsGraphChartType: "Graphique",
    SplitsGraphYAxisLabel: "Temps (min)",
    RaceGraphChartType: "Heures rÃ©elles",
    RaceGraphYAxisLabel: "Temps",
    PositionAfterLegChartType: "Place aprÃ¨s tronÃ§on",
    SplitPositionChartType: "Place intermÃ©diaire",
    PositionYAxisLabel: "Place", // Shared between position-after-leg and split-position.
    PercentBehindChartType: "% Retard",
    PercentBehindYAxisLabel: "% Retard",
    ResultsTableChartType: "Table",
    
    ChartTypeSelectorLabel: "Afficher: ",
    
    ClassSelectorLabel: "Circuit: ",
    AdditionalClassSelectorLabel: "et",
    NoClassesLoadedPlaceholder: "[Aucun circuit chargÃ©]",
    
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
    CannotCompareAsNoWinner: "Impossible de comparer avec '$$OPTION$$' car aucun coureur de ce circuit n'a terminÃ© le parcours.",
    
    // Label of checkbox that shows the original data as opposed to the
    // 'repaired' data.  This only appears if data that needs repair has been
    // loaded.
    ShowOriginalData: "Show original data",
  
    // Tooltip of 'Show original' checkbox.  This appears when SplitsBrowser
    // deduces that some of the cumulatives times in the data shown are
    // unrealistic.
    ShowOriginalDataTooltip: "SplitsBrowser a retiré certains temps des données du parcours sélectionné, les estimant non réalistes. " +
                             "Utilisez la case à cocher pour afficher les données originales ou modifiées.",
    
    StatisticsTotalTime: "Temps total",
    StatisticsSplitTime: "Temps intermÃ©diaire",
    StatisticsBehindFastest: "Retard # 1",
    StatisticsTimeLoss: "Temps perdu",
    
    ResultsTableHeaderSingleControl: "1 contrÃ´le",
    ResultsTableHeaderMultipleControls: "$$NUM$$ contrÃ´les",
    ResultsTableHeaderCourseLength: "$$DISTANCE$$km",
    ResultsTableHeaderClimb: "$$CLIMB$$m",
    
    ResultsTableHeaderControlNumber: "#",
    ResultsTableHeaderName: "Nom",
    ResultsTableHeaderTime: "Temps",
    
    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show.
    RaceGraphNoCrossingRunners: "$$NAME$$ n'a rencontrÃ© aucun coureur.",
    RaceGraphDisabledAsStartTimesMissing: "Ce graphique ne peut être affiché car il n'y a pas d'heures de départ dans les données.",
    
    LoadFailedHeader: "SplitsBrowser \u2013 Erreur",
    LoadFailedInvalidData: "Désolé, il est impossible de lire les données; elle sont invalides: '$$MESSAGE$$'.",
    LoadFailedUnrecognisedData: "Désolé, il est impossible de lire les données.  Elles sont fournies dans un format inconnu.",
    LoadFailedStatusNotSuccess: "Désolé, il est impossible de lire les données.  l'état de la requête est '$$STATUS$$'.",
    LoadFailedReadError: "Désolé, il est impossible de charger les données.  Le message d'erreur reçu du serveur est '$$ERROR$$'.",
    
    // Chart popups.
    
    SelectedClassesPopupHeader: "Circuits sÃ©lectionnÃ©s",
    
    // Placeholder text shown when the Selected classes dialog is empty,
    // because no competitors registered a split for the control, or those
    // that did only registered a dubious split.
    SelectedClassesPopupPlaceholder: "Aucun coureur n'a terminÃ© ce circuit",
    
    // Header for the 'Fastest leg time' popup dialog.
    FastestLegTimePopupHeader: "IntermÃ©diaire le plus rapide $$START$$ - $$END$$",

    // Header for the nearby-competitors dialog on the race graph.
    NearbyCompetitorsPopupHeader: "$$START$$ - $$END$$: $$CONTROL$$",
    
    // Placeholder text shown in the nearby-competitors dialog on the race
    // graph when there aren't any competitors visiting the control within the
    // +/- 2 minute window.
    NoNearbyCompetitors: "Aucun coureur"
};