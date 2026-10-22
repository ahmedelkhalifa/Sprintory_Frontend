import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

// TODO: hook this up to i18n when we add more languages
const LANGUAGES = ["English"];

const LanguageSelect = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [language, setLanguage] = useState(LANGUAGES[0]);

  const handleSelect = (lang) => {
    setLanguage(lang);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        color="inherit"
        size="small"
        startIcon={<LanguageIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: "text.primary" }}
      >
        {language}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {LANGUAGES.map((lang) => (
          <MenuItem key={lang} selected={lang === language} onClick={() => handleSelect(lang)}>
            {lang}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelect;
