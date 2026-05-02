"use client";

type TransactionFiltersProps = {
  endDate: string;
  setEndDate: (value: string) => void;
  setStartDate: (value: string) => void;
  startDate: string;
};

export function TransactionFilters({
  endDate,
  setEndDate,
  setStartDate,
  startDate,
}: TransactionFiltersProps) {
  return (
    <section className="panel-section">
      <div className="list-panel-header" style={{ border: 0, padding: 0 }}>
        <div>
          <h2>Filtros</h2>
          <p>Refine lançamentos por período</p>
        </div>
      </div>
      <div className="toolbar-row">
      <input
        onChange={(event) => setStartDate(event.target.value)}
        type="date"
        value={startDate}
      />
      <input onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
      <button
        className="small-action"
        onClick={() => {
          setStartDate("");
          setEndDate("");
        }}
        type="button"
      >
        Limpar
      </button>
      </div>
    </section>
  );
}
