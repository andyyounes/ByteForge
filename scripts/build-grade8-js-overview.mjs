// Generates ONE single combined Beamer (.tex) presentation covering ALL of
// Grade 8's real JavaScript content, pulled LIVE from public/lessons/grade8.html
// (not hand-summarized) — every real stage's actual `text`, `hints`, and
// `webStarter` code from web5's JS stages (a click handler, a variable the
// click updates) plus the complete ws1-ws5 Web Story unit (arrays/objects,
// functions, localStorage, loop-rendering, the capstone), one slide per stage.
//
// No LaTeX distribution is installed in this environment — this .tex file
// is written but NOT compiled/verified here. Compile with Overleaf (upload
// this file plus latex/grade8/images/) or a local TeX install.
import { writeFileSync, mkdirSync, readFileSync } from 'fs'

const OUT_DIR = 'c:/Users/user/Downloads/ICT website/latex/grade8'
mkdirSync(OUT_DIR, { recursive: true })

// ── Pull the REAL, live module/stage data straight out of grade8.html ──────
const GRADE8_HTML = 'c:/Users/user/Downloads/ICT website/public/lessons/grade8.html'
const html = readFileSync(GRADE8_HTML, 'utf8')
const paletteStart = html.indexOf('const COLOR_PALETTE = {')
const modulesStart = html.indexOf('const MODULES = [')
const modulesEnd = html.indexOf('const STAGE_INDEX')
const ctx = html.slice(paletteStart, modulesStart) + html.slice(modulesStart, modulesEnd)
const { MODULES } = new Function(ctx + '\nreturn { MODULES }')()

const JS_MODULE_IDS = ['web5', 'ws1', 'ws2', 'ws3', 'ws4', 'ws5']
const modules = JS_MODULE_IDS.map(id => {
  const m = MODULES.find(x => x.id === id)
  if (!m) throw new Error('module not found: ' + id)
  return m
})

// ── LaTeX helpers ────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([%$#_{}&])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}
function code(s) { return '\\texttt{' + esc(s) + '}' }

// The live `text`/`hints` strings are small HTML fragments (<strong>,
// <code>, &lt;/&gt;/&amp; entities). Strip/convert them to LaTeX instead of
// hand-retyping every stage's real wording.
function htmlToTex(s) {
  let t = String(s)
  t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  // Pull out <code>/<strong> spans FIRST (their inner content is real source
  // text, e.g. literal "<div id=...>", which must survive as \texttt verbatim
  // rather than being stripped by the generic tag-stripping pass below).
  const protectedParts = []
  t = t.replace(/<code>([\s\S]*?)<\/code>/g, (_, inner) => {
    protectedParts.push(code(inner))
    return '\uE000' + (protectedParts.length - 1) + '\uE001'
  })
  t = t.replace(/<strong>([\s\S]*?)<\/strong>/g, (_, inner) => {
    protectedParts.push('\\textbf{' + esc(inner) + '}')
    return '\uE000' + (protectedParts.length - 1) + '\uE001'
  })
  t = t.replace(/<br\s*\/?>/g, ' ')
  t = t.replace(/<[^>]+>/g, '') // drop any other stray tags (only touches unprotected text now)
  // Escape everything that ISN'T a protected placeholder, then restore placeholders.
  t = t.replace(/\uE000(\d+)\uE001/g, (_, i) => '\uE002' + i + '\uE003') // shield indices from esc()
  t = esc(t).replace(/\uE002(\d+)\uE003/g, (_, i) => protectedParts[Number(i)])
  return t.replace(/\s+/g, ' ').trim()
}

function codeBlockFrame(title, lang, snippet) {
  if (!snippet || !snippet.trim()) return ''
  return String.raw`
\begin{frame}[fragile]{${esc(title)} --- Starter Code}
    \scriptsize
    \begin{verbatim}
${snippet.replace(/\t/g, '  ')}
    \end{verbatim}
\end{frame}
`
}

const ACCENT = 'yellow!45!orange' // JS-branded yellow/orange

const PREAMBLE = String.raw`\documentclass[aspectratio=169]{beamer}
\usetheme{Madrid}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{tikz}
\usepackage{amssymb}
\usepackage{graphicx}
\usepackage{alltt}
\setbeamertemplate{navigation symbols}{}
\setbeamercolor{title}{fg=black,bg=${ACCENT}}
\setbeamercolor{frametitle}{fg=black,bg=${ACCENT}}
\setbeamercolor{block title}{bg=${ACCENT}!30,fg=black}
\setbeamercolor{block body}{bg=${ACCENT}!10,fg=black}
\setbeamercolor{item}{fg=orange!70!red}
\setbeamercolor{itemize item}{fg=orange!70!red}
\setbeamertemplate{itemize item}[triangle]
`

