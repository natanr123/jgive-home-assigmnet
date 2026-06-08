declare module "@rails/activestorage" {
  export class DirectUpload {
    constructor(file: File, url: string, delegate?: unknown);
    create(
      callback: (error: Error | null, blob: { signed_id: string; filename: string }) => void
    ): void;
  }
}
