// Berechnet die verbleibende Zeit
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

// Hauptfunktion zum Laden und Rendern
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
        <div class="p-8 text-center text-[#A89F8D]">
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
    let globalIndex = 0;

    for (const [monthYear, monthEvents] of Object.entries(groupedEvents)) {
      // Monats-Header ohne Pin-Symbol
      htmlContent += `
        <div class="bg-[#211E1B] px-4 py-2.5 border-y border-[#3D3730] text-[#E5A93C] font-bold text-xs tracking-widest uppercase">
          ${monthYear}
        </div>
      `;

      // Events der Monatsgruppe
      monthEvents.forEach(event => {
        const swim = event.distances?.swim || '—';
        const bike = event.distances?.bike || (event.distances?.roadBike ? `${event.distances.roadBike} + ${event.distances.mountainBike || ''}` : '—');
        const run = event.distances?.run || '—';
        const registerUrl = event.registerUrl || '#';
        const cleanLocation = formatLocation(event.location);

        htmlContent += `
          <div class="event-item border-b border-[#3D3730]/40 last:border-0">
            <!-- Klickbare Hauptzeile -->
            <div class="event-row grid grid-cols-2 md:grid-cols-12 gap-2 p-4 items-center hover:bg-[#342F2A] cursor-pointer transition-colors select-none" data-target="details-${globalIndex}">
              
              <div class="text-[#E5A93C] font-bold col-span-2 text-xs sm:text-sm">${formatDate(event.date)}</div>
              
              <div class="col-span-1 md:col-span-2">
                <span class="inline-block border border-[#8B9A68]/40 bg-[#8B9A68]/20 text-[#B5C492] px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                  ${getWeeksAwayText(event.date)}
                </span>
              </div>
              
              <div class="font-bold text-[#F0EAE1] col-span-2 md:col-span-3 text-base md:text-sm">
                ${event.title}
              </div>
              
              <div class="hidden md:block col-span-1">
                <a href="${registerUrl}" target="_blank" class="external-link text-[#E8E2D5] hover:text-[#E5A93C] inline-flex items-center gap-1 font-semibold transition-colors">
                  <span>Website</span>
                  <svg class="w-3.5 h-3.5 stroke-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H18m0 0v4.5m0-4.5L8.25 17.25" />
                  </svg>
                </a>
              </div>
              
              <div class="text-[#C2B7A3] col-span-2">${cleanLocation}</div>
              <div class="text-[#A89F8D] col-span-1 truncate">${event.category}</div>
              
              <div class="text-right col-span-1 font-bold text-[#E5A93C]">
                <span id="arrow-${globalIndex}" class="arrow-icon inline-block transition-transform duration-200">→</span>
              </div>
            </div>

            <!-- Ausklappbereich -->
            <div id="details-${globalIndex}" class="details-panel hidden bg-[#1C1A17]/90 px-4 py-4 border-t border-[#3D3730] text-[#C2B7A3] space-y-3">
              <p class="text-xs sm:text-sm leading-relaxed text-[#D6CFC4]">
                ${event.description || 'Keine Beschreibung verfügbar.'}
              </p>
              <div class="flex flex-wrap gap-4 text-xs font-medium pt-1 border-t border-[#3D3730]/60">
                <span class="text-[#8B9A68]">🏊 Schwimmen: <strong class="text-[#E8E2D5]">${swim}</strong></span>
                <span class="text-[#E5A93C]">🚴 Radfahren: <strong class="text-[#E8E2D5]">${bike}</strong></span>
                <span class="text-[#C86D51]">🏃 Laufen: <strong class="text-[#E8E2D5]">${run}</strong></span>
              </div>
            </div>
          </div>
        `;
        globalIndex++;
      });
    }

    container.innerHTML = htmlContent;

    // Event-Listener für das Ausklappen zuweisen
    document.querySelectorAll('.event-row').forEach(row => {
      row.addEventListener('click', (e) => {
        // Verhindern, dass der Klick auf den Website-Link das Zeilen-Ausklappen auslöst
        if (e.target.closest('.external-link')) return;

        const targetId = row.getAttribute('data-target');
        const detailsPanel = document.getElementById(targetId);
        const arrow = row.querySelector('.arrow-icon');

        if (detailsPanel) {
          const isHidden = detailsPanel.classList.contains('hidden');
          
          if (isHidden) {
            detailsPanel.classList.remove('hidden');
            if (arrow) arrow.style.transform = 'rotate(90deg)';
          } else {
            detailsPanel.classList.add('hidden');
            if (arrow) arrow.style.transform = 'rotate(0deg)';
          }
        }
      });
    });

  } catch (error) {
    console.error("Fehler beim Laden der Events:", error);
    container.innerHTML = `
      <div class="p-8 text-center text-[#C86D51]">
        Fehler beim Laden der Events. Bitte prüfe, ob die events.json vorhanden ist.
      </div>`;
  }
}

renderEvents();
