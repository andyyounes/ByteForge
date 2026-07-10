// One-shot restructure of a-level.html to match the Langfield & Duddell
// textbook's A Level chapters (16–29). Paper 3 = Ch 16–22 (theory),
// Paper 4 = Ch 23–29 (programming).
//
//  - Moves existing topics to their book-correct chapter/number
//  - Drops duplicates and off-syllabus topics (databases = AS content)
//  - Adds new compact lessons for chapters the platform lacked
//  - Regenerates both sidebars + CHAPTER_TOPICS + paper thresholds
//  - Remaps PAST_PAPERS keys
import { readFileSync, writeFileSync } from 'fs'

const FILE = 'c:/Users/user/Downloads/ICT website/public/lessons/a-level.html'
let html = readFileSync(FILE, 'utf8')

// ── Balanced object extraction (candidate-end + eval, proven earlier) ─────────
function extractObject(marker) {
  const start = html.indexOf(marker)
  if (start === -1) throw new Error('marker not found: ' + marker)
  const openIdx = html.indexOf('{', start)
  const tail = html.slice(openIdx)
  const re = /\r?\n\}/g
  let m
  while ((m = re.exec(tail)) !== null) {
    const objText = tail.slice(0, m.index + m[0].length)
    try {
      const obj = (0, eval)('(' + objText + ')')
      if (obj && typeof obj === 'object' && Object.keys(obj).length > 2) {
        return { obj, start: openIdx, end: openIdx + m.index + m[0].length }
      }
    } catch { /* keep scanning */ }
  }
  throw new Error('could not extract ' + marker)
}

// ── Book-aligned chapter labels ───────────────────────────────────────────────
const CH = {
  16: 'Data Representation',
  17: 'Communication & Internet Technologies',
  18: 'Hardware & Virtual Machines',
  19: 'Logic Circuits & Boolean Algebra',
  20: 'System Software',
  21: 'Security',
  22: 'Artificial Intelligence',
  23: 'Algorithms',
  24: 'Recursion',
  25: 'Programming Paradigms',
  26: 'File Processing & Exceptions',
  27: 'Object-Oriented Programming',
  28: 'Low-Level Programming',
  29: 'Declarative Programming',
}
const label = n => `Chapter ${n} — ${CH[n]}`

// ── Moves: oldKey → [newKey, newTitle] ────────────────────────────────────────
const MOVES = {
  'ch19-1': ['ch20-1', '20.1 Process Scheduling'],
  'ch19-2': ['ch20-2', '20.2 Deadlock'],
  'ch19-3': ['ch20-3', '20.3 Virtual Memory & Paging'],
  'ch25-4': ['ch20-4', '20.4 Language Translation & Compiler Stages'],
  'ch24-1': ['ch21-1', '21.1 Cryptographic Techniques'],
  'ch24-2': ['ch21-2', '21.2 Network Security Threats & Defences'],
  'ch24-3': ['ch21-3', '21.3 Privacy, Ethics & Legislation'],
  'ch17-3': ['ch22-1', '22.1 Graph Representation'],
  'ch17-4': ['ch22-2', '22.2 Graph Traversals (BFS & DFS)'],
  'ch16-2': ['ch22-3', "22.3 Dijkstra's Algorithm"],
  'ch16-3': ['ch22-4', '22.4 A* Search'],
  'ch20-3': ['ch22-5', '22.5 Machine Learning Concepts'],
  'ch20-1': ['ch22-6', '22.6 Knowledge Representation'],
  'ch20-2': ['ch22-7', '22.7 Inference Engines'],
  'ch22-1': ['ch23-1', '23.1 Algorithm Complexity & Big-O'],
  'ch22-2': ['ch23-2', '23.2 Quicksort & Merge Sort'],
  'ch23-2': ['ch23-3', '23.3 Binary Search Trees & AVL'],
  'ch23-1': ['ch23-4', '23.4 Hash Tables'],
  'ch23-3': ['ch23-5', '23.5 Heaps & Priority Queues'],
  'ch22-4': ['ch23-6', '23.6 Dynamic Programming (extension)'],
  'ch16-5': ['ch23-7', '23.7 Backtracking (extension)'],
  'ch25-1': ['ch25-2', '25.2 Functional Programming Concepts'],
  'ch21-1': ['ch27-1', '27.1 Design Patterns'],
  'ch21-2': ['ch27-2', '27.2 Abstract Classes & Interfaces'],
  'ch21-3': ['ch27-3', '27.3 Polymorphism in Depth'],
  'ch21-4': ['ch27-4', '27.4 SOLID Principles'],
  'ch25-3': ['ch28-1', '28.1 Assembly & Low-Level Programming'],
  'ch25-2': ['ch29-1', '29.1 Logic & Declarative Programming'],
}
// Dropped: duplicates + databases (AS content, already on the AS page)
const DROPPED = ['ch16-1', 'ch16-4', 'ch17-1', 'ch17-2', 'ch22-3', 'ch18-1', 'ch18-2', 'ch18-3', 'ch18-4']

