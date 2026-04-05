// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "AtlasContracts",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "AtlasContracts",
            targets: ["AtlasContracts"]
        )
    ],
    targets: [
        .target(
            name: "AtlasContracts",
            path: "Sources/AtlasContracts"
        ),
        .testTarget(
            name: "AtlasContractsTests",
            dependencies: ["AtlasContracts"],
            path: "Tests/AtlasContractsTests"
        )
    ]
)
