// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AmountInput, formatAmountValue, getAmountValue } from "./amount-input";

afterEach(() => {
  cleanup();
});

function ControlledAmountInput({
  onChange,
  value: initialValue = "",
}: {
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value?: string;
}) {
  const [value, setValue] = React.useState(initialValue);

  return (
    <AmountInput
      aria-label="Amount"
      onChange={(event) => {
        setValue(event.target.value);
        onChange?.(event);
      }}
      value={value}
    />
  );
}

describe("getAmountValue", () => {
  it("keeps numeric characters and one decimal point", () => {
    expect(getAmountValue("$12a3.45.6")).toBe("123.456");
  });
});

describe("formatAmountValue", () => {
  it("formats numeric values for display", () => {
    expect(formatAmountValue("12345")).toBe("12,345");
  });

  it("formats decimal values for display", () => {
    expect(formatAmountValue("12345.60")).toBe("12,345.60");
  });

  it("preserves a trailing decimal point while editing", () => {
    expect(formatAmountValue("12345.")).toBe("12,345.");
  });

  it("formats values that already include separators and symbols", () => {
    expect(formatAmountValue("$1,2a3.45")).toBe("123.45");
  });
});

describe("AmountInput", () => {
  it("displays the formatted version of the caller value", () => {
    render(<AmountInput aria-label="Amount" value="1234567" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Amount")).toHaveProperty("value", "1,234,567");
  });

  it("formats typed digits for display after callers store the raw value", () => {
    render(<ControlledAmountInput />);

    const input = screen.getByLabelText("Amount");

    fireEvent.change(input, { target: { value: "1234567" } });
    expect(input).toHaveProperty("value", "1,234,567");
  });

  it("removes unsupported characters from typed values", () => {
    render(<ControlledAmountInput />);

    const input = screen.getByLabelText("Amount");

    fireEvent.change(input, { target: { value: "$1,2a3.45" } });

    expect(input).toHaveProperty("value", "123.45");
  });

  it("keeps decimal values while formatting the integer portion", () => {
    render(<ControlledAmountInput />);

    const input = screen.getByLabelText("Amount");

    fireEvent.change(input, { target: { value: "1234567.89" } });

    expect(input).toHaveProperty("value", "1,234,567.89");
  });

  it("preserves a trailing decimal point while typing", () => {
    render(<ControlledAmountInput />);

    const input = screen.getByLabelText("Amount");

    fireEvent.change(input, { target: { value: "1234." } });

    expect(input).toHaveProperty("value", "1,234.");
  });

  it("passes the unformatted value to change handlers", () => {
    const values: string[] = [];

    render(
      <ControlledAmountInput
        onChange={(event) => {
          values.push(event.currentTarget.value);
        }}
      />
    );

    const input = screen.getByLabelText("Amount");

    fireEvent.change(input, { target: { value: "1234567" } });

    expect(values).toEqual(["1234567"]);
  });

  it("passes unformatted decimal values to change handlers", () => {
    const values: string[] = [];

    render(
      <ControlledAmountInput
        onChange={(event) => {
          values.push(event.currentTarget.value);
        }}
      />
    );

    const input = screen.getByLabelText("Amount");

    fireEvent.change(input, { target: { value: "$1,234.50" } });

    expect(values).toEqual(["1234.50"]);
  });

  it("keeps the cursor near the edited digit when inserting in the middle", () => {
    render(<ControlledAmountInput value="12345" />);

    const input = screen.getByLabelText<HTMLInputElement>("Amount");

    input.focus();
    input.setSelectionRange(3, 3);
    fireEvent.change(input, {
      target: {
        selectionStart: 4,
        value: "12,9345",
      },
    });

    expect(input).toHaveProperty("value", "129,345");
    expect(input.selectionStart).toBe(3);
  });

  it("keeps the cursor near the edited digit when deleting in the middle", () => {
    render(<ControlledAmountInput value="12345" />);

    const input = screen.getByLabelText<HTMLInputElement>("Amount");

    input.focus();
    input.setSelectionRange(3, 3);
    fireEvent.change(input, {
      target: {
        selectionStart: 2,
        value: "1,345",
      },
    });

    expect(input).toHaveProperty("value", "1,345");
    expect(input.selectionStart).toBe(1);
  });

  it("moves the cursor to the next digit when deleting a separator with Delete", () => {
    const onChange = vi.fn();

    render(<ControlledAmountInput onChange={onChange} value="12345" />);

    const input = screen.getByLabelText<HTMLInputElement>("Amount");

    input.focus();
    input.setSelectionRange(2, 2);
    fireEvent.keyDown(input, { key: "Delete" });
    fireEvent.change(input, {
      target: {
        selectionStart: 2,
        value: "12345",
      },
    });

    expect(input).toHaveProperty("value", "12,345");
    expect(input.selectionStart).toBe(3);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves the cursor to the previous digit when deleting a separator with Backspace", () => {
    const onChange = vi.fn();

    render(<ControlledAmountInput onChange={onChange} value="12345" />);

    const input = screen.getByLabelText<HTMLInputElement>("Amount");

    input.focus();
    input.setSelectionRange(3, 3);
    fireEvent.keyDown(input, { key: "Backspace" });
    fireEvent.change(input, {
      target: {
        selectionStart: 2,
        value: "12345",
      },
    });

    expect(input).toHaveProperty("value", "12,345");
    expect(input.selectionStart).toBe(2);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves the cursor backward when deleting a separator with Control-H", () => {
    const onChange = vi.fn();

    render(<ControlledAmountInput onChange={onChange} value="12345" />);

    const input = screen.getByLabelText<HTMLInputElement>("Amount");

    input.focus();
    input.setSelectionRange(3, 3);
    fireEvent.keyDown(input, { ctrlKey: true, key: "h" });
    fireEvent.change(input, {
      target: {
        selectionStart: 2,
        value: "12345",
      },
    });

    expect(input).toHaveProperty("value", "12,345");
    expect(input.selectionStart).toBe(2);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves the cursor forward when deleting a separator with Control-D", () => {
    const onChange = vi.fn();

    render(<ControlledAmountInput onChange={onChange} value="12345" />);

    const input = screen.getByLabelText<HTMLInputElement>("Amount");

    input.focus();
    input.setSelectionRange(2, 2);
    fireEvent.keyDown(input, { ctrlKey: true, key: "d" });
    fireEvent.change(input, {
      target: {
        selectionStart: 2,
        value: "12345",
      },
    });

    expect(input).toHaveProperty("value", "12,345");
    expect(input.selectionStart).toBe(3);
    expect(onChange).not.toHaveBeenCalled();
  });
});
