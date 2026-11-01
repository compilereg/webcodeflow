import { APP_NAME } from "shared/config/brand";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-surface-raised">
      <div className="mx-auto max-w-[1440px] px-4 py-4 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-foreground-muted sm:px-6 sm:text-[11px] sm:tracking-[0.12em]">
        © 2026 {APP_NAME}
      </div>
    </footer>
  );
}
