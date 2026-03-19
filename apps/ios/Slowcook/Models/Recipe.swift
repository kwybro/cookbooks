import Foundation

struct Recipe: Identifiable {
    let id: String
    let bookId: String
    var name: String
    var pageStart: Int?
    var pageEnd: Int?
    let createdAt: Date

    init(id: String = UUID().uuidString, bookId: String, name: String, pageStart: Int?, pageEnd: Int?, createdAt: Date = Date()) {
        self.id = id
        self.bookId = bookId
        self.name = name
        self.pageStart = pageStart
        self.pageEnd = pageEnd
        self.createdAt = createdAt
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
