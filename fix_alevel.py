
import re

with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', encoding='utf-8') as f:
    content = f.read()

# 1. Replace CHAPTER_TOPICS
old_ct = """const CHAPTER_TOPICS = {
   1: ['ch1-1','ch1-2','ch1-3','ch1-4','ch1-5','ch1-6','ch1-7'],
   2: ['ch2-1','ch2-2'],
   3: ['ch3-1','ch3-2','ch3-3'],
   4: ['ch4-1','ch4-2','ch4-3'],
   5: ['ch5-1','ch5-2','ch5-3'],
   6: ['ch6-1','ch6-2'],
   7: ['ch7-1','ch7-2','ch7-3'],
   8: ['ch8-1','ch8-2','ch8-3'],
   9: ['ch9-1','ch9-2','ch9-3'],
  10: ['ch10-1','ch10-2'],
  11: ['ch11-1','ch11-2','ch11-3','ch11-4','ch11-5','ch11-6'],
  12: ['ch12-1','ch12-2','ch12-3','ch12-4'],
  13: ['ch13-1','ch13-2','ch13-3','ch13-4'],
  14: ['ch14-1','ch14-2','ch14-3'],
  15: ['ch15-1','ch15-2','ch15-3','ch15-4'],
}"""

new_ct = """const CHAPTER_TOPICS = {
  // Paper 3
  16: ['ch16-1','ch16-2','ch16-3','ch16-4','ch16-5'],
  17: ['ch17-1','ch17-2','ch17-3','ch17-4'],
  18: ['ch18-1','ch18-2','ch18-3','ch18-4'],
  19: ['ch19-1','ch19-2','ch19-3'],
  20: ['ch20-1','ch20-2','ch20-3'],
  // Paper 4
  21: ['ch21-1','ch21-2','ch21-3','ch21-4'],
  22: ['ch22-1','ch22-2','ch22-3','ch22-4'],
  23: ['ch23-1','ch23-2','ch23-3'],
  24: ['ch24-1','ch24-2','ch24-3'],
  25: ['ch25-1','ch25-2','ch25-3','ch25-4'],
}"""

content = content.replace(old_ct, new_ct, 1)

# 2. Replace localStorage keys (bf-as-p1- → bf-al-p3-)
content = content.replace("'bf-as-p1-'", "'bf-al-p3-'")

# 3. Replace LessonSaves namespaces
content = content.replace("LessonSaves.load('as-paper2')", "LessonSaves.load('al-paper4')")
content = content.replace("LessonSaves.save('as-paper2'", "LessonSaves.save('al-paper4'")
content = content.replace("LessonSaves.get('as-paper1'", "LessonSaves.get('al-paper3'")
content = content.replace("LessonSaves.save('as-paper1'", "LessonSaves.save('al-paper3'")
content = content.replace("fetchClassId().then(() => checkApprovedExams())", "fetchClassId().then(() => checkApprovedExams())")

# 4. Fix loadTopic init call
content = content.replace("loadTopic('ch1-1')", "loadTopic('ch16-1')")

# 5. Fix init chapter loop range (was 1..15, now 16..25)
content = content.replace("for (let ch = 1; ch <= 15; ch++)", "for (let ch = 16; ch <= 25; ch++)")

# 6. Fix checkApprovedExams loop (was 1..10 for P1, now 16..20 for P3)
content = content.replace(
    "Array.from({ length: 10 }, (_, i) => i + 1).map(async (ch) => {",
    "Array.from({ length: 5 }, (_, i) => i + 16).map(async (ch) => {"
)

# 7. Fix getChapterNum — it already works for any ch prefix (ch16-1 → 16)
# No change needed — parseInt('16') works fine

# 8. Update isP2 check: Paper 4 chapters are 21-25 (not 11+)
content = content.replace(
    "const isP2   = chNum >= 11",
    "const isP2   = chNum >= 21"
)
# Also the mainId check in loadTopic
content = content.replace(
    "document.getElementById(isP2 ? 'p2-topic-content' : 'p1-main-content')",
    "document.getElementById(isP2 ? 'p2-topic-content' : 'p1-main-content')"
)

