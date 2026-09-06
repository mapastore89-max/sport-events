// Parst ein "YYYY-MM-DD"-Datum als lokales Datum (nicht UTC), damit
// die Anzeige/Berechnung in jeder Zeitzone korrekt bleibt.
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Anzahl verbleibender Tage bis zu einem Datum
function getDaysRemaining(eventDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = parseLocalDate(eventDateStr);
  const diffTime = eventDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Berechnet die verbleibende Zeit (z. B. "IN 2 WOCHEN")
function getWeeksAwayText(eventDateStr) {
  const diffDays = getDaysRemaining(eventDateStr);

  if (diffDays === 0) return "HEUTE";
  if (diffDays === 1) return "MORGEN";
  if (diffDays < 7) return `IN ${diffDays} TAGEN`;

  const weeks = Math.floor(diffDays / 7);
  return `IN ${weeks} ${weeks === 1 ? 'WOCHE' : 'WOCHEN'}`;
}

// Datum im Format "28. AUG 2027"
function formatDate(dateStr) {
  const date = parseLocalDate(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('de-DE', { month: 'short' }).toUpperCase().replace('.', '');
  const year = date.getFullYear();
  return `${day}. ${month} ${year}`;
}

// Monat + Jahr für Header (z. B. "AUGUST 2027")
function getMonthYearHeader(dateStr) {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }).toUpperCase();
}

// Säubere Ort-Namen
function formatLocation(locationStr) {
  if (!locationStr) return '—';
  return locationStr.replace(/,\s*(Switzerland|Schweiz)$/i, '').trim();
}

// Baut eine einzelne Event-Karte
function renderEventCard(event) {
  const registerUrl = event.registerUrl || '#';
  const cleanLocation = formatLocation(event.location);

  return `
    <div class="event-row group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 rounded-xl border border-[#26363D] bg-[#172126] hover:bg-[#1E2B31] hover:border-[#F2A83E]/40 p-4 sm:p-5 cursor-pointer transition-colors" data-id="${event.id}">

      <!-- Datum -->
      <div class="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0.5 sm:w-24 shrink-0">
        <span class="font-display text-2xl leading-none text-[#F2A83E]">${formatDate(event.date)}</span>
      </div>

      <!-- Hauptinfo -->
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-bold text-[#F2EFE7] text-base truncate">${event.title}</h3>
          <span class="inline-block border border-[#5FA88C]/40 bg-[#5FA88C]/20 text-[#9FCFC0] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider shrink-0">
            ${getWeeksAwayText(event.date)}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-[#A7B0B4]">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5 text-[#7C8A90] shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
            </svg>
            ${cleanLocation}
          </span>
          <span class="text-[#7C8A90]">${event.category}</span>
        </div>
      </div>

      <!-- Aktionen -->
      <div class="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#26363D]/60">
        <a href="${registerUrl}" target="_blank" class="external-link text-[#A7B0B4] hover:text-[#F2A83E] inline-flex items-center gap-1.5 text-xs font-semibold transition-colors">
          <svg class="w-3.5 h-3.5 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H18m0 0v4.5m0-4.5L8.25 17.25" />
          </svg>
          <span>Website</span>
        </a>
        <span class="text-[#F2A83E] font-bold group-hover:translate-x-0.5 transition-transform">→</span>
      </div>
    </div>
  `;
}

// Hauptfunktion zum Laden und Rendern der Event-Liste
async function renderEvents() {
  const container = document.getElementById('events-container');
  const counter = document.getElementById('event-counter');

  try {
    const response = await fetch('events.json');
    const events = await response.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const upcomingEvents = events
      .filter(event => event.active && event.date >= todayStr)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (counter) {
      counter.textContent = `ANSTEHENDE EVENTS (${upcomingEvents.length})`;
    }

    if (upcomingEvents.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-[#7C8A90] border border-[#26363D] rounded-xl">
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
      htmlContent += `
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="text-[#F2A83E] font-bold text-xs tracking-widest uppercase">${monthYear}</span>
            <span class="flex-1 h-px bg-[#26363D]"></span>
          </div>
          <div class="space-y-3">
            ${monthEvents.map(renderEventCard).join('')}
          </div>
        </div>
      `;
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
      <div class="p-8 text-center text-[#E2694A] border border-[#26363D] rounded-xl">
        Fehler beim Laden der Events. Bitte prüfe, ob die events.json vorhanden ist.
      </div>`;
  }
}

renderEvents();
