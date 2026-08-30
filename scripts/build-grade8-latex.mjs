// Generates one Beamer (.tex) teacher presentation per Grade 8 chapter into
// latex/grade8/. Teacher-only deliverable — same pattern as
// scripts/build-grade7-latex.mjs: real-world examples, real credited
// images (no video slides), TikZ diagrams, worked examples, discovery
// prompts. One flat .tex file per chapter (not split into per-lesson
// files — reverted back to this shape for Grade 7, matched here from the
// start).
//
// No LaTeX distribution is installed in this environment — these .tex
// files are written but NOT compiled/verified here (see images/CREDITS.md
// and README.md for the same verification discipline used for Grade 7).
import { writeFileSync, mkdirSync } from 'fs'

const OUT_DIR = 'c:/Users/user/Downloads/ICT website/latex/grade8'
mkdirSync(OUT_DIR, { recursive: true })

function esc(s) {
  return String(s)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([%$#_{}&])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}
function code(s) { return '\\texttt{' + esc(s) + '}' }
function md(s) {
  const parts = String(s).split(/`([^`]+)`/g)
  return parts.map((p, i) => (i % 2 === 1 ? code(p) : esc(p))).join('')
}

const DECKS = {
  web0: { emoji:'🌐', name:'What Is a Website?', sub:'Client/server, URLs, real browsers — no code yet, just the real parts',
    stages:['Client & Server','Real Browsers & Devices'], boss:'Inspect a Real Page',
    concepts:[
      { h:'Browser vs. server — two genuinely different jobs', p:'A browser is the customer that asks for a page; a server is the kitchen that actually stores the files and sends them back — a real, physical machine somewhere, not just an app on your device.' },
      { h:'A URL\'s parts each do a different job', p:'`https://` is the protocol — HOW to connect; `wikipedia.org` is the domain — the site\'s real address. Neither one is optional or interchangeable.' },
      { h:'JavaScript and Java are genuinely different languages', p:'Despite the similar name, JavaScript (a web scripting language) and Java (a completely separate language) share nothing but a marketing-era name collision from the 1990s — a real, common point of confusion worth clearing up early.' },
      { h:'HTML/CSS/JS as skeleton, paint, electricity', p:'HTML is a building\'s skeleton (structure), CSS is the paint (style), JS is the electricity (things that move and respond) — three separate real jobs, never one file doing all three.' },
      { h:'BOSS — Page Source vs. Inspect, a real distinction', p:'Page Source shows the ORIGINAL html the server sent, unchanged; Inspect shows the page\'s LIVE current state, which JavaScript can have already changed — genuinely different views of the same page.' },
    ],
    realWorld: 'Every time a phone or laptop loads a webpage, it is genuinely acting as a client asking a real server (often thousands of miles away) for files — the same client/server split every professional web developer works with daily, not a simplification invented for class.',
    discovery: 'Right-click → Inspect on three real websites you use. Find one heading, one button, one link, and one image in each site\'s Inspect view — notice the same handful of tags underneath every single site, no matter how different they look.' },
  web1: { emoji:'🏷️', name:'Web Story — Your First Tags', sub:'A heading and a paragraph — real HTML, typed',
    stages:['Heading + Paragraph'], boss:'Ship a Real Heading + Paragraph',
    concepts:[
      { h:'A real `<h1>` tag needs an opening AND closing half', p:'`<h1>My Page</h1>` — this is genuinely the first real HTML most students ever type, moving from a drag-and-drop "heading" block to the actual tag underneath it.' },
      { h:'A page usually has exactly ONE heading', p:'Just like Grade 7\'s Story Studio taught with blocks, a real page almost always has one `<h1>` — the single thing that says what the whole page is about.' },
      { h:'A `<p>` paragraph needs real, non-empty text', p:'An empty tag technically exists but says nothing — the checker genuinely verifies there is real text inside, not just that the tag is present.' },
    ],
    realWorld: 'Every real news homepage, blog post, or product page still starts with exactly these two tags — a heading naming the page, a paragraph saying something real. Minecraft\'s recipe book pages have the same shape: one item name (heading), one description (paragraph).',
    image: { file: 'html5.png', caption: 'The real tag behind every heading you type from here on.', credit: 'HTML5 logo — W3C / Patio, CC BY 3.0, via Wikimedia Commons' },
    discovery: 'Open a real website\'s Inspect panel and find its actual `<h1>` tag. Is there really only one on the page — or did the designer break that rule?' },
  web2: { emoji:'🔗', name:'Web Story — More Tags', sub:'A link takes you elsewhere; a button does something here',
    stages:['Link & Button'], boss:'Ship Heading + Paragraph + Link + Button',
    concepts:[
      { h:'A link needs an `href` — a real destination', p:'`<a href="https://example.com">Click here</a>` — a link missing its href is like a signpost with an arrow but no name on it, technically still a tag but useless to a real reader.' },
      { h:'A link goes elsewhere; a button acts here', p:'This is the exact same distinction Grade 7\'s Story Studio 1 taught with blocks — now typed as real, separate tags, `<a>` vs `<button>`.' },
      { h:'A button on its own does genuinely nothing yet', p:'`<button>` with no JavaScript attached simply sits there when clicked — that is expected and correct this week; real behaviour attaches to it later (Web Story project, Session 5-6).' },
    ],
    realWorld: 'Every "read more" link and "subscribe" button on a real news site is exactly these two tags, doing exactly these two different jobs, at real scale.',
    discovery: 'Find a real webpage with both a link and a button close together. Click each — does the link genuinely take you elsewhere, while the button changes something on the SAME page?' },
  web3: { emoji:'🎨', name:'Web Story — Colors & Shading', sub:'CSS — content vs. style, now with exact colors',
    stages:['Background & Heading Color'], boss:'Style a Real Page Exactly',
    concepts:[
      { h:'CSS decides HOW a page looks, not WHAT is on it', p:'`body { background-color: #FFF7E6; }` and `h1 { color: #2F3B52; }` change appearance only — the actual HTML content (heading, paragraph) is completely untouched by either rule.' },
      { h:'An EXACT hex color, checked precisely', p:'The checker compares the browser\'s own computed style — `getComputedStyle` normalizes any hex color to an exact `rgb(...)` value, so "close enough" genuinely is not close enough; `#FFF7E6` must become exactly `rgb(255, 247, 230)`.' },
      { h:'A rule can target just ONE kind of element', p:'`h1 { color: ... }` only touches headings — paragraphs keep whatever color they already had, a targeted rule rather than a blanket one.' },
    ],
    realWorld: 'Every real website\'s consistent brand colors (the exact blue on every Facebook button, the exact red on every YouTube icon) are hex values set in CSS exactly like this — designers hand developers precise hex codes, not "kind of blue".',
    discovery: 'Open Inspect on a real site and find one exact hex color it uses for text or background. Would you have guessed that exact code just by looking at it?' },
  web4: { emoji:'🧩', name:'Web Story — Structure + Style, Together', sub:'Checkpoint — everything from Weeks 2-4, combined',
    stages:['BOSS — The Warm-Up Page'], boss:'The Warm-Up Page',
    concepts:[
      { h:'A checkpoint asks for everything at once, not a subset', p:'Heading, paragraph, link, button, exact background `#FFF7E6`, exact heading color `#2F3B52` — nothing here is new; it is genuinely just Weeks 2-4 combined onto one real page.' },
      { h:'HTML and CSS can be written in any order', p:'Unlike some things in code, CSS applies no matter when it was written relative to the HTML it targets — style the page first or structure it first, the rendered result is identical.' },
    ],
    realWorld: 'Every real website is built this same way — structure and style, developed somewhat independently, then combined into one shipped page.',
    discovery: 'Before opening the platform: sketch on paper where your heading, paragraph, link, and button will sit, and what two exact colors they\'ll use — plan the checkpoint before typing it.' },
  web5: { emoji:'💼', name:'Web Story — Build Your Portfolio', sub:'Multiple sections, consistent style, then real JS — one idea at a time',
    stages:['Plan & Skeleton','Consistent Styling','One Button, One Change','A Variable the Click Updates'], boss:'Ship the Portfolio',
    concepts:[
      { h:'A real project needs at least TWO real sections', p:'Two separate headings, each followed by its own real paragraph — genuinely two sections, not one long page with two headings jammed in.' },
      { h:'One CSS rule, applied everywhere at once', p:'`body { background-color: #FFF7E6; }` and `h1 { color: #2F3B52; }` apply to the WHOLE page automatically — however many sections exist, the same two rules cover all of them with zero repetition.' },
      { h:'The FIRST real JavaScript idea: one click, one change', p:'`document.querySelector("button").addEventListener("click", function() {...})` — a real click handler that changes exactly one piece of text, the smallest possible genuine interactive behaviour.' },
      { h:'The SECOND real JS idea: a variable the click updates', p:'`let clicks = 0;` declared OUTSIDE the handler survives between clicks; inside the handler, `clicks = clicks + 1;` then displaying it is the exact same "read, change, store back" pattern from every variable chapter before it.' },
    ],
    realWorld: 'A real portfolio site — multiple consistently-styled sections, a working button that updates a visible counter or reveals content — is genuinely the shape of thousands of real personal and professional sites online today.',
    discovery: 'Look at a real portfolio or personal website online. Count its distinct sections. Does it have any button that changes a number or piece of text when clicked, the same as this project\'s click counter?' },
  py1: { emoji:'🐍', name:'What Is Python? / Variables', sub:'A variable is still a named box — now with real, exact syntax',
    stages:['About You, In Variables'], boss:'One Line, Three Variables',
    concepts:[
      { h:'A variable is still a named box — just typed now', p:'`name = "Alex"` is exactly Grade 7\'s "set" block, just written with an `=` sign instead of snapped together — same idea, real Python syntax.' },
      { h:'Text needs quotes; numbers don\'t', p:'`name = "Alex"` (text, in quotes) vs. `age = 13` (a number, no quotes) — mixing this up is a genuinely common first real Python bug.' },
      { h:'BOSS — an f-string combines multiple variables in ONE print', p:'`print(f"My name is {name}, I am {age}, and I like {fav_thing}.")` — an f-string starts with `f` before the quotes, and drops variables directly inside `{}` without needing separate print calls or `+` concatenation.' },
    ],
    realWorld: 'Every real sign-up form storing your name, age, and a preference as separate named fields is doing exactly this — three named boxes, combined into one readable message on a confirmation screen.',
    image: { file: 'python.png', caption: 'The real language behind every variable from here on.', credit: 'Python logo, CC BY 2.5, via Wikimedia Commons' },
    discovery: 'Write your own name, age, and a favourite thing as three real Python variables on paper. Then write the ONE f-string that would combine all three into a single readable sentence.' },
  py2: { emoji:'🔀', name:'If/Else', sub:'Decisions in real code — one comparison operator this week: ==',
    stages:['Odd or Even'], boss:'Hot or Not',
    concepts:[
      { h:'`%` gives what\'s LEFT OVER after dividing', p:'`number % 2` is 0 for even numbers, 1 for odd — the exact same MOD idea from Grade 7\'s blocks, now written as a real operator.' },
      { h:'Real syntax: a colon, then indentation', p:'`if number % 2 == 0:` followed by an indented `print("Even")` is exactly what Grade 7\'s if/else BLOCKS actually compiled to underneath — the visual nesting becomes real indentation.' },
      { h:'BOSS — a different comparison, `>`', p:'`if temperature > 25:` — swapping `==` for `>` handles a whole RANGE of values rather than one exact match, the same shape of decision applied to a genuinely different kind of question.' },
    ],
    realWorld: 'Every real app checking "is this number even" (splitting a bill, alternating row colors in a table) or "is this value above a threshold" (a thermostat, a speed-limit warning) runs exactly this if/else shape.',
    image: { file: 'traffic.jpg', caption: 'A real branch, decided by a condition — the same if/else idea from this chapter.', credit: 'LED traffic lights, public domain (PD-self), via Wikimedia Commons' },
    discovery: 'Before typing anything: will `10 % 2` be 0 or 1? Will `7 % 2`? Write both guesses down, then check them against the actual rule this chapter teaches.' },
  py3: { emoji:'🔁', name:'For Loops', sub:'range() — and the "second number is exclusive" trap',
    stages:['Count to Five'], boss:'Count 1 to 5, For Real',
    concepts:[
      { h:'`range(5)` stops BEFORE 5', p:'`range(5)` produces 0, 1, 2, 3, 4 — five numbers total, but the number 5 itself is never reached. This exact trap catches nearly every student the first time.' },
      { h:'`range(start, stop)` — stop is still exclusive', p:'`range(1, 6)` starts at 1 and stops before 6 — landing exactly on 5 as the last number actually printed. To include N, the stop argument must be N+1.' },
      { h:'BOSS — applying the same trap deliberately', p:'Printing 1 through 5 inclusive requires spotting that the stop number needs to be one MORE than the last number you actually want.' },
    ],
    realWorld: 'This exact "off-by-one" mistake (using `range(1,10)` when you meant to include 10) is a genuinely common real bug that professional developers still make — not just a beginner trap.',
    discovery: 'Before running anything: does `range(1, 11)` include the number 11? Write your answer down first, then check it — most people guess wrong the first time.' },
  py4: { emoji:'⏳', name:'While Loops', sub:'For = exact count. While = until a condition changes.',
    stages:['Countdown'], boss:'Countdown by 25s',
    concepts:[
      { h:'`for` is for a KNOWN count; `while` is for UNKNOWN', p:'A `for` loop is right when you know exactly how many times in advance; a `while` loop keeps going for as long as a condition stays true — right when you don\'t know the count ahead of time.' },
      { h:'A while loop MUST change its own condition', p:'`while count > 0:` paired with `count = count - 1` inside the loop — skip the decrement and the loop genuinely never stops, a real and common bug.' },
      { h:'BOSS — the same shape, a bigger step', p:'`health = health - 25` each pass, `while health > 0:` as the condition — identical structure to the countdown, just counting down by a different amount toward a real "Game Over" message.' },
    ],
    realWorld: 'A real video game health bar counting down by fixed damage amounts, or a countdown timer before a rocket launch, are both genuinely `while`-loop shaped — repeat until a condition (health, or the countdown itself) changes to false.',
    discovery: 'Think of something you do "until" a condition changes, not a fixed number of times (eating until full, walking until you arrive). What is the condition, and what changes it each "pass"?' },
  py5: { emoji:'📋', name:'Lists', sub:'Storing many things under one name — index and .append() only',
    stages:['Your First List'], boss:'Three Items, One List',
    concepts:[
      { h:'A list holds MANY things under one name', p:'A direct comparison to Grade 7\'s arrays — `inventory = []` starts empty, ready to hold as many items as needed.' },
      { h:'`.append()` adds to the END', p:'`inventory.append("sword")` genuinely adds a new item after the list already exists — the list grows one call at a time.' },
      { h:'Indexing starts at 0, not 1', p:'`inventory[0]` reads the FIRST item ever added; the THIRD item added sits at index 2, not 3 — an off-by-one trap just like `range()`\'s.' },
    ],
    realWorld: 'Every shopping cart, playlist, or to-do list app stores its items in exactly this shape — an ordered list that grows one `.append()`-equivalent call at a time, read back by position.',
    discovery: 'Add three real items to a list on paper (write them in order). Which index number is the SECOND item you added? Is it 1 or 2 — and why?' },
  adv: { emoji:'🗺️', name:'Build a Text Adventure', sub:'Rooms (if/elif), an inventory (lists), a loop that keeps it running',
    stages:['The First Room','Pick Up an Item','The Turn Loop'], boss:'One Complete Adventure',
    concepts:[
      { h:'if/elif/else branches a story on a real choice', p:'`if choice == "left": ... elif choice == "right": ... else: ...` — three genuinely different paths from ONE variable, exactly Grade 7\'s branching-story idea in real Python syntax.' },
      { h:'An inventory that GROWS as the story plays', p:'`inventory = []` starts empty; each room branch calls `.append()` with that room\'s specific item — the SAME list ends up holding whatever the player actually picked up, not a fixed pre-written set.' },
      { h:'A while loop wraps the whole adventure', p:'`while not game_over:` keeps the story running turn after turn until a condition (`game_over = True`, set after 3 turns) ends it — the loop must change its own condition, same rule as every while loop before it.' },
      { h:'BOSS — branching, a growing list, and a loop, together', p:'A real playable text adventure needs genuinely all three: rooms that branch, an inventory that grows from real choices, and a turn loop controlling when it ends.' },
    ],
    realWorld: 'Every real text adventure (Zork and its descendants) and every branching dialogue system in a modern RPG is built from exactly these three ideas — if/elif branching, a growing inventory list, and a loop controlling how long play continues.',
    discovery: 'Sketch your own text adventure\'s first two rooms on paper: what choice branches them, and what item does each room give the player? You\'ve just designed the if/elif structure before writing a line of it.' },
  cc1: { emoji:'⚔️', name:'Health & Attack Basics', sub:'A battle needs a health variable, an attack value, and arithmetic',
    stages:['Take a Hit'], boss:'Take a Hit',
    concepts:[
      { h:'Health is just a variable that goes DOWN', p:'`health = health - attack_value` — the exact same "read, subtract, store back" arithmetic from every earlier chapter, now genuinely meaning something inside a battle.' },
      { h:'An attack is a fixed value, subtracted once per hit', p:'`attack_value = 15` is a plain number — the same value subtracted from health however many times an attack lands, no special "combat" syntax needed.' },
    ],
    realWorld: 'Every RPG\'s damage calculation, at its core, really is exactly this line of arithmetic — a health number decreasing by an attack number, dressed up with animations and sound.',
    discovery: 'Pick a real game\'s starting health and a typical hit\'s damage (or estimate one). How many hits would it genuinely take to reach 0 using just subtraction?' },
  cc2: { emoji:'🏳️', name:'Win/Lose Conditions', sub:'if/else checks whether health has reached 0 or below',
    stages:['Game Over?'], boss:'Game Over?',
    concepts:[
      { h:'`<=` catches EXACTLY 0, not just below it', p:'`if health <= 0:` — using `<` instead would wrongly treat health of exactly 0 as still "alive", a genuine off-by-one bug in a real battle system.' },
      { h:'Every branch needs its own outcome', p:'The `else` branch needs its own `print()` too — one message for losing, a different one for still fighting, never left blank.' },
    ],
    realWorld: 'Every real game\'s "you lose" check is exactly this — an inclusive `<= 0` comparison, because reaching exactly zero health should genuinely count as defeated, not a special edge case that slips through.',
    discovery: 'If health reaches EXACTLY 0, should that count as a loss? Most people say yes immediately — but `health < 0` would actually say no. Which operator does the job correctly?' },
  cc3: { emoji:'🔁', name:'The Battle Loop', sub:'Turns continue until someone wins — same while-loop idea as before',
    stages:['Keep Fighting'], boss:'Keep Fighting',
    concepts:[
      { h:'A battle is a while loop wearing combat clothes', p:'`while health > 0:` is the exact same "unknown count, until a condition changes" idea from Semester 2\'s while loops — now controlling how many turns a fight lasts.' },
      { h:'The loop must still change its own condition', p:'`health = health - 10` inside the loop is what eventually makes `health > 0` false — skip it, and the battle genuinely never ends.' },
    ],
    realWorld: 'Every turn-based RPG battle (Pokémon, Final Fantasy) runs on exactly this loop shape underneath — repeat combat turns while both sides remain above 0 health.',
    discovery: 'Watch or recall a turn-based game battle. Roughly how many turns did it take? What "while" condition do you think stopped it — and could you have predicted the turn count in advance, or only find out by playing?' },
  cc4: { emoji:'👹', name:'Tracking the Enemy', sub:'A second, independent set of variables — the enemy\'s own health and attack',
    stages:['The Enemy Strikes Back'], boss:'The Enemy Strikes Back',
    concepts:[
      { h:'Two independent characters need two independent sets of variables', p:'`player_health`, `enemy_health`, `enemy_attack` — separate variables tracking separate things, the exact same "multiple independent pieces of state" idea from the Text Adventure\'s inventory, applied to combat.' },
      { h:'The SAME subtraction pattern, a different attacker', p:'`player_health = player_health - enemy_attack` — identical shape to Player attacking Enemy, just with the roles and variable names swapped.' },
    ],
    realWorld: 'Every real multiplayer or PvE game genuinely tracks each character\'s stats as separate, independent variables — one player\'s health dropping never touches another character\'s completely separate health variable.',
    discovery: 'In any 2-character battle you know (a boss fight, a PvP match), name the FOUR separate numbers being tracked (each side\'s health and attack). Are any of them ever mixed up, or genuinely kept independent?' },
  cc5: { emoji:'🎯', name:'Bringing It Together', sub:'Checkpoint — health, attack, win/lose, and turns, as one system',
    stages:['BOSS — Guided Mini-Battle'], boss:'Guided Mini-Battle',
    concepts:[
      { h:'A checkpoint combining cc1 through cc4, nothing new', p:'A health variable, an attack that reduces it, a while loop that keeps fighting while health is above 0, and a win/lose message once it ends — genuinely just assembly of ideas already learned.' },
      { h:'The outcome check happens AFTER the loop ends', p:'`if health <= 0: print(...)` sits outside and after the `while` loop — checking the outcome only makes sense once the fighting has actually stopped.' },
    ],
    realWorld: 'This is genuinely the complete shape of the smallest possible real turn-based battle system — the same four pieces (state, change, loop, outcome) scale up to a full commercial RPG\'s combat engine.',
    discovery: 'Before opening the platform: on paper, list the four separate pieces a mini-battle needs (a starting health, a way to reduce it, a loop, an outcome check) — in what order do they have to happen?' },
  cc: { emoji:'🏆', name:'Ship a Combat Encounter', sub:'Player vs. enemy — health tracking for both, a turn loop, a clear outcome',
    stages:['Two Fighters','The Turn Loop'], boss:'Ship the Battle',
    concepts:[
      { h:'Two independent reductions, one real turn', p:'`enemy_health = enemy_health - player_attack` then `player_health = player_health - enemy_attack` — both fighters act in the same turn, each reduction fully independent of the other.' },
      { h:'`and` requires BOTH fighters still alive', p:'`while player_health > 0 and enemy_health > 0:` — the battle only continues while NEITHER side has been defeated yet; either one reaching 0 ends it immediately.' },
      { h:'BOSS — zero functions, a complete playable battle', p:'Both fighters\' health, a turn loop, and a final `if/else` announcing the winner once the loop ends — a real, complete, playable encounter built from nothing but variables, loops, and if/else.' },
    ],
    realWorld: 'This is genuinely the same architecture behind the combat system of countless real shipped turn-based games — two independent health pools, a shared turn loop, and a clear win/lose message once it resolves.',
    discovery: 'Design your own two fighters\' starting stats (health and attack) on paper. Roughly how many turns do you predict the battle will take? Was your prediction close once you actually ran it?' },
  ws1: { emoji:'📗', name:'Web Story 1 — Remembering the Reader', sub:'Arrays and objects — a story that tracks the reader\'s inventory and flags',
    stages:['Your First Array','Add to the Array','A Flag Object','Read One Item, Count Them All','Two Flags, One Decision'], boss:'Inventory & Flags Together',
    concepts:[
      { h:'An array is an ordered list of values', p:'`["sword", "shield"]` is a genuine JavaScript array — an ordered collection, indexed from 0. `.join(", ")` turns it back into one readable string.',
        diagram: String.raw`
        \draw[thick] (0,0) rectangle (1.4,-1); \node at (0.7,-0.5) {0};
        \draw[thick] (1.4,0) rectangle (2.8,-1); \node at (2.1,-0.5) {1};
        \draw[thick] (2.8,0) rectangle (4.2,-1); \node at (3.5,-0.5) {2};
        \node[below] at (0.7,-1.2) {\small "sword"};
        \node[below] at (2.1,-1.2) {\small "shield"};
        \node[below] at (3.5,-1.2) {\small "potion"};`,
        worked: 'Worked example: `["sword","shield"].join(", ")` produces the exact text "sword, shield" — this is genuinely how a real inventory line of text gets built from structured data.' },
      { h:'.push() adds to the END of an array', p:'An array isn\'t fixed once written — `.push("potion")` genuinely adds a new element after the array already exists, exactly like a player finding a new item mid-story.' },
      { h:'An object groups related NAMED values', p:'An array is a list, ordered by position; an object is a set of NAMED properties (`flags.hasKey`) — both are "collections" but answer different questions.' },
      { h:'[0] reads ONE item; .length counts them all', p:'`inventory[0]` reads a single specific item by position — index 0 is always the FIRST item. `.length` is a real PROPERTY (no brackets, nothing to call) giving the total count directly, no counting loop needed.' },
      { h:'&& needs BOTH sides to be true', p:'`flags.hasKey && flags.hasMap` is only true when BOTH properties are true — the same strict AND idea from Boolean logic, now combining two real object properties into one decision, with a genuine else branch for "not both".' },
      { h:'BOSS — arrays and objects, together', p:'An inventory (an ordered LIST) and a set of flags (NAMED yes/no facts) are genuinely different shapes of data — a real interactive story needs both.' },
    ],
    realWorld: 'Every real e-commerce cart is an array of items plus a set of named flags ("giftWrapped", "expressShipping") — exactly this chapter\'s two data shapes, doing real work. Minecraft\'s own inventory (an ordered list of slots) plus achievement flags (has this player found diamonds yet?) is the same split.',
    image: { file: 'js.png', caption: 'Real JavaScript --- the language behind this week\'s arrays and objects.', credit: 'JavaScript logo — Chris Williams, public domain, via Wikimedia Commons' },
    discovery: 'Open your phone\'s shopping app cart. Is the item list ordered (an array) or does order not matter? Now think of one yes/no fact the app tracks about you (signed in? has a coupon?) — that\'s an object property.' },
  ws2: { emoji:'📘', name:'Web Story 2 — Organizing the Telling', sub:'Functions — reusable, named pieces of story logic',
    stages:['Your First Story Function','A Function That Changes State','Two Functions, One Page'], boss:'A Story Told By Functions',
    concepts:[
      { h:'A function RETURNS a value — it doesn\'t display one', p:'`describeItem()` hands back a string; a SEPARATE line decides what to do with it. Keeping "compute" and "display" as two different steps is what makes a function reusable.' },
      { h:'A function can read AND change outside variables', p:'`addItem()` reaches OUTSIDE itself to push onto `inventory` — functions aren\'t limited to only using their own parameters.' },
      { h:'One function\'s result, another function\'s input', p:'`canAfford()` returns true/false; `showResult()` takes THAT value and decides what to display — chaining functions builds complex behaviour from simple pieces.',
        diagram: String.raw`
        \node[draw, thick, minimum width=2.6cm] (a) at (0,0) {canAfford()};
        \draw[->, thick] (a) -- (3,0) node[midway,above]{\small true/false};
        \node[draw, thick, minimum width=2.6cm] (b) at (5,0) {showResult()};` },
      { h:'BOSS — a page organized entirely around functions', p:'Splitting work into functions, each with ONE clear job, is what makes a real project readable, testable, and changeable later.' },
    ],
    realWorld: 'A recipe app\'s "calculateServings()" function reused across every recipe on the site is exactly this chapter\'s idea. Minecraft\'s real `/function` command (a named, reusable set of commands) works identically — define once, call from anywhere.',
    image: { file: 'gear.jpg', caption: 'A function is defined once, does the same job every time it\'s called --- like a gear always doing the same defined turn.', credit: 'Fixed gear cog — John Reaves, public domain, via Wikimedia Commons' },
    discovery: 'Find one button in any app that clearly "computes something, then shows the result" (a checkout total, a BMI calculator). Which part do you think is the function\'s return value, and which part is just display?' },
  ws3: { emoji:'💾', name:'Web Story 3 — Remembering After You Leave', sub:'localStorage — data that survives a page refresh',
    stages:['Remember After Refresh','Save the Whole Inventory','Was Anything Saved Before?'], boss:'A Story That Remembers You',
    concepts:[
      { h:'localStorage genuinely survives a refresh', p:'Every variable, array, and object used so far disappears the instant the page reloads. localStorage is different — saved to the browser itself, still there after closing the tab entirely.' },
      { h:'localStorage only holds TEXT', p:'`JSON.stringify()` correctly turns a real array/object into text that can be perfectly reconstructed later; `JSON.parse()` reverses it exactly — same items, same order.',
        worked: 'Worked example: `JSON.stringify(["sword","shield"])` produces the text `\'["sword","shield"]\'` — and `JSON.parse()` on that text rebuilds the EXACT original array, not just something similar-looking.' },
      { h:'null means "nothing was ever saved"', p:'The very first time anyone visits a page, `localStorage.getItem()` returns null for everything — any real save system has to handle this "first visit" case explicitly.' },
      { h:'BOSS — real persistent story state', p:'Saving structured data, loading it back, and checking whether it existed first — this is genuinely how real websites remember your cart, progress, or preferences between visits.' },
    ],
    realWorld: 'Every website that remembers your dark-mode preference or your shopping cart after you close the tab is using exactly this mechanism. Minecraft\'s own save files work on the same principle at a bigger scale — your world genuinely persists between sessions, saved to disk, not just held in memory while running.',
    image: { file: 'floppy.jpg', caption: 'Old-school \'save to disk\' --- the exact idea localStorage recreates inside the browser.', credit: 'Floppy disks, George Chernilevsky, public domain, via Wikimedia Commons' },
    discovery: 'Close and reopen a website that remembers something about you (a cart, a login, a dark-mode setting). What do you think happens the very FIRST time anyone ever visits — before anything has been saved yet?' },
  ws4: { emoji:'🔁', name:'Web Story 4 — One Loop, Many Choices', sub:'A loop that builds page elements — one per item, automatically',
    stages:['A List of Choices','Numbered Items','Loop Inside a Function'], boss:'Full Inventory Display',
    concepts:[
      { h:'A loop builds elements — it doesn\'t just repeat text', p:'Each pass through the loop creates a genuinely NEW `<li>` element and adds it to the page — the array\'s length directly decides how many list items appear.' },
      { h:'The loop counter is real, usable data', p:'The loop\'s own counter (`i`) can be used directly in what you build — numbering items, styling every other row differently, anything depending on POSITION.' },
      { h:'A loop wrapped in a function becomes reusable', p:'`renderList(items)` doesn\'t care what\'s inside `items` — call it with a shopping list, an enemy list, a chapter list, and the same loop logic handles all of them.' },
      { h:'BOSS — array, function, and loop, together', p:'An array holding real data, a function organizing the logic, and a loop turning data into visible elements — genuinely the core pattern behind almost every real list, menu, or gallery on the web.' },
    ],
    realWorld: 'Every product grid on a shopping site, every social feed, every playlist — all rendered by exactly this "loop through an array, build one element per item" pattern, whether the array has 3 items or 3,000.',
    discovery: 'Find a real website with a list that clearly scales (a product grid, search results). Do you think the HTML for every single item is hand-written, or generated by a loop like this chapter\'s? How could you tell?' },
  ws5: { emoji:'🏆', name:'Web Story 5 — Your Story Engine', sub:'Everything from Semester 1, working together in one real interactive page',
    stages:['Add and Re-Render','Track a Flag, Too','Save As You Go'], boss:'Your Story Engine',
    concepts:[
      { h:'A click that triggers a re-render', p:'`addEventListener("click", ...)` is genuine JavaScript event handling. Clearing the list before looping again means the display always reflects the CURRENT inventory.' },
      { h:'One click, multiple kinds of state updated', p:'A single click genuinely updates two DIFFERENT shapes of state at once — an ordered list (inventory) and a named fact (`flags.hasVisited`).' },
      { h:'Saving on every meaningful change', p:'Real progress-saving usually happens repeatedly, every time something changes — every click that changes inventory also saves it, so nothing is ever lost.' },
      { h:'BOSS — a real, small, working story engine', p:'State, functions, loops, real click events, and persistence — this is genuinely the same shape as a real, if small, interactive web application.' },
    ],
    realWorld: 'This is genuinely the shape of a real single-page app: state changes, the UI re-renders to match, and changes are saved as they happen — the exact architecture behind most modern web and mobile apps, just at a much larger scale.',
    discovery: 'Before opening the platform: sketch what SHOULD happen, in order, when a player clicks "pick up sword" — which piece of state changes first, what re-renders, and when does it save?' },
  m1: { emoji:'🔤', name:'M1 — From Blocks to Text', sub:'print, input, variables, types — the G7 skills, now in real Python',
    stages:['Say Hello','About Me','Type Detective','Ask the User','Temperature Converter'], boss:'M1 Capstone',
    concepts:[
      { h:'print() — your first real line of code', p:'`print()` displays whatever you put inside its brackets. This exact line is traditionally the very first thing anyone writes in a new programming language.' },
      { h:'Variables and f-strings', p:'A variable is still a named box holding a value — just written as `name = "Alex"` instead of snapped together. `f"My name is {name}"` drops a variable directly INSIDE a string.' },
      { h:'Every value has a TYPE', p:'`int` (7), `float` (7.5), `str` ("hi"), `bool` (True/False) — Python tracks the type of every value automatically. `type(x)` reveals it.' },
      { h:'input() always returns TEXT', p:'`input()` ALWAYS hands back text — typing "25" gives you the STRING "25", not the number 25. `int(age_text)` converts it into a real number.' },
      { h:'A real formula, not just a print statement', p:'`celsius * 9 / 5 + 32` — Python does x and / before + and -, exactly like normal maths rules. A genuine, widely-used real-world formula.' },
    ],
    realWorld: 'Every weather app converting between Celsius and Fahrenheit runs this EXACT formula. Every sign-up form that asks your age and immediately validates it depends on the same input()-returns-text, then-convert pattern.',
    image: { file: 'python.png', caption: 'The real language you\'re about to start typing.', credit: 'Python logo, CC BY 2.5, via Wikimedia Commons' },
    discovery: 'Type `type(input("Enter a number: "))` for yourself conceptually — before running anything, guess: will Python say the result is a number, or text? Most students guess wrong the first time.' },
  m2: { emoji:'🚦', name:'M2 — Choices & Loops', sub:'if/elif/else, while, for-range — predict the drawing before you run it',
    stages:['Odd or Even','FizzBuzz Lite','Countdown Circles','Grade Classifier','Sum to N'], boss:'M2 Capstone',
    concepts:[
      { h:'if/else — real syntax for a decision', p:'`number % 2` gives what\'s LEFT OVER after dividing by 2 — 0 for even, 1 for odd. The exact same MOD idea from Grade 7, just written as `%`.',
        diagram: String.raw`
        \draw[thick] (1,1) -- (2,0) -- (1,-1) -- (0,0) -- cycle;
        \node at (1,0) {\small n\%2};
        \draw[->, thick] (2,0) -- (3.5,0.7) node[midway,above]{\small =0};
        \node[right] at (3.5,0.7) {\small Even};
        \draw[->, thick] (2,0) -- (3.5,-0.7) node[midway,below]{\small =1};
        \node[right] at (3.5,-0.7) {\small Odd};` },
      { h:'for loops with range(), and elif chains', p:'`for i in range(1, 11):` loops through 1 to 10 — the second number is EXCLUSIVE, which is why you need 11 to reach 10. This trips up almost everyone the first time.' },
      { h:'while loops — repeat until a condition is false', p:'`for` is perfect when you know the count in advance. `while size > 0:` keeps going for as long as a CONDITION stays true — the loop MUST change the condition eventually, or it runs forever.' },
      { h:'Chained if/elif — order decides correctness', p:'Checking `>= 70` BEFORE `>= 90` would wrongly grade a 95 as a "B" — order in a chain of conditions genuinely changes the result.' },
    ],
    realWorld: 'Every "off by one" range bug (`range(1,11)` needing 11, not 10) is a genuinely common real bug professional developers still make. Minecraft\'s own farming/breeding cooldowns are `while` loops in disguise — "keep waiting while the cooldown timer is still above zero".',
    image: { file: 'traffic.jpg', caption: 'A real three-way branch --- the same if/elif/else idea from this chapter.', credit: 'LED traffic lights, public domain (PD-self), via Wikimedia Commons' },
    discovery: 'Before running anything: what does `range(1, 11)` actually produce — does it include 11? Write your guess down, then check — this exact mistake is one of the most common real beginner bugs.' },
  m3: { emoji:'🧰', name:'M3 — Functions', sub:'def, parameters, return — refactor copy-paste into reusable powers',
    stages:['Functions with Parameters','A Loop That Calls a Function','return — Handing Back a Value','A Function With a Loop Inside','Returning More Than One Value'], boss:'M3 Capstone',
    concepts:[
      { h:'def name(params): — the real syntax for "My Blocks"', p:'`def draw_smiley(x, y, r, ...):` defines a reusable function, exactly like Grade 7\'s custom blocks — just typed instead of dragged.',
        diagram: String.raw`
        \node[draw, thick, minimum width=3.2cm] (f) at (0,0) {draw\_smiley(x, y, r)};
        \draw[->, thick] (f) -- (-2.4,-1.3) node[left]{\small (50,50,20)};
        \draw[->, thick] (f) -- (2.4,-1.3) node[right]{\small (200,50,30)};` },
      { h:'A loop that calls a function repeatedly', p:'Calling `colored_tile(...)` inside a `for` loop, with different x/y each time, builds a whole grid from ONE function definition.' },
      { h:'return — a function that hands back a value', p:'`average(a, b, c)` computes a VALUE and hands it back with `return`, to be used however the caller wants — `r = average(20, 60, 100)` captures it.' },
      { h:'A function with a loop INSIDE it', p:'`is_prime(n)` has a real `for` loop inside its own definition — `return` exits IMMEDIATELY, even mid-loop, the moment the answer is known.' },
    ],
    realWorld: 'Minecraft\'s real `/function` command lets you name and reuse a whole set of commands, called from anywhere — the exact same idea, just in the game\'s own scripting system rather than Python.',
    image: { file: 'gear.jpg', caption: 'Same idea as Web Story 2\'s image --- one defined job, called repeatedly with different inputs.', credit: 'Fixed gear cog — John Reaves, public domain, via Wikimedia Commons' },
    discovery: 'Think of a calculation you might reuse often (a tip calculator, a grade average). Write just its NAME and what it needs as input (parameters) — you\'ve just designed a function\'s signature before writing a single line inside it.' },
  m4: { emoji:'📋', name:'M4 — Lists', sub:'Creating, indexing, appending, looping — list + loop = superpower',
    stages:['A List of Values','Tuples','sorted() and Slicing','Filtering','The "in" Keyword'], boss:'M4 Capstone',
    concepts:[
      { h:'A list is an ordered collection of values', p:'A list holds many values under one name, in order — `for temp in temperatures:` visits each one in turn, exactly like Grade 7\'s array ideas.' },
      { h:'Tuples — a fixed little group of values', p:'`(r, g, b)` groups a FIXED number of related values as one item. `r, g, b = color` splits one tuple into three named variables in a single line.' },
      { h:'sorted() and slicing — built-in tools, not loops', p:'`sorted(player_scores)` returns a NEW list in order — no loop required. `[-5:]` means "the last 5 items", a negative index counting from the end.' },
      { h:'Filtering — building a new, smaller list', p:'Looping through a list and building a NEW list containing only items that pass a test — "give me only the results that match X" is an everywhere-task in real software.' },
    ],
    realWorld: 'Every "sort by price" or "filter by category" button on a shopping site is exactly `sorted()` and filtering, at real scale. Minecraft\'s own inventory sorting (a real feature in some versions) is literally `sorted()` applied to your item list.',
    discovery: 'Find a real app with a "filter" feature (a shopping site, a music app). What single condition do you think its filter checks per item — the same "loop + condition + build a new list" pattern from this chapter?' },
  m5: { emoji:'✂️', name:'M5 — Strings & Validation', sub:'Slicing, methods, checking input — the Caesar cipher in real code',
    stages:['String Methods & Slicing','Never Trust Input Blindly','The Caesar Cipher','Reversing a String','.split() on Whitespace'], boss:'M5 Capstone',
    concepts:[
      { h:'.strip() and .lower() — cleaning text', p:'Real user input is messy — `.strip()` removes leading/trailing spaces, `.lower()` makes everything lowercase, chaining them does both in one line.' },
      { h:'Never trust input blindly — validation', p:'A strong password needs length AND content checks — combining both with `and` means BOTH have to be true for acceptance.' },
      { h:'The Caesar cipher, in real code', p:'`ord(ch)` converts a letter to its ASCII number; `chr(n)` converts back — the exact "text is secretly numbers" idea from Grade 7\'s ASCII challenge, now doing real work. `% 26` wraps the alphabet around.',
        worked: 'Worked example: shifting "z" forward by 1 should wrap to "a", not go past the alphabet — `(25 + 1) % 26 = 0`, which IS the index for "a". That single `% 26` is the whole wraparound trick.' },
      { h:'Reversing a string with [::-1]', p:'A slice with no start, no end, and a step of -1 means "walk the whole string, but backward" — reverses an entire string in one expression.' },
    ],
    realWorld: 'Minecraft\'s enchanting table language is a real, deliberate obfuscation — every "Standard Galactic Alphabet" glyph maps to a real English letter, exactly like a Caesar cipher\'s letter-to-letter mapping, just visual instead of numeric.',
    discovery: 'Try shifting your own name by 3 letters by hand (A becomes D, Z wraps to C). Where does the wraparound actually happen for you — and does `% 26` genuinely handle it the same way?' },
  m6: { emoji:'🗂', name:'M6 — Files & Data', sub:'Reading/writing CSV, mean/max/min, a chart from real data',
    stages:['Opening a Real File','Built-in Stats Functions','Binary Search','Linking Two Datasets','Append vs. Write Mode','The Whole Pipeline'], boss:'M6 Capstone',
    concepts:[
      { h:'Opening and reading a real file', p:'`open("students.csv")` opens a real file; `.readlines()` gives every line as a list of strings. `lines[1:]` skips the header row.' },
      { h:'Built-in stats functions on real data', p:'`max()`, `min()`, `sum()`, `len()` do the heavy lifting once your data is in a real list — exactly what a spreadsheet\'s AVERAGE/MAX/MIN/COUNT do.' },
      { h:'Binary search — a real, faster search', p:'Instead of checking one by one, binary search jumps to the MIDDLE of a sorted list — an entire HALF can be thrown away every step. Only works because the data is SORTED.',
        diagram: String.raw`
        \foreach \x/\v in {0/2,1/5,2/9,3/14,4/20,5/33,6/41} {
          \draw[thick] (\x*0.9,0) rectangle (\x*0.9+0.8,-0.8);
          \node at (\x*0.9+0.4,-0.4) {\tiny \v};
        }
        \node[below] at (2.75,-1) {\small middle checked first};` },
      { h:'Append mode ("a") vs. write mode ("w")', p:'"w" WIPES a file clean every time; "a" adds to the END, leaving everything already there untouched — exactly how a real log file works.' },
    ],
    realWorld: 'Every school\'s real student database links a roster file to a results file by a shared student ID — exactly M6\'s "linking two datasets by a shared key", the same idea behind a real database JOIN.',
    discovery: 'Open any spreadsheet you have access to. Find its "header row" — the one that isn\'t data, just column names. Real code has to explicitly skip that row, the same way `lines[1:]` does here.' },
  m7: { emoji:'⚙️', name:'M7 — Inside the Machine', sub:'Binary numbers, storage units, how images/sound are numbers',
    stages:['Storage Units & Binary','Images Are Numbers','Interpreter vs. Compiler','Encoding & Decoding','Run-Length Encoding'], boss:'M7 Capstone',
    concepts:[
      { h:'1024, not 1000 — powers of two', p:'1 KB = 1024 bytes, not 1000 — because computers count in binary (base 2), and 1024 is a power of 2. `bin(42)` reveals the actual binary digits underneath.' },
      { h:'Images ARE numbers — grayscale conversion', p:'A colour pixel is a tuple `(r, g, b)` — `(r + g + b) // 3` averages the three channels into one brightness number, exactly how a real photo-editing app converts colour to grayscale.' },
      { h:'Interpreter vs. compiler', p:'Python is an interpreter — it runs each line as it goes, so everything BEFORE a crash has already genuinely happened. A compiler translates the WHOLE program first.' },
      { h:'Run-length encoding — real compression', p:'"aaaabbbccd" stored as "4a3b2c1d" is genuinely shorter — a real compression technique, used in actual image and file formats.' },
    ],
    realWorld: 'Every JPEG/PNG file on your phone is really just numbers, exactly like M7\'s grayscale pixel maths, just with far more channels and compression on top. Minecraft\'s own world files are binary data on disk — the same "everything is really numbers" idea, at world-save scale.',
    image: { file: 'circuit.jpg', caption: 'Real transistors and circuits --- what \'inside the machine\' actually looks like.', credit: 'Computer circuit board, Jon Sullivan, public domain, via Wikimedia Commons' },
    discovery: 'Take any small greyish photo (or imagine one). Roughly what do you think its "average" pixel brightness looks like as a single number — and would a photo of snow score higher or lower than one of a night sky?' },
  m8: { emoji:'🌐', name:'M8 — The Connected World', sub:'How the internet works, staying safe, a one-page HTML profile',
    stages:['Packets','Generating HTML with Python','Password Strength','https:// vs. http://','Linking Pages'], boss:'M8 Capstone',
    concepts:[
      { h:'Packets — messages arrive out of order', p:'A message is split into packets, sent separately, and can arrive in ANY order — sorting them back into place by index is exactly what the real internet\'s TCP protocol does constantly.' },
      { h:'Generating real HTML with Python', p:'Every website is really a plain text file written in HTML — servers routinely BUILD that text on the fly using a real programming language.' },
      { h:'Password strength — combining checks in a function', p:'`is_strong(password)` returns True only when BOTH the length check AND the digit check pass — `and` requires every condition to be true.' },
      { h:'https:// vs. http:// — a real security check', p:'`url.startswith("https://")` checks the connection is encrypted — without it, anything typed (including passwords) travels unprotected.' },
    ],
    realWorld: 'Every online payment, every login form, depends on that padlock/https check being real — this chapter writes the exact check your own browser performs automatically, every single page load.',
    image: { file: 'padlock.jpg', caption: 'What https:// actually protects --- this chapter\'s real security check.', credit: 'Padlock — Alyson Hurt, CC BY 2.0, via Wikimedia Commons' },
    discovery: 'Check the address bar on 3 different real websites you use. Do they all start with https://? What would you do differently on a page that only had http://?' },
  cyber: { emoji:'🔐', name:'Cyber Defense', sub:'Lookalike domains, why passwords are hashed, and combining real red flags',
    stages:['Spot the Lookalike Domain','Why Sites Never Store Your Real Password','Phishing Email Red Flags'], boss:'Build a Full Security Check',
    concepts:[
      { h:'== checks EXACT equality — a lookalike is never equal', p:'"rea1bank.com" (a "1" instead of "l") looks right at a glance, but `==` compares character by character — genuinely NOT equal to the real domain, even when a human skimming it would not notice.' },
      { h:'Hashing — easy forwards, genuinely impractical backwards', p:'Summing every character\'s ASCII code with `ord()` gives ONE number computed FROM the password — but given only that number, there is no way back to which exact characters produced it.' },
      { h:'Combining AND and OR — one function, three real signals', p:'`asks_for_password and (urgent_language or unknown_sender)` makes asking for a password the non-negotiable requirement, with EITHER other signal enough to confirm it.' },
      { h:'BOSS — layering two real functions into one decision', p:'`is_real_domain(url) and not is_phishing(...)` — a real security system trusts multiple independent checks agreeing, never just one alone.' },
    ],
    realWorld: 'Typosquatting (registering a domain one character off from a real one) is a genuine, common real attack, not a hypothetical — this chapter\'s exact-match check is the real defence against it. A real data breach leaking a hashed password database does not hand attackers your actual password.',
    image: { file: 'padlock.jpg', caption: 'What a hash actually protects --- easy to compute forwards, genuinely impractical to reverse.', credit: 'Padlock — Alyson Hurt, CC BY 2.0, via Wikimedia Commons' },
    discovery: 'Look closely at a real website address you trust. Could you spot a lookalike version of it (swapping a letter for a similar-looking number)? Try writing one out on paper.' },
  m9w: { emoji:'🖥', name:'M9 — Interactive Apps', sub:'A canvas app with real state: menu -> running -> results',
    stages:['Three Kinds of Bugs','Trace Tables','app_state','Guards & Drawing','A Growing List','try/except'], boss:'M9 Capstone',
    concepts:[
      { h:'Three kinds of bugs, three different fixes', p:'A syntax error means Python can\'t parse your code. A logic error runs but gives the wrong answer. A runtime error crashes only on certain inputs. Naming which kind you have points to the right fix.' },
      { h:'app_state — a real state machine', p:'`app_state` is text ("menu", "running", "results") checked with if/elif — exactly Grade 7\'s state-machine idea, now controlling a real interactive app.',
        diagram: String.raw`
        \node[draw, thick, minimum width=2.2cm, fill=cyan!15] (m) at (0,0) {menu};
        \node[draw, thick, minimum width=2.2cm, fill=cyan!15] (r) at (3.2,0) {running};
        \node[draw, thick, minimum width=2.2cm, fill=cyan!15] (e) at (6.4,0) {results};
        \draw[->, thick] (m) -- (r) node[midway,above]{\small start};
        \draw[->, thick] (r) -- (e) node[midway,above]{\small finish};` },
      { h:'Combining state, guards, and drawing', p:'Checking a divisor isn\'t 0 BEFORE dividing (a guard) prevents a real crash on a genuinely possible input — percentage, app_state, and drawing, all connected.' },
      { h:'try/except — a different error, same pattern', p:'`int("abc")` raises a ValueError, caught with the exact same try/except pattern as any other error type — a real app can\'t just crash on unexpected input.' },
    ],
    realWorld: 'Every real ATM walks through exactly this menu -> running -> results state pattern (select account -> processing -> show balance), with guard checks at every step (insufficient funds, wrong PIN) so it never just crashes on unexpected input.',
    image: { file: 'atm.jpg', caption: 'A real ATM walks through menu, then processing, then result --- the same state machine this chapter builds.', credit: 'ATM interface, Moritz Platt, public domain, via Wikimedia Commons' },
    discovery: 'Watch someone use an ATM (or recall using one). List the distinct "screens"/states it goes through from inserting a card to getting cash. Where do you think it needs a guard check (insufficient funds, wrong PIN)?' },
  m10: { emoji:'🏆', name:'M10 — Capstone: Data App', sub:'Plan -> build -> test -> ship a data-driven app of your own',
    stages:['Loading Data','Marking Answers','Write Then Read Back','The Whole App','A Real Leaderboard','Finishing Touches'], boss:'Ship Your Data App',
    concepts:[
      { h:'Every real app starts with loading data', p:'Loading `questions` and `answers` as two SEPARATE lists, always appended together, keeps them lined up — `questions[i]` and `answers[i]` always belong to the same row.' },
      { h:'Writing a file, then reading it back to prove it', p:'`open(..., "w")` writes; a SEPARATE open afterward reads it back — proving the save genuinely persisted, not just that the write command ran.' },
      { h:'A real leaderboard from accumulated data', p:'Reading many appended entries back in and sorting is exactly how a real leaderboard works. `enumerate()` gives both position and value for a ranked display.' },
      { h:'What separates "working" from "finished"', p:'Code that works perfectly but shows the player nothing isn\'t really finished. `except FileNotFoundError:` means the app survives even if a data file goes missing.' },
    ],
    realWorld: 'Every shipped quiz app, leaderboard, or scoring system went through exactly this: load real data, score it, save results, then handle the real world not always cooperating (a missing file, unexpected input) — never just crashing.',
    discovery: 'Before opening the platform: what\'s ONE thing that could realistically go wrong with your data app (a missing file, an empty list, bad input)? Real developers plan for at least one of these before calling anything "finished".' },
}

