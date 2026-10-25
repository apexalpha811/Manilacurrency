(function () {
  'use strict';
  // Top 20 most traded currencies (BIS survey), US Dollar first. PHP is always the other side.
  var CURRENCIES = [
    ['USD', 'US Dollar', '$'], ['EUR', 'Euro', '€'], ['JPY', 'Japanese Yen', '¥'], ['GBP', 'British Pound', '£'],
    ['CNY', 'Chinese Yuan', '¥'], ['AUD', 'Australian Dollar', 'A$'], ['CAD', 'Canadian Dollar', 'C$'],
    ['CHF', 'Swiss Franc', 'CHF'], ['HKD', 'Hong Kong Dollar', 'HK$'], ['SGD', 'Singapore Dollar', 'S$'],
    ['SEK', 'Swedish Krona', 'kr'], ['KRW', 'South Korean Won', '₩'], ['NOK', 'Norwegian Krone', 'kr'],
    ['NZD', 'New Zealand Dollar', 'NZ$'], ['INR', 'Indian Rupee', '₹'], ['MXN', 'Mexican Peso', 'MX$'],
    ['TWD', 'New Taiwan Dollar', 'NT$'], ['ZAR', 'South African Rand', 'R'], ['BRL', 'Brazilian Real', 'R$'],
    ['DKK', 'Danish Krone', 'kr']
  ];
  // Approximate units per 1 USD, used only if every API fails.
  var OFFLINE = { USD: 1, EUR: 0.92, JPY: 150, GBP: 0.78, CNY: 7.2, AUD: 1.52, CAD: 1.37, CHF: 0.88, HKD: 7.8, SGD: 1.34,
    SEK: 10.5, KRW: 1350, NOK: 10.7, NZD: 1.65, INR: 83, MXN: 17, TWD: 32, ZAR: 18.5, BRL: 5, DKK: 6.9 };
  var PHP_PER_USD = 57.14;
  var perPhp = {}; // units of each currency per 1 PHP
  Object.keys(OFFLINE).forEach(function (k) { perPhp[k] = OFFLINE[k] / PHP_PER_USD; });
  var state = { phpFirst: true, cur: 'USD', live: false, date: null };
  var $ = function (id) { return document.getElementById(id); };
  var INFO = { PHP: ['Philippine Peso', '₱'] };
  CURRENCIES.forEach(function (c) { INFO[c[0]] = [c[1], c[2]]; });
  var optionsHtml = CURRENCIES.map(function (c) { return '<option value="' + c[0] + '">' + c[0] + ' – ' + c[1] + '</option>'; }).join('');
  $('fromSel').innerHTML = optionsHtml; $('toSel').innerHTML = optionsHtml;

  function label(code) { return INFO[code][0] + ' (' + code + ')'; }
  function from() { return state.phpFirst ? 'PHP' : state.cur; }
  function rate() { return state.phpFirst ? perPhp[state.cur] : 1 / perPhp[state.cur]; }
  function fmt(n, max) {
    max = max == null ? 2 : max;
    return n.toLocaleString('en-US', { minimumFractionDigits: Math.min(2, max), maximumFractionDigits: max });
  }
  function other() { return state.phpFirst ? state.cur : 'PHP'; }

  var fromResult = false;
  function render() {
    var to = other(), r = rate(), amt = parseFloat($('amount').value), cur = state.cur;
    // PHP is locked as text; the other side is the currency dropdown.
    var fromIsPhp = state.phpFirst;
    $('fromLabel').hidden = !fromIsPhp; $('fromSel').hidden = fromIsPhp;
    $('toLabel').hidden = fromIsPhp; $('toSel').hidden = !fromIsPhp;
    $('fromLabel').textContent = label('PHP'); $('toLabel').textContent = label('PHP');
    $('fromSel').value = cur; $('toSel').value = cur;
    $('fromSym').textContent = INFO[from()][1]; $('toSym').textContent = INFO[to][1];
    if (!fromResult) $('result').value = isFinite(amt) ? String(Math.round(amt * r * 100) / 100) : '';
    $('rateLine').textContent = '1 ' + from() + ' = ' + fmt(r, 4) + ' ' + to;
    $('meta').textContent = state.live
      ? 'Live rate as of ' + state.date + ' (mid-market).'
      : 'Live rates unavailable – showing approximate offline rates.';
    var rows = function (id, list, k, a, b) {
      var t = $(id);
      t.querySelector('caption').textContent = a + ' → ' + b;
      var th = t.querySelectorAll('th'); th[0].textContent = a; th[1].textContent = b;
      t.querySelector('tbody').innerHTML = list.map(function (v) {
        return '<tr><td>' + fmt(v, 0) + '</td><td>' + fmt(v * k, 2) + '</td></tr>';
      }).join('');
    };
    rows('phpTable', [10, 50, 100, 500, 1000, 5000, 10000, 50000], perPhp[cur], 'PHP', cur);
    rows('usdTable', [1, 5, 10, 20, 50, 100, 500, 1000], 1 / perPhp[cur], cur, 'PHP');
  }

  function getJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }

  function apply(rates, date) {
    CURRENCIES.forEach(function (c) { if (rates[c[0]]) perPhp[c[0]] = rates[c[0]]; });
    state.date = date; state.live = true; render();
  }
  function load() {
    getJSON('https://open.er-api.com/v6/latest/PHP')
      .then(function (d) { apply(d.rates, (d.time_last_update_utc || '').slice(0, 16)); })
      .catch(function () {
        return getJSON('https://api.frankfurter.app/latest?from=PHP').then(function (d) { apply(d.rates, d.date); });
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
  ['fromSel', 'toSel'].forEach(function (id) {
    $(id).addEventListener('change', function () {
      // Keep the PHP-side amount as typed and re-convert into the new currency.
      state.cur = $(id).value; fromResult = false; render();
    });
  });
  $('swap').addEventListener('click', function () {
    var v = parseFloat($('result').value);
    state.phpFirst = !state.phpFirst;
    if (isFinite(v)) $('amount').value = Math.round(v * 100) / 100;
    render();
  });
  $('year').textContent = new Date().getFullYear();
  render(); load();
})();
