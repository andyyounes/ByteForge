
with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', encoding='utf-8') as f:
    content = f.read()

OLD = """  },
}


// ── Sidebar chapter toggle ───────────────────────────────────────────────────"""

NEW = """  },

  // ════════════════════════════════════════════════════════
  // PAPER 4 — Advanced Programming (Chapters 21-25)
  // ════════════════════════════════════════════════════════

  // ── Chapter 21: Advanced OOP ──────────────────────────
  'ch21-1': {
    chapter: 'Chapter 21 — Advanced OOP',
    title: '21.1 Design Patterns',
    subtitle: 'Reusable solutions to common software design problems',
    keyTerms: [
      { name: 'Design pattern', def: 'A reusable solution template for a recurring software design problem.' },
      { name: 'Singleton', def: 'Ensures a class has only one instance with a global access point.' },
      { name: 'Strategy', def: 'Defines a family of algorithms; encapsulates and makes them interchangeable.' },
      { name: 'Observer', def: 'Defines one-to-many dependency; when one object changes, its dependents are notified.' },
      { name: 'Factory Method', def: 'Defines an interface for creating objects; subclasses decide which class to instantiate.' },
    ],
    theory: `<p><strong>Creational patterns</strong> (Singleton, Factory) control object creation. <strong>Structural patterns</strong> (Adapter, Decorator) manage class composition. <strong>Behavioural patterns</strong> (Strategy, Observer) handle object communication.</p>
    <p><strong>Singleton:</strong> Constructor private; static method returns the one shared instance. Thread-safety consideration in multi-threaded environments.</p>
    <p><strong>Strategy:</strong> Context holds a reference to a Strategy interface. Clients set the strategy at runtime — eliminates conditional logic.</p>
    <p><strong>Observer:</strong> Subject maintains a list of observers; calls <code>notify()</code> on state change. Decouples subject from its observers.</p>`,
    example: `<p><strong>Singleton in pseudocode:</strong></p>
    <pre>CLASS Logger
  PRIVATE STATIC instance : Logger
  PRIVATE PROCEDURE NEW()
  ENDPROCEDURE
  PUBLIC STATIC FUNCTION GetInstance() RETURNS Logger
    IF instance = NULL THEN
      instance ← NEW Logger()
    ENDIF
    RETURN instance
  ENDFUNCTION
ENDCLASS</pre>`,
    questions: [
      { stem: 'Describe the Singleton pattern and give one scenario where it would be appropriate.', marks: 3, ms: 'Restricts a class to a single instance [1]; uses a private constructor and static accessor method [1]; appropriate for: database connection manager / configuration settings / logging service [1].' },
      { stem: 'Explain the advantage of the Strategy pattern over using an IF/CASE statement to select algorithms.', marks: 2, ms: 'Open/closed principle — new algorithms added without modifying existing code [1]; strategies can be swapped at runtime without changing the context class [1].' },
    ]
  },

  'ch21-2': {
    chapter: 'Chapter 21 — Advanced OOP',
    title: '21.2 Abstract Classes and Interfaces',
    subtitle: 'Defining contracts and enforcing structure',
    keyTerms: [
      { name: 'Abstract class', def: 'A class that cannot be instantiated; may contain abstract methods that subclasses must implement.' },
      { name: 'Abstract method', def: 'A method declared without implementation; all non-abstract subclasses must override it.' },
      { name: 'Interface', def: 'A completely abstract type specifying method signatures — a pure contract with no implementation.' },
      { name: 'Concrete class', def: 'A class that provides implementations for all methods and can be instantiated.' },
    ],
    theory: `<p><strong>Abstract classes</strong> use the keyword ABSTRACT. They can have both abstract and concrete methods. A class inheriting an abstract class must implement all abstract methods or itself be abstract.</p>
    <p><strong>Interfaces</strong> define only method signatures (no implementation). A class can implement multiple interfaces but inherit only one class (in most languages).</p>
    <p><strong>When to use which:</strong> Abstract class — shared implementation + contract. Interface — pure contract with no shared code (unrelated classes sharing behaviour).</p>`,
    example: `<pre>ABSTRACT CLASS Shape
  PUBLIC ABSTRACT FUNCTION Area() RETURNS REAL
  PUBLIC FUNCTION Describe() RETURNS STRING
    RETURN "I am a shape with area: " & Area()
  ENDFUNCTION
ENDCLASS

CLASS Circle INHERITS Shape
  PRIVATE r : REAL
  PUBLIC PROCEDURE NEW(radius : REAL)
    r ← radius
  ENDPROCEDURE
  PUBLIC FUNCTION Area() RETURNS REAL
    RETURN 3.14159 * r * r
  ENDFUNCTION
ENDCLASS</pre>`,
    questions: [
      { stem: 'State two differences between an abstract class and an interface.', marks: 2, ms: 'Abstract class can have concrete (implemented) methods / interfaces cannot [1]; a class can implement multiple interfaces but only inherit one abstract class [1].' },
      { stem: 'A program uses Shape, Circle, Rectangle and Triangle. Explain why Shape should be abstract.', marks: 2, ms: 'A Shape object on its own has no meaningful area/perimeter [1]; forces all subclasses to provide their own Area() implementation [1].' },
    ]
  },

  'ch21-3': {
    chapter: 'Chapter 21 — Advanced OOP',
    title: '21.3 Polymorphism in Depth',
    subtitle: 'Runtime and compile-time polymorphism',
    keyTerms: [
      { name: 'Polymorphism', def: 'The ability of objects of different types to be treated as instances of a common supertype.' },
      { name: 'Method overriding', def: 'Subclass provides a different implementation of a method defined in its superclass.' },
      { name: 'Method overloading', def: 'Multiple methods with the same name but different parameter lists in the same class.' },
      { name: 'Dynamic dispatch', def: 'The process of selecting which overridden method to call at runtime based on the actual object type.' },
      { name: 'Late binding', def: 'Method calls resolved at runtime rather than compile time.' },
    ],
    theory: `<p><strong>Runtime polymorphism</strong> (method overriding + dynamic dispatch): the correct method is selected based on the actual object type, not the reference type. Enables writing code against the supertype that works for all subtypes.</p>
    <p><strong>Compile-time polymorphism</strong> (method overloading): multiple methods same name, different signatures. Resolved at compile time.</p>
    <p><strong>Liskov Substitution Principle:</strong> Objects of a subclass must be substitutable for objects of the superclass without breaking program correctness.</p>`,
    example: `<pre>// Dynamic dispatch example
DECLARE shapes : ARRAY[1:3] OF Shape
shapes[1] ← NEW Circle(5)
shapes[2] ← NEW Rectangle(4, 3)
shapes[3] ← NEW Triangle(6, 4)
FOR i ← 1 TO 3
  OUTPUT shapes[i].Area()   // calls the correct Area() for each actual type
NEXT i</pre>`,
    questions: [
      { stem: 'Explain what is meant by dynamic dispatch and why it is useful in OOP.', marks: 3, ms: 'Method to call is determined at runtime based on the actual object type [1]; allows a variable declared as the supertype to invoke the correct subtype method [1]; enables writing generic code that works with multiple types [1].' },
    ]
  },

  'ch21-4': {
    chapter: 'Chapter 21 — Advanced OOP',
    title: '21.4 SOLID Principles',
    subtitle: 'Five principles for maintainable OOP design',
    keyTerms: [
      { name: 'Single Responsibility', def: 'A class should have only one reason to change.' },
      { name: 'Open/Closed', def: 'Classes open for extension, closed for modification.' },
      { name: 'Liskov Substitution', def: 'Subtypes must be substitutable for their base types.' },
      { name: 'Interface Segregation', def: 'Clients should not be forced to depend on methods they do not use.' },
      { name: 'Dependency Inversion', def: 'Depend on abstractions, not concretions.' },
    ],
    theory: `<p><strong>S</strong>ingle Responsibility: one class, one job. Reduces coupling and makes classes easier to test.</p>
    <p><strong>O</strong>pen/Closed: use inheritance/interfaces to extend behaviour — no need to modify existing, tested code.</p>
    <p><strong>L</strong>iskov Substitution: if S is a subtype of T, programs using T should work correctly with S.</p>
    <p><strong>I</strong>nterface Segregation: prefer small, specific interfaces over large, general ones.</p>
    <p><strong>D</strong>ependency Inversion: high-level modules depend on abstractions (interfaces), not low-level details.</p>`,
    example: `<p>Violating SRP: <code>Report</code> class that both formats data AND saves to file. Fix: split into <code>ReportFormatter</code> and <code>ReportSaver</code>.</p>`,
    questions: [
      { stem: 'A class Invoice contains methods: calculateTotal(), printInvoice(), saveToDatabase(). State which SOLID principle this violates and how to fix it.', marks: 3, ms: 'Violates Single Responsibility Principle [1]; has three reasons to change (calculation logic, printing format, database schema) [1]; fix by splitting into InvoiceCalculator, InvoicePrinter, InvoiceRepository [1].' },
    ]
  },

  // ── Chapter 22: Advanced Algorithms ──────────────────
  'ch22-1': {
    chapter: 'Chapter 22 — Advanced Algorithms',
    title: '22.1 Algorithm Complexity and Big-O',
    subtitle: 'Analysing time and space efficiency',
    keyTerms: [
      { name: 'Big-O notation', def: 'Describes the upper bound of an algorithm\'s time or space complexity as input size grows.' },
      { name: 'O(1)', def: 'Constant time — execution time does not depend on input size.' },
      { name: 'O(log n)', def: 'Logarithmic — input halved each step (e.g., binary search).' },
      { name: 'O(n)', def: 'Linear — time grows proportionally with input size.' },
      { name: 'O(n²)', def: 'Quadratic — nested loops over the same data (e.g., bubble sort).' },
      { name: 'Space complexity', def: 'Memory required by an algorithm as a function of input size.' },
    ],
    theory: `<p><strong>Common complexities (best→worst):</strong> O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)</p>
    <p><strong>How to determine:</strong> Count nested loops. One loop → O(n). Loop inside loop → O(n²). Halving input each step → O(log n). Divide and conquer → often O(n log n).</p>
    <p><strong>Best/Average/Worst case:</strong> Quick sort: best O(n log n), worst O(n²) (sorted array with bad pivot). Binary search: always O(log n).</p>`,
    example: `<pre>// O(n²) — bubble sort inner+outer loops
FOR i ← 1 TO n-1
  FOR j ← 1 TO n-i
    IF arr[j] > arr[j+1] THEN swap
NEXT j
NEXT i</pre>`,
    questions: [
      { stem: 'State the time complexity of each: (a) binary search, (b) merge sort, (c) linear search, (d) accessing an array by index.', marks: 4, ms: '(a) O(log n) [1]; (b) O(n log n) [1]; (c) O(n) [1]; (d) O(1) [1].' },
      { stem: 'An algorithm has two sequential loops each O(n). State its overall complexity and justify.', marks: 2, ms: 'O(n) [1]; constants dropped in Big-O notation: O(n) + O(n) = O(2n) → O(n) [1].' },
    ]
  },

  'ch22-2': {
    chapter: 'Chapter 22 — Advanced Algorithms',
    title: '22.2 Advanced Sorting: Quicksort and Merge Sort',
    subtitle: 'Divide-and-conquer sorting strategies',
    keyTerms: [
      { name: 'Quicksort', def: 'Picks a pivot, partitions array around it, recursively sorts sub-arrays.' },
      { name: 'Pivot', def: 'Element chosen to partition the array; elements < pivot go left, > pivot go right.' },
      { name: 'Merge sort', def: 'Recursively splits array in half, sorts each half, merges sorted halves.' },
      { name: 'In-place', def: 'Algorithm that sorts using O(1) extra space (quicksort is in-place; merge sort is not).' },
      { name: 'Stable sort', def: 'Preserves relative order of equal elements (merge sort is stable; quicksort is not).' },
    ],
    theory: `<p><strong>Quicksort steps:</strong> Choose pivot → partition (all < pivot left, > pivot right) → recursively sort left and right partitions. Average O(n log n); worst O(n²) when pivot is always min/max.</p>
    <p><strong>Merge sort steps:</strong> Split until single elements → merge adjacent pairs in sorted order → repeat until fully merged. Always O(n log n) but requires O(n) extra space.</p>
    <p><strong>Trade-offs:</strong> Quicksort: in-place, cache-friendly but worst case O(n²). Merge sort: guaranteed O(n log n), stable but needs extra memory.</p>`,
    example: `<pre>// Merge Sort pseudocode
PROCEDURE MergeSort(arr, left, right)
  IF left < right THEN
    mid ← (left + right) DIV 2
    MergeSort(arr, left, mid)
    MergeSort(arr, mid+1, right)
    Merge(arr, left, mid, right)
  ENDIF
ENDPROCEDURE</pre>`,
    questions: [
      { stem: 'Trace quicksort on [5,1,4,2,8] using the last element as pivot. Show array after each partition.', marks: 4, ms: 'Pivot=8: partition [5,1,4,2]|8 → [5,1,4,2] unsorted right of 8 empty [1]; pivot=2: [1]|2|[5,4] [1]; pivot=4: [1,2]|4|5 [1]; final: [1,2,4,5,8] [1].' },
    ]
  },

  'ch22-3': {
    chapter: 'Chapter 22 — Advanced Algorithms',
    title: '22.3 Graph Algorithms: BFS, DFS and Dijkstra',
    subtitle: 'Traversal and shortest-path algorithms',
    keyTerms: [
      { name: 'BFS (Breadth-First Search)', def: 'Explores all neighbours at current depth before moving deeper; uses a queue.' },
      { name: 'DFS (Depth-First Search)', def: 'Explores as far as possible before backtracking; uses a stack or recursion.' },
      { name: "Dijkstra's algorithm", def: 'Finds shortest path from a source to all vertices in a weighted graph with non-negative weights.' },
      { name: 'Relaxation', def: "Updating a vertex's tentative distance if a shorter path is found through a neighbour." },
      { name: 'Priority queue', def: 'Queue where dequeue returns the item with lowest key; used in Dijkstra\'s.' },
    ],
    theory: `<p><strong>BFS:</strong> Start → enqueue → loop: dequeue, visit all unvisited neighbours → enqueue neighbours. Finds shortest path in unweighted graphs.</p>
    <p><strong>DFS:</strong> Start → visit → recurse/push all unvisited neighbours. Can detect cycles; used in topological sort.</p>
    <p><strong>Dijkstra's:</strong> Initialise all distances to ∞ (source = 0). Repeatedly pick unvisited vertex with smallest distance, relax its edges. Terminates when all vertices visited. Does NOT work with negative edges.</p>`,
    example: `<pre>// Dijkstra's trace — A→B(4), A→C(1), C→B(2), B→D(1)
// Initial: A=0, B=∞, C=∞, D=∞
// Visit A: B=4, C=1
// Visit C (dist=1): B=min(4,1+2)=3
// Visit B (dist=3): D=3+1=4
// Visit D (dist=4). Done.
// Shortest: A=0, C=1, B=3, D=4</pre>`,
    questions: [
      { stem: 'Explain why Dijkstra\'s algorithm cannot be used on a graph containing negative edge weights.', marks: 2, ms: "Once a vertex is marked as visited/finalised, its distance is not re-examined [1]; a negative edge found later could provide a shorter path to an already-finalised vertex, producing incorrect results [1]." },
    ]
  },

  'ch22-4': {
    chapter: 'Chapter 22 — Advanced Algorithms',
    title: '22.4 Dynamic Programming',
    subtitle: 'Solving problems by storing sub-problem results',
    keyTerms: [
      { name: 'Dynamic programming (DP)', def: 'Solves complex problems by breaking into overlapping sub-problems and storing results (memoisation/tabulation).' },
      { name: 'Memoisation', def: 'Top-down DP: cache recursive sub-problem results to avoid recomputation.' },
      { name: 'Tabulation', def: 'Bottom-up DP: fill a table iteratively from base cases to the full problem.' },
      { name: 'Optimal substructure', def: 'Optimal solution contains optimal solutions to sub-problems.' },
      { name: 'Overlapping sub-problems', def: 'Same sub-problems are solved repeatedly (unlike divide-and-conquer).' },
    ],
    theory: `<p><strong>When to use DP:</strong> Problem has optimal substructure AND overlapping sub-problems.</p>
    <p><strong>Fibonacci without DP:</strong> O(2ⁿ) — exponential. <strong>With memoisation:</strong> O(n).</p>
    <p><strong>Tabulation example (Fibonacci):</strong> Build array F[0..n]: F[0]=0, F[1]=1, F[i]=F[i-1]+F[i-2].</p>
    <p><strong>Knapsack problem:</strong> Classic DP — dp[i][w] = max value using first i items with capacity w.</p>`,
    example: `<pre>// Tabulation — Fibonacci
FUNCTION FibDP(n : INTEGER) RETURNS INTEGER
  DECLARE F : ARRAY[0:n] OF INTEGER
  F[0] ← 0 : F[1] ← 1
  FOR i ← 2 TO n
    F[i] ← F[i-1] + F[i-2]
  NEXT i
  RETURN F[n]
ENDFUNCTION</pre>`,
    questions: [
      { stem: 'State the two conditions a problem must satisfy to be solvable by dynamic programming. Give an example of each.', marks: 4, ms: 'Optimal substructure [1]; e.g. shortest path — sub-paths are also shortest [1]. Overlapping sub-problems [1]; e.g. Fibonacci — F(5) computes F(3) and F(4) which both compute F(2) [1].' },
    ]
  },

  // ── Chapter 23: Advanced Data Structures ─────────────
  'ch23-1': {
    chapter: 'Chapter 23 — Advanced Data Structures',
    title: '23.1 Hash Tables',
    subtitle: 'Key-value storage with O(1) average access',
    keyTerms: [
      { name: 'Hash function', def: 'Maps a key to an array index (e.g., key MOD tableSize).' },
      { name: 'Collision', def: 'Two different keys hash to the same index.' },
      { name: 'Chaining', def: 'Each slot holds a linked list of all entries that hash there.' },
      { name: 'Open addressing', def: 'On collision, probes alternative slots (linear, quadratic, or double hashing).' },
      { name: 'Load factor', def: 'Ratio of stored entries to table size; higher load → more collisions.' },
    ],
    theory: `<p><strong>Hash function design:</strong> Good distribution, fast to compute. Prime table sizes reduce clustering.</p>
    <p><strong>Linear probing:</strong> Probe slots (h+1), (h+2), … until empty. Simple but causes primary clustering.</p>
    <p><strong>Quadratic probing:</strong> Probe (h+1²), (h+2²), … Reduces primary clustering but may not probe all slots.</p>
    <p><strong>Deletion:</strong> With open addressing, cannot simply remove — must mark slot as "deleted" (tombstone) to preserve probe sequences.</p>`,
    example: `<pre>// Chain-based lookup
FUNCTION Lookup(key : STRING) RETURNS INTEGER
  DECLARE idx : INTEGER
  idx ← HashFn(key) MOD TABLE_SIZE
  DECLARE node : ListNode
  node ← table[idx].head
  WHILE node ≠ NULL DO
    IF node.key = key THEN RETURN node.value ENDIF
    node ← node.next
  ENDWHILE
  RETURN -1  // not found
ENDFUNCTION</pre>`,
    questions: [
      { stem: 'Insert keys 14, 17, 27, 9, 4 into a hash table of size 7 using hash(k) = k MOD 7 and linear probing. Show the final table.', marks: 4, ms: '14→0, 17→3, 27→6, 9→2, 4→4 [1 per correct placement, allow error carried forward].' },
    ]
  },

  'ch23-2': {
    chapter: 'Chapter 23 — Advanced Data Structures',
    title: '23.2 Trees: AVL and Binary Search Trees',
    subtitle: 'Self-balancing trees for efficient search',
    keyTerms: [
      { name: 'BST property', def: 'Left child < parent < right child for all nodes.' },
      { name: 'AVL tree', def: 'Self-balancing BST; height difference between left and right subtrees ≤ 1.' },
      { name: 'Balance factor', def: 'Height(left subtree) − Height(right subtree); must be −1, 0, or +1 in AVL.' },
      { name: 'Rotation', def: 'Restructuring operation to restore AVL balance (LL, RR, LR, RL).' },
      { name: 'Height-balanced', def: 'Tree where all nodes have balance factor in {−1, 0, 1}.' },
    ],
    theory: `<p><strong>BST operations:</strong> Search/Insert/Delete all O(h) where h = height. Worst case (sorted input) → O(n) linked list.</p>
    <p><strong>AVL fix:</strong> After insert, walk up tree recalculating balance factors. If |bf| > 1: rotate. LL imbalance → right rotation. RR → left rotation. LR → left-right rotation. RL → right-left rotation.</p>
    <p><strong>Benefit:</strong> AVL guarantees O(log n) for search/insert/delete.</p>`,
    example: `<pre>// Insert 10, 20, 30 into AVL tree
// After 10,20,30: right-heavy (bf=-2 at root)
// Apply left rotation: 20 becomes root
//        20
//       /  \\
//      10   30</pre>`,
    questions: [
      { stem: 'Explain what is meant by a rotation in an AVL tree and state when a left rotation is applied.', marks: 3, ms: 'A rotation restructures nodes to restore the height-balance property [1]; left rotation applied when a node is right-heavy (balance factor = −2) [1] and the right child has balance factor 0 or −1 (right-right case) [1].' },
    ]
  },

  'ch23-3': {
    chapter: 'Chapter 23 — Advanced Data Structures',
    title: '23.3 Heaps and Priority Queues',
    subtitle: 'Efficient min/max retrieval with complete binary trees',
    keyTerms: [
      { name: 'Heap', def: 'Complete binary tree where each node ≥ (max-heap) or ≤ (min-heap) its children.' },
      { name: 'Heapify', def: 'Process of building or restoring the heap property.' },
      { name: 'Sift-up', def: 'After insert at end, swap with parent while heap property violated.' },
      { name: 'Sift-down', def: 'After removing root, move last element to root then swap downward to restore heap.' },
      { name: 'Priority queue', def: 'ADT where dequeue returns the item with highest/lowest priority; efficiently implemented as a heap.' },
    ],
    theory: `<p><strong>Array representation:</strong> Root at index 1. For node i: left child = 2i, right child = 2i+1, parent = i DIV 2.</p>
    <p><strong>Insert:</strong> Append to end → sift-up. O(log n).</p>
    <p><strong>Delete max:</strong> Replace root with last element → remove last → sift-down. O(log n).</p>
    <p><strong>Heap sort:</strong> Build max-heap O(n) → repeatedly extract max O(n log n) → total O(n log n), in-place.</p>`,
    example: `<pre>// Max-heap sift-down after removing root
// Heap: [_,90,80,70,50,60,30]  →  remove 90
// Move 30 to root: [_,30,80,70,50,60]
// Sift-down: 30<80, swap → [_,80,30,70,50,60]
// 30<50, swap → [_,80,50,70,30,60]  (stable)</pre>`,
    questions: [
      { stem: 'Given min-heap [5,10,8,15,20], insert the value 3. Show each swap during sift-up.', marks: 3, ms: 'Append 3 at position 6 [1]; parent = F[3] = 8 > 3 → swap → [5,10,3,15,20,8] [1]; parent = F[1] = 5 > 3 → swap → [3,10,5,15,20,8] [1].' },
    ]
  },

  // ── Chapter 24: Security & Encryption ────────────────
  'ch24-1': {
    chapter: 'Chapter 24 — Security and Encryption',
    title: '24.1 Cryptographic Techniques',
    subtitle: 'Symmetric, asymmetric and hashing schemes',
    keyTerms: [
      { name: 'Symmetric encryption', def: 'Same key used for encryption and decryption (e.g., AES).' },
      { name: 'Asymmetric encryption', def: 'Public key encrypts; private key decrypts (or vice versa for signing). E.g., RSA.' },
      { name: 'Public key', def: 'Shared openly; used to encrypt messages sent to the key owner.' },
      { name: 'Private key', def: 'Kept secret; used to decrypt messages or create digital signatures.' },
      { name: 'Hashing', def: 'One-way function producing fixed-length digest; cannot be reversed.' },
      { name: 'Digital signature', def: 'Hash of message encrypted with sender\'s private key; verifies authenticity and integrity.' },
    ],
    theory: `<p><strong>Symmetric encryption:</strong> Fast; problem is secure key exchange. Used for bulk data (AES-256).</p>
    <p><strong>Asymmetric encryption:</strong> Solves key distribution — public key shared freely. Slower. RSA widely used.</p>
    <p><strong>Hybrid encryption:</strong> TLS/HTTPS uses asymmetric encryption to exchange a session key, then symmetric for speed.</p>
    <p><strong>Digital signatures:</strong> Alice signs with private key → Bob verifies with Alice's public key. Provides non-repudiation.</p>
    <p><strong>Hash functions (SHA-256):</strong> deterministic, fast, avalanche effect (small input change → completely different hash), collision-resistant.</p>`,
    example: `<p><strong>HTTPS handshake summary:</strong></p>
    <ol><li>Client sends supported cipher suites.</li><li>Server sends certificate (contains public key).</li><li>Client verifies certificate via CA.</li><li>Client generates session key, encrypts with server's public key, sends.</li><li>Server decrypts with private key; both now have shared session key.</li><li>Remaining communication uses symmetric encryption with session key.</li></ol>`,
    questions: [
      { stem: 'Explain the role of a Certificate Authority (CA) in HTTPS.', marks: 3, ms: 'CA is a trusted third party [1]; digitally signs the server\'s certificate confirming the public key belongs to the claimed domain [1]; client verifies the CA\'s signature using the CA\'s public key (pre-installed in browser/OS) to authenticate the server [1].' },
    ]
  },

  'ch24-2': {
    chapter: 'Chapter 24 — Security and Encryption',
    title: '24.2 Network Security Threats and Defences',
    subtitle: 'Attacks, vulnerabilities and countermeasures',
    keyTerms: [
      { name: 'SQL injection', def: 'Inserting malicious SQL into input fields to manipulate database queries.' },
      { name: 'Cross-site scripting (XSS)', def: 'Injecting malicious scripts into web pages viewed by other users.' },
      { name: 'DDoS', def: 'Distributed Denial of Service — overwhelming a server with traffic from many sources.' },
      { name: 'Firewall', def: 'Filters network traffic by IP, port, and protocol; blocks unauthorised access.' },
      { name: 'Intrusion Detection System (IDS)', def: 'Monitors network traffic for suspicious patterns and alerts administrators.' },
    ],
    theory: `<p><strong>SQL injection prevention:</strong> Parameterised queries (prepared statements), input validation, principle of least privilege for DB accounts.</p>
    <p><strong>XSS prevention:</strong> Escape HTML special characters in output; Content Security Policy headers; HTTPOnly cookies.</p>
    <p><strong>Defence in depth:</strong> Multiple layers — firewall, IDS, encryption, authentication, access control. A breach of one layer is mitigated by others.</p>`,
    example: `<pre>// Vulnerable SQL:
query = "SELECT * FROM users WHERE name = '" + input + "'"
// If input = "'; DROP TABLE users; --" → catastrophic

// Fixed (parameterised):
query = "SELECT * FROM users WHERE name = ?"
execute(query, [input])</pre>`,
    questions: [
      { stem: 'Describe how SQL injection works and state two methods to prevent it.', marks: 4, ms: 'Attacker inputs SQL code into a form field [1]; unvalidated input incorporated into query changes its meaning [1]. Prevention: parameterised queries/prepared statements [1]; input validation/sanitisation OR whitelist acceptable characters [1].' },
    ]
  },

  'ch24-3': {
    chapter: 'Chapter 24 — Security and Encryption',
    title: '24.3 Privacy, Ethics and Legislation',
    subtitle: 'Legal and ethical dimensions of computing',
    keyTerms: [
      { name: 'Data Protection Act', def: 'UK legislation requiring lawful, fair, transparent data processing with clear purpose and user rights.' },
      { name: 'GDPR', def: 'EU General Data Protection Regulation — strict rules on consent, data minimisation, right to erasure.' },
      { name: 'Privacy by design', def: 'Embedding privacy protections into systems from the start, not as an afterthought.' },
      { name: 'Intellectual property', def: 'Legal right over creative works; includes copyright, patents, trademarks.' },
      { name: 'Whistleblowing', def: 'Exposing illegal or unethical practices by an organisation; legal protections vary by jurisdiction.' },
    ],
    theory: `<p><strong>Key data protection principles:</strong> Lawfulness, purpose limitation, data minimisation, accuracy, storage limitation, integrity and confidentiality.</p>
    <p><strong>Ethical frameworks:</strong> Consequentialism (judge by outcomes), Deontology (duty-based rules), Virtue ethics (character). Exam questions often ask you to present both sides and reach a justified conclusion.</p>
    <p><strong>Computer Misuse Act 1990 (UK):</strong> Unauthorised access, unauthorised access with intent, unauthorised modification of computer material.</p>`,
    example: `<p>Scenario: A company stores customer passwords in plain text. Evaluate ethically:</p>
    <ul><li><strong>Against:</strong> Violates users' right to privacy/security; data breach exposes passwords; negligent storage.</li><li><strong>For:</strong> (none defensible — this is unambiguously poor practice)</li><li><strong>GDPR angle:</strong> Violates integrity/confidentiality principle; DPA breach.</li></ul>`,
    questions: [
      { stem: 'A developer proposes storing user passwords as MD5 hashes. Discuss whether this is adequate from a security perspective.', marks: 4, ms: 'MD5 is a hash so passwords not stored plaintext [1]; however MD5 is cryptographically broken / fast to compute [1]; rainbow table / brute-force attacks feasible [1]; should use bcrypt/Argon2 with salt instead [1].' },
    ]
  },

  // ── Chapter 25: Further Programming ──────────────────
  'ch25-1': {
    chapter: 'Chapter 25 — Further Programming',
    title: '25.1 Functional Programming Concepts',
    subtitle: 'Declarative programming with pure functions and higher-order functions',
    keyTerms: [
      { name: 'Pure function', def: 'Function with no side effects; same input always produces same output.' },
      { name: 'Immutability', def: 'Data cannot be changed after creation; new values computed from old ones.' },
      { name: 'Higher-order function', def: 'Function that takes another function as argument or returns a function.' },
      { name: 'Map', def: 'Applies a function to every element of a list, returning a new list.' },
      { name: 'Filter', def: 'Returns a new list containing only elements satisfying a predicate.' },
      { name: 'Fold/Reduce', def: 'Combines list elements using a function and an accumulator into a single value.' },
    ],
    theory: `<p><strong>Functional vs imperative:</strong> Functional programs describe <em>what</em> to compute; imperative programs describe <em>how</em>.</p>
    <p><strong>Benefits:</strong> Easier reasoning about code, no shared state bugs, natural parallelism, easier testing (pure functions).</p>
    <p><strong>Lambda (anonymous) functions:</strong> Functions defined inline without a name — <code>x → x * x</code>.</p>
    <p><strong>Closure:</strong> Function that captures variables from its enclosing scope.</p>`,
    example: `<pre>// Pseudocode approximation
// Map: square each element
result ← map(x → x*x, [1,2,3,4])  // [1,4,9,16]

// Filter: keep only even numbers
evens ← filter(x → x MOD 2 = 0, [1,2,3,4,5])  // [2,4]

// Fold: sum all elements
total ← fold((acc,x) → acc+x, 0, [1,2,3,4])  // 10</pre>`,
    questions: [
      { stem: 'Explain the difference between a pure function and a function with side effects. Give an example of each.', marks: 4, ms: 'Pure function: returns same output for same input, no observable side effects [1]; example: square(x) returns x² [1]. Side-effect function: modifies external state / performs I/O [1]; example: procedure that writes to a file or updates a global variable [1].' },
    ]
  },

  'ch25-2': {
    chapter: 'Chapter 25 — Further Programming',
    title: '25.2 Declarative Programming and Logic',
    subtitle: 'Prolog-style facts, rules and queries',
    keyTerms: [
      { name: 'Fact', def: 'A basic assertion that is always true (e.g., parent(tom, bob).)' },
      { name: 'Rule', def: 'A conditional statement: head :- body (head is true if body is true).' },
      { name: 'Query', def: 'A question posed to the logic database; interpreter searches for a satisfying binding.' },
      { name: 'Unification', def: 'Process of matching variables to values to make a goal true.' },
      { name: 'Backtracking', def: 'Returning to a previous choice point when current path fails to find a solution.' },
    ],
    theory: `<p><strong>Prolog execution:</strong> Interpreter attempts to satisfy goals left-to-right; if a goal fails, it backtracks to the last choice point and tries an alternative.</p>
    <p><strong>Sample facts and rules:</strong></p>
    <pre>parent(tom, bob).
parent(tom, liz).
grandparent(X, Z) :- parent(X, Y), parent(Y, Z).</pre>
    <p>Query: <code>grandparent(tom, Who)?</code> → <code>Who = bob; Who = liz</code>.</p>
    <p><strong>Negation as failure:</strong> <code>not(Goal)</code> succeeds if Goal cannot be proved.</p>`,
    example: `<pre>// Ancestral rules
ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).

// Query: ancestor(tom, liz)?
// → parent(tom, liz) → TRUE</pre>`,
    questions: [
      { stem: 'Given facts: parent(ann,bob). parent(bob,cal). Rule: ancestor(X,Y):-parent(X,Y). ancestor(X,Y):-parent(X,Z),ancestor(Z,Y). Trace how ancestor(ann,cal) is proved.', marks: 4, ms: 'Try first clause: parent(ann,cal) — fails [1]; try second clause: parent(ann,Z) → Z=bob [1]; prove ancestor(bob,cal) → try first: parent(bob,cal) → succeeds [1]; goal proved [1].' },
    ]
  },

  'ch25-3': {
    chapter: 'Chapter 25 — Further Programming',
    title: '25.3 Low-Level and Assembly Programming',
    subtitle: 'Registers, instruction sets and assembly translation',
    keyTerms: [
      { name: 'Instruction set', def: 'Complete set of machine instructions a processor can execute.' },
      { name: 'Register', def: 'Small, fast storage location within the CPU (ACC, IX, PC, MAR, MDR, CIR).' },
      { name: 'Addressing mode', def: 'How an instruction\'s operand is interpreted: immediate, direct, indirect, indexed.' },
      { name: 'Immediate addressing', def: 'Operand is the actual value (e.g., LDM #5 loads 5 into ACC).' },
      { name: 'Direct addressing', def: 'Operand is a memory address (e.g., LDD 200 loads value at address 200).' },
      { name: 'Indexed addressing', def: 'Effective address = operand + index register IX.' },
    ],
    theory: `<p><strong>Cambridge 9618 assembly subset:</strong></p>
    <table style="font-size:0.85em;border-collapse:collapse;width:100%">
    <tr><td style="border:1px solid #666;padding:4px"><strong>LDM #n</strong></td><td style="border:1px solid #666;padding:4px">Load immediate value n into ACC</td></tr>
    <tr><td style="border:1px solid #666;padding:4px"><strong>LDD addr</strong></td><td style="border:1px solid #666;padding:4px">Load from memory address into ACC</td></tr>
    <tr><td style="border:1px solid #666;padding:4px"><strong>STO addr</strong></td><td style="border:1px solid #666;padding:4px">Store ACC to memory address</td></tr>
    <tr><td style="border:1px solid #666;padding:4px"><strong>ADD addr</strong></td><td style="border:1px solid #666;padding:4px">ACC ← ACC + [addr]</td></tr>
    <tr><td style="border:1px solid #666;padding:4px"><strong>CMP #n / addr</strong></td><td style="border:1px solid #666;padding:4px">Compare ACC with value; set flags</td></tr>
    <tr><td style="border:1px solid #666;padding:4px"><strong>JPN label</strong></td><td style="border:1px solid #666;padding:4px">Jump if negative flag set</td></tr>
    <tr><td style="border:1px solid #666;padding:4px"><strong>END</strong></td><td style="border:1px solid #666;padding:4px">Halt program</td></tr>
    </table>`,
    example: `<pre>// Pseudocode: x ← 5 + y
LDM #5    // ACC = 5
ADD yAddr // ACC = 5 + y
STO xAddr // x = ACC
END</pre>`,
    questions: [
      { stem: 'Translate to assembly: IF x > 10 THEN y ← 0 ELSE y ← 1. Use registers ACC and addresses Ax (for x) and Ay (for y).', marks: 5, ms: 'LDD Ax [1]; CMP #10 [1]; JPN else_label [1]; LDM #0 STO Ay [branch to end] [1]; else_label: LDM #1 STO Ay [1].' },
    ]
  },

  'ch25-4': {
    chapter: 'Chapter 25 — Further Programming',
    title: '25.4 Compiler Stages and Language Translation',
    subtitle: 'How source code becomes machine code',
    keyTerms: [
      { name: 'Lexical analysis', def: 'Tokenises source code — removes whitespace/comments, produces token stream.' },
      { name: 'Syntax analysis (parsing)', def: 'Checks token stream against grammar rules; builds parse tree / AST.' },
      { name: 'Semantic analysis', def: 'Checks meaning: type checking, scope resolution, undeclared variable detection.' },
      { name: 'Code generation', def: 'Converts intermediate representation to target machine code or bytecode.' },
      { name: 'Optimisation', def: 'Improves generated code for speed/size: constant folding, dead code elimination, loop unrolling.' },
      { name: 'Interpreter', def: 'Executes source code directly without producing machine code; no separate compile step.' },
    ],
    theory: `<p><strong>Compilation stages:</strong> Source → [Lexer] → Tokens → [Parser] → AST → [Semantic Analysis] → Annotated AST → [Code Generator] → Machine Code → [Linker] → Executable.</p>
    <p><strong>Compiler vs Interpreter:</strong> Compiler translates whole program once → faster execution. Interpreter translates line by line → slower but easier debugging and cross-platform.</p>
    <p><strong>Bytecode / JIT:</strong> Java/Python compile to bytecode (intermediate), then JIT compiles hot paths to native code at runtime — combines portability and speed.</p>`,
    example: `<pre>// Lexical analysis of:  x := 5 + y
// Tokens: [ID:"x"] [OP:":="] [INT:5] [OP:"+"] [ID:"y"]

// Parse tree:
//   AssignStmt
//   ├── ID: x
//   └── AddExpr
//       ├── INT: 5
//       └── ID: y</pre>`,
    questions: [
      { stem: 'Describe the role of the lexical analyser and the semantic analyser in a compiler. Give one error each stage would detect.', marks: 4, ms: 'Lexical: tokenises source; detects invalid characters / unrecognised symbols [2]. Semantic: checks meaning — type checking, scope resolution; detects type mismatch (adding string to integer) / use of undeclared variable [2].' },
    ]
  },
}


// ── Sidebar chapter toggle ───────────────────────────────────────────────────"""

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    print('Paper 4 TOPICS added')
else:
    print('Marker not found! Check OLD string.')

with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done. Lines:', len(content.splitlines()))
