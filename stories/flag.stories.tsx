import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Flag, flagCountryNames, type FlagCountryCode } from "@/components/ui/flag";

const countryCodes = Object.keys(flagCountryNames) as FlagCountryCode[];

const meta = {
  title: "Design System/Flags",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllFlags: Story = {
  render: () => (
    <div className="grid grid-cols-[repeat(auto-fill,24px)] gap-[24px]">
      {countryCodes.map((countryCode) => (
        <Flag key={countryCode} className="size-[24px]" countryCode={countryCode} unoptimized />
      ))}
    </div>
  ),
};
