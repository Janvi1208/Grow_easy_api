"use client";

const STEPS = [
  { id: 1, label: "Upload CSV" },
  { id: 2, label: "Preview rows" },
  { id: 3, label: "Confirm import" },
  { id: 4, label: "Review results" },
];

export default function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {STEPS.map((step, i) => {
        const state = step.id < current ? "done" : step.id === current ? "active" : "upcoming";
        return (
          <li key={step.id} className="flex items-center">
            <div
              className={[
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                state === "active" && "border-coral bg-coral text-white shadow-soft",
                state === "done" && "border-moss/30 bg-moss-light text-moss",
                state === "upcoming" && "border-line bg-panel text-slate",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold font-mono",
                  state === "active" && "bg-white/20 text-white",
                  state === "done" && "bg-moss text-white",
                  state === "upcoming" && "bg-line text-slate",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {state === "done" ? "✓" : step.id}
              </span>
              <span className="font-medium">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="mx-2 h-px w-6 bg-line" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
