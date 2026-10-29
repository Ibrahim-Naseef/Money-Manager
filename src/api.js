import {useState,useEffect,useCallback} from 'react';
let pin='';
const call=async b=>{const r=await fetch('/api/db',{method:b?'POST':'GET',headers:{'content-type':'application/json','x-pin':pin},body:b&&JSON.stringify(b)});
  if(r.status===401)throw new Error('pin');if(!r.ok)throw new Error('server');return r.json()};
export function useStore(){
  const [rows,setRows]=useState(null),[err,setErr]=useState(null);
  const load=useCallback(()=>{setErr(null);return call().then(setRows).catch(e=>setErr(e.message))},[]);
  useEffect(()=>{load()},[load]);
  const add=async(t,data)=>{const tmp=-Date.now();setRows(r=>[...r,{...data,id:tmp,_t:t}]);
    try{const {id}=await call({op:'add',t,data});setRows(r=>r.map(x=>x.id===tmp?{...x,id}:x))}catch{load()}};
  const set=(id,data)=>{setRows(r=>r.map(x=>x.id===id?{...x,...data}:x));call({op:'set',id,data}).catch(load)};
  const del=ids=>{ids=[].concat(ids);setRows(r=>r.filter(x=>!ids.includes(x.id)));call({op:'del',ids}).catch(load)};
  return {rows,err,add,set,del,load,unlock:p=>{pin=p;load()}};
}
