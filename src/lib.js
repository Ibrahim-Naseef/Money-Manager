export const GROUPS={survive:'Survive',protect:'Protect',grow:'Grow',live:'Live'};
export const COL={survive:'#1F8A7A',protect:'#3D5AFE',grow:'#F2A33A',live:'#E4584C'};
export const TARGET={survive:50,protect:20,grow:20,live:10};
export const CATS={Rent:'survive',Groceries:'survive',Utilities:'survive',Transport:'survive',Health:'survive',EMI:'survive',
'Emergency fund':'protect',Insurance:'protect',SIP:'grow',Stocks:'grow',Gold:'grow',
'Dining out':'live',Shopping:'live',Travel:'live',Entertainment:'live',Other:'live'};
export const INCOME=['Salary','Bonus','Interest','Other income'];
export const KINDS=['Bank','Cash','Credit card','Emergency','Investments'];
export const inr=n=>(n<0?'-':'')+'₹'+Math.abs(Math.round(n)).toLocaleString('en-IN');
export const today=()=>new Date().toLocaleDateString('en-CA');
export const ym=d=>d.slice(0,7);
export const shift=(m,n)=>{const d=new Date(m+'-01T00:00');d.setMonth(d.getMonth()+n);return d.toLocaleDateString('en-CA').slice(0,7)};
export const label=m=>new Date(m+'-01T00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'});
