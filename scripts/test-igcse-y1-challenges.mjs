// Verifies every IGCSE Y1 challenge's check(ans) predicate is non-vacuous
// AND correctly accepts a real, hand-authored correct answer.
//
// Y1's 20 challenges each accept a free-typed text answer via ad-hoc
// per-exercise check(ans) logic (numeric tolerance, case-insensitive string
// match, keyword-set matching, etc.) with no separate canonical "answer"
// field on the challenge object itself — so unlike Grade 6-8 (whose stage
// data structurally IS the correct answer) or AS/A-Level's Code Lab (real
// pseudocode run through the interpreter), a positive-path answer had to be
// hand-authored per challenge here, transcribed from each challenge's own
// hints (the same source a student would use). Keyed by `${mod}/${name}` so
// a reorder of CHALLENGES doesn't silently misalign answers to challenges.
// (Y2's CHALLENGES use a completely different shape — check(code, res) run
// through a real pseudocode interpreter — so it has its own dedicated
// script: scripts/test-igcse-y2-challenges.mjs.)
import { readFileSync } from 'fs'

const html = readFileSync('c:/Users/user/Downloads/ICT website/public/lessons/igcse-y1.html', 'utf8')
// Start from the answer-matching helpers (word/anyWord/clauses/about), not from
// `const CHALLENGES` — the checks call them, so slicing from the array alone
// makes every check throw "word is not defined".
const s = html.indexOf('// ── Answer-matching helpers')
const m = html.slice(s).match(/\r?\n\]\r?\n/) // the array closes on its own bare "]" line, no semicolon
const ctx = html.slice(s, s + m.index + m[0].indexOf(']') + 1)
const { CHALLENGES } = new Function(ctx + '\nreturn { CHALLENGES }')()

console.log(`Found ${CHALLENGES.length} IGCSE Y1 challenges.\n`)

