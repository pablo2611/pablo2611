'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
export default function SpatialObject({ animate }: { animate: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    node.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
    camera.position.set(0, 0.15, 5.7);
    const group = new THREE.Group();
    scene.add(group);
    const geometry = new THREE.TorusKnotGeometry(0.71, 0.2, 100, 16, 2, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0xa65b32, metalness: 0.72, roughness: 0.28 });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    const cageGeometry = new THREE.IcosahedronGeometry(1.42, 0);
    const edgeGeometry = new THREE.EdgesGeometry(cageGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xae8263, transparent: true, opacity: 0.38 });
    const cage = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    group.add(cage);
    scene.add(new THREE.HemisphereLight(0xfff4dc, 0x684839, 3));
    const light = new THREE.DirectionalLight(0xffffff, 5);
    light.position.set(-3, 4, 3); scene.add(light);
    const fill = new THREE.DirectionalLight(0xf7b781, 3);
    fill.position.set(3, -2, 1); scene.add(fill);
    let pointerX = 0, pointerY = 0, frame = 0, previous = 0;
    const seed = Math.random() * 100;
    const move = (event: PointerEvent) => { const rect=node.getBoundingClientRect(); pointerX=(event.clientX-rect.left)/rect.width-.5; pointerY=(event.clientY-rect.top)/rect.height-.5; };
    const resize = () => { const {width,height}=node.getBoundingClientRect(); renderer.setSize(width,height); camera.aspect=width/height; camera.updateProjectionMatrix(); renderer.render(scene,camera); };
    const observer = new ResizeObserver(resize); observer.observe(node);
    const render = (time: number) => {
      if (time-previous >= 1000/30) {
        const t=time/1000;
        group.rotation.y=t*.17+Math.sin(t*.23+seed)*.3+pointerX*.3;
        group.rotation.x=.25+Math.cos(t*.19+seed)*.2+pointerY*.2;
        cage.rotation.z=-t*.09;
        mesh.rotation.z=Math.sin(t*.31)*.2;
        renderer.render(scene,camera); previous=time;
      }
      frame=requestAnimationFrame(render);
    };
    if (animate) { node.addEventListener('pointermove',move); frame=requestAnimationFrame(render); }
    else { group.rotation.set(.35,.55,0); resize(); }
    return () => { cancelAnimationFrame(frame); observer.disconnect(); node.removeEventListener('pointermove',move); geometry.dispose(); cageGeometry.dispose(); edgeGeometry.dispose(); material.dispose(); edgeMaterial.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); };
  }, [animate]);
  return <div ref={host} className="spatial-canvas" aria-hidden="true" />;
}