// ── New authored topics for chapters the platform lacked ─────────────────────
const NEW = {
  'ch16-1': { title: '16.1 User-Defined Data Types', subtitle: 'Enumerated, pointer, set and composite types',
    keyTerms: [
      { name: 'Non-composite type', def: 'A type defined without reference to other types, e.g. enumerated or pointer.' },
      { name: 'Enumerated type', def: 'An ordered list of named values, e.g. TYPE TDay = (Mon, Tue, Wed…).' },
      { name: 'Pointer', def: 'A variable holding the memory address of another data item.' },
      { name: 'Composite type', def: 'A type built from other types — record, set, class.' },
    ],
    theory: `<p>Programmers define their own types when the built-in ones are not enough. <strong>Non-composite</strong> user-defined types include <strong>enumerated</strong> types (an ordered list of named constants — comparisons like <code>Mon &lt; Wed</code> are allowed) and <strong>pointers</strong> (which hold addresses).</p><p><strong>Composite</strong> types reference other types: a <strong>record</strong> groups fields of different types, a <strong>set</strong> holds unordered unique values, and a <strong>class</strong> bundles data with methods. Choosing a user-defined type documents intent and lets the compiler catch invalid values.</p>`,
    example: `<pre>TYPE TDirection = (North, East, South, West)\nTYPE TStudent\n   DECLARE Name : STRING\n   DECLARE Mark : INTEGER\nENDTYPE\nDECLARE s : TStudent\ns.Name ← "Mia"\ns.Mark ← 74</pre>`,
    questions: [
      { stem: 'Define an enumerated type for the eight compass points, then declare a variable of that type.', marks: 3, ms: 'TYPE TCompass = (N, NE, E, SE, S, SW, W, NW) [2]; DECLARE d : TCompass [1].' },
      { stem: 'State two benefits of using a record type rather than parallel arrays.', marks: 2, ms: 'Keeps related data together / passed as one item [1]; fields can have different types with meaningful names [1].' },
    ]},
  'ch16-2': { title: '16.2 File Organisation & Access', subtitle: 'Serial, sequential and random file organisation',
    keyTerms: [
      { name: 'Serial file', def: 'Records stored in arrival order — no ordering key.' },
      { name: 'Sequential file', def: 'Records stored in key order; read from the start.' },
      { name: 'Random (direct) file', def: 'Record position computed from its key via hashing — direct access.' },
      { name: 'Hashing', def: 'Applying a function to a key to compute a storage address.' },
    ],
    theory: `<p><strong>Serial</strong> files append records as they arrive — fine for logs. <strong>Sequential</strong> files keep records in key order, which suits batch processing (e.g. payroll) but inserting means rewriting the file. <strong>Random</strong> (direct-access) files compute each record's address by hashing its key, giving constant-time reads and writes.</p><p>Choosing organisation is a trade-off: how often you search, whether you process all records at once, and how volatile the data is. Collisions in hashed files are handled with open hashing (overflow chains) or closed hashing (probing).</p>`,
    example: `<p>A customer file keyed on a 6-digit account number, size 10&nbsp;000 slots:</p><pre>address ← accountNo MOD 10000\n// collision → probe (address + 1) MOD 10000</pre>`,
    questions: [
      { stem: 'A supermarket processes all stock records every night. State and justify the most suitable file organisation.', marks: 2, ms: 'Sequential [1] — every record is processed in order, so ordered batch access is fastest [1].' },
      { stem: 'Explain how a record is located in a random-access file.', marks: 3, ms: 'Hash function applied to key [1] gives the address [1]; if occupied by a different record, probe/overflow to next location [1].' },
    ]},
  'ch16-3': { title: '16.3 Floating-Point Representation', subtitle: 'Mantissa, exponent, normalisation and precision',
    keyTerms: [
      { name: 'Mantissa', def: 'The significant digits of a floating-point number (determines precision).' },
      { name: 'Exponent', def: 'The power of 2 the mantissa is multiplied by (determines range).' },
      { name: 'Normalisation', def: 'Adjusting so the mantissa begins 01… (positive) or 10… (negative) — maximum precision, one representation.' },
      { name: 'Rounding error', def: 'Difference between a real value and its nearest representable value.' },
    ],
    theory: `<p>A binary floating-point number is stored as <strong>mantissa × 2<sup>exponent</sup></strong>, both in two's complement. A larger mantissa gives more <strong>precision</strong>; a larger exponent gives more <strong>range</strong> — with fixed total bits, one is traded for the other.</p><p><strong>Normalisation</strong> shifts the mantissa so it starts <code>01</code> (positive) or <code>10</code> (negative), maximising precision and making representation unique. Many decimals (like 0.1) have no exact binary form, causing <strong>rounding errors</strong> that accumulate; overflow occurs when a result exceeds the largest representable value.</p>`,
    example: `<p>8-bit mantissa 0110 0000, 4-bit exponent 0011 (+3):</p><pre>0.110 0000₂ × 2³ = 011.00000₂ = +3.0</pre>`,
    questions: [
      { stem: 'A float format has a 12-bit mantissa and 4-bit exponent. State the effect of moving 2 bits from the mantissa to the exponent.', marks: 2, ms: 'Range increases [1]; precision decreases [1].' },
      { stem: 'Explain why 0.1 cannot be stored exactly in binary floating-point.', marks: 2, ms: '0.1 has an infinitely repeating binary expansion [1]; the finite mantissa must truncate/round it [1].' },
    ]},
  'ch17-1': { title: '17.1 Protocols & the TCP/IP Suite', subtitle: 'Layered protocols: HTTP, FTP, SMTP, POP3 and BitTorrent',
    keyTerms: [
      { name: 'Protocol', def: 'An agreed set of rules governing data transmission.' },
      { name: 'TCP/IP suite', def: 'The layered protocol stack of the internet: Application, Transport, Internet, Link.' },
      { name: 'HTTP/HTTPS', def: 'Application protocol for requesting and delivering web resources (S = encrypted).' },
      { name: 'BitTorrent', def: 'Peer-to-peer protocol where downloaders (leechers) also upload pieces to the swarm.' },
    ],
    theory: `<p>The <strong>TCP/IP</strong> stack splits communication into layers, each serving the one above: the <strong>Application</strong> layer (HTTP, FTP, SMTP, POP3/IMAP), <strong>Transport</strong> (TCP breaks data into numbered segments and guarantees delivery; UDP doesn't), <strong>Internet</strong> (IP addresses and routes packets) and <strong>Link</strong> (physical delivery on the local network).</p><p>Email uses <strong>SMTP</strong> to send and <strong>POP3/IMAP</strong> to retrieve. <strong>BitTorrent</strong> is peer-to-peer: a file is split into pieces, and every peer downloading also uploads pieces it has, coordinated by a tracker — load is shared instead of hitting one server.</p>`,
    example: `<p>Loading a web page: DNS resolves the name → TCP connection to port 443 → HTTPS GET request → server responds with HTML → TCP reassembles numbered segments in order.</p>`,
    questions: [
      { stem: 'State the TCP/IP layer at which each operates: (a) IP (b) HTTP (c) TCP.', marks: 3, ms: '(a) Internet [1] (b) Application [1] (c) Transport [1].' },
      { stem: 'Describe two ways BitTorrent differs from client-server file download.', marks: 2, ms: 'Pieces come from many peers, not one server [1]; downloaders simultaneously upload to others [1].' },
    ]},
  'ch17-2': { title: '17.2 Circuit & Packet Switching', subtitle: 'How data crosses networks',
    keyTerms: [
      { name: 'Circuit switching', def: 'A dedicated physical path is reserved for the whole communication.' },
      { name: 'Packet switching', def: 'Data split into packets that travel independently and are reassembled.' },
      { name: 'Header', def: 'Packet metadata: source/destination address, sequence number, hop limit.' },
      { name: 'Router', def: 'Device that examines a packet’s destination and forwards it along the best path.' },
    ],
    theory: `<p><strong>Circuit switching</strong> (classic telephony) reserves an end-to-end path first: guaranteed bandwidth and order, but capacity is wasted during silence and the path is a single point of failure.</p><p><strong>Packet switching</strong> chops the message into packets, each carrying a header with destination and sequence number. Routers forward each packet independently — packets may arrive out of order and are reassembled using sequence numbers. It is resilient (packets route around failures) and efficient (links are shared), which is why the internet uses it.</p>`,
    example: `<p>A 3&nbsp;MB photo → ~2000 packets. Packet 811 takes a different route than 810 after a router fails mid-transfer; TCP notices 811 arrived first and reorders, and the missing 810 is retransmitted.</p>`,
    questions: [
      { stem: 'Give two benefits of packet switching over circuit switching.', marks: 2, ms: 'Links shared — efficient use of bandwidth [1]; automatic re-routing around failures / no dedicated path needed [1].' },
      { stem: 'State three items found in a packet header.', marks: 3, ms: 'Destination address [1]; source address [1]; sequence number (accept TTL/checksum) [1].' },
    ]},
  'ch18-1': { title: '18.1 RISC, CISC & Pipelining', subtitle: 'Processor design philosophies',
    keyTerms: [
      { name: 'RISC', def: 'Reduced Instruction Set Computer — few simple fixed-length instructions, one per cycle.' },
      { name: 'CISC', def: 'Complex Instruction Set Computer — many instructions, some doing multi-step work.' },
      { name: 'Pipelining', def: 'Overlapping fetch, decode and execute of consecutive instructions.' },
      { name: 'Interrupt', def: 'A signal that suspends the current process; a pipeline must be flushed to service it.' },
    ],
    theory: `<p><strong>CISC</strong> processors offer rich instructions (one instruction might load, add and store), needing fewer instructions per program but complex hardware and variable execution times. <strong>RISC</strong> keeps instructions simple, fixed-length and register-based — ideal for <strong>pipelining</strong>.</p><p>A pipeline overlaps stages: while instruction 1 executes, instruction 2 decodes and instruction 3 is fetched — approaching one completed instruction per clock cycle. Branches and <strong>interrupts</strong> spoil this: the pipeline must be flushed and refilled, which is why branch prediction matters.</p>`,
    example: `<p>5 instructions, 3 stages (F-D-E):</p><pre>cycle:  1  2  3  4  5  6  7\nI1      F  D  E\nI2         F  D  E\nI3            F  D  E   → 5 instr in 7 cycles, not 15</pre>`,
    questions: [
      { stem: 'State three differences between RISC and CISC processors.', marks: 3, ms: 'RISC fewer/simpler instructions [1]; fixed length vs variable [1]; RISC one cycle per instruction / better pipelining, CISC microcode & fewer registers [1].' },
      { stem: 'Explain why an interrupt reduces the benefit of pipelining.', marks: 2, ms: 'Pipeline must be flushed before servicing [1]; partially processed instructions discarded and refetched afterwards [1].' },
    ]},
  'ch18-2': { title: '18.2 Parallel Processing', subtitle: 'SISD, SIMD, MISD, MIMD and massively parallel computers',
    keyTerms: [
      { name: 'SISD', def: 'Single Instruction Single Data — one processor, one data stream (classic CPU).' },
      { name: 'SIMD', def: 'Single Instruction Multiple Data — same operation applied to many data items at once (GPU).' },
      { name: 'MIMD', def: 'Multiple Instruction Multiple Data — independent processors on independent data (multi-core).' },
      { name: 'Massively parallel', def: 'Very many networked processors cooperating on one problem.' },
    ],
    theory: `<p>Flynn's taxonomy classifies computers by instruction and data streams: <strong>SISD</strong> (one core, sequential), <strong>SIMD</strong> (one instruction over many data — image processing on a GPU), <strong>MISD</strong> (rare — redundant safety systems), and <strong>MIMD</strong> (multi-core: each core runs its own program on its own data).</p><p><strong>Massively parallel</strong> computers connect thousands of processors that pass messages over an interconnect. The software challenge is decomposition: a task only speeds up if it can be split into largely independent parts (Amdahl's law limits speedup by the sequential fraction).</p>`,
    example: `<p>Brightening a 4K photo: SIMD applies "+20 to every pixel" across thousands of pixels simultaneously — the same instruction, many data items.</p>`,
    questions: [
      { stem: 'Classify each as SISD/SIMD/MIMD: (a) quad-core laptop running four apps (b) GPU brightening an image (c) 1970s single-core minicomputer.', marks: 3, ms: '(a) MIMD [1] (b) SIMD [1] (c) SISD [1].' },
      { stem: 'State one hardware and one software issue in massively parallel computing.', marks: 2, ms: 'Hardware: fast interconnect/communication between processors [1]. Software: decomposing the task / synchronising results [1].' },
    ]},
  'ch18-3': { title: '18.3 Virtual Machines', subtitle: 'Software pretending to be hardware',
    keyTerms: [
      { name: 'Virtual machine', def: 'A software emulation of a computer system running on a host.' },
      { name: 'Host / guest', def: 'The real machine (host) and the emulated system running on it (guest).' },
      { name: 'Hypervisor', def: 'Software that creates and manages virtual machines, sharing host hardware.' },
    ],
    theory: `<p>A <strong>virtual machine</strong> is software that behaves like a complete computer: the <strong>guest</strong> OS runs unmodified, believing it controls real hardware, while the <strong>hypervisor</strong> maps its actions onto the <strong>host</strong>. One physical server can run many isolated guests.</p><p><strong>Benefits:</strong> run multiple/legacy operating systems, isolate risky software (malware analysis), efficient server consolidation, easy snapshots and recovery. <strong>Limitations:</strong> performance overhead from emulation, and heavy disk/graphics workloads suffer most.</p>`,
    example: `<p>A school server runs three guests under one hypervisor: a Linux web server, a Windows file server and a test machine — snapshots let IT roll back the test machine after each experiment.</p>`,
    questions: [
      { stem: 'Give two benefits and one drawback of running servers as virtual machines.', marks: 3, ms: 'Benefits: consolidation/cost, isolation, snapshots/recovery, multiple OSes (any two) [2]. Drawback: emulation overhead reduces performance [1].' },
      { stem: 'Explain the role of the hypervisor.', marks: 2, ms: 'Creates/manages guest VMs [1]; allocates and maps host hardware resources to each guest [1].' },
    ]},
  'ch19-1': { title: '19.1 Boolean Algebra & De Morgan’s Laws', subtitle: 'Simplifying logic expressions',
    keyTerms: [
      { name: 'Boolean algebra', def: 'Algebra of TRUE/FALSE values with AND (·), OR (+), NOT (¯).' },
      { name: 'De Morgan’s laws', def: 'NOT(A AND B) = NOT A OR NOT B; NOT(A OR B) = NOT A AND NOT B.' },
      { name: 'Absorption', def: 'A + A·B = A;  A·(A + B) = A.' },
    ],
    theory: `<p>Boolean identities let you simplify circuits before building them: fewer gates, lower cost, faster logic. Key laws: identity (A+0=A, A·1=A), null (A+1=1, A·0=0), idempotent (A+A=A), complement (A+Ā=1, A·Ā=0), distributive, absorption, and <strong>De Morgan's</strong> — the one examiners love: break the bar, change the operator.</p><p>Method: write the expression, apply De Morgan to remove long negation bars, expand with the distributive law, then absorb. Every simplification step should cite a law.</p>`,
    example: `<pre>Simplify  X = NOT(A OR B) OR (A AND B)̄ ... \nNOT(A OR B) = Ā·B̄            (De Morgan)\nNOT(A AND B) = Ā + B̄          (De Morgan)\nX = Ā·B̄ + Ā + B̄ = Ā + B̄      (absorption)</pre>`,
    questions: [
      { stem: 'Simplify A·B + A·B̄ using Boolean algebra, naming each law used.', marks: 3, ms: 'A·(B + B̄) distributive [1]; B + B̄ = 1 complement [1]; A·1 = A identity [1].' },
      { stem: 'Apply De Morgan’s law to NOT(X OR NOT Y).', marks: 2, ms: 'X̄ AND NOT(NOT Y) [1] = X̄ AND Y [1].' },
    ]},
  'ch19-2': { title: '19.2 Karnaugh Maps', subtitle: 'Visual simplification of Boolean expressions',
    keyTerms: [
      { name: 'Karnaugh map (K-map)', def: 'A grid of a truth table arranged so adjacent cells differ by one variable.' },
      { name: 'Gray code ordering', def: 'Column/row labels 00, 01, 11, 10 — one bit changes between neighbours.' },
      { name: 'Group', def: 'A rectangle of 1s sized a power of two; bigger groups = simpler terms.' },
    ],
    theory: `<p>A <strong>K-map</strong> redraws the truth table so cells that differ in one variable sit next to each other (Gray-code ordering — note the 11 before 10). Circle rectangular <strong>groups</strong> of 1s in sizes 1, 2, 4, 8; groups may overlap and wrap around the edges.</p><p>Each group produces one term containing only the variables that stay constant within it. The larger the group, the fewer the variables — the whole point of the technique. Sum the group terms for the minimal expression.</p>`,
    example: `<pre>     AB\\C   0   1\n      00    0   0\n      01    1   1     group of 2: Ā·B\n      11    1   1     both rows: B  ← one group of 4!\n      10    0   0\nResult: X = B</pre>`,
    questions: [
      { stem: 'State why K-map labels use the order 00, 01, 11, 10 rather than 00, 01, 10, 11.', marks: 2, ms: 'Gray code — adjacent columns differ by exactly one bit [1]; makes groupable minterms physically adjacent [1].' },
      { stem: 'A group of four 1s in an 8-cell (3-variable) K-map produces a term with how many variables? Justify.', marks: 2, ms: 'One variable [1]; the other two change within the group so are eliminated [1].' },
    ]},
  'ch19-3': { title: '19.3 Flip-Flops & Adders', subtitle: 'SR/JK flip-flops, half and full adders',
    keyTerms: [
      { name: 'Half adder', def: 'Adds two bits → sum (XOR) and carry (AND).' },
      { name: 'Full adder', def: 'Adds two bits plus carry-in → sum and carry-out; chainable.' },
      { name: 'SR flip-flop', def: 'A 1-bit store built from cross-coupled NOR/NAND gates; invalid when S=R=1.' },
      { name: 'JK flip-flop', def: 'Improved flip-flop — J=K=1 toggles, removing the invalid state; clocked.' },
    ],
    theory: `<p>A <strong>half adder</strong> combines XOR (sum) and AND (carry) to add two bits. A <strong>full adder</strong> adds a carry-in as well — two half adders plus an OR — and chaining n of them builds an n-bit ripple adder.</p><p><strong>Flip-flops</strong> give circuits memory. The SR type stores one bit but has an invalid input combination (S=R=1). The <strong>JK</strong> flip-flop fixes this: J=K=1 toggles the output, and a clock input synchronises changes — the basis of registers and counters.</p>`,
    example: `<pre>Full adder: A=1, B=1, Cin=1\nsum   = A XOR B XOR Cin = 1\ncarry = (A·B) + (Cin·(A XOR B)) = 1   → 1 + 1 + 1 = 11₂</pre>`,
    questions: [
      { stem: 'Draw up the truth table of a half adder.', marks: 3, ms: '00→S0 C0; 01→S1 C0; 10→S1 C0 [1]; 11→S0 C1 [1]; S = XOR, C = AND identified [1].' },
      { stem: 'State the problem with the SR flip-flop and how the JK flip-flop solves it.', marks: 2, ms: 'S=R=1 is invalid/indeterminate [1]; JK defines J=K=1 as toggle [1].' },
    ]},
  'ch24-1': { title: '24.1 Recursion Essentials', subtitle: 'Base case, general case and the call stack',
    keyTerms: [
      { name: 'Recursion', def: 'A function defined in terms of itself, with at least one base case.' },
      { name: 'Base case', def: 'The condition where the function returns without calling itself.' },
      { name: 'General (recursive) case', def: 'The call the function makes to itself with a simpler argument.' },
      { name: 'Call stack', def: 'Where each unfinished call’s state waits; unwinds as calls return.' },
    ],
    theory: `<p>A recursive definition has two parts: a <strong>base case</strong> that stops the process, and a <strong>general case</strong> that calls the function on a smaller problem. Without a reachable base case the calls never end — a stack overflow.</p><p>Each call pushes a frame (parameters, return address, locals) onto the <strong>call stack</strong>. Nothing is computed until the base case is hit — then the stack <strong>unwinds</strong>, each frame completing its pending work. Tracing exam questions is exactly this: winding down to the base, then multiplying/adding on the way back up.</p>`,
    example: `<pre>FUNCTION Fact(n : INTEGER) RETURNS INTEGER\n   IF n <= 1 THEN RETURN 1          // base\n   ELSE RETURN n * Fact(n - 1)      // general\n   ENDIF\nENDFUNCTION\nFact(4) → 4·Fact(3) → 4·3·Fact(2) → 4·3·2·Fact(1) = 24</pre>`,
    questions: [
      { stem: 'A recursive function has no base case. State what happens when it is called.', marks: 2, ms: 'Calls itself indefinitely [1]; call stack grows until stack overflow / crash [1].' },
      { stem: 'Trace Sum(4) where Sum(n) = n=0→0 else n + Sum(n−1), showing each stacked call.', marks: 3, ms: 'Sum(4)=4+Sum(3); Sum(3)=3+Sum(2); Sum(2)=2+Sum(1); Sum(1)=1+Sum(0)=1 [2]; unwinds to 10 [1].' },
    ]},
  'ch24-2': { title: '24.2 Recursion vs Iteration', subtitle: 'When to choose which — and what the compiler does',
    keyTerms: [
      { name: 'Iteration', def: 'Repetition using loop constructs (FOR/WHILE/REPEAT).' },
      { name: 'Stack frame overhead', def: 'Memory and time cost of every recursive call.' },
      { name: 'Tail recursion', def: 'Recursive call is the last action — a compiler can convert it to a loop.' },
    ],
    theory: `<p>Anything recursive can be written iteratively and vice versa. Recursion shines when the problem is <em>naturally</em> self-similar — tree traversal, divide-and-conquer sorts, parsing — where the equivalent loop needs an explicit stack anyway. Iteration wins on memory: no stack frame per repetition, no overflow risk.</p><p>In a <strong>tail-recursive</strong> function the recursive call is the very last step, so nothing is pending on the stack — an optimising compiler replaces the call with a jump, giving loop-like performance. Exam answers should mention: readability for naturally recursive problems vs memory/time overhead per call.</p>`,
    example: `<p>Factorial iteratively:</p><pre>result ← 1\nFOR i ← 2 TO n\n   result ← result * i\nNEXT i</pre><p>Same result, O(1) stack instead of O(n).</p>`,
    questions: [
      { stem: 'Give two reasons a programmer might prefer iteration over recursion for a simple counting loop.', marks: 2, ms: 'No stack-frame overhead per step / faster [1]; no risk of stack overflow for large n [1].' },
      { stem: 'Explain what a compiler can do with a tail-recursive function.', marks: 2, ms: 'Recognise the call is the final action [1]; convert it to a loop/jump so no new stack frame is needed [1].' },
    ]},
  'ch25-1': { title: '25.1 The Programming Paradigms', subtitle: 'Low-level, imperative, OOP and declarative — one map',
    keyTerms: [
      { name: 'Paradigm', def: 'A style of programming — how you model computation.' },
      { name: 'Imperative (procedural)', def: 'Explicit sequences of statements changing state.' },
      { name: 'Declarative', def: 'State WHAT is wanted (facts, rules, queries) — not how.' },
      { name: 'Object-oriented', def: 'Model as objects combining state with the methods that act on it.' },
    ],
    theory: `<p>The four 9618 paradigms: <strong>low-level</strong> (instructions mirror the hardware — registers, addresses), <strong>imperative/procedural</strong> (step-by-step statements and procedures changing variables), <strong>object-oriented</strong> (encapsulated objects exchanging messages) and <strong>declarative</strong> (describe the goal — SQL, Prolog — and the engine finds the answer).</p><p>One problem, four shapes: to find adults in a list, imperative loops through it, OOP asks each Person object <code>IsAdult()</code>, declarative writes <code>SELECT name WHERE age >= 18</code>, and low-level compares register values and branches. Exam skill: recognise a paradigm from a snippet and justify a paradigm choice for a scenario.</p>`,
    example: `<pre>-- declarative (Prolog-style)\nadult(X) :- person(X, Age), Age >= 18.\n?- adult(Who).</pre>`,
    questions: [
      { stem: 'Name the paradigm best suited to each: (a) querying a database (b) a device driver (c) a GUI simulation of bank accounts.', marks: 3, ms: '(a) Declarative [1] (b) Low-level [1] (c) Object-oriented [1].' },
      { stem: 'State the key difference between imperative and declarative programming.', marks: 2, ms: 'Imperative specifies HOW — explicit steps changing state [1]; declarative specifies WHAT — rules/goals, engine determines execution [1].' },
    ]},
  'ch26-1': { title: '26.1 File Processing & Random Access', subtitle: 'Text vs binary files, modes, and direct record access',
    keyTerms: [
      { name: 'Text file', def: 'Human-readable lines of characters.' },
      { name: 'Binary file', def: 'Raw byte representation of data — compact, not human-readable.' },
      { name: 'File mode', def: 'How a file is opened: READ, WRITE (overwrites), APPEND, RANDOM.' },
      { name: 'SEEK', def: 'Move the file pointer directly to a record’s position.' },
    ],
    theory: `<p>Files persist data between runs. <strong>Text</strong> files store characters (portable, debuggable); <strong>binary</strong> files store the internal representation (compact, exact — no float rounding on write). Opening mode matters: WRITE truncates, APPEND adds at the end.</p><p><strong>Random access</strong> requires fixed-length records: position = (recordNumber − 1) × recordSize. <code>SEEK</code> jumps straight there, so one record can be read or updated without touching the rest — the basis of every database engine. Pseudocode: <code>OPENFILE f FOR RANDOM</code>, <code>SEEK f, address</code>, <code>GETRECORD / PUTRECORD</code>.</p>`,
    example: `<pre>OPENFILE "stock.dat" FOR RANDOM\nSEEK "stock.dat", (id - 1) * 64\nGETRECORD "stock.dat", item\nitem.qty ← item.qty - 1\nSEEK "stock.dat", (id - 1) * 64\nPUTRECORD "stock.dat", item\nCLOSEFILE "stock.dat"</pre>`,
    questions: [
      { stem: 'State why fixed-length records are required for random access.', marks: 2, ms: 'Record address must be computable as (n−1) × size [1]; variable lengths make positions unpredictable [1].' },
      { stem: 'A program opens an existing log file with WRITE mode instead of APPEND. State the consequence.', marks: 1, ms: 'Existing contents are erased/overwritten [1].' },
    ]},
  'ch26-2': { title: '26.2 Exception Handling', subtitle: 'try, catch/except, finally — failing gracefully',
    keyTerms: [
      { name: 'Exception', def: 'A runtime error event that interrupts normal flow.' },
      { name: 'try block', def: 'Code monitored for exceptions.' },
      { name: 'catch/except block', def: 'Code that runs when a matching exception occurs.' },
      { name: 'finally', def: 'Code that runs whether or not an exception occurred — cleanup.' },
    ],
    theory: `<p><strong>Exceptions</strong> handle runtime errors that can't be prevented by testing alone: missing files, bad user input, division by zero, network failures. Code that might fail goes in a <strong>try</strong> block; recovery code goes in <strong>catch/except</strong>; cleanup (closing files!) goes in <strong>finally</strong>.</p><p>Good practice: catch the <em>specific</em> exception you can handle, keep try blocks small, and never swallow errors silently. Exceptions beat return-code checking because the error can't be accidentally ignored and the handling is separated from the logic.</p>`,
    example: `<pre># Python\ntry:\n    f = open("scores.txt")\n    total = sum(int(line) for line in f)\nexcept FileNotFoundError:\n    print("No scores yet")\nexcept ValueError:\n    print("Corrupt line in file")\nfinally:\n    f.close()</pre>`,
    questions: [
      { stem: 'Give two situations where exception handling is more appropriate than validation.', marks: 2, ms: 'File missing/unreadable at runtime [1]; hardware/network failure — cannot be pre-checked reliably (accept division by zero from computed values) [1].' },
      { stem: 'State the purpose of a finally block and give a typical use.', marks: 2, ms: 'Always executes, exception or not [1]; releasing resources, e.g. closing a file [1].' },
    ]},
  'ch28-2': { title: '28.2 Addressing Modes & Bit Manipulation', subtitle: 'Immediate to indexed addressing; AND/OR/XOR masks and shifts',
    keyTerms: [
      { name: 'Immediate addressing', def: 'Operand IS the value: LDM #5.' },
      { name: 'Direct / indirect addressing', def: 'Operand is an address / an address holding the address.' },
      { name: 'Indexed addressing', def: 'Address = base + index register — arrays!' },
      { name: 'Mask', def: 'A bit pattern combined with AND/OR/XOR to test, set or flip chosen bits.' },
    ],
    theory: `<p>Addressing modes change where the operand comes from: <strong>immediate</strong> (the value itself), <strong>direct</strong> (the address given), <strong>indirect</strong> (the address stored at the address — pointers), and <strong>indexed</strong> (base + IX — stepping through arrays).</p><p><strong>Bit manipulation</strong> uses masks: <code>AND</code> clears/tests bits (AND #B00001000 isolates bit 3), <code>OR</code> sets bits, <code>XOR</code> flips bits. Shifts multiply and divide by two: <code>LSL #1</code> doubles, <code>LSR #1</code> halves. Exam questions typically trace a short assembly program using these.</p>`,
    example: `<pre>LDD 200      ; ACC ← contents of address 200\nAND #B00000100  ; isolate bit 2\nCMP #0\nJPN SET      ; jump if bit was 1</pre>`,
    questions: [
      { stem: 'State the addressing mode of each: (a) LDM #7 (b) LDD 104 (c) LDX 100 (with IX = 4).', marks: 3, ms: '(a) Immediate [1] (b) Direct [1] (c) Indexed [1].' },
      { stem: 'Write the mask and operation to SET bit 0 of the accumulator without changing other bits.', marks: 2, ms: 'OR [1] with #B00000001 [1].' },
    ]},
}

