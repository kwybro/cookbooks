// swift-tools-version: 6.0
// This Package.swift exists alongside the Xcode project to give sourcekit-lsp
// (and `swift build`) a structured target to index. It is NOT used for device
// builds — Slowcook.xcodeproj handles those.
//
// Requires Xcode 26 / Swift 6.2+ as the active developer directory:
//   sudo xcode-select -s /Applications/Xcode.app   (or wherever Xcode 26 lives)
// This gives the CLI toolchain access to the iOS 26 and macOS 26 SDKs,
// which is where FoundationModels ships.

import PackageDescription

let package = Package(
    name: "Slowcook",
    platforms: [
        .iOS(.v26),
        .macOS(.v26),   // lets `swift build` on macOS resolve FoundationModels
    ],
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
            resources: [
                .copy("Assets.xcassets"),
                .copy("Migrations"),
            ]
        ),
    ]
)
