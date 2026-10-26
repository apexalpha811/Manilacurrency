(function () {
  'use strict';
  var LB_PER_KG = 2.20462262185;
  var $ = function (id) { return document.getElementById(id); };
  var round = function (n) { return String(Math.round(n * 1e4) / 1e4); };

  // Two-way: whichever box is edited drives the other.
  $('kg').addEventListener('input', function () {
    var v = parseFloat($('kg').value);
    $('lbs').value = isFinite(v) ? round(v * LB_PER_KG) : '';
  });
  $('lbs').addEventListener('input', function () {
    var v = parseFloat($('lbs').value);
    $('kg').value = isFinite(v) ? round(v / LB_PER_KG) : '';
  });
  $('lbs').value = round(parseFloat($('kg').value) * LB_PER_KG);
})();
