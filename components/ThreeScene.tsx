
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const DynamicBlob = () => {
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <Sphere args={[1, 64, 64]} scale={15}>
        <MeshDistortMaterial
          color="#3b82f6"
          speed={2}
          distort={0.4}
          radius={1}
          metalness={0.4}
          roughness={0.4}
          transparent
          opacity={0.8}
        />
      </Sphere>
    </Float>
  );
};

const NeuralNetwork = () => {
  const pointsRef = useRef<THREE.Points>(null!);
  const lineRef = useRef<THREE.LineSegments>(null!);
  const count = 100;

  // Generate random positions
  const [positions, stepPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const step = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;

      step[i * 3] = (Math.random() - 0.5) * 0.01;
      step[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      step[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return [pos, step];
  }, []);

  useFrame((state) => {
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const linePosAttr = lineRef.current.geometry.attributes.position as THREE.BufferAttribute;

    let lineIdx = 0;
    const maxLineDist = 2.5;

    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] += stepPositions[i * 3];
      posAttr.array[i * 3 + 1] += stepPositions[i * 3 + 1];
      posAttr.array[i * 3 + 2] += stepPositions[i * 3 + 2];

      // Bounce off boundaries
      if (Math.abs(posAttr.array[i * 3]) > 5) stepPositions[i * 3] *= -1;
      if (Math.abs(posAttr.array[i * 3 + 1]) > 5) stepPositions[i * 3 + 1] *= -1;
      if (Math.abs(posAttr.array[i * 3 + 2]) > 5) stepPositions[i * 3 + 2] *= -1;

      // Mouse interaction (subtle)
      const mouseX = state.mouse.x * 5;
      const mouseY = state.mouse.y * 5;
      const dx = posAttr.array[i * 3] - mouseX;
      const dy = posAttr.array[i * 3 + 1] - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2) {
        posAttr.array[i * 3] += dx * 0.01;
        posAttr.array[i * 3 + 1] += dy * 0.01;
      }
    }

    // Dynamic Connections
    const linesArr = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = posAttr.array[i * 3] - posAttr.array[j * 3];
        const dy = posAttr.array[i * 3 + 1] - posAttr.array[j * 3 + 1];
        const dz = posAttr.array[i * 3 + 2] - posAttr.array[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < maxLineDist) {
          linesArr.push(
            posAttr.array[i * 3], posAttr.array[i * 3 + 1], posAttr.array[i * 3 + 2],
            posAttr.array[j * 3], posAttr.array[j * 3 + 1], posAttr.array[j * 3 + 2]
          );
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linesArr, 3));
    lineRef.current.geometry = lineGeometry;

    posAttr.needsUpdate = true;
    pointsRef.current.rotation.y += 0.001;
    lineRef.current.rotation.y += 0.001;
  });

  return (
    <group>
      <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#3b82f6"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
      <lineSegments ref={lineRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#3b82f6" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </lineSegments>
    </group>
  );
};

export const ThreeScene: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        <DynamicBlob />
        <NeuralNetwork />
      </Canvas>
    </div>
  );
};
