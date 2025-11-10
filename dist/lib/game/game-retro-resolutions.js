const n = {
  NES: {
    displayAspect: 1.3333333333333333,
    resolutions: [
      { key: "256x240", width: 256, height: 240, notes: "Standard NTSC; effective 240p." }
    ]
  },
  SNES: {
    displayAspect: 1.3333333333333333,
    resolutions: [
      { key: "256x224", width: 256, height: 224, notes: "Common 240p-equivalent mode." },
      { key: "512x448", width: 512, height: 448, notes: "Hi-res interlaced (480i)." }
    ]
  },
  N64: {
    displayAspect: 1.3333333333333333,
    resolutions: [
      { key: "320x240", width: 320, height: 240, notes: "Common 240p mode." },
      { key: "640x480", width: 640, height: 480, notes: "Higher resolution (480i)." }
    ]
  },
  PS1: {
    displayAspect: 1.3333333333333333,
    resolutions: [
      { key: "320x240", width: 320, height: 240, notes: "Progressive 240p common." },
      { key: "640x480", width: 640, height: 480, notes: "Interlaced 480i for higher detail." }
    ]
  },
  PS2: {
    displayAspect: 1.3333333333333333,
    resolutions: [
      { key: "640x480", width: 640, height: 480, notes: "480i/480p baseline." },
      { key: "720x480", width: 720, height: 480, notes: "480p (widescreen capable in some titles)." },
      { key: "1280x720", width: 1280, height: 720, notes: "720p (select titles)." }
    ]
  },
  PS5: {
    displayAspect: 1.7777777777777777,
    resolutions: [
      { key: "720x480", width: 720, height: 480, notes: "Legacy compatibility." },
      { key: "1280x720", width: 1280, height: 720, notes: "720p." },
      { key: "1920x1080", width: 1920, height: 1080, notes: "1080p." },
      { key: "2560x1440", width: 2560, height: 1440, notes: "1440p." },
      { key: "3840x2160", width: 3840, height: 2160, notes: "4K (up to 120Hz)." },
      { key: "7680x4320", width: 7680, height: 4320, notes: "8K (limited)." }
    ]
  },
  XboxOne: {
    displayAspect: 1.7777777777777777,
    resolutions: [
      { key: "1280x720", width: 1280, height: 720, notes: "720p (original)." },
      { key: "1920x1080", width: 1920, height: 1080, notes: "1080p (original)." },
      { key: "3840x2160", width: 3840, height: 2160, notes: "4K UHD (S/X models)." }
    ]
  }
};
function h(e) {
  return n[e].displayAspect;
}
function r(e, o) {
  const t = n[e]?.resolutions || [];
  if (!o)
    return t[0];
  const i = o.toLowerCase().replace(/\s+/g, "").replace("×", "x");
  return t.find((s) => s.key.toLowerCase() === i);
}
function l(e) {
  if (!e)
    return null;
  const t = String(e).toLowerCase().trim().replace(/\s+/g, "").replace("×", "x").match(/^(\d+)x(\d+)$/);
  if (!t)
    return null;
  const i = parseInt(t[1], 10), s = parseInt(t[2], 10);
  return !Number.isFinite(i) || !Number.isFinite(s) ? null : { width: i, height: s };
}
export {
  n as RetroPresets,
  h as getDisplayAspect,
  r as getPresetResolution,
  l as parseResolution
};
