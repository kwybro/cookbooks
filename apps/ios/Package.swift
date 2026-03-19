// swift-tools-version: 5.9
// This Package.swift exists alongside the Xcode project to give sourcekit-lsp
// (and `swift build`) a structured target to index. It is NOT used for device
// builds — Slowcook.xcodeproj handles those.
//
// AppleIntelligenceService.swift is excluded because FoundationModels ships
// with the iOS 26 SDK (Xcode beta) but the CLI toolchain uses iOS 18.2.
// Xcode resolves it fine; `swift build` and the LSP check everything else.

import PackageDescription

let package = Package(
    name: "Slowcook",
    platforms: [.iOS(.v17)],
    dependencies: [
        .package(url: "https://github.com/tursodatabase/libsql-swift", from: "0.1.1"),
    ],
    targets: [
        .target(
            name: "Slowcook",
            dependencies: [
                .product(name: "Libsql", package: "libsql-swift"),
            ],
            path: "Slowcook",
            exclude: [
                "Services/AppleIntelligenceService.swift",
            ],
            resources: [
                .copy("Assets.xcassets"),
                .copy("Migrations"),
            ]
        ),
    ]
)
