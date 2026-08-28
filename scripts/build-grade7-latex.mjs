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
      { h:'A heading is a page\'s title', p:'One big title, shown once near the top — the ONE thing that tells a reader what this whole page is about. This is what a real webpage\'s `<h1>` does.',
        diagram: String.raw`
        \draw[thick] (0,0) rectangle (7,-4);
        \draw[fill=cyan!25, thick] (0.4,-0.4) rectangle (6.6,-1.2);
        \node at (3.5,-0.8) {\bfseries HEADING};
        \draw[dashed, gray] (0.4,-1.7) rectangle (6.6,-3.6);
        \node[gray] at (3.5,-2.65) {(rest of the page)};`,
        worked: 'Worked example: a page with TWO heading blocks reads like a book with two titles on the cover — which one is it actually about? That\'s why real pages almost always use exactly one.' },
      { h:'A paragraph is the body of the page', p:'If the heading is the title, the paragraph is everything you actually want to SAY. Blocks run top to bottom — so does the page.',
        worked: 'Worked example: heading "My Story", then paragraph "It was a dark night...". Swap the order and Run — the paragraph now appears ABOVE the heading, because blocks run top to bottom exactly as stacked.' },
      { h:'One paragraph per idea', p:'Good writing breaks text into separate paragraphs — one per idea — rather than one giant block. That\'s what makes a page skimmable.' },
      { h:'A link connects one page to another', p:'Every link needs two things: the text someone clicks, and the address it goes to. Links are what turn separate pages into a connected site.',
        worked: 'Worked example: a link block missing its destination is like a signpost with an arrow but no name on it — technically still a signpost, but useless to anyone reading it.' },
      { h:'A button invites an action', p:'A link takes you somewhere else; a button triggers something HERE. Right now it does nothing yet — that comes next week.' },
      { h:'BOSS — every block, one real page', p:'Heading, paragraphs, link, button is close to the actual shape of a huge number of real websites.' },
    ],
    realWorld: 'Open any news homepage (BBC, a school website) together: point out the ONE big headline, the body paragraphs underneath, a "read more" link, and a "subscribe" button — the exact same four blocks students are about to use. In Minecraft terms: a crafting recipe book page has exactly this shape too — one item name (heading), a description (paragraph), and a "craft" button.',
    image: { file: 'html5.png', caption: 'The real tag this page-building block stands in for.', credit: 'HTML5 logo — W3C / Patio, CC BY 3.0, via Wikimedia Commons' },
    discoveries: [
      'Before opening the platform: in pairs, look at 2-3 real websites and list which parts are "heading", "paragraph", "link", or "button". Which pages break the "one heading" rule — and does it make them harder to read?',
      'Open Minecraft\'s recipe book (or a screenshot of one) — find its "heading" (item name), its "paragraph" (ingredients list), and anything that acts like a button. Does every page in the game follow this same shape?',
    ] },
  st2: { emoji:'🎨', name:'Story Studio 2 — Style It', sub:'Background, heading colour, alignment, font size — CSS for your page',
    stages:['Paint the Page','Title Colour','Center Stage','Readable Text'], boss:'Style the Front Page',
    concepts:[
      { h:'Content vs. style — two different jobs', p:'Last week\'s blocks decided WHAT is on the page. This week\'s Style blocks decide how it LOOKS — colours, alignment, size.',
        diagram: String.raw`
        \node[draw, thick, minimum width=3cm, minimum height=1.2cm] (a) at (0,0) {WHAT (HTML)};
        \node[draw, thick, fill=cyan!15, minimum width=3cm, minimum height=1.2cm] (b) at (4.5,0) {HOW IT LOOKS (CSS)};
        \draw[->, thick] (a) -- (b) node[midway, above] {\small same content};`,
        worked: 'Worked example: the exact same "My Story" heading, styled two ways — plain black text, or bold cyan text — is still 100% the same HTML content. Only the CSS rule changed.' },
      { h:'A style rule can target ONE kind of block', p:'"Set heading colour" only changes headings — paragraphs stay whatever colour they already were. A targeted rule, not a blanket one.' },
      { h:'Alignment is a choice, not a colour', p:'Unlike colour, alignment only has a few real choices — left, center, right. Centered paragraphs are actually harder to read line-by-line.' },
      { h:'Font size affects real readability', p:'Text that\'s too small is a genuine accessibility problem — real design guidelines set a minimum readable size (commonly 16px).',
        worked: 'Worked example: print "Hello" at 10px and at 24px side by side (or just hold up two phones at different zoom levels) — ask which one someone with poor eyesight could actually read across a room.' },
      { h:'BOSS — HTML gives structure, CSS gives style', p:'Unlike HTML tags, CSS rules apply no matter when you set them — style first or last, the result is identical.' },
    ],
    realWorld: 'Toggle a phone\'s font size / "reader mode" setting live, or compare a site with tiny 10px body text against one with proper 16px+ text — ask which one people would actually keep reading. Minecraft\'s own "resource packs" are exactly this idea at game-scale: the SAME blocks and items (the content), completely re-skinned to look different (the style).',
    image: { file: 'css.png', caption: 'The real language behind every Style block you just used.', credit: 'CSS logo — W3C, public domain, via Wikimedia Commons' },
    discovery: 'Find one website that centers a whole paragraph of body text (not a title). Read it aloud line by line — does the centering make it harder to follow? Why do titles get away with it but paragraphs don\'t?' },
  st3: { emoji:'👆', name:'Story Studio 3 — Make It Click', sub:'onclick — a button that actually does something when pressed',
    stages:['Click to Reveal','Click for More','Both at Once','Button Talks Back'], boss:'The Big Reveal',
    concepts:[
      { h:'onclick — code that waits for a click', p:'Every block before this ran the instant you pressed Run. "When button is clicked" waits, doing nothing, until a real click happens.',
        diagram: String.raw`
        \node[draw, thick, rounded corners, minimum width=2.6cm, minimum height=1cm, fill=cyan!15] (btn) at (0,0) {Button};
        \draw[->, thick] (btn) -- (3,0) node[midway, above] {\small click!};
        \node[draw, thick, minimum width=3cm, minimum height=1cm] (act) at (5,0) {do something};`,
        worked: 'Worked example: nothing inside "when button is clicked" runs when you press Run — it only runs the moment a real click happens, which is why the checker fires one simulated click to test it.' },
      { h:'The same event, a different action', p:'The event ("when clicked") stays the same — what happens inside it is entirely up to you.' },
      { h:'One event, multiple actions', p:'Anything placed inside "when clicked" all runs together, in order, from a single click — no limit to how many blocks you can stack.' },
      { h:'A button can change itself', p:'It\'s easy to assume a button can only affect OTHER things — but it can just as easily change its own label.' },
      { h:'BOSS — structure, style, and behaviour', p:'Week 1 gave structure, Week 2 gave style, Week 3 gives BEHAVIOUR — the same three-part split every real website is built from.' },
    ],
    realWorld: 'Click an "Add to cart" button on a real shopping site — the label changing to "Added \\checkmark" or a counter updating is exactly this week\'s "button talks back" idea, live in production software. A Minecraft crafting-table "craft" button is the same: click it, and it visibly does something (moves items) right there.',
    image: { file: 'js.png', caption: 'The real language behind onclick --- what you just built with blocks.', credit: 'JavaScript logo — Chris Williams, public domain, via Wikimedia Commons' },
    discovery: 'Find a button on any app or website that changes itself when clicked (a like button, a "show password" eye icon, a checkbox). What exactly changes — text, colour, icon? Nothing else on the page needs to change too.' },
  st4: { emoji:'🧠', name:'Story Studio 4 — Remember Things', sub:'Variables — a story that remembers the reader\'s choice',
    stages:['Remember the Choice','Two Details, One Story','The Choice Updates'], boss:'The Choice Remembered',
    concepts:[
      { h:'A variable is a box with a name', p:'A named box holding a value your code can reuse, combine, or change later — the same code works no matter what\'s stored inside.',
        diagram: String.raw`
        \draw[thick, fill=cyan!15] (0,0) rectangle (2.4,-1.2);
        \node at (1.2,-0.6) {item};
        \node[below] at (1.2,-1.4) {\small holds: "a sword"};` },
      { h:'Multiple variables, remembered together', p:'A real interactive story remembers MANY details — which item they picked, which room they\'re in, how much health they have.' },
      { h:'A variable is a box that can CHANGE', p:'`health = health - 20` reads the current value, subtracts 20, then stores the result back — that\'s what makes a variable useful for a story.',
        diagram: String.raw`
        \draw[thick, fill=cyan!15] (0,0) rectangle (2.4,-1.2);
        \node at (1.2,-0.6) {health};
        \node[below] at (1.2,-1.4) {\small 100};
        \draw[->, thick] (2.6,-0.6) -- (4,-0.6) node[midway, above] {\small $-20$};
        \draw[thick, fill=cyan!15] (4.2,0) rectangle (6.6,-1.2);
        \node at (5.4,-0.6) {health};
        \node[below] at (5.4,-1.4) {\small 80};`,
        worked: 'Worked example: Minecraft\'s hunger and health bars are variables exactly like this — hunger starts at 20, drops by a small amount each action, and the game reads the SAME variable every time it draws the bar icons.' },
      { h:'BOSS — a page that remembers', p:'HTML gave structure, CSS gave style, onclick gave behaviour — variables give the page MEMORY.' },
    ],
    realWorld: 'Your shopping cart total, a video\'s "watched 12:34 of 20:00" progress, a game\'s remembered high score between sessions — every one of these is a variable persisting a value. Minecraft\'s hunger bar (20 drumsticks, dropping as you act, refilling as you eat) is a variable your character carries constantly.',
    image: { file: 'ram.jpg', caption: 'RAM is exactly this chapter\'s \'named box that can change\' idea --- a variable, in physical form.', credit: 'RAM modules, public domain (PD-self), via Wikimedia Commons' },
    discovery: 'Name three things a website "remembers" about you between visits (logged-in name, cart items, dark mode setting). For each, is it stored as a variable in that one page-visit, or does it need to persist even after you close the tab?' },
  st5: { emoji:'🔀', name:'Story Studio 5 — Choose a Path', sub:'if/else — a story that branches on the reader\'s choice',
    stages:['Two Endings','Three Paths','Branch on the Click'], boss:'Your Story, Your Ending',
    concepts:[
      { h:'A variable is only useful if something CHECKS it', p:'A variable stores a choice; IF/ELSE is what actually MAKES that choice matter — without a branch, every choice would look the same.',
        diagram: String.raw`
        \draw[thick] (1,1) -- (2,0) -- (1,-1) -- (0,0) -- cycle;
        \node at (1,0) {\small choice?};
        \draw[->, thick] (2,0) -- (3.5,0.8) node[midway, above] {\small brave};
        \draw[->, thick] (2,0) -- (3.5,-0.8) node[midway, below] {\small cautious};
        \node[right] at (3.5,0.8) {\small Ending A};
        \node[right] at (3.5,-0.8) {\small Ending B};` },
      { h:'else if — a genuine third path', p:'Conditions are checked top to bottom, and the FIRST one that\'s true wins — order matters when ranges overlap.' },
      { h:'Branching on a value THAT JUST CHANGED', p:'Update the variable first, THEN check it — get the order backwards and the branch is always one click behind reality.' },
      { h:'BOSS — the whole semester, one real page', p:'Structure, style, behaviour, memory, decisions — a real interactive story needs genuinely all five.' },
    ],
    realWorld: 'A "choose your own adventure" book, a Netflix interactive episode (Bandersnatch), or a game\'s dialogue choice — every branch a reader/player can take is an if/else somewhere in the code. Minecraft villagers branch too: trade with them enough and their dialogue/trades change — a real if/else on a "reputation" variable.',
    discoveries: [
      'Think of a choice-based story or game you know. Sketch its first three branches on paper as boxes and arrows (this is secretly a flowchart) before we build one in code.',
      'In Minecraft, trading with a villager enough times unlocks better trades. What do you think the game is checking each time — and what "branch" fires once you cross that threshold?',
    ] },
  sc1: { emoji:'🕹', name:'Block Arcade 1 — Sprites & the Stage', sub:'Every sprite lives at an (x, y) — coordinates in blocks',
    stages:['Meet Your Sprite','Two Sprites, Two Corners'], boss:'Place Your Cast',
    concepts:[
      { h:'A sprite is just a shape at a position', p:'A "sprite" is any character or object on the stage — under the hood, it\'s a position (x, y) plus something drawn there.',
        diagram: String.raw`
        \draw[thick] (0,0) rectangle (5,-3);
        \filldraw[cyan!70!black] (3.5,-1) circle (3pt);
        \node[right] at (3.5,-1) {\small sprite at (3.5, 1)};` },
      { h:'Naming positions makes them easier to reason about', p:'"Top-left" and "bottom-right" are shorthand for specific (x,y) values — translating a description into coordinates is a skill you\'ll use constantly.' },
      { h:'BOSS — three sprites, three positions', p:'Same skill, just repeated — real Scratch projects often start with exactly this.' },
    ],
    realWorld: 'Open Scratch\'s own stage and drag a sprite around — the x/y readout in the corner is literally the same two numbers this chapter is teaching. Minecraft goes further still: press F3 and you\'ll see your OWN character\'s live X, Y, Z coordinates on screen.',
    discoveries: [
      'On a printed 480x260 grid, mark where you\'d place a sprite for "top-left corner", "dead center", and "bottom-right corner" before touching the platform — compare answers as a class.',
      'If you have access to Minecraft, open the F3 debug screen and walk in one direction. Which of X/Y/Z changes? Which stays the same? (Y is height in Minecraft — different from this chapter\'s 2D y, worth pointing out.)',
    ] },
  sc2: { emoji:'🕹', name:'Block Arcade 2 — Motion & Repeat', sub:'"Repeat" blocks — do something several times without copy-pasting',
    stages:['Repeat 3 Times','Marching Line'], boss:'Bouncing Sprite',
    concepts:[
      { h:'Repeat — do it without repeating yourself', p:'"Repeat 3" scales — drawing 30 sprites by hand would mean 30 blocks, while a repeat block handles any number.',
        diagram: String.raw`
        \draw[->, thick] (0,0) arc (90:360:0.6);
        \node at (0,-0.6) {\small repeat};
        \node[right] at (1,-0.6) {\small (do the same steps N times)};` },
      { h:'A variable changing INSIDE a loop', p:'Changing x by 80 each pass through the loop is what actually spaces the sprites out.',
        worked: 'Worked example: repeat 5 times, changing x by 80 each pass, starting at x=20, places sprites at x = 20, 100, 180, 260, 340 — five different positions from ONE block stacked once.' },
      { h:'BOSS — movement is a variable changing every frame', p:'"On every frame" is a repeat block that never stops. That\'s genuinely what ALL motion in ALL games actually is.' },
    ],
    realWorld: 'A marching band or a row of parked cars, evenly spaced — the spacing pattern (each one a fixed distance from the last) is the exact "loop + changing variable" idea. Minecraft building a straight fence or a row of torches is the same repeat pattern, just done by hand instead of by a loop.',
    image: { file: 'gear.jpg', caption: 'A gear does the same defined turn every time it\'s driven --- like a loop repeating the same steps.', credit: 'Fixed gear cog — John Reaves, public domain, via Wikimedia Commons' },
    discovery: 'Watch any 2D platformer character walk for 10 seconds. Roughly how many times does it "step" a tiny bit? Movement that looks smooth is secretly hundreds of small repeats — try to spot the individual frames.' },
  sc3: { emoji:'🕹', name:'Block Arcade 3 — Events', sub:'Keys are events — the stage reacts to what the player presses',
    stages:['Press to Move','Jump on Space'], boss:'Full Control',
    concepts:[
      { h:'Checking a key is a question, asked every frame', p:'Placed inside "on every frame", a key check is asked 60 times a second — that\'s what makes a held-down key feel like smooth movement.' },
      { h:'Any key can trigger any action', p:'Space isn\'t special — it\'s just another key. What makes it feel like a "jump" is purely what you put inside the if.' },
      { h:'BOSS — four keys, four directions', p:'Each arrow key gets its OWN separate if — pressing two at once genuinely moves the sprite diagonally, for free.',
        diagram: String.raw`
        \node at (0,0) {\small W (up)};
        \node at (0,-2) {\small S (down)};
        \node at (-1.5,-1) {\small A (left)};
        \node at (1.5,-1) {\small D (right)};
        \draw[->, thick] (0,-0.3) -- (0,-1.7);
        \draw[->, thick] (-1.2,-1) -- (1.2,-1);
        \node at (0,-1) {\small +};` },
    ],
    realWorld: 'A car\'s cruise control constantly re-checking your foot on the brake, or a lift constantly checking if a floor button is pressed — both are "ask the same question every moment", not a one-time check. Minecraft\'s own WASD + Space controls are literally this chapter\'s pattern — each key its own independent check, which is exactly why you can strafe (A/D) while jumping (Space) at the same time.',
    image: { file: 'keyboard.jpg', caption: 'Every \'key pressed?\' check this chapter teaches is a real key on a real board like this.', credit: 'Computer keyboard, public domain, via Wikimedia Commons' },
    discovery: 'Try holding two arrow keys at once in any real game (or your phone\'s on-screen d-pad), or W+Space in Minecraft. Does the character move diagonally / jump-forward? What would the code need to allow that — one if, or two separate ifs?' },
  sc4: { emoji:'🕹', name:'Block Arcade 4 — Variables', sub:'Score and lives — numbers the game tracks and shows the player',
    stages:['Score Counter','Score Goes Up'], boss:'Score & Lives HUD',
    concepts:[
      { h:'A variable the PLAYER can see', p:'A score no one can see isn\'t really a score to the player — drawing it every frame turns an internal number into a real scoreboard.' },
      { h:'Redrawing every frame keeps the display current', p:'Because the display re-reads the variable fresh every frame, it always shows whatever score currently IS.' },
      { h:'BOSS — a real two-stat HUD', p:'Score AND lives, shown together, is genuinely what almost every simple arcade game\'s display actually is.',
        diagram: String.raw`
        \node[draw, thick, fill=cyan!15, minimum width=2cm, minimum height=1cm] at (0,0) {Score: 120};
        \node[draw, thick, fill=cyan!15, minimum width=2cm, minimum height=1cm] at (2.6,0) {Lives: 3};` },
    ],
    realWorld: 'Any arcade game\'s top-of-screen HUD (score, lives, timer) — point at three different real games\' HUDs and identify which numbers are tracked as variables. Minecraft\'s hotbar (which item is selected), hunger bar, and health hearts are all live variables displayed every frame, exactly like this chapter\'s HUD.',
    image: { file: 'arcade.jpg', caption: 'A real HUD --- score and lives --- on a real arcade cabinet.', credit: 'Arcade controller — Carioca, CC BY-SA 3.0, via Wikimedia Commons' },
    discovery: 'Screenshot or sketch three different games\' HUDs (including Minecraft\'s). What numbers do they ALL show? What\'s unique to just one of them (a timer, ammo count, a combo multiplier, Minecraft\'s armor bar)?' },
  sc5: { emoji:'🕹', name:'Block Arcade 5 — If/Else', sub:'Rules that check a condition — a wall, an edge, a win',
    stages:['Touching the Edge','Win Message'], boss:'Game Rules',
    concepts:[
      { h:'A rule that only fires past a threshold', p:'There\'s no special "edge" concept in code — `x > 400` IS the edge. Any boundary in a real game is built from exactly this.' },
      { h:'IF can replace what\'s shown, not just add to it', p:'"You Win!" and the running score are in different branches of the same if/else — only one is ever drawn on a given frame.',
        diagram: String.raw`
        \draw[thick] (1,1) -- (2,0) -- (1,-1) -- (0,0) -- cycle;
        \node at (1,0) {\small won?};
        \draw[->, thick] (2,0) -- (3.5,0.7) node[midway, above] {\small yes};
        \node[right] at (3.5,0.7) {\small "You Win!"};
        \draw[->, thick] (2,0) -- (3.5,-0.7) node[midway, below] {\small no};
        \node[right] at (3.5,-0.7) {\small show score};` },
      { h:'BOSS — every Block Arcade idea, one sprite', p:'Coordinates, loops, key events, variables, if/else — every idea combines here into something genuinely close to a tiny real game.' },
    ],
    realWorld: 'A car\'s parking sensor beeping only once you\'re within a set distance of a wall — the "beep" only fires past a threshold, exactly like this chapter\'s edge check. In Minecraft, fall damage only triggers past a height threshold — no damage for a 1-block drop, real damage past ~3 blocks — the exact same "past a threshold" rule.',
    discovery: 'Play any simple browser game (or recall Minecraft fall damage) for two minutes and try to spot its "win"/"damage" condition and its "you hit a wall" condition. What number do you think each one is checking against?' },
  g1: { emoji:'🚀', name:'G1 — Sprite Start', sub:'Coordinates, sequences — draw and move your first sprite',
    stages:['First Sprite','Four Corners','Rectangle Room','Three in a Row'], boss:'Sprite Follows You',
    concepts:[
      { h:'Coordinates — every sprite has an (x, y)',
        p:'x (how far right), y (how far down) — y grows DOWN, the opposite of a maths graph. Everything you build this year comes back to these two numbers.',
        diagram: String.raw`
        \draw[->, thick] (0,0) -- (5,0) node[right] {$x \to$};
        \draw[->, thick] (0,0) -- (0,-3) node[below] {$y \downarrow$};
        \filldraw[cyan!70!black] (3,-2) circle (2.5pt);
        \node[right] at (3,-2) {(x, y)};
        \node[left] at (-0.1,0.1) {(0,0)};`,
        worked: 'Worked example: a sprite at x=3, y=2 is 3 steps RIGHT of the left edge and 2 steps DOWN from the top edge — never "2 up", because y only ever counts downward on this canvas.' },
      { h:'Reading coordinates precisely',
        p:'"Draw 4 things" and "draw 4 things in specific places" are very different tasks — real challenges almost always care about WHERE, not just how many.',
        diagram: String.raw`
        \draw[thick] (0,0) rectangle (6,-3);
        \filldraw[orange] (0.4,-0.4) circle (2.5pt) node[below right] {(20,20)};
        \filldraw[orange] (5.6,-0.4) circle (2.5pt) node[below left] {(440,20)};
        \filldraw[orange] (0.4,-2.6) circle (2.5pt) node[above right] {(20,220)};
        \filldraw[orange] (5.6,-2.6) circle (2.5pt) node[above left] {(440,220)};
        \node at (3,-1.5) {\small 480 x 260 canvas};`,
        worked: 'Worked example: "top-left" isn\'t (0,0) exactly — it\'s (20,20), a small margin in from the true edge, so a sprite isn\'t drawn half off-screen.' },
      { h:'Rectangles need FOUR numbers, not two',
        p:'A rectangle needs a position AND a size (width, height) — four numbers instead of a circle\'s three.',
        diagram: String.raw`
        \draw[thick, fill=cyan!10] (1,-1) rectangle (4,-2.5);
        \filldraw (1,-1) circle (1.5pt);
        \node[above left] at (1,-1) {(x,y)};
        \draw[<->] (1,-0.6) -- (4,-0.6) node[midway,above] {\small width};
        \draw[<->] (4.4,-1) -- (4.4,-2.5) node[midway,right] {\small height};`,
        worked: 'Worked example: a 100x50 rectangle at (200,80) occupies from x=200 to x=300, and from y=80 to y=130 — the (x,y) is always the corner, never the centre.' },
      { h:'Sequence — same Y, different X',
        p:'Three shapes "in a line" means one coordinate stays the SAME while the other changes — a huge amount of real layout is exactly this.',
        diagram: String.raw`
        \draw[dashed, gray] (0,-1) -- (6,-1);
        \filldraw[cyan!70!black] (1,-1) circle (2.5pt) node[above] {\small (80, Y)};
        \filldraw[cyan!70!black] (3,-1) circle (2.5pt) node[above] {\small (240, Y)};
        \filldraw[cyan!70!black] (5,-1) circle (2.5pt) node[above] {\small (400, Y)};
        \node[below] at (3,-1.3) {\small same Y, different X};` },
      { h:'BOSS — coordinates that update every frame',
        p:'"On every frame" re-runs its contents dozens of times a second — clear, then redraw, every frame, is the engine behind every animated game.',
        diagram: String.raw`
        \node at (0.9,-1) {$\times$ mouse};
        \draw[->, thick] (1.3,-1) .. controls (2,-0.4) .. (3,-1);
        \filldraw[cyan!70!black] (3,-1) circle (3pt);
        \node[below] at (3,-1.4) {\small sprite, redrawn every frame};` },
    ],
    realWorld: 'Your phone\'s touchscreen reporting exactly WHERE you tapped (not just THAT you tapped) — every touch event carries an (x, y), same idea as this chapter\'s sprite position.',
    discoveries: [
      'On paper, draw a 480x260 rectangle. Mark where (0,0), (240,130), and (479,259) actually land. Which corner is (0,0) — and why might that surprise someone used to maths graphs?',
      'How do you actually choose WHICH corner is "the" corner for a rectangle? Try this before opening the platform: agree as a class that (x,y) always means the TOP-LEFT corner — then everyone should get the same answer for where a 100x50 box at (200,80) ends.',
      'Live demo — a moving cursor readout: open grade7-coord-cursor.html (in this same lessons folder) and project it. Move your mouse around the grid and read the live (x,y) label out loud as you go — this answers "how do I know where I even am" before anyone touches real code.',
    ] },
  g2: { emoji:'🎚', name:'G2 — Variables & State', sub:'Score, health, timers — numbers that change',
    stages:['Colour Square','Growing Circle','Health Bar'], boss:'Clicker Upgrade',
    concepts:[
      { h:'Variables — a named box that can change', p:'r, g, b hold numbers 0-255 for red/green/blue — using a variable READS its value; only a "set"/"change" block updates it.' },
      { h:'One variable, many uses', p:'Change size once, and every place that reads it shows the new value — that\'s the whole point of variables.' },
      { h:'A variable driving TWO different things', p:'health drives a bar\'s WIDTH directly — the "one variable, automatically reflected in visuals" pattern behind every health/progress bar.',
        diagram: String.raw`
        \draw[thick] (0,0) rectangle (5,-0.6);
        \draw[thick, fill=green!60!black] (0,0) rectangle (3,-0.6);
        \node[right] at (5.1,-0.3) {\small health = 60};`,
        worked: 'Worked example: health at 100 draws a full-width bar; health at 20 draws a bar only one-fifth as wide — the SAME width calculation (health / max * barWidth) every single frame, no special "low health" case needed.' },
      { h:'BOSS — a variable that changes over time', p:'A variable, a frame loop, and an IF working together — score only rises when Space is held.' },
    ],
    realWorld: 'Any RPG or shooter\'s health bar visibly shrinking as you take damage — the bar\'s pixel width is driven directly by one number, exactly like this chapter\'s health-bar challenge. Minecraft\'s ten hearts are the same idea drawn as icons instead of a bar — hearts remove as the health variable drops.',
    discovery: 'Find a game with a visible health or loading bar. Watch it shrink or fill — does it move in smooth small steps, or big jumps? What does that tell you about how often the variable is being redrawn?' },
  g3: { emoji:'🚦', name:'G3 — Decisions', sub:'Touching? Score > 10? Out of bounds?',
    stages:['Traffic Light','Big or Small','Danger Zone'], boss:'Dodge at the Edges',
    concepts:[
      { h:'IF/ELSE — choosing between paths', p:'An IF only runs when a condition is true. Chaining IF/ELSE IF/ELSE picks between three outcomes — only one branch ever runs.',
        diagram: String.raw`
        \filldraw[red] (0,0) circle (5pt);
        \filldraw[orange] (0,-0.7) circle (5pt);
        \filldraw[green!60!black] (0,-1.4) circle (5pt);
        \node[right] at (0.3,0) {\small light = 1};
        \node[right] at (0.3,-0.7) {\small light = 2};
        \node[right] at (0.3,-1.4) {\small light = 3};` },
      { h:'Comparisons — greater than, not just equal', p:'"Bigger than 50" covers a whole RANGE. Deciding exactly where a boundary sits is a real, common source of bugs ("off-by-one" errors).' },
      { h:'Combining a variable, IF, and drawing', p:'Comparing a changing value against a fixed threshold — the exact pattern you\'ll build on properly in G6, Collision & Physics.' },
      { h:'BOSS — multiple IFs, one per key', p:'Each arrow key needs its OWN if — checking every single frame is what makes movement feel continuous, not jumpy.' },
    ],
    realWorld: 'A real traffic light\'s three states (red/amber/green) is literally an if/else-if/else chain in the controller software — same three-way branch this chapter teaches. Minecraft redstone comparators/repeaters build these same IF-style circuits entirely out of blocks, no typed code at all.',
    image: { file: 'traffic.jpg', caption: 'A real three-way branch --- red, amber, green --- running on if/else logic.', credit: 'LED traffic lights, public domain (PD-self), via Wikimedia Commons' },
    discovery: 'Find a real rule with a fuzzy boundary (is a "tall" person over 180cm? over 175cm?). Where would YOU draw the line, and would someone exactly on that line be included or not? This is exactly the off-by-one problem in code.' },
  g4: { emoji:'🧰', name:'G4 — My Blocks', sub:'jump(), shoot(), spawnEnemy() — powers you define',
    stages:['spawnEnemy()','shoot()','powerUp()'], boss:'Platformer Vertical Slice',
    concepts:[
      { h:'Functions — reusable named blocks', p:'A function is defined ONCE with parameters, then CALLED many times with different values — one definition, many different outcomes.',
        diagram: String.raw`
        \node[draw, thick, minimum width=3.4cm, minimum height=1cm, fill=cyan!15] (f) at (0,0) {spawnEnemy(x, y)};
        \draw[->, thick] (f) -- (-2.6,-1.4) node[left]{\small call(50, 80)};
        \draw[->, thick] (f) -- (0,-1.4) node[below]{\small call(200, 80)};
        \draw[->, thick] (f) -- (2.6,-1.4) node[right]{\small call(350, 80)};`,
        worked: 'Worked example: Minecraft\'s /function command (a real, named, reusable set of commands you can "call" from anywhere) is the exact same idea this chapter teaches — define once, invoke many times.' },
      { h:'A parameter that changes behaviour', p:'A true/false parameter can make the FUNCTION ITSELF decide what to draw, using an IF inside its own definition.' },
      { h:'A text parameter, not just numbers', p:'Parameters can carry any type of value — numbers, true/false, or text — the function\'s job is always to use whatever was passed in.' },
      { h:'BOSS — planning in pseudocode BEFORE building', p:'Writing the logic in plain English first is called pseudocode — real programmers do this constantly for anything fiddly, like jump physics.' },
    ],
    realWorld: 'A recipe you cook many times (make pancakes) is a "function" — the same steps, but the exact ingredients (parameters) change each time depending on how many people you\'re feeding. Minecraft\'s own crafting recipes are functions too: the SAME recipe (function) run with different wood types (the parameter) gives an oak vs. a birch door.',
    image: { file: 'gear.jpg', caption: 'A gear always does the same defined turn no matter what drives it --- call a function as many times as you want, same job, different result depending on what\'s passed in.', credit: 'Fixed gear cog — John Reaves, public domain, via Wikimedia Commons' },
    discoveries: [
      'Think of something you do repeatedly with small variations (making a sandwich, getting ready for school). Write the general steps once, then note which parts change each time (the "parameters").',
      'Pick any Minecraft recipe that works with more than one material (a door, a boat, tools). What stays exactly the same across every version, and what\'s the "parameter" that changes?',
    ] },
  g5: { emoji:'⌨️', name:'G5 — Player Control', sub:'Keyboard + mouse input schemes, aiming',
    stages:['Move with Arrow Keys','Aim with the Mouse','Two-Player Split'], boss:'Top-Down Shooter Controls',
    concepts:[
      { h:'Keyboard input — four separate checks', p:'Checking all four arrow keys means four separate IF blocks — small changes every frame LOOK like smooth continuous movement.' },
      { h:'Mouse position — always available, live', p:'mouseX()/mouseY() always report the CURRENT position, live — nothing to set or update, the engine tracks it automatically.',
        diagram: String.raw`
        \draw[thick] (0,0) rectangle (5,-3);
        \node at (2,-1.6) {$+$};
        \node[below right] at (2,-1.6) {\small mouseX(), mouseY()};` },
      { h:'Two independent things, same frame loop', p:'Two players need two SEPARATE sets of variables — a single loop can control multiple independent things at once.' },
      { h:'BOSS — networking scale: PAN to LAN to WAN', p:'A keyboard+mouse on one PC is a PAN; school wifi is a LAN; the whole internet is a WAN — same idea, three different scales.' },
    ],
    realWorld: 'A split-screen couch co-op game (two controllers, two characters on one screen) is exactly this chapter\'s "two independent input schemes, one frame loop" idea, running in a real shipped game. Minecraft moves with WASD (keyboard) while the mouse independently aims/looks around — the exact keyboard+mouse split this chapter teaches.',
    image: { file: 'keyboard.jpg', caption: 'The real keyboard half of this chapter\'s keyboard+mouse control scheme.', credit: 'Computer keyboard, public domain, via Wikimedia Commons' },
    discovery: 'Play any game with both keyboard movement AND mouse aiming (Minecraft included). Try to notice: does moving affect aiming, or are they genuinely independent? What would break if they shared one set of variables?' },
  g6: { emoji:'💥', name:'G6 — Collision & Physics', sub:'Hitboxes, bouncing, gravity, knockback',
    stages:['Hitbox Check','Bounce & Gravity','Knockback'], boss:'Breakout Clone',
    concepts:[
      { h:'The distance formula — real Pythagoras', p:'`dist = sqrt((x2-x1)^2 + (y2-y1)^2)` — literally Pythagoras\' theorem, applied to two circle centres.',
        diagram: String.raw`
        \draw[thick] (0,0) circle (0.4);
        \node at (0,0) {\tiny A};
        \draw[thick] (3,-2) circle (0.4);
        \node at (3,-2) {\tiny B};
        \draw[dashed] (0,0) -- (3,-2) node[midway, above] {\small dist};
        \draw[dashed, gray] (0,0) -- (3,0) -- (3,-2);
        \node[above] at (1.5,0) {\small $\Delta x$};
        \node[right] at (3,-1) {\small $\Delta y$};` },
      { h:'Gravity and bouncing — physics as a loop', p:'Increase velocity by a small amount EVERY frame to simulate gravity — no complicated physics engine needed.',
        worked: 'Worked example: velocity starts at 0, gains +0.5 every frame from gravity — after 10 frames it\'s 5, after 20 frames it\'s 10 — the ball falls FASTER over time, exactly like a real dropped object accelerating.' },
      { h:'Combining collision detection with movement', p:'"Detect, then react" — check for a condition (collision), then DO something as a direct result (bounce away).' },
      { h:'BOSS — linear search through an array', p:'An array stores a whole list under one name — checking each item one at a time, in order, is called a linear search.' },
    ],
    realWorld: 'A basketball\'s arc and bounce follows the exact same idea — gravity constantly pulling it down (velocity increasing each moment) until it hits the floor and reverses. Minecraft has real block physics too — sand and gravel actually fall when unsupported, using this exact gravity-as-a-loop idea (just without the bounce).',
    image: { file: 'bounce.jpg', caption: 'Each bounce loses a little height --- exactly the energy loss this chapter\'s Bounce & Gravity code simulates.', credit: 'Bouncing ball strobe photo — MichaelMaggs / Richard Bartz, CC BY-SA 3.0, via Wikimedia Commons' },
    discovery: 'Drop a ball (real or a video of one bouncing) and watch closely: does each bounce go exactly as high as the last, or does it lose a little height each time? What in the code (Bounce & Gravity) causes that?' },
  g7w: { emoji:'🎬', name:'G7 — Game States', sub:'Menu → playing → paused → game-over → win',
    stages:['The State Variable','Switching States','Pause Overlay'], boss:'Full Game Loop w/ Screens',
    concepts:[
      { h:'A state is just a variable holding text', p:'What makes it a "state machine" is using IF/ELSE to draw a completely different screen depending on what the variable currently holds.',
        diagram: String.raw`
        \node[draw, thick, minimum width=2.2cm, minimum height=1cm, fill=cyan!15] (m) at (0,0) {menu};
        \node[draw, thick, minimum width=2.2cm, minimum height=1cm, fill=cyan!15] (p) at (3.2,0) {playing};
        \node[draw, thick, minimum width=2.2cm, minimum height=1cm, fill=cyan!15] (g) at (6.4,0) {gameover};
        \draw[->, thick] (m) -- (p) node[midway, above]{\small start};
        \draw[->, thick] (p) -- (g) node[midway, above]{\small lose};` },
      { h:'A condition that changes the state itself', p:'The game changes its own state variable based on a condition — this self-modifying behaviour is exactly how real games transition between screens.' },
      { h:'A flag that gates everything else', p:'A true/false "paused" variable draws an overlay on top — whatever you draw LAST appears on top of everything drawn before it.' },
      { h:'BOSS — a real, multi-state machine', p:'menu to playing to gameover, each transition triggered by a real condition — the exact pattern behind every real video game\'s screen flow.' },
    ],
    realWorld: 'Every app you use has "states": a login screen, a loading spinner, the main screen, an error message — the same menu/playing/paused/gameover idea, just with different names. Minecraft has this too: title screen, world-loading screen, playing, the ESC pause menu, and the respawn/death screen are all states of ONE running program.',
    image: { file: 'traffic.jpg', caption: 'Three distinct states --- red, amber, green --- the same idea as menu/playing/paused.', credit: 'LED traffic lights, public domain (PD-self), via Wikimedia Commons' },
    discovery: 'List every distinct "screen" Minecraft (or any game) shows you from opening the app to actually playing (splash screen, menu, loading, playing, pause, death/game over). How many states is that, really?' },
  g8: { emoji:'🤖', name:'G8 — Smart NPCs', sub:'Enemies that chase, flee, patrol; a rule-based chatbot',
    stages:['Chase the Player','Patrol Pattern','Rule-Based Chatbot'], boss:'Enemy with 3 Behaviours',
    concepts:[
      { h:'"AI" made entirely of comparisons', p:'Comparing two positions and nudging one closer, every frame, creates the ILLUSION of hunting — there\'s no real intelligence, just a repeated comparison.' },
      { h:'A direction variable that flips', p:'Storing "which way" as +1 or -1, flipped at a boundary, creates an endless back-and-forth patrol from one variable and two conditions.',
        diagram: String.raw`
        \draw[->, thick] (0,0) -- (3,0);
        \draw[->, thick] (3,-0.7) -- (0,-0.7);
        \node[above] at (1.5,0) {\small direction = +1};
        \node[below] at (1.5,-0.7) {\small direction = -1};` },
      { h:'Matching text — the simplest kind of "AI"', p:'A rule-based chatbot is just a chain of exact text comparisons, each with its own canned reply — genuinely what early chatbots were.' },
      { h:'BOSS — rules vs. real machine learning', p:'Every behaviour here is a rule YOU wrote. Real ML is different: instead of a human writing rules, the system is shown examples and works out its OWN rules.',
        diagram: String.raw`
        \draw[thick] (0,0) circle (0.9);
        \draw[thick] (0,0) circle (1.8);
        \draw[thick] (0,0) circle (2.7);
        \node at (0,0) {\tiny flee};
        \node at (0,-1.3) {\tiny chase};
        \node at (0,-2.2) {\tiny patrol};` },
    ],
    realWorld: 'An automated customer-service chat that only understands exact phrases ("Track my order") and fails on anything slightly different is a real rule-based chatbot, exactly like this chapter\'s. Minecraft mobs are the clearest real-world version of this whole chapter: zombies chase within a distance (chase), iron golems patrol villages, and a chatbot-style villager only "understands" exact trade offers — all rules, no learning.',
    image: { file: 'robot.jpg', caption: 'A real industrial robot --- every motion programmed by hand, exactly like this chapter\'s rule-based NPCs.', credit: 'Industrial robot — KUKA Roboter GmbH / Jo Teichmann, public domain, via Wikimedia Commons' },
    discoveries: [
      'Try a simple customer-service chatbot online (a bank, a shop) and type something slightly unusual. Does it understand, or does it fail and repeat a canned response? What does that tell you about how it\'s built?',
      'Watch a Minecraft zombie or spider from a safe distance, then get close. At roughly what distance does it notice and start chasing? That switch is exactly this chapter\'s distance-based if/else-if/else.',
    ] },
  g9w: { emoji:'💬', name:'G9 — Strings & Dialogue', sub:'Player names, dialogue trees, high-score tables',
    stages:['Player Name & ASCII','Dialogue Tree','Shout Mode'], boss:'RPG Dialogue Scene',
    concepts:[
      { h:'Strings — text is just data too', p:'Every character is secretly a number (ASCII) — "H" is 72, "A" is 65. Text and numbers aren\'t as different as they look.' },
      { h:'Comparing text to branch a conversation', p:'`===` works on text just like on numbers — the entire mechanism behind a dialogue tree: compare a choice, branch to different text.',
        diagram: String.raw`
        \node[draw, thick, minimum width=2.4cm] (a) at (0,0) {"Trade?"};
        \draw[->, thick] (a) -- (-2,-1.3) node[left]{\small "Yes"};
        \draw[->, thick] (a) -- (2,-1.3) node[right]{\small "No"};
        \node[below left] at (-2,-1.3) {\small open shop};
        \node[below right] at (2,-1.3) {\small "Maybe later"};` },
      { h:'String methods — transforming text', p:'`.toUpperCase()` returns a NEW version — it doesn\'t modify the original variable. String methods almost always hand back a new result.' },
      { h:'BOSS — text, arrays, and a loop, together', p:'An array of {name, score} objects is a real, proper data table — looping through it is exactly how every leaderboard works.' },
    ],
    realWorld: 'Any RPG\'s dialogue choices ("Attack" / "Defend" / "Run") branching to different outcomes, and a game\'s online leaderboard listing name+score pairs, are both exactly this chapter\'s ideas in shipped games. Minecraft villager trading menus are a real dialogue tree too — compare your held item\'s name against what the villager wants, branch to "trade accepted" or not.',
    discovery: 'Play (or recall) a game with dialogue choices (or a Minecraft villager trade). Pick one branch and trace it: what text comparison do you think the code is making to decide which reply you see?' },
  gsafe: { emoji:'🛡️', name:'Security Lab — Spot the Scam', sub:'Real online safety: scam messages, stranger danger, and phishing links',
    stages:['Too Good to Be True','Strangers Never Need Your Address','The "Free Skins" Trap'], boss:'Build a Scam Checker',
    concepts:[
      { h:'A surprise free prize is the #1 real scam sign', p:'Real companies do not give away expensive prizes to random strangers who never entered anything — the free prize is the bait, not a real gift. `isScam` set to true, checked by a real if/else, is exactly how a real spam filter works underneath.' },
      { h:'Friendly in chat does not mean safe in real life', p:'Someone you only know from an online game has NO real reason to need your address, school, or real name — asking for these is a genuine red flag, even if they seem friendly. There is no way to verify who someone really is over game chat.' },
      { h:'A "free skins" site exists to steal your password', p:'Sites promising free skins in exchange for "logging in with your real account" are built to capture your actual password the instant you type it — a genuinely common real scam aimed specifically at gamers. Only the game\'s own official site or app is ever safe.' },
      { h:'BOSS — combining every red flag into one real check', p:'A stranger AND a free offer together is a stronger warning than either alone — combining two variables in one if/else genuinely mirrors how real scam/spam filters weigh several signals together, not just one.' },
    ],
    image: { file: 'padlock.jpg', caption: 'What a real password is actually protecting --- exactly what a fake "free skins" site is trying to steal.', credit: 'Padlock — Alyson Hurt, CC BY 2.0, via Wikimedia Commons' },
    realWorld: 'A message promising a free prize "just for clicking" uses the exact same bait-and-hook pattern as a real phishing email — designed to get a click before you think. A fake "free V-Bucks generator" asking you to log in first is a genuine, extremely common real scam, not a hypothetical one.',
    discoveries: [
      'Has anyone you know ever gotten a message online promising something free in exchange for personal info or a login? What made it feel suspicious (or NOT feel suspicious at first)?',
      'Look at a real login page for a game or app you use. What would be different about a FAKE version of that same page trying to steal your password?',
    ] },
  g10: { emoji:'🏆', name:'G10 — Design & Capstone', sub:'Plan → build → test → ship YOUR game',
    stages:['Design Your Game','Score & Win Screen'], boss:'Ship Your Own Game',
    concepts:[
      { h:'Planning BEFORE building', p:'A clear, checkable win condition ("reach 20 points") is easier to build AND test than a vague goal like "make it fun".' },
      { h:'Live, updating feedback for the player', p:'Redrawing the score every frame means you never have to manually "update" the display — it always reflects the current value.' },
      { h:'FINAL BOSS — everything from the whole year', p:'A state machine, player input, a win condition, and at least one function you define — every major idea, combined into a game YOU designed.',
        diagram: String.raw`
        \node[draw, thick, minimum width=2cm] at (0,0.9) {state};
        \node[draw, thick, minimum width=2cm] at (0,0) {input};
        \node[draw, thick, minimum width=2cm] at (0,-0.9) {win check};
        \node[draw, thick, minimum width=2cm] at (0,-1.8) {function};
        \node[draw, very thick, minimum width=3.2cm, minimum height=3.6cm, fill=cyan!10] at (3.2,-0.45) {YOUR GAME};` },
      { h:'Playtest, then iterate', p:'Real developers ALWAYS playtest and adjust at least once — a first draft is rarely the final version.' },
    ],
    realWorld: 'Every shipped game went through exactly this: a design document, a build, a playtest, then changes based on what real players actually did — not what the designer assumed they\'d do. Minecraft itself is still playtested and balanced this way every update (mob health, drop rates, tool durability all get tuned from real player data).',
    discovery: 'Before opening the platform: sketch your game idea on paper — one sentence for "how do you win", and one sketch of what the screen looks like. Trade with a partner and ask: is the win condition actually checkable?' },
}

