'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles, Play, RefreshCw, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FunnelStageData {
  stage: string;
  label: string;
  count: number;
  amount?: number;
  percentage: number;
  description: string;
}

interface RecoveryFunnel3DProps {
  stages: FunnelStageData[];
  isSimulating?: boolean;
  onTriggerSimulation?: () => void;
}

// 5 Receding 3D positions with real perspective depth along Z-axis
const STAGE_POSITIONS: [number, number, number][] = [
  [-3.8, 0.8, 1.4],   // Stage 1: Detected (Cyan)
  [-1.9, 0.4, 0.7],   // Stage 2: Diagnosed (Purple)
  [0.0, 0.0, 0.0],    // Stage 3: Gated & Compliance (Amber)
  [1.9, -0.4, -0.7],  // Stage 4: Executed (Teal)
  [3.8, -0.8, -1.4],  // Stage 5: Recovered (Emerald)
];

const STAGE_COLORS = [
  { primary: '#06b6d4', glow: '#22d3ee', name: 'Detected' },
  { primary: '#a855f7', glow: '#c084fc', name: 'Diagnosed' },
  { primary: '#f59e0b', glow: '#fbbf24', name: 'Gated & Approved' },
  { primary: '#14b8a6', glow: '#2dd4bf', name: 'Executed' },
  { primary: '#10b981', glow: '#34d399', name: 'Recovered' },
];

/**
 * 3D Platform & Ring for each funnel stage
 */
function StagePlatform({
  position,
  color,
  glowColor,
  isActive,
  scale = 1.0,
}: {
  position: [number, number, number];
  color: string;
  glowColor: string;
  isActive: boolean;
  scale?: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isActive ? 0.8 : 0.25);
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Outer Neon Glow Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.04, 16, 48]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={color}
          emissiveIntensity={isActive ? 1.8 : 0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Inner Translucent Collector Disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[0.85, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isActive ? 0.35 : 0.18}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Subtle Vertical Ethereal Light Column */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.7, 0.85, 0.9, 24, 1, true]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isActive ? 0.15 : 0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base Pedestal Core */}
      <mesh ref={coreRef} position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.82, 0.88, 0.2, 32]} />
        <meshStandardMaterial
          color="#0b1120"
          metalness={0.8}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

/**
 * Connecting Conduit Spline Line between stages
 */
function StageConduit({
  start,
  end,
  active,
}: {
  start: [number, number, number];
  end: [number, number, number];
  active: boolean;
}) {
  const curve = useMemo(() => {
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2 + 0.35;
    const midZ = (start[2] + end[2]) / 2;
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(midX, midY, midZ),
      new THREE.Vector3(...end)
    );
  }, [start, end]);

  const points = useMemo(() => curve.getPoints(30), [curve]);
  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <primitive object={new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({
        color: active ? '#34d399' : '#334155',
        transparent: true,
        opacity: active ? 0.7 : 0.25,
        linewidth: 2,
      })
    )} />
  );
}

/**
 * Flowing Case Tokens Mesh
 */
