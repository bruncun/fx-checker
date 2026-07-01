import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { FavoriteButton } from "@/components/ui/favorite-button";

const meta = {
  title: "Design System/Favorite Button",
  component: FavoriteButton,
  args: {
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof FavoriteButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pinned: Story = {
  args: {
    pinned: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Icon: Story = {
  args: {
    variant: "icon",
  },
};

export const IconPinned: Story = {
  args: {
    pinned: true,
    variant: "icon",
  },
};
