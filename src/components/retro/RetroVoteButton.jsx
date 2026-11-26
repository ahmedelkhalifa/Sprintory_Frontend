import { useRef } from "react";
import { Button, Tooltip } from "@mui/material";
import { ThumbUp, ThumbUpOutlined } from "@mui/icons-material";
import { RETRO_ERROR_MESSAGES } from "../../constants/retro";
import { canToggleVote, votesText } from "../../utils/retro";

// A card's votes as a button: blue with the caller's vote on it, off when they have no vote left to give. The count
// changes once the backend has answered, because others vote at the same time. `onVote(item)` votes or takes it back.
const RetroVoteButton = ({ item, votesLeft, onVote }) => {
  const busy = useRef(false);
  const allowed = canToggleVote(item, votesLeft);
  const hint = item.votedByMe ? "Remove your vote" : "Vote for this card";

  // a second click before the answer would send the same vote twice. A ref, because state only changes with the next
  // draw; and not `disabled` meanwhile, because that loses the focus
  const toggle = async () => {
    if (busy.current) return;
    busy.current = true;
    await onVote(item);
    busy.current = false;
  };

  return (
    <Tooltip title={allowed ? hint : RETRO_ERROR_MESSAGES.NO_VOTES_LEFT}>
      {/* the span keeps the tooltip working while the button is disabled */}
      <span>
        <Button
          size="small"
          variant={item.votedByMe ? "contained" : "outlined"}
          startIcon={item.votedByMe ? <ThumbUp /> : <ThumbUpOutlined />}
          onClick={toggle}
          disabled={!allowed}
          aria-pressed={item.votedByMe}
          aria-label={`Vote: ${votesText(item.voteCount)}`}
          // the theme's outlined button keeps its text color when it's off, so it would look like one that works
          sx={{ "&.MuiButton-outlined.Mui-disabled": { color: "text.disabled" } }}
        >
          {item.voteCount}
        </Button>
      </span>
    </Tooltip>
  );
};

export default RetroVoteButton;
