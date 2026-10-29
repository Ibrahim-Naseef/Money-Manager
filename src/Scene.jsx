import {useRef,useState} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls,Float,Html,Sparkles,RoundedBox} from '@react-three/drei';

function Bar({x,h,color,name,val}){
  const m=useRef(),[hot,setHot]=useState(false),top=Math.max(h,.06);
  useFrame((_,d)=>{const s=m.current.scale;s.y+=(top-s.y)*Math.min(1,d*3);m.current.position.y=s.y/2+.02});
  return <group position={[x,0,0]}>
    <mesh ref={m} scale={[1,.05,1]} onPointerOver={e=>{e.stopPropagation();setHot(true)}} onPointerOut={()=>setHot(false)} onClick={()=>setHot(v=>!v)}>
      <boxGeometry args={[.95,1,.95]}/>
      <meshStandardMaterial color={color} metalness={.35} roughness={.22} emissive={color} emissiveIntensity={hot?.55:.12}/>
    </mesh>
    <Html position={[0,top+.45,0]} center distanceFactor={9} style={{pointerEvents:'none'}}>
      <div className="tag"><b>{name}</b>{val}</div></Html>
  </group>;
}
export default function Scene({items}){
  return <Canvas camera={{position:[4.6,3.2,6.4],fov:38}} dpr={[1,2]}>
    <ambientLight intensity={.7}/><directionalLight position={[5,8,4]} intensity={1.5}/><pointLight position={[-4,2,3]} intensity={8} color="#F2A33A"/>
    <Float speed={1.4} rotationIntensity={.12} floatIntensity={.25}>
      <RoundedBox args={[6.6,.2,2.2]} radius={.08} position={[0,-.1,0]}><meshStandardMaterial color="#232b4a" metalness={.5} roughness={.3}/></RoundedBox>
      {items.map((it,i)=><Bar key={it.name} x={(i-1.5)*1.55} {...it}/>)}
    </Float>
    <Sparkles count={45} scale={[8,4,4]} size={2.2} speed={.4} color="#F2A33A"/>
    <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={.7} minPolarAngle={.7} maxPolarAngle={1.45}/>
  </Canvas>;
}
function Spin({children}){const r=useRef();useFrame(({clock})=>{r.current.rotation.y=Math.sin(clock.elapsedTime*.9)*.6});return <group ref={r}>{children}</group>}
export function Ring({v}){
  return <Canvas camera={{position:[0,0,3.4],fov:40}} dpr={[1,2]}>
    <ambientLight intensity={.9}/><directionalLight position={[2,3,4]} intensity={1.4}/>
    <Spin><mesh><torusGeometry args={[1,.17,24,80]}/><meshStandardMaterial color="#2a3354"/></mesh>
    {v>.01&&<mesh rotation={[0,0,Math.PI/2]}><torusGeometry args={[1,.21,24,80,v*Math.PI*2]}/><meshStandardMaterial color="#6C83FF" emissive="#3D5AFE" emissiveIntensity={.5} metalness={.3} roughness={.25}/></mesh>}</Spin>
  </Canvas>;
}
