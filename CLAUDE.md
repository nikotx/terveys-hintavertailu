# Terveyshintavertailu – Claude Code -ohje

## Projektin kuvaus
React + Vite + Tailwind -pohjainen hintavertailusivusto yksityisille terveyspalveluille Tampereella.
Vertailee lääkärikäyntien hintoja (Mehiläinen, Terveystalo, Pihlajalinna, Dextra ja muut).

## Rakenne
```
terveys-hintavertailu/
├── src/
│   ├── App.jsx                  # Pääkomponentti, suodatin- ja lajittelulogiikka
│   ├── index.css                # Tailwind-import
│   ├── main.jsx                 # React-juurikomponentti
│   ├── components/
│   │   ├── FilterBar.jsx        # Haku, kategoriafiltteri, lajittelu
│   │   ├── LastUpdatedBanner.jsx # Varoitusbanneri hintojen iästä
│   │   └── PriceTable.jsx       # Päävertailutaulukko
│   └── data/
│       └── prices.json          # HINTATIETOKANTA – muokkaa tätä
├── scraper.py                   # Python-scraper automaattiseen hintojen hakuun
├── package.json
├── vite.config.js
├── tailwind.config.js
└── CLAUDE.md                    # Tämä tiedosto
```

## Nopea käynnistys
```bash
npm install
npm run dev
```

## Hintojen päivitys

### Manuaalisesti
Muokkaa `src/data/prices.json`. Jokaisen palvelun hintaobjekti:
```json
{
  "price": 95,
  "unit": "€/käynti",
  "verified": true,
  "source": "terveystalo.com 2026-06-09"
}
```
Aseta `"verified": true` kun olet tarkistanut hinnan itse.

### Automaattisesti scraperilla
```bash
pip install requests beautifulsoup4 lxml
python scraper.py
```
Scraper päivittää vain hinnat, jotka löytyvät staattisesta HTML:stä.
Dynaamisten sivujen hinnat pitää päivittää manuaalisesti.

## Jatkokehitysideat Claude Codelle

### Prioriteetti 1 – Toiminnallisuus
- [ ] Lisää laboratoriotutkimukset, kuvantaminen, toimenpiteet categories
- [ ] Lisää uusia Tampereen toimijoita (Attendo, Coronaria, Felicitas jne.)
- [ ] Hintojen manuaalinen muokkaus UI:ssa (admin-näkymä)
- [ ] Kela-korvauksen laskuri (näytä omavastuuosuus automaattisesti)

### Prioriteetti 2 – UX
- [ ] Mobiilioptimointi (taulukko vaihtuu korttinäkymään pienellä ruudulla)
- [ ] Viimeisimmän muutoksen aika per hinta
- [ ] Hintahistoria / trendi

### Prioriteetti 3 – Tekniikka
- [ ] Playwright-pohjainen scraper JS-sivuille (korvaa requests-scraper)
- [ ] GitHub Actions -automaatio: scraper ajaa viikoittain
- [ ] Vercel/Netlify-deploy

## Tietoa hinnoista
Kaikki hinnat `prices.json`-tiedostossa on merkitty `"verified": false` – ne ovat
suuntaa-antavia arvioita. Ennen julkaisua tarkista ja päivitä hinnat oikeiksi
kunkin toimijan verkkosivuilta tai soittamalla asiakaspalveluun.
