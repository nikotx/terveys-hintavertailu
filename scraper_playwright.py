"""
Playwright-pohjainen scraper terveyshintavertailulle.

Käyttö:
    pip install playwright requests beautifulsoup4 lxml
    playwright install chromium
    python scraper_playwright.py

Scraper yrittää hakea hinnat suoraan palveluntarjoajien sivuilta.
Sivut, joita ei löydy automaattisesti, jätetään ennalleen prices.json:ssa.
"""

import asyncio
import json
import re
from datetime import date
from pathlib import Path

from playwright.async_api import async_playwright

PRICES_FILE = Path(__file__).parent / "src" / "data" / "prices.json"
TODAY = date.today().isoformat()

# ---------------------------------------------------------------------------
# Scraping targets – lisää uusia kohteita tähän
# ---------------------------------------------------------------------------

async def scrape_terveystalo(page) -> dict[str, int | None]:
    """Hakee Terveystalon hinnaston."""
    results: dict[str, int | None] = {}
    try:
        await page.goto("https://www.terveystalo.com/fi/palvelut/hinnasto/", timeout=20_000)
        await page.wait_for_load_state("networkidle", timeout=15_000)
        content = await page.content()
        # Yleislääkäri
        match = re.search(r'yleislää[^<]*?(\d{2,3})\s*€', content, re.IGNORECASE)
        if match:
            results["gp_visit"] = int(match.group(1))
    except Exception as e:
        print(f"  Terveystalo: {e}")
    return results


async def scrape_mehilainen(page) -> dict[str, int | None]:
    """Hakee Mehiläisen hinnaston."""
    results: dict[str, int | None] = {}
    try:
        await page.goto("https://www.mehilainen.fi/hinnasto", timeout=20_000)
        await page.wait_for_load_state("networkidle", timeout=15_000)
        content = await page.content()
        match = re.search(r'yleislää[^<]*?(\d{2,3})\s*€', content, re.IGNORECASE)
        if match:
            results["gp_visit"] = int(match.group(1))
    except Exception as e:
        print(f"  Mehiläinen: {e}")
    return results


async def scrape_pihlajalinna(page) -> dict[str, int | None]:
    """Hakee Pihlajalinnan hinnaston."""
    results: dict[str, int | None] = {}
    try:
        await page.goto("https://www.pihlajalinna.fi/hinnasto", timeout=20_000)
        await page.wait_for_load_state("networkidle", timeout=15_000)
        content = await page.content()
        match = re.search(r'yleislää[^<]*?(\d{2,3})\s*€', content, re.IGNORECASE)
        if match:
            results["gp_visit"] = int(match.group(1))
    except Exception as e:
        print(f"  Pihlajalinna: {e}")
    return results


# Lisää tähän uusia funktioita: async def scrape_attendo(page) -> dict ...

SCRAPERS = {
    "terveystalo": scrape_terveystalo,
    "mehilainen": scrape_mehilainen,
    "pihlajalinna": scrape_pihlajalinna,
}

# ---------------------------------------------------------------------------

def update_price(service: dict, provider_id: str, new_price: int) -> bool:
    """Päivittää hinnan ja palauttaa True jos hinta muuttui."""
    entry = service["prices"].get(provider_id)
    if entry is None:
        return False
    old = entry.get("price")
    if old == new_price:
        return False

    # Siirrä vanha hinta historiaan
    if old is not None:
        history = entry.setdefault("history", [])
        last = history[-1] if history else None
        if not last or last["price"] != old:
            history.append({"date": entry.get("lastChanged", TODAY), "price": old})

    entry["price"] = new_price
    entry["lastChanged"] = TODAY
    entry["source"] = f"scraper {TODAY}"
    entry["verified"] = False
    return True


async def main():
    data = json.loads(PRICES_FILE.read_text(encoding="utf-8"))

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (compatible; TerveyshintaBot/1.0)",
            locale="fi-FI",
        )
        page = await context.new_page()

        changes = 0
        for provider_id, scraper_fn in SCRAPERS.items():
            print(f"Haetaan: {provider_id}")
            scraped = await scraper_fn(page)
            for service_id, price in scraped.items():
                if price is None:
                    continue
                service = next((s for s in data["services"] if s["id"] == service_id), None)
                if service and update_price(service, provider_id, price):
                    print(f"  ✓ {service_id}: {price} €")
                    changes += 1

        await browser.close()

    if changes:
        data["lastUpdated"] = TODAY
        PRICES_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"\n{changes} hintaa päivitetty → {PRICES_FILE}")
    else:
        print("\nEi muutoksia.")


if __name__ == "__main__":
    asyncio.run(main())
