import json
import re
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def is_swiss_location(text):
    """Prüft, ob der Text auf die Schweiz hinweist."""
    text_lower = text.lower()
    swiss_keywords = [
        "switzerland", "schweiz", "suisse", "svizzera", " ch", ", ch", " (ch)",
        "zürich", "zurich", "bern", "luze", "basel", "genf", "geneve", "st. gallen",
        "thun", "zug", "schwyz", "waadt", "tessin", "wallis", "aargau", "solothurn",
        "sursee", "nottwil", "yverdon", "locarno", "spiez", "rapperswil", "lausanne"
    ]
    return any(keyword in text_lower for keyword in swiss_keywords)

def is_triathlon_event(text):
    """Prüft, ob es sich um ein Triathlon-relevantes Event handelt."""
    text_lower = text.lower()
    keywords = ["triathlon", "aquathlon", "duathlon", "swimrun", "swisstriathlon"]
    return any(k in text_lower for k in keywords)


def scrape_swiss_triathlon():
    """Scrapt Events von Swiss Triathlon."""
    print("Scrape Swiss Triathlon...")
    url = "https://swisstriathlon.ch/race-calendar/"
    events = []
    
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        if response.status_code != 200:
            return events

        soup = BeautifulSoup(response.text, "html.parser")
        articles = soup.find_all("article") or soup.find_all("div", class_=re.compile(r"event|race", re.I))

        for article in articles:
            title_tag = article.find(["h2", "h3", "h4", "a"])
            if not title_tag:
                continue

            title = title_tag.get_text(strip=True)
            if not title or len(title) < 3:
                continue

            link = title_tag.get("href") if title_tag.name == "a" else None
            if not link:
                a_tag = article.find("a")
                link = a_tag.get("href") if a_tag else url

            text_content = article.get_text(" ", strip=True)
            date_match = re.search(r"\b(\d{1,2}[\.\/\s]+[A-Za-z0-9]+[\.\/\s]+\d{2,4}|\d{1,2}\s+[A-Za-z]{3,})\b", text_content)
            date_str = date_match.group(0) if date_match else "Termin tba"

            events.append({
                "title": title,
                "date": date_str,
                "location": "Schweiz",
                "source": "Swiss Triathlon",
                "link": link
            })

    except Exception as e:
        print(f"Fehler bei Swiss Triathlon: {e}")

    return events


def scrape_datasport():
    """Scrapt Triathlon-Events aus Schweiz von Datasport."""
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
            
            # Nur Triathlon & nur Schweiz
            if not is_triathlon_event(text) or not is_swiss_location(text):
                continue

            title_tag = item.find(["h3", "h4", "a"])
            title = title_tag.get_text(strip=True) if title_tag else "Triathlon Event"

            link_tag = item.find("a", href=True)
            link = f"https://datasport.com{link_tag['href']}" if link_tag and link_tag['href'].startswith("/") else (link_tag['href'] if link_tag else url)

            events.append({
                "title": title,
                "date": "2026",
                "location": "Schweiz",
                "source": "Datasport",
                "link": link
            })

    except Exception as e:
        print(f"Fehler bei Datasport: {e}")

    return events


def scrape_myraceresult():
    """Scrapt my.raceresult speziell nach Triathlon Events in der Schweiz."""
    print("Scrape my.raceresult (CH + Triathlon)...")
    events = []
    
    # my.raceresult Such-API für den Event-Kalender
    search_url = "https://my.raceresult.com/RRPub/php/calendar.php"
    
    # Abfrage mit Filter auf Schweiz (country=CH) und Suchbegriff triathlon
    params = {
        "country": "CH",
        "query": "triathlon",
        "lang": "de"
    }

    try:
        response = requests.get(search_url, headers=HEADERS, params=params, timeout=10)
        if response.status_code == 200:
            try:
                data = response.json()
                items = data.get("list", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
                
                for item in items:
                    name = item.get("name") or item.get("title") or ""
                    event_id = item.get("id") or item.get("eventid")
                    date_str = item.get("date") or item.get("date_str") or "2026"
                    place = item.get("place") or item.get("city") or "Schweiz"

                    if not name or not is_triathlon_event(name + " " + str(place)):
                        continue

                    link = f"https://my.raceresult.com/{event_id}/" if event_id else "https://my.raceresult.com"

                    events.append({
                        "title": name,
                        "date": date_str,
                        "location": f"{place}, CH" if "CH" not in place else place,
                        "source": "my.raceresult",
                        "link": link
                    })
            except ValueError:
                # Falls HTML statt JSON zurückkommt, parsen wir HTML fallback
                soup = BeautifulSoup(response.text, "html.parser")
                for a in soup.find_all("a", href=True):
                    text = a.get_text(strip=True)
                    if is_triathlon_event(text) and is_swiss_location(text):
                        link = a['href'] if a['href'].startswith("http") else f"https://my.raceresult.com{a['href']}"
                        events.append({
                            "title": text,
                            "date": "2026",
                            "location": "Schweiz",
                            "source": "my.raceresult",
                            "link": link
                        })

    except Exception as e:
        print(f"Fehler bei my.raceresult: {e}")

    return events


def main():
    all_events = []
    
    # 1. Alle Quellen abfragen
    all_events.extend(scrape_swiss_triathlon())
    all_events.extend(scrape_datasport())
    all_events.extend(scrape_myraceresult())

    # 2. Duplikate basierend auf dem Namen filtern
    unique_events = {}
    for event in all_events:
        # Säubere den Namen für den Duplikats-Check
        clean_title = re.sub(r'\s+', ' ', event["title"].lower().strip())
        if clean_title not in unique_events:
            unique_events[clean_title] = event

    result = list(unique_events.values())

    # 3. Speichern in events.json
    with open("events.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"Fertig! {len(result)} Schweizer Triathlon-Events in events.json gespeichert.")

if __name__ == "__main__":
    main()
