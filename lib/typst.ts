// Compiles Typst markup to documents entirely in the browser via WebAssembly.
//
// The JS wrapper (@myriaddreamin/typst.ts) is a small, bundled dependency,
// but the actual compiler/renderer WASM binaries are large (tens of MB) and
// are fetched lazily from jsdelivr at first use instead of being bundled —
// see the `external` config in vite.config.ts, which keeps the bundler from
// trying to resolve the packages below as local modules.
const TYPST_CORE_VERSION = "0.7.0"
const CDN_BASE = "https://cdn.jsdelivr.net/npm"

function wasmModuleUrl(pkg: string, file: string): string {
  return `${CDN_BASE}/@myriaddreamin/${pkg}@${TYPST_CORE_VERSION}/pkg/${file}`
}

type TypstSnippet = typeof import("@myriaddreamin/typst.ts/contrib/snippet")["$typst"]

let typstPromise: Promise<TypstSnippet> | null = null

async function loadTypst(): Promise<TypstSnippet> {
  if (!typstPromise) {
    typstPromise = import("@myriaddreamin/typst.ts/contrib/snippet").then(({ $typst }) => {
      $typst.setCompilerInitOptions({
        getModule: () => wasmModuleUrl("typst-ts-web-compiler", "typst_ts_web_compiler_bg.wasm"),
        getWrapper: () =>
          import(/* @vite-ignore */ wasmModuleUrl("typst-ts-web-compiler", "typst_ts_web_compiler.mjs")),
      })
      $typst.setRendererInitOptions({
        getModule: () => wasmModuleUrl("typst-ts-renderer", "typst_ts_renderer_bg.wasm"),
        getWrapper: () =>
          import(/* @vite-ignore */ wasmModuleUrl("typst-ts-renderer", "typst_ts_renderer.mjs")),
      })
      return $typst
    })
  }
  return typstPromise
}

export class TypstCompileError extends Error {
  constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause))
    this.name = "TypstCompileError"
    this.cause = cause
  }
}

export async function compileTypstToPdf(source: string): Promise<Uint8Array> {
  const $typst = await loadTypst()
  try {
    const result = await $typst.pdf({ mainContent: source })
    if (!result) {
      throw new Error("Typst produced no output — check the template for errors.")
    }
    return result
  } catch (error) {
    throw new TypstCompileError(error)
  }
}

export async function compileTypstToSvg(source: string): Promise<string> {
  const $typst = await loadTypst()
  try {
    return await $typst.svg({ mainContent: source })
  } catch (error) {
    throw new TypstCompileError(error)
  }
}
