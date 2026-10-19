#!/usr/bin/env python3
"""Tell search engines (Bing, Yandex, Seznam, Naver and others) which pages changed, via IndexNow.

Usage, from the repo root:
  python scripts/indexnow.py --all            submit every page in sitemap.xml
  python scripts/indexnow.py FILE [FILE ...]  submit the pages for these changed files
A changed page file maps to its URL (nl/absoluut/index.html -> https://imgroot.nl/nl/absoluut/).
Only URLs listed in sitemap.xml are sent, so redirect pages and the 404 page never are.
The key below is public by design: the engines check it against /<key>.txt on the site.
"""
import json
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOST = "imgroot.nl"
KEY = "78635e156c1fe36844998bc803d08a77"
ENDPOINT = "https://api.indexnow.org/indexnow"


def sitemap_urls():
    return re.findall(r"<loc>([^<]+)</loc>", (ROOT / "sitemap.xml").read_text())


def url_for(path):
    path = path.strip().lstrip("./")
    if not path.endswith(".html"):
        return None
    path = re.sub(r"(^|/)index\.html$", r"\1", path)
    return f"https://{HOST}/{path}"


def main(args):
    known = sitemap_urls()
    if args == ["--all"]:
        urls = known
    else:
        urls = sorted({u for u in map(url_for, args) if u in known})
    if not urls:
        print("No changed pages to submit.")
        return
    body = json.dumps({
        "host": HOST,
        "key": KEY,
        "keyLocation": f"https://{HOST}/{KEY}.txt",
        "urlList": urls,
    }).encode()
    req = urllib.request.Request(ENDPOINT, data=body, headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(req, timeout=30) as res:
        print(f"IndexNow answered {res.status} for {len(urls)} URL(s):")
    print("\n".join(urls))


if __name__ == "__main__":
    main(sys.argv[1:])
