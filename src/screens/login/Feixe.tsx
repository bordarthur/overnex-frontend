// Ilustração da coluna da marca (mockup Login M2.0.0): uma linha em degraus que sobe até o ponto neon.
// Decorativa; não representa dado nenhum.
const DEGRAUS =
  'M0,240L9.0,240.0L9.0,233.5L18.1,233.5L36.1,233.5L54.2,233.5L63.2,233.5L63.2,227.5L72.3,227.5L81.3,227.5L81.3,219.9L90.3,219.9L99.4,219.9L99.4,214.2L108.4,214.2L117.4,214.2L117.4,207.0L126.5,207.0L135.5,207.0L135.5,200.3L144.5,200.3L162.6,200.3L180.6,200.3L189.7,200.3L189.7,194.6L198.7,194.6L216.8,194.6L225.8,194.6L225.8,187.5L234.8,187.5L243.9,187.5L243.9,181.9L252.9,181.9L261.9,181.9L261.9,175.0L271.0,175.0L289.0,175.0L307.1,175.0L316.1,175.0L316.1,169.2L325.2,169.2L334.2,169.2L334.2,163.5L343.2,163.5L352.3,163.5L352.3,156.6L361.3,156.6L370.3,156.6L370.3,148.4L379.4,148.4L388.4,148.4L388.4,142.5L397.4,142.5L415.5,142.5L433.5,142.5L442.6,142.5L442.6,136.3L451.6,136.3L460.6,136.3L460.6,128.8L469.7,128.8L478.7,128.8L478.7,120.3L487.7,120.3L496.8,120.3L496.8,112.9L505.8,112.9L514.8,112.9L514.8,106.2L523.9,106.2L541.9,106.2L560.0,106.2';

export function Feixe() {
  return (
    <div className="feixe" aria-hidden="true">
      <svg viewBox="0 0 590 300" preserveAspectRatio="xMinYMax meet">
        <line className="feixe-grade" x1="0" x2="590" y1="240" y2="240" />
        <line className="feixe-grade" x1="0" x2="590" y1="160" y2="160" strokeDasharray="2 6" />
        <line className="feixe-grade" x1="0" x2="590" y1="80" y2="80" strokeDasharray="2 6" />
        <path className="feixe-degraus" d={DEGRAUS} />
        <circle className="feixe-halo" cx="560" cy="106.2" r="5" />
        <circle className="feixe-ponto" cx="560" cy="106.2" r="5" />
      </svg>
    </div>
  );
}
