// 单一事实来源：Monet 配色预设与变体配置
// 被 src/utils/monet.ts 和 scripts/generate-monet.mjs 共同引用

export const monetConfig = {
  /** 默认种子色，同时也是主题色 meta 标签 of the default value */
  defaultSeed: "#3B5CF6",

  presets: [
    { name: "m3-default", seed: "#6750A4" },
    { name: "ocean",      seed: "#006C52" },
    { name: "coral",      seed: "#BA1A1A" },
    { name: "sapphire",   seed: "#3B5CF6" },
    { name: "amber",      seed: "#825500" },
    { name: "rose",       seed: "#A0004B" },
    { name: "mint",       seed: "#006C4C" },
    { name: "plum",       seed: "#7A0065" },
  ],

  variants: [
    { value: "tonalSpot",  label: "Tonal Spot" },
    { value: "expressive", label: "Expressive" },
    { value: "vibrant",    label: "Vibrant" },
    { value: "content",    label: "Content" },
    { value: "monochrome", label: "Monochrome" },
  ],
};
