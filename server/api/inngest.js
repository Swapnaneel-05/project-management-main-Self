import { serve } from "inngest/edge";
import { inngest, functions } from "../inngest/index.js";

export const config = {
  runtime: "edge",
};

export default serve({
  client: inngest,
  functions,
});