// Real correct answers, transcribed from each challenge's own hints.
const ANSWERS = {
  'M1/Binary→Decimal': '214',
  'M1/Decimal→Hex': 'AF',
  'M1/File Size': '1.37',
  'M1/Binary Addition': '01110011',
  'M1/Binary Subtraction': '01000100',
  'M1/Sound Digitisation': 'Sound is an analogue wave. An ADC takes a sample at regular intervals — the sample rate is how many samples are taken per second, and the bit depth (sample depth) is how many levels each sample can have.',
  'M2/CPU Components': 'The ALU performs arithmetic and logical calculations. The CU (control unit) fetches, decodes and coordinates execution of instructions. Registers are tiny ultra-fast storage locations inside the CPU.',
  'M2/RAM vs ROM': 'RAM is volatile and loses its contents when power is removed, and can be both read and written. ROM is non-volatile and is read-only.',
  'M2/FDE Cycle': 'Fetch: the PC holds the address of the next instruction, which is copied via the MAR into the MDR then the CIR. Decode: the CU decodes the instruction in the CIR. Execute: the ALU carries out the decoded instruction.',
  'M2/Device Types': 'An example input device is a keyboard, used to type text in. An example output device is a monitor, used to display images. An example storage device is a hard disk, used to store files permanently.',
  'M3/LAN vs WAN': 'A LAN covers a small geographic area like one building and is usually owned by a single organisation, while a WAN covers a much larger area and often spans multiple organisations.',
  'M3/Client-Server vs P2P': 'In a client-server network a central server provides resources to clients — an advantage is easier centralised security, a disadvantage is the server is a single point of failure. In peer-to-peer, all devices are equal and share resources directly.',
  'M3/TCP/IP Layers': 'The Application layer provides services to programs like HTTP and email. The Transport layer ensures reliable end-to-end delivery using TCP. The Internet layer handles addressing and routing with IP. The Network Access layer handles physical transmission on the local network.',
  'M3/Protocols': '1. SMTP is used for sending email. 2. HTTPS is used for browsing a secure website. 3. FTP is used for transferring files between servers.',
  'M3/Encryption': 'Encryption converts plaintext into ciphertext using a key. Symmetric encryption uses the same key for both encryption and decryption. Asymmetric encryption uses a public key to encrypt and a different private key to decrypt.',
  'M4/Malware Types': 'This is a keylogger, a type of spyware. A virus attaches itself to files and replicates when the file is run. A worm self-replicates across a network without needing a host file.',
  'M4/Network Protection': 'A firewall monitors incoming and outgoing traffic and blocks unauthorised access. Encryption scrambles data so it cannot be read if intercepted. Password authentication ensures only authorised users can log in.',
  'M4/Ethics Dilemma': 'For: mass surveillance could increase security by catching criminals faster and protecting citizens. Against: it invades the privacy of innocent people and threatens their freedom of speech.',
  'M5/Bubble Sort Trace': '3,5,1,6,8\n3,1,5,6,8\n1,3,5,6,8\n1,3,5,6,8',
  'M5/Search Complexity': 'Linear search is O(n) in the worst case since every element may need to be checked. Binary search is O(log n) because it halves the search space each time, but the data must be sorted first.',
  'M5/Stacks (LIFO)': 'A stack is LIFO — last in, first out — meaning the last item added is the first removed. PUSH adds an item to the top and POP removes the top item. One real-world example is the function call stack, which stores return addresses.',
  'M5/Trace Table': '3\n5',

  // ── Added when the ANSWERS map was found to lag the live CHALLENGES
  // array by 90 entries (M1-M3's identify/fill/complete stages, plus all
  // of M6/M7) — transcribed from each challenge's own hints, same as above.
  'M1/Binary Place Values': '1',
  'M1/Hex Digit Fill-In': '11',
  'M1/Overflow Spotter': 'yes',
  'M1/Shift Effect': 'multiplies',
  "M1/Two's Complement Method": 'add 1',
  'M1/ASCII or Unicode?': 'Unicode',
  'M1/Sample Rate Fill-In': 'rate',
  'M1/Pixel Grid File Size': '32',
  'M1/Kibibyte Power': '10',
  'M1/Lossy or Lossless?': 'lossy',
  'M1/RLE Completion': '1d',
  'M2/Von Neumann Fill-In': 'memory',
  'M2/Bus Identifier': 'data bus',
  'M2/Cache Speed Fill-In': 'faster',
  'M2/CISC or RISC?': 'RISC',
  'M2/Embedded System Spotter': 'yes',
  'M2/Barcode vs QR': 'QR code',
  'M2/Camera Sensor Fill-In': 'pixel',
  'M2/Input Device Match': 'microphone',
  'M2/Optical Mouse Fill-In': 'movement',
  'M2/2D or 3D Scanner?': '3D',
  'M2/Touch Screen Type': 'capacitive',
  'M2/Actuator Fill-In': 'movement',
  'M2/DLP or LCD?': 'DLP',
  'M2/Inkjet Fill-In': 'ink',
  'M2/Laser Printer Fill-In': 'toner',
  'M2/3D Printer Fill-In': 'layer',
  'M2/OLED Advantage': 'OLED',
  'M2/Loudspeaker Fill-In': 'wave',
  'M2/Monitoring vs Control': 'monitoring and control',
  'M2/Sensor Type Match': 'motion',
  'M2/RAM or ROM?': 'ROM',
  'M2/HDD Fill-In': 'disk',
  'M2/SSD Advantage': 'faster',
  'M2/Optical Media Fill-In': 'laser',
  'M2/Virtual Memory Fill-In': 'hard disk',
  'M2/Cloud Storage Advantage': 'anywhere',
  'M2/MAC Address Fill-In': 'unique',
  'M2/IP Address Fill-In': 'network',
  'M2/Router Job': 'path',
  'M2/System or Application?': 'system software',
  'M2/Driver Fill-In': 'hardware',
  'M2/Virus Checker Fill-In': 'signatures',
  'M2/Defrag Fill-In': 'contiguous',
  'M2/Full vs Incremental Backup': 'incremental',
  'M2/Screensaver Original Purpose': 'burning',
  'M2/CLI or GUI?': 'CLI',
  'M2/Memory Management Job': 'memory',
  'M2/Peripheral Management Fill-In': 'drivers',
  'M2/Multitasking Fill-In': 'switching',
  'M2/Account Management Fill-In': 'permissions',
  'M2/BIOS Fill-In': 'operating system',
  'M2/Interrupt Fill-In': 'pause',
  'M2/High or Low Level?': 'high-level',
  'M2/Assembly Fill-In': 'mnemonics',
  'M2/Translator Fill-In': 'machine code',
  'M2/Compiler or Interpreter?': 'compiler',
  'M2/IDE Fill-In': 'debugger',
  'M3/Packet Header Fill-In': 'sequence',
  'M3/Duplex Identifier': 'half-duplex',
  'M3/USB Serial Fill-In': 'serial',
  'M3/Even Parity Bit': '0',
  'M3/Which Error-Check?': 'echo check',
  'M3/Check Digit Position': 'last',
  'M3/ARQ Completion': 'request',
  'M3/Symmetric Key Count': '1',
  'M3/Asymmetric Key Job': 'encrypt',
  'M6/HTTPS Fill-In': 'secure',
  'M6/Browser Job Fill-In': 'render',
  'M6/DNS Fill-In': 'IP',
  'M6/Cookie Purpose': 'session',
  'M6/Cryptocurrency Fill-In': 'central',
  'M6/Blockchain Fill-In': 'previous',
  'M6/Brute Force Fill-In': 'password',
  'M6/DDoS Fill-In': 'devices',
  'M6/Malware Spot the Type': 'Trojan',
  'M6/Phishing or Pharming?': 'pharming',
  'M6/Social Engineering Fill-In': 'human',
  'M7/Automated System Fill-In': 'sensors',
  'M7/Automated Transport Fill-In': 'train',
  'M7/Automated Agriculture Fill-In': 'moisture',
  'M7/Weather Station Fill-In': 'human',
  'M7/Automated Lighting Fill-In': 'light',
  'M7/Robotics Fundamentals Fill-In': 'move',
  'M7/Autonomous Vehicle Fill-In': 'surroundings',
  'M7/Robotics Domain Match': 'medicine',
  'M7/AI Fill-In': 'intelligence',
  'M7/Expert System Fill-In': 'inference',
  'M7/Machine Learning Fill-In': 'data',
}