# 9. Fix the completeTopic isP2 check
content = content.replace(
    "const chNum   = getChapterNum(id)\n  const mainEl  = document.getElementById(chNum >= 11",
    "const chNum   = getChapterNum(id)\n  const mainEl  = document.getElementById(chNum >= 21"
)

# 10. Update p2 LessonSaves key references for paper2-specific saves
content = content.replace("'as-paper2',-1,", "'al-paper4',-1,")

# 11. Replace PAST_PAPERS — keep only relevant A Level past paper questions
old_pp_start = "// ── Past paper questions per topic ─────────────────────────────────────────────\nconst PAST_PAPERS = {"
new_pp = """// ── Past paper questions per topic ─────────────────────────────────────────────
const PAST_PAPERS = {
  'ch16-1': [
    { year:'9618/31/M/J/22', q:'Algorithm A has time complexity O(n²) and Algorithm B has O(n log n). For n=1000, state which is more efficient and justify your answer. [2]',
      ms:'Algorithm B is more efficient [1]; O(n log n) grows much more slowly than O(n²) for large n: 1000×10=10,000 vs 1,000,000 [1].' },
  ],
  'ch16-2': [
    { year:'9618/32/O/N/21', q:"Dijkstra's algorithm is used to find the shortest path from vertex S to all other vertices in a weighted graph. Explain why the algorithm cannot be used if some edge weights are negative. [2]",
      ms:"Dijkstra's assumes once a vertex is marked visited its shortest distance is final [1]; a negative edge discovered later could provide a shorter path to an already-visited vertex, giving incorrect results [1]." },
  ],
  'ch17-1': [
    { year:'9618/33/M/J/23', q:'(a) Explain what is meant by a collision in a hash table. [1]\n(b) Describe how chaining resolves collisions. [2]',
      ms:'(a) Two keys hash to the same index [1]. (b) Each slot holds a linked list [1]; colliding items added to the list at that slot [1].' },
  ],
  'ch18-1': [
    { year:'9618/31/O/N/22', q:'Write an SQL query to find all students with a mark greater than 70 from table Results(StudentID, Name, Mark, Subject). [3]',
      ms:"SELECT StudentID, Name, Mark, Subject [1] FROM Results [1] WHERE Mark > 70 [1]." },
  ],
  'ch18-2': [
    { year:'9618/32/M/J/21', q:'A table has the following structure: Booking(BookingID, HotelID, HotelName, GuestID, GuestName, Date). (a) State the normal form violated. [1] (b) Identify one functional dependency causing the violation. [2]',
      ms:'(a) Third Normal Form (3NF) violated [1]. (b) HotelName depends on HotelID (not BookingID) [1] — transitive dependency through non-key attribute [1].' },
  ],
  'ch19-2': [
    { year:'9618/33/O/N/23', q:'State the four conditions necessary for deadlock to occur. [4]',
      ms:'Mutual exclusion [1]; hold and wait [1]; no preemption [1]; circular wait [1].' },
  ],
}"""

idx = content.find(old_pp_start)
if idx == -1:
    print('PAST_PAPERS marker not found!')
else:
    # Find the end of PAST_PAPERS
    end_pp = content.find('\n\n// ', idx + 100)
    if end_pp == -1:
        print('PAST_PAPERS end not found')
    else:
        content = content[:idx] + new_pp + content[end_pp:]
        print('PAST_PAPERS replaced')

# 12. Replace practice exercises title in AI generate prompt
content = content.replace(
    "Cambridge AS Level pseudocode (9618 syntax) practice exercise",
    "Cambridge A Level pseudocode (9618 Paper 4 syntax) practice exercise"
)

# 13. Update the editor header badge label
content = content.replace("AS/A Level Pseudocode\n          <span class=\"badge-p2\">Paper 2</span>",
                           "A Level — Advanced Pseudocode\n          <span class=\"badge-p2\">Paper 4</span>")

with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('All fixes applied. Lines:', len(content.splitlines()))
