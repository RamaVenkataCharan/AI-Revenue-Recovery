/**
 * ============================================================================
 * 🛡️ REVENUE RECOVERY AGENT — STRICT MOTION BUDGET & RESTRAINT POLICY
 * ============================================================================
 *
 * GROUND RULE THAT GOVERNS ALL FRONTEND MOTION IN THIS REPOSITORY:
 *
 * The three moments below constitute the ENTIRE 3D/heavy-motion budget for this UI:
 *   1. Moment 1: Compliance Gate as a literal 3D checkpoint (Three.js / React Three Fiber)
 *   2. Moment 2: Live batch-run funnel in 3D (Three.js / React Three Fiber)
 *   3. Moment 3: Case card cursor-tracked spring tilt (Framer Motion)
 *
 * EVERY OTHER SURFACE — tables, navigation bars, forms, audit ledger rows,
 * filters, and KPI number displays — STAYS FLAT, FAST, AND RESTRAINED.
 * At most, use simple opacity or subtle translate transitions.
 *
 * The contrast between "mostly still, occasionally spectacular" is what gives
 * this interface executive-level polish instead of feeling like a generic
 * Three.js template dump. DO NOT add 3D, parallax, or bounce physics to
 * buttons, navigation links, or standard metrics cards.
 * ============================================================================
 */

import { SpringOptions } from 'framer-motion';

/**
 * Highly damped, premium spring configuration for cursor-tracked card tilt.
 * Designed to prevent jitter and maintain a smooth, expensive tactile feel.
 */
export const CARD_TILT_SPRING_CONFIG: SpringOptions = {
  stiffness: 240,
  damping: 24,
  mass: 0.6,
};

/**
 * Maximum tilt angle in degrees for the case card cursor follow.
 * Strict clamp between 6 and 8 degrees ensures restraint without distortion.
 */
export const MAX_CARD_TILT_DEGREES = 7.0;

/**
 * Camera and coordinate presets for 3D visual moments.
 */
export const THREE_D_CONFIG = {
  funnel: {
    cameraPosition: [0, 3.2, 8.5] as [number, number, number],
    fov: 45,
  },
  complianceGate: {
    cameraPosition: [0, 2.2, 7.5] as [number, number, number],
    fov: 48,
  }
};
