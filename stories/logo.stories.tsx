import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Logo } from "@/components/logo";

const meta = {
  title: "Design System/Logo",
  component: Logo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Logo priority />
  ),
};
