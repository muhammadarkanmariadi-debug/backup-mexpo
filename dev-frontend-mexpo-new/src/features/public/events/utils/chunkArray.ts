import { Event } from "@/entities/event/event.entity";

export const chunkArray = (arr: Event[], size: number): Event[][] => {
  const chunks: Event[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};
