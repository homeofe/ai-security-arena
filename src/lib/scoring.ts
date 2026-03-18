import type { BattleEvent, BattleScore, TeamScore } from "@/types";

/**
 * Scoring engine for battles.
 * Points are awarded based on action success/failure and detection speed.
 */

const POINTS = {
  ATTACK_LANDED: 10,
  ATTACK_BLOCKED: -2,
  DETECTION_CORRECT: 8,
  DETECTION_MISSED: -5,
  HARDENING_APPLIED: 3,
  ESCALATION_SUCCESS: 15,
  ESCALATION_BLOCKED: -3,
  FAST_DETECTION_BONUS: 5, // detected within 1 round
} as const;

function emptyTeamScore(): TeamScore {
  return {
    points: 0,
    attacksLanded: 0,
    attacksBlocked: 0,
    detectionsCorrect: 0,
    detectionsMissed: 0,
    avgResponseTimeMs: 0,
  };
}

export function calculateScore(events: BattleEvent[]): BattleScore {
  const red = emptyTeamScore();
  const blue = emptyTeamScore();
  const responseTimes: number[] = [];

  for (const event of events) {
    if (event.team === "red") {
      if (event.success) {
        if (event.phase === "ESCALATE") {
          red.points += POINTS.ESCALATION_SUCCESS;
        } else {
          red.points += POINTS.ATTACK_LANDED;
        }
        red.attacksLanded++;
      } else {
        red.points += POINTS.ATTACK_BLOCKED;
        red.attacksBlocked++;
      }
    }

    if (event.team === "blue") {
      if (event.phase === "DETECT") {
        if (event.success) {
          blue.points += POINTS.DETECTION_CORRECT;
          blue.detectionsCorrect++;
        } else {
          blue.points += POINTS.DETECTION_MISSED;
          blue.detectionsMissed++;
        }
      }
      if (event.phase === "HARDEN" && event.success) {
        blue.points += POINTS.HARDENING_APPLIED;
      }
    }
  }

  if (responseTimes.length > 0) {
    blue.avgResponseTimeMs =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  const winner =
    red.points > blue.points ? "red" : blue.points > red.points ? "blue" : undefined;

  return { red, blue, winner };
}
