import { useId, useState } from "react";

const R = { x: 20, y: 20, w: 540, h: 320 };

const SETS = {
  2: [
    { cx: 225, cy: 180, r: 100, lx: 128, ly: 72 },
    { cx: 355, cy: 180, r: 100, lx: 452, ly: 72 },
  ],
  3: [
    { cx: 230, cy: 150, r: 85, lx: 135, ly: 62 },
    { cx: 350, cy: 150, r: 85, lx: 445, ly: 62 },
    { cx: 290, cy: 245, r: 85, lx: 415, ly: 312 },
  ],
};

const circlePath = ({ cx, cy, r }) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const rectPath = `M${R.x} ${R.y}H${R.x + R.w}V${R.y + R.h}H${R.x}Z`;
const range = (n) => [...Array(n).keys()];

// 
function Venn({ circles, names, draw, title }) {
  const uid = useId().replace(/\W/g, "");
  const cid = (i) => `${uid}c${i}`;
  const nid = (i) => `${uid}n${i}`;

  const h = {
    full: (p) => <rect x={R.x} y={R.y} width={R.w} height={R.h} {...p} />,
    circ: (i, p) => <circle cx={circles[i].cx} cy={circles[i].cy} r={circles[i].r} {...p} />,
    inside: (i) => `url(#${cid(i)})`,
    outside: (i) => `url(#${nid(i)})`,
    nest: (ids, node) => ids.reduceRight((acc, id) => <g clipPath={id}>{acc}</g>, node),
    minus: (hole) => (
      <>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={R.x} y={R.y} width={R.w} height={R.h}>
          <rect x={R.x} y={R.y} width={R.w} height={R.h} fill="#fff" />
          <g fill="#000">{hole}</g>
        </mask>
        <rect x={R.x} y={R.y} width={R.w} height={R.h} mask={`url(#${uid}m)`} />
      </>
    ),
  };

  return (
    <svg className="venn" viewBox="0 0 580 360" role="img" aria-label={title}>
      <defs>
        {circles.map((c, i) => (
          <clipPath key={`c${i}`} id={cid(i)}>
            <circle cx={c.cx} cy={c.cy} r={c.r} />
          </clipPath>
        ))}
        {circles.map((c, i) => (
          <clipPath key={`n${i}`} id={nid(i)}>
            <path clipRule="evenodd" d={`${rectPath} ${circlePath(c)}`} />
          </clipPath>
        ))}
      </defs>
      <rect className="well" x={R.x} y={R.y} width={R.w} height={R.h} rx="6" />
      {circles.map((c, i) => (
        <circle key={i} className="set" cx={c.cx} cy={c.cy} r={c.r} />
      ))}
      <g className="hl">{draw(h)}</g>
      <rect className="frame" x={R.x} y={R.y} width={R.w} height={R.h} rx="6" />
      {circles.map((c, i) => (
        <circle key={i} className="ring" cx={c.cx} cy={c.cy} r={c.r} />
      ))}
      {circles.map((c, i) => (
        <text key={i} x={c.lx} y={c.ly} textAnchor="middle">{names[i]}</text>
      ))}
      <text className="e" x={R.x + 16} y={R.y + 32}>E</text>
    </svg>
  );
}

/* ---------- Operations ---------- */
const OPS = [
  { id: "U", sym: "A ∪ B", nom: "Union", txt: "Elements qui sont dans A ou dans B (ou dans les deux)",
    draw: (h) => [h.circ(0, { key: 0 }), h.circ(1, { key: 1 })] },
  { id: "I", sym: "A ∩ B", nom: "Intersection", txt: "Elements communs : dans A et dans B a la fois",
    draw: (h) => h.circ(1, { clipPath: h.inside(0) }) },
  { id: "Ac", sym: "Aᶜ", nom: "Complementaire de A", txt: "Tout ce qui est dans E mais pas dans A",
    draw: (h) => h.full({ clipPath: h.outside(0) }) },
  { id: "Bc", sym: "Bᶜ", nom: "Complementaire de B", txt: "Tout ce qui est dans E mais pas dans B",
    draw: (h) => h.full({ clipPath: h.outside(1) }) },
  { id: "AB", sym: "A \\ B", nom: "Difference", txt: "Éléments de A qui ne sont pas dans B (A ∩ Bᶜ)",
    draw: (h) => h.circ(0, { clipPath: h.outside(1) }) },
  { id: "BA", sym: "B \\ A", nom: "Difference", txt: "Éléments de B qui ne sont pas dans A (B ∩ Aᶜ)",
    draw: (h) => h.circ(1, { clipPath: h.outside(0) }) },
  { id: "D", sym: "A Δ B", nom: "Difference symetrique", txt: "Elements dans A ou B, mais pas dans les deux",
    draw: (h) => [
      h.circ(0, { key: 0, clipPath: h.outside(1) }),
      h.circ(1, { key: 1, clipPath: h.outside(0) }),
    ] },
  { id: "nU", sym: "(A ∪ B)ᶜ", nom: "Complementaire d’une union", txt: "Hors des deux cercles : (A ∪ B)ᶜ = Aᶜ ∩ Bᶜ",
    draw: (h) => h.nest([h.outside(0), h.outside(1)], h.full()) },
  { id: "nI", sym: "(A ∩ B)ᶜ", nom: "Complementaire d’une intersection", txt: "Tout E sauf le centre : (A ∩ B)ᶜ = Aᶜ ∪ Bᶜ",
    draw: (h) => [h.full({ key: 0, clipPath: h.outside(0) }), h.full({ key: 1, clipPath: h.outside(1) })] },
];

