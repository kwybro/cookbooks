import Foundation
import SwiftData

@Model
final class Book {
    var id: String
    var title: String
    var author: String?
    var createdAt: Date

    @Relationship(deleteRule: .cascade) var recipes: [Recipe] = []

    init(id: String = UUID().uuidString, title: String, author: String?) {
        self.id = id
        self.title = title
        self.author = author
        self.createdAt = Date()
    }
}
