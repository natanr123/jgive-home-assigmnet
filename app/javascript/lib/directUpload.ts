import { DirectUpload } from "@rails/activestorage";

// Uploads a file straight to an Active Storage blob via the built-in
// /rails/active_storage/direct_uploads endpoint (CSRF token read from the meta tag),
// then resolves with the blob's signed_id — which the updateCampaign mutation attaches.
export function directUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const upload = new DirectUpload(file, "/rails/active_storage/direct_uploads");
    upload.create((error, blob) => {
      if (error) reject(error);
      else resolve(blob.signed_id);
    });
  });
}
