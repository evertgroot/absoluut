# imgroot.nl: how this repository works

The personal website of Evert Groot (content strategist, creator, DJ as Absoluut, co-founder of BOPS). Static HTML/CSS in English, Dutch and Italian, hosted on GitHub Pages at imgroot.nl. Read `PRODUCT.md` for audience, positioning and design constraints before changing copy or layout.

## Talking to Evert

Evert is not technical and speaks Dutch. Explain changes in plain Dutch, without git jargon ("ik heb een voorstel klaargezet" instead of "I opened a PR").

## Workflow: branch, review, then live

1. Pull `main` first. A GitHub Action commits to `main` every day (see Automation), so a local copy is often behind.
2. Make the change on a new branch. **Never push to `main`.**
3. Push the branch and open a pull request with `gh`.
4. Before asking for approval, list every change as before / after: visible copy, page titles, meta and og descriptions, sitemap, structured data, workflows. A summary like "titles shortened" is not enough. Use a table (page | now | after) for repeated changes.
5. Evert approves with "merge". Then run `gh pr merge N --merge`.
6. If no Pages build starts for the merge commit within about 30 seconds, trigger one: `gh api -X POST repos/evertgroot/absoluut/pages/builds`. Merges sometimes don't start a build.
7. Check the live page with `curl` afterwards.

## Rules for every change

- **No framework and no build step.** This is a hard constraint. Shared behavior lives in `assets/site.js`, styles in `assets/css/`, fonts are self-hosted in `assets/fonts/`.
- **All three languages together.** English is at the root, Dutch under `/nl/`, Italian under `/it/`. A copy change in one language gets the matching change in the other two in the same PR, or a question to Evert. Rename a thing everywhere it appears: cards, case H1s, page titles, "Next case" links. Search all three languages for the old text before opening the PR.
- **US English** for the English pages: American spelling, Title Case for titles, buttons and labels.
- **Press kit PDF.** Any change to the press kit (`absoluut/press-kit/` and its `nl/` and `it/` versions), or a site-wide change that shows up in it (act name, URLs, titles, contact lines), needs the PDF checked. Print-only blocks (such as `pdf-name`, `pk-pdf-zip`, `pk-pdf-vid`, `pk-pdf-src`, `pk-pdf-rider-q`) are separate from the screen copy. Rebuild the EN, NL and IT PDFs locally (Chrome print, `assets/css/press-kit.css` print styles), check each is still one page, and commit them (`Absoluut-Press-Kit-EN/NL/IT.pdf` plus the old-name copies) in the same PR.
- **Old paths stay.** The DJ page is `/absoluut/`. `/dj/` and `/djabsoluut/` (and the older `dj.html`) are redirect stubs: keep them.
- **Cache-busting.** CSS and JS are loaded with `?v=<first 8 characters of the file's md5>`. After changing a CSS or JS file, update that hash in every HTML file that loads it.
- **Gigs** are listed in `assets/gigs.json` (fields `date`, `event`, `venue`, `city`, optional `url`, `show`, `logo`, `note`, `private` = `wedding` or `event`). New gigs go in as hidden drafts (`show: false`) until Evert says otherwise. Gig logos: trim empty space, make them white (site logos are CSS masks), save under `assets/img/`. On Evert's Mac the source files are in `~/Downloads/Claude/* evert folder - logos for gigs/`.

## Site facts

- Two identities on one site: **Evert Groot** (homepage, near-black with turquoise `#7bd6e0`) and **Absoluut** (DJ page and press kit, aubergine with red `#c8193a` and pink `#ff9fb2`).
- Fonts: Baloo Bhai 2 (headings) and Manrope (body), self-hosted. Forms go through Web3Forms. Analytics: GoatCounter, no cookies.
- `78635e156c1fe36844998bc803d08a77.txt` is the IndexNow key. It is meant to be public.
- Positioning, tone of voice and copy rules for the homepage and cases: the Evert Groot Content Handbook (https://claude.ai/artifact/Guvon52fMBG6UcXKhkTBBm). DJ page, press kit, facts and bios: the Absoluut Content Handbook (https://claude.ai/artifact/WH8Ja4kU6kBCrP8oicC27o).

## Copy rules

- English: American spelling, Title Case for titles, buttons and labels. Dutch: "dj" in lowercase, "DJ" at the start of a sentence, "DJ Absoluut" as the act name. Italian: "DJ".
- No claims without a number. Leave it out rather than keep it vague.
- Specific titles, no empty words like "Impactful" or "& More". No em dashes, no buzzwords.
- Headings match in meaning across all three languages. When Evert picks a heading in one language, the others follow it.
- Homepage: strategist first. Title and meta description say "Content Strategist & DJ".
- On mobile, never leave one word alone on the last line of a heading: keep the last two words together with `&nbsp;`.
- No promises about reply time in form texts.
- Reviews on the DJ page are quotes: never edit them.
- Kaspersky and Ferry van der Nat may appear under brand events. In "Gigs per year" the Kaspersky event shows as "Private event", without the name.

## SEO rules

- Page titles under 60 characters. Case pages don't end in " | Evert Groot".
- Meta descriptions under 155 to 160 characters.
- Every page has a self-referencing canonical and hreflang for NL, EN, IT and x-default.
- Search Console is in the Google account evert@imgroot.nl (domain property `imgroot.nl`), not the BOPS account.

## Automation (GitHub Actions)

- `update-bops-event.yml`: runs daily at 05:15 UTC, reads The Other Side's agenda (`scripts/update_bops_event.py`) and commits `assets/bops-event.json` to `main` as "Update next BOPS event". Don't edit that file by hand. The script owns it.
- `press-kit-pdf.yml`: rebuilds the press kit PDFs after a press kit change is merged, commits them and requests a Pages build.
- `sitemap-lastmod.yml` and `indexnow.yml`: keep `sitemap.xml` dates current and notify search engines.

## Checking a change (Mac session)

- Show every visible change in the browser pane preview before asking for "merge". The preview server can't read `~/Downloads`, so copy the repo (without `.git`) to the session scratchpad and serve it on `127.0.0.1:8750`.
- Also check it in Safari: the iOS Simulator for mobile, and Mac Safari through `safaridriver` for hover and click. Some bugs show up only in Safari, like a focused `<main>` jumping to the top, or radios that ignore their height without `appearance: none`.
- Put temporary debug scripts in the scratchpad copy only, never in the repo.

The older copy in `~/Downloads/imgroot-website` is outdated. Don't work there.
