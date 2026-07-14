"use client";

import type { UploadedAttachment } from "@/types/agent";
import { uid } from "@/lib/utils";

export async function readFiles(files: File[]): Promise<UploadedAttachment[]> {
  return Promise.all(files.map(readFile));
}

async function readFile(file: File): Promise<UploadedAttachment> {
  try {
    const extension = file.name.split(".").pop()?.toLowerCase();
    let text = "";
    if (extension === "txt" || extension === "md") {
      text = await file.text();
    } else if (extension === "pdf") {
      text = await readPdf(file);
    } else if (extension === "docx") {
      text = await readDocx(file);
    } else {
      throw new Error("仅支持 txt、md、pdf、docx 文件。");
    }
    return {
      id: uid("file"),
      name: file.name,
      type: file.type || extension || "unknown",
      text: text.trim(),
      status: "ready"
    };
  } catch (error) {
    return {
      id: uid("file"),
      name: file.name,
      type: file.type || "unknown",
      text: "",
      status: "error",
      error: error instanceof Error ? error.message : "文件解析失败，请粘贴文本内容。"
    };
  }
}

async function readPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer, useWorkerFetch: false, isEvalSupported: false }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n\n");
}

async function readDocx(file: File) {
  const mammoth = await import("mammoth/mammoth.browser");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}
