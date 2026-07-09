type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section
      style={{
        border: "1px solid rgba(148,163,184,0.2)",
        borderRadius: 8,
        padding: 24,
      }}
    >
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  );
}
