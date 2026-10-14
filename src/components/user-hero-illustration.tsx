export default function UserHeroIllustration() {
  return <svg viewBox="0 0 360 260" className="h-auto w-full" aria-hidden="true">
    <circle cx="190" cy="128" r="114" className="fill-surface/60" />
    <circle cx="305" cy="87" r="8" className="fill-primary/25" /><circle cx="68" cy="67" r="5" className="fill-primary/50" />
    <path d="M37 222h292" className="stroke-ink/15" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="181" cy="227" rx="141" ry="9" className="fill-primary/10" />
    <rect x="49" y="121" width="80" height="100" rx="8" className="fill-primary/15 stroke-primary/20" />
    <rect x="43" y="111" width="92" height="16" rx="5" className="fill-primary/40" />
    {[0, 1].map(row => [0, 1, 2].map(column => <rect key={`${row}-${column}`} x={61 + column * 21} y={138 + row * 32} width="13" height="19" rx="3" className="fill-surface" />))}
    <rect x="245" y="128" width="68" height="93" rx="8" className="fill-surface stroke-line" />
    <rect x="240" y="116" width="79" height="18" rx="5" className="fill-ink" />
    {[0, 1].map(row => [0, 1].map(column => <rect key={`${row}-${column}`} x={258 + column * 27} y={145 + row * 31} width="14" height="18" rx="3" className="fill-background" />))}
    <rect x="119" y="82" width="125" height="139" rx="10" className="fill-surface stroke-primary/30" />
    <rect x="109" y="69" width="145" height="20" rx="7" className="fill-primary" />
    <rect x="151" y="101" width="61" height="19" rx="5" className="fill-background" />
    <path d="M165 110h33" className="stroke-ink/40" strokeWidth="3" strokeLinecap="round" />
    {[0, 1].map(row => [0, 1, 2].map(column => <rect key={`${row}-${column}`} x={139 + column * 30} y={134 + row * 29} width="20" height="18" rx="4" className="fill-primary/15" />))}
    <rect x="167" y="194" width="30" height="27" rx="5" className="fill-primary" />
    <path d="M182 197v23" className="stroke-surface/70" strokeWidth="2" />
    <path d="M32 193v27M326 191v29" className="stroke-emerald-700/50" strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="179" r="19" className="fill-emerald-200" /><circle cx="326" cy="175" r="22" className="fill-emerald-200" />
    <circle cx="26" cy="169" r="13" className="fill-emerald-100" /><circle cx="320" cy="165" r="14" className="fill-emerald-100" />
    <g transform="rotate(10 289 55)"><rect x="263" y="29" width="52" height="52" rx="15" className="fill-surface stroke-line" /><path d="m278 64 15-15a10 10 0 0 0 11-11l-6 6-5-1-1-5 6-6a10 10 0 0 0-11 11l-15 15a4 4 0 0 0 6 6Z" className="fill-primary/20 stroke-primary" strokeWidth="2" strokeLinejoin="round" /></g>
    <g transform="rotate(-7 78 76)"><rect x="48" y="45" width="59" height="53" rx="15" className="fill-surface stroke-line" /><circle cx="78" cy="71" r="13" className="fill-primary/15" /><path d="m71 71 5 5 9-10" className="stroke-primary" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></g>
    <rect x="76" y="206" width="62" height="32" rx="10" className="fill-surface stroke-line" /><circle cx="92" cy="222" r="7" className="fill-primary/15" /><path d="M92 218v4l3 2" fill="none" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" /><path d="M107 219h19M107 225h13" className="stroke-line" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}
