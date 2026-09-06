// Berechnet die verbleibende Zeit (z. B. "IN 2 WOCHEN")
function getWeeksAwayText(eventDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const eventDate = new Date(eventDateStr);
  const diffTime = eventDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "HEUTE";
  if (diffDays === 1) return "MORGEN";
  if (diffDays < 7) return `IN ${diffDays} TAGEN`;
  
  const weeks = Math.floor(diffDays / 7);
  return `IN ${weeks} ${weeks === 1 ? 'WOCHE' : 'WOCHEN'}`;
}

// Datum im Format "28. AUG 2027"
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('de-DE', { month: 'short' }).toUpperCase().replace('.', '');
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}

// Monat + Jahr für Header (z. B. "AUGUST 2027")
function getMonthYearHeader(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }).toUpperCase();
}

// Säubere Ort-Namen
function formatLocation(locationStr) {
  if (!locationStr) return '—';
  return locationStr.replace(/,\s*(Switzerland|Schweiz)$/i, '').trim();
}

// Hauptfunktion zum Laden und Rendern der Event-Tabelle
async function renderEvents() {
  const container = document.getElementById('events-container');
  const counter = document.getElementById('event-counter');

  try {
    const response = await fetch('events.json');
    const events = await response.json();

    const todayStr = new Date().toISOString().split('T')[0];

    const upcomingEvents = events
      .filter(event => event.active && event.date >= todayStr)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (counter) {
      counter.textContent = `ANSTEHENDE EVENTS (${upcomingEvents.length})`;
    }

    if (upcomingEvents.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-[#7C8A90]">
          Derzeit stehen keine anstehenden Events an.
        </div>`;
      return;
    }

    // Nach Monaten gruppieren
    const groupedEvents = {};
    upcomingEvents.forEach(event => {
      const monthYear = getMonthYearHeader(event.date);
      if (!groupedEvents[monthYear]) {
        groupedEvents[monthYear] = [];
      }
      groupedEvents[monthYear].push(event);
    });

    let htmlContent = '';

    for (const [monthYear, monthEvents] of Object.entries(groupedEvents)) {
      // Monats-Header ohne Pin-Symbol
      htmlContent += `
        <div class="bg-[#131C20] px-4 py-2.5 border-y border-[#26363D] text-[#F2A83E] font-bold text-xs tracking-widest uppercase">
          ${monthYear}
        </div>
      `;

      // Events der Monatsgruppe
      monthEvents.forEach(event => {
        const registerUrl = event.registerUrl || '#';
        const cleanLocation = formatLocation(event.location);

        htmlContent += `
          <div class="event-item border-b border-[#26363D]/40 last:border-0">
            <!-- Klickbare Hauptzeile -> führt zu event.html -->
            <div class="event-row grid grid-cols-2 md:grid-cols-12 gap-2 p-4 items-center hover:bg-[#1E2B31] cursor-pointer transition-colors select-none" data-id="${event.id}">
              
              <div class="text-[#F2A83E] font-bold col-span-2 text-xs sm:text-sm">${formatDate(event.date)}</div>
              
              <div class="col-span-1 md:col-span-2">
                <span class="inline-block border border-[#5FA88C]/40 bg-[#5FA88C]/20 text-[#9FCFC0] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                  ${getWeeksAwayText(event.date)}
                </span>
              </div>
              
              <div class="font-bold text-[#F2EFE7] col-span-2 md:col-span-3 text-base md:text-sm">
                ${event.title}
              </div>
              
              <div class="hidden md:block col-span-1">
                <a href="${registerUrl}" target="_blank" class="external-link text-[#E6E1D6] hover:text-[#F2A83E] inline-flex items-center gap-1 font-semibold transition-colors">
                  <span>Website</span>
                  <svg class="w-3.5 h-3.5 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H18m0 0v4.5m0-4.5L8.25 17.25" />
                  </svg>
                </a>
              </div>
              
              <div class="text-[#A7B0B4] col-span-2">${cleanLocation}</div>
              <div class="text-[#7C8A90] col-span-1 truncate">${event.category}</div>
              
              <div class="text-right col-span-1 font-bold text-[#F2A83E]">
                <span class="inline-block transition-transform duration-200">→</span>
              </div>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = htmlContent;

    // Klick-Listener zum Öffnen der Detailseite (event.html)
    document.querySelectorAll('.event-row').forEach(row => {
      row.addEventListener('click', (e) => {
        // Wenn direkt auf den externen Website-Link geklickt wird, keine Weiterleitung auslösen
        if (e.target.closest('.external-link')) return;

        const eventId = row.getAttribute('data-id');
        if (eventId) {
          window.location.href = `event.html?id=${eventId}`;
        }
      });
    });

  } catch (error) {
    console.error("Fehler beim Laden der Events:", error);
    container.innerHTML = `
      <div class="p-8 text-center text-[#E2694A]">
        Fehler beim Laden der Events. Bitte prüfe, ob die events.json vorhanden ist.
      </div>`;
  }
}

renderEvents();
