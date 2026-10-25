# ManilaCurrency

Static PHP ⇄ USD currency converter. Open `index.html` in a browser (or serve with `python3 -m http.server`).

- Live rates from Frankfurter (ECB), backup ExchangeRate-API; offline fallback rate
- Swap direction, 30-day trend chart, quick-reference tables, Peso info
- Two-way time zone converter (Manila ⇄ Los Angeles by default, every IANA zone, sorted by UTC offset, DST-aware)
- No build step or dependencies
