"use client";

import React, { useEffect, useState } from "react";
import { formatNumberWithCommas } from "@/lib/finance/engine";

interface CurrencyInputProps {
  value: number | string;
  onChange: (rawNumericString: string, numericValue: number) => void;
  prefix?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
}

function formatLiveCurrencyString(raw: string): string {
  // Permitir solo dígitos y un único punto decimal
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";

  const parts = cleaned.split(".");
  const intRaw = parts[0].replace(/^0+(?=\d)/, "");
  const intFormatted = (intRaw || (parts.length > 1 ? "0" : "")).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ","
  );

  if (parts.length > 1) {
    const decPart = parts.slice(1).join("").slice(0, 2);
    return `${intFormatted}.${decPart}`;
  }
  return intFormatted;
}

export function CurrencyInput({
  value,
  onChange,
  prefix = "$",
  placeholder = "Ej. 1,500.00",
  required = false,
  className = "",
  inputClassName = "",
  id,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === "" || value === null || value === undefined) return "";
    const num = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
    if (Number.isNaN(num)) return "";
    if (num === 0 && String(value) === "") return "";
    return formatLiveCurrencyString(String(value));
  });

  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (value === "" || value === null || value === undefined) {
        setDisplayValue("");
        return;
      }
      const num =
        typeof value === "number"
          ? value
          : Number(String(value).replace(/,/g, ""));
      if (!Number.isNaN(num)) {
        setDisplayValue(num === 0 && String(value) === "0" ? "0.00" : formatNumberWithCommas(num, 2));
      }
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatLiveCurrencyString(raw);
    setDisplayValue(formatted);

    const plainNumberStr = formatted.replace(/,/g, "");
    const numericVal = Number(plainNumberStr) || 0;
    onChange(plainNumberStr, numericVal);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!displayValue) return;
    const num = Number(displayValue.replace(/,/g, ""));
    if (!Number.isNaN(num)) {
      const fullFormatted = formatNumberWithCommas(num, 2);
      setDisplayValue(fullFormatted);
      onChange(num.toFixed(2), num);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#68736B] select-none pointer-events-none">
        {prefix}
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        required={required}
        value={displayValue}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={
          inputClassName ||
          `w-full ${
            prefix.length > 1 ? "pl-11" : "pl-9"
          } pr-4 py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-2xl font-bold tabular-nums text-[#26332D] placeholder:text-[#68736B]/50 placeholder:font-normal placeholder:text-base focus:outline-none focus:border-[#34483D]`
        }
      />
    </div>
  );
}
