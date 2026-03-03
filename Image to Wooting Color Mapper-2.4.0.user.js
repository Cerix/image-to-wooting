// ==UserScript==
// @name         Image to Wooting Color Mapper
// @namespace    https://beta.wootility.io/
// @version      2.4.0
// @description  Load an image and apply its colors to every key on your Wooting keyboard
// @author       Cerix
// @match        https://beta.wootility.io/*
// @match        https://wootility.io/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  /* ─── Config ──────────────────────────────────────────────────────────── */

  // Set to true to show the "Buy Me a Coffee" button, false to hide it
  const BMAC = true;
  const BMAC_URL = "https://buymeacoffee.com/cerix";

  /* ─── Constants ───────────────────────────────────────────────────────── */
  const PANEL_ID = "woot-img-panel";

  /* ─── CSS ─────────────────────────────────────────────────────────────── */
  const CSS = `
    #${PANEL_ID} {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      background: #1a1c1e;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 16px;
      width: 320px;
      font-family: sans-serif;
      color: #e8e8e8;
      box-shadow: 0 8px 32px rgba(0,0,0,.6);
      user-select: none;
    }
    #${PANEL_ID} h3 {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .05em;
      color: #fff;
      text-transform: uppercase;
      cursor: move;
    }
    #${PANEL_ID} label.upload-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 12px;
      background: #2a2d30;
      border: 1px dashed #555;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      transition: border-color .2s;
    }
    #${PANEL_ID} label.upload-btn:hover { border-color: #888; }
    #${PANEL_ID} input[type=file] { display: none; }
    #${PANEL_ID} .woot-canvas-wrap {
      margin-top: 10px;
      display: none;
    }
    #${PANEL_ID} #woot-overlay-canvas {
      width: 100%;
      border-radius: 6px;
    }
    #${PANEL_ID} .woot-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    #${PANEL_ID} button.woot-btn {
      flex: 1;
      padding: 9px 0;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity .15s;
    }
    #${PANEL_ID} button.woot-btn:hover    { opacity: .85; }
    #${PANEL_ID} button.woot-btn:disabled { opacity: .35; cursor: not-allowed; }
    #${PANEL_ID} #woot-btn-apply { background: #5c7cfa; color: #fff; }
    #${PANEL_ID} #woot-btn-stop  { background: #c0392b; color: #fff; display: none; }
    #${PANEL_ID} .woot-opts {
      display: flex;
      gap: 12px;
      margin-top: 10px;
      font-size: 11px;
      color: #aaa;
      align-items: center;
    }
    #${PANEL_ID} .woot-opts input[type=number] { width: 56px; }
    #${PANEL_ID} #woot-progress {
      display: none;
      margin-top: 8px;
      height: 4px;
      background: #2a2d30;
      border-radius: 4px;
      overflow: hidden;
    }
    #${PANEL_ID} #woot-progress-bar {
      height: 100%;
      background: #5c7cfa;
      width: 0%;
      transition: width .1s;
    }
    #${PANEL_ID} #woot-status {
      margin-top: 8px;
      font-size: 11px;
      color: #aaa;
      min-height: 16px;
      text-align: center;
      line-height: 1.4;
    }
    #${PANEL_ID} #woot-status.woot-error {
      color: #ff6b6b;
      font-weight: 600;
    }
    #${PANEL_ID} .woot-bmac {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 12px;
      padding: 7px 0;
      background: #ffdd00;
      color: #1a1a1a;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      width: 100%;
      transition: opacity .15s, transform .1s;
    }
    #${PANEL_ID} .woot-bmac:hover {
      opacity: .9;
      transform: translateY(-1px);
    }
  `;

  /* ─── Inject panel ────────────────────────────────────────────────────── */
  function injectPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const bmacHTML = BMAC
      ? `<a class="woot-bmac" href="${BMAC_URL}" target="_blank" rel="noopener">
           ☕ Buy me a coffee
         </a>`
      : "";

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <h3>🎨 Image → Keyboard</h3>
      <label class="upload-btn">
        📁 Choose image
        <input type="file" id="woot-file-input" accept="image/*">
      </label>
      <div class="woot-canvas-wrap" id="woot-canvas-wrap">
        <canvas id="woot-overlay-canvas"></canvas>
      </div>
      <div class="woot-row">
        <button class="woot-btn" id="woot-btn-apply" disabled>⚡ Apply</button>
        <button class="woot-btn" id="woot-btn-stop">⏹ Stop</button>
      </div>
      <div class="woot-opts">
        ⏱ Delay (ms):
        <input type="number" id="woot-delay" value="120" min="50" max="1000">
      </div>
      <div id="woot-progress"><div id="woot-progress-bar"></div></div>
      <div id="woot-status">No image loaded</div>
      ${bmacHTML}
    `;
    document.body.appendChild(panel);

    /* Drag */
    let drag = false, ox = 0, oy = 0;
    const h = panel.querySelector("h3");
    h.addEventListener("mousedown", (e) => {
      drag = true;
      ox = e.clientX - panel.offsetLeft;
      oy = e.clientY - panel.offsetTop;
    });
    document.addEventListener("mousemove", (e) => {
      if (!drag) return;
      panel.style.right = panel.style.bottom = "auto";
      panel.style.left = e.clientX - ox + "px";
      panel.style.top  = e.clientY - oy + "px";
    });
    document.addEventListener("mouseup", () => { drag = false; });

    /* Event bindings */
    document.getElementById("woot-file-input").addEventListener("change", onFileLoad);
    document.getElementById("woot-btn-apply").addEventListener("click", doApply);
    document.getElementById("woot-btn-stop").addEventListener("click", () => { stopFlag = true; });
  }

  /* ─── State ───────────────────────────────────────────────────────────── */
  let uploadedImage = null;
  let colorMap      = {};
  let stopFlag      = false;

  /* ─── Load image ──────────────────────────────────────────────────────── */
  function onFileLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        setStatus(`Image loaded: ${img.width}x${img.height}px`);
        document.getElementById("woot-btn-apply").disabled = false;
        document.getElementById("woot-canvas-wrap").style.display = "block";
        drawPreview();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ─── Get all keys ────────────────────────────────────────────────────── */
  function getAllKeys() {
    const keys = [], seen = new Set();
    document.querySelectorAll("[class]").forEach((el) => {
      for (const cls of el.classList) {
        if (/^key-\d+-\d+-\d+$/.test(cls) && !seen.has(cls)) {
          seen.add(cls);
          const clickTarget = el.querySelector(".keyRender") || el;
          keys.push({ el, clickTarget, id: cls });
        }
      }
    });
    return keys;
  }

  /* ─── Keyboard bounding box ───────────────────────────────────────────── */
  function getKeyboardRect(keys) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    keys.forEach(({ el }) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    });
    return { left: minX, top: minY, width: maxX - minX, height: maxY - minY };
  }

  /* ─── Build color map ─────────────────────────────────────────────────── */
  function buildColorMap() {
    if (!uploadedImage) return false;
    const keys = getAllKeys();
    if (!keys.length) {
      setStatus("⚠️ No keys found. Open the Keyboard section.");
      return false;
    }
    const cvs = document.createElement("canvas");
    cvs.width  = uploadedImage.width;
    cvs.height = uploadedImage.height;
    const ctx  = cvs.getContext("2d");
    ctx.drawImage(uploadedImage, 0, 0);

    const kb = getKeyboardRect(keys);
    colorMap  = {};
    keys.forEach(({ el, id }) => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const nx = Math.max(0, Math.min(1, (r.left + r.width  / 2 - kb.left) / kb.width));
      const ny = Math.max(0, Math.min(1, (r.top  + r.height / 2 - kb.top)  / kb.height));
      const px = Math.floor(nx * (uploadedImage.width  - 1));
      const py = Math.floor(ny * (uploadedImage.height - 1));
      const d  = ctx.getImageData(px, py, 1, 1).data;
      colorMap[id] = [d[0], d[1], d[2]];
    });
    return true;
  }

  /* ─── Draw preview on canvas ──────────────────────────────────────────── */
  function drawPreview() {
    if (!buildColorMap()) return;
    const keys   = getAllKeys();
    const kb     = getKeyboardRect(keys);
    const canvas = document.getElementById("woot-overlay-canvas");
    const wrap   = document.getElementById("woot-canvas-wrap");
    const scale  = (wrap.offsetWidth || 288) / kb.width;
    canvas.width  = kb.width  * scale;
    canvas.height = kb.height * scale;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    keys.forEach(({ el, id }) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !colorMap[id]) return;
      const [R, G, B] = colorMap[id];
      const x = (r.left - kb.left) * scale;
      const y = (r.top  - kb.top)  * scale;
      ctx.shadowColor = `rgb(${R},${G},${B})`;
      ctx.shadowBlur  = 6;
      ctx.fillStyle   = `rgb(${R},${G},${B})`;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, r.width * scale - 2, r.height * scale - 2, 3);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    setStatus(`Preview: ${Object.keys(colorMap).length} keys`);
  }

  /* ─── Simulate realistic click on an element ──────────────────────────── */
  function simulateClick(el) {
    const rect = el.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy,
                   screenX: cx, screenY: cy, view: window };
    el.dispatchEvent(new PointerEvent("pointerover",  { ...opts, pointerId: 1 }));
    el.dispatchEvent(new MouseEvent("mouseover",       opts));
    el.dispatchEvent(new PointerEvent("pointermove",  { ...opts, pointerId: 1 }));
    el.dispatchEvent(new MouseEvent("mousemove",       opts));
    el.dispatchEvent(new PointerEvent("pointerdown",  { ...opts, pointerId: 1, button: 0, buttons: 1 }));
    el.dispatchEvent(new MouseEvent("mousedown",      { ...opts, button: 0, buttons: 1 }));
    el.dispatchEvent(new PointerEvent("pointerup",    { ...opts, pointerId: 1, button: 0 }));
    el.dispatchEvent(new MouseEvent("mouseup",        { ...opts, button: 0 }));
    el.dispatchEvent(new MouseEvent("click",          { ...opts, button: 0 }));
  }

  /* ─── RGB → HEX ───────────────────────────────────────────────────────── */
  const rgbToHex = (r, g, b) =>
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

  /* ─────────────────────────────────────────────────────────────────────────
   * Set a value on a React-controlled <input> using the native prototype
   * setter + __reactProps$ so onChange / onBlur fire correctly.
   * ─────────────────────────────────────────────────────────────────────── */
  function setReactInputValue(inp, value) {
    // 1. Native setter - bypasses React's change-tracking
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value"
    );
    nativeSetter.set.call(inp, value);

    // 2. Fire React's own onChange / onBlur via __reactProps$
    const propsKey = Object.keys(inp).find((k) => k.startsWith("__reactProps$"));
    if (propsKey) {
      const rProps         = inp[propsKey];
      const syntheticEvent = {
        target: inp, currentTarget: inp,
        nativeEvent: new Event("input"),
        bubbles: true,
        preventDefault:  () => {},
        stopPropagation: () => {},
      };
      if (typeof rProps.onChange === "function") rProps.onChange(syntheticEvent);
      if (typeof rProps.onBlur   === "function") rProps.onBlur(syntheticEvent);
    }

    // 3. Fallback: standard DOM events
    inp.dispatchEvent(new Event("input",  { bubbles: true }));
    inp.dispatchEvent(new Event("change", { bubbles: true }));
    inp.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * Ensure the color picker is in RGB mode.
   * If the HEX input (css-gmjca6) is visible, opens the HEX/RGB dropdown
   * and clicks the "RGB" menu item.
   * ─────────────────────────────────────────────────────────────────────── */
  async function ensureRgbMode() {
    const hexInput = document.querySelector("input.css-gmjca6");
    if (!hexInput) return false; // picker not visible

    const container = hexInput.closest(".css-15vqpxh");
    if (!container) return false;

    // Find the HEX/RGB toggle button near the hex input
    const pickerSection = hexInput.closest('[class*="chakra-card"], [class*="css-"]') || document.body;
    const menuBtn = [...pickerSection.querySelectorAll('[aria-haspopup="menu"]')]
      .find(btn => {
        const rect      = btn.getBoundingClientRect();
        const inputRect = hexInput.getBoundingClientRect();
        return rect.width > 0 && Math.abs(rect.top - inputRect.top) < 60;
      });

    if (!menuBtn) return false;

    // Open dropdown and click "RGB"
    simulateClick(menuBtn);
    await sleep(80);

    const rgbItem = [...document.querySelectorAll('[role="menuitem"]')]
      .find(item => item.textContent.trim() === "RGB");
    if (rgbItem) {
      simulateClick(rgbItem);
      await sleep(80);
    }

    return true;
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * Find the 3 RGB inputs of the picker (when in RGB mode).
   * Returns [inputR, inputG, inputB] or null.
   * ─────────────────────────────────────────────────────────────────────── */
  function findRgbInputs() {
    const inputs = [...document.querySelectorAll('input[type="text"], input[type="number"]')]
      .filter(inp => {
        const rect = inp.getBoundingClientRect();
        if (rect.width === 0) return false;
        const val = parseInt(inp.value, 10);
        return !isNaN(val) && val >= 0 && val <= 255 && !/^#/.test(inp.value);
      });

    if (inputs.length >= 3) return [inputs[0], inputs[1], inputs[2]];
    return null;
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * Main strategy: write R, G, B values directly into the picker's RGB fields.
   * Switches the picker to RGB mode first if needed.
   * ─────────────────────────────────────────────────────────────────────── */
  async function applyColorToPicker(r, g, b, waitMs) {
    // Switch to RGB mode if the HEX input is still visible
    if (document.querySelector("input.css-gmjca6")) {
      await ensureRgbMode();
      await sleep(60);
    }

    const rgbInputs = findRgbInputs();

    if (rgbInputs) {
      setReactInputValue(rgbInputs[0], String(r));
      await sleep(20);
      setReactInputValue(rgbInputs[1], String(g));
      await sleep(20);
      setReactInputValue(rgbInputs[2], String(b));
      await sleep(20);
    } else {
      // Fallback: set HEX input if RGB fields are not found
      const hex    = rgbToHex(r, g, b);
      const hexInp = document.querySelector("input.css-gmjca6") ||
        [...document.querySelectorAll('input[type="text"]')]
          .find(i => /^#[0-9a-f]{6}$/i.test(i.value));
      if (hexInp) setReactInputValue(hexInp, hex);
    }

    // Wait for React to propagate the updated state before clicking the key
    await sleep(waitMs);
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * Check that the color picker is present in the DOM before starting.
   * The picker is only rendered when the user is on the RGB Settings tab.
   * Returns true if found, false otherwise.
   * ─────────────────────────────────────────────────────────────────────── */
  function isPickerAvailable() {
    // HEX mode: input.css-gmjca6 is visible
    const hexInput = document.querySelector("input.css-gmjca6");
    if (hexInput && hexInput.getBoundingClientRect().width > 0) return true;

    // RGB mode: at least 3 visible numeric inputs with values 0-255
    const rgbInputs = findRgbInputs();
    if (rgbInputs) return true;

    return false;
  }

  /* ─── Apply ───────────────────────────────────────────────────────────── */
  async function doApply() {
    if (!buildColorMap()) return;

    // Guard: abort if the color picker is not visible (wrong page/tab)
    if (!isPickerAvailable()) {
      setStatus("⚠️ Color picker not found!\nPlease go to the RGB Settings tab first.", true);
      return;
    }

    const delay = parseInt(document.getElementById("woot-delay").value, 10) || 120;
    const keys  = getAllKeys().filter((k) => colorMap[k.id]);
    if (!keys.length) {
      setStatus("⚠️ No keys found!");
      return;
    }

    stopFlag = false;
    const btnApply  = document.getElementById("woot-btn-apply");
    const btnStop   = document.getElementById("woot-btn-stop");
    const progWrap  = document.getElementById("woot-progress");
    const progBar   = document.getElementById("woot-progress-bar");

    btnApply.disabled      = true;
    btnStop.style.display  = "block";
    progWrap.style.display = "block";
    progBar.style.width    = "0%";
    setStatus(`Applying... 0 / ${keys.length}`);

    for (let i = 0; i < keys.length; i++) {
      if (stopFlag) {
        setStatus("⏹ Stopped.");
        break;
      }

      const { el, clickTarget, id } = keys[i];
      const [R, G, B] = colorMap[id];
      const hex = rgbToHex(R, G, B);

      // Write R,G,B into the picker's RGB fields and wait for React to update
      await applyColorToPicker(R, G, B, delay);

      // Click the key (React state is now up to date with the correct color)
      simulateClick(clickTarget);
      if (clickTarget !== el) simulateClick(el);

      // Short post-click pause so Wootility can register the assignment
      await sleep(Math.round(delay * 0.3));

      const pct = Math.round(((i + 1) / keys.length) * 100);
      progBar.style.width = pct + "%";
      setStatus(`Applying... ${i + 1} / ${keys.length}  —  ${hex}`);
    }

    btnApply.disabled     = false;
    btnStop.style.display = "none";
    if (!stopFlag) setStatus(`✅ Done! ${keys.length} keys updated.`);
  }

  /* ─── Helpers ─────────────────────────────────────────────────────────── */
  const sleep     = (ms)  => new Promise((r) => setTimeout(r, ms));
  const setStatus = (msg, isError = false) => {
    const el = document.getElementById("woot-status");
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("woot-error", isError);
  };

  /* ─── Init ────────────────────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(injectPanel, 600));
  } else {
    setTimeout(injectPanel, 600);
  }
})();
