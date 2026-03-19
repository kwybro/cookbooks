#if os(iOS)
import SwiftUI

struct SearchView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(LibraryStore.self) private var store

    @State private var query = ""
    @State private var selectedBookId: String? = nil

    private var results: [Recipe] {
        store.searchRecipes(query: query)
    }

    var body: some View {
        NavigationStack {
            listContent
                .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Recipe name…")
        }
    }

    private var listContent: some View {
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
                        selectedBookId = recipe.bookId
                    } label: {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(recipe.name)
                                .foregroundStyle(.primary)
                            HStack {
                                Text(store.book(id: recipe.bookId)?.title ?? "Unknown Book")
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
        .navigationTitle("Search")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Done") { dismiss() }
            }
        }
        .navigationDestination(item: $selectedBookId) { bookId in
            BookDetailView(bookId: bookId)
        }
    }
}
#endif