// ── 1. Rebuild TOPICS ─────────────────────────────────────────────────────────
const T = extractObject('const TOPICS = {')
const oldTopics = T.obj
const newTopics = {}

// authored topics first (their key IS the new key)
for (const [key, t] of Object.entries(NEW)) {
  const n = parseInt(key.match(/^ch(\d+)-/)[1])
  newTopics[key] = { chapter: label(n), ...t }
}
// moved topics
for (const [oldKey, [newKey, newTitle]] of Object.entries(MOVES)) {
  const t = oldTopics[oldKey]
  if (!t) { console.warn('missing old topic', oldKey); continue }
  const n = parseInt(newKey.match(/^ch(\d+)-/)[1])
  newTopics[newKey] = { ...t, chapter: label(n), title: newTitle }
}
// sanity: dropped keys not carried
for (const d of DROPPED) if (newTopics[d] && !NEW[d]) console.warn('dropped key resurfaced', d)

// order by chapter then topic number
const ordered = {}
Object.keys(newTopics)
  .sort((a, b) => {
    const [ , ca, ta ] = a.match(/^ch(\d+)-(\d+)/).map(Number)
    const [ , cb, tb ] = b.match(/^ch(\d+)-(\d+)/).map(Number)
    return ca - cb || ta - tb
  })
  .forEach(k => { ordered[k] = newTopics[k] })

