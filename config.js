/**
 * Configuration options for the webpage-to-pdf converter
 *
 * This file contains settings for the PDF generation process, which are passed to Puppeteer.
 * For detailed documentation on these options, see Puppeteer's documentation:
 * https://pptr.dev/api/puppeteer.pdfoptions
 */

module.exports = {
  // PDF output options - these map directly to Puppeteer's PDFOptions
  pdf: {
    // Paper format: 'Letter', 'Legal', 'Tabloid', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'
    format: 'A4',

    // Page orientation: true for landscape, false for portrait
    landscape: false,

    // Scale of the webpage rendering (1 = 100%, 0.5 = 50%)
    // Useful for fitting more content on a page or making text more readable
    scale: 0.7,

    // Page margins in inches or centimeters
    margin: {
      top: '1cm',
      right: '1cm',
      bottom: '1cm',
      left: '1cm'
    },

    // Whether to print background colors and images in the PDF
    printBackground: true

    // Additional options you can uncomment and configure:

    // Page ranges to print, e.g., '1-5, 8, 11-13'
    // pageRanges: '1-5',

    // Display header and footer
    // displayHeaderFooter: true,

    // HTML template for the print header
    // headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Svelte Documentation</div>',

    // HTML template for the print footer
    // footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> of <span class="totalPages"></span></div>',

    // Set to true to generate a tagged (accessible) PDF
    // tagged: true,

    // Set to true to generate a PDF with outline based on headings
    // outline: true,

    // Print the first page only if preferCSSPageSize is also set to true
    // firstPageOnly: false,

    // Set to true to prefer page size as defined by CSS
    // preferCSSPageSize: false,

    // Width of paper in inches or pixels. Overrides format
    // width: '8.5in',

    // Height of paper in inches or pixels. Overrides format
    // height: '11in',
  },

  // Output options
  output: {
    defaultFileName: 'output.pdf',
    defaultDirectory: 'output'
  }
}
