// Static manifest of the IGCSE Year 1 "book" lessons — 89 self-contained
// static HTML pages under public/lessons/igcse-y1-book/, rewritten from the
// Cambridge IGCSE & O Level Computer Science coursebook. Unlike the
// CHALLENGES-driven grade6-9/igcse-y1/igcse-y2 files, these have no JS data
// structure to eval — each entry here is just a stable filename (the
// override target_id), grouped by unit for display, matching the same list
// used in public/lessons/igcse-y1-book/index.html.
//
// Never import fs from here — this file is safe for both client and server.

export interface BookLesson {
  file: string   // filename under public/lessons/igcse-y1-book/, e.g. '1-1a-binary-numbers.html'
  code: string   // e.g. '1.1a'
  title: string
}

export interface BookUnit {
  unit: string    // 'Unit 1'
  title: string   // 'Data Representation'
  lessons: BookLesson[]
}

export const IGCSE_BOOK_UNITS: BookUnit[] = [
  {
    unit: 'Unit 1', title: 'Data Representation', lessons: [
      { file: '1-1a-binary-numbers.html', code: '1.1a', title: 'Binary Numbers' },
      { file: '1-1b-hexadecimal.html', code: '1.1b', title: 'Hexadecimal' },
      { file: '1-1c-binary-addition.html', code: '1.1c', title: 'Binary Addition & Overflow' },
      { file: '1-1d-logical-shifts.html', code: '1.1d', title: 'Logical Shifts' },
      { file: '1-1e-twos-complement.html', code: '1.1e', title: "Two's Complement" },
      { file: '1-2a-ascii-unicode.html', code: '1.2a', title: 'ASCII & Unicode' },
      { file: '1-2b-sound-representation.html', code: '1.2b', title: 'Representation of Sound' },
      { file: '1-2c-image-representation.html', code: '1.2c', title: 'Representation of Images' },
      { file: '1-3a-units-file-size.html', code: '1.3a', title: 'Units & File Size' },
      { file: '1-3b-data-compression.html', code: '1.3b', title: 'Data Compression (Lossy)' },
      { file: '1-3c-lossless-rle.html', code: '1.3c', title: 'Lossless Compression & RLE' },
    ],
  },
  {
    unit: 'Unit 2', title: 'Data Transmission', lessons: [
      { file: '2-1a-data-packets.html', code: '2.1a', title: 'Data Packets & Packet Switching' },
      { file: '2-1b-transmission-modes.html', code: '2.1b', title: 'Transmission Modes' },
      { file: '2-1c-usb.html', code: '2.1c', title: 'Universal Serial Bus (USB)' },
      { file: '2-2a-parity-checks.html', code: '2.2a', title: 'Parity Checks' },
      { file: '2-2b-checksum-echo-check.html', code: '2.2b', title: 'Checksum & Echo Check' },
      { file: '2-2c-check-digits.html', code: '2.2c', title: 'Check Digits' },
      { file: '2-2d-arq.html', code: '2.2d', title: 'Automatic Repeat Requests' },
      { file: '2-3a-symmetric-encryption.html', code: '2.3a', title: 'Symmetric Encryption' },
      { file: '2-3b-asymmetric-encryption.html', code: '2.3b', title: 'Asymmetric Encryption' },
    ],
  },
  {
    unit: 'Unit 3', title: 'Hardware', lessons: [
      { file: '3-1a-von-neumann-architecture.html', code: '3.1a', title: 'CPU & Von Neumann Architecture' },
      { file: '3-1b-buses-fetch-decode-execute.html', code: '3.1b', title: 'Buses & Fetch-Decode-Execute' },
      { file: '3-1c-cpu-performance.html', code: '3.1c', title: 'Cores, Cache & Clock' },
      { file: '3-1d-instruction-set.html', code: '3.1d', title: 'Instruction Sets' },
      { file: '3-1e-embedded-systems.html', code: '3.1e', title: 'Embedded Systems' },
      { file: '3-2a-barcodes-qr-codes.html', code: '3.2a', title: 'Barcodes & QR Codes' },
      { file: '3-2b-digital-cameras.html', code: '3.2b', title: 'Digital Cameras' },
      { file: '3-2c-keyboards-microphones.html', code: '3.2c', title: 'Keyboards & Microphones' },
      { file: '3-2d-optical-mouse.html', code: '3.2d', title: 'The Optical Mouse' },
      { file: '3-2e-2d-3d-scanners.html', code: '3.2e', title: '2D & 3D Scanners' },
      { file: '3-2f-touch-screens.html', code: '3.2f', title: 'Touch Screen Technologies' },
      { file: '3-2g-actuators-projectors.html', code: '3.2g', title: 'Actuators & Light Projectors' },
      { file: '3-2h-projector-comparison.html', code: '3.2h', title: 'DLP vs. LCD Projectors' },
      { file: '3-2i-inkjet-printers.html', code: '3.2i', title: 'Inkjet Printers' },
      { file: '3-2j-laser-printers.html', code: '3.2j', title: 'Laser Printers' },
      { file: '3-2k-3d-printers.html', code: '3.2k', title: '3D Printers' },
      { file: '3-2l-led-lcd-oled-screens.html', code: '3.2l', title: 'LED, LCD & OLED Screens' },
      { file: '3-2m-loudspeakers.html', code: '3.2m', title: 'Loudspeakers' },
      { file: '3-2n-sensors-monitoring-control.html', code: '3.2n', title: 'Sensors: Monitoring & Control' },
      { file: '3-2o-sensor-types.html', code: '3.2o', title: 'Types of Sensor' },
      { file: '3-3a-primary-memory.html', code: '3.3a', title: 'Primary Memory: RAM & ROM' },
      { file: '3-3b-hard-disk-drives.html', code: '3.3b', title: 'Hard Disk Drives' },
      { file: '3-3c-ssd-flash-memory.html', code: '3.3c', title: 'SSD & Flash Memory' },
      { file: '3-3d-optical-media.html', code: '3.3d', title: 'Optical Media (CD/DVD/Blu-ray)' },
      { file: '3-3e-virtual-memory.html', code: '3.3e', title: 'Virtual Memory' },
      { file: '3-3f-cloud-storage.html', code: '3.3f', title: 'Cloud Storage' },
      { file: '3-4a-nic-mac-address.html', code: '3.4a', title: 'NIC & MAC Address' },
      { file: '3-4b-ip-addresses.html', code: '3.4b', title: 'IP Addresses' },
      { file: '3-4c-routers.html', code: '3.4c', title: 'Routers' },
    ],
  },
  {
    unit: 'Unit 4', title: 'Software', lessons: [
      { file: '4-1a-application-software.html', code: '4.1a', title: 'System & Application Software' },
      { file: '4-1b-system-software-overview.html', code: '4.1b', title: 'Drivers, OS, Compilers, Linkers' },
      { file: '4-1c-virus-checkers.html', code: '4.1c', title: 'Virus Checkers' },
      { file: '4-1d-defragmentation.html', code: '4.1d', title: 'Defragmentation Software' },
      { file: '4-1e-backup-software.html', code: '4.1e', title: 'Back-up Software' },
      { file: '4-1f-security-software-screensavers.html', code: '4.1f', title: 'Security Software & Screensavers' },
      { file: '4-1g-hci-cli-gui.html', code: '4.1g', title: 'Human Computer Interfaces' },
      { file: '4-1h-memory-security-management.html', code: '4.1h', title: 'Memory & Security Management' },
      { file: '4-1i-hardware-peripheral-management.html', code: '4.1i', title: 'Hardware Peripheral Management' },
      { file: '4-1j-file-management-multitasking.html', code: '4.1j', title: 'File Management & Multitasking' },
      { file: '4-1k-user-account-management.html', code: '4.1k', title: 'User Account Management' },
      { file: '4-1l-booting-bios.html', code: '4.1l', title: 'Booting Up & BIOS' },
      { file: '4-1m-interrupts-buffers.html', code: '4.1m', title: 'Interrupts & Buffers' },
      { file: '4-2a-high-low-level-languages.html', code: '4.2a', title: 'High-Level & Low-Level Languages' },
      { file: '4-2b-assembly-language.html', code: '4.2b', title: 'Assembly Language' },
      { file: '4-2c-translators.html', code: '4.2c', title: 'Translators' },
      { file: '4-2d-compiler-interpreter-tradeoffs.html', code: '4.2d', title: 'Compiler vs. Interpreter' },
      { file: '4-2e-integrated-development-environments.html', code: '4.2e', title: 'IDEs' },
    ],
  },
  {
    unit: 'Unit 5', title: 'The Internet & Its Uses', lessons: [
      { file: '5-1a-internet-vs-www-urls.html', code: '5.1a', title: 'Internet vs. WWW, URLs, HTTP(S)' },
      { file: '5-1b-web-browsers.html', code: '5.1b', title: 'Web Browsers' },
      { file: '5-1c-dns.html', code: '5.1c', title: 'Domain Name Servers (DNS)' },
      { file: '5-1d-cookies.html', code: '5.1d', title: 'Cookies' },
      { file: '5-2a-digital-currency.html', code: '5.2a', title: 'Digital Currency & Cryptocurrency' },
      { file: '5-2b-blockchain.html', code: '5.2b', title: 'Blockchain' },
      { file: '5-3a-brute-force-data-interception.html', code: '5.3a', title: 'Brute Force & Data Interception' },
      { file: '5-3b-ddos-hacking.html', code: '5.3b', title: 'DDoS Attacks & Hacking' },
      { file: '5-3c-malware.html', code: '5.3c', title: 'Malware' },
      { file: '5-3d-phishing-pharming.html', code: '5.3d', title: 'Phishing & Pharming' },
      { file: '5-3e-social-engineering.html', code: '5.3e', title: 'Social Engineering' },
    ],
  },
  {
    unit: 'Unit 6', title: 'Automated & Emerging Technologies', lessons: [
      { file: '6-1a-automated-systems-fundamentals.html', code: '6.1a', title: 'Automated Systems: Fundamentals' },
      { file: '6-1b-automated-transport.html', code: '6.1b', title: 'Automated Systems: Transport' },
      { file: '6-1c-automated-agriculture.html', code: '6.1c', title: 'Automated Systems: Agriculture' },
      { file: '6-1d-automated-weather-gaming.html', code: '6.1d', title: 'Weather Stations & Gaming' },
      { file: '6-1e-automated-lighting-science.html', code: '6.1e', title: 'Automated Lighting & Science' },
      { file: '6-2a-robotics-fundamentals-industry.html', code: '6.2a', title: 'Robotics: Fundamentals & Industry' },
      { file: '6-2b-robotics-transport.html', code: '6.2b', title: 'Robotics: Autonomous Transport' },
      { file: '6-2c-robotics-agriculture-medicine-domestic-entertainment.html', code: '6.2c', title: 'Robotics: Agriculture, Medicine, Domestic, Entertainment' },
      { file: '6-3a-ai-fundamentals.html', code: '6.3a', title: 'AI: Fundamentals & Examples' },
      { file: '6-3b-expert-systems.html', code: '6.3b', title: 'Expert Systems' },
      { file: '6-3c-machine-learning.html', code: '6.3c', title: 'Machine Learning' },
    ],
  },
]

