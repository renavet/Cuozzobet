import React, { useState, useEffect, useCallback } from 'react';
import { Team, Match, Bet, BetType, BetSelection } from './types';
import { TEAMS, INITIAL_CREDITS, FREE_CREDITS_AMOUNT } from './constants';
import { simulateMatch } from './services/matchSimulator';
import Disclaimer from './components/Disclaimer';
import BetSlip from './components/BetSlip';

// Helper function to generate a unique ID
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- Odds Generation Logic ---
const generateOddsForMatch = (homeTeam: Team, awayTeam: Team) => {
    // 1. Calculate base probabilities based on team stats
    const ratingDiff = (homeTeam.attack + homeTeam.defense) - (awayTeam.attack + awayTeam.defense);

    // Base probabilities, assuming a balanced match with slight home advantage
    let probHome = 0.42;
    let probDraw = 0.28;
    let probAway = 0.30;

    // Adjust probabilities based on the rating difference.
    const adjustment = ratingDiff / 150.0;
    probHome += adjustment;
    probAway -= adjustment;

    // Ensure probabilities are within a reasonable range
    probHome = Math.max(0.15, Math.min(0.85, probHome));
    probAway = Math.max(0.10, Math.min(0.80, probAway));
    
    // Normalize probabilities so they sum to 1
    const totalProb = probHome + probDraw + probAway;
    probHome /= totalProb;
    probDraw /= totalProb;
    probAway /= totalProb;
    
    // 2. Add a bookmaker's margin (e.g., ~7%)
    const margin = 1.07;
    probHome *= margin;
    probDraw *= margin;
    probAway *= margin;

    // 3. Convert probabilities to odds (odds = 1 / probability)
    const oddsHome = 1 / probHome;
    const oddsDraw = 1 / probDraw;
    const oddsAway = 1 / probAway;

    // 4. Format the odds to two decimal places and ensure a minimum value
    return {
        'Casa': Math.max(1.15, parseFloat(oddsHome.toFixed(2))),
        'Pareggio': Math.max(1.80, parseFloat(oddsDraw.toFixed(2))),
        'Trasferta': Math.max(1.15, parseFloat(oddsAway.toFixed(2))),
    };
};


// Translation mappings
const matchStatusDisplay = {
    UPCOMING: 'IN ARRIVO',
    FINISHED: 'TERMINATA',
};

const betStatusDisplay = {
    ACTIVE: 'ATTIVA',
    WON: 'VINTA',
    LOST: 'PERSA',
};

// --- Sub-components defined outside App to prevent re-renders ---

const Header: React.FC<{ credits: number; onGetCredits: () => void }> = ({ credits, onGetCredits }) => (
  <header className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl shadow-lg flex justify-between items-center mb-6 border border-gray-700 sticky top-4 z-10">
    <h1 className="text-3xl font-bold text-indigo-400 tracking-wider">Cuozzo<span className="text-white">Bet</span></h1>
    <div className="text-right">
      <p className="text-sm text-gray-400">Saldo</p>
      <p className="text-2xl font-semibold text-green-400">{credits.toLocaleString()} C</p>
      {credits < 100 && (
         <button onClick={onGetCredits} className="text-xs bg-green-600 hover:bg-green-700 px-2 py-1 rounded mt-1">Ottieni Crediti Gratis</button>
      )}
    </div>
  </header>
);

