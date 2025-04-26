#!/usr/bin/env node

/**
 * Webpage to PDF CLI tool
 * Simplified version that uses configuration from config.js
 */

const fs = require('fs').promises
const path = require('path')
const { Command } = require('commander')
const { convertWebpageToPdf } = require('./converter')
const { mergePDFs } = require('./pdf-utils')
const config = require('./config')

// Setup the command-line interface
const program = new Command()

program
  .name('webpage-to-pdf')
  .description('Convert webpages to PDF files, extracting specific content')
  .version('1.0.0')

// Single URL conversion command
program
  .command('convert')
  .description('Convert a single webpage to PDF')
  .argument('<url>', 'URL of the webpage to convert')
  .option(
    '-o, --output <file>',
    'Output PDF file path',
    config.output.defaultFileName
  )
  .action(async (url, options) => {
    try {
      console.log(`Converting ${url} to PDF...`)
      console.log(
        'Using hardcoded selectors: parent="#docs-content", child=".text.content"'
      )

      const pdfBuffer = await convertWebpageToPdf(url)

      await fs.writeFile(options.output, pdfBuffer)
      console.log(`PDF saved to ${path.resolve(options.output)}`)
    } catch (error) {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    }
  })

// Bulk conversion command
program
  .command('bulk')
  .description('Convert multiple webpages to PDFs')
  .argument('<urls-file>', 'Path to a text file with URLs (one per line)')
  .option(
    '-o, --output-dir <directory>',
    'Output directory for PDF files',
    config.output.defaultDirectory
  )
  .option('-c, --combine', 'Create a combined PDF of all pages', false)
  .option(
    '--combined-name <filename>',
    'Name for the combined PDF file',
    'combined.pdf'
  )
  .action(async (urlsFile, options) => {
    try {
      // Read URLs file
      const content = await fs.readFile(urlsFile, 'utf-8')
      const urls = content.split('\n').filter(url => url.trim())

      if (urls.length === 0) {
        console.error('No URLs found in the file.')
        process.exit(1)
      }

      console.log(`Found ${urls.length} URLs to process.`)
      console.log(
        'Using hardcoded selectors: parent="#docs-content", child=".text.content"'
      )

      // Create output directory if it doesn't exist
      try {
        await fs.mkdir(options.outputDir, { recursive: true })
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err
        }
      }

      // Keep track of all generated PDFs
      const generatedPdfs = []

      // Process each URL
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i].trim()
        if (!url) continue

        console.log(`[${i + 1}/${urls.length}] Converting ${url}`)

        try {
          const pdfBuffer = await convertWebpageToPdf(url)

          // Generate filename from URL
          const filename = url.replace(/[^a-z0-9]/gi, '_').toLowerCase()
          const outputPath = path.join(options.outputDir, `${filename}.pdf`)

          await fs.writeFile(outputPath, pdfBuffer)
          console.log(`  Saved to ${outputPath}`)

          // Add to list of generated PDFs
          generatedPdfs.push(outputPath)
        } catch (error) {
          console.error(`  Error: ${error.message}`)
        }
      }

      console.log('Bulk conversion complete.')

      // Create combined PDF if requested
      if (options.combine && generatedPdfs.length > 0) {
        const combinedPdfPath = path.join(
          options.outputDir,
          options.combinedName
        )
        const stats = await mergePDFs(generatedPdfs, combinedPdfPath)

        console.log('\nPDF Statistics:')
        console.log(`  Total number of files: ${stats.totalFiles}`)
        console.log(`  Total number of pages: ${stats.totalPages}`)
        console.log(
          `  File with most pages: ${stats.fileWithMostPages} (${stats.maxPages} pages)`
        )
        console.log(`  Combined PDF size: ${stats.combinedSize}`)
      }
    } catch (error) {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    }
  })

