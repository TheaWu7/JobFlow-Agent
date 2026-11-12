// pdfjs-dist v4 的 worker 模块没有随包提供类型声明。
// 这里只是为了让 `import("pdfjs-dist/build/pdf.worker.min.mjs")` 通过类型检查；
// 该模块的作用是把它自身注册到 globalThis.pdfjsWorker，导入后无需使用其导出值。
declare module "pdfjs-dist/build/pdf.worker.min.mjs" {
  const WorkerMessageHandler: unknown;
  export { WorkerMessageHandler };
}
