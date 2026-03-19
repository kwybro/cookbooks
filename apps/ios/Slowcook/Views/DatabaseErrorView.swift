import SwiftUI

/// Shown when LibraryStore fails to open or migrate the local database.
/// Gives the user context and a way to file a report rather than a silent crash.
struct DatabaseErrorView: View {
    let error: Error

    var body: some View {
        ContentUnavailableView {
            Label("Unable to Open Library", systemImage: "externaldrive.badge.exclamationmark")
        } description: {
            Text("The local database could not be opened. Try restarting the app. If the problem persists, reinstalling will reset your library.")
                .multilineTextAlignment(.center)
            Text(error.localizedDescription)
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.top, 4)
        }
        .padding()
    }
}
