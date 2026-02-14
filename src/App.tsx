import { GatewayScreen, OceanBg } from "./components";
import DashboardView from "./components/DashboardView";
import { GatewayProvider, useGateway } from "./context/GatewayContext";

function AppContent() {
  const {
    connectionState,
    connectionError,
    connectionPhase,
    deviceId,
    connect,
    retryPairing,
    serverInfo,
    helloPayload,
  } = useGateway();

  const showDashboard = connectionPhase === "connected";

  if (showDashboard) {
    return <DashboardView />;
  }

  return (
    <>
      <OceanBg />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "'Courier New', monospace",
        }}
      >
        <GatewayScreen
          connectionState={
            connectionPhase === "syncing"
              ? "syncing"
              : connectionPhase === "pairing"
                ? "pairing"
                : connectionState
          }
          connectionError={connectionError}
          serverInfo={serverInfo}
          helloPayload={helloPayload}
          onStartConnect={(url: string, token?: string) => connect(url, token)}
          onRetryPairing={retryPairing}
          onConnect={() => {
            /* dashboard will show automatically via state */
          }}
          deviceId={deviceId}
        />
      </div>
    </>
  );
}

export default function App() {
  return (
    <GatewayProvider>
      <AppContent />
    </GatewayProvider>
  );
}
