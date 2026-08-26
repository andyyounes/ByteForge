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
const s = html.indexOf('const CHALLENGES = [')
const m = html.slice(s).match(/\r?\n\]\r?\n/) // the array closes on its own bare "]" line, no semicolon
const ctx = html.slice(s, s + m.index + m[0].indexOf(']') + 1)
const { CHALLENGES } = new Function(ctx + '\nreturn { CHALLENGES }')()

console.log(`Found ${CHALLENGES.length} IGCSE Y1 challenges.\n`)

// Real correct answers, transcribed from each challenge's own hints.
const ANSWERS = {
  'M1/Binary→Decimal': '214',
  'M1/Decimal→Hex': 'AF',
  'M1/File Size': '1.37',
  'M1/Sound Digitisation': 'Sound is an analogue wave. An ADC takes a sample at regular intervals — the sample rate is how many samples are taken per second, and the bit depth (sample depth) is how many levels each sample can have.',
  'M2/CPU Components': 'The ALU performs arithmetic and logical calculations. The CU (control unit) fetches, decodes and coordinates execution of instructions. Registers are tiny ultra-fast storage locations inside the CPU.',
  'M2/RAM vs ROM': 'RAM is volatile and loses its contents when power is removed, and can be both read and written. ROM is non-volatile and is read-only.',
  'M2/FDE Cycle': 'Fetch: the PC holds the address of the next instruction, which is copied via the MAR into the MDR then the CIR. Decode: the CU decodes the instruction in the CIR. Execute: the ALU carries out the decoded instruction.',
  'M2/Device Types': 'An example input device is a keyboard, used to type text in. An example output device is a monitor, used to display images. An example storage device is a hard disk, used to store files permanently.',
  'M3/LAN vs WAN': 'A LAN covers a small geographic area like one building and is usually owned by a single organisation, while a WAN covers a much larger area and often spans multiple organisations.',
  'M3/Client-Server vs P2P': 'In a client-server network a central server provides resources to clients — an advantage is easier centralised security, a disadvantage is the server is a single point of failure. In peer-to-peer, all devices are equal and share resources directly.',
  'M3/TCP/IP Layers': 'The Application layer provides services to programs like HTTP and email. The Transport layer ensures reliable end-to-end delivery using TCP. The Internet layer handles addressing and routing with IP. The Network Access layer handles physical transmission on the local network.',
  'M3/Protocols': '1. SMTP is used for sending email. 2. HTTPS is used for browsing a secure website. 3. FTP is used for transferring files between servers.',
  'M4/Encryption': 'Encryption converts plaintext into ciphertext using a key. Symmetric encryption uses the same key for both encryption and decryption. Asymmetric encryption uses a public key to encrypt and a different private key to decrypt.',
  'M4/Malware Types': 'This is a keylogger, a type of spyware. A virus attaches itself to files and replicates when the file is run. A worm self-replicates across a network without needing a host file.',
  'M4/Network Protection': 'A firewall monitors incoming and outgoing traffic and blocks unauthorised access. Encryption scrambles data so it cannot be read if intercepted. Password authentication ensures only authorised users can log in.',
  'M4/Ethics Dilemma': 'For: mass surveillance could increase security by catching criminals faster and protecting citizens. Against: it invades the privacy of innocent people and threatens their freedom of speech.',
  'M5/Bubble Sort Trace': '3,5,1,6,8\n3,1,5,6,8\n1,3,5,6,8\n1,3,5,6,8',
  'M5/Search Complexity': 'Linear search is O(n) in the worst case since every element may need to be checked. Binary search is O(log n) because it halves the search space each time, but the data must be sorted first.',
  'M5/Stacks (LIFO)': 'A stack is LIFO — last in, first out — meaning the last item added is the first removed. PUSH adds an item to the top and POP removes the top item. One real-world example is the function call stack, which stores return addresses.',
  'M5/Trace Table': '3\n5',
}

let pass = 0, fail = 0
for (const ch of CHALLENGES) {
  const id = `${ch.mod}/${ch.name}`

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

console.log(`\n${pass} passed, ${fail} failed.`)
if (fail > 0) process.exit(1)
console.log('\nall IGCSE Y1 challenge checks correctly reject blank/garbage answers AND accept a real correct answer')
