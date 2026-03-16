import Foundation

protocol ExtractionService {
    func extractBook(from rawText: String) async throws -> ScanResult
}

enum ExtractionError: LocalizedError {
    case noAPIKey
    case networkError(String)
    case invalidResponse(String)
    case parseError(String)

    var errorDescription: String? {
        switch self {
        case .noAPIKey:
            return "No Claude API key configured. Add your key in Settings."
        case .networkError(let msg):
            return "Network error: \(msg)"
        case .invalidResponse(let msg):
            return "Invalid response from extraction service: \(msg)"
        case .parseError(let msg):
            return "Could not parse extraction result: \(msg)"
        }
    }
}

let extractionPrompt = """
You are extracting structured data from raw OCR text taken from a physical cookbook.

The text comes from two sources:
1. The cover page — book title and author
2. One or more index pages — a list of recipes with page numbers

Extract the following and return ONLY a JSON object. No markdown, no code fences.

{
  "title": "Book Title Exactly As Printed",
  "author": "Author Name or null",
  "recipes": [
    { "name": "Recipe Name", "pageStart": 123, "pageEnd": null },
    { "name": "Another Recipe", "pageStart": 145, "pageEnd": 147 }
  ]
}

Rules:
- Transcribe title and author EXACTLY as they appear — do not use prior knowledge
- Include ALL recipes that have a page number
- pageEnd is null for single-page recipes; an integer for page ranges (e.g. "145-147")
- Ignore section headers, chapter titles, and entries without page numbers
- Include sub-recipes if they have their own page numbers
"""
