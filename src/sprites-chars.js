/* sprites-chars.js — les 16 personnages jouables (Canvas 2D pur, voir STYLE.md).
   Chaque sprite est dessiné dans une boîte 100×100 centrée sur (0,0), tourné vers la droite.
   API globale : CHARS[key] = {name, draw(ctx, t, o)} et drawChar(ctx, key, x, y, size, t, o). */

const CHARS = (() => {
  const INK = '#1d1b2f', W = '#ffffff', LW = 4.5, PI = Math.PI, TAU = PI * 2;
  const P = {
    corail: '#ff6b4a', tournesol: '#ffc83d', turquoise: '#14b8a6', indigo: '#4f5bd5', rose: '#ff8fb1',
    feuille: '#5cc26b', ciel: '#7cc8f2', creme: '#fbf6ea', bois: '#9a6b4a', gris: '#8a8fa3', violet: '#8b5cf6',
  };

  // ---------- teintes dérivées (mélanges de la palette) ----------
  const rgb = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (...parts) => '#' + [0, 1, 2].map(k =>
    Math.round(parts.reduce((s, [c, w]) => s + rgb(c)[k] * w, 0)).toString(16).padStart(2, '0')).join('');
  const shadeCache = {};
  const shade = c => shadeCache[c] || (shadeCache[c] = mix([c, .78], [INK, .22])); // membre « arrière »
  const SKIN = {
    clair: mix([P.creme, .75], [P.corail, .1], [P.bois, .15]),
    moyen: mix([P.bois, .5], [P.creme, .3], [P.corail, .2]),
    mat: mix([P.bois, .75], [P.creme, .12], [P.corail, .13]),
    fonce: mix([P.bois, .85], [INK, .15]),
  };
  const HAIR = { brun: mix([P.bois, .5], [INK, .5]), chatain: P.bois, blond: P.tournesol, roux: P.corail };

  // ---------- primitives ----------
  const ink = (ctx, w = LW) => { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
  const fs = (ctx, fill, w = LW) => { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (w) { ink(ctx, w); ctx.stroke(); } };
  const ell = (ctx, x, y, rx, ry, fill, rot = 0, w) => { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); fs(ctx, fill, w); };
  const circ = (ctx, x, y, r, fill, w) => ell(ctx, x, y, r, r, fill, 0, w);
  const path = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
  const poly = (ctx, pts, fill, w) => { path(ctx, pts); ctx.closePath(); fs(ctx, fill, w); };
  const shape = (ctx, fill, fn, w) => { ctx.beginPath(); fn(); ctx.closePath(); fs(ctx, fill, w); };
  const rrect = (ctx, x, y, w, h, r, fill, lw) => shape(ctx, fill, () => {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  }, lw);
  // trait épais coloré avec contour encre (membres, tubes, cadres)
  const tube = (ctx, pts, color, w) => {
    path(ctx, pts); ink(ctx, w + LW); ctx.stroke();
    path(ctx, pts); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
  };
  // réduit le dessin autour du sol (y = 40) pour rester dans la boîte
  const fit = (ctx, k) => { ctx.translate(0, 40); ctx.scale(k, k); ctx.translate(0, -40); };
  // plusieurs formes fusionnées sous un seul contour encre
  const union = (ctx, fill, fns) => {
    fns.forEach(f => { ctx.beginPath(); f(); ink(ctx, LW * 2); ctx.stroke(); });
    fns.forEach(f => { ctx.beginPath(); f(); ctx.fillStyle = fill; ctx.fill(); });
  };
  const star = (ctx, x, y, R, r, fill, lw = 3, rot = -PI / 2) => shape(ctx, fill, () => {
    for (let i = 0; i < 10; i++) { const a = rot + i * PI / 5, d = i % 2 ? r : R; ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  }, lw);
  // reflet blanc (petit arc en haut à gauche)
  const shine = (ctx, x, y, r, a0 = -2.7, a1 = -1.75, w) => {
    ctx.save(); ctx.globalAlpha = .7; ctx.strokeStyle = W; ctx.lineCap = 'round'; ctx.lineWidth = w || Math.max(2, r * .35);
    ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); ctx.restore();
  };
  const shadow = (ctx, rx = 28, y = 41) => { ctx.fillStyle = 'rgba(29,27,47,.18)'; ctx.beginPath(); ctx.ellipse(0, y, rx, 4.5, 0, 0, TAU); ctx.fill(); };

  // ---------- visage ----------
  const blinking = (t, off = 0) => ((t + off) % 3.1 + 3.1) % 3.1 < .14;
  const eye = (ctx, x, y, r, t, off = 0) => {
    if (blinking(t, off)) { ink(ctx, 2.6); ctx.beginPath(); ctx.arc(x, y - r * .5, r * .9, .5, PI - .5); ctx.stroke(); return; }
    circ(ctx, x, y, r, W, 1.8);
    circ(ctx, x + r * .28, y + r * .05, r * .56, INK, 0);
    circ(ctx, x + r * .45, y - r * .22, r * .22, W, 0);
  };
  const eyes = (ctx, x1, x2, y, r, t, off) => { eye(ctx, x1, y, r, t, off); eye(ctx, x2, y, r * .92, t, off); };
  const smile = (ctx, x, y, r, w = 2.6) => { ink(ctx, w); ctx.beginPath(); ctx.arc(x, y - r * .5, r, .45, PI - .45); ctx.stroke(); };
  const blush = (ctx, x, y, r) => { ctx.save(); ctx.globalAlpha = .6; ell(ctx, x, y, r, r * .62, P.rose, 0, 0); ctx.restore(); };

  // ---------- squelette ----------
  // genou par cinématique inverse à deux segments égaux (dir = côté de pliure)
  const knee = (h, f, L, dir = 1) => {
    const dx = f[0] - h[0], dy = f[1] - h[1], d0 = Math.hypot(dx, dy) || 1, d = Math.min(d0, 2 * L - .01);
    const k = Math.sqrt(L * L - d * d / 4);
    return [(h[0] + f[0]) / 2 - dy / d0 * k * dir, (h[1] + f[1]) / 2 + dx / d0 * k * dir];
  };
  const polar = (o, a, l) => [o[0] + Math.sin(a) * l, o[1] + Math.cos(a) * l]; // a = 0 : vers le bas
  const wheel = (ctx, x, y, r, a) => {
    circ(ctx, x, y, r, P.gris);
    circ(ctx, x, y, r * .62, P.creme, 3);
    ink(ctx, 2.2);
    for (let i = 0; i < 3; i++) { const c = Math.cos(a + i * PI / 3) * r * .6, s = Math.sin(a + i * PI / 3) * r * .6; ctx.beginPath(); ctx.moveTo(x - c, y - s); ctx.lineTo(x + c, y + s); ctx.stroke(); }
    circ(ctx, x, y, Math.max(1.8, r * .16), P.gris, 2.2);
  };

  // ---------- fille : tête de 3/4 tournée vers la droite ----------
  function head(ctx, x, y, r, c, t) {
    const hair = c.hair, st = c.style;
    // cheveux arrière
    if (st === 'ponytail') { const s = Math.sin(t * (c.moving ? 9 : 2)) * .12; ell(ctx, x - r * 1.05, y + r * .2, r * .38, r * .78, hair, .55 + s); circ(ctx, x - r * .78, y - r * .3, r * .22, P.tournesol, 3); }
    if (st === 'puff') circ(ctx, x - r * .98, y + r * .25, r * .5, hair);
    if (st === 'buns') { circ(ctx, x - r * .72, y - r * .78, r * .38, hair); circ(ctx, x + r * .12, y - r * 1.0, r * .36, hair); }
    if (st === 'bob') ell(ctx, x - r * .3, y + r * .02, r * .98, r * 1.04, hair);
    if (st === 'long') shape(ctx, hair, () => {
      ctx.moveTo(x - r * .5, y - r * .7); ctx.quadraticCurveTo(x - r * 1.45, y + r * .4, x - r * 1.05, y + r * 1.75);
      ctx.quadraticCurveTo(x - r * .55, y + r * 1.9, x - r * .1, y + r * 1.5); ctx.lineTo(x + r * .2, y);
    });
    circ(ctx, x, y, r, c.skin);
    // frange / calotte
    if (!c.helmet) shape(ctx, hair, () => {
      ctx.arc(x, y, r + 1, PI * .8, PI * 1.82);
      ctx.quadraticCurveTo(x + r * .45, y - r * .32, x + r * .02, y - r * .48);
      ctx.quadraticCurveTo(x - r * .22, y - r * .2, x - r * .42, y + r * .3);
    });
    else {
      shape(ctx, c.helmet, () => { ctx.arc(x, y, r + 3, PI * .86, PI * 1.86); ctx.lineTo(x + r * .05, y - r * .5); });
      tube(ctx, [[x + r * .75, y - r * .5], [x + r * 1.18, y - r * .32]], c.helmet, 3); // visière
      ink(ctx, 2.4); ctx.beginPath(); ctx.moveTo(x - r * .3, y - r * 1.1); ctx.lineTo(x - r * .05, y - r * .55); ctx.moveTo(x + r * .2, y - r * 1.1); ctx.lineTo(x + r * .35, y - r * .62); ctx.stroke();
    }
    circ(ctx, x - r * .32, y + r * .22, r * .19, c.skin, 2.2); // oreille
    shine(ctx, x, y, r * .78, -2.75, -2.05, 2.6);
    if (c.mask) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); rrect(ctx, x - r * .12, y - r * .28, r * 1.3, r * .7, r * .3, c.mask, 2); ctx.restore(); }
    eyes(ctx, x + r * .2, x + r * .68, y + r * .07, r * .25, t, c.blinkOff || 0);
    smile(ctx, x + r * .5, y + r * .56, r * .17, 2);
    blush(ctx, x + r * .02, y + r * .45, r * .15);
  }

  // ---------- fille debout (marche quand moving) ----------
  function girl(ctx, t, o, c) {
    const m = o.moving, ph = t * 10, sw = m ? Math.sin(ph) * .5 : 0;
    const bob = m ? -Math.abs(Math.cos(ph)) * 2 : Math.sin(t * 2.2) * .6;
    ctx.save(); ctx.translate(0, bob);
    const sh = [1, -9], L = 23;
    const leg = (a, col, hx) => { const hip = [hx, 12], f = polar(hip, a, L); tube(ctx, [hip, f], col, 9); ell(ctx, f[0] + 2.5, f[1] + 1.5, 6.2, 3.8, c.shoes, 0, 3.5); };
    const arm = (a, col) => {
      const hnd = polar(sh, a, 18), el = polar(sh, a, 8);
      tube(ctx, [sh, hnd], c.skin, 6); tube(ctx, [sh, el], col, 9); circ(ctx, hnd[0], hnd[1], 3.6, c.skin, 3); return hnd;
    };
    if (c.back) c.back(ctx, t, o);
    leg(-sw - .1, shade(c.bottom), -3);
    arm(sw + .1, shade(c.top));
    if (c.dress) poly(ctx, [[-9, -13], [10, -13], [17, 20], [-16, 20]], c.top);
    else { rrect(ctx, -11, 3, 22, 14, 6, c.bottom); rrect(ctx, -11.5, -14, 23, 22, 8, c.top); }
    leg(sw + .1, c.bottom, 4);
    if (c.chest) c.chest(ctx, t, o);
    const hnd = arm(c.armA !== undefined ? c.armA : -sw + .25, c.top);
    if (c.hand) c.hand(ctx, hnd, t, o);
    if (!c.noHead) head(ctx, 3, -28, 17, Object.assign({ moving: m }, c), t);
    if (c.top_) c.top_(ctx, t, o);
    ctx.restore();
  }

  // ---------- quadrupède de profil : pattes ----------
  const legs4 = (ctx, t, m, xs, y, len, col, w, paw) => xs.forEach((x, i) => {
    const a = m ? Math.sin(t * 11 + (i % 2 ? PI : 0) + (i > 1 ? PI : 0)) * .45 : 0;
    const f = polar([x, y], a, len), c = i % 2 ? col : shade(col);
    tube(ctx, [[x, y], f], c, w); if (paw) ell(ctx, f[0] + 1.5, f[1] + 1, w * .65, w * .45, paw, 0, 3);
  });

  return {
    // 1 ─ Vélo
    velo: { name: 'Vélo', draw(ctx, t, o) {
      fit(ctx, 0.92);
      const m = o.moving, a = m ? t * 8 : .9, b = m ? Math.sin(t * 16) * .7 : Math.sin(t * 2.2) * .6, wa = m ? t * 8 : 0;
      shadow(ctx, 40);
      wheel(ctx, -26, 27, 13, wa); wheel(ctx, 26, 27, 13, wa);
      const cr = [0, 27], ped = k => [cr[0] + Math.cos(a + k) * 7.5, cr[1] + Math.sin(a + k) * 7.5];
      const hip = [-9, -4 + b * .3], sh = [2, -20 + b], grip = [13, -11];
      const legTo = (f, col) => { tube(ctx, [hip, knee(hip, f, 22, -1), f], col, 8); ell(ctx, f[0] + 2, f[1] - 1, 5.5, 3.4, P.tournesol, 0, 3.2); };
      legTo(ped(PI), shade(P.indigo));
      tube(ctx, [[-26, 27], cr, [-9, 1], [-26, 27]], P.corail, 4.5);
      tube(ctx, [[-9, 1], [16, -2], cr], P.corail, 4.5);
      tube(ctx, [[16, -2], [26, 27]], P.corail, 4.5);
      tube(ctx, [[16, -2], [16, -11], grip], P.gris, 3.5);
      circ(ctx, 0, 27, 4.5, P.gris, 3);
      ell(ctx, -10, -1, 7, 3, P.indigo, 0, 3.5);
      tube(ctx, [hip, sh], P.turquoise, 13);
      legTo(ped(0), P.indigo);
      tube(ctx, [sh, [8, -10 + b * .5], grip], SKIN.fonce, 5.5); tube(ctx, [sh, [5, -15 + b]], P.turquoise, 8);
      circ(ctx, grip[0], grip[1], 3.6, SKIN.fonce, 3);
      head(ctx, 8, -33 + b, 15, { skin: SKIN.fonce, hair: HAIR.brun, style: 'puff', helmet: P.ciel }, t);
    } },

    // 2 ─ Trottinette
    trottinette: { name: 'Trottinette', draw(ctx, t, o) {
      fit(ctx, 0.95);
      const m = o.moving, k = m ? (Math.sin(t * 7) + 1) / 2 : 0, b = m ? k * -1.2 : Math.sin(t * 2.2) * .6, wa = m ? t * 10 : 0;
      shadow(ctx, 36);
      const sk = SKIN.clair, hip = [-5, -1 + b], sh = [-1, -19 + b], grip = [14, -12];
      const legTo = (f, col, dir) => { tube(ctx, [hip, knee(hip, f, 13.5, dir), f], col, 7.5); ell(ctx, f[0] + 2.5, f[1] - 1, 6, 3.6, W, 0, 3.2); };
      wheel(ctx, -24, 35, 6, wa); wheel(ctx, 22, 35, 6, wa);
      rrect(ctx, -31, 26, 50, 6.5, 3.2, P.turquoise);
      legTo(m ? [-14 - k * 13, 23 + k * 11] : [-14, 23], shade(P.feuille), -1);
      tube(ctx, [[22, 35], [14, -12]], P.gris, 4.5);
      tube(ctx, [hip, sh], P.rose, 13);
      legTo([2, 23], P.feuille, -1);
      tube(ctx, [sh, [6, -11 + b * .5], grip], sk, 5.5); tube(ctx, [sh, [3, -14 + b]], P.rose, 8);
      ell(ctx, 15, -12, 3.2, 5, P.rose, 0, 3);
      circ(ctx, grip[0], grip[1], 3.6, sk, 3);
      head(ctx, 5, -32 + b, 15.5, { skin: sk, hair: HAIR.roux, style: 'ponytail', moving: m }, t);
    } },

    // 3 ─ Skate
    skate: { name: 'Skate', draw(ctx, t, o) {
      fit(ctx, 0.9);
      const m = o.moving, bob = m ? Math.sin(t * 8) * 1.3 : Math.sin(t * 2.2) * .6, wv = m ? Math.sin(t * 5) * .3 : Math.sin(t * 1.6) * .06;
      shadow(ctx, 36);
      const sk = SKIN.moyen, hip = [-1, -1 + bob], sh = [1, -18 + bob];
      [-17, 17].forEach(x => { circ(ctx, x, 36, 4.5, P.gris, 3.5); circ(ctx, x, 36, 1.6, P.creme, 0); });
      tube(ctx, [[-35, 24], [-28, 30], [28, 30], [35, 24]], P.feuille, 5);
      const legTo = (f, col, dir) => { tube(ctx, [hip, knee(hip, f, 15, dir), f], col, 8); ell(ctx, f[0] + 1.5, f[1] - .5, 6.2, 3.6, P.corail, 0, 3.2); };
      legTo([-15, 24], shade(P.violet), 1);
      const back = [-19, -9 + bob + wv * 12];
      tube(ctx, [sh, [-9, -12 + bob + wv * 6], back], shade(sk), 5.5); circ(ctx, back[0], back[1], 3.6, shade(sk), 3);
      rrect(ctx, -8, -4 + bob, 15, 10, 4, P.violet);
      tube(ctx, [hip, sh], P.tournesol, 13);
      legTo([14, 24], P.violet, -1);
      const fr = [20, -24 + bob - wv * 12];
      tube(ctx, [sh, [11, -18 + bob - wv * 6], fr], sk, 5.5); tube(ctx, [sh, [6, -18 + bob]], P.tournesol, 8);
      circ(ctx, fr[0], fr[1], 3.6, sk, 3);
      head(ctx, 5, -31 + bob, 15, { skin: sk, hair: HAIR.brun, style: 'buns', blinkOff: 1.3 }, t);
    } },

    // 4 ─ Voilier
    bateau: { name: 'Voilier', draw(ctx, t, o) {
      const m = o.moving, sp = m ? 5 : 2, bob = Math.sin(t * sp) * (m ? 2.2 : 1.2), roll = Math.sin(t * sp + 1) * (m ? .06 : .025);
      const rip = Math.sin(t * (m ? 9 : 3)) * (m ? 4 : 2);
      ctx.save(); ctx.translate(0, bob); ctx.rotate(roll);
      tube(ctx, [[0, 18], [0, -42]], P.bois, 4);
      poly(ctx, [[1, -43], [14 + rip * .6, -40], [1, -35]], P.corail, 3);
      shape(ctx, W, () => { ctx.moveTo(-3, -38); ctx.lineTo(-3, 13); ctx.lineTo(-31, 13); ctx.quadraticCurveTo(-28 - rip, -10, -3, -38); });
      ink(ctx, 3); ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(-20 - rip * .4, -10); ctx.stroke();
      shape(ctx, P.tournesol, () => { ctx.moveTo(3, -32); ctx.lineTo(3, 12); ctx.lineTo(27, 12); ctx.quadraticCurveTo(22 + rip, -8, 3, -32); });
      shine(ctx, -10, -2, 9, -2.6, -1.9, 2.5);
      shape(ctx, P.corail, () => { ctx.moveTo(-38, 14); ctx.lineTo(42, 10); ctx.quadraticCurveTo(34, 34, 22, 35); ctx.lineTo(-26, 35); ctx.quadraticCurveTo(-34, 30, -38, 14); });
      ctx.save(); ctx.globalAlpha = .7; tube(ctx, [[-33, 19], [34, 16]], W, 0); ctx.restore();
      shape(ctx, W, () => { ctx.moveTo(-35, 20); ctx.lineTo(38, 17); ctx.lineTo(37, 21); ctx.lineTo(-34, 24); }, 2.5);
      eyes(ctx, 10, 22, 26, 4.6, t);
      smile(ctx, 16, 32, 3.2);
      blush(ctx, 4, 30, 3);
      ctx.restore();
      const ph = m ? t * 4 : t;
      shape(ctx, P.ciel, () => {
        ctx.moveTo(-47, 34);
        for (let x = -47; x <= 47; x += 3) ctx.lineTo(x, 34 + Math.sin(x * .2 + ph * 2) * 2.2);
        ctx.lineTo(47, 44); ctx.lineTo(-47, 44);
      });
      shine(ctx, -30, 46, 10, -2.5, -1.9, 2.2);
    } },

    // 5 ─ Abeille
    abeille: { name: 'Abeille', draw(ctx, t, o) {
      const m = o.moving, hov = Math.sin(t * (m ? 7 : 3)) * 2.5, fl = Math.sin(t * (m ? 42 : 16));
      shadow(ctx, 24, 42);
      ctx.save(); ctx.translate(0, hov);
      const wingFill = mix([W, .8], [P.ciel, .2]);
      const wing = (x, y, rot, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, .35 + .65 * Math.abs(s)); ell(ctx, 0, -14, 10, 15, wingFill, 0, 3.5); ctx.restore(); };
      wing(-10, -12, -.5, fl);
      poly(ctx, [[-29, 4], [-40, 7], [-29, 10]], P.bois, 3);
      ell(ctx, -6, 6, 25, 19, P.tournesol);
      ctx.save(); ctx.beginPath(); ctx.ellipse(-6, 6, 23, 17, 0, 0, TAU); ctx.clip();
      ctx.fillStyle = INK; [-24, -12].forEach(x => { ctx.beginPath(); ctx.ellipse(x, 6, 3.6, 20, 0, 0, TAU); ctx.fill(); }); ctx.restore();
      shine(ctx, -6, 6, 14, -2.4, -1.6, 3);
      ink(ctx, 3); [-12, 0].forEach((x, i) => { const s = m ? Math.sin(t * 12 + i) * 2 : 0; ctx.beginPath(); ctx.moveTo(x, 23); ctx.lineTo(x + 2 + s, 30); ctx.stroke(); });
      wing(2, -12, .25, Math.sin(t * (m ? 42 : 16) + .6));
      ink(ctx, 3); ctx.beginPath(); ctx.moveTo(20, -14); ctx.quadraticCurveTo(20, -26, 15, -32); ctx.moveTo(26, -13); ctx.quadraticCurveTo(30, -26, 34, -30); ctx.stroke();
      circ(ctx, 15, -32, 3.4, P.corail, 2.8); circ(ctx, 34, -30, 3.4, P.corail, 2.8);
      circ(ctx, 23, 0, 15, P.tournesol);
      shine(ctx, 23, 0, 10, -2.6, -1.9, 2.6);
      eyes(ctx, 21, 30, -2, 4.6, t);
      smile(ctx, 26, 7, 3.4);
      blush(ctx, 17, 7, 2.8);
      ctx.restore();
    } },

    // 6 ─ Renard
    renard: { name: 'Renard', draw(ctx, t, o) {
      const m = o.moving, b = m ? -Math.abs(Math.sin(t * 11)) * 2 : Math.sin(t * 2.2) * .5, sw = Math.sin(t * (m ? 10 : 2)) * (m ? .18 : .08);
      shadow(ctx, 32);
      ctx.save(); ctx.translate(0, b);
      ctx.save(); ctx.translate(-20, 6); ctx.rotate(-.75 + sw);
      shape(ctx, P.corail, () => { ctx.moveTo(0, 4); ctx.quadraticCurveTo(-12, -10, -2, -30); ctx.quadraticCurveTo(10, -20, 6, 2); });
      shape(ctx, W, () => { ctx.moveTo(-6.5, -21); ctx.quadraticCurveTo(-5, -27, -2, -30); ctx.quadraticCurveTo(3, -27, 6, -20); ctx.quadraticCurveTo(0, -17, -6.5, -21); }, 3);
      ctx.restore();
      legs4(ctx, t, m, [-16, 14, -8, 20], 12, 20, P.corail, 6.5, P.bois);
      ell(ctx, -1, 7, 24, 13, P.corail);
      shape(ctx, W, () => { ctx.moveTo(4, 19); ctx.quadraticCurveTo(16, 18, 21, 6); ctx.lineTo(10, 14); }, 0);
      shine(ctx, -1, 7, 17, -2.4, -1.8, 2.8);
      poly(ctx, [[14, -16], [15, -35], [25, -20]], shade(P.corail));
      union(ctx, P.corail, [() => ctx.ellipse(24, -8, 14, 12.5, 0, 0, TAU),
        () => { ctx.moveTo(30, -16); ctx.quadraticCurveTo(40, -9, 45, -3); ctx.quadraticCurveTo(36, 3, 28, 2); ctx.closePath(); }]);
      shape(ctx, W, () => { ctx.moveTo(16, -1); ctx.quadraticCurveTo(22, 5, 30, 3); ctx.quadraticCurveTo(38, 2, 44, -2); ctx.quadraticCurveTo(34, -4, 26, -4); }, 0);
      circ(ctx, 44.5, -3.5, 3, INK, 0);
      poly(ctx, [[20, -18], [27, -38], [33, -16]], P.corail);
      poly(ctx, [[24, -20], [27, -31], [30, -19]], P.rose, 0);
      eye(ctx, 29, -11, 4.6, t);
      smile(ctx, 36, 1, 3);
      blush(ctx, 24, -2, 3);
      ctx.restore();
    } },

    // 7 ─ Chat
    chat: { name: 'Chat', draw(ctx, t, o) {
      const m = o.moving, b = m ? -Math.abs(Math.sin(t * 10)) * 1.6 : Math.sin(t * 2.2) * .5, sw = Math.sin(t * (m ? 8 : 1.8)) * 5;
      shadow(ctx, 30);
      ctx.save(); ctx.translate(0, b);
      tube(ctx, [[-18, 4], [-30, -2], [-34 + sw * .4, -16], [-28 + sw, -28]], P.gris, 7);
      legs4(ctx, t, m, [-14, 12, -6, 18], 14, 19, P.gris, 7, W);
      ell(ctx, -2, 9, 22, 13, P.gris);
      ctx.save(); ctx.globalAlpha = .5; ink(ctx, 3); ctx.beginPath(); [-14, -6].forEach(x => { ctx.moveTo(x, -3); ctx.quadraticCurveTo(x + 2, 2, x, 6); }); ctx.stroke(); ctx.restore();
      shine(ctx, -2, 9, 16, -2.4, -1.8, 2.8);
      poly(ctx, [[10, -16], [12, -33], [22, -21]], shade(P.gris));
      circ(ctx, 21, -9, 15, P.gris);
      poly(ctx, [[17, -20], [25, -36], [32, -18]], P.gris);
      poly(ctx, [[21, -21], [25, -30], [28, -20]], P.rose, 0);
      ell(ctx, 30, -3, 8, 6, W, 0, 3);
      eyes(ctx, 22, 31, -12, 4.5, t, .7);
      ell(ctx, 32, -6.5, 2.5, 1.8, P.rose, 0, 2);
      ink(ctx, 1.8); ctx.beginPath(); ctx.moveTo(36, -3); ctx.lineTo(45, -5); ctx.moveTo(36, -1); ctx.lineTo(45, 1); ctx.stroke();
      smile(ctx, 31, -1, 2.4, 2.2);
      blush(ctx, 18, -2, 3);
      shine(ctx, 21, -9, 10, -2.7, -2, 2.4);
      tube(ctx, [[12, 2], [16, 5], [21, 6]], P.rose, 3.5); circ(ctx, 17, 9, 3.2, P.tournesol, 2.6);
      ctx.restore();
    } },

    // 8 ─ Tortue
    tortue: { name: 'Tortue', draw(ctx, t, o) {
      const m = o.moving, hb = m ? Math.sin(t * 6) * 1.8 : Math.sin(t * 1.5) * 1.2, sk = mix([P.feuille, .4], [P.tournesol, .6]);
      shadow(ctx, 38);
      const lg = (x, i, c) => { const a = m ? Math.sin(t * 7 + i * PI) * .4 : 0, f = polar([x, 24], a, 11); tube(ctx, [[x, 24], f], c, 10); };
      lg(-14, 1, shade(sk)); lg(18, 0, shade(sk));
      poly(ctx, [[-30, 24], [-40, 27], [-30, 30]], sk, 3.5);
      tube(ctx, [[18, 20], [28, 10 + hb]], sk, 12);
      ell(ctx, 33, 4 + hb, 13, 11.5, sk);
      shine(ctx, 33, 4 + hb, 8, -2.7, -2, 2.3);
      eyes(ctx, 33, 42, 1 + hb, 4.6, t, 1.9);
      smile(ctx, 38, 10 + hb, 3);
      blush(ctx, 28, 9 + hb, 2.8);
      lg(-22, 0, sk); lg(10, 1, sk);
      shape(ctx, P.feuille, () => { ctx.ellipse(-4, 24, 31, 30, 0, PI, TAU); });
      const pl = mix([P.feuille, .55], [P.tournesol, .45]);
      poly(ctx, [[-11, 0], [3, 0], [8, 12], [-4, 18], [-16, 12]], pl, 3);
      poly(ctx, [[-28, 17], [-21, 5], [-17, 13], [-21, 20]], pl, 3);
      poly(ctx, [[19, 5], [9, 12], [12, 20], [23, 18]], pl, 3);
      tube(ctx, [[-35, 24], [27, 24]], P.tournesol, 6);
      shine(ctx, -4, 24, 23, -2.5, -1.9, 3);
    } },

    // 9 ─ Manchot
    pingouin: { name: 'Manchot', draw(ctx, t, o) {
      const m = o.moving, w = m ? Math.sin(t * 10) * .12 : 0, fl = m ? Math.sin(t * 10) * .35 : Math.sin(t * 2) * .05;
      shadow(ctx, 24);
      const lift = i => m ? Math.max(0, Math.sin(t * 10 + i * PI)) * 3 : 0;
      ell(ctx, -6, 37 - lift(0), 8, 4, shade(P.tournesol), 0, 3.5);
      ctx.save(); ctx.translate(0, 38); ctx.rotate(w); ctx.translate(0, -38);
      const br = Math.sin(t * 2.2) * .5;
      ell(ctx, 0, 2 - br, 22, 33 + br, P.indigo);
      shape(ctx, W, () => { ctx.moveTo(-4, -18); ctx.quadraticCurveTo(4, -30, 16, -22); ctx.quadraticCurveTo(22, -10, 19, 8); ctx.quadraticCurveTo(16, 30, 2, 32); ctx.quadraticCurveTo(-10, 28, -8, 8); ctx.quadraticCurveTo(-8, -6, -4, -18); }, 3);
      shine(ctx, 0, 2, 17, -2.5, -1.9, 3);
      ctx.save(); ctx.translate(-14, -2); ctx.rotate(.25 + fl); ell(ctx, -2, 12, 6, 15, shade(P.indigo)); ctx.restore();
      eyes(ctx, 6, 14, -16, 4.6, t, .4);
      poly(ctx, [[15, -12], [29, -8], [15, -5]], P.tournesol, 3.5);
      blush(ctx, 3, -8, 3); blush(ctx, 17, -2, 2.4);
      ctx.restore();
      ell(ctx, 9, 37 - lift(1), 8, 4, P.tournesol, 0, 3.5);
    } },

    // 10 ─ Licorne
    licorne: { name: 'Licorne', draw(ctx, t, o) {
      fit(ctx, 0.95);
      const m = o.moving, b = m ? -Math.abs(Math.sin(t * 11)) * 2.2 : Math.sin(t * 2.2) * .5, sw = Math.sin(t * (m ? 10 : 2)) * (m ? 4 : 1.5);
      shadow(ctx, 32);
      ctx.save(); ctx.translate(0, b);
      tube(ctx, [[-24, 2], [-34, 6 + sw * .3], [-38, 20 + sw * .5]], P.violet, 8);
      tube(ctx, [[-26, 4], [-31, 12 + sw * .3], [-30, 25 + sw * .6]], P.rose, 6);
      legs4(ctx, t, m, [-17, 12, -9, 18], 14, 21, W, 7, P.violet);
      // corps + cou + tête fusionnés sous un seul contour
      const parts = [() => ctx.ellipse(-3, 8, 24, 13, 0, 0, TAU), () => ctx.ellipse(15, -6, 8, 15, .6, 0, TAU),
        () => ctx.ellipse(25, -19, 11, 10, 0, 0, TAU), () => ctx.ellipse(33, -13, 9, 7.5, .5, 0, TAU)];
      union(ctx, W, parts);
      shine(ctx, -3, 8, 17, -2.4, -1.8, 2.8);
      circ(ctx, 38, -12, 1.5, INK, 0);
      poly(ctx, [[17, -24], [19, -34], [24, -26]], W, 3);
      [[13, -20, 6.5, P.violet], [9, -10, 6, P.rose], [7, -1, 5, P.violet], [18, -27, 5.5, P.rose]].forEach(([x, y, r, c]) => circ(ctx, x, y, r, c, 3.5));
      poly(ctx, [[21, -27], [31, -48], [31, -24]], P.tournesol, 3.2);
      ink(ctx, 2); ctx.beginPath(); ctx.moveTo(24, -31); ctx.lineTo(31, -33); ctx.moveTo(27, -38); ctx.lineTo(31, -39); ctx.stroke();
      eye(ctx, 27, -19, 4.8, t, 1.1);
      smile(ctx, 35, -9, 2.6);
      blush(ctx, 25, -12, 3);
      ctx.restore();
    } },

    // 11 ─ Dino
    dino: { name: 'Dino', draw(ctx, t, o) {
      const m = o.moving, ph = t * 9, b = m ? -Math.abs(Math.sin(ph)) * 2 : Math.sin(t * 2.2) * .6, tw = Math.sin(t * (m ? 9 : 2)) * 2;
      shadow(ctx, 32);
      const lg = (i, c) => { const a = m ? Math.sin(ph + i * PI) * .45 : 0, h = [i ? 4 : -8, 20 + b], f = polar(h, a, 16); tube(ctx, [h, f], c, 10); ell(ctx, f[0] + 3, f[1] + 1.5, 8, 4, c, 0, 3.5); };
      lg(0, shade(P.feuille));
      ctx.save(); ctx.translate(0, b);
      shape(ctx, P.feuille, () => { ctx.moveTo(-14, -2); ctx.quadraticCurveTo(-36, 6, -46, 22 + tw); ctx.quadraticCurveTo(-30, 24, -10, 22); });
      const spike = (cx, cy, rx, ry, an, i) => { const pt = (d, l) => [cx + (rx + l) * Math.cos(an + d), cy + (ry + l) * Math.sin(an + d)];
        poly(ctx, [pt(-.36, -2), pt(0, 11), pt(.36, -2)], i % 2 ? P.tournesol : P.corail, 3); };
      [-2.75, -2.25, -1.75].forEach((an, i) => spike(-4, 6, 18, 19, an, i));
      [-2.5, -1.95].forEach((an, i) => spike(14, -20, 19, 14, an, i + 1));
      ell(ctx, -4, 6, 18, 19, P.feuille);
      ell(ctx, 1, 10, 10, 13, mix([P.tournesol, .55], [P.creme, .45]), 0, 3);
      tube(ctx, [[8, 0], [15, 4]], P.feuille, 5);
      ell(ctx, 14, -20, 19, 14, P.feuille);
      shine(ctx, 12, -21, 12, -2.7, -1.9, 2.8);
      eyes(ctx, 14, 24, -24, 5, t, 2.2);
      circ(ctx, 31, -18, 1.4, INK, 0);
      ink(ctx, 2.8); ctx.beginPath(); ctx.moveTo(14, -13); ctx.quadraticCurveTo(24, -7, 32, -13); ctx.stroke();
      blush(ctx, 9, -14, 3.4);
      shine(ctx, -4, 6, 13, -2.6, -2.1, 2.5);
      ctx.restore();
      lg(1, P.feuille);
    } },

    // 12 ─ Pieuvre
    pieuvre: { name: 'Pieuvre', draw(ctx, t, o) {
      const m = o.moving, sp = m ? 6 : 2, amp = m ? 6 : 2.5, bob = Math.sin(t * sp) * (m ? 2.5 : 1);
      shadow(ctx, 28, 42);
      ctx.save(); ctx.translate(0, bob);
      const ten = (x0, spread, i, col) => {
        const pts = []; for (let s = 0; s <= 1.001; s += .2) pts.push([x0 + spread * s + Math.sin(t * sp + i * 1.3 + s * 3) * amp * s, 2 + s * 34 - s * s * 4]);
        tube(ctx, pts, col, 7.5 - 0);
      };
      [-12, 2, 14].forEach((x, i) => ten(x, -6 + i * 4, i + 5, shade(P.rose)));
      [-20, -6, 8, 20].forEach((x, i) => ten(x, -10 + i * 7, i, P.rose));
      ell(ctx, 0, -14, 25, 23, P.rose);
      shine(ctx, -2, -16, 16, -2.6, -1.8, 3.2);
      [[-14, -24, 3.6], [-6, -32, 2.6], [-17, -12, 2.4]].forEach(([x, y, r]) => circ(ctx, x, y, r, P.violet, 0));
      eyes(ctx, 4, 16, -12, 5.5, t, .9);
      smile(ctx, 11, -1, 3.6);
      blush(ctx, -2, -3, 3.2); blush(ctx, 21, -4, 2.6);
      ctx.restore();
    } },

    // 13 ─ Robot
    robot: { name: 'Robot', draw(ctx, t, o) {
      fit(ctx, 0.92);
      const m = o.moving, ph = t * 9, b = m ? -Math.abs(Math.sin(ph)) * 1.6 : Math.sin(t * 2.2) * .5, on = (t % 1) < .5;
      shadow(ctx, 26);
      const lift = i => m ? Math.max(0, Math.sin(ph + i * PI)) * 4 : 0;
      [[-11, 0], [3, 1]].forEach(([x, i]) => { rrect(ctx, x, 14 + b - lift(i), 8, 18, 3, i ? P.gris : shade(P.gris)); rrect(ctx, x - 2, 30 - lift(i), 13, 8, 3.5, P.indigo, 4); });
      ctx.save(); ctx.translate(0, b);
      const arm = (x, a, c) => { const h = polar([x, -2], a, 15); tube(ctx, [[x, -2], h], c, 5.5); circ(ctx, h[0], h[1], 4.2, P.corail, 3); };
      arm(-17, m ? Math.sin(ph) * .5 + .2 : .25, shade(P.gris));
      rrect(ctx, -18, -8, 34, 25, 7, P.turquoise);
      rrect(ctx, -8, -2, 16, 10, 3, P.creme, 3);
      circ(ctx, -3, 3, 2.2, P.corail, 2); circ(ctx, 3.5, 3, 2.2, P.tournesol, 2);
      shine(ctx, -9, 0, 6, -2.8, -1.8, 2.4);
      arm(15, m ? -Math.sin(ph) * .5 - .2 : -.25, P.gris);
      tube(ctx, [[0, -36], [0, -43]], P.gris, 3);
      circ(ctx, 0, -46, 4.5, on ? P.tournesol : P.gris, 3);
      if (on) { ctx.save(); ctx.globalAlpha = .35; circ(ctx, 0, -46, 7.5, P.tournesol, 0); ctx.restore(); }
      circ(ctx, -17, -21, 4, P.corail, 3);
      rrect(ctx, -16, -37, 34, 28, 8, mix([P.gris, .35], [W, .65]));
      rrect(ctx, -9, -32, 25, 18, 5, INK, 0);
      eyes(ctx, 0, 10, -25, 4.6, t, .5);
      ctx.strokeStyle = P.ciel; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(5, -20.5, 3.4, .4, PI - .4); ctx.stroke();
      shine(ctx, -6, -28, 8, -2.9, -2, 2.4);
      ctx.restore();
    } },

    // 14 ─ Astronaute
    astronaute: { name: 'Astronaute', draw(ctx, t, o) {
      fit(ctx, 0.92);
      const sk = SKIN.clair, suit = mix([W, .85], [P.ciel, .15]);
      shadow(ctx, 26);
      girl(ctx, t, o, {
        skin: sk, top: suit, bottom: suit, shoes: P.gris, noHead: true,
        back: c => rrect(c, -20, -15, 12, 26, 4, P.gris),
        chest: c => { circ(c, 3, -2, 3.6, P.corail, 2.6); rrect(c, -9.5, 4, 19, 4, 2, P.indigo, 2.6); },
        top_: c => {
          circ(c, 3, -28, 19, suit);
          circ(c, 6, -27, 13.5, P.ciel, 0);
          c.save(); c.beginPath(); c.arc(6, -27, 13.5, 0, TAU); c.clip();
          circ(c, 7, -25, 11.5, sk, 0);
          shape(c, HAIR.roux, () => { c.arc(7, -25, 12, PI * .75, PI * 1.85); c.quadraticCurveTo(12, -31, 6, -32); c.quadraticCurveTo(2, -29, 0, -21); }, 0);
          eyes(c, 9, 15, -24, 3.4, t, .6); smile(c, 12, -18, 2.4, 2); blush(c, 5, -19, 2.2);
          c.restore();
          circ(c, 6, -27, 13.5, null, 3);
          shine(c, 6, -27, 10, -2.8, -2.1, 2.6);
          shine(c, 3, -28, 16, -2.7, -2.2, 2.6);
          tube(c, [[3, -47], [3, -50]], P.gris, 2.5);
        },
      });
    } },

    // 15 ─ Magicienne
    magicienne: { name: 'Magicienne', draw(ctx, t, o) {
      const sk = SKIN.fonce, tw = .75 + .35 * Math.abs(Math.sin(t * 3));
      shadow(ctx, 24);
      ctx.save(); fit(ctx, .84);
      girl(ctx, t, o, {
        skin: sk, hair: HAIR.brun, style: 'long', top: P.violet, bottom: P.violet, shoes: P.indigo, dress: true, blinkOff: 2.4,
        armA: 1.75 + (o.moving ? Math.sin(t * 10) * .12 : Math.sin(t * 2) * .05),
        chest: c => { star(c, 3, 4, 3.6, 1.6, P.tournesol, 2.4); },
        hand: (c, h) => {
          const tip = [h[0] + 9, h[1] - 10];
          tube(c, [[h[0] - 2, h[1] + 2], tip], P.bois, 3);
          star(c, tip[0], tip[1], 7 * tw, 3 * tw, P.tournesol, 3);
          c.save(); c.globalAlpha = .5 + .5 * Math.sin(t * 4); star(c, tip[0] - 5, tip[1] - 11, 3, 1.2, W, 0); star(c, tip[0] + 8, tip[1] + 4, 2.4, 1, W, 0); c.restore();
        },
        top_: c => {
          const sw = o.moving ? Math.sin(t * 10) * 1.5 : Math.sin(t * 1.5);
          shape(c, P.indigo, () => { c.moveTo(-13, -41); c.quadraticCurveTo(-2, -54, -11 + sw, -62); c.quadraticCurveTo(4, -55, 19, -41); });
          star(c, 3, -48, 4, 1.7, P.tournesol, 2.4);
          ell(c, 3, -41, 21, 5, P.indigo);
          shine(c, -3, -41, 10, -2.9, -2.1, 2.4);
        },
      });
      ctx.restore();
    } },

    // 16 ─ Super-héroïne
    heroine: { name: 'Super-héroïne', draw(ctx, t, o) {
      const m = o.moving, sk = SKIN.mat;
      shadow(ctx, 30);
      girl(ctx, t, o, {
        skin: sk, hair: HAIR.brun, style: 'bob', top: P.turquoise, bottom: P.indigo, shoes: P.corail, mask: P.corail, blinkOff: 1.7,
        back: c => {
          const f = Math.sin(t * (m ? 12 : 3)), fl = m ? 1 : .35;
          shape(c, P.corail, () => {
            c.moveTo(-4, -12); c.lineTo(6, -12);
            c.quadraticCurveTo(0, 12, -6 - fl * 10, 30 + f * 2);
            c.quadraticCurveTo(-16 - fl * 14, 31 - f * 3, -28 - fl * 12, 22 + f * 4 * fl);
            c.quadraticCurveTo(-18, 6, -4, -12);
          });
          shine(c, -10, 4, 12, -2.6, -1.9, 2.5);
        },
        chest: c => { rrect(c, -9.5, 2.5, 19, 4.5, 2, P.tournesol, 2.6); star(c, 2, -5, 5, 2.2, P.tournesol, 2.4); },
      });
    } },
  };
})();

function drawChar(ctx, key, x, y, size, t, o = {}) {
  const c = CHARS[key];
  if (!c) return;
  const s = size / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(o.dir === -1 ? -s : s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  c.draw(ctx, t || 0, o);
  ctx.restore();
}
