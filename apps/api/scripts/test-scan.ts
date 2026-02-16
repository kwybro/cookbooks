/**
 * Test script for the /api/books/scan endpoint.
 *
 * Usage:
 *   bun run scripts/test-scan.ts <cover-image> <index-image-1> [index-image-2] ...
 *
 * Example:
 *   bun run scripts/test-scan.ts ~/photos/cover.jpg ~/photos/index-1.jpg ~/photos/index-2.jpg
 *
 * Requires the api worker to be running locally: `bun run dev`
 */

const API_URL = process.env.API_URL ?? 'http://localhost:8787';

const imagePathArgs = process.argv.slice(2);

if (imagePathArgs.length < 2) {
  console.error('Usage: bun run scripts/test-scan.ts <cover-image> <index-image-1> [index-image-2] ...');
  console.error('       First image should be the cover, remaining images are index pages.');
  process.exit(1);
}

const getMediaType = (path: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' => {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'jpg':
    case 'jpeg':
    default: return 'image/jpeg';
  }
};

console.log(`Reading ${imagePathArgs.length} image(s)...`);

const images = await Promise.all(
  imagePathArgs.map(async (filePath) => {
    const file = Bun.file(filePath);
    const exists = await file.exists();
    if (!exists) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mediaType = getMediaType(filePath);

    console.log(`  ${filePath} (${mediaType}, ${Math.round(buffer.byteLength / 1024)}KB)`);

    return { base64, mediaType };
  }),
);

console.log(`\nSending to ${API_URL}/api/books/scan ...`);
const startTime = Date.now();

const response = await fetch(`${API_URL}/api/books/scan`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ images }),
});

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

if (!response.ok) {
  const error = await response.text();
  console.error(`\nError (${response.status}): ${error}`);
  process.exit(1);
}

const result = await response.json();
console.log(`\nDone in ${elapsed}s!`);
console.log(JSON.stringify(result, null, 2));

// Now fetch the full book to show all extracted recipes
if (result.bookId) {
  console.log('\n--- Extracted Recipes ---');
  const bookResponse = await fetch(`${API_URL}/api/books/${result.bookId}`);
  const book = await bookResponse.json();

  console.log(`\n${book.title}${book.author ? ` by ${book.author}` : ''}`);
  console.log(`${book.recipes.length} recipes:\n`);

  for (const recipe of book.recipes) {
    const pages = recipe.pageEnd
      ? `pp. ${recipe.pageStart}-${recipe.pageEnd}`
      : `p. ${recipe.pageStart}`;
    console.log(`  ${recipe.name} — ${pages}`);
  }

  // Also test the CSV export
  console.log('\n--- CSV Export ---');
  const csvResponse = await fetch(`${API_URL}/api/export/${result.bookId}`);
  const csv = await csvResponse.text();
  console.log(csv);
}
