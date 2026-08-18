#!/usr/bin/env python3
"""Concatenates src/ parts into the single self-contained gridwright.html.

This exists for the author's convenience only. The shipped artefact is
gridwright.html, which needs no build step and no server to run.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
OUT = ROOT / "gridwright.html"

def read(name):
    p = SRC / name
    if not p.exists():
        print(f"  missing (skipped): {name}")
        return ""
    return p.read_text(encoding="utf-8")

def parts(prefix, ext):
    return sorted(p.name for p in SRC.glob(f"{prefix}*{ext}"))

css = "\n".join(read(n) for n in parts("1", ".css"))
markup = "\n".join(read(n) for n in parts("2", ".html"))
js = "\n".join(read(n) for n in sorted(
    p.name for p in SRC.glob("*.js")))

head = read("00_head.html")

html = head.replace("/*__CSS__*/", css) \
           .replace("<!--__MARKUP__-->", markup) \
           .replace("/*__JS__*/", js)

OUT.write_text(html, encoding="utf-8")
kb = OUT.stat().st_size / 1024
print(f"built {OUT} ({kb:.0f} KB, {html.count(chr(10))+1} lines)")

# sanity checks
problems = []
if "/*__CSS__*/" in html: problems.append("CSS placeholder not replaced")
if "/*__JS__*/" in html: problems.append("JS placeholder not replaced")
if "<!--__MARKUP__-->" in html: problems.append("markup placeholder not replaced")
if problems:
    print("PROBLEMS: " + "; ".join(problems)); sys.exit(1)
