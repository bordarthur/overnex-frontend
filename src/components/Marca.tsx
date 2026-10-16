import logoUrl from '../assets/overnex-logo.svg';
import simboloUrl from '../assets/overnex-simbolo.svg';

// Os vetores oficiais ficam em assets/ e são referenciados com <use href="arquivo.svg#id">:
// o arquivo é servido pelo próprio site (sem data: URI) e as letras herdam `color` via currentColor.
const LOGO = { href: `${logoUrl}#ovx-logo`, w: 1074.39, h: 175.16 };
const SIMBOLO = { href: `${simboloUrl}#ovx-sym`, w: 363.95, h: 161.57 };

interface PropsMarca {
  className?: string;
  /** texto alternativo; sem ele a marca é decorativa */
  rotulo?: string;
  preserveAspectRatio?: string;
}

function Vetor({ arte, className, rotulo, preserveAspectRatio }: PropsMarca & { arte: typeof LOGO }) {
  const a11y = rotulo ? { role: 'img', 'aria-label': rotulo } : { 'aria-hidden': true };
  return (
    <svg
      className={className}
      viewBox={`0 0 ${arte.w} ${arte.h}`}
      preserveAspectRatio={preserveAspectRatio}
      {...a11y}
    >
      <use href={arte.href} width={arte.w} height={arte.h} />
    </svg>
  );
}

/** Logotipo completo: símbolo neon + "OVERNEX seu farol de decisões" em currentColor. */
export const Logotipo = (p: PropsMarca) => <Vetor arte={LOGO} {...p} />;

/** Só o símbolo, sempre neon. */
export const Simbolo = (p: PropsMarca) => <Vetor arte={SIMBOLO} {...p} />;
