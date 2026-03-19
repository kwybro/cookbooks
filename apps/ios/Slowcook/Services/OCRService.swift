#if os(iOS)
import UIKit
import Vision

enum OCRService {
    /// Runs on-device text recognition on each image and returns all text
    /// concatenated with page-break markers so the LLM can reason about
    /// page boundaries.
    static func recognizeText(in images: [UIImage]) async throws -> String {
        var pageTexts: [String] = []
        for image in images {
            guard let cgImage = image.cgImage else { continue }
            let text = try await recognizePage(cgImage)
            pageTexts.append(text)
        }
        return pageTexts.joined(separator: "\n\n--- Page Break ---\n\n")
    }

    private static func recognizePage(_ cgImage: CGImage) async throws -> String {
        try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                let text = (request.results as? [VNRecognizedTextObservation] ?? [])
                    .compactMap { $0.topCandidates(1).first?.string }
                    .joined(separator: "\n")
                continuation.resume(returning: text)
            }
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
}
#endif
