import {useState,useMemo,useEffect} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {PieChart,Pie,Cell,BarChart,Bar,XAxis,Tooltip,ResponsiveContainer} from 'recharts';
import {db,GROUPS,COL,CATS,KINDS,inr} from './db';
const today=()=>new Date().toISOString().slice(0,10);
const ym=d=>d.slice(0,7);
const shift=(m,n)=>{const d=new Date(m+'-01T00:00');d.setMonth(d.getMonth()+n);return d.toLocaleDateString('en-CA').slice(0,7)};
const label=m=>new Date(m+'-01T00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'});
const dl=(name,text)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text]));a.download=name;a.click()};
const PAL=['#1F8A7A','#3D5AFE','#F2A33A','#E4584C','#8E6BBF','#5BA3C7','#C7A35B','#7A8CA5'];

export default function App(){
  const [tab,setTab]=useState('home'),[sheet,setSheet]=useState(null),[month,setMonth]=useState(ym(today()));
  const [dark,setDark]=useState(()=>localStorage.theme?localStorage.theme==='dark':matchMedia('(prefers-color-scheme:dark)').matches);
  useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';localStorage.theme=dark?'dark':'light'},[dark]);
  const accs=useLiveQuery(()=>db.accounts.toArray(),[])||[];
  const tx=useLiveQuery(()=>db.txns.orderBy('date').reverse().toArray(),[])||[];
  const goals=useLiveQuery(()=>db.goals.toArray(),[])||[];
  const bills=useLiveQuery(()=>db.bills.toArray(),[])||[];
  const bal=useMemo(()=>{const b={};accs.forEach(a=>b[a.id]=+a.open||0);
    tx.forEach(t=>{if(t.type==='in')b[t.acc]=(b[t.acc]||0)+t.amt;else if(t.type==='out')b[t.acc]=(b[t.acc]||0)-t.amt;else{b[t.acc]=(b[t.acc]||0)-t.amt;b[t.to]=(b[t.to]||0)+t.amt}});return b},[accs,tx]);
  const net=accs.reduce((s,a)=>s+(bal[a.id]||0),0);
  const mt=tx.filter(t=>ym(t.date)===month);
  const inc=mt.filter(t=>t.type==='in').reduce((s,t)=>s+t.amt,0);
  const g={survive:0,protect:0,grow:0,live:0},byCat={};
  mt.filter(t=>t.type==='out').forEach(t=>{g[CATS[t.cat]||'live']+=t.amt;byCat[t.cat]=(byCat[t.cat]||0)+t.amt});
  const burn=g.survive+g.live,out=burn+g.protect+g.grow,base=Math.max(inc,out)||1;
  const emerg=accs.filter(a=>a.kind==='Emergency').reduce((s,a)=>s+(bal[a.id]||0),0);
  const runway=(g.survive||burn)?emerg/(g.survive||burn):0;
  const pct=n=>Math.round(n/(inc||1)*100)+'%';
  const pie=Object.entries(byCat).map(([name,value])=>({name,value}));
  const bars=[5,4,3,2,1,0].map(i=>{const m=shift(ym(today()),-i);const t=tx.filter(x=>ym(x.date)===m);
    return {m:label(m).slice(0,3),Income:t.filter(x=>x.type==='in').reduce((s,x)=>s+x.amt,0),Spent:t.filter(x=>x.type==='out').reduce((s,x)=>s+x.amt,0)}});
  const submit=(table,fn)=>async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));await fn(d);setSheet(null)};
  const accName=id=>accs.find(a=>a.id===+id)?.name||'—';
  const payBill=async b=>{await db.txns.add({type:'out',amt:b.amt,cat:b.cat,acc:b.acc,date:today(),note:b.name});await db.bills.update(b.id,{paid:ym(today())})};
  const csv=()=>dl('paisa-transactions.csv',['date,type,amount,category,account,to,note',...tx.map(t=>[t.date,t.type,t.amt,t.cat||'',accName(t.acc),t.to?accName(t.to):'','"'+(t.note||'').replace(/"/g,'""')+'"'].join(','))].join('\n'));
  const backup=async()=>dl('paisa-backup.json',JSON.stringify({accounts:accs,txns:tx,goals,bills}));
  const restore=async e=>{const f=e.target.files[0];if(!f)return;const d=JSON.parse(await f.text());
    await Promise.all([db.accounts,db.txns,db.goals,db.bills].map(t=>t.clear()));
    await db.accounts.bulkAdd(d.accounts||[]);await db.txns.bulkAdd(d.txns||[]);await db.goals.bulkAdd(d.goals||[]);await db.bills.bulkAdd(d.bills||[])};
  const MonthNav=()=><div className="mnav"><button onClick={()=>setMonth(shift(month,-1))}>‹</button><b>{label(month)}</b><button onClick={()=>setMonth(shift(month,1))}>›</button></div>;
  const Sel=({name,opts,def,onChange})=><select name={name} defaultValue={def} onChange={onChange}>{opts.map(o=><option key={o[0]??o} value={o[0]??o}>{o[1]??o}</option>)}</select>;
  const accOpts=accs.map(a=>[a.id,a.name]);

  return <div className="app">
    <header><div><small>Net worth</small><h1>{inr(net)}</h1></div><button className="ghost" onClick={()=>setDark(!dark)}>{dark?'Light':'Dark'}</button></header>
    <main>
    {tab==='home'&&<>
      <MonthNav/>
      <section className="hero"><small>Where your salary went</small><h2>{inr(inc)}</h2>
        <div className="bar">{Object.keys(g).map(k=><i key={k} style={{width:g[k]/base*100+'%',background:COL[k]}}/>)}</div>
        <div className="legend">{Object.keys(g).map(k=><div key={k}><s style={{background:COL[k]}}/>{GROUPS[k]}<b>{inr(g[k])}</b><em>{pct(g[k])}</em></div>)}</div>
        <p className="left">{inc-out>=0?`${inr(inc-out)} unassigned`:`Spent ${inr(out-inc)} more than you earned`}</p></section>
      <div className="grid">
        <div className="card"><small>Burn</small><b>{inr(burn)}</b><em>essential {inr(g.survive)} · lifestyle {inr(g.live)}</em></div>
        <div className="card"><small>Runway</small><b>{runway.toFixed(1)} / 6 mo</b><div className="track"><i style={{width:Math.min(100,runway/6*100)+'%',background:COL.protect}}/></div></div>
        <div className="card"><small>Build</small><b>{inr(g.grow)}</b><em>{pct(g.grow)} of income</em></div>
        <div className="card"><small>Play</small><b>{inr(g.live)}</b><em>spend it without guilt</em></div>
      </div>
      <div className="card"><small>Spending by category</small>
        {pie.length?<ResponsiveContainer height={200}><PieChart><Pie data={pie} dataKey="value" innerRadius={50} outerRadius={85} paddingAngle={2} stroke="none">{pie.map((p,i)=><Cell key={i} fill={PAL[i%8]}/>)}</Pie><Tooltip formatter={inr}/></PieChart></ResponsiveContainer>:<p className="empty">No expenses this month yet.</p>}
        <div className="chips">{pie.map((p,i)=><span key={i}><s style={{background:PAL[i%8]}}/>{p.name} {inr(p.value)}</span>)}</div></div>
      <div className="card"><small>Income vs spent, last 6 months</small>
        <ResponsiveContainer height={180}><BarChart data={bars}><XAxis dataKey="m" tickLine={false} axisLine={false}/><Tooltip formatter={inr}/><Bar dataKey="Income" fill={COL.survive} radius={[4,4,0,0]}/><Bar dataKey="Spent" fill={COL.live} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
    </>}
    {tab==='activity'&&<><MonthNav/><div className="card list">{mt.length?mt.map(t=><div className="row" key={t.id} onClick={()=>confirm('Delete this transaction?')&&db.txns.delete(t.id)}>
      <div><b>{t.type==='move'?'Transfer':t.cat}</b><em>{t.note||''} {accName(t.acc)}{t.to?' → '+accName(t.to):''} · {t.date.slice(8)}/{t.date.slice(5,7)}</em></div>
      <span className={t.type}>{t.type==='in'?'+':t.type==='out'?'−':''}{inr(t.amt)}</span></div>):<p className="empty">Nothing here. Tap + to add a transaction.</p>}</div></>}
    {tab==='accounts'&&<>
      {accs.map(a=><div className="card row" key={a.id}><div><b>{a.name}</b><em>{a.kind}</em></div><div className="r"><b>{inr(bal[a.id]||0)}</b><button className="x" onClick={async()=>{if(confirm('Delete account and its transactions?')){await db.txns.where('acc').equals(a.id).delete?.();await db.txns.filter(t=>t.acc===a.id||t.to===a.id).delete();await db.accounts.delete(a.id)}}}>Remove</button></div></div>)}
      {!accs.length&&<p className="empty">Add your first account to start tracking.</p>}
      <button className="primary" onClick={()=>setSheet('acc')}>Add account</button>
      <div className="card"><small>Your data</small><p className="note">Stored on this device in your browser. Back it up now and then.</p>
        <div className="btns"><button onClick={csv}>Export CSV</button><button onClick={backup}>Backup</button><label className="btn">Restore<input type="file" accept=".json" hidden onChange={restore}/></label></div></div></>}
    {tab==='plan'&&<>
      <h3>Savings goals</h3>{goals.map(x=><div className="card" key={x.id}><div className="row"><b>{x.name}</b><span>{inr(x.saved)} / {inr(x.target)}</span></div>
        <div className="track"><i style={{width:Math.min(100,x.saved/x.target*100)+'%',background:COL.grow}}/></div>
        <div className="btns"><button onClick={()=>{const v=+prompt('Add amount (₹)');v&&db.goals.update(x.id,{saved:x.saved+v})}}>Add money</button><button className="x" onClick={()=>confirm('Delete goal?')&&db.goals.delete(x.id)}>Remove</button></div></div>)}
      <button className="primary" onClick={()=>setSheet('goal')}>Add goal</button>
      <h3>Recurring bills</h3>{bills.map(b=><div className="card row" key={b.id}><div><b>{b.name}</b><em>{inr(b.amt)} · due on the {b.day}th · {b.cat}</em></div>
        <div className="r">{b.paid===ym(today())?<em>Paid</em>:<button onClick={()=>payBill(b)}>Mark paid</button>}<button className="x" onClick={()=>confirm('Delete bill?')&&db.bills.delete(b.id)}>Remove</button></div></div>)}
      <button className="primary" onClick={()=>setSheet('bill')}>Add bill</button></>}
    </main>
    <nav>{[['home','Home'],['activity','Activity'],['accounts','Accounts'],['plan','Plan']].map(([k,l],i)=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}
      <button className="fab" onClick={()=>accs.length?setSheet('txn'):(setTab('accounts'),setSheet('acc'))}>+</button></nav>
    {sheet&&<div className="scrim" onClick={()=>setSheet(null)}><form className="sheet" onClick={e=>e.stopPropagation()} onSubmit={submit(sheet,async d=>{
      if(sheet==='acc')await db.accounts.add({name:d.name,kind:d.kind,open:+d.open||0});
      if(sheet==='goal')await db.goals.add({name:d.name,target:+d.target,saved:0});
      if(sheet==='bill')await db.bills.add({name:d.name,amt:+d.amt,cat:d.cat,acc:+d.acc,day:+d.day});
      if(sheet==='txn')await db.txns.add({type:d.type,amt:+d.amt,cat:d.type==='move'?null:d.cat,acc:+d.acc,to:d.to?+d.to:null,date:d.date,note:d.note})})}>
      {sheet==='txn'&&<TxnFields Sel={Sel} accOpts={accOpts}/>}
      {sheet==='acc'&&<><h3>New account</h3><input name="name" placeholder="Name, e.g. HDFC Savings" required/><Sel name="kind" opts={KINDS}/><input name="open" type="number" step="any" placeholder="Current balance (₹)" required/></>}
      {sheet==='goal'&&<><h3>New goal</h3><input name="name" placeholder="Goal, e.g. Goa trip" required/><input name="target" type="number" placeholder="Target (₹)" required/></>}
      {sheet==='bill'&&<><h3>New recurring bill</h3><input name="name" placeholder="Bill, e.g. Rent" required/><input name="amt" type="number" placeholder="Amount (₹)" required/><Sel name="cat" opts={Object.keys(CATS)}/><Sel name="acc" opts={accOpts}/><input name="day" type="number" min="1" max="28" placeholder="Due day of month" required/></>}
      <button className="primary" type="submit">Save</button></form></div>}
  </div>;
}
function TxnFields({Sel,accOpts}){
  const [type,setType]=useState('out');
  return <><h3>New transaction</h3>
    <div className="seg">{[['out','Expense'],['in','Income'],['move','Transfer']].map(([k,l])=><label key={k} className={type===k?'on':''}><input type="radio" name="type" value={k} checked={type===k} onChange={()=>setType(k)} hidden/>{l}</label>)}</div>
    <input name="amt" type="number" step="any" inputMode="decimal" placeholder="Amount (₹)" required autoFocus/>
    {type==='out'&&<Sel name="cat" opts={Object.keys(CATS).map(c=>[c,`${c} (${CATS[c]})`])}/>}
    {type==='in'&&<input type="hidden" name="cat" value="Salary"/>}
    <Sel name="acc" opts={accOpts}/>
    {type==='move'&&<Sel name="to" opts={accOpts}/>}
    <input name="date" type="date" defaultValue={today()} required/><input name="note" placeholder="Note (optional)"/></>;
}
