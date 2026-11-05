/* =============================================================
   WORKSHOP EXTRAS
   -------------------------------------------------------------
   Copy buttons on prompt cards, so a teacher can paste a prompt
   straight into Flint or Gemini.

     <div class="prompt-card" data-copy="the exact text to copy">
         <span class="prompt-label">An interactive</span>
         <p class="prompt-text">...</p>
     </div>

   data-copy is optional; without it the card's .prompt-text is copied. Add
   data-keep-lines to keep the prompt's line breaks (otherwise it is one line).
   ============================================================= */
(function () {
    'use strict';

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
        // A page opened from disk, or an older browser: the old way still works.
        return new Promise((resolve, reject) => {
            const ta = document.createElement('textarea');
            ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
            catch (e) { reject(e); }
            ta.remove();
        });
    }

    document.querySelectorAll('.prompt-card').forEach(card => {
        const textEl = card.querySelector('.prompt-text');
        if (!textEl) return;
        const label = (card.querySelector('.prompt-label') || {}).textContent || 'prompt';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prompt-copy';
        btn.innerHTML = '<span aria-hidden="true">&#128203;</span><span class="prompt-copy-label">Copy</span>';
        btn.setAttribute('aria-label', 'Copy the prompt: ' + label.trim());
        const status = document.createElement('span');
        status.className = 'sr-only'; status.setAttribute('role', 'status');
        btn.addEventListener('click', () => {
            // data-keep-lines keeps a long prompt's paragraphs, for tools that show them (Shortcuts)
            const keep = card.hasAttribute('data-keep-lines');
            const raw = card.dataset.copy || (keep ? textEl.innerText : textEl.textContent);
            const text = keep ? raw.replace(/[ \t]+\n/g, '\n').trim() : raw.replace(/\s+/g, ' ').trim();
            const lab = btn.querySelector('.prompt-copy-label');
            copyText(text).then(() => {
                lab.textContent = 'Copied'; btn.classList.add('done'); status.textContent = 'Prompt copied';
            }, () => {
                lab.textContent = 'Select and copy'; status.textContent = 'Copy did not work. Select the text and copy it.';
            });
            setTimeout(() => { lab.textContent = 'Copy'; btn.classList.remove('done'); }, 2200);
        });
        card.appendChild(btn);
        card.appendChild(status);
    });
})();

/* Links to a page that toc.js marks 'planned' (shown as Soon in the sidebar) are
   switched off until that page is ready, so a page can point at a guide before it is
   written. Set the page's status to 'ready' in toc.js and every link to it works again. */
(function () {
    'use strict';
    const C = window.COURSE;
    if (!C || !C.chapters) return;
    const soon = new Set(C.chapters.filter(c => c.status === 'planned').map(c => c.file));
    if (!soon.size) return;
    document.querySelectorAll('.main a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return;      // only links within the site
        const file = href.split('#')[0].split('?')[0].replace(/^\.\//, '');
        if (!soon.has(file)) return;
        a.removeAttribute('href');                          // no longer a link, and not in the tab order
        a.removeAttribute('target');
        a.classList.add('is-soon');
        const badge = document.createElement('span');
        badge.className = 'soon-badge';
        badge.textContent = 'Soon';
        a.appendChild(badge);
    });
})();

/* Session options and the handout menu come from COURSE.tools. */
(function () {
    'use strict';
    const C = window.COURSE, T = C && C.tools;
    if (!T || !T.pairs) return;
    const root = document.documentElement, ids = Object.keys(T.pairs);
    const valid = t => ids.indexOf(t) >= 0;
    function stored() { try { return localStorage.getItem('vibe_tools'); } catch (e) { return null; } }
    function set(t, save) {
        if (!valid(t)) return;
        root.setAttribute('data-tools', t);
        if (save) { try { localStorage.setItem('vibe_tools', t); } catch (e) { } }
        document.querySelectorAll('[data-set-tools]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setTools === t)));
    }
    let fromUrl = null;
    try { fromUrl = new URLSearchParams(location.search).get('tools'); } catch (e) { }
    set(valid(fromUrl) ? fromUrl : (valid(stored()) ? stored() : T.default), valid(fromUrl));

    const live = document.getElementById('tools-live');
    document.querySelectorAll('[data-set-tools]').forEach(b => b.addEventListener('click', () => {
        const t = b.dataset.setTools;
        set(t, true);
        // the address now opens this pair, so it can be copied and shared
        try { const u = new URL(location.href); u.searchParams.set('tools', t); history.replaceState(null, '', u); } catch (e) { }
        if (live) live.textContent = 'Showing the ' + T.pairs[t].label + ' session.';
    }));

    // The session page's download buttons: one per pair, Soon until its handout exists.
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    document.querySelectorAll('[data-handouts]').forEach(list => {
        list.innerHTML = ids.map(id => {
            const pair = T.pairs[id];
            return pair.handout
                ? '<li data-pair="' + esc(id) + '"><a class="m-btn solid" href="' + esc(pair.handout) + '" download>A3 handout: ' + esc(pair.label) + ' <span aria-hidden="true">&darr;</span></a></li>'
                : '<li data-pair="' + esc(id) + '"><span class="m-btn is-soon">A3 handout: ' + esc(pair.label) + ' <span class="soon-badge">Soon</span></span></li>';
        }).join('');
    });
})();
