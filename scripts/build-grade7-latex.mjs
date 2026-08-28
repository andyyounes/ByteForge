// Generates one Beamer (.tex) teacher presentation per Grade 7 chapter into
// latex/grade7/. This is the TEACHER-ONLY deliverable — real-world examples,
// suggested videos, and open-ended discovery prompts live here, NOT in the
// student-facing platform (public/lessons/grade7.html or grade7-slides.html).
//
// No LaTeX distribution is installed in this environment (no pdflatex/
// xelatex/latexmk) — these .tex files are written but NOT compiled/verified
// here. Compile with Overleaf or a local TeX install: `latexmk -pdf st1.tex`
// (or `pdflatex st1.tex` run twice, for cross-references/page count).
import { writeFileSync, mkdirSync } from 'fs'

const OUT_DIR = 'c:/Users/user/Downloads/ICT website/latex/grade7'
mkdirSync(OUT_DIR, { recursive: true })

// ── LaTeX escaping ───────────────────────────────────────────────────────
// Plain prose: escape the 10 characters LaTeX treats specially.
function esc(s) {
  return String(s)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([%$#_{}&])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}
// Inline code spans (wrapped in \texttt{...}) — same escaping, code text
// only ever appears inside \texttt so no verbatim/fragile mode is needed.
function code(s) { return '\\texttt{' + esc(s) + '}' }
// Convert our lightweight `backtick code` markdown into \texttt{} runs,
// then escape everything else as plain prose.
function md(s) {
  const parts = String(s).split(/`([^`]+)`/g)
  return parts.map((p, i) => (i % 2 === 1 ? code(p) : esc(p))).join('')
}

const DECKS = {
  st1: { emoji:'📰', name:'Story Studio 1 — Page Basics', sub:'Headings, paragraphs, links, buttons — the tags every page starts with',
    stages:['Front Page','Say More','Chapter One','Read More','Call to Action'], boss:'Ship the Front Page',
    concepts:[
      { h:'A heading is a page\'s title', p:'One big title, shown once near the top — the ONE thing that tells a reader what this whole page is about. This is what a real webpage\'s `<h1>` does.' },
      { h:'A paragraph is the body of the page', p:'If the heading is the title, the paragraph is everything you actually want to SAY. Blocks run top to bottom — so does the page.' },
      { h:'One paragraph per idea', p:'Good writing breaks text into separate paragraphs — one per idea — rather than one giant block. That\'s what makes a page skimmable.' },
      { h:'A link connects one page to another', p:'Every link needs two things: the text someone clicks, and the address it goes to. Links are what turn separate pages into a connected site.' },
      { h:'A button invites an action', p:'A link takes you somewhere else; a button triggers something HERE. Right now it does nothing yet — that comes next week.' },
      { h:'BOSS — every block, one real page', p:'Heading, paragraphs, link, button is close to the actual shape of a huge number of real websites.' },
    ],
    realWorld: 'Open any news homepage (BBC, a school website) together: point out the ONE big headline, the body paragraphs underneath, a "read more" link, and a "subscribe" button — the exact same four blocks students are about to use.',
    video: 'HTML basics for beginners — headings, paragraphs, links, buttons',
    discovery: 'Before opening the platform: in pairs, look at 2-3 real websites and list which parts are "heading", "paragraph", "link", or "button". Which pages break the "one heading" rule — and does it make them harder to read?' },
  st2: { emoji:'🎨', name:'Story Studio 2 — Style It', sub:'Background, heading colour, alignment, font size — CSS for your page',
    stages:['Paint the Page','Title Colour','Center Stage','Readable Text'], boss:'Style the Front Page',
    concepts:[
      { h:'Content vs. style — two different jobs', p:'Last week\'s blocks decided WHAT is on the page. This week\'s Style blocks decide how it LOOKS — colours, alignment, size.' },
      { h:'A style rule can target ONE kind of block', p:'"Set heading colour" only changes headings — paragraphs stay whatever colour they already were. A targeted rule, not a blanket one.' },
      { h:'Alignment is a choice, not a colour', p:'Unlike colour, alignment only has a few real choices — left, center, right. Centered paragraphs are actually harder to read line-by-line.' },
      { h:'Font size affects real readability', p:'Text that\'s too small is a genuine accessibility problem — real design guidelines set a minimum readable size (commonly 16px).' },
      { h:'BOSS — HTML gives structure, CSS gives style', p:'Unlike HTML tags, CSS rules apply no matter when you set them — style first or last, the result is identical.' },
    ],
    realWorld: 'Toggle a phone\'s font size / "reader mode" setting live, or compare a site with tiny 10px body text against one with proper 16px+ text — ask which one people would actually keep reading.',
    video: 'CSS basics for beginners — colours, alignment, font size',
    discovery: 'Find one website that centers a whole paragraph of body text (not a title). Read it aloud line by line — does the centering make it harder to follow? Why do titles get away with it but paragraphs don\'t?' },
  st3: { emoji:'👆', name:'Story Studio 3 — Make It Click', sub:'onclick — a button that actually does something when pressed',
    stages:['Click to Reveal','Click for More','Both at Once','Button Talks Back'], boss:'The Big Reveal',
    concepts:[
      { h:'onclick — code that waits for a click', p:'Every block before this ran the instant you pressed Run. "When button is clicked" waits, doing nothing, until a real click happens.' },
      { h:'The same event, a different action', p:'The event ("when clicked") stays the same — what happens inside it is entirely up to you.' },
      { h:'One event, multiple actions', p:'Anything placed inside "when clicked" all runs together, in order, from a single click — no limit to how many blocks you can stack.' },
      { h:'A button can change itself', p:'It\'s easy to assume a button can only affect OTHER things — but it can just as easily change its own label.' },
      { h:'BOSS — structure, style, and behaviour', p:'Week 1 gave structure, Week 2 gave style, Week 3 gives BEHAVIOUR — the same three-part split every real website is built from.' },
    ],
    realWorld: 'Click an "Add to cart" button on a real shopping site — the label changing to "Added ✓" or a counter updating is exactly this week\'s "button talks back" idea, live in production software.',
    video: 'JavaScript onclick events explained for beginners',
    discovery: 'Find a button on any app or website that changes itself when clicked (a like button, a "show password" eye icon, a checkbox). What exactly changes — text, colour, icon? Nothing else on the page needs to change too.' },
  st4: { emoji:'🧠', name:'Story Studio 4 — Remember Things', sub:'Variables — a story that remembers the reader\'s choice',
    stages:['Remember the Choice','Two Details, One Story','The Choice Updates'], boss:'The Choice Remembered',
    concepts:[
      { h:'A variable is a box with a name', p:'A named box holding a value your code can reuse, combine, or change later — the same code works no matter what\'s stored inside.' },
      { h:'Multiple variables, remembered together', p:'A real interactive story remembers MANY details — which item they picked, which room they\'re in, how much health they have.' },
      { h:'A variable is a box that can CHANGE', p:'`health = health - 20` reads the current value, subtracts 20, then stores the result back — that\'s what makes a variable useful for a story.' },
      { h:'BOSS — a page that remembers', p:'HTML gave structure, CSS gave style, onclick gave behaviour — variables give the page MEMORY.' },
    ],
    realWorld: 'Your shopping cart total, a video\'s "watched 12:34 of 20:00" progress, a game\'s remembered high score between sessions — every one of these is a variable persisting a value.',
    video: 'What is a variable — programming basics for beginners',
    discovery: 'Name three things a website "remembers" about you between visits (logged-in name, cart items, dark mode setting). For each, is it stored as a variable in that one page-visit, or does it need to persist even after you close the tab?' },
  st5: { emoji:'🔀', name:'Story Studio 5 — Choose a Path', sub:'if/else — a story that branches on the reader\'s choice',
    stages:['Two Endings','Three Paths','Branch on the Click'], boss:'Your Story, Your Ending',
    concepts:[
      { h:'A variable is only useful if something CHECKS it', p:'A variable stores a choice; IF/ELSE is what actually MAKES that choice matter — without a branch, every choice would look the same.' },
      { h:'else if — a genuine third path', p:'Conditions are checked top to bottom, and the FIRST one that\'s true wins — order matters when ranges overlap.' },
      { h:'Branching on a value THAT JUST CHANGED', p:'Update the variable first, THEN check it — get the order backwards and the branch is always one click behind reality.' },
      { h:'BOSS — the whole semester, one real page', p:'Structure, style, behaviour, memory, decisions — a real interactive story needs genuinely all five.' },
    ],
    realWorld: 'A "choose your own adventure" book, a Netflix interactive episode (Bandersnatch), or a game\'s dialogue choice — every branch a reader/player can take is an if/else somewhere in the code.',
    video: 'If else statements explained for beginners — branching logic',
    discovery: 'Think of a choice-based story or game you know. Sketch its first three branches on paper as boxes and arrows (this is secretly a flowchart) before we build one in code.' },
  sc1: { emoji:'🕹', name:'Block Arcade 1 — Sprites & the Stage', sub:'Every sprite lives at an (x, y) — coordinates in blocks',
    stages:['Meet Your Sprite','Two Sprites, Two Corners'], boss:'Place Your Cast',
    concepts:[
      { h:'A sprite is just a shape at a position', p:'A "sprite" is any character or object on the stage — under the hood, it\'s a position (x, y) plus something drawn there.' },
      { h:'Naming positions makes them easier to reason about', p:'"Top-left" and "bottom-right" are shorthand for specific (x,y) values — translating a description into coordinates is a skill you\'ll use constantly.' },
      { h:'BOSS — three sprites, three positions', p:'Same skill, just repeated — real Scratch projects often start with exactly this.' },
    ],
    realWorld: 'Open Scratch\'s own stage and drag a sprite around — the x/y readout in the corner is literally the same two numbers this chapter is teaching.',
    video: 'Scratch coordinates explained — x and y for beginners',
    discovery: 'On a printed 480x260 grid, mark where you\'d place a sprite for "top-left corner", "dead center", and "bottom-right corner" before touching the platform — compare answers as a class.' },
  sc2: { emoji:'🕹', name:'Block Arcade 2 — Motion & Repeat', sub:'"Repeat" blocks — do something several times without copy-pasting',
    stages:['Repeat 3 Times','Marching Line'], boss:'Bouncing Sprite',
    concepts:[
      { h:'Repeat — do it without repeating yourself', p:'"Repeat 3" scales — drawing 30 sprites by hand would mean 30 blocks, while a repeat block handles any number.' },
      { h:'A variable changing INSIDE a loop', p:'Changing x by 80 each pass through the loop is what actually spaces the sprites out.' },
      { h:'BOSS — movement is a variable changing every frame', p:'"On every frame" is a repeat block that never stops. That\'s genuinely what ALL motion in ALL games actually is.' },
    ],
    realWorld: 'A marching band or a row of parked cars, evenly spaced — the spacing pattern (each one a fixed distance from the last) is the exact "loop + changing variable" idea.',
    video: 'Loops explained for beginners — repeat blocks in Scratch',
    discovery: 'Watch any 2D platformer character walk for 10 seconds. Roughly how many times does it "step" a tiny bit? Movement that looks smooth is secretly hundreds of small repeats — try to spot the individual frames.' },
  sc3: { emoji:'🕹', name:'Block Arcade 3 — Events', sub:'Keys are events — the stage reacts to what the player presses',
    stages:['Press to Move','Jump on Space'], boss:'Full Control',
    concepts:[
      { h:'Checking a key is a question, asked every frame', p:'Placed inside "on every frame", a key check is asked 60 times a second — that\'s what makes a held-down key feel like smooth movement.' },
      { h:'Any key can trigger any action', p:'Space isn\'t special — it\'s just another key. What makes it feel like a "jump" is purely what you put inside the if.' },
      { h:'BOSS — four keys, four directions', p:'Each arrow key gets its OWN separate if — pressing two at once genuinely moves the sprite diagonally, for free.' },
    ],
    realWorld: 'A car\'s cruise control constantly re-checking your foot on the brake, or a lift constantly checking if a floor button is pressed — both are "ask the same question every moment", not a one-time check.',
    video: 'Keyboard input handling explained for beginners — game controls',
    discovery: 'Try holding two arrow keys at once in any real game (or your phone\'s on-screen d-pad). Does the character move diagonally? What would the code need to allow that — one if, or two separate ifs?' },
  sc4: { emoji:'🕹', name:'Block Arcade 4 — Variables', sub:'Score and lives — numbers the game tracks and shows the player',
    stages:['Score Counter','Score Goes Up'], boss:'Score & Lives HUD',
    concepts:[
      { h:'A variable the PLAYER can see', p:'A score no one can see isn\'t really a score to the player — drawing it every frame turns an internal number into a real scoreboard.' },
      { h:'Redrawing every frame keeps the display current', p:'Because the display re-reads the variable fresh every frame, it always shows whatever score currently IS.' },
      { h:'BOSS — a real two-stat HUD', p:'Score AND lives, shown together, is genuinely what almost every simple arcade game\'s display actually is.' },
    ],
    realWorld: 'Any arcade game\'s top-of-screen HUD (score, lives, timer) — point at three different real games\' HUDs and identify which numbers are tracked as variables.',
    video: 'What is a HUD — score and lives display in games explained',
    discovery: 'Screenshot or sketch three different games\' HUDs. What numbers do they ALL show? What\'s unique to just one of them (a timer, ammo count, a combo multiplier)?' },
  sc5: { emoji:'🕹', name:'Block Arcade 5 — If/Else', sub:'Rules that check a condition — a wall, an edge, a win',
    stages:['Touching the Edge','Win Message'], boss:'Game Rules',
    concepts:[
      { h:'A rule that only fires past a threshold', p:'There\'s no special "edge" concept in code — `x > 400` IS the edge. Any boundary in a real game is built from exactly this.' },
      { h:'IF can replace what\'s shown, not just add to it', p:'"You Win!" and the running score are in different branches of the same if/else — only one is ever drawn on a given frame.' },
      { h:'BOSS — every Block Arcade idea, one sprite', p:'Coordinates, loops, key events, variables, if/else — every idea combines here into something genuinely close to a tiny real game.' },
    ],
    realWorld: 'A car\'s parking sensor beeping only once you\'re within a set distance of a wall — the "beep" only fires past a threshold, exactly like this chapter\'s edge check.',
    video: 'Collision detection basics — walls and boundaries for beginners',
    discovery: 'Play any simple browser game for two minutes and try to spot its "win" condition and its "you hit a wall" condition. What number do you think each one is checking against?' },
  g1: { emoji:'🚀', name:'G1 — Sprite Start', sub:'Coordinates, sequences — draw and move your first sprite',
    stages:['First Sprite','Four Corners','Rectangle Room','Three in a Row'], boss:'Sprite Follows You',
    concepts:[
      { h:'Coordinates — every sprite has an (x, y)', p:'x (how far right), y (how far down) — y grows DOWN, the opposite of a maths graph. Everything you build this year comes back to these two numbers.' },
      { h:'Reading coordinates precisely', p:'"Draw 4 things" and "draw 4 things in specific places" are very different tasks — real challenges almost always care about WHERE, not just how many.' },
      { h:'Rectangles need FOUR numbers, not two', p:'A rectangle needs a position AND a size (width, height) — four numbers instead of a circle\'s three.' },
      { h:'Sequence — same Y, different X', p:'Three shapes "in a line" means one coordinate stays the SAME while the other changes — a huge amount of real layout is exactly this.' },
      { h:'BOSS — coordinates that update every frame', p:'"On every frame" re-runs its contents dozens of times a second — clear, then redraw, every frame, is the engine behind every animated game.' },
    ],
    realWorld: 'Your phone\'s touchscreen reporting exactly WHERE you tapped (not just THAT you tapped) — every touch event carries an (x, y), same idea as this chapter\'s sprite position.',
    video: 'Screen coordinates explained — x y position for beginners',
    discovery: 'On paper, draw a 480x260 rectangle. Mark where (0,0), (240,130), and (479,259) actually land. Which corner is (0,0) — and why might that surprise someone used to maths graphs?' },
  g2: { emoji:'🎚', name:'G2 — Variables & State', sub:'Score, health, timers — numbers that change',
    stages:['Colour Square','Growing Circle','Health Bar'], boss:'Clicker Upgrade',
    concepts:[
      { h:'Variables — a named box that can change', p:'r, g, b hold numbers 0-255 for red/green/blue — using a variable READS its value; only a "set"/"change" block updates it.' },
      { h:'One variable, many uses', p:'Change size once, and every place that reads it shows the new value — that\'s the whole point of variables.' },
      { h:'A variable driving TWO different things', p:'health drives a bar\'s WIDTH directly — the "one variable, automatically reflected in visuals" pattern behind every health/progress bar.' },
      { h:'BOSS — a variable that changes over time', p:'A variable, a frame loop, and an IF working together — score only rises when Space is held.' },
    ],
    realWorld: 'Any RPG or shooter\'s health bar visibly shrinking as you take damage — the bar\'s pixel width is driven directly by one number, exactly like this chapter\'s health-bar challenge.',
    video: 'How health bars work in games — variables explained',
    discovery: 'Find a game with a visible health or loading bar. Watch it shrink or fill — does it move in smooth small steps, or big jumps? What does that tell you about how often the variable is being redrawn?' },
  g3: { emoji:'🚦', name:'G3 — Decisions', sub:'Touching? Score > 10? Out of bounds?',
    stages:['Traffic Light','Big or Small','Danger Zone'], boss:'Dodge at the Edges',
    concepts:[
      { h:'IF/ELSE — choosing between paths', p:'An IF only runs when a condition is true. Chaining IF/ELSE IF/ELSE picks between three outcomes — only one branch ever runs.' },
      { h:'Comparisons — greater than, not just equal', p:'"Bigger than 50" covers a whole RANGE. Deciding exactly where a boundary sits is a real, common source of bugs ("off-by-one" errors).' },
      { h:'Combining a variable, IF, and drawing', p:'Comparing a changing value against a fixed threshold — the exact pattern you\'ll build on properly in G6, Collision & Physics.' },
      { h:'BOSS — multiple IFs, one per key', p:'Each arrow key needs its OWN if — checking every single frame is what makes movement feel continuous, not jumpy.' },
    ],
    realWorld: 'A real traffic light\'s three states (red/amber/green) is literally an if/else-if/else chain in the controller software — same three-way branch this chapter teaches.',
    video: 'If elif else explained for beginners — multiple conditions',
    discovery: 'Find a real rule with a fuzzy boundary (is a "tall" person over 180cm? over 175cm?). Where would YOU draw the line, and would someone exactly on that line be included or not? This is exactly the off-by-one problem in code.' },
  g4: { emoji:'🧰', name:'G4 — My Blocks', sub:'jump(), shoot(), spawnEnemy() — powers you define',
    stages:['spawnEnemy()','shoot()','powerUp()'], boss:'Platformer Vertical Slice',
    concepts:[
      { h:'Functions — reusable named blocks', p:'A function is defined ONCE with parameters, then CALLED many times with different values — one definition, many different outcomes.' },
      { h:'A parameter that changes behaviour', p:'A true/false parameter can make the FUNCTION ITSELF decide what to draw, using an IF inside its own definition.' },
      { h:'A text parameter, not just numbers', p:'Parameters can carry any type of value — numbers, true/false, or text — the function\'s job is always to use whatever was passed in.' },
      { h:'BOSS — planning in pseudocode BEFORE building', p:'Writing the logic in plain English first is called pseudocode — real programmers do this constantly for anything fiddly, like jump physics.' },
    ],
    realWorld: 'A recipe you cook many times (make pancakes) is a "function" — the same steps, but the exact ingredients (parameters) change each time depending on how many people you\'re feeding.',
    video: 'What is a function — parameters explained for beginners',
    discovery: 'Think of something you do repeatedly with small variations (making a sandwich, getting ready for school). Write the general steps once, then note which parts change each time (the "parameters").' },
  g5: { emoji:'⌨️', name:'G5 — Player Control', sub:'Keyboard + mouse input schemes, aiming',
    stages:['Move with Arrow Keys','Aim with the Mouse','Two-Player Split'], boss:'Top-Down Shooter Controls',
    concepts:[
      { h:'Keyboard input — four separate checks', p:'Checking all four arrow keys means four separate IF blocks — small changes every frame LOOK like smooth continuous movement.' },
      { h:'Mouse position — always available, live', p:'mouseX()/mouseY() always report the CURRENT position, live — nothing to set or update, the engine tracks it automatically.' },
      { h:'Two independent things, same frame loop', p:'Two players need two SEPARATE sets of variables — a single loop can control multiple independent things at once.' },
      { h:'BOSS — networking scale: PAN to LAN to WAN', p:'A keyboard+mouse on one PC is a PAN; school wifi is a LAN; the whole internet is a WAN — same idea, three different scales.' },
    ],
    realWorld: 'A split-screen couch co-op game (two controllers, two characters on one screen) is exactly this chapter\'s "two independent input schemes, one frame loop" idea, running in a real shipped game.',
    video: 'Mouse and keyboard input in games explained for beginners',
    discovery: 'Play any game with both keyboard movement AND mouse aiming (many shooters). Try to notice: does moving affect aiming, or are they genuinely independent? What would break if they shared one set of variables?' },
  g6: { emoji:'💥', name:'G6 — Collision & Physics', sub:'Hitboxes, bouncing, gravity, knockback',
    stages:['Hitbox Check','Bounce & Gravity','Knockback'], boss:'Breakout Clone',
    concepts:[
      { h:'The distance formula — real Pythagoras', p:'`dist = sqrt((x2-x1)^2 + (y2-y1)^2)` — literally Pythagoras\' theorem, applied to two circle centres.' },
      { h:'Gravity and bouncing — physics as a loop', p:'Increase velocity by a small amount EVERY frame to simulate gravity — no complicated physics engine needed.' },
      { h:'Combining collision detection with movement', p:'"Detect, then react" — check for a condition (collision), then DO something as a direct result (bounce away).' },
      { h:'BOSS — linear search through an array', p:'An array stores a whole list under one name — checking each item one at a time, in order, is called a linear search.' },
    ],
    realWorld: 'A basketball\'s arc and bounce follows the exact same idea — gravity constantly pulling it down (velocity increasing each moment) until it hits the floor and reverses.',
    video: 'Collision detection and gravity explained — game physics basics',
    discovery: 'Drop a ball (real or a video of one bouncing) and watch closely: does each bounce go exactly as high as the last, or does it lose a little height each time? What in the code (Bounce & Gravity) causes that?' },
  g7w: { emoji:'🎬', name:'G7 — Game States', sub:'Menu → playing → paused → game-over → win',
    stages:['The State Variable','Switching States','Pause Overlay'], boss:'Full Game Loop w/ Screens',
    concepts:[
      { h:'A state is just a variable holding text', p:'What makes it a "state machine" is using IF/ELSE to draw a completely different screen depending on what the variable currently holds.' },
      { h:'A condition that changes the state itself', p:'The game changes its own state variable based on a condition — this self-modifying behaviour is exactly how real games transition between screens.' },
      { h:'A flag that gates everything else', p:'A true/false "paused" variable draws an overlay on top — whatever you draw LAST appears on top of everything drawn before it.' },
      { h:'BOSS — a real, multi-state machine', p:'menu to playing to gameover, each transition triggered by a real condition — the exact pattern behind every real video game\'s screen flow.' },
    ],
    realWorld: 'Every app you use has "states": a login screen, a loading spinner, the main screen, an error message — the same menu/playing/paused/gameover idea, just with different names.',
    video: 'What is a state machine — game screens explained for beginners',
    discovery: 'List every distinct "screen" a mobile game shows you from opening the app to actually playing (splash screen, menu, loading, playing, pause, game over). How many states is that, really?' },
  g8: { emoji:'🤖', name:'G8 — Smart NPCs', sub:'Enemies that chase, flee, patrol; a rule-based chatbot',
    stages:['Chase the Player','Patrol Pattern','Rule-Based Chatbot'], boss:'Enemy with 3 Behaviours',
    concepts:[
      { h:'"AI" made entirely of comparisons', p:'Comparing two positions and nudging one closer, every frame, creates the ILLUSION of hunting — there\'s no real intelligence, just a repeated comparison.' },
      { h:'A direction variable that flips', p:'Storing "which way" as +1 or -1, flipped at a boundary, creates an endless back-and-forth patrol from one variable and two conditions.' },
      { h:'Matching text — the simplest kind of "AI"', p:'A rule-based chatbot is just a chain of exact text comparisons, each with its own canned reply — genuinely what early chatbots were.' },
      { h:'BOSS — rules vs. real machine learning', p:'Every behaviour here is a rule YOU wrote. Real ML is different: instead of a human writing rules, the system is shown examples and works out its OWN rules.' },
    ],
    realWorld: 'An automated customer-service chat that only understands exact phrases ("Track my order") and fails on anything slightly different is a real rule-based chatbot, exactly like this chapter\'s.',
    video: 'Rule-based AI vs machine learning explained for beginners',
    discovery: 'Try a simple customer-service chatbot online (a bank, a shop) and type something slightly unusual. Does it understand, or does it fail and repeat a canned response? What does that tell you about how it\'s built?' },
  g9w: { emoji:'💬', name:'G9 — Strings & Dialogue', sub:'Player names, dialogue trees, high-score tables',
    stages:['Player Name & ASCII','Dialogue Tree','Shout Mode'], boss:'RPG Dialogue Scene',
    concepts:[
      { h:'Strings — text is just data too', p:'Every character is secretly a number (ASCII) — "H" is 72, "A" is 65. Text and numbers aren\'t as different as they look.' },
      { h:'Comparing text to branch a conversation', p:'`===` works on text just like on numbers — the entire mechanism behind a dialogue tree: compare a choice, branch to different text.' },
      { h:'String methods — transforming text', p:'`.toUpperCase()` returns a NEW version — it doesn\'t modify the original variable. String methods almost always hand back a new result.' },
      { h:'BOSS — text, arrays, and a loop, together', p:'An array of {name, score} objects is a real, proper data table — looping through it is exactly how every leaderboard works.' },
    ],
    realWorld: 'Any RPG\'s dialogue choices ("Attack" / "Defend" / "Run") branching to different outcomes, and a game\'s online leaderboard listing name+score pairs, are both exactly this chapter\'s ideas in shipped games.',
    video: 'Dialogue trees explained — branching conversations in games',
    discovery: 'Play (or recall) a game with dialogue choices. Pick one branch and trace it: what text comparison do you think the code is making to decide which reply you see?' },
  g10: { emoji:'🏆', name:'G10 — Design & Capstone', sub:'Plan → build → test → ship YOUR game',
    stages:['Design Your Game','Score & Win Screen'], boss:'Ship Your Own Game',
    concepts:[
      { h:'Planning BEFORE building', p:'A clear, checkable win condition ("reach 20 points") is easier to build AND test than a vague goal like "make it fun".' },
      { h:'Live, updating feedback for the player', p:'Redrawing the score every frame means you never have to manually "update" the display — it always reflects the current value.' },
      { h:'FINAL BOSS — everything from the whole year', p:'A state machine, player input, a win condition, and at least one function you define — every major idea, combined into a game YOU designed.' },
      { h:'Playtest, then iterate', p:'Real developers ALWAYS playtest and adjust at least once — a first draft is rarely the final version.' },
    ],
    realWorld: 'Every shipped game went through exactly this: a design document, a build, a playtest, then changes based on what real players actually did — not what the designer assumed they\'d do.',
    video: 'Game design basics — planning and playtesting for beginners',
    discovery: 'Before opening the platform: sketch your game idea on paper — one sentence for "how do you win", and one sketch of what the screen looks like. Trade with a partner and ask: is the win condition actually checkable?' },
}

const ORDER = ['st1','st2','st3','st4','st5','sc1','sc2','sc3','sc4','sc5','g1','g2','g3','g4','g5','g6','g7w','g8','g9w','g10']

const PREAMBLE = String.raw`\documentclass[aspectratio=169]{beamer}
\usetheme{Madrid}
\usecolortheme{beaver}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\setbeamertemplate{navigation symbols}{}
\setbeamercolor{title}{fg=white,bg=cyan!60!black}
\setbeamercolor{frametitle}{fg=white,bg=cyan!50!black}
\setbeamercolor{block title}{bg=cyan!15,fg=black}
\setbeamercolor{block body}{bg=cyan!5,fg=black}
`

function chapterTex(id) {
  const d = DECKS[id]
  const stageItems = d.stages.map(s => '        \\item ' + esc(s)).join('\n')
  const conceptFrames = d.concepts.map(c => String.raw`
\begin{frame}{${md(c.h)}}
    \Large
    ${md(c.p)}
\end{frame}
`).join('\n')

  return PREAMBLE + String.raw`
\title{${md(d.name)}}
\subtitle{${md(d.sub)}}
\author{ByteForge --- Grade 7 --- Game Maker}
\date{}

\begin{document}

\begin{frame}
    \titlepage
\end{frame}

\begin{frame}{Today's Plan}
    \begin{itemize}
${stageItems}
        \item[$\bigstar$] BOSS --- ${md(d.boss)}
    \end{itemize}
\end{frame}
${conceptFrames}
\begin{frame}{Real-World Example}
    \Large
    ${md(d.realWorld)}
\end{frame}

\begin{frame}{Watch}
    \Large
    Suggested video topic: \emph{${md(d.video)}}

    \vspace{1em}
    \normalsize
    Search this on YouTube together, or swap in a specific video you've
    already vetted --- do not project an unverified link cold in class.
\end{frame}

\begin{frame}{Let Them Discover}
    \Large
    ${md(d.discovery)}
\end{frame}

\begin{frame}{Your Turn}
    \Large
    Open the student map, find \textbf{${md(d.name)}}, and work through it
    hands-on --- everything you just saw, they now do themselves.
\end{frame}

\end{document}
`
}

for (const id of ORDER) {
  const tex = chapterTex(id)
  writeFileSync(OUT_DIR + '/' + id + '.tex', tex, 'utf8')
}
console.log('Wrote ' + ORDER.length + ' .tex files to ' + OUT_DIR)
