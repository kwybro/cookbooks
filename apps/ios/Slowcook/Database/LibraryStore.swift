import Foundation
import Libsql

/// Central store for all library data backed by a local libSQL (SQLite) database.
///
/// Views observe `books` and `recipes` directly. All mutations go through this
/// store, which re-loads the affected data after each write so the UI stays
/// consistent.
///
/// Connection mode: local-only (`Database(path:)`). When the paid cloud sync
/// tier is added, swap to `Database(path:url:authToken:syncInterval:)` —
/// nothing else in the app needs to change.
@Observable
final class LibraryStore {

    // MARK: – Public state

    private(set) var books: [Book] = []
    /// All recipes, kept flat for efficient in-memory search.
    private(set) var recipes: [Recipe] = []

    // MARK: – Private

    private let conn: Connection

    // MARK: – Init

    init() throws {
        let path = Self.databasePath()
        let db = try Database(path: path)
        conn = try db.connect()
        try conn.execute("PRAGMA foreign_keys = ON")
        try applyMigrations()
        try loadAll()
    }

    // MARK: – Schema

    private static func databasePath() -> String {
        let appSupport = FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let dir = appSupport.appendingPathComponent("Slowcook", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("library.db").path
    }

    /// Applies any pending SQL migrations from the app bundle in filename order.
    ///
    /// Migration files live in `apps/ios/Slowcook/Migrations/` and are generated
    /// by `drizzle-kit` in `packages/data-ops`. Run `bun run sync` there to
    /// regenerate and copy them here whenever the schema changes.
    ///
    /// `PRAGMA user_version` tracks how many migrations have been applied so each
    /// file is executed exactly once, even across app updates.
    private func applyMigrations() throws {
        let applied = try currentSchemaVersion()
        let migrations = Self.bundledMigrations()

        for (index, sql) in migrations.enumerated() {
            guard index >= applied else { continue }

            // Each migration is atomic: if any statement fails the whole file
            // rolls back and user_version stays at its previous value, so the
            // next launch retries from a clean state rather than getting stuck
            // in a partially-applied migration.
            try conn.execute("BEGIN")
            do {
                // drizzle-kit separates statements with `--> statement-breakpoint`
                let statements = sql.components(separatedBy: "--> statement-breakpoint")
                for statement in statements {
                    let trimmed = statement.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !trimmed.isEmpty else { continue }
                    try conn.execute(trimmed)
                }

                // PRAGMA user_version cannot be parameterised — interpolation is safe
                // here because `index` is an Int from our own loop counter.
                try conn.execute("PRAGMA user_version = \(index + 1)")
                try conn.execute("COMMIT")
            } catch {
                try? conn.execute("ROLLBACK")
                throw error
            }
        }
    }

    private func currentSchemaVersion() throws -> Int {
        let rows = try conn.query("PRAGMA user_version")
        for row in rows {
            let version: Int64 = try row.get(0)
            return Int(version)
        }
        return 0
    }

    /// Returns the contents of all `*.sql` files in the app bundle, sorted by
    /// filename so migrations are applied in the order drizzle-kit numbered them.
    private static func bundledMigrations() -> [String] {
        let urls = Bundle.main.urls(forResourcesWithExtension: "sql", subdirectory: nil) ?? []
        return urls
            .sorted { $0.lastPathComponent < $1.lastPathComponent }
            .compactMap { try? String(contentsOf: $0, encoding: .utf8) }
    }

    // MARK: – Load

    private func loadAll() throws {
        try loadBooks()
        try loadRecipes()
    }

    private func loadBooks() throws {
        // COUNT via LEFT JOIN so books with no recipes still appear
        let rows = try conn.query("""
            SELECT b.id, b.title, b.author, b.created_at, COUNT(r.id) AS recipe_count
            FROM books b
            LEFT JOIN recipes r ON r.book_id = b.id
            GROUP BY b.id
            ORDER BY b.created_at DESC
        """)

        var result: [Book] = []
        for row in rows {
            let id: String      = try row.get(0)
            let title: String   = try row.get(1)
            let author: String? = row.isNull(2) ? nil : try row.get(2)
            let ts: Int64       = try row.get(3)
            let count: Int64    = try row.get(4)
            result.append(Book(
                id: id,
                title: title,
                author: author,
                createdAt: Date(timeIntervalSince1970: TimeInterval(ts)),
                recipeCount: Int(count)
            ))
        }
        books = result
    }

    private func loadRecipes() throws {
        let rows = try conn.query("""
            SELECT id, book_id, name, page_start, page_end, created_at
            FROM recipes
            ORDER BY name
        """)

        var result: [Recipe] = []
        for row in rows {
            let id: String      = try row.get(0)
            let bookId: String  = try row.get(1)
            let name: String    = try row.get(2)
            let pageStart: Int? = row.isNull(3) ? nil : Int(try row.get(3) as Int64)
            let pageEnd: Int?   = row.isNull(4) ? nil : Int(try row.get(4) as Int64)
            let ts: Int64       = try row.get(5)
            result.append(Recipe(
                id: id,
                bookId: bookId,
                name: name,
                pageStart: pageStart,
                pageEnd: pageEnd,
                createdAt: Date(timeIntervalSince1970: TimeInterval(ts))
            ))
        }
        recipes = result
    }

    // MARK: – Books

    @discardableResult
    func insertBook(title: String, author: String?) throws -> Book {
        let id  = UUID().uuidString
        let now = Int64(Date().timeIntervalSince1970)

        if let author {
            try conn.execute(
                "INSERT INTO books (id, title, author, created_at) VALUES (?, ?, ?, ?)",
                [Value.text(id), Value.text(title), Value.text(author), Value.integer(now)]
            )
        } else {
            try conn.execute(
                "INSERT INTO books (id, title, created_at) VALUES (?, ?, ?)",
                [Value.text(id), Value.text(title), Value.integer(now)]
            )
        }

        try loadBooks()
        return books.first { $0.id == id }!
    }

    func updateBook(id: String, title: String, author: String?) throws {
        if let author {
            try conn.execute(
                "UPDATE books SET title = ?, author = ? WHERE id = ?",
                [Value.text(title), Value.text(author), Value.text(id)]
            )
        } else {
            try conn.execute(
                "UPDATE books SET title = ?, author = NULL WHERE id = ?",
                [Value.text(title), Value.text(id)]
            )
        }
        try loadBooks()
    }

    func deleteBook(id: String) throws {
        try conn.execute("DELETE FROM books WHERE id = ?", [Value.text(id)])
        try loadAll()
    }

    // MARK: – Recipes

    func insertRecipes(_ extracted: [ExtractedRecipe], intoBookId bookId: String) throws {
        let now = Int64(Date().timeIntervalSince1970)
        for e in extracted {
            let id = UUID().uuidString
            switch (e.pageStart, e.pageEnd) {
            case let (start?, end?):
                try conn.execute(
                    "INSERT INTO recipes (id, book_id, name, page_start, page_end, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    [Value.text(id), Value.text(bookId), Value.text(e.name),
                     Value.integer(Int64(start)), Value.integer(Int64(end)), Value.integer(now)]
                )
            case let (start?, nil):
                try conn.execute(
                    "INSERT INTO recipes (id, book_id, name, page_start, created_at) VALUES (?, ?, ?, ?, ?)",
                    [Value.text(id), Value.text(bookId), Value.text(e.name),
                     Value.integer(Int64(start)), Value.integer(now)]
                )
            default:
                try conn.execute(
                    "INSERT INTO recipes (id, book_id, name, created_at) VALUES (?, ?, ?, ?)",
                    [Value.text(id), Value.text(bookId), Value.text(e.name), Value.integer(now)]
                )
            }
        }
        try loadAll()
    }

    func deleteRecipe(id: String) throws {
        try conn.execute("DELETE FROM recipes WHERE id = ?", [Value.text(id)])
        try loadAll()
    }

    // MARK: – Queries

    func book(id: String) -> Book? {
        books.first { $0.id == id }
    }

    func recipes(forBookId bookId: String) -> [Recipe] {
        recipes
            .filter { $0.bookId == bookId }
            .sorted { ($0.pageStart ?? Int.max) < ($1.pageStart ?? Int.max) }
    }

    func searchRecipes(query: String) -> [Recipe] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return [] }
        return recipes.filter { $0.name.localizedCaseInsensitiveContains(q) }
    }
}
