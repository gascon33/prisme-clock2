import { useEffect, useRef } from "react";

function pad(n) {
  return String(n).padStart(2, "0");
}

function getNow() {
  const d = new Date();
  return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
}

function rad(deg) {
  return (deg * Math.PI) / 180;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function App() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let R = 0;

    let last = { h: 0, m: 0, s: 0 };
    let prev = { h: 0, m: 0, s: 0 };
    let anim = { h: 1, m: 1, s: 1 };

    const VALUE_COUNT = { hour: 24, min: 60, sec: 60 };
    const ROD_COUNT = { hour: 25, min: 61, sec: 61 };

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = Math.min(window.innerWidth, 940);
      const cssH = window.innerHeight;

      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      w = cssW;
      h = cssH;
      cx = w / 2;
      R = Math.min(w * 0.425, h * 0.315);
      cy = R + 58;
    }

    function initTime() {
      const t = getNow();
      last = { ...t };
      prev = { ...t };
      anim = { h: 1, m: 1, s: 1 };
    }

    function tickAnim() {
      const t = getNow();
      if (t.s !== last.s) {
        prev.s = last.s;
        last.s = t.s;
        anim.s = 0;
      }
      if (t.m !== last.m) {
        prev.m = last.m;
        last.m = t.m;
        anim.m = 0;
      }
      if (t.h !== last.h) {
        prev.h = last.h;
        last.h = t.h;
        anim.h = 0;
      }

      anim.s = Math.min(1, anim.s + 0.115);
      anim.m = Math.min(1, anim.m + 0.082);
      anim.h = Math.min(1, anim.h + 0.062);
    }

    function slotAngle(slot, totalValues) {
      return -90 + (slot * 360) / totalValues;
    }

    function seamAngle(value, totalValues) {
      const step = 360 / totalValues;
      return -90 + value * step + step / 2;
    }

    function pt(r, a) {
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }

    function rodMaterial(type, active) {
      if (type === "hour") {
        return active
          ? {
              light: "rgba(255,248,214,0.98)",
              mid: "rgba(248,202,72,0.98)",
              dark: "rgba(151,102,18,0.96)",
              mirror: "rgba(14,14,16,0.97)",
              edge: "rgba(129,92,22,0.84)",
              gloss: "rgba(255,255,255,0.22)",
            }
          : {
              light: "rgba(255,246,215,0.72)",
              mid: "rgba(216,181,89,0.55)",
              dark: "rgba(129,97,39,0.48)",
              mirror: "rgba(40,34,29,0.12)",
              edge: "rgba(120,95,40,0.28)",
              gloss: "rgba(255,255,255,0.12)",
            };
      }
      if (type === "min") {
        return active
          ? {
              light: "rgba(236,250,255,0.98)",
              mid: "rgba(135,206,255,0.98)",
              dark: "rgba(56,112,154,0.96)",
              mirror: "rgba(14,15,18,0.97)",
              edge: "rgba(72,125,165,0.82)",
              gloss: "rgba(255,255,255,0.22)",
            }
          : {
              light: "rgba(236,247,255,0.68)",
              mid: "rgba(166,199,224,0.52)",
              dark: "rgba(95,123,149,0.44)",
              mirror: "rgba(34,40,48,0.12)",
              edge: "rgba(90,120,145,0.26)",
              gloss: "rgba(255,255,255,0.11)",
            };
      }
      return active
        ? {
            light: "rgba(255,240,246,0.98)",
            mid: "rgba(246,150,198,0.98)",
            dark: "rgba(156,53,101,0.96)",
            mirror: "rgba(15,14,18,0.97)",
            edge: "rgba(150,72,110,0.82)",
            gloss: "rgba(255,255,255,0.22)",
          }
        : {
            light: "rgba(255,240,247,0.64)",
            mid: "rgba(216,165,190,0.48)",
            dark: "rgba(137,96,118,0.42)",
            mirror: "rgba(44,36,42,0.12)",
            edge: "rgba(129,101,117,0.24)",
            gloss: "rgba(255,255,255,0.10)",
          };
    }

    function fillPath(points, fillStyle, strokeStyle = null, lineWidth = 1) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    }

    function drawPrismRod({ angleDeg, innerR, outerR, widthIn, widthOut, type, active, mirrorSide, turn }) {
      const a = rad(angleDeg);
      const n = a + Math.PI / 2;
      const mat = rodMaterial(type, active);
      const outerSpread = 1 + turn * 0.18;
      const mirrorPull = Math.max(widthOut * 0.18, 2) * turn;

      const cIn = pt(innerR, a);
      const cOut = pt(outerR, a);

      const inL = [cIn[0] - Math.cos(n) * widthIn * 0.5, cIn[1] - Math.sin(n) * widthIn * 0.5];
      const inR = [cIn[0] + Math.cos(n) * widthIn * 0.5, cIn[1] + Math.sin(n) * widthIn * 0.5];
      const outL = [cOut[0] - Math.cos(n) * widthOut * outerSpread * 0.5, cOut[1] - Math.sin(n) * widthOut * outerSpread * 0.5];
      const outR = [cOut[0] + Math.cos(n) * widthOut * outerSpread * 0.5, cOut[1] + Math.sin(n) * widthOut * outerSpread * 0.5];
      const ridge = [cOut[0] + Math.cos(a) * (outerR - innerR) * 0.035, cOut[1] + Math.sin(a) * (outerR - innerR) * 0.035];

      const leftMirrorMid = [(inL[0] + outL[0]) * 0.5 + Math.cos(n) * mirrorPull, (inL[1] + outL[1]) * 0.5 + Math.sin(n) * mirrorPull];
      const rightMirrorMid = [(inR[0] + outR[0]) * 0.5 - Math.cos(n) * mirrorPull, (inR[1] + outR[1]) * 0.5 - Math.sin(n) * mirrorPull];

      const leftFace = [inL, leftMirrorMid, outL, ridge];
      const rightFace = [ridge, outR, rightMirrorMid, inR];
      const innerCap = [inL, inR, ridge];

      const gradLeft = ctx.createLinearGradient(inL[0], inL[1], outL[0], outL[1]);
      gradLeft.addColorStop(0, mat.dark);
      gradLeft.addColorStop(0.45, mat.mid);
      gradLeft.addColorStop(1, mat.light);

      const gradRight = ctx.createLinearGradient(inR[0], inR[1], outR[0], outR[1]);
      gradRight.addColorStop(0, mat.dark);
      gradRight.addColorStop(0.45, mat.mid);
      gradRight.addColorStop(1, mat.light);

      fillPath(leftFace, mirrorSide === "left" ? mat.mirror : gradLeft, mat.edge, Math.max(0.7, R * 0.0022));
      fillPath(rightFace, mirrorSide === "right" ? mat.mirror : gradRight, mat.edge, Math.max(0.7, R * 0.0022));
      fillPath(innerCap, "rgba(255,255,255,0.08)");

      ctx.beginPath();
      ctx.moveTo(cIn[0], cIn[1]);
      ctx.lineTo(ridge[0], ridge[1]);
      ctx.strokeStyle = mat.gloss;
      ctx.lineWidth = Math.max(0.8, R * 0.0023);
      ctx.stroke();
    }

    function drawRing({ type, values, rods, innerR, outerR, value, progress, widthFactor }) {
      const t = easeOutCubic(progress);
      const leftIndex = value;
      const rightIndex = value + 1;
      const step = 360 / values;
      const widthIn = step * R * widthFactor * 0.012;
      const widthOut = widthIn * 1.38;

      for (let i = 0; i < rods; i++) {
        const slot = Math.min(i, values - 1);
        const angleDeg = slotAngle(slot, values);
        let active = false;
        let mirrorSide = null;
        let turn = 0;

        if (i === leftIndex) {
          active = true;
          mirrorSide = "right";
          turn = t;
        } else if (i === rightIndex) {
          active = true;
          mirrorSide = "left";
          turn = t;
        }

        drawPrismRod({
          angleDeg,
          innerR,
          outerR,
          widthIn,
          widthOut,
          type,
          active,
          mirrorSide,
          turn,
        });
      }
    }

    function drawNumbers(total, activeValue, radius, size, color, activeColor) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < total; i++) {
        const a = rad(seamAngle(i, total));
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);
        const on = i === activeValue;
        ctx.font = `${on ? 700 : 500} ${size}px Arial`;
        ctx.fillStyle = on ? activeColor : color;
        if (on) {
          ctx.shadowColor = activeColor;
          ctx.shadowBlur = size * 0.35;
        }
        ctx.fillText(pad(i), x, y);
        ctx.shadowBlur = 0;
      }
    }

    function drawCenterGem(r) {
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
      halo.addColorStop(0, "rgba(255,216,124,0.92)");
      halo.addColorStop(0.42, "rgba(255,184,44,0.44)");
      halo.addColorStop(1, "rgba(255,184,44,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.1, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      const g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.12, cx, cy, r);
      g.addColorStop(0, "#fff4ad");
      g.addColorStop(0.42, "#ffd24b");
      g.addColorStop(0.75, "#f3a100");
      g.addColorStop(1, "#cc7d00");
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#fcfbf7");
      g.addColorStop(1, "#ece7de");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.beginPath();
      ctx.arc(cx, cy, R + R * 0.03, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, R + R * 0.03, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180,184,186,0.55)";
      ctx.lineWidth = Math.max(1.2, R * 0.006);
      ctx.stroke();
    }

    function drawMainMarks() {
      const marks = [0, 15, 30, 45];
      for (const v of marks) {
        const a = rad(slotAngle(v, 60));
        const r1 = R + R * 0.01;
        const r2 = R - R * 0.042;
        ctx.beginPath();
        ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
        ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a));
        ctx.strokeStyle = "#d4a100";
        ctx.lineWidth = Math.max(2, R * 0.01);
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    function drawDigital(hh, mm, ss) {
      const y = cy + R + R * 0.17;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${Math.max(30, R * 0.16)}px Arial`;
      ctx.fillStyle = "#17202a";
      ctx.fillText(`${pad(hh)}:${pad(mm)}:${pad(ss)}`, cx, y);

      ctx.font = `600 ${Math.max(11, R * 0.042)}px Arial`;
      ctx.fillStyle = "rgba(76,78,84,0.52)";
      ctx.fillText("PRISM CLOCK", cx, y + R * 0.12);
    }

    function drawScene() {
      tickAnim();
      const { h: hh, m: mm, s: ss } = last;

      drawBackground();

      const gemR = R * 0.062;
      const gap1 = R * 0.035;
      const gap2 = R * 0.028;
      const gap3 = R * 0.028;
      const rimGap = R * 0.055;
      const usable = R - rimGap - gemR - gap1 - gap2 - gap3;

      const hourDepth = usable * 0.23;
      const minDepth = usable * 0.28;
      const secDepth = usable * 0.49;

      const HR = { inner: gemR + gap1, outer: gemR + gap1 + hourDepth };
      const MIN = { inner: HR.outer + gap2, outer: HR.outer + gap2 + minDepth };
      const SEC = { inner: MIN.outer + gap3, outer: MIN.outer + gap3 + secDepth };

      drawMainMarks();

      drawRing({
        type: "sec",
        values: VALUE_COUNT.sec,
        rods: ROD_COUNT.sec,
        innerR: SEC.inner,
        outerR: SEC.outer,
        value: ss,
        progress: anim.s,
        widthFactor: 1.02,
      });

      drawRing({
        type: "min",
        values: VALUE_COUNT.min,
        rods: ROD_COUNT.min,
        innerR: MIN.inner,
        outerR: MIN.outer,
        value: mm,
        progress: anim.m,
        widthFactor: 1.16,
      });

      drawRing({
        type: "hour",
        values: VALUE_COUNT.hour,
        rods: ROD_COUNT.hour,
        innerR: HR.inner,
        outerR: HR.outer,
        value: hh,
        progress: anim.h,
        widthFactor: 1.42,
      });

      drawCenterGem(gemR);

      drawNumbers(24, hh, R + R * 0.1, Math.max(14, R * 0.05), "rgba(72,78,90,0.86)", "#9b6d00");
      drawNumbers(60, mm, R + R * 0.062, Math.max(9, R * 0.026), "rgba(75,98,120,0.62)", "#2e84c9");
      drawNumbers(60, ss, R + R * 0.028, Math.max(9, R * 0.026), "rgba(116,84,101,0.58)", "#c04482");

      drawDigital(hh, mm, ss);
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      drawScene();
      raf = requestAnimationFrame(frame);
    }

    resize();
    initTime();
    frame();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#f4efe6",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
