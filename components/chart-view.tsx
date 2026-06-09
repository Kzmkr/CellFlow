import { useMemo } from "react"
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from "chart.js"
import { Chart } from "react-chartjs-2"

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
)

export type ChartSettings = {
  chartType: string
  xColumn: string
  yColumn: string
  aggregation: string
}

type DataRow = Record<string, unknown>

const PALETTE = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#10b981",
  "#3b82f6",
  "#f97316",
  "#a855f7",
]

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

function aggregate(values: number[], mode: string): number {
  if (values.length === 0) return 0
  switch (mode) {
    case "count":
      return values.length
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length
    case "min":
      return Math.min(...values)
    case "max":
      return Math.max(...values)
    case "sum":
    default:
      return values.reduce((a, b) => a + b, 0)
  }
}

/**
 * Group rows by the X column and reduce each group's Y values. With "none"
 * each row becomes its own point, preserving order.
 */
function buildCategoryData(rows: DataRow[], settings: ChartSettings) {
  const { xColumn, yColumn, aggregation } = settings

  if (aggregation === "none") {
    return {
      labels: rows.map((row) => String(row[xColumn] ?? "")),
      values: rows.map((row) => toNumber(row[yColumn])),
    }
  }

  const groups = new Map<string, number[]>()
  for (const row of rows) {
    const key = String(row[xColumn] ?? "")
    const bucket = groups.get(key) ?? []
    bucket.push(toNumber(row[yColumn]))
    groups.set(key, bucket)
  }

  const labels = [...groups.keys()]
  return {
    labels,
    values: labels.map((label) => aggregate(groups.get(label) ?? [], aggregation)),
  }
}

export function ChartView({ data, settings }: { data: DataRow[]; settings: ChartSettings }) {
  const chartType = (settings.chartType || "bar") as ChartType
  const isCircular = chartType === "pie" || chartType === "doughnut"

  const { chartData, hasConfig } = useMemo(() => {
    const configured =
      Boolean(settings.xColumn) &&
      (Boolean(settings.yColumn) || settings.aggregation === "count")

    if (!configured || data.length === 0) {
      return { chartData: null as ChartData<ChartType> | null, hasConfig: configured }
    }

    if (chartType === "scatter") {
      return {
        chartData: {
          datasets: [
            {
              label: `${settings.yColumn} vs ${settings.xColumn}`,
              data: data.map((row) => ({
                x: toNumber(row[settings.xColumn]),
                y: toNumber(row[settings.yColumn]),
              })),
              backgroundColor: PALETTE[0],
            },
          ],
        } as ChartData<ChartType>,
        hasConfig: configured,
      }
    }

    const { labels, values } = buildCategoryData(data, settings)
    return {
      chartData: {
        labels,
        datasets: [
          {
            label: settings.yColumn || "Count",
            data: values,
            backgroundColor: isCircular
              ? labels.map((_, i) => PALETTE[i % PALETTE.length])
              : PALETTE[0],
            borderColor: isCircular ? "#ffffff" : PALETTE[0],
            borderWidth: isCircular ? 1 : 2,
            fill: chartType === "line" ? false : undefined,
          },
        ],
      } as ChartData<ChartType>,
      hasConfig: configured,
    }
  }, [data, settings, chartType, isCircular])

  const options = useMemo<ChartOptions<ChartType>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: isCircular },
      },
    }),
    [isCircular],
  )

  if (!hasConfig) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Pick X and Y columns in the Properties panel to render this chart.
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
        No data to chart. Connect an input and run the pipeline.
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 p-4">
      <Chart type={chartType} data={chartData} options={options} />
    </div>
  )
}
