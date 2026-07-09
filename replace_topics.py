
new_topics = r"""const TOPICS = {
  // ── Paper 3: Ch 16 — Further Algorithms ────────────────────────────────────
  'ch16-1': {
    chapter: 'Chapter 16 — Further Algorithms',
    title: '16.1 Big-O Notation',
    subtitle: 'Measuring algorithm efficiency — time and space complexity',
    keyTerms: [
      { name: 'Big-O', def: 'Upper bound on growth rate of algorithm run time as input size n increases.' },
      { name: 'O(1)', def: 'Constant time — execution time does not grow with input size.' },
      { name: 'O(n)', def: 'Linear time — execution grows proportionally with input size.' },
      { name: 'O(n²)', def: 'Quadratic time — common in nested loops over the same data.' },
      { name: 'O(log n)', def: 'Logarithmic time — input halved each step; e.g. binary search.' },
    ],
    theory: `<p>Big-O notation describes the <strong>worst-case growth rate</strong> of an algorithm. Common complexities (best → worst):<br>O(1) &lt; O(log n) &lt; O(n) &lt; O(n log n) &lt; O(n²) &lt; O(2ⁿ)</p><p>When simplifying: drop constants and lower-order terms. O(3n² + 2n + 7) → <strong>O(n²)</strong>.</p>`,
    example: `<p><strong>Nested loop → O(n²):</strong></p><pre>FOR i ← 1 TO n\n  FOR j ← 1 TO n\n    OUTPUT i * j\n  NEXT j\nNEXT i</pre><p>Outer loop × inner loop = n × n = <strong>n² operations</strong>.</p>`,
    questions: [
      { stem: 'State the Big-O complexity of a single FOR loop from 1 to n with constant-time operations inside.', marks: 1, ms: 'O(n) [1]' },
      { stem: 'An algorithm has complexity O(n²). State what happens to execution time when n doubles.', marks: 2, ms: 'Time increases by a factor of 4 (2²=4) [2].' },
      { stem: 'Compare O(n) and O(log n) complexity and explain why binary search is more efficient for large n.', marks: 4, ms: 'O(n) grows linearly [1]; O(log n) grows logarithmically [1]; binary search halves the search space each step [1]; for large n, log n grows far more slowly than n [1].' },
    ]
  },
  'ch16-2': {
    chapter: 'Chapter 16 — Further Algorithms',
    title: "16.2 Dijkstra's Algorithm",
    subtitle: 'Finding shortest paths in weighted graphs',
    keyTerms: [
      { name: 'Weighted graph', def: 'Graph where edges have numerical weights representing cost or distance.' },
      { name: "Dijkstra's", def: 'Greedy algorithm finding shortest path from source to all vertices.' },
      { name: 'Priority queue', def: 'Data structure returning the element with lowest priority value first.' },
    ],
    theory: `<p><strong>Steps:</strong></p><ol style="padding-left:18px;font-size:13px;line-height:2;"><li>Set dist[source]=0, dist[all others]=∞</li><li>Add all vertices to unvisited set</li><li>While unvisited not empty: pick vertex u with minimum dist</li><li>For each neighbour v: if dist[u]+weight(u,v) &lt; dist[v], update dist[v]</li><li>Mark u visited</li></ol><p><strong>Complexity:</strong> O(V²) with matrix; O((V+E)log V) with priority queue.</p>`,
    example: `<p>Graph A→C(1), C→B(2), A→B(4), B→D(1), C→D(5).<br>From A: visit A(0)→update C=1, B=4. Visit C(1)→update B=3, D=6. Visit B(3)→update D=4. <strong>Shortest A→D = 4</strong>.</p>`,
    questions: [
      { stem: "State two conditions required for Dijkstra's algorithm to guarantee the shortest path.", marks: 2, ms: 'Non-negative edge weights [1]; graph must be connected / all vertices reachable [1].' },
      { stem: "Describe the role of the 'unvisited set' in Dijkstra's algorithm.", marks: 2, ms: 'Tracks vertices not yet permanently assigned shortest distance [1]; ensures each vertex processed exactly once [1].' },
    ]
  },
  'ch16-3': {
    chapter: 'Chapter 16 — Further Algorithms',
    title: '16.3 A* Search',
    subtitle: 'Heuristic-guided optimal pathfinding',
    keyTerms: [
      { name: 'Heuristic h(n)', def: 'Estimate of cost from node n to goal — guides search direction.' },
      { name: 'f(n) = g(n) + h(n)', def: 'Total estimated cost: actual cost so far plus heuristic estimate.' },
      { name: 'Admissible heuristic', def: 'Never overestimates true cost — guarantees optimality.' },
    ],
    theory: `<p>A* extends Dijkstra's by adding a heuristic h(n) to focus search towards the goal. At each step, expand the node with lowest f(n) = g(n) + h(n).</p><p>If h(n) is <em>admissible</em>, A* guarantees the optimal path and explores fewer nodes than Dijkstra's.</p>`,
    example: `<p>Grid pathfinding: straight-line distance to goal is admissible. A* prioritises cells closer to the goal rather than exploring all directions equally like Dijkstra's.</p>`,
    questions: [
      { stem: 'Explain why an admissible heuristic is necessary for A* to guarantee an optimal solution.', marks: 3, ms: 'Overestimating h(n) may cause A* to bypass the optimal path [1]; admissible means h(n) ≤ true remaining cost [1]; ensures no cheaper path is wrongly dismissed [1].' },
    ]
  },
  'ch16-4': {
    chapter: 'Chapter 16 — Further Algorithms',
    title: '16.4 Dynamic Programming',
    subtitle: 'Solving overlapping subproblems efficiently',
    keyTerms: [
      { name: 'Memoisation', def: 'Cache results of subproblems to avoid recomputation (top-down).' },
      { name: 'Tabulation', def: 'Fill a table iteratively from base cases (bottom-up).' },
      { name: 'Optimal substructure', def: 'Optimal solution contains optimal solutions to subproblems.' },
    ],
    theory: `<p>DP applies when a problem has <strong>overlapping subproblems</strong> and <strong>optimal substructure</strong>. Instead of recomputing, store results → drastic speedup.</p><p>Fibonacci naively: O(2ⁿ). With memoisation: <strong>O(n)</strong>.</p>`,
    example: `<pre>DECLARE memo : ARRAY[0:50] OF INTEGER\nFUNCTION Fib(n)\n  IF n <= 1 THEN RETURN n ENDIF\n  IF memo[n] <> -1 THEN RETURN memo[n] ENDIF\n  memo[n] ← Fib(n-1) + Fib(n-2)\n  RETURN memo[n]\nENDFUNCTION</pre>`,
    questions: [
      { stem: 'State two conditions a problem must satisfy for dynamic programming to be applicable.', marks: 2, ms: 'Optimal substructure [1]; overlapping subproblems [1].' },
      { stem: 'Compare memoisation and tabulation as DP approaches.', marks: 4, ms: 'Memoisation: top-down recursive, only computes needed subproblems [2]. Tabulation: bottom-up iterative, computes all subproblems but avoids recursion overhead [2].' },
    ]
  },
  'ch16-5': {
    chapter: 'Chapter 16 — Further Algorithms',
    title: '16.5 Backtracking',
    subtitle: 'Systematic exhaustive search with constraint pruning',
    keyTerms: [
      { name: 'Backtracking', def: 'Build solutions incrementally; abandon paths violating constraints.' },
      { name: 'Pruning', def: 'Eliminating branches that cannot lead to a valid solution.' },
    ],
    theory: `<p>Backtracking builds a solution step by step and abandons a partial solution as soon as a constraint is violated, then tries the next alternative.</p><pre>PROCEDURE Solve(state)\n  IF complete(state) THEN output; RETURN ENDIF\n  FOR each choice DO\n    IF valid(state+choice) THEN\n      apply; Solve(state+choice); undo\n    ENDIF\n  NEXT\nENDPROCEDURE</pre>`,
    example: `<p><strong>N-Queens:</strong> Place N queens so none attack each other. Try each column in each row; if conflict, backtrack to previous row and try next column. Pruning eliminates infeasible branches early.</p>`,
    questions: [
      { stem: 'Explain the purpose of the "undo" step in backtracking.', marks: 2, ms: 'Restores state before the choice [1]; allows trying a different choice at the same point [1].' },
    ]
  },

  // ── Paper 3: Ch 17 — Advanced Data Structures ──────────────────────────────
  'ch17-1': {
    chapter: 'Chapter 17 — Advanced Data Structures',
    title: '17.1 Hash Tables',
    subtitle: 'O(1) average lookup using hash functions',
    keyTerms: [
      { name: 'Hash function', def: 'Maps a key to an array index.' },
      { name: 'Collision', def: 'Two keys produce the same index.' },
      { name: 'Chaining', def: 'Store collisions in a linked list at each bucket.' },
      { name: 'Open addressing', def: 'Probe for the next empty slot on collision.' },
      { name: 'Load factor', def: 'Ratio of entries to table capacity; high load → more collisions.' },
    ],
    theory: `<p>Hash tables provide <strong>average O(1)</strong> insert, delete, and lookup. Hash function: index = key MOD tableSize (use prime size to reduce clustering).</p><p><strong>Collision resolution:</strong> Chaining (linked list per bucket) or Open addressing (linear/quadratic probing).</p>`,
    example: `<p>Size=7. Keys 10,22,31: hash(k)=k MOD 7 → 3,1,3. Collision at 3! With chaining: slot 3 holds [10,31]. Lookup O(1) average, O(n) worst case.</p>`,
    questions: [
      { stem: 'Explain why a prime number is often chosen as hash table size.', marks: 2, ms: 'Reduces clustering [1]; prime has no common factors with typical key values, producing more uniform distribution [1].' },
      { stem: 'Compare chaining and open addressing for collision resolution.', marks: 4, ms: 'Chaining: linked list per slot, handles arbitrary collisions, extra memory for pointers [2]. Open addressing: probes within array, better cache performance, degrades at high load factor [2].' },
    ]
  },
  'ch17-2': {
    chapter: 'Chapter 17 — Advanced Data Structures',
    title: '17.2 Heaps and Priority Queues',
    subtitle: 'Efficient min/max retrieval using a complete binary tree',
    keyTerms: [
      { name: 'Max-heap', def: 'Each parent ≥ its children.' },
      { name: 'Min-heap', def: 'Each parent ≤ its children.' },
      { name: 'Sift-up', def: 'Restore heap after insertion by swapping with parent.' },
      { name: 'Sift-down', def: 'Restore heap after removal by swapping root with largest child.' },
    ],
    theory: `<p>Binary heap stored as 1-based array: parent(i) = i DIV 2; left child = 2i; right = 2i+1.</p><p><strong>Insert:</strong> append, sift-up → O(log n). <strong>Extract max/min:</strong> swap root with last, remove, sift-down → O(log n).</p><p>Used in Dijkstra's priority queue and heap sort.</p>`,
    example: `<p>Max-heap [90,80,70,50,60]. Insert 85: append → [90,80,70,50,60,85]. Parent of 6 is 3 (value 70). 85>70 → swap. Parent of 3 is 1 (value 90). 85&lt;90 → stop. Result: [90,80,85,50,60,70].</p>`,
    questions: [
      { stem: 'Describe the steps to insert a new element into a min-heap.', marks: 3, ms: 'Append element at end of array [1]; compare with parent: if smaller, swap [1]; repeat until heap property satisfied or root reached (sift-up) [1].' },
    ]
  },
  'ch17-3': {
    chapter: 'Chapter 17 — Advanced Data Structures',
    title: '17.3 Graph Representation',
    subtitle: 'Adjacency matrix vs adjacency list',
    keyTerms: [
      { name: 'Adjacency matrix', def: 'n×n grid; cell [i,j] = weight if edge exists.' },
      { name: 'Adjacency list', def: 'Array of lists; each list holds neighbours of that vertex.' },
      { name: 'Directed graph', def: 'Edges have direction.' },
      { name: 'Weighted graph', def: 'Edges carry numerical values.' },
    ],
    theory: `<p><strong>Matrix:</strong> O(1) edge lookup; O(V²) space — good for dense graphs.</p><p><strong>List:</strong> O(V+E) space — efficient for sparse graphs; iteration over neighbours faster.</p>`,
    example: `<p>Graph A-B(3), A-C(1), B-D(5).<br><strong>Matrix (3×3):</strong> [0,3,1; 3,0,0; 1,0,0]. D added: 4×4 matrix.<br><strong>List:</strong> A:[B(3),C(1)], B:[A(3),D(5)], C:[A(1)], D:[B(5)].</p>`,
    questions: [
      { stem: 'State one advantage of adjacency list over adjacency matrix.', marks: 1, ms: 'Uses O(V+E) space instead of O(V²) — more efficient for sparse graphs [1].' },
      { stem: 'Explain when an adjacency matrix would be preferred over an adjacency list.', marks: 2, ms: 'When the graph is dense (many edges) [1]; when O(1) edge existence lookups are needed frequently [1].' },
    ]
  },
  'ch17-4': {
    chapter: 'Chapter 17 — Advanced Data Structures',
    title: '17.4 Graph Traversals (BFS/DFS)',
    subtitle: 'Systematically visiting every vertex',
    keyTerms: [
      { name: 'BFS', def: 'Breadth-First Search — level by level using a queue.' },
      { name: 'DFS', def: 'Depth-First Search — deep first using a stack or recursion.' },
    ],
    theory: `<p><strong>BFS:</strong> Enqueue start; while not empty: dequeue u, visit unvisited neighbours and enqueue them. Finds shortest unweighted path. O(V+E).</p><p><strong>DFS:</strong> Push start; while not empty: pop u, if unvisited: mark and push neighbours. O(V+E). Used for cycle detection, topological sort.</p>`,
    example: `<p>Graph A-B,A-C,B-D,C-D,D-E from A:<br><strong>BFS:</strong> A→B,C→D→E (levels).<br><strong>DFS:</strong> A→B→D→E→C (depth first).</p>`,
    questions: [
      { stem: 'Explain why BFS is preferred for finding the shortest unweighted path.', marks: 3, ms: 'BFS explores vertices in order of distance from source [1]; first time destination reached is the shortest path [1]; DFS may find longer path first [1].' },
    ]
  },

  // ── Paper 3: Ch 18 — Database Systems ──────────────────────────────────────
  'ch18-1': {
    chapter: 'Chapter 18 — Database Systems',
    title: '18.1 Relational Model and SQL',
    subtitle: 'Tables, keys, and structured queries',
    keyTerms: [
      { name: 'Primary key', def: 'Attribute(s) uniquely identifying each row in a table.' },
      { name: 'Foreign key', def: 'Attribute referencing primary key of another table — enforces referential integrity.' },
      { name: 'JOIN', def: 'Combines rows from two tables on a matching column.' },
      { name: 'Aggregate functions', def: 'COUNT, SUM, AVG, MAX, MIN — operate on groups of rows.' },
    ],
    theory: `<p>The relational model stores data in tables (relations). SQL is the standard language for querying.</p><pre>SELECT col1, col2\nFROM table1\nJOIN table2 ON table1.id = table2.id\nWHERE condition\nGROUP BY col\nHAVING agg_condition\nORDER BY col ASC</pre>`,
    example: `<p>Tables: Student(StudentID, Name, CourseID), Course(CourseID, Title)</p><pre>SELECT Student.Name, Course.Title\nFROM Student\nJOIN Course ON Student.CourseID = Course.CourseID\nWHERE Course.Title = 'Computer Science'\nORDER BY Student.Name ASC</pre>`,
    questions: [
      { stem: 'Write SQL to find the average mark and number of students for subject Computer Science from table Marks(StudentID, Subject, Mark).', marks: 4, ms: "SELECT AVG(Mark), COUNT(StudentID) [1] FROM Marks [1] WHERE Subject = 'Computer Science' [2]." },
    ]
  },
  'ch18-2': {
    chapter: 'Chapter 18 — Database Systems',
    title: '18.2 Normalisation (1NF–3NF)',
    subtitle: 'Eliminating redundancy and update anomalies',
    keyTerms: [
      { name: '1NF', def: 'Atomic values; no repeating groups; primary key defined.' },
      { name: '2NF', def: '1NF + no partial dependency on composite key.' },
      { name: '3NF', def: '2NF + no transitive dependency between non-key attributes.' },
    ],
    theory: `<p><strong>1NF:</strong> Each cell atomic, no repeating groups.<br><strong>2NF:</strong> All non-key attributes depend on the <em>whole</em> composite key.<br><strong>3NF:</strong> Non-key attributes depend only on the primary key, not on each other (no transitive dependency).</p>`,
    example: `<p><strong>3NF violation:</strong> Order(OrderID, CustomerID, CustomerCity). CustomerCity depends on CustomerID, not OrderID → transitive dependency.<br><strong>Fix:</strong> Order(OrderID, CustomerID) + Customer(CustomerID, CustomerCity).</p>`,
    questions: [
      { stem: 'Table: Enrolment(StudentID, CourseID, CourseName, Grade). Which normal form is violated? Explain.', marks: 4, ms: 'Violates 2NF [1]; CourseName depends on CourseID alone [1], not the full composite key (StudentID, CourseID) [1]; this is a partial dependency [1].' },
    ]
  },
  'ch18-3': {
    chapter: 'Chapter 18 — Database Systems',
    title: '18.3 ACID and Transactions',
    subtitle: 'Guaranteeing reliability in concurrent databases',
    keyTerms: [
      { name: 'Atomicity', def: 'All operations succeed or all roll back.' },
      { name: 'Consistency', def: 'Transaction moves DB from one valid state to another.' },
      { name: 'Isolation', def: 'Concurrent transactions do not interfere.' },
      { name: 'Durability', def: 'Committed changes persist after failure.' },
    ],
    theory: `<p>ACID ensures reliable transactions. Atomicity prevents partial updates. Isolation uses record locking. Durability uses write-ahead logs.</p><p><strong>Deadlock in DB:</strong> T1 locks Row A, waits for Row B. T2 locks Row B, waits for Row A → resolved by timeout or lock ordering.</p>`,
    example: `<pre>BEGIN TRANSACTION\n  UPDATE Accounts SET balance = balance - 100 WHERE id = 'A'\n  UPDATE Accounts SET balance = balance + 100 WHERE id = 'B'\nCOMMIT</pre><p>If crash between statements: atomicity rolls back the debit.</p>`,
    questions: [
      { stem: 'Explain how atomicity prevents data corruption in a bank transfer.', marks: 3, ms: 'Transaction treated as indivisible unit [1]; if any operation fails all changes rolled back [1]; prevents money being debited but not credited [1].' },
    ]
  },
  'ch18-4': {
    chapter: 'Chapter 18 — Database Systems',
    title: '18.4 Entity-Relationship Diagrams',
    subtitle: 'Modelling entities, attributes, and relationships',
    keyTerms: [
      { name: 'Entity', def: 'Real-world object represented as a table.' },
      { name: 'One-to-many (1:N)', def: 'One entity relates to many instances of another.' },
      { name: 'Many-to-many (M:N)', def: 'Resolved by a junction/linking table.' },
    ],
    theory: `<p>ER diagrams show entities and relationships with cardinality (1:1, 1:N, M:N). M:N relationships require a junction table with foreign keys from both sides.</p>`,
    example: `<p>Student ─── enrolls in ──&lt; Course (M:N).<br>Resolved: Enrolment(StudentID [FK], CourseID [FK], Grade).</p>`,
    questions: [
      { stem: 'Explain why M:N relationships cannot be directly implemented and how to resolve them.', marks: 4, ms: 'Cannot store multiple FK values in one field — violates 1NF [1]; M:N requires a junction table [1]; junction holds FK from both entities [1]; composite PK of the junction ensures uniqueness [1].' },
    ]
  },

  // ── Paper 3: Ch 19 — Processor Management ─────────────────────────────────
  'ch19-1': {
    chapter: 'Chapter 19 — Processor Management',
    title: '19.1 Process Scheduling',
    subtitle: 'OS algorithms for sharing CPU time',
    keyTerms: [
      { name: 'Round-robin', def: 'Each process gets equal CPU time slices in rotation.' },
      { name: 'SJF', def: 'Shortest Job First — minimum average wait, but can starve long jobs.' },
      { name: 'FCFS', def: 'First-Come First-Served — simple but poor for short jobs behind long ones.' },
      { name: 'Starvation', def: 'Low-priority processes never get CPU time.' },
    ],
    theory: `<p><strong>Round-robin:</strong> Each process runs for one quantum (e.g. 20ms) before context switch. Fair; good for interactive systems.<br><strong>SJF:</strong> Optimal average wait but requires knowing burst length; starves long processes.<br><strong>FCFS:</strong> Simple; convoy effect — short jobs wait behind long ones.</p>`,
    example: `<p>P1(10ms), P2(4ms), P3(2ms) at t=0.<br><strong>FCFS avg wait:</strong> (0+10+14)/3 = 8ms<br><strong>SJF avg wait:</strong> P3→P2→P1: (0+2+6)/3 = 2.67ms</p>`,
    questions: [
      { stem: 'Compare round-robin and SJF scheduling for fairness and average wait time.', marks: 4, ms: 'Round-robin: fair, all get equal time [1]; average wait can be high for short jobs behind long ones [1]. SJF: minimises average wait [1]; unfair — long processes may starve [1].' },
    ]
  },
  'ch19-2': {
    chapter: 'Chapter 19 — Processor Management',
    title: '19.2 Deadlock',
    subtitle: 'Circular resource waiting and prevention strategies',
    keyTerms: [
      { name: 'Deadlock', def: 'Processes each wait for resources held by others — none can proceed.' },
      { name: 'Coffman conditions', def: 'Four necessary conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.' },
      { name: "Banker's algorithm", def: 'Deadlock avoidance: only grant request if safe state maintained.' },
    ],
    theory: `<p>Deadlock requires ALL four Coffman conditions simultaneously. <strong>Prevention:</strong> eliminate one condition (e.g. require all locks acquired at once eliminates hold-and-wait). <strong>Avoidance:</strong> Banker's algorithm. <strong>Detection + Recovery:</strong> find cycle in resource graph; kill/rollback a process.</p>`,
    example: `<p>P1 holds Lock A, waits for Lock B. P2 holds Lock B, waits for Lock A → deadlock.<br><strong>Prevention:</strong> require alphabetical lock ordering → P2 must acquire A before B → no circular wait.</p>`,
    questions: [
      { stem: 'State the four Coffman conditions and explain how eliminating one prevents deadlock.', marks: 4, ms: 'Mutual exclusion, hold and wait, no preemption, circular wait [2]. Eliminating any one breaks the deadlock cycle; e.g. disallowing hold-and-wait means process requests all resources at once [2].' },
    ]
  },
  'ch19-3': {
    chapter: 'Chapter 19 — Processor Management',
    title: '19.3 Virtual Memory and Paging',
    subtitle: 'Extending RAM using disk-based page swapping',
    keyTerms: [
      { name: 'Virtual memory', def: 'Disk space used as extension of RAM.' },
      { name: 'Page', def: 'Fixed-size block of virtual address space.' },
      { name: 'Frame', def: 'Fixed-size block of physical RAM.' },
      { name: 'Page fault', def: 'Accessing a page not currently in RAM.' },
      { name: 'Thrashing', def: 'System spends more time paging than executing.' },
    ],
    theory: `<p>Virtual memory divides address space into pages; RAM into frames. The page table maps virtual pages to physical frames. On a page fault, OS loads the required page from disk (evicting another page using LRU or FIFO).</p><p><strong>Thrashing:</strong> occurs when working set exceeds available frames — fix by reducing multiprogramming or adding RAM.</p>`,
    example: `<p>3 frames, access sequence 1,2,3,4,1,2,5: with FIFO eviction → 7 page faults. With LRU → fewer faults.</p>`,
    questions: [
      { stem: 'Explain what a page fault is and the steps the OS takes to handle it.', marks: 4, ms: 'Page fault: process accesses virtual page not in RAM [1]; OS suspends process [1]; loads page from disk into a free/evicted frame [1]; updates page table and resumes process [1].' },
    ]
  },

  // ── Paper 3: Ch 20 — AI and Expert Systems ─────────────────────────────────
  'ch20-1': {
    chapter: 'Chapter 20 — AI and Expert Systems',
    title: '20.1 Knowledge Representation',
    subtitle: 'Encoding expert knowledge for machine reasoning',
    keyTerms: [
      { name: 'Knowledge base', def: 'Collection of facts and IF-THEN rules in an expert system.' },
      { name: 'Production rules', def: 'IF condition THEN action statements encoding expert heuristics.' },
      { name: 'Semantic network', def: 'Graph of concepts connected by labelled relationship edges.' },
    ],
    theory: `<p>Expert systems capture specialist knowledge in a <strong>knowledge base</strong> of facts and rules. An <strong>inference engine</strong> applies rules to reach conclusions. Limitations: knowledge acquisition bottleneck; cannot learn; struggle with uncertainty.</p>`,
    example: `<pre>IF fever = TRUE AND rash = TRUE\n   THEN disease = "measles" [confidence 0.8]\nIF disease = "measles"\n   THEN treatment = "rest and fluids"</pre>`,
    questions: [
      { stem: 'Describe two limitations of rule-based expert systems.', marks: 4, ms: 'Knowledge acquisition is slow and difficult [1]; experts struggle to articulate all knowledge [1]; cannot learn from new cases without manual updates [1]; poor handling of uncertainty [1]. (Any 2 × 2)' },
    ]
  },
  'ch20-2': {
    chapter: 'Chapter 20 — AI and Expert Systems',
    title: '20.2 Inference Engines',
    subtitle: 'Forward chaining and backward chaining',
    keyTerms: [
      { name: 'Forward chaining', def: 'Data-driven: start from facts, apply rules, derive conclusions.' },
      { name: 'Backward chaining', def: 'Goal-driven: start from goal, find supporting facts by working backwards.' },
    ],
    theory: `<p><strong>Forward:</strong> Apply all matching rules to current facts, add new facts, repeat. Used when all data available — monitoring/alerting systems.</p><p><strong>Backward:</strong> Set a goal; find rules whose conclusion matches; make conditions sub-goals; recurse. Used for diagnosis — confirming a specific hypothesis.</p>`,
    example: `<p>Rules: fever→ill, ill+cough→flu. Facts: {fever, cough}.<br><strong>Forward:</strong> fever→ill, ill+cough→flu. <strong>Backward (goal=flu):</strong> need ill+cough → need fever → check: ✓ all found.</p>`,
    questions: [
      { stem: 'Compare forward and backward chaining with a suitable scenario for each.', marks: 4, ms: 'Forward: data-driven, derives conclusions from known facts [1]; good for monitoring where all inputs known [1]. Backward: goal-driven, finds supporting facts [1]; good for diagnosis to confirm/refute specific hypothesis [1].' },
    ]
  },
  'ch20-3': {
    chapter: 'Chapter 20 — AI and Expert Systems',
    title: '20.3 Machine Learning Concepts',
    subtitle: 'Systems that learn patterns from data',
    keyTerms: [
      { name: 'Supervised learning', def: 'Model trained on labelled input-output pairs.' },
      { name: 'Unsupervised learning', def: 'Model finds patterns in unlabelled data.' },
      { name: 'Neural network', def: 'Layered connected nodes; weights adjusted during training.' },
      { name: 'Overfitting', def: 'Model fits training data too closely; fails to generalise.' },
    ],
    theory: `<p><strong>Types:</strong> Supervised (classification, regression), Unsupervised (clustering), Reinforcement (reward/penalty).</p><p><strong>Neural networks:</strong> Input → Hidden layers → Output. Trained via backpropagation adjusting weights to minimise error.</p><p><strong>Overfitting prevention:</strong> validation set, regularisation, simpler model, more data.</p>`,
    example: `<p>Spam filter trained on 10,000 emails: 95% training accuracy but 80% on new emails → overfitting. Solution: increase training data size, use cross-validation.</p>`,
    questions: [
      { stem: 'Explain the difference between supervised and unsupervised learning with an example of each.', marks: 4, ms: 'Supervised: trained on labelled data [1]; example: image classification with cat/dog labels [1]. Unsupervised: finds patterns in unlabelled data [1]; example: customer clustering by purchase behaviour [1].' },
    ]
  },
}
"""

with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', encoding='utf-8') as f:
    content = f.read()

start_marker = 'const TOPICS = {'
end_marker = '\n\n// ── Sidebar chapter toggle'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print('ERROR: markers not found. start=%d end=%d' % (start_idx, end_idx))
    import re
    sidebar_hits = [(m.start(), content[m.start():m.start()+50]) for m in re.finditer(r'Sidebar chapter', content)]
    print('Sidebar hits:', sidebar_hits)
else:
    new_content = content[:start_idx] + new_topics + content[end_idx:]
    with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Done! Lines:', len(new_content.splitlines()))
