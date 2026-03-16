import SwiftUI
import SwiftData

struct SearchView: View {
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Recipe.name) private var allRecipes: [Recipe]

    @State private var query = ""
    @State private var selectedBook: Book? = nil

    private var results: [Recipe] {
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else { return [] }
        return allRecipes.filter {
            $0.name.localizedCaseInsensitiveContains(query)
        }
    }

    var body: some View {
        NavigationStack {
            List {
                if query.trimmingCharacters(in: .whitespaces).isEmpty {
                    ContentUnavailableView(
                        "Search your library",
                        systemImage: "magnifyingglass",
                        description: Text("Type a recipe name, ingredient, or keyword.")
                    )
                } else if results.isEmpty {
                    ContentUnavailableView.search(text: query)
                } else {
                    ForEach(results) { recipe in
                        Button {
                            selectedBook = recipe.book
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(recipe.name)
                                    .foregroundStyle(.primary)
                                HStack {
                                    Text(recipe.book?.title ?? "Unknown Book")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                    if !recipe.pageDisplay.isEmpty {
                                        Text("·")
                                            .font(.caption)
                                            .foregroundStyle(.tertiary)
                                        Text(recipe.pageDisplay)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .listStyle(.plain)
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Recipe name…")
            .navigationTitle("Search")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .navigationDestination(item: $selectedBook) { book in
                BookDetailView(book: book)
            }
        }
    }
}
