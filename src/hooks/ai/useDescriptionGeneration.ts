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

export function useDescriptionGeneration() {
  const [state, dispatch] = useReducer(reducer, {
    isLoading: false,
    isError: false,
  });

  const generate = useCallback(async (
    entityType: string,
    title: string,
    category?: string,
    additionalContext?: string,
  ): Promise<string> => {
    if (!title.trim()) return "";
    dispatch({ type: "START" });
    try {
      const description = await aiAPI.generateDescription(entityType, title, category, additionalContext);
      dispatch({ type: "DONE" });
      return description;
    } catch {
      dispatch({ type: "ERROR" });
      return "";
    }
  }, []);

  return { ...state, generate };
}
