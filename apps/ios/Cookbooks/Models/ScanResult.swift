import Foundation

struct ScanResult: Codable {
    let title: String
    let author: String?
    let recipes: [ExtractedRecipe]
}

struct ExtractedRecipe: Codable {
    let name: String
    let pageStart: Int?
    let pageEnd: Int?
}
