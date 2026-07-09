// ByteForge — Adaptive Engine (BFA global)
// Depends on: db.js (BF), concepts.js (BFC), mastery.js (BFM)
window.BFA = (() => {

  // ── Suggest next 4 concepts to study ────────────────────────────
  function suggestNext(studentId, limit = 4) {
    const m = BFM.getMastery(studentId);
    const c = m.concepts;

    // Priority 1: practicing (reinforce nearly-mastered)
    const practicing = BFC.CONCEPTS
      .filter(concept => c[concept.id]?.status === 'practicing')
      .sort((a, b) => (c[b.id].masteryScore - c[a.id].masteryScore)); // closest to mastered first

    // Priority 2: started (continue in-progress)
    const started = BFC.CONCEPTS
      .filter(concept => c[concept.id]?.status === 'started')
      .sort((a,b) => a.difficulty - b.difficulty);

    // Priority 3: available (lowest difficulty first)
    const available = BFC.CONCEPTS
      .filter(concept => c[concept.id]?.status === 'available')
      .sort((a,b) => a.difficulty - b.difficulty || a.tier - b.tier);

    const combined = [...practicing, ...started, ...available];
    return combined.slice(0, limit).map(concept => ({
      concept,
      mastery: c[concept.id],
      reason: c[concept.id]?.status === 'practicing'
        ? `${c[concept.id].masteryScore}% mastered — keep going!`
        : c[concept.id]?.status === 'started'
        ? 'Continue where you left off'
        : `Unlocked — ${concept.estimatedMinutes} min`,
    }));
  }

  // ── Detect weak areas ────────────────────────────────────────────
  function detectWeaknesses(studentId) {
    const { weakConcepts } = BFM.getStudentSummary(studentId);
    return weakConcepts.slice(0, 3);
  }

  // ── Daily challenge ───────────────────────────────────────────────
  function getDailyChallenge(studentId) {
    const today   = new Date().toISOString().slice(0, 10);
    const stored  = BF._get('daily_' + studentId);
    if (stored?.date === today) return stored;

    // Pick concept: prefer weak practicing, else available
    const suggestions = suggestNext(studentId, 8);
    const pick = suggestions[0]?.concept || BFC.CONCEPTS[0];

    const challenge = {
      date: today,
      conceptId: pick.id,
      conceptName: pick.name,
      conceptIcon: pick.icon,
      lessonUrl: pick.lessonUrl,
      xpReward: 75,
      completed: false,
    };
    BF._set('daily_' + studentId, challenge);
    return challenge;
  }

  function completeDailyChallenge(studentId) {
    const c = getDailyChallenge(studentId);
    if (c.completed) return c;
    c.completed = true;
    BF._set('daily_' + studentId, c);
    BF.addXP(studentId, c.xpReward);
    updateStreak(studentId);
    return c;
  }

  // ── Streak management ────────────────────────────────────────────
  function updateStreak(studentId) {
    const user = BF.userById(studentId);
    if (!user) return;
    const today     = new Date().toISOString().slice(0, 10);
    const lastActive= user.lastActiveDate || '';
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    let streak = user.streak || 0;
    let longest= user.longestStreak || 0;

    if (lastActive === today) {
      // Already updated today — no change
    } else if (lastActive === yesterday) {
      streak++;
    } else {
      streak = 1; // reset
    }
    longest = Math.max(longest, streak);
    BF.updateUser(studentId, { streak, longestStreak: longest, lastActiveDate: today });
    return streak;
  }

  // ── Pathway progress ─────────────────────────────────────────────
  function pathwayProgress(studentId) {
    const m = BFM.getMastery(studentId);
    return BFC.PATHWAYS.map(p => {
      const total   = p.conceptIds.length;
      const mastered= p.conceptIds.filter(id => m.concepts[id]?.status === 'mastered').length;
      const started = p.conceptIds.filter(id => ['started','practicing','mastered'].includes(m.concepts[id]?.status)).length;
      const pct     = total > 0 ? Math.round(mastered / total * 100) : 0;
      return { pathway: p, total, mastered, started, pct };
    });
  }

  // ── Achievement checker ──────────────────────────────────────────
  function checkAchievements(studentId) {
    const m = BFM.getMastery(studentId);
    const u = BF.userById(studentId);
    if (!u) return [];

    const stored    = BF._get('achievements_' + studentId) || { unlocked: [] };
    const unlockedIds = new Set(stored.unlocked.map(a => a.id));
    const newlyUnlocked = [];

    BFC.ACHIEVEMENTS.forEach(ach => {
      if (!unlockedIds.has(ach.id)) {
        try {
          if (ach.check(m, u)) {
            stored.unlocked.push({ id: ach.id, unlockedAt: Date.now() });
            unlockedIds.add(ach.id);
            newlyUnlocked.push(ach);
            if (ach.xp > 0) BF.addXP(studentId, ach.xp);
          }
        } catch(e) { /* skip */ }
      }
    });

    if (newlyUnlocked.length) BF._set('achievements_' + studentId, stored);
    return newlyUnlocked;
  }

  function getAchievements(studentId) {
    return BF._get('achievements_' + studentId) || { unlocked: [] };
  }

  // ── Placement simulation (seed some mastery for demo users) ──────
  function seedDemoMastery() {
    if (BF._get('mastery_seeded')) return;
    const s1 = BF.userByEmail('alex@demo.com');
    const s2 = BF.userByEmail('maya@demo.com');
    const s3 = BF.userByEmail('tom@demo.com');
    if (!s1 || !s2 || !s3) return;

    // Alex — strong on numbers, weak on algorithms
    _seedConceptsForUser(s1.id, ['computer-basics','input-output','decimal-system','binary-intro','binary-to-decimal','decimal-to-binary','binary-addition'], 'mastered');
    _seedConceptsForUser(s1.id, ['hex-intro','ascii-unicode','flowchart-basics','flowchart-decisions'], 'practicing');
    BFM.recalculateAvailability(s1.id);

    // Maya — visual learner, just starting
    _seedConceptsForUser(s2.id, ['computer-basics','input-output','decimal-system','binary-intro','flowchart-basics','blockly-intro'], 'mastered');
    _seedConceptsForUser(s2.id, ['binary-to-decimal','decimal-to-binary','blockly-loops'], 'practicing');
    BFM.recalculateAvailability(s2.id);

    // Tom — AS level, advanced
    _seedConceptsForUser(s3.id, ['computer-basics','input-output','decimal-system','binary-intro','binary-to-decimal','decimal-to-binary','binary-addition','twos-complement','hex-intro','hex-binary','hex-colors','ascii-unicode','logic-gates','logic-circuits','flowchart-basics','flowchart-decisions','pseudocode-intro','pseudocode-loops','pseudocode-arrays','search-linear','python-intro','python-loops','html-css-basics'], 'mastered');
    _seedConceptsForUser(s3.id, ['search-binary','sort-bubble','data-structures-intro','python-functions','javascript-basics'], 'practicing');
    BFM.recalculateAvailability(s3.id);

    // Update streaks for demo
    BF.updateUser(s1.id, { streak: 5, longestStreak: 12, lastActiveDate: new Date().toISOString().slice(0,10) });
    BF.updateUser(s2.id, { streak: 2, longestStreak: 4,  lastActiveDate: new Date().toISOString().slice(0,10) });
    BF.updateUser(s3.id, { streak: 14, longestStreak:21, lastActiveDate: new Date().toISOString().slice(0,10) });

    // Check achievements for demo users
    [s1.id, s2.id, s3.id].forEach(id => checkAchievements(id));

    BF._set('mastery_seeded', true);
  }

  function _seedConceptsForUser(studentId, conceptIds, status) {
    const m = BFM.getMastery(studentId);
    conceptIds.forEach(id => {
      if (!m.concepts[id]) return;
      if (status === 'mastered') {
        m.concepts[id] = { masteryScore:88, status:'mastered', attempts:6, correctAttempts:5, accuracyHistory:[1,1,0,1,1,1,1,0,1,1], weaknesses:[], timeSpentMs:1800000, lastPracticed:Date.now()-86400000*2 };
      } else if (status === 'practicing') {
        m.concepts[id] = { masteryScore:55, status:'practicing', attempts:3, correctAttempts:2, accuracyHistory:[0,1,1], weaknesses:[], timeSpentMs:900000, lastPracticed:Date.now()-86400000 };
      }
    });
    BF._set('mastery_' + studentId, m);
  }

  return {
    suggestNext, detectWeaknesses, getDailyChallenge, completeDailyChallenge,
    updateStreak, pathwayProgress, checkAchievements, getAchievements,
    seedDemoMastery,
  };
})();
