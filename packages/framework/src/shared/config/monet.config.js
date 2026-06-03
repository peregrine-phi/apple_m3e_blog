// 单一事实来源：Monet 配色预设与变体配置
// 被 src/utils/monet.ts 和 scripts/generate-monet.mjs 共同引用

export const monetConfig = {
  /** 默认种子色，与 presets[0] 保持一致 */
  defaultSeed: "#6750A4",

  presets: [
    { name: "monet", seed: "#6750A4", secondary: "#9575CD" },
    { name: "ocean",      seed: "#006C52", secondary: "#26A69A" },
    { name: "coral",      seed: "#BA1A1A", secondary: "#FF5252" },
    { name: "sapphire",   seed: "#3B5CF6", secondary: "#64B5F6" },
    { name: "amber",      seed: "#825500", secondary: "#FFB74D" },
    { name: "rose",       seed: "#A0004B", secondary: "#F06292" },
    { name: "mint",       seed: "#006C4C", secondary: "#81C784" },
    { name: "plum",       seed: "#7A0065", secondary: "#BA68C8" },
  ],

  variants: [
    { value: "tonalSpot",  label: "Tonal Spot" },
    { value: "expressive", label: "Expressive" },
    { value: "vibrant",    label: "Vibrant" },
    { value: "content",    label: "Content" },
    { value: "monochrome", label: "Monochrome" },
  ],
};
