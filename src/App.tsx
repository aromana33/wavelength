import { useMemo, useReducer, useState } from "react";
import { Dial } from "./components/Dial";
import { gameReducer } from "./game/gameReducer";
import { INITIAL_STATE } from "./game/types";
import type { Phase, SideGuess } from "./game/types";

const PHASE_LABELS: Record<Phase, string> = {
  hidden: "Скрыто — психик настраивает цель",
  preview: "Превью — только психик смотрит",
  guessing: "Угадывание — команда двигает стрелку",
  locked: "Ответ зафиксирован",
  sideGuess: "Соперники: левее или правее?",
  reveal: "Раскрытие",
  scoring: "Подсчёт очков",
  nextRound: "Следующий раунд",
};

function opponent(team: "A" | "B"): "A" | "B" {
  return team === "A" ? "B" : "A";
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [psychicLens, setPsychicLens] = useState(true);

  const mainTeam = state.psychicTeam;
  const oppTeam = opponent(mainTeam);

  const { showWedges, shutterOpen, needleInteractive, displayNeedle } =
    useMemo(() => {
      const p = state.phase;
      const previewOpen = p === "preview" && psychicLens;
      const revealLike =
        p === "reveal" || p === "scoring" || p === "nextRound";
      return {
        showWedges: previewOpen || revealLike,
        shutterOpen: previewOpen || revealLike,
        needleInteractive: p === "guessing",
        displayNeedle:
          p === "guessing" ||
          p === "locked" ||
          p === "sideGuess" ||
          p === "reveal" ||
          p === "scoring" ||
          p === "nextRound"
            ? state.lockedNeedleAngle ?? state.needleAngle
            : state.needleAngle,
      };
    }, [state.phase, state.needleAngle, state.lockedNeedleAngle, psychicLens]);

  const canOpenPreview = state.phase === "hidden";
  const canClosePreview = state.phase === "preview";
  const canBeginGuessing =
    state.phase === "hidden" &&
    state.seenTargetThisRound &&
    state.spectrumLeft.trim() &&
    state.spectrumRight.trim();
  const canLock =
    state.phase === "guessing" &&
    state.spectrumLeft.trim() &&
    state.spectrumRight.trim();
  const canStartSide = state.phase === "locked";
  const canReveal =
    state.phase === "sideGuess" && state.opponentSideGuess !== null;
  const canScore = state.phase === "reveal";
  const canToNextRoundView = state.phase === "scoring";
  const canStartNextRound = state.phase === "nextRound";

  return (
    <div className="app-shell">
      <h1 className="app-title">Wavelength — онлайн поле</h1>
      <p className="app-sub">
        Командная партия на одном устройстве: психик кратко смотрит цель,
        команда двигает общую стрелку, соперники выбирают «левее / правее».
      </p>

      <div className="panel score-row">
        <div>
          <div className="phase-badge">Фаза</div>
          <div style={{ fontWeight: 600 }}>{PHASE_LABELS[state.phase]}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="score-pill">
            Команда A — {state.scores.A}
          </span>
          <span className="score-pill">
            Команда B — {state.scores.B}
          </span>
        </div>
      </div>

      <div className="panel">
        <div className="row" style={{ marginBottom: 8 }}>
          <span className="toggle">
            <input
              id="psychicLens"
              type="checkbox"
              checked={psychicLens}
              onChange={(e) => setPsychicLens(e.target.checked)}
            />
            <label htmlFor="psychicLens">
              Режим «я психик» (превью цели видно только при включённом
              флажке)
            </label>
          </span>
        </div>
        <p className="hint">
          Раунд {state.round}. Психик сейчас: команда {mainTeam}. Угадывает
          команда {mainTeam}, ставку «левее / правее» делает команда {oppTeam}.
        </p>
        {(state.phase === "guessing" ||
          state.phase === "locked" ||
          state.phase === "sideGuess") &&
          (state.spectrumLeft || state.spectrumRight) && (
            <div className="spectrum-display" aria-live="polite">
              <span className="left">{state.spectrumLeft}</span>
              <span className="right">{state.spectrumRight}</span>
            </div>
          )}
        <div className="dial-wrap">
          <Dial
            targetCenter={state.targetAngle}
            needleAngle={displayNeedle}
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
      </div>

      <div className="panel controls">
        {state.phase === "hidden" && (
          <>
            <p className="hint">
              Психик крутит цель (ползунок или случайно), затем открывает
              заслонку только у себя, запоминает и закрывает. После этого
              вводит края шкалы и переводит игру к команде.
            </p>
            <div className="row">
              <label className="field" style={{ flex: "1 1 220px" }}>
                Угол цели (0 — влево, 180 — вправо)
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={state.targetAngle}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TARGET",
                      angle: Number(e.target.value),
                    })
                  }
                />
              </label>
              <button
                type="button"
                className="secondary"
                onClick={() => dispatch({ type: "RANDOM_TARGET" })}
              >
                Случайный угол
              </button>
            </div>
            <div className="row">
              <button
                type="button"
                disabled={!canOpenPreview}
                onClick={() => dispatch({ type: "OPEN_PREVIEW" })}
              >
                Открыть (психик)
              </button>
              <button
                type="button"
                className="secondary"
                disabled={!canClosePreview}
                onClick={() => dispatch({ type: "CLOSE_PREVIEW" })}
              >
                Закрыть
              </button>
            </div>
            <div className="row">
              <label className="field">
                Левый край шкалы
                <input
                  type="text"
                  value={state.spectrumLeft}
                  placeholder="например: Холодно"
                  onChange={(e) =>
                    dispatch({
                      type: "SET_SPECTRUM",
                      left: e.target.value,
                      right: state.spectrumRight,
                    })
                  }
                />
              </label>
              <label className="field">
                Правый край шкалы
                <input
                  type="text"
                  value={state.spectrumRight}
                  placeholder="например: Жарко"
                  onChange={(e) =>
                    dispatch({
                      type: "SET_SPECTRUM",
                      left: state.spectrumLeft,
                      right: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            <button
              type="button"
              disabled={!canBeginGuessing}
              onClick={() => dispatch({ type: "BEGIN_GUESSING" })}
            >
              Подсказка дана — команда угадывает
            </button>
          </>
        )}

        {state.phase === "preview" && (
          <>
            <p className="hint">
              Психик смотрит на сектор. Команда пусть отвернётся. Затем нажмите
              «Закрыть».
            </p>
            <div className="row">
              <button
                type="button"
                className="secondary"
                onClick={() => dispatch({ type: "CLOSE_PREVIEW" })}
              >
                Закрыть
              </button>
            </div>
          </>
        )}

        {state.phase === "guessing" && (
          <>
            <p className="hint">
              Ведущая команда обсуждает и тянет стрелку по дуге (мышь или
              палец). Затем фиксирует ответ.
            </p>
            <div className="row">
              <label className="field" style={{ flex: "1 1 240px" }}>
                Стрелка (°)
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
                disabled={!canLock}
                onClick={() => dispatch({ type: "LOCK_ANSWER" })}
              >
                Зафиксировать ответ
              </button>
            </div>
          </>
        )}

        {state.phase === "locked" && (
          <>
            <p className="hint">
              Ответ команды {mainTeam} зафиксирован. Команда {oppTeam}{" "}
              выбирает, находится ли цель левее или правее стрелки.
            </p>
            <button
              type="button"
              disabled={!canStartSide}
              onClick={() => dispatch({ type: "START_SIDE_GUESS" })}
            >
              Команда {oppTeam}: сделать выбор левее / правее
            </button>
          </>
        )}

        {state.phase === "sideGuess" && (
          <>
            <p className="hint">
              Центр сектора с «четвёркой» левее стрелки — кнопка «Левее».
              Правее — «Правее». Если стрелка попала ровно в центр цели,
              бонус соперникам не засчитывается.
            </p>
            <div className="row">
              <button
                type="button"
                className={
                  state.opponentSideGuess === "left" ? undefined : "secondary"
                }
                onClick={() =>
                  dispatch({ type: "SET_SIDE_GUESS", guess: "left" })
                }
              >
                Левее
              </button>
              <button
                type="button"
                className={
                  state.opponentSideGuess === "right" ? undefined : "secondary"
                }
                onClick={() =>
                  dispatch({ type: "SET_SIDE_GUESS", guess: "right" })
                }
              >
                Правее
              </button>
              <button
                type="button"
                disabled={!canReveal}
                onClick={() => dispatch({ type: "OPEN_REVEAL" })}
              >
                Открыть результат
              </button>
            </div>
          </>
        )}

        {state.phase === "reveal" && (
          <>
            <RevealSummary
              target={state.targetAngle}
              needle={state.lockedNeedleAngle ?? state.needleAngle}
              guess={state.opponentSideGuess}
            />
            <button
              type="button"
              disabled={!canScore}
              onClick={() => dispatch({ type: "TO_SCORING" })}
            >
              Посчитать очки
            </button>
          </>
        )}

        {state.phase === "scoring" && state.lastRound && (
          <>
            <p className="hint">
              Команда {state.lastRound.mainTeam}: +{state.lastRound.mainPoints}{" "}
              за попадание. Команда {state.lastRound.opponentTeam}: +
              {state.lastRound.opponentPoints} за сторону (
              {state.lastRound.opponentSideCorrect ? "угадали" : "промах"}).
            </p>
            <button
              type="button"
              disabled={!canToNextRoundView}
              onClick={() => dispatch({ type: "TO_NEXT_ROUND_VIEW" })}
            >
              Дальше
            </button>
          </>
        )}

        {state.phase === "nextRound" && (
          <>
            <p className="hint">
              Следующий раунд {state.round + 1}: психиком будет команда{" "}
              {opponent(mainTeam)}. Настройте новую цель.
            </p>
            <button
              type="button"
              disabled={!canStartNextRound}
              onClick={() => dispatch({ type: "NEXT_ROUND" })}
            >
              Начать следующий раунд
            </button>
          </>
        )}

        <div className="row" style={{ marginTop: 6 }}>
          <button
            type="button"
            className="ghost"
            onClick={() => dispatch({ type: "RESET_GAME" })}
          >
            Сбросить игру
          </button>
        </div>
      </div>
    </div>
  );
}

function RevealSummary({
  target,
  needle,
  guess,
}: {
  target: number;
  needle: number;
  guess: SideGuess | null;
}) {
  let sideText = "—";
  if (guess) {
    const correct =
      target < needle
        ? guess === "left"
        : target > needle
          ? guess === "right"
          : false;
    sideText = correct ? "Верно" : "Неверно";
  }
  return (
    <p className="hint">
      Цель: {target.toFixed(1)}°, стрелка: {needle.toFixed(1)}°. Ставка
      соперников: {sideText}.
    </p>
  );
}
