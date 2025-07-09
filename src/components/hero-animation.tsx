'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, PresentationControls, Float, Environment } from '@react-three/drei'

function CodeScreen() {
    return (
        <div className="bg-[#2C3333]/80 backdrop-blur-sm text-[10px] text-white p-4 rounded-xl overflow-hidden font-code w-[600px] h-[400px] border-2 border-primary/20 shadow-2xl shadow-primary/20">
            <div className="flex items-center gap-1.5 px-2 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <pre>
                <code className="text-xs">
                    <span style={{ color: '#80d4ff' }}>{`// Welcome to CodeVerse!`}</span>{'\n'}
                    <span style={{ color: '#c586c0' }}>import</span> {`{ Button }`} <span style={{ color: '#c586c0' }}>from</span> <span style={{ color: '#ce9178' }}>'@/components/ui/button'</span>;{'\n\n'}

                    <span style={{ color: '#4ec9b0' }}>function</span> <span style={{ color: '#dcdcaa' }}>HeroComponent</span>() {'{\n'}
                    {'  '}<span style={{ color: '#c586c0' }}>return</span> ({'\n'}
                    {'    '}&lt;<span style={{ color: '#e55a5a' }}>div</span> <span style={{ color: '#9cdcfe' }}>className</span>=<span style={{ color: '#ce9178' }}>"text-center"</span>&gt;{'\n'}
                    {'      '}&lt;<span style={{ color: '#e55a5a' }}>h1</span>&gt;Your IDE in the Cloud&lt;/<span style={{ color: '#e55a5a' }}>h1</span>&gt;{'\n'}
                    {'      '}&lt;<span style={{ color: '#e55a5a' }}>p</span>&gt;Powered by Next.js and AI.&lt;/<span style={{ color: '#e55a5a' }}>p</span>&gt;{'\n'}
                    {'      '}&lt;<span style={{ color: '#4ec9b0' }}>Button</span>&gt;Get Started&lt;/<span style={{ color: '#4ec9b0' }}>Button</span>&gt;{'\n'}
                    {'    '}&lt;/<span style={{ color: '#e55a5a' }}>div</span>&gt;{'\n'}
                    {'  '});{'\n'}
                    {'}'}
                </code>
            </pre>
        </div>
    );
}


export function HeroAnimation() {
    return (
        <Canvas
            flat
            camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 2000 }}
            dpr={[1, 2]}
        >
            <Suspense fallback={null}>
                <Environment preset="city" />
                <PresentationControls
                    global
                    rotation={[0.1, -0.2, 0]}
                    polar={[-0.3, 0.3]}
                    azimuth={[-0.5, 0.5]}
                    config={{ mass: 2, tension: 400 }}
                    snap={{ mass: 4, tension: 400 }}
                >
                    <Float rotationIntensity={0.3} floatIntensity={1}>
                        <rectAreaLight
                            width={3}
                            height={3}
                            intensity={5}
                            color={'#00FFFF'}
                            rotation={[0.1, Math.PI, 0]}
                            position={[0, 0.5, -1]}
                        />
                        <mesh>
                            {/* This plane is just a container for the HTML, it's invisible */}
                            <planeGeometry args={[4.5, 3]} />
                            <meshStandardMaterial color="#fff" transparent opacity={0} />
                            <Html
                                transform
                                wrapperClass="hero-screen"
                                distanceFactor={1}
                                position={[0, 0, 0.1]}
                                occlude
                            >
                                <CodeScreen />
                            </Html>
                        </mesh>
                    </Float>
                </PresentationControls>
            </Suspense>
        </Canvas>
    );
}
