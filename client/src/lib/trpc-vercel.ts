import { createTRPCReact } from "@trpc/react-query";
import type { AppRouterVercel } from "../../../server/routers-vercel";

export const trpc = createTRPCReact<AppRouterVercel>();
