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
    
    const city = event.location ? event.location.split(',')[0] : 'Schweiz';
    document.getElementById('weather-location').textContent = city;

    // Distanzen
    document.getElementById('dist-swim').textContent = event.distances?.swim || '—';
    document.getElementById('dist-bike').textContent = event.distances?.bike || '—';
    document.getElementById('dist-run').textContent = event.distances?.run || '—';

    // Beschreibung & Links
    document.getElementById('event-description').textContent = event.description || 'Keine Beschreibung verfügbar.';
    document.getElementById('btn-website').href = event.registerUrl || '#';
    document.getElementById('btn-results').href = event.resultsUrl || '#';
    document.getElementById('map-directions').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
    
    // Google Maps Embed
    document.getElementById('google-map').src = `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&t=&z=11&ie=UTF8&iwloc=&output=embed`;

    // Countdown Berechnung
    const eventTime = eventDateObj.getTime();
    const now = new Date().getTime();
    const diff = eventTime - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      document.getElementById('cd-days').textContent = String(days).padStart(2, '0');
      document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
    } else {
      document.getElementById('countdown-box').innerHTML = '<span class="text-xs text-[#E5A93C] font-bold">EVENT ABGESCHLOSSEN</span>';
    }

  } catch (error) {
    console.error("Fehler beim Laden des Events:", error);
  }
}

loadEventDetail();
