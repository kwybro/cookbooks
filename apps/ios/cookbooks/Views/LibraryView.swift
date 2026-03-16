import SwiftUI
import SwiftData

struct LibraryView: View {
    @Query(sort: \Book.createdAt, order: .reverse) private var books: [Book]

    @State private var showScan = false
    @State private var showSettings = false
    @State private var showSearch = false

    private let columns = [GridItem(.adaptive(minimum: 160), spacing: 16)]

    var body: some View {
        NavigationStack {
            Group {
                if books.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(books) { book in
                                NavigationLink(destination: BookDetailView(book: book)) {
                                    BookCard(book: book)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("My Cookbooks")
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
            Button("Scan a Cookbook") { showScan = true }
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

                Text("\(book.recipes.count) recipe\(book.recipes.count == 1 ? "" : "s")")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }
}
