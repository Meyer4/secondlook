import SafariServices
import Foundation

final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        // Link checks stay in the extension's bundled JavaScript. No messages,
        // URLs, account data, or telemetry are sent to the containing app.
        let item = NSExtensionItem()
        item.userInfo = [SFExtensionMessageKey: ["status": "local-only", "version": "1.1.0"]]
        context.completeRequest(returningItems: [item])
    }
}
