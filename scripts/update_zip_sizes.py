#!/usr/bin/env python3
"""Keep the download sizes on the press kit in step with the zip files.

Every link to assets/press-kit/<name>.zip on the press kit pages (EN/NL/IT) shows
"ZIP · <size>". This script measures each zip and rewrites that size:
under 1 MB in whole KB (139 KB), from 1 MB with one decimal (11.7 MB, 11,7 MB in NL/IT).
Run it from the repo root; it only touches the size text and prints what changed.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = {
    "absoluut/press-kit/index.html": ".",
    "nl/absoluut/press-kit/index.html": ",",
    "it/absoluut/press-kit/index.html": ",",
}


def label(size, decimal):
    if size < 1024 * 1024:
        return f"{max(1, round(size / 1024))} KB"
    return f"{size / (1024 * 1024):.1f} MB".replace(".", decimal)


def main():
    zips = sorted((ROOT / "assets/press-kit").glob("*.zip"))
    changed = 0
    for page, decimal in PAGES.items():
        path = ROOT / page
        html = path.read_text(encoding="utf-8")
        new = html
        for z in zips:
            size = label(z.stat().st_size, decimal)
            # the size inside the same link as the zip (the link ends at </a>)
            pattern = re.compile(
                r'(href="[^"]*/assets/press-kit/' + re.escape(z.name) + r'"[^>]*>(?:(?!</a>).)*?ZIP · )[0-9.,]+ [KM]B',
                re.S,
            )
            new = pattern.sub(lambda m: m.group(1) + size, new)
        if new != html:
            path.write_text(new, encoding="utf-8")
            changed += 1
            print(f"updated {page}")
    if not changed:
        print("zip sizes already up to date")


if __name__ == "__main__":
    main()
