export interface Team {
  id: string;
  name: string;
  logo: string; 
  attack: number;
  defense: number;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  status: 'UPCOMING' | 'FINISHED';
  odds: {
    [BetType.ONE_X_TWO]: {
      'Casa': number;
      'Pareggio': number;
      'Trasferta': number;
    };
  };
}

export enum BetType {
  ONE_X_TWO = '1X2',
  EXACT_SCORE = 'Risultato Esatto',
  OVER_UNDER = 'Over/Under 2.5',
}

export interface Bet {
  id: string;
  selections: BetSelection[];
  stake: number;
  odds: number; // For singles, it's the selection odds. for multiples, it's the combined odds.
  status: 'ACTIVE' | 'WON' | 'LOST';
}

export interface BetSelection {
  match: Match;
  betType: BetType;
  selection: string;
  odds: number;
}