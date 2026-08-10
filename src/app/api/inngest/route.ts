import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { reasignarCitaSiNoResponde } from "@/lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [reasignarCitaSiNoResponde],
});
