import React, { useMemo, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Button, ColorPicker } from 'antd';
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";

export const Chromosome3D = ({ chromosome3DExampleData }) => {
    const scaleFactor = 0.15;
    const canvasRef = useRef();
    const controlsRef = useRef();

    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [selectedSphereList, setSelectedSphereList] = useState({});

    const coordinates = useMemo(() => {
        return chromosome3DExampleData.map((data) => {
            const x = data.x * scaleFactor;
            const y = data.y * scaleFactor;
            const z = data.z * scaleFactor;
            return new THREE.Vector3(x, y, z);
        });
    }, [chromosome3DExampleData]);

    const download = () => {
        const link = document.createElement('a');
        link.href = canvasRef.current.toDataURL();
        link.download = 'chromosome_3d.png';
        link.click();
    };

    const resetView = () => {
        if (controlsRef.current) {
            controlsRef.current.reset();
        }
    };

    const handleColorChange = (color) => {
        if (selectedIndex !== null) {
            setSelectedSphereList((prev) => ({
                ...prev,
                [selectedIndex]: {
                    color: color.toHexString(),
                    position: {
                        x: coordinates[selectedIndex].x,
                        y: coordinates[selectedIndex].y,
                        z: coordinates[selectedIndex].z,
                    },
                },
            }));
        }
    };

    const handleResetSelect = (index) => {
        if (selectedSphereList[index]?.color) {
            // Reset the sphere's color
            setSelectedSphereList((prev) => {
                const updatedList = { ...prev };
                delete updatedList[index];
                return updatedList;
            });
        } else {
            setSelectedIndex(null);
        }
    };

    return (
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
                <ColorPicker
                    color={selectedSphereList[selectedIndex]?.color || '#ffffff'}
                    disabled={selectedIndex === null}
                    onChange={handleColorChange}
                />
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
                    icon={<DownloadOutlined />}
                    onClick={download}
                />
            </div>
            <Canvas
                ref={canvasRef}
                camera={{ position: [0, 0, 230], fov: 75 }}
                style={{ width: '100%', height: '100%', backgroundColor: '#333' }}
            >
                <OrbitControls
                    ref={controlsRef}
                    enableZoom={true}
                    enableRotate={true}
                    enablePan={true}
                />

                <ambientLight intensity={1} />
                <pointLight position={[10, 20, 10]} intensity={1} />

                {coordinates.map((coord, index) => (
                    <group
                        key={index}
                        position={coord}
                        onPointerOver={(e) => {
                            e.stopPropagation();
                            setHoveredIndex(index);
                        }}
                        onPointerOut={(e) => {
                            e.stopPropagation();
                            setHoveredIndex(null);
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndex(index);
                        }}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleResetSelect(index);
                        }}
                    >
                        {/* Sphere Mesh */}
                        <mesh>
                            <sphereGeometry args={[2.8, 32, 32]} />
                            <meshStandardMaterial
                                color={
                                    selectedSphereList[index]?.color ||
                                    (hoveredIndex === index || selectedIndex === index
                                        ? 'yellow'
                                        : 'red')
                                }
                            />
                        </mesh>
                        {/* Outline Mesh */}
                        <mesh>
                            <sphereGeometry args={[3, 32, 32]} />
                            <meshBasicMaterial color="white" side={THREE.BackSide} />
                        </mesh>
                    </group>
                ))}
            </Canvas>
        </div>
    );
};
