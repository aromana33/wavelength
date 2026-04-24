/**
 * noTarget — старт: заслонка закрыта, сектора ещё нет.
 * targetHidden — после «случайный сектор»: цель есть, поле закрыто.
 * psychicOpen — психик открыл: белое поле и сектор видны.
 * hiddenAfterPeek — снова закрыто, сектор скрыт.
 * aimNeedle — стрелка на закрытом поле.
 * resultOpen — открыто: сектор + стрелка + очки.
 */
export type Phase =
  | "noTarget"
  | "targetHidden"
  | "psychicOpen"
  | "hiddenAfterPeek"
  | "aimNeedle"
  | "resultOpen";

export type GameState = {
  phase: Phase;
  /** Активен после первого «случайный сектор» */
  targetAngle: number;
  needleAngle: number;
  /** Очки за последнее открытие результата */
  lastScore: number | null;
};

export const INITIAL_STATE: GameState = {
  phase: "noTarget",
  targetAngle: 90,
  needleAngle: 90,
  lastScore: null,
};