// URLs command for multiple space-separated URLs
program
  .command('urls')
  .description('Convert multiple webpages to PDFs directly from command line')
  .argument('<urls...>', 'Space-separated list of URLs to convert')
  .option(
    '-o, --output-dir <directory>',
    'Output directory for PDF files',
    config.output.defaultDirectory
  )
  .option('-c, --combine', 'Create a combined PDF of all pages', false)
  .option(
    '--combined-name <filename>',
    'Name for the combined PDF file',
    'combined.pdf'
  )
  .action(async (urls, options) => {
    try {
      if (urls.length === 0) {
        console.error('No URLs provided.')
        process.exit(1)
      }

      console.log(`Found ${urls.length} URLs to process.`)
      console.log(
        'Using hardcoded selectors: parent="#docs-content", child=".text.content"'
      )

      // Create output directory if it doesn't exist
      try {
        await fs.mkdir(options.outputDir, { recursive: true })
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err
        }
      }

      // Keep track of all generated PDFs
      const generatedPdfs = []

      // Process each URL
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i].trim()
        if (!url) continue

        console.log(`[${i + 1}/${urls.length}] Converting ${url}`)

        try {
          const pdfBuffer = await convertWebpageToPdf(url)

          // Generate a safe filename from the URL
          try {
            const parsedUrl = new URL(url)
            const filename = `${parsedUrl.hostname}${parsedUrl.pathname.replace(
              /[^a-z0-9]/gi,
              '_'
            )}`.toLowerCase()
            const outputPath = path.join(options.outputDir, `${filename}.pdf`)

            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedPdfs.push(outputPath)
          } catch (urlError) {
            // Fallback for malformed URLs
            const filename = url.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const outputPath = path.join(options.outputDir, `${filename}.pdf`)
            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedPdfs.push(outputPath)
          }
        } catch (error) {
          console.error(`  Error: ${error.message}`)
        }
      }

      console.log('Multiple URLs conversion complete.')

      // Create combined PDF if requested
      if (options.combine && generatedPdfs.length > 0) {
        const combinedPdfPath = path.join(
          options.outputDir,
          options.combinedName
        )
        const stats = await mergePDFs(generatedPdfs, combinedPdfPath)

        console.log('\nPDF Statistics:')
        console.log(`  Total number of files: ${stats.totalFiles}`)
        console.log(`  Total number of pages: ${stats.totalPages}`)
        console.log(
          `  File with most pages: ${stats.fileWithMostPages} (${stats.maxPages} pages)`
        )
        console.log(`  Combined PDF size: ${stats.combinedSize}`)
      }
    } catch (error) {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    }
  })

// Process svelte-links.js file command
program
  .command('svelte')
  .description('Convert Svelte documentation links from svelte-links.js')
  .option(
    '-o, --output-dir <directory>',
    'Output directory for PDF files',
    'svelte-docs'
  )
  .option('-c, --combine', 'Create a combined PDF of all pages', false)
  .option(
    '--combined-name <filename>',
    'Name for the combined PDF file',
    'svelte-documentation.pdf'
  )
  .option('--no-legacy', 'Ignore links containing "legacy" in their URL', false)
  .option('--no-v4', 'Ignore v4-migration-guide', false)
  .action(async options => {
    try {
      // Load the svelte links array
      let svelteLinks
      try {
        svelteLinks = require('./svelte-links')
      } catch (error) {
        console.error(`Error loading svelte-links.js file: ${error.message}`)
        process.exit(1)
      }

      if (!Array.isArray(svelteLinks) || svelteLinks.length === 0) {
        console.error('No valid URLs found in svelte-links.js.')
        process.exit(1)
      }

      // Filter links based on options
      if (options.noLegacy) {
        const originalCount = svelteLinks.length
        svelteLinks = svelteLinks.filter(
          link => !link.toLowerCase().includes('legacy')
        )
        console.log(
          `Filtered out ${originalCount - svelteLinks.length} legacy links`
        )
      }

      if (options.noV4) {
        const originalCount = svelteLinks.length
        svelteLinks = svelteLinks.filter(
          link => !link.toLowerCase().includes('v4-migration-guide')
        )
        console.log(
          `Filtered out ${
            originalCount - svelteLinks.length
          } v4-migration-guide links`
        )
      }

      console.log(
        `Found ${svelteLinks.length} Svelte documentation URLs to process.`
      )
      console.log(
        'Using hardcoded selectors: parent="#docs-content", child=".text.content"'
      )

      // Create output directory if it doesn't exist
      try {
        await fs.mkdir(options.outputDir, { recursive: true })
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err
        }
      }

      // Keep track of all generated PDFs
      const generatedPdfs = []

      // Process each URL
      for (let i = 0; i < svelteLinks.length; i++) {
        const url = svelteLinks[i]
        console.log(`[${i + 1}/${svelteLinks.length}] Converting ${url}`)

        try {
          const pdfBuffer = await convertWebpageToPdf(url)

          // Generate a safe filename from the URL
          try {
            const parsedUrl = new URL(url)
            let pageName = parsedUrl.pathname.split('/').pop()
            if (!pageName) pageName = 'index'

            const outputPath = path.join(options.outputDir, `${pageName}.pdf`)
            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedPdfs.push(outputPath)
          } catch (urlError) {
            // Fallback for malformed URLs
            const filename = url.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const outputPath = path.join(options.outputDir, `${filename}.pdf`)
            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedPdfs.push(outputPath)
          }
        } catch (error) {
          console.error(`  Error: ${error.message}`)
        }
      }

      console.log('Svelte documentation conversion complete.')

      // Create combined PDF if requested
      if (options.combine && generatedPdfs.length > 0) {
        const combinedPdfPath = path.join(
          options.outputDir,
          options.combinedName
        )
        const stats = await mergePDFs(generatedPdfs, combinedPdfPath)

        console.log('\nPDF Statistics:')
        console.log(`  Total number of files: ${stats.totalFiles}`)
        console.log(`  Total number of pages: ${stats.totalPages}`)
        console.log(
          `  File with most pages: ${stats.fileWithMostPages} (${stats.maxPages} pages)`
        )
        console.log(`  Combined PDF size: ${stats.combinedSize}`)
      }
    } catch (error) {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    }
  })

