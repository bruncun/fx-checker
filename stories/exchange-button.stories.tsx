import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ExchangeButton } from "@/components/ui/exchange-button";

const meta = {
  title: "Design System/Exchange Button",
  component: ExchangeButton,
  args: {
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ExchangeButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
