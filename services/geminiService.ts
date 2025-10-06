
import { GoogleGenAI } from "@google/genai";
import { Match } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateMatchCommentary = async (match: Match): Promise<string> => {
  if (!API_KEY) {
    return "Una partita davvero memorabile si è svolta oggi in campo, con entrambe le squadre che hanno mostrato grande spirito.";
  }

  const prompt = `Sei un commentatore di calcio drammatico e divertente. Scrivi un breve riassunto di un paragrafo di una partita tra ${match.homeTeam.name} e ${match.awayTeam.name} terminata con il punteggio di ${match.homeScore} - ${match.awayScore}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Errore nella generazione del commento:", error);
    return "Il commentatore è senza parole! Che partita!";
  }
};