function TokenFlowSystem({
  stageCounts,
  flowProgress,
}: {
  stageCounts: number[];
  flowProgress: number; // 0 to 4 across the 5 stages
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tokenCount = 45; // Realistically visible particles
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pre-generate token paths with controlled drop-off
  const tokenData = useMemo(() => {
    return Array.from({ length: tokenCount }).map((_, i) => {
      // Deterministic drop-off based on real funnel ratios
      // Stages 0, 1: 100% flow through
      // Stage 2 (Gated): ~16% drop off (blocked by rules)
      // Stage 3 (Executed): ~8% drop off
      // Stage 4 (Recovered): final surviving tokens
      let dropAtStage = 4;
      const roll = i / tokenCount;
      if (roll > 0.84) dropAtStage = 2; // Drops off at compliance gate
      else if (roll > 0.76) dropAtStage = 3; // Drops off at execution limit
      else if (roll > 0.28) dropAtStage = 3.9; // Unresolved / failed retry

      return {
        id: i,
        offset: (i / tokenCount) * 0.95, // Staggered release
        speed: 0.85 + (i % 5) * 0.05,
        jitterX: ((i % 7) - 3) * 0.08,
        jitterY: ((i % 5) - 2) * 0.06,
        jitterZ: ((i % 4) - 2) * 0.08,
        dropAtStage,
        orbitAngle: Math.random() * Math.PI * 2,
      };
    });
  }, [tokenCount]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    tokenData.forEach((token, i) => {
      // Calculate token's current progression along the 0 -> 4 stage pipeline
      const currentT = ((flowProgress + token.offset) % 4.5);

      if (currentT > token.dropAtStage) {
        // Token has been dropped/blocked: deflect downward and scale to zero
        const lastStageIdx = Math.floor(token.dropAtStage);
        const basePos = STAGE_POSITIONS[lastStageIdx] || STAGE_POSITIONS[2];
        const fallDist = (currentT - token.dropAtStage) * 1.8;
        dummy.position.set(
          basePos[0] + token.jitterX,
          basePos[1] - fallDist,
          basePos[2] + token.jitterZ
        );
        const dropScale = Math.max(0, 0.12 - (currentT - token.dropAtStage) * 0.2);
        dummy.scale.set(dropScale, dropScale, dropScale);
      } else if (currentT >= 4.0) {
        // Token has reached final "Recovered" stage: enter orbiting accumulator
        const finalPos = STAGE_POSITIONS[4];
        token.orbitAngle += delta * 1.6;
        const radius = 0.45 + (token.id % 4) * 0.08;
        dummy.position.set(
          finalPos[0] + Math.cos(token.orbitAngle) * radius,
          finalPos[1] + 0.15 + Math.sin(token.orbitAngle * 2) * 0.08,
          finalPos[2] + Math.sin(token.orbitAngle) * radius
        );
        dummy.scale.set(0.14, 0.14, 0.14);
      } else {
        // Interpolate along path between current stage and next stage
        const stageIdx = Math.min(3, Math.floor(currentT));
        const segT = currentT - stageIdx;
        const start = STAGE_POSITIONS[stageIdx];
        const end = STAGE_POSITIONS[stageIdx + 1];

        // Arching trajectory
        const archY = Math.sin(segT * Math.PI) * 0.45;
        dummy.position.set(
          THREE.MathUtils.lerp(start[0], end[0], segT) + token.jitterX,
          THREE.MathUtils.lerp(start[1], end[1], segT) + archY + token.jitterY,
          THREE.MathUtils.lerp(start[2], end[2], segT) + token.jitterZ
        );
        dummy.scale.set(0.12, 0.12, 0.12);
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, tokenCount]}>
      <sphereGeometry args={[1, 14, 14]} />
      <meshStandardMaterial
        color="#34d399"
        emissive="#10b981"
        emissiveIntensity={2.0}
        roughness={0.1}
        metalness={0.9}
      />
    </instancedMesh>
  );
}

/**
 * 3D Scene Host
 */
function FunnelScene({
  stages,
  flowProgress,
}: {
  stages: FunnelStageData[];
  flowProgress: number;
}) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <pointLight position={[0, 4, 3]} intensity={1.5} color="#34d399" />
      <pointLight position={[-4, 2, 2]} intensity={0.8} color="#06b6d4" />
      <pointLight position={[4, 2, -2]} intensity={1.2} color="#10b981" />

      {/* 5 Receding Stage Platforms */}
      {STAGE_POSITIONS.map((pos, idx) => (
        <StagePlatform
          key={idx}
          position={pos}
          color={STAGE_COLORS[idx].primary}
          glowColor={STAGE_COLORS[idx].glow}
          isActive={flowProgress >= idx - 0.5}
          scale={idx === 4 ? 1.15 : 1.0}
        />
      ))}

      {/* 4 Conduits connecting the stages */}
      {STAGE_POSITIONS.slice(0, 4).map((pos, idx) => (
        <StageConduit
          key={idx}
          start={pos}
          end={STAGE_POSITIONS[idx + 1]}
          active={flowProgress >= idx}
        />
      ))}

      {/* Flowing Case Tokens */}
      <TokenFlowSystem
        stageCounts={stages.map(s => s.count)}
        flowProgress={flowProgress}
      />
    </>
  );
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

/**
 * Moment 2: Live 3D Perspective Recovery Funnel
 */
export default function RecoveryFunnel3D({
  stages,
  isSimulating = false,
  onTriggerSimulation
}: RecoveryFunnel3DProps) {
  const [flowProgress, setFlowProgress] = useState<number>(0);
  const [displayCounts, setDisplayCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const [isFlowActive, setIsFlowActive] = useState<boolean>(true);

  // Animate flow progress continuously or when batch run triggers
  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();

    const loop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Cycle through stages smoothly
      const speed = isSimulating ? 1.4 : 0.75;
      const progress = (elapsed * speed) % 5.0;
      setFlowProgress(progress);

      // Smooth count-up easing based on token arrival at each stage
      setDisplayCounts(
        stages.map((stage, idx) => {
          if (progress >= idx) {
            const easeFactor = Math.min(1.0, (progress - idx) * 1.5);
            return Math.round(stage.count * easeFactor);
          }
          return 0;
        })
      );

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [stages, isSimulating]);

  return (
    <div className="rounded-2xl glass-panel border border-white/10 p-6 bg-[#070b14]/90 relative overflow-hidden">
      {/* Top Header & Replay Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              3D Autonomous Recovery Funnel Flow
            </h2>
            <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
              Moment 2 • WebGL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Receding perspective depth showing real-time token progression & compliance drop-offs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onTriggerSimulation && (
            <button
              onClick={onTriggerSimulation}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/60 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-all cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
              <span>Simulate Wave</span>
            </button>
          )}
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded">
            Perspective Angle: 45° Fixed
          </span>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="relative h-[280px] sm:h-[320px] w-full rounded-xl overflow-hidden bg-gradient-to-b from-[#050811] via-[#090f1f] to-[#050811] border border-white/5">
        <Canvas
          camera={{ position: [0, 2.7, 7.8], fov: 46 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]} // Performance optimized for smooth 60fps on laptops
        >
          <FunnelScene stages={stages} flowProgress={flowProgress} />
        </Canvas>

        {/* Real-time Perspective Depth Cue Overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-between px-6 text-[10px] font-mono text-slate-500">
          <span>◄ Near Foreground (Ingestion)</span>
          <span>Receding Depth (Settlement) ►</span>
        </div>
      </div>

      {/* Stage KPI HUD Bar with Tabular Figures (No Jitter) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
        {stages.map((stage, idx) => {
          const colorMeta = STAGE_COLORS[idx];
          const isPassed = flowProgress >= idx;

          return (
            <div
              key={stage.stage}
              className={`rounded-xl p-3 border transition-all ${
                idx === 4
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-glow-emerald'
                  : idx === 2
                  ? 'bg-slate-900/90 border-amber-500/30'
                  : 'bg-slate-900/60 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  STAGE 0{idx + 1}
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${colorMeta.primary}20`,
                    color: colorMeta.glow,
                    border: `1px solid ${colorMeta.primary}40`,
                  }}
                >
                  {stage.percentage}%
                </span>
              </div>

              <div className="text-xs font-semibold text-white truncate" title={stage.label}>
                {stage.label.split('. ')[1] || stage.label}
              </div>

              {/* Tabular Count Display (Zero Jitter) */}
              <div className="mt-2 text-xl font-bold num-mono text-white flex items-baseline gap-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <span>{displayCounts[idx]}</span>
                <span className="text-[11px] font-normal text-slate-400">cases</span>
              </div>

              {stage.amount ? (
                <div className="mt-1 text-[11px] num-mono font-semibold text-emerald-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatINR(stage.amount)}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-slate-400 truncate">
                  {stage.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
