import Image from "next/image";

const SRC = "/featured/sandrone.png";
const MASK = "url(/featured/sandrone-mask.png) center / contain no-repeat";

// Horizontal bands that tear sideways during the glitch, each on its own delay.
const SLICES = [
  { clip: "inset(18% 0 70% 0)", delay: "0.35s" },
  { clip: "inset(44% 0 46% 0)", delay: "0.5s" },
  { clip: "inset(71% 0 21% 0)", delay: "0.42s" },
];

export function SandronePortrait() {
  return (
    <figure className="group relative isolate aspect-[1240/1024] w-full">
      {/* Red and cyan silhouettes sit behind the art and peek out as a chromatic fringe. */}
      <span
        aria-hidden
        className="glitch-red absolute inset-0 -z-10 bg-accent"
        style={{ mask: MASK, WebkitMask: MASK }}
      />
      <span
        aria-hidden
        className="glitch-cyan absolute inset-0 -z-10 bg-cyan"
        style={{ mask: MASK, WebkitMask: MASK }}
      />

      <Image
        src={SRC}
        alt="Sandrone, the Fatui Harbinger, seated beside her automaton"
        fill
        priority
        sizes="(min-width: 1024px) 55vw, 100vw"
        className="object-contain"
      />

      {SLICES.map(({ clip, delay }) => (
        <span
          key={clip}
          aria-hidden
          className="glitch-slice pointer-events-none absolute inset-0"
          style={{ clipPath: clip, animationDelay: delay }}
        >
          <Image src={SRC} alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain" />
        </span>
      ))}

      {/* HUD corner brackets */}
      <span aria-hidden className="absolute top-2 left-2 size-6 border-t-2 border-l-2 border-accent" />
      <span aria-hidden className="absolute top-2 right-2 size-6 border-t-2 border-r-2 border-accent" />
      <span aria-hidden className="absolute bottom-2 left-2 size-6 border-b-2 border-l-2 border-accent" />
      <span aria-hidden className="absolute right-2 bottom-2 size-6 border-r-2 border-b-2 border-accent" />
    </figure>
  );
}
