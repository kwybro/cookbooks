import Foundation

struct ClaudeService: ExtractionService {
    let apiKey: String
    let model: String = "claude-sonnet-4-6"

    func extractBook(from rawText: String) async throws -> ScanResult {
        let url = URL(string: "https://api.anthropic.com/v1/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")

        let body: [String: Any] = [
            "model": model,
            "max_tokens": 4096,
            "messages": [
                [
                    "role": "user",
                    "content": "\(extractionPrompt)\n\nRaw OCR text:\n\n\(rawText)",
                ]
            ],
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw ExtractionError.networkError("No HTTP response")
        }
        guard http.statusCode == 200 else {
            let body = String(data: data, encoding: .utf8) ?? "unknown error"
            throw ExtractionError.networkError("HTTP \(http.statusCode): \(body)")
        }

        struct ClaudeResponse: Decodable {
            struct Content: Decodable {
                let type: String
                let text: String?
            }
            let content: [Content]
        }

        let envelope = try JSONDecoder().decode(ClaudeResponse.self, from: data)
        guard let text = envelope.content.first(where: { $0.type == "text" })?.text else {
            throw ExtractionError.invalidResponse("No text block in Claude response")
        }

        // Strip markdown fences in case Claude wraps the JSON
        let cleaned = text
            .replacingOccurrences(of: #"^```(?:json)?\n?"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"\n?```$"#, with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard let jsonData = cleaned.data(using: .utf8) else {
            throw ExtractionError.parseError("Response could not be encoded as UTF-8")
        }

        do {
            return try JSONDecoder().decode(ScanResult.self, from: jsonData)
        } catch {
            throw ExtractionError.parseError(String(cleaned.prefix(200)))
        }
    }
}
