import { useEffect, useRef } from "react";

function getNow() {
  const d = new Date();
  return { hr: d.getHours(), min: d.getMinutes(), sec: d.getSeconds() };
}
function toRad(d) {
  return (d * Math.PI) / 180;
}
function gapDeg(s, n) {
  return 180 + (s % n) * (360 / n);
}
function pad(n) {
  return String(n).padStart(2, "0");
}

export default function App() {
  const cv = useRef(null);

  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;

    const W = (canvas.width = 520);
    const H = (canvas.height = 700);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cx = W / 2;
    const cy = H * 0.42;
    const R = Math.min(W, H * 0.82) * 0.36;

    const rodLen = R * 0.16;
    const gap = R * 0.035;

    const HR = { iR: R * 0.18, oR: R * 0.18 + rodLen, N: 24 };
    const MIN = { iR: HR.oR + gap, oR: HR.oR + gap + rodLen, N: 60 };
    const SEC = { iR: MIN.oR + gap, oR: MIN.oR + gap + rodLen, N: 60 };

    function drawRod(angleDeg, iR, oR, N, colTop, colSide, colDark, on) {
      const a = toRad(angleDeg);
      const fill = 0.78;
      const wI = ((2 * Math.PI * iR) / N) * fill;
      const wO = ((2 * Math.PI * oR) / N) * fill;
      const perp = a + Math.PI / 2;
      const pc = Math.cos(perp);
      const ps = Math.sin(perp);

      const xi = cx + iR * Math.cos(a);
      const yi = cy + iR * Math.sin(a);
      const xo = cx + oR * Math.cos(a);
      const yo = cy + oR * Math.sin(a);

      const p = [
        [xi - (wI / 2) * pc, yi - (wI / 2) * ps],
        [xi + (wI / 2) * pc, yi + (wI / 2) * ps],
        [xo + (wO / 2) * pc, yo + (wO / 2) * ps],
        [xo - (wO / 2) * pc, yo - (wO / 2) * ps],
      ];

      const depth = 0.45;
      const g = ctx.createLinearGradient(p[0][0], p[0][1], p[1][0], p[1][1]);

      if (on) {
        g.addColorStop(0, colDark);
        g.addColorStop(0.28, colTop);
        g.addColorStop(0.5, "#ffffff");
        g.addColorStop(0.72, colTop);
        g.addColorStop(1, colDark);
      } else {
        g.addColorStop(0, colDark);
        g.addColorStop(0.4, colTop);
        g.addColorStop(0.6, colSide);
        g.addColorStop(1, colDark);
      }

      ctx.beginPath();
      p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      if (on) {
        ctx.shadowColor = colTop;
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = g;
      ctx.fill();
      ctx.shadowBlur = 0;

      const dI = wI * depth;
      const dO = wO * depth;

      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      ctx.lineTo(p[3][0], p[3][1]);
      ctx.lineTo(p[3][0] - dO * pc, p[3][1] - dO * ps);
      ctx.lineTo(p[0][0] - dI * pc, p[0][1] - dI * ps);
      ctx.closePath();
      ctx.fillStyle = colDark;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(p[1][0], p[1][1]);
      ctx.lineTo(p[2][0], p[2][1]);
      ctx.lineTo(p[2][0] + dO * pc, p[2][1] + dO * ps);
      ctx.lineTo(p[1][0] + dI * pc, p[1][1] + dI * ps);
      ctx.closePath();
      const rg = ctx.createLinearGradient(
        p[1][0],
        p[1][1],
        p[1][0] + dI * pc,
        p[1][1] + dI * ps
      );
      rg.addColorStop(0, on ? "#ffffff" : colSide);
      rg.addColorStop(1, colTop);
      ctx.fillStyle = rg;
      ctx.fill();
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
      ctx.shadowColor = col;
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const ta = a + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(
        ex - 9 * Math.cos(a) + 4 * Math.cos(ta),
        ey - 9 * Math.sin(a) + 4 * Math.sin(ta)
      );
      ctx.lineTo(
        ex - 9 * Math.cos(a) - 4 * Math.cos(ta),
        ey - 9 * Math.sin(a) - 4 * Math.sin(ta)
      );
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    }

    function drawScaleNumbers(N, radius, activeIndex, activeColor, passiveColor, fontPx, offsetDeg = -90, every = 1) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${fontPx}px monospace`;

      for (let i = 0; i < N; i += every) {
        const a = toRad(i * (360 / N) + offsetDeg);
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);
        const active = i === activeIndex;
        ctx.fillStyle = active ? activeColor : passiveColor;
        ctx.shadowColor = active ? activeColor : "transparent";
        ctx.shadowBlur = active ? 10 : 0;
        ctx.fillText(pad(i), x, y);
      }
      ctx.shadowBlur = 0;
    }

    let rafId = 0;
    let gp = 0;

    function draw() {
      rafId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.65);
      bg.addColorStop(0, "#ffffff");
      bg.addColorStop(1, "#e9edf5");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const { hr, min, sec } = getNow();
      const sL = sec;
      const sR = (sec + 1) % SEC.N;
      const mL = min;
      const mR = (min + 1) % MIN.N;
      const hL = hr;
      const hR = (hr + 1) % HR.N;

      ctx.beginPath();
      ctx.arc(cx + 2, cy + 3, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fill();

      const disc = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.15, R * 0.03, cx, cy, R);
      disc.addColorStop(0, "#ffffff");
      disc.addColorStop(1, "#dfe6f0");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = disc;
      ctx.fill();

      for (let i = 0; i < HR.N; i++) {
        const on = i === hL || i === hR;
        drawRod(
          i * (360 / HR.N) - 90,
          HR.iR,
          HR.oR,
          HR.N,
          on ? "#ffd84a" : "#c7a23a",
          on ? "#fff2b0" : "#e4c56a",
          "#7a5c10",
          on
        );
      }

      for (let i = 0; i < MIN.N; i++) {
        const on = i === mL || i === mR;
        drawRod(
          i * (360 / MIN.N) - 90,
          MIN.iR,
          MIN.oR,
          MIN.N,
          on ? "#5aa0ff" : "#7f96c9",
          on ? "#dcebff" : "#bccae6",
          "#4b628b",
          on
        );
      }

      for (let i = 0; i < SEC.N; i++) {
        const on = i === sL || i === sR;
        drawRod(
          i * (360 / SEC.N) - 90,
          SEC.iR,
          SEC.oR,
          SEC.N,
          on ? "#ff4a93" : "#c98aa8",
          on ? "#ffd3e5" : "#e6bfd0",
          "#8d3d62",
          on
        );
      }

      ctx.beginPath();
      ctx.arc(cx, cy, SEC.iR - R * 0.03, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(150,150,170,0.30)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, MIN.iR - R * 0.03, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(150,150,170,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "#bfc7d6";
      ctx.lineWidth = 4;
      ctx.stroke();

      for (let i = 0; i < 24; i++) {
        const a = toRad(i * 15 - 90);
        const maj = i % 6 === 0;
        ctx.beginPath();
        ctx.moveTo(cx + (R + 1) * Math.cos(a), cy + (R + 1) * Math.sin(a));
        ctx.lineTo(cx + (R - (maj ? 12 : 6)) * Math.cos(a), cy + (R - (maj ? 12 : 6)) * Math.sin(a));
        ctx.strokeStyle = maj ? "rgba(180,140,40,0.95)" : "rgba(120,130,150,0.50)";
        ctx.lineWidth = maj ? 2.2 : 1;
        ctx.stroke();
      }

      drawScaleNumbers(24, SEC.oR + R * 0.12, hr, "#9b6b00", "rgba(130,110,70,0.68)", Math.round(R * 0.07), -90, 1);
      drawScaleNumbers(60, MIN.oR + R * 0.07, min, "#1d66d1", "rgba(70,95,135,0.48)", Math.round(R * 0.032), -90, 1);
      drawScaleNumbers(60, HR.iR - R * 0.08, sec, "#d61a67", "rgba(150,90,120,0.45)", Math.round(R * 0.032), -90, 1);

      drawArrow(gapDeg(hr, HR.N) - 90, HR.oR * 0.92, "#d79a00", 3.2);
      drawArrow(gapDeg(min, MIN.N) - 90, MIN.oR * 0.92, "#2c78ff", 2.3);
      drawArrow(gapDeg(sec, SEC.N) - 90, SEC.oR * 0.92, "#e61f74", 1.8);

      gp += 0.03;
      const gR = R * 0.04;
      const gg = ctx.createRadialGradient(cx - gR * 0.3, cy - gR * 0.3, 1, cx, cy, gR);
      gg.addColorStop(0, "#fff7cc");
      gg.addColorStop(0.4, "#ffcf2b");
      gg.addColorStop(1, "#c48700");
      ctx.beginPath();
      ctx.arc(cx, cy, gR, 0, Math.PI * 2);
      ctx.fillStyle = gg;
      ctx.shadowColor = "rgba(255,170,0,0.45)";
      ctx.shadowBlur = 8 + Math.sin(gp) * 3;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.textAlign = "center";
      ctx.font = `bold ${Math.round(R * 0.12)}px monospace`;
      ctx.fillStyle = "#1a2238";
      ctx.shadowColor = "rgba(70,110,210,0.18)";
      ctx.shadowBlur = 8;
      ctx.fillText(`${pad(hr)}:${pad(min)}:${pad(sec)}`, cx, H * 0.84);
      ctx.shadowBlur = 0;

      ctx.font = `${Math.round(R * 0.042)}px sans-serif`;
      ctx.fillStyle = "rgba(130,95,30,.72)";
      ctx.fillText("◆ HOURS · MINUTES · SECONDS ◆", cx, H * 0.90);

      ctx.font = `${Math.round(R * 0.038)}px sans-serif`;
      ctx.fillStyle = "rgba(40,55,80,.28)";
      ctx.fillText("PRISM CLOCK", cx, H * 0.95);
    }

    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      style={{
        background: "#eef2f8",
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={cv}
        style={{
          width: "min(92vw, 560px)",
          height: "auto",
          maxHeight: "96vh",
          display: "block",
        }}
      />
    </div>
  );
}
