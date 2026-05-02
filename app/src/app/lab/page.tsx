"use client";

import { useEffect, useState } from "react";

export default function LabPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("rm_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("rm_theme", next);
    setTheme(next);
    window.location.reload();
  };

  const fakeAreaDrag = () => {
    const overlay = document.querySelector<HTMLElement>(".rm-area-selector");
    if (!overlay) {
      console.warn("[lab] area selector not active");
      return;
    }
    const fire = (type: "mousedown" | "mousemove" | "mouseup", x: number, y: number) => {
      overlay.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          button: 0,
        })
      );
    };
    fire("mousedown", 300, 300);
    requestAnimationFrame(() => {
      fire("mousemove", 700, 600);
      requestAnimationFrame(() => {
        fire("mouseup", 700, 600);
      });
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme === "dark" ? "#000" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        nextjs-portal { display: none !important; }
        .agentation-top, [class*="agentation"] { display: none !important; }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          padding: 16,
          backgroundColor: theme === "dark" ? "#222" : "#f5f5f5",
          borderRadius: 8,
          border: `1px solid ${theme === "dark" ? "#333" : "#ddd"}`,
          zIndex: 1000001,
        }}
      >
        <h1 style={{ margin: "0 0 12px", fontSize: 14 }}>Morph Lab</h1>
        <button
          onClick={toggleTheme}
          style={{
            display: "block",
            marginBottom: 8,
            padding: "4px 8px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Toggle Theme (current: {theme})
        </button>
        <button
          onClick={fakeAreaDrag}
          style={{
            display: "block",
            marginBottom: 8,
            padding: "4px 8px",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Fake area drag (run after Screenshot)
        </button>
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
          Reduced motion: use OS-level toggle.
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          height: 300,
          border: `2px dashed ${theme === "dark" ? "#444" : "#ccc"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
        }}
      >
        <p style={{ opacity: 0.5 }}>Drag target for area selector</p>
      </div>
    </div>
  );
}
