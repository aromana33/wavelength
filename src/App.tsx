import { useMemo, useReducer, useState } from "react";
import { Dial } from "./components/Dial";
import { gameReducer } from "./game/gameReducer";
import { INITIAL_STATE } from "./game/types";
import type { Phase } from "./game/types";

const PHASE_HINT: Record<Phase, string> = {
  noTarget:
    "Поле закрыто. Нажмите «Выставить случайный сектор» — цель задаётся, но остаётся невидимой.",
  targetHidden:
    "Сектор выбран случайно, поле закрыто. Психик может открыть поле один раз, чтобы увидеть цель.",
  psychicOpen:
    "Поле открыто: виден белый фон и сектор 2–3–4–3–2. Остальные не смотрят. Затем закройте поле.",
  hiddenAfterPeek:
    "Снова закрыто — сектор скрыт. Нажмите «Выставить стрелку» и на закрытом поле выберите положение стрелки.",
  aimNeedle:
    "Двигайте стрелку по закрытой шкале (мышь, палец или ползунок). Затем откройте поле, чтобы увидеть результат.",
  resultOpen:
    "Поле открыто: видно сектор и стрелку. Ниже — очки за попадание.",
};

function scoreLabel(points: number): string {
  if (points === 0) return "промах — 0 очков";
  if (points === 2) return "2 очка";
  if (points === 3) return "3 очка";
  return "4 очка (центр)";
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [psychicModalOpen, setPsychicModalOpen] = useState(false);

  const { showWedges, shutterOpen, needleInteractive } = useMemo(() => {
    const open = state.phase === "psychicOpen" || state.phase === "resultOpen";
    return {
      showWedges: open,
      shutterOpen: open,
      needleInteractive: state.phase === "aimNeedle",
    };
  }, [state.phase]);

  return (
    <div className="app-shell">
      <h1 className="app-title">Wavelength</h1>
      <p className="app-sub">
        Поле-спидометр: в закрытом состоянии — голубая заслонка; в открытом —
        белый фон и цветной сектор 2–3–4–3–2. Угол цели всегда случайный.
      </p>

      <div className="panel">
        <p className="hint" style={{ marginTop: 0 }}>
          {PHASE_HINT[state.phase]}
        </p>
        <div className="dial-wrap">
          <Dial
            targetCenter={state.targetAngle}
            needleAngle={state.needleAngle}
            showWedges={showWedges}
            shutterOpen={shutterOpen}
            needleInteractive={needleInteractive}
            onNeedleChange={
              needleInteractive
                ? (a) => dispatch({ type: "SET_NEEDLE", angle: a })
                : undefined
            }
          />
        </div>
        {state.phase === "resultOpen" && state.lastScore !== null && (
          <p className="result-banner" role="status">
            Результат: <strong>{scoreLabel(state.lastScore)}</strong>
          </p>
        )}
      </div>

      <div className="panel controls">
        {(state.phase === "noTarget" || state.phase === "resultOpen") && (
          <button
            type="button"
            onClick={() => dispatch({ type: "RANDOM_SECTOR" })}
          >
            Выставить случайный сектор
          </button>
        )}

        {state.phase === "targetHidden" && (
          <button
            type="button"
            onClick={() => setPsychicModalOpen(true)}
          >
            Открыть поле
          </button>
        )}

        {state.phase === "psychicOpen" && (
          <button
            type="button"
            className="secondary"
            onClick={() => dispatch({ type: "CLOSE_FIELD" })}
          >
            Закрыть поле
          </button>
        )}

        {state.phase === "hiddenAfterPeek" && (
          <button
            type="button"
            onClick={() => dispatch({ type: "START_NEEDLE" })}
          >
            Выставить стрелку
          </button>
        )}

        {state.phase === "aimNeedle" && (
          <>
            <label className="field" style={{ flex: "1 1 260px" }}>
              Стрелка
              <input
                type="range"
                min={0}
                max={180}
                value={state.needleAngle}
                onChange={(e) =>
                  dispatch({
                    type: "SET_NEEDLE",
                    angle: Number(e.target.value),
                  })
                }
              />
            </label>
            <button
              type="button"
              onClick={() => dispatch({ type: "OPEN_RESULT_FIELD" })}
            >
              Открыть поле
            </button>
          </>
        )}

        {state.phase === "resultOpen" && (
          <button
            type="button"
            className="secondary"
            onClick={() => dispatch({ type: "NEW_ROUND" })}
          >
            Новый раунд
          </button>
        )}

        <div className="row" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="ghost"
            onClick={() => dispatch({ type: "RESET_GAME" })}
          >
            Сбросить
          </button>
        </div>
      </div>

      {psychicModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="psychic-modal-title"
        >
          <div className="modal-card">
            <h2 id="psychic-modal-title" className="modal-title">
              Только психик смотрит?
            </h2>
            <p className="modal-text">
              Убедитесь, что никто больше не видит экран. Тогда можно открыть
              поле и показать сектор только психику.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setPsychicModalOpen(false)}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setPsychicModalOpen(false);
                  dispatch({ type: "OPEN_PSYCHIC_FIELD" });
                }}
              >
                Да, открыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
