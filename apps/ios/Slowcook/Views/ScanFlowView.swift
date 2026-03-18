import SwiftUI

struct ScanFlowView: View {
    /// When set, scan is in "append" mode — new recipes go into this book
    /// rather than creating a new one.
    var appendingTo: Book? = nil

    @Environment(LibraryStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var step: ScanStep = .cover
    @State private var coverImage: UIImage? = nil
    @State private var indexImages: [UIImage] = []
    @State private var showCamera = false
    @State private var processingTarget: ProcessingTarget = .cover

    // Processing state
    @State private var isProcessing = false
    @State private var processingStatus = "Running OCR…"
    @State private var processingError: String? = nil

    // Review state
    @State private var reviewTitle = ""
    @State private var reviewAuthor = ""
    @State private var reviewRecipes: [ExtractedRecipe] = []

    enum ScanStep { case cover, index, processing, review }
    enum ProcessingTarget { case cover, index }

    var body: some View {
        NavigationStack {
            Group {
                switch step {
                case .cover:
                    coverStep
                case .index:
                    indexStep
                case .processing:
                    processingStep
                case .review:
                    reviewStep
                }
            }
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .sheet(isPresented: $showCamera) {
            if processingTarget == .cover {
                CameraView(images: coverBinding, onDismiss: { showCamera = false })
            } else {
                CameraView(images: $indexImages, onDismiss: { showCamera = false })
            }
        }
    }

    // MARK: – Steps

    private var coverStep: some View {
        VStack(spacing: 24) {
            Spacer()
            if let img = coverImage {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFit()
                    .frame(maxHeight: 320)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .shadow(radius: 6)
            } else {
                placeholderBox(icon: "book.closed", label: "Photograph the cover")
            }
            Spacer()
            VStack(spacing: 12) {
                Button(coverImage == nil ? "Take Cover Photo" : "Retake Cover Photo") {
                    processingTarget = .cover
                    showCamera = true
                }
                .buttonStyle(.borderedProminent)

                if coverImage != nil {
                    Button("Next: Scan Index Pages") {
                        step = .index
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding(.bottom, 32)
        }
        .padding()
    }

    private var indexStep: some View {
        VStack(spacing: 16) {
            if indexImages.isEmpty {
                Spacer()
                placeholderBox(icon: "list.bullet.rectangle", label: "Photograph each index page")
                Spacer()
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(Array(indexImages.enumerated()), id: \.offset) { i, img in
                            ZStack(alignment: .topTrailing) {
                                Image(uiImage: img)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 100, height: 140)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                Button {
                                    indexImages.remove(at: i)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.white, .black)
                                        .padding(4)
                                }
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }

            VStack(spacing: 12) {
                Button("Add Index Page") {
                    processingTarget = .index
                    showCamera = true
                }
                .buttonStyle(.borderedProminent)

                if !indexImages.isEmpty {
                    Button("Process \(indexImages.count) Page\(indexImages.count == 1 ? "" : "s")") {
                        step = .processing
                        Task { await runExtraction() }
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding(.bottom, 32)
        }
        .padding(.top)
    }

    private var processingStep: some View {
        VStack(spacing: 24) {
            Spacer()
            if let error = processingError {
                Image(systemName: "exclamationmark.triangle")
                    .font(.system(size: 48))
                    .foregroundStyle(.orange)
                Text(error)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                Button("Try Again") {
                    processingError = nil
                    Task { await runExtraction() }
                }
                .buttonStyle(.borderedProminent)
            } else {
                ProgressView()
                    .scaleEffect(1.5)
                Text(processingStatus)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding()
    }

    private var reviewStep: some View {
        Form {
            Section("Book") {
                TextField("Title", text: $reviewTitle)
                TextField("Author", text: $reviewAuthor)
            }
            Section("\(reviewRecipes.count) Recipes Found") {
                ForEach(reviewRecipes, id: \.name) { recipe in
                    HStack {
                        Text(recipe.name)
                        Spacer()
                        Text(pageDisplay(recipe))
                            .foregroundStyle(.secondary)
                            .font(.caption)
                    }
                }
            }
            Section {
                Button("Save to Library") {
                    saveToLibrary()
                }
                .disabled(reviewTitle.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
    }

    // MARK: – Extraction

    private func runExtraction() async {
        processingError = nil
        isProcessing = true

        do {
            var images: [UIImage] = []
            if appendingTo == nil, let cover = coverImage { images.append(cover) }
            images.append(contentsOf: indexImages)

            processingStatus = "Running OCR on \(images.count) image\(images.count == 1 ? "" : "s")…"
            let rawText = try await OCRService.recognizeText(in: images)

            let result: ScanResult
            if #available(iOS 26, *) {
                processingStatus = "Extracting recipes with Apple Intelligence…"
                result = try await AppleIntelligenceService().extractBook(from: rawText)
            } else {
                processingStatus = "Extracting recipes with Claude…"
                guard let apiKey = KeychainService.load(for: KeychainService.claudeAPIKeyKey) else {
                    throw ExtractionError.noAPIKey
                }
                result = try await ClaudeService(apiKey: apiKey).extractBook(from: rawText)
            }

            reviewTitle = result.title
            reviewAuthor = result.author ?? ""
            reviewRecipes = result.recipes
            step = .review
        } catch {
            processingError = error.localizedDescription
        }

        isProcessing = false
    }

    // MARK: – Save

    private func saveToLibrary() {
        let title = reviewTitle.trimmingCharacters(in: .whitespaces)
        let author = reviewAuthor.trimmingCharacters(in: .whitespaces)

        do {
            if let existing = appendingTo {
                try store.insertRecipes(reviewRecipes, intoBookId: existing.id)
            } else {
                let book = try store.insertBook(title: title, author: author.isEmpty ? nil : author)
                try store.insertRecipes(reviewRecipes, intoBookId: book.id)
            }
        } catch {
            // In practice this only fails on a full disk; surface via processingError
            processingError = error.localizedDescription
            return
        }

        dismiss()
    }

    // MARK: – Helpers

    private var navigationTitle: String {
        switch step {
        case .cover: return "Cover Photo"
        case .index: return "Index Pages"
        case .processing: return "Processing…"
        case .review: return "Review"
        }
    }

    private var coverBinding: Binding<[UIImage]> {
        Binding(
            get: { coverImage.map { [$0] } ?? [] },
            set: { coverImage = $0.last }
        )
    }

    private func pageDisplay(_ recipe: ExtractedRecipe) -> String {
        if let start = recipe.pageStart, let end = recipe.pageEnd, end != start {
            return "pp. \(start)–\(end)"
        } else if let start = recipe.pageStart {
            return "p. \(start)"
        }
        return ""
    }

    private func placeholderBox(icon: String, label: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text(label)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 220)
        .background(.quaternary, in: RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal)
    }
}
