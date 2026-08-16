/* AI Competition Radar — renders competitions.json live in the browser.
   The schedule only ever rewrites competitions.json; this file is the layout. */
(function () {
  "use strict";

  var DAY = 86400000;
  var state = { items: [], generated: null, status: "all" };

  // --- date helpers (UTC-normalized to avoid timezone drift) --------------
  function today() {
    var n = new Date();
    return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
  }
  function parseDate(s) {
    if (!s) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (!m) return null;
    return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  }
  function daysBetween(a, b) { return Math.round((a - b) / DAY); }

  function statusOf(it, t) {
    var s = parseDate(it.start), e = parseDate(it.end);
    if (e !== null && e < t) return "completed";
    if (s !== null && s > t) return "upcoming";
    if (s === null && e === null) return "upcoming"; // dates TBA
    return "in-progress";
  }

  function durationDays(it) {
    var s = parseDate(it.start), e = parseDate(it.end);
    if (s === null || e === null) return null;
    return Math.max(0, daysBetween(e, s)) + 1;
  }

  // --- formatting ---------------------------------------------------------
  function fmtDate(s) {
    var d = parseDate(s);
    if (d === null) return null;
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
  }
  function relDays(n) {
    if (n === 0) return "today";
    if (n === 1) return "tomorrow";
    if (n === -1) return "yesterday";
    if (n > 0) return "in " + n + " days";
    return Math.abs(n) + " days ago";
  }
  function fmtPrize(it) {
    if (it.prize == null) return null;
    var v = it.prize, s;
    if (v >= 1000) s = "$" + (v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + "K";
    else s = "$" + v.toLocaleString();
    if (v >= 1000000) s = "$" + (v / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + "M";
    return s;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // --- retention: drop items ended > 7 days ago ---------------------------
  function retained(items, t) {
    return items.filter(function (it) {
      var e = parseDate(it.end);
      return e === null || e >= t - 7 * DAY;
    });
  }

  // --- card rendering -----------------------------------------------------
  function metaRow(k, v, caveat) {
    if (v == null || v === "") return "";
    return '<div class="meta-row"><span class="k">' + k + '</span><span class="v' +
      (caveat ? " caveat" : "") + '">' + v + "</span></div>";
  }

  function card(it, t) {
    var st = statusOf(it, t);
    var s = parseDate(it.start), e = parseDate(it.end), reg = parseDate(it.reg);
    var startsIn = s === null ? null : daysBetween(s, t);
    var soon = st === "upcoming" && startsIn !== null && startsIn >= 0 && startsIn <= 7;
    var dur = durationDays(it);

    var badges = [];
    badges.push('<span class="badge status-' + st + '">' +
      (st === "in-progress" ? "In progress" : st.charAt(0).toUpperCase() + st.slice(1)) + "</span>");
    if (soon) badges.push('<span class="badge soon">Starts in ' + startsIn + "d</span>");
    if (it.platform) badges.push('<span class="badge meta">' + esc(it.platform) + "</span>");
    if (it.type) badges.push('<span class="badge meta">' + esc(it.type.replace(/-/g, " ")) + "</span>");

    // When
    var whenV;
    if (st === "completed") whenV = "Ended " + (fmtDate(it.end) || "") + " · " + relDays(daysBetween(e, t));
    else if (st === "in-progress") whenV = "Running now" + (e !== null ? " · ends " + relDays(daysBetween(e, t)) : "");
    else if (s === null) whenV = "Dates to be announced";
    else whenV = fmtDate(it.start) + " · " + relDays(startsIn);

    // Runs for
    var runsV = null;
    if (dur !== null) runsV = dur + (dur === 1 ? " day" : " days") + (e !== null ? " · ends " + fmtDate(it.end) : "");

    // Deadline
    var dlV = null;
    if (reg !== null) {
      var dl = daysBetween(reg, t);
      dlV = fmtDate(it.reg) + " · " + (dl < 0 ? "closed" : relDays(dl));
    }

    // Prize
    var prizeV = null;
    var prizeNum = fmtPrize(it);
    if (prizeNum) {
      prizeV = prizeNum;
      if (it.prize_kind && it.prize_kind !== "cash") prizeV += " (" + esc(it.prize_kind) + ")";
      if (it.prize_note) prizeV += " · " + esc(it.prize_note);
    } else if (it.prize_note) {
      prizeV = esc(it.prize_note);
    }
    var prizeCaveat = it.prize_kind && it.prize_kind !== "cash";

    // Who
    var whoV = [it.eligibility, it.location].filter(Boolean).map(esc).join(" · ") || null;

    var tags = (it.tags || []).map(function (tg) { return '<span class="tag">' + esc(tg) + "</span>"; }).join("");
    var conf = it.conf && it.conf !== "confirmed" ? '<span class="tag">' + esc(it.conf) + " dates</span>" : "";

    return '<article class="card' + (soon ? " is-soon" : "") + '" data-status="' + st + '">' +
      '<div class="card-badges">' + badges.join("") + "</div>" +
      '<h2><a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.name) + "</a></h2>" +
      (it.summary ? '<p class="summary">' + esc(it.summary) + "</p>" : "") +
      (tags || conf ? '<div class="tags">' + tags + conf + "</div>" : "") +
      '<div class="meta-block">' +
        metaRow("When", whenV) +
        metaRow("Runs for", runsV) +
        metaRow("Deadline", dlV) +
        metaRow("Prize", prizeV, prizeCaveat) +
        metaRow("Who", whoV) +
      "</div>" +
      "</article>";
  }

  // --- filtering + sorting ------------------------------------------------
  function currentFilters() {
    return {
      status: state.status,
      starts: document.getElementById("f-starts").value,
      duration: document.getElementById("f-duration").value,
      prize: document.getElementById("f-prize").value,
      format: document.getElementById("f-format").value,
      sort: document.getElementById("f-sort").value,
      cash: document.getElementById("f-cash").checked,
      q: document.getElementById("f-search").value.trim().toLowerCase()
    };
  }

  function passesDuration(it, mode) {
    if (mode === "any") return true;
    var d = durationDays(it);
    if (d === null) return false;
    if (mode === "short") return d <= 2;
    if (mode === "week") return d >= 3 && d <= 7;
    if (mode === "month") return d > 7 && d <= 28;
    if (mode === "long") return d > 28;
    return true;
  }

  function apply(items, t) {
    var f = currentFilters();
    var out = items.filter(function (it) {
      var st = statusOf(it, t);
      if (f.status !== "all" && st !== f.status) return false;

      if (f.starts !== "any") {
        var s = parseDate(it.start);
        if (s === null) return false;
        var d = daysBetween(s, t);
        if (d < 0 || d > +f.starts) return false;
      }
      if (!passesDuration(it, f.duration)) return false;

      if (f.prize !== "any") {
        if (it.prize == null) return false;
        if (f.prize !== "has" && it.prize < +f.prize) return false;
      }
      if (f.cash && it.prize_kind !== "cash") return false;
      if (f.format !== "any" && it.format !== f.format) return false;

      if (f.q) {
        var hay = [it.name, it.platform, it.summary, it.location, it.type, (it.tags || []).join(" ")]
          .filter(Boolean).join(" ").toLowerCase();
        if (hay.indexOf(f.q) === -1) return false;
      }
      return true;
    });

    var byNear = function (a, b) {
      var sa = parseDate(a.start), sb = parseDate(b.start);
      var da = sa === null ? 1e9 : Math.abs(daysBetween(sa, t));
      var db = sb === null ? 1e9 : Math.abs(daysBetween(sb, t));
      return da - db;
    };
    var sorts = {
      nearest: byNear,
      chrono: function (a, b) { return (parseDate(a.start) || 8e15) - (parseDate(b.start) || 8e15); },
      deadline: function (a, b) { return (parseDate(a.reg) || 8e15) - (parseDate(b.reg) || 8e15); },
      prize: function (a, b) { return (b.prize || -1) - (a.prize || -1); }
    };
    out.sort(sorts[f.sort] || byNear);
    return out;
  }

  // --- render -------------------------------------------------------------
  function render() {
    var t = today();
    var items = retained(state.items, t);
    var shown = apply(items, t);

    var counts = { upcoming: 0, "in-progress": 0, completed: 0 };
    items.forEach(function (it) { counts[statusOf(it, t)]++; });

    document.getElementById("grid").innerHTML = shown.map(function (it) { return card(it, t); }).join("");
    document.getElementById("empty").hidden = shown.length !== 0;

    document.getElementById("count").textContent =
      shown.length + " of " + items.length + " shown · " +
      counts.upcoming + " upcoming · " + counts["in-progress"] + " in progress · " +
      counts.completed + " recently completed";

    // hero: nearest not-yet-started competition
    var upcoming = items.filter(function (it) { return statusOf(it, t) === "upcoming" && parseDate(it.start) !== null; })
      .sort(function (a, b) { return parseDate(a.start) - parseDate(b.start); });
    var title = document.getElementById("hero-title"), sub = document.getElementById("hero-sub");
    if (upcoming.length) {
      var n = upcoming[0], into = daysBetween(parseDate(n.start), t);
      title.innerHTML = 'Next up: <a href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(n.name) + "</a>";
      sub.textContent = "Starts " + relDays(into) + " (" + fmtDate(n.start) + ") · " +
        counts.upcoming + " upcoming and " + counts["in-progress"] + " running right now.";
    } else {
      title.textContent = "AI Competition Radar";
      sub.textContent = counts["in-progress"] + " running now · " + items.length + " on the radar.";
    }
  }

  // --- wiring -------------------------------------------------------------
  function wire() {
    document.getElementById("controls").hidden = false;

    var chips = document.querySelectorAll("#status-chips .chip");
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (x) { x.classList.remove("is-active"); });
        c.classList.add("is-active");
        state.status = c.dataset.status;
        render();
      });
    });

    ["f-starts", "f-duration", "f-prize", "f-format", "f-sort", "f-cash"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", render);
    });
    document.getElementById("f-search").addEventListener("input", render);

    document.getElementById("reset").addEventListener("click", function () {
      ["f-starts", "f-duration", "f-prize", "f-format"].forEach(function (id) {
        document.getElementById(id).value = "any";
      });
      document.getElementById("f-sort").value = "nearest";
      document.getElementById("f-cash").checked = false;
      document.getElementById("f-search").value = "";
      chips.forEach(function (x) { x.classList.remove("is-active"); });
      document.querySelector('#status-chips .chip[data-status="all"]').classList.add("is-active");
      state.status = "all";
      render();
    });
  }

  function fail(msg) {
    document.getElementById("hero-title").textContent = "AI Competition Radar";
    document.getElementById("hero-sub").textContent = msg;
  }

  fetch("competitions.json", { cache: "no-store" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      state.items = Array.isArray(data.items) ? data.items : [];
      state.generated = data.generated || null;
      if (state.generated) {
        document.getElementById("refreshed").textContent = "Last refreshed " + (fmtDate(state.generated) || state.generated);
      }
      wire();
      render();
    })
    .catch(function (e) {
      fail("Couldn't load competitions.json (" + e.message + "). If you just deployed, wait a moment and refresh.");
    });
})();
