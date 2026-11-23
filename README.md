# ArchXchange Standards (standalone page)

A searchable library of Indian building standards. You can save standards to projects and tick them off as a checklist. It is plain HTML, CSS and JavaScript with no build step, in the same brand style as the fee calculator. Open `index.html` through a local server or GitHub Pages.

**Live:** https://vasudevan-archi.github.io/archxchange-standards/ (GitHub Pages, repository `vasudevan-archi/archxchange-standards`, public).

To publish a change, commit and push from this folder. Pages rebuilds in about a minute.

```
git add -A
git commit -m "Describe the change"
git push
```

## What it does

- **Search** across titles, everyday words (tags), values and notes. Matches are highlighted. Press `/` to jump to the search box.
- **Filters:** by building type (NBC occupancy groups A–H) and by eight categories:
  - Rooms and heights
  - Stairs and parapets
  - Accessibility
  - Light and air
  - Fire and exits
  - Parking
  - Water demand
  - Planning norms
- **Standard of the day,** to give people a reason to come back daily.
- **Detail sheet:** the value, a drawing, the full values table, notes, the buildings it applies to, a citation with a Copy button, and Save to project. Each standard has a link, `#/s/<id>`, that can be shared.
- **Calculators:**

  | Calculator | Input | Output |
  |---|---|---|
  | Ramp | Level difference | Gradient and length |
  | Window | Floor area and climate | Minimum opening area |
  | Exits | Floor area and use | Occupants and exit widths |
  | Parking | Number of ECS | Parking area |
  | Water | People and building type | Litres a day |

- **My projects** (saved on the device, `localStorage` key `ax.standards.v1`):
  - Create a project with a name and building type.
  - Save standards to it. Each has a status (To do, Complies, Check) and a note.
  - The page suggests every standard that applies to the project's building type, with an "Add all" button.
  - Print the checklist.

## Files

| File | Holds |
|---|---|
| `data.js` | Building types, categories, the 35 standards (about 120 values), and the list of drawings |
| `app.js` | Search, filters, detail sheet, calculators, projects, routing |
| `style.css` | Look and layout (phone first) |
| `figs/*.svg` | 7 drawings made in VectorCraft: stair, ramp, parking, accessible toilet, wheelchair turning, lift, windows |

## Sources and rules for adding standards

- **Sources:**
  - NBC 2016 Vol. 1: Part 3 including Annex B, and Part 4.
  - NBC 2016 Vol. 2: Part 9.
  - URDPFI Guidelines 2014, Vol. I.
- **How values were checked:** each one was read from the PDF text on 23 Nov 2026 and is cited by clause or table.
- **Write in our own words.** Never paste code text, tables or drawings. The NBC PDF is a licensed copy; never upload or share it.
- **Draw new figures ourselves** (VectorCraft or CADCraft), on the house style:
  - paper background `#F6F3EE`
  - charcoal lines `#26262B`
  - copper dimensions `#E8692E`
  - artboard 800 × 480, text outlined
- **Register a new drawing:** add its name to `FIGS` in `data.js`.
- **Candidates for the next batch:**
  - NBC Part 4: fire exits, number of staircases, fire lifts.
  - NBC Part 9: number of sanitary fixtures.
  - National Lighting Code: lux levels.
  - The hospital compendium.
  - URDPFI: parks and green spaces.
  - Neufert and Time-Saver Standards as cross-references only, never copied.
