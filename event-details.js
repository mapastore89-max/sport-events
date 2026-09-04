async function loadEventDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (!eventId) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const response = await fetch('events.json');
    const events = await response.json();
    const event = events.find(e => e.id === eventId);

    if (!event) {
      document.body.innerHTML = '<div class="text-center p-12 text-[#C86D51]">Event nicht gefunden.</div>';
      return;
    }

    // Titel & Metadaten
    document.title = `${event.title} – SWIM BIKE RUN`;
    document.getElementById('event-title').textContent = event.title;
    
    // Datumsformatierung
    const eventDateObj = new Date(event.date);
    document.getElementById('event-date').textContent = eventDateObj.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
    
    document.getElementById('event-location').textContent = event.location || '—';
    document.getElementById('event-category-badge').textContent = event.category || 'Standard';

    // Distanzen
    document.getElementById('dist-swim').textContent = event.distances?.swim || '—';
    document.getElementById('dist-bike').textContent = event.distances?.bike || (event.distances?.roadBike ? `${event.distances.roadBike} + ${event.distances.mountainBike || ''}` : '—');
    document.getElementById('dist-run').textContent = event.distances?.run || '—';

    // Beschreibung & Links
    document.getElementById('event-description').textContent = event.description || 'Keine Beschreibung verfügbar.';
    document.getElementById('btn-website').href = event.registerUrl || '#';
    document.getElementById('btn-results').href = event.resultsUrl || '#';

    // Wochenberechnung
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = eventDateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const weeks = Math.floor(diffDays / 7);
      document.getElementById('cd-weeks').textContent = weeks;
      document.getElementById('cd-weeks-label').textContent = weeks === 1 ? 'Woche' : 'Wochen';
    } else if (diffDays === 0) {
      document.getElementById('countdown-box').innerHTML = '<span class="text-xs text-[#E5A93C] font-bold uppercase tracking-wider">Heute</span>';
    } else {
      document.getElementById('countdown-box').innerHTML = '<span class="text-xs text-[#A89F8D] font-bold uppercase tracking-wider">Abgeschlossen</span>';
    }

  } catch (error) {
    console.error("Fehler beim Laden des Events:", error);
  }
}

loadEventDetail();
