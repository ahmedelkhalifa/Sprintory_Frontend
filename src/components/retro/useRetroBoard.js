import { useCallback, useEffect, useRef, useState } from "react";
import {
  closeRetro,
  createRetroAction,
  createRetroItem,
  deleteRetroItem,
  getRetro,
  unvoteRetroItem,
  updateRetroItem,
  voteRetroItem,
} from "../../api/retrosApi";
import { RETRO_ERROR_MESSAGES, RETRO_POLL_MS, RETRO_REFRESH_CODES, RETRO_STATUS } from "../../constants/retro";
import { errorCode, errorMessage } from "../../utils/apiError";
import { addAction, applyVote, removeItem, replaceItem } from "../../utils/retro";
import { isRichTextError } from "../../utils/richText";

/**
 * An open retro board's data, starting from the loaded retro. A change goes to the backend first, then its answer is
 * put into the retro, so the page never reloads. Each change answers null, or the text of what went wrong;
 * `createAction` answers the action and throws instead, because its window shows errors next to the fields.
 * The page isn't live, so it loads the retro again every RETRO_POLL_MS while it's open and on screen, on `reload`, and
 * after a refusal that shows it's out of date (RETRO_REFRESH_CODES).
 */
export const useRetroBoard = (loaded) => {
  const [retro, setRetro] = useState(loaded);
  const retroId = loaded.id;
  const changes = useRef(0);
  const loads = useRef(0);
  const lastVote = useRef(Promise.resolve());

  const update = (change) => {
    changes.current += 1;
    setRetro(change);
  };

  // What loaded while something changed may miss that change, so it loads again; only the newest load counts
  const load = useCallback(
    async (signal) => {
      loads.current += 1;
      const mine = loads.current;
      let before;
      let fresh;
      do {
        before = changes.current;
        fresh = await getRetro(retroId, signal);
      } while (changes.current !== before && mine === loads.current);
      if (mine === loads.current) setRetro(fresh);
    },
    [retroId],
  );

  // quiet: if it fails the board stays as it is (the user already sees why their change was refused)
  const refresh = useCallback((signal) => load(signal).catch(() => {}), [load]);

  // asked for by the user, so a failure is answered
  const reload = async () => {
    try {
      await load();
      return null;
    } catch (err) {
      return errorMessage(err, "Couldn't refresh the retrospective. Please try again.", RETRO_ERROR_MESSAGES);
    }
  };

  // a closed retro has nothing to wait for, and a tab in the background doesn't ask
  const open = retro.status === RETRO_STATUS.OPEN.value;
  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    const timer = setInterval(() => {
      if (!document.hidden) refresh(controller.signal);
    }, RETRO_POLL_MS);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [open, refresh]);

  const refreshIfStale = (err) => {
    if (RETRO_REFRESH_CODES.includes(errorCode(err))) refresh();
  };

  const failure = (err, fallback) => {
    refreshIfStale(err);
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

  const createAction = async (body) => {
    try {
      const action = await createRetroAction(retro.id, body);
      update((current) => addAction(current, action));
      return action;
    } catch (err) {
      refreshIfStale(err);
      throw err;
    }
  };

  const close = async () => {
    try {
      const closed = await closeRetro(retro.id);
      update(() => closed);
      return null;
    } catch (err) {
      return failure(err, "Couldn't close the retrospective. Please try again.");
    }
  };

  return { retro, addItem, editItem, deleteItem, toggleVote, createAction, close, reload };
};
