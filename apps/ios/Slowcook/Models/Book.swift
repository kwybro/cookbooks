import Foundation

struct Book: Identifiable {
    let id: String
    var title: String
    var author: String?
    let createdAt: Date
    var recipeCount: Int

    init(id: String = UUID().uuidString, title: String, author: String?, createdAt: Date = Date(), recipeCount: Int = 0) {
        self.id = id
        self.title = title
        self.author = author
        self.createdAt = createdAt
        self.recipeCount = recipeCount
    }
}
