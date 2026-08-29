'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Play, 
  Info, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  FileCode
} from 'lucide-react';
import { ComplianceCheckResult } from '@/compliance/gate';

interface ComplianceGateCheckpoint3DProps {
  results: ComplianceCheckResult[];
  proposedActionName?: string;
  proposedChannelName?: string;
}

/**
 * 3D Translucent Gate Checkpoint Panel
 */
function GatePanel({
  result,
  index,
  total,
  position,
  tokenZ,
  isSelected,
  onSelect,
}: {
  result: ComplianceCheckResult;
  index: number;
  total: number;
  position: [number, number, number];
  tokenZ: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const panelRef = useRef<THREE.Group>(null);
  const isPassed = result.passed;
  const isExempt = result.context_snapshot?.exempt === true;

  // Has the token arrived or passed this panel?
  const isTokenAtPanel = Math.abs(tokenZ - position[2]) < 0.45;
  const hasTokenPassed = tokenZ < position[2] - 0.2;

  // Dynamic panel glow intensity
  const glowColor = isPassed
    ? isExempt ? '#38bdf8' : '#10b981'
    : '#f43f5e';

  const emissiveIntensity = isTokenAtPanel
    ? (isPassed ? 1.6 : 2.4)
    : hasTokenPassed
    ? 0.7
    : 0.25;

  return (
    <group ref={panelRef} position={position} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Outer Glow Halo Rim */}
      <RoundedBox args={[3.4, 2.3, 0.04]} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={isSelected ? 0.9 : (isTokenAtPanel ? 0.8 : 0.4)}
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Inner Translucent Glass Screen */}
      <RoundedBox args={[3.2, 2.1, 0.06]} radius={0.1} smoothness={4} position={[0, 0, 0.01]}>
        <meshPhysicalMaterial
          color={isSelected ? '#1e293b' : '#090d16'}
          roughness={0.15}
          metalness={0.1}
          transmission={0.65}
          transparent
          opacity={0.82}
          reflectivity={0.9}
        />
      </RoundedBox>

      {/* Checkpoint Step Number */}
      <Text
        position={[0, 0.72, 0.06]}
        fontSize={0.14}
        color={glowColor}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        {`CHECKPOINT 0${index + 1} OF 0${total}`}
      </Text>

      {/* Statutory Rule Code Name */}
      <Text
        position={[0, 0.35, 0.06]}
        fontSize={0.19}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.9}
        textAlign="center"
      >
        {result.rule_cited}
      </Text>

      {/* Verdict Badge in 3D */}
      <RoundedBox
        args={[1.8, 0.38, 0.04]}
        radius={0.08}
        smoothness={4}
        position={[0, -0.15, 0.06]}
      >
        <meshStandardMaterial
          color={isPassed ? (isExempt ? '#0284c7' : '#059669') : '#e11d48'}
          emissive={glowColor}
          emissiveIntensity={isTokenAtPanel ? 1.5 : 0.8}
        />
      </RoundedBox>

      <Text
        position={[0, -0.15, 0.09]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        {isPassed ? (isExempt ? 'EXEMPT / PASS' : 'VERIFIED PASS') : 'RULE BLOCKED'}
      </Text>

      {/* Click / Hover Instruction */}
      <Text
        position={[0, -0.68, 0.06]}
        fontSize={0.11}
        color={isSelected ? '#34d399' : '#94a3b8'}
        anchorX="center"
        anchorY="middle"
      >
        {isSelected ? '● INSPECTING AUDIT PROOF' : 'CLICK TO INSPECT RATIONALE'}
      </Text>
    </group>
  );
}

/**
 * Traveling Action Token with Physical Barrier Deflection
 */
