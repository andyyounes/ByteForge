// ByteForge — localStorage database layer
const BF = (() => {
  const P = 'byteforge_';

  function _get(k)    { try { return JSON.parse(localStorage.getItem(P+k)); } catch { return null; } }
  function _set(k, v) { localStorage.setItem(P+k, JSON.stringify(v)); return v; }

  function uid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
  }

  // ── Users ──────────────────────────────────────────────────────────────────
  function users()              { return _get('users') || []; }
  function userById(id)         { return users().find(u => u.id === id) || null; }
  function userByEmail(email)   { return users().find(u => u.email.toLowerCase() === email.toLowerCase()) || null; }

  function createUser({ name, email, password, role, grade = '' }) {
    if (userByEmail(email)) throw new Error('Email already registered');
    const u = { id: uid(), name, email, password: btoa(unescape(encodeURIComponent(password))), role, grade, xp: 0, level: 1, createdAt: Date.now() };
    _set('users', [...users(), u]);
    return u;
  }

  function updateUser(id, patch) {
    _set('users', users().map(u => u.id === id ? { ...u, ...patch } : u));
    return userById(id);
  }

  function checkPassword(email, password) {
    const u = userByEmail(email);
    if (!u) return null;
    return u.password === btoa(unescape(encodeURIComponent(password))) ? u : null;
  }

  // ── Session ────────────────────────────────────────────────────────────────
  function session()      { return _get('session'); }
  function setSession(u)  { _set('session', { id: u.id, name: u.name, email: u.email, role: u.role, grade: u.grade }); }
  function clearSession() { localStorage.removeItem(P+'session'); }

  // ── Classes ────────────────────────────────────────────────────────────────
  function classes()               { return _get('classes') || []; }
  function classById(id)           { return classes().find(c => c.id === id) || null; }
  function classesByTeacher(tid)   { return classes().filter(c => c.teacherId === tid); }
  function classesByStudent(sid)   { return classes().filter(c => (c.students||[]).includes(sid)); }

  // Generate an unambiguous 6-char join code (no 0/O/1/I/L confusion)
  function _genJoinCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // omit 0,1,I,L,O
    let code = '';
    const arr = new Uint8Array(6);
    crypto.getRandomValues(arr);
    arr.forEach(b => { code += chars[b % chars.length]; });
    return code;
  }

  function createClass({ name, teacherId, level, grade, description = '', curriculum = '' }) {
    const joinCode = _genJoinCode();
    const c = {
      id: uid(), name, teacherId, level, grade, curriculum,
      description, joinCode,
      students: [], units: [], resources: [],
      createdAt: Date.now()
    };
    _set('classes', [...classes(), c]);
    return c;
  }

  function updateClass(id, patch) {
    _set('classes', classes().map(c => c.id === id ? { ...c, ...patch } : c));
    return classById(id);
  }

  function joinClass(studentId, code) {
    const normalised = code.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
    if (!normalised) throw new Error('Please enter a join code');
    const c = classes().find(x => (x.joinCode || '').toUpperCase() === normalised);
    if (!c) throw new Error('Join code not found — double-check with your teacher (watch for O vs 0, I vs 1)');
    if ((c.students||[]).includes(studentId)) throw new Error('You\'re already enrolled in this class');
    updateClass(c.id, { students: [...(c.students||[]), studentId] });
    return classById(c.id);
  }

  // ── Resources (PDF / syllabus / books) ────────────────────────────────────
  function addResource(classId, { name, fileType, size, dataUrl, category = 'syllabus' }) {
    const c = classById(classId);
    if (!c) throw new Error('Class not found');
    const r = { id: uid(), name, fileType, size, dataUrl, category, uploadedAt: Date.now() };
    return updateClass(classId, { resources: [...(c.resources||[]), r] });
  }

  function removeResource(classId, resourceId) {
    const c = classById(classId);
    if (!c) throw new Error('Class not found');
    return updateClass(classId, { resources: (c.resources||[]).filter(r => r.id !== resourceId) });
  }

  // ── Syllabus Book & Chapters ──────────────────────────────────────────────
  function setSyllabusBook(classId, resourceId) {
    const c = classById(classId);
    if (!c) throw new Error('Class not found');
    const existing = c.syllabusBook || { chapters: [] };
    return updateClass(classId, { syllabusBook: { ...existing, resourceId } });
  }

  function clearSyllabusBook(classId) {
    return updateClass(classId, { syllabusBook: null });
  }

  function addChapter(classId, { title, pageStart, pageEnd, description = '' }) {
    const c = classById(classId);
    if (!c) throw new Error('Class not found');
    const sb = c.syllabusBook || { resourceId: null, chapters: [] };
    const chapter = {
      id: uid(), title, description,
      pageStart: Math.max(1, parseInt(pageStart) || 1),
      pageEnd:   Math.max(1, parseInt(pageEnd)   || 1),
      unlocked: false, unlockedAt: null,
      order: sb.chapters.length, createdAt: Date.now()
    };
    return updateClass(classId, { syllabusBook: { ...sb, chapters: [...sb.chapters, chapter] } });
  }

  function updateChapter(classId, chapterId, patch) {
    const c  = classById(classId);
    if (!c) throw new Error('Class not found');
    const sb = c.syllabusBook;
    if (!sb) throw new Error('No syllabus book set');
    return updateClass(classId, {
      syllabusBook: { ...sb, chapters: sb.chapters.map(ch => ch.id === chapterId ? { ...ch, ...patch } : ch) }
    });
  }

  function removeChapter(classId, chapterId) {
    const c  = classById(classId);
    if (!c) throw new Error('Class not found');
    const sb = c.syllabusBook;
    if (!sb) return c;
    return updateClass(classId, { syllabusBook: { ...sb, chapters: sb.chapters.filter(ch => ch.id !== chapterId) } });
  }

  function toggleChapterLock(classId, chapterId) {
    const c  = classById(classId);
    if (!c) throw new Error('Class not found');
    const sb = c.syllabusBook;
    if (!sb) throw new Error('No syllabus book set');
    const ch = sb.chapters.find(x => x.id === chapterId);
    if (!ch) throw new Error('Chapter not found');
    const unlocked = !ch.unlocked;
    const result = updateChapter(classId, chapterId, { unlocked, unlockedAt: unlocked ? Date.now() : null });
    // Notify all enrolled students when a chapter is unlocked
    if (unlocked) {
      (c.students||[]).forEach(sid => {
        addNotif(sid, { type:'unlock', icon:'🔓', text:`Chapter unlocked: "${ch.title}"`, sub: c.name, action:`lessons/chapter-view.html?classId=${classId}&chapterId=${chapterId}`, actionLabel:'Start Reading →' });
      });
    }
    return result;
  }

  function markChapterRead(studentId, chapterId, xpGain = 30) {
    const p = progress(studentId);
    const readChapters = p.readChapters || [];
    if (readChapters.includes(chapterId)) return p;
    _saveProgress(studentId, { ...p, readChapters: [...readChapters, chapterId] });
    if (xpGain > 0) addXP(studentId, xpGain);
    return progress(studentId);
  }

  // Track per-chapter exercise completions (separate from unit exercises)
  function completeChapterExercise(studentId, chapterId, exerciseId, xpGain = 50) {
    const p = progress(studentId);
    const key = 'chEx_' + chapterId;
    const done = p[key] || [];
    if (done.includes(exerciseId)) return p;
    const updated = { ...p, [key]: [...done, exerciseId] };
    _saveProgress(studentId, updated);
    if (xpGain > 0) addXP(studentId, xpGain);
    return progress(studentId);
  }

  function getChapterProgress(studentId, chapterId) {
    const p = progress(studentId);
    return { doneExercises: p['chEx_' + chapterId] || [], read: (p.readChapters || []).includes(chapterId) };
  }

  // Unlock requests: student asks teacher to unlock next chapter
  function requestChapterUnlock(classId, chapterId, studentId) {
    const c  = classById(classId);
    if (!c) throw new Error('Class not found');
    const sb = c.syllabusBook;
    if (!sb) throw new Error('No syllabus book');
    const ch = sb.chapters.find(x => x.id === chapterId);
    if (!ch) throw new Error('Chapter not found');
    const requests = ch.unlockRequests || [];
    if (requests.find(r => r.studentId === studentId && r.status === 'pending')) throw new Error('Request already sent');
    const newReq = { studentId, requestedAt: Date.now(), status: 'pending' };
    return updateChapter(classId, chapterId, { unlockRequests: [...requests, newReq] });
  }

  function resolveUnlockRequest(classId, chapterId, studentId, approved) {
    const c  = classById(classId);
    if (!c) throw new Error('Class not found');
    const sb = c.syllabusBook;
    if (!sb) throw new Error('No syllabus book');
    const ch = sb.chapters.find(x => x.id === chapterId);
    if (!ch) throw new Error('Chapter not found');
    const requests = (ch.unlockRequests || []).map(r =>
      r.studentId === studentId && r.status === 'pending'
        ? { ...r, status: approved ? 'approved' : 'denied', resolvedAt: Date.now() }
        : r
    );
    // If approved, also unlock the chapter for that student (individual unlocks)
    const indUnlocks = ch.individualUnlocks || [];
    const patch = { unlockRequests: requests };
    if (approved && !indUnlocks.includes(studentId)) patch.individualUnlocks = [...indUnlocks, studentId];
    const result = updateChapter(classId, chapterId, patch);
    // Notify the student of the decision
    addNotif(studentId, {
      type:        approved ? 'approve' : 'denied',
      icon:        approved ? '✅' : '⏳',
      text:        approved ? `Your request for "${ch.title}" was approved!` : `"${ch.title}" request was declined — keep practising!`,
      sub:         c.name,
      action:      approved ? `lessons/chapter-view.html?classId=${classId}&chapterId=${chapterId}` : null,
      actionLabel: approved ? 'Open Chapter →' : null,
    });
    return result;
  }

  // Check if a student can see a chapter (class-wide unlock OR individual unlock)
  function canStudentAccessChapter(ch, studentId) {
    if (!ch) return false;
    if (ch.unlocked) return true;
    return (ch.individualUnlocks || []).includes(studentId);
  }

  // Get all pending unlock requests across all chapters for a class
  function getPendingRequests(classId) {
    const c = classById(classId);
    if (!c || !c.syllabusBook) return [];
    const result = [];
    (c.syllabusBook.chapters || []).forEach(ch => {
      (ch.unlockRequests || []).filter(r => r.status === 'pending').forEach(r => {
        result.push({ classId, chapterId: ch.id, chapterTitle: ch.title, ...r });
      });
    });
    return result;
  }

  // ── Units ──────────────────────────────────────────────────────────────────
  function addUnit(classId, { title, description = '', deadline = null }) {
    const c = classById(classId);
    if (!c) throw new Error('Class not found');
    const unit = { id: uid(), title, description, deadline, order: (c.units||[]).length, lessons: [], exercises: [], createdAt: Date.now() };
    updateClass(classId, { units: [...(c.units||[]), unit] });
    // Notify enrolled students about the new unit
    (c.students||[]).forEach(sid => {
      addNotif(sid, { type:'new_unit', icon:'📚', text:`New unit available: "${title}"`, sub: c.name, action: null, actionLabel: null });
    });
    return classById(classId);
  }

  function updateUnit(classId, unitId, patch) {
    const c = classById(classId);
    const units = (c.units||[]).map(u => u.id === unitId ? { ...u, ...patch } : u);
    return updateClass(classId, { units });
  }

  // ── Lessons ────────────────────────────────────────────────────────────────
  function addLesson(classId, unitId, { title, type, content, order }) {
    const c = classById(classId);
    const lesson = { id: uid(), title, type, content, order: order ?? 999, createdAt: Date.now() };
    const units = (c.units||[]).map(u => u.id === unitId ? { ...u, lessons: [...(u.lessons||[]), lesson] } : u);
    return updateClass(classId, { units });
  }

  // ── Exercises ──────────────────────────────────────────────────────────────
  function addExercise(classId, unitId, ex) {
    const c = classById(classId);
    const exercise = { id: uid(), ...ex, createdAt: Date.now() };
    const units = (c.units||[]).map(u => u.id === unitId ? { ...u, exercises: [...(u.exercises||[]), exercise] } : u);
    updateClass(classId, { units });
    // Notify enrolled students about the new exercise
    const unit = (c.units||[]).find(u => u.id === unitId);
    if (unit) {
      const exType = (exercise.type||'').toLowerCase();
      const quizTypes  = ['quiz','mcq','multiple-choice','written','exam-style','short-answer'];
      const traceTypes = ['trace'];
      const actionUrl = quizTypes.includes(exType)
        ? `lessons/quiz.html?exerciseId=${exercise.id}&classId=${classId}`
        : traceTypes.includes(exType)
        ? `lessons/trace-table.html?exerciseId=${exercise.id}&classId=${classId}`
        : null;
      (c.students||[]).forEach(sid => {
        addNotif(sid, { type:'new_exercise', icon:'📝', text:`New exercise: "${exercise.title||ex.title}"`, sub:`${c.name} · ${unit.title}`, action: actionUrl, actionLabel: actionUrl ? 'Start →' : null });
      });
    }
    return classById(classId);
  }

  function updateExercise(classId, unitId, exId, patch) {
    const c = classById(classId);
    const units = (c.units||[]).map(u => u.id === unitId
      ? { ...u, exercises: (u.exercises||[]).map(e => e.id === exId ? { ...e, ...patch } : e) }
      : u);
    return updateClass(classId, { units });
  }

  // ── Progress ───────────────────────────────────────────────────────────────
  function progress(studentId) {
    return _get('prog_'+studentId) || { completedLessons: [], completedExercises: [], xp: 0, level: 1, streak: 0, lastActive: 0, attempts: [] };
  }

  function _saveProgress(studentId, p) { _set('prog_'+studentId, p); return p; }

  function addXP(studentId, amount) {
    const p = progress(studentId);
    const xp = p.xp + amount;
    const level = Math.max(1, Math.floor(Math.sqrt(xp / 80)) + 1);
    _saveProgress(studentId, { ...p, xp, level, lastActive: Date.now() });
    updateUser(studentId, { xp, level });
    return { xp, level, gained: amount };
  }

  function completeLesson(studentId, lessonId, xpGain = 20) {
    const p = progress(studentId);
    if (p.completedLessons.includes(lessonId)) return p;
    const updated = { ...p, completedLessons: [...p.completedLessons, lessonId] };
    _saveProgress(studentId, updated);
    if (xpGain > 0) addXP(studentId, xpGain);
    return progress(studentId);
  }

  function recordAttempt(studentId, exerciseId, { passed, score = 0, code = '', output = '' }) {
    const p = progress(studentId);
    const attempt = { exerciseId, passed, score, code, output, ts: Date.now() };
    const attempts = [...p.attempts.slice(-200), attempt];
    const alreadyDone = p.completedExercises.includes(exerciseId);
    const completedExercises = passed && !alreadyDone ? [...p.completedExercises, exerciseId] : p.completedExercises;
    _saveProgress(studentId, { ...p, attempts, completedExercises });
    if (passed && !alreadyDone) addXP(studentId, 50);
    return attempt;
  }

  function studentStats(studentId, classId) {
    const p = progress(studentId);
    const c = classById(classId);
    if (!c) return null;
    const totalLessons  = (c.units||[]).reduce((s,u) => s + (u.lessons||[]).length, 0);
    const totalExercises= (c.units||[]).reduce((s,u) => s + (u.exercises||[]).length, 0);
    const doneLessons   = p.completedLessons.filter(id => (c.units||[]).some(u=>(u.lessons||[]).some(l=>l.id===id))).length;
    const doneExercises = p.completedExercises.filter(id => (c.units||[]).some(u=>(u.exercises||[]).some(e=>e.id===id))).length;
    return { totalLessons, totalExercises, doneLessons, doneExercises, xp: p.xp, level: p.level };
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  // Stored as bf_notifs_<userId>: [{id, type, icon, text, sub, action, actionLabel, createdAt, seen}]
  function addNotif(userId, { type, icon, text, sub, action, actionLabel }) {
    const key = 'notifs_' + userId;
    const existing = _get(key) || [];
    const n = { id: uid(), type, icon, text, sub: sub||'', action: action||null, actionLabel: actionLabel||null, createdAt: Date.now(), seen: false };
    _set(key, [n, ...existing].slice(0, 60)); // newest first, cap at 60
    return n;
  }

  function getNotifs(userId) {
    return _get('notifs_' + userId) || [];
  }

  function markNotifSeen(userId, notifId) {
    const key = 'notifs_' + userId;
    _set(key, (_get(key)||[]).map(n => n.id === notifId ? { ...n, seen: true } : n));
  }

  function markAllNotifsSeen(userId) {
    const key = 'notifs_' + userId;
    _set(key, (_get(key)||[]).map(n => ({ ...n, seen: true })));
  }

  function getUnseenCount(userId) {
    return (_get('notifs_' + userId)||[]).filter(n => !n.seen).length;
  }

  // ── Seed helpers ──────────────────────────────────────────────────────────
  function _traceExIGCSE(classId, unitId) {
    addExercise(classId, unitId, {
      title: 'WHILE Loop Trace Table',
      type: 'trace',
      difficulty: 2,
      xpReward: 75,
      marks: 4,
      question: 'Complete the trace table for the pseudocode shown.\n\nInclude the initial values of x and count, then one row per iteration.',
      code: 'x ← 10\ncount ← 0\nWHILE x > 0\n  x ← x - 3\n  count ← count + 1\nENDWHILE\nOUTPUT count',
      columns: ['x', 'count'],
      correctTrace: [
        { x: '10', count: '0' },
        { x: '7',  count: '1' },
        { x: '4',  count: '2' },
        { x: '1',  count: '3' },
        { x: '-2', count: '4' },
      ],
      hints: [
        'Start with the initial values before the loop runs (x = 10, count = 0)',
        'The loop body runs as long as x > 0 — include the final row where x becomes negative',
      ],
    });
  }

  function _traceExAS(classId, unitId) {
    addExercise(classId, unitId, {
      title: 'Bubble Sort Pass — Trace Table [Paper 2]',
      type: 'trace',
      difficulty: 3,
      xpReward: 120,
      marks: 6,
      question: 'Complete the trace table for the bubble sort pseudocode when executed with arr ← [5, 2, 8] and n ← 3.\n\nShow the values of i, j, arr[j], arr[j+1] and whether a swap occurs on each comparison.',
      code: 'arr ← [5, 2, 8]\nn ← 3\nFOR i ← 1 TO n - 1\n  FOR j ← 1 TO n - i\n    IF arr[j] > arr[j+1] THEN\n      temp ← arr[j]\n      arr[j] ← arr[j+1]\n      arr[j+1] ← temp\n    ENDIF\n  NEXT j\nNEXT i',
      columns: ['i', 'j', 'arr[j]', 'arr[j+1]', 'Swap?'],
      correctTrace: [
        { i: '1', j: '1', 'arr[j]': '5', 'arr[j+1]': '2', 'Swap?': 'Yes' },
        { i: '1', j: '2', 'arr[j]': '5', 'arr[j+1]': '8', 'Swap?': 'No'  },
        { i: '2', j: '1', 'arr[j]': '2', 'arr[j+1]': '5', 'Swap?': 'No'  },
      ],
      hints: [
        'i goes from 1 to n-1 (outer loop), j goes from 1 to n-i (inner loop)',
        'After the first swap in pass 1, arr becomes [2, 5, 8] — use the updated values for the next comparison',
        'Write "Yes" or "No" in the Swap? column',
      ],
    });
  }

  // v2 migration: adds trace exercises to existing demo installs
  function _migrateV2() {
    if (_get('seeded_v2')) return;
    const igcse = classes().find(c => c.curriculum === 'igcse');
    if (igcse) {
      const algUnit = (igcse.units||[]).find(u => /algorithm/i.test(u.title));
      if (algUnit) _traceExIGCSE(igcse.id, algUnit.id);
    }
    const asLevel = classes().find(c => c.curriculum === 'as-level');
    if (asLevel) {
      const p2Unit = (asLevel.units||[]).find(u => /paper 2/i.test(u.title));
      if (p2Unit) _traceExAS(asLevel.id, p2Unit.id);
    }
    _set('seeded_v2', true);
  }

  // v3 migration: adds Grade 6, 7, 8 classes + demo students to existing installs
  function _migrateV3() {
    if (_get('seeded_v3')) return;
    const teacher = users().find(u => u.email === 'teacher@demo.com');
    if (!teacher) return;

    // ── Grade 6 class ──
    if (!classes().some(c => c.curriculum === 'grade6')) {
      let jamie = userByEmail('jamie@demo.com');
      if (!jamie) jamie = createUser({ name: 'Jamie Lee', email: 'jamie@demo.com', password: 'demo123', role: 'student', grade: 'Year 7 (Grade 7)' });
      const cg6 = createClass({ name: 'Grade 6 Computing', teacherId: teacher.id, level: 'beginner', grade: '6', curriculum: 'grade6', description: 'The Artist\'s Toolkit — pixels, turtle graphics, and patterns.' });
      updateClass(cg6.id, { students: [jamie.id] });
      addUnit(cg6.id, { title: 'Module 1 — Pixels & Colours', description: 'Understand pixels, RGB colour, and create your own pixel art.' });
      const g6u1 = classById(cg6.id).units[0].id;
      addLesson(cg6.id, g6u1, { title: 'Pixel Grid Editor', type: 'interactive', order: 0, content: { module: 'pixel-grid' } });
      addExercise(cg6.id, g6u1, { title: 'Pixel Art: Match the Emoji', type: 'grade6-pixel', difficulty: 1, xpReward: 50, description: 'Use the pixel grid editor to recreate the target emoji. Aim for 80% or better match.' });
      addExercise(cg6.id, g6u1, { title: 'Design Your Own Icon', type: 'grade6-pixel', difficulty: 1, xpReward: 50, description: 'Create your own 16×16 pixel art design — a character, object, or pattern of your choice.' });
      addUnit(cg6.id, { title: 'Module 2 — Turtle Graphics', description: 'Give directions to a virtual pen and draw shapes using code blocks.' });
      const g6u2 = classById(cg6.id).units[1].id;
      addLesson(cg6.id, g6u2, { title: 'Turtle Block Editor', type: 'interactive', order: 0, content: { module: 'blockly-turtle' } });
      addExercise(cg6.id, g6u2, { title: 'Draw a Square', type: 'grade6-turtle', difficulty: 1, xpReward: 25, description: 'Use turtle blocks to draw a square. Use the Repeat block to do it in fewer steps.' });
      addExercise(cg6.id, g6u2, { title: 'Pentagon with a Loop', type: 'grade6-turtle', difficulty: 2, xpReward: 35, description: 'Draw a five-sided shape using a Repeat block. You must use a loop — no copy-pasting moves.' });
      addExercise(cg6.id, g6u2, { title: 'Spiral Challenge', type: 'grade6-turtle', difficulty: 3, xpReward: 50, description: 'Create a spiral where each step is slightly longer than the last. Use a variable that grows inside the loop.' });
      addUnit(cg6.id, { title: 'Module 3 — Patterns & Repetition', description: 'Create repeating tile patterns using nested loops and variables.' });
      const g6u3 = classById(cg6.id).units[2].id;
      addLesson(cg6.id, g6u3, { title: 'Patterns with Nested Loops', type: 'interactive', order: 0, content: { module: 'grade6-patterns' } });
      addExercise(cg6.id, g6u3, { title: 'Dot Grid', type: 'grade6-patterns', difficulty: 1, xpReward: 40, description: 'Use nested repeat blocks to draw a 5×5 grid of circles.' });
      addExercise(cg6.id, g6u3, { title: 'Colour Fade', type: 'grade6-patterns', difficulty: 2, xpReward: 45, description: 'Use a variable that increments each iteration to create a colour gradient across a row of circles.' });
      addExercise(cg6.id, g6u3, { title: 'Tile Pattern', type: 'grade6-patterns', difficulty: 3, xpReward: 50, description: 'Build a tiled wallpaper — at least 4×4 repetitions of any shape — using two nested loops.' });
      addXP(jamie.id, 40);
    }

    // ── Grade 7 class — add student + units if empty ──
    const g7Class = classes().find(c => c.curriculum === 'grade7');
    if (g7Class && (g7Class.units || []).length === 0) {
      let sam = userByEmail('sam@demo.com');
      if (!sam) sam = createUser({ name: 'Sam Park', email: 'sam@demo.com', password: 'demo123', role: 'student', grade: 'Year 8 (Grade 8)' });
      updateClass(g7Class.id, { students: [...(g7Class.students || []), sam.id], description: 'The Game Maker — variables, decisions, and interactive programs.' });
      addUnit(g7Class.id, { title: 'Module 1 — Variables & State', description: 'Store and change values using variables. Control colour, size, and motion.' });
      const g7u1 = classById(g7Class.id).units[0].id;
      addLesson(g7Class.id, g7u1, { title: 'Variables in Blockly', type: 'interactive', order: 0, content: { module: 'grade7' } });
      addExercise(g7Class.id, g7u1, { title: 'Colour Square', type: 'grade7-blockly', difficulty: 1, xpReward: 30, description: 'Create r, g, b variables. Use them to set fill colour on a rectangle. Make three different colours.' });
      addExercise(g7Class.id, g7u1, { title: 'Growing Circle', type: 'grade7-blockly', difficulty: 1, xpReward: 35, description: 'Create a size variable and draw a circle using it as the radius. Try three different values.' });
      addUnit(g7Class.id, { title: 'Module 2 — Decisions (If / Else)', description: 'Make programs that react differently depending on conditions.' });
      const g7u2 = classById(g7Class.id).units[1].id;
      addExercise(g7Class.id, g7u2, { title: 'Traffic Light', type: 'grade7-blockly', difficulty: 2, xpReward: 40, description: 'Create a light variable (1, 2, or 3). Use if/else to draw the correct colour circle for each state.' });
      addExercise(g7Class.id, g7u2, { title: 'Big or Small', type: 'grade7-blockly', difficulty: 2, xpReward: 35, description: 'Use if/else to draw a big circle when a variable is > 50, and a small one otherwise.' });
      addUnit(g7Class.id, { title: 'Module 3 — Events & Interaction', description: 'Make programs that respond to mouse and keyboard input in real time.' });
      const g7u3 = classById(g7Class.id).units[2].id;
      addExercise(g7Class.id, g7u3, { title: 'Mouse Follower', type: 'grade7-blockly', difficulty: 2, xpReward: 45, description: 'Use the On Every Frame event to draw a circle that follows the mouse cursor.' });
      addExercise(g7Class.id, g7u3, { title: 'Move the Box', type: 'grade7-blockly', difficulty: 3, xpReward: 50, description: 'Create x and y variables. Use arrow key checks inside On Every Frame to move a rectangle.' });
      addXP(sam.id, 65);
    }

    // ── Grade 8 class ──
    if (!classes().some(c => c.curriculum === 'grade8')) {
      let priya = userByEmail('priya@demo.com');
      if (!priya) priya = createUser({ name: 'Priya Kumar', email: 'priya@demo.com', password: 'demo123', role: 'student', grade: 'Year 9 (Grade 9)' });
      const cg8 = createClass({ name: 'Grade 8 Computing', teacherId: teacher.id, level: 'intermediate', grade: '8', curriculum: 'grade8', description: 'The Systems Builder — functions, data, and how computers work.' });
      updateClass(cg8.id, { students: [priya.id] });
      addUnit(cg8.id, { title: 'Module 1 — Functions', description: 'Package reusable code into functions with parameters.' });
      const g8u1 = classById(cg8.id).units[0].id;
      addLesson(cg8.id, g8u1, { title: 'Python Canvas Editor', type: 'interactive', order: 0, content: { module: 'grade8' } });
      addExercise(cg8.id, g8u1, { title: 'Smiley Factory', type: 'grade8-python', difficulty: 1, xpReward: 40, description: 'Complete draw_smiley() by adding eyes and a mouth. Call it at least twice with different settings.' });
      addExercise(cg8.id, g8u1, { title: 'Color Grid', type: 'grade8-python', difficulty: 2, xpReward: 45, description: 'Define a colored_tile() function and call it to build a 3×2 grid of coloured squares.' });
      addUnit(cg8.id, { title: 'Module 2 — Lists & Data', description: 'Store multiple values in lists. Loop, sort, and display data.' });
      const g8u2 = classById(cg8.id).units[1].id;
      addExercise(cg8.id, g8u2, { title: 'Bar Chart', type: 'grade8-python', difficulty: 2, xpReward: 45, description: 'Loop through a temperatures list and draw a bar chart — taller bar for higher temperature.' });
      addExercise(cg8.id, g8u2, { title: 'Rainbow Row', type: 'grade8-python', difficulty: 2, xpReward: 40, description: 'Use a list of colours to draw a row of rectangles, one per colour.' });
      addExercise(cg8.id, g8u2, { title: 'Score Sorter', type: 'grade8-python', difficulty: 3, xpReward: 50, description: 'Sort a list of scores and display the top 5 as a labelled bar chart.' });
      addUnit(cg8.id, { title: 'Module 3 — How Computers Work', description: 'Binary, compression, and the CPU — explored through interactive widgets.' });
      const g8u3 = classById(cg8.id).units[2].id;
      addLesson(cg8.id, g8u3, { title: 'Binary Exploration', type: 'interactive', order: 0, content: { module: 'binary-cards' } });
      addLesson(cg8.id, g8u3, { title: 'Compression Demo', type: 'interactive', order: 1, content: { module: 'compression' } });
      addLesson(cg8.id, g8u3, { title: 'CPU Pipeline', type: 'interactive', order: 2, content: { module: 'cpu-pipeline' } });
      addExercise(cg8.id, g8u3, { title: 'Binary Number Challenge', type: 'binary-cards', difficulty: 1, xpReward: 50, description: 'Use the binary cards to convert decimal numbers to binary and back.' });
      addXP(priya.id, 85);
    }

    _set('seeded_v3', true);
  }

  // ── Seed data ──────────────────────────────────────────────────────────────
  function seed() {
    // migrations for existing installs — each wrapped so errors never block seeding
    try { _migrateV2(); } catch(e) { console.warn('[ByteForge] v2 migration skipped:', e.message); }
    try { _migrateV3(); } catch(e) { console.warn('[ByteForge] v3 migration skipped:', e.message); }

    if (_get('seeded')) return;

    const teacher = createUser({ name: 'Ms. Johnson', email: 'teacher@demo.com', password: 'demo123', role: 'teacher' });
    const s1 = createUser({ name: 'Alex Smith',  email: 'alex@demo.com',   password: 'demo123', role: 'student', grade: 'Year 10 (IGCSE)' });
    const s2 = createUser({ name: 'Maya Patel',  email: 'maya@demo.com',   password: 'demo123', role: 'student', grade: 'Year 10 (IGCSE)' });
    const s3 = createUser({ name: 'Tom Chen',    email: 'tom@demo.com',    password: 'demo123', role: 'student', grade: 'Year 12 (AS Level)' });
    const s4 = createUser({ name: 'Sara Obi',    email: 'sara@demo.com',   password: 'demo123', role: 'student', grade: 'Year 13 (A Level)' });
    const s5 = createUser({ name: 'Jamie Lee',   email: 'jamie@demo.com',  password: 'demo123', role: 'student', grade: 'Year 7 (Grade 7)' });
    const s6 = createUser({ name: 'Sam Park',    email: 'sam@demo.com',    password: 'demo123', role: 'student', grade: 'Year 8 (Grade 8)' });
    const s7 = createUser({ name: 'Priya Kumar', email: 'priya@demo.com',  password: 'demo123', role: 'student', grade: 'Year 9 (Grade 9)' });

    // ── Class G6: Grade 6 — The Artist's Toolkit ──
    const cg6 = createClass({ name: 'Grade 6 Computing', teacherId: teacher.id, level: 'beginner', grade: '6', curriculum: 'grade6', description: 'The Artist\'s Toolkit — pixels, turtle graphics, and patterns.' });
    updateClass(cg6.id, { students: [s5.id] });
    addUnit(cg6.id, { title: 'Module 1 — Pixels & Colours', description: 'Understand pixels, RGB colour, and create your own pixel art.' });
    const g6u1 = classById(cg6.id).units[0].id;
    addLesson(cg6.id, g6u1, { title: 'Pixel Grid Editor', type: 'interactive', order: 0, content: { module: 'pixel-grid' } });
    addExercise(cg6.id, g6u1, { title: 'Pixel Art: Match the Emoji', type: 'grade6-pixel', difficulty: 1, xpReward: 50, description: 'Use the pixel grid editor to recreate the target emoji. Aim for 80% or better match.' });
    addExercise(cg6.id, g6u1, { title: 'Design Your Own Icon', type: 'grade6-pixel', difficulty: 1, xpReward: 50, description: 'Create your own 16×16 pixel art design — a character, object, or pattern of your choice.' });
    addUnit(cg6.id, { title: 'Module 2 — Turtle Graphics', description: 'Give directions to a virtual pen and draw shapes using code blocks.' });
    const g6u2 = classById(cg6.id).units[1].id;
    addLesson(cg6.id, g6u2, { title: 'Turtle Block Editor', type: 'interactive', order: 0, content: { module: 'blockly-turtle' } });
    addExercise(cg6.id, g6u2, { title: 'Draw a Square', type: 'grade6-turtle', difficulty: 1, xpReward: 25, description: 'Use turtle blocks to draw a square. Use the Repeat block to do it in fewer steps.' });
    addExercise(cg6.id, g6u2, { title: 'Pentagon with a Loop', type: 'grade6-turtle', difficulty: 2, xpReward: 35, description: 'Draw a five-sided shape using a Repeat block. You must use a loop — no copy-pasting moves.' });
    addExercise(cg6.id, g6u2, { title: 'Spiral Challenge', type: 'grade6-turtle', difficulty: 3, xpReward: 50, description: 'Create a spiral where each step is slightly longer than the last. Use a variable that grows inside the loop.' });
    addUnit(cg6.id, { title: 'Module 3 — Patterns & Repetition', description: 'Create repeating tile patterns using nested loops and variables.' });
    const g6u3 = classById(cg6.id).units[2].id;
    addLesson(cg6.id, g6u3, { title: 'Patterns with Nested Loops', type: 'interactive', order: 0, content: { module: 'grade6-patterns' } });
    addExercise(cg6.id, g6u3, { title: 'Dot Grid', type: 'grade6-patterns', difficulty: 1, xpReward: 40, description: 'Use nested repeat blocks to draw a 5×5 grid of circles.' });
    addExercise(cg6.id, g6u3, { title: 'Colour Fade', type: 'grade6-patterns', difficulty: 2, xpReward: 45, description: 'Use a variable that increments each iteration to create a colour gradient across a row of circles.' });
    addExercise(cg6.id, g6u3, { title: 'Tile Pattern', type: 'grade6-patterns', difficulty: 3, xpReward: 50, description: 'Build a tiled wallpaper — at least 4×4 repetitions of any shape — using two nested loops.' });

    // ── Class G7: Grade 7 — The Game Maker ──
    const c0 = createClass({
      name: 'Grade 7 Computing',
      teacherId: teacher.id, level: 'beginner', grade: '7',
      curriculum: 'grade7',
      description: 'The Game Maker — variables, decisions, and interactive programs.'
    });
    updateClass(c0.id, { students: [s6.id] });
    addUnit(c0.id, { title: 'Module 1 — Variables & State', description: 'Store and change values using variables. Control colour, size, and motion.' });
    const g7u1 = classById(c0.id).units[0].id;
    addLesson(c0.id, g7u1, { title: 'Variables in Blockly', type: 'interactive', order: 0, content: { module: 'grade7' } });
    addExercise(c0.id, g7u1, { title: 'Colour Square', type: 'grade7-blockly', difficulty: 1, xpReward: 30, description: 'Create r, g, b variables. Use them to set fill colour on a rectangle. Make three different colours.' });
    addExercise(c0.id, g7u1, { title: 'Growing Circle', type: 'grade7-blockly', difficulty: 1, xpReward: 35, description: 'Create a size variable and draw a circle using it as the radius. Try three different values.' });
    addUnit(c0.id, { title: 'Module 2 — Decisions (If / Else)', description: 'Make programs that react differently depending on conditions.' });
    const g7u2 = classById(c0.id).units[1].id;
    addExercise(c0.id, g7u2, { title: 'Traffic Light', type: 'grade7-blockly', difficulty: 2, xpReward: 40, description: 'Create a light variable (1, 2, or 3). Use if/else to draw the correct colour circle for each state.' });
    addExercise(c0.id, g7u2, { title: 'Big or Small', type: 'grade7-blockly', difficulty: 2, xpReward: 35, description: 'Use if/else to draw a big circle when a variable is > 50, and a small one otherwise.' });
    addUnit(c0.id, { title: 'Module 3 — Events & Interaction', description: 'Make programs that respond to mouse and keyboard input in real time.' });
    const g7u3 = classById(c0.id).units[2].id;
    addExercise(c0.id, g7u3, { title: 'Mouse Follower', type: 'grade7-blockly', difficulty: 2, xpReward: 45, description: 'Use the On Every Frame event to draw a circle that follows the mouse cursor.' });
    addExercise(c0.id, g7u3, { title: 'Move the Box', type: 'grade7-blockly', difficulty: 3, xpReward: 50, description: 'Create x and y variables. Use arrow key checks inside On Every Frame to move a rectangle.' });

    // ── Class 1: IGCSE ──
    const c1 = createClass({
      name: 'IGCSE Computer Science – Y10A',
      teacherId: teacher.id, level: 'beginner', grade: '10', // Use 'beginner' for level, '10' for grade
      curriculum: 'igcse',
      description: 'Cambridge IGCSE Computer Science (0478). Covers theory, algorithms and Python basics.'
    });
    updateClass(c1.id, { students: [s1.id, s2.id] });

    const u1id = classById(c1.id).units.length === 0
      ? (addUnit(c1.id, { title: 'Chapter 3 — Data Representation', description: 'Binary, hexadecimal, ASCII and data types.', deadline: null }), classById(c1.id).units[0].id)
      : classById(c1.id).units[0].id;
    addLesson(c1.id, u1id, { title: 'What is Binary?', type: 'text', order: 0, content: { body: '<p>Binary is a base-2 number system using only <strong>0</strong> and <strong>1</strong>. Computers use binary because transistors can be either off (0) or on (1).</p><h3>Place Values</h3><p>Each position represents a power of 2: 128, 64, 32, 16, 8, 4, 2, 1.</p><p>Example: 10101101 = 128+32+8+4+1 = <strong>173</strong></p>' } });
    addLesson(c1.id, u1id, { title: 'Binary Cards Game', type: 'interactive', order: 1, content: { module: 'binary-cards' } });
    addExercise(c1.id, u1id, { title: 'Decimal → Binary', type: 'binary-cards', difficulty: 1, xpReward: 50, description: 'Convert decimal numbers to 8-bit binary.' });
    addExercise(c1.id, u1id, { title: 'Hexadecimal Conversion', type: 'quiz', difficulty: 2, xpReward: 75, description: 'Convert between hex, binary and decimal.', questionText: 'Convert the hexadecimal value A3 to denary.\n\nShow your working.' });

    addUnit(c1.id, { title: 'Chapter 7 — Algorithms', description: 'Flowcharts, pseudocode and searching algorithms.' });
    const u2id = classById(c1.id).units[1].id;
    addLesson(c1.id, u2id, { title: 'Pseudocode Fundamentals', type: 'interactive', order: 0, content: { module: 'pseudocode' } });
    addExercise(c1.id, u2id, { title: 'Trace a Bubble Sort', type: 'pseudocode', difficulty: 3, xpReward: 100, description: 'Trace through a bubble sort algorithm with the list [5, 2, 8, 1, 9]. Show each pass.', starterCode: 'DECLARE arr : ARRAY[1:5] OF INTEGER\n' });
    _traceExIGCSE(c1.id, u2id);

    // ── Class 2: AS Level ──
    const c2 = createClass({
      name: 'AS Level Computer Science 2025',
      teacherId: teacher.id, level: 'intermediate', grade: '12', // Use 'intermediate' for level, '12' for grade
      curriculum: 'as-level',
      description: 'Cambridge AS Level Computer Science (9618). Paper 1 theory + Paper 2 problem solving.'
    });
    updateClass(c2.id, { students: [s3.id] });

    addUnit(c2.id, { title: 'Paper 2 — Pseudocode & Algorithms', description: 'Cambridge pseudocode standard, algorithm design and trace tables.' });
    const as1id = classById(c2.id).units[0].id;
    addLesson(c2.id, as1id, { title: 'Pseudocode Sandbox', type: 'interactive', order: 0, content: { module: 'pseudocode' } });
    addExercise(c2.id, as1id, { title: 'Write a Bubble Sort [Paper 2 Style]', type: 'pseudocode', difficulty: 3, xpReward: 100, description: 'Implement bubble sort in Cambridge pseudocode. Your algorithm should sort an array of n integers in ascending order.', starterCode: 'PROCEDURE BubbleSort(BYREF arr : ARRAY OF INTEGER, n : INTEGER)\n  // Write your pseudocode here\nENDPROCEDURE\n', marks: 6 });
    addExercise(c2.id, as1id, { title: 'Recursion Trace Table [Paper 2 Style]', type: 'pseudocode', difficulty: 4, xpReward: 150, description: 'Complete a trace table for the recursive function shown. Show the value of all variables at each step.', marks: 4 });
    _traceExAS(c2.id, as1id);

    addUnit(c2.id, { title: 'Paper 1 — Data Types & Structures', description: 'Primitive types, arrays, records, stacks and queues.' });
    const as2id = classById(c2.id).units[1].id;
    addExercise(c2.id, as2id, { title: 'Stack Implementation', type: 'pseudocode', difficulty: 3, xpReward: 120, description: 'Write pseudocode for a stack using an array. Include PUSH, POP and ISEMPTY operations.' });

    // ── Class 3: A Level ──
    const c3 = createClass({
      name: 'A Level Computer Science 2025',
      teacherId: teacher.id, level: 'advanced', grade: '13', // Use 'advanced' for level, '13' for grade
      curriculum: 'a-level',
      description: 'Cambridge A Level Computer Science (9618). Advanced algorithms, OOP, and Paper 3 project.'
    });
    updateClass(c3.id, { students: [s4.id] });

    addUnit(c3.id, { title: 'Advanced Data Structures — Trees & Graphs', description: 'Binary trees, BST, graph traversal algorithms.' });
    const al1id = classById(c3.id).units[0].id;
    addLesson(c3.id, al1id, { title: 'Algorithm Visualiser', type: 'interactive', order: 0, content: { module: 'algo-viz' } });
    addExercise(c3.id, al1id, { title: 'BST Insertion & Traversal [Paper 2]', type: 'pseudocode', difficulty: 4, xpReward: 150, description: 'Write pseudocode to insert a node into a Binary Search Tree and perform an in-order traversal.', marks: 8 });
    addExercise(c3.id, al1id, { title: 'Dijkstra\'s Algorithm Trace [Paper 2]', type: 'pseudocode', difficulty: 5, xpReward: 200, description: 'Apply Dijkstra\'s shortest path algorithm to the given weighted graph. Show the working table.', marks: 10 });

    // ── Class G8: Grade 8 — The Systems Builder ──
    const cg8 = createClass({ name: 'Grade 8 Computing', teacherId: teacher.id, level: 'intermediate', grade: '8', curriculum: 'grade8', description: 'The Systems Builder — functions, data, and how computers work.' });
    updateClass(cg8.id, { students: [s7.id] });
    addUnit(cg8.id, { title: 'Module 1 — Functions', description: 'Package reusable code into functions with parameters.' });
    const g8u1 = classById(cg8.id).units[0].id;
    addLesson(cg8.id, g8u1, { title: 'Python Canvas Editor', type: 'interactive', order: 0, content: { module: 'grade8' } });
    addExercise(cg8.id, g8u1, { title: 'Smiley Factory', type: 'grade8-python', difficulty: 1, xpReward: 40, description: 'Complete draw_smiley() by adding eyes and a mouth. Call it at least twice with different settings.' });
    addExercise(cg8.id, g8u1, { title: 'Color Grid', type: 'grade8-python', difficulty: 2, xpReward: 45, description: 'Define a colored_tile() function and call it to build a 3×2 grid of coloured squares.' });
    addUnit(cg8.id, { title: 'Module 2 — Lists & Data', description: 'Store multiple values in lists. Loop, sort, and display data.' });
    const g8u2 = classById(cg8.id).units[1].id;
    addExercise(cg8.id, g8u2, { title: 'Bar Chart', type: 'grade8-python', difficulty: 2, xpReward: 45, description: 'Loop through a temperatures list and draw a bar chart — taller bar for higher temperature.' });
    addExercise(cg8.id, g8u2, { title: 'Rainbow Row', type: 'grade8-python', difficulty: 2, xpReward: 40, description: 'Use a list of colours to draw a row of rectangles, one per colour.' });
    addExercise(cg8.id, g8u2, { title: 'Score Sorter', type: 'grade8-python', difficulty: 3, xpReward: 50, description: 'Sort a list of scores and display the top 5 as a labelled bar chart.' });
    addUnit(cg8.id, { title: 'Module 3 — How Computers Work', description: 'Binary, compression, and the CPU — explored through interactive widgets.' });
    const g8u3 = classById(cg8.id).units[2].id;
    addLesson(cg8.id, g8u3, { title: 'Binary Exploration', type: 'interactive', order: 0, content: { module: 'binary-cards' } });
    addLesson(cg8.id, g8u3, { title: 'Compression Demo', type: 'interactive', order: 1, content: { module: 'compression' } });
    addLesson(cg8.id, g8u3, { title: 'CPU Pipeline', type: 'interactive', order: 2, content: { module: 'cpu-pipeline' } });
    addExercise(cg8.id, g8u3, { title: 'Binary Number Challenge', type: 'binary-cards', difficulty: 1, xpReward: 50, description: 'Use the binary cards to convert decimal numbers to binary and back.' });

    // XP for demo students
    addXP(s1.id, 320);
    addXP(s2.id, 180);
    addXP(s3.id, 550);
    addXP(s4.id, 890);
    addXP(s5.id, 40);
    addXP(s6.id, 65);
    addXP(s7.id, 85);

    _set('seeded', true);
    _set('seeded_v2', true); // mark v2 migration as already applied
    _set('seeded_v3', true); // mark v3 migration as already applied
  }

  return {
    uid, _get, _set,
    users, userById, userByEmail, createUser, updateUser, checkPassword,
    session, setSession, clearSession,
    classes, classById, classesByTeacher, classesByStudent,
    createClass, updateClass, joinClass,
    addResource, removeResource,
    setSyllabusBook, clearSyllabusBook,
    addChapter, updateChapter, removeChapter, toggleChapterLock,
    markChapterRead, completeChapterExercise, getChapterProgress,
    requestChapterUnlock, resolveUnlockRequest, canStudentAccessChapter, getPendingRequests,
    addUnit, updateUnit, addLesson, addExercise, updateExercise,
    progress, addXP, completeLesson, recordAttempt, studentStats,
    addNotif, getNotifs, markNotifSeen, markAllNotifsSeen, getUnseenCount,
    seed
  };
})();
