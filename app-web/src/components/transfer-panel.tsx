import { PackageCheck, Truck, CheckCircle2 } from "lucide-react";
import {
  categories,
  targets,
  stockStatus,
  type Shelter,
  type CategoryId,
} from "@/lib/demo-data";
export type Transfer = {
  id: string;
  fromId: string;
  toId: string;
  category: CategoryId;
  quantity: number;
  date: string;
};
export function TransferPanel({
  shelters,
  currentId,
  mode,
  transfers,
  onTransfer,
}: {
  shelters: Shelter[];
  currentId: string;
  mode: "receive" | "send";
  transfers: Transfer[];
  onTransfer: (
    from: string,
    to: string,
    category: CategoryId,
    quantity: number,
  ) => void;
}) {
  const suggestions = shelters
    .flatMap((from) =>
      shelters
        .filter(
          (to) =>
            from.id !== to.id &&
            (mode === "receive" ? to.id === currentId : from.id === currentId),
        )
        .flatMap((to) =>
          categories
            .filter(
              (c) =>
                stockStatus(c.id, from.stock[c.id]) === "surplus" &&
                stockStatus(c.id, to.stock[c.id]) === "critical",
            )
            .map((c) => ({
              from,
              to,
              c,
              quantity: Math.floor(
                Math.min(
                  from.stock[c.id] - targets[c.id],
                  targets[c.id] - to.stock[c.id],
                ),
              ),
            })),
        ),
    )
    .slice(0, 3);
  const history = transfers
    .filter((t) => t.fromId === currentId || t.toId === currentId)
    .slice(0, 3);
  return (
    <section className="panel transfer-panel" id="redistribuir">
      <div className="panel-heading">
        <span className="soft-icon">
          <Truck size={23} />
        </span>
        <div>
          <h2>
            {mode === "send"
              ? "Distribuir para a rede"
              : "Redistribuição entre abrigos"}
          </h2>
          <p>Excedentes de um local ajudam onde falta.</p>
        </div>
      </div>

      <div className="transfer-suggestions">
        {suggestions.map(({ from, to, c, quantity }) => (
          <article
            className="transfer-card"
            key={`${from.id}-${to.id}-${c.id}`}
          >
            <div className="transfer-category">
              <c.icon size={21} />
              <strong>
                {quantity} {c.unit} de {c.short.toLowerCase()}
              </strong>
            </div>
            <p>
              <span>De</span> {from.name}
            </p>
            <p>
              <span>Para</span> {to.name}
            </p>
            <button
              className="button primary full"
              onClick={() => onTransfer(from.id, to.id, c.id, quantity)}
            >
              <PackageCheck size={19} />
              {mode === "send" ? "Enviar remessa" : "Receber remessa"}
            </button>
          </article>
        ))}
        {!suggestions.length && (
          <div className="empty-state">
            <CheckCircle2 />
            <h3>Sem remessas pendentes</h3>
            <p>Os estoques estão equilibrados para redistribuição.</p>
          </div>
        )}
      </div>
      {history.length > 0 && (
        <div className="transfer-history">
          <h3>Remessas registradas</h3>
          {history.map((t) => {
            const c = categories.find((c) => c.id === t.category)!;
            return (
              <div key={t.id}>
                <CheckCircle2 size={18} />
                <span>
                  <strong>
                    {t.quantity} {c.unit} de {c.short.toLowerCase()}
                  </strong>
                  <small>
                    {shelters.find((s) => s.id === t.fromId)?.name} →{" "}
                    {shelters.find((s) => s.id === t.toId)?.name}
                  </small>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
