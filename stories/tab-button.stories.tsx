import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TabButton } from "@/components/ui/tab-button";

const meta = {
  title: "Design System/Tab",
  component: TabButton,
  args: {
    count: 4,
    href: "/",
    label: "History",
    scroll: false,
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