const topicsSrc = 'const TOPICS = ' + JSON.stringify(ordered, null, 2)
html = html.slice(0, html.indexOf('const TOPICS = {')) + topicsSrc + html.slice(T.end)

// ── 2. Remap PAST_PAPERS keys ─────────────────────────────────────────────────
const P = extractObject('const PAST_PAPERS = {')
const newPP = {}
for (const [key, v] of Object.entries(P.obj)) {
  if (MOVES[key]) newPP[MOVES[key][0]] = v
  else if (!DROPPED.includes(key)) newPP[key] = v
}
const ppSrc = 'const PAST_PAPERS = ' + JSON.stringify(newPP, null, 2)
html = html.slice(0, html.indexOf('const PAST_PAPERS = {')) + ppSrc + html.slice(extractObject('const PAST_PAPERS = {').end)

// ── 3. Regenerate CHAPTER_TOPICS ──────────────────────────────────────────────
const byChapter = {}
for (const k of Object.keys(ordered)) {
  const n = parseInt(k.match(/^ch(\d+)-/)[1])
  ;(byChapter[n] = byChapter[n] || []).push(k)
}
let ctSrc = 'const CHAPTER_TOPICS = {\n  // Paper 3 (theory) — book chapters 16–22\n'
for (let n = 16; n <= 29; n++) {
  if (n === 23) ctSrc += '  // Paper 4 (programming) — book chapters 23–29\n'
  ctSrc += `  ${n}: [${(byChapter[n] || []).map(k => `'${k}'`).join(',')}],\n`
}
ctSrc += '}'
const CT = extractObject('const CHAPTER_TOPICS = {')
html = html.slice(0, html.indexOf('const CHAPTER_TOPICS = {')) + ctSrc + html.slice(CT.end)

