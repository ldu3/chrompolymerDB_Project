import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';

export const Chromosome3D = ({ chromosome3DExampleData }) => {
    const spheresRef = useRef([]);
    const scaleFactor = 0.15;

    const coordinates = useMemo(() => {
        return chromosome3DExampleData.map((data) => {
            const x = data.x * scaleFactor
            const y = data.y * scaleFactor
            const z = data.z * scaleFactor
            return new THREE.Vector3(x, y, z);
        });
    }, [chromosome3DExampleData]);

    return (
        <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
            <OrbitControls enableZoom={true} enableRotate={true} enablePan={true} />
            
            <ambientLight intensity={1} />
            <pointLight position={[10, 20, 10]} intensity={1} />

            {coordinates.map((coord, index) => (
                <group key={index} position={coord}>
                    {/* Sphere Mesh */}
                    <mesh ref={(el) => spheresRef.current.push(el)}>
                        <sphereGeometry args={[2.8, 32, 32]} />
                        <meshStandardMaterial color="red" />
                    </mesh>
                    {/* Outline Mesh */}
                    <mesh>
                        <sphereGeometry args={[2.9, 32, 32]} />
                        <meshBasicMaterial color="black" side={THREE.BackSide} />
                    </mesh>
                </group>
            ))}
        </Canvas>
    );
};
