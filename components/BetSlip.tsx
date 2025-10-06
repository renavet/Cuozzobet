import React, { useState, useMemo, useEffect } from 'react';
import { BetSelection } from '../types';

interface BetSlipProps {
  selections: BetSelection[];
  onRemoveSelection: (selection: BetSelection) => void;
  onPlaceBets: (mode: 'SINGLE' | 'MULTIPLE', stakes: { singles?: Record<string, number>, multiple?: number }) => void;
  onClear: () => void;
  credits: number;
}

type BetMode = 'SINGLE' | 'MULTIPLE';

const getSelectionId = (selection: BetSelection) => `${selection.match.id}-${selection.betType}-${selection.selection}`;

const BetSlip: React.FC<BetSlipProps> = ({ selections, onRemoveSelection, onPlaceBets, onClear, credits }) => {
  const [mode, setMode] = useState<BetMode>('SINGLE');
  const [stakes, setStakes] = useState<Record<string, string>>({});
  const [multipleStake, setMultipleStake] = useState<string>('');
  
  // Reset states when selections are cleared
  useEffect(() => {
    if (selections.length === 0) {
      setStakes({});
      setMultipleStake('');
      setMode('SINGLE');
    }
  }, [selections]);

  const handleStakeChange = (selectionId: string, value: string) => {
    if (/^\d*$/.test(value)) {
      setStakes(prev => ({ ...prev, [selectionId]: value }));
    }
  };
  
  const handleMultipleStakeChange = (value: string) => {
    if (/^\d*$/.test(value)) {
      setMultipleStake(value);
    }
  };

  const { totalSingleStake, parsedSingleStakes, hasInvalidSingleStake } = useMemo(() => {
    let total = 0;
    const parsed: Record<string, number> = {};
    let hasInvalid = false;
    for (const selection of selections) {
      const id = getSelectionId(selection);
      const stakeValue = parseInt(stakes[id] || '0', 10);
      if (stakeValue > 0) {
        total += stakeValue;
        parsed[id] = stakeValue;
      }
      if (stakes[id] && stakeValue <= 0) {
          hasInvalid = true;
      }
    }
    return { totalSingleStake: total, parsedSingleStakes: parsed, hasInvalidSingleStake: hasInvalid };
  }, [stakes, selections]);
  
  const { totalOdds, potentialWinnings, parsedMultipleStake } = useMemo(() => {
      const odds = selections.reduce((acc, s) => acc * s.odds, 1);
      const stake = parseInt(multipleStake, 10) || 0;
      const winnings = (stake * odds).toFixed(0);
      return { totalOdds: odds, potentialWinnings: winnings, parsedMultipleStake: stake };
  }, [selections, multipleStake]);

  const canPlaceSingleBets = totalSingleStake > 0 && totalSingleStake <= credits && !hasInvalidSingleStake;
  const canPlaceMultipleBet = parsedMultipleStake > 0 && parsedMultipleStake <= credits;

  const handlePlaceBetsClick = () => {
    if (mode === 'SINGLE') {
        onPlaceBets('SINGLE', { singles: parsedSingleStakes });
    } else {
        onPlaceBets('MULTIPLE', { multiple: parsedMultipleStake });
    }
    setStakes({});
    setMultipleStake('');
  };

  if (selections.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Schedina</h2>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-500 text-sm">Seleziona le quote dalle partite per aggiungerle alla tua schedina.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-2xl font-semibold">Schedina ({selections.length})</h2>
        <button onClick={onClear} className="text-sm text-red-400 hover:text-red-300">Svuota</button>
      </div>

      <div className="p-2">
          <div className="flex bg-gray-900 rounded-md p-1">
              <button onClick={() => setMode('SINGLE')} className={`flex-1 p-2 rounded text-sm font-bold transition-colors ${mode === 'SINGLE' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}>Singole</button>
              <button onClick={() => setMode('MULTIPLE')} className={`flex-1 p-2 rounded text-sm font-bold transition-colors ${mode === 'MULTIPLE' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'}`}>Multipla</button>
          </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto p-4">
        {selections.map(selection => {
          const id = getSelectionId(selection);
          return (
            <div key={id} className="bg-gray-700 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">{selection.match.homeTeam.name} vs {selection.match.awayTeam.name}</p>
                  <p className="font-bold">{selection.selection} <span className="text-yellow-400">@{selection.odds.toFixed(2)}</span></p>
                </div>
                <button onClick={() => onRemoveSelection(selection)} className="text-red-500 hover:text-red-400 text-xl font-bold leading-none">&times;</button>
              </div>
              {mode === 'SINGLE' && (
                <div className="mt-2">
                    <input
                    type="number"
                    placeholder="Puntata"
                    value={stakes[id] || ''}
                    onChange={(e) => handleStakeChange(id, e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-md p-2 w-full text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    min="1"
                    />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-gray-900/50 rounded-b-lg">
        {mode === 'MULTIPLE' && (
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Quota Totale:</span>
                    <span className="font-bold text-yellow-400">@{totalOdds.toFixed(2)}</span>
                </div>
                <input
                  type="number"
                  placeholder="Puntata Totale"
                  value={multipleStake}
                  onChange={(e) => handleMultipleStakeChange(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  min="1"
                />
            </div>
        )}

        {mode === 'SINGLE' && (
            <>
            <div className="flex justify-between text-lg mb-1">
                <span className="font-semibold">Puntata Totale:</span>
                <span className={`font-bold ${totalSingleStake > credits ? 'text-red-400' : 'text-white'}`}>{totalSingleStake} C</span>
            </div>
            {totalSingleStake > credits && <p className="text-right text-sm mt-1 text-red-400">Crediti insufficienti.</p>}
            </>
        )}
        
        {mode === 'MULTIPLE' && (
            <>
            <div className="flex justify-between text-lg mb-1">
                <span className="font-semibold">Vincita Potenziale:</span>
                <span className={`font-bold ${parsedMultipleStake > credits ? 'text-red-400' : 'text-green-400'}`}>{potentialWinnings} C</span>
            </div>
            {parsedMultipleStake > credits && <p className="text-right text-sm mt-1 text-red-400">Crediti insufficienti.</p>}
            </>
        )}

        <button
          onClick={handlePlaceBetsClick}
          disabled={mode === 'SINGLE' ? !canPlaceSingleBets : !canPlaceMultipleBet}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors text-lg"
        >
          {mode === 'SINGLE' ? `Piazza ${Object.keys(parsedSingleStakes).length} Scommesse` : 'Piazza Scommessa'}
        </button>
      </div>
    </div>
  );
};

export default BetSlip;