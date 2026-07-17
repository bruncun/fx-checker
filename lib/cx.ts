import { cn } from "./utils";
import type { ClassValue } from "clsx";

export function cx(...inputs: ClassValue[]) {
  return cn(inputs);
}
