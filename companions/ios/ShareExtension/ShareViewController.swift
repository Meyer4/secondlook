import UIKit
import SwiftUI
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(Color.slPaper)
        let loading = UILabel(); loading.text = "Reading only what you shared…"; loading.textAlignment = .center; loading.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(loading); NSLayoutConstraint.activate([loading.centerXAnchor.constraint(equalTo: view.centerXAnchor), loading.centerYAnchor.constraint(equalTo: view.centerYAnchor)])
        let items = extensionContext?.inputItems.compactMap { $0 as? NSExtensionItem } ?? []
        let providers = items.flatMap { $0.attachments ?? [] }
        if let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) {
            load(provider, type: UTType.url.identifier)
        } else if let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) }) {
            load(provider, type: UTType.plainText.identifier)
        } else { show(text: "", unsupported: true) }
    }
    private func load(_ provider: NSItemProvider, type: String) {
        provider.loadItem(forTypeIdentifier: type, options: nil) { [weak self] item, _ in
            let text: String
            if let url = item as? URL { text = url.absoluteString }
            else if let value = item as? String { text = value }
            else if let value = item as? NSAttributedString { text = value.string }
            else { text = "" }
            DispatchQueue.main.async { self?.show(text: text, unsupported: text.isEmpty) }
        }
    }
    private func show(text: String, unsupported: Bool) {
        view.subviews.forEach { $0.removeFromSuperview() }
        let host = UIHostingController(rootView: ShareScreen(text: text, unsupported: unsupported, close: { [weak self] in self?.extensionContext?.completeRequest(returningItems: []) }))
        addChild(host); host.view.translatesAutoresizingMaskIntoConstraints = false; view.addSubview(host.view)
        NSLayoutConstraint.activate([host.view.topAnchor.constraint(equalTo: view.topAnchor),host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)])
        host.didMove(toParent: self)
    }
}
private struct ShareScreen: View {
    let text: String
    let unsupported: Bool
    let close: () -> Void
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if unsupported { Text("This share did not include readable text or a link. Images and attachments are not scanned. You can paste text below.").font(.caption).foregroundStyle(Color.slMuted).padding() }
                CheckView(initialText: text, autoCheck: !unsupported)
            }.toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done", action: close) } }
        }.tint(Color.slForest).preferredColorScheme(.light)
    }
}
