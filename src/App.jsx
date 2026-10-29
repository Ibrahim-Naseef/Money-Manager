import {useState,useMemo,useEffect,lazy,Suspense} from 'react';
import {PieChart,Pie,Cell,AreaChart,Area,XAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {useStore} from './api';
import {GROUPS,COL,CATS,INCOME,KINDS,TARGET,inr,today,ym,shift,label} from './lib';
const Scene=lazy(()=>import('./Scene'));
const Ring=lazy(()=>import('./Scene').then(m=>({default:m.Ring})));
const PAL=['#E8504A','#2F7DF6','#F2A33A','#1F8A7A','#8E6BBF','#5BA3C7','#C7A35B','#7A8CA5'];
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const sum=(a,f=x=>x.amt)=>a.reduce((s,x)=>s+f(x),0);
const shrink=f=>new Promise(r=>{const i=new Image();i.onload=()=>{const s=Math.min(1,640/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;c.getContext('2d').drawImage(i,0,0,c.width,c.height);r(c.toDataURL('image/jpeg',.6))};i.src=URL.createObjectURL(f)});

export default function App(){
  const S=useStore();
  if(S.err==='pin')return <form className="gate" onSubmit={e=>{e.preventDefault();S.unlock(new FormData(e.target).get('pin'))}}><h1>Paisa</h1><input name="pin" type="password" inputMode="numeric" placeholder="Enter your PIN" autoFocus/><button className="primary">Unlock</button></form>;
  if(S.err)return <div className="gate"><h1>Paisa</h1><p className="empty">Can't reach the database. Check that DATABASE_URL is set, then try again.</p><button className="primary" onClick={S.load}>Try again</button></div>;
  if(!S.rows)return <div className="gate"><p className="empty">Loading your money…</p></div>;
  return <Main S={S}/>;
}

function Main({S}){
  const {rows,add,set,del}=S,by=t=>rows.filter(r=>r._t===t);
  const accs=by('accounts'),goals=by('goals'),bills=by('bills'),budgets=by('budgets'),pref=by('prefs')[0]||{};
  const tx=useMemo(()=>by('txns').sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id),[rows]);
  const dark=pref.dark??matchMedia('(prefers-color-scheme:dark)').matches,targets={...TARGET,...pref.targets};
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light'},[dark]);
  const savePref=d=>pref.id?set(pref.id,d):add('prefs',d);
  const [tab,setTab]=useState('trans'),[view,setView]=useState('daily'),[sheet,setSheet]=useState(null),[month,setMonth]=useState(ym(today())),[q,setQ]=useState(''),[day,setDay]=useState(null),[pic,setPic]=useState(null);
  const accName=id=>accs.find(a=>a.id===+id)?.name||'—',accOpts=accs.map(a=>[a.id,a.name]);
  const bal=useMemo(()=>{const b={};accs.forEach(a=>b[a.id]=+a.open||0);
    tx.forEach(t=>{if(t.type==='in')b[t.acc]=(b[t.acc]||0)+t.amt;else if(t.type==='out')b[t.acc]=(b[t.acc]||0)-t.amt;else{b[t.acc]=(b[t.acc]||0)-t.amt;b[t.to]=(b[t.to]||0)+t.amt}});return b},[accs,tx]);
  const net=sum(accs,a=>bal[a.id]||0),assets=sum(accs.filter(a=>(bal[a.id]||0)>0),a=>bal[a.id]),debts=net-assets;
  const mt=tx.filter(t=>ym(t.date)===month),ql=q.trim().toLowerCase();
  const fl=mt.filter(t=>!ql||[t.cat,t.note,accName(t.acc)].join(' ').toLowerCase().includes(ql));
  const inc=sum(mt.filter(t=>t.type==='in')),exp=sum(mt.filter(t=>t.type==='out'));
  const g={survive:0,protect:0,grow:0,live:0},byCat={};
  mt.filter(t=>t.type==='out').forEach(t=>{g[CATS[t.cat]||'live']+=t.amt;byCat[t.cat]=(byCat[t.cat]||0)+t.amt});
  const burn=g.survive+g.live,emerg=sum(accs.filter(a=>a.kind==='Emergency'),a=>bal[a.id]||0),runway=(g.survive||burn)?emerg/(g.survive||burn):0;
  const pie=Object.entries(byCat).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
  const items=Object.keys(g).map(k=>({name:GROUPS[k],val:inr(g[k]),h:g[k]/Math.max(...Object.values(g),1)*3,color:COL[k]}));
  const open0=sum(accs,a=>+a.open||0),trend=[5,4,3,2,1,0].map(i=>{const m=shift(ym(today()),-i);return {m:label(m).slice(0,3),Net:open0+sum(tx.filter(t=>ym(t.date)<=m&&t.type!=='move'),t=>t.type==='in'?t.amt:-t.amt)}});
  const months=[...Array(12).keys()].map(i=>shift(ym(today()),-i));
  const [Y,M]=month.split('-').map(Number),first=new Date(Y,M-1,1).getDay(),dim=new Date(Y,M,0).getDate();
  const cells=[...Array(first).fill(0),...Array.from({length:dim},(_,i)=>i+1)];
  const key=d=>`${month}-${String(d).padStart(2,'0')}`;
  const payBill=b=>{add('txns',{type:'out',amt:b.amt,cat:b.cat,acc:b.acc,date:today(),note:b.name});set(b.id,{paid:ym(today())})};
  const submit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
    if(sheet==='acc')add('accounts',{name:d.name,kind:d.kind,open:+d.open||0});
    if(sheet==='goal')add('goals',{name:d.name,target:+d.target,saved:0});
    if(sheet==='bill')add('bills',{name:d.name,amt:+d.amt,cat:d.cat,acc:+d.acc,day:+d.day});
    if(sheet==='budget'){const b=budgets.find(x=>x.cat===d.cat);b?set(b.id,{amt:+d.amt}):add('budgets',{cat:d.cat,amt:+d.amt})}
    if(sheet==='targets')savePref({targets:Object.fromEntries(Object.keys(GROUPS).map(k=>[k,+d[k]||0]))});
    if(sheet==='txn')add('txns',{type:d.type,amt:+d.amt,cat:d.type==='move'?null:d.cat,acc:+d.acc,to:d.to?+d.to:null,date:d.date,note:d.note,photo:d.photo||null});
    setSheet(null)};
  const Sel=({name,opts,def})=><select name={name} defaultValue={def}>{opts.map(o=><option key={o[0]??o} value={o[0]??o}>{o[1]??o}</option>)}</select>;
  const MonthNav=()=><div className="mnav"><button onClick={()=>{setMonth(shift(month,-1));setDay(null)}} aria-label="Previous month">‹</button><b>{label(month)}</b><button onClick={()=>{setMonth(shift(month,1));setDay(null)}} aria-label="Next month">›</button></div>;
  const Row=t=><div className="row tx" key={t.id} onClick={()=>confirm('Delete this transaction?')&&del(t.id)}>
    <i className="dot" style={{background:t.type==='in'?'var(--inc)':t.type==='move'?'var(--mut)':COL[CATS[t.cat]||'live']}}/>
    <div className="grow"><b>{t.type==='move'?'Transfer':t.cat}</b><em>{[t.note,accName(t.acc)+(t.to?' → '+accName(t.to):'')].filter(Boolean).join(' · ')}</em></div>
    {t.photo&&<img className="thumb" src={t.photo} alt="Receipt" onClick={e=>{e.stopPropagation();setPic(t.photo)}}/>}
    <span className={t.type}>{inr(t.amt)}</span></div>;
  const days=[...new Set(fl.map(t=>t.date))];
  const bl=budgets.map(b=>({...b,spent:byCat[b.cat]||0}));
  return <div className="app">
    <div className="top">{tab==='trans'||tab==='stats'||tab==='budget'?<MonthNav/>:<h1>{tab==='accounts'?'Accounts':'More'}</h1>}
      {tab==='trans'&&<><div className="sum"><div><small>Income</small><b className="in">{inr(inc)}</b></div><div><small>Expenses</small><b className="out">{inr(exp)}</b></div><div><small>Balance</small><b>{inr(inc-exp)}</b></div></div>
      <div className="tabs">{[['daily','Daily'],['cal','Calendar'],['monthly','Monthly']].map(([k,l])=><button key={k} className={view===k?'on':''} onClick={()=>setView(k)}>{l}</button>)}</div></>}</div>
    <main>
    {tab==='trans'&&<>
      {view==='daily'&&<><input className="search" type="search" placeholder="Search notes, categories, accounts" value={q} onChange={e=>setQ(e.target.value)}/>
        {days.map(d=>{const L=fl.filter(t=>t.date===d);return <section className="day" key={d}><div className="dh"><b>{+d.slice(8)}</b><span>{WD[new Date(d+'T00:00').getDay()]}</span><i/><span className="in">{inr(sum(L.filter(t=>t.type==='in')))}</span><span className="out">{inr(sum(L.filter(t=>t.type==='out')))}</span></div>{L.map(Row)}</section>})}
        {!days.length&&<p className="empty">{q?'No matches this month.':'No transactions this month. Tap + to add one.'}</p>}</>}
      {view==='cal'&&<><div className="cal">{WD.map(w=><small key={w}>{w[0]}</small>)}{cells.map((d,i)=>{if(!d)return <span key={i}/>;const L=mt.filter(t=>t.date===key(d)),i1=sum(L.filter(t=>t.type==='in')),o1=sum(L.filter(t=>t.type==='out'));
        return <button key={i} className={day===key(d)?'on':''} onClick={()=>setDay(key(d))}><b>{d}</b>{i1>0&&<span className="in">{Math.round(i1)}</span>}{o1>0&&<span className="out">{Math.round(o1)}</span>}</button>})}</div>
        {day&&<section className="day"><div className="dh"><b>{+day.slice(8)}</b><span>{WD[new Date(day+'T00:00').getDay()]}</span></div>{mt.filter(t=>t.date===day).map(Row)}{!mt.some(t=>t.date===day)&&<p className="empty">Nothing on this day.</p>}</section>}</>}
      {view==='monthly'&&<div className="card list">{months.map(m=>{const L=tx.filter(t=>ym(t.date)===m),i1=sum(L.filter(t=>t.type==='in')),o1=sum(L.filter(t=>t.type==='out'));
        return <div className="row link" key={m} onClick={()=>{setMonth(m);setView('daily')}}><b className="grow">{label(m)}</b><span className="in">{inr(i1)}</span><span className="out">{inr(o1)}</span><span className="r">{inr(i1-o1)}</span></div>})}</div>}
    </>}
    {tab==='stats'&&<>
      <div className="card"><small>Expenses by category</small>
        {pie.length?<ResponsiveContainer height={190}><PieChart><Pie data={pie} dataKey="value" innerRadius={52} outerRadius={84} paddingAngle={2} stroke="none">{pie.map((p,i)=><Cell key={i} fill={PAL[i%8]}/>)}</Pie><Tooltip formatter={inr}/></PieChart></ResponsiveContainer>:<p className="empty">No expenses this month yet.</p>}
        <div className="list">{pie.map((p,i)=><div className="row" key={p.name}><i className="pct" style={{background:PAL[i%8]}}>{Math.round(p.value/(exp||1)*100)}%</i><b className="grow">{p.name}</b><span>{inr(p.value)}</span></div>)}</div></div>
      <div className="card"><small>Money architecture</small>
        <div className="stage"><Suspense fallback={<p className="empty">Loading 3D…</p>}><Scene items={items}/></Suspense></div>
        <div className="list">{Object.keys(g).map(k=>{const p=Math.round(g[k]/(inc||1)*100),ok=k==='survive'||k==='live'?p<=targets[k]:p>=targets[k];
          return <div className="row" key={k}><i className="dot" style={{background:COL[k]}}/><b className="grow">{GROUPS[k]}<em>target {targets[k]}% of income</em></b><span>{inr(g[k])}</span><i className={'chip '+(inc?(ok?'ok':'bad'):'')}>{p}%</i></div>})}</div>
        <div className="row runway"><div className="grow"><small>Runway</small><b className="big">{runway.toFixed(1)} / 6 months</b><em>Emergency savings ÷ essential monthly spend</em></div><div className="ring"><Suspense fallback={null}><Ring v={Math.min(1,runway/6)}/></Suspense></div></div></div></>}
    {tab==='budget'&&<>
      <div className="card"><small>Monthly budget</small><div className="row"><b className="big">{inr(Math.max(sum(bl,b=>b.amt)-sum(bl,b=>b.spent),0))} left</b><span>{inr(sum(bl,b=>b.spent))} / {inr(sum(bl,b=>b.amt))}</span></div>
        <div className="track"><i style={{width:Math.min(100,sum(bl,b=>b.spent)/(sum(bl,b=>b.amt)||1)*100)+'%',background:'var(--acc)'}}/></div></div>
      {bl.map(b=><div className="card" key={b.id}><div className="row"><b>{b.cat}</b><span className={b.spent>b.amt?'out':''}>{inr(b.spent)} / {inr(b.amt)}</span></div>
        <div className="track"><i style={{width:Math.min(100,b.spent/b.amt*100)+'%',background:b.spent>b.amt?'var(--exp)':COL[CATS[b.cat]]}}/></div>
        <div className="row"><em>{b.spent>b.amt?`Over by ${inr(b.spent-b.amt)}`:`${inr(b.amt-b.spent)} left`}</em><button className="x" onClick={()=>confirm('Remove this budget?')&&del(b.id)}>Remove</button></div></div>)}
      {!bl.length&&<p className="empty">Set a monthly limit for any category.</p>}
      <button className="primary" onClick={()=>setSheet('budget')}>Set category budget</button></>}
    {tab==='accounts'&&<>
      <div className="sum card"><div><small>Assets</small><b className="in">{inr(assets)}</b></div><div><small>Liabilities</small><b className="out">{inr(debts)}</b></div><div><small>Total</small><b>{inr(net)}</b></div></div>
      <div className="card"><small>Net worth, last 6 months</small><ResponsiveContainer height={150}><AreaChart data={trend}><XAxis dataKey="m" tickLine={false} axisLine={false}/><Tooltip formatter={inr}/><Area dataKey="Net" stroke="var(--inc)" fill="var(--inc)" fillOpacity={.15}/></AreaChart></ResponsiveContainer></div>
      {KINDS.filter(k=>accs.some(a=>a.kind===k)).map(k=><div className="card list" key={k}><small>{k}</small>{accs.filter(a=>a.kind===k).map(a=><div className="row" key={a.id}><b className="grow">{a.name}</b><b className={(bal[a.id]||0)<0?'out':''}>{inr(bal[a.id]||0)}</b>
        <button className="x" onClick={()=>{if(confirm('Delete account and its transactions?'))del([a.id,...tx.filter(t=>t.acc===a.id||t.to===a.id).map(t=>t.id)])}}>Remove</button></div>)}</div>)}
      {!accs.length&&<p className="empty">Add your first account to start tracking.</p>}
      <button className="primary" onClick={()=>setSheet('acc')}>Add account</button></>}
    {tab==='more'&&<>
      <div className="card"><div className="row"><b>Dark theme</b><button onClick={()=>savePref({dark:!dark})}>{dark?'On':'Off'}</button></div>
        <div className="row"><div><b>Money architecture targets</b><em>{Object.keys(GROUPS).map(k=>`${GROUPS[k]} ${targets[k]}%`).join(' · ')}</em></div><button onClick={()=>setSheet('targets')}>Edit</button></div></div>
      <h3>Savings goals</h3>{goals.map(x=><div className="card" key={x.id}><div className="row"><b>{x.name}</b><span>{inr(x.saved)} / {inr(x.target)}</span></div>
        <div className="track"><i style={{width:Math.min(100,x.saved/x.target*100)+'%',background:COL.grow}}/></div>
        <div className="btns"><button onClick={()=>{const v=+prompt('Add amount (₹)');v&&set(x.id,{saved:x.saved+v})}}>Add money</button><button className="x" onClick={()=>confirm('Delete goal?')&&del(x.id)}>Remove</button></div></div>)}
      <button className="primary" onClick={()=>setSheet('goal')}>Add goal</button>
      <h3>Recurring bills</h3>{bills.map(b=><div className="card row" key={b.id}><div><b>{b.name}</b><em>{inr(b.amt)} · due on day {b.day} · {b.cat}</em></div>
        <div className="r">{b.paid===ym(today())?<em>Paid</em>:<button onClick={()=>payBill(b)}>Mark paid</button>}<button className="x" onClick={()=>confirm('Delete bill?')&&del(b.id)}>Remove</button></div></div>)}
      <button className="primary" onClick={()=>setSheet('bill')}>Add bill</button></>}
    </main>
    <button className="fab" aria-label="Add transaction" onClick={()=>accs.length?setSheet('txn'):(setTab('accounts'),setSheet('acc'))}>+</button>
    <nav>{[['trans','Trans.'],['stats','Stats'],['budget','Budget'],['accounts','Accounts'],['more','More']].map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}</nav>
    {pic&&<div className="scrim" onClick={()=>setPic(null)}><img className="pic" src={pic} alt="Receipt"/></div>}
    {sheet&&<div className="scrim" onClick={()=>setSheet(null)}><form className="sheet" onClick={e=>e.stopPropagation()} onSubmit={submit}>
      {sheet==='txn'&&<TxnFields Sel={Sel} accOpts={accOpts}/>}
      {sheet==='acc'&&<><h3>New account</h3><input name="name" placeholder="Name, e.g. HDFC Savings" required/><Sel name="kind" opts={KINDS}/><input name="open" type="number" step="any" placeholder="Current balance (₹)" required/></>}
      {sheet==='goal'&&<><h3>New goal</h3><input name="name" placeholder="Goal, e.g. Goa trip" required/><input name="target" type="number" placeholder="Target (₹)" required/></>}
      {sheet==='bill'&&<><h3>New recurring bill</h3><input name="name" placeholder="Bill, e.g. Rent" required/><input name="amt" type="number" placeholder="Amount (₹)" required/><Sel name="cat" opts={Object.keys(CATS)}/><Sel name="acc" opts={accOpts}/><input name="day" type="number" min="1" max="28" placeholder="Due day of month" required/></>}
      {sheet==='budget'&&<><h3>Category budget</h3><Sel name="cat" opts={Object.keys(CATS)}/><input name="amt" type="number" placeholder="Monthly limit (₹)" required autoFocus/></>}
      {sheet==='targets'&&<><h3>Share of income, %</h3>{Object.keys(GROUPS).map(k=><label className="lab" key={k}>{GROUPS[k]}<input name={k} type="number" min="0" max="100" defaultValue={targets[k]}/></label>)}</>}
      <button className="primary" type="submit">Save</button></form></div>}
  </div>;
}
function TxnFields({Sel,accOpts}){
  const [type,setType]=useState('out'),[photo,setPhoto]=useState('');
  return <><h3>New transaction</h3>
    <div className="seg">{[['out','Expense'],['in','Income'],['move','Transfer']].map(([k,l])=><label key={k} className={type===k?'on':''}><input type="radio" name="type" value={k} checked={type===k} onChange={()=>setType(k)} hidden/>{l}</label>)}</div>
    <input name="amt" type="number" step="any" inputMode="decimal" placeholder="Amount (₹)" required autoFocus/>
    {type==='out'&&<Sel name="cat" opts={Object.keys(CATS).map(c=>[c,`${c} (${CATS[c]})`])}/>}
    {type==='in'&&<Sel name="cat" opts={INCOME}/>}
    <Sel name="acc" opts={accOpts}/>{type==='move'&&<Sel name="to" opts={accOpts}/>}
    <input name="date" type="date" defaultValue={today()} required/><input name="note" placeholder="Note (optional)"/>
    <label className="btn file">{photo?'Receipt attached ✓':'Attach receipt photo'}<input type="file" accept="image/*" hidden onChange={async e=>e.target.files[0]&&setPhoto(await shrink(e.target.files[0]))}/></label><input type="hidden" name="photo" value={photo}/></>;
}
