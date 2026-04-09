import { useEffect, useRef } from "react";

function getNow() {
  const d = new Date();
  return { hr: d.getHours(), min: d.getMinutes(), sec: d.getSeconds() };
}
function toRad(d) {
  return (d * Math.PI) / 180;
}
function pad(n) {
  return String(n).padStart(2, "0");
}

export default function App() {
  const cv = useRef(null);

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = Math.min(window.innerWidth * 0.92, 820);
      const cssH = Math.min(window.innerHeight * 0.96, 980);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function angle24(v) {
      return v * 15 + 180;
    }
    function angle60(v) {
      return v * 6 + 180;
    }

    function ringText(value, total, radius, size, color, activeColor, activeValue) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${size}px Arial`;
      for (let i = 0; i < total; i++) {
        const a = toRad(value(i));
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);
        const active = i === activeValue;
        ctx.fillStyle = active ? activeColor : color;
        ctx.font = `${active ? "700" : "400"} ${size}px Arial`;
        ctx.fillText(pad(i), x, y);
      }
    }

    function drawArrow(deg, len, col, lw) {
      const a = toRad(deg);
      const ex = cx + len * Math.cos(a);
      const ey = cy + len * Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.stroke();

      const ta = a + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - 18 * Math.cos(a) + 7 * Math.cos(ta), ey - 18 * Math.sin(a) + 7 * Math.sin(ta));
      ctx.lineTo(ex - 18 * Math.cos(a) - 7 * Math.cos(ta), ey - 18 * Math.sin(a) - 7 * Math.sin(ta));
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    }

    function drawPrismRing(count, innerR, outerR, lineColor, activePair, accentColor, numberMode) {
      const step = 360 / count;
      for (let i = 0; i < count; i++) {
        const a = toRad((numberMode === 24 ? angle24(i) : angle60(i)));
        const spread = Math.PI / count * 0.72;
        const p1 = [cx + innerR * Math.cos(a - spread), cy + innerR * Math.sin(a - spread)];
        const p2 = [cx + innerR * Math.cos(a + spread), cy + innerR * Math.sin(a + spread)];
        const tip = [cx + outerR * Math.cos(a), cy + outerR * Math.sin(a)];
        const active = i === activePair[0] || i === activePair[1];

        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(tip[0], tip[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.closePath();
        ctx.fillStyle = active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.02)";
        ctx.fill();
        ctx.strokeStyle = active ? accentColor : lineColor;
        ctx.lineWidth = active ? 2.2 : 1.3;
        ctx.stroke();
      }
    }

    let raf = 0;
    let cx = 0;
    let cy = 0;
    let R = 0;

    function draw() {
      raf = requestAnimationFrame(draw);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      ctx.clearRect(0, 0, W, H);

      cx = W / 2;
      cy = H * 0.46;
      R = Math.min(W * 0.46, H * 0.38);

      const { hr, min, sec } = getNow();

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#fbfbf8");
      bg.addColorStop(1, "#f3f4ef");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.beginPath();
      ctx.arc(cx, cy, R + 30, 0, Math.PI * 2);
      ctx.fillStyle = "#f6f5ef";
      ctx.fill();

      const dayA1 = toRad(270);
      const dayA2 = toRad(90);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + (R + 6) * Math.cos(dayA1), cy + (R + 6) * Math.sin(dayA1));
      ctx.arc(cx, cy, R + 6, dayA1, dayA2, false);
      ctx.closePath();
      ctx.fillStyle = "rgba(215,228,244,0.68)";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx, cy - (R + 6));
      ctx.lineTo(cx, cy + (R + 6));
      ctx.strokeStyle = "rgba(180,185,190,0.55)";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      const secInner = R * 0.72;
      const secOuter = R * 0.93;
      const minInner = R * 0.45;
      const minOuter = R * 0.67;
      const hrInner = R * 0.18;
      const hrOuter = R * 0.36;

      drawPrismRing(60, secInner, secOuter, "rgba(170,170,170,0.60)", [sec, (sec + 1) % 60], "#c51f72", 60);
      drawPrismRing(60, minInner, minOuter, "rgba(170,170,170,0.60)", [min, (min + 1) % 60], "#2f73eb", 60);
      drawPrismRing(24, hrInner, hrOuter, "rgba(145,145,145,0.78)", [hr, (hr + 1) % 24], "#e29a08", 24);

      ctx.beginPath();
      ctx.arc(cx, cy, hrOuter + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120,120,120,0.8)";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, minOuter + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120,120,120,0.55)";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ringText(i => angle24(i), 24, secOuter + 18, Math.max(10, R * 0.055), "rgba(175,175,175,0.85)", "#b28a2f", hr);
      ringText(i => angle60(i), 60, secOuter - 16, Math.max(8, R * 0.030), "rgba(165,165,165,0.75)", "#c51f72", sec);
      ringText(i => angle60(i), 60, minOuter + 14, Math.max(8, R * 0.030), "rgba(165,165,165,0.75)", "#2f73eb", min);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(185,178,165,0.9)";
      ctx.font = `${Math.max(12, R * 0.07)}px Arial`;
      ctx.fillText("NIGHT", cx - R * 0.32, cy);
      ctx.fillStyle = "rgba(150,165,205,0.9)";
      ctx.fillText("DAY", cx + R * 0.32, cy);

      const labelSize = Math.max(18, R * 0.09);
      ctx.font = `700 ${labelSize}px Arial`;
      ctx.fillStyle = "#b68a20";
      ctx.fillText("06", cx, cy - (R + 26));
      ctx.fillStyle = "#b68a20";
      ctx.fillText("12", cx + (R + 28), cy);
      ctx.fillStyle = "#5879ba";
      ctx.fillText("18", cx, cy + (R + 26));
      ctx.fillStyle = "#5a77b8";
      ctx.fillText("00", cx - (R + 28), cy);

      for (let i = 0; i < 24; i++) {
        const a = toRad(angle24(i));
        const maj = i % 6 === 0;
        ctx.beginPath();
        ctx.moveTo(cx + (R + 3) * Math.cos(a), cy + (R + 3) * Math.sin(a));
        ctx.lineTo(cx + (R - (maj ? 15 : 8)) * Math.cos(a), cy + (R - (maj ? 15 : 8)) * Math.sin(a));
        ctx.strokeStyle = maj ? "rgba(175,160,120,0.9)" : "rgba(180,180,180,0.6)";
        ctx.lineWidth = maj ? 2 : 1;
        ctx.stroke();
      }

      drawArrow(angle24(hr), hrOuter * 0.82, "#e59a09", 4);
      drawArrow(angle60(min), minOuter * 0.80, "#2f73eb", 3.5);
      drawArrow(angle60(sec), secOuter * 0.82, "#c51f72", 3.5);

      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(8, R * 0.03), 0, Math.PI * 2);
      ctx.fillStyle = "#212121";
      ctx.fill();

      ctx.textAlign = "center";
      ctx.font = `700 ${Math.max(30, R * 0.15)}px monospace`;
      ctx.fillStyle = "#1c1c24";
      ctx.fillText(`${pad(hr)}:${pad(min)}:${pad(sec)}`, cx, H * 0.88);

      ctx.font = `${Math.max(12, R * 0.035)}px Arial`;
      ctx.fillStyle = "rgba(120,100,55,0.85)";
      ctx.fillText("◆ HOURS · MINUTES · SECONDS ◆", cx, H * 0.93);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f3f4ef", display: "grid", placeItems: "center", overflow: "hidden" }}>
      <canvas ref={cv} />
    </div>
  );
}
