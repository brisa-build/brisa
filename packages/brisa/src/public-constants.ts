import type { RenderInitiatorType } from "@/types/server";

export const RenderInitiator = {
  INITIAL_REQUEST: "INITIAL_REQUEST",
  SPA_NAVIGATION: "SPA_NAVIGATION",
  SERVER_ACTION: "SERVER_ACTION",
} satisfies RenderInitiatorType;