// ── 4. Regenerate the two sidebars ────────────────────────────────────────────
function chapterBlock(n, isFirst) {
  const topics = (byChapter[n] || [])
  const items = topics.map(k =>
    `          <div class="topic-item" id="nav-${k}" onclick="loadTopic('${k}')">${ordered[k].title.replace(/&/g, '&amp;')}</div>`
  ).join('\n')
  return `      <!-- Chapter ${n} -->
      <div class="chapter-block">
        <div class="chapter-toggle" onclick="toggleChapter('ch${n}')">
          <span class="chapter-toggle-label">Ch ${n} — ${CH[n].replace(/&/g, '&amp;')}</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="ch-prog${isFirst ? ' unlocked' : ''}" id="ch${n}-prog">${isFirst ? `0/${topics.length}` : 'Soon'}</span>
            <span class="chapter-toggle-arrow${isFirst ? ' open' : ''}" id="ch${n}-arrow">▶</span>
          </div>
        </div>
        <div class="chapter-topics${isFirst ? '' : ' collapsed'}" id="ch${n}-topics">
${items}
          <div class="topic-item exam-item" id="nav-ch${n}-exam" onclick="loadExam(${n})" title="Not yet released">🔒 Chapter ${n} Exam</div>
        </div>
      </div>`
}