const ORDER = ['st1','st2','st3','st4','st5','sc1','sc2','sc3','sc4','sc5','g1','g2','g3','g4','g5','g6','g7w','g8','g9w','gsafe','g10']

// Colorful, kid-friendly accent per arc of the course (same idea as
// Grade 9's per-section theme) — Story Studio / Block Arcade / Game
// Maker each read as a visually distinct "world" on top of Madrid.
const SECTION_COLOR = {
  story:  'violet!70!purple',   // Story Studio (st*): playful purple
  arcade: 'orange!85!red',      // Block Arcade (sc*): arcade orange
  maker:  'blue!70!cyan',       // Game Maker proper (g*): bright blue
  safety: 'red!75!black',       // Security Lab (gsafe): serious red
}
function sectionFor(id) {
  if (id.startsWith('st')) return 'story'
  if (id.startsWith('sc')) return 'arcade'
  if (id.startsWith('gsafe')) return 'safety'
  return 'maker'
}

const PREAMBLE_HEAD = String.raw`\documentclass[aspectratio=169]{beamer}
\usetheme{Madrid}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{tikz}
\usepackage{amssymb}
\usepackage{graphicx}
\setbeamertemplate{navigation symbols}{}
`
function preambleFor(section) {
  const c = SECTION_COLOR[section]
  return PREAMBLE_HEAD + String.raw`\setbeamercolor{title}{fg=white,bg=${c}}
\setbeamercolor{frametitle}{fg=white,bg=${c}}
\setbeamercolor{block title}{bg=${c}!20,fg=black}
\setbeamercolor{block body}{bg=${c}!8,fg=black}
\setbeamercolor{item}{fg=${c}}
\setbeamercolor{itemize item}{fg=${c}}
\setbeamertemplate{itemize item}[triangle]
`
}

