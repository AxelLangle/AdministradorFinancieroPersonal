"use client";

import React, { useEffect, useRef, useState } from "react";
import { formatNumberWithCommas } from "@/lib/finance/engine";
import { X } from "lucide-react";

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
  const rawInt = parts[0];

  let intFormatted = "";
  if (parts.length > 1) {
    // Si tiene decimal, conservar "0" antes del punto (ej. 0.50), si no quitar ceros iniciales
    const normalizedInt = rawInt.replace(/^0+(?=\d)/, "") || "0";
    intFormatted = normalizedInt.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const decPart = parts.slice(1).join("").slice(0, 2);
    return `${intFormatted}.${decPart}`;
  }

  // Sin punto decimal: si comienza con ceros seguidos de dígito(s), desaparecer los ceros
  const stripped = rawInt.replace(/^0+(?=\d)/, "");
  const collapsedZero = stripped.replace(/^0{2,}$/, "0");
  intFormatted = collapsedZero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return intFormatted;
}

function toDisplayFromProp(value: number | string): string {
  if (value === "" || value === null || value === undefined) return "";
  const num =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(num) || num === 0) return "";
  return formatNumberWithCommas(num, 2);
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [displayValue, setDisplayValue] = useState<string>(() =>
    toDisplayFromProp(value)
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(toDisplayFromProp(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    if (!displayValue) return;

    const plain = displayValue.replace(/,/g, "");
    const num = Number(plain);
    if (Number.isNaN(num) || num === 0) {
      setDisplayValue("");
      return;
    }

    // Quitar ".00" al enfocar para que en móvil el cursor no quede atrapado tras los decimales
    if (/\.00$/.test(displayValue)) {
      setDisplayValue(displayValue.replace(/\.00$/, ""));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Si existía un valor en cero residual ("0" o "0.00") y se empieza a escribir un dígito, limpiar el cero
    const prevNumeric = Number((displayValue || "0").replace(/,/g, ""));
    if (prevNumeric === 0 && displayValue !== "") {
      const onlyNewDigits = raw.replace(/[^0-9.]/g, "").replace(/^0+\.?0*/, "");
      if (onlyNewDigits) {
        raw = onlyNewDigits;
      }
    }

    const formatted = formatLiveCurrencyString(raw);
    setDisplayValue(formatted);

    const plainNumberStr = formatted.replace(/,/g, "");
    const numericVal = Number(plainNumberStr) || 0;
    onChange(plainNumberStr, numericVal);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!displayValue) {
      onChange("", 0);
      return;
    }
    const num = Number(displayValue.replace(/,/g, ""));
    if (Number.isNaN(num) || num === 0) {
      setDisplayValue("");
      onChange("", 0);
      return;
    }
    const fullFormatted = formatNumberWithCommas(num, 2);
    setDisplayValue(fullFormatted);
    onChange(num.toFixed(2), num);
  };

  const handleClear = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDisplayValue("");
    onChange("", 0);
    inputRef.current?.focus();
  };

  const showClearButton = !inputClassName && displayValue !== "";

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#68736B] select-none pointer-events-none">
        {prefix}
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="decimal"
        required={required}
        value={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={
          inputClassName ||
          `w-full ${prefix.length > 1 ? "pl-11" : "pl-9"} ${
            showClearButton ? "pr-11" : "pr-4"
          } py-3 rounded-xl bg-[#F0F1EB] border border-[#E4E6DE] text-2xl font-bold tabular-nums text-[#26332D] placeholder:text-[#68736B]/50 placeholder:font-normal placeholder:text-base focus:outline-none focus:border-[#34483D]`
        }
      />
      {showClearButton && (
        <button
          type="button"
          onMouseDown={handleClear}
          onTouchStart={handleClear}
          aria-label="Limpiar cantidad"
          title="Limpiar cantidad"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E4E6DE]/80 hover:bg-[#E4E6DE] text-[#68736B] hover:text-[#26332D] flex items-center justify-center cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
