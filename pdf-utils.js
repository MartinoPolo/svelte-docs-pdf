/**
 * PDF utilities for handling PDF merging and other operations
 */

const fs = require('fs').promises
const fsExtra = require('fs-extra')
const path = require('path')
const { PDFDocument } = require('pdf-lib')

/**
 * Merge multiple PDF files into a single PDF
 * @param {string[]} inputPaths - Array of paths to PDF files to merge
 * @param {string} outputPath - Path where the combined PDF will be saved
 * @returns {Promise<Object>} - Object containing page count and other stats
 */
async function mergePDFs(inputPaths, outputPath) {
  console.log(`\nMerging ${inputPaths.length} PDFs into a combined document...`)

  // Create a new PDF document
  const mergedPdf = await PDFDocument.create()

  let totalPages = 0
  const stats = {
    totalFiles: inputPaths.length,
    totalPages: 0,
    fileWithMostPages: '',
    maxPages: 0,
    fileSizes: []
  }

  // Process each PDF file
  for (let i = 0; i < inputPaths.length; i++) {
    const filePath = inputPaths[i]
    console.log(
      `  Processing [${i + 1}/${inputPaths.length}]: ${path.basename(filePath)}`
    )

    try {
      // Read the PDF file
      const fileContent = await fs.readFile(filePath)

      // Get file size for statistics
      const fileSize = fileContent.length
      stats.fileSizes.push({
        file: path.basename(filePath),
        size: (fileSize / 1024).toFixed(2) + ' KB'
      })

      // Load the PDF document
      const pdfDoc = await PDFDocument.load(fileContent)
      const pageCount = pdfDoc.getPageCount()

      // Track statistics
      totalPages += pageCount
      if (pageCount > stats.maxPages) {
        stats.maxPages = pageCount
        stats.fileWithMostPages = path.basename(filePath)
      }

      // Copy pages from source document to merged document
      const copiedPages = await mergedPdf.copyPages(
        pdfDoc,
        pdfDoc.getPageIndices()
      )
      copiedPages.forEach(page => mergedPdf.addPage(page))
    } catch (error) {
      console.error(`  Error processing ${filePath}: ${error.message}`)
    }
  }

  stats.totalPages = totalPages
  console.log(`\nTotal pages in combined document: ${totalPages}`)

  // Save the merged PDF
  const mergedPdfBytes = await mergedPdf.save()
  await fs.writeFile(outputPath, mergedPdfBytes)

  // Get size of the combined PDF
  const combinedSize = mergedPdfBytes.length
  stats.combinedSize = (combinedSize / 1024 / 1024).toFixed(2) + ' MB'

  console.log(`Combined PDF saved to: ${outputPath}`)
  return stats
}

/**
 * Create a table of contents page
 * @param {string[]} fileNames - Array of PDF file names to include in TOC
 * @returns {Promise<Buffer>} - Buffer containing the TOC PDF
 */
async function createTableOfContents(fileNames) {
  // Implementation for creating a table of contents if needed
  // This could be done later as an enhancement
}

module.exports = {
  mergePDFs
}