function ActionToken({
  tokenZ,
  blockedZ,
  isBlocked,
}: {
  tokenZ: number;
  blockedZ: number | null;
  isBlocked: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 2;
    }
  });

  const isHalted = blockedZ !== null && Math.abs(tokenZ - blockedZ) < 0.15;
  const tokenColor = isHalted && isBlocked ? '#f43f5e' : '#34d399';
  const emissiveColor = isHalted && isBlocked ? '#e11d48' : '#10b981';

  return (
    <group position={[0, 0.35, tokenZ]}>
      {/* Outer Energy Halo */}
      <mesh ref={haloRef}>
        <ringGeometry args={[0.32, 0.42, 24]} />
        <meshBasicMaterial
          color={tokenColor}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center Action Core Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color={tokenColor}
          emissive={emissiveColor}
          emissiveIntensity={2.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Point Light emitted by token */}
      <pointLight color={tokenColor} intensity={2.8} distance={3.5} />
    </group>
  );
}

/**
 * 3D Scene Host
 */
function CheckpointScene({
  results,
  tokenZ,
  blockedZ,
  firstBlockedIdx,
  selectedIdx,
  onSelectIdx,
}: {
  results: ComplianceCheckResult[];
  tokenZ: number;
  blockedZ: number | null;
  firstBlockedIdx: number;
  selectedIdx: number | null;
  onSelectIdx: (idx: number) => void;
}) {
  // Spacing panels along the Z axis from foreground (Z = 2.4) to distance (Z = -4.0)
  const count = results.length;
  const panelPositions = useMemo(() => {
    const startZ = 2.4;
    const endZ = -4.2;
    const step = count > 1 ? (endZ - startZ) / (count - 1) : 0;
    return results.map((_, i) => [0, 0.4, startZ + i * step] as [number, number, number]);
  }, [results, count]);

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 10, 8]} intensity={1.1} />
      <pointLight position={[0, 4, 0]} intensity={1.2} color="#34d399" />

      {/* Runway Floor Grid */}
      <gridHelper
        args={[16, 24, '#10b981', '#1e293b']}
        position={[0, -0.75, -1.0]}
      />

      {/* Sequential Gate Panels */}
      {results.map((r, i) => (
        <GatePanel
          key={i}
          result={r}
          index={i}
          total={count}
          position={panelPositions[i]}
          tokenZ={tokenZ}
          isSelected={selectedIdx === i}
          onSelect={() => onSelectIdx(i)}
        />
      ))}

      {/* Traveling Action Token */}
      <ActionToken
        tokenZ={tokenZ}
        blockedZ={blockedZ}
        isBlocked={firstBlockedIdx !== -1}
      />
    </>
  );
}

/**
 * Moment 1: Compliance Gate 3D Checkpoint Component
 */
