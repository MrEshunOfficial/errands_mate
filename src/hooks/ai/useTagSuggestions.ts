import { useCallback, useReducer } from "react";
import { aiAPI } from "@/lib/api/ai/ai.api";

interface State {
  tags: string[];
  isLoading: boolean;
  isError: boolean;
}

type Action =
  | { type: "START" }
  | { type: "SUCCESS"; payload: string[] }
  | { type: "ERROR" }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":   return { tags: [], isLoading: true, isError: false };
    case "SUCCESS": return { tags: action.payload, isLoading: false, isError: false };
    case "ERROR":   return { tags: [], isLoading: false, isError: true };
    case "RESET":   return { tags: [], isLoading: false, isError: false };
    default:        return state;
  }
}

export function useTagSuggestions() {
  const [state, dispatch] = useReducer(reducer, {
    tags: [],
    isLoading: false,
    isError: false,
  });

  const suggest = useCallback(async (name: string, description: string) => {
    if (!name.trim()) return;
    dispatch({ type: "START" });
    try {
      const tags = await aiAPI.suggestTags(name, description);
      dispatch({ type: "SUCCESS", payload: tags });
    } catch {
      dispatch({ type: "ERROR" });
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { ...state, suggest, reset };
}
