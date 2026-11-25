import { useRef, useState } from "react";
import {
  createRetroItem,
  deleteRetroItem,
  getRetro,
  unvoteRetroItem,
  updateRetroItem,
  voteRetroItem,
} from "../../api/retrosApi";
import { RETRO_ERROR_MESSAGES, RETRO_REFRESH_CODES } from "../../constants/retro";
import { errorCode, errorMessage } from "../../utils/apiError";
import { applyVote, removeItem, replaceItem } from "../../utils/retro";
import { isRichTextError } from "../../utils/richText";

/**
 * An open retro board's data, starting from the loaded retro. A change goes to the backend first, then its answer is
 * put into the retro, so the page never reloads. Each change answers null, or the text of what went wrong.
 * The page isn't live, so a refusal that shows it's out of date (RETRO_REFRESH_CODES) loads the retro again.
 */
export const useRetroBoard = (loaded) => {
  const [retro, setRetro] = useState(loaded);
  const changes = useRef(0);
  const lastVote = useRef(Promise.resolve());

  const update = (change) => {
    changes.current += 1;
    setRetro(change);
  };

  // quiet: if it fails the board stays as it is. What loaded while something changed may miss that change, so it
  // loads again
  const refresh = async () => {
    try {
      let before;
      let fresh;
      do {
        before = changes.current;
        fresh = await getRetro(retro.id);
      } while (changes.current !== before);
      setRetro(fresh);
    } catch {
      // the user already sees why their change was refused
    }
  };

  const failure = (err, fallback) => {
    if (RETRO_REFRESH_CODES.includes(errorCode(err))) refresh();
    // a refused text: the backend's message says what is wrong with it
    return isRichTextError(err) ? err.response.data.message : errorMessage(err, fallback, RETRO_ERROR_MESSAGES);
  };

  const addItem = async (column, body) => {
    try {
      const item = await createRetroItem(retro.id, { column, body });
      update((current) => replaceItem(current, item));
      return null;
    } catch (err) {
      return failure(err, "Couldn't add the card. Please try again.");
    }
  };

  const editItem = async (itemId, body) => {
    try {
      const item = await updateRetroItem(itemId, body);
      update((current) => replaceItem(current, item));
      return null;
    } catch (err) {
      return failure(err, "Couldn't save the card. Please try again.");
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await deleteRetroItem(itemId);
      update((current) => removeItem(current, itemId));
      return null;
    } catch (err) {
      return failure(err, "Couldn't delete the card. Please try again.");
    }
  };

  const sendVote = async (item) => {
    try {
      const result = await (item.votedByMe ? unvoteRetroItem : voteRetroItem)(item.id);
      update((current) => applyVote(current, result));
      return null;
    } catch (err) {
      return failure(err, "Couldn't save your vote. Please try again.");
    }
  };

  // votes, or takes the vote back. One at a time: every answer has the votes left, so one that arrives late would
  // show an old number
  const toggleVote = (item) => {
    lastVote.current = lastVote.current.then(() => sendVote(item));
    return lastVote.current;
  };

  return { retro, addItem, editItem, deleteItem, toggleVote };
};
