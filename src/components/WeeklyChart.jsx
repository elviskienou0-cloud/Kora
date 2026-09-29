import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils.js"

const DAYS_FR = {
  Mon: "Lun",
  Tue: "Mar",
  Wed: "Mer",
  Thu: "Jeu",
  Fri: "Ven",
  Sat: "Sam",
  Sun: "Dim",
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3.5 py-2.5 shadow-lg shadow-black/5">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-semibold gold-text-gradient">
          {payload[0].value} nouvelles demandes
        </p>
      </div>
    )
  }
  return null
}

export default function WeeklyChart({ data, title = "Activité hebdo", subtitle }) {
  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data])
  const total = chartData.reduce((s, d) => s + d.value, 0)
  const avg = chartData.length ? Math.round(total / chartData.length) : 0
  const lastGrowth = chartData.length > 1
    ? Math.round(
        ((chartData[chartData.length - 1].value - chartData[chartData.length - 2].value) /
          Math.max(1, chartData[chartData.length - 2].value)) *
          100
      )
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-5 sm:p-6"
    >
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {subtitle || "Demandes créées cette semaine"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">{lastGrowth >= 0 ? "+" : ""}{lastGrowth}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-accent/40 p-3 sm:p-4">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-xl sm:text-2xl font-bold gold-text-gradient">{total}</p>
        </div>
        <div className="rounded-xl bg-accent/40 p-3 sm:p-4">
          <p className="text-xs text-muted-foreground mb-1">Moyenne/jour</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{avg}</p>
        </div>
      </div>

      <div className={cn("h-[220px] sm:h-[260px] w-full -mx-2 sm:mx-0")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--gold))" stopOpacity={0.4} />
                <stop offset="50%" stopColor="hsl(var(--gold))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--gold))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: "hsl(var(--muted-foreground))",
              }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 11,
                fill: "hsl(var(--muted-foreground))",
              }}
              width={34}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--gold))", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--gold))"
              strokeWidth={2.5}
              fill="url(#goldGradient)"
              dot={{
                r: 4,
                fill: "hsl(var(--background))",
                stroke: "hsl(var(--gold))",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "hsl(var(--gold))",
                stroke: "hsl(var(--background))",
                strokeWidth: 3,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
