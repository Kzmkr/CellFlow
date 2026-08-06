import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

// The Typst WASM compiler/renderer binaries are fetched from a CDN at
// runtime (see lib/typst.ts) instead of being bundled. @myriaddreamin/typst.ts
// still contains a dead-code fallback that dynamically imports these two
// (tens-of-MB) packages by name, which both esbuild (dev) and Rollup (build)
// insist on resolving even though it's never reached — alias them to an
// empty stub so neither package needs to be installed locally.
const typstWasmStub = path.resolve(__dirname, "./lib/typst-wasm-stub.ts")

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@myriaddreamin/typst-ts-web-compiler": typstWasmStub,
      "@myriaddreamin/typst-ts-renderer": typstWasmStub,
    },
  },
})
