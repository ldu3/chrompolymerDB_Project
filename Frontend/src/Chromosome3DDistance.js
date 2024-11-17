import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Button } from 'antd';
import { Text, OrbitControls } from '@react-three/drei';
import { ReloadOutlined, MinusOutlined } from "@ant-design/icons";

export const Chromosome3DDistance = ({ selectedSphereList, setShowChromosome3DDistance }) => {
    const controlsRef = useRef();

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

    const resetView = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    const handleChromosome3DDistanceClose = () => {
        setShowChromosome3DDistance(false);
    }

    return (
        <>
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {/* Container for buttons */}
                <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    display: 'flex',
                    gap: '10px',
                }}>
                    <Button
                        style={{
                            fontSize: 15,
                            cursor: "pointer",
                        }}
                        icon={<ReloadOutlined />}
                        onClick={resetView}
                    />
                    <Button
                        style={{
                            fontSize: 15,
                            cursor: "pointer",
                        }}
                        icon={<MinusOutlined />}
                        onClick={handleChromosome3DDistanceClose}
                    />
                </div>

                <Canvas style={{ height: 'calc(100% - 2px)', backgroundColor: '#222' }} camera={{ position: [0, 0, 80], fov: 50 }}>

                    {/* Light sources */}
                    <ambientLight intensity={1} />
                    <pointLight position={[10, 20, 10]} intensity={2} />

                    <OrbitControls
                        ref={controlsRef}
                        enableZoom={true}
                        enableRotate={true}
                        enablePan={true}
                    />

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
            </div>
        </>
    );
};
