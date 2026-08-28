// Generates one Beamer (.tex) teacher presentation per Grade 9 chapter
// (the 24 TIERS entries in grade9-missions.html) into latex/grade9/.
// Same teacher-only pattern as grade7/grade8, with three deliberate
// differences per direct feedback:
//   1. "dig really deep" — more concept coverage per chapter than 7/8.
//   2. explanations are BULLET POINTS (itemize), not paragraphs.
//   3. COLORFUL, kid-friendly theme — a different bright accent colour
//      per major section (Foundations vs. Phase 1/2/3), and (where a
//      real fitting photo exists) more than one image per chapter.
//
// No LaTeX distribution is installed in this environment — these .tex
// files are written but NOT compiled/verified here (see images/CREDITS.md
// and README.md for the same verification discipline used for Grade 7/8).
import { writeFileSync, mkdirSync } from 'fs'

const OUT_DIR = 'c:/Users/user/Downloads/ICT website/latex/grade9'
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

// Bright, kid-friendly accent per section of the course.
const SECTION_COLOR = {
  foundations: 'magenta!70!red',   // Foundations 1-7: hot pink/red
  phase1:      'blue!70!cyan',     // Phase 1 (turtle/piloting): bright blue
  phase2:      'red!80!orange',    // Phase 2 (battles): fiery red-orange
  phase3:      'green!60!teal',    // Phase 3 (data): teal-green
}

