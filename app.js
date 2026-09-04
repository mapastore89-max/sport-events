async function loadAndRenderEvent() {
  try {
    // 1. JSON-Datei abrufen
    const response = await fetch('events.json');
    const events = await response.json();

    // 2. Heutiges Datum ermitteln
    const today = new Date().toISOString().split('T')[0];

    // 3. Nur aktive Events filtern, die heute oder in der Zukunft liegen
    const upcomingEvents = events.filter(event => {
      return event.active && event.date >= today;
    });

    const container = document.getElementById('event-container');
    if (!container) return;

    // Falls kein Event vorhanden ist
    if (upcomingEvents.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 bg-slate-900 rounded-xl border border-slate-800">
          Derzeit stehen keine anstehenden Events an.
        </div>`;
      return;
    }

    // Nächstes Event auswählen
    const event = upcomingEvents[0];

    // HTML in den Container einfügen
    container.innerHTML = `
      <main class="page-transition min-h-[calc(100vh-64px)] pb-14 lg:pb-0">
        <div class="relative w-full bg-[#0B1121] text-slate-200 font-sans overflow-x-hidden">
          
          <div class="relative z-10 w-full border-b border-slate-800">
            <div class="relative z-10 px-4 py-3 sm:px-6 lg:px-10 flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
              
              <div class="max-w-full lg:max-w-4xl space-y-1">
                <h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-50 tracking-tight">
                  <span class="bg-gradient-to-r from-sky-300 via-emerald-300 to-sky-400 bg-clip-text text-transparent">
                    ${event.title}
                  </span>
                </h1>
                <div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 pt-1">
                  <div>📅 ${event.date}</div>
                  <div>📍 ${event.location}</div>
                  <span class="inline-flex items-center rounded-full border border-sky-500/50 bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-300">
                    ${event.category}
                  </span>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 items-center">
                <a href="${event.registerUrl}" target="_blank" class="px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all">
                  Anmelden ↗
                </a>
                <a href="${event.resultsUrl}" target="_blank" class="px-3 py-2 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-500 transition-all">
                  Ergebnisse ↗
                </a>
              </div>

            </div>
          </div>

          <div class="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6">
            <div class="grid grid-cols-3 gap-2 mb-4">
              <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div class="text-[10px] uppercase text-slate-400 font-bold">Schwimmen</div>
                <div class="text-sm font-bold text-slate-200">${event.distances.swim}</div>
              </div>
              <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div class="text-[10px] uppercase text-slate-400 font-bold">Radfahren</div>
                <div class="text-sm font-bold text-slate-200">${event.distances.bike}</div>
              </div>
              <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div class="text-[10px] uppercase text-slate-400 font-bold">Laufen</div>
                <div class="text-sm font-bold text-slate-200">${event.distances.run}</div>
              </div>
            </div>

            <div class="rounded-xl border border-sky-500/30 bg-slate-800/60 p-4 text-sm text-slate-200">
              <p>${event.description}</p>
            </div>
          </div>

        </div>
      </main>
    `;

  } catch (error) {
    console.error('Fehler beim Laden der Event-Daten:', error);
  }
}

loadAndRenderEvent();
