import {
  type GameState,
  type Phase,
  type SideGuess,
  type TeamId,
  INITIAL_STATE,
} from "./types";
import {
  randomTargetAngle,
  scoreNeedleVsTarget,
  sideGuessIsCorrect,
} from "./scoring";

export type GameAction =
  | { type: "SET_PHASE"; phase: Phase }
  | { type: "SET_TARGET"; angle: number }
  | { type: "RANDOM_TARGET" }
  | { type: "OPEN_PREVIEW" }
  | { type: "CLOSE_PREVIEW" }
  | { type: "BEGIN_GUESSING" }
  | { type: "SET_SPECTRUM"; left: string; right: string }
  | { type: "SET_NEEDLE"; angle: number }
  | { type: "LOCK_ANSWER" }
  | { type: "SET_SIDE_GUESS"; guess: SideGuess }
  | { type: "START_SIDE_GUESS" }
  | { type: "OPEN_REVEAL" }
  | { type: "TO_SCORING" }
  | { type: "TO_NEXT_ROUND_VIEW" }
  | { type: "NEXT_ROUND" }
  | { type: "RESET_GAME" };

function opponentOf(team: TeamId): TeamId {
  return team === "A" ? "B" : "A";
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "RESET_GAME":
      return { ...INITIAL_STATE };

    case "SET_PHASE":
      return { ...state, phase: action.phase };

    case "SET_TARGET":
      return { ...state, targetAngle: clampAngle(action.angle) };

    case "RANDOM_TARGET":
      return { ...state, targetAngle: randomTargetAngle() };

    case "OPEN_PREVIEW":
      if (state.phase !== "hidden") return state;
      return { ...state, phase: "preview" };

    case "CLOSE_PREVIEW":
      if (state.phase !== "preview") return state;
      return { ...state, phase: "hidden", seenTargetThisRound: true };

    case "BEGIN_GUESSING": {
      if (state.phase !== "hidden") return state;
      if (!state.seenTargetThisRound) return state;
      const left = state.spectrumLeft.trim();
      const right = state.spectrumRight.trim();
      if (!left || !right) return state;
      return { ...state, phase: "guessing" };
    }

    case "SET_SPECTRUM":
      return {
        ...state,
        spectrumLeft: action.left,
        spectrumRight: action.right,
      };

    case "SET_NEEDLE":
      if (state.phase !== "guessing") return state;
      return { ...state, needleAngle: clampAngle(action.angle) };

    case "LOCK_ANSWER": {
      if (state.phase !== "guessing") return state;
      const left = state.spectrumLeft.trim();
      const right = state.spectrumRight.trim();
      if (!left || !right) return state;
      return {
        ...state,
        phase: "locked",
        lockedNeedleAngle: state.needleAngle,
      };
    }

    case "SET_SIDE_GUESS":
      if (state.phase !== "sideGuess") return state;
      return { ...state, opponentSideGuess: action.guess };

    case "START_SIDE_GUESS": {
      if (state.phase !== "locked") return state;
      if (state.lockedNeedleAngle === null) return state;
      return { ...state, phase: "sideGuess" };
    }

    case "OPEN_REVEAL": {
      if (state.phase !== "sideGuess") return state;
      if (!state.opponentSideGuess) return state;
      return { ...state, phase: "reveal" };
    }

    case "TO_NEXT_ROUND_VIEW": {
      if (state.phase !== "scoring") return state;
      return { ...state, phase: "nextRound" };
    }

    case "TO_SCORING": {
      if (state.phase !== "reveal") return state;
      const mainTeam = state.psychicTeam;
      const oppTeam = opponentOf(mainTeam);
      const locked = state.lockedNeedleAngle ?? state.needleAngle;
      const mainPts = scoreNeedleVsTarget(locked, state.targetAngle);
      const oppCorrect = sideGuessIsCorrect(
        state.opponentSideGuess!,
        state.targetAngle,
        locked,
      );
      const oppPts = oppCorrect ? 1 : 0;
      return {
        ...state,
        phase: "scoring",
        scores: {
          ...state.scores,
          [mainTeam]: state.scores[mainTeam] + mainPts,
          [oppTeam]: state.scores[oppTeam] + oppPts,
        },
        lastRound: {
          mainTeam,
          mainPoints: mainPts,
          opponentTeam: oppTeam,
          opponentSideCorrect: oppCorrect,
          opponentPoints: oppPts,
        },
      };
    }

    case "NEXT_ROUND": {
      if (state.phase !== "nextRound") return state;
      const nextPsychic = opponentOf(state.psychicTeam);
      return {
        ...state,
        phase: "hidden",
        round: state.round + 1,
        psychicTeam: nextPsychic,
        seenTargetThisRound: false,
        needleAngle: 90,
        lockedNeedleAngle: null,
        opponentSideGuess: null,
        spectrumLeft: "",
        spectrumRight: "",
        lastRound: null,
      };
    }

    default:
      return state;
  }
}

function clampAngle(a: number): number {
  return Math.min(180, Math.max(0, a));
}
