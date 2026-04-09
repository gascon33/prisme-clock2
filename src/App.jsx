
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
    if (!canvas) return; // важная правка: защита от null

    const W = (canvas.width = 400);
    const H = (canvas.height = 500);
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // вдруг контекст не получился

    const cx = W / 2;
    const cy = H * 0.46;
    const R = Math.min(W, H * 0.9) * 0.44;

    const SEC = { iR: R * 0.28, oR: R * 0.96, N: 60 };
    const MIN = { iR: R * 0.14, oR: R * 0.27, N: 60 };
    const HR = { iR: R * 0.03, oR: R * 0.13, N: 24 };

    function drawRod(angleDeg, iR, oR, N, colTop, colSide, colDark, on) {
      const a = toRad(angleDeg);
      const fill = 0.78;
      const wI = (2 * Math.PI * iR * fill) / N;
      const wO = (2 * Math.PI * oR * fill) / N;
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
        [xo - (wO / 2) * pc, yo - (wO / 2) * ps]
      ];

      const depth = 0.45;

      const g = ctx.createLinearGradient(
        p[0][0],
        p[0][1],
        p[1][0],
        p[1][1]
      );
      if (on) {
        g.addColorStop(0, colDark);
        g.addColorStop(0.3, colTop);
        g.addColorStop(0.5, "#ffffff");
        g.addColorStop(0.7, colTop);
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
        ctx.shadowBlur = 16;
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

      if (on) {
        ctx.beginPath();
        p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 0.8;
        ctx.shadowColor = colTop;
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;
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
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
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
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    let rafId;
    let gp = 0;

    function draw() {
      rafId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
      bg.addColorStop(0, "#161628");
      bg.addColorStop(1, "#050510");
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
      ctx.arc(cx + 3, cy + 4, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();

      const disc = ctx.createRadialGradient(
        cx - R * 0.15,
        cy - R * 0.15,
        R * 0.03,
        cx,
        cy,
        R
      );
      disc.addColorStop(0, "#1e1e33");
      disc.addColorStop(1, "#08081a");
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
          on ? "#ffdd44" : "#bb8814",
          on ? "#ffe888" : "#ddaa44",
          "#664400",
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
          on ? "#ffee55" : "#cc9910",
          on ? "#fff0aa" : "#eebb44",
          "#775500",
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
          on ? "#eef4ff" : "#8899cc",
          on ? "#ffffff" : "#bbccdd",
          "#334466",
          on
        );
      }

      ctx.beginPath();
      ctx.arc(cx, cy, SEC.iR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180,160,100,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, MIN.iR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180,160,100,0.25)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "#8899bb";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#aabbdd";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (let i = 0; i < 24; i++) {
        const a = toRad(i * 15 - 90);
        const maj = i % 6 === 0;
        ctx.beginPath();
        ctx.moveTo(cx + (R + 1) * Math.cos(a), cy + (R + 1) * Math.sin(a));
        ctx.lineTo(
          cx + (R - (maj ? 14 : 7)) * Math.cos(a),
          cy + (R - (maj ? 14 : 7)) * Math.sin(a)
        );
        ctx.strokeStyle = maj ? "#ffd700" : "#445566";
        ctx.lineWidth = maj ? 2.5 : 1;
        ctx.stroke();
      }

      drawArrow(gapDeg(hr, HR.N) - 90, HR.oR * 0.85, "#ffaa00", 3.5);
      drawArrow(gapDeg(min, MIN.N) - 90, MIN.oR * 0.85, "#4488ff", 2.5);
      drawArrow(gapDeg(sec, SEC.N) - 90, SEC.oR * 0.88, "#ff2266", 1.8);

      gp += 0.03;
      const gR = R * 0.036;
      const gg = ctx.createRadialGradient(
        cx - gR * 0.35,
        cy - gR * 0.35,
        1,
        cx,
        cy,
        gR
      );
      gg.addColorStop(0, "#ffffcc");
      gg.addColorStop(0.4, "#ffcc00");
      gg.addColorStop(1, "#cc7700");
      ctx.beginPath();
      ctx.arc(cx, cy, gR, 0, Math.PI * 2);
      ctx.fillStyle = gg;
      ctx.shadowColor = "#ffaa00";
      ctx.shadowBlur = 10 + Math.sin(gp) * 5;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.textAlign = "center";
      ctx.font = `bold ${Math.round(R * 0.12)}px monospace`;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#3366ff";
      ctx.shadowBlur = 10;
      ctx.fillText(`${pad(hr)}:${pad(min)}:${pad(sec)}`, cx, H * 0.88);
      ctx.shadowBlur = 0;

      ctx.font = `${Math.round(R * 0.042)}px sans-serif`;
      ctx.fillStyle = "rgba(255,200,100,.5)";
      ctx.fillText("◆ HOURS · MINUTES · SECONDS ◆", cx, H * 0.94);

      ctx.font = `${Math.round(R * 0.038)}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,.18)";
      ctx.fillText("PRISM CLOCK", cx, H * 0.98);
    }

    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      style={{
        background: "#050510",
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
      }}
    >
      anvas ref={cv} />
    </div>
  );
}
