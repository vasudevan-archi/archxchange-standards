# ArchXchange Standards (standalone page)

A searchable library of Indian building standards and state building rules, with calculators and project checklists. It is plain HTML, CSS and JavaScript with no build step, in the same brand style as the fee calculator. It is phone first: on phones the sections sit in a bottom tab bar.

**Live:** https://vasudevan-archi.github.io/archxchange-standards/ (GitHub Pages, repository `vasudevan-archi/archxchange-standards`, public).

To publish a change, raise the `?v=` number on the CSS and script links in `index.html` (so browsers fetch the new files instead of cached ones), then commit and push from this folder. Pages rebuilds in about a minute.

```
git add -A
git commit -m "Describe the change"
git push
```

## Sections

| Section | What it does |
|---|---|
| Library (home) | Search first. Then **What are you designing?**: eight building types, each opening a page (`#/b/<type>`) with every standard and the chosen state's rules in design order (site and bylaws, rooms, stairs, access, light, fire, water and toilets, parking), with "Save all to a new project" and "Download all · PDF". Then **Today**: standard of the day, a one-question daily check with a streak, and what's new since the last visit. Recently viewed, and topics. |
| Bylaws (`#/bylaws/<state>`) | State building rules, grouped by topic (setbacks, height and FSI, high-rise, parking). Bylaw rules also appear in Library search results. |
| Calculators (`#/tools`) | NBC: water tanks, toilets, occupants and exit width, ramp, window area, parking area. Tamil Nadu (TNCDBR): setbacks, FSI and floor area, parking spaces. The same calculators open inside each rule. |
| Projects | Saved on the device (`localStorage` key `ax.standards.v1`). Each project is a checklist with a status and a note per item. Download all as a PDF book (with drawings, statuses and notes) or a checklist PDF; the drawing pack (DWG, DXF, A3 PDF) is a Solo feature. |

## Downloads and plans

- **Free:** a PDF of any standard, a whole building, or a project (the browser's Save as PDF, from a print layout in `style.css`).
- **Solo (₹999 a month, from the business plan):** the CAD drawings (DWG, DXF) and the A3 PDF drawing sheets to scale, and project drawing packs. The buttons open a Solo panel; there is no payment or file delivery yet.

## Keeping people coming back

- **Daily check:** `QUIZ` in `data.js`, one question a day, with a streak (`ax.standards.daily.v1`).
- **What's new:** `UPDATES` in `data.js`. Add a line with each content change; returning visitors see a count of what is new since their last visit (`ax.standards.prefs.v1`, which also keeps the chosen state and recently viewed).

## Files

| File | Holds |
|---|---|
| `data.js` | Building types, categories, 41 standards, the list of drawings (`FIGS`) and the CAD sheets (`CAD`) |
| `bylaws.js` | States (`STATES`) and state rules (`RULES`); rules use the same shape as standards, with `state` and `topic` |
| `app.js` | Search, filters, detail sheet, calculators, bylaws, projects, routing |
| `style.css` | Look and layout |
| `figs/*.png` | Web previews of the drawings |

## Drawings and CAD files

- **Rayon model "ArchXchange Standards":** 18 sheets, one canvas each, in one shared style (layers AX-SHEET, AX-CLEAR, AX-MOVE, AX-WALL, AX-FIXTURE, AX-ACCENT, AX-DIM, AX-TEXT; teal = keep clear, amber = movement or area, copper = key sizes; font Geist). Each canvas has an A3 frame and title block at its scale.
  - NBC: accessible toilet, wheelchair space and turning, accessible lift, car parking, stair section, ramp section, room heights, minimum rooms, windows and ventilators, staircase widths, parapets, kerb ramp, exits and travel distance.
  - Tamil Nadu: setbacks, heights and high-rise setbacks, parking stalls, FSI and coverage, parking required.
- **DWG, DXF and A3 PDF files** are exported from Rayon (Menu, Export, one canvas at a time) into `../standards-cad/`, outside this public repository, because they are for paying users.
- **Web previews:** `figs/*.png` are Rayon captures of each drawing without its title block. `FIGS` in `data.js` lists them; each standard and rule names its drawing with `fig`.
- Tables (water demand, tanks, toilet counts, planning norms, occupant load) have no drawing.

## Sources and rules for adding content

- **NBC 2016:**
  - Vol. 1: Part 3 with Annex B, and Part 4.
  - Vol. 2: Part 9, including the sanitary fixture tables and water storage clause 4.4.10.
- **URDPFI 2014, Vol. I.**
- **State rules:** the official PDFs are kept locally in a "State bylaws" folder.
  - Tamil Nadu: TNCDBR 2019 (added).
  - Delhi: UBBL 2016 compendium (downloaded, rules to add).
  - Maharashtra: UDCPR 2020 (downloaded, rules to add).
  - Kerala and Karnataka: the government sites refused the connection, so the page links to the official page for now.
  - Telangana: linked to the official orders.
- **Writing rules:**
  - Write values in our own words, with the rule, clause or table.
  - Check table columns against the raw PDF layout before stating a value; some tables have split columns.
  - Never paste code text or drawings.
  - Amendments are frequent, so each state card says so.
- **Next:**
  - Rules for Delhi and Maharashtra.
  - Kerala and Karnataka, once their PDFs can be fetched.
  - Gujarat (CGDCR 2017) and Telangana (G.O. 168 and its amendments).
  - More toilet tables: hospitals, hotels, assembly.
  - A real Pro download flow.
