// Terms & Conditions PDFs are hosted (served by the website's public/legal/
// folder), not bundled into the app binary — replacing a PDF later only
// requires uploading a new file at the same URL, no app rebuild or store
// resubmission needed. Paste the real, deployed URLs below once the PDFs
// are uploaded to website/public/legal/.
export const LEGAL_DOCUMENT_URLS = {
  termsAndConditions: {
    en: 'https://hcare.plus/terms',
    // ar: 'https://hcare.plus/terms-ar',
  },
} as const;
