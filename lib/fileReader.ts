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
  // pdfjs-dist v4 在浏览器端默认会去找 worker 文件（./pdf.worker.mjs），
  // Next.js 下该文件不在这个路径上，会导致 "No GlobalWorkerOptions.workerSrc specified" 而立即失败。
  // 手动 import worker 模块会把它注册到 globalThis.pdfjsWorker，pdf.js 即可在主线程直接解析。
  await import("pdfjs-dist/build/pdf.worker.min.mjs");
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
