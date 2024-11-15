import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export const Chromosome3D = ({ coordinates }) => {
    const spheresRef = useRef([]);

    return (
        <Canvas camera={{ position: [0, 0, 100], fov: 75 }}>
            {coordinates.map((coord, index) => (
                <mesh key={index} position={coord} ref={(el) => spheresRef.current.push(el)}>
                    <sphereGeometry args={[1, 32, 32]} />
                    <meshStandardMaterial color="blue" />
                </mesh>
            ))}
        </Canvas>
    );
};

// 示例：传递球的XYZ坐标
const chromosomeCoordinates = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(5, 0, 0),
    new THREE.Vector3(10, 5, 0),
    new THREE.Vector3(15, 5, 5),
    // 更多坐标
];
