import { StatCard, StatGrid, ChartCard } from "@/components/data/stat-card";
import { TrendAreaChart, RankedBarChart } from "@/components/data/charts";
import { EmptyState } from "@/components/ui/states";
import type { ReportResult } from "@/lib/services/report.service";
import { formatCurrency, formatDate, percent } from "@/lib/utils";

/**
 * One report presentation, shared by the church and platform report screens.
 * The tables beside each chart double as the accessible view of the same data.
 */
export function ReportView({
  report,
  range,
  showStaff = true,
}: {
  report: ReportResult;
  range: { from: string; to: string; label: string };
  showStaff?: boolean;
}) {
  const { summary } = report;

  if (!summary.intentions) {
    return (
      <EmptyState
        title="No intentions in this period."
        description={`Nothing was scheduled between ${formatDate(range.from)} and ${formatDate(range.to)}. Widen the range or clear the filters.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StatGrid columns={4}>
        <StatCard label="Intentions" value={summary.intentions} hint={range.label} emphasis />
        <StatCard
          label="Verified offerings"
          value={formatCurrency(summary.revenue)}
          hint={`Average ${formatCurrency(summary.averageOffering)}`}
          tone="accent"
          emphasis
        />
        <StatCard
          label="Completed"
          value={`${summary.completed} · ${summary.completionRate}%`}
          hint={`${summary.cancelled} cancelled`}
          tone="success"
          emphasis
        />
        <StatCard
          label="Awaiting verification"
          value={summary.pendingVerification}
          hint="Payments not yet confirmed"
          tone={summary.pendingVerification > 0 ? "warning" : "default"}
          emphasis
        />
      </StatGrid>

      <ChartCard
        title="Offerings by prayer date"
        description={`Verified offerings across ${range.label.toLowerCase()}`}
      >
        <TrendAreaChart data={report.revenueSeries} seriesName="Verified offerings" height={260} />
      </ChartCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="By prayer type" description="Intentions and the offerings recorded">
          <RankedBarChart data={report.prayerTypeRows.map((r) => ({ label: r.label, value: r.revenue }))} variant="currency" />
          <ReportTable
            caption="Intentions and offerings by prayer type"
            head={["Prayer type", "Intentions", "Offerings"]}
            rows={report.prayerTypeRows.map((r) => [
              r.label,
              String(r.count),
              formatCurrency(r.revenue),
            ])}
          />
        </ChartCard>

        <ChartCard title="By payment method" description="How offerings reached the parish">
          <RankedBarChart data={report.methodRows.map((r) => ({ label: r.label, value: r.revenue }))} variant="currency" />
          <ReportTable
            caption="Payments and offerings by method"
            head={["Method", "Payments", "Verified value"]}
            rows={report.methodRows.map((r) => [
              r.label,
              String(r.count),
              formatCurrency(r.revenue),
            ])}
          />
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Intention status" description="Where each intention stands">
          <ReportTable
            caption="Intentions by status"
            head={["Status", "Intentions", "Share"]}
            rows={report.statusRows.map((r) => [
              r.label,
              String(r.count),
              `${percent(r.count, summary.intentions)}%`,
            ])}
            bare
          />
        </ChartCard>

        {showStaff ? (
          <ChartCard title="Staff performance" description="Assigned and completed in this period">
            {report.staffRows.length ? (
              <ReportTable
                caption="Prayer staff performance"
                head={["Staff", "Assigned", "Completed", "Rate", "Offerings"]}
                rows={report.staffRows.map((r) => [
                  r.staff.name,
                  String(r.assigned),
                  String(r.completed),
                  `${r.completionRate}%`,
                  formatCurrency(r.revenue),
                ])}
                bare
              />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No prayers were assigned in this period.
              </p>
            )}
          </ChartCard>
        ) : null}
      </div>
    </div>
  );
}

function ReportTable({
  caption,
  head,
  rows,
  bare,
}: {
  caption: string;
  head: string[];
  rows: string[][];
  bare?: boolean;
}) {
  return (
    <div className={bare ? "overflow-x-auto" : "mt-5 overflow-x-auto border-t border-border pt-4"}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {head.map((cell, index) => (
              <th
                key={cell}
                scope="col"
                className={
                  index === 0
                    ? "pb-2 text-left text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                    : "pb-2 text-right text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                }
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={
                    index === 0
                      ? "py-2 pr-3 text-left font-medium text-foreground"
                      : "py-2 pl-3 text-right tabular-nums text-muted-foreground"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
