import { serve } from "inngest/vercel";
import { inngest, functions } from "../inngest/index.js";

export default serve({
  client: inngest,
  functions,
});