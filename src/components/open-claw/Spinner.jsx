export default function Spinner({ color }) {
  return (
    <div style={{
      width: 14, height: 14, border: `2px solid ${color}30`,
      borderTop: `2px solid ${color}`, borderRadius: 14,
      animation: "spin 0.8s linear infinite", flexShrink: 0,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
