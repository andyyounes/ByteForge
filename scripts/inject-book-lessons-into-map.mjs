// One-off script: adds 89 new "lesson" bubbles (self-check completion, no
// check() function) into public/lessons/igcse-y1.html's CHALLENGES array —
// one per rewritten book lesson under public/lessons/igcse-y1-book/. Each
// bubble opens an iframe of the real static lesson page (which already
// carries the teacher-override merge script from
// scripts/inject-book-overrides.mjs) instead of duplicating the content.
//
// Idempotent: strips any previously-injected block (delimited by the
// BOOK-LESSONS-START/END markers) before inserting a fresh copy, so
// re-running after editing the unit→peak mapping below just updates it.
//
// Run with: node scripts/inject-book-lessons-into-map.mjs

import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TARGET = path.join(__dirname, '..', 'public', 'lessons', 'igcse-y1.html')

// Unit → existing/new peak (mod). M1-M5 already exist on the map; M6/M7 are
// new peaks added by this script (see the worlds: [] array patched in below).
const UNIT_TO_MOD = {
  'Unit 1': 'M1',  // Data Representation      -> Peak 1 (already Data Representation)
  'Unit 2': 'M3',  // Data Transmission        -> Peak 3 (Networking)
  'Unit 3': 'M2',  // Hardware                 -> Peak 2 (Hardware & Software)
  'Unit 4': 'M2',  // Software                 -> Peak 2 (Hardware & Software)
  'Unit 5': 'M6',  // The Internet & Its Uses  -> new Peak 6
  'Unit 6': 'M7',  // Automated & Emerging Tech-> new Peak 7
}

