import SwiftUI
import UIKit
import Security
import UniformTypeIdentifiers

extension Color {
    private static func adaptive(_ light: (CGFloat,CGFloat,CGFloat),_ dark: (CGFloat,CGFloat,CGFloat)) -> Color {
        Color(UIColor { traits in let rgb = traits.userInterfaceStyle == .dark ? dark : light; return UIColor(red:rgb.0/255,green:rgb.1/255,blue:rgb.2/255,alpha:1) })
    }
    static var slPaper: Color { adaptive((234,240,252),(12,21,48)) }
    static var slForest: Color { adaptive((42,47,94),(224,233,255)) }
    static var slLime: Color { adaptive((222,218,251),(65,70,118)) }
    static var slMuted: Color { adaptive((88,101,134),(183,198,225)) }
    static var slCard: Color { adaptive((251,252,255),(25,41,73)) }
    static var slAccent: Color { adaptive((99,87,204),(173,194,255)) }
}

struct SLCard<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View { VStack(alignment: .leading, spacing: 14) { content }.frame(maxWidth: .infinity, alignment: .leading).padding(20).background(Color.slCard).clipShape(RoundedRectangle(cornerRadius: 18)).overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.slMuted.opacity(0.17))) }
}
struct SLHeader: View {
    let eyebrow: String
    let title: String
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 10) { Image(systemName: "eye").font(.title3).padding(9).background(Color.slLime).clipShape(RoundedRectangle(cornerRadius: 12)); Text("SecondLook.").font(.title2.bold()) }
            Text(eyebrow.uppercased()).font(.caption2.weight(.semibold)).tracking(1.1).foregroundStyle(Color.slMuted)
            Text(title).font(.system(.largeTitle, design: .rounded, weight: .bold)).tracking(-1)
        }.frame(maxWidth: .infinity, alignment: .leading).foregroundStyle(Color.slForest)
    }
}
struct CheckView: View {
    @State private var text: String
    @State private var isLink: Bool
    @State private var result: SafetyResult?
    @State private var error: String?
    private let autoCheck: Bool
    private let engine = try? SafetyEngine()
    init(initialText: String = "", autoCheck: Bool = false) {
        self.autoCheck = autoCheck
        _text = State(initialValue: initialText)
        let trimmed = initialText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        _isLink = State(initialValue: initialText.isEmpty || trimmed.hasPrefix("http://") || trimmed.hasPrefix("https://"))
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                SLHeader(eyebrow: "What you share. Only on this device.", title: "Take a second look.")
                SLCard {
                    Text("Remove private access links, passwords, PINs, and security codes first.").font(.subheadline).foregroundStyle(Color.slMuted)
                    Picker("Check type", selection: $isLink) { Text("Link").tag(true); Text("Message").tag(false) }.pickerStyle(.segmented)
                    Text("Link or message").font(.subheadline.bold())
                    TextEditor(text: $text).frame(minHeight: 150).scrollContentBackground(.hidden).padding(10).background(Color.slPaper).clipShape(RoundedRectangle(cornerRadius: 10)).autocorrectionDisabled().textInputAutocapitalization(.never).privacySensitive().accessibilityLabel("Text to check")
                    Text("\(text.utf16.count) / \(isLink ? 4096 : 12000) characters").font(.caption).foregroundStyle(Color.slMuted)
                    HStack { PasteButton(payloadType: String.self) { strings in text = strings.first ?? "" }.buttonBorderShape(.roundedRectangle); Spacer(); Button("Clear") { text = ""; result = nil; error = nil } }
                    Button(action: analyse) { Text(isLink ? "Inspect this link →" : "Check this message →").fontWeight(.semibold).frame(maxWidth: .infinity).padding(8) }.buttonStyle(.borderedProminent).tint(Color(red:0.39,green:0.35,blue:0.82)).foregroundStyle(Color.white)
                    if let error { Text(error).font(.subheadline).foregroundStyle(.red).accessibilityLabel("Error: " + error) }
                }
                if let result {
                    SLCard {
                        Text(result.label).font(.headline).foregroundStyle(result.level == "high" ? Color(red: 0.6, green: 0.23, blue: 0.13) : Color.slForest)
                        Text(result.explanation).foregroundStyle(Color.slMuted)
                        if !result.hostname.isEmpty { Text("PARSED HOSTNAME · NOT A CLICKABLE LINK").font(.caption2.bold()).foregroundStyle(Color.slMuted); Text(result.hostname).font(.system(.body, design: .monospaced)).textSelection(.enabled); if result.assumedHTTPS { Text("HTTPS was assumed for parsing, not tested.").font(.caption).foregroundStyle(Color.slMuted) } }
                        ForEach(result.signals) { signal in VStack(alignment: .leading, spacing: 7) { Text(signal.title).font(.subheadline.bold()); Text(signal.detail).font(.subheadline).foregroundStyle(Color.slMuted) }.padding(.top, 8) }
                        Divider()
                        Text("Your next safe step").font(.headline)
                        Text("Verify unexpected requests using an official app or a number you already trust. Do not click, pay, or share secrets until the request is confirmed.").font(.subheadline).foregroundStyle(Color.slMuted)
                    }.accessibilityElement(children: .contain)
                }
                Text("English-first patterns. No live reputation lookup, redirects, file scans, or website visits. Native and browser parsers can differ. No result guarantees safety.").font(.caption).foregroundStyle(Color.slMuted)
            }.padding(22)
        }.background(Color.slPaper).foregroundStyle(Color.slForest).tint(Color.slAccent)
        .onChange(of: text) { _ in result = nil; error = nil }
        .onChange(of: isLink) { _ in result = nil; error = nil }
        .onAppear { if autoCheck && !text.isEmpty { analyse() } }
    }
    private func analyse() {
        guard let engine else { error = "Offline rules could not be loaded. This build cannot check input."; return }
        do { if isLink { result = try engine.checkLink(text) } else { result = try engine.checkMessage(text) }; error = nil }
        catch { result = nil; self.error = error.localizedDescription }
    }
}
struct PlaybookView: View {
    private let engine = try? SafetyEngine()
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                SLHeader(eyebrow: "Practical steps. No blame.", title: "The next safe step.")
                ForEach(engine?.playbook ?? []) { guide in
                    SLCard { DisclosureGroup { VStack(alignment: .leading, spacing: 13) { Text(guide.intro).foregroundStyle(Color.slMuted); ForEach(Array(guide.steps.enumerated()), id: \.offset) { index, step in Text("\(index + 1). \(step)").foregroundStyle(Color.slMuted) } }.font(.subheadline).padding(.top, 10) } label: { Text(guide.label).font(.headline) } }
                }
                Text("Use support contacts you already trust. Recovery is not guaranteed. Be careful of anyone demanding an upfront fee to recover lost funds.").font(.caption).foregroundStyle(Color.slMuted)
            }.padding(22)
        }.background(Color.slPaper).foregroundStyle(Color.slForest).tint(Color.slAccent)
    }
}
enum NativePasswordMaker {
    static func generate(length: Int = 20) throws -> String {
        guard (12...40).contains(length) else { throw SafetyError.message("Choose 12–40 characters.") }
        let groups = ["abcdefghijkmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%^&*()-_=+[]{}:;,.?"]
        let alphabet = Array(groups.joined()); let ceiling = (256 / alphabet.count) * alphabet.count
        for _ in 0..<1000 {
            var output = ""
            while output.count < length {
                var byte: UInt8 = 0
                guard SecRandomCopyBytes(kSecRandomDefault, 1, &byte) == errSecSuccess else { throw SafetyError.message("Secure randomness is unavailable.") }
                if Int(byte) < ceiling { output.append(alphabet[Int(byte) % alphabet.count]) }
            }
            if groups.allSatisfy({ group in output.contains(where: { group.contains($0) }) }) { return output }
        }
        throw SafetyError.message("Could not generate a password. Please try again.")
    }
}
struct PasswordView: View {
    @State private var length = 20
    @State private var password = ""
    @State private var status = ""
    var body: some View {
        ScrollView { VStack(alignment: .leading, spacing: 20) {
            SLHeader(eyebrow: "One password. One account.", title: "Less guesswork.")
            SLCard {
                Text("Make a long, unique password and save it in a password manager. SecondLook does not keep a password history.").font(.subheadline).foregroundStyle(Color.slMuted)
                Text(password.isEmpty ? "Generate a password below" : password).font(.system(.title3, design: .monospaced)).textSelection(.enabled).privacySensitive().frame(maxWidth: .infinity, alignment: .leading).padding(16).background(Color.slLime.opacity(0.5)).clipShape(RoundedRectangle(cornerRadius: 12))
                Stepper("\(length) characters", value: $length, in: 12...40)
                Button("Generate another", action: generate).buttonStyle(.borderedProminent).tint(Color(red:0.39,green:0.35,blue:0.82)).foregroundStyle(Color.white)
                Button("Copy password") {
                    UIPasteboard.general.setItems([[UTType.utf8PlainText.identifier: password]], options: [.localOnly: true, .expirationDate: Date().addingTimeInterval(60)])
                    status = "Copied locally. The clipboard item is set to expire after one minute; other apps may read it before then."
                }.buttonStyle(.bordered).disabled(password.isEmpty)
                if !status.isEmpty { Text(status).font(.caption).foregroundStyle(Color.slMuted) }
            }
            Text("Generated using Apple’s secure random API with unbiased selection. No network, timers, or background password processing.").font(.caption).foregroundStyle(Color.slMuted)
        }.padding(22) }.background(Color.slPaper).foregroundStyle(Color.slForest).tint(Color.slAccent).onAppear { if password.isEmpty { generate() } }.onChange(of: length) { _ in generate() }
    }
    private func generate() { do { password = try NativePasswordMaker.generate(length: length); status = "" } catch { password = ""; status = error.localizedDescription } }
}
