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
    document.title = `${event.title || 'Event'} – SWIM BIKE RUN`;
    document.getElementById('event-title').textContent = event.title || 'Unbekanntes Event';
    
    // Datumsformatierung & Wochenberechnung
    if (event.date) {
      const eventDateObj = new Date(event.date);
      document.getElementById('event-date').textContent = eventDateObj.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = eventDateObj - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        const weeks = Math.floor(diffDays / 7);
        document.getElementById('cd-weeks').textContent = weeks;
        document.getElementById('cd-weeks-label').textContent = weeks === 1 ? 'Woche' : 'Wochen';
        document.getElementById('training-weeks-left').textContent = `${weeks}w to go`;

        // Trainingsphasen-Logik
        updateTrainingPhase(weeks);

      } else if (diffDays === 0) {
        document.getElementById('countdown-box').innerHTML = '<span class="text-xs text-[#E5A93C] font-bold uppercase tracking-wider">Heute</span>';
        document.getElementById('training-weeks-left').textContent = `0w to go`;
        updateTrainingPhase(0);
      } else {
        document.getElementById('countdown-box').innerHTML = '<span class="text-xs text-[#A89F8D] font-bold uppercase tracking-wider">Abgeschlossen</span>';
        document.getElementById('training-weeks-left').textContent = `Passed`;
        updateTrainingPhase(-1);
      }
    }
    
    document.getElementById('event-location').textContent = event.location || '—';
    document.getElementById('event-category-badge').textContent = event.category || 'Standard';

    // Distanzen
    const swim = event.swim || event.distances?.swim || '—';
    const bike = event.bike || event.distances?.bike || (event.distances?.roadBike ? `${event.distances.roadBike} + ${event.distances.mountainBike || ''}` : '—');
    const run = event.run || event.distances?.run || '—';

    document.getElementById('dist-swim').textContent = swim;
    document.getElementById('dist-bike').textContent = bike;
    document.getElementById('dist-run').textContent = run;

    // Beschreibung & Links
    document.getElementById('event-description').textContent = event.description || event.info || 'Keine Beschreibung verfügbar.';
    
    const webUrl = event.registerUrl || event.link || event.url || '#';
    const resultsUrl = event.resultsUrl || event.results || webUrl;

    document.getElementById('btn-website').href = webUrl;
    document.getElementById('btn-results').href = resultsUrl;

  } catch (error) {
    console.error("Fehler beim Laden des Events:", error);
  }
}

// Dynamische Steuerung der Trainingsphase
function updateTrainingPhase(weeksLeft) {
  const titleEl = document.getElementById('current-phase-title');
  const descEl = document.getElementById('current-phase-desc');
  const barEl = document.getElementById('training-progress-bar');

  if (weeksLeft > 16) {
    titleEl.textContent = "Base Phase";
    descEl.textContent = "Building fundamental aerobic endurance, strength, and movement economy for upcoming race prep.";
    barEl.style.width = "20%";
  } else if (weeksLeft > 8) {
    titleEl.textContent = "Build Phase";
    descEl.textContent = "Increasing intensity with race-specific intervals, threshold workouts, and brick sessions.";
    barEl.style.width = "40%";
  } else if (weeksLeft > 3) {
    titleEl.textContent = "Peak Phase";
    descEl.textContent = "Reaching maximum race fitness, testing race-day nutrition, and fine-tuning gear under load.";
    barEl.style.width = "60%";
  } else if (weeksLeft > 1) {
    titleEl.textContent = "Taper Phase";
    descEl.textContent = "Reducing volume to absorb training gains, restore glycogen, and fresh muscles for race day.";
    barEl.style.width = "80%";
  } else if (weeksLeft >= 0) {
    titleEl.textContent = "Race Prep";
    descEl.textContent = "Final gear checks, course recon, and mental prep. Stay rested and confident.";
    barEl.style.width = "100%";
  } else {
    titleEl.textContent = "Post Race / Recovery";
    descEl.textContent = "Focus on active recovery, injury prevention, and reflecting on race performance.";
    barEl.style.width = "100%";
  }
}

loadEventDetail();
