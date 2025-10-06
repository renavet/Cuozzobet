
import React, { useState } from 'react';
import { Match, BetType } from '../types';

interface BettingModalProps {
  match: Match;
  onClose: () => void;
  onPlaceBet: (betType: BetType, selection: string, odds: number, stake: number) => void;
  credits: number;
}

const BettingModal: React.FC<BettingModalProps> = ({ match, onClose, onPlaceBet, credits }) => {
  const [stake, setStake] = useState<string>('');
  const [selectedBet, setSelectedBet] = useState<{ betType: BetType; selection: string; odds: number } | null>(null);

  const handlePlaceBet = () => {
    const stakeAmount = parseInt(stake, 10);
    if (selectedBet && stakeAmount > 0 && stakeAmount <= credits) {
      onPlaceBet(selectedBet.betType, selectedBet.selection, selectedBet.odds, stakeAmount);
      onClose();
    }
  };

  const stakeAsNumber = parseInt(stake, 10) || 0;
  const potentialWinnings = selectedBet ? (stakeAsNumber * selectedBet.odds).toFixed(2) : '0.00';

  // Simplified odds for demonstration
  const odds = {
    [BetType.ONE_X_TWO]: { 'Casa': 2.10, 'Pareggio': 3.40, 'Trasferta': 2.90 },
    [BetType.OVER_UNDER]: { 'Over': 1.85, 'Under': 1.95 },
    [BetType.EXACT_SCORE]: {
      '1-0': 7.0, '2-0': 9.0, '2-1': 8.0,
      '0-1': 8.5, '0-2': 12.0, '1-2': 9.5,
      '0-0': 10.0, '1-1': 6.5, '2-2': 14.0,
    }
  };

  const renderBettingOption = (betType: BetType, selection: string, oddsValue: number) => {
    const isSelected = selectedBet?.betType === betType && selectedBet?.selection === selection;
    return (
      <button
        key={`${betType}-${selection}`}
        onClick={() => setSelectedBet({ betType, selection, odds: oddsValue })}
        className={`w-full text-left p-3 rounded-lg transition-all ${isSelected ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-gray-700 hover:bg-gray-600'}`}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium">{selection}</span>
          <span className="font-bold text-lg text-yellow-400">{oddsValue.toFixed(2)}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">{match.homeTeam.name} vs {match.awayTeam.name}</h2>
            <p className="text-sm text-gray-400">Piazza la tua scommessa virtuale</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
          {/* 1X2 */}
          <div className="space-y-2">
            <h3 className="font-semibold text-indigo-400 mb-2">Risultato Partita (1X2)</h3>
            {renderBettingOption(BetType.ONE_X_TWO, 'Casa', odds[BetType.ONE_X_TWO]['Casa'])}
            {renderBettingOption(BetType.ONE_X_TWO, 'Pareggio', odds[BetType.ONE_X_TWO]['Pareggio'])}
            {renderBettingOption(BetType.ONE_X_TWO, 'Trasferta', odds[BetType.ONE_X_TWO]['Trasferta'])}
          </div>

          {/* Over/Under */}
          <div className="space-y-2">
            <h3 className="font-semibold text-indigo-400 mb-2">Over/Under 2.5 Goal</h3>
            {renderBettingOption(BetType.OVER_UNDER, 'Over', odds[BetType.OVER_UNDER]['Over'])}
            {renderBettingOption(BetType.OVER_UNDER, 'Under', odds[BetType.OVER_UNDER]['Under'])}
          </div>

          {/* Exact Score */}
          <div className="md:col-span-2 space-y-2">
            <h3 className="font-semibold text-indigo-400 mb-2">{BetType.EXACT_SCORE}</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(odds[BetType.EXACT_SCORE]).map(([score, odd]) => renderBettingOption(BetType.EXACT_SCORE, score, odd))}
            </div>
          </div>
        </div>

        {selectedBet && (
          <div className="p-6 bg-gray-900/50 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">La tua selezione:</p>
                <p className="font-bold text-lg">{selectedBet.selection} <span className="text-yellow-400">@{selectedBet.odds.toFixed(2)}</span></p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="Puntata"
                  className="bg-gray-700 border border-gray-600 rounded-md p-2 w-32 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  min="1"
                  max={credits}
                />
                <button
                  onClick={handlePlaceBet}
                  disabled={!stakeAsNumber || stakeAsNumber <= 0 || stakeAsNumber > credits}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                  Piazza Scommessa
                </button>
              </div>
            </div>
            {stakeAsNumber > 0 && <p className="text-right text-sm mt-2 text-gray-300">Vincita Potenziale: <span className="font-bold text-green-400">{potentialWinnings} C</span></p>}
             {stakeAsNumber > credits && <p className="text-right text-sm mt-2 text-red-400">Crediti insufficienti.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingModal;