import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { DeleteButton } from "@/components/ui/delete-button";

const meta = {
  title: "Design System/Delete Button",
  component: DeleteButton,
  args: {
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DeleteButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
