import { randomBytes, timingSafeEqual } from 'node:crypto';
import { defineService } from '@justscale/core';

const CHALLENGE_BYTES = 32;
const DEFAULT_TTL_MS = 5 * 60 * 1000;

interface ChallengeRecord {
  userId: string
  expiresAt: number
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}

export class TwoFactorChallengeService extends defineService({
  inject: {},
  factory: () => {
    const challenges = new Map<string, ChallengeRecord>();

    function pruneExpired(now = Date.now()): void {
      for (const [token, challenge] of challenges) {
        if (challenge.expiresAt <= now) challenges.delete(token);
      }
    }

    function isValid(userId: string, token: string | undefined): boolean {
      if (!token) return false;
      const challenge = challenges.get(token);
      if (!challenge) return false;
      if (challenge.expiresAt <= Date.now()) {
        challenges.delete(token);
        return false;
      }
      return safeEqual(challenge.userId, userId);
    }

    return {
      issue(userId: string, ttlMs = DEFAULT_TTL_MS): string {
        pruneExpired();
        const token = randomBytes(CHALLENGE_BYTES).toString('hex');
        challenges.set(token, {
          userId,
          expiresAt: Date.now() + ttlMs,
        });
        return token;
      },

      verify(userId: string, token: string | undefined): boolean {
        return isValid(userId, token);
      },

      consume(userId: string, token: string | undefined): boolean {
        if (!isValid(userId, token)) return false;
        challenges.delete(token!);
        return true;
      },
    };
  },
}) {}

export type TwoFactorChallengeServiceInstance = ReturnType<
  typeof TwoFactorChallengeService.factory
>;
