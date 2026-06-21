import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";

import { AmountInput } from "@/components/ui/amount-input";
import { fn } from "storybook/test";

const meta = {
  title: "Design System/Amount Input",
  component: AmountInput,
  args: {
    "aria-label": "Amount currencies",
    onChange: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AmountInput>;

export default meta;

type Story = StoryObj<typeof meta>;

function StatefulAmountInput(args: React.ComponentProps<typeof AmountInput>) {
  const [value, setValue] = React.useState(String(args.value ?? ""));

  return (
    <AmountInput
      {...args}
      onChange={(event) => {
        setValue(event.target.value);
        args.onChange?.(event);
      }}
      value={value}
    />
  );
}

export const Empty: Story = {
  render: (args) => <StatefulAmountInput {...args} />,
};

export const Filled: Story = {
  args: {
    value: "1000",
  },
  render: (args) => <StatefulAmountInput {...args} />,
};
