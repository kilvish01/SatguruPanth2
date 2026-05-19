//
// MacOSVisionOCR.swift
//
// CLI tool with two responsibilities:
//
//   1. PDF rasterization (PDFKit -> high-DPI PNG per page). Used for
//      downstream OCR by Tesseract, since Apple's Vision framework does
//      NOT support Devanagari script (verified on macOS 26.5 Tahoe — its
//      .accurate revision lists 30 languages, none Indic).
//
//   2. Vision-based OCR (--ocr flag, kept for non-Hindi PDFs in case we
//      ever need it). Default mode is now --render-only.
//
// Output: JSON to stdout (or a file via --output) with this shape:
//   {
//     "pdfPath": "<absolute path>",
//     "totalPages": <int>,
//     "renderedAt": "<ISO-8601>",
//     "pages": [
//       {
//         "pageNumber": 1,
//         "blocks": [
//           { "text": "...",
//             "bbox": { "x": 0..1, "y": 0..1, "width": 0..1, "height": 0..1 },
//             "confidence": 0..1 }
//         ]
//       }, ...
//     ]
//   }
//
// Bounding boxes are normalized [0,1] coords with origin BOTTOM-LEFT
// (Vision's convention). The Node consumer flips Y to top-left.
//
// Usage:
//   ./MacOSVisionOCR --pdf <path> [--output <path>] [--dpi <int>] \
//                    [--languages hi-IN,en-US] [--limit-pages <int>] \
//                    [--quiet]

import Foundation
import Vision
import PDFKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers
import AppKit

// MARK: - CLI args

enum Mode {
    case renderOnly   // write PNGs only (default; for downstream Tesseract OCR)
    case visionOcr    // run Vision text recognition + emit JSON (no Devanagari)
}

struct CLI {
    var mode: Mode = .renderOnly
    var pdfPath: String
    var outputPath: String?         // for --ocr: JSON file; for --render-only: ignored
    var renderDir: String?          // for --render-only: directory for PNGs
    var dpi: CGFloat = 300          // 300 DPI for Tesseract (printed Devanagari)
    var languages: [String] = ["en-US"]
    var limitPages: Int? = nil
    var quiet: Bool = false
}

func parseArgs() -> CLI? {
    var args = CommandLine.arguments.dropFirst().makeIterator()
    var cli = CLI(pdfPath: "")
    while let a = args.next() {
        switch a {
        case "--render-only":
            cli.mode = .renderOnly
        case "--ocr":
            cli.mode = .visionOcr
        case "--pdf":
            guard let v = args.next() else { return nil }
            cli.pdfPath = (v as NSString).expandingTildeInPath
        case "--output":
            guard let v = args.next() else { return nil }
            cli.outputPath = (v as NSString).expandingTildeInPath
        case "--render-dir":
            guard let v = args.next() else { return nil }
            cli.renderDir = (v as NSString).expandingTildeInPath
        case "--dpi":
            guard let v = args.next(), let n = Int(v) else { return nil }
            cli.dpi = CGFloat(n)
        case "--languages":
            guard let v = args.next() else { return nil }
            cli.languages = v.split(separator: ",").map { String($0) }
        case "--limit-pages":
            guard let v = args.next(), let n = Int(v) else { return nil }
            cli.limitPages = n
        case "--quiet":
            cli.quiet = true
        case "--help", "-h":
            return nil
        default:
            FileHandle.standardError.write("Unknown arg: \(a)\n".data(using: .utf8)!)
            return nil
        }
    }
    return cli.pdfPath.isEmpty ? nil : cli
}

func printUsage() {
    let s = """
    Usage:
      Render PDF pages to PNGs (default, for downstream Tesseract OCR):
        MacOSVisionOCR --pdf <path> --render-dir <dir>
                       [--dpi <int>] [--limit-pages <int>] [--quiet]

      Vision-based OCR (English-only languages; no Devanagari):
        MacOSVisionOCR --ocr --pdf <path> [--output <path>] [--dpi <int>]
                       [--languages en-US,…] [--limit-pages <int>] [--quiet]
    """
    print(s)
}

// MARK: - Page rendering

func renderPDFPage(_ page: PDFPage, dpi: CGFloat) -> CGImage? {
    let bounds = page.bounds(for: .mediaBox)
    let scale = dpi / 72.0   // PDF points are 72 per inch
    let pixelWidth = Int(bounds.width * scale)
    let pixelHeight = Int(bounds.height * scale)
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue

    guard let context = CGContext(
        data: nil,
        width: pixelWidth,
        height: pixelHeight,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: bitmapInfo
    ) else { return nil }

    context.setFillColor(CGColor.white)
    context.fill(CGRect(x: 0, y: 0, width: pixelWidth, height: pixelHeight))
    context.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: context)
    return context.makeImage()
}

// MARK: - OCR

struct OCRBlock: Codable {
    let text: String
    let bbox: BBox
    let confidence: Double
}

struct BBox: Codable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct OCRPage: Codable {
    let pageNumber: Int
    let blocks: [OCRBlock]
}

struct OCRResult: Codable {
    let pdfPath: String
    let totalPages: Int
    let renderedAt: String
    let pages: [OCRPage]
}

