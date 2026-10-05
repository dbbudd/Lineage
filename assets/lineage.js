// Lineage — small progressive enhancements (pages work without this file).
document.querySelectorAll("[data-flip]").forEach(f => {
  const inner = f.querySelector(".inner");
  const start = inner.style.getPropertyValue("--ry");
  f.querySelector("button").addEventListener("click", () => {
    const back = f.classList.toggle("back");
    if (start) inner.style.setProperty("--ry", back ? "180deg" : start);
  });
});
document.querySelectorAll("[data-copy]").forEach(btn => {
  btn.addEventListener("click", () => {
    const code = btn.parentElement.querySelector("[data-url]");
    const done = () => { btn.textContent = "Copied"; setTimeout(() => (btn.textContent = "Copy"), 1600); };
    const select = () => { const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    if (navigator.clipboard) navigator.clipboard.writeText(code.textContent).then(done, select); else select();
  });
});
