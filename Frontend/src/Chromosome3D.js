import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

export const Chromosome3D = ({ chromosomeData }) => {
    const spheresRef = useRef([]);

    const coordinates = useMemo(() => {
        return chromosomeData.map((data) => {
            const x = data.x
            const y = data.y
            const z = data.z
            return new THREE.Vector3(x, y, z);
        });
    }, [chromosomeData]);

    return (
        <Canvas camera={{ position: [0, 0, 100], fov: 75 }}>
            <OrbitControls enableZoom={true} enableRotate={true} enablePan={true} />
            {coordinates.map((coord, index) => (
                <mesh key={index} position={coord} ref={(el) => spheresRef.current.push(el)}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color="blue" />
                </mesh>
            ))}
        </Canvas>
    );
};
