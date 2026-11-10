/* Playback adapter for the exported clips. Navigation belongs to HyperFrames. */
(() => {
  'use strict';
  const slides = window.DECK.slides;
  const roots = [...document.querySelectorAll('.scene-frame')];
  const curtain = document.querySelector('#transition-hold');
  let active = -1, generation = 0, mode = 'hold', blocked = false;
  const video = i => roots[i].querySelector('video');
  const poster = i => roots[i].querySelector('img');
  // In the standalone wrapper this adapter owns lazy media loading. When the
  // composition is inspected directly, leave sources to the HyperFrames engine.
  let wrapperOwnsMedia=false;
  try {wrapperOwnsMedia=parent!==window && !!parent.document.querySelector('hyperframes-slideshow');} catch {}
  if(wrapperOwnsMedia) roots.forEach(el => {const v=el.querySelector('video');v.removeAttribute('src');v.load();});
  const notify = () => parent.postMessage({source:'folhk-deck', type:'state', state:state()}, location.origin);
  function state() {
    const v = active < 0 ? null : video(active);
    return {index:active, id:slides[active]?.id, mode, blocked,
      playing:!!v && !v.paused && !v.ended, time:v?.currentTime || 0,
      duration:slides[active]?.duration || 0, muted:v?.muted ?? true,
      posterVisible:active >= 0 && !poster(active).hidden,
      posterReady:active >= 0 && poster(active).complete && poster(active).naturalWidth===1920,
      buffering:!curtain.hidden};
  }
  function visible(i) {
    preparePoster(i);
    roots.forEach((el,n) => {
      const yes = n === i;
      el.style.opacity = yes ? '1' : '0';
      el.style.visibility = yes ? 'visible' : 'hidden';
      el.style.pointerEvents = yes ? 'auto' : 'none';
    });
  }
  function preparePoster(i) {
    if(i<0 || i>=slides.length)return;
    const image=poster(i);
    if(image.getAttribute('src')!==image.dataset.src)image.src=image.dataset.src;
  }
  function prepare(i) {
    if(i < 0 || i >= slides.length) return;
    preparePoster(i);
    const v = video(i);
    if(!v.getAttribute('src')) { v.src = v.dataset.src; v.load(); }
  }
  function reveal(v, token) {
    const show = () => {
      if(token !== generation || v !== video(active)) return;
      poster(active).hidden = true;
      curtain.hidden = true;
      notify();
      prepare(active+1);
    };
    if(v.requestVideoFrameCallback) v.requestVideoFrameCallback(show);
    else if(v.readyState >= 2) show();
    else v.addEventListener('loadeddata', show, {once:true});
  }
  function play(v, token) {
    // Call play in the original keyboard/click gesture; do not wait for metadata.
    const promise = v.play();
    promise?.then(() => { if(token === generation) { blocked = false; reveal(v,token); notify(); } })
      .catch(e => {
        if(token !== generation || e.name === 'AbortError') return;
        blocked = true; notify();
      });
  }
  function activate(i, intent='hold', restoreTime=0, muted=false) {
    const token = ++generation;
    // Retain the preceding hold while the next video buffers. Showing the new
    // slide's final poster here would briefly reveal its answer (or 00:00).
    if(intent==='play' && active>=0) {
      curtain.src=poster(active===i?Math.max(0,i-1):active).src;
      curtain.hidden=false;
    } else curtain.hidden=true;
    roots.forEach((el,n) => { video(n).pause(); poster(n).hidden = false; });
    active = i; mode = intent; blocked = false; visible(i);
    poster(i).loading='eager';poster(i).fetchPriority='high';
    const v = video(i); v.loop = false; v.muted = !slides[i].timer || muted;
    prepare(i);
    if(intent === 'arrival') {
      v.src = 'media/arrival-loop.mp4'; v.loop = true; v.muted = true;
      v.currentTime = 0; play(v,token);
    } else if(intent === 'play' || intent === 'resume' || intent === 'restore') {
      if(v.getAttribute('src') !== v.dataset.src) { v.src = v.dataset.src; v.load(); }
      try { v.currentTime = intent === 'restore' || intent === 'resume' ? restoreTime : 0; } catch {}
      if(intent === 'play' || intent === 'resume') play(v,token);
      else {
        const restore = () => {
          if(token !== generation) return;
          v.currentTime = Math.min(restoreTime, Math.max(0,v.duration-0.1));
          v.pause();
          v.addEventListener('seeked', () => reveal(v,token), {once:true});
        };
        if(v.readyState >= 1) restore(); else v.addEventListener('loadedmetadata',restore,{once:true});
      }
    }
    // Fetch only neighbouring media, rather than all five long activities.
    if(intent==='hold' || intent==='restore')prepare(i+1);
    roots.forEach((el,n) => {
      if(Math.abs(n-i)>1 && video(n).getAttribute('src')) {
        video(n).removeAttribute('src'); video(n).load();
      }
    });
    notify();
  }
  function toggle() {
    if(active < 0) return;
    const v = video(active);
    if(mode === 'hold' || v.ended) return replay();
    if(v.paused) play(v,generation); else {v.pause();notify();}
  }
  function replay(muted=false) { activate(active,'play',0,muted); }
  roots.forEach((el,i) => {
    poster(i).addEventListener('load',()=>{if(i===active)notify();});
    const v = video(i);
    v.addEventListener('ended', () => {
      if(i !== active) return;
      if(i === 0 && mode === 'play') return activate(0,'arrival');
      mode = 'hold'; poster(i).hidden = false; notify();
    });
    v.addEventListener('playing', () => {if(i===active) {if(mode==='hold')mode='play';reveal(v,generation);notify();}});
    for(const name of ['pause','volumechange','timeupdate']) v.addEventListener(name, () => {if(i===active) notify();});
    v.addEventListener('error', () => {
      if(i===active && v.getAttribute('src')) parent.postMessage({source:'folhk-deck',type:'media-error',id:slides[i].id},location.origin);
    });
  });
  // A seekable root is the standalone HyperFrames player's documented adapter.
  const tl = window.__timelines[slides[0].sceneId];
  tl.eventCallback('onUpdate', () => visible(Math.min(slides.length-1,Math.floor(tl.time()/10))));
  visible(0);
  window.deckMedia = {activate, toggle, replay, state, video:() => active<0?null:video(active)};
  function postTimeline() {
    parent.postMessage({source:'hf-preview',type:'timeline',durationInFrames:slides.length*300,
      scenes:slides.map((s,i) => ({id:s.sceneId,start:i*10,duration:10}))},location.origin);
  }
  // Publish as soon as the timeline exists; remote media may delay window.load.
  postTimeline();
  window.addEventListener('DOMContentLoaded',postTimeline,{once:true});
  window.addEventListener('load', () => {postTimeline();setTimeout(postTimeline,300);});
  let lastPointer=0;
  document.addEventListener('pointermove',()=>{
    const now=performance.now();if(now-lastPointer<120)return;lastPointer=now;
    parent.postMessage({source:'folhk-deck',type:'activity'},location.origin);
  },{passive:true});
  // Non-navigation keys must reach the parent even when the iframe has focus.
  window.addEventListener('keydown', e => {
    if(e.metaKey || e.ctrlKey || e.altKey)return;
    if(e.repeat && ['ArrowRight','ArrowLeft',' '].includes(e.key)) {
      e.preventDefault(); e.stopImmediatePropagation(); return;
    }
    if(['k','r','g','b','?'].includes(e.key.toLowerCase())) {
      parent.postMessage({source:'folhk-deck',type:'key',key:e.key},location.origin); e.preventDefault();
    }
  },true);
})();
