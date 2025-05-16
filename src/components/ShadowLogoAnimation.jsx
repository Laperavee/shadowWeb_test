// src/pages/LogoPreview.jsx
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, CubicBezierCurve3, Vector3, BufferGeometry, Float32BufferAttribute, PointsMaterial, Points } from 'three';
import { useRef, useMemo, useState, useEffect } from 'react';
import logo from '../assets/image_token.png';

function TokenScene() {
  const meshRef = useRef();
  const [logoTexture, setLogoTexture] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const texture = new TextureLoader().load(logo, undefined, undefined, (err) => {
        console.error('Error loading texture:', err);
        setError(err);
      });
      texture.rotation = Math.PI / 2;
      texture.center.set(0.5, 0.5);
      setLogoTexture(texture);
    } catch (err) {
      console.error('Error initializing texture:', err);
      setError(err);
    }
  }, []);

  const curves = useMemo(() => {
    const inCurve = new CubicBezierCurve3(
      new Vector3(0, 0, 0),
      new Vector3(0.20, 0, 0),
      new Vector3(0.50, -1.0, 0),
      new Vector3(1, -1.0, 0)
    );

    const outCurve = new CubicBezierCurve3(
      new Vector3(0, -1.0, 0),
      new Vector3(0.50, -1.0, 0),
      new Vector3(0.80, 0, 0),
      new Vector3(1, 0, 0)
    );

    return { inCurve, outCurve };
  }, []);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 0.01;
      
      const time = clock.getElapsedTime();
      const cycle = (Math.sin(time) + 1) / 2;
      
      const y = cycle < 0.5 
        ? curves.inCurve.getPoint(cycle * 2).y
        : curves.outCurve.getPoint((cycle - 0.5) * 2).y;
      
      meshRef.current.position.y = y;
    }
  });

  if (error) {
    return null;
  }

  return (
    <group ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[1.5, 1.5, 0.3, 64]} />
        {logoTexture && (
          <>
            <meshBasicMaterial attach="material-2" map={logoTexture} transparent />
            <meshBasicMaterial attach="material-1" map={logoTexture} transparent />
          </>
        )}
        <meshBasicMaterial attach="material-0" color={0x430070} metalness={0.8} roughness={0.5}/>
      </mesh>
    </group>
  );
}

const ShadowLogoAnimation = ({ size = 160, className = '' }) => {
  const [error, setError] = useState(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  if (error || !webglSupported) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size * 1.5, height: size * 1.5 }}>
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600/30 to-cyan-500/30 flex items-center justify-center border border-purple-500/20">
          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            S
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: size * 1.5, height: size * 1.5 }}>
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 50 }} 
        style={{ width: size * 1.5, height: size * 1.5 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(window.devicePixelRatio);
          gl.setSize(size * 1.5, size * 1.5);
        }}
        onError={(err) => {
          console.error('WebGL error:', err);
          setError(err);
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <TokenScene />
      </Canvas>
    </div>
  );
};

export { ShadowLogoAnimation };