// Splits one prose sentence/paragraph into 2+ real bullet points on an
// em-dash boundary (" — " or " --- " once escaped) — turns existing,
// already-verified explanation text into genuine itemize bullets rather
// than a wall of prose, without rewriting the underlying facts.
function toBullets(text) {
  const parts = text.split(/\s+—\s+/).map(s => s.trim()).filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
  return parts.length > 1 ? parts : [text]
}

// One flat file per chapter (latex/grade7/<id>.tex) — reverted from the
// one-folder-per-chapter/one-file-per-lesson split back to this, per
// explicit request, while keeping everything from that detour: real
// credited images (images/...), diagrams, worked examples, and multi-
// discovery chapters.

function chapterTex(id) {
  const d = DECKS[id]
  const stageItems = d.stages.map(s => '        \\item ' + esc(s)).join('\n')
  const conceptFrames = d.concepts.map(c => {
    // Bullets, not prose: explicit c.bullets wins; otherwise auto-split c.p
    // on its em-dash boundary. c.worked (an existing worked example) folds
    // in as one more bullet on the SAME slide — real extra depth from
    // content already written, not a separate thin frame.
    const bullets = (c.bullets || toBullets(c.p)).slice()
    if (c.worked) bullets.push('Worked example: ' + c.worked.replace(/^Worked example:\s*/, ''))
    const bulletItems = bullets.map(b => '        \\item ' + md(b)).join('\n')
    const diagramBlock = c.diagram ? String.raw`

    \begin{center}
    \begin{tikzpicture}[scale=0.9]
${c.diagram}
    \end{tikzpicture}
    \end{center}` : ''
    return String.raw`
\begin{frame}{${md(c.h)}}
    \large
    \begin{itemize}
${bulletItems}
    \end{itemize}${diagramBlock}
\end{frame}
`
  }).join('\n')

  // d.image: a real, verified, credited photo (see images/ folder and
  // images/CREDITS.md) — no video suggestion. Chapters without a
  // well-fitting real photo simply have no image frame (their existing
  // TikZ diagram carries the visual instead) rather than force one in.
  const imageFrame = d.image ? String.raw`
\begin{frame}{Image}
    \begin{center}
    \includegraphics[width=0.5\textwidth]{images/${d.image.file}}

    \large ${md(d.image.caption)}

    \small ${md(d.image.credit)}
    \end{center}
\end{frame}
` : ''

  // Support either one `discovery` string (most chapters) or a `discoveries`
  // array (a deeper chapter, spreading several prompts across the deck).
  const discoveryFrames = (d.discoveries || [d.discovery]).map((text, i) => String.raw`
\begin{frame}{Let Them Discover${d.discoveries ? ' (' + (i + 1) + '/' + d.discoveries.length + ')' : ''}}
    \Large
    ${md(text)}
\end{frame}
`).join('\n')

  const realWorldItems = (Array.isArray(d.realWorld) ? d.realWorld : toBullets(d.realWorld))
    .map(t => '        \\item ' + md(t)).join('\n')

  return preambleFor(sectionFor(id)) + String.raw`
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
\begin{frame}{Real-World Examples}
    \large
    \begin{itemize}
${realWorldItems}
    \end{itemize}
\end{frame}

${imageFrame}${discoveryFrames}
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
