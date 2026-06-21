import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { CurrencyButton } from "@/components/ui/currency-button";

const meta = {
  title: "Design System/Currency Button",
  component: CurrencyButton,
  args: {
    countryCode: "us",
    currencyCode: "USD",
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof CurrencyButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
