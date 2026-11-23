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
	const label = (s) => s.cat === "bylaws" ? (stateOf(s.state) || {}).name + " · " + s.topic : catName(s.cat) + (s.group ? " · " + s.group : "");
	const typeName = (id) => (TYPES.find((t) => t.id === id) || {}).name || "Any building";
	const cite = (s) => s.src.join(", ");
	const fits = (s, type) => !type || s.uses.indexOf("all") > -1 || s.uses.indexOf(type) > -1;
	// Drawings that exist in figs/ (drawn for ArchXchange; never copied from a code or book).
	const FIGS = new Set(window.AXS.FIGS || []);
	const CADS = window.AXS.CAD || {};
	const figOf = (s) => s.fig && FIGS.has(s.fig) ? "figs/" + s.fig + ".png" : "";
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

	/* ---------- This device: preferences, recently viewed, daily check ---------- */
	const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v && typeof v === "object" ? v : d; } catch (_e) { return d; } };
	const keep = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_e) { /* storage unavailable */ } };
	const PREF = "ax.standards.prefs.v1", DAILY = "ax.standards.daily.v1";
	const prefs = load(PREF, {});
	if (!stateOf(prefs.state)) prefs.state = "tn";
	if (!Array.isArray(prefs.recent)) prefs.recent = [];
	const day = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
	const TODAY = day(new Date()), YESTERDAY = day(new Date(Date.now() - 864e5));
	const lastSeen = typeof prefs.seen === "string" ? prefs.seen : "";
	prefs.seen = TODAY;
	keep(PREF, prefs);
	const viewed = (id) => { prefs.recent = [id].concat(prefs.recent.filter((x) => x !== id)).slice(0, 8); keep(PREF, prefs); };
	const daily = load(DAILY, {});
	if (!daily.ans || typeof daily.ans !== "object") daily.ans = {};
	const dayNo = Math.floor(Date.parse(TODAY) / 864e5);

	/* ---------- Library: home, search, topics ---------- */
	const state = { q: "", cat: "" };
	$("popular").innerHTML = ["setback", "toilets", "water tank", "stair riser", "ramp", "parking", "kitchen size", "fsi", "door width"].map((q) => '<button type="button" class="chip">' + q + "</button>").join("");
	TYPES.forEach((t) => { $("np-type").insertAdjacentHTML("beforeend", '<option value="' + t.id + '">' + esc(t.name) + "</option>"); });
	$("state-pick").innerHTML = B.STATES.map((x) => '<option value="' + x.id + '">' + esc(x.name) + "</option>").join("");

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
	const saveBtn = (s) => '<button type="button" class="save' + (savedIn(s.id) ? " on" : "") + '" data-save="' + s.id + '" aria-label="Save to project" title="Save to project">' + BOOK + "</button>";
	function card(s, ws) {
		return '<article class="card" data-id="' + s.id + '" tabindex="0">' +
			'<span class="k">' + esc(label(s)) + "</span>" +
			"<h3>" + hl(s.title, ws || []) + "</h3>" +
			'<div><div class="v num grad">' + esc(s.value) + '</div><p class="s">' + esc(s.sub) + "</p></div>" +
			'<p class="src"><span>' + esc(cite(s)) + "</span>" + (figOf(s) ? '<span class="fig-dot">◆ Drawing</span>' : "") + "</p>" + saveBtn(s) + "</article>";
	}
	function renderLibrary() {
		const ws = words(state.q);
		const list = STANDARDS.map((s) => ({ s: s, sc: score(s, ws) }))
			.filter((x) => x.sc > 0 && (!state.cat || x.s.cat === state.cat) && (ws.length || x.s.cat !== "bylaws"))
			.sort((a, b) => b.sc - a.sc || (a.s.group || "").localeCompare(b.s.group || ""));
		$("library").classList.toggle("searching", ws.length > 0 || !!state.cat);
		$("results").innerHTML = list.map((x) => card(x.s, ws)).join("");
		$("none").hidden = list.length > 0;
		$("count").textContent = list.length + " of " + STANDARDS.length;
		$("results-title").textContent = state.q ? "Results for “" + state.q + "”" : catName(state.cat);
		renderHome();
	}

	/* Home: the daily strip, "what are you designing?", recently viewed, topics */
	const ICON = {
		res: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
		edu: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
		health: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/>',
		assembly: '<path d="M3 20h18M5 20v-4h14v4M7 16v-3h10v3M9 13v-3h6v3"/>',
		business: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
		retail: '<path d="M4 9h16l-1-5H5z"/><path d="M5 9v11h14V9"/><path d="M10 20v-5h4v5"/>',
		industrial: '<path d="M3 20V10l5 3v-3l5 3v-3l5 3V4h3v16z"/>',
		storage: '<path d="M3 9l9-5 9 5v11H3z"/><path d="M7 20v-7h10v7M7 16h10"/>',
	};
	const icon = (t) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICON[t] || "") + "</svg>";
	const forBuilding = (type) => STANDARDS.filter((s) => s.cat === "bylaws" ? s.state === prefs.state && fits(s, type) : fits(s, type));
	const QUIZ = window.AXS.QUIZ || [], UPDATES = window.AXS.UPDATES || [];

	function renderDaily() {
		const pool = STANDARDS.filter((x) => x.cat !== "bylaws" && /^[0-9]/.test(x.value)); // a real number makes a better daily headline
		const s = pool[dayNo % pool.length];
		const streak = daily.last === TODAY || daily.last === YESTERDAY ? daily.streak || 0 : 0;
		let quiz = "";
		if (QUIZ.length) {
			const q = QUIZ[dayNo % QUIZ.length], pick = daily.ans[TODAY], shift = dayNo % 3;
			const order = [0, 1, 2].map((i) => (i + shift) % 3);
			quiz = '<div class="d-card quiz"><span class="k">Daily check' + (streak ? ' · <b class="streak">' + streak + "-day streak</b>" : "") + "</span><h3>" + esc(q.q) + '</h3><div class="opts">' +
				order.map((i) => '<button type="button" data-ans="' + i + '" class="' + (pick == null ? "" : i === 0 ? "right" : i === pick ? "wrong" : "dim") + '"' + (pick == null ? "" : " disabled") + ">" + esc(q.o[i]) + "</button>").join("") + "</div>" +
				(pick == null ? '<p class="d-foot">One question a day. Come back tomorrow to keep your streak.</p>' : '<p class="d-foot">' + (pick === 0 ? "Right. " : "Not quite: it is " + esc(q.o[0]) + ". ") + '<a href="#/s/' + q.id + '">Read the standard →</a></p>') + "</div>";
		}
		const fresh = UPDATES.filter((u) => lastSeen && u.d > lastSeen);
		const news = '<div class="d-card news"><span class="k">What\'s new' + (fresh.length ? ' · <b class="badge">' + fresh.length + " since your last visit</b>" : "") + '</span><ul>' +
			UPDATES.slice(0, 4).map((u) => '<li><a href="#/s/' + u.id + '">' + esc(u.t) + "</a></li>").join("") + "</ul></div>";
		$("daily").innerHTML = '<button type="button" class="d-card today-card" data-id="' + s.id + '"><span class="k">Standard of the day · ' + esc(catName(s.cat)) + '</span><div class="v num grad">' + esc(s.value) + "</div><h3>" + esc(s.title) + "</h3><p>" + esc(s.sub) + "</p></button>" + quiz + news;
	}
	$("daily").addEventListener("click", (e) => {
		const b = e.target.closest("[data-ans]");
		if (!b || daily.ans[TODAY] != null) return;
		const i = Number(b.dataset.ans);
		daily.streak = daily.last === YESTERDAY ? (daily.streak || 0) + 1 : daily.last === TODAY ? daily.streak || 1 : 1;
		daily.last = TODAY;
		daily.ans[TODAY] = i;
		Object.keys(daily.ans).sort().slice(0, -60).forEach((k) => { delete daily.ans[k]; }); // keep two months
		keep(DAILY, daily);
		renderDaily();
		toast(i === 0 ? "Right! " + daily.streak + "-day streak" : "Streak: " + daily.streak + " days. Tomorrow's another one.");
	});

	function renderHome() {
		$("state-pick").value = prefs.state;
		$("buildings").innerHTML = TYPES.map((t) => '<a class="bld" href="#/b/' + t.id + '"><span class="bld-ico">' + icon(t.id) + "</span><b>" + esc(t.name) + "</b><small>" + esc(t.eg || "") + '</small><i class="num">' + forBuilding(t.id).length + "</i></a>").join("");
		const recent = prefs.recent.map(byId).filter(Boolean).slice(0, 6);
		$("recent").innerHTML = recent.length ? '<div class="sec-head"><h2>Recently viewed</h2></div><div class="chips recent">' + recent.map((s) => '<button type="button" class="chip" data-open="' + s.id + '">' + esc(s.title) + " <b>" + esc(s.value) + "</b></button>").join("") + "</div>" : "";
		$("cats").innerHTML = CATS.map((c) => '<button type="button" class="cat" data-cat="' + c.id + '"><b>' + esc(c.name) + "<i>" + STANDARDS.filter((s) => s.cat === c.id).length + "</i></b><small>" + esc(c.blurb) + "</small></button>").join("");
	}
	$("state-pick").addEventListener("change", (e) => { prefs.state = e.target.value; keep(PREF, prefs); renderHome(); });

	/* ---------- One building: everything it needs, in design order ---------- */
	const STAGES = [["site", "Site and bylaws"], ["spaces", "Rooms and spaces"], ["stairs", "Stairs and parapets"], ["access", "Accessibility"], ["light", "Light and air"], ["fire", "Fire and exits"], ["services", "Services, water and toilets"], ["parking", "Parking"]];
	const STAGE_OF = { planning: "site", rooms: "spaces", design: "spaces", water: "services", sanitary: "services" };
	const TOPIC_STAGE = { "Parking": "parking", "Sanitation": "services", "Services and sustainability": "services", "Stairs, corridors and exits": "fire", "Rooms and spaces": "spaces", "Building elements": "spaces", "Accessibility": "access", "Swimming pools": "spaces" };
	const stageOf = (s) => s.cat === "bylaws" ? TOPIC_STAGE[s.topic] || "site" : STAGE_OF[s.cat] || s.cat;
	const srcTag = (s) => s.cat === "bylaws" ? s.state.toUpperCase() : s.src[0].split(/[ ,]/)[0];
	function row(s) {
		const fig = figOf(s);
		return '<article class="rowi" data-id="' + s.id + '" tabindex="0">' +
			(fig ? '<img class="thumb" src="' + fig + '" alt="" loading="lazy">' : '<span class="thumb tag-only">' + esc(srcTag(s)) + "</span>") +
			'<div class="ri"><h3>' + esc(s.title) + '</h3><p class="s">' + esc(s.sub) + '</p><p class="src">' + esc(cite(s)) + (s.calc && CALC[s.calc] ? ' <span class="has-calc">∑ Calculator</span>' : "") + "</p></div>" +
			'<div class="ri-v num grad">' + esc(s.value) + "</div>" + saveBtn(s) + "</article>";
	}
	function renderBuilding(type) {
		const t = TYPES.find((x) => x.id === type);
		if (!t) { location.hash = "#/"; return; }
		const st = stateOf(prefs.state), list = forBuilding(type);
		const groups = STAGES.map((g) => [g[0], g[1], list.filter((s) => stageOf(s) === g[0])]).filter((g) => g[2].length);
		const rules = list.some((s) => s.cat === "bylaws");
		$("building").innerHTML = '<div class="b-head"><a class="back" href="#/">← All buildings</a>' +
			'<div class="b-title"><span class="bld-ico lg">' + icon(type) + '</span><div><span class="k">NBC group ' + esc(t.nbc) + " · " + esc(st.name) + " rules</span><h1>" + esc(t.name) + "</h1></div></div>" +
			'<p class="sub">' + list.length + " standards and rules, in the order you design: site first, parking last. Tap one for its drawing, calculator and clause.</p>" +
			(rules ? "" : '<p class="sub">' + esc(st.name) + ' rules are being added. Until then, <a href="#/bylaws/' + st.id + '">see the official document</a>.</p>') +
			'<div class="b-actions"><button type="button" class="btn primary" id="b-save">Save all to a new project</button><button type="button" class="btn" id="b-pdf">Download all · PDF</button></div></div>' +
			'<nav class="stages" aria-label="Design stages">' + groups.map((g, i) => '<button type="button" data-goto="st-' + g[0] + '"><i>' + (i + 1) + "</i>" + esc(g[1]) + "</button>").join("") + "</nav>" +
			groups.map((g, i) => '<section class="stage" id="st-' + g[0] + '"><h2><i>' + (i + 1) + "</i>" + esc(g[1]) + '<span class="count">' + g[2].length + '</span></h2><div class="rowlist">' + g[2].map(row).join("") + "</div></section>").join("");
		$("b-save").addEventListener("click", () => {
			const name = window.prompt("Name the project", t.name + " project");
			if (name == null) return;
			const p = newProject(name, type);
			list.forEach((s) => p.items.push({ id: s.id, s: "todo", note: "" }));
			persist();
			toast("Saved " + list.length + " to " + p.name);
			location.hash = "#/p/" + p.id;
		});
		$("b-pdf").addEventListener("click", () => printBook(t.name + ": standards and rules", "NBC 2016 and " + st.short, list.map((s) => ({ s: s }))));
	}
	$("building").addEventListener("click", (e) => { const b = e.target.closest("[data-goto]"); if (b) $(b.dataset.goto).scrollIntoView({ behavior: "smooth", block: "start" }); });

	/* ---------- PDF: one standard, a building, or a project, through the browser's Save as PDF ---------- */
	function printBook(title, sub, entries) {
		const book = $("book"), order = STAGES.map((g) => g[0]), figsShown = new Set();
		entries = entries.slice().sort((a, b) => order.indexOf(stageOf(a.s)) - order.indexOf(stageOf(b.s)));
		let stage = "";
		const one = entries.length === 1, today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
		book.classList.toggle("bk-one", one);
		// Brand lockup (brand kit): aX monogram, a vertical rule, the tracked wordmark with a copper X, and the tagline.
		book.innerHTML = '<header class="bk-head"><div class="bk-lock"><img src="ax-mark.svg" alt="ArchXchange"><i></i><div><div class="bk-word">ARCH<b>X</b>CHANGE</div><div class="bk-tag">Design • Plan • Build • Better</div></div></div>' +
			'<div class="bk-meta"><span>' + (one ? "Standard sheet" : "Standards book") + "</span>" + today + "</div></header>" +
			(one ? "" : '<div class="bk-cover"><h1>' + esc(title) + "</h1><p>" + esc(sub) + " · " + entries.length + " items</p></div>") +
			entries.map((en) => {
				const s = en.s, x = en.x, fig = figsShown.has(s.fig) ? "" : figOf(s), st = stageOf(s);
				if (fig) figsShown.add(s.fig);
				const head = entries.length > 1 && st !== stage ? '<h3 class="bk-stage">' + (order.indexOf(st) + 1) + ". " + esc(STAGES[order.indexOf(st)][1]) + "</h3>" : "";
				stage = st;
				return head + '<article class="bk-item"><span class="k">' + esc(label(s)) + "</span><h2>" + esc(s.title) + (x ? ' <em class="bk-st">' + esc((STATUS.find((t) => t[0] === x.s) || STATUS[0])[1]) + "</em>" : "") + '</h2><div class="bk-v">' + esc(s.value) + "</div><p>" + esc(s.sub) + "</p>" +
					(fig ? '<figure class="bk-fig"><img src="' + fig + '" alt=""' + (one ? ' style="max-height:' + Math.max(50, Math.min(90, 92 - 4 * ((s.rows || []).length + 1.4 * (s.notes || []).length))) + 'mm"' : "") + '><figcaption>ArchXchange drawing · dimensions in mm · ' + esc(cite(s)) + "</figcaption></figure>" : "") +
					(s.rows ? "<table>" + s.rows.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>").join("") + "</table>" : "") +
					(s.notes ? "<ul>" + s.notes.map((n) => "<li>" + esc(n) + "</li>").join("") + "</ul>" : "") +
					(x && x.note ? '<p class="bk-note">Note: ' + esc(x.note) + "</p>" : "") + '<p class="bk-src"><span>Source</span>' + esc(cite(s)) + "</p></article>";
			}).join("") +
			'<footer class="bk-foot"><span>Summarised by ArchXchange in our own words, with the clause to cite. Read the source for the full text and exceptions; local bylaws and later amendments prevail.</span><b>www.archxchange.in</b></footer>';
		document.body.classList.add("book-mode");
		toast("Choose “Save as PDF” in the print window");
		const imgs = Array.from(book.querySelectorAll("img"));
		Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : null))).then(() => window.print());
	}
	window.addEventListener("afterprint", () => document.body.classList.remove("book-mode"));

	/* ---------- Solo plan: CAD and drawing PDFs ---------- */
	function openPro(what) {
		lastFocus = document.activeElement;
		$("sheet").innerHTML = '<button type="button" class="sh-close" id="sh-close" aria-label="Close">✕</button><span class="k">ArchXchange Solo</span>' +
			'<h2 class="sh-title" id="sh-title">' + esc(what) + " come with Solo</h2>" +
			'<div class="sh-value num grad">₹999 <small>a month</small></div><p class="sh-sub">One price per firm, before GST. The first 100 founding firms lock it for life.</p>' +
			'<ul class="pro-list"><li><b>CAD drawings</b>DWG and DXF, layered, dimensioned, ready for your sheets</li><li><b>A3 PDF sheets</b>to scale, with title block</li><li><b>Project packs</b>every drawing a project needs, in one download</li><li><b>The workspace</b>proposals, GST invoices and reminders, 5 active projects</li></ul>' +
			'<p class="caveat">Search, calculators, bylaws, saved projects and PDF standard sheets stay free.</p>' +
			'<div class="sh-actions"><a class="btn primary" href="https://www.archxchange.in/" target="_blank" rel="noopener">Get founding access</a><button type="button" class="btn" id="pro-x">Not now</button></div>';
		$("sheet").hidden = $("sheet-back").hidden = false;
		document.body.style.overflow = "hidden";
		$("sh-close").addEventListener("click", closeSheet);
		$("pro-x").addEventListener("click", closeSheet);
		$("sh-close").focus();
	}

	$("q").addEventListener("input", (e) => { state.q = e.target.value; state.cat = ""; renderLibrary(); });
	$("search").addEventListener("submit", (e) => {
		e.preventDefault();
		state.q = $("q").value; state.cat = ""; renderLibrary();
		$("q").blur(); // closes the phone keyboard so the results show
		$("results-head").scrollIntoView({ behavior: "smooth", block: "start" });
	});
	$("clear").addEventListener("click", () => { $("q").value = state.q = ""; state.cat = ""; renderLibrary(); window.scrollTo(0, 0); });
	$("popular").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; $("q").value = state.q = b.textContent; state.cat = ""; renderLibrary(); $("results-head").scrollIntoView({ behavior: "smooth", block: "start" }); });
	$("cats").addEventListener("click", (e) => { const b = e.target.closest(".cat"); if (!b) return; $("q").value = state.q = ""; state.cat = b.dataset.cat; renderLibrary(); $("results-head").scrollIntoView({ behavior: "smooth", block: "start" }); });
	document.addEventListener("keydown", (e) => {
		if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { e.preventDefault(); location.hash = "#/"; $("q").focus(); }
		if (e.key === "Escape" && !$("zoom").hidden) closeZoom();
		else if (e.key === "Escape" && !$("sheet").hidden) closeSheet();
		if (e.key === "Enter" && e.target.classList && (e.target.classList.contains("card") || e.target.classList.contains("rowi"))) openSheet(e.target.dataset.id);
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
		const c = e.target.closest(".card, .rowi, .today-card, [data-open]");
		if (c) openSheet(c.dataset.id || c.dataset.open);
	});

	/* ---------- Calculators ----------
	 * Each: { title, src, form() → inputs (named with data-k), run(get) → result HTML }. get(k) reads an input in the same box,
	 * so one calculator can appear in the detail sheet and on the Calculators page at once. */
	// [use, m² per person (Table 3), mm per person stairs / doors (Table 4), min. stair width mm (Part 3 cl. 12.18.1.1), min. exit door mm (Part 4 cl. 4.4.2.4.1)]
	const LOAD = [["Residential (flats)", 12.5, 10, 6.5, 1250, 1000], ["Educational", 4, 10, 6.5, 1500, 1000], ["Hospital in-patients", 15, 15, 13, 2000, 1000], ["Hospital out-patients", 10, 15, 13, 2000, 1000], ["Assembly, no fixed seats", 0.65, 10, 6.5, 2000, 2000],
		["Assembly, less concentrated", 1.4, 10, 6.5, 2000, 2000], ["Dining, restaurant", 1.8, 10, 6.5, 2000, 2000], ["Shop, street floor", 3, 10, 6.5, 1500, 1000], ["Shop, upper floor", 6, 10, 6.5, 1500, 1000], ["Offices", 10, 10, 6.5, 1500, 1000], ["Industrial", 10, 10, 6.5, 1500, 1000], ["Storage", 30, 10, 6.5, 1500, 1000]];
	// [use, litres per day, what is counted]
	const LPCD = [["Homes (cities over 1 lakh)", 200, "Residents"], ["Homes, MIG / LIG / EWS", 135, "Residents"], ["Offices", 45, "Staff"], ["Schools, day", 45, "Pupils and staff"], ["Hostels, boarding schools", 135, "Residents"], ["Hospital up to 100 beds", 340, "Beds"], ["Hospital over 100 beds", 450, "Beds"],
		["Hotel up to 3 star", 180, "Beds"], ["Hotel 4 star and above", 320, "Beds"], ["Restaurant, per seat", 70, "Seats"], ["Cinema, per seat", 15, "Seats"], ["Factory with bathrooms", 45, "Workers"], ["Clubhouse", 45, "Members and visitors"]];
	const opts = (list, i) => list.map((r, k) => '<option value="' + k + '"' + (k === i ? " selected" : "") + ">" + esc(r[0]) + "</option>").join("");
	const num = (k, label, v, wide) => "<label" + (wide ? ' class="wide"' : "") + "><span>" + label + "</span>" + '<input class="input num" data-k="' + k + '" type="number" inputmode="numeric" min="0" step="any" value="' + v + '"></label>';
	const sel = (k, label, html, wide) => "<label" + (wide ? ' class="wide"' : "") + "><span>" + label + "</span>" + '<select class="input" data-k="' + k + '">' + html + "</select></label>";
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
			fields: (g) => ({ n: LPCD[g("u")][2] }),
			form: () => num("n", "Residents", 40) + sel("u", "Building", opts(LPCD, 0)) + sel("m", "Storage", '<option value="int">Sump + overhead tank, intermittent supply</option><option value="both">Sump + overhead tank, code minimum</option><option value="oht">Overhead tank only</option><option value="ugt">Sump only</option>', true),
			run: (g) => {
				const n = g("n"), r = LPCD[g("u")], day = n * r[1], m = g("m", true);
				if (!n) return "";
				const L = (x) => fmt(x, 0) + " L · " + fmt(x / 1000, 1) + " m³";
				const rows = m === "int" ? [["Sump (UGT), 1.5 days", L(day * 1.5)], ["Overhead tank (OHT), 0.5 day", L(day * 0.5)]] : m === "both" ? [["Sump (UGT), 66.6%", L(day * 0.666)], ["Overhead tank (OHT), 33.3%", L(day * 0.3333)]]
					: m === "oht" ? [["Overhead tank, 33.3% to 50%", fmt(day * 0.3333, 0) + " – " + fmt(day * 0.5, 0) + " L"]] : [["Sump, 50% to 150%", fmt(day * 0.5, 0) + " – " + fmt(day * 1.5, 0) + " L"]];
				return out(fmt(day, 0) + " L a day", fmt(n, 0) + " " + r[2].toLowerCase() + " × " + r[1] + " litres. Fire-fighting storage is extra (Part 4).", rows);
			} },
		toilets: { title: "Toilets required", src: "NBC 2016, Part 9, cl. 4.2, Tables 1, 10, 11, 15",
			fields: (g) => ({
				office: { a: "Men", w: "Women", c: null, s: null }, school: { a: "Boys", w: "Girls", c: null, s: "School type" },
				rest: { a: "Staff, men", w: "Staff, women", c: "Seats", s: null }, mall: { a: "Staff, men", w: "Staff, women", c: "Visitors at peak", s: null },
				home: { a: null, w: null, c: null, s: null } })[g("b", true)],
			form: () => sel("b", "Building", '<option value="office">Office</option><option value="school">School</option><option value="rest">Restaurant</option><option value="mall">Shop / mall</option><option value="home">House / flat</option>', true) +
				num("a", "Men / boys / staff men", 60) + num("w", "Women / girls / staff women", 40) +
				num("c", "Seats", 100) + sel("s", "School type", opts(SCHOOL, 1)),
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
				const n = Math.ceil(a / r[1]), up = (x) => Math.ceil(x / 250) * 250; // exit width counts in 250 mm half-units
				const minS = r[0].indexOf("Assembly") === 0 || r[0].indexOf("Dining") === 0 ? (n < 150 ? 1500 : 2000) : r[4];
				const st = up(n * r[2]), dr = up(n * r[3]), gov = (w, m) => fmt(Math.max(w, m), 0) + " mm" + (m >= w ? " (the minimum governs)" : " (the occupants govern)");
				return out(fmt(n, 0) + " people", "Per floor. Each person needs " + r[2] + " mm of stair and " + r[3] + " mm of door width, counted across all the exits together, in 250 mm steps. No stair or door may be narrower than its minimum. Buildings over 15 m need at least 2 stairs.",
					[["Stair width for " + fmt(n, 0) + " people", fmt(n * r[2], 0) + " mm"], ["Minimum stair width", fmt(minS, 0) + " mm"], ["Stair width to provide", gov(st, minS)], ["Door width for " + fmt(n, 0) + " people", fmt(n * r[3], 0) + " mm"], ["Minimum exit door width", fmt(r[5], 0) + " mm"], ["Door width to provide", gov(dr, r[5])]]);
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
		tnset: { title: "Setbacks", group: "Tamil Nadu · TNCDBR 2019", src: "TNCDBR 2019, rules 35(1)(a), 35(1)(b), 39(3)",
			form: () => sel("k", "Building", '<option value="s">Small: up to 16 homes or 300 m² commercial</option><option value="l">Larger, up to 18.3 m tall</option><option value="h">High-rise, over 18.3 m</option>', true) +
				num("r", "Road width in front, m", 9) + num("h", "Building height, m", 10) + num("w", "Plot width, m", 12, true),
			fields: (g) => ({ s: {}, l: { w: null }, h: { r: null, w: null } })[g("k", true)],
			run: (g) => {
				const k = g("k", true), r = g("r"), h = g("h"), w = g("w");
				if (!h) return "";
				if (k === "h") {
					const sb = h <= 30 ? 7 : Math.min(20, 7 + Math.ceil((h - 30) / 6));
					return out(fmt(sb) + " m all round", (h <= 18.3 ? "At 18.3 m or less this is not a high-rise: choose Larger. " : "") + "7 m up to 30 m, then 1 m more for every 6 m or part, up to 20 m. Towers on one site keep the same spacing.", [["Front, sides and rear", fmt(sb) + " m"], ["Between towers", fmt(sb) + " m"]]);
				}
				if (k === "l") {
					if (r < 9) return out("Road too narrow", "Buildings of this size need a road at least 9 m wide.");
					if (h > 18.3) return out("Over 18.3 m", "Above 18.3 m the high-rise rules apply: choose High-rise.");
					const f = r <= 18 ? 3 : r <= 30.5 ? 4.5 : 6, sr = h <= 7 ? 1 : h <= 12 ? 1.5 : h <= 16 ? 2.5 : 3;
					return out(fmt(f) + " m front", "Front by road width, sides and rear by height. Continuous building areas: sides and rear nil.", [["Front", fmt(f) + " m"], ["Each side", fmt(sr) + " m"], ["Rear", fmt(sr) + " m"]]);
				}
				if (h > 12) return out("Over 12 m", "Small buildings go up to 12 m: choose Larger.");
				if (r < 6 && h > 9) return out("Over 9 m", "On roads under 6 m wide the limit is 9 m (G+1, or stilt + 2).");
				const f = r <= 9 ? 1.5 : r <= 18 ? 3 : r <= 30.5 ? 4.5 : 6;
				const side = h <= 7 ? (w <= 9 ? "1 m on one side" : "1 m on both sides") : w <= 6 ? "1 m on one side" : w <= 9 ? "1.5 m on one side" : "1.5 m on both sides";
				return out(fmt(f) + " m front", "Continuous building areas: front 1.5 m, sides and rear nil. EWS areas: front 1.0 m, sides and rear nil.", [["Front", fmt(f) + " m"], ["Side", side], ["Rear", h <= 7 ? "nil" : "1.5 m"]]);
			} },
		tnfsi: { title: "FSI and floor area", group: "Tamil Nadu · TNCDBR 2019", src: "TNCDBR 2019, rules 35 and 39",
			form: () => sel("k", "Building", '<option value="s">Small: up to 16 homes or 300 m² commercial</option><option value="l">Non high-rise, up to 18.3 m</option><option value="h">High-rise, over 18.3 m</option>', true) +
				num("a", "Plot area, m²", 400) + num("r", "Road width, m", 12),
			run: (g) => {
				const k = g("k", true), a = g("a"), r = g("r");
				if (!a) return "";
				const note = "Normally permissible FSI. Premium FSI, where the authority allows it, is extra and not included.";
				if (k === "h") {
					if (r < 12) return out("Road too narrow", "High-rise needs a road at least 12 m wide, running 500 m (Chennai Metropolitan Area and corporations) or 250 m elsewhere.");
					const f = r >= 18 ? 3.25 : r >= 15 ? 2.5 : 2;
					return out(fmt(a * f, 0) + " m² built-up", "FSI " + f + " on a " + fmt(r) + " m road. " + note, [["FSI", String(f)], ["Floor area", fmt(a * f, 0) + " m²"], ["Ground coverage, 50% max.", fmt(a * 0.5, 0) + " m²"]]);
				}
				if (k === "l") {
					if (r < 9) return out("Road too narrow", "Non high-rise buildings need a road at least 9 m wide.");
					return out(fmt(a * 2, 0) + " m² built-up", "FSI 2.0, up to 18.3 m tall. " + note, [["FSI", "2.0"], ["Floor area", fmt(a * 2, 0) + " m²"], ["Height", "18.3 m max."]]);
				}
				return out(fmt(a * 2, 0) + " m² built-up", "FSI 2.0. " + note, [["FSI", "2.0"], ["Floor area", fmt(a * 2, 0) + " m²"], ["Height", r >= 6 ? "12 m: G+2 or stilt + 3, up to 16 homes" : "9 m: G+1 or stilt + 2, up to 8 homes"]]);
			} },
		tnpark: { title: "Parking spaces", group: "Tamil Nadu · TNCDBR 2019", src: "TNCDBR 2019, Annexure IV, Part I",
			form: () => sel("u", "Use", '<option value="home">Homes</option><option value="shop">Shops, supermarkets</option><option value="office">Offices</option><option value="govt">Government offices</option>', true) +
				num("n", "Number of homes", 12) + num("a", "Floor area of one home, m²", 70) +
				sel("z", "Area", '<option value="c">Corporation or municipality</option><option value="p">Panchayat</option>', true),
			fields: (g) => g("u", true) === "home" ? {} : { n: null, a: "Total floor area, m²", z: g("u", true) === "shop" ? "Area" : null },
			run: (g) => {
				const u = g("u", true), n = g("n"), a = g("a"), pan = g("z", true) === "p";
				if (!a) return "";
				const pl = (n, w) => fmt(n, 0) + " " + w + (n === 1 ? "" : "s");
				const res = (c, t, vc, vt, why, rows) => out(pl(c + vc, "car") + " · " + pl(t + vt, "two-wheeler"), why, rows.concat([["Cars", fmt(c, 0)], ["Two-wheelers", fmt(t, 0)], ["Visitors: cars", fmt(vc, 0)], ["Visitors: two-wheelers", fmt(vt, 0)]]));
				if (u === "home") {
					if (!n) return "";
					const st = pan ? [50, 75, 100] : [25, 50, 75];
					let c = 0, t = 0;
					if (a > st[2]) c = n * Math.floor(a / st[2]);
					else if (a > st[1]) { c = Math.ceil(n / 2); t = n; }
					else if (a > st[0]) t = n;
					const vis = n > 6;
					return res(c, t, vis ? Math.round(c * 0.1) : 0, vis ? Math.round(t * 0.1) : 0,
						fmt(n, 0) + " homes of " + fmt(a) + " m². " + (a > st[2] ? "1 car for every " + st[2] + " m² of each home (rounded down: the rule does not say “or part”). " : "") + (vis ? "Visitors: 10% more, rounded, as there are over 6 homes." : "No visitor parking up to 6 homes."), []);
				}
				if (u === "shop") {
					const base = pan ? 75 : 50, k = a > base ? Math.ceil((a - base) / base) : 0;
					return res(k, k, 0, 0, "1 car and 1 two-wheeler per " + base + " m² or part, beyond the first " + base + " m².", []);
				}
				const per = u === "govt" ? (a <= 500 ? 150 : 100) : 100;
				const c = Math.ceil(a / per), t = Math.ceil(a / 25);
				return res(c, t, Math.max(1, Math.ceil(c * 0.1)), Math.max(1, Math.ceil(t * 0.1)), "1 car per " + per + " m² and 1 two-wheeler per 25 m², or part. Visitors: 10% more, at least 1 of each.", []);
			} },
		ecs: { title: "Parking area", src: "NBC 2016, Part 3, cl. 10.3",
			form: () => num("n", "Car spaces (ECS)", 20) + sel("t", "Type", '<option value="23">Open</option><option value="28">Covered, ground</option><option value="32">Basement</option>'),
			run: (g) => { const n = g("n"), m = g("t"); return n ? out(fmt(n * m, 0) + " m²", fmt(n, 0) + " ECS × " + m + " m², circulation included.") : ""; } },
	};
	/** Draws a calculator into a box and keeps its result live. */
	function mountCalc(box, c) {
		box.innerHTML = '<div class="calc-in">' + c.form() + '</div><div class="calc-out"></div>';
		const g = (k, raw) => { const el = box.querySelector('[data-k="' + k + '"]'); return raw ? el.value : Math.max(0, Number(el.value) || 0); };
		const labels = {};
		box.querySelectorAll("[data-k]").forEach((el) => { const lb = el.closest("label"); labels[el.dataset.k] = [lb, lb.querySelector("span").textContent]; });
		const upd = () => {
			const f = c.fields ? c.fields(g) || {} : {};
			Object.keys(labels).forEach((k) => { const [lb, def] = labels[k]; lb.hidden = f[k] === null; lb.querySelector("span").textContent = f[k] || def; });
			box.querySelector(".calc-out").innerHTML = c.run(g);
		};
		box.addEventListener("input", upd);
		box.addEventListener("change", upd);
		upd();
	}
	function renderTools() {
		if ($("tool-list").childElementCount) return;
		const groups = {};
		Object.keys(CALC).forEach((k) => { const g = CALC[k].group || "NBC 2016"; (groups[g] = groups[g] || []).push(k); });
		$("tool-list").innerHTML = Object.keys(groups).map((g) => '<h2 class="tool-group">' + esc(g) + "</h2>" +
			groups[g].map((k) => '<article class="tool"><h3>' + esc(CALC[k].title) + '</h3><p class="src">' + esc(CALC[k].src) + '</p><div class="calc-box" data-calc="' + k + '"></div></article>').join("")).join("");
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
		$("sheet").classList.toggle("narrow", !fig);
		$("sheet").innerHTML = '<button type="button" class="sh-close" id="sh-close" aria-label="Close">✕</button><div class="sh-grid">' +
			'<div class="sh-head"><span class="k">' + esc(label(s)) + "</span>" +
			'<h2 class="sh-title" id="sh-title">' + esc(s.title) + "</h2>" +
			'<div class="sh-value num grad">' + esc(s.value) + '</div><p class="sh-sub">' + esc(s.sub) + "</p></div>" +
			(fig ? '<div class="sh-media"><figure class="sh-fig"><button type="button" class="fig-zoom" id="sh-zoom" aria-label="Enlarge the drawing"><img src="' + fig + '" alt="Drawing: ' + esc(s.title) + '"><span class="zoom-tag">⤢ Enlarge</span></button><figcaption>' + (CADS[s.fig] ? "ArchXchange CAD drawing, drafted full size in mm. " : "ArchXchange drawing, not to scale. ") + "Dimensions per " + esc(cite(s)) + ".</figcaption></figure></div>" : "") +
			'<div class="sh-body">' +
			(s.rows ? '<div class="sh-block"><span class="k">Values</span><table class="rows">' + s.rows.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>").join("") + "</table></div>" : "") +
			(s.notes ? '<div class="sh-block"><span class="k">Also</span><ul class="notes">' + s.notes.map((n) => "<li>" + esc(n) + "</li>").join("") + "</ul></div>" : "") +
			(c ? '<div class="sh-block"><span class="k">Work it out</span><div class="calc"><b style="color:var(--text)">' + esc(c.title) + '</b><div class="calc-box" id="sh-calc"></div></div></div>' : "") +
			'<div class="sh-block"><span class="k">Applies to</span><div class="uses">' + uses.map((u) => "<span>" + esc(u) + "</span>").join("") + "</div></div>" +
			'<div class="sh-block"><span class="k">Download</span><div class="dl">' +
				'<button type="button" class="dl-b" data-dl="sheet"><b>PDF</b><span>Standard sheet</span><small class="free">Free</small></button>' +
				(fig && CADS[s.fig] ? '<button type="button" class="dl-b" data-dl="pro"><b>PDF</b><span>A3 drawing to scale</span><small>Solo</small></button><button type="button" class="dl-b" data-dl="pro"><b>DWG + DXF</b><span>' + esc(CADS[s.fig]) + "</span><small>Solo</small></button>" : "") + "</div></div>" +
			'<div class="sh-block"><span class="k">Cite</span><div class="cite"><span>' + esc(cite(s)) + '</span><span class="cite-b"><button type="button" class="btn sm" id="sh-copy">Copy</button><button type="button" class="btn sm" id="sh-share">Share</button></span></div></div>' +
			'<div class="sh-block" id="sh-save"><span class="k">Save to a project</span>' +
			(db.projects.length ? '<div class="sh-actions"><select class="input" id="sh-proj">' + projOpts + '</select><button type="button" class="btn primary" id="sh-add"></button></div>'
				: '<div class="sh-actions"><input class="input" id="sh-new" placeholder="Name your first project" maxlength="80"><button type="button" class="btn primary" id="sh-create">Create and save</button></div>') +
			'</div><p class="caveat">Summarised from the source in our own words. Check the code for the full clause and exceptions; local bye-laws and later amendments prevail.</p></div></div>';
		$("sheet").hidden = $("sheet-back").hidden = false;
		$("sheet").scrollTop = 0;
		if (fig) $("sh-zoom").addEventListener("click", () => openZoom(fig, s.title));
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
			$("sheet").querySelectorAll("[data-dl]").forEach((b) => b.addEventListener("click", () => {
				if (b.dataset.dl === "sheet") printBook(s.title, cite(s), [{ s: s }]);
				else openPro("CAD and PDF drawings");
			}));
			$("sh-share").addEventListener("click", () => {
				const url = location.origin + location.pathname + "#/s/" + s.id;
				if (navigator.share) navigator.share({ title: s.title + " · ArchXchange Standards", text: s.title + ": " + s.value, url: url }).catch(() => {});
				else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast("Link copied"), () => {});
			});
			viewed(s.id);
		(saving && $("sh-new") ? $("sh-new") : $("sh-close")).focus();
		if (!$("library").hidden && location.hash !== "#/s/" + s.id) history.replaceState(null, "", "#/s/" + s.id);
	}
	/* ---------- Drawing viewer: fit, zoom with buttons, wheel or double-click, drag to pan ---------- */
	const ZL = [1, 1.5, 2, 3, 4];
	let zi = 0;
	function setZoom(i, px, py) {
		const st = $("zoom-stage"), img = $("zoom-img");
		const ax = px == null ? st.clientWidth / 2 : px, ay = py == null ? st.clientHeight / 2 : py;
		const rx = (st.scrollLeft + ax) / Math.max(st.scrollWidth, 1), ry = (st.scrollTop + ay) / Math.max(st.scrollHeight, 1);
		zi = Math.max(0, Math.min(ZL.length - 1, i));
		const fit = Math.min((st.clientWidth - 32) / (img.naturalWidth || 1), (st.clientHeight - 32) / (img.naturalHeight || 1));
		img.style.width = Math.round(img.naturalWidth * fit * ZL[zi]) + "px";
		st.classList.toggle("zoomed", zi > 0);
		st.scrollLeft = rx * st.scrollWidth - ax;
		st.scrollTop = ry * st.scrollHeight - ay;
		$("zoom-level").textContent = Math.round(ZL[zi] * 100) + "%";
	}
	function openZoom(src, title) {
		const img = $("zoom-img");
		$("zoom-title").textContent = title;
		$("zoom-open").href = src;
		$("zoom").hidden = false;
		img.onload = () => setZoom(0);
		img.src = src;
		if (img.complete) setZoom(0);
		$("zoom-x").focus();
	}
	const closeZoom = () => { $("zoom").hidden = true; if ($("sh-zoom")) $("sh-zoom").focus(); };
	$("zoom").querySelectorAll("[data-z]").forEach((b) => b.addEventListener("click", () => setZoom(b.dataset.z === "fit" ? 0 : zi + (b.dataset.z === "+" ? 1 : -1))));
	$("zoom-x").addEventListener("click", closeZoom);
	(() => {
		const st = $("zoom-stage"), at = (e) => { const r = st.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
		let drag = null;
		st.addEventListener("dblclick", (e) => { const p = at(e); setZoom(zi ? 0 : 2, p[0], p[1]); });
		st.addEventListener("wheel", (e) => { e.preventDefault(); const p = at(e); setZoom(zi + (e.deltaY < 0 ? 1 : -1), p[0], p[1]); }, { passive: false });
		st.addEventListener("pointerdown", (e) => { if (!zi) return; drag = { x: e.clientX, y: e.clientY, l: st.scrollLeft, t: st.scrollTop }; st.setPointerCapture(e.pointerId); });
		st.addEventListener("pointermove", (e) => { if (drag) { st.scrollLeft = drag.l - (e.clientX - drag.x); st.scrollTop = drag.t - (e.clientY - drag.y); } });
		st.addEventListener("pointerup", () => { drag = null; });
		window.addEventListener("resize", () => { if (!$("zoom").hidden) setZoom(zi); });
	})();

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
		const suggest = forBuilding(p.type).filter((s) => !p.items.some((x) => x.id === s.id));
		const cadN = new Set(p.items.map((x) => byId(x.id)).filter((s) => s && CADS[s.fig]).map((s) => s.fig)).size;
		$("project").innerHTML = '<div class="p-head"><a class="back" href="#/projects">← My projects</a><span class="k">' + esc(typeName(p.type)) + "</span><h1>" + esc(p.name) + "</h1>" +
			'<div class="p-stats"><span><b>' + p.items.length + "</b> standards</span><span><b>" + ok + "</b> comply</span><span><b>" + chk + "</b> to check</span><span><b>" + (p.items.length - ok - chk) + '</b> to do</span></div>' +
			'<div class="bar"><i style="width:' + (p.items.length ? 100 * ok / p.items.length : 0) + '%"></i></div>' +
			'<div class="p-tools">' + (p.items.length ? '<button type="button" class="btn sm primary" id="p-book">Download all · PDF</button><button type="button" class="btn sm" id="p-print">Checklist · PDF</button>' : "") +
				(cadN ? '<button type="button" class="btn sm" id="p-cad">Drawings · DWG, DXF, PDF (' + cadN + ")</button>" : "") +
				(suggest.length ? '<button type="button" class="btn sm" id="p-all">Add all ' + suggest.length + " for " + esc(typeName(p.type).toLowerCase()) + "</button>" : "") +
				'<button type="button" class="btn sm" id="p-ren">Rename</button><button type="button" class="btn sm" id="p-del">Delete project</button></div></div>' +
			'<div class="checklist">' + (p.items.length ? p.items.map((x) => {
				const s = byId(x.id);
				if (!s) return "";
				return '<div class="item" data-sid="' + s.id + '"><div><h3 data-open="' + s.id + '">' + esc(s.title) + ' <span class="print-status">[' + (STATUS.find((t) => t[0] === x.s) || STATUS[0])[1] + ']</span></h3><span class="v">' + esc(s.value) + "</span> <span class=\"src\">· " + esc(s.sub) + " · " + esc(cite(s)) + "</span></div>" +
					'<div class="status">' + STATUS.map((t) => '<button type="button" data-s="' + t[0] + '" class="' + (x.s === t[0] ? "on" : "") + '">' + t[1] + "</button>").join("") + "</div>" +
					'<input class="input item-note" placeholder="Note: where it applies, drawing no., what to fix" value="' + esc(x.note) + '" maxlength="200"><button type="button" class="item-x">Remove</button></div>';
			}).join("") : '<div class="empty-proj">Nothing saved yet. Add the suggestions below, or save from the library.</div>') + "</div>" +
			(suggest.length ? '<div class="suggest"><h2>Suggested for ' + esc(typeName(p.type).toLowerCase()) + ' buildings</h2><p class="sub">Tap a card to read it; the bookmark adds it here.</p><div class="grid" style="margin-top:12px">' + suggest.map((s) => card(s)).join("") + "</div></div>" : "");
		db.active = p.id; persist();
			if ($("p-print")) $("p-print").addEventListener("click", () => window.print());
			if ($("p-book")) $("p-book").addEventListener("click", () => printBook(p.name, typeName(p.type) + " · standards checklist", p.items.filter((x) => byId(x.id)).map((x) => ({ s: byId(x.id), x: x }))));
			if ($("p-cad")) $("p-cad").addEventListener("click", () => openPro("Project drawing packs"));
			$("p-ren").addEventListener("click", () => { const n = window.prompt("Rename the project", p.name); if (n == null || !n.trim()) return; p.name = n.trim().slice(0, 80); persist(); renderProject(p); });
			if ($("p-all")) $("p-all").addEventListener("click", () => { suggest.forEach((s) => p.items.push({ id: s.id, s: "todo", note: "" })); persist(); renderProject(p); toast("Added " + suggest.length + " standards"); });
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
		["library", "building", "bylaws", "tools", "projects", "project"].forEach((v) => { $(v).hidden = v !== view; });
		document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("on", a.dataset.view === (view === "project" ? "projects" : view === "building" ? "library" : view)));
	}
	function refresh() { route(true); }
	function route(keepSheet) {
		const h = location.hash || "#/";
		const m = h.match(/^#\/(projects|p|s|b|bylaws|tools)?\/?([\w-]*)/) || [];
		if (m[1] === "projects") { show("projects"); renderProjects(); }
		else if (m[1] === "bylaws") { show("bylaws"); renderBylaws(m[2]); }
		else if (m[1] === "tools") { show("tools"); renderTools(); }
		else if (m[1] === "b") { show("building"); renderBuilding(m[2]); }
		else if (m[1] === "p" && project(m[2])) { show("project"); renderProject(project(m[2])); }
		else { show("library"); renderLibrary(); if (m[1] === "s" && keepSheet !== true) openSheet(m[2]); }
		if (keepSheet !== true && !/^#\/s\//.test(h) && !$("sheet").hidden) closeSheet();
		if (keepSheet !== true) window.scrollTo(0, 0);
	}
	window.addEventListener("hashchange", () => route());
	persist();
	renderDaily();
	route();
})();
