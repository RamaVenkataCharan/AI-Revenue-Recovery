'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

interface NodeDef {
  id: string;
  label: string;
  sublabel?: string;
  position: [number, number, number];
  color: string;
  glowColor: string;
  radius: number;
}

const NODES: NodeDef[] = [
  { id: 'customer', label: 'Customer', sublabel: 'UPI / Card', position: [-4.6, 0.9, 0], color: '#1A1A1D', glowColor: '#6B6B70', radius: 0.32 },
  { id: 'checkout', label: 'Checkout', sublabel: 'Mandate Setup', position: [-2.8, 0.9, 0], color: '#1A1A1D', glowColor: '#6B6B70', radius: 0.32 },
  { id: 'payment', label: 'Payment', sublabel: 'Payment Gateway', position: [-1.0, 0.9, 0], color: '#1A1A1D', glowColor: '#6B6B70', radius: 0.34 },
  { id: 'subscription', label: 'Subscription', sublabel: 'Autopay Debit', position: [0.8, 0.9, 0], color: '#1A1A1D', glowColor: '#6B6B70', radius: 0.36 },
  { id: 'invoice', label: 'Healthy Invoice', sublabel: 'Settled Direct', position: [2.6, 0.9, 0], color: '#1A1A1D', glowColor: '#6B6B70', radius: 0.32 },
  
  // Deflected Recovery Loop
  { id: 'at_risk', label: 'At Risk (Leak)', sublabel: 'Decline / Timeout', position: [0.8, -1.2, 0.1], color: '#1A1A1D', glowColor: '#E5484D', radius: 0.35 },
  { id: 'ai_recovery', label: 'AI Recovery Agent', sublabel: 'Hinglish & Gateway', position: [2.7, -1.2, 0.1], color: '#141416', glowColor: '#C8F000', radius: 0.40 },
  { id: 'recovered', label: 'Recovered Revenue', sublabel: 'Attributed Settled', position: [4.6, -0.15, 0], color: '#141416', glowColor: '#C8F000', radius: 0.42 },
];

/**
 * 3D Node Sphere with label
 */
function SystemNode({ node }: { node: NodeDef }) {
  const isSpecial = node.id === 'ai_recovery' || node.id === 'recovered' || node.id === 'at_risk';
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (pulseRef.current && isSpecial) {
      pulseRef.current.rotation.z += delta * 1.5;
    }
  });

  return (
    <group position={node.position}>
      {/* Node Sphere Core */}
      <mesh>
        <sphereGeometry args={[node.radius, 24, 24]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.glowColor}
          emissiveIntensity={isSpecial ? 1.1 : 0.3}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Orbiting Ring for Special Nodes */}
      {isSpecial && (
        <mesh ref={pulseRef} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[node.radius + 0.1, 0.02, 12, 32]} />
          <meshBasicMaterial
            color={node.glowColor}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Primary Label */}
      <Text
        position={[0, node.radius + 0.28, 0]}
        fontSize={0.16}
        color="#FFFFFF"
        anchorX="center"
        anchorY="bottom"
        fontWeight="bold"
      >
        {node.label}
      </Text>

      {/* Sublabel / Metric */}
      {node.sublabel && (
        <Text
          position={[0, -node.radius - 0.26, 0]}
          fontSize={0.11}
          color="#A1A1AA"
          anchorX="center"
          anchorY="top"
        >
          {node.sublabel}
        </Text>
      )}
    </group>
  );
}

/**
 * Connecting Flow Path Lines
 */
function FlowPaths() {
  const ingestionPoints = useMemo(() => [
    new THREE.Vector3(-4.6, 0.9, 0),
    new THREE.Vector3(-2.8, 0.9, 0),
    new THREE.Vector3(-1.0, 0.9, 0),
    new THREE.Vector3(0.8, 0.9, 0),
  ], []);

  const healthyPoints = useMemo(() => [
    new THREE.Vector3(0.8, 0.9, 0),
    new THREE.Vector3(2.6, 0.9, 0),
    new THREE.Vector3(4.6, -0.15, 0),
  ], []);

  const recoveryCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.8, 0.9, 0),
      new THREE.Vector3(0.8, -1.2, 0.1),
      new THREE.Vector3(2.7, -1.2, 0.1),
      new THREE.Vector3(4.6, -0.15, 0),
    ]);
  }, []);

  const recoveryPoints = useMemo(() => recoveryCurve.getPoints(40), [recoveryCurve]);

  return (
    <>
      {/* Ingestion Path */}
      <primitive object={new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ingestionPoints),
        new THREE.LineBasicMaterial({ color: '#26262A', linewidth: 2 })
      )} />

      {/* Healthy Direct Path */}
      <primitive object={new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(healthyPoints),
        new THREE.LineBasicMaterial({ color: '#26262A', linewidth: 2 })
      )} />

      {/* Deflected Recovery Channel */}
      <primitive object={new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(recoveryPoints),
        new THREE.LineBasicMaterial({ color: '#C8F000', transparent: true, opacity: 0.65, linewidth: 2 })
      )} />
    </>
  );
}

