export default function Skeleton({ rows = 3 }) {
  return (
    <div className="skeleton-stack">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-row" key={index}>
          <span />
          <div><i /><b /></div>
        </div>
      ))}
    </div>
  );
}
