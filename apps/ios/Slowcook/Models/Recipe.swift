import Foundation
import SwiftData

@Model
final class Recipe {
    var id: String
    var name: String
    var pageStart: Int?
    var pageEnd: Int?
    var createdAt: Date

    var book: Book?

    init(id: String = UUID().uuidString, name: String, pageStart: Int?, pageEnd: Int?) {
        self.id = id
        self.name = name
        self.pageStart = pageStart
        self.pageEnd = pageEnd
        self.createdAt = Date()
    }

    var pageDisplay: String {
        if let start = pageStart, let end = pageEnd, end != start {
            return "pp. \(start)–\(end)"
        } else if let start = pageStart {
            return "p. \(start)"
        }
        return ""
    }
}
