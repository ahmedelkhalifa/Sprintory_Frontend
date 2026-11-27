// An outlined filter button (the Filter window's button, a toggle like Blocked only / Hide done): 40px tall, and
// blue when `on` (a filter is picked, the toggle is on). The theme turns every outlined button neutral with a
// three-class selector (MuiButton in theme.js), which wins over a plain `sx`; the "on" look uses the same selector,
// so it shows. Use with variant="outlined" color="primary".
export const filterButtonSx = (on) => ({
  height: 40,
  fontWeight: 600,
  ...(on && {
    "&.MuiButton-outlined.MuiButton-colorPrimary": {
      color: "navActive.text",
      borderColor: "primary.main",
      bgcolor: "navActive.background",
      "&:hover": { bgcolor: "navActive.hover", borderColor: "primary.main" },
    },
  }),
});
