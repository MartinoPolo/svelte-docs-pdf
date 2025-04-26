/**
 * Webpage to PDF converter
 * Extracts content from a div with id='docs-content', including header and text content
 */

const puppeteer = require('puppeteer')
const config = require('./config')

/**
 * Convert a webpage URL to PDF, extracting only the content of specific divs
 * @param {string} url - URL of the webpage to convert
 * @param {Object} options - PDF options (format, landscape, scale, etc)
 * @returns {Promise<Buffer>} - PDF file as buffer
 */
async function convertWebpageToPdf(url, options = {}) {
  // Hardcoded selectors for Svelte documentation
  const parentSelector = '#docs-content'
  const childSelector = '.text.content'

  // Default PDF options from config
  const defaultOptions = config.pdf

  // Merge with user-provided options
  const pdfOptions = { ...defaultOptions, ...options }

  // Launch browser with more permissive arguments
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-web-security', '--no-sandbox']
  })

  try {
    // Open new page
    const page = await browser.newPage()

    // More careful URL handling for special characters
    let processedUrl = url

    // If the URL isn't already a fully formed URL object, create one
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      processedUrl = 'https://' + url
    }

    // Use direct navigation approach
    try {
      // Try using the evaluate method to navigate directly in the page context
      // This can bypass some URL encoding issues
      await page.evaluate(url => {
        window.location.href = url
      }, processedUrl)

      // Wait for navigation to complete
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 60000
      })
    } catch (navError) {
      console.log(
        `Direct navigation failed: ${navError.message}, trying standard navigation`
      )
      // If the evaluate approach fails, fall back to standard navigation
      await page.goto(processedUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      })
    }

    // Check if the parent selector exists
    const parentExists = await page.evaluate(
      sel => !!document.querySelector(sel),
      parentSelector
    )

    if (!parentExists) {
      throw new Error(
        `Element with selector "${parentSelector}" not found on the page!`
      )
    }

    // Extract content including header and text content
    await page.evaluate(
      (parentSel, childSel) => {
        // Save the parent element
        const parentElement = document.querySelector(parentSel)

        // Create a container for our content
        const container = document.createElement('div')

        // Find the header element within the parent (typically the first h1 or similar)
        const headerElement = parentElement.querySelector('header, h1, .header')

        // Check if the child element exists within the parent
        const childElement = parentElement.querySelector(childSel)

        // Add header to container if found
        if (headerElement) {
          console.log('Header element found, including it in output')
          container.appendChild(headerElement.cloneNode(true))
        }

        // Add text content to container if found
        if (childElement) {
          console.log(
            'Child text content element found, including it in output'
          )
          container.appendChild(childElement.cloneNode(true))
        } else {
          // If no specific text content element found, include all content except header
          console.log(
            'No specific text content found, including all parent content'
          )

          // Clone the parent to avoid modifying the original DOM
          const parentClone = parentElement.cloneNode(true)

          // If we already added the header, remove it from the parent clone to avoid duplication
          if (headerElement) {
            const headerInClone = parentClone.querySelector(
              'header, h1, .header'
            )
            if (headerInClone) {
              headerInClone.remove()
            }
          }

          // Add the remaining content
          container.appendChild(parentClone)
        }

        // Replace body content with our container
        document.body.innerHTML = ''
        document.body.appendChild(container)

        // Add some basic styling to ensure proper rendering
        const style = document.createElement('style')
        style.textContent = `
        body {
          margin: 0;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        pre, code {
          white-space: pre-wrap;
          overflow-wrap: break-word;
        }
        header, h1 {
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eaeaea;
        }
      `
        document.head.appendChild(style)
      },
      parentSelector,
      childSelector
    )

    // Generate PDF buffer
    const pdfBuffer = await page.pdf(pdfOptions)

    return pdfBuffer
  } finally {
    // Always close the browser
    await browser.close()
  }
}

module.exports = {
  convertWebpageToPdf
}
