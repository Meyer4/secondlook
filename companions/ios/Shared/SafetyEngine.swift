import Foundation

struct SafetySignal: Identifiable {
    let id: String
    let severity: String
    let title: String
    let detail: String
}
struct SafetyResult {
    let kind: String
    var hostname = ""
    var assumedHTTPS = false
    var signals: [SafetySignal] = []
    var level: String {
        if signals.contains(where: { $0.severity == "high" }) || signals.filter({ $0.severity == "medium" }).count >= 3 { return "high" }
        return signals.isEmpty ? "unknown" : "caution"
    }
    var label: String { level == "high" ? "Strong warning signs" : level == "caution" ? "Worth a closer look" : "No common warning signs found" }
    var explanation: String {
        switch level {
        case "high": return "Pause before clicking, paying, or sharing details. Independently verify the request. These patterns are not proof of a scam."
        case "caution": return "Some details deserve a closer look, but can also appear in legitimate content. Verify the context using a trusted channel."
        default: return "The known patterns were not found. This does not mean the message or link is safe. Verify unexpected requests before acting."
        }
    }
}
struct SafetyGuide: Decodable, Identifiable { let id, label, title, intro: String; let steps: [String] }
private struct MessageRule: Decodable { let id, severity, pattern, title, detail: String; let skipNegated: Bool }
private struct SafetyBrand: Decodable { let name, token: String; let domains: [String] }
private struct RuleFile: Decodable { let messageRules: [MessageRule]; let shorteners: [String]; let brands: [SafetyBrand]; let playbook: [SafetyGuide] }
enum SafetyError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case .message(let value) = self { return value }; return nil }
}

