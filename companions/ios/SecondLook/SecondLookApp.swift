import SwiftUI

@main
struct SecondLookApp: App {
    var body: some Scene {
        WindowGroup {
            TabView {
                CompanionHome().tabItem { Label("Start", systemImage: "eye") }
                CheckView().tabItem { Label("Check", systemImage: "text.magnifyingglass") }
                PasswordView().tabItem { Label("Passwords", systemImage: "key") }
                PlaybookView().tabItem { Label("Playbook", systemImage: "book") }
            }.tint(Color.slForest).preferredColorScheme(.light)
        }
    }
}
struct CompanionHome: View {
    var body: some View {
        ScrollView { VStack(alignment: .leading, spacing: 20) {
            SLHeader(eyebrow: "iPhone companion · preview", title: "A safer next step.")
            SLCard {
                Label("On-demand checks. No message monitoring.", systemImage: "hand.raised").font(.headline)
                Text("iPhone apps cannot read notifications or private conversations from other apps. SecondLook only checks text or links you choose to share, plus supported Safari link clicks after you grant extension access.").foregroundStyle(Color.slMuted)
            }
            SLCard {
                Label("Share a message or link", systemImage: "square.and.arrow.up").font(.headline)
                Text("1. In an app that offers text or link sharing, tap Share.\n\n2. Choose ‘Check with SecondLook’. You may need to add it using More.\n\n3. Review the local warning signs before acting.").font(.subheadline).foregroundStyle(Color.slMuted)
                Text("Not every app exposes message text to the Share sheet. Screenshots, photos, attachments, and hidden content are not inspected.").font(.caption).foregroundStyle(Color.slMuted)
            }
            SLCard {
                Label("Enable Safari Link Guard", systemImage: "safari").font(.headline)
                Text("1. Open iPhone Settings → Apps → Safari → Extensions (or Settings → Safari on older versions).\n\n2. Enable SecondLook Link Guard and choose website permissions.\n\n3. In Safari’s extension controls, turn on Link Guard. Reload websites after changing permissions.").font(.subheadline).foregroundStyle(Color.slMuted)
                Text("Safari website permission is separate from the on/off switch. The guard cannot cover browser settings pages, every redirect or scripted navigation, or in-app browsers outside Safari. It does not show cross-app message warnings.").font(.caption).foregroundStyle(Color.slMuted)
            }
            SLCard {
                Label("Offline. On your terms.", systemImage: "lock").font(.headline)
                Text("Shared text, links, and passwords are not uploaded or stored as history. Native tools use no network requests. Safari saves only extension controls. Browser and operating-system behaviour are outside this app’s control.").font(.subheadline).foregroundStyle(Color.slMuted)
                Text("This is a preview build. No scam-detection accuracy, always-on protection, or physical-device battery result is claimed.").font(.caption).foregroundStyle(Color.slMuted)
            }
        }.padding(22) }.background(Color.slPaper).foregroundStyle(Color.slForest)
    }
}
