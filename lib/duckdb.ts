import * as duckdb from "@duckdb/duckdb-wasm";

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

export async function initDuckDB(): Promise<duckdb.AsyncDuckDBConnection> {
  if (conn) return conn;

  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], {
      type: "text/javascript",
    })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  conn = await db.connect();
  return conn;
}

export function getDuckDB(): duckdb.AsyncDuckDB {
  if (!db) throw new Error("DuckDB not initialized");
  return db;
}

export async function query(sql: string): Promise<Record<string, unknown>[]> {
  const connection = await initDuckDB();
  const arrowResult = await connection.query(sql);
  const rows: Record<string, unknown>[] = [];
  for (const row of arrowResult) {
    rows.push(row as Record<string, unknown>);
  }
  return rows;
}

export async function insertCSVFromString(
  tableName: string,
  csvText: string
): Promise<void> {
  const database = getDuckDB();
  const connection = await initDuckDB();
  const fileName = `${tableName}.csv`;
  await database.registerFileText(fileName, csvText);
  await connection.query(
    `CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM read_csv_auto('${fileName}')`
  );
}

export async function insertJSONFromString(
  tableName: string,
  jsonText: string
): Promise<void> {
  const database = getDuckDB();
  const connection = await initDuckDB();
  const fileName = `${tableName}.json`;
  await database.registerFileText(fileName, jsonText);
  await connection.query(
    `CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM read_json_auto('${fileName}')`
  );
}

export async function createOrReplaceTable(
  tableName: string,
  sql: string
): Promise<void> {
  const connection = await initDuckDB();
  await connection.query(`CREATE OR REPLACE TABLE ${tableName} AS ${sql}`);
}

export async function exportTableToCSV(tableName: string): Promise<string> {
  const rows = await query(`SELECT * FROM ${tableName}`);
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]);
  const csv = [
    columns.join(","),
    ...rows.map((row) =>
      columns
        .map((col) => {
          const val = row[col];
          if (val == null) return "";
          const str = String(val);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    ),
  ].join("\n");
  return csv;
}