func recognizeText(in image: CGImage, languages: [String]) throws -> [OCRBlock] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = languages
    request.usesLanguageCorrection = true
    request.automaticallyDetectsLanguage = false

    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    try handler.perform([request])

    guard let observations = request.results else { return [] }

    var blocks: [OCRBlock] = []
    for obs in observations {
        guard let candidate = obs.topCandidates(1).first else { continue }
        let bb = obs.boundingBox  // already normalized 0..1, origin BOTTOM-LEFT
        blocks.append(OCRBlock(
            text: candidate.string,
            bbox: BBox(
                x: Double(bb.origin.x),
                y: Double(bb.origin.y),
                width: Double(bb.size.width),
                height: Double(bb.size.height)
            ),
            confidence: Double(candidate.confidence)
        ))
    }
    return blocks
}

// MARK: - Main

guard let cli = parseArgs() else {
    printUsage()
    exit(2)
}

let pdfURL = URL(fileURLWithPath: cli.pdfPath)
guard FileManager.default.fileExists(atPath: pdfURL.path) else {
    FileHandle.standardError.write("PDF not found: \(pdfURL.path)\n".data(using: .utf8)!)
    exit(3)
}

guard let pdf = PDFDocument(url: pdfURL) else {
    FileHandle.standardError.write("Could not open PDF\n".data(using: .utf8)!)
    exit(4)
}

let totalPages = pdf.pageCount
let lastPage = cli.limitPages.map { min($0, totalPages) } ?? totalPages

func log(_ msg: String) {
    if !cli.quiet {
        FileHandle.standardError.write((msg + "\n").data(using: .utf8)!)
    }
}

// Save a CGImage as PNG to disk.
func writePNG(_ image: CGImage, to path: String) throws {
    let url = URL(fileURLWithPath: path)
    guard let dest = CGImageDestinationCreateWithURL(
        url as CFURL, "public.png" as CFString, 1, nil
    ) else {
        throw NSError(domain: "PNG", code: 1, userInfo: [NSLocalizedDescriptionKey: "destination create failed"])
    }
    CGImageDestinationAddImage(dest, image, nil)
    if !CGImageDestinationFinalize(dest) {
        throw NSError(domain: "PNG", code: 2, userInfo: [NSLocalizedDescriptionKey: "finalize failed"])
    }
}

// Mode dispatch
switch cli.mode {

case .renderOnly:
    guard let renderDir = cli.renderDir else {
        FileHandle.standardError.write("--render-dir is required in render-only mode\n".data(using: .utf8)!)
        exit(2)
    }
    try FileManager.default.createDirectory(
        atPath: renderDir, withIntermediateDirectories: true, attributes: nil
    )
    log("[render] PDF: \(pdfURL.lastPathComponent) | pages: \(totalPages) | rendering first \(lastPage) | dpi: \(Int(cli.dpi)) | out: \(renderDir)")

    var rendered: [String] = []
    for i in 0..<lastPage {
        guard let page = pdf.page(at: i) else { continue }
        let pageNumber = i + 1
        guard let image = renderPDFPage(page, dpi: cli.dpi) else {
            FileHandle.standardError.write("page \(pageNumber): render failed\n".data(using: .utf8)!)
            continue
        }
        let name = String(format: "page-%04d.png", pageNumber)
        let outPath = (renderDir as NSString).appendingPathComponent(name)
        try writePNG(image, to: outPath)
        rendered.append(name)
        log("[render] page \(pageNumber)/\(lastPage) -> \(name)")
    }

    // Emit a small JSON manifest to stdout for easy programmatic consumption.
    let manifest: [String: Any] = [
        "pdfPath": pdfURL.path,
        "totalPages": totalPages,
        "renderedPages": rendered.count,
        "dpi": Int(cli.dpi),
        "renderDir": renderDir,
        "pages": rendered,
    ]
    let data = try JSONSerialization.data(
        withJSONObject: manifest, options: [.prettyPrinted, .sortedKeys]
    )
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write("\n".data(using: .utf8)!)

case .visionOcr:
    log("[vision-ocr] PDF: \(pdfURL.lastPathComponent) | pages: \(totalPages) | extracting first \(lastPage) | dpi: \(Int(cli.dpi))")
    var pageResults: [OCRPage] = []
    for i in 0..<lastPage {
        guard let page = pdf.page(at: i) else { continue }
        let pageNumber = i + 1
        guard let image = renderPDFPage(page, dpi: cli.dpi) else {
            FileHandle.standardError.write("Page \(pageNumber): render failed\n".data(using: .utf8)!)
            pageResults.append(OCRPage(pageNumber: pageNumber, blocks: []))
            continue
        }
        do {
            let blocks = try recognizeText(in: image, languages: cli.languages)
            pageResults.append(OCRPage(pageNumber: pageNumber, blocks: blocks))
            log("[vision-ocr] page \(pageNumber)/\(lastPage): \(blocks.count) blocks")
        } catch {
            FileHandle.standardError.write("Page \(pageNumber): OCR error \(error.localizedDescription)\n".data(using: .utf8)!)
            pageResults.append(OCRPage(pageNumber: pageNumber, blocks: []))
        }
    }

    let result = OCRResult(
        pdfPath: pdfURL.path,
        totalPages: totalPages,
        renderedAt: ISO8601DateFormatter().string(from: Date()),
        pages: pageResults
    )
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    let data = try encoder.encode(result)
    if let outPath = cli.outputPath {
        try data.write(to: URL(fileURLWithPath: outPath))
        log("[vision-ocr] wrote \(outPath)")
    } else {
        FileHandle.standardOutput.write(data)
    }
}
