import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Icon, iconAssets, type IconName } from "@/components/ui/icon";

const icons = Object.keys(iconAssets) as IconName[];

const meta = {
  title: "Design System/Icons",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-[24px]">
      {icons.map((iconName) => (
        <Icon key={iconName} iconName={iconName} unoptimized />
      ))}
    </div>
  ),
};
