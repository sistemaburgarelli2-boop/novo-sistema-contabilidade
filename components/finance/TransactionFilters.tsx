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
    <div style={{ display: "flex", gap: 12 }}>
      <input
        onChange={(event) => setStartDate(event.target.value)}
        type="date"
        value={startDate}
      />
      <input onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
    </div>
  );
}
