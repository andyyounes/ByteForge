// ByteForge — Concept Graph, Pathways & Achievements (BFC global)
window.BFC = (() => {

  // ─────────────────────────────────────────────────────────────────
  //  CONCEPTS  (42 total)
  //  tier    : 0 = foundation … 8 = expert (computed from prereqs)
  //  xGroup  : 0-4 (left→right within tier for layout)
  // ─────────────────────────────────────────────────────────────────
  const CONCEPTS = [
    // ── TIER 0 — Foundation ─────────────────────────────────────────
    { id:'computer-basics',   name:'What is a Computer?',      icon:'💻', color:'#06b6d4', tier:0, xGroup:0, prerequisites:[], difficulty:1, gradeMin:7,  estimatedMinutes:15, learningModes:['text'],                    tags:['foundations','hardware'],  lessonUrl:'lessons/ide.html' },
    { id:'input-output',      name:'Input, Output & Storage',  icon:'💾', color:'#06b6d4', tier:0, xGroup:1, prerequisites:[], difficulty:1, gradeMin:7,  estimatedMinutes:15, learningModes:['text'],                    tags:['foundations','hardware'],  lessonUrl:'lessons/ide.html' },
    { id:'decimal-system',    name:'The Decimal System',       icon:'🔟', color:'#3b82f6', tier:0, xGroup:2, prerequisites:[], difficulty:1, gradeMin:7,  estimatedMinutes:15, learningModes:['text'],                    tags:['numbers','foundations'],   lessonUrl:'lessons/binary-cards.html' },
    { id:'binary-intro',      name:'Introduction to Binary',   icon:'⚫', color:'#3b82f6', tier:0, xGroup:3, prerequisites:[], difficulty:1, gradeMin:7,  estimatedMinutes:20, learningModes:['text','binary-cards'],     tags:['numbers','foundations'],   lessonUrl:'lessons/binary-cards.html' },

    // ── TIER 1 ───────────────────────────────────────────────────────
    { id:'secondary-storage', name:'Secondary Storage',        icon:'📀', color:'#06b6d4', tier:1, xGroup:0, prerequisites:['computer-basics'],                     difficulty:1, gradeMin:8, estimatedMinutes:20, learningModes:['text'],                    tags:['hardware'],                lessonUrl:'lessons/ide.html' },
    { id:'networking-basics', name:'Network Basics',           icon:'🌐', color:'#06b6d4', tier:1, xGroup:1, prerequisites:['computer-basics'],                     difficulty:2, gradeMin:9, estimatedMinutes:30, learningModes:['text'],                    tags:['hardware','networking'],   lessonUrl:'lessons/ide.html' },
    { id:'cpu-basics',        name:'CPU Components',           icon:'⚙️', color:'#06b6d4', tier:1, xGroup:2, prerequisites:['computer-basics','binary-intro'],      difficulty:2, gradeMin:8, estimatedMinutes:30, learningModes:['text'],                    tags:['hardware'],                lessonUrl:'lessons/ide.html' },
    { id:'logic-gates',       name:'Logic Gates',              icon:'🔮', color:'#a855f7', tier:1, xGroup:3, prerequisites:['binary-intro'],                        difficulty:2, gradeMin:9, estimatedMinutes:30, learningModes:['text'],                    tags:['logic'],                   lessonUrl:'lessons/ide.html' },
    { id:'flowchart-basics',  name:'Flowchart Basics',         icon:'📊', color:'#22c55e', tier:1, xGroup:4, prerequisites:['computer-basics'],                     difficulty:1, gradeMin:7, estimatedMinutes:20, learningModes:['text','flowchart'],        tags:['algorithms'],              lessonUrl:'lessons/flowchart.html' },
    { id:'html-css-basics',   name:'HTML & CSS Basics',        icon:'🌍', color:'#f97316', tier:1, xGroup:5, prerequisites:['computer-basics'],                     difficulty:2, gradeMin:8, estimatedMinutes:45, learningModes:['ide'],                     tags:['web'],                     lessonUrl:'lessons/ide.html' },
    { id:'binary-to-decimal', name:'Binary → Decimal',         icon:'🔄', color:'#3b82f6', tier:1, xGroup:6, prerequisites:['binary-intro','decimal-system'],       difficulty:1, gradeMin:7, estimatedMinutes:25, learningModes:['binary-cards'],            tags:['numbers'],                 lessonUrl:'lessons/binary-cards.html' },
    { id:'decimal-to-binary', name:'Decimal → Binary',         icon:'🔁', color:'#3b82f6', tier:1, xGroup:7, prerequisites:['binary-intro','decimal-system'],       difficulty:2, gradeMin:7, estimatedMinutes:25, learningModes:['binary-cards'],            tags:['numbers'],                 lessonUrl:'lessons/binary-cards.html' },
    { id:'ascii-unicode',     name:'ASCII & Unicode',          icon:'🔤', color:'#3b82f6', tier:1, xGroup:8, prerequisites:['binary-intro'],                        difficulty:2, gradeMin:8, estimatedMinutes:25, learningModes:['text'],                    tags:['numbers','data'],          lessonUrl:'lessons/ide.html' },

    // ── TIER 2 ───────────────────────────────────────────────────────
    { id:'memory-types',      name:'RAM, ROM & Cache',         icon:'🧠', color:'#06b6d4', tier:2, xGroup:0, prerequisites:['cpu-basics'],                          difficulty:2, gradeMin:9, estimatedMinutes:25, learningModes:['text'],                    tags:['hardware'],                lessonUrl:'lessons/ide.html' },
    { id:'logic-circuits',    name:'Logic Circuits',           icon:'⚡', color:'#a855f7', tier:2, xGroup:1, prerequisites:['logic-gates'],                         difficulty:3, gradeMin:9, estimatedMinutes:40, learningModes:['text'],                    tags:['logic'],                   lessonUrl:'lessons/ide.html' },
    { id:'binary-addition',   name:'Binary Addition',          icon:'➕', color:'#3b82f6', tier:2, xGroup:2, prerequisites:['binary-to-decimal','decimal-to-binary'],difficulty:2, gradeMin:8, estimatedMinutes:30, learningModes:['binary-cards'],            tags:['numbers'],                 lessonUrl:'lessons/binary-cards.html' },
    { id:'hex-intro',         name:'Hexadecimal Intro',        icon:'🔢', color:'#eab308', tier:2, xGroup:3, prerequisites:['binary-to-decimal'],                   difficulty:2, gradeMin:8, estimatedMinutes:25, learningModes:['text','binary-cards'],     tags:['numbers'],                 lessonUrl:'lessons/binary-cards.html' },
    { id:'blockly-intro',     name:'Visual Block Coding',      icon:'🧱', color:'#22c55e', tier:2, xGroup:4, prerequisites:['flowchart-basics'],                    difficulty:1, gradeMin:7, estimatedMinutes:25, learningModes:['blockly'],                 tags:['programming'],             lessonUrl:'lessons/blockly.html' },
    { id:'flowchart-decisions',name:'Flowcharts & Decisions',  icon:'🔀', color:'#22c55e', tier:2, xGroup:5, prerequisites:['flowchart-basics'],                    difficulty:2, gradeMin:8, estimatedMinutes:25, learningModes:['flowchart'],               tags:['algorithms'],              lessonUrl:'lessons/flowchart.html' },
    { id:'pseudocode-intro',  name:'Pseudocode Basics',        icon:'📝', color:'#22c55e', tier:2, xGroup:6, prerequisites:['flowchart-basics'],                    difficulty:2, gradeMin:8, estimatedMinutes:30, learningModes:['pseudocode'],              tags:['algorithms','pseudocode'], lessonUrl:'lessons/pseudocode.html' },

    // ── TIER 3 ───────────────────────────────────────────────────────
    { id:'boolean-algebra',   name:'Boolean Algebra',          icon:'∧', color:'#a855f7', tier:3, xGroup:0, prerequisites:['logic-circuits'],                       difficulty:3, gradeMin:10, estimatedMinutes:45, learningModes:['text'],                   tags:['logic'],                   lessonUrl:'lessons/ide.html' },
    { id:'twos-complement',   name:"Two's Complement",         icon:'⊖', color:'#3b82f6', tier:3, xGroup:1, prerequisites:['binary-addition'],                      difficulty:3, gradeMin:9,  estimatedMinutes:35, learningModes:['text','binary-cards'],    tags:['numbers'],                 lessonUrl:'lessons/binary-cards.html' },
    { id:'hex-binary',        name:'Hex ↔ Binary',             icon:'↔️', color:'#eab308', tier:3, xGroup:2, prerequisites:['hex-intro'],                           difficulty:2, gradeMin:8,  estimatedMinutes:20, learningModes:['binary-cards'],           tags:['numbers'],                 lessonUrl:'lessons/binary-cards.html' },
    { id:'hex-colors',        name:'Hex Colour Codes',         icon:'🎨', color:'#eab308', tier:3, xGroup:3, prerequisites:['hex-intro'],                           difficulty:1, gradeMin:8,  estimatedMinutes:20, learningModes:['text'],                   tags:['numbers','web'],           lessonUrl:'lessons/ide.html' },
    { id:'blockly-loops',     name:'Blockly Loops',            icon:'🔃', color:'#22c55e', tier:3, xGroup:4, prerequisites:['blockly-intro','flowchart-decisions'], difficulty:2, gradeMin:8,  estimatedMinutes:30, learningModes:['blockly'],                tags:['programming'],             lessonUrl:'lessons/blockly.html' },
    { id:'pseudocode-loops',  name:'Loops in Pseudocode',      icon:'🔁', color:'#22c55e', tier:3, xGroup:5, prerequisites:['pseudocode-intro'],                    difficulty:2, gradeMin:8,  estimatedMinutes:30, learningModes:['pseudocode'],             tags:['algorithms','pseudocode'], lessonUrl:'lessons/pseudocode.html' },
    { id:'python-intro',      name:'Python Basics',            icon:'🐍', color:'#f97316', tier:3, xGroup:6, prerequisites:['pseudocode-intro'],                    difficulty:2, gradeMin:9,  estimatedMinutes:40, learningModes:['ide'],                    tags:['programming','python'],    lessonUrl:'lessons/ide.html' },

    // ── TIER 4 ───────────────────────────────────────────────────────
    { id:'pseudocode-arrays', name:'Arrays in Pseudocode',     icon:'📦', color:'#22c55e', tier:4, xGroup:0, prerequisites:['pseudocode-loops'],                    difficulty:3, gradeMin:9,  estimatedMinutes:35, learningModes:['pseudocode'],             tags:['algorithms','pseudocode'], lessonUrl:'lessons/pseudocode.html' },
    { id:'search-linear',     name:'Linear Search',            icon:'🔍', color:'#a855f7', tier:4, xGroup:1, prerequisites:['pseudocode-loops'],                    difficulty:2, gradeMin:9,  estimatedMinutes:25, learningModes:['pseudocode','algo-viz'],  tags:['algorithms'],              lessonUrl:'lessons/algo-viz.html' },
    { id:'python-loops',      name:'Python Loops',             icon:'🐍', color:'#f97316', tier:4, xGroup:2, prerequisites:['python-intro'],                        difficulty:2, gradeMin:9,  estimatedMinutes:35, learningModes:['ide'],                    tags:['programming','python'],    lessonUrl:'lessons/ide.html' },
    { id:'javascript-basics', name:'JavaScript Basics',        icon:'🟨', color:'#f97316', tier:4, xGroup:3, prerequisites:['html-css-basics','python-intro'],       difficulty:3, gradeMin:9, estimatedMinutes:50, learningModes:['ide'],                    tags:['programming','web'],       lessonUrl:'lessons/ide.html' },

    // ── TIER 5 ───────────────────────────────────────────────────────
    { id:'search-binary',     name:'Binary Search',            icon:'🎯', color:'#a855f7', tier:5, xGroup:0, prerequisites:['search-linear','pseudocode-arrays'],   difficulty:3, gradeMin:9,  estimatedMinutes:30, learningModes:['pseudocode','algo-viz'],  tags:['algorithms'],              lessonUrl:'lessons/algo-viz.html' },
    { id:'sort-bubble',       name:'Bubble Sort',              icon:'🫧', color:'#a855f7', tier:5, xGroup:1, prerequisites:['pseudocode-loops','pseudocode-arrays'], difficulty:3, gradeMin:9,  estimatedMinutes:35, learningModes:['pseudocode','algo-viz'],  tags:['algorithms'],              lessonUrl:'lessons/algo-viz.html' },
    { id:'data-structures-intro','name':'Stacks & Queues',     icon:'📚', color:'#a855f7', tier:5, xGroup:2, prerequisites:['pseudocode-arrays'],                   difficulty:3, gradeMin:10, estimatedMinutes:40, learningModes:['pseudocode','algo-viz'],  tags:['algorithms'],              lessonUrl:'lessons/algo-viz.html' },
    { id:'python-functions',  name:'Python Functions',         icon:'🐍', color:'#f97316', tier:5, xGroup:3, prerequisites:['python-loops'],                        difficulty:3, gradeMin:9,  estimatedMinutes:40, learningModes:['ide'],                    tags:['programming','python'],    lessonUrl:'lessons/ide.html' },

    // ── TIER 6 ───────────────────────────────────────────────────────
    { id:'sort-insertion',    name:'Insertion Sort',           icon:'📥', color:'#a855f7', tier:6, xGroup:0, prerequisites:['sort-bubble'],                         difficulty:3, gradeMin:10, estimatedMinutes:35, learningModes:['pseudocode','algo-viz'],  tags:['algorithms'],              lessonUrl:'lessons/algo-viz.html' },
    { id:'python-lists',      name:'Python Lists & Dicts',     icon:'📋', color:'#f97316', tier:6, xGroup:1, prerequisites:['python-functions'],                    difficulty:3, gradeMin:10, estimatedMinutes:40, learningModes:['ide'],                    tags:['programming','python'],    lessonUrl:'lessons/ide.html' },
    { id:'sql-basics',        name:'SQL Queries',              icon:'🗄️', color:'#f97316', tier:6, xGroup:2, prerequisites:['data-structures-intro','python-intro'], difficulty:3, gradeMin:10, estimatedMinutes:45, learningModes:['ide'],                    tags:['programming','data'],      lessonUrl:'lessons/ide.html' },
    { id:'oop-concepts',      name:'Object-Oriented Programming',icon:'🏗️',color:'#f97316', tier:6, xGroup:3, prerequisites:['python-functions'],                  difficulty:4, gradeMin:10, estimatedMinutes:55, learningModes:['ide'],                    tags:['programming','python'],    lessonUrl:'lessons/ide.html' },
    { id:'recursion',         name:'Recursion',                icon:'🌀', color:'#a855f7', tier:6, xGroup:4, prerequisites:['python-functions','data-structures-intro'],difficulty:4,gradeMin:10,estimatedMinutes:50,learningModes:['pseudocode','ide'],     tags:['algorithms','python'],     lessonUrl:'lessons/pseudocode.html' },

    // ── TIER 7 ───────────────────────────────────────────────────────
    { id:'sort-merge',        name:'Merge Sort',               icon:'🔀', color:'#a855f7', tier:7, xGroup:0, prerequisites:['sort-insertion'],                      difficulty:4, gradeMin:10, estimatedMinutes:45, learningModes:['pseudocode','algo-viz'],  tags:['algorithms'],              lessonUrl:'lessons/algo-viz.html' },

    // ── TIER 8 ───────────────────────────────────────────────────────
    { id:'algorithms-complexity','name':'Algorithm Complexity', icon:'📈', color:'#a855f7', tier:8, xGroup:0, prerequisites:['sort-merge','search-binary'],          difficulty:4, gradeMin:10, estimatedMinutes:50, learningModes:['text','pseudocode'],      tags:['algorithms'],              lessonUrl:'lessons/pseudocode.html' },
  ];

  // ─────────────────────────────────────────────────────────────────
  //  LEARNING PATHWAYS  (5 total)
  // ─────────────────────────────────────────────────────────────────
  const PATHWAYS = [
    {
      id: 'path-visual',
      name: 'Visual Coder',
      icon: '🧱',
      color: '#22c55e',
      description: 'Start with visual thinking, flowcharts and block coding before writing a single line of code.',
      gradeTarget: 'Grade 7–8',
      conceptIds: ['computer-basics','input-output','flowchart-basics','blockly-intro','flowchart-decisions','blockly-loops','pseudocode-intro','pseudocode-loops'],
      prerequisites: [],
    },
    {
      id: 'path-numbers',
      name: 'Number Systems',
      icon: '🔢',
      color: '#3b82f6',
      description: 'Master binary, hexadecimal, and the number representations computers use.',
      gradeTarget: 'Grade 7–9',
      conceptIds: ['decimal-system','binary-intro','binary-to-decimal','decimal-to-binary','binary-addition','twos-complement','hex-intro','hex-binary','hex-colors','ascii-unicode'],
      prerequisites: [],
    },
    {
      id: 'path-algorithms',
      name: 'Algorithm Architect',
      icon: '⚙️',
      color: '#a855f7',
      description: 'Learn sorting, searching and fundamental algorithms used in every program.',
      gradeTarget: 'Grade 9–10',
      conceptIds: ['flowchart-basics','flowchart-decisions','pseudocode-intro','pseudocode-loops','pseudocode-arrays','search-linear','search-binary','sort-bubble','sort-insertion','sort-merge','data-structures-intro','algorithms-complexity'],
      prerequisites: ['path-visual'],
    },
    {
      id: 'path-python',
      name: 'Python Programmer',
      icon: '🐍',
      color: '#f97316',
      description: 'Learn Python from the ground up — variables, loops, functions, lists, and OOP.',
      gradeTarget: 'Grade 9–AS Level',
      conceptIds: ['pseudocode-intro','python-intro','python-loops','python-functions','python-lists','oop-concepts','recursion'],
      prerequisites: ['path-visual'],
    },
    {
      id: 'path-web',
      name: 'Web Creator',
      icon: '🌍',
      color: '#06b6d4',
      description: 'Build real websites — HTML structure, CSS styling, and JavaScript interactivity.',
      gradeTarget: 'Grade 8–AS Level',
      conceptIds: ['computer-basics','html-css-basics','hex-colors','javascript-basics','sql-basics'],
      prerequisites: [],
    },
  ];

  // ─────────────────────────────────────────────────────────────────
  //  ACHIEVEMENTS  (20 total)
  //  condition(masteryData, userData) → boolean
  // ─────────────────────────────────────────────────────────────────
  const ACHIEVEMENTS = [
    { id:'first-concept',   title:'First Step',         icon:'🌱', xp:50,  description:'Master your very first concept',                check:(m,u)=>masteredCount(m)>=1 },
    { id:'flip-10',         title:'Card Shark',          icon:'🃏', xp:75,  description:'Complete 10 binary card challenges',            check:(m,u)=>attempts(m,'binary-to-decimal','decimal-to-binary')>=10 },
    { id:'streak-3',        title:'On a Roll',           icon:'🔥', xp:100, description:'Maintain a 3-day learning streak',              check:(m,u)=>(u.streak||0)>=3 },
    { id:'streak-7',        title:'Week Warrior',        icon:'🔥', xp:250, description:'Maintain a 7-day learning streak',              check:(m,u)=>(u.streak||0)>=7 },
    { id:'streak-30',       title:'Unstoppable',         icon:'⚡', xp:1000,description:'Maintain a 30-day learning streak',             check:(m,u)=>(u.streak||0)>=30 },
    { id:'binary-beast',    title:'Binary Beast',        icon:'⚫', xp:200, description:'Master all number system concepts',             check:(m,u)=>['binary-intro','binary-to-decimal','decimal-to-binary','binary-addition','hex-intro'].every(id=>isMastered(m,id)) },
    { id:'logic-wizard',    title:'Logic Wizard',        icon:'🔮', xp:150, description:'Master Boolean Algebra',                       check:(m,u)=>isMastered(m,'boolean-algebra') },
    { id:'sort-master',     title:'Sort It Out',         icon:'📊', xp:200, description:'Master all three sorting algorithms',          check:(m,u)=>['sort-bubble','sort-insertion','sort-merge'].every(id=>isMastered(m,id)) },
    { id:'search-master',   title:'Search Expert',       icon:'🔍', xp:150, description:'Master both search algorithms',                check:(m,u)=>['search-linear','search-binary'].every(id=>isMastered(m,id)) },
    { id:'first-python',    title:'Pythonista',          icon:'🐍', xp:100, description:'Master Python Basics',                         check:(m,u)=>isMastered(m,'python-intro') },
    { id:'web-builder',     title:'Web Builder',         icon:'🌍', xp:100, description:'Master HTML & CSS Basics',                     check:(m,u)=>isMastered(m,'html-css-basics') },
    { id:'flowchart-ace',   title:'Flowchart Ace',       icon:'📊', xp:75,  description:'Master Flowchart Basics',                      check:(m,u)=>isMastered(m,'flowchart-basics') },
    { id:'concept-5',       title:'High Five',           icon:'🖐', xp:100, description:'Master 5 concepts',                            check:(m,u)=>masteredCount(m)>=5 },
    { id:'concept-10',      title:'Decade',              icon:'🎯', xp:300, description:'Master 10 concepts',                           check:(m,u)=>masteredCount(m)>=10 },
    { id:'concept-25',      title:'Quarter Century',     icon:'💎', xp:750, description:'Master 25 concepts',                          check:(m,u)=>masteredCount(m)>=25 },
    { id:'concept-42',      title:'The Answer',          icon:'🌟', xp:2000,description:'Master all 42 concepts',                      check:(m,u)=>masteredCount(m)>=42 },
    { id:'level-5',         title:'Level 5',             icon:'⭐', xp:0,   description:'Reach level 5',                               check:(m,u)=>(u.level||1)>=5 },
    { id:'level-10',        title:'Byte Forger',         icon:'🏆', xp:0,   description:'Reach level 10',                              check:(m,u)=>(u.level||1)>=10 },
    { id:'pathway-visual',  title:'Visual Thinker',      icon:'🧱', xp:300, description:'Complete the Visual Coder pathway',           check:(m,u)=>pathwayComplete(m,'path-visual') },
    { id:'pathway-numbers', title:'Number Nerd',         icon:'🔢', xp:300, description:'Complete the Number Systems pathway',         check:(m,u)=>pathwayComplete(m,'path-numbers') },
  ];

  // ── Helper functions used in achievement checks ──────────────────
  function masteredCount(m) {
    if (!m?.concepts) return 0;
    return Object.values(m.concepts).filter(c => c.status === 'mastered').length;
  }
  function isMastered(m, id) {
    return m?.concepts?.[id]?.status === 'mastered';
  }
  function attempts(m, ...ids) {
    if (!m?.concepts) return 0;
    return ids.reduce((s, id) => s + (m.concepts[id]?.attempts || 0), 0);
  }
  function pathwayComplete(m, pathwayId) {
    const p = PATHWAYS.find(p => p.id === pathwayId);
    if (!p) return false;
    return p.conceptIds.every(id => isMastered(m, id));
  }

  // ── Graph utilities ───────────────────────────────────────────────
  function conceptById(id) { return CONCEPTS.find(c => c.id === id) || null; }

  function dependents(id) { return CONCEPTS.filter(c => c.prerequisites.includes(id)); }

  function prereqsMet(conceptId, masteredOrPracticingSet) {
    const c = conceptById(conceptId);
    if (!c) return false;
    return c.prerequisites.every(p => masteredOrPracticingSet.has(p));
  }

  // Compute SVG layout positions for all concepts
  // Returns Map: conceptId → {x, y}
  function computeLayout(svgW, svgH) {
    const tierSpacing = svgH / 9.5;
    const positions   = new Map();
    const byTier      = {};
    CONCEPTS.forEach(c => { (byTier[c.tier] = byTier[c.tier]||[]).push(c); });
    Object.entries(byTier).forEach(([tier, concepts]) => {
      const sorted = [...concepts].sort((a,b) => a.xGroup - b.xGroup);
      const count  = sorted.length;
      sorted.forEach((c, i) => {
        const x = svgW * (i + 0.5) / count;
        const y = 60 + Number(tier) * tierSpacing;
        positions.set(c.id, { x, y });
      });
    });
    return positions;
  }

  return { CONCEPTS, PATHWAYS, ACHIEVEMENTS, conceptById, dependents, prereqsMet, computeLayout, masteredCount, isMastered };
})();