const ORDER = [
  'web0','web1','web2','web3','web4','web5',
  'ws1','ws2','ws3','ws4','ws5',
  'py1','py2','py3','py4','py5','adv',
  'm1','m2','m3','m4','m5','m6','m7','m8','cyber','m9w','m10',
  'cc1','cc2','cc3','cc4','cc5','cc',
]

// Colorful, kid-friendly accent per arc — Web (real HTML/CSS/JS), Python
// (Semester 2), App Builder (the older m*/cyber content), and Combat Coder
// (Semester 3) each read as a visually distinct "world".
const SECTION_COLOR = {
  webstory: 'orange!85!red',   // ws*/web*: warm orange (matches the story/web arc)
  python:   'blue!65!cyan',    // py*/adv: bright blue, distinct from web orange and appbuild green
  appbuild: 'green!55!teal',   // m*: green (matches Builder City's map accent)
  cyber:    'red!75!black',    // cyber: serious red, matching Grade 7's Security Lab
  combat:   'red!45!black',    // cc*/cc: crimson, distinct from cyber's red — Combat Coder
}
function sectionFor(id) {
  if (id.startsWith('ws') || id.startsWith('web')) return 'webstory'
  if (id.startsWith('py') || id === 'adv') return 'python'
  if (id === 'cyber') return 'cyber'
  if (id.startsWith('cc')) return 'combat'
  return 'appbuild'
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
// em-dash boundary — turns existing, already-verified explanation text
// into genuine itemize bullets rather than a wall of prose.
function toBullets(text) {
  const parts = text.split(/\s+—\s+/).map(s => s.trim()).filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
  return parts.length > 1 ? parts : [text]
}

function chapterTex(id) {
  const d = DECKS[id]
  const stageItems = d.stages.map(s => '        \\item ' + esc(s)).join('\n')
  const conceptFrames = d.concepts.map(c => {
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

  const imageFrame = d.image ? String.raw`
\begin{frame}{Image}
    \begin{center}
    \includegraphics[width=0.5\textwidth]{images/${d.image.file}}

    \large ${md(d.image.caption)}

    \small ${md(d.image.credit)}
    \end{center}
\end{frame}
` : ''

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
\author{ByteForge --- Grade 8 --- App Builder}
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
