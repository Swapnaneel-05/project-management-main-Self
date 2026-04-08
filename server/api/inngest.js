import { serve } from "inngest/edge";
import { inngest, functions } from "../inngest/index.js";

export default serve({
  client: inngest,
  functions,
});