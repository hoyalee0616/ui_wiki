"use client";

import { useState } from "react";

const keys = [
  ["AC", "+/-", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "="],
];

function evaluateExpression(expression: string) {
  const normalized = expression.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");

  try {
    const result = Function(`"use strict"; return (${normalized || "0"});`)();
    return Number.isFinite(result) ? new Intl.NumberFormat("ko-KR").format(result) : "오류";
  } catch {
    return "오류";
  }
}

export function CalculatorPad() {
  const [expression, setExpression] = useState("1234 + 567 × 8");
  const [result, setResult] = useState("5,770");

  const onPress = (value: string) => {
    if (value === "AC") {
      setExpression("");
      setResult("0");
      return;
    }

    if (value === "=") {
      setResult(evaluateExpression(expression));
      return;
    }

    if (value === "+/-") {
      setExpression((prev) => (prev.startsWith("-") ? prev.slice(1) : `-${prev}`));
      return;
    }

    if (value === "%") {
      setExpression((prev) => `${prev}/100`);
      return;
    }

    setExpression((prev) => `${prev}${value}`.trim());
  };

  return (
    <section className="detail-card calculator-shell">
      <div className="calc-display" aria-live="polite">
        <small>{expression || "0"}</small>
        <strong>{result}</strong>
      </div>

      <div className="calculator-grid">
        {keys.flat().map((key) => {
          const className =
            key === "="
              ? "calc-key equals"
              : ["÷", "×", "−", "+"].includes(key)
                ? "calc-key operator"
                : key === "0"
                  ? "calc-key zero"
                  : "calc-key";

          return (
            <button key={key} type="button" className={className} onClick={() => onPress(key)}>
              {key}
            </button>
          );
        })}
      </div>
    </section>
  );
}
