/* Pinned HyperFrames 0.8.81 controls + direction-aware clip playback. */
(() => {
  'use strict';
  const deck=document.querySelector('hyperframes-slideshow');
  const player=deck.querySelector('hyperframes-player');
  const data=window.DECK;
  const ui=document.querySelector('#tools');
  const status=document.querySelector('#status');
  const pause=document.querySelector('#pause');
  const overview=document.querySelector('#overview');
  const help=document.querySelector('#help');
  const blocked=document.querySelector('#blocked');
  let controller, previous=-1, holdNext=true, lastState=null, timer, opening=false;
  const api=() => player.iframeElement?.contentWindow?.deckMedia;
  const audience=() => new URLSearchParams(location.search).get('mode')==='audience';
  function activity() {
    deck.classList.add('show-controls');
    clearTimeout(timer);
    timer=setTimeout(() => {if(!overview.open&&!help.open) deck.classList.remove('show-controls');},2400);
  }
  function current() {return controller?.position.slideIndex || 0;}
  function save(state) {
    try {sessionStorage.setItem('folhk-presentation-position',JSON.stringify({id:state.id,time:state.time,mode:state.mode}));} catch {}
  }
  function change() {
    const i=current();
    const intent=holdNext || audience() || i<=previous ? 'hold':'play';
    holdNext=false;
    if(!audience()) api()?.activate(i,intent,0,deck.muted);
    else api()?.activate(i,'hold',0,true);
    previous=i;
    history.replaceState(null,'',`#${data.slides[i].id}`);
    status.textContent=`${data.slides[i].id} · ${data.slides[i].title}`;
    overview.querySelectorAll('button[data-index]').forEach(b => b.setAttribute('aria-current',String(+b.dataset.index===i)));
    activity();
  }
  function goto(i) {holdNext=true;controller.goToSlide(i);overview.close();deck.focus();}
  function command(key) {
    if(!controller) return;
    activity();
    const k=key.toLowerCase();
    if(k==='k') api()?.toggle();
    if(k==='r') api()?.replay(deck.muted);
    if(k==='g') {overview.open?overview.close():overview.showModal();activity();}
    if(k==='?') {help.open?help.close():help.showModal();activity();}
    if(k==='b') deck.classList.toggle('blacked-out');
  }
  function connect() {
    if(!deck.controller || !api()) {setTimeout(connect,80);return;}
    controller=deck.controller;
    controller.onChange(change);
    const requested=decodeURIComponent(location.hash.slice(1));
    const index=data.slides.findIndex(s=>s.id.toLowerCase()===requested.toLowerCase());
    opening=index<0&&!audience();
    holdNext=true;controller.goToSlide(Math.max(0,index));
    if(index<0 && !audience()) api()?.activate(0,'play');
    // Refreshing an activity restores it paused, with no surprise audio.
    if(index>=0 && data.slides[index].timer && !audience()) {
      try {
        const saved=JSON.parse(sessionStorage.getItem('folhk-presentation-position')||'null');
        if(saved?.id===data.slides[index].id && saved.mode!=='hold' && saved.time>0)
          api()?.activate(index,'restore',saved.time,deck.muted);
      } catch {}
    }
    if(!opening)document.body.classList.add('ready');
    deck.focus();activity();
    window.presentation={goto, command, getState:()=>api()?.state(),controller};
  }
  pause.addEventListener('click',()=>{api()?.toggle();deck.focus();});
  document.querySelector('#replay').addEventListener('click',()=>{api()?.replay(deck.muted);deck.focus();});
  document.querySelector('#jump').addEventListener('click',()=>command('g'));
  document.querySelector('#keys').addEventListener('click',()=>command('?'));
  document.querySelector('#enable-media').addEventListener('click',()=>{api()?.toggle();deck.focus();});
  overview.addEventListener('click', e=>{const b=e.target.closest('button[data-index]');if(b)goto(+b.dataset.index);});
  for(const dialog of [overview,help]) {
    dialog.querySelector('[data-close]').addEventListener('click',()=>{dialog.close();deck.focus();});
    dialog.addEventListener('close',()=>{deck.focus();activity();});
  }
  document.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,[contenteditable=true]'))return;
    if(e.metaKey || e.ctrlKey || e.altKey)return;
    if(e.repeat && ['ArrowRight','ArrowLeft',' '].includes(e.key)) {e.preventDefault();e.stopImmediatePropagation();return;}
    if(overview.open || help.open) {
      if(e.key==='Escape')return;
      if(['ArrowRight','ArrowLeft',' '].includes(e.key)){e.stopImmediatePropagation();return;}
    }
    if(['k','r','g','b','?'].includes(e.key.toLowerCase())) {command(e.key);e.preventDefault();e.stopImmediatePropagation();}
    activity();
  },true);
  window.addEventListener('hashchange',()=>{
    const i=data.slides.findIndex(s=>s.id.toLowerCase()===decodeURIComponent(location.hash.slice(1)).toLowerCase());
    if(i>=0 && controller)goto(i);
  });
  window.addEventListener('message',e=>{
    if(e.origin!==location.origin || e.source!==player.iframeElement?.contentWindow || e.data?.source!=='folhk-deck')return;
    if(e.data.type==='activity')return activity();
    if(e.data.type==='key') return command(e.data.key);
    if(e.data.type==='media-error') {
      opening=false;document.body.classList.add('ready');
      blocked.hidden=false;document.querySelector('#media-message').textContent=`Could not load ${e.data.id}. Check that the media folder is beside this page.`;return;
    }
    if(e.data.type!=='state')return;
    lastState=e.data.state;
    if(!opening || !lastState.posterVisible || lastState.blocked) {
      opening=false;document.body.classList.add('ready');
    }
    pause.textContent=lastState.playing?'Pause':'Play';
    pause.setAttribute('aria-label',lastState.playing?'Pause current animation':'Play or resume current animation');
    blocked.hidden=!lastState.blocked;
    document.querySelector('#media-message').textContent='Click to start this activity with sound.';
    if(!audience() && lastState.id)save(lastState);
  });
  // A second window's native media bridge can start the video after a slide seek.
  // The frame reveals the clip on its native `playing` event, never on a timer.
  deck.addEventListener('pointermove',activity);
  ui.addEventListener('focusin',activity);
  connect();
})();