// Process sveltekit-links.js file command
program
  .command('sveltekit')
  .description('Convert SvelteKit documentation links from sveltekit-links.js')
  .option(
    '-o, --output-dir <directory>',
    'Output directory for PDF files',
    'sveltekit-docs'
  )
  .option('-c, --combine', 'Create a combined PDF of all pages', false)
  .option(
    '--combined-name <filename>',
    'Name for the combined PDF file',
    'sveltekit-documentation.pdf'
  )
  .option('--no-migration', 'Ignore migration guides', false)
  .action(async options => {
    try {
      // Load the SvelteKit links array
      let svelteKitLinks
      try {
        svelteKitLinks = require('./sveltekit-links')
      } catch (error) {
        console.error(`Error loading sveltekit-links.js file: ${error.message}`)
        process.exit(1)
      }

      if (!Array.isArray(svelteKitLinks) || svelteKitLinks.length === 0) {
        console.error('No valid URLs found in sveltekit-links.js.')
        process.exit(1)
      }

      // Filter links based on options
      if (options.noMigration) {
        const originalCount = svelteKitLinks.length
        svelteKitLinks = svelteKitLinks.filter(
          link => !link.toLowerCase().includes('migrat')
        )
        console.log(
          `Filtered out ${
            originalCount - svelteKitLinks.length
          } migration guide links`
        )
      }

      console.log(
        `Found ${svelteKitLinks.length} SvelteKit documentation URLs to process.`
      )
      console.log(
        'Using hardcoded selectors: parent="#docs-content", child=".text.content"'
      )

      // Create output directory if it doesn't exist
      try {
        await fs.mkdir(options.outputDir, { recursive: true })
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err
        }
      }

      // Keep track of all generated PDFs
      const generatedPdfs = []

      // Process each URL
      for (let i = 0; i < svelteKitLinks.length; i++) {
        const url = svelteKitLinks[i]
        console.log(`[${i + 1}/${svelteKitLinks.length}] Converting ${url}`)

        try {
          const pdfBuffer = await convertWebpageToPdf(url)

          // Generate a safe filename from the URL
          try {
            const parsedUrl = new URL(url)
            let pageName = parsedUrl.pathname.split('/').pop()
            if (!pageName) pageName = 'index'

            const outputPath = path.join(options.outputDir, `${pageName}.pdf`)
            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedPdfs.push(outputPath)
          } catch (urlError) {
            // Fallback for malformed URLs
            const filename = url.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const outputPath = path.join(options.outputDir, `${filename}.pdf`)
            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedPdfs.push(outputPath)
          }
        } catch (error) {
          console.error(`  Error: ${error.message}`)
        }
      }

      console.log('SvelteKit documentation conversion complete.')

      // Create combined PDF if requested
      if (options.combine && generatedPdfs.length > 0) {
        const combinedPdfPath = path.join(
          options.outputDir,
          options.combinedName
        )
        const stats = await mergePDFs(generatedPdfs, combinedPdfPath)

        console.log('\nPDF Statistics:')
        console.log(`  Total number of files: ${stats.totalFiles}`)
        console.log(`  Total number of pages: ${stats.totalPages}`)
        console.log(
          `  File with most pages: ${stats.fileWithMostPages} (${stats.maxPages} pages)`
        )
        console.log(`  Combined PDF size: ${stats.combinedSize}`)
      }
    } catch (error) {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    }
  })

