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
| Library | Search with a Search button (Enter works too; on phones it closes the keyboard and jumps to results). Filter by building type and category. A standard of the day. A detail sheet for each standard with its drawing, values, notes, calculator, citation and Save to project. |
| Bylaws (`#/bylaws/<state>`) | State building rules, grouped by topic (setbacks, height and FSI, high-rise, parking). Bylaw rules also appear in Library search results. |
| Calculators (`#/tools`) | Water tanks, toilets required, occupants and exit width, ramp, window area, parking area. |
| Projects | Saved on the device (`localStorage` key `ax.standards.v1`). Each project is a checklist with a status (To do, Complies, Check) and a note per item, plus suggestions for its building type. It prints. |

## Files

| File | Holds |
|---|---|
| `data.js` | Building types, categories, 41 standards, the list of drawings (`FIGS`) and the CAD sheets (`CAD`) |
| `bylaws.js` | States (`STATES`) and state rules (`RULES`); rules use the same shape as standards, with `state` and `topic` |
| `app.js` | Search, filters, detail sheet, calculators, bylaws, projects, routing |
| `style.css` | Look and layout |
| `figs/*.svg` | Web previews of the drawings |

## Drawings and CAD files

- **CAD sheets:** six sheets drafted in CADCraft at full size in millimetres. Each has layers, a wall poché, dimension strings and a title block:
  - accessible toilet (Type A)
  - stair section
  - ramp section
  - car parking plan
  - accessible lift
  - wheelchair space and turning
- **DWG and DXF files** are in `../standards-cad/`, outside this public repository, because they are for paying users. The detail sheet shows a "Download · Pro" button that is not live yet.
- **Web previews:** the SVGs in `figs/` are exported from the same drawings and recoloured with `../standards-cad/web-colours.sh`.
- The window-area figure was made in VectorCraft.

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
