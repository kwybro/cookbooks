import SwiftUI

@main
struct SlowcookApp: App {
    var body: some Scene {
        WindowGroup {
            #if os(iOS)
            IOSRootView()
            #else
            Text("Slowcook requires iOS")
            #endif
        }
    }
}

#if os(iOS)
private struct IOSRootView: View {
    @State private var store: LibraryStore?
    @State private var storeError: Error?
    @State private var showSettings = false

    var body: some View {
        Group {
            if let store {
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
            } else if let storeError {
                DatabaseErrorView(error: storeError)
            }
        }
        .task {
            do {
                store = try LibraryStore()
            } catch {
                storeError = error
            }
        }
    }
}
#endif
