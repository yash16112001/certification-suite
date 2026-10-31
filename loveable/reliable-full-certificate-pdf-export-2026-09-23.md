# Reliable full-certificate PDF export

## Goal
Make every downloaded A4 PDF match the complete on-screen certificate, including artwork, borders, logos, text, typography, spacing, and QR code.

## Changes
- Replace the failing `html2canvas` capture step with a browser-native full-element image capture that supports the app’s modern colors.
- Keep the existing certificate HTML, CSS, artwork, QR placement, and PDF layout unchanged.
- Wait for document fonts, certificate artwork, and QR images to finish loading before capture.
- Capture the certificate at its natural A4 dimensions, independent of the responsive preview scale.
- Retry the capture once after a short render frame delay when an intermittent asset or rendering failure occurs.
- Surface a specific message for missing preview, asset-loading failure, capture failure, or PDF assembly/download failure.

## Verification
- Export the same populated certificate repeatedly to test intermittent behavior.
- Confirm each result is a one-page A4 portrait PDF.
- Render the PDFs to images and visually compare them with the certificate preview for complete artwork and aligned data.
- Confirm the app remains error-free after the change.

## Technical details
- Continue using jsPDF for the A4 document.
- Use the existing rendered `#certificate` element as the capture source; no certificate redesign or reconstruction.
- Limit edits to the certificate export path and its direct dependency configuration.
