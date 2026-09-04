'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Play } from 'lucide-react';

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

// 5 Receding 3D positions filling canvas with real perspective depth along Z-axis
const STAGE_POSITIONS: [number, number, number][] = [
  [-3.6, 0.5, 1.2],   // Stage 1: Detected
  [-1.8, 0.25, 0.6],  // Stage 2: Diagnosed
  [0.0, 0.0, 0.0],    // Stage 3: Gated & Compliance
  [1.8, -0.25, -0.6], // Stage 4: Executed
  [3.6, -0.5, -1.2],  // Stage 5: Recovered
];

const STAGE_COLORS = [
  { primary: '#6B6B70', glow: '#A1A1AA', name: 'Detected' },
  { primary: '#A1A1AA', glow: '#FFFFFF', name: 'Diagnosed' },
  { primary: '#C8F000', glow: '#C8F000', name: 'Gated & Approved' },
  { primary: '#A1A1AA', glow: '#FFFFFF', name: 'Executed' },
  { primary: '#C8F000', glow: '#C8F000', name: 'Recovered' },
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
          emissiveIntensity={isActive ? 1.6 : 0.4}
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
          opacity={isActive ? 0.35 : 0.12}
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
          opacity={isActive ? 0.12 : 0.03}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Base Pedestal Core */}
      <mesh ref={coreRef} position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.82, 0.88, 0.2, 32]} />
        <meshStandardMaterial
          color="#1A1A1D"
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
    <primitive
      object={new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({
          color: active ? '#C8F000' : '#26262A',
          transparent: true,
          opacity: active ? 0.8 : 0.3,
          linewidth: active ? 2 : 1,
        })
      )}
    />
  );
}

/**
 * Instanced Case Token Stream flowing across the 3D pipeline
 */
function TokenFlowSystem({
  stageCounts,
  flowProgress,
}: {
  stageCounts: number[];
  flowProgress: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tokenCount = 42;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const tokenData = useMemo(() => {
    return Array.from({ length: tokenCount }).map((_, i) => {
      const dropRand = (i * 17 + 7) % 100;
      let dropAtStage = 4;
      if (dropRand < 15) dropAtStage = 1;
      else if (dropRand < 35) dropAtStage = 2;
      else if (dropRand < 55) dropAtStage = 3;

      return {
        id: i,
        offset: i / tokenCount,
        dropAtStage,
        jitterX: ((i * 13) % 20 - 10) * 0.015,
        jitterY: ((i * 19) % 20 - 10) * 0.015,
        jitterZ: ((i * 23) % 20 - 10) * 0.015,
        orbitAngle: Math.random() * Math.PI * 2,
      };
    });
  }, [tokenCount]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    tokenData.forEach((token, i) => {
      const currentT = ((flowProgress + token.offset) % 4.5);

      if (currentT > token.dropAtStage) {
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
        const stageIdx = Math.min(3, Math.floor(currentT));
        const segT = currentT - stageIdx;
        const start = STAGE_POSITIONS[stageIdx];
        const end = STAGE_POSITIONS[stageIdx + 1];

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
        color="#C8F000"
        emissive="#C8F000"
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
      <pointLight position={[0, 2.5, 2]} intensity={1.8} color="#C8F000" />
      <pointLight position={[-3, 1, 1]} intensity={0.6} color="#A1A1AA" />
      <pointLight position={[3, 1, -1]} intensity={1.2} color="#C8F000" />

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

export default function RecoveryFunnel3D({
  stages,
  isSimulating = false,
  onTriggerSimulation,
}: RecoveryFunnel3DProps) {
  const [flowProgress, setFlowProgress] = useState<number>(0);
  const [displayCounts, setDisplayCounts] = useState<number[]>(stages.map(s => s.count));

  useEffect(() => {
    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = (elapsed * 0.85) % 4.5;
      setFlowProgress(progress);

      const jittered = stages.map((s, idx) => {
        if (progress > idx - 0.2 && progress < idx + 0.8) {
          return Math.max(0, s.count + Math.floor(Math.sin(elapsed * 4 + idx) * 2));
        }
        return s.count;
      });
      setDisplayCounts(jittered);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [stages]);

  return (
    <div className="rounded-2xl bg-[#141416] p-6 border border-[#26262A] shadow-inner-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C8F000]">
              Moment 2 • WebGL 3D Pipeline
            </span>
          </div>
          <h2 className="text-base font-bold text-white mt-0.5">
            Autonomous Recovery Funnel Flow
          </h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Receding perspective depth showing real-time token progression & compliance drop-offs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onTriggerSimulation && (
            <button
              onClick={onTriggerSimulation}
              className="flex items-center gap-1.5 rounded-lg border border-[#C8F000]/40 bg-[#C8F000]/10 px-3 py-1.5 text-xs font-bold text-[#C8F000] hover:bg-[#C8F000]/20 transition-all duration-150 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-[#C8F000] text-[#C8F000]" />
              <span>Simulate Wave</span>
            </button>
          )}
          <span className="text-xs font-mono text-[#A1A1AA] bg-[#1A1A1D] border border-[#26262A] px-2.5 py-1 rounded">
            Perspective Depth Fixed
          </span>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport — Framing Centered & Filling Canvas */}
      <div className="relative h-[300px] sm:h-[340px] w-full rounded-xl overflow-hidden bg-[#0A0A0B] border border-[#26262A]">
        <Canvas
          camera={{ position: [0, 0.7, 5.8], fov: 44 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <FunnelScene stages={stages} flowProgress={flowProgress} />
        </Canvas>

        {/* Real-time Perspective Depth Cue Overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-between px-6 text-[10px] font-mono text-[#6B6B70]">
          <span>◄ Near Ingestion</span>
          <span>Receding Settlement ►</span>
        </div>
      </div>

      {/* Stage KPI HUD Bar with Tabular Figures */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
        {stages.map((stage, idx) => {
          const isRecovered = idx === 4;

          return (
            <div
              key={stage.stage}
              className={`rounded-xl p-3 border transition-colors duration-150 ${
                isRecovered
                  ? 'bg-[#141416] border-[#C8F000]/40 shadow-glow-accent'
                  : 'bg-[#141416] border-[#26262A]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-[#A1A1AA]">
                  STAGE 0{idx + 1}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isRecovered
                      ? 'bg-[#C8F000]/15 text-[#C8F000] border border-[#C8F000]/30'
                      : 'bg-[#1A1A1D] text-[#A1A1AA] border border-[#26262A]'
                  }`}
                >
                  {stage.percentage}%
                </span>
              </div>

              <div className="text-xs font-semibold text-white truncate" title={stage.label}>
                {stage.label.split('. ')[1] || stage.label}
              </div>

              <div className="mt-2 text-xl font-bold num-mono text-white flex items-baseline gap-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <span>{displayCounts[idx]}</span>
                <span className="text-[11px] font-normal text-[#A1A1AA]">cases</span>
              </div>

              {stage.amount ? (
                <div className="mt-1 text-[11px] num-mono font-semibold text-[#C8F000]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatINR(stage.amount)}
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-[#6B6B70] truncate">
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
