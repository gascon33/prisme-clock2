import { useEffect, useRef } from "react";

function pad(n) {
  return String(n).padStart(2, "0");
}
function now() {
  const d = new Date();
  return { h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
}
function rad(d) {
  return (d * Math.PI) / 180;
}
function mix(a, b, t) {
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

    const PETALS = {
      sec: 61,
      min: 61,
      hour: 25,
    };

    const VALUES = {
      sec: 60,
      min: 60,
      hour: 24,
    };

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
      R = Math.min(w * 0.43, h * 0.34);
      cy = Math.max(R + 36, h * 0.40);
    }

    function angleForValue(v, total) {
      return -90 + (v * 360) / total;
    }

    function angleBetweenPetals(v, total) {
      const step = 360 / total;
      return -90 + v * step + step / 2;
    }

    function drawBackground() {
      const g = ctx.createRadialGradient(cx, cy - R * 0.2, 0, cx, cy, R * 2.1);
      g.addColorStop(0, "#101114");
      g.addColorStop(0.55, "#090a0d");
      g.addColorStop(1, "#020304");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 120; i++) {
        const x = (i * 83.7) % w;
        const y = (i * 57.3) % h;
        const a = 0.05 + ((i % 5) * 0.02);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, 1.2, 1.2);
      }
    }

    function drawOuterGlow() {
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(185,200,255,0.95)";
      ctx.lineWidth = Math.max(2, R * 0.010);
      ctx.shadowColor = "rgba(160,185,255,0.85)";
      ctx.shadowBlur = R * 0.08;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(cx, cy, R - R * 0.012, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(225,235,255,0.26)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function drawMainTicks() {
      const marks = [0, 15, 30, 45];
      for (const v of marks) {
        const a = rad(angleForValue(v, 60));
        const r1 = R + R * 0.002;
        const r2 = R - R * 0.035;
        ctx.beginPath();
        ctx.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
        ctx.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a));
        ctx.strokeStyle = "#ffcf36";
        ctx.lineWidth = Math.max(2, R * 0.012);
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    function drawGem(gemR) {
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, gemR * 2.5);
      glow.addColorStop(0, "rgba(255,208,64,0.9)");
      glow.addColorStop(0.4, "rgba(255,168,10,0.45)");
      glow.addColorStop(1, "rgba(255,160,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, gemR * 2.4, 0, Math.PI * 2);
      ctx.fill();

      const g = ctx.createRadialGradient(cx - gemR * 0.3, cy - gemR * 0.35, gemR * 0.15, cx, cy, gemR);
      g.addColorStop(0, "#fff7af");
      g.addColorStop(0.35, "#ffd84d");
      g.addColorStop(0.65, "#ffb300");
      g.addColorStop(1, "#ce7a00");
      ctx.beginPath();
      ctx.arc(cx, cy, gemR, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    function drawRingNumbers(total, active, radius, size, color, activeColor) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${size}px Arial`;

      for (let i = 0; i < total; i++) {
        const a = rad(angleForValue(i, total));
        const x = cx + radius * Math.cos(a);
        const y = cy + radius * Math.sin(a);
        const on = i === active;
        ctx.fillStyle = on ? activeColor : color;
        ctx.shadowColor = on ? activeColor : "transparent";
        ctx.shadowBlur = on ? size * 0.8 : 0;
        ctx.font = `${on ? 700 : 500} ${size}px Arial`;
        ctx.fillText(pad(i), x, y);
      }
      ctx.shadowBlur = 0;
    }

    function prismMaterial(type, active) {
      if (type === "sec") {
        return active
          ? { light: "rgba(255,186,214,0.96)", mid: "rgba(255,82,162,0.92)", dark: "rgba(120,20,72,0.95)", glow: "rgba(255,84,170,0.55)" }
          : { light: "rgba(255,206,226,0.78)", mid: "rgba(239,132,183,0.56)", dark: "rgba(92,42,66,0.42)", glow: "transparent" };
      }
      if (type === "min") {
        return active
          ? { light: "rgba(189,231,255,0.98)", mid: "rgba(78,166,255,0.92)", dark: "rgba(25,74,142,0.96)", glow: "rgba(82,170,255,0.55)" }
          : { light: "rgba(214,235,255,0.86)", mid: "rgba(157,191,235,0.68)", dark: "rgba(85,106,145,0.48)", glow: "transparent" };
      }
      return active
        ? { light: "rgba(255,243,171,0.98)", mid: "rgba(255,194,48,0.95)", dark: "rgba(147,93,10,0.98)", glow: "rgba(255,188,56,0.45)" }
        : { light: "rgba(255,242,179,0.88)", mid: "rgba(219,174,71,0.72)", dark: "rgba(115,85,28,0.58)", glow: "transparent" };
    }

    function drawPetalRing({ count, innerR, outerR, type, activeIndex, activeNext }) {
      const step = 360 / count;
      const widthFactor = 0.40;

      for (let i = 0; i < count; i++) {
        const centerDeg = -90 + i * step;
        const center = rad(centerDeg);
        const delta = rad(step * widthFactor);
        const left = center - delta;
        const right = center + delta;

        const p1 = [cx + innerR * Math.cos(left), cy + innerR * Math.sin(left)];
        const p2 = [cx + innerR * Math.cos(right), cy + innerR * Math.sin(right)];
        const p3 = [cx + outerR * Math.cos(right * 0.985 + center * 0.015), cy + outerR * Math.sin(right * 0.985 + center * 0.015)];
        const tip = [cx + outerR * Math.cos(center), cy + outerR * Math.sin(center)];
        const p4 = [cx + outerR * Math.cos(left * 0.985 + center * 0.015), cy + outerR * Math.sin(left * 0.985 + center * 0.015)];

        const active = i === activeIndex || i === activeNext;
        const mat = prismMaterial(type, active);

        const grad = ctx.createLinearGradient(p1[0], p1[1], p2[0], p2[1]);
        grad.addColorStop(0, mat.dark);
        grad.addColorStop(0.24, mat.mid);
        grad.addColorStop(0.52, mat.light);
        grad.addColorStop(0.78, mat.mid);
        grad.addColorStop(1, mat.dark);

        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.lineTo(tip[0], tip[1]);
        ctx.lineTo(p4[0], p4[1]);
        ctx.closePath();
        ctx.fillStyle = grad;
        if (active) {
          ctx.shadowColor = mat.glow;
          ctx.shadowBlur = R * 0.02;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(tip[0], tip[1]);
        ctx.lineTo(p4[0], p4[1]);
        ctx.closePath();
        ctx.fillStyle = active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(p2[0], p2[1]);
        ctx.lineTo(tip[0], tip[1]);
        ctx.lineTo(p3[0], p3[1]);
        ctx.closePath();
        ctx.fillStyle = active ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.12)";
        ctx.fill();
      }
    }

    function drawMirrorArrow(angleDeg, len, color, width) {
      const a = rad(angleDeg);
      const ex = cx + len * Math.cos(a);
      const ey = cy + len * Math.sin(a);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = width * 2.2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const pa = a + Math.PI / 2;
      const head = Math.max(8, width * 2.4);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - head * Math.cos(a) + head * 0.42 * Math.cos(pa), ey - head * Math.sin(a) + head * 0.42 * Math.sin(pa));
      ctx.lineTo(ex - head * Math.cos(a) - head * 0.42 * Math.cos(pa), ey - head * Math.sin(a) - head * 0.42 * Math.sin(pa));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function drawBottomDigital(hh, mm, ss) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const y1 = cy + R + R * 0.18;
      const y2 = y1 + R * 0.11;
      ctx.shadowColor = "rgba(180,200,255,0.55)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#f4f7ff";
      ctx.font = `700 ${Math.max(28, R * 0.18)}px Arial`;
      ctx.fillText(`${pad(hh)}:${pad(mm)}:${pad(ss)}`, cx, y1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(170,175,205,0.22)";
      ctx.font = `600 ${Math.max(11, R * 0.050)}px Arial`;
      ctx.fillText("PRISM CLOCK", cx, y2);
    }

    function drawFrame() {
      const t = now();
      const { h: hh, m: mm, s: ss } = t;

      drawBackground();

      const gemR = R * 0.060;
      const gap1 = R * 0.028;
      const gap2 = R * 0.022;
      const gap3 = R * 0.026;
      const rimGap = R * 0.040;
      const usable = R - rimGap - gemR - gap1 - gap2 - gap3;

      const hourDepth = usable * 0.24;
      const minDepth = usable * 0.27;
      const secDepth = usable * 0.49;

      const HR = {
        inner: gemR + gap1,
        outer: gemR + gap1 + hourDepth,
      };
      const MIN = {
        inner: HR.outer + gap2,
        outer: HR.outer + gap2 + minDepth,
      };
      const SEC = {
        inner: MIN.outer + gap3,
        outer: MIN.outer + gap3 + secDepth,
      };

      drawOuterGlow();
      drawMainTicks();

      drawPetalRing({
        count: PETALS.sec,
        innerR: SEC.inner,
        outerR: SEC.outer,
        type: "sec",
        activeIndex: ss,
        activeNext: ss + 1,
      });

      drawPetalRing({
        count: PETALS.min,
        innerR: MIN.inner,
        outerR: MIN.outer,
        type: "min",
        activeIndex: mm,
        activeNext: mm + 1,
      });

      drawPetalRing({
        count: PETALS.hour,
        innerR: HR.inner,
        outerR: HR.outer,
        type: "hour",
        activeIndex: hh,
        activeNext: hh + 1,
      });

      drawGem(gemR);

      drawRingNumbers(24, hh, R + R * 0.11, Math.max(13, R * 0.050), "rgba(235,240,255,0.74)", "#ffd24d");
      drawRingNumbers(60, mm, R + R * 0.065, Math.max(9, R * 0.028), "rgba(205,220,255,0.52)", "#7fd1ff");
      drawRingNumbers(60, ss, R + R * 0.030, Math.max(9, R * 0.028), "rgba(255,215,232,0.45)", "#ff8bbf");

      const hourArrowLen = mix(HR.inner, HR.outer, 0.70);
      const minArrowLen = mix(MIN.inner, MIN.outer, 0.77);
      const secArrowLen = mix(SEC.inner, SEC.outer, 0.88);

      drawMirrorArrow(angleBetweenPetals(hh, VALUES.hour), hourArrowLen, "rgba(255,199,66,0.95)", Math.max(2.2, R * 0.010));
      drawMirrorArrow(angleBetweenPetals(mm, VALUES.min), minArrowLen, "rgba(115,205,255,0.95)", Math.max(2.0, R * 0.008));
      drawMirrorArrow(angleBetweenPetals(ss, VALUES.sec), secArrowLen, "rgba(255,118,186,0.95)", Math.max(1.8, R * 0.007));

      drawBottomDigital(hh, mm, ss);
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      drawFrame();
      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#050608", display: "grid", placeItems: "center" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
