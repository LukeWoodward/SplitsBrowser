﻿/* 
 *  Messages - NL Dutch messages for SplitsBrowser 
 *   
 *  Copyright (C) 2000-2020 Dave Ryder, Reinhard Balling, Andris Strazdins, 
 *                          Ed Nash, Luke Woodward, Jan-Gerard van der Toorn
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
SplitsBrowser.Messages.nl_nl = { 
  
    ApplicationVersion: "SplitsBrowser - Versie $$VERSION$$", 
    Language: "Nederlands", 
      
    MispunchedShort: "decl", 
    NonCompetitiveShort: "n/c", 
      
    StartName: "Start", 
    ControlName: "Controle $$CODE$$", 
    FinishName: "Finish", 
  
    // The start and finish, as they appear at the top of the chart. 
    StartNameShort: "S", 
    FinishNameShort: "F", 
      
    // Button labels. 
    SelectAllCompetitors: "Allen", 
    SelectNoCompetitors: "Geen", 
    SelectCrossingRunners: "Gepasseerde lopers", 
      
    LowerXAxisChartLabel: "Tijd (min)", 
  
    // Chart type names and Y-axis labels. 
    SplitsGraphChartType: "Splits grafiek", 
    SplitsGraphYAxisLabel: "Tijd (min)", 
    RaceGraphChartType: "Wedstr grafiek", 
    RaceGraphYAxisLabel: "Tijd", 
    PositionAfterLegChartType: "Positie na been", 
    SplitPositionChartType: "Split positie", 
    PositionYAxisLabel: "Positie", // Shared between position-after-leg and split-position. 
    PercentBehindChartType: "Procent achter", 
    PercentBehindYAxisLabel: "Procent achter", 
    ResultsTableChartType: "Uitslag tabel", 
      
    ChartTypeSelectorLabel: "Weergave: ", 
      
    ClassSelectorLabel: "Categorie: ", 
    AdditionalClassSelectorLabel: "en", 
    NoClassesLoadedPlaceholder: "[Geen cat. geladen]", 
      
    // Placeholder text shown when additional classes are available to be 
    // selected but none have been selected. 
    NoAdditionalClassesSelectedPlaceholder: "<selecteer>", 
  
    ComparisonSelectorLabel: "Vergelijk met ", 
    CompareWithWinner: "Winnaar", 
    CompareWithFastestTime: "Snelste tijd", 
    CompareWithFastestTimePlusPercentage: "Snelste tijd + $$PERCENT$$%", 
    CompareWithAnyRunner: "Een deelnemer...", 
    CompareWithAnyRunnerLabel: "Deelnemer: ", 
    CompareWithAnyTeam: "Een team...", 
    CompareWithAnyTeamLabel: "Team: ", 
    // Warning message shown to the user when a comparison option cannot be 
    // chosen because the course has no winner. 
    CannotCompareAsNoWinner: "Een vergelijking met '$$OPTION$$' is niet mogelijk omdat geen enkele deelnemer op deze route de wedstrijd volbracht.", 
    CannotCompareAsNoWinnerTeam: "Een vergelijking met '$$OPTION$$' is niet mogelijk omdat geen enkel team in deze klasse de wedstrijd volbracht.", 
      
    // Label of checkbox that shows the original data as opposed to the 
    // 'repaired' data.  This only appears if data that needs repair has been 
    // loaded. 
    ShowOriginalData: "Toon originele data", 
    
    // Tooltip of 'Show original' checkbox.  This appears when SplitsBrowser 
    // deduces that some of the cumulatives times in the data shown are 
    // unrealistic. 
    ShowOriginalDataTooltip: "SplitsBrowser heeft sommige tijden verwijderd uit de gegevens van de geselecteerde route omdat de tijden als ongeloofwaardig worden beschouwd.  " + 
                             "Gebruik deze checkbox om te controleren of er originele of gewijzigde gegevens worden gebruikt.", 
      
    StatisticsTotalTime: "Totale tijd", 
    StatisticsSplitTime: "Split tijd", 
    StatisticsBehindFastest: "Achter snelste", 
    StatisticsTimeLoss: "Tijdverlies", 
      
    ResultsTableHeaderSingleControl: "1 controle", 
    ResultsTableHeaderMultipleControls: "$$NUM$$ controles", 
    ResultsTableHeaderCourseLength: "$$DISTANCE$$km", 
    ResultsTableHeaderClimb: "$$CLIMB$$m", 
      
    ResultsTableHeaderControlNumber: "#", 
    ResultsTableHeaderName: "Naam", 
    ResultsTableHeaderTime: "Tijd", 
      
    // Alert message shown when you click 'Crossing runners' but there are no 
    // crossing runners to show. 
    RaceGraphNoCrossingRunners: "$$NAME$$ heeft geen kruisende lopers.", 
    RaceGraphDisabledAsStartTimesMissing: "De grafiek kan niet getoond worden omdat de starttijden van de deelnemers ontbreken.", 
      
    LoadFailedHeader: "SplitsBrowser \u2013 Fout", 
    LoadFailedInvalidData: "Sorry, Het was niet mogelijk om de resultaten in te lezen omdat er blijkbaar een fout in het bestand is: '$$MESSAGE$$'.", 
    LoadFailedUnrecognisedData: "Sorry, Het was niet mogelijk om de resultaten in te lezen.  De data zijn in een niet ondersteund formaat.", 
    LoadFailedStatusNotSuccess: "Sorry, Het was niet mogelijk om de resultaten in te lezen.  De status van het verzoek was '$$STATUS$$'.", 
    LoadFailedReadError: "Het was niet mogelijk om de resultaten in te lezen.  De foutcode van de server was '$$ERROR$$'.", 
      
    // Chart popups. 
      
    SelectedClassesPopupHeader: "Geselecteerde routes", 
    SelectedClassesPopupPlaceholderTeams: "Geen teams", 
      
    // Placeholder text shown when the Selected classes dialog is empty, 
    // because no results registered a split for the control, or those 
    // that did only registered a dubious split. 
    SelectedClassesPopupPlaceholder: "Geen deelnemers", 
      
    // Header for the 'Fastest leg time' popup dialog. 
    FastestLegTimePopupHeader: "Snelste tijd $$START$$ tot $$END$$", 
  
    // Header for the nearby-results dialog on the race graph. 
    NearbyCompetitorsPopupHeader: "$$START$$ - $$END$$: $$CONTROL$$", 
      
    // Placeholder text shown in the nearby-results dialog on the race
    // graph when there aren't any competitors or teams visiting the control
    // within the +/- 2 minute window.
    NoNearbyCompetitors: "Geen deelnemers",
    NoNearbyTeams: "Geen teams in de buurt",
    
    // Link that appears at the top and opens SplitsBrowser with the settings
    // (selected classes, results, comparison, chart type, etc.) that are
    // currently shown.
    DirectLink: "Link",
    DirectLinkToolTip: "Linkt naar een URL die SplitsBrowser opent met de huidige weergave",
    
    // The placeholder text shown in the result-list filter box when no
    // text has been entered into this box.
    CompetitorListFilter: "Filter",
    
    // Labels that appear beside a result on the Results Table to indicate
    // that they did not start, did not finish, or were disqualified.
    DidNotStartShort: "dns",
    DidNotFinishShort: "dnf",
    DisqualifiedShort: "dsq",
    
    // Placeholder message shown inside the result list if all competitors or teams
    // in the class did not start.
    NoCompetitorsStarted: "Geen deelnemers gestart",
    NoTeamsStarted: "Geen teams gestart",
    
    // Label of the language-selector control.
    LanguageSelectorLabel: "Taal:",
    
    // Label that appears beside a result on the Results Table to indicate
    // that they were over the maximum time.
    OverMaxTimeShort: "buiten de tijd",

    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show and also a filter is active.
    RaceGraphNoCrossingRunnersFiltered: "$$NAME$$ heeft geen andere lopers gepasseerd (binnen het actieve filter).",
   
    // Tooltip of the warning-triangle shown along the top if warnings were
    // issued reading in the file.
    WarningsTooltip: "Het is niet gelukt om alle gegevens van dit evenement in te lezen. Één of meer deelnemers of klassen kunnen ontbreken. Klik voor meer details.",
    
    // Options in the leg-selector control when viewing results for a team.
    LegSelectorLabel: "Been: ",
    ShowAllLegs: "Alle",
    ShowLeg: "Been $$LEG_NUMBER$$"
};