const DECKS = {
  f1: { section:'foundations', emoji:'🖥️', name:'Foundations 1 — What Is a Computer?', sub:'CPU, RAM, storage, input/output — the real physical parts',
    missions:['Learn: What Is a Computer?','RAM or Storage?','Input, Process, or Output?','Storage Unit Conversion','Pick the Right Storage'],
    concepts:[
      { h:'A computer is really just 4 jobs', bullets:[
        'INPUT --- getting information IN (keyboard, mouse, a sensor)',
        'PROCESS --- the CPU actually doing the thinking/calculating',
        'OUTPUT --- showing a result (screen, speaker, printer)',
        'STORAGE --- keeping data around, even with the power off',
      ] },
      { h:'RAM vs. Storage --- the single most confused pair', bullets:[
        'RAM = short-term memory --- FAST, but wiped the instant power is lost',
        'Storage (a hard drive/SSD) = long-term memory --- slower, but survives being switched off',
        'Closing your laptop lid without saving = the essay was only ever in RAM',
      ] },
      { h:'The CPU is the "brain", but it is very literal', bullets:[
        'It only ever does exactly what its instructions say --- nothing more',
        'Billions of tiny operations every second, but each one is dead simple',
        '"Smart" behaviour is really just A LOT of simple steps, very fast',
      ] },
      { h:'Storage units --- each one is 1024x the last', bullets:[
        '8 bits = 1 byte --- enough to store one single character',
        '1024 bytes = 1 KB, 1024 KB = 1 MB, 1024 MB = 1 GB, 1024 GB = 1 TB',
        'A text message: a few hundred bytes. A phone photo: a few MB. A whole phone: measured in GB',
      ] },
      { h:'Not all storage devices work the same way', bullets:[
        'HDD --- a spinning magnetic disk, cheap and large, but slower with moving parts that wear out',
        'SSD --- NO moving parts, genuinely faster and more reliable, usually costs more per GB',
        'Cloud --- not really a different type at all, just storage in someone else\'s data centre, reached over the internet',
      ] },
    ],
    images: [
      { file:'cpu.jpg', caption:'A real CPU --- hundreds of gold pins, each one carrying a real electrical signal in or out.', credit:'CPU photo --- Poooow, public domain, via Wikimedia Commons' },
      { file:'circuit.jpg', caption:'Real circuitry --- this is genuinely what "processing" looks like up close.', credit:'Circuit board, Jon Sullivan, public domain, via Wikimedia Commons' },
    ],
    realWorld: ['Every phone, games console, and smart fridge is doing the exact same 4 jobs --- input, process, output, storage --- just in a different shaped box.',
      'A Minecraft server genuinely runs on this: player commands are INPUT, world logic is PROCESSED, what you see is OUTPUT, and the saved world is STORAGE.'],
    discoveries: ['Open Task Manager (or Activity Monitor) and find how much RAM is currently in use. Now find how much storage space is free. Why are these two totally different numbers?',
      'List 3 things your phone does that are pure OUTPUT, and 3 that are pure INPUT. Is anything genuinely both at once (hint: a touchscreen)?'] },

  f2: { section:'foundations', emoji:'🃏', name:'Foundations 2 — Binary (Unplugged)', sub:'What is binary? Transistors, addition, and the classic binary cards',
    missions:['Learn: What Is Binary?','Binary Cards --- Make the Number','Binary Cards --- Addition','BOSS: Bigger Numbers','One Byte, Maxed Out','How Many Bits Do You Need?'],
    concepts:[
      { h:'A transistor is a tiny ON/OFF switch', bullets:[
        'Billions of these inside every chip --- each one is either ON or OFF, nothing in between',
        'ON = 1, OFF = 0 --- that is the ENTIRE alphabet a computer actually uses',
        '"Binary" just means "made of only two symbols"',
      ] },
      { h:'Each binary place is worth double the last', bullets:[
        '1, 2, 4, 8, 16, 32, 64, 128 --- powers of 2, doubling every step left',
        'A binary digit only counts if it is a 1 --- flip a card face-up to "add" its value',
        '22 = 16 + 4 + 2 --- so 22 in binary is 10110',
      ] },
      { h:'Binary addition works with real carrying', bullets:[
        '1 + 1 in one place = 0, carry 1 to the next place --- same idea as carrying in denary addition',
        'The card trick makes this physical: flip cards until their total matches the target number',
      ] },
      { h:'A byte, maxed out --- 8 bits, all set to 1', bullets:[
        '8 cards this time (128, 64, 32, 16, 8, 4, 2, 1) --- one whole byte',
        'Flip EVERY card face-up: 128+64+32+16+8+4+2+1 = 255',
        '255 is the biggest number a single byte can EVER hold --- ties directly to Foundations 1\'s storage units',
      ] },
      { h:'Some numbers need MORE bits than others', bullets:[
        'One byte (8 bits) holds 0 to 255, no further',
        'A number like 400 genuinely will not fit --- it needs a second byte',
        'Bigger numbers are not just "bigger" --- they can outgrow the space you gave them',
      ] },
    ],
    images: [
      { file:'cards.jpg', caption:'Real playing cards fanned out --- the same "flip to include, hide to exclude" idea as the binary cards activity.', credit:'Playing cards --- Imager Visioner, public domain, via Wikimedia Commons' },
    ],
    realWorld: ['Every single photo, song, and message on your phone is stored as nothing but 1s and 0s underneath --- this unplugged activity IS the real mechanism, just done by hand.',
      'A dimmer light switch is NOT binary (it has many in-between levels) --- but a normal light switch genuinely is: only ON or OFF, exactly like one bit.'],
    discoveries: ['Before touching the platform: as a class, physically flip real cards (or paper squares) labelled 16, 8, 4, 2, 1 to build the number 22. Which cards ended up face-up?',
      'Find a real switch in the room that is genuinely binary (only 2 states) and one that is NOT (has a range). What tells them apart?'] },

  f3: { section:'foundations', emoji:'📘', name:'Foundations 3 — Your First Code', sub:'Variables, text vs. numbers, arithmetic --- starting from absolute zero',
    missions:['Learn: What Is a Variable?','Store a Number','What Kind of Value?','Do the Math','Combine Two Texts','A Variable Can Change','True or False?'],
    concepts:[
      { h:'A variable is a labelled box, nothing more', bullets:[
        'It stores ONE value so your code can use it again later',
        '`score = 10` --- the = means "store this", NOT "equals" like in maths',
        'Whatever was in the box before gets completely overwritten',
      ] },
      { h:'Quotes are the entire difference between text and number', bullets:[
        '`10` --- a real number (an integer), you can do maths with it',
        '`"10"` --- text (a string) that just LOOKS like a number --- no quotes, no maths',
        'Mixing these two up is the single most common real beginner mistake',
      ] },
      { h:'+ means something different for numbers vs. text', bullets:[
        'Numbers: `4 + 7` genuinely adds --- gives you `11`',
        'Text: `"Systems " + "Online"` STICKS them together --- gives you `"Systems Online"`',
        'Same symbol, completely different job, depending on the type',
      ] },
      { h:'A variable is not stuck with its first value', bullets:[
        '`health = 100`, then LATER `health = health - 30`',
        'The new value REPLACES the old one --- health now holds 70, permanently',
        'This is exactly what the boss mission needs: store, THEN update',
      ] },
      { h:'A comparison hands back True or False, not a number', bullets:[
        '`score >= 50` is not a number --- it evaluates to a Boolean',
        '`passed = score >= 50` stores that True/False result, just like any other value',
        'This is the exact idea Foundations 4\'s AND/OR/NOT build on next',
      ] },
    ],
    images: [
      { file:'keyboard.jpg', caption:'Every single line of real code you are about to write starts by typing on a keyboard exactly like this one.', credit:'Computer keyboard, public domain, via Wikimedia Commons' },
    ],
    realWorld: ['A game\'s health value (100, then 75, then 50) is a real variable, changing exactly like `score = 10` then `score = 20`.',
      'A username field that will not accept a number as your name is enforcing exactly this "quotes = text" distinction.'],
    discovery: 'Before opening the platform: on paper, write down 3 real variables a video game needs to track (score, lives, time). For each one, is it a NUMBER or TEXT?' },

  f3boss: { section:'foundations', emoji:'🏆', name:'Foundations 3 Capstone — Your First Program', sub:'Combine text and numbers into one real message',
    missions:['BOSS: Your First Program'],
    concepts:[
      { h:'Combining everything from this week', bullets:[
        'Store a callsign (text) AND a health number, together',
        '`str(health)` converts the NUMBER into text so it can join with other text',
        'The final message uses BOTH ideas from this week at once --- nothing new, just assembly',
      ] },
    ],
    realWorld: ['Every "Player1 has 75 HP" message you have ever seen in a game is exactly this: text + a converted number, joined together.'],
    discovery: 'Write out, on paper, the exact message you would want a game to show when a player takes damage. Which parts are text, and which part is a number that needs converting first?' },

  f4: { section:'foundations', emoji:'🔢', name:'Foundations 4 — Binary in Code & Logic', sub:'Real binary conversion, Boolean logic (AND/OR/NOT), and data types',
    missions:['Denary to Binary','Binary to Denary','Learn: Boolean Logic','AND Gate','Truth Table Row','Learn: Data Types','Pick the Type','Type Coercion Trap'],
    concepts:[
      { h:'Converting a number INTO binary, in real code', bullets:[
        'Same powers-of-2 idea as the unplugged cards, now done with `bin(n)` in real code',
        '22 becomes the text `"10110"` --- notice it comes back as a STRING, not a number',
      ] },
      { h:'AND, OR, NOT --- the three basic logic operators', bullets:[
        'AND --- true only if BOTH sides are true (the strictest one)',
        'OR --- true if AT LEAST ONE side is true (the most generous one)',
        'NOT --- simply flips a value: True becomes False, and back again',
      ] },
      { h:'A truth table checks every possible combination', bullets:[
        'Work compound expressions like brackets in maths: innermost first',
        '`NOT (a AND b) OR c` --- do the AND, then NOT it, THEN the OR',
      ] },
      { h:'Every value has a real, specific data type', bullets:[
        'integer (whole number), real/float (decimal), string (text), boolean (True/False)',
        '`"7"` and `7` are genuinely different types even though they look almost identical',
        'Coercion = converting a value from one type to another ON PURPOSE, e.g. `int("42") + 8`',
      ] },
    ],
    images: [
      { file:'traffic.jpg', caption:'A real traffic light is a genuine 3-way logic decision, running on rules exactly like AND/OR/NOT.', credit:'LED traffic lights, public domain (PD-self), via Wikimedia Commons' },
    ],
    realWorld: ['A car will only start (AND logic) if the key is turned AND the door is shut AND it is in park --- every condition genuinely has to be true.',
      'A house alarm triggers on OR logic --- ANY door OR ANY window opening sets it off, not all of them at once.'],
    discoveries: ['Think of a real rule at home or school that uses AND ("you can go out if homework is done AND it is before 6pm"). Which parts have to BOTH be true?',
      'Find a real rule that uses OR instead ("bring an umbrella if it is raining OR very cloudy"). How is that different from an AND rule?'] },

  f5: { section:'foundations', emoji:'🖼️', name:'Foundations 5 — Images', sub:'Pixels, resolution, bit depth --- a picture is just more binary',
    missions:['Learn: What Is a Digital Image?','Count the Lit Pixels','Which Row Has the Most Light'],
    concepts:[
      { h:'An image is really just a grid of numbers', bullets:[
        'Zoom into any real photo far enough and you see individual squares --- pixels',
        'A computer "draws" the image by reading that grid and colouring each pixel',
        'There is no picture "drawn" anywhere --- it is genuinely just numbers',
      ] },
      { h:'Monochrome --- the simplest case, 1 bit per pixel', bullets:[
        'Black-and-white needs only ONE bit per pixel: 0 = dark, 1 = lit',
        '"0110" is four pixels in a row: dark, lit, lit, dark',
      ] },
      { h:'More bits per pixel = more possible colours', bullets:[
        '1 bit = only 2 possibilities (0 or 1)',
        '8 bits = 256 shades of grey',
        '24 bits (8 each for red/green/blue) = over 16 million real colours',
        'More bits = more detail, but also a bigger file',
      ] },
    ],
    images: [
      { file:'sensor.jpg', caption:'A real camera sensor --- each of those tiny squares captures ONE pixel\'s worth of colour.', credit:'CCD image sensor --- Ahmed2IQ, public domain, via Wikimedia Commons' },
    ],
    realWorld: ['Every photo on your phone is millions of pixels, each one just 3 numbers (red, green, blue) --- exactly this chapter\'s idea, at real-world scale.',
      'An old black-and-white video game (1 bit per pixel) genuinely takes up far less storage than a modern photo (24+ bits per pixel) --- same grid idea, wildly different bit depth.'],
    discovery: 'Zoom WAY into any photo on a phone or computer until you can see individual squares. Count how many different colours you can spot in just a small patch --- that is bit depth, visible.' },

  f45boss: { section:'foundations', emoji:'🏆', name:'Foundations 4-5 Capstone — Systems Check Complete', sub:'Binary conversion feeding directly into a real logical decision',
    missions:['BOSS: Systems Check Complete'],
    concepts:[
      { h:'Data representation AND logic, together', bullets:[
        'Convert a binary signal to denary first (Foundations 4)',
        'THEN use a genuine IF decision to answer EVEN or ODD --- not a hardcoded guess',
        'This is exactly how real systems combine data with logic to make an actual decision',
      ] },
    ],
    realWorld: ['A real diagnostic panel reads a raw sensor value (data), THEN decides what warning light to show (logic) --- the exact two-step pattern this boss teaches.'],
    discovery: 'Trace by hand: binary "1010" converts to what denary number, and is that number even or odd? Do the conversion AND the logic check yourself before the platform checks it.' },

  f6: { section:'foundations', emoji:'📊', name:'Foundations 6 — Flowcharts', sub:'Planning an algorithm visually, before writing a single line of code',
    missions:['Learn: What Is a Flowchart?','Trace the Flowchart','Which Shape?','Build It --- Even or Odd','From Flowchart to Code'],
    concepts:[
      { h:'Each flowchart shape has ONE specific job', bullets:[
        'Oval (terminator) --- marks START or END, exactly one of each per flowchart',
        'Rectangle (process) --- a single action, e.g. "add 1 to total"',
        'Diamond (decision) --- a yes/no question with TWO arrows out',
        'Parallelogram (input/output) --- data going in, or being shown to the user',
      ] },
      { h:'A decision diamond becomes an IF/ELSE in real code', bullets:[
        'The diamond IS the condition',
        'Each arrow out of it IS one branch (the IF, and the ELSE)',
        'Plan the diagram first, THEN turn it into real code --- much easier both steps',
      ] },
    ],
    realWorld: ['Every food delivery app\'s "order status" screen (placed -> preparing -> on the way -> delivered) is really a flowchart brought to life, one box per status.',
      'A vending machine is a real flowchart: insert money (input) -> enough money? (decision) -> dispense (process) or ask for more (loop back).'],
    discoveries: ['Sketch a flowchart for "deciding what to wear based on the weather" --- at least one decision diamond, at least one process box.',
      'Find a real flowchart online for something ordinary (making tea, a school fire drill). Which shape did they use for the very first step? Was it really a terminator?'] },

  f7: { section:'foundations', emoji:'📟', name:'Foundations 7 — Flight Computer', sub:'Loops, MOD, averages, sorting, and recursion --- real algorithmic thinking',
    missions:['First Transmission','Countdown Log','Fizz Report','Average Fuel Reading','Sort the Manifest','Recursive Fuel Calculation'],
    concepts:[
      { h:'A loop that COMPUTES something, not just repeats', bullets:[
        'An accumulator: start a total at 0, add ONE more value each pass through the loop',
        'By the end, the total holds the sum of everything --- genuinely useful, not just repetition',
      ] },
      { h:'MOD tests whether something divides evenly', bullets:[
        '`i % 3 == 0` is true exactly when i is a multiple of 3 --- remainder 0',
        'Combine with OR to catch multiples of 3 OR 5, plus a counter',
      ] },
      { h:'Bubble sort --- the classic, done for real', bullets:[
        'Compare NEIGHBOURING items, swap if they are the wrong way round',
        'Repeat enough passes and the largest values "bubble" to the end',
        'Simple to trace by hand --- genuinely why it is taught first',
      ] },
      { h:'Recursion --- a function that calls ITSELF', bullets:[
        'Factorial(5) = 5 x Factorial(4), all the way down to Factorial(1) = 1',
        'That final Factorial(1) is the BASE CASE --- miss it and it never stops',
      ] },
    ],
    images: [
      { file:'rocket.jpg', caption:'A real flight computer runs on exactly this kind of algorithmic thinking --- loops, thresholds, sorting real sensor data.', credit:'Space Shuttle launch --- NASA, public domain, via Wikimedia Commons' },
    ],
    realWorld: ['A real rocket launch genuinely uses running totals (fuel remaining), threshold checks (abort if below X), and sorted telemetry data --- this chapter\'s ideas, for real.',
      'Sorting a leaderboard by score is bubble sort\'s exact job, just usually done by a faster algorithm at real scale.'],
    discovery: 'By hand, bubble-sort these 5 numbers on paper: 64, 34, 25, 12, 22. How many full passes did it take before nothing needed swapping?' },

  f7boss: { section:'foundations', emoji:'🏆', name:'Foundations 7 Capstone — Flight Computer Online', sub:'A loop AND a decision, working together on real sensor data',
    missions:['BOSS: Flight Computer Online'],
    concepts:[
      { h:'Every real algorithm combines simple pieces', bullets:[
        'Loop through every sensor reading (Foundations 7)',
        'Make a decision per item --- is THIS reading above the threshold?',
        'Count how many readings cross it --- a genuinely common real data-processing shape',
      ] },
    ],
    realWorld: ['A weather station counting "how many days this month were over 30 degrees" is exactly this pattern: loop + threshold decision + counter.'],
    discovery: 'Given readings 80, 90, 70, 85, 95 and a threshold of "above 80", work out by hand how many actually count --- then check your answer against the mission.' },

  t1: { section:'phase1', emoji:'🧭', name:'Tier 1 — Sequencing', sub:'Your code does EXACTLY what you write, in EXACTLY that order',
    missions:['Dock at the Station','Around the Wall','Steering Damaged'],
    concepts:[
      { h:'Sequence: a program is a list, done in order', bullets:[
        '`forward(d)` moves in the direction you currently face',
        '`left(90)`/`right(90)` rotate on the spot, no movement',
        'Real code now, not blocks --- exact punctuation has to be right',
      ] },
      { h:'Planning around an obstacle', bullets:[
        'Read the WHOLE scene before writing a single line',
        'The shortest-LOOKING route can be completely wrong if a wall is in the way',
        'Touching a wall is a genuine mission failure, like a real crash',
      ] },
      { h:'Working within a real constraint', bullets:[
        'Steering "damaged" --- only forward()/backward() available, no turning',
        'The right tool is not always the familiar one --- back up, do not try to turn around',
      ] },
    ],
    images: [
      { file:'rocket.jpg', caption:'Every mission in this tier is you writing the real flight sequence for a real vehicle --- exactly the same discipline a real launch needs.', credit:'Space Shuttle launch --- NASA, public domain, via Wikimedia Commons' },
    ],
    realWorld: ['A GPS giving turn-by-turn directions is a real sequence: exact steps, exact order, no skipping ahead.'],
    discovery: 'On paper, write the exact sequence of forward/turn instructions to get from your classroom door to your own desk. Could someone who has never been in the room follow it perfectly?' },

  t2: { section:'phase1', emoji:'🔁', name:'Tier 2 — Loops', sub:'Repeating a pattern by NAME, not by hand --- and why lines of code now matter',
    missions:['Comet Chain','Staircase Climb','Expanding Spiral','Hexagon Patrol'],
    concepts:[
      { h:'for i in range(4): --- say it once, it happens 4 times', bullets:[
        'A square is the SAME 2 actions repeated 4 times',
        'Write the pattern ONCE inside the loop instead of 4 separate times',
        'Stars now count LINES of code, not moves --- fewer lines, same result',
      ] },
      { h:'The loop variable is real, usable data', bullets:[
        '`for i in range(1, 7):` makes i genuinely count 1, 2, 3... 6',
        '`forward(40 * i)` makes each leg automatically longer --- i is DATA, not just a counter',
        'Change "6 legs" to "12 legs" and only ONE number needs changing',
      ] },
      { h:'360 / sides = the turn angle, for ANY regular shape', bullets:[
        'A hexagon turns 60 degrees each corner (360/6)',
        'The exact same formula works for a triangle, square, or octagon',
      ] },
    ],
    realWorld: ['A washing machine\'s spin cycle is a real loop: repeat "spin, pause" a set number of times, exactly like `for i in range(N):`.',
      'Minecraft building a straight fence or row of torches by hand is literally what a loop automates --- the same repeated action, over and over.'],
    discovery: 'Work out by hand: what is 360 divided by the number of sides for a triangle, a pentagon, and an octagon? Notice the pattern before checking the platform.' },

  t3: { section:'phase1', emoji:'🚦', name:'Tier 3 — Signals & Decisions', sub:'Real IF-based decisions on real data the mission gives you',
    missions:['Beacon Run','Three-Way Beacon','Alternating Signal Beacons'],
    concepts:[
      { h:'IF --- a real decision, not a fixed pattern', bullets:[
        'Beacon colours (G, R, G) are real DATA your code reads and reacts to',
        'G turns left, R turns right --- your FIRST mission requiring a genuine decision',
      ] },
      { h:'if / elif / else --- three-way decisions', bullets:[
        'Three colours need a THREE-way decision, not just if/else',
        'Only the FIRST matching branch runs --- checked top to bottom',
        '"Do nothing" (fly straight) is a real, valid branch too',
      ] },
      { h:'MOD/% uses a number\'s POSITION, not just its value', bullets:[
        '`enumerate()` gives you BOTH the index and the value together',
        '`i % 2` --- remainder 0 means even position, remainder 1 means odd',
        'This is exactly how every "every other item" pattern in real code works',
      ] },
    ],
    images: [
      { file:'traffic.jpg', caption:'A real traffic light is a real three-way decision --- red, amber, or green, exactly one branch active at a time.', credit:'LED traffic lights, public domain (PD-self), via Wikimedia Commons' },
    ],
    realWorld: ['A pedestrian crossing button genuinely reads a real signal (has it been pressed?) and reacts with a real decision (change the light eventually).'],
    discovery: 'Watch a real traffic light for a few minutes. What are the THREE states, and does it ever skip straight from red to green with no amber?' },

  p1boss: { section:'phase1', emoji:'🏆', name:'Phase 1 Capstone — Everything, Combined', sub:'Waypoints, an obstacle, and a precise planned route',
    missions:['BOSS: Comet Field Capstone'],
    concepts:[
      { h:'Nothing new, just combined', bullets:[
        'Waypoints --- loops',
        'An obstacle --- planning',
        'A precise route --- sequence',
        'Plan on paper BEFORE writing a single line of code',
      ] },
      { h:'Stars go back to counting COMMANDS, not lines', bullets:[
        'A clever loop that LOOKS efficient in code but flies a longer real path scores worse',
        'Efficiency in code and efficiency in the real result are not always the same thing',
      ] },
    ],
    realWorld: ['A delivery drone planning a route around no-fly zones combines exactly these three ideas: loops for repeated legs, planning for obstacles, and an exact sequence.'],
    discovery: 'Sketch the whole route on paper first --- waypoints, the obstacle, start and end. Count how many forward/turn commands your PLAN needs before writing any code.' },

  p2tut: { section:'phase2', emoji:'⚔️', name:'Phase 2 Tutorial — Your Code Fights', sub:'A turn-based loop: read state, decide, act --- every single turn',
    missions:['First Contact','Return Fire'],
    concepts:[
      { h:'Your code re-runs fresh, every single turn', bullets:[
        'Not write-once-run-once like the turtle missions',
        'Reads the LATEST `state` every turn --- your hp, the enemy, everything',
        '`attack(id)` or `wait()` --- whichever fires first is your move',
      ] },
      { h:'This is a real, common program shape', bullets:[
        '"Loop forever: read the situation, decide, act"',
        'A game engine, a robot controller, even a thermostat all work this way',
      ] },
      { h:'Hesitation has a real cost', bullets:[
        'An enemy that fights back changes everything',
        '`wait()` is not neutral if you are taking damage for free',
        'Read `state["self"]["hp"]` --- your OWN status matters too, not just the enemy\'s',
      ] },
    ],
    images: [
      { file:'joystick.jpg', caption:'This tier is a real turn-based fight --- read the situation, decide, act, exactly like a real game controller input loop.', credit:'Atari 2600 joystick --- Evan-Amos, public domain, via Wikimedia Commons' },
    ],
    realWorld: ['A thermostat genuinely runs "read temperature, decide, act (heat or don\'t)" forever, exactly like this tier\'s battle loop.'],
    discovery: 'Think of a real turn-based game you know (chess, a card game). What "state" would your code need to read before deciding its next move?' },

  p2fn: { section:'phase2', emoji:'🧰', name:'Functions Required', sub:'Decomposition --- breaking a decision into a named, reusable piece',
    missions:['Double Trouble','Weakest First'],
    concepts:[
      { h:'Why a function, not just inline code', bullets:[
        'With 2+ enemies, "which one do I attack" is a real decision worth naming',
        '`def pick_target():` isolates that ONE decision cleanly',
      ] },
      { h:'Decomposition --- a genuinely important real skill', bullets:[
        'Break one tangled problem into a named, callable piece that does ONE job',
        'Every mission from here on REQUIRES this, not just allows it',
      ] },
      { h:'The "find the minimum" scanning pattern', bullets:[
        'Assume the first item is the answer',
        'Check every OTHER item --- update only if something beats it',
        'This exact pattern finds ANY extreme value, min or max, in ANY list',
      ] },
    ],
    realWorld: ['A hospital triage system genuinely uses this exact "find the weakest/most urgent first" scanning pattern to decide who gets seen first.'],
    discovery: 'Given enemy HPs 40, 15, 60, 25 --- trace the "assume first, check the rest" pattern by hand. Which one wins, and after checking which one did the answer change?' },

  p2state: { section:'phase2', emoji:'🛡', name:'State Tracking', sub:'A new action (defend), and reading the turn counter to predict danger',
    missions:['Shields Up','Shield Recharge'],
    concepts:[
      { h:'defend() trades offense for survival', bullets:[
        'Halves incoming damage this turn --- but you do NOT attack',
        'A genuine real trade-off, not a free bonus',
      ] },
      { h:'Reading state["turn"] to predict the future', bullets:[
        '`turn % 3 == 0` catches every 3rd turn --- the same MOD trick, new job',
        'Timing a defensive move BEFORE the big hit lands, not after',
      ] },
    ],
    realWorld: ['A boxer blocking right before a known haymaker is timing exactly like this --- predicting from a pattern, not reacting after being hit.'],
    discovery: 'If a boss always charges its big attack on turn 3, 6, 9... which turns should you defend on? Write out the first 5 turns you would defend.' },

  p2multi: { section:'phase2', emoji:'👥', name:'Multiple Enemies', sub:'Prioritizing by real threat, not by convenience',
    missions:['Twin Threats','Triple Threat'],
    concepts:[
      { h:'"Closest" and "most dangerous" are different questions', bullets:[
        'A cheap-hp-but-hard-hitting enemy can be MORE dangerous than a tanky one',
        'Compare a MEANINGFUL property (danger), not just convenience (first in the list)',
      ] },
      { h:'Ranking, not just finding one extreme', bullets:[
        'With 3+ enemies, one comparison is not enough',
        'Same "assume first, check the rest" pattern, just comparing attack instead of hp',
      ] },
    ],
    realWorld: ['A goalkeeper facing 3 attackers has to judge who is the REAL threat right now, not just who is closest --- exactly this tier\'s prioritization skill.'],
    discovery: 'Given 3 enemies with (hp, attack) of (10, 50), (100, 5), (40, 20) --- which would you attack first, and why? Compare answers as a class before checking who is "correct".' },

  p2adapt: { section:'phase2', emoji:'🔰', name:'Adaptive AI', sub:'An enemy that reacts to YOUR pattern --- and one where hesitation is fatal',
    missions:['Shield Breaker','Berserker'],
    concepts:[
      { h:'A shield that punishes repetition', bullets:[
        'Attacking every single turn now backfires',
        'Alternate attack()/wait() --- beats a mechanic built to punish sameness',
      ] },
      { h:'"Adaptive" just means state-dependent, not learning', bullets:[
        'The shield is not learning from you --- it is a rule tied to a counter',
        'Same idea as timing a defend(), just from the enemy\'s side',
      ] },
      { h:'Sometimes caution is the WRONG instinct', bullets:[
        'An enemy that gets angrier as it is hurt punishes stalling',
        'Rushing it down beats waiting --- the opposite lesson from Shields Up',
      ] },
    ],
    realWorld: ['A video game boss with a "berserk" mode at low health is exactly this --- the correct strategy flips once a threshold is crossed.'],
    discovery: 'If an enemy gets 20% stronger every turn it survives, is it better to rush it down fast or play safe? Argue both sides before checking which one actually wins.' },

  p2boss: { section:'phase2', emoji:'👹', name:'Phase 2 Boss', sub:'Prioritization + shield-timing + charge-timing, all at once',
    missions:['BOSS: Twin Core'],
    concepts:[
      { h:'Every Phase 2 skill, simultaneously', bullets:[
        'Two enemies --- prioritize the cheap-and-dangerous one',
        'A shield --- alternate attacks',
        'A 3rd-turn charge --- time your defend()',
        'Nothing new --- everything at once, under real pressure',
      ] },
      { h:'A function is required here, on purpose', bullets:[
        'With this many moving parts, inlining everything becomes an unreadable mess',
        'A clean `pick_target()` is exactly the decomposition this whole tier built toward',
      ] },
    ],
    realWorld: ['A real emergency dispatcher juggling multiple incidents at once, each with its own urgency AND timing, is this exact combined-skill challenge.'],
    discovery: 'Before coding anything: write in plain English the FULL plan for this fight --- who to target, when to shield, when to attack. Does your plan cover every mechanic?' },

  p3read: { section:'phase3', emoji:'📦', name:'Read & Report', sub:'A brand new mission type --- no battle, just real data',
    missions:['Cargo Count','Crew Roster'],
    concepts:[
      { h:'A list of records, and ONE function: answer()', bullets:[
        '`data` is a list of records --- each has named fields like item, weight',
        'Loop through every record, add up a total, call `answer(value)` exactly once',
      ] },
      { h:'This is an extremely common real task', bullets:[
        '"Loop a table, total one column" --- spreadsheets and databases do this constantly',
      ] },
      { h:'Finding a maximum --- why it MUST be a loop', bullets:[
        'Cannot hardcode "the third one" --- has to work for ANY list, not just this data',
        'Assume the first record is best, check every other record',
      ] },
    ],
    images: [
      { file:'barchart.png', caption:'Real data, visualised --- once you can total and scan a table like this chapter teaches, a real chart like this is one small step further.', credit:'Bar chart --- Egorik H, public domain / CC BY-SA 4.0, via Wikimedia Commons' },
    ],
    realWorld: ['A school attendance spreadsheet totalling absences per student is EXACTLY this pattern --- loop, add, report.'],
    discovery: 'Given a class of 5 students\' test scores, work out the total and the highest score by hand, tracking both as you go --- the same dual-tracking this chapter needs.' },

  p3decide: { section:'phase3', emoji:'🗺️', name:'One Decision', sub:'Minimum search, counting matches, and a running total going DOWN',
    missions:['Route Planner','Threat Count','Fuel Budget'],
    concepts:[
      { h:'Minimum uses the same pattern, flipped', bullets:[
        '"Cheapest route" is a minimum search --- same scanning idea as maximum, just `<` instead of `>`',
        'Track the NAME and the cost together as you scan',
      ] },
      { h:'A running counter driven by an IF inside a loop', bullets:[
        '"How many contacts have more than 50 hp" --- loop + IF + counter',
        'Counting is NOT the same as summing --- the value itself never gets added anywhere',
      ] },
      { h:'A running total that goes DOWN, not up', bullets:[
        'Start a budget, SUBTRACT each cost as you loop --- same shape as adding, opposite direction',
      ] },
    ],
    realWorld: ['A road trip app finding the cheapest route between petrol stations is a real minimum-search, exactly like Route Planner.'],
    discovery: 'Given route costs 20, 35, 15, 40 --- which is cheapest, and how many cost MORE than 25? Answer both by hand before checking the platform.' },

  p3strategy: { section:'phase3', emoji:'🔭', name:'Full Strategy', sub:'Data-reading feeds directly into a live battle decision',
    missions:['Blind Contact','Hidden Threat','Two Mechanics, No Scaffolding'],
    concepts:[
      { h:'The data skill now feeds directly into combat', bullets:[
        'Enemy attack values are hidden --- read `state["intel"]` first, like Phase 3\'s data missions',
        'THEN use that to prioritize, exactly like Double Trouble',
      ] },
      { h:'Stale data is a real, important trap', bullets:[
        'Intel is a SNAPSHOT from before the fight started --- it does not update as enemies die',
        'Cross-check against the LIVE enemy list before acting on old intel',
      ] },
      { h:'Two functions working together', bullets:[
        '`true_attack(id)` looks up ONE enemy\'s real stat',
        '`most_dangerous()` calls it repeatedly while scanning everyone still alive',
      ] },
    ],
    realWorld: ['Using an old weather forecast instead of checking right now before deciding whether to bring an umbrella is exactly the "stale data" trap this tier warns about.'],
    discovery: 'If your intel says an enemy has 50 attack, but it was destroyed 2 turns ago, is that intel still safe to act on? What should your code check first?' },

  p3boss: { section:'phase3', emoji:'🛰️', name:'Phase 3 Capstone', sub:'Hidden stats, a shield, a timed charge, two enemies --- everything, at once',
    missions:['BOSS: Deep Contact'],
    concepts:[
      { h:'Every Phase 2 and Phase 3 idea, combined', bullets:[
        'The recon report is the ONLY way to know the real attack power --- misread it, lose',
        'A real targeting function, cross-checked against who is alive',
        'Alternating for the shield, aware of the 3rd-turn charge',
        'All under a tight turn limit',
      ] },
      { h:'Nothing here is new', bullets:[
        'Sequencing, loops, functions, decomposition, prioritization, live vs. stale data, timing',
        'This capstone just proves you can bring ALL of it together into one coherent plan',
      ] },
    ],
    realWorld: ['A real emergency response combining live data, resource limits, and timing under pressure is genuinely this same combined-skill shape, at real-world stakes.'],
    discovery: 'Before writing any code: write your FULL plan on paper --- how you read intel, how you pick a target, when you shield, when you attack. Trade plans with a partner and find one gap in each.' },
}

