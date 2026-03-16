import SwiftUI
import SwiftData

struct BookDetailView: View {
    @Bindable var book: Book

    @Environment(\.modelContext) private var modelContext

    @State private var showScanMore = false
    @State private var showDeleteConfirm = false
    @State private var isEditingTitle = false
    @State private var editTitle = ""
    @State private var editAuthor = ""

    @Environment(\.dismiss) private var dismiss

    private var sortedRecipes: [Recipe] {
        book.recipes.sorted {
            ($0.pageStart ?? Int.max) < ($1.pageStart ?? Int.max)
        }
    }

    var body: some View {
        List {
            if sortedRecipes.isEmpty {
                ContentUnavailableView(
                    "No recipes yet",
                    systemImage: "fork.knife",
                    description: Text("Scan the index pages to add recipes.")
                )
            } else {
                ForEach(sortedRecipes) { recipe in
                    HStack {
                        Text(recipe.name)
                        Spacer()
                        if !recipe.pageDisplay.isEmpty {
                            Text(recipe.pageDisplay)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .onDelete(perform: deleteRecipes)
            }
        }
        .navigationTitle(book.title)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button("Scan More Pages", systemImage: "plus") {
                        showScanMore = true
                    }
                    Button("Edit Book Info", systemImage: "pencil") {
                        editTitle = book.title
                        editAuthor = book.author ?? ""
                        isEditingTitle = true
                    }
                    Divider()
                    Button("Delete Book", systemImage: "trash", role: .destructive) {
                        showDeleteConfirm = true
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showScanMore) {
            ScanFlowView(appendingTo: book)
        }
        .sheet(isPresented: $isEditingTitle) {
            editBookSheet
        }
        .confirmationDialog(
            "Delete \"\(book.title)\"?",
            isPresented: $showDeleteConfirm,
            titleVisibility: .visible
        ) {
            Button("Delete Book", role: .destructive) {
                modelContext.delete(book)
                dismiss()
            }
        } message: {
            Text("This will permanently delete the book and all \(book.recipes.count) recipes.")
        }
    }

    private var editBookSheet: some View {
        NavigationStack {
            Form {
                Section("Book Details") {
                    TextField("Title", text: $editTitle)
                    TextField("Author", text: $editAuthor)
                }
            }
            .navigationTitle("Edit Book")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        book.title = editTitle.trimmingCharacters(in: .whitespaces)
                        let a = editAuthor.trimmingCharacters(in: .whitespaces)
                        book.author = a.isEmpty ? nil : a
                        isEditingTitle = false
                    }
                    .disabled(editTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isEditingTitle = false }
                }
            }
        }
    }

    private func deleteRecipes(at offsets: IndexSet) {
        for i in offsets {
            modelContext.delete(sortedRecipes[i])
        }
    }
}
