"use client";

import { createContext, useContext } from "react";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { DraggableAttributes } from "@dnd-kit/core";

interface DragHandleContextValue {
  listeners?: SyntheticListenerMap;
  attributes?: DraggableAttributes;
}

const DragHandleContext = createContext<DragHandleContextValue>({});

export function DragHandleProvider({
  listeners,
  attributes,
  children,
}: DragHandleContextValue & { children: React.ReactNode }) {
  return (
    <DragHandleContext.Provider value={{ listeners, attributes }}>
      {children}
    </DragHandleContext.Provider>
  );
}

export function useDragHandle() {
  return useContext(DragHandleContext);
}
