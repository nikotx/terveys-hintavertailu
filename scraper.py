"""
Terveyshintavertailu – hintascraper
====================================
Yrittää hakea julkisesti saatavilla olevia hintoja yksityisten
terveyspalvelujen verkkosivuilta ja päivittää prices.json-tiedoston.

Käyttö:
    pip install requests beautifulsoup4 lxml
    python scraper.py

HUOM: Monet hinnat ovat piilossa kirjautumisen tai dynaamisen JS:n takana.
Skripti hakee vain staattisesti näkyvät hinnat. Epäonnistuneet haut
kirjataan lokiin muttei kaadeta ohjelmaa.
"""

import json
import re
import time
import logging
from datetime import date
from pathlib import Path

import requests
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

PRICES_FILE = Path(__file__).parent / "src" / "data" / "prices.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fi-FI,fi;q=0.9,en;q=0.8",
}

# ---------------------------------------------------------------------------
# Apufunktiot
# ---------------------------------------------------------------------------

def fetch(url: str, timeout: int = 10) -> BeautifulSoup | None:
    """Lataa URL ja palauttaa BeautifulSoup-objektin tai None virhetilanteessa."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "lxml")
    except Exception as exc:
        log.warning("Fetch epäonnistui (%s): %s", url, exc)
        return None


def extract_price(text: str) -> int | None:
    """Yrittää poimia ensimmäisen kokonaisluvun euromäärän tekstistä."""
    match = re.search(r"(\d[\d\s]*)\s*[€e]", text.replace("\xa0", " "))
    if match:
        return int(match.group(1).replace(" ", ""))
    return None


# ---------------------------------------------------------------------------
# Toimijakohtaiset scraperinfunktiot
# ---------------------------------------------------------------------------

def scrape_mehilainen() -> dict:
    """
    Mehiläinen listaa osan hinnoistaan hinnastosivullaan.
    Rakenne muuttuu usein – tarkista URL ennen käyttöä.
    """
    results = {}
    url = "https://www.mehilainen.fi/hinnat"
    soup = fetch(url)
    if soup is None:
        return results

    # Etsi taulukoita tai hintaelementtejä
    for elem in soup.select("[class*='price'], [class*='hinta'], td, li"):
        text = elem.get_text(" ", strip=True)
        price = extract_price(text)
        if price and 10 < price < 1000:
            text_lower = text.lower()
            if "yleislääkäri" in text_lower or "lääkäri" in text_lower:
                if "etä" in text_lower or "video" in text_lower or "chat" in text_lower:
                    results.setdefault("gp_visit_online", price)
                else:
                    results.setdefault("gp_visit", price)
            elif "erikoislääkäri" in text_lower or "erikois" in text_lower:
                results.setdefault("specialist_visit", price)
            elif "sairaanhoitaja" in text_lower or "hoitaja" in text_lower:
                results.setdefault("nurse_visit", price)

    log.info("Mehiläinen: löydettiin %d hintaa", len(results))
    return results


def scrape_terveystalo() -> dict:
    """
    Terveystalo tarjoaa hinnaston erillisellä sivullaan.
    """
    results = {}
    url = "https://www.terveystalo.com/fi/hinnat/"
    soup = fetch(url)
    if soup is None:
        return results

    for elem in soup.select("tr, [class*='price'], [class*='hinta']"):
        text = elem.get_text(" ", strip=True)
        price = extract_price(text)
        if price and 10 < price < 1000:
            text_lower = text.lower()
            if "yleislääkäri" in text_lower:
                if "etä" in text_lower or "video" in text_lower:
                    results.setdefault("gp_visit_online", price)
                else:
                    results.setdefault("gp_visit", price)
            elif "erikoislääkäri" in text_lower:
                results.setdefault("specialist_visit", price)
            elif "sairaanhoitaja" in text_lower:
                results.setdefault("nurse_visit", price)

    log.info("Terveystalo: löydettiin %d hintaa", len(results))
    return results


def scrape_pihlajalinna() -> dict:
    """
    Pihlajalinna – hinnat voivat olla toimipistekohtaisia.
    """
    results = {}
    url = "https://www.pihlajalinna.fi/hinnat"
    soup = fetch(url)
    if soup is None:
        return results

    for elem in soup.select("tr, [class*='price'], [class*='hinta'], li"):
        text = elem.get_text(" ", strip=True)
        price = extract_price(text)
        if price and 10 < price < 1000:
            text_lower = text.lower()
            if "yleislääkäri" in text_lower:
                results.setdefault("gp_visit", price)
            elif "erikoislääkäri" in text_lower:
                results.setdefault("specialist_visit", price)
            elif "sairaanhoitaja" in text_lower:
                results.setdefault("nurse_visit", price)

    log.info("Pihlajalinna: löydettiin %d hintaa", len(results))
    return results


# ---------------------------------------------------------------------------
# Pääohjelma
# ---------------------------------------------------------------------------

SCRAPERS = {
    "mehilainen":   scrape_mehilainen,
    "terveystalo":  scrape_terveystalo,
    "pihlajalinna": scrape_pihlajalinna,
}


def run():
    data = json.loads(PRICES_FILE.read_text(encoding="utf-8"))
    updated_count = 0

    for provider_id, scraper_fn in SCRAPERS.items():
        log.info("Haetaan hinnat: %s …", provider_id)
        scraped = scraper_fn()
        time.sleep(1.5)  # kohteliaisuusviive

        for service in data["services"]:
            sid = service["id"]
            if sid in scraped:
                old = service["prices"].get(provider_id, {}).get("price")
                new_price = scraped[sid]
                if old != new_price:
                    log.info("  %s / %s: %s → %s €", provider_id, sid, old, new_price)
                    service["prices"].setdefault(provider_id, {})
                    service["prices"][provider_id]["price"] = new_price
                    service["prices"][provider_id]["verified"] = True
                    service["prices"][provider_id]["source"] = "scraper"
                    service["prices"][provider_id]["unit"] = "€/käynti"
                    updated_count += 1

    data["lastUpdated"] = str(date.today())
    PRICES_FILE.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    log.info("Valmis. Päivitettiin %d hintaa. Tiedosto tallennettu.", updated_count)


if __name__ == "__main__":
    run()