// New command to extract links and generate both Svelte and SvelteKit docs in one step
program
  .command('docs')
  .description(
    'Extract links and generate both Svelte and SvelteKit documentation in one step'
  )
  .option('-c, --combine', 'Create combined PDFs of all pages', true)
  .option('--no-legacy', 'Ignore links containing "legacy" in their URL', false)
  .option('--no-v4', 'Ignore v4-migration-guide', false)
  .option('--no-migration', 'Ignore SvelteKit migration guides', false)
  .option(
    '--svelte-dir <directory>',
    'Output directory for Svelte PDFs',
    'svelte-docs'
  )
  .option(
    '--sveltekit-dir <directory>',
    'Output directory for SvelteKit PDFs',
    'sveltekit-docs'
  )
  .option(
    '--svelte-name <filename>',
    'Name for the Svelte combined PDF',
    'svelte-documentation.pdf'
  )
  .option(
    '--sveltekit-name <filename>',
    'Name for the SvelteKit combined PDF',
    'sveltekit-documentation.pdf'
  )
  .option(
    '--no-extract',
    'Skip link extraction step (use existing link files)',
    false
  )
  .action(async options => {
    try {
      // Step 1: Extract links if needed
      if (options.extract === false) {
        // Fixed condition: run extraction unless --no-extract is specified
        console.log('\n=== EXTRACTING DOCUMENTATION LINKS ===')
        console.log(
          'Running link extraction to get the latest documentation links...'
        )

        // Run extract-links.js using child_process
        const { execSync } = require('child_process')
        try {
          execSync('node extract-links.js', { stdio: 'inherit' })
        } catch (execError) {
          console.error(`Error extracting links: ${execError.message}`)
          console.log('Continuing with existing link files...')
        }
      } else {
        console.log('Skipping link extraction as requested (--no-extract)')
      }

      // Step 2: Generate Svelte documentation
      console.log('\n=== GENERATING SVELTE DOCUMENTATION ===')
      let svelteLinks
      try {
        svelteLinks = require('./svelte-links')
      } catch (error) {
        console.error(`Error loading svelte-links.js file: ${error.message}`)
        process.exit(1)
      }

      if (!Array.isArray(svelteLinks) || svelteLinks.length === 0) {
        console.error('No valid URLs found in svelte-links.js.')
        process.exit(1)
      }

      // Filter links based on options
      if (options.noLegacy) {
        const originalCount = svelteLinks.length
        svelteLinks = svelteLinks.filter(
          link => !link.toLowerCase().includes('legacy')
        )
        console.log(
          `Filtered out ${originalCount - svelteLinks.length} legacy links`
        )
      }

      if (options.noV4) {
        const originalCount = svelteLinks.length
        svelteLinks = svelteLinks.filter(
          link => !link.toLowerCase().includes('v4-migration-guide')
        )
        console.log(
          `Filtered out ${
            originalCount - svelteLinks.length
          } v4-migration-guide links`
        )
      }

      console.log(
        `Found ${svelteLinks.length} Svelte documentation URLs to process.`
      )
      console.log(
        'Using hardcoded selectors: parent="#docs-content", child=".text.content"'
      )

      // Create output directory for Svelte docs
      try {
        await fs.mkdir(options.svelteDir, { recursive: true })
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err
        }
      }

      // Keep track of all generated Svelte PDFs
      const generatedSveltePdfs = []

      // Process each Svelte URL
      for (let i = 0; i < svelteLinks.length; i++) {
        const url = svelteLinks[i]
        console.log(`[${i + 1}/${svelteLinks.length}] Converting ${url}`)

        try {
          const pdfBuffer = await convertWebpageToPdf(url)

          // Generate a safe filename from the URL
          try {
            const parsedUrl = new URL(url)
            let pageName = parsedUrl.pathname.split('/').pop()
            if (!pageName) pageName = 'index'

            const outputPath = path.join(options.svelteDir, `${pageName}.pdf`)
            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedSveltePdfs.push(outputPath)
          } catch (urlError) {
            // Fallback for malformed URLs
            const filename = url.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const outputPath = path.join(options.sveltedir, `${filename}.pdf`)
            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedSveltePdfs.push(outputPath)
          }
        } catch (error) {
          console.error(`  Error: ${error.message}`)
        }
      }

      console.log('Svelte documentation conversion complete.')

      // Create combined Svelte PDF if requested
      if (options.combine && generatedSveltePdfs.length > 0) {
        const combinedPdfPath = path.join(options.svelteDir, options.svelteName)
        const svelteStats = await mergePDFs(
          generatedSveltePdfs,
          combinedPdfPath
        )

        console.log('\nSvelte PDF Statistics:')
        console.log(`  Total number of files: ${svelteStats.totalFiles}`)
        console.log(`  Total number of pages: ${svelteStats.totalPages}`)
        console.log(
          `  File with most pages: ${svelteStats.fileWithMostPages} (${svelteStats.maxPages} pages)`
        )
        console.log(`  Combined PDF size: ${svelteStats.combinedSize}`)
      }

      // Step 3: Generate SvelteKit documentation
      console.log('\n=== GENERATING SVELTEKIT DOCUMENTATION ===')
      let svelteKitLinks
      try {
        svelteKitLinks = require('./sveltekit-links')
      } catch (error) {
        console.error(`Error loading sveltekit-links.js file: ${error.message}`)
        process.exit(1)
      }

      if (!Array.isArray(svelteKitLinks) || svelteKitLinks.length === 0) {
        console.error('No valid URLs found in sveltekit-links.js.')
        process.exit(1)
      }

      // Filter links based on options
      if (options.noMigration) {
        const originalCount = svelteKitLinks.length
        svelteKitLinks = svelteKitLinks.filter(
          link => !link.toLowerCase().includes('migrat')
        )
        console.log(
          `Filtered out ${
            originalCount - svelteKitLinks.length
          } migration guide links`
        )
      }

      console.log(
        `Found ${svelteKitLinks.length} SvelteKit documentation URLs to process.`
      )
      console.log(
        'Using hardcoded selectors: parent="#docs-content", child=".text.content"'
      )

      // Create output directory for SvelteKit docs
      try {
        await fs.mkdir(options.sveltekitDir, { recursive: true })
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err
        }
      }

      // Keep track of all generated SvelteKit PDFs
      const generatedSvelteKitPdfs = []

      // Process each SvelteKit URL
      for (let i = 0; i < svelteKitLinks.length; i++) {
        const url = svelteKitLinks[i]
        console.log(`[${i + 1}/${svelteKitLinks.length}] Converting ${url}`)

        try {
          const pdfBuffer = await convertWebpageToPdf(url)

          // Generate a safe filename from the URL
          try {
            const parsedUrl = new URL(url)
            let pageName = parsedUrl.pathname.split('/').pop()
            if (!pageName) pageName = 'index'

            const outputPath = path.join(
              options.sveltekitDir,
              `${pageName}.pdf`
            )
            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedSvelteKitPdfs.push(outputPath)
          } catch (urlError) {
            // Fallback for malformed URLs
            const filename = url.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            const outputPath = path.join(
              options.sveltekitDir,
              `${filename}.pdf`
            )
            await fs.writeFile(outputPath, pdfBuffer)
            console.log(`  Saved to ${outputPath}`)

            // Add to list of generated PDFs
            generatedSvelteKitPdfs.push(outputPath)
          }
        } catch (error) {
          console.error(`  Error: ${error.message}`)
        }
      }

      console.log('SvelteKit documentation conversion complete.')

      // Create combined SvelteKit PDF if requested
      if (options.combine && generatedSvelteKitPdfs.length > 0) {
        const combinedPdfPath = path.join(
          options.sveltekitDir,
          options.sveltekitName
        )
        const kitStats = await mergePDFs(
          generatedSvelteKitPdfs,
          combinedPdfPath
        )

        console.log('\nSvelteKit PDF Statistics:')
        console.log(`  Total number of files: ${kitStats.totalFiles}`)
        console.log(`  Total number of pages: ${kitStats.totalPages}`)
        console.log(
          `  File with most pages: ${kitStats.fileWithMostPages} (${kitStats.maxPages} pages)`
        )
        console.log(`  Combined PDF size: ${kitStats.combinedSize}`)
      }

      console.log('\n=== DOCUMENTATION GENERATION COMPLETE ===')
      console.log(
        `Svelte docs saved to: ${options.svelteDir}${
          options.combine ? ` (with combined PDF: ${options.svelteName})` : ''
        }`
      )
      console.log(
        `SvelteKit docs saved to: ${options.sveltekitDir}${
          options.combine
            ? ` (with combined PDF: ${options.sveltekitName})`
            : ''
        }`
      )
    } catch (error) {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    }
  })

// Parse command-line arguments
program.parse(process.argv)

// Display help if no command is provided
if (!process.argv.slice(2).length) {
  program.help()
}
