/* ArchXchange Standards: search, filter, detail, calculators and projects. All data in data.js. */
(function () {
	"use strict";
	const { TYPES, CATS } = window.AXS;
	const B = window.AXB || { STATES: [], RULES: [] };
	const STANDARDS = window.AXS.STANDARDS.concat(B.RULES);
	const stateOf = (id) => B.STATES.find((x) => x.id === id);
	const $ = (id) => document.getElementById(id);
	const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
	const byId = (id) => STANDARDS.find((s) => s.id === id);
	const catName = (id) => id === "bylaws" ? "State bylaws" : (CATS.find((c) => c.id === id) || {}).name || "";
	const label = (s) => s.cat === "bylaws" ? (stateOf(s.state) || {}).name + " · " + s.topic : catName(s.cat);
	const typeName = (id) => (TYPES.find((t) => t.id === id) || {}).name || "Any building";
	const cite = (s) => s.src.join(", ");
	const fits = (s, type) => !type || s.uses.indexOf("all") > -1 || s.uses.indexOf(type) > -1;
	// Drawings that exist in figs/ (drawn for ArchXchange; never copied from a code or book).
	const FIGS = new Set(window.AXS.FIGS || []);
	const CADS = window.AXS.CAD || {};
	const figOf = (s) => s.fig && FIGS.has(s.fig) ? "figs/" + s.fig + ".svg" : "";
	const BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';

	/* ---------- Saved projects, on this device ---------- */
	const STORE = "ax.standards.v1";
	let db = { projects: [], active: null };
	try { const s = JSON.parse(localStorage.getItem(STORE) || "null"); if (s && Array.isArray(s.projects)) db = s; } catch (_e) { /* storage unavailable */ }
	const persist = () => { try { localStorage.setItem(STORE, JSON.stringify(db)); } catch (_e) { /* storage unavailable */ } $("proj-count").textContent = db.projects.length || ""; };
	const project = (id) => db.projects.find((p) => p.id === id);
	const active = () => project(db.active);
	function newProject(name, type) {
		const p = { id: Date.now().toString(36), name: String(name).trim().slice(0, 80) || "Untitled project", type: type || "res", items: [], created: Date.now() };
		db.projects.unshift(p); db.active = p.id; persist();
		return p;
	}
	function toggleSave(p, sid) {
		const i = p.items.findIndex((x) => x.id === sid);
		if (i > -1) p.items.splice(i, 1); else p.items.push({ id: sid, s: "todo", note: "" });
		db.active = p.id; persist();
		return i === -1;
	}
	const savedIn = (sid) => { const p = active(); return !!(p && p.items.some((x) => x.id === sid)); };

	let toastT;
	function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2200); }

	/* ---------- Library ---------- */
	const state = { q: "", type: "", cat: "" };
	$("types").innerHTML = [{ id: "", name: "All" }].concat(TYPES).map((t) => '<button type="button" role="radio" data-type="' + t.id + '" aria-checked="' + (t.id === "") + '">' + esc(t.name) + "</button>").join("");
	$("popular").innerHTML = ["setback", "toilets", "water tank", "stair riser", "ramp", "parking", "kitchen size", "fsi", "door width"].map((q) => '<button type="button" class="chip">' + q + "</button>").join("");
	TYPES.forEach((t) => { $("np-type").insertAdjacentHTML("beforeend", '<option value="' + t.id + '">' + esc(t.name) + "</option>"); });

	const words = (q) => q.toLowerCase().replace(/[^a-z0-9.:/ ]+/g, " ").split(/\s+/).filter((w) => w.length > 1);
	function score(s, ws) {
		if (!ws.length) return 1;
		const title = s.title.toLowerCase(), tags = s.tags.toLowerCase(), rest = (s.value + " " + s.sub + " " + catName(s.cat) + " " + (s.rows || []).flat().join(" ") + " " + (s.notes || []).join(" ")).toLowerCase();
		let total = 0;
		for (const w of ws) {
			const stem = w.replace(/s$/, "");
			const pts = (title.indexOf(stem) > -1 ? 3 : 0) + (tags.indexOf(stem) > -1 ? 2 : 0) + (rest.indexOf(stem) > -1 ? 1 : 0);
			if (!pts) return 0;
			total += pts;
		}
		return total;
	}
	function hl(text, ws) {
		let out = esc(text);
		ws.forEach((w) => { const stem = w.replace(/s$/, ""); if (stem.length > 1) out = out.replace(new RegExp("(" + stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
		return out;
	}
	function card(s, ws) {
		return '<article class="card" data-id="' + s.id + '" tabindex="0">' +
			'<span class="k">' + esc(label(s)) + "</span>" +
			"<h3>" + hl(s.title, ws || []) + "</h3>" +
			'<div><div class="v num grad">' + esc(s.value) + '</div><p class="s">' + esc(s.sub) + "</p></div>" +
			'<p class="src"><span>' + esc(cite(s)) + "</span>" + (figOf(s) ? '<span class="fig-dot">◆ Drawing</span>' : "") + "</p>" +
			'<button type="button" class="save' + (savedIn(s.id) ? " on" : "") + '" data-save="' + s.id + '" aria-label="Save to project" title="Save to project">' + BOOK + "</button></article>";
	}
	function renderLibrary() {
		const ws = words(state.q);
		const list = STANDARDS.map((s) => ({ s: s, sc: score(s, ws) }))
			.filter((x) => x.sc > 0 && fits(x.s, state.type) && (!state.cat || x.s.cat === state.cat) && (ws.length || x.s.cat !== "bylaws"))
			.sort((a, b) => b.sc - a.sc);
		$("library").classList.toggle("searching", ws.length > 0);
		$("results").innerHTML = list.map((x) => card(x.s, ws)).join("");
		$("none").hidden = list.length > 0;
		$("count").textContent = list.length + " of " + STANDARDS.length;
		$("results-title").textContent = state.q ? "Results for “" + state.q + "”" : state.cat ? catName(state.cat) : state.type ? "For " + typeName(state.type).toLowerCase() + " buildings" : "All standards";
		$("cats").innerHTML = CATS.map((c) => {
			const n = STANDARDS.filter((s) => s.cat === c.id && fits(s, state.type)).length;
			return '<button type="button" class="cat' + (state.cat === c.id ? " on" : "") + '" data-cat="' + c.id + '"><b>' + esc(c.name) + "<i>" + n + "</i></b><small>" + esc(c.blurb) + "</small></button>";
		}).join("");
		document.querySelectorAll("#types button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.type === state.type)));
	}
	function renderToday() {
		const pool = STANDARDS.filter((x) => x.cat !== "bylaws" && /^[0-9]/.test(x.value)); // a real number makes a better daily headline
		const s = pool[Math.floor(Date.now() / 864e5) % pool.length];
		$("today").innerHTML = '<button type="button" class="today-card" data-id="' + s.id + '"><div><span class="k">Standard of the day · ' + esc(catName(s.cat)) + "</span><h3>" + esc(s.title) + "</h3><p>" + esc(s.sub) + " · " + esc(cite(s)) + '</p></div><div class="v num grad">' + esc(s.value) + "</div></button>";
	}

	$("q").addEventListener("input", (e) => { state.q = e.target.value; renderLibrary(); });
	$("search").addEventListener("submit", (e) => {
		e.preventDefault();
		state.q = $("q").value; renderLibrary();
		$("q").blur(); // closes the phone keyboard so the results show
		$("results-head").scrollIntoView({ behavior: "smooth", block: "start" });
	});
	$("popular").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; $("q").value = state.q = b.textContent; state.cat = ""; renderLibrary(); $("results-head").scrollIntoView({ behavior: "smooth", block: "start" }); });
	$("types").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; state.type = b.dataset.type; renderLibrary(); });
	$("cats").addEventListener("click", (e) => { const b = e.target.closest(".cat"); if (!b) return; state.cat = state.cat === b.dataset.cat ? "" : b.dataset.cat; renderLibrary(); });
	document.addEventListener("keydown", (e) => {
		if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { e.preventDefault(); location.hash = "#/"; $("q").focus(); }
		if (e.key === "Escape" && !$("sheet").hidden) closeSheet();
		if (e.key === "Enter" && e.target.classList && e.target.classList.contains("card")) openSheet(e.target.dataset.id);
	});
	// Cards anywhere: open the detail, or save with the bookmark.
	document.addEventListener("click", (e) => {
		const sv = e.target.closest("[data-save]");
		if (sv) {
			e.stopPropagation();
			const p = active();
			if (!p) { openSheet(sv.dataset.save, true); return; }
			const added = toggleSave(p, sv.dataset.save);
			sv.classList.toggle("on", added);
			toast((added ? "Saved to " : "Removed from ") + p.name);
			if (!$("project").hidden) refresh();
			return;
		}
		const c = e.target.closest(".card, .today-card, [data-open]");
		if (c) openSheet(c.dataset.id || c.dataset.open);
	});

	/* ---------- Calculators ----------
	 * Each: { title, src, form() → inputs (named with data-k), run(get) → result HTML }. get(k) reads an input in the same box,
	 * so one calculator can appear in the detail sheet and on the Calculators page at once. */
	const LOAD = [["Residential", 12.5, 10, 6.5], ["Educational", 4, 10, 6.5], ["Hospital in-patients", 15, 15, 13], ["Hospital out-patients", 10, 15, 13], ["Assembly, no fixed seats", 0.65, 10, 6.5],
		["Assembly, less concentrated", 1.4, 10, 6.5], ["Dining, restaurant", 1.8, 10, 6.5], ["Shop, street floor", 3, 10, 6.5], ["Shop, upper floor", 6, 10, 6.5], ["Offices", 10, 10, 6.5], ["Industrial", 10, 10, 6.5], ["Storage", 30, 10, 6.5]];
	const LPCD = [["Homes (cities over 1 lakh)", 200], ["Homes, MIG / LIG / EWS", 135], ["Offices", 45], ["Schools, day", 45], ["Hostels, boarding schools", 135], ["Hospital up to 100 beds", 340], ["Hospital over 100 beds", 450],
		["Hotel up to 3 star", 180], ["Hotel 4 star and above", 320], ["Restaurant, per seat", 70], ["Cinema, per seat", 15], ["Factory with bathrooms", 45], ["Clubhouse", 45]];
	const opts = (list, i) => list.map((r, k) => '<option value="' + k + '"' + (k === i ? " selected" : "") + ">" + esc(r[0]) + "</option>").join("");
	const num = (k, label, v, wide) => "<label" + (wide ? ' class="wide"' : "") + ">" + label + '<input class="input num" data-k="' + k + '" type="number" inputmode="numeric" min="0" step="any" value="' + v + '"></label>';
	const sel = (k, label, html, wide) => "<label" + (wide ? ' class="wide"' : "") + ">" + label + '<select class="input" data-k="' + k + '">' + html + "</select></label>";
	const fmt = (n, d) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: d == null ? 1 : d });
	const out = (big, small, rows) => "<b class='num'>" + big + "</b>" + (small ? "<small>" + small + "</small>" : "") +
		(rows ? '<div class="out-rows">' + rows.map((r) => "<div><span>" + r[0] + "</span><b>" + r[1] + "</b></div>").join("") + "</div>" : "");
	// NBC Part 9 stepped scales for staff toilets and urinals. null above 100 people: read the table.
	const steps = (n, s) => { if (n <= 0) return 0; for (const [max, c] of s) if (n <= max) return c; return null; };
	const MEN = [[15, 1], [35, 2], [65, 3], [100, 4]], WOMEN = [[12, 1], [25, 2], [40, 3], [57, 4], [77, 5], [100, 6]];
	const urinals = (n) => n <= 6 ? 0 : n <= 20 ? 1 : n <= 45 ? 2 : n <= 70 ? 3 : n <= 100 ? 4 : n <= 200 ? 4 + Math.ceil((n - 100) * 0.03) : 7 + Math.ceil((n - 200) * 0.025);
	const per = (n, k) => n > 0 ? Math.ceil(n / k) : 0;
	const showN = (v) => v == null ? "over 100: see table" : fmt(v, 0);
	// [name, WC boys, WC girls, urinal boys, basin boys, basin girls]: NBC Part 9, Table 11
	const SCHOOL = [["Nursery", 15, 15, 0, 15, 15], ["Day school", 40, 25, 20, 60, 40], ["Residential school", 8, 6, 25, 8, 6]];
	const CALC = {
		tank: { title: "Water tanks", src: "NBC 2016, Part 9, cl. 4.1 and 4.4.10",
			form: () => num("n", "People (or seats, beds)", 40) + sel("u", "Building", opts(LPCD, 0)) + sel("m", "Storage", '<option value="both">Sump + overhead tank</option><option value="oht">Overhead tank only</option><option value="ugt">Sump only</option>', true),
			run: (g) => {
				const n = g("n"), r = LPCD[g("u")], day = n * r[1], m = g("m", true);
				if (!n) return "";
				const L = (x) => fmt(x, 0) + " L · " + fmt(x / 1000, 1) + " m³";
				const rows = m === "both" ? [["Sump (UGT), 66.6%", L(day * 0.666)], ["Overhead tank (OHT), 33.3%", L(day * 0.3333)]]
					: m === "oht" ? [["Overhead tank, 33.3% to 50%", fmt(day * 0.3333, 0) + " – " + fmt(day * 0.5, 0) + " L"]] : [["Sump, 50% to 150%", fmt(day * 0.5, 0) + " – " + fmt(day * 1.5, 0) + " L"]];
				return out(fmt(day, 0) + " L a day", fmt(n, 0) + " × " + r[1] + " litres. Fire-fighting storage is extra (Part 4).", rows);
			} },
		toilets: { title: "Toilets required", src: "NBC 2016, Part 9, cl. 4.2, Tables 1, 10, 11, 15",
			form: () => sel("b", "Building", '<option value="office">Office</option><option value="school">School</option><option value="rest">Restaurant</option><option value="mall">Shop / mall</option><option value="home">House / flat</option>', true) +
				num("a", "Men / boys / staff men", 60) + num("w", "Women / girls / staff women", 40) +
				num("c", "Seats or visitors (restaurant, mall)", 100) + sel("s", "School type", opts(SCHOOL, 1)),
			run: (g) => {
				const b = g("b", true), a = g("a"), w = g("w"), c = g("c");
				if (b === "home") return out("Per dwelling", "With its own toilet: a bathroom, a WC with an ablution tap, and a kitchen sink or wash place.", [["Bathroom", "1"], ["Water closet", "1"], ["Kitchen sink / wash place", "1"]]);
				if (b === "office") return out(fmt(per(a, 25) + per(w, 15), 0) + " WCs", "Staff and visitors usually share these in offices.", [["WCs, men (1 per 25)", fmt(per(a, 25), 0)], ["WCs, women (1 per 15)", fmt(per(w, 15), 0)], ["Urinals", fmt(urinals(a), 0)], ["Wash basins (1 per 25 each)", fmt(per(a, 25) + per(w, 25), 0)], ["Drinking water (1 per 100)", fmt(per(a + w, 100), 0)], ["Cleaner's sink", "1 per floor"]]);
				if (b === "school") {
					const t = SCHOOL[g("s")];
					if (!t[3]) return out(fmt(per(a + w, 15), 0) + " WCs", "Nursery: 1 WC and 1 wash basin per 15 pupils.", [["WCs (1 per 15)", fmt(per(a + w, 15), 0)], ["Wash basins (1 per 15)", fmt(per(a + w, 15), 0)]]);
					return out(fmt(per(a, t[1]) + per(w, t[2]), 0) + " WCs", t[0] + ": boys 1 per " + t[1] + ", girls 1 per " + t[2] + ".", [["WCs, boys", fmt(per(a, t[1]), 0)], ["WCs, girls", fmt(per(w, t[2]), 0)], ["Urinals, boys (1 per " + t[3] + ")", fmt(per(a, t[3]), 0)], ["Wash basins", fmt(per(a, t[4]) + per(w, t[5]), 0)]]);
				}
				const sm = steps(a, MEN), sw = steps(w, WOMEN);
				if (b === "rest") {
					const seats = Math.min(c, 200);
					return out(fmt(per(seats, 50) * 3, 0) + " WCs for diners", "Diners: men 1 per 50 seats, women 2 per 50 seats (the table covers up to 200 seats). Staff on the stepped scale.",
						[["Diners: WCs, men", fmt(per(seats, 50), 0)], ["Diners: WCs, women", fmt(per(seats, 50) * 2, 0)], ["Diners: urinals (1 per 50)", fmt(per(seats, 50), 0)], ["Staff: WCs, men", showN(sm)], ["Staff: WCs, women", showN(sw)], ["Staff: urinals", fmt(urinals(a), 0)], ["Wash basins", "1 per WC"]]);
				}
				const pub = Math.max(2, per(c / 2, 50));
				return out(fmt(pub * 2, 0) + " public WCs", "Visitors: 1 WC per 50 men and per 50 women, at least 2 each; visitors taken as half men, half women.",
					[["Public: WCs, men", fmt(pub, 0)], ["Public: WCs, women", fmt(pub, 0)], ["Public: urinals (1 per 50)", fmt(per(c / 2, 50), 0)], ["Public: wash basins", fmt(pub * 2, 0)], ["Staff: WCs, men", showN(sm)], ["Staff: WCs, women", showN(sw)], ["Staff: urinals", fmt(urinals(a), 0)]]);
			} },
		exit: { title: "Occupants and exit width", src: "NBC 2016, Part 4, Tables 3 and 4",
			form: () => num("a", "Floor area, m²", 500) + sel("u", "Use", opts(LOAD, 9)),
			run: (g) => {
				const a = g("a"), r = LOAD[g("u")];
				if (!a) return "";
				const n = Math.ceil(a / r[1]);
				return out(fmt(n, 0) + " people", "Floor by floor, never below the minimum stair width.", [["Stair width", fmt(n * r[2], 0) + " mm"], ["Doors and ramps", fmt(n * r[3], 0) + " mm"]]);
			} },
		ramp: { title: "Ramp from a level difference", src: "NBC 2016, Part 3, Annex B, Table 10",
			form: () => num("r", "Level difference, mm", 600, true),
			run: (g) => {
				const rise = g("r");
				if (!rise) return "";
				const n = rise <= 750 ? 12 : rise <= 3000 ? 15 : 20;
				return out("1:" + n + " · " + fmt(rise * n / 1000, 2) + " m long", "Horizontal length at the steepest gradient, before landings." + (rise > 300 ? " Rise over 300 mm: add steps as well." : "") + (rise > 2000 ? " Inside, over 2 000 mm in total: provide a lift." : ""));
			} },
		window: { title: "Minimum window area", src: "NBC 2016, Part 3, cl. 20.1.2",
			form: () => num("a", "Floor area, m²", 12) + sel("c", "Climate", '<option value="10">Hot-dry</option><option value="6">Warm-humid</option><option value="8" selected>Temperate / composite</option><option value="12">Cold</option>'),
			run: (g) => { const a = g("a"), d = g("c"); return a ? out(fmt(a / d, 2) + " m²", "Windows and ventilators, excluding doors: 1/" + d + " of " + fmt(a) + " m².") : ""; } },
		ecs: { title: "Parking area", src: "NBC 2016, Part 3, cl. 10.3",
			form: () => num("n", "Car spaces (ECS)", 20) + sel("t", "Type", '<option value="23">Open</option><option value="28">Covered, ground</option><option value="32">Basement</option>'),
			run: (g) => { const n = g("n"), m = g("t"); return n ? out(fmt(n * m, 0) + " m²", fmt(n, 0) + " ECS × " + m + " m², circulation included.") : ""; } },
	};
	/** Draws a calculator into a box and keeps its result live. */
	function mountCalc(box, c) {
		box.innerHTML = '<div class="calc-in">' + c.form() + '</div><div class="calc-out"></div>';
		const g = (k, raw) => { const el = box.querySelector('[data-k="' + k + '"]'); return raw ? el.value : Math.max(0, Number(el.value) || 0); };
		const upd = () => { box.querySelector(".calc-out").innerHTML = c.run(g); };
		box.addEventListener("input", upd);
		box.addEventListener("change", upd);
		upd();
	}
	function renderTools() {
		if ($("tool-list").childElementCount) return;
		$("tool-list").innerHTML = Object.keys(CALC).map((k) => '<article class="tool"><h3>' + esc(CALC[k].title) + '</h3><p class="src">' + esc(CALC[k].src) + '</p><div class="calc-box" data-calc="' + k + '"></div></article>').join("");
		$("tool-list").querySelectorAll("[data-calc]").forEach((b) => mountCalc(b, CALC[b.dataset.calc]));
	}

	/* ---------- Detail sheet ---------- */
	let lastFocus = null;
	function openSheet(id, saving) {
		const s = byId(id);
		if (!s) return;
		lastFocus = document.activeElement;
		const fig = figOf(s), c = s.calc && CALC[s.calc];
		const uses = s.uses.indexOf("all") > -1 ? ["All buildings"] : s.uses.map(typeName);
		const projOpts = db.projects.map((p) => '<option value="' + p.id + '"' + (p.id === db.active ? " selected" : "") + ">" + esc(p.name) + "</option>").join("");
		$("sheet").innerHTML = '<button type="button" class="sh-close" id="sh-close" aria-label="Close">✕</button>' +
			'<span class="k">' + esc(label(s)) + "</span>" +
			'<h2 class="sh-title" id="sh-title">' + esc(s.title) + "</h2>" +
			'<div class="sh-value num grad">' + esc(s.value) + '</div><p class="sh-sub">' + esc(s.sub) + "</p>" +
			(fig ? '<figure class="sh-fig"><img src="' + fig + '" alt="Drawing: ' + esc(s.title) + '"><figcaption>' + (CADS[s.fig] ? "ArchXchange CAD drawing, drafted full size in mm. " : "ArchXchange drawing, not to scale. ") + "Dimensions per " + esc(cite(s)) + ".</figcaption></figure>" +
				(CADS[s.fig] ? '<div class="cad"><div><b>CAD drawing</b><small>' + esc(CADS[s.fig]) + ' · DWG + DXF, layered, dimensioned, with title block</small></div><button type="button" class="btn sm" id="sh-cad">Download · Pro</button></div>' : "") : "") +
			(s.rows ? '<div class="sh-block"><span class="k">Values</span><table class="rows">' + s.rows.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>").join("") + "</table></div>" : "") +
			(s.notes ? '<div class="sh-block"><span class="k">Also</span><ul class="notes">' + s.notes.map((n) => "<li>" + esc(n) + "</li>").join("") + "</ul></div>" : "") +
			(c ? '<div class="sh-block"><span class="k">Work it out</span><div class="calc"><b style="color:var(--text)">' + esc(c.title) + '</b><div class="calc-box" id="sh-calc"></div></div></div>' : "") +
			'<div class="sh-block"><span class="k">Applies to</span><div class="uses">' + uses.map((u) => "<span>" + esc(u) + "</span>").join("") + "</div></div>" +
			'<div class="sh-block"><span class="k">Cite</span><div class="cite"><span>' + esc(cite(s)) + '</span><button type="button" class="btn sm" id="sh-copy">Copy</button></div></div>' +
			'<div class="sh-block" id="sh-save"><span class="k">Save to a project</span>' +
			(db.projects.length ? '<div class="sh-actions"><select class="input" id="sh-proj">' + projOpts + '</select><button type="button" class="btn primary" id="sh-add"></button></div>'
				: '<div class="sh-actions"><input class="input" id="sh-new" placeholder="Name your first project" maxlength="80"><button type="button" class="btn primary" id="sh-create">Create and save</button></div>') +
			'</div><p class="caveat">Summarised from the source in our own words. Check the code for the full clause and exceptions; local bye-laws and later amendments prevail.</p>';
		$("sheet").hidden = $("sheet-back").hidden = false;
		document.body.style.overflow = "hidden";
		if (c) mountCalc($("sh-calc"), c);
		const saveLabel = () => { const p = project($("sh-proj").value); $("sh-add").textContent = p && p.items.some((x) => x.id === s.id) ? "Saved ✓ Remove" : "Save"; };
		if ($("sh-add")) {
			saveLabel();
			$("sh-proj").addEventListener("change", saveLabel);
			$("sh-add").addEventListener("click", () => { const p = project($("sh-proj").value); const added = toggleSave(p, s.id); saveLabel(); toast((added ? "Saved to " : "Removed from ") + p.name); refresh(); });
		} else {
			$("sh-create").addEventListener("click", () => { const p = newProject($("sh-new").value, s.uses[0] === "all" ? (state.type || "res") : s.uses[0]); toggleSave(p, s.id); toast("Created " + p.name + " and saved"); openSheet(s.id); refresh(); });
		}
		$("sh-copy").addEventListener("click", () => {
			const text = s.title + ": " + s.value + ", " + s.sub + ". (" + cite(s) + ")";
			if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("Copied"), () => {});
		});
		$("sh-close").addEventListener("click", closeSheet);
		if ($("sh-cad")) $("sh-cad").addEventListener("click", () => toast("CAD downloads come with ArchXchange Pro, launching soon."));
		(saving && $("sh-new") ? $("sh-new") : $("sh-close")).focus();
		if (!$("library").hidden && location.hash !== "#/s/" + s.id) history.replaceState(null, "", "#/s/" + s.id);
	}
	function closeSheet() {
		$("sheet").hidden = $("sheet-back").hidden = true;
		document.body.style.overflow = "";
		if (/^#\/s\//.test(location.hash)) history.replaceState(null, "", "#/");
		if (lastFocus && lastFocus.focus) lastFocus.focus();
	}
	$("sheet-back").addEventListener("click", closeSheet);

	/* ---------- Projects ---------- */
	const STATUS = [["todo", "To do"], ["ok", "Complies"], ["check", "Check"]];
	function renderProjects() {
		$("proj-list").innerHTML = db.projects.length ? db.projects.map((p) => {
			const ok = p.items.filter((x) => x.s === "ok").length;
			return '<a class="proj" href="#/p/' + p.id + '"><span class="k">' + esc(typeName(p.type)) + "</span><h3>" + esc(p.name) + '</h3><p class="meta">' + p.items.length + " standards · " + ok + ' comply</p><div class="bar"><i style="width:' + (p.items.length ? 100 * ok / p.items.length : 0) + '%"></i></div></a>';
		}).join("") : '<div class="empty-proj">No projects yet. Create one above, then save standards to it from the library.</div>';
	}
	$("new-proj").addEventListener("submit", (e) => { e.preventDefault(); const p = newProject($("np-name").value, $("np-type").value); $("np-name").value = ""; location.hash = "#/p/" + p.id; });

	function renderProject(p) {
		const ok = p.items.filter((x) => x.s === "ok").length, chk = p.items.filter((x) => x.s === "check").length;
		const suggest = STANDARDS.filter((s) => s.cat !== "bylaws" && fits(s, p.type) && !p.items.some((x) => x.id === s.id));
		$("project").innerHTML = '<div class="p-head"><a class="back" href="#/projects">← My projects</a><span class="k">' + esc(typeName(p.type)) + "</span><h1>" + esc(p.name) + "</h1>" +
			'<div class="p-stats"><span><b>' + p.items.length + "</b> standards</span><span><b>" + ok + "</b> comply</span><span><b>" + chk + "</b> to check</span><span><b>" + (p.items.length - ok - chk) + '</b> to do</span></div>' +
			'<div class="bar"><i style="width:' + (p.items.length ? 100 * ok / p.items.length : 0) + '%"></i></div>' +
			'<div class="p-tools"><button type="button" class="btn sm" id="p-print">Print checklist</button><button type="button" class="btn sm" id="p-all">Add all ' + suggest.length + " for " + esc(typeName(p.type).toLowerCase()) + '</button><button type="button" class="btn sm" id="p-del">Delete project</button></div></div>' +
			'<div class="checklist">' + (p.items.length ? p.items.map((x) => {
				const s = byId(x.id);
				if (!s) return "";
				return '<div class="item" data-sid="' + s.id + '"><div><h3 data-open="' + s.id + '">' + esc(s.title) + ' <span class="print-status">[' + (STATUS.find((t) => t[0] === x.s) || STATUS[0])[1] + ']</span></h3><span class="v">' + esc(s.value) + "</span> <span class=\"src\">· " + esc(s.sub) + " · " + esc(cite(s)) + "</span></div>" +
					'<div class="status">' + STATUS.map((t) => '<button type="button" data-s="' + t[0] + '" class="' + (x.s === t[0] ? "on" : "") + '">' + t[1] + "</button>").join("") + "</div>" +
					'<input class="input item-note" placeholder="Note: where it applies, drawing no., what to fix" value="' + esc(x.note) + '" maxlength="200"><button type="button" class="item-x">Remove</button></div>';
			}).join("") : '<div class="empty-proj">Nothing saved yet. Add the suggestions below, or save from the library.</div>') + "</div>" +
			(suggest.length ? '<div class="suggest"><h2>Suggested for ' + esc(typeName(p.type).toLowerCase()) + ' buildings</h2><p class="sub">Tap a card to read it; the bookmark adds it here.</p><div class="grid" style="margin-top:12px">' + suggest.map((s) => card(s)).join("") + "</div></div>" : "");
		db.active = p.id; persist();
		$("p-print").addEventListener("click", () => window.print());
		$("p-all").addEventListener("click", () => { suggest.forEach((s) => p.items.push({ id: s.id, s: "todo", note: "" })); persist(); renderProject(p); toast("Added " + suggest.length + " standards"); });
		$("p-del").addEventListener("click", () => {
			if (!window.confirm("Delete “" + p.name + "” and its checklist? This cannot be undone.")) return;
			db.projects = db.projects.filter((q) => q.id !== p.id); if (db.active === p.id) db.active = db.projects[0] ? db.projects[0].id : null; persist(); location.hash = "#/projects";
		});
		const list = $("project").querySelector(".checklist");
		list.addEventListener("click", (e) => {
			const row = e.target.closest(".item"); if (!row) return;
			const x = p.items.find((i) => i.id === row.dataset.sid);
			if (e.target.dataset.s) { x.s = e.target.dataset.s; persist(); renderProject(p); }
			if (e.target.classList.contains("item-x")) { p.items = p.items.filter((i) => i !== x); persist(); renderProject(p); }
		});
		list.addEventListener("input", (e) => { if (!e.target.classList.contains("item-note")) return; p.items.find((i) => i.id === e.target.closest(".item").dataset.sid).note = e.target.value.slice(0, 200); persist(); });
	}

	/* ---------- State bylaws ---------- */
	function renderBylaws(sid) {
		const st = stateOf(sid) || B.STATES[0];
		if (!st) { $("bylaws").innerHTML = '<div class="page-head"><h1>State bylaws</h1></div><div class="soon">Coming soon.</div>'; return; }
		const rules = B.RULES.filter((r) => r.state === st.id);
		const topics = [];
		rules.forEach((r) => { if (topics.indexOf(r.topic) < 0) topics.push(r.topic); });
		$("bylaws").innerHTML = '<div class="page-head"><h1>State bylaws</h1><p class="sub">Each state\'s building rules, sorted by what you look for: setbacks, FSI, coverage, height, parking. Pick your state.</p></div>' +
			'<div class="states">' + B.STATES.map((x) => '<a class="state' + (x.id === st.id ? " on" : "") + '" href="#/bylaws/' + x.id + '"><b>' + esc(x.name) + "</b><small>" + esc(x.short) + "</small></a>").join("") + "</div>" +
			'<div class="doc"><span class="k">' + esc(st.authority) + "</span><h2>" + esc(st.doc) + '</h2><p class="meta">' + esc(st.note || "") + "</p>" + (st.url ? '<a href="' + esc(st.url) + '" target="_blank" rel="noopener">Official source ↗</a>' : "") + "</div>" +
			(rules.length ? topics.map((t) => '<div class="results-head" style="margin-top:18px"><h2>' + esc(t) + '</h2><span class="count">' + rules.filter((r) => r.topic === t).length + '</span></div><div class="grid">' + rules.filter((r) => r.topic === t).map((r) => card(r)).join("") + "</div>").join("")
				: '<div class="soon">The rules for ' + esc(st.name) + " are being added. The official document is linked above.</div>");
	}

	/* ---------- Routing ---------- */
	function show(view) {
		["library", "bylaws", "tools", "projects", "project"].forEach((v) => { $(v).hidden = v !== view; });
		document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("on", a.dataset.view === (view === "project" ? "projects" : view)));
	}
	function refresh() { route(true); }
	function route(keepSheet) {
		const h = location.hash || "#/";
		const m = h.match(/^#\/(projects|p|s|bylaws|tools)?\/?([\w-]*)/) || [];
		if (m[1] === "projects") { show("projects"); renderProjects(); }
		else if (m[1] === "bylaws") { show("bylaws"); renderBylaws(m[2]); }
		else if (m[1] === "tools") { show("tools"); renderTools(); }
		else if (m[1] === "p" && project(m[2])) { show("project"); renderProject(project(m[2])); }
		else { show("library"); renderLibrary(); if (m[1] === "s" && keepSheet !== true) openSheet(m[2]); }
		if (keepSheet !== true && !/^#\/s\//.test(h) && !$("sheet").hidden) closeSheet();
		if (keepSheet !== true) window.scrollTo(0, 0);
	}
	window.addEventListener("hashchange", () => route());
	persist();
	renderToday();
	route();
})();