function Operations() {
  const [id, setId] = useState("U");
  const op = OPS.find((o) => o.id === id);
  return (
    <section aria-labelledby="t-ops">
      <h2 id="t-ops">Operations sur deux ensembles</h2>
      <div className="panel">
        <div className="seg" role="group" aria-label="Choisir une operation">
          {OPS.map((o) => (
            <button key={o.id} aria-pressed={o.id === id} onClick={() => setId(o.id)}>
              {o.sym}
            </button>
          ))}
        </div>
        <div className="ops-layout">
          <Venn circles={SETS[2]} names={["A", "B"]} draw={op.draw} title={`Zone coloree : ${op.sym}`} />
          <div>
            <h3>{op.nom}</h3>
            <p className="formula">{op.sym}</p>
            <p className="note">{op.txt}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Lois de De Morgan ---------- */
const sub = ["₁", "₂", "₃"];
const names = (n) => range(n).map((i) => `A${sub[i]}`);

const LAWS = {
  inter: {
    label: "(⋂ Aᵢ)ᶜ = ⋃ Aᵢᶜ",
    general: ["(⋂ᵢ₌₁ⁿ Aᵢ)ᶜ", "⋃ᵢ₌₁ⁿ Aᵢᶜ"],
    concrete: (n) => [
      `(${names(n).join(" ∩ ")})ᶜ`,
      names(n).map((a) => `${a}ᶜ`).join(" ∪ "),
    ],
    left: (n) => (h) => h.minus(h.nest(range(n - 1).map(h.inside), h.circ(n - 1))),
    right: (n) => (h) => range(n).map((i) => h.full({ key: i, clipPath: h.outside(i) })),
    leftNote: "Tout E sauf la zone commune à tous les cercles",
    rightNote: "Union des zones situees hors de chaque cercle",
  },
  union: {
    label: "(⋃ Aᵢ)ᶜ = ⋂ Aᵢᶜ",
    general: ["(⋃ᵢ₌₁ⁿ Aᵢ)ᶜ", "⋂ᵢ₌₁ⁿ Aᵢᶜ"],
    concrete: (n) => [
      `(${names(n).join(" ∪ ")})ᶜ`,
      names(n).map((a) => `${a}ᶜ`).join(" ∩ "),
    ],
    left: (n) => (h) => h.minus(range(n).map((i) => h.circ(i, { key: i }))),
    right: (n) => (h) => h.nest(range(n).map(h.outside), h.full()),
    leftNote: "Tout E sauf l’union des cercles.",
    rightNote: "Zone situee hors de tous les cercles a la fois.",
  },
};

function DeMorgan() {
  const [law, setLaw] = useState("inter");
  const [n, setN] = useState(3);
  const L = LAWS[law];
  const [gl, gr] = L.general;
  const [cl, cr] = L.concrete(n);
  return (
    <section aria-labelledby="t-dm">
      <h2 id="t-dm">Lois de De Morgan </h2>
      <div className="panel">
        <div className="seg" role="group" aria-label="Choisir la loi">
          <p className="seg-label">Loi</p>
          {Object.entries(LAWS).map(([k, v]) => (
            <button key={k} aria-pressed={k === law} onClick={() => setLaw(k)}>
              {v.label}
            </button>
          ))}
          <p className="seg-label">Nombre d’ensembles n</p>
          {[2, 3].map((v) => (
            <button key={v} aria-pressed={v === n} onClick={() => setN(v)}>
              n = {v}
            </button>
          ))}
        </div>

        <p className="general formula">{gl} = {gr}</p>

        <div className="pair">
          <figure>
            <Venn circles={SETS[n]} names={names(n)} draw={L.left(n)} title={`Membre de gauche : ${cl}`} />
            <figcaption>
              <span className="formula">{cl}</span>
              <small>{L.leftNote}</small>
            </figcaption>
          </figure>
          <div className="eq" aria-label="egale">=</div>
          <figure>
            <Venn circles={SETS[n]} names={names(n)} draw={L.right(n)} title={`Membre de droite : ${cr}`} />
            <figcaption>
              <span className="formula">{cr}</span>
              <small>{L.rightNote}</small>
            </figcaption>
          </figure>
        </div>
      </div>

    </section>
  );
}

export default function App() {
  return (
    <main className="wrap">
      <header>
        <h1>Diagrammes de Venn et lois de De Morgan</h1>
        <p className="lead">
          Le carre E est l’ensemble de reference. Choisissez une operation pour voir la zone correspondante
        </p>
      </header>
      <Operations />
      <DeMorgan />
      <footer className="footer">
        Designed &amp; Built with{" "}
        <span role="img" aria-label="amour">❤️</span>
        <br />
        by <a href="https://github.com/abdelhakezzitouni">Abdelhak Ezzitouni</a>
      </footer>
    </main>
  );
}
