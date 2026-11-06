#!/usr/bin/env python3
"""Assemble src/ en un seul fichier index.html autonome (hors ligne)."""
import base64, pathlib
src = pathlib.Path(__file__).parent / "src"
def font(name, file):
    b64 = base64.b64encode((src / file).read_bytes()).decode()
    return f'@font-face{{font-family:"{name}";src:url(data:font/woff2;base64,{b64}) format("woff2");font-weight:300 800;font-display:swap}}'
html = (src / "atelier.html").read_text()
parts = {
    "/*@FONTS@*/": font("Fredoka", "fredoka.woff2") + "\n" + font("Nunito", "nunito.woff2"),
    "/*@STYLE@*/": (src / "style.css").read_text(),
    "/*@QRCODE@*/": (src / "qrcode.js").read_text(),
    "/*@SPRITES@*/": (src / "sprites-chars.js").read_text() + "\n" + (src / "sprites-world.js").read_text(),
}
for k, v in parts.items():
    assert html.count(k) == 1, k
    html = html.replace(k, v)
(src.parent / "index.html").write_text(html)
print("index.html :", len(html) // 1024, "Ko")
