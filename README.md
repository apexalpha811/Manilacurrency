# PhilippineCurrency

Static PHP ⇄ USD currency converter. Open `index.html` in a browser (or serve with `python3 -m http.server`).

- Live rates from ExchangeRate-API (backup Frankfurter); offline fallback rates
- PHP is locked on one side; the other side is a dropdown of the 20 most traded currencies (USD default)
- Swap direction, quick-reference tables, Peso info
- Two-way time zone converter (Manila ⇄ Los Angeles by default, every IANA zone, sorted by UTC offset, DST-aware)
- No build step or dependencies
