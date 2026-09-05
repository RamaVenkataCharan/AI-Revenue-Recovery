'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ShieldCheck, ShieldAlert, Play, CheckCircle2, XCircle, Info, ChevronRight, Lock } from 'lucide-react';
import { ComplianceCheckResult } from '../../../compliance/gate';

interface ComplianceGateCheckpoint3DProps {
  results: ComplianceCheckResult[];
  proposedActionName?: string;
  proposedChannelName?: string;
}

/**
 * Individual Semi-Transparent Checkpoint Barrier Gate
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

  // Dynamic panel glow intensity — unified #C8F000 for pass/exempt, #E5484D for blocked
  const glowColor = isPassed ? '#C8F000' : '#E5484D';

  const emissiveIntensity = isTokenAtPanel
    ? (isPassed ? 1.4 : 2.2)
    : hasTokenPassed
    ? 0.5
    : 0.2;

  return (
    <group ref={panelRef} position={position} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Outer Glow Halo Rim */}
      <RoundedBox args={[3.2, 2.2, 0.04]} radius={0.12} smoothness={4}>
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={isSelected ? 0.9 : (isTokenAtPanel ? 0.75 : 0.35)}
          metalness={0.8}
          roughness={0.2}
        />
      </RoundedBox>

      {/* Inner Translucent Glass Screen */}
      <RoundedBox args={[3.0, 2.0, 0.06]} radius={0.1} smoothness={4} position={[0, 0, 0.01]}>
        <meshPhysicalMaterial
          color={isSelected ? '#1A1A1D' : '#141416'}
          roughness={0.15}
          metalness={0.1}
          transmission={0.65}
          transparent
          opacity={0.85}
          reflectivity={0.9}
        />
      </RoundedBox>

      {/* Checkpoint Step Number */}
      <Text
        position={[0, 0.68, 0.06]}
        fontSize={0.13}
        color={glowColor}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
      >
        {`CHECKPOINT 0${index + 1} OF 0${total}`}
      </Text>

      {/* Statutory Rule Code Name */}
      <Text
        position={[0, 0.32, 0.06]}
        fontSize={0.18}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={2.8}
        textAlign="center"
      >
        {(result as any).rule || result.rule_cited}
      </Text>

      {/* Status Pill Badge inside panel */}
      <mesh position={[0, -0.18, 0.05]}>
        <planeGeometry args={[1.8, 0.38]} />
        <meshBasicMaterial
          color={isPassed ? '#C8F000' : '#E5484D'}
          transparent
          opacity={0.18}
        />
      </mesh>

      <Text
        position={[0, -0.18, 0.06]}
        fontSize={0.12}
        color={glowColor}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.06}
      >
        {isPassed ? (isExempt ? 'EXEMPT / PASS' : 'VERIFIED PASS') : 'RULE BLOCKED'}
      </Text>

      {/* Click / Hover Instruction */}
      <Text
        position={[0, -0.65, 0.06]}
        fontSize={0.10}
        color={isSelected ? '#C8F000' : '#A1A1AA'}
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
  const tokenColor = isHalted && isBlocked ? '#E5484D' : '#C8F000';
  const emissiveColor = isHalted && isBlocked ? '#E5484D' : '#C8F000';

  return (
    <group position={[0, 0.35, tokenZ]}>
      {/* Outer Energy Halo */}
      <mesh ref={haloRef}>
        <ringGeometry args={[0.30, 0.40, 24]} />
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
          emissiveIntensity={2.2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Point Light emitted by token */}
      <pointLight color={tokenColor} intensity={2.5} distance={3.5} />
    </group>
  );
}