let pass = 0, fail = 0
for (const ch of CHALLENGES) {
  const id = `${ch.mod}/${ch.name}`

  // "lesson" challenges have no check(ans) at all — they're a book-page
  // iframe self-marked complete via markLessonComplete(), not a typed
  // answer — so there's nothing to author or validate here.
  if (ch.type === 'lesson') continue

  // Negative path: blank / obviously-wrong answers must be rejected.
  for (const bad of ['', 'zzz_definitely_wrong_answer_12345']) {
    try {
      if (!ch.check(bad)) { pass++; console.log(`✓ ${id} — correctly rejects "${bad || '(blank)'}"`) }
      else { fail++; console.log(`✗ ${id} — VACUOUS: "${bad || '(blank)'}" passes check()`) }
    } catch (err) {
      // a check() that throws on bad input (e.g. calling .toUpperCase() on something
      // parseFloat-shaped) is still correctly NOT passing — that's a crash-safety
      // gap worth knowing about, but not a false-positive risk, so count it as pass
      // with a note rather than a hard failure.
      pass++
      console.log(`✓ ${id} — rejects "${bad || '(blank)'}" (throws: ${err.message}) — consider guarding check() against non-numeric input`)
    }
  }

  // Positive path: the real, hand-authored correct answer must be accepted.
  const answer = ANSWERS[id]
  if (answer === undefined) {
    fail++
    console.log(`✗ ${id} — NO AUTHORED ANSWER in ANSWERS map (test gap, not a content bug)`)
    continue
  }
  try {
    if (ch.check(answer)) { pass++; console.log(`✓ ${id} — correctly accepts its authored correct answer`) }
    else { fail++; console.log(`✗ ${id} — REJECTS its own authored correct answer: ${JSON.stringify(answer)}`) }
  } catch (err) {
    fail++
    console.log(`✗ ${id} — check() THROWS on its own authored correct answer: ${err.message}`)
  }
}

// ── Plausible-but-WRONG answers that must be rejected ────────────────────────
// Blank/garbage rejection is a low bar. These are the answers a real student
// with a real misconception would type — mostly INVERTED definitions, i.e.
// exactly what each question exists to catch. Every one of these was ACCEPTED
// before the checks were tightened, because they used bare .includes()
// substring matching ('lan' ⊂ "plan", 'alu' ⊂ "value", 'symmetric' ⊂
// "asymmetric", 'virus' ⊂ "antivirus") and tested clauses independently, so a
// term and a property could be matched even when attached to the wrong subject.
const WRONG = [
  ['M3/LAN vs WAN',        'I want a plan for a large area'],
  ['M3/LAN vs WAN',        'A WAN is small and owned by one person, a LAN is huge and global.'],
  ['M2/RAM vs ROM',        'I read a book about power.'],
  ['M2/RAM vs ROM',        'ROM is volatile and can be written to; RAM is non-volatile and read-only.'],
  ['M2/CPU Components',    'Aluminium is accurate in the register.'],
  ['M2/CPU Components',    'The value of an accurate register'],
  ['M3/Encryption',        'asymmetric key'],
  ['M3/Encryption',        'Asymmetric encryption uses one key for both encryption and decryption.'],
  ['M5/Bubble Sort Trace', '1,3,5,6,8\nqqqq'],
  ['M5/Bubble Sort Trace', '3,1,5,6,8\nnonsense here'],
  ['M5/Stacks (LIFO)',     'LIFO means first in first out. PUSH removes the top item. Undo.'],
  ['M5/Search Complexity', 'Linear search is O(log n) and binary search is O(n); you must sort the data.'],
  ['M5/Trace Table',       '5\n3'],
]
for (const [id, answer] of WRONG) {
  const ch = CHALLENGES.find(c => `${c.mod}/${c.name}` === id)
  if (!ch) { fail++; console.log(`✗ ${id} — challenge not found for wrong-answer case`); continue }
  try {
    if (ch.check(answer)) { fail++; console.log(`✗ ${id} — ACCEPTS a wrong answer: ${JSON.stringify(answer)}`) }
    else { pass++; console.log(`✓ ${id} — correctly rejects a plausible wrong answer`) }
  } catch (err) {
    fail++
    console.log(`✗ ${id} — check() THROWS on a wrong answer: ${err.message}`)
  }
}

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('\nall IGCSE Y1 challenge checks reject blank/garbage AND plausible-wrong answers, and accept a real correct answer')
