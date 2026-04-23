"use client";

import { ArrowUpDown, Info } from "lucide-react";
import { useMemo, useState } from "react";

const units = {
  mm: 1,
  cm: 10,
  m: 1000,
  km: 1000000,
};

type Unit = keyof typeof units;

export function ConvertForm() {
  const [value, setValue] = useState("100");
  const [fromUnit, setFromUnit] = useState<Unit>("m");
  const [toUnit, setToUnit] = useState<Unit>("mm");

  const numericValue = Number(value) || 0;
  const converted = useMemo(() => {
    const mmValue = numericValue * units[fromUnit];
    return mmValue / units[toUnit];
  }, [fromUnit, numericValue, toUnit]);

  const resultList = useMemo(() => {
    const mmValue = numericValue * units[fromUnit];
    return (Object.entries(units) as [Unit, number][])
      .filter(([unit]) => unit !== fromUnit)
      .map(([unit, factor]) => ({
        unit,
        value: mmValue / factor,
      }));
  }, [fromUnit, numericValue]);

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="convert-layout">
      <section className="detail-card">
        <div className="field-group">
          <label htmlFor="fromValue">변환할 값</label>
          <div className="field-row">
            <input
              id="fromValue"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              inputMode="decimal"
            />
            <select value={fromUnit} onChange={(event) => setFromUnit(event.target.value as Unit)}>
              {Object.keys(units).map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="button" className="swap-button" onClick={swapUnits} aria-label="단위 바꾸기">
          <ArrowUpDown size={18} />
        </button>

        <div className="field-group">
          <label htmlFor="toValue">변환 결과</label>
          <div className="field-row">
            <input id="toValue" value={new Intl.NumberFormat("ko-KR").format(converted)} readOnly />
            <select value={toUnit} onChange={(event) => setToUnit(event.target.value as Unit)}>
              {Object.keys(units).map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="result-list-box">
          <strong>변환 결과 목록</strong>
          <ul>
            {resultList.map((item) => (
              <li key={item.unit}>
                {numericValue} {fromUnit} = {new Intl.NumberFormat("ko-KR").format(item.value)} {item.unit}
              </li>
            ))}
          </ul>
        </div>

        <button type="button" className="reset-link" onClick={() => setValue("100")}>
          초기화
        </button>
      </section>

      <aside className="tip-card">
        <Info size={18} />
        <span>1 m = 1,000 mm</span>
      </aside>
    </div>
  );
}
