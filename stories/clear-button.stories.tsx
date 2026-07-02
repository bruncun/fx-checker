import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ClearButton } from "@/components/ui/clear-button";

const meta = {
  title: "Design System/Clear Button",
  component: ClearButton,
  args: {
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ClearButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
