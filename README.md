# Wootility – Image RGB Color Mapper

A userscript for [Wootility](https://wootility.io/) that lets you load any image and automatically apply its colors to every key on your Wooting keyboard — mapping each key's position to the corresponding pixel in the image.

![preview](https://img.shields.io/badge/version-2.4.0-blue) ![license](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- 📁 Load any image (PNG, JPG, WebP, etc.)
- 🎨 Auto-maps image colors to keyboard keys based on position
- 🖼️ Live canvas preview showing the color layout before applying
- ⚡ Applies colors directly into Wootility's color picker via the RGB fields
- ⏱️ Configurable delay between key assignments
- ⏹️ Stop button to interrupt the process at any time
- 🔍 Pre-flight check: warns you if the color picker is not visible before starting
- 🖱️ Draggable floating panel

---

## 🚀 Installation

1. **Install a userscript manager** — if you don't have one yet, install [Tampermonkey](https://www.tampermonkey.net/) for your browser.

2. **Install the script** — click the link below (or open `img-to-wooting.js` and copy its contents into a new Tampermonkey script):

   > Tampermonkey Dashboard → **+** (Create new script) → paste the contents → **Save**

3. **Open Wootility** at [https://wootility.io/](https://wootility.io/) or **Open Wootility Beta** at [https://beta.wootility.io/](https://beta.wootility.io/). The panel will appear automatically in the bottom-right corner.

---

## 🎮 How to use

1. Open **Wootility** or **Wootility Beta** and navigate to the **RGB Settings** tab of your keyboard layout. The color picker must be visible on screen for the script to work.

2. The floating **Image → Keyboard** panel will appear in the bottom-right corner of the page. You can drag it by its title bar to reposition it.

3. Click **📁 Choose image** and select any image file from your computer. A small canvas preview will appear showing how the colors will be distributed across your keys.

4. Optionally adjust the **Delay (ms)** value. Higher values are more reliable on slower machines; the default of `120ms` works well in most cases.

5. Click **⚡ Apply**. The script will iterate through every key, set the correct color in Wootility's RGB picker, and assign it. A progress bar shows how far along the process is.

6. Use the **⏹ Stop** button at any time to interrupt the process.

> ⚠️ **Important:** Make sure the RGB color picker is visible on screen before clicking Apply. If the script can't find it, it will show an error message asking you to navigate to the RGB Settings tab first.

---


## 🛠️ How it works

The script samples the pixel color at the center of each key's position relative to the full keyboard bounding box, then maps that position onto the loaded image. For each key it:

1. Switches Wootility's color picker to RGB mode (if it isn't already)
2. Writes the R, G, B values directly into the picker's input fields using React's internal event system (`__reactProps$`) to ensure the state updates correctly
3. Simulates a click on the key to assign the color

---

## ☕ Support

If you find this useful, consider buying me a coffee:
[buymeacoffee.com/cerix](https://buymeacoffee.com/cerix)

