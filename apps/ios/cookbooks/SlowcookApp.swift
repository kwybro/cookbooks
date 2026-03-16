import SwiftUI
import SwiftData

@main
struct SlowcookApp: App {
    @State private var showSettings = false

    var body: some Scene {
        WindowGroup {
            LibraryView()
                .sheet(isPresented: $showSettings) {
                    SettingsView()
                }
                .onAppear {
                    if KeychainService.load(for: KeychainService.claudeAPIKeyKey) == nil {
                        showSettings = true
                    }
                }
        }
        .modelContainer(for: [Book.self, Recipe.self])
    }
}
