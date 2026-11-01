import { startTourReplay } from "features/product-tour";
import {
  sectionStepCount,
  TOUR_SECTIONS,
} from "features/product-tour/tourSections";

export default function Tutorials() {
  return (
    <section className="rounded-[1.5rem] bg-surface-raised p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">
      <h2 className="text-xl font-extrabold tracking-tight text-foreground">
        Tutorials
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-muted">
        Replay a section of the walkthrough. Each tile plays only that part —
        it does not restart the full first-login tour.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {TOUR_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => startTourReplay(section.id)}
            className="flex min-h-[10.5rem] flex-col rounded-2xl border border-border bg-surface-muted/40 p-5 text-left transition hover:border-brand/40 hover:bg-brand-muted/20"
          >
            <h3 className="text-lg font-extrabold tracking-tight text-foreground">
              {section.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground-muted">
              {section.description}
            </p>
            <span className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-brand">
              {sectionStepCount(section)} steps
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