/// Bounded, offline checks. This class makes no network requests and stores no input.
final class SafetyEngine {
    private let source: RuleFile
    private let compiled: [(MessageRule, NSRegularExpression)]
    var playbook: [SafetyGuide] { source.playbook }
    init(bundle: Bundle = .main) throws {
        guard let url = bundle.url(forResource: "rules", withExtension: "json") else { throw SafetyError.message("Offline rules were not found in this build.") }
        let decoded = try JSONDecoder().decode(RuleFile.self, from: Data(contentsOf: url))
        source = decoded
        compiled = try decoded.messageRules.map { ($0, try NSRegularExpression(pattern: $0.pattern, options: .caseInsensitive)) }
    }
    private func matches(_ pattern: String, _ text: String) -> Bool {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) else { return false }
        return regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)) != nil
    }
    private func belongs(_ host: String, _ domain: String) -> Bool { host == domain || host.hasSuffix("." + domain) }
    private func signal(_ id: String, _ severity: String, _ title: String, _ detail: String) -> SafetySignal { SafetySignal(id: id, severity: severity, title: title, detail: detail) }
    func checkMessage(_ input: String) throws -> SafetyResult {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { throw SafetyError.message("Share or paste a message first.") }
        guard text.utf16.count <= 12000 else { throw SafetyError.message("Keep the message under 12,000 characters.") }
        var result = SafetyResult(kind: "message")
        for (rule, regex) in compiled {
            for match in regex.matches(in: text, range: NSRange(text.startIndex..., in: text)) {
                let before = (text as NSString).substring(with: NSRange(location: max(0, match.range.location - 80), length: min(80, match.range.location)))
                if rule.skipNegated && matches(#"\b(?:never|do\s+not|don['’]t|should\s+not|shouldn['’]t|will\s+not|won['’]t|avoid)\b[^,;.!?\n]{0,65}$"#, before) { continue }
                result.signals.append(signal(rule.id, rule.severity, rule.title, rule.detail)); break
            }
        }
        if matches(#"[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]"#, text) { result.signals.append(signal("hidden-characters", "low", "Hidden formatting characters", "These characters can be legitimate, but can also disguise words or addresses.")) }
        let links = extractLinks(text)
        for (index, link) in links.prefix(10).enumerated() {
            if let inspected = try? checkLink(link) {
                result.signals += inspected.signals.map { signal("link-\(index)-" + $0.id, $0.severity, $0.title, $0.detail) }
            } else { result.signals.append(signal("uninspected-link", "medium", "A link could not be inspected", "Ask for the complete address or check it separately. This is not a safety verdict.")) }
        }
        if links.count > 10 { result.signals.append(signal("link-limit", "low", "Some links were not inspected", "Only the first 10 recognised links were checked. Inspect the others separately.")) }
        return result
    }
    func extractLinks(_ text: String) -> [String] {
        let pattern = #"(?:https?://|ftp://|javascript:|data:|file:///|www\.)[^\s<>"`]+|\b(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}(?:[/:?#][^\s<>"`]*)?"#
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) else { return [] }
        var links: [String] = []
        for match in regex.matches(in: text, range: NSRange(text.startIndex..., in: text)) {
            if match.range.location > 0 {
                let previous = (text as NSString).substring(with: NSRange(location: match.range.location - 1, length: 1))
                if matches(#"[@\w]"#, previous) { continue }
            }
            guard let range = Range(match.range, in: text) else { continue }
            var value = String(text[range])
            while let last = value.last, ",.!?;:'\"".contains(last) { value.removeLast() }
            for _ in 0..<8 {
                guard let close = value.last, let open = [Character(")"): Character("("), Character("]"): Character("["), Character("}"): Character("{")][close] else { break }
                if value.filter({ $0 == close }).count <= value.filter({ $0 == open }).count { break }
                value.removeLast()
            }
            if !value.isEmpty && !links.contains(value) { links.append(value) }
            if links.count > 10 { break }
        }
        return links
    }
    func checkLink(_ input: String) throws -> SafetyResult {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { throw SafetyError.message("Share or paste one link first.") }
        guard text.utf16.count <= 4096 else { throw SafetyError.message("Use a link shorter than 4,096 characters.") }
        guard !matches(#"\s"#, text) else { throw SafetyError.message("Use Message check for text containing spaces.") }
        let explicitScheme = matches(#"^[a-z][a-z\d+.-]*:"#, text) && !matches(#"^[^/:]+:\d+(?:[/?#]|$)"#, text)
        var result = SafetyResult(kind: "link"); result.assumedHTTPS = !explicitScheme
        let candidate = explicitScheme ? text : "https://" + text
        guard let components = URLComponents(string: candidate) else {
            result.signals.append(signal("nonstandard-url", "medium", "A nonstandard address", "The native parser cannot fully interpret this address. Check the original independently.")); return result
        }
        let scheme = (components.scheme ?? "").lowercased()
        if !["http", "https"].contains(scheme) {
            result.signals.append(signal("non-web-scheme", "high", "This is not a normal web link", "It may open another application or run an instruction. SecondLook will not open it.")); return result
        }
        guard var host = components.host?.lowercased(), !host.isEmpty else { throw SafetyError.message("The link needs a website hostname.") }
        if host.hasSuffix(".") { host.removeLast() }; result.hostname = host
        if scheme == "http" { result.signals.append(signal("unencrypted", "medium", "An unencrypted connection", "HTTP does not encrypt the connection. HTTPS is preferable, but is not proof of trustworthiness.")) }
        if !(components.user ?? "").isEmpty || !(components.password ?? "").isEmpty {
            result.signals.append(signal("userinfo", "high", "Text before @ can hide the destination", "Text before @ is user information, not the website. Verify the parsed hostname independently."))
        }
        if matches(#"^(?:0x[0-9a-f]+|\d+)(?:\.(?:0x[0-9a-f]+|\d+)){0,3}$"#, host) || host.contains(":") {
            result.signals.append(signal("ip-host", "medium", "A numeric address instead of a domain", "It may be legitimate, but makes the organisation harder to identify. Browser and native normalisation can differ."))
        }
        if host == "localhost" || host.hasSuffix(".localhost") || host.hasSuffix(".local") { result.signals.append(signal("local-host", "low", "A local-device address", "Use it only if you know which local service you intend to access.")) }
        if host.contains("xn--") || host.unicodeScalars.contains(where: { !$0.isASCII }) { result.signals.append(signal("international-domain", "low", "An internationalised domain name", "These domains are often legitimate, but lookalike letters can be misleading. Native and browser normalisation can differ.")) }
        if matches(#"[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]"#, text) { result.signals.append(signal("hidden-characters", "medium", "Invisible or directional characters", "Hidden characters can change how the address appears. Verify the destination independently.")) }
        if source.shorteners.contains(where: { belongs(host, $0) }) { result.signals.append(signal("shortener", "low", "The final destination is hidden", "This offline check cannot follow a shortener. Ask for the complete original address.")) }
        for brand in source.brands {
            if matches("(^|[.-])" + NSRegularExpression.escapedPattern(for: brand.token) + "([.-]|$)", host) && !brand.domains.contains(where: { belongs(host, $0) }) {
                result.signals.append(signal("brand-" + brand.token, "medium", "Brand wording outside a usual domain", "The address mentions \(brand.name), but is outside our small, non-exhaustive reference list. Open the service independently."))
            }
        }
        if matches(#"\.(?:exe|msi|apk|scr|bat|cmd|ps1|vbs|dmg|pkg)(?:$|/)"#, components.path) { result.signals.append(signal("download", "high", "A link that looks like a software download", "No file was downloaded or inspected. Only install software from independently trusted sources.")) }
        for item in components.queryItems ?? [] {
            if ["url", "redirect", "redirect_uri", "redirect_url", "next", "continue", "destination", "target"].contains(item.name), let value = item.value, let embedded = URLComponents(string: value)?.host, embedded.lowercased() != host {
                result.signals.append(signal("possible-redirect", "low", "Another website appears inside the link", "A parameter names another website. We cannot determine whether the server redirects there.")); break
            }
        }
        return result
    }
}
