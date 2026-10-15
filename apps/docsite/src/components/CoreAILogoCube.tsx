// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { EffectComposer } from '@react-three/postprocessing';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { Group } from 'three';
import { useThemeMode } from '../theme/ThemeProvider';
import { PaperDithering } from './paper-dithering';
import { PaperHeatmap } from './paper-heatmap';

const logoSettings = {
  scale: 1.19 * 1.25,
  offsetX: -153,
  offsetY: -22,
  rotationX: 0,
  rotationY: -23,
  rotationZ: 19,
};
const cameraPosition: [number, number, number] = [
  3.0967670704970103, 2.0826610881056165, 5.922208752076898,
];

const logoFacePositions = [
  { cell: 1, x: -1, y: 1 },
  { cell: 3, x: 1, y: 1 },
  { cell: 5, x: 0, y: 0 },
  { cell: 7, x: -1, y: -1 },
  { cell: 9, x: 1, y: -1 },
] as const;
const logoPositions = logoFacePositions.map(({ cell, x, y }) => ({
  id: `${cell}`,
  // Overlap the rounded corners slightly so they meet without a see-through seam.
  position: [x * 0.94, y * 0.94, 0] as const,
}));

function useCanvasRuntime() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isInViewport, setIsInViewport] = React.useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = React.useState(() => !document.hidden);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      setIsInViewport(entry.isIntersecting);
    });
    intersectionObserver.observe(container);

    return () => {
      intersectionObserver.disconnect();
    };
  }, []);

  React.useEffect(() => {
    const updateDocumentVisibility = () => setIsDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateDocumentVisibility);
    return () => document.removeEventListener('visibilitychange', updateDocumentVisibility);
  }, []);

  return {
    containerRef,
    shouldRender: isInViewport && isDocumentVisible,
  };
}

function StaticLighting({ monochrome = false }: { monochrome?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.22} />
      <hemisphereLight args={['#FFFFFF', monochrome ? '#090909' : '#09070D', 0.6]} />
      <pointLight position={[-4.5, 5.5, 8]} intensity={110} distance={24} decay={2} />
      <directionalLight
        position={[4, -3, 2]}
        intensity={0.25}
        color={monochrome ? '#FFFFFF' : '#D8C9FF'}
      />
      <directionalLight position={[-2, 4, -5]} intensity={0.65} />
    </>
  );
}

function LogoCubeMesh({
  reduceMotion,
  onReady,
  color,
}: {
  reduceMotion: boolean;
  onReady: () => void;
  color: string;
}) {
  const groupRef = React.useRef<Group>(null);
  const startupFramesRef = React.useRef(0);
  const animationTimeRef = React.useRef(0);
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);

  React.useLayoutEffect(() => {
    camera.zoom = width * 0.2;
    camera.updateProjectionMatrix();
  }, [camera, width]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Wait until the composer has rendered a complete frame before revealing the canvas.
    if (startupFramesRef.current < 2 && ++startupFramesRef.current === 2) onReady();
    if (!reduceMotion) animationTimeRef.current += Math.min(delta, 0.1);
    const animationTime = animationTimeRef.current;
    const accelerationTime = 1.3;
    const progress = 1 - Math.exp(-animationTime / accelerationTime);
    const rotationSpeed = 0.18 * 0.67 * 0.67;

    const radians = Math.PI / 180;
    groupRef.current.rotation.x = 0.34 * progress + logoSettings.rotationX * radians;
    groupRef.current.rotation.y =
      -rotationSpeed *
        (animationTime - accelerationTime * (1 - Math.exp(-animationTime / accelerationTime))) +
      logoSettings.rotationY * radians;
    groupRef.current.rotation.z = 0.04 * progress + logoSettings.rotationZ * radians;
  });

  return (
    <group ref={groupRef}>
      {logoPositions.map(({ id, position }) => (
        <RoundedBox
          key={id}
          position={position}
          args={[1, 1, 1]}
          radius={0.035}
          smoothness={3}
          creaseAngle={0.75}
        >
          <meshPhysicalMaterial
            color={color}
            clearcoat={0.08}
            clearcoatRoughness={0.55}
            metalness={0}
            roughness={0.58}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

export function CoreAILogoCube({ monochrome = false }: { monochrome?: boolean }) {
  const { mode } = useThemeMode();
  const { containerRef, shouldRender } = useCanvasRuntime();
  const [isReady, setIsReady] = React.useState(false);
  const handleReady = React.useCallback(() => setIsReady(true), []);
  const reduceMotion = React.useMemo(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const style = {
    '--logo-scale': logoSettings.scale,
    '--logo-offset-x': `${logoSettings.offsetX}px`,
    '--logo-offset-y': `${logoSettings.offsetY}px`,
  } as React.CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`coreai-logo-cube${monochrome ? ' coreai-logo-cube--mini' : ''}`}
      data-ready={isReady}
      style={style}
      role="img"
      aria-label="Interactive 3D CoreAI cube logo"
      title={monochrome ? 'Drag to rotate' : undefined}
    >
      <Canvas
        flat
        orthographic
        camera={{ position: cameraPosition, zoom: 36 }}
        dpr={[1, 2]}
        frameloop={shouldRender ? 'always' : 'never'}
        gl={{ alpha: true, antialias: true }}
      >
        <StaticLighting monochrome={monochrome} />
        <LogoCubeMesh
          reduceMotion={reduceMotion}
          onReady={handleReady}
          color={monochrome && mode === 'light' ? '#242424' : '#FFFFFF'}
        />
        {monochrome ? (
          <EffectComposer multisampling={0}>
            <PaperDithering />
          </EffectComposer>
        ) : (
          <EffectComposer multisampling={0}>
            <PaperHeatmap reduceMotion={reduceMotion} lightMode={mode === 'light'} />
            <PaperDithering />
          </EffectComposer>
        )}
        <OrbitControls enableDamping dampingFactor={0.08} enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
