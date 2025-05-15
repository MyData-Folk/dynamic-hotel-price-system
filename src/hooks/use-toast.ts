
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 20
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: string
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: string
    }

interface State {
  toasts: ToasterToast[]
}

// Create a React context to store the state
const ToastContext = React.createContext<{
  state: State
  dispatch: React.Dispatch<Action>
}>({
  state: { toasts: [] },
  dispatch: () => {},
})

// Use a custom hook to access the toast context
function useToastContext() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        setToastTimeout(toastId)
      } else {
        state.toasts.forEach((toast) => {
          setToastTimeout(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

// Global dispatch function and state
let globalDispatch: React.Dispatch<Action> | null = null;
let globalState: State = { toasts: [] };

// Export ToastProvider to wrap at the root level
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] });
  
  // Store reference to the latest state and dispatch function
  React.useEffect(() => {
    globalDispatch = dispatch;
    globalState = state;
  }, [state]);

  return (
    <ToastContext.Provider value={{ state, dispatch }}>
      {children}
    </ToastContext.Provider>
  );
}

function setToastTimeout(id: string) {
  if (toastTimeouts.has(id)) {
    clearTimeout(toastTimeouts.get(id))
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(id)
    if (globalDispatch) {
      globalDispatch({
        type: actionTypes.REMOVE_TOAST,
        toastId: id,
      });
    }
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(id, timeout)
}

type Toast = Omit<ToasterToast, "id">

function dispatch(action: Action) {
  if (globalDispatch) {
    React.startTransition(() => {
      globalDispatch!(action);
    });
  }
}

const useToast = () => {
  const { state } = useToastContext();
  
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  }
}

function toast(props: Toast) {
  const id = genId()

  const update = (props: Toast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id })

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id,
    dismiss,
    update,
  }
}

// For backwards compatibility when not using in a provider
// This assumes the ToastProvider is at the root level
if (typeof window !== 'undefined') {
  // Provide fallback for direct usage
  const originalUseToast = useToast;
  
  function useToastWithFallback() {
    try {
      return originalUseToast();
    } catch (e) {
      return {
        toasts: globalState.toasts,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
      };
    }
  }

  // Replace useToast with the fallback version
  Object.assign(useToast, useToastWithFallback);
}

export { useToast, toast }
