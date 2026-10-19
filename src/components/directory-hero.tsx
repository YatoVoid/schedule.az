import Link from "next/link";
import { ArrowDownRightIcon, ArrowRightIcon, CalendarCheckIcon } from "lucide-react";

export function DirectoryHero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col gap-6">
        <p className="eyebrow flex items-center gap-3 text-coral">
          <span aria-hidden className="h-px w-8 bg-coral" />
          Baku, Azerbaijan
          <span aria-hidden className="hidden h-3 w-px bg-coral/60 sm:block" />
          <span className="hidden sm:inline">Find a business to book</span>
        </p>
        <h1 className="font-serif text-6xl leading-[1.05] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
          Book your next
          <br />
          <em className="text-coral">appointment.</em>
        </h1>
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          Barbers, salons, nail bars and spas across the city, with their prices, open times and a map. Pick a
          time and the business confirms it, no WhatsApp back and forth.
        </p>
        <Link
          href="#discover"
          className="group flex w-fit items-center gap-3 text-sm font-medium text-primary"
        >
          Search by business or by the professional you usually see
          <span className="flex size-8 items-center justify-center rounded-full border border-primary/40 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowDownRightIcon className="size-4" />
          </span>
        </Link>
      </div>

      <div className="relative mx-auto w-full max-w-md lg:max-w-none">
        <div
          aria-hidden
          className="absolute -top-6 -right-2 bottom-16 left-16 rounded-[3rem_8rem_3rem_3rem] bg-sage sm:-right-6"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-baku.jpg"
          alt="Flower beds in a Baku park with one of the Flame Towers behind the trees"
          width={1280}
          height={1024}
          className="relative aspect-[5/4] w-full rounded-[2.5rem_8rem_2.5rem_8rem] object-cover shadow-xl shadow-primary/10 lg:w-[88%]"
        />
        <div className="surface absolute -bottom-5 right-0 flex rotate-[-3deg] items-center gap-2 px-4 py-2.5 text-xs font-medium text-primary sm:right-2">
          <CalendarCheckIcon className="size-4 text-coral" />
          <span>
            Pick a time,
            <br />
            the business confirms it
          </span>
        </div>
      </div>
    </section>
  );
}

const OWNER_STEPS = ["Add your services and prices", "Set the hours your team works", "Share your booking link"];

export function OwnerBand() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-[2rem] bg-blossom px-6 py-12 text-blossom-foreground sm:px-12 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-4">
          <p className="eyebrow opacity-75">For business owners</p>
          <h2 className="font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Run a salon, barbershop or spa?
            <br />
            <em>Take bookings here.</em>
          </h2>
          <p className="max-w-md text-sm leading-relaxed opacity-85">
            Customers see the times your team is actually free and book one. You accept or decline from your
            phone, and the booking shows up in their account.
          </p>
          <Link
            href="/onboarding"
            className="mt-2 flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Add your business
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
        <ol className="surface flex w-full max-w-xs rotate-2 flex-col gap-3 p-5 text-foreground lg:w-72">
          <li className="eyebrow border-b pb-3 text-coral">Schedule.az</li>
          {OWNER_STEPS.map((step, i) => (
            <li key={step} className="flex items-baseline gap-3">
              <span className="font-serif text-2xl text-primary italic">{i + 1}</span>
              <span className="text-sm">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