// Mirrors lib/igcse-book-manifest.ts (kept in sync by hand — small, stable list).
const UNITS = [
  { unit: 'Unit 1', lessons: [
    ['1-1a-binary-numbers.html', '1.1a Binary Numbers'],
    ['1-1b-hexadecimal.html', '1.1b Hexadecimal'],
    ['1-1c-binary-addition.html', '1.1c Binary Addition & Overflow'],
    ['1-1d-logical-shifts.html', '1.1d Logical Shifts'],
    ['1-1e-twos-complement.html', "1.1e Two's Complement"],
    ['1-2a-ascii-unicode.html', '1.2a ASCII & Unicode'],
    ['1-2b-sound-representation.html', '1.2b Representation of Sound'],
    ['1-2c-image-representation.html', '1.2c Representation of Images'],
    ['1-3a-units-file-size.html', '1.3a Units & File Size'],
    ['1-3b-data-compression.html', '1.3b Data Compression (Lossy)'],
    ['1-3c-lossless-rle.html', '1.3c Lossless Compression & RLE'],
  ]},
  { unit: 'Unit 2', lessons: [
    ['2-1a-data-packets.html', '2.1a Data Packets & Packet Switching'],
    ['2-1b-transmission-modes.html', '2.1b Transmission Modes'],
    ['2-1c-usb.html', '2.1c Universal Serial Bus (USB)'],
    ['2-2a-parity-checks.html', '2.2a Parity Checks'],
    ['2-2b-checksum-echo-check.html', '2.2b Checksum & Echo Check'],
    ['2-2c-check-digits.html', '2.2c Check Digits'],
    ['2-2d-arq.html', '2.2d Automatic Repeat Requests'],
    ['2-3a-symmetric-encryption.html', '2.3a Symmetric Encryption'],
    ['2-3b-asymmetric-encryption.html', '2.3b Asymmetric Encryption'],
  ]},
  { unit: 'Unit 3', lessons: [
    ['3-1a-von-neumann-architecture.html', '3.1a CPU & Von Neumann Architecture'],
    ['3-1b-buses-fetch-decode-execute.html', '3.1b Buses & Fetch-Decode-Execute'],
    ['3-1c-cpu-performance.html', '3.1c Cores, Cache & Clock'],
    ['3-1d-instruction-set.html', '3.1d Instruction Sets'],
    ['3-1e-embedded-systems.html', '3.1e Embedded Systems'],
    ['3-2a-barcodes-qr-codes.html', '3.2a Barcodes & QR Codes'],
    ['3-2b-digital-cameras.html', '3.2b Digital Cameras'],
    ['3-2c-keyboards-microphones.html', '3.2c Keyboards & Microphones'],
    ['3-2d-optical-mouse.html', '3.2d The Optical Mouse'],
    ['3-2e-2d-3d-scanners.html', '3.2e 2D & 3D Scanners'],
    ['3-2f-touch-screens.html', '3.2f Touch Screen Technologies'],
    ['3-2g-actuators-projectors.html', '3.2g Actuators & Light Projectors'],
    ['3-2h-projector-comparison.html', '3.2h DLP vs. LCD Projectors'],
    ['3-2i-inkjet-printers.html', '3.2i Inkjet Printers'],
    ['3-2j-laser-printers.html', '3.2j Laser Printers'],
    ['3-2k-3d-printers.html', '3.2k 3D Printers'],
    ['3-2l-led-lcd-oled-screens.html', '3.2l LED, LCD & OLED Screens'],
    ['3-2m-loudspeakers.html', '3.2m Loudspeakers'],
    ['3-2n-sensors-monitoring-control.html', '3.2n Sensors: Monitoring & Control'],
    ['3-2o-sensor-types.html', '3.2o Types of Sensor'],
    ['3-3a-primary-memory.html', '3.3a Primary Memory: RAM & ROM'],
    ['3-3b-hard-disk-drives.html', '3.3b Hard Disk Drives'],
    ['3-3c-ssd-flash-memory.html', '3.3c SSD & Flash Memory'],
    ['3-3d-optical-media.html', '3.3d Optical Media (CD/DVD/Blu-ray)'],
    ['3-3e-virtual-memory.html', '3.3e Virtual Memory'],
    ['3-3f-cloud-storage.html', '3.3f Cloud Storage'],
    ['3-4a-nic-mac-address.html', '3.4a NIC & MAC Address'],
    ['3-4b-ip-addresses.html', '3.4b IP Addresses'],
    ['3-4c-routers.html', '3.4c Routers'],
  ]},
  { unit: 'Unit 4', lessons: [
    ['4-1a-application-software.html', '4.1a System & Application Software'],
    ['4-1b-system-software-overview.html', '4.1b Drivers, OS, Compilers, Linkers'],
    ['4-1c-virus-checkers.html', '4.1c Virus Checkers'],
    ['4-1d-defragmentation.html', '4.1d Defragmentation Software'],
    ['4-1e-backup-software.html', '4.1e Back-up Software'],
    ['4-1f-security-software-screensavers.html', '4.1f Security Software & Screensavers'],
    ['4-1g-hci-cli-gui.html', '4.1g Human Computer Interfaces'],
    ['4-1h-memory-security-management.html', '4.1h Memory & Security Management'],
    ['4-1i-hardware-peripheral-management.html', '4.1i Hardware Peripheral Management'],
    ['4-1j-file-management-multitasking.html', '4.1j File Management & Multitasking'],
    ['4-1k-user-account-management.html', '4.1k User Account Management'],
    ['4-1l-booting-bios.html', '4.1l Booting Up & BIOS'],
    ['4-1m-interrupts-buffers.html', '4.1m Interrupts & Buffers'],
    ['4-2a-high-low-level-languages.html', '4.2a High-Level & Low-Level Languages'],
    ['4-2b-assembly-language.html', '4.2b Assembly Language'],
    ['4-2c-translators.html', '4.2c Translators'],
    ['4-2d-compiler-interpreter-tradeoffs.html', '4.2d Compiler vs. Interpreter'],
    ['4-2e-integrated-development-environments.html', '4.2e IDEs'],
  ]},
  { unit: 'Unit 5', lessons: [
    ['5-1a-internet-vs-www-urls.html', '5.1a Internet vs. WWW, URLs, HTTP(S)'],
    ['5-1b-web-browsers.html', '5.1b Web Browsers'],
    ['5-1c-dns.html', '5.1c Domain Name Servers (DNS)'],
    ['5-1d-cookies.html', '5.1d Cookies'],
    ['5-2a-digital-currency.html', '5.2a Digital Currency & Cryptocurrency'],
    ['5-2b-blockchain.html', '5.2b Blockchain'],
    ['5-3a-brute-force-data-interception.html', '5.3a Brute Force & Data Interception'],
    ['5-3b-ddos-hacking.html', '5.3b DDoS Attacks & Hacking'],
    ['5-3c-malware.html', '5.3c Malware'],
    ['5-3d-phishing-pharming.html', '5.3d Phishing & Pharming'],
    ['5-3e-social-engineering.html', '5.3e Social Engineering'],
  ]},
  { unit: 'Unit 6', lessons: [
    ['6-1a-automated-systems-fundamentals.html', '6.1a Automated Systems: Fundamentals'],
    ['6-1b-automated-transport.html', '6.1b Automated Systems: Transport'],
    ['6-1c-automated-agriculture.html', '6.1c Automated Systems: Agriculture'],
    ['6-1d-automated-weather-gaming.html', '6.1d Weather Stations & Gaming'],
    ['6-1e-automated-lighting-science.html', '6.1e Automated Lighting & Science'],
    ['6-2a-robotics-fundamentals-industry.html', '6.2a Robotics: Fundamentals & Industry'],
    ['6-2b-robotics-transport.html', '6.2b Robotics: Autonomous Transport'],
    ['6-2c-robotics-agriculture-medicine-domestic-entertainment.html', '6.2c Robotics: Agriculture, Medicine, Domestic, Entertainment'],
    ['6-3a-ai-fundamentals.html', '6.3a AI: Fundamentals & Examples'],
    ['6-3b-expert-systems.html', '6.3b Expert Systems'],
    ['6-3c-machine-learning.html', '6.3c Machine Learning'],
  ]},
]