export default function ComplianceGateCheckpoint3D({
  results,
  proposedActionName = 'PROPOSED_RECOVERY_ACTION',
  proposedChannelName = 'GATEWAY_OR_VOICE',
}: ComplianceGateCheckpoint3DProps) {
  const [tokenZ, setTokenZ] = useState<number>(3.8);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Find if any rule is blocked and identify its Z coordinate
  const firstBlockedIdx = results.findIndex((r) => !r.passed);
  const count = results.length;

  const panelZPositions = useMemo(() => {
    const startZ = 2.4;
    const endZ = -4.2;
    const step = count > 1 ? (endZ - startZ) / (count - 1) : 0;
    return results.map((_, i) => startZ + i * step);
  }, [results, count]);

  const targetBlockedZ = firstBlockedIdx !== -1
    ? panelZPositions[firstBlockedIdx] + 0.35 // Halts right in front of the blocked panel
    : -5.5; // Passes completely through all panels

  // Animate the token traveling along Z-axis
  useEffect(() => {
    let animationFrameId: number;
    let currentZ = 3.8;
    const startZ = 3.8;
    const speed = 2.2; // Smooth travel speed
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        currentZ -= delta * speed;

        if (firstBlockedIdx !== -1 && currentZ <= targetBlockedZ) {
          // Rule Failed: Token stops visibly at the blocked panel
          currentZ = targetBlockedZ;
          setTokenZ(currentZ);
          // Auto-select the blocked panel to reveal the legal rationale
          setSelectedIdx(firstBlockedIdx);
          return; // Settle here permanently! Do not continue past block.
        } else if (currentZ <= -5.5) {
          // All passed: Token reached completion clearing
          currentZ = -5.5;
          setTokenZ(currentZ);
          return;
        }

        setTokenZ(currentZ);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [results, firstBlockedIdx, targetBlockedZ, isPlaying]);

  const handleReplay = () => {
    setTokenZ(3.8);
    setSelectedIdx(null);
    setIsPlaying(true);
  };

  const selectedResult = selectedIdx !== null ? results[selectedIdx] : null;

  return (
    <div className="rounded-2xl glass-panel border border-white/10 p-6 bg-[#070b14]/90 relative overflow-hidden">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              3D Statutory Compliance Checkpoint
            </h2>
            <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-bold ${
              firstBlockedIdx === -1
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-400'
            }`}>
              {firstBlockedIdx === -1 ? 'ALL GATES PASSED (APPROVED)' : `GATE BLOCKED AT STEP 0${firstBlockedIdx + 1}`}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Physical 3D verification: Action token passes compliant rules and strictly deflects at statutory violations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReplay}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/60 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
            <span>Replay Gate Pass</span>
          </button>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
            {results.length} Statutory Rules Evaluated
          </span>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="relative h-[320px] sm:h-[380px] w-full rounded-xl overflow-hidden bg-gradient-to-b from-[#04060d] via-[#080d1a] to-[#04060d] border border-white/5">
        <Canvas
          camera={{ position: [0, 2.2, 7.5], fov: 48 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <CheckpointScene
            results={results}
            tokenZ={tokenZ}
            blockedZ={firstBlockedIdx !== -1 ? targetBlockedZ : null}
            firstBlockedIdx={firstBlockedIdx}
            selectedIdx={selectedIdx}
            onSelectIdx={(idx) => setSelectedIdx(idx)}
          />
        </Canvas>

        {/* Real-time Status Badge Overlay */}
        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-slate-950/80 border border-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-md">
          <div className={`h-2.5 w-2.5 rounded-full ${firstBlockedIdx === -1 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-ping'}`} />
          <span className="font-mono text-[11px]">
            Action: <strong className="text-emerald-300">{proposedActionName}</strong>
          </span>
        </div>

        {/* Interactive Prompt Overlay */}
        <div className="pointer-events-none absolute bottom-3 inset-x-0 text-center text-[11px] font-mono text-slate-400">
          Click any 3D panel or selector chip below to view underlying legal reasoning & context snapshot
        </div>
      </div>

      {/* Horizontal Rule Selector Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        {results.map((r, idx) => {
          const isBlocked = !r.passed;
          const isSelected = selectedIdx === idx;

          return (
            <button
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`rounded-xl p-3 text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-950/70 border-emerald-400 shadow-inner-card'
                  : isBlocked
                  ? 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400'
                  : 'bg-slate-900/60 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">GATE 0{idx + 1}</span>
                {isBlocked ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                    <XCircle className="h-3 w-3" />
                    BLOCKED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    PASSED
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-white mt-1 truncate">
                {r.rule_cited}
              </div>
            </button>
          );
        })}
      </div>

      {/* Real Audit Data & Legal Reason Overlay Panel */}
      {selectedResult && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-[#0d1424] p-4 text-xs space-y-3 animate-fade-in shadow-glow-emerald">
          <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              {selectedResult.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              )}
              <div>
                <span className="font-bold text-white text-sm">
                  {selectedResult.rule_cited}
                </span>
                <span className="ml-2 text-[10px] font-mono text-slate-400">
                  Checkpoint 0{(selectedIdx ?? 0) + 1} Analysis
                </span>
              </div>
            </div>

            <span className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono ${
              selectedResult.passed
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'bg-rose-950 text-rose-300 border border-rose-700'
            }`}>
              {selectedResult.passed ? 'COMPLIANT' : 'STATUTORY VIOLATION'}
            </span>
          </div>

          {/* Plain-Language Legal Reason */}
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
              Statutory Decision Rationale:
            </span>
            <p className="text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-white/5 font-sans">
              {selectedResult.reason}
            </p>
          </div>

          {/* Real context_snapshot Audit Data */}
          {selectedResult.context_snapshot && (
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 mb-1">
                <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                Raw Audit Context Snapshot:
              </span>
              <pre className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto border border-white/5">
                {JSON.stringify(selectedResult.context_snapshot, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
