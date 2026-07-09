// ByteForge — Mastery Engine (BFM global)
// Depends on: db.js (BF), concepts.js (BFC)
window.BFM = (() => {

  const KEY = sid => 'mastery_' + sid;

  // ── Storage ──────────────────────────────────────────────────────
  function getMastery(studentId) {
    let m = BF._get(KEY(studentId));
    if (!m) m = _initMastery(studentId);
    return m;
  }

  function _initMastery(studentId) {
    const m = { studentId, concepts: {}, lastUpdated: Date.now() };
    // Initialise all 42 concepts
    BFC.CONCEPTS.forEach(c => {
      m.concepts[c.id] = { masteryScore:0, status:'locked', attempts:0, correctAttempts:0, accuracyHistory:[], weaknesses:[], timeSpentMs:0, lastPracticed:0 };
    });
    // Unlock tier-0 concepts (no prereqs)
    BFC.CONCEPTS.filter(c => c.prerequisites.length === 0).forEach(c => {
      m.concepts[c.id].status = 'available';
    });
    BF._set(KEY(studentId), m);
    return m;
  }

  function _save(studentId, m) {
    m.lastUpdated = Date.now();
    BF._set(KEY(studentId), m);
  }

  function getConceptMastery(studentId, conceptId) {
    return getMastery(studentId).concepts[conceptId] || null;
  }

  // ── Record attempt ────────────────────────────────────────────────
  // correct: boolean, timeMs: number, weaknessTags: string[]
  function recordConceptAttempt(studentId, conceptId, { correct, timeMs = 0, weaknessTags = [] }) {
    const m  = getMastery(studentId);
    const cm = m.concepts[conceptId];
    if (!cm) return null;

    // Update stats
    cm.attempts++;
    if (correct) cm.correctAttempts++;
    cm.accuracyHistory = [...cm.accuracyHistory.slice(-19), correct ? 1 : 0];
    cm.timeSpentMs += timeMs;
    cm.lastPracticed = Date.now();
    if (weaknessTags.length) {
      weaknessTags.forEach(t => { if (!cm.weaknesses.includes(t)) cm.weaknesses.push(t); });
    }
    if (correct) {
      // Decay weaknesses on correct answers
      cm.weaknesses = cm.weaknesses.slice(0, Math.max(0, cm.weaknesses.length - 1));
    }

    // Recalculate mastery score
    const recent = cm.accuracyHistory.slice(-10);
    const recentAccuracy = recent.length ? recent.reduce((a,b)=>a+b,0)/recent.length : 0;
    const attemptBonus = cm.attempts >= 5 ? 10 : cm.attempts >= 3 ? 5 : 0;
    cm.masteryScore = Math.min(100, Math.round(recentAccuracy * 80 + (correct ? 5 : 0) + attemptBonus));

    // Determine status
    if (cm.masteryScore >= 80) cm.status = 'mastered';
    else if (cm.masteryScore >= 40) cm.status = 'practicing';
    else cm.status = 'started';

    // Unlock newly available concepts
    const newlyAvailable = _refreshAvailability(m);
    _save(studentId, m);

    // Also update legacy BF progress for XP
    if (correct) BF.addXP(studentId, cm.masteryScore >= 80 && cm.attempts === Math.ceil(cm.accuracyHistory.length * 0.8) ? 50 : 10);

    return { conceptMastery: cm, newlyAvailable };
  }

  // ── Availability refresh ──────────────────────────────────────────
  function _refreshAvailability(m) {
    // Set of concept IDs at 'practicing' or 'mastered' — counts as "met" for prerequisites
    const unlockedSet = new Set(
      Object.entries(m.concepts)
        .filter(([,v]) => v.status === 'mastered' || v.status === 'practicing')
        .map(([k]) => k)
    );
    const newlyAvailable = [];
    BFC.CONCEPTS.forEach(c => {
      const cm = m.concepts[c.id];
      if (cm && cm.status === 'locked') {
        if (BFC.prereqsMet(c.id, unlockedSet)) {
          cm.status = 'available';
          newlyAvailable.push(c.id);
        }
      }
    });
    return newlyAvailable;
  }

  function recalculateAvailability(studentId) {
    const m = getMastery(studentId);
    const newly = _refreshAvailability(m);
    _save(studentId, m);
    return newly;
  }

  // ── Mastery summary helpers ───────────────────────────────────────
  function getMasteryLevel(score) {
    if (score >= 80) return 'mastered';
    if (score >= 40) return 'practicing';
    if (score > 0)   return 'started';
    return 'available';
  }

  function statusColor(status) {
    return { locked:'#1a1e35', available:'#1e3a5f', started:'#5c3000', practicing:'#4d3b00', mastered:'#0f3320' }[status] || '#1a1e35';
  }

  function statusBorderColor(status) {
    return { locked:'#2a2f4a', available:'#3b82f6', started:'#f97316', practicing:'#eab308', mastered:'#22c55e' }[status] || '#2a2f4a';
  }

  // Summary for a student across all concepts
  function getStudentSummary(studentId) {
    const m = getMastery(studentId);
    const counts = { locked:0, available:0, started:0, practicing:0, mastered:0 };
    const weakConcepts = [];
    Object.entries(m.concepts).forEach(([id, cm]) => {
      counts[cm.status] = (counts[cm.status]||0) + 1;
      if ((cm.status === 'practicing' || cm.status === 'started') && cm.attempts >= 2) {
        const acc = cm.accuracyHistory.slice(-5).reduce((a,b)=>a+b,0) / Math.max(1, Math.min(5, cm.accuracyHistory.length));
        if (acc < 0.5) weakConcepts.push({ id, concept: BFC.conceptById(id), accuracy: acc, ...cm });
      }
    });
    return { counts, weakConcepts, mastery: m };
  }

  // Per-concept mastery for a class (for teacher heatmap)
  function getClassMastery(classId) {
    const cls = BF.classById(classId);
    if (!cls) return {};
    const result = {};
    (cls.students||[]).forEach(sid => {
      result[sid] = getMastery(sid);
    });
    return result;
  }

  return {
    getMastery, getConceptMastery, recordConceptAttempt, recalculateAvailability,
    getMasteryLevel, statusColor, statusBorderColor, getStudentSummary, getClassMastery,
  };
})();