export const ALL_BOOK_LESSONS: BookLesson[] = IGCSE_BOOK_UNITS.flatMap(u => u.lessons)

export function findBookLesson(file: string): BookLesson | undefined {
  return ALL_BOOK_LESSONS.find(l => l.file === file)
}

// ── IGCSE Year 2 "book" lessons — 48 self-contained static HTML pages under
// public/lessons/igcse-y2-book/, rewriting Chapters 7-10 of the same
// coursebook (Algorithm Design & Problem Solving, Programming, Databases,
// Logic Gates). Same shape and rules as the Y1 manifest above.
export const IGCSE_Y2_BOOK_UNITS: BookUnit[] = [
  {
    unit: 'Chapter 7', title: 'Algorithm Design & Problem Solving', lessons: [
      { file: '7-1a-program-development-life-cycle.html', code: '7.1a', title: 'The Program Development Life Cycle' },
      { file: '7-2a-computer-systems-decomposition.html', code: '7.2a', title: 'Computer Systems & Decomposition' },
      { file: '7-2b-structure-diagrams.html', code: '7.2b', title: 'Structure Diagrams' },
      { file: '7-2c-flowcharts.html', code: '7.2c', title: 'Flowcharts' },
      { file: '7-2d-pseudocode-assignment.html', code: '7.2d', title: 'Pseudocode: Assignment Statements' },
      { file: '7-2e-pseudocode-conditionals.html', code: '7.2e', title: 'Pseudocode: Conditional Statements' },
      { file: '7-2f-pseudocode-iteration.html', code: '7.2f', title: 'Pseudocode: Iteration (Loops)' },
      { file: '7-2g-pseudocode-input-output.html', code: '7.2g', title: 'Pseudocode: Input & Output Statements' },
      { file: '7-3a-purpose-of-an-algorithm.html', code: '7.3a', title: 'Explaining the Purpose of an Algorithm' },
      { file: '7-4a-totalling-counting-average.html', code: '7.4a', title: 'Totalling, Counting, Maximum/Minimum & Average' },
      { file: '7-4b-linear-search.html', code: '7.4b', title: 'Linear Search' },
      { file: '7-4c-bubble-sort.html', code: '7.4c', title: 'Bubble Sort' },
      { file: '7-5a-validation.html', code: '7.5a', title: 'Validation' },
      { file: '7-5b-verification.html', code: '7.5b', title: 'Verification' },
      { file: '7-6a-test-data.html', code: '7.6a', title: 'Test Data' },
      { file: '7-7a-trace-tables.html', code: '7.7a', title: 'Trace Tables' },
      { file: '7-8a-identifying-errors.html', code: '7.8a', title: 'Identifying Errors in Algorithms' },
      { file: '7-9a-writing-algorithms.html', code: '7.9a', title: 'Writing and Amending Algorithms' },
      { file: '7-9b-nested-loops-worked-example.html', code: '7.9b', title: 'A Real Nested-Loop Algorithm' },
      { file: '7-9c-stacks-and-queues.html', code: '7.9c', title: 'Stacks and Queues (Extension)' },
    ],
  },
  {
    unit: 'Chapter 8', title: 'Programming', lessons: [
      { file: '8-1a-variables-constants-data-types.html', code: '8.1a', title: 'Variables, Constants & Data Types' },
      { file: '8-1b-input-output.html', code: '8.1b', title: 'Input and Output in Real Code' },
      { file: '8-1c-sequence.html', code: '8.1c', title: 'Sequence — Getting the Order Right' },
      { file: '8-1d-selection-case.html', code: '8.1d', title: 'Selection in Real Code' },
      { file: '8-1e-iteration.html', code: '8.1e', title: 'Iteration in Real Code' },
      { file: '8-1f-string-handling.html', code: '8.1f', title: 'String Handling' },
      { file: '8-1g-operators.html', code: '8.1g', title: 'Arithmetic, Logical & Boolean Operators' },
      { file: '8-1h-nested-statements.html', code: '8.1h', title: 'Nested Statements' },
      { file: '8-1i-procedures-functions.html', code: '8.1i', title: 'Procedures and Functions' },
      { file: '8-1j-scope.html', code: '8.1j', title: 'Local and Global Variables' },
      { file: '8-1k-library-routines.html', code: '8.1k', title: 'Library Routines' },
      { file: '8-1l-maintainable-programs.html', code: '8.1l', title: 'Writing Maintainable Programs' },
      { file: '8-2a-one-dimensional-arrays.html', code: '8.2a', title: 'One-Dimensional Arrays' },
      { file: '8-2b-two-dimensional-arrays.html', code: '8.2b', title: 'Two-Dimensional Arrays' },
      { file: '8-3a-file-handling.html', code: '8.3a', title: 'File Handling' },
    ],
  },
  {
    unit: 'Chapter 9', title: 'Databases', lessons: [
      { file: '9-1a-database-structure.html', code: '9.1a', title: 'Database Structure — Tables, Records & Fields' },
      { file: '9-1b-data-types-primary-keys.html', code: '9.1b', title: 'Data Types & Primary Keys' },
      { file: '9-1c-sql-basics.html', code: '9.1c', title: 'SQL Basics — SELECT, FROM, WHERE' },
      { file: '9-1d-sql-order-sum-count.html', code: '9.1d', title: 'SQL — ORDER BY, SUM, COUNT' },
      { file: '9-1e-sql-ddl-extension.html', code: '9.1e', title: 'SQL DDL (Extension) — Building a Database with SQL' },
    ],
  },
  {
    unit: 'Chapter 10', title: 'Logic Gates', lessons: [
      { file: '10-1a-logic-gates-intro.html', code: '10.1a', title: 'Logic Gates & Truth Tables' },
      { file: '10-1b-six-gate-functions.html', code: '10.1b', title: 'The Six Logic Gates' },
      { file: '10-2a-circuit-to-truth-table.html', code: '10.2a', title: 'Tracing a Circuit into a Truth Table' },
      { file: '10-2b-circuit-to-expression.html', code: '10.2b', title: 'Writing a Logic Expression from a Circuit' },
      { file: '10-2c-expression-to-circuit.html', code: '10.2c', title: 'Building a Circuit from an Expression' },
      { file: '10-2d-truth-table-to-expression.html', code: '10.2d', title: 'Writing an Expression from a Truth Table' },
      { file: '10-2e-problem-to-logic.html', code: '10.2e', title: 'Real-World Problems into Logic Circuits' },
      { file: '10-3a-adders-extension.html', code: '10.3a', title: 'Half & Full Adders (Extension)' },
    ],
  },
]

export const ALL_Y2_BOOK_LESSONS: BookLesson[] = IGCSE_Y2_BOOK_UNITS.flatMap(u => u.lessons)

export function findY2BookLesson(file: string): BookLesson | undefined {
  return ALL_Y2_BOOK_LESSONS.find(l => l.file === file)
}

// ── Generic lookup by book id — lets the API route/editor/content lib work
// with either book without a chain of if/else. 'igcse-y1-book' and
// 'igcse-y2-book' are both the directory name under public/lessons/ AND the
// lessonKey used in class_lesson_overrides.
export const BOOK_MANIFESTS: Record<string, { units: BookUnit[]; all: BookLesson[] }> = {
  'igcse-y1-book': { units: IGCSE_BOOK_UNITS, all: ALL_BOOK_LESSONS },
  'igcse-y2-book': { units: IGCSE_Y2_BOOK_UNITS, all: ALL_Y2_BOOK_LESSONS },
}

export function findBookLessonInBook(book: string, file: string): BookLesson | undefined {
  return BOOK_MANIFESTS[book]?.all.find(l => l.file === file)
}
