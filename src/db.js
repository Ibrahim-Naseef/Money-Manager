import Dexie from 'dexie';
export const db=new Dexie('paisa');
db.version(1).stores({accounts:'++id',txns:'++id,date,type',goals:'++id',bills:'++id'});
// Money Architecture: Survive (essential burn), Protect (runway), Grow (build), Live (play)
export const GROUPS={survive:'Survive',protect:'Protect',grow:'Grow',live:'Live'};
export const COL={survive:'#1F8A7A',protect:'#3D5AFE',grow:'#F2A33A',live:'#E4584C'};
export const CATS={Rent:'survive',Groceries:'survive',Utilities:'survive',Transport:'survive',Health:'survive',EMI:'survive',
'Emergency fund':'protect',Insurance:'protect',SIP:'grow',Stocks:'grow',Gold:'grow',
'Dining out':'live',Shopping:'live',Travel:'live',Entertainment:'live',Other:'live'};
export const KINDS=['Bank','Cash','Credit card','Emergency','Investments'];
export const inr=n=>(n<0?'-':'')+'₹'+Math.abs(Math.round(n)).toLocaleString('en-IN');
