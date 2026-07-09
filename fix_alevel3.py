
with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', encoding='utf-8') as f:
    content = f.read()

# Fix getInteractiveWidget - no widgets for A Level
content = content.replace(
    """// Returns topic-specific interactive HTML (injected at top of Lesson tab)
function getInteractiveWidget(topicId) {
  if (topicId === 'ch1-1') return buildBinaryWidget()
  if (topicId === 'ch1-2') return buildTwosCompWidget()
  return ''
}""",
    """// Returns topic-specific interactive HTML (injected at top of Lesson tab)
function getInteractiveWidget(topicId) {
  // A Level topics use theory/code focus — no dedicated widgets
  return ''
}"""
)

# Fix widget boot lines that reference ch1-1/ch1-2
content = content.replace(
    "  if (id === 'ch1-1') { _bfBits=[0,0,0,0,0,0,0,0]; _addBitsA=[0,0,0,0,0,0,0,0]; _addBitsB=[0,0,0,0,0,0,0,0]; _bfRender(); _addRender() }\n  if (id === 'ch1-2') { _tcBits=[0,0,0,0,0,0,0,0]; _tcRender() }",
    "  // No binary widgets for A Level"
)

# Fix updateChapterProgress to track ch16 (Paper 3 first chapter, 5 topics)
content = content.replace(
    """function updateChapterProgress() {
  const ch1Total = 7
  const ch1Done = ['ch1-1','ch1-2','ch1-3','ch1-4','ch1-5','ch1-6','ch1-7'].filter(t => visitedTopics.has(t)).length
  const badge = document.getElementById('ch1-prog')
  if (badge) {
    badge.textContent = ch1Done + '/' + ch1Total
    badge.classList.toggle('done', ch1Done === ch1Total)
  }
}""",
    """function updateChapterProgress() {
  // Track progress for each A Level chapter
  const chapterMap = {
    16: { topics: ['ch16-1','ch16-2','ch16-3','ch16-4','ch16-5'] },
    17: { topics: ['ch17-1','ch17-2','ch17-3','ch17-4'] },
    18: { topics: ['ch18-1','ch18-2','ch18-3','ch18-4'] },
    19: { topics: ['ch19-1','ch19-2','ch19-3'] },
    20: { topics: ['ch20-1','ch20-2','ch20-3'] },
    21: { topics: ['ch21-1','ch21-2','ch21-3','ch21-4'] },
    22: { topics: ['ch22-1','ch22-2','ch22-3','ch22-4'] },
    23: { topics: ['ch23-1','ch23-2','ch23-3'] },
    24: { topics: ['ch24-1','ch24-2','ch24-3'] },
    25: { topics: ['ch25-1','ch25-2','ch25-3','ch25-4'] },
  }
  for (const [ch, { topics }] of Object.entries(chapterMap)) {
    const done = topics.filter(t => visitedTopics.has(t)).length
    const badge = document.getElementById('ch' + ch + '-prog')
    if (badge) {
      badge.textContent = done + '/' + topics.length
      badge.classList.toggle('done', done === topics.length)
    }
  }
}"""
)

with open('c:/Users/user/Downloads/ICT website/public/lessons/a-level.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done. Lines:', len(content.splitlines()))
