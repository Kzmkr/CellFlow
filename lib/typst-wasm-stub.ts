// @myriaddreamin/typst.ts falls back to `import('@myriaddreamin/typst-ts-web-compiler' | '-renderer')`
// when no `getWrapper` is supplied. lib/typst.ts always supplies one (the
// real packages are fetched from a CDN instead, see vite.config.ts), so that
// fallback branch is dead code — this empty stub exists only so bundlers can
// resolve the literal specifier without the real (tens-of-MB) packages
// installed locally.
export {};