/**
 * Animated Flowing Particles
 */
function RevenueParticles({ onRecoverToken }: { onRecoverToken: (amount: number) => void }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 28;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const healthyPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.6, 0.9, 0),
    new THREE.Vector3(-2.8, 0.9, 0),
    new THREE.Vector3(-1.0, 0.9, 0),
    new THREE.Vector3(0.8, 0.9, 0),
    new THREE.Vector3(2.6, 0.9, 0),
    new THREE.Vector3(4.6, -0.15, 0),
  ]), []);

  const deflectedPath = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.6, 0.9, 0),
    new THREE.Vector3(-2.8, 0.9, 0),
    new THREE.Vector3(-1.0, 0.9, 0),
    new THREE.Vector3(0.8, 0.9, 0),
    new THREE.Vector3(0.8, -1.2, 0.1),
    new THREE.Vector3(2.7, -1.2, 0.1),
    new THREE.Vector3(4.6, -0.15, 0),
  ]), []);

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const isFailed = i % 2.4 < 1.0;
      return {
        id: i,
        offset: i / particleCount,
        speed: 0.22 + (i % 3) * 0.03,
        isFailed,
        progress: i / particleCount,
        amount: [999, 1499, 3999, 6999, 12500, 32000][i % 6],
        hasIncremented: false,
      };
    });
  }, [particleCount]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    particles.forEach((p, i) => {
      p.progress = (p.progress + delta * p.speed) % 1.0;

      const path = p.isFailed ? deflectedPath : healthyPath;
      const point = path.getPoint(p.progress);

      dummy.position.copy(point);

      if (p.isFailed) {
        if (p.progress > 0.42 && p.progress < 0.72) {
          dummy.scale.set(0.12, 0.12, 0.12);
        } else if (p.progress >= 0.72) {
          dummy.scale.set(0.14, 0.14, 0.14);
          if (!p.hasIncremented && p.progress > 0.95) {
            p.hasIncremented = true;
            onRecoverToken(p.amount);
          }
        } else {
          dummy.scale.set(0.10, 0.10, 0.10);
        }
      } else {
        dummy.scale.set(0.10, 0.10, 0.10);
      }

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[1, 14, 14]} />
      <meshStandardMaterial
        color="#C8F000"
        emissive="#C8F000"
        emissiveIntensity={1.4}
        roughness={0.2}
        metalness={0.8}
      />
    </instancedMesh>
  );
}

function RevenueFlowScene({ onRecoverToken }: { onRecoverToken: (amount: number) => void }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 6, 8]} intensity={1.1} />
      <pointLight position={[2.7, -1.2, 1.5]} intensity={2.0} color="#C8F000" />
      <pointLight position={[0.8, -1.2, 1.5]} intensity={1.2} color="#E5484D" />

      {/* Nodes */}
      {NODES.map((n) => (
        <SystemNode key={n.id} node={n} />
      ))}

      {/* Path Geometry */}
      <FlowPaths />

      {/* Active Flowing Particles */}
      <RevenueParticles onRecoverToken={onRecoverToken} />
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

export default function RevenueFlow3D() {
  const [recoveredTotal, setRecoveredTotal] = useState(148500);

  const handleRecoverToken = (amount: number) => {
    setRecoveredTotal((prev) => prev + amount);
  };

  return (
    <div className="w-full rounded-2xl bg-[#141416] border border-[#26262A] p-6 shadow-sm">
      {/* HUD Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-[#26262A]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#C8F000] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A1A1AA]">
              Autonomous Recovery Stream
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            UPI AutoPay & Card Mandate Continuous Ingestion
          </h3>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono font-bold text-[#6B6B70] tracking-wider">
              Simulated Settled Revenue
            </div>
            <div
              className="text-xl sm:text-2xl font-black text-[#C8F000]"
              style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}
            >
              {formatINR(recoveredTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="relative h-[340px] sm:h-[400px] w-full rounded-xl bg-[#0A0A0B] border border-[#26262A] overflow-hidden">
        <Canvas
          camera={{ position: [0, 0.2, 6.6], fov: 48 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
        >
          <RevenueFlowScene onRecoverToken={handleRecoverToken} />
        </Canvas>

        {/* Legend Overlay */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 bg-[#141416]/90 border border-[#26262A] px-3 py-1.5 rounded-lg text-[11px] text-white backdrop-blur-sm font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#6B6B70]" />
            Healthy Debit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#E5484D]" />
            Decline Deflection
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#C8F000]" />
            AI Recovered
          </span>
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3 text-[10px] font-mono text-[#6B6B70]">
          Three.js Native Primitives
        </div>
      </div>

      {/* Regulatory Context Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 pt-3 border-t border-[#26262A] text-xs text-[#A1A1AA]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#C8F000]" />
          <span>Real-time autonomous gating: RBI 3-retry cap & TRAI quiet hours (21:00–09:00 IST) enforced</span>
        </div>
        <span className="text-[11px] font-mono text-[#6B6B70]">
          Batch Model Simulation
        </span>
      </div>
    </div>
  );
}
