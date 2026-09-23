import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type RoomTheme = 'cyber-studio' | 'aurora-penthouse' | 'matrix-grid';

interface ThreeStudioRoomBackgroundProps {
  initialTheme?: RoomTheme;
  interactive?: boolean;
  intensity?: 'subtle' | 'vibrant';
}

export const ThreeStudioRoomBackground: React.FC<ThreeStudioRoomBackgroundProps> = ({
  initialTheme = 'cyber-studio',
  interactive = true,
  intensity = 'subtle',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<RoomTheme>(initialTheme);
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050508, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 24);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Fluorescent color palettes for room themes (Hyper-vibrant fluorescent pink, purple, teal)
    const themePalettes = {
      'cyber-studio': {
        primary: 0x00FFE0,   // Fluorescent Electric Teal
        secondary: 0xE056FD, // Fluorescent Ultra Violet / Magenta
        accent: 0xFF007F,    // Fluorescent Hot Pink
        ambient: 0x080612,
        floorGrid: 0x00FFE0,
        wallEdge: 0xD946EF,
        beamColor: 0xFF007F,
      },
      'aurora-penthouse': {
        primary: 0xFF007F,   // Fluorescent Neon Pink
        secondary: 0x00FFE0, // Fluorescent Teal
        accent: 0xC084FC,    // Fluorescent Purple
        ambient: 0x080310,
        floorGrid: 0xFF007F,
        wallEdge: 0x00FFE0,
        beamColor: 0xC084FC,
      },
      'matrix-grid': {
        primary: 0xD946EF,   // Fluorescent Vivid Purple
        secondary: 0x00FFE0, // Fluorescent Teal
        accent: 0xFF1493,    // Fluorescent Deep Pink
        ambient: 0x05030e,
        floorGrid: 0xD946EF,
        wallEdge: 0xFF007F,
        beamColor: 0x00FFE0,
      }
    };

    const palette = themePalettes[theme];

    // ROOT 3D ROOM GROUP
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // 1. ARCHITECTURAL 3D ROOM BOUNDARIES (Floor, Ceiling, Back Wall, Side Panels)
    const roomWidth = 50;
    const roomDepth = 70;
    const roomHeight = 22;

    // Floor (Reflective dark plane with glowing fluorescent grid overlay)
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x06060c,
      roughness: 0.15,
      metalness: 0.9,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -4;
    floorMesh.position.z = -10;
    roomGroup.add(floorMesh);

    // Grid Floor Helper (Perspective depth fluorescent teal & pink grid lines)
    const gridHelper = new THREE.GridHelper(70, 35, 0x00FFE0, 0x3b1444);
    gridHelper.position.y = -3.98;
    gridHelper.position.z = -10;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.65;
    roomGroup.add(gridHelper);

    // Secondary Fluorescent Pink Micro-grid Floor
    const pinkGridHelper = new THREE.GridHelper(70, 70, 0xFF007F, 0x1f0927);
    pinkGridHelper.position.y = -3.97;
    pinkGridHelper.position.z = -10;
    (pinkGridHelper.material as THREE.Material).transparent = true;
    (pinkGridHelper.material as THREE.Material).opacity = 0.3;
    roomGroup.add(pinkGridHelper);

    // Ceiling Fluorescent Strip Rails
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const ceilingMat = new THREE.MeshBasicMaterial({
      color: 0x030208,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.85
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = roomHeight - 4;
    ceilingMesh.position.z = -10;
    roomGroup.add(ceilingMesh);

    // Ceiling Fluorescent Purple Grid Lines
    const ceilingGrid = new THREE.GridHelper(70, 20, 0xE056FD, 0x24083a);
    ceilingGrid.position.y = roomHeight - 4.1;
    ceilingGrid.position.z = -10;
    (ceilingGrid.material as THREE.Material).transparent = true;
    (ceilingGrid.material as THREE.Material).opacity = 0.4;
    roomGroup.add(ceilingGrid);

    // 2. BACK WALL & HOLOGRAPHIC PANORAMA WINDOW / SKYLINE
    const backWallGroup = new THREE.Group();
    backWallGroup.position.set(0, 5, -44);
    roomGroup.add(backWallGroup);

    // Back Panoramic Window Frame (Fluorescent Purple Ring)
    const frameGeo = new THREE.RingGeometry(12, 12.35, 48);
    const frameMat = new THREE.MeshBasicMaterial({
      color: 0xE056FD,
      side: THREE.DoubleSide
    });
    const portalRing = new THREE.Mesh(frameGeo, frameMat);
    backWallGroup.add(portalRing);

    // Middle Fluorescent Pink Ring
    const middleRingGeo = new THREE.RingGeometry(10, 10.25, 40);
    const middleRingMat = new THREE.MeshBasicMaterial({
      color: 0xFF007F,
      side: THREE.DoubleSide
    });
    const middlePortalRing = new THREE.Mesh(middleRingGeo, middleRingMat);
    backWallGroup.add(middlePortalRing);

    // Concentric Inner Pulsing Ring (Fluorescent Teal)
    const innerRingGeo = new THREE.RingGeometry(8, 8.2, 36);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00FFE0,
      side: THREE.DoubleSide
    });
    const innerPortalRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    backWallGroup.add(innerPortalRing);

    // Holographic Core Monolith behind the window (Fluorescent Pink / Teal wireframe)
    const coreGeo = new THREE.IcosahedronGeometry(3.5, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xFF007F,
      wireframe: true,
      emissive: 0xFF007F,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.9
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    backWallGroup.add(coreMesh);

    // 3. ARCHITECTURAL SIDE PILLARS / ACOUSTIC FLUORESCENT COLUMNS
    const pillarCount = 5;
    const pillarSpacing = 12;
    const pillars: THREE.Mesh[] = [];

    const pillarGeo = new THREE.BoxGeometry(0.8, roomHeight, 0.8);
    const pillarEdgeGeo = new THREE.BoxGeometry(0.18, roomHeight, 0.18);

    const pillarColors = [0xFF007F, 0xE056FD, 0x00FFE0, 0xFF007F, 0xE056FD];

    for (let i = 0; i < pillarCount; i++) {
      const zPos = 10 - i * pillarSpacing;
      const color = pillarColors[i % pillarColors.length];
      const altColor = pillarColors[(i + 2) % pillarColors.length];

      // Left Pillar
      const leftPillarMat = new THREE.MeshStandardMaterial({
        color: 0x0a0c16,
        roughness: 0.25,
        metalness: 0.85
      });
      const leftPillar = new THREE.Mesh(pillarGeo, leftPillarMat);
      leftPillar.position.set(-18, roomHeight / 2 - 4, zPos);
      roomGroup.add(leftPillar);
      pillars.push(leftPillar);

      // Left Pillar Fluorescent Light Strip
      const leftStripMat = new THREE.MeshBasicMaterial({
        color: color
      });
      const leftStrip = new THREE.Mesh(pillarEdgeGeo, leftStripMat);
      leftStrip.position.set(-17.5, roomHeight / 2 - 4, zPos);
      roomGroup.add(leftStrip);

      // Right Pillar
      const rightPillar = new THREE.Mesh(pillarGeo, leftPillarMat);
      rightPillar.position.set(18, roomHeight / 2 - 4, zPos);
      roomGroup.add(rightPillar);
      pillars.push(rightPillar);

      // Right Pillar Fluorescent Light Strip
      const rightStripMat = new THREE.MeshBasicMaterial({
        color: altColor
      });
      const rightStrip = new THREE.Mesh(pillarEdgeGeo, rightStripMat);
      rightStrip.position.set(17.5, roomHeight / 2 - 4, zPos);
      roomGroup.add(rightStrip);
    }

    // 4. FLOATING HOLOGRAPHIC STUDIO MONITORS / SOUND WAVE PANELS (Fluorescent Pink, Purple, Teal)
    const holoPanels: { mesh: THREE.Mesh; baseY: number; speed: number; rotSpeed: number }[] = [];
    const panelGeo = new THREE.PlaneGeometry(5, 3);

    const createHoloPanel = (x: number, y: number, z: number, rotY: number, strokeColor: string, barColor: string, title: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 156;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#06060c';
        ctx.fillRect(0, 0, 256, 156);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3.5;
        ctx.strokeRect(4, 4, 248, 148);

        // Fluorescent audio equalizer bars pattern
        ctx.fillStyle = barColor;
        for (let b = 0; b < 16; b++) {
          const barHeight = 20 + Math.sin(b * 0.8) * 45 + Math.random() * 25;
          ctx.fillRect(20 + b * 13, 130 - barHeight, 8, barHeight);
        }

        // Header telemetry
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = strokeColor;
        ctx.fillText(title, 20, 30);
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('FLUORESCENT ENGINE • 44.1kHz', 20, 46);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(panelGeo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = rotY;
      roomGroup.add(mesh);
      holoPanels.push({ mesh, baseY: y, speed: 0.5 + Math.random() * 0.5, rotSpeed: 0.002 });
    };

    // Left floating studio HUD (Fluorescent Teal)
    createHoloPanel(-10, 4, -8, 0.45, '#00FFE0', '#00F5D4', 'JANU VISION LAB (TEAL)');
    // Right floating telemetry HUD (Fluorescent Pink)
    createHoloPanel(10, 5, -12, -0.45, '#FF007F', '#FF1493', 'FOUNDER MASTER (PINK)');
    // Upper floating producer dashboard (Fluorescent Purple)
    createHoloPanel(-8, 9, -20, 0.35, '#E056FD', '#C084FC', 'CREATOR CORE (PURPLE)');
    // Upper right telemetry (Fluorescent Trio)
    createHoloPanel(8, 8.5, -22, -0.35, '#00FFE0', '#E056FD', 'SYNTHESIS BUFFER (TRIAD)');

    // 5. FLOATING SOUNDSTAGE DESK / COMMAND CONSOLE SILHOUETTE
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, -1.8, -2);
    roomGroup.add(deskGroup);

    // Floating curved console desk
    const deskCurveGeo = new THREE.CylinderGeometry(8, 8.5, 0.6, 32, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x0b0a16,
      roughness: 0.18,
      metalness: 0.92,
    });
    const deskMesh = new THREE.Mesh(deskCurveGeo, deskMat);
    deskMesh.rotation.y = Math.PI;
    deskGroup.add(deskMesh);

    // Glowing Fluorescent Pink & Teal Double Edge around the desk
    const edgeCurveGeo = new THREE.CylinderGeometry(8.05, 8.55, 0.09, 32, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0x00FFE0,
    });
    const edgeMesh = new THREE.Mesh(edgeCurveGeo, edgeMat);
    edgeMesh.rotation.y = Math.PI;
    edgeMesh.position.y = 0.25;
    deskGroup.add(edgeMesh);

    const edgeCurveGeo2 = new THREE.CylinderGeometry(8.15, 8.65, 0.05, 32, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
    const edgeMat2 = new THREE.MeshBasicMaterial({
      color: 0xFF007F,
    });
    const edgeMesh2 = new THREE.Mesh(edgeCurveGeo2, edgeMat2);
    edgeMesh2.rotation.y = Math.PI;
    edgeMesh2.position.y = -0.15;
    deskGroup.add(edgeMesh2);

    // Triple Studio Monitor Outlines on the console (Fluorescent Wireframes)
    const screenMatTeal = new THREE.MeshBasicMaterial({
      color: 0x00FFE0,
      wireframe: true
    });
    const screenMatPink = new THREE.MeshBasicMaterial({
      color: 0xFF007F,
      wireframe: true
    });
    const screenMatPurple = new THREE.MeshBasicMaterial({
      color: 0xE056FD,
      wireframe: true
    });
    const screenGeo = new THREE.BoxGeometry(3.5, 2, 0.1);
    
    const leftScreen = new THREE.Mesh(screenGeo, screenMatPink);
    leftScreen.position.set(-3.2, 1.3, -5.5);
    leftScreen.rotation.y = 0.25;
    deskGroup.add(leftScreen);

    const rightScreen = new THREE.Mesh(screenGeo, screenMatTeal);
    rightScreen.position.set(3.2, 1.3, -5.5);
    rightScreen.rotation.y = -0.25;
    deskGroup.add(rightScreen);

    const centerScreen = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.3, 0.1), screenMatPurple);
    centerScreen.position.set(0, 1.5, -6);
    deskGroup.add(centerScreen);

    // 6. FLOATING FLUORESCENT PARTICLES (Tri-color: Pink, Purple, Teal)
    const particleCount = 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    const cPink = new THREE.Color(0xFF007F);
    const cPurple = new THREE.Color(0xE056FD);
    const cTeal = new THREE.Color(0x00FFE0);
    const triadColors = [cPink, cPurple, cTeal];

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 44;
      particlePos[i * 3 + 1] = Math.random() * 22 - 4;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 64 - 10;
      particleSpeeds[i] = 0.02 + Math.random() * 0.035;

      const pickColor = triadColors[i % 3];
      particleColors[i * 3] = pickColor.r;
      particleColors[i * 3 + 1] = pickColor.g;
      particleColors[i * 3 + 2] = pickColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.32,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    roomGroup.add(particles);

    // 7. LIGHTING & VOLUMETRIC SPOTLIGHT BEAMS (Fluorescent Pink, Purple, Teal)
    const ambientLight = new THREE.AmbientLight(0x0e0818, 1.8);
    scene.add(ambientLight);

    const pointLightTeal = new THREE.PointLight(0x00FFE0, 5, 45);
    pointLightTeal.position.set(-12, 12, -10);
    scene.add(pointLightTeal);

    const pointLightPurple = new THREE.PointLight(0xE056FD, 5, 45);
    pointLightPurple.position.set(12, 12, -10);
    scene.add(pointLightPurple);

    const pointLightPink = new THREE.PointLight(0xFF007F, 6, 35);
    pointLightPink.position.set(0, 6, -38);
    scene.add(pointLightPink);

    // Overhead Center Studio Spot (Fluorescent Teal)
    const spotLight = new THREE.SpotLight(0x00FFE0, 7, 50, Math.PI / 4, 0.45, 1);
    spotLight.position.set(0, 18, -10);
    spotLight.target = deskGroup;
    scene.add(spotLight);

    // INTERACTION & PARALLAX TRACKING
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let scrollY = 0;
    let targetScrollY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // ANIMATION RENDER LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth interpolation for mouse parallax
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      targetScrollY += (scrollY - targetScrollY) * 0.05;

      // Camera motion: mouse pan + depth flythrough with page scroll
      const scrollCameraOffsetZ = Math.min(targetScrollY * 0.012, 14);
      const scrollCameraOffsetY = -Math.min(targetScrollY * 0.004, 5);

      camera.position.x = targetX * 3.5;
      camera.position.y = 3 - targetY * 2 + Math.sin(elapsedTime * 0.5) * 0.2 + scrollCameraOffsetY;
      camera.position.z = 24 - scrollCameraOffsetZ;

      // Look slightly ahead into the 3D room core
      camera.lookAt(targetX * 1.2, 3 - targetY * 0.8, -20);

      // Rotate central back monolith and rings
      coreMesh.rotation.x = elapsedTime * 0.3;
      coreMesh.rotation.y = elapsedTime * 0.45;
      portalRing.rotation.z = -elapsedTime * 0.15;
      innerPortalRing.rotation.z = elapsedTime * 0.25;

      // Animate floating HUD panels with gentle floating sine wave
      holoPanels.forEach((panel, idx) => {
        panel.mesh.position.y = panel.baseY + Math.sin(elapsedTime * panel.speed + idx) * 0.4;
        panel.mesh.rotation.z = Math.sin(elapsedTime * 0.4 + idx) * 0.03;
      });

      // Animate dust particles slowly floating up
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += particleSpeeds[i];
        if (positions[i * 3 + 1] > 18) {
          positions[i * 3 + 1] = -4;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Subtle pulse on fluorescent lights
      pointLightTeal.intensity = 4.5 + Math.sin(elapsedTime * 2) * 1.0;
      pointLightPurple.intensity = 4.5 + Math.cos(elapsedTime * 1.8) * 1.0;
      pointLightPink.intensity = 5.0 + Math.sin(elapsedTime * 2.5) * 1.2;

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js objects to prevent memory leak
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [theme, interactive, intensity]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 3D WebGL Canvas Layer */}
      <div 
        ref={containerRef} 
        className={`w-full h-full transition-opacity duration-1000 ${
          intensity === 'vibrant' ? 'opacity-85' : 'opacity-65'
        }`}
        style={{ pointerEvents: 'none' }}
      />

      {/* Atmospheric Vignette & Soft Gradient Mesh over 3D space */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/40 via-transparent to-[#050508]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#050508_95%)] pointer-events-none" />

      {/* 3D Virtual Studio Mode Quick Controls (Bottom-Left) */}
      <div className="absolute bottom-6 left-6 z-30 pointer-events-auto flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsControlsVisible(!isControlsVisible)}
            className="px-3.5 py-2 rounded-full bg-black/85 hover:bg-black border border-[#00FFE0]/30 hover:border-[#FF007F]/60 backdrop-blur-xl text-[10px] font-mono font-bold text-gray-200 hover:text-[#00FFE0] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,224,0.25)] cursor-pointer"
            title="Toggle 3D Fluorescent Studio Room"
          >
            <i className="fa-solid fa-cube text-[#00FFE0] text-xs"></i>
            <span className="hidden sm:inline">3D Studio Room:</span>
            <span className="text-white uppercase font-bold">
              {theme === 'cyber-studio' ? 'Fluorescent Lab' : theme === 'aurora-penthouse' ? 'Fluorescent Pink Sky' : 'Fluorescent Purple Grid'}
            </span>
            <i className={`fa-solid ${isControlsVisible ? 'fa-chevron-down' : 'fa-chevron-up'} text-[9px] text-gray-400 ml-1`}></i>
          </button>

          {isControlsVisible && (
            <div className="absolute bottom-12 left-0 w-72 p-3 rounded-2xl bg-zinc-950/98 border border-[#FF007F]/30 backdrop-blur-2xl shadow-[0_0_40px_rgba(255,0,127,0.3)] space-y-2 font-mono text-xs animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                <span>3D Room Atmosphere</span>
                <span className="text-[#00FFE0]">Fluorescent 3D</span>
              </div>

              <button
                type="button"
                onClick={() => { setTheme('cyber-studio'); setIsControlsVisible(false); }}
                className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  theme === 'cyber-studio' ? 'bg-[#00FFE0]/15 border border-[#00FFE0]/50 text-[#00FFE0]' : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#00FFE0] shadow-[0_0_8px_#00FFE0]"></div>
                <div>
                  <div className="font-bold text-[11px]">Fluorescent Triad Studio</div>
                  <div className="text-[9px] text-gray-400">Fluorescent Teal, Purple & Pink Synth Lab</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setTheme('aurora-penthouse'); setIsControlsVisible(false); }}
                className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  theme === 'aurora-penthouse' ? 'bg-[#FF007F]/15 border border-[#FF007F]/50 text-[#FF007F]' : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF007F] shadow-[0_0_8px_#FF007F]"></div>
                <div>
                  <div className="font-bold text-[11px]">Fluorescent Pink Observatory</div>
                  <div className="text-[9px] text-gray-400">Hot Pink & Teal Starlit Chamber</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setTheme('matrix-grid'); setIsControlsVisible(false); }}
                className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  theme === 'matrix-grid' ? 'bg-[#E056FD]/15 border border-[#E056FD]/50 text-[#E056FD]' : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#E056FD] shadow-[0_0_8px_#E056FD]"></div>
                <div>
                  <div className="font-bold text-[11px]">Fluorescent Purple Quantum Grid</div>
                  <div className="text-[9px] text-gray-400">Vivid Purple & Deep Pink Wireframe</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ThreeStudioRoomBackground;
