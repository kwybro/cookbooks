#if os(iOS)
import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var apiKey: String = ""
    @State private var saved = false

    private var existingKey: String? { KeychainService.load(for: KeychainService.claudeAPIKeyKey) }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    SecureField("sk-ant-…", text: $apiKey)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)

                    if let existing = existingKey {
                        let masked = "sk-ant-••••••••" + existing.suffix(4)
                        Text("Current: \(masked)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } header: {
                    Text("Claude API Key")
                } footer: {
                    Text("Your key is stored in the iOS Keychain and never leaves your device except in calls to api.anthropic.com.")
                }

                if existingKey != nil {
                    Section {
                        Button("Remove API Key", role: .destructive) {
                            KeychainService.delete(for: KeychainService.claudeAPIKeyKey)
                            apiKey = ""
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let trimmed = apiKey.trimmingCharacters(in: .whitespaces)
                        if !trimmed.isEmpty {
                            KeychainService.save(trimmed, for: KeychainService.claudeAPIKeyKey)
                        }
                        dismiss()
                    }
                    .disabled(apiKey.trimmingCharacters(in: .whitespaces).isEmpty && existingKey == nil)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
#endif