// Only teach the genuinely-JS stages of web5 (it starts as HTML/CSS
// portfolio work; the JS ideas begin at the variable/click stages).
const WEB5_JS_STAGE_IDS = new Set(['web5s2b', 'web5s2c', 'web5s3', 'web5s4', 'web5boss'])

function stageFrames(mod, stage) {
  const frames = []
  const html = stage.text || ''
  const body = htmlToTex(html)

  frames.push(String.raw`
\begin{frame}{${esc(stage.name)}}
    \large
    ${body}
\end{frame}
`)

  if (Array.isArray(stage.hints) && stage.hints.length) {
    const items = stage.hints.map(h => '        \\item ' + htmlToTex(h)).join('\n')
    frames.push(String.raw`
\begin{frame}{${esc(stage.name)} --- Hints}
    \normalsize
    \begin{itemize}
${items}
    \end{itemize}
\end{frame}
`)
  }

  const starter = stage.webStarter
  if (starter) {
    if (starter.js && starter.js.trim()) frames.push(codeBlockFrame(stage.name + ' (JS)', 'js', starter.js))
    else if (starter.html && starter.html.trim()) frames.push(codeBlockFrame(stage.name + ' (HTML/CSS)', 'html', starter.html))
  }

  if (Array.isArray(stage.questions) && stage.questions.length) {
    for (const q of stage.questions) {
      const opts = (q.options || []).map(o => {
        const mark = o === q.answer ? '\\textbf{' + esc(o) + '} \\checkmark' : esc(o)
        return '        \\item ' + mark
      }).join('\n')
      frames.push(String.raw`
\begin{frame}{${esc(stage.name)} --- Quiz}
    \normalsize
    ${htmlToTex(q.prompt)}
    \begin{itemize}
${opts}
    \end{itemize}
\end{frame}
`)
    }
  }

  return frames.join('\n')
}

function moduleSection(mod, stageFilter) {
  const stages = mod.stages.filter(stageFilter || (() => true))
  const titleFrame = String.raw`
\section{${esc(mod.name.replace(/^\S+\s/, ''))}}
\begin{frame}
    \begin{center}
    {\LARGE\bfseries ${esc(mod.name)}}\\[0.3em]
    {\large ${esc(mod.sub)}}
    \end{center}
\end{frame}
`
  return titleFrame + stages.map(s => stageFrames(mod, s)).join('\n')
}

const web5 = modules.find(m => m.id === 'web5')
const wsModules = modules.filter(m => m.id !== 'web5')

const body =
  moduleSection(web5, s => WEB5_JS_STAGE_IDS.has(s.id)) +
  wsModules.map(m => moduleSection(m)).join('\n')

const totalStages = web5.stages.filter(s => WEB5_JS_STAGE_IDS.has(s.id)).length +
  wsModules.reduce((n, m) => n + m.stages.length, 0)

const tex = PREAMBLE + String.raw`
\title{Grade 8 --- JavaScript}
\subtitle{Every real stage, start to finish --- pulled live from the course}
\author{ByteForge --- Grade 8 --- The App Builder}
\date{}

\begin{document}

\begin{frame}
    \titlepage
\end{frame}

\begin{frame}{What Is JavaScript?}
    \large
    \begin{itemize}
        \item HTML is a page's skeleton, CSS is its paint --- JavaScript is its electricity
        \item The one language that makes a page actually DO something after it loads
        \item Everything from here is the REAL course content, stage by stage
    \end{itemize}
\end{frame}

\begin{frame}{Today's Plan}
    \tableofcontents
\end{frame}
${body}
\begin{frame}{Your Turn}
    \Large
    Open \textbf{grade8.html}, find these exact chapters, and build the real
    thing --- everything you just saw, you now write yourself.
\end{frame}

\end{document}
`

writeFileSync(OUT_DIR + '/grade8-javascript-overview.tex', tex, 'utf8')
console.log('Wrote latex/grade8/grade8-javascript-overview.tex --- ' + (wsModules.length + 1) + ' modules, ' + totalStages + ' real stages')
