export type TeamId = "A" | "B";

/** UI / правила раунда по шагам */
export type Phase =
  | "hidden"
  | "preview"
  | "guessing"
  | "locked"
  | "sideGuess"
  | "reveal"
  | "scoring"
  | "nextRound";

export type SideGuess = "left" | "right";

export type GameState = {
  phase: Phase;
  round: number;
  /** После закрытия превью — можно переходить к фазе угадывания */
  seenTargetThisRound: boolean;
  /** Команда психика (она же ставит стрелку после подсказки) */
  psychicTeam: TeamId;
  targetAngle: number;
  needleAngle: number;
  /** После фиксации ответа */
  lockedNeedleAngle: number | null;
  spectrumLeft: string;
  spectrumRight: string;
  opponentSideGuess: SideGuess | null;
  scores: Record<TeamId, number>;
  /** Очки, начисленные в последнем завершённом подсчёте */
  lastRound: {
    mainTeam: TeamId;
    mainPoints: number;
    opponentTeam: TeamId;
    opponentSideCorrect: boolean;
    opponentPoints: number;
  } | null;
};

export const INITIAL_STATE: GameState = {
  phase: "hidden",
  round: 1,
  seenTargetThisRound: false,
  psychicTeam: "A",
  targetAngle: 90,
  needleAngle: 90,
  lockedNeedleAngle: null,
  spectrumLeft: "",
  spectrumRight: "",
  opponentSideGuess: null,
  scores: { A: 0, B: 0 },
  lastRound: null,
};
