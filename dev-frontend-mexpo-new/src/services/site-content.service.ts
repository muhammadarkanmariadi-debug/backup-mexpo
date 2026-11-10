import { httpGet, httpPost, httpPut } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";
import { assertUploadableImage } from "@/shared/utils/upload";

export interface AboutHeroContent {
  tagline: string;
  headline: string;
  highlightText: string;
  description: string;
  backgroundImage: string;
}

export interface AboutStoryContent {
  heading: string;
  paragraphs: string[];
}

export interface AboutGalleryItem {
  id: number | string;
  src: string;
  label: string;
}

export interface AboutValueItem {
  icon: string;
  title: string;
  description: string;
}

export interface UploadImageResult {
  url: string;
  filename: string;
}

export async function getAllSiteContents() {
  const res = await httpGet<Record<string, any>>(
    "site-contents",
    undefined,
    META_DYNAMIC,
  );
  return {
    status: res.status,
    data: res.data as Record<string, any>,
  };
}

export async function getSiteContent<T = any>(sectionKey: string) {
  const res = await httpGet<T>(
    `site-contents/${sectionKey}`,
    undefined,
    META_DYNAMIC,
  );
  return {
    status: res.status,
    data: res.data as T,
    is_default: (res as any).is_default,
  };
}

export async function updateSiteContent(sectionKey: string, content: any) {
  return await httpPut(
    `site-contents/${sectionKey}`,
    JSON.stringify({ content }),
    "token",
  );
}

export async function uploadContentImage(file: File) {
  assertUploadableImage(file);
  const fd = new FormData();
  fd.append("file", file);
  const res = await httpPost<UploadImageResult>("site-contents/upload", fd, "token");
  return {
    status: res.status,
    message: res.message,
    data: res.data as UploadImageResult,
  };
}
