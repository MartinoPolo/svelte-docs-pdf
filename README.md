# Svelte Documentation PDF Generator

A specialized tool for converting Svelte and SvelteKit documentation into book-friendly PDF format. The tool extracts clean, readable content from the documentation websites and generates both individual page PDFs and combined comprehensive manuals.

## Primary Features

- **Svelte & SvelteKit Documentation**: Generate complete PDF documentation for both Svelte and SvelteKit
- **Book-Friendly Format**: Clean output with proper headers, formatting and styling
- **Combined PDF Manuals**: Create comprehensive single-file references with statistics
- **Customizable Filters**: Exclude legacy content or migration guides as needed

## Installation

```bash
npm install
```

## Documentation Generation

### One-Step Documentation Generation

Generate both Svelte and SvelteKit documentation with a single command:

```bash
node index.js docs
```

This command will:

1. Extract the latest documentation links from the Svelte websites
2. Generate individual PDFs for all Svelte documentation pages
3. Generate individual PDFs for all SvelteKit documentation pages
4. Create combined PDFs for both documentation sets

Options:

- `-c, --combine`: Create combined PDFs (default: true)
- `--no-extract`: Skip link extraction step and use existing link files
- `--no-legacy`: Exclude Svelte legacy content
- `--no-v4`: Exclude Svelte v4 migration guide
- `--no-migration`: Exclude SvelteKit migration guides
- `--svelte-dir <directory>`: Custom output directory for Svelte docs (default: 'svelte-docs')
- `--sveltekit-dir <directory>`: Custom output directory for SvelteKit docs (default: 'sveltekit-docs')
- `--svelte-name <filename>`: Custom name for the Svelte combined PDF (default: 'svelte-documentation.pdf')
- `--sveltekit-name <filename>`: Custom name for the SvelteKit combined PDF (default: 'sveltekit-documentation.pdf')

### Generating Svelte Documentation

Generate the complete Svelte documentation as a combined PDF:

```bash
node index.js svelte -c
```

Options:

- `-c, --combine`: Create a combined PDF of all pages (recommended)
- `-o, --output-dir <directory>`: Custom output directory (default: 'svelte-docs')
- `--combined-name <filename>`: Custom name for the combined PDF (default: 'svelte-documentation.pdf')
- `--no-legacy`: Exclude legacy content
- `--no-v4`: Exclude v4 migration guide

### Generating SvelteKit Documentation

Generate the complete SvelteKit documentation as a combined PDF:

```bash
node index.js sveltekit -c
```

Options:

- `-c, --combine`: Create a combined PDF of all pages (recommended)
- `-o, --output-dir <directory>`: Custom output directory (default: 'sveltekit-docs')
- `--combined-name <filename>`: Custom name for the combined PDF (default: 'sveltekit-documentation.pdf')
- `--no-migration`: Exclude migration guides

### Refreshing Documentation Links

To update the links used for documentation generation:

```bash
node extract-links.js
```

This will:

- Connect to the Svelte and SvelteKit documentation websites
- Extract all current documentation page links
- Save them to `svelte-links.js` and `sveltekit-links.js`

## Usage Examples

1. Generate complete Svelte ecosystem documentation (recommended):

   ```bash
   node index.js docs --no-legacy
   ```

2. Generate modern Svelte documentation only:

   ```bash
   node index.js svelte -c --no-legacy
   ```

3. Generate comprehensive SvelteKit guide:

   ```bash
   node index.js sveltekit -c --combined-name sveltekit-guide.pdf
   ```

4. Generate both sets with different output directories:

   ```bash
   node index.js docs --svelte-dir svelte --sveltekit-dir kit
   ```

5. Generate both Svelte and SvelteKit documentation:
   ```bash
   node index.js svelte -c
   node index.js sveltekit -c
   ```

## PDF Statistics

When creating combined PDFs, the tool provides useful statistics including:

- Total number of pages
- Size of the combined PDF
- Files with the most content

## Configuration

### PDF Generation Options

The tool uses Puppeteer for PDF generation, with all configuration options managed through the `config.js` file. These settings control how your PDFs look and behave.

You can customize the following PDF properties:

```javascript
pdf: {
  format: 'A4',           // Paper size: A4, Letter, Legal, Tabloid, etc.
  landscape: false,       // Orientation: false=portrait, true=landscape
  scale: 0.7,             // Scaling factor (0.7 = 70% of original size)
  margin: {               // Page margins in cm or inches
    top: '1cm',
    right: '1cm',
    bottom: '1cm',
    left: '1cm'
  },
  printBackground: true,  // Whether to include background graphics/colors

  // Advanced options (commented out by default in config.js)
  // displayHeaderFooter: true,                // Show header and footer
  // headerTemplate: '<div>...</div>',         // Custom HTML for header
  // footerTemplate: '<div>...</div>',         // Custom HTML for footer
  // pageRanges: '1-5',                        // Specific pages to export
  // tagged: true,                             // Generate tagged (accessible) PDF
  // outline: true,                            // Include document outline
}
```

These options are passed directly to Puppeteer's `page.pdf()` method. The full documentation for all available options can be found in the [Puppeteer API documentation](https://pptr.dev/api/puppeteer.pdfoptions).

#### Header and Footer Templates

When using `displayHeaderFooter: true`, you can customize the header and footer with HTML templates. These templates can include special classes:

- `pageNumber` - Current page number
- `totalPages` - Total pages in the document
- `date` - Current date

Example:

```javascript
headerTemplate: '<div style="font-size: 10px; text-align: center;">Svelte Documentation</div>',
footerTemplate: '<div style="font-size: 10px; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
```

### Output Options

Control where generated PDFs are saved:

```javascript
output: {
  defaultFileName: 'output.pdf',      // Default name for single file output
  defaultDirectory: 'output'          // Default directory for bulk operations
}
```

## Additional Functionality

The tool also supports general webpage-to-PDF conversion:

### Converting Single URLs

```bash
node index.js convert https://example.com -o output.pdf
```

### Bulk URL Conversion

```bash
node index.js bulk urls.txt -o output-directory -c
```

### Processing Multiple URLs from Command Line

```bash
node index.js urls https://example.com https://another-example.com -c
```

## Requirements

- Node.js 14 or higher
- Internet connection to download web pages
