"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type AmountInputProps = Omit<React.ComponentProps<"input">, "defaultValue" | "type">;
type SeparatorDeleteDirection = "backward" | "forward";

function getAmountValue(value: string) {
  return getAmountValueParts(value).amountValue;
}

function getAmountValueParts(value: string, selectionStart = value.length) {
  let amountValue = "";
  let amountValueBeforeSelection = "";
  let hasDecimal = false;

  for (const [index, character] of Array.from(value).entries()) {
    let acceptedCharacter = "";

    if (/\d/.test(character)) {
      acceptedCharacter = character;
    }

    if (character === "." && !hasDecimal) {
      acceptedCharacter = character;
      hasDecimal = true;
    }

    amountValue += acceptedCharacter;

    if (index < selectionStart) {
      amountValueBeforeSelection += acceptedCharacter;
    }
  }

  return {
    amountValue,
    amountValueBeforeSelection,
  };
}

function formatAmountValue(value: React.ComponentProps<"input">["value"]) {
  if (value === undefined || value === null) {
    return "";
  }

  const amountValue = getAmountValue(String(value));
  const [integer = "", fraction] = amountValue.split(".");
  const hasDecimal = amountValue.includes(".");
  const normalizedInteger = integer.replace(/^0+(?=\d)/, "");
  const formattedInteger =
    normalizedInteger !== ""
      ? normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : hasDecimal
        ? "0"
        : "";

  return hasDecimal ? `${formattedInteger}.${fraction ?? ""}` : formattedInteger;
}

function getFormattedSelectionStart(formattedValue: string, amountValueBeforeSelection: string) {
  if (amountValueBeforeSelection === "") {
    return 0;
  }

  let amountCharacterCount = 0;

  for (const [index, character] of Array.from(formattedValue).entries()) {
    if (/\d|\./.test(character)) {
      amountCharacterCount += 1;
    }

    if (amountCharacterCount === amountValueBeforeSelection.length) {
      return index + 1;
    }
  }

  return formattedValue.length;
}

function getAdjacentAmountCharacterIndex(
  value: string,
  selectionStart: number,
  direction: SeparatorDeleteDirection
) {
  if (direction === "backward") {
    for (let index = selectionStart - 1; index >= 0; index -= 1) {
      if (/\d|\./.test(value[index] ?? "")) {
        return index + 1;
      }
    }

    return 0;
  }

  for (let index = selectionStart; index < value.length; index += 1) {
    if (/\d|\./.test(value[index] ?? "")) {
      return index;
    }
  }

  return value.length;
}

function getSeparatorDeleteDirectionFromInputType(inputType: string) {
  if (/^delete.*Backward$/.test(inputType)) {
    return "backward";
  }

  if (/^delete.*Forward$/.test(inputType)) {
    return "forward";
  }

  return null;
}

function AmountInput({
  className,
  onChange,
  placeholder = "0",
  ref,
  value,
  ...props
}: AmountInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const separatorDeleteDirectionRef = React.useRef<SeparatorDeleteDirection>("forward");
  const pendingSelectionStartRef = React.useRef<number | null>(null);

  function restorePendingSelection() {
    const pendingSelectionStart = pendingSelectionStartRef.current;

    if (pendingSelectionStart === null || inputRef.current === null) {
      return;
    }

    inputRef.current.setSelectionRange(pendingSelectionStart, pendingSelectionStart);
    pendingSelectionStartRef.current = null;
  }

  React.useLayoutEffect(() => {
    restorePendingSelection();
  });

  function setInputRef(input: HTMLInputElement | null) {
    inputRef.current = input;

    if (typeof ref === "function") {
      ref(input);
    } else if (ref) {
      ref.current = input;
    }
  }

  function handleBeforeInput(e: React.InputEvent<HTMLInputElement>) {
    const inputType = (e.nativeEvent as InputEvent).inputType;
    const direction = getSeparatorDeleteDirectionFromInputType(inputType);

    if (direction !== null) {
      separatorDeleteDirectionRef.current = direction;
    }

    props.onBeforeInput?.(e);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key.toLowerCase();

    if (e.key === "Backspace" || (e.ctrlKey && key === "h")) {
      separatorDeleteDirectionRef.current = "backward";
    } else if (e.key === "Delete" || (e.ctrlKey && key === "d")) {
      separatorDeleteDirectionRef.current = "forward";
    }

    props.onKeyDown?.(e);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { amountValue, amountValueBeforeSelection } = getAmountValueParts(
      e.target.value,
      e.target.selectionStart ?? e.target.value.length
    );
    const formattedValue = formatAmountValue(amountValue);
    const currentAmountValue = getAmountValue(String(value ?? ""));

    pendingSelectionStartRef.current = getFormattedSelectionStart(
      formattedValue,
      amountValueBeforeSelection
    );

    if (amountValue === currentAmountValue && e.target.value !== formattedValue) {
      e.target.value = formattedValue;
      pendingSelectionStartRef.current = getAdjacentAmountCharacterIndex(
        formattedValue,
        pendingSelectionStartRef.current,
        separatorDeleteDirectionRef.current
      );
      restorePendingSelection();
      return;
    }

    e.target.value = amountValue;
    onChange?.(e);
  }

  const formattedValue = formatAmountValue(value);

  return (
    <input
      {...props}
      ref={setInputRef}
      type="text"
      inputMode="decimal"
      value={formattedValue}
      onChange={handleChange}
      onBeforeInput={handleBeforeInput}
      onKeyDown={handleKeyDown}
      className={cn(
        "field-sizing-content h-500 border-b border-neutral-600 text-preset-1 text-neutral-50 caret-neutral-50 outline-none placeholder:text-neutral-200 hover:border-neutral-200 focus-visible:-me-050 focus-visible:rounded-8 focus-visible:border-transparent focus-visible:bg-neutral-600 focus-visible:pe-050 focus-visible:caret-neutral-50 focus-visible:shadow-[0_0_0_2px_hsl(var(--neutral-600)),0_0_0_4px_hsl(var(--lime-500))]",
        className
      )}
      placeholder={placeholder}
    />
  );
}

export { AmountInput, formatAmountValue, getAmountValue };
