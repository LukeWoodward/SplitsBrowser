/*
 *  Messages - PT Portuguese messages for SplitsBrowser
 *  
 *  Direitos Autorais (C) 2000-2014 Dave Ryder, Reinhard Balling,
 *                                  Andris Strazdins, Ed Nash, Luke Woodward,
 *                                  Robert Marique
 *
 * Este programa é software livre; você pode redistribuí-lo e/ou modificá-lo
 * sob os termos da GNU General Public License conforme publicada pela
 * Free Software Foundation; tanto a versão 2 da Licença, ou (a seu critério)
 * qualquer versão posterior.
 *
 * Este programa é distribuído na esperança que será útil, mas SEM NENHUMA
 * GARANTIA; sem mesmo a garantia implícita de COMERCIALIZAÇÃO ou ADEQUAÇÃO
 * A UM DETERMINADO PROPÓSITO. Consulte a GNU General Public License para
 * obter mais detalhes.
 *
 * Você deve ter recebido uma cópia da GNU General Public License junto com
 * este programa; se não, escreva para a Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 EUA.
 */
SplitsBrowser.Messages.pt_br = {

    ApplicationVersion: "SplitsBrowser - Versão $$VERSION$$",
    Language: "Portugues-BR",
    
    MispunchedShort: "mp",
    NonCompetitiveShort: "n/c",
    
    StartName: "Partida",
    ControlName: "Prisma $$CODE$$",
    FinishName: "Chegada",

    // O Início e o Termino, como eles aparecem no topo da tabela.
    StartNameShort: "I",
    FinishNameShort: "F",
    
    // Button labels.
    SelectAllCompetitors: "Todos",
    SelectNoCompetitors: "Nenhum",
    SelectCrossingRunners: "Crossing runners",
    
    LowerXAxisChartLabel: "Tempo (min)",

    // Chart type names and Y-axis labels.
    SplitsGraphChartType: "Splits graph",
    SplitsGraphYAxisLabel: "Tempo (min)",
    RaceGraphChartType: "Race graph",
    RaceGraphYAxisLabel: "Tempo",
    PositionAfterLegChartType: "Posição após pernada",
    SplitPositionChartType: "Split position",
    PositionYAxisLabel: "Posição", // Partilhada entre a "Posição após pernada" e split-position.
    PercentBehindChartType: "Percent behind",
    PercentBehindYAxisLabel: "Percent behind",
    ResultsTableChartType: "Tabela de resultados",
    
    ChartTypeSelectorLabel: "Visão: ",
    
    ClassSelectorLabel: "Percurso: ",
    AdditionalClassSelectorLabel: "e",
    NoClassesLoadedPlaceholder: "[Não há percursos carregadas]",
    
    // Espaço reservado mostrado quando os percursos adicionais estão
    // disponíveis para ser selecionado, mas nenhum foi selecionado.
    NoAdditionalClassesSelectedPlaceholder: "<selecione>",

    ComparisonSelectorLabel: "Compare com ",
    CompareWithWinner: "Vencedor",
    CompareWithFastestTime: "Melhor tempo",
    CompareWithFastestTimePlusPercentage: "Melhor tempo + $$PERCENT$$%",
    CompareWithAnyRunner: "Qualquer corredor...",
    CompareWithAnyRunnerLabel: "Corredor: ",
    // Mensagem de aviso mostrada ao usuário quando uma opção de comparação
    // não pode ser escolhida porque o percurso não tem vencedor.
    CannotCompareAsNoWinner: "Não posso comparar com '$$OPTION$$' porque nenhum concorrente deste percurso concluir a prova.",
    
    // Etiqueta da caixa de seleção que mostra os dados originais, em oposição aos
    // dados 'reparados'. Isso só aparece se os dados que precisão de reparos
    // foi carregado.
    ShowOriginalData: "Mostrar dados originais",
  
    // Dica da caixa de seleção 'Mostrar original'. Aparece quando SplitsBrowser
    // deduz que alguns dos totalizadores mostrados são irreais.
    ShowOriginalDataTooltip: "SplitsBrowser removeu alguns dos tempos a partir dos dados do(s) percurso(s) selecionado(s), acreditando que estes tempos não são reais. " +
                             "Use esta caixa de seleção para controlar se exibe ou não os dados originais.",
    
    StatisticsTotalTime: "Tempo Total",
    StatisticsSplitTime: "Split time",
    StatisticsBehindFastest: "Atrás do mais rápido",
    StatisticsTimeLoss: "Tempo perdido",
    
    ResultsTableHeaderSingleControl: "1 prisma",
    ResultsTableHeaderMultipleControls: "$$NUM$$ prismas",
    ResultsTableHeaderCourseLength: "$$DISTANCE$$km",
    ResultsTableHeaderClimb: "$$CLIMB$$m",
    
    ResultsTableHeaderControlNumber: "#",
    ResultsTableHeaderName: "Nome",
    ResultsTableHeaderTime: "Tempo",
    
    // Mensagem de alerta aparece quando você clica em 'Crossing runners' mas não existe
    // crossing runners para mostrar.
    RaceGraphNoCrossingRunners: "$$NAME$$ has no crossing runners.",
    RaceGraphDisabledAsStartTimesMissing: "O Gráfico da corrida não pode ser mostrado porque os horários de partida dos concorrentes estão faltando.",
    
    LoadFailedHeader: "SplitsBrowser \u2013 Error",
    LoadFailedInvalidData: "Desculpe, não foi possível ler os dados de resultados, os dados parecem ser inválidos: '$$MESSAGE$$'.",
    LoadFailedUnrecognisedData: "Desculpe, não foi possível ler os dados de resultados. Os dados não parecem estar em um formato reconhecido.",
    LoadFailedStatusNotSuccess: "Desculpe, não foi possível ler os dados de resultados. O estado da solicitação era '$$STATUS$$'.",
    LoadFailedReadError: "Desculpe, não foi possível carregar os dados dos resultados. A mensagem de erro retornado do servidor foi '$$ERROR$$'.",
    
    // Janelas de diálogo.
    
    SelectedClassesPopupHeader: "Percurso selecionado",
    
    // Espaço reservado mostrado quando lista de percurso selecionado está vazia,
    // porque não tem competidores registrado na pernada para o controle, ou que
    // apenas tinha apresentado pernada duvidosa.
    SelectedClassesPopupPlaceholder: "Sem compeditores",
    
    // Cabeçalho para janela 'Tempo da pernada mais rápida'.
    FastestLegTimePopupHeader: "Tempo da pernada mais rápida $$START$$ até $$END$$",

    // Cabeçalho dos concorrentes próximas diálogo no gráfico de corrida.
    NearbyCompetitorsPopupHeader: "$$START$$ - $$END$$: $$CONTROL$$",
    
    // Espaço reservado mostrado nos próximos concorrentes de diálogo no gráfico de
    // corrida quando não há quaisquer concorrentes que visitam o controle dentro do
    // +/- janela de 2 minutos.
    NoNearbyCompetitors: "Sem competidores",
    
    // Link that appears at the top and opens SplitsBrowser with the settings
    // (selected classes, competitors, comparison, chart type, etc.) that are
    // currently shown.
    DirectLink: "Atalho",
    DirectLinkToolTip: "Atalho para o endereço que abre o SplitsBrowser com as configurações atuais",
    
    // The placeholder text shown in the competitor-list filter box when no
    // text has been entered into this box.
    CompetitorListFilter: "Filtro",
    
    // Labels that appear beside a competitor on the Results Table to indicate
    // that they did not start, did not finish, or were disqualified.
    DidNotStartShort: "np",
    DidNotFinishShort: "dnf",
    DisqualifiedShort: "dsq",
    
    // Placeholder message shown inside the competitor list if all competitors
    // in the class did not start.
    NoCompetitorsStarted: "Nenhum atleta partiu",
    
    // Label of the language-selector control.
    // TO BE TRANSLATED?
    LanguageSelectorLabel: "Language:",
    
    // Label that appears beside a competitor on the Results Table to indicate
    // that they were over the maximum time.
    // TO BE TRANSLATED
    OverMaxTimeShort: "over max time",

    // Alert message shown when you click 'Crossing runners' but there are no
    // crossing runners to show and also a filter is active.
    // TO BE TRANSLATED
    RaceGraphNoCrossingRunnersFiltered: "$$NAME$$ has no crossing runners among the filtered competitors.",
    
    // Tooltip of the warning-triangle shown along the top if warnings were
    // issued reading in the file.
    // TO BE TRANSLATED
    WarningsTooltip: "It was not possible to read all of the data for this event.  One or more competitors or classes may have been omitted.  Click for more details."
};