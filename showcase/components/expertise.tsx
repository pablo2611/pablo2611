'use client';
import dynamic from 'next/dynamic';
import { Component, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Cpu, Workflow, Code2, Server, Braces, Pause, Play } from 'lucide-react';
import type { COBEOptions } from 'cobe';
import { AnimatedBeam } from './magicui/animated-beam';
import { useScene } from '@/lib/use-scene';
const Globe = dynamic(() => import('./magicui/globe').then(m=>m.Globe), {ssr:false});
const SpatialObject = dynamic(()=>import('./spatial-object'), {ssr:false});
const globeConfig: COBEOptions = {width:360,height:360,devicePixelRatio:1,phi:0,theta:.2,dark:1,diffuse:1.1,mapSamples:9000,mapBrightness:4,baseColor:[.27,.56,.43],markerColor:[.65,1,.77],glowColor:[.07,.15,.12],markers:[{location:[8.98,-79.52],size:.08},{location:[40.71,-74],size:.04},{location:[50.1,8.68],size:.04},{location:[1.35,103.82],size:.04}],onRender:()=>{}};
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}> { state={failed:false}; static getDerivedStateFromError(){return {failed:true};} render(){return this.state.failed?<div className="scene-fallback"><Server size={48}/></div>:this.props.children;} }
function Telegram() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m21.5 3.5-3.3 16c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-.9.5l.3-5.1L18 5.7c.4-.4-.1-.6-.6-.3L5.5 13.5l-4.2-1.3c-1-.3-1-1 .2-1.4L20.2 3.6c.9-.3 1.5.2 1.3-.1Z"/></svg>; }
function FlowScene({animate}:{animate:boolean}) {
  const container=useRef<HTMLDivElement>(null), python=useRef<HTMLDivElement>(null), telegram=useRef<HTMLDivElement>(null), ai=useRef<HTMLDivElement>(null), flow=useRef<HTMLDivElement>(null), services=useRef<HTMLDivElement>(null);
  return <div ref={container} className="flow-scene" aria-hidden="true">
    <div ref={python} className="flow-node python"><Braces/><span>Python</span></div>
    <div ref={telegram} className="flow-node telegram"><Telegram/><span>Telegram</span></div>
    <div ref={ai} className="flow-node ai"><Cpu/><span>IA</span></div>
    <div ref={flow} className="flow-node n8n"><Workflow/><span>n8n</span></div>
    <div ref={services} className="flow-node services"><Server/><span>APIs</span></div>
    <AnimatedBeam enabled={animate} containerRef={container} fromRef={python} toRef={ai} curvature={24} gradientStartColor="#7dddff" gradientStopColor="#caf7ff" pathColor="#72a5b0" pathOpacity={.3} duration={3.1} repeat={animate?Infinity:0}/>
    <AnimatedBeam enabled={animate} containerRef={container} fromRef={telegram} toRef={ai} curvature={-24} gradientStartColor="#56caff" gradientStopColor="#cbfaff" pathColor="#72a5b0" pathOpacity={.3} duration={4.3} delay={.6} repeat={animate?Infinity:0}/>
    <AnimatedBeam enabled={animate} containerRef={container} fromRef={ai} toRef={flow} curvature={24} gradientStartColor="#93f6f4" gradientStopColor="#fff" pathColor="#72a5b0" pathOpacity={.3} duration={3.7} delay={1.2} repeat={animate?Infinity:0}/>
    <AnimatedBeam enabled={animate} containerRef={container} fromRef={ai} toRef={services} curvature={-24} gradientStartColor="#75cbe9" gradientStopColor="#fff" pathColor="#72a5b0" pathOpacity={.3} duration={5.3} delay={.9} repeat={animate?Infinity:0}/>
  </div>;
}
const areas=[
  {id:'infraestructura',title:'Infraestructura',headline:<>Una base sólida.<br/>Sin fricción.</>,tech:'Linux / VPS · Cloud',copy:'Despliegue, contenedores y monitorización.',action:'Ver ServerDock',url:'https://github.com/pablo2611/serverdock',detail:['SSH · Docker · Nginx','Servicios, logs y procesos persistentes'],icon:Server},
  {id:'automatizacion',title:'Automatización e IA',headline:<>Cada conexión,<br/>una posibilidad.</>,tech:'Python · Telegram · n8n',copy:'Bots, APIs y flujos entre servicios.',action:'Explorar integraciones',url:'https://github.com/pablo2611?tab=repositories',detail:['Bot API · Webhooks · Async','Contexto, herramientas y comunicaciones'],icon:Workflow},
  {id:'web',title:'Web interactiva',headline:<>Del código<br/>a la experiencia.</>,tech:'React · TypeScript · Three.js',copy:'Interfaces 3D, diseño y rendimiento.',action:'Explorar AERION',url:'https://pablo2611.github.io/aerion/',detail:['Experiencias 3D · React · TypeScript','Diseño, movimiento y rendimiento'],icon:Code2}
];
function ExpertiseCard({index,compact,playing}:{index:number,compact:boolean,playing:boolean}) {
  const area=areas[index]; const {ref,visible,motion:prefersMotion}=useScene();
  const active=visible&&playing&&prefersMotion;
  const reduced=useReducedMotion();
  return <motion.article id={area.id} className={`expertise-card area-${index} ${compact?'compact':''}`} data-capture={area.id} initial={false} whileHover={reduced?undefined:{transform:'translateY(-5px)'}} transition={{duration:.2,ease:[.23,1,.32,1]}}>
    <div ref={ref} className="scene" data-scene-visible={visible} role="img" aria-label={index===0?'Globo 3D de infraestructura':index===1?'Flujo visual entre Python, Telegram, IA, n8n y APIs':'Escultura 3D interactiva'}>
      {index===0&&<><div className="globe-wrap"><SceneBoundary>{visible&&<Globe config={globeConfig} animated={active}/>}</SceneBoundary></div><div className="deploy-label"><span className={active?'status-dot animated':'status-dot'}/><span>deploy / observe / scale</span></div></>}
      {index===1&&visible&&<FlowScene animate={active}/>}
      {index===2&&<><div className="object-wrap"><SceneBoundary>{visible&&<SpatialObject animate={active}/>}</SceneBoundary></div><div className="object-label">WebGL · Creative development</div></>}
    </div>
    <div className="card-copy"><h2>{compact?area.title:area.headline}</h2><p className="tech">{area.tech}</p><p className="description">{area.copy}</p>{!compact&&<details><summary>Stack y enfoque</summary><ul>{area.detail.map(text=><li key={text}>{text}</li>)}</ul></details>}<a className="card-action" href={compact?`https://pablo2611.github.io/pablo2611/#${area.id}`:area.url}>{compact?['Explorar infraestructura','Ver conexiones','Explorar en 3D'][index]:area.action}<ArrowUpRight size={16}/></a></div>
  </motion.article>;
}
export function Expertise({compact=false}:{compact?:boolean}) {
  const [playing,setPlaying]=useState(true);
  return <>{!compact&&<div className="section-line"><h2>Especialidades</h2><button className="motion-control" aria-pressed={!playing} onClick={()=>setPlaying(v=>!v)}>{playing?<Pause size={14}/>:<Play size={14}/>} {playing?'Pausar movimiento':'Activar movimiento'}</button></div>}<div className={compact?'preview-grid':'expertise-grid'}>{areas.map((area,index)=><ExpertiseCard key={area.id} index={index} compact={compact} playing={playing}/>)}</div></>;
}
