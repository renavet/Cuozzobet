
import { Team } from '../types';

const GOAL_CHANCES = 15; // Number of scoring opportunities per team in a match

const calculateGoalProbability = (attack: number, defense: number): number => {
  const ratingDifference = attack - defense;
  // Base probability of 10%, adjusted by the rating difference.
  // The curve makes it so that large differences have a greater effect.
  const probability = 0.1 + (Math.tanh(ratingDifference / 25) * 0.15);
  return Math.max(0.05, Math.min(0.4, probability)); // Clamp between 5% and 40%
};

export const simulateMatch = (homeTeam: Team, awayTeam: Team): { homeScore: number; awayScore: number } => {
  let homeScore = 0;
  let awayScore = 0;

  const homeGoalProbability = calculateGoalProbability(homeTeam.attack, awayTeam.defense);
  const awayGoalProbability = calculateGoalProbability(awayTeam.attack, homeTeam.defense);

  for (let i = 0; i < GOAL_CHANCES; i++) {
    if (Math.random() < homeGoalProbability) {
      homeScore++;
    }
    if (Math.random() < awayGoalProbability) {
      awayScore++;
    }
  }

  return { homeScore, awayScore };
};
