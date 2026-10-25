(function () {
  'use strict';
  var FALLBACK = 0.0175; // USD per 1 PHP, used only if every API fails
  var state = { from: 'PHP', usdPerPhp: FALLBACK, live: false, date: null, history: [] };
  var $ = function (id) { return document.getElementById(id); };
  var SYM = { PHP: '₱', USD: '$' };
  var NAME = { PHP: 'Philippine Peso (PHP)', USD: 'US Dollar (USD)' };

  function rate() { return state.from === 'PHP' ? state.usdPerPhp : 1 / state.usdPerPhp; }
  function fmt(n, max) {
    max = max == null ? 2 : max;
    return n.toLocaleString('en-US', { minimumFractionDigits: Math.min(2, max), maximumFractionDigits: max });
  }
  function other() { return state.from === 'PHP' ? 'USD' : 'PHP'; }

  var fromResult = false;
  function render() {
    var to = other(), r = rate(), amt = parseFloat($('amount').value);
    $('fromLabel').textContent = NAME[state.from]; $('toLabel').textContent = NAME[to];
    $('fromSym').textContent = SYM[state.from]; $('toSym').textContent = SYM[to];
    if (!fromResult) $('result').value = isFinite(amt) ? String(Math.round(amt * r * 100) / 100) : '';
    $('rateLine').textContent = '1 ' + state.from + ' = ' + fmt(r, 4) + ' ' + to;
    $('meta').textContent = state.live
      ? 'Live rate as of ' + state.date + ' (mid-market).'
      : 'Live rates unavailable – showing an approximate offline rate.';
    var rows = function (id, list, k) {
      $(id).querySelector('tbody').innerHTML = list.map(function (v) {
        return '<tr><td>' + fmt(v, 0) + '</td><td>' + fmt(v * k, 2) + '</td></tr>';
      }).join('');
    };
    rows('phpTable', [10, 50, 100, 500, 1000, 5000, 10000, 50000], state.usdPerPhp);
    rows('usdTable', [1, 5, 10, 20, 50, 100, 500, 1000], 1 / state.usdPerPhp);
    drawChart();
  }

  function drawChart() {
    var c = $('chart'), h = state.history;
    var dpr = window.devicePixelRatio || 1, w = c.clientWidth, ht = 220;
    c.width = w * dpr; c.height = ht * dpr;
    var g = c.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, w, ht);
    var inv = state.from === 'USD';
    $('trendLabel').textContent = inv ? 'PHP per 1 USD' : 'USD per 1 PHP';
    if (h.length < 2) { $('trendStats').textContent = 'Trend data unavailable.'; return; }
    var v = h.map(function (p) { return inv ? 1 / p.r : p.r; });
    var min = Math.min.apply(null, v), max = Math.max.apply(null, v), pad = (max - min) * 0.1 || max * 0.01;
    min -= pad; max += pad;
    var L = 52, R = 10, T = 10, B = 24, pw = w - L - R, ph = ht - T - B;
    var css = getComputedStyle(document.body), muted = css.getPropertyValue('--muted'), line = css.getPropertyValue('--line'), acc = css.getPropertyValue('--accent');
    g.font = '11px system-ui'; g.fillStyle = muted; g.strokeStyle = line; g.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      var y = T + ph * i / 4, val = max - (max - min) * i / 4;
      g.beginPath(); g.moveTo(L, y); g.lineTo(w - R, y); g.stroke();
      g.fillText(val.toFixed(inv ? 2 : 5), 4, y + 4);
    }
    var X = function (i) { return L + pw * i / (v.length - 1); }, Y = function (x) { return T + ph * (max - x) / (max - min); };
    g.strokeStyle = acc; g.lineWidth = 2; g.beginPath();
    v.forEach(function (x, i) { i ? g.lineTo(X(i), Y(x)) : g.moveTo(X(i), Y(x)); });
    g.stroke();
    g.fillStyle = muted;
    g.fillText(h[0].d, L, ht - 6);
    g.fillText(h[h.length - 1].d, w - R - 62, ht - 6);
    var chg = (v[v.length - 1] / v[0] - 1) * 100;
    $('trendStats').textContent = 'High ' + Math.max.apply(null, v).toFixed(inv ? 3 : 5) + ' · Low ' +
      Math.min.apply(null, v).toFixed(inv ? 3 : 5) + ' · Change ' + (chg >= 0 ? '+' : '') + chg.toFixed(2) + '% over period';
  }

  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  function load() {
    var end = new Date(), start = new Date(Date.now() - 30 * 864e5);
    var iso = function (d) { return d.toISOString().slice(0, 10); };
    getJSON('https://api.frankfurter.app/' + iso(start) + '..' + iso(end) + '?from=PHP&to=USD')
      .then(function (d) {
        var days = Object.keys(d.rates).sort();
        state.history = days.map(function (k) { return { d: k, r: d.rates[k].USD }; });
        var last = state.history[state.history.length - 1];
        state.usdPerPhp = last.r; state.date = last.d; state.live = true; render();
      })
      .catch(function () {
        return getJSON('https://open.er-api.com/v6/latest/PHP').then(function (d) {
          state.usdPerPhp = d.rates.USD; state.date = (d.time_last_update_utc || '').slice(0, 16); state.live = true; render();
        });
      })
      .catch(function () { render(); });
  }

  $('amount').addEventListener('input', function () { fromResult = false; render(); });
  // Typing in the lower field converts back into the upper one.
  $('result').addEventListener('input', function () {
    var v = parseFloat($('result').value);
    $('amount').value = isFinite(v) ? Math.round(v / rate() * 100) / 100 : '';
    fromResult = true; render(); fromResult = false;
  });
  $('swap').addEventListener('click', function () {
    var v = parseFloat($('result').value);
    state.from = other();
    if (isFinite(v)) $('amount').value = Math.round(v * 100) / 100;
    render();
  });
  window.addEventListener('resize', drawChart);
  $('year').textContent = new Date().getFullYear();
  render(); load();
})();
