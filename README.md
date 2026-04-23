# Cellflow™

A browser-native, node-based tool for transforming tabular data. Drop a file onto an infinite canvas, wire it through SQL, filter, and join nodes, export the result, and inspect the data at any step along the way. Everything runs entirely in the browser — nothing is uploaded.

## But Why?

 Workflows!
 
Build them once, run them many times — just swap the input file and go.

## Features

- **Load and save data** CSV, Parquet, JSON, and Excel files entirely in-browser (DuckDB-wasm).
- **Query** your data with raw SQL.
- **Filter** through a UI for users who'd rather not write SQL.
- **Inspect** any node's output in a side panel — schema, row count, node settings, and a data preview.
- **Save and load node tree** the entire graph as a single JSON file into your account.

Longer term, the same framework could extend into images, audio, video, 3D, text/NLP, maps, documents, and on-device ML — all client-side.

## Tech stack

- **[React Flow](https://reactflow.dev/)** — node editor
- **[DuckDB-wasm](https://duckdb.org/)** — in-browser SQL
- **React** — frontend
- **Cloudflare Pages** — for the frontend
-  **Cloudflare Workers** — for the backend with [Hono](hono.dev)

## Ui Plan

![f](https://github.com/Kzmkr/CellFlow/blob/main/screen.png)
> Live [preview](https://stitch.withgoogle.com/preview/3876371839046970821?node-id=467f89bda8aa474582de02d8feacc15f) generated with Stitch by Google


## Nodes
<kbd> <br> Input <br> </kbd>
<kbd> <br> Filte <br> </kbd>
<kbd> <br> Raw SQL <br> </kbd>
<kbd> <br> Delete column <br> </kbd>
<kbd> <br> Add column <br> </kbd>
<kbd> <br> Join <br> </kbd>
<kbd> <br> Output <br> </kbd>

## Backend 
Minimal only for auth and saving workflows (Cloudflare D1)

## cd/ci
On push to main 
https://ba79c4c0.cellflow.pages.dev/


## Potential future improvements
- **Live connection** remote db, json api
- **OAuth** Google and Github login
- **Parameter nodes** — sliders and inputs that feed values into the graph.
- **Charts** — bar, line, scatter, heatmap.
- **Statistics** — regression, correlation, descriptive stats.
- **LaTeX annotations** on charts (scalar stats rendered as equations).
- **Export** a workflow as a single standalone HTML file.
