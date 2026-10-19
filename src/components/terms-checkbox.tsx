import Link from "next/link";

// Clickwrap: unchecked by default, and the server actions refuse to send or
// verify a code without it. Links open in a new tab so the half-filled form
// isn't lost.
export function TermsCheckbox({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-2.5 text-sm leading-snug text-muted-foreground">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <span>
        I agree to the{" "}
        <Link href="/terms" target="_blank" className="font-medium text-foreground underline underline-offset-4">
          Terms
        </Link>{" "}
        and have read the{" "}
        <Link href="/privacy" target="_blank" className="font-medium text-foreground underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}
