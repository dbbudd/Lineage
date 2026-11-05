/* Let the reader's font choice apply to the workshop's brand headings too. */
(() => {
    const root = document.documentElement;
    try { root.dataset.font = localStorage.getItem('vibe_font') || 'sans'; } catch {}
    if (typeof window.setFont === 'function') {
        const setFont = window.setFont;
        window.setFont = function (font) { setFont(font); root.dataset.font = font; };
    }
    // Brand fonts can change a section's position after the shell's first
    // anchor seek. Let the existing navigation handler settle it again.
    if (document.fonts && location.hash) {
        document.fonts.ready.then(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
    }
})();
