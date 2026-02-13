// @ts-expect-error -- JSX modules without declarations
import DashboardView from "./components/DashboardView";
// @ts-expect-error -- JSX modules without declarations
import { GatewayScreen, OceanBg } from "./components/open-claw";
// @ts-expect-error -- JSX modules without declarations
import { GatewayProvider, useGateway } from "./context/GatewayContext";

function AppContent() {
  const {
    connectionState,
    connectionError,
    connectionPhase,
    deviceId,
    connect,
    agents,
    serverInfo,
    helloPayload,
  } = useGateway();

  const showDashboard = connectionPhase === "connected" && agents.length > 0;

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
