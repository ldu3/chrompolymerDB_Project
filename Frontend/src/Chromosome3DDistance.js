import React, { useMemo, useRef, useEffect } from 'react';
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
                position: new THREE.Vector3(x / 0.15, y / 0.15, z / 0.15),
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

    const Line = ({ start, end }) => {
        const geometryRef = useRef();
    
        useEffect(() => {
            if (geometryRef.current) {
                geometryRef.current.setAttribute(
                    'position',
                    new THREE.Float32BufferAttribute([
                        start.x, start.y, start.z,
                        end.x, end.y, end.z,
                    ], 3)
                );
            }
        }, [start, end]);
    
        return (
            <line>
                <bufferGeometry ref={geometryRef} />
                <lineBasicMaterial color="white" />
            </line>
        );
    };

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

                <Canvas shadows style={{ height: 'calc(100% - 2px)', backgroundColor: '#222' }} camera={{ position: [150, 50, 20], fov: 50 }}>

                    <OrbitControls
                        ref={controlsRef}
                        enableZoom={true}
                        enableRotate={true}
                        enablePan={true}
                    />

                    {/* Light sources */}
                    <ambientLight intensity={0.8} />
                    <directionalLight
                        position={[10, 20, 10]}
                        intensity={1}
                        castShadow
                    />
                    <spotLight
                        position={[30, 50, 50]}
                        angle={0.3}
                        penumbra={1}
                        intensity={1}
                        castShadow
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
                                    <meshStandardMaterial 
                                        receiveShadow
                                        castShadow
                                        color={color}
                                        metalness={0.3}
                                        roughness={0.1}
                                        emissiveIntensity={0.3} />
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
                                        {/* Line */}
                                        <Line start={positionA} end={positionB} />

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
