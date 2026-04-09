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
      const cssW = Math.min(window.innerWidth, 900);
      const cssH = window.innerHeight;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      w = cssW;
      h = cssH;
      cx = w / 2;
      R = Math.min(w * 0.42, h * 0.315);
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

    function material(type, active = false) {
      if (type === "hour") {
        return active
          ? { a: "rgba(255,249,202,0.98)", b: "rgba(255,207,81,0.96)", c: "rgba(151,101,15,0.98)", mirror: "rgba(20,18,18,0.92)", edge: "rgba(132,92,20,0.85)" }
          : { a: "rgba(255,245,199,0.92)", b: "rgba(228,188,89,0.88)", c: "rgba(129,94,33,0.82)", mirror: "rgba(55,48,38,0.32)", edge: "rgba(135,104,44,0.55)" };
      }
      if (type === "min") {
        return active
          ? { a: "rgba(236,251,255,0.98)", b: "rgba(136,206,255,0.96)", c: "rgba(51,111,153,0.98)", mirror: "rgba(18,18,22,0.92)", edge: "rgba(76,128,170,0.85)" }
          : { a: "rgba(237,247,255,0.92)", b: "rgba(171,209,238,0.85)", c: "rgba(93,121,151,0.78)", mirror: "rgba(45,52,62,0.30)", edge: "rgba(111,141,167,0.50)" };
      }
      return active
        ? { a: "rgba(255,241,247,0.98)", b: "rgba(255,162,205,0.96)", c: "rgba(153,46,97,0.98)", mirror: "rgba(18,18,22,0.92)", edge: "rgba(162,70,118,0.88)" }
        : { a: "rgba(255,239,247,0.90)", b: "rgba(233,180,206,0.82)", c: "rgba(132,92,114,0.75)", mirror: "rgba(62,50,56,0.28)", edge: "rgba(154,118,139,0.48)" };
    }

    function drawTriPrism({ angleDeg, innerR, outerR, widthDeg, rotation, type, active, mirrorSide }) {
      const mat = material(type, active);
      const a = rad(angleDeg);
      const half = rad(widthDeg / 2);
      const dirL = a - half;
      const dirR = a + half;

      const inL = [cx + innerR * Math.cos(dirL), cy + innerR * Math.sin(dirL)];
      const inR = [cx + innerR * Math.cos(dirR), cy + innerR * Math.sin(dirR)];
      const outC = [cx + outerR * Math.cos(a), cy + outerR * Math.sin(a)];

      const axisX = Math.cos(a);
      const axisY = Math.sin(a);
      const nx = Math.cos(a + Math.PI / 2);
      const ny = Math.sin(a + Math.PI / 2);
      const bodyLen = outerR - innerR;
      const bodyWidth = bodyLen * 0.16;
      const tilt = rotation * bodyWidth * 0.65;

      const p1 = [inL[0] - nx * tilt, inL[1] - ny * tilt];
      const p2 = [outC[0] - nx * tilt * 0.55, outC[1] - ny * tilt * 0.55];
      const p3 = [inR[0] + nx * tilt, inR[1] + ny * tilt];

      const front = ctx.createLinearGradient(p1[0], p1[1], p3[0], p3[1]);
      front.addColorStop(0, mat.c);
      front.addColorStop(0.32, mat.b);
      front.addColorStop(0.52, mat.a);
      front.addColorStop(0.74, mat.b);
      front.addColorStop(1, mat.c);

      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.closePath();
      ctx.fillStyle = front;
      ctx.fill();

      const faceDepth = bodyWidth * 0.55;
      const leftFace = [
        p1,
        [p2[0] - nx * faceDepth, p2[1] - ny * faceDepth],
        [p2[0], p2[1]],
      ];
      const rightFace = [
        [p2[0], p2[1]],
        [p2[0] + nx * faceDepth, p2[1] + ny * faceDepth],
        p3,
      ];

      const leftMirror = mirrorSide === "left";
      const rightMirror = mirrorSide === "right";

      ctx.beginPath();
      ctx.moveTo(leftFace[0][0], leftFace[0][1]);
      ctx.lineTo(leftFace[1][0], leftFace[1][1]);
      ctx.lineTo(leftFace[2][0], leftFace[2][1]);
      ctx.closePath();
      ctx.fillStyle = leftMirror ? mat.mirror : "rgba(255,255,255,0.18)";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(rightFace[0][0], rightFace[0][1]);
      ctx.lineTo(rightFace[1][0], rightFace[1][1]);
      ctx.lineTo(rightFace[2][0], rightFace[2][1]);
      ctx.closePath();
      ctx.fillStyle = rightMirror ? mat.mirror : "rgba(0,0,0,0.10)";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.closePath();
      ctx.strokeStyle = mat.edge;
      ctx.lineWidth = Math.max(0.8, R * 0.003);
      ctx.stroke();

      const capW = bodyWidth * 0.52;
      const cap1 = [cx + innerR * Math.cos(a) - nx * capW, cy + innerR * Math.sin(a) - ny * capW];
      const cap2 = [cx + innerR * Math.cos(a) + nx * capW, cy + innerR * Math.sin(a) + ny * capW];
      const cap3 = [cx + (innerR + bodyWidth * 0.9) * Math.cos(a), cy + (innerR + bodyWidth * 0.9) * Math.sin(a)];
      ctx.beginPath();
      ctx.moveTo(cap1[0], cap1[1]);
      ctx.lineTo(cap2[0], cap2[1]);
      ctx.lineTo(cap3[0], cap3[1]);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fill();
    }

    function drawRing({ type, values, petals, innerR, outerR, activeValue, progress }) {
      const step = 360 / values;
      const widthDeg = step * 0.86;
      const leftIndex = activeValue;
      const rightIndex = activeValue + 1;

      for (let i = 0; i < petals; i++) {
        const slot = Math.min(i, values - 1);
        const baseDeg = baseAngleForSlot(slot, values);
        let rotation = 0;
        let mirrorSide = "down";
        let active = false;

        if (i === leftIndex) {
          rotation = lerp(0, 1, progress);
          mirrorSide = "right";
          active = true;
        } else if (i === rightIndex) {
          rotation = lerp(0, 1, progress);
          mirrorSide = "left";
          active = true;
        }

        drawTriPrism({
          angleDeg: baseDeg,
          innerR,
          outerR,
          widthDeg,
          rotation,
          type,
          active,
          mirrorSide,
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
        ctx.shadowColor = on ? activeColor : "transparent";
        ctx.shadowBlur = on ? size * 0.6 : 0;
        ctx.fillText(pad(i), x, y);
      }
      ctx.shadowBlur = 0;
    }

    function drawVirtualArrow(total, value, len, color, width) {
      const a = rad(seamAngle(value, total));
      const ex = cx + len * Math.cos(a);
      const ey = cy + len * Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = width * 2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const pa = a + Math.PI / 2;
      const head = Math.max(7, width * 2.2);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - head * Math.cos(a) + head * 0.42 * Math.cos(pa), ey - head * Math.sin(a) + head * 0.42 * Math.sin(pa));
      ctx.lineTo(ex - head * Math.cos(a) - head * 0.42 * Math.cos(pa), ey - head * Math.sin(a) - head * 0.42 * Math.sin(pa));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function drawGem(gemR) {
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, gemR * 2.2);
      halo.addColorStop(0, "rgba(255,214,120,0.90)");
      halo.addColorStop(0.4, "rgba(255,184,44,0.45)");
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
      ctx.fillStyle = "rgba(255,255,255,0.66)";
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
        const a = rad(angleForValue(v, 60));
        const r1 = R + R * 0.01;
        const r2 = R - R * 0.042;
        ctx.beginPath();
        ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
        ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a));
        ctx.strokeStyle = "#d4a100";
        ctx.lineWidth = Math.max(2, R * 0.010);
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
      });

      drawRing({
        type: "min",
        values: VALUE_COUNT.min,
        petals: PETAL_COUNT.min,
        innerR: MIN.inner,
        outerR: MIN.outer,
        activeValue: mm,
        progress: anim.m,
      });

      drawRing({
        type: "hour",
        values: VALUE_COUNT.hour,
        petals: PETAL_COUNT.hour,
        innerR: HR.inner,
        outerR: HR.outer,
        activeValue: hh,
        progress: anim.h,
      });

      drawGem(gemR);

      drawSeamNumbers(24, hh, R + R * 0.10, Math.max(14, R * 0.050), "rgba(72,78,90,0.86)", "#9b6d00");
      drawSeamNumbers(60, mm, R + R * 0.062, Math.max(9, R * 0.026), "rgba(75,98,120,0.62)", "#2e84c9");
      drawSeamNumbers(60, ss, R + R * 0.028, Math.max(9, R * 0.026), "rgba(116,84,101,0.58)", "#c04482");

      const hourLen = lerp(HR.inner, HR.outer, 0.76);
      const minLen = lerp(MIN.inner, MIN.outer, 0.80);
      const secLen = lerp(SEC.inner, SEC.outer, 0.90);

      drawVirtualArrow(24, hh, hourLen, "rgba(215,153,22,0.92)", Math.max(2.0, R * 0.008));
      drawVirtualArrow(60, mm, minLen, "rgba(67,142,201,0.86)", Math.max(1.9, R * 0.0065));
      drawVirtualArrow(60, ss, secLen, "rgba(189,75,130,0.82)", Math.max(1.8, R * 0.006));

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
    <div style={{ width: "100vw", height: "100vh", background: "#f4efe6", overflow: "hidden", display: "grid", placeItems: "center" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
