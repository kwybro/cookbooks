import Foundation
import FoundationModels

// MARK: - Generable types (iOS 26+)
// Kept private to this file; mapped to the shared ScanResult/ExtractedRecipe
// models after generation so the rest of the app stays availability-agnostic.

@available(iOS 26, *)
@Generable
private struct GenerableRecipe {
    @Guide(description: "The name of the recipe exactly as printed in the index")
    var name: String
    @Guide(description: "The starting page number for this recipe, or null if not listed")
    var pageStart: Int?
    @Guide(description: "The ending page number for multi-page recipes (e.g. 145–147), or null for single-page entries")
    var pageEnd: Int?
}

@available(iOS 26, *)
@Generable
private struct GenerableScanResult {
    @Guide(description: "The cookbook title exactly as printed on the cover — do not use prior knowledge")
    var title: String
    @Guide(description: "The author name exactly as printed on the cover, or null if absent")
    var author: String?
    @Guide(description: "All recipes listed in the index that have at least one page number")
    var recipes: [GenerableRecipe]
}

// MARK: - System prompt

private let intelligenceSystemPrompt = """
You are extracting structured data from raw OCR text taken from a physical cookbook.

The text comes from two sources:
1. The cover page — book title and author
2. One or more index pages — a list of recipes with page numbers

Rules:
- Transcribe title and author EXACTLY as they appear — do not rely on prior knowledge
- Include ALL recipes that have a page number
- pageEnd is null for single-page recipes; use an integer for page ranges (e.g. "145-147")
- Ignore section headers, chapter titles, and entries without page numbers
- Include sub-recipes if they have their own page numbers
"""

// MARK: - Service

/// Extraction backend using the on-device FoundationModels framework.
///
/// Requires iOS 26+ and an Apple Intelligence-capable device
/// (iPhone 15 Pro / iPhone 16 or later, or M-series iPad/Mac).
///
/// When the task exceeds on-device capacity, Apple transparently
/// routes it to Private Cloud Compute (PCC) — the developer API
/// is the same either way.
@available(iOS 26, *)
struct AppleIntelligenceService: ExtractionService {
    func extractBook(from rawText: String) async throws -> ScanResult {
        let session = LanguageModelSession(instructions: intelligenceSystemPrompt)
        let response = try await session.respond(
            to: "Raw OCR text:\n\n\(rawText)",
            generating: GenerableScanResult.self
        )
        let generated = response.content
        return ScanResult(
            title: generated.title,
            author: generated.author,
            recipes: generated.recipes.map {
                ExtractedRecipe(name: $0.name, pageStart: $0.pageStart, pageEnd: $0.pageEnd)
            }
        )
    }
}
