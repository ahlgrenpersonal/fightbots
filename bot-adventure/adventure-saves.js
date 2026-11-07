import {BUILD,freshSave,REGIONS,EQUIPMENT,areaInfo,regionAt} from './data.js?v=world91';

export function validAdventure(s){
  if(!s||s.schema!==1||!s.build||!s.position||!Number.isFinite(s.position.x)||!Number.isFinite(s.position.y))return false;
  for(const key of ['hp','scrap','gears','totalBots','playSeconds'])if(!Number.isFinite(s[key])||s[key]<0)return false;
  for(const key of ['owned','cleared','kills','chests','discovered','visited','bosses','returns'])if(!Array.isArray(s[key]))return false;
  if(!s.bosses.every(r=>Number.isInteger(r)&&r>=0&&r<REGIONS.length))return false;
  for(const [type,parts] of Object.entries(EQUIPMENT))if(!parts.some(p=>p.id===s.build[type])||!s.owned.includes(s.build[type]))return false;
  return true;
}

export function adventureSummary(save){
  const king=save.royalCourt?.phase==='victory'||save.royalRematchStarted===true;
  return {title:king?'Royal Champion':'Saved adventure',region:areaInfo(regionAt(save.position.x,save.position.y))?.name||'The valley',
    relays:new Set(save.bosses).size,totalRelays:REGIONS.length,equipment:new Set(save.owned).size,king};
}

export class AdventureSaves {
  constructor({storage,key,now=()=>new Date().toISOString(),fresh=freshSave}){this.access=storage;this.key=key;this.backupKey=key+'-before-restart';this.now=now;this.fresh=fresh;}
  storage(){return typeof this.access==='function'?this.access():this.access;}
  readBackup(){
    try{
      const raw=this.storage().getItem(this.backupKey);if(raw===null)return {status:'missing'};
      let backup;try{backup=JSON.parse(raw);}catch{return {status:'corrupt'};}
      if(backup?.schema!==1||typeof backup.savedAt!=='string'||!Number.isFinite(Date.parse(backup.savedAt))||!validAdventure(backup.save))return {status:'corrupt'};
      return {status:'ready',backup,summary:adventureSummary(backup.save)};
    }catch{return {status:'unavailable'};}
  }
  write(storage,key,value){storage.setItem(key,value);if(storage.getItem(key)!==value)throw Error('Save verification failed');}
  rollback(storage,key,value){try{if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{/* Keep the running adventure available when storage is unavailable. */}}
  restart(snapshot){
    if(!validAdventure(snapshot))throw Error('The current adventure could not be backed up. Nothing was restarted.');
    const next=this.fresh(),savedAt=this.now();
    const backup=JSON.stringify({schema:1,savedAt,build:BUILD,save:snapshot}),active=JSON.stringify(next);
    if(!validAdventure(JSON.parse(backup).save)||!validAdventure(next)||!Number.isFinite(Date.parse(savedAt)))throw Error('The backup could not be prepared. Nothing was restarted.');
    const storage=this.storage(),oldActive=storage.getItem(this.key),oldBackup=storage.getItem(this.backupKey);
    let backupTouched=false,activeTouched=false;
    try{
      backupTouched=true;this.write(storage,this.backupKey,backup);
      activeTouched=true;this.write(storage,this.key,active);
    }catch{
      if(activeTouched)this.rollback(storage,this.key,oldActive);
      if(backupTouched)this.rollback(storage,this.backupKey,oldBackup);
      throw Error('The backup could not be saved and verified. Your current adventure is still open; nothing was restarted.');
    }
    return next;
  }
  restore(){
    const record=this.readBackup();if(record.status!=='ready')throw Error('There is no readable backup to restore. Your current adventure has not changed.');
    const storage=this.storage(),oldActive=storage.getItem(this.key),active=JSON.stringify(record.backup.save);
    try{this.write(storage,this.key,active);}catch{this.rollback(storage,this.key,oldActive);throw Error('The adventure could not be restored. Your current adventure is still open.');}
    return record.backup.save;
  }
}
