#!/usr/bin/env python3
"""Keep <lastmod> in sitemap.xml in step with the pages.

For every <loc> in sitemap.xml the script looks up the page file (https://imgroot.nl/nl/absoluut/ ->
nl/absoluut/index.html) and sets <lastmod> to the date of the last commit that changed that file.
Run it from the repo root in a full clone (git history needed); it prints what changed.
"""
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOST = "https://imgroot.nl/"


def last_changed(path):
    out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", path], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return out or None


def main():
    sitemap = ROOT / "sitemap.xml"
    text = sitemap.read_text()

    def fix(m):
        loc, old = m.group(1), m.group(2)
        path = loc[len(HOST):] + "index.html" if loc.endswith("/") else loc[len(HOST):]
        new = last_changed(path) if (ROOT / path).exists() else None
        if new and new != old:
            print(f"{loc}: {old} -> {new}")
            return m.group(0).replace(f"<lastmod>{old}</lastmod>", f"<lastmod>{new}</lastmod>")
        return m.group(0)

    new_text = re.sub(r"<loc>([^<]+)</loc>\s*<lastmod>([^<]+)</lastmod>", fix, text)
    if new_text != text:
        sitemap.write_text(new_text)
    else:
        print("The sitemap dates are up to date.")


if __name__ == "__main__":
    main()
