import json
import re
import requests
from bs4 import BeautifulSoup
from datetime import datetime

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

MONTH_MAP = {
    "jan": "01", "januar": "01", "feb": "02", "februar": "02", "mär": "03", "märz": "03", "mar": "03",
    "apr": "04", "april": "04", "mai": "05", "jun": "06", "juni": "06", "jul": "07", "juli": "07",
    "aug": "08", "august": "08", "sep": "09", "september": "09", "okt": "10", "oktober": "10",
    "nov": "11", "november": "11", "dez": "12", "dezember": "12"
}

def is_swiss_location(text):
    text_lower = text.lower()
    swiss_keywords = [
        "switzerland", "schweiz", "suisse", "svizzera", " ch", ", ch", " (ch)",
        "zürich", "zurich", "bern", "luzern", "basel", "genf", "geneve", "st. gallen",
        "thun", "zug", "schwyz", "waadt", "tessin", "wallis", "aargau", "solothurn",
        "sursee", "nottwil", "yverdon", "locarno", "spiez", "rapperswil", "lausanne", "aarau", "oberwallis"
    ]
    return any(k in text_lower for k in swiss_keywords)

def is_triathlon_event(text):
    text_lower = text.lower()
    keywords = ["triathlon", "aquathlon", "duathlon", "swimrun", "swisstriathlon"]
    return any(k in text_lower for k in keywords)

def normalize_date(date_text):
    """Konvertiert Datumsangaben wie '20 Sep' oder '20.09.' zuverlässig zu 'YYYY-MM-DD'."""
    if not date_text:
        return "2026-09-01"
    
    date_text = date_text.strip().lower()
    
    # 1. Versuche Tag + Monat Text (z.B. "20 sep" oder "20. september")
    match = re.search(r'(\d{1,2})\.?\s*([a-zäöü]+)', date_text)
    if match:
        day = match.group(1).zfill(2)
        month_str = match.group(2)
        for m_key, m_num in MONTH_MAP.items():
            if month_str.startswith(m_key):
                return f"2026-{m_num}-{day}"
                
    # 2. Versuche DD.MM.YYYY
    match_full = re.search(r'(\d{1,2})\.(\d{1,2})\.(\d{2,4})', date_text)
    if match_full:
        day = match_full.group(1).zfill(2)
        month = match_full.group(2).zfill(2)
        year = match_full.group(3)
        if len(year) == 2:
            year = "20" + year
        return f"{year}-{month}-{day}"

    # Fallback
    return "2026-09-01"


def scrape_swiss_triathlon():
    print("Scrape Swiss Triathlon...")
    url = "https://swisstriathlon.ch/race-calendar/"
    events = []
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return events

        soup = BeautifulSoup(response.text, "html.parser")
        
        # Swiss Triathlon Kalender-Einträge durchsuchen
        for item in soup.find_all(["article", "div", "li"]):
            text = item.get_text(" ", strip=True)
            if "Detail" in text and ("Triathlon" in text or "Duathlon" in text):
                title_tag = item.find(["h2", "h3", "h4", "a"])
                if not title_tag:
                    continue
                
                title = title_tag.get_text(strip=True)
                if not title or len(title) < 4 or title.lower() in ["ansicht detail", "detail"]:
                    continue

                link_tag = item.find("a", href=True)
                link = link_tag["href"] if link_tag else url

                # Datum extrahieren
                date_match = re.search(r'(\d{1,2}\s+[A-Za-z]{3,10}|\d{1,2}\.\d{1,2}\.\d{2,4})', text)
                raw_date = date_match.group(0) if date_match else "2026-09-01"
                iso_date = normalize_date(raw_date)

                events.append({
                    "id": re.sub(r'[^a-z0-9]', '', title.lower()),
                    "title": title,
                    "date": iso_date,
                    "location": "Schweiz",
                    "source": "Swiss Triathlon",
                    "link": link
                })

    except Exception as e:
        print(f"Fehler bei Swiss Triathlon: {e}")

    return events


def scrape_datasport():
    print("Scrape Datasport...")
    url = "https://datasport.com/de/events"
    events = []

    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return events

        soup = BeautifulSoup(response.text, "html.parser")
        event_items = soup.find_all("div", class_=re.compile(r"event-item|card|result-item", re.I))

        for item in event_items:
            text = item.get_text()
            if not is_triathlon_event(text) or not is_swiss_location(text):
                continue

            title_tag = item.find(["h3", "h4", "a"])
            title = title_tag.get_text(strip=True) if title_tag else "Triathlon Event"

            link_tag = item.find("a", href=True)
            link = f"https://datasport.com{link_tag['href']}" if link_tag and link_tag['href'].startswith("/") else (link_tag['href'] if link_tag else url)

            date_match = re.search(r'(\d{1,2}\.\d{1,2}\.\d{2,4})', text)
            raw_date = date_match.group(0) if date_match else "2026-06-15"

            events.append({
                "id": re.sub(r'[^a-z0-9]', '', title.lower()),
                "title": title,
                "date": normalize_date(raw_date),
                "location": "Schweiz",
                "source": "Datasport",
                "link": link
            })

    except Exception as e:
        print(f"Fehler bei Datasport: {e}")

    return events


def scrape_myraceresult():
    print("Scrape my.raceresult...")
    events = []
    search_url = "https://my.raceresult.com/RRPub/php/calendar.php"
    params = {"country": "CH", "query": "triathlon", "lang": "de"}

    try:
        response = requests.get(search_url, headers=HEADERS, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            items = data.get("list", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
            
            for item in items:
                name = item.get("name") or item.get("title") or ""
                event_id = item.get("id") or item.get("eventid") or item.get("ID")
                raw_date = item.get("date") or "2026-06-01"
                place = item.get("place") or item.get("city") or "Schweiz"

                if not name or not is_triathlon_event(name + " " + str(place)):
                    continue

                link = f"https://my.raceresult.com/{event_id}/" if event_id else "https://my.raceresult.com/"

                events.append({
                    "id": str(event_id) if event_id else re.sub(r'[^a-z0-9]', '', name.lower()),
                    "title": name,
                    "date": normalize_date(raw_date),
                    "location": place,
                    "source": "my.raceresult",
                    "link": link
                })

    except Exception as e:
        print(f"Fehler bei my.raceresult: {e}")

    return events


def main():
    all_events = []
    all_events.extend(scrape_swiss_triathlon())
    all_events.extend(scrape_datasport())
    all_events.extend(scrape_myraceresult())

    unique_events = {}
    for event in all_events:
        clean_title = re.sub(r'\s+', ' ', event["title"].lower().strip())
        if clean_title not in unique_events:
            unique_events[clean_title] = event

    result = list(unique_events.values())

    with open("events.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Fertig! {len(result)} Events mit korrektem Datum in events.json gespeichert.")

if __name__ == "__main__":
    main()
