import { type GameState, INITIAL_STATE } from "./types";
import { randomTargetAngle, scoreNeedleVsTarget } from "./scoring";

export type GameAction =
  | { type: "RANDOM_SECTOR" }
  | { type: "OPEN_PSYCHIC_FIELD" }
  | { type: "CLOSE_FIELD" }
  | { type: "START_NEEDLE" }
  | { type: "SET_NEEDLE"; angle: number }
  | { type: "OPEN_RESULT_FIELD" }
  | { type: "NEW_ROUND" }
  | { type: "RESET_GAME" };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "RESET_GAME":
      return { ...INITIAL_STATE };

    case "RANDOM_SECTOR": {
      if (state.phase !== "noTarget" && state.phase !== "resultOpen")
        return state;
      return {
        ...state,
        phase: "targetHidden",
        targetAngle: randomTargetAngle(),
        lastScore: null,
        needleAngle: 90,
      };
    }

    case "OPEN_PSYCHIC_FIELD": {
      if (state.phase !== "targetHidden") return state;
      return { ...state, phase: "psychicOpen" };
    }

    case "CLOSE_FIELD": {
      if (state.phase !== "psychicOpen") return state;
      return { ...state, phase: "hiddenAfterPeek" };
    }

    case "START_NEEDLE": {
      if (state.phase !== "hiddenAfterPeek") return state;
      return { ...state, phase: "aimNeedle" };
    }

    case "SET_NEEDLE": {
      if (state.phase !== "aimNeedle") return state;
      return {
        ...state,
        needleAngle: clampAngle(action.angle),
      };
    }

    case "OPEN_RESULT_FIELD": {
      if (state.phase !== "aimNeedle") return state;
      const pts = scoreNeedleVsTarget(state.needleAngle, state.targetAngle);
      return {
        ...state,
        phase: "resultOpen",
        lastScore: pts,
      };
    }

    case "NEW_ROUND":
      if (state.phase !== "resultOpen") return state;
      return {
        ...INITIAL_STATE,
        phase: "noTarget",
      };

    default:
      return state;
  }
}

function clampAngle(a: number): number {
  return Math.min(180, Math.max(0, a));
}
