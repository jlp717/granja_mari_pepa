import { buildGmpWorld } from "./world-gmp.js";
import { withAbort, cancelDriver } from "./lifecycle";
/** Literal source: reference/kage-verbatim/index.html SHA c8e06b90397ac246baf0ab6f32f5f6b570acc6fe03c7009f711b579fb72d9f49.
 * Port boundaries: React owns document/nav/reveals; runtime owns only WebGL and its resources.
 */
export async function createGMPEngine(options) {
  const THREE = options.THREE;
  let disposed = false,
    frameHandle = 0,
    cardsSuspended = false;
  const cardListeners = [];
  const $$ = (selector) =>
    Array.from(options.getRoot()?.querySelectorAll(selector) || []);
  /* ------------------------------------------------------------ 0 · basics */
  const Q = new URLSearchParams(location.search);
  const qs = (k, d) => {
    const v = Q.get(k);
    return v === null ? d : v;
  };
  const qn = (k, d) => {
    const v = Q.get(k);
    return v === null ? d : parseFloat(v);
  };
  let REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COARSE = matchMedia("(hover: none)").matches;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sat = (v) => clamp(v, 0, 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => {
    const t = sat((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const TAU = Math.PI * 2;
  /* frame-rate independent damping */
  const damp = (cur, to, rate, dt) => lerp(cur, to, 1 - Math.exp(-rate * dt));

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* classic 2-D gradient noise */
  function noise2D(seed) {
    const rnd = mulberry32(seed),
      p = new Uint8Array(256),
      perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = (rnd() * (i + 1)) | 0,
        t = p[i];
      p[i] = p[j];
      p[j] = t;
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const G = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    return function (x, y) {
      const xi = Math.floor(x),
        yi = Math.floor(y);
      const X = xi & 255,
        Y = yi & 255,
        xf = x - xi,
        yf = y - yi;
      const u = fade(xf),
        v = fade(yf);
      const g = (h, dx, dy) => {
        const q = G[h & 7];
        return q[0] * dx + q[1] * dy;
      };
      const aa = perm[perm[X] + Y],
        ab = perm[perm[X] + Y + 1];
      const ba = perm[perm[X + 1] + Y],
        bb = perm[perm[X + 1] + Y + 1];
      return lerp(
        lerp(g(aa, xf, yf), g(ba, xf - 1, yf), u),
        lerp(g(ab, xf, yf - 1), g(bb, xf - 1, yf - 1), u),
        v,
      );
    };
  }
  function fbm(n, x, y, oct, lac, gain) {
    let a = 0.5,
      f = 1,
      s = 0,
      m = 0;
    for (let i = 0; i < (oct || 4); i++) {
      s += a * n(x * f, y * f);
      m += a;
      a *= gain || 0.5;
      f *= lac || 2;
    }
    return s / m; /* −1 … 1 */
  }

  /* ------------------------------------------------------------ 1 · canvas */
  function cvs(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  const hex = (r, g, b) =>
    "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";

  /* stacked, up-scaled value noise — 30× faster than a per-pixel fbm and
   indistinguishable once it is multiplied under a dark base colour */
  function fbmCanvas(W, H, seed, octaves, baseCells, contrast) {
    const out = cvs(W, H),
      o = out.getContext("2d");
    o.fillStyle = "#808080";
    o.fillRect(0, 0, W, H);
    let cells = baseCells || 3,
      alpha = 1;
    for (let i = 0; i < (octaves || 5); i++) {
      const n = cvs(cells, cells),
        nx = n.getContext("2d");
      const im = nx.createImageData(cells, cells),
        d = im.data,
        r = mulberry32(seed + i * 977);
      for (let k = 0; k < cells * cells; k++) {
        const v = 128 + (r() - 0.5) * 255 * (contrast || 1);
        d[k * 4] = d[k * 4 + 1] = d[k * 4 + 2] = clamp(v, 0, 255);
        d[k * 4 + 3] = 255;
      }
      nx.putImageData(im, 0, 0);
      o.globalAlpha = alpha;
      o.globalCompositeOperation = i === 0 ? "source-over" : "overlay";
      o.imageSmoothingEnabled = true;
      o.imageSmoothingQuality = "high";
      o.drawImage(n, 0, 0, W, H);
      cells *= 2;
      alpha *= 0.62;
    }
    o.globalAlpha = 1;
    o.globalCompositeOperation = "source-over";
    return out;
  }

  /* height → tangent-space normal map (blur first, then Sobel) */
  function normalFromHeight(hc, strength) {
    const W = hc.width,
      H = hc.height;
    const b = cvs(W, H),
      bx = b.getContext("2d");
    bx.filter = "blur(1.1px)";
    bx.drawImage(hc, 0, 0);
    bx.filter = "none";
    const src = bx.getImageData(0, 0, W, H).data;
    const out = cvs(W, H),
      ox = out.getContext("2d");
    const im = ox.createImageData(W, H),
      d = im.data;
    const at = (x, y) => src[(((y + H) % H) * W + ((x + W) % W)) * 4] / 255;
    const s = strength || 2.4;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const gx = (at(x + 1, y) - at(x - 1, y)) * s;
        const gy = (at(x, y + 1) - at(x, y - 1)) * s;
        let nx = -gx,
          ny = gy,
          nz = 1;
        const il = 1 / Math.hypot(nx, ny, nz);
        const i = (y * W + x) * 4;
        d[i] = (nx * il * 0.5 + 0.5) * 255;
        d[i + 1] = (ny * il * 0.5 + 0.5) * 255;
        d[i + 2] = (nz * il * 0.5 + 0.5) * 255;
        d[i + 3] = 255;
      }
    ox.putImageData(im, 0, 0);
    return out;
  }

  /* ------------------------------------------------------- 2 · surfaces */
  /* long, wet, board-formed concrete — the sanctuary walls */
  function texWall() {
    const W = 1024,
      H = 1024;
    const c = cvs(W, H),
      x = c.getContext("2d");
    x.fillStyle = "#10161a";
    x.fillRect(0, 0, W, H);

    /* mottling */
    x.globalCompositeOperation = "overlay";
    x.globalAlpha = 0.82;
    x.drawImage(fbmCanvas(W, H, 41, 6, 3, 1), 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";

    /* board-form seams every sixth */
    const rnd = mulberry32(7);
    for (let i = 1; i < 6; i++) {
      const y = (H / 6) * i;
      x.fillStyle = "rgba(0,0,0,.45)";
      x.fillRect(0, y - 1.5, W, 3);
      x.fillStyle = "rgba(190,205,205,.05)";
      x.fillRect(0, y + 2, W, 2);
    }
    /* form-tie dimples */
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 4; j++) {
        const cx2 = (W / 4) * (j + 0.5) + (rnd() - 0.5) * 14,
          cy = (H / 6) * (i + 0.5);
        const g = x.createRadialGradient(cx2, cy, 1, cx2, cy, 11);
        g.addColorStop(0, "rgba(0,0,0,.5)");
        g.addColorStop(0.7, "rgba(0,0,0,.18)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        x.fillStyle = g;
        x.beginPath();
        x.arc(cx2, cy, 11, 0, TAU);
        x.fill();
      }
    /* rain streaks running the full height */
    for (let i = 0; i < 190; i++) {
      const sx = rnd() * W,
        w = 0.6 + rnd() * 3.4,
        top = rnd() * H * 0.5,
        len = H * (0.4 + rnd() * 0.7);
      const g = x.createLinearGradient(0, top, 0, top + len);
      const dark = rnd() > 0.45;
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.25, dark ? "rgba(0,0,0,.20)" : "rgba(170,195,200,.045)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.fillRect(sx, top, w, len);
    }
    /* fine tooth */
    x.globalAlpha = 0.16;
    x.globalCompositeOperation = "overlay";
    x.drawImage(fbmCanvas(512, 512, 91, 3, 128, 1.4), 0, 0, W, H);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";

    /* height for the normal map: seams + streaks only */
    const h = cvs(W, H),
      hx = h.getContext("2d");
    hx.fillStyle = "#808080";
    hx.fillRect(0, 0, W, H);
    hx.globalAlpha = 0.5;
    hx.drawImage(fbmCanvas(W, H, 41, 5, 6, 1), 0, 0);
    hx.globalAlpha = 1;
    for (let i = 1; i < 6; i++) {
      hx.fillStyle = "#2a2a2a";
      hx.fillRect(0, (H / 6) * i - 2, W, 4);
    }
    return { map: c, normal: normalFromHeight(h, 2.0) };
  }

  /* wet slate paving — big slabs, tight joints, standing water */
  function texFloor() {
    const W = 1024,
      H = 1024;
    const c = cvs(W, H),
      x = c.getContext("2d");
    const rnd = mulberry32(23);
    x.fillStyle = "#0a0f12";
    x.fillRect(0, 0, W, H);
    const N = 4,
      S = W / N;
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const t = 0.82 + rnd() * 0.36;
        x.fillStyle = hex(12 * t, 17 * t, 20 * t);
        x.fillRect(i * S + 1.5, j * S + 1.5, S - 3, S - 3);
      }
    x.globalCompositeOperation = "overlay";
    x.globalAlpha = 0.55;
    x.drawImage(fbmCanvas(W, H, 63, 6, 4, 1), 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";
    /* joints */
    x.strokeStyle = "rgba(0,0,0,.72)";
    x.lineWidth = 3;
    for (let i = 0; i <= N; i++) {
      x.beginPath();
      x.moveTo(i * S, 0);
      x.lineTo(i * S, H);
      x.stroke();
      x.beginPath();
      x.moveTo(0, i * S);
      x.lineTo(W, i * S);
      x.stroke();
    }
    /* height map: joints recessed, grain */
    const h = cvs(W, H),
      hx = h.getContext("2d");
    hx.fillStyle = "#8c8c8c";
    hx.fillRect(0, 0, W, H);
    hx.globalAlpha = 0.35;
    hx.drawImage(fbmCanvas(W, H, 63, 5, 8, 1), 0, 0);
    hx.globalAlpha = 1;
    hx.strokeStyle = "#303030";
    hx.lineWidth = 5;
    for (let i = 0; i <= N; i++) {
      hx.beginPath();
      hx.moveTo(i * S, 0);
      hx.lineTo(i * S, H);
      hx.stroke();
      hx.beginPath();
      hx.moveTo(0, i * S);
      hx.lineTo(W, i * S);
      hx.stroke();
    }
    /* roughness: mostly glass, drier patches where the rain missed */
    const r = cvs(512, 512),
      rx = r.getContext("2d");
    rx.fillStyle = "#1c1c1c";
    rx.fillRect(0, 0, 512, 512);
    rx.globalAlpha = 0.95;
    rx.globalCompositeOperation = "lighten";
    rx.drawImage(fbmCanvas(512, 512, 77, 4, 3, 1.5), 0, 0);
    rx.globalAlpha = 1;
    rx.globalCompositeOperation = "source-over";
    return { map: c, normal: normalFromHeight(h, 1.5), rough: r };
  }

  /* --------------------------------------------------- temple timber · cedar
   Boards, not a noise field. Three things make sawn wood read as wood and
   none of them is fbm:

     1 · ring geometry. A plank is a flat cut through a round log, so the
         rings meet the face as two branches either side of the pith, and
         wherever the cut runs shallow across a ring the branches close into
         the cathedral arch everyone recognises. Solving the circle for it —
         x = pith ± √(r² − d(y)²), with the cut depth d wandering down the
         board — hands over the arches for free. Drawn strokes only ever give
         stripes, which is what the first pass here did, and stripes on a
         column read as brushed metal.
     2 · the boards themselves. Joints, and a different tone on either side of
         one. A wall with no joint in it is a wall of plastic.
     3 · pores, so the face has tooth rather than a painted finish.

   Broad fbm overlays used to do the work here and they are exactly why the
   hall looked like it was standing under a cloud: at this camera distance a
   noise blotch is dirt, and dirt is not grain. Everything below is structure.

   boards:0 gives a single timber for the columns, sills and rails, which are
   each one stick of wood and must not carry a joint. */
  function texWood(seed, opt) {
    const o = opt || {},
      W = 512,
      H = 512;
    const c = cvs(W, H),
      x = c.getContext("2d");
    const h = cvs(W, H),
      hx = h.getContext("2d");
    const r = cvs(W, H),
      rx = r.getContext("2d");
    const rnd = mulberry32(seed || 3);
    const base = o.base || [30, 23, 19];
    x.fillStyle = hex(base[0], base[1], base[2]);
    x.fillRect(0, 0, W, H);
    hx.fillStyle = "#808080";
    hx.fillRect(0, 0, W, H);
    rx.fillStyle = o.rough || "#d6d6d6";
    rx.fillRect(0, 0, W, H);

    /* board layout — widths jittered, then normalised so the run closes on the
     tile edge and the map still wraps */
    const nb = o.boards === undefined ? 7 : o.boards;
    const cuts = [0];
    if (nb > 0) {
      const ws = [];
      let sum = 0;
      for (let i = 0; i < nb; i++) {
        const v = 0.7 + rnd() * 0.6;
        ws.push(v);
        sum += v;
      }
      let acc = 0;
      ws.forEach((v) => {
        acc += (v / sum) * W;
        cuts.push(acc);
      });
    } else cuts.push(W);

    const stroke = (pts, ctx, style, w) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.strokeStyle = style;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    for (let b = 0; b < cuts.length - 1; b++) {
      const x0 = cuts[b],
        x1 = cuts[b + 1],
        bw = x1 - x0;
      /* every board came off a different part of the log */
      const tone = 0.8 + rnd() * 0.44;
      const pith = x0 + bw * (rnd() * 2.8 - 0.9); /* usually outside it */
      const d0 = bw * (0.12 + rnd() * 1.7); /* how deep the cut ran */
      const amp = bw * (0.1 + rnd() * 0.4);
      const per = 1 + ((rnd() * 2) | 0),
        ph = rnd() * TAU;
      const dAt = (y) => d0 + Math.sin((y / H) * TAU * per + ph) * amp;
      const gap = 2.4 + rnd() * 5.0; /* ring spacing */

      [x, hx, rx].forEach((d) => {
        d.save();
        d.beginPath();
        d.rect(x0, 0, bw, H);
        d.clip();
      });
      x.fillStyle = hex(base[0] * tone, base[1] * tone, base[2] * tone);
      x.fillRect(x0, 0, bw, H);

      for (let k = 1; k * gap < bw * 3.4 + d0 + amp; k++) {
        const rr = k * gap * (0.88 + rnd() * 0.24);
        const dark = 0.42 + rnd() * 0.38,
          wide = 0.8 + rnd() * 1.9;
        for (const side of [-1, 1]) {
          let pts = [];
          const flush = () => {
            /* latewood: a narrow dark band, with the pale earlywood just inside */
            stroke(pts, x, "rgba(0,0,0," + dark.toFixed(2) + ")", wide);
            stroke(
              pts,
              hx,
              "rgba(0,0,0," + (dark * 0.8).toFixed(2) + ")",
              wide,
            );
            stroke(
              pts.map((q) => [q[0] + side * (wide + 0.6), q[1]]),
              x,
              "rgba(150,120,96," + (dark * 0.3).toFixed(2) + ")",
              wide * 0.7,
            );
            pts = [];
          };
          for (let y = -3; y <= H + 3; y += 3) {
            const d = dAt(y),
              q = rr * rr - d * d;
            if (q <= 0) {
              flush();
              continue;
            }
            pts.push([pith + side * Math.sqrt(q), y]);
          }
          flush();
        }
      }
      /* pores — the open tooth of cedar, elongated along the grain */
      for (let i = 0; i < 220; i++) {
        const px2 = x0 + rnd() * bw,
          py = rnd() * H,
          ln = 1.5 + rnd() * 6;
        x.fillStyle = "rgba(0,0,0," + (0.1 + rnd() * 0.22) + ")";
        x.fillRect(px2, py, 0.7 + rnd() * 0.7, ln);
        hx.fillStyle = "rgba(0,0,0,.22)";
        hx.fillRect(px2, py, 0.8, ln);
      }
      /* the odd knot, where a branch left the trunk */
      if (rnd() > 0.55) {
        const kx = x0 + bw * (0.2 + rnd() * 0.6),
          ky = rnd() * H,
          kr = 2.5 + rnd() * 5;
        for (let i = 5; i >= 1; i--) {
          const t = i / 5;
          x.strokeStyle = "rgba(0,0,0," + (0.5 - t * 0.25).toFixed(2) + ")";
          x.lineWidth = 1.1;
          x.beginPath();
          x.ellipse(kx, ky, kr * t * 1.5, kr * t * 2.4, 0, 0, TAU);
          x.stroke();
          hx.strokeStyle = "rgba(0,0,0,.30)";
          hx.lineWidth = 1.1;
          hx.beginPath();
          hx.ellipse(kx, ky, kr * t * 1.5, kr * t * 2.4, 0, 0, TAU);
          hx.stroke();
        }
      }
      /* checking: the splits a dried board opens, always along the grain */
      for (let i = 0; i < 5; i++) {
        const sx = x0 + rnd() * bw,
          sy = rnd() * H,
          ln = 20 + rnd() * 120;
        const pts = [];
        for (let y = sy; y < sy + ln; y += 6)
          pts.push([sx + Math.sin(y * 0.07) * 1.4, y]);
        stroke(pts, x, "rgba(0,0,0,.62)", 0.7 + rnd() * 1.2);
        stroke(pts, hx, "rgba(0,0,0,.55)", 0.7 + rnd() * 1.2);
      }
      [x, hx, rx].forEach((d) => d.restore());

      /* the joint, and the board edge that catches light beside it */
      if (nb > 0) {
        x.fillStyle = "rgba(0,0,0,.80)";
        x.fillRect(x1 - 1.1, 0, 2.2, H);
        x.fillStyle = "rgba(158,130,106,.14)";
        x.fillRect(x1 + 1.1, 0, 1.1, H);
        hx.fillStyle = "rgba(0,0,0,.85)";
        hx.fillRect(x1 - 1.3, 0, 2.6, H);
        hx.fillStyle = "rgba(255,255,255,.35)";
        hx.fillRect(x1 + 1.3, 0, 1.6, H);
        rx.fillStyle = "rgba(255,255,255,.5)";
        rx.fillRect(x1 - 1.6, 0, 3.2, H);
      }
    }

    /* soot, running down the boards rather than pooling in clouds — this is the
     one weathering pass, and it follows the grain because water does */
    for (let i = 0; i < 90; i++) {
      const sx = rnd() * W,
        top = rnd() * H,
        ln = H * (0.15 + rnd() * 0.5);
      const g = x.createLinearGradient(0, top, 0, top + ln);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.3, "rgba(0,0,0," + (0.1 + rnd() * 0.16) + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.fillRect(sx, top, 0.8 + rnd() * 3.4, ln);
    }
    return { map: c, normal: normalFromHeight(h, o.relief || 2.4), rough: r };
  }

  /* ------------------------------------------------------------ cut granite
   The lanterns are carved out of one block, so this is a monolith face and
   not coursed masonry: no joints, no bond pattern. What sells it instead is
   grain and wear —

     1 · the speckle. Three mineral populations at three tones: pale feldspar,
         mid quartz, black mica. A granite without visible crystal is grey
         plastic, and it is the one thing a colour ramp cannot fake.
     2 · the chisel. Parallel bruising left by a point on a dressed face, each
         mark a dark gouge with a lit shoulder below it.
     3 · pitting and fracture, and moss keyed to *those* — moss grows where
         water sits, which is the low ground, so it is read out of the height
         field rather than dropped on as its own cloud. That cloud is what
         made this look like weather rather than stone. */
  function texStone(seed, opt) {
    const o = opt || {},
      W = 512,
      H = 512;
    const c = cvs(W, H),
      x = c.getContext("2d");
    const h = cvs(W, H),
      hx = h.getContext("2d");
    const r = cvs(W, H),
      rx = r.getContext("2d");
    const rnd = mulberry32(seed || 17);
    const base = o.base || [46, 51, 53];
    x.fillStyle = hex(base[0], base[1], base[2]);
    x.fillRect(0, 0, W, H);
    hx.fillStyle = "#808080";
    hx.fillRect(0, 0, W, H);
    rx.fillStyle = "#e8e8e8";
    rx.fillRect(0, 0, W, H);

    /* 1 · crystal */
    const speck = (n, fill, smin, smax, hgt) => {
      for (let i = 0; i < n; i++) {
        const s = smin + rnd() * (smax - smin),
          px = rnd() * W,
          py = rnd() * H;
        x.fillStyle = fill(rnd);
        x.beginPath();
        x.ellipse(px, py, s, s * (0.55 + rnd() * 0.85), rnd() * TAU, 0, TAU);
        x.fill();
        if (hgt) {
          hx.fillStyle = hgt;
          hx.beginPath();
          hx.ellipse(px, py, s, s * 0.8, 0, 0, TAU);
          hx.fill();
        }
      }
    };
    speck(
      3400,
      (q) => "rgba(206,210,204," + (0.06 + q() * 0.2) + ")",
      0.6,
      2.8,
      "rgba(255,255,255,.13)",
    );
    speck(
      2000,
      (q) => "rgba(126,136,134," + (0.07 + q() * 0.2) + ")",
      0.8,
      3.4,
      null,
    );
    speck(
      1300,
      (q) => "rgba(8,10,12," + (0.14 + q() * 0.38) + ")",
      0.5,
      2.4,
      "rgba(0,0,0,.16)",
    );

    /* 2 · the chisel */
    for (let i = 0; i < 220; i++) {
      const py = rnd() * H,
        px = rnd() * W,
        len = 5 + rnd() * 24,
        ang = -0.26 + rnd() * 0.52;
      [
        [x, "rgba(0,0,0,.22)", "rgba(210,216,212,.08)"],
        [hx, "rgba(0,0,0,.34)", "rgba(255,255,255,.26)"],
      ].forEach(([d, dk, lt]) => {
        d.save();
        d.translate(px, py);
        d.rotate(ang);
        d.fillStyle = dk;
        d.fillRect(0, 0, len, 1.5);
        d.fillStyle = lt;
        d.fillRect(0, 1.5, len, 1.0);
        d.restore();
      });
    }
    /* 3 · pitting and fracture */
    for (let i = 0; i < 260; i++) {
      const px = rnd() * W,
        py = rnd() * H,
        rr = 0.8 + rnd() * rnd() * 5;
      const g = x.createRadialGradient(
        px - rr * 0.3,
        py - rr * 0.3,
        rr * 0.1,
        px,
        py,
        rr,
      );
      g.addColorStop(0, "rgba(0,0,0,.42)");
      g.addColorStop(0.7, "rgba(0,0,0,.16)");
      g.addColorStop(1, "rgba(198,204,198,.10)");
      x.fillStyle = g;
      x.beginPath();
      x.arc(px, py, rr, 0, TAU);
      x.fill();
      hx.fillStyle = "rgba(0,0,0,.40)";
      hx.beginPath();
      hx.arc(px, py, rr * 0.8, 0, TAU);
      hx.fill();
    }
    for (let i = 0; i < 16; i++) {
      let px = rnd() * W,
        py = rnd() * H,
        a = rnd() * TAU;
      const pts = [[px, py]];
      for (let k = 0; k < 24; k++) {
        a += (rnd() - 0.5) * 0.9;
        px += Math.cos(a) * 9;
        py += Math.sin(a) * 9;
        pts.push([px, py]);
      }
      [
        [x, "rgba(0,0,0,.46)"],
        [hx, "rgba(0,0,0,.55)"],
      ].forEach(([d, st]) => {
        d.beginPath();
        d.moveTo(pts[0][0], pts[0][1]);
        pts.forEach((q) => d.lineTo(q[0], q[1]));
        d.strokeStyle = st;
        d.lineWidth = 0.7 + rnd() * 0.9;
        d.stroke();
      });
    }

    /* moss, read out of the low ground of the height field */
    const hd = hx.getImageData(0, 0, W, H).data;
    const im = x.getImageData(0, 0, W, H),
      rm = rx.getImageData(0, 0, W, H);
    const amt = o.moss === undefined ? 1 : o.moss;
    for (let i = 0; i < W * H; i++) {
      const t = clamp((0.5 - hd[i * 4] / 255) * 4.2, 0, 1) * amt;
      if (t <= 0) continue;
      const j = i * 4;
      im.data[j] = lerp(im.data[j], 30, t * 0.75);
      im.data[j + 1] = lerp(im.data[j + 1], 44, t * 0.95);
      im.data[j + 2] = lerp(im.data[j + 2], 28, t * 0.85);
      /* moss is matte — through the same buffer, because a fillRect per pixel
       is a quarter of a million canvas calls and costs more than the rest of
       this generator put together */
      rm.data[j] =
        rm.data[j + 1] =
        rm.data[j + 2] =
          lerp(rm.data[j], 255, t * 0.5);
    }
    x.putImageData(im, 0, 0);
    rx.putImageData(rm, 0, 0);
    return { map: c, normal: normalFromHeight(h, o.relief || 3.2), rough: r };
  }

  /* ------------------------------------------- weathered vermilion · the gate
   Not a red cylinder. The gate is a painted timber that has stood out in the
   weather: the lacquer has crazed into a fine net, flaked off the edges back to
   the black wood underneath, and run in streaks where the rain came down it.
   So the wood is drawn first and the paint is laid over it at less than full
   coverage — the grain has to read *through* the red, which is what stops it
   looking like plastic. */
  function texLacquer() {
    const W = 512,
      H = 512;
    const wood = texWood(131, { base: [34, 22, 17], boards: 0 });
    const c = cvs(W, H),
      x = c.getContext("2d");
    const h = cvs(W, H),
      hx = h.getContext("2d");
    const r = cvs(W, H),
      rx = r.getContext("2d");
    const rnd = mulberry32(5);
    x.drawImage(wood.map, 0, 0);
    hx.fillStyle = "#808080";
    hx.fillRect(0, 0, W, H);
    rx.fillStyle = "#8c8c8c";
    rx.fillRect(0, 0, W, H); /* lacquer half-holds a sheen */

    /* the coat */
    x.globalAlpha = 0.8;
    x.fillStyle = "#7c1610";
    x.fillRect(0, 0, W, H);
    x.globalAlpha = 1;
    /* pull the grain back through it */
    x.globalCompositeOperation = "multiply";
    x.globalAlpha = 0.42;
    x.drawImage(wood.map, 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";
    /* uneven pigment: the brush left it thicker in places */
    x.globalCompositeOperation = "overlay";
    x.globalAlpha = 0.5;
    x.drawImage(fbmCanvas(W, H, 313, 5, 3, 1), 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";

    /* craquelure — a wandering net of hairline cracks in the paint film */
    for (let i = 0; i < 190; i++) {
      let px = rnd() * W,
        py = rnd() * H,
        a = rnd() * TAU;
      x.strokeStyle = "rgba(24,8,6," + (0.28 + rnd() * 0.4) + ")";
      hx.strokeStyle = "rgba(0,0,0,.42)";
      x.lineWidth = hx.lineWidth = 0.5 + rnd() * 0.7;
      x.beginPath();
      hx.beginPath();
      x.moveTo(px, py);
      hx.moveTo(px, py);
      for (let k = 0; k < 5 + rnd() * 9; k++) {
        a += (rnd() - 0.5) * 1.5;
        px += Math.cos(a) * (5 + rnd() * 9);
        py += Math.sin(a) * (5 + rnd() * 9);
        x.lineTo(px, py);
        hx.lineTo(px, py);
      }
      x.stroke();
      hx.stroke();
    }

    /* flaking: islands where the coat has lifted, showing the burnt wood, each
     with the pale shoulder of paint still standing at its edge */
    for (let i = 0; i < 40; i++) {
      const px = rnd() * W,
        py = rnd() * H,
        rad = 2 + rnd() * rnd() * 17;
      const pts = [];
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * TAU,
          rr = rad * (0.55 + rnd() * 0.75);
        pts.push([px + Math.cos(a) * rr, py + Math.sin(a) * rr]);
      }
      const path = (d) => {
        d.beginPath();
        d.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < pts.length; k++) {
          const p = pts[k],
            q = pts[(k + 1) % pts.length];
          d.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
        }
        d.closePath();
      };
      x.save();
      path(x);
      x.clip();
      x.drawImage(wood.map, 0, 0);
      x.fillStyle = "rgba(0,0,0,.22)";
      x.fillRect(0, 0, W, H);
      x.restore();
      path(x);
      x.strokeStyle = "rgba(196,110,76,.30)";
      x.lineWidth = 1.2;
      x.stroke();
      path(hx);
      hx.fillStyle = "rgba(0,0,0,.34)";
      hx.fill();
      hx.strokeStyle = "rgba(255,255,255,.30)";
      hx.lineWidth = 1.6;
      hx.stroke();
      path(rx);
      rx.fillStyle = "rgba(240,240,240,.75)";
      rx.fill(); /* bare wood, matte */
    }

    /* rain running down the column */
    for (let i = 0; i < 120; i++) {
      const sx = rnd() * W,
        w = 0.6 + rnd() * 2.6,
        top = rnd() * H,
        len = H * (0.2 + rnd() * 0.6);
      const g = x.createLinearGradient(0, top, 0, top + len);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(
        0.3,
        rnd() > 0.5 ? "rgba(12,4,4,.24)" : "rgba(210,150,120,.05)",
      );
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.fillRect(sx, top, w, len);
    }
    rx.globalAlpha = 0.6;
    rx.globalCompositeOperation = "multiply";
    rx.drawImage(fbmCanvas(W, H, 401, 4, 6, 1.2), 0, 0);
    rx.globalAlpha = 1;
    rx.globalCompositeOperation = "source-over";
    return { map: c, normal: normalFromHeight(h, 2.2), rough: r };
  }

  /* the shoji screen the sun burns through */
  function texShoji() {
    const W = 1024,
      H = 768,
      c = cvs(W, H),
      x = c.getContext("2d");
    x.clearRect(0, 0, W, H);
    x.fillStyle = "rgba(228,222,206,.055)";
    x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(10,8,7,.88)";
    const cols = 12,
      rows = 9;
    x.lineWidth = 5;
    for (let i = 1; i < cols; i++) {
      x.beginPath();
      x.moveTo((W / cols) * i, 0);
      x.lineTo((W / cols) * i, H);
      x.stroke();
    }
    for (let j = 1; j < rows; j++) {
      x.beginPath();
      x.moveTo(0, (H / rows) * j);
      x.lineTo(W, (H / rows) * j);
      x.stroke();
    }
    x.lineWidth = 13;
    x.strokeStyle = "rgba(8,6,5,.95)";
    x.strokeRect(0, 0, W, H);
    x.beginPath();
    x.moveTo(W / 2, 0);
    x.lineTo(W / 2, H);
    x.stroke();
    return c;
  }

  /* one maple leaf, white on transparent — tinted per instance */
  function texLeaf() {
    const S = 128,
      c = cvs(S, S),
      x = c.getContext("2d");
    x.translate(S / 2, S * 0.92);
    x.scale(S / 2.2, -S / 2.2);
    x.beginPath();
    const lobes = 5,
      spread = 1.9;
    for (let i = 0; i < lobes; i++) {
      const a = -spread / 2 + spread * (i / (lobes - 1)) + Math.PI / 2;
      const len = i === 2 ? 0.96 : i === 1 || i === 3 ? 0.82 : 0.6;
      const wob = 0.17;
      x.moveTo(0, 0.02);
      x.lineTo(Math.cos(a - wob) * len * 0.55, Math.sin(a - wob) * len * 0.55);
      x.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      x.lineTo(Math.cos(a + wob) * len * 0.55, Math.sin(a + wob) * len * 0.55);
      x.closePath();
    }
    x.fillStyle = "#fff";
    x.fill();
    x.lineWidth = 0.05;
    x.strokeStyle = "#fff";
    x.stroke();
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = "destination-out";
    const rnd = mulberry32(3);
    for (let i = 0; i < 40; i++) {
      x.beginPath();
      x.arc(rnd() * S, rnd() * S, rnd() * 3, 0, TAU);
      x.fill();
    }
    return c;
  }

  /* the night sky itself: black at altitude, going to the fog colour at the
   horizon so the backdrop and the depth cue meet without a seam */
  function texSky() {
    const W = 512,
      H = 512,
      c = cvs(W, H),
      x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgb(6,10,15)");
    g.addColorStop(0.34, "rgb(13,22,31)");
    g.addColorStop(0.66, "rgb(17,26,34)");
    g.addColorStop(0.88, "rgb(24,35,42)");
    g.addColorStop(1, "rgb(14,22,28)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    /* cloud, and a low warm bloom off the valley behind the ridge */
    x.globalAlpha = 0.34;
    x.globalCompositeOperation = "overlay";
    x.drawImage(fbmCanvas(W, H, 313, 5, 3, 0.9), 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";
    const wg = x.createRadialGradient(
      W * 0.68,
      H * 0.95,
      4,
      W * 0.68,
      H * 0.95,
      W * 0.44,
    );
    wg.addColorStop(0, "rgba(150,66,26,.30)");
    wg.addColorStop(0.5, "rgba(96,44,22,.12)");
    wg.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = wg;
    x.fillRect(0, 0, W, H);
    /* a scatter of stars, faint enough to survive the bloom */
    const rnd = mulberry32(881);
    for (let i = 0; i < 420; i++) {
      const sx = rnd() * W,
        sy = rnd() * H * 0.78,
        r = 0.5 + rnd() * rnd() * 1.7;
      x.fillStyle =
        "rgba(214,232,240," + (0.12 + rnd() * 0.42) * (1 - sy / H) + ")";
      x.beginPath();
      x.arc(sx, sy, r, 0, TAU);
      x.fill();
    }
    return c;
  }

  /* the wooded ridge the valley closes with — black, ragged, mostly fog */
  function texRidge() {
    const W = 2048,
      H = 512,
      c = cvs(W, H),
      x = c.getContext("2d");
    const n = noise2D(1207),
      rnd = mulberry32(1207);
    x.beginPath();
    x.moveTo(0, H);
    for (let i = 0; i <= W; i += 4) {
      const t = i / W;
      const ridge =
        0.46 +
        0.3 * (fbm(n, t * 2.4, 0.5, 4, 2.1, 0.55) * 0.5 + 0.5) +
        0.16 * (fbm(n, t * 7.5, 3.1, 3, 2.2, 0.5) * 0.5 + 0.5);
      x.lineTo(i, H - ridge * H * 0.84);
    }
    x.lineTo(W, H);
    x.closePath();
    x.fillStyle = "#050809";
    x.fill();
    /* conifer spikes along the crest so the silhouette reads as forest */
    x.fillStyle = "#050809";
    for (let i = 0; i < 460; i++) {
      const px = rnd() * W,
        t = px / W;
      const ridge =
        0.46 +
        0.3 * (fbm(n, t * 2.4, 0.5, 4, 2.1, 0.55) * 0.5 + 0.5) +
        0.16 * (fbm(n, t * 7.5, 3.1, 3, 2.2, 0.5) * 0.5 + 0.5);
      const by = H - ridge * H * 0.84,
        hh = 8 + rnd() * 30,
        ww = 3 + rnd() * 6;
      x.beginPath();
      x.moveTo(px, by - hh);
      x.lineTo(px + ww, by + 4);
      x.lineTo(px - ww, by + 4);
      x.closePath();
      x.fill();
    }
    return c;
  }

  /* glazed roof tile — half-round caps running down the slope, weathered */
  function texRoof() {
    const W = 512,
      H = 512,
      c = cvs(W, H),
      x = c.getContext("2d");
    const h = cvs(W, H),
      hx = h.getContext("2d");
    x.fillStyle = "#151c20";
    x.fillRect(0, 0, W, H);
    hx.fillStyle = "#606060";
    hx.fillRect(0, 0, W, H);
    const ribs = 14,
      s = W / ribs;
    for (let i = 0; i < ribs; i++) {
      const g = x.createLinearGradient(i * s, 0, (i + 1) * s, 0);
      g.addColorStop(0, "rgba(0,0,0,.62)");
      g.addColorStop(0.3, "rgba(148,178,192,.13)");
      g.addColorStop(0.66, "rgba(84,110,124,.05)");
      g.addColorStop(1, "rgba(0,0,0,.62)");
      x.fillStyle = g;
      x.fillRect(i * s, 0, s, H);
      x.fillStyle = "rgba(0,0,0,.50)";
      x.fillRect(i * s - 3, 0, 6, H);
      x.fillStyle = "rgba(168,196,208,.09)";
      x.fillRect(i * s - 1.2, 0, 1.6, H);
      /* the half-round cap itself, as height: the valley between two tiles is
       the only reason a tiled roof reads as tiled at this distance */
      const hg = hx.createLinearGradient(i * s, 0, (i + 1) * s, 0);
      hg.addColorStop(0, "#2c2c2c");
      hg.addColorStop(0.5, "#eaeaea");
      hg.addColorStop(1, "#2c2c2c");
      hx.fillStyle = hg;
      hx.fillRect(i * s, 0, s, H);
    }
    /* the courses running down the slope — each tile overlaps the one below */
    const rnd = mulberry32(211);
    for (let y = 0; y < H; y += H / 9) {
      x.fillStyle = "rgba(0,0,0,.34)";
      x.fillRect(0, y, W, 3.5);
      hx.fillStyle = "rgba(0,0,0,.55)";
      hx.fillRect(0, y, W, 3.5);
      hx.fillStyle = "rgba(255,255,255,.28)";
      hx.fillRect(0, y + 3.5, W, 2);
      for (let i = 0; i < 26; i++) {
        /* chipped, mossed edges */
        x.fillStyle = rnd() > 0.5 ? "rgba(0,0,0,.30)" : "rgba(96,116,92,.10)";
        x.fillRect(rnd() * W, y + 1, 2 + rnd() * 9, 2 + rnd() * 3);
      }
    }
    x.globalCompositeOperation = "overlay";
    x.globalAlpha = 0.46;
    x.drawImage(fbmCanvas(256, 256, 211, 5, 3, 1), 0, 0, W, H);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";
    hx.globalAlpha = 0.3;
    hx.drawImage(fbmCanvas(256, 256, 213, 4, 16, 1.2), 0, 0, W, H);
    hx.globalAlpha = 1;
    return { map: c, normal: normalFromHeight(h, 2.2) };
  }

  /* -------------------------------------------------------- the blood moon
   A real lunar disc, not a glow sprite and not a noise field. Three things do
   the work, in this order of importance:

     1 · the maria. The dark seas are the Moon's signature and they are not
         fbm — they are a handful of large, lobed, soft-edged basins in a
         layout everyone has known since childhood. Drawn at their real
         near-side positions and blurred, they are what makes the disc read as
         the Moon at a glance instead of as a planet.
     2 · the ray systems. Fine bright streaks thrown out of Tycho and
         Copernicus, straight across the maria. Nothing else on the surface
         looks like this, so nothing else identifies it as fast.
     3 · the craters, thickest in the bright highlands, each with a rim lit
         from the same side as the rest of the frame.

   The tint is measured off the reference plate, not invented: a blood moon
   sits at G/R ≈ B/R ≈ .48 — a rose red with green and blue level. Grading it
   as an orange (blue well under green) is what makes a CG moon read as a
   fireball, and that is what this was doing. The disc is authored here in
   near-neutral albedo and the colour is applied once, on the material. */
  function texMoon() {
    const S = 512,
      c = cvs(S, S),
      x = c.getContext("2d");
    const R = S / 2 - 1,
      rnd = mulberry32(91);
    const px = (u, v) => [S / 2 + u * R, S / 2 + v * R]; /* disc coords */

    x.beginPath();
    x.arc(S / 2, S / 2, R, 0, TAU);
    x.closePath();
    x.save();
    x.clip();

    /* highland base. The reference disc is very slightly brighter at the limb,
     not darker — during totality the rim keeps its forward scatter — so this
     ramp opens outward instead of falling off. */
    const g = x.createRadialGradient(
      S * 0.46,
      S * 0.44,
      S * 0.05,
      S / 2,
      S / 2,
      R,
    );
    g.addColorStop(0, "rgb(150,150,150)");
    g.addColorStop(0.55, "rgb(158,158,158)");
    g.addColorStop(0.86, "rgb(178,178,178)");
    g.addColorStop(1, "rgb(196,196,196)");
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);

    /* fine highland mottle */
    x.globalCompositeOperation = "overlay";
    x.globalAlpha = 0.5;
    x.drawImage(fbmCanvas(256, 256, 517, 6, 4, 1.1), 0, 0, S, S);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";

    /* --- 1 · the maria, at their near-side places (u right, v down) --------- */
    const seas = [
      [-0.52, -0.06, 0.46, 0.8] /* Oceanus Procellarum */,
      [-0.26, -0.38, 0.31, 0.92] /* Imbrium             */,
      [0.13, -0.31, 0.2, 0.88] /* Serenitatis         */,
      [0.3, -0.08, 0.23, 0.84] /* Tranquillitatis     */,
      [0.45, 0.12, 0.15, 0.78] /* Fecunditatis        */,
      [0.27, 0.27, 0.12, 0.74] /* Nectaris            */,
      [0.57, -0.3, 0.12, 0.95] /* Crisium, the one that stands on its own */,
      [-0.27, 0.3, 0.19, 0.7] /* Nubium              */,
      [-0.47, 0.25, 0.13, 0.72] /* Humorum             */,
    ];
    const sea = cvs(S, S),
      sx = sea.getContext("2d");
    seas.forEach(([u, v, rad, dk]) => {
      /* a basin is a cluster of lobes, never a circle */
      for (let i = 0; i < 22; i++) {
        const a = rnd() * TAU,
          off = rnd() * rad * 0.66;
        const [bx, by] = px(u + Math.cos(a) * off, v + Math.sin(a) * off * 0.8);
        const rr = rad * R * (0.3 + rnd() * 0.46);
        const bg = sx.createRadialGradient(bx, by, rr * 0.2, bx, by, rr);
        bg.addColorStop(0, "rgba(0,0,0," + (dk * 0.14).toFixed(3) + ")");
        bg.addColorStop(1, "rgba(0,0,0,0)");
        sx.fillStyle = bg;
        sx.beginPath();
        sx.arc(bx, by, rr, 0, TAU);
        sx.fill();
      }
    });
    /* a sea is dark, not black: the real mare/highland contrast is about 4:3,
     and anything heavier turns the disc into a skull */
    x.save();
    x.filter = "blur(9px)";
    x.globalAlpha = 0.9;
    x.drawImage(sea, 0, 0);
    x.restore();
    /* mottle riding on top of the basins so their floors are not flat washes */
    x.globalCompositeOperation = "overlay";
    x.globalAlpha = 0.18;
    x.drawImage(fbmCanvas(256, 256, 811, 4, 11, 1.2), 0, 0, S, S);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";

    /* --- 2 · ray systems, thrown clear across the disc ---------------------- */
    const ray = cvs(S, S),
      rx2 = ray.getContext("2d");
    [
      [-0.1, 0.54, 150, 1],
      [-0.28, -0.07, 80, 0.6],
      [-0.46, -0.04, 60, 0.45],
    ].forEach(([u, v, n, str]) => {
      const [ox, oy] = px(u, v);
      for (let i = 0; i < n; i++) {
        const a = rnd() * TAU,
          len = R * (0.3 + rnd() * rnd() * 1.3);
        /* start clear of the crater — rays converging on a point read as a
         lens flare, and the real ones begin outside the ejecta blanket */
        const t0 = R * (0.08 + rnd() * 0.06);
        const p0 = [ox + Math.cos(a) * t0, oy + Math.sin(a) * t0];
        const p1 = [ox + Math.cos(a) * len, oy + Math.sin(a) * len];
        const rg = rx2.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
        rg.addColorStop(
          0,
          "rgba(255,255,255," + (0.085 * str).toFixed(3) + ")",
        );
        rg.addColorStop(
          0.4,
          "rgba(255,255,255," + (0.055 * str).toFixed(3) + ")",
        );
        rg.addColorStop(1, "rgba(255,255,255,0)");
        rx2.strokeStyle = rg;
        rx2.lineWidth = 0.8 + rnd() * 2.4;
        rx2.lineCap = "round";
        rx2.beginPath();
        rx2.moveTo(p0[0], p0[1]);
        rx2.quadraticCurveTo(
          ox + Math.cos(a + 0.06) * len * 0.55,
          oy + Math.sin(a + 0.06) * len * 0.55,
          p1[0],
          p1[1],
        );
        rx2.stroke();
      }
    });
    x.save();
    x.filter = "blur(2.4px)";
    x.globalCompositeOperation = "lighter";
    x.globalAlpha = 0.62;
    x.drawImage(ray, 0, 0);
    x.restore();

    /* --- 3 · the crater field ----------------------------------------------
     A crater is not a ring. Stroked with a gradient running across it, the
     same circle gives a rim lit on the sun side and thrown into shadow on the
     other — which is the read — where a radial ring gives a bubble. */
    const inSea = (u, v) =>
      seas.some(
        ([su, sv, rad]) => Math.hypot(u - su, (v - sv) * 1.15) < rad * 0.82,
      );
    for (let i = 0; i < 620; i++) {
      const a = rnd() * TAU,
        rr = Math.sqrt(rnd()) * 0.97;
      const u = Math.cos(a) * rr,
        v = Math.sin(a) * rr;
      /* the seas are young and nearly unmarked — that contrast is the point */
      if (inSea(u, v) && rnd() > 0.12) continue;
      const [cx2, cy] = px(u, v);
      const big = rnd() > 0.975;
      const r = (1 + rnd() * rnd() * rnd() * (big ? 34 : 11)) * (S / 512);
      const fade =
        0.55 + 0.45 * Math.sqrt(Math.max(0, 1 - rr * rr)); /* limb falloff */
      /* foreshortened toward the limb, like anything on a sphere */
      const sq = Math.sqrt(Math.max(0, 1 - rr * rr)) * 0.72 + 0.28;
      x.save();
      x.translate(cx2, cy);
      x.rotate(Math.atan2(v, u));
      x.scale(sq, 1);
      x.rotate(-Math.atan2(v, u)); /* keep the sun direction */
      const rimW = Math.max(0.8, r * 0.26);
      const lg = x.createLinearGradient(-r, -r, r, r); /* sun sits up-left */
      lg.addColorStop(0, "rgba(255,255,255," + (0.34 * fade).toFixed(3) + ")");
      lg.addColorStop(0.5, "rgba(255,255,255,0)");
      lg.addColorStop(1, "rgba(0,0,0," + (0.38 * fade).toFixed(3) + ")");
      x.strokeStyle = lg;
      x.lineWidth = rimW;
      x.beginPath();
      x.arc(0, 0, Math.max(0.6, r - rimW * 0.5), 0, TAU);
      x.stroke();
      if (r > 3) {
        /* the floor it encloses */
        const fg = x.createLinearGradient(-r, -r, r, r);
        fg.addColorStop(0, "rgba(0,0,0," + (0.21 * fade).toFixed(3) + ")");
        fg.addColorStop(
          1,
          "rgba(255,255,255," + (0.07 * fade).toFixed(3) + ")",
        );
        x.fillStyle = fg;
        x.beginPath();
        x.arc(0, 0, r - rimW, 0, TAU);
        x.fill();
      }
      if (r > 13) {
        /* central peak */
        x.fillStyle = "rgba(255,255,255," + (0.14 * fade).toFixed(3) + ")";
        x.beginPath();
        x.arc(-r * 0.04, -r * 0.04, r * 0.11, 0, TAU);
        x.fill();
      }
      x.restore();
    }

    /* surface tooth: genuinely fine, or it just adds another layer of cloud
     and the basins disappear under it */
    x.globalCompositeOperation = "overlay";
    x.globalAlpha = 0.13;
    x.drawImage(fbmCanvas(S, S, 977, 2, 210, 1.3), 0, 0, S, S);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";

    /* the terminator side: the disc is not lit dead-on */
    const sh = x.createRadialGradient(
      S * 0.4,
      S * 0.38,
      S * 0.18,
      S * 0.52,
      S * 0.56,
      S * 0.72,
    );
    sh.addColorStop(0, "rgba(0,0,0,0)");
    sh.addColorStop(1, "rgba(0,0,0,.30)");
    x.fillStyle = sh;
    x.fillRect(0, 0, S, S);
    x.restore();

    /* a one-pixel feather on the limb so it is a moon in air, not a cut disc */
    const fe = x.createRadialGradient(S / 2, S / 2, R - 2.5, S / 2, S / 2, R);
    fe.addColorStop(0, "rgba(0,0,0,1)");
    fe.addColorStop(1, "rgba(0,0,0,0)");
    x.globalCompositeOperation = "destination-in";
    x.fillStyle = fe;
    x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = "source-over";
    return c;
  }

  /* soft round falloff — haze, embers, glows */
  function texGlow(inner, mid) {
    const S = 256,
      c = cvs(S, S),
      x = c.getContext("2d");
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, inner || "rgba(255,255,255,1)");
    g.addColorStop(0.28, mid || "rgba(255,255,255,.36)");
    g.addColorStop(0.62, "rgba(255,255,255,.07)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    return c;
  }

  /* one wisp — a round mote, not a streak. The whole read is a hard bright
   point sitting in a soft halo, so the falloff is deliberately uneven: almost
   all of the light is spent inside the first eighth of the radius and the rest
   is a wide, very faint bloom. A smooth gradient across the full radius gives
   an evenly lit blob with no centre to it. */
  function texWisp() {
    const S = 128,
      c = cvs(S, S),
      x = c.getContext("2d");
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); /* the point itself */
    g.addColorStop(0.07, "rgba(236,250,250,.92)");
    g.addColorStop(0.16, "rgba(190,230,238,.40)");
    g.addColorStop(0.34, "rgba(132,192,212,.13)");
    g.addColorStop(0.62, "rgba(88,146,172,.035)");
    g.addColorStop(1, "rgba(70,120,142,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    return c;
  }

  /* ---------------------------------------------- 3 · the foreground cut-outs
   These are the "transparent PNG" layers: painted at high resolution with
   a ragged alpha edge, then hung in front of the type as real geometry so
   they parallax and sway.                                                */
  function texGrassCutout(seed, opt) {
    opt = opt || {};
    const W = opt.w || 2048,
      H = opt.h || 1024;
    const c = cvs(W, H),
      x = c.getContext("2d");
    const rnd = mulberry32(seed),
      n = noise2D(seed * 13 + 5);

    /* --- silhouette ------------------------------------------------- */
    const crest = opt.crest !== undefined ? opt.crest : 0.46;
    const peak = opt.peak !== undefined ? opt.peak : 0.6;
    const wide = opt.wide !== undefined ? opt.wide : 0.4;
    const prof = new Float32Array(W);
    for (let i = 0; i < W; i++) {
      const t = i / W;
      let m = Math.exp(-Math.pow((t - crest) / wide, 2) * 2.1);
      m +=
        0.46 *
        Math.exp(
          -Math.pow((t - crest - (opt.crest2 || 0.4)) / (wide * 0.62), 2) * 3.1,
        );
      m +=
        0.3 *
        Math.exp(
          -Math.pow((t - crest + (opt.crest3 || 0.46)) / (wide * 0.7), 2) * 3.4,
        );
      const g = fbm(n, t * 4.2, 0.5, 4, 2.05, 0.52) * 0.5 + 0.5;
      prof[i] = m * (0.8 + 0.38 * g);
    }
    let pk = 0;
    for (let i = 0; i < W; i++) pk = Math.max(pk, prof[i]);
    for (let i = 0; i < W; i++) prof[i] *= (H * peak) / pk;
    const surf = (i) => H - prof[clamp(i | 0, 0, W - 1)];

    /* --- body ------------------------------------------------------- */
    x.beginPath();
    x.moveTo(0, H);
    for (let i = 0; i < W; i += 3) x.lineTo(i, surf(i));
    x.lineTo(W, surf(W - 1));
    x.lineTo(W, H);
    x.closePath();
    const bg = x.createLinearGradient(0, H - H * peak, 0, H);
    bg.addColorStop(0, "#1a2416");
    bg.addColorStop(0.38, "#0e150c");
    bg.addColorStop(1, "#040604");
    x.fillStyle = bg;
    x.fill();
    x.save();
    x.clip();
    x.globalCompositeOperation = "overlay";
    x.globalAlpha = 0.5;
    x.drawImage(fbmCanvas(1024, 512, seed + 3, 5, 3, 1), 0, 0, W, H);
    x.restore();
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";

    /* --- blades ----------------------------------------------------- */
    const LIGHT = opt.light || [-0.42, -0.91]; /* light comes from up-left */
    const N = opt.blades || 15000;
    const blades = [];
    for (let k = 0; k < N; k++) {
      const i = (rnd() * W) | 0;
      const s = surf(i);
      /* bias the population toward the silhouette so the edge stays ragged */
      const depth = Math.pow(rnd(), 2.3);
      const by = s + depth * (H - s) + (rnd() - 0.5) * 6;
      if (by > H + 20) continue;
      blades.push({
        i: i,
        by: by,
        depth: depth,
        r: rnd(),
        r2: rnd(),
        r3: rnd(),
      });
    }
    blades.sort((a, b) => a.by - b.by); /* far (high) first */

    const LEN = (opt.len || 46) * (W / 2048);
    for (let k = 0; k < blades.length; k++) {
      const b = blades[k];
      const bx = b.i + (b.r - 0.5) * 5;
      const grow = 1 - 0.52 * b.depth;
      const len = LEN * (0.36 + 1.05 * b.r2 * b.r2) * grow;
      let lean = (b.r3 - 0.5) * 1.5 + (opt.wind || 0.16);
      /* blades on the sunward flank lean into frame */
      const tipx = bx + lean * len * 0.95,
        tipy = b.by - len;
      const cx2 = bx + lean * len * 0.3,
        cy2 = b.by - len * 0.62;
      const w = (0.9 + 1.9 * b.r) * grow * (W / 2048);

      /* shade: facing the key light, plus exposure to the sky at the crest */
      const dx = tipx - bx,
        dy = tipy - b.by,
        il = 1 / Math.hypot(dx, dy);
      const ndl = sat((-(dx * il) * LIGHT[0] - dy * il * LIGHT[1]) * 0.5 + 0.5);
      const open = Math.pow(1 - b.depth, 1.35);
      let l = 0.1 + 0.46 * open + 0.34 * ndl * open;
      const warm =
        sat(open * 1.25 - 0.42) * (opt.warm !== undefined ? opt.warm : 1);
      const r = (10 + 78 * l + 44 * warm) * (opt.tintR || 1);
      const g = (16 + 106 * l + 24 * warm) * (opt.tintG || 1);
      const bl = (12 + 80 * l + 16 * warm) * (opt.tintB || 1);
      x.fillStyle = hex(r, g, bl);
      x.beginPath();
      x.moveTo(bx - w, b.by);
      x.quadraticCurveTo(cx2 - w * 0.35, cy2, tipx, tipy);
      x.quadraticCurveTo(cx2 + w * 0.35, cy2, bx + w, b.by);
      x.closePath();
      x.fill();
    }

    /* --- grade: red bounce from the sun, cold sky on the crest ------- */
    x.globalCompositeOperation = "source-atop";
    const rb = x.createLinearGradient(
      opt.bounceFrom || W,
      0,
      opt.bounceTo || 0,
      0,
    );
    rb.addColorStop(0, "rgba(180,40,16,.24)");
    rb.addColorStop(0.55, "rgba(140,32,14,.07)");
    rb.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = rb;
    x.fillRect(0, 0, W, H);
    const sk = x.createLinearGradient(0, H - H * peak * 1.05, 0, H);
    sk.addColorStop(0, "rgba(146,182,180,.13)");
    sk.addColorStop(0.5, "rgba(0,0,0,0)");
    sk.addColorStop(1, "rgba(0,0,0,.70)");
    x.fillStyle = sk;
    x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = "source-over";
    return c;
  }

  /* wet foreground boulders */
  function texRockCutout(seed, opt) {
    opt = opt || {};
    const W = opt.w || 1536,
      H = opt.h || 1024;
    const c = cvs(W, H),
      x = c.getContext("2d");
    const rnd = mulberry32(seed),
      n = noise2D(seed * 7 + 11);
    const blobs = opt.blobs || [
      [0.3, 0.7, 0.4, 0.34],
      [0.66, 0.82, 0.38, 0.28],
      [0.46, 0.96, 0.52, 0.34],
    ];

    blobs.forEach((b, bi) => {
      const cx2 = b[0] * W,
        cy = b[1] * H,
        rx = b[2] * W * 0.5,
        ry = b[3] * H * 0.8;
      x.beginPath();
      for (let a = 0; a <= 128; a++) {
        const t = (a / 128) * TAU;
        const k =
          1 +
          0.17 *
            fbm(n, Math.cos(t) * 1.7 + bi * 9, Math.sin(t) * 1.7, 4, 2.1, 0.55);
        const px = cx2 + Math.cos(t) * rx * k,
          py = cy + Math.sin(t) * ry * k;
        void (a === 0 ? x.moveTo(px, py) : x.lineTo(px, py));
      }
      x.closePath();
      const g = x.createLinearGradient(
        cx2 - rx,
        cy - ry,
        cx2 + rx * 0.4,
        cy + ry,
      );
      const s = 1 - bi * 0.16;
      g.addColorStop(0, hex(30 * s, 39 * s, 40 * s));
      g.addColorStop(0.42, hex(14 * s, 19 * s, 20 * s));
      g.addColorStop(1, hex(6, 9, 9));
      x.fillStyle = g;
      x.fill();
      x.save();
      x.clip();
      x.globalCompositeOperation = "overlay";
      x.globalAlpha = 0.62;
      x.drawImage(fbmCanvas(768, 512, seed + bi * 31, 6, 4, 1.1), 0, 0, W, H);
      x.globalAlpha = 1;
      x.globalCompositeOperation = "source-over";
      /* facets */
      for (let f = 0; f < 26; f++) {
        x.beginPath();
        const fx = cx2 + (rnd() - 0.5) * rx * 2,
          fy = cy + (rnd() - 0.5) * ry * 1.6;
        x.moveTo(fx, fy);
        for (let v = 0; v < 3; v++)
          x.lineTo(
            fx + (rnd() - 0.5) * rx * 0.8,
            fy + (rnd() - 0.5) * ry * 0.6,
          );
        x.closePath();
        x.fillStyle =
          rnd() > 0.5 ? "rgba(255,255,255,.030)" : "rgba(0,0,0,.14)";
        x.fill();
      }
      /* wet highlight along the upper rim */
      x.lineWidth = 3 + rnd() * 4;
      x.strokeStyle = "rgba(178,206,206,.20)";
      x.beginPath();
      for (let a = 0; a <= 60; a++) {
        const t = Math.PI + (a / 60) * Math.PI * 0.78;
        const k =
          1 +
          0.17 *
            fbm(n, Math.cos(t) * 1.7 + bi * 9, Math.sin(t) * 1.7, 4, 2.1, 0.55);
        const px = cx2 + Math.cos(t) * rx * k * 0.97,
          py = cy + Math.sin(t) * ry * k * 0.97;
        void (a === 0 ? x.moveTo(px, py) : x.lineTo(px, py));
      }
      x.stroke();
      x.restore();
    });

    /* a little moss where they meet the ground */
    x.globalCompositeOperation = "source-atop";
    for (let i = 0; i < 2600; i++) {
      const px = rnd() * W,
        py = H - Math.pow(rnd(), 1.7) * H * 0.5;
      x.fillStyle =
        "rgba(" +
        ((40 + rnd() * 40) | 0) +
        "," +
        ((60 + rnd() * 46) | 0) +
        ",34," +
        (0.05 + rnd() * 0.22) +
        ")";
      x.fillRect(px, py, 1.6 + rnd() * 2.4, 3 + rnd() * 9);
    }
    const rb = x.createLinearGradient(W, 0, 0, 0);
    rb.addColorStop(0, "rgba(190,48,22,.16)");
    rb.addColorStop(0.7, "rgba(0,0,0,0)");
    x.fillStyle = rb;
    x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = "source-over";
    return c;
  }

  /* a maple bough leaning into the top of frame */
  function texBranchCutout(seed) {
    const W = 1536,
      H = 1024;
    const c = cvs(W, H),
      x = c.getContext("2d");
    const rnd = mulberry32(seed);
    const leaves = [];

    function bough(px, py, ang, len, wid, depth) {
      const steps = 7;
      let cx2 = px,
        cy = py,
        a = ang;
      x.beginPath();
      x.moveTo(cx2, cy);
      for (let s = 0; s < steps; s++) {
        a += (rnd() - 0.5) * 0.3;
        cx2 += (Math.cos(a) * len) / steps;
        cy += (Math.sin(a) * len) / steps;
        x.lineTo(cx2, cy);
      }
      x.lineCap = "round";
      x.lineWidth = wid;
      x.strokeStyle =
        "rgba(" +
        ((26 + depth * 5) | 0) +
        "," +
        ((22 + depth * 4) | 0) +
        "," +
        ((22 + depth * 4) | 0) +
        ",1)";
      x.stroke();
      if (depth < 4 && len > 34) {
        const k = depth === 0 ? 3 : 2;
        for (let i = 0; i < k; i++)
          bough(
            cx2,
            cy,
            a + (rnd() - 0.5) * 1.25,
            len * (0.58 + rnd() * 0.18),
            wid * 0.58,
            depth + 1,
          );
      } else {
        for (let i = 0; i < 9; i++)
          leaves.push([
            cx2 + (rnd() - 0.5) * 78,
            cy + (rnd() - 0.5) * 78,
            rnd() * TAU,
            12 + rnd() * 20,
            rnd(),
          ]);
      }
    }
    bough(W * 1.02, H * 0.06, Math.PI * 0.78, 420, 26, 0);
    bough(W * 0.86, -H * 0.02, Math.PI * 0.62, 330, 18, 1);

    const leafImg = texLeaf();
    const tint = cvs(128, 128),
      tx = tint.getContext("2d");
    leaves.forEach((l) => {
      tx.clearRect(0, 0, 128, 128);
      tx.drawImage(leafImg, 0, 0);
      tx.globalCompositeOperation = "source-in";
      const v = l[4];
      tx.fillStyle = hex(96 + v * 96, 14 + v * 22, 16 + v * 18);
      tx.fillRect(0, 0, 128, 128);
      tx.globalCompositeOperation = "source-over";
      x.save();
      x.translate(l[0], l[1]);
      x.rotate(l[2]);
      x.globalAlpha = 0.78 + v * 0.22;
      x.drawImage(tint, -l[3], -l[3], l[3] * 2, l[3] * 2);
      x.restore();
    });
    x.globalAlpha = 1;
    return c;
  }
  /* ================================================================= 4 · gl */
  const canvas = options.canvas;
  /* The layout viewport, not the window. On mobile `innerWidth` follows the
   initial containing block, which can run wider than the visual viewport —
   measured at 437 against a 390 screen — while `clientWidth` tracks what CSS
   actually lays out against. Sizing the canvas from `innerWidth` therefore
   renders a frame wider than the phone shows and drops the right edge of the
   scene off-screen, which is how the wordmark lost its last letter. Every
   size, aspect and pointer mapping below goes through these. */
  const vpW = () => document.documentElement.clientWidth || innerWidth;
  const vpH = () => document.documentElement.clientHeight || innerHeight;
  let renderer,
    scene,
    camera,
    maxAniso = 1;
  const HI = qs("q", COARSE ? "low" : "high");
  const LOW = HI === "low";
  const WANT_POST = qs("post", "1") !== "0";
  const WANT_SHADOW = qs("shadow", LOW ? "0" : "1") !== "0";
  const DPR_CAP = qn("dpr", LOW ? 1.4 : 1.8);
  /* the renderer trades resolution for frame rate on its own — the scene is
   fill-bound (five big alpha-blended veils plus a bloom chain), so pixels
   are the only knob worth turning on unknown hardware */
  const PERF = { scale: 1, acc: 0, n: 0, locked: qs("adapt", "1") === "0" };

  function initGL() {
    if (qs("nogl", "0") !== "0" || !window.THREE)
      throw new Error("webgl disabled");
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: !WANT_POST,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_CAP));
    /* updateStyle stays on: the stylesheet sizes the canvas at 100% of the
     initial containing block, which is the very box that runs wide on a
     phone. Writing the CSS size in pixels pins the element to the layout
     viewport the buffer was built for. */
    renderer.setSize(vpW(), vpH(), true);
    renderer.outputEncoding = WANT_POST
      ? THREE.LinearEncoding
      : THREE.sRGBEncoding;
    renderer.toneMapping = WANT_POST
      ? THREE.NoToneMapping
      : THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x05070a, 1);
    if (WANT_SHADOW) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    maxAniso = renderer.capabilities.getMaxAnisotropy();
    scene = new THREE.Scene();
    /* Density puts the hall back in the air; the colour is what decides how
     dark it is back there. At this depth most of the building's pixel is
     fog rather than its own material — darkening the timber and the tiles
     moved the hall by 0.18 of a luminance unit, the fog colour moves it
     properly. And it reaches by distance, so the foreground does not
     follow it down. */
    scene.fog = new THREE.FogExp2(0x050a0e, 0.0168);
    scene.background = new THREE.Color(0x060a0d);
    camera = new THREE.PerspectiveCamera(36, vpW() / vpH(), 0.35, 220);
    scene.add(camera);
  }

  function tx(canvasEl, o) {
    o = o || {};
    const t = new THREE.CanvasTexture(canvasEl);
    t.wrapS = t.wrapT = o.wrap || THREE.ClampToEdgeWrapping;
    if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
    t.anisotropy = Math.min(o.aniso || 8, maxAniso);
    if (o.srgb !== false) t.encoding = THREE.sRGBEncoding;
    t.needsUpdate = true;
    return t;
  }
  /* HDR-bright emitters: values above 1 survive because the scene is rendered
   into a half-float buffer, and they are what the bloom feeds on */
  const hdr = (r, g, b) => new THREE.Color().setRGB(r, g, b);

  /* A {map, normal, rough} set hung on a standard material at one tiling. The
   colour is a multiplier on an already-dark albedo, so it is how a shared
   board or block library is re-tinted per use rather than regenerated.
   roughness stays at 1: the map carries the variation, and anything less
   scales the whole surface toward a polish it should not have. */
  function surface(t, rep, o) {
    o = o || {};
    const wrap = THREE.RepeatWrapping,
      aniso = o.aniso || 8;
    const m = new THREE.MeshStandardMaterial({
      map: tx(t.map, { wrap: wrap, repeat: rep, aniso: aniso }),
      normalMap: tx(t.normal, {
        wrap: wrap,
        repeat: rep,
        srgb: false,
        aniso: aniso,
      }),
      normalScale: new THREE.Vector2(
        o.normal === undefined ? 0.8 : o.normal,
        o.normal === undefined ? 0.8 : o.normal,
      ),
      color: o.color === undefined ? 0xffffff : o.color,
      roughness: o.roughness === undefined ? 1 : o.roughness,
      metalness: o.metalness === undefined ? 0.02 : o.metalness,
    });
    if (t.rough)
      m.roughnessMap = tx(t.rough, { wrap: wrap, repeat: rep, srgb: false });
    return m;
  }
  /* The board and block libraries are generated once and shared. buildLantern
   alone is called six times, and a granite per lantern is six pointless
   canvases and six normal-map passes at load. */
  const LIB = {};
  const lib = (k, f) => LIB[k] || (LIB[k] = f());
  /* the walls are boarded; a column, a sill and a rail are each one stick of
   wood and must not carry a joint down the middle of them */
  const wallWood = () => lib("wallWood", () => texWood(3, { boards: 7 }));
  const postWood = () => lib("postWood", () => texWood(29, { boards: 0 }));

  /* sweep a polygonal cross-section along a path — kasagi, shimaki, beams */
  function sweepPoly(points, profile) {
    const segs = points.length,
      np = profile.length;
    const pos = [],
      nor = [],
      uv = [],
      idx = [];
    const T = new THREE.Vector3(),
      N = new THREE.Vector3(),
      B = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < segs; i++) {
      const p = points[i],
        a = points[Math.max(0, i - 1)],
        b = points[Math.min(segs - 1, i + 1)];
      T.subVectors(b, a).normalize();
      B.crossVectors(T, up).normalize();
      N.crossVectors(B, T).normalize();
      for (let j = 0; j < np; j++) {
        const u = profile[j][0],
          v = profile[j][1],
          l = Math.hypot(u, v) || 1;
        pos.push(
          p.x + B.x * u + N.x * v,
          p.y + B.y * u + N.y * v,
          p.z + B.z * u + N.z * v,
        );
        nor.push(
          (B.x * u) / l + (N.x * v) / l,
          (B.y * u) / l + (N.y * v) / l,
          (B.z * u) / l + (N.z * v) / l,
        );
        uv.push(j / np, i / (segs - 1));
      }
    }
    for (let i = 0; i < segs - 1; i++)
      for (let j = 0; j < np; j++) {
        const j2 = (j + 1) % np,
          a = i * np + j,
          b = i * np + j2,
          c = (i + 1) * np + j2,
          d = (i + 1) * np + j;
        idx.push(a, b, c, a, c, d);
      }
    /* caps */
    [0, segs - 1].forEach((ring, k) => {
      const base = pos.length / 3,
        p = points[ring];
      pos.push(p.x, p.y, p.z);
      nor.push(0, 0, k ? 1 : -1);
      uv.push(0.5, 0.5);
      for (let j = 0; j < np; j++) {
        const a = ring * np + j,
          b = ring * np + ((j + 1) % np);
        void (k ? idx.push(base, a, b) : idx.push(base, b, a));
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }
  /* A temple roof. The height is a concave function of the Chebyshev distance
   from the ridge out to the eave, and the last fifth of that run flares back
   upward — that lift at the corners is the whole silhouette. Emitted solid:
   a top shell, an underside shell, and a fascia stitching the two rims. */
  function roofGeo(A, B, R, Hr, thick, flare) {
    const NX = 52,
      NZ = 34,
      FL = flare === undefined ? 0.3 : flare,
      e = 1e-3;
    /* The lift has to be weighted toward the corners. Applied evenly along the
     eave it produces a raised rim the whole way round and the roof reads as a
     saucer; concentrated where the two runs meet, it reads as a temple. */
    const hAt = (x, z) => {
      const cx = Math.min(1, Math.abs(x) / A),
        cz = Math.min(1, Math.abs(z) / B);
      const tx = Math.max(0, (Math.abs(x) - R) / Math.max(A - R, 1e-4));
      const t = Math.min(1, Math.max(tx, cz));
      return (
        Hr * Math.pow(1 - t, 1.45) +
        FL * Hr * smooth(0.72, 1, t) * (0.52 + 0.68 * Math.min(cx, cz))
      );
    };
    const pos = [],
      nor = [],
      uv = [],
      idx = [];
    const N = new THREE.Vector3();
    const VPS = (NX + 1) * (NZ + 1);
    for (let k = 0; k < 2; k++) {
      for (let j = 0; j <= NZ; j++)
        for (let i = 0; i <= NX; i++) {
          const x = -A + (2 * A * i) / NX,
            z = -B + (2 * B * j) / NZ;
          N.set(
            -(hAt(x + e, z) - hAt(x - e, z)) / (2 * e),
            1,
            -(hAt(x, z + e) - hAt(x, z - e)) / (2 * e),
          ).normalize();
          if (k) N.negate();
          pos.push(x, hAt(x, z) - (k ? thick : 0), z);
          nor.push(N.x, N.y, N.z);
          /* one tile every seven metres: at half a metre the ribs land inside a
         pixel at this range and the mip chain averages them to flat grey */
          uv.push(x * 0.14, z * 0.14);
        }
      for (let j = 0; j < NZ; j++)
        for (let i = 0; i < NX; i++) {
          const a = k * VPS + j * (NX + 1) + i,
            b = a + 1,
            c = a + NX + 2,
            d = a + NX + 1;
          void (k ? idx.push(a, c, b, a, d, c) : idx.push(a, b, c, a, c, d));
        }
    }
    /* fascia: its own ring of vertices so the eave edge keeps a sideways normal */
    const per = [];
    for (let i = 0; i <= NX; i++) per.push([i, 0]);
    for (let j = 1; j <= NZ; j++) per.push([NX, j]);
    for (let i = NX - 1; i >= 0; i--) per.push([i, NZ]);
    for (let j = NZ - 1; j >= 1; j--) per.push([0, j]);
    const base = pos.length / 3;
    per.forEach((p) => {
      const x = -A + (2 * A * p[0]) / NX,
        z = -B + (2 * B * p[1]) / NZ;
      const nx = p[0] === 0 ? -1 : p[0] === NX ? 1 : 0;
      const nz = p[1] === 0 ? -1 : p[1] === NZ ? 1 : 0;
      const l = Math.hypot(nx, nz) || 1;
      const y = hAt(x, z);
      pos.push(x, y, z, x, y - thick, z);
      nor.push(nx / l, 0, nz / l, nx / l, 0, nz / l);
      uv.push(0, 0, 0, 1);
    });
    for (let i = 0; i < per.length; i++) {
      const a = base + i * 2,
        b = a + 1;
      const c = base + ((i + 1) % per.length) * 2,
        d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }

  function mergeGeos(list) {
    let vN = 0,
      iN = 0;
    list.forEach((g) => {
      vN += g.attributes.position.count;
      iN += g.index.count;
    });
    const pos = new Float32Array(vN * 3),
      nor = new Float32Array(vN * 3),
      uv = new Float32Array(vN * 2);
    const idx = vN > 65535 ? new Uint32Array(iN) : new Uint16Array(iN);
    let vo = 0,
      io = 0;
    list.forEach((g) => {
      pos.set(g.attributes.position.array, vo * 3);
      nor.set(g.attributes.normal.array, vo * 3);
      uv.set(g.attributes.uv.array, vo * 2);
      const gi = g.index.array;
      for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
      io += gi.length;
      vo += g.attributes.position.count;
      g.dispose();
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    return out;
  }

  /* ========================================================== 5 · the world */
  const WORLD = {}; /* named handles the page can animate */

  /* ---- the site plan, in metres ----------------------------------------
   Everything downstream — camera waypoints, lantern rows, the moon — is
   pinned to these, so the approach can be re-proportioned in one place. */
  const PODIUM = 7.0; /* how far the hall stands above the court */
  const STEPS = 40;
  const STAIR_Z0 = -11.0; /* the bottom riser                        */
  const STAIR_RUN = 0.55; /* → the flight tops out at z = −33        */
  const STAIR_W = 8.4;
  const TEMPLE_Z = -44; /* the hall's centre line                   */

  function buildShell() {
    const wallT = texWall();
    const wallMap = tx(wallT.map, {
      wrap: THREE.RepeatWrapping,
      repeat: [4, 1.4],
    });
    const wallNrm = tx(wallT.normal, {
      wrap: THREE.RepeatWrapping,
      repeat: [4, 1.4],
      srgb: false,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallMap,
      normalMap: wallNrm,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.78,
      metalness: 0.05,
      color: 0x525c60,
    });
    /* The court used to be a roofless box. It is now an open mountain approach:
     nothing encloses the frame but the night, the ridge and the fog. */

    /* the sky, hung far enough back that the whole frustum sits inside it */
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(360, 190),
      new THREE.MeshBasicMaterial({
        color: hdr(0.6, 0.7, 0.8),
        map: tx(texSky()),
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    );
    sky.position.set(0, 62, -108);
    sky.renderOrder = 0;
    scene.add(sky);
    WORLD.sky = sky;

    /* the wooded ridge that closes the valley — three-quarters eaten by fog,
     which is the only reason the ground plane can just stop out there */
    /* z, centre y, width, height, x — kept low: a crest that climbs past the
     hall's eaves stops reading as distance and starts reading as a cut-out */
    const ridgeMap = tx(texRidge(), {
      wrap: THREE.RepeatWrapping,
      repeat: [1.7, 1],
    });
    [
      [-90, 13, 300, 26, 0],
      [-63, 9.5, 210, 19, 16],
    ].forEach((r, i) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(r[2], r[3]),
        /* fog off: at a hundred metres it would lift a black silhouette to 80%
         of the fog colour, and the treeline came back as a *pale* band */
        new THREE.MeshBasicMaterial({
          map: i ? tx(texRidge()) : ridgeMap,
          transparent: true,
          color: i ? 0x0a1015 : 0x06090d,
          depthWrite: false,
          fog: false,
        }),
      );
      m.position.set(r[4], r[1], r[0]);
      m.renderOrder = 1;
      scene.add(m);
    });

    /* floor + podium */
    const fT = texFloor();
    const floorMat = new THREE.MeshStandardMaterial({
      map: tx(fT.map, {
        wrap: THREE.RepeatWrapping,
        repeat: [7, 7],
        aniso: 16,
      }),
      normalMap: tx(fT.normal, {
        wrap: THREE.RepeatWrapping,
        repeat: [7, 7],
        srgb: false,
        aniso: 16,
      }),
      roughnessMap: tx(fT.rough, {
        wrap: THREE.RepeatWrapping,
        repeat: [3.4, 3.4],
        srgb: false,
      }),
      normalScale: new THREE.Vector2(0.3, 0.3),
      /* The court used to carry a planar mirror and this was tuned to feed it —
       near-polished, and metal enough to hold a reflection. With the mirror
       gone those numbers only made the paving read as sheet metal, so it goes
       back to being wet stone: rough, barely metallic, and lit rather than
       reflecting. */
      roughness: 0.74,
      metalness: 0.06,
      color: 0x69757a,
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -18);
    floor.receiveShadow = true;
    scene.add(floor);
    WORLD.floor = floor;
    WORLD.floorMat = floorMat;

    /* The podium and the flight use their own material: the mirror shader below
     is only ever attached to the water-level floor, and sharing it would make
     the reflection buffer sample itself. It is also deliberately matte — with
     the floor's metalness the forty risers strobed as the camera drifted. */
    const platMat = new THREE.MeshStandardMaterial({
      map: tx(fT.map, {
        wrap: THREE.RepeatWrapping,
        repeat: [3, 1.2],
        aniso: 16,
      }),
      normalMap: tx(fT.normal, {
        wrap: THREE.RepeatWrapping,
        repeat: [3, 1.2],
        srgb: false,
        aniso: 16,
      }),
      normalScale: new THREE.Vector2(0.18, 0.18),
      roughness: 0.93,
      metalness: 0.02,
      color: 0x58636a,
    });
    /* the podium the hall stands on */
    const plat = new THREE.Mesh(new THREE.BoxGeometry(42, PODIUM, 24), platMat);
    plat.position.set(0, PODIUM / 2, -45);
    plat.receiveShadow = true;
    plat.castShadow = true;
    scene.add(plat);
    const cope = new THREE.Mesh(new THREE.BoxGeometry(43, 0.34, 25), wallMat);
    cope.position.set(0, PODIUM - 0.17, -45);
    cope.receiveShadow = true;
    scene.add(cope);

    /* The flight. Twenty-six risers merged into one buffer — as separate meshes
     it is twenty-six draw calls for a shape nobody ever gets close to. */
    const treads = [],
      cheeks = [];
    for (let i = 0; i < STEPS; i++) {
      const y = (i + 1) * (PODIUM / STEPS),
        z = STAIR_Z0 - (i + 0.5) * STAIR_RUN;
      const w = STAIR_W + (STEPS - i) * 0.052; /* splayed at the foot */
      treads.push(
        new THREE.BoxGeometry(
          w,
          PODIUM / STEPS + 0.04,
          STAIR_RUN + 0.04,
        ).translate(0, y - PODIUM / STEPS / 2, z),
      );
      [-1, 1].forEach((s) =>
        cheeks.push(
          new THREE.BoxGeometry(0.9, 1.5, STAIR_RUN + 0.06).translate(
            s * (w / 2 + 0.45),
            y - 0.3,
            z,
          ),
        ),
      );
    }
    const stair = new THREE.Mesh(mergeGeos(treads), platMat);
    stair.receiveShadow = true;
    stair.castShadow = true;
    scene.add(stair);
    const rail = new THREE.Mesh(mergeGeos(cheeks), wallMat);
    rail.receiveShadow = true;
    rail.castShadow = true;
    scene.add(rail);
  }

  /* ------------------------------------------------------- the worship hall
   A two-storey Sanmon on the podium at the head of the flight: charred
   timber, two flaring tiled roofs, a bracket band under each eave, and a
   ground floor lit from inside so the lattice reads as the only warm thing
   for two hundred metres.                                                 */
  function buildTemple() {
    const g = new THREE.Group();
    /* One board library, sampled at two scales: the hall's flanks want the grain
     long and lying down, the columns want it running their own length. */
    const timber = surface(wallWood(), [4, 1.6], {
      color: 0x565150,
      normal: 1.5,
    });
    const post = surface(postWood(), [1.1, 1.0], {
      color: 0x8a746d,
      normal: 1.05,
      metalness: 0.03,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: 0x8f6f2e,
      roughness: 0.38,
      metalness: 0.78,
    });
    const rf = lib("roof", () => texRoof());
    /* Nearly a silhouette: the roof carries almost no colour of its own, and
     what reads on it is relief rather than tone — so the normal goes up as
     the albedo comes down. */
    const tileMat = surface(rf, [1, 1], {
      color: 0x2b343a,
      roughness: 0.74,
      metalness: 0.1,
      normal: 1.4,
    });
    /* the paper the lamps burn through — the only thing in the hall that is
     allowed to be bright, and even then only just above white */
    const paper = new THREE.MeshBasicMaterial({
      color: hdr(1.06, 0.48, 0.18),
      fog: true,
      toneMapped: false,
    });
    const grid = new THREE.MeshBasicMaterial({
      map: tx(texShoji()),
      transparent: true,
      depthWrite: false,
      fog: true,
    });
    WORLD.paper = paper;

    /* one lit bay: a glowing sheet with a lattice hung just in front of it */
    function bay(w, h, x, y, z) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paper);
      p.position.set(x, y, z);
      g.add(p);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), grid);
      s.position.set(x, y, z + 0.06);
      s.renderOrder = 3;
      g.add(s);
    }
    /* The block-and-arm band that carries every eave. The pieces are merged, so
     they carry absolute coordinates — TEMPLE_Z has to go in here, not on the
     mesh, or the whole band ends up hanging in the air by the camera. */
    function brackets(halfW, halfD, y, step) {
      const parts = [];
      for (let x = -halfW; x <= halfW + 1e-3; x += step) {
        [-halfD, halfD].forEach((dz) => {
          parts.push(
            new THREE.BoxGeometry(0.34, 0.46, 0.34).translate(
              x,
              y,
              TEMPLE_Z + dz,
            ),
          );
          parts.push(
            new THREE.BoxGeometry(0.92, 0.17, 0.24).translate(
              x,
              y + 0.3,
              TEMPLE_Z + dz,
            ),
          );
        });
      }
      for (let dz = -halfD + step; dz < halfD - 1e-3; dz += step) {
        [-halfW, halfW].forEach((x) => {
          parts.push(
            new THREE.BoxGeometry(0.34, 0.46, 0.34).translate(
              x,
              y,
              TEMPLE_Z + dz,
            ),
          );
          parts.push(
            new THREE.BoxGeometry(0.24, 0.17, 0.92).translate(
              x,
              y + 0.3,
              TEMPLE_Z + dz,
            ),
          );
        });
      }
      const m = new THREE.Mesh(mergeGeos(parts), post);
      m.castShadow = false;
      g.add(m);
    }

    const F = PODIUM; /* the hall's floor level */

    /* ---- ground storey: six bays of lit lattice between charred columns --- */
    const core = new THREE.Mesh(new THREE.BoxGeometry(13.6, 5.0, 8.2), timber);
    core.position.set(0, F + 2.5, TEMPLE_Z);
    core.castShadow = true;
    g.add(core);
    for (let i = 0; i < 5; i++) {
      const x = -5.6 + i * 2.8;
      bay(1.55, 2.5, x, F + 2.6, TEMPLE_Z + 4.16);
    }
    for (let i = 0; i < 6; i++) {
      const c = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.34, 5.0, 14),
        post,
      );
      c.position.set(-7.0 + i * 2.8, F + 2.5, TEMPLE_Z + 4.24);
      c.castShadow = true;
      g.add(c);
    }
    const sill = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.4, 8.9), post);
    sill.position.set(0, F + 0.2, TEMPLE_Z);
    g.add(sill);
    brackets(7.0, 4.4, F + 5.15, 1.4);

    /* ---- the pent roof over the ground storey ---------------------------- */
    const lower = new THREE.Mesh(
      roofGeo(9.6, 6.4, 3.2, 2.9, 0.4, 0.26),
      tileMat,
    );
    lower.position.set(0, F + 5.6, TEMPLE_Z);
    lower.castShadow = true;
    g.add(lower);

    /* ---- upper storey: railed gallery, dark boards, the temple's name ----- */
    const up = new THREE.Mesh(new THREE.BoxGeometry(10.0, 3.4, 6.0), timber);
    up.position.set(0, F + 9.4, TEMPLE_Z);
    up.castShadow = true;
    g.add(up);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.26, 8.4), post);
    deck.position.set(0, F + 7.72, TEMPLE_Z);
    g.add(deck);
    [0.1, 0.94].forEach((dy) =>
      [4.2, -4.2].forEach((dz) => {
        const r = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.17, 0.17), post);
        r.position.set(0, F + 7.85 + dy, TEMPLE_Z + dz);
        g.add(r);
      }),
    );
    for (let i = 0; i <= 16; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), post);
      b.position.set(-6.2 + i * 0.775, F + 8.42, TEMPLE_Z + 4.2);
      g.add(b);
    }
    for (let i = 0; i < 4; i++)
      bay(1.0, 1.35, -4.5 + i * 3.0, F + 9.5, TEMPLE_Z + 3.06);
    /* the plaque */
    const plq = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.3, 0.16), gold);
    plq.position.set(0, F + 9.7, TEMPLE_Z + 3.12);
    g.add(plq);
    const plqIn = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 0.98, 0.18),
      timber,
    );
    plqIn.position.set(0, F + 9.7, TEMPLE_Z + 3.16);
    g.add(plqIn);
    brackets(5.2, 3.3, F + 11.2, 1.3);

    /* ---- the main roof: the silhouette the whole page hangs on ----------- */
    const upper = new THREE.Mesh(
      roofGeo(10.8, 7.2, 3.6, 5.2, 0.48, 0.26),
      tileMat,
    );
    upper.position.set(0, F + 11.7, TEMPLE_Z);
    upper.castShadow = true;
    g.add(upper);
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(7.6, 0.6, 1.05),
      tileMat,
    );
    ridge.position.set(0, F + 17.1, TEMPLE_Z);
    g.add(ridge);
    [-1, 1].forEach((s) => {
      const oni = new THREE.Mesh(
        new THREE.ConeGeometry(0.46, 1.15, 4),
        tileMat,
      );
      oni.position.set(s * 3.9, F + 17.6, TEMPLE_Z);
      oni.rotation.y = Math.PI / 4;
      g.add(oni);
    });
    WORLD.templeTop = F + 18.2;

    /* ---- the two flanking wings, lit the same way ------------------------ */
    [-1, 1].forEach((s) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(7.6, 3.4, 5.2), timber);
      w.position.set(s * 10.6, F + 1.7, TEMPLE_Z + 1.4);
      w.castShadow = true;
      g.add(w);
      for (let i = 0; i < 3; i++)
        bay(1.3, 1.6, s * 10.6 + (i - 1) * 2.4, F + 1.8, TEMPLE_Z + 4.06);
      const r = new THREE.Mesh(
        roofGeo(5.0, 4.0, 1.4, 1.9, 0.32, 0.26),
        tileMat,
      );
      r.position.set(s * 10.6, F + 3.4, TEMPLE_Z + 1.4);
      r.castShadow = true;
      g.add(r);
    });

    scene.add(g);
    WORLD.temple = g;

    /* the glow the hall pushes out over its own steps */
    const spill = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 16),
      new THREE.MeshBasicMaterial({
        map: tx(texGlow("rgba(255,150,66,.80)", "rgba(240,96,26,.24)")),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        opacity: 0.3,
      }),
    );
    spill.position.set(0, F + 3.0, TEMPLE_Z + 5.6);
    spill.renderOrder = 2;
    scene.add(spill);
    WORLD.hallHalo = spill;

    /* the band of mist that separates the hall from the trees behind it — the
     one thing that stops the whole background reading as a single flat cut-out */
    const mist = new THREE.Mesh(
      new THREE.PlaneGeometry(64, 20),
      new THREE.MeshBasicMaterial({
        map: tx(texGlow("rgba(150,178,190,.62)", "rgba(104,138,154,.20)")),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        opacity: 0.17,
      }),
    );
    mist.position.set(0, F - 1.4, TEMPLE_Z + 10);
    mist.renderOrder = 2;
    scene.add(mist);
  }

  /* --------------------------------------------------- the vermilion moon
   Hung well behind the hall so the roof crosses its lower left — near
   enough to the ridge to sit in the mist, far enough that it never moves
   against the buildings when the rig drifts.                             */
  const MOON = { x: 17.9, y: 31.9, z: -72, r: 8.6 };
  function buildMoon() {
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(MOON.r * 2, MOON.r * 2),
      /* The whole blood-moon grade lives here, on a near-neutral albedo. The
       plate measures G/R ≈ B/R ≈ .48, but that is a *display* ratio: the map
       is decoded out of sRGB before this multiplies it, so the tint has to be
       written in linear, where the same look is ≈ .21. Reading the ratio
       straight off the reference is what left the moon a pale pink. */
      new THREE.MeshBasicMaterial({
        map: tx(texMoon()),
        color: hdr(3.6, 0.64, 0.61),
        transparent: true,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    );
    disc.position.set(MOON.x, MOON.y, MOON.z);
    disc.renderOrder = 1;
    scene.add(disc);
    WORLD.moon = disc;

    /* the air around it — a wide, weak corona that the bloom picks up */
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(MOON.r * 6.4, MOON.r * 6.4),
      new THREE.MeshBasicMaterial({
        map: tx(texGlow("rgba(255,124,112,.90)", "rgba(206,52,48,.26)")),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        opacity: 0.44,
      }),
    );
    halo.position.set(MOON.x, MOON.y, MOON.z - 0.3);
    halo.renderOrder = 0;
    scene.add(halo);
    WORLD.moonHalo = halo;
  }
  /* On a tall frame the rig steps back and its horizontal reach narrows, which
   would slide the moon off the right edge — draw it in by the same amount. */
  function placeMoon() {
    if (!WORLD.moon) return;
    const x = MOON.x * (1 - 0.4 * aspectFix());
    WORLD.moon.position.x = x;
    WORLD.moonHalo.position.x = x;
  }

  function buildTorii() {
    /* the weathering costs the gate a lot of its chroma, so the tint puts it
     back: red lifted well past green and blue rather than a flat brightening,
     or the vermilion comes out of the grade as brick */
    const lac = surface(
      lib("lacquer", () => texLacquer()),
      [2, 2],
      {
        color: hdr(1.72, 1.02, 0.94),
        roughness: 0.92,
        metalness: 0.05,
        normal: 0.75,
      },
    );
    const gold = new THREE.MeshStandardMaterial({
      color: 0x7a5d2a,
      roughness: 0.5,
      metalness: 0.6,
    });
    const g = new THREE.Group();
    const BASE = 0.78,
      H = 8.2,
      SPAN = 3.55;

    [-1, 1].forEach((s) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.38, H, 26),
        lac,
      );
      col.position.set(s * SPAN, BASE + H / 2, 0);
      col.castShadow = true;
      g.add(col);
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.5, 0.52, 26),
        gold,
      );
      foot.position.set(s * SPAN, BASE + 0.26, 0);
      foot.castShadow = true;
      g.add(foot);
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.345, 0.345, 0.26, 26),
        gold,
      );
      collar.position.set(s * SPAN, BASE + H - 1.42, 0);
      g.add(collar);
      /* the ornate bracket where the beams cross the column */
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.3, 0.86), gold);
      br.position.set(s * SPAN, BASE + H - 0.72, 0);
      g.add(br);
      const br2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.52, 0.6), gold);
      br2.position.set(s * SPAN, BASE + H - 0.34, 0);
      g.add(br2);
      [-1, 1].forEach((d) => {
        const wing = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.7, 0.18),
          gold,
        );
        wing.position.set(s * SPAN + d * 0.4, BASE + H - 0.62, 0.3);
        g.add(wing);
        const wing2 = wing.clone();
        wing2.position.z = -0.3;
        g.add(wing2);
      });
    });

    /* nuki — the straight beam that pierces the columns */
    const nuki = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.52, 0.46), lac);
    nuki.position.set(0, BASE + H - 2.15, 0);
    nuki.castShadow = true;
    g.add(nuki);

    /* gakuzuka — the little strut at the centre */
    const gak = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.22, 0.4), lac);
    gak.position.set(0, BASE + H + 0.1, 0);
    g.add(gak);
    const gakG = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.5), gold);
    gakG.position.set(0, BASE + H + 0.68, 0);
    g.add(gakG);

    /* shimaki + kasagi — the two crowning beams, swept upward at the ends */
    function beamPath(half, rise, power) {
      const p = [];
      for (let i = 0; i <= 26; i++) {
        const u = (i / 26) * 2 - 1;
        p.push(
          new THREE.Vector3(u * half, Math.pow(Math.abs(u), power) * rise, 0),
        );
      }
      return p;
    }
    const shimaki = new THREE.Mesh(
      sweepPoly(beamPath(5.05, 0.4, 2.6), [
        [-0.3, -0.19],
        [0.3, -0.19],
        [0.32, 0.06],
        [0.28, 0.21],
        [-0.28, 0.21],
        [-0.32, 0.06],
      ]),
      lac,
    );
    shimaki.position.set(0, BASE + H - 0.52, 0);
    shimaki.castShadow = true;
    g.add(shimaki);

    const kasagi = new THREE.Mesh(
      sweepPoly(beamPath(5.85, 0.62, 2.4), [
        [-0.42, -0.24],
        [0.42, -0.24],
        [0.46, 0.04],
        [0.3, 0.28],
        [-0.3, 0.28],
        [-0.46, 0.04],
      ]),
      lac,
    );
    kasagi.position.set(0, BASE + H + 0.96, 0);
    kasagi.castShadow = true;
    g.add(kasagi);
    /* a black lacquer cap along the top of the kasagi */
    const cap = new THREE.Mesh(
      sweepPoly(beamPath(5.95, 0.62, 2.4), [
        [-0.48, 0.22],
        [0.48, 0.22],
        [0.48, 0.34],
        [-0.48, 0.34],
      ]),
      new THREE.MeshStandardMaterial({
        color: 0x120c0c,
        roughness: 0.42,
        metalness: 0.14,
      }),
    );
    cap.position.set(0, BASE + H + 0.96, 0);
    g.add(cap);

    /* the gate stands at the foot of the flight, not over the court — small
     enough that the hall keeps the top of the frame to itself */
    /* The lowest thing on the gate is the foot of each column, and it starts
     at BASE — so anchoring the group at y=0 left the whole torii hanging
     BASE*scale above the court. Drop it by exactly that and the feet land. */
    const GS = 0.72;
    g.position.set(0, -BASE * GS, -8.6);
    g.scale.setScalar(GS);
    scene.add(g);
    WORLD.torii = g;
  }

  function buildLantern(x, z, s, y) {
    const stone = lib("lanternStone", () =>
      surface(
        lib("granite", () => texStone(17)),
        [1.5, 1.5],
        { color: 0x9aa5a5, metalness: 0, normal: 1.45 },
      ),
    );
    const dark = lib("lanternDark", () =>
      surface(postWood(), [0.9, 0.9], {
        color: 0xd8c2b6,
        metalness: 0.1,
        normal: 0.7,
      }),
    );
    const g = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.44, 0.52, 0.26, 20),
      stone,
    );
    base.position.y = 0.13;
    base.castShadow = true;
    g.add(base);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 1.02, 16),
      stone,
    );
    post.position.y = 0.77;
    post.castShadow = true;
    g.add(post);
    const shelf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.34, 0.13, 20),
      stone,
    );
    shelf.position.y = 1.34;
    shelf.castShadow = true;
    g.add(shelf);

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), dark);
    box.position.y = 1.66;
    box.castShadow = true;
    g.add(box);
    const paneMat = new THREE.MeshBasicMaterial({
      color: hdr(2.3, 0.3, 0.085),
      fog: false,
      toneMapped: false,
    });
    [
      [0, 0, 0.256, 0],
      [0, 0, -0.256, Math.PI],
      [0.256, 0, 0, Math.PI / 2],
      [-0.256, 0, 0, -Math.PI / 2],
    ].forEach((p) => {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), paneMat);
      pane.position.set(p[0], 1.66, p[2]);
      pane.rotation.y = p[3];
      g.add(pane);
    });
    WORLD.lanternPane = WORLD.lanternPane || paneMat;

    const roof = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.62, 0.34, 4, 1),
      stone,
    );
    roof.position.y = 2.06;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.66, 0.7, 0.07, 4, 1),
      stone,
    );
    brim.position.y = 1.93;
    brim.rotation.y = Math.PI / 4;
    g.add(brim);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), stone);
    knob.position.y = 2.28;
    g.add(knob);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 10), stone);
    tip.position.y = 2.4;
    g.add(tip);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 3.4),
      new THREE.MeshBasicMaterial({
        map: tx(texGlow("rgba(255,120,60,.9)", "rgba(255,60,24,.28)")),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        opacity: 0.5,
      }),
    );
    glow.position.y = 1.66;
    glow.renderOrder = 2;
    g.add(glow);
    glow.userData.billboard = true;

    const lt = new THREE.PointLight(0xff5a24, 2.6, 9, 2);
    lt.position.set(0, 1.66, 0);
    g.add(lt);
    WORLD.lanternLights = WORLD.lanternLights || [];
    WORLD.lanternLights.push(lt);
    WORLD.lanternGlows = WORLD.lanternGlows || [];
    WORLD.lanternGlows.push(glow);

    g.position.set(x, y || 0, z);
    g.scale.setScalar(s || 1);
    scene.add(g);
    return g;
  }

  function buildMaple(seed, x, z, scale) {
    const rnd = mulberry32(seed);
    const parts = [],
      tips = [];
    const M = new THREE.Matrix4(),
      Q = new THREE.Quaternion(),
      UP = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3(),
      pos = new THREE.Vector3();

    function seg(from, to, r0, r1) {
      dir.subVectors(to, from);
      const len = dir.length();
      dir.normalize();
      const geo = new THREE.CylinderGeometry(r1, r0, len, 6, 1, true);
      Q.setFromUnitVectors(UP, dir);
      pos.addVectors(from, to).multiplyScalar(0.5);
      M.compose(pos, Q, new THREE.Vector3(1, 1, 1));
      geo.applyMatrix4(M);
      parts.push(geo);
    }
    function branch(from, dirV, len, rad, depth) {
      const to = from.clone().addScaledVector(dirV, len);
      to.y += len * 0.1;
      seg(from, to, rad, rad * 0.68);
      if (depth >= 4 || len < 0.34) {
        tips.push(to.clone());
        return;
      }
      const n = depth < 2 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const d = dirV.clone();
        d.x += (rnd() - 0.5) * 1.25;
        d.z += (rnd() - 0.5) * 1.25;
        d.y += 0.3 + rnd() * 0.5;
        d.normalize();
        branch(to, d, len * (0.62 + rnd() * 0.16), rad * 0.66, depth + 1);
      }
    }
    const root = new THREE.Vector3(0, 0, 0);
    seg(root, new THREE.Vector3(0, 1.5, 0), 0.22, 0.16);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + rnd();
      branch(
        new THREE.Vector3(0, 1.5, 0),
        new THREE.Vector3(
          Math.cos(a) * 0.8,
          0.8,
          Math.sin(a) * 0.8,
        ).normalize(),
        1.45,
        0.155,
        0,
      );
    }
    const trunk = new THREE.Mesh(
      mergeGeos(parts),
      new THREE.MeshStandardMaterial({
        color: 0x171413,
        roughness: 0.94,
        metalness: 0.0,
        side: THREE.DoubleSide,
      }),
    );
    trunk.castShadow = true;

    const leafGeo = new THREE.PlaneGeometry(0.36, 0.36);
    const leafMat = new THREE.MeshStandardMaterial({
      map: tx(texLeaf()),
      color: 0x2b0406,
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      roughness: 0.86,
      metalness: 0,
      emissive: 0x080000,
      emissiveIntensity: 0.12,
    });
    const per = LOW ? 5 : 9;
    const inst = new THREE.InstancedMesh(leafGeo, leafMat, tips.length * per);
    const m4 = new THREE.Matrix4(),
      e = new THREE.Euler(),
      q2 = new THREE.Quaternion(),
      sc = new THREE.Vector3();
    let k = 0;
    tips.forEach((t) => {
      for (let i = 0; i < per; i++) {
        const p = new THREE.Vector3(
          t.x + (rnd() - 0.5) * 0.95,
          t.y + (rnd() - 0.5) * 0.8,
          t.z + (rnd() - 0.5) * 0.95,
        );
        e.set(rnd() * TAU, rnd() * TAU, rnd() * TAU);
        q2.setFromEuler(e);
        const s = 0.7 + rnd() * 0.75;
        sc.set(s, s, s);
        m4.compose(p, q2, sc);
        inst.setMatrixAt(k++, m4);
      }
    });
    inst.instanceMatrix.needsUpdate = true;
    inst.castShadow = false;
    inst.frustumCulled = false;

    const g = new THREE.Group();
    g.add(trunk);
    g.add(inst);
    g.position.set(x, 0, z);
    g.scale.setScalar(scale || 1);
    g.rotation.y = rnd() * TAU;
    scene.add(g);
    /* leaves breathe in the wind */
    leafMat.onBeforeCompile = (sh) => {
      sh.uniforms.uT = WORLD.uT;
      sh.vertexShader =
        "uniform float uT;\n" +
        sh.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\n" +
            "vec3 wp = (instanceMatrix * vec4(0.0,0.0,0.0,1.0)).xyz;\n" +
            "float ph = wp.x*1.7 + wp.z*1.3 + wp.y*.7;\n" +
            "transformed.x += sin(uT*1.35 + ph)*0.055;\n" +
            "transformed.z += cos(uT*1.05 + ph*1.3)*0.045;\n",
        );
    };
    return g;
  }

  function buildRocks() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x141a1c,
      roughness: 0.46,
      metalness: 0.1,
    });
    const rnd = mulberry32(404),
      n = noise2D(88);
    const spots = [
      [-6.2, -5.4, 0.95],
      [-7.4, -2.1, 0.7],
      [6.6, -7.2, 0.8],
      [8.0, -4.0, 1.05],
      [-9.0, -8.4, 1.15],
      [9.6, -9.2, 0.9],
      [3.4, -7.8, 0.55],
      [-3.2, -8.6, 0.6],
    ];
    spots.forEach((s, i) => {
      const geo = new THREE.IcosahedronGeometry(s[2], 2);
      const p = geo.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const vx = p.getX(v),
          vy = p.getY(v),
          vz = p.getZ(v);
        const d =
          1 + 0.34 * fbm(n, vx * 1.6 + i * 7, vz * 1.6 + vy, 3, 2.2, 0.5);
        p.setXYZ(v, vx * d, vy * d * 0.68, vz * d);
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat);
      m.position.set(s[0], s[2] * 0.3, s[1]);
      m.rotation.set(rnd(), rnd() * TAU, rnd() * 0.4);
      m.castShadow = true;
      m.receiveShadow = true;
      scene.add(m);
    });
  }

  /* ------------------------------- the transparent-PNG foreground layers */
  function cutoutMaterial(canvasEl, sway) {
    const mat = new THREE.MeshBasicMaterial({
      map: tx(canvasEl, { aniso: 16 }),
      transparent: true,
      depthWrite: true,
      alphaTest: 0.012,
      side: THREE.DoubleSide,
      fog: true,
      color: 0xffffff,
    });
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uT = WORLD.uT;
      sh.uniforms.uSway = { value: sway || 0.07 };
      sh.vertexShader =
        "uniform float uT;\nuniform float uSway;\n" +
        sh.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\n" +
            "float h = uv.y;\n" +
            "float ph = position.x*0.30 + float(gl_InstanceID)*0.0;\n" +
            "transformed.x += sin(uT*0.85 + ph)*uSway*h*h;\n" +
            "transformed.y += cos(uT*0.62 + ph*1.7)*uSway*0.35*h*h;\n",
        );
      /* These plates are drawn to the edge of their own canvas — the grass runs
       straight off the left and the bottom — so every sheet ends on a hard
       straight line wherever its plane stops. Feathering the alpha at the
       edges lets each one dissolve into the scene instead of being cut out of
       it. Sides get the widest margin because that is where a bank of grass
       is read as ending; the crest needs none, the blades already taper. */
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <alphatest_fragment>",
        "float feX = smoothstep(0.0, 0.11, vUv.x) * (1.0 - smoothstep(0.89, 1.0, vUv.x));\n" +
          "float feY = smoothstep(0.0, 0.07, vUv.y);\n" +
          "diffuseColor.a *= feX * feY;\n" +
          "#include <alphatest_fragment>",
      );
    };
    return mat;
  }

  function buildForeground() {
    /* the plane widths are sized against the frustum at their own depth: a
     26-unit sheet two metres from the lens only shows its middle tenth */
    const layers = [
      /* name        canvas                                                                     x     y     z     w     h   sway */
      [
        "grassFar",
        texGrassCutout(101, {
          crest: 0.3,
          peak: 0.46,
          wide: 0.42,
          blades: 11000,
          len: 34,
          warm: 0.7,
          crest2: 0.46,
          crest3: 0.4,
        }),
        -3.4,
        2.85,
        -0.4,
        24,
        12,
        0.04,
      ],
      [
        "rockLeft",
        texRockCutout(404, {
          blobs: [
            [0.24, 0.78, 0.48, 0.38],
            [0.58, 0.94, 0.46, 0.3],
            [0.84, 1.06, 0.42, 0.28],
          ],
        }),
        -7.2,
        2.55,
        1.8,
        17,
        11.3,
        0.01,
      ],
      [
        "grassMid",
        texGrassCutout(202, {
          crest: 0.6,
          peak: 0.55,
          wide: 0.4,
          blades: 13000,
          len: 40,
          warm: 0.95,
          crest2: -0.44,
          crest3: 0.34,
        }),
        3.9,
        2.86,
        3.6,
        15,
        7.5,
        0.062,
      ],
      [
        "grassNear",
        texGrassCutout(303, {
          crest: 0.42,
          peak: 0.62,
          wide: 0.48,
          blades: 16000,
          len: 50,
          warm: 0.85,
          crest2: 0.42,
          crest3: 0.44,
        }),
        -1.9,
        2.92,
        5.6,
        12,
        6,
        0.092,
      ],
      ["bough", texBranchCutout(505), 4.6, 2.95, 6.4, 13, 8.7, 0.045],
      [
        "rockNear",
        texRockCutout(606, {
          blobs: [
            [0.18, 0.86, 0.54, 0.44],
            [0.54, 1.02, 0.5, 0.36],
            [0.86, 0.92, 0.4, 0.32],
          ],
        }),
        -6.6,
        1.7,
        6.0,
        9,
        6,
        0.008,
      ],
    ];
    WORLD.fg = [];
    layers.forEach((L) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(L[5], L[6], 12, 12),
        cutoutMaterial(L[1], L[7]),
      );
      m.position.set(L[2], L[3], L[4]);
      m.renderOrder = 20 + WORLD.fg.length;
      m.name = L[0];
      m.frustumCulled = false;
      scene.add(m);
      WORLD.fg.push(m);
    });
  }

  /* --------------------------------------------------- the giant wordmark */
  const WORD_Z = 3.0;
  function buildWordmark() {
    /* The word is set to the frame width, so a short word is a *taller* word.
     Four letters at the old tracking put a 400-pixel cap height across the
     scene; the letters are spaced out instead, which keeps the type edge to
     edge while the caps come back down to the height of the headline block. */
    const SZ = 320,
      TRACK = 0.4,
      PAD = 26;
    const m = cvs(4, 4).getContext("2d");
    m.font =
      "600 " +
      SZ +
      "px " +
      (options.wordmarkFamily || "Wordmark") +
      ", sans-serif";
    m.textBaseline = "alphabetic";
    m.textAlign = "left";
    const word = "GMP",
      gl = [];
    let pen = 0,
      ascMax = 0,
      descMax = 0,
      xMin = 1e9,
      xMax = -1e9;
    for (const ch of word) {
      const t = m.measureText(ch);
      const g = {
        ch: ch,
        adv: t.width,
        asc: t.actualBoundingBoxAscent,
        desc: t.actualBoundingBoxDescent,
        l: t.actualBoundingBoxLeft,
        r: t.actualBoundingBoxRight,
        pen: pen,
      };
      gl.push(g);
      ascMax = Math.max(ascMax, g.asc);
      descMax = Math.max(descMax, g.desc);
      xMin = Math.min(xMin, pen - g.l);
      xMax = Math.max(xMax, pen + g.r);
      pen += t.width + TRACK * SZ;
    }
    const group = new THREE.Group();
    WORD.glyphs = [];
    gl.forEach((g) => {
      const cw = Math.ceil(g.l + g.r) + PAD * 2,
        chh = Math.ceil(g.asc + g.desc) + PAD * 2;
      const c = cvs(cw, chh),
        x = c.getContext("2d");
      x.font =
        "600 " +
        SZ +
        "px " +
        (options.wordmarkFamily || "Wordmark") +
        ", sans-serif";
      x.textBaseline = "alphabetic";
      x.textAlign = "left";
      /* the vertical wash is baked per glyph so the whole word shares one ramp */
      const gy0 = PAD + g.asc - ascMax,
        gy1 = PAD + g.asc + descMax * 0.4;
      const grad = x.createLinearGradient(0, gy0, 0, gy1);
      grad.addColorStop(0, "rgb(226,236,229)");
      grad.addColorStop(0.52, "rgb(198,214,203)");
      grad.addColorStop(1, "rgb(150,170,157)");
      x.fillStyle = grad;
      x.fillText(g.ch, PAD + g.l, PAD + g.asc);

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(cw, chh),
        new THREE.MeshBasicMaterial({
          map: tx(c, { aniso: 16 }),
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          fog: true,
          opacity: 1,
        }),
      );
      mesh.position.set(
        g.pen + (g.r - g.l) / 2,
        (g.asc - g.desc) / 2 + (PAD - PAD),
        0,
      );
      mesh.position.y = (g.asc - g.desc) / 2;
      mesh.renderOrder = 12;
      mesh.frustumCulled = false;
      mesh.userData.baseY = mesh.position.y;
      group.add(mesh);
      WORD.glyphs.push(mesh);
    });
    group.position.z = WORD_Z;
    scene.add(group);
    WORD.group = group;
    WORD.ink = {
      xMin: xMin,
      xMax: xMax,
      cx: (xMin + xMax) / 2,
      w: xMax - xMin,
      asc: ascMax,
    };
  }
  const WORD = { glyphs: [], group: null, ink: null, reveal: 0 };

  /* --------------------------------------------------------- atmospherics */
  function buildAtmosphere() {
    /* drifting haze slabs */
    const hazeTex = tx(
      texGlow("rgba(160,205,210,.55)", "rgba(110,165,175,.18)"),
    );
    WORLD.haze = [];
    const rnd = mulberry32(66);
    for (let i = 0; i < (LOW ? 4 : 6); i++) {
      const s = 12 + rnd() * 15;
      const h = new THREE.Mesh(
        new THREE.PlaneGeometry(s, s * 0.55),
        new THREE.MeshBasicMaterial({
          map: hazeTex,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
          opacity: 0.05 + rnd() * 0.07,
        }),
      );
      h.position.set((rnd() - 0.5) * 44, 1.5 + rnd() * 10, -38 + rnd() * 40);
      h.renderOrder = 4;
      h.userData = {
        sp: 0.06 + rnd() * 0.12,
        ph: rnd() * TAU,
        x0: h.position.x,
      };
      scene.add(h);
      WORLD.haze.push(h);
    }

    /* embers around the lantern and the disc */
    const N = LOW ? 220 : 460;
    const pos = new Float32Array(N * 3),
      seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (rnd() - 0.5) * 30;
      pos[i * 3 + 1] = rnd() * 11;
      pos[i * 3 + 2] = -26 + rnd() * 36;
      seed[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const emb = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        uniforms: {
          uT: WORLD.uT,
          uTex: {
            value: tx(texGlow("rgba(255,190,140,1)", "rgba(255,120,60,.35)")),
          },
          uSize: { value: vpH() * 0.5 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader:
          "attribute float aSeed; uniform float uT; uniform float uSize; varying float vA;\n" +
          "void main(){ vec3 p=position;\n" +
          " p.y = mod(p.y + uT*(0.14+aSeed*0.28), 11.5);\n" +
          " p.x += sin(uT*0.36 + aSeed*22.0)*0.85;\n" +
          " p.z += cos(uT*0.29 + aSeed*17.0)*0.7;\n" +
          " vec4 mv = modelViewMatrix * vec4(p,1.0);\n" +
          " vA = (0.25+aSeed*0.75) * smoothstep(11.5,7.0,p.y) * smoothstep(0.0,1.4,p.y);\n" +
          " gl_PointSize = uSize*(0.010+aSeed*0.020)/max(-mv.z,0.6);\n" +
          " gl_Position = projectionMatrix * mv; }",
        fragmentShader:
          "uniform sampler2D uTex; varying float vA;\n" +
          "void main(){ vec4 t=texture2D(uTex, gl_PointCoord);\n" +
          " gl_FragColor = vec4(t.rgb*vec3(1.6,0.78,0.42), t.a*vA*0.75); }",
      }),
    );
    emb.frustumCulled = false;
    emb.renderOrder = 5;
    scene.add(emb);
    WORLD.embers = emb;

    /* rain in the slot of open sky */
    if (!LOW) {
      const D = 900,
        rp = new Float32Array(D * 2 * 3),
        rt = new Float32Array(D * 2),
        rs = new Float32Array(D * 2),
        rl = new Float32Array(D * 2);
      for (let i = 0; i < D; i++) {
        const x = (rnd() - 0.5) * 40,
          z = -30 + rnd() * 34,
          y = rnd() * 17,
          sp = 7 + rnd() * 9,
          ln = 0.3 + rnd() * 0.55;
        for (let k = 0; k < 2; k++) {
          const o = (i * 2 + k) * 3;
          rp[o] = x;
          rp[o + 1] = y;
          rp[o + 2] = z;
          rt[i * 2 + k] = k;
          rs[i * 2 + k] = sp;
          rl[i * 2 + k] = ln;
        }
      }
      const rg = new THREE.BufferGeometry();
      rg.setAttribute("position", new THREE.BufferAttribute(rp, 3));
      rg.setAttribute("aTop", new THREE.BufferAttribute(rt, 1));
      rg.setAttribute("aSpeed", new THREE.BufferAttribute(rs, 1));
      rg.setAttribute("aLen", new THREE.BufferAttribute(rl, 1));
      const rain = new THREE.LineSegments(
        rg,
        new THREE.ShaderMaterial({
          uniforms: { uT: WORLD.uT },
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          vertexShader:
            "attribute float aTop; attribute float aSpeed; attribute float aLen; uniform float uT; varying float vA;\n" +
            "void main(){ vec3 p=position;\n" +
            " float y = mod(p.y - uT*aSpeed, 17.0);\n" +
            " p.y = y + aTop*aLen;\n" +
            " vA = smoothstep(0.0,3.0,y)*smoothstep(17.0,11.0,y);\n" +
            " gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }",
          fragmentShader:
            "varying float vA;\nvoid main(){ gl_FragColor = vec4(0.55,0.74,0.82, vA*0.024); }",
        }),
      );
      rain.frustumCulled = false;
      rain.renderOrder = 6;
      scene.add(rain);
      WORLD.rain = rain;
    }

    /* ripples on the standing water */
    const ringC = cvs(256, 256),
      rx2 = ringC.getContext("2d");
    const rg2 = rx2.createRadialGradient(128, 128, 84, 128, 128, 128);
    rg2.addColorStop(0, "rgba(255,255,255,0)");
    rg2.addColorStop(0.62, "rgba(255,255,255,.55)");
    rg2.addColorStop(0.86, "rgba(255,255,255,.22)");
    rg2.addColorStop(1, "rgba(255,255,255,0)");
    rx2.fillStyle = rg2;
    rx2.fillRect(0, 0, 256, 256);
    const ringTex = tx(ringC);
    WORLD.ripples = [];
    for (let i = 0; i < (LOW ? 6 : 13); i++) {
      const r = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: ringTex,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: true,
          opacity: 0,
        }),
      );
      r.rotation.x = -Math.PI / 2;
      r.renderOrder = 7;
      r.userData = {
        t: rnd() * 4,
        x: (rnd() - 0.5) * 22,
        z: -8 + rnd() * 22,
        sp: 0.5 + rnd() * 0.5,
      };
      scene.add(r);
      WORLD.ripples.push(r);
    }
  }

  /* ====================================================== 6b · the leaf fall
   The maples shed all the way through the chapter. The fall is anchored to
   the rig rather than to the court: every leaf keeps a real world position so
   its drift is honest, but any leaf that ends up further than LEAF_R from the
   camera in x or z is wrapped back across it. That way the count is what one
   screenful needs — a hundred and seventy — instead of what filling the whole
   valley would cost, and the frame is never empty however far the walk goes.

   A falling leaf is read by its tumble, not by its path. Each one turns on
   two axes at its own rate, so it presents its face, thins to an edge and
   comes back — which is the whole reason these are instanced quads and not
   points, since a point sprite cannot turn away from the camera. */
  /* LEAF_AHEAD/LEAF_SPREAD is the disc leaves are recycled into, hung down the
   camera's own sight line; LEAF_R is only the far backstop for a rig that has
   walked out from under its weather. */
  const LEAF_AHEAD = 11,
    LEAF_SPREAD = 12,
    LEAF_R = 30;
  function buildLeafFall() {
    const N = LOW ? 110 : 260;
    const mat = new THREE.MeshStandardMaterial({
      map: tx(texLeaf()),
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      color: 0x40080a,
      roughness: 0.84,
      metalness: 0,
      /* green and blue driven to nothing: the composite tone-maps at the end,
       and an emissive red with any green in it comes back out of that pink */
      emissive: 0x780200,
      emissiveIntensity: 0.72,
    });
    const inst = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.4, 0.4),
      mat,
      N,
    );
    inst.frustumCulled = false;
    inst.renderOrder = 5;
    inst.castShadow = inst.receiveShadow = false;
    const rnd = mulberry32(404),
      list = [];
    for (let i = 0; i < N; i++)
      list.push({
        x: (rnd() - 0.5) * 2 * LEAF_R,
        z: (rnd() - 0.5) * 2 * LEAF_R,
        y: rnd() * 26,
        fall: 0.5 + rnd() * 0.9,
        sway: 0.45 + rnd() * 1.5,
        swayPh: rnd() * TAU,
        swayAmp: 0.3 + rnd() * 0.95,
        spin: (rnd() - 0.5) * 2.6,
        roll: rnd() * TAU,
        rollSp: 0.5 + rnd() * 2.0,
        tilt: rnd() * TAU,
        s: 0.55 + rnd() * 0.9,
      });
    scene.add(inst);
    WORLD.leaves = { mesh: inst, list: list };
  }
  const LEAF_M = new THREE.Matrix4(),
    LEAF_Q = new THREE.Quaternion();
  const LEAF_E = new THREE.Euler(),
    LEAF_P = new THREE.Vector3(),
    LEAF_S = new THREE.Vector3();
  const LEAF_F = new THREE.Vector3();
  function updateLeaves(dt) {
    const LV = WORLD.leaves;
    if (!LV) return;
    const cy = camera.position.y,
      L = LV.list;
    /* Respawn ahead of the rig, not around it. A band centred on the camera
     spends nearly all of itself behind and beside the frustum — of a couple of
     hundred leaves only a dozen were ever on screen. Recycling them into the
     cone the camera is actually looking down puts the same count in frame
     several times over, and costs nothing. */
    camera.getWorldDirection(LEAF_F);
    LEAF_F.y = 0;
    if (LEAF_F.lengthSq() < 1e-6) LEAF_F.set(0, 0, -1);
    else LEAF_F.normalize();
    const fx = camera.position.x + LEAF_F.x * LEAF_AHEAD;
    const fz = camera.position.z + LEAF_F.z * LEAF_AHEAD;
    const seed = !LV.seeded;
    LV.seeded = true;
    for (let i = 0; i < L.length; i++) {
      const l = L[i];
      l.y -= l.fall * dt;
      l.roll += l.rollSp * dt;
      l.tilt += l.spin * dt;
      if (seed || l.y < cy - 10) {
        /* back to the top of the band */
        l.y = seed ? cy - 10 + Math.random() * 26 : cy + 16;
        const a = Math.random() * TAU,
          r = Math.sqrt(Math.random()) * LEAF_SPREAD;
        l.x = fx + Math.cos(a) * r;
        l.z = fz + Math.sin(a) * r;
      }
      /* the far wrap is a backstop for a rig that has walked away from its own
       leaves — it sits well outside the fog, so nothing is seen to jump */
      const cx = camera.position.x,
        cz = camera.position.z;
      if (l.x - cx > LEAF_R) l.x -= 2 * LEAF_R;
      else if (l.x - cx < -LEAF_R) l.x += 2 * LEAF_R;
      if (l.z - cz > LEAF_R) l.z -= 2 * LEAF_R;
      else if (l.z - cz < -LEAF_R) l.z += 2 * LEAF_R;
      /* the side-slip of a leaf shedding air off one edge, then the other */
      const sw = Math.sin(clock * l.sway + l.swayPh);
      LEAF_P.set(
        l.x + sw * l.swayAmp,
        l.y,
        l.z + Math.cos(clock * l.sway * 0.7 + l.swayPh) * l.swayAmp * 0.6,
      );
      LEAF_E.set(l.roll, l.tilt, sw * 0.55);
      LEAF_Q.setFromEuler(LEAF_E);
      LEAF_S.setScalar(l.s);
      LEAF_M.compose(LEAF_P, LEAF_Q, LEAF_S);
      LV.mesh.setMatrixAt(i, LEAF_M);
    }
    LV.mesh.instanceMatrix.needsUpdate = true;
  }

  /* ==================================================== 6c · the cursor wisps
   A drift of cold motes that follows the pointer.

   It hangs as a child of the camera, so the pointer maps straight into camera
   space through the frustum's own half-height. Unprojecting onto a world
   plane each frame would instead pin the trail to the court, and the rig is
   always drifting — the wisps would swim across the screen whenever the
   camera moved rather than staying under the hand.

   Emission is by distance travelled, not elapsed time. A slow hand then lays
   a continuous drift and a fast one throws the motes apart, which is how a
   moving source actually sheds them; emitting on a timer gives an evenly
   spaced string of beads at every speed. */
  const clothInstances = [];
  const pendingImages = new Set();
  const WISP_D = 3.4;
  const WISP = {
    list: [],
    i: 0,
    acc: 0,
    ex: 0,
    ey: 0,
    lx: 0,
    ly: 0,
    idle: 0,
    seen: false,
  };
  function buildWisps() {
    if (COARSE) return;
    /* The motes are round, so nothing here is oriented: no per-particle angle,
     no rotated lookup. They are also small — a few pixels of core inside a
     faint halo — which is what lets the count go up without the additive fill
     that a screenful of big sprites costs. */
    const N = LOW ? 90 : 190;
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(N * 3), 3),
    );
    g.setAttribute("aA", new THREE.BufferAttribute(new Float32Array(N), 1));
    g.setAttribute("aS", new THREE.BufferAttribute(new Float32Array(N), 1));
    const pts = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        uniforms: { uTex: { value: tx(texWisp()) }, uPx: { value: vpH() } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        fog: false,
        vertexShader:
          "attribute float aA; attribute float aS;\n" +
          "uniform float uPx; varying float vA;\n" +
          "void main(){ vA = aA;\n" +
          " vec4 mv = modelViewMatrix * vec4(position,1.0);\n" +
          " gl_PointSize = uPx * aS / max(-mv.z, 0.4);\n" +
          " gl_Position = projectionMatrix * mv; }",
        fragmentShader:
          "uniform sampler2D uTex; varying float vA;\n" +
          "void main(){ if (vA <= 0.0) discard;\n" +
          " vec4 t = texture2D(uTex, gl_PointCoord);\n" +
          " gl_FragColor = vec4(t.rgb, t.a * vA); }",
      }),
    );
    pts.frustumCulled = false;
    pts.renderOrder = 9;
    pts.layers.set(1); /* near the lens: never in the mirror */
    camera.add(pts);
    WISP.mesh = pts;
    for (let i = 0; i < N; i++)
      WISP.list.push({ life: 0, max: 1, vx: 0, vy: 0, sz: 0, ph: 0 });
  }
  /* the pointer, in camera space, on the plane the trail hangs on */
  function wispPoint(nx, ny) {
    const hh = Math.tan((camera.fov * Math.PI) / 360) * WISP_D;
    return [nx * hh * camera.aspect, ny * hh];
  }
  function updateWisps(dt) {
    if (!WISP.mesh) return;
    const g = WISP.mesh.geometry;
    const P = g.attributes.position.array,
      A = g.attributes.aA.array;
    const S = g.attributes.aS.array;
    const L = WISP.list,
      N = L.length;

    const pt = wispPoint(RIG.tmx, RIG.tmy);
    if (!WISP.seen) {
      WISP.ex = WISP.lx = pt[0];
      WISP.ey = WISP.ly = pt[1];
      WISP.seen = true;
    }
    /* the emitter trails the pointer slightly, which is what gives the drift
     its lag on a fast flick instead of snapping rigidly to the cursor */
    WISP.ex = damp(WISP.ex, pt[0], 16, dt);
    WISP.ey = damp(WISP.ey, pt[1], 16, dt);

    const dx = WISP.ex - WISP.lx,
      dy = WISP.ey - WISP.ly;
    const moved = Math.hypot(dx, dy);
    const ang = moved > 1e-5 ? Math.atan2(dy, dx) : 0;
    const spawn = (x, y, a, weak) => {
      const i = WISP.i;
      WISP.i = (i + 1) % N; /* slot and state must pair:
       advancing first would put the position in the next slot and the life in
       this one, and every mote appears where the one before it started */
      const w = L[i],
        k = i * 3;
      /* The plane the trail hangs on is only about 2.2 units tall, so the
       scatter has to be read against that: a few hundredths of a unit is a
       thread stitched to the cursor, not a drift of motes. */
      P[k] = x + (Math.random() + Math.random() - 1) * 0.3;
      P[k + 1] = y + (Math.random() + Math.random() - 1) * 0.3;
      P[k + 2] = -WISP_D + (Math.random() - 0.5) * 0.9;
      w.life = 0;
      w.max = (weak ? 2.1 : 1.45) + Math.random() * 1.3;
      w.vx = -Math.cos(a) * 0.09 + (Math.random() - 0.5) * 0.38;
      w.vy = -Math.sin(a) * 0.09 + (Math.random() - 0.5) * 0.32 + 0.02;
      w.sz = (weak ? 0.018 : 0.024) + Math.random() * 0.026;
      w.ph = Math.random() * TAU;
    };

    WISP.acc += moved;
    const STEP = 0.03;
    let guard = 0;
    while (WISP.acc >= STEP && guard++ < 14) {
      WISP.acc -= STEP;
      /* lay each one at the distance along the segment it is actually owed, so a
       flick draws a spaced-out line instead of a clump at one end of it */
      const t = moved > 1e-6 ? Math.min(1, (guard * STEP) / moved) : 0;
      spawn(WISP.lx + dx * t, WISP.ly + dy * t, ang, false);
    }
    /* the faintest breath when the hand is still, so the cursor keeps an aura.
     Rarely, and barely buoyant: emit often here and a stationary pointer
     grows a permanent column of smoke up the middle of the frame. */
    WISP.idle += dt;
    if (WISP.idle > 0.42) {
      WISP.idle = 0;
      spawn(WISP.ex, WISP.ey, Math.random() * TAU, true);
    }
    WISP.lx = WISP.ex;
    WISP.ly = WISP.ey;

    for (let i = 0; i < N; i++) {
      const w = L[i],
        k = i * 3;
      if (w.life >= w.max) {
        A[i] = 0;
        continue;
      }
      w.life += dt;
      const u = w.life / w.max;
      /* curl, so the drift frays rather than blowing along one straight line */
      P[k] += (w.vx + Math.sin(clock * 1.3 + w.ph) * 0.17) * dt;
      P[k + 1] += (w.vy + Math.cos(clock * 1.1 + w.ph * 1.7) * 0.14) * dt;
      /* light damping: they have to coast to carry the scatter outward, where
       the old rate stopped every mote within a tenth of a unit of its spawn */
      w.vx *= 1 - 0.5 * dt;
      w.vy = w.vy * (1 - 0.5 * dt) + 0.022 * dt; /* it rises */
      A[i] = smooth(0, 0.12, u) * (1 - smooth(0.22, 1, u)) * 0.9;
      S[i] = w.sz * (1 + u * 0.55); /* a mote softens, it does not swell */
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.aA.needsUpdate = true;
    g.attributes.aS.needsUpdate = true;
  }

  /* ====================================================== cloth · the plates
   Canvas UI's Cloth, ported off React and off the experimental html-in-canvas
   path it ships with. That path exists so the effect can hang arbitrary live
   HTML on the fabric — it captures the subtree with drawElementImage(), which
   is Chrome-behind-a-flag only, and the component falls back to a flat render
   everywhere else.

   Here the fabric only ever carries a still, so the capture is not needed at
   all: the plate is drawn cover-cropped into a 2-D canvas with the card's own
   two scrims baked on, and that canvas is uploaded straight to the texture.
   The simulation, both shader passes and the option set are the component's,
   unchanged. The result is that the effect runs in every WebGL2 browser
   rather than one flag.

   The grid is the component's 96 squared. Three of these on one page is a
   third of a million cell updates a second, so each one hard-stops when its
   card leaves the viewport and again once the wind dies and the fabric has
   settled — both already in the component, and both load-bearing here. */
  const CLOTH_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aGrid;
layout(location = 1) in vec4 aData;
layout(location = 2) in vec2 aOffset;
uniform vec2 uRes; uniform vec2 uOut; uniform float uBleed; uniform float uFocal;
out vec2 vUv; out vec3 vNormal; out float vFold; out vec2 vLocal;
void main () {
  vUv = aGrid;
  float z = aData.x;
  vec2 nxy = aData.yz;
  vNormal = vec3(nxy, sqrt(max(1.0 - dot(nxy, nxy), 0.04)));
  vFold = aData.w;
  vLocal = aGrid * uRes;
  vec2 px = vLocal + aOffset + vec2(uBleed);
  vec2 ndc = (px / uOut) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  float w = (uFocal - z) / uFocal;
  gl_Position = vec4(ndc, -z / uFocal, w);
}`;
  const CLOTH_SDF = `
float fabricDist (vec2 p, vec2 size, float radius) {
  vec2 half_ = size * 0.5;
  float r = min(radius, min(half_.x, half_.y));
  vec2 q = abs(p - half_) - (half_ - vec2(r));
  return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
}`;
  const CLOTH_FRAG = `#version 300 es
precision highp float;
in vec2 vUv; in vec3 vNormal; in float vFold; in vec2 vLocal;
out vec4 outColor;
uniform sampler2D uContent; uniform float uMaxX; uniform float uLight;
uniform float uSheen; uniform vec3 uBacking; uniform vec2 uRes;
uniform float uRadius; uniform float uDark; uniform float uEdge;
${CLOTH_SDF}
void main () {
  vec2 uv = clamp(vUv, vec2(0.001), vec2(uMaxX - 0.001, 0.999));
  vec4 tex = texture(uContent, uv);
  vec3 fabric = mix(uBacking, tex.rgb, tex.a);
  vec3 n = normalize(vNormal);
  vec3 lightDir = normalize(vec3(-0.3, 0.42, 0.86));
  float diffFlat = 0.58 + 0.42 * lightDir.z;
  float diff = 0.58 + 0.42 * dot(n, lightDir);
  float shade = mix(1.0, (diff / diffFlat) * vFold, uLight);
  vec3 lit = fabric * shade;
  vec3 halfway = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float specFlat = pow(halfway.z, 34.0);
  float spec = max(pow(max(dot(n, halfway), 0.0), 34.0) - specFlat, 0.0) / (1.0 - specFlat);
  lit += uSheen * spec * mix(vec3(1.0), fabric, 0.35);
  float broadFlat = pow(halfway.z, 6.0);
  float broad = max(pow(max(dot(n, halfway), 0.0), 6.0) - broadFlat, 0.0) / (1.0 - broadFlat);
  lit += uDark * uLight * 0.3 * broad * vec3(1.0);
  float d = fabricDist(vLocal, uRes, uRadius);
  float hemT = smoothstep(0.0, 6.0, -d);
  lit *= mix(1.0, mix(0.93, 1.0, hemT), uLight * (1.0 - uDark));
  lit += vec3(uDark * uLight * 0.08 * (1.0 - hemT));
  /* The card's outline, drawn here rather than as a rule on the box: off the
     same distance field that cuts the fabric out, so it rides every fold,
     takes the perspective with it and rounds itself on the corners. A CSS
     outline can only ever trace the flat rectangle the cloth has left. */
  /* A hairline: the band is under a pixel wide and pulled tight against the
     cut, so it reads as an edge on the fabric rather than a drawn stroke. */
  float rim = smoothstep(1.05, 0.2, abs(d + 0.7));
  lit += rim * uEdge * vec3(0.874, 0.906, 0.878);

  float alpha = clamp(0.5 - d, 0.0, 1.0);
  outColor = vec4(clamp(lit, 0.0, 1.0), 1.0) * alpha;
}`;
  const CLOTH_SHADOW_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aGrid;
layout(location = 1) in vec4 aData;
layout(location = 2) in vec2 aOffset;
uniform vec2 uRes; uniform vec2 uOut; uniform float uBleed;
out vec2 vLocal; out float vLift;
void main () {
  float z = aData.x;
  vLift = z;
  vLocal = aGrid * uRes;
  vec2 px = vLocal + aOffset + vec2(uBleed) + vec2(10.0, 14.0) + vec2(0.3, 0.42) * z;
  vec2 ndc = (px / uOut) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  gl_Position = vec4(ndc, 0.0, 1.0);
}`;
  const CLOTH_SHADOW_FRAG = `#version 300 es
precision highp float;
in vec2 vLocal; in float vLift;
out vec4 outColor;
uniform float uShadow; uniform vec2 uRes; uniform float uRadius; uniform float uDark;
${CLOTH_SDF}
void main () {
  float d = fabricDist(vLocal, uRes, uRadius);
  float a = uShadow * smoothstep(0.0, 30.0, -d);
  a *= mix(1.0, 0.55, clamp(vLift / 50.0, 0.0, 1.0));
  a *= mix(1.0, 0.55, uDark);
  outColor = vec4(vec3(uDark) * a, a);
}`;

  const CL_SEG = 96,
    CL_NODES = CL_SEG + 1,
    CL_DT = 1 / 120;
  const CL_WAVE = 30,
    CL_STIFF = 0.55,
    CL_GAIN = 5.0,
    CL_BLEED = 48;
  const CLOTH_DEFAULTS = {
    pin: "top",
    wind: 3,
    speed: 0.5,
    amplitude: 30,
    drape: 40,
    brush: 2.05,
    brushSize: 150,
    damping: 1,
    light: 0.5,
    sheen: 0.1,
    shadow: 0.25,
    cornerRadius: 20,
    backing: "auto",
    perspective: 1200,
  };

  function createCloth(output, plate, options) {
    const config = Object.assign({}, CLOTH_DEFAULTS, options || {});
    const wrapper = output.parentElement || output;
    output.style.top = output.style.left = -CL_BLEED + "px";
    output.style.width = "calc(100% + " + CL_BLEED * 2 + "px)";
    output.style.height = "calc(100% + " + CL_BLEED * 2 + "px)";

    const gl = output.getContext("webgl2", {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: true,
      premultipliedAlpha: true,
    });
    if (!gl || gl.isContextLost()) return null;

    const compile = (type, text) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, text);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        console.error("Cloth:", gl.getShaderInfoLog(sh));
      return sh;
    };
    const link = (v, f) => {
      const prog = gl.createProgram();
      const vs = compile(gl.VERTEX_SHADER, v),
        fs = compile(gl.FRAGMENT_SHADER, f);
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      const u = {},
        n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(prog, i);
        u[info.name] = gl.getUniformLocation(prog, info.name);
      }
      return { program: prog, vert: vs, frag: fs, uniforms: u };
    };
    const cloth = link(CLOTH_VERT, CLOTH_FRAG);
    const shadow = link(CLOTH_SHADOW_VERT, CLOTH_SHADOW_FRAG);
    if (
      !gl.getProgramParameter(cloth.program, gl.LINK_STATUS) ||
      !gl.getProgramParameter(shadow.program, gl.LINK_STATUS)
    ) {
      [cloth, shadow].forEach((p) => {
        gl.deleteProgram(p.program);
        gl.deleteShader(p.vert);
        gl.deleteShader(p.frag);
      });
      return null;
    }

    const gridVerts = new Float32Array(CL_NODES * CL_NODES * 2);
    for (let y = 0; y < CL_NODES; y++)
      for (let x = 0; x < CL_NODES; x++) {
        const i = (y * CL_NODES + x) * 2;
        gridVerts[i] = x / CL_SEG;
        gridVerts[i + 1] = y / CL_SEG;
      }
    const idx = new Uint32Array(CL_SEG * CL_SEG * 6);
    let o = 0;
    for (let y = 0; y < CL_SEG; y++)
      for (let x = 0; x < CL_SEG; x++) {
        const a = y * CL_NODES + x,
          b = a + 1,
          c = a + CL_NODES,
          d = c + 1;
        idx[o++] = a;
        idx[o++] = c;
        idx[o++] = b;
        idx[o++] = b;
        idx[o++] = c;
        idx[o++] = d;
      }
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const gridBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
    gl.bufferData(gl.ARRAY_BUFFER, gridVerts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const dataBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuf);
    gl.bufferData(gl.ARRAY_BUFFER, CL_NODES * CL_NODES * 16, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    const offBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, offBuf);
    gl.bufferData(gl.ARRAY_BUFFER, CL_NODES * CL_NODES * 8, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );

    /* the one place this differs from the component: the plate goes straight in */
    function upload() {
      const c = plate();
      if (!c || !c.width) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    }

    function syncSize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(output.clientWidth * dpr));
      const h = Math.max(1, Math.round(output.clientHeight * dpr));
      if (output.width !== w || output.height !== h) {
        output.width = w;
        output.height = h;
      }
    }

    let hCur = new Float32Array(CL_NODES * CL_NODES);
    let hPrev = new Float32Array(CL_NODES * CL_NODES);
    let hNext = new Float32Array(CL_NODES * CL_NODES);
    const vData = new Float32Array(CL_NODES * CL_NODES * 4);
    const oData = new Float32Array(CL_NODES * CL_NODES * 2);
    const zF = new Float32Array(CL_NODES * CL_NODES);
    const rowF = new Float32Array(CL_NODES),
      colF = new Float32Array(CL_NODES);
    const hang = new Float32Array(CL_NODES);
    for (let a = 0; a < CL_NODES; a++) hang[a] = Math.pow(a / CL_SEG, 1.3);

    let simTime = Math.random() * 60,
      gust = 0.5,
      energy = 1;
    let edge = 0.048,
      edgeTo = 0.048; /* barely there at rest, found on hover */
    const ptr = { x: -1e5, y: -1e5, inside: false };
    const touch = { x: -1e5, y: -1e5, vx: 0, vy: 0, s: 0 };
    const axisA = (x, y) =>
      config.pin === "top"
        ? y
        : config.pin === "bottom"
          ? CL_SEG - y
          : config.pin === "left"
            ? x
            : CL_SEG - x;
    const axisB = (x, y) =>
      config.pin === "top" || config.pin === "bottom" ? x : y;

    function stepSim(dt) {
      simTime += dt * Math.max(config.speed, 0);
      const t = simTime,
        windAmp = CL_GAIN * Math.max(config.wind, 0) * gust;
      const kb1 = (Math.PI * 2) / (CL_SEG / 1.5),
        kb2 = (Math.PI * 2) / (CL_SEG / 3.8);
      const ka = (Math.PI * 2) / (CL_SEG / 2.2);
      const w1 = CL_WAVE * kb1,
        w2 = CL_WAVE * kb2,
        drift = 1.8 * Math.sin(0.23 * t);
      for (let b = 0; b < CL_NODES; b++)
        rowF[b] =
          Math.sin(kb1 * b - w1 * t + drift) +
          0.45 * Math.sin(kb2 * b + w2 * t * 0.8 + 3);
      for (let a = 0; a < CL_NODES; a++)
        colF[a] = (0.7 + 0.3 * Math.sin(ka * a - 1.7 * t)) * hang[a];
      const c2 = CL_WAVE * CL_WAVE,
        dt2 = dt * dt;
      const decay = Math.exp(-Math.min(Math.max(config.damping, 0.05), 8) * dt);
      for (let y = 0; y < CL_NODES; y++) {
        const up = Math.max(y - 1, 0) * CL_NODES,
          down = Math.min(y + 1, CL_SEG) * CL_NODES;
        const row = y * CL_NODES;
        for (let x = 0; x < CL_NODES; x++) {
          const i = row + x;
          const h = hCur[i];
          const lap =
            hCur[row + Math.max(x - 1, 0)] +
            hCur[row + Math.min(x + 1, CL_SEG)] +
            hCur[up + x] +
            hCur[down + x] -
            4 * h;
          const force = windAmp * rowF[axisB(x, y)] * colF[axisA(x, y)];
          const next =
            2 * h - hPrev[i] + dt2 * (c2 * lap - CL_STIFF * h + force);
          let v = h + (next - h) * decay;
          if (v > 3.5) v = 3.5;
          else if (v < -3.5) v = -3.5;
          hNext[i] = v;
        }
      }
      for (let b = 0; b < CL_NODES; b++) {
        let x = b,
          y = 0;
        if (config.pin === "bottom") y = CL_SEG;
        else if (config.pin === "left") {
          x = 0;
          y = b;
        } else if (config.pin === "right") {
          x = CL_SEG;
          y = b;
        }
        hNext[y * CL_NODES + x] = 0;
      }
      const spent = hPrev;
      hPrev = hCur;
      hCur = hNext;
      hNext = spent;
    }

    function imprint(delta, width, height) {
      if (config.brush <= 0 || touch.s < 0.01) return;
      const cw = width / CL_SEG,
        ch = height / CL_SEG;
      const rx = Math.max(config.brushSize, 12) / cw,
        ry = Math.max(config.brushSize, 12) / ch;
      const gx = touch.x / cw,
        gy = touch.y / ch;
      const x0 = Math.max(Math.ceil(gx - 2.5 * rx), 0),
        x1 = Math.min(Math.floor(gx + 2.5 * rx), CL_SEG);
      const y0 = Math.max(Math.ceil(gy - 2.5 * ry), 0),
        y1 = Math.min(Math.floor(gy + 2.5 * ry), CL_SEG);
      const lift = 1.1 * Math.min(config.brush, 3) * touch.s,
        rate = Math.min(delta * 4, 1);
      for (let y = y0; y <= y1; y++) {
        const oy = (y - gy) / ry,
          row = y * CL_NODES;
        for (let x = x0; x <= x1; x++) {
          const ox = (x - gx) / rx,
            g = Math.exp(-(ox * ox + oy * oy));
          if (g < 0.02) continue;
          const i = row + x,
            pull = rate * g,
            goal = lift * g;
          hCur[i] += (goal - hCur[i]) * pull;
          hPrev[i] += (goal - hPrev[i]) * pull;
        }
      }
    }

    function foreshorten(stride, lineStride, ds, anchor, comp) {
      const ds2 = ds * ds;
      for (let l = 0; l < CL_NODES; l++) {
        const base = l * lineStride;
        oData[(base + anchor * stride) * 2 + comp] = 0;
        let cum = 0;
        for (let k = anchor + 1; k < CL_NODES; k++) {
          const i = base + k * stride,
            dz = zF[i] - zF[i - stride];
          cum += ds - Math.sqrt(Math.max(ds2 - dz * dz, 0));
          oData[i * 2 + comp] = -cum;
        }
        cum = 0;
        for (let k = anchor - 1; k >= 0; k--) {
          const i = base + k * stride,
            dz = zF[i] - zF[i + stride];
          cum += ds - Math.sqrt(Math.max(ds2 - dz * dz, 0));
          oData[i * 2 + comp] = cum;
        }
      }
    }

    function compose(width, height) {
      const amp = Math.max(config.amplitude, 0);
      const drape = config.drape * (0.3 + 0.7 * gust);
      const cw = width / CL_SEG,
        ch = height / CL_SEG;
      let e = 0;
      for (let y = 0; y < CL_NODES; y++) {
        const row = y * CL_NODES;
        for (let x = 0; x < CL_NODES; x++) {
          const i = row + x,
            h = hCur[i];
          if (Math.abs(h) > e) e = Math.abs(h);
          zF[i] = amp * Math.tanh(h) + drape * hang[axisA(x, y)];
        }
      }
      energy = e;
      for (let y = 0; y < CL_NODES; y++) {
        const up = Math.max(y - 1, 0) * CL_NODES,
          down = Math.min(y + 1, CL_SEG) * CL_NODES;
        const row = y * CL_NODES;
        for (let x = 0; x < CL_NODES; x++) {
          const i = row + x;
          const l = row + Math.max(x - 1, 0),
            r = row + Math.min(x + 1, CL_SEG);
          const dzdx = (zF[r] - zF[l]) / (2 * cw),
            dzdy = (zF[down + x] - zF[up + x]) / (2 * ch);
          const inv = 1 / Math.hypot(dzdx, dzdy, 1);
          const curve = zF[l] + zF[r] + zF[up + x] + zF[down + x] - 4 * zF[i];
          let fold = 1 - curve * 0.01;
          if (fold < 0.86) fold = 0.86;
          else if (fold > 1.06) fold = 1.06;
          const q = i * 4;
          vData[q] = zF[i];
          vData[q + 1] = -dzdx * inv;
          vData[q + 2] = -dzdy * inv;
          vData[q + 3] = fold;
        }
      }
      const mid = CL_SEG >> 1;
      if (config.pin === "top" || config.pin === "bottom") {
        foreshorten(CL_NODES, 1, ch, config.pin === "top" ? 0 : CL_SEG, 1);
        foreshorten(1, CL_NODES, cw, mid, 0);
      } else {
        foreshorten(1, CL_NODES, cw, config.pin === "left" ? 0 : CL_SEG, 0);
        foreshorten(CL_NODES, 1, ch, mid, 1);
      }
    }

    const backing =
      config.backing === "auto" ? [0.02, 0.026, 0.035] : config.backing;

    function draw() {
      const resW = Math.max(wrapper.clientWidth, 1),
        resH = Math.max(wrapper.clientHeight, 1);
      const outW = Math.max(output.clientWidth, 1),
        outH = Math.max(output.clientHeight, 1);
      const light = Math.min(Math.max(config.light, 0), 1);
      const radius = Math.max(config.cornerRadius, 0);
      const lum = 0.299 * backing[0] + 0.587 * backing[1] + 0.114 * backing[2];
      const dark = Math.min(Math.max((0.5 - lum) / 0.35, 0), 1);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, output.width, output.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, dataBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, vData);
      gl.bindBuffer(gl.ARRAY_BUFFER, offBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, oData);

      gl.useProgram(shadow.program);
      gl.uniform2f(shadow.uniforms.uRes, resW, resH);
      gl.uniform2f(shadow.uniforms.uOut, outW, outH);
      gl.uniform1f(shadow.uniforms.uBleed, CL_BLEED);
      gl.uniform1f(
        shadow.uniforms.uShadow,
        Math.min(Math.max(config.shadow, 0), 1),
      );
      gl.uniform1f(shadow.uniforms.uRadius, radius);
      gl.uniform1f(shadow.uniforms.uDark, dark);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);

      gl.useProgram(cloth.program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(cloth.uniforms.uContent, 0);
      gl.uniform2f(cloth.uniforms.uRes, resW, resH);
      gl.uniform2f(cloth.uniforms.uOut, outW, outH);
      gl.uniform1f(cloth.uniforms.uBleed, CL_BLEED);
      gl.uniform1f(cloth.uniforms.uFocal, Math.max(config.perspective, 200));
      gl.uniform1f(cloth.uniforms.uMaxX, 1);
      gl.uniform1f(cloth.uniforms.uLight, light);
      gl.uniform1f(cloth.uniforms.uSheen, Math.max(config.sheen, 0));
      gl.uniform1f(cloth.uniforms.uRadius, radius);
      gl.uniform1f(cloth.uniforms.uDark, dark);
      gl.uniform1f(cloth.uniforms.uEdge, edge);
      gl.uniform3f(cloth.uniforms.uBacking, backing[0], backing[1], backing[2]);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
      gl.bindVertexArray(null);
    }

    let raf = 0,
      last = performance.now(),
      debt = 0,
      running = false,
      visible = false,
      dead = false;
    function frame(now) {
      if (dead) return;
      if (!visible) {
        running = false;
        return;
      }
      const delta = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      const width = Math.max(wrapper.clientWidth, 1),
        height = Math.max(wrapper.clientHeight, 1);
      if (!REDUCE) {
        const t = simTime;
        const target = Math.max(
          0.55 +
            0.35 * Math.sin(t * 0.31 + 1.3) +
            0.25 * Math.sin(t * 0.83) * (0.5 + 0.5 * Math.sin(t * 0.17)),
          0.15,
        );
        gust += (target - gust) * Math.min(delta * 2, 1);
        const sT = ptr.inside && config.brush > 0 ? 1 : 0;
        touch.s += (sT - touch.s) * Math.min(delta * (ptr.inside ? 8 : 2.5), 1);
        const om = 14;
        touch.vx += ((ptr.x - touch.x) * om * om - 2 * om * touch.vx) * delta;
        touch.vy += ((ptr.y - touch.y) * om * om - 2 * om * touch.vy) * delta;
        touch.x += touch.vx * delta;
        touch.y += touch.vy * delta;
        imprint(delta, width, height);
        edge += (edgeTo - edge) * Math.min(delta * 5, 1);
        debt = Math.min(debt + delta, CL_DT * 5);
        while (debt >= CL_DT) {
          stepSim(CL_DT);
          debt -= CL_DT;
        }
      }
      compose(width, height);
      draw();
      if (
        REDUCE ||
        (config.wind <= 0.001 && energy < 0.004 && touch.s < 0.01)
      ) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (dead || running || !visible) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => {
      if (dead) return;
      syncSize();
      upload();
      start();
    });
    ro.observe(output);
    const io = new IntersectionObserver((es) => {
      if (dead) return;
      visible = es[es.length - 1] ? es[es.length - 1].isIntersecting : false;
      if (visible) start();
    });
    io.observe(output);
    const onMove = (e) => {
      const r = wrapper.getBoundingClientRect();
      const x = e.clientX - r.left,
        y = e.clientY - r.top;
      if (touch.s < 0.01) {
        touch.x = x;
        touch.y = y;
        touch.vx = touch.vy = 0;
      }
      ptr.x = x;
      ptr.y = y;
      ptr.inside = true;
      start();
    };
    const onLeave = () => {
      ptr.inside = false;
    };
    wrapper.addEventListener("pointermove", onMove, { passive: true });
    wrapper.addEventListener("pointerleave", onLeave, { passive: true });
    const onHidden = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else start();
    };
    document.addEventListener("visibilitychange", onHidden);

    function disposeCloth() {
      dead = true;
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onHidden);
      [gridBuf, dataBuf, offBuf, idxBuf].forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(vao);
      gl.deleteTexture(tex);
      [cloth, shadow].forEach((p) => {
        gl.deleteProgram(p.program);
        gl.deleteShader(p.vert);
        gl.deleteShader(p.frag);
      });
    }
    try {
      syncSize();
      upload();
      if (gl.getError() !== gl.NO_ERROR) {
        disposeCloth();
        return null;
      }
      compose(
        Math.max(wrapper.clientWidth, 1),
        Math.max(wrapper.clientHeight, 1),
      );
    } catch {
      disposeCloth();
      return null;
    }
    return {
      refresh() {
        if (dead) return;
        syncSize();
        upload();
        start();
      },
      wake: start,
      setEdge(v) {
        if (dead) return;
        edgeTo = v;
        start();
      },
      dispose: disposeCloth,
    };
  }

  /* the plate: the card's own still, cover-cropped, carrying the two scrims the
   CSS used to lay over it — baked in so they ripple with the cloth instead of
   sitting flat on top of it */
  function clothPlate(img, w, h) {
    const c = cvs(Math.max(1, w | 0), Math.max(1, h | 0)),
      x = c.getContext("2d");
    const s = Math.max(c.width / img.width, c.height / img.height);
    const dw = img.width * s,
      dh = img.height * s;
    x.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
    let g = x.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0.36, "rgba(3,6,9,.05)");
    g.addColorStop(1, "rgba(3,6,9,.73)");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    g = x.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0.46, "rgba(4,6,9,0)");
    g.addColorStop(1, "rgba(4,6,9,.80)");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function buildCardCloth() {
    if (COARSE) return; /* no pointer to brush it with */
    $$(".cards .card-fr").forEach((fr) => {
      if (options.world !== "control" && !fr.hasAttribute("data-cloth-src"))
        return;
      const fallbackImage = fr.querySelector("img[data-cloth-fallback]");
      const url =
        fallbackImage?.currentSrc ||
        fr.getAttribute("data-cloth-src") ||
        (getComputedStyle(fr).backgroundImage.match(/url\(["']?([^"')]+)/) ||
          [])[1];
      if (!url) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      pendingImages.add(img);
      img.onload = () => {
        pendingImages.delete(img);
        if (disposed) return;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        let plate = null,
          pw = 0,
          ph = 0;
        const get = () => {
          const w = Math.round(fr.clientWidth * dpr),
            h = Math.round(fr.clientHeight * dpr);
          if (!plate || w !== pw || h !== ph) {
            plate = clothPlate(img, w, h);
            pw = w;
            ph = h;
          }
          return plate;
        };
        const out = document.createElement("canvas");
        out.className = "cloth-out";
        out.setAttribute("aria-hidden", "true");
        fr.appendChild(out);
        let inst;
        try {
          inst = createCloth(out, get, {
            wind: 3,
            speed: 0.5,
            amplitude: 30,
            drape: 40,
            brush: 2.05,
            brushSize: 150,
            damping: 1,
            light: 0.5,
            sheen: 0.1,
            shadow: 0.25,
            cornerRadius: 20,
            perspective: 1200,
            pin: "top",
          });
        } catch {
          out.remove();
          return;
        }
        /* only hide the card's own painting once the fabric is really carrying it */
        if (!inst) {
          out.remove();
          return;
        }
        fr.classList.add("on-cloth");
        const card = fr.closest(".card") || fr;
        const enter = () => inst.setEdge(0.185),
          leave = () => inst.setEdge(0.048);
        card.addEventListener("pointerenter", enter, { passive: true });
        card.addEventListener("pointerleave", leave, { passive: true });
        clothInstances.push({ inst, out, fr, card, enter, leave });
      };
      img.onerror = () => {
        pendingImages.delete(img);
      };
      img.src = url;
    });
  }

  function buildLights() {
    scene.add(new THREE.HemisphereLight(0x53838f, 0x060a08, 0.13));

    const key = new THREE.DirectionalLight(0xb6dbe4, 1.22);
    key.position.set(2.6, 21, 2.5);
    key.target.position.set(0, 2.2, -12.5);
    scene.add(key.target);
    if (WANT_SHADOW) {
      key.castShadow = true;
      const S = LOW ? 1024 : 2048;
      key.shadow.mapSize.set(S, S);
      const c = key.shadow.camera;
      c.left = -26;
      c.right = 26;
      c.top = 34;
      c.bottom = -16;
      c.near = 3;
      c.far = 78;
      key.shadow.bias = -0.0012;
      key.shadow.normalBias = 0.035;
      key.shadow.radius = 2.2;
    }
    scene.add(key);
    WORLD.key = key;

    /* moonlight: no shadow, no fill, purely a rim down the right-hand slope of
     every roof — without it the hall is a flat black cut-out against the sky */
    const moonKey = new THREE.DirectionalLight(0xff6a42, 0.52);
    moonKey.position.set(26, 30, -60);
    moonKey.target.position.set(0, 8, -40);
    scene.add(moonKey.target);
    scene.add(moonKey);

    /* The hall's own lamps. They light the podium and the top of the flight and
     nothing else — a range that reaches the roof turns the whole building into
     a paper lantern and the silhouette disappears. */
    const hallL = new THREE.PointLight(0xff8a26, 2.3, 15, 2);
    hallL.position.set(0, PODIUM + 1.2, TEMPLE_Z + 8.6);
    scene.add(hallL);
    WORLD.hallLight = hallL;
    [-1, 1].forEach((s) => {
      const w = new THREE.PointLight(0xff8420, 2.2, 11, 2);
      w.position.set(s * 11.4, PODIUM + 1.2, TEMPLE_Z + 5.6);
      scene.add(w);
    });

    /* the moon throws almost nothing, but a trace of red high on the right
     keeps it attached to the scene instead of floating on top of it */
    const moonL = new THREE.PointLight(0xff3a1c, 3.0, 46, 2);
    moonL.position.set(11.0, 17.0, -24.0);
    scene.add(moonL);
    WORLD.moonLight = moonL;

    const fill = new THREE.PointLight(0x86c6d2, 0.95, 30, 2);
    fill.position.set(-1, 13.5, -16.0);
    scene.add(fill);

    /* the flight is the spine of the composition — without a lamp of its own it
     falls into the same black as the ground and the eye has nothing to climb */
    const stairL = new THREE.PointLight(0xffa049, 4.2, 17, 2);
    stairL.position.set(0, 7.6, -26.0);
    scene.add(stairL);
  }
  /* ====================================================== 6 · planar mirror */
  /* ================================================== 7 · post-processing */
  const POST = { levels: [] };
  const QUAD_VS =
    "varying vec2 vUv;\nvoid main(){ vUv = uv; gl_Position = vec4( position.xy, 0.0, 1.0 ); }";

  function initPost() {
    POST.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    POST.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    POST.quad.frustumCulled = false;
    POST.qScene = new THREE.Scene();
    POST.qScene.add(POST.quad);
    POST.up = new THREE.ShaderMaterial({
      uniforms: { tS: { value: null }, uAmt: { value: 1 } },
      vertexShader: QUAD_VS,
      fragmentShader:
        "uniform sampler2D tS; uniform float uAmt; varying vec2 vUv;\nvoid main(){ gl_FragColor = vec4(texture2D(tS,vUv).rgb*uAmt, 1.0); }",
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    if (!WANT_POST) return;
    const w = renderer.domElement.width,
      h = renderer.domElement.height;
    const O = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };
    POST.scene = new THREE.WebGLRenderTarget(
      w,
      h,
      Object.assign({}, O, { depthBuffer: true, samples: LOW ? 0 : 2 }),
    );
    let lw = Math.max(2, w >> 1),
      lh = Math.max(2, h >> 1);
    const N = 4;
    for (let i = 0; i < N; i++) {
      POST.levels.push({
        a: new THREE.WebGLRenderTarget(lw, lh, O),
        b: new THREE.WebGLRenderTarget(lw, lh, O),
        w: lw,
        h: lh,
      });
      lw = Math.max(2, lw >> 1);
      lh = Math.max(2, lh >> 1);
    }
    POST.bright = new THREE.ShaderMaterial({
      uniforms: {
        tS: { value: null },
        uThr: { value: 0.86 },
        uKnee: { value: 0.5 },
      },
      vertexShader: QUAD_VS,
      fragmentShader:
        "uniform sampler2D tS; uniform float uThr; uniform float uKnee; varying vec2 vUv;\n" +
        "void main(){ vec3 c = texture2D(tS, vUv).rgb;\n" +
        " float l = dot(c, vec3(0.2126,0.7152,0.0722));\n" +
        " float k = smoothstep(uThr, uThr+uKnee, l);\n" +
        " gl_FragColor = vec4(c*k, 1.0); }",
    });
    POST.blur = new THREE.ShaderMaterial({
      uniforms: {
        tS: { value: null },
        uDir: { value: new THREE.Vector2(1, 0) },
      },
      vertexShader: QUAD_VS,
      fragmentShader:
        "uniform sampler2D tS; uniform vec2 uDir; varying vec2 vUv;\n" +
        "void main(){ vec3 c = texture2D(tS, vUv).rgb * 0.2270270270;\n" +
        " c += texture2D(tS, vUv + uDir*1.3846153846).rgb * 0.3162162162;\n" +
        " c += texture2D(tS, vUv - uDir*1.3846153846).rgb * 0.3162162162;\n" +
        " c += texture2D(tS, vUv + uDir*3.2307692308).rgb * 0.0702702703;\n" +
        " c += texture2D(tS, vUv - uDir*3.2307692308).rgb * 0.0702702703;\n" +
        " gl_FragColor = vec4(c, 1.0); }",
    });
    POST.comp = new THREE.ShaderMaterial({
      uniforms: {
        tS: { value: null },
        tB: { value: null },
        uRes: { value: new THREE.Vector2(w, h) },
        uT: { value: 0 },
        uBloom: { value: 0.34 },
        uCA: { value: 1 },
        uGrain: { value: 0.02 },
        uVig: { value: 1 },
        uExp: { value: 0.62 },
        uFade: { value: 1 },
        uSat: { value: 1.05 },
      },
      vertexShader: QUAD_VS,
      fragmentShader:
        "uniform sampler2D tS; uniform sampler2D tB; uniform vec2 uRes;\n" +
        "uniform float uT, uBloom, uCA, uGrain, uVig, uExp, uFade, uSat;\n" +
        "varying vec2 vUv;\n" +
        "vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }\n" +
        "void main(){\n" +
        " vec2 d = vUv - 0.5; float r2 = dot(d,d);\n" +
        " float ca = uCA * (0.30 + r2*2.6) * 0.0013;\n" +
        " vec3 c;\n" +
        " c.r = texture2D(tS, vUv + d*ca).r;\n" +
        " c.g = texture2D(tS, vUv).g;\n" +
        " c.b = texture2D(tS, vUv - d*ca).b;\n" +
        " c += texture2D(tB, vUv).rgb * uBloom;\n" +
        " c *= uExp;\n" +
        " c = aces(c);\n" +
        " float l = dot(c, vec3(0.2126,0.7152,0.0722));\n" +
        " c = mix(vec3(l), c, uSat);\n" +
        " c = mix(c, c*vec3(0.74,1.03,1.11), smoothstep(0.55,0.0,l)*0.80);\n" /* teal shadows */ +
        " c = mix(c, c*vec3(1.035,0.995,0.968), smoothstep(0.50,1.0,l)*0.26);\n" /* warm highs   */ +
        " float v = smoothstep(1.22, 0.26, length(d*vec2(1.0,0.94))*1.42);\n" +
        " c *= mix(1.0, v, uVig);\n" +
        " float g = fract(sin(dot(vUv*uRes + uT*137.0, vec2(12.9898,78.233)))*43758.5453);\n" +
        " c += (g-0.5)*uGrain;\n" +
        " c *= uFade;\n" +
        " vec3 e = pow(max(c,0.0), vec3(1.0/2.2));\n" +
        /* A touch of contrast, applied after the encode rather than before it:
         in linear the same curve mostly crushes the shadows, and this frame is
         nearly all shadow. Pivoted low, at 0.30, so it deepens the night
         without pulling the lit paper of the hall down with it. */
        " e = clamp((e - 0.30) * 1.00 + 0.30, 0.0, 1.0);\n" +
        " gl_FragColor = vec4( e, 1.0 );\n" +
        "}",
    });
  }
  function pass(mat, target, additive) {
    POST.quad.material = mat;
    renderer.setRenderTarget(target || null);
    if (!additive) renderer.clear(true, false, false);
    renderer.render(POST.qScene, POST.cam);
  }
  function renderPost() {
    const L = POST.levels;
    POST.bright.uniforms.tS.value = POST.scene.texture;
    pass(POST.bright, L[0].a);
    for (let i = 0; i < L.length; i++) {
      if (i > 0) {
        POST.up.blending = THREE.NoBlending;
        POST.up.uniforms.uAmt.value = 1;
        POST.up.uniforms.tS.value = L[i - 1].a;
        pass(POST.up, L[i].a);
      }
      POST.blur.uniforms.tS.value = L[i].a;
      POST.blur.uniforms.uDir.value.set(1 / L[i].w, 0);
      pass(POST.blur, L[i].b);
      POST.blur.uniforms.tS.value = L[i].b;
      POST.blur.uniforms.uDir.value.set(0, 1 / L[i].h);
      pass(POST.blur, L[i].a);
    }
    POST.up.blending = THREE.AdditiveBlending;
    POST.up.uniforms.uAmt.value = 0.52;
    for (let i = L.length - 1; i > 0; i--) {
      POST.up.uniforms.tS.value = L[i].a;
      pass(POST.up, L[i - 1].a, true);
    }
    POST.comp.uniforms.tS.value = POST.scene.texture;
    POST.comp.uniforms.tB.value = L[0].a;
    pass(POST.comp, null);
  }

  /* ================================================= 8 · the camera rig */
  const CAM = [
    { p: [0.0, 4.05, 13.6], t: [0.0, 6.6, -18.0], fov: 36 } /* 0 hero        */,
    {
      p: [-5.6, 2.35, 11.6],
      t: [1.2, 5.6, -14.0],
      fov: 48,
    } /* 1 the sanmon  */,
    { p: [1.2, 3.6, 2.2], t: [-0.6, 7.5, -22.0], fov: 40 } /* 2 gardens     */,
    { p: [5.2, 2.1, -3.4], t: [-2.6, 7.0, -20.0], fov: 46 } /* 3 craft       */,
    {
      p: [0.0, 7.6, -16.0],
      t: [0.0, 13.0, -40.0],
      fov: 42,
    } /* 4 afterlight  */,
    {
      p: [0.0, 10.5, -20.0],
      t: [0.0, 3.0, -34.0],
      fov: 46,
    } /* 5 footer      */,
  ];
  const RIG = {
    prog: 0,
    smooth: 0,
    mx: 0,
    my: 0,
    tmx: 0,
    tmy: 0,
    intro: 0,
    focus: -1,
    focusAmt: 0,
  };
  let curveP, curveT, tmpCam;

  function buildRig() {
    curveP = new THREE.CatmullRomCurve3(
      CAM.map((c) => new THREE.Vector3(c.p[0], c.p[1], c.p[2])),
      false,
      "catmullrom",
      0.42,
    );
    curveT = new THREE.CatmullRomCurve3(
      CAM.map((c) => new THREE.Vector3(c.t[0], c.t[1], c.t[2])),
      false,
      "catmullrom",
      0.42,
    );
    tmpCam = new THREE.PerspectiveCamera(CAM[0].fov, vpW() / vpH(), 0.35, 220);
    camera.layers.enable(1);
    camera.layers.enable(2);
  }
  const _p = new THREE.Vector3(),
    _t = new THREE.Vector3(),
    _d = new THREE.Vector3();
  /* Every waypoint is composed for a wide frame. On a tall one the same
   numbers crop the gate in half, so the rig steps back along its own view
   axis and opens up a little instead of letting the sides fall away. */
  function aspectFix() {
    return clamp((1.62 - vpW() / vpH()) / 1.05, 0, 1);
  }
  function fitAspect(p, t, fov) {
    const nf = aspectFix();
    if (nf <= 0) return fov;
    _d.subVectors(p, t).normalize();
    p.addScaledVector(_d, nf * 8.2);
    p.y += nf * 1.1;
    return fov * (1 + nf * 0.4);
  }
  function applyCamera() {
    const N = CAM.length - 1;
    const u = clamp(RIG.smooth / N, 0, 1);
    curveP.getPoint(u, _p);
    curveT.getPoint(u, _t);
    const i = clamp(Math.floor(RIG.smooth), 0, N - 1),
      f = clamp(RIG.smooth - i, 0, 1);
    let fov = lerp(CAM[i].fov, CAM[i + 1].fov, f);

    fov = fitAspect(_p, _t, fov);

    /* the opening dolly: a long lens easing in from further back */
    const io = 1 - RIG.intro;
    _p.z += io * 5.6;
    _p.y += io * 0.65;
    fov += io * 8;

    /* parallax — a hand-held drift, never enough to break the frame */
    const par = 1 - smooth(0, 1.6, RIG.smooth) * 0.55;
    _p.x += RIG.mx * 0.62 * par;
    _p.y += RIG.my * 0.34 * par;
    _t.x -= RIG.mx * 0.2 * par;
    _t.y -= RIG.my * 0.12 * par;

    camera.position.copy(_p);
    camera.lookAt(_t);
    if (Math.abs(camera.fov - fov) > 1e-4) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  /* ============================================== 9 · scroll ↔ chapters */
  let SECS = options.getSections();
  let anchors = [],
    maxScroll = 1;
  function measure() {
    SECS = options.getSections();
    maxScroll = Math.max(1, document.documentElement.scrollHeight - vpH());
    anchors = SECS.map((el, i) => {
      if (i === 0) return 0;
      if (i === SECS.length - 1) return maxScroll;
      return clamp(
        el.offsetTop + el.offsetHeight * 0.5 - vpH() * 0.5,
        0,
        maxScroll,
      );
    });
    for (let i = 1; i < anchors.length; i++)
      anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
  }

  /* ============================================ 10 · the wordmark layout */
  function layoutWord() {
    if (!WORD.group) return;
    const c = CAM[0];
    const hp = new THREE.Vector3(c.p[0], c.p[1], c.p[2]);
    const ht = new THREE.Vector3(c.t[0], c.t[1], c.t[2]);
    tmpCam.fov = fitAspect(hp, ht, c.fov);
    tmpCam.aspect = vpW() / vpH();
    tmpCam.position.copy(hp);
    tmpCam.lookAt(ht);
    tmpCam.updateProjectionMatrix();
    tmpCam.updateMatrixWorld(true);
    const hit = (nx, ny) => {
      const v = new THREE.Vector3(nx, ny, 0.5)
        .unproject(tmpCam)
        .sub(tmpCam.position)
        .normalize();
      return tmpCam.position
        .clone()
        .addScaledVector(v, (WORD_Z - tmpCam.position.z) / v.z);
    };
    const L = hit(-1, 0),
      R = hit(1, 0);
    /* Judge the frame by its shape, not its width. What forces the word up and
     in is a *tall* frame, and a 768-wide tablet held upright is as tall as a
     phone — on a width test it took the desktop baseline and sat below the
     fold with only the top of the G showing. */
    const narrow = vpW() / vpH() < 1.05;
    /* Four wide-tracked letters reach the frame edge exactly; pushing past it,
     as the six-letter word could afford to, decapitates the K and the E. The
     narrow branch is held a little inside the edge because a phone frame has
     no gutter to lose the tracking that trails the final letter into. */
    const fill = narrow ? 0.96 : 1.0;
    const s = ((R.x - L.x) * fill) / WORD.ink.w;
    /* on a tall frame the mounds sit near mid-height, so the baseline has to
     ride above them or the whole word disappears into the grass */
    const base = hit(0, narrow ? -0.16 : -0.585);
    WORD.group.scale.setScalar(s);
    WORD.group.position.set(-WORD.ink.cx * s, base.y, WORD_Z);
    WORD.rise = WORD.ink.asc * s * 1.25;
  }

  /* ============================================ 12 · the card viewports */
  const CARDS = [];
  function buildCards() {
    const defs = [
      {
        p: [-2.0, 1.6, -2.0],
        t: [0, 10.0, -34.0],
        fov: 40,
      } /* the long climb */,
      {
        p: [4.2, 2.9, -9.5],
        t: [6.4, 2.9, -14.4],
        fov: 40,
      } /* lantern court  */,
      {
        p: [3.4, 2.4, 2.0],
        t: [-1.0, -0.6, -6.0],
        fov: 40,
      } /* the wet court  */,
      {
        p: [0.6, 3.4, -12.0],
        t: [0, 12.0, -40.0],
        fov: 26,
      } /* hero window    */,
    ];
    $$("[data-view]").forEach((el) => {
      const d = defs[+el.dataset.view];
      if (!d) return;
      const c = new THREE.PerspectiveCamera(d.fov, 4 / 5, 0.3, 200);
      c.position.set(d.p[0], d.p[1], d.p[2]);
      c.lookAt(d.t[0], d.t[1], d.t[2]);
      c.layers.set(0);
      c.userData = {
        home: c.position.clone(),
        look: new THREE.Vector3(d.t[0], d.t[1], d.t[2]),
        push: 0,
        want: 0,
      };
      CARDS.push({
        cam: c,
        el: el.querySelector("[data-frame]") || el,
        rect: null,
      });
      const enter = () => (c.userData.want = 1),
        leave = () => (c.userData.want = 0);
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      cardListeners.push({ el, enter, leave });
    });
  }
  /* A render target keeps its own viewport/scissor — renderer.setScissor()
   only ever reaches the default framebuffer, so the region has to be set on
   whichever surface we are actually drawing into, and re-bound to take. */
  const _push = new THREE.Vector3();
  function setRegion(rt, x, y, w, h) {
    if (rt) {
      const pr = renderer.getPixelRatio();
      rt.viewport.set(x * pr, y * pr, w * pr, h * pr);
      rt.scissor.set(x * pr, y * pr, w * pr, h * pr);
      rt.scissorTest = true;
      renderer.setRenderTarget(rt);
    } else {
      renderer.setViewport(x, y, w, h);
      renderer.setScissor(x, y, w, h);
      renderer.setScissorTest(true);
    }
  }
  function clearRegion(rt) {
    if (rt) {
      rt.viewport.set(0, 0, rt.width, rt.height);
      rt.scissor.set(0, 0, rt.width, rt.height);
      rt.scissorTest = false;
      renderer.setRenderTarget(rt);
    } else {
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, vpW(), vpH());
      renderer.setScissor(0, 0, vpW(), vpH());
    }
  }
  function cardBuffer(C, w, h) {
    const pr = Math.min(renderer.getPixelRatio(), 2);
    const W = Math.max(8, Math.round(w * pr)),
      H = Math.max(8, Math.round(h * pr));
    if (C.rt && C.rt.width === W && C.rt.height === H) return C.rt;
    if (C.rt) C.rt.dispose();
    C.rt = new THREE.WebGLRenderTarget(W, H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    });
    C.dirty = true;
    return C.rt;
  }
  function aimCard(C, aspect) {
    const c = C.cam,
      u = c.userData;
    c.aspect = aspect;
    c.updateProjectionMatrix();
    _push.subVectors(u.look, u.home).normalize();
    c.position.copy(u.home).addScaledVector(_push, u.push * 0.55);
    c.lookAt(u.look);
  }
  /* Each viewport keeps its own buffer and only re-renders when it is moving
   or when its slot in the refresh rota comes round — the views are static,
   so paying for four scene traversals every frame buys nothing. */
  /* The blit lands in the composite at the element's screen rect, and the canvas
   knows nothing about the DOM stacked over it — so a card the page has faded
   goes on painting a live view into the frame with no card around it, which is
   what put a second lit hall in the corner once the hero exit started dimming
   the preview. Cull on the element's effective opacity, not just its rect.

   Below full opacity is the right place to stop: the card's own still is
   opaque, so the view behind it only ever shows through by (1 − alpha). At
   alpha just under one that is nothing, and the cut is invisible. */
  function cardAlpha(el) {
    let a = 1;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.display === "none" || s.visibility === "hidden") return 0;
      a *= +s.opacity;
      if (a < 0.001) return 0;
    }
    return a;
  }
  function renderCards(rt) {
    if (!CARDS.length) return;
    let drew = false;
    for (let i = 0; i < CARDS.length; i++) {
      const C = CARDS[i],
        r = C.el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vpH() + 40 || r.width < 4) continue;
      if (cardAlpha(C.el) < 0.995) continue;
      /* a card carrying cloth has no background left of its own, so the blit
       would show through the fabric's rounded corners and past its edges */
      if (C.el.classList.contains("on-cloth")) continue;
      if (!WANT_POST) {
        /* debug path: straight in */
        setRegion(rt, r.left, vpH() - r.bottom, r.width, r.height);
        renderer.clear(true, true, false);
        aimCard(C, r.width / r.height);
        renderer.render(scene, C.cam);
        C.el.dataset.gmpViewReady = "true";
        drew = true;
        continue;
      }
      const buf = cardBuffer(C, r.width, r.height);
      const u = C.cam.userData;
      if (
        C.dirty ||
        Math.abs(u.push - u.want) > 0.002 ||
        (FRAME + i * 7) % 24 === 0
      ) {
        aimCard(C, r.width / r.height);
        renderer.setRenderTarget(buf);
        renderer.clear(true, true, false);
        renderer.render(scene, C.cam);
        C.dirty = false;
      }
      setRegion(rt, r.left, vpH() - r.bottom, r.width, r.height);
      POST.up.blending = THREE.NoBlending;
      POST.up.uniforms.uAmt.value = 1;
      POST.up.uniforms.tS.value = buf.texture;
      pass(POST.up, rt);
      C.el.dataset.gmpViewReady = "true";
      drew = true;
    }
    if (drew) clearRegion(rt);
  }

  /* ==================================================== 13 · the machine */
  let running = false,
    tPrev = 0,
    clock = 0,
    fadeIn = 0;
  const INTRO = { t0: 0 };

  function resize() {
    const w = vpW(),
      h = vpH();
    document.documentElement.style.setProperty("--vw", w + "px");
    renderer.setPixelRatio(
      Math.min(devicePixelRatio || 1, DPR_CAP) * PERF.scale,
    );
    renderer.setSize(w, h, true);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const pw = renderer.domElement.width,
      ph = renderer.domElement.height;
    if (WANT_POST && POST.scene) {
      POST.scene.setSize(pw, ph);
      POST.comp.uniforms.uRes.value.set(pw, ph);
      let lw = Math.max(2, pw >> 1),
        lh = Math.max(2, ph >> 1);
      POST.levels.forEach((L) => {
        L.a.setSize(lw, lh);
        L.b.setSize(lw, lh);
        L.w = lw;
        L.h = lh;
        lw = Math.max(2, lw >> 1);
        lh = Math.max(2, lh >> 1);
      });
    }
    /* multisampling is the first thing to go when the budget tightens */
    if (POST.scene) {
      const want = !LOW && PERF.scale > 0.78 ? 2 : 0;
      if (POST.scene.samples !== want) {
        POST.scene.samples = want;
        POST.scene.dispose();
      }
    }
    CARDS.forEach((C) => {
      C.dirty = true;
    });
    if (WANT_SHADOW && WORLD.key) WORLD.key.shadow.needsUpdate = true;
    if (WORLD.embers)
      WORLD.embers.material.uniforms.uSize.value =
        h * renderer.getPixelRatio() * 0.5;
    if (WISP.mesh)
      WISP.mesh.material.uniforms.uPx.value = h * renderer.getPixelRatio();
    placeMoon();
    layoutWord();
    measure();
  }

  function updateWorld(dt) {
    WORLD.uT.value = clock;
    WORLD.tick?.(dt, clock);

    /* the focused chapter warms the lanterns and swells the disc */
    RIG.focusAmt = damp(RIG.focusAmt, RIG.focus >= 0 ? 1 : 0, 5, dt);
    const pulse = Math.sin(clock * 1.9) * 0.5 + 0.5;
    const f = RIG.focusAmt;
    if (WORLD.hallHalo)
      WORLD.hallHalo.material.opacity =
        0.3 + f * 0.14 + Math.sin(clock * 0.6) * 0.035;
    if (WORLD.hallLight)
      WORLD.hallLight.intensity =
        3.4 * (1 + f * 0.3) * (1 + Math.sin(clock * 0.43) * 0.045);
    /* the moon only breathes — the haze in front of it is what actually moves */
    if (WORLD.moonHalo)
      WORLD.moonHalo.material.opacity =
        0.44 + f * 0.1 + Math.sin(clock * 0.34) * 0.05;
    if (WORLD.lanternLights)
      WORLD.lanternLights.forEach((l, i) => {
        l.intensity =
          2.6 *
          (1 + f * 0.55) *
          (0.86 +
            0.22 * Math.sin(clock * (2.3 + i * 0.7) + i * 2.1) +
            0.1 * pulse);
      });
    if (WORLD.lanternGlows)
      WORLD.lanternGlows.forEach((g) => {
        g.quaternion.copy(camera.quaternion);
      });

    /* haze slides across the courtyard */
    if (WORLD.haze)
      WORLD.haze.forEach((h) => {
        h.position.x =
          h.userData.x0 + Math.sin(clock * h.userData.sp + h.userData.ph) * 5.5;
        h.quaternion.copy(camera.quaternion);
      });

    /* ripples on the standing water */
    if (WORLD.ripples)
      WORLD.ripples.forEach((r) => {
        const u = r.userData;
        u.t += dt * u.sp;
        if (u.t > 4) {
          u.t = 0;
          u.x = (Math.random() - 0.5) * 22;
          u.z = -8 + Math.random() * 22;
        }
        const k = u.t / 4;
        const s = 0.3 + k * 4.2;
        r.scale.set(s, s, 1);
        r.position.set(u.x, 0.02, u.z);
        r.material.opacity = Math.sin(k * Math.PI) * 0.16;
      });

    /* the type rises from behind the grass, then dissolves as you close on it */
    if (WORD.group) {
      const near = smooth(0.02, 0.92, RIG.smooth);
      WORD.glyphs.forEach((g, i) => {
        const st = clamp((WORD.reveal - i * 0.075) / 0.62, 0, 1);
        const e = easeOut(st);
        g.position.y = g.userData.baseY - (1 - e) * (WORD.ink.asc * 1.15);
        g.material.opacity = e * (1 - near * 0.96);
        g.visible = g.material.opacity > 0.004;
      });
    }
    /* the cut-out layers dissolve as the camera reaches them, so the path can
     walk straight through the garden instead of steering around the veil */
    if (WORLD.fg)
      WORLD.fg.forEach((m) => {
        const a = smooth(0.9, 4.6, camera.position.z - m.position.z);
        m.material.opacity = a;
        m.visible = a > 0.006;
      });
    updateLeaves(dt);
    updateWisps(dt);
    if (CARDS.length)
      CARDS.forEach((C) => {
        const u = C.cam.userData;
        u.push = damp(u.push, u.want, 3.4, dt);
      });
  }

  let FRAME = 0;
  function render() {
    FRAME++;
    renderer.setRenderTarget(WANT_POST ? POST.scene : null);
    renderer.clear(true, true, false);
    renderer.render(scene, camera);
    renderCards(WANT_POST ? POST.scene : null);
    renderer.setRenderTarget(null);
    if (WANT_POST) {
      POST.comp.uniforms.uT.value = clock;
      POST.comp.uniforms.uFade.value = fadeIn;
      renderPost();
    }
  }

  function frame(now) {
    if (!running || disposed) return;
    const raw = (now - tPrev) / 1000 || 0;
    const dt = Math.min(raw, 0.05); /* animation never jumps … */
    tPrev = now;
    clock += dt;
    fadeIn = INTRO.t0 ? sat((now - INTRO.t0) / 700) : 1;

    if (!PERF.locked && clock > 2.2) {
      PERF.acc += raw;
      PERF.n++; /* … but the governor reads the truth */
      if (PERF.n >= 40 || PERF.acc > 0.9) {
        const avg = PERF.acc / PERF.n;
        PERF.acc = 0;
        PERF.n = 0;
        if (avg > 0.023 && PERF.scale > 0.55) {
          PERF.scale = Math.max(0.55, PERF.scale * (avg > 0.05 ? 0.64 : 0.85));
          resize();
        } else if (avg < 0.0138 && PERF.scale < 1) {
          PERF.scale = Math.min(1, PERF.scale + 0.08);
          resize();
        }
      }
    }
    RIG.prog = options.getProgress();
    const pointer = options.getPointer();
    RIG.tmx = pointer[0];
    RIG.tmy = pointer[1];
    RIG.smooth = REDUCE ? RIG.prog : damp(RIG.smooth, RIG.prog, 5.2, dt);
    RIG.mx = damp(RIG.mx, RIG.tmx, 2.6, dt);
    RIG.my = damp(RIG.my, RIG.tmy, 2.6, dt);
    if (INTRO.t0) {
      const el = (now - INTRO.t0) / 1000;
      RIG.intro = sat(el / 2.4);
      WORD.reveal = Math.min(1.2, el / 1.5);
    }

    applyCamera();
    updateWorld(dt);
    render();
    options.onFrame?.({ smooth: RIG.smooth, scale: PERF.scale });
    queue();
  }
  const TIMER = qs("driver", "raf") === "timer";
  function queue() {
    if (!running || disposed) return;
    frameHandle = TIMER
      ? setTimeout(() => frame(performance.now()), 16)
      : requestAnimationFrame(frame);
  }

  function clearCards() {
    pendingImages.forEach((img) => {
      img.onload = null;
      img.onerror = null;
    });
    pendingImages.clear();
    clothInstances.splice(0).forEach((c) => {
      c.inst.dispose();
      c.card.removeEventListener("pointerenter", c.enter);
      c.card.removeEventListener("pointerleave", c.leave);
      c.fr.classList.remove("on-cloth");
      c.out.remove();
    });
    cardListeners.splice(0).forEach((c) => {
      c.el.removeEventListener("mouseenter", c.enter);
      c.el.removeEventListener("mouseleave", c.leave);
    });
    CARDS.splice(0).forEach((c) => {
      delete c.el.dataset.gmpViewReady;
      c.rt?.dispose();
    });
  }
  function pause() {
    running = false;
    cancelDriver(frameHandle, TIMER);
    clearCards();
    cardsSuspended = true;
  }
  function resume() {
    if (disposed || running) return;
    if (cardsSuspended) {
      buildCards();
      buildCardCloth();
      cardsSuspended = false;
    }
    running = true;
    tPrev = performance.now();
    queue();
  }
  function refresh() {
    if (disposed) return;
    clearCards();
    buildCards();
    buildCardCloth();
    resize();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    pause();
    clearCards();
    canvas.removeEventListener("webglcontextlost", onLost);
    const geometries = new Set(),
      materials = new Set(),
      textures = new Set();
    scene?.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      const ms = Array.isArray(object.material)
        ? object.material
        : [object.material];
      ms.filter(Boolean).forEach((m) => materials.add(m));
      object.shadow?.map?.dispose();
    });
    POST.qScene?.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
    });
    [POST.up, POST.bright, POST.blur, POST.comp]
      .filter(Boolean)
      .forEach((m) => materials.add(m));
    materials.forEach((m) => {
      Object.values(m).forEach((v) => {
        if (v?.isTexture) textures.add(v);
      });
      Object.values(m.uniforms || {}).forEach((u) => {
        if (u.value?.isTexture) textures.add(u.value);
      });
    });
    textures.forEach((t) => t.dispose());
    materials.forEach((m) => m.dispose());
    geometries.forEach((g) => g.dispose());
    POST.scene?.dispose();
    POST.levels.forEach((l) => {
      l.a.dispose();
      l.b.dispose();
    });
    renderer?.dispose();
  }
  function onLost(event) {
    event.preventDefault();
    pause();
    options.onLost?.();
  }
  canvas.addEventListener("webglcontextlost", onLost);
  const control = options.world === "control";
  const jobs = [
    async () => {
      if (control)
        await document.fonts?.load(
          "600 320px " + (options.wordmarkFamily || "Wordmark"),
        );
    },
    () => {
      initGL();
      WORLD.uT = { value: 0 };
      buildRig();
      buildLights();
    },
    () => {
      if (control) buildShell();
      else if (options.world === "gmp")
        buildGmpWorld({
          THREE,
          scene,
          WORLD,
          surface,
          lib,
          texWood,
          texFloor,
          texStone,
          texSky,
          texRidge,
          tx,
          texGlow,
          hdr,
        });
    },
    () => {
      if (control) buildTemple();
    },
    () => {
      if (control) buildMoon();
    },
    () => {
      if (control) buildTorii();
    },
    () => {
      if (control) {
        buildRocks();
        buildLantern(7.4, -7, 1.15);
        buildLantern(-7.6, -5.2, 1);
        const stepAt = (z) => Math.max(0, (STAIR_Z0 - z) / STAIR_RUN - 0.5);
        [-14.4, -23.5].forEach((z, i) => {
          const y = (stepAt(z) + 1) * (PODIUM / STEPS) + 0.45;
          const x = (STAIR_W + (STEPS - stepAt(z)) * 0.052) / 2 + 0.45;
          buildLantern(x, z, i ? 0.95 : 0.9, y);
          buildLantern(-x, z, i ? 0.95 : 0.9, y);
        });
      }
    },
    () => {
      if (control) {
        buildMaple(71, 12.6, -13, 1.05);
        buildMaple(72, -11.8, -9.4, 0.95);
        buildMaple(73, 9.2, -19, 0.82);
        buildMaple(74, -14.5, -17.5, 1);
        buildMaple(75, 16.5, -6, 0.88);
      }
    },
    () => {
      if (control) buildForeground();
    },
    () => {
      if (control) buildWordmark();
      else if (
        options.world !== "careers" &&
        options.world !== "photo" &&
        options.world !== "gmp"
      )
        loadBrandPlane();
    },
    () => {
      if (options.world !== "photo" && options.world !== "careers") {
        buildAtmosphere();
        buildLeafFall();
        buildWisps();
        if (!control && WORLD.leaves) {
          const material = WORLD.leaves.mesh.material;
          material.map.dispose();
          material.map = tx(texWisp());
          material.color.set(0xdfe7e0);
          material.emissive.set(0x060a0d);
          material.emissiveIntensity = 0.12;
        }
      }
    },
    () => {
      initPost();
      buildCards();
      buildCardCloth();
      WORLD.fg?.forEach((m) => m.layers.set(1));
      WORD.glyphs.forEach((m) => m.layers.set(2));
      if (WORLD.rain) WORLD.rain.layers.set(1);
      if (WORLD.leaves) WORLD.leaves.mesh.layers.set(1);
      WORLD.ripples?.forEach((r) => r.layers.set(1));
      if (WANT_SHADOW && WORLD.key) {
        WORLD.key.shadow.autoUpdate = false;
        WORLD.key.shadow.needsUpdate = true;
      }
    },
  ];
  function loadBrandPlane() {
    if (!options.logoUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(
      options.logoUrl,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.encoding = THREE.sRGBEncoding;
        const width = texture.image.width,
          height = texture.image.height,
          group = new THREE.Group();
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(width, height),
          new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            fog: false,
            opacity: 0,
          }),
        );
        mesh.position.y = height / 2;
        mesh.userData.baseY = mesh.position.y;
        mesh.renderOrder = 12;
        mesh.frustumCulled = false;
        mesh.layers.set(2);
        group.add(mesh);
        group.position.z = WORD_Z;
        scene.add(group);
        WORD.group = group;
        WORD.glyphs = [mesh];
        WORD.ink = {
          xMin: -width / 2,
          xMax: width / 2,
          cx: 0,
          w: width,
          asc: height,
        };
        WORLD.brand = mesh;
        layoutWord();
      },
      undefined,
      () => {
        if (!disposed) options.onAssetError?.(options.logoUrl);
      },
    );
  }

  try {
    for (let i = 0; i < jobs.length; i++) {
      if (disposed || options.signal?.aborted)
        throw new DOMException("Cancelled", "AbortError");
      await withAbort(jobs[i](), options.signal);
      if (options.signal?.aborted)
        throw new DOMException("Cancelled", "AbortError");
      options.onLoad?.((i + 1) / jobs.length);
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
    if (disposed)
      return {
        dispose,
        pause,
        resume,
        resize: () => {},
        refresh: () => {},
        setReducedMotion: () => {},
        focus: () => {},
      };
    resize();
    INTRO.t0 = REDUCE ? performance.now() - 4000 : performance.now();
    resume();
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    dispose,
    pause,
    resume,
    resize,
    refresh,
    setReducedMotion(value) {
      REDUCE = value;
      if (value) pause();
    },
    focus(value) {
      RIG.focus = value === null ? -1 : value;
    },
    diagnostics() {
      return { RIG, WORLD, WORD, CAM, POST, renderer, scene, camera };
    },
  };
}
