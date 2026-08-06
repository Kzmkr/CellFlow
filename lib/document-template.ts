// Fills a template's {{key}} placeholders from a data row, keyed by the
// row's own column keys (e.g. {{name}}, {{email}}). Unknown keys are left
// as-is so typos are visible in the rendered output instead of silently
// disappearing.
const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export function extractTemplateKeys(template: string): string[] {
  const keys = new Set<string>()
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    keys.add(match[1])
  }
  return [...keys]
}

// Typst treats \, ", #, $, [, ], @ and _ as markup syntax — escape user
// data so a stray character in a cell can't corrupt the compiled document.
export function escapeTypstText(value: string): string {
  return value.replace(/[\\"#$\[\]@_*`<>]/g, (char) => `\\${char}`)
}

export function renderTemplate(
  template: string,
  row: Record<string, string | number | boolean>,
  escape: (value: string) => string = escapeTypstText,
): string {
  return template.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    if (!(key in row)) {
      return match
    }
    return escape(String(row[key]))
  })
}
