export function powerState(game){
  const active=game.boostTime>0,waiting=game.boostCd>0;
  return {active,waiting,disabled:active||waiting,label:active?`SUPER ${Math.ceil(game.boostTime)}s`:waiting?`${Math.ceil(game.boostCd)}s`:'Power'};
}

export function bindPowerControl(button,activate){
  // Accept a second finger while the first is moving or targeting in the world.
  const down=e=>{if(e.button!==0||button.disabled)return;e.preventDefault();activate();};
  const click=e=>{if(e.detail===0&&!button.disabled)activate();};
  button.addEventListener('pointerdown',down);
  button.addEventListener('click',click);
  return ()=>{button.removeEventListener('pointerdown',down);button.removeEventListener('click',click);};
}

export function updatePowerControl(button,label,game){
  const state=powerState(game);
  label.textContent=state.label;
  button.disabled=state.disabled;
  button.classList.toggle('power-active',state.active);
  button.classList.toggle('cooldown',state.waiting&&!state.active);
  button.setAttribute('aria-label',state.active?`Power active, ${Math.ceil(game.boostTime)} seconds remaining`:state.waiting?`Power recharging, ${Math.ceil(game.boostCd)} seconds remaining`:'Activate power boost');
}
