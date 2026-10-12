import type { APIRoute } from "astro";
import { sitePath } from "../lib/site-path";

export const GET: APIRoute = ({ url }) => Response.redirect(new URL(sitePath("/_emdash/admin"), url), 308);
