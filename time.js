(function () {
  'use strict';
  var CITIES = [
    ['Philippines', 'Asia/Manila'], ['Los Angeles, USA', 'America/Los_Angeles'],
    ['San Francisco, USA', 'America/Los_Angeles'], ['Seattle, USA', 'America/Los_Angeles'],
    ['Denver, USA', 'America/Denver'], ['Chicago, USA', 'America/Chicago'],
    ['New York, USA', 'America/New_York'], ['Honolulu, USA', 'Pacific/Honolulu'],
    ['Anchorage, USA', 'America/Anchorage'], ['Toronto, Canada', 'America/Toronto'],
    ['Vancouver, Canada', 'America/Vancouver'], ['Mexico City, Mexico', 'America/Mexico_City'],
    ['São Paulo, Brazil', 'America/Sao_Paulo'], ['London, UK', 'Europe/London'],
    ['Paris, France', 'Europe/Paris'], ['Berlin, Germany', 'Europe/Berlin'],
    ['Moscow, Russia', 'Europe/Moscow'], ['Dubai, UAE', 'Asia/Dubai'],
    ['Mumbai, India', 'Asia/Kolkata'], ['Bangkok, Thailand', 'Asia/Bangkok'],
    ['Singapore', 'Asia/Singapore'], ['Hong Kong', 'Asia/Hong_Kong'],
    ['Tokyo, Japan', 'Asia/Tokyo'], ['Seoul, South Korea', 'Asia/Seoul'],
    ['Sydney, Australia', 'Australia/Sydney'], ['Auckland, New Zealand', 'Pacific/Auckland'],
    ['Johannesburg, South Africa', 'Africa/Johannesburg'],
    ['Phoenix, USA', 'America/Phoenix'], ['Halifax, Canada', 'America/Halifax'], ['St. John\'s, Canada', 'America/St_Johns'],
    ['Guam', 'Pacific/Guam'], ['Fiji', 'Pacific/Fiji'], ['Bogotá, Colombia', 'America/Bogota'], ['Lima, Peru', 'America/Lima'],
    ['Santiago, Chile', 'America/Santiago'], ['Buenos Aires, Argentina', 'America/Argentina/Buenos_Aires'],
    ['Reykjavik, Iceland', 'Atlantic/Reykjavik'], ['Lisbon, Portugal', 'Europe/Lisbon'], ['Madrid, Spain', 'Europe/Madrid'],
    ['Rome, Italy', 'Europe/Rome'], ['Athens, Greece', 'Europe/Athens'], ['Istanbul, Turkey', 'Europe/Istanbul'],
    ['Cairo, Egypt', 'Africa/Cairo'], ['Nairobi, Kenya', 'Africa/Nairobi'], ['Lagos, Nigeria', 'Africa/Lagos'],
    ['Riyadh, Saudi Arabia', 'Asia/Riyadh'], ['Karachi, Pakistan', 'Asia/Karachi'], ['Dhaka, Bangladesh', 'Asia/Dhaka'],
    ['Jakarta, Indonesia', 'Asia/Jakarta'], ['Kuala Lumpur, Malaysia', 'Asia/Kuala_Lumpur'], ['Taipei, Taiwan', 'Asia/Taipei'],
    ['Perth, Australia', 'Australia/Perth'], ['Adelaide, Australia', 'Australia/Adelaide'], ['Brisbane, Australia', 'Australia/Brisbane']
  ];
  var $ = function (id) { return document.getElementById(id); };
  var active = 'A'; // which side the user last edited

  function parts(ms, tz) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var o = {};
    f.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  function offsetMs(ms, tz) {
    var p = parts(ms, tz);
    return Date.UTC(+p.year, p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
  }
  // wall-clock string "YYYY-MM-DDTHH:mm" in tz  ->  UTC ms
  function wallToUtc(str, tz) {
    var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(str);
    if (!m) return NaN;
    var wall = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]), t = wall;
    for (var i = 0; i < 3; i++) t = wall - offsetMs(t, tz);
    return t;
  }
  function utcToWall(ms, tz) {
    var p = parts(ms, tz);
    return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute;
  }
  function offLabel(ms, tz) {
    var o = offsetMs(ms, tz) / 6e4, sign = o < 0 ? '-' : '+', a = Math.abs(o);
    var h = Math.floor(a / 60), mi = a % 60;
    return 'UTC' + sign + h + (mi ? ':' + (mi < 10 ? '0' : '') + mi : '');
  }
  function abbr(ms, tz) {
    var n = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date(ms))
      .filter(function (p) { return p.type === 'timeZoneName'; })[0];
    return n ? n.value : '';
  }
  function cityName(sel) { return sel.options[sel.selectedIndex].getAttribute('data-name').split(',')[0]; }

  function update() {
    var src = active, dst = src === 'A' ? 'B' : 'A';
    var tzS = $('city' + src).value, tzD = $('city' + dst).value;
    var ms = wallToUtc($('time' + src).value, tzS);
    if (isNaN(ms)) return;
    $('time' + dst).value = utcToWall(ms, tzD);
    var tzA = $('cityA').value, tzB = $('cityB').value;
    $('infoA').textContent = abbr(ms, tzA) + ' · ' + offLabel(ms, tzA);
    $('infoB').textContent = abbr(ms, tzB) + ' · ' + offLabel(ms, tzB);
    var d = (offsetMs(ms, tzB) - offsetMs(ms, tzA)) / 36e5;
    var nA = cityName($('cityA')), nB = cityName($('cityB'));
    $('timeDiff').textContent = d === 0 ? nA + ' and ' + nB + ' share the same time'
      : nB + ' is ' + Math.abs(d) + ' hour' + (Math.abs(d) === 1 ? '' : 's') + (d < 0 ? ' behind ' : ' ahead of ') + nA;
    var fmt = function (tz) {
      return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(ms));
    };
    $('worldTable').querySelector('tbody').innerHTML = LIST.map(function (c) {
      var hl = (c.tz === tzA || c.tz === tzB) ? ' class="hl"' : '';
      return '<tr' + hl + '><td>' + c.name + '</td><td>' + fmt(c.tz) + '</td><td>' + abbr(ms, c.tz) + ' ' + offLabel(ms, c.tz) + '</td></tr>';
    }).join('');
  }

  function now() {
    $('timeA').value = utcToWall(Date.now(), $('cityA').value);
    active = 'A'; update();
  }

  // Every IANA zone the browser knows, plus the curated names above, sorted by
  // current UTC offset. Philippines and Los Angeles are pinned to the top.
  function canon(tz) {
    try { return new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone; } catch (e) { return tz; }
  }
  function buildList() {
    var seen = {}, list = [], nowMs = Date.now();
    CITIES.forEach(function (c) { seen[canon(c[1])] = true; list.push({ name: c[0], tz: c[1] }); });
    var all = [];
    try { all = Intl.supportedValuesOf('timeZone'); } catch (e) { /* older browsers: curated list only */ }
    all.forEach(function (tz) {
      var k = canon(tz);
      if (seen[k] || /^(Etc|SystemV)\//.test(tz)) return;
      seen[k] = true;
      list.push({ name: tz.split('/').slice(1).join(' / ').replace(/_/g, ' ') || tz, tz: tz });
    });
    list.forEach(function (z) { z.off = offsetMs(nowMs, z.tz); });
    var pinned = list.slice(0, 2), rest = list.slice(2);
    rest.sort(function (a, b) { return a.off - b.off || (a.name < b.name ? -1 : 1); });
    return pinned.concat(rest).map(function (z) {
      return { name: z.name, tz: z.tz, label: z.name + ' (' + offLabel(nowMs, z.tz) + ')' };
    });
  }
  var LIST = buildList();
  ['cityA', 'cityB'].forEach(function (id) {
    $(id).innerHTML = LIST.map(function (z) {
      return '<option value="' + z.tz + '" data-name="' + z.name.replace(/"/g, '&quot;') + '">' + z.label + '</option>';
    }).join('');
  });
  $('cityA').selectedIndex = 0; // Philippines
  $('cityB').selectedIndex = 1; // Los Angeles

  $('timeA').addEventListener('input', function () { active = 'A'; update(); });
  $('timeB').addEventListener('input', function () { active = 'B'; update(); });
  // Changing a city keeps the moment fixed on the side the user last typed in.
  $('cityA').addEventListener('change', update);
  $('cityB').addEventListener('change', update);
  $('timeNow').addEventListener('click', now);
  $('timeSwap').addEventListener('click', function () {
    var a = $('cityA'), b = $('cityB'), t = a.selectedIndex;
    a.selectedIndex = b.selectedIndex; b.selectedIndex = t;
    var v = $('timeA').value; $('timeA').value = $('timeB').value; $('timeB').value = v;
    active = 'A'; update();
  });
  now();
})();
