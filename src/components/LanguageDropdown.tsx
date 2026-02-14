import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  languageNames,
  languageToCountry,
  SUPPORTED_LANGUAGES,
} from "../i18n/languages";
import { C } from "./constants";
import FlagIcon from "./FlagIcon";
import { btnSecondaryStyle } from "./styles";

export default function LanguageDropdown() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.includes(
    i18n.language as (typeof SUPPORTED_LANGUAGES)[number],
  )
    ? (i18n.language as (typeof SUPPORTED_LANGUAGES)[number])
    : "en";

  useEffect(() => {
    if (!open) {
      return;
    }
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const checkScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    setCanScroll(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    if (open) {
      checkScroll();
    }
  }, [open, checkScroll]);

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 300 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...btnSecondaryStyle,
          fontSize: 11,
          padding: "4px 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: C.textDim,
          borderColor: `${C.textDim}40`,
        }}
      >
        <FlagIcon countryCode={languageToCountry[currentLang]} size={12} />
        <span style={{ textTransform: "uppercase" }}>{currentLang}</span>
        <span style={{ fontSize: 8 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            background: C.uiBg2,
            border: `2px solid ${C.uiBorder}`,
            borderRadius: 4,
            minWidth: 180,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          <div
            ref={listRef}
            className="thin-scroll"
            onScroll={checkScroll}
            style={{
              padding: "4px 0",
              maxHeight: 320,
              overflowY: "auto",
            }}
          >
            {SUPPORTED_LANGUAGES.map((code) => {
              const isActive = code === currentLang;
              return (
                <button
                  type="button"
                  key={code}
                  onClick={() => {
                    i18n.changeLanguage(code);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "6px 12px",
                    background: isActive ? `${C.amber}15` : "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: isActive ? C.amber : C.text,
                    fontFamily: "'Courier New', monospace",
                    fontSize: 11,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isActive
                      ? `${C.amber}15`
                      : "transparent";
                  }}
                >
                  <FlagIcon countryCode={languageToCountry[code]} size={12} />
                  <span style={{ flex: 1 }}>{languageNames[code]}</span>
                  <span style={{ fontSize: 9, color: C.textDim }}>
                    {code.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
          {canScroll && (
            <div
              style={{
                borderTop: `1px solid ${C.uiBorder}`,
                padding: "5px 12px",
                fontSize: 9,
                color: C.textDim,
                textAlign: "center",
                fontFamily: "'Courier New', monospace",
              }}
            >
              ▼ Scroll for more
            </div>
          )}
        </div>
      )}
    </div>
  );
}
