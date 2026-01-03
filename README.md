# Svelte Documentation PDF Generator

Convert Svelte and SvelteKit documentation into book-friendly PDF format with clean, readable content and combined manuals.

## Installation

```bash
npm install
```

## Quick personal usage notes

- Generate pdfs:

```bash
npm run svelte:core     # Svelte docs (no legacy/migrations)
npm run kit:core        # SvelteKit docs (no migrations)
npm run svelte          # Full Svelte docs
npm run kit             # Full SvelteKit docs
```

### Page numbers

- Can't easily add page numbers to combined PDFs due to Puppeteer limitations.
- Using https://tools.pdf24.org/en/add-page-numbers-to-pdf after generation

### Print notes

- Current config uses narrow margins. Pdfs are suitable for printing in booklet format
- Printing A5 booklets on A4 paper via Acrobat reader (free)
- See PrintSettings.png for recommended settings
- Select Booklet (brožura)
- **Don't forget to switch to A4 paper size in Acrobat print dialog!**
- Acrobat reader adds 2.5cm margins to each side automatically. There's no way to add margins to the A5 page, only the combined A4 sheet.

## CLI Commands

### Sample Generation

```bash
node index.js sample -c
```

Generates 2 sample pages (svelte-files, $state) for testing.

**Options:**

- `-c, --combine`: Create combined PDF
- `-o, --output-dir <dir>`: Output directory (default: 'sample-docs')
- `--combined-name <file>`: Combined PDF name (default: 'svelte-sample.pdf')

### Svelte Documentation

```bash
node index.js svelte -c
```

**Options:**

- `-c, --combine`: Create combined PDF
- `-o, --output-dir <dir>`: Output directory (default: 'svelte-docs')
- `--combined-name <file>`: Combined PDF name (default: 'svelte-documentation.pdf')
- `--no-legacy`: Exclude legacy content
- `--no-v4`: Exclude v4 migration guide
- `--no-migration`: Exclude all migration guides

### SvelteKit Documentation

```bash
node index.js sveltekit -c
```

**Options:**

- `-c, --combine`: Create combined PDF
- `-o, --output-dir <dir>`: Output directory (default: 'sveltekit-docs')
- `--combined-name <file>`: Combined PDF name (default: 'sveltekit-documentation.pdf')
- `--no-migration`: Exclude migration guides

### Both Docs (One Command)

```bash
node index.js docs
```

Extracts links and generates both Svelte and SvelteKit documentation.

**Options:**

- `-c, --combine`: Create combined PDFs (default: true)
- `--no-extract`: Skip link extraction, use existing files
- `--no-legacy`: Exclude Svelte legacy content
- `--no-v4`: Exclude Svelte v4 migration
- `--no-migration`: Exclude SvelteKit migrations
- `--svelte-dir <dir>`: Svelte output directory (default: 'svelte-docs')
- `--sveltekit-dir <dir>`: SvelteKit output directory (default: 'sveltekit-docs')
- `--svelte-name <file>`: Svelte PDF name (default: 'svelte-documentation.pdf')
- `--sveltekit-name <file>`: SvelteKit PDF name (default: 'sveltekit-documentation.pdf')

### Extract Links

```bash
node extract-links.js
```

Extracts documentation links from Svelte websites to `svelte-links.js` and `sveltekit-links.js`.

### General Conversion

```bash
node index.js convert <url> -o output.pdf          # Single URL
node index.js bulk urls.txt -o output-dir -c       # Multiple URLs from file
node index.js urls <url1> <url2> -o output-dir -c  # Multiple URLs from command
```

## Configuration

Edit `config.js` to customize PDF generation settings (passed to Puppeteer's `page.pdf()`):

- `format`: Paper size (A4, Letter, etc.)
- `landscape`: Orientation (true/false)
- `scale`: Content scaling (0.9 = 90%)
- `margin`: Page margins (top, right, bottom, left)
- `printBackground`: Include background graphics (true/false)

See [Puppeteer API docs](https://pptr.dev/api/puppeteer.pdfoptions) for all available options.
