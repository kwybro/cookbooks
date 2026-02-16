import Anthropic from '@anthropic-ai/sdk';

import type { ScanResultType } from '@cookbooks/schemas';

const EXTRACTION_PROMPT = `You are a precise OCR tool analyzing photographs of a cookbook's front cover and index pages. Your job is to transcribe exactly what you see — do NOT use prior knowledge about books or authors.

COVER IMAGE (first image):
- Read the title text EXACTLY as printed on the cover. Do not substitute a different title even if you recognize the author.
- Read the author name(s) EXACTLY as printed on the cover.
- The title or author may be written horizontally or vertically.
- If text is partially obscured, transcribe only what is clearly visible.

INDEX PAGE IMAGE(S) (remaining images):
Extract every recipe entry visible. For each recipe:
- name: The recipe name EXACTLY as printed (preserve capitalization, punctuation, spelling)
- pageStart: The page number (integer)
- pageEnd: The ending page number if a range is shown (integer), otherwise null

Rules:
- Transcribe what you SEE, not what you think the text should say
- Extract ALL recipes, even partially visible ones at page edges
- If a page range is shown (e.g. "145-147"), set pageStart=145, pageEnd=147
- If a single page number, set pageStart to that number, pageEnd=null
- Include sub-recipes and variations if they have their own page numbers
- Ignore section headers, chapter titles, and non-recipe entries (like "Introduction", "Acknowledgments")

Return your response as a JSON object with this exact structure:
{
  "title": "Book Title",
  "author": "Author Name",
  "recipes": [
    { "name": "Recipe Name", "pageStart": 123, "pageEnd": null },
    { "name": "Another Recipe", "pageStart": 145, "pageEnd": 147 }
  ]
}

Return ONLY the raw JSON object. Do NOT wrap it in markdown code fences or any other formatting.`;

export const extractCookbookData = async (
  apiKey: string,
  images: Array<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' }>,
): Promise<ScanResultType> => {
  const client = new Anthropic({ apiKey });

  const imageContent: Anthropic.ImageBlockParam[] = images.map((img) => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType,
      data: img.base64,
    },
  }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  if (response.stop_reason === 'max_tokens') {
    throw new Error('Claude response was truncated — the cookbook index may be too large for a single scan');
  }

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Strip markdown code fences if Claude wraps the response
  const raw = textBlock.text.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();

  try {
    const parsed: ScanResultType = JSON.parse(raw);
    return parsed;
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${raw.slice(0, 200)}`);
  }
};
