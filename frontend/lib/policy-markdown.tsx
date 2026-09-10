// A small, dependency-free "mini-markdown" renderer for admin-editable
// legal text (the privacy policy) that still needs real structure —
// section headings, bullet lists, bold emphasis, a link — not just plain
// paragraphs. Deliberately narrow: this is not a general markdown engine,
// just the handful of constructs the privacy policy actually uses.
//
// Builds real React elements, never dangerouslySetInnerHTML — this text
// comes from an admin textarea (see components/privacy-policy-editor.tsx),
// so treating it as raw HTML would make it a stored-XSS vector the moment
// anyone with access to /prompt (which, per its own toggle, may have no
// password at all) pastes in a <script> tag. Building elements directly
// makes that structurally impossible: nothing here ever becomes markup.
import type { ReactNode } from "react"

// **bold** and [text](url) -- the two inline constructs the policy uses.
// Exported too: the consent checkbox text (analyzer-form.tsx) is a single
// admin-editable line with one embedded link ("[politique de
// confidentialité](/protection-des-donnees)") -- same construct, same
// safe-by-construction reasoning, not worth a second copy of this regex.
export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++}>{match[1]}</strong>)
    } else {
      nodes.push(
        <a key={key++} href={match[3]} target="_blank" rel="noopener noreferrer">
          {match[2]}
        </a>
      )
    }
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

export function renderPolicyText(source: string): ReactNode {
  const blocks = source.trim().split(/\n\s*\n/)
  let key = 0

  return blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return null

    if (lines[0].startsWith("## ")) {
      return <h2 key={key++}>{renderInline(lines[0].slice(3))}</h2>
    }

    if (lines.every((l) => l.startsWith("- "))) {
      return (
        <ul key={key++}>
          {lines.map((l, i) => (
            <li key={i}>{renderInline(l.slice(2))}</li>
          ))}
        </ul>
      )
    }

    return <p key={key++}>{renderInline(lines.join(" "))}</p>
  })
}