const START = '  // ── BOOK-LESSONS-START (scripts/inject-book-lessons-into-map.mjs) ──'
const END = '  // ── BOOK-LESSONS-END ──'

function esc(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") }

let entries = []
for (const { unit, lessons } of UNITS) {
  const mod = UNIT_TO_MOD[unit]
  for (const [file, name] of lessons) {
    entries.push(
      `  { mod:'${mod}', name:'${esc(name)}', xp:15, type:'lesson', bookFile:'${file}', hints:[],\n` +
      `    text:'Read the full lesson (theory, key terms, worked examples) and try its 6 practice questions, then mark it complete.' },`
    )
  }
}

const block = `${START}\n${entries.join('\n')}\n${END}\n`

let html = readFileSync(TARGET, 'utf8')

// Strip any previous injection first.
const s = html.indexOf(START)
const e = html.indexOf(END)
if (s !== -1 && e !== -1) {
  html = html.slice(0, s) + html.slice(e + END.length + 1)
}

// Insert just before the CHALLENGES array's closing `]` (find the anchor
// comment right after it, then back up to the preceding standalone `]` —
// avoids depending on exact line-ending bytes (CRLF on Windows checkouts)).
const anchor = '// mod+name is the stable identity'
const anchorIdx = html.indexOf(anchor)
if (anchorIdx === -1) throw new Error('Could not find CHALLENGES closing marker — aborting to avoid corrupting the file.')
const closeIdx = html.lastIndexOf(']', anchorIdx)
if (closeIdx === -1) throw new Error('Could not find CHALLENGES closing bracket — aborting to avoid corrupting the file.')
const idx = closeIdx   // insert the new entries BEFORE the `]`, keeping them inside the array

html = html.slice(0, idx) + block + html.slice(idx)
writeFileSync(TARGET, html, 'utf8')

console.log(`Injected ${entries.length} book-lesson bubbles into igcse-y1.html (units: ${UNITS.map(u => u.unit).join(', ')}).`)
