import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { TabButton } from "@/components/ui/tab-button";

const meta = {
  title: "Design System/Tab Button",
  component: TabButton,
  args: {
    count: 4,
    label: "History",
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof TabButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};
