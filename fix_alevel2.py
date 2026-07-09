
with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', encoding='utf-8') as f:
    content = f.read()

# --- Replace PRACTICE_EXERCISES with A Level exercises ---
old_prac_start = "const PRACTICE_EXERCISES = ["
old_prac_end   = "\n]\n\n// ── Practice state"

start_idx = content.find(old_prac_start)
end_idx   = content.find(old_prac_end, start_idx)

new_exercises = """const PRACTICE_EXERCISES = [
  // ── Easy ──────────────────────────────────────────────────────────────────
  { id:'a01', title:'Big-O of a Loop', topic:'Algorithm Analysis', difficulty:'Easy',
    desc:'Write pseudocode for a loop from 1 to n that outputs each value. State its Big-O time complexity in a comment.',
    starter:'// Write your loop and state the Big-O\nDECLARE i : INTEGER\nFOR i ← 1 TO n\n  OUTPUT i\nNEXT i\n// Time complexity: O(?)',
    expected:'O(n) — linear' },

  { id:'a02', title:'Hash Index Calculation', topic:'Hash Tables', difficulty:'Easy',
    desc:'Calculate hash indices for keys 25, 36, 47 using hash(k) = k MOD 7. Output each key and its index.',
    starter:'DECLARE key : INTEGER\nFOR key IN [25, 36, 47]\n  OUTPUT key & " → " & (key MOD 7)\nNEXT',
    expected:'25→4, 36→1, 47→5' },

  { id:'a03', title:'Max-Heap Check', topic:'Heaps', difficulty:'Easy',
    desc:'Given array [90,80,70,50,60,30], verify it satisfies the max-heap property. Output "Valid heap" or "Not a heap".',
    starter:'// Parent(i) = i DIV 2; check all parent >= child\nDECLARE heap : ARRAY[1:6] OF INTEGER\nheap[1]←90:heap[2]←80:heap[3]←70\nheap[4]←50:heap[5]←60:heap[6]←30\n// Check parent >= both children for each node',
    expected:'Valid heap' },

  { id:'a04', title:'SQL SELECT', topic:'Databases', difficulty:'Easy',
    desc:'Write an SQL query to retrieve all columns from table Students where Grade = "A".',
    starter:'-- Write your SQL here\nSELECT ...',
    expected:"SELECT * FROM Students WHERE Grade = 'A'" },

  { id:'a05', title:'Functional Dependency', topic:'Normalisation', difficulty:'Easy',
    desc:'Table: Employee(EmpID, DeptID, DeptName, Salary). State which attribute determines DeptName and name the normal form violated.',
    starter:'// Output the functional dependency and normal form violated\nOUTPUT "DeptName is determined by: ?"\nOUTPUT "Normal form violated: ?"',
    expected:'DeptName determined by DeptID; violates 3NF (transitive dependency)' },

  { id:'a06', title:'Deadlock Conditions', topic:'OS / Deadlock', difficulty:'Easy',
    desc:'Output all four Coffman conditions required for deadlock to occur.',
    starter:'OUTPUT "Condition 1: "\nOUTPUT "Condition 2: "\nOUTPUT "Condition 3: "\nOUTPUT "Condition 4: "',
    expected:'Mutual exclusion, Hold and wait, No preemption, Circular wait' },

  { id:'a07', title:'Forward Chaining', topic:'AI / Expert Systems', difficulty:'Easy',
    desc:'Rules: R1: fever→ill; R2: ill AND cough→flu. Facts: {fever, cough}. Simulate forward chaining and output each derived fact.',
    starter:'// Apply rules in order, output newly derived facts\nDECLARE fever, cough, ill, flu : BOOLEAN\nfever ← TRUE\ncough ← TRUE\n// Apply R1 then R2',
    expected:'Apply R1: ill=TRUE. Apply R2: flu=TRUE.' },

  { id:'a08', title:'Binary Heap Insert', topic:'Heaps', difficulty:'Easy',
    desc:'Min-heap: [10,20,30,40]. Insert 5. Show the array after sift-up.',
    starter:'// Append 5 then sift-up\nDECLARE heap : ARRAY[1:5] OF INTEGER\nheap[1]←10:heap[2]←20:heap[3]←30:heap[4]←40\n// Append 5 at position 5\n// Sift-up: compare with parent until heap satisfied',
    expected:'[5,10,30,40,20]' },

  { id:'a09', title:'Graph Adjacency', topic:'Graphs', difficulty:'Easy',
    desc:'Graph with vertices A,B,C,D and edges A-B(2),A-C(5),B-D(3). Output the adjacency list for vertex B.',
    starter:'// Output all neighbours of B with weights\nOUTPUT "B → [A(2), D(3)]"',
    expected:'B → A(2), D(3)' },

  { id:'a10', title:'Page Fault Count', topic:'Virtual Memory', difficulty:'Easy',
    desc:'With 3 frames and FIFO replacement, count page faults for access sequence: 1,2,3,4,1,2,5,1,2,3,4,5.',
    starter:'// Simulate FIFO with 3 frames\n// Track contents after each access\n// Count total faults',
    expected:'7 page faults' },

  // ── Medium ────────────────────────────────────────────────────────────────
  { id:'a11', title:"Dijkstra's Shortest Path", topic:'Graph Algorithms', difficulty:'Medium',
    desc:"Run Dijkstra's from vertex A on: A→B(4), A→C(1), C→B(2), B→D(1), C→D(5). Output shortest distance to each vertex.",
    starter:'// Implement Dijkstra trace\nDECLARE distB, distC, distD : INTEGER\ndistB ← 999 : distC ← 999 : distD ← 999\n// Process A first (cost 0), update neighbours\n// Continue with lowest unvisited',
    expected:'A=0, C=1, B=3, D=4' },

  { id:'a12', title:'Hash Table with Chaining', topic:'Hash Tables', difficulty:'Medium',
    desc:'Table size 5. Insert keys 12, 7, 22, 17, 3. Use hash(k) = k MOD 5. Show final table with chains.',
    starter:'// hash(k) = k MOD 5\n// Insert each key, handle collisions with chaining\nDECLARE keys : ARRAY[1:5] OF INTEGER\nkeys[1]←12:keys[2]←7:keys[3]←22:keys[4]←17:keys[5]←3\n// Output slot → [chain]',
    expected:'Slot 0:[],  Slot 1:[],  Slot 2:[12,22,17],  Slot 3:[7,3],  Slot 4:[]  (approx)' },

  { id:'a13', title:'Merge Sort', topic:'Sorting', difficulty:'Medium',
    desc:'Write a recursive PROCEDURE MergeSort(arr, left, right) for the array [38,27,43,3,9,82,10]. Trace the first three splits.',
    starter:'// Trace splits only\nOUTPUT "[38,27,43,3,9,82,10]"\nOUTPUT "Split → [38,27,43] and [3,9,82,10]"\nOUTPUT "Split → [38] and [27,43]"\n// Continue merge phase',
    expected:'Sorted: [3,9,10,27,38,43,82]' },

  { id:'a14', title:'BFS Traversal', topic:'Graph Traversals', difficulty:'Medium',
    desc:'Perform BFS from vertex A on graph A-B,A-C,B-D,C-D,D-E. Output visit order.',
    starter:'DECLARE queue : ARRAY[1:10] OF STRING\nDECLARE front, rear : INTEGER\nfront ← 1 : rear ← 0\n// Enqueue A, then BFS\n// Output each visited vertex',
    expected:'A B C D E' },

  { id:'a15', title:'SQL JOIN Query', topic:'Databases', difficulty:'Medium',
    desc:'Tables: Student(SID,Name,CourseID), Course(CourseID,Title). Write SQL to show each student name with their course title.',
    starter:'-- Write your JOIN query\nSELECT ...',
    expected:'SELECT Student.Name, Course.Title FROM Student JOIN Course ON Student.CourseID = Course.CourseID' },

  { id:'a16', title:'Normalise to 3NF', topic:'Normalisation', difficulty:'Medium',
    desc:'Table: Order(OrderID, CustomerID, CustomerName, ProductID, ProductName, Qty). Decompose to 3NF. Output the resulting table schemas.',
    starter:'// Output each 3NF table schema\nOUTPUT "Table 1: Order(OrderID, CustomerID, ProductID, Qty)"\nOUTPUT "Table 2: Customer(CustomerID, CustomerName)"\nOUTPUT "Table 3: Product(ProductID, ProductName)"',
    expected:'3 tables: Order, Customer, Product with foreign key links' },

  { id:'a17', title:'OOP — Abstract Class', topic:'OOP', difficulty:'Medium',
    desc:'Define abstract class Shape with abstract method Area(). Create Rectangle and Circle subclasses. Output areas for 5×3 rectangle and radius-4 circle.',
    starter:'CLASS Shape\n  PUBLIC FUNCTION Area() RETURNS REAL\n    RETURN 0  // abstract — override in subclasses\n  ENDFUNCTION\nENDCLASS\n\nCLASS Rectangle INHERITS Shape\n  PRIVATE w, h : REAL\n  PUBLIC PROCEDURE NEW(width, height : REAL)\n    w ← width : h ← height\n  ENDPROCEDURE\n  PUBLIC FUNCTION Area() RETURNS REAL\n    RETURN w * h\n  ENDFUNCTION\nENDCLASS\n\n// Add Circle class (area = 3.14159 * r * r)\n\nDECLARE r : Rectangle\nr ← NEW Rectangle(5, 3)\nOUTPUT r.Area()',
    expected:'15  |  50.26...' },

  { id:'a18', title:'ACID — Transaction', topic:'Databases', difficulty:'Medium',
    desc:'Write a pseudocode transaction that transfers 200 from Account A to Account B, handling failure atomically.',
    starter:'BEGIN TRANSACTION\n  // Debit A\n  // Credit B\n  // If any step fails, ROLLBACK\nCOMMIT',
    expected:'Both debit and credit occur or neither (atomic)' },

  { id:'a19', title:'Process Scheduling Trace', topic:'OS Scheduling', difficulty:'Medium',
    desc:'Three processes P1(6ms), P2(2ms), P3(8ms) arrive at t=0. Calculate average wait time for FCFS and SJF.',
    starter:'// FCFS: P1→P2→P3\n// SJF: P2→P1→P3\n// Wait time = start time - arrival time\nDECLARE fcfs_avg, sjf_avg : REAL\n// Calculate both',
    expected:'FCFS avg wait: (0+6+8)/3 = 4.67ms  |  SJF avg wait: (0+2+8)/3 = 3.33ms' },

  { id:'a20', title:'DFS Recursion', topic:'Graph Traversals', difficulty:'Medium',
    desc:'Write a recursive PROCEDURE DFS(vertex, visited[]) that traverses graph A-B,A-C,B-D starting from A. Output visit order.',
    starter:'DECLARE visited : ARRAY[1:4] OF BOOLEAN\n// Adjacency: A:[B,C], B:[A,D], C:[A], D:[B]\n\nPROCEDURE DFS(v : STRING)\n  OUTPUT v\n  // Mark v visited\n  // For each unvisited neighbour of v: DFS(neighbour)\nENDPROCEDURE\n\nDFS("A")',
    expected:'A B D C  (or similar DFS order)' },

  // ── Hard ──────────────────────────────────────────────────────────────────
  { id:'a21', title:'Quicksort', topic:'Sorting', difficulty:'Hard',
    desc:'Implement quicksort with the last element as pivot on [10,7,8,9,1,5]. Output the array after each partition step.',
    starter:'PROCEDURE QuickSort(arr : ARRAY OF INTEGER, low, high : INTEGER)\n  IF low < high THEN\n    // Partition: move elements < pivot left, > pivot right\n    // Recursively sort left and right sub-arrays\n  ENDIF\nENDPROCEDURE\n\nDECLARE a : ARRAY[1:6] OF INTEGER\na[1]←10:a[2]←7:a[3]←8:a[4]←9:a[5]←1:a[6]←5',
    expected:'Sorted: [1,5,7,8,9,10]' },

  { id:'a22', title:'Hash Table Open Addressing', topic:'Hash Tables', difficulty:'Hard',
    desc:'Implement a hash table of size 7 using linear probing. Insert 50,700,76,85,92,73,101. Show final table and number of probes.',
    starter:'DECLARE table : ARRAY[0:6] OF INTEGER\nDECLARE probes : INTEGER\nprobes ← 0\n// Initialise table to -1\n// For each key: hash = key MOD 7\n// If slot taken: probe (hash+1) MOD 7, etc.',
    expected:'Table filled with ≤2 probes per key on average' },

  { id:'a23', title:'Dijkstra Full Trace', topic:'Graph Algorithms', difficulty:'Hard',
    desc:"Fully trace Dijkstra's on: A→B(7),A→C(9),A→F(14),B→C(10),B→D(15),C→D(11),C→F(2),D→E(6),E→F(9). Find shortest path A to E.",
    starter:'// Use distance table: A=0, all others=∞\n// Process vertices in order of distance\n// Show dist array after each step',
    expected:'Shortest A to E = 26 via A→C→D→E' },

  { id:'a24', title:'Design Patterns — Singleton', topic:'OOP Design Patterns', difficulty:'Hard',
    desc:'Implement the Singleton pattern: a CLASS DatabaseConnection that can only be instantiated once. Return the same instance on subsequent calls.',
    starter:'CLASS DatabaseConnection\n  PRIVATE STATIC instance : DatabaseConnection\n  PRIVATE url : STRING\n\n  PRIVATE PROCEDURE NEW(dbUrl : STRING)\n    url ← dbUrl\n  ENDPROCEDURE\n\n  PUBLIC STATIC FUNCTION GetInstance(dbUrl : STRING) RETURNS DatabaseConnection\n    IF instance = NULL THEN\n      instance ← NEW DatabaseConnection(dbUrl)\n    ENDIF\n    RETURN instance\n  ENDFUNCTION\nENDCLASS\n\nDECLARE db1, db2 : DatabaseConnection\ndb1 ← DatabaseConnection.GetInstance("db://server")\ndb2 ← DatabaseConnection.GetInstance("db://server")\n// Output whether db1 and db2 are the same instance',
    expected:'db1 and db2 are the same instance (Singleton)' },

  { id:'a25', title:'Backward Chaining Trace', topic:'AI Inference', difficulty:'Hard',
    desc:'Rules: R1:A∧B→C; R2:D→A; R3:E→B. Facts:{D,E}. Goal:C. Trace backward chaining, showing sub-goals at each step.',
    starter:'// Goal: C\n// To prove C: need A and B (from R1)\n// To prove A: need D (from R2) → D in facts ✓\n// To prove B: need E (from R3) → E in facts ✓\n// Goal proved\nOUTPUT "Step 1: Goal C requires A AND B"\nOUTPUT "Step 2: Goal A requires D — D in facts ✓"\nOUTPUT "Step 3: Goal B requires E — E in facts ✓"\nOUTPUT "Goal C PROVED"',
    expected:'C is proved via D→A and E→B' },

  { id:'a26', title:'LRU Page Replacement', topic:'Virtual Memory', difficulty:'Hard',
    desc:'Simulate LRU page replacement with 4 frames for sequence: 1,2,3,4,1,2,5,1,2,3,4,5. Count page faults.',
    starter:'DECLARE frames : ARRAY[1:4] OF INTEGER\nDECLARE faults : INTEGER\nfaults ← 0\n// For each page access:\n// If in frames → hit\n// Else: fault, evict LRU page, load new page',
    expected:'8 page faults' },

  { id:'a27', title:'SQL Advanced Query', topic:'Databases', difficulty:'Hard',
    desc:'Tables: Orders(OID,CID,Amount), Customers(CID,Name). Write SQL to find customers with total orders > 1000, sorted by total descending.',
    starter:'-- GROUP BY with HAVING\nSELECT ...',
    expected:'SELECT C.Name, SUM(O.Amount) AS Total FROM Orders O JOIN Customers C ON O.CID=C.CID GROUP BY C.Name HAVING SUM(O.Amount)>1000 ORDER BY Total DESC' },

  { id:'a28', title:'OOP — Strategy Pattern', topic:'OOP Design Patterns', difficulty:'Hard',
    desc:'Implement the Strategy pattern: a SortContext class that can switch between BubbleSort and InsertionSort strategies at runtime.',
    starter:'// Define interface/abstract class SortStrategy\n// Implement BubbleSort and InsertionSort as strategies\n// SortContext holds a strategy and can switch it\nCLASS SortContext\n  PRIVATE strategy : SortStrategy\n  PUBLIC PROCEDURE SetStrategy(s : SortStrategy)\n    strategy ← s\n  ENDPROCEDURE\n  PUBLIC PROCEDURE Sort(arr : ARRAY OF INTEGER)\n    strategy.Sort(arr)\n  ENDPROCEDURE\nENDCLASS',
    expected:'SortContext.Sort() delegates to whichever strategy is set' },

  { id:'a29', title:'Deadlock Detection', topic:'OS / Deadlock', difficulty:'Hard',
    desc:'Given resource allocation graph: P1 holds R1, waits R2. P2 holds R2, waits R1. P3 holds R3, waits R1. Detect deadlock and identify which processes are deadlocked.',
    starter:'// Model as: P1→R2→P2→R1→P1 (cycle!)\n// P3 waits for R1 but R1 held by P1 (which is in cycle)\nOUTPUT "Cycle detected: P1 → R2 → P2 → R1 → P1"\nOUTPUT "Deadlocked processes: P1, P2"\nOUTPUT "P3 blocked but not in cycle"',
    expected:'P1 and P2 are deadlocked; P3 is blocked waiting' },

  { id:'a30', title:'Neural Network Concepts', topic:'Machine Learning', difficulty:'Hard',
    desc:'Describe in pseudocode/comments the forward pass of a 2-layer neural network with input [x1,x2], hidden layer (2 nodes), and one output node.',
    starter:'// Input layer: x1, x2\n// Hidden layer: h1 = sigmoid(w11*x1 + w12*x2 + b1)\n//               h2 = sigmoid(w21*x1 + w22*x2 + b2)\n// Output:       y  = sigmoid(w1*h1 + w2*h2 + b3)\n// Sigmoid(z) = 1 / (1 + e^(-z))\n\nFUNCTION Sigmoid(z : REAL) RETURNS REAL\n  RETURN 1 / (1 + 2.718^(-z))\nENDFUNCTION\n\n// Define weights and compute y for x1=0.5, x2=0.8',
    expected:'y = sigmoid(weighted combination of hidden nodes)' },
]"""

if start_idx == -1:
    print('PRACTICE_EXERCISES not found!')
else:
    end_idx_actual = content.find(old_prac_end, start_idx)
    if end_idx_actual == -1:
        print('End marker not found')
    else:
        content = content[:start_idx] + new_exercises + content[end_idx_actual:]
        print('PRACTICE_EXERCISES replaced')

# Fix checkApprovedExams to also cover P4 chapters 21-25
old_check = "Array.from({ length: 5 }, (_, i) => i + 16).map(async (ch) => {"
new_check = "Array.from({ length: 10 }, (_, i) => i + 16).map(async (ch) => {"
content = content.replace(old_check, new_check, 1)

with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done. Lines:', len(content.splitlines()))