const MatchCard: React.FC<{
  match: Match;
  onToggleSelection: (selection: BetSelection) => void;
  betSlip: BetSelection[];
}> = ({ match, onToggleSelection, betSlip }) => {
    
    const isSelected = (betType: BetType, selection: string) => {
        return betSlip.some(s => s.match.id === match.id && s.betType === betType && s.selection === selection);
    };

    const renderOddsButton = (betType: BetType, selection: string, oddsValue: number) => {
        const selected = isSelected(betType, selection);
        return (
            <button
                onClick={() => onToggleSelection({ match, betType, selection, odds: oddsValue })}
                className={`flex-1 p-2 rounded-md transition-all text-center ${selected ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
                <span className="text-xs text-gray-300">{selection}</span>
                <span className="block font-bold text-yellow-400">{oddsValue.toFixed(2)}</span>
            </button>
        );
    };
    
    return (
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-between shadow-md border border-gray-700 transition-colors">
            <div className="w-full text-center mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${match.status === 'UPCOMING' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                    {matchStatusDisplay[match.status]}
                </span>
            </div>
            <div className="w-full flex items-center justify-around text-center">
                <div className="w-1/3 flex flex-col items-center">
                    <span className="text-4xl">{match.homeTeam.logo}</span>
                    <span className="font-semibold mt-1">{match.homeTeam.name}</span>
                </div>
                <div className="w-1/3">
                    {match.status === 'UPCOMING' ? (
                        <span className="text-2xl font-bold text-gray-500">vs</span>
                    ) : (
                        <span className="text-4xl font-bold">{match.homeScore} - {match.awayScore}</span>
                    )}
                </div>
                <div className="w-1/3 flex flex-col items-center">
                    <span className="text-4xl">{match.awayTeam.logo}</span>
                    <span className="font-semibold mt-1">{match.awayTeam.name}</span>
                </div>
            </div>
            {match.status === 'UPCOMING' && (
                <div className="mt-4 w-full">
                    <p className="text-center text-sm text-indigo-400 mb-2 font-semibold">Risultato Partita (1X2)</p>
                    <div className="flex justify-between items-center gap-2">
                        {renderOddsButton(BetType.ONE_X_TWO, 'Casa', match.odds[BetType.ONE_X_TWO]['Casa'])}
                        {renderOddsButton(BetType.ONE_X_TWO, 'Pareggio', match.odds[BetType.ONE_X_TWO]['Pareggio'])}
                        {renderOddsButton(BetType.ONE_X_TWO, 'Trasferta', match.odds[BetType.ONE_X_TWO]['Trasferta'])}
                    </div>
                </div>
            )}
        </div>
    );
};


const BetCard: React.FC<{ bet: Bet }> = ({ bet }) => {
    const statusStyles = {
        ACTIVE: 'border-blue-500',
        WON: 'border-green-500',
        LOST: 'border-red-500',
    };
    const statusText = {
        ACTIVE: 'text-blue-400',
        WON: 'text-green-400',
        LOST: 'text-red-400',
    };
    const potentialWinnings = (bet.stake * bet.odds).toFixed(0);
    const isMultiple = bet.selections.length > 1;

    return (
        <div className={`bg-gray-800 rounded-lg p-3 border-l-4 ${statusStyles[bet.status]}`}>
            <div className="flex justify-between items-center text-sm">
                <span>{isMultiple ? `Multipla (${bet.selections.length} Selezioni)` : `${bet.selections[0].match.homeTeam.name} vs ${bet.selections[0].match.awayTeam.name}`}</span>
                <span className={`font-bold ${statusText[bet.status]}`}>{betStatusDisplay[bet.status]}</span>
            </div>
            
            {isMultiple ? (
                 <details className="mt-1 cursor-pointer">
                    <summary className="font-bold text-lg list-none">
                        Dettagli Scommessa <span className="text-yellow-400 text-base">@{bet.odds.toFixed(2)}</span>
                    </summary>
                    <div className="pl-4 mt-2 space-y-1 border-l-2 border-gray-600 ml-1">
                        {bet.selections.map((sel, index) => (
                             <p key={index} className="text-xs text-gray-300">{sel.match.homeTeam.name} vs {sel.match.awayTeam.name}: <span className="font-semibold text-white">{sel.selection}</span> <span className="text-yellow-400">@{sel.odds.toFixed(2)}</span></p>
                        ))}
                    </div>
                </details>
            ) : (
                <div className="font-bold text-lg my-1">{bet.selections[0].selection} <span className="text-yellow-400 text-base">@{bet.odds.toFixed(2)}</span></div>
            )}

            <div className="text-xs text-gray-400 flex justify-between mt-2">
                <span>Puntata: {bet.stake} C</span>
                {bet.status === 'WON' ? <span>Vinto: {potentialWinnings} C</span> : <span>Vincita Potenziale: {potentialWinnings} C</span>}
            </div>
        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [credits, setCredits] = useState<number>(INITIAL_CREDITS);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [betSlip, setBetSlip] = useState<BetSelection[]>([]);
  const [loading, setLoading] = useState(false);

  const generateMatches = useCallback(() => {
    const upcomingMatches: Match[] = [];
    const teamsToShuffle = [...TEAMS];

    // Fisher-Yates (aka Knuth) Shuffle for better randomness
    for (let i = teamsToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teamsToShuffle[i], teamsToShuffle[j]] = [teamsToShuffle[j], teamsToShuffle[i]];
    }

    for (let i = 0; i < teamsToShuffle.length; i += 2) {
      if (teamsToShuffle[i + 1]) {
        const homeTeam = teamsToShuffle[i];
        const awayTeam = teamsToShuffle[i + 1];
        const matchOdds = generateOddsForMatch(homeTeam, awayTeam);

        upcomingMatches.push({
          id: generateId(),
          homeTeam,
          awayTeam,
          status: 'UPCOMING',
          odds: {
            [BetType.ONE_X_TWO]: matchOdds,
          }
        });
      }
    }
    setMatches(upcomingMatches);
  }, []);

  useEffect(() => {
    generateMatches();
  }, [generateMatches]);

  const handleToggleSelection = (selectionToAdd: BetSelection) => {
    setBetSlip(prev => {
      const existingIndex = prev.findIndex(
        s => s.match.id === selectionToAdd.match.id && s.betType === selectionToAdd.betType && s.selection === selectionToAdd.selection
      );

      if (existingIndex > -1) {
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        const filtered = prev.filter(
            s => !(s.match.id === selectionToAdd.match.id && s.betType === selectionToAdd.betType)
        );
        return [...filtered, selectionToAdd];
      }
    });
  };

  const handleRemoveSelectionFromSlip = (selectionToRemove: BetSelection) => {
       setBetSlip(prev => prev.filter(s => !(
           s.match.id === selectionToRemove.match.id && 
           s.betType === selectionToRemove.betType && 
           s.selection === selectionToRemove.selection
       )));
  };

  const getSelectionId = (selection: {match: Match, betType: BetType, selection: string}) => `${selection.match.id}-${selection.betType}-${selection.selection}`;

  const handlePlaceBetsFromSlip = (mode: 'SINGLE' | 'MULTIPLE', stakes: { singles?: Record<string, number>, multiple?: number }) => {
    if (mode === 'SINGLE' && stakes.singles) {
        let totalStake = 0;
        const newBets: Bet[] = [];
        const stakesMap = stakes.singles;
        
        betSlip.forEach(selection => {
          const id = getSelectionId(selection);
          const stakeAmount = stakesMap[id];
          if (stakeAmount && stakeAmount > 0) {
            totalStake += stakeAmount;
            newBets.push({
              id: generateId(),
              selections: [selection],
              odds: selection.odds,
              stake: stakeAmount,
              status: 'ACTIVE',
            });
          }
        });

        if (totalStake <= credits) {
          setCredits(prev => prev - totalStake);
          setBets(prev => [...newBets, ...prev]);
          setBetSlip([]);
        } else {
            alert("Errore: crediti insufficienti.");
        }
    } else if (mode === 'MULTIPLE' && stakes.multiple) {
        const totalStake = stakes.multiple;
        if (totalStake > 0 && totalStake <= credits) {
            const totalOdds = betSlip.reduce((acc, sel) => acc * sel.odds, 1);
            const newBet: Bet = {
                id: generateId(),
                selections: [...betSlip],
                stake: totalStake,
                odds: totalOdds,
                status: 'ACTIVE',
            };
            setCredits(prev => prev - totalStake);
            setBets(prev => [newBet, ...prev]);
            setBetSlip([]);
        } else {
             alert("Errore: puntata non valida o crediti insufficienti.");
        }
    }
  };
  
  const handleClearSlip = () => setBetSlip([]);

  const handleSimulate = () => {
    setLoading(true);

    const upcomingMatches = matches.filter(m => m.status === 'UPCOMING');
    if (upcomingMatches.length === 0) {
        setLoading(false);
        return;
    }

    const newFinishedMatches = upcomingMatches.map((match) => {
        const { homeScore, awayScore } = simulateMatch(match.homeTeam, match.awayTeam);
        return { ...match, status: 'FINISHED' as const, homeScore, awayScore };
    });

    const updatedMatches = matches.map(m => {
        const finishedVersion = newFinishedMatches.find(fm => fm.id === m.id);
        return finishedVersion || m;
    });
    
    setMatches(updatedMatches);
    
    // --- New Bet Settlement Logic ---
    let totalWinnings = 0;
    const betsWithNewStatus = bets.map(bet => {
        if (bet.status !== 'ACTIVE') return bet;

        const selectionOutcomes = bet.selections.map(selection => {
            const match = updatedMatches.find(m => m.id === selection.match.id);
            if (!match || match.status === 'UPCOMING') return 'PENDING';

            const { homeScore, awayScore } = match;
            if (homeScore === undefined || awayScore === undefined) return 'PENDING';

            let legWon = false;
            switch (selection.betType) {
                case BetType.ONE_X_TWO:
                    const result = homeScore > awayScore ? 'Casa' : homeScore < awayScore ? 'Trasferta' : 'Pareggio';
                    legWon = selection.selection === result;
                    break;
                case BetType.EXACT_SCORE:
                    legWon = selection.selection === `${homeScore}-${awayScore}`;
                    break;
                case BetType.OVER_UNDER:
                    const totalGoals = homeScore + awayScore;
                    if (selection.selection === 'Over') legWon = totalGoals > 2.5;
                    if (selection.selection === 'Under') legWon = totalGoals < 2.5;
                    break;
            }
            return legWon ? 'WON' : 'LOST';
        });

        if (selectionOutcomes.includes('LOST')) {
            return { ...bet, status: 'LOST' as const };
        }
        if (selectionOutcomes.includes('PENDING')) {
            return bet; // Remain ACTIVE
        }
        
        // If we reach here, all outcomes are 'WON'
        totalWinnings += bet.stake * bet.odds;
        return { ...bet, status: 'WON' as const };
    });

    setBets(betsWithNewStatus);
    if (totalWinnings > 0) {
        setCredits(prev => prev + totalWinnings);
    }

    setLoading(false);
  };
  
  const handleGetFreeCredits = () => {
      if (credits < 100) {
          setCredits(prev => prev + FREE_CREDITS_AMOUNT);
      }
  };

  const activeBets = bets.filter(b => b.status === 'ACTIVE');
  const settledBets = bets.filter(b => b.status !== 'ACTIVE');
  const upcomingMatches = matches.filter(m => m.status === 'UPCOMING');
  
  return (
    <div className="max-w-7xl mx-auto p-4 font-sans">
      <Header credits={credits} onGetCredits={handleGetFreeCredits}/>
      <main>
        <Disclaimer />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Partite in Arrivo</h2>
              {upcomingMatches.length > 0 ? (
                <button onClick={handleSimulate} disabled={loading || activeBets.length === 0} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  {loading ? 'Simulazione...' : 'Simula Turno'}
                </button>
              ) : (
                <button onClick={generateMatches} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Nuove Partite
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.filter(m => m.status === 'UPCOMING').map(match => (
                    <MatchCard key={match.id} match={match} onToggleSelection={handleToggleSelection} betSlip={betSlip} />
                ))}
            </div>
             {matches.filter(m => m.status === 'UPCOMING').length === 0 && (
                <div className="text-center py-10 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Nessuna partita in arrivo. Clicca "Nuove Partite" per generare un nuovo turno.</p>
                </div>
            )}
          </div>
          <div className="space-y-6">
            <BetSlip 
                selections={betSlip}
                onRemoveSelection={handleRemoveSelectionFromSlip}
                onPlaceBets={handlePlaceBetsFromSlip}
                onClear={handleClearSlip}
                credits={credits}
            />
            <div>
                <h2 className="text-2xl font-semibold mb-4">Scommesse Attive ({activeBets.length})</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {activeBets.length > 0 ? activeBets.map(bet => <BetCard key={bet.id} bet={bet} />) : <p className="text-gray-500 text-sm">Nessuna scommessa attiva.</p>}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4">Cronologia Scommesse</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {settledBets.length > 0 ? settledBets.map(bet => <BetCard key={bet.id} bet={bet} />) : <p className="text-gray-500 text-sm">Nessuna scommessa conclusa.</p>}
                </div>
            </div>
          </div>
        </div>
        {matches.filter(m => m.status === 'FINISHED').length > 0 && (
            <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">Partite Concluse</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.filter(m => m.status === 'FINISHED').map(match => (
                        <MatchCard key={match.id} match={match} onToggleSelection={() => {}} betSlip={[]} />
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;