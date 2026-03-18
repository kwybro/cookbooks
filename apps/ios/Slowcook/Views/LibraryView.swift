import SwiftUI

struct LibraryView: View {
    @Environment(LibraryStore.self) private var store

    @State private var showScan = false
    @State private var showSettings = false
    @State private var showSearch = false

    private let columns = [GridItem(.adaptive(minimum: 160), spacing: 16)]

    var body: some View {
        NavigationStack {
            Group {
                if store.books.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(store.books) { book in
                                NavigationLink(destination: BookDetailView(bookId: book.id)) {
                                    BookCard(book: book)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Slowcook")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showScan = true } label: {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button { showSettings = true } label: {
                        Image(systemName: "gearshape")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showSearch = true } label: {
                        Image(systemName: "magnifyingglass")
                    }
                }
            }
            .sheet(isPresented: $showScan) {
                ScanFlowView()
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .sheet(isPresented: $showSearch) {
                SearchView()
            }
        }
    }

    private var emptyState: some View {
        ContentUnavailableView {
            Label("No Cookbooks Yet", systemImage: "books.vertical")
        } description: {
            Text("Tap + to scan a cookbook's cover and index pages.")
        } actions: {
            Button("Scan Your First Cookbook") { showScan = true }
                .buttonStyle(.borderedProminent)
        }
    }
}

struct BookCard: View {
    let book: Book

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            RoundedRectangle(cornerRadius: 8)
                .fill(.quaternary)
                .frame(height: 120)
                .overlay {
                    Image(systemName: "book.closed.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(book.title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)
                    .foregroundStyle(.primary)

                if let author = book.author {
                    Text(author)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                Text("\(book.recipeCount) recipe\(book.recipeCount == 1 ? "" : "s")")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }
}