/**
 * 3D Scene Host — Adjusted perspective angle so at least 2-3 panels are legible
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
  const count = results.length;
  // Panels spaced along Z-axis from Z = 2.2 to Z = -4.2
  const panelPositions = useMemo(() => {
    const startZ = 2.2;
    const endZ = -4.2;
    const step = count > 1 ? (endZ - startZ) / (count - 1) : 0;
    return results.map((_, i) => [0, 0.35, startZ + i * step] as [number, number, number]);
  }, [results, count]);

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[6, 10, 8]} intensity={1.1} />
      <pointLight position={[0, 3.5, 0]} intensity={1.2} color="#C8F000" />

      {/* Runway Floor Grid */}
      <gridHelper
        args={[16, 24, '#C8F000', '#26262A']}
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
  const [tokenZ, setTokenZ] = useState<number>(3.6);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Stable primitive representation of results to prevent effect churn on array identity changes
  const resultsKey = useMemo(
    () => results.map((r) => `${(r as any).rule || r.rule_cited}:${r.passed}`).join(','),
    [results]
  );

  const count = results.length;

  const firstBlockedIdx = useMemo(
    () => results.findIndex((r) => !r.passed),
    [results]
  );

  const panelZPositions = useMemo(() => {
    const startZ = 2.2;
    const endZ = -4.2;
    const step = count > 1 ? (endZ - startZ) / (count - 1) : 0;
    return results.map((_, i) => startZ + i * step);
  }, [count, results]);

  const targetBlockedZ = useMemo(() => {
    return firstBlockedIdx !== -1 && panelZPositions[firstBlockedIdx] !== undefined
      ? panelZPositions[firstBlockedIdx] + 0.35
      : -5.5;
  }, [firstBlockedIdx, panelZPositions]);

  // Persist token position across parent re-renders so it never stutters or resets
  const tokenZRef = useRef<number>(3.6);
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const selectedIdxRef = useRef<number | null>(selectedIdx);
  selectedIdxRef.current = selectedIdx;

  // Reset animation only when the rule evaluation payload actually changes
  useEffect(() => {
    tokenZRef.current = 3.6;
    setTokenZ(3.6);
    setIsPlaying(true);
    setSelectedIdx(null);
  }, [resultsKey]);

  // Stable animation loop driven by performance timestamp
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;
    const speed = 2.2;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (isPlayingRef.current) {
        tokenZRef.current -= delta * speed;

        if (firstBlockedIdx !== -1 && tokenZRef.current <= targetBlockedZ) {
          tokenZRef.current = targetBlockedZ;
          setTokenZ(targetBlockedZ);
          setIsPlaying(false);
          if (selectedIdxRef.current === null) {
            setSelectedIdx(firstBlockedIdx);
          }
          return;
        }

        if (tokenZRef.current < -5.5) {
          tokenZRef.current = 3.6;
        }

        setTokenZ(tokenZRef.current);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, firstBlockedIdx, targetBlockedZ]);

  const handleReplay = () => {
    tokenZRef.current = 3.6;
    setTokenZ(3.6);
    setIsPlaying(true);
    setSelectedIdx(null);
  };

  const selectedResult = selectedIdx !== null ? results[selectedIdx] : null;

  return (
    <div className="rounded-2xl bg-[#141416] p-6 border border-[#26262A] shadow-inner-card">
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#C8F000]" />
            <h2 className="text-base font-bold text-white">
              3D Statutory Compliance Checkpoint
            </h2>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              firstBlockedIdx === -1
                ? 'bg-[#C8F000]/10 text-[#C8F000] border-[#C8F000]/30'
                : 'bg-[#E5484D]/10 text-[#E5484D] border-[#E5484D]/30'
            }`}>
              {firstBlockedIdx === -1 ? 'ALL GATES PASSED' : 'STATUTORY BLOCK DETECTED'}
            </span>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Physical 3D verification: Action token passes compliant rules and strictly deflects at statutory violations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReplay}
            className="flex items-center gap-1.5 rounded-lg border border-[#C8F000]/40 bg-[#C8F000]/10 px-3 py-1.5 text-xs font-bold text-[#C8F000] hover:bg-[#C8F000]/20 transition-all duration-150 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-[#C8F000] text-[#C8F000]" />
            <span>Replay Gate Pass</span>
          </button>
          <span className="text-xs font-mono text-[#A1A1AA] bg-[#1A1A1D] border border-[#26262A] px-2.5 py-1 rounded">
            {results.length} Statutory Rules Evaluated
          </span>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport — Angled camera [2.4, 2.0, 6.6] shows 2-3 receding panels clearly */}
      <div className="relative h-[320px] sm:h-[380px] w-full rounded-xl overflow-hidden bg-[#0A0A0B] border border-[#26262A]">
        <Canvas
          camera={{ position: [2.4, 2.0, 6.6], fov: 46 }}
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
        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-lg bg-[#141416]/90 border border-[#26262A] px-3 py-1.5 text-xs text-white backdrop-blur-md">
          <div className={`h-2.5 w-2.5 rounded-full ${firstBlockedIdx === -1 ? 'bg-[#C8F000] animate-pulse' : 'bg-[#E5484D] animate-ping'}`} />
          <span className="font-mono text-[11px]">
            Action: <strong className="text-[#C8F000]">{proposedActionName}</strong>
          </span>
        </div>

        {/* Interactive Prompt Overlay */}
        <div className="pointer-events-none absolute bottom-3 inset-x-0 text-center text-[11px] font-mono text-[#A1A1AA]">
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
              className={`rounded-xl p-3 text-left border transition-colors duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[#141416] border-[#C8F000] shadow-glow-accent'
                  : isBlocked
                  ? 'bg-[#141416] border-[#E5484D]/40 hover:border-[#E5484D]'
                  : 'bg-[#141416] border-[#26262A] hover:border-[#26262A]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#A1A1AA]">GATE 0{idx + 1}</span>
                {isBlocked ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#E5484D]">
                    <XCircle className="h-3 w-3" />
                    BLOCKED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#C8F000]">
                    <CheckCircle2 className="h-3 w-3" />
                    PASSED
                  </span>
                )}
              </div>
              <div className="text-xs font-mono font-bold text-white mt-1 truncate">
                {(r as any).rule || r.rule_cited}
              </div>
            </button>
          );
        })}
      </div>

      {/* Audit Detail Drawer for Selected Panel */}
      {selectedResult && (
        <div className="mt-4 rounded-xl bg-[#1A1A1D] border border-[#26262A] p-4 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#26262A] pb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#C8F000]">
                {(selectedResult as any).rule || selectedResult.rule_cited}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                selectedResult.passed
                  ? 'bg-[#C8F000]/10 text-[#C8F000]'
                  : 'bg-[#E5484D]/10 text-[#E5484D]'
              }`}>
                {selectedResult.passed ? 'PASSED / EXEMPT' : 'STATUTORY BLOCK'}
              </span>
            </div>
            <button
              onClick={() => setSelectedIdx(null)}
              className="text-[#A1A1AA] hover:text-white cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-[#A1A1AA] leading-relaxed">
            {selectedResult.reason}
          </p>

          {selectedResult.context_snapshot && (
            <div className="rounded-lg bg-[#141416] p-3 border border-[#26262A]">
              <div className="text-[10px] font-mono text-[#6B6B70] uppercase mb-1">
                Context Snapshot Evaluated
              </div>
              <pre className="num-mono text-[11px] text-[#A1A1AA] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(selectedResult.context_snapshot, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
