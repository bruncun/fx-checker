import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SearchInput } from "@/components/ui/search-input";

const meta = {
  title: "Design System/Search Input",
  component: SearchInput,
  args: {
    "aria-label": "Search currencies",
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[min(100vw-48px,720px)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: {
    defaultValue: "Euro",
  },
};
