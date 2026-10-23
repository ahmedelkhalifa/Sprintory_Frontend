// Media query for short screens (small laptops, browser zoom, landscape tablets).
// Use it as a key inside sx, after the normal styles:
//   sx={{ py: 4, [SHORT_SCREEN]: { py: 2 } }}
export const SHORT_SCREEN = "@media (max-height: 760px)";
