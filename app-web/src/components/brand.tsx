/** Ícone exportado do Figma, nó 31:223 (B2 · Três pilhas glass). */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`tria-brand ${compact ? "compact" : ""}`}>
      <img
        src="/brand/tria-glass.png"
        data-figma-node="31:223"
        width={48}
        height={48}
        alt=""
      />
      <span>
        <strong>tria</strong>
        {!compact && <small>triagem de doações</small>}
      </span>
    </span>
  );
}