const ORDER = ['f1','f2','f3','f3boss','f4','f5','f45boss','f6','f7','f7boss',
  't1','t2','t3','p1boss',
  'p2tut','p2fn','p2state','p2multi','p2adapt','p2boss',
  'p3read','p3decide','p3strategy','p3boss']

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

function chapterTex(id) {
  const d = DECKS[id]
  const missionItems = d.missions.map(s => '        \\item ' + esc(s)).join('\n')

  const conceptFrames = d.concepts.map(c => {
    const bulletItems = c.bullets.map(b => '        \\item ' + md(b)).join('\n')
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

  const imageFrames = (d.images || []).map(img => String.raw`
\begin{frame}{Image}
    \begin{center}
    \includegraphics[width=0.5\textwidth]{images/${img.file}}

    \large ${md(img.caption)}

    \small ${md(img.credit)}
    \end{center}
\end{frame}
`).join('\n')

  const realWorldItems = (Array.isArray(d.realWorld) ? d.realWorld : [d.realWorld])
    .map(t => '        \\item ' + md(t)).join('\n')

  const discoveryFrames = (d.discoveries || [d.discovery]).map((text, i) => String.raw`
\begin{frame}{Let Them Discover${d.discoveries ? ' (' + (i + 1) + '/' + d.discoveries.length + ')' : ''}}
    \large
    ${md(text)}
\end{frame}
`).join('\n')

  return preambleFor(d.section) + String.raw`
\title{${md(d.name)}}
\subtitle{${md(d.sub)}}
\author{ByteForge --- Grade 9 --- The Deep Diver}
\date{}

\begin{document}

\begin{frame}
    \titlepage
\end{frame}

\begin{frame}{Today's Missions}
    \Large
    \begin{itemize}
${missionItems}
    \end{itemize}
\end{frame}
${conceptFrames}
\begin{frame}{Real-World Examples}
    \large
    \begin{itemize}
${realWorldItems}
    \end{itemize}
\end{frame}

${imageFrames}${discoveryFrames}
\begin{frame}{Your Turn}
    \Large
    Open the mission map, find \textbf{${md(d.name)}}, and fly it for real ---
    everything you just saw, you now do yourself.
\end{frame}

\end{document}
`
}

for (const id of ORDER) {
  const tex = chapterTex(id)
  writeFileSync(OUT_DIR + '/' + id + '.tex', tex, 'utf8')
}
console.log('Wrote ' + ORDER.length + ' .tex files to ' + OUT_DIR)
