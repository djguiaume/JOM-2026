/* sprites-world.js — objets, obstacles, arrivées, décors et fonds des 5 mondes.
   Canvas 2D pur, déterministe. Voir src/STYLE.md (boîte 100×100 centrée, contour encre).
   Globaux : THINGS, drawThing(ctx,key,x,y,size,t,o), WORLD_ART, drawWorld(ctx,worldKey,L,t). */

const SPRITES_WORLD_LIB = (function () {
  "use strict";
  const INK = "#1d1b2f", WHITE = "#ffffff";
  const CORAIL = "#ff6b4a", SOL = "#ffc83d", TURQ = "#14b8a6", INDIGO = "#4f5bd5", ROSE = "#ff8fb1",
        FEUILLE = "#5cc26b", CIEL = "#7cc8f2", CREME = "#fbf6ea", BOIS = "#9a6b4a", GRIS = "#8a8fa3", VIOLET = "#8b5cf6";
  const TAU = Math.PI * 2;

  /* ---------- couleurs ---------- */
  function hex(c) { c = c.replace("#", ""); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); }
  function mix(a, b, k) {
    const A = hex(a), B = hex(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
  }
  const D = c => mix(c, CREME, 0.22);          // décor : un peu moins saturé

  /* ---------- outils de dessin ---------- */
  function ink(ctx, w) { ctx.strokeStyle = INK; ctx.lineWidth = w || 4.5; ctx.lineJoin = "round"; ctx.lineCap = "round"; }
  function fs(ctx, fill, w) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } ink(ctx, w); ctx.stroke(); }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function circle(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  function shadow(ctx, rx, y, ry) {
    ctx.save(); ctx.fillStyle = "rgba(29,27,47,.18)"; ctx.beginPath();
    ctx.ellipse(0, y == null ? 40 : y, rx || 30, ry || 7, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  function shine(ctx, x, y, r, a0, a1, w) {
    ctx.save(); ctx.globalAlpha = 0.7; ctx.strokeStyle = WHITE; ctx.lineWidth = w || 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); ctx.restore();
  }
  function dot(ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 0.7 : a; ctx.fillStyle = WHITE; ctx.beginPath(); circle(ctx, x, y, r); ctx.fill(); ctx.restore();
  }
  // forme « bulle » : plusieurs cercles fusionnés avec un seul contour extérieur
  function blob(ctx, circles, fill, w) {
    w = w || 4.5;
    ctx.beginPath(); for (const c of circles) circle(ctx, c[0], c[1], c[2]);
    ink(ctx, w * 2); ctx.stroke(); ctx.fillStyle = fill; ctx.fill();
  }
  // trait épais avec contour encre (tiges, cous, branches)
  function tube(ctx, pathFn, fill, w) {
    ctx.beginPath(); pathFn(); ink(ctx, w + 9); ctx.stroke();
    ctx.beginPath(); pathFn(); ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke();
  }
  function starPath(ctx, x, y, n, r1, r2, rot) {
    for (let i = 0; i < n * 2; i++) {
      const a = (rot || 0) - Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r2 : r1;
      i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    ctx.closePath();
  }
  function sparkle(ctx, x, y, r, fill) {
    ctx.beginPath(); starPath(ctx, x, y, 4, r, r * 0.36, 0); fs(ctx, fill || SOL, 2.2);
  }
  function eye(ctx, x, y, r, t, px, py) {
    const blink = ((t + 0.37 * x) % 3.2 + 3.2) % 3.2 > 3.05;
    if (blink) { ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x, y + r * 0.5, x + r, y); ink(ctx, 3); ctx.stroke(); return; }
    ctx.beginPath(); circle(ctx, x, y, r); fs(ctx, WHITE, 3);
    ctx.beginPath(); circle(ctx, x + (px || 0) * r * 0.35, y + (py || 0) * r * 0.35, r * 0.52); ctx.fillStyle = INK; ctx.fill();
    dot(ctx, x + (px || 0) * r * 0.35 - r * 0.18, y + (py || 0) * r * 0.35 - r * 0.2, r * 0.17, 1);
  }
  // halo des objets à ramasser
  function halo(ctx, t) {
    const p = 0.5 + 0.5 * Math.sin(t * 3.2);
    ctx.save();
    ctx.globalAlpha = 0.2 + 0.1 * p; ctx.fillStyle = SOL; ctx.beginPath(); circle(ctx, 0, 0, 44 + 3 * p); ctx.fill();
    ctx.globalAlpha = 0.55 + 0.3 * p; ctx.strokeStyle = SOL; ctx.lineWidth = 4; ctx.beginPath(); circle(ctx, 0, 0, 43 + 3 * p); ctx.stroke();
    ctx.globalAlpha = 0.35 + 0.25 * p; ctx.strokeStyle = WHITE; ctx.lineWidth = 2.5; ctx.beginPath(); circle(ctx, 0, 0, 38 + 3 * p); ctx.stroke();
    ctx.restore();
    for (let k = 0; k < 2; k++) {
      const a = t * 1.1 + k * Math.PI + 0.6, s = 6 + 2.5 * Math.sin(t * 5 + k * 2);
      sparkle(ctx, Math.cos(a) * 38, Math.sin(a) * 38, s, k ? WHITE : SOL);
    }
  }
  // anneau pulsé des arrivées
  function goalRing(ctx, t) {
    ctx.save();
    for (let k = 0; k < 2; k++) {
      const ph = (t * 0.7 + k * 0.5) % 1;
      ctx.globalAlpha = (1 - ph) * 0.75; ctx.strokeStyle = SOL; ctx.lineWidth = 5;
      ctx.beginPath(); circle(ctx, 0, 4, 34 + ph * 14); ctx.stroke();
    }
    ctx.restore();
  }
  function ripples(ctx, y, w, t) {
    ctx.save(); ctx.strokeStyle = WHITE; ctx.lineWidth = 3.5; ctx.lineCap = "round";
    for (let k = 0; k < 2; k++) {
      const ph = (t * 0.6 + k * 0.5) % 1;
      ctx.globalAlpha = 0.75 * (1 - ph);
      ctx.beginPath(); ctx.ellipse(0, y, w + ph * 10, 6 + ph * 3, 0, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    ctx.restore();
  }

  /* =====================================================================
     THINGS
     ===================================================================== */
  const T = {};

  /* ---- Ville propre ---- */
  T.dechet = { kind: "item", draw(ctx, t) {
    halo(ctx, t); shadow(ctx, 22, 34, 5);
    ctx.save(); ctx.translate(0, Math.sin(t * 3) * 2); ctx.rotate(0.32);
    // paille
    tube(ctx, () => { ctx.moveTo(6, -24); ctx.lineTo(14, -44); }, CORAIL, 4);
    // gobelet
    ctx.beginPath(); ctx.moveTo(-20, -24); ctx.lineTo(20, -24); ctx.lineTo(14, 30); ctx.quadraticCurveTo(0, 34, -14, 30); ctx.closePath();
    fs(ctx, WHITE);
    ctx.save(); ctx.clip();
    ctx.fillStyle = TURQ; ctx.fillRect(-30, -4, 60, 14);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-20, -24); ctx.lineTo(20, -24); ctx.lineTo(14, 30); ctx.quadraticCurveTo(0, 34, -14, 30); ctx.closePath(); ink(ctx); ctx.stroke();
    // couvercle
    ctx.beginPath(); rr(ctx, -25, -31, 50, 10, 5); fs(ctx, CORAIL);
    shine(ctx, -4, 6, 16, Math.PI * 0.85, Math.PI * 1.15, 3.5);
    ctx.restore();
  } };

  T.voiture = { kind: "obstacle", draw(ctx, t) {
    shadow(ctx, 42, 34, 6);
    const b = Math.sin(t * 14) * 0.8;
    ctx.save(); ctx.translate(0, b - 4);
    ctx.beginPath();
    ctx.moveTo(-40, 22); ctx.lineTo(40, 22); ctx.quadraticCurveTo(46, 22, 46, 14); ctx.lineTo(46, 4);
    ctx.quadraticCurveTo(46, -4, 36, -5); ctx.lineTo(26, -6); ctx.lineTo(15, -25); ctx.quadraticCurveTo(12, -29, 7, -29);
    ctx.lineTo(-17, -29); ctx.quadraticCurveTo(-21, -29, -23, -25); ctx.lineTo(-32, -6); ctx.lineTo(-38, -5);
    ctx.quadraticCurveTo(-46, -4, -46, 6); ctx.lineTo(-46, 14); ctx.quadraticCurveTo(-46, 22, -40, 22); ctx.closePath();
    fs(ctx, CORAIL);
    // vitres
    ctx.beginPath(); ctx.moveTo(1, -23); ctx.lineTo(9, -23); ctx.lineTo(18, -8); ctx.lineTo(1, -8); ctx.closePath(); fs(ctx, CIEL, 3.5);
    ctx.beginPath(); ctx.moveTo(-17, -23); ctx.lineTo(-5, -23); ctx.lineTo(-5, -8); ctx.lineTo(-25, -8); ctx.closePath(); fs(ctx, CIEL, 3.5);
    // phares
    ctx.beginPath(); rr(ctx, 39, 0, 8, 7, 3); fs(ctx, SOL, 3);
    ctx.beginPath(); rr(ctx, -47, 0, 6, 7, 3); fs(ctx, ROSE, 3);
    // poignée
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(4, 0); ink(ctx, 3); ctx.stroke();
    shine(ctx, -6, -6, 20, Math.PI * 1.15, Math.PI * 1.45, 3.5);
    ctx.restore();
    // roues (tournent)
    for (const wx of [-25, 25]) {
      ctx.save(); ctx.translate(wx, 22);
      ctx.beginPath(); circle(ctx, 0, 0, 12); fs(ctx, INK, 3);
      ctx.beginPath(); circle(ctx, 0, 0, 6); fs(ctx, GRIS, 2.5);
      ctx.rotate(t * 9); ctx.strokeStyle = CREME; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.moveTo(0, -6); ctx.lineTo(0, 6); ctx.stroke();
      ctx.restore();
    }
  } };

  function recycleArrows(ctx, x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    for (let k = 0; k < 3; k++) {
      const a = k * TAU / 3, a0 = a + 0.3, a1 = a + 1.65;
      ctx.beginPath(); ctx.arc(0, 0, r, a0, a1); ctx.strokeStyle = WHITE; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke();
      const hx = Math.cos(a1) * r, hy = Math.sin(a1) * r, tx = -Math.sin(a1), ty = Math.cos(a1);
      ctx.beginPath();
      ctx.moveTo(hx + tx * 7, hy + ty * 7);
      ctx.lineTo(hx - Math.cos(a1) * 6, hy - Math.sin(a1) * 6);
      ctx.lineTo(hx + Math.cos(a1) * 6, hy + Math.sin(a1) * 6); ctx.closePath();
      ctx.fillStyle = WHITE; ctx.fill();
    }
    ctx.restore();
  }
  T.recyclage = { kind: "goal", draw(ctx, t) {
    goalRing(ctx, t); shadow(ctx, 34, 42, 7);
    ctx.save(); ctx.translate(0, Math.sin(t * 2.4) * 1.5);
    // bac
    ctx.beginPath(); ctx.moveTo(-32, -20); ctx.lineTo(32, -20); ctx.lineTo(26, 40); ctx.quadraticCurveTo(0, 44, -26, 40); ctx.closePath();
    fs(ctx, FEUILLE);
    // couvercle + poignée
    ctx.beginPath(); rr(ctx, -12, -42, 24, 10, 5); fs(ctx, TURQ, 4);
    ctx.beginPath(); rr(ctx, -40, -34, 80, 15, 7); fs(ctx, TURQ);
    // symbole
    ctx.beginPath(); circle(ctx, 0, 11, 19); ctx.fillStyle = mix(FEUILLE, INK, 0.25); ctx.fill();
    recycleArrows(ctx, 0, 11, 12, t * 0.8);
    shine(ctx, -6, 4, 24, Math.PI * 0.95, Math.PI * 1.2, 4);
    shine(ctx, -18, -28, 6, Math.PI, Math.PI * 1.5, 3);
    ctx.restore();
  } };

  /* ---- Livraison express ---- */
  T.colis = { kind: "item", draw(ctx, t) {
    halo(ctx, t); shadow(ctx, 30, 38, 6);
    ctx.save(); ctx.translate(0, Math.sin(t * 3) * 2);
    const front = mix(BOIS, CREME, 0.38), top = mix(BOIS, CREME, 0.58), side = mix(BOIS, CREME, 0.12);
    // dessus
    ctx.beginPath(); ctx.moveTo(-32, -12); ctx.lineTo(18, -12); ctx.lineTo(32, -26); ctx.lineTo(-18, -26); ctx.closePath(); fs(ctx, top);
    // côté
    ctx.beginPath(); ctx.moveTo(18, -12); ctx.lineTo(32, -26); ctx.lineTo(32, 20); ctx.lineTo(18, 34); ctx.closePath(); fs(ctx, side);
    // face
    ctx.beginPath(); rr(ctx, -32, -12, 50, 46, 3); fs(ctx, front);
    // scotch
    ctx.beginPath(); ctx.moveTo(-14, -12); ctx.lineTo(0, -26); ctx.lineTo(8, -26); ctx.lineTo(-6, -12); ctx.closePath(); fs(ctx, SOL, 3);
    ctx.beginPath(); rr(ctx, -14, -12, 8, 18, 1); fs(ctx, SOL, 3);
    // étiquette
    ctx.beginPath(); rr(ctx, -2, 14, 15, 11, 2); fs(ctx, WHITE, 3);
    ctx.beginPath(); ctx.moveTo(2, 18); ctx.lineTo(9, 18); ctx.moveTo(2, 21.5); ctx.lineTo(7, 21.5); ink(ctx, 1.8); ctx.stroke();
    shine(ctx, -18, 6, 8, Math.PI * 1.0, Math.PI * 1.5, 3.5);
    ctx.restore();
  } };

  T.chantier = { kind: "obstacle", draw(ctx, t) {
    shadow(ctx, 40, 40, 6);
    // pieds
    for (const lx of [-28, 28]) {
      ctx.beginPath(); rr(ctx, lx - 4, -8, 8, 44, 3); fs(ctx, GRIS, 3.5);
      ctx.beginPath(); rr(ctx, lx - 11, 32, 22, 8, 4); fs(ctx, mix(GRIS, INK, 0.3), 3.5);
    }
    // planche rayée
    ctx.save();
    ctx.beginPath(); rr(ctx, -44, -20, 88, 24, 6); ctx.fillStyle = WHITE; ctx.fill(); ctx.clip();
    ctx.fillStyle = CORAIL;
    for (let i = -6; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i * 18, 6); ctx.lineTo(i * 18 + 9, 6); ctx.lineTo(i * 18 + 33, -22); ctx.lineTo(i * 18 + 24, -22); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.beginPath(); rr(ctx, -44, -20, 88, 24, 6); ink(ctx); ctx.stroke();
    // lampe clignotante
    const on = Math.floor(t * 2.2) % 2 === 0;
    if (on) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = SOL; ctx.beginPath(); circle(ctx, 0, -32, 15); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); rr(ctx, -9, -26, 18, 7, 2); fs(ctx, INK, 2);
    ctx.beginPath(); ctx.arc(0, -26, 9, Math.PI, 0); ctx.closePath(); fs(ctx, on ? SOL : mix(SOL, BOIS, 0.45), 3.5);
    dot(ctx, -3, -31, 2);
    shine(ctx, -28, 4, 14, Math.PI * 1.2, Math.PI * 1.45, 3);
  } };

  T.maison = { kind: "goal", draw(ctx, t) {
    goalRing(ctx, t); shadow(ctx, 38, 42, 7);
    ctx.save(); ctx.translate(0, Math.sin(t * 2.4) * 1.5);
    // cheminée
    ctx.beginPath(); rr(ctx, 14, -40, 12, 24, 2); fs(ctx, BOIS);
    // murs
    ctx.beginPath(); rr(ctx, -32, -8, 64, 48, 4); fs(ctx, CREME);
    // toit
    ctx.beginPath(); ctx.moveTo(-44, -2); ctx.lineTo(0, -44); ctx.lineTo(44, -2); ctx.closePath(); fs(ctx, CORAIL);
    // porte
    ctx.beginPath(); ctx.moveTo(-18, 40); ctx.lineTo(-18, 16); ctx.arc(-9, 16, 9, Math.PI, 0); ctx.lineTo(0, 40); ctx.closePath(); fs(ctx, INDIGO);
    ctx.beginPath(); circle(ctx, -4, 28, 1.8); ctx.fillStyle = SOL; ctx.fill();
    // fenêtre allumée
    ctx.beginPath(); rr(ctx, 8, 6, 17, 15, 3); fs(ctx, SOL, 3.5);
    ctx.beginPath(); ctx.moveTo(16.5, 6); ctx.lineTo(16.5, 21); ctx.moveTo(8, 13.5); ctx.lineTo(25, 13.5); ink(ctx, 2.5); ctx.stroke();
    // coeur sur le toit
    ctx.save(); ctx.translate(0, -18); ctx.scale(0.55, 0.55);
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-14, -2, -8, -14, 0, -6); ctx.bezierCurveTo(8, -14, 14, -2, 0, 8); ctx.closePath();
    ctx.fillStyle = WHITE; ctx.fill(); ctx.restore();
    shine(ctx, -6, -6, 28, Math.PI * 1.05, Math.PI * 1.3, 3.5);
    ctx.restore();
  } };

  /* ---- Sauver les abeilles ---- */
  T.fleur = { kind: "item", draw(ctx, t) {
    halo(ctx, t); shadow(ctx, 16, 40, 4);
    ctx.save(); ctx.translate(0, 40); ctx.rotate(Math.sin(t * 2.2) * 0.07); ctx.translate(0, -40);
    tube(ctx, () => { ctx.moveTo(0, 38); ctx.quadraticCurveTo(-3, 22, 0, 6); }, FEUILLE, 5);
    ctx.beginPath(); ctx.ellipse(10, 26, 10, 5, -0.5, 0, TAU); fs(ctx, FEUILLE, 3.5);
    ctx.save(); ctx.translate(0, -8); ctx.rotate(Math.sin(t * 1.3) * 0.1);
    for (let i = 0; i < 5; i++) {
      const a = i * TAU / 5 - Math.PI / 2;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * 17, Math.sin(a) * 17, 13, 10, a, 0, TAU); fs(ctx, ROSE, 4);
    }
    ctx.beginPath(); circle(ctx, 0, 0, 12); fs(ctx, SOL, 4);
    ctx.beginPath(); circle(ctx, -4, -1, 1.8); circle(ctx, 4, -1, 1.8); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 2, 4, 0.2 * Math.PI, 0.8 * Math.PI); ink(ctx, 2); ctx.stroke();
    dot(ctx, -14, -16, 3);
    ctx.restore();
    ctx.restore();
  } };

  T.araignee = { kind: "obstacle", draw(ctx, t) {
    shadow(ctx, 32, 38, 6);
    const bob = Math.sin(t * 8) * 1.5;
    // pattes
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const ph = Math.sin(t * 12 + i * 1.7 + (s > 0 ? 0 : Math.PI)) * 3;
      const by = -4 + i * 6 + bob;
      tube(ctx, () => { ctx.moveTo(s * 14, by); ctx.lineTo(s * 33, by - 14 + i * 4 + ph); ctx.lineTo(s * 44, by + 6 + i * 5 + ph * 0.5); }, mix(VIOLET, INK, 0.45), 2.5);
    }
    ctx.save(); ctx.translate(0, bob);
    ctx.beginPath(); circle(ctx, 0, 4, 26); fs(ctx, VIOLET);
    // motif dos
    ctx.beginPath(); circle(ctx, 0, 20, 4.5); ctx.fillStyle = mix(VIOLET, INK, 0.3); ctx.fill();
    // joues
    ctx.save(); ctx.globalAlpha = 0.65; ctx.fillStyle = ROSE; ctx.beginPath(); circle(ctx, -17, 10, 4); circle(ctx, 17, 10, 4); ctx.fill(); ctx.restore();
    eye(ctx, -9, -2, 8, t, 0.2, 0.3); eye(ctx, 9, -2, 8, t, 0.2, 0.3);
    // sourcils froncés
    ctx.beginPath(); ctx.moveTo(-17, -14); ctx.lineTo(-4, -10); ctx.moveTo(17, -14); ctx.lineTo(4, -10); ink(ctx, 3.8); ctx.stroke();
    // sourire + crocs
    ctx.beginPath(); ctx.moveTo(-6, 13); ctx.lineTo(-3.5, 18); ctx.lineTo(-1, 13); ctx.closePath(); ctx.moveTo(1, 13); ctx.lineTo(3.5, 18); ctx.lineTo(6, 13); ctx.closePath();
    ctx.fillStyle = WHITE; ctx.fill(); ink(ctx, 1.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, 12); ctx.quadraticCurveTo(0, 15, 9, 12); ink(ctx, 3); ctx.stroke();
    shine(ctx, 0, 4, 20, Math.PI * 1.15, Math.PI * 1.4, 4);
    ctx.restore();
  } };

  T.ruche = { kind: "goal", draw(ctx, t) {
    goalRing(ctx, t); shadow(ctx, 38, 42, 7);
    ctx.save(); ctx.translate(0, Math.sin(t * 2.4) * 1.2);
    ctx.beginPath(); rr(ctx, -44, 30, 88, 11, 4); fs(ctx, BOIS);
    ctx.beginPath(); circle(ctx, 0, -40, 6); fs(ctx, mix(SOL, BOIS, 0.35), 3.5);
    const bands = [[34, -26], [52, -11], [66, 4], [78, 19]];
    for (const [w, y] of bands) { ctx.beginPath(); rr(ctx, -w / 2, y - 9, w, 18, 9); fs(ctx, SOL); }
    // entrée
    ctx.beginPath(); ctx.arc(0, 28, 9, Math.PI, 0); ctx.closePath(); fs(ctx, INK, 3);
    shine(ctx, -14, -8, 18, Math.PI * 1.0, Math.PI * 1.35, 3.5);
    ctx.restore();
    // petite abeille qui tourne
    const a = t * 2.2, bx = Math.cos(a) * 34, by = -22 + Math.sin(a) * 10 + Math.sin(t * 9) * 1.5;
    ctx.save(); ctx.translate(bx, by); if (Math.sin(a) < 0) ctx.scale(-1, 1);
    const wing = 0.6 + 0.4 * Math.abs(Math.sin(t * 30));
    ctx.beginPath(); ctx.ellipse(-1, -6, 4, 5 * wing, -0.3, 0, TAU); fs(ctx, WHITE, 2);
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0, 0, TAU); fs(ctx, SOL, 2.5);
    ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(-2, 5); ctx.moveTo(2.5, -5); ctx.lineTo(2.5, 5); ink(ctx, 2); ctx.stroke();
    ctx.beginPath(); circle(ctx, 5, -1, 1.3); ctx.fillStyle = INK; ctx.fill();
    ctx.restore();
  } };

  /* ---- Nettoyer le lac ---- */
  T.bouteille = { kind: "item", draw(ctx, t) {
    halo(ctx, t);
    ctx.save(); ctx.translate(0, 4 + Math.sin(t * 2.6) * 2); ctx.rotate(-0.12 + Math.sin(t * 2) * 0.06);
    ctx.beginPath();
    ctx.moveTo(-34, -12); ctx.lineTo(10, -12); ctx.quadraticCurveTo(18, -12, 22, -6); ctx.lineTo(28, -6); ctx.lineTo(28, 6);
    ctx.lineTo(22, 6); ctx.quadraticCurveTo(18, 12, 10, 12); ctx.lineTo(-34, 12); ctx.quadraticCurveTo(-40, 12, -40, 0); ctx.quadraticCurveTo(-40, -12, -34, -12); ctx.closePath();
    fs(ctx, mix(CIEL, WHITE, 0.45));
    ctx.beginPath(); rr(ctx, -18, -12, 20, 24, 1); fs(ctx, CORAIL, 3.5);
    ctx.beginPath(); rr(ctx, 27, -8, 11, 16, 3); fs(ctx, TURQ, 3.5);
    ctx.beginPath(); ctx.moveTo(-32, -5); ctx.lineTo(-22, -5); ctx.moveTo(6, -5); ctx.lineTo(12, -5);
    ctx.save(); ctx.globalAlpha = 0.8; ctx.strokeStyle = WHITE; ctx.lineWidth = 3.5; ctx.stroke(); ctx.restore();
    ctx.restore();
    ripples(ctx, 18, 32, t);
  } };

  T.cygne = { kind: "obstacle", draw(ctx, t) {
    const bob = Math.sin(t * 2.4) * 1.5;
    ripples(ctx, 26, 38, t);
    ctx.save(); ctx.translate(0, bob);
    // cou
    tube(ctx, () => { ctx.moveTo(14, 10); ctx.bezierCurveTo(34, -2, 10, -18, 20, -32); }, WHITE, 10);
    // corps
    ctx.beginPath();
    ctx.moveTo(-42, -10); ctx.quadraticCurveTo(-40, 24, -2, 26); ctx.quadraticCurveTo(30, 26, 32, 6);
    ctx.quadraticCurveTo(22, -4, 0, -2); ctx.quadraticCurveTo(-22, 0, -42, -10); ctx.closePath();
    fs(ctx, WHITE);
    // aile
    ctx.beginPath(); ctx.moveTo(-26, 4); ctx.quadraticCurveTo(-8, 22, 14, 10); ink(ctx, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(-30, -2, -34, -6); ink(ctx, 2.5); ctx.stroke();
    // tête
    ctx.beginPath(); circle(ctx, 24, -34, 10); fs(ctx, WHITE);
    ctx.beginPath(); ctx.moveTo(31, -39); ctx.quadraticCurveTo(46, -36, 47, -31); ctx.lineTo(31, -29); ctx.closePath(); fs(ctx, CORAIL, 3.5);
    ctx.beginPath(); circle(ctx, 31, -34, 3.5); ctx.fillStyle = INK; ctx.fill();
    eye(ctx, 23, -36, 4.6, t, 0.6, 0);
    ctx.beginPath(); ctx.moveTo(17, -44); ctx.lineTo(28, -41); ink(ctx, 3); ctx.stroke();
    ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = ROSE; ctx.beginPath(); circle(ctx, 20, -28, 2.8); ctx.fill(); ctx.restore();
    shine(ctx, -4, 22, 30, Math.PI * 1.25, Math.PI * 1.45, 3.5);
    ctx.restore();
  } };

  T.port = { kind: "goal", draw(ctx, t) {
    goalRing(ctx, t);
    ctx.save(); ctx.translate(0, Math.sin(t * 2) * 1);
    // ponton
    for (const px of [-36, 36]) { ctx.beginPath(); rr(ctx, px - 5, 18, 10, 26, 3); fs(ctx, mix(BOIS, INK, 0.25), 3.5); }
    ctx.beginPath(); rr(ctx, -46, 14, 92, 18, 4); fs(ctx, BOIS);
    ctx.beginPath(); for (const px of [-23, 0, 23]) { ctx.moveTo(px, 15); ctx.lineTo(px, 31); } ink(ctx, 2.5); ctx.stroke();
    // drapeau
    ctx.beginPath(); ctx.moveTo(38, 14); ctx.lineTo(38, -42); ink(ctx, 4); ctx.stroke();
    const fl = Math.sin(t * 5) * 3;
    ctx.beginPath(); ctx.moveTo(38, -42); ctx.quadraticCurveTo(48, -40 + fl, 50, -34); ctx.quadraticCurveTo(46, -30 - fl, 38, -26); ctx.closePath(); fs(ctx, SOL, 3.5);
    // bouée
    ctx.save(); ctx.translate(-4, -12); ctx.rotate(t * 0.4);
    ctx.beginPath(); ctx.arc(0, 0, 29, 0, TAU); ctx.arc(0, 0, 13, 0, TAU, true); ctx.fillStyle = CORAIL; ctx.fill("evenodd");
    ctx.fillStyle = WHITE;
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; ctx.beginPath(); ctx.arc(0, 0, 29, a, a + 0.55); ctx.arc(0, 0, 13, a + 0.55, a, true); ctx.closePath(); ctx.fill(); }
    ink(ctx); ctx.beginPath(); circle(ctx, 0, 0, 29); ctx.stroke(); ctx.beginPath(); circle(ctx, 0, 0, 13); ctx.stroke();
    ctx.restore();
    shine(ctx, -4, -12, 22, Math.PI * 1.05, Math.PI * 1.35, 4);
    ctx.restore();
  } };

  /* ---- Obstacles liés au monde (avant = droite) ---- */
  T.jetski = { kind: "obstacle", draw(ctx, t) {
    // sillage blanc derrière (à gauche)
    ctx.save(); ctx.fillStyle = WHITE;
    for (let k = 0; k < 4; k++) {
      const ph = (t * 2.2 + k / 4) % 1, x = -30 - ph * 18, a = 1 - ph;
      ctx.globalAlpha = 0.85 * a; ctx.beginPath(); circle(ctx, x, 20 + Math.sin(k * 2 + t * 6) * 2, 4 + ph * 5); ctx.fill();
    }
    ctx.globalAlpha = 0.8; ctx.strokeStyle = WHITE; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-28, 26); ctx.quadraticCurveTo(-40, 30, -48, 26 + Math.sin(t * 8) * 2); ctx.stroke();
    ctx.restore();
    ripples(ctx, 26, 36, t);
    const v = Math.sin(t * 16) * 0.8;
    ctx.save(); ctx.translate(0, v); ctx.rotate(-0.04);
    // coque
    ctx.beginPath();
    ctx.moveTo(-34, 4); ctx.lineTo(24, 4); ctx.quadraticCurveTo(40, 4, 47, 14); ctx.quadraticCurveTo(36, 26, 14, 26); ctx.lineTo(-30, 26); ctx.quadraticCurveTo(-38, 26, -38, 16); ctx.quadraticCurveTo(-38, 4, -34, 4); ctx.closePath();
    fs(ctx, WHITE);
    ctx.beginPath(); ctx.moveTo(-37, 16); ctx.lineTo(43, 16); ctx.quadraticCurveTo(34, 26, 14, 26); ctx.lineTo(-30, 26); ctx.quadraticCurveTo(-37, 26, -37, 16); ctx.closePath(); fs(ctx, TURQ, 3.5);
    // capot avant
    ctx.beginPath(); ctx.moveTo(8, 4); ctx.quadraticCurveTo(22, -12, 40, 6); ctx.closePath(); fs(ctx, CORAIL, 3.5);
    // selle
    ctx.beginPath(); rr(ctx, -30, -6, 32, 11, 5); fs(ctx, INDIGO, 3.5);
    // guidon
    ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(16, -18); ink(ctx, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -20); ctx.lineTo(22, -16); ink(ctx, 5); ctx.stroke();
    shine(ctx, -6, 30, 24, Math.PI * 1.25, Math.PI * 1.5, 3);
    ctx.restore();
  } };

  T.vaisseau = { kind: "obstacle", draw(ctx, t) {
    shadow(ctx, 30, 40, 5);
    // flamme du réacteur (à gauche)
    const f = 1 + 0.25 * Math.sin(t * 22) + 0.1 * Math.sin(t * 37);
    ctx.save(); ctx.translate(-30, 2);
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(-16 * f, -8, -20 * f, 0); ctx.quadraticCurveTo(-16 * f, 8, 0, 10); ctx.closePath(); fs(ctx, CORAIL, 3.5);
    ctx.beginPath(); ctx.moveTo(0, -5); ctx.quadraticCurveTo(-9 * f, -4, -11 * f, 0); ctx.quadraticCurveTo(-9 * f, 4, 0, 5); ctx.closePath(); ctx.fillStyle = SOL; ctx.fill();
    ctx.restore();
    const b = Math.sin(t * 3) * 2;
    ctx.save(); ctx.translate(0, b);
    // ailerons
    ctx.beginPath(); ctx.moveTo(-18, -12); ctx.lineTo(-30, -30); ctx.lineTo(-14, -28); ctx.lineTo(2, -12); ctx.closePath(); fs(ctx, CORAIL);
    ctx.beginPath(); ctx.moveTo(-18, 16); ctx.lineTo(-30, 34); ctx.lineTo(-14, 32); ctx.lineTo(2, 16); ctx.closePath(); fs(ctx, CORAIL);
    // fuselage (nez à droite)
    ctx.beginPath(); ctx.moveTo(-32, -14); ctx.lineTo(10, -16); ctx.quadraticCurveTo(44, -14, 48, 2); ctx.quadraticCurveTo(44, 18, 10, 20); ctx.lineTo(-32, 18); ctx.quadraticCurveTo(-38, 2, -32, -14); ctx.closePath();
    fs(ctx, mix(CIEL, WHITE, 0.55));
    ctx.beginPath(); rr(ctx, -36, -10, 8, 24, 3); fs(ctx, GRIS, 3.5);
    // bande
    ctx.beginPath(); ctx.moveTo(-26, 10); ctx.lineTo(30, 10); ink(ctx, 0); ctx.strokeStyle = VIOLET; ctx.lineWidth = 4; ctx.stroke();
    // hublot avec petit pilote-œil
    ctx.beginPath(); circle(ctx, 16, -1, 11); fs(ctx, INDIGO);
    eye(ctx, 18, -1, 5.5, t, 0.8, 0);
    dot(ctx, 11, -6, 2.5, 0.9);
    // antenne
    ctx.beginPath(); ctx.moveTo(-6, -16); ctx.lineTo(-10, -26); ink(ctx, 3); ctx.stroke();
    ctx.beginPath(); circle(ctx, -10, -28, 3.5); fs(ctx, Math.floor(t * 3) % 2 ? SOL : ROSE, 2.5);
    shine(ctx, 0, 8, 22, Math.PI * 1.2, Math.PI * 1.5, 3.5);
    ctx.restore();
  } };

  T.dameuse = { kind: "obstacle", draw(ctx, t) {
    shadow(ctx, 42, 40, 6);
    // neige soulevée derrière
    ctx.save(); ctx.fillStyle = WHITE;
    for (let k = 0; k < 3; k++) {
      const ph = (t * 1.6 + k / 3) % 1;
      ctx.globalAlpha = 0.9 * (1 - ph); ctx.beginPath(); circle(ctx, -40 - ph * 8, 26 - ph * 12, 3 + ph * 4); ctx.fill();
    }
    ctx.restore();
    const v = Math.sin(t * 20) * 0.6;
    ctx.save(); ctx.translate(0, v);
    // lame avant (à droite)
    ctx.beginPath(); ctx.moveTo(34, 6); ctx.lineTo(44, 0); ctx.quadraticCurveTo(50, 16, 44, 34); ctx.lineTo(36, 30); ctx.closePath(); fs(ctx, mix(GRIS, CREME, 0.3));
    // fraise arrière
    ctx.beginPath(); rr(ctx, -46, 14, 10, 20, 3); fs(ctx, GRIS, 3.5);
    // carrosserie
    ctx.beginPath(); rr(ctx, -38, -2, 72, 20, 6); fs(ctx, CORAIL);
    // cabine
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-6, -30); ctx.lineTo(18, -30); ctx.lineTo(30, -2); ctx.closePath(); fs(ctx, CORAIL);
    ctx.beginPath(); ctx.moveTo(-1, -6); ctx.lineTo(0, -24); ctx.lineTo(15, -24); ctx.lineTo(23, -6); ctx.closePath(); fs(ctx, CIEL, 3);
    // gyrophare
    const on = Math.floor(t * 2.5) % 2 === 0;
    ctx.beginPath(); ctx.arc(6, -30, 5, Math.PI, 0); ctx.closePath(); fs(ctx, on ? SOL : mix(SOL, BOIS, 0.45), 3);
    // phare avant
    ctx.beginPath(); rr(ctx, 30, 2, 6, 6, 2); fs(ctx, SOL, 2.5);
    ctx.restore();
    // chenilles
    ctx.beginPath(); rr(ctx, -36, 18, 70, 20, 10); fs(ctx, INK, 3);
    ctx.save(); ctx.beginPath(); rr(ctx, -34, 20, 66, 16, 8); ctx.clip();
    ctx.fillStyle = GRIS; const off = (t * 22) % 10;
    for (let x = -40; x < 40; x += 10) { ctx.fillRect(x + off, 20, 4, 3); ctx.fillRect(x - off + 10, 33, 4, 3); }
    ctx.restore();
    for (const wx of [-24, -6, 12, 24]) {
      ctx.save(); ctx.translate(wx, 28); ctx.rotate(t * 6);
      ctx.beginPath(); circle(ctx, 0, 0, 5.5); fs(ctx, GRIS, 2.5);
      ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 0); ink(ctx, 2); ctx.stroke();
      ctx.restore();
    }
    shine(ctx, -10, 26, 26, Math.PI * 1.3, Math.PI * 1.5, 3);
  } };

  /* ---- Décors : plats, sans ombre, un peu désaturés ---- */
  const DW = 4;
  T.ville_arbre = { kind: "decor", draw(ctx, t) {
    ctx.beginPath(); rr(ctx, -6, 4, 12, 36, 4); fs(ctx, D(BOIS), DW);
    blob(ctx, [[0, -16, 24], [-18, -2, 16], [18, -2, 16], [0, 4, 16]], D(FEUILLE), DW);
    dot(ctx, -10, -24, 4, 0.6); dot(ctx, 12, 0, 2.5, 0.5);
  } };
  T.ville_maison = { kind: "decor", draw(ctx) {
    ctx.beginPath(); rr(ctx, -28, -6, 56, 44, 3); fs(ctx, D(CREME), DW);
    ctx.beginPath(); ctx.moveTo(-36, -2); ctx.lineTo(0, -36); ctx.lineTo(36, -2); ctx.closePath(); fs(ctx, D(INDIGO), DW);
    ctx.beginPath(); rr(ctx, -6, 16, 13, 22, 2); fs(ctx, D(BOIS), DW);
    ctx.beginPath(); rr(ctx, -21, 6, 11, 11, 2); rr(ctx, 12, 6, 11, 11, 2); fs(ctx, D(CIEL), 3);
  } };
  T.ville_banc = { kind: "decor", draw(ctx) {
    for (const lx of [-26, 26]) { ctx.beginPath(); rr(ctx, lx - 3, -2, 6, 30, 2); fs(ctx, D(GRIS), DW); }
    ctx.beginPath(); rr(ctx, -38, -24, 76, 10, 3); fs(ctx, D(BOIS), DW);
    ctx.beginPath(); rr(ctx, -38, -10, 76, 10, 3); fs(ctx, D(BOIS), DW);
    ctx.beginPath(); rr(ctx, -42, 4, 84, 9, 3); fs(ctx, D(BOIS), DW);
  } };
  T.ville_lampadaire = { kind: "decor", draw(ctx, t) {
    ctx.save(); ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t * 2); ctx.fillStyle = SOL; ctx.beginPath(); circle(ctx, 0, -30, 18); ctx.fill(); ctx.restore();
    ctx.beginPath(); rr(ctx, -4, -26, 8, 64, 3); fs(ctx, D(GRIS), DW);
    ctx.beginPath(); rr(ctx, -12, 34, 24, 8, 3); fs(ctx, D(GRIS), DW);
    ctx.beginPath(); circle(ctx, 0, -32, 10); fs(ctx, D(SOL), DW);
    ctx.beginPath(); rr(ctx, -13, -46, 26, 8, 4); fs(ctx, D(INDIGO), DW);
  } };

  function fir(ctx, col, snow) {
    ctx.beginPath(); rr(ctx, -6, 26, 12, 16, 3); fs(ctx, D(BOIS), DW);
    const tiers = [[-46, 18, 0], [-30, 26, 14], [-12, 34, 30]];
    for (const [y, w, h] of tiers) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + 20 + h * 0.4); ctx.quadraticCurveTo(0, y + 26 + h * 0.4, -w, y + 20 + h * 0.4); ctx.closePath(); fs(ctx, col, DW);
      if (snow) {
        ctx.beginPath(); ctx.moveTo(0, y + 1); ctx.lineTo(w * 0.42, y + 9 + h * 0.15); ctx.quadraticCurveTo(w * 0.2, y + 13, 0, y + 9); ctx.quadraticCurveTo(-w * 0.2, y + 13, -w * 0.42, y + 9 + h * 0.15); ctx.closePath();
        ctx.fillStyle = WHITE; ctx.fill();
      }
    }
  }
  T.foret_sapin = { kind: "decor", draw(ctx) { fir(ctx, D(mix(FEUILLE, TURQ, 0.35)), false); dot(ctx, -6, -30, 3, 0.5); } };
  T.foret_champignon = { kind: "decor", draw(ctx) {
    ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(-14, 34, -12, 38); ctx.lineTo(12, 38); ctx.quadraticCurveTo(14, 34, 10, 4); ctx.closePath(); fs(ctx, D(CREME), DW);
    ctx.beginPath(); ctx.moveTo(-36, 8); ctx.quadraticCurveTo(-38, -32, 0, -32); ctx.quadraticCurveTo(38, -32, 36, 8); ctx.quadraticCurveTo(0, 14, -36, 8); ctx.closePath(); fs(ctx, D(CORAIL), DW);
    ctx.beginPath(); circle(ctx, -16, -12, 6); circle(ctx, 8, -20, 5); circle(ctx, 20, -4, 4); circle(ctx, -2, -4, 3.5); ctx.fillStyle = CREME; ctx.fill();
  } };
  T.foret_rocher = { kind: "decor", draw(ctx) {
    ctx.beginPath(); ctx.moveTo(-40, 30); ctx.quadraticCurveTo(-42, 0, -20, -14); ctx.quadraticCurveTo(-6, -30, 12, -20); ctx.quadraticCurveTo(38, -12, 40, 30); ctx.closePath(); fs(ctx, D(GRIS), DW);
    ctx.beginPath(); ctx.moveTo(-6, 30); ctx.quadraticCurveTo(0, 8, 16, 2); ink(ctx, 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-24, -10); ctx.quadraticCurveTo(-10, -26, 10, -18); ctx.quadraticCurveTo(-4, -14, -24, -10); ctx.fillStyle = D(FEUILLE); ctx.fill();
    dot(ctx, -22, 4, 3.5, 0.5);
  } };
  T.foret_buisson = { kind: "decor", draw(ctx) {
    blob(ctx, [[-20, 12, 18], [0, 0, 22], [20, 12, 18], [0, 18, 18]], D(FEUILLE), DW);
    ctx.beginPath(); circle(ctx, -14, 4, 4.5); circle(ctx, 10, -6, 4.5); circle(ctx, 18, 16, 4.5); circle(ctx, -4, 18, 4.5); fs(ctx, D(ROSE), 2.5);
  } };

  T.plage_palmier = { kind: "decor", draw(ctx, t) {
    tube(ctx, () => { ctx.moveTo(-4, 42); ctx.quadraticCurveTo(-10, 10, 4, -16); }, D(BOIS), 9);
    ctx.save(); ctx.translate(4, -18); ctx.rotate(Math.sin(t * 1.2) * 0.04);
    for (const a of [-2.7, -2.0, -1.2, -0.45, 0.25]) {
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(20, -14, 36, 4); ctx.quadraticCurveTo(18, 2, 0, 0); ctx.closePath(); fs(ctx, D(FEUILLE), DW);
      ctx.restore();
    }
    ctx.beginPath(); circle(ctx, -4, 4, 5); circle(ctx, 5, 6, 5); fs(ctx, D(BOIS), 3);
    ctx.restore();
  } };
  T.plage_coquillage = { kind: "decor", draw(ctx) {
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(-34, -6); ctx.quadraticCurveTo(-30, -32, 0, -32); ctx.quadraticCurveTo(30, -32, 34, -6); ctx.closePath(); fs(ctx, D(ROSE), DW);
    ctx.beginPath(); for (const x of [-22, -10, 0, 10, 22]) { ctx.moveTo(0, 26); ctx.lineTo(x, -26 + Math.abs(x) * 0.3); } ink(ctx, 2.5); ctx.stroke();
    ctx.beginPath(); rr(ctx, -8, 26, 16, 10, 3); fs(ctx, D(ROSE), 3);
    dot(ctx, -16, -18, 3.5, 0.6);
  } };
  T.plage_parasol = { kind: "decor", draw(ctx) {
    ctx.beginPath(); ctx.moveTo(2, -26); ctx.lineTo(-2, 40); ink(ctx, 5); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-42, -6); ctx.quadraticCurveTo(-40, -42, 2, -42); ctx.quadraticCurveTo(44, -42, 44, -6); ctx.closePath();
    ctx.fillStyle = D(WHITE); ctx.fill(); ctx.clip();
    ctx.fillStyle = D(CORAIL);
    for (const x of [-30, 2, 34]) { ctx.beginPath(); ctx.moveTo(2, -46); ctx.lineTo(x - 9, 0); ctx.lineTo(x + 9, 0); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-42, -6); ctx.quadraticCurveTo(-40, -42, 2, -42); ctx.quadraticCurveTo(44, -42, 44, -6);
    ctx.quadraticCurveTo(34, -12, 23, -6); ctx.quadraticCurveTo(12, -12, 2, -6); ctx.quadraticCurveTo(-9, -12, -20, -6); ctx.quadraticCurveTo(-31, -12, -42, -6); ctx.closePath();
    ink(ctx, DW); ctx.stroke();
    ctx.beginPath(); circle(ctx, 2, -44, 3.5); fs(ctx, D(SOL), 2.5);
  } };
  T.plage_crabe = { kind: "decor", draw(ctx, t) {
    const sx = Math.sin(t * 3) * 1.5;
    ctx.save(); ctx.translate(sx, 4);
    ctx.beginPath(); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.moveTo(s * 18, 8 + i * 5); ctx.lineTo(s * 34, 14 + i * 7); } ink(ctx, 4); ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 20, -2); ctx.lineTo(s * 32, -16); ink(ctx, 4); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 33, -27, 9, 5.5, s * -0.55, 0, TAU); fs(ctx, D(CORAIL), 3.5);
      ctx.beginPath(); ctx.ellipse(s * 37, -17, 7, 4.5, s * 0.35, 0, TAU); fs(ctx, D(CORAIL), 3.5);
    }
    ctx.beginPath(); ctx.ellipse(0, 8, 24, 16, 0, 0, TAU); fs(ctx, D(CORAIL), DW);
    ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(-8, -14); ctx.moveTo(7, -4); ctx.lineTo(8, -14); ink(ctx, 3); ctx.stroke();
    eye(ctx, -8, -16, 5.5, t, 0, 0); eye(ctx, 8, -16, 5.5, t, 0, 0);
    ctx.beginPath(); ctx.arc(0, 8, 6, 0.15 * Math.PI, 0.85 * Math.PI); ink(ctx, 2.5); ctx.stroke();
    ctx.restore();
  } };

  T.espace_etoile = { kind: "decor", draw(ctx, t) {
    const s = 1 + 0.06 * Math.sin(t * 3);
    ctx.save(); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.5) * 0.06);
    ctx.beginPath(); starPath(ctx, 0, 2, 5, 38, 17, 0); ctx.lineJoin = "round"; fs(ctx, D(SOL), DW);
    ctx.beginPath(); circle(ctx, -6, 4, 2.5); circle(ctx, 6, 4, 2.5); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 8, 4, 0.2 * Math.PI, 0.8 * Math.PI); ink(ctx, 2.2); ctx.stroke();
    dot(ctx, -6, -14, 3, 0.6);
    ctx.restore();
  } };
  T.espace_planete = { kind: "decor", draw(ctx) {
    ctx.save(); ctx.rotate(-0.35);
    ctx.beginPath(); ctx.ellipse(0, 0, 46, 12, 0, Math.PI, TAU); ink(ctx, 11); ctx.stroke(); ctx.strokeStyle = D(SOL); ctx.lineWidth = 5; ctx.stroke();
    ctx.beginPath(); circle(ctx, 0, 0, 26); fs(ctx, D(VIOLET), DW);
    ctx.save(); ctx.beginPath(); circle(ctx, 0, 0, 24); ctx.clip(); ctx.fillStyle = D(ROSE); ctx.fillRect(-30, -10, 60, 7); ctx.fillRect(-30, 6, 60, 4); ctx.restore();
    ctx.beginPath(); ctx.ellipse(0, 0, 46, 12, 0, 0, Math.PI); ink(ctx, 11); ctx.stroke(); ctx.strokeStyle = D(SOL); ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
    dot(ctx, -10, -12, 4, 0.6);
  } };
  T.espace_comete = { kind: "decor", draw(ctx, t) {
    const w = Math.sin(t * 4) * 2;
    ctx.save(); ctx.lineCap = "round";
    const tails = [[D(TURQ), 14, -6], [D(CIEL), 10, 6], [WHITE, 6, 0]];
    for (const [c, lw, off] of tails) {
      ctx.beginPath(); ctx.moveTo(12, 10 - 12 + off * 0.5); ctx.quadraticCurveTo(-14, -12 + off + w, -40, -30 + off);
      ink(ctx, lw + 8); ctx.stroke();
    }
    for (const [c, lw, off] of tails) {
      ctx.beginPath(); ctx.moveTo(12, 10 - 12 + off * 0.5); ctx.quadraticCurveTo(-14, -12 + off + w, -40, -30 + off);
      ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath(); circle(ctx, 18, 10, 17); fs(ctx, D(CIEL), DW);
    ctx.beginPath(); circle(ctx, 18, 10, 9); ctx.fillStyle = WHITE; ctx.fill();
    dot(ctx, 12, 4, 3, 0.8);
  } };
  T.espace_lune = { kind: "decor", draw(ctx) {
    // croissant
    const r1 = 34, cx = 16, cy = -10, r2 = 30, d = Math.hypot(cx, cy), th = Math.atan2(cy, cx);
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), ph = Math.acos(a / r1);
    const p1 = [r1 * Math.cos(th + ph), r1 * Math.sin(th + ph)], p2 = [r1 * Math.cos(th - ph), r1 * Math.sin(th - ph)];
    const b1 = Math.atan2(p1[1] - cy, p1[0] - cx), b2 = Math.atan2(p2[1] - cy, p2[0] - cx);
    ctx.beginPath(); ctx.arc(0, 0, r1, th + ph, th - ph + TAU); ctx.arc(cx, cy, r2, b2, b1, true); ctx.closePath();
    fs(ctx, D(CREME), DW);
    ctx.beginPath(); circle(ctx, -18, 10, 5); circle(ctx, -6, 24, 3.5); circle(ctx, -24, -8, 3); ctx.fillStyle = D(GRIS); ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath(); circle(ctx, -14, -2, 2.4); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.arc(-14, 8, 4, 0.6 * Math.PI, 1.1 * Math.PI); ink(ctx, 2.2); ctx.stroke();
  } };

  T.neige_bonhomme = { kind: "decor", draw(ctx, t) {
    // bras
    ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(-34, -6); ctx.moveTo(-28, -2); ctx.lineTo(-32, -12); ctx.moveTo(14, 8); ctx.lineTo(34, -4); ink(ctx, 4); ctx.strokeStyle = D(BOIS); ctx.stroke();
    blob(ctx, [[0, 20, 22], [0, -16, 16]], WHITE, DW);
    // écharpe
    ctx.beginPath(); rr(ctx, -15, -4, 30, 8, 4); fs(ctx, D(CORAIL), 3);
    ctx.beginPath(); rr(ctx, 4, -2, 8, 16, 3); fs(ctx, D(CORAIL), 3);
    // chapeau
    ctx.beginPath(); rr(ctx, -16, -34, 32, 6, 3); fs(ctx, D(INDIGO), 3.5);
    ctx.beginPath(); rr(ctx, -10, -48, 20, 15, 3); fs(ctx, D(INDIGO), 3.5);
    // visage
    ctx.beginPath(); circle(ctx, -5, -18, 2.4); circle(ctx, 5, -18, 2.4); circle(ctx, 0, 14, 2.2); circle(ctx, 0, 24, 2.2); ctx.fillStyle = INK; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(13, -11); ctx.lineTo(0, -10); ctx.closePath(); fs(ctx, D(CORAIL), 2);
    ctx.beginPath(); ctx.arc(0, -12, 6, 0.25 * Math.PI, 0.75 * Math.PI); ink(ctx, 2); ctx.stroke();
  } };
  T.neige_sapin = { kind: "decor", draw(ctx) { fir(ctx, D(mix(FEUILLE, TURQ, 0.45)), true); } };
  T.neige_flocon = { kind: "decor", draw(ctx, t) {
    ctx.save(); ctx.rotate(t * 0.3);
    const arms = () => {
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
        ctx.moveTo(0, 0); ctx.lineTo(c * 36, s * 36);
        const bx = c * 22, by = s * 22;
        ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + 0.8) * 11, by + Math.sin(a + 0.8) * 11);
        ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.8) * 11, by + Math.sin(a - 0.8) * 11);
      }
    };
    ctx.beginPath(); arms(); ink(ctx, 12); ctx.stroke();
    ctx.beginPath(); arms(); ctx.strokeStyle = D(CIEL); ctx.lineWidth = 4.5; ctx.stroke();
    ctx.beginPath(); circle(ctx, 0, 0, 8); fs(ctx, WHITE, 3);
    ctx.restore();
  } };
  T.neige_montagne = { kind: "decor", draw(ctx) {
    ctx.beginPath(); ctx.moveTo(-46, 36); ctx.lineTo(-10, -36); ctx.lineTo(10, -10); ctx.lineTo(22, -22); ctx.lineTo(46, 36); ctx.closePath(); fs(ctx, D(mix(INDIGO, GRIS, 0.5)), DW);
    ctx.beginPath(); ctx.moveTo(-10, -36); ctx.lineTo(-21, -14); ctx.lineTo(-14, -18); ctx.lineTo(-8, -12); ctx.lineTo(-2, -18); ctx.lineTo(4, -17); ctx.closePath(); fs(ctx, WHITE, 3);
    ctx.beginPath(); ctx.moveTo(22, -22); ctx.lineTo(15, -10); ctx.lineTo(20, -12); ctx.lineTo(25, -8); ctx.lineTo(29, -12); ctx.closePath(); fs(ctx, WHITE, 3);
    ctx.beginPath(); ctx.moveTo(-10, -36); ctx.lineTo(-4, 36); ctx.save(); ctx.globalAlpha = 0.25; ink(ctx, 3); ctx.stroke(); ctx.restore();
  } };

  /* =====================================================================
     MONDES
     ===================================================================== */
  function makeRng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lanesY = L => L.LANES.map(r => r * L.CELL);
  function inLane(L, y, pad) { return L.LANES.some(r => y > r * L.CELL - (pad || 0) && y < (r + 1) * L.CELL + (pad || 0)); }

  // petite vague horizontale (bord d'écume / rive)
  function scallop(c, x0, x1, y, amp, step, down) {
    c.moveTo(x0, y);
    for (let x = x0; x < x1; x += step) c.quadraticCurveTo(x + step / 2, y + (down ? amp : -amp), x + step, y);
  }

  const W_ = {};

  /* ---------------- VILLE ---------------- */
  W_.ville = {
    name: "Ville", label: "Lac", labelColor: WHITE,
    decor: ["ville_arbre", "ville_maison", "ville_banc", "ville_lampadaire"],
    colors: { ground: mix(FEUILLE, CREME, 0.42), lane: mix(GRIS, INK, 0.38), band: mix(CIEL, INDIGO, 0.38) },
    pad: CREME, padStitch: GRIS,
    ground(c, L, r) {
      c.fillStyle = this.colors.ground; c.fillRect(0, 0, L.W, L.H);
      c.fillStyle = "rgba(255,255,255,.07)";
      for (let i = 0; i < L.W / L.CELL; i++) for (let j = 0; j < L.H / L.CELL; j++) if ((i + j) % 2) c.fillRect(i * L.CELL, j * L.CELL, L.CELL, L.CELL);
      c.strokeStyle = mix(FEUILLE, INK, 0.12); c.lineWidth = 1.6; c.lineCap = "round"; c.globalAlpha = 0.4;
      c.beginPath();
      for (let i = 0; i < 340; i++) {
        const x = r() * L.W, y = r() * L.H;
        c.moveTo(x - 2.5, y + 2); c.lineTo(x - 3.5, y - 2); c.moveTo(x, y + 2); c.lineTo(x, y - 3); c.moveTo(x + 2.5, y + 2); c.lineTo(x + 3.5, y - 2);
      }
      c.stroke(); c.globalAlpha = 1;
      for (let i = 0; i < 46; i++) {
        const x = r() * L.W, y = r() * L.H;
        c.fillStyle = [WHITE, ROSE, SOL][i % 3]; c.globalAlpha = 0.7; c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
    },
    lane(c, L, y, li, r) {
      const C = L.CELL;
      c.fillStyle = this.colors.lane; c.fillRect(0, y + 3, L.W, C - 6);
      c.globalAlpha = 0.25; c.fillStyle = INK;
      for (let i = 0; i < 160; i++) c.fillRect(r() * L.W, y + 8 + r() * (C - 16), 2, 2);
      c.globalAlpha = 1;
      c.fillStyle = mix(CREME, GRIS, 0.15); c.fillRect(0, y, L.W, 5); c.fillRect(0, y + C - 5, L.W, 5);
      c.fillStyle = "rgba(29,27,47,.35)"; c.fillRect(0, y + 5, L.W, 1.5); c.fillRect(0, y + C - 6.5, L.W, 1.5);
      c.fillStyle = "rgba(255,255,255,.85)";
      for (let x = 10; x < L.W; x += 56) { c.beginPath(); rr(c, x, y + C / 2 - 2.5, 28, 5, 2.5); c.fill(); }
    },
    band(c, L, r) {
      const y = L.H - L.CELL;
      c.fillStyle = this.colors.band; c.fillRect(0, y, L.W, L.CELL);
      c.fillStyle = mix(SOL, CREME, 0.5); c.beginPath(); c.moveTo(0, y - 1); c.lineTo(L.W, y - 1); scallop(c, L.W, 0, y + 6, 0, 1, false); c.lineTo(0, y + 6);
      c.beginPath(); c.rect(0, y - 1, L.W, 4); scallop(c, 0, L.W, y + 3, 3, 24, true); c.lineTo(L.W, y - 1); c.fill();
      // nénuphars à droite
      for (const [x, yy, s] of [[620, 572, 9], [700, 584, 7], [790, 566, 10]]) {
        c.beginPath(); c.moveTo(x, yy); c.arc(x, yy, s, 0.35, TAU - 0.15); c.closePath(); c.fillStyle = mix(FEUILLE, CREME, 0.15); c.fill();
        c.strokeStyle = "rgba(29,27,47,.45)"; c.lineWidth = 2; c.stroke();
      }
      c.beginPath(); c.arc(792, 562, 3, 0, TAU); c.fillStyle = ROSE; c.fill();
    },
    anim(ctx, L, t) {
      const y = L.H - L.CELL;
      ctx.save(); ctx.strokeStyle = WHITE; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      for (let k = 0; k < 6; k++) {
        const x = 300 + k * 82 + Math.sin(t * 0.7 + k) * 10, yy = y + 20 + (k % 2) * 18;
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 1.5 + k * 1.3);
        ctx.beginPath(); ctx.moveTo(x - 10, yy); ctx.quadraticCurveTo(x, yy - 4, x + 10, yy); ctx.stroke();
      }
      ctx.restore();
    }
  };

  /* ---------------- FORÊT ---------------- */
  W_.foret = {
    name: "Forêt", label: "Rivière", labelColor: WHITE,
    decor: ["foret_sapin", "foret_champignon", "foret_rocher", "foret_buisson"],
    colors: { ground: mix(FEUILLE, INK, 0.42), lane: mix(BOIS, CREME, 0.22), band: mix(CIEL, INDIGO, 0.42) },
    pad: mix(BOIS, CREME, 0.5), padStitch: CREME,
    ground(c, L, r) {
      c.fillStyle = this.colors.ground; c.fillRect(0, 0, L.W, L.H);
      // taches de mousse
      c.globalAlpha = 0.12; c.fillStyle = FEUILLE;
      for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(r() * L.W, r() * L.H, 30 + r() * 40, 16 + r() * 18, r() * 3, 0, TAU); c.fill(); }
      c.globalAlpha = 0.5; c.lineWidth = 1.6; c.lineCap = "round";
      const cols = [mix(FEUILLE, INK, 0.22), mix(FEUILLE, INK, 0.62)];
      for (let k = 0; k < 2; k++) {
        c.strokeStyle = cols[k]; c.beginPath();
        for (let i = 0; i < 520; i++) {
          const x = r() * L.W, y = r() * L.H, a = r() * Math.PI, l = 3 + r() * 3;
          c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
        }
        c.stroke();
      }
      c.globalAlpha = 0.55; c.fillStyle = mix(BOIS, INK, 0.1);
      for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(r() * L.W, r() * L.H, 2.6, 1.6, r() * 3, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    },
    lane(c, L, y, li, r) {
      const C = L.CELL;
      c.fillStyle = "rgba(29,27,47,.25)"; c.fillRect(0, y + 2, L.W, C - 2);
      c.fillStyle = mix(BOIS, INK, 0.2); c.fillRect(0, y, L.W, C - 3);
      c.fillStyle = this.colors.lane; c.fillRect(0, y + 6, L.W, C - 15);
      // planches
      let x = -r() * 20;
      c.strokeStyle = "rgba(29,27,47,.38)"; c.lineWidth = 2;
      while (x < L.W) {
        const w = 24 + r() * 8;
        c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x, y + C - 9); c.stroke();
        c.fillStyle = "rgba(29,27,47,.45)";
        c.beginPath(); c.arc(x + 5, y + 10, 1.4, 0, TAU); c.arc(x + 5, y + C - 13, 1.4, 0, TAU); c.fill();
        c.save(); c.globalAlpha = 0.18; c.strokeStyle = mix(BOIS, INK, 0.3); c.lineWidth = 1.2;
        c.beginPath(); const gy = y + 14 + r() * (C - 30); c.moveTo(x + 6, gy); c.quadraticCurveTo(x + w / 2, gy + 3, x + w - 4, gy); c.stroke(); c.restore();
        x += w;
      }
      c.fillStyle = "rgba(255,255,255,.18)"; c.fillRect(0, y + 6, L.W, 3);
    },
    band(c, L, r) {
      const y = L.H - L.CELL;
      c.fillStyle = this.colors.band; c.fillRect(0, y, L.W, L.CELL);
      c.fillStyle = mix(FEUILLE, INK, 0.6);
      c.beginPath(); c.moveTo(0, y - 1); scallop(c, 0, L.W, y + 2, 4, 30, true); c.lineTo(L.W, y - 1); c.closePath(); c.fill();
      for (const [x, yy, s] of [[560, 590, 9], [690, 548, 7], [780, 588, 11], [812, 552, 6]]) {
        c.beginPath(); c.ellipse(x, yy, s * 1.4, s, 0, 0, TAU); c.fillStyle = mix(GRIS, CREME, 0.2); c.fill(); c.strokeStyle = "rgba(29,27,47,.5)"; c.lineWidth = 2; c.stroke();
      }
    },
    anim(ctx, L, t) {
      const y = L.H - L.CELL;
      ctx.save(); ctx.strokeStyle = WHITE; ctx.lineCap = "round"; ctx.lineWidth = 2.5;
      for (let k = 0; k < 9; k++) {
        const span = L.W - 260, x = 260 + ((k * 97 + t * 28) % span), yy = y + 14 + (k * 13) % 36;
        ctx.globalAlpha = 0.4 * Math.sin(Math.PI * ((x - 260) / span));
        ctx.beginPath(); ctx.moveTo(x - 14, yy); ctx.lineTo(x + 14, yy); ctx.stroke();
      }
      // lucioles
      for (let k = 0; k < 10; k++) {
        const bx = (k * 211 + 40) % L.W, by = ((k * 7 + 1) % 4) * 120 + 90;
        const x = bx + Math.sin(t * 0.6 + k) * 18, yy = by + Math.cos(t * 0.8 + k * 2) * 10;
        const a = 0.35 + 0.35 * Math.sin(t * 2.4 + k * 1.7);
        ctx.globalAlpha = a * 0.5; ctx.fillStyle = SOL; ctx.beginPath(); ctx.arc(x, yy, 6, 0, TAU); ctx.fill();
        ctx.globalAlpha = a + 0.2; ctx.beginPath(); ctx.arc(x, yy, 2.2, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  };

  /* ---------------- PLAGE ---------------- */
  W_.plage = {
    name: "Plage", label: "Mer", labelColor: WHITE,
    decor: ["plage_palmier", "plage_coquillage", "plage_parasol", "plage_crabe"],
    colors: { ground: mix(SOL, CREME, 0.55), lane: CIEL, band: mix(TURQ, INDIGO, 0.3) },
    pad: ROSE, padStitch: WHITE, padStripes: true,
    ground(c, L, r) {
      c.fillStyle = this.colors.ground; c.fillRect(0, 0, L.W, L.H);
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 2; c.lineCap = "round";
      c.beginPath();
      for (let i = 0; i < 40; i++) { const x = r() * L.W, y = r() * L.H, w = 14 + r() * 16; c.moveTo(x - w, y); c.quadraticCurveTo(x, y - 4, x + w, y); }
      c.stroke();
      c.fillStyle = BOIS;
      for (let i = 0; i < 520; i++) { c.globalAlpha = 0.1 + r() * 0.14; c.beginPath(); c.arc(r() * L.W, r() * L.H, 0.7 + r() * 0.9, 0, TAU); c.fill(); }
      c.globalAlpha = 0.6;
      for (let i = 0; i < 18; i++) { c.fillStyle = [WHITE, ROSE][i % 2]; c.beginPath(); c.arc(r() * L.W, r() * L.H, 1.8, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    },
    lane(c, L, y, li, r) {
      const C = L.CELL;
      c.fillStyle = mix(SOL, BOIS, 0.25); c.globalAlpha = 0.35; c.fillRect(0, y, L.W, C); c.globalAlpha = 1;
      c.fillStyle = this.colors.lane; c.fillRect(0, y + 5, L.W, C - 10);
      c.fillStyle = mix(CIEL, INDIGO, 0.15); c.fillRect(0, y + 20, L.W, C - 40);
      c.fillStyle = "rgba(255,255,255,.9)";
      c.beginPath(); c.rect(0, y + 3, L.W, 4); scallop(c, L.W, 0, y + 7, 0, -1); c.fill();
      c.beginPath(); c.moveTo(0, y + 3); c.lineTo(L.W, y + 3); c.lineTo(L.W, y + 7); for (let x = L.W; x > 0; x -= 20) c.quadraticCurveTo(x - 10, y + 13, x - 20, y + 7); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, y + C - 3); c.lineTo(L.W, y + C - 3); c.lineTo(L.W, y + C - 7); for (let x = L.W; x > 0; x -= 20) c.quadraticCurveTo(x - 10, y + C - 13, x - 20, y + C - 7); c.closePath(); c.fill();
    },
    band(c, L, r) {
      const y = L.H - L.CELL;
      c.fillStyle = this.colors.band; c.fillRect(0, y, L.W, L.CELL);
      c.fillStyle = "rgba(255,255,255,.9)";
      c.beginPath(); c.moveTo(0, y - 2); c.lineTo(L.W, y - 2); c.lineTo(L.W, y + 2); for (let x = L.W; x > 0; x -= 28) c.quadraticCurveTo(x - 14, y + 9, x - 28, y + 2); c.closePath(); c.fill();
    },
    anim(ctx, L, t) {
      ctx.save(); ctx.strokeStyle = WHITE; ctx.lineCap = "round"; ctx.lineWidth = 2.5;
      L.LANES.forEach((row, li) => {
        const y = row * L.CELL, dir = li % 2 ? -1 : 1;
        for (let k = 0; k < 11; k++) {
          let x = (k * 84 + dir * t * 22 + li * 30) % L.W; if (x < 0) x += L.W;
          const yy = y + (k % 2 ? 22 : 38);
          ctx.globalAlpha = 0.45;
          ctx.beginPath(); ctx.moveTo(x - 10, yy); ctx.quadraticCurveTo(x - 5, yy - 4, x, yy); ctx.quadraticCurveTo(x + 5, yy + 4, x + 10, yy); ctx.stroke();
        }
      });
      const y = L.H - L.CELL;
      for (let k = 0; k < 7; k++) {
        const x = 300 + k * 78, yy = y + 22 + (k % 3) * 11, a = Math.max(0, Math.sin(t * 1.7 + k * 2.1));
        ctx.globalAlpha = 0.6 * a; ctx.beginPath(); ctx.moveTo(x - 9, yy); ctx.quadraticCurveTo(x, yy - 4, x + 9, yy); ctx.stroke();
      }
      ctx.restore();
    }
  };

  /* ---------------- ESPACE ---------------- */
  W_.espace = {
    name: "Espace", label: "Planète", labelColor: WHITE, dark: true,
    decor: ["espace_etoile", "espace_planete", "espace_comete", "espace_lune"],
    colors: { ground: "#1b1f3b", lane: VIOLET, band: mix(VIOLET, INDIGO, 0.45) },
    pad: mix(INDIGO, "#1b1f3b", 0.35), padStitch: TURQ,
    ground(c, L, r) {
      c.fillStyle = this.colors.ground; c.fillRect(0, 0, L.W, L.H);
      for (let i = 0; i < 7; i++) {
        c.globalAlpha = 0.045; c.fillStyle = [VIOLET, INDIGO, ROSE][i % 3];
        c.beginPath(); c.ellipse(r() * L.W, r() * L.H, 80 + r() * 90, 50 + r() * 50, r() * 3, 0, TAU); c.fill();
      }
      for (let i = 0; i < 240; i++) {
        c.globalAlpha = 0.25 + r() * 0.55; c.fillStyle = i % 9 === 0 ? CIEL : i % 13 === 0 ? ROSE : WHITE;
        c.beginPath(); c.arc(r() * L.W, r() * L.H, 0.6 + r() * 1.1, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      this._tw = [];
      for (let i = 0; i < 22; i++) { let x, y; do { x = r() * L.W; y = r() * (L.H - L.CELL); } while (inLane(L, y, 4)); this._tw.push([x, y, r() * 6]); }
    },
    lane(c, L, y, li, r) {
      const C = L.CELL;
      c.globalAlpha = 0.24; c.fillStyle = VIOLET; c.fillRect(0, y + 4, L.W, C - 8);
      c.globalAlpha = 0.12; c.fillRect(0, y + 14, L.W, C - 28);
      c.globalAlpha = 1; c.fillStyle = VIOLET; c.fillRect(0, y + 3, L.W, 3); c.fillRect(0, y + C - 6, L.W, 3);
      // petits cailloux d'astéroïdes sur les bords
      for (let i = 0; i < 14; i++) {
        const x = r() * L.W, yy = y + (r() < 0.5 ? 12 : C - 12) + (r() - 0.5) * 4, s = 2 + r() * 2.5;
        c.globalAlpha = 0.55; c.fillStyle = GRIS; c.beginPath(); c.ellipse(x, yy, s * 1.3, s, r() * 3, 0, TAU); c.fill();
      }
      c.globalAlpha = 0.3; c.fillStyle = WHITE;
      for (let x = 14; x < L.W; x += 30) { c.beginPath(); c.arc(x, y + C / 2, 1.6, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    },
    band(c, L, r) {
      const y = L.H - L.CELL, R = 2400, cx = L.W / 2, cy = y + 8 + R;
      c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
      c.fillStyle = this.colors.band; c.fillRect(0, y - 10, L.W, L.CELL + 10);
      c.globalAlpha = 0.35; c.fillStyle = mix(VIOLET, ROSE, 0.4);
      c.beginPath(); c.arc(cx, cy, R - 16, 0, TAU); c.arc(cx, cy, R - 24, 0, TAU, true); c.fill();
      c.globalAlpha = 0.5; c.fillStyle = mix(VIOLET, INK, 0.35);
      for (const [x, yy, s] of [[560, 580, 10], [650, 566, 6], [735, 584, 12], [810, 562, 7]]) { c.beginPath(); c.ellipse(x, yy, s * 1.6, s * 0.7, 0, 0, TAU); c.fill(); }
      c.restore();
      c.strokeStyle = ROSE; c.globalAlpha = 0.7; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke(); c.globalAlpha = 1;
    },
    anim(ctx, L, t) {
      ctx.save();
      for (const [x, y, p] of this._tw || []) {
        const a = Math.max(0, Math.sin(t * 1.6 + p));
        if (a < 0.05) continue;
        ctx.globalAlpha = a * 0.9; ctx.fillStyle = WHITE;
        ctx.beginPath(); starPath(ctx, x, y, 4, 3 + 2 * a, 0.9, 0); ctx.fill();
      }
      // feux de balisage qui défilent
      L.LANES.forEach((row, li) => {
        const y = row * L.CELL, dir = li % 2 ? -1 : 1;
        for (let k = 0; k < Math.ceil(L.W / 48) + 1; k++) {
          let x = (k * 48 + dir * t * 50) % (L.W + 48); if (x < 0) x += L.W + 48;
          ctx.globalAlpha = 0.9; ctx.fillStyle = k % 2 ? SOL : ROSE;
          ctx.beginPath(); ctx.arc(x - 24, y + 4.5, 2.6, 0, TAU); ctx.arc(x - 24, y + L.CELL - 4.5, 2.6, 0, TAU); ctx.fill();
        }
      });
      ctx.restore();
    }
  };

  /* ---------------- NEIGE ---------------- */
  W_.neige = {
    name: "Montagne", label: "Lac gelé", labelColor: WHITE,
    decor: ["neige_bonhomme", "neige_sapin", "neige_flocon", "neige_montagne"],
    colors: { ground: mix(CIEL, WHITE, 0.82), lane: mix(CIEL, WHITE, 0.3), band: mix(CIEL, INDIGO, 0.45) },
    pad: mix(CIEL, WHITE, 0.4), padStitch: WHITE,
    ground(c, L, r) {
      c.fillStyle = this.colors.ground; c.fillRect(0, 0, L.W, L.H);
      for (let i = 0; i < 34; i++) {
        const x = r() * L.W, y = r() * L.H, w = 26 + r() * 40, h = 7 + r() * 6;
        c.globalAlpha = 0.22; c.fillStyle = CIEL; c.beginPath(); c.ellipse(x, y + 3, w, h, 0, Math.PI, TAU); c.fill();
        c.globalAlpha = 0.85; c.fillStyle = WHITE; c.beginPath(); c.ellipse(x, y, w, h, 0, Math.PI, TAU); c.fill();
      }
      c.fillStyle = CIEL;
      for (let i = 0; i < 260; i++) { c.globalAlpha = 0.2 + r() * 0.3; c.beginPath(); c.arc(r() * L.W, r() * L.H, 0.7 + r() * 0.9, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
    },
    lane(c, L, y, li, r) {
      const C = L.CELL;
      c.fillStyle = mix(CIEL, WHITE, 0.55); c.fillRect(0, y, L.W, C);
      c.fillStyle = this.colors.lane; c.fillRect(0, y + 7, L.W, C - 14);
      c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 2; c.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        const yy = y + 18 + k * 12, ph = r() * 6;
        c.beginPath(); for (let x = 0; x <= L.W; x += 12) { const v = yy + Math.sin(x / 70 + ph) * 3; x ? c.lineTo(x, v) : c.moveTo(x, v); } c.globalAlpha = 0.45; c.stroke();
      }
      c.globalAlpha = 1;
      c.fillStyle = WHITE;
      c.beginPath(); c.moveTo(0, y - 1); c.lineTo(L.W, y - 1); c.lineTo(L.W, y + 6); for (let x = L.W; x > 0; x -= 26) c.quadraticCurveTo(x - 13, y + 13, x - 26, y + 6); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, y + C + 1); c.lineTo(L.W, y + C + 1); c.lineTo(L.W, y + C - 6); for (let x = L.W; x > 0; x -= 26) c.quadraticCurveTo(x - 13, y + C - 13, x - 26, y + C - 6); c.closePath(); c.fill();
    },
    band(c, L, r) {
      const y = L.H - L.CELL;
      c.fillStyle = this.colors.band; c.fillRect(0, y, L.W, L.CELL);
      c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 2; c.lineCap = "round";
      c.beginPath(); c.moveTo(380, y + 46); c.lineTo(430, y + 36); c.lineTo(470, y + 44); c.moveTo(430, y + 36); c.lineTo(450, y + 22);
      c.moveTo(600, y + 20); c.lineTo(650, y + 30); c.lineTo(700, y + 24); c.lineTo(760, y + 40); c.moveTo(650, y + 30); c.lineTo(660, y + 50); c.stroke();
      c.fillStyle = WHITE;
      c.beginPath(); c.moveTo(0, y - 1); c.lineTo(L.W, y - 1); c.lineTo(L.W, y + 3); for (let x = L.W; x > 0; x -= 34) c.quadraticCurveTo(x - 17, y + 11, x - 34, y + 3); c.closePath(); c.fill();
    },
    anim(ctx, L, t) {
      ctx.save();
      L.LANES.forEach((row, li) => {
        const y = row * L.CELL, span = L.W + 240;
        const x = ((t * 110 + li * 330) % span) - 120;
        ctx.globalAlpha = 0.4; ctx.fillStyle = WHITE;
        ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x + 26, y + 8); ctx.lineTo(x + 6, y + L.CELL - 8); ctx.lineTo(x - 20, y + L.CELL - 8); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 34, y + 8); ctx.lineTo(x + 42, y + 8); ctx.lineTo(x + 22, y + L.CELL - 8); ctx.lineTo(x + 14, y + L.CELL - 8); ctx.closePath(); ctx.fill();
      });
      const y = L.H - L.CELL;
      for (let k = 0; k < 6; k++) {
        const a = Math.max(0, Math.sin(t * 1.3 + k * 2.3));
        if (a < 0.05) continue;
        ctx.globalAlpha = a; ctx.fillStyle = WHITE;
        ctx.beginPath(); starPath(ctx, 330 + k * 88, y + 18 + (k % 3) * 12, 4, 2 + 3 * a, 0.8, 0); ctx.fill();
      }
      ctx.restore();
    }
  };

  /* ---------- départ & arrivée (communs) ---------- */
  function startPad(c, L, A) {
    const x = L.START.x - 40, y = L.START.y - 26;
    c.save();
    c.fillStyle = "rgba(29,27,47,.15)"; c.beginPath(); rr(c, x + 2, y + 4, 80, 52, 12); c.fill();
    c.beginPath(); rr(c, x, y, 80, 52, 12); c.fillStyle = A.pad; c.fill();
    if (A.padStripes) {
      c.save(); c.clip(); c.fillStyle = "rgba(255,255,255,.75)";
      for (const sx of [14, 34, 54]) c.fillRect(x + sx, y, 10, 52);
      c.restore();
    }
    c.strokeStyle = "rgba(29,27,47,.55)"; c.lineWidth = 3; c.stroke();
    c.beginPath(); rr(c, x + 6, y + 6, 68, 40, 8); c.setLineDash([6, 5]); c.strokeStyle = A.padStitch; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
    c.restore();
  }
  function goalBase(c, L, A) {
    const { x, y } = L.GOAL;
    c.save();
    c.beginPath(); c.arc(x, y, 37, 0, TAU); c.fillStyle = A.dark ? "rgba(255,200,61,.22)" : "rgba(255,200,61,.35)"; c.fill();
    c.beginPath(); c.arc(x, y, 31, 0, TAU); c.fillStyle = A.dark ? mix(SOL, "#1b1f3b", 0.45) : mix(SOL, CREME, 0.45); c.fill();
    c.lineWidth = 4; c.strokeStyle = SOL; c.stroke();
    c.beginPath(); c.arc(x, y, 34, 0, TAU); c.lineWidth = 2; c.strokeStyle = "rgba(29,27,47,.45)"; c.stroke();
    c.restore();
  }
  function goalGlow(ctx, L, t) {
    const { x, y } = L.GOAL;
    ctx.save();
    const ph = (t * 0.6) % 1;
    ctx.globalAlpha = 0.6 * (1 - ph); ctx.strokeStyle = SOL; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y, 36 + ph * 16, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.55; ctx.strokeStyle = WHITE; ctx.lineWidth = 3; ctx.setLineDash([5, 9]); ctx.lineDashOffset = -t * 12;
    ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  /* ---------- cache ---------- */
  const cache = {};
  function seedOf(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  function getStatic(key, L, scale) {
    const id = key + "|" + L.W + "x" + L.H + "|" + L.CELL + "|" + L.LANES.join(",") + "|" + L.START.x + "," + L.START.y + "|" + L.GOAL.x + "," + L.GOAL.y + "|" + scale;
    if (cache[id]) return cache[id];
    const A = W_[key];
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(L.W * scale); cv.height = Math.ceil(L.H * scale);
    const c = cv.getContext("2d");
    c.scale(scale, scale);
    const r = makeRng(seedOf(key));
    c.save(); A.ground(c, L, r); c.restore();
    L.LANES.forEach((row, li) => { c.save(); A.lane(c, L, row * L.CELL, li, r); c.restore(); });
    c.save(); A.band(c, L, r); c.restore();
    startPad(c, L, A); goalBase(c, L, A);
    return (cache[id] = cv);
  }

  function drawWorld(ctx, worldKey, L, t) {
    const key = W_[worldKey] ? worldKey : "ville";
    L = Object.assign({ W: 840, H: 600, CELL: 60, LANES: [2, 4, 6], START: { x: 420, y: 510 }, GOAL: { x: 420, y: 30 } }, L || {});
    t = t || 0;
    let scale = 1;
    try { const m = ctx.getTransform(); scale = Math.min(3, Math.max(1, Math.hypot(m.a, m.b))); } catch (e) {}
    scale = Math.round(scale * 4) / 4;
    const cv = getStatic(key, L, scale);
    ctx.drawImage(cv, 0, 0, L.W, L.H);
    ctx.save(); W_[key].anim(ctx, L, t); ctx.restore();
    goalGlow(ctx, L, t);
  }

  function drawThing(ctx, key, x, y, size, t, o) {
    const th = T[key]; if (!th) return;
    o = o || {};
    const s = size / 100;
    ctx.save();
    ctx.translate(x, y); ctx.scale(o.flip ? -s : s, s);
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = INK; ctx.lineWidth = 4.5;
    th.draw(ctx, t || 0, o);
    ctx.restore();
  }

  return { THINGS: T, WORLD_ART: W_, drawThing, drawWorld };
})();

const THINGS = SPRITES_WORLD_LIB.THINGS;
const WORLD_ART = SPRITES_WORLD_LIB.WORLD_ART;
function drawThing(ctx, key, x, y, size, t, o = {}) { SPRITES_WORLD_LIB.drawThing(ctx, key, x, y, size, t, o); }
function drawWorld(ctx, worldKey, L, t) { SPRITES_WORLD_LIB.drawWorld(ctx, worldKey, L, t); }
