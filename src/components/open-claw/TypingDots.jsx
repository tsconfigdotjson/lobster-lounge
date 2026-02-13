export default function TypingDots({ color }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", height: 12 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: 5,
            background: color,
            animation: `bounce 1s ${i * 0.15}s infinite ease-in-out`,
          }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,60%,100% { transform:translateY(0); opacity:0.3; } 30% { transform:translateY(-4px); opacity:1; } }`}</style>
    </div>
  );
}
