"use client";

import { useEffect, useState } from "react";

import { deviceEncryptedMessagePrefix, encryptedMessagePrefix } from "@/lib/e2ee-message";
import { formatReadableTimestamp } from "@/lib/utils";

type ModerationReport = {
  channel: {
    name: string;
  };
  createdAt: Date | string;
  details: string | null;
  id: string;
  message: {
    content: string;
    id: string;
    sender: {
      email: string;
      name: string;
    };
  };
  reason: string;
  reporter: {
    email: string;
    name: string;
  };
  status: "OPEN" | "REVIEWED" | "DISMISSED";
};

type ModerationReportsPanelProps = {
  groupId: string;
};

export function ModerationReportsPanel({ groupId }: ModerationReportsPanelProps) {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);

      try {
        const response = await fetch(`/api/groups/${groupId}/reports`, {
          headers: {
            accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Could not load reports.");
        }

        const data = (await response.json()) as { reports?: ModerationReport[] };

        if (!cancelled) {
          setReports(data.reports ?? []);
        }
      } catch {
        if (!cancelled) {
          setMessage("Could not load reports.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  async function updateReport(reportId: string, status: ModerationReport["status"]) {
    setMessage("");

    try {
      const response = await fetch(`/api/groups/${groupId}/reports`, {
        body: JSON.stringify({
          reportId,
          status,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Could not update report.");
      }

      setReports((current) =>
        current.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status,
              }
            : report,
        ),
      );
      setMessage("Report updated.");
    } catch {
      setMessage("Could not update report.");
    }
  }

  return (
    <section className="app-panel p-5">
      <p className="app-section-title">Moderation</p>
      <h2 className="mt-2 text-xl font-semibold text-white">Message reports</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Reports stay visible until an owner or admin reviews them.
      </p>
      {message ? <p className="mt-3 text-sm text-slate-300">{message}</p> : null}
      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="app-skeleton h-24 rounded-lg" />
        ) : reports.length ? (
          reports.map((report) => (
            <article className="app-card p-4" key={report.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="app-badge px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {formatReportStatus(report.status)}
                </span>
                <span className="text-xs text-slate-500">
                  {formatReadableTimestamp(report.createdAt)}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-white">
                {formatReportReason(report.reason)} in #{report.channel.name}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                Reported by {report.reporter.name || report.reporter.email}; message by{" "}
                {report.message.sender.name || report.message.sender.email}.
              </p>
              <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-slate-300">
                {formatMessagePreview(report.message.content)}
              </p>
              {report.details ? (
                <p className="mt-2 text-xs leading-5 text-slate-400">{report.details}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="app-button-secondary h-9 rounded-lg px-3 text-xs font-semibold"
                  onClick={() => void updateReport(report.id, "REVIEWED")}
                  type="button"
                >
                  Mark reviewed
                </button>
                <button
                  className="app-button-secondary h-9 rounded-lg px-3 text-xs font-semibold"
                  onClick={() => void updateReport(report.id, "DISMISSED")}
                  type="button"
                >
                  Dismiss
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-400">
            No reports yet.
          </p>
        )}
      </div>
    </section>
  );
}

function formatMessagePreview(content: string) {
  if (
    content.startsWith(encryptedMessagePrefix) ||
    content.startsWith(deviceEncryptedMessagePrefix)
  ) {
    return "Encrypted message content is only readable by participants on their devices.";
  }

  return content;
}

function formatReportReason(reason: string) {
  return reason.replace(/_/g, " ").toLowerCase();
}

function formatReportStatus(status: ModerationReport["status"]) {
  return status.toLowerCase();
}
