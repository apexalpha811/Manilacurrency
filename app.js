(function () {
  'use strict';
  var FALLBACK = 0.0175; // USD per 1 PHP, used only if every API fails
  var state = { from: 'PHP', usdPerPhp: FALLBACK, live: false, date: null };
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
  }

  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  function load() {
    getJSON('https://api.frankfurter.app/latest?from=PHP&to=USD')
      .then(function (d) {
        state.usdPerPhp = d.rates.USD; state.date = d.date; state.live = true; render();
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
  $('year').textContent = new Date().getFullYear();
  render(); load();
})();
