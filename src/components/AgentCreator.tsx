import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { EditAgentData } from "../types";
import { C } from "./constants";
import LobsterAvatar from "./LobsterAvatar";
import PanelHeader from "./PanelHeader";
import {
  btnPrimaryStyle,
  btnSecondaryStyle,
  counterStyle,
  inputStyle,
  labelStyle,
} from "./styles";

const containerStyle = { padding: 20, width: 400 };

function PropertySheet({
  name,
  setName,
  color,
  setColor,
  editAgent,
  onUpdate,
  onCancel,
  deploying,
  deployError,
  setDeploying,
  setDeployError,
}: {
  name: string;
  setName: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  editAgent: EditAgentData;
  onUpdate?: (data: EditAgentData) => Promise<void>;
  onCancel?: () => void;
  deploying: boolean;
  deployError: string | null;
  setDeploying: (v: boolean) => void;
  setDeployError: (v: string | null) => void;
}) {
  const { t } = useTranslation();
  const [editingField, setEditingField] = useState<string | null>(null);
  const colors = [
    "#e74c3c",
    "#ff6b8a",
    "#f4a261",
    "#2ecc71",
    "#1abc9c",
    "#5dade2",
    "#9b59b6",
    "#e67e22",
  ];

  const pencilBtn = (field: string) => (
    <button
      type="button"
      onClick={() => setEditingField(editingField === field ? null : field)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: 14,
        color: editingField === field ? C.green : C.textDim,
        padding: "2px 6px",
        flexShrink: 0,
      }}
    >
      {editingField === field ? "\u2713" : "\u270E"}
    </button>
  );

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: `1px solid rgba(255,255,255,0.05)`,
    gap: 12,
  };

  const handleSave = async () => {
    if (deploying) {
      return;
    }
    setDeploying(true);
    setDeployError(null);
    try {
      await onUpdate?.({ ...editAgent, name, color });
    } catch (err: unknown) {
      setDeployError(
        err instanceof Error ? err.message : t("creator.updateFailed"),
      );
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Avatar + color row */}
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: `${color}10`,
            border: `1px solid ${color}25`,
            borderRadius: 4,
            padding: 6,
          }}
        >
          <LobsterAvatar color={color} size={48} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>{t("creator.shellColor")}</span>
          <div
            style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}
          >
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 3,
                  background: c,
                  border:
                    color === c ? "2px solid #fff" : "2px solid transparent",
                  cursor: "pointer",
                  transform: color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid rgba(255,255,255,0.06)`,
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
        }}
      >
        {/* NAME row */}
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: C.amber,
              fontWeight: "bold",
              width: 60,
              flexShrink: 0,
            }}
          >
            {t("creator.nameLabel")}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingField === "name" ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 12))}
                maxLength={12}
                style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingField(null);
                  }
                }}
              />
            ) : (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  color,
                  letterSpacing: 1,
                }}
              >
                {name.toUpperCase() || "---"}
              </span>
            )}
          </div>
          {pencilBtn("name")}
        </div>
      </div>

      {/* Error */}
      {deployError && (
        <div
          style={{
            fontSize: 10,
            color: C.red,
            marginTop: 12,
            textAlign: "center",
            padding: "6px 10px",
            background: `${C.red}10`,
            border: `1px solid ${C.red}30`,
            borderRadius: 3,
          }}
        >
          {deployError}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ ...btnSecondaryStyle, flex: 1 }}
        >
          {t("creator.cancel")}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={deploying || name.trim().length === 0}
          style={{
            ...btnPrimaryStyle(C.green),
            flex: 2,
            opacity: deploying || name.trim().length === 0 ? 0.5 : 1,
            cursor: deploying ? "wait" : "pointer",
          }}
        >
          {deploying ? t("creator.saving") : t("creator.save")}
        </button>
      </div>
    </div>
  );
}

export default function AgentCreator({
  onDeploy,
  editAgent,
  onUpdate,
  onCancel,
}: {
  onDeploy?: (data: { name: string; color: string }) => Promise<void>;
  editAgent?: EditAgentData;
  onUpdate?: (data: EditAgentData) => Promise<void>;
  onCancel?: () => void;
}) {
  const { t } = useTranslation();
  const isEdit = !!editAgent;
  const [name, setName] = useState(editAgent?.name || "");
  const [color, setColor] = useState(editAgent?.color || "#e74c3c");
  const [phase, setPhase] = useState("edit");
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const colors = [
    "#e74c3c",
    "#ff6b8a",
    "#f4a261",
    "#2ecc71",
    "#1abc9c",
    "#5dade2",
    "#9b59b6",
    "#e67e22",
  ];

  const isValid = name.trim().length > 0;

  // --- Edit mode: property sheet ---
  if (isEdit) {
    return (
      <PropertySheet
        name={name}
        setName={setName}
        color={color}
        setColor={setColor}
        editAgent={editAgent}
        onUpdate={onUpdate}
        onCancel={onCancel}
        deploying={deploying}
        deployError={deployError}
        setDeploying={setDeploying}
        setDeployError={setDeployError}
      />
    );
  }

  // --- Deployed phase ---
  if (phase === "deployed") {
    return (
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "32px 0 16px",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 80,
              background: `${C.green}15`,
              border: `3px solid ${C.green}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.4s ease",
            }}
          >
            <span style={{ fontSize: 36, color: C.green }}>{"\u2713"}</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: C.green,
                letterSpacing: 2,
              }}
            >
              {t("creator.agentDeployed")}
            </div>
            <div
              style={{ fontSize: 12, color, marginTop: 6, fontWeight: "bold" }}
            >
              {name.toUpperCase()}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
              {t("creator.joinedPod")}
            </div>
          </div>
          <LobsterAvatar color={color} size={56} />
          <button
            type="button"
            onClick={() => {
              setPhase("edit");
              setName("");
              setDeployError(null);
            }}
            style={{ ...btnPrimaryStyle(C.amber), marginTop: 8 }}
          >
            {t("creator.spawnAnother")}
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>
    );
  }

  // --- Deploy handler ---
  const handleDeploy = async () => {
    if (deploying) {
      return;
    }
    setDeploying(true);
    setDeployError(null);
    try {
      await onDeploy?.({ name, color });
      setPhase("deployed");
    } catch (err: unknown) {
      setDeployError(
        err instanceof Error ? err.message : t("creator.deployFailed"),
      );
    } finally {
      setDeploying(false);
    }
  };

  // --- Preview phase ---
  if (phase === "preview") {
    const specRows = [
      { label: t("creator.specDesignation"), value: name.toUpperCase() },
      {
        label: t("creator.specShellColor"),
        value: color,
        isColor: true,
      },
      { label: t("creator.specMode"), value: t("creator.specModeValue") },
      {
        label: t("creator.specPodAssignment"),
        value: t("creator.specPodAssignmentValue"),
      },
      {
        label: t("creator.specBootTime"),
        value: t("creator.specBootTimeValue"),
      },
    ];
    return (
      <div style={containerStyle}>
        <PanelHeader icon={"\uD83D\uDD0D"} title={t("creator.previewTitle")} />
        <div
          style={{
            background: `linear-gradient(135deg, ${C.deep1}, ${C.deep2})`,
            border: `1px solid ${color}30`,
            borderRadius: 6,
            padding: 20,
            marginBottom: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 60,
              height: 60,
              background: `linear-gradient(135deg, transparent 50%, ${color}10 50%)`,
            }}
          />
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div
              style={{
                background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
                padding: 8,
                borderRadius: 6,
                border: `1px solid ${color}25`,
              }}
            >
              <LobsterAvatar color={color} size={64} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color,
                    letterSpacing: 2,
                  }}
                >
                  {name.toUpperCase()}
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 2,
                    background: `${C.amber}15`,
                    border: `1px solid ${C.amber}40`,
                    fontSize: 8,
                    color: C.amber,
                    letterSpacing: 1,
                  }}
                >
                  {t("creator.newBadge")}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 4,
            padding: 14,
            marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: C.textDim,
              letterSpacing: 2,
              marginBottom: 10,
            }}
          >
            {t("creator.deploymentSpecs")}
          </div>
          {specRows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderBottom:
                  i < specRows.length - 1
                    ? "1px solid rgba(255,255,255,0.03)"
                    : "none",
                fontSize: 10,
              }}
            >
              <span style={{ color: C.textDim }}>{row.label}</span>
              <span
                style={{
                  color: row.isColor ? row.value : C.text,
                  fontWeight: "bold",
                }}
              >
                {row.isColor ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: row.value,
                        display: "inline-block",
                      }}
                    />
                    {row.value}
                  </span>
                ) : (
                  row.value
                )}
              </span>
            </div>
          ))}
        </div>
        {deployError && (
          <div
            style={{
              fontSize: 10,
              color: C.red,
              marginBottom: 8,
              textAlign: "center",
              padding: "6px 10px",
              background: `${C.red}10`,
              border: `1px solid ${C.red}30`,
              borderRadius: 3,
            }}
          >
            {deployError}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setDeployError(null);
              setPhase("edit");
            }}
            style={{ ...btnSecondaryStyle, flex: 1 }}
          >
            {t("creator.editBack")}
          </button>
          <button
            type="button"
            onClick={handleDeploy}
            disabled={deploying}
            style={{
              ...btnPrimaryStyle(C.green),
              flex: 2,
              opacity: deploying ? 0.6 : 1,
              cursor: deploying ? "wait" : "pointer",
            }}
          >
            {deploying ? t("creator.deploying") : t("creator.confirmDeploy")}
          </button>
        </div>
      </div>
    );
  }

  // --- Create form ---
  return (
    <div style={containerStyle}>
      <PanelHeader icon={"\u2726"} title={t("creator.spawnNewTitle")} />
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: `${color}10`,
            border: `1px solid ${color}25`,
            borderRadius: 4,
            padding: 6,
          }}
        >
          <LobsterAvatar color={color} size={48} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>{t("creator.shellColor")}</span>
          <div
            style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}
          >
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 3,
                  background: c,
                  border:
                    color === c ? "2px solid #fff" : "2px solid transparent",
                  cursor: "pointer",
                  transform: color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <label style={labelStyle} htmlFor="agent-name">
        {t("creator.agentDesignation")}
      </label>
      <input
        id="agent-name"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 12))}
        placeholder={t("creator.namePlaceholder")}
        maxLength={12}
        style={inputStyle}
      />
      <div style={counterStyle}>{name.length}/12</div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          style={{
            ...btnSecondaryStyle,
            width: "100%",
            marginBottom: 8,
          }}
        >
          {t("creator.cancelWithIcon")}
        </button>
      )}
      <button
        type="button"
        onClick={() => isValid && setPhase("preview")}
        disabled={!isValid}
        style={{
          ...btnPrimaryStyle(isValid ? color : "#444"),
          width: "100%",
          opacity: isValid ? 1 : 0.35,
          cursor: isValid ? "pointer" : "not-allowed",
        }}
      >
        {t("creator.previewNext")}
      </button>
      {!isValid && (
        <div
          style={{
            fontSize: 9,
            color: C.textDim,
            marginTop: 6,
            textAlign: "center",
          }}
        >
          {t("creator.fillInName")}
        </div>
      )}
    </div>
  );
}
