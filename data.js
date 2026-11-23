/* ArchXchange Standards: the library.
 * Every value is stated in ArchXchange's own words from the source named on it, and was checked against
 * that source on 23 Nov 2026. Cite the clause; never paste a code's text or drawings here.
 *   NBC   = National Building Code of India 2016 (BIS), Vol. 1 Part 3 (incl. Annex B), Part 4; Vol. 2 Part 9
 *   URDPFI = Urban and Regional Development Plans Formulation and Implementation Guidelines, Vol. I (MoUD, 2014)
 *
 * Entry: { id, cat, title, value, sub, rows?, notes?, uses: ["all"] or building-type ids, src, tags, fig?, calc? }
 */
(function (root) {
	"use strict";

	const TYPES = [
		{ id: "res", name: "Residential", nbc: "A", eg: "Houses, flats, hostels, hotels" },
		{ id: "edu", name: "Educational", nbc: "B", eg: "Schools, colleges, training centres" },
		{ id: "health", name: "Healthcare", nbc: "C", eg: "Hospitals, clinics, nursing homes" },
		{ id: "assembly", name: "Assembly", nbc: "D", eg: "Halls, auditoria, places of worship" },
		{ id: "business", name: "Offices", nbc: "E", eg: "Offices, banks, IT parks" },
		{ id: "retail", name: "Retail", nbc: "F", eg: "Shops, showrooms, malls" },
		{ id: "industrial", name: "Industrial", nbc: "G", eg: "Factories, workshops" },
		{ id: "storage", name: "Storage", nbc: "H", eg: "Warehouses, godowns, cold stores" },
	];

	const CATS = [
		{ id: "rooms", name: "Rooms and heights", blurb: "Minimum room sizes, ceiling heights, kitchens, baths, lofts" },
		{ id: "stairs", name: "Stairs and parapets", blurb: "Stair widths by occupancy, risers, treads, headroom, parapets" },
		{ id: "access", name: "Accessibility", blurb: "Ramps, doors, lifts, wheelchair space, accessible toilets" },
		{ id: "light", name: "Light and air", blurb: "Window and ventilator area by climate" },
		{ id: "fire", name: "Fire and exits", blurb: "Occupant load, exit widths, travel distance" },
		{ id: "parking", name: "Parking", blurb: "Car, two-wheeler and cycle spaces, area per ECS" },
		{ id: "water", name: "Water and tanks", blurb: "Litres per head per day, sump and overhead tank sizes" },
		{ id: "sanitary", name: "Toilets", blurb: "How many WCs, urinals and basins, by building type" },
		{ id: "planning", name: "Planning norms", blurb: "Schools, colleges and hospitals per population" },
	];

	const NBC3 = "NBC 2016, Part 3", NBCB = "NBC 2016, Part 3, Annex B", NBC4 = "NBC 2016, Part 4", NBC9 = "NBC 2016, Part 9", URD = "URDPFI 2014, Vol. I";
	const HAB = ["res", "business", "retail"];

	const S = [
		/* ---------- Rooms and heights ---------- */
		{ id: "room-height", cat: "rooms", title: "Habitable room height", value: "2.75 m", sub: "minimum, floor to the underside of the slab",
			notes: ["Pitched roof: the average height must be at least 2.75 m.", "Applies to residential, business and mercantile buildings."],
			uses: HAB, src: [NBC3, "cl. 12.2.1"], tags: "ceiling height floor to ceiling room height living bedroom", fig: "room" },
		{ id: "headroom-beam", cat: "rooms", title: "Headroom under beams and eaves", value: "2.4 m", sub: "minimum clear headroom",
			notes: ["Also applies under folded plates."], uses: HAB, src: [NBC3, "cl. 12.2.1"], tags: "beam bottom clear height eaves soffit", fig: "room" },
		{ id: "ac-height", cat: "rooms", title: "Air-conditioned room height", value: "2.4 m", sub: "minimum, floor to the duct or false ceiling",
			uses: HAB, src: [NBC3, "cl. 12.2.1"], tags: "false ceiling duct ac room height", fig: "room" },
		{ id: "edu-height", cat: "rooms", title: "Classroom ceiling height", value: "3.6 m", sub: "3 m in cold regions",
			uses: ["edu"], src: [NBC3, "cl. 12.2.1.1"], tags: "school classroom educational ceiling height" },
		{ id: "ind-height", cat: "rooms", title: "Industrial ceiling height", value: "3.6 m", sub: "3 m where air-conditioned",
			notes: ["Where the Factories Act, 1948 and its rules set heights, they govern."], uses: ["industrial"], src: [NBC3, "cl. 12.2.1.1"], tags: "factory shed workshop ceiling height" },
		{ id: "room-area", cat: "rooms", title: "Habitable room size", value: "9.5 m²", sub: "minimum, at least 2.4 m wide",
			rows: [["One room only", "9.5 m², 2.4 m wide"], ["Two rooms: the first", "9.5 m²"], ["Two rooms: the second", "7.5 m², 2.1 m wide"]],
			uses: ["res"], src: [NBC3, "cl. 12.2.2"], tags: "bedroom living room minimum area room size width" },
		{ id: "kitchen", cat: "rooms", title: "Kitchen size", value: "5.0 m²", sub: "minimum, 1.8 m wide, with a separate dining area",
			rows: [["With separate dining", "5.0 m², 1.8 m wide"], ["With a separate store as well", "4.5 m²"], ["Kitchen used for dining", "7.5 m², 2.1 m wide"], ["Height", "2.75 m"]],
			notes: ["Needs a sink to a trapped waste, an impermeable floor, a flue if needed, and a window or ventilator."],
			uses: ["res"], src: [NBC3, "cl. 12.3"], tags: "kitchen area width cooking pantry", fig: "kitchen" },
		{ id: "bath", cat: "rooms", title: "Bathroom and WC sizes", value: "1.8 m²", sub: "bathroom minimum, 1.2 m wide",
			rows: [["Bathroom", "1.8 m², 1.2 m wide"], ["Water closet", "1.1 m², 0.9 m wide"], ["Bath and WC combined", "2.8 m², 1.2 m wide"], ["Height", "2.1 m"]],
			uses: ["all"], src: [NBC3, "cl. 12.4"], tags: "toilet washroom bathroom wc water closet size area", fig: "bath" },
		{ id: "bath-vent", cat: "rooms", title: "Bathroom and WC ventilation", value: "0.3 m²", sub: "window or ventilator, each side at least 0.3 m",
			notes: ["At least one wall must open to external air; the ventilator may open to a shaft or open space.", "Walls finished in smooth impervious material up to 1 m.", "A WC must not open directly into a kitchen."],
			uses: ["all"], src: [NBC3, "cl. 12.4.3, 12.4.4"], tags: "toilet ventilator duct shaft window bathroom" },
		{ id: "loft", cat: "rooms", title: "Loft (tand)", value: "1.5 m", sub: "maximum loft height; 2.2 m headroom below it",
			uses: ["res"], src: [NBC3, "cl. 12.5.1"], tags: "loft tand ledge storage" },

		/* ---------- Stairs and parapets ---------- */
		{ id: "stair-width", cat: "stairs", title: "Staircase width", value: "1.0–2.0 m", sub: "minimum clear width, by occupancy",
			rows: [["Houses, one or two family (A-2)", "1.00 m"], ["Row houses, 2 storeys", "0.75 m"], ["Lodging, dormitories, apartments (A-1, A-3, A-4)", "1.25 m"], ["Hotels (A-5, A-6)", "1.50 m"],
				["Assembly", "2.00 m (1.50 m under 150 persons)"], ["Educational", "1.50 m"], ["Institutional / hospitals", "2.00 m"], ["All other occupancies", "1.50 m"]],
			notes: ["Check exit width for the occupant load too (Part 4)."], uses: ["all"], src: [NBC3, "cl. 12.18.1.1"], tags: "stair staircase width flight", fig: "stair" },
		{ id: "riser", cat: "stairs", title: "Stair riser", value: "150 mm", sub: "maximum; up to 190 mm in one or two family houses",
			uses: ["all"], src: [NBC3, "cl. 12.18.1.3"], tags: "riser step height stair rise", fig: "stair" },
		{ id: "tread", cat: "stairs", title: "Stair tread", value: "300 mm", sub: "minimum, without nosing; 250 mm in one or two family houses",
			uses: ["all"], src: [NBC3, "cl. 12.18.1.2"], tags: "tread going step depth stair", fig: "stair" },
		{ id: "risers-flight", cat: "stairs", title: "Risers per flight", value: "12", sub: "maximum risers in one flight",
			uses: ["all"], src: [NBC3, "cl. 12.18.1.3"], tags: "flight landing number of steps", fig: "stair" },
		{ id: "stair-headroom", cat: "stairs", title: "Stair headroom", value: "2.2 m", sub: "minimum clear, in the stair and under landings",
			uses: ["all"], src: [NBC3, "cl. 12.18.2"], tags: "headroom stair landing clear height", fig: "stair" },
		{ id: "parapet", cat: "stairs", title: "Parapet and balcony rail height", value: "1.0–1.2 m", sub: "from finished floor level",
			uses: ["all"], src: [NBC3, "cl. 12.11"], tags: "parapet railing balcony terrace guard rail height", fig: "parapet" },

		/* ---------- Accessibility ---------- */
		{ id: "door-width", cat: "access", title: "Door clear opening", value: "900 mm", sub: "minimum clear width, door face to stop",
			uses: ["all"], src: [NBCB, "B-5.3.2.1"], tags: "door width doorway clear opening wheelchair", fig: "door" },
		{ id: "turning", cat: "access", title: "Wheelchair turning space", value: "1 500 mm", sub: "minimum diameter; 1 800 mm is comfortable",
			uses: ["all"], src: [NBCB, "Fig. 15"], tags: "wheelchair turning circle radius manoeuvre", fig: "turning" },
		{ id: "wheelchair", cat: "access", title: "Wheelchair space", value: "900 × 1 200 mm", sub: "occupied floor space; 900 × 1 350 mm preferred",
			uses: ["all"], src: [NBCB, "Fig. 14"], tags: "wheelchair footprint parking space clear floor", fig: "turning" },
		{ id: "ramp", cat: "access", title: "Ramp gradient", value: "1:12", sub: "steepest, for rises up to 750 mm",
			rows: [["Rise 150–300 mm", "1:12"], ["Rise 301–750 mm", "1:12"], ["Rise 751–3 000 mm", "1:15"], ["Rise over 3 000 mm", "1:20"]],
			notes: ["Clear width at least 1 200 mm, excluding handrails, wider as the rise grows.", "Level landings at least 1 500 × 1 500 mm at the top and bottom; intermediate landings at least 1 500 mm long.",
				"Where a ramp rises more than 300 mm, add steps for ambulant users.", "Internal ramps: no series should rise more than 2 000 mm in total; use a lift instead."],
			uses: ["all"], src: [NBCB, "B-6.2, Table 10"], tags: "ramp slope gradient wheelchair 1:12 1 in 12 accessible", fig: "ramp", calc: "ramp" },
		{ id: "handrail", cat: "access", title: "Handrails", value: "700–900 mm", sub: "height; 50–65 mm clear of the wall",
			notes: ["Must take a load of 1.7 kN, have no sharp edges, and contrast with the wall."], uses: ["all"], src: [NBCB, "handrails"], tags: "handrail grab rail height ramp stair", fig: "ramp" },
		{ id: "kerb-ramp", cat: "access", title: "Kerb ramp", value: "1:12", sub: "steepest; at least 1 200 mm wide",
			uses: ["all"], src: [NBCB, "kerb ramps"], tags: "kerb ramp footpath curb cut", fig: "ramp" },
		{ id: "lift", cat: "access", title: "Accessible lift", value: "1 500 × 1 500 mm", sub: "minimum car; door at least 900 mm clear",
			notes: ["Automatic horizontal sliding doors, contrasting with the wall.", "Gap between car and floor no more than 12 mm; levelling within ±12 mm.", "Doors stay open more than 5 s and close no faster than 0.25 m/s."],
			uses: ["all"], src: [NBCB, "B-6.4.2, B-6.4.3"], tags: "lift elevator car size door wheelchair", fig: "lift" },
		{ id: "acc-toilet", cat: "access", title: "Accessible toilet", value: "2 200 × 2 300 mm", sub: "Type A minimum, width × depth",
			rows: [["Type A (WC central, both-side transfer)", "2 200 × 2 300 mm; 1 800 × 1 800 mm turning"], ["Type B (one-side transfer)", "1 700 × 2 200 mm; 1 500 × 1 500 mm turning"], ["Space beside the WC", "900 mm minimum; 1 200 mm preferred"]],
			notes: ["At least one unisex Type A toilet is the preferred provision."], uses: ["all"], src: [NBCB, "B-9.2"], tags: "accessible toilet disabled wc unisex handicap washroom", fig: "toilet" },

		/* ---------- Light and air ---------- */
		{ id: "openings", cat: "light", title: "Window and ventilator area", value: "1/10–1/6", sub: "of the floor area, by climate, excluding doors",
			rows: [["Hot-dry", "1/10 of floor area"], ["Warm-humid", "1/6"], ["Temperate and composite", "1/8"], ["Cold", "1/12"]],
			notes: ["Openings must open directly to external air or an open verandah."], uses: ["all"], src: [NBC3, "cl. 20.1.1, 20.1.2"], tags: "window area ventilation daylight opening fenestration climate", fig: "window", calc: "window" },

		/* ---------- Fire and exits ---------- */
		{ id: "occupant-load", cat: "fire", title: "Occupant load", value: "m² per person", sub: "gross floor area per occupant, by use",
			rows: [["Residential", "12.5"], ["Educational", "4.0"], ["Hospital in-patients", "15.0"], ["Hospital out-patients", "10.0"], ["Assembly, concentrated, no fixed seats", "0.65"], ["Assembly, less concentrated", "1.40"],
				["Dining and restaurants", "1.80"], ["Shops: street floor and sales basement", "3.0"], ["Shops: upper floors", "6.0"], ["Offices", "10.0"], ["Industrial", "10.0"], ["Storage", "30.0"]],
			notes: ["Fixed seating: count the seats."], uses: ["all"], src: [NBC4, "cl. 4.3, Table 3"], tags: "occupant load factor persons capacity fire exit", calc: "exit" },
		{ id: "exit-width", cat: "fire", title: "Exit width per person", value: "10 mm", sub: "of stair width per person, for most uses",
			rows: [["Most uses: stairs", "10 mm per person"], ["Most uses: doors and ramps", "6.5 mm per person"], ["Institutional: stairs / doors", "15 / 13 mm"], ["Hazardous: stairs / doors", "18 / 10 mm"]],
			notes: ["Most uses means residential, educational, assembly, business, mercantile, industrial and storage."], uses: ["all"], src: [NBC4, "cl. 4.4.2, Table 4"], tags: "exit width capacity stair door egress fire", calc: "exit" },
		{ id: "travel", cat: "fire", title: "Travel distance to an exit", value: "30 m", sub: "maximum, for most uses (construction Types 1 and 2)",
			rows: [["Residential, educational, institutional, assembly, business, mercantile, storage", "30 m"], ["Industrial G-1, G-2", "45 m"], ["Industrial G-3", "22.5 m"], ["Hazardous", "22.5 m"]],
			notes: ["Fully sprinklered buildings: may be increased by 50%."], uses: ["all"], src: [NBC4, "cl. 4.4.2, Table 5"], tags: "travel distance fire escape exit egress" },

		/* ---------- Parking ---------- */
		{ id: "car-space", cat: "parking", title: "Car parking space", value: "2.75 × 5 m", sub: "in common parking; 3 × 6 m where individual",
			rows: [["Car, common parking", "2.75 × 5 m"], ["Car, individual space", "3 × 6 m"], ["Scooter / two-wheeler", "1.25 m²"], ["Bicycle", "1.00 m²"]],
			uses: ["all"], src: [NBC3, "cl. 10.3"], tags: "car parking bay stall size two wheeler bike cycle", fig: "parking" },
		{ id: "ecs", cat: "parking", title: "Area per equivalent car space", value: "23 m²", sub: "open parking, including circulation",
			rows: [["Open", "23 m²"], ["Covered, ground floor", "28 m²"], ["Basement", "32 m²"]],
			uses: ["all"], src: [NBC3, "cl. 10.3"], tags: "ecs equivalent car space parking area basement stilt", calc: "ecs" },

		/* ---------- Water demand ---------- */
		{ id: "water-home", cat: "water", title: "Water demand, homes", value: "150–200 lpcd", sub: "litres per head per day, cities over 1 lakh with full flushing",
			notes: ["May be reduced to 135 lpcd for MIG, LIG and EWS housing.", "About 45 lpcd of this is for flushing."], uses: ["res"], src: [NBC9, "cl. 4.1.1"], tags: "water demand lpcd consumption sump tank residential", calc: "water" },
		{ id: "water-other", cat: "water", title: "Water demand, other buildings", value: "litres per day", sub: "total including flushing",
			rows: [["Offices", "45 per head"], ["Schools, day", "45 per head"], ["Schools / hostels with boarding", "135 per head"], ["Hospital up to 100 beds", "340 per head"], ["Hospital over 100 beds", "450 per head"],
				["Hospital OPD", "15 per head"], ["Hotel up to 3 star", "180 per head"], ["Hotel 4 star and above", "320 per head"], ["Restaurants", "70 per seat"], ["Food courts", "35 per seat"],
				["Cinemas, theatres", "15 per seat"], ["Factories with bathrooms / without", "45 / 30 per head"], ["Clubhouse", "45 per head"], ["Stadiums", "10 per head"], ["Airports", "70 per head"], ["Visitors", "15 per head"]],
			notes: ["Hotel and hospital figures exclude laundry and kitchen."], uses: ["all"], src: [NBC9, "cl. 4.1.2, Table 1"], tags: "water demand office school hospital hotel restaurant cinema factory lpcd", calc: "water" },

		{ id: "tanks", cat: "water", title: "Water storage tanks", value: "66.6% + 33.3%", sub: "of a day's demand: sump plus overhead tank",
			rows: [["Sump and overhead tank together", "Sump 66.6%, OHT 33.3% of one day"], ["Overhead tank only", "33.3% to 50% of one day"], ["Sump only", "50% to 150% of one day"]],
			notes: ["With recycled water for flushing: one day's flushing demand in the sump or treatment tank, half a day in the overhead tank.", "Storage for fire fighting is extra, per Part 4."],
			uses: ["all"], src: [NBC9, "cl. 4.4.10"], tags: "water tank sump overhead tank oht ugt storage capacity litres", calc: "tank" },

		/* ---------- Toilets ---------- */
		{ id: "wc-home", cat: "sanitary", title: "Toilets in a house or flat", value: "1 + 1", sub: "a bathroom and a WC in each dwelling",
			rows: [["Bathroom with tap and floor trap", "1"], ["WC with flushing and ablution tap", "1"], ["Kitchen sink or wash place", "1"]],
			notes: ["Where there is only one WC, keep the bath and WC separate if possible.", "Dwellings without their own toilets: 1 WC and 1 bath for every 2 tenements."],
			uses: ["res"], src: [NBC9, "cl. 4.2.4"], tags: "toilets required number of toilets wc bathroom house flat apartment fixtures", calc: "toilets" },
		{ id: "wc-office", cat: "sanitary", title: "Toilets in offices", value: "1 per 25", sub: "WC for men; 1 per 15 for women",
			rows: [["WC, men", "1 per 25"], ["WC, women", "1 per 15"], ["Urinals", "none up to 6 men, then 1 for 7–20, 2 for 21–45, 3 for 46–70, 4 for 71–100; +3% to 200, +2.5% beyond"], ["Wash basins", "1 per 25"], ["Drinking water", "1 per 100"], ["Cleaner's sink", "1 per floor"]],
			uses: ["business"], src: [NBC9, "Table 1"], tags: "toilets required number of toilets office wc urinal wash basin fixtures", calc: "toilets" },
		{ id: "wc-school", cat: "sanitary", title: "Toilets in schools", value: "1 per 40", sub: "WC for boys in day schools; 1 per 25 for girls",
			rows: [["Nursery: WC and basin", "1 per 15 pupils"], ["Day school: WC boys / girls", "1 per 40 / 1 per 25"], ["Day school: urinals, boys", "1 per 20"], ["Day school: basins boys / girls", "1 per 60 / 1 per 40"],
				["Residential: WC boys / girls", "1 per 8 / 1 per 6"], ["Residential: urinals, boys", "1 per 25"], ["Residential: basins boys / girls", "1 per 8 / 1 per 6"]],
			notes: ["One water tap with drainage per 50 people near the WCs and urinals."], uses: ["edu"], src: [NBC9, "Table 11"], tags: "toilets required number of toilets school college pupils students wc urinal fixtures", calc: "toilets" },
		{ id: "wc-restaurant", cat: "sanitary", title: "Toilets in restaurants", value: "1 per 50", sub: "seats, WC for men; 2 per 50 seats for women",
			rows: [["Diners: WC, men / women", "1 / 2 per 50 seats, up to 200 seats"], ["Diners: urinals", "1 per 50"], ["Wash basins", "1 per WC"], ["Staff WCs, men", "1 up to 15, 2 for 16–35, 3 for 36–65, 4 for 66–100"], ["Staff WCs, women", "1 up to 12, 2 for 13–25, 3 for 26–40, 4 for 41–57, 5 for 58–77, 6 for 78–100"]],
			uses: ["assembly", "retail"], src: [NBC9, "Table 10"], tags: "toilets required restaurant cafe dining seats wc urinal fixtures", calc: "toilets" },
		{ id: "wc-mall", cat: "sanitary", title: "Toilets in shops and malls", value: "1 per 50", sub: "visitors, WC for each of men and women, at least 2",
			rows: [["Visitors: WC, men / women", "1 per 50 each, at least 2"], ["Visitors: urinals", "1 per 50"], ["Visitors: wash basins", "1 per 50, at least 2"], ["Staff WCs, men", "1 up to 15, 2 for 16–35, 3 for 36–65, 4 for 66–100"], ["Staff WCs, women", "1 up to 12, 2 for 13–25, 3 for 26–40, 4 for 41–57, 5 for 58–77, 6 for 78–100"]],
			uses: ["retail"], src: [NBC9, "Table 15"], tags: "toilets required mall shop retail showroom visitors wc urinal fixtures", calc: "toilets" },

		/* ---------- Planning norms ---------- */
		{ id: "schools", cat: "planning", title: "Schools per population", value: "0.40 ha", sub: "primary school, per 5 000 people",
			rows: [["Nursery / pre-primary", "0.08 ha per 2 500 people"], ["Primary (I–V), 500 students", "0.40 ha per 5 000; playfield at least 18 × 36 m"], ["Senior secondary (VI–XII), 1 000 students", "1.80 ha per 7 500; playfield at least 68 × 126 m"],
				["Integrated (I–XII), 1 500 students", "3.50 ha (3.90 ha with hostel) per 90 000–1 lakh"], ["School for the physically challenged, 400 students", "0.70 ha per 45 000"]],
			notes: ["Prefer sites facing service roads with low traffic."], uses: ["edu"], src: [URD, "Table 8.48"], tags: "school site area land population norm playground urdpfi" },
		{ id: "colleges", cat: "planning", title: "Colleges and universities", value: "5.00 ha", sub: "college of 1 000–1 500 students, per 1.25 lakh people",
			rows: [["College buildings", "1.80 ha"], ["Playfields", "2.50 ha"], ["Hostel / residential", "0.30 ha"], ["Parking", "0.30 ha"], ["University campus", "10–60 ha"]],
			uses: ["edu"], src: [URD, "Table 8.49"], tags: "college university campus land area urdpfi" },
		{ id: "hospitals", cat: "planning", title: "Health facilities per population", value: "1 lakh", sub: "people served by an 80–200 bed hospital",
			rows: [["Dispensary", "0.08–0.12 ha per 15 000"], ["Nursing home / maternity, 25–30 beds", "0.20–0.30 ha per 45 000–1 lakh"], ["Polyclinic", "0.20–0.30 ha per 1 lakh"], ["Intermediate hospital B, 80 beds", "1.00 ha per 1 lakh"],
				["Intermediate hospital A, 200 beds", "3.70 ha per 1 lakh"], ["Multi-speciality, 200 beds", "9.00 ha per 1 lakh"], ["General hospital, 500 beds", "6.00 ha per 2.5 lakh"], ["Diagnostic centre", "500–800 m² per 50 000"]],
			uses: ["health"], src: [URD, "Table 8.50"], tags: "hospital clinic dispensary nursing home land area population urdpfi" },
	];

	// Drawings in figs/, made for ArchXchange in VectorCraft (original; nothing traced from a code or book).
	const FIGS = ["stair", "ramp", "parking", "toilet", "turning", "lift", "window"];

	// Professionally drafted CAD sheets (DWG + DXF) for ArchXchange Pro. The files live outside this public repo.
	const CAD = { toilet: "Accessible toilet, Type A", stair: "Stair section", ramp: "Ramp section", parking: "Car parking plan", lift: "Accessible lift plan", turning: "Wheelchair space and turning" };

	// Daily check: one question a day. o[0] is the right answer; id is the standard that explains it.
	const QUIZ = [
		{ q: "Minimum height of a habitable room?", o: ["2.75 m", "2.4 m", "3.0 m"], id: "room-height" },
		{ q: "Maximum stair riser in most buildings (not 1–2 family houses)?", o: ["150 mm", "190 mm", "175 mm"], id: "riser" },
		{ q: "Minimum stair tread in most buildings?", o: ["300 mm", "250 mm", "275 mm"], id: "tread" },
		{ q: "Most risers allowed in one flight?", o: ["12", "15", "10"], id: "risers-flight" },
		{ q: "Minimum clear headroom over a stair?", o: ["2.2 m", "2.0 m", "2.4 m"], id: "stair-headroom" },
		{ q: "Clear opening of an accessible door?", o: ["900 mm", "800 mm", "750 mm"], id: "door-width" },
		{ q: "Minimum wheelchair turning circle?", o: ["1 500 mm", "1 200 mm", "1 000 mm"], id: "turning" },
		{ q: "Steepest ramp for a rise up to 750 mm?", o: ["1:12", "1:10", "1:8"], id: "ramp" },
		{ q: "Minimum car size of an accessible lift?", o: ["1 500 × 1 500 mm", "1 000 × 1 000 mm", "1 200 × 1 200 mm"], id: "lift" },
		{ q: "Area per car space (ECS) for open parking, circulation included?", o: ["23 m²", "28 m²", "32 m²"], id: "ecs" },
		{ q: "With a sump and an overhead tank, what share of a day's water goes in the sump?", o: ["66.6%", "50%", "33.3%"], id: "tanks" },
		{ q: "Minimum classroom ceiling height?", o: ["3.6 m", "3.0 m", "2.75 m"], id: "edu-height" },
		{ q: "Headroom under beams and eaves, minimum?", o: ["2.4 m", "2.2 m", "2.1 m"], id: "headroom-beam" },
		{ q: "Tamil Nadu: front setback of a small building on a road up to 9 m?", o: ["1.5 m", "3.0 m", "1.0 m"], id: "tn-front" },
		{ q: "Tamil Nadu: setback all round a high-rise up to 30 m tall?", o: ["7 m", "6 m", "9 m"], id: "tn-hr-setback" },
		{ q: "Tamil Nadu: car parking stall size?", o: ["2.5 × 5.0 m", "2.75 × 5.0 m", "2.5 × 4.5 m"], id: "tn-park-std" },
		{ q: "Tamil Nadu: high-rise FSI on an 18 m road?", o: ["3.25", "2.5", "2.0"], id: "tn-hr" },
		{ q: "Tamil Nadu: how much extra parking for visitors in flats of more than 6 homes?", o: ["10%", "5%", "20%"], id: "tn-park-res" },
	];

	// What's new, newest first. Add a line whenever content changes; people see it on their next visit.
	const UPDATES = [
		{ d: "2026-11-23", t: "Calculators on the Tamil Nadu rules: setbacks, FSI and parking", id: "tn-front" },
		{ d: "2026-11-23", t: "New rule: Tamil Nadu parking for shops and offices", id: "tn-park-com" },
		{ d: "2026-11-23", t: "Drawings redrafted, with A3 PDF sheets to scale", id: "acc-toilet" },
		{ d: "2026-11-23", t: "Tamil Nadu building rules (TNCDBR 2019)", id: "tn-hr" },
		{ d: "2026-11-23", t: "Calculators for water tanks and toilets", id: "tanks" },
	];

	const api = { TYPES: TYPES, CATS: CATS, STANDARDS: S, FIGS: FIGS, CAD: CAD, QUIZ: QUIZ, UPDATES: UPDATES };
	if (typeof module !== "undefined" && module.exports) module.exports = api;
	else root.AXS = api;
})(this);
