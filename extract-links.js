const puppeteer = require('puppeteer')
const fs = require('fs').promises

/**
 * Extract documentation links from Svelte and SvelteKit pages
 */
async function extractDocumentationLinks() {
  console.log('Launching browser...')
  const browser = await puppeteer.launch()

  try {
    // Extract Svelte links
    const svelteLinks = await extractLinksFromPage(
      browser,
      'https://svelte.dev/docs/svelte/overview',
      'Svelte'
    )

    // Extract SvelteKit links
    const svelteKitLinks = await extractLinksFromPage(
      browser,
      'https://svelte.dev/docs/kit/introduction',
      'SvelteKit'
    )

    // Save links to separate files
    await saveLinks(svelteLinks, 'svelte-links.js', 'svelteDocLinks')
    await saveLinks(svelteKitLinks, 'sveltekit-links.js', 'svelteKitDocLinks')

    console.log('\nExtraction complete!')
    console.log(
      `Svelte docs: ${svelteLinks.length} links saved to svelte-links.js`
    )
    console.log(
      `SvelteKit docs: ${svelteKitLinks.length} links saved to sveltekit-links.js`
    )
  } catch (error) {
    console.error('Error extracting links:', error)
  } finally {
    await browser.close()
  }
}

/**
 * Extract links from a specific documentation page
 * @param {Browser} browser - Puppeteer browser instance
 * @param {string} url - URL of the documentation page to scrape
 * @param {string} type - Type of documentation ('Svelte' or 'SvelteKit')
 * @returns {Array} - Array of link objects with complete URLs
 */
async function extractLinksFromPage(browser, url, type) {
  console.log(`\nOpening ${type} documentation at ${url}`)
  const page = await browser.newPage()

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000
  })

  console.log(`Extracting ${type} links...`)

  // Extract all links from navigation with aria-label="Docs"
  const links = await page.evaluate(docType => {
    // Find the navigation element with aria-label="Docs"
    const docsNav = Array.from(document.querySelectorAll('nav')).find(
      nav => nav.getAttribute('aria-label') === 'Docs'
    )

    if (!docsNav) return []

    // For SvelteKit, find the specific section; for Svelte, use appropriate filtering
    let anchors

    if (docType === 'SvelteKit') {
      // Find sections or containers that might contain SvelteKit content
      const sections = Array.from(docsNav.children)
      // Look for the section containing "kit" in its headings or content
      const kitSections = sections.filter(section => {
        return section.textContent.toLowerCase().includes('kit')
      })

      // Extract links from the SvelteKit section(s)
      anchors = []
      kitSections.forEach(section => {
        anchors.push(...Array.from(section.querySelectorAll('a')))
      })
    } else {
      // For Svelte, get all links that don't contain "kit" in their href
      anchors = Array.from(docsNav.querySelectorAll('a')).filter(a => {
        const href = a.getAttribute('href') || ''
        return !href.includes('/kit/')
      })
    }

    return anchors.map(a => {
      // Get href attribute
      const href = a.getAttribute('href') || ''
      // Get the text content (navigation item name)
      const text = a.textContent.trim()

      return { href, text }
    })
  }, type)

  // Filter to only include documentation links
  const filteredLinks = links.filter(
    link => link.href && link.href.startsWith('/docs/')
  )

  console.log(
    `Found ${links.length} total ${type} links, ${filteredLinks.length} documentation links`
  )

  // Add base URL to make complete links
  const completeLinks = filteredLinks.map(
    link => `https://svelte.dev${link.href}`
  )

  console.log(`Complete ${type} links extracted successfully`)
  return completeLinks
}

/**
 * Save links to a JavaScript file
 * @param {Array} links - Array of links to save
 * @param {string} filename - Name of the file to save links to
 * @param {string} variableName - Name of the variable to export
 */
async function saveLinks(links, filename, variableName) {
  const content = `/**
 * List of ${
   filename.includes('kit') ? 'SvelteKit' : 'Svelte'
 } documentation links
 */
const ${variableName} = ${JSON.stringify(links, null, 2)};

// Export the links array
module.exports = ${variableName};

// Log the links if this file is run directly
if (require.main === module) {
  console.log('${
    filename.includes('kit') ? 'SvelteKit' : 'Svelte'
  } documentation links:');
  console.log(\`Total links: \${${variableName}.length}\`);
  ${variableName}.forEach(link => console.log(link));
}`

  await fs.writeFile(filename, content)
}

// Run the extraction
extractDocumentationLinks()
