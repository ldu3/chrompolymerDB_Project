import React, { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Button } from 'antd';
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";

export const Chromosome3D = ({ chromosome3DExampleData }) => {
    const spheresRef = useRef([]);
    const scaleFactor = 0.15;
    const canvasRef = useRef();
    const controlsRef = useRef();

    const coordinates = useMemo(() => {
        return chromosome3DExampleData.map((data) => {
            const x = data.x * scaleFactor;
            const y = data.y * scaleFactor;
            const z = data.z * scaleFactor;
            return new THREE.Vector3(x, y, z);
        });
    }, [chromosome3DExampleData]);

    const download = () => {
        // Function to handle download, for example exporting the canvas as an image
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

    return (
        <div style={{ width: '70%', height: '100%', position: 'relative' }}>
            {/* Container for buttons */}
            <div style={{
                position: 'absolute',
                top: 3,
                right: 3,
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
                    icon={<DownloadOutlined />}
                    onClick={download}
                />
            </div>
            <Canvas
                ref={canvasRef}
                camera={{ position: [0, 0, 280], fov: 75 }}
                style={{ width: '100%', height: '100%' }}
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
        </div>
    );
};
