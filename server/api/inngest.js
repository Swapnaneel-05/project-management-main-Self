import { serve } from "inngest/node";
import { inngest, functions } from "../inngest/index.js";

export const config = {
  runtime: "nodejs",
};

export default serve({
  client: inngest,
  functions,
});