function replaceSidebar(startAnchor, chapters) {
  const sbStart = html.indexOf(startAnchor)
  if (sbStart === -1) throw new Error('sidebar anchor not found: ' + startAnchor)
  const blockStart = html.indexOf('<div class="chapter-block">', sbStart)
  // back up to include the preceding "<!-- Chapter N -->" comment line
  const commentStart = html.lastIndexOf('<!--', blockStart)
  const regionStart = html.slice(commentStart, blockStart).includes('Chapter') ? commentStart - 6 : blockStart - 6
  const sbClose = html.indexOf('\n    </div>', blockStart)
  const generated = chapters.map((n, i) => chapterBlock(n, i === 0)).join('\n\n')
  html = html.slice(0, regionStart) + generated + html.slice(sbClose)
}

// P4 sidebar first (later in the file → indices for P3 stay valid after? no —
// P4 replacement shifts nothing before it, so do P4 THEN P3 to be safe)
replaceSidebar('id="p2-sidebar">', [23, 24, 25, 26, 27, 28, 29])
replaceSidebar('<div class="p1-sidebar">', [16, 17, 18, 19, 20, 21, 22])

// ── 5. Threshold + range updates ──────────────────────────────────────────────
html = html.replaceAll('chNum >= 21', 'chNum >= 23')
html = html.replace('Array.from({ length: 10 }, (_, i) => i + 16)', 'Array.from({ length: 14 }, (_, i) => i + 16)')
html = html.replace('for (let ch = 16; ch <= 25; ch++)', 'for (let ch = 16; ch <= 29; ch++)')

writeFileSync(FILE, html)
console.log(`done: ${Object.keys(ordered).length} topics across ${Object.keys(byChapter).length} chapters`)
for (let n = 16; n <= 29; n++) console.log(`  Ch ${n} ${CH[n]}: ${(byChapter[n] || []).length} topics`)
