import { useCallback, useReducer } from "react";
import { aiAPI } from "@/lib/api/ai/ai.api";

interface State {
  isLoading: boolean;
  isError: boolean;
}

type Action =
  | { type: "START" }
  | { type: "DONE" }
  | { type: "ERROR" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START": return { isLoading: true, isError: false };
    case "DONE":  return { isLoading: false, isError: false };
    case "ERROR": return { isLoading: false, isError: true };
    default:      return state;
  }
}

export function useTagSuggestions() {
  const [state, dispatch] = useReducer(reducer, {
    isLoading: false,
    isError: false,
  });

  const suggest = useCallback(async (name: string, description: string): Promise<string[]> => {
    if (!name.trim()) return [];
    dispatch({ type: "START" });
    try {
      const tags = await aiAPI.suggestTags(name, description);
      dispatch({ type: "DONE" });
      return tags;
    } catch (err) {
      console.error("[useTagSuggestions] failed:", err);
      dispatch({ type: "ERROR" });
      return [];
    }
  }, []);

  return { ...state, suggest };
}
