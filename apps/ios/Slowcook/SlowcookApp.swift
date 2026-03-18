import SwiftUI

@main
struct SlowcookApp: App {
    @State private var store = try! LibraryStore()
    @State private var showSettings = false

    var body: some Scene {
        WindowGroup {
            LibraryView()
                .environment(store)
                .sheet(isPresented: $showSettings) {
                    SettingsView()
                }
                .onAppear {
                    if KeychainService.load(for: KeychainService.claudeAPIKeyKey) == nil {
                        showSettings = true
                    }
                }
        }
    }
}
