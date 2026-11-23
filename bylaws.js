/* ArchXchange Standards: state building rules.
 * Each rule is summarised in ArchXchange's own words from the state's official notification and cited by rule or
 * annexure; check amendments (they are frequent) before relying on a figure. Rules share the library's entry shape,
 * with cat "bylaws", a state and a topic, so search, detail, save and projects all work on them.
 */
(function (root) {
	"use strict";
	const STATES = [
		{ id: "tn", name: "Tamil Nadu", short: "TNCDBR 2019", doc: "Tamil Nadu Combined Development and Building Rules, 2019", authority: "Housing and Urban Development Department, G.O. (Ms) No. 18, 4 Feb 2019",
			note: "Applies across Tamil Nadu, including the Chennai Metropolitan Area. Amended many times since 2019; check the latest gazette amendments.", url: "https://www.tcp.tn.gov.in/staterules" },
		{ id: "dl", name: "Delhi", short: "UBBL 2016", doc: "Unified Building Bye-Laws for Delhi, 2016", authority: "Delhi Development Authority, S.O. 1191(E), 22 Mar 2016",
			note: "Compendium with amendments up to 12 Feb 2020; DDA has notified later changes (June 2021).", url: "https://dda.gov.in/about-building-approval-department" },
		{ id: "mh", name: "Maharashtra", short: "UDCPR 2020", doc: "Unified Development Control and Promotion Regulations for Maharashtra, 2020", authority: "Urban Development Department, notified 2 Dec 2020",
			note: "Applies to all planning authorities except Greater Mumbai, which has its own DCPR 2034.", url: "https://www.maharashtra.gov.in/Upload/PDF/Maharashtra_Regional_Town_Planning_Act_UDCPR.pdf" },
		{ id: "kl", name: "Kerala", short: "KMBR 2019", doc: "Kerala Municipality Building Rules, 2019", authority: "Local Self Government Department, G.O.(P) No. 77/2019/LSGD",
			note: "Panchayats follow the Kerala Panchayat Building Rules, 2019.", url: "https://lsgkerala.gov.in/htm/kmbr.asp" },
		{ id: "ka", name: "Karnataka", short: "BBMP Bye-laws 2003", doc: "Bangalore Mahanagara Palike Building Bye-Laws, 2003", authority: "Government Order UDD/223/MNU/2001",
			note: "For Bengaluru (BBMP). Other municipalities follow the Karnataka Model Building Bye-Laws.", url: "https://site.bbmp.gov.in/townplanning.html" },
		{ id: "ts", name: "Telangana", short: "G.O. 168 (2012)", doc: "Telangana Building Rules, 2012 (G.O.Ms. No. 168, MA&UD)", authority: "Municipal Administration and Urban Development Department, 7 Apr 2012",
			note: "Amended several times, including the high-rise threshold. Orders are listed on the BuildNow portal.", url: "https://buildnow.telangana.gov.in/go-and-act" },
	];

	const TN = "TNCDBR 2019";
	const ALL = ["all"];
	const R = [
		/* ---------- Tamil Nadu: setbacks ---------- */
		{ id: "tn-front", fig: "tn-setbacks", state: "tn", topic: "Setbacks", title: "Front setback, small buildings", value: "1.5–6.0 m", sub: "by road width; up to 12 m, 16 homes or 300 m² commercial",
			rows: [["Road up to 9 m", "1.5 m"], ["Road over 9 m, up to 18 m", "3.0 m"], ["Road over 18 m, up to 30.5 m", "4.5 m"], ["Road over 30.5 m", "6.0 m"], ["Continuous building areas", "1.5 m"], ["EWS areas", "1.0 m"]],
			notes: ["Measured from the street alignment or new road line where one is prescribed, otherwise from the property boundary.", "For up to 16 dwellings, or commercial and similar small uses up to 300 m²."],
			uses: ALL, calc: "tnset", src: [TN, "rule 35(1)(a)"], tags: "front setback set back road width open space tamil nadu chennai tncdbr" },
		{ id: "tn-side", fig: "tn-setbacks", state: "tn", topic: "Setbacks", title: "Side setback, small buildings", value: "1.0–1.5 m", sub: "by building height and plot width; nil in continuous building areas",
			rows: [["Height up to 7 m, plot up to 9 m wide", "1 m on one side"], ["Height up to 7 m, plot over 9 m wide", "1 m on both sides"], ["Height 7–12 m, plot up to 6 m wide", "1 m on one side"],
				["Height 7–12 m, plot 6–9 m wide", "1.5 m on one side"], ["Height 7–12 m, plot over 9 m wide", "1.5 m on both sides"]],
			uses: ALL, calc: "tnset", src: [TN, "rule 35(1)(a)"], tags: "side setback set back plot width tamil nadu tncdbr" },
		{ id: "tn-rear", fig: "tn-setbacks", state: "tn", topic: "Setbacks", title: "Rear setback, small buildings", value: "Nil / 1.5 m", sub: "nil up to 7 m height; 1.5 m from 7 m to 12 m; nil in continuous building areas",
			uses: ALL, calc: "tnset", src: [TN, "rule 35(1)(a)"], tags: "rear setback back set back tamil nadu tncdbr" },
		{ id: "tn-large-setbacks", fig: "tn-setbacks", state: "tn", topic: "Setbacks", title: "Setbacks, larger buildings up to 18.3 m", value: "3.0–6.0 m", sub: "front, by road width; more than 16 homes or 300 m² commercial",
			rows: [["Front: road 9–18 m", "3.0 m"], ["Front: road 18–30.5 m", "4.5 m"], ["Front: road over 30.5 m", "6.0 m"], ["Side and rear: height up to 7 m", "1.0 m"], ["Side and rear: 7–12 m", "1.5 m"], ["Side and rear: 12–16 m", "2.5 m"], ["Side and rear: 16–18.3 m", "3.0 m"]],
			notes: ["Side and rear setbacks are nil in continuous building areas."], uses: ALL, calc: "tnset", src: [TN, "rule 35(1)(b)"], tags: "setback apartment flats commercial building side rear front tamil nadu tncdbr" },

		/* ---------- Tamil Nadu: height and FSI ---------- */
		{ id: "tn-small-height", fig: "tn-heights", state: "tn", topic: "Height and FSI", title: "Small buildings: height and FSI", value: "12 m · FSI 2.0", sub: "Ground + 2 or stilt + 3 floors; up to 16 homes or 300 m² commercial",
			rows: [["Road 6 m and wider", "G+2 or stilt+3, 12 m max., up to 16 homes or 300 m² commercial"], ["Road 3–6 m wide", "G+1 or stilt+2, 9 m max., up to 8 homes"], ["Continuous building and EWS areas", "G+2 or stilt+3, 12 m max., up to 16 homes"], ["Normally permissible FSI", "2.0"]],
			uses: ALL, calc: "tnfsi", src: [TN, "rule 35(1)(a)"], tags: "fsi far floor space index height floors g+2 stilt house tamil nadu tncdbr" },
		{ id: "tn-nhr", fig: "tn-heights", state: "tn", topic: "Height and FSI", title: "Non high-rise: height, road and FSI", value: "18.3 m · FSI 2.0", sub: "more than 16 homes or 300 m² commercial; road at least 9 m",
			notes: ["Water tanks, chimneys and ornamental features (flag masts, gopurams, minarets) may rise to 30.5 m.", "In continuous building areas, keep a 1 m internal passage from rear to front at ground level."],
			uses: ALL, calc: "tnfsi", src: [TN, "rule 35(1)(b), 35 notes"], tags: "non high rise 18.3 m height fsi road width apartment tamil nadu tncdbr" },

		/* ---------- Tamil Nadu: high-rise ---------- */
		{ id: "tn-hr", fig: "tn-fsi", state: "tn", topic: "High-rise", title: "High-rise: road width and FSI", value: "FSI 2.0–3.25", sub: "by road width: 12 m, 15 m or 18 m; coverage 50%",
			rows: [["Road 12 m", "FSI 2.0"], ["Road 15 m", "FSI 2.5"], ["Road 18 m", "FSI 3.25"], ["Maximum coverage", "50%"]],
			notes: ["The qualifying road width must run for at least 500 m (Chennai Metropolitan Area and corporations) or 250 m elsewhere.", "In Chennai Metropolitan Area, high-rise only in the areas listed in Annexure XIX."],
			uses: ALL, calc: "tnfsi", src: [TN, "rule 39(2), 39(3)"], tags: "high rise fsi road width coverage tower tamil nadu tncdbr" },
		{ id: "tn-hr-setback", fig: "tn-heights", state: "tn", topic: "High-rise", title: "High-rise: setbacks all round", value: "7 m", sub: "up to 30 m height; +1 m per 6 m above, 20 m max.",
			rows: [["Height up to 30 m", "7 m all round"], ["Above 30 m", "+1 m for every 6 m or part, up to 20 m"], ["Spacing between towers", "same as the setback"]],
			uses: ALL, calc: "tnset", src: [TN, "rule 39(3)"], tags: "high rise setback spacing between blocks towers tamil nadu tncdbr" },

		/* ---------- Tamil Nadu: parking ---------- */
		{ id: "tn-park-res", fig: "tn-parking", state: "tn", topic: "Parking", title: "Parking for homes", value: "1 car per 2 homes", sub: "for homes of 50–75 m² in corporations and municipalities",
			rows: [["Home up to 25 m²", "none"], ["25–50 m²", "1 two-wheeler"], ["50–75 m²", "1 car per 2 homes + 1 two-wheeler each"], ["Over 75 m²", "1 car per 75 m²"], ["Panchayats", "same steps at 50 / 75 / 100 m²; 1 car per 100 m² above"], ["Visitors, over 6 homes", "+10%"]],
			uses: ["res"], calc: "tnpark", src: [TN, "Annexure IV, Part I"], tags: "parking requirement car spaces apartment flats house tamil nadu tncdbr" },
		{ id: "tn-park-std", fig: "tn-stalls", state: "tn", topic: "Parking", title: "Parking stall, aisle and ramp sizes", value: "2.5 × 5.0 m", sub: "car stall, clear of columns",
			rows: [["Car", "2.5 × 5.0 m"], ["Two-wheeler", "1.0 × 1.8 m"], ["LCV", "3.5 × 7.0 m"], ["Bus / lorry", "3.5 × 10.0 m"], ["Driveway", "3.0 m one-way, 6.0 m two-way"], ["Car aisle", "3.0 m up to 60°, 4.5 m perpendicular"],
				["Ramp", "3.0 / 6.0 m wide, 1 in 8 max."], ["Headroom", "2.2 m"], ["Entry / exit gate", "3.0 m min."], ["Parking floor slope", "4% max."]],
			notes: ["Beside a wall, a parallel stall must be 2.7 m wide.", "More than 2 floors: reserve 10% of parking (at least 2 cars and 2 two-wheelers) for disabled people near the entrance."],
			uses: ALL, src: [TN, "Annexure IV, Part II"], tags: "parking stall size aisle driveway ramp gradient headroom tamil nadu tncdbr" },
		{ id: "tn-park-com", fig: "tn-parking", state: "tn", topic: "Parking", title: "Parking for shops and offices", value: "1 car per 50 m²", sub: "shops in corporations and municipalities, beyond the first 50 m²",
			rows: [["Shops, corporations and municipalities", "1 car + 1 two-wheeler per 50 m² or part, beyond the first 50 m²"], ["Shops, panchayats", "the same per 75 m², beyond the first 75 m²"], ["Offices (other than government)", "1 car per 100 m² + 1 two-wheeler per 25 m², or part"],
				["Government offices up to 500 m²", "1 car per 150 m² + 1 two-wheeler per 25 m², or part"], ["Government offices over 500 m²", "1 car per 100 m² + 1 two-wheeler per 25 m², or part"], ["Visitors, offices", "+10%, at least 1 car and 1 two-wheeler"]],
			uses: ["retail", "business"], calc: "tnpark", src: [TN, "Annexure IV, Part I (2), (4), (5)"], tags: "parking shop shopping centre supermarket office commercial government tamil nadu tncdbr" },
	].map(function (r) { r.cat = "bylaws"; return r; });

	const api = { STATES: STATES, RULES: R };
	if (typeof module !== "undefined" && module.exports) module.exports = api;
	else root.AXB = api;
})(this);
