import XCTest
@testable import SecondLook

final class EngineTests: XCTestCase {
    struct Vector: Decodable { let id, kind, input, level: String }
    func testSharedVectors() throws {
        let bundle = Bundle(for: EngineTests.self)
        let engine = try SafetyEngine(bundle: bundle)
        let url = try XCTUnwrap(bundle.url(forResource: "vectors", withExtension: "json"))
        let vectors = try JSONDecoder().decode([Vector].self, from: Data(contentsOf: url))
        XCTAssertEqual(vectors.count, 30)
        for vector in vectors {
            let result: SafetyResult
            if vector.kind == "link" { result = try engine.checkLink(vector.input) } else { result = try engine.checkMessage(vector.input) }
            XCTAssertEqual(result.level, vector.level, "\(vector.id): \(vector.input)")
        }
    }
    func testInputBounds() throws {
        let engine = try SafetyEngine(bundle: Bundle(for: EngineTests.self))
        XCTAssertThrowsError(try engine.checkMessage(""))
        XCTAssertThrowsError(try engine.checkMessage(String(repeating: "a", count: 12001)))
        XCTAssertThrowsError(try engine.checkLink(String(repeating: "a", count: 4097)))
    }
    func testUserInfoAndNoSafetyGuarantee() throws {
        let engine = try SafetyEngine(bundle: Bundle(for: EngineTests.self))
        XCTAssertEqual(try engine.checkLink("https://paypal.com@wrong.example").hostname, "wrong.example")
        let result = try engine.checkLink("https://example.com")
        XCTAssertEqual(result.level, "unknown")
        XCTAssertTrue(result.explanation.contains("does not mean"))
    }
    func testPasswordGenerator() throws {
        for length in [12, 16, 20, 32, 40] { XCTAssertEqual(try NativePasswordMaker.generate(length: length).count, length) }
        XCTAssertNotEqual(try NativePasswordMaker.generate(), try NativePasswordMaker.generate())
        XCTAssertThrowsError(try NativePasswordMaker.generate(length: 1))
    }
    func testBracketsInURLs() throws {
        let engine = try SafetyEngine(bundle: Bundle(for: EngineTests.self))
        XCTAssertEqual(engine.extractLinks("Check https://[::1]"), ["https://[::1]"])
        XCTAssertEqual(engine.extractLinks("See https://example.com/wiki/Test_(example)."), ["https://example.com/wiki/Test_(example)"])
    }
}
