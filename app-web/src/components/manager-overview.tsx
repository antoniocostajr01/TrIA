import {
  categories,
  targets,
  stockStatus,
  type Shelter,
  type Entry,
} from "@/lib/demo-data";
export function ManagerOverview({
  shelter,
  entries,
  recycled,
  alertCount,
}: {
  shelter: Shelter;
  entries: Entry[];
  recycled: number;
  alertCount: number;
}) {
  const localEntries = entries.filter((e) => e.shelterId === shelter.id);
  const needs = categories.filter(
    (c) => stockStatus(c.id, shelter.stock[c.id]) === "critical",
  );
  const metrics = [
    [
      "Registros neste abrigo",
      localEntries.length,
      "Entradas manuais neste navegador",
    ],
    ["Categorias em falta", needs.length, "Prioridades no cenário atual"],
    ["Têxteis para reciclagem", recycled, "Peças no lote de toda a rede"],
    ["Alertas na rede", alertCount, "Pedidos no mural demonstrativo"],
  ];
  return (
    <section className="manager-overview" id="visao-geral">
      <div className="manager-metrics">
        {metrics.map(([label, value, hint], i) => (
          <article key={label} className={`metric-card metric-${i}`}>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </div>
      <div className="overview-panels">
        <section className="panel coverage-panel">
          <div className="section-heading">
            <h2>Estoque em perspectiva</h2>
            <span className="chart-legend">% da referência</span>
          </div>
          <div
            className="coverage-chart"
            role="img"
            aria-label={categories
              .map(
                (c) =>
                  `${c.label}: ${Math.round((shelter.stock[c.id] / targets[c.id]) * 100)}% da referência demonstrativa`,
              )
              .join(". ")}
          >
            {categories.map((c) => {
              const pct = Math.round(
                (shelter.stock[c.id] / targets[c.id]) * 100,
              );
              return (
                <div className="chart-column" key={c.id}>
                  <span>{pct}%</span>
                  <div className="bar-space">
                    <div
                      className={pct < 40 ? "low" : ""}
                      style={{
                        height: `${Math.max(3, Math.min(pct, 200) / 2)}%`,
                      }}
                    />
                  </div>
                  <small>{c.short}</small>
                </div>
              );
            })}
          </div>
          <p className="chart-caption">
            Referências ilustrativas por categoria. Barras limitadas a 200%. As
            unidades não são somadas.
          </p>
        </section>
        <section className="panel priority-panel">
          <h2>O que mais precisamos agora</h2>
          <p className="muted">Prioridades de {shelter.name}.</p>
          <div className="priority-list">
            {needs.length ? (
              needs.map((c) => (
                <div key={c.id}>
                  <span className="priority-name">
                    <c.icon size={18} />
                    {c.label}
                  </span>
                  <strong>
                    {shelter.stock[c.id]} <small>{c.unit}</small>
                  </strong>
                  <div className="priority-track">
                    <span
                      style={{
                        width: `${(shelter.stock[c.id] / targets[c.id]) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="no-priorities">
                Nenhuma categoria em nível crítico neste cenário.
              </p>
            )}
          </div>
          <div className="priority-note">
            Uma doação direcionada ajuda a equilibrar a rede.
          </div>
        </section>
      </div>
    </section>
  );
}
