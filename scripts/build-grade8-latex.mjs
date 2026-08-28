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
  ws1: { emoji:'📗', name:'Web Story 1 — Remembering the Reader', sub:'Arrays and objects — a story that tracks the reader\'s inventory and flags',
    stages:['Your First Array','Add to the Array','A Flag Object'], boss:'Inventory & Flags Together',
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
      { h:'BOSS — arrays and objects, together', p:'An inventory (an ordered LIST) and a set of flags (NAMED yes/no facts) are genuinely different shapes of data — a real interactive story needs both.' },
    ],
    realWorld: 'Every real e-commerce cart is an array of items plus a set of named flags ("giftWrapped", "expressShipping") — exactly this chapter\'s two data shapes, doing real work. Minecraft\'s own inventory (an ordered list of slots) plus achievement flags (has this player found diamonds yet?) is the same split.',
    image: { file: 'js.png', credit: 'JavaScript logo — Chris Williams, public domain, via Wikimedia Commons' },
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
    image: { file: 'gear.jpg', credit: 'Fixed gear cog — John Reaves, public domain, via Wikimedia Commons' },
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
    image: { file: 'floppy.jpg', credit: 'Floppy disks, George Chernilevsky, public domain, via Wikimedia Commons' },
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
    image: { file: 'python.png', credit: 'Python logo, CC BY 2.5, via Wikimedia Commons' },
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
    image: { file: 'traffic.jpg', credit: 'LED traffic lights, public domain (PD-self), via Wikimedia Commons' },
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
    image: { file: 'gear.jpg', credit: 'Fixed gear cog — John Reaves, public domain, via Wikimedia Commons' },
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
    image: { file: 'circuit.jpg', credit: 'Computer circuit board, Jon Sullivan, public domain, via Wikimedia Commons' },
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
    image: { file: 'padlock.jpg', credit: 'Padlock — Alyson Hurt, CC BY 2.0, via Wikimedia Commons' },
    discovery: 'Check the address bar on 3 different real websites you use. Do they all start with https://? What would you do differently on a page that only had http://?' },
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
    image: { file: 'atm.jpg', credit: 'ATM interface, Moritz Platt, public domain, via Wikimedia Commons' },
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

const ORDER = ['ws1','ws2','ws3','ws4','ws5','m1','m2','m3','m4','m5','m6','m7','m8','m9w','m10']

const PREAMBLE = String.raw`\documentclass[aspectratio=169]{beamer}
\usetheme{Madrid}
\usecolortheme{beaver}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{tikz}
\usepackage{amssymb}
\usepackage{graphicx}
\setbeamertemplate{navigation symbols}{}
\setbeamercolor{title}{fg=white,bg=blue!55!black}
\setbeamercolor{frametitle}{fg=white,bg=blue!45!black}
\setbeamercolor{block title}{bg=blue!15,fg=black}
\setbeamercolor{block body}{bg=blue!5,fg=black}
`

function chapterTex(id) {
  const d = DECKS[id]
  const stageItems = d.stages.map(s => '        \\item ' + esc(s)).join('\n')
  const conceptFrames = d.concepts.map(c => {
    const diagramBlock = c.diagram ? String.raw`

    \begin{center}
    \begin{tikzpicture}[scale=0.9]
${c.diagram}
    \end{tikzpicture}
    \end{center}` : ''
    const mainFrame = String.raw`
\begin{frame}{${md(c.h)}}
    \Large
    ${md(c.p)}${diagramBlock}
\end{frame}
`
    const workedFrame = c.worked ? String.raw`
\begin{frame}{${md(c.h)} --- Worked Example}
    \Large
    ${md(c.worked)}
\end{frame}
` : ''
    return mainFrame + workedFrame
  }).join('\n')

  const imageFrame = d.image ? String.raw`
\begin{frame}{Image}
    \begin{center}
    \includegraphics[width=0.55\textwidth]{images/${d.image.file}}

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

  return PREAMBLE + String.raw`
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
\begin{frame}{Real-World Example}
    \Large
    ${md(d.realWorld)}
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
