import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Stats } from '@react-three/drei';

export const Chromosome3DDistance = ({ selectedSphereList }) => {
    const spheresData = useMemo(() => {
        return Object.values(selectedSphereList).map(({ position, color }) => {
            const { x, y, z } = position;
            return {
                position: new THREE.Vector3(x, y, z),
                color,
            };
        });
    }, [selectedSphereList]);

    // Calculate distance between two points
    const calculateDistance = (pointA, pointB) => {
        return pointA.distanceTo(pointB);
    };

    return (
        <Canvas style={{ height: '100%', backgroundColor: '#222' }} camera={{ position: [0, 0, 100], fov: 75 }}>

            {/* Light sources */}
            <ambientLight intensity={1} />
            <pointLight position={[10, 20, 10]} intensity={2} />

            <OrbitControls />

            {/* Render spheres with their respective colors */}
            {spheresData.map(({ position, color }, index) => {
                return (
                    <group
                        key={index}
                        position={position}
                    >
                        <mesh>
                            <sphereGeometry args={[2.5, 32, 32]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                        <mesh>
                            <sphereGeometry args={[2.7, 32, 32]} />
                            <meshBasicMaterial color="white" side={THREE.BackSide} />
                        </mesh>
                    </group>
                );
            })}

            {/* Draw lines and distances between spheres */}
            {spheresData.map(({ position: positionA }, indexA) => {
                return spheresData.map(({ position: positionB }, indexB) => {
                    if (indexA < indexB) {
                        const distance = calculateDistance(positionA, positionB);
                        const midPoint = new THREE.Vector3()
                            .addVectors(positionA, positionB)
                            .multiplyScalar(0.5);

                        return (
                            <group key={`${indexA}-${indexB}`}>
                                <line>
                                    <bufferGeometry>
                                        <bufferAttribute
                                            attach="attributes-position"
                                            count={2}
                                            array={new Float32Array([
                                                positionA.x, positionA.y, positionA.z,
                                                positionB.x, positionB.y, positionB.z,
                                            ])}
                                            itemSize={3}
                                        />
                                    </bufferGeometry>
                                    <lineBasicMaterial color="white" />
                                </line>
                                {/* Distance Text */}
                                <Text
                                    position={[midPoint.x, midPoint.y, midPoint.z]}
                                    fontSize={5}
                                    color="white"
                                    anchorX="center"
                                    anchorY="middle"
                                >
                                    {distance.toFixed(2)}
                                </Text>
                            </group>
                        );
                    }
                    return null;
                });
            })}
        </Canvas>
    );
};
