/* ArchXchange Standards: search, filter, detail, calculators and projects. All data in data.js. */
(function () {
	"use strict";
	const { TYPES, CATS, STANDARDS } = window.AXS;
	const $ = (id) => document.getElementById(id);
	const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
	const byId = (id) => STANDARDS.find((s) => s.id === id);
	const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || "";
	const typeName = (id) => (TYPES.find((t) => t.id === id) || {}).name || "Any building";
	const cite = (s) => s.src.join(", ");
	const fits = (s, type) => !type || s.uses.indexOf("all") > -1 || s.uses.indexOf(type) > -1;
	// Drawings that exist in figs/ (drawn for ArchXchange; never copied from a code or book).
	const FIGS = new Set(window.AXS.FIGS || []);
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
	$("popular").innerHTML = ["stair riser", "ramp", "kitchen size", "parking", "door width", "accessible toilet", "travel distance", "water demand"].map((q) => '<button type="button" class="chip">' + q + "</button>").join("");
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
			'<span class="k">' + esc(catName(s.cat)) + "</span>" +
			"<h3>" + hl(s.title, ws || []) + "</h3>" +
			'<div><div class="v num grad">' + esc(s.value) + '</div><p class="s">' + esc(s.sub) + "</p></div>" +
			'<p class="src"><span>' + esc(cite(s)) + "</span>" + (figOf(s) ? '<span class="fig-dot">◆ Drawing</span>' : "") + "</p>" +
			'<button type="button" class="save' + (savedIn(s.id) ? " on" : "") + '" data-save="' + s.id + '" aria-label="Save to project" title="Save to project">' + BOOK + "</button></article>";
	}
	function renderLibrary() {
		const ws = words(state.q);
		const list = STANDARDS.map((s) => ({ s: s, sc: score(s, ws) }))
			.filter((x) => x.sc > 0 && fits(x.s, state.type) && (!state.cat || x.s.cat === state.cat))
			.sort((a, b) => b.sc - a.sc);
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
		const pool = STANDARDS.filter((x) => /^[0-9]/.test(x.value)); // a real number makes a better daily headline
		const s = pool[Math.floor(Date.now() / 864e5) % pool.length];
		$("today").innerHTML = '<button type="button" class="today-card" data-id="' + s.id + '"><div><span class="k">Standard of the day · ' + esc(catName(s.cat)) + "</span><h3>" + esc(s.title) + "</h3><p>" + esc(s.sub) + " · " + esc(cite(s)) + '</p></div><div class="v num grad">' + esc(s.value) + "</div></button>";
	}

	$("q").addEventListener("input", (e) => { state.q = e.target.value; renderLibrary(); });
	$("popular").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; $("q").value = state.q = b.textContent; state.cat = ""; renderLibrary(); $("results-title").scrollIntoView({ behavior: "smooth", block: "start" }); });
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

	/* ---------- Calculators ---------- */
	const LOAD = [["Residential", 12.5, 10, 6.5], ["Educational", 4, 10, 6.5], ["Hospital in-patients", 15, 15, 13], ["Hospital out-patients", 10, 15, 13], ["Assembly, no fixed seats", 0.65, 10, 6.5],
		["Assembly, less concentrated", 1.4, 10, 6.5], ["Dining, restaurant", 1.8, 10, 6.5], ["Shop, street floor", 3, 10, 6.5], ["Shop, upper floor", 6, 10, 6.5], ["Offices", 10, 10, 6.5], ["Industrial", 10, 10, 6.5], ["Storage", 30, 10, 6.5]];
	const LPCD = [["Homes (cities over 1 lakh)", 200], ["Homes, MIG / LIG / EWS", 135], ["Offices", 45], ["Schools, day", 45], ["Hostels, boarding schools", 135], ["Hospital up to 100 beds", 340], ["Hospital over 100 beds", 450],
		["Hotel up to 3 star", 180], ["Hotel 4 star and above", 320], ["Restaurant, per seat", 70], ["Cinema, per seat", 15], ["Factory with bathrooms", 45]];
	const opts = (list, i) => list.map((r, k) => '<option value="' + k + '"' + (k === i ? " selected" : "") + ">" + esc(r[0]) + "</option>").join("");
	const field = (label, html) => "<label>" + label + html + "</label>";
	const numIn = (id, ph, v) => '<input class="input num" id="' + id + '" type="number" inputmode="decimal" min="0" step="any" placeholder="' + ph + '" value="' + (v || "") + '">';
	const fmt = (n, d) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: d == null ? 1 : d });
	const CALC = {
		ramp: { title: "Ramp from a level difference", form: () => field("Level difference, mm", numIn("c1", "600", 600)),
			run: () => {
				const rise = Number($("c1").value) || 0;
				if (!rise) return "";
				const n = rise <= 750 ? 12 : rise <= 3000 ? 15 : 20;
				return "<b class='num'>1:" + n + " · " + fmt(rise * n / 1000, 2) + " m long</b><small>Horizontal length at the steepest allowed gradient, before landings." + (rise > 300 ? " Rise over 300 mm: add steps as well." : "") + (rise > 2000 ? " Inside a building, over 2 000 mm total: provide a lift." : "") + "</small>";
			} },
		window: { title: "Minimum window area", form: () => field("Floor area, m²", numIn("c1", "12", 12)) + field("Climate", '<select class="input" id="c2"><option value="10">Hot-dry</option><option value="6">Warm-humid</option><option value="8" selected>Temperate / composite</option><option value="12">Cold</option></select>'),
			run: () => { const a = Number($("c1").value) || 0, d = Number($("c2").value); return a ? "<b class='num'>" + fmt(a / d, 2) + " m²</b><small>Windows and ventilators, excluding doors: 1/" + d + " of " + fmt(a) + " m².</small>" : ""; } },
		exit: { title: "Occupants and exit width", form: () => field("Floor area, m²", numIn("c1", "500", 500)) + field("Use", '<select class="input" id="c2">' + opts(LOAD, 9) + "</select>"),
			run: () => {
				const a = Number($("c1").value) || 0, r = LOAD[Number($("c2").value)];
				if (!a) return "";
				const n = Math.ceil(a / r[1]);
				return "<b class='num'>" + fmt(n, 0) + " people</b><small>Exit width for them: stairs " + fmt(n * r[2], 0) + " mm, doors and ramps " + fmt(n * r[3], 0) + " mm, never below the minimum stair width.</small>";
			} },
		ecs: { title: "Parking area", form: () => field("Car spaces (ECS)", numIn("c1", "20", 20)) + field("Type", '<select class="input" id="c2"><option value="23">Open</option><option value="28">Covered, ground</option><option value="32">Basement</option></select>'),
			run: () => { const n = Number($("c1").value) || 0, m = Number($("c2").value); return n ? "<b class='num'>" + fmt(n * m, 0) + " m²</b><small>" + fmt(n, 0) + " ECS × " + m + " m², circulation included.</small>" : ""; } },
		water: { title: "Daily water demand", form: () => field("People / seats / beds", numIn("c1", "40", 40)) + field("Building", '<select class="input" id="c2">' + opts(LPCD, 0) + "</select>"),
			run: () => { const n = Number($("c1").value) || 0, r = LPCD[Number($("c2").value)]; return n ? "<b class='num'>" + fmt(n * r[1], 0) + " litres a day</b><small>" + fmt(n * r[1] / 1000, 2) + " kL at " + r[1] + " litres each. Size tanks for your storage days on top.</small>" : ""; } },
	};

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
			'<span class="k">' + esc(catName(s.cat)) + "</span>" +
			'<h2 class="sh-title" id="sh-title">' + esc(s.title) + "</h2>" +
			'<div class="sh-value num grad">' + esc(s.value) + '</div><p class="sh-sub">' + esc(s.sub) + "</p>" +
			(fig ? '<figure class="sh-fig"><img src="' + fig + '" alt="Drawing: ' + esc(s.title) + '"><figcaption>ArchXchange drawing, not to scale. Dimensions per ' + esc(cite(s)) + ".</figcaption></figure>" : "") +
			(s.rows ? '<div class="sh-block"><span class="k">Values</span><table class="rows">' + s.rows.map((r) => "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>").join("") + "</table></div>" : "") +
			(s.notes ? '<div class="sh-block"><span class="k">Also</span><ul class="notes">' + s.notes.map((n) => "<li>" + esc(n) + "</li>").join("") + "</ul></div>" : "") +
			(c ? '<div class="sh-block"><span class="k">Work it out</span><div class="calc"><b style="color:var(--text)">' + esc(c.title) + '</b><div class="calc-in">' + c.form() + '</div><div class="calc-out" id="calc-out"></div></div></div>' : "") +
			'<div class="sh-block"><span class="k">Applies to</span><div class="uses">' + uses.map((u) => "<span>" + esc(u) + "</span>").join("") + "</div></div>" +
			'<div class="sh-block"><span class="k">Cite</span><div class="cite"><span>' + esc(cite(s)) + '</span><button type="button" class="btn sm" id="sh-copy">Copy</button></div></div>' +
			'<div class="sh-block" id="sh-save"><span class="k">Save to a project</span>' +
			(db.projects.length ? '<div class="sh-actions"><select class="input" id="sh-proj">' + projOpts + '</select><button type="button" class="btn primary" id="sh-add"></button></div>'
				: '<div class="sh-actions"><input class="input" id="sh-new" placeholder="Name your first project" maxlength="80"><button type="button" class="btn primary" id="sh-create">Create and save</button></div>') +
			'</div><p class="caveat">Summarised from the source in our own words. Check the code for the full clause and exceptions; local bye-laws and later amendments prevail.</p>';
		$("sheet").hidden = $("sheet-back").hidden = false;
		document.body.style.overflow = "hidden";
		if (c) { const upd = () => { $("calc-out").innerHTML = c.run(); }; $("sheet").querySelector(".calc-in").addEventListener("input", upd); upd(); }
		const label = () => { const p = project($("sh-proj").value); $("sh-add").textContent = p && p.items.some((x) => x.id === s.id) ? "Saved ✓ Remove" : "Save"; };
		if ($("sh-add")) {
			label();
			$("sh-proj").addEventListener("change", label);
			$("sh-add").addEventListener("click", () => { const p = project($("sh-proj").value); const added = toggleSave(p, s.id); label(); toast((added ? "Saved to " : "Removed from ") + p.name); refresh(); });
		} else {
			$("sh-create").addEventListener("click", () => { const p = newProject($("sh-new").value, s.uses[0] === "all" ? (state.type || "res") : s.uses[0]); toggleSave(p, s.id); toast("Created " + p.name + " and saved"); openSheet(s.id); refresh(); });
		}
		$("sh-copy").addEventListener("click", () => {
			const text = s.title + ": " + s.value + ", " + s.sub + ". (" + cite(s) + ")";
			if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast("Copied"), () => {});
		});
		$("sh-close").addEventListener("click", closeSheet);
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
		const suggest = STANDARDS.filter((s) => fits(s, p.type) && !p.items.some((x) => x.id === s.id));
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

	/* ---------- Routing ---------- */
	function show(view) {
		["library", "projects", "project"].forEach((v) => { $(v).hidden = v !== view; });
		document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("on", a.dataset.view === (view === "project" ? "projects" : view)));
	}
	function refresh() { route(true); }
	function route(keepSheet) {
		const h = location.hash || "#/";
		const m = h.match(/^#\/(projects|p|s)?\/?([\w-]*)/) || [];
		if (m[1] === "projects") { show("projects"); renderProjects(); }
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
