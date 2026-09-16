import json
import re
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def scrape_swiss_triathlon():
    """Scrapt Events aus dem Swiss Triathlon Rennkalender."""
    print("Scrape Swiss Triathlon...")
    url = "https://swisstriathlon.ch/race-calendar/"
    events = []
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            print(f"Fehler bei Swiss Triathlon: Status {response.status_code}")
            return events

        soup = BeautifulSoup(response.text, "html.parser")
        
        # Suche nach allen Event-Karten/Einträgen auf der Seite
        articles = soup.find_all("article") or soup.find_all("div", class_=re.compile(r"event|race", re.I))

        for article in articles:
            title_tag = article.find(["h2", "h3", "h4", "a"])
            if not title_tag:
                continue

            title = title_tag.get_text(strip=True)
            if not title or len(title) < 3:
                continue

            # Link extrahieren
            link = title_tag.get("href") if title_tag.name == "a" else None
            if not link:
                a_tag = article.find("a")
                link = a_tag.get("href") if a_tag else "https://swisstriathlon.ch/race-calendar/"

            # Datum extrahieren
            text_content = article.get_text(" ", strip=True)
            date_match = re.search(r"\b(\d{1,2}[\.\/\s]+[A-Za-z0-9]+[\.\/\s]+\d{2,4}|\d{1,2}\s+[A-Za-z]{3,})\b", text_content)
            date_str = date_match.group(0) if date_match else "Termin tba"

            events.append({
                "title": title,
                "date": date_str,
                "location": "Schweiz",
                "source": "Swiss Triathlon",
                "link": link,
                "distances": ["Triathlon"]
            })

    except Exception as e:
        print(f"Fehler beim Scrapen von Swiss Triathlon: {e}")

    return events


def scrape_datasport():
    """Scrapt Triathlon-Events aus der Datasport Suche/Übersicht."""
    print("Scrape Datasport...")
    # Datasport Event-Suche gefiltert nach Triathlon
    url = "https://datasport.com/de/events"
    events = []

    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            print(f"Fehler bei Datasport: Status {response.status_code}")
            return events

        soup = BeautifulSoup(response.text, "html.parser")
        
        # Event-Karten aus Datasport parsen
        event_items = soup.find_all("div", class_=re.compile(r"event-item|card|result-item", re.I))

        for item in event_items:
            text = item.get_text()
            # Nur Triathlon-Einträge verarbeiten
            if "triathlon" not in text.lower():
                continue

            title_tag = item.find(["h3", "h4", "a"])
            title = title_tag.get_text(strip=True) if title_tag else "Triathlon Event"

            link_tag = item.find("a", href=True)
            link = f"https://datasport.com{link_tag['href']}" if link_tag and link_tag['href'].startswith("/") else (link_tag['href'] if link_tag else url)

            events.append({
                "title": title,
                "date": "2026/2027",
                "location": "Schweiz",
                "source": "Datasport",
                "link": link,
                "distances": ["Triathlon"]
            })

    except Exception as e:
        print(f"Fehler beim Scrapen von Datasport: {e}")

    return events


def main():
    all_events = []
    
    # 1. Scrapen
    all_events.extend(scrape_swiss_triathlon())
    all_events.extend(scrape_datasport())

    # 2. Duplikate entfernen (basierend auf dem Namen)
    unique_events = {}
    for event in all_events:
        clean_title = event["title"].lower().strip()
        if clean_title not in unique_events:
            unique_events[clean_title] = event

    result = list(unique_events.values())

    # 3. Speichern in events.json
    with open("events.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Erfolgreich {len(result)} Events in events.json gespeichert!")

if __name__ == "__main__":
    main()
