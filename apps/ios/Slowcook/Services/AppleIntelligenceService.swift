import Foundation

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
        // TODO: Implement with FoundationModels @Generable once the iOS 26
        // SDK stabilises. The @Generable macro will let us annotate ScanResult
        // and ExtractedRecipe directly, replacing manual JSON parsing entirely.
        //
        // Rough shape:
        //   let session = LanguageModelSession()
        //   let result = try await session.respond(
        //       to: "\(extractionPrompt)\n\nRaw OCR text:\n\n\(rawText)",
        //       generating: ScanResult.self
        //   )
        //   return result.content
        throw ExtractionError.invalidResponse("Apple Intelligence extraction is not yet implemented.")
    }
}
