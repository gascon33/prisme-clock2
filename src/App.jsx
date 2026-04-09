import { useEffect, useRef } from "react";

function pad(n) {
  return String(n).padStart(2, "0");
}

function getNow() {
  const d = new Date();
  return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
}

function rad(d) {
  return (d * Math.PI) / 180;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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
    let anim = { h: 1, m: 1, s: 1 };
    let prev = { h: 0, m: 0, s: 0 };

    const VALUE_COUNT = { sec: 60, min: 60, hour: 24 };
    const PETAL_COUNT = { sec: 61, min: 61, hour: 25 };

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = Math.min(window.innerWidth, 920);
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
      cy = R + 56;
    }

    function resetTimeState() {
      const t = getNow();
      last = { ...t };
      prev = { ...t };
      anim = { h: 1, m: 1, s: 1 };
    }

    function updateAnimation() {
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
      anim.s = Math.min(1, anim.s + 0.11);
      anim.m = Math.min(1, anim.m + 0.08);
      anim.h = Math.min(1, anim.h + 0.06);
    }

    function baseAngleForSlot(slot, totalValues) {
      return -90 + (slot * 360) / totalValues;
    }

    function seamAngle(value, totalValues) {
      const step = 360 / totalValues;
      return -90 + value * step + step / 2;
    }

    function pointOn(radius, ang) {
      return [cx + radius * Math.cos(ang), cy + radius * Math.sin(ang)];
    }

    function material(type, active = false) {
      if (type === "hour") {
        return active
          ? { front1: "rgba(255,249,206,0.98)", front2: "rgba(250,196,60,0.98)", edge: "rgba(138,97,18,0.9)", mirror: "rgba(18,18,18,0.94)", glass: "rgba(255,248,215,0.16)" }
          : { front1: "rgba(255,245,212,0.78)", front2: "rgba(206,166,72,0.62)", edge: "rgba(136,102,41,0.42)", mirror: "rgba(45,41,34,0.14)", glass: "rgba(255,248,220,0.08)" };
      }
      if (type === "min") {
        return active
          ? { front1: "rgba(237,250,255,0.98)", front2: "rgba(115,193,255,0.98)", edge: "rgba(68,124,164,0.88)", mirror: "rgba(16,18,22,0.94)", glass: "rgba(227,247,255,0.15)" }
          : { front1: "rgba(236,247,255,0.72)", front2: "rgba(149,190,223,0.52)", edge: "rgba(92,124,150,0.36)", mirror: "rgba(33,39,48,0.13)", glass: "rgba(230,244,255,0.08)" };
      }
      return active
        ? { front1: "rgba(255,240,246,0.98)", front2: "rgba(244,135,188,0.98)", edge: "rgba(153,68,107,0.88)", mirror: "rgba(16,16,18,0.95)", glass: "rgba(255,236,246,0.16)" }
        : { front1: "rgba(255,240,246,0.68)", front2: "rgba(210,155,184,0.48)", edge: "rgba(141,103,122,0.34)", mirror: "rgba(52,42,48,0.14)", glass: "rgba(255,240,247,0.08)" };
    }

    function fillPoly(points, fillStyle, strokeStyle = null, lineWidth = 1) {
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

    function drawPrismRod({ angleDeg, innerR, outerR, widthIn, widthOut, type, active, mirrorSide, rotateAmount }) {
      const a = rad(angleDeg);
      const n = a + Math.PI / 2;
      const mat = material(type, active);
      const swing = rotateAmount * rad(2.5);
      const faceBend = rotateAmount * Math.max(widthOut * 0.38, 2);

      const innerCenter = pointOn(innerR, a);
      const outerCenter = pointOn(outerR, a);

      const inL = [innerCenter[0] - Math.cos(n) * widthIn * 0.5, innerCenter[1] - Math.sin(n) * widthIn * 0.5];
      const inR = [innerCenter[0] + Math.cos(n) * widthIn * 0.5, innerCenter[1] + Math.sin(n) * widthIn * 0.5];
      const outL = [outerCenter[0] - Math.cos(n + swing) * widthOut * 0.5, outerCenter[1] - Math.sin(n + swing) * widthOut * 0.5];
      const outR = [outerCenter[0] + Math.cos(n - swing) * widthOut * 0.5, outerCenter[1] + Math.sin(n - swing) * widthOut * 0.5];

      const ridge = [outerCenter[0] + Math.cos(a) * (outerR - innerR) * 0.02, outerCenter[1] + Math.sin(a) * (outerR - innerR) * 0.02];
      const leftMid = [(inL[0] + outL[0]) * 0.5 - Math.cos(n) * faceBend, (inL[1] + outL[1]) * 0.5 - Math.sin(n) * faceBend];
      const rightMid = [(inR[0] + outR[0]) * 0.5 + Math.cos(n) * faceBend, (inR[1] + outR[1]) * 0.5 + Math.sin(n) * faceBend];

      const leftFace = [inL, leftMid, outL, ridge];
      const rightFace = [ridge, outR, rightMid, inR];
      const frontCap = [inL, inR, ridge];

      const leftGradient = ctx.createLinearGradient(inL[0], inL[1], outL[0], outL[1]);
      leftGradient.addColorStop(0, mat.front1);
      leftGradient.addColorStop(1, mat.front2);

      const rightGradient = ctx.createLinearGradient(inR[0], inR[1], outR[0], outR[1]);
      rightGradient.addColorStop(0, mat.front1);
      rightGradient.addColorStop(1, mat.front2);

      fillPoly(leftFace, mirrorSide === "left" ? mat.mirror : leftGradient, mat.edge, Math.max(0.7, R * 0.0023));
      fillPoly(rightFace, mirrorSide === "right" ? mat.mirror : rightGradient, mat.edge, Math.max(0.7, R * 0.0023));
      fillPoly(frontCap, mat.glass);

      ctx.beginPath();
      ctx.moveTo(innerCenter[0], innerCenter[1]);
      ctx.lineTo(ridge[0], ridge[1]);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = Math.max(0.7, R * 0.0022);
      ctx.stroke();
    }

    function drawRing({ type, values, petals, innerR, outerR, activeValue, progress, widthScale }) {
      const e = easeOutCubic(progress);
      const step = 360 / values;
      const leftIndex = activeValue;
      const rightIndex = (activeValue + 1) % petals;
      const rodLen = outerR - innerR;
      const widthIn = step * R * widthScale * 0.014;
      const widthOut = widthIn * 1.68;

      for (let i = 0; i < petals; i++) {
        const slot = Math.min(i, values - 1);
        const baseDeg = baseAngleForSlot(slot, values);
        let mirrorSide = null;
        let active = false;
        let rotateAmount = 0;

        if (i === leftIndex) {
          mirrorSide = "right";
          active = true;
          rotateAmount = e;
        } else if (i === rightIndex) {
          mirrorSide = "left";
          active = true;
          rotateAmount = e;
        }

        drawPrismRod({
          angleDeg: baseDeg,
          innerR,
          outerR,
          widthIn,
          widthOut,
          type,
          active,
          mirrorSide,
          rotateAmount,
          rodLen,
        });
      }
    }

    function drawSeamNumbers(total, active, radius, size, color, activeColor) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < total; i++) {
        const a = rad(seamAngle(i, total));
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);
        const on = i === active;
        ctx.font = `${on ? 700 : 500} ${size}px Arial`;
        ctx.fillStyle = on ? activeColor : color;
        ctx.fillText(pad(i), x, y);
      }
    }

    function drawGem(gemR) {
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, gemR * 2.15);
      halo.addColorStop(0, "rgba(255,216,124,0.92)");
      halo.addColorStop(0.45, "rgba(255,184,44,0.42)");
      halo.addColorStop(1, "rgba(255,184,44,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, gemR * 2.1, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      const g = ctx.createRadialGradient(cx - gemR * 0.25, cy - gemR * 0.3, gemR * 0.12, cx, cy, gemR);
      g.addColorStop(0, "#fff3a8");
      g.addColorStop(0.42, "#ffd24b");
      g.addColorStop(0.75, "#f3a100");
      g.addColorStop(1, "#cc7d00");
      ctx.beginPath();
      ctx.arc(cx, cy, gemR, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    function drawFaceBackground() {
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
        const a = rad(baseAngleForSlot(v, 60));
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
      updateAnimation();
      const { h: hh, m: mm, s: ss } = last;

      drawFaceBackground();

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
        petals: PETAL_COUNT.sec,
        innerR: SEC.inner,
        outerR: SEC.outer,
        activeValue: ss,
        progress: anim.s,
        widthScale: 1,
      });

      drawRing({
        type: "min",
        values: VALUE_COUNT.min,
        petals: PETAL_COUNT.min,
        innerR: MIN.inner,
        outerR: MIN.outer,
        activeValue: mm,
        progress: anim.m,
        widthScale: 1.12,
      });

      drawRing({
        type: "hour",
        values: VALUE_COUNT.hour,
        petals: PETAL_COUNT.hour,
        innerR: HR.inner,
        outerR: HR.outer,
        activeValue: hh,
        progress: anim.h,
        widthScale: 1.34,
      });

      drawGem(gemR);

      drawSeamNumbers(24, hh, R + R * 0.1, Math.max(14, R * 0.05), "rgba(72,78,90,0.86)", "#9b6d00");
      drawSeamNumbers(60, mm, R + R * 0.062, Math.max(9, R * 0.026), "rgba(75,98,120,0.62)", "#2e84c9");
      drawSeamNumbers(60, ss, R + R * 0.028, Math.max(9, R * 0.026), "rgba(116,84,101,0.58)", "#c04482");

      drawDigital(hh, mm, ss);
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      drawScene();
      raf = requestAnimationFrame(frame);
    }

    resize();
    resetTimeState();
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
