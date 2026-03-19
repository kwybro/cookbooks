// This stub is compiled only when FoundationModels is unavailable (i.e. the
// CLI/SPM toolchain targeting iOS 18.2 SDK). It satisfies the type-checker so
// `swift build` can validate ScanFlowView without the real implementation.
//
// When building with Xcode against the iOS 26 SDK, FoundationModels IS
// importable, this entire file compiles to nothing, and the real
// AppleIntelligenceService (in AppleIntelligenceService.swift) is used instead.

#if !canImport(FoundationModels)
@available(iOS 26, *)
struct AppleIntelligenceService: ExtractionService {
    func extractBook(from rawText: String) async throws -> ScanResult {
        fatalError("FoundationModels is unavailable in this build configuration")
    }
}